#!/usr/bin/env bash
#
# ⚠️ **`db:verify` importa el catálogo justo antes de llamar a este script.** No es
# comodidad: `db-aislamiento.sh` corre tercero y **vacía el mundo académico**, así
# que para cuando llega este verificador el catálogo ya no está. Antes esto no se
# notaba porque la limpieza de aislamiento fallaba en silencio y no borraba nada;
# al arreglarla apareció el orden real.
# Achieve Platform · Etapa B6.14 — el catálogo curricular y el alta, contra Postgres.
#
# `npm test` prueba el **dominio** con dobles: qué se preselecciona, qué versión
# de plan corresponde, qué pasa con un doble submit. Acá se prueba lo que ninguna
# suite sin Docker puede probar:
#
#   · que un plan `DRAFT` **no sale** de las funciones de lectura del alta;
#   · que los `UNIQUE` rechazan el duplicado de verdad, y no porque el handler
#     se haya acordado;
#   · que dos planes de carreras sucesoras no se mezclan;
#   · que el Plan 2016 entró con sus 57 requisitos y su clasificación.
#
# ⚠️ Corre **sobre el catálogo importado**: necesita `npm run db:catalogo` antes.
set -uo pipefail
CONTENEDOR="supabase_db_achieve-platform"
docker exec "$CONTENEDOR" true 2>/dev/null || { echo "✗ stack apagado: npm run db:start"; exit 1; }

q() { docker exec -i "$CONTENEDOR" psql -U postgres -d postgres -tAX -c "$1" 2>&1; }
fallos=0

igual() {
  local desc="$1" got="$(echo "$2" | tr -d '[:space:]')" want="$3"
  if [ "$got" = "$want" ]; then echo "   ✓ $desc"
  else echo "   ✗ $desc — esperaba '$want', obtuvo '$got'"; fallos=$((fallos + 1)); fi
}

rechaza() {
  local desc="$1" sql="$2"
  if echo "$(q "$sql")" | grep -qi "error"; then echo "   ✓ $desc"
  else echo "   ✗ $desc — no falló"; fallos=$((fallos + 1)); fi
}

CAT=$(q "select count(*) from curriculum_requirement;" | tr -d '[:space:]')
if [ "$CAT" = "0" ]; then
  echo "✗ El catálogo está vacío. Corré 'npm run db:catalogo' antes."
  exit 1
fi

echo "→ B6.14 · el Plan 2016 de la UCC entró completo (ADR-053)"
PLAN2016=$(q "select cp.id from curriculum_plan cp join academic_program ap on ap.id=cp.program_id
               where ap.key='08' and cp.version='2016';" | tr -d '[:space:]')
igual "57 requisitos curriculares" \
  "$(q "select count(*) from curriculum_requirement where curriculum_plan_id='$PLAN2016';")" "57"
igual "51 de ellos son materias concretas, no 57" \
  "$(q "select count(*) from curriculum_requirement where curriculum_plan_id='$PLAN2016' and requirement_type='COURSE';")" "51"
igual "ELECTIVA I y ELECTIVA II son cupos, no materias" \
  "$(q "select count(*) from curriculum_requirement where curriculum_plan_id='$PLAN2016' and requirement_type='ELECTIVE_SLOT';")" "2"
igual "ACRED. INGLES es un requisito de idioma" \
  "$(q "select requirement_type from curriculum_requirement where curriculum_plan_id='$PLAN2016' and code='00324';")" "LANGUAGE_REQUIREMENT"
igual "TRABAJO FINAL es el capstone" \
  "$(q "select requirement_type from curriculum_requirement where curriculum_plan_id='$PLAN2016' and code='00301';")" "CAPSTONE"
igual "SEMINARIO (54) quedó UNKNOWN: no se sabe si es asignatura o cupo" \
  "$(q "select requirement_type from curriculum_requirement where curriculum_plan_id='$PLAN2016' and code='20186';")" "UNKNOWN"
# ⚠️ **Los 57 entraron con `needs_review` y hoy están en cero.** No los revisó
# una auditoría: los dio por revisados el owner el 9 de septiembre de 2026 para
# habilitar el alta del MVP (ADR-086), y el motivo está escrito en
# `scripts/importar-catalogo.mjs` y en el `audit_log` de la publicación.
igual "la revisión del owner levantó la marca de los 57" \
  "$(q "select count(*) from curriculum_requirement where curriculum_plan_id='$PLAN2016' and needs_review;")" "0"
# ⚠️ **Y los nombres cortados siguen cortados.** Es el punto: dar por revisado un
# plan no arregla su dato. Si esto pasara a `0` alguien "limpió" el síntoma.
#
# ⚠️ **Eran diez y son ocho desde el 11 de septiembre de 2026, y NO es que se
# aflojó el guard.** Dos filas —`20162` y `10207`— compartían el nombre cortado
# `ARQUITECTURA COMPUTADORAS` y eran **materias distintas**: un estudiante
# inscripto en las dos veía dos fichas iguales. Se corrigieron **con fuente**,
# no por intuición: los programas oficiales de la cátedra dicen
# `(0820162) ARQUITECTURA DE COMPUTADORAS I` y
# `(0810207) ARQUITECTURA DE COMPUTADORAS II` (ADR-092).
#
# Las otras ocho **siguen cortadas** porque nadie tiene su nombre completo. El
# día que aparezca, este número baja con su ADR — nunca con un `UPDATE` suelto.
igual "ocho nombres entran cortados, y se declara" \
  "$(q "select count(*) from curriculum_requirement where curriculum_plan_id='$PLAN2016' and label_truncated;")" "8"
# ⚠️ **Y las dos corregidas ya no se llaman igual.** Es la comprobación de que la
# corrección entró: si alguien reimportara el CSV viejo, esto lo dice.
igual "\`ARQUITECTURA DE COMPUTADORAS\` son dos materias con dos nombres" \
  "$(q "select count(distinct label) from curriculum_requirement where curriculum_plan_id='$PLAN2016' and code in ('20162','10207');")" "2"
#
# ⚠️ **Quedan DOS parejas que sí comparten nombre, y el número las cuenta.**
#
# \`10182\`/\`20160\` son las dos \`LABORATORIO DE COMPUTACION (…\` y
# \`10098\`/\`20071\` las dos \`SEMINARIO DE FORMACION HUMAN…\`: materias distintas
# con el nombre cortado en el mismo punto, igual que estaban las de Arquitectura.
# **No se corrigieron porque nadie tiene su nombre completo** — y completarlo por
# intuición es inventar contenido de dominio, que es lo que el esquema prohíbe.
#
# Si esto baja a \`0\` sin un ADR que traiga la fuente, alguien las "limpió".
# Si sube, apareció una pareja nueva y hay que mirarla.
igual "dos parejas del plan todavía comparten nombre, y se declara" \
  "$(q "select count(*) from (select label from curriculum_requirement where curriculum_plan_id='$PLAN2016' and requirement_type='COURSE' group by label having count(*) > 1) d;")" "2"
igual "ningún requisito de tipo cupo apunta a una materia" \
  "$(q "select count(*) from curriculum_requirement where requirement_type <> 'COURSE' and course_id is not null;")" "0"

echo "→ B6.14 · un plan DRAFT no se le ofrece a nadie (ADR-051)"
#
# ⚠️ **Estas tres afirmaciones se mudaron de plan, no se aflojaron.** Hasta
# ADR-086 se verificaban contra el Plan 2016; ahora ese plan está publicado y la
# regla se verifica contra `INFORMATICA/web-2026`, que sigue en borrador con sus
# 74 requisitos sin revisar. **La regla es la misma y sigue teniendo test**: si
# alguien publicara todos los planes, esto quedaría sin plan contra el cual
# correr y hay que decirlo, no borrarlo.
PLANWEB=$(q "select cp.id from curriculum_plan cp join academic_program ap on ap.id=cp.program_id
              where ap.key='INFORMATICA' and cp.version='web-2026';" | tr -d '[:space:]')
igual "queda un plan en borrador contra el cual verificar la regla" \
  "$(q "select publication_status from curriculum_plan where id='$PLANWEB';")" "DRAFT"
igual "requisitos_del_plan devuelve NULL para un borrador, no una lista vacía" \
  "$(q "select public.requisitos_del_plan('$PLANWEB', gen_random_uuid()) is null;")" "t"
igual "publicar un plan con requisitos sin corroborar se rechaza" \
  "$(q "select 1 from (select public.publicar_plan_de_estudios('$PLANWEB','probando')) t;" | grep -ci "no se publica")" "1"

echo "→ ADR-086 · el Plan 2016 se publicó, y por decisión del owner"
# Lo que destraba: sin esto el alta no ofrece la carrera y **nadie puede
# inscribirse solo**, que es el requisito del MVP.
igual "el Plan 2016 está publicado" \
  "$(q "select publication_status from curriculum_plan where id='$PLAN2016';")" "PUBLISHED"
igual "la UCC ya aparece en el catálogo ofrecible" \
  "$(q "select count(*) from institution i
         where i.key='UCC' and public.catalogo_ofrecible(i.id)->'carreras' @> '[{\"tienePlan\": true}]';")" "1"
# ⚠️ **Publicar NO es verificar.** `publication_status` responde "¿se le puede
# mostrar a un estudiante?"; `verification_status` responde "¿alguien con
# autoridad lo confirmó?", y sigue sin escritor fuera de `corroborar_procedencia`.
igual "publicar no elevó ninguna procedencia" \
  "$(q "select count(*) from class_session cs
          join course_offering o on o.id=cs.offering_id
          join course c on c.id=o.course_id
         where c.curriculum_plan_id='$PLAN2016' and cs.verification_status<>'unverified';")" "0"

echo "→ B6.14 · dos carreras sucesoras no se mezclan"
igual "SYN-2016 y SYN-2021 son dos carreras distintas" \
  "$(q "select count(distinct ap.id) from academic_program ap join curriculum_plan cp on cp.program_id=ap.id
        where cp.version in ('SYN-2016','SYN-2021');")" "2"
igual "ninguna materia pertenece a los dos planes" \
  "$(q "select count(*) from course c1 join course c2 on c1.code=c2.code and c1.id<>c2.id
        where c1.curriculum_plan_id=(select id from curriculum_plan where version='SYN-2016')
          and c2.curriculum_plan_id=(select id from curriculum_plan where version='SYN-2021');")" "0"
igual "Ingeniería en Informática es otra carrera que el Plan 2016" \
  "$(q "select count(distinct program_id) from curriculum_plan where version in ('2016','web-2026');")" "2"
igual "la web no declara el año de ninguna materia, y no se inventa" \
  "$(q "select count(*) from curriculum_requirement cr join curriculum_plan cp on cp.id=cr.curriculum_plan_id
        where cp.version='web-2026' and cr.curriculum_year is not null;")" "0"

echo "→ B6.14 · el alta sólo ofrece la institución del estudiante"
# `student.institution_id` lo fija el padrón. Ofrecer otra sería ofrecer algo que
# `confirmar_mapa_academico` rechaza siempre — y la pantalla lo mostraba como un
# error de red, pidiéndole al estudiante que insistiera contra una pared.
SYNU=$(q "select id from institution where key='SYN-U';" | tr -d '[:space:]')
SYNI2=$(q "select id from institution where key='SYN-I2';" | tr -d '[:space:]')
igual "el catálogo de SYN-U es SYN-U, y sólo SYN-U" \
  "$(q "select public.catalogo_ofrecible('$SYNU')->>'institucionId' = '$SYNU';")" "t"
igual "y trae sus tres carreras, incluida la que no tiene plan" \
  "$(q "select jsonb_array_length(public.catalogo_ofrecible('$SYNU')->'carreras');")" "3"
igual "una de ellas se ofrece SIN plan, para poder decirlo" \
  "$(q "select count(*) from jsonb_array_elements(public.catalogo_ofrecible('$SYNU')->'carreras') c
         where (c->>'tienePlan')::boolean is false;")" "1"
igual "el de SYN-I2 no incluye ninguna carrera de SYN-U" \
  "$(q "select count(*) from jsonb_array_elements(public.catalogo_ofrecible('$SYNI2')->'carreras') c
         where c->>'nombre' like 'Ingeniería Sintética%' and c->>'nombre' not like '%del Instituto';")" "0"
igual "el contenedor 'Sin programa declarado' no se ofrece nunca" \
  "$(q "select count(*) from institution i, jsonb_array_elements(public.catalogo_ofrecible(i.id)->'carreras') c
         where c->>'nombre' = 'Sin programa declarado';")" "0"

echo "→ B6.14 · el alta escribe, y los UNIQUE impiden duplicar"
INST=$(q "select id from institution where key='SYN-U';" | tr -d '[:space:]')
PLAN=$(q "select cp.id from curriculum_plan cp join academic_program ap on ap.id=cp.program_id
           where ap.key='SYN-ING-A' and cp.version='SYN-2016';" | tr -d '[:space:]')
PROG=$(q "select program_id from curriculum_plan where id='$PLAN';" | tr -d '[:space:]')
EST=c7000000-0000-0000-0000-000000000001
OTRO=c7000000-0000-0000-0000-000000000002

q "delete from requirement_declaration where student_id in ('$EST','$OTRO');
   delete from course_enrollment where student_id in ('$EST','$OTRO');
   delete from enrollment where student_id in ('$EST','$OTRO');
   delete from whatsapp_consent where student_id in ('$EST','$OTRO');
   delete from student where id in ('$EST','$OTRO');
   insert into student (id,institution_id) values ('$EST','$INST'),('$OTRO','$INST');" >/dev/null

SEL="(select jsonb_agg(jsonb_build_object('requisitoId', id)) from curriculum_requirement
       where curriculum_plan_id='$PLAN' and curriculum_year=2 and requirement_type='COURSE')"

q "select public.confirmar_mapa_academico('$INST','$EST','$PROG','$PLAN',2::smallint,'2026-2',$SEL);" >/dev/null
PRIMERA=$(q "select count(*) from course_enrollment where student_id='$EST';" | tr -d '[:space:]')
q "select public.confirmar_mapa_academico('$INST','$EST','$PROG','$PLAN',2::smallint,'2026-2',$SEL);" >/dev/null

igual "el segundo submit no duplica cursadas" \
  "$(q "select count(*) from course_enrollment where student_id='$EST';")" "$PRIMERA"
igual "ni declaraciones" \
  "$(q "select count(*) from requirement_declaration where student_id='$EST';")" "$PRIMERA"
igual "ni inscripciones a la carrera" \
  "$(q "select count(*) from enrollment where student_id='$EST';")" "1"
# ⚠️ Se cuentan **las materias que este script eligió**, no las del plan entero:
# las cursadas por defecto son del catálogo y las comparten todos los
# estudiantes, así que un conteo global lo ensucia cualquier otra corrida.
igual "ni cursadas por defecto de la misma materia" \
  "$(q "select count(*) from course_offering co
         where co.term='2026-2' and co.commission is null
           and co.course_id in (select cr.course_id from curriculum_requirement cr
                                 where cr.curriculum_plan_id='$PLAN'
                                   and cr.curriculum_year=2 and cr.requirement_type='COURSE');")" "$PRIMERA"
igual "reconfirmar no mueve la fecha del alta" \
  "$(q "select count(distinct confirmed_at) from enrollment where student_id='$EST';")" "1"

echo "→ B6.14 · aislamiento"
igual "lo del primer estudiante no alcanza al segundo" \
  "$(q "select count(*) from course_enrollment where student_id='$OTRO';")" "0"
igual "el segundo sigue con el alta sin completar" \
  "$(q "select public.estado_del_alta('$INST','$OTRO')->>'materiasConfirmadas';")" "false"
igual "y el primero la tiene completa" \
  "$(q "select public.estado_del_alta('$INST','$EST')->>'materiasConfirmadas';")" "true"

echo "→ B6.14 · lo que la base rechaza"
# ⚠️ Contra `$PLANWEB` y ya no contra el Plan 2016: desde ADR-086 ése está
# publicado, así que confirmar contra él **debe** funcionar y no probaría nada.
# La regla —un borrador no se confirma— sigue verificada.
rechaza "confirmar contra un plan en borrador" \
  "select public.confirmar_mapa_academico('$INST','$EST','$PROG','$PLANWEB',1::smallint,'2026-2','[]'::jsonb);"
rechaza "una opción electiva colgada de una materia concreta" \
  "insert into elective_option (curriculum_requirement_id, course_id, source_type, source_ref)
   select cr.id, cr.course_id, 'institution', 'x' from curriculum_requirement cr
    where cr.curriculum_plan_id='$PLAN' and cr.requirement_type='COURSE' limit 1;"
rechaza "un alta confirmada sin plan ni año" \
  "insert into enrollment (student_id,program_id,term,confirmed_at)
   values ('$OTRO','$PROG','2027-1',now());"
rechaza "una declaración con materia Y nombre escrito a la vez" \
  "insert into requirement_declaration (institution_id,student_id,curriculum_requirement_id,course_enrollment_id,declared_label)
   select '$INST','$OTRO', cr.id, (select id from course_enrollment where student_id='$EST' limit 1), 'las dos cosas'
     from curriculum_requirement cr where cr.curriculum_plan_id='$PLAN' limit 1;"
rechaza "una segunda cursada de la misma materia sin comisión" \
  "insert into course_offering (course_id, term, commission)
   select course_id, term, commission from course_offering
    where term='2026-2' and commission is null limit 1;"
rechaza "un requisito con un año imposible" \
  "insert into curriculum_requirement (curriculum_plan_id,ordinal,code,label,requirement_type,curriculum_year,source_type,source_ref)
   values ('$PLAN',9999,'X','X','COURSE',99,'institution','x');"
rechaza "una fuente sin referencia concreta" \
  "insert into curriculum_requirement (curriculum_plan_id,ordinal,code,label,requirement_type,source_type,source_ref)
   values ('$PLAN',9998,'Y','Y','COURSE','institution','   ');"

echo "→ ADR-061 · el período académico es vocabulario cerrado"

# El valor canónico y sus dos negativos legítimos. Cualquier otra cosa es una
# grafía que se coló sin normalizar, y son las que el ADR vino a impedir.
FUERA=$(q "select count(*) from curriculum_requirement cr
             join curriculum_plan cp on cp.id = cr.curriculum_plan_id
            where cp.publication_status = 'PUBLISHED'
              and cr.term is not null
              and cr.term not in ('FIRST_SEMESTER','SECOND_SEMESTER');")
igual "ningún plan publicado guarda un período fuera del vocabulario" "$FUERA" "0"

# La regla que más fácil se rompe: una anual NO se dicta en un semestre.
ANUAL_CON_SEM=$(q "select count(*) from curriculum_requirement
                    where coalesce(is_annual,false) and term is not null;")
igual "ninguna anual lleva semestre: aparece en los dos" "$ANUAL_CON_SEM" "0"

# Y que el dato exista de verdad en los sintéticos: sin esto, el corte 2 no
# tendría contra qué agrupar y el verificador pasaría en verde sobre nada.
for PERIODO in FIRST_SEMESTER SECOND_SEMESTER; do
  N=$(q "select count(*) from curriculum_requirement cr
           join curriculum_plan cp on cp.id = cr.curriculum_plan_id
          where cp.publication_status='PUBLISHED' and cr.term='$PERIODO';" | tr -d '[:space:]')
  igual "hay materias de $PERIODO en planes publicados" "$([ "${N:-0}" -gt 0 ] && echo sí || echo no)" "sí"
done
N_ANUAL=$(q "select count(*) from curriculum_requirement cr
               join curriculum_plan cp on cp.id = cr.curriculum_plan_id
              where cp.publication_status='PUBLISHED' and coalesce(cr.is_annual,false);")
igual "hay materias anuales en planes publicados" "$([ "${N_ANUAL:-0}" -gt 0 ] && echo sí || echo no)" "sí"

rechaza "un período de dictado que es una clave calendario" \
  "insert into curriculum_requirement (curriculum_plan_id,ordinal,code,label,requirement_type,term,source_type,source_ref)
   values ('$PLAN',9997,'P1','P1','COURSE','2026-1','institution','x');"
rechaza "una anual con semestre declarado" \
  "insert into curriculum_requirement (curriculum_plan_id,ordinal,code,label,requirement_type,term,is_annual,source_type,source_ref)
   values ('$PLAN',9996,'P2','P2','COURSE','FIRST_SEMESTER',true,'institution','x');"
rechaza "un semestre «anual» en la inscripción del estudiante" \
  "update enrollment set semester='ANNUAL' where student_id='$EST';"

echo "→ ADR-061 · el alta guarda año lectivo y semestre en columnas propias"
DER=$(q "select coalesce(academic_year::text,'—')||'/'||coalesce(semester,'—')
           from enrollment where student_id='$EST' limit 1;")
igual "'2026-2' quedó como 2026 + SECOND_SEMESTER" "$DER" "2026/SECOND_SEMESTER"

q "delete from requirement_declaration where student_id in ('$EST','$OTRO');
   delete from course_enrollment where student_id in ('$EST','$OTRO');
   delete from enrollment where student_id in ('$EST','$OTRO');
   delete from student where id in ('$EST','$OTRO');" >/dev/null

echo
if [ "$fallos" -eq 0 ]; then
  echo "✓ el catálogo curricular y el alta se comportan como dicen los ADR"
else
  echo "✗ $fallos comprobaciones fallaron"
  exit 1
fi
