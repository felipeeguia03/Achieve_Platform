#!/usr/bin/env bash
# Achieve Platform · seed de demo — datos SINTÉTICOS (ADR-024).
#
# Carga una materia por el ingestor del ADL y deja el mundo listo para ver el
# loop completo. Ninguna persona real, ningún dato real.
set -uo pipefail
C="supabase_db_achieve-platform"
docker exec "$C" true 2>/dev/null || { echo "✗ stack apagado: npm run db:start"; exit 1; }
q() { docker exec -i "$C" psql -U postgres -d postgres -tAX -c "$1" 2>&1; }

INST=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
EST=a5000000-0000-0000-0000-000000000001

echo "→ Limpiando"
q "delete from action_recommendation; delete from action_resource; delete from action;
   delete from topic_progress; delete from course_enrollment; delete from availability;
   delete from student; delete from resource; delete from assessment; delete from topic_prerequisite;
   delete from topic; delete from course_offering; delete from course; delete from curriculum_plan;
   delete from academic_program; delete from institution_crm_ref; delete from institution;" >/dev/null

echo "→ Institución y estudiante sintéticos"
q "insert into institution (id,name) values ('$INST','Universidad SYN');
   insert into student (id,institution_id,timezone) values ('$EST','$INST','America/Argentina/Cordoba');
   insert into availability (student_id,day_of_week,capacity_min,source) values ('$EST',1,45,'declared');" >/dev/null

echo "→ Ingiriendo la materia (ADL, fuente declarada, todo unverified)"
U='[{"codigo":"U1","nombre":"Límites y continuidad","orden":1},
    {"codigo":"U2","nombre":"Derivadas","orden":2},
    {"codigo":"U3","nombre":"Integrales","orden":3},
    {"codigo":"U4","nombre":"Series","orden":4}]'
P='[{"unidad":"Derivadas","requiere":"Límites y continuidad"},
    {"unidad":"Integrales","requiere":"Derivadas"}]'
E='[{"tipo":"parcial","titulo":"Parcial 1","fecha":"2026-09-15","modalidad":"practico","alcance":"U1 a U2"},
    {"tipo":"final","titulo":"Final","modalidad":"oral"}]'
OFF=$(q "select cursada_id from public.ingerir_materia('$INST','public_web','https://syn.example/programa-analisis-2.pdf',now(),0.7,'MAT-201','Análisis Matemático II','2026-2','A','$U'::jsonb,'$P'::jsonb,'$E'::jsonb);" | tr -d '[:space:]')
echo "   cursada: $OFF"

q "insert into course_enrollment (id,institution_id,student_id,offering_id)
   values ('a6000000-0000-0000-0000-000000000001','$INST','$EST','$OFF');" >/dev/null

echo "→ Material por unidad (sin recurso no hay acción ejecutable)"
q "insert into resource (offering_id,topic_id,resource_type,title,source_type,rights_status)
   select '$OFF', t.id, 'apunte', 'Guía de ' || t.name, 'instructor', 'unknown'
     from topic t where t.offering_id='$OFF';" >/dev/null

echo '→ Alcance del Parcial 1: U1 y U2 (declarado, no inferido de scope)'
q "insert into assessment_topic (assessment_id, topic_id)
   select a.id, t.id from assessment a, topic t
    where a.offering_id='$OFF' and a.title='Parcial 1'
      and t.offering_id='$OFF' and t.name in ('Límites y continuidad','Derivadas');" >/dev/null

echo "→ Progreso: U1 trabajada, el resto sin información (NO cero)"
q "insert into topic_progress (institution_id,course_enrollment_id,topic_id,practice_state,practice_value,recency_at)
   select '$INST','a6000000-0000-0000-0000-000000000001', t.id, 'value', 6, now() - interval '3 days'
     from topic t where t.offering_id='$OFF' and t.name='Límites y continuidad';" >/dev/null

echo
echo "✓ Mundo listo. Cursada: a6000000-0000-0000-0000-000000000001"
q "select '   ' || (select count(*) from topic where offering_id='$OFF') || ' unidades · ' ||
          (select count(*) from assessment where offering_id='$OFF') || ' evaluaciones · ' ||
          (select count(*) from resource where offering_id='$OFF') || ' recursos';"
