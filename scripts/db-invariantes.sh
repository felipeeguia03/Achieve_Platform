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

echo "→ Datos sintéticos de prueba"
q "begin; \
   insert into institution (id,name) values ('11111111-1111-1111-1111-111111111111','Institución SYN'); \
   insert into academic_program (id,institution_id,name) values ('22222222-2222-2222-2222-222222222222','11111111-1111-1111-1111-111111111111','Programa SYN'); \
   insert into curriculum_plan (id,program_id,version) values ('33333333-3333-3333-3333-333333333333','22222222-2222-2222-2222-222222222222','v1'); \
   insert into course (id,curriculum_plan_id,code,name) values ('44444444-4444-4444-4444-444444444444','33333333-3333-3333-3333-333333333333','SYN-001','Materia SYN'); \
   insert into course_offering (id,course_id,term) values ('55555555-5555-5555-5555-555555555555','44444444-4444-4444-4444-444444444444','2026-2'); \
   insert into topic (id,course_id,name) values ('66666666-6666-6666-6666-666666666666','44444444-4444-4444-4444-444444444444','Unidad SYN'); \
   commit;" | tail -1
if [ "$(q "select count(*) from course_offering;" | tr -d '[:space:]')" != "1" ]; then
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

q "delete from resource; delete from assessment; delete from topic; delete from course_offering; delete from course; delete from curriculum_plan; delete from academic_program; delete from institution;" >/dev/null
echo "   ✓ datos de prueba limpiados"

if [ "$fallos" -gt 0 ]; then echo; echo "✗ $fallos invariante(s) sin sostener"; exit 1; fi
echo; echo "✓ los constraints rechazan lo que el spec prohíbe"
