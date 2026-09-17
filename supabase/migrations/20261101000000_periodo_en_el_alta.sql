-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · El período se pregunta — corte 2 de
-- `plan-periodo-comision-horarios.md`, [ADR-061](../../docs/decisions.md#adr-061)
-- y [ADR-105](../../docs/decisions.md#adr-105) §2.
--
-- > *"No continuar usando texto libre ni inferir el período según el mes
-- > actual."*
--
-- El corte 1 dejó el año lectivo y el semestre en columnas propias de
-- `enrollment`, **derivadas de `p_term`**. Lo que faltaba no era dónde
-- guardarlos: era **preguntarlos**. `periodoDeCursado()` los inventaba del mes.
--
-- Esta migración no cambia ninguna escritura —`declarar_carrera()` y
-- `confirmar_mapa_academico()` ya derivan las columnas de la clave—: agrega lo
-- que las dos pantallas necesitan **leer**.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1 · El período de dictado de cada requisito, para agrupar ────────────────
--
-- `periodo` es `FIRST_SEMESTER`, `SECOND_SEMESTER` o `NULL`, y `esAnual` va
-- aparte: **la anualidad no es un tercer valor del semestre** (ADR-061). `NULL`
-- es «no sabemos en qué semestre se dicta» —las 57 filas del Plan 2016—, y la
-- pantalla lo trata como antes.

CREATE OR REPLACE FUNCTION public.requisitos_del_plan(
  p_curriculum_plan_id UUID,
  p_student_id         UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN NOT EXISTS (
           SELECT 1 FROM curriculum_plan
            WHERE id = p_curriculum_plan_id AND publication_status = 'PUBLISHED')
         -- `null` y no `[]`: "no hay plan publicado" no es "el plan está vacío".
         THEN NULL
         ELSE jsonb_build_object(
           'planId', p_curriculum_plan_id,
           'requisitos', COALESCE((
             SELECT jsonb_agg(jsonb_build_object(
                      'requisitoId', cr.id,
                      'codigo', cr.code,
                      'nombre', cr.label,
                      'tipo', cr.requirement_type,
                      'anio', cr.curriculum_year,
                      'periodo', cr.term,
                      'esAnual', COALESCE(cr.is_annual, FALSE),
                      'nombreCortado', cr.label_truncated,
                      'materiaId', cr.course_id,
                      'opciones', COALESCE((
                        SELECT jsonb_agg(jsonb_build_object('materiaId', c2.id, 'nombre', c2.name)
                                         ORDER BY c2.name)
                          FROM elective_option eo JOIN course c2 ON c2.id = eo.course_id
                         WHERE eo.curriculum_requirement_id = cr.id), '[]'::jsonb),
                      'declarado', (
                        SELECT jsonb_build_object(
                                 'cursadaId', rd.course_enrollment_id,
                                 'nombreEscrito', rd.declared_label)
                          FROM requirement_declaration rd
                         WHERE rd.student_id = p_student_id
                           AND rd.curriculum_requirement_id = cr.id)
                    ) ORDER BY cr.ordinal)
               FROM curriculum_requirement cr
              WHERE cr.curriculum_plan_id = p_curriculum_plan_id), '[]'::jsonb)
         ) END;
$$;

-- ── 2 · El estado del alta devuelve el período declarado ─────────────────────
--
-- `periodo` (la clave compuesta) se conserva: la usan las pantallas de hoy. Año
-- lectivo y semestre salen **de sus columnas**, no de partir la clave.

CREATE OR REPLACE FUNCTION public.estado_del_alta(
  p_institution_id UUID,
  p_student_id     UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'consentimientoRespondido', EXISTS (
       SELECT 1 FROM whatsapp_consent w
        WHERE w.student_id = p_student_id AND w.institution_id = p_institution_id),
    'carreraDeclarada', EXISTS (
       SELECT 1 FROM enrollment e
        WHERE e.student_id = p_student_id AND e.curriculum_plan_id IS NOT NULL
          AND e.curriculum_year IS NOT NULL),
    'disponibilidadRespondida', EXISTS (
       SELECT 1 FROM student s
        WHERE s.id = p_student_id AND s.institution_id = p_institution_id
          AND s.availability_declared_at IS NOT NULL),
    'materiasConfirmadas', EXISTS (
       SELECT 1 FROM enrollment e2
        WHERE e2.student_id = p_student_id AND e2.confirmed_at IS NOT NULL),
    'declaracion', (
       SELECT jsonb_build_object(
                'inscripcionId', e3.id,
                'carreraId', e3.program_id,
                'planId', e3.curriculum_plan_id,
                'anio', e3.curriculum_year,
                'periodo', e3.term,
                'anioLectivo', e3.academic_year,
                'semestre', e3.semester,
                'confirmadaEn', e3.confirmed_at)
         FROM enrollment e3
        WHERE e3.student_id = p_student_id AND e3.curriculum_plan_id IS NOT NULL
        ORDER BY e3.created_at DESC LIMIT 1)
  );
$$;

GRANT EXECUTE ON FUNCTION public.estado_del_alta TO service_role;
GRANT EXECUTE ON FUNCTION public.requisitos_del_plan TO service_role;
