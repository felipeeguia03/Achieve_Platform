-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.3 — el circuito, cerrado de verdad
--
-- El Done de la fase es una sola frase: *"toda señal relevante cierra su
-- circuito causa → owner → playbook → SLA → intervención → outcome; ninguna
-- señal queda sin outcome registrado"*.
--
-- Eso no se cumple escribiendo bien: se cumple **cuando no se puede escribir
-- mal**. Estas tres funciones son las que lo hacen imposible.
--
--   · `abrir_intervencion`  — no hay intervención sin dueño, y si nace de una
--     señal, la señal tiene que estar pidiéndola.
--   · `cerrar_intervencion` — cerrar y registrar el resultado son **una sola
--     escritura**. Media deja una intervención cerrada sin outcome, que es
--     exactamente lo que la fase existe para impedir.
--   · `resolver_senal`      — una señal sólo llega a `RESOLVED` si hubo una
--     intervención **con outcome**. El dashboard no es el final del Risk Engine.
--
-- Y una cuarta que no escribe nada: `circuito_de_senales()`, que audita el Done
-- en vez de declararlo. Es la misma idea que `tests/invariantes.test.ts` — un
-- criterio de cierre que se revisa a mano se marca cumplido sin revisar.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.abrir_intervencion(
  p_institution_id   UUID,
  p_risk_signal_id   UUID,      -- NULL ⇒ intervención sin señal previa
  p_student_id       UUID,
  p_owner_operator_id UUID,
  p_owner_verified   BOOLEAN,
  p_playbook_id      UUID,
  p_sla_at           TIMESTAMPTZ,
  p_idempotency_key  TEXT DEFAULT NULL
)
RETURNS TABLE (intervention_id UUID, sla_at TIMESTAMPTZ, duplicado BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_existente UUID;
  v_sla_prev  TIMESTAMPTZ;
  v_estado    TEXT;
  v_sla       TIMESTAMPTZ := p_sla_at;
  v_minutos   INTEGER;
  v_id        UUID;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT i.id, i.sla_at INTO v_existente, v_sla_prev FROM intervention i
     WHERE i.institution_id = p_institution_id AND i.idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN QUERY SELECT v_existente, v_sla_prev, TRUE;
      RETURN;
    END IF;
  END IF;

  -- Si nace de una señal, la señal tiene que estar pidiendo una persona. Una
  -- intervención sobre una señal `OPEN` saltearía el reconocimiento, y sobre
  -- una `RESOLVED` reabriría algo que ya cerró.
  IF p_risk_signal_id IS NOT NULL THEN
    SELECT s.status INTO v_estado FROM risk_signal s
     WHERE s.id = p_risk_signal_id AND s.institution_id = p_institution_id
     FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'la señal % no pertenece a la institución %',
        p_risk_signal_id, p_institution_id;
    END IF;
    IF v_estado <> 'INTERVENTION_REQUIRED' THEN
      RAISE EXCEPTION 'la señal está en % y no pide intervención', v_estado;
    END IF;
  END IF;

  -- El SLA sale del playbook cuando el playbook lo declara. **No se inventa uno
  -- cuando no hay playbook**: `C01-044` es el dueño de esos valores, y un
  -- vencimiento inventado es una promesa a una persona real.
  IF v_sla IS NULL AND p_playbook_id IS NOT NULL THEN
    SELECT pb.sla_minutes INTO v_minutos FROM playbook pb WHERE pb.id = p_playbook_id;
    IF v_minutos IS NOT NULL THEN
      v_sla := NOW() + make_interval(mins => v_minutos);
    END IF;
  END IF;

  INSERT INTO intervention (
    institution_id, risk_signal_id, student_id, owner_operator_id, owner_verified,
    playbook_id, sla_at, status, idempotency_key
  ) VALUES (
    p_institution_id, p_risk_signal_id, p_student_id, p_owner_operator_id,
    COALESCE(p_owner_verified, FALSE), p_playbook_id, v_sla, 'open', p_idempotency_key
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_sla, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.abrir_intervencion FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.abrir_intervencion TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cerrar_intervencion(
  p_institution_id  UUID,
  p_intervention_id UUID,
  p_outcome         TEXT,
  p_note            TEXT,
  p_recorded_by     UUID,
  p_human_minutes   INTEGER DEFAULT NULL
)
RETURNS TABLE (cerrada BOOLEAN, ya_estaba BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_estado TEXT;
BEGIN
  SELECT i.status INTO v_estado FROM intervention i
   WHERE i.id = p_intervention_id AND i.institution_id = p_institution_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'la intervención % no pertenece a la institución %',
      p_intervention_id, p_institution_id;
  END IF;

  -- Cerrar dos veces no es un error del que haya que avisar: es un reintento.
  -- Se devuelve lo que ya había y **no se pisa el outcome registrado**.
  IF v_estado = 'closed' THEN
    RETURN QUERY SELECT TRUE, TRUE;
    RETURN;
  END IF;

  -- La máquina la valida el Service; acá se comprueba lo que la transacción
  -- necesita saber para no dejar el circuito a medias.
  IF v_estado <> 'acknowledged' THEN
    RAISE EXCEPTION 'una intervención en % no se puede cerrar sin reconocerla', v_estado;
  END IF;

  -- Las dos escrituras, juntas. Cerrar sin outcome es el único modo real de
  -- romper el Done de esta fase, y esta transacción es lo que lo impide.
  INSERT INTO intervention_outcome (intervention_id, outcome, note, recorded_by)
  VALUES (p_intervention_id, p_outcome, p_note, p_recorded_by);

  UPDATE intervention
     SET status = 'closed',
         closed_at = NOW(),
         human_minutes = COALESCE(p_human_minutes, human_minutes)
   WHERE id = p_intervention_id;

  RETURN QUERY SELECT TRUE, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.cerrar_intervencion FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cerrar_intervencion TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- `RESOLVED` exige una intervención con outcome
--
-- Es la traducción literal de *"el dashboard no es el final del Risk Engine. El
-- final es una señal resuelta, escalada o explícitamente cerrada con
-- resultado"*. Marcar resuelta una señal que nadie trabajó sería justamente el
-- dashboard en verde sin nada detrás.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.resolver_senal(
  p_institution_id UUID,
  p_risk_signal_id UUID
)
RETURNS TABLE (resuelta BOOLEAN, motivo TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_estado TEXT;
  v_con_outcome INTEGER;
BEGIN
  SELECT s.status INTO v_estado FROM risk_signal s
   WHERE s.id = p_risk_signal_id AND s.institution_id = p_institution_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'la señal % no pertenece a la institución %',
      p_risk_signal_id, p_institution_id;
  END IF;
  IF v_estado <> 'INTERVENTION_REQUIRED' THEN
    RETURN QUERY SELECT FALSE, format('la señal está en %s', v_estado);
    RETURN;
  END IF;

  SELECT count(*)::INTEGER INTO v_con_outcome
    FROM intervention i
    JOIN intervention_outcome o ON o.intervention_id = i.id
   WHERE i.risk_signal_id = p_risk_signal_id;

  IF v_con_outcome = 0 THEN
    RETURN QUERY SELECT FALSE, 'ninguna intervención registró un outcome';
    RETURN;
  END IF;

  UPDATE risk_signal
     SET status = 'RESOLVED', resolved_at = NOW()
   WHERE id = p_risk_signal_id;

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.resolver_senal FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_senal TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- El Done, auditado en vez de declarado
--
-- Devuelve **dónde está roto el circuito**, no cuántas señales hay. Cada fila
-- que devuelva distinta de cero es una parte del Done que todavía no se cumple,
-- y las dos primeras hoy devuelven lo que tienen que devolver: no hay playbooks
-- (`C01-044`) ni directorio de operadores (`C01-039`), así que el circuito está
-- incompleto **y lo dice** en vez de fingir que cerró.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.circuito_de_senales(p_institution_id UUID)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'senales', (SELECT count(*) FROM risk_signal WHERE institution_id = p_institution_id),
    -- Toda señal tiene causa: es `NOT NULL`. Se cuenta igual, porque el Done lo
    -- nombra y un invariante que nadie mira es un invariante que se pierde.
    'sinCausa', (SELECT count(*) FROM risk_signal
                  WHERE institution_id = p_institution_id AND btrim(reason) = ''),
    -- Señales que pidieron una persona y nadie tomó.
    'sinDuenio', (SELECT count(*) FROM risk_signal s
                   WHERE s.institution_id = p_institution_id
                     AND s.status = 'INTERVENTION_REQUIRED'
                     AND NOT EXISTS (SELECT 1 FROM intervention i WHERE i.risk_signal_id = s.id)),
    'sinPlaybook', (SELECT count(*) FROM intervention
                     WHERE institution_id = p_institution_id AND playbook_id IS NULL),
    'sinSla', (SELECT count(*) FROM intervention
                WHERE institution_id = p_institution_id AND sla_at IS NULL),
    -- El corazón del Done: cerrada sin resultado. Debe ser CERO siempre, y lo
    -- garantiza `cerrar_intervencion()`.
    'cerradasSinOutcome', (SELECT count(*) FROM intervention i
                            WHERE i.institution_id = p_institution_id AND i.status = 'closed'
                              AND NOT EXISTS (SELECT 1 FROM intervention_outcome o
                                               WHERE o.intervention_id = i.id)),
    'resueltasSinOutcome', (SELECT count(*) FROM risk_signal s
                             WHERE s.institution_id = p_institution_id AND s.status = 'RESOLVED'
                               AND NOT EXISTS (SELECT 1 FROM intervention i
                                                JOIN intervention_outcome o ON o.intervention_id = i.id
                                               WHERE i.risk_signal_id = s.id)),
    'duenioSinVerificar', (SELECT count(*) FROM intervention
                            WHERE institution_id = p_institution_id AND NOT owner_verified),
    'slaVencido', (SELECT count(*) FROM intervention
                    WHERE institution_id = p_institution_id AND status <> 'closed'
                      AND sla_at IS NOT NULL AND sla_at < NOW()),
    -- Lo que falta para que el circuito pueda cerrarse entero, dicho por su
    -- nombre en vez de deducido de los ceros de arriba.
    'faltan', (SELECT jsonb_strip_nulls(jsonb_build_object(
        'playbooks', CASE WHEN NOT EXISTS (SELECT 1 FROM playbook) THEN 'C01-044' END,
        'directorioDeOperadores', CASE WHEN EXISTS (
            SELECT 1 FROM intervention WHERE institution_id = p_institution_id AND NOT owner_verified
          ) THEN 'C01-039 · contrato v2' END,
        'reglasSinUmbral', CASE WHEN EXISTS (
            SELECT 1 FROM risk_rule WHERE is_current AND threshold_config IS NULL
          ) THEN 'C01-036' END)))
  );
$$;

GRANT EXECUTE ON FUNCTION public.circuito_de_senales TO service_role;

COMMENT ON FUNCTION public.circuito_de_senales IS
  'Audita el Done de la Fase B6. Cada contador distinto de cero es una parte del circuito sin cerrar.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Registrar una señal, con `I8`
--
-- Va por función y no por `INSERT` del cliente por el duplicado: una detección
-- reintentada no puede aparecer como dos señales del mismo hecho, y avisarle
-- dos veces a una persona que un estudiante está en problemas es peor que un
-- dato de más — es ruido en la cola de alguien que decide con eso.
--
-- **La función no decide que hay riesgo.** Recibe la señal ya producida, con su
-- causa y con la regla contra la que se produjo. `C01-021` sigue `OPEN`.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_senal(
  p_institution_id       UUID,
  p_student_id           UUID,
  p_course_enrollment_id UUID,
  p_signal_type          TEXT,
  p_severity             TEXT,
  p_reason               TEXT,
  p_source_ref           TEXT,
  p_risk_rule_id         UUID,
  p_rule_version         TEXT,
  p_valid_until          TIMESTAMPTZ,
  p_idempotency_key      TEXT
)
RETURNS TABLE (signal_id UUID, duplicado BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_existente UUID;
  v_id        UUID;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT s.id INTO v_existente FROM risk_signal s
     WHERE s.institution_id = p_institution_id AND s.idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN QUERY SELECT v_existente, TRUE;
      RETURN;
    END IF;
  END IF;

  -- El scoping va en el WHERE (`I11`): un estudiante de otra institución no
  -- puede recibir una señal de ésta.
  PERFORM 1 FROM student
   WHERE id = p_student_id AND institution_id = p_institution_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'el estudiante % no pertenece a la institución %',
      p_student_id, p_institution_id;
  END IF;

  INSERT INTO risk_signal (
    institution_id, student_id, course_enrollment_id, signal_type, severity,
    reason, source_ref, risk_rule_id, rule_version, valid_until, idempotency_key
  ) VALUES (
    p_institution_id, p_student_id, p_course_enrollment_id, p_signal_type, p_severity,
    p_reason, p_source_ref, p_risk_rule_id, p_rule_version, p_valid_until, p_idempotency_key
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_senal FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_senal TO service_role;
