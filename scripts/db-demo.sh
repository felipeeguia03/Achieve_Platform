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
q "delete from escalation_sink; delete from error_observation; delete from intervention_outcome; delete from intervention; delete from risk_signal;
   delete from protocol_step_completion; delete from protocol_artifact;
   delete from preparation_readiness; delete from exam_preparation; delete from assessment_criterion;
   delete from action_recommendation; delete from action_resource; delete from action;
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

echo "→ Modo Examen: la señal emitida, sin activar"
# `RECOMMENDED` y no `ACTIVE`: activar es del estudiante (`CTA-011`), y el spec
# es explícito —"la misma entrada produce siempre RECOMMENDED → CTA → ACTIVE"—.
# **Cuándo aparece la señal es `C01-024`, todavía abierto**: acá se siembra a
# mano justamente porque no hay regla que la dispare.
q "insert into exam_preparation (id,institution_id,assessment_id,student_id,course_enrollment_id)
   select 'af000000-0000-0000-0000-000000000001','$INST', a.id, '$EST', 'a6000000-0000-0000-0000-000000000001'
     from assessment a where a.offering_id='$OFF' and a.title='Parcial 1';" >/dev/null

# La preparación se crea fuera del producto porque `C01-024` todavía no tiene
# owner. Su plan inicial también se declara en el seed: no hay trigger oculto
# que invente una versión cuando aparece una fila.
q "insert into exam_preparation_plan_version
     (institution_id,exam_preparation_id,version_number,assessment_date,change_reason)
   select '$INST','af000000-0000-0000-0000-000000000001',1,a.assessment_date,'PLAN_INICIAL'
     from assessment a join exam_preparation p on p.assessment_id=a.id
    where p.id='af000000-0000-0000-0000-000000000001';" >/dev/null

echo "→ La pauta de la cátedra, cargada por el estudiante (ADR-029)"
# Entra `student`/`unverified` y **no se eleva** (`I9`): la superficie la muestra
# como lo que el estudiante cargó, nunca como criterio oficial de la cátedra.
q "insert into assessment_criterion (institution_id,assessment_id,criterion_text,sequence,source_type)
   select '$INST', a.id, c.txt, c.n, 'student'
     from assessment a,
          (values ('Procedimiento completo y justificado',1),
                  ('Elección del método',2),
                  ('Resolver variaciones del ejercicio',3)) as c(txt,n)
    where a.offering_id='$OFF' and a.title='Parcial 1';" >/dev/null

echo "→ Dos errores del mismo tipo, ya corroborados (ADR-036 · ADR-037)"
# El umbral que cuenta estos errores es el de la psicopedagoga desde la B6.7.2
# (`HP0-06-1 v3.0-psicopedagogia`). ⚠️ **Sigue sin autorizar datos reales.**
#
# **La señal ya NO se siembra a mano.** Hasta la B6.5 se insertaba una fila de
# `risk_signal` directamente, porque no había motor que la produjera. Ahora lo
# hay, y sembrar el resultado sería mostrar un circuito que no corrió.
#
# Lo que se siembra son **los hechos**: dos entregas evaluadas y sus dos errores
# del mismo tipo. El mundo queda en el estado más interesante para mirar — **a
# una aparición de que el sistema llame a una persona**.
PREP=af000000-0000-0000-0000-000000000001
TIPO=$(q "select id from error_type where canonical_id='procedimiento' and is_current;" | tr -d '[:space:]')

# ── El objetivo de aprendizaje, declarado (ADR-037 · 9.1, B6.7.2) ────────────
#
# **Sin esto el circuito ya no escala, y está bien.** Desde la B6.7.2 dos errores
# del mismo tipo sólo son comparables si coinciden en el objetivo de aprendizaje
# o demanda: *"dos errores procedimentales en contenidos no comparables no
# necesariamente expresan la misma dificultad"*.
#
# Se declara **uno solo**, con provenance `student` y `unverified` como todo lo
# que carga un estudiante. `learning_objective` está vacía en el schema a
# propósito: la comparabilidad se declara, nunca se infiere.
q "insert into learning_objective (id,institution_id,course_id,kind,label,source_type,source_ref)
   select 'af100000-0000-0000-0000-000000000001','$INST', c.course_id,
          'objetivo_de_aprendizaje',
          'Aplicar integración por partes verificando la condición de integrabilidad',
          'student','demo sintética'
     from course_offering c where c.id='$OFF'
   on conflict do nothing;" >/dev/null
OBJ=af100000-0000-0000-0000-000000000001

for n in 1 2; do
  q "insert into action (id,institution_id,course_enrollment_id,exam_preparation_id,objective,verb,scope,status)
     values ('ae00000$n-0000-0000-0000-000000000001','$INST','a6000000-0000-0000-0000-000000000001','$PREP',
             'Resolver la guía de integrales por partes','resolver','tema','COMPLETED');
     insert into evidence (id,institution_id,action_id,lifecycle_state,submitted_at)
     values ('ad00000$n-0000-0000-0000-000000000001','$INST','ae00000$n-0000-0000-0000-000000000001','INSUFFICIENT',now());" >/dev/null
  # Por la función, no por un `INSERT`: es la que exige que la evidencia esté
  # evaluada. Un error "visto" en una entrega que nadie miró no cuenta.
  #
  # Y con lo que `9.6` pide guardar: la entrega es **insuficiente** y aun así
  # cuenta, porque el error **es identificable**. Excluirla *"sesgaría la
  # detección contra quienes más necesitan acompañamiento"*.
  q "select public.registrar_observacion_de_error(
       '$INST','$PREP','$TIPO','error',true,'ad00000$n-0000-0000-0000-000000000001',
       null,null,'Aplicó la regla sin verificar la condición de integrabilidad.',null,'demo-obs-$n',
       null,'$OBJ','suficiente_para_identificar_error',true,'alta',
       'guía de ejercicios',null);" >/dev/null
done

echo "   dos apariciones comparables · la próxima llama a una persona"

echo
echo "→ Para cerrar el circuito, con el server levantado:"
echo "   curl -s -X POST http://localhost:3000/api/observacion \\"
echo "     -H \"Authorization: Bearer \$RELOJ_SHARED_SECRET\" -H 'Content-Type: application/json' \\"
echo "     -d '{\"institucionId\":\"$INST\",\"preparacionId\":\"$PREP\",\"tipoDeErrorId\":\"$TIPO\",\"corroborada\":true,\"evidenciaId\":\"ad000001-0000-0000-0000-000000000001\",\"trasAccionId\":\"ae000001-0000-0000-0000-000000000001\",\"objetivoId\":\"$OBJ\",\"calidadDeEvidencia\":\"suficiente_para_identificar_error\",\"errorIdentificable\":true,\"confianzaDeClasificacion\":\"alta\",\"claveDeIdempotencia\":\"demo-obs-3\"}'"
echo "   → la tercera aparición produce la señal, y /hoy pasa a \"Necesita recuperación\""
echo
echo "✓ Mundo listo. Cursada: a6000000-0000-0000-0000-000000000001"
q "select '   ' || (select count(*) from topic where offering_id='$OFF') || ' unidades · ' ||
          (select count(*) from assessment where offering_id='$OFF') || ' evaluaciones · ' ||
          (select count(*) from resource where offering_id='$OFF') || ' recursos';"
