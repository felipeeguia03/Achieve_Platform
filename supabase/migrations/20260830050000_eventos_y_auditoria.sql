-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B1.5 — `product_event` y `audit_log`, append-only
--
-- `docs/data-model.md` §10 (las dos tablas de eventos) y el invariante I11/I12:
-- *"`product_event` y `audit_log` son append-only — revocar `UPDATE`/`DELETE`"*.
--
-- ⚠️ **Acá choca ADR-006 y se deja escrito en vez de resolverlo.**
-- Un log append-only y un derecho de supresión empujan en direcciones
-- opuestas. La salida habitual es *borrar el contenido y conservar el hecho*,
-- pero eso lo valida asesoría legal, no esta migración.
--
-- Lo que sí se hace ahora, porque no cierra ninguna de las dos salidas:
--
--   * **El hecho y el contenido están en columnas distintas.** `event_name`,
--     `actor_id`, `subject_*` y `occurred_at` son el hecho; `payload`,
--     `before_value` y `after_value` son lo único que podría contener dato
--     personal. Vaciar esas tres columnas conservando la fila es una operación
--     de una línea el día que ADR-006 lo autorice.
--   * **No se construye ningún mecanismo de borrado.** Inventarlo hoy sería
--     adelantar la decisión, y además el append-only lo prohíbe: hacen falta
--     las dos cosas a la vez, y quién puede hacerlo es parte de lo que falta
--     decidir.
-- ─────────────────────────────────────────────────────────────────────────────

-- Product Event Model. Append-only.
CREATE TABLE product_event (
  id             BIGSERIAL PRIMARY KEY,
  event_name     TEXT NOT NULL,
  institution_id UUID NOT NULL,
  actor_id       UUID,
  subject_type   TEXT NOT NULL,
  subject_id     UUID NOT NULL,
  cause_ref      TEXT,
  payload        JSONB NOT NULL DEFAULT '{}',
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX product_event_subject_idx ON product_event (subject_type, subject_id, occurred_at DESC);

-- Auditoría de accesos y cambios críticos (R3).
CREATE TABLE audit_log (
  id             BIGSERIAL PRIMARY KEY,
  institution_id UUID NOT NULL,
  actor_id       UUID,
  action         TEXT NOT NULL,
  target_type    TEXT NOT NULL,
  target_id      UUID,
  before_value   JSONB,
  after_value    JSONB,
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_log_target_idx      ON audit_log (target_type, target_id, occurred_at DESC);
CREATE INDEX audit_log_institution_idx ON audit_log (institution_id, occurred_at DESC);

COMMENT ON COLUMN product_event.payload IS
  'Única columna con dato potencialmente personal. Ver ADR-006: el hecho se conserva, el contenido es lo que podría purgarse.';
COMMENT ON COLUMN audit_log.before_value IS
  'Idem payload: contenido, no hecho. Ver ADR-006.';

ALTER TABLE product_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log     ENABLE ROW LEVEL SECURITY;

-- ── Append-only, de verdad (I12) ─────────────────────────────────────────────
--
-- Se revoca a `service_role`, que es el rol con el que entra el backend. Que la
-- regla valga sólo para roles que nadie usa no es una regla: el riesgo real es
-- un `UPDATE` del propio backend, no un cliente anónimo que ya no llega.
--
-- Sin `GRANT UPDATE/DELETE`, ni un bug ni una migración distraída pueden
-- reescribir el pasado. Cambiar esto exige una migración explícita, que es
-- exactamente la fricción que se busca.
REVOKE UPDATE, DELETE, TRUNCATE ON product_event FROM service_role, anon, authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log     FROM service_role, anon, authenticated;

-- Y que no vuelvan por la puerta de los privilegios por defecto de la B1.3.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE UPDATE, DELETE ON TABLES FROM service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON product_event FROM service_role;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_log     FROM service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT UPDATE, DELETE ON TABLES TO service_role;

-- ── Verificable, como todo lo demás ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tablas_append_only_violadas()
RETURNS TABLE (nombre TEXT, privilegio TEXT)
LANGUAGE sql STABLE AS $$
  SELECT t.tabla, p.priv
  FROM (VALUES ('product_event'), ('audit_log')) AS t(tabla)
  CROSS JOIN (VALUES ('UPDATE'), ('DELETE')) AS p(priv)
  CROSS JOIN (VALUES ('service_role'), ('anon'), ('authenticated')) AS r(rol)
  WHERE has_table_privilege(r.rol, ('public.' || t.tabla)::regclass, p.priv);
$$;

COMMENT ON FUNCTION public.tablas_append_only_violadas() IS
  'I12: debe devolver cero filas. El pasado no se reescribe.';
