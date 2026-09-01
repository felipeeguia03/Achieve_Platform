-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B5.4 — `UX07`, `UX08` y `UX09` en una lectura cada una
--
-- Las tres últimas superficies que quedaban proyectando fixtures. Mismo
-- argumento que las seis anteriores: una pantalla que mira preparación,
-- protocolo, completions, Action, Commitment, Evidence y progreso con siete
-- consultas muestra una foto que nunca existió.
--
-- ## Lo que estas funciones NO devuelven
--
-- **Readiness.** `preparation_readiness` existe desde la B5.1 y **nadie la
-- escribe**: los umbrales son `C01-029`, abierto. Lo que sale es lo que ADR-011
-- dejó vigente — el `status` recibido de la preparación, que es lifecycle y no
-- pronóstico— y nada más. Sin card, sin score, sin porcentaje.
--
-- **"Paso 5 de 12".** `product.md` §8.1 lo prohíbe explícitamente, y desde
-- `HUMAN-P0-01 v1.0` además sería falso: en el tramo reentrante no existe "el
-- siguiente". Se devuelve la lista con el estado de cada paso, sin posición.
--
-- **El paso actual.** `current_step_id` lo escribe el owner del protocolo, y
-- hoy nadie lo escribe. Sale `null`, y la superficie dice *"Todavía no hay un
-- paso para abrir"* en vez de elegir uno por posición.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── `UX07` · activación ──────────────────────────────────────────────────────
--
-- Devuelve **las evaluaciones elegibles tal como están**, sin rankearlas y sin
-- calcular la ventana de 14 días: `C01-024` sigue abierto y `product.md` §9 es
-- explícito —*"la UI no calcula la ventana: consume una señal ya emitida"*—. La
-- señal emitida es la preparación en `RECOMMENDED`; lo demás es contexto.
CREATE OR REPLACE FUNCTION public.estado_de_activacion(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  p_course_enrollment_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH cursada AS (
    SELECT ce.id, ce.offering_id
      FROM course_enrollment ce
     WHERE ce.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND ce.status = 'active'
       AND (p_course_enrollment_id IS NULL OR ce.id = p_course_enrollment_id)
     ORDER BY ce.created_at ASC LIMIT 1
  ),
  -- Las preparaciones vivas de esta cursada. `ABANDONED`, `CLOSED` y
  -- `EXAM_TAKEN` conservan su historia y no compiten por la activación.
  preparaciones AS (
    SELECT ep.* FROM exam_preparation ep
      JOIN cursada cu ON cu.id = ep.course_enrollment_id
     WHERE ep.institution_id = p_institution_id
       AND ep.status IN ('RECOMMENDED','ACTIVE','BLOCKED')
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'cursadaId', cu.id,
    'materia', c.name,
    'comision', o.commission,
    -- Las evaluaciones del offering con su procedencia. **En el orden
    -- declarado**, sin fecha estimada y sin priorizar: elegir cuál es "la
    -- próxima" cuando hay varias es `SELECCION`, y la decide la persona.
    'evaluaciones', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'id', ev.id,
                 'titulo', ev.title,
                 'fechaEn', ev.assessment_date,
                 'modalidad', ev.modality,
                 'fuente', ev.source_type,
                 'verificacion', ev.verification_status,
                 -- Sin protocolo para la modalidad, activar no tendría contra
                 -- qué correr. `C01-047` deja `oral` fuera de P0.
                 'tieneProtocolo', EXISTS (SELECT 1 FROM protocolo_vigente(ev.id)),
                 'preparacion', (
                    SELECT jsonb_build_object('id', pp.id, 'status', pp.status)
                      FROM preparaciones pp WHERE pp.assessment_id = ev.id))
                 ORDER BY ev.assessment_date ASC NULLS LAST, ev.title ASC)
          FROM assessment ev
         WHERE ev.offering_id = cu.offering_id), '[]'::jsonb)
  )
  FROM cursada cu
  JOIN course_offering o ON o.id = cu.offering_id
  JOIN course c ON c.id = o.course_id
  JOIN student s ON s.id = p_student_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_activacion TO service_role;

-- ── `UX08` · overview de la preparación ──────────────────────────────────────
--
-- El scoping de §VI.8 §13 es literal: *"Sólo se consideran objetos vinculados
-- inequívocamente a esta preparación/Assessment o contexto autorizado; **no se
-- comparan materias**."* Por eso Action, Commitment y Evidence se filtran por
-- `action.exam_preparation_id`, y no por la cursada: una Action del loop diario
-- no es un objeto de esta preparación aunque sea de la misma materia.
CREATE OR REPLACE FUNCTION public.estado_de_preparacion(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  -- NULL ⇒ la preparación `ACTIVE` del estudiante; si no hay, la `RECOMMENDED`.
  p_exam_preparation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH prep AS (
    SELECT ep.* FROM exam_preparation ep
     WHERE ep.institution_id = p_institution_id
       AND ep.student_id = p_student_id
       AND (p_exam_preparation_id IS NULL OR ep.id = p_exam_preparation_id)
     ORDER BY (ep.status = 'ACTIVE') DESC, ep.created_at DESC
     LIMIT 1
  ),
  accion_viva AS (
    SELECT a.* FROM action a JOIN prep p ON p.id = a.exam_preparation_id
     WHERE a.institution_id = p_institution_id
       AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')
     ORDER BY a.created_at DESC LIMIT 1
  ),
  compromiso AS (
    SELECT cm.* FROM commitment cm
      JOIN action a ON a.id = cm.action_id
      JOIN prep p ON p.id = a.exam_preparation_id
     WHERE cm.institution_id = p_institution_id
       AND cm.state NOT IN ('COMPLETED','CLOSED','RENEGOTIATED')
     ORDER BY cm.start_at DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'preparacionId', p.id,
    'status', p.status,
    'materia', c.name,
    'evaluacion', ev.title,
    'fechaEn', ev.assessment_date,
    'modalidad', ev.modality,
    'fuenteEvaluacion', ev.source_type,
    'verificacionEvaluacion', ev.verification_status,
    -- La versión del protocolo que rige ESTA preparación, con su rótulo de
    -- procedencia. `EP-SPEC` es asunción del equipo y la superficie lo dice.
    'protocolo', (SELECT jsonb_build_object(
                    'version', pr.version,
                    'alcance', pr.alcance,
                    'contenido', (SELECT st.provisional_default_id FROM protocol_step st
                                   WHERE st.exam_protocol_id = pr.id LIMIT 1))
                   FROM exam_protocol pr WHERE pr.id = p.exam_protocol_id),
    -- El recorrido: cada paso con **cuántas vueltas lleva**, no con un estado
    -- binario. Sin `vueltas` la superficie no podría distinguir "lo trabajó una
    -- vez" de "volvió tres veces", que es el hecho que ADR-028 hizo registrable.
    'pasos', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'id', st.id,
                 'canonicalId', st.canonical_id,
                 'label', st.label,
                 'requisito', st.requirement,
                 'reentrante', st.is_reentrant,
                 'vueltas', (SELECT count(*) FROM protocol_step_completion cp
                              WHERE cp.exam_preparation_id = p.id
                                AND cp.protocol_step_id = st.id),
                 'ultimaEn', (SELECT max(cp.completed_at) FROM protocol_step_completion cp
                               WHERE cp.exam_preparation_id = p.id
                                 AND cp.protocol_step_id = st.id),
                 -- `COALESCE` a `FALSE` y no `NULL`: con `current_step_id`
                 -- vacío **ningún** paso es el actual, y eso es un hecho, no un
                 -- dato faltante. Un `null` acá haría que la superficie tuviera
                 -- que adivinar cuál de las dos cosas es.
                 'esActual', COALESCE(st.id = p.current_step_id, FALSE))
                 ORDER BY st.sequence ASC)
          FROM protocol_step st
         WHERE st.exam_protocol_id = p.exam_protocol_id), '[]'::jsonb),
    'accion', (SELECT jsonb_build_object('status', av.status, 'objetivo', av.objective)
                 FROM accion_viva av),
    'compromiso', (SELECT jsonb_build_object('state', cm.state, 'inicioEn', cm.start_at)
                     FROM compromiso cm),
    'rescatePendiente', EXISTS (
        SELECT 1 FROM commitment m
          JOIN action a3 ON a3.id = m.action_id
         WHERE a3.exam_preparation_id = p.id AND m.state = 'MISSED'
           AND NOT EXISTS (SELECT 1 FROM commitment r WHERE r.rescues_commitment_id = m.id)),
    'evidencia', COALESCE((
        SELECT e.lifecycle_state FROM evidence e
          JOIN action a4 ON a4.id = e.action_id
         WHERE a4.exam_preparation_id = p.id AND e.institution_id = p_institution_id
         ORDER BY e.created_at DESC LIMIT 1), 'NONE'),
    'ultimoProgresoEn', (SELECT max(pe.occurred_at) FROM progress_entry pe
                           JOIN action a5 ON a5.id = pe.action_id
                          WHERE a5.exam_preparation_id = p.id),
    -- Readiness: lo que haya. Hoy siempre `null`, y **eso es la decisión**, no
    -- un dato faltante. Ver ADR-011 y `C01-029`.
    'readiness', (SELECT jsonb_build_object(
                    'state', r.state,
                    'explicacion', r.explanation,
                    'reglaVersion', r.rule_version,
                    'calculadoEn', r.calculated_at)
                   FROM preparation_readiness r WHERE r.id = p.readiness_id)
  )
  FROM prep p
  JOIN assessment ev ON ev.id = p.assessment_id
  JOIN course_offering o ON o.id = ev.offering_id
  JOIN course c ON c.id = o.course_id
  JOIN student s ON s.id = p_student_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_preparacion TO service_role;

-- ── `UX09` · un paso del protocolo ───────────────────────────────────────────
--
-- `WF-S11` **renderiza contenido recibido**: no deriva, no resume con
-- significado nuevo y no completa contenido pedagógico (§VI.9 §12.1). Por eso
-- los cuatro bloques salen crudos y con su `null` intacto: un `objective`
-- vacío se muestra con el copy de ausencia de §27, nunca con una versión
-- generada.
CREATE OR REPLACE FUNCTION public.estado_de_paso(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  p_exam_preparation_id UUID,
  p_protocol_step_id    UUID
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH prep AS (
    SELECT ep.* FROM exam_preparation ep
     WHERE ep.institution_id = p_institution_id
       AND ep.student_id = p_student_id
       AND ep.id = p_exam_preparation_id
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'preparacionId', p.id,
    'status', p.status,
    'materia', c.name,
    'evaluacion', ev.title,
    'modalidad', ev.modality,
    'pasoId', st.id,
    'label', st.label,
    'objetivo', st.objective,
    'explicacion', st.explanation,
    'entregable', st.expected_artifact,
    'criterio', st.criterion,
    'requisito', st.requirement,
    'reentrante', st.is_reentrant,
    'version', pr.version,
    'contenido', st.provisional_default_id,
    'contenidoVersion', st.provisional_version,
    -- Las vueltas dadas sobre este paso, **con su tema**. Es lo que permite
    -- decir "volviste sobre Series" y no "repetiste el paso".
    'vueltas', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'occurrence', cp.occurrence,
                 'completadoEn', cp.completed_at,
                 'tema', t.name)
                 ORDER BY cp.completed_at DESC)
          FROM protocol_step_completion cp
          LEFT JOIN topic t ON t.id = cp.topic_id
         WHERE cp.exam_preparation_id = p.id AND cp.protocol_step_id = st.id), '[]'::jsonb),
    -- `protocol_step` no tiene recurso configurado y no se le inventa uno: la
    -- superficie muestra *"Este paso no tiene un recurso configurado"*, que
    -- §27 fija como copy y **no es un bloqueo**.
    'recurso', NULL,
    'accion', (SELECT jsonb_build_object('status', a.status, 'objetivo', a.objective)
                 FROM action a
                WHERE a.exam_preparation_id = p.id
                  AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')
                ORDER BY a.created_at DESC LIMIT 1),
    'compromiso', (SELECT jsonb_build_object('state', cm.state)
                     FROM commitment cm
                     JOIN action a2 ON a2.id = cm.action_id
                    WHERE a2.exam_preparation_id = p.id
                      AND cm.state NOT IN ('COMPLETED','CLOSED','RENEGOTIATED')
                    ORDER BY cm.start_at DESC LIMIT 1),
    'evidencia', COALESCE((
        SELECT e.lifecycle_state FROM evidence e
          JOIN action a3 ON a3.id = e.action_id
         WHERE a3.exam_preparation_id = p.id AND e.institution_id = p_institution_id
         ORDER BY e.created_at DESC LIMIT 1), 'NONE')
  )
  FROM prep p
  JOIN protocol_step st ON st.id = p_protocol_step_id
                       AND st.exam_protocol_id = p.exam_protocol_id
  JOIN exam_protocol pr ON pr.id = st.exam_protocol_id
  JOIN assessment ev ON ev.id = p.assessment_id
  JOIN course_offering o ON o.id = ev.offering_id
  JOIN course c ON c.id = o.course_id
  JOIN student s ON s.id = p_student_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_paso TO service_role;
