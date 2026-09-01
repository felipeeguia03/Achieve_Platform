-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B5.2 — el contenido del protocolo, cargado y rotulado
--
-- El protocolo es configuración versionada, así que el contenido entra por
-- `INSERT` y no por código. Esta migración carga **dos versiones**, y la
-- diferencia entre ellas es toda la decisión ADR-030:
--
--   · `EP-SPEC v0.1` — los 12 pasos `EP-01…EP-12` del spec. **Es asunción del
--     equipo**, y lo dice en sus propias columnas. `product.md` §8.1 los llama
--     *"arquitectura funcional provisional"*.
--   · `HUMAN-P0-04 v1.0` — el núcleo de las últimas 24 horas. **Es criterio
--     profesional confirmado** y está transcripto literal de
--     `human-p0-source.md` §4.
--
-- ## Lo que falta, dicho de frente
--
-- `HUMAN-P0-01 v1.0` confirmó la secuencia `PE-PSY-01…20` como base. **El
-- contenido de esos 20 pasos no está en el repositorio**: vive en el PDF del
-- cuestionario y nunca se transcribió. Escribirlo desde los 12 del spec sería
-- inventar criterio pedagógico, que es lo único que `AGENTS.md` prohíbe sin
-- excepción.
--
-- Por eso corre `EP-SPEC v0.1` con `provisional_default_id = 'EP-SPEC'`. El día
-- que la hoja se transcriba, cargar los 20 es un `INSERT` y un `UPDATE
-- is_current`: no hay migración de dominio, que es exactamente para lo que el
-- protocolo se diseñó como configuración.
--
-- ⚠️ Contenido sintético y provisional. ADR-006 sigue `PROVISIONAL`.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── `EP-SPEC v0.1` · una versión por modalidad ───────────────────────────────
--
-- Los 12 pasos del spec **no distinguen práctico de teórico**: la distinción que
-- `HUMAN-P0-07 v1.0` confirma es de los *criterios de corrección*, no de la
-- secuencia. Se cargan igual para las dos modalidades en vez de inventar un
-- protocolo "genérico" con una regla de precedencia que nadie aprobó: así
-- resolver el protocolo vigente es una igualdad, no un fallback.
INSERT INTO exam_protocol (modality, alcance, version, is_current)
SELECT m, 'COMPLETO', 'EP-SPEC v0.1', TRUE
  FROM unnest(ARRAY['practico','teorico_escrito']) AS m;

INSERT INTO protocol_step (
  exam_protocol_id, canonical_id, sequence, step_type, label,
  objective, expected_artifact, is_reentrant,
  provisional_default_id, provisional_version
)
SELECT p.id, s.canonical_id, s.sequence, s.step_type, s.label,
       s.objective, s.expected_artifact, s.is_reentrant,
       'EP-SPEC', 'v0.1'
  FROM exam_protocol p
  CROSS JOIN (VALUES
    ('EP-01',  1, 'contrato',    'Cerrar contrato del examen',
     'Confirmar fecha, modalidad, alcance, duración, profesor, materiales permitidos, recursos y dudas.',
     'Mapa del Examen confirmado.', FALSE),
    ('EP-02',  2, 'diagnostico', 'Baseline de preparación',
     'Medir qué puede hacer hoy sin ayuda completa y contrastar percepción con desempeño.',
     'Diagnóstico inicial.', FALSE),
    ('EP-03',  3, 'capacidad',   'Blindar capacidad',
     'Reservar bloques reales hasta la fecha de rendida. El protocolo asegura capacidad; el Engine decide qué poner dentro.',
     'Agenda / bloques confirmados.', FALSE),
    ('EP-04',  4, 'recursos',    'Cerrar kit de recursos',
     'Asegurar que existe el material correcto: programa, guías, bibliografía, resúmenes, evaluaciones previas.',
     'Kit de preparación confirmado.', FALSE),
    -- ── Tramo reentrante ──────────────────────────────────────────────────────
    -- `HUMAN-P0-01 v1.0` marca como reentrante *"estudio, recuperación, revisión
    -- y práctica"*, por número de paso sobre la matriz de 20. Sobre estos 12 la
    -- correspondencia es de actividad, no de número, y **forma parte del
    -- contenido provisional**: se reemplaza junto con él.
    ('EP-05',  5, 'cobertura',   'Ejecutar cobertura',
     'Trabajar unidades/temas mediante acciones del Academic Engine.',
     'Cobertura y evidencias acumuladas.', TRUE),
    ('EP-06',  6, 'recuperacion','Primera prueba sin red',
     'Retirar ayudas y comprobar recuperación/aplicación.',
     'Evidencia de desempeño autónomo.', TRUE),
    ('EP-07',  7, 'errores',     'Mapa de errores',
     'Convertir fallos en brechas concretas y acciones correctivas.',
     'Error Map.', TRUE),
    ('EP-08',  8, 'practica',    'Práctica tipo examen',
     'Realizar práctica suficientemente parecida al formato real.',
     'Simulacro / práctica equivalente.', TRUE),
    ('EP-09',  9, 'correccion',  'Cerrar brechas',
     'Reordenar el trabajo según errores y desempeño.',
     'Plan correctivo.', TRUE),
    -- ── Cierre ────────────────────────────────────────────────────────────────
    ('EP-10', 10, 'simulacion',  'Simulación final',
     'Ejecutar bajo condiciones lo más similares posibles al examen.',
     'Resultado final de simulación.', FALSE),
    ('EP-11', 11, 'logistica',   'Preparación final',
     'Decidir qué repasar, qué no intentar aprender, logística, sueño y estrategia.',
     'Checklist final.', FALSE),
    ('EP-12', 12, 'postmortem',  'Rendida y postmortem',
     'Registrar resultado, sorpresas, temas tomados, desempeño y aprendizajes.',
     'Outcome + postmortem.', FALSE)
  ) AS s(canonical_id, sequence, step_type, label, objective, expected_artifact, is_reentrant)
 WHERE p.version = 'EP-SPEC v0.1';

-- ── `HUMAN-P0-04 v1.0` · el núcleo de las últimas 24 horas ───────────────────
--
-- Transcripción **literal** de la respuesta A de `human-p0-source.md` §4:
-- *"Situación real y logística; contenidos críticos; una prueba breve sin
-- ayuda; priorización; práctica parecida al examen; corrección de los errores
-- importantes; descanso y estrategia."*
--
-- Son **siete componentes**, no uno. El default que corría antes de la
-- respuesta —*"consolidar y no incorporar contenido nuevo"*— era uno solo, y la
-- profesional lo acotó explícitamente: eso *"supone un ideal en el que ya todos
-- los temas fueron vistos, comprendidos y aprendidos"*.
--
-- `modality` va NULL a propósito: la fuente no distingue práctico de teórico
-- para el núcleo, y ponerle una sería inventar.
--
-- Los siete quedan `requirement = 'NO_CONFIGURADA'`. **`C01-034` pregunta
-- exactamente si son obligatorios o priorizables y en qué orden se sacrifican
-- cuando no entran todos.** Sigue abierto, así que el schema lo dice en vez de
-- suponer que los siete son obligatorios.
INSERT INTO exam_protocol (modality, alcance, version, is_current)
VALUES (NULL, 'NUCLEO_H24', 'HUMAN-P0-04 v1.0', TRUE);

INSERT INTO protocol_step (
  exam_protocol_id, canonical_id, sequence, step_type, label,
  objective, explanation, expected_artifact,
  provisional_default_id, provisional_version
)
SELECT p.id, s.canonical_id, s.sequence, s.step_type, s.label,
       s.objective, s.explanation, s.expected_artifact,
       'HUMAN-P0-04', 'v1.0'
  FROM exam_protocol p
  CROSS JOIN (VALUES
    ('H24-1', 1, 'logistica',    'Situación real y logística',
     'Trabajar desde la realidad: cuánto tiempo queda de verdad, dónde, con qué.',
     NULL, NULL),
    ('H24-2', 2, 'cobertura',    'Contenidos críticos',
     'Concentrar el poco tiempo en los contenidos críticos.',
     'Si hay un contenido central que nunca se trabajó, puede ser necesario abordarlo, aunque con expectativas realistas respecto del nivel de dominio que se puede alcanzar en tan poco tiempo.',
     NULL),
    ('H24-3', 3, 'diagnostico',  'Una prueba breve sin ayuda',
     'Comprobar qué puede hacer con el contenido sin material a la vista.',
     'El diagnóstico mínimo no se saltea: sin él, la priorización se hace sobre una percepción y no sobre un desempeño.',
     'Recuperación breve sin material.'),
    ('H24-4', 4, 'priorizacion', 'Priorización',
     'Decidir qué se trabaja y qué no se va a intentar aprender.',
     NULL, NULL),
    ('H24-5', 5, 'practica',     'Práctica parecida al examen',
     'Practicar en condiciones parecidas a las del examen real.',
     NULL, NULL),
    ('H24-6', 6, 'correccion',   'Corrección de los errores importantes',
     'Corregir lo que salió mal en la prueba breve, no sólo registrarlo.',
     NULL, NULL),
    ('H24-7', 7, 'descanso',     'Descanso y estrategia',
     'Cuidar descanso y alimentación, y llegar con una estrategia para el examen.',
     'El descanso se mide en efectividad, no en horas: "quizás no pueda dormir 8 hs. Pero si elige dormir solo 4, que sean de descanso efectivo".',
     NULL)
  ) AS s(canonical_id, sequence, step_type, label, objective, explanation, expected_artifact)
 WHERE p.alcance = 'NUCLEO_H24' AND p.version = 'HUMAN-P0-04 v1.0';

COMMENT ON COLUMN protocol_step.provisional_default_id IS
  'EP-SPEC = asunción del equipo. HUMAN-P0-0X = criterio profesional confirmado. La superficie los distingue.';
