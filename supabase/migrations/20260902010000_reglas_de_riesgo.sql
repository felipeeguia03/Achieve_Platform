-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B6.2 — las tres situaciones que nombró la profesional
--
-- `HUMAN-P0-06 v1.0` no contestó *"qué es una señal de riesgo"* en abstracto:
-- contestó **cuándo hace falta una persona**, y las tres situaciones que nombró
-- son situaciones **del estudiante**, no propiedades de una entrega. Por eso
-- entran acá y no en el lifecycle de `Evidence`.
--
-- Su cierre es la frase que define el rol Operador entero: *"ya no se trata
-- solamente de verificar si una respuesta está bien o mal, sino de comprender
-- qué le está pasando a ese estudiante"*.
--
-- ## Lo que se carga
--
-- El texto de las tres, verbatim, y `modo = 'HUMANA'` — que **también es su
-- respuesta**: *"En esos casos si considero importante la intervención de una
-- persona"*. La pregunta abierta del spec §32 —*"¿qué RiskSignals disparan
-- intervención automática, humana o sólo observación?"*— queda contestada para
-- estas tres, y sigue abierta para cualquier otra.
--
-- ## Lo que NO se carga, y por eso ninguna corre sola
--
--   · `threshold_config` → **NULL**. Cuántas repeticiones hacen a un error
--     "reiterativo" es `C01-036`, y es de ella. Sin umbral, el `CHECK`
--     `automatica_exige_umbral` impide que la regla pase a `AUTOMATICA`.
--   · `suggested_severity` → **NULL**. Nadie asignó severidad. **No es `bajo`.**
--
-- **Nada evalúa estas reglas.** Son el catálogo de lo que el Risk Engine v1 va a
-- mirar cuando `C01-021` cierre; hoy una señal la escribe quien la detectó, con
-- su razón, y esta tabla dice contra qué regla la escribió.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO risk_rule (
  canonical_id, version, signal_type, label, source_text,
  threshold_config, suggested_severity, modo, is_current,
  provisional_default_id, provisional_version
) VALUES
  ('HP0-06-1', 'v1.0', 'error_reiterado',
   'Un error que se repite y exige corregir el método',
   'cuando aparece un error reiterativo que requiere identificar que está haciendo mal y corregir la forma/método',
   NULL, NULL, 'HUMANA', TRUE, 'HUMAN-P0-06', 'v1.0'),

  ('HP0-06-2', 'v1.0', 'sin_avance_pese_a_devoluciones',
   'No logra avanzar a pesar de las devoluciones',
   'cuando no logra avanzar a pesar de las devoluciones',
   NULL, NULL, 'HUMANA', TRUE, 'HUMAN-P0-06', 'v1.0'),

  ('HP0-06-3', 'v1.0', 'factores_subjetivos',
   'Factores subjetivos: frustración, inseguridad, desmotivación, ansiedad',
   'cuando intervienen factores más subjetivos, como frustración, inseguridad, desmotivación, ansiedad frente al examen',
   NULL, NULL, 'HUMANA', TRUE, 'HUMAN-P0-06', 'v1.0');

COMMENT ON COLUMN risk_rule.modo IS
  'HUMANA en las tres de HUMAN-P0-06: lo dijo ella. Para cualquier otra regla, la pregunta del spec §32 sigue abierta.';
