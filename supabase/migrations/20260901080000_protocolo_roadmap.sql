-- ─────────────────────────────────────────────────────────────────────────────
-- Achieve Platform · Etapa B5.6 — los veinte pasos, con su texto profesional
--
-- El hueco que [ADR-030] declaró abierto se cerró: el documento con los veinte
-- pasos desarrollados apareció, y está transcripto literal en
-- `docs/roadmap-modo-examen-source.md`.
--
-- ## Qué se cargó, y qué NO
--
-- **Se cargó lo que el documento dice.** El texto de cada paso viaja **verbatim**
-- en `source_text`, y `label`/`explanation` son un corte determinista de ese
-- mismo texto —hasta el primer punto o los primeros dos puntos, lo que llegue
-- antes—. **Ningún título lo escribió un agente**: hay test que reconstruye
-- `source_text` desde las dos columnas y lo busca en el documento fuente.
--
-- **NO se cargó lo que el documento no define**, y es la mitad del trabajo:
--
--   · `expected_artifact` → NULL. El Roadmap dice qué hacer, no qué se entrega.
--   · `criterion`         → NULL. Ninguno de los veinte declara cuándo cierra.
--   · `requirement`       → `NO_CONFIGURADA`. Es `C01-031`, abierto.
--
-- El cuadro de problemas y acciones (`docs/cuadro-problemas-source.md`) sí
-- propone evidencias, y **tampoco se carga**: no está mapeado uno a uno con
-- estos veinte, y conserva preguntas de la propia autora —`(intervención??)`,
-- `(asistencia??)`, `(checklist predeterminado?)`—. Un campo con un signo de
-- pregunta de quien lo escribió no es criterio confirmado.
--
-- ## `EP-SPEC v0.1` no se borra
--
-- Se apaga con `is_current = FALSE` y **queda**. Las preparaciones que ya
-- arrancaron contra esa versión conservan su recorrido: cambiar la versión
-- vigente no reescribe historia (`product.md` §8.1), y para eso el protocolo es
-- configuración versionada.
--
-- ⚠️ **Vigencia sin confirmar.** Todavía no hay confirmación escrita de que este
-- documento sea la versión vigente ni de qué pasos se repiten. Por eso el
-- rótulo de procedencia es `HUMAN-ROADMAP`/`v1.0-sin-confirmar`, que la
-- superficie distingue de un criterio confirmado y de una asunción del equipo.
-- ─────────────────────────────────────────────────────────────────────────────

-- El texto tal como lo escribió la profesional. Existe para que la trazabilidad
-- sea verificable y no una promesa: `label` y `explanation` son un corte de
-- esto, y un test lo comprueba contra el archivo fuente.
ALTER TABLE protocol_step ADD COLUMN source_text TEXT;

COMMENT ON COLUMN protocol_step.source_text IS
  'Texto verbatim de la fuente profesional. label/explanation son un corte determinista de acá.';

-- Primero se apaga la vigente: el índice parcial `exam_protocol_una_vigente`
-- admite una sola por (modalidad, alcance), y es la garantía de que nunca
-- corran dos protocolos a la vez sobre el mismo estudiante.
UPDATE exam_protocol SET is_current = FALSE
 WHERE version = 'EP-SPEC v0.1' AND alcance = 'COMPLETO';

-- Igual que `EP-SPEC`: una versión por modalidad, con el mismo contenido. Los
-- veinte pasos **no** distinguen práctico de teórico —la distinción vive dentro
-- del paso 11 y del 17, que nombran las dos—, y cargarlo para las dos es lo que
-- permite que resolver el protocolo vigente siga siendo una igualdad y no un
-- fallback con precedencia inventada.
INSERT INTO exam_protocol (modality, alcance, version, is_current)
SELECT m, 'COMPLETO', 'HUMAN-ROADMAP v1.0', TRUE
  FROM unnest(ARRAY['practico','teorico_escrito']) AS m;

-- ── Los veinte ──────────────────────────────────────────────────────────────
--
-- `is_reentrant` marca **9 a 18**, y sale de `HUMAN-P0-01 v1.0`, que es la
-- respuesta escrita de la profesional sobre esta misma matriz numerada: *"entre
-- los puntos 9 al 18 el recorrido no es lineal ni rígido… Incluso algunas de
-- estas acciones pueden darse varias veces sobre un mismo tema"*.
--
-- **Y los números cierran.** *"Estudio, recuperación, revisión y práctica"* son,
-- en este documento, `ESTUDIO ACTIVO` (9–15), `REVISION` (16) y `PRACTICA` hasta
-- el simulacro (17–18). El 19 —últimas 24 h— y el 20 —durante el examen— quedan
-- fuera, y por eso el tramo termina en 18 y no en 20. Esa coincidencia es la
-- mejor evidencia de que la numeración de este documento es la de `PE-PSY-01…20`.
--
-- Leer sólo el Roadmap habría dado **14 y 15**, que son los que describen volver
-- sobre algo con todas las letras. Se toma el tramo completo porque la respuesta
-- del cuestionario es más específica —contesta exactamente esta pregunta, por
-- número de paso— y porque `product.md` §8.2 ya la había registrado como firme.
--
-- **El cuerpo va en `objective`, no en `explanation`**, y la diferencia se ve en
-- pantalla: `UX09` titula esos dos bloques *"Objetivo"* y *"Por qué"*. El texto
-- del Roadmap es una instrucción —*"volver a trabajar específicamente aquello
-- que falló y después generar una nueva respuesta sin ayuda"*—, y bajo *"Por
-- qué"* se leería como una justificación que la autora no escribió. `explanation`
-- queda NULL: el documento no da un porqué separado, y no se le inventa uno.
INSERT INTO protocol_step (
  exam_protocol_id, canonical_id, sequence, step_type, is_reentrant,
  label, objective, source_text,
  -- Lo que la fuente no define no se completa.
  explanation, expected_artifact, criterion, requirement,
  provisional_default_id, provisional_version
)
SELECT p.id, s.canonical_id, s.sequence, s.fase, s.reentrante,
       s.label, s.cuerpo, s.source,
       NULL, NULL, NULL, 'NO_CONFIGURADA',
       'HUMAN-ROADMAP', 'v1.0-sin-confirmar'
  FROM exam_protocol p
  CROSS JOIN (VALUES
    ('PE-PSY-01',  1, 'DIAGNOSTICO', FALSE,
     'Relevar las condiciones REALES del examen.',
     'Registrar fecha, horario, modalidad (oral, escrito, práctico, mult choice, a desarrollae, mixto)…, temario, unidades incluidas, bibliografía obligatoria, modalidad de evaluación. Antes de planificar hay que saber exactamente qué demanda la evaluación.',
     'Relevar las condiciones REALES del examen. Registrar fecha, horario, modalidad (oral, escrito, práctico, mult choice, a desarrollae, mixto)…, temario, unidades incluidas, bibliografía obligatoria, modalidad de evaluación. Antes de planificar hay que saber exactamente qué demanda la evaluación.'),
    ('PE-PSY-02',  2, 'DIAGNOSTICO', FALSE,
     'Reunir y ordenar todo el material.',
     'Programa (simplificarlo), bibliografía, apuntes clases, guías, trabajos prácticos, modelos de examen y material proporcionado por la cátedra. Clasificarlo en 3: fuente principal, material complementario y material de consulta.',
     'Reunir y ordenar todo el material. Programa (simplificarlo), bibliografía, apuntes clases, guías, trabajos prácticos, modelos de examen y material proporcionado por la cátedra. Clasificarlo en 3: fuente principal, material complementario y material de consulta.'),
    ('PE-PSY-03',  3, 'DIAGNOSTICO', FALSE,
     'Delimitar que entra y que no.',
     'Transformar el programa general en un temario concreto y real. Si existen dudas respecto del alcance del examen identificarlas antes de empezar. El estudiante debería terminar esta etapa con un mapa claro del contenido mas que nada.',
     'Delimitar que entra y que no. Transformar el programa general en un temario concreto y real. Si existen dudas respecto del alcance del examen identificarlas antes de empezar. El estudiante debería terminar esta etapa con un mapa claro del contenido mas que nada.'),
    ('PE-PSY-04',  4, 'DIAGNOSTICO', FALSE,
     'Realizar un “diagnóstico inicial” de cada tema.',
     'Antes de distribuir el tiempo, identificar el dominio de cada tema: no lo se / tengo alguna idea / lo entiendo bastante / creo que lo sé. (la autopercepción sirve como punto de partida y calma ansiedades)',
     'Realizar un “diagnóstico inicial” de cada tema. Antes de distribuir el tiempo, identificar el dominio de cada tema: no lo se / tengo alguna idea / lo entiendo bastante / creo que lo sé. (la autopercepción sirve como punto de partida y calma ansiedades)'),
    ('PE-PSY-05',  5, 'DIAGNOSTICO', FALSE,
     'Jerarquizar los contenidos.',
     'No todos los temas tienen el mismo peso. Priorizar considerando importancia para el examen, dificultad personal, nivel de dominio y tiempo necesario para aprenderlo. (Seria importante que distinga entre contenidos críticos, importantes y secundarios.)',
     'Jerarquizar los contenidos. No todos los temas tienen el mismo peso. Priorizar considerando importancia para el examen, dificultad personal, nivel de dominio y tiempo necesario para aprenderlo. (Seria importante que distinga entre contenidos críticos, importantes y secundarios.)'),
    ('PE-PSY-06',  6, 'DIAGNOSTICO', FALSE,
     'Calcular el tiempo real disponible.',
     'Sin contar clases, trabajo, compromisos personales, descanso, deporte etc. Siemrpe es preferible un plan no tan ambicioso pero que sea ejecutable, realista (eso evita frustraciones)',
     'Calcular el tiempo real disponible. Sin contar clases, trabajo, compromisos personales, descanso, deporte etc. Siemrpe es preferible un plan no tan ambicioso pero que sea ejecutable, realista (eso evita frustraciones)'),
    ('PE-PSY-07',  7, 'PLANIFICACION', FALSE,
     'Realizar un cronograma.',
     'Planificar desde el día del examen hacia atrás. Guardando unos dias para la práctica o repaso final - luego distribuir los bloques de aprendizaje por dias. El cronograma no debería contener solo los contenidos por días, sino también las fases de esdtudio (leer, recuperar, practicar, ver errores)',
     'Realizar un cronograma. Planificar desde el día del examen hacia atrás. Guardando unos dias para la práctica o repaso final - luego distribuir los bloques de aprendizaje por dias. El cronograma no debería contener solo los contenidos por días, sino también las fases de esdtudio (leer, recuperar, practicar, ver errores)'),
    ('PE-PSY-08',  8, 'PLANIFICACION', FALSE,
     'Preparar las condiciones/ambiente de estudio.',
     'Tener a mano los materiales necesarios, reducir los distractores previsibles (sobretodo plan de acción para el celular) y definir duración aproximada del tiempo de estudio. (El ambiente puede facilitar o interferir significativamente en el aprendizaje!!!)',
     'Preparar las condiciones/ambiente de estudio. Tener a mano los materiales necesarios, reducir los distractores previsibles (sobretodo plan de acción para el celular) y definir duración aproximada del tiempo de estudio. (El ambiente puede facilitar o interferir significativamente en el aprendizaje!!!)'),
    ('PE-PSY-09',  9, 'ESTUDIO_ACTIVO', TRUE ,
     'Primer abordaje comprensivo del contenido.',
     'Leer (a conciencia) buscando entender la estructura general del texto mientras subrayo o resalto las ideas centrales: que concepto se está explicando, cuáles son las ideas ppales, cómo se relacionan. No intentar memorizar información , primero entender.',
     'Primer abordaje comprensivo del contenido. Leer (a conciencia) buscando entender la estructura general del texto mientras subrayo o resalto las ideas centrales: que concepto se está explicando, cuáles son las ideas ppales, cómo se relacionan. No intentar memorizar información , primero entender.'),
    ('PE-PSY-10', 10, 'ESTUDIO_ACTIVO', TRUE ,
     'Procesar activamente la información.',
     'Después de la lectura (ir por temas) realizar actividades que me obliguen a trabajar cognitivamente con el contenido: explicar con palabras propias, comparar conceptos, relacionar, buscar ejemplos, formular preguntas, resolver casos o construir representaciones gráficas cuando sean pertinentes. Subrayar o copiar no debería constituir la actividad principal de estudio.',
     'Procesar activamente la información. Después de la lectura (ir por temas) realizar actividades que me obliguen a trabajar cognitivamente con el contenido: explicar con palabras propias, comparar conceptos, relacionar, buscar ejemplos, formular preguntas, resolver casos o construir representaciones gráficas cuando sean pertinentes. Subrayar o copiar no debería constituir la actividad principal de estudio.'),
    ('PE-PSY-11', 11, 'ESTUDIO_ACTIVO', TRUE ,
     'Elegir la técnica según lo que estoy aprendiendo.',
     'Para contenidos teóricos conceptuales: explicación, preguntas, relaciones, mapas conceptuales. Para procedimientos y cálculo: formulas/resolución de ejercicios. Para exámenes orales: producción oral, explicacion en voz alta, audios. Para memorización de palabras / formulas: desarmar palabra, dibujos, asociación, rimas, ritmos.',
     'Elegir la técnica según lo que estoy aprendiendo. Para contenidos teóricos conceptuales: explicación, preguntas, relaciones, mapas conceptuales. Para procedimientos y cálculo: formulas/resolución de ejercicios. Para exámenes orales: producción oral, explicacion en voz alta, audios. Para memorización de palabras / formulas: desarmar palabra, dibujos, asociación, rimas, ritmos.'),
    ('PE-PSY-12', 12, 'ESTUDIO_ACTIVO', TRUE ,
     'Construir esquemas, cuadros, enumerar conceptos, fichas de estudio con las ideas principales de cada tema.',
     'Practicar recuperación activa, con cuestionarios por ejemplo, o ejercicios. Intentar recordar antes de volver a leer. Esta instancia es fundamental porque permite diferenciar familiaridad con el material de conocimiento (recuperación)',
     'Construir esquemas, cuadros, enumerar conceptos, fichas de estudio con las ideas principales de cada tema. Practicar recuperación activa, con cuestionarios por ejemplo, o ejercicios. Intentar recordar antes de volver a leer. Esta instancia es fundamental porque permite diferenciar familiaridad con el material de conocimiento (recuperación)'),
    ('PE-PSY-13', 13, 'ESTUDIO_ACTIVO', TRUE ,
     'Registrar las brechas de aprendizaje.',
     'Lo que no esta recordando o entendiendo. Ver qué ocurrió: no sabía el contenido, lo comprendía pero no podía recuperarlo, confundí conceptos, olvidé información relevante, cometi error de procedimiento, interpreté mal la consigna o sabía la respuesta pero no logré expresarla adecuadamente. (Esta información debe orientar)',
     'Registrar las brechas de aprendizaje. Lo que no esta recordando o entendiendo. Ver qué ocurrió: no sabía el contenido, lo comprendía pero no podía recuperarlo, confundí conceptos, olvidé información relevante, cometi error de procedimiento, interpreté mal la consigna o sabía la respuesta pero no logré expresarla adecuadamente. (Esta información debe orientar)'),
    ('PE-PSY-14', 14, 'ESTUDIO_ACTIVO', TRUE ,
     'Corregir y volver a demostrar.',
     'Volver a trabajar específicamente aquello que falló y después generar una nueva respuesta sin ayuda. (loq ue no supe responder o respondí mal no es un error, sino una oportunidad para identificar y reforzar)',
     'Corregir y volver a demostrar. Volver a trabajar específicamente aquello que falló y después generar una nueva respuesta sin ayuda. (loq ue no supe responder o respondí mal no es un error, sino una oportunidad para identificar y reforzar)'),
    ('PE-PSY-15', 15, 'ESTUDIO_ACTIVO', TRUE ,
     'Programar repasos distribuidos.',
     'Volver sobre contenidos anteriores evitando que cada tema se estudie una sola vez. El repaso debe comenzar preferentemente intentando recuperar sin material y luego revisar. Cuanto más cercano esté el examen, menor será el intervalo posible entre recuperaciones.',
     'Programar repasos distribuidos. Volver sobre contenidos anteriores evitando que cada tema se estudie una sola vez. El repaso debe comenzar preferentemente intentando recuperar sin material y luego revisar. Cuanto más cercano esté el examen, menor será el intervalo posible entre recuperaciones.'),
    ('PE-PSY-16', 16, 'REVISION', TRUE ,
     'Monitorear el dominio de los temas/unidades diferenciando estos estados:',
     'no visto / leido / recuperado parcialmente / consolidado',
     'Monitorear el dominio de los temas/unidades diferenciando estos estados: no visto / leido / recuperado parcialmente / consolidado'),
    ('PE-PSY-17', 17, 'PRACTICA', TRUE ,
     'Practicar sobretodo la modalidad.',
     'Si es un oral, hablar en voz alta, responder preguntas, simular dar clase. Si es práctico, resolver problemas nuevos. Si es escrito de desarrollo, organizar respuestas completas. Si es múltiple choice, practicar discriminación entre alternativas justificando por qué una opción es correcta y las demás no.',
     'Practicar sobretodo la modalidad. Si es un oral, hablar en voz alta, responder preguntas, simular dar clase. Si es práctico, resolver problemas nuevos. Si es escrito de desarrollo, organizar respuestas completas. Si es múltiple choice, practicar discriminación entre alternativas justificando por qué una opción es correcta y las demás no.'),
    ('PE-PSY-18', 18, 'PRACTICA', TRUE ,
     'Realizar un simulacro de examen, cuando todavía exista tiempo para corregir, instancia sin consultar material.',
     'Analizar el simulacro. Identificar qué conocimientos están sólidos, cuáles presentan vacios, qué errores se repiten, si el tiempo fue suficiente, si existen problemas para interpretar consignas y qué debería modificarse antes de rendir.',
     'Realizar un simulacro de examen, cuando todavía exista tiempo para corregir, instancia sin consultar material. Analizar el simulacro. Identificar qué conocimientos están sólidos, cuáles presentan vacios, qué errores se repiten, si el tiempo fue suficiente, si existen problemas para interpretar consignas y qué debería modificarse antes de rendir.'),
    ('PE-PSY-19', 19, 'PRACTICA', FALSE,
     'En las últimas 24 horas consolidar, no seguir icnorporando.',
     'Se sugiere solo repaso con flashcards o fichas. Cuidar el descanso y la alimentación. Especialmente la noche anterior, evitar que el esfuerzo termine deteriorando la atención, recuperación y desempeño del día siguiente.',
     'En las últimas 24 horas consolidar, no seguir icnorporando. Se sugiere solo repaso con flashcards o fichas. Cuidar el descanso y la alimentación. Especialmente la noche anterior, evitar que el esfuerzo termine deteriorando la atención, recuperación y desempeño del día siguiente.'),
    ('PE-PSY-20', 20, 'PRACTICA', FALSE,
     'Durante el examen:',
     'Leer detenidamente las consignas, identificar que se solicita, administrar el tiempo, organizar las respuestas y reservar cuando sea posible un momento de revisión. En un oral, escuchar la pregunta completa, organizar la respuesta y contestar.',
     'Durante el examen: Leer detenidamente las consignas, identificar que se solicita, administrar el tiempo, organizar las respuestas y reservar cuando sea posible un momento de revisión. En un oral, escuchar la pregunta completa, organizar la respuesta y contestar.')
  ) AS s(canonical_id, sequence, fase, reentrante, label, cuerpo, source)
 WHERE p.version = 'HUMAN-ROADMAP v1.0';

-- ─────────────────────────────────────────────────────────────────────────────
-- `estado_de_preparacion` devuelve además la VERSIÓN del contenido
--
-- Sin ella, `UX08` no puede distinguir el texto de la psicopedagoga con vigencia
-- sin confirmar de un criterio confirmado: los dos llegarían como
-- `provisional_default_id` distinto de `EP-SPEC` y se rotularían igual.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.estado_de_preparacion(
  p_institution_id UUID,
  p_student_id     UUID,
  p_ahora          TIMESTAMPTZ,
  -- NULL ⇒ la preparación `ACTIVE` del estudiante; si no hay, la `RECOMMENDED`.
  p_exam_preparation_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE sql STABLE AS $$
  WITH prep AS (
    SELECT ep.* FROM exam_preparation ep
     WHERE ep.institution_id = p_institution_id
       AND ep.student_id = p_student_id
       AND (p_exam_preparation_id IS NULL OR ep.id = p_exam_preparation_id)
     ORDER BY (ep.status = 'ACTIVE') DESC, ep.created_at DESC
     LIMIT 1
  ),
  accion_viva AS (
    SELECT a.* FROM action a JOIN prep p ON p.id = a.exam_preparation_id
     WHERE a.institution_id = p_institution_id
       AND a.status NOT IN ('COMPLETED','CANCELLED','REPLACED')
     ORDER BY a.created_at DESC LIMIT 1
  ),
  compromiso AS (
    SELECT cm.* FROM commitment cm
      JOIN action a ON a.id = cm.action_id
      JOIN prep p ON p.id = a.exam_preparation_id
     WHERE cm.institution_id = p_institution_id
       AND cm.state NOT IN ('COMPLETED','CLOSED','RENEGOTIATED')
     ORDER BY cm.start_at DESC LIMIT 1
  )
  SELECT jsonb_build_object(
    'instante', p_ahora,
    'zona', COALESCE(s.timezone, 'UTC'),
    'preparacionId', p.id,
    'status', p.status,
    'materia', c.name,
    'evaluacion', ev.title,
    'fechaEn', ev.assessment_date,
    'modalidad', ev.modality,
    'fuenteEvaluacion', ev.source_type,
    'verificacionEvaluacion', ev.verification_status,
    -- La versión del protocolo que rige ESTA preparación, con su rótulo de
    -- procedencia. `EP-SPEC` es asunción del equipo y la superficie lo dice.
    'protocolo', (SELECT jsonb_build_object(
                    'version', pr.version,
                    'alcance', pr.alcance,
                    -- Los dos, no sólo el id: `HUMAN-ROADMAP v1.0-sin-confirmar`
                    -- y un criterio confirmado no se rotulan igual, y la versión
                    -- es lo único que los distingue.
                    'contenido', (SELECT st.provisional_default_id FROM protocol_step st
                                   WHERE st.exam_protocol_id = pr.id LIMIT 1),
                    'contenidoVersion', (SELECT st.provisional_version FROM protocol_step st
                                          WHERE st.exam_protocol_id = pr.id LIMIT 1))
                   FROM exam_protocol pr WHERE pr.id = p.exam_protocol_id),
    -- El recorrido: cada paso con **cuántas vueltas lleva**, no con un estado
    -- binario. Sin `vueltas` la superficie no podría distinguir "lo trabajó una
    -- vez" de "volvió tres veces", que es el hecho que ADR-028 hizo registrable.
    'pasos', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
                 'id', st.id,
                 'canonicalId', st.canonical_id,
                 'label', st.label,
                 'requisito', st.requirement,
                 'reentrante', st.is_reentrant,
                 'vueltas', (SELECT count(*) FROM protocol_step_completion cp
                              WHERE cp.exam_preparation_id = p.id
                                AND cp.protocol_step_id = st.id),
                 'ultimaEn', (SELECT max(cp.completed_at) FROM protocol_step_completion cp
                               WHERE cp.exam_preparation_id = p.id
                                 AND cp.protocol_step_id = st.id),
                 -- `COALESCE` a `FALSE` y no `NULL`: con `current_step_id`
                 -- vacío **ningún** paso es el actual, y eso es un hecho, no un
                 -- dato faltante. Un `null` acá haría que la superficie tuviera
                 -- que adivinar cuál de las dos cosas es.
                 'esActual', COALESCE(st.id = p.current_step_id, FALSE))
                 ORDER BY st.sequence ASC)
          FROM protocol_step st
         WHERE st.exam_protocol_id = p.exam_protocol_id), '[]'::jsonb),
    'accion', (SELECT jsonb_build_object('status', av.status, 'objetivo', av.objective)
                 FROM accion_viva av),
    'compromiso', (SELECT jsonb_build_object('state', cm.state, 'inicioEn', cm.start_at)
                     FROM compromiso cm),
    'rescatePendiente', EXISTS (
        SELECT 1 FROM commitment m
          JOIN action a3 ON a3.id = m.action_id
         WHERE a3.exam_preparation_id = p.id AND m.state = 'MISSED'
           AND NOT EXISTS (SELECT 1 FROM commitment r WHERE r.rescues_commitment_id = m.id)),
    'evidencia', COALESCE((
        SELECT e.lifecycle_state FROM evidence e
          JOIN action a4 ON a4.id = e.action_id
         WHERE a4.exam_preparation_id = p.id AND e.institution_id = p_institution_id
         ORDER BY e.created_at DESC LIMIT 1), 'NONE'),
    'ultimoProgresoEn', (SELECT max(pe.occurred_at) FROM progress_entry pe
                           JOIN action a5 ON a5.id = pe.action_id
                          WHERE a5.exam_preparation_id = p.id),
    -- Readiness: lo que haya. Hoy siempre `null`, y **eso es la decisión**, no
    -- un dato faltante. Ver ADR-011 y `C01-029`.
    'readiness', (SELECT jsonb_build_object(
                    'state', r.state,
                    'explicacion', r.explanation,
                    'reglaVersion', r.rule_version,
                    'calculadoEn', r.calculated_at)
                   FROM preparation_readiness r WHERE r.id = p.readiness_id)
  )
  FROM prep p
  JOIN assessment ev ON ev.id = p.assessment_id
  JOIN course_offering o ON o.id = ev.offering_id
  JOIN course c ON c.id = o.course_id
  JOIN student s ON s.id = p_student_id;
$$;

GRANT EXECUTE ON FUNCTION public.estado_de_preparacion TO service_role;
