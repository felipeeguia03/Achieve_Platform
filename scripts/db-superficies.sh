#!/usr/bin/env bash
# Achieve Platform · Etapa B2.6 — las funciones de lectura, contra Postgres.
#
# `npm test` prueba las **proyecciones** con dobles: qué dice la pantalla dado
# un estado. Acá se prueba lo otro, que ninguna suite sin Docker puede probar:
# que las cinco funciones de lectura devuelven ese estado, y que el aislamiento
# por institución las alcanza a ellas también.
#
# Cada superficie de la B2.6 lee con UNA función, por el mismo motivo que
# `estado_del_dia`: varias lecturas dan una foto inconsistente entre sí.
#
# `estado_de_progreso` trae además los constraints de `progress_entry`: `I10` y
# el vocabulario de dimensiones sólo se pueden probar contra Postgres, y son la
# diferencia entre "no cambió" y "todavía no llegó".
set -uo pipefail
CONTENEDOR="supabase_db_achieve-platform"
docker exec "$CONTENEDOR" true 2>/dev/null || { echo "✗ stack apagado: npm run db:start"; exit 1; }

q() { docker exec -i "$CONTENEDOR" psql -U postgres -d postgres -tAX -c "$1" 2>&1; }
fallos=0

# igual <descripción> <obtenido> <esperado>
igual() {
  local desc="$1" got="$(echo "$2" | tr -d '[:space:]')" want="$3"
  if [ "$got" = "$want" ]; then echo "   ✓ $desc"
  else echo "   ✗ $desc — esperaba '$want', obtuvo '$got'"; fallos=$((fallos + 1)); fi
}

INS=b1111111-0000-0000-0000-000000000001
OTRA=b1111111-0000-0000-0000-000000000002
EST=b2222222-0000-0000-0000-000000000001
CE=b3333333-0000-0000-0000-000000000001

limpiar() {
  q "delete from progress_entry where institution_id in ('$INS','$OTRA');
     delete from product_event where institution_id in ('$INS','$OTRA');
     delete from evidence_content where evidence_id in (select id from evidence where institution_id in ('$INS','$OTRA'));
     delete from evidence where institution_id in ('$INS','$OTRA');
     delete from commitment where institution_id in ('$INS','$OTRA');
     delete from action_recommendation where action_id in (select id from action where institution_id in ('$INS','$OTRA'));
     delete from action where institution_id in ('$INS','$OTRA');
     delete from topic_progress where institution_id in ('$INS','$OTRA');
     delete from course_enrollment where institution_id in ('$INS','$OTRA');
     delete from student where institution_id in ('$INS','$OTRA');
     delete from topic where offering_id in (select id from course_offering where course_id in (select id from course where curriculum_plan_id in (select id from curriculum_plan where program_id in (select id from academic_program where institution_id in ('$INS','$OTRA')))));
     delete from assessment where offering_id in (select id from course_offering where course_id in (select id from course where curriculum_plan_id in (select id from curriculum_plan where program_id in (select id from academic_program where institution_id in ('$INS','$OTRA')))));
     delete from course_offering where course_id in (select id from course where curriculum_plan_id in (select id from curriculum_plan where program_id in (select id from academic_program where institution_id in ('$INS','$OTRA'))));
     delete from course where curriculum_plan_id in (select id from curriculum_plan where program_id in (select id from academic_program where institution_id in ('$INS','$OTRA')));
     delete from curriculum_plan where program_id in (select id from academic_program where institution_id in ('$INS','$OTRA'));
     delete from academic_program where institution_id in ('$INS','$OTRA');
     delete from institution where id in ('$INS','$OTRA');" >/dev/null 2>&1
}
trap limpiar EXIT
limpiar

echo "→ Sembrando un mundo sintético"
q "
  insert into institution (id,name) values ('$INS','Sintética'),('$OTRA','Sintética Vecina');
  insert into academic_program (id,institution_id,name) values ('b4000000-0000-0000-0000-000000000001','$INS','Ing');
  insert into curriculum_plan (id,program_id,version) values ('b5000000-0000-0000-0000-000000000001','b4000000-0000-0000-0000-000000000001','2026');
  insert into course (id,curriculum_plan_id,code,name) values ('b6000000-0000-0000-0000-000000000001','b5000000-0000-0000-0000-000000000001','AM2','Análisis II');
  insert into course_offering (id,course_id,term) values
    ('b7000000-0000-0000-0000-000000000001','b6000000-0000-0000-0000-000000000001','2026-2'),
    ('b7000000-0000-0000-0000-000000000002','b6000000-0000-0000-0000-000000000001','2027-1');
  insert into topic (id,offering_id,code,name,sequence) values
    ('b8000000-0000-0000-0000-000000000001','b7000000-0000-0000-0000-000000000001','U1','Límites',1),
    ('b8000000-0000-0000-0000-000000000002','b7000000-0000-0000-0000-000000000001','U2','Series',2);
  insert into assessment (id,offering_id,assessment_type,title,modality,source_type)
    values ('b9000000-0000-0000-0000-000000000001','b7000000-0000-0000-0000-000000000001','parcial','Parcial 1','practico','institution');
  insert into student (id,institution_id) values ('$EST','$INS');
  insert into course_enrollment (id,institution_id,student_id,offering_id) values
    ('$CE','$INS','$EST','b7000000-0000-0000-0000-000000000001'),
    -- Una segunda cursada sin Action viva: el ADE no apila sobre la primera, así
    -- que para verlo materializar hace falta una cursada libre. Va sobre otra
    -- oferta porque `course_enrollment` es UNIQUE (student_id, offering_id).
    ('b3333333-0000-0000-0000-000000000002','$INS','$EST','b7000000-0000-0000-0000-000000000002');
  insert into topic_progress (institution_id,course_enrollment_id,topic_id,practice_state,practice_value,recency_at)
    values ('$INS','$CE','b8000000-0000-0000-0000-000000000001','value',12,now() - interval '2 days');
  insert into action (id,institution_id,course_enrollment_id,topic_id,objective,verb,scope,status,estimated_minutes_min,estimated_minutes_max,expected_evidence)
    values ('ba000000-0000-0000-0000-000000000001','$INS','$CE','b8000000-0000-0000-0000-000000000001','Resolver la guía','resolver','guía 3','RECOMMENDED',60,75,'7 ejercicios');
  insert into action_recommendation (action_id,reason_primary,priority,is_primary)
    values ('ba000000-0000-0000-0000-000000000001','Entra en Parcial 1.',10,true);
" >/dev/null 2>&1 || { echo "   ✗ no se pudo sembrar"; exit 1; }
echo "   ✓ institución, cursada, dos unidades, progreso, Action y su razón"

echo "→ estado_del_dia · la materia no afirma un estado que nadie evaluó (product.md §13)"
igual "ninguna materia trae estado" \
  "$(q "select coalesce((public.estado_del_dia('$INS','$EST',now())->'materias'->0->>'estado'),'NULO');")" "NULO"

echo "→ estado_de_materia"
igual "devuelve la materia de la cursada" \
  "$(q "select public.estado_de_materia('$INS','$EST',now())->>'materia';")" "AnálisisII"
igual "lista las dos unidades declaradas" \
  "$(q "select jsonb_array_length(public.estado_de_materia('$INS','$EST',now())->'unidades');")" "2"
igual "trae el título de la evaluación" \
  "$(q "select public.estado_de_materia('$INS','$EST',now())->'examen'->>'titulo';")" "Parcial1"
# La regla que más fácil se rompe: `practice_value` es 12 y NO puede viajar.
igual "ningún valor numérico de progreso sale de la base" \
  "$(q "select (public.estado_de_materia('$INS','$EST',now())::text like '%\"12\"%' or public.estado_de_materia('$INS','$EST',now())::text like '%: 12%');")" "f"
igual "sí viaja el ESTADO de la dimensión" \
  "$(q "select public.estado_de_materia('$INS','$EST',now())->'unidades'->0->>'practica';")" "value"

echo "→ estado_de_accion"
igual "trae la razón de la recomendación primaria" \
  "$(q "select public.estado_de_accion('$INS','$EST',now())->>'razon';")" "EntraenParcial1."
igual "sin compromiso, lo dice" \
  "$(q "select public.estado_de_accion('$INS','$EST',now())->>'compromisoVivo';")" "false"

echo "→ estado_de_compromiso · el rescate no toca al incumplido (I3)"
q "insert into commitment (id,institution_id,action_id,start_at,timezone_at_commit,planned_minutes,state,missed_at)
     values ('bb000000-0000-0000-0000-000000000001','$INS','ba000000-0000-0000-0000-000000000001',now() - interval '2 days','America/Argentina/Cordoba',45,'MISSED',now());
   insert into commitment (id,institution_id,action_id,start_at,timezone_at_commit,planned_minutes,state,rescues_commitment_id)
     values ('bb000000-0000-0000-0000-000000000002','$INS','ba000000-0000-0000-0000-000000000001',now(),'America/Argentina/Cordoba',60,'DRAFT','bb000000-0000-0000-0000-000000000001');" >/dev/null 2>&1
igual "el rescate se identifica como tal" \
  "$(q "select public.estado_de_compromiso('$INS','$EST',now(),'bb000000-0000-0000-0000-000000000002')->>'esRescate';")" "true"
igual "el original conserva su estado MISSED" \
  "$(q "select public.estado_de_compromiso('$INS','$EST',now(),'bb000000-0000-0000-0000-000000000002')->'original'->>'state';")" "MISSED"
igual "y conserva sus minutos originales, sin recalcular" \
  "$(q "select public.estado_de_compromiso('$INS','$EST',now(),'bb000000-0000-0000-0000-000000000002')->'original'->>'minutosPlanificados';")" "45"
igual "la zona del acuerdo viaja congelada" \
  "$(q "select public.estado_de_compromiso('$INS','$EST',now(),'bb000000-0000-0000-0000-000000000002')->>'zonaDelAcuerdo';")" "America/Argentina/Cordoba"

echo "→ estado_de_evidencia · la resubmission preserva la anterior (I4)"
# El orden importa: las dos se apuntan entre sí, así que el vínculo hacia
# adelante se cierra al final. La primera versión insertaba la anterior
# apuntando a una fila que todavía no existía, y la FK la rechazaba en silencio
# — el script decía "vacío" en vez de "no sembré nada".
q "insert into evidence (id,institution_id,action_id,lifecycle_state)
     values ('bc000000-0000-0000-0000-000000000001','$INS','ba000000-0000-0000-0000-000000000001','RESUBMISSION_REQUESTED');
   insert into evidence (id,institution_id,action_id,lifecycle_state,supersedes_id)
     values ('bc000000-0000-0000-0000-000000000002','$INS','ba000000-0000-0000-0000-000000000001','SUBMITTED','bc000000-0000-0000-0000-000000000001');
   update evidence set superseded_by_id='bc000000-0000-0000-0000-000000000002'
     where id='bc000000-0000-0000-0000-000000000001';" >/dev/null 2>&1
igual "proyecta la vigente, no la reemplazada" \
  "$(q "select public.estado_de_evidencia('$INS','$EST',now())->>'evidenciaId';")" "bc000000-0000-0000-0000-000000000002"
igual "y la reconoce como resubmission" \
  "$(q "select public.estado_de_evidencia('$INS','$EST',now())->>'esResubmission';")" "true"
# `ADR-026`: el requisito vive en la Action y se **congela** al crearla. Ya no
# entra por parámetro — si entrara, el caller podría cambiar una regla de negocio
# cerrada. Y son tres valores: `NO_CONFIGURADA` no es `OPTIONAL`.
igual "el requisito sale de la Action, no de un parámetro" \
  "$(q "select public.estado_de_evidencia('$INS','$EST',now())->>'requisitoDeReflexion';")" "NO_CONFIGURADA"
q "update action set reflection_requirement='REQUIRED' where id='ba000000-0000-0000-0000-000000000001';" >/dev/null 2>&1
igual "y cambia con la Action que la origina" \
  "$(q "select public.estado_de_evidencia('$INS','$EST',now())->>'requisitoDeReflexion';")" "REQUIRED"
igual "un valor fuera de los tres es rechazado" \
  "$(q "update action set reflection_requirement='A_VECES' where id='ba000000-0000-0000-0000-000000000001';" | grep -c 'reflection_requirement')" "1"
q "update action set reflection_requirement='OPTIONAL' where id='ba000000-0000-0000-0000-000000000001';" >/dev/null 2>&1

echo "→ ADR-026 · el ADE congela el default del loop diario"
# En **dos** sentencias, y no en un `JOIN` sobre la función: dentro de una misma
# sentencia, el resto del plan ya tomó su snapshot y **no ve la fila que la
# función acaba de insertar**. El JOIN devolvía vacío y parecía que el ADE no
# escribía el requisito.
NUEVA=$(q "select action_id from public.materializar_recomendacion(
             '$INS','b3333333-0000-0000-0000-000000000002','b8000000-0000-0000-0000-000000000002',
             'Repasar series','repasar','unidad 2',30,45,null,'3 ejercicios','están completos',
             'Entra en Parcial 1.',10);" | tr -d '[:space:]')
igual "una Action creada por el ADE nace OPTIONAL" \
  "$(q "select reflection_requirement from action where id='$NUEVA';")" "OPTIONAL"

echo "→ estado_de_progreso · VALIDATED no produce progreso por sí solo"
q "update evidence set lifecycle_state='VALIDATED' where id='bc000000-0000-0000-0000-000000000002';" >/dev/null 2>&1
igual "sin progress_entry no hay resultado, y la pantalla lo dirá como espera" \
  "$(q "select coalesce(public.estado_de_progreso('$INS','$EST',now())->>'resultado','NULO');")" "NULO"

# `I10`: una fila que no declara ninguna dimensión cambiada y tampoco afirma que
# no hubo cambio no dice nada, y la UI la leería como un no-cambio que nadie
# declaró. La base la rechaza; no depende de que el Service se acuerde.
igual "I10 · una entrada que no afirma nada es rechazada" \
  "$(q "insert into progress_entry (institution_id,course_enrollment_id,occurred_at,entry_kind)
        values ('$INS','$CE',now(),'progress_updated');" | grep -c 'progress_entry_dice_algo')" "1"
igual "una dimensión inventada es rechazada" \
  "$(q "insert into progress_entry (institution_id,course_enrollment_id,occurred_at,entry_kind,changed_dimensions)
        values ('$INS','$CE',now(),'progress_updated','{motivacion}');" | grep -c 'dimensiones_conocidas')" "1"
igual "cambio y no-cambio a la vez es rechazado" \
  "$(q "insert into progress_entry (institution_id,course_enrollment_id,occurred_at,entry_kind,changed_dimensions,explicit_no_change)
        values ('$INS','$CE',now(),'progress_updated','{practice}',true);" | grep -c 'no_se_contradice')" "1"

q "insert into progress_entry (institution_id,course_enrollment_id,topic_id,evidence_id,occurred_at,entry_kind,changed_dimensions,current_values)
     values ('$INS','$CE','b8000000-0000-0000-0000-000000000001','bc000000-0000-0000-0000-000000000002',
             now(),'progress_updated','{practice}','{\"practice\": 19}'::jsonb);" >/dev/null 2>&1
igual "con la entrada real, viaja la dimensión cambiada" \
  "$(q "select public.estado_de_progreso('$INS','$EST',now())->'resultado'->'dimensionesCambiadas'->>0;")" "practice"
igual "y se reconoce ligada a esta evidencia" \
  "$(q "select public.estado_de_progreso('$INS','$EST',now())->'resultado'->>'esDeEstaEvidencia';")" "true"
# `practice_value` sigue siendo 12 en `topic_progress` y NO puede viajar: lo que
# sale es el estado de la dimensión. La magnitud de `current_values` es del
# owner, y la proyección decide si es mostrable (`C01-019`).
# Las dos fechas se sacan antes de mirar: `recenciaEn` es un timestamp y sus
# dígitos hacían fallar la comprobación una corrida de cada tantas, según la hora
# a la que se corriera. Un guard intermitente enseña a ignorar los guards.
igual "ningún valor de topic_progress sale de la base" \
  "$(q "select ((public.estado_de_progreso('$INS','$EST',now())->'dimensiones') - 'confianzaEn' - 'recenciaEn')::text like '%12%';")" "f"
igual "sí viaja el ESTADO de la dimensión" \
  "$(q "select public.estado_de_progreso('$INS','$EST',now())->'dimensiones'->>'practica';")" "value"

echo "→ estado_de_progreso · la Bitácora agrupa los hechos del mismo ciclo"
# Con instantes distintos: un timeline con tres hechos a la misma hora no tiene
# orden, y probarlo contra un orden indeterminado es probar nada.
q "insert into product_event (event_name,institution_id,actor_id,subject_type,subject_id,cause_ref,occurred_at)
   values ('CommitmentConfirmed','$INS','$EST','commitment','bb000000-0000-0000-0000-000000000001','DRAFT->CONFIRMED',now() - interval '3 hours'),
          ('CommitmentMissed','$INS',null,'commitment','bb000000-0000-0000-0000-000000000001','DUE->MISSED',now() - interval '2 hours'),
          ('EvidenceValidated','$INS',null,'evidence','bc000000-0000-0000-0000-000000000002','SUBMITTED->VALIDATED',now() - interval '1 hour');" >/dev/null 2>&1
igual "los tres hechos caen en UN ciclo, no en tres avances" \
  "$(q "select jsonb_array_length(public.estado_de_progreso('$INS','$EST',now())->'bitacora');")" "1"
igual "y el ciclo trae sus tres entradas" \
  "$(q "select jsonb_array_length(public.estado_de_progreso('$INS','$EST',now())->'bitacora'->0->'entradas');")" "3"
igual "lo que declaró el estudiante viaja como suyo" \
  "$(q "select public.estado_de_progreso('$INS','$EST',now())->'bitacora'->0->'entradas'->0->>'porElEstudiante';")" "true"
igual "lo que hizo el sistema no se le atribuye a nadie" \
  "$(q "select public.estado_de_progreso('$INS','$EST',now())->'bitacora'->0->'entradas'->1->>'porElEstudiante';")" "false"

echo "→ B3.1 · lo que se registra es lo que UX06 proyecta"
# El círculo completo: se escribe con `registrar_progreso` y se lee con
# `estado_de_progreso`. Hasta la B3.1 la tabla no la escribía nadie, así que la
# lectura sólo se podía probar sembrando a mano.
q "delete from progress_entry where institution_id='$INS';" >/dev/null 2>&1
NUEVA_ENTRY=$(q "select entry_id from public.registrar_progreso(
    '$INS','$CE','b8000000-0000-0000-0000-000000000001',null,'bc000000-0000-0000-0000-000000000002',
    'bc000000-0000-0000-0000-000000000002','progress_updated',now(),
    '[{\"dimension\":\"practice\",\"valor\":19,\"texto\":\"19 ejercicios\",\"textoAnterior\":\"12 ejercicios\"}]'::jsonb,
    false,null,'k-sup-1');" | tr -d '[:space:]')
igual "la dimensión registrada llega a la superficie" \
  "$(q "select public.estado_de_progreso('$INS','$EST',now())->'resultado'->'dimensionesCambiadas'->>0;")" "practice"
igual "y el texto del owner viaja tal cual, sin reformatear" \
  "$(q "select public.estado_de_progreso('$INS','$EST',now())->'resultado'->'valoresActuales'->>'practice';")" "19ejercicios"
igual "el resultado se reconoce ligado a la evidencia que el owner señaló" \
  "$(q "select public.estado_de_progreso('$INS','$EST',now())->'resultado'->>'esDeEstaEvidencia';")" "true"

echo "→ B3.3 · UX02 y UX06 cuentan la misma historia"
igual "la materia trae su actividad reciente" \
  "$(q "select jsonb_array_length(public.estado_de_materia('$INS','$EST',now())->'actividadReciente') > 0;")" "t"
# `VI.2`: 2–3 entradas. El corte lo hace la base, no la pantalla.
igual "y como mucho tres entradas" \
  "$(q "select jsonb_array_length(public.estado_de_materia('$INS','$EST',now())->'actividadReciente') <= 3;")" "t"
# La misma fuente: el hecho más reciente de la materia es el más reciente del
# historial. Si divergieran, la preview y la Bitácora contarían días distintos.
igual "el hecho más reciente es el mismo en las dos superficies" \
  "$(q "select (public.estado_de_materia('$INS','$EST',now())->'actividadReciente'->0->>'evento') =
          (select h.event_name from public.hechos_de_cursada('$INS','$CE',1) h);")" "t"

echo "→ Aislamiento: las cinco funciones lo respetan (I11)"
for f in estado_de_materia estado_de_accion estado_de_compromiso estado_de_evidencia estado_de_progreso; do
  igual "$f no cruza institución" \
    "$(q "select coalesce(public.$f('$OTRA','$EST',now())::text,'NULO');")" "NULO"
done

if [ "$fallos" -gt 0 ]; then echo; echo "✗ $fallos comprobación(es) de superficie fallando"; exit 1; fi
echo; echo "✓ las funciones de lectura devuelven lo que las superficies proyectan"
