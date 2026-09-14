-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Modo Focus
--
-- [ADR-104](../../docs/decisions.md#adr-104), decidido por el owner el 13 de
-- septiembre de 2026: *"hacé todo lo recomendado y empezá, no dejes nada pending"*.
--
-- ## La sesión es la entidad; Pomodoro es un modo
--
-- `focus_session` nace atada a un compromiso real del estudiante —y por él a su
-- `action` y su cursada— y guarda sus **tramos** en `focus_segment`: foco,
-- descanso y pausa, cada uno con sus instantes. La fase no se persiste: se
-- deduce del tramo abierto (`lib/domain/sesion-de-focus.ts`).
--
-- ## Lo que estas tablas NO llevan, y cada ausencia es una decisión
--
-- ⛔ **Sin `evidence_id`.** La sesión y la entrega comparten `action_id`, que ya
-- dice qué trabajo es de qué entrega. Una FK sin escritor ni lector sería la
-- columna antes que su uso (ADR-104 §15).
--
-- ⛔ **Sin estado `MINIMIZED` ni `RECOVERY_REQUIRED`.** Minimizar es
-- presentación; la recuperación se deduce del último latido (§10, §16).
--
-- ⛔ **Sin tiempo de ayuda.** No hay SOS en el producto (§17).
--
-- ⚠️ **El anotador (`scratchpad`) es privado.** No viaja a `product_event`, ni a
-- `hechos_de_cursada()`, ni a la Bitácora (§12). Hay guard.
-- ─────────────────────────────────────────────────────────────────────────────

-- La acción es de su cursada y el compromiso de su acción, como pares, para que
-- las FK compuestas de abajo puedan apuntarles. No cambia nada: `id` ya es único.
ALTER TABLE action
  ADD CONSTRAINT action_id_cursada_unico UNIQUE (id, course_enrollment_id);
ALTER TABLE commitment
  ADD CONSTRAINT commitment_id_accion_unico UNIQUE (id, action_id);

CREATE TABLE focus_session (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  student_id     UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,
  course_enrollment_id UUID NOT NULL,
  action_id      UUID NOT NULL,
  commitment_id  UUID NOT NULL,

  -- **Copia** del acuerdo al empezar: si el compromiso se renegocia después, la
  -- sesión conserva contra qué horario y cuántos minutos empezó.
  scheduled_start_at TIMESTAMPTZ NOT NULL,
  planned_minutes    INTEGER NOT NULL CHECK (planned_minutes > 0),

  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ENDED')),
  mode   TEXT NOT NULL DEFAULT 'FREE' CHECK (mode IN ('FREE','POMODORO')),

  -- La configuración Pomodoro, entera o ausente. Límites técnicos, no consejo:
  -- los mismos que `LIMITES_POMODORO`.
  pomodoro_focus_minutes       INTEGER CHECK (pomodoro_focus_minutes BETWEEN 5 AND 120),
  pomodoro_short_break_minutes INTEGER CHECK (pomodoro_short_break_minutes BETWEEN 1 AND 30),
  pomodoro_long_break_minutes  INTEGER CHECK (pomodoro_long_break_minutes BETWEEN 5 AND 60),
  pomodoro_blocks_before_long  INTEGER CHECK (pomodoro_blocks_before_long BETWEEN 2 AND 8),

  -- Los pone el servidor. Un reloj del cliente no escribe dominio.
  started_at        TIMESTAMPTZ NOT NULL,
  last_heartbeat_at TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ,
  end_kind          TEXT CHECK (end_kind IN ('SAVED','DONE')),

  -- Los números, **congelados al cerrar** (§8). Los calcula el dominio; la
  -- Bitácora los lee y no los recalcula.
  focus_seconds   INTEGER CHECK (focus_seconds >= 0),
  break_seconds   INTEGER CHECK (break_seconds >= 0),
  paused_seconds  INTEGER CHECK (paused_seconds >= 0),
  pauses          INTEGER CHECK (pauses >= 0),
  complete_blocks INTEGER CHECK (complete_blocks >= 0),
  partial_blocks  INTEGER CHECK (partial_blocks >= 0),

  -- *¿Qué avanzaste?* — académico, se ve en la Bitácora. **No es `reflection`.**
  advance_text TEXT CHECK (advance_text IS NULL OR char_length(advance_text) <= 2000),
  -- *Para después* — privado (§12).
  scratchpad            TEXT CHECK (scratchpad IS NULL OR char_length(scratchpad) <= 20000),
  scratchpad_updated_at TIMESTAMPTZ,

  -- Concurrencia optimista de los comandos: dos clics a la vez no escriben dos
  -- tramos abiertos.
  version    INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT focus_de_una_cursada_propia
    FOREIGN KEY (course_enrollment_id, student_id)
    REFERENCES course_enrollment (id, student_id) ON DELETE CASCADE,
  CONSTRAINT focus_de_una_accion_de_esa_cursada
    FOREIGN KEY (action_id, course_enrollment_id)
    REFERENCES action (id, course_enrollment_id) ON DELETE CASCADE,
  CONSTRAINT focus_de_un_compromiso_de_esa_accion
    FOREIGN KEY (commitment_id, action_id)
    REFERENCES commitment (id, action_id) ON DELETE CASCADE,
  CONSTRAINT focus_pomodoro_completo
    CHECK ((mode = 'POMODORO') = (num_nulls(pomodoro_focus_minutes, pomodoro_short_break_minutes,
                                            pomodoro_long_break_minutes, pomodoro_blocks_before_long) = 0)
       AND num_nulls(pomodoro_focus_minutes, pomodoro_short_break_minutes,
                     pomodoro_long_break_minutes, pomodoro_blocks_before_long) IN (0, 4)),
  -- `ENDED` si y sólo si tiene fin, forma de cierre y sus números.
  CONSTRAINT focus_terminada_completa
    CHECK ((status = 'ENDED') = (ended_at IS NOT NULL)
       AND (status = 'ENDED') = (end_kind IS NOT NULL)
       AND (status = 'ENDED') = (num_nulls(focus_seconds, break_seconds, paused_seconds,
                                           pauses, complete_blocks, partial_blocks) = 0)
       AND num_nulls(focus_seconds, break_seconds, paused_seconds,
                     pauses, complete_blocks, partial_blocks) IN (0, 6)),
  CONSTRAINT focus_termina_despues_de_empezar
    CHECK (ended_at IS NULL OR ended_at >= started_at),
  CONSTRAINT focus_latido_despues_de_empezar
    CHECK (last_heartbeat_at >= started_at)
);

COMMENT ON TABLE focus_session IS
  'Una sesión de Focus sobre un compromiso del estudiante (ADR-104). NO es Evidence, progreso ni '
  'cumplimiento. scratchpad es privado: no viaja a product_event, hechos_de_cursada ni la Bitácora.';

-- **Una sola sesión abierta por estudiante** (§11). El Service lo chequea para
-- contestar bien; esto lo garantiza cuando dos pedidos llegan juntos.
CREATE UNIQUE INDEX focus_session_una_abierta
  ON focus_session (student_id) WHERE status = 'OPEN';
CREATE INDEX focus_session_accion_idx ON focus_session (action_id, started_at DESC);
CREATE INDEX focus_session_institution_idx ON focus_session (institution_id);

ALTER TABLE focus_session ENABLE ROW LEVEL SECURITY;

-- ── Los tramos ───────────────────────────────────────────────────────────────

CREATE TABLE focus_segment (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  focus_session_id UUID NOT NULL REFERENCES focus_session(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('FOCUS','BREAK','PAUSE')),
  mode        TEXT CHECK (mode IN ('FREE','POMODORO')),
  block_number INTEGER CHECK (block_number >= 1),
  break_kind  TEXT CHECK (break_kind IN ('SHORT','LONG')),
  started_at     TIMESTAMPTZ NOT NULL,
  -- El fin **planeado** de un bloque o un descanso: un instante, no un contador.
  planned_end_at TIMESTAMPTZ,
  ended_at       TIMESTAMPTZ,
  end_reason     TEXT CHECK (end_reason IN
                   ('COMPLETED','PAUSED','RESUMED','SWITCHED','SKIPPED','SAVED','DONE','RECOVERED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tramo_foco_tiene_modo CHECK ((kind = 'FOCUS') = (mode IS NOT NULL)),
  CONSTRAINT tramo_bloque_solo_en_pomodoro
    CHECK ((block_number IS NOT NULL) = (kind = 'FOCUS' AND mode = 'POMODORO')),
  CONSTRAINT tramo_descanso_tiene_tipo CHECK ((break_kind IS NOT NULL) = (kind = 'BREAK')),
  CONSTRAINT tramo_fin_planeado
    CHECK ((planned_end_at IS NOT NULL) = (kind = 'BREAK' OR mode = 'POMODORO')),
  CONSTRAINT tramo_cerrado_con_motivo CHECK ((ended_at IS NULL) = (end_reason IS NULL)),
  CONSTRAINT tramo_termina_despues_de_empezar CHECK (ended_at IS NULL OR ended_at >= started_at),
  CONSTRAINT tramo_planeado_despues_de_empezar CHECK (planned_end_at IS NULL OR planned_end_at > started_at)
);

COMMENT ON TABLE focus_segment IS
  'Un tramo de una sesión de Focus (ADR-104): foco, descanso o pausa. Los instantes los sella el servidor.';

-- **Un solo tramo abierto por sesión.** Es lo que hace imposible que el reloj
-- corra dos veces.
CREATE UNIQUE INDEX focus_segment_uno_abierto
  ON focus_segment (focus_session_id) WHERE ended_at IS NULL;
CREATE INDEX focus_segment_sesion_idx ON focus_segment (focus_session_id, started_at);
CREATE INDEX focus_segment_institution_idx ON focus_segment (institution_id);

ALTER TABLE focus_segment ENABLE ROW LEVEL SECURITY;

-- ── Las preferencias ─────────────────────────────────────────────────────────
--
-- Lo único que se recuerda (§18): modo, preset, configuración, sonido y volumen.
-- **No es un perfil**: ningún motor lo lee para decidir nada.
CREATE TABLE focus_preference (
  student_id     UUID PRIMARY KEY REFERENCES student(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  last_mode TEXT NOT NULL DEFAULT 'FREE' CHECK (last_mode IN ('FREE','POMODORO')),
  preset    TEXT CHECK (preset IN ('CLASICO','INTERMEDIO','PROFUNDO','PERSONALIZADO')),
  custom_focus_minutes       INTEGER CHECK (custom_focus_minutes BETWEEN 5 AND 120),
  custom_short_break_minutes INTEGER CHECK (custom_short_break_minutes BETWEEN 1 AND 30),
  custom_long_break_minutes  INTEGER CHECK (custom_long_break_minutes BETWEEN 5 AND 60),
  custom_blocks_before_long  INTEGER CHECK (custom_blocks_before_long BETWEEN 2 AND 8),
  -- Apagado la primera vez (§19).
  sound  TEXT NOT NULL DEFAULT 'NINGUNO' CHECK (sound IN ('NINGUNO','MARRON','ROSA')),
  volume INTEGER NOT NULL DEFAULT 40 CHECK (volume BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT preferencia_personalizada_completa
    CHECK (num_nulls(custom_focus_minutes, custom_short_break_minutes,
                     custom_long_break_minutes, custom_blocks_before_long) IN (0, 4))
);

ALTER TABLE focus_preference ENABLE ROW LEVEL SECURITY;

-- ── Empezar, atómico ─────────────────────────────────────────────────────────
--
-- La sesión y su primer tramo —foco libre— nacen juntos, o no nace ninguno.
-- `NULL` ⇒ la base rechazó por la unicidad de la abierta: otro pedido ganó.
CREATE OR REPLACE FUNCTION public.empezar_sesion_de_focus(
  p_institution_id UUID,
  p_student_id     UUID,
  p_course_enrollment_id UUID,
  p_action_id      UUID,
  p_commitment_id  UUID,
  p_scheduled_start_at TIMESTAMPTZ,
  p_planned_minutes INTEGER,
  p_ahora          TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO focus_session (institution_id, student_id, course_enrollment_id, action_id, commitment_id,
                             scheduled_start_at, planned_minutes, started_at, last_heartbeat_at)
  VALUES (p_institution_id, p_student_id, p_course_enrollment_id, p_action_id, p_commitment_id,
          p_scheduled_start_at, p_planned_minutes, p_ahora, p_ahora)
  RETURNING id INTO v_id;

  INSERT INTO focus_segment (institution_id, focus_session_id, kind, mode, started_at)
  VALUES (p_institution_id, v_id, 'FOCUS', 'FREE', p_ahora);

  RETURN v_id;
EXCEPTION WHEN unique_violation THEN
  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.empezar_sesion_de_focus TO service_role;

-- ── Un comando, atómico ──────────────────────────────────────────────────────
--
-- El dominio decide (TypeScript, puro); esto sólo escribe **todo o nada**: la
-- sesión con su versión esperada, los tramos que se cierran y los que se abren.
-- `NULL` ⇒ la versión ya no era ésa, o la sesión ya estaba cerrada: otro pedido
-- llegó primero y el Service relee.
CREATE OR REPLACE FUNCTION public.aplicar_comando_de_focus(
  p_institution_id UUID,
  p_session_id     UUID,
  p_version        INTEGER,
  p_sesion         JSONB,
  p_cerrar         JSONB,
  p_abrir          JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql AS $$
DECLARE
  v_version INTEGER;
BEGIN
  UPDATE focus_session SET
    status            = p_sesion->>'status',
    mode              = p_sesion->>'mode',
    pomodoro_focus_minutes       = (p_sesion->>'pomodoro_focus_minutes')::INTEGER,
    pomodoro_short_break_minutes = (p_sesion->>'pomodoro_short_break_minutes')::INTEGER,
    pomodoro_long_break_minutes  = (p_sesion->>'pomodoro_long_break_minutes')::INTEGER,
    pomodoro_blocks_before_long  = (p_sesion->>'pomodoro_blocks_before_long')::INTEGER,
    last_heartbeat_at = (p_sesion->>'last_heartbeat_at')::TIMESTAMPTZ,
    ended_at          = (p_sesion->>'ended_at')::TIMESTAMPTZ,
    end_kind          = p_sesion->>'end_kind',
    focus_seconds     = (p_sesion->>'focus_seconds')::INTEGER,
    break_seconds     = (p_sesion->>'break_seconds')::INTEGER,
    paused_seconds    = (p_sesion->>'paused_seconds')::INTEGER,
    pauses            = (p_sesion->>'pauses')::INTEGER,
    complete_blocks   = (p_sesion->>'complete_blocks')::INTEGER,
    partial_blocks    = (p_sesion->>'partial_blocks')::INTEGER,
    advance_text      = CASE WHEN p_sesion ? 'advance_text' THEN p_sesion->>'advance_text' ELSE advance_text END,
    version           = version + 1
  WHERE institution_id = p_institution_id
    AND id = p_session_id
    AND version = p_version
    AND status = 'OPEN'
  RETURNING version INTO v_version;

  IF v_version IS NULL THEN
    RETURN NULL;
  END IF;

  -- Primero se cierra, después se abre: el índice de un solo tramo abierto no
  -- admite el orden inverso.
  UPDATE focus_segment s SET
    ended_at   = (c->>'ended_at')::TIMESTAMPTZ,
    end_reason = c->>'end_reason'
  FROM jsonb_array_elements(COALESCE(p_cerrar, '[]'::jsonb)) c
  WHERE s.id = (c->>'id')::UUID
    AND s.focus_session_id = p_session_id
    AND s.ended_at IS NULL;

  INSERT INTO focus_segment (institution_id, focus_session_id, kind, mode, block_number, break_kind,
                             started_at, planned_end_at, ended_at, end_reason)
  SELECT p_institution_id, p_session_id, a->>'kind', a->>'mode', (a->>'block_number')::INTEGER,
         a->>'break_kind', (a->>'started_at')::TIMESTAMPTZ, (a->>'planned_end_at')::TIMESTAMPTZ,
         (a->>'ended_at')::TIMESTAMPTZ, a->>'end_reason'
    FROM jsonb_array_elements(COALESCE(p_abrir, '[]'::jsonb)) a;

  -- Una sesión cerrada no deja un reloj corriendo.
  IF p_sesion->>'status' = 'ENDED' AND EXISTS (
       SELECT 1 FROM focus_segment WHERE focus_session_id = p_session_id AND ended_at IS NULL) THEN
    RAISE EXCEPTION 'focus_session % cerrada con un tramo abierto', p_session_id;
  END IF;

  RETURN v_version;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aplicar_comando_de_focus TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- La Bitácora gana la sesión de Focus (§21)
--
-- `hechos_de_cursada()` ata cada hecho a su `Action` por el objeto que lo
-- produjo; ahora también por `focus_session`. Y devuelve **`datos`**: lo que el
-- hecho necesita para contarse. ⛔ **Nunca el anotador.**
--
-- `DROP` porque cambia el tipo de retorno. Las funciones que la llaman son SQL
-- y la leen por nombre de columna: una columna más no las toca.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.hechos_de_cursada(UUID, UUID, INTEGER);

CREATE FUNCTION public.hechos_de_cursada(
  p_institution_id UUID,
  p_course_enrollment_id UUID,
  p_limite INTEGER DEFAULT NULL
)
RETURNS TABLE (
  event_name  TEXT,
  occurred_at TIMESTAMPTZ,
  actor_id    UUID,
  accion_id   UUID,
  objetivo    TEXT,
  datos       JSONB
)
LANGUAGE sql STABLE AS $$
  SELECT ev.event_name, ev.occurred_at, ev.actor_id, a.id, a.objective,
         CASE WHEN fs.id IS NOT NULL THEN jsonb_build_object(
           'sesion', fs.id,
           'inicio', fs.started_at,
           'fin', fs.ended_at,
           'modo', fs.mode,
           'foco', fs.focus_seconds,
           'descanso', fs.break_seconds,
           'pausado', fs.paused_seconds,
           'completos', fs.complete_blocks,
           'parciales', fs.partial_blocks,
           'avance', fs.advance_text
         ) END
    FROM product_event ev
    LEFT JOIN action     ac ON ev.subject_type = 'action'     AND ac.id = ev.subject_id
    LEFT JOIN commitment cm ON ev.subject_type = 'commitment' AND cm.id = ev.subject_id
    LEFT JOIN evidence   e2 ON ev.subject_type = 'evidence'   AND e2.id = ev.subject_id
    LEFT JOIN progress_entry pe ON ev.subject_type = 'progress_entry' AND pe.id = ev.subject_id
    LEFT JOIN focus_session  fs ON ev.subject_type = 'focus_session'  AND fs.id = ev.subject_id
    JOIN action a ON a.id = COALESCE(ac.id, cm.action_id, e2.action_id, pe.action_id, fs.action_id)
   WHERE ev.institution_id = p_institution_id
     AND a.course_enrollment_id = p_course_enrollment_id
   ORDER BY ev.occurred_at DESC
   LIMIT p_limite;
$$;

GRANT EXECUTE ON FUNCTION public.hechos_de_cursada TO service_role;

COMMENT ON FUNCTION public.hechos_de_cursada IS
  'La única fuente histórica. UX02 (preview) y UX06 (Bitácora) llaman acá; no existe una segunda consulta sobre product_event. datos nunca lleva el anotador de Focus (ADR-104 §12).';

-- `estado_de_progreso` pasa `datos` a cada entrada. Mismo cuerpo que
-- `20260930000000_bitacora_por_materia.sql`, con esa línea de más.
CREATE OR REPLACE FUNCTION public.estado_de_progreso(p_institution_id uuid, p_student_id uuid, p_ahora timestamp with time zone, p_evidence_id uuid DEFAULT NULL::uuid, p_course_enrollment_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  WITH evidencia AS (
    SELECT e.id, e.lifecycle_state, e.submitted_at, e.commitment_id,
           a.id AS action_id, a.objective, a.course_enrollment_id, a.topic_id
      FROM evidence e
      JOIN action a ON a.id = e.action_id
      JOIN course_enrollment ce ON ce.id = a.course_enrollment_id
     WHERE e.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND (p_evidence_id IS NULL OR e.id = p_evidence_id)
       -- La reemplazada se preserva (`I4`), no se proyecta como la actual.
       AND (p_evidence_id IS NOT NULL OR e.superseded_by_id IS NULL)
       -- Y **la evidencia se acota a la materia pedida**. Sin esta línea, pedir
       -- la Bitácora de Álgebra devolvía la última evidencia del estudiante
       -- —la de Cálculo— y con ella su cursada: la pantalla decía «Álgebra» en
       -- la URL y «Cálculo» en el encabezado. No es una ausencia: es una
       -- respuesta equivocada, la misma que `cursadaId` cerró en `CTA-001`.
       AND (p_course_enrollment_id IS NULL OR a.course_enrollment_id = p_course_enrollment_id)
     ORDER BY e.created_at DESC LIMIT 1
  ),
  -- La cursada de la evidencia. Sin evidencia todavía hay pantalla: el
  -- estudiante puede abrir su progreso antes de entregar nada.
  cursada AS (
    SELECT ce.id, ce.offering_id
      FROM course_enrollment ce
     WHERE ce.institution_id = p_institution_id
       AND ce.student_id = p_student_id
       AND ce.status = 'active'
       -- `NULL` ⇒ el comportamiento de siempre: la cursada de la evidencia, y
       -- sin evidencia la primera activa. Es lo que `UX01` y `UX05` siguen
       -- pidiendo, y lo que el Track A necesita cuando no hay id que nombrar.
       AND (p_course_enrollment_id IS NULL OR ce.id = p_course_enrollment_id)
       AND (ce.id = (SELECT course_enrollment_id FROM evidencia)
            OR NOT EXISTS (SELECT 1 FROM evidencia))
     ORDER BY ce.created_at ASC LIMIT 1
  ),
  -- El resultado autoritativo. Primero el que habla de ESTA evidencia; si no
  -- existe, el último de la cursada, que viaja sin causa atribuida.
  resultado AS (
    SELECT pe.*,
           (pe.evidence_id = (SELECT id FROM evidencia)
            OR pe.causal_evidence_id = (SELECT id FROM evidencia)) AS es_de_esta_evidencia
      FROM progress_entry pe
      JOIN cursada cu ON cu.id = pe.course_enrollment_id
     WHERE pe.institution_id = p_institution_id
     ORDER BY (pe.evidence_id = (SELECT id FROM evidencia)
               OR pe.causal_evidence_id = (SELECT id FROM evidencia)) DESC NULLS LAST,
              pe.occurred_at DESC
     LIMIT 1
  ),
  -- Las dimensiones de la unidad de la que habla la pantalla.
  dimensiones AS (
    SELECT tp.* FROM topic_progress tp
     JOIN cursada cu ON cu.id = tp.course_enrollment_id
    WHERE tp.topic_id = COALESCE((SELECT topic_id FROM resultado),
                                 (SELECT topic_id FROM evidencia))
    LIMIT 1
  ),
  -- La Action viva de la cursada: es lo que "qué sigue" puede ofrecer, si el
  -- ADE ya emitió una recomendación. Esta pantalla nunca crea una.
  siguiente AS (
    SELECT a.id, a.objective,
           (SELECT ar.reason_primary FROM action_recommendation ar
             WHERE ar.action_id = a.id AND ar.is_primary LIMIT 1) AS razon
      FROM action a
      JOIN cursada cu ON cu.id = a.course_enrollment_id
     WHERE a.institution_id = p_institution_id
       AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')
     ORDER BY a.created_at DESC LIMIT 1
  ),
  -- Los hechos de la cursada, agrupados por la Action que los produjo.
  --
  -- **La composición no está acá:** vive en `hechos_de_cursada()`, que `UX02`
  -- también llama para su Actividad reciente. `VI.6` §8.3 dice que no existe una
  -- segunda fuente histórica, y dos `SELECT` parecidos sobre `product_event`
  -- serían exactamente eso.
  ciclos AS (
    SELECT h.accion_id, h.objetivo, min(h.occurred_at) AS desde,
           jsonb_agg(jsonb_build_object(
             'evento', h.event_name,
             'en', h.occurred_at,
             -- ADR-104: lo que el hecho trae para contarse. Hoy sólo la sesión de
             -- Focus lo llena, y **nunca con el anotador**.
             'datos', h.datos,
             -- Quién lo causó. `IS NOT DISTINCT FROM` y no `=`: con un actor
             -- nulo —el reloj del lifecycle— la comparación daría NULL, y un
             -- "no sé" que viaja como ausencia se lee después como cualquier
             -- cosa. El sistema no es una fuente académica, y lo dice `false`.
             'porElEstudiante', h.actor_id IS NOT DISTINCT FROM p_student_id
           ) ORDER BY h.occurred_at ASC) AS entradas
      FROM public.hechos_de_cursada(p_institution_id, (SELECT id FROM cursada), NULL) h
     GROUP BY h.accion_id, h.objetivo
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'materia', c.name,
    'unidad', (SELECT t.name FROM topic t
                WHERE t.id = COALESCE((SELECT topic_id FROM resultado),
                                      (SELECT topic_id FROM evidencia))),
    'evidencia', (SELECT jsonb_build_object(
                    'id', e.id,
                    'lifecycle', e.lifecycle_state,
                    'objetivo', e.objective,
                    'enviadaEn', e.submitted_at) FROM evidencia e),
    'resultado', (SELECT jsonb_build_object(
                    'occurridoEn', r.occurred_at,
                    'tipo', r.entry_kind,
                    'dimensionesCambiadas', to_jsonb(r.changed_dimensions),
                    'valoresAnteriores', r.before_values,
                    'valoresActuales', r.current_values,
                    'noCambioExplicito', r.explicit_no_change,
                    'razonDeNoCambio', r.no_change_reason,
                    'esDeEstaEvidencia', COALESCE(r.es_de_esta_evidencia, false))
                  FROM resultado r),
    -- El ESTADO de cada dimensión, nunca su valor.
    'dimensiones', (SELECT jsonb_build_object(
                      'recorrido', d.exposure_state,
                      'practica', d.practice_state,
                      'dominio', d.domain_state,
                      'confianza', d.confidence_state,
                      'confianzaEn', d.confidence_declared_at,
                      'recenciaEn', d.recency_at) FROM dimensiones d),
    'siguiente', (SELECT jsonb_build_object('objetivo', sg.objective, 'razon', sg.razon)
                    FROM siguiente sg),
    'bitacora', COALESCE((SELECT jsonb_agg(jsonb_build_object(
                            'accionId', ci.accion_id,
                            'objetivo', ci.objetivo,
                            'desde', ci.desde,
                            'entradas', ci.entradas)
                          ORDER BY ci.desde DESC)
                          FROM ciclos ci), '[]'::jsonb)
  )
  FROM cursada cu
  JOIN course_offering o ON o.id = cu.offering_id
  JOIN course c ON c.id = o.course_id
  JOIN student s ON s.id = p_student_id AND s.institution_id = p_institution_id;
$function$;

GRANT EXECUTE ON FUNCTION public.estado_de_progreso TO service_role;
