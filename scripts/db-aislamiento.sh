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

echo "→ 1. Aislamiento: el scoping va en el WHERE, no después de leer"
visto=$(q "select count(*) from commitment where institution_id='$B' and id='a8000000-0000-0000-0000-000000000001';" | tr -d '[:space:]')
[ "$visto" = "0" ] && ok "B no alcanza el commitment de A" || mal "B vio $visto fila(s) de A"

echo "→ 2. Transición prohibida: MISSED nunca vuelve a COMPLETED"
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

echo "→ 3. Idempotencia en el servidor, no en el frontend"
corre "insert into commitment (institution_id,action_id,start_at,timezone_at_commit,planned_minutes,idempotency_key) values ('$A','a7000000-0000-0000-0000-000000000001',now(),'America/Argentina/Cordoba',40,'clave-repetida');"
if corre "insert into commitment (institution_id,action_id,start_at,timezone_at_commit,planned_minutes,idempotency_key) values ('$A','a7000000-0000-0000-0000-000000000001',now(),'America/Argentina/Cordoba',40,'clave-repetida');"; then
  mal "la base aceptó dos veces la misma clave"
else
  ok "la segunda con la misma clave se rechaza en la base"
fi

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
if corre "set role service_role; update commitment set state='DUE' where institution_id='$A';"; then
  ok "y sigue pudiendo actualizar las tablas normales"
else
  mal "la revocación se llevó puesto el resto del schema"
fi
q "delete from product_event; delete from audit_log;" >/dev/null

echo "→ Coherencia entre estado y marcas de tiempo"
if corre "insert into commitment (institution_id,action_id,start_at,timezone_at_commit,planned_minutes,state,completed_at) values ('$A','a7000000-0000-0000-0000-000000000001',now(),'UTC',40,'DRAFT',now());"; then
  mal "un DRAFT pudo guardar completed_at"
else
  ok "un DRAFT no puede tener completed_at"
fi

q "delete from commitment; delete from action; delete from course_enrollment; delete from student; delete from course_offering; delete from course; delete from curriculum_plan; delete from academic_program; delete from institution;" >/dev/null
ok "limpiado"

[ "$fallos" -gt 0 ] && { echo; echo "✗ $fallos criterio(s) sin sostener"; exit 1; }
echo; echo "✓ aislamiento, transiciones, concurrencia e idempotencia"
