#!/usr/bin/env bash
# Achieve Platform · Etapa B1.2 — los constraints rechazan lo que el spec prohíbe.
#
# Un `CHECK` escrito no es un `CHECK` que funciona. Cada caso de abajo INTENTA
# insertar algo que `docs/data-model.md` §7 declara imposible y falla si la base
# lo acepta.
set -uo pipefail
CONTENEDOR="supabase_db_achieve-platform"
docker exec "$CONTENEDOR" true 2>/dev/null || { echo "✗ stack apagado: npm run db:start"; exit 1; }

q() { docker exec -i "$CONTENEDOR" psql -U postgres -d postgres -tAX -v ON_ERROR_STOP=1 -c "$1" 2>&1; }
fallos=0

# El veredicto sale del CÓDIGO DE SALIDA de psql, no del texto del error:
# grepear "ERROR" ata el test al idioma y al formato de mensajes de Postgres, y
# un helper roto se ve igual que un schema permisivo. Aprendido a los golpes en
# la primera corrida de esta misma etapa.
# Devuelve 0 si el SQL CORRIÓ, 1 si la base lo rechazó. El nombre importa: se
# llamaba `falla` y devolvía 0 en el caso de éxito, lo que hizo que `acepta`
# reportara al revés durante media etapa.
corre() { docker exec -i "$CONTENEDOR" psql -U postgres -d postgres -tAX -v ON_ERROR_STOP=1 -c "$1" >/dev/null 2>&1; }

# rechaza <descripción> <sql que debe fallar>
rechaza() {
  local desc="$1" sql="$2"
  if corre "$sql"; then
    echo "   ✗ $desc — LA BASE LO ACEPTÓ"; fallos=$((fallos + 1))
  else
    echo "   ✓ $desc"
  fi
}
acepta() {
  local desc="$1" sql="$2"
  if corre "$sql"; then
    echo "   ✓ $desc"
  else
    echo "   ✗ $desc — la base lo rechazó y no debería"; fallos=$((fallos + 1))
  fi
}

# Los fixtures de este script tienen UUID fijo, y la limpieza borra SÓLO esos.
# Antes borraba las tablas enteras, así que arrasaba con cualquier dato sintético
# que no fuera suyo —el de `db:demo`, por ejemplo—. Un verificador no puede
# destruir lo que no creó.
#
# El orden respeta las FK: `RESTRICT` obliga a ir de la hoja a la raíz. Lo que
# crean las comprobaciones —`assessment`, `resource`, `class_session`,
# `topic_progress`— cae por `CASCADE` desde la cursada y la inscripción.
limpiar_fixtures() {
  q "delete from progress_entry where course_enrollment_id='88888888-8888-8888-8888-888888888888'; \
     delete from product_event where institution_id='11111111-1111-1111-1111-111111111111'; \
     delete from topic_progress where course_enrollment_id='88888888-8888-8888-8888-888888888888'; \
     delete from course_enrollment where id='88888888-8888-8888-8888-888888888888'; \
     delete from student where id='77777777-7777-7777-7777-777777777777'; \
     delete from course_offering where id='55555555-5555-5555-5555-555555555555'; \
     delete from course where id='44444444-4444-4444-4444-444444444444'; \
     delete from curriculum_plan where id='33333333-3333-3333-3333-333333333333'; \
     delete from academic_program where id='22222222-2222-2222-2222-222222222222'; \
     delete from institution where id='11111111-1111-1111-1111-111111111111';" >/dev/null 2>&1
}
# `trap EXIT` y no una línea al final: la corrida que se iba por `exit 1` era
# justo la que dejaba sus filas puestas, y con eso garantizaba que la siguiente
# también fallara. El script se autoenvenenaba.
trap limpiar_fixtures EXIT

echo "→ Datos sintéticos de prueba"
limpiar_fixtures  # por si una corrida vieja dejó las suyas
q "begin; \
   insert into institution (id,name) values ('11111111-1111-1111-1111-111111111111','Institución SYN'); \
   insert into academic_program (id,institution_id,name) values ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','Programa SYN'); \
   insert into curriculum_plan (id,program_id,version) values ('33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222','v1'); \
   insert into course (id,curriculum_plan_id,code,name) values ('44444444-4444-4444-4444-444444444444','33333333-3333-3333-3333-333333333333','SYN-001','Materia SYN'); \
   insert into course_offering (id,course_id,term) values ('55555555-5555-5555-5555-555555555555','44444444-4444-4444-4444-444444444444','2026-2'); \
   insert into topic (id,course_id,name) values ('66666666-6666-6666-6666-666666666666','44444444-4444-4444-4444-444444444444','Unidad SYN'); \
   insert into student (id,institution_id) values ('77777777-7777-7777-7777-777777777777','11111111-1111-1111-1111-111111111111'); \
   insert into course_enrollment (id,institution_id,student_id,offering_id) values ('88888888-8888-8888-8888-888888888888','11111111-1111-1111-1111-111111111111','77777777-7777-7777-7777-777777777777','55555555-5555-5555-5555-555555555555'); \
   commit;" | tail -1
# La precondición mira SUS filas, no el tamaño de la tabla: exigir
# `count(*) = 1` sobre `course_offering` entera es asumir que nadie más usa la
# base, y basta una cursada de `db:demo` para que el verificador se caiga sin
# que haya un solo invariante roto.
if [ "$(q "select count(*) from course_offering where id='55555555-5555-5555-5555-555555555555';" | tr -d '[:space:]')" != "1" ]; then
  echo "   ✗ el setup no dejó los datos sintéticos"; exit 1
fi
echo "   ✓ cargados"

echo "→ Un topic tiene que colgar de algo (topic_belongs_somewhere)"
rechaza "topic sin offering ni course" \
  "insert into topic (name) values ('huérfano');"

echo "→ Un tema no es prerequisito de sí mismo (no_self_prerequisite)"
rechaza "prerequisito reflexivo" \
  "insert into topic_prerequisite (topic_id,prerequisite_id) values ('66666666-6666-6666-6666-666666666666','66666666-6666-6666-6666-666666666666');"

echo "→ Provenance: los enums son cerrados"
rechaza "source_type inventado" \
  "insert into class_session (offering_id,session_date,source_type) values ('55555555-5555-5555-5555-555555555555','2026-09-01','telepatia');"
rechaza "verification_status inventado" \
  "insert into class_session (offering_id,session_date,source_type,verification_status) values ('55555555-5555-5555-5555-555555555555','2026-09-01','institution','casi_oficial');"
rechaza "confidence fuera de [0,1]" \
  "insert into class_session (offering_id,session_date,source_type,confidence) values ('55555555-5555-5555-5555-555555555555','2026-09-01','institution',1.5);"

echo "→ Modalidad: 'oral' se ALMACENA aunque quede fuera de P0 (C01-047)"
acepta "assessment con modality='oral'" \
  "insert into assessment (offering_id,assessment_type,title,modality,source_type) values ('55555555-5555-5555-5555-555555555555','final','Final SYN','oral','institution');"
rechaza "modality inventada" \
  "insert into assessment (offering_id,assessment_type,title,modality,source_type) values ('55555555-5555-5555-5555-555555555555','final','X','multiple_choice','institution');"

echo "→ Fecha de evaluación desconocida: se permite NULL, no se estima"
acepta "assessment sin fecha" \
  "insert into assessment (offering_id,assessment_type,title,source_type) values ('55555555-5555-5555-5555-555555555555','parcial','Parcial SYN','institution');"

echo "→ Derechos: el default no presume permiso"
if [ "$(q "insert into resource (offering_id,resource_type,title,source_type) values ('55555555-5555-5555-5555-555555555555','pdf','Apunte SYN','instructor') returning rights_status;" | head -1)" = "unknown" ]; then
  echo "   ✓ rights_status arranca en 'unknown'"
else
  echo "   ✗ rights_status no arranca en 'unknown'"; fallos=$((fallos + 1))
fi

echo "→ §8 · «Sin datos no es cero» (el invariante que más se rompe)"
rechaza "domain_state='not_evaluated' CON un número guardado" \
  "insert into topic_progress (institution_id,course_enrollment_id,topic_id,domain_state,domain_value) values ('11111111-1111-1111-1111-111111111111','88888888-8888-8888-8888-888888888888','66666666-6666-6666-6666-666666666666','not_evaluated',0);"
rechaza "domain_state='value' SIN número" \
  "insert into topic_progress (institution_id,course_enrollment_id,topic_id,domain_state) values ('11111111-1111-1111-1111-111111111111','88888888-8888-8888-8888-888888888888','66666666-6666-6666-6666-666666666666','value');"
acepta "un dominio realmente 0, declarado como valor" \
  "insert into topic_progress (institution_id,course_enrollment_id,topic_id,domain_state,domain_value) values ('11111111-1111-1111-1111-111111111111','88888888-8888-8888-8888-888888888888','66666666-6666-6666-6666-666666666666','value',0);"

echo "→ §8 · La confianza siempre lleva su fecha"
rechaza "confidence_state='value' sin confidence_declared_at" \
  "update topic_progress set confidence_state='value', confidence_value=1 where course_enrollment_id='88888888-8888-8888-8888-888888888888';"
acepta "confianza con su fecha" \
  "update topic_progress set confidence_state='value', confidence_value=1, confidence_declared_at=now() where course_enrollment_id='88888888-8888-8888-8888-888888888888';"

echo "→ §8 · No hay score agregado, y no se puede agregar por descuido"
if [ "$(q "select count(*) from information_schema.columns where table_name='topic_progress' and (column_name like '%score%' or column_name like '%overall%' or column_name='progress');" | tr -d '[:space:]')" = "0" ]; then
  echo "   ✓ ninguna columna de score agregado (DD5, P-03)"
else
  echo "   ✗ apareció una columna de score agregado"; fallos=$((fallos + 1))
fi

echo "→ §8 · updated_at se toca solo (set_updated_at de la B1.1)"
antes=$(q "select updated_at from topic_progress where course_enrollment_id='88888888-8888-8888-8888-888888888888';" | tr -d '[:space:]')
q "update topic_progress set recency_at=now() where course_enrollment_id='88888888-8888-8888-8888-888888888888';" >/dev/null
despues=$(q "select updated_at from topic_progress where course_enrollment_id='88888888-8888-8888-8888-888888888888';" | tr -d '[:space:]')
if [ "$antes" != "$despues" ]; then
  echo "   ✓ el trigger lo actualizó sin que lo pidiera el UPDATE"
else
  echo "   ✗ updated_at no cambió"; fallos=$((fallos + 1))
fi

echo "→ §8 · Borrar la identidad de auth no borra al estudiante"
if [ "$(q "select count(*) from pg_constraint c join pg_class t on t.oid=c.conrelid where t.relname='student' and c.conname='student_auth_user_id_fkey' and c.confdeltype='n';" | tr -d '[:space:]')" = "1" ]; then
  echo "   ✓ ON DELETE SET NULL, no CASCADE"
else
  echo "   ✗ la FK a auth.users no es SET NULL"; fallos=$((fallos + 1))
fi

echo "→ Aislamiento: RLS niega al rol anónimo"
# Dos formas legítimas de negar, y las dos cuentan: sin GRANT, Postgres corta
# antes de RLS; con GRANT, RLS sin política devuelve cero filas. Lo que se
# verifica es que `anon` **no lee**, no por cuál de los dos mecanismos.
visto=$(q "set role anon; select count(*) from institution;" | tr -d '[:space:]')
if [ "$visto" = "0" ]; then
  echo "   ✓ anon no ve filas (RLS sin política)"
elif echo "$visto" | grep -qi "permissiondenied"; then
  echo "   ✓ anon no llega a la tabla (sin GRANT; RLS queda detrás como cierre)"
else
  echo "   ✗ anon leyó: '$visto'"; fallos=$((fallos + 1))
fi

echo "→ B3.1 · registrar_progreso escribe el resultado, o no escribe nada"
INS=11111111-1111-1111-1111-111111111111
CE=88888888-8888-8888-8888-888888888888
TOP=66666666-6666-6666-6666-666666666666

acepta "un cambio declarado se registra" \
  "select public.registrar_progreso('$INS','$CE','$TOP',null,null,null,'progress_updated',now(),
     '[{\"dimension\":\"practice\",\"valor\":19,\"texto\":\"19 ejercicios\"}]'::jsonb,
     false,null,'k-b31-1');"

# La transacción: la entrada y la dimensión se escriben juntas. Si sólo se
# escribiera la entrada, la Bitácora afirmaría un cambio que las dimensiones no
# reflejan.
if [ "$(q "select practice_state from topic_progress where course_enrollment_id='$CE' and topic_id='$TOP';" | tr -d '[:space:]')" = "value" ]; then
  echo "   ✓ la dimensión quedó medida en la misma transacción"
else
  echo "   ✗ la entrada se escribió y la dimensión no"; fallos=$((fallos + 1))
fi

# `I8`: el mismo registro dos veces produce UNA entrada. Un reintento de red no
# puede duplicar el avance de un estudiante.
q "select public.registrar_progreso('$INS','$CE','$TOP',null,null,null,'progress_updated',now(),
     '[{\"dimension\":\"practice\",\"valor\":19}]'::jsonb,false,null,'k-b31-1');" >/dev/null 2>&1
if [ "$(q "select count(*) from progress_entry where idempotency_key='k-b31-1';" | tr -d '[:space:]')" = "1" ]; then
  echo "   ✓ I8 · el mismo registro dos veces deja una sola entrada"
else
  echo "   ✗ I8 · el reintento duplicó el avance"; fallos=$((fallos + 1))
fi
if [ "$(q "select duplicado from public.registrar_progreso('$INS','$CE','$TOP',null,null,null,'progress_updated',now(),'[{\"dimension\":\"practice\",\"valor\":19}]'::jsonb,false,null,'k-b31-1');" | tr -d '[:space:]')" = "t" ]; then
  echo "   ✓ y lo dice: el segundo intento vuelve marcado como duplicado"
else
  echo "   ✗ el duplicado no se declara como tal"; fallos=$((fallos + 1))
fi

rechaza "I10 · una entrada que no afirma nada tampoco entra por la función" \
  "select public.registrar_progreso('$INS','$CE','$TOP',null,null,null,'progress_updated',now(),
     '[]'::jsonb,false,null,null);"
rechaza "una dimensión inventada es rechazada por la base" \
  "select public.registrar_progreso('$INS','$CE','$TOP',null,null,null,'progress_updated',now(),
     '[{\"dimension\":\"motivacion\",\"valor\":1}]'::jsonb,false,null,null);"
rechaza "I11 · no se puede registrar progreso en una cursada de otra institución" \
  "select public.registrar_progreso('99999999-9999-9999-9999-999999999999','$CE','$TOP',null,null,null,
     'progress_updated',now(),'[{\"dimension\":\"practice\",\"valor\":1}]'::jsonb,false,null,null);"

acepta "un no-cambio declarado también es un resultado válido" \
  "select public.registrar_progreso('$INS','$CE','$TOP',null,null,null,'progress_no_change',now(),
     '[]'::jsonb,true,'La entrega no cubre la unidad completa.','k-b31-2');"

limpiar_fixtures
echo "   ✓ datos de prueba limpiados"

if [ "$fallos" -gt 0 ]; then echo; echo "✗ $fallos invariante(s) sin sostener"; exit 1; fi
echo; echo "✓ los constraints rechazan lo que el spec prohíbe"
