-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.2 — el lifecycle de `risk_signal`, corregido
--
-- Ejecuta los puntos §7.1 y §7.2 del plan de `contrato-riesgo-candidato-v0.2.md`,
-- aprobados por [ADR-034](../../docs/decisions.md#adr-034), que cerró `C01-022`.
--
-- ## Qué estaba mal
--
-- La máquina de la B6 era `OPEN → ACKNOWLEDGED → INTERVENTION_REQUIRED`, y
-- `abrir_intervencion()` exige que la señal esté en `INTERVENTION_REQUIRED`.
-- Con el operador dentro de la Plataforma, *"alguien la miró"* era un paso real
-- del recorrido. Con el operador en el CRM ([ADR-033](../../docs/decisions.md#adr-033))
-- **nadie podía producir ese paso**: quedó un peaje sin cobrador, y la máquina
-- no se podía recorrer entera.
--
-- ## Qué hace esta migración
--
-- **Una sola cosa, y es un `NO`.** Impedir que un escritor nuevo meta una señal
-- en `ACKNOWLEDGED`. El resto del lifecycle vive en `lib/domain/state-machines.ts`
-- y no necesita schema: habilitar `OPEN → INTERVENTION_REQUIRED` es agregar un
-- destino a una tabla de transiciones.
--
-- ## Qué NO hace, y es la mitad del punto
--
-- **No borra nada.** Ni el valor `'ACKNOWLEDGED'` del `CHECK`, ni la columna
-- `acknowledged_at`, ni una sola fila. Una señal anterior a ADR-034 conserva su
-- significado —*"alguien tomó conocimiento"*— y **conserva sus salidas**: puede
-- llegar a `INTERVENTION_REQUIRED` o a `EXPIRED` y terminar su recorrido.
--
-- Reinterpretar un valor existente es reescribir lo que pasó. Es la misma regla
-- con la que la B5 apagó `EP-SPEC v0.1` con un `UPDATE` y no un `DELETE`, y con
-- la que ADR-033 prohibió redefinir `owner_verified` en el lugar.
--
-- ⚠️ ADR-006 sigue `PROVISIONAL`: sólo datos sintéticos.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── El `NO`, en la base ──────────────────────────────────────────────────────
--
-- Va como trigger y no como `CHECK` porque la regla **necesita ver el estado
-- anterior**: prohibido es *entrar* a `ACKNOWLEDGED`, no *estar* ahí. Un
-- `CHECK` sólo mira la fila nueva y volvería ilegales las filas históricas, que
-- es exactamente lo contrario de lo que se decidió.
--
-- Y va en la base además de en el tipo de TypeScript porque el Service no es el
-- único camino: `service_role` puede escribir la tabla directo, y una regla que
-- sólo vive en una capa se saltea desde la de abajo.
CREATE OR REPLACE FUNCTION public.senal_no_entra_a_acknowledged()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'ACKNOWLEDGED'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'ACKNOWLEDGED') THEN
    RAISE EXCEPTION
      'ACKNOWLEDGED es legacy desde ADR-034: una señal nueva no entra ahí. '
      'Que el operador se hizo cargo es intervention.status = ''acknowledged''.';
  END IF;
  RETURN NEW;
END;
$$;

-- `OLD.status IS DISTINCT FROM 'ACKNOWLEDGED'` es lo que deja pasar los dos
-- casos legítimos sobre una fila histórica: moverla fuera de `ACKNOWLEDGED`
-- (el `NEW.status` ya no es ese) y tocarle cualquier otra columna sin moverla
-- (el `OLD.status` ya era ese).
CREATE TRIGGER risk_signal_acknowledged_legacy
  BEFORE INSERT OR UPDATE ON risk_signal
  FOR EACH ROW EXECUTE FUNCTION public.senal_no_entra_a_acknowledged();

COMMENT ON FUNCTION public.senal_no_entra_a_acknowledged IS
  'ADR-034: ACKNOWLEDGED es legacy. Prohibe entrar, no estar: las filas históricas terminan su recorrido.';

COMMENT ON COLUMN risk_signal.acknowledged_at IS
  'Legacy (ADR-034). Se conserva: las señales que la tienen registraron un hecho real.';
