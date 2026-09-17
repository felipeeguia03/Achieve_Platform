-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B2.3 — Evidence, resubmission y storage
--
-- ADR-005 ítem 4, cerrado por el owner: **Supabase Storage, bucket privado**,
-- `storage_ref` guarda **la clave del objeto y no una URL** —una URL guardada
-- vence y deja un dato muerto—, y el navegador sube **directo con URL firmada
-- de corta duración** que emite el backend.
--
-- ⚠️ **Retención y borrado siguen en ADR-006.** Acá no se construye ningún
-- borrado, igual que en `audit_log`: hacerlo sería adelantar esa decisión.
-- ─────────────────────────────────────────────────────────────────────────────

-- Bucket privado. `public = false` es el punto: sin firma no se lee nada, ni
-- adivinando la URL. La producción de un estudiante no es contenido público.
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencia', 'evidencia', false)
ON CONFLICT (id) DO NOTHING;

-- Sin políticas de `storage.objects` para `anon`/`authenticated`: el acceso es
-- siempre por URL firmada que emite el backend. La firma ES el control de
-- acceso, y es de corta duración.

/**
 * Resubmission — `I4`: crea una Evidence **nueva** que preserva la anterior.
 *
 * Las dos escrituras van juntas: la nueva apunta a la vieja con `supersedes_id`
 * y la vieja apunta a la nueva con `superseded_by_id`. **Nada se sobrescribe y
 * nada se borra.** La anterior conserva su estado, su contenido y su fecha.
 *
 * El `WHERE lifecycle_state = 'RESUBMISSION_REQUESTED'` es concurrencia, no
 * regla: qué estados admiten resubmission lo decide `evidenceOwnerTransitions`
 * en el Service, en TypeScript.
 */
CREATE OR REPLACE FUNCTION public.resubmitir_evidencia(
  p_institution_id  UUID,
  p_anterior_id     UUID,
  p_canal           TEXT,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS SETOF evidence
LANGUAGE plpgsql
AS $$
DECLARE
  v_action_id     UUID;
  v_commitment_id UUID;
  v_nueva_id      UUID;
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
    institution_id, action_id, commitment_id, lifecycle_state,
    supersedes_id, submission_channel, submitted_at, idempotency_key
  ) VALUES (
    p_institution_id, v_action_id, v_commitment_id, 'SUBMITTED',
    p_anterior_id, p_canal, NOW(), p_idempotency_key
  )
  RETURNING id INTO v_nueva_id;

  -- La anterior sólo aprende quién la sucede. Su estado, su contenido y su
  -- fecha quedan intactos: es el registro de lo que se entregó primero.
  UPDATE evidence SET superseded_by_id = v_nueva_id WHERE id = p_anterior_id;

  RETURN QUERY SELECT * FROM evidence WHERE id = v_nueva_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resubmitir_evidencia FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resubmitir_evidencia TO service_role;

-- Una cadena de resubmission es lineal: una evidencia sucede a lo sumo a una.
CREATE UNIQUE INDEX evidence_supersedes_unico ON evidence (supersedes_id)
  WHERE supersedes_id IS NOT NULL;
