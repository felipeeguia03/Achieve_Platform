-- ═══════════════════════════════════════════════════════════════════════════
-- Etapa B6.11 — La institución tiene zona horaria
--
-- ADR-046 §5 dice que el nuevo horario de una renegociación cae *"en el mismo
-- día calendario, en la **zona horaria de la institución**"*, y ADR-048 dice
-- que el corte de los 14 días *"usa la **zona horaria institucional**"*.
--
-- **Esa zona no existía.** `institution` tenía `id`, `name`, `tenant_config`
-- —vacío, sin un solo lector en `lib`, `scripts` ni migraciones— y
-- `created_at`. Lo único que el producto sabía era la zona del **estudiante**
-- (`student.timezone`, B1.2) y la **congelada en el acuerdo**
-- (`commitment.timezone_at_commit`, B1.4), y todas las superficies proyectan
-- `'zona', COALESCE(s.timezone, 'UTC')`: la del estudiante.
--
-- No es un sinónimo. Dos estudiantes de la misma institución en husos
-- distintos ven distinto "mismo día calendario" y distinto día 14. Escribir
-- una de las dos reglas con `student.timezone` no sería implementarla: sería
-- cambiarla en silencio.
--
-- Por eso la columna nace acá, con **el mismo default que ya tiene
-- `student.timezone`** desde la B1.2 —no se elige un valor nuevo, sólo el
-- lugar donde vive el dato—, y `student.timezone` queda para lo suyo: a qué
-- hora ve el estudiante su propio día.
--
-- ⚠️ **Lo que esta migración NO hace, y no es un olvido:** no cambia ninguna
-- superficie existente. Las que proyectan `'zona'` siguen proyectando la del
-- estudiante, porque muestran **su** día. La zona institucional es para las
-- dos reglas de negocio que la nombran, y para nada más todavía.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE institution
  ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/Argentina/Cordoba';

COMMENT ON COLUMN institution.timezone IS
  'Zona horaria institucional (ADR-049). Define el "día calendario" de las reglas de '
  'negocio que lo nombran: elegibilidad de renegociación (ADR-046 §5) y ventana de '
  '14 días del Modo Examen (ADR-048). NO es la zona en la que el estudiante ve su día '
  '—esa es student.timezone— ni la congelada en el acuerdo —commitment.timezone_at_commit.';

-- Identificador IANA, y se verifica contra el catálogo del motor en vez de
-- contra una lista escrita a mano que envejece. `pg_timezone_names` no es
-- inmutable, así que esto **no puede ser un CHECK**: es un trigger.
--
-- ⚠️ Y por eso hay que anotarlo en el guard de `servicio-progreso.test.ts`.
-- `data-model.md` §11 prohíbe implementar reglas de negocio con triggers, y
-- este entra por la misma puerta que `senal_no_entra_a_acknowledged`: **no
-- calcula ni escribe nada, sólo levanta una excepción**. Un `CHECK` sería lo
-- correcto y el motor no lo permite acá; poner la validación sólo en la
-- aplicación no serviría, porque `service_role` escribe la tabla directo.
CREATE OR REPLACE FUNCTION public.institution_zona_valida()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = NEW.timezone) THEN
    RAISE EXCEPTION 'institution.timezone no es una zona IANA conocida: %', NEW.timezone
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.institution_zona_valida() IS
  'Una zona horaria mal escrita no falla al escribirla: falla meses después, al comparar '
  'días. Se rechaza en la escritura.';

CREATE TRIGGER institution_zona_valida
  BEFORE INSERT OR UPDATE OF timezone ON institution
  FOR EACH ROW EXECUTE FUNCTION public.institution_zona_valida();
