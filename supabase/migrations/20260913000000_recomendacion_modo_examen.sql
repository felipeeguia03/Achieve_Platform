-- ═══════════════════════════════════════════════════════════════════════════
-- Etapa B6.12 — El disparador de Modo Examen
--
-- `ExamPreparationRecommended` está en el catálogo `P0` desde la Fase B5 y
-- **nadie lo emitía**: faltaba decidir la ventana, que era `C01-024`.
-- [ADR-048](../../docs/decisions.md#adr-048) la cerró en **14 días calendario
-- incluyendo el día 14**, y esta migración le da a la regla dónde escribir.
--
-- ## Qué hace y qué no
--
-- Crea la `exam_preparation` en `RECOMMENDED` y **nada más**. No elige
-- protocolo —eso lo hace activar, y `product.md` §5.4 es taxativo sobre qué
-- produce activar—, no crea `Action`, no toca readiness.
--
-- ⚠️ **La ventana NO se calcula acá.** Vive en `lib/domain/ventana-de-examen.ts`,
-- pura y a la vista, junto con la zona institucional de ADR-049. Meterla en
-- PL/pgSQL sería la regla de negocio invisible que `data-model.md` §11
-- prohíbe. Esta función sólo garantiza que la escritura sea **una**.
--
-- ## Por qué "una sola vez por intento" no necesita una columna nueva
--
-- `exam_preparation` ya tiene `UNIQUE (student_id, assessment_id)` desde la
-- B5 —es `I7`—, así que una evaluación no puede tener dos preparaciones para
-- el mismo estudiante. Las condiciones 3 y 4 de ADR-048 —*"no existe ya un
-- Modo Examen activo o completado"* y *"la recomendación no fue emitida antes
-- para ese intento"*— son ese mismo hecho: **si ya hay fila, no se recomienda**,
-- cualquiera sea su estado. Inventar un contador aparte crearía una segunda
-- verdad sobre lo mismo.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.recomendar_modo_examen(
  p_institution_id       UUID,
  p_assessment_id        UUID,
  p_student_id           UUID,
  p_course_enrollment_id UUID
)
RETURNS SETOF exam_preparation
LANGUAGE plpgsql
AS $$
BEGIN
  -- Cero filas ⇒ ya existía. El llamador NO publica el evento en ese caso: un
  -- `ExamPreparationRecommended` por cada corrida del reloj convertiría el
  -- registro de hechos en un latido.
  RETURN QUERY
  INSERT INTO exam_preparation (
    institution_id, assessment_id, student_id, course_enrollment_id, status
  ) VALUES (
    p_institution_id, p_assessment_id, p_student_id, p_course_enrollment_id, 'RECOMMENDED'
  )
  ON CONFLICT (student_id, assessment_id) DO NOTHING
  RETURNING *;
END;
$$;

COMMENT ON FUNCTION public.recomendar_modo_examen IS
  'ADR-048. Crea la preparación en RECOMMENDED, o no hace nada si ya había una. '
  'La ventana de 14 días la decide lib/domain/ventana-de-examen.ts, no esta función.';

REVOKE ALL ON FUNCTION public.recomendar_modo_examen FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recomendar_modo_examen TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Los candidatos: qué evaluaciones podrían recomendarse, sin decidir cuáles.
--
-- Devuelve la fecha cruda y deja afuera lo que ya tiene preparación. **El
-- filtro de los 14 días no está acá**: la función entrega la fecha y quien
-- decide es el dominio. Si la ventana cambiara, esta consulta no se toca.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.candidatos_de_modo_examen(
  p_institution_id UUID,
  p_limite         INTEGER DEFAULT 200
)
RETURNS TABLE (
  assessment_id        UUID,
  student_id           UUID,
  course_enrollment_id UUID,
  assessment_date      DATE,
  titulo               TEXT
)
LANGUAGE sql
STABLE
AS $$
  SELECT a.id, ce.student_id, ce.id, a.assessment_date, a.title
    FROM assessment a
    JOIN course_enrollment ce ON ce.offering_id = a.offering_id
   WHERE ce.institution_id = p_institution_id
     -- Sin fecha no hay ventana que evaluar, y no se estima una. La fila ni
     -- siquiera viaja: *omitir, no inventar*.
     AND a.assessment_date IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM exam_preparation p
        WHERE p.student_id = ce.student_id AND p.assessment_id = a.id
     )
   ORDER BY a.assessment_date
   LIMIT p_limite;
$$;

COMMENT ON FUNCTION public.candidatos_de_modo_examen IS
  'Evaluaciones con fecha y sin preparación, por estudiante. NO aplica la ventana: '
  'entrega la fecha para que la decida lib/domain/ventana-de-examen.ts.';

REVOKE ALL ON FUNCTION public.candidatos_de_modo_examen FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.candidatos_de_modo_examen TO service_role;
