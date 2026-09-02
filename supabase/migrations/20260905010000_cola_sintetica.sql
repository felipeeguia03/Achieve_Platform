-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.6.3 — dónde aterriza un caso escalado, por ahora
--
-- ⚠️ **SINTÉTICA Y TRANSITORIA.** Esta tabla **no es el CRM** y no convierte a
-- la Plataforma en una herramienta operativa. Existe para que el recorrido del
-- MVP se pueda demostrar entero mientras el contrato con el CRM está congelado
-- ([ADR-035](../../docs/decisions.md#adr-035)), y para que el día que llegue el
-- adaptador real **el dominio no se entere del cambio**.
--
-- ## Por qué es una tabla y no un `console.log`
--
-- Porque el Done de la fase es *"encontrar exactamente un caso pendiente"*, y
-- eso hay que poder mirarlo dos veces y que dé lo mismo. Un log no se consulta,
-- no se puede probar que no duplica, y desaparece.
--
-- ## Lo que NO es
--
-- **No es lifecycle.** `delivery_status` es estado de **entrega**, no de
-- dominio: que un caso esté pendiente o entregado no cambia `risk_signal` ni
-- `intervention`, y no hay FK que permita lo contrario. Es la misma separación
-- que ADR-034 hizo entre transporte y dominio, y por el mismo motivo.
--
-- ## Lo que NO viaja, y es la mitad del diseño
--
-- Sin evidencia académica, sin reflexiones, sin `owner_operator_id`, sin
-- `crm_case_id`, sin playbook y sin SLA. Lo único que va es **quién** y **qué le
-- está pasando, en una frase** — que es lo que hace falta para poner un caso en
-- una cola.
--
-- `institution_id` **sí** va, y no es una institución inferida: es la frontera
-- de tenant que `I11` exige, y viene de la señal, no de una deducción.
--
-- ⚠️ ADR-006 sigue `PROVISIONAL`: sólo datos sintéticos.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE escalation_sink (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL REFERENCES institution(id) ON DELETE RESTRICT,
  -- La señal que lo originó. `CASCADE`: si la señal se borra, el caso de
  -- demostración no tiene sentido por su cuenta.
  risk_signal_id  UUID NOT NULL REFERENCES risk_signal(id) ON DELETE CASCADE,
  -- La identidad canónica del estudiante, que es la que los dos sistemas
  -- comparten (`platformStudentId`).
  student_id      UUID NOT NULL REFERENCES student(id) ON DELETE CASCADE,

  -- La explicación útil, en una frase. Es la causa que registró la señal: **no
  -- se vuelve a evaluar nada acá**.
  explanation     TEXT NOT NULL CHECK (length(btrim(explanation)) > 0),

  -- Estado de **entrega**, nunca de dominio.
  delivery_status TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (delivery_status IN ('pendiente','entregado')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at    TIMESTAMPTZ,

  CONSTRAINT entregado_tiene_fecha
    CHECK (delivery_status <> 'entregado' OR delivered_at IS NOT NULL)
);

-- **Un caso por señal.** Es la idempotencia del punto 6: un replay o un
-- reprocesamiento no puede poner el mismo estudiante dos veces en la cola.
CREATE UNIQUE INDEX escalation_sink_una_por_senal ON escalation_sink (risk_signal_id);
CREATE INDEX escalation_sink_pendientes
  ON escalation_sink (institution_id, created_at) WHERE delivery_status = 'pendiente';

ALTER TABLE escalation_sink ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE escalation_sink IS
  'SINTÉTICA Y TRANSITORIA (B6.6.3). No es el CRM. delivery_status es entrega, nunca dominio.';
COMMENT ON COLUMN escalation_sink.delivery_status IS
  'Estado de transporte. No cambia risk_signal ni intervention: misma separación que ADR-034.';
