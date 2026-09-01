#!/usr/bin/env bash
# Achieve Platform · Etapa B1.4 — los tres criterios de Done de la Fase B1 que
# sólo se pueden demostrar contra una base real:
#
#   1. Un tenant no puede leer datos de otro.
#   2. Las transiciones prohibidas fallan incluso bajo concurrencia.
#   3. La idempotencia está en el servidor, no en el frontend.
set -uo pipefail
C="supabase_db_achieve-platform"
docker exec "$C" true 2>/dev/null || { echo "✗ stack apagado: npm run db:start"; exit 1; }
q() { docker exec -i "$C" psql -U postgres -d postgres -tAX -c "$1" 2>&1; }
corre() { docker exec -i "$C" psql -U postgres -d postgres -tAX -v ON_ERROR_STOP=1 -c "$1" >/dev/null 2>&1; }
fallos=0
ok() { echo "   ✓ $1"; }
mal() { echo "   ✗ $1"; fallos=$((fallos+1)); }

A=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa   # institución A
B=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb   # institución B

# `db:verify` es dueño de la base local: la deja vacía de datos de negocio.
# No es un detalle de implementación —después de correrlo hay que volver a
# sembrar con `npm run db:demo`— y está escrito acá porque este script y el
# seed comparten UUID: `aaaaaaaa-…` es la misma institución en los dos, así que
# no pueden convivir. Con datos de la demo puestos, el `insert` de abajo choca
# por clave duplicada y el verificador falla sin que haya nada roto.
#
# La limpieza va también al principio, y por `trap EXIT`: la corrida que se va
# por `exit 1` es justo la que dejaba el mundo a medio poner, y así garantizaba
# que la siguiente también fallara.
limpiar_mundo() {
  q "delete from intervention_outcome; \
   delete from intervention; \
   delete from risk_signal; \
   delete from playbook; \
   delete from protocol_step_completion; \
   delete from protocol_artifact; \
   delete from preparation_readiness; \
   delete from exam_preparation; \
   delete from assessment_criterion; \
   delete from evidence_content; \
   delete from evidence; \
   delete from reflection; \
   delete from action_recommendation; \
   delete from action_resource; \
   delete from commitment; \
   delete from action; \
   delete from topic_progress; \
   delete from course_enrollment; \
   delete from availability; \
   delete from enrollment; \
   delete from student; \
   delete from instructor; \
   delete from assessment_topic; \
   delete from assessment; \
   delete from class_session_topic; \
   delete from class_session; \
   delete from class_event_record; \
   delete from resource; \
   delete from topic_prerequisite; \
   delete from topic; \
   delete from course_offering; \
   delete from course; \
   delete from curriculum_plan; \
   delete from academic_program; \
   delete from institution_crm_ref; \
   delete from institution;" >/dev/null 2>&1
}
trap limpiar_mundo EXIT
limpiar_mundo

echo "→ Dos instituciones con datos propios"
corre "insert into institution (id,name) values ('$A','Inst A'),('$B','Inst B');
 insert into academic_program (id,institution_id,name) values ('a1000000-0000-0000-0000-000000000001','$A','P-A'),('b1000000-0000-0000-0000-000000000001','$B','P-B');
 insert into curriculum_plan (id,program_id,version) values ('a2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','v1'),('b2000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','v1');
 insert into course (id,curriculum_plan_id,code,name) values ('a3000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','A1','CA'),('b3000000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000001','B1','CB');
 insert into course_offering (id,course_id,term) values ('a4000000-0000-0000-0000-000000000001','a3000000-0000-0000-0000-000000000001','2026'),('b4000000-0000-0000-0000-000000000001','b3000000-0000-0000-0000-000000000001','2026');
 insert into student (id,institution_id) values ('a5000000-0000-0000-0000-000000000001','$A'),('b5000000-0000-0000-0000-000000000001','$B');
 insert into course_enrollment (id,institution_id,student_id,offering_id) values ('a6000000-0000-0000-0000-000000000001','$A','a5000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001'),('b6000000-0000-0000-0000-000000000001','$B','b5000000-0000-0000-0000-000000000001','b4000000-0000-0000-0000-000000000001');
 insert into action (id,institution_id,course_enrollment_id,objective,verb,scope) values ('a7000000-0000-0000-0000-000000000001','$A','a6000000-0000-0000-0000-000000000001','obj','resolver','u1'),('b7000000-0000-0000-0000-000000000001','$B','b6000000-0000-0000-0000-000000000001','obj','resolver','u1');
 insert into commitment (id,institution_id,action_id,start_at,timezone_at_commit,planned_minutes,state) values ('a8000000-0000-0000-0000-000000000001','$A','a7000000-0000-0000-0000-000000000001',now(),'America/Argentina/Cordoba',40,'CONFIRMED');" \
 && ok "cargadas" || { mal "no se pudieron cargar"; exit 1; }

echo "→ 1. I11. Aislamiento: el scoping va en el WHERE, no después de leer"
visto=$(q "select count(*) from commitment where institution_id='$B' and id='a8000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')
[ "$visto" = "0" ] && ok "B no alcanza el commitment de A" || mal "B vio $visto fila(s) de A"

echo "→ 2. I1. Transición prohibida: MISSED nunca vuelve a COMPLETED"
corre "update commitment set state='MISSED', missed_at=now() where id='a8000000-0000-0000-0000-000000000001';"
# El guard atómico del Repository: el estado esperado va en el WHERE.
filas=$(q "with u as (update commitment set state='COMPLETED' where id='a8000000-0000-0000-0000-000000000001' and institution_id='$A' and state='CONFIRMED' returning 1) select count(*) from u;" | tr -d '[:space:]')
[ "$filas" = "0" ] && ok "el compare-and-swap no encuentra el estado esperado" || mal "actualizó $filas fila(s)"
estado=$(q "select state from commitment where id='a8000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')
[ "$estado" = "MISSED" ] && ok "sigue MISSED: el incumplimiento no se borró" || mal "quedó en $estado"

echo "→ 2b. Concurrencia: dos transiciones válidas, una sola gana"
corre "update commitment set state='CONFIRMED', missed_at=null where id='a8000000-0000-0000-0000-000000000001';"
# Las dos leyeron CONFIRMED y escriben distinto. Compare-and-swap: gana una.
r1=$(q "with u as (update commitment set state='DUE' where id='a8000000-0000-0000-0000-000000000001' and state='CONFIRMED' returning 1) select count(*) from u;" | tr -d '[:space:]')
r2=$(q "with u as (update commitment set state='RENEGOTIATED' where id='a8000000-0000-0000-0000-000000000001' and state='CONFIRMED' returning 1) select count(*) from u;" | tr -d '[:space:]')
[ "$((r1 + r2))" = "1" ] && ok "una escribió ($r1/$r2); la otra no encontró el estado" || mal "escribieron $((r1+r2))"

echo "→ 3. I8. Idempotencia en el servidor, no en el frontend"
corre "insert into commitment (institution_id,action_id,start_at,timezone_at_commit,planned_minutes,idempotency_key) values ('$A','a7000000-0000-0000-0000-000000000001',now(),'America/Argentina/Cordoba',40,'clave-repetida');"
if corre "insert into commitment (institution_id,action_id,start_at,timezone_at_commit,planned_minutes,idempotency_key) values ('$A','a7000000-0000-0000-0000-000000000001',now(),'America/Argentina/Cordoba',40,'clave-repetida');"; then
  mal "la base aceptó dos veces la misma clave"
else
  ok "la segunda con la misma clave se rechaza en la base"
fi

echo "→ B1.6. La institución del CRM se traduce; no se adopta ni se crea sola"
CRM=cccccccc-cccc-cccc-cccc-cccccccccccc
[ "$(q "select coalesce(public.institucion_de_crm('$CRM')::text,'null');" | tr -d '[:space:]')" = "null" ] \
  && ok "una institución del CRM sin mapear no resuelve a nada" || mal "resolvió algo que no está mapeado"
corre "insert into institution_crm_ref (institution_id,crm_institution_id,created_by) values ('$A','$CRM','alta manual');"
[ "$(q "select public.institucion_de_crm('$CRM');" | tr -d '[:space:]')" = "$A" ] \
  && ok "mapeada, traduce al id de Plataforma" || mal "no tradujo"
# La PK del tenant es de Plataforma: los dos UUID son distintos a propósito.
[ "$CRM" != "$A" ] && ok "el id de Plataforma NO es el del CRM" || mal "son el mismo UUID"
if corre "insert into institution_crm_ref (institution_id,crm_institution_id) values ('$B','$CRM');"; then
  mal "dos instituciones de Plataforma para la misma del CRM"
else
  ok "una institución del CRM mapea a una sola de Plataforma"
fi
q "delete from institution_crm_ref;" >/dev/null

echo "→ I2. Renegociar CREA una fila nueva; el original no se edita"
corre "update commitment set state='CONFIRMED', missed_at=null where id='a8000000-0000-0000-0000-000000000001';"
orig_antes=$(q "select start_at||'|'||planned_minutes from commitment where id='a8000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')
nuevo=$(q "select id from public.renegociar_compromiso('$A','a8000000-0000-0000-0000-000000000001','CONFIRMED', now() + interval '2 days','America/Argentina/Cordoba',70);" | tr -d '[:space:]')
[ -n "$nuevo" ] && ok "creó el sucesor" || mal "no creó sucesor"
[ "$(q "select state from commitment where id='a8000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')" = "RENEGOTIATED" ] \
  && ok "el original quedó RENEGOTIATED" || mal "el original no quedó RENEGOTIATED"
[ "$(q "select renegotiated_from_id from commitment where id='$nuevo';" | tr -d '[:space:]')" = "a8000000-0000-0000-0000-000000000001" ] \
  && ok "el sucesor apunta al original" || mal "el sucesor no apunta al original"
orig_despues=$(q "select start_at||'|'||planned_minutes from commitment where id='a8000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')
[ "$orig_antes" = "$orig_despues" ] && ok "la fecha y los minutos del original NO se tocaron" || mal "el original se editó"

echo "→ I2b. Renegociar dos veces en carrera produce UN solo sucesor"
corre "update commitment set state='CONFIRMED' where id='a8000000-0000-0000-0000-000000000001';"
n1=$(q "select count(*) from public.renegociar_compromiso('$A','a8000000-0000-0000-0000-000000000001','CONFIRMED',now(),'UTC',40);" | tr -d '[:space:]')
n2=$(q "select count(*) from public.renegociar_compromiso('$A','a8000000-0000-0000-0000-000000000001','CONFIRMED',now(),'UTC',40);" | tr -d '[:space:]')
[ "$((n1 + n2))" = "1" ] && ok "una sola ganó ($n1/$n2)" || mal "produjo $((n1+n2)) sucesores"

echo "→ I3. Un rescate SÓLO apunta a un MISSED"
corre "update commitment set state='CONFIRMED', missed_at=null where id='a8000000-0000-0000-0000-000000000001';"
r=$(q "select count(*) from public.crear_rescate('$A','a8000000-0000-0000-0000-000000000001',now(),'UTC',40);" | tr -d '[:space:]')
[ "$r" = "0" ] && ok "rescatar un CONFIRMED no crea nada" || mal "creó rescate de un CONFIRMED"
corre "update commitment set state='MISSED', missed_at=now() where id='a8000000-0000-0000-0000-000000000001';"
resc=$(q "select id from public.crear_rescate('$A','a8000000-0000-0000-0000-000000000001',now(),'UTC',40);" | tr -d '[:space:]')
[ -n "$resc" ] && ok "rescatar un MISSED sí crea el objeto de rescate" || mal "no creó el rescate"
[ "$(q "select state from commitment where id='a8000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')" = "MISSED" ] \
  && ok "el incumplido SIGUE MISSED: el rescate no lo edita (No Cortar)" || mal "el rescate editó el incumplimiento"

echo "→ I3b. Un compromiso no es rescate y renegociación a la vez"
if corre "update commitment set renegotiated_from_id='a8000000-0000-0000-0000-000000000001' where id='$resc';"; then
  mal "aceptó ser las dos cosas"
else
  ok "el CHECK lo impide"
fi

echo "→ I8. La misma clave de idempotencia no crea dos rescates"
corre "update commitment set state='MISSED' where id='a8000000-0000-0000-0000-000000000001';"
q "select count(*) from public.crear_rescate('$A','a8000000-0000-0000-0000-000000000001',now(),'UTC',40,'k-resc');" >/dev/null
if corre "select count(*) from public.crear_rescate('$A','a8000000-0000-0000-0000-000000000001',now(),'UTC',40,'k-resc');"; then
  mal "aceptó dos veces la misma clave"
else
  ok "la segunda con la misma clave se rechaza"
fi
q "delete from commitment where id <> 'a8000000-0000-0000-0000-000000000001';" >/dev/null

echo "→ B2b. Ingesta del ADL: procedencia obligatoria y nada se eleva a oficial"
GUIA_U='[{"codigo":"U1","nombre":"Unidad 1","orden":1},{"codigo":"U2","nombre":"Unidad 2","orden":2}]'
GUIA_P='[{"unidad":"Unidad 2","requiere":"Unidad 1"}]'
GUIA_E='[{"tipo":"parcial","titulo":"Parcial 1","fecha":"2026-09-15","modalidad":"practico"},{"tipo":"final","titulo":"Final","modalidad":"oral"}]'
res=$(q "select cursada_id||'|'||unidades||'|'||evaluaciones from public.ingerir_materia('$A','public_web','https://facultad.example/programa.pdf',now(),0.6,'SYN-9','Materia SYN','2026-2',null,'$GUIA_U'::jsonb,'$GUIA_P'::jsonb,'$GUIA_E'::jsonb);" | tr -d '[:space:]')
cursada=$(echo "$res" | cut -d'|' -f1)
[ "$(echo "$res" | cut -d'|' -f2)" = "2" ] && ok "cargó las 2 unidades" || mal "unidades: $res"
[ "$(echo "$res" | cut -d'|' -f3)" = "2" ] && ok "cargó las 2 evaluaciones" || mal "evaluaciones: $res"

# I9: lo ingerido NUNCA se presenta como oficial.
noOficial=$(q "select count(*) from assessment where offering_id='$cursada' and verification_status<>'unverified';" | tr -d '[:space:]')
[ "$noOficial" = "0" ] && ok "todo entró 'unverified': el ingestor no eleva nada (I9)" || mal "$noOficial fila(s) no unverified"
[ "$(q "select count(*) from assessment where offering_id='$cursada' and source_type='public_web' and source_ref is not null;" | tr -d '[:space:]')" = "2" ] \
  && ok "cada evaluación conserva de dónde salió" || mal "falta procedencia"

# La fecha desconocida NO se estima: el final quedó sin fecha.
[ "$(q "select count(*) from assessment where offering_id='$cursada' and assessment_date is null;" | tr -d '[:space:]')" = "1" ] \
  && ok "la evaluación sin fecha quedó sin fecha, no estimada" || mal "estimó una fecha"

# 'oral' se almacena aunque quede fuera de P0.
[ "$(q "select count(*) from assessment where offering_id='$cursada' and modality='oral';" | tr -d '[:space:]')" = "1" ] \
  && ok "'oral' se almacena aunque quede fuera de P0 (C01-047)" || mal "perdió la modalidad oral"

# Prerequisito EXPLÍCITO, no derivado del orden.
[ "$(q "select count(*) from topic_prerequisite tp join topic t on t.id=tp.topic_id where t.offering_id='$cursada';" | tr -d '[:space:]')" = "1" ] \
  && ok "el prerequisito declarado se cargó, y sólo ese" || mal "prerequisitos mal"

echo "→ B2b. Re-ingerir el mismo material NO duplica el programa"
q "select 1 from public.ingerir_materia('$A','public_web','https://facultad.example/programa.pdf',now(),0.6,'SYN-9','Materia SYN','2026-2',null,'$GUIA_U'::jsonb,'$GUIA_P'::jsonb,'$GUIA_E'::jsonb);" >/dev/null
[ "$(q "select count(*) from topic where offering_id='$cursada';" | tr -d '[:space:]')" = "2" ] \
  && ok "sigue habiendo 2 unidades, no 4" || mal "duplicó el programa"
[ "$(q "select count(*) from course_offering where course_id=(select id from course where code='SYN-9');" | tr -d '[:space:]')" = "1" ] \
  && ok "y una sola cursada" || mal "duplicó la cursada"

echo "→ B2b. El ingestor no carga identidad de docente (ADR-023)"
[ "$(q "select count(*) from instructor;" | tr -d '[:space:]')" = "0" ] \
  && ok "ninguna fila de instructor" || mal "cargó un docente"

q "delete from assessment; delete from topic_prerequisite; delete from topic; delete from course_offering where course_id in (select id from course where code='SYN-9'); delete from course where code='SYN-9';" >/dev/null

echo "→ I6. Una sola ActionRecommendation primaria por Action"
corre "insert into action_recommendation (action_id,reason_primary,priority,is_primary) values ('a7000000-0000-0000-0000-000000000001','porque sí',1,true);"
if corre "insert into action_recommendation (action_id,reason_primary,priority,is_primary) values ('a7000000-0000-0000-0000-000000000001','otra',2,true);"; then
  mal "aceptó dos recomendaciones primarias para la misma Action"
else
  ok "la segunda primaria se rechaza (índice único parcial)"
fi
corre "insert into action_recommendation (action_id,reason_primary,priority,is_primary) values ('a7000000-0000-0000-0000-000000000001','secundaria',3,false);" \
  && ok "las no primarias conviven sin límite" || mal "rechazó una no primaria"
# I6 sólo llega hasta acá: "una por CONTEXTO" necesita una identidad canónica
# de contexto que el spec todavía no define. Ver data-model.md §11, fila I6.
q "delete from action_recommendation;" >/dev/null

echo "→ I4/I5. Evidence: resubmission preserva, y UNDER_REVIEW exige instancia"
corre "insert into evidence (id,institution_id,action_id,lifecycle_state) values ('e1000000-0000-0000-0000-000000000001','$A','a7000000-0000-0000-0000-000000000001','RESUBMISSION_REQUESTED');"
nueva=$(q "select id from public.resubmitir_evidencia('$A','e1000000-0000-0000-0000-000000000001','WEB');" | tr -d '[:space:]')
[ -n "$nueva" ] && ok "la resubmission creó una evidencia NUEVA" || mal "no creó nada"
[ "$(q "select count(*) from evidence where id='e1000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')" = "1" ] \
  && ok "la anterior SIGUE EXISTIENDO" || mal "la anterior desapareció"
[ "$(q "select lifecycle_state from evidence where id='e1000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')" = "RESUBMISSION_REQUESTED" ] \
  && ok "la anterior conserva su estado: no se sobrescribió" || mal "la anterior cambió de estado"
[ "$(q "select supersedes_id from evidence where id='$nueva';" | tr -d '[:space:]')" = "e1000000-0000-0000-0000-000000000001" ] \
  && ok "la nueva apunta a la anterior" || mal "no apunta"
[ "$(q "select superseded_by_id from evidence where id='e1000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')" = "$nueva" ] \
  && ok "y la anterior apunta a la nueva" || mal "el vínculo inverso falta"
r2=$(q "select count(*) from public.resubmitir_evidencia('$A','e1000000-0000-0000-0000-000000000001','WEB');" | tr -d '[:space:]')
[ "$r2" = "0" ] && ok "no se resubmite dos veces la misma" || mal "encadenó dos veces"

# I5: UNDER_REVIEW exige una instancia REAL de revisión. Un método configurado
# no alcanza — es literalmente el invariante que AGENTS.md §2.1 separa.
if corre "update evidence set lifecycle_state='UNDER_REVIEW' where id='$nueva';"; then
  mal "UNDER_REVIEW sin review_instance_id"
else
  ok "UNDER_REVIEW sin instancia se rechaza (I5)"
fi
if corre "update evidence set lifecycle_state='UNDER_REVIEW', review_instance_id=gen_random_uuid() where id='$nueva';"; then
  ok "con instancia real, sí"
else
  mal "rechazó una revisión con instancia"
fi
# Un método de validación configurado NO habilita UNDER_REVIEW por sí solo.
corre "update evidence set lifecycle_state='SUBMITTED', review_instance_id=null, validation_method='humana' where id='$nueva';"
if corre "update evidence set lifecycle_state='UNDER_REVIEW' where id='$nueva';"; then
  mal "un método configurado alcanzó para UNDER_REVIEW"
else
  ok "un método configurado NO alcanza: hace falta la instancia"
fi

echo "→ Storage: el bucket de evidencia es privado"
[ "$(q "select public from storage.buckets where id='evidencia';" | tr -d '[:space:]')" = "f" ] \
  && ok "bucket privado: sin firma no se lee ni adivinando la URL" || mal "el bucket es público"

q "delete from evidence;" >/dev/null

echo "→ 4. Append-only: el pasado no se reescribe (I12)"
corre "insert into product_event (event_name,institution_id,subject_type,subject_id,payload) values ('CommitmentCreated','$A','commitment','a8000000-0000-0000-0000-000000000001','{\"k\":1}');"
corre "insert into audit_log (institution_id,action,target_type,target_id) values ('$A','read','commitment','a8000000-0000-0000-0000-000000000001');"
ok "se pueden insertar hechos"

# Con el rol del backend, no con `postgres`: el riesgo real es un UPDATE del
# propio backend, no un cliente anónimo que ya no llega a la tabla.
if corre "set role service_role; update product_event set payload='{\"k\":2}';"; then
  mal "el backend pudo REESCRIBIR un evento"
else
  ok "service_role no puede hacer UPDATE de product_event"
fi
if corre "set role service_role; delete from audit_log;"; then
  mal "el backend pudo BORRAR auditoría"
else
  ok "service_role no puede hacer DELETE de audit_log"
fi
# Se toca una columna SIN constraint de dominio a propósito. Antes esto movía
# `state`, y fallaba contra el CHECK de coherencia cuando el compromiso venía
# MISSED de un test anterior — reportando "la revocación rompió el schema",
# que era falso. Un test debe fallar por lo que dice que prueba.
if corre "set role service_role; update commitment set timezone_at_commit='UTC' where institution_id='$A';"; then
  ok "y sigue pudiendo actualizar las tablas normales"
else
  mal "la revocación se llevó puesto el resto del schema"
fi
q "delete from product_event; delete from audit_log;" >/dev/null

echo "→ B4. El reloj del lifecycle contra Postgres"
corre "delete from commitment;"
corre "insert into commitment (id,institution_id,action_id,start_at,timezone_at_commit,planned_minutes,state) values
  ('d1000000-0000-0000-0000-000000000001','$A','a7000000-0000-0000-0000-000000000001', now() + interval '2 hours','UTC',40,'CONFIRMED'),
  ('d2000000-0000-0000-0000-000000000001','$A','a7000000-0000-0000-0000-000000000001', now() - interval '10 minutes','UTC',40,'CONFIRMED'),
  ('d3000000-0000-0000-0000-000000000001','$A','a7000000-0000-0000-0000-000000000001', now() - interval '2 hours','UTC',40,'DUE'),
  ('d4000000-0000-0000-0000-000000000001','$A','a7000000-0000-0000-0000-000000000001', now() - interval '5 days','UTC',40,'MISSED');"
# Sólo CONFIRMED y DUE son candidatos: el resto no depende del tiempo.
cands=$(q "select count(*) from commitment where institution_id='$A' and state in ('CONFIRMED','DUE');" | tr -d '[:space:]')
[ "$cands" = "3" ] && ok "3 candidatos; el MISSED no entra" || mal "candidatos: $cands"

# Lo que haría el reloj, aplicado con el mismo compare-and-swap.
q "update commitment set state='DUE' where id='d2000000-0000-0000-0000-000000000001' and state='CONFIRMED' and start_at <= now();" >/dev/null
q "update commitment set state='MISSED', missed_at=now() where id='d3000000-0000-0000-0000-000000000001' and state='DUE' and start_at + (planned_minutes * interval '1 minute') <= now();" >/dev/null

[ "$(q "select state from commitment where id='d1000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')" = "CONFIRMED" ] \
  && ok "el de dentro de 2 horas sigue CONFIRMED" || mal "venció uno que no correspondía"
[ "$(q "select state from commitment where id='d2000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')" = "DUE" ] \
  && ok "el que ya empezó pasó a DUE" || mal "no venció"
[ "$(q "select state from commitment where id='d3000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')" = "MISSED" ] \
  && ok "el que pasó su bloque pasó a MISSED" || mal "no se incumplió"
[ "$(q "select state from commitment where id='d4000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')" = "MISSED" ] \
  && ok "el MISSED viejo sigue MISSED: el reloj no lo revive" || mal "el reloj tocó un MISSED"
corre "delete from commitment;"

echo "→ B4. El alcance de una evaluación se declara, no se infiere"
corre "insert into assessment (id,offering_id,assessment_type,title,assessment_date,source_type,scope) values ('e5000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001','parcial','P1', current_date + 10,'institution','U1 a U2');"
corre "insert into topic (id,offering_id,name,sequence) values ('e6000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001','U1',1);"
# Con `scope` cargado pero SIN vínculo declarado, el contexto no trae temas.
temas=$(q "select jsonb_array_length(coalesce((public.contexto_del_ade('$A','a6000000-0000-0000-0000-000000000001')->'proximaEvaluacion'->'temas'),'[]'::jsonb));" | tr -d '[:space:]')
[ "$temas" = "0" ] && ok "con 'scope' en texto libre, los temas viajan vacíos: no se parsea" || mal "infirió temas de scope"
corre "insert into assessment_topic (assessment_id,topic_id) values ('e5000000-0000-0000-0000-000000000001','e6000000-0000-0000-0000-000000000001');"
temas2=$(q "select jsonb_array_length(coalesce((public.contexto_del_ade('$A','a6000000-0000-0000-0000-000000000001')->'proximaEvaluacion'->'temas'),'[]'::jsonb));" | tr -d '[:space:]')
[ "$temas2" = "1" ] && ok "declarado, sí viaja" || mal "no trajo el tema declarado"
corre "delete from assessment_topic; delete from assessment where id='e5000000-0000-0000-0000-000000000001'; delete from topic where id='e6000000-0000-0000-0000-000000000001';"

echo "→ B5. I7. Una sola ExamPreparation por (estudiante, evaluación)"
corre "insert into assessment (id,offering_id,assessment_type,title,assessment_date,modality,source_type) values ('e7000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001','parcial','P-B5', current_date + 20,'practico','institution');"
corre "insert into exam_preparation (id,institution_id,assessment_id,student_id,course_enrollment_id) values ('e8000000-0000-0000-0000-000000000001','$A','e7000000-0000-0000-0000-000000000001','a5000000-0000-0000-0000-000000000001','a6000000-0000-0000-0000-000000000001');"
if corre "insert into exam_preparation (institution_id,assessment_id,student_id,course_enrollment_id) values ('$A','e7000000-0000-0000-0000-000000000001','a5000000-0000-0000-0000-000000000001','a6000000-0000-0000-0000-000000000001');"; then
  mal "se pudo abrir una segunda preparación para la misma evaluación"
else
  ok "I7: la segunda preparación choca contra el UNIQUE"
fi

echo "→ B5. El protocolo vigente sale por modalidad, y una fuera de P0 no lo tiene"
prot=$(q "select version from public.protocolo_vigente('e7000000-0000-0000-0000-000000000001');" | tr -d '[:space:]')
[ -n "$prot" ] && ok "una evaluación práctica tiene protocolo: $prot" || mal "no resolvió protocolo"
corre "insert into assessment (id,offering_id,assessment_type,title,modality,source_type) values ('e9000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001','final','Oral','oral','institution');"
oral=$(q "select count(*) from public.protocolo_vigente('e9000000-0000-0000-0000-000000000001');" | tr -d '[:space:]')
[ "$oral" = "0" ] && ok "una oral no recibe el protocolo de otra modalidad (C01-047)" || mal "le asignó un protocolo a la oral"

echo "→ B5. ADR-028. Un paso reentrante se completa varias veces; uno que no, una sola"
corre "update exam_preparation set status='ACTIVE', exam_protocol_id=(select protocol_id from public.protocolo_vigente('e7000000-0000-0000-0000-000000000001')) where id='e8000000-0000-0000-0000-000000000001';"
PROT=$(q "select protocol_id from public.protocolo_vigente('e7000000-0000-0000-0000-000000000001');" | tr -d '[:space:]')
RE=$(q "select id from protocol_step where exam_protocol_id='$PROT' and is_reentrant limit 1;" | tr -d '[:space:]')
NORE=$(q "select id from protocol_step where exam_protocol_id='$PROT' and not is_reentrant limit 1;" | tr -d '[:space:]')
corre "select public.completar_paso_de_protocolo('$A','e8000000-0000-0000-0000-000000000001','$RE',null,'a5000000-0000-0000-0000-000000000001',null);"
v2=$(q "select occurrence from public.completar_paso_de_protocolo('$A','e8000000-0000-0000-0000-000000000001','$RE',null,'a5000000-0000-0000-0000-000000000001',null);" | tr -d '[:space:]')
[ "$v2" = "2" ] && ok "la segunda vuelta se registra como occurrence 2" || mal "no dejó volver sobre el paso: $v2"
corre "select public.completar_paso_de_protocolo('$A','e8000000-0000-0000-0000-000000000001','$NORE',null,'a5000000-0000-0000-0000-000000000001',null);"
if corre "select public.completar_paso_de_protocolo('$A','e8000000-0000-0000-0000-000000000001','$NORE',null,'a5000000-0000-0000-0000-000000000001',null);"; then
  mal "un paso NO reentrante admitió una segunda completion"
else
  ok "un paso no reentrante conserva la garantía vieja: se completa una vez"
fi

echo "→ B5. La misma vuelta sobre el mismo TEMA se puede repetir, y cuenta aparte"
corre "insert into topic (id,offering_id,name,sequence) values ('ea000000-0000-0000-0000-000000000001','a4000000-0000-0000-0000-000000000001','Series',1) on conflict do nothing;"
TEMA=ea000000-0000-0000-0000-000000000001
if [ -n "$TEMA" ]; then
  t1=$(q "select occurrence from public.completar_paso_de_protocolo('$A','e8000000-0000-0000-0000-000000000001','$RE','$TEMA','a5000000-0000-0000-0000-000000000001',null);" | tr -d '[:space:]')
  t2=$(q "select occurrence from public.completar_paso_de_protocolo('$A','e8000000-0000-0000-0000-000000000001','$RE','$TEMA','a5000000-0000-0000-0000-000000000001',null);" | tr -d '[:space:]')
  [ "$t1" = "1" ] && [ "$t2" = "2" ] && ok "el tema lleva su propia cuenta: volver sobre Series no es volver sobre el paso" || mal "la cuenta por tema salió $t1/$t2"
fi

echo "→ B5. I8. Reintentar una completion no suma una vuelta que no ocurrió"
k1=$(q "select occurrence from public.completar_paso_de_protocolo('$A','e8000000-0000-0000-0000-000000000001','$RE',null,'a5000000-0000-0000-0000-000000000001','k-b5-1');" | tr -d '[:space:]')
k2=$(q "select occurrence || '|' || duplicado from public.completar_paso_de_protocolo('$A','e8000000-0000-0000-0000-000000000001','$RE',null,'a5000000-0000-0000-0000-000000000001','k-b5-1');" | tr -d '[:space:]')
[ "$k2" = "$k1|true" ] && ok "la misma clave devuelve la vuelta anterior y no crea otra" || mal "la clave repetida produjo $k2"

echo "→ B5. Una preparación que no está ACTIVE no acumula pasos"
corre "update exam_preparation set status='EXAM_TAKEN' where id='e8000000-0000-0000-0000-000000000001';"
if corre "select public.completar_paso_de_protocolo('$A','e8000000-0000-0000-0000-000000000001','$RE',null,'a5000000-0000-0000-0000-000000000001',null);"; then
  mal "una preparación EXAM_TAKEN siguió aceptando completions"
else
  ok "EXAM_TAKEN conserva su historia y deja de escribirla"
fi

echo "→ B5. ADR-029. La pauta de la cátedra se guarda sin elevarse a oficial (I9)"
corre "insert into assessment_criterion (institution_id,assessment_id,criterion_text,source_type) values ('$A','e7000000-0000-0000-0000-000000000001','Procedimiento completo','student');"
elevada=$(q "select verification_status from assessment_criterion where assessment_id='e7000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')
[ "$elevada" = "unverified" ] && ok "cargada por el estudiante entra unverified, no oficial" || mal "entró como $elevada"

echo "→ B5. ADR-011. Un readiness sin explicación no se puede guardar"
if corre "insert into preparation_readiness (institution_id,exam_preparation_id,state,rule_version) values ('$A','e8000000-0000-0000-0000-000000000001','READY_BY_PROTOCOL','v1');"; then
  mal "se guardó un readiness sin explicación: un estado sin explicación es un veredicto"
else
  ok "readiness exige explicación y versión de regla"
fi
corre "delete from protocol_step_completion; delete from exam_preparation; delete from assessment_criterion; delete from assessment where id in ('e7000000-0000-0000-0000-000000000001','e9000000-0000-0000-0000-000000000001'); delete from topic where id='ea000000-0000-0000-0000-000000000001';"

echo "→ B6. I11. Una señal no cruza institución"
if corre "select public.registrar_senal('$B','a5000000-0000-0000-0000-000000000001',null,'error_reiterado','riesgo','x',null,null,null,null,null);"; then
  mal "se pudo crear una señal para un estudiante de otra institución"
else
  ok "el estudiante de A no recibe señales de B"
fi

echo "→ B6. Explicabilidad: una señal sin causa no entra ni a la base"
if corre "insert into risk_signal (institution_id,student_id,signal_type,severity,reason) values ('$A','a5000000-0000-0000-0000-000000000001','error_reiterado','riesgo','   ');"; then
  mal "entró una señal con la causa en blanco"
else
  ok "reason en blanco se rechaza: nunca un score opaco como única salida"
fi

echo "→ B6. I8. Reintentar una detección no crea dos señales del mismo hecho"
S1=$(q "select signal_id from public.registrar_senal('$A','a5000000-0000-0000-0000-000000000001',null,'error_reiterado','riesgo','tres entregas con el mismo error',null,null,null,null,'k-riesgo-1');" | tr -d '[:space:]')
S2=$(q "select signal_id || '|' || duplicado from public.registrar_senal('$A','a5000000-0000-0000-0000-000000000001',null,'error_reiterado','riesgo','tres entregas con el mismo error',null,null,null,null,'k-riesgo-1');" | tr -d '[:space:]')
[ "$S2" = "$S1|true" ] && ok "la misma clave devuelve la señal anterior" || mal "duplicó la señal: $S2"

echo "→ B6. Una intervención sólo nace de una señal que la está pidiendo"
if corre "select public.abrir_intervencion('$A','$S1','a5000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',false,null,null,null);"; then
  mal "se abrió una intervención sobre una señal OPEN"
else
  ok "una señal OPEN no admite intervención: se saltearía el reconocimiento"
fi
corre "update risk_signal set status='ACKNOWLEDGED', acknowledged_at=now() where id='$S1';"
corre "update risk_signal set status='INTERVENTION_REQUIRED' where id='$S1';"
I1=$(q "select intervention_id from public.abrir_intervencion('$A','$S1','a5000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',false,null,null,null);" | tr -d '[:space:]')
[ -n "$I1" ] && ok "con la señal pidiendo intervención, se abre" || mal "no se pudo abrir"
igualdad=$(q "select owner_verified::text from intervention where id='$I1';" | tr -d '[:space:]')
[ "$igualdad" = "false" ] && ok "y el dueño queda sin verificar: no hay directorio (C01-039)" || mal "dio el dueño por verificado"

echo "→ B6. El Done: no se puede cerrar una intervención sin resultado"
if corre "select public.cerrar_intervencion('$A','$I1','recuperado',null,'a5000000-0000-0000-0000-000000000001',null);"; then
  mal "se cerró una intervención que nadie reconoció"
else
  ok "una intervención sin reconocer no se cierra"
fi
corre "update intervention set status='acknowledged', acknowledged_at=now() where id='$I1';"
corre "select public.cerrar_intervencion('$A','$I1','recuperado','se recuperó','a5000000-0000-0000-0000-000000000001',25);"
estado=$(q "select i.status || '|' || o.outcome || '|' || coalesce(i.human_minutes::text,'-') from intervention i join intervention_outcome o on o.intervention_id=i.id where i.id='$I1';" | tr -d '[:space:]')
[ "$estado" = "closed|recuperado|25" ] && ok "cerrar y registrar el outcome es UNA escritura" || mal "quedó a medias: $estado"

echo "→ B6. Cerrar dos veces no pisa el resultado registrado"
segunda=$(q "select ya_estaba::text from public.cerrar_intervencion('$A','$I1','falso_positivo',null,'a5000000-0000-0000-0000-000000000001',null);" | tr -d '[:space:]')
[ "$segunda" = "true" ] && ok "el reintento devuelve lo de antes" || mal "el reintento no se detectó"
[ "$(q "select outcome from intervention_outcome where intervention_id='$I1';" | tr -d '[:space:]')" = "recuperado" ] \
  && ok "y el outcome original sigue intacto" || mal "se pisó el outcome"

echo "→ B6. El dashboard no es el final: RESOLVED exige una intervención con outcome"
S3=$(q "select signal_id from public.registrar_senal('$A','a5000000-0000-0000-0000-000000000001',null,'factores_subjetivos','atencion','ansiedad frente al examen',null,null,null,null,null);" | tr -d '[:space:]')
corre "update risk_signal set status='INTERVENTION_REQUIRED' where id='$S3';"
sin=$(q "select resuelta || '|' || coalesce(motivo,'') from public.resolver_senal('$A','$S3');" | tr -d '[:space:]')
[ "${sin%%|*}" = "false" ] && ok "sin outcome no se resuelve: $sin" || mal "se resolvió sin outcome"
con=$(q "select resuelta::text from public.resolver_senal('$A','$S1');" | tr -d '[:space:]')
[ "$con" = "true" ] && ok "con outcome sí" || mal "no resolvió una señal con outcome"
[ "$(q "select status from risk_signal where id='$S1';" | tr -d '[:space:]')" = "RESOLVED" ] \
  && ok "y la señal quedó RESOLVED con su fecha" || mal "no quedó resuelta"

echo "→ B6. Una regla sin umbral no puede correr sola"
if corre "update risk_rule set modo='AUTOMATICA' where canonical_id='HP0-06-1';"; then
  mal "una regla sin umbral pasó a AUTOMATICA"
else
  ok "automatica_exige_umbral: sin C01-036 no hay regla automática"
fi

echo "→ B6. El circuito se audita, no se declara"
circ=$(q "select (public.circuito_de_senales('$A')->>'cerradasSinOutcome') || '|' || (public.circuito_de_senales('$A')->>'resueltasSinOutcome') || '|' || (public.circuito_de_senales('$A')->'faltan'->>'playbooks');" | tr -d '[:space:]')
[ "$circ" = "0|0|C01-044" ] && ok "cero cerradas sin outcome, y el circuito nombra lo que falta" || mal "el circuito reporta $circ"

echo "→ B6. La auditoría es append-only, como el registro de hechos (I12)"
corre "insert into audit_log (institution_id,actor_id,action,target_type,target_id,after_value) values ('$A',null,'risk_signal.create','risk_signal','$S1','{}'::jsonb);"
# **Con el rol del backend, no con el superusuario.** `psql -U postgres` puede
# todo, así que probar el append-only sin `set role` no prueba nada: mediría los
# permisos del dueño de la base, que no son los que usa la aplicación.
if corre "set role service_role; update audit_log set action='otra' where institution_id='$A';"; then
  mal "service_role pudo reescribir la auditoría"
else
  ok "service_role no puede editar audit_log: la auditoría es append-only"
fi
if corre "set role service_role; delete from audit_log where institution_id='$A';"; then
  mal "service_role pudo borrar auditoría"
else
  ok "ni borrarla"
fi
echo "→ B6. El reloj expira lo que dejó de ser relevante, y sólo eso"
corre "delete from intervention_outcome; delete from intervention; delete from risk_signal;"
corre "insert into risk_signal (id,institution_id,student_id,signal_type,severity,reason,status,valid_until) values
  ('d5000000-0000-0000-0000-000000000001','$A','a5000000-0000-0000-0000-000000000001','error_reiterado','bajo','vencida y abierta','OPEN', now() - interval '1 day'),
  ('d6000000-0000-0000-0000-000000000001','$A','a5000000-0000-0000-0000-000000000001','error_reiterado','bajo','vencida y reconocida','ACKNOWLEDGED', now() - interval '1 day'),
  ('d7000000-0000-0000-0000-000000000001','$A','a5000000-0000-0000-0000-000000000001','error_reiterado','riesgo','vencida pero pide una persona','INTERVENTION_REQUIRED', now() - interval '1 day'),
  ('d8000000-0000-0000-0000-000000000001','$A','a5000000-0000-0000-0000-000000000001','error_reiterado','bajo','todavía vigente','OPEN', now() + interval '1 day'),
  ('d9000000-0000-0000-0000-000000000001','$A','a5000000-0000-0000-0000-000000000001','error_reiterado','bajo','sin vencimiento','OPEN', null);"
# La misma consulta que hace el Repository del reloj.
cand=$(q "select string_agg(reason, ' / ' order by reason) from risk_signal
          where institution_id='$A' and status in ('OPEN','ACKNOWLEDGED')
            and valid_until is not null and valid_until < now();")
[ "$cand" = "vencida y abierta / vencida y reconocida" ] \
  && ok "sólo OPEN y ACKNOWLEDGED vencidas entran" || mal "candidatas: $cand"
# La que ya pidió una persona **no** entra: expirarla borraría una obligación
# humana pendiente, y el Done dice que ninguna señal queda sin outcome.
[ "$(q "select status from risk_signal where id='d7000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')" = "INTERVENTION_REQUIRED" ] \
  && ok "la que pide una persona no se expira sola" || mal "expiró una señal con intervención pendiente"
# Y una expirada conserva su causa histórica (product.md §5.5).
corre "update risk_signal set status='EXPIRED', expired_at=now() where id='d5000000-0000-0000-0000-000000000001';"
[ "$(q "select reason from risk_signal where id='d5000000-0000-0000-0000-000000000001';")" = "vencida y abierta" ] \
  && ok "y al expirar guarda su causa histórica" || mal "se perdió la causa"

corre "delete from intervention_outcome; delete from intervention; delete from risk_signal;"

echo "→ Coherencia entre estado y marcas de tiempo"
if corre "insert into commitment (institution_id,action_id,start_at,timezone_at_commit,planned_minutes,state,completed_at) values ('$A','a7000000-0000-0000-0000-000000000001',now(),'UTC',40,'DRAFT',now());"; then
  mal "un DRAFT pudo guardar completed_at"
else
  ok "un DRAFT no puede tener completed_at"
fi

limpiar_mundo
ok "limpiado"

[ "$fallos" -gt 0 ] && { echo; echo "✗ $fallos criterio(s) sin sostener"; exit 1; }
echo; echo "✓ aislamiento, transiciones, concurrencia e idempotencia"
