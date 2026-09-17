-- ═══════════════════════════════════════════════════════════════════════════
-- Etapa B6.9.2 — El reenvío, alcanzable
--
-- `resubmitir_evidencia` existe desde la Etapa B2.5 y **nunca tuvo un llamador
-- fuera de los tests**. Al conectarla aparecieron dos cosas que no se podían
-- ver mientras nadie la usaba.
--
-- ## 1 · El id lo tiene que elegir quien llama
--
-- La clave del objeto en Storage se **deriva del id de la evidencia**
-- (`<institución>/<evidencia>/<archivo>`), y por eso la entrega va en dos
-- tiempos: `?firmar=` reserva el id, el cliente sube, y recién después nace la
-- fila (`D3·A`). La versión anterior generaba el id **adentro de la base**, así
-- que el cliente no tenía a qué ruta subir: o la fila nacía antes que el
-- archivo —lo que `D3·A` decidió no hacer, porque deja una fila afirmando una
-- entrega que no ocurrió— o el reenvío no podía llevar archivo.
--
-- Ahora el id entra por parámetro, igual que en la primera entrega.
--
-- ## 2 · Las tres señales entraban en NULL
--
-- La primera entrega las escribe en `not_evaluated`, y el motivo está escrito:
-- *"`none` afirma que se miró y no había nada; `not_evaluated` dice que nadie
-- miró todavía"*. La versión anterior no las tocaba, y `signal_execution` y
-- `signal_production` son nullables: un reenvío nacía con **`NULL`**, que es un
-- tercer significado que nadie definió. Nunca se notó porque ninguna fila
-- llegaba a existir por este camino.
--
-- **Se reemplaza la función anterior en vez de agregar una segunda:** dos
-- versiones de la misma operación es como se desincronizan, y su único llamador
-- es `resubmitirAtomico`.
-- ═══════════════════════════════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.resubmitir_evidencia(UUID, UUID, TEXT, TEXT);

CREATE FUNCTION public.resubmitir_evidencia(
  p_institution_id  UUID,
  p_anterior_id     UUID,
  p_nueva_id        UUID,
  p_canal           TEXT,
  p_uploaded_by     UUID    DEFAULT NULL,
  p_idempotency_key TEXT    DEFAULT NULL
)
RETURNS SETOF evidence
LANGUAGE plpgsql
AS $$
DECLARE
  v_action_id     UUID;
  v_commitment_id UUID;
BEGIN
  SELECT action_id, commitment_id INTO v_action_id, v_commitment_id
    FROM evidence
   WHERE id = p_anterior_id
     AND institution_id = p_institution_id
     AND lifecycle_state = 'RESUBMISSION_REQUESTED'
     AND superseded_by_id IS NULL   -- ya resubmitida: no se encadena dos veces
     FOR UPDATE;

  IF v_action_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO evidence (
    id, institution_id, action_id, commitment_id, lifecycle_state,
    supersedes_id, submission_channel, uploaded_by, submitted_at,
    signal_execution, signal_production, signal_domain, idempotency_key
  ) VALUES (
    p_nueva_id, p_institution_id, v_action_id, v_commitment_id, 'SUBMITTED',
    p_anterior_id, p_canal, p_uploaded_by, NOW(),
    -- Las mismas tres de la primera entrega, y por el mismo motivo: nadie las
    -- miró todavía. `validation_method` queda NULL: lo escribe quien juzgue.
    'not_evaluated', 'not_evaluated', 'not_evaluated', p_idempotency_key
  );

  -- La anterior sólo aprende quién la sucede. Su estado, su contenido y su
  -- fecha quedan intactos: es el registro de lo que se entregó primero.
  UPDATE evidence SET superseded_by_id = p_nueva_id WHERE id = p_anterior_id;

  RETURN QUERY SELECT * FROM evidence WHERE id = p_nueva_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resubmitir_evidencia FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resubmitir_evidencia TO service_role;
