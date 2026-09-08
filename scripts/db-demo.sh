#!/usr/bin/env bash
# Achieve Platform · seed de demo — datos SINTÉTICOS (ADR-024).
#
# Carga una materia por el ingestor del ADL y deja el mundo listo para ver el
# loop completo. Ninguna persona real, ningún dato real.
set -uo pipefail
C="supabase_db_achieve-platform"
docker exec "$C" true 2>/dev/null || { echo "✗ stack apagado: npm run db:start"; exit 1; }
q() { docker exec -i "$C" psql -U postgres -d postgres -tAX -c "$1" 2>&1; }

EST=a5000000-0000-0000-0000-000000000001
# El segundo estudiante — Fase B6.14. **Sin consentimiento, sin carrera y sin
# materias**: es el que recorre el alta entera.
NUEVO=a5000000-0000-0000-0000-000000000002

# El catálogo curricular tiene que estar cargado: desde la B6.14 el mundo demo
# cuelga de una institución con plan **publicado**, no de una inventada acá.
INST=$(q "select id from institution where key='SYN-U';" | tr -d '[:space:]')
if [ -z "$INST" ]; then
  echo "✗ Falta el catálogo. Corré 'npm run db:catalogo' antes que esto."
  exit 1
fi

# ── La atadura de identidad, conservada ──────────────────────────────────────
#
# `db:demo` borra los `student` para sembrar el mundo de nuevo, y con ellos se
# iba `auth_user_id`. El efecto era un `403 SIN_PADRON` en `/login` —*"Tu cuenta
# todavía no está habilitada"*— que **no tenía nada que ver con el padrón**:
# había que acordarse de correr `db:sesion` después.
#
# "Acordate de correr otra cosa" no es una garantía. Se guardan las ataduras y
# se reponen: `db:demo` queda idempotente respecto de la sesión, y el orden deja
# de importar.
AUTH1=$(q "select coalesce(auth_user_id::text,'') from student where id='$EST';" | tr -d '[:space:]')
AUTH2=$(q "select coalesce(auth_user_id::text,'') from student where id='$NUEVO';" | tr -d '[:space:]')

echo "→ Limpiando lo del estudiante (el catálogo NO se toca)"
# ⚠️ **No se borran `institution`, `academic_program`, `curriculum_plan`,
# `curriculum_requirement` ni `course`.** Son el catálogo, y lo carga
# `db:catalogo`: borrarlos acá dejaría el mundo sin nada que ofrecer en el alta.
q "delete from escalation_sink; delete from error_observation; delete from intervention_outcome; delete from intervention; delete from risk_signal;
   delete from protocol_step_completion; delete from protocol_artifact;
   delete from preparation_readiness; delete from exam_preparation; delete from assessment_criterion;
   delete from action_recommendation; delete from action_resource; delete from action;
   delete from requirement_declaration; delete from topic_progress; delete from course_enrollment;
   delete from availability; delete from whatsapp_consent; delete from enrollment;
   delete from learning_objective; delete from student;" >/dev/null

echo "→ Dos estudiantes sintéticos en la institución del catálogo"
# El primero recorre el loop (ya tiene su materia). El segundo recorre el alta.
q "insert into student (id,institution_id,timezone,auth_user_id)
   values ('$EST','$INST','America/Argentina/Cordoba', nullif('$AUTH1','')::uuid);
   insert into student (id,institution_id,timezone,auth_user_id)
   values ('$NUEVO','$INST','America/Argentina/Cordoba', nullif('$AUTH2','')::uuid);
   insert into availability (student_id,day_of_week,capacity_min,source) values ('$EST',1,45,'declared');
   insert into availability (student_id,day_of_week,capacity_min,source) values ('$NUEVO',1,45,'declared');" >/dev/null

# ── La semana declarada · ADR-073 ────────────────────────────────────────────
#
# La fila de arriba existía desde la B1 y alcanzaba para `MIN(capacity_min)` —el
# ADE dimensiona **un** bloque—. El reparto entre materias necesita la suma, así
# que el estudiante del loop declara una semana entera.
#
# ⚠️ **El estudiante nuevo NO la declara**, a propósito: es el que sirve para ver
# el alta desde cero, y desde ADR-073 tiene un paso más.
q "select declarar_disponibilidad('$INST','$EST',
     '[{\"dia\":1,\"desde\":\"18:00\",\"hasta\":\"19:30\",\"minutos\":90},
       {\"dia\":3,\"desde\":\"18:00\",\"hasta\":\"19:30\",\"minutos\":90},
       {\"dia\":6,\"desde\":\"10:00\",\"hasta\":\"12:00\",\"minutos\":120}]'::jsonb);" >/dev/null

# El plan publicado contra el que corre todo el mundo demo — Fase B6.14.
PLAN=$(q "select cp.id from curriculum_plan cp join academic_program ap on ap.id=cp.program_id
           where ap.key='SYN-ING-A' and cp.version='SYN-2016';" | tr -d '[:space:]')

echo "→ Ingiriendo el material de una materia DEL PLAN (ADL, fuente declarada, todo unverified)"
# ⚠️ **Cuelga del plan declarado**, no del contenedor `Sin programa declarado`.
# Es para lo que la B6.14.3 le agregó `p_curriculum_plan_id` al ingestor: sin
# eso, la materia que el estudiante elige en el alta y la que tiene unidades
# cargadas serían dos filas distintas con el mismo nombre.
#
# Y **sin comisión**, igual que las cursadas por defecto que crea el alta: con
# una comisión distinta, confirmar crearía una segunda cursada de la misma
# materia.
U='[{"codigo":"U1","nombre":"Límites y continuidad","orden":1},
    {"codigo":"U2","nombre":"Derivadas","orden":2},
    {"codigo":"U3","nombre":"Integrales","orden":3},
    {"codigo":"U4","nombre":"Series","orden":4}]'
P='[{"unidad":"Derivadas","requiere":"Límites y continuidad"},
    {"unidad":"Integrales","requiere":"Derivadas"}]'
E='[{"tipo":"parcial","titulo":"Parcial 1","fecha":"2026-09-15","modalidad":"practico","alcance":"U1 a U2"},
    {"tipo":"final","titulo":"Final","modalidad":"oral"}]'
# ── El libro de temas · Fase B6.15 ───────────────────────────────────────────
#
# Sin esto el Gantt de `UX02` no tiene de dónde sacar minutos y la materia
# entra degradada: *"sin clases cargadas, no puedo estimar las horas"*. Es un
# estado legítimo —13 de 36 materias del corpus real están así— pero no es el
# que conviene mostrar en la demo.
#
# ⚠️ **La fila del parcial no lleva temas y va con `tipo: parcial`.** Un examen
# ocupa el aula y no dicta nada: si entrara como clase, el Gantt le atribuiría
# sus 120 minutos a las unidades que evaluaba (ADR-069).
#
# ⚠️ **Ninguna otra fila lleva `tipo`.** El importador no clasifica, y la guía
# sólo lo trae cuando una persona lo confirmó. Ausente queda `NULL`, que el
# dominio cuenta como clase.
CL='[{"fecha":"2026-08-04","hora":"14:00","minutos":120,"corrida":"teorico","temas":["Límites y continuidad"]},
     {"fecha":"2026-08-11","hora":"14:00","minutos":120,"corrida":"teorico","temas":["Límites y continuidad"]},
     {"fecha":"2026-08-18","hora":"14:00","minutos":120,"corrida":"teorico","temas":["Derivadas"]},
     {"fecha":"2026-08-25","hora":"14:00","minutos":120,"corrida":"teorico","temas":["Derivadas"]},
     {"fecha":"2026-09-01","hora":"14:00","minutos":120,"corrida":"practico","temas":["Derivadas"]},
     {"fecha":"2026-09-08","hora":"14:00","minutos":120,"corrida":"practico","temas":["Límites y continuidad","Derivadas"]},
     {"fecha":"2026-09-15","hora":"14:00","minutos":120,"tipo":"parcial","temas":[]},
     {"fecha":"2026-09-22","hora":"14:00","minutos":120,"corrida":"teorico","temas":["Integrales"]},
     {"fecha":"2026-09-29","hora":"14:00","minutos":120,"corrida":"practico","temas":["Integrales"]},
     {"fecha":"2026-10-06","hora":"14:00","minutos":120,"corrida":"teorico","temas":["Series"]}]'
MATERIA=$(q "select code from curriculum_requirement
              where curriculum_plan_id='$PLAN' and label='Cálculo Avanzado';" | tr -d '[:space:]')
OFF=$(q "select cursada_id from public.ingerir_materia('$INST','public_web','https://syn.example/programa-calculo-avanzado.pdf',now(),0.7,'$MATERIA','Cálculo Avanzado','2026-2',NULL,'$U'::jsonb,'$P'::jsonb,'$E'::jsonb,'$PLAN','$CL'::jsonb,3600,'60 horas');" | tr -d '[:space:]')
echo "   cursada: $OFF"

q "insert into course_enrollment (id,institution_id,student_id,offering_id)
   values ('a6000000-0000-0000-0000-000000000001','$INST','$EST','$OFF');" >/dev/null

# El alta del estudiante del loop, **ya ocurrida**. Desde la B6.14 las nueve
# superficies devuelven `409` mientras el alta no esté confirmada, así que sin
# esto el recorrido del loop empezaría mandando al tramo de alta.
q "insert into whatsapp_consent (institution_id,student_id,decision,policy_version)
   values ('$INST','$EST','DECLINED','whatsapp-v1-sintetica');
   insert into enrollment (student_id,program_id,term,institution_id,curriculum_plan_id,curriculum_year,confirmed_at)
   select '$EST', cp.program_id, '2026-2', '$INST', cp.id, 2, now()
     from curriculum_plan cp where cp.id='$PLAN';
   insert into requirement_declaration (institution_id,student_id,curriculum_requirement_id,course_enrollment_id)
   select '$INST','$EST', cr.id, 'a6000000-0000-0000-0000-000000000001'
     from curriculum_requirement cr
    where cr.curriculum_plan_id='$PLAN' and cr.label='Cálculo Avanzado';" >/dev/null

# ── Dos materias más, para el índice · ADR-077 ───────────────────────────────
#
# ⚠️ **No son relleno: son los dos estados difíciles del índice.** Con una sola
# materia el área no muestra nada de lo que decide —el orden por evaluación, y
# los dos vacíos que ADR-072 §4 obliga a dibujar distinto—, y una pantalla que
# sólo se puede mirar en su caso fácil no está probada.
#
#   · **Álgebra Sintética** tiene unidades y evaluación, y **ninguna clase**:
#     entra sin barra, diciendo *"sin clases cargadas, no puedo estimar"*. Es el
#     estado en el que entran **13 de las 36 materias del corpus real**.
#   · **Física Sintética** tiene clases y unidades, y **ninguna evaluación**:
#     entra sin fecha, al fondo del orden, ofreciendo cargarla.
echo "→ Dos materias más para el índice (ADR-077): una sin clases, otra sin evaluación"

U2='[{"codigo":"U1","nombre":"Grupos","orden":1},
     {"codigo":"U2","nombre":"Anillos","orden":2},
     {"codigo":"U3","nombre":"Cuerpos","orden":3}]'
E2='[{"tipo":"final","titulo":"Final","fecha":"2026-09-24","modalidad":"oral"}]'
MAT2=$(q "select code from curriculum_requirement where curriculum_plan_id='$PLAN' and label='Álgebra Sintética';" | tr -d '[:space:]')
# Sin libro de temas: `[]`, y sin carga declarada. **La degradación es el punto.**
OFF2=$(q "select cursada_id from public.ingerir_materia('$INST','public_web','https://syn.example/programa-algebra.pdf',now(),0.7,'$MAT2','Álgebra Sintética','2026-2',NULL,'$U2'::jsonb,'[]'::jsonb,'$E2'::jsonb,'$PLAN','[]'::jsonb,NULL,NULL);" | tr -d '[:space:]')
q "insert into course_enrollment (id,institution_id,student_id,offering_id)
   values ('a6000000-0000-0000-0000-000000000002','$INST','$EST','$OFF2');
   insert into requirement_declaration (institution_id,student_id,curriculum_requirement_id,course_enrollment_id)
   select '$INST','$EST', cr.id, 'a6000000-0000-0000-0000-000000000002'
     from curriculum_requirement cr
    where cr.curriculum_plan_id='$PLAN' and cr.label='Álgebra Sintética';" >/dev/null

U3='[{"codigo":"U1","nombre":"Cinemática","orden":1},
     {"codigo":"U2","nombre":"Dinámica","orden":2}]'
CL3='[{"fecha":"2026-08-06","hora":"18:00","minutos":180,"corrida":"teorico","temas":["Cinemática"]},
      {"fecha":"2026-08-13","hora":"18:00","minutos":180,"corrida":"teorico","temas":["Cinemática"]},
      {"fecha":"2026-08-20","hora":"18:00","minutos":180,"corrida":"practico","temas":["Dinámica"]}]'
MAT3=$(q "select code from curriculum_requirement where curriculum_plan_id='$PLAN' and label='Física Sintética';" | tr -d '[:space:]')
# Sin evaluaciones: `[]`. El índice **no le inventa una fecha** ni la ordena
# como si tuviera: va al fondo y ofrece cargarla.
OFF3=$(q "select cursada_id from public.ingerir_materia('$INST','public_web','https://syn.example/programa-fisica.pdf',now(),0.7,'$MAT3','Física Sintética','2026-2',NULL,'$U3'::jsonb,'[]'::jsonb,'[]'::jsonb,'$PLAN','$CL3'::jsonb,1800,'30 horas');" | tr -d '[:space:]')
q "insert into course_enrollment (id,institution_id,student_id,offering_id)
   values ('a6000000-0000-0000-0000-000000000003','$INST','$EST','$OFF3');
   insert into requirement_declaration (institution_id,student_id,curriculum_requirement_id,course_enrollment_id)
   select '$INST','$EST', cr.id, 'a6000000-0000-0000-0000-000000000003'
     from curriculum_requirement cr
    where cr.curriculum_plan_id='$PLAN' and cr.label='Física Sintética';" >/dev/null

echo "→ Material por unidad (sin recurso no hay acción ejecutable)"
# ⚠️ **Se borra lo de esta cursada antes de insertar.** `ingerir_materia()` es
# reemplazo por cursada para unidades y evaluaciones, pero los recursos los
# siembra este script: sin este `delete` se acumulaban en cada corrida —y los
# viejos quedaban con `topic_id NULL`, apuntando a unidades que ya no existen.
q "delete from resource where offering_id='$OFF';" >/dev/null
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
  # ⚠️ **La Action se ancla al tema.** Sin `topic_id`, `estado_de_materia()`
  # no puede decir que se trabajó sobre esa unidad y el Gantt muestra
  # `0 de 4 temas` con dos entregas hechas — que es lo contrario de lo que pasó.
  q "insert into action (id,institution_id,course_enrollment_id,exam_preparation_id,topic_id,objective,verb,scope,status)
     values ('ae00000$n-0000-0000-0000-000000000001','$INST','a6000000-0000-0000-0000-000000000001','$PREP',
             (select id from topic where offering_id='$OFF' and name='Integrales'),
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
echo
echo "→ Historia para el Personal Engine (ADR-074): cinco reflexiones con minutos reales"
# ⚠️ **Sale de `reflection`, no de los Commitment cumplidos.** Lo primero mide
# la tarea frente a la persona; lo segundo, su conducta. Confundirlas haría que
# una mala semana le reduzca el presupuesto al estudiante.
#
# Cinco es el mínimo de ADR-074: con menos, la mediana es ruido con forma de
# dato. Los minutos reales están por encima de la estimación a propósito, para
# que el multiplicador se vea calibrando hacia arriba — que es la única
# dirección en la que puede moverse (ADR-070).
for n in 1 2 3 4 5; do
  q "insert into action (id,institution_id,course_enrollment_id,objective,verb,scope,status,estimated_minutes_min,estimated_minutes_max)
     values ('af20000$n-0000-0000-0000-000000000001','$INST','a6000000-0000-0000-0000-000000000001',
             'Práctica de la unidad','resolver','tema','COMPLETED',40,60);
     insert into reflection (institution_id,action_id,actual_minutes,difficulty,created_at)
     values ('$INST','af20000$n-0000-0000-0000-000000000001',75,'mas_dificil', now() - (interval '1 day' * $n));" >/dev/null
done
# ⚠️ **En días distintos, y no es cosmético.** ADR-075 §B3 exige al menos tres:
# cinco registros de una misma tarde describen una tarde, no una tendencia. Con
# todos el mismo día el motor **se niega a calibrar**, que es lo correcto — y es
# lo que pasaba antes de este arreglo.
echo "   cinco reflexiones de 75 min en cinco días, sobre 40-60 estimados → multiplicador 1,5×"

echo "→ El estudiante recién habilitado ($NUEVO) queda SIN alta:"
q "select '   consentimiento: ' || (public.estado_del_alta('$INST','$NUEVO')->>'consentimientoRespondido') ||
          ' · carrera: ' || (public.estado_del_alta('$INST','$NUEVO')->>'carreraDeclarada') ||
          ' · materias: ' || (public.estado_del_alta('$INST','$NUEVO')->>'materiasConfirmadas');"
echo
if [ -n "$AUTH1" ] && [ -n "$AUTH2" ]; then
  echo "   (las identidades de /login se conservaron; no hace falta db:sesion)"
else
  echo "   ⚠️  Todavía sin identidad de auth: corré 'npm run db:sesion' para poder entrar."
fi

echo "✓ Mundo listo. Cursada: a6000000-0000-0000-0000-000000000001"
q "select '   ' || (select count(*) from topic where offering_id='$OFF') || ' unidades · ' ||
          (select count(*) from class_session where offering_id='$OFF') || ' clases · ' ||
          (select count(*) from assessment where offering_id='$OFF') || ' evaluaciones · ' ||
          (select count(*) from resource where offering_id='$OFF') || ' recursos';"
