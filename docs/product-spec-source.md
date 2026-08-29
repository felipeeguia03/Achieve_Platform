ACHIEVE — SPEC CENTRALIZADO DEL PRODUCTO

Documento: ACHIEVE_MASTER_PRODUCT_SPEC_v1.0.md  
Consolidado: 28 de agosto de 2026  
Fuentes: versiones APPROVED/FINAL más recientes de P01 v1.0 y C01 v1.0 — se excluyen candidatos, auditorías, matrices de conflicto, roadmaps de contrato y toda la capa de gobernanza/promoción documental, que no aporta a la generación de producto.

Nota de uso: este documento es la fuente de verdad única. Para generar una pantalla puntual en Base44 / Lovable / v0 / Replit, copiá la sección correspondiente de la Parte VI (spec funcional de esa pantalla) más la Parte II (modelo de dominio) y la Parte IV (contratos/estados) — no hace falta pegar el documento completo.

***
Tabla de contenidos

PARTE I — VISIÓN, PRINCIPIOS Y ARQUITECTURA FUNCIONAL
PARTE II — USER FLOWS, WIREFRAMES Y MODELO DE DOMINIO
PARTE III — GOLDEN PATH UNIFICADO (recorrido canónico end-to-end)
PARTE IV — CONTRATOS MÍNIMOS DEL PROTOTIPO (reglas de negocio, estados, fixtures)
PARTE V — CONVERGENCIA LOCAL POR TRAMO (detalle de secuencia paso a paso)
V.1 — Loop diario (UX01–UX04)
V.2 — Cierre del loop (UX04–UX06)
V.3 — Modo Examen (UX07–UX09)
PARTE VI — SPECS FUNCIONALES POR PANTALLA (wireframe, jerarquía 360px, copy, estados)
VI.1 — Hoy / Autogestión
VI.2 — Materia / Cursado
VI.3 — Próxima Acción
VI.4 — Compromiso
VI.5 — Evidencia
VI.6 — Progreso / Bitácora
VI.7 — Activación de Modo Examen
VI.8 — Modo Examen / Overview
VI.9 — Paso de Protocolo de Examen
PARTE VII — BACKLOG DEL PROTOTIPO
PARTE VIII — ESCENARIOS DE PRUEBA / CRITERIOS DE ACEPTACIÓN
PARTE IX — CONFIGURACIÓN PSICOPEDAGÓGICA PROVISIONAL

***

PARTE I — VISIÓN, PRINCIPIOS Y ARQUITECTURA FUNCIONAL

ACHIEVE

MVP USUARIO — PRODUCT SPEC

Versión 0.5 · Benchmark estratégico + closed-loop intervention

Achieve entiende dónde estás, detecta cuándo te estás desviando, te ayuda a decidir y ejecutar la próxima acción correcta, y pone una persona real cuando esa persona puede hacer la diferencia.

Fuente de verdad funcional para el primer MVP vendible a universidades y valioso para estudiantes.

Agosto 2026

0. Resumen ejecutivo y delta v0.5

Esta versión conserva la arquitectura validada en v0.4 y agrega únicamente aprendizajes de alto impacto del benchmark estratégico Filadd + InsideTrack + Student Success. No se interpreta benchmarking como validación del producto: se utiliza para precisar límites arquitectónicos, operación humana, ciclo de riesgo-intervención, gobernanza e instrumentación del piloto. Se mantiene Academic Data Layer como core y la adquisición multifuente como decisión propia de Achieve.

CORE	Buyer y user son distintos: la universidad compra, pero el estudiante debe percibir valor directo y recurrente para usar el producto.
	DECIDIDO	Academic Data Layer pasa a ser core. El MVP puede poblarla con procesos semi-manuales y semi-automáticos; el scraping universal NO es requisito del primer release.
	DECIDIDO	Academic Risk / detección de desvío pasa a core del MVP.
	DECIDIDO	Achieve conduce con intención de generar autonomía creciente, no dependencia creciente.
	DECIDIDO	La intensidad humana debe ser proporcional al momento y perfil del estudiante.
	GUARDARRAIL	Los parciales viejos son señales históricas relevantes, no la fuente suprema de verdad académica.
	DECIDIDO	El Risk Engine debe capturar también señales de cursado y la brecha entre confianza percibida y dominio demostrado.
	DECIDIDO	El acompañamiento humano no busca hablar más: busca intervenir mejor, especialmente donde existe juicio, resistencia, riesgo o evidencia ambigua.
	GUARDARRAIL	No duplicar herramientas maduras —por ejemplo calendarios completos— cuando Achieve puede integrarse o representar únicamente la información necesaria.
	0.1. Definición actual del producto

Achieve es un sistema académico integral que conoce la realidad universitaria del estudiante, transforma esa realidad en próximas acciones, detecta desvíos antes del resultado final, exige evidencia de avance y utiliza acompañamiento humano contextual para aumentar la ejecución y ayudar al alumno a desarrollar mejores capacidades de autorregulación.

0.2. Qué cambia respecto del spec anterior

La v0.5 agrega siete decisiones sin reabrir el núcleo anterior:

Achieve se define arquitectónicamente como Academic Execution Layer complementaria a LMS/SIS/Calendar, sin abandonar la visión de sistema académico integral para el estudiante.

Todo RiskSignal importante debe cerrar un circuito: causa → owner → playbook → SLA → intervención → outcome.

Las intervenciones humanas pasan a diseñarse como playbooks versionados y medibles, no como criterio informal del operador.

El acompañamiento humano incorpora QA: tono, oportunidad, claridad, adherencia al playbook y resultado.

Evidence System incorpora un lifecycle formal separado del nivel de aprendizaje demostrado.

Privacidad, permisos, trazabilidad, auditoría, minimización, aislamiento institucional y explicabilidad pasan a requisitos arquitectónicos.

El MVP debe instrumentar eventos de producto y operación desde el primer día para poder medir mecanismo, recuperación, costo y resultado.

Tema	Cambio v0.5
Scraping / datos académicos	De “feature avanzada” a “Academic Data Layer como core”; la automatización completa queda para después.
Conducción	De “Achieve decide” a “Achieve conduce, explica y busca autonomía creciente”.
Riesgo	Pasa de consecuencia implícita del progreso a entidad funcional explícita: desvío → riesgo → intervención.
Humano	De presencia relativamente uniforme a intervención adaptativa según riesgo, perfil y momento.
B2B	Visibilidad temprana y capacidad de intervención pasan al centro del valor institucional.
Piloto	Primer año + materias críticas + período acotado se eleva como beachhead B2B de alta prioridad.
Métricas	Más foco en anticipación, recuperación, cumplimiento, regularidad y resultado; menos en consumo de contenido.
Riesgo	Se agregan asistencia, participación, resolución de dudas, primeras notas y brecha confianza–evidencia como señales potenciales.
Formación primer año	Se mantiene mayor estructura, pero como microintervenciones obligatorias y contextuales, no como curso lineal pesado.
CRM	Se formaliza un Intervention Engine: el software prioriza quién necesita humano y por qué.
Herramientas externas	Se agrega el guardarraíl de no recrear calendarios/LMS maduros si basta con integración o representación mínima.
	0.3. Auditoría Leandro: trazabilidad de hipótesis importantes

La entrevista con Leandro se utiliza como evidencia experta contextual, no como validación de mercado. La siguiente matriz registra solo hipótesis de alto impacto y evita convertir opiniones aisladas en requisitos automáticos.

0.4. Benchmark estratégico: qué valida y qué no

Decisión actual	Lectura benchmark	Implicación v0.5
Pivot B2B universitario	VALIDA categoría	Mantener; el piloto debe probar impacto propio.
Modo Examen como wedge	VALIDA	Mantener como golden path de alta urgencia.
Humano + tecnología	VALIDA categoría	Formalizar metodología, playbooks y QA.
Risk Engine	AGREGA MATIZ	La alerta debe tener dueño, acción y resultado; no solo score.
Academic Data Layer	AGREGA MATIZ	Institución es fuente fuerte para hechos, pero Achieve mantiene ingestión multifuente.
Scraping como vía de adquisición	NO CIERRA LA DECISIÓN	No se vuelve fallback obligatorio ni requisito universal; se usa cuando genera valor y con trazabilidad.
Reemplazar LMS/SIS/Calendar	CONTRADICE	Achieve se diseña como capa de ejecución complementaria.
Evidence System	AGREGA MATIZ	Diferencial plausible; debe validar efecto en ejecución/intervención.
Dashboard institucional como fin	CONTRADICE	Dashboard sin intervención produce observación, no cambio de conducta.
	Hipótesis / decisión	Resultado	Implicación para v0.5
Mapa Académico	VALIDA	Describe al buen alumno como alguien que ordena materia, temas y secuencia; observa fallos por mala organización y dimensionamiento.
Academic Decision / Próxima Acción	VALIDA	Remarca que la función estable es ordenar información y orientar la próxima acción; la interfaz concreta puede cambiar.
Evidence System	VALIDA	Diferencia confianza subjetiva de práctica real y enfatiza conducta observable.
Compromiso / ejecución	VALIDA	Distingue a quienes no saben organizarse de quienes saben qué hacer pero no logran ejecutarlo.
Human Accountability	AGREGA MATIZ	Valida contención/control humano, pero concentra al humano en juicio, bloqueo, evidencia dudosa y rescate.
Autonomía creciente	VALIDA	El acompañamiento debe ayudar a hacerse cargo, no reemplazar la responsabilidad del estudiante.
Formación adaptativa	VALIDA	Contenido bajo demanda cuando aparece un bloqueo; no una biblioteca obligatoria como centro.
Formación obligatoria primer año	AGREGA MATIZ	Mayor estructura puede tener sentido, pero hay riesgo de exigir demasiado; debe ser breve, contextual y aplicada.
Academic Risk	VALIDA / AMPLÍA	Aporta asistencia, participación, involucramiento, dudas y primeras notas como señales tempranas.
Personalización por comportamiento	VALIDA	Recomienda aprender de horarios, cumplimiento y conducta real más que de cuestionarios largos.
Calendario propio completo	CONTRADICE	Cuestiona duplicar herramientas que ya funcionan; Achieve debe integrarse o representar lo mínimo necesario.
Academic Data Layer / scraping	NO APORTA	No valida ni contradice la apuesta nueva. Sigue siendo decisión estratégica posterior de Achieve.
Pivot B2B directo	NO REABRIR	Leandro sugería individuo→institución en ese momento; el pivot B2B es una decisión posterior y no se reabre por esta entrevista.
	1. Visión, promesa y contrato de doble valor

1.1. Visión

Achieve es el sistema que te acompaña durante la facultad: sabe qué tenés que hacer, te enseña cómo hacerlo, controla que avances y te ayuda cuando te atrasás.

1.2. Regla funcional

En cualquier momento del semestre, un alumno debería poder entrar a Achieve y entender en menos de 10 segundos dónde está, qué tiene que hacer ahora, qué tiene que entregar para demostrar que avanzó y qué va a pasar después.

1.3. Contrato de doble valor

Achieve es B2B2C: la institución es cliente, pero la adopción depende de que el alumno reciba valor real. El producto no puede optimizar únicamente para dashboards institucionales ni únicamente para conveniencia del estudiante.

Actor	Valor principal
Estudiante	Reducir incertidumbre, tener un plan, encontrar recursos, saber qué hacer, sentirse acompañado, ver progreso y llegar mejor preparado.
Universidad	Detectar desvíos antes de una mala nota/abandono, intervenir con criterio, mejorar adherencia/regularidad y disponer de datos de proceso.
Achieve	Conectar información académica + decisión + comportamiento + evidencia + intervención humana en un mismo sistema.
	2. Problema y outcome central

El problema no es solamente que al alumno le falte información. La hipótesis consolidada es que los resultados académicos se deterioran por una combinación de incertidumbre, falta de anticipación, malos hábitos, pobre autorregulación, decisiones tardías y falta de seguimiento contextual.

Achieve ayuda a la universidad a intervenir sobre el proceso académico antes de que el único dato disponible sea una mala nota, una recursada o un abandono.

2.1. Outcome del estudiante

Entiende su situación académica sin reconstruirla mentalmente cada día.

Recibe una próxima acción razonable y ejecutable.

Se compromete a realizarla y existe accountability.

Produce evidencia y puede observar que el plan cambia.

Aprende progresivamente a tomar mejores decisiones por sí mismo.

2.2. Outcome institucional

Ver señales tempranas de desvío.

Saber quién necesita intervención humana ahora.

Entender patrones agregados de dificultad y comportamiento.

Medir recuperación antes del resultado final.

Ejecutar programas de acompañamiento sin que el costo humano crezca linealmente.

3. Principios de producto

3.1. Achieve conduce con autonomía creciente

El sistema reduce carga de decisión al inicio, explica por qué recomienda una acción y, con el tiempo, disminuye scaffolding cuando el estudiante demuestra capacidad para planificar y ejecutar correctamente.

3.2. Próxima acción antes que dashboard decorativo

Toda representación debe ayudar a entender, decidir o ejecutar; no se construyen métricas visuales sin consecuencia.

3.3. El avance no pasa desapercibido

Una evidencia validada debe modificar estado, progreso, riesgo, plan o reconocimiento.

3.4. Hacer no equivale a aprender

Se distinguen ejecución, producción y dominio.

3.5. La realidad académica es versionada y probabilística

Cada dato puede tener fuente, vigencia y confianza. Achieve no presenta inferencias como hechos.

3.6. Datos académicos como infraestructura

La capa de datos no es un extra: es una condición para que Achieve conozca la facultad y aporte valor directo.

3.7. Humano donde cambia conducta o información

El acompañante no debe gastar tiempo en administración que el sistema puede resolver.

3.8. No Cortar sin maquillar incumplimiento

Rescatar el día no borra el compromiso original.

3.9. Formación aplicada

Contenido → aplicación real → evidencia → feedback.

3.10. La institución no debe recibir “un alumno más dependiente”

La conducción es scaffolding: ayuda fuerte cuando hace falta y desarrolla autorregulación.

3.11. Historial de exámenes es una señal, no una verdad absoluta

Se combina con fuentes oficiales, contexto actual y datos personales.

3.12. Golden path antes que amplitud

Pocas carreras/materias pueden estar extraordinariamente bien resueltas antes de buscar cobertura universal.

3.13. Percepción no equivale a dominio

La confianza declarada es una señal del Student Model; cuando contradice la evidencia, Achieve debe detectar falsa sensación de dominio.

3.14. No recrear herramientas maduras

Achieve debe integrarse o apoyarse sobre herramientas consolidadas cuando sea suficiente. La representación de planificación puede existir sin construir un calendario universitario completo.

3.15. Intervención antes que dashboard

Una señal de riesgo importante no está resuelta porque aparezca en rojo. Debe tener causa explicable, responsable, playbook, plazo y resultado registrado.

3.16. Contexto académico obligatorio para el acompañamiento

Achieve no debe degradarse en coaching genérico por WhatsApp. Toda intervención relevante debe conectarse con una acción, un compromiso, una evidencia, un riesgo, un bloqueo o un outcome académico.

3.17. Fuente apropiada según tipo de dato; trazabilidad siempre

No existe una jerarquía rígida universal de fuentes. Los hechos oficiales priorizan fuentes institucionales; el contexto vivo puede provenir del alumno o la cátedra; la inteligencia histórica puede provenir de datos agregados. Todo dato conserva origen, fecha, confianza y vigencia.

Achieve no construye un calendario/LMS completo por costumbre. Integra o representa solo lo necesario para conducir, evidenciar y detectar desvíos.

4. Arquitectura funcional v0.5

4.0. Límite arquitectónico: Academic Execution Layer

Desde la experiencia del estudiante, Achieve aspira a ser un sistema académico integral. Arquitectónicamente, el MVP funciona como una capa de ejecución académica complementaria a LMS, SIS, campus, sistemas de calificaciones y calendarios existentes. Su trabajo específico es cerrar el circuito entre contexto, acción, evidencia, adaptación y rescate.

**[GUARDARRAIL] **No reemplazar infraestructura universitaria madura durante el MVP salvo que una función sea indispensable para el loop de ejecución y no exista una integración razonable.

Componente	Pregunta	Responsabilidad
Academic Data Layer	¿Qué sabemos de esta realidad universitaria?	Estructura, versiona y relaciona hechos, inteligencia y conocimiento comunitario.
Mapa Académico Vivo	¿Qué está pasando con este estudiante?	Instancia personal de carrera, materias, evaluaciones, clases, temas y estado.
Academic Decision Engine	¿Qué conviene hacer ahora?	Prioriza acciones usando tiempo, dificultad, dependencias, riesgo y objetivos.
Academic Risk Engine	¿Dónde se está desviando?	Detecta señales de desvío y determina necesidad de intervención.
Student / Personal Model	¿Cómo aprende y ejecuta esta persona?	Patrones de cumplimiento, velocidad, motivación, horarios, autonomía y dificultades.
Evidence System	¿Qué ocurrió realmente?	Registra ejecución, producción, dominio y niveles de validación.
Human Accountability	¿Cómo conseguimos que ocurra?	Compromiso, exigencia, negociación, rescate, reconocimiento y vínculo.
CRM / Orchestration	¿Quién necesita humano y con qué contexto?	Prioriza cartera, resume contexto y maximiza humanidad por minuto.
	4.1. Loops centrales

Datos → Mapa → Desvío/Riesgo → Próxima Acción → Compromiso → Ejecución → Evidencia → Validación → Replanificación

Plan → horario comprometido → seguimiento contextual → cumplimiento o rescate → reconocimiento

Nueva información académica o nueva evidencia → actualización de Data Layer / Student Model → nueva decisión

5. Academic Data Layer — core del producto

CORE	La capacidad de “conocer la facultad” es parte de la propuesta de valor del alumno y un activo estratégico de Achieve.
	La Academic Data Layer no debe entenderse como “un scraper”. Es la infraestructura que representa información académica estructurada y permite que múltiples fuentes coexistan, compitan y mejoren entre sí.

5.1. Grafo conceptual

Universidad → Facultad → Carrera → Plan → Año → Semestre → Materia → Cátedra/Comisión → Profesor → Evaluación → Tema → Recurso → Evidencia histórica

5.2. Tres clases de conocimiento

Categoría	Qué es	Ejemplos
Academic Facts	Datos relativamente objetivos	Plan, materia, correlativas, programa, horario, fecha oficial, docente.
Academic Intelligence	Señales derivadas por Achieve	Frecuencia histórica, dificultad, tiempo real, prerequisitos observados, patrones de error.
Community Knowledge	Información que hoy circula informalmente	“Este profesor toma mucho X”, resúmenes, recomendaciones, cambios comunicados en clase, parciales heredados.
	5.3. Fuentes posibles

Universidad / facultad / secretaría.

Cátedra / docente.

Fuentes públicas y sitios oficiales.

Base propia curada por Achieve.

Scraping específico de fuentes relevantes.

Bases/comunidades estudiantiles permitidas.

Alumno individual.

Múltiples alumnos de una misma comisión.

Documentos y archivos subidos.

Inferencias del sistema.

5.4. Cada dato debe conservar metadatos

Fuente/origen.

Fecha de captura.

Período académico al que aplica.

Carrera/plan/cátedra/comisión/profesor asociados cuando corresponda.

Nivel de confianza.

Tipo: hecho / inteligencia / comunidad / inferencia.

Estado: vigente / desactualizado / disputado / pendiente de validar.

Derechos o condición de uso del recurso cuando corresponda.

5.5. Confianza, no jerarquía rígida

La institución es una fuente muy fuerte para hechos oficiales, pero no necesariamente posee todo el conocimiento útil del día a día. El sistema debe ponderar la autoridad según el tipo de dato y la actualidad.

Dato	Fuente ejemplo	Interpretación
Fecha oficial de examen	Calendario/cátedra oficial	Muy alta
Unidad 7 no entra	Reporte del alumno sobre declaración del profesor	Media/alta; sube si hay corroboración
Tema históricamente frecuente	Análisis de evaluaciones anteriores	Alta como señal histórica, no como hecho futuro
Tema difícil	Datos agregados de estudiantes	Señal estadística contextual
Plan de estudios	Documento oficial vigente	Muy alta
	5.6. Riesgo de obsolescencia

GUARDARRAIL	Nunca reutilizar una afirmación sensible sin contexto temporal/docente. “No entra Unidad 6” debe estar ligada a período, profesor y fuente.
	6. Estrategia de adquisición de datos

6.1. Decisión de MVP

No construir un scraper universal. Construir una Data Layer correcta y lograr que pocas carreras “parezcan mágicas” usando la combinación más eficiente de scraping específico, IA, importaciones institucionales, curación manual y contribuciones estudiantiles.

DECIDIDO	Adquisición semi-manual / semi-automática para un conjunto reducido de carreras.
	6.2. Flujo de ingestión

 Descubrir o recibir una fuente.

 Extraer contenido.

 Normalizar a entidades del modelo académico.

 Deduplicar y relacionar con carrera/plan/cátedra/período.

 Asignar fuente, vigencia y confianza.

 Curar o solicitar confirmación cuando exista ambigüedad.

 Publicar al Mapa Académico correspondiente.

 Detectar cambios futuros y versionar.

6.3. Evolución posterior

HIPOTESIS	Generalized Academic Ingestion Engine: búsqueda, scraping, lectura de documentos, normalización, deduplicación, versionado, confianza y detección de cambios.
	6.4. Por qué esta decisión importa

Reduce fricción: el alumno corrige en vez de cargar todo desde cero.

Genera el Aha Moment “Achieve conoce mi facultad”.

Alimenta mejores decisiones del Engine.

Puede convertirse en un moat acumulativo.

La información institucional mejora la base existente; no la reemplaza.

Permite unificar conocimiento que hoy vive fragmentado entre grupos, drives y plataformas.

7. Mapa Académico Vivo

DECIDIDO	El Mapa Académico combina la Data Layer compartida con la realidad específica del estudiante.
	7.1. Identidad mínima

Universidad/facultad.

Carrera.

Plan.

Año.

Semestre.

7.2. Instancia personal

Materias activas.

Cátedra/comisión/profesor.

Evaluaciones y entregas.

Temas/unidades.

Cronograma de clases.

Recursos.

Estado de preparación.

Pendientes de información.

Progreso y desvío.

7.3. Mapa Académico Mínimo

Suficiente información para producir al menos una próxima acción académica real. No es necesario completar toda la carrera para empezar a recibir valor.

7.4. Incertidumbre como próxima acción

Si falta información importante, Achieve puede generar acciones como: confirmar qué entra, subir el programa, preguntar al profesor, encontrar un parcial anterior o verificar una fecha. Resolver incertidumbre también es avance operativo.

8. Academic Risk y Desvío Académico

CORE	El MVP debe detectar desvío antes del resultado final.
	8.1. Definición

Desvío académico = diferencia relevante entre dónde razonablemente debería estar el estudiante y dónde está realmente, según el plan y la evidencia disponible.

8.2. Tipos

Tipo	Ejemplo
Desvío de cursado	La clase va por Unidad 5 y el alumno por Unidad 3.
Desvío de preparación	Faltan 7 días y aún no existe práctica autónoma.
Desvío conductual	Planeó 4 bloques y cumplió 1.
Desvío de información	No sabe todavía qué entra o no tiene fuente de verdad.
Desvío de capacidad	La carga pendiente requiere más horas que las disponibles.
Desvío de dominio	Consumió contenido, pero la evidencia no demuestra desempeño suficiente.
	8.3. Estados de riesgo provisionales

Estado	Interpretación
BAJO	Bajo control; no requiere intervención.
ATENCIÓN	Existe una señal de desvío.
RIESGO	Múltiples señales o responsabilidad próxima.
INTERVENCIÓN	El sistema recomienda acción humana prioritaria.
	8.4. Señales iniciales del MVP

Días desde último avance.

Compromisos incumplidos.

Examen/entrega cercana.

Carga pendiente vs. disponibilidad.

Dificultad alta reportada.

Evidencia insuficiente.

Separación entre ritmo de clase y alumno.

Información crítica faltante.

Asistencia cuando exista dato confiable.

Participación/involucramiento cuando pueda observarse sin vigilancia invasiva.

Dudas formuladas o resueltas como señal contextual.

Primera/segunda nota como punto de quiebre, sin esperar al abandono.

Brecha entre confianza percibida y dominio demostrado.

DECIDIDO	El primer Risk Engine puede ser rule-based; machine learning no es requisito.
	8.5. Perception–Evidence Gap

DECIDIDO	El sistema debe distinguir lo que el alumno cree dominar de lo que ha demostrado poder hacer.
	Ejemplo: confianza declarada 8/10 en Dinámica, pero solo 2/7 ejercicios autónomos correctos. Esa brecha no invalida al alumno: es una señal para replanificar, reforzar práctica y reducir falsa sensación de dominio.

Confianza percibida ≠ dominio demostrado. Cuando divergen, la evidencia pesa más para decidir la próxima acción.

8.6. Closed-loop Risk: de señal a outcome

Todo RiskSignal relevante debe ser accionable y trazable. El objeto no termina en un score: inicia o justifica una intervención.

Qué ocurrió y cuándo.

Severidad y vigencia.

Fuente / evidencia que origina la señal.

Responsable de resolver o revisar.

Playbook sugerido.

SLA o ventana esperada de intervención.

Intervención ejecutada.

Outcome: recuperado, replanificado, sin respuesta, escalado, falso positivo u otro estado definido.

**[DECIDIDO] **El dashboard no es el final del Risk Engine. El final es una señal resuelta, escalada o explícitamente cerrada con resultado.

9. Academic Decision Engine

DECIDIDO	Achieve recomienda y conduce; no se limita a mostrar información.
	El Engine responde qué acción tiene más valor ahora considerando la realidad académica y personal. Debe ser explicable y no optimizar únicamente “pasar el próximo parcial con lo mínimo”.

9.1. Familias de señales

Familia	Ejemplos
Oficiales	Programa, cronograma, objetivos, materiales, fechas, docente.
Contextuales	Qué se trabajó, qué dijo el profesor, ritmo real, cambios recientes.
Históricas	Parciales/finales previos, ejercicios frecuentes, desempeño agregado.
Personales	Dominio, dificultad, disponibilidad, velocidad real, cumplimiento.
Riesgo	Desvíos y urgencia detectados por Academic Risk.
	9.2. Salida mínima

Materia + tema/objetivo + acción concreta + tiempo estimado + recurso/fuente + evidencia esperada + razón de la recomendación cuando sea útil.

9.3. Objetivo de optimización

Default provisional: maximizar avance sostenible del semestre y preparación suficiente de evaluaciones, sujeto a disponibilidad real y sin abandonar la construcción de autonomía.

10. Autonomía creciente / Scaffolding

GUARDARRAIL	Achieve debe buscar que el estudiante internalice mejores decisiones, no que dependa cada vez más del sistema.
	10.1. Progresión conceptual

Nivel	Ejemplo
Conducción alta	“Te conviene hacer Física hoy por X, Y y Z.”
Conducción compartida	“¿Qué priorizarías? Nosotros vemos Física por X razones.”
Autonomía supervisada	El alumno propone plan; Achieve detecta inconsistencias y corrige.
Autonomía alta	Achieve interviene principalmente ante desvíos o riesgos.
	10.2. Intensidad no uniforme

El Student Model puede determinar cuánto acompañamiento y conducción necesita cada persona. Primer año, recursantes o estudiantes en riesgo pueden recibir mayor estructura; alumnos autónomos, menor intervención. La dirección deseada es scaffolding decreciente: si el alumno demuestra mejor criterio, Achieve debe invitarlo progresivamente a proponer prioridades y planes antes de corregirlos.

10.3. Criterio de calidad de autonomía

La calidad de Achieve no se mide solo por cuánto decide correctamente por el alumno, sino por cuánto consigue que el alumno internalice mejores decisiones académicas con el tiempo.

11. Evidence System

DECIDIDO	Achieve distingue ejecución, producción y dominio.
	Nivel	Pregunta	Ejemplos	Evidencia
Ejecución	¿Hizo lo acordado?	Lectura, práctica, clase, sesión.	Foto/registro/archivo.
Producción	¿Generó algo inspeccionable?	Ejercicios, resumen, audio, código.	Documento/foto/audio.
Dominio	¿Puede aplicar o recuperar sin apoyo completo?	Ejercicio nuevo, explicación, simulacro.	Resultado de prueba.
	11.1. Niveles de validación

Declarativa → automática básica → evidencia inspeccionable → validación humana → prueba de dominio

No todo entregable requiere aprobación humana. El humano interviene donde aumenta información, calidad o conducta; no debe transformarse en corrector manual de todo.

DECIDIDO	Detector de IA no es prioridad del MVP.
	11.2. Lifecycle formal de Evidence

El estado operativo de una evidencia y el nivel de aprendizaje que demuestra son dimensiones diferentes.

Expected → Submitted → Under Review (cuando aplica) → Sufficient / Insufficient → Validated

Expected: la acción define qué evidencia se espera.

Submitted: el alumno aportó algo.

Under Review: existe revisión humana o automática pendiente.

Sufficient / Insufficient: cumple o no el criterio mínimo de esa acción.

Validated: el cierre fue confirmado según el método de validación aplicable.

En paralelo, la evidencia puede aportar señal sobre ejecución, producción y/o dominio. Una evidencia validada no implica automáticamente dominio.

12. Protocolos de Preparación

El Academic Decision Engine decide qué priorizar; los Protocolos determinan cómo trabajar ese tipo de aprendizaje y qué evidencia esperamos. Deben diseñarse con criterio psicopedagógico.

Práctico / resolución.

Teórico-conceptual.

Memoria + comprensión.

Oral.

Proyecto / producción.

Mixto.

12.1. Ejemplo práctico

 Comprender tipos de problema y prerequisitos.

 Práctica guiada.

 Hoja de fórmulas / pasos / errores.

 Práctica autónoma.

 Parciales/finales previos como transferencia.

 Simulación.

 Ajuste de brechas.

13. Formación

DECIDIDO	Formación es aplicada y adaptativa; no una videoteca pasiva.
	Autónomo: biblioteca + recomendaciones contextuales.

En formación: primer año, recursantes o quien necesite reconstruir método.

Examen: ciertos contenidos/acciones se vuelven parte obligatoria del protocolo.

DECIDIDO	Para primer año, lo obligatorio debe tender a ser microintervención contextual y aplicada, no curso lineal previo a usar el producto.
	Ejemplos: antes de la primera materia práctica, una intervención breve sobre cómo usar una guía y luego aplicación inmediata; antes del primer oral, una intervención sobre preparación oral y una evidencia real. La obligatoriedad existe donde reduce un error probable, no como requisito burocrático de onboarding.

Contenido → aplicación real en una materia → evidencia → feedback

14. Modo Examen

CORE	Modo Examen sigue siendo un core de alto valor por urgencia y claridad del outcome.
	Entender el examen

Fecha, alcance, modalidad, docente, fuentes, históricos.

Construir estrategia

Temas, dependencias, dificultad, dominio, disponibilidad, orden.

Preparar

Acciones según protocolo + evidencias.

Demostrar

Parciales viejos, ejercicios nuevos, oral o simulacro.

Ajustar

Replanificar puntos débiles.

Rendida

Logística y preparación final.

Post examen

Resultado, diferencias con lo esperado y aprendizaje para la Data Layer.

15. Human Accountability

HIPOTESIS	Hipótesis refinada: determinados momentos y determinados perfiles mejoran su ejecución cuando existe accountability humano contextual.
	El sistema intenta resolver qué conviene hacer. El humano intenta conseguir que efectivamente ocurra cuando su intervención puede hacer la diferencia.

Exigir inicio a la hora comprometida.

Negociar duro pero humanamente.

Detectar resistencia o excusas.

Aplicar No Cortar.

Reconocer avance genuinamente.

Validar evidencias relevantes.

Supervisar al Engine cuando existe contexto no capturado.

Construir vínculo y memoria humana.

15.1. Principio operativo: hablar mejor, no hablar más

El software absorbe rutina y administración; el humano entra donde aporta juicio, presión social, comprensión, rescate o reconocimiento genuino.

El objetivo no es que cada estudiante reciba la misma cantidad de mensajes. El objetivo es que cada intervención humana tenga una razón observable y una probabilidad razonable de cambiar conducta o información.

15.2. Intensidad adaptativa

Intensidad	Cuándo	Comportamiento
Alta	Primer año / alto riesgo / incumplimiento recurrente	Contacto frecuente y control cercano.
Media	Necesita apoyo puntual	Seguimiento de compromisos y desvíos.
Baja	Alumno autónomo y bajo control	Intervenir ante riesgo o hitos importantes.
	15.3. Intervention Engine / CRM

DECIDIDO	El CRM debe priorizar quién necesita humano, por qué y qué contexto importa; no simplemente listar alumnos.
	Señal de riesgo y causa.

Momento crítico: compromiso vencido, examen cercano, evidencia débil, falsa confianza, caída de ritmo.

Intervención sugerida, no mensaje automático obligatorio.

Historial de qué tipo de intervención funcionó con ese estudiante.

Medición de minutos humanos y resultado posterior de la intervención.

15.4. Intervention Playbooks

Las intervenciones humanas deben poder entrenarse, repetirse, auditarse y mejorarse. Cada playbook mínimo define disparador, objetivo, primera respuesta, condición de escalamiento, exit condition y métricas.

15.5. Human QA

Si el humano es parte del producto, la calidad del acompañamiento debe ser observable. El MVP debe permitir revisar muestras de intervenciones y calibrar operadores.

Tono y respeto.

Oportunidad / timing.

Claridad de la próxima acción.

Adherencia al playbook cuando aplica.

Capacidad de mantener autonomía y no resolver por el alumno.

Resultado posterior: inicio, evidencia, replanificación, recuperación o escalamiento.

Minutos humanos invertidos.

**[HIPOTESIS] **Con suficiente volumen, Achieve podrá comparar qué intervenciones funcionan mejor por perfil, riesgo y momento; el MVP debe registrar los datos para aprenderlo, no automatizarlo todavía.

Disparador	Objetivo	Respuesta inicial	Escalamiento / salida
No inició compromiso	Reducir fricción	Identificar bloqueo y proponer paso mínimo de 10–15 min	Escalar si persiste; cerrar con nuevo compromiso/evidencia
Evidencia insuficiente	Aclarar criterio	Devolver requisito mínimo y ejemplo	Escalar duda académica si corresponde
Dos checkpoints sin respuesta	Restablecer contacto	Mensaje breve + alternativa de replanificación	Escalar según consentimiento y protocolo
Examen cercano + atraso	Priorizar	Recortar camino, seleccionar esenciales y simulación	Intervención humana prioritaria
Bloqueo no académico	Derivar correctamente	Escucha acotada y conexión con recurso adecuado	No improvisar atención especializada
Recuperación lograda	Consolidar	Validar retorno + siguiente acción	Bajar riesgo con vigilancia proporcional
	16. Compromisos y No Cortar

DECIDIDO	La unidad conductual central es el compromiso, no la tarea.
	Acción concreta.

Día y hora.

Duración/disponibilidad.

Evidencia esperada.

Estado: pendiente, cumplido, renegociado, incumplido, rescate.

Renegociar antes del horario es distinto de desaparecer y editar después.

16.1. No Cortar

Si el compromiso original falla, el sistema y/o acompañante reducen volumen antes de permitir un cero. El rescate puede cumplirse sin borrar el incumplimiento original.

17. Student Model / Personal Engine

DECIDIDO	El modelo se construye progresivamente con preguntas en contexto y comportamiento real.
	Criterio Achieve	Traducción académica
Desafío definido	Objetivos de carrera, semestre, materia y examen.
Motivo personal	Por qué importa y qué consecuencia tiene.
Compromiso social	Achieve y terceros relevantes.
Puntos de falla	Patrones de procrastinación, evitación y sobreestimación.
Checkpoint	Evidencia esperada.
Definición de avance	Qué cuenta como cumplido.
Horario blindado	Cuándo realmente funciona.
No Cortar	Rescate preferido.
Botón de motivación	Intervenciones que históricamente funcionan.
Manual de mantenimiento	Cómo volver al camino.
	17.1. Nuevas variables v0.5

Nivel de autonomía.

Intensidad humana recomendada.

Riesgo actual.

Capacidad real disponible.

Velocidad histórica por tipo de tarea.

Desfase típico entre plan y ejecución.

Confianza percibida por tema/evaluación cuando se pregunta.

Dominio demostrado por evidencia/práctica.

Brecha percepción–evidencia.

Respuesta histórica a distintos tipos de intervención humana.

18. Primer año como beachhead B2B prioritario

HIPOTESIS	Ingresantes + materias críticas + período acotado es escenario prioritario de piloto, no decisión exclusiva de mercado.
	Primer año permite probar adaptación, Formación, organización, compromiso, cursado, examen, intervención temprana y datos institucionales en un mismo período.

Ejemplo piloto: 50 ingresantes + 1–2 materias críticas + primer parcial + 6–8 semanas.

19. Activación y onboarding progresivo

DECIDIDO	Usuario activado = Achieve conoce suficiente realidad académica para recomendar una acción, el estudiante se compromete y existe evidencia esperada.
	 Login con mail.

 WhatsApp + asignación de acompañante.

 Orientación mínima.

 Universidad, carrera, plan, año, semestre.

 Academic Data Layer propone materias/cátedras/datos conocidos.

 Alumno confirma/corrige en vez de cargar todo desde cero.

 Se alcanza Mapa Académico Mínimo.

 Diagnóstico personal mínimo.

 Academic Decision + Risk generan primera acción.

 Alumno define disponibilidad y horario.

 Se crea compromiso.

 Acompañante interviene según necesidad.

 Ejecución + evidencia.

 Validación + progreso visible.

 Actualización de modelos + próxima acción.

19.1. Aha Moment deseado

“¿Cómo sabe Achieve todo esto de mi carrera?” → confirmo/corrijo → recibo una acción útil → alguien real espera que la haga.

20. Cursado continuo: antes, durante y después de clase

Achieve no debe existir solo cuando aparece un examen. La Data Layer + cronograma puede permitir acompañar el ritmo real del cursado.

Momento	Intervención posible
Antes de clase	Prerequisitos, ejercicios mínimos, preguntas a resolver.
En clase / contexto	Capturar cambios, qué dijo el profesor, tema real trabajado.
Después de clase	Consolidación, evidencia y actualización del mapa.
Acumulación	Detectar si el alumno se separa del ritmo esperado.
Examen	Cambiar progresivamente a protocolo intensivo.
	HIPOTESIS	Audio/texto interpretado por IA durante clase es visión evolutiva, no requisito MVP.
	21. CRM, Orquestación e Intervention Engine

21.0. El operador es usuario P0

El operador no es un parche humano detrás de la app. El producto debe permitirle entender en segundos quién necesita intervención, por qué, qué hacer y qué ocurrió después, sin reconstruir manualmente el historial.

**[DECIDIDO] **El golden path del MVP incluye tanto el flujo del estudiante como el flujo paralelo del operador cuando aparece riesgo o incumplimiento.

El CRM debe maximizar humanidad por minuto: menos mensajes rutinarios, más intervenciones oportunas y contextualizadas.

El sistema debe detectar quién necesita intervención y presentar contexto suficiente para que el acompañante no reconstruya la historia manualmente.

Riesgo y motivo.

Próximo examen/entrega.

Compromiso actual.

Última evidencia.

Incumplimientos/rescates.

Confianza percibida vs. dominio demostrado cuando exista brecha.

Señales de cursado relevantes.

Patrón relevante del Student Model.

Recomendación de intervención.

300 alumnos en Achieve → el sistema señala los 15 que necesitan humano ahora.

22. Plataforma, WhatsApp y fuente de verdad

Capa	Responsabilidad
Plataforma / backend	Fuente de verdad estructurada de mapa, datos, riesgo, acciones, compromisos, evidencia y progreso.
WhatsApp	Canal humano de baja fricción para seguimiento, negociación, rescate, reconocimiento y posible evidencia.
CRM	Vista operacional para priorizar y acompañar.
Academic Data Layer	Conocimiento compartido reutilizable entre estudiantes, carreras y cohortes.
	DECIDIDO	WhatsApp es canal; no debe ser la base de datos del producto.
	23. Propuesta de valor directa al estudiante

El producto debe ser suficientemente útil para que el alumno quiera usarlo incluso si la universidad lo provee. La Data Layer es central para esto.

No cargar desde cero lo que Achieve ya puede saber.

Tener materias, temas, recursos y evaluaciones organizados.

Acceder a conocimiento académico fragmentado y contextualizado.

Recibir una próxima acción en vez de decidir desde una hoja en blanco.

Ver si está llegando o desviándose.

Tener un plan de examen serio.

Sentir que hay una persona real pendiente de su progreso.

24. Propuesta de valor institucional

Intervenir sobre el proceso antes de que la única señal sea una mala nota, recursada o abandono.

Detección temprana de riesgo.

Priorización de intervención humana.

Mejor adherencia y regularidad.

Datos agregados sobre dificultad y comportamiento.

Capacidad de medir recuperación.

Programa de acompañamiento escalable.

HIPOTESIS	No diseñar todavía un dashboard institucional sofisticado; primero validar qué métricas mueven decisiones reales.
	25. Métricas

25.1. Activación

TFVP — Time to First Validated Progress: tiempo desde creación de cuenta hasta primera evidencia académica validada.

25.2. Conducta

Compromisos creados/cumplidos.

Renegociaciones responsables.

Incumplimientos.

Rescates.

Horas comprometidas vs. reales.

Días con avance.

25.3. Riesgo y recuperación

Cantidad de estudiantes por nivel de riesgo.

Tiempo desde señal hasta intervención.

Porcentaje que vuelve a bajo control.

Desvío antes/después de intervención.

25.4. Académicas

Evidencias.

Dominio demostrado.

Anticipación antes de examen.

Regularidad.

Resultado reportado.

Progreso por materia.

25.5. Data Layer

% de materias precargadas.

Tiempo para Mapa Académico Mínimo.

% de datos confirmados/corregidos.

Cobertura por carrera.

Tasa de datos desactualizados detectados.

25.6. Operación e intervención

Minutos humanos por alumno activo.

Alumnos activos por operador.

Tiempo desde RiskSignal hasta intervención.

Tasa de recuperación por playbook.

Reincidencia posterior a una recuperación.

Intervenciones sin outcome registrado.

Falsos positivos de riesgo cuando puedan identificarse.

25.7. Calidad humana

25.8. Product Event Model

Intervenciones auditadas por semana.

Adherencia al playbook.

Calibración entre operadores.

Resultado posterior a la intervención.

Errores repetidos que deben convertirse en mejora de playbook o producto.

La instrumentación se define antes del desarrollo para poder atribuir qué mecanismo se ejecutó y cuánto costó. Eventos mínimos sugeridos:

StudentActivated

ActionRecommended

CommitmentCreated

CommitmentStarted

CommitmentMissed

EvidenceSubmitted

EvidenceValidated

RiskSignalCreated

InterventionStarted

InterventionResolved

RescueSucceeded

AssessmentTaken

AssessmentOutcomeRecorded

Los nombres son provisionales; lo obligatorio es preservar actor, timestamp, institución, objeto relacionado, causa/origen y outcome cuando corresponda.

26. Alcance recomendado del MVP v0.5

26.1. Must have

Closed-loop Risk: RiskSignal con causa, owner, playbook sugerido, SLA y outcome.

Consola operativa P0 con cola priorizada de estudiantes/intervenciones.

Playbooks mínimos de intervención y registro del playbook usado.

Lifecycle formal de evidencia separado de ejecución/producción/dominio.

Instrumentación de eventos del golden path y minutos humanos.

Permisos por rol mínimos + aislamiento por institución + auditoría de cambios críticos.

Login + perfil + WhatsApp.

Academic Data Layer mínima con modelo de fuente/confianza/vigencia.

Precarga/carga de una o pocas carreras piloto.

Mapa Académico Mínimo.

Materias, evaluaciones, temas y recursos básicos.

Pendientes de información.

Academic Risk rule-based con señales conductuales, académicas y percepción–evidencia.

Próxima acción concreta y explicable.

Compromiso horario.

Seguimiento humano mediante CRM.

Evidencia + niveles básicos de validación.

Progreso/desvío visible.

No Cortar.

Formación aplicada básica con microintervenciones contextuales para ingresantes.

Modo Examen completo para modalidades prioritarias.

Historial de compromisos/evidencias/riesgo.

26.2. Should have

Dashboard institucional mínimo de adopción, riesgo, intervenciones y outcomes agregados.

Herramientas de QA para muestrear y revisar intervenciones humanas.

Exportación de analítica del piloto para línea de base y evaluación.

Importación institucional CSV.

Scrapers específicos de fuentes seleccionadas.

Curación asistida por IA.

Timeline/Gantt del semestre sin recrear un calendario completo.

Nivel de autonomía/intensidad humana.

Preguntas contextuales.

Simulacro básico.

Manual del estudiante.

Integración con calendario externo si aporta valor probado.

26.3. Later

Scraper universal.

Generalized Academic Ingestion Engine completo.

Comprensión automática de audio de clase.

Inferencia masiva de pesos desde cientos de exámenes.

Modelos predictivos complejos.

Validación automática universal.

Dashboard institucional avanzado.

Gamificación compleja.

27. Golden Path y criterios de calidad

El MVP puede ser técnicamente manual detrás, pero la experiencia del alumno debe representar de verdad la promesa de Achieve.

El alumno entra y Achieve ya conoce una parte útil de su carrera.

Puede confirmar/corregir sin carga exhaustiva.

Entiende dónde está y qué está desviándose.

Recibe una próxima acción concreta.

Se compromete con un horario.

El acompañante tiene contexto para intervenir.

Entrega evidencia.

El estado cambia de forma visible.

El riesgo se recalcula.

El siguiente paso aparece sin volver a empezar de cero.

Cuando se acerca un examen, el sistema cambia a un protocolo serio.

27.1. Golden Path paralelo del operador

 El sistema detecta una señal de riesgo explicable.

 La señal entra en una cola priorizada con contexto suficiente.

 El operador identifica el playbook y la acción sugerida sin reconstruir la historia.

 Ejecuta o adapta la intervención.

 Registra outcome y, si corresponde, nuevo compromiso/rescate.

 El Student Model y Risk Engine actualizan estado.

 La intervención queda disponible para QA y aprendizaje operativo.

28. Riesgos de producto y guardarraíles

Ser otro planner: si los alumnos crean planes pero no producen evidencia ni rescates, el loop está roto.

Coaching genérico: si los mensajes no tienen contexto académico o resultado esperado, Achieve pierde diferenciación.

Servicio humano no escalable: si minutos por alumno crecen sin relación con recuperación, revisar automatización/priorización/playbooks.

Vigilancia percibida: si la institución ve demasiado detalle individual, cae confianza y calidad del dato.

Sobrealcance técnico: ninguna integración profunda debe bloquear el primer piloto si CSV/formulario resuelve el caso.

Dashboard sin acción: si la universidad ve riesgo pero nadie es dueño de intervenir, el producto observa pero no cambia conducta.

Riesgo	Falla posible	Guardarraíl
Dependencia	Achieve decide todo y reduce criterio del alumno.	Autonomía creciente + explicabilidad.
Exam hacking	Optimizar solo temas que “seguro toman”.	Combinar fuentes y objetivos de dominio, no solo frecuencia histórica.
Datos obsoletos	Usar “Unidad 6 no entra” de otro año/profesor.	Versionado + fuente + vigencia + confianza.
Base basura	Acumular recursos sin curación.	Calidad, deduplicación y feedback.
Data entry infinito	Cada carrera requiere semanas manuales.	Modelo reutilizable + ingestión asistida + automatización progresiva.
Propiedad intelectual	Almacenar contenido sin derechos.	Provenance + políticas de almacenamiento/enlace/permiso.
Costo humano	Validar todo y perseguir a todos.	Risk Engine + intensidad adaptativa + validación por niveles.
Vanity metrics	Optimizar videos vistos/clicks.	Métricas de conducta, riesgo, preparación y resultado.
Falsa confianza	Tomar autopercepción como dominio real.	Contrastar confianza con evidencia y práctica autónoma.
Duplicación de herramientas	Construir Calendar/LMS completo por costumbre.	Integrar o representar solo la función necesaria para Achieve.
	29. Gobernanza de datos y propiedad intelectual

La Academic Data Layer agrega valor precisamente porque unifica material disperso, pero requiere disciplina de procedencia, vigencia, derechos y privacidad.

RBAC / permisos por rol: estudiante, operador, docente y autoridad no ven el mismo nivel de detalle.

Minimización: recolectar solo datos necesarios para una finalidad explícita del producto/piloto.

Auditoría: registrar cambios de caminos, RiskSignals, Evidence, intervenciones y accesos críticos.

Explicabilidad: toda señal de riesgo relevante debe mostrar causas operables; evitar scores opacos como única salida.

Aislamiento institucional: los datos de cada institución deben permanecer segregados lógica y contractualmente.

Retención/borrado: definir reglas contractuales y técnicas desde el piloto.

Portabilidad: importar/exportar datos básicos para no bloquear el piloto por integraciones profundas.

Guardar siempre la procedencia del recurso.

Distinguir almacenar contenido de enlazar a contenido externo.

No asumir que material compartido informalmente tiene derechos comerciales claros.

Permitir retirar o invalidar recursos.

Versionar programas/planes y evitar sobrescribir historia.

Separar datos personales del estudiante de conocimiento académico compartido.

Evitar exponer reportes individuales a la institución sin un diseño de privacidad/consentimiento definido.

30. Registro de decisiones v0.5

D20 — Academic Execution Layer: visión integral para estudiante; arquitectura complementaria a LMS/SIS/Calendar.

D21 — Closed-loop Risk: cada señal relevante tiene owner, playbook, SLA e outcome.

D22 — Intervention Playbooks: la intervención humana se diseña, versiona y mide.

D23 — Human QA: el acompañamiento se audita por calidad, oportunidad y resultado.

D24 — Evidence Lifecycle: estado operativo de evidencia separado de lo que demuestra sobre aprendizaje.

D25 — Governance P0: RBAC, trazabilidad, auditoría, minimización, aislamiento institucional y explicabilidad.

D26 — Product Event Model: instrumentar acción, compromiso, evidencia, riesgo, intervención, rescate, outcome y costo desde el MVP.

ID	Decisión	Estado
D1	Sistema académico integral	DECIDIDO
D2	Conducción asistida con autonomía creciente	DECIDIDO
D3	Avance = ejecución + producción + dominio	PROVISIONAL
D4	Mapa Académico vivo	DECIDIDO
D5	Formación adaptativa + Modo Examen estructurado	DECIDIDO
D6	Humano como componente deliberado	DECIDIDO
D7	Compromiso como contrato conductual	DECIDIDO
D8	Student Model basado en 10 criterios	DECIDIDO
D9	Activación = próxima acción + compromiso + evidencia esperada	DECIDIDO
D10	Mapa Académico Mínimo	DECIDIDO
D11	Progressive onboarding	DECIDIDO
D12	Progreso real vs. esperado; visual final pendiente	PENDIENTE
D13	Academic Risk como core	DECIDIDO
D14	Intensidad humana adaptativa	DECIDIDO
D15	Academic Data Layer como core	DECIDIDO
D16	Adquisición MVP semi-manual/semi-automática en pocas carreras	DECIDIDO
D17	Datos con fuente + confianza + vigencia	DECIDIDO
D18	Parciales viejos = señal histórica, no verdad suprema	DECIDIDO
D19	Primer año + materias críticas como piloto prioritario	HIPOTESIS
D20	Perception–Evidence Gap como señal del Student/Risk Model	DECIDIDO
D21	Asistencia, participación, dudas y primeras notas como señales potenciales de riesgo	DECIDIDO
D22	Scaffolding decreciente según autonomía demostrada	DECIDIDO
D23	Formación obligatoria de primer año = microintervenciones contextuales, no curso lineal	DECIDIDO
D24	Intervention Engine: intensidad humana adaptativa y priorizada por CRM	DECIDIDO
D25	No duplicar calendarios/LMS maduros sin evidencia de necesidad	GUARDARRAIL
	31. Hipótesis a validar

Un closed-loop de riesgo con owner/playbook recupera más estudiantes que una alerta o recordatorio aislado.

Playbooks entrenables reducen variabilidad entre operadores sin eliminar humanidad.

La instrumentación de outcomes permite reducir minutos humanos manteniendo o mejorando recuperación.

La evidencia mejora la calidad de la intervención y reduce falsa confianza/autodeclaración optimista.

El valor institucional aumenta cuando los patrones agregados muestran no solo riesgo, sino intervención y recuperación.

HIPOTESIS	Precargar realidad académica reduce radicalmente la fricción y aumenta percepción de valor.
	HIPOTESIS	El Aha Moment “Achieve conoce mi facultad” aumenta activación.
	HIPOTESIS	Próxima acción concreta reduce procrastinación y carga mental.
	HIPOTESIS	Compromiso horario aumenta ejecución.
	HIPOTESIS	Accountability humano contextual mejora cumplimiento en determinados perfiles/momentos.
	HIPOTESIS	Risk Engine permite concentrar humanos donde más valor generan.
	HIPOTESIS	Autonomía creciente mejora aceptación institucional y resultados de largo plazo.
	HIPOTESIS	Primer año es un beachhead B2B superior o complementario al Modo Examen.
	HIPOTESIS	Protocolos por modalidad se generalizan mejor que protocolos por carrera.
	HIPOTESIS	La Academic Data Layer puede convertirse en un activo acumulativo y defensible.
	HIPOTESIS	La universidad valora señales de recuperación antes del resultado final.
	HIPOTESIS	La brecha entre confianza percibida y dominio demostrado predice necesidad de intervención o refuerzo.
	HIPOTESIS	Asistencia/participación/dudas/primeras notas aportan valor incremental al Risk Engine cuando están disponibles.
	HIPOTESIS	Scaffolding decreciente mejora autonomía sin reducir adherencia.
	HIPOTESIS	Priorizar intervenciones humanas por riesgo mantiene valor con menor costo humano.
	32. Preguntas abiertas que bloquean diseño

¿Cuáles son los 4–6 playbooks mínimos del piloto y sus SLAs?

¿Qué RiskSignals disparan intervención automática, humana o solo observación?

¿Qué outcomes cierran formalmente una intervención?

¿Qué nivel de detalle individual puede ver cada rol institucional?

¿Qué eventos exactos y propiedades necesita la analítica del piloto?

¿Qué muestra y frecuencia de QA humano es suficiente durante el MVP?

¿Qué universidad/carrera se usará como primer golden dataset?

¿Qué fuentes concretas se pueden usar legalmente para el primer piloto?

¿Qué entidades exactas necesita el esquema de Academic Data Layer v1?

¿Cómo se define confidence score sin generar falsa precisión?

¿Qué información se comparte entre estudiantes y qué queda privada?

¿Qué modalidades de examen entran completas en el MVP?

¿Qué criterios psicopedagógicos exactos definen avance/dominio?

¿Qué evidencia requiere humano?

¿Web, WhatsApp o ambos para evidencia?

¿Cómo se representa desvío y riesgo al estudiante sin generar ansiedad?

¿Qué reglas exactas definen niveles BAJO/ATENCIÓN/RIESGO/INTERVENCIÓN?

¿Qué señales de cursado pueden obtenerse de forma confiable, ética y no invasiva?

¿Cómo modelar la brecha confianza–evidencia sin castigar autopercepciones honestas?

¿Cómo se calcula progreso sin una métrica engañosa?

¿Qué datos iniciales del Student Model son obligatorios?

¿Qué microintervenciones contextuales son obligatorias para primer año y en qué disparadores?

¿Qué intensidad humana corresponde a cada perfil y qué evento la cambia?

¿Qué integraciones externas evitan duplicar calendario/LMS en el MVP?

¿Qué métricas institucionales forman parte del piloto y cuáles no?

33. Brief para User Flow y wireframes

Diseñar dos golden paths en paralelo: estudiante y operador.

Wireframear consola operativa con cola priorizada, causa de riesgo, contexto, playbook, SLA y outcome.

Wireframear lifecycle de evidencia y estados suficientes/insuficientes.

Wireframear dashboard institucional mínimo solo después de resolver qué intervención y outcome representa cada señal.

Incluir permisos/visibilidad por rol desde los wireframes, no como parche posterior.

El wireframe debe materializar este sistema, no inventar navegación por costumbre. Cada vista debe ayudar a entender, decidir, ejecutar, demostrar, detectar desvío o acompañar.

 Login / bienvenida / WhatsApp.

 Identidad académica.

 Precarga desde Academic Data Layer + confirmación.

 Mapa Académico con cobertura/confianza/pendientes.

 Autogestión / Hoy.

 Desvío y riesgo personal, incluyendo señales de falsa confianza cuando corresponda.

 Próxima acción + explicación.

 Compromiso.

 Estado de compromiso.

 Evidencia y validación.

 Progreso real vs. esperado.

 Materia individual.

 Modo Examen.

 Formación aplicada.

 Historial de compromisos/rescates.

 Mi Manual / Student Model.

 CRM: Intervention Engine con cartera priorizada, causa de intervención y contexto.

 Panel de curación de Academic Data Layer (interno MVP).

34. Orden sugerido de trabajo

Cerrar RiskSignal → Intervention → Outcome y los playbooks mínimos antes de implementar consola.

Definir Product Event Model y propiedades antes de desarrollar el golden path.

Definir matriz de permisos/privacidad antes de dashboard institucional.

Probar operator flow en paralelo al student flow; no validar solo la UX del alumno.

 Cerrar esquema de Academic Data Layer v1 y una carrera piloto.

 Definir Risk Engine rule-based v1, incluyendo percepción–evidencia y señales de cursado disponibles.

 Cerrar modalidades/protocolos del golden path.

 Diagramar User Flow completo.

 Wireframes del primer día + loop diario + Modo Examen + CRM de intervención.

 Prototipo de baja fidelidad y pruebas con alumnos.

 Especificación funcional por estado/pantalla.

 Modelo de datos y contratos CRM/WhatsApp/Data Layer.

 Construir golden dataset de la carrera piloto.

 Implementar golden path.

 Probar con alumnos reales y acompañantes.

 Medir TFVP, cumplimiento, desvío, riesgo y recuperación.

 Iterar antes de ampliar cobertura de carreras.

35. Definición final del MVP v0.5

El primer MVP de Achieve debe demostrar un circuito cerrado de ejecución académica: conocer suficiente contexto, detectar desvío, proponer una próxima acción verificable, generar compromiso, recibir evidencia, adaptar el camino y, cuando corresponda, activar una intervención humana con playbook, responsable, plazo y outcome. El alumno debe recibir valor directo; el operador debe poder actuar sin reconstruir el contexto; la institución debe observar patrones agregados y resultados sin convertir Achieve en vigilancia ni reemplazar su infraestructura existente.

La universidad debe poder utilizar el mismo sistema para comprender riesgo y recuperación sin que el producto deje de ser genuinamente útil para el alumno. La Academic Data Layer, el Academic Risk Engine y Human Accountability no son productos separados: son capas de una misma propuesta.

36. Glosario v0.5

Término	Definición
Academic Data Layer	Capa compartida de conocimiento académico estructurado, versionado y con procedencia.
Academic Facts	Datos relativamente objetivos y oficiales.
Academic Intelligence	Señales derivadas por Achieve a partir de datos.
Community Knowledge	Conocimiento informal que circula entre estudiantes y puede estructurarse con contexto.
Mapa Académico	Instancia viva de la realidad académica de un estudiante.
Academic Decision Engine	Sistema que recomienda/prioriza la próxima acción.
Academic Risk Engine	Sistema que detecta desvío y necesidad de intervención.
Desvío Académico	Diferencia relevante entre estado esperado y real.
Student Model	Modelo personal de aprendizaje, conducta, motivación y autonomía.
Perception–Evidence Gap	Brecha entre confianza/autopercepción del estudiante y dominio demostrado mediante evidencia.
Intervention Engine	Lógica de CRM que prioriza cuándo una intervención humana puede aportar más valor.
Scaffolding decreciente	Reducción progresiva de conducción a medida que el estudiante demuestra mayor autonomía.
Human Accountability	Sistema humano de compromiso, exigencia, rescate y reconocimiento.
Compromiso	Acuerdo de realizar una acción en un momento definido con evidencia esperada.
No Cortar	Rescate mínimo que evita el cero sin borrar el incumplimiento original.
Evidence System	Sistema para comprobar ejecución, producción y dominio.
Protocolo de Preparación	Secuencia de acciones/evidencias según modalidad de evaluación.
Golden Dataset	Conjunto de datos académicos de una carrera/materia suficientemente completo para demostrar la experiencia objetivo.
Golden Path	Recorrido pequeño pero completo que representa la promesa real de Achieve.
	**Academic Execution Layer: **Capa que convierte contexto académico en acción, evidencia, adaptación, rescate y señal institucional sin reemplazar LMS/SIS.

**Closed-loop Risk: **Ciclo donde una señal de riesgo tiene causa, responsable, playbook, SLA, intervención y outcome.

**Intervention Playbook: **Protocolo entrenable y versionado para responder a un disparador conductual/académico.

**Intervention Outcome: **Resultado registrado de una intervención: recuperado, replanificado, escalado, sin respuesta, falso positivo u otro.

**Human QA: **Sistema de auditoría y calibración de la calidad de acompañamiento humano.

**Product Event Model: **Contrato de eventos que permite medir comportamiento, intervención, resultado y costo desde el MVP.

Fuente de benchmark incorporada en v0.5: ACHIEVE_Benchmark_Estrategico_Filadd_InsideTrack_Student_Success_v1.0 (21/08/2026). Se utiliza como evidencia de categoría y diseño comparado, no como validación causal de Achieve.

ACHIEVE · MVP Usuario Product Spec v0.5 · Agosto 2026

***

PARTE II — USER FLOWS, WIREFRAMES Y MODELO DE DOMINIO

ACHIEVE

USER FLOW + WIREFRAMES + DATA MODEL

Design Spec v0.2 FINAL

Traducción del Product Spec v0.5 a experiencia, estados, pantallas y dominio de datos

Una materia en Achieve es un espacio persistente de cursado. Cada evaluación puede activar una Preparación de Examen que se monta sobre ese historial y utiliza al Academic Engine para decidir el trabajo concreto.

Versión 0.2 FINAL · Agosto 2026 · Documento de trabajo para Producto, UX, CTO y SDD

0. Propósito, alcance y decisiones congeladas

Este documento toma como fuente funcional el Product Spec v0.5 FINAL y baja la visión a un diseño implementable. No redefine la estrategia de Achieve: especifica User Flows, estados, wireframes de baja fidelidad y un modelo de dominio inicial. Su objetivo es permitir que producto y desarrollo discutan sobre comportamientos concretos, no sobre ideas abstractas.

REGLA	El Product Spec v0.5 sigue siendo la fuente de verdad de visión y principios. Este documento es la fuente de verdad de flujo, UX low-fi y dominio.
	DECIDIDO	Cada materia posee un Modo Cursado persistente y puede tener múltiples Preparaciones de Examen asociadas a evaluaciones específicas.
	DECIDIDO	Modo Examen no reemplaza al Academic Engine. El protocolo define hitos de preparación; el Academic Engine decide las acciones académicas concretas entre esos hitos.
	DECIDIDO	La plataforma es la fuente de verdad estructurada. WhatsApp es un canal de interacción y puede recibir evidencias, pero éstas terminan normalizadas dentro del sistema.
	DECIDIDO	El avance real debe quedar visible en la materia mediante progreso, historial y una Bitácora de Avance.
	DECIDIDO	La activación automática del Modo Examen usa 14 días como default UX, no como regla pedagógica rígida. El alumno puede activarlo antes y el Engine puede recomendar activación anticipada.
	NUEVAS DECISIONES CERRADAS EN v0.2

• Progreso por unidad: el alumno puede ver Recorrido, Práctica, Dominio, Confianza percibida y Recencia. La UI puede resumir, pero el modelo no colapsa todo en un único porcentaje.

• Ritmo de cátedra: no se asume una unidad por clase. Se construye desde ClassSession observadas/confirmadas y temas efectivamente vistos; cuando no hay datos confiables se muestra el último ritmo confirmado y no se inventa avance futuro.

• Captura mínima de clase P0: cambio de prioridad de temas, cambio de fechas, tareas/entregas y notas contextuales de clase.

• Modalidades de Exam Protocol P0: práctico y teórico escrito. Oral y otras modalidades pasan a P1.

• Todos los entregables formales del Exam Protocol se revisan humanamente en el MVP; revisar el proceso no implica corregir académicamente cada ejercicio.

• Bitácora de Avance: timeline privado + resumen acumulado + hitos; sin likes, seguidores, comparaciones sociales ni feed público.

• Universidad: histórico agregado por defecto; detalle individual sólo cuando está autorizado y es necesario para intervenir. No se exponen chats, reflexiones íntimas ni evidencia cruda por defecto.

• CRM y Plataforma tienen ownership separado y se integran mediante contratos versionados. No comparten base de datos ni se acoplan a una implementación particular en este Design Spec.

• Derechos/licencias no bloquean el MVP, pero Resource debe conservar provenance y metadata mínima de rights_status desde el inicio.

0.1. Qué debe quedar claro al terminar este documento

Qué ve y hace un alumno desde el primer ingreso hasta su primera evidencia validada.

Cómo funciona una materia durante el cursado normal.

Cómo se activa y atraviesa una Preparación de Examen.

Cómo conviven Academic Engine, Exam Protocol, Student Model, Risk e Intervention Engine.

Qué necesita ver el operador para intervenir sin reconstruir contexto.

Qué entidades y estados necesita soportar la base de datos.

Qué eventos deben instrumentarse desde el primer MVP.

Qué pantallas forman el golden path y cuáles pueden esperar.

1. Arquitectura de experiencia: Inicio, Materia, Cursado y Examen

Achieve debe sentirse como un sistema único. Cursado y Examen son dos contextos de una misma materia, no dos productos desconectados.

1.1. Jerarquía conceptual

Mapa de experiencia ESTUDIANTE   │   +-- HOY / AUTOGESTIÓN   │     +-- estado general   │     +-- próxima acción   │     +-- compromiso de hoy   │     +-- materias y riesgo   │   +-- MATERIA         │         +-- MODO CURSADO  [persistente]         │     +-- ritmo de cátedra         │     +-- avance del alumno         │     +-- unidades/temas         │     +-- acciones y compromisos         │     +-- evidencias y recursos         │     +-- bitácora de avance         │         +-- PREPARACIÓN DE EXAMEN [0..N por materia]               +-- evaluación objetivo               +-- protocolo               +-- baseline/diagnóstico               +-- capacidad reservada               +-- cobertura               +-- prueba sin red               +-- mapa de errores               +-- simulacros               +-- cierre + postmortem

1.2. Modo Cursado

El Modo Cursado administra la relación continua entre estudiante y materia. Su pregunta central es: ¿cómo estoy construyendo esta materia respecto de lo que la cátedra está avanzando y qué conviene hacer ahora para no generar una brecha?

Representa ritmo de la cátedra y progreso del alumno.

Conserva unidades, temas, clases, recursos y evaluaciones.

Permite generar próximas acciones aun cuando no exista un examen urgente.

Registra compromisos, horas, ejercicios, evidencias, percepciones y rescates.

Debe hacer visible hace cuánto no se avanza y dónde se está formando una brecha.

Construye la base sobre la que luego se activa el Modo Examen.

1.3. Modo Examen

Una Preparación de Examen es un estado temporal y más rígido asociado a una evaluación concreta. Su pregunta central es: ¿qué condiciones de preparación debemos atravesar y demostrar antes de rendir?

Puede activarse manualmente en cualquier momento.

Achieve recomienda activación alrededor de 14 días por defecto, ajustable por carga y disponibilidad.

Reutiliza todo el historial de cursado, recursos, progreso y evidencias de la materia.

No reemplaza acciones académicas del Engine: agrega hitos y artefactos de preparación.

El alumno acepta un contrato más exigente de acciones, evidencias, simulaciones y seguimiento.

1.4. Separación de responsabilidades

Componente	Pregunta que responde	Ejemplo
Academic Data Layer	¿Qué sabemos de esta materia y evaluación?	Programa, unidades, profesor, fechas, recursos, parciales.
Academic Engine	¿Qué trabajo académico concreto conviene hacer ahora?	Resolver U3 ejercicios 8–14.
Exam Protocol	¿Qué hitos de preparación deben ocurrir antes de rendir?	Baseline, reservar horas, práctica sin red, simulacro.
Student Model	¿Cómo funciona este alumno?	Cumple mejor 18–20 h; sobreestima bloques largos.
Risk Engine	¿Se está desviando y cuán urgente es?	Dos incumplimientos + examen en 6 días.
Intervention Engine	¿Quién debe intervenir, cómo y con qué objetivo?	Operador aplica playbook de rescate.
Evidence System	¿Qué ocurrió realmente y qué demuestra?	Ejercicios enviados; producción alta, dominio todavía no demostrado.
	2. Golden Paths del MVP

2.1. Golden Path A — Primer día del estudiante

LOGIN / CUENTA    │ WHATSAPP + ACOMPAÑANTE    │ ORIENTACIÓN MÍNIMA    │ IDENTIDAD ACADÉMICA    │ PRECARGA / CONFIRMACIÓN DE MATERIAS    │ MAPA ACADÉMICO MÍNIMO    │ DIAGNÓSTICO PERSONAL MÍNIMO    │ ACADEMIC ENGINE    │ PRÓXIMA ACCIÓN    │ DISPONIBILIDAD + HORARIO    │ COMPROMISO    │ SEGUIMIENTO HUMANO    │ EJECUCIÓN    │ EVIDENCIA    │ VALIDACIÓN    │ PROGRESO VISIBLE + BITÁCORA    │ NUEVA PRÓXIMA ACCIÓN

2.2. Golden Path B — Día normal de cursado

ENTRA A ACHIEVE    │ HOY: estado + próxima acción    │ ABRE MATERIA    │ COMPARA RITMO CÁTEDRA vs. PROGRESO PERSONAL    │ ACADEMIC ENGINE PRIORIZA    │ ACCIÓN CONCRETA    │ COMPROMISO    │ EVIDENCIA + REFLEXIÓN BREVE    │ ACTUALIZA UNIDAD / TEMA    │ CREA ENTRADA EN BITÁCORA    │ RECALCULA BRECHA / RIESGO

2.3. Golden Path C — Activar Modo Examen

ASSESSMENT EXISTENTE / NUEVO    │ ACTIVAR PREPARACIÓN    │ CONFIRMAR CONTRATO DEL EXAMEN    │ BASELINE DE PREPARACIÓN    │ BLINDAR CAPACIDAD / HORAS    │ CERRAR KIT DE RECURSOS    │ EJECUTAR COBERTURA  <--- Academic Engine    │ PRIMERA PRUEBA SIN RED    │ MAPA DE ERRORES    │ PRÁCTICA TIPO EXAMEN    │ CERRAR BRECHAS  <--- Academic Engine    │ SIMULACIÓN FINAL    │ PREPARACIÓN FINAL    │ RENDIDA    │ POSTMORTEM + RESULTADO

2.4. Golden Path D — Operador

INICIA TURNO    │ COLA PRIORIZADA    │ SELECCIONA CASO    │ CONTEXTO < 10 s    │ RiskSignal / Commitment / Evidence / Checkpoint    │ PLAYBOOK SUGERIDO    │ INTERVENCIÓN    │ RESULTADO    │ ¿RECUPERADO?   /       \ NO         SÍ │           │ ESCALAR     CERRAR    \       / ACTUALIZAR RIESGO + STUDENT MODEL

3. User Flow detallado — Estudiante

UF-S01 Registro y activación

Entrada: estudiante nuevo. Salida: identidad académica mínima + acompañante asignado.

 Login con mail.

 Verificar/solicitar WhatsApp.

 Asignar acompañante.

 Mostrar orientación inicial breve.

 Solicitar universidad, carrera, plan, año y semestre.

 Intentar precarga.

UF-S02 Construcción de Mapa Académico Mínimo

Entrada: identidad académica. Salida: al menos una materia suficientemente conocida para producir una acción.

 Mostrar materias probables.

 Alumno confirma/corrige.

 Confirmar cátedra/profesor cuando aplique.

 Traer unidades/recursos/fechas disponibles.

 Crear pendientes no críticos.

 Bloquear conducción solo si no existe información mínima para ninguna materia.

UF-S03 Próxima Acción y Compromiso

Entrada: mapa mínimo. Salida: Commitment activo.

 Engine propone acción.

 Mostrar por qué importa.

 Mostrar tiempo estimado y evidencia.

 Alumno confirma si puede avanzar hoy.

 Seleccionar hora y disponibilidad.

 Crear Commitment.

 Enviar al CRM/cola operativa.

UF-S04 Evidencia y cierre de sesión

Entrada: acción ejecutada. Salida: progreso actualizado y nueva recomendación.

 Recibir evidencia.

 Capturar tiempo real.

 Preguntar dificultad/resultado solo si aporta señal.

 Validar.

 Actualizar TopicProgress/CourseProgress.

 Crear ProgressEntry.

 Reconocimiento humano.

 Recalcular.

UF-S05 Incumplimiento y No Cortar

Entrada: compromiso vencido o no iniciado. Salida: rescate, replanificación o escalamiento.

 Crear señal de riesgo.

 Activar playbook.

 Negociar versión mínima.

 No borrar incumplimiento original.

 Crear compromiso de rescate.

 Registrar outcome.

4. User Flow detallado — Modo Cursado

4.1. Objetivo de Cursado

Llegar al examen habiendo construido la materia de forma continua, visible y verificable, reduciendo la brecha entre el ritmo de la cátedra y el progreso real del estudiante.

4.2. Modelo de ritmo

Dimensión	Qué representa	Ejemplo
Ritmo de cátedra	Qué contenido debería haberse trabajado según clases/cronograma.	La cátedra ya terminó U3 y comenzó U4.
Progreso del alumno	Qué contenido recorrió, practicó o dominó.	U3: 55% de práctica; dominio bajo.
Brecha	Distancia operacional entre ambos.	Alumno retrasado ~1,5 unidades.
Último avance	Recencia de actividad útil.	Hace 5 días.
Carga futura	Qué viene pronto.	TP en 6 días; parcial en 23.
Fuente de ritmo	ClassSession confirmadas + cronograma confiable + eventos de clase.	Clase 12: continúa U3; se refuerza cambio de variables.
Incertidumbre	Cuando no existe señal suficiente, el estado queda explícitamente desconocido/estimado.	Último ritmo confirmado: U3, clase del 18/08.
	Decisión v0.2: el ritmo esperado no se calcula como “1 unidad = 1 clase”. La unidad temporal es la clase real (ClassSession). Cada clase puede cubrir parte de un tema, varios temas o continuar una unidad. Achieve deriva el ritmo de cátedra a partir de sesiones confirmadas, cronograma confiable cuando exista y eventos aportados por el alumno. Si falta información, muestra “último ritmo confirmado” y puede pedir una actualización mínima; no inventa.

4.3. Qué puede generar acciones en Cursado

Una unidad atrasada respecto de la cátedra.

Prerrequisitos necesarios para la próxima clase.

Consolidación postclase para evitar olvido.

TP o entrega próxima.

Pendiente de información relevante.

Dificultad alta reportada.

Demasiados días sin avance.

Brecha percepción–evidencia.

Recomendación de Formación contextual.

4.3A. Captura mínima de eventos de clase

El alumno no debe completar una ficha después de cada clase. La entrada P0 es “Pasó algo en clase” y sólo captura cambios que puedan modificar decisiones del sistema.

• Prioridad de tema: subir o bajar relevancia (“el profe dijo que esto es central”, “esto no entra”).

• Cambio de fecha: parcial, TP, entrega o clase.

• Tarea/entrega: qué hay que hacer y para cuándo.

• Nota contextual: relaciones entre temas, énfasis del docente, “esto se ve desde acá”, “para U5 hay que saber U3”, etc.

• Toda captura conserva fecha, CourseOffering/ClassSession, fuente estudiante-clase y posibilidad de corrección.

4.4. Bitácora de Avance

La Bitácora no es un feed social ni una gamificación superficial. Es la memoria visible de trabajo real realizado dentro de una materia. Debe permitir al estudiante mirar semanas o meses hacia atrás y ver evidencia concreta de que construyó algo.

Campo	Ejemplo
Fecha	14 de junio
Materia / unidad	Análisis II · Unidad 1
Acción	30 ejercicios resueltos
Horario comprometido	14:00–17:00
Tiempo real	2 h 48 min
Evidencia	5 imágenes validadas
Reflexión alumno	“Me re costó pero se pudo.”
Feedback acompañante	“Hoy estabas con cero ganas y terminaste los 30. Tremendo.”
Impacto	U1 45% → 71%
	Decisión visual v0.2 — La Bitácora se representa como una timeline privada de tarjetas cronológicas. Arriba muestra un resumen acumulado de la materia (sesiones, ejercicios, horas, evidencias, rescates y unidades); cada tarjeta puede contener acción, tiempo, evidencia, reflexión breve, feedback humano e impacto. Incluye filtros por Todo / Unidad / Examen / Hitos. No existe interacción social pública.

5. Exam Protocol — arquitectura provisional P0

La secuencia de pasos de esta sección es una arquitectura funcional provisional para poder diseñar el software. El lunes comienza la definición pedagógica con la psicopedagoga. El sistema debe soportar un CORE versionable y variantes por modalidad sin hardcodear estos 12 pasos como verdad pedagógica. En P0 sólo se implementan práctico y teórico escrito; oral y demás modalidades quedan P1.

Paso	Objetivo	Artefacto
EP-01 Cerrar contrato del examen	Confirmar fecha, modalidad, alcance, duración, profesor, materiales permitidos, recursos y dudas.	Mapa del Examen confirmado.
EP-02 Baseline de preparación	Medir qué puede hacer hoy sin ayuda completa y contrastar percepción con desempeño.	Diagnóstico inicial.
EP-03 Blindar capacidad	Reservar bloques reales hasta la fecha de rendida. El protocolo asegura capacidad; el Engine decide qué poner dentro.	Agenda / bloques confirmados.
EP-04 Cerrar kit de recursos	Asegurar que existe el material correcto: programa, guías, bibliografía, resúmenes, evaluaciones previas.	Kit de preparación confirmado.
EP-05 Ejecutar cobertura	Trabajar unidades/temas mediante acciones del Academic Engine.	Cobertura y evidencias acumuladas.
EP-06 Primera prueba sin red	Retirar ayudas y comprobar recuperación/aplicación.	Evidencia de desempeño autónomo.
EP-07 Mapa de errores	Convertir fallos en brechas concretas y acciones correctivas.	Error Map.
EP-08 Práctica tipo examen	Realizar práctica suficientemente parecida al formato real.	Simulacro / práctica equivalente.
EP-09 Cerrar brechas	Reordenar el trabajo según errores y desempeño.	Plan correctivo.
EP-10 Simulación final	Ejecutar bajo condiciones lo más similares posibles al examen.	Resultado final de simulación.
EP-11 Preparación final	Decidir qué repasar, qué no intentar aprender, logística, sueño y estrategia.	Checklist final.
EP-12 Rendida y postmortem	Registrar resultado, sorpresas, temas tomados, desempeño y aprendizajes.	Outcome + postmortem.
	5.1. Activación

Manual: el alumno puede activar una preparación cuando quiera.

Automática recomendada: default de 14 días antes de la evaluación.

Adaptativa: el Engine puede recomendar antes si la carga estimada supera la disponibilidad.

No forzar una activación tardía si el alumno ya está suficientemente preparado; el protocolo puede reconocer trabajo previo del cursado.

5.2. Contrato psicológico

Al activar Modo Examen, el alumno deja de improvisar el proceso. Achieve administra la preparación; el estudiante conserva agencia pero acepta ejecutar acciones, entregar evidencias y realizar las pruebas previstas.

La promesa no es 'si hacés esto aprobás'. La promesa es que el estudiante atravesará un proceso explícito, verificable y progresivamente similar a la evaluación real.

5.3. Validación humana y PreparationReadiness

Durante el MVP, todos los entregables formales del Exam Protocol requieren revisión humana. Esta revisión valida que el artefacto existe, cumple estructura y permite continuar; no convierte al acompañante en profesor particular ni obliga a corregir académicamente cada microevidencia del Academic Engine.

PreparationReadiness es un estado operativo, no una probabilidad de aprobación. Estados P0: NOT_READY → BUILDING → READY_BY_PROTOCOL. READY_BY_PROTOCOL significa que el alumno cumplió las condiciones exigidas por el protocolo vigente para llegar razonablemente preparado; no significa “va a aprobar”.

Criterio provisional para READY_BY_PROTOCOL: pasos obligatorios completos + entregables formales aceptados + práctica autónoma realizada + al menos una experiencia comparable al examen + ausencia de brechas críticas conocidas sin trabajar. Los umbrales exactos se fijan con psicopedagogía.

6. Principios para wireframes

La pantalla principal debe priorizar una próxima acción, no un dashboard de métricas.

Cada materia muestra primero estado + desvío + qué hacer; la analítica histórica queda debajo o en vistas secundarias.

Cursado y Examen se distinguen claramente sin sentirse aplicaciones distintas.

Una evidencia validada siempre cambia algo visible.

Mostrar razones del Engine cuando la recomendación no sea obvia.

Evitar porcentajes sin semántica. Distinguir recorrido, práctica y dominio cuando corresponda.

La Bitácora debe sentirse humana: evidencia + reflexión + feedback, no sólo números.

No recrear Calendar: si se necesita calendario, integrar o representar bloques suficientes para el caso de uso.

El operador tiene su propio estándar de <10 segundos para entender contexto.

Low-fi primero: arquitectura y estados antes que estética.

7. Wireframes low-fi — Estudiante

WF-S01 — Hoy / Autogestión

PROPÓSITO Responder en menos de 10 segundos: dónde estoy, qué hago ahora, qué evidencia necesito y qué sigue. REGLAS • Una acción principal; pocas secundarias. • Estado general simple. • No saturar con analytics.	┌─────────────────────────────────────────────┐ │ ACHIEVE · Hoy                     Juan  ▼   │ ├─────────────────────────────────────────────┤ │ ESTADO                                      │ │ 🟡 Necesita atención: Análisis II           │ │ 2 materias al día · 1 con brecha            │ ├─────────────────────────────────────────────┤ │ LO MÁS IMPORTANTE AHORA                     │ │ Análisis II · Unidad 3                      │ │ Resolver ejercicios 8–14                    │ │ ~60 min · Evidencia: ejercicios resueltos   │ │                                              │ │ Por qué: la cátedra ya empezó U4 y todavía  │ │ no cerraste práctica autónoma de U3.        │ │                                              │ │ [ COMPROMETERME ]      [ Ver materia ]      │ ├─────────────────────────────────────────────┤ │ HOY                                         │ │ 19:00  Compromiso pendiente                 │ ├─────────────────────────────────────────────┤ │ MATERIAS                                    │ │ Análisis II    🟡  brecha                    │ │ Programación   🟢  bajo control              │ │ Arquitectura   🟢  bajo control              │ └─────────────────────────────────────────────┘
	WF-S02 — Materia / Modo Cursado

PROPÓSITO Ser la vista persistente de una materia: ritmo, brecha, progreso, próxima acción y acceso al historial. REGLAS • No asumir que '55%' = dominio. • Visualización final puede ser Gantt/timeline híbrido. • El tab Examen aparece si existe evaluación próxima.	┌─────────────────────────────────────────────┐ │ ← Análisis Matemático II                    │ │ CURSADO  │  EXAMEN (Parcial 1 · 23 días)   │ ├─────────────────────────────────────────────┤ │ ESTADO DE MATERIA                           │ │ 🟡 Algo atrasado · Último avance: hace 2 d │ │ Cátedra: U4        Vos: U3                  │ ├─────────────────────────────────────────────┤ │ AVANCE POR UNIDADES                         │ │ U1 ██████████ 100%                          │ │ U2 █████████░  90%                          │ │ U3 ██████░░░░  55%  ← atención             │ │ U4 █░░░░░░░░░  10%  · cátedra 60%          │ ├─────────────────────────────────────────────┤ │ PRÓXIMA ACCIÓN                              │ │ Cerrar ejercicios U3 · ~60 min              │ │ [ HACER / COMPROMETERME ]                   │ ├─────────────────────────────────────────────┤ │ Recursos · Clases · Bitácora · Archivos     │ └─────────────────────────────────────────────┘
	WF-S03 — Timeline / Gantt de materia

PROPÓSITO Mostrar avance esperado vs. real sin convertir el home en un tablero complejo. REGLAS • Debe permitir lectura por unidad. • Puede incluir clases/evaluaciones como hitos. • No congelar todavía el componente visual definitivo.	┌─────────────────────────────────────────────┐ │ Análisis II · Desarrollo del semestre       │ ├─────────────────────────────────────────────┤ │          AGO            SEP           OCT   │ │ U1  ████████                                │ │     ▓▓▓▓▓▓▓▓  vos                           │ │ U2       ████████                           │ │          ▓▓▓▓▓▓▓░                           │ │ U3             ████████                     │ │                ▓▓▓▓░░░░  ← brecha           │ │ U4                    ████████              │ │                       ▓░░░░░░░              │ ├─────────────────────────────────────────────┤ │ Próxima clase: U4 · viernes                 │ │ Para aprovecharla: cerrar U3 práctica base  │ └─────────────────────────────────────────────┘
	WF-S04 — Bitácora de Avance

PROPÓSITO Hacer tangible el trabajo acumulado y construir memoria emocional/operativa de la materia. REGLAS • Se genera desde eventos, no requiere escribir un diario. • Puede filtrar por unidad, evidencia o examen.	┌─────────────────────────────────────────────┐ │ BITÁCORA DE AVANCE                          │ ├─────────────────────────────────────────────┤ │ 14 JUN · Unidad 1                           │ │ 30 ejercicios · 2h48 · 5 evidencias ✓      │ │ "Me re costó pero se pudo."                 │ │ Agus: "Viste que arrancando salía."         │ │ Impacto U1: 45% → 71%                       │ ├─────────────────────────────────────────────┤ │ 18 JUN · Simulacro #1                       │ │ 68% · 1h20 · error: cambio de variables     │ ├─────────────────────────────────────────────┤ │ 21 JUN · Unidad 2                           │ │ 12 ejercicios · 1h05 · evidencia ✓         │ └─────────────────────────────────────────────┘
	WF-S05 — Detalle de Próxima Acción

PROPÓSITO Reducir incertidumbre de inicio y explicitar criterio de finalización. REGLAS • Verbo + alcance + tiempo + recursos + evidencia. • Explicación breve del porqué. • Permitir corregir/rechazar sin ocultar la decisión.	┌─────────────────────────────────────────────┐ │ PRÓXIMA ACCIÓN · Análisis II                │ ├─────────────────────────────────────────────┤ │ Resolver ejercicios 8–14 de U3              │ │                                              │ │ POR QUÉ                                     │ │ • U3 todavía tiene práctica insuficiente    │ │ • la próxima clase usa este contenido       │ │ • tu parcial es en 23 días                  │ │                                              │ │ TIEMPO ESTIMADO: 60–75 min                  │ │ USÁ: guía + hoja de fórmulas                │ │ ENTREGÁ: ejercicios resueltos               │ │                                              │ │ [ ME COMPROMETO ]    [ No puedo hoy ]       │ └─────────────────────────────────────────────┘
	WF-S06 — Compromiso

PROPÓSITO Transformar recomendación en acuerdo conductual observable. REGLAS • Renegociar antes ≠ editar después. • El CRM debe recibirlo inmediatamente. • Mostrar consecuencias sin tono punitivo infantil.	┌─────────────────────────────────────────────┐ │ CREAR COMPROMISO                            │ ├─────────────────────────────────────────────┤ │ Acción: U3 · ejercicios 8–14                │ │ Estimación: 60–75 min                       │ │                                              │ │ ¿A qué hora te sentás?                      │ │ [ 19:00 ]                                   │ │                                              │ │ ¿Cuánto tiempo tenés realmente?             │ │ [ 70 min ]                                  │ │                                              │ │ Evidencia esperada: ejercicios resueltos    │ │                                              │ │ [ CONFIRMAR COMPROMISO ]                    │ │                                              │ │ "Una vez confirmado, no da lo mismo."       │ └─────────────────────────────────────────────┘
	WF-S07 — Evidencia + reflexión mínima

PROPÓSITO Cerrar la acción y producir información útil para progreso y próximos pasos. REGLAS • Preguntar poco y en contexto. • No confundir 'subido' con 'dominado'. • Aceptar web o WhatsApp; normalizar en Evidence.	┌─────────────────────────────────────────────┐ │ CERRAR ACCIÓN                               │ ├─────────────────────────────────────────────┤ │ Subí la evidencia                           │ │ [ + Foto / archivo / texto / audio ]        │ │                                              │ │ Tiempo real                                 │ │ [ 68 min ]                                  │ │                                              │ │ ¿Cómo salió?                                │ │ [ Más fácil ] [ Esperado ] [ Más difícil ]  │ │                                              │ │ ¿Pudiste resolver sin mirar soluciones?     │ │ [ 5 / 7 ]                                   │ │                                              │ │ [ ENVIAR ]                                  │ └─────────────────────────────────────────────┘
	WF-S08 — Progreso actualizado

PROPÓSITO Recompensar comportamiento real haciendo visible qué cambió. REGLAS • Reconocimiento humano cuando corresponda. • No usar métricas falsas de dominio. • Mostrar impacto causal de la acción.	┌─────────────────────────────────────────────┐ │ AVANCE VALIDADO ✓                           │ ├─────────────────────────────────────────────┤ │ U3 · práctica: 55% → 72%                    │ │ Compromiso: CUMPLIDO                        │ │ +68 min reales · +1 evidencia               │ │                                              │ │ Agus: "Dijiste que no querías meter hoy y   │ │ terminaste los 7. Bien ahí."                │ │                                              │ │ VAS SEGÚN PLAN PARA LA PRÓXIMA CLASE        │ │                                              │ │ [ VER BITÁCORA ]     [ SIGUIENTE ACCIÓN ]   │ └─────────────────────────────────────────────┘
	WF-S09 — Activación de Modo Examen

PROPÓSITO Convertir una evaluación en un proceso explícito y más exigente. REGLAS • Default 14 días; adaptativo. • Mostrar por qué se recomienda activar. • No prometer aprobación.	┌─────────────────────────────────────────────┐ │ PARCIAL 1 · Análisis II · 14 días           │ ├─────────────────────────────────────────────┤ │ Te recomendamos activar Modo Examen.        │ │                                              │ │ Con lo que sabemos hoy:                     │ │ • 6 unidades objetivo                       │ │ • 3 requieren trabajo fuerte                │ │ • ~17 h estimadas de preparación            │ │ • disponés ~20 h                            │ │                                              │ │ Al activarlo vamos a administrar el proceso │ │ hasta la rendida: acciones, evidencias y    │ │ simulaciones.                               │ │                                              │ │ [ ACTIVAR PREPARACIÓN ] [ Más adelante ]    │ └─────────────────────────────────────────────┘
	WF-S10 — Modo Examen / overview

PROPÓSITO Dar sensación de proceso confiable: fase actual, hitos ya cerrados, lo que sigue y acción de hoy. REGLAS • Protocolo y Engine visibles pero no mezclados. • El alumno puede descansar en el proceso. • Mostrar riesgos restantes.	┌─────────────────────────────────────────────┐ │ EXAMEN · Parcial 1                9 días    │ ├─────────────────────────────────────────────┤ │ FASE ACTUAL: Construir dominio              │ │ Protocolo 5/12                              │ │ [████████░░░░░░░░░]                         │ ├─────────────────────────────────────────────┤ │ HITOS                                       │ │ ✓ Mapa confirmado                           │ │ ✓ Baseline                                  │ │ ✓ Horas blindadas                           │ │ ✓ Kit de recursos                           │ │ → Cobertura / práctica                      │ │ ○ Prueba sin red                            │ │ ○ Mapa de errores                           │ │ ○ Simulacro                                 │ │ ...                                         │ ├─────────────────────────────────────────────┤ │ HOY · Academic Engine                       │ │ U4 · ejercicios 12–18 · 70 min              │ │ [ COMPROMETERME ]                           │ └─────────────────────────────────────────────┘
	WF-S11 — Paso de protocolo

PROPÓSITO Estandarizar cada hito del examen con explicación, ejemplo, recursos y entregable. REGLAS • No incluir trabajo específico que corresponde al Academic Engine. • Cada paso debe tener criterio de cierre. • Material breve y aplicado.	┌─────────────────────────────────────────────┐ │ PASO 6 · PRIMERA PRUEBA SIN RED             │ ├─────────────────────────────────────────────┤ │ ¿Por qué hacemos esto?                      │ │ Video · 3:20                                │ │                                              │ │ QUÉ TENÉS QUE HACER                         │ │ Resolver una selección representativa sin   │ │ mirar solución ni apuntes.                  │ │                                              │ │ EJEMPLO                                     │ │ [ ver ejemplo de entregable ]               │ │                                              │ │ APOYO                                       │ │ PDF breve · links de Formación              │ │                                              │ │ ENTREGABLE                                  │ │ resolución + tiempo + errores marcados      │ │                                              │ │ [ EMPEZAR PASO ]                            │ └─────────────────────────────────────────────┘
	WF-S12 — Mapa de Errores

PROPÓSITO Transformar desempeño imperfecto en brechas operables. REGLAS • Error debe relacionarse con tema/causa. • Alimenta nuevas ActionRecommendation. • No etiquetar al alumno; describir la brecha.	┌─────────────────────────────────────────────┐ │ MAPA DE ERRORES                             │ ├─────────────────────────────────────────────┤ │ 🔴 Cambio de variables                      │ │    No identificás cuándo aplicarlo          │ │    → Acción correctiva sugerida             │ │                                              │ │ 🟡 Integral triple                          │ │    Error algebraico recurrente              │ │    → 4 ejercicios específicos               │ │                                              │ │ 🟡 Tiempo                                   │ │    Ejercicio 4 consumió 28% del simulacro   │ │                                              │ │ [ GENERAR PLAN CORRECTIVO ]                 │ └─────────────────────────────────────────────┘
	8. Wireframes low-fi — Operador / CRM

WF-O01 — Cola priorizada

PROPÓSITO Responder: ¿quién necesita una persona ahora, por qué y con qué urgencia? REGLAS • No ordenar por último mensaje. • Cada caso muestra causa y playbook sugerido. • Verdes pueden ocultarse por defecto.	┌─────────────────────────────────────────────┐ │ ACHIEVE CRM · Cola de intervención          │ ├─────────────────────────────────────────────┤ │ 🔴 Juan · Análisis II          ahora         │ │ 2 incumplimientos + parcial 6 días          │ │ Playbook: examen cercano + atraso           │ ├─────────────────────────────────────────────┤ │ 🔴 Mora · Física               18 min        │ │ evidencia insuficiente                      │ ├─────────────────────────────────────────────┤ │ 🟡 Pedro · Programación        hoy           │ │ todavía no definió compromiso               │ ├─────────────────────────────────────────────┤ │ 🟢 Lucía                                     │ │ bajo control · no intervenir                │ └─────────────────────────────────────────────┘
	WF-O02 — Contexto de estudiante

PROPÓSITO Permitir que el acompañante intervenga bien sin releer chats ni reconstruir el semestre. REGLAS • Contexto <10 segundos. • Mostrar sólo datos que cambian la intervención. • No reemplazar juicio humano.	┌─────────────────────────────────────────────┐ │ JUAN · contexto operativo                   │ ├─────────────────────────────────────────────┤ │ RIESGO 🔴  Examen 6 días                    │ │ Materia: Análisis II                        │ │ Próxima acción: U4 ej. 12–18                │ │ Compromiso: ayer 19:00 · incumplido         │ │ Última evidencia: hace 3 días               │ │ Punto de falla: le cuesta empezar           │ │ Mejor horario histórico: 18–20              │ │                                              │ │ PLAYBOOK SUGERIDO                           │ │ Examen cercano + atraso                     │ │ Objetivo: conseguir bloque mínimo hoy       │ │                                              │ │ [ WHATSAPP ] [ REGISTRAR INTERVENCIÓN ]     │ └─────────────────────────────────────────────┘
	WF-O03 — Registrar intervención

PROPÓSITO Cerrar el loop de riesgo: responsable, acción, resultado y próximo estado. REGLAS • Toda intervención importante termina en outcome. • Registrar minutos humanos. • Playbooks versionados.	┌─────────────────────────────────────────────┐ │ INTERVENCIÓN · Juan                         │ ├─────────────────────────────────────────────┤ │ Trigger: compromiso incumplido              │ │ Playbook: No Cortar / examen cercano        │ │ SLA: hoy                                    │ │                                              │ │ Mensaje / acción realizada                  │ │ [ _________________________________ ]        │ │                                              │ │ Outcome                                     │ │ ○ recuperado                                │ │ ○ replanificado                             │ │ ○ sin respuesta                             │ │ ○ escalado                                  │ │                                              │ │ Nuevo compromiso [ 21:00 · 25 min ]         │ │ [ CERRAR INTERVENCIÓN ]                     │ └─────────────────────────────────────────────┘
	WF-O04 — Revisión de evidencia

PROPÓSITO Permitir validar sin convertir al operador en corrector académico universal. REGLAS • Separar lifecycle de evidence de nivel de dominio. • Escalar a docente/tutor sólo donde corresponda.	┌─────────────────────────────────────────────┐ │ REVISIÓN DE EVIDENCIA                       │ ├─────────────────────────────────────────────┤ │ Mora · Física · U2                          │ │ Acción: 8 ejercicios                        │ │ Archivos: 4 imágenes                        │ │                                              │ │ Estado                                      │ │ ○ suficiente   ○ insuficiente               │ │                                              │ │ ¿Qué demuestra?                             │ │ Ejecución:  alta                            │ │ Producción:  alta                           │ │ Dominio:     no evaluado                    │ │                                              │ │ Feedback [ ________________________ ]         │ │ [ VALIDAR ] [ DEVOLVER ]                    │ └─────────────────────────────────────────────┘
	9. Wireframe mínimo — Institución

WF-I01 — Dashboard institucional mínimo

PROPÓSITO Mostrar adopción, riesgo, intervención y patrones agregados sin convertir el producto en vigilancia. REGLAS • Datos agregados por defecto. • Casos individuales sólo con permisos/consentimiento aplicable. • Intervención antes que dashboard.	┌─────────────────────────────────────────────┐ │ PILOTO · Ingeniería · Cohorte 1             │ ├─────────────────────────────────────────────┤ │ ACTIVOS  82/100     EN RIESGO  17           │ │ INTERVENCIONES HOY  24                      │ │ RECUPERADOS 48 h    11                      │ ├─────────────────────────────────────────────┤ │ POR MATERIA                                 │ │ Análisis I      🔴 26% atención/riesgo       │ │ Física I        🟡 18%                       │ │ Programación    🟢  9%                       │ ├─────────────────────────────────────────────┤ │ PATRONES                                    │ │ • U3 Análisis concentra mayor atraso        │ │ • no respuesta ↑ últimos 5 días             │ │                                              │ │ [ VER MÉTRICAS AGREGADAS ]                  │ └─────────────────────────────────────────────┘
	10. Arquitectura de información provisional

Área	Usuario	Responsabilidad
Hoy / Autogestión	Alumno	Estado general, próxima acción y compromiso actual.
Materias	Alumno	Espacios persistentes de cursado y evaluaciones.
Materia > Cursado	Alumno	Ritmo, unidades, progreso, recursos, acciones y Bitácora.
Materia > Examen	Alumno	Preparaciones activas/pasadas por Assessment.
Formación	Alumno	Biblioteca y microintervenciones aplicadas.
Compromisos	Alumno	Historial de promesas, cumplimiento, renegociaciones y rescates.
Mi Manual	Alumno	Patrones personales y aprendizaje sobre cómo estudia.
Cola	Operador	Priorización de intervenciones.
Estudiante	Operador	Contexto, historial y acciones.
Evidencias	Operador	Revisión cuando requiere humano.
Playbooks/QA	Operador/Lead	Metodología, calidad y calibración.
Piloto / Cohorte	Institución	Métricas agregadas, riesgo e intervención.
	11. Modelo de dominio conceptual

11.1. Grafo principal

Institution   └─ AcademicProgram       └─ CurriculumPlan           └─ Course               └─ CourseOffering                   ├─ Instructor                   ├─ ClassSession                   ├─ Topic                   ├─ Resource                   └─ Assessment  Student   └─ Enrollment       └─ CourseEnrollment           ├─ TopicProgress           ├─ Action           │   ├─ ActionRecommendation           │   ├─ Commitment           │   ├─ Evidence           │   └─ Reflection           ├─ ProgressEntry           └─ ExamPreparation               ├─ ExamProtocol               ├─ ProtocolStep               ├─ ProtocolArtifact               ├─ Diagnostic               ├─ ErrorMap               └─ Simulation

11.2. Entidades académicas

Entidad	Responsabilidad	Campos mínimos
Institution	Universidad/facultad cliente.	id, name, tenant_config
AcademicProgram	Carrera.	id, institution_id, name
CurriculumPlan	Plan versionado de carrera.	id, program_id, version, valid_from/to
Course	Materia abstracta dentro de un plan.	id, curriculum_plan_id, code, name
CourseOffering	Dictado concreto en período/cátedra.	id, course_id, term, instructor, commission
Instructor	Docente/profesor relacionado con offering.	id, name, metadata
ClassSession	Clase prevista/real, tema y fecha.	id, offering_id, date, topics, status
Topic	Unidad/tema académico relacionable.	id, offering/course, parent_id, prerequisites
Resource	Material vinculado a materia/tema.	id, type, source, rights, url/file
Assessment	Parcial/final/TP/entrega.	id, offering_id, type, date, modality, scope
	11.3. Entidades del estudiante

Entidad	Responsabilidad	Campos mínimos
Student	Usuario estudiante.	id, profile, whatsapp, timezone
Enrollment	Relación estudiante-programa/período.	student_id, program_id, term
CourseEnrollment	Instancia personal de una materia.	student_id, offering_id, status
TopicProgress	Estado personal por tema.	topic_id, exposure, practice, domain, confidence
Availability	Restricciones y ventanas útiles.	day/time, capacity, source
StudentModel	Modelo agregado versionable.	behavioral, learning, motivational
AcademicGoal	Objetivo de semestre/materia/examen.	scope, target, priority
	11.4. Entidades de ejecución

Entidad	Responsabilidad	Campos mínimos
Action	Unidad ejecutable de trabajo.	id, course_enrollment, objective, verb, scope, status
ActionRecommendation	Propuesta del Engine con razones.	action_id, reason, priority, generated_at
Commitment	Acuerdo conductual.	action_id, start_at, planned_minutes, state
Evidence	Prueba de ejecución/producción/dominio.	action_id, content, lifecycle_state, signals
Reflection	Feedback breve del alumno.	difficulty, confidence, actual_minutes, note
ProgressEntry	Vista histórica de avance.	derived event bundle / optional materialization
	11.5. Entidades de preparación de examen

Entidad	Responsabilidad	Campos mínimos
ExamPreparation	Instancia de preparación de Assessment.	assessment_id, student_id, activated_at, status
ExamProtocol	Plantilla según modalidad/versión.	modality, version
ProtocolStep	Hito general del protocolo.	sequence, type, criterion, required
ProtocolArtifact	Entregable que cierra un paso.	step_id, artifact_type, evidence_id
Diagnostic	Baseline inicial.	preparation_id, measures, result
ErrorMap	Brechas detectadas por práctica/simulación.	preparation_id, errors, causes
Simulation	Práctica comparable al examen.	preparation_id, conditions, result
PreparationReadiness	Estado operativo de preparación según protocolo, no predicción de aprobación.	state, required_steps, evidence_status, autonomous_practice, simulation, critical_gaps
	11.6. Riesgo e intervención

Entidad	Responsabilidad	Campos mínimos
RiskSignal	Señal explicable de desvío.	type, severity, reason, source, valid_until
Intervention	Acción de soporte con dueño.	risk_signal_id, owner, playbook, SLA, status
InterventionOutcome	Resultado de intervención.	recovered, replanned, no_response, escalated
Playbook	Metodología versionada.	trigger, objective, steps, escalation
Operator	Acompañante humano.	id, team, capacity
	12. Relaciones críticas y cardinalidades

Origen	Destino	Cardinalidad	Nota
Course	CourseOffering	1:N	Una materia puede dictarse múltiples veces.
CourseOffering	Assessment	1:N	Cada dictado puede tener varias evaluaciones.
Student	CourseEnrollment	1:N	Un estudiante cursa varias instancias.
CourseEnrollment	TopicProgress	1:N	Progreso por tema.
CourseEnrollment	Action	1:N	Acciones de cursado o examen.
Assessment	ExamPreparation	1:N	Un Assessment puede tener preparación por estudiante.
CourseEnrollment	ExamPreparation	1:N	Una materia puede tener varias preparaciones históricas.
ExamPreparation	ProtocolStep	N:N plantilla/instancia	Plantilla versionada; estado por preparación.
Action	Commitment	1:N	Puede renegociarse/reintentarse conservando historial.
Action	Evidence	1:N	Puede requerir una o varias evidencias.
RiskSignal	Intervention	1:N	Una señal puede requerir varias intervenciones.
Intervention	InterventionOutcome	1:1 final	Cada intervención cierra con resultado.
	13. Máquinas de estado

13.1. Commitment

DRAFT -> CONFIRMED -> DUE -> STARTED -> COMPLETED                     -> RENEGOTIATED -> nuevo Commitment                     -> MISSED -> RESCUE_CREATED / CLOSED  Regla: un MISSED no puede editarse retroactivamente hasta parecer cumplido.

13.2. Evidence

EXPECTED -> SUBMITTED -> [UNDER_REVIEW] -> SUFFICIENT -> VALIDATED                               -> INSUFFICIENT -> RESUBMISSION_REQUESTED  Separar lifecycle de Evidence de señales de aprendizaje.

13.3. Action

RECOMMENDED -> ACCEPTED -> COMMITTED -> IN_PROGRESS -> EVIDENCE_PENDING                                               -> COMPLETED                                               -> BLOCKED                                               -> CANCELLED/REPLACED

13.4. ExamPreparation

RECOMMENDED -> ACTIVE -> BUILDING -> READY_BY_PROTOCOL -> EXAM_TAKEN -> CLOSED                          -> NOT_READY / BLOCKED  READY_BY_PROTOCOL = condiciones del protocolo cumplidas; NO equivale a aprobación garantizada. Puede quedar ABANDONED si el alumno decide no seguir; conservar historial.

13.5. RiskSignal

OPEN -> ACKNOWLEDGED -> INTERVENTION_REQUIRED -> RESOLVED                                -> ESCALATED Señal puede expirar si deja de ser relevante; guardar causa histórica.

14. Semántica de progreso

REGLA	No existe un único porcentaje universal de 'materia aprendida'.
	La visualización puede usar porcentajes, colores o barras, pero el dominio debe conservar dimensiones separadas para evitar métricas engañosas.

Dimensión	Pregunta	Fuente típica
Exposure / recorrido	¿El alumno estuvo expuesto al contenido?	clase, lectura, video, recurso.
Practice / producción	¿Produjo trabajo relevante?	ejercicios, resumen, explicación.
Domain / desempeño	¿Puede aplicar/recuperar sin apoyo completo?	prueba sin red, simulacro.
Confidence / percepción	¿Cuánto cree dominarlo?	autorreporte contextual.
Recency	¿Hace cuánto no lo trabaja?	eventos de progreso.
	Decisión v0.2: todas las dimensiones son visibles al alumno en el MVP — Recorrido, Práctica, Dominio, Confianza percibida y Recencia/último avance. La vista general puede sintetizar para no sobrecargar; al abrir una unidad se muestran por separado. El Gantt/timeline representa sobre todo ritmo de cátedra vs. recorrido/práctica, mientras que Modo Examen enfatiza dominio autónomo, simulaciones y brechas.

15. Academic Data y provenance

Todo dato académico que pueda cambiar o ser discutible debe conservar origen, período y confianza. Esto es indispensable para soportar información oficial, comunitaria y capturada en clase.

Campo	Descripción
value	Dato estructurado.
source_type	institution / instructor / student / community / public_web / inference.
source_ref	Documento, URL, mensaje, archivo o entidad de origen.
observed_at	Cuándo se capturó.
valid_from / valid_until	Vigencia conocida.
term / offering	Período y cátedra a la que aplica.
confidence	Confianza operativa.
verification_status	unverified / corroborated / official / disputed.
uploaded_by	Actor/sistema que incorporó el recurso o dato.
rights_status	unknown / allowed / restricted. No define política legal final; preserva la trazabilidad necesaria.
	16. Product Event Model — instrumentación P0

Evento	Uso
StudentRegistered	Cuenta creada.
StudentActivated	Mapa mínimo + primera acción + compromiso/evidencia esperada.
AcademicMapMinimumReached	Existe información suficiente para conducción.
CourseViewed	Materia abierta.
ActionRecommended	Engine emitió acción.
ActionAccepted	Alumno aceptó acción.
CommitmentCreated	Compromiso confirmado.
CommitmentStarted	Confirmación/inferencia de inicio.
CommitmentRenegotiated	Cambio responsable antes del vencimiento.
CommitmentMissed	Incumplimiento.
EvidenceSubmitted	Evidencia recibida.
EvidenceValidated	Evidencia suficiente/validada.
ProgressUpdated	Cambió Topic/CourseProgress.
ExamPreparationRecommended	Modo Examen recomendado.
ExamPreparationActivated	Alumno activó preparación.
ProtocolStepCompleted	Hito cerrado.
SimulationCompleted	Simulación registrada.
RiskSignalCreated	Señal generada.
InterventionStarted	Humano/automático intervino.
InterventionResolved	Outcome registrado.
RescueSucceeded	Retorno después de incumplimiento.
AssessmentTaken	Alumno rindió.
AssessmentOutcomeRecorded	Resultado registrado.
	17. Roles, permisos y visibilidad

Dato/acción	Estudiante	Operador	Institución
Mapa personal	Sí	Sí, asignados	Agregado por defecto
Compromisos	Sí	Sí	Agregado por defecto
Evidencias	Sí	Según rol	No por defecto
Reflexiones personales	Sí	Según necesidad	No por defecto
RiskSignal	Explicación útil	Completo operativo	Agregado; caso individual sólo autorizado y accionable
Intervenciones	Propias relevantes	Completo	Métricas, estado y outcome; detalle sólo autorizado
Bitácora	Sí	Sí	No por defecto; resumen agregado
Outcomes académicos	Sí	Sí si necesario	Según acuerdo y permisos
	REGLA	No asumir que porque la universidad paga puede ver toda la información individual del estudiante.
	17.1. Histórico institucional — decisión v0.2

La institución ve por defecto información agregada por cohorte, materia, evaluación y período: activación, recencia, riesgo, compromisos incumplidos, intervenciones, recuperación, presentismo/aprobación cuando exista y tendencias históricas. Para un caso individual autorizado puede ver estado académico operativo, última actividad, señales de riesgo, intervención y outcome. No se exponen por defecto chats, reflexiones íntimas, notas personales ni evidencia académica cruda.

18. Contratos funcionales de los Engines

Componente	Inputs	Output	Límite
Academic Data Layer	Contexto académico estructurado	Datos + provenance + versiones	No inventa certeza donde no la hay.
Academic Engine	Mapa + StudentModel + riesgo + disponibilidad	ActionRecommendation	No reemplaza aprendizaje ni decide sin permitir corrección.
Risk Engine	Eventos + fechas + progreso + no respuesta	RiskSignal explicable	No score opaco como única salida.
Personal Engine	Historial real del alumno	Preferencias/patrones/recomendaciones	Aprende de conducta más que de tests largos.
Intervention Engine	RiskSignal + contexto + playbooks	Owner + playbook + SLA	Humano donde agrega valor.
Exam Protocol	Assessment + modalidad + estado	Hitos y artefactos requeridos	No genera microacciones académicas específicas.
	18.1. Frontera Plataforma <-> CRM v2

El CRM v2 todavía está en diseño. Este documento congela sólo la frontera de ownership necesaria para que Plataforma pueda avanzar sin depender de una arquitectura del CRM que puede cambiar.

• Plataforma es fuente de verdad de la realidad académica: materias, evaluaciones, progreso, acciones, compromisos académicos, evidencias, ExamPreparation, RiskSignal académico y Bitácora.

• CRM es fuente de verdad de la relación B2B y operación: institución cliente, elegibilidad/padrón, operadores, asignaciones, contratos/cobranza y métricas de negocio/operación.

• No existe base de datos compartida. La integración se realiza mediante contratos HTTP/eventos versionados.

• Necesidades conceptuales: (1) Plataforma consulta elegibilidad; (2) Plataforma publica actividad académica relevante; (3) CRM consulta contexto académico vivo para que el operador intervenga.

• Supabase, región, HMAC, Realtime, capas Controller/Service/Repository y paths de API pertenecen al Architecture Spec, no quedan congelados aquí.

19. Corte recomendado del MVP para estos flujos

19.1. P0 — construir primero

Hoy / Autogestión.

Materia > Cursado con progreso por unidades y última actividad.

Próxima Acción.

Compromiso.

Evidence submission + validación básica.

Bitácora de Avance generada desde eventos.

Assessment + activación de ExamPreparation.

Exam Protocol básico configurable, con pasos y artefactos; todos los artefactos formales se revisan humanamente en el MVP.

Protocolos P0: práctico y teórico escrito. El software soporta versión/modalidad; oral y demás variantes quedan P1.

RiskSignal rule-based.

Cola operativa + contexto de estudiante + registrar intervención/outcome.

Product Event Model.

Academic provenance mínimo.

19.2. P1 — inmediatamente después del golden path

Timeline/Gantt refinado de cátedra vs. alumno.

Integración Google Calendar para blindar capacidad.

Captura de clases/cronograma más rica.

Mapa de Errores estructurado.

Simulaciones configurables.

Mi Manual Achieve.

Formación contextual conectada a acciones/protocolo.

Dashboard institucional mínimo.

19.3. No bloquear por ahora

Scraper universal de Córdoba.

Predicción ML de riesgo.

Corrección IA universal.

Marketplace de apuntes.

Aplicación móvil nativa.

Calendario completo propio.

Gamificación compleja.

Protocolo perfecto para todas las carreras/modalidades.

20. Criterios de aceptación del golden path

Área	Criterio
Alumno / Hoy	En <10 s entiende estado, próxima acción, evidencia y siguiente evento.
Materia / Cursado	Distingue ritmo confirmado de cátedra, progreso personal por dimensiones y brecha; nunca inventa ritmo cuando falta información.
Action	Tiene verbo, alcance, estimación, recursos y criterio de cierre.
Commitment	Queda registrado con hora y no puede maquillarse retroactivamente.
Evidence	Puede recibirse y cerrarse con estado suficiente/insuficiente.
Progress	Validar evidencia produce cambio visible y entrada de Bitácora.
ExamActivation	El alumno entiende por qué se activa y qué contrato acepta.
Protocol	Cada paso configurable tiene objetivo, explicación, entregable, criterio de cierre y modalidad/versión; el contenido definitivo lo valida psicopedagogía.
Engine/Protocol	Nunca se duplican responsabilidades: protocolo define hito; Engine define trabajo concreto.
Operator	Puede identificar y actuar sobre un caso prioritario sin releer chats.
Risk	Toda señal explica causa y puede cerrar en outcome.
Analytics	Eventos centrales quedan instrumentados desde la primera cohorte.
Captura de clase	Permite registrar prioridad, fechas, tareas y notas contextuales en pocos pasos y conserva fuente/contexto.
Readiness	READY_BY_PROTOCOL se explica como cumplimiento del protocolo, nunca como probabilidad o garantía de aprobación.
	21. Cierre de decisiones antes de wireframe high-fi / SQL

DECIDIDO — Progreso visible: Recorrido, Práctica, Dominio, Confianza percibida y Recencia. La UI puede sintetizar; el dato permanece separado.

DECIDIDO — Ritmo de cátedra: ClassSession reales/confirmadas y temas vistos. No usar “una unidad por clase”. Sin información confiable, mostrar último ritmo confirmado o desconocido.

DECIDIDO — Captura de clase P0: prioridad de temas, cambio de fechas, tareas/entregas y notas contextuales con mínima fricción.

PENDIENTE PEDAGÓGICO — El software soportará CORE + variantes versionadas; qué pasos exactos son universales y cuáles específicos se define con psicopedagogía.

DECIDIDO — Modalidades P0: práctico y teórico escrito. Oral y otras modalidades quedan P1.

DECIDIDO — Todos los entregables formales del Exam Protocol requieren revisión humana en el MVP. No toda microevidencia del Academic Engine requiere corrección humana.

DECIDIDO CON UMBRAL PENDIENTE — PreparationReadiness usa NOT_READY / BUILDING / READY_BY_PROTOCOL. Los criterios generales están definidos; umbrales pedagógicos exactos se fijan con psicopedagogía.

DECIDIDO — Bitácora: timeline privada + resumen acumulado + hitos + filtros. Sin red social, likes ni comparación entre alumnos.

DECIDIDO — Institución: histórico agregado por defecto; detalle individual autorizado centrado en estado, riesgo, intervención y outcome, no conversaciones/evidencia cruda.

DECIDIDO — CRM/Plataforma: ownership separado, sin DB compartida y contratos versionados. Los detalles tecnológicos se fijan en Architecture Spec y pueden evolucionar con CRM v2.

DECIDIDO — Recursos externos: no bloquean MVP; guardar provenance + uploaded_by + rights_status. Política jurídica posterior con abogados.

21.1. Únicos puntos realmente abiertos

A esta altura no queda una decisión estructural importante que impida empezar wireframes high-fi, dominio técnico o SQL del núcleo. Quedan dos configuraciones pedagógicas deliberadamente abiertas:

• Secuencia, contenido, entregables y criterio de cierre definitivo del Exam Protocol para práctico y teórico escrito.

• Umbrales concretos que permiten pasar de BUILDING a READY_BY_PROTOCOL.

Ambas se empiezan a definir con psicopedagogía y deben entrar como configuración/versiones del protocolo, no como cambios de arquitectura. Por lo tanto, NO bloquean el inicio del desarrollo del golden path.

22. Handoff a diseño y desarrollo

22.1. Orden de wireframes

 WF-S01 Hoy / Autogestión.

 WF-S02 Materia / Cursado.

 WF-S05 Próxima Acción.

 WF-S06 Compromiso.

 WF-S07 Evidencia.

 WF-S08 Progreso actualizado.

 WF-S04 Bitácora.

 WF-S09 Activación Examen.

 WF-S10 Overview Examen.

 WF-S11 Paso de Protocolo.

 WF-O01 Cola operador.

 WF-O02 Contexto alumno.

 WF-O03 Intervención.

 WF-O04 Evidencia.

 WF-I01 Institución mínimo.

22.2. Orden de especificación técnica

 Congelar entidades y máquinas de estado P0.

 Definir IDs, ownership y tenancy.

 Definir API/eventos para Action, Commitment, Evidence, Risk e Intervention.

 Definir CourseEnrollment y ExamPreparation.

 Definir provenance para Academic Data.

 Definir permisos por rol.

 Definir sincronización WhatsApp <-> backend.

 Recién entonces pasar a esquema SQL y migraciones.

Definir contrato conceptual Plataforma<->CRM como interfaces versionadas; detalles técnicos se cierran en Architecture Spec.

Modelar ExamProtocol/ProtocolVersion/ProtocolStep como configuración para permitir cambios de psicopedagogía sin migrar el dominio central.

22.3. Regla de cambio

Si durante wireframes aparece una nueva feature, primero debe demostrarse qué decisión, estado o loop del spec resuelve. No se agrega navegación para acomodar ideas que todavía no tienen función.

22.4. Estado de preparación para empezar

STATUS: READY TO DESIGN / READY TO SPECIFY CORE DATA MODEL. Las decisiones de producto que afectan navegación, ownership, estados, flujos y entidades centrales están suficientemente cerradas para comenzar. No se debe esperar al cierre pedagógico del lunes para diseñar Hoy, Cursado, Action, Commitment, Evidence, Bitácora, Operator Queue ni la estructura configurable de ExamPreparation.

23. Definición final de la experiencia v0.2

Achieve acompaña una materia durante todo el semestre. En Cursado mantiene visible la distancia entre lo que la cátedra avanza y lo que el estudiante realmente construye, genera próximas acciones, compromisos y evidencias y conserva una Bitácora de trabajo real. Cuando aparece una evaluación, el alumno activa una Preparación de Examen que se monta sobre ese historial: el protocolo define los hitos de preparación y el Academic Engine decide el trabajo académico concreto necesario entre ellos. El estudiante no tiene que inventar el proceso, pero sí ejecutarlo; el sistema mide, adapta y un acompañante humano interviene cuando puede cambiar el resultado.

Este documento debe ser revisado junto al Product Spec v0.5 FINAL. Si ambos entran en conflicto, la visión/principios pertenecen al Product Spec y los flujos/estados pertenecen a este Design Spec v0.2 FINAL hasta que una decisión versionada resuelva la contradicción.

ACHIEVE · User Flow + Wireframes + Data Model v0.2 FINAL · Agosto 2026

***

PARTE III — GOLDEN PATH UNIFICADO (recorrido canónico end-to-end)

ACHIEVE — GOLDEN PATH UNIFICADO

Versión: v1.0  
Rol documental: owner canónico del recorrido integrado y del registro de CTAs  


1. Alcance y autoridad

Este documento promovido conserva UX01–UX09 y la corrección auditada de P01-AUD-P1-01…08. Aplica las fuentes FINAL, las specs APPROVED, CR-UX09-04 aprobado y promovido, y C01 v1.0 aprobado y promovido. EP01 sigue provisional y reversible. Las fuentes históricas no autorizadas y los propios downstream no tienen autoridad.

Cobertura canónica y exhaustiva: UX01–UX09. Mapeo obligatorio: WF-S10 → UX08 y WF-S11 → UX09.

La matriz normativa C01 vive exclusivamente en ACHIEVE_CONTRATOS_MINIMOS_PROTOTIPO_v1.0_APPROVED.md §7. El crosswalk backlog vive en ACHIEVE_BACKLOG_PROTOTIPO_v1.0_APPROVED.md; los escenarios, en ACHIEVE_ESCENARIOS_PRUEBA_v1.0_APPROVED.md.

2. Invariantes del recorrido

TodayView y UX06 sólo proyectan; ADE prioriza y emite ActionRecommendation.
Action aceptada no es Commitment; Commitment completado no es Evidence.
SUBMITTED no es suficiente ni revisado; UNDER_REVIEW exige revisión real creada.
VALIDATED no produce automáticamente Progress ni completa ProtocolStep.
ProtocolStep, Action, Commitment, Evidence, Reflection y Progress permanecen separados.
Intervention y human_assignment son referencias distintas; ninguna equivale a reviewer.
No existe readiness global ni porcentaje universal.
La UI relee resultados autoritativos, no rankea.

3. Recorrido principal

A. Hoy y Materia

UX01 lee TodayView y muestra sólo estados reales o un empty honesto.
CTA-001 abre UX02 sin mutación.
UX02 muestra Course y contexto disponible; academic_context_blocker puede impedir recomendación, no navegación segura.
CTA-002 abre UX03 con una recomendación primaria ya emitida por ADE.

B. Acción y compromiso

UX03 explica la recomendación. CTA-003 solicita aceptar Action.
Sólo ActionAccepted confirmado permite abrir/continuar el draft de UX04.
CTA-004 solicita crear Commitment. La confirmación autoritativa separa CommitmentCreated de ActionAccepted.
CTA-005 inicia cuando el lifecycle informa que corresponde; abrir/timer no inicia por sí mismo.
CTA-017 (Renegociar) aparece sólo para un Commitment CONFIRMED o DUE cuya elegibilidad autoritativa siga vigente; abre UX04 con el original no editable y no muta dominio.
CTA-018 (Confirmar renegociación) revalida elegibilidad y solicita al owner preservar el original como RENEGOTIATED, crear/devolver un nuevo Commitment CONFIRMED para el mismo action_id y emitir CommitmentRenegotiated. Ante error se reconcilian old/new y no se presume éxito ni duplicación.
Un Commitment STARTED o MISSED no ofrece renegociación retroactiva; continúa o entra en la rama de rescate correspondiente.
CTA-006 registra cierre conductual del Commitment; no crea Evidence.

C. Evidence, Reflection y revisión

UX05 lee contenido, criterio, tipos admitidos y configuración de Reflection.
Reflection OPTIONAL puede omitirse; Reflection REQUIRED debe ser válida sólo para el submit dependiente. CTA-016 crea/actualiza el objeto separado.
CTA-007 solicita el submit. La confirmación produce Evidence SUBMITTED; no suficiencia.
Si el método es no humano, el owner puede devolver resultado. Si es humano, la configuración no alcanza: sólo una review_instance_ref real, consistente y autorizada permite UNDER_REVIEW.
CTA-008 solicita una nueva entrega cuando existe RESUBMISSION_REQUESTED, preservando la Evidence anterior.

D. Progress, Bitácora y replanificación

UX06 muestra dimensiones/entradas autoritativas. Evidence VALIDATED sin ProgressUpdated usa copy neutral.
Un hecho autoritativo nuevo de Progress/Bitácora habilita o solicita re-evaluación por ADE. No se crea un evento productivo nuevo en P01.
ADE puede devolver: nueva ActionRecommendation, ausencia honesta, error/reintento o resultado todavía no disponible.
UX06 relee y proyecta. CTA-009 abre detalle; CTA-010 vuelve a Hoy. Ninguna UI prioriza ni genera Action.

E. Incumplimiento y rescate

Sólo el owner declara Commitment MISSED/RESCUE_REQUIRED.
CTA-015 solicita rescate; el original se preserva y el éxito se atribuye al objeto de rescate.

4. Modo Examen conectado

UX07 parte de Assessment existente y elegible; CTA-011 solicita activar ExamPreparation.
Activar produce ACTIVE; no crea Action, protocolo completo, Evidence, Progress ni readiness.
WF-S10 → UX08: Overview es proyección y aplica precedencia operacional.
CTA-012 abre el paso actual sólo si el owner provee una instancia/versionado y un paso inequívoco.
WF-S11 → UX09: UX09 muestra contenido/Resource configurado; la UI no elige el paso.
CTA-013 deriva a la UX canónica de Action/Commitment cuando ADE ya emitió una recomendación.
ProtocolStep no crea Action, Commitment, Evidence ni Progress. Evidence validada no lo completa automáticamente; ProtocolStepCompleted tampoco implica Progress.
El regreso a UX08, UX02 o UX01 no abandona ExamPreparation.

5. Registro canónico de CTAs — owner único

Cada fila contiene los siete campos de contrato observable y el octavo campo de trazabilidad. Ningún otro artifact mantiene una copia normativa de este registro.

CTA	Origen	Condición de aparición	Acción solicitada	Destino	Resultado autoritativo	Fallback	Estado de error	Escenario de aceptación
CTA-001	UX01 Hoy	Course visible	abrir materia	UX02	ninguno; navegación	conservar Hoy	Course no disponible: empty/reintento	SC-DAY-01
CTA-002	UX01/UX02	ActionRecommendation primaria vigente	abrir próxima acción	UX03	ninguno	permanecer en origen	recomendación vencida: releer	SC-DAY-02
CTA-003	UX03	Action RECOMMENDED vigente	aceptar Action	draft UX04	ActionAccepted / Action ACCEPTED	conservar recomendación	reconciliar; no duplicar	SC-DAY-02, SC-ERR-01
CTA-004	UX04 draft	Action ACCEPTED; datos válidos	confirmar Commitment	UX01/confirmación	CommitmentCreated; Commitment CONFIRMED; Action COMMITTED	mantener draft	reconciliar identidad	SC-DAY-03, SC-ERR-01
CTA-005	UX01/UX04	Commitment iniciable según owner	empezar	ejecución	CommitmentStarted; Commitment STARTED; Action IN_PROGRESS	conservar estado	relectura	SC-DAY-03
CTA-006	ejecución	cierre conductual permitido	finalizar ejecución	UX05/estado de cierre	Commitment COMPLETED; Action normalmente EVIDENCE_PENDING	mantener ejecución	error sin submit automático	SC-DAY-03
CTA-007	UX05	contenido/tipo válidos y Reflection requerida válida o no requerida	enviar Evidence	UX05 estado	EvidenceSubmitted; SUBMITTED	conservar draft local/seguro	reconciliar; no duplicar	SC-EV-01, SC-REF-02, SC-ERR-02
CTA-008	UX05	RESUBMISSION_REQUESTED	reenviar corrección	UX05	nueva entrega confirmada, original preservada	conservar anterior	relectura	SC-EV-03
CTA-009	UX01/02/05/08/09	Progress/Bitácora disponible	ver progreso	UX06	ninguno; lectura	volver al origen	mostrar estado no disponible	SC-PROG-01
CTA-010	UX06/UX08/UX09	navegación disponible	volver a Hoy	UX01	ninguno; no abandona ExamPreparation	volver a Materia	navegación segura	SC-DAY-05, SC-EX-05
CTA-011	UX07	Assessment elegible y confirmación explícita	activar Modo Examen	UX08	ExamPreparationActivated; ACTIVE	permanecer UX07	relectura sin doble activación	SC-EX-01
CTA-012	UX08 (WF-S10)	paso actual autoritativo, sin gate ni objeto de mayor precedencia	abrir paso actual	UX09 (WF-S11)	ninguno; navegación	Overview degradado/UX02	paso inconsistente: no abrir	SC-EX-02, SC-EX-03
CTA-013	UX08/UX09	recomendación primaria real emitida por ADE	continuar con acción	UX03	ninguno en origen	volver a Overview	recomendación vencida: releer	SC-EX-04
CTA-014	cualquier error recuperable	existe operación idempotente/relectura	reintentar	misma UX o resultado reconciliado	sólo el owner confirma resultado	conservar último estado conocido	no presumir éxito	SC-ERR-01…03, SC-ADE-03
CTA-015	UX01/UX04	Commitment MISSED/RESCUE_REQUIRED autoritativo	iniciar rescate	UX04/rescate	rescate creado/confirmado; original preservado	mantener original visible	fallo no altera original	SC-DAY-04
CTA-016	UX05/UX09	Reflection configurada y visible	guardar/confirmar Reflection	misma UX/submit habilitado si aplica	Reflection separada válida	omitir si opcional; corregir si requerida	inválida: no crear/confirmar	SC-REF-01…03
CTA-017	UX01/UX04	Commitment CONFIRMED o DUE y elegibilidad autoritativa vigente	Renegociar	UX04, flujo de renegociación	ninguno al abrir; original visible y no editable	mantener Commitment vigente	elegibilidad ausente/inconsistente: ocultar o no habilitar; releer owner	SC-REN-01, SC-REN-02
CTA-018	UX04, flujo de renegociación	elegibilidad revalidada; nueva fecha, hora y capacidad válidas; misma Action	Confirmar renegociación	UX01/UX04 confirmación	original RENEGOTIATED; nuevo Commitment CONFIRMED para el mismo action_id; CommitmentRenegotiated; old/new preservados	conservar propuesta no autoritativa y Commitment original sin cambios	respuesta incierta/incompatible: reconciliar old/new; no duplicar ni presumir mutación	SC-REN-01, SC-REN-02
	6. Contratos de fallback transversales

ausencia autoritativa: empty honesto y retorno seguro;
dato vencido/inconsistente: no actuar, releer y reconciliar;
respuesta perdida: no duplicar; consultar identidad/estado existente;
configuración humana sin instancia real: SUBMITTED, nunca UNDER_REVIEW;
assignment ausente/vencido/no autorizado: omisión y continuidad;
renegociación no elegible o incierta: mantener el Commitment original sin cambios, no ofrecer confirmación retroactiva y releer al owner;
confirmación de renegociación con respuesta perdida/incompatible: reconciliar relación old/new antes de reintentar; nunca duplicar Commitments;
ADE pending/error: no inventar recomendación; mostrar reintento o aún no disponible;
falta de contrato C01: fixture sintético, omisión o bloqueo localizado y reversible.

7. Separación de gates

Dentro de este candidato sólo se autoriza QA interna con fixtures sintéticos. Validación de comprensión, UX/research, psicopedagógica por profesional real, implementación productiva y piloto institucional son gates futuros separados. No se autorizan pruebas con estudiantes. Completar QA no habilita automáticamente high-fidelity.

8. Estado de dependencias

C01: matriz owner en Contratos mínimos, 51/51 OPEN.
C01-047…049: omitidos; cero P2 implementados.
EP01: CANDIDATE — PROVISIONAL — HUMAN CONFIRMATION PENDING — NOT APPROVED — NOT PROMOTED.
HUMAN-P0-01…08: abiertos; owner downstream en Configuración provisional.
C01-045 — OPEN — PRIMARY WS7 — BEFORE FORMAL TECHNICAL HANDOFF.
P01 no es handoff técnico formal y no inicia WS7.


***

PARTE IV — CONTRATOS MÍNIMOS DEL PROTOTIPO (reglas de negocio, estados, fixtures)

ACHIEVE — CONTRATOS MÍNIMOS DEL PROTOTIPO

Versión: v1.0  
Rol documental: owner canónico de objetos, relaciones, estados, fixtures y matriz C01 del baseline P01  


1. Autoridad y alcance

Este documento promovido conserva el contrato mínimo auditado del prototipo sin rediseñar UX01–UX09, cerrar contratos, iniciar workstreams ni describir arquitectura. La precedencia aplicada es:

ACHIEVE_MVP_USUARIO_PRODUCT_SPEC_v0.5_FINAL.docx y ACHIEVE_USER_FLOW_WIREFRAMES_DATA_MODEL_v0.2_FINAL.docx;
specs v1.0_APPROVED y ACHIEVE_CR_UX09_04_REVISION_HUMANA_SELECTIVA_v1.0_APPROVED.md, aprobado y promovido;
los cuatro artifacts C01 v1.0 aprobados y promovidos;
EP01 exclusivamente provisional, reversible, no aprobado y no promovido;
auditorías como evidencia;
candidatos downstream como objetos de corrección.

Las fuentes históricas no autorizadas, copias duplicadas y candidatos C01 anteriores a la promoción no son autoridad.

2. Invariantes

UX01–UX09 permanecen congelados y constituyen la cobertura exhaustiva.
TodayView es una proyección. La prioridad y ActionRecommendation pertenecen al Academic Decision Engine (ADE).
Action, Commitment, Evidence, Reflection, Progress y ProtocolStep conservan identidad separada.
Action ACCEPTED no equivale a Commitment; Commitment COMPLETED no implica Evidence.
Evidence SUBMITTED no implica suficiencia ni UNDER_REVIEW.
UNDER_REVIEW exige una revisión real creada y trazable.
VALIDATED no implica ProgressUpdated; Evidence validada no completa ProtocolStep.
ProtocolStepCompleted no implica Progress.
No existe readiness global.
Un fixture, una omisión o un fallback jamás cierra C01 ni HUMAN-P0.

3. Objetos y relaciones observables

ID	Objeto o referencia	Owner funcional/configuración	Relación mínima	Opcionalidad y fallback	C01
CO-01	TodayView	owner de proyección	lee Course, ActionRecommendation, Commitment, señales y estados reales	si falta un dato, se omite; no prioriza ni muta	003, 006, 021
CO-02	Course/Materia	Product Data	contexto para ActionRecommendation y actividad académica	contexto insuficiente produce estado honesto	001–004, 050
CO-03	ActionRecommendation / Action	ADE / lifecycle de Action	recomendación primaria puede originar Action; aceptar no crea Commitment	ausencia se muestra sin recomendación	006–009
CO-04	Commitment	owner de Commitment	referencia Action aceptada; preserva renegociación/rescate	error conserva original; no crea Evidence	010–011
CO-05	Evidence	Evidence System	referencia Action/Commitment/ProtocolArtifact cuando existan	ausencia bloquea sólo la operación dependiente	012–015
CO-06	Reflection	Product/Evidence configuration	objeto separado de Evidence; puede relacionarse con Evidence, ProtocolStep o Bitácora por referencia declarada	OPTIONAL: omitir no bloquea; REQUIRED: ausencia/invalidación impide sólo el submit dependiente y muestra fallback; nunca se infiere	051
CO-07	privacidad de Evidence/Reflection	Product Privacy	visibilidad, finalidad y retención separadas de la obligatoriedad	si no hay autorización, omitir contenido y bloquear acceso	017
CO-08	referencia sintética de revisión real	Validation/Security	referencia observable review_instance_ref, no entidad productiva Review; identifica creación real, Evidence, R1/criterio, vigencia y estado de consistencia	ausente/config-only: Evidence sigue SUBMITTED; inconsistente: error y reconciliación	016
CO-09	Intervention	Product Operations	intervención operacional separada de Evidence y assignment	no se infiere desde riesgo, review ni assignment	022
CO-10	human_assignment	CRM/Operations	referencia operacional separada de Intervention y de revisión R1; contiene owner, vigencia, finalidad y visibilidad autorizada	ausencia, vencimiento o falta de autorización: omitir; no bloquear loop ni fingir atención	039
CO-11	Progress / Bitácora	Progress owner	dimensiones y entradas sólo por hecho autoritativo	sin cambio confirmado, copy neutral	018–020
CO-12	solicitud/habilitación de re-evaluación ADE	ADE	un hecho autoritativo nuevo de Progress/Bitácora habilita o solicita re-evaluación; UX06 no prioriza ni genera Action	nueva recomendación, ausencia honesta, error/reintento o aún no disponible	006, 018, 020
CO-13	ExamPreparation	owner de ExamPreparation	Assessment existente y activación explícita	fallo de protocolo no revierte ACTIVE	005, 024–025
CO-14	ExamProtocol / ProtocolStep	Exam Protocol owner	instancia/versionado y un paso actual autoritativo; UI no elige	omitir o volver a Overview si no hay paso utilizable	026–029
CO-15	permisos y visibilidad	Security/Privacy	mínimo acceso según finalidad declarada	denegar/omitir y mostrar fallback seguro	030
CO-16	error e idempotencia visual	owner de cada mutación	relectura/reconciliación preserva identidad y evita duplicados	no se presume éxito	009, 015, 023, 040
CO-18	separación documental de gates	Product Owner / autoridad de cada gate futuro	cada capa exige autorización, entradas, responsables y evidencia propios	sólo QA interna inmediata; nunca promoción automática	031–038, 041–046
	3.1. Contrato positivo y negativo de Reflection

OPTIONAL: la UI puede ofrecer CTA-016; continuar sin Reflection es válido. El objeto sólo existe tras confirmación autoritativa.
REQUIRED: la configuración versionada identifica ámbito, criterio mínimo y destino. Una Reflection válida es precondición del submit específicamente configurado, no de todo el recorrido.
ausente o inválida: no se crea Reflection, no se altera Evidence ni Progress; se explica el campo y se permite corregir o volver.
privacidad: C01-017 gobierna acceso/retención; C01-051 gobierna configuración y obligatoriedad. Ninguno sustituye al otro.

3.2. human_assignment

La referencia operacional mínima contiene: assignment_ref, owner CRM/Operations, valid_from, valid_until o vigencia equivalente, finalidad, contexto, sujetos visibles autorizados y estado de elegibilidad. No es Intervention, reviewer, cola ni promesa de SLA. Si falta, vence o no está autorizada, la UI la omite y mantiene continuidad no dependiente. C01-039 continúa OPEN.

3.3. Revisión real

La configuración de método HUMAN no crea una revisión. Sólo una creación real observable, representada en P01 por review_instance_ref sintética consistente con Evidence, R1 autorizado, criterio, finalidad y vigencia, permite mostrar UNDER_REVIEW. La referencia demuestra el hecho para QA; no inventa una entidad productiva Review. Si no existe o es inconsistente, Evidence permanece SUBMITTED y se aplica reconciliación. C01-016 continúa OPEN.

4. Estados y transiciones mínimas

Objeto	Estados/condiciones relevantes	Prohibición
Action	RECOMMENDED, ACCEPTED, COMMITTED, IN_PROGRESS, EVIDENCE_PENDING	aceptar no crea Commitment
Commitment	CONFIRMED, DUE, STARTED, COMPLETED, RENEGOTIATED, MISSED; RESCUE_REQUIRED es condición derivada	reloj/UI no declara MISSED; renegociar preserva el original y materializa un nuevo Commitment
Evidence	EXPECTED, SUBMITTED, UNDER_REVIEW, SUFFICIENT, INSUFFICIENT, RESUBMISSION_REQUESTED, VALIDATED	SUBMITTED no implica suficiencia; UNDER_REVIEW exige CO-08 positivo
Reflection	inexistente, draft local no autoritativo, válida confirmada, inválida	no se fusiona con Evidence ni se usa para inferir Progress
Progress	dimensiones autoritativas o ausencia/no-cambio	no hay porcentaje/readiness universal
ExamPreparation	ELIGIBLE, ACTIVE, cierre por Assessment según fuente	activar no crea plan, Action ni protocolo completo
ProtocolStep	actual provisto; estados definidos por owner	abrir/validar Evidence no lo completa automáticamente
	4.1. Rama observable de renegociación de Commitment

elegible: el owner informa un Commitment CONFIRMED o DUE renegociable; CTA-017 abre el flujo con el original no editable;
confirmación válida: CTA-018 conserva la misma Action, solicita nueva fecha/hora/capacidad y sólo el owner puede marcar el original RENEGOTIATED, materializar el nuevo Commitment CONFIRMED y emitir CommitmentRenegotiated;
no elegible: STARTED, MISSED o elegibilidad denegada no permiten editar el original; se conserva el estado y se ofrece sólo continuidad, bloqueo o rescate según la fuente aprobada;
error o respuesta incierta: original y propuesta no cambian hasta reconciliar old/new; no se presume éxito ni se crea un duplicado;
SC-DAY-04 continúa reservado al rescate y no demuestra renegociación.

5. Handoff Progress/Bitácora → ADE

Progress owner registra o expone un hecho autoritativo nuevo y, si corresponde, su entrada de Bitácora.
Ese hecho habilita o solicita re-evaluación al ADE por un mecanismo no especificado aquí; P01 no inventa evento productivo.
ADE puede devolver: nueva ActionRecommendation; ausencia honesta; error/reintento; resultado todavía no disponible.
UX06 y las demás superficies sólo releen/proyectan el resultado. No rankean, priorizan ni generan Action.
El prototipo demuestra las cuatro ramas con FX-ADE-NEW, FX-ADE-NONE, FX-ADE-ERROR y FX-ADE-PENDING.

6. Catálogo canónico de fixtures

Fixture	Contenido sintético	Uso	Fallback / límite
FX-DAY-BASE	Course + recomendación + Action + disponibilidad	loop diario	no cierra 001–011/050
FX-MISSED	Commitment original MISSED + alternativa de rescate	rescate	preserva original
FX-REN-ELIGIBLE	Commitment original CONFIRMED o DUE, elegibilidad autoritativa vigente, misma Action y nueva fecha/hora/capacidad válidas	renegociación positiva	original no editable; sólo owner confirma old/new y CommitmentRenegotiated
FX-REN-INELIGIBLE	Commitment STARTED o MISSED, o elegibilidad denegada/inconsistente	renegociación negativa	no ofrecer confirmación; original intacto; continuar/bloqueo o rescate
FX-EVD-BASE	Evidence esperada y criterio sintético	submit/validación	no cierra 012–015
FX-REFL-OPT	Reflection OPTIONAL versionada	rama opcional	omisión válida
FX-REFL-REQ	Reflection REQUIRED versionada	rama obligatoria	ausencia bloquea sólo submit dependiente
FX-REFL-BAD	Reflection ausente/inválida	error de Reflection	corregir/volver
FX-ASG-VALID	assignment vigente, autorizado y con finalidad	visibilidad operacional	no equivale a Intervention/review
FX-ASG-NONE	assignment ausente	omisión	continuidad
FX-ASG-BAD	assignment vencido/no autorizado	control negativo	omitir y registrar error interno
FX-REV-CREATED	review_instance_ref consistente y real para QA	UNDER_REVIEW	referencia sintética, no entidad productiva
FX-REV-CONFIG	método humano sin instancia	control negativo	permanece SUBMITTED
FX-REV-BAD	referencia inconsistente	error/reconciliación	permanece SUBMITTED
FX-ADE-NEW	ADE devuelve nueva recomendación	replanificación	UI sólo relee
FX-ADE-NONE	ADE confirma ausencia	empty honesto	volver a Materia/Hoy
FX-ADE-ERROR	re-evaluación falla	error/reintento	no inventar recomendación
FX-ADE-PENDING	resultado aún no disponible	espera honesta	relectura posterior
FX-EXAM-BASE	Assessment + ExamPreparation + protocolo/paso actual	UX07–UX09	no cierra 024–029
FX-ERROR-IDEM	respuesta perdida/duplicada	idempotencia visual	relectura/reconciliación
	7. Matriz canónica C01 — owner único

Esta sección es la única copia normativa downstream de la matriz C01 para P01. Los otros siete artifacts sólo la referencian. Abreviaturas: CM este documento; GP Golden Path; CFG Configuración provisional; BL Backlog; SC Escenarios. Todos los estados son OPEN. La columna Gate C01 v1.0 reproduce literalmente ACHIEVE_C01_PENDING_CONTRACT_REGISTER_v1.0_APPROVED.md §2; ninguna capa de prueba P01 sustituye ese gate.

ID	Contrato pendiente	Uso/dependencia P01	Fixture, omisión o fallback reversible	Artifact responsable	Backlog	Escenario	Gate C01 v1.0	Sev.	Estado
C01-001	Identidad, tenancy y esquema ADL	contexto de objetos/proyecciones	FX-DAY-BASE; identidad sintética	CM	BL-FUT-01	SC-GOV-01	I	P1	OPEN
C01-002	Provenance, verificación, vigencia y derechos	fuente/vigencia visible	omitir dato no verificado	CM	BL-FUT-02	SC-GOV-01	I	P1	OPEN
C01-003	Relaciones y lifecycles académicos	Course/Today/Progress	FX-DAY-BASE	CM	BL-FUT-03	SC-DAY-01	I	P1	OPEN
C01-004	class_event_record	actividad autoritativa	fixture sin forma técnica	CM	BL-FUT-04	SC-ADE-01	I	P1	OPEN
C01-005	Assessment multifuente y lifecycle	activación examen	FX-EXAM-BASE; dedupe sintético	CM	BL-FUT-05	SC-EX-01	I	P1	OPEN
C01-006	ADE y ActionRecommendation	prioridad y re-evaluación	FX-DAY-BASE, FX-ADE-*	GP	BL-01	SC-ADE-01…04	I	P1	OPEN
C01-007	Action identidad/lifecycle/contexto	UX03/UX04	FX-DAY-BASE	CM	BL-02	SC-DAY-02	I	P1	OPEN
C01-008	Contenido ejecutable de Action/Resource	ejecución/evidence	contenido sintético	CM	BL-03	SC-DAY-03	H	P1	OPEN
C01-009	Mutaciones de Action e idempotencia	aceptar/confirmar	FX-ERROR-IDEM	CM	BL-04	SC-ERR-01	I	P1	OPEN
C01-010	Commitment temporal, renegociación y rescate	UX04	FX-DAY-BASE, FX-MISSED, FX-REN-ELIGIBLE/INELIGIBLE	GP	BL-05/23	SC-DAY-04, SC-REN-01/02	I	P1	OPEN
C01-011	Coordinación Action–Commitment	aceptación/confirmación separadas	reconciliación	CM	BL-06	SC-DAY-02	I	P1	OPEN
C01-012	Evidence content y pre-submission	UX05	FX-EVD-BASE	CM	BL-07	SC-EV-01	I	P1	OPEN
C01-013	Criterios, validación y señales	suficiencia/validación	criterio sintético	CM	BL-08	SC-EV-02	I	P1	OPEN
C01-014	Relaciones/agregación/tardanza Evidence	vínculo con Commitment/Protocol	referencias sintéticas	CM	BL-09	SC-EV-01	I	P1	OPEN
C01-015	Idempotencia y normalización Evidence	submit/reintento	FX-ERROR-IDEM	CM	BL-10	SC-ERR-02	I	P1	OPEN
C01-016	Instancia técnica de revisión R1	UNDER_REVIEW factual	FX-REV-CREATED/CONFIG/BAD	CM	BL-11	SC-REV-01…03	I	P1	OPEN
C01-017	Privacidad/retención Evidence/Reflection	acceso y visibilidad	omisión/denegación	CM	BL-FUT-06	SC-PRIV-01	I	P1	OPEN
C01-018	ProgressUpdated payload/causalidad	UX06/re-evaluación	FX-ADE-*	CM	BL-12	SC-ADE-01…04	I	P1	OPEN
C01-019	TopicProgress/resumen materia	dimensiones/proyección	omitir resumen no autoritativo	CM	BL-13	SC-PROG-01	H	P1	OPEN
C01-020	ProgressEntry/Bitácora bundle	historia/re-evaluación	entrada sintética	CM	BL-14	SC-PROG-01	I	P1	OPEN
C01-021	Risk Engine y sujeto de RiskSignal	señales leídas por Today/CRM	omitir señal no disponible	CM	BL-FUT-07	SC-GOV-01	I	P1	OPEN
C01-022	Risk–Intervention–Outcome	Intervention separada	omisión; no inferir	CM	BL-FUT-08	SC-ASG-01	I	P1	OPEN
C01-023	Product Event Model	evidencia de mutaciones	no crear evento nuevo	CM	BL-FUT-09	SC-ERR-01	I	P1	OPEN
C01-024	Recomendación/activación temporal examen	UX07	FX-EXAM-BASE	GP	BL-15	SC-EX-01	I	P1	OPEN
C01-025	ExamPreparation ownership/lifecycle	UX07–UX09	FX-EXAM-BASE	CM	BL-16	SC-EX-01	I	P1	OPEN
C01-026	ExamProtocol instance/estado por paso	Overview/paso actual	FX-EXAM-BASE	CM	BL-17	SC-EX-02	I	P1	OPEN
C01-027	Contenido/Resource versionado del paso	UX09	contenido sintético/omisión	CFG	BL-18	SC-EX-03	I	P1	OPEN
C01-028	Completion, gates y ProtocolStepCompleted	continuidad	no inferir completion	CM	BL-19	SC-EX-04	I	P1	OPEN
C01-029	Readiness scoped de ExamPreparation	no readiness global	omitir score/readiness	CM	BL-FUT-10	SC-EX-05	I	P1	OPEN
C01-030	Autorización/permisos/privacidad institucional	todas las superficies	denegar/omitir	CM	BL-FUT-11	SC-PRIV-01	I	P1	OPEN
C01-031	HUMAN-P0-01 baseline granular	protocolo	PROVISIONAL-HUMAN-P0-01 v0.1	CFG	BL-H-01	SC-H-01	I	P1	OPEN
C01-032	HUMAN-P0-02 dimensiones/proyección	Progress/protocolo	PROVISIONAL-HUMAN-P0-02 v0.1	CFG	BL-H-02	SC-H-02	I	P1	OPEN
C01-033	HUMAN-P0-03 recuperación/apoyos	paso/Evidence	PROVISIONAL-HUMAN-P0-03 v0.1	CFG	BL-H-03	SC-H-03	I	P1	OPEN
C01-034	HUMAN-P0-04 núcleo H24	protocolo	PROVISIONAL-HUMAN-P0-04 v0.1	CFG	BL-H-04	SC-H-04	I	P1	OPEN
C01-035	HUMAN-P0-05 señal de aprendizaje	Evidence/Progress	PROVISIONAL-HUMAN-P0-05 v0.1	CFG	BL-H-05	SC-H-05	I	P1	OPEN
C01-036	HUMAN-P0-06 aplicabilidad revisión	método de validación	PROVISIONAL-HUMAN-P0-06 v0.1	CFG	BL-H-06	SC-H-06	I	P1	OPEN
C01-037	HUMAN-P0-07 criterios práctico/teórico	Protocol/Evidence	PROVISIONAL-HUMAN-P0-07 v0.1	CFG	BL-H-07	SC-H-07	I	P1	OPEN
C01-038	HUMAN-P0-08 postmortem	post-examen	PROVISIONAL-HUMAN-P0-08 v0.1	CFG	BL-H-08	SC-H-08	I	P1	OPEN
C01-039	CRM–Plataforma / human_assignment	referencia operacional	FX-ASG-VALID/NONE/BAD	CM	BL-20	SC-ASG-01…03	I	P1	OPEN
C01-040	Webhooks/sync/reconciliación	errores/actualización	relectura; sin mecanismo nuevo	CM	BL-FUT-12	SC-ERR-03	I	P1	OPEN
C01-041	Architecture/API/Data/Integration Spec	handoff futuro	omitido en P01	BL	BL-FUT-13	SC-GOV-02	I	P1	OPEN
C01-042	Golden dataset/adquisición/legalidad	datos futuros	sólo contenido sintético	BL	BL-FUT-14	SC-GATE-02	P	P1	OPEN
C01-043	Student Model/Personal Engine	futuro ADE/Risk	omitido	BL	BL-FUT-15	SC-GOV-02	I	P1	OPEN
C01-044	Playbooks/SLA/Human QA piloto	piloto futuro	no inventar valores	BL	BL-FUT-16	SC-GATE-05	P	P1	OPEN
C01-045	Corrigendum promoción/precedencia	gate documental previo a handoff	no se resuelve en P01	BL	BL-FUT-17	SC-GOV-03	antes de promoción/handoff formal	P1	OPEN
C01-046	Métricas/visibilidad institucional piloto	medición futura	no autorizar piloto	BL	BL-FUT-18	SC-GATE-06	P	P1	OPEN
C01-047	Modalidad oral/otras familias	no implementada	omisión explícita	BL	BL-DEF-01	SC-DEF-01	O	P2	OPEN
C01-048	Integraciones profundas Calendar/LMS/SIS	no implementadas	omisión explícita	BL	BL-DEF-02	SC-DEF-01	O	P2	OPEN
C01-049	Hardening/automatización avanzada	no implementado	omisión explícita	BL	BL-DEF-03	SC-DEF-01	O	P2	OPEN
C01-050	academic_context_blocker	disponibilidad en Materia/ADE	fixture/empty honesto	CM	BL-21	SC-DAY-05	I	P1	OPEN
C01-051	Configuración/obligatoriedad Reflection	UX05/UX06/Protocol	FX-REFL-OPT/REQ/BAD	CFG	BL-22	SC-REF-01…03	H	P1	OPEN
	Control de cardinalidad: 51/51 OPEN; 0 C01-P0 / 48 C01-P1 / 3 C01-P2; C01-P2 implementados: cero.

C01-045 — OPEN — PRIMARY WS7 — BEFORE FORMAL TECHNICAL HANDOFF

P01 no es el handoff técnico formal, no inicia WS7 y no inicia ningún workstream.

8. Control de suficiencia preservado

owner único de matriz C01: este documento;
51 filas presentes y abiertas;
Reflection, privacidad, revisión real, Intervention y human_assignment separados;
cuatro ramas ADE modeladas sin evento nuevo;
fixtures explícitamente reversibles;
ninguna afirmación de aprobación, promoción, implementación o cierre.


***

PARTE V — CONVERGENCIA LOCAL POR TRAMO (detalle de secuencia paso a paso)


***

V.1 — Loop diario (UX01–UX04)

ACHIEVE — LOOP DIARIO: CONVERGENCIA UX01–UX04

Versión: v1.0  


1. Autoridad y alcance

Conserva el recorrido UX01–UX04 de las fuentes FINAL y las specs ACHIEVE_HOY_AUTOGESTION_FUNCTIONAL_SPEC_v1.0_APPROVED.md, ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_SPEC_v1.0_APPROVED.md, ACHIEVE_PROXIMA_ACCION_FUNCTIONAL_SPEC_v1.0_APPROVED.md y ACHIEVE_COMPROMISO_FUNCTIONAL_SPEC_v1.0_APPROVED.md. Consume C01 v1.0 aprobado/promovido y CR-UX09-04 aprobado/promovido. Las fuentes históricas no autorizadas no tienen autoridad.

Owners downstream referenciados:

recorrido/CTAs: ACHIEVE_GOLDEN_PATH_UNIFICADO_v1.0_APPROVED.md;
objetos/fixtures/matriz C01: ACHIEVE_CONTRATOS_MINIMOS_PROTOTIPO_v1.0_APPROVED.md;
crosswalk: ACHIEVE_BACKLOG_PROTOTIPO_v1.0_APPROVED.md;
escenarios: ACHIEVE_ESCENARIOS_PRUEBA_v1.0_APPROVED.md.

2. Recorrido local

UX01 proyecta TodayView. No prioriza, calcula ni crea Action.
CTA-001 abre UX02; UX02 muestra Course/contexto real o un fallback honesto.
CTA-002 abre UX03 sólo con ActionRecommendation primaria vigente ya emitida por ADE.
CTA-003 solicita aceptar Action. ActionAccepted no crea Commitment.
UX04 recibe Action ACCEPTED; CTA-004 solicita confirmar Commitment.
CommitmentCreated confirma un objeto separado y puede coordinar Action COMMITTED.
CTA-005 inicia sólo cuando el owner lo permite; abrir/timer no inicia.
CTA-006 registra cierre conductual; no crea ni envía Evidence.
Si un Commitment CONFIRMED o DUE conserva elegibilidad autoritativa, CTA-017 (Renegociar) abre el flujo de renegociación sin mutar el original. CTA-018 (Confirmar renegociación) solicita al owner preservar el original como RENEGOTIATED y materializar un nuevo Commitment CONFIRMED para la misma Action.
Si el Commitment está STARTED, MISSED o el owner niega elegibilidad, no se ofrece edición retroactiva: se conserva el estado y se muestran sólo continuación, bloqueo o rescate según corresponda.
Si el owner declara MISSED/RESCUE_REQUIRED, CTA-015 solicita rescate preservando el original.
El retorno a Hoy relee proyecciones y nunca presume estados por la navegación.

3. Handoffs locales

Handoff	Entrada mínima	Salida/fallback	Contrato/CTA	Escenario
Hoy → Materia	Course visible	UX02; si falla, Hoy/empty	CO-01/02, CTA-001	SC-DAY-01
Hoy/Materia → Acción	recomendación ADE vigente	UX03; si vence, releer	CO-03, CTA-002	SC-DAY-02
Acción → Compromiso	Action ACCEPTED confirmada	draft; no Commitment aún	CO-03/04, CTA-003	SC-DAY-02
draft → Commitment	datos válidos	CONFIRMED; reconciliar si falla	CO-04/16, CTA-004	SC-DAY-03/SC-ERR-01
Commitment → ejecución	estado iniciable del owner	STARTED; relectura	CO-04, CTA-005	SC-DAY-03
ejecución → Evidence	cierre conductual confirmado	UX05; Evidence aún inexistente/esperada	CO-04/05, CTA-006	SC-DAY-03
Commitment vigente → renegociación	CONFIRMED/DUE y elegibilidad autoritativa	formulario con original no editable; sin mutación al abrir	CO-04/16, CTA-017	SC-REN-01
renegociación → nuevo Commitment	elegibilidad revalidada y nueva fecha/hora/capacidad válidas	original RENEGOTIATED; nuevo CONFIRMED; misma Action; old/new preservados	CO-04/16, CTA-018	SC-REN-01
intento no elegible	STARTED, MISSED o elegibilidad denegada	original sin cambios; continuar/bloqueo o rescate; sin CTA de confirmación	CO-04/16, CTA-017	SC-REN-02
incumplimiento → rescate	MISSED autoritativo	rescate separado; original preservado	CO-04, CTA-015	SC-DAY-04
	4. human_assignment e Intervention

El loop puede proyectar una referencia human_assignment sólo si CRM/Operations declara owner, vigencia, finalidad y visibilidad autorizada. Es distinta de Intervention y de una revisión R1. Su ausencia, vencimiento o falta de autorización produce omisión, no bloqueo ni promesa de contacto. Contratos CO-09/10/15; fixtures FX-ASG-VALID/NONE/BAD; escenarios SC-ASG-01…03; C01-039 sigue OPEN.

5. Retorno desde Progress/Bitácora

UX06 no prioriza ni genera Action. Un hecho autoritativo nuevo puede habilitar o solicitar re-evaluación por ADE. ADE devuelve nueva recomendación, ausencia, error/reintento o todavía no disponible. UX01/UX02 sólo releen esa salida. Fixtures FX-ADE-NEW/NONE/ERROR/PENDING; escenarios SC-ADE-01…04. No se inventa evento productivo.

6. Trazabilidad local

Ítem backlog	Contrato	CTA	Fixture	Escenario	C01
BL-01	CO-01/03/12	CTA-002	FX-DAY-BASE/FX-ADE-*	SC-DAY-02, SC-ADE-01…04	006
BL-02	CO-03	CTA-003	FX-DAY-BASE	SC-DAY-02	007
BL-04	CO-03/16	CTA-003/014	FX-ERROR-IDEM	SC-ERR-01	009
BL-05	CO-04	CTA-004/005/006/015	FX-DAY-BASE/FX-MISSED	SC-DAY-03/04	010
BL-06	CO-03/04	CTA-003/004	FX-DAY-BASE	SC-DAY-02/03	011
BL-20	CO-09/10/15	proyección/omisión	FX-ASG-*	SC-ASG-01…03	039
BL-21	CO-02/03	CTA-001/002/010	contexto ausente	SC-DAY-05	050
BL-23	CO-04/16	CTA-017/018	FX-REN-ELIGIBLE/INELIGIBLE	SC-REN-01/02	010
	La matriz normativa C01 completa está en Contratos mínimos §7: 51/51 OPEN. C01-047…049 no se implementan.

7. Gates

Sólo QA interna sintética es inmediata. Comprensión, UX/research, validación psicopedagógica real, implementación y piloto son futuros y separados. No se autorizan estudiantes; QA completa no implica high-fidelity.

C01-045 — OPEN — PRIMARY WS7 — BEFORE FORMAL TECHNICAL HANDOFF. P01 no es el handoff y no inicia WS7.


***

V.2 — Cierre del loop (UX04–UX06)

ACHIEVE — CIERRE DEL LOOP: CONVERGENCIA UX04–UX06

Versión: v1.0  


1. Autoridad y alcance

Conserva UX04–UX06 según fuentes FINAL, specs APPROVED de Commitment, Evidence y Progress/Bitácora, y ACHIEVE_CR_UX09_04_REVISION_HUMANA_SELECTIVA_v1.0_APPROVED.md aprobado/promovido. C01 v1.0 está aprobado/promovido con 51 contratos abiertos. EP01 sólo aporta defaults provisionales reversibles. No se usan fuentes históricas no autorizadas.

Owners normativos: Golden Path para CTAs; Contratos mínimos para objetos/fixtures/C01; Backlog para crosswalk; Escenarios para aceptación; Configuración provisional para HUMAN-P0.

2. Recorrido local

UX04 recibe Action ACCEPTED; crea Commitment sólo tras CTA-004 confirmado.
Un Commitment CONFIRMED/DUE sólo entra en renegociación cuando el owner confirma elegibilidad: CTA-017 abre el original no editable y CTA-018 confirma old/new. STARTED/MISSED no se editan; SC-DAY-04 queda reservado a rescate.
Inicio y cierre conductual usan CTA-005/006; Commitment COMPLETED no implica Evidence.
UX05 lee contenido, criterio, tipos y configuración de Reflection.
Reflection es un objeto separado. Puede ser OPTIONAL o REQUIRED; privacidad/retención sigue bajo C01-017 y obligatoriedad bajo C01-051.
CTA-007 produce Evidence SUBMITTED; no suficiencia ni revisión.
Método humano configurado no basta. Sólo una revisión real creada y demostrada por review_instance_ref sintética consistente permite UNDER_REVIEW; no se inventa entidad productiva Review.
SUFFICIENT, INSUFFICIENT, RESUBMISSION_REQUESTED y VALIDATED permanecen separados. CTA-008 preserva Evidence anterior.
VALIDATED no implica ProgressUpdated. UX06 muestra cambio/no-cambio autoritativo y Bitácora factual.
Un hecho nuevo habilita o solicita re-evaluación al ADE. UX06 no rankea ni crea Action; sólo relee nueva recomendación, ausencia, error o pending.

3. Contratos críticos

Reflection

Rama	Fixture	Resultado	Escenario
opcional	FX-REFL-OPT	puede confirmarse por CTA-016 u omitirse sin bloqueo	SC-REF-01
obligatoria	FX-REFL-REQ	Reflection válida habilita sólo el submit dependiente	SC-REF-02
ausente/inválida	FX-REFL-BAD	corregir/volver; Evidence no cambia	SC-REF-03
	Revisión real

Rama	Fixture	Resultado	Escenario
real creada	FX-REV-CREATED	UNDER_REVIEW permitido si R1/criterio/autorización consistentes	SC-REV-01
sólo método configurado	FX-REV-CONFIG	Evidence permanece SUBMITTED	SC-REV-02
referencia inconsistente	FX-REV-BAD	error/reconciliación; permanece SUBMITTED	SC-REV-03
	Assignment e Intervention

human_assignment es una referencia operacional de CRM/Operations con vigencia, finalidad y visibilidad autorizada. Intervention es otro objeto/acción operacional. Assignment no crea Intervention ni review. Ausente/vencido/no autorizado se omite. Escenarios SC-ASG-01…03; C01-039 OPEN.

Replanificación

Salida ADE	Fixture	Proyección UX	Escenario
nueva recomendación	FX-ADE-NEW	mostrar recomendación ya emitida	SC-ADE-01
ausencia	FX-ADE-NONE	empty honesto/volver	SC-ADE-02
error/reintento	FX-ADE-ERROR	CTA-014; no inventar	SC-ADE-03
no disponible todavía	FX-ADE-PENDING	copy de espera/relectura	SC-ADE-04
	4. Trazabilidad local

Backlog	Contrato	CTA/transición	Fixture	Escenario	C01
BL-07	CO-05	CTA-007	FX-EVD-BASE	SC-EV-01	012
BL-08	CO-05	transición owner	FX-EVD-BASE	SC-EV-02	013
BL-09/10	CO-05/16	CTA-007/008/014	FX-EVD-BASE/ERROR	SC-EV-03/ERR-02	014,015
BL-11	CO-08/16	transición/CTA-014	FX-REV-*	SC-REV-01…03	016
BL-12/14	CO-11/12	CTA-009/002/014	FX-ADE-*	SC-PROG-01/ADE-01…04	018,020
BL-20	CO-09/10/15	proyección/omisión	FX-ASG-*	SC-ASG-01…03	039
BL-22	CO-06/07	CTA-016/007	FX-REFL-*	SC-REF-01…03	017,051
BL-23	CO-04/16	CTA-017/018	FX-REN-ELIGIBLE/INELIGIBLE	SC-REN-01/02	010,011
	5. Límites y gates

No se inventan APIs, eventos, arquitectura, reviewer, SLA ni Intervention. Sólo QA interna con datos sintéticos entra ahora. Comprensión/UX/psicopedagogía real/implementación/piloto quedan futuros; estudiantes no autorizados. La matriz C01 owner confirma 51/51 OPEN; C01-P2 implementados cero.

C01-045 — OPEN — PRIMARY WS7 — BEFORE FORMAL TECHNICAL HANDOFF. P01 no inicia WS7.


***

V.3 — Modo Examen (UX07–UX09)

ACHIEVE — MODO EXAMEN: CONVERGENCIA UX07–UX09

Versión: v1.0  


1. Autoridad y alcance

Conserva UX07–UX09 según las fuentes FINAL, las tres specs APPROVED de Modo Examen y CR-UX09-04 aprobado/promovido. Consume C01 v1.0 aprobado/promovido. EP01 es provisional, reversible, no aprobado y no promovido. Las fuentes históricas no autorizadas no tienen autoridad.

La cobertura global permanece limitada a UX01–UX09. Mapeo canónico: WF-S10 → UX08; WF-S11 → UX09.

2. Recorrido local

UX07 recibe Assessment existente/elegible. CTA-011 solicita activar ExamPreparation.
La confirmación produce ExamPreparation ACTIVE; no crea Action, Commitment, Evidence, Progress, protocolo completo ni readiness.
WF-S10 → UX08: Overview relee Assessment, ExamPreparation, definición/versionado, paso actual y objetos operativos reales.
UX08 aplica precedencia; no rankea. CTA-012 aparece sólo con paso actual autoritativo y sin gate/objeto de mayor precedencia.
WF-S11 → UX09: UX09 muestra únicamente contenido/Resource configurado. La UI no elige el paso.
ProtocolStep no crea Action. Sólo ADE puede emitir ActionRecommendation; CTA-013 deriva entonces a UX03.
Action, Commitment, Evidence y Reflection usan sus contratos canónicos separados.
Evidence validada no completa automáticamente ProtocolStep; ProtocolStepCompleted no implica Progress.
Volver a UX08/UX02/UX01 no declara abandono ni readiness.

3. Defaults HUMAN-P0 consumidos

El detalle normativo vive en ACHIEVE_CONFIG_PSICOPEDAGOGICA_PROVISIONAL_v1.0_APPROVED.md. Todos mantienen cláusula, versión v0.1, fallback y punto de sustitución:

ID	Cláusula	Uso local	Estado
HUMAN-P0-01	PROVISIONAL-HUMAN-P0-01	granularidad configurable de pasos	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-02	PROVISIONAL-HUMAN-P0-02	dimensiones/proyección sin score	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-03	PROVISIONAL-HUMAN-P0-03	recuperación/apoyo separados	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-04	PROVISIONAL-HUMAN-P0-04	H24 adaptable, no checklist	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-05	PROVISIONAL-HUMAN-P0-05	desempeño observable	OPEN — POTENTIALLY ANSWERED — REQUIRES SOURCE CONFIRMATION
HUMAN-P0-06	PROVISIONAL-HUMAN-P0-06	aplicabilidad humana provisional	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-07	PROVISIONAL-HUMAN-P0-07	criterios práctico/teórico	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-08	PROVISIONAL-HUMAN-P0-08	postmortem flexible	OPEN — HUMAN CONFIRMATION PENDING
	Cuando un default modifica copy, criterio o comportamiento visible, se rotula internamente como asunción provisional pendiente de confirmación humana. Ningún alias histórico sustituye estos IDs.

4. Revisión, Reflection y continuidad

Reflection es objeto separado, OPTIONAL o REQUIRED, con fallbacks FX-REFL-* y escenarios SC-REF-01…03; C01-051 OPEN.
método humano configurado no produce UNDER_REVIEW; se exige review_instance_ref real y consistente. Escenarios SC-REV-01…03; C01-016 OPEN.
human_assignment es referencia CRM/Operations separada de Intervention y review; vigencia/finalidad/visibilidad obligatorias. Escenarios SC-ASG-01…03; C01-039 OPEN.
Progress/Bitácora puede habilitar re-evaluación ADE; UX08/09 sólo releen las cuatro salidas FX-ADE-*.

5. Trazabilidad local

Backlog	Contrato	CTA	Fixture	Escenario	C01
BL-15/16	CO-13	CTA-011/010	FX-EXAM-BASE	SC-EX-01/05	024,025
BL-17	CO-14	CTA-012	FX-EXAM-BASE	SC-EX-02	026
BL-18	CO-14	CTA-012	FX-EXAM-BASE	SC-EX-03	027
BL-19	CO-05/11/14	CTA-007/009/013	FX-EXAM/EVD	SC-EX-04/05	028
BL-H-01…08	CO-05/06/08/11/14	según owner CTA	config HUMAN-P0 v0.1	SC-H-01…08	031–038
BL-22	CO-06/07	CTA-016/007	FX-REFL-*	SC-REF-01…03	051
	6. Límites y gates

No se implementan modalidad oral/otras familias (C01-047), integraciones profundas (048) ni hardening avanzado (049). No hay readiness global. Sólo QA sintética inmediata; comprensión, UX/research, validación psicopedagógica real, implementación y piloto son futuros. No se autorizan estudiantes ni high-fidelity automático.

La matriz C01 normativa confirma 51/51 OPEN. C01-045 — OPEN — PRIMARY WS7 — BEFORE FORMAL TECHNICAL HANDOFF. P01 no es el handoff ni inicia WS7.


***

PARTE VI — SPECS FUNCIONALES POR PANTALLA (wireframe, jerarquía 360px, copy, estados)


***

VI.1 — Hoy / Autogestión

ACHIEVE — HOY / AUTOGESTIÓN

FUNCTIONAL WIREFRAME v0.3 CANDIDATE

Estado: candidato de corrección controlada de v0.2, listo para auditoría final de Product Owner.  
Fecha: 21 de agosto de 2026.  
Baseline:

ACHIEVE_MVP_USUARIO_PRODUCT_SPEC_v0.5_FINAL
ACHIEVE_USER_FLOW_WIREFRAMES_DATA_MODEL_v0.2_FINAL
ACHIEVE_HOY_AUTOGESTION_FUNCTIONAL_WIREFRAME_v0.2
ACHIEVE_HOY_AUTOGESTION_PRODUCT_OWNER_AUDIT_v0.2

Alcance de esta revisión

Esta versión incorpora exclusivamente:

FIX-01: TodayView consume prioridad académica; sólo resuelve precedencia operativa de lifecycle;
FIX-02: Después describe únicamente el siguiente evento real y garantizado;
FIX-03: RESCUE_REQUIRED se separa de RESCUE_MATERIALIZED;
FIX-04: los datos con ownership técnico no cerrado se marcan SOURCE CONTRACT PENDING.

No se agregan features, navegación, módulos, entidades ni Change Requests.

Se preservan sin reabrir: JTBD, mobile first, acción > información, una CTA primaria, progressive disclosure, Human Accountability factual, TodayView como proyección y todas las correcciones aprobadas en v0.2.

***
1. JOB TO BE DONE FINAL

Cuando el estudiante abre Hoy, debe poder pasar de su situación académica actual a la única conducta que necesita ejecutar ahora, entendiendo:

cómo está;
qué debe hacer;
por qué esa acción va primero;
qué tiene que entregar o completar;
qué estado real seguirá después.

La pantalla mueve el loop existente:

contexto → acción → compromiso → ejecución → evidencia → actualización/rescate

Decisión central

> El Hero responde “¿Qué necesita hacer el estudiante AHORA?”.

No responde qué es lo más grave históricamente ni qué tiene el score más alto. Un incumplimiento anterior puede seguir siendo una señal relevante sin interrumpir una acción que ya está en curso.

No intenta resolver

detalle completo de Materia/Cursado;
creación completa de Commitment;
carga/revisión completa de Evidence;
Bitácora;
protocolo completo de Modo Examen;
conversación con el acompañante;
calendario;
dashboard de métricas;
score de riesgo o probabilidad de aprobación.

***
2. HIERARCHY — MOBILE FIRST

2.1. Jerarquía semántica

Header mínimo: Hoy + fecha local.
Estado mínimo: una categoría breve; no repite la causa.
Hero / Primary Action: contexto, conducta, una razón, evidencia/salida, siguiente estado y CTA.
Hecho humano opcional: sólo con evidencia operacional.
Señal secundaria opcional: por ejemplo, incumplimiento anterior mientras existe trabajo activo.
Materias resumidas: conciencia periférica, below the fold.
Drill-down existente: Action, Commitment, Evidence, Materia o Examen.

2.2. Contrato del primer viewport de 360 px

El primer viewport debe contener:

estado en una línea;
materia/tema o contexto de examen;
acción/estado operativo dominante;
una razón en una línea o dos líneas cortas;
tiempo cuando aplica + evidencia/entregable;
qué pasa después en una línea;
CTA principal a ancho completo.

No se coloca entre el estado y la CTA:

lista de materias;
alerta separada con la misma causa;
feedback;
último mensaje;
indicador de progreso;
link secundario que compita;
humano sin hecho operacional.

2.3. Un dato, un dueño visual

Información	Lugar principal	Representación secundaria
Estado general	Franja mínima	No se repite en alertas
Causa de prioridad	Hero	Materia usa sólo estado resumido
Acción actual	Hero	No se duplica en Materias
Evidencia	Hero	Detalle completo en Action/Evidence
Próximo estado	Hero	No se convierte en timeline
Riesgo	Modifica estado/razón	Señal secundaria sólo si aporta otra causa
Examen activo	Contexto del Hero	Protocolo completo fuera de Hoy
Incumplimiento anterior	Señal below fold si hay trabajo activo	Historial en Compromisos
Humano	Hecho operacional contextual	WhatsApp/CRM fuera de Hoy
	***
3. PRECEDENCIA OPERATIVA DE ESTADOS

3.1. Regla general

La selección del Hero separa dos responsabilidades:

Responsabilidad	Dueño	Qué decide
ACADEMIC PRIORITY	Academic Decision Engine	Qué materia, evaluación y trabajo concreto tienen mayor valor académico ahora
OPERATIONAL LIFECYCLE PRECEDENCE	TodayView	Qué objeto ya priorizado o iniciado requiere una conducta operativa inmediata
	TodayView recibe la ActionRecommendation principal ya seleccionada u ordenada por el Academic Decision Engine. Puede anteponer una Action en curso, una evidencia pendiente o un Commitment accionable porque esos objetos representan un lifecycle más avanzado. No puede sustituir la recomendación principal por otra materia debido a fecha de examen, riesgo, dificultad, brecha, antigüedad o starvation.

La precedencia se aplica sólo sobre objetos vigentes y accionables. Primero protege la continuidad del trabajo iniciado; después cierra evidencia o compromisos actuales; luego resuelve recuperación; finalmente muestra la recomendación entregada por el Engine o un fallback honesto.

3.2. Tabla de precedencia del Hero

Orden	Condición evaluada	Ocupa el Hero	CTA	Qué ocurre con otros estados
1	Action.status = IN_PROGRESS	Acción activa, regular o de rescate	Continuar	MISSED, riesgo, examen y recomendaciones quedan secundarios
2	Action.status = EVIDENCE_PENDING y requiere acción del alumno	Cierre mediante evidencia, regular o de rescate	Subir evidencia	Incumplimientos anteriores no compiten
3	Commitment CONFIRMED/DUE que constituye el próximo compromiso operativo, regular o RESCUE_MATERIALIZED	Compromiso ya acordado	Ver compromiso si es próximo; Empezar / Empezar rescate si es startable now	Se decide por lifecycle y tiempo acordado, no por prioridad académica
4	RESCUE_REQUIRED sin Action/Commitment de rescate	Necesidad de rearmar el compromiso	Retomar	No muestra alcance, duración, horario ni evidencia inexistentes
5	Commitment.state = MISSED todavía sin resolución de recuperación	Incumplimiento pendiente de resolución	Retomar	No se maquilla ni se crea contenido de rescate desde la vista
6	ACTION_RECOMMENDED principal provista por Academic Decision Engine	Próxima acción académica ya priorizada	Comprometerme	TodayView no compara esta recomendación con otras materias
7	ACADEMIC_CONTEXT_INCOMPLETE bloquea toda recomendación válida	Acción para completar/confirmar contexto	Completar información	Si el Engine entrega una recomendación válida en otra materia, esa recomendación prevalece
8	Evidence SUBMITTED/UNDER_REVIEW/VALIDATED y no existe acción posterior válida	Estado informativo de evidencia/avance	Ver evidencia / Ver avance según lifecycle	No se promete hora, revisor ni nueva recomendación inexistente
9	NO_ACTION_AVAILABLE con lectura exitosa y sin causa específica	Empty state académico honesto	Ver materias	No afirma actualización en curso
	Por qué RESCUE_MATERIALIZED no constituye un nivel independiente

RESCUE_MATERIALIZED describe que ya existe una nueva Action/Commitment relacionada con el incumplimiento; no describe por sí solo qué necesita hacer el alumno ahora. Por eso participa en la precedencia según su lifecycle real:

rescue Action IN_PROGRESS → nivel 1;
rescue Action EVIDENCE_PENDING → nivel 2;
rescue Commitment CONFIRMED/DUE → nivel 3;
rescue Commitment futuro → se muestra como próximo compromiso sólo cuando no existe un objeto más inmediato.

Esto preserva la decisión de v0.2: un compromiso actual no es desplazado automáticamente por un rescate anterior sólo por tratarse de un rescate.

3.3. Estados modificadores, no reemplazantes

HIGH_RISK

No gana automáticamente el Hero. Puede:

cambiar el estado general a Necesita recuperación;
seleccionar la causa prioritaria visible;
reflejar el estado ya derivado por el Risk Engine;
habilitar un hecho humano si existe Intervention real;
permanecer como señal secundaria si el alumno está ejecutando otra acción.

No puede interrumpir IN_PROGRESS ni EVIDENCE_PENDING sólo por severidad. Tampoco permite que TodayView reordene recomendaciones o materias por cuenta propia.

EXAM_MODE_ACTIVE

No es una segunda acción. Añade al Hero:

evaluación objetivo;
días restantes si la fecha está disponible;
fase/hito actual cuando aporta contexto;
fase/hito sólo como contexto secundario cuando no se confunde con el siguiente evento operativo.

La CTA sigue perteneciendo a Action/Commitment/Evidence.

3.4. Resolución de conflictos

Conflicto	Resolución
IN_PROGRESS + COMMITMENT_MISSED anterior	Hero = acción activa. Missed = señal secundaria below fold.
EVIDENCE_PENDING + HIGH_RISK	Hero = subir evidencia. Riesgo modifica estado/razón, no CTA.
COMMITMENT_DUE + rescue requerido de un compromiso anterior	Hero = compromiso actual. Rescate anterior queda pendiente below fold.
RESCUE_MATERIALIZED IN_PROGRESS + recomendación	Hero = Action de rescate activa por lifecycle, no por ranking académico.
RESCUE_REQUIRED + ACTION_RECOMMENDED	Hero = rearmar compromiso. La recomendación no aparece como segunda prioridad.
COMMITMENT_MISSED + recomendación nueva no aceptada	Hero = resolver incumplimiento/No Cortar.
EXAM_MODE_ACTIVE + HIGH_RISK + recomendación	Hero = recomendación principal entregada por el Engine, contextualizada por examen y riesgo.
Contexto incompleto en una materia + acción válida en otra	Hero = acción válida. Materia incompleta queda en resumen secundario.
Contexto incompleto bloquea todas las materias	Hero = completar/confirmar información.
Evidence bajo revisión + nueva acción válida	Hero = nueva acción. Revisión queda secondary status.
Riesgo alto sin Action/Commitment/Rescue	Hero = fallback honesto; si existe Intervention se muestra el hecho, pero RiskSignal no inventa una acción.
	3.5. Resolución dentro del mismo nivel

TodayView sólo puede resolver ambigüedad operacional:

una única Action vigente ya marcada IN_PROGRESS;
una única Action vigente que requiere evidencia del alumno;
el Commitment cuya ventana temporal lo hace startable now;
la recomendación identificada como principal por el Academic Decision Engine.

TodayView no usa Assessment, riesgo, brecha, dificultad, prioridad propia, edad del objeto ni starvation para elegir materia o trabajo.

Si existen múltiples Actions incompatibles simultáneamente activas, múltiples Commitments igualmente startable o varias recomendaciones sin una principal definida por el Engine, la proyección no inventa un ranking. La fuente propietaria debe resolver la ambigüedad; si no entrega una lectura válida, Hoy usa el estado técnico de error ya definido.

***
4. INFORMATION COMPRESSION

4.1. Qué permanece eliminado desde v0.1

V0.3 conserva la compresión conseguida en v0.2; no reintroduce ninguno de estos elementos:

La causa académica completa deja de aparecer simultáneamente en estado, Hero y Materia.
El estado general ya no nombra materia + brecha cuando esa información está en el Hero.
Se elimina Agus sigue esta acción del wireframe base.
Se elimina cualquier avatar/nombre del primer viewport si no existe hecho operacional.
Se elimina mientras actualizamos el contexto.
Se elimina review_expected_by y cualquier promesa horaria sin SLA.
Se elimina el label visual de prioridad cuando la razón ya explica por qué va primero.
Se elimina Ver detalle como control competidor above the fold; el Hero puede abrir el detalle mediante interacción secundaria existente.
Se reduce Por qué a una sola causa visible.
Se reduce Después a un solo evento inmediato, real y garantizado; si depende de completar una conducta se expresa condicionalmente.
La materia dominante no repite su brecha completa en el listado below the fold.
Se elimina feedback humano persistente de Hoy; sólo aparece si cambia la decisión actual.

4.2. Progressive disclosure

Nivel 1 — primer viewport

estado mínimo;
acción;
razón principal;
evidencia;
después;
CTA.

Nivel 2 — below the fold

una señal secundaria diferente de la causa principal;
hecho humano real;
materias resumidas;
evaluación relevante no incluida en Hero;
estado de otra evidencia.

Nivel 3 — drill-down existente

razones completas y provenance;
recursos;
criterio detallado de evidencia;
compromiso completo;
progreso por dimensiones;
historial;
protocolo de examen;
intervención/WhatsApp.

4.3. Copy rules

Máximo una causa visible en Hero.
Máximo una línea Después.
Después no salta estados de Action, Commitment o Evidence.
Un outcome condicionado se redacta como Cuando… o Si…, nunca como hecho consumado.
No usar Prioridad alta si la causa ya justifica prioridad.
No decir Bajo control si RiskSignal/ritmo no están disponibles.
No decir esperando a Agus sin assignment/review real.
Esperando revisión no incluye responsable ni hora por defecto.
No decir que el sistema calcula, actualiza o busca si no existe un proceso real observado.

***
5. WHAT HAPPENS NEXT — CONTRATO DE LIFECYCLE

La línea Después explica el siguiente evento que el producto puede sostener con el estado actual. No promete cumplimiento, validación, actualización de progreso ni una nueva recomendación antes de que ocurran sus eventos disparadores.

CURRENT STATE	PRIMARY CTA	NEXT GUARANTEED EVENT	WHAT MUST NOT BE PROMISED
ACTION_RECOMMENDED	Comprometerme	Se abre/continúa la definición del Commitment; al confirmarlo queda definido cuándo se hará	Que ya comenzó la Action, que se actualizó progreso o que aparecerá inmediatamente otra recomendación
COMMITMENT_CONFIRMED	Ver compromiso si es próximo; Empezar si es startable now	Si es próximo, se abre su detalle; si comienza, Commitment/Action pasa al estado operativo de inicio	Que terminará, que entregará evidencia o que el progreso cambiará
IN_PROGRESS	Continuar	Se retoma la Action activa; cuando se complete la ejecución se solicita el cierre/evidencia configurada	Que continuar equivale a completar o demostrar aprendizaje
EVIDENCE_PENDING con acción del alumno	Subir evidencia	Si el envío se completa, Evidence queda SUBMITTED y pasa a validación/revisión cuando aplique	Que será suficiente, validada o revisada por una persona/hora determinada
EVIDENCE_VALIDATED	Ver avance	El avance derivado se actualiza y el Academic Decision Engine puede recalcular qué sigue	Que necesariamente ya existe una nueva recomendación o que la evidencia demuestra dominio universal
COMMITMENT_MISSED	Retomar	Se inicia la resolución del incumplimiento y se determina cómo recuperar	Que el incumplimiento se borra o que ya existe un rescate concreto
RESCUE_REQUIRED	Retomar	Se abre/continúa la definición de cómo y cuándo retomar	Que ya existen Action, ejercicios, duración, horario, evidencia o recuperación cumplida
RESCUE_MATERIALIZED y startable now	Empezar rescate	La Action/Commitment de rescate pasa a ejecución	Que el rescate ya se cumplió, borró el missed o actualizó progreso
	Copies canónicos de Después

Estado visible	Copy permitido
Recomendación	Después: queda definido cuándo vas a hacerla.
Commitment confirmado	Cuando termines, te pedimos la evidencia acordada.
En curso	Al terminar, subís la evidencia acordada.
Evidencia pendiente	Después: la evidencia queda pendiente de validación.
Evidencia validada	Después: actualizamos el avance y recalculamos qué sigue.
Missed / rescue requerido	Primero necesitamos acordar cómo retomar.
Rescue materializado	Al terminar, subís la evidencia del rescate.
	La frase para evidencia validada sólo se utiliza cuando el evento de validación ya ocurrió. Recalculamos qué sigue no promete que exista una recomendación inmediata; describe la ejecución real del Engine.

***
6. MOBILE FIRST — 360 PX

6.1. Estructura base

+--------------------------------------+
| HOY · vie 21 ago            [Juan v] |
+--------------------------------------+
| [ ESTADO EN UNA LÍNEA ]              |
+--------------------------------------+
| [ MATERIA · TEMA / EXAMEN ]          |
|                                      |
| [ ACCIÓN O ESTADO OPERATIVO ]        |
|                                      |
| Porque: [una causa]                  |
|                                      |
| [tiempo] · Entregá: [evidencia]      |
| Después: [siguiente evento real]     |
|                                      |
| [          CTA PRINCIPAL          ]  |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| [hecho humano, sólo si existe]       |
| [señal secundaria, máx. una]         |
| MATERIAS                             |
| [filas compactas]                    |
+--------------------------------------+

El orden es estable entre variantes. Cambia el contenido del Hero, no la arquitectura.

***
7. ESTADOS CRÍTICOS — WIREFRAMES 360 PX

A. Alumno al día con próxima acción

+--------------------------------------+
| HOY · vie 21 ago            [Juan v] |
+--------------------------------------+
| BAJO CONTROL                        |
+--------------------------------------+
| PROGRAMACIÓN · UNIDAD 4              |
|                                      |
| Resolver ejercicios 1–5              |
|                                      |
| Porque: consolida lo visto hoy.      |
|                                      |
| 40 min · Entregá: 5 ejercicios      |
| Después: queda definido cuándo       |
| vas a hacerla.                       |
|                                      |
| [        COMPROMETERME            ]  |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| MATERIAS                             |
| Programación · Bajo control          |
| Último avance: hoy                   |
| Análisis II · Bajo control           |
| Arquitectura · Bajo control          |
+--------------------------------------+

Hero: Resolver ejercicios 1–5.  
CTA: Comprometerme.  
Información secundaria: materias y recencia.  
Below the fold: resumen de materias.  
No se muestra: humano, riesgo, porcentaje, brecha repetida, calendario, otras recomendaciones.

B. Alumno con Action IN_PROGRESS

Contexto de conflicto: incumplió un compromiso ayer, pero hoy ya está trabajando en una nueva acción.

+--------------------------------------+
| HOY · vie 21 ago            [Juan v] |
+--------------------------------------+
| ACCIÓN EN CURSO                     |
+--------------------------------------+
| ANÁLISIS II · UNIDAD 3               |
|                                      |
| Resolver ejercicios 8–14             |
|                                      |
| Porque: prepara la próxima clase.    |
|                                      |
| En curso · Entregá: 7 ejercicios    |
| Al terminar, subís la evidencia      |
| acordada.                            |
|                                      |
| [            CONTINUAR            ]  |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| SEÑAL PENDIENTE                      |
| Compromiso de ayer incumplido        |
|                                      |
| MATERIAS                             |
| Análisis II · Necesita atención      |
| Programación · Bajo control          |
+--------------------------------------+

Hero: acción actualmente ejecutada.  
CTA: Continuar.  
Información secundaria: incumplimiento anterior como señal, sin CTA competidora.  
Below the fold: señal pendiente + materias.  
No se muestra: rescue como Hero, segunda recomendación, score de riesgo, humano sin Intervention.

C. Alumno con Action EVIDENCE_PENDING

+--------------------------------------+
| HOY · vie 21 ago            [Juan v] |
+--------------------------------------+
| FALTA CERRAR ESTA ACCIÓN             |
+--------------------------------------+
| ANÁLISIS II · UNIDAD 3               |
|                                      |
| Subí los ejercicios 8–14             |
|                                      |
| Porque: la acción se cierra con      |
| evidencia verificable.               |
|                                      |
| Entregá: foto/archivo de 7 ejercicios|
| Después: la evidencia queda          |
| pendiente de validación.             |
|                                      |
| [        SUBIR EVIDENCIA           ] |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| Acción realizada: ejercicios 8–14    |
| MATERIAS                             |
| Análisis II · Necesita atención      |
+--------------------------------------+

Hero: cerrar la acción con evidencia.  
CTA: Subir evidencia.  
Información secundaria: acción realizada y Materia.  
Below the fold: resumen de acción/materias.  
No se muestra: revisión humana futura, nombre de acompañante, horario de revisión, dominio inferido.

Estado posterior real permitido

Después de enviar:

EVIDENCIA ENVIADA
Esperando revisión
[ Ver evidencia ]

Sólo puede añadirse responsable/tiempo si existe assignment + SLA real. No se usa review_expected_by como promesa implícita.

D1. Compromiso incumplido + RESCUE_REQUIRED

+--------------------------------------+
| HOY · vie 21 ago            [Juan v] |
+--------------------------------------+
| NECESITA RECUPERACIÓN                |
+--------------------------------------+
| ANÁLISIS II · COMPROMISO INCUMPLIDO  |
|                                      |
| Necesitamos rearmar este compromiso. |
|                                      |
| Porque: el compromiso de las 19:00   |
| quedó incumplido.                     |
|                                      |
| Primero necesitamos acordar cómo     |
| retomar.                              |
|                                      |
| [             RETOMAR              ] |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| COMPROMISO ORIGINAL                  |
| 19:00 · Incumplido                   |
| MATERIAS                             |
| Análisis II · Necesita atención      |
+--------------------------------------+

Hero: necesidad de rearmar el compromiso; todavía no existe contenido de rescate.  
CTA: Retomar.  
Información secundaria: compromiso original con estado honesto.  
Below the fold: original + materias.  
No se muestra: Action de rescate, ejercicios, duración, horario, evidencia, recomendación futura, cumplimiento maquillado, humano sin Intervention ni estadísticas históricas.

D2. RESCUE_MATERIALIZED y startable now

Existe una nueva Action/Commitment de rescate vinculada al missed original.

+--------------------------------------+
| HOY · vie 21 ago            [Juan v] |
+--------------------------------------+
| NECESITA RECUPERACIÓN                |
+--------------------------------------+
| RESCATE · ANÁLISIS II                |
|                                      |
| Resolver ejercicios 8–10             |
|                                      |
| Porque: retoma el compromiso         |
| incumplido de ayer.                  |
|                                      |
| 20 min · Entregá: 3 ejercicios      |
| Al terminar, subís la evidencia      |
| del rescate.                         |
|                                      |
| [        EMPEZAR RESCATE           ] |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| COMPROMISO ORIGINAL                  |
| Ayer · 19:00 · Incumplido            |
| MATERIAS                             |
| Análisis II · Necesita atención      |
+--------------------------------------+

Hero: Action/Commitment de rescate ya materializado y accionable.  
CTA: Empezar rescate.  
Información secundaria: missed original sin maquillarlo.  
Below the fold: compromiso original + materias.  
No se muestra: rescate cumplido, progreso actualizado, nueva recomendación ni humano sin hecho operacional.

E. Modo Examen activo + riesgo alto

Se representa una recomendación válida del Academic Engine dentro de ExamPreparation.

+--------------------------------------+
| HOY · vie 21 ago            [Juan v] |
+--------------------------------------+
| NECESITA RECUPERACIÓN                |
+--------------------------------------+
| MODO EXAMEN · ANÁLISIS II            |
| PARCIAL 1 · 6 DÍAS                   |
|                                      |
| Resolver ejercicios 12–18 de U4      |
|                                      |
| Porque: falta práctica autónoma y    |
| el parcial es en 6 días.             |
|                                      |
| 70 min · Entregá: 7 ejercicios      |
| sin mirar soluciones                 |
| Después: queda definido cuándo       |
| vas a hacerla.                       |
|                                      |
| [        COMPROMETERME             ] |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| MATERIAS                             |
| Análisis II · En riesgo              |
| Programación · Bajo control          |
+--------------------------------------+

Hero: acción del Academic Engine contextualizada por Assessment/ExamPreparation.  
CTA: Comprometerme.  
Información secundaria: síntesis por materia; Intervention sólo si existe.  
Below the fold: materias; fase/protocolo completo vive en Modo Examen.  
No se muestra: score de riesgo, razones repetidas, protocolo completo, readiness como garantía, humano inventado.

Variante humana condicional

Sólo si existe una Intervention visible y asignada:

INTERVENCIÓN ABIERTA · Agus
Motivo: examen cercano + atraso

No se muestra hora de respuesta salvo SLA real. Esta línea aparece below the fold, excepto si la acción principal requiere responder/interactuar con esa intervención.

***
8. DESKTOP ADAPTATION

Desktop mantiene el mismo orden semántico. El espacio adicional se usa para conciencia periférica, no para sumar información al Hero.

8.1. Wireframe representativo

+--------------------------------------------------------------------------------------------------+
| ACHIEVE                              HOY · viernes 21 de agosto                       [Juan v]    |
+--------------------------------------------------------------------------------------------------+
| 1 MATERIA NECESITA ATENCIÓN                                                                    |
+----------------------------------------------------------------+---------------------------------+
| LO MÁS IMPORTANTE AHORA                                         | MATERIAS                        |
|                                                                 |                                 |
| ANÁLISIS II · UNIDAD 3                                          | Análisis II · Atención          |
| Resolver ejercicios 8–14                                       | Último avance: hace 2 días      |
|                                                                 |---------------------------------|
| Porque: prepara la próxima clase y cierra práctica de U3.       | Programación · Bajo control     |
|                                                                 | Último avance: ayer             |
| 60–75 min · Entregá: 7 ejercicios resueltos                    |---------------------------------|
| Después: queda definido cuándo vas a hacerla.                   | Arquitectura · Bajo control     |
|                                                                 | Último avance: hace 3 días      |
| [                         COMPROMETERME                       ]  |                                 |
+----------------------------------------------------------------+---------------------------------+
| [hecho humano real o señal secundaria, sólo si existe y no repite la causa]                       |
+--------------------------------------------------------------------------------------------------+

8.2. Reglas desktop

El Hero conserva aproximadamente dos tercios del ancho útil.
El estado general no repite la brecha del Hero.
La fila de la materia dominante no repite la causa; muestra sólo estado/recencia.
Las otras materias pueden mostrar una brecha breve si no aparece en el Hero.
El panel derecho no contiene CTAs por materia.
La presencia humana es condicional y factual.
Las variantes de Hero son idénticas a mobile; sólo cambia el layout.
Después conserva el mismo lifecycle copy validado en mobile; desktop no anticipa outcomes por disponer de más espacio.

***
9. HUMAN ACCOUNTABILITY — REGLA VIGENTE

9.1. Condiciones válidas para mostrar una persona

Puede mostrarse nombre/identidad sólo si existe al menos uno:

Intervention abierta/acknowledged con owner_operator_id;
Commitment con seguimiento humano explícitamente registrado;
Evidence con revisión humana asignada;
feedback humano ya emitido y vinculado al objeto visible;
interacción humana real que necesita respuesta del estudiante.

9.2. Copy permitido

Intervención abierta · Agus.
Evidencia enviada · Esperando revisión.
Revisión asignada a Agus, sólo si existe assignment real.
feedback ya registrado y vinculado.

9.3. Copy no permitido

Agus sigue esta acción sin objeto operacional.
Agus está pendiente por defecto.
Agus la revisará hoy sin SLA.
Te contactaremos en breve sin contrato real.
mensajes ficticios o presencia decorativa.

El avatar sigue siendo opcional y no forma parte del contrato P0.

***
10. EMPTY, LOADING Y DATOS INCOMPLETOS

10.1. NO_ACTION_AVAILABLE

Sólo se usa si la lectura fue exitosa y no existe Action/Commitment/Rescue/Evidence/context action válida.

NO HAY UNA PRÓXIMA ACCIÓN DISPONIBLE
Podés revisar tus materias.
[ Ver materias ]

No afirma que el sistema esté calculando o actualizando.

10.2. ACADEMIC_CONTEXT_INCOMPLETE

Si bloquea toda conducción:

FALTA INFORMACIÓN PARA RECOMENDARTE UNA ACCIÓN
Confirmá la unidad actual de Análisis II.
Porque: necesitamos ubicar el ritmo de la cátedra.
[ Completar información ]

Si no bloquea otra acción válida, queda below the fold en la materia afectada.

10.3. Loading técnico

Describe sólo el hecho real:

Cargando tu día…

No muestra una recomendación parcial como si fuera definitiva.

10.4. Error técnico

No se confunde con NO_ACTION_AVAILABLE:

No pudimos cargar Hoy.
[ Reintentar ]

Reintentar ejecuta una lectura real. No afirma un procesamiento de fondo.

***
11. TODAYVIEW — READ MODEL / PROJECTION CONTRACT

11.1. Naturaleza

TodayView es una proyección efímera para lectura. No tiene tabla propia, lifecycle de dominio, escritura directa ni identidad persistida. Se reconstruye a partir de entidades existentes y contratos versionados.

RESCUE_REQUIRED y RESCUE_MATERIALIZED son condiciones derivadas de la proyección: la primera indica ausencia de una solución de rescate concreta; la segunda, existencia de una Action/Commitment relacionada. No son entidades ni nuevos estados persistidos del dominio.

No es fuente de verdad de:

Action;
Commitment;
Evidence;
RiskSignal;
ExamPreparation;
Intervention;
estado académico.

11.2. Inputs

Base de lectura

Student: id, timezone, activation state cuando el dominio la expone.
CourseEnrollment con labels de Course/Offering necesarios cuando existen materias activas.

Inputs dependientes del estado

Action: identidad, materia/tema, verbo, alcance y status.
ActionRecommendation: recomendación principal ya seleccionada/ordenada por Academic Decision Engine, con razón explicable.
Commitment: relación con Action, lifecycle y ventana temporal; relación rescue/original cuando el dominio la expone.
Evidence: relación con Action, lifecycle y assignment real cuando existe.
Assessment: title/type/date/scope.
RiskSignal: type, severity, reason, status, target y vigencia.
ExamPreparation: assessment, status, fase/hito actual y siguiente.
Intervention: status, owner, SLA sólo si existe y visibilidad autorizada.

La ausencia legítima de Action/Recommendation/Commitment no es un error de contrato: puede producir contexto incompleto, evidencia en revisión o NO_ACTION_AVAILABLE. Sólo se presenta contenido respaldado por los inputs efectivamente disponibles.

Assessment, RiskSignal y ExamPreparation aportan contexto visible ya derivado. TodayView no los usa para comparar recomendaciones ni alterar la prioridad entregada por el Academic Decision Engine.

SOURCE CONTRACT PENDING

Los siguientes conceptos permanecen en el contrato funcional porque la UI puede necesitarlos. Este documento no decide tabla, entidad propietaria, endpoint ni forma de persistencia. TodayView sólo los consume cuando el dominio/servicio propietario los expone.

Concepto de lectura	Uso en Hoy	Estado de ownership técnico
estimated_duration	Mostrar estimación de la Action/Commitment	SOURCE CONTRACT PENDING
expected_evidence	Explicar qué debe entregar/completar el alumno	SOURCE CONTRACT PENDING
completion_criterion	Determinar qué evento cierra la Action o el rescate	SOURCE CONTRACT PENDING
rescue_relation	Vincular rescate materializado con el Commitment missed original	SOURCE CONTRACT PENDING
human_assignment	Mostrar persona sólo cuando existe assignment operacional real	SOURCE CONTRACT PENDING
	La ausencia de cualquiera de estos contratos elimina el dato o bloque condicional correspondiente; TodayView no lo infiere ni crea una estructura persistida para suplirlo.

No recalculados por el frontend

El frontend no reconstruye:

selección u orden de recomendaciones del Academic Decision Engine;
prioridad por Assessment, riesgo, dificultad, brecha, antigüedad o starvation;
severidad de riesgo;
brecha académica;
readiness;
causalidad de intervención.

Consume razones/síntesis derivadas por los servicios propietarios.

11.3. Forma funcional de la proyección

TodayView
  generated_at
  student_local_date
  overall_state
    code
    label
  primary
    type
    source_entity_type
    source_entity_id
    course_enrollment_id
    course_label
    topic_label?
    exam_context?
    title
    reason_summary?
    estimated_duration?      # SOURCE CONTRACT PENDING
    expected_evidence?       # SOURCE CONTRACT PENDING
    completion_criterion?    # SOURCE CONTRACT PENDING
    rescue_relation?         # SOURCE CONTRACT PENDING
    next_event_summary?
    cta_semantic
  human_fact?
    fact_type
    intervention_id?
    operator_id?
    display_name?
    human_assignment?        # SOURCE CONTRACT PENDING
    copy
  secondary_signal?
    type
    source_entity_id
    label
  course_summaries[]
    course_enrollment_id
    course_label
    displayed_state
    last_activity_summary?
    relevant_assessment_summary?
  empty_state?
    reason_code
    title
    body
    cta_semantic?

No se define SQL, tabla ni persistencia para esta estructura.

11.4. Campos derivados

Campo	Derivación
overall_state	Señal mínima desde RiskSignal + estado del primary + disponibilidad de contexto; nunca score visible
primary.type	Precedencia operativa de lifecycle; nunca ranking académico
primary.reason_summary	Razón principal ya explicable de ActionRecommendation/RiskSignal/Commitment; una sola
primary.exam_context	Assessment + ExamPreparation cuando activos
primary.next_event_summary	Mapping determinístico al siguiente evento real; no outcome anticipado
human_fact	Sólo Intervention/assignment/review/feedback real
secondary_signal	Primer estado relevante no dominante y no duplicado
displayed_state de materia	Síntesis derivada; no porcentaje universal
	11.5. Reglas de composición y precedencia

Resolver inputs vigentes.
Excluir objetos finalizados/cancelados/reemplazados.
Recibir la recomendación principal ya priorizada por Academic Decision Engine.
Aplicar únicamente precedencia operativa de lifecycle.
Si existe ambigüedad dentro del mismo lifecycle, no crear ranking académico; exigir una lectura válida del servicio propietario o usar el error técnico existente.
Seleccionar una causa principal no repetida.
Adjuntar contexto de riesgo/examen sin modificar la recomendación.
Añadir humano sólo si existe hecho operacional.
Construir a lo sumo una señal secundaria mobile.
Construir Materias sin repetir la causa del Hero ni reordenarlas académicamente desde TodayView.

11.6. Fallbacks por fuente no disponible

Fuente ausente/no confiable	Comportamiento
Student/timezone	No mostrar horas relativas sin base; si Student no carga, error técnico de pantalla
recomendación principal del Engine	Si existe Action/Commitment activo, usar ese lifecycle; de lo contrario no elegir otra materia desde TodayView
Commitment	No afirmar hora, due, missed o rescue
RiskSignal	No afirmar Bajo control; usar estado neutral derivado del objeto operativo o no mostrar clasificación de riesgo
Assessment.date	Mostrar Modo Examen sin cuenta regresiva
ExamPreparation	No mostrar fase/hito; la Action puede seguir visible si es válida
Evidence	No afirmar envío/revisión; mostrar expected evidence sólo si el source contract la expone
Intervention	Omitir humano por completo
SLA operativo	Mostrar Esperando revisión/intervención abierta sin hora prometida
resumen de una materia	Omitir esa síntesis; no inventar brecha/recencia
múltiples recomendaciones sin principal	No rankear; usar No pudimos cargar Hoy hasta recibir una lectura válida
lectura completa falla	Estado técnico No pudimos cargar Hoy; no usar empty state académico
	11.7. Datos opcionales

topic label;
fecha/días de Assessment;
fase/hito de ExamPreparation;
última actividad;
señal secundaria;
human fact;
nombre del operador;
assessment relevante en una fila de materia.

La ausencia de un opcional elimina el bloque/línea; no deja placeholders ni genera copy especulativo.

***
12. ANALYTICS EVENTS

12.1. Eventos de pantalla

Evento	Trigger	Propiedades mínimas
TodayViewed	Proyección cargada y visible	actor_id, institution_id, primary_type, primary_source_id, overall_state, exam_active, risk_present, human_fact_present, secondary_signal_type?, course_count
TodayPrimaryCTASelected	CTA principal	primary_type, source_entity_type/id, cta_semantic, action_status?, commitment_state?, exam_active, risk_present
TodaySecondarySignalOpened	Abre incumplimiento/riesgo secundario	signal_type, source_entity_id, primary_type
CourseSummaryOpened	Abre Materia desde Hoy	course_enrollment_id, displayed_state, position, primary_course_match
ActionReasonExpanded	Abre detalle/razones completas	action_id, primary_type, reason_source
	human_fact_present se registra como propiedad de TodayViewed; no hace falta crear una impresión adicional.

12.2. Eventos de dominio que deben seguir cerrando el loop

ActionAccepted
CommitmentCreated
CommitmentStarted
CommitmentMissed
EvidenceSubmitted
EvidenceValidated
ProgressUpdated
RiskSignalCreated
InterventionStarted
InterventionResolved
RescueSucceeded
ExamPreparationActivated

La analítica de Hoy no reemplaza estos eventos ni duplica su outcome.

12.3. Propiedades para validar precedencia y verdad operacional

suppressed_missed_commitment_count: confirma que un missed anterior no desplazó trabajo activo.
human_fact_type: sólo si hubo un hecho real.
reason_source: evita razones inventadas.
primary_copy_variant: permite comparar comprensión sin cambiar producto.

Estas son propiedades analíticas, no UI ni entidades nuevas.

***
13. TEST DE 10 SEGUNDOS — ESTADOS MODIFICADOS

La simulación evalúa sólo la información visible above the fold. No sustituye pruebas con estudiantes reales.

A. ACTION_RECOMMENDED

Respuestas esperadas:

Qué hacer ahora: comprometerse con resolver ejercicios 1–5.
Materia: Programación.
Por qué: consolidar lo visto hoy.
Inmediatamente después: queda definido cuándo va a hacer la acción.

Resultado simulado: PASS.

No se promete actualización de progreso.

B. IN_PROGRESS

Respuestas esperadas:

Qué hacer ahora: continuar ejercicios 8–14.
Materia: Análisis II.
Por qué: preparar la próxima clase.
Inmediatamente después de terminar: subir la evidencia acordada.

Resultado simulado: PASS.

El missed anterior sigue below the fold y no compite.

C. EVIDENCE_PENDING

Respuestas esperadas:

Qué hacer ahora: subir foto/archivo de los ejercicios 8–14.
Materia: Análisis II.
Por qué: la Action se cierra con evidencia verificable.
Inmediatamente después del envío: la evidencia queda pendiente de validación.

Resultado simulado: PASS.

No se promete suficiencia, reviewer ni tiempo.

D1. COMMITMENT_MISSED + RESCUE_REQUIRED

Respuestas esperadas:

Qué hacer ahora: retomar y rearmar el compromiso.
Materia: Análisis II.
Por qué: el compromiso de las 19:00 quedó incumplido.
Inmediatamente después: definir cómo y cuándo retomar.

Resultado simulado: PASS.

No aparecen ejercicios, duración, horario ni evidencia inexistentes.

D2. RESCUE_MATERIALIZED

Respuestas esperadas:

Qué hacer ahora: empezar el rescate de ejercicios 8–10.
Materia: Análisis II.
Por qué: retomar el compromiso incumplido de ayer.
Inmediatamente después de terminar: subir la evidencia del rescate.

Resultado simulado: PASS.

El rescate concreto se muestra porque ya existe; no se presenta como cumplido.

E. Modo Examen + riesgo alto

Respuestas esperadas:

Qué hacer ahora: comprometerse con resolver ejercicios 12–18 de U4.
Materia: Análisis II; Parcial 1.
Por qué: falta práctica autónoma y quedan seis días.
Inmediatamente después: definir cuándo va a hacer la acción.

Resultado simulado: PASS WITH RISK.

Sigue siendo el estado con mayor densidad. Se eliminó Siguiente hito: prueba sin red del primer viewport porque no era necesariamente el siguiente evento operativo.

Resultado global

5 PASS.
1 PASS WITH RISK.
0 FAIL.

No se detectó un estado que requiera agregar una feature. El test real sigue siendo gate antes de high-fi.

***
14. REVERSIBLE UX ASSUMPTIONS

Copy exacto de Retomar para iniciar la definición de rescate.
Copy exacto de estados: Bajo control, Acción en curso, Necesita recuperación.
Una sola causa visible es suficiente para comprender prioridad.
Una señal secundaria como máximo en mobile.
CTA full-width en 360 px.
Estado general en una línea.
Materias comienzan below the fold.
Layout desktop aproximado 2/3 Hero + 1/3 Materias.
La fila de la materia dominante puede comprimirse más que otras.
TodayView se entrega como una proyección única; su forma técnica final pertenece a Architecture/API Spec.
ActionReasonExpanded puede resolverse abriendo Action, sin interacción nueva dedicada.
El hecho humano aparece below the fold salvo que cambie la acción actual.

Cambiar estos supuestos no debe alterar la precedencia, los loops ni el contrato de verdad.

***
15. SELF-AUDIT

15.1. Correcciones solicitadas para v0.3

Corrección	Resultado
FIX-01 — TodayView no prioriza académicamente	PASS — consume recomendación principal del Engine y sólo aplica lifecycle
FIX-02 — Después = siguiente evento real	PASS — mappings explícitos; sin outcomes anticipados
FIX-03 — Rescue required ≠ materialized	PASS — estados, CTAs y wireframes separados
FIX-04 — read contract sin falso ownership	PASS — cinco conceptos marcados SOURCE CONTRACT PENDING
	15.2. Verificación final requerida

Criterio	Resultado
TodayView no toma decisiones académicas	PASS
No hay outcomes anticipados	PASS
Rescue requerido no inventa Action/contenido	PASS
Rescue materializado usa objetos existentes	PASS
No se inventó ownership técnico	PASS
No se agregó ninguna feature	PASS
Mobile mantiene acción > información	PASS
JTBD no fue modificado	PASS
Product Spec y Design Spec no fueron modificados	PASS
Test simulado de estados cambiados	5 PASS, 1 PASS WITH RISK, 0 FAIL
	15.3. Features nuevas

Ninguna.

No se agregaron:

dashboards;
barras de progreso;
recordatorios;
chat;
navegación;
múltiples acciones;
score de readiness/riesgo;
calendario;
entidad TodayView;
SLA de revisión.

15.4. Change Requests

Ninguno.

15.5. Estado final

HOY / AUTOGESTIÓN — Functional Wireframe v0.3 Candidate queda:

READY FOR FINAL PRODUCT OWNER AUDIT

No queda aprobado para UI high-fi hasta ejecutar el test real de 10 segundos en 360 px, especialmente sobre Modo Examen + riesgo alto.


***

VI.2 — Materia / Cursado

ACHIEVE — MATERIA / CURSADO

FUNCTIONAL WIREFRAME v0.3 CANDIDATE

Estado: candidato de corrección controlada de v0.2, listo para reauditoría final de Lead Product Owner independiente.  
Fecha: 22 de agosto de 2026.  
Sprint: SPRINT UX 02 — MATERIA / CURSADO.  
Tipo: especificación funcional low-fi; no UI high-fi.  
Responsable: Senior Product Designer de Achieve.

Baseline obligatorio

ACHIEVE_MVP_USUARIO_PRODUCT_SPEC_v0.5_FINAL.
ACHIEVE_USER_FLOW_WIREFRAMES_DATA_MODEL_v0.2_FINAL.
ACHIEVE_HOY_AUTOGESTION_FUNCTIONAL_SPEC_v1.0_APPROVED.
ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_WIREFRAME_v0.1.md.
ACHIEVE_MATERIA_CURSADO_PRODUCT_OWNER_AUDIT_v0.1.md.
ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_WIREFRAME_v0.2_CANDIDATE.md.

Jerarquía aplicada

Product Spec v0.5 define visión, alcance, principios, mecanismos y responsabilidades de producto.
Design Spec v0.2 define flujos, estados, dominio conceptual y decisiones UX.
HOY aprobado define la conexión entre la pantalla principal y Materia/Cursado.
Este documento especifica únicamente la experiencia funcional de Materia > Cursado.

No se modifica silenciosamente ninguna decisión de las fuentes de verdad.

Alcance de esta revisión

Esta versión aplica exclusivamente los dos P1 que la auditoría final dejó abiertos:

MAT-P1-01: completar provenance y verification_status en todas las previews de actividad académica originada en clase;
MAT-P1-02: demostrar en un wireframe crítico mobile 360 px el estado Confianza alta + Dominio bajo demostrado.

No se modifica ningún otro punto de v0.2, no se agregan features, navegación, CTAs, engines ni entidades, y no se reabre lo ya aprobado.

***
1. RESULTADO FUNCIONAL

Materia/Cursado queda resuelta como el espacio persistente donde el alumno puede:

ver el último ritmo confirmado de la cátedra;
ver su propio estado real;
reconocer si existe una brecha y por qué importa;
inspeccionar Recorrido, Práctica, Dominio, Confianza y Recencia sin colapsarlas en un % aprendido;
ejecutar la próxima acción entregada por el Academic Decision Engine;
registrar cambios relevantes ocurridos en clase con mínima fricción;
ver próximos eventos académicos relevantes sin usar un calendario completo;
revisar actividad reciente y trabajo acumulado en una Bitácora privada.

Decisión de arquitectura de pantalla

> La pantalla conduce primero y explica después.

El orden funcional es:

estado de materia → acción actual → cátedra vs. alumno → próximo → unidades/temas → actividad reciente → trabajo acumulado/Bitácora

La acción ocupa el primer viewport. La comparación de ritmo y el historial aportan contexto, pero no obligan al alumno a analizar un tablero para descubrir qué hacer.

Resultado respecto del Gantt

El Design Spec ubica el timeline/Gantt refinado en P1. Por lo tanto:

P0 sí muestra cátedra vs. alumno;
P0 usa una comparación paralela simple, basada en ClassSession y temas confirmados;
P0 no implementa un Gantt completo ni una escala temporal densa;
la forma gráfica definitiva de esa comparación permanece reversible;
una evolución a timeline/Gantt no debe cambiar la semántica ni los datos de P0.

***
2. JOB TO BE DONE

Cuando el estudiante entra a una materia durante el semestre, debe poder pasar de “no sé cómo vengo” a entender la situación y ejecutar el trabajo concreto que evita o reduce una brecha, sin reconstruir mentalmente clases, tareas, evidencias y progreso.

En menos de 10 segundos debe responder:

¿Cómo está esta materia?
¿Qué tengo que hacer ahora?
¿Por qué esta acción importa?
¿Dónde está la cátedra y dónde estoy yo?

Con profundización progresiva debe responder:

¿Qué recorrí, practiqué, demostré y qué creo dominar?
¿Qué ocurrió recientemente?
¿Qué viene próximo?
¿Qué trabajo real acumulé?

Loop que mueve la pantalla

contexto de cursado → recomendación del Engine → compromiso → ejecución → evidencia → progreso → Bitácora → actualización de brecha/riesgo → nueva decisión

***
3. ALCANCE Y EXCLUSIONES

3.1. Incluye

estado operativo de una materia activa;
ritmo de cátedra confirmado;
progreso personal por unidad/tema y dimensiones reales;
brecha explicable;
próxima acción académica concreta;
lifecycle visible de Action, Commitment y Evidence dentro de la materia;
captura mínima de eventos de clase P0;
evaluaciones, entregas y clases próximas relevantes;
actividad reciente;
resumen acumulado y acceso a Bitácora;
conexión visible con Modo Examen cuando corresponda;
estados vacíos, incompletos, de carga y error;
adaptación desktop;
contrato funcional de lectura y mutación.

3.2. No incluye

LMS;
calendario universitario completo;
editor o repositorio general de apuntes;
biblioteca o marketplace de recursos;
gestor de archivos;
dashboard analítico;
ranking o score único de aprendizaje;
feed social;
protocolo completo de Modo Examen;
corrección académica universal;
conversación completa con acompañante;
reglas nuevas de Academic Decision o Risk Engine;
Gantt refinado P1;
SQL, endpoints o arquitectura técnica.

3.3. Regla de no duplicación

Materia/Cursado no reemplaza:

Hoy, que elige la conducta operativa dominante entre objetos ya priorizados;
Academic Decision Engine, que decide qué trabajo académico conviene;
Risk Engine, que deriva brecha/riesgo;
Evidence System, que determina lifecycle y señales demostradas;
Exam Protocol, que define hitos de preparación;
Bitácora, que conserva el historial completo;
Calendar/LMS, que mantienen funciones maduras externas cuando existan.

***
4. SEPARACIÓN DE RESPONSABILIDADES

Pregunta	Dueño	Qué recibe Materia/Cursado	Qué no hace la vista
¿Qué se dictó realmente?	Academic Data Layer + CourseOffering/ClassSession	último ritmo confirmado, temas observados, fuente y fecha	no infiere una clase futura como hecho
¿Dónde está el alumno?	TopicProgress + Evidence System	dimensiones y última actividad	no transforma actividad en dominio
¿Existe brecha?	Risk Engine / servicio propietario de progreso	estado y explicación derivada	no calcula severidad en frontend
¿Qué conviene hacer ahora?	Academic Decision Engine	ActionRecommendation de esta materia	no rankea temas ni crea una prioridad paralela
¿Qué está en curso?	Action + Commitment + Evidence	lifecycle vigente dentro de la materia	no reescribe estados
¿Falta contexto académico crítico?	Academic Data Layer como owner funcional del contexto + Academic Decision Engine para disponibilidad de recomendación	bloqueo proyectado, objeto afectado, dato faltante, razón, resolución y vigencia	no decide que falta un dato ni que ese faltante bloquea una recomendación
¿Cómo se registra/corrige lo reportado en clase?	Academic Data Layer como owner funcional del dato académico y su provenance	confirmación de create/correct/version y verification status vigente	no persiste localmente ni convierte el reporte en hecho confirmado
¿Qué ocurrió recientemente?	eventos de dominio / ProgressEntry	actividad normalizada	no inventa una narrativa
¿Qué trabajo se acumuló?	ProgressEntry + Evidence + Commitment	resumen factual	no lo convierte en score de aprendizaje
¿Quién interviene?	Intervention Engine / CRM	hecho humano autorizado	no muestra presencia humana decorativa
¿Qué viene?	Assessment + ClassSession + tareas/entregas confirmadas	lista breve de eventos relevantes	no construye calendario completo
	Regla académica central

> Materia/Cursado consume la recomendación del Academic Decision Engine. No compara unidades, evaluaciones o acciones para decidir por su cuenta qué debería estudiar el alumno.

La vista puede aplicar precedencia operacional dentro de la materia para continuar una Action iniciada, cerrar evidencia o respetar un Commitment vigente. Esa precedencia no equivale a prioridad académica.

***
5. ENTRADAS, SALIDAS Y CONTINUIDAD CON HOY

5.1. Entradas válidas

fila de materia desde Hoy;
contexto secundario Ver materia desde Action, Commitment o Evidence;
área existente Materias;
retorno desde una unidad/tema;
retorno desde Bitácora;
retorno desde Examen a Cursado.

5.2. Contexto preservado

Al entrar desde Hoy:

se abre el CourseEnrollment seleccionado;
si Hoy mostraba una Action/Commitment/Evidence de esa materia, Materia conserva ese objeto como bloque primario;
Materia no duplica el copy exacto de Hoy si puede usar una síntesis más contextual;
la CTA mantiene el mismo destino semántico y lifecycle;
la vista no presenta otra acción como competidora.

5.3. Salidas válidas

detalle de Action;
creación/detalle de Commitment;
ejecución de Action;
carga/detalle de Evidence;
detalle de unidad/tema;
Bitácora completa;
captura de evento de clase;
contexto Examen si corresponde;
navegación de retorno existente.

No se agrega una navegación global nueva en este sprint.

***
6. JERARQUÍA MOBILE FIRST

6.1. Orden semántico

Header de materia: nombre + retorno.
Selector contextual: CURSADO | EXAMEN sólo cuando Examen es aplicable.
Estado mínimo: estado de materia + última actividad.
Primary Action: objeto operativo o recomendación del Engine, una razón, salida/evidencia y una CTA.
Cátedra vs. vos: último ritmo confirmado, estado personal y brecha derivada.
Próximo: máximo de eventos relevantes, no calendario.
Unidades y temas: síntesis y drill-down dimensional.
Actividad reciente: últimas entradas.
Trabajo acumulado + Bitácora: resumen factual y acceso al timeline completo.

6.2. Contrato del primer viewport de 360 px

El primer viewport debe contener:

materia;
contexto Cursado;
estado de materia en una línea;
última actividad cuando existe;
Action/estado operativo dominante;
una razón principal;
evidencia o criterio de cierre cuando aplica;
CTA primaria full-width.

Puede asomar el encabezado CÁTEDRA Y VOS, pero no se comprime la Action para mostrar más analytics.

No se coloca entre estado y CTA:

tabla de unidades;
lista de próximos eventos;
estadísticas acumuladas;
recursos generales;
feedback humano histórico;
barras múltiples;
calendario;
una segunda recomendación;
CTA de Modo Examen competidora.

6.3. Un dato, un dueño visual

Información	Dueño visual principal	Representación secundaria
Estado de materia	franja mínima	no se repite como alerta
Próxima conducta	Primary Action	no se duplica en unidades
Razón académica	Primary Action	brecha usa síntesis, no la misma frase
Cátedra vs. alumno	bloque de ritmo	estado muestra sólo categoría
Dimensiones de progreso	detalle de unidad/tema	overview usa síntesis sin % aprendido
Próximo evento	bloque Próximo	Examen puede aparecer en selector contextual
Actividad reciente	preview de Bitácora	resumen acumulado no repite eventos
Trabajo acumulado	cabecera de Bitácora	no se interpreta como dominio
Humano	entrada/Intervention/feedback factual	nunca decoración persistente
	***
7. WIREFRAME BASE — MOBILE 360 PX

+--------------------------------------+
| <- ANALISIS MATEMATICO II            |
| CURSADO | EXAMEN · Parcial 1         |
+--------------------------------------+
| NECESITA ATENCION · avance hace 2 d  |
+--------------------------------------+
| AHORA                                |
| Unidad 3                             |
| Resolver ejercicios 8–14             |
|                                      |
| Porque: prepara la próxima clase.    |
| 60–75 min · Entrega: 7 ejercicios   |
|                                      |
| [        COMPROMETERME             ] |
+--------------------------------------+
| CATEDRA Y VOS                        |
| Reporte de clase · U4 iniciada       |
| Reportado por vos · sin corroborar   |
| Vos · U3 con práctica pendiente      |
| Brecha · existe y requiere atención  |
| [ Ver recorrido ]                    |
+--------------------------------------+
| PROXIMO                              |
| Vie · Clase · continúa U4            |
| Mar · Entrega · Guía 5               |
+--------------------------------------+
| UNIDADES                             |
| U1 · práctica registrada · 12 ago    |
| U2 · práctica en construcción        |
| U3 · necesita atención               |
| U4 · recorrido inicial               |
| [ Ver todas ]                        |
+--------------------------------------+
| ACTIVIDAD RECIENTE                   |
| Hoy · 7 ejercicios · 68 min          |
| 18 ago · clase: comenzó U4           |
| Reportado por vos                    |
| Estado · pendiente de corroboración  |
| [ Ver Bitácora ]                     |
+--------------------------------------+
| TRABAJO ACUMULADO                    |
| 9 sesiones · 74 ejercicios · 8 h 20 |
| 6 evidencias · 1 rescate             |
+--------------------------------------+
| [ Pasó algo en clase ]               |
+--------------------------------------+

Los valores son ejemplos de contenido; no definen umbrales ni cálculos.

***
8. BLOQUES FUNCIONALES

8.1. Header y contexto CURSADO | EXAMEN

Contenido

nombre de Course;
CourseOffering/cátedra sólo si evita ambigüedad;
retorno;
estado activo CURSADO;
acceso EXAMEN sólo si existe Assessment relevante o ExamPreparation.

Estados de Examen

Condición	Representación en Cursado	Al seleccionar
Sin Assessment relevante	EXAMEN no se muestra	no aplica
Assessment próximo, sin preparación	EXAMEN · {nombre}	abre activación/recomendación existente; no protocolo en Cursado
ExamPreparation activa	EXAMEN · {días} si fecha confiable	abre contexto Examen
Assessment sin fecha confiable	EXAMEN · {nombre} sin countdown	no inventa días
	La pestaña no se convierte en CTA primaria de la pantalla.

8.2. Estado de materia

Función

Dar una lectura mínima antes de la acción.

Puede mostrar

Bajo control sólo si existe una lectura confiable del Risk Engine/servicio propietario;
Necesita atención;
En riesgo;
Intervención activa, sólo si esa es la síntesis autorizada y existe el objeto;
Contexto incompleto;
estado neutral si no existe señal suficiente;
última actividad útil.

No puede mostrar

score numérico de riesgo;
probabilidad de aprobación;
Bajo control por ausencia de datos;
brecha detallada repetida;
nombre de operador sin intervención real.

8.3. Primary Action

Regla

El bloque representa, dentro del CourseEnrollment actual:

Action IN_PROGRESS vigente;
Action EVIDENCE_PENDING que requiere conducta del alumno;
Commitment CONFIRMED/DUE vigente;
rescate materializado o resolución de missed, según lifecycle real;
ActionRecommendation de la materia provista por Academic Decision Engine;
acción de completar contexto cuando academic_context_blocker la entrega y no existe recomendación válida para la materia;
estado informativo honesto si no existe conducta disponible.

No usa brecha, evaluación, dificultad, edad del tema o recencia para crear su propio ranking.

Contenido máximo

contexto unidad/tema;
verbo + alcance;
una causa principal;
tiempo estimado cuando existe contrato;
evidencia/criterio de cierre cuando existe contrato;
una CTA primaria;
estado siguiente sólo cuando ayuda y respeta lifecycle.

CTA por lifecycle

Estado	CTA	Destino real
RECOMMENDED	Comprometerme	definición de Commitment
Commitment futuro	Ver compromiso	detalle de Commitment
Commitment startable	Empezar	inicio de Commitment/Action
IN_PROGRESS	Continuar	Action activa
EVIDENCE_PENDING	Subir evidencia	Evidence submission
Evidence enviada sin nueva acción	Ver evidencia	detalle de Evidence
Evidence validada sin nueva acción	Ver avance	impacto/ProgressEntry
MISSED / RESCUE_REQUIRED	Retomar	resolución del incumplimiento
rescue materializado startable	Empezar rescate	Action/Commitment de rescate
contexto incompleto proyectado	Actualizar cursado	resolución indicada por academic_context_blocker
sin acción disponible	sin CTA o Ver unidades, según contenido real	exploración no priorizada
	Consistencia con Hoy

Si Hoy y Materia muestran el mismo objeto:

misma CTA semántica;
mismo source entity;
mismo lifecycle;
misma razón propietaria, aunque Materia pueda ampliar contexto debajo;
ningún outcome anticipado.

8.4. Cátedra y vos

Objetivo

Responder sin una escala falsa:

qué trabajó la cátedra;
qué construyó el alumno;
si existe brecha;
de qué información se puede estar seguro.

Cátedra

Muestra:

última ClassSession confirmada;
fecha;
uno o más temas observados;
relación observada: comenzó / continuó / reforzó / cerró, cuando el dato la expresa;
fuente/estado de verificación al profundizar.

source_type, contexto de clase y verification_status son datos distintos:

source_type=student identifica quién reportó el dato;
la ClassSession o fecha de observación identifica el contexto en el que se produjo;
verification_status indica si permanece unverified, fue corroborated, es official o quedó disputed.

Un reporte del alumno nunca se presenta como voz o hecho confirmado de la cátedra sólo por haberse registrado durante/después de una clase.

No muestra como hecho:

contenido futuro sólo porque aparece en cronograma;
una unidad completa por una sola clase;
porcentaje de cátedra si no existe una medida legítima;
inferencia sin etiqueta.

Vos

Muestra una síntesis basada en TopicProgress y actividad:

unidad/tema personal relevante;
dimensión que requiere atención;
última actividad;
evidencia reciente cuando cambia la lectura.

Brecha

La vista consume una síntesis derivada:

sin brecha relevante;
brecha presente;
brecha no determinable.

La explicación puede indicar, por ejemplo, la cátedra comenzó U4 y todavía falta práctica base de U3, siempre que esa relación provenga de los servicios propietarios.

No expresa 1,5 unidades de atraso salvo que exista un cálculo de dominio aprobado y explicable. P0 no lo requiere.

Confirmado vs. futuro

Tipo	Label obligatorio	Tratamiento
Reporte estudiantil no corroborado	Reportado por vos · pendiente de corroboración o copy equivalente	observación; no hecho confirmado de cátedra
Clase corroborada/oficial	Confirmado o copy equivalente	hecho; sólo si el servicio propietario entrega ese verification status
Cronograma oficial futuro	Programado	hecho futuro, no ocurrido
Inferencia/predicción	Estimado	nunca se mezcla visualmente con confirmado
Sin información suficiente	Último ritmo confirmado: {fecha}	no completa huecos; reportes pendientes pueden mostrarse aparte con su estado
	8.5. Próximo

Contenido permitido

próxima ClassSession confiable;
Assessment relevante;
tarea/entrega confirmada;
cambio de fecha vigente.

Reglas

lista breve, orden cronológico;
muestra tipo, fecha/hora si confiable y título;
distingue Programado, Confirmado o Actualizado cuando aporta verdad;
no permite navegar un calendario mensual;
no mezcla recordatorios personales generales;
no define la prioridad académica de la Action;
un evento próximo puede explicar una recomendación sólo si el Engine lo usó.

Si existen más eventos, el acceso secundario debe dirigir a la fuente existente o usar progressive disclosure dentro de la materia; no se diseña Calendar en este sprint.

8.6. Unidades y temas

Overview

Cada unidad —modelada como Topic padre cuando corresponda— muestra:

nombre/código;
síntesis corta no equivalente a % aprendido;
dimensión que requiere atención, si existe;
última actividad;
señal de cátedra cuando el tema ya fue trabajado/confirmado.

Detalle de unidad/tema

Al profundizar se conservan separadas:

Dimensión	Pregunta	Ejemplo de representación factual
Recorrido	¿Tuvo contacto relevante?	clases/lecturas/recursos registrados
Práctica	¿Produjo trabajo?	ejercicios, problemas, resúmenes o código
Dominio	¿Puede aplicar sin apoyo completo?	prueba sin red/simulación/evidencia aplicable
Confianza	¿Cuánto cree dominarlo?	valor autorreportado con fecha
Recencia	¿Cuándo fue el último trabajo útil?	fecha o tiempo relativo confiable
	Wireframe de detalle

+--------------------------------------+
| <- UNIDAD 3                          |
| Integrales múltiples                 |
+--------------------------------------+
| CATEDRA                              |
| Cerró el tema · confirmado · 18 ago |
+--------------------------------------+
| TU PROGRESO                          |
| Recorrido  · 3 actividades           |
| Práctica   · 12 ejercicios           |
| Dominio    · no evaluado             |
| Confianza  · alta · registrada ayer  |
| Recencia   · hace 2 días             |
+--------------------------------------+
| ATENCION                             |
| Confianza alta sin dominio evaluado  |
+--------------------------------------+
| ACTIVIDAD RECIENTE                   |
| 7 ejercicios · evidencia enviada     |
| 1 clase · tema reforzado             |
| Reportado por vos                    |
| Estado · pendiente de corroboración  |
+--------------------------------------+

Los valores son ilustrativos. El wireframe no define escalas, umbrales ni una normalización común.

Estados de Confianza alta y Dominio

La misma zona de detalle debe diferenciar sin colapsar dimensiones:

Estado recibido	Representación neutral	Regla
Confianza alta + Dominio no evaluado	Confianza alta · Dominio no evaluado + Todavía no hay una prueba de dominio comparable.	ausencia de evaluación no se representa como dominio bajo
Confianza alta + Dominio bajo demostrado	Confianza alta · Dominio bajo demostrado + La evidencia disponible todavía no coincide con tu percepción. Conviene reforzar y volver a probar.	sólo aparece si Student/Risk Model entrega la brecha derivada y su explicación; la vista no compara umbrales
Confianza alta + Dominio consistente	Confianza alta · Dominio consistente con la evidencia disponible	no convierte consistencia puntual en dominio universal
	La explicación no invalida al alumno ni oculta la evidencia. Confianza y Dominio siguen visibles como dimensiones independientes.

Regla de síntesis

La UI puede usar una síntesis visual en overview, pero:

no se etiqueta % aprendido;
no promedia las cinco dimensiones;
no convierte confianza en dominio;
nombra la dimensión relevante (práctica registrada, dominio no evaluado, dominio bajo demostrado, sin actividad reciente) en vez de usar estados generales como consolidada;
si no existe semántica aprobada para mostrar una dimensión, omite la síntesis o muestra un hecho comprensible; nunca expone un valor interno bruto;
siempre permite llegar a las dimensiones reales;
usa texto/iconografía además de color.

8.7. Actividad reciente

Muestra una preview cronológica de eventos relevantes de esta materia:

Action iniciada/completada;
Commitment cumplido, renegociado, missed o rescatado;
Evidence submitted/validated/insufficient;
cambio de TopicProgress;
ClassSession confirmada o reporte de clase con source y verification status visibles;
hito de evaluación o ExamPreparation;
feedback humano ya emitido y autorizado.

Reglas

máximo visual P0 en pantalla principal: últimas 2–3 entradas;
orden descendente por evento real;
sin CTA social;
no expone reflexión íntima en overview si no es necesaria;
cada entrada abre su objeto o Bitácora cuando existe destino;
no se fabrica impacto si el progreso no cambió.

8.8. Trabajo acumulado

Función

Hacer tangible el esfuerzo sostenido sin convertirlo en score académico.

Métricas factuales permitidas

sesiones;
tiempo real registrado;
ejercicios/producciones;
evidencias;
compromisos cumplidos;
rescates;
unidades/temas trabajados;
hitos.

Prohibiciones

sumar actividad heterogénea en un único puntaje;
usar el volumen como prueba de dominio;
ranking contra otros alumnos;
rachas competitivas;
likes o celebraciones sociales.

8.9. Bitácora de Avance

La pantalla principal muestra preview + resumen. Ver Bitácora abre el timeline completo ya decidido por el Design Spec.

Cabecera

resumen acumulado de la materia;
período cubierto;
filtros Todo / Unidad / Examen / Hitos.

Tarjeta de Bitácora

fecha;
acción;
unidad/tema;
producción;
tiempo;
Evidence;
reflexión breve, si existe;
feedback humano real, si existe;
cambio de progreso, si ocurrió;
hito, si corresponde.

Wireframe

+--------------------------------------+
| <- BITACORA · ANALISIS II            |
| Ago–Nov 2026                         |
+--------------------------------------+
| 9 sesiones · 74 ejercicios          |
| 8 h 20 min · 6 evidencias · 1 rescate|
+--------------------------------------+
| Todo | Unidad | Examen | Hitos        |
+--------------------------------------+
| HOY · Unidad 3                       |
| 7 ejercicios · 68 min                |
| Evidencia enviada                    |
| "Costó arrancar; después salió."     |
+--------------------------------------+
| 18 AGO · Clase                       |
| Reportaste: comenzó Unidad 4         |
| Pendiente de corroboración           |
+--------------------------------------+
| 16 AGO · Rescate                     |
| 3 ejercicios · 22 min · cumplido     |
| Compromiso original: incumplido      |
+--------------------------------------+

El rescate no borra ni maquilla el Commitment original.

***
9. CAPTURA MÍNIMA — PASÓ ALGO EN CLASE

9.1. Principio

No se solicita una ficha completa después de cada clase. El acceso aparece como acción secundaria persistente, contextual a la materia, y captura sólo información capaz de modificar mapa, fechas, tareas o decisiones.

9.2. Entrada

Pasó algo en clase

La interacción puede resolverse como sheet, modal o pantalla breve. La forma es reversible; los pasos y datos mínimos no.

9.3. Paso 1 — qué cambió

+--------------------------------------+
| PASO ALGO EN CLASE                   |
| ¿Qué querés registrar?               |
|                                      |
| [ Subió prioridad de un tema ]       |
| [ Bajó prioridad de un tema ]        |
| [ Cambió una fecha ]                 |
| [ Hay una tarea o entrega ]          |
| [ Nota contextual ]                  |
+--------------------------------------+

9.4. Datos mínimos por tipo

Tipo	Requerido	Opcional	No pedir
Subir prioridad	tema	frase/contexto breve	score o peso numérico
Bajar prioridad	tema	frase/contexto breve	eliminar el tema del programa
Cambio de fecha	evaluación/tarea afectada + nueva fecha conocida	nota	rearmar calendario completo
Tarea/entrega	descripción + fecha si fue informada	tema, evidencia esperada	formulario de LMS
Nota contextual	texto breve	tema/s relacionado/s	editor de apuntes, formato rico
	En todos los casos se conserva automáticamente cuando está disponible:

CourseOffering;
ClassSession asociada o fecha de observación;
actor;
source_type=student;
contexto de clase separado del tipo de fuente, mediante la relación/campo que cierre el contrato, vinculado a ClassSession cuando exista o a la fecha de observación;
observed_at;
verification_status, inicialmente el que confirme el servicio propietario y nunca elevado por la vista;
posibilidad de corrección.

9.5. Confirmación

Copy permitido:

Registrado en Análisis II.
Quedó guardado como tu reporte de esta clase.
Estado: pendiente de corroboración.

La última línea usa el estado real devuelto por el servicio propietario. Si el reporte ya fue corroborado u oficializado, la UI puede mostrar ese estado; no lo decide por el contexto de captura.

No se promete que una prioridad, RiskSignal, contexto académico o Action cambie inmediatamente. Si un proceso real recalcula y devuelve un cambio, ese cambio se muestra como evento separado.

9.6. Corrección

La entrada aparece en Actividad reciente/Bitácora.
El alumno puede abrirla y corregirla.
La corrección conserva trazabilidad; no sobrescribe silenciosamente el origen.
La versión corregida conserva source_type, contexto y verification status como dimensiones independientes.
Una corrección no edita retroactivamente decisiones ya ejecutadas sin registro.

9.7. Relaciones contextuales

Frases como Para entender U5 hay que saber U3 se guardan en P0 como nota contextual con temas relacionados si el contrato lo permite. Este wireframe no crea una nueva relación estructural de prerequisito: elevar esa nota a Topic.prerequisites requiere validación/curación del dominio propietario.

***
10. ESTADOS CRÍTICOS — WIREFRAMES 360 PX

A. Bajo control + ActionRecommendation

+--------------------------------------+
| <- PROGRAMACION I                    |
| CURSADO                              |
+--------------------------------------+
| BAJO CONTROL · avance hoy            |
+--------------------------------------+
| AHORA · UNIDAD 4                     |
| Resolver ejercicios 1–5              |
| Porque: consolida lo visto hoy.      |
| 40 min · Entrega: 5 ejercicios      |
| [        COMPROMETERME             ] |
+--------------------------------------+
| CATEDRA Y VOS                        |
| Cátedra · U4 iniciada · corroborado  |
| Vos · U4 con recorrido, sin práctica |
| Brecha · no relevante                |
+--------------------------------------+

No muestra: porcentaje aprendido, calendario, humano, otra recomendación.

B. Brecha de cursado + recomendación

+--------------------------------------+
| <- ANALISIS II                       |
| CURSADO | EXAMEN · Parcial 1         |
+--------------------------------------+
| NECESITA ATENCION · avance hace 2 d  |
+--------------------------------------+
| AHORA · UNIDAD 3                     |
| Resolver ejercicios 8–14             |
| Porque: prepara la próxima clase.    |
| 60–75 min · Entrega: 7 ejercicios   |
| [        COMPROMETERME             ] |
+--------------------------------------+
| CATEDRA Y VOS                        |
| Cátedra · comenzó U4 · confirmado    |
| Vos · U3 con práctica pendiente      |
| Brecha · requiere atención           |
+--------------------------------------+

No muestra: un cálculo propio de prioridad, 1,5 unidades, score de riesgo.

C. Action IN_PROGRESS

+--------------------------------------+
| <- ANALISIS II · CURSADO             |
+--------------------------------------+
| ACCION EN CURSO                      |
+--------------------------------------+
| UNIDAD 3                             |
| Resolver ejercicios 8–14             |
| En curso · Entrega: 7 ejercicios    |
| [            CONTINUAR             ] |
+--------------------------------------+
| CATEDRA Y VOS                        |
| Cátedra · U4 iniciada · corroborado  |
| Vos · trabajando práctica de U3      |
+--------------------------------------+

Un missed anterior puede aparecer en Actividad reciente, pero no desplaza la Action activa.

D. EVIDENCE_PENDING

+--------------------------------------+
| <- ANALISIS II · CURSADO             |
+--------------------------------------+
| FALTA CERRAR ESTA ACCION             |
+--------------------------------------+
| UNIDAD 3                             |
| Subí los ejercicios 8–14             |
| Entrega: foto/archivo                |
| [        SUBIR EVIDENCIA           ] |
+--------------------------------------+
| ACTIVIDAD RECIENTE                   |
| Acción realizada · falta evidencia   |
+--------------------------------------+

No promete suficiencia, validación humana, responsable ni hora.

E. Ritmo de cátedra desconocido, Action válida

+--------------------------------------+
| <- FISICA I · CURSADO                |
+--------------------------------------+
| CONTEXTO PARCIAL · avance ayer       |
+--------------------------------------+
| AHORA · CINEMATICA                   |
| Resolver problemas 3–6               |
| Porque: falta práctica autónoma.     |
| [        COMPROMETERME             ] |
+--------------------------------------+
| CATEDRA Y VOS                        |
| Último ritmo confirmado: U2 · 12 ago |
| No sabemos qué se vio después.       |
| [ Pasó algo en clase ]               |
+--------------------------------------+

La falta de ritmo no elimina una Action válida ni la reemplaza con captura de datos.

F. Contexto incompleto bloquea la materia

+--------------------------------------+
| <- FISICA I · CURSADO                |
+--------------------------------------+
| FALTA ACTUALIZAR EL CURSADO          |
+--------------------------------------+
| No sabemos qué trabajó la cátedra    |
| desde la clase del 12 de agosto.     |
|                                      |
| Confirmá qué pasó en la última clase.|
| [       ACTUALIZAR CURSADO         ] |
+--------------------------------------+
| TU ULTIMO AVANCE                     |
| U2 · 6 problemas · hace 4 días       |
+--------------------------------------+

Se usa sólo cuando el contrato academic_context_blocker entrega el bloqueo vigente y el Academic Decision Engine no entrega una recomendación válida para esta materia. El título, el dato faltante, la razón y la acción de resolución se proyectan desde ese contrato; Materia no los redacta ni deriva localmente. No inventa una acción académica.

G. Materia nueva sin actividad personal

+--------------------------------------+
| <- ARQUITECTURA · CURSADO            |
+--------------------------------------+
| TODAVIA SIN AVANCE REGISTRADO        |
+--------------------------------------+
| AHORA                                |
| Revisar programa y confirmar U1      |
| Porque: completa el mapa mínimo.     |
| [        COMPROMETERME             ] |
+--------------------------------------+
| CATEDRA Y VOS                        |
| Cátedra · U1 iniciada · confirmado   |
| Vos · sin actividad registrada       |
+--------------------------------------+
| BITACORA                             |
| Tu trabajo va a aparecer acá.        |
+--------------------------------------+

La Action existe sólo si fue entregada por el Engine. El empty state no equivale a atraso.

H. Assessment próximo sin ExamPreparation activa

+--------------------------------------+
| <- ANALISIS II                       |
| CURSADO | EXAMEN · Parcial 1         |
+--------------------------------------+
| NECESITA ATENCION · avance hace 2 d  |
+--------------------------------------+
| AHORA · UNIDAD 3                     |
| Resolver ejercicios 8–14             |
| [        COMPROMETERME             ] |
+--------------------------------------+
| PROXIMO                              |
| Parcial 1 · 23 días · programado     |
+--------------------------------------+

Cursado no inserta el protocolo ni convierte la activación en CTA competidora.

I. ExamPreparation activa mientras se consulta Cursado

+--------------------------------------+
| <- ANALISIS II                       |
| CURSADO | EXAMEN · 9 DIAS            |
+--------------------------------------+
| NECESITA ATENCION · avance hace 2 d  |
+--------------------------------------+
| AHORA                                |
| EXAMEN · Parcial 1                   |
| [Action vigente de la materia]       |
| [CTA según lifecycle]                |
+--------------------------------------+
| CURSADO ACUMULADO                    |
| El progreso y la Bitácora continúan  |
| disponibles en este contexto.        |
+--------------------------------------+

La franja conserva el estado propio de Cursado. El tab comunica que existe ExamPreparation y abre su contexto. Si la Action pertenece a esa preparación, el bloque identifica EXAMEN · {Assessment} sin insertar otra CTA ni el protocolo completo, que vive en EXAMEN.

J. Confianza alta + Dominio bajo demostrado

+--------------------------------------+
| <- UNIDAD 3 · ANALISIS II            |
| Integrales múltiples                 |
+--------------------------------------+
| CONFIANZA DECLARADA                  |
| Alta · registrada ayer               |
+--------------------------------------+
| DOMINIO DEMOSTRADO · BAJO            |
| Evidencia: 2/7 correctos sin ayuda   |
| Registrada el 20 ago                 |
+--------------------------------------+
| SON DOS SEÑALES DISTINTAS            |
| Tu confianza refleja cómo te sentís. |
| El dominio refleja la evidencia.     |
| Hoy todavía no coinciden.            |
|                                      |
| Esto orienta qué reforzar; no es una |
| calificación personal.               |
+--------------------------------------+

Este estado sólo aparece si Student/Risk Model entrega la brecha derivada y su explicación. La vista no compara umbrales, no reduce Confianza ni Dominio a un único estado y no crea una nueva Action.

***
11. CONFLICTOS Y PRECEDENCIA DENTRO DE LA MATERIA

Conflicto	Resolución funcional
Action IN_PROGRESS + recomendación nueva	mostrar Action activa; recomendación no compite
EVIDENCE_PENDING + próxima clase cercana	mostrar cierre de Evidence; clase queda en Próximo
Commitment startable + brecha alta	mostrar Commitment; brecha modifica estado/contexto, no CTA
missed anterior + Action vigente	Action vigente primaria; missed en historial/señal secundaria
RESCUE_REQUIRED + recomendación no aceptada	resolver incumplimiento; no mostrar segunda CTA
Evidence bajo revisión + nueva Action válida	nueva Action primaria; revisión en actividad reciente
Assessment próximo + Action de cursado válida	Action primaria; Assessment en selector/Próximo
ExamPreparation activa + Action del examen	misma Action visible; tab indica contexto Examen
ritmo desconocido + Action válida	Action primaria; pedido de actualización secundario
ritmo desconocido + sin Action válida	actualización de contexto primaria
confianza alta + dominio no evaluado	mostrar ambas dimensiones y aclarar ausencia de prueba comparable; no inferir dominio bajo
confianza alta + dominio bajo demostrado	mostrar ambas dimensiones + explicación neutral sólo si Student/Risk Model entrega la brecha derivada; la vista no compara umbrales
confianza alta + dominio consistente	mostrar consistencia con la evidencia disponible sin afirmar dominio universal
múltiples recomendaciones de la materia sin principal	error de contrato; la vista no rankea
	***
12. EMPTY, LOADING, ERROR Y DATOS PARCIALES

12.1. Loading

Cargando Análisis II…

No muestra progreso o recomendación parcial como definitiva.

12.2. Error de pantalla

No pudimos cargar esta materia.
[ Reintentar ]

Reintentar ejecuta una lectura real.

12.3. Sección sin datos

Cada sección falla de forma independiente cuando el resto sigue siendo útil:

Fuente faltante	Comportamiento
RiskSignal/estado derivado	estado neutral; nunca Bajo control
ClassSession	Sin ritmo confirmado + captura secundaria
TopicProgress	Sin avance registrado por dimensión; no cero
confianza	omitir valor o Sin registro; no inferir
dominio	No evaluado; no 0%
recencia	omitir tiempo relativo
Assessment.date	mostrar evaluación sin countdown
próximos eventos	omitir bloque o mostrar empty honesto
resumen acumulado	mostrar Bitácora sin totales
Intervention	omitir humano
ActionRecommendation	respetar Action/Commitment/Evidence vigente; si nada existe, empty honesto
academic_context_blocker	no derivar ni mostrar Falta actualizar el cursado; conservar Action válida o usar el empty/error respaldado por la lectura real
	12.4. Materia sin próxima acción disponible

NO HAY UNA ACCION DISPONIBLE EN ESTA MATERIA
Podés revisar tus unidades y el último ritmo confirmado.

No afirma que el sistema está calculando si no existe un proceso real.

***
13. DESKTOP ADAPTATION

Desktop conserva el orden semántico. El ancho adicional muestra contexto periférico, no más decisiones.

+--------------------------------------------------------------------------------------------------+
| <- ANALISIS MATEMATICO II                     CURSADO | EXAMEN · Parcial 1                      |
+--------------------------------------------------------------------------------------------------+
| NECESITA ATENCION · Ultimo avance hace 2 dias                                                   |
+---------------------------------------------------------------+----------------------------------+
| AHORA                                                         | CATEDRA Y VOS                    |
| Unidad 3                                                      | Cátedra · U4 iniciada            |
| Resolver ejercicios 8–14                                     | Confirmado · clase 18 ago        |
|                                                               |                                  |
| Porque: prepara la próxima clase.                             | Vos · U3 práctica pendiente      |
| 60–75 min · Entrega: 7 ejercicios                            | Brecha · requiere atención       |
| [                         COMPROMETERME                      ] | [ Ver recorrido ]                |
+---------------------------------------------------------------+----------------------------------+
| PROXIMO                                                       | UNIDADES                         |
| Vie · Clase continúa U4     Mar · Entrega Guía 5              | U1 práctica registrada · U2 en práctica |
+---------------------------------------------------------------+ U3 atención · U4 recorrido       |
| ACTIVIDAD RECIENTE                                            | [ Ver todas ]                    |
| Hoy · 7 ejercicios · 68 min                                   +----------------------------------+
| 18 ago · U4 iniciada · reportado por vos                      | TRABAJO ACUMULADO                |
| Estado · pendiente de corroboración                            | 9 sesiones · 74 ejercicios      |
| [ Ver Bitácora ]                                              | 8 h 20 · 6 evidencias           |
+---------------------------------------------------------------+----------------------------------+
| [ Pasó algo en clase ]                                        |                                  |
+---------------------------------------------------------------+----------------------------------+

Reglas desktop

Primary Action conserva mayor peso visual.
Cátedra y vos puede ocupar columna lateral sin transformarse en dashboard.
Unidades y trabajo acumulado no añaden CTAs competidoras.
Próximo sigue siendo lista breve, no calendario.
No se muestran todas las dimensiones de todas las unidades simultáneamente.
La Bitácora completa sigue siendo un drill-down.

***
14. CONTRATO FUNCIONAL DE DATOS

Esta sección define qué necesita la experiencia. No crea una nueva entidad persistida ni decide API/SQL. La implementación puede usar una composición/read projection, pero su forma técnica pertenece al Architecture/API Spec.

14.1. Identidad y contexto

Necesidad UI	Fuente conceptual	Campos/relaciones disponibles
materia activa	CourseEnrollment + Course + CourseOffering	ids, name/code, offering, term, status
cátedra/profesor	CourseOffering + Instructor	offering, commission, instructor
contexto Examen	Assessment + ExamPreparation	assessment, date, modality, preparation status
	14.2. Ritmo de cátedra

Necesidad UI	Fuente conceptual	Regla
última clase confirmada	ClassSession	usar date, topics, status
temas observados	ClassSession ↔ Topic	una sesión puede cubrir varios temas
comenzó/continuó/reforzó/cerró	observación de clase	consumir si está expresado; no inferir desde posición
futuro programado	ClassSession/cronograma	etiquetar Programado
fuente/confianza/vigencia	Academic provenance	conservar y mostrar al profundizar
	14.3. Estado del alumno

Necesidad UI	Fuente conceptual	Regla
Recorrido	TopicProgress.exposure	semántica propia
Práctica	TopicProgress.practice	semántica propia
Dominio	TopicProgress.domain	no evaluado ≠ cero
Confianza	TopicProgress.confidence	percepción, no dominio
Recencia	eventos de progreso/actividad	última actividad útil
impacto de evidencia	Evidence + ProgressUpdated/ProgressEntry	sólo después de cambio real
	14.4. Acción y conducta

Necesidad UI	Fuente conceptual
recomendación	ActionRecommendation principal de la materia
lifecycle	Action.status
compromiso	Commitment.state/start_at/planned_minutes
evidencia	Evidence.lifecycle_state/signals
rescate	relación con Commitment original, cuando el dominio la exponga
	14.5. Próximo

Necesidad UI	Fuente conceptual
clase	ClassSession futura confiable
evaluación	Assessment
tarea/entrega	evento de clase/Assessment según modelado propietario
cambio de fecha	nueva versión del dato con provenance
	14.6. Actividad y Bitácora

Necesidad UI	Fuente conceptual
evento normalizado	ProgressEntry o bundle derivado
producción	Action + Evidence
tiempo real	Reflection/registro de ejecución
reflexión	Reflection
feedback	feedback humano vinculado
rescate	Commitment + intervención/outcome cuando corresponda
resumen acumulado	agregación factual de eventos de la materia
	14.7. SOURCE CONTRACT PENDING

Las siguientes necesidades ya están aprobadas funcionalmente, pero su ownership técnico/campo exacto no está cerrado en las fuentes. El diseño las consume sin inventar tabla o entidad:

Contrato pendiente	Uso	Fallback
course_state_summary	estado breve de materia	estado neutral
course_gap_summary	brecha explicable	brecha no determinable
academic_context_blocker	proyectar objeto afectado, dato faltante, razón, acción de resolución y vigencia	no mostrar bloqueo ni redactar una acción localmente
last_meaningful_activity_at	recencia	omitir tiempo relativo
topic_progress_display_semantics	valor/label por dimensión	omitir síntesis o mostrar un hecho comprensible, como 12 ejercicios; nunca exponer valores internos brutos
class_topic_relation	comenzó/continuó/reforzó/cerró	listar temas sin relación
class_event_record	crear, corregir/versionar prioridad, fecha, tarea y nota con provenance, contexto de clase y verification status separados	no persistir localmente; mostrar error honesto si la escritura no está disponible
course_accumulated_summary	sesiones/tiempo/producción/evidencia/rescates	omitir totales; mantener Bitácora
estimated_duration	Action	omitir estimación
expected_evidence	Action	omitir línea de entrega si no está disponible
completion_criterion	Action	detalle de cierre no visible
rescue_relation	rescate ↔ missed original	no afirmar vínculo
human_assignment	persona visible	omitir identidad humana
	Cerrar estos contratos pertenece a Architecture/API/Data Spec. No bloquean la arquitectura funcional si se aplican los fallbacks.

14.7.1. Frontera propietaria mínima de academic_context_blocker

Owner funcional del contexto: Academic Data Layer.
Owner de la disponibilidad/prioridad académica: Academic Decision Engine.
Output mínimo consumido por Materia: CourseEnrollment u objeto afectado, dato faltante, razón explicable, acción de resolución, vigencia y estado de bloqueo.
Regla: Materia sólo proyecta el resultado; no determina que el dato falta ni que bloquea una recomendación.
Fallback: si el contrato no está disponible, no se muestra un bloqueo inventado; una Action válida mantiene su lifecycle y, sin Action, se usa el empty/error ya definido según el resultado real de lectura.

14.7.2. Frontera propietaria mínima de class_event_record

Owner funcional de escritura y verdad académica: Academic Data Layer.
Operaciones mínimas antes de implementación: create, correct/version y lectura de la versión vigente.
Metadatos mínimos: actor, source_type, observed_at, CourseOffering, ClassSession o fecha contextual, verification_status, vigencia y trazabilidad de corrección.
Regla: source_type=student no se eleva a corroborated u official por la vista; el contexto de clase viaja en la relación/campo que cierre el contrato y no reemplaza el tipo de fuente.
Fallback: sin confirmación del servicio propietario, la UI no afirma que guardó el reporte ni actualiza ritmo, brecha, riesgo o Action.

Estos dos contratos tienen owner funcional identificado, pero siguen SOURCE CONTRACT PENDING en forma técnica. Deben cerrarse en Architecture/API/Data Spec antes de implementar el bloqueo de contexto o la captura P0 de clase.

14.8. No calculado por frontend

prioridad académica;
recomendación principal;
severidad de riesgo;
existencia/magnitud de brecha;
progreso dimensional;
dominio demostrado;
falsa confianza;
readiness de examen;
relación causal entre evento de clase y Action;
existencia, contenido o vigencia de un bloqueo académico;
elevación del verification status de un reporte estudiantil;
acumulados que requieran deduplicación de eventos.

***
15. MUTACIONES Y EFECTOS

Acción del alumno	Mutación propietaria	Siguiente evento garantizado
Comprometerme	inicia/continúa creación de Commitment	se abre definición de horario/capacidad
Empezar	actualiza lifecycle de Commitment/Action	Action queda iniciada si la operación confirma
Continuar	abre Action activa	se retoma la ejecución; no implica completar
Subir evidencia	crea/actualiza Evidence	al enviar, queda SUBMITTED
Retomar	inicia resolución de missed	se define recuperación; no existe rescate hasta materializarlo
Actualizar cursado	Academic Data Layer crea/corrige un reporte académico contextual	el reporte queda registrado con el verification status devuelto si la operación confirma; no se presenta como hecho confirmado por defecto
corregir evento de clase	Academic Data Layer versiona/corrige el dato con provenance	la lectura refleja la versión vigente sin borrar la trazabilidad previa
abrir unidad	ninguna mutación	muestra dimensiones reales
abrir Bitácora	ninguna mutación	muestra timeline privado
	Ninguna interacción promete recalcular progreso, riesgo o próxima acción antes de que el servicio propietario confirme el evento correspondiente.

***
16. ANALYTICS / PRODUCT EVENTS

16.1. Eventos ya definidos que esta experiencia debe emitir o enriquecer

Evento	Trigger en Materia/Cursado	Propiedades mínimas
CourseViewed	vista cargada y visible	actor_id, institution_id, course_enrollment_id, course_state, gap_state, action_state?, exam_context, rhythm_confidence, last_activity_available
ActionAccepted	alumno acepta recomendación	action_id, course_enrollment_id, source=course_cursado
CommitmentCreated	confirma compromiso	action_id, course_enrollment_id
CommitmentStarted	inicio confirmado	action_id, commitment_id
EvidenceSubmitted	envío confirmado	action_id, evidence_id, course_enrollment_id
ProgressUpdated	servicio confirma cambio	course_enrollment_id, topic_id, changed_dimensions
ExamPreparationActivated	ocurre desde contexto Examen	assessment_id, course_enrollment_id
	16.2. Telemetría de interacción pendiente de naming técnico

La experiencia necesita medir:

apertura de unidad;
apertura de Bitácora;
apertura de evento próximo;
inicio y finalización de captura de clase;
tipo de evento de clase registrado;
corrección de evento de clase;
exposición de ritmo confirmado/programado/estimado/desconocido.

Los nombres definitivos y su deduplicación con eventos de dominio son SOURCE CONTRACT PENDING. No se crean aquí nuevas entidades ni outcomes.

***
17. ACCESIBILIDAD Y VERDAD VISUAL

Color nunca es el único portador de estado.
Reportado, Pendiente de corroboración, Confirmado, Programado, Estimado, Disputado y Desconocido deben tener texto o iconografía distinguible.
Barras o indicadores dimensionales requieren label accesible con su dimensión.
No evaluado se distingue de valor bajo.
CTA primaria conserva nombre de acción, no Continuar ambiguo fuera de contexto.
Los tiempos relativos tienen fecha absoluta disponible al profundizar.
Reflexiones y feedback conservan autoría.
El tab activo se anuncia semánticamente.
La pantalla funciona sin animación y no depende de hover.

***
18. TEST DE 10 SEGUNDOS — SIMULACIÓN

La prueba usa únicamente primer viewport + inicio del bloque Cátedra y vos.

Escenario A — bajo control

Respuestas esperadas:

Materia: Programación I.
Estado: bajo control.
Acción: resolver ejercicios 1–5.
Por qué: consolidar lo visto hoy.

Resultado simulado: PASS.

Escenario B — brecha

Respuestas esperadas:

Materia: Análisis II.
Estado: necesita atención.
Acción: resolver ejercicios 8–14 de U3.
Por qué: preparar la próxima clase.

Resultado simulado: PASS.

La causa completa de brecha se profundiza debajo; no compite con la acción.

Escenario C — Action en curso

Respuestas esperadas:

Hay trabajo iniciado.
Debe continuar la Action vigente.
La siguiente salida será la evidencia configurada, no una nueva recomendación.

Resultado simulado: PASS.

Escenario D — ritmo desconocido

Respuestas esperadas:

El último ritmo confirmado está explícito.
No se presenta una predicción como hecho.
Si existe Action válida, sigue siendo primaria.

Resultado simulado: PASS WITH RISK.

Riesgo de comprensión: el estado neutral Contexto parcial debe probarse con alumnos para evitar que se interprete como bajo control.

Escenario E — Examen activo

Respuestas esperadas:

El alumno identifica el estado propio de la materia.
El tab informa que existe Modo Examen sin reemplazar ese estado.
Si la Action pertenece a ExamPreparation, su contexto aparece dentro del bloque Action.
La CTA primaria pertenece a la Action vigente, no al selector.

Resultado simulado: PASS WITH RISK.

Riesgo de densidad: el tab Examen no debe competir visualmente con la acción.

Resultado global simulado

3 PASS.
2 PASS WITH RISK.
0 FAIL.

El test real de 10 segundos en 360 px es gate antes de UI high-fi.

***
19. CRITERIOS DE ACEPTACIÓN

19.1. Producto / PO

En menos de 10 segundos se identifica materia, estado y acción.
Action > Information se conserva.
La vista no crea prioridad académica.
Cursado y Examen se distinguen sin separarse como productos.
ExamPreparation activa no reemplaza el estado propio de Cursado.
No se convierte en LMS, calendario, notas, biblioteca o dashboard.
El trabajo acumulado es factual, no un score.

19.2. UX/UI

Primer viewport contiene una única CTA primaria.
Cátedra y alumno se distinguen visual y semánticamente.
Confirmado, programado, estimado y desconocido no se confunden.
Un reporte estudiantil no corroborado se identifica como reporte y no como hecho de cátedra.
Overview no usa % aprendido.
El detalle conserva cinco dimensiones separadas.
No evaluado no parece 0.
Confianza alta diferencia Dominio no evaluado, Dominio bajo demostrado y Dominio consistente.
Bitácora es privada y no social.
Mobile no muestra todas las unidades/dimensiones a la vez.

19.3. Data Architect

CourseOffering y ClassSession soportan múltiples temas por sesión.
TopicProgress conserva Recorrido, Práctica, Dominio y Confianza.
Recencia se deriva de actividad real y tiene contrato claro.
Los eventos de clase separan source_type, contexto de clase y verification_status, y conservan offering/session, fecha, vigencia y corrección/versionado.
academic_context_blocker identifica objeto afectado, dato faltante, razón, resolución y vigencia.
ProgressEntry/derivación puede reconstruir Bitácora sin duplicar verdad.
Resumen acumulado deduplica eventos.
Provenance y vigencia se conservan.
Ningún read model se trata como entidad de dominio por defecto.

19.4. Frontend

No calcula brecha, riesgo, prioridad o progreso.
No deriva bloqueos académicos ni eleva el verification status de reportes.
Implementa fallbacks por sección.
Mantiene CTA/lifecycle consistente con Hoy.
Omite bloques opcionales sin placeholders engañosos.
No usa color como única señal.
Soporta 360 px sin segunda CTA competidora above the fold.

19.5. Backend

Entrega una recomendación principal inequívoca por contexto solicitado.
Distingue hechos confirmados, futuros programados e inferencias.
No representa una ClassSession como una unidad completa por defecto.
Devuelve estados de Action/Commitment/Evidence sin reinterpretación de frontend.
Permite registrar/corregir eventos de clase con trazabilidad.
Academic Data Layer confirma create/correct/version de eventos de clase y devuelve provenance + verification status.
Academic Data Layer entrega el bloqueo de contexto y Academic Decision Engine conserva el ownership de disponibilidad/prioridad de recomendación.
Puede producir actividad reciente y acumulados factuales.
No promete recomputación inmediata si el proceso no está implementado.

***
20. REVERSIBLE UX ASSUMPTIONS

Primary Action aparece antes de Cátedra y vos.
Cátedra y vos usa dos filas paralelas en mobile.
El detalle de unidad puede abrirse inline o en pantalla.
Actividad reciente muestra 2–3 entradas.
Próximo muestra pocos eventos y progressive disclosure.
Pasó algo en clase vive al final de la pantalla o como acción secundaria sticky no competidora.
El selector CURSADO | EXAMEN usa tabs.
El overview de unidad usa texto compacto y no una matriz completa.
Desktop usa Action principal + panel lateral de ritmo.
Copy exacto de Contexto parcial.
Síntesis exacta de cada unidad.
Forma gráfica futura del timeline/Gantt.

Cambiar estos supuestos no debe alterar ownership, lifecycle, dimensiones, provenance ni prioridad académica.

***
21. CHANGE REQUESTS Y TRAZABILIDAD

Change Requests a Product Spec, Design Spec, Engines, navegación o dominio conceptual: ninguno.

Este diseño no requiere modificar Product Spec, Design Spec, Engines, navegación estructural ni dominio conceptual.

Los contratos técnicos todavía no cerrados se documentan como SOURCE CONTRACT PENDING; se declara su frontera propietaria funcional sin resolverlos mediante nuevas entidades silenciosas.

21.1. Trazabilidad breve de findings corregidos

Finding	Secciones corregidas	Criterio de aceptación cubierto
MAT-P1-01 — provenance incompleta en previews	7, 8.6, 8.7, 8.9 y 13	toda preview de actividad originada en clase muestra fuente y verification_status; un reporte del alumno no aparece como hecho confirmado de cátedra
MAT-P1-02 — falta wireframe crítico 360 px	8.6, 10.J, 11 y 19	el estado Confianza alta + Dominio bajo demostrado se muestra explícitamente en mobile, separa percepción de evidencia y usa copy no punitivo
	No se incluye trazabilidad de ningún otro finding en esta versión.

***
22. SELF-AUDIT

Criterio	Resultado
Lee ritmo de cátedra desde ClassSession/observaciones reales	PASS
No asume 1 unidad = 1 clase	PASS
Distingue cátedra y alumno	PASS
Distingue Recorrido/Práctica/Dominio/Confianza/Recencia	PASS
Distingue Confianza alta + Dominio no evaluado/bajo/consistente, incluido estado crítico 360 px	PASS
No usa % aprendido	PASS
No usa síntesis generales ambiguas ni valores internos brutos	PASS
Academic Engine conserva prioridad académica	PASS
Action > Information	PASS
Captura de clase limitada a P0 aprobado	PASS
Reporte estudiantil conserva provenance y no se presenta como confirmado	PASS
Bitácora privada, sin social/gamificación	PASS
Modo Examen visible pero no resuelto dentro de Cursado	PASS
ExamPreparation activa no reemplaza el estado de Cursado	PASS
Próximo no se convierte en calendario	PASS
Recursos no se convierten en biblioteca	PASS
Ownership funcional de contexto/escritura declarado sin inventar arquitectura técnica	PASS
Conexión con HOY conserva lifecycle y CTA	PASS
No se agregan features fuera de alcance	PASS
	Estado final

ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_WIREFRAME_v0.3_CANDIDATE queda:

READY FOR LEAD PRODUCT OWNER FINAL REAUDIT

No queda aprobado para UI high-fi hasta:

reauditoría funcional independiente con 0 P0 y 0 P1 abiertos;
cierre técnico de academic_context_blocker y class_event_record antes de implementar esos flujos;
test real de 10 segundos en 360 px;
freeze de contratos técnicos pendientes en Architecture/API/Data Spec.


***

VI.3 — Próxima Acción

ACHIEVE — PRÓXIMA ACCIÓN

FUNCTIONAL WIREFRAME v0.1

Estado: primera especificación funcional low-fi, lista para auditoría independiente de Lead Product Owner.  
Fecha: 22 de agosto de 2026.  
Sprint: SPRINT UX 03 — PRÓXIMA ACCIÓN.  
Wireframe: WF-S05 — Detalle de Próxima Acción.  
Responsable: Senior Product Designer de Achieve.

Baseline obligatorio

ACHIEVE_MVP_USUARIO_PRODUCT_SPEC_v0.5_FINAL.
ACHIEVE_USER_FLOW_WIREFRAMES_DATA_MODEL_v0.2_FINAL.
ACHIEVE_HOY_AUTOGESTION_FUNCTIONAL_SPEC_v1.0_APPROVED.
ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_SPEC_v1.0_APPROVED.

Jerarquía aplicada

Product Spec v0.5 define visión, alcance, mecanismos, principios y ownership de producto.
Design Spec v0.2 define flujo, dominio conceptual, máquinas de estado y WF-S05.
HOY v1.0 define la recomendación global, su precedencia operacional y el handoff al detalle.
Materia v1.0 define la misma recomendación dentro del CourseEnrollment y su contexto de Cursado/Examen.
Este documento especifica únicamente cómo una ActionRecommendation ya emitida se comprende, acepta, corrige o rechaza antes de WF-S06 — Compromiso.

No se modifica ninguna fuente. No se agregan Engines, entidades, navegación estructural ni eventos de producto.

***
1. OBJETIVO Y LÍMITES

1.1. Job to be done

Cuando el estudiante abre el detalle de una recomendación, debe poder pasar de “sé que Achieve me recomienda algo” a entender exactamente qué debe hacer y qué debe producir para cerrarlo, sin reconstruir el contexto académico ni interpretar el algoritmo.

En menos de 10 segundos debe poder responder:

qué tiene que hacer;
en qué materia, tema u objetivo;
por qué importa;
cuánto tiempo necesita, si existe una estimación confiable;
qué recursos debe usar;
qué evidencia se espera;
qué criterio cierra la acción;
qué pasa si la acepta;
cómo informar que no puede realizarla o que parte de datos incorrectos.

1.2. Resultado funcional

La pantalla convierte una recomendación ya priorizada en una decisión binaria y comprensible:

aceptar la acción y continuar a la definición del Commitment;
informar una imposibilidad, bloqueo o corrección sin borrar la recomendación ni producir una alternativa local.

1.3. Incluye

identidad y contexto de la recomendación;
verbo, alcance y objetivo;
una razón principal y razones adicionales bajo progressive disclosure;
tiempo estimado cuando existe contrato;
recursos directamente vinculados;
evidencia esperada y criterio de cierre cuando existen contratos;
provenance/confianza cuando la razón o el recurso dependen de información estimada, reportada, disputada o no confirmada;
aceptación y handoff a WF-S06;
entrada de mínima fricción para imposibilidad, bloqueo, dato incorrecto o acción ya realizada;
estados RECOMMENDED, ACCEPTED, BLOCKED y CANCELLED/REPLACED relevantes para este detalle;
contexto Cursado o ExamPreparation sin duplicar sus vistas.

1.4. No incluye

priorización académica;
selección de otra materia o tema;
lista de recomendaciones alternativas;
creación o confirmación de Commitment;
selección de hora, disponibilidad o duración real;
ejecución completa de Action;
submission, revisión o validación completa de Evidence;
progreso, timeline, Bitácora, calendario o dashboard;
protocolo completo de Examen;
chat general o intervención humana decorativa;
explicación extensa del Academic Decision Engine;
corrección académica automática;
inferencia de dominio por actividad, tiempo, confianza o envío de evidencia.

1.5. Regla central de ownership

> La pantalla explica y registra una respuesta sobre la ActionRecommendation; no decide qué conviene hacer.

El Academic Decision Engine entrega una recomendación principal inequívoca. WF-S05 no compara priority, riesgo, fechas, brechas, dificultad, recencia ni disponibilidad para cambiarla. Si la fuente entrega múltiples recomendaciones sin una principal, existe un error de contrato: la vista no las rankea.

***
2. RELACIÓN CON HOY Y MATERIA

Vista	Pregunta principal	Qué aporta	Qué no duplica
HOY	¿Qué hago ahora?	recomendación global o lifecycle operativo dominante	detalle completo, recursos y criterios
MATERIA / CURSADO	¿Qué pasa en esta materia y cómo vengo?	estado, cátedra vs. alumno, brecha y recomendación contextual	detalle exhaustivo de la Action
PRÓXIMA ACCIÓN	¿Qué significa esta acción y qué debo producir para cerrarla?	alcance ejecutable, recursos, evidencia, cierre, aceptación y feedback	dashboard, Bitácora, progreso o planificación
	2.1. Identidad conservada

Al abrir desde HOY o Materia, la pantalla conserva:

la misma Action;
la misma ActionRecommendation y referencia canónica entregada por el servicio propietario;
la misma materia/tema/objetivo;
el mismo reason y sus fuentes;
el mismo generated_at;
el mismo lifecycle;
el mismo contexto Cursado o Examen;
la misma CTA semántica para el estado vigente.

La pantalla no copia la recomendación en un nuevo objeto. Si el lifecycle cambió entre la pantalla de origen y la apertura, muestra el estado autoritativo más reciente y no ejecuta la acción solicitada sobre una versión obsoleta.

2.2. Entrada y retorno

Entradas válidas:

selección del Hero de HOY;
selección de la Primary Action de Materia;
reapertura desde un objeto Action ya existente.

Retornos válidos:

volver a la pantalla de origen preservada;
continuar a WF-S06 — Compromiso después de aceptación confirmada;
volver a HOY o Materia cuando la Action esté cancelada/reemplazada y no exista un destino vigente respaldado por contrato.

No se agrega navegación global.

***
3. FLUJO PRINCIPAL

3.1. Flujo estándar

HOY o Materia abre WF-S05 con la identidad canónica de la Action/recomendación.
La vista resuelve el estado autoritativo y excluye objetos cancelados o reemplazados de la conducta primaria.
Presenta contexto, acción, razón, estimación, recursos, evidencia y criterio de cierre disponibles.
El estudiante puede expandir razones/provenance sin abandonar la pantalla.
Si acepta, selecciona Me comprometo.
El servicio propietario confirma la aceptación.
La Action pasa de RECOMMENDED a ACCEPTED y se emite ActionAccepted.
Se abre WF-S06 — Compromiso para elegir hora, disponibilidad real y duración.
No existe Commitment hasta la confirmación explícita en WF-S06.

3.2. Flujo de corrección o rechazo

El estudiante abre No puedo hacerla / Corregir información, como control secundario después de la CTA primaria.
La vista mantiene visible un resumen de la recomendación original.
El estudiante selecciona un motivo aprobado y aporta sólo el dato mínimo necesario.
La vista envía feedback al contrato propietario.
Sólo después de confirmación muestra que el feedback fue recibido.
La vista no elige otra acción, no crea una recomendación y no altera prioridad.
El estado posterior de Action se muestra únicamente si el servicio propietario lo devuelve.

3.3. Falla y concurrencia

Si la aceptación falla, la Action permanece RECOMMENDED; no se emite ActionAccepted y no se abre un Commitment editable como si existiera.
Si el feedback falla, la recomendación permanece visible y se permite reintentar; no se afirma que fue registrada.
Si la Action cambió mientras se veía la pantalla, se muestra el nuevo estado y se detiene la mutación obsoleta.
Si falta un campo opcional, se omite su bloque; no se inventa un placeholder académico.

***
4. INVENTARIO FUNCIONAL

Bloque	Contenido	Regla funcional
Header	retorno + PRÓXIMA ACCIÓN	conserva la pantalla de origen; no agrega navegación
Contexto	materia + CURSADO o EXAMEN · {Assessment}	Examen es contexto, no protocolo
Acción	tema/objetivo + verbo + alcance	contenido recibido; la vista no lo redacta desde métricas
Por qué	una razón principal	razones adicionales bajo disclosure; no expone score
Provenance	fuente, fecha/estado y confianza cuando corresponde	obligatorio si la razón depende de dato estimado, reportado, disputado o no confirmado
Tiempo	estimación	se omite si no existe contrato
Recursos	sólo materiales vinculados a la Action	conserva provenance y rights status cuando corresponde; no abre biblioteca general
Evidencia esperada	producción concreta y verificable	no promete suficiencia, validación ni dominio
Criterio de cierre	condición mínima recibida	separado de la evidencia y de dominio demostrado
Después	siguiente evento real	en RECOMMENDED: definir Commitment; no promete ejecución o progreso
CTA primaria	Me comprometo	acepta Action y hace handoff a WF-S06
Control secundario	No puedo hacerla / Corregir información	abre feedback sin competir above the fold
Razones completas	razones secundarias + provenance	progressive disclosure; no explicación del algoritmo
	4.1. Contrato del primer viewport de 360 px

Antes del primer scroll aparecen, en este orden:

materia y contexto;
tema/objetivo + acción concreta;
razón principal;
tiempo estimado, si existe;
evidencia esperada;
criterio de cierre, si está disponible;
CTA primaria full-width.

El recurso principal puede comprimirse en una sola línea antes de la CTA cuando es indispensable para empezar. Recursos adicionales, razones completas, provenance expandida y feedback quedan inmediatamente debajo.

No aparecen before the fold:

otra recomendación;
score de prioridad o riesgo;
lista de materias;
métricas, progreso o historial;
intervención humana no operativa;
calendario;
protocolo de Examen;
segunda CTA de igual peso.

***
5. WIREFRAME MOBILE — 360 PX

5.1. Recomendación estándar desde Cursado

+--------------------------------------+
| <- PRÓXIMA ACCIÓN                    |
| ANÁLISIS II · CURSADO                |
+--------------------------------------+
| UNIDAD 3                             |
| Resolver ejercicios 8–14             |
|                                      |
| Porque: prepara la próxima clase.    |
|                                      |
| 60–75 min                            |
| Usá: Guía 3 · Cátedra · oficial      |
| Evidencia: 7 ejercicios resueltos    |
| Cerrás cuando: están completos y     |
| adjuntás la producción acordada.     |
|                                      |
| Después: definís cuándo vas a        |
| hacerla.                             |
|                                      |
| [        ME COMPROMETO             ] |
| No puedo hacerla / Corregir dato     |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| [ Ver razones y fuentes ]            |
+--------------------------------------+

Los valores son ilustrativos y sólo se muestran si los contratos propietarios los entregan. Adjuntás la producción acordada no implica que la evidencia será suficiente, validada o demostrará dominio.

5.2. Compresión cuando faltan datos opcionales

+--------------------------------------+
| <- PRÓXIMA ACCIÓN                    |
| FÍSICA I · CURSADO                   |
+--------------------------------------+
| CINEMÁTICA                           |
| Resolver problemas 3–6               |
|                                      |
| Porque: falta práctica autónoma.     |
| Evidencia: problemas resueltos       |
|                                      |
| Después: definís cuándo vas a        |
| hacerla.                             |
|                                      |
| [        ME COMPROMETO             ] |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| [ No puedo hacerla / Corregir dato ] |
+--------------------------------------+

No se muestran etiquetas vacías de tiempo, recursos o cierre. La ausencia no se convierte en cero ni en una estimación local.

***
6. WIREFRAME DESKTOP

+--------------------------------------------------------------------------------------------------+
| <- PRÓXIMA ACCIÓN                                              Origen: HOY · ANÁLISIS II          |
+--------------------------------------------------------------------------------------------------+
| ANÁLISIS II · CURSADO                                        | PARA EMPEZAR                      |
| UNIDAD 3                                                     |                                   |
|                                                              | Recurso principal                 |
| Resolver ejercicios 8–14                                    | Guía 3 · Cátedra · oficial       |
|                                                              |                                   |
| Porque: prepara la próxima clase.                            | Evidencia esperada                |
|                                                              | 7 ejercicios resueltos            |
| 60–75 min                                                    |                                   |
|                                                              | Criterio de cierre                |
| Después: definís cuándo vas a hacerla.                       | Producción completa y adjunta     |
|                                                              |                                   |
| [                         ME COMPROMETO                      ] |                                   |
+--------------------------------------------------------------------------------------------------+
| [ No puedo hacerla / Corregir información ]       [ Ver razones y fuentes ]                     |
+--------------------------------------------------------------------------------------------------+

Reglas desktop

Mantiene la misma jerarquía de mobile.
El ancho adicional separa Para empezar del bloque de decisión; no agrega analytics.
La CTA primaria continúa siendo única.
La columna lateral no contiene recomendaciones, calendario, progreso ni CTAs competidoras.
Razones y provenance se expanden debajo, no como explicación permanente del algoritmo.

***
7. ESTADOS CRÍTICOS

7.1. Matriz funcional

Estado	Qué ve el estudiante	Qué puede hacer	Evento / lifecycle
Recomendación estándar	acción, razón, tiempo disponible, recurso, evidencia y cierre	aceptar o abrir feedback	RECOMMENDED; al aceptar con éxito: ActionAccepted → ACCEPTED
Action aceptada, sin Commitment confirmado	confirmación de aceptación + Action original	continuar a definir hora/capacidad o volver	permanece ACCEPTED; CTA Definir compromiso; no reemite ActionAccepted
Acción para resolver incertidumbre	label explícito RESOLVER INCERTIDUMBRE · NO ES ESTUDIO, dato a confirmar y evidencia de confirmación	aceptar o corregir el supuesto	mismo lifecycle de Action; no confirma el dato por mostrar la acción
Información estimada/no confirmada	razón con fuente, fecha, verification_status y confidence legibles	aceptar con ese contexto o corregir	no cambia verification status; aceptación normal si continúa
Recurso faltante/inaccesible	recurso afectado + imposibilidad factual	informar bloqueo o corregir disponibilidad del recurso	feedback SOURCE CONTRACT PENDING; Action sólo pasa a BLOCKED si owner lo confirma
No puede realizarla hoy	recomendación original resumida + motivo No puedo hoy	enviar feedback mínimo	sin evento aprobado; estado posterior autoritativo, no local
Duración no entra	estimación original + disponibilidad declarada/corregida	informar cuánto tiempo real tiene	feedback SOURCE CONTRACT PENDING; no recorta la Action localmente
Dato académico incorrecto	campo usado, valor actual, provenance y corrección propuesta	enviar corrección + fuente opcional	no sobrescribe el dato; versionado/corrección propietario pendiente
Acción ya realizada	recomendación original + aclaración de que reportarla no equivale a completarla	indicar que ya la hizo y aportar referencia mínima	no marca COMPLETED; Evidence/lifecycle posterior sólo si owner lo confirma
Action bloqueada	estado BLOQUEADA, causa y resolución sólo si fueron entregadas	ejecutar resolución propietaria o revisar bloqueo	BLOCKED; no genera alternativa
Action cancelada	recomendación original, razón/fecha si existen y estado no vigente	volver a origen	CANCELLED; sin ActionAccepted
Action reemplazada	recomendación original marcada no vigente; vínculo a vigente sólo si existe contrato	ver objeto vigente respaldado o volver	REPLACED; no se presenta la nueva acción como creación de la vista
Contexto Cursado	materia + unidad/tema + CURSADO	aceptar/corregir	conserva CourseEnrollment
Contexto ExamPreparation	materia + EXAMEN · {Assessment}; puede mostrar fase/hito sólo como contexto	aceptar/corregir	conserva ExamPreparation; no completa protocolo
	7.2. Acción para resolver incertidumbre

+--------------------------------------+
| <- PRÓXIMA ACCIÓN                    |
| ANÁLISIS II · EXAMEN · PARCIAL 1     |
+--------------------------------------+
| RESOLVER INCERTIDUMBRE               |
| No es una actividad de estudio       |
| Confirmar si entra Unidad 5          |
|                                      |
| Porque: el alcance del parcial no    |
| está confirmado.                     |
|                                      |
| Usá: campus o consulta al profesor   |
| Evidencia: comunicado o respuesta    |
| Cerrás cuando: queda registrada la   |
| fuente y su estado de verificación.  |
|                                      |
| [        ME COMPROMETO             ] |
+--------------------------------------+
| [ La información ya está confirmada ]|
+--------------------------------------+

La pantalla no presenta esta Action como aprendizaje, práctica o dominio. La evidencia esperada demuestra que se resolvió una incertidumbre operativa, no que se aprendió U5.

7.3. Razón basada en información no confirmada

+--------------------------------------+
| <- PRÓXIMA ACCIÓN                    |
| ANÁLISIS II · CURSADO                |
+--------------------------------------+
| UNIDAD 4                             |
| Revisar conceptos base de U4         |
|                                      |
| Porque: podría haber comenzado U4.   |
|                                      |
| FUENTE DE ESTA RAZÓN                 |
| Reportado por vos · 18 ago           |
| Estado: pendiente de corroboración   |
| Confianza operativa: media           |
|                                      |
| [        ME COMPROMETO             ] |
+--------------------------------------+
| [ Corregir esta información ]        |
+--------------------------------------+

No se redacta La cátedra comenzó U4 como hecho. source_type, contexto de clase, confidence y verification_status permanecen separados.

7.4. Recurso faltante o inaccesible

+--------------------------------------+
| <- PRÓXIMA ACCIÓN                    |
| PROGRAMACIÓN I · CURSADO             |
+--------------------------------------+
| RECURSO NO DISPONIBLE                |
| Implementar ejercicios 2–4           |
|                                      |
| Recurso requerido: Guía 4            |
| No pudimos abrir el recurso vinculado|
| a esta acción.                       |
|                                      |
| [       INFORMAR BLOQUEO           ] |
+--------------------------------------+
| No elegimos otro recurso desde acá.  |
+--------------------------------------+

La vista no busca ni recomienda un sustituto. El CTA registra el problema mediante el contrato pendiente; sólo el owner puede devolver BLOCKED, corregir el vínculo o producir una recomendación posterior.

7.5. Sheet de corrección/rechazo

+--------------------------------------+
| INFORMAR SOBRE ESTA RECOMENDACIÓN    |
| Análisis II · ejercicios 8–14        |
+--------------------------------------+
| ¿Qué pasa?                           |
| ( ) No puedo hoy                     |
| ( ) La duración no entra             |
| ( ) No tengo el recurso              |
| ( ) Hay información incorrecta       |
| ( ) Ya realicé esta acción           |
| ( ) Existe otro bloqueo real         |
|                                      |
| [detalle mínimo según selección]     |
|                                      |
| [        ENVIAR FEEDBACK           ] |
|             Cancelar                 |
+--------------------------------------+

Reglas:

mantiene visible la identidad de la recomendación original;
muestra un solo motivo por envío;
solicita únicamente el dato necesario para interpretar el motivo;
no muestra alternativas;
Cancelar cierra el sheet y no cambia dominio;
Enviar feedback no implica que la Action quedó bloqueada, cancelada o reemplazada hasta confirmación autoritativa.

7.6. Action bloqueada

+--------------------------------------+
| <- PRÓXIMA ACCIÓN                    |
| FÍSICA I · CURSADO                   |
+--------------------------------------+
| ACCIÓN BLOQUEADA                     |
| Resolver problemas 3–6               |
|                                      |
| Motivo: falta la guía requerida.     |
| Próximo paso: [sólo resolución       |
| devuelta por el owner].              |
|                                      |
| [       REVISAR BLOQUEO            ] |
+--------------------------------------+
| Recomendación original: 21 ago 18:10 |
+--------------------------------------+

Si no existe resolución respaldada, se omite la CTA primaria y se permite volver. BLOCKED no autoriza a WF-S05 a generar otra Action.

7.7. Action reemplazada o cancelada

+--------------------------------------+
| <- PRÓXIMA ACCIÓN                    |
| ANÁLISIS II · CURSADO                |
+--------------------------------------+
| ESTA RECOMENDACIÓN YA NO ESTÁ VIGENTE|
| Resolver ejercicios 8–14             |
|                                      |
| Estado: reemplazada                  |
| Emitida: 21 ago · 18:10              |
| Motivo del cambio: [si existe]       |
|                                      |
| [ VER ACCIÓN VIGENTE ]               |
+--------------------------------------+

Ver acción vigente sólo aparece si el servicio entrega una relación canónica hacia la Action reemplazante. En CANCELLED o sin relación, la pantalla permite volver a HOY/Materia y no inventa destino.

7.8. Contexto ExamPreparation

+--------------------------------------+
| <- PRÓXIMA ACCIÓN                    |
| ANÁLISIS II · EXAMEN · PARCIAL 1     |
+--------------------------------------+
| UNIDAD 4                             |
| Resolver ejercicios 12–18 sin mirar  |
| soluciones                           |
|                                      |
| Porque: falta práctica autónoma.     |
| 70 min · Evidencia: resolución       |
| completa bajo las condiciones dadas  |
|                                      |
| [        ME COMPROMETO             ] |
+--------------------------------------+
| Contexto: cobertura del examen       |
| [ Ver razones y fuentes ]            |
+--------------------------------------+

No muestra readiness, mapa de errores, simulacros ni protocolo completo. La Action sigue siendo propiedad del Academic Decision Engine; ExamPreparation sólo aporta contexto.

***
8. TRANSICIÓN HACIA COMPROMISO

8.1. Contrato de handoff

Momento	Estado Action	Evento	Pantalla
Detalle abierto	RECOMMENDED	ActionRecommended ya ocurrió antes; no se reemite al ver	WF-S05
Me comprometo confirmado por owner	ACCEPTED	ActionAccepted	handoff a WF-S06
Definición de horario/capacidad	ACCEPTED	ninguno nuevo por sólo visualizar/editar draft	WF-S06
Commitment confirmado	COMMITTED	CommitmentCreated	fuera del alcance de WF-S05
	8.2. Qué recibe WF-S06

action_id canónico;
contexto de materia/tema/objetivo;
estimación, si existe;
evidencia esperada, si existe;
criterio de cierre, si existe;
referencia a la recomendación original;
estado ACCEPTED confirmado.

WF-S06 solicita y confirma:

hora;
disponibilidad real;
duración comprometida;
aceptación final del Commitment.

8.3. Reglas

Me comprometo no crea un Commitment.
No se pasa directamente de RECOMMENDED a COMMITTED.
Salir de WF-S06 antes de confirmar no puede dejar un Commitment confirmado.
El frontend no marca ACCEPTED hasta recibir confirmación del owner.
Si la disponibilidad real contradice la estimación, WF-S06 registra/negocia según su contrato; WF-S05 no recorta alcance ni genera alternativa.

***
9. CORRECCIÓN Y RECHAZO

9.1. Principio de trazabilidad

> Corregir o rechazar no borra que el Academic Decision Engine emitió la recomendación.

La lectura histórica debe poder conservar:

Action/recomendación original;
generated_at;
razones y provenance usadas en ese momento;
respuesta del estudiante;
estado autoritativo posterior;
relación con una Action reemplazante, sólo si el dominio la entrega.

El contrato exacto de persistencia de esta historia es SOURCE CONTRACT PENDING; este documento no crea una entidad RecommendationFeedback.

9.2. Datos mínimos por motivo

Motivo	Dato mínimo	Qué no debe ocurrir automáticamente
No puedo hoy	motivo opcional + disponibilidad real opcional	elegir otro día, cancelar o crear alternativa
Duración no entra	minutos disponibles o rango real	recortar alcance o recalcular prioridad en frontend
Recurso no disponible	recurso afectado + tipo de problema	buscar sustituto o marcar bloqueada sin confirmación
Información incorrecta/incierta	dato afectado + corrección propuesta + fuente opcional	sobrescribir el dato o elevar verification status
Ya la realicé	momento aproximado + referencia a producción/evidencia si existe	marcar COMPLETED, validar evidencia o inferir dominio
Bloqueo real	categoría breve + detalle mínimo	crear RiskSignal/Intervention o asignar humano desde la vista
	9.3. Confirmación permitida

Sólo después de una escritura confirmada:

Recibimos tu feedback.
La recomendación original queda registrada.
Mostraremos cualquier cambio cuando el sistema propietario lo confirme.

No se promete una nueva recomendación, un plazo, una intervención humana ni una transición específica.

9.4. Corrección académica y provenance

Cuando el feedback cuestiona información académica:

se muestra el valor vigente y su provenance;
la corrección propuesta conserva actor y momento;
source_type=student no se vuelve corroborated u official por enviarse;
no se sobrescribe historia;
una decisión ya ejecutada no se edita retroactivamente sin trazabilidad;
la Action original conserva las razones disponibles al momento de emisión.

***
10. DATA CONTRACTS Y OWNERSHIP

10.1. Clasificación

DOMAIN OWNED: dato o lifecycle perteneciente a una entidad aprobada.
DERIVED READ MODEL: composición para lectura; no entidad ni tabla nueva.
SOURCE CONTRACT PENDING: necesidad funcional aprobada cuyo owner técnico, campo, relación o mutación exacta no está cerrado.
UNSUPPORTED: dato o comportamiento no respaldado y prohibido para esta vista.

10.2. Matriz de datos

Dato	Clasificación	Fuente conceptual / regla
Action	DOMAIN OWNED	entidad de ejecución; identidad, CourseEnrollment, objective, verb, scope, status
ActionRecommendation	DOMAIN OWNED	propuesta del Academic Decision Engine asociada a Action
reason	DOMAIN OWNED	razón entregada por ActionRecommendation; la vista no la recalcula
priority	DOMAIN OWNED	propiedad del Engine/ActionRecommendation; se consume para identidad/orden autoritativo, no se expone como score
generated_at	DOMAIN OWNED	metadato de ActionRecommendation
materia	DERIVED READ MODEL	Action → CourseEnrollment → Course/CourseOffering
tema/objetivo	DOMAIN OWNED	Topic/AcademicGoal y objective de Action; la proyección compone labels
verbo	DOMAIN OWNED	Action.verb
alcance	DOMAIN OWNED	Action.scope
tiempo estimado	SOURCE CONTRACT PENDING	estimated_duration; si falta, se omite
Resource	DOMAIN OWNED	entidad académica con source, rights y URL/file
vínculo recurso ↔ Action + orden/rol	SOURCE CONTRACT PENDING	necesario para mostrar sólo recursos de esta Action; no se crea biblioteca local
evidence expected	SOURCE CONTRACT PENDING	necesidad aprobada; no asumir forma ni validación
completion criteria	SOURCE CONTRACT PENDING	criterio que cierra la Action; separado de dominio
contexto Cursado	DERIVED READ MODEL	CourseEnrollment y ausencia/presencia de contexto Examen
contexto Examen	DERIVED READ MODEL	Assessment + ExamPreparation relacionados con la Action
provenance académico	DOMAIN OWNED	value, source_type/ref, observed_at, vigencia, offering, confidence, verification_status, uploaded_by, rights_status
provenance de cada razón	SOURCE CONTRACT PENDING	relación trazable entre reason y datos académicos que la sustentaron
confidence académico	DOMAIN OWNED	metadato de Academic Data; no equivale a confianza del alumno
confidence de la razón sintetizada	SOURCE CONTRACT PENDING	sólo mostrar si el owner entrega semántica comprensible
Availability	DOMAIN OWNED	restricciones/ventanas útiles del estudiante; la definición final se realiza en WF-S06
estado de Action	DOMAIN OWNED	RECOMMENDED → ACCEPTED → COMMITTED → IN_PROGRESS → EVIDENCE_PENDING → COMPLETED, más BLOCKED y CANCELLED/REPLACED
feedback de rechazo/corrección	SOURCE CONTRACT PENDING	owner, payload, persistencia, resultado y auditoría no cerrados; no crear entidad local
historial de recomendación original y reemplazo	SOURCE CONTRACT PENDING	debe preservar trazabilidad; relación técnica exacta no aprobada
origen HOY/Materia	DERIVED READ MODEL	contexto de navegación reversible; no cambia identidad académica
próximo evento después de aceptar	DERIVED READ MODEL	mapping de lifecycle: abrir/continuar WF-S06; no outcome académico
score visible de prioridad/riesgo	UNSUPPORTED	la razón comprensible reemplaza la exposición del score
alternativas generadas por WF-S05	UNSUPPORTED	sólo Academic Decision Engine puede emitir otra recomendación
dominio inferido por tiempo/actividad/evidence enviada	UNSUPPORTED	ejecución, producción y dominio permanecen separados
reviewer, validación automática o SLA no existentes	UNSUPPORTED	no prometer humano, resultado ni plazo sin objeto real
	10.3. Proyección funcional de lectura

ActionDetailView                       # DERIVED READ MODEL
  source_context                       # HOY | MATERIA | ACTION
  action
    canonical_reference
    status
    verb
    scope
    objective
  recommendation
    canonical_reference
    reason_primary
    reasons_additional[]?
    priority                           # no visible
    generated_at
    reason_provenance[]?               # SOURCE CONTRACT PENDING
  academic_context
    course_enrollment
    course_label
    topic_or_goal_label?
    context_type                       # CURSADO | EXAMEN
    assessment_or_preparation?         # sólo contexto
  execution_contract
    estimated_duration?                # SOURCE CONTRACT PENDING
    resources[]?                       # vínculo SOURCE CONTRACT PENDING
    expected_evidence?                 # SOURCE CONTRACT PENDING
    completion_criterion?              # SOURCE CONTRACT PENDING
  cta_semantic
  feedback_entry_available

Esta forma no define SQL, API, entidad, tabla ni persistencia.

10.4. Fallbacks

Dato ausente/no confiable	Comportamiento
Action o recomendación canónica	error técnico; no renderizar contenido parcial como definitivo
materia	mostrar contexto neutral sólo si la Action sigue siendo inequívoca; si no, error técnico
tema	omitir tema y conservar objetivo/alcance
reason	no inventar; mostrar No pudimos cargar la explicación y conservar la Action si sigue ejecutable
tiempo	omitir línea
recurso vinculado	omitir si no es obligatorio; si es requisito y está inaccesible, estado de recurso faltante
expected evidence	omitir línea y no afirmar cierre; contrato debe cerrarse antes de aprobar implementación completa
completion criterion	omitir detalle; no inventar definición de terminado
provenance requerida	no presentar dato estimado/reportado como hecho; usar copy neutral o bloquear esa razón
contexto Examen	mostrar materia/Action sin fase, countdown o protocolo
feedback contract	no afirmar que se registró; conservar Action y mostrar error/reintento
	***
11. LIFECYCLE Y EVENTOS

11.1. Máquina de estado respetada

RECOMMENDED -> ACCEPTED -> COMMITTED -> IN_PROGRESS
                                          |
                                          v
                                  EVIDENCE_PENDING -> COMPLETED

Estados laterales aprobados: BLOCKED · CANCELLED/REPLACED

Este wireframe no define desde qué estados exactos puede entrar o salir BLOCKED o CANCELLED/REPLACED; consume el estado autoritativo.

11.2. Eventos aprobados relevantes

Evento	Momento	Regla de trazabilidad
ActionRecommended	emitido por el Engine antes de abrir WF-S05	WF-S05 lo muestra; no lo vuelve a emitir por una vista
ActionAccepted	aceptación confirmada desde Me comprometo	conserva action_id, actor, timestamp, institución y referencia de origen
CommitmentCreated	confirmación posterior en WF-S06	no se emite desde WF-S05
CommitmentStarted	inicio posterior	fuera de alcance
EvidenceSubmitted	envío posterior	fuera de alcance
EvidenceValidated	validación posterior	fuera de alcance
	11.3. Feedback sin evento aprobado

No existe en las fuentes un evento cerrado para:

recomendación rechazada;
imposibilidad para hoy;
duración incompatible;
recurso inaccesible;
dato usado incorrecto;
acción reportada como ya realizada;
bloqueo reportado.

Por lo tanto:

este documento no inventa nombres de evento;
la escritura, su auditoría y su eventual telemetría quedan SOURCE CONTRACT PENDING;
ActionAccepted no se emite cuando el estudiante envía feedback;
cualquier transición a BLOCKED, CANCELLED o REPLACED requiere confirmación del owner;
una futura Action mantiene relación trazable sólo si el dominio la provee.

11.4. Trazabilidad futura

Commitment y Evidence se relacionan con la misma Action mediante action_id. La aceptación debe conservar la referencia de ActionRecommendation recibida, sin crear una copia visual. La pantalla no necesita una entidad persistida propia.

***
12. CRITERIOS DE ACEPTACIÓN

12.1. Producto / Lead PO

En menos de 10 segundos se entiende materia/contexto, acción, razón, tiempo disponible, recurso principal, evidencia y cierre.
Existe una única CTA primaria.
Me comprometo termina en ACCEPTED y abre WF-S06; no crea Commitment.
La pantalla no decide prioridad, riesgo, materia, tema ni alternativa.
HOY, Materia y WF-S05 conservan la misma identidad, razón y lifecycle.
Corregir/rechazar conserva la recomendación original.
Una Action de incertidumbre no se presenta como aprendizaje.
Cursado y Examen son contexto, no dashboards duplicados.

12.2. UX/UI

Mobile 360 px contiene Action, razón, tiempo, evidencia, cierre y CTA antes del primer scroll cuando los datos existen.
Los recursos adicionales y razones completas usan progressive disclosure.
El control de feedback es secundario y accesible inmediatamente después de la CTA.
Los datos estimados/reportados muestran provenance, confidence y verification status aplicables.
No se usa color como única señal.
No se muestran placeholders engañosos para datos ausentes.
Recurso faltante, bloqueo y reemplazo se diferencian.
Ya realizada no parece Completada.

12.3. Academic Decision Engine / Backend

Entrega una recomendación principal inequívoca.
Devuelve Action y ActionRecommendation canónicas y vigentes.
Conserva reason, priority y generated_at.
Confirma ACCEPTED antes de emitir ActionAccepted.
No crea Commitment al aceptar la Action.
Devuelve lifecycle sin reinterpretación de frontend.
Preserva la recomendación original al procesar correcciones/rechazos.
No eleva verification status por un reporte del alumno.
No promete recomputación o reemplazo inmediato si no existe proceso real.

12.4. Data / Architecture

estimated_duration, vínculo Action–Resource, expected evidence y completion criterion tienen contrato cerrado antes de implementación completa.
La relación reason–provenance permite distinguir hechos de estimaciones/reportes cuando la razón depende de ellos.
El feedback de rechazo/corrección define owner, payload, persistencia, resultado y auditoría.
El historial conserva recomendación original y estado posterior sin sobrescritura silenciosa.
La vista derivada no se convierte en entidad o tabla por defecto.
Action, Commitment y Evidence conservan trazabilidad por action_id.

12.5. Eventos

Ver WF-S05 no duplica ActionRecommended.
Aceptación confirmada emite ActionAccepted una vez.
Feedback no emite ActionAccepted.
WF-S05 no emite CommitmentCreated.
No se crean eventos de producto no aprobados.

***
13. TEST DE 10 SEGUNDOS

La simulación evalúa sólo el primer viewport y no sustituye pruebas con estudiantes reales.

13.1. Escenario estándar — Cursado

Respuestas esperadas:

Qué hacer: resolver ejercicios 8–14 de U3.
Dónde: Análisis II, Cursado.
Por qué: preparar la próxima clase.
Tiempo: 60–75 minutos.
Recurso: Guía 3 oficial de cátedra.
Evidencia/cierre: siete ejercicios resueltos y producción adjunta.
Si acepta: define cuándo hacerla en Compromiso.

Resultado simulado: PASS.

13.2. Escenario incertidumbre

Respuestas esperadas:

Qué hacer: confirmar si U5 entra en el parcial.
Naturaleza: resolver información faltante; no estudiar ni demostrar dominio.
Evidencia: comunicado o respuesta con fuente.
Si acepta: define cuándo realizará la verificación.

Resultado simulado: PASS.

13.3. Escenario información no confirmada

Respuestas esperadas:

Qué hacer: revisar conceptos base de U4.
Por qué: podría haber comenzado U4.
Certeza: reporte del alumno, pendiente de corroboración, confianza operativa media.
Corrección: existe un acceso directo secundario.

Resultado simulado: PASS.

13.4. Escenario recurso inaccesible

Respuestas esperadas:

Qué impide empezar: la Guía 4 requerida no abre.
Qué hacer: informar el bloqueo.
Qué no ocurre: la pantalla no elige otro recurso ni otra Action.

Resultado simulado: PASS WITH CONTRACT RISK. El owner del feedback/bloqueo debe cerrarse antes de implementación.

13.5. Escenario Examen

Respuestas esperadas:

Qué hacer: resolver ejercicios 12–18 sin soluciones.
Contexto: Análisis II, Parcial 1.
Por qué: falta práctica autónoma.
Qué no aparece: protocolo, readiness, simulacros o dashboard de examen.

Resultado simulado: PASS.

Resultado global

4 PASS.
1 PASS WITH CONTRACT RISK.
0 FAIL.

El riesgo no requiere una nueva feature; exige cerrar contratos ya declarados.

***
14. DECISIONES DESCARTADAS

Decisión descartada	Motivo
mostrar varias recomendaciones	convierte WF-S05 en planificador y duplica Academic Decision Engine
botón Elegir otra con alternativa local	inventa una segunda recomendación
score de prioridad/riesgo	agrega falsa precisión y explicación algorítmica
modificar alcance o duración desde WF-S05	mezcla Action con Commitment/Engine
crear Commitment al tocar Me comprometo	salta ACCEPTED y elimina confirmación de hora/capacidad
marcar Completada porque el alumno dice que ya la hizo	confunde declaración, evidencia, validación y dominio
asumir recurso sustituto	convierte la vista en buscador/biblioteca y puede cambiar el trabajo académico
mostrar progreso, timeline o Bitácora	duplica Materia y aumenta densidad
mostrar protocolo completo de Examen	duplica ExamPreparation
chat general para rechazar	agrega navegación y captura no estructurada
explicar pesos/reglas del Engine	no ayuda a ejecutar y puede exponer scores opacos
crear entidad persistida ActionDetailView	la pantalla es proyección de lectura
crear entidad/evento RecommendationFeedback	no está aprobado; queda contrato pendiente
prometer nueva recomendación inmediata	no existe evento/proceso garantizado en las fuentes
	***
15. SOURCE CONTRACT PENDING

15.1. Bloqueantes para implementación fiel

Contrato	Necesidad mínima	Fallback de diseño
estimated_duration	estimación y semántica/rango	omitir tiempo
vínculo Action–Resource	recursos específicos, orden, obligatoriedad y estado de acceso	omitir recursos opcionales; bloquear honestamente si el requerido es inaccesible
expected_evidence	descripción verificable y tipo de producción	omitir; no inventar entrega
completion_criterion	condición mínima de cierre	omitir; no inferir dominio
reason–provenance	fuentes usadas, fecha, confidence y verification status	copy neutral; no presentar inferencia/reporte como hecho
contexto de Action	vínculo inequívoco a Cursado o ExamPreparation	mostrar sólo contexto confirmado
aceptación idempotente	confirmación de ACCEPTED y emisión única de ActionAccepted	permanecer RECOMMENDED y permitir reintento
feedback de rechazo/corrección	owner, motivos, payload mínimo, persistencia, respuesta y auditoría	no afirmar registro; error/reintento
historial/reemplazo	recomendación original, estado posterior y vínculo canónico a reemplazo	mostrar original; omitir CTA a reemplazo si no existe relación
transición a BLOCKED/CANCELLED/REPLACED	servicio propietario y reglas	nunca cambiar estado desde frontend
	15.2. No bloqueantes para wireframe

copy exacto de No puedo hacerla / Corregir información;
sheet, modal o pantalla breve para feedback;
orden visual exacto de recursos secundarios;
expansión inline o pantalla para razones/provenance;
proporción de columnas desktop;
truncamiento visual del nombre de materia/objetivo.

Estas decisiones son reversibles y no alteran ownership, lifecycle ni entidades.

***
16. CHANGE REQUESTS Y ESTADO FINAL

16.1. Change Requests

Ninguno.

La solución no exige modificar Product Spec, Design Spec, HOY, Materia, Academic Decision Engine, navegación estructural, entidades ni eventos aprobados.

Los contratos técnicos abiertos se registran como SOURCE CONTRACT PENDING. El feedback de rechazo/corrección es una necesidad funcional explícita del sprint, pero su persistencia y telemetría no se cierran mediante una entidad o evento inventado.

16.2. Self-audit

Criterio	Resultado
ActionRecommendation ya priorizada	PASS
Una CTA primaria en 360 px	PASS
Aceptación separada de Commitment	PASS
Evidencia separada de dominio	PASS
Incertidumbre diferenciada de aprendizaje	PASS
Provenance visible cuando la razón no es confirmada	PASS
Corrección/rechazo conserva historia	PASS CON SOURCE CONTRACT PENDING
Sin alternativas locales	PASS
Sin dashboard, calendario, Bitácora o protocolo completo	PASS
Sin nuevas entidades o eventos	PASS
Consistencia con HOY y Materia	PASS
	Estado final

ACHIEVE_PROXIMA_ACCION_FUNCTIONAL_WIREFRAME_v0.1.md queda:

READY FOR LEAD PRODUCT OWNER AUDIT


***

VI.4 — Compromiso

ACHIEVE — COMPROMISO

FUNCTIONAL WIREFRAME v0.2 CANDIDATE

Estado: candidato de corrección controlada de v0.1, listo para reauditoría independiente de Lead Product Owner.  
Fecha: 22 de agosto de 2026.  
Sprint: SPRINT UX 04 — COMPROMISO.  
Wireframe: WF-S06 — Compromiso.  
Tipo: especificación funcional; no UI high-fi.  
Responsable: Senior Product Designer de Achieve.

Baseline obligatorio

ACHIEVE_MVP_USUARIO_PRODUCT_SPEC_v0.5_FINAL.
ACHIEVE_USER_FLOW_WIREFRAMES_DATA_MODEL_v0.2_FINAL.
ACHIEVE_HOY_AUTOGESTION_FUNCTIONAL_SPEC_v1.0_APPROVED.
ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_SPEC_v1.0_APPROVED.
ACHIEVE_PROXIMA_ACCION_FUNCTIONAL_SPEC_v1.0_APPROVED.
ACHIEVE_COMPROMISO_FUNCTIONAL_WIREFRAME_v0.1.md.
ACHIEVE_COMPROMISO_PRODUCT_OWNER_AUDIT_v0.1.md.

Jerarquía aplicada

Product Spec v0.5 define alcance, principios y mecanismos de producto.
Design Spec v0.2 define WF-S06, entidades, relaciones y máquinas de estado.
HOY v1.0 define precedencia operativa y cómo se presenta un Commitment vigente.
Materia v1.0 define el contexto académico persistente y conserva la misma Action/Commitment.
Próxima Acción v1.0 define la Action ACCEPTED y el handoff canónico hacia esta pantalla.
Este documento especifica únicamente la creación, lectura y renegociación responsable del acuerdo conductual.

No se modifica ninguna fuente aprobada. No se agregan Engines, entidades, navegación estructural ni eventos de dominio.

Alcance de esta revisión

Esta versión aplica exclusivamente los cinco findings P1 de la auditoría:

CMP-P1-01: inputs operables y siguiente evento real en el DRAFT mobile 360 px;
CMP-P1-02: semántica inequívoca de Evidence esperada antes de submission;
CMP-P1-03: COMPLETED proyecta el estado real de Evidence;
CMP-P1-04: mapping observable y coordinado entre Commitment y Action;
CMP-P1-05: rescate materializado como condición derivada, con MISSED original preservado.

No se implementan los P2. No se modifican el JTBD, las decisiones aprobadas, el alcance, las features, los Engines, las entidades, los eventos ni los contratos.

***
1. OBJETIVO Y LÍMITES

1.1. Job to be done

Cuando el estudiante llega desde una Action aceptada, debe poder transformar esa decisión académica en un acuerdo conductual observable y realista:

qué hará;
cuándo empezará;
cuánto tiempo tiene realmente;
qué evidencia se espera;
qué significa confirmar;
qué ocurrirá después;
cómo renegociar antes del vencimiento;
qué ocurre si no cumple.

En menos de 10 segundos debe poder responder:

qué Action está comprometiendo;
qué día y a qué hora la realizará;
cuál es la estimación original de la Action;
cuánto tiempo declara disponible;
qué evidencia deberá producir;
qué registra el CTA final;
qué pantalla o estado sigue.

1.2. Resultado funcional

La pantalla convierte una Action en estado ACCEPTED en un Commitment confirmado y trazable, sin cambiar el trabajo académico.

Al confirmar con éxito:

se materializa/confirma un único Commitment canónico;
se vincula mediante el mismo action_id;
la Action pasa de ACCEPTED a COMMITTED cuando el servicio propietario confirma la operación;
se emite CommitmentCreated una sola vez;
HOY, Materia y CRM pueden consumir el mismo objeto mediante los contratos aprobados.

Antes del CTA final no existe un Commitment confirmado ni visible como compromiso activo en otras superficies.

1.3. Incluye

contexto no editable de la Action aceptada;
fecha y hora de inicio;
zona horaria comprensible;
estimación original cuando existe contrato;
tiempo disponible declarado;
evidencia esperada y criterio de cierre cuando existen contratos;
estado de draft no autoritativo;
confirmación idempotente;
lectura de estados CONFIRMED, DUE, STARTED, COMPLETED, RENEGOTIATED y MISSED;
renegociación antes del vencimiento;
preservación del original y creación de un nuevo Commitment;
handoff mínimo ante falta de capacidad;
handoff mínimo ante MISSED y rescate existente/no existente;
contexto Cursado o ExamPreparation;
integración conceptual con HOY, Materia y CRM.

1.4. No incluye

cambiar prioridad, materia, tema, alcance o recursos de la Action;
recortar automáticamente la Action;
crear una recomendación alternativa;
recomendar horarios de forma autónoma;
recalcular riesgo;
validar Evidence;
inferir dominio;
upload completo de Evidence;
timer como prueba de ejecución;
calendario completo;
lista histórica general de compromisos;
Bitácora;
chat;
recordatorios múltiples;
rachas, puntos, premios o estadísticas;
diseño del Intervention Engine, Rescue Engine o CRM;
promesa de seguimiento/revisión humana sin objeto real.

1.5. Decisión central

> La pantalla administra el acuerdo conductual; el Academic Decision Engine conserva la decisión académica.

El estudiante puede decidir cuándo y cuánto tiempo real compromete. No puede usar esta pantalla para convertir la Action en otra Action.

***
2. RELACIÓN CON PRÓXIMA ACCIÓN, HOY Y MATERIA

Superficie	Pregunta	Responsabilidad	Qué no duplica
Próxima Acción	¿Qué tengo que hacer y por qué?	explica Action, recursos, evidencia y cierre; registra ACCEPTED	horario, capacidad y confirmación del Commitment
Compromiso	¿Cuándo y bajo qué acuerdo real lo haré?	define start_at, capacidad/duración y lifecycle conductual	prioridad, progreso, Evidence upload o validación
HOY	¿Qué conducta operativa requiere atención ahora?	proyecta el Commitment vigente según lifecycle	creación/renegociación completa
Materia	¿Cómo se integra este trabajo al cursado?	muestra el mismo Commitment en su CourseEnrollment	planificación general o historial completo
	2.1. Identidad conservada

Las cuatro superficies comparten:

action_id;
identidad canónica de la Action;
materia/tema/objetivo;
contexto CURSADO o EXAMEN;
alcance no editable;
estimación original, si existe;
evidencia esperada, si existe;
criterio de cierre, si existe;
Commitment canónico una vez confirmado;
estado y horario autoritativos.

No se copian Actions ni Commitments para cada pantalla.

2.2. Entrada válida

La entrada principal ocurre después de que WF-S05 confirmó:

Action canónica vigente;
Action.status = ACCEPTED;
emisión previa de ActionAccepted;
contexto académico correspondiente.

Si la Action llega en otro estado, la pantalla no abre un draft editable como si siguiera aceptada. Resuelve el estado autoritativo y muestra el Commitment existente o vuelve al objeto vigente.

2.3. Salidas válidas

retorno a Próxima Acción sin confirmar;
confirmación y retorno a HOY;
confirmación y visualización del Commitment dentro de Materia;
inicio de Action cuando el Commitment está DUE;
handoff a WF-S07 después de ejecución/completitud conductual;
flujo de renegociación del Commitment vigente;
resolución de MISSED/No Cortar mediante objetos existentes.

No se agrega navegación global.

***
3. PRINCIPIOS FUNCIONALES Y OWNERSHIP

3.1. Action inmutable en esta pantalla

Se muestran como contexto no editable:

materia;
contexto Cursado/Examen;
verbo + alcance;
estimación original;
recursos principales cuando aportan contexto;
evidencia esperada;
criterio de cierre.

Si alguno es incorrecto, el alumno vuelve al contrato de corrección/rechazo ya definido en Próxima Acción. Compromiso no lo modifica localmente.

3.2. Decisiones del estudiante

El estudiante define:

fecha;
hora de inicio;
tiempo disponible que declara para ese acuerdo.

La pantalla puede validar consistencia operativa —fecha pasada, zona horaria o diferencia de capacidad— sin tomar una decisión académica.

3.3. Estimación, capacidad y horario son datos distintos

Dato	Pregunta	Ejemplo	Regla
Estimación de Action	¿Cuánto trabajo estima el contrato académico?	60–75 min	no editable; se omite si falta contrato
Tiempo disponible declarado	¿Cuánto declara poder sostener el alumno en este acuerdo?	70 min	input puntual del alumno para este Commitment; alimenta planned_minutes y no se presenta como observación objetiva ni duración ejecutada
Horario elegido	¿Cuándo empieza?	23 ago · 19:00	se interpreta con timezone válida
Tiempo real ejecutado	¿Cuánto ocurrió efectivamente?	68 min	no se captura como resultado en esta pantalla; pertenece al cierre/evidencia
	3.4. Draft no autoritativo

Mientras el alumno edita fecha, hora y capacidad, la UI representa un DRAFT.

Para conservar el handoff aprobado desde Próxima Acción:

no se considera Commitment activo;
no aparece en HOY, Materia ni CRM como confirmado;
no cambia Action a COMMITTED;
no emite CommitmentCreated;
puede descartarse al salir.

Si el draft se persiste temporalmente en servidor o sólo vive en cliente es SOURCE CONTRACT PENDING. Esa decisión técnica no puede volverlo autoritativo antes del CTA final.

3.5. Confirmación explícita

Confirmar compromiso significa:

> “Queda registrado que voy a realizar esta Action, en este horario, con esta capacidad declarada y con esta evidencia esperada.”

No significa:

que ya empezó;
que va a terminarse automáticamente;
que la evidencia ya fue entregada;
que la evidencia será suficiente;
que existe dominio;
que una persona escribirá o revisará.

***
4. FLUJO PRINCIPAL DE CREACIÓN

4.1. Flujo estándar

WF-S06 recibe Action ACCEPTED y referencia canónica.
Resuelve el estado autoritativo más reciente.
Muestra Action, estimación, evidencia y cierre como contexto no editable.
Solicita fecha, hora y tiempo disponible declarado.
Valida fecha/hora, timezone y comparación operativa de capacidad.
Muestra un resumen del acuerdo.
El estudiante selecciona Confirmar compromiso.
El servicio propietario confirma de forma idempotente el Commitment.
Action pasa a COMMITTED si la misma operación confirma esa transición.
Se emite CommitmentCreated una vez.
La respuesta devuelve Commitment canónico y estado CONFIRMED.
HOY, Materia y CRM consumen el mismo objeto.

4.2. Salir antes de confirmar

Si el estudiante vuelve o cierra la pantalla:

Action permanece ACCEPTED;
no existe Commitment confirmado;
no se emite evento;
no se promete reserva de horario;
el draft puede descartarse o recuperarse sólo si el contrato técnico lo permite.

4.3. Confirmación concurrente

Antes de escribir, el servicio debe verificar:

que la Action sigue ACCEPTED;
que no existe otro Commitment confirmado incompatible;
que el request no fue confirmado previamente;
que el horario enviado sigue siendo válido.

Si ya existe un Commitment canónico para la misma confirmación, la UI lo recupera y no crea otro.

4.4. Siguiente estado real

Después de confirmar:

si el horario es futuro: CONFIRMED;
cuando el lifecycle propietario determina que corresponde iniciar: DUE;
al confirmar inicio: STARTED;
al confirmar cierre conductual: COMPLETED;
si vence sin cumplimiento: MISSED.

La UI no calcula ni escribe esos estados por el mero paso del tiempo; consume el lifecycle autoritativo.

***
5. INVENTARIO FUNCIONAL

Bloque	Contenido	Regla
Header	retorno + COMPROMISO	no agrega navegación
Contexto académico	materia + Cursado/Examen	no rankea ni cambia prioridad
Action aceptada	tema/objetivo + verbo + alcance	no editable
Estimación	duración original	separada de capacidad; se omite si no existe
Fecha	día elegido	no admite pasado según validación propietaria
Hora	inicio elegido	muestra timezone comprensible
Capacidad	minutos declarados disponibles	no equivale a minutos ejecutados
Comparación	suficiente/menor/desconocida	operacional; no recorta ni recomienda
Evidencia esperada	producción requerida	no es evidencia entregada
Criterio de cierre	condición de Action	no equivale a dominio
Significado	consecuencia de confirmar	copy breve, factual
CTA primaria	Confirmar compromiso	única acción primaria en DRAFT estándar
Handoff de diferencia	revisar disponibilidad / informar que no entra	no genera Action alternativa
Estado confirmado	fecha, hora, capacidad, Action y evidencia	misma identidad en todas las vistas
Renegociación	original + nueva propuesta	preserva original; crea nuevo Commitment
MISSED	original incumplido + siguiente paso real	no permite edición retroactiva
Humano	Intervention/assignment real	se omite si no existe
	***
6. WIREFRAME MOBILE — 360 PX

6.1. DRAFT estándar con disponibilidad suficiente

+--------------------------------------+
| <- COMPROMISO · ANALISIS II · CURSADO|
| UNIDAD 3 · ACCION ACEPTADA           |
| Resolver ejercicios 8–14             |
+--------------------------------------+
| FECHA       [ Sab 23 ago          v ]|
| HORA        [ 19:00               v ]|
| TIEMPO QUE DECLARAS                  |
|             [ 70 min              v ]|
| Estimacion 60–75 · cubre el minimo   |
| Zona horaria: Cordoba                |
+--------------------------------------+
| Evidencia esperada: 7 ejercicios     |
| Cierre: completos y adjuntos         |
| Despues: queda CONFIRMED en Hoy y    |
| Materia; podras iniciarlo cuando     |
| corresponda.                         |
| [   CONFIRMAR COMPROMISO           ] |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |

Qué entiende: Action, los tres valores editables, estimación vs. capacidad declarada, evidencia esperada, criterio de cierre y siguiente evento real.  
Qué no aparece: prioridad, riesgo, progreso, humano, timer, segunda Action o calendario.

Conteo actualizado del primer viewport

Elemento	Conteo	Verificación
Bloques funcionales	3	identidad/Action; inputs/comparación; evidencia/cierre/después/CTA
Inputs lógicos requeridos	3	fecha, hora y minutos declarados
Inputs visualmente identificables	3	tres controles con valor y affordance v
CTA primaria	1	Confirmar compromiso
Labels/contextos visibles	7	materia/contexto, unidad/estado, fecha, hora, tiempo declarado, timezone y evidencia/cierre
Explicaciones	2	comparación de capacidad y siguiente evento real
Estados/condiciones simultáneos	3	Action ACCEPTED, DRAFT no autoritativo y capacidad suficiente
	Los tres controles son operables en el wireframe funcional. Su componente visual definitivo permanece reversible; no se agrega calendario, wizard ni recomendador de horarios.

6.2. DRAFT asociado a ExamPreparation

+--------------------------------------+
| <- COMPROMISO                        |
| ANALISIS II · EXAMEN · PARCIAL 1     |
+--------------------------------------+
| ACCION ACEPTADA · UNIDAD 4           |
| Resolver ejercicios 12–18 sin mirar  |
| soluciones · Estimacion: 70 min      |
+--------------------------------------+
| CUANDO                               |
| Dom 24 ago · 18:30                   |
| Tiempo declarado: 75 min             |
+--------------------------------------+
| EVIDENCIA ESPERADA                   |
| Resolucion bajo las condiciones dadas|
|                                      |
| [   CONFIRMAR COMPROMISO           ] |
+--------------------------------------+

ExamPreparation aporta contexto. No se muestran protocolo, readiness, simulacro ni otra CTA.

6.3. Disponibilidad menor que la estimación

+--------------------------------------+
| <- COMPROMISO                        |
| ANALISIS II · CURSADO                |
+--------------------------------------+
| Resolver ejercicios 8–14             |
| Estimacion: 60–75 min                |
+--------------------------------------+
| Sab 23 ago · 19:00                   |
| Tiempo declarado: 40 min             |
+--------------------------------------+
| EL TIEMPO NO CUBRE LA ESTIMACION     |
| La Action sigue siendo completa.     |
| No vamos a recortarla desde aca.     |
|                                      |
| [     REVISAR DISPONIBILIDAD       ] |
| Informar que la duracion no entra    |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| No se creo un Commitment.            |
+--------------------------------------+

Reglas:

no se oculta la diferencia;
no se afirma que 40 minutos alcanzan;
no se modifica Action ni evidencia;
Revisar disponibilidad mantiene el draft y permite corregir fecha/hora/capacidad;
Informar que la duración no entra usa el handoff aprobado de Próxima Acción;
no se confirma un Commitment hasta resolver la diferencia o recibir una respuesta autoritativa;
no se crea una nueva recomendación desde esta vista.

6.4. Fecha/hora inválida o pasada

+--------------------------------------+
| <- COMPROMISO                        |
+--------------------------------------+
| CUANDO                               |
| Vie 22 ago · 16:00                   |
|                                      |
| Ese horario ya paso en Cordoba.      |
| Elegi un inicio futuro.              |
|                                      |
| [   CONFIRMAR COMPROMISO · INACTIVO ]|
+--------------------------------------+

No se corrige silenciosamente al próximo día ni se recomienda un horario. El alumno elige otro valor.

6.5. CONFIRMED

+--------------------------------------+
| COMPROMISO CONFIRMADO                |
| ANALISIS II · UNIDAD 3               |
+--------------------------------------+
| Sab 23 ago · 19:00                   |
| 70 min · Estimacion: 60–75 min       |
| Evidencia esperada: 7 ejercicios     |
|                                      |
| Cuando llegue el horario, podras     |
| empezar esta misma Action.           |
|                                      |
| [          VER EN HOY              ] |
| Renegociar antes del horario         |
+--------------------------------------+

No promete recordatorio, mensaje humano ni cumplimiento.

6.6. DUE

+--------------------------------------+
| ES HORA DE EMPEZAR                   |
| ANALISIS II · UNIDAD 3               |
+--------------------------------------+
| Resolver ejercicios 8–14             |
| 70 min · Evidencia esperada: 7 ej.   |
|                                      |
| [            EMPEZAR               ] |
| Renegociar, si todavia es elegible   |
+--------------------------------------+

Empezar solicita al owner la transición coordinada: Commitment STARTED + Action IN_PROGRESS. CommitmentStarted se emite sólo si la operación confirma; la vista no deriva ninguno de los dos estados.

6.7. STARTED

+--------------------------------------+
| COMPROMISO INICIADO                  |
| ANALISIS II · UNIDAD 3               |
+--------------------------------------+
| Resolver ejercicios 8–14             |
| Evidencia esperada: 7 ejercicios     |
|                                      |
| [       CONTINUAR ACCION           ] |
| Informar un bloqueo real             |
+--------------------------------------+

No existe edición del horario iniciado. Un timer, si alguna vez se representa, no completa el Commitment ni demuestra aprendizaje.

6.8. COMPLETED sin inferir dominio

COMPLETED sólo informa el cierre conductual del Commitment. El bloque lee el lifecycle autoritativo de Evidence y presenta una de estas variantes:

A. Evidence EXPECTED

+--------------------------------------+
| COMPROMISO COMPLETADO                |
| ANALISIS II · UNIDAD 3               |
+--------------------------------------+
| Registramos el cierre conductual.    |
| Evidencia esperada: 7 ejercicios     |
| Estado: todavia no enviada           |
|                                      |
| Esto no define tu dominio del tema.  |
|                                      |
| [        SUBIR EVIDENCIA           ] |
+--------------------------------------+

B. Evidence SUBMITTED

+--------------------------------------+
| COMPROMISO COMPLETADO                |
| ANALISIS II · UNIDAD 3               |
+--------------------------------------+
| Registramos el cierre conductual.    |
| Evidencia enviada                    |
| Estado: pendiente de validacion      |
|                                      |
| Esto no define tu dominio del tema.  |
|                                      |
| [        VER EVIDENCIA             ] |
+--------------------------------------+

C. Evidence VALIDATED

+--------------------------------------+
| COMPROMISO COMPLETADO                |
| ANALISIS II · UNIDAD 3               |
+--------------------------------------+
| Registramos el cierre conductual.    |
| Evidencia validada                   |
|                                      |
| La validacion no implica dominio     |
| universal del tema.                  |
|                                      |
| [          VER AVANCE              ] |
+--------------------------------------+

Si Evidence no puede cargarse, el copy es neutral: Consultá el estado de la evidencia. La CTA aparece sólo cuando el read model entrega un destino real. COMPLETED no permite inferir si Evidence falta, fue enviada o fue validada.

***
7. WIREFRAME DESKTOP

+--------------------------------------------------------------------------------------------------+
| <- COMPROMISO                                      ANALISIS II · CURSADO                          |
+--------------------------------------------------------------------------------------------------+
| ACCION ACEPTADA                                             | ACUERDO                              |
| Unidad 3                                                    |                                     |
| Resolver ejercicios 8–14                                   | Sabado 23 de agosto                  |
|                                                             | 19:00 · Cordoba                      |
| Estimacion original: 60–75 min                              |                                     |
| Evidencia esperada: 7 ejercicios resueltos                  | Tiempo declarado: 70 min             |
| Criterio: produccion completa y adjunta                     | Cubre el minimo estimado             |
|                                                             |                                     |
| La Action y su alcance no cambian al confirmar.             | [ CONFIRMAR COMPROMISO ]             |
+--------------------------------------------------------------------------------------------------+
| Confirmar registra Action, horario, capacidad y evidencia esperada. No inicia ni completa.       |
+--------------------------------------------------------------------------------------------------+

Reglas desktop

conserva exactamente la jerarquía de mobile;
usa el ancho para separar contexto académico y acuerdo;
no agrega calendario, histórico, métricas ni recomendaciones;
mantiene una sola CTA primaria;
el significado de confirmar permanece visible;
el estado de capacidad no se expresa sólo con color.

***
8. LIFECYCLE COMPLETO

8.1. Máquina de estado respetada

DRAFT -> CONFIRMED -> DUE -> STARTED -> COMPLETED
              |          |
              +--------> RENEGOTIATED -> nuevo Commitment
              |
              +--------> MISSED -> [resolucion conceptual] / CLOSED

La rama conceptual MISSED → RESCUE_CREATED / CLOSED del Design Spec se conserva sin proyectar RESCUE_CREATED como un estado nuevo de pantalla. El Commitment original permanece observable como MISSED; si existe una Action o Commitment de rescate real vinculada, todas las superficies consumen la condición derivada RESCUE_MATERIALIZED y el lifecycle propio de ese objeto.

Si la implementación canónica mantiene Commitment.state = RESCUE_CREATED en el Commitment original por compatibilidad con la máquina conceptual, ese es el objeto que porta el state. El read model común lo traduce sin ambigüedad: el outcome histórico del original se muestra como MISSED, la existencia del rescate como condición RESCUE_MATERIALIZED y la Action/Commitment vinculada con su state real.

La persistencia exacta de esa compatibilidad queda SOURCE CONTRACT PENDING. No se crea entidad ni evento. HOY, Materia, Compromiso y CRM consumen la misma traducción, no interpretaciones distintas.

8.2. Semántica por estado

Estado	Significado	Conducta principal	Registro preservado
DRAFT	propuesta no autoritativa de fecha/hora/capacidad	completar o salir	Action ACCEPTED; ningún Commitment confirmado
CONFIRMED	acuerdo canónico vigente para un inicio futuro	ver o renegociar si es elegible	Action, horario, capacidad, evidencia, created_at cuando exista
DUE	el lifecycle owner lo considera iniciable ahora	empezar o renegociar si todavía es elegible	acuerdo original
STARTED	inicio confirmado	continuar Action	started_at cuando exista; horario original
COMPLETED	cierre conductual confirmado	ir a Evidence/estado siguiente real	no infiere Evidence suficiente ni dominio
RENEGOTIATED	el acuerdo original fue sustituido responsablemente antes del vencimiento	ver el nuevo Commitment	original completo + relación al nuevo
MISSED	venció sin cumplimiento conforme al owner	retomar	incumplimiento, horario y Action originales
RESCUE_MATERIALIZED —condición derivada—	existe Action/Commitment de rescate real vinculada	abrir/empezar ese objeto según su lifecycle	MISSED original + rescate separado
CLOSED	lifecycle original cerrado sin presentarlo como cumplido	ver estado factual/volver	original y motivo/outcome disponible
	8.3. Reglas invariantes

Un MISSED no puede editarse para parecer CONFIRMED o COMPLETED.
Un RENEGOTIATED conserva el Commitment original.
Un nuevo horario genera un nuevo Commitment; no sobrescribe el anterior.
Un rescate no cambia el original a cumplido.
EvidenceSubmitted no cambia automáticamente Commitment a COMPLETED.
COMPLETED no cambia automáticamente Evidence a VALIDATED.
COMPLETED no implica dominio.
Minutos transcurridos no deciden state.
La UI no escribe estados por timers locales.
HOY, Materia, Compromiso y CRM leen el mismo estado.

8.4. Coordinación observable Commitment ↔ Action

El owner de lifecycle devuelve un resultado coordinado para que las cuatro superficies no presenten estados incompatibles:

Operación confirmada	Commitment observable	Action observable	Regla
entrada/edición de DRAFT	ningún Commitment confirmado	ACCEPTED	el draft no cambia Action
confirmación inicial	CONFIRMED	COMMITTED	mismo action_id; CommitmentCreated una vez
ventana iniciable	DUE	COMMITTED	estar due no inicia la Action
inicio aceptado	STARTED	IN_PROGRESS	coordinación confirmada por owner; no timer/frontend
cierre conductual + Evidence EXPECTED	COMPLETED	EVIDENCE_PENDING	la Action requiere la conducta de envío configurada
cierre conductual + Evidence SUBMITTED/UNDER_REVIEW/SUFFICIENT	COMPLETED	estado autoritativo del lifecycle de Action, normalmente EVIDENCE_PENDING hasta su cierre	no reabre ni completa por inferencia
cierre conductual + Evidence VALIDATED	COMPLETED	estado autoritativo confirmado por owner, incluido COMPLETED cuando corresponda	validación no implica dominio
	La atomicidad o secuencia técnica de estas escrituras es SOURCE CONTRACT PENDING. El resultado funcional no: tras cada operación, Commitment y Action deben releerse de una respuesta autoritativa y consistente. Si el owner devuelve una combinación incompatible, la UI muestra error técnico y no elige cuál estado “vale”.

***
9. RENEGOCIACIÓN RESPONSABLE

9.1. Principio

> Renegociar antes del vencimiento es una conducta válida; editar después para ocultar el incumplimiento no lo es.

La facilidad para renegociar antes no elimina trazabilidad.

9.2. Elegibilidad

La UI no deduce por cuenta propia si se puede renegociar. Consume una elegibilidad autoritativa que considera, como mínimo:

estado vigente;
horario actual;
timezone;
si ya comenzó;
si ya venció;
si ya fue reemplazado.

La forma técnica de esa elegibilidad es SOURCE CONTRACT PENDING.

9.3. Cambio de horario antes del vencimiento

Flujo:

abre Renegociar desde el Commitment vigente;
muestra el original no editable;
solicita nueva fecha, hora y capacidad;
vuelve a comparar capacidad con estimación sin modificar Action;
explica que el original quedará registrado;
confirma la renegociación;
el owner marca el original RENEGOTIATED;
crea/devuelve un nuevo Commitment canónico para el mismo action_id;
emite CommitmentRenegotiated según el contrato aprobado;
HOY, Materia y CRM pasan a leer el nuevo objeto sin borrar el anterior.

Wireframe

+--------------------------------------+
| RENEGOCIAR COMPROMISO                |
+--------------------------------------+
| ORIGINAL                             |
| Sab 23 ago · 19:00 · 70 min          |
| Quedara registrado como renegociado. |
+--------------------------------------+
| NUEVO ACUERDO                        |
| Dom 24 ago · 10:00                   |
| Tiempo declarado: 75 min             |
|                                      |
| Action: ejercicios 8–14 · sin cambios|
| Evidencia esperada: 7 ej. · igual    |
|                                      |
| [   CONFIRMAR RENEGOCIACION        ] |
+--------------------------------------+

9.4. Reducción de disponibilidad

Si la nueva capacidad queda debajo de la estimación:

se muestra la diferencia;
no se permite presentar el nuevo acuerdo como suficiente;
se ofrece revisar disponibilidad;
se ofrece el handoff aprobado para informar que la duración no entra;
no se recorta la Action;
no se crea el nuevo Commitment hasta recibir una resolución válida.

9.5. Imposibilidad real de cumplir

Antes del vencimiento:

el alumno puede abrir renegociación;
si no existe horario/capacidad posible, usa el handoff de imposibilidad/bloqueo ya aprobado;
la vista no cancela Action, crea RiskSignal, crea Intervention ni genera reemplazo;
el estado posterior depende de la confirmación del owner.

9.6. Commitment ya vencido

No ofrece Editar horario ni Renegociar sobre el objeto original. Muestra MISSED y Retomar.

9.7. Commitment ya iniciado

No ofrece renegociación del mismo acuerdo. Permite:

continuar la Action;
informar un bloqueo real mediante el contrato existente;
recibir el estado posterior del owner.

No inventa pausa, abandono, cancelación o evento nuevo.

***
10. MISSED, NO CORTAR Y RESCATE

10.1. MISSED sin rescate materializado

+--------------------------------------+
| COMPROMISO INCUMPLIDO                |
| ANALISIS II · UNIDAD 3               |
+--------------------------------------+
| Original: vie 22 ago · 19:00         |
| 70 min · Resolver ejercicios 8–14    |
|                                      |
| El acuerdo original queda registrado.|
| Todavia no existe un rescate concreto.|
|                                      |
| [             RETOMAR              ] |
+--------------------------------------+
| No hay intervencion humana asignada. |
+--------------------------------------+

Retomar abre/continúa la resolución del incumplimiento. No afirma ejercicios reducidos, horario, evidencia, acompañante ni nueva Action.

10.2. RESCUE_MATERIALIZED

RESCUE_MATERIALIZED es una condición derivada y sólo se representa cuando existe una Action o Commitment de rescate real relacionado con el MISSED. No es entidad, evento ni nuevo state del objeto de rescate.

+--------------------------------------+
| RESCATE DISPONIBLE                   |
| ANALISIS II                          |
+--------------------------------------+
| Rescate: ejercicios 8–10             |
| Hoy · 21:00 · 20 min                 |
| Evidencia esperada: 3 ejercicios     |
|                                      |
| [        VER RESCATE               ] |
+--------------------------------------+
| COMPROMISO ORIGINAL                  |
| Vie 22 ago · 19:00 · INCUMPLIDO      |
+--------------------------------------+

La CTA y los datos provienen del objeto de rescate existente y respetan su lifecycle real. El Commitment original permanece MISSED. La pantalla no crea el rescate por mostrar el incumplimiento.

10.3. Rescate completado

RescueSucceeded sólo se usa cuando el rescate real cumplió su contrato y el owner emite el evento. La UI puede mostrar:

RESCATE COMPLETADO
Volviste a ejecutar una acción después del incumplimiento.
El compromiso original sigue registrado como incumplido.

No muestra el rescate como cumplimiento original ni borra el historial.

10.4. Ausencia de intervención humana

La ausencia se resuelve omitiendo promesas. Puede mostrarse, cuando evita confusión:

No hay una intervención humana asignada.

No se promete:

“tu acompañante te escribirá”;
“lo revisaremos hoy”;
“te vamos a rescatar”;
“alguien está siguiendo este compromiso”.

Si existe Intervention real y visible, se muestra owner/status/SLA únicamente según el contrato autorizado.

***
11. ESTADOS CRÍTICOS

11.1. Matriz funcional

Estado/condición	Qué ve	Qué puede hacer	Transición real	Qué permanece registrado
DRAFT estándar	Action + estimación + fecha/hora + capacidad + evidencia	confirmar o salir	a CONFIRMED sólo con escritura exitosa	Action ACCEPTED; draft no autoritativo
Disponibilidad suficiente	comparación explícita	confirmar	CommitmentCreated	estimación y capacidad separadas
Disponibilidad menor	diferencia + Action intacta	revisar o informar que no entra	ninguna local; handoff al owner	Action original y draft
Fecha/hora inválida	error contextual y timezone	corregir	ninguna	ningún Commitment confirmado
CONFIRMED	acuerdo canónico + evidencia esperada	ver en HOY/Materia o renegociar	Commitment CONFIRMED + Action COMMITTED	fecha, hora, capacidad, Action, evidencia esperada
DUE	acuerdo iniciable + evidencia esperada	empezar	si confirma owner: Commitment STARTED + Action IN_PROGRESS	acuerdo original
STARTED	Action IN_PROGRESS + evidencia esperada	continuar o informar bloqueo	coordinación del owner	horario e inicio
COMPLETED	cierre conductual + state real de Evidence	CTA condicionada a Evidence	Commitment COMPLETED + Action según 8.4	no infiere Evidence ni dominio
Renegociación elegible	original + nuevos campos	confirmar renegociación	original RENEGOTIATED + nuevo Commitment	ambos objetos y relación
RENEGOTIATED	original no vigente + nuevo vigente	ver nuevo	ninguna local	original completo
MISSED	incumplimiento factual	retomar	resolución propietaria	original intacto
RESCUE_MATERIALIZED	condición derivada + objeto real + original MISSED	abrir/empezar según lifecycle del rescate	ninguna transición local	original + relación + objeto real
MISSED sin rescate	ausencia factual	retomar	definición; no materialización automática	original
Cursado	CourseEnrollment + Action	mismo lifecycle	mismo contrato	contexto Cursado
ExamPreparation	Assessment/Preparation + Action	mismo lifecycle	mismo contrato	contexto Examen
Sin Intervention	ninguna promesa humana	operar por la UI	ninguna	ausencia de assignment
Error de confirmación	estado incierto o no confirmado	reintentar/reconciliar	sólo después de lectura autoritativa	evita Commitment duplicado
	11.2. Conflictos

Conflicto	Resolución
Action cambió de ACCEPTED antes de confirmar	detener mutación y mostrar estado vigente
Ya existe Commitment confirmado para la Action	abrir el existente; no crear otro
Hora futura en dispositivo pero pasada en timezone del estudiante	usar timezone autoritativa y marcar inválida
Estimación ausente	omitir comparación; no afirmar suficiencia
Evidencia esperada ausente	omitir dato; no inventar producción
Commitment DUE + renegociación elegible	Empezar primaria; renegociación secundaria
Commitment STARTED + pedido de cambio horario	no editar; continuar o informar bloqueo
MISSED + nueva recomendación no aceptada	resolver MISSED; no mostrar segunda prioridad
MISSED + rescate materializado	mostrar rescate según su lifecycle y original missed secundario
Evidence enviada + Commitment no completado	no sincronizar estados por inferencia
Commitment/Action devueltos en combinación incompatible	error técnico; releer al owner y no resolver en frontend
Timer finalizado + Action abierta	no completar Commitment ni Action
CRM no disponible tras confirmación en Plataforma	Commitment de Plataforma sigue siendo la fuente; sincronización se reintenta por contrato, sin duplicarlo
	***
12. DATA CONTRACTS Y OWNERSHIP

12.1. Clasificaciones

DOMAIN OWNED: entidad, campo o lifecycle aprobado.
DERIVED READ MODEL: composición o condición de lectura; no entidad nueva.
SOURCE CONTRACT PENDING: necesidad funcional aprobada cuyo campo, relación, owner técnico o mutación exacta no está cerrado.
UNSUPPORTED: dato o conducta prohibida para esta pantalla.

12.2. Matriz

Dato	Clasificación	Fuente/regla
Action	DOMAIN OWNED	entidad de ejecución; llega ACCEPTED
ActionRecommendation	DOMAIN OWNED	referencia original; no se reprioriza
Commitment	DOMAIN OWNED	acuerdo conductual vinculado a Action
action_id	DOMAIN OWNED	relación canónica Action–Commitment
materia/tema/objetivo	DERIVED READ MODEL	Action → CourseEnrollment/Topic/AcademicGoal
contexto Cursado	DERIVED READ MODEL	CourseEnrollment
contexto ExamPreparation	DERIVED READ MODEL	Assessment + ExamPreparation
start_at	DOMAIN OWNED	campo mínimo de Commitment
timezone del estudiante	DOMAIN OWNED	Student.timezone
timezone congelada en el acuerdo	SOURCE CONTRACT PENDING	necesaria para reconstruir horario histórico sin ambigüedad
planned_minutes	DOMAIN OWNED	campo mínimo de Commitment; capacidad/duración confirmada para ese acuerdo
state	DOMAIN OWNED	lifecycle de Commitment
Availability	DOMAIN OWNED	restricciones/ventanas útiles del Student Model
estimación de Action	SOURCE CONTRACT PENDING	estimated_duration; se omite si falta
capacidad declarada separada de planned_minutes	SOURCE CONTRACT PENDING	sólo si el dominio necesita snapshot/source adicional; no crear campo local
comparación capacidad–estimación	DERIVED READ MODEL	suficiente/menor/desconocida; comparación operacional, no decisión académica
evidencia esperada	SOURCE CONTRACT PENDING	expected_evidence; no equivale a Evidence submitted
Evidence.lifecycle_state	DOMAIN OWNED	se consume para COMPLETED; la vista no infiere EXPECTED, SUBMITTED ni VALIDATED
criterio de cierre	SOURCE CONTRACT PENDING	completion_criterion; no equivale a dominio
created_at	SOURCE CONTRACT PENDING	timestamp requerido para trazabilidad; campo exacto no cerrado en Design Spec
due status/eligibility	DERIVED READ MODEL	estado autoritativo + tiempo; reglas técnicas pendientes
started_at	SOURCE CONTRACT PENDING	timestamp de inicio; evento aprobado, campo exacto no cerrado
completed_at	SOURCE CONTRACT PENDING	timestamp de cierre conductual; no hay evento aprobado específico
renegotiated_from / relación old→new	SOURCE CONTRACT PENDING	cardinalidad 1:N e historia aprobadas; relación técnica pendiente
missed_at	SOURCE CONTRACT PENDING	timestamp necesario; evento aprobado, campo exacto pendiente
condición derivada de rescate	DERIVED READ MODEL	RESCUE_REQUIRED si no existe rescate real; RESCUE_MATERIALIZED si existe Action/Commitment vinculado
rescue_relation	SOURCE CONTRACT PENDING	vincula rescate con MISSED original
coordinación Action–Commitment	SOURCE CONTRACT PENDING	atomicidad/secuencia técnica; resultado observable obligatorio según 8.4
Intervention	DOMAIN OWNED	entidad de riesgo/intervención aprobada
human_assignment	SOURCE CONTRACT PENDING	mostrar persona sólo con assignment real
sincronización CRM	SOURCE CONTRACT PENDING	contrato HTTP/eventos versionados; no DB compartida
idempotency/reconciliation	SOURCE CONTRACT PENDING	evita doble Commitment ante reintentos/respuesta perdida
recordatorios	UNSUPPORTED	no se diseñan múltiples recordatorios en este sprint
score de riesgo visible	UNSUPPORTED	Compromiso no calcula ni muestra score
horario recomendado automáticamente	UNSUPPORTED	el alumno elige; no existe recomendador de horarios
alcance recortado localmente	UNSUPPORTED	sólo Academic Decision Engine puede reemplazar Action
evidencia entregada = completado	UNSUPPORTED	lifecycles separados
Commitment completado = dominio	UNSUPPORTED	hacer no equivale a aprender
intervención humana presumida	UNSUPPORTED	requiere Intervention + assignment real
	12.3. Proyección funcional

CommitmentView                              # DERIVED READ MODEL
  source_context                            # ACTION | HOY | MATERIA
  action
    canonical_reference
    action_id
    status
    verb
    scope
    objective
  academic_context
    course_enrollment
    course_label
    topic_or_goal_label?
    context_type                            # CURSADO | EXAMEN
    assessment_or_preparation?
  execution_contract
    estimated_duration?                     # SOURCE CONTRACT PENDING
    expected_evidence?                      # SOURCE CONTRACT PENDING
    completion_criterion?                   # SOURCE CONTRACT PENDING
  draft                                     # no autoritativo
    local_date
    local_time
    timezone
    planned_minutes
    capacity_comparison                     # DERIVED READ MODEL
  commitment?                               # sólo cuando existe canónico
    canonical_reference
    start_at
    planned_minutes
    state
    created_at?                             # SOURCE CONTRACT PENDING
    started_at?                             # SOURCE CONTRACT PENDING
    completed_at?                           # SOURCE CONTRACT PENDING
    renegotiated_from?                      # SOURCE CONTRACT PENDING
    missed_at?                              # SOURCE CONTRACT PENDING
    rescue_relation?                        # SOURCE CONTRACT PENDING
  human_fact?
    intervention_id
    owner_operator_id?
    status
    sla?                                    # sólo si real

No define SQL, API, tabla ni entidad de pantalla. Para resolver CMP-P1-03 y CMP-P1-05, la vista consume además las referencias autoritativas ya existentes a Evidence y al objeto real de rescate; este wireframe no define su shape ni agrega campos o contratos.

12.4. Fallbacks

Fuente ausente/no confiable	Comportamiento
Action canónica	error técnico; no crear Commitment
Action no ACCEPTED	mostrar estado autoritativo; no abrir draft editable
materia/tema	omitir label opcional; bloquear si la identidad queda ambigua
estimación	omitir comparación y no afirmar que alcanza
evidencia esperada	omitir línea; no inventar evidencia
Evidence lifecycle	en COMPLETED usar copy neutral y CTA sólo con destino real; no asumir que falta o fue entregada
criterio de cierre	omitir detalle; no inferir cierre
timezone	no confirmar hasta resolver una zona horaria válida
Availability histórica	permitir declaración puntual si el contrato de Commitment la acepta; no inventar patrón
rescue relation	no afirmar que existe rescate
combinación Action–Commitment incompatible	error técnico y relectura al owner; no resolver en frontend
Intervention	omitir humano
CRM	no deshacer el Commitment confirmado en Plataforma; mostrar sólo estado de Plataforma
respuesta de confirmación incierta	reconciliar por identidad/idempotencia antes de reintentar creación
	***
13. EVENTOS

13.1. Eventos aprobados y uso

Evento	Momento	Regla
ActionAccepted	ocurrió en WF-S05 antes de entrar	WF-S06 no lo reemite
CommitmentCreated	confirmación exitosa del Commitment inicial	una vez, con Action/actor/timestamp/institución
CommitmentStarted	owner confirma inicio	no se emite por abrir pantalla o iniciar timer local
CommitmentRenegotiated	owner preserva original y materializa nuevo acuerdo	conserva referencias old/new según contrato
CommitmentMissed	owner confirma vencimiento incumplido	no se emite sólo por reloj del frontend
RescueSucceeded	rescate real cumple su contrato	nunca se usa para el Commitment original
	13.2. Eventos que no se inventan

No se crean como contratos cerrados:

CommitmentDrafted;
CommitmentDue;
CommitmentCompleted;
CommitmentConfirmationFailed;
CommitmentCancelled;
CommitmentReminderSent;
CapacityMismatchDetected;
RescueCreated como evento nuevo;
HumanFollowupRequested.

Si analytics necesita observar vista, edición, error o completitud, su naming y deduplicación quedan SOURCE CONTRACT PENDING y no reemplazan eventos de dominio.

13.3. Renegociación y doble evento

El evento obligatorio para la operación es CommitmentRenegotiated. Si el nuevo Commitment también debe emitir CommitmentCreated, la semántica de emisión y deduplicación debe cerrarse en Product Event/API Spec. Esta especificación no decide un doble conteo silencioso.

***
14. INTEGRACIÓN CON CRM Y HUMANO

14.1. Fuente de verdad

Plataforma es fuente de verdad de Action y Commitment.
CRM es fuente de verdad de operación, operadores y asignaciones.
No existe base de datos compartida.
La integración ocurre mediante contratos/eventos versionados.
WhatsApp es canal; no es el registro canónico del acuerdo.

14.2. Payload conceptual mínimo hacia CRM

Sin cerrar forma técnica, CRM necesita poder resolver:

student/institution autorizados;
action_id;
Commitment canónico;
CourseEnrollment/Assessment de contexto;
start_at + timezone;
planned_minutes;
state;
evidencia esperada cuando el contrato la expone;
original/new relation en renegociación;
MISSED/rescue relation cuando existe.

14.3. Lo que la pantalla puede mostrar

Sólo con objeto real y permisos:

Intervención abierta · {owner};
Seguimiento asignado, si existe assignment explícito;
SLA, sólo si está persistido y vigente.

No promete un mensaje, llamada, rescate o revisión futura.

14.4. Falla de sincronización

Si Plataforma confirmó Commitment pero CRM no lo recibió todavía:

el Commitment no se duplica ni se revierte desde la UI;
HOY y Materia leen la fuente de verdad de Plataforma;
la reparación de sincronización pertenece al contrato técnico;
no se informa al alumno que existe un acompañante pendiente si CRM no confirmó assignment.

***
15. ERROR, CONCURRENCIA E IDEMPOTENCIA

15.1. Error antes de confirmación

No pudimos confirmar el compromiso.
La Action sigue aceptada y no registramos un horario confirmado.
[ Reintentar ]

Se usa sólo cuando la lectura autoritativa confirma que no existe Commitment.

15.2. Respuesta incierta

Si la red falla después del envío y no se sabe si la operación ocurrió:

Estamos verificando si el compromiso quedó registrado.
No vuelvas a confirmarlo todavía.

La UI relee por identidad/idempotency key. Resultado:

si existe: abre el Commitment canónico;
si no existe: vuelve al draft y habilita reintento;
si la lectura falla: mantiene estado técnico, sin crear otro.

15.3. Action desactualizada

Esta Action cambió mientras definías el compromiso.
[ Ver estado actual ]

No confirma contra una versión obsoleta.

15.4. Doble confirmación

El CTA entra en estado de envío y no vuelve a despachar mientras la operación está abierta. La protección real debe estar en el servicio propietario; el frontend solo no es suficiente.

***
16. CRITERIOS DE ACEPTACIÓN

16.1. Producto / Lead Product Owner

En menos de 10 segundos se entiende Action, los tres inputs editables, capacidad declarada, evidencia esperada, criterio de cierre y siguiente evento real.
La Action llega ACCEPTED y no cambia de prioridad, materia o alcance.
Antes del CTA final no existe Commitment confirmado.
Confirmar produce un único Commitment canónico y Action COMMITTED.
Estimación y capacidad puntual declarada se distinguen; planned_minutes no parece duración ejecutada.
Una capacidad menor no se oculta ni recorta Action.
Renegociar preserva original y genera nuevo Commitment.
MISSED no puede editarse retroactivamente.
Rescate no borra MISSED.
COMPLETED proyecta el lifecycle real de Evidence y no implica Evidence pendiente, validada ni dominio.
Confirmación, inicio y cierre conductual devuelven Commitment y Action coordinados según 8.4.
El Commitment original permanece MISSED; rescate existente se proyecta como RESCUE_MATERIALIZED.
No se promete humano sin Intervention/assignment.

16.2. UX/UI

Mobile 360 px contiene tres inputs inequívocos, Action, comparación, evidencia esperada, cierre, siguiente evento y una CTA primaria before the fold.
Existe una sola CTA primaria por estado.
Fecha/hora pasada se explica con timezone.
Estado de capacidad usa texto, no sólo color.
El significado de confirmar es factual y breve.
Cursado y Examen se distinguen sin duplicar sus vistas.
CONFIRMED, DUE, STARTED, COMPLETED, RENEGOTIATED y MISSED son comprensibles.
MISSED usa tono no punitivo.
El original siempre es visible en renegociación/rescate.
Error incierto no habilita creación duplicada.

16.3. Academic Decision Engine

No recibe una segunda implementación de prioridad dentro de WF-S06.
Sólo emite/reemplaza otra Action mediante su contrato propietario.
El handoff de capacidad insuficiente no altera Action localmente.
Una Action nueva, si existe, conserva trazabilidad con la anterior según el contrato propietario.

16.4. Backend / Domain

Confirma Action ACCEPTED antes de crear Commitment.
Crea/transiciona Commitment y Action de forma consistente.
Al iniciar, devuelve Commitment STARTED + Action IN_PROGRESS.
Al cerrar conductualmente, devuelve Commitment COMPLETED + Action coordinada con el estado real de Evidence.
Emite CommitmentCreated idempotentemente.
Devuelve state canónico y no depende del reloj del frontend.
Conserva old/new en renegociación.
No permite mutar MISSED a cumplido.
Reconcilia reintentos sin duplicación.
Separa state de Commitment, Action y Evidence.
Expone timezone suficiente para lectura histórica.
No materializa rescue hasta que exista un objeto propietario real y expone RESCUE_MATERIALIZED como condición derivada común.

16.5. CRM / Integration

Consume Commitment por contrato versionado.
No se convierte en fuente de verdad académica.
La falla de sincronización no duplica ni revierte Commitment.
La UI muestra humano sólo con Intervention/assignment real y permisos.
WhatsApp no reemplaza action_id, Commitment ni state.

16.6. Eventos

WF-S06 no reemite ActionAccepted.
Confirmación inicial emite CommitmentCreated una vez.
Inicio confirmado emite CommitmentStarted.
Renegociación usa CommitmentRenegotiated.
MISSED usa CommitmentMissed sólo desde owner.
RescueSucceeded se usa sólo para rescate real exitoso.
No se inventan eventos cerrados para due, completed, errores o recordatorios.

***
17. TEST DE 10 SEGUNDOS — 360 PX

La simulación evalúa únicamente el primer viewport. No sustituye pruebas con estudiantes reales.

17.1. DRAFT estándar

Respuestas esperadas:

Action: resolver ejercicios 8–14 de U3.
Inputs: fecha, hora y tiempo declarado se reconocen como tres controles editables.
Cuándo: sábado 23, 19:00, Córdoba.
Estimación: 60–75 min; declaración puntual: 70 min.
Evidencia esperada/cierre: 7 ejercicios completos y adjuntos.
Confirmar: crea el Commitment CONFIRMED y lo devuelve a HOY/Materia; no lo inicia.

Resultado simulado: PASS.

17.2. Capacidad menor

Respuestas esperadas:

La Action requiere 60–75 min.
El alumno dispone de 40 min.
La Action no será recortada.
Debe revisar disponibilidad o informar la incompatibilidad.
Todavía no existe Commitment.

Resultado simulado: PASS.

17.3. CONFIRMED

Respuestas esperadas:

Existe un acuerdo canónico.
Se entiende fecha, hora, capacidad declarada y evidencia esperada.
Se puede renegociar antes del horario si el owner lo permite.
No se promete recordatorio ni humano.

Resultado simulado: PASS.

17.4. MISSED sin rescate

Respuestas esperadas:

El compromiso original quedó incumplido.
El original seguirá registrado.
Todavía no existe un rescate concreto.
Retomar inicia una resolución; no borra el estado.

Resultado simulado: PASS.

17.5. ExamPreparation

Respuestas esperadas:

El Commitment pertenece a Análisis II / Parcial 1.
La Action concreta sigue siendo la unidad central.
Se entiende horario, capacidad declarada y evidencia esperada.
No aparece protocolo, readiness ni otra recomendación.

Resultado simulado: PASS WITH DENSITY RISK.

Riesgo reversible: comprimir el label del Assessment si compite con Action en dispositivos reales.

17.6. COMPLETED + lifecycle real de Evidence

A. Evidence EXPECTED

Respuestas esperadas:

El Commitment está COMPLETED.
Evidence todavía está EXPECTED.
La CTA solicita Subir evidencia.
No se infiere dominio.

Resultado simulado: PASS.

B. Evidence SUBMITTED

Respuestas esperadas:

El Commitment está COMPLETED.
Evidence ya fue enviada y está pendiente de validación.
La CTA abre la Evidence; no pide enviarla otra vez.
No se infiere suficiencia ni dominio.

Resultado simulado: PASS.

C. Evidence VALIDATED

Respuestas esperadas:

El Commitment está COMPLETED.
Evidence está VALIDATED.
La CTA abre el avance real.
Validación no se presenta como dominio universal.

Resultado simulado: PASS.

17.7. Coordinación Commitment ↔ Action

Respuestas esperadas:

Confirmación: Commitment CONFIRMED + Action COMMITTED.
Inicio: Commitment STARTED + Action IN_PROGRESS.
Cierre conductual: Commitment COMPLETED + Action coordinada con Evidence, normalmente EVIDENCE_PENDING cuando Evidence sigue EXPECTED.
Ninguna vista calcula la coordinación por timer, minutos o submission.

Resultado simulado: PASS.

17.8. MISSED + rescate real

Respuestas esperadas:

El Commitment original sigue observable como MISSED.
La existencia de una Action/Commitment de rescate produce RESCUE_MATERIALIZED como condición derivada.
El rescate usa su propio lifecycle.
No existe entidad ni evento RescueCreated nuevo.

Resultado simulado: PASS.

Resultado global

9 PASS.
1 PASS WITH DENSITY RISK.
0 FAIL.

El test real de 10 segundos en 360 px es gate antes de UI high-fi.

***
18. DECISIONES DESCARTADAS

Decisión descartada	Motivo
editar Action desde Compromiso	rompe ownership del Academic Decision Engine
recortar ejercicios según minutos	crea otra Action silenciosa
recomendar “mejor horario”	agrega recomendador autónomo no aprobado
confirmar con fecha pasada y moverla automáticamente	falsea el acuerdo del estudiante
crear Commitment al abrir WF-S06	salta confirmación explícita
exponer draft en HOY/Materia/CRM	presenta intención como acuerdo confirmado
editar el mismo Commitment al renegociar	borra trazabilidad old/new
permitir editar MISSED	maquilla incumplimiento
convertir rescate en cumplimiento original	contradice No Cortar
completar por timer	minutos no prueban ejecución ni aprendizaje
completar por Evidence submitted	confunde lifecycles
inferir dominio por Commitment completed	hacer no equivale a aprender
crear Rescue desde la vista de MISSED	inventa objeto/engine
prometer que acompañante escribirá	no existe garantía sin Intervention
calendario completo	duplica herramientas maduras y excede sprint
historial general de compromisos	pertenece a otra vista; no es necesario para WF-S06
estadísticas, rachas, puntos o premios	convierte el contrato en gamificación decorativa
chat para renegociar	agrega navegación y ownership no aprobados
evento nuevo para cada interacción	no está aprobado en Product Event Model
	***
19. SOURCE CONTRACT PENDING

19.1. Bloqueantes para implementación fiel

Contrato	Necesidad mínima	Fallback
estimated_duration	rango/valor y semántica de estimación	omitir estimación y no afirmar suficiencia
expected_evidence	producción esperada	omitir; no inventar Evidence
completion_criterion	condición de cierre de Action	omitir; no inferir cierre/dominio
timezone histórica	reconstruir start_at sin ambigüedad	bloquear confirmación si falta timezone actual válida
draft persistence	decidir cliente/servidor sin volverlo autoritativo	descartar al salir
capacity comparison	semántica de suficiente/menor/desconocida	mostrar valores separados sin afirmar fit
capacity mismatch handoff	owner, payload, resultado y posible replanificación	volver al feedback aprobado; no confirmar ni recortar
confirmación idempotente	clave, scope y reconciliación	no habilitar reintento ciego
coordinación Action–Commitment	atomicidad/secuencia de ACCEPTED/CONFIRMED, COMMITTED, STARTED/IN_PROGRESS y cierre conductual	no afirmar éxito ni resolver divergencias hasta respuesta autoritativa
created_at, started_at, completed_at, missed_at	trazabilidad temporal	omitir timestamp no disponible; conservar state
due/renegotiation eligibility	reglas y owner de ventana temporal	consumir state; no calcular localmente
renegotiated_from / old-new	relación canónica	mostrar original sin afirmar vínculo si falta
rescue_relation + traducción compartida	rescate real ↔ MISSED original + RESCUE_MATERIALIZED común a todas las superficies	preservar MISSED y no mostrar rescate si falta relación
doble evento de renegociación	decidir si new Commitment también emite CommitmentCreated	usar sólo semántica confirmada; no duplicar métricas
completion telemetry	observación sin inventar CommitmentCompleted	state canónico; sin evento nuevo
human assignment	owner/status/SLA visible	omitir humano
sync Plataforma–CRM	entrega, retry, deduplicación y permisos	Plataforma sigue siendo fuente; sin promesa humana
	19.2. No bloqueantes para wireframe

selector nativo o custom de fecha/hora;
sheet o pantalla para renegociación;
copy exacto de Revisar disponibilidad;
copy exacto de Retomar;
posición del contexto de timezone;
proporción de columnas desktop;
label corto del Assessment en 360 px;
si Ver en Hoy retorna automáticamente o requiere CTA.

Estas decisiones son reversibles y no alteran ownership, estados, eventos ni trazabilidad.

***
20. CHANGE REQUESTS Y ESTADO FINAL

20.1. Change Requests

Ninguno.

La solución no exige modificar Product Spec, Design Spec, HOY, Materia, Próxima Acción, Academic Decision Engine, entidades, eventos aprobados ni navegación estructural.

La tensión entre DRAFT del lifecycle y la regla de Próxima Acción —no existe Commitment confirmado antes del CTA final— se resuelve sin cambio estructural: el draft es no autoritativo, no se comparte y su persistencia técnica queda SOURCE CONTRACT PENDING.

20.2. Trazabilidad breve de P0/P1 corregidos

P0: ninguno abierto en la auditoría; no se aplicaron cambios P0.

Finding	Corrección aplicada	Secciones
CMP-P1-01	DRAFT 360 px comprimido a tres bloques; fecha, hora y minutos son inputs inequívocos; evidencia esperada, cierre, siguiente evento y única CTA quedan before the fold; se agrega conteo actualizado	3.3, 6.1, 16 y 17.1
CMP-P1-02	Todo estado anterior a submission usa Evidencia esperada; rescate incluido	6.5, 6.6, 9.3, 10.2, 11 y 17
CMP-P1-03	COMPLETED lee Evidence real y diferencia EXPECTED, SUBMITTED y VALIDATED; copy neutral si no carga; no infiere dominio	6.8, 11, 12, 16 y 17.6
CMP-P1-04	Mapping observable: confirmación CONFIRMED/COMMITTED, inicio STARTED/IN_PROGRESS y cierre coordinado con Evidence; atomicidad técnica pendiente, resultado funcional obligatorio	6.6, 8.4, 11, 12, 16 y 17.7
CMP-P1-05	MISSED original preservado; rescate existente se proyecta como RESCUE_MATERIALIZED y usa lifecycle propio; compatibilidad conceptual de RESCUE_CREATED explicitada sin entidad/evento nuevo	8.1–8.2, 10.2, 11, 12, 16 y 17.8
	No se implementaron CMP-P2-01 ni CMP-P2-02.

20.3. Self-audit

Criterio	Resultado
Action llega ACCEPTED	PASS
Academic Decision Engine conserva prioridad/alcance	PASS
Estimación, horario y capacidad separados	PASS
DRAFT no se presenta como confirmado	PASS
DRAFT 360 px demuestra tres inputs y siguiente evento	PASS
Confirmación explícita + idempotencia requerida	PASS
Disponibilidad menor sin recorte ni falsa suficiencia	PASS
Lifecycle completo representado	PASS
Renegociación conserva original	PASS
MISSED no editable	PASS
Rescate no borra incumplimiento	PASS
Evidence y dominio separados	PASS
COMPLETED proyecta Evidence EXPECTED/SUBMITTED/VALIDATED sin inferencia	PASS
Action y Commitment coordinados en confirmación/inicio/cierre	PASS
MISSED + RESCUE_MATERIALIZED reconciliados	PASS
HOY/Materia/Próxima Acción/CRM comparten objeto y lifecycle	PASS
Humano sólo con objeto real	PASS
Mobile 360 px con una CTA primaria	PASS
Sin calendario, dashboard, chat, gamificación o reminder system	PASS
Sin nuevas entidades, Engines o eventos	PASS
Change Requests estructurales	0
	Estado final

ACHIEVE_COMPROMISO_FUNCTIONAL_WIREFRAME_v0.2_CANDIDATE.md queda:

READY FOR LEAD PRODUCT OWNER REAUDIT

No queda aprobado para UI high-fi hasta:

auditoría funcional independiente con 0 P0 y 0 P1 abiertos;
cierre técnico de los SOURCE CONTRACT PENDING bloqueantes;
prueba real de 10 segundos en 360 px;
verificación de idempotencia y reconciliación de confirmación;
freeze de contratos Action–Commitment–CRM en Architecture/API/Data Spec.


***

VI.5 — Evidencia

ACHIEVE — EVIDENCIA

FUNCTIONAL WIREFRAME v0.2 CANDIDATE

Estado: candidato de corrección controlada de v0.1, listo para reauditoría independiente de Lead Product Owner.  
Fecha: 22 de agosto de 2026.  
Sprint: SPRINT UX 05 — EVIDENCIA.  
Wireframe: WF-S07 — Evidencia + reflexión mínima.  
Tipo: especificación funcional; no UI high-fi.  
Responsable: Senior Product Designer de Achieve.

Baseline obligatorio

ACHIEVE_MVP_USUARIO_PRODUCT_SPEC_v0.5_FINAL.
ACHIEVE_USER_FLOW_WIREFRAMES_DATA_MODEL_v0.2_FINAL.
ACHIEVE_HOY_AUTOGESTION_FUNCTIONAL_SPEC_v1.0_APPROVED.
ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_SPEC_v1.0_APPROVED.
ACHIEVE_PROXIMA_ACCION_FUNCTIONAL_SPEC_v1.0_APPROVED.
ACHIEVE_COMPROMISO_FUNCTIONAL_SPEC_v1.0_APPROVED.
ACHIEVE_EVIDENCIA_FUNCTIONAL_WIREFRAME_v0.1.md.
ACHIEVE_EVIDENCIA_PRODUCT_OWNER_AUDIT_v0.1.md.

Jerarquía aplicada

Product Spec v0.5 define Evidence System, niveles de validación y separación entre ejecución, producción y dominio.
Design Spec v0.2 define WF-S07, Evidence, Reflection, sus relaciones, lifecycle y eventos.
Próxima Acción v1.0 define la Action, la evidencia esperada y el criterio de cierre que esta pantalla recibe sin editar.
Compromiso v1.0 define el acuerdo conductual y preserva COMPLETED, MISSED, renegociación y rescate sin inferir Evidence ni dominio.
HOY y Materia v1.0 definen cómo se proyecta el estado operativo y hacia dónde retorna el estudiante.
Este documento termina en Evidence y su estado operativo. ProgressUpdated y el impacto visible pertenecen a WF-S08.

No se modifica ninguna fuente aprobada. No se agregan Engines, entidades, navegación estructural ni eventos de dominio.

Alcance de esta revisión

Esta versión aplica exclusivamente los tres findings P1 de la auditoría:

EVI-P1-01: completar el JTBD en el primer viewport mobile y conservar el shell contextual durante upload/error;
EVI-P1-02: filtrar los tipos visibles por el contrato concreto de la Action;
EVI-P1-03: representar el artefacto formal con contenido preparado real antes de habilitar el envío.

No existen P0 abiertos. No se implementan EVI-P2-01, EVI-P2-02 ni EVI-P2-03. No se modifican el JTBD, el lifecycle, las decisiones aprobadas, las features, los Engines, las entidades, los eventos ni los contratos.

***
1. OBJETIVO Y LÍMITES

1.1. Job to be done

Cuando el estudiante termina o reporta la ejecución de una Action, debe poder presentar la producción acordada en segundos, aportar sólo la reflexión que genera señal útil y entender exactamente en qué estado queda.

En menos de 10 segundos debe poder responder:

para qué Action está enviando evidencia;
qué evidencia se esperaba;
qué puede subir;
qué información mínima debe completar;
qué significa Enviar evidencia;
en qué estado quedará;
qué ocurrirá después;
qué no demuestra todavía.

1.2. Resultado funcional

La pantalla transforma contenido preparado en una Evidence canónica vinculada a la misma Action, con provenance, canal y lifecycle autoritativo.

Al enviar con éxito:

la presentación queda SUBMITTED;
se emite EvidenceSubmitted una sola vez para esa Evidence;
se conserva el action_id canónico;
se conserva el Commitment relacionado cuando el contrato lo permite;
se determina el próximo estado sólo mediante el método de validación aplicable;
no se actualiza progreso en este sprint;
no se infiere suficiencia, cierre de Action ni dominio.

1.3. Incluye

contexto no editable de Action, materia, tema/objetivo, Commitment, evidencia esperada, criterio de cierre y contexto Cursado/ExamPreparation;
captura web de foto, archivo, texto y audio;
lectura de Evidence normalizada desde WhatsApp;
preparación, envío y confirmación idempotente;
Reflection mínima y contextual;
lifecycle completo EXPECTED → SUBMITTED → UNDER_REVIEW cuando aplica → SUFFICIENT / INSUFFICIENT → VALIDATED, con INSUFFICIENT → RESUBMISSION_REQUESTED;
métodos de validación aprobados;
múltiples Evidence por Action;
evidencia tardía y preservación de MISSED/rescate;
estados de upload, errores, reintentos y duplicación;
provenance, privacidad y visibilidad mínima;
handoff de corrección si la evidencia esperada es incorrecta.

1.4. No incluye

editar, reemplazar o repriorizar la Action;
cambiar la evidencia esperada o el criterio de cierre localmente;
completar automáticamente la Action;
actualizar TopicProgress/CourseProgress;
crear ProgressEntry o Bitácora completa;
generar la siguiente ActionRecommendation;
protocolo completo de Examen;
revisión del operador, CRM o chat de WhatsApp;
biblioteca, galería o gestor general de archivos;
corrector académico universal;
detector de IA;
dashboard de evidencias, estadísticas, puntos, rankings o feed social;
permisos institucionales completos;
SQL, endpoints o arquitectura de almacenamiento.

1.5. Decisión central

> Preparar contenido no es enviarlo. Enviar no es demostrar suficiencia. Suficiencia no es validación. Validación no es dominio.

***
2. RELACIÓN CON ACTION Y COMMITMENT

2.1. Trazabilidad funcional

Action
  -> Commitment relacionado
    -> ejecución / cierre conductual
      -> Evidence 1..N
        -> validación aplicable
          -> ProgressUpdated en WF-S08

La relación aprobada y obligatoria es:

Action → Evidence = 1:N;
Action → Commitment = 1:N;
toda Evidence conserva action_id;
el vínculo inequívoco entre una Evidence y el Commitment concreto que originó esa ejecución es SOURCE CONTRACT PENDING.

La pantalla no crea una entidad intermedia para resolver ese contrato.

2.2. Contexto recibido y no editable

Dato	Representación	Regla
Action	verbo + alcance	no editable
materia	nombre y CourseEnrollment	no editable
tema/objetivo	label contextual	se omite si no existe sin volver ambigua la Action
Commitment	horario/state original o rescate	no se reescribe desde Evidence
evidencia esperada	producción solicitada	no se cambia localmente
criterio de cierre	condición mínima de la Action	no equivale a dominio
contexto	CURSADO o EXAMEN · {Assessment}	Examen aporta contexto, no protocolo
	2.3. Precondiciones de entrada

La pantalla puede abrirse cuando:

Action está EVIDENCE_PENDING;
Commitment está COMPLETED y Evidence sigue EXPECTED;
existe RESUBMISSION_REQUESTED para una Action vigente;
se abre una Evidence ya enviada en modo lectura;
una Evidence normalizada desde WhatsApp ya fue vinculada de forma autoritativa.

Si la Action está CANCELLED o REPLACED, una presentación nueva queda bloqueada salvo contrato autoritativo explícito. La UI nunca traslada contenido a la Action reemplazante por cuenta propia.

2.4. Invariantes

La presentación de Evidence no puede:

borrar un Commitment MISSED;
convertir un rescate en cumplimiento original;
convertir COMPLETED conductual en dominio;
completar una Action sin que el criterio y el owner confirmen el lifecycle;
cambiar prioridad académica;
generar la siguiente Action;
actualizar progreso antes de ProgressUpdated;
sobrescribir una Evidence anterior;
elevar una percepción declarada a señal de dominio.

***
3. FLUJO PRINCIPAL

3.1. Presentación web estándar

La vista recibe action_id y resuelve Action, contexto, Commitment, evidencia esperada y criterion vigentes.
Muestra qué debe presentar y los tipos permitidos por ese contrato.
El estudiante selecciona foto, archivo, texto o audio.
El contenido se carga o prepara, sin emitir EvidenceSubmitted.
La UI confirma Listo para enviar; todavía no existe envío confirmado.
El estudiante abre Agregar reflexión sólo si desea o si un campo contextual está configurado como necesario.
Selecciona Enviar evidencia.
La UI bloquea reenvíos mientras reconcilia la operación.
El owner confirma una Evidence canónica SUBMITTED y devuelve identidad/lifecycle.
Se emite EvidenceSubmitted una vez.
La UI muestra el próximo estado real: revisión sólo si existe; de lo contrario, validación por el método configurado sin prometer resultado o plazo.

3.2. Separación upload vs. submission

Momento	Estado visible	Estado de dominio	Evento
sin contenido	evidencia esperada	EXPECTED o expectativa derivada de Action	ninguno
contenido seleccionado	preparado localmente/en staging	no cambia Evidence autoritativa	ninguno
upload en progreso	cargando	no confirma SUBMITTED	ninguno aprobado
upload exitoso	listo para enviar	no confirma SUBMITTED	ninguno
CTA enviado, respuesta pendiente	enviando/verificando	desconocido hasta reconciliar	ninguno hasta confirmación
owner confirma	evidencia enviada	SUBMITTED	EvidenceSubmitted
	La materialización técnica de Evidence antes del CTA —objeto EXPECTED, draft local o staging— es SOURCE CONTRACT PENDING. La diferencia semántica no lo es.

3.3. Evidencia esperada incorrecta

La pantalla ofrece el control secundario:

La evidencia esperada no corresponde

Este control usa el handoff de corrección/rechazo aprobado en Próxima Acción:

conserva Action y recomendación originales;
conserva el valor vigente y su provenance cuando exista;
recibe el dato mínimo de corrección;
no altera localmente expected evidence ni criterion;
no promete reemplazo o nueva recomendación;
su owner/persistencia/respuesta siguen SOURCE CONTRACT PENDING.

3.4. Evidencia ya enviada

Si al abrir o reconciliar ya existe una Evidence canónica para la misma operación:

no se crea otra;
se abre la existente;
se muestra su lifecycle real;
sólo se permite una nueva presentación si existe RESUBMISSION_REQUESTED o si la Action admite múltiples Evidence mediante contrato autoritativo.

***
4. CAPTURA WEB Y NORMALIZACIÓN DESDE WHATSAPP

4.1. Tipos P0 aprobados

Tipo visible	content_type conceptual	Interacción mínima
Foto	imagen	cámara o selector de imagen
Archivo	documento/archivo permitido	selector de archivo
Texto	texto simple	campo breve/multilínea simple, sin editor rico
Audio	audio	grabar o adjuntar, según capacidad real del cliente
	Los MIME types, extensiones, duración de audio y tamaño máximos son SOURCE CONTRACT PENDING. La UI no inventa números.

4.2. Regla de captura

La Action define qué evidencia se espera.
La UI ofrece un único control Adjuntar evidencia y muestra sólo los tipos incluidos en allowed_content_types para esa Action.
Foto, archivo, texto y audio son capacidades P0 del sistema; no son cuatro opciones universalmente válidas para cada Action.
Si allowed_content_types no llega o es inconsistente, la UI no presenta ningún tipo como válido y bloquea la captura, según el fallback ya definido en § 13.4. El contrato sigue SOURCE CONTRACT PENDING.
Texto no se convierte en app de apuntes.
Audio no se transcribe ni interpreta automáticamente salvo contrato futuro aprobado.
Una miniatura o preview no es una entidad nueva.

4.3. WhatsApp como canal

WhatsApp puede recibir foto, archivo, texto o audio, pero no es la fuente de verdad.

Flujo conceptual:

WhatsApp recibe contenido
  -> integración identifica actor y contexto autorizado
  -> normaliza content/content_type/provenance
  -> deduplica la operación
  -> vincula con Action sólo si la relación es inequívoca
  -> Plataforma confirma Evidence SUBMITTED
  -> emite EvidenceSubmitted una vez

4.4. Estado visible de una Evidence proveniente de WhatsApp

EVIDENCIA ENVIADA
Canal: WhatsApp
Enviada por vos · 22 ago · 19:42
Estado: recibida

Esto confirma recepción, no suficiencia ni dominio.
[ Ver evidencia ]

4.5. Reglas de normalización

submission_channel=WHATSAPP conserva el canal; no convierte el mensaje en registro canónico.
uploaded_by identifica al actor autenticado/resuelto.
submitted_at proviene de la confirmación propietaria, no del reloj visual.
La referencia del mensaje/origen necesaria para deduplicación y auditoría es SOURCE CONTRACT PENDING.
Si estudiante o Action son ambiguos, la integración no debe vincular ni cambiar lifecycle por inferencia.
La resolución de mensajes ambiguos pertenece al contrato de integración; no se diseña un inbox ni un chat dentro de WF-S07.
Web y WhatsApp producen la misma entidad Evidence y el mismo lifecycle.

***
5. REFLEXIÓN MÍNIMA

5.1. Principio

> Reflection aporta contexto; no sustituye la Evidence ni determina dominio.

La reflexión aparece bajo progressive disclosure: Agregar reflexión. Se pregunta poco y según la Action. Ningún set universal de preguntas se muestra por defecto.

5.2. Campos aprobados y uso contextual

Campo	Cuándo aporta señal	Qué representa	Qué no representa
actual_minutes	cuando no existe una medición autoritativa útil	tiempo declarado por el alumno	prueba de aprendizaje o ejecución exacta
difficulty	cuando puede reorientar apoyo o práctica	percepción de dificultad	severidad académica objetiva
confidence	cuando importa contrastar percepción con desempeño	confianza declarada	dominio
result	cuando existe un resultado comprensible	outcome reportado/observado según contrato	validación automática
cantidad sin ayuda	práctica, prueba sin red o simulación	declaración/resultado contextual	dominio universal
note	cuando aclara bloqueo, condición o error	nota breve	diario o diagnóstico psicológico
	5.3. Configuración contextual mínima

Tipo de Action	Reflexión sugerida	Máximo recomendado visible
lectura/recorrido	dificultad o nota breve, sólo si aporta	1
práctica	cantidad sin ayuda + dificultad	2
explicación/audio	confianza o nota breve	1
prueba sin red/simulación	resultado + cantidad sin ayuda; tiempo si forma parte de las condiciones	2–3
resolver incertidumbre	nota/fuente sólo si no está en la producción	1
artefacto formal de Exam Protocol	campos exigidos por el protocolo versionado	según contrato pedagógico, no por default de UI
	Los umbrales y obligatoriedad exacta por Action/protocolo son SOURCE CONTRACT PENDING.

5.4. Wireframe de disclosure

+--------------------------------------+
| AGREGAR REFLEXION                    |
+--------------------------------------+
| ¿Cuántos resolviste sin ayuda?       |
| [ 5 ] de 7                          |
|                                      |
| ¿Cómo se sintió?                     |
| [ Más fácil | Esperado | Más difícil]|
|                                      |
| Nota breve (opcional)                |
| [ ________________________________ ] |
|                                      |
| [            LISTO                 ] |
+--------------------------------------+

Listo cierra el disclosure; no envía la Evidence. La única CTA primaria de la pantalla base sigue siendo Enviar evidencia.

***
6. WIREFRAME MOBILE — 360 PX

6.1. EXPECTED — primer viewport principal

+--------------------------------------+
| <- EVIDENCIA                         |
| ANALISIS II · CURSADO                |
+--------------------------------------+
| ACCION                               |
| Resolver ejercicios 8–14 · Unidad 3  |
+--------------------------------------+
| EVIDENCIA ESPERADA                   |
| 7 completos y adjuntos · Cierre:    |
| produccion inspeccionable            |
+--------------------------------------+
| [ + ADJUNTAR EVIDENCIA             ] |
| Permitido: foto o archivo            |
| Todavia no adjuntaste contenido.     |
| [ Agregar reflexion ]                |
| Enviar: SUBMITTED; sigue validacion. |
| No implica suficiencia ni dominio.   |
| [ ENVIAR EVIDENCIA · INACTIVO      ] |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| La evidencia esperada no corresponde|
+--------------------------------------+

Antes del primer scroll aparecen Action con verbo y alcance, materia/contexto, expected evidence, control de captura, estado, significado de enviar, paso siguiente y CTA. La reflexión está comprimida. Foto o archivo ilustra los valores de allowed_content_types recibidos para esta Action; no habilita tipos por inferencia. En upload en progreso o fallido cambia sólo el bloque de captura: Action y evidencia esperada permanecen visibles.

6.2. Preparada, todavía no enviada

+--------------------------------------+
| <- EVIDENCIA · ANALISIS II           |
+--------------------------------------+
| ACCION · Resolver ejercicios 8–14    |
| Esperado: 7 completos y adjuntos     |
+--------------------------------------+
| LISTO PARA ENVIAR                    |
| foto_01.jpg · cargada                |
| foto_02.jpg · cargada                |
| [ Eliminar ] [ Agregar otro ]        |
|                                      |
| Reflexion: 5/7 sin ayuda             |
|                                      |
| Enviar: SUBMITTED; sigue validacion. |
| No implica suficiencia ni dominio.   |
| [       ENVIAR EVIDENCIA           ] |
+--------------------------------------+

6.3. Upload en progreso

+--------------------------------------+
| <- EVIDENCIA · ANALISIS II           |
+--------------------------------------+
| ACCION · Resolver ejercicios 8–14    |
| Esperado: 7 completos y adjuntos     |
+--------------------------------------+
| Cargando foto_02.jpg… 64%            |
| No cierres esta pantalla.            |
|                                      |
| [ ENVIAR EVIDENCIA · INACTIVO      ] |
+--------------------------------------+

El porcentaje sólo aparece si el cliente recibe progreso real. Si no, se usa Cargando… sin estimación inventada. El progreso sustituye únicamente el bloque de captura; el shell de Action y evidencia esperada se conserva.

6.4. Upload fallido

+--------------------------------------+
| <- EVIDENCIA · ANALISIS II           |
+--------------------------------------+
| ACCION · Resolver ejercicios 8–14    |
| Esperado: 7 completos y adjuntos     |
+--------------------------------------+
| NO PUDIMOS CARGAR FOTO_02.JPG        |
| La evidencia todavia no fue enviada. |
|                                      |
| [          REINTENTAR              ] |
| Quitar archivo                       |
+--------------------------------------+

Reintentar reutiliza la operación/archivo preparado según contrato; no crea una segunda Evidence. El error sustituye únicamente el bloque de captura; el shell de Action y evidencia esperada se conserva.

6.5. ExamPreparation — artefacto formal

+--------------------------------------+
| <- EVIDENCIA                         |
| ANALISIS II · EXAMEN · PARCIAL 1     |
+--------------------------------------+
| PASO · PRIMERA PRUEBA SIN RED        |
| Esperado: resolucion + tiempo +      |
| errores marcados                     |
+--------------------------------------+
| [ + ADJUNTAR EVIDENCIA             ] |
| prueba_sin_red.pdf · cargado         |
| Estado: listo para enviar            |
|                                      |
| Requiere revision humana del         |
| artefacto. No implica correccion     |
| academica de cada ejercicio.         |
|                                      |
| [       ENVIAR EVIDENCIA           ] |
+--------------------------------------+

La revisión humana se afirma aquí porque los artefactos formales del Exam Protocol la requieren en el MVP. El estado preparado se sustenta en el archivo visible; sin contenido preparado, el estado sería EXPECTED y la CTA permanecería inactiva. No se promete reviewer, feedback, SLA ni plazo sin contrato real.

***
7. WIREFRAME DESKTOP

+--------------------------------------------------------------------------------------------------+
| <- EVIDENCIA                                      ANALISIS II · CURSADO                           |
+--------------------------------------------------------------------------------------------------+
| ACCION                                                     | PRESENTACION                         |
| Unidad 3 · Resolver ejercicios 8–14                        |                                     |
| Commitment: COMPLETED · 22 ago · 19:00                     | [ + ADJUNTAR EVIDENCIA ]             |
|                                                            |                                     |
| EVIDENCIA ESPERADA                                         | foto_01.jpg · lista                  |
| 7 ejercicios completos y adjuntos                          | foto_02.jpg · lista                  |
| Criterio: produccion inspeccionable                         | [ Eliminar ] [ Agregar otro ]        |
|                                                            | Permitido: foto o archivo            |
|                                                            |                                     |
| Esto no implica suficiencia, validacion ni dominio.        | [ Agregar reflexion ]                |
|                                                            |                                     |
|                                                            | [ ENVIAR EVIDENCIA ]                 |
+--------------------------------------------------------------------------------------------------+
| La evidencia esperada no corresponde                                                             |
+--------------------------------------------------------------------------------------------------+

Reglas desktop

conserva la misma jerarquía de mobile;
usa el ancho para separar contexto y captura, no para añadir historial completo;
mantiene una sola CTA primaria;
la columna de captura no se convierte en galería;
estados previos de Evidence aparecen, si son relevantes, en una lista compacta debajo del bloque principal;
Reflection sigue bajo disclosure.

***
8. LIFECYCLE COMPLETO

8.1. Máquina de estado

EXPECTED
  -> SUBMITTED
      -> UNDER_REVIEW          # sólo si existe revisión real pendiente
          -> SUFFICIENT
              -> VALIDATED
          -> INSUFFICIENT
              -> RESUBMISSION_REQUESTED

SUBMITTED
  -> SUFFICIENT / INSUFFICIENT # cuando el método no requiere cola de revisión

UNDER_REVIEW es opcional. RESUBMISSION_REQUESTED conserva todas las Evidence anteriores.

8.2. Semántica por estado

Estado	Significado	No significa
EXPECTED	la Action define qué se requiere	que ya existe producción o envío
preparado	existe contenido local/staging listo	estado de dominio aprobado; no es SUBMITTED
SUBMITTED	el owner recibió una Evidence canónica	que es suficiente, revisada, validada o dominio
UNDER_REVIEW	existe una revisión real pendiente	corrección académica o feedback garantizado
SUFFICIENT	cumple el criterio mínimo de la Action	dominio ni progreso actualizado
INSUFFICIENT	todavía no cumple el criterio mínimo	fracaso personal, inexistencia de ejecución o baja capacidad
RESUBMISSION_REQUESTED	el owner solicita una nueva presentación	permiso para sobrescribir la anterior
VALIDATED	el cierre fue confirmado por el método aplicable	dominio universal ni ProgressUpdated ya ejecutado
	8.3. Transiciones y ownership

Transición	Disparador	Owner	Evento aprobado
EXPECTED → SUBMITTED	envío canónico confirmado	Evidence System/backend	EvidenceSubmitted
SUBMITTED → UNDER_REVIEW	revisión real creada/asignada	servicio de validación	ninguno aprobado
SUBMITTED/UNDER_REVIEW → SUFFICIENT	criterio mínimo confirmado	método de validación aplicable	ninguno aprobado
SUBMITTED/UNDER_REVIEW → INSUFFICIENT	criterio mínimo no cumplido	método de validación aplicable	ninguno aprobado
INSUFFICIENT → RESUBMISSION_REQUESTED	owner solicita nueva presentación	servicio de validación	ninguno aprobado
SUFFICIENT → VALIDATED	cierre confirmado	Evidence System/backend	EvidenceValidated
	La UI consume las transiciones; no las decide.

8.4. Múltiples Evidence para una Action

Cada presentación canónica conserva identidad y action_id.
Una nueva Evidence no sobrescribe content, Reflection, provenance, estado ni feedback de otra.
Una Action puede mostrar una lista compacta de presentaciones con fecha, canal y state.
Adjuntos múltiples dentro de una presentación no se convierten automáticamente en múltiples entidades; la forma de content es SOURCE CONTRACT PENDING.
RESUBMISSION_REQUESTED crea o habilita una nueva presentación según contrato; la anterior permanece inspeccionable.
La suficiencia puede pertenecer a una Evidence individual o al conjunto requerido por la Action; la regla de agregación es SOURCE CONTRACT PENDING y no se calcula en frontend.

***
9. MÉTODOS DE VALIDACIÓN

Método aprobado	Qué confirma	Cuándo puede aplicar	Revisión humana	Límite
declarativa	una declaración requerida fue recibida	microevidencia de ejecución cuando el método lo admite	no necesariamente	no prueba producción inspeccionable ni dominio
automática básica	condiciones técnicas o estructurales simples	presencia, formato o checks explícitamente contratados	no	no es corrección académica universal
evidencia inspeccionable	existe producción que puede contrastarse con criterion	ejercicios, resumen, código, audio	sólo si el contrato la asigna	inspeccionable no equivale a suficiente
validación humana	una persona aplica el criterion definido	evidencia ambigua o artefacto formal	sí	no implica tutoría ni feedback garantizado
prueba de dominio	desempeño bajo condiciones comparables	prueba sin red, simulación u otra prueba aprobada	según protocolo	una validación puntual no implica dominio universal
	9.1. Reglas

No toda Evidence necesita revisión humana.
Toda evidencia formal del Exam Protocol requiere revisión humana en el MVP.
Las microevidencias del Academic Decision Engine pueden evitar revisión humana si existe otro método aprobado.
Revisión humana valida existencia/estructura/criterion aplicable; no promete corregir cada ejercicio.
reviewer, review_status, SLA y feedback sólo aparecen si existen contratos y datos reales.
Si validation_method no está definido, se marca SOURCE CONTRACT PENDING; la UI no promete automático ni humano.

9.2. Copy posterior al envío por método

Condición real	Copy permitido
método sin revisión pendiente	Evidencia recibida. Su estado se actualizará según el método aplicable.
revisión real pendiente	Evidencia recibida · En revisión.
revisión humana requerida sin assignment	Requiere revisión humana. Todavía no hay una persona asignada.
assignment real	En revisión · {reviewer visible}
sin SLA	no mostrar fecha/hora
SLA real	mostrar la fecha sólo con su fuente contractual
	***
10. ESTADOS CRÍTICOS

Cada estado declara qué ve, qué puede hacer, qué significa, qué no significa y qué transición produce.

Estado/condición	Qué ve	Qué puede hacer	Qué significa	Qué no significa	Transición real
EXPECTED	Action + expected evidence + attach	adjuntar o corregir expected	existe un requisito	que ya produjo/envió	seleccionar contenido; sin transición de dominio
preparada no enviada	lista breve + Listo para enviar	eliminar, agregar, reflexionar, enviar	contenido preparado	recepción ni Evidence canónica	CTA confirmado → SUBMITTED
upload en progreso	progreso real o Cargando…	esperar; cancelar sólo si el cliente lo soporta	transferencia incompleta	SUBMITTED	éxito → preparada; falla → error
upload fallido	archivo afectado + causa comprensible	reintentar o quitar	no se cargó ese contenido	Evidence insuficiente	reintento vuelve a upload sin duplicar
SUBMITTED	recibida + fecha/canal	ver Evidence	owner recibió algo	suficiencia/revisión/validación	método decide siguiente state
SUBMITTED sin revisión requerida	Recibida sin persona/SLA	ver estado	no hay cola real de revisión	validación automática garantizada	SUFFICIENT/INSUFFICIENT cuando owner confirme
UNDER_REVIEW real	En revisión + assignment sólo si existe	ver Evidence; esperar	revisión real pendiente	feedback, plazo o corrección garantizados	SUFFICIENT/INSUFFICIENT
SUFFICIENT	cumple criterio mínimo	ver Evidence	production cumple Action	dominio o progreso actualizado	owner confirma → VALIDATED
INSUFFICIENT	criterio faltante/razón si existe	ver detalle	todavía no alcanza el mínimo	que no ejecutó o no aprendió nada	owner puede pedir reenvío
RESUBMISSION_REQUESTED	razón + anterior preservada	preparar nueva Evidence	se solicita otra presentación	edición de la original	nuevo envío → nueva Evidence SUBMITTED
VALIDATED	validada + método/fuente	ver Evidence; continuar a WF-S08 sólo con destino real	cierre confirmado	dominio universal ni progreso ya visible	EvidenceValidated; impacto fuera de sprint
múltiples Evidence	lista compacta con state/canal/fecha	abrir una; enviar otra sólo si habilitado	Action 1:N	galería general o sobrescritura	cada envío sigue su lifecycle
WhatsApp	canal, actor y fecha	ver Evidence	fue normalizada en Plataforma	que WhatsApp es truth	lifecycle común
tardía + Commitment MISSED	Enviada después + original MISSED	ver Evidence	existe producción tardía	cumplimiento retroactivo	lifecycle de Evidence; Commitment no cambia
Cursado	Course/Topic + Action	presentar	Evidence de trabajo continuo	Exam artifact	lifecycle común
ExamPreparation formal	Assessment/step + revisión humana requerida	presentar/ver	artefacto formal	corrección académica garantizada	SUBMITTED → UNDER_REVIEW real
sin feedback humano	estado sin mensaje/persona	ver/reintentar si aplica	no existe feedback	que alguien responderá pronto	ninguna promesa
error técnico con respuesta incierta	Verificando envío	esperar/reconciliar	resultado desconocido	permiso para reenviar ciegamente	abrir existente o volver a draft
	10.1. Wireframe SUBMITTED

+--------------------------------------+
| EVIDENCIA ENVIADA                    |
| ANALISIS II · UNIDAD 3               |
+--------------------------------------+
| Recibida · 22 ago · 20:12            |
| Canal: web · Enviada por vos         |
| Estado: SUBMITTED                    |
|                                      |
| Esto no confirma suficiencia ni      |
| dominio.                             |
|                                      |
| Se actualizara segun el metodo de    |
| validacion aplicable.                |
| [          VER EVIDENCIA           ] |
+--------------------------------------+

10.2. Wireframe UNDER_REVIEW real

+--------------------------------------+
| EVIDENCIA EN REVISION                |
| EXAMEN · PRIMERA PRUEBA SIN RED      |
+--------------------------------------+
| Requiere revision humana             |
| Revisor: todavia no asignado         |
| Sin plazo informado                  |
|                                      |
| La revision valida el criterio del   |
| artefacto; no promete correccion     |
| academica completa.                  |
| [          VER EVIDENCIA           ] |
+--------------------------------------+

10.3. Wireframe INSUFFICIENT / RESUBMISSION_REQUESTED

+--------------------------------------+
| NECESITAMOS OTRA PRESENTACION        |
| ANALISIS II · EJERCICIOS 8–14        |
+--------------------------------------+
| Estado anterior: INSUFFICIENT        |
| Falta: ejercicios 12–14 legibles     |
|                                      |
| Tu evidencia anterior se conserva.   |
| [      PREPARAR NUEVA EVIDENCIA    ] |
| Ver presentacion anterior            |
+--------------------------------------+

La razón se muestra sólo si existe feedback/criterion source real. No se inventa una devolución.

10.4. Wireframe VALIDATED

+--------------------------------------+
| EVIDENCIA VALIDADA                   |
| ANALISIS II · UNIDAD 3               |
+--------------------------------------+
| Cumplio el criterio de esta Action.  |
| Metodo: evidencia inspeccionable     |
|                                      |
| Ejecucion: señal disponible          |
| Produccion: señal disponible         |
| Dominio: no evaluado                 |
|                                      |
| El impacto en progreso aparece en    |
| el siguiente paso.                   |
| [          CONTINUAR               ] |
+--------------------------------------+

Continuar sólo aparece si existe destino real a WF-S08. No emite ProgressUpdated desde esta pantalla.

***
11. ERRORES, REINTENTOS E IDEMPOTENCIA

11.1. Matriz de errores

Caso	Copy/estado	Acción permitida	Regla de verdad
archivo cargándose	Cargando…	esperar	CTA enviar inactiva
carga exitosa	Listo para enviar	enviar/eliminar	todavía no SUBMITTED
carga fallida	No pudimos cargar {archivo}	reintentar/quitar	no crear Evidence
conexión interrumpida durante upload	Carga interrumpida	reintentar	reutilizar operación si el contrato lo soporta
conexión interrumpida después de enviar	Verificando si se envió	reconciliar	no habilitar reenvío ciego
archivo duplicado	{archivo} ya está agregado	conservar uno o quitar	no duplicar contenido/presentación
formato no admitido	Este formato no está admitido	elegir otro	lista exacta desde contrato
tamaño no admitido	Este archivo supera el límite admitido	elegir otro	límite exacto desde contrato; nunca inventarlo
evidencia vacía	Agregá la evidencia esperada	adjuntar/escribir	CTA inactiva
envío duplicado	abrir Evidence existente	ver	misma idempotency/identidad
eliminación antes de enviar	quitar contenido del draft	deshacer si cliente lo soporta	no borra Evidence canónica
eliminación después de enviar	no disponible desde esta vista	ver estado	retención/borrado requiere contrato y auditoría
Evidence ya enviada	lifecycle real	ver	no volver a enviar salvo habilitación
nueva Evidence solicitada	razón + anterior preservada	preparar nueva	no reemplazar original
	11.2. Confirmación idempotente

El CTA entra en Enviando… y evita doble dispatch visual.
El servicio propietario deduplica la operación mediante identidad/idempotency contract.
Ante respuesta incierta, la UI relee por referencia canónica.
Si existe Evidence, la abre.
Si no existe y la lectura es concluyente, vuelve a preparada y habilita reintento.
Si la lectura también falla, mantiene estado técnico y no crea otra.

La clave, scope, retención y reconciliación exactas son SOURCE CONTRACT PENDING.

11.3. Error técnico general

No pudimos cargar el estado de esta evidencia.
[ Reintentar ]

No se reemplaza con EXPECTED, SUBMITTED ni empty state por inferencia.

***
12. EVIDENCIA TARDÍA

12.1. Principio

> La Evidence conserva cuándo fue enviada; el Commitment conserva lo que ocurrió en su horario. Ninguno reescribe al otro.

12.2. Matriz

Situación	Estado Commitment	Tratamiento de Evidence	Copy permitido	Prohibido
cumplido en horario, Evidence posterior	conserva COMPLETED y timestamps autoritativos	SUBMITTED con submitted_at posterior	Evidencia enviada después del cierre conductual.	afirmar que se envió en horario
Commitment ya MISSED	conserva MISSED	puede recibirse para la Action si el owner lo admite; queda marcada tardía	La evidencia fue recibida; el compromiso original sigue incumplido.	cambiar original a cumplido
existe rescate materializado	original sigue MISSED; rescate usa state propio	Evidence debe vincularse a la Action/Commitment de rescate sólo con relación autoritativa	Evidencia del rescate	atribuirla al original por conveniencia
Action reemplazada/cancelada antes del envío	state no vigente	bloquear nueva presentación sin autorización; contenido preparado no se traslada	Esta Action ya no admite una presentación nueva.	copiar a la reemplazante
Evidence ya enviada antes del reemplazo	lifecycle histórico conservado	modo lectura	Presentada para la Action original.	borrar o migrar historia
	12.3. Wireframe MISSED preservado

+--------------------------------------+
| EVIDENCIA ENVIADA DESPUES            |
| ANALISIS II · UNIDAD 3               |
+--------------------------------------+
| Enviada: 22 ago · 22:14              |
| Compromiso original: 19:00 · MISSED  |
|                                      |
| Recibimos la produccion. El acuerdo  |
| original sigue registrado como       |
| incumplido.                           |
|                                      |
| [          VER EVIDENCIA           ] |
+--------------------------------------+

La posibilidad de admitir Evidence después de MISSED, los umbrales de tardanza y el vínculo exacto al Commitment son SOURCE CONTRACT PENDING.

***
13. DATA CONTRACTS Y OWNERSHIP

13.1. Clasificaciones

DOMAIN OWNED: entidad, campo o lifecycle aprobado.
DERIVED READ MODEL: composición de lectura; no crea entidad/tabla.
SOURCE CONTRACT PENDING: necesidad funcional aprobada cuyo owner técnico, forma o regla exacta no está cerrado.
UNSUPPORTED: dato o comportamiento no respaldado/prohibido en este sprint.

13.2. Matriz requerida

Dato	Clasificación	Fuente/regla
Evidence	DOMAIN OWNED	entidad de ejecución aprobada
action_id	DOMAIN OWNED	relación canónica Evidence → Action
content	DOMAIN OWNED	campo mínimo conceptual; shape, cardinalidad y storage pendientes
content_type	SOURCE CONTRACT PENDING	foto/archivo/texto/audio están aprobados funcionalmente; campo y MIME mapping exactos no están cerrados
lifecycle_state	DOMAIN OWNED	state autoritativo de Evidence
signals	DOMAIN OWNED	señales separadas de ejecución/producción/dominio; semántica exacta pendiente
Reflection	DOMAIN OWNED	entidad aprobada vinculada al trabajo/evidencia según contrato
difficulty	DOMAIN OWNED	campo mínimo de Reflection; percepción
confidence	DOMAIN OWNED	campo mínimo de Reflection; no dominio
actual_minutes	DOMAIN OWNED	campo mínimo de Reflection; tiempo declarado/registrado según provenance
note	DOMAIN OWNED	nota breve; visibilidad restringida
result	SOURCE CONTRACT PENDING	señal contextual permitida; semántica/campo exactos no están en el modelo mínimo
cantidad resuelta sin ayuda	SOURCE CONTRACT PENDING	señal contextual permitida; unidad, denominador y provenance pendientes
expected evidence	SOURCE CONTRACT PENDING	contrato heredado de Action; no inferir desde archivos
completion criterion	SOURCE CONTRACT PENDING	condición mínima de Action; no equivale a dominio
submission channel	SOURCE CONTRACT PENDING	WEB/WHATSAPP y semántica de origen
uploaded_by	SOURCE CONTRACT PENDING	actor que aportó la Evidence; es requisito de provenance, pero su campo exacto en Evidence no está cerrado
submitted_at	SOURCE CONTRACT PENDING	timestamp canónico requerido para trazabilidad
validation method	SOURCE CONTRACT PENDING	declarativa/automática básica/inspeccionable/humana/prueba de dominio
reviewer	SOURCE CONTRACT PENDING	sólo si existe revisión real y permiso
review status	SOURCE CONTRACT PENDING	no duplicar lifecycle_state; mapping exacto pendiente
review expected by	SOURCE CONTRACT PENDING	sólo con SLA real; no prometer por default
sufficiency criterion	SOURCE CONTRACT PENDING	criterio mínimo evaluable; puede referenciar completion criterion
feedback	SOURCE CONTRACT PENDING	contenido, fuente, autoría, visibilidad y auditoría
resubmission reason	SOURCE CONTRACT PENDING	razón visible sólo si la devuelve el owner
execution signal	SOURCE CONTRACT PENDING dentro de signals	evidencia sobre hacer lo acordado; no deriva sólo de upload
production signal	SOURCE CONTRACT PENDING dentro de signals	evidencia sobre producción inspeccionable
domain signal	SOURCE CONTRACT PENDING dentro de signals	sólo prueba aplicable; puede ser no evaluado
Commitment state	DOMAIN OWNED	lifecycle separado; sólo lectura
vínculo Evidence–Commitment concreto	SOURCE CONTRACT PENDING	necesario para original/rescate/tardanza; no inventar commitment_id local
Action state	DOMAIN OWNED	lifecycle separado; sólo owner coordina cierre
Progress impact	DERIVED READ MODEL después de ProgressUpdated; fuera de WF-S07	no se calcula ni muestra como actualizado aquí
Action/materia/tema/contexto	DERIVED READ MODEL	composición por relaciones aprobadas
prepared upload/draft	DERIVED READ MODEL o estado técnico local	no entidad de dominio aprobada
idempotency/reconciliation	SOURCE CONTRACT PENDING	evita Evidence duplicada
tamaño/formatos/duración admitidos	SOURCE CONTRACT PENDING	configuración técnica real
referencia de origen WhatsApp	SOURCE CONTRACT PENDING	deduplicación/auditoría; no truth primaria
historial completo tipo dashboard	UNSUPPORTED	sólo lista compacta contextual
dominio inferido por upload/tiempo/confianza	UNSUPPORTED	dimensiones separadas
exposición cruda a institución por default	UNSUPPORTED	requiere contrato/permiso aplicable
	13.3. Proyección funcional

EvidenceSubmissionView                         # DERIVED READ MODEL
  source_context                               # HOY | MATERIA | COMMITMENT | EVIDENCE
  action
    canonical_reference
    action_id
    state
    verb
    scope
    objective
  academic_context
    course_enrollment
    course_label
    topic_or_goal_label?
    context_type                               # CURSADO | EXAMEN
    assessment_or_preparation?
  related_commitment?                          # SOURCE CONTRACT PENDING
    canonical_reference
    state
    start_at?
    rescue_relation?
  expected_contract
    expected_evidence?                         # SOURCE CONTRACT PENDING
    completion_criterion?                      # SOURCE CONTRACT PENDING
    sufficiency_criterion?                     # SOURCE CONTRACT PENDING
    validation_method?                         # SOURCE CONTRACT PENDING
    allowed_content_types[]?                   # SOURCE CONTRACT PENDING
  prepared_content[]                           # técnico/read model; no entidad nueva
    content_type
    display_name?
    upload_state
  reflection?                                  # Reflection DOMAIN OWNED
    actual_minutes?
    difficulty?
    confidence?
    result?
    quantity_without_help?
    note?
  evidence[]                                   # Evidence DOMAIN OWNED; Action 1:N
    canonical_reference
    lifecycle_state
    submission_channel?
    uploaded_by?
    submitted_at?
    signals?
    reviewer?
    review_expected_by?
    feedback?
    resubmission_reason?

No define SQL, API, tablas, storage ni nuevas entidades.

13.4. Fallbacks

Fuente ausente/no confiable	Comportamiento
Action canónica	error técnico; no enviar
Action no vigente	lectura histórica; bloquear nueva presentación
expected evidence	no inventar requisito; bloquear implementación fiel del envío o mostrar contrato incompleto según owner
completion/sufficiency criterion	no afirmar cierre/suficiencia
tipos permitidos	no prometer soporte; usar configuración real o bloquear captura
validation method	Se actualizará según el método aplicable; no prometer automático/humano
Commitment relacionado	no afirmar en horario, tarde, original o rescate
Evidence lifecycle	error técnico; no asumir EXPECTED/SUBMITTED
reviewer	omitir persona
SLA	omitir fecha
feedback	omitir mensaje; no inventar razón
Reflection config	mantener disclosure opcional mínimo; no hacer encuesta universal
WhatsApp linkage	no vincular por inferencia
	***
14. PROVENANCE Y PRIVACIDAD

14.1. Provenance mínimo

Toda Evidence debe conservar, cuando el contrato lo exponga:

quién la aportó (uploaded_by);
canal (submission_channel);
fecha/hora canónica (submitted_at);
action_id;
Commitment relacionado cuando se cierre el contrato;
contexto Cursado/ExamPreparation;
método de validación;
reviewer/servicio aplicable;
fuente y autoría de feedback;
versiones anteriores y razón de resubmission;
referencia de origen de WhatsApp cuando corresponda.

14.2. Visibilidad por rol

Actor	Visibilidad por defecto
estudiante	sus Evidence, Reflection y estados
operador asignado	sólo según rol, necesidad operativa y permisos
reviewer humano	contenido necesario para aplicar criterion, según assignment
institución	agregado por defecto; no Evidence cruda ni reflexión personal
sistema/servicio de validación	mínimo necesario para el método contratado
	14.3. Reglas

La institución no recibe contenido crudo porque paga el servicio.
Reflection, nota y confidence no se exponen como diagnóstico personal.
El preview no elimina provenance ni cambia permisos.
Feedback muestra autoría/fuente cuando existe.
Retención, borrado, descarga, derechos y aislamiento institucional son SOURCE CONTRACT PENDING.
Una futura política de acceso no puede alterar retroactivamente quién aportó, cuándo y para qué Action.

***
15. EVENTOS

15.1. Eventos aprobados

Evento	Momento	Regla
EvidenceSubmitted	owner confirma una nueva Evidence SUBMITTED	una vez por Evidence canónica; web y WhatsApp usan el mismo evento
EvidenceValidated	owner confirma VALIDATED	conserva evidence_id, action_id, actor/servicio, método y timestamp según contrato
	15.2. Eventos que no se inventan

No se crean como aprobados:

EvidenceUploadStarted;
EvidenceUploadFailed;
EvidencePrepared;
EvidenceUnderReview;
EvidenceSufficient;
EvidenceInsufficient;
EvidenceResubmissionRequested;
EvidenceFeedbackReceived;
EvidenceLateSubmitted;
EvidenceDeleted.

Si la implementación necesita telemetría técnica para upload, error, deduplicación o funnel, su naming, privacidad y deduplicación quedan SOURCE CONTRACT PENDING; no reemplazan eventos de dominio.

15.3. Evento fuera de alcance

ProgressUpdated pertenece a WF-S08. WF-S07 puede explicar que el impacto aparecerá después, pero no emite ni simula ese evento.

***
16. CRITERIOS DE ACEPTACIÓN

16.1. Producto / Lead Product Owner

En menos de 10 segundos se entiende Action, expected evidence, control de captura, significado de enviar, state posterior y qué sigue.
Upload preparado se distingue de SUBMITTED.
SUBMITTED, SUFFICIENT, VALIDATED y dominio no se confunden.
Ejecución, producción y dominio permanecen separados.
Action, Commitment y Evidence conservan identidad/lifecycle propios.
Evidence no borra MISSED, renegociación ni rescate original.
Múltiples Evidence no se sobrescriben.
Evidencia tardía conserva timestamps y estados históricos.
ProgressUpdated y siguiente Action quedan fuera del sprint.
No se promete revisión humana, automática, feedback o SLA sin contrato real.

16.2. UX/UI

Mobile 360 px muestra materia/Action, expected evidence, attach, estado de carga y CTA before the fold.
Existe una única CTA primaria.
Reflection usa progressive disclosure y preguntas contextuales.
Foto, archivo, texto y audio están soportados según el contrato de la Action.
Upload in progress/fallido/exitoso son inequívocos.
Empty evidence mantiene CTA inactiva.
UNDER_REVIEW sólo aparece con revisión real.
INSUFFICIENT usa copy no punitivo y razón sólo si existe.
VALIDATED declara explícitamente que no implica dominio.
Web y WhatsApp muestran provenance/canal comprensible.
No hay galería, dashboard ni historial completo.

16.3. Backend / Evidence System

Confirma Action vigente y expected contract antes de enviar.
Crea/reconcilia Evidence idempotentemente.
Emite EvidenceSubmitted una vez por Evidence.
Devuelve lifecycle autoritativo sin cálculo de frontend.
No usa UNDER_REVIEW sin revisión real.
Conserva originales en resubmission.
Separa signals.execution, signals.production y signals.domain según contrato.
No completa Action por upload o submission.
Devuelve Action/Commitment/Evidence en combinación consistente.
Normaliza WhatsApp en la misma entidad y deduplica mensajes/reintentos.

16.4. Validación / Operación

Validation method está configurado o declarado pendiente.
Todos los artefactos formales de Exam Protocol pasan por revisión humana.
Microevidencias no requieren humano por default.
Reviewer, feedback y SLA aparecen sólo con datos reales y permisos.
Suficiencia aplica el criterion de la Action, no una evaluación personal.
Prueba de dominio permanece una señal explícita y separada.

16.5. Data / Architecture

expected_evidence, completion/sufficiency criterion y validation method tienen contratos cerrados antes de implementación fiel.
Content types, formatos y límites técnicos se configuran sin números inventados.
Evidence–Commitment/rescue relation permite explicar tardanza sin reescribir historia.
Web/WhatsApp comparten idempotencia y provenance.
Multiple Evidence / content grouping tiene semántica inequívoca.
Privacidad, retención, borrado y acceso institucional tienen contrato explícito.
La proyección de pantalla no se convierte en entidad o tabla.

16.6. Eventos

Sólo confirmación SUBMITTED emite EvidenceSubmitted.
Sólo confirmación VALIDATED emite EvidenceValidated.
Upload, error, insufficient, resubmission y feedback no inventan eventos aprobados.
WF-S07 no emite ProgressUpdated.

***
17. TEST DE 10 SEGUNDOS — 360 PX

La simulación usa únicamente el primer viewport.

17.1. EXPECTED

Respuestas esperadas:

Action: resolver ejercicios 8–14 de Unidad 3.
Materia/contexto: Análisis II, Cursado.
Evidence esperada: siete ejercicios completos y adjuntos.
Cómo aportar: foto o archivo, porque son los tipos permitidos recibidos para esta Action.
Estado: todavía no hay contenido.
CTA: inactiva hasta preparar evidencia.
Enviar significa que la Evidence queda SUBMITTED/recibida.
Después continúa la validación según el método aplicable.
Enviar no significa suficiencia ni dominio.

Resultado simulado: PASS.

17.2. Preparada no enviada

Respuestas esperadas:

Hay dos contenidos cargados y listos.
Todavía no fueron enviados.
Se pueden eliminar/agregar antes de enviar.
Enviar evidencia deja la Evidence SUBMITTED; después sigue la validación, sin afirmar dominio.

Resultado simulado: PASS.

17.3. Upload fallido

Respuestas esperadas:

El archivo afectado no se cargó.
Evidence no fue enviada.
Se puede reintentar o quitar.
Reintentar no debe crear una Evidence duplicada.
Action y evidencia esperada siguen visibles durante el error.

Resultado simulado: PASS.

17.4. SUBMITTED

Respuestas esperadas:

La Evidence fue recibida.
Se conoce canal/fecha/actor.
Todavía no se afirma suficiencia ni dominio.
El siguiente state depende del método real.

Resultado simulado: PASS.

17.5. ExamPreparation formal

Respuestas esperadas:

La Evidence pertenece al Parcial 1 y al paso de prueba sin red.
Se entiende el artefacto esperado.
El archivo preparado que habilita el envío es visible.
Requiere revisión humana.
No se promete corrección académica, reviewer ni plazo inexistentes.

Resultado simulado: PASS.

17.6. Tardía con MISSED

Respuestas esperadas:

La producción fue recibida después.
El Commitment original sigue MISSED.
Evidence continuará su propio lifecycle.
No existe cumplimiento retroactivo.

Resultado simulado: PASS.

Resultado global

6 PASS.
0 PASS WITH DENSITY RISK.
0 FAIL.

El test real de 10 segundos en 360 px es gate antes de UI high-fi.

***
18. DECISIONES DESCARTADAS

Decisión descartada	Motivo
archivo subido = Action completada	confunde transferencia, Evidence y lifecycle de Action
Evidence submitted = suficiente	salta criterion/validation method
suficiente = validada	colapsa estados aprobados
validada = dominio	contradice Evidence System
tiempo dedicado = aprendizaje	confunde ejecución con desempeño
Commitment completado = dominio	hacer no equivale a aprender
confianza declarada = capacidad	percepción y dominio son señales distintas
editar expected evidence desde WF-S07	rompe ownership de Action/Engine
sobrescribir Evidence insuficiente	destruye trazabilidad
revisar humanamente todo	costo humano no escalable y contradice niveles de validación
prometer corrección académica	no existe contrato universal
mostrar reviewer/SLA ficticios	presenta presencia humana decorativa
transcripción/análisis automático de audio	feature/contrato no aprobado
editor rico	convierte Reflection en app de notas
galería/dashboard de Evidence	excede el JTBD y el sprint
permitir submit sobre Action reemplazada	altera contexto sin owner
mover Evidence tardía al rescate automáticamente	reescribe trazabilidad
crear eventos para cada state/error	no están aprobados
actualizar progreso en esta pantalla	pertenece a WF-S08
generar siguiente Action	pertenece al Academic Decision Engine después del loop correspondiente
	***
19. SOURCE CONTRACT PENDING

19.1. Bloqueantes para implementación fiel

Contrato	Necesidad mínima	Fallback
expected_evidence	descripción, tipos aceptables y obligatoriedad	no inventar requisito; bloquear implementación fiel
completion_criterion	condición de cierre de Action	no afirmar cierre
sufficiency_criterion	regla mínima evaluable	no decidir SUFFICIENT/INSUFFICIENT
validation_method	método y necesidad real de review	no mostrar automático/humano; copy neutral
Content model	shape/cardinalidad, storage y preview de foto/archivo/texto/audio	sólo wireframe conceptual
formatos/límites	MIME, tamaño, duración y mensajes	sin números; configuración real
Evidence pre-submission	EXPECTED canónica vs. draft/staging	conservar separación preparado/SUBMITTED
idempotencia/reconciliación	key, scope, retención y lookup	no reintentar ciegamente
Multiple Evidence	agregación para sufficiency y grouping de adjuntos	no calcular conjunto en frontend
Evidence–Commitment	relación canónica para horario, MISSED y rescate	no afirmar puntual/tardía/original/rescate
late submission	elegibilidad, etiqueta y efecto permitido	preservar estados; no retroactividad
WhatsApp normalization	identity mapping, action linking, origin ref y deduplicación	no vincular por inferencia
Reflection configuration	campos/obligatoriedad por Action/protocolo	disclosure opcional mínimo
reviewer/review status	assignment, roles y mapping al lifecycle	omitir persona/state paralelo
review SLA	fecha, owner y vigencia	omitir plazo
feedback/resubmission	autoría, razón, visibilidad, auditoría y respuesta	mostrar sólo datos reales
signals semantics	ejecución/producción/dominio y provenance	no inferir desde upload/tiempo/confianza
Action close coordination	cuándo VALIDATED permite Action COMPLETED	no completar localmente
privacy/retention/delete	permisos, borrado, descarga, conservación y tenancy	acceso mínimo; no delete post-submit
error telemetry	naming y privacidad técnica	no crear eventos de dominio
	19.2. No bloqueantes para wireframe

iconografía exacta de foto/archivo/texto/audio;
selector nativo o custom;
preview visual exacta por tipo;
porcentaje de upload si existe dato real;
sheet o expansión inline para Reflection;
copy exacto de Agregar reflexión;
orden de los tipos permitidos;
proporción de columnas desktop;
label corto de Assessment/paso en 360 px.

Estas decisiones son reversibles y no alteran lifecycle, ownership, eventos ni entidades.

***
20. CHANGE REQUESTS Y ESTADO FINAL

20.1. Change Requests

Ninguno.

La solución no exige modificar Product Spec, Design Spec, HOY, Materia, Próxima Acción, Compromiso, Academic Decision Engine, entidades, eventos aprobados ni navegación estructural.

Los contratos de expected evidence, criteria, validation, idempotencia, WhatsApp, Reflection, privacidad y relación Evidence–Commitment deben cerrarse en Architecture/API/Data/Integration Spec. No se resuelven mediante entidades o eventos silenciosos.

20.2. Trazabilidad breve de P0/P1 corregidos

La auditoría registró 0 P0 y 3 P1. Esta revisión no implementa EVI-P2-01, EVI-P2-02 ni EVI-P2-03.

Finding	Corrección aplicada	Trazabilidad
EVI-P1-01	El primer viewport explicita verbo y alcance de la Action, significado de enviar, estado SUBMITTED, paso de validación y límites de suficiencia/dominio. Upload en progreso y fallido preservan el shell de Action y expected evidence.	§§ 6.1, 6.2, 6.3, 6.4, 17.1–17.3
EVI-P1-02	La captura usa un único control y filtra opciones por allowed_content_types; si el contrato falta, no presenta tipos como válidos y deriva al fallback pendiente ya declarado.	§§ 4.2, 6.1, 7, 17.1
EVI-P1-03	El artefacto formal preparado muestra un archivo real en el wireframe antes de habilitar la CTA; sin contenido, permanece EXPECTED e inactivo. Conserva revisión humana sin prometer reviewer, feedback ni SLA.	§§ 6.5, 17.5
	20.3. Self-audit

Criterio	Resultado
JTBD limitado a presentar Evidence + Reflection mínima	PASS
Action/expected evidence no editables	PASS
Foto, archivo, texto y audio soportados funcionalmente	PASS
Tipos visibles filtrados por contrato de la Action	PASS CON SOURCE CONTRACT PENDING
Web y WhatsApp normalizados en Evidence	PASS
Upload separado de submission	PASS
Primer viewport explica envío, estado siguiente y límites	PASS
Upload en progreso/fallido preserva Action y expected evidence	PASS
Lifecycle completo y UNDER_REVIEW condicional	PASS
Ejecución, producción y dominio separados	PASS
Reflection mínima, contextual y no diagnóstica	PASS
Todos los estados críticos representados	PASS
Múltiples Evidence preservan originales	PASS
Evidence tardía no reescribe MISSED/rescate	PASS
Exam artifact requiere review humana	PASS
Exam artifact preparado muestra contenido visible	PASS
Ausencia de humano no genera promesas	PASS
Errores/reintentos idempotentes	PASS CON SOURCE CONTRACT PENDING
Data contracts clasificados	PASS
Provenance y privacidad preservadas	PASS CON SOURCE CONTRACT PENDING
Sólo EvidenceSubmitted y EvidenceValidated	PASS
ProgressUpdated fuera de este sprint	PASS
Sin features, Engines, entidades o navegación nueva	PASS
Change Requests estructurales	0
	Estado final

ACHIEVE_EVIDENCIA_FUNCTIONAL_WIREFRAME_v0.2_CANDIDATE.md queda:

READY FOR LEAD PRODUCT OWNER REAUDIT

No queda aprobado para UI high-fi hasta:

auditoría funcional independiente con 0 P0 y 0 P1 abiertos;
cierre técnico de los SOURCE CONTRACT PENDING bloqueantes;
prueba real de 10 segundos en 360 px;
verificación de idempotencia y reconciliación web/WhatsApp;
freeze de contratos Evidence–Action–Commitment–Validation–Privacy en Architecture/API/Data/Integration Spec.


***

VI.6 — Progreso / Bitácora

ACHIEVE — PROGRESO ACTUALIZADO + BITÁCORA

FUNCTIONAL WIREFRAME v0.3 CANDIDATE

Estado: candidato de corrección localizada de v0.2, listo para reauditoría cerrada de Lead Product Owner.  
Fecha: 24 de agosto de 2026.  
Sprint: SPRINT UX06 — PROGRESO ACTUALIZADO + BITÁCORA.  
Wireframe: WF-S08 — Progreso visible después de evidencia.  
Tipo: especificación funcional; no UI high-fi.  
Responsable: Senior Product Designer de Achieve.

***
1. RESUMEN EJECUTIVO

Este sprint resuelve el cierre visual del ciclo:

ActionRecommendation → Action → Commitment → Evidence → Progress

La solución separa dos superficies conectadas:

Resultado posterior a Evidence: explica qué se registró, el estado autoritativo de la Evidence, si existe o no un cambio de progreso confirmado y cuál es el siguiente destino real.
Progreso + Bitácora: muestra las dimensiones académicas existentes y reconstruye el historial relevante sin convertir actividad en aprendizaje ni la Bitácora en un Engine.

La regla central es:

> Una Evidence puede cambiar de estado sin que cambie el progreso; y un cambio de progreso sólo se muestra cuando el owner lo confirma y entrega las dimensiones afectadas.

Por lo tanto:

SUBMITTED confirma recepción, no validación;
UNDER_REVIEW confirma una revisión real pendiente, no dominio;
SUFFICIENT confirma el criterio mínimo de la Action, no progreso ni dominio;
VALIDATED confirma el cierre por el método aplicable, pero no identifica por sí sola qué dimensión académica cambió;
ProgressUpdated es el único evento aprobado que habilita a presentar un cambio de TopicProgress/CourseProgress como confirmado;
si falta el resultado autoritativo de progreso, la UI muestra todavía sin cambio confirmado, no sin cambios ni 0;
si el owner confirma explícitamente que ninguna dimensión cambió, la UI muestra un resultado sin cambio y su razón sólo si ésta existe;
la Bitácora registra lo ocurrido y agrupa visualmente los eventos relacionados con la misma Action, sin duplicarlos como varios avances independientes.

No se diseñan Activación de Modo Examen, Modo Examen, CRM, revisión humana ni una nueva recomendación.

***
2. FUENTES LEÍDAS Y VERSIONES

Se leyeron completamente y en el orden solicitado:

ACHIEVE_MVP_USUARIO_PRODUCT_SPEC_v0.5_FINAL.docx.
ACHIEVE_USER_FLOW_WIREFRAMES_DATA_MODEL_v0.2_FINAL.docx.
ACHIEVE_HOY_AUTOGESTION_FUNCTIONAL_SPEC_v1.0_APPROVED.md.
ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_SPEC_v1.0_APPROVED.md.
ACHIEVE_PROXIMA_ACCION_FUNCTIONAL_SPEC_v1.0_APPROVED.md.
ACHIEVE_COMPROMISO_FUNCTIONAL_SPEC_v1.0_APPROVED.md.
ACHIEVE_EVIDENCIA_FUNCTIONAL_SPEC_v1.0_APPROVED.md.

Se utilizaron exclusivamente esas versiones aprobadas. No se sustituyeron por candidates, auditorías o wireframes preliminares.

Jerarquía aplicada

Product Spec v0.5 define visión, principios, límites y mecanismos.
User Flow/Data Model v0.2 define flujos, entidades, relaciones, máquinas de estado, semántica dimensional, ProgressEntry y WF-S08.
HOY v1.0 define precedencia operativa y TodayView como read projection.
Materia/Cursado v1.0 define Recorrido, Práctica, Dominio, Confianza y Recencia, además de la relación entre Actividad reciente y Bitácora.
Próxima Acción v1.0 define la identidad y el alcance de la Action original.
Compromiso v1.0 preserva lifecycle, MISSED, renegociación y rescate.
Evidencia v1.0 congela lifecycle, semántica de Evidence y la frontera exacta con WF-S08.

Alcance de esta revisión

Esta versión parte de v0.2 y aplica exclusivamente la corrección localizada exigida por su reauditoría:

PROG-P1-04 / REG-P1-01: en §16.7.A, mantener dentro de CAMBIO CONFIRMADO únicamente las dimensiones incluidas en changed_dimensions e identificar cualquier dimensión autoritativa conservada en un bloque separado.

PROG-P1-01, PROG-P1-02 y PROG-P1-03 permanecen resueltos y no se reabren. No existen P0. No se rediseña, no se amplía alcance y no se modifican decisiones correctamente preservadas por la reauditoría. No se agregan P2, features, Engines, entidades, eventos, estados, roles, contratos ni navegación.

***
3. JOB TO BE DONE

Después de presentar una Evidence, el estudiante debe poder pasar de “envié algo” a entender qué ocurrió realmente, qué cambió o todavía no cambió y qué debe hacer después, sin confundir actividad, validación y aprendizaje.

En menos de 10 segundos debe responder:

¿Qué acaba de pasar?
¿En qué estado está mi Evidence?
¿Mi progreso cambió o todavía no existe un cambio confirmado?
¿Qué dato respalda el cambio visible?
¿Qué dimensión no cambió o sigue sin demostrarse?
¿Qué hago después?

Al profundizar debe poder responder:

¿Cómo se ve este resultado dentro de Recorrido, Práctica, Dominio, Confianza y Recencia?
¿Qué ocurrió antes en esta materia?
¿Qué fuente y estado de verificación tiene cada dato discutible?
¿Cómo se relacionan Action, Commitment y Evidence sin reescribir la historia?

***
4. ALCANCE

4.1. Incluye

entrada desde Evidence;
estado autoritativo de Evidence;
confirmación de recepción, revisión, suficiencia, insuficiencia o validación;
estado de progreso confirmado, pendiente, sin cambio confirmado o temporalmente no disponible;
visualización separada de Recorrido, Práctica, Dominio, Confianza y Recencia;
comparación anterior/actual únicamente con snapshots o valores autoritativos;
explicación causal sólo con relación respaldada;
siguiente destino real;
Bitácora privada y cronológica;
relación trazable con Action, Commitment y Evidence;
provenance y verification_status cuando corresponda;
agrupación visual/deduplicación de eventos del mismo ciclo;
relación con Materia/Cursado y HOY;
continuidad hacia una ActionRecommendation ya emitida, únicamente cuando existe.

4.2. Resultado funcional esperado

La pantalla debe poder representar cuatro resultados diferentes sin ambigüedad:

Evidence cambió de estado; progreso todavía no confirmado.
Evidence validada; progreso confirmó un cambio limitado.
El owner confirmó que no hubo cambio en las dimensiones visibles.
El dato de progreso no está disponible; no se interpreta como cero ni como ausencia confirmada de cambio.

***
5. FUERA DE ALCANCE

No se diseña:

Activación de Modo Examen;
Modo Examen;
protocolo, readiness, simulacros o mapa de errores;
analítica institucional;
dashboard universitario;
CRM, cola de operadores o panel de revisión;
revisión humana no existente;
chat;
calendario;
notificaciones;
recomendaciones creadas por esta pantalla;
ranking, puntaje, racha o gamificación;
porcentaje universal de materia aprendida;
nota o calificación inventada;
comparación entre alumnos;
predicción o riesgo de abandono;
edición o eliminación del historial;
filtros avanzados nuevos;
nuevas Evidence;
nuevas entidades, estados, eventos, roles o Engines.

***
6. DECISIONES CONGELADAS PRESERVADAS

El ciclo canónico permanece Action → Commitment → Evidence → Progress.
Evidence conserva EXPECTED → SUBMITTED → UNDER_REVIEW cuando aplica → SUFFICIENT / INSUFFICIENT → VALIDATED, con INSUFFICIENT → RESUBMISSION_REQUESTED cuando el owner lo confirma.
SUBMITTED no equivale a Evidence validada.
UNDER_REVIEW no equivale a dominio demostrado.
SUFFICIENT cumple el criterio mínimo; no implica dominio ni progreso actualizado.
INSUFFICIENT no significa fracaso personal, ausencia de ejecución ni ausencia total de aprendizaje.
VALIDATED confirma cierre por el método aplicable; no implica dominio universal.
VALIDATED sólo abre WF-S08 con un destino real.
Commitment, Evidence y Action conservan identidad y lifecycle propios.
Evidence tardía no modifica retroactivamente un Commitment MISSED.
Rescate no borra el MISSED original.
Ejecución, Producción y Dominio permanecen separados.
Recorrido, Práctica, Dominio, Confianza y Recencia permanecen separados.
Confianza declarada no equivale a Dominio demostrado.
Confianza alta + Dominio bajo demostrado sigue siendo representable de forma no punitiva.
No evaluado, desconocido, pendiente y temporalmente no disponible no equivalen a cero.
Provenance, confidence académica, vigencia y verification_status no se pierden.
Un reporte estudiantil no se presenta como hecho confirmado de cátedra.
La Bitácora es una memoria privada, no un feed social ni un Engine.
La pantalla no prioriza académicamente ni reemplaza al Academic Decision Engine.
TodayView continúa siendo una proyección de lectura.
No se presume operador, docente, tutor, psicopedagogo, reviewer, feedback ni SLA.

***
7. MODELO MENTAL DEL ESTUDIANTE

La interfaz usa tres preguntas consecutivas:

Pregunta mental	Respuesta de la UI	Fuente
¿Qué ocurrió?	estado de Evidence + Action relacionada	Evidence System
¿Qué efecto confirmado tuvo?	dimensiones cambiadas, no cambiadas o todavía pendientes	TopicProgress/CourseProgress + ProgressUpdated
¿Qué sigue?	destino real existente	lifecycle + Academic Decision Engine cuando ya emitió recomendación
	7.1. Lenguaje mental

Registrado describe un hecho guardado.
En revisión describe una revisión real pendiente.
Cumplió el criterio describe SUFFICIENT.
Validada describe VALIDATED.
Cambió sólo describe una dimensión incluida en un resultado de progreso confirmado.
No cambió sólo se usa con un resultado autoritativo explícito.
Todavía sin cambio confirmado describe espera o falta de resultado, no un no-cambio.
No evaluado describe ausencia de prueba comparable.
Desconocido describe información insuficiente.

7.2. Regla de carga cognitiva

La pantalla no obliga a interpretar todo el modelo. Primero muestra el resultado de esta Evidence. Las cinco dimensiones completas y el historial aparecen después.

***
8. ARQUITECTURA DE INFORMACIÓN

8.1. Pantalla posterior a Evidence

Orden estable:

header: materia + contexto;
qué ocurrió;
estado de Evidence;
qué cambió;
qué no cambió o qué sigue sin demostrarse;
dato/fuente que respalda el resultado;
siguiente destino real;
acceso secundario a Evidence, Materia o Bitácora.

8.2. Progreso + Bitácora

Orden estable:

estado de la materia/unidad;
cinco dimensiones separadas;
explicación del último cambio confirmado;
siguiente Action ya emitida, si existe;
resumen acumulado factual;
timeline privado de Bitácora.

8.3. Relación con Actividad reciente de Materia

Actividad reciente de Materia sigue siendo una preview de las últimas 2–3 entradas.
Bitácora es el historial completo de la misma verdad derivada.
No existe una segunda fuente histórica.
Ambas consumen ProgressEntry o el mismo bundle derivado de eventos.
La preview no cambia semántica, provenance ni verification_status.

***
9. ENTRADAS Y SALIDAS DEL FLUJO

9.1. Entradas válidas

Continuar desde Evidence VALIDATED, sólo si existe destino real;
Ver avance desde Commitment COMPLETED + Evidence VALIDATED;
Ver avance desde HOY cuando el lifecycle autoritativo lo permite;
Ver Bitácora desde Materia/Cursado;
apertura de una entrada desde Actividad reciente;
retorno desde detalle de Evidence, Action o Commitment.

9.2. Salidas válidas

Ver evidencia → Evidence canónica;
Ver materia → CourseEnrollment actual;
Ver Bitácora → timeline completo de la materia;
Ver acción / Ver compromiso → objeto existente relacionado;
Siguiente acción → ActionRecommendation/Action ya emitida y vigente;
Preparar nueva evidencia → sólo cuando existe RESUBMISSION_REQUESTED y destino real;
retorno a HOY.

9.3. Salidas no permitidas

Generar siguiente acción;
Recalcular ahora;
Pedir revisión sin contrato;
Corregir progreso desde la UI;
Marcar dominio;
Editar historial;
CTA a una nueva Evidence desde INSUFFICIENT sin RESUBMISSION_REQUESTED.

***
10. ESTADOS FUNCIONALES

Estado/condición	Qué ocurrió	Progreso visible	CTA/destino real	Prohibido
Evidence SUBMITTED	owner recibió la Evidence	Todavía sin cambio confirmado	Ver evidencia; nueva Action sólo si ya existe	mostrar validación, dominio o progreso actualizado
Evidence UNDER_REVIEW	existe revisión real pendiente	sin progreso confirmado por este estado	Ver evidencia	inventar reviewer, SLA, feedback o cambio
Evidence INSUFFICIENT	no cumple todavía el criterio mínimo	no declarar retroceso ni cero	Ver detalle; Preparar nueva evidencia sólo con RESUBMISSION_REQUESTED	castigo, borrar anterior o crear nueva Evidence localmente
Evidence SUFFICIENT	cumple criterio mínimo	todavía no implica ProgressUpdated	Ver evidencia; esperar/continuar sólo según destino real	dominio o avance confirmado
Evidence VALIDATED, sin resultado de progreso disponible	cierre confirmado	Validada · cambio todavía no confirmado	Ver evidencia, Ver materia o destino existente	inferir cambio por validación
Evidence VALIDATED + ProgressUpdated	cambio de progreso confirmado	sólo dimensiones incluidas en changed_dimensions	Ver Bitácora; siguiente Action sólo si existe	arrastrar todas las dimensiones
resultado autoritativo sin cambio	owner confirma ninguna dimensión afectada	Sin cambios en progreso + razón real si existe	siguiente destino existente	confundir con falla o ausencia de datos
progreso desconocido	faltan valores o semántica	Sin información suficiente	ver contexto disponible	mostrar 0%
Evidence tardía + MISSED	producción recibida tarde	progreso sólo si owner lo confirma; Commitment sigue MISSED	Evidence/Bitácora	cumplimiento retroactivo
confianza alta + dominio bajo demostrado	brecha derivada real	ambas dimensiones separadas	destino ya emitido, si existe	generar recomendación local
datos temporalmente no disponibles	lectura falló o fuente no responde	no se afirma cambio ni no-cambio	Reintentar lectura real	mostrar empty o cero
Bitácora vacía	no existen entradas disponibles	sin historial; no implica atraso	volver a Materia	fabricar actividad
	***
11. MATRIZ DE EFECTOS POR ESTADO DE EVIDENCE

| Evidence | Lifecycle de Evidence | Actividad/Bitácora | Recorrido | Práctica | Dominio | Confianza | Recencia | Siguiente paso |
|---|---|---|---|---|---|---|---|---|---|
| SUBMITTED | cambia a recibida | puede aparecer el hecho EvidenceSubmitted; una Reflection o actividad también puede quedar registrada como hecho, sin presentarse como cambio dimensional | sólo cambia con ProgressUpdated o lectura autoritativa equivalente; nunca por submission | sólo cambia con ProgressUpdated o lectura autoritativa equivalente; nunca por submission | sólo cambia con ProgressUpdated o lectura autoritativa equivalente y señal aplicable | una Reflection puede registrar un autorreporte, pero Confianza visible sólo cambia con ProgressUpdated o lectura autoritativa equivalente | la actividad puede registrarse en Bitácora, pero Recencia visible sólo cambia con ProgressUpdated o lectura autoritativa equivalente | validación según método; sin resultado prometido; mientras tanto, Todavía sin cambio confirmado |
| UNDER_REVIEW | revisión real pendiente | puede actualizar el estado de la misma entrada | sin cambio por review | sin cambio por review | sin cambio | sin cambio | sin cambio por el estado de review | esperar/ver Evidence; sin reviewer/SLA inventado |
| INSUFFICIENT | criterio mínimo no cumplido | misma Evidence conserva el resultado | no se interpreta como retroceso | no se borra práctica previa | no se declara bajo salvo señal de dominio real | no se altera automáticamente | no se borra actividad | detalle; nueva presentación sólo si RESUBMISSION_REQUESTED |
| SUFFICIENT | criterio mínimo cumplido | misma entrada muestra suficiencia | sólo cambia con ProgressUpdated | sólo cambia con ProgressUpdated | no implica dominio | no cambia automáticamente | sólo con semántica propietaria | validación/cierre según owner |
| VALIDATED sin ProgressUpdated | cierre confirmado | misma entrada muestra validación | pendiente | pendiente | no inferido | sin cambio automático | pendiente | mostrar validación; no inventar impacto |
| VALIDATED + ProgressUpdated | cierre confirmado | entrada incorpora impacto confirmado | cambia sólo si figura en payload/lectura | cambia sólo si figura | cambia sólo con señal de dominio aplicable | cambia sólo con nuevo autorreporte o contrato explícito | cambia sólo si figura/deriva de evento útil según owner | siguiente Action ya emitida o retorno real |

Gating dimensional invariante

En todas las filas de esta matriz, Recorrido, Práctica, Dominio, Confianza y Recencia sólo pueden mostrarse como cambiadas con ProgressUpdated o una lectura autoritativa equivalente del owner de progreso. El lifecycle de Evidence, una Reflection o el registro factual de actividad nunca funcionan como disparadores alternativos. Sin ese hecho habilitante, la representación obligatoria es Todavía sin cambio confirmado.

11.1. Regla especial de INSUFFICIENT

INSUFFICIENT no elimina hechos anteriores. Si existió ejecución o producción registrada, esos hechos pueden seguir visibles como tales, pero no se elevan a progreso dimensional sin ProgressUpdated y semántica aprobada.

11.2. Regla especial de VALIDATED

El Product Spec exige que una Evidence validada tenga una consecuencia visible en estado, progreso, riesgo, plan o reconocimiento. En este sprint la consecuencia mínima siempre visible es el cambio de estado de Evidence. El cambio académico se muestra únicamente si el contrato de progreso lo confirma. La pantalla no inventa cambios para cumplir visualmente el principio.

***
12. REGLAS DE ACTUALIZACIÓN Y NO ACTUALIZACIÓN

12.1. Actualización permitida

Una dimensión puede mostrarse como cambiada sólo cuando se cumplen todas estas condiciones:

existe un resultado autoritativo de progreso;
identifica CourseEnrollment y, cuando aplica, Topic;
identifica la dimensión afectada;
entrega valor/semántica comprensible actual;
si se muestra comparación, entrega estado anterior y actual o una referencia reconstruible;
la relación causal con la Evidence/Action está confirmada cuando la UI dice cambió por esta evidencia;
provenance y verification_status se conservan cuando el dato lo requiere.

12.2. Comparación anterior → actual

Se muestra sólo si existe snapshot o historia autoritativa:

7 ejercicios de práctica registrados
Práctica: 12 → 19 ejercicios

Si sólo existe el valor actual:

Práctica actual: 19 ejercicios registrados

No se reconstruye el anterior restando cantidades en frontend.

12.3. No actualización

No cambian automáticamente:

Recorrido por adjuntar un archivo;
Práctica por declarar que estudió;
Dominio por SUBMITTED, SUFFICIENT o VALIDATED sin prueba aplicable;
Confianza por el resultado de Evidence;
Recencia por abrir la pantalla;
Commitment por una Evidence tardía;
riesgo, plan o próxima Action desde esta vista.

12.4. Tres estados distintos que no deben colapsarse

Estado	Copy canónico	Significado
resultado pendiente	Todavía no hay un cambio de progreso confirmado.	puede llegar un resultado; no se afirma cambio ni no-cambio
no-cambio confirmado	Esta actividad quedó registrada, pero no cambió las dimensiones de progreso.	el owner confirmó resultado sin dimensión afectada
dato no disponible	No pudimos cargar el progreso. Tu evidencia conserva su estado.	falla de lectura; no es resultado académico
	12.5. SOURCE CONTRACT PENDING para no-cambio y causalidad

El evento aprobado ProgressUpdated confirma cambio y puede incluir changed_dimensions. Las fuentes no cierran:

un outcome explícito de no change;
la razón normalizada de no-cambio;
snapshots anterior/actual;
relación causal exacta Evidence → ProgressUpdated/ProgressEntry;
idempotencia/deduplicación de la proyección.

Hasta cerrar esos contratos:

la UI puede mostrar todavía sin cambio confirmado;
no puede afirmar no cambió por ausencia de ProgressUpdated;
no puede atribuir un cambio a una Evidence sólo por cercanía temporal.

***
13. REGLAS DE BITÁCORA

13.1. Función

La Bitácora es la memoria privada de trabajo académico real dentro de una materia. Permite reconstruir qué ocurrió y qué efecto confirmado produjo, sin decidir qué estudiar ni declarar dominio.

13.2. Contenido permitido por entrada

fecha/hora autoritativa;
materia y unidad/tema;
Action relacionada;
Commitment relacionado y estado histórico;
Evidence relacionada y lifecycle;
producción/tiempo/reflexión cuando existen y son visibles;
provenance y verification_status;
impacto de progreso únicamente si fue confirmado;
feedback humano únicamente si existe y está autorizado;
hito existente.

13.3. Agrupación visual sin entidad nueva

Los eventos cercanos del mismo ciclo se muestran como una sola tarjeta expandible cuando el bundle derivado puede vincularlos por la misma Action:

ACTION: ejercicios 8–14
  Commitment completado
  Evidence enviada → validada
  Progreso: Práctica +7; Dominio no evaluado

La tarjeta es una composición de lectura de objetos existentes. No crea Activity, TimelineItem ni otra entidad.

13.4. Regla de deduplicación

EvidenceSubmitted, cambio a UNDER_REVIEW, EvidenceValidated y ProgressUpdated de la misma Evidence/Action actualizan la misma historia visual cuando el bundle lo permite.
No se muestran cuatro tarjetas como si fueran cuatro avances independientes.
Un Commitment MISSED y una Evidence tardía permanecen dos hechos distintos dentro de la misma historia, sin reescritura.
Un rescate real usa su propia Action/Commitment y se vincula al original sólo si rescue_relation existe.
Un reporte de clase y una corroboración posterior conservan versiones/estado; la corroboración no borra que el origen fue estudiantil.

La regla técnica de correlación y orden estable queda SOURCE CONTRACT PENDING; el modelo conceptual ya admite ProgressEntry como bundle derivado/materialización opcional.

13.5. Filtros congelados

Se preservan únicamente:

Todo;
Unidad;
Examen;
Hitos.

No se agregan filtros avanzados. Cuando Examen no aplica, puede omitirse sin crear otro filtro.

13.6. Provenance en Bitácora

Origen	Copy mínimo
institución/cátedra oficial	Fuente oficial · {verification_status}
instructor/cátedra corroborada	Cátedra · corroborado
estudiante	Reportado por vos · {verification_status}
comunidad	Reporte comunitario · {verification_status}
inferencia existente	Estimado por Achieve · {verification_status}
desconocido	Fuente no disponible
	El label visible se adapta a la semántica real, pero no elimina source_type ni convierte unverified en corroborated.

***
14. JERARQUÍA VISUAL

14.1. Mobile 360 px posterior a Evidence

qué ocurrió;
state actual;
qué cambió;
qué no cambió o sigue no demostrado;
dato fuente;
qué sigue;
historial secundario.

14.2. Mobile de Bitácora

materia y período;
resumen acumulado factual;
filtros congelados;
tarjetas cronológicas;
provenance/verification junto al dato discutible;
impacto confirmado dentro de la tarjeta, nunca como badge aislado.

14.3. Desktop

columna principal: resultado/progreso dimensional;
columna secundaria: siguiente destino y resumen acumulado;
ancho completo inferior: Bitácora;
no se introduce dashboard ni múltiples CTAs académicas.

14.4. Un dato, un dueño visual

Dato	Lugar principal	Representación secundaria
state de Evidence	resultado posterior	Bitácora muestra historia compacta
dimensiones	Progreso	tarjeta muestra sólo impacto confirmado
próxima Action	bloque Qué sigue	no aparece como decisión de Bitácora
provenance	junto al dato	detalle puede expandir fuente completa
MISSED	historia del Commitment	Evidence tardía lo referencia sin modificarlo
trabajo acumulado	cabecera Bitácora	no se usa como dominio
	***
15. MICROCOPY PRINCIPAL

Situación	Copy permitido
SUBMITTED	Recibimos tu evidencia.
UNDER_REVIEW	Tu evidencia está en revisión.
SUFFICIENT	Cumplió el criterio mínimo de esta Action.
INSUFFICIENT	Todavía no cumple el criterio mínimo.
VALIDATED	La evidencia quedó validada.
pendiente de progreso	Todavía no hay un cambio de progreso confirmado.
cambio limitado	Cambió Práctica. Las demás dimensiones conservan su estado.
dominio no evaluado	Esta evidencia no evaluó dominio.
no-cambio confirmado	La actividad quedó registrada, pero no cambió las dimensiones de progreso.
falta información	No hay información suficiente para mostrar esta dimensión.
dato caído	No pudimos cargar el progreso. Tu evidencia conserva su estado.
Confidence/Domain gap	Tu confianza refleja cómo te sentís. El dominio refleja la evidencia disponible. Hoy no coinciden.
tardía + MISSED	La evidencia fue recibida después. El compromiso original sigue incumplido.
Bitácora vacía	Tu trabajo registrado en esta materia va a aparecer acá.
	15.1. Copy prohibido

Dominaste la unidad sin prueba aplicable;
Subiste tu nivel;
Ganaste progreso;
La materia aumentó X% sin métrica aprobada;
No avanzaste por ausencia de datos;
Tu evidencia está mal;
Fallaste;
Agus la revisará sin assignment;
Estamos calculando sin proceso real;
Elegimos lo siguiente desde esta vista.

***
16. WIREFRAMES MOBILE — 360 PX

16.1. Evidence SUBMITTED; progreso todavía no validado

+--------------------------------------+
| <- RESULTADO · ANALISIS II · CURSADO |
+--------------------------------------+
| EVIDENCIA RECIBIDA                   |
| Ejercicios 8–14 · Unidad 3           |
| Estado: SUBMITTED                    |
| Enviada por vos · web · 20:12        |
+--------------------------------------+
| PROGRESO                             |
| Todavia no hay un cambio confirmado. |
| Enviar no valida suficiencia ni      |
| demuestra dominio.                   |
+--------------------------------------+
| QUE SIGUE                            |
| Se actualizara segun el metodo real  |
| de validacion.                       |
| [          VER EVIDENCIA           ] |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| [ Ver materia ]  [ Ver Bitacora ]    |
+--------------------------------------+

Reglas:

no muestra reviewer, plazo ni humano;
no presenta ninguna dimensión como cambiada;
Ver evidencia abre el objeto existente;
Ver materia y Ver Bitácora son accesos secundarios.

16.2. Evidence UNDER_REVIEW

+--------------------------------------+
| <- RESULTADO · ANALISIS II           |
+--------------------------------------+
| EVIDENCIA EN REVISION                |
| Estado: UNDER_REVIEW                 |
| Revisor: todavia no asignado         |
| Sin plazo informado                  |
+--------------------------------------+
| PROGRESO                             |
| No hay progreso confirmado por este  |
| estado. Esta Evidence todavia no     |
| aporta un nuevo resultado de dominio.|
+--------------------------------------+
| QUE SIGUE                            |
| El state solo cambia cuando el owner |
| confirma SUFFICIENT o INSUFFICIENT.  |
+--------------------------------------+
| [          VER EVIDENCIA           ] |
+--------------------------------------+

Esta variante sólo existe si hay revisión real. Las líneas de reviewer/SLA se omiten si el contrato no entrega su ausencia explícita. UNDER_REVIEW no fija Dominio no evaluado, bajo, consistente ni ningún otro valor. El estado actual de Dominio sólo puede mostrarse si llega de su owner; este wireframe se limita a declarar que esta Evidence aún no aporta una señal nueva.

16.3. Evidence INSUFFICIENT

+--------------------------------------+
| <- RESULTADO · ANALISIS II           |
+--------------------------------------+
| TODAVIA NO CUMPLE EL CRITERIO        |
| Estado: INSUFFICIENT                 |
| Falta: ejercicios 12–14 legibles     |
+--------------------------------------+
| QUE CAMBIO                           |
| La Evidence conserva este resultado. |
| No se confirmo cambio de progreso.   |
+--------------------------------------+
| QUE NO SIGNIFICA                     |
| No borra lo que hiciste ni define tu |
| capacidad o dominio general.         |
+--------------------------------------+
| QUE SIGUE                            |
| Revisa el criterio faltante. Todavia |
| no hay otro envio habilitado.        |
+--------------------------------------+
| [          VER DETALLE             ] |
+--------------------------------------+

Falta: … sólo aparece si existe razón real. Esta variante representa INSUFFICIENT sin RESUBMISSION_REQUESTED: no crea ni ofrece otra Evidence.

Variante real: RESUBMISSION_REQUESTED

+--------------------------------------+
| <- RESULTADO · ANALISIS II           |
+--------------------------------------+
| NUEVA PRESENTACION SOLICITADA        |
| Estado: RESUBMISSION_REQUESTED       |
| Falta: ejercicios 12–14 legibles     |
+--------------------------------------+
| QUE SIGUE                            |
| Tu Evidence anterior se conserva.    |
| Ya podes preparar una nueva.         |
| [    PREPARAR NUEVA EVIDENCIA      ] |
+--------------------------------------+

Esta CTA sólo aparece porque el owner confirmó RESUBMISSION_REQUESTED y existe el destino real. No sobrescribe la Evidence anterior.

16.4. Evidence SUFFICIENT

+--------------------------------------+
| <- RESULTADO · ANALISIS II           |
+--------------------------------------+
| CRITERIO MINIMO CUMPLIDO             |
| Estado: SUFFICIENT                   |
+--------------------------------------+
| PROGRESO                             |
| Todavia no hay un cambio confirmado. |
| Suficiencia no equivale a dominio.   |
+--------------------------------------+
| QUE SIGUE                            |
| El cierre queda VALIDATED solo si    |
| lo confirma el owner aplicable.      |
+--------------------------------------+
| [          VER EVIDENCIA           ] |
+--------------------------------------+

16.5. Evidence VALIDATED con cambio limitado

+--------------------------------------+
| <- AVANCE · ANALISIS II · UNIDAD 3   |
+--------------------------------------+
| EVIDENCIA VALIDADA                   |
| Ejercicios 8–14 · validada 20:26     |
+--------------------------------------+
| CAMBIO CONFIRMADO                    |
| Practica · 12 -> 19 ejercicios       |
| Recencia · hoy                       |
| Fuente: Evidence validada            |
+--------------------------------------+
| SIN CAMBIO CONFIRMADO                |
| Recorrido · conserva su estado       |
| Dominio · no evaluado                |
| Confianza · alta · declarada ayer    |
+--------------------------------------+
| QUE SIGUE                            |
| Reforzar cambio de variables         |
| [     VER SIGUIENTE ACCION         ] |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| [ Ver Bitacora ]                     |
+--------------------------------------+

Esta primera variante sólo aparece cuando existe una ActionRecommendation/Action canónica, vigente e inequívoca ya emitida por el Academic Decision Engine.

Variante real: todavía sin siguiente Action

+--------------------------------------+
| <- AVANCE · ANALISIS II · UNIDAD 3   |
+--------------------------------------+
| EVIDENCIA VALIDADA                   |
| Ejercicios 8–14 · validada 20:26     |
+--------------------------------------+
| CAMBIO CONFIRMADO                    |
| Practica · 12 -> 19 ejercicios       |
| Recencia · hoy                       |
+--------------------------------------+
| SIN CAMBIO CONFIRMADO                |
| Recorrido · conserva su estado       |
| Dominio · no evaluado                |
| Confianza · alta · declarada ayer    |
+--------------------------------------+
| QUE SIGUE                            |
| Todavia no hay una siguiente accion. |
| [          VOLVER A MATERIA        ] |
+--------------------------------------+
| -------- FIN ABOVE THE FOLD -------  |
| [ Ver Bitacora ]                     |
+--------------------------------------+

Los valores son ilustrativos. Sólo se muestran si el resultado autoritativo entrega dimensiones y valores comprensibles. Fuente: Evidence validada exige una relación causal confirmada; si falta, se usa Último cambio confirmado sin atribución. La segunda variante no afirma que el Engine esté calculando y no crea una recomendación.

16.6. Confianza alta + Dominio bajo demostrado

+--------------------------------------+
| <- PROGRESO · UNIDAD 3               |
| Integrales multiples                 |
+--------------------------------------+
| CONFIANZA DECLARADA                  |
| Alta · registrada ayer               |
+--------------------------------------+
| DOMINIO DEMOSTRADO · BAJO            |
| 2/7 correctos sin ayuda              |
| Evidencia del 20 ago                 |
+--------------------------------------+
| SON DOS SENALES DISTINTAS            |
| Tu confianza refleja como te sentis. |
| El dominio refleja la evidencia.     |
| Hoy todavia no coinciden.            |
| Esto orienta; no es una calificacion.|
+--------------------------------------+
| [       VER EVIDENCIA FUENTE       ] |
+--------------------------------------+

La vista no compara umbrales ni genera una Action. Sólo consume la brecha derivada por Student/Risk Model y un destino real a la Evidence fuente.

16.7. Evidence tardía + Commitment MISSED

A. ProgressUpdated con cambio limitado

+--------------------------------------+
| <- RESULTADO · ANALISIS II           |
+--------------------------------------+
| EVIDENCIA RECIBIDA DESPUES           |
| Enviada: 22 ago · 22:14              |
| Estado Evidence: VALIDATED           |
+--------------------------------------+
| COMPROMISO ORIGINAL                  |
| 22 ago · 19:00 · MISSED              |
| El incumplimiento no cambia.         |
+--------------------------------------+
| CAMBIO CONFIRMADO                    |
| Practica · 12 -> 19 ejercicios       |
+--------------------------------------+
| ESTADO CONSERVADO                    |
| Dominio · no evaluado                |
| No fue actualizado por esta Evidence.|
+--------------------------------------+
| QUE SIGUE                            |
| Todavia no hay una siguiente accion. |
| [          VOLVER A MATERIA        ] |
+--------------------------------------+
| [          VER BITACORA            ] |
+--------------------------------------+

B. Cambio todavía no confirmado

+--------------------------------------+
| <- RESULTADO · ANALISIS II           |
+--------------------------------------+
| EVIDENCIA RECIBIDA DESPUES           |
| Enviada: 22 ago · 22:14              |
| Estado Evidence: VALIDATED           |
+--------------------------------------+
| COMPROMISO ORIGINAL                  |
| 22 ago · 19:00 · MISSED              |
| El incumplimiento no cambia.         |
+--------------------------------------+
| PROGRESO                             |
| Todavia no hay un cambio confirmado. |
+--------------------------------------+
| QUE SIGUE                            |
| Podes ver la Evidence o volver a     |
| la materia.                          |
| [          VER EVIDENCIA           ] |
+--------------------------------------+

C. No-cambio explícito confirmado

+--------------------------------------+
| <- RESULTADO · ANALISIS II           |
+--------------------------------------+
| EVIDENCIA RECIBIDA DESPUES           |
| Enviada: 22 ago · 22:14              |
| Estado Evidence: VALIDATED           |
+--------------------------------------+
| COMPROMISO ORIGINAL                  |
| 22 ago · 19:00 · MISSED              |
| El incumplimiento no cambia.         |
+--------------------------------------+
| PROGRESO SIN CAMBIOS                 |
| El owner confirmo que no cambiaron   |
| las dimensiones visibles.            |
+--------------------------------------+
| QUE SIGUE                            |
| Todavia no hay una siguiente accion. |
| [          VOLVER A MATERIA        ] |
+--------------------------------------+

Esta variante sólo existe cuando el contrato de no-cambio explícito entrega ese resultado; la ausencia de ProgressUpdated no alcanza.

D. Progreso temporalmente no disponible

+--------------------------------------+
| <- RESULTADO · ANALISIS II           |
+--------------------------------------+
| EVIDENCIA RECIBIDA DESPUES           |
| Enviada: 22 ago · 22:14              |
| Estado Evidence: VALIDATED           |
+--------------------------------------+
| COMPROMISO ORIGINAL                  |
| 22 ago · 19:00 · MISSED              |
| El incumplimiento no cambia.         |
+--------------------------------------+
| PROGRESO NO DISPONIBLE               |
| No mostramos cero ni asumimos que    |
| no hubo cambios.                     |
+--------------------------------------+
| QUE SIGUE                            |
| Reintenta la lectura del progreso.    |
| [             REINTENTAR           ] |
+--------------------------------------+

Las cuatro variantes conservan los timestamps y lifecycles paralelos. Ninguna presenta cumplido tarde, modifica el Commitment original ni atribuye progreso por la tardanza. En A, CAMBIO CONFIRMADO contiene sólo Práctica porque es la única dimensión incluida en changed_dimensions; Dominio llega del owner como estado autoritativo conservado, queda fuera del bloque de cambio y se identifica explícitamente como no actualizado por esta Evidence. Ningún valor se deriva de la tardanza ni de VALIDATED. La variante A puede mostrar una siguiente Action únicamente si ya existe; el ejemplo resuelve honestamente su ausencia.

16.8. Progreso sin información suficiente

+--------------------------------------+
| <- PROGRESO · FISICA I               |
+--------------------------------------+
| INFORMACION PARCIAL                  |
| Recorrido · sin informacion suficiente|
| Practica · 6 problemas registrados   |
| Dominio · no evaluado                |
| Confianza · sin registro             |
| Recencia · hace 4 dias               |
+--------------------------------------+
| No completamos los datos faltantes   |
| con cero ni con una estimacion.       |
| [          VER MATERIA             ] |
+--------------------------------------+

16.9. Progreso sin cambios confirmados después de una actividad

+--------------------------------------+
| <- RESULTADO · PROGRAMACION I        |
+--------------------------------------+
| ACTIVIDAD REGISTRADA                 |
| Lectura de U4 · Evidence validada    |
+--------------------------------------+
| PROGRESO SIN CAMBIOS                 |
| El owner confirmo que esta actividad |
| no modifico las dimensiones visibles.|
| Recorrido, Practica, Dominio,        |
| Confianza y Recencia conservan estado|
+--------------------------------------+
| [          VER BITACORA            ] |
+--------------------------------------+

Esta variante requiere un outcome explícito de no-cambio. Sin ese contrato se usa Todavía no hay un cambio confirmado.

16.10. Mobile de Bitácora con provenance diversa

+--------------------------------------+
| <- BITACORA · ANALISIS II            |
| Ago–Nov 2026                         |
+--------------------------------------+
| 9 sesiones · 74 ejercicios          |
| 8 h 20 min · 6 evidencias · 1 rescate|
+--------------------------------------+
| Todo | Unidad | Examen | Hitos       |
+--------------------------------------+
| HOY · UNIDAD 3                       |
| Ejercicios 8–14 · Evidence VALIDATED |
| Practica: 12 -> 19 · Dominio no eval.|
| Enviada por vos · web                |
+--------------------------------------+
| 18 AGO · CLASE                       |
| Reportaste: comenzo Unidad 4         |
| Fuente: vos · pendiente corroboracion|
+--------------------------------------+
| 16 AGO · RESCATE                     |
| 3 ejercicios · 22 min · completado   |
| Original: MISSED · no modificado     |
+--------------------------------------+
| 12 AGO · CRONOGRAMA                  |
| Parcial 1 · 12 sep                   |
| Fuente oficial · official            |
+--------------------------------------+

***
17. WIREFRAME DESKTOP — PROGRESO + BITÁCORA

+--------------------------------------------------------------------------------------------------+
| <- ANALISIS MATEMATICO II                                  CURSADO                              |
+--------------------------------------------------------------------------------------------------+
| ULTIMO RESULTADO                                              | QUE SIGUE                         |
| Evidence validada · ejercicios 8–14 · Unidad 3                | Action ya emitida, si existe      |
| Practica: 12 -> 19 ejercicios                                 | [ VER SIGUIENTE ACCION ]          |
| Dominio: no evaluado                                          | o: Todavia no hay una accion      |
| [ Ver evidencia ]                                             | disponible                        |
+--------------------------------------------------------------------------------------------------+
| PROGRESO POR DIMENSIONES                                      | TRABAJO ACUMULADO                  |
| Recorrido  · 3 actividades                                    | 9 sesiones                         |
| Practica   · 19 ejercicios                                    | 74 ejercicios                      |
| Dominio    · no evaluado                                      | 8 h 20 min                         |
| Confianza  · alta · declarada ayer                            | 6 evidencias                       |
| Recencia   · hoy                                              | 1 rescate                          |
| [ Ver detalle de unidad ]                                     | No equivale a dominio              |
+--------------------------------------------------------------------------------------------------+
| BITACORA · Ago–Nov 2026                                                                           |
| Todo | Unidad | Examen | Hitos                                                                    |
+--------------------------------------------------------------------------------------------------+
| HOY · U3 · Action ejercicios 8–14                                                                |
| Commitment COMPLETED → Evidence SUBMITTED → VALIDATED → Practica +7                              |
| Enviada por vos · web · Dominio no evaluado                                                      |
+--------------------------------------------------------------------------------------------------+
| 18 AGO · Clase                                                                                   |
| Reportaste: comenzo U4 · source_type student · verification_status unverified                    |
+--------------------------------------------------------------------------------------------------+
| 16 AGO · Rescate                                                                                 |
| Rescate completado · original 15 ago 19:00 MISSED preservado                                    |
+--------------------------------------------------------------------------------------------------+

Reglas desktop

no se muestran todas las unidades en una matriz;
no existe score compuesto;
la siguiente Action sólo aparece si el Engine ya la emitió;
cada timeline card mantiene identidad y provenance;
los pasos del mismo ciclo se agrupan visualmente;
trabajo acumulado es factual y no arrastra Dominio.

***
18. ESTADOS VACÍOS, DESCONOCIDOS, PENDIENTES Y DE ERROR

18.1. Bitácora vacía

BITACORA TODAVIA VACIA
Tu trabajo registrado en esta materia va a aparecer aca.
[ Volver a la materia ]

No implica atraso, falta de estudio ni cero progreso.

18.2. Próximo destino todavía no disponible

TODAVIA NO HAY UNA SIGUIENTE ACCION DISPONIBLE
Tu resultado y tu progreso conservan el estado mostrado.
[ Volver a la materia ]

No se afirma que el Engine está calculando salvo proceso real observado.

18.3. Próximo destino disponible

SIGUIENTE ACCION DISPONIBLE
Análisis II · Unidad 3
Reforzar ejercicios de cambio de variables
[ Ver siguiente accion ]

Sólo aparece con Action/ActionRecommendation canónica y vigente. WF-S08 no la genera ni la redacta desde el progreso.

18.4. Progreso temporalmente no disponible

NO PUDIMOS CARGAR EL PROGRESO
Tu Evidence conserva su estado: VALIDATED.
No mostramos cero ni asumimos que no hubo cambios.
[ Reintentar ]

Reintentar ejecuta una lectura real.

18.5. Bitácora temporalmente no disponible

NO PUDIMOS CARGAR LA BITACORA
El estado de tu Evidence y tu progreso no cambia por este error.
[ Reintentar ]

18.6. Sección parcial

Cada dimensión falla de forma independiente:

Dato faltante	Fallback
Recorrido	Sin información suficiente
Práctica	hecho factual disponible o Sin información suficiente
Dominio	No evaluado sólo si ese es el estado real; si no carga, No disponible
Confianza	Sin registro o No disponible, según causa
Recencia	omitir fecha o No disponible
valor anterior	mostrar sólo actual
provenance requerida	no mostrar el dato como confirmado
verification_status	Estado de verificación no disponible; no elevarlo
siguiente Action	omitir CTA
	***
19. CONTRATOS DE DATOS Y OWNERSHIP

19.1. Clasificaciones

DOMAIN OWNED: entidad/campo/lifecycle aprobado.
DERIVED READ MODEL: composición de lectura; no entidad persistida nueva.
SOURCE CONTRACT PENDING: necesidad funcional existente cuyo campo, owner técnico, payload o semántica exacta no está cerrado.
UNSUPPORTED: conducta o dato prohibido.

19.2. Matriz de datos visibles

Dato visible	Fuente / entidad existente	Campo/propiedad existente	Estado/provenance/verification	Owner de escritura	Owner lectura/proyección	Condición para mostrar	Si falta
Evidence	Evidence	action_id, content, lifecycle_state, signals	lifecycle autoritativo; provenance según contrato	Evidence System/backend	WF-S08 read projection	Evidence canónica vigente o histórica	error; no inferir state
Action relacionada	Action	id, objective, verb, scope, status	identidad canónica	owner de Action	proyección	relación por action_id	bloquear atribución si ambigua
Commitment relacionado	Commitment	action_id, start_at, planned_minutes, state	lifecycle histórico	owner de Commitment	proyección	vínculo inequívoco	no afirmar puntual/tardía/rescate
MISSED original	Commitment	state + horario original	hecho histórico	owner de Commitment	proyección	Commitment autoritativo	omitir relación; no reescribir
Course/Topic	CourseEnrollment, Course, Topic	ids/labels	contexto académico	Academic Data/Domain	proyección	relación inequívoca	omitir Topic; bloquear si Action ambigua
Recorrido	TopicProgress	exposure	semántica propia	servicio propietario de progreso	Progreso/Materia	valor comprensible	Sin información suficiente
Práctica	TopicProgress	practice	semántica propia	servicio propietario de progreso	Progreso/Materia	valor comprensible	hecho factual o sin información
Dominio	TopicProgress	domain	señal demostrada/no evaluada	Evidence/Progress owner según contrato	Progreso/Materia	prueba aplicable y estado autoritativo	no evaluado o no disponible, según lectura
Confianza	TopicProgress / Reflection	confidence	autorreporte + fecha	estudiante/servicio propietario	Progreso/Materia	valor autoritativo	Sin registro
Recencia	eventos/ProgressEntry	última actividad útil	fecha/provenance	owners de eventos	proyección	semántica de actividad útil	omitir/no disponible
cambio confirmado	ProgressUpdated + Topic/CourseProgress	changed_dimensions aprobado como propiedad de evento; payload exacto pendiente	actor/timestamp/institución/objeto según Product Event Model	servicio propietario de progreso	WF-S08	evento + lectura consistente	mostrar pendiente, no no-cambio
valor anterior/actual	TopicProgress/ProgressEntry histórico	no cerrado	provenance temporal	progreso	proyección	snapshots autoritativos	mostrar sólo actual
efecto causal	Evidence/Action/ProgressEntry	relación exacta pendiente	provenance del cambio	progreso	proyección	vínculo confirmado	no usar por esta Evidence
ProgressEntry	ProgressEntry	derived event bundle / optional materialization	conserva fuentes de eventos	Plataforma/progreso	Bitácora/Materia	bundle reconstruible	historial parcial/error
actividad de clase	ClassSession / class_event_record	fields técnicos pendientes	source_type + context + verification_status	Academic Data Layer	Materia/Bitácora	dato vigente	mostrar último confirmado o desconocido
Reflection	Reflection	difficulty, confidence, actual_minutes, note	autoría/visibilidad	estudiante/owner	Bitácora si autorizado	existe y es visible	omitir
feedback humano	feedback vinculado	contrato pendiente	autoría, permisos	owner humano/operativo	Bitácora	objeto real autorizado	omitir
trabajo acumulado	agregación factual de eventos	course_accumulated_summary pendiente	deduplicado	Plataforma/progreso	Bitácora	resumen confirmado	omitir totales
próxima Action	ActionRecommendation + Action	reason, priority, generated_at, status	identidad vigente	Academic Decision Engine	WF-S08 consume	recomendación ya emitida	empty honesto
estado de materia/brecha	course_state_summary, course_gap_summary	contratos pendientes	owner derivado	Risk/progreso	Materia/WF-S08	lectura disponible	estado neutral
	19.3. Proyección funcional

ProgressAfterEvidenceView                  # DERIVED READ MODEL
  source_context                           # EVIDENCE | COMMITMENT | HOY | MATERIA | BITACORA
  academic_context
    course_enrollment
    course_label
    topic?
  action
    canonical_reference
    status
  commitment?
    canonical_reference
    state
    start_at?
    rescue_relation?                       # SOURCE CONTRACT PENDING
  evidence
    canonical_reference
    lifecycle_state
    submitted_at?                          # SOURCE CONTRACT PENDING
    submission_channel?                    # SOURCE CONTRACT PENDING
    uploaded_by?                           # SOURCE CONTRACT PENDING
    signals?
  progress_result?
    changed_dimensions[]?                  # from ProgressUpdated/read owner
    before_values?                         # SOURCE CONTRACT PENDING
    current_values?
    explicit_no_change?                    # SOURCE CONTRACT PENDING
    reason?                                # SOURCE CONTRACT PENDING
    causal_reference?                      # SOURCE CONTRACT PENDING
  dimensions
    exposure?
    practice?
    domain?
    confidence?
    recency?
  next_action?                             # existing ActionRecommendation/Action only
  destinations[]                           # existing objects only

La presencia, ausencia o error de lectura de progress_result se comunica mediante los estados técnicos ya definidos en la interfaz; no se crean códigos, states ni enums de dominio.

ProgressLogView                            # DERIVED READ MODEL
  course_enrollment
  period
  accumulated_summary?                    # SOURCE CONTRACT PENDING
  filters                                 # Todo | Unidad | Examen | Hitos
  entries[]                               # ProgressEntry / event bundle
    occurred_at
    action?
    commitment?
    evidence?
    topic?
    reflection?
    human_feedback?
    progress_impact?
    provenance[]
    destinations[]

No define SQL, endpoints, tablas ni entidades nuevas.

***
20. REGLAS DE PROVENANCE Y verification_status

20.1. Datos académicos discutibles

Todo dato discutible conserva:

value;
source_type;
source_ref;
observed_at;
vigencia;
term/offering;
confidence académica;
verification_status;
uploaded_by;
rights cuando corresponda.

20.2. Evidence y progreso

Evidence muestra actor, canal y timestamp sólo si existen contratos reales.
El método de validación se muestra sólo si está configurado.
signals.execution, signals.production y signals.domain conservan semántica y provenance propias.
La causa de un cambio de progreso sólo se atribuye a Evidence con relación confirmada.
Un ProgressUpdated no eleva por sí mismo el verification_status de un reporte académico.

20.3. ClassSession y reportes

source_type=student permanece Reportado por vos.
verification_status=unverified se muestra Pendiente de corroboración.
corroborated y official sólo se muestran si el owner los entrega.
el contexto durante la clase no convierte la fuente en cátedra;
una versión corroborada puede convivir con la provenance original sin borrar historia.

20.4. Fallback

Si un dato requiere provenance para no resultar engañoso y ésta falta:

usar copy neutral sin atribución;
mostrar Fuente/estado no disponible; o
omitir el dato si podría parecer confirmado.

***
21. CRITERIOS DE ACEPTACIÓN

21.1. Producto / Lead Product Owner

En menos de 10 segundos se entiende qué ocurrió, state de Evidence, cambio/pending y siguiente destino.
SUBMITTED, UNDER_REVIEW, SUFFICIENT, INSUFFICIENT y VALIDATED conservan semántica.
VALIDATED sin resultado de progreso no inventa impacto.
Sólo ProgressUpdated/lectura autoritativa habilita cambio confirmado.
Una dimensión no arrastra a las otras.
Actividad, progreso y dominio no se confunden.
MISSED permanece después de Evidence tardía.
Confianza y Dominio permanecen separados.
Bitácora no prioriza, valida ni reescribe.
Próxima Action sólo aparece si el Engine ya la emitió.

21.2. UX/UI

Mobile 360 px respeta qué ocurrió → estado → cambió → no cambió → sigue.
El estado principal no queda detrás de tab, tooltip o modal.
Pendiente, sin cambio confirmado, sin cambios confirmado y no disponible son distintos.
No evaluado no parece 0.
Los cinco ejes se leen por separado.
Confianza alta + Dominio bajo demostrado usa copy no punitivo.
Bitácora muestra provenance/verification junto al dato.
Los eventos del mismo ciclo no aparecen como múltiples avances.
Color no es la única señal.
Existe una sola CTA primaria por estado.

21.3. Backend / Progress owner

Devuelve lifecycle de Evidence sin reinterpretación frontend.
ProgressUpdated identifica CourseEnrollment/Topic y dimensiones cambiadas.
Devuelve semántica comprensible por dimensión.
Si se muestra comparación, provee snapshots anterior/actual.
Si se muestra causalidad, provee relación a Evidence/Action.
No emite cambio de Dominio sin señal aplicable.
No cambia Confianza sin autorreporte/contrato.
Distingue no-cambio explícito de ausencia de evento.
Deduplica/reconstruye ProgressEntry sin doble avance.

21.4. Evidence System

UNDER_REVIEW sólo existe con revisión real.
SUFFICIENT no se presenta como VALIDATED.
VALIDATED no implica dominio.
Evidence tardía conserva submitted_at y no cambia Commitment.
Multiple Evidence preserva originales.
Reviewer/feedback/SLA aparecen sólo si existen.

21.5. Materia / HOY / Academic Decision Engine

Materia y Bitácora consumen la misma historia.
Actividad reciente es preview, no segunda verdad.
HOY conserva precedencia operativa y no usa Bitácora para priorizar.
Academic Decision Engine mantiene ownership de próxima recomendación.
WF-S08 no genera ni ordena recomendaciones.

21.6. Eventos

WF-S08 no duplica EvidenceSubmitted ni EvidenceValidated.
Un cambio real usa ProgressUpdated.
No se inventan eventos para view, pending, no-change, Bitácora o error.
La agrupación visual no crea eventos ni entidades.

***
22. TEST DE COMPRENSIÓN DE 10 SEGUNDOS

La simulación usa el primer viewport de cada wireframe mobile. No sustituye test real con estudiantes.

22.1. Evidence SUBMITTED

Respuestas esperadas:

Se recibió Evidence de ejercicios 8–14.
State: SUBMITTED.
Progreso: todavía sin cambio confirmado.
No demuestra suficiencia ni dominio.
Siguiente: ver Evidence/esperar el método real.

Resultado simulado: PASS.

22.2. Evidence UNDER_REVIEW

Respuestas esperadas:

Existe una revisión real pendiente.
Todavía no hay progreso confirmado por este state.
Esta Evidence aún no aporta un nuevo resultado de Dominio.
UNDER_REVIEW no fija el valor actual de Dominio.
Siguiente: la revisión sólo puede resolver SUFFICIENT o INSUFFICIENT cuando el owner lo confirme; mientras tanto se puede ver Evidence.

Resultado simulado: PASS.

22.3. Evidence INSUFFICIENT / RESUBMISSION_REQUESTED

Respuestas esperadas:

INSUFFICIENT no confirma cambio de progreso ni juicio personal.
Sin RESUBMISSION_REQUESTED, el destino real es revisar el detalle; no existe otra presentación habilitada.
Con RESUBMISSION_REQUESTED, se puede preparar una nueva Evidence.
La Evidence anterior se conserva.

Resultado simulado: PASS.

22.4. Evidence SUFFICIENT

Respuestas esperadas:

Cumplió el criterio mínimo.
Todavía no existe cambio de progreso confirmado.
No implica Dominio.
Siguiente: el cierre sólo queda VALIDATED si lo confirma el owner aplicable; mientras tanto se puede ver Evidence.

Resultado simulado: PASS.

22.5. Evidence VALIDATED con cambio limitado

Respuestas esperadas:

Evidence quedó validada.
Cambió Práctica y Recencia.
Dominio conserva el valor autoritativo no evaluado de este ejemplo; no se deriva de VALIDATED.
Confianza conserva su autorreporte.
Con siguiente Action canónica, puede abrirla; sin ella, vuelve a Materia sin promesa de cálculo.

Resultado simulado: PASS.

22.6. Confianza alta + Dominio bajo demostrado

Respuestas esperadas:

Confianza declarada: alta.
Dominio demostrado: bajo según Evidence concreta.
Son señales distintas.
No es una calificación personal.
La pantalla no genera una Action.

Resultado simulado: PASS.

22.7. Evidence tardía + MISSED

Respuestas esperadas:

Evidence fue recibida después.
Commitment original sigue MISSED.
El estado de Evidence puede continuar.
Progreso queda inequívocamente en una de cuatro variantes reales: cambio limitado, todavía no confirmado, no-cambio explícito o temporalmente no disponible.
En A, sólo Práctica aparece dentro de CAMBIO CONFIRMADO.
Dominio aparece fuera de ese bloque como estado autoritativo conservado y explícitamente no actualizado por esta Evidence.
Cada variante muestra un siguiente destino real y ninguna contiene placeholders.

Repetición focalizada v0.3 sobre el primer viewport 360 px: PASS. Se reconoce inmediatamente que cambió Práctica y que Dominio no fue actualizado.

22.8. Datos no disponibles

Respuestas esperadas:

La lectura de progreso falló.
Evidence conserva su state.
No se muestra cero.
Reintentar vuelve a leer.

Resultado simulado: PASS.

22.9. Bitácora con fuentes distintas

Respuestas esperadas:

Identifica cuál entrada es Evidence, reporte de clase, rescate y cronograma.
El reporte de clase fue del alumno y está pendiente de corroboración.
La fecha de examen tiene fuente oficial.
El rescate no borró el MISSED.
Sólo el cambio confirmado se presenta como progreso.

Resultado simulado: PASS WITH DENSITY RISK.

Riesgo reversible: validar en dispositivo real el largo de los labels de provenance sin ocultar source ni verification status.

22.10. Cobertura de los quince estados críticos

Estado obligatorio	Representación	Comprensión simulada
Evidence SUBMITTED	§16.1	PASS
Evidence UNDER_REVIEW	§16.2	PASS
Evidence INSUFFICIENT	§16.3	PASS
Evidence SUFFICIENT	§16.4	PASS
Evidence VALIDATED	§16.5	PASS
Evidence tardía + Commitment MISSED	§16.7 A–D	PASS — en A, Práctica cambia y Dominio se conserva fuera del bloque de cambio
Progreso sin información suficiente	§16.8	PASS
Progreso sin cambios después de actividad	§16.9	PASS CON SOURCE CONTRACT PENDING
Cambio permitido en una dimensión, no en las demás	§16.5	PASS
Confianza alta + Dominio bajo demostrado	§16.6	PASS
Bitácora vacía	§18.1	PASS
Bitácora con distintas procedencias	§16.10	PASS WITH DENSITY RISK
Datos temporalmente no disponibles	§§16.7.D y 18.4–18.5	PASS
Próximo destino disponible	§§16.3 RESUBMISSION_REQUESTED, 16.5 primera variante y 18.3	PASS
Próximo destino no disponible	§§16.3 INSUFFICIENT, 16.5 segunda variante y 18.2	PASS
	Resultado global

8 PASS.
1 PASS WITH DENSITY RISK.
0 FAIL.

El test real de 10 segundos en 360 px es gate antes de UI high-fi.

***
23. CASOS LÍMITE

Caso	Resolución
VALIDATED llega antes que la lectura de progreso	mostrar validación + todavía sin cambio confirmado
ProgressUpdated llega antes de refrescar Evidence	reconciliar lecturas; no mostrar combinación incompatible como definitiva
varias Evidence para una Action	lista/agrupación conserva cada identidad; impacto sólo con relación confirmada
una Evidence cambia Práctica pero no Dominio	mostrar cambio limitado y Dominio no evaluado/bajo según state real
Evidence de prueba de dominio	Dominio cambia sólo si la señal y ProgressUpdated lo confirman
Reflection cambia Confianza	mostrar nueva Confianza sólo con autorreporte confirmado y fecha
Confidence alta + Domain no evaluado	no convertir en Domain bajo
Confidence alta + Domain bajo	mostrar brecha derivada, no comparar localmente
Evidence INSUFFICIENT con ejecución registrada	conservar ejecución como hecho; no inferir progreso/dominio
RESUBMISSION_REQUESTED	anterior se conserva; CTA a nueva presentación real
Evidence tardía tras MISSED	Commitment permanece MISSED; Evidence usa su lifecycle
rescate con Evidence	vincular sólo con rescue_relation; no atribuir al original
Action reemplazada	historial visible; no trasladar impacto a reemplazante
ClassSession reportada y luego corroborada	conservar provenance original + state vigente; no duplicar como dos avances
varios eventos en segundos	ordenar por timestamps autoritativos y agrupar por bundle, no reloj cliente
ProgressUpdated duplicado/reintentado	deduplicación propietaria; una sola representación de impacto
valor anterior faltante	mostrar sólo valor actual
fuente caída	section error; otras secciones siguen útiles
Bitácora carga, progreso no	historial visible; progreso marcado no disponible
progreso carga, Bitácora no	resultado visible; historial con error independiente
no existe próxima Action	empty honesto; no afirmar cálculo
múltiples recomendaciones sin principal	no rankear; no mostrar CTA académica
	***
24. RIESGOS

Riesgo	Falla posible	Guardarraíl
Validación parece dominio	alumno interpreta VALIDATED como aprendizaje demostrado	copy explícito + Domain separado
ausencia parece no-cambio	falta ProgressUpdated y UI dice no cambió	usar todavía sin cambio confirmado
actividad parece progreso	Bitácora celebra cada evento como avance	impacto sólo con resultado confirmado
doble conteo	submission, validation y progress son tres tarjetas	agrupar por ciclo/event bundle
métrica falsa	promediar cinco dimensiones	prohibido score compuesto
falsa precisión	porcentaje de dominio sin source	hechos/semánticas existentes o no evaluado
provenance invisible	reporte del alumno parece cátedra	source + verification junto al dato
borrado histórico	Evidence tardía maquilla MISSED	estados paralelos visibles
castigo	INSUFFICIENT se lee como fracaso	criterio concreto + copy neutral
humano inventado	UNDER_REVIEW promete persona/plazo	reviewer/SLA sólo con objeto real
Bitácora se vuelve Engine	timeline recomienda o valida	sólo registra/proyecta
siguiente acción local	progreso genera CTA no emitida por Engine	exigir identidad canónica vigente
error como cero	servicio caído muestra 0	estado técnico separado
densidad mobile	provenance ocupa el viewport	copy compacto sin eliminar semántica
	***
25. SOURCE CONTRACT PENDING

25.1. Bloqueantes para implementación fiel

Contrato	Necesidad mínima	Fallback
payload de ProgressUpdated	CourseEnrollment/Topic, changed_dimensions, valores comprensibles y timestamp	mostrar validación sin impacto
snapshots anterior/actual	comparación causal sin reconstrucción frontend	mostrar sólo actual
causalidad Evidence/Action → Progress	atribuir el cambio a esta Evidence	Último cambio confirmado sin causa
outcome explícito de no-cambio	distinguir no-cambio de ausencia de evento	Todavía sin cambio confirmado
razón de no-cambio	explicación comprensible	omitir razón
semántica de TopicProgress	labels/valores por Recorrido, Práctica, Dominio, Confianza y Recencia	hecho factual o dato no disponible
semántica de Evidence.signals	ejecución/producción/dominio + provenance	no inferir desde lifecycle
ProgressEntry/event bundle	correlación, orden, materialización opcional y reconstrucción	historial parcial sin agrupar causalmente
deduplicación	evitar doble impacto por reintentos/eventos cercanos	no mostrar acumulados/impacto dudoso
relación Evidence–Commitment	tardanza/original/rescate	no afirmar puntual/tardía/rescate
rescue_relation	vincular rescate real y MISSED original	preservar MISSED; omitir vínculo
acumulado de materia	sesiones, tiempo, producción, Evidence, rescates deduplicados	omitir resumen
provenance del cambio	actor, source, verification y vigencia	no presentar dato discutible como confirmado
disponibilidad de próxima Action	Action/Recommendation vigente e inequívoca	empty honesto
	25.2. Contratos heredados aún pendientes

expected_evidence;
completion_criterion;
sufficiency_criterion;
validation_method;
reviewer/assignment/SLA;
idempotencia y reconciliación de Evidence;
submitted_at, channel y uploaded_by;
course_state_summary y course_gap_summary;
last_meaningful_activity_at;
class_event_record;
visibility/permissions de Reflection y feedback;
sync Plataforma–CRM, sin afectar la verdad académica de Plataforma.

25.3. No bloqueantes para wireframe

iconografía exacta por dimensión;
forma gráfica de comparación anterior/actual;
expansión inline o pantalla para tarjeta agrupada;
proporción de columnas desktop;
truncamiento de provenance en 360 px;
si los filtros usan tabs o chips;
ubicación exacta de Ver materia y Ver evidencia;
animación de reconocimiento, si alguna vez existe, sin crear gamificación.

***
26. CHANGE REQUESTS

Ninguno.

No se detectó una contradicción que requiera modificar Product Spec, User Flow/Data Model, HOY, Materia, Próxima Acción, Compromiso, Evidencia, Academic Decision Engine, entidades, eventos o navegación.

La tensión aparente entre:

EvidenceValidated como entrada a WF-S08; y
la prohibición de actualizar progreso prematuramente;

se resuelve sin cambio estructural: VALIDATED habilita la vista, pero el impacto dimensional sólo se presenta con ProgressUpdated/lectura autoritativa. Si ese resultado falta, WF-S08 muestra el estado de Evidence y la ausencia de cambio confirmado sin inventar progreso.

***
27. TRAZABILIDAD CONTRA CADA FUNCTIONAL SPEC APROBADO

Fuente aprobada	Decisión preservada	Aplicación en UX06
Product Spec v0.5	Evidence System separa ejecución, producción y dominio; avance no pasa desapercibido; percepción no equivale a dominio; provenance siempre	resultado visible de Evidence; impacto sólo confirmado; brecha Confidence–Domain explícita; sin score falso
User Flow/Data Model v0.2	WF-S08, ProgressEntry, cinco dimensiones, Bitácora privada, ProgressUpdated, Action/Evidence 1:N	Progreso + Bitácora consumen entidades/eventos existentes; no se crea dominio nuevo
HOY v1.0	TodayView es read projection; Academic Decision Engine prioriza; Evidence validada puede abrir Ver avance; no outcomes anticipados	WF-S08 no prioriza ni genera Action; sólo abre destino canónico y real
Materia/Cursado v1.0	Action > Information; cinco dimensiones; Actividad reciente como preview; provenance completa; Bitácora privada; gap Confidence–Domain	jerarquía mobile, dimensiones separadas, misma historia, provenance visible y estado crítico 360 px
Próxima Acción v1.0	Action canónica, misma identidad, reason/provenance, sin alternativas locales	cada resultado conserva Action original; siguiente Action sólo si ya fue emitida
Compromiso v1.0	Commitment y Evidence separados; COMPLETED no implica Evidence/dominio; MISSED y rescate preservados	Evidence tardía no modifica original; Bitácora muestra original y rescate como hechos distintos
Evidencia v1.0	lifecycle exacto; ProgressUpdated fuera de WF-S07; VALIDATED no implica dominio; revisión humana condicional; múltiples Evidence y tardanza	matriz por state, handoff real a WF-S08, impacto condicionado, sin reviewer/SLA inventado
	27.1. Self-audit final

Criterio	Resultado
Presentar Evidence no parece validación	PASS
UNDER_REVIEW no produce progreso	PASS
SUFFICIENT no se presenta como progreso/dominio	PASS
VALIDATED sin ProgressUpdated no inventa impacto	PASS
Confianza y Recencia sólo cambian con ProgressUpdated/lectura autoritativa	PASS
Reflection, actividad y lifecycle no actúan como triggers dimensionales	PASS
UNDER_REVIEW no determina ningún valor de Dominio	PASS
Cambios limitados por dimensión	PASS
Ningún valor conservado, pendiente o desconocido aparece dentro de CAMBIO CONFIRMADO	PASS
No-cambio y ausencia de datos diferenciados	PASS CON SOURCE CONTRACT PENDING
MISSED preservado con Evidence tardía	PASS
Bitácora no reescribe historia	PASS
Eventos cercanos no se presentan como avances independientes	PASS CON SOURCE CONTRACT PENDING
Provenance y verification_status preservados	PASS
Confianza no equivale a Dominio	PASS
Sin humano inventado	PASS
Sin Engines, entidades, eventos o estados nuevos	PASS
Sin Modo Examen	PASS
Qué sigue real visible en los estados mobile críticos	PASS
Evidence tardía + MISSED resuelta sin placeholders en cuatro variantes	PASS
Mobile crítico 360 px	PASS SIMULADO
Change Requests	0
	27.2. Trazabilidad breve de P0/P1 corregidos

La auditoría v0.1 registró 0 P0, 4 P1 y 0 P2. Este candidato conserva las cuatro correcciones y modifica únicamente el remanente de PROG-P1-04:

Finding	Corrección aplicada	Secciones verificables
PROG-P1-01	Se separó el registro factual de Reflection/actividad de cualquier cambio visible en las cinco dimensiones. Confianza y Recencia, igual que Recorrido, Práctica y Dominio, requieren ProgressUpdated o lectura autoritativa equivalente.	§§11, 22.1, 22.5, 27.1
PROG-P1-02	UNDER_REVIEW dejó de declarar un valor de Dominio; sólo informa que esta Evidence aún no aporta un resultado nuevo.	§§16.2, 22.2, 27.1
PROG-P1-03	Se hizo visible Qué sigue con evento y destino reales para UNDER_REVIEW, INSUFFICIENT/RESUBMISSION_REQUESTED, SUFFICIENT y las dos variantes de VALIDATED.	§§16.2–16.5, 22.2–22.5, 22.10
PROG-P1-04	Evidence tardía + MISSED quedó resuelta en cuatro variantes explícitas. En v0.3, la variante A deja sólo Práctica dentro de CAMBIO CONFIRMADO y separa Dominio como estado autoritativo conservado y no actualizado. Todas las variantes preservan el MISSED original.	§§16.7, 22.7, 22.10, 27.1
	No se incorporaron P2, rediseños ni cambios de alcance. Se preservan entidades, eventos, Engines, roles, estados, navegación y contratos existentes.

27.3. Trazabilidad de la corrección residual de v0.2

Finding residual	Corrección mínima aplicada	Criterio de cierre	Resultado simulado
REG-P1-01, originado en PROG-P1-04	Se retiró Dominio · no evaluado de CAMBIO CONFIRMADO y se lo ubicó en ESTADO CONSERVADO, con copy explícito No fue actualizado por esta Evidence.	Sólo las dimensiones incluidas en changed_dimensions aparecen como cambio; se distingue inmediatamente qué cambió y qué no.	PASS 360 px
	No se modificó ningún otro finding ni decisión aprobada en la reauditoría de v0.2.

Estado final

ACHIEVE_PROGRESO_BITACORA_FUNCTIONAL_WIREFRAME_v0.3_CANDIDATE.md queda:

READY FOR LEAD PRODUCT OWNER REAUDIT

No queda aprobado para UI high-fi hasta:

reaudit focalizado que confirme 0 P0, 0 P1 y ausencia de regresiones;
cierre técnico de los SOURCE CONTRACT PENDING bloqueantes;
prueba real de comprensión en 360 px;
verificación de deduplicación y causalidad Evidence–Progress–ProgressEntry;
freeze del contrato ProgressUpdated/TopicProgress/Bitácora en Architecture/API/Data Spec.


***

VI.7 — Activación de Modo Examen

ACHIEVE — ACTIVACIÓN DE MODO EXAMEN

FUNCTIONAL WIREFRAME v0.2 CANDIDATE

Sprint: UX07 — Activación de Modo Examen  
Wireframe canónico: WF-S09 — Activación de Modo Examen  
Fecha: 24 de agosto de 2026  
Estado: candidate de corrección controlada para reauditoría de Lead Product Owner  
Destino posterior canónico: WF-S10 — Modo Examen / overview, sin diseñarlo en este sprint

Baseline de corrección: ACHIEVE_ACTIVACION_MODO_EXAMEN_PRODUCT_OWNER_AUDIT_v0.1.md  
Findings aplicados exclusivamente: UX07-PO-P1-01, UX07-PO-P1-02 y UX07-PO-P1-03  
P0 abiertos en la auditoría: 0

***
1. RESUMEN EJECUTIVO

WF-S09 transforma una Assessment concreta, perteneciente a un CourseOffering y al contexto persistente de un CourseEnrollment, en una ExamPreparation del estudiante. La activación no reemplaza la materia, no modifica el progreso de Cursado y no equivale a preparación, dominio, READY_BY_PROTOCOL, Action, Commitment ni Evidence.

La experiencia implementable se resuelve con dos entradas:

Recomendación automática: una señal propietaria ya emitida presenta una oportunidad RECOMMENDED para una evaluación inequívoca. La vista explica la aparición sólo con la razón recibida; no calcula elegibilidad ni prioridad. Todavía no existe ACTIVE.
Entrada manual contextual: el estudiante llega desde Materia/Cursado con un CourseEnrollment de origen inmutable y una Assessment existente de esa materia. Puede elegir entre Assessments del mismo contexto cuando la fuente aprobada las entrega; no existe selector transversal de materias.

El contrato UX seguro y completamente trazable es:

Assessment inequívoca → revisión de datos mínimos → confirmación explícita → lectura autoritativa de ExamPreparation → ACTIVE → handoff limitado a WF-S10 o retorno a Cursado.

Para cerrar UX07-PO-P1-01 sin inventar owner, trigger ni contrato temporal, este candidate congela una única semántica funcional:

automático describe únicamente la aparición de ExamPreparation RECOMMENDED;
activar queda reservado al CTA confirmado por el estudiante que produce una lectura autoritativa ACTIVE;
recibir una ExamPreparation ACTIVE se trata como ya activa, sin atribuir localmente cómo se activó;
una auto-activación efectiva sin CTA no forma parte del baseline ni aparece como variante alternativa;
owner, trigger, ventana exacta de 14 días y payload de reason siguen SOURCE CONTRACT PENDING.

No se crea ningún Engine, entidad, estado, evento, enum, rol, score, notificación ni contrato técnico nuevo.

***
2. FUENTES Y VERSIONES LEÍDAS

Se leyeron completas y se utilizaron exclusivamente estas versiones aprobadas:

ACHIEVE_MVP_USUARIO_PRODUCT_SPEC_v0.5_FINAL.docx
ACHIEVE_USER_FLOW_WIREFRAMES_DATA_MODEL_v0.2_FINAL.docx
ACHIEVE_HOY_AUTOGESTION_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_PROXIMA_ACCION_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_COMPROMISO_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_EVIDENCIA_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_PROGRESO_BITACORA_FUNCTIONAL_SPEC_v1.0_APPROVED.md

Para el Product Spec se utilizó el archivo canónico sin sufijo (1). No se usaron candidates, auditorías ni wireframes preliminares como fuente de decisión.

***
3. IDENTIFICADOR CANÓNICO DEL WIREFRAME

El identificador solicitado coincide con las fuentes aprobadas:

> WF-S09 — Activación de Modo Examen

El Design Spec lo incluye con ese nombre tanto en su wireframe low-fi como en el orden de handoff a diseño. No existe discrepancia que requiera renumeración ni trazabilidad adicional.

El destino siguiente se identifica como:

> WF-S10 — Modo Examen / overview

Este documento sólo define el handoff. No resuelve contenido, fases, hitos ni acciones internas de WF-S10.

***
4. JTBD

Cuando se acerca una evaluación o el estudiante decide empezar a prepararla, necesita activar un contexto específico de examen sin perder el contexto persistente de la materia ni configurar más información de la necesaria.

En menos de 10 segundos debe poder responder:

¿Qué examen estoy activando?
¿De qué materia es?
¿Cuándo y bajo qué modalidad rindo?
¿Por qué apareció esta activación?
¿Ya está activo o todavía debo confirmarlo?
¿Qué ocurrirá después?

Outcome funcional: una ExamPreparation autoritativa asociada a una Assessment concreta y al estudiante, o una salida segura sin mutación cuando los datos no permiten confirmar la identidad o elegibilidad.

***
5. ALCANCE

Incluye exclusivamente:

presentación de una oportunidad de activación originada fuera de la UI;
identificación de Course/CourseOffering, Assessment, fecha y modalidad;
provenance, confianza y verification_status de datos discutibles;
selección manual de una Assessment existente dentro del CourseEnrollment de origen;
revisión previa y confirmación explícita;
activación sin aprobación humana;
prevención funcional de duplicados y reconciliación de intentos repetidos;
estados incompletos, desconocidos, disputados, pasados, ya activos y temporalmente no disponibles;
confirmación final de ExamPreparation ACTIVE;
continuidad de Materia/Cursado y handoff limitado a WF-S10.

***
6. FUERA DE ALCANCE

No se diseñan:

Overview completo de Modo Examen;
Exam Protocol, ProtocolStep o ProtocolArtifact;
baseline/Diagnostic;
mapa del examen;
plan de 72 horas o cronograma generado;
ActionRecommendation interna de examen;
Action, Commitment, Evidence o Reflection de examen;
ErrorMap, Simulation o PreparationReadiness;
READY_BY_PROTOCOL, NOT_READY, Ready to Sit o predicción de aprobación;
práctica, autocorrección, evidencia, simulacro, cierre, rendida o postmortem;
intervención, aprobación o validación humana para comenzar;
CRM, operador, dashboard institucional o analytics nuevos;
notificaciones, alertas, gamificación o scoring;
edición, eliminación o cancelación de Assessment no respaldada;
protocolo oral u otras modalidades P1.

Una preview del destino posterior se limita a: nombre de la preparación, estado ACTIVE, mensaje de continuidad y CTA de navegación.

***
7. DECISIONES CONGELADAS

CourseEnrollment y Materia/Cursado son persistentes.
Cada ExamPreparation corresponde a una Assessment concreta.
Una materia puede tener múltiples evaluaciones y preparaciones históricas.
Assessment → ExamPreparation y CourseEnrollment → ExamPreparation están respaldadas en el modelo.
ExamPreparation posee como campos mínimos assessment_id, student_id, activated_at y status.
Su lifecycle aprobado es RECOMMENDED → ACTIVE → BUILDING → READY_BY_PROTOCOL → EXAM_TAKEN → CLOSED, con ramas NOT_READY / BLOCKED y posible ABANDONED. UX07 sólo produce o lee RECOMMENDED y ACTIVE.
READY_BY_PROTOCOL no equivale a aprobación garantizada.
La activación manual puede ocurrir antes del default temporal.
El default UX documentado es 14 días y no una regla pedagógica rígida. En este candidate, una señal default ya emitida sólo presenta RECOMMENDED; la UI no calcula la ventana.
El Academic Decision Engine puede recomendar activación anticipada; la vista no hace ese cálculo.
Academic Decision Engine conserva prioridad académica y ActionRecommendations.
TodayView es una read projection y sólo aplica precedencia operativa de lifecycle.
Assessment es la entidad técnica canónica para “evaluación”.
CourseOffering es el dictado concreto de Course por período/cátedra y aporta commission e instructor.
Assessment dispone conceptualmente de id, offering_id, type, date, modality y scope.
Los metadatos académicos aprobados incluyen source_type, source_ref, observed_at, valid_from, valid_until, term/offering, confidence, verification_status y uploaded_by.
verification_status aprobado: unverified, corroborated, official, disputed.
Modalidades P0: práctico y teórico escrito. Oral y demás modalidades son P1.
Los eventos existentes relevantes son ExamPreparationRecommended y ExamPreparationActivated.
Plataforma es fuente de verdad de materias, evaluaciones y ExamPreparation. El owner técnico concreto de escritura no está congelado.

***
8. DIFERENCIA ENTRE ACTIVACIÓN Y MODO EXAMEN

Concepto	Qué significa	Qué no significa
Assessment	evaluación académica concreta de un CourseOffering	preparación personal del alumno
ExamPreparation RECOMMENDED	existe una oportunidad/recomendación de activar	preparación activa
Activar	crear o confirmar la instancia personal y obtener ACTIVE de la fuente autoritativa	empezar una Action, estudiar o comprometer horario
ExamPreparation ACTIVE	existe un contexto de preparación asociado a esa Assessment y estudiante	BUILDING, diagnóstico completo, dominio o readiness
WF-S10	destino que podrá mostrar el contexto de examen	parte resuelta por UX07
Materia/Cursado	contexto persistente del semestre	estado reemplazado por Examen
	Copy obligatorio:

> “Activar crea el contexto de preparación para esta evaluación. No cambia tu progreso de Cursado ni significa que ya estés preparado.”

Copy prohibido:

Ya estás preparado;
Empezar a estudiar cuando sólo se activa;
Examen aprobado/probable;
Tu dominio está listo;
Se creó tu plan;
Tu compromiso quedó creado.

***
9. ENTRADAS AUTOMÁTICAS Y MANUALES

9.1. Recomendación automática soportada

La pantalla recibe una Assessment concreta y una señal/recomendación ya resuelta. Puede abrirse desde:

el acceso EXAMEN · {nombre} de Materia/Cursado cuando existe Assessment relevante sin ExamPreparation activa;
una proyección de Hoy que consuma una señal ya determinada, sin reordenar prioridad;
otra superficie existente que entregue la identidad canónica, si queda respaldada por navegación aprobada.

La UI no calcula los 14 días. Sólo muestra la razón si el owner entrega una condición de elegibilidad y una fecha utilizada consistente.

Resultado único: RECOMMENDED visible; el estudiante todavía debe confirmar Activar preparación de este examen. La palabra activación no describe la aparición de esta pantalla.

9.2. Lectura de una preparación ya activa

Si WF-S09 recibe una ExamPreparation autoritativa ACTIVE, la trata exclusivamente como una preparación ya existente:

muestra MODO EXAMEN ACTIVO;
ofrece ABRIR PREPARACIÓN y retorno a Cursado;
no ofrece ni reemite activación;
no infiere ni muestra Se activó automáticamente;
no usa ese estado como segunda semántica de la recomendación automática.

> “Modo Examen está activo para esta evaluación.”

El origen histórico de esa activación se omite mientras no exista metadata autoritativa; no bloquea la lectura de ACTIVE ni reabre una variante auto-activa.

9.3. Entrada manual con Assessment existente

Entrada autorizada principal:

Materia/Cursado muestra EXAMEN · {Assessment}.
El estudiante abre el contexto.
WF-S09 conserva un CourseEnrollment de origen inmutable.
Si hay varias evaluaciones existentes de ese mismo CourseEnrollment, exige selección explícita.
Muestra revisión final.
Sólo el CTA final solicita activación.

9.4. Assessment no registrada — necesidad contractual fuera del baseline

El Golden Path aprobado menciona ASSESSMENT EXISTENTE / NUEVO; por lo tanto el modelo admite el caso conceptual. No están congelados:

el punto de entrada cuando Materia oculta EXAMEN por no existir Assessment relevante;
la operación de alta/corrección;
el owner técnico;
el evento de registro;
la deduplicación contra fuentes que aparezcan después.

La necesidad queda documentada como SOURCE CONTRACT PENDING, pero no como recorrido, formulario, CTA ni wireframe implementable. No se agrega botón global, selector de materia, navegación transversal ni operación de alta en este candidate.

9.5. Separación conceptual registrar vs. activar

Cuando la evaluación no existe, el flujo debe mostrar dos resultados distintos:

EVALUACIÓN REGISTRADA — existe/queda resuelta una Assessment con provenance preservada; todavía no hay ExamPreparation activa.
PREPARACIÓN ACTIVADA — la fuente autoritativa devuelve ExamPreparation ACTIVE para esa Assessment.

El éxito del primer paso nunca podría disparar silenciosamente el segundo. Mientras SCP-09/SCP-10 estén abiertos, el primer paso no se ofrece en UX07 y el baseline comienza siempre con una Assessment existente.

***
10. ARQUITECTURA DE INFORMACIÓN

Orden funcional común:

retorno seguro;
estado de activación: RECOMENDADA, TODAVÍA NO ACTIVA, ACTIVA o estado de conflicto;
Course + Assessment;
fecha;
modalidad;
CourseOffering/cátedra cuando evita ambigüedad;
provenance y verification_status junto al dato discutible;
razón de aparición ya provista por el owner;
qué produce la acción;
CTA primaria semánticamente exacta;
qué ocurrirá inmediatamente después;
retorno a Materia/Cursado.

La pantalla no contiene progreso, unidades objetivo, horas estimadas, disponibilidad, simulaciones, fases ni riesgos salvo que sean parte literal de una razón propietaria ya emitida. Incluso entonces, UX07 no los usa para decidir elegibilidad.

***
11. MODELO MENTAL DEL ESTUDIANTE

La secuencia comprensible es:

> “Tengo una evaluación concreta de una materia. Achieve me muestra los datos que conoce y su fuente. Al activar, abre un espacio de preparación para esa evaluación. Mi materia y todo lo hecho durante el cursado siguen existiendo. Después voy al contexto del examen; todavía no empecé una tarea ni demostré estar preparado.”

Preguntas y respuesta visible:

Pregunta mental	Respuesta de WF-S09
¿Para cuál examen?	Assessment label/type inequívoco
¿De qué materia?	Course + CourseOffering cuando hace falta
¿Cuándo rindo?	Assessment.date o Fecha desconocida
¿Cómo rindo?	práctico / teórico escrito / desconocido / fuera de P0
¿De dónde salió el dato?	source + verification_status junto al dato
¿Por qué aparece?	reason de la señal, no cálculo de la vista
¿Está activo?	TODAVÍA NO ACTIVO o ACTIVO
¿Qué hace el botón?	registra datos, revisa o activa; nunca copy genérico
¿Qué sigue?	WF-S10 si está disponible, sin prometer contenido
¿Pierdo Cursado?	no; retorno permanente a Materia/Cursado
	***
12. FLUJO DE RECOMENDACIÓN AUTOMÁTICA

12.1. Baseline único implementable: RECOMMENDED → CTA → ACTIVE

[Owner determina señal para Assessment]
                  |
                  v
[WF-S09 recibe Assessment + señal + provenance]
                  |
                  v
        ¿Identidad inequívoca?
           /              \
         no                sí
         |                 |
[conflicto / elegir]  [mostrar revisión]
                           |
                           v
                 ¿datos mínimos utilizables
                  y elegibilidad provista?
                     /             \
                   no               sí
                   |                |
          [completar/revisar]  [CTA ACTIVAR]
                                      |
                                      v
                         [mutación propietaria]
                                      |
                                      v
                       ¿lectura autoritativa ACTIVE?
                           /                  \
                         no                    sí
                         |                     |
                 [reconciliar/error]   [confirmación + handoff]

12.2. Señal, owner y consecuencia

Variante	Señal existente	Owner permitido	Consecuencia en UX07
Default temporal	recomendación asociada a Assessment dentro del default de 14 días	SOURCE CONTRACT PENDING: las fuentes no asignan el owner exacto	mostrar RECOMMENDED; no calcular ni activar localmente
Activación anticipada	recomendación de comenzar antes	Academic Decision Engine	mostrar Assessment y razón recibida; no recalcular carga/disponibilidad
Ya activa	ExamPreparation autoritativa ACTIVE	Plataforma / owner de ExamPreparation	mostrar estado activo y abrir/volver; no reactivar
TodayView	read projection de señal ya determinada	TodayView sólo lee	puede abrir WF-S09; no elige evaluación ni prioridad
	12.3. Fecha, timezone y elegibilidad

La vista consume:

Assessment.date;
Student.timezone cuando una comparación temporal o cuenta regresiva la requiere;
provenance y verification_status de la fecha;
condición de elegibilidad ya resuelta por el owner.

Reglas:

Una fecha oficial/corroborada puede mostrarse con su estado real.
Una fecha reportada o estimada nunca se presenta como fecha oficial.
La cuenta regresiva sólo aparece si fecha y timezone permiten una lectura inequívoca.
La UI no decide si 14 días incluye el día del examen, usa días calendario o bloques de 24 horas.
Si cambia la fecha, se relee elegibilidad y se preserva historia/provenance; la pantalla no mantiene una cuenta vieja.
Si ExamPreparation ya está ACTIVE, un cambio de fecha no crea otra preparación.

La semántica exacta de fecha de corte y timezone queda SOURCE CONTRACT PENDING.

12.4. Límite del baseline

UX07 no contiene una variante auto-activa. ACTIVE sólo aparece como:

resultado autoritativo posterior al CTA del estudiante; o
lectura de una preparación ya existente, cuyo origen histórico no se infiere.

Para una misma entrada RECOMMENDED, tabla, flujo, copy y evento producen siempre el mismo resultado: todavía no está activa hasta la confirmación del estudiante.

***
13. FLUJO MANUAL

13.1. Assessment existente

[Materia/Cursado]
       |
       v
[EXAMEN · Assessment / contexto autorizado]
       |
       v
[seleccionar Assessment si hay más de una]
       |
       v
[revisar Course + Assessment + fecha + modalidad + provenance]
       |
       v
¿ya existe ExamPreparation para student + Assessment?
       /                                      \
     sí                                        no
     |                                         |
[abrir existente]                    [confirmar activación]
                                               |
                                               v
                                  [lectura autoritativa ACTIVE]
                                               |
                                               v
                                [WF-S10 o retorno a Cursado]

13.2. Assessment no registrada — no implementable

Mientras SCP-09 y SCP-10 permanezcan abiertos:

UX07 no ofrece alta de Assessment;
no existe formulario, CTA, selector de CourseEnrollment ni navegación global;
el estudiante permanece en el CourseEnrollment de origen y recibe No encontramos una evaluación registrada para esta materia;
el único fallback es volver a Materia/Cursado;
la necesidad futura conserva la separación conceptual registrar ≠ activar, pero no se presenta como capacidad disponible.

El modelo conceptual admite ASSESSMENT EXISTENTE / NUEVO; no autoriza por sí mismo una operación de alta. Assessment.scope, entrada, owner, mutación y deduplicación continúan SOURCE CONTRACT PENDING sin representación accionable.

13.3. Corrección antes de confirmar

Cambiar evaluación vuelve a selección sin mutar.
Corregir información sólo puede aparecer si una operación propietaria aprobada ya está disponible; no forma parte del baseline actual.
Una corrección de fecha/modalidad no sobrescribe la fuente previa; se versiona o queda como reporte según contrato.
Si la operación de corrección no existe, se impide activar con identidad contradictoria y se ofrece únicamente volver al CourseEnrollment de origen.

13.4. Sin aprobación humana

Ningún paso usa:

Solicitar aprobación;
Esperar a un operador;
Un tutor revisará si podés comenzar.

La revisión humana del Exam Protocol pertenece a etapas posteriores y no condiciona ACTIVE.

***
14. VALIDACIÓN MÍNIMA

14.1. Checklist antes de solicitar activación

Dato/condición	Validación funcional	Si falta o es ambiguo
Student	identidad actual disponible	error técnico; no activar
CourseEnrollment	materia personal inequívoca	volver a selección/contexto
CourseOffering	dictado/cátedra correcto cuando aplica	desambiguar; no adivinar
Assessment	assessment_id autoritativo	registrar/seleccionar; no activar globalmente
Evaluación visible	label/type comprensible	pedir identificación mínima
Fecha	valor real o estado explícito	Fecha desconocida; no countdown
Modalidad	práctico o teórico escrito	desconocida: completar; P1: no continuar en P0
Provenance	source y vigencia cuando corresponde	no presentar como confirmada
verification_status	valor devuelto por owner	Estado de verificación no disponible; no elevar
Elegibilidad	respuesta propietaria	CTA no activa si la UI tendría que decidir
Duplicado	lectura por student + Assessment	abrir existente o conflicto; no crear otra
	14.2. Fecha desconocida

La identidad de la evaluación puede existir sin fecha visible, pero el criterio mínimo solicitado para activar exige fecha. Resultado:

> FECHA DESCONOCIDA · Todavía no podemos confirmar esta activación.

El baseline ofrece sólo retorno seguro. INFORMAR FECHA no aparece mientras la operación propietaria siga pendiente. Nunca se inventa una estimación.

14.3. Fecha estimada o sin verificar

Una fecha estimada/reportada es un valor, no un hecho oficial. Puede mostrarse así:

> 28 ago · estimada  
> Fuente: inferencia · sin verificar

La posibilidad de activar usando esa fecha depende de una elegibilidad autoritativa no definida. Dos variantes legítimas:

owner devuelve elegible: ACTIVAR CON ESTA FECHA ESTIMADA, conservando provenance;
owner no devuelve elegibilidad: se omite el CTA de activación y se vuelve a la materia; no se ofrece corrección pendiente.

La pantalla no elige entre variantes.

14.4. Modalidad desconocida

> MODALIDAD DESCONOCIDA · Todavía no sabemos cómo se toma esta evaluación.

Las únicas modalidades P0 conceptualmente válidas son:

Práctico;
Teórico escrito.

El baseline no ofrece una acción de registro/reporte mientras la mutación siga pendiente. Si una lectura futura devuelve oral u otra modalidad, se usa el estado fuera de alcance; no se fuerza a una modalidad P0.

***
15. ESTADOS FUNCIONALES

UX07 consume únicamente estados existentes; no crea una máquina paralela de UI.

Estado de dominio/contexto	Estado visible	Acción permitida
Assessment elegible + sin ExamPreparation	TODAVÍA NO ACTIVO	activar con confirmación
ExamPreparation RECOMMENDED	RECOMENDACIÓN DE ACTIVACIÓN	revisar y activar
ExamPreparation ACTIVE	MODO EXAMEN ACTIVO	abrir preparación o volver
ExamPreparation posterior a ACTIVE	MODO EXAMEN ACTIVO + estado si ya lo provee el destino	abrir; UX07 no explica fases
Assessment incompleta	FALTAN DATOS	volver al CourseEnrollment; sin alta/corrección en baseline
fecha desconocida	FECHA DESCONOCIDA	volver; sin CTA de reporte
modalidad desconocida	MODALIDAD DESCONOCIDA	volver; sin selector/alta
provenance disputada	DATOS CONTRADICTORIOS	revisar/corregir; no elegir fuente localmente
Assessment ya pasada	EVALUACIÓN PASADA sólo con lectura temporal confiable	no crear nueva preparación desde UX07
datos no disponibles	NO PUDIMOS CARGAR LOS DATOS	reintentar lectura/volver
resultado incierto de activación	ESTAMOS VERIFICANDO SI QUEDÓ ACTIVA	reconciliar; no reactivar
	No se usan DRAFT, PENDING_ACTIVATION, DUPLICATE, CANCELLED_ASSESSMENT ni otros estados técnicos inventados. Los labels de UI describen una situación basada en entidades/lecturas existentes.

***
16. MATRIZ DE ESTADOS CRÍTICOS

#	Escenario obligatorio	Representación	CTA primaria	Efecto / fallback
1	Evaluación confirmada dentro de ventana de recomendación automática	Assessment + fecha oficial/corroborada + razón recibida + TODAVÍA NO ACTIVO	ACTIVAR PREPARACIÓN	solicita ACTIVE
2	Reportada por alumno dentro de ventana	Reportado por vos · sin verificar junto a cada dato afectado	ACTIVAR CON ESTOS DATOS sólo si owner la declara elegible	no eleva verification
3	Fecha estimada/sin verificar	label Estimada + source/status	activar sólo con elegibilidad autoritativa; si no, VOLVER A LA MATERIA	no trata como oficial ni ofrece corrección pendiente
4	Manual con Assessment existente	selección + revisión	ACTIVAR ESTA EVALUACIÓN	ACTIVE autoritativo
5	Manual sin Assessment registrada	necesidad no implementable; Assessment ausente en el CourseEnrollment de origen	VOLVER A LA MATERIA	sin formulario ni alta mientras SCP-09/SCP-10 sigan abiertos
6	Datos mínimos incompletos	lista corta de faltantes	VOLVER A LA MATERIA	no activa ni ofrece mutación pendiente
7	Fecha desconocida	Fecha desconocida	VOLVER A LA MATERIA	sin countdown, estimación ni reporte
8	Modalidad desconocida	Modalidad desconocida	VOLVER A LA MATERIA	sin selector; modalidades P0 sólo como contrato conceptual
9	Modalidad práctica	Práctico	activar	handoff sin protocolo interno
10	Modalidad teórica escrita	Teórico escrito	activar	handoff sin protocolo interno
11	Oral/fuera de P0	modalidad real + Todavía no disponible en P0	VOLVER A MATERIA	no fuerza protocolo P0
12	Evaluación ya activa	MODO EXAMEN ACTIVO	ABRIR PREPARACIÓN	no muta
13	Intento duplicado	misma Assessment + contexto activo/reconciliable	ABRIR PREPARACIÓN	no crea otro
14	Varias evaluaciones de una materia	lista sin ranking local	REVISAR EVALUACIÓN tras elegir	selección explícita
15	Evaluaciones de materias distintas	cada una se resuelve desde su propio CourseEnrollment; WF-S09 sólo muestra el origen actual	CTA sobre la Assessment del origen o VOLVER A LA MATERIA	no selector transversal ni activación global
16	Fecha modificada	valor vigente + valor anterior/provenance cuando esté disponible	REVISAR CAMBIO	releer elegibilidad; no duplica
17	Cancelada/inexistente	sólo si lectura propietaria lo respalda	VOLVER A MATERIA	estado cancelado no se inventa; contrato de status pendiente
18	Evaluación pasada	fecha pasada con timezone confiable / ineligibilidad propietaria	VOLVER A MATERIA	no activar desde UX07
19	Alumno vs. cátedra contradictorios	cada valor con Dato en revisión · hay versiones distintas	VOLVER A LA MATERIA	owner resuelve; UI no elige ni ofrece corrección pendiente
20	Datos temporalmente no disponibles	error técnico, no empty state	REINTENTAR	retorno seguro
21	Activación completada	Assessment + ACTIVE	ABRIR PREPARACIÓN	handoff a WF-S10
22	Handoff posterior no disponible	ACTIVE preservado	VOLVER A CURSADO	no revierte ni duplica
	***
17. REGLAS DE DUPLICACIÓN

17.1. Identidad funcional

La prevención se resuelve sobre entidades existentes:

estudiante actual (student_id);
evaluación concreta (assessment_id);
ExamPreparation existente asociada.

No se compara por nombre de materia, texto de evaluación o fecha solamente.

17.2. Reglas UX obligatorias

Antes de habilitar confirmación, releer si existe ExamPreparation para ese estudiante y Assessment.
Mientras la solicitud está en curso, deshabilitar el CTA y mostrar progreso no repetible.
Si la respuesta se pierde, reconciliar por identidad antes de habilitar otro intento.
Si existe ACTIVE o un estado posterior, abrir la preparación existente.
Si existe RECOMMENDED, continuar sobre esa misma instancia si el contrato lo soporta; no crear otra.
Si dos fuentes describen el mismo examen pero no están deduplicadas como una misma Assessment, detenerse en conflicto de datos; no crear dos ExamPreparation.
Si aparecen dos ExamPreparation canónicas para el mismo estudiante y Assessment, mostrar error de integridad y no elegir/mergear desde la UI.

17.3. Contrato técnico pendiente

Quedan SOURCE CONTRACT PENDING:

unicidad exacta;
idempotency key;
endpoint create-or-get/activate;
semántica de retry;
reconciliación de respuesta incierta;
deduplicación de Assessment multifuente.

El fallback funcional es siempre no duplicar y conservar el contexto previo.

***
18. REGLAS DE PROVENANCE Y verification_status

18.1. Principio

Todo dato que pueda cambiar o discutirse conserva fuente, fecha de observación, vigencia, confianza y verificación. La densidad visual se reduce con copy compacto, no eliminando semántica.

18.2. Mapeo de copy

source / verification	Copy mínimo permitido
cátedra/institución + official	Cátedra · oficial / Institución · oficial
fuente + corroborated	{Fuente} · corroborado
student + unverified	Reportado por vos · sin verificar
inference + unverified	Estimado por Achieve · sin verificar
cualquier fuente + disputed	Dato en revisión · hay versiones distintas
status no disponible	Estado de verificación no disponible
	18.3. Reglas

Activar con un dato reportado no lo vuelve oficial.
Confirmar “quiero usar esta fecha” no equivale a confirmar “la cátedra fijó esta fecha”.
Una fecha desconocida no recibe source inferida.
Una corrección del estudiante conserva la versión/fuente anterior según el contrato propietario.
Si falta provenance crítica, se omite la afirmación o se bloquea la activación; no se presenta como confirmada.
Fecha, modalidad, cátedra/comisión, Course y Assessment muestran su source/status inmediatamente junto al dato.
Un rótulo de grupo sólo puede respaldar varios campos cuando todos comparten exactamente la misma source_type, source_ref, vigencia y verification_status; el grupo enumera explícitamente qué datos cubre.
Si uno de los campos tiene provenance distinta, se separa en otro grupo o se rotula individualmente.
La provenance nunca queda como una leyenda suelta cuya pertenencia deba inferirse, ni se entierra en tooltip, hover, tab o modal.
Los enums técnicos official, corroborated, unverified y disputed nunca aparecen como copy visible; se traducen con los labels humanos de §18.2.
observed_at o vigencia se muestran cuando cambian la interpretación; no se inventa “actualizado hoy”.

***
19. REGLAS DE FECHA Y PROXIMIDAD

14 días es default UX documentado, no umbral pedagógico rígido.
La pantalla no calcula el default ni decide elegibilidad.
El Academic Decision Engine puede recomendar antes; la razón debe venir del Engine.
La fecha utilizada es Assessment.date vigente con provenance.
La cuenta regresiva requiere timezone aplicable y lectura temporal confiable.
El owner del disparador default, la inclusión del día de examen y el tipo de diferencia temporal quedan pendientes.
Fecha reportada/estimada conserva label y status.
Fecha desconocida impide convertir proximidad en hecho.
Fecha modificada invalida la cuenta previa y fuerza relectura de elegibilidad.
Si la evaluación pasa fuera de la ventana, una ExamPreparation ya ACTIVE no se desactiva localmente.
Si la evaluación se mueve más cerca, la UI no crea una segunda recomendación/preparación.
Si la evaluación ya pasó, la vista sólo bloquea si una lectura temporal autoritativa o el owner lo establece; no crea un estado de Assessment nuevo.

Copy permitido:

Apareció porque esta evaluación entró en la ventana de recomendación. sólo si la señal lo confirma;
Achieve recomienda empezar antes. sólo con recomendación del Academic Decision Engine;
Faltan 14 días sólo con cálculo autoritativo/timezone suficiente.

Copy prohibido:

Tenés que activar porque quedan 14 días calculado por la vista;
La fecha es segura con unverified;
Quedan aproximadamente 14 días cuando la fecha es desconocida.

***
20. REGLAS DE MODALIDAD

Assessment.modality visible	Tratamiento UX07	Handoff
Práctico	soportado P0	activar y abrir WF-S10 cuando exista
Teórico escrito	soportado P0	activar y abrir WF-S10 cuando exista
Desconocida	completar/reportar sin elevar verificación	no activar hasta elegibilidad
Oral	mostrar modalidad real + fuera de P0	retorno seguro; no diseñar oral
Otra/mixta/no soportada	mostrar valor real si existe + fuera de P0	retorno seguro
	El campo conceptual Assessment.modality existe; los valores técnicos exactos del enum no están congelados. Este documento usa labels de producto, no inventa códigos.

No se muestra un selector que obligue a convertir oral/mixta en práctico o teórico escrito.

***
21. JERARQUÍA VISUAL

21.1. Mobile 360 px

Orden obligatorio antes de cualquier detalle secundario:

materia y evaluación;
fecha;
modalidad;
provenance / verification_status cuando corresponda;
motivo de aparición;
acción primaria;
qué ocurrirá después;
salida/retorno seguro.

La cátedra/comisión aparece junto a la materia cuando evita activar el Assessment de otro CourseOffering.

No compiten above the fold:

otra ActionRecommendation;
progreso de Cursado;
unidades/temas;
porcentaje o readiness;
horas estimadas/disponibles;
calendario;
alertas de riesgo;
contenido de WF-S10;
CTA secundaria estilizada como primaria.

21.2. Desktop

Columna principal: identidad, datos, razón y decisión.
Columna secundaria: efecto real, continuidad de Cursado y provenance expandida.
Una sola CTA primaria.
Las evaluaciones múltiples del mismo CourseEnrollment se presentan como lista de selección; el panel de revisión sólo aparece para la seleccionada.
El ancho adicional no agrega protocolo, analytics ni cronograma.

21.3. Estado activo

Cuando ya existe ACTIVE, el estado reemplaza el CTA de activación:

primaria: ABRIR PREPARACIÓN;
secundaria: VOLVER A CURSADO.

No se conserva un botón Activar deshabilitado que sugiera una segunda operación.

***
22. MICROCOPY

22.1. Estados

Situación	Título
recomendación automática	RECOMENDACIÓN DE ACTIVACIÓN
manual antes de confirmar	REVISÁ ESTA EVALUACIÓN
todavía sin mutación	TODAVÍA NO ESTÁ ACTIVO
operación confirmada	MODO EXAMEN ACTIVO
faltan datos	FALTAN DATOS PARA ACTIVAR
contradicción	HAY DATOS CONTRADICTORIOS
lectura técnica fallida	NO PUDIMOS CARGAR LA EVALUACIÓN
resultado de operación incierto	ESTAMOS VERIFICANDO LA ACTIVACIÓN
	22.2. CTAs semánticas

Acción real	CTA
pedir activación	ACTIVAR PREPARACIÓN DE ESTE EXAMEN
activar dato reportado elegible	ACTIVAR CON ESTOS DATOS
ir a revisión sin mutar	REVISAR EVALUACIÓN
registrar/informar dato sin contrato	no se ofrece CTA en el baseline
abrir existente	ABRIR PREPARACIÓN
reintentar lectura	REINTENTAR
retorno	VOLVER A CURSADO / VOLVER A {MATERIA}
	22.3. Explicación de efecto

> “Se activará una preparación sólo para Parcial 1 de Análisis II. Tu Cursado, progreso y Bitácora siguen disponibles.”

> “Después abriremos el contexto de esta preparación. Todavía no se crea una Action ni un Commitment.”

Si WF-S10 no está disponible:

> “La preparación quedó activa. No pudimos abrir el destino ahora; podés volver a Cursado sin perder la activación.”

22.4. Copy prohibido

Empezar a estudiar;
Prepararme si la operación técnica sólo registra Assessment;
Confirmar fecha si sólo confirma intención y no veracidad institucional;
Listo para rendir;
Plan generado;
Tu operador lo aprobará;
Activar Modo Examen para la materia sin identificar Assessment.

***
23. WIREFRAMES MOBILE 360 PX

Los siguientes wireframes son funcionales y no prescriben UI high-fi.

23.1. Recomendación automática con datos confirmados

Baseline: la señal aparece automáticamente; la activación efectiva aún requiere CTA.

+--------------------------------------+
| <- ANÁLISIS II                       |
| RECOMENDACIÓN DE ACTIVACIÓN          |
+--------------------------------------+
| DATOS DE CÁTEDRA · OFICIALES         |
| Evaluación: Parcial 1                |
| Materia: Análisis II                 |
| Comisión: A                          |
| Fecha: 07 sep 2026                   |
| Modalidad: Práctico                  |
|                                      |
| Apareció porque esta evaluación      |
| entró en la ventana de recomendación.|
| Todavía no está activo.              |
|                                      |
| [ ACTIVAR PREPARACIÓN DE ESTE EXAMEN]|
|                                      |
| Después: abrimos el contexto de esta |
| preparación. No crea un compromiso.  |
|                                      |
| Ahora no · Volver a Análisis II      |
+--------------------------------------+

Reglas:

El rótulo grupal Datos de cátedra · oficiales sólo puede usarse porque evaluación, materia, comisión, fecha y modalidad comparten exactamente esa provenance en este estado.
Si el owner no entrega razón de ventana, el copy cambia a Achieve recibió una recomendación para esta evaluación.
No aparecen horas estimadas, unidades objetivo ni simulaciones del low-fi original porque pertenecen al contexto posterior o requieren contrato no congelado.

23.2. Evaluación reportada por el alumno

+--------------------------------------+
| <- FÍSICA I                          |
| REVISÁ ESTA EVALUACIÓN               |
+--------------------------------------+
| CONTEXTO · INSTITUCIÓN · OFICIAL     |
| Materia: Física I                    |
| Comisión/turno: tarde                |
|                                      |
| REPORTADO POR VOS · SIN VERIFICAR    |
| Evaluación: Parcial 2                |
| Fecha: 10 sep 2026                   |
| Modalidad: Teórico escrito           |
|                                      |
| Apareció por la proximidad informada |
| en tu reporte. La cátedra todavía no |
| confirmó estos datos.                |
|                                      |
| [       ACTIVAR CON ESTOS DATOS     ]|
|                                      |
| La fuente seguirá siendo tu reporte. |
| Después: contexto de preparación.    |
|                                      |
| Volver a Física I                    |
+--------------------------------------+

El CTA sólo existe si el owner declara elegible la activación con dato unverified. Si no, se omite la activación y queda el retorno a Física I; este candidate no inventa una operación de corrección.

23.3. Activación manual — Assessment existente

+--------------------------------------+
| <- ANÁLISIS II                       |
| ELEGÍ LA EVALUACIÓN                  |
+--------------------------------------+
| CONTEXTO · INSTITUCIÓN · OFICIAL     |
| Materia: Análisis II                 |
| Comisión: A                          |
|                                      |
| EVALUACIÓN                           |
| (o) Evaluación: Parcial 1            |
|     Cátedra · oficial                |
|     Fecha: 07 sep                    |
|     Cátedra · oficial                |
|     Modalidad: Práctico              |
|     Cátedra · oficial                |
| ( ) Evaluación: Recuperatorio        |
|     Cátedra · oficial                |
|     Fecha: 28 sep                    |
|     Cátedra · oficial                |
|     Modalidad: Teórico escrito       |
|     Cátedra · oficial                |
|                                      |
| Seleccionaste: Parcial 1             |
| Análisis II · 07 sep · Práctico      |
|                                      |
| [        REVISAR EVALUACIÓN         ]|
|                                      |
| Todavía no se activó nada.           |
| Volver a Análisis II                 |
+--------------------------------------+

El CTA abre la revisión final; no activa desde la lista. Materia y comisión son contexto fijo del CourseEnrollment de origen y no funcionan como selector.

23.4. Datos mínimos incompletos

+--------------------------------------+
| <- ANÁLISIS II                       |
| FALTAN DATOS PARA ACTIVAR            |
+--------------------------------------+
| CONTEXTO · INSTITUCIÓN · OFICIAL     |
| Evaluación: Parcial 1                |
| Materia: Análisis II                 |
|                                      |
| Fecha: DESCONOCIDA                   |
| Fuente/estado fecha: no disponibles  |
| Modalidad: DESCONOCIDA               |
| Fuente/estado modalidad: no disponibles|
|                                      |
| Necesitamos fecha y modalidad para   |
| identificar y activar esta preparación.|
|                                      |
| No se activó Modo Examen.            |
| [       VOLVER A ANÁLISIS II        ]|
+--------------------------------------+

No se ofrece Completar datos mientras no exista una operación propietaria aprobada. El retorno seguro conserva el CourseEnrollment.

23.5. Evaluación ya activa / intento duplicado

+--------------------------------------+
| <- ANÁLISIS II                       |
| MODO EXAMEN ACTIVO                   |
+--------------------------------------+
| DATOS DE CÁTEDRA · OFICIALES         |
| Evaluación: Parcial 1                |
| Materia: Análisis II                 |
| Comisión: A                          |
| Fecha: 07 sep 2026                   |
| Modalidad: Práctico                  |
|                                      |
| Ya existe una preparación para esta  |
| evaluación. No creamos otra.         |
|                                      |
| [          ABRIR PREPARACIÓN        ]|
|                                      |
| Tu Cursado y Bitácora siguen activos.|
| Volver a Análisis II                 |
+--------------------------------------+

Ante respuesta incierta, el copy es Estamos verificando si quedó activa y no se muestra CTA de creación hasta reconciliar.

23.6. Modalidad oral o fuera de P0

+--------------------------------------+
| <- HISTORIA CONTEMPORÁNEA            |
| MODALIDAD TODAVÍA NO DISPONIBLE      |
+--------------------------------------+
| DATOS DE CÁTEDRA · OFICIALES         |
| Evaluación: Final                    |
| Materia: Historia Contemporánea      |
| Fecha: 15 sep 2026                   |
| Modalidad: Oral                      |
|                                      |
| El recorrido oral no forma parte de  |
| Modo Examen P0. No vamos a cambiarlo |
| por una modalidad distinta.          |
|                                      |
| [       VOLVER A LA MATERIA         ]|
|                                      |
| No requiere aprobación de operador.  |
+--------------------------------------+

No se ofrece protocolo genérico, lista de espera ni revisión humana.

23.7. Varias evaluaciones próximas

+--------------------------------------+
| <- ELEGIR EVALUACIÓN                 |
| CONTEXTO · INSTITUCIÓN · OFICIAL     |
| Materia: Análisis II                 |
| Comisión: A                          |
| 2 EVALUACIONES PRÓXIMAS              |
+--------------------------------------+
| ( ) Evaluación: Parcial 1            |
|     Cátedra · oficial                |
|     Fecha: 07 sep                    |
|     Cátedra · oficial                |
|     Modalidad: Práctico              |
|     Cátedra · oficial                |
|                                      |
| ( ) Evaluación: Recuperatorio        |
|     Reportado por vos · sin verificar|
|     Fecha: 10 sep                    |
|     Reportado por vos · sin verificar|
|     Modalidad: Teórico escrito       |
|     Reportado por vos · sin verificar|
|                                      |
| Elegí una evaluación concreta.       |
| La pantalla no decide cuál priorizar.|
|                                      |
| [        REVISAR EVALUACIÓN         ]|
|                                      |
| Volver a Análisis II                 |
+--------------------------------------+

La lista contiene únicamente Assessments del CourseEnrollment de origen. Si Academic Decision Engine entrega una recomendación principal, esa opción puede portar Recomendada por Achieve y su razón; la vista no la reordena ni genera la marca.

23.8. Datos contradictorios

+--------------------------------------+
| <- ANÁLISIS II                       |
| HAY DATOS CONTRADICTORIOS            |
+--------------------------------------+
| CONTEXTO · INSTITUCIÓN · OFICIAL     |
| Evaluación: Parcial 1                |
| Materia: Análisis II                 |
| Modalidad: Práctico                  |
|                                      |
| Fecha informada por cátedra: 07 sep  |
| Cátedra · oficial                    |
| Dato en revisión: hay versiones      |
| distintas                            |
|                                      |
| Fecha reportada por vos: 10 sep      |
| Reportado por vos · sin verificar    |
| Dato en revisión: hay versiones      |
| distintas                            |
|                                      |
| No vamos a elegir una fecha por vos  |
| ni activar con datos ambiguos.       |
|                                      |
| [       VOLVER A ANÁLISIS II        ]|
+--------------------------------------+

REVISAR DATOS sólo podría aparecer si existe una corrección/versionado propietario aprobado. En el baseline actual se omite y queda el retorno a Análisis II.

23.9. Datos temporalmente no disponibles

+--------------------------------------+
| <- ANÁLISIS II                       |
| NO PUDIMOS CARGAR LA EVALUACIÓN      |
+--------------------------------------+
| No sabemos todavía si la preparación |
| está activa ni qué datos están       |
| vigentes. No hicimos cambios.        |
|                                      |
| [             REINTENTAR            ]|
|                                      |
| Volver a Análisis II                 |
+--------------------------------------+

No se reutiliza una copia local como verdad si podría activar el examen equivocado.

23.10. Assessment no registrada — estado no implementable

+--------------------------------------+
| <- ANÁLISIS II                       |
| EVALUACIÓN NO REGISTRADA             |
+--------------------------------------+
| CONTEXTO · INSTITUCIÓN · OFICIAL     |
| Materia: Análisis II                 |
| Comisión: A                          |
|                                      |
| No encontramos una Assessment        |
| existente para activar desde esta    |
| materia.                             |
|                                      |
| Registrar una evaluación nueva no    |
| está disponible en este baseline.    |
|                                      |
| [       VOLVER A ANÁLISIS II        ]|
+--------------------------------------+

No existe CTA de alta, selector transversal ni formulario. La necesidad permanece SOURCE CONTRACT PENDING y fuera del baseline implementable.

***
24. WIREFRAMES DESKTOP

24.1. Recomendación automática — desktop

+--------------------------------------------------------------------------------------------------+
| <- ANÁLISIS II                                   RECOMENDACIÓN DE ACTIVACIÓN                       |
+--------------------------------------------------------------+-----------------------------------+
| DATOS DE CÁTEDRA · OFICIALES                                 | QUÉ CAMBIA                        |
| Evaluación: Parcial 1                                        | Se crea una preparación sólo para|
| Materia: Análisis II                                         | esta Assessment.                  |
| Comisión: A                                                  |                                   |
| Fecha: 07 sep 2026                                           | QUÉ NO CAMBIA                     |
| Modalidad: Práctico                                          | Cursado, progreso y Bitácora.     |
|                                                              |                                   |
| Apareció porque esta evaluación entró en la ventana          | No crea Action ni Commitment.     |
| de recomendación determinada por el servicio propietario.    |                                   |
|                                                              | DESPUÉS                           |
| Todavía no está activo.                                      | Abrimos WF-S10 si está disponible.|
|                                                              |                                   |
| [             ACTIVAR PREPARACIÓN DE ESTE EXAMEN            ]| Volver a Análisis II              |
+--------------------------------------------------------------+-----------------------------------+

24.2. Activación manual — desktop

+--------------------------------------------------------------------------------------------------+
| <- ANÁLISIS II                                   ACTIVAR MODO EXAMEN                              |
+-----------------------------------------------+--------------------------------------------------+
| ELEGÍ UNA EVALUACIÓN                          | REVISIÓN                                         |
|                                               |                                                  |
| CONTEXTO · INSTITUCIÓN · OFICIAL              | CONTEXTO · INSTITUCIÓN · OFICIAL                 |
| Materia: Análisis II                          | Materia: Análisis II · Comisión A                |
| Comisión: A                                   |                                                  |
|                                               | Evaluación: Parcial 1 · Cátedra · oficial       |
| (o) Evaluación: Parcial 1                     | Fecha: 07 sep · Cátedra · oficial               |
|     Cátedra · oficial                         | Modalidad: Práctico · Cátedra · oficial         |
|     Fecha: 07 sep · Cátedra · oficial         |                                                  |
|     Modalidad: Práctico · Cátedra · oficial   | Todavía no está activo.                          |
| ( ) Evaluación: Recuperatorio                 | Al activar no se modifica Cursado.               |
|     Cátedra · oficial                         |                                                  |
|     Fecha: 28 sep · Cátedra · oficial         | [ ACTIVAR PREPARACIÓN DE ESTE EXAMEN ]           |
|     Modalidad: Teórico escrito                |                                                  |
|     Cátedra · oficial                         |                                                  |
|                                               |                                                  |
| La lista conserva el orden recibido.          |                                                  |
| No prioriza académicamente.                    |                                                  |
|                                               | Cambiar evaluación · Volver a Análisis II        |
+-----------------------------------------------+--------------------------------------------------+

Materia y comisión no son selectores: pertenecen al CourseEnrollment de origen.

24.3. Desktop — evaluaciones de materias distintas

No existe un layout transversal. Cada Assessment se abre desde su propio CourseEnrollment y WF-S09 sólo representa la materia de origen. No hay selección múltiple, cambio de materia ni CTA masiva.

***
25. ESTADOS VACÍOS, DESCONOCIDOS, CONTRADICTORIOS Y DE ERROR

Situación	Copy	Acción	Prohibición
no hay Assessment seleccionable	No encontramos una evaluación registrada para esta materia.	volver al CourseEnrollment	no alta ni ExamPreparation global
fecha desconocida	La fecha todavía es desconocida.	volver	no estimar ni ofrecer corrección sin contrato
modalidad desconocida	Todavía no sabemos la modalidad.	volver	no elegir por defecto ni ofrecer alta
CourseOffering ambiguo	No pudimos identificar la cátedra/comisión de esta evaluación.	volver	no selector transversal ni uso sólo de Course
datos disputados	Hay versiones distintas de este dato.	volver, salvo operación propietaria futura	no privilegiar student/cátedra localmente
Assessment no disponible	No pudimos recuperar esta evaluación.	reintentar/volver	no usar snapshot dudoso
ExamPreparation no disponible	No sabemos si ya está activa.	reconciliar	no crear otra
error al activar, resultado conocido como fallido	No se activó la preparación.	reintentar sólo tras lectura	no mostrar ACTIVE
respuesta perdida/resultado incierto	Estamos verificando si quedó activa.	esperar/reconciliar	no reintento ciego
handoff WF-S10 falla	La preparación quedó activa, pero no pudimos abrirla.	volver a Cursado / reabrir	no revertir activación
Assessment cancelada	sólo mostrar si owner expone un estado real	volver	no inventar enum/status
	Los errores técnicos no se presentan como empty state académico. Un empty state significa lectura exitosa sin Assessment; un error significa que no se conoce el estado real.

***
26. CONTRATOS Y OWNERSHIP

26.1. Convenciones

Fuente conceptual: entidad/componente existente que aporta verdad.
Owner de escritura: componente aprobado cuando existe; si sólo está congelada la frontera Plataforma/CRM, se indica owner funcional y se marca el servicio técnico pendiente.
Owner de lectura: proyección/superficie que consume; no persiste ni decide.
Efecto: resultado autoritativo, nunca optimista si puede duplicar.
SCP: SOURCE CONTRACT PENDING.

26.2. Matriz de datos y acciones visibles

Dato/acción visible	Fuente / entidad canónica	Campo existente	Owner escritura	Owner lectura	Provenance / verification	Condición de activación	Efecto y destino	Si falta	Duplicados
estudiante	Student	id, timezone	Plataforma; servicio técnico SCP	WF-S09	identidad de sesión	Student válido	scope personal	error técnico	no aplica
materia personal	CourseEnrollment + Course	student_id, offering_id, Course id/name	Plataforma	WF-S09/Materia	período/oferta cuando aplica	CourseEnrollment vigente	preserva Cursado	volver/seleccionar	no comparar sólo por nombre
cátedra/comisión	CourseOffering + Instructor	id, course_id, term, commission, instructor	Academic Data Layer/Plataforma	WF-S09	source, offering, term, status	necesaria cuando desambigua	fija contexto de Assessment	volver; no selector transversal	usar offering_id
evaluación	Assessment	id, offering_id, type, date, modality, scope	Academic Data Layer/Plataforma; servicio técnico SCP	WF-S09	metadata académica completa	identidad inequívoca	target de ExamPreparation	seleccionar existente del origen o volver	dedup multifuente SCP
fecha	Assessment.date	date	Academic Data Layer/Plataforma	WF-S09	source, observed_at, vigencia, confidence, verification	fecha utilizable + elegibilidad propietaria	muestra cuándo / razón	Fecha desconocida	cambio relee misma Assessment
modalidad	Assessment.modality	modality	Academic Data Layer/Plataforma	WF-S09	source/status si discutible	P0 soportada	selecciona futura plantilla, no diseñada aquí	completar/fuera de P0	no crea otra Assessment por label
tipo/nombre examen	Assessment	type y label derivable autorizado	Academic Data Layer/Plataforma	WF-S09	source/status si discutible	suficiente para distinguir	identidad comprensible	pedir dato mínimo	no usar texto como key
reason default 14 días	señal de recomendación	evento existente ExamPreparationRecommended; payload no definido	owner default SCP	WF-S09/TodayView	fecha utilizada/source requerido SCP	owner declara elegible	muestra RECOMMENDED; el CTA posterior produce ACTIVE	copy genérico de recomendación	una señal no crea dos preparaciones
reason anticipada	Academic Decision Engine	razón de recomendación; campo exacto SCP	Academic Decision Engine	WF-S09	razones/inputs según contrato	Engine recomienda	explica por qué antes	omitir razón específica	pantalla no rankea
estado preparación	ExamPreparation	assessment_id, student_id, activated_at, status	Plataforma; owner técnico SCP	WF-S09, Hoy, Materia, WF-S10	activation provenance no definida	lectura autoritativa	RECOMMENDED/ACTIVE	no afirmar activo	reconciliar student + assessment
activar	ExamPreparation	transición RECOMMENDED → ACTIVE; activated_at	owner de ExamPreparation SCP	WF-S09	actor/origen exacto SCP	validación + no duplicado + elegibilidad	ExamPreparationActivated; WF-S10	error/reconciliar	idempotencia SCP
registrar Assessment — no visible en baseline	Assessment nueva	campos mínimos del modelo	Academic Data Layer/Plataforma; mutación SCP	no aplica en WF-S09 v0.2	student + unverified salvo respuesta distinta	SCP-09/SCP-10 cerrados en una fuente futura	sin efecto en UX07 actual	volver a la materia	no se ejecuta
corregir fecha/modalidad — no visible en baseline	Academic provenance / Assessment versionada	campos exactos de versión SCP	Academic Data Layer	no aplica sin contrato	no borrar fuente anterior	operación propietaria futura	sin efecto en UX07 actual	volver	no se ejecuta
abrir preparación	ExamPreparation existente	id no listado entre mínimos; identidad canónica del objeto requerida	ninguna mutación	WF-S09 → WF-S10	no aplica	estado ACTIVE/posterior	navegación	volver a Cursado	abre existente
volver a Cursado	CourseEnrollment	identidad preservada	ninguna	WF-S09 → Materia	no aplica	siempre disponible	retorna sin mutación	fallback seguro	no aplica
	26.3. Ownership de prioridad

Decisión	Owner	Límite de WF-S09
qué examen importa más	Academic Decision Engine cuando existe recomendación	no comparar fechas/riesgo/carga
mostrar lifecycle ya activo	proyección propietaria / TodayView según superficie	sólo lectura
precedencia operativa de un objeto ya iniciado	TodayView en Hoy	no aplica ranking dentro de WF-S09
eligibility default 14 días	SCP	no calcular
recomendación anticipada	Academic Decision Engine	mostrar razón recibida
crear/activar ExamPreparation	Plataforma / servicio propietario SCP	solicitar y releer
corregir dato académico	Academic Data Layer	no sobrescribir localmente
	26.4. Evento y side effects

Eventos existentes:

ExamPreparationRecommended: recomendación/oportunidad;
ExamPreparationActivated: activación confirmada.

WF-S09 no crea nombres de eventos de vista o alta de Assessment. Si analytics necesita observar apertura, selección, error o abandono, el naming y payload quedan SOURCE CONTRACT PENDING y no reemplazan eventos de dominio.

La activación no emite por sí misma:

ActionRecommended;
ActionAccepted;
CommitmentCreated;
EvidenceSubmitted;
ProgressUpdated.

***
27. HANDOFF HACIA EL SPRINT SIGUIENTE

27.1. Contrato de salida

Precondición:

ExamPreparation releída como ACTIVE o estado posterior;
Assessment y CourseEnrollment inequívocos;
no existe duda de duplicación.

Payload conceptual mínimo, usando entidades existentes:

identidad de ExamPreparation;
assessment_id;
student_id implícito/seguro;
CourseEnrollment/CourseOffering de contexto;
status;
activated_at si está disponible;
Assessment type/date/modality y provenance vigente.

No se agregan campos de plan, readiness, fase o acción.

27.2. Estado final de activación

+--------------------------------------+
| MODO EXAMEN ACTIVO                   |
+--------------------------------------+
| DATOS DE CÁTEDRA · OFICIALES         |
| Evaluación: Parcial 1                |
| Materia: Análisis II                 |
| Fecha: 07 sep 2026                   |
| Modalidad: Práctico                  |
|                                      |
| Activaste una preparación sólo para  |
| esta evaluación.                     |
|                                      |
| Tu Cursado, progreso y Bitácora       |
| siguen disponibles.                  |
|                                      |
| Después: abrimos el contexto del     |
| examen. Todavía no se creó una       |
| Action ni un Commitment.             |
|                                      |
| [          ABRIR PREPARACIÓN        ]|
| Volver a Análisis II                 |
+--------------------------------------+

27.3. WF-S10 todavía no disponible

La activación confirmada no se revierte:

MODO EXAMEN ACTIVO
La preparación quedó guardada.
No pudimos abrir el contexto ahora.
[ VOLVER A CURSADO ]

Al volver, Materia/Cursado debe mostrar EXAMEN como activo y conservar el estado propio de Cursado. La reapertura futura usa la misma ExamPreparation.

27.4. Retorno desde WF-S10

El retorno a Cursado reabre el mismo CourseEnrollment. No resetea:

Recorrido;
Práctica;
Dominio;
Confianza;
Recencia;
Bitácora;
Actions/Commitments/Evidence históricas de Cursado.

***
28. CRITERIOS DE ACEPTACIÓN

28.1. Producto / PO

La activación siempre identifica una Assessment concreta.
Course y CourseOffering se preservan sin crear una segunda materia.
Materia/Cursado continúa disponible después de activar.
RECOMMENDED y ACTIVE no se confunden.
Toda señal automática del baseline aparece como RECOMMENDED; sólo el CTA del estudiante solicita ACTIVE.
Una preparación recibida como ACTIVE se trata como existente, no como variante alternativa del flujo automático.
Activar no parece estudiar, estar preparado ni demostrar dominio.
La rama default de 14 días no se calcula en la UI.
Academic Decision Engine conserva recomendación anticipada/prioridad.
TodayView sólo muestra una señal ya determinada.
No se exige aprobación humana.
No se diseña WF-S10 ni el Exam Protocol.
Modalidades P0 son práctico y teórico escrito.
Oral/otras no se fuerzan dentro de P0.

28.2. UX/UI

En 360 px se responde qué Assessment, Course, fecha y modalidad.
Se entiende por qué apareció la propuesta.
Se ve si todavía requiere confirmación o ya está activa.
El CTA describe la mutación real.
La necesidad de registrar una evaluación y activar su preparación sigue siendo conceptualmente distinta, aunque el alta no es una operación disponible en este baseline.
Provenance/status están unidos a cada dato visible o a un grupo rotulado sólo cuando todos sus campos comparten exactamente la misma provenance.
Ningún enum técnico de provenance/status aparece como copy visible.
Varias evaluaciones exigen selección explícita.
La entrada manual conserva el CourseEnrollment de origen y no ofrece selector transversal de materias.
La Assessment ausente no se presenta como formulario, CTA ni operación disponible.
El estado duplicado abre la preparación existente.
Siempre existe retorno seguro a Materia/Cursado.
Un error técnico no se muestra como ausencia académica.

28.3. Data / Arquitectura

Assessment se relaciona con CourseOffering.
ExamPreparation se relaciona con Assessment y Student.
Se preservan campos de provenance aprobados.
Un reporte del alumno continúa student/unverified hasta actualización propietaria.
La fecha desconocida no se convierte en estimación.
La comparación temporal usa timezone suficiente.
La transición visible a ACTIVE proviene de lectura autoritativa.
Se previene/reconcilia duplicación por student + Assessment.
Un cambio de fecha no crea otra ExamPreparation.
La frontera Plataforma/CRM se preserva; CRM no activa.

28.4. Frontend

No rankea Assessments.
No calcula elegibilidad/default 14 días.
No eleva verification status.
Deshabilita confirmación durante request.
Relee antes de reintentar tras respuesta incierta.
No muestra ACTIVE por optimismo.
Omite countdown sin fecha/timezone confiables.
No conserva un CTA de activación cuando ya existe preparación.

28.5. Backend / dominio

Devuelve identidad canónica de Assessment y ExamPreparation.
Resuelve elegibilidad y reason sin delegarla a UI.
Devuelve provenance/status vigente por dato.
Confirma transición RECOMMENDED → ACTIVE.
Emite ExamPreparationActivated de forma deduplicada conforme al contrato que se cierre.
Reconciliación evita doble ExamPreparation ante retry.
Detecta/expone conflictos de Assessment multifuente.
No crea Action/Commitment/Evidence como side effect silencioso de activación.

***
29. TEST DE COMPRENSIÓN DE 10 SEGUNDOS

29.1. Protocolo

Mostrar sólo el primer viewport del wireframe mobile durante 10 segundos. Preguntar sin ayudas:

¿Qué examen es?
¿De qué materia?
¿Cuándo y cómo se toma?
¿Por qué apareció?
¿Ya está activo?
¿Qué hace el botón y qué pasa después?

Criterio de PASS por participante: 6/6 respuestas correctas sin confundir activación con estudio/preparación.

29.2. Escenario A — propuesta confirmada

Respuestas esperadas:

Parcial 1.
Análisis II, Comisión A.
07 sep, práctico; evaluación, materia, comisión, fecha y modalidad figuran como datos oficiales de cátedra.
Entró en una ventana de recomendación determinada fuera de la vista.
No; todavía hay que activar.
Crea/activa la preparación de ese examen y abre su contexto; no crea compromiso.

Simulación documental: PASS.

29.3. Escenario B — dato reportado

Respuestas esperadas:

Parcial 2 de Física I.
Física I, turno tarde; ese contexto figura como oficial de la institución.
10 sep, teórico escrito; evaluación, fecha y modalidad figuran como reportadas por el alumno y sin verificar.
Apareció por una fecha reportada por el alumno.
No; la preparación todavía no está activa y los datos reportados siguen sin verificar.
Activa con esa información si el owner lo permite; no la vuelve oficial.

Simulación documental: PASS CON SOURCE CONTRACT PENDING sobre elegibilidad de fecha no verificada.

29.4. Escenario C — ya activa

Respuestas esperadas:

Parcial 1 de Análisis II.
Análisis II, Comisión A; los datos visibles figuran como oficiales de cátedra.
07 sep, práctico.
Aparece porque ya existe una preparación activa para esa Assessment.
Sí, ya está activa.
El botón abre la existente; no crea una segunda y Cursado continúa.

Simulación documental: PASS.

29.5. Escenario D — varias evaluaciones

Respuestas esperadas:

Hay dos Assessment distintas del mismo CourseEnrollment de Análisis II.
Materia y comisión son contexto oficial fijo; cada evaluación, fecha y modalidad muestra su propia fuente y estado.
Ninguna está seleccionada/activada todavía.
Debe elegirse una concreta.
La pantalla no decide prioridad.

Simulación documental: PASS.

29.6. Resultado UX07

La jerarquía funciona documentalmente en 360 px para el baseline RECOMMENDED → confirmación → ACTIVE.

El caso automático tiene una única lectura: la recomendación apareció automáticamente, todavía no está activa y sólo el CTA del estudiante solicita ACTIVE. No depende de una variante alternativa ni de un Change Request abierto.

***
30. CASOS LÍMITE

Caso	Resolución
mismo nombre de parcial en dos comisiones	mostrar CourseOffering; usar Assessment id
dos parciales de la misma materia el mismo día	mostrar label/type/scope disponible; si sigue ambiguo, no activar
fecha cambia mientras la pantalla está abierta	invalidar revisión, releer y pedir nueva confirmación
modalidad cambia de práctico a oral antes de confirmar	mostrar cambio y salir de P0; no activar con snapshot anterior
modalidad cambia después de ACTIVE	conservar misma ExamPreparation; WF-S09 no redefine protocolo; surface owner actualiza destino
usuario toca CTA dos veces	una solicitud visible; reconciliación por identidad
timeout luego de mutación exitosa	no mostrar error final ni reintentar creación; verificar estado
Assessment duplicadas por alumno/cátedra	conflicto Academic Data Layer; no crear dos preparaciones
ExamPreparation ACTIVE desde otro dispositivo	abrir existente al releer
evaluación se mueve fuera de 14 días tras RECOMMENDED	owner reevalúa; UI no sostiene propuesta por caché
evaluación se mueve fuera de 14 días tras ACTIVE	no desactivar localmente
fecha no tiene hora	no inventar hora; regla de día/timezone pendiente
timezone del estudiante cambia	releer countdown/elegibilidad; no cambiar Assessment.date
CourseEnrollment cerrado/inactivo	owner determina elegibilidad; UI no reactiva materia
Assessment pasada pero ExamPreparation ya existe	abrir historia/estado sólo si destino lo soporta; no crear otra
oral reportado como “otra modalidad”	conservar valor/estado reportado; no mapear a P0
WF-S10 no desplegado	ACTIVE persiste; volver a Cursado
TodayView recibe varias recomendaciones sin principal	error de contrato; no rankea ni elige Assessment
provenance no carga pero Assessment sí	omitir afirmación confirmada; bloquear si induce a activar examen equivocado
nombre largo en 360 px	envolver hasta dos líneas; no truncar Course/Assessment esenciales
	***
31. RIESGOS

Riesgo	Impacto	Mitigación funcional
“automática” interpretada como ACTIVE silencioso	doble semántica y eventos inconsistentes	usar siempre recomendación automática; reservar activar para CTA → ACTIVE
fecha estudiantil parece oficial	activación con falsa certeza	source/status junto a fecha
CTA genérico	estudiante cree que empezó a estudiar	CTA describe activar, revisar sin mutar o volver; el alta no ofrece CTA sin contrato
Assessment equivocada por Course homónimo	preparación incorrecta	CourseOffering + Assessment id
duplicación por doble tap/retry	dos contextos para el mismo examen	reconciliación e idempotencia pendiente
pantalla rankea por fecha	invade Academic Decision Engine	preservar orden/selección recibidos
registrar y activar fusionados en una futura rama	Assessment reportada queda activa sin revisión	rama de alta fuera del baseline; mantener separación conceptual
oral forzado a práctico	protocolo incorrecto	estado fuera de P0
handoff falla y se reintenta activación	duplicado	ACTIVE persiste; reabrir/volver
countdown con timezone indefinida	ventana incorrecta	omitir días y consumir elegibilidad propietaria
provenance demasiado larga en mobile	se oculta verdad	copy compacto; detalle expandible debajo
status de Assessment cancelada inventado	nuevo enum/contrato	mostrar sólo si owner lo expone
activación crea plan/Action implícita	mezcla sprints/lifecycles	side effects prohibidos
	***
32. SOURCE CONTRACT PENDING

ID	Contrato pendiente	Por qué se necesita	Fallback de UX07	¿Bloquea?
SCP-01	owner exacto del default temporal de 14 días	la UI no puede inventar señal	mostrar sólo recomendación recibida	bloquea cálculo local, no baseline
SCP-02	semántica de corte: calendario/24 h, inclusión del día, hora	cuenta regresiva/elegibilidad	consumir flag/reason; omitir cálculo	bloquea countdown derivado
SCP-03	timezone aplicable y date vs datetime	evitar off-by-one	omitir días; mostrar fecha	bloquea cálculo local
SCP-04	payload/provenance de ExamPreparationRecommended	explicar por qué apareció	copy genérico de recomendación	no si existe señal inequívoca
SCP-05	activation source/reason/actor histórico	atribuir el origen de una preparación ya ACTIVE	decir sólo está activo; no inferir origen	no bloquea el baseline RECOMMENDED → CTA → ACTIVE
SCP-06	owner técnico y operación de ExamPreparation	activar/releer	no mutar	bloquea implementación
SCP-07	unicidad/idempotencia/retry/reconciliación	impedir duplicados	CTA único + relectura; no reintento ciego	bloquea producción segura
SCP-08	elegibilidad con fecha unverified, estimated o disputed	decidir si CTA puede activar	revisar dato/no activar	bloquea esas ramas
SCP-09	entrada autorizada para manual sin Assessment	Materia oculta EXAMEN si no hay Assessment	no agregar navegación ni formulario	no bloquea baseline; rama excluida
SCP-10	mutación de alta/corrección/versionado de Assessment	registrar dato nuevo	no ofrecer operación	no bloquea baseline; rama excluida
SCP-11	deduplicación de Assessment multifuente	evitar dos preparaciones del mismo examen	conflicto; no activar	bloquea caso ambiguo
SCP-12	status/lifecycle de Assessment cancelada	escenario cancelado	no mostrar cancelación sin dato	no bloquea baseline
SCP-13	requisito de scope al registrar Assessment	modelo lo lista como mínimo, UX07 no debe pedir extra sin definición	marcar alta incompleta	bloquea alta si owner lo exige
SCP-14	enum técnico de modalidad	implementación	usar labels de producto; no inventar códigos	bloquea contrato API, no wireframe
SCP-15	identidad/ruta de WF-S10 y disponibilidad	handoff	ACTIVE + retorno a Cursado	no bloquea activación
SCP-16	telemetría de vista/selección/error	analítica UX	no emitir evento nuevo	no
SCP-17	comportamiento de Assessment pasada/inactiva	elegibilidad	consumir respuesta propietaria	bloquea decisión local
	***
33. CHANGE REQUESTS Y TRAZABILIDAD DE CORRECCIONES

No queda un Change Request abierto dentro del baseline v0.2. Los contratos técnicos no congelados permanecen en §32 y no fueron completados por la UI.

Finding P1	Corrección localizada aplicada	Criterio objetivo de cierre	Secciones
UX07-PO-P1-01 — dos semánticas de automático	Se eliminó la variante auto-activa. Automático significa únicamente aparición de RECOMMENDED; activar queda reservado al CTA del estudiante que produce lectura autoritativa ACTIVE. Una preparación recibida como ACTIVE se muestra como ya existente sin atribuir su origen.	La misma entrada produce siempre RECOMMENDED → CTA → ACTIVE; flujo, copy, matriz y test no dependen de CR ni de actor/origen inventado.	§§1, 7, 9.1–9.2, 12.1–12.4, 19, 22, 23.1, 24.1, 29 y 32
UX07-PO-P1-02 — provenance ambigua/enums técnicos	Cada dato o grupo exacto tiene source/status inmediato. Un rótulo grupal sólo cubre campos con provenance idéntica. Todos los wireframes usan oficial, corroborado, sin verificar, Dato en revisión o no disponible; se eliminaron enums técnicos visibles.	Fecha, modalidad, materia, comisión y evaluación pueden atribuirse sin inferencia, tooltip ni modal; ningún enum técnico aparece como copy.	§§18.2–18.3, 21, 23.1–23.8, 24.1–24.2 y 27.2
UX07-PO-P1-03 — navegación manual no autorizada	El baseline manual conserva un CourseEnrollment de origen fijo y sólo permite elegir Assessments existentes de esa materia. Se retiraron selector transversal, mezcla de materias, formulario y CTA de alta. La Assessment ausente queda como estado no implementable con retorno.	Todo recorrido accionable tiene entrada aprobada; no hay cambio de materia ni alta mientras SCP-09/SCP-10 estén abiertos; registrar y activar siguen separados conceptualmente.	§§1, 5, 9.3–9.5, 13.1–13.3, 16, 23.3, 23.7, 23.10, 24.2–24.3, 25 y 32
	No se implementó ningún P2 ni se modificó una decisión marcada como correctamente preservada por la auditoría.

***
34. TRAZABILIDAD CONTRA CADA FUENTE APROBADA

Fuente aprobada	Decisión/contrato preservado	Aplicación en UX07
Product Spec v0.5	Academic Data Layer como core; realidad académica probabilística; provenance y vigencia; Modo Examen core; Academic Decision Engine prioriza; no duplicar herramientas; humano donde agrega valor	fuente/status visibles; pantalla no calcula ni rankea; sin calendario; sin aprobación humana; activación no promete resultado
User Flow + Wireframes + Data Model v0.2	Materia persistente; múltiples ExamPreparation por evaluaciones; WF-S09/WF-S10; default 14 días; manual antes; recomendación anticipada del Engine; Assessment/ExamPreparation y campos; lifecycle; eventos; modalidades P0	ID canónico; recomendación automática RECOMMENDED; CTA del alumno → ACTIVE; manual contextual; práctico/teórico escrito
Hoy/Autogestión v1.0	TodayView read projection; Academic Decision Engine entrega prioridad; EXAM_MODE_ACTIVE es contexto; Assessment.date puede faltar; no outcomes anticipados	entrada desde Hoy sólo con señal resuelta; sin ranking; sin countdown si falta fecha; siguiente evento real
Materia/Cursado v1.0	CourseEnrollment persistente; tab EXAMEN sólo con Assessment relevante/ExamPreparation; próximo sin calendario; Assessment + CourseOffering; provenance; retorno Examen→Cursado	entrada autorizada; Assessment concreta; CourseOffering para desambiguar; Cursado persiste; alta sin Assessment queda SCP
Próxima Acción v1.0	pantalla no decide prioridad; contexto Cursado/ExamPreparation sin duplicar; provenance obligatoria para dato estimado/reportado/disputado; próximo evento real	WF-S09 no crea Action; razón propietaria; source/status legibles; handoff limitado
Compromiso v1.0	contexto ExamPreparation puede coexistir; timezone autoritativa; confirmación idempotente/reconciliación; no exponer objeto confirmado antes del CTA	timezone/date prudentes; ACTIVE sólo autoritativo; duplicación y respuesta incierta tratadas sin reintento ciego; no crea Commitment
Evidencia v1.0	Evidence lifecycle separado de ejecución/producción/dominio; validación no implica dominio; handoffs reales	activar no crea Evidence ni demuestra dominio; no revisión humana inventada; sin progreso anticipado
Progreso/Bitácora v1.0	sólo cambio confirmado se muestra como progreso; provenance/status completos; no causalidad inventada; Materia/Bitácora continúan	activación no resetea ni modifica cinco dimensiones; Bitácora persiste; no se muestra progreso como efecto de activar
	34.1. Self-audit final

Criterio	Resultado
No diseña Modo Examen completo	PASS
Activation ≠ preparación/dominio/readiness	PASS
Materia/Cursado persiste	PASS
Assessment concreta, no activación global	PASS
TodayView no prioriza	PASS
Academic Decision Engine conserva ownership	PASS
UI no inventa trigger/algoritmo	PASS
Provenance y verification preservados	PASS
Sin duplicación funcional	PASS CON SCP-07/SCP-11
Sin aprobación de operador	PASS
Sin campos obligatorios nuevos	PASS CON SCP-13
Sólo modalidades P0 diseñadas	PASS
Sin Engine/entidad/estado/evento nuevo	PASS
CTA describe consecuencia real	PASS
360 px responde seis preguntas	PASS documental
Recomendación automática inequívoca	PASS — RECOMMENDED → CTA → ACTIVE
Manual sin Assessment no se presenta como operación	PASS CON SCP-09/SCP-10 preservados
Producción segura e idempotente	BLOCKED POR SCP-06/SCP-07
	Estado del documento

READY FOR LEAD PRODUCT OWNER REAUDIT. Los tres P1 fueron corregidos de forma localizada. Los contratos de owner, elegibilidad, fecha/timezone, idempotencia y alta futura continúan SOURCE CONTRACT PENDING; no fueron resueltos silenciosamente. No está listo para UI high-fi ni implementación productiva hasta cerrar los contratos técnicos bloqueantes aplicables al baseline.


***

VI.8 — Modo Examen / Overview


ACHIEVE — MODO EXAMEN / OVERVIEW

FUNCTIONAL WIREFRAME v0.2 CANDIDATE

Sprint: UX08 — Modo Examen / Overview  
Wireframe: WF-S10 — Modo Examen / Overview  
Estado: CANDIDATE PARA REAUDITORÍA DEL LEAD PRODUCT OWNER  
Fecha: 24 de agosto de 2026

Alcance de esta revisión: corrección exclusiva de los tres findings P1 de ACHIEVE_MODO_EXAMEN_OVERVIEW_PRODUCT_OWNER_AUDIT_v0.1.md. La auditoría no registró findings P0 ni P2. No se rediseña WF-S10, no se modifica el JTBD y no se resuelve ningún SOURCE CONTRACT PENDING.

***
1. RESUMEN EJECUTIVO

WF-S10 es una proyección de orientación para una ExamPreparation ya activada. Identifica la evaluación, expone el estado operativo que realmente requiere atención, presenta una única CTA con destino existente, ubica al estudiante dentro del recorrido sólo cuando existe una lectura autoritativa y mantiene el retorno al CourseEnrollment de origen.

El Overview no decide prioridad académica, no emite ActionRecommendation, no calcula etapas, no valida Evidence, no actualiza Progress, no calcula readiness y no ejecuta el contenido interno del Protocolo.

La lectura cerrada de fuentes determina:

UX07 entrega identidad, contexto, status y datos vigentes de Assessment; no entrega plan, fase, Action, recorrido ni readiness.
La arquitectura documentada de 12 pasos es provisional. La propia fuente prohíbe hardcodearla y deja secuencia, contenido, entregables y criterios definitivos pendientes de psicopedagogía.
ProtocolStep, ProtocolArtifact y ProtocolStepCompleted permiten configuración, pero no están congelados el contrato de instancia, el paso actual, el estado por paso, la condición de entrada/salida ni la ruta a WF-S11. Quedan SOURCE CONTRACT PENDING.
Existe ambigüedad estructural entre ExamPreparation.status —que incluye BUILDING, READY_BY_PROTOCOL y NOT_READY— y la entidad separada PreparationReadiness, que usa los mismos conceptos. Se registra CR-UX08-01.

Baseline seguro:

muestra Assessment, Course/CourseOffering, fecha, modalidad, status y provenance;
aplica precedencia operativa sobre objetos existentes;
muestra recorrido sólo con fuente propietaria;
degrada honestamente cuando no existen Action, paso o destino;
UNDER_REVIEW nunca es avance confirmado;
MISSED nunca se borra por Evidence tardía;
no bloquea la preparación esperando una persona.

***
2. FUENTES Y VERSIONES

Se localizaron y leyeron completamente, usando sólo la versión exacta:

ACHIEVE_MVP_USUARIO_PRODUCT_SPEC_v0.5_FINAL.docx
ACHIEVE_USER_FLOW_WIREFRAMES_DATA_MODEL_v0.2_FINAL.docx
ACHIEVE_HOY_AUTOGESTION_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_PROXIMA_ACCION_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_COMPROMISO_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_EVIDENCIA_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_PROGRESO_BITACORA_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_ACTIVACION_MODO_EXAMEN_FUNCTIONAL_SPEC_v1.0_APPROVED.md

Existe una copia del Product Spec con sufijo (1). No se utilizó: se adoptó el archivo canónico sin sufijo. No se usaron candidates, auditorías, versiones anteriores ni memoria no documentada.

2.1. Jerarquía aplicada

Product Spec v0.5: visión, principios y ownership de Engines.
User Flow/Data Model v0.2: flujos, entidades, estados, eventos y arquitectura de protocolo.
Functional Specs APPROVED: contratos posteriores y específicos.
UX07 APPROVED: contrato inmediato de entrada.

Una necesidad no congelada se conserva como SOURCE CONTRACT PENDING.

***
3. JTBD

Cuando entra a una preparación activa, el estudiante necesita orientarse sin reconstruir el proceso ni interpretar datos complejos.

En menos de 10 segundos debe responder:

qué examen prepara;
cuándo rinde;
cuál es su estado operativo;
qué requiere atención;
qué está confirmado;
qué no está demostrado;
cuál es la acción principal;
qué ocurrirá después;
cómo vuelve a la materia.

La degradación honesta satisface mejor el JTBD que una etapa, recomendación o porcentaje inventados.

***
4. ALCANCE

Incluye exclusivamente:

identidad de ExamPreparation y Assessment;
Course/CourseOffering, cátedra/comisión cuando desambigua;
fecha, modalidad y provenance;
ExamPreparation.status autoritativo;
countdown sólo con cálculo propietario;
estado operativo vigente y una CTA;
ActionRecommendation ya emitida;
Action, Commitment, Evidence y Progress existentes;
ubicación en protocolo configurado sólo con lectura autoritativa;
hitos completados y siguiente hito sólo si el owner los confirma;
retorno al mismo CourseEnrollment;
degradaciones y handoff limitado a UX09.

***
5. FUERA DE ALCANCE

No se diseñan contenido o formularios del paso, mapa detallado, diagnóstico, plan de 72 horas, calendario, producción diaria, práctica sin ayuda, autocorrección, ErrorMap, simulacro, carga/validación de Evidence, creación/renegociación de Commitment, algoritmo de readiness, predicción, nota, cierre, recursos completos, chat, CRM, operador, institución, gamificación, notificaciones, edición de Assessment, selector global ni protocolo oral.

Los destinos aprobados pueden abrirse como handoff; no se replican dentro de WF-S10.

***
6. DECISIONES CONGELADAS

Una ExamPreparation corresponde a una Assessment y estudiante concretos.
CourseEnrollment y Materia/Cursado persisten.
Pueden existir múltiples preparaciones, pero este Overview muestra una sola.
WF-S10 no prioriza materias ni evaluaciones.
P0: práctico y teórico escrito. Oral y otras: P1.
Academic Decision Engine conserva prioridad y ActionRecommendation.
TodayView y WF-S10 son proyecciones, no Engines.
La UI no decide etapa, contenido, dominio, readiness, prioridad, salto ni recomendación.
Action, Commitment, Evidence y Progress permanecen separados.
SUBMITTED, UNDER_REVIEW, SUFFICIENT y VALIDATED no equivalen por sí solos a ProgressUpdated.
MISSED conserva el acuerdo original.
Execution, Production y Domain permanecen separados.
Confianza no equivale a Dominio.
Sin datos no es cero.
Provenance/verification permanecen unidos al dato.
La preparación no espera aprobación humana para seguir orientando.
Revisión humana sólo se menciona con método/lifecycle real; sin reviewer, SLA ni feedback inventados.
READY_BY_PROTOCOL no predice aprobación.
No se muestran porcentajes.

***
7. CONTRATO DE ENTRADA DESDE UX07

7.1. Precondición

ExamPreparation releída como ACTIVE o estado posterior;
Assessment, CourseEnrollment y CourseOffering inequívocos;
sin duda de duplicación.

7.2. Payload permitido

identidad canónica de ExamPreparation;
assessment_id;
estudiante implícito/seguro;
CourseEnrollment/CourseOffering;
status;
activated_at, si existe;
Assessment type/date/modality;
provenance vigente.

7.3. No entregado por UX07

No llegan plan, protocolo instanciado, paso actual/siguiente, hitos, ActionRecommendation, Action, Commitment, Evidence, Progress, diagnóstico, readiness, porcentaje, simulacro, ErrorMap ni tareas. WF-S10 los lee de sus owners; no amplía el handoff.

7.4. Falla

Identidad ambigua: no mezclar ni elegir por nombre/fecha; error técnico y VOLVER A CURSADO. Si ACTIVE está confirmado pero WF-S10 falla, la activación persiste.

***
8. DIFERENCIA ENTRE OVERVIEW Y PASO DE PROTOCOLO

Superficie	Pregunta	Responsabilidad	Prohibición
WF-S10	¿Dónde estoy, qué atiendo y qué sigue?	identidad, orientación, precedencia y recorrido resumido	no ejecuta el paso
WF-S11/UX09	¿Qué exige el hito y cómo lo completo?	objetivo, explicación, recurso, entregable y criterio configurados	no decide trabajo del Engine
Academic Decision Engine	¿Qué trabajo concreto conviene?	emite/prioriza ActionRecommendation	no reemplaza protocolo
Exam Protocol	¿Qué hitos deben ocurrir?	estructura configurable por modalidad/versión	no genera la Action concreta
	Paso actual sólo se muestra con fuente propietaria. La CTA abre UX09; no se diseñan campos internos.

***
9. MODELO MENTAL DEL ESTUDIANTE

Tres capas:

Este examen: Assessment, fecha, modalidad y contexto.
Ahora: lifecycle real de Action/Commitment/Evidence/Progress o destino de protocolo.
Recorrido: hitos configurados y confirmados, sin porcentaje universal.

Lectura esperada:

Esta preparación es para Parcial 1 de Análisis II.
La fecha es oficial / reportada / sin verificar.
Ahora debo continuar / atender un Commitment / presentar Evidence / abrir el paso.
Esto está confirmado; aquello todavía no está demostrado.
Mi Cursado sigue existiendo.

Debe impedir: progreso por visitas, dominio por upload, readiness por confianza/fecha/Commitment y reemplazo de Cursado.

***
10. ARQUITECTURA DE INFORMACIÓN

10.1. Orden mobile 360 px

materia y evaluación;
fecha y modalidad;
provenance;
estado operativo;
acción primaria;
ubicación en recorrido;
confirmado;
pendiente/no demostrado;
Cursado;
detalle secundario.

10.2. Bloques

Bloque	Función	Regla
Header	identidad/retorno	Assessment explícita
Fecha/modalidad	orientación	sin cálculo local
Estado	una lectura dominante	lifecycle, no ranking
CTA	conducta real	destino existente
Recorrido	ubicación	sólo autoritativo
Confirmado	hechos cerrados	owner real
Pendiente	límites	ausencia ≠ cero
Cursado	persistencia	mismo CourseEnrollment
Provenance	trazabilidad	no sólo tooltip
	***
11. IDENTIDAD Y CONTEXTO DEL EXAMEN

Dato	Fuente	Campo aprobado	Visibilidad
materia	CourseEnrollment → Course	ids/name	siempre
cátedra	CourseOffering/Instructor	offering/commission/instructor	si desambigua
evaluación	Assessment	id/type	siempre
fecha	Assessment	date	valor o desconocida
modalidad	Assessment	modality conceptual	valor o desconocida
preparación	ExamPreparation	assessment_id, student_id, activated_at, status	siempre
	11.1. Fecha y días

Fecha con provenance/status.
Faltan N días, Hoy rendís o La fecha ya pasó sólo con owner temporal.
El frontend no resta fechas.
Fecha desconocida/disputada: sin countdown.
Fecha modificada: vigente y anterior sólo si el owner los entrega.
Fecha pasada no cambia localmente el status.

11.2. Modalidad

Valor	Tratamiento
Práctico	P0; protocolo configurado si existe
Teórico escrito	P0; protocolo configurado si existe
Oral/otra/mixta	valor real + fuera de P0
Desconocida	sin protocolo inventado
	Enum técnico: SOURCE CONTRACT PENDING.

***
12. RECORRIDO RESUMIDO

12.1. Auditoría del recorrido

El Design Spec registra una arquitectura provisional:

EP-01 Cerrar contrato del examen;
EP-02 Baseline;
EP-03 Blindar capacidad;
EP-04 Kit de recursos;
EP-05 Cobertura;
EP-06 Primera prueba sin red;
EP-07 Mapa de errores;
EP-08 Práctica tipo examen;
EP-09 Cerrar brechas;
EP-10 Simulación final;
EP-11 Preparación final;
EP-12 Rendida y postmortem.

La fuente la declara provisional y pendiente de psicopedagogía. Por eso se conserva sólo como trazabilidad: no se hardcodea, no se muestra como definitiva, no deriva paso actual y no habilita 5/12 ni porcentajes.

12.2. Condición para mostrarlo

Se requiere ExamProtocol/version asociados, ProtocolSteps ordenados, resultado por preparación, current/next inequívocos, visibilidad y destino UX09. Si falta toda la instancia:

> El recorrido de esta preparación todavía no está disponible.

ACTIVE persiste y Cursado no se bloquea.

12.3. Semántica visible

Las fuentes no congelan un enum de estado por ProtocolStep; WF-S10 no crea uno.

Hecho	Fuente	Entrada	Salida	Evidence	Owner	UI confirma	No demuestra
hito configurado	ExamProtocol + ProtocolStep	incluido en versión	n/a	según configuración	protocolo SCP	nombre/orden	inicio/cierre
hito completado	ProtocolStepCompleted o lectura equivalente	owner confirma cierre	histórico	Artifact/Evidence si existe	protocolo	Completado factual	dominio/readiness
hito actual	contrato current step	owner identifica	owner cambia	sólo si configura	pendiente	Paso actual	prioridad
próximo hito	contrato next step	owner entrega	pasa a actual por owner	sólo si configura	pendiente	Después	habilitación
actividad	Action/Evidence/ProgressEntry	existe actividad	no cierra por sí sola	lifecycle real	owners	Actividad registrada	completion
	Reglas: máximo mobile current + dos completados + next; abrir, leer, cumplir horario, declarar confianza, presentar Evidence sin validación o cambiar otra dimensión no completan un hito. UNDER_REVIEW no cierra.

***
13. MATRIZ DE PRECEDENCIA OPERATIVA

Sólo se consideran objetos vinculados inequívocamente a esta preparación/Assessment o contexto autorizado; no se comparan materias.

Orden	Condición	Estado dominante	CTA	Destino	Secundarios
1	Action IN_PROGRESS	trabajo iniciado	CONTINUAR	Action activa	MISSED/review/progreso/recomendación
2	Action EVIDENCE_PENDING	cierre requerido	SUBIR EVIDENCIA	WF-S07	recomendación oculta
3	Commitment CONFIRMED futuro	acuerdo vigente	VER COMPROMISO	detalle	protocolo contextual
3	Commitment DUE	iniciable	EMPEZAR	owner de inicio	no inicio local
3	Commitment STARTED	coordinación con Action	CONTINUAR	Action	inconsistencia = error
4	RESCUE_REQUIRED/MISSED	incumplimiento	RETOMAR	resolución existente	original MISSED
4	rescate real	lifecycle del rescate	CTA del objeto	objeto real	MISSED original
5	Evidence RESUBMISSION_REQUESTED	nueva presentación	PREPARAR NUEVA EVIDENCIA	WF-S07	anterior preservada
6	ActionRecommendation principal	recomendación vigente	COMPROMETERME	WF-S05	no recálculo
7	current step + ruta disponibles, sin gate autoritativo	orientación accionable	ABRIR PASO ACTUAL	UX09	Evidence informativa/ProgressUpdated quedan secundarios
8	Evidence informativa, sin niveles 1–7	lifecycle real	VER EVIDENCIA	detalle canónico de Evidence	sin Progress salvo evento
9a	ProgressUpdated cuyo destino canónico es el resultado de avance, sin niveles 1–8	cambio confirmado	VER AVANCE	WF-S08	changed_dimensions
9b	objeto visible es una ProgressEntry histórica cuyo destino canónico es Bitácora, sin niveles 1–8	actividad histórica	VER BITÁCORA	Bitácora	no atribuir causalidad
10	sin objeto/destino	estado honesto	VOLVER A CURSADO	CourseEnrollment	no genera
	Conflictos:

IN_PROGRESS vence a MISSED previo.
EVIDENCE_PENDING vence a recomendación.
Commitment vigente vence a recomendación.
MISSED vence a recomendación no aceptada.
UNDER_REVIEW queda secundaria ante Action/recomendación válida y ante un paso actual accionable cuando no existe un gate autoritativo.
recomendación vence a ProgressUpdated informativo.
los lifecycles accionables de niveles 1–6 vencen al paso; Evidence meramente informativa y ProgressUpdated no ocultan un paso actual accionable.
si una condición autoritativa del protocolo bloquea la transición durante UNDER_REVIEW, el paso no se presenta como disponible y VER EVIDENCIA puede ser la CTA primaria, sin persona ni SLA inventados.
VER AVANCE y VER BITÁCORA nunca son alternativas locales: cada CTA exige su destino canónico inequívoco. Ante ambigüedad se usa el siguiente fallback operativo aplicable.
varias recomendaciones sin principal = error.
objetos de otra Assessment se excluyen.

***
14. ACCIÓN PRIMARIA

Una sola CTA; mismo objeto y lifecycle autoritativo; destino real; sin outcome anticipado ni saltos.

CTA	Siguiente evento permitido
CONTINUAR	abre Action; terminar solicita cierre/Evidence configurada
SUBIR EVIDENCIA	envío confirmado deja Evidence SUBMITTED
VER COMPROMISO	abre sin iniciar
EMPEZAR	owner coordina STARTED + IN_PROGRESS
RETOMAR	abre resolución; no materializa rescate
PREPARAR NUEVA EVIDENCIA	abre flujo; no sobrescribe
COMPROMETERME	abre Action/aceptación; Commitment se confirma aparte
VER EVIDENCIA	abre sin validar
VER AVANCE	abre el resultado confirmado en WF-S08 sólo cuando ése es el destino canónico recibido
VER BITÁCORA	abre la ProgressEntry histórica en Bitácora sólo cuando ése es el destino canónico recibido
ABRIR PASO ACTUAL	abre UX09; no completa
VOLVER A CURSADO	mismo CourseEnrollment
	***
15. ESTADOS FUNCIONALES

Estado/condición	Lectura	Acción	Límite
ACTIVE recién activada	Preparación activa	lifecycle o retorno	no plan
BUILDING recibido	Preparación en curso	lifecycle	no porcentaje
READY_BY_PROTOCOL recibido	condiciones informadas como cumplidas	destino real	no aprobación
EXAM_TAKEN	evaluación rendida	histórico/retorno	no resultado
CLOSED	preparación cerrada	historia/retorno	no postmortem nuevo
NOT_READY	valor + explicación propietaria	objeto/retorno	no causa local
BLOCKED	causa sólo si owner	CTA real/retorno	no bloqueo local humano
ABANDONED	histórico factual	retorno	no reactivar
recomendación	objeto del Engine	comprometerme	no recálculo
IN_PROGRESS	Action	continuar	no alternativa
Commitment	state real	ver/empezar	no timer
MISSED	original	retomar	Evidence no borra
Evidence requerida	EVIDENCE_PENDING	subir	handoff
UNDER_REVIEW	en revisión	paso actual si está disponible y no hay gate; si no, ver Evidence	no progreso
ProgressUpdated	changed_dimensions	paso actual si está disponible; en su ausencia, CTA del destino canónico inequívoco	no arrastre ni destino local
sin recomendación	honesto	step/retorno	no generar
sin recorrido	honesto	CTA real/retorno	ACTIVE persiste
	***
16. MATRIZ DE ESTADOS CRÍTICOS

#	Estado obligatorio	Resolución
1	ACTIVE recién activada	identidad + activa; sin asumir paso
2	ACTIVE + Recommendation	COMPROMETERME
3	ACTIVE + IN_PROGRESS	CONTINUAR
4	ACTIVE + Commitment vigente	ver/empezar según state
5	ACTIVE + MISSED	RETOMAR, original visible
6	ACTIVE + Evidence requerida	SUBIR EVIDENCIA
7	UNDER_REVIEW	sin progreso; secundaria si hay paso disponible sin gate; primaria sólo si el gate real deja el paso no disponible
8	ProgressUpdated	sólo changed_dimensions; no oculta paso disponible; CTA según destino canónico inequívoco
9	sin Recommendation	paso real o retorno
10	sin recorrido	copy honesto
11	fecha confirmada	oficial/corroborada
12	fecha reportada	reportado por vos, sin verificar
13	fecha estimada	estimado, sin verificar
14	fecha desconocida	sin countdown
15	fecha modificada	vigente + anterior si existe
16	próxima	relativo sólo con owner
17	en el día	Hoy rendís sólo autoritativo
18	pasada sin cierre	fecha factual, status preservado
19	práctico	P0
20	teórico escrito	P0
21	oral/fuera P0	valor real, sin protocolo P0
22	confianza alta + dominio bajo	separadas; no Action local
23	datos contradictorios	versiones separadas
24	datos no disponibles	error + reintentar
25	varias preparaciones	esta aislada; sin ranking
26	status posterior	sólo valor recibido
27	handoff disponible	abrir paso
28	handoff no disponible	retorno honesto
	***
17. REGLAS DE PROGRESO Y NO PROGRESO

SUBMITTED = recibido, no progreso.
UNDER_REVIEW = revisión, no progreso.
SUFFICIENT = criterio mínimo, no ProgressUpdated.
VALIDATED = cierre, no dominio ni cambio dimensional.
Sólo ProgressUpdated o lectura autoritativa equivalente habilita cambio.
Mostrar sólo changed_dimensions.
Sin snapshot anterior, no comparación inventada.
Sin outcome explícito, no decir No cambió.
Falla no es no-cambio.
MISSED persiste ante Evidence tardía.
Actividad puede mostrarse como actividad.
Sin información no es 0%.

Copies:

Todavía no hay un cambio de progreso confirmado.
No pudimos cargar el progreso. Tu evidencia conserva su estado.
Dentro de CAMBIO CONFIRMADO aparecen exclusivamente dimensiones cambiadas.

***
18. REGLAS DE READINESS

Las fuentes definen PreparationReadiness como estado operativo, no probabilidad, con NOT_READY → BUILDING → READY_BY_PROTOCOL y umbrales pendientes. También incluyen esos valores en ExamPreparation.status. La duplicación genera CR-UX08-01.

WF-S10:

no calcula readiness;
no muestra score/porcentaje;
no deriva por fecha, visitas, confianza, Commitments o Evidence no validada;
no crea card hasta resolver owner;
si recibe status = READY_BY_PROTOCOL, muestra:

> La fuente de preparación informa que cumpliste las condiciones del protocolo vigente. Esto no predice ni garantiza el resultado.

no usa Listo para rendir;
no transforma ACTIVE en BUILDING;
umbrales = SOURCE CONTRACT PENDING.


***
19. REGLAS DE PROVENANCE Y verification_status

19.1. Metadata preservada

Cuando aplica: source_type, source_ref, observed_at, valid_from/valid_until, term/offering, confidence académico, verification_status, uploaded_by y derechos.

19.2. Labels humanos

Fuente/estado	Copy
cátedra/institución + official	Cátedra · oficial / Institución · oficial
fuente + corroborated	{Fuente} · corroborado
student + unverified	Reportado por vos · sin verificar
inference + unverified	Estimado por Achieve · sin verificar
disputed	Dato en revisión · hay versiones distintas
no disponible	Fuente/estado no disponible
	Reglas:

un rótulo grupal sólo cubre campos con provenance, vigencia y verification idénticos;
una fecha reportada nunca parece oficial;
activar no eleva verification;
enums técnicos no son copy principal;
provenance crítica no queda sólo en tooltip/hover;
datos contradictorios permanecen separados;
si falta provenance y el dato puede engañar, se omite o se muestra neutral;
ProgressUpdated no eleva verification de datos académicos.

***
20. RELACIÓN CON MATERIA/CURSADO

20.1. Entrada y retorno

Entradas válidas: CURSADO | EXAMEN, HOY con objeto inequívoco, UX07 después de ACTIVE y reapertura de la misma ExamPreparation.

VOLVER A CURSADO reabre el mismo CourseEnrollment. No resetea Recorrido, Práctica, Dominio, Confianza, Recencia, Bitácora, Actions, Commitments ni Evidence.

20.2. Separación visual

header EXAMEN · {Assessment};
retorno explícito a Course;
progreso de materia sólo secundario;
Cursado no se vuelve etapa de examen;
progreso previo no se convierte automáticamente en protocolo;
reutilización de historia sólo con relaciones propietarias.

***
21. HANDOFF HACIA UX09

21.1. Precondiciones

ExamPreparation inequívoca;
ProtocolStep actual autoritativo;
ExamProtocol/version asociados;
paso visible;
ruta existente;
ningún objeto accionable de niveles 1–6;
ninguna condición autoritativa del protocolo que impida abrir el paso.

21.2. Payload conceptual

Reutiliza identidades de ExamPreparation, ProtocolStep, Assessment y CourseEnrollment; versión/modalidad sólo si el owner las entrega. Ruta y payload exactos = SOURCE CONTRACT PENDING.

No agrega formulario, contenido, recursos, Evidence draft, criterio ni estado.

CTA: ABRIR PASO ACTUAL.

> Abrimos el paso vigente. Abrirlo no lo completa.

Si el destino falla, se conservan ACTIVE y el paso; retorno a Cursado.

UNDER_REVIEW o un ProgressUpdated meramente informativos no desplazan este handoff. Si la fuente autoritativa confirma que la revisión integra una condición de transición, el paso no se declara disponible; WF-S10 muestra el lifecycle factual y no inventa responsable, aprobación humana ni plazo.

***
22. JERARQUÍA VISUAL

22.1. Mobile

Primer viewport: Course + Assessment; fecha/modalidad; provenance; estado operativo; única CTA.

Segundo viewport: recorrido; confirmado; pendiente; Cursado; provenance ampliada.

El estado principal nunca queda detrás de tabs, acordeones, tooltips, hover o modal.

22.2. Desktop

Columna principal: identidad, fecha/modalidad, estado, CTA y “Después”. Columna secundaria: recorrido, confirmado/pendiente y Cursado. Una sola CTA visual primaria. El ancho extra no agrega plan, analytics ni contenido de protocolo.

22.3. Accesibilidad

Texto más iconografía, no color solo; traducción de labels; foco en identidad/estado; CTA anuncia destino; nombres largos envuelven sin truncar Assessment crítica.

***
23. MICROCOPY

Situación	Copy
ACTIVE	PREPARACIÓN ACTIVA
IN_PROGRESS	ACCIÓN EN CURSO
Evidence requerida	FALTA PRESENTAR EVIDENCIA
UNDER_REVIEW	EVIDENCIA EN REVISIÓN
MISSED	COMPROMISO INCUMPLIDO
ProgressUpdated	CAMBIO CONFIRMADO
sin Recommendation	TODAVÍA NO HAY UNA PRÓXIMA ACCIÓN
sin recorrido	RECORRIDO TODAVÍA NO DISPONIBLE
contradicción	HAY DATOS CONTRADICTORIOS
error	NO PUDIMOS CARGAR LA PREPARACIÓN
modalidad P1	RECORRIDO FUERA DE P0
	Permitido:

Confirmado: Práctica +7 ejercicios.
Pendiente: Dominio no evaluado.
En revisión: todavía sin cambio de progreso confirmado.
Actividad registrada; hito todavía no confirmado.

Prohibido: Ya dominás, Listo para rendir, Preparación 60%, Casi aprobado, confianza como dominio, operador habilitando el paso, etapa elegida por la UI y No avanzaste por ausencia de datos.

***
24. WIREFRAMES MOBILE 360 PX

Son wireframes funcionales, no high-fi. La provenance grupal respalda sólo los campos expresamente incluidos.

24.1. ACTIVE recién activada

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
+--------------------------------------+
| DATOS DE CÁTEDRA · OFICIALES         |
| Fecha: 07 sep 2026                   |
| Modalidad: Práctico                  |
+--------------------------------------+
| PREPARACIÓN ACTIVA                   |
| Todavía no recibimos una Action ni   |
| un paso actual.                      |
| [       VOLVER A CURSADO           ] |
+--------------------------------------+
| RECORRIDO TODAVÍA NO DISPONIBLE      |
| Activar no creó un plan ni cambió    |
| tu progreso de Cursado.              |
+--------------------------------------+

24.2. ActionRecommendation disponible

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
| 07 sep · Práctico                    |
| Cátedra · oficial                    |
+--------------------------------------+
| PRÓXIMA ACCIÓN                       |
| U4 · Resolver ejercicios 12–18       |
| Recomendación vigente para este      |
| examen.                              |
| [         COMPROMETERME            ] |
| Después: abrimos la Action; el       |
| Commitment se confirma aparte.       |
+--------------------------------------+
| Recorrido: sólo datos confirmados.   |
+--------------------------------------+

24.3. Action IN_PROGRESS

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
| 07 sep · Práctico                    |
| Cátedra · oficial                    |
+--------------------------------------+
| ACCIÓN EN CURSO                      |
| U4 · Ejercicios 12–18                |
| [            CONTINUAR             ] |
| Después: al terminar, presentás la   |
| evidencia configurada.               |
+--------------------------------------+
| MISSED anterior: señal secundaria,   |
| si existe.                           |
+--------------------------------------+

24.4. Evidence UNDER_REVIEW

24.4.a. Paso disponible y sin gate autoritativo

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
| 07 sep · Práctico                    |
| Cátedra · oficial                    |
+--------------------------------------+
| PASO ACTUAL DISPONIBLE               |
| Paso configurado vigente             |
| [      ABRIR PASO ACTUAL           ] |
+--------------------------------------+
| EVIDENCIA EN REVISIÓN                |
| Artefacto formal del paso vigente    |
| Todavía sin cambio confirmado.       |
| Ver evidencia                        |
+--------------------------------------+
| Abrir el paso no lo completa.        |
+--------------------------------------+

24.4.b. Gate autoritativo que deja el paso no disponible

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
| 07 sep · Práctico                    |
| Cátedra · oficial                    |
+--------------------------------------+
| EVIDENCIA EN REVISIÓN                |
| Artefacto formal del paso vigente    |
| El siguiente paso todavía no está    |
| disponible.                          |
| [         VER EVIDENCIA            ] |
+--------------------------------------+
| Todavía sin cambio confirmado.       |
| Podés volver a Cursado.              |
+--------------------------------------+

La variante 24.4.b sólo se usa cuando el protocolo autoritativo entrega el gate. No se infiere desde UNDER_REVIEW. Si existe Action, Commitment, rescate o ActionRecommendation de mayor precedencia, su CTA ocupa la acción primaria y la revisión queda secundaria.

24.5. Commitment MISSED preservado

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
| 07 sep · Práctico                    |
| Cátedra · oficial                    |
+--------------------------------------+
| COMPROMISO INCUMPLIDO                |
| Original: 22 ago · 19:00 · 70 min    |
| Ejercicios 8–14                      |
| Todavía no existe rescate concreto.  |
| [             RETOMAR              ] |
+--------------------------------------+
| Evidence tardía no vuelve cumplido   |
| el acuerdo original.                 |
+--------------------------------------+

24.6. ProgressUpdated confirmado

24.6.a. Resultado de avance con WF-S08 como destino canónico

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
| 07 sep · Práctico                    |
| Cátedra · oficial                    |
+--------------------------------------+
| ÚLTIMO CAMBIO CONFIRMADO             |
| Práctica: 12 -> 19 ejercicios        |
| [           VER AVANCE             ] |
+--------------------------------------+
| TODAVÍA NO DEMOSTRADO                |
| Dominio: no evaluado                 |
+--------------------------------------+

24.6.b. ProgressEntry histórica con Bitácora como destino canónico

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
| 07 sep · Práctico                    |
| Cátedra · oficial                    |
+--------------------------------------+
| ACTIVIDAD EN BITÁCORA                |
| Práctica · +7 ejercicios             |
| [          VER BITÁCORA            ] |
+--------------------------------------+
| Estado del paso: no informado.       |
+--------------------------------------+

Dominio queda fuera del cambio porque no está en changed_dimensions. La provenance del cambio se muestra sólo si llega en el payload o en la lectura autoritativa; si no, se usa Último cambio confirmado sin atribución causal. Si el destino es ambiguo, WF-S10 no elige entre WF-S08 y Bitácora: muestra un paso actual accionable si existe o el fallback operativo aplicable.

24.7. Sin acción o destino

+--------------------------------------+
| <- FÍSICA I · CURSADO                |
| EXAMEN · PARCIAL 2                   |
| 10 sep · Teórico escrito             |
| Reportado por vos · sin verificar    |
+--------------------------------------+
| PREPARACIÓN ACTIVA                   |
| Todavía no hay próxima acción ni     |
| paso disponible.                     |
| [       VOLVER A CURSADO           ] |
+--------------------------------------+
| Esta pantalla no genera una Action.  |
+--------------------------------------+

24.8. Fecha no confirmada o contradictoria

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
+--------------------------------------+
| HAY DATOS CONTRADICTORIOS            |
| Fecha cátedra: 07 sep                |
| Cátedra · oficial                    |
| Fecha reportada: 10 sep              |
| Reportado por vos · sin verificar    |
| Dato en revisión · versiones distintas|
| Modalidad: Práctico                  |
| [       VOLVER A CURSADO           ] |
+--------------------------------------+
| Sin countdown. La UI no elige fecha. |
+--------------------------------------+

24.9. Confianza alta + Dominio bajo demostrado

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
| 07 sep · Práctico                    |
| Cátedra · oficial                    |
+--------------------------------------+
| DOS SEÑALES DISTINTAS                |
| Confianza declarada: Alta            |
| Reportado por vos · sin verificar    |
| Dominio demostrado: Bajo             |
| 2/7 correctos sin ayuda              |
| Evidence validada · 20 ago           |
| Presentada por vos                   |
| [       VOLVER A CURSADO           ] |
+--------------------------------------+
| Esto no genera una Action local.     |
+--------------------------------------+

24.10. Modalidad fuera de P0

+--------------------------------------+
| <- HISTORIA CONTEMPORÁNEA            |
| EXAMEN · FINAL                       |
| 15 sep · Oral                        |
| Cátedra · oficial                    |
+--------------------------------------+
| RECORRIDO FUERA DE P0                |
| El protocolo oral no está diseñado.  |
| No lo convertimos a otra modalidad.  |
| [       VOLVER A CURSADO           ] |
+--------------------------------------+
| No requiere aprobación de operador.  |
+--------------------------------------+

24.11. Datos temporalmente no disponibles

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
+--------------------------------------+
| NO PUDIMOS CARGAR LA PREPARACIÓN     |
| No podemos confirmar Action,         |
| recorrido ni progreso ahora.         |
| La activación conserva su estado.    |
| [            REINTENTAR            ] |
+--------------------------------------+
| Volver a Cursado                     |
+--------------------------------------+

24.12. Varias ExamPreparations activas sin priorización

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
| 07 sep · Práctico                    |
| Cátedra · oficial                    |
+--------------------------------------+
| ACCIÓN EN CURSO                      |
| U4 · Ejercicios 12–18                |
| [            CONTINUAR             ] |
+--------------------------------------+
| OTRAS PREPARACIONES ACTIVAS          |
| Esta vista muestra sólo Parcial 1 y  |
| no decide prioridad entre exámenes.  |
| Ver materias                         |
+--------------------------------------+

El aviso sólo existe con colección autorizada; nunca mezcla sus datos.

24.13. Handoff limitado a UX09

+--------------------------------------+
| <- ANÁLISIS II · CURSADO             |
| EXAMEN · PARCIAL 1                   |
| 07 sep · Práctico                    |
| Cátedra · oficial                    |
+--------------------------------------+
| PASO ACTUAL                          |
| Paso configurado vigente             |
| [      ABRIR PASO ACTUAL           ] |
| Después: abrirlo no lo completa.     |
+--------------------------------------+
| RECORRIDO                            |
| Sólo se muestran hitos confirmados.  |
+--------------------------------------+

No hay instrucciones, inputs, recursos ni carga de Evidence.

***
25. WIREFRAME DESKTOP

+--------------------------------------------------------------------------------+
| <- ANÁLISIS II / CURSADO                 EXAMEN · PARCIAL 1                    |
+----------------------------------------------+---------------------------------+
| DATOS DE CÁTEDRA · OFICIALES                 | RECORRIDO VIGENTE               |
| Fecha: 07 sep 2026 · Modalidad: Práctico     | ✓ Hito confirmado A             |
| Comisión A · ExamPreparation ACTIVE          | → Paso actual B                 |
|                                               | Después: todavía no disponible  |
| ACCIÓN EN CURSO                               | Sin porcentaje/lista fija.      |
| U4 · Resolver ejercicios 12–18                |                                 |
| [                CONTINUAR                  ] | ÚLTIMO CAMBIO: Práctica +7      |
| Después: al terminar, presentás Evidence.     | PENDIENTE: Dominio no evaluado  |
| Evidence anterior en review: secundaria       | Fuente/estado: no disponibles   |
+----------------------------------------------+---------------------------------+
| CURSADO PERSISTENTE · cinco dimensiones y Bitácora continúan. [Volver]         |
+--------------------------------------------------------------------------------+

Una CTA primaria; placeholders contractuales, no nombres canónicos; review no es avance; sin readiness/analytics.

***
26. ESTADOS VACÍOS, DESCONOCIDOS, CONTRADICTORIOS Y DE ERROR

Situación	Copy	CTA	Regla
sin Recommendation	Todavía no hay una próxima acción.	step/retorno	no generar
sin protocolo	Recorrido todavía no disponible.	CTA real/retorno	no listar 12
sin current step	Todavía no hay un paso para abrir.	Action/retorno	no elegir
fecha desconocida	Fecha desconocida	lifecycle	sin countdown
modalidad desconocida	Modalidad desconocida	lifecycle	sin variante
provenance faltante	Fuente/estado no disponible	según objeto	no oficial
disputado	versiones separadas	retorno/CTA no afectada	no resolver
progreso sin datos	Sin información suficiente	ver materia	no cero
falla	No pudimos cargar la preparación	REINTENTAR	no empty académico
falla parcial	bloques confirmados + sección fallida	CTA segura	no ocultar
fecha pasada	fecha + status recibido	retorno/destino	no cerrar
ruta UX09 ausente	No pudimos abrir el paso	retorno	no completar
múltiples recommendations	error técnico	reintentar	no rankear
	***
27. CONTRATOS Y OWNERSHIP

27.1. Matriz

Dato/CTA	Fuente	Campo	Owner escritura	Proyección	Condición/efecto	Si falta
preparación	ExamPreparation	assessment_id, student_id, activated_at, status	Plataforma; técnico SCP	WF-S10	ACTIVE/posterior	error
Assessment	Assessment	id, offering_id, type, date, modality, scope	Academic Data Layer	WF-S10	identidad	bloquear ambigüedad
materia	CourseEnrollment/Course	ids/name	Plataforma	WF-S10	retorno	error
cátedra	CourseOffering/Instructor	commission/instructor	Academic Data	WF-S10	desambiguar	omitir
fecha	Assessment	date	Academic Data	WF-S10	provenance	unknown
días	SCP	no cerrado	temporal SCP	WF-S10	cálculo owner	omitir
modalidad	Assessment	conceptual	Academic Data	WF-S10	P0/P1	unknown
protocolo	ExamProtocol	modality/version	protocolo SCP	WF-S10	asociación	ocultar
hito	ProtocolStep	sequence/type/criterion/required	protocolo SCP	WF-S10	configurado	no hardcode
artefacto	ProtocolArtifact	step_id/artifact_type/evidence_id	protocolo/Evidence SCP	WF-S10	relación real	omitir
completion	ProtocolStepCompleted/lectura	payload SCP	protocolo	WF-S10	cierre confirmado	no afirmar
current/next	SCP	no cerrado	protocolo	WF-S10	ubicación/UX09	omitir
Recommendation	ActionRecommendation	reason/priority/generated_at	Decision Engine	WF-S10	principal	no elegir
Action	Action	verb/scope/objective/status	Action owner	WF-S10	detalle/ejecución	error
Commitment	Commitment	action_id/start_at/planned_minutes/state	Commitment owner	WF-S10	detalle/inicio	no inferir
Evidence	Evidence	action_id/content/lifecycle_state/signals	Evidence System	WF-S10	detalle	no inferir
Progress	ProgressUpdated/TopicProgress	changed_dimensions; payload SCP	progreso	WF-S10	WF-S08	pendiente
confianza	TopicProgress/Reflection	confidence	estudiante/owner	WF-S10	autorreporte	omitir
dominio	TopicProgress	domain	Evidence/progreso	WF-S10	prueba aplicable	no evaluado
readiness	ExamPreparation y/o PreparationReadiness	status o state, required_steps, evidence_status, autonomous_practice, simulation, critical_gaps	ambiguo, CR-UX08-01	WF-S10	sin card	omitir
abrir paso	ProtocolStep + preparación	ruta SCP	no muta	WF-S10	UX09	retorno
volver	CourseEnrollment	id	no muta	WF-S10	Cursado	error de identidad
	Toda provenance usa las reglas de §19. Campos desactualizados invalidan countdown/CTA afectada y fuerzan relectura; no se decide localmente.

27.1.1. Contrato explícito de CTAs

CTA	Fuente/entidad	Campo/estado habilitante	Owner de escritura	Owner de proyección	Provenance	Visibilidad	Destino	Si falta	Si está desactualizado
CONTINUAR	Action	status=IN_PROGRESS	owner de Action	WF-S10	identidad/lifecycle canónicos	nivel 1	Action activa	no CTA	releer; no continuar versión vieja
SUBIR EVIDENCIA	Action + Evidence contract	EVIDENCE_PENDING	Action/Evidence owners	WF-S10	Action y requisito, si existe	nivel 2	WF-S07	omitir requisito; bloquear si destino ambiguo	releer Action/Evidence
VER COMPROMISO	Commitment	CONFIRMED	owner de Commitment	WF-S10	horario/state histórico	nivel 3	detalle canónico	no CTA	mostrar state vigente
EMPEZAR	Commitment	DUE autoritativo	owner Commitment/Action	WF-S10	timezone/state owner	nivel 3	inicio coordinado	no calcular due	detener si cambió
RETOMAR	Commitment	MISSED/RESCUE_REQUIRED	owner de Commitment	WF-S10	original completo	nivel 4	resolución existente	retorno; no rescate inventado	preservar original y releer
PREPARAR NUEVA EVIDENCIA	Evidence	RESUBMISSION_REQUESTED	Evidence System	WF-S10	Evidence anterior/razón real	nivel 5	WF-S07	no CTA	abrir state actual
COMPROMETERME	ActionRecommendation + Action	principal + Action RECOMMENDED	Academic Decision Engine/Action owner	WF-S10	razón/provenance cuando existe	nivel 6	WF-S05	no elegir otra	releer recomendación
ABRIR PASO ACTUAL	ExamPreparation + ProtocolStep	current step + ruta disponibles, sin gate autoritativo	owner de protocolo, SCP	WF-S10	protocolo/version/vigencia	nivel 7	UX09	continuar con siguiente fallback	invalidar handoff y releer
VER EVIDENCIA	Evidence	lifecycle informativo y sin paso disponible; o gate autoritativo durante review	Evidence System	WF-S10	actor/canal/tiempo si existen; omitir si faltan	nivel 8	detalle canónico de Evidence	siguiente fallback; no inventar gate	mostrar lifecycle actual
VER AVANCE	ProgressUpdated/Progress	cambio autoritativo cuyo destino canónico recibido es el resultado de avance	owner de progreso	WF-S10	provenance del cambio si llega; si no, Último cambio confirmado sin causalidad	nivel 9a	WF-S08	no elegir otro destino; siguiente fallback	releer; no mostrar snapshot viejo como actual
VER BITÁCORA	ProgressEntry	objeto histórico cuyo destino canónico recibido es Bitácora	owner de progreso/Bitácora	WF-S10	provenance de la entrada si llega; si no, actividad sin causalidad	nivel 9b	Bitácora	no elegir otro destino; siguiente fallback	releer entrada; no presentarla como actual
VOLVER A CURSADO	CourseEnrollment	id inequívoco	no muta	WF-S10	no aplica	fallback	Materia/Cursado	error de identidad	reabrir identidad vigente
	27.2. Read model funcional

ExamPreparationOverviewView                 # DERIVED READ MODEL
  exam_preparation { canonical_reference, status, activated_at? }
  academic_context
    course_enrollment
    course_offering?
    assessment { type, date?, modality?, provenance[] }
  temporal_context? { days_remaining?, relative_label? } # SCP
  operational_primary?
    { source_entity_type, source_entity_id, lifecycle,
      title, reason?, cta_semantic, destination, next_event_summary? }
  secondary_signals[]
  protocol_summary?
    { protocol_version?, current_step?, completed_steps[]?,
      next_step?, ux09_destination? }                   # SCP
  confirmed_facts[]
  pending_facts[]
  progress_result? { changed_dimensions[]?, current_values? }
  other_preparations_notice?                           # SCP
  data_freshness?                                      # SCP

No define tabla, API, estado ni entidad persistida.

***
28. CRITERIOS DE ACEPTACIÓN

28.1. Producto/PO

se limita al Overview;
ExamPreparation/Assessment inequívocas;
Engine conserva prioridad;
no emite Recommendation;
una CTA y destino;
precedencia aprobada;
Cursado persiste;
evaluaciones no se mezclan;
no espera operador;
oral sin protocolo P0.

28.2. Protocolo

no hardcodea 12 pasos;
sólo pasos configurados;
current/next del owner;
abrir no completa;
actividad no es completion;
UNDER_REVIEW no cierra;
UX09 no se diseña aquí.

28.3. Lifecycles/progreso

IN_PROGRESS domina;
EVIDENCE_PENDING domina Recommendation;
Commitment conserva CTA;
MISSED persiste;
rescate real;
UNDER_REVIEW no es Progress;
VALIDATED no es Domain;
sólo changed_dimensions;
ausencia de evento no es no-cambio.

28.4. Data/readiness/mobile

provenance inmediata;
reporte estudiantil sin verificar;
sin countdown sin contrato;
sin cero por ausencia;
disputado no se resuelve localmente;
sin score/porcentaje/readiness derivada;
READY_BY_PROTOCOL no promete aprobación;
estado y CTA visibles en 360 px.

***
29. TEST DE COMPRENSIÓN DE 10 SEGUNDOS

Preguntas:

¿Qué examen?
¿Cuándo y con qué confiabilidad?
¿Estado operativo?
¿Qué atender?
¿CTA y destino?
¿Confirmado?
¿No demostrado?
¿Ubicación en recorrido?
¿Qué pasa después?
¿Cómo vuelve a Cursado?

PASS: 10/10; cero confusiones Evidence/Progress, Confianza/Dominio, readiness/aprobación o fuente oficial; Cursado identificado como persistente.

Variantes: recién activa sin recorrido, IN_PROGRESS, UNDER_REVIEW, MISSED, ProgressUpdated limitado, fecha reportada/disputada, oral, UX09 disponible, sin destino y varias preparaciones.

***
30. CASOS LÍMITE

Caso	Resolución
misma Assessment en offerings	offering_id
preparaciones duplicadas	error; no elegir/mergear
fecha cambia abierta	invalidar countdown/releer
fecha cambia tras ACTIVE	conservar; no duplicar
modalidad pasa a oral	valor real; retirar P0
fecha pasada + ACTIVE	no cerrar
EXAM_TAKEN sin resultado	no nota
CLOSED sin postmortem	no inventar
BLOCKED sin causa	no inventar
reviewer sin assignment	omitir identidad
review sin SLA	omitir plazo
Evidence tardía cambia práctica	mostrar cambio + MISSED
Progress cambia práctica no dominio	dominio fuera de cambio
confianza sin ProgressUpdated	autorreporte, no cambio
recommendations sin principal	error
Action de otra Assessment	excluir
Action de Cursado sin vínculo	no atribuir al examen
completion sin artefacto visible	sólo si owner confirma
protocolo/version cambia	vigente sin reescribir historia
falla UX09	no completar
otras preparaciones	no ranking/mezcla
nombre largo	wrap
	***
31. RIESGOS

Riesgo	Mitigación
hardcodear pasos provisionales	configuración versionada
mostrar 5/12	hitos sin ratio
Overview como Engine	consume principal
review domina/bloquea	otro lifecycle válido puede dominar
READY parece aprobación	copy + sin score
fecha reportada oficial	label inmediato
countdown local	owner temporal
actividad parece completion	evento/owner
Evidence parece Progress	gating
MISSED desaparece	original
confianza parece dominio	separar
mezcla de preparaciones	scope
CTA sin ruta	retorno
error parece académico	copy técnico
datos stale	freshness/relectura
	***
32. SOURCE CONTRACT PENDING

ID	Contrato	Fallback	Bloquea
UX08-SCP-01	asociación ExamPreparation–ExamProtocol/version	ocultar recorrido	recorrido
UX08-SCP-02	instancia/orden ProtocolSteps	no listar	recorrido
UX08-SCP-03	resultado por paso	sólo hechos explícitos	completion
UX08-SCP-04	current/next owner/campo	no disponible	ubicación/UX09
UX08-SCP-05	entrada/salida y artefacto definitivo	omitir	completion
UX08-SCP-06	Artifact/Evidence/validation → completion	pendiente	completion
UX08-SCP-07	ruta/payload UX09	retorno	handoff
UX08-SCP-08	protocolo definitivo P0	no congelar provisional	protocolo
UX08-SCP-09	timezone/corte/date-datetime	fecha sola	countdown
UX08-SCP-10	próxima/hoy/pasada autoritativas	omitir relativo	labels
UX08-SCP-11	readiness owner canónico	sin card	readiness
UX08-SCP-12	umbrales readiness	no calcular	readiness
UX08-SCP-13	owner técnico ExamPreparation/status	handoff leído	implementación
UX08-SCP-14	freshness/staleness	reintentar/omitir	vigencia
UX08-SCP-15	colección/orden otras preparaciones	omitir aviso	múltiple
UX08-SCP-16	modalidad cambia tras ACTIVE	valor real/retorno	protocolo
UX08-SCP-17	corrección de disputados	sin CTA	contradicción
UX08-SCP-18	payload/snapshot/causalidad ProgressUpdated	sólo confirmado	comparación
UX08-SCP-19	outcome de no-cambio	pendiente	no-cambio
UX08-SCP-20	expected/completion/sufficiency/validation	omitir	detalle
UX08-SCP-21	Evidence–Commitment/rescue_relation	MISSED + no atribución	casos
UX08-SCP-22	reviewer/assignment/SLA	omitir	no
UX08-SCP-23	due/renegotiation/rescue eligibility	consumir state	mutación
UX08-SCP-24	reason–provenance	copy neutral	razón
UX08-SCP-25	deduplicación ProtocolStepCompleted	sin conteo	producción
	Se heredan SCP aplicables de UX07, Próxima Acción, Compromiso, Evidencia y Progreso; no se resuelven silenciosamente.

***
33. CHANGE REQUESTS INEVITABLES

CR-UX08-01 — Owner canónico de PreparationReadiness

Tipo: contradicción estructural.  
Prioridad: P1 arquitectónica antes de readiness visible.

El Data Model:

incluye BUILDING, READY_BY_PROTOCOL y NOT_READY en ExamPreparation.status;
define además PreparationReadiness con state, required_steps, evidence_status, autonomous_practice, simulation y critical_gaps;
usa NOT_READY → BUILDING → READY_BY_PROTOCOL como estados P0 de readiness.

No queda congelado si readiness es entidad/lectura separada, status de ExamPreparation o ambos; tampoco cuál es fuente canónica ni owner.

Impacto: impide una card de readiness y atribuir esas transiciones sin doble verdad. No impide mostrar el status recibido, lifecycles operativos ni baseline ACTIVE.

Resolución requerida por fuente versionada: entidad/campo canónico, owner, relación lifecycle–readiness, mapping, transición e historia. WF-S10 no propone la solución. Hasta cerrar: sin card, score ni cálculo.

33.2. Sin otros Change Requests

Secuencia pedagógica, current step, countdown y ruta UX09 son contratos explícitamente insuficientes, no contradicciones: quedan SCP.

La revisión de artefactos formales es compatible con no bloquear el Overview: Evidence conserva UNDER_REVIEW y el hito no se completa. Sin gate autoritativo, un paso disponible conserva la CTA primaria; con gate autoritativo, el paso no se declara disponible. En ambos casos no se promete persona/SLA y siempre existe retorno.

***
34. TRAZABILIDAD CONTRA FUENTES APROBADAS

Fuente	Decisión	Aplicación
Product Spec v0.5	Engine prioriza; protocolo guía; Evidence separa dimensiones; realidad probabilística	no decide; provenance; sin dominio/readiness inventados
User Flow/Data Model v0.2	materia persistente; múltiples preparaciones; WF-S10/S11; pasos provisionales; entidades/lifecycle/eventos	configuración; no hardcode; UX09; CR readiness
Hoy APPROVED	precedencia; read projection; examen como contexto	matriz operacional
Materia APPROVED	retorno; cinco dimensiones; falsa confianza; CTA lifecycle	Cursado/360/no mezcla
Próxima Acción APPROVED	Recommendation del Engine; contexto examen	CTA/owner
Compromiso APPROVED	lifecycle; MISSED; rescate real	preservación
Evidencia APPROVED	lifecycle; artefacto formal/review; Validated ≠ Domain; tardía	review factual/sin Progress
Progreso/Bitácora APPROVED	ProgressUpdated; changed_dimensions; pending/no-change/error	cambio limitado
Activación Examen APPROVED	handoff mínimo; Assessment concreta; provenance; Cursado	entrada/degradación
	34.1. Self-audit

Criterio	Resultado
no diseña paso interno	PASS
no calcula prioridad/recommendation	PASS
Evidence pendiente no es progreso	PASS
actividad/confianza no son dominio	PASS
MISSED preservado	PASS
readiness no calculado	PASS CON CR-UX08-01
sin porcentaje	PASS
provenance/fecha reportada	PASS
sin datos no es cero	PASS
evaluaciones aisladas	PASS
Cursado persiste	PASS
no bloqueo humano	PASS
sin Engines/entidades/eventos/states nuevos	PASS
CTA real	PASS CON UX08-SCP-07 para UX09
360 px	PASS DOCUMENTAL
recorrido no hardcodeado	PASS CON UX08-SCP-08
	34.2. Trazabilidad de correcciones P0/P1

La auditoría registró 0 P0, 3 P1 y 0 P2. Esta versión aplica sólo los tres P1.

Finding	Corrección aplicada	Secciones verificables	Resultado
UX08-PO-P1-01 — provenance y verification_status incompletos o placeholders técnicos	se agregaron labels humanos inmediatos a fecha/modalidad; se neutralizó la razón sin provenance; se eliminaron owner, según owner y prueba aplicable de la copy estudiantil; ProgressUpdated usa provenance sólo si llega y, si no, Último cambio confirmado sin causalidad; Confianza y Dominio identifican fuentes distintas	§§19, 24.2–24.6, 24.9, 24.12–24.13, 25, 27.1.1	CORREGIDO
UX08-PO-P1-02 — Evidence informativa o ProgressUpdated ocultaban paso disponible	se movió current step + ruta por encima de estados informativos; se separaron variantes UNDER_REVIEW sin gate y con gate autoritativo; el paso disponible conserva ABRIR PASO ACTUAL	§§13–16, 21, 24.4, 33.2	CORREGIDO
UX08-PO-P1-03 — CTA/destino de ProgressUpdated no determinístico	VER AVANCE queda ligado sólo a WF-S08; VER BITÁCORA, sólo a ProgressEntry/Bitácora; ante destino ambiguo WF-S10 no elige y aplica el siguiente fallback existente	§§13–16, 24.6, 27.1.1	CORREGIDO
	No se implementaron cambios P2 ni se cerraron SOURCE CONTRACT PENDING. CR-UX08-01 permanece sin cambios.

Estado final

READY FOR LEAD PRODUCT OWNER REAUDIT.

No está listo para implementación completa del recorrido, UX09, countdown ni readiness hasta cerrar los SCP aplicables y CR-UX08-01.


***

VI.9 — Paso de Protocolo de Examen

ACHIEVE — PASO ACTUAL DEL PROTOCOLO DE EXAMEN

FUNCTIONAL WIREFRAME v0.2 CANDIDATE

Estado: candidato de corrección controlada de v0.1, listo para reauditoría cerrada de Lead Product Owner.  
Fecha: 24 de agosto de 2026.  
Sprint: SPRINT UX09 — PASO ACTUAL DEL PROTOCOLO DE EXAMEN.  
Superficie canónica: WF-S11 — Paso actual del Protocolo de Examen.  
Tipo: especificación funcional y wireframes textuales; no UI high-fi.  
Responsable: Senior Product Designer de Achieve.

***
1. RESUMEN EJECUTIVO

WF-S11 presenta un ProtocolStep actual que ya fue identificado por una fuente autoritativa. Su responsabilidad es permitir que el estudiante entienda el hito, la producción esperada, el criterio configurado, el estado operativo real y la única acción disponible ahora.

La pantalla no decide qué estudiar, no genera trabajo concreto y no completa el paso. ExamProtocol define hitos; Academic Decision Engine conserva la prioridad académica y emite ActionRecommendation. Action, Commitment, Evidence, Progress y la finalización de ProtocolStep continúan siendo verdades separadas.

La arquitectura funcional resuelta es:

identidad inequívoca de preparación, evaluación, materia, protocolo y paso;
objetivo, explicación, recurso, entregable y criterio sólo cuando llegan configurados;
un bloque crítico compacto con objetivo, entregable, criterio, estado, CTA y consecuencia;
una precedencia que reutiliza lifecycles aprobados;
handoffs hacia superficies existentes, sin diseñarlas internamente;
fallbacks honestos ante contenido, identidad, provenance, estado, ruta o datos faltantes;
completion exclusivamente autoritativa;
mismo contenedor para práctico y teórico escrito, sin recorridos hardcodeados;
oral y otras modalidades fuera de P0, sin adaptar silenciosamente un protocolo P0.

Las fuentes aprobadas no congelan:

el campo que identifica current ProtocolStep;
la instancia y el estado por preparación;
los nombres de campos para nombre, objetivo, explicación, recurso o entregable;
la relación exacta ProtocolArtifact/Evidence con completion;
la condición de entrada y salida de cada paso;
el owner técnico de completion;
el siguiente paso;
la ruta y el payload de navegación;
freshness del contenido del protocolo.

Cada punto permanece identificado como SOURCE CONTRACT PENDING. WF-S11 no los resuelve por inferencia.

***
2. FUENTES Y VERSIONES

Se leyeron completamente y se usaron exclusivamente:

ACHIEVE_MVP_USUARIO_PRODUCT_SPEC_v0.5_FINAL.docx
ACHIEVE_USER_FLOW_WIREFRAMES_DATA_MODEL_v0.2_FINAL.docx
ACHIEVE_HOY_AUTOGESTION_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_MATERIA_CURSADO_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_PROXIMA_ACCION_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_COMPROMISO_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_EVIDENCIA_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_PROGRESO_BITACORA_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_ACTIVACION_MODO_EXAMEN_FUNCTIONAL_SPEC_v1.0_APPROVED.md
ACHIEVE_MODO_EXAMEN_OVERVIEW_FUNCTIONAL_SPEC_v1.0_APPROVED.md

Existe una copia del Product Spec con sufijo (1). No se utilizó: se tomó la coincidencia exacta sin sufijo.

2.1. Jerarquía aplicada

Product Spec: visión, principios, ownership del Academic Decision Engine y Evidence System.
User Flow + Data Model: entidades, relaciones, campos mínimos, lifecycles y eventos aprobados.
Functional Specs aprobadas UX01–UX08: contratos UX posteriores, precedencias, semántica, provenance, fallbacks y handoffs congelados.
Este documento: sólo composición funcional de WF-S11 dentro de esos límites.

No se utilizaron candidates, wireframes anteriores, auditorías, borradores ni memoria no documentada para reemplazar una fuente aprobada.

***
3. JTBD

Cuando el estudiante abre el paso actual de su preparación, necesita comprender inmediatamente qué producción concreta se espera y cómo comenzar, sin interpretar estructuras académicas complejas ni depender de un operador.

En menos de 10 segundos debe poder responder:

¿Qué paso estoy haciendo?
¿Cuál es su objetivo?
¿Qué tengo que producir?
¿Cómo sabré si cumple?
¿Qué acción puedo realizar ahora?
¿Qué está pendiente?
¿Qué ocurrirá después?

***
4. ALCANCE

WF-S11 resuelve exclusivamente:

entrada desde ABRIR PASO ACTUAL;
validación de identidades recibidas;
identidad del paso, examen, materia, modalidad y protocolo;
objetivo configurado;
explicación mínima configurada;
Resource configurado y realmente accesible;
entregable esperado configurado;
criterio configurado;
proyección de estados existentes;
una única acción primaria;
consecuencia inmediata de esa acción;
handoff hacia superficies aprobadas;
retorno seguro a WF-S10;
estados incompletos, contradictorios, desconocidos y degradados;
variantes P0 práctico y teórico escrito usando el mismo contenedor.

***
5. FUERA DE ALCANCE

No se diseñan:

secuencia definitiva de 12 pasos;
mapa completo del examen;
diagnóstico completo;
planificación de 72 horas;
agenda diaria;
producción o editor del entregable;
práctica sin ayuda;
autocorrección;
banco de preguntas;
ErrorMap;
simulacro;
formulario completo de Evidence;
validación de Evidence;
creación o renegociación de Commitment;
readiness, Ready to Sit, score, porcentaje o predicción;
cierre, resultado o postmortem;
chat, operador, CRM o analítica institucional;
biblioteca, buscador, gestión de recursos o selector global;
calendario, notificaciones o gamificación;
edición del protocolo.

Cuando un objeto requiere uno de esos flujos, WF-S11 muestra solamente un handoff respaldado.

***
6. DECISIONES CONGELADAS

ExamProtocol define hitos de preparación.
ProtocolStep es un hito configurado dentro de una versión de ExamProtocol.
La arquitectura documentada de 12 pasos es provisional y no puede aparecer como verdad universal.
Academic Decision Engine conserva prioridad académica, reordenamiento y ActionRecommendation.
ProtocolStep no reemplaza ActionRecommendation.
Un objetivo de paso no se transforma en Action.
Action, Commitment, Evidence, Progress y completion son objetos o hechos separados.
Abrir, leer o volver a abrir no crea progreso ni completion.
SUBMITTED y UNDER_REVIEW no son progreso.
SUFFICIENT y VALIDATED no actualizan Progress por sí solos.
Sólo ProgressUpdated o lectura autoritativa equivalente permite mostrar un cambio dimensional.
Commitment MISSED no se reescribe por Evidence tardía.
Execution, Production y Domain permanecen separados.
Confianza declarada no es dominio demostrado.
P0 admite práctico y teórico escrito; oral y otras modalidades quedan fuera de P0.
Modo Examen nunca queda bloqueado esperando un operador.
Revisión humana sólo se menciona cuando existe método, estado y datos reales.
Toda completion visible requiere trigger, owner, fuente, condición de entrada y salida.
El contenido se configura; no se codifica para un paso concreto.
No se agregan Engines, entidades, eventos, estados, enums, roles, métricas, readiness ni contratos técnicos.
Provenance y verification_status se conservan cuando corresponden.
Sin datos no equivale a cero, incumplimiento ni no-cambio.

***
7. HANDOFF UX08 → UX09

7.1. Precondiciones heredadas

ABRIR PASO ACTUAL aparece en WF-S10 sólo cuando existen:

ExamPreparation inequívoca;
Assessment inequívoca;
CourseEnrollment inequívoco;
ProtocolStep actual autoritativo;
ExamProtocol y version asociados;
paso visible;
ruta existente;
ningún objeto accionable de niveles 1–6 de UX08;
ningún gate autoritativo que impida abrir.

7.2. Identidades reutilizadas

WF-S11 recibe o recupera referencias canónicas de:

ExamPreparation;
ProtocolStep;
Assessment;
CourseEnrollment;
ExamProtocol/version cuando el owner las entrega;
modalidad cuando el owner la entrega.

Ruta y payload exactos: SOURCE CONTRACT PENDING.

7.3. Efecto de entrada

Abrir WF-S11:

no completa ProtocolStep;
no emite ProtocolStepCompleted;
no crea ProgressUpdated;
no crea Evidence;
no demuestra Domain;
no cambia readiness;
no avanza current/next;
no crea Action;
no acepta ActionRecommendation;
no crea Commitment.

Copy de entrada permitido:

> Abriste el paso vigente. Abrirlo no lo completa.

La frase sólo describe la navegación de la sesión actual. No crea ni presupone un estado persistido de lectura.

7.4. Falla del handoff

Si alguna identidad deja de ser inequívoca o la versión ya no coincide:

no se mezclan datos por nombre, fecha, orden o similitud;
se invalida el contenido afectado;
se relee desde el owner;
se ofrece VOLVER AL OVERVIEW cuando ExamPreparation sigue inequívoca;
si ExamPreparation tampoco es inequívoca, se usa el retorno seguro a CourseEnrollment sólo cuando su identidad permanece válida.

***
8. PROTOCOLSTEP VS. ACTIONRECOMMENDATION

Concepto	Pregunta	Fuente/owner	Puede priorizar	Resultado
ProtocolStep	¿Qué hito exige el protocolo vigente?	ExamProtocol/version y owner del protocolo, pendiente en detalle	no	objetivo, criterio y producción configurada
ActionRecommendation	¿Qué trabajo concreto tiene mayor valor ahora?	Academic Decision Engine	sí	Action ya emitida con razón y prioridad
Action	¿Qué unidad ejecutable se realiza?	owner de Action	no recalcula prioridad	verbo, alcance, objetivo y lifecycle
	Reglas:

Objetivo del paso ≠ tu próxima acción.
Criterio del paso ≠ completion confirmada.
Un paso puede existir sin ActionRecommendation.
Una ActionRecommendation sólo se muestra si existe previamente y está vinculada inequívocamente al contexto autorizado.
WF-S11 no completa los campos faltantes de una Action usando el contenido del paso.

***
9. PASO, ACTION, COMMITMENT, EVIDENCE Y PROGRESS

Capa	Qué representa	Hecho visible	No implica
ProtocolStep	hito configurado	qué se busca y qué condición se espera	prioridad, ejecución o completion
ActionRecommendation	decisión del Engine	trabajo concreto recomendado y razón	aceptación o Commitment
Action	unidad ejecutable	lifecycle RECOMMENDED/ACCEPTED/COMMITTED/IN_PROGRESS/EVIDENCE_PENDING y estados terminales aprobados	horario acordado o Evidence
Commitment	acuerdo conductual	hora, duración y state real	producción, dominio o progreso
Evidence	presentación canónica	lifecycle EXPECTED a VALIDATED	ProgressUpdated o dominio universal
Progress	dimensiones confirmadas	changed_dimensions de ProgressUpdated o lectura equivalente	completion del paso salvo contrato explícito
Completion del paso	cierre autoritativo del hito	hecho de completion recibido	ProgressUpdated, readiness o aprobación del examen
	Cadena prohibida por inferencia:

ProtocolStep abierto → Action creada → Commitment creado → Evidence creada → Progress actualizado → paso completado.

Cada flecha necesita su propio objeto, owner, transición y contrato real.

***
10. MODELO MENTAL

La pantalla responde cinco preguntas en orden:

Este paso: identidad y objetivo.
Producción esperada: entregable.
Cómo se evalúa: criterio esperado configurado.
Situación real: lifecycle existente o falta de confirmación.
Ahora: una acción y su consecuencia inmediata.

Copy mental:

Objetivo del paso: resultado buscado por el hito.
Tu próxima acción: trabajo emitido por el Academic Decision Engine.
Entregable esperado: producción configurada; no prueba que exista.
Criterio esperado: condición configurada; no confirma que ya se cumplió.
Evidencia entregada: presentación recibida; no dominio.
Evidencia validada: cierre del método aplicable; no ProgressUpdated.
Cambio confirmado: sólo dimensiones recibidas del owner de progreso.
Paso completado: sólo completion autoritativa.

***
11. ARQUITECTURA DE INFORMACIÓN

11.1. Orden mobile 360 px

Antes de recursos secundarios:

retorno a Modo Examen;
materia + evaluación + modalidad;
nombre/label del paso;
ExamProtocol/version si están disponibles;
OBJETIVO;
ENTREGABLE ESPERADO;
CRITERIO ESPERADO;
ESTADO OPERATIVO;
única CTA primaria;
DESPUÉS;
PARA CONTINUAR, cuando la condición autoritativa está disponible;
EXPLICACIÓN;
RECURSO;
provenance, vigencia y datos secundarios.

11.2. Orden desktop

columna principal: identidad, objetivo, entregable, criterio, estado, CTA y después;
columna secundaria: explicación, Resource y provenance;
una sola CTA primaria para toda la pantalla;
los controles secundarios no compiten visualmente.

11.3. Regla de compresión

Objetivo, entregable y criterio se muestran en una frase breve cada uno en el bloque crítico. La explicación puede ampliar debajo. Si el contenido configurado excede el espacio, se adapta tipográficamente o se muestra completo en flujo vertical; no se oculta detrás de tabs, acordeones, hover, tooltips o modal.

***
12. CONTENIDO CONFIGURABLE

12.1. Regla general

WF-S11 renderiza contenido recibido. No autoriza al frontend a derivar, resumir con significado nuevo, completar o corregir contenido pedagógico.

12.2. Disponibilidad contractual

Contenido	Respaldo existente	Campo congelado	Tratamiento
ProtocolStep	entidad aprobada	sequence, type, criterion, required	renderizar sólo valores recibidos
nombre/label	necesidad UX09	no	SOURCE CONTRACT PENDING
objetivo	contenido permitido por handoff UX08/brief UX09	no	SOURCE CONTRACT PENDING
explicación	contenido permitido	no	SOURCE CONTRACT PENDING
Resource	entidad Resource aprobada	id, type, source, rights, url/file	mostrar sólo referencia real
relación Resource–ProtocolStep	necesidad funcional	no	SOURCE CONTRACT PENDING
entregable esperado	ProtocolArtifact respalda artefacto	artifact_type; relación step_id	copy/campo exacto SOURCE CONTRACT PENDING
criterio	ProtocolStep	criterion	renderizar valor recibido sin evaluar localmente
obligatoriedad	ProtocolStep	required	mostrar sólo si el significado operativo está definido
posición	ProtocolStep	sequence	mostrar sólo si el orden de instancia/current está cerrado
	Los ejemplos visuales del documento ilustran valores configurados; no crean catálogo, enum ni contenido obligatorio.

12.3. Variantes P0

Práctico y teórico escrito reutilizan:

misma jerarquía;
mismos contratos;
misma precedencia;
mismos lifecycles;
mismos handoffs;
mismas reglas de completion.

Sólo cambia el contenido configurado. No existe lógica de ruta diferente por modalidad en WF-S11.

***
13. IDENTIDAD DEL PASO

13.1. Identidad mínima visible

materia desde CourseEnrollment/Course;
Assessment concreta;
modalidad real;
nombre o label configurado del paso;
ExamProtocol/version cuando existen;
referencia a ExamPreparation preservada por la navegación, sin mostrar id técnico.

13.2. Posición

ProtocolStep.sequence existe como campo mínimo, pero UX08 dejó pendientes instancia, orden, current/next y deduplicación. Por eso:

no se muestra Paso 5 de 12;
no se calcula porcentaje;
no se usa anterior/siguiente por posición;
una posición sólo se muestra si el owner entrega un orden autoritativo de la versión asociada.

Formato permitido cuando existe contrato:

> Paso actual · posición informada por el protocolo vigente

El número exacto se omite hasta cerrar el contrato de instancia/orden.

13.3. Version

ExamProtocol.version está respaldado. Se muestra:

> Protocolo {version recibida}

No se usa última, vigente o actual salvo que el owner confirme vigencia. Si la versión del paso y la preparación difieren, se entra en estado contradictorio.

***
14. OBJETIVO

El objetivo explica el resultado buscado por el hito.

Reglas:

sólo contenido configurado;
una frase principal visible en el bloque crítico;
puede ampliarse con explicación sin cambiar significado;
no usa verbo operativo para simular una Action;
no agrega tiempo, prioridad, alcance ni recurso desde diseño;
no se convierte en razón del Engine;
si falta: Objetivo de este paso no disponible;
el campo exacto y su owner de escritura son SOURCE CONTRACT PENDING.

Copy de separación:

> Objetivo del paso. No es una próxima acción generada por el Engine.

***
15. EXPLICACIÓN

La explicación aporta la instrucción mínima necesaria para comprender el trabajo configurado.

Reglas:

no crea un curso;
no introduce pasos pedagógicos no configurados;
no reemplaza Action;
no incluye diagnóstico, simulacro, banco de preguntas o editor;
aparece debajo del bloque crítico;
puede omitirse si no está configurada;
si falta, no se inventa copy genérico que cambie el método.

Campo, formato, authoring, versionado y límite de extensión: SOURCE CONTRACT PENDING.

***
16. RECURSOS

16.1. Fuente

Resource está respaldado con id, type, source, rights y url/file. La relación exacta con ProtocolStep no está congelada.

16.2. Regla de render

Un Resource aparece sólo si:

existe una referencia inequívoca;
el destino url/file es utilizable;
source y rights se preservan cuando llegan;
su vínculo con el paso es autoritativo;
la ruta no está desactualizada.

16.3. Tipos

Las fuentes aprueban Resource.type, pero no congelan un enum. WF-S11 no crea la lista texto/video/guía/enlace/plantilla como catálogo técnico. Puede presentar cualquiera de esos formatos sólo cuando el valor real recibido y el renderer existente lo soporten.

16.4. Acción

CTA permitida:

> ABRIR RECURSO

Consecuencia:

> Abrís el recurso configurado. Esto no inicia ni completa el paso.

No se agregan biblioteca, búsqueda, descargas, favoritos, preview universal ni gestión de archivos.

16.5. Sin recurso

> Este paso no tiene un recurso configurado.

La ausencia de Resource no equivale a bloqueo ni completion. La CTA se resuelve por la matriz de precedencia.

***
17. ENTREGABLE ESPERADO

El entregable describe la producción configurada que se espera.

ProtocolArtifact respalda un entregable asociado a step_id mediante artifact_type y evidence_id. No se encuentra congelado el esquema de descripción, obligatoriedad, multiplicidad ni relación definitiva con Evidence.

Reglas:

mostrar descripción sólo si llega;
distinguir esperado de entregado;
no abrir un editor local;
no crear Evidence;
no afirmar que una Evidence existente es el artefacto correcto sin relación autoritativa;
no convertir artifact_type en copy humana por inferencia;
si falta: Entregable de este paso no disponible;
configuración exacta: SOURCE CONTRACT PENDING.

Copy:

> Entregable esperado

No usar:

Entregable aprobado;
Trabajo completado;
Paso resuelto;

salvo hechos autoritativos separados.

***
18. CRITERIO

ProtocolStep.criterion existe como campo mínimo.

Reglas:

mostrar el criterion recibido como Criterio esperado;
no evaluarlo en frontend;
no transformarlo en suficiencia o completion;
no prometer corrección automática;
no prometer aprobación humana;
no agregar umbrales;
no confundirlo con completion_criterion de Action ni sufficiency_criterion de Evidence;
si falta: Criterio de este paso no disponible.

Copy:

> Criterio esperado. Su cumplimiento todavía no está confirmado.

Si existe completion autoritativa:

> La fuente del protocolo confirmó el cierre de este paso.

No se dice que el criterio fue académicamente aprobado salvo que esa sea la semántica explícita de la fuente.

***
19. MATRIZ DE PRECEDENCIA OPERATIVA

La matriz sólo considera objetos vinculados inequívocamente a la misma ExamPreparation/Assessment o contexto autorizado. WF-S11 no compara materias ni recomendaciones.

Orden	Condición autoritativa	Estado visible	CTA primaria	Destino	Después
1	Action IN_PROGRESS	Acción en curso	CONTINUAR	Action activa	abre la Action; terminar usa su cierre real
2	Action EVIDENCE_PENDING / Evidence requerida	Evidencia pendiente	SUBIR EVIDENCIA	WF-S07	el envío confirmado deja Evidence SUBMITTED
3a	Commitment CONFIRMED futuro	Compromiso vigente	VER COMPROMISO	detalle canónico	abre sin iniciar
3b	Commitment DUE	Es momento de empezar	EMPEZAR	inicio coordinado por owner	sólo el owner confirma STARTED/IN_PROGRESS
3c	Commitment STARTED + Action coherente	Trabajo iniciado	CONTINUAR	Action activa	continúa la Action
4	Commitment MISSED / RESCUE_REQUIRED	Compromiso incumplido	RETOMAR	resolución existente	no crea rescate ni borra MISSED
5	Evidence RESUBMISSION_REQUESTED	Nueva presentación solicitada	PREPARAR NUEVA EVIDENCIA	WF-S07	conserva la anterior
6	ActionRecommendation principal + Action RECOMMENDED	Próxima acción disponible	COMPROMETERME	WF-S05	abre aceptación; Commitment se confirma aparte
7	ProtocolStep con cierre no confirmado, sin gate; Resource real y ruta válida	Paso disponible	ABRIR RECURSO	Resource	abre recurso; no completa
8	Evidence informativa y no existe destino accionable 1–7, o gate real durante review	lifecycle de Evidence	VER EVIDENCIA	Evidence canónica	abre sin validar ni actualizar
9a	ProgressUpdated confirmado, sin 1–8, con destino WF-S08	Cambio confirmado	VER AVANCE	WF-S08	muestra sólo changed_dimensions
9b	ProgressEntry histórica, sin 1–8, con destino Bitácora	Actividad registrada	VER BITÁCORA	Bitácora	abre historia sin causalidad inventada
10	ProtocolStep completado; nuevo current step autoritativo y ruta real	Paso anterior completado	ABRIR PASO ACTUAL	WF-S11 del nuevo current	abrir no completa el nuevo paso
11	Sin objeto/destino accionable o ruta no disponible	Sin acción disponible	VOLVER AL OVERVIEW	WF-S10	conserva preparación y estado
	19.1. Reglas de conflicto

IN_PROGRESS vence a MISSED previo, Evidence informativa, progreso y recomendación.
EVIDENCE_PENDING vence a recomendación y Resource.
Commitment vigente vence a recomendación y Resource.
MISSED vence a recomendación no aceptada.
RESUBMISSION_REQUESTED vence a recomendación y Resource.
ActionRecommendation vence a Resource, Evidence informativa y ProgressUpdated.
Resource accionable conserva prioridad sobre Evidence SUBMITTED, UNDER_REVIEW, SUFFICIENT o VALIDATED meramente informativas cuando no existe gate autoritativo.
Si un gate autoritativo durante UNDER_REVIEW impide actuar sobre el paso, VER EVIDENCIA puede ser primaria; el gate no se inventa.
ProgressUpdated no desplaza una Action, Commitment, recomendación o Resource accionable.
Completion autoritativa invalida acciones locales del paso completado. Si todavía aparecen, es inconsistencia y obliga a releer.
Varias ActionRecommendation sin principal = datos contradictorios; WF-S11 no elige.
Objetos de otra Assessment se excluyen.

19.2. ProtocolStep sin ActionRecommendation

Si existe Resource real: ABRIR RECURSO.

Si no existe Resource ni otro destino:

> No hay una acción disponible desde este paso.

CTA: VOLVER AL OVERVIEW.

La UI no genera una Action para evitar el empty state.

19.3. Apertura de Resource

ABRIR RECURSO es navegación, no transición del paso. No produce evento de dominio nuevo, no cambia estado y no registra progreso.

***
20. REGLAS DE COMPLETION Y NO COMPLETION

20.1. Hecho autoritativo permitido

Las fuentes aprueban el evento ProtocolStepCompleted y admiten una lectura equivalente de completion. No congelan una entidad persistida ni un enum de estado por paso.

WF-S11 muestra Completado sólo si recibe:

ProtocolStep inequívoco;
ExamPreparation inequívoca;
ExamProtocol/version coherentes;
hecho de completion emitido o lectura autoritativa equivalente;
owner identificable;
vigencia suficiente para mostrarlo.

20.2. Contrato mínimo de completion

Pregunta obligatoria	Estado de contrato
Trigger autoritativo	ProtocolStepCompleted existe como evento aprobado; payload y trigger exactos pendientes
Owner	owner del protocolo; owner técnico concreto pendiente
Entidad afectada	ProtocolStep dentro de ExamPreparation; registro persistido exacto pendiente
Estado	no existe enum por ProtocolStep congelado; sólo hecho factual de completion
Evidencia requerida	ProtocolArtifact/Evidence cuando corresponda; mapping pendiente
Condición de entrada	definida por protocolo configurado; esquema pendiente
Condición de salida	completion confirmada por owner; criterio exacto pendiente
Relación con ProgressUpdated	independiente; completion no lo emite por inferencia
Siguiente paso	current/next autoritativos pendientes
Sin siguiente paso	conservar completion y volver a WF-S10
	Resultado: la arquitectura puede proyectar completion, pero su implementación completa permanece SOURCE CONTRACT PENDING.

20.3. No completion

No completan el ProtocolStep:

abrir WF-S11;
volver a abrirlo;
leer objetivo o explicación;
abrir o reproducir Resource;
declarar confianza;
aceptar ActionRecommendation;
crear o cumplir Commitment;
iniciar o completar Action;
subir Evidence;
Evidence SUBMITTED;
Evidence UNDER_REVIEW;
Evidence SUFFICIENT;
Evidence VALIDATED;
ProgressUpdated;
recibir feedback;
pasar tiempo;
alcanzar una fecha.

Una fuente posterior podría vincular alguno de esos hechos como condición, pero WF-S11 no lo presume.

20.4. Completion y Evidence

ProtocolArtifact puede vincular step_id, artifact_type y evidence_id.
La existencia de evidence_id no prueba completion.
SUFFICIENT confirma criterion de una Action/Evidence, no el cierre universal del ProtocolStep.
VALIDATED confirma cierre según método aplicable, no completion automática.
Si el owner del protocolo usa Evidence como input, debe emitir completion o una lectura equivalente separada.
UNDER_REVIEW nunca se transforma en completion.

20.5. Completion y Progress

completion puede existir sin ProgressUpdated;
ProgressUpdated puede existir sin completion;
un cambio de Práctica o Dominio no cierra el paso sin contrato;
dentro de CAMBIO CONFIRMADO aparecen sólo changed_dimensions;
la causalidad Evidence → ProgressUpdated → completion no se atribuye por cercanía temporal.

20.6. Paso completado y siguiente

Si el owner confirma completion y un nuevo current ProtocolStep con ruta:

el paso abierto permanece en modo factual completado;
CTA: ABRIR PASO ACTUAL;
la CTA abre el nuevo current;
no se usa Avanzar protocolo;
no se calcula la posición.

Si no existe siguiente paso:

> Este paso está completado. Todavía no hay otro paso disponible.

CTA: VOLVER AL OVERVIEW.

No se interpreta como protocolo completo, readiness ni fin de preparación.

***
21. ESTADOS FUNCIONALES

Los siguientes son estados o condiciones de UI compuestos a partir de entidades aprobadas. No crean un enum de ProtocolStep.

Estado/condición	Lectura	CTA	Límite
ProtocolStep disponible	hito current recibido	precedencia	no completion
contenido completo	cinco bloques configurados	precedencia	no Action local
sin Resource	contenido parcial	siguiente destino	no bloqueo
sin entregable	falta contrato de producción	retorno o lifecycle real	no inventar
sin criterion	criterio no disponible	retorno o lifecycle real	no evaluar
paso no disponible	no existe current autoritativo	volver a Overview	no elegir
ExamProtocol/version faltante	asociación incompleta	volver/reintentar	no usar protocolo genérico
versión inconsistente	conflicto	reintentar/volver	no mezclar
ruta no disponible	identidad visible, destino fallido	volver a Overview	no CTA muerta
apertura de sesión	pantalla abierta ahora	precedencia	no estado persistido
visita previa desconocida	no hay contrato de historial	copy neutral	no afirmar visitado
Recommendation	objeto del Engine	COMPROMETERME	no aceptar localmente
Action IN_PROGRESS	ejecución activa	CONTINUAR	no completion
Commitment vigente	acuerdo real	ver/empezar	no dominio
Commitment MISSED	original preservado	RETOMAR	Evidence no borra
Evidence requerida	Action EVIDENCE_PENDING	SUBIR EVIDENCIA	handoff
Evidence SUBMITTED	recibida	Resource si accionable; si no, ver Evidence	no suficiencia
Evidence UNDER_REVIEW	revisión real	Resource si no gate; si gate, ver Evidence	no progreso
Evidence INSUFFICIENT	criterio mínimo no cumplido	ver; nueva sólo con RESUBMISSION_REQUESTED	no fracaso
Evidence SUFFICIENT	mínimo cumplido	precedencia	no ProgressUpdated
Evidence VALIDATED	cierre del método	precedencia	no dominio universal
ProgressUpdated	dimensiones confirmadas	Resource o VER AVANCE según precedencia	no completion
ProtocolStep completado	hecho recibido	nuevo current o Overview	no readiness
oral/fuera P0	modalidad real	Overview	no protocolo P0 adaptado
datos contradictorios	versiones/ids incompatibles	reintentar/volver	no elegir
datos no disponibles	falla temporal	REINTENTAR o volver	no empty semántico
provenance desconocida	dato visible con advertencia si seguro	precedencia	no oficializar
	***
22. MATRIZ DE ESTADOS CRÍTICOS

#	Estado obligatorio	Resolución funcional
1	ProtocolStep autoritativo disponible	identidad + contenido recibido; sin completion
2	contenido completo	objetivo, explicación, Resource, entregable y criterion
3	sin Resource	copy honesto; no bloqueo
4	sin entregable	no inferir ProtocolArtifact
5	sin criterion	no evaluar ni completar
6	ProtocolStep no disponible	volver a WF-S10
7	ExamProtocol/version no disponible	ocultar contenido no verificable
8	versión inconsistente	separar versiones; no merge
9	paso visible, ruta no disponible	contenido en lectura + volver
10	abierto por primera vez	sólo apertura de sesión; no persistir state
11	abierto previamente, sin progreso	no hay contrato de visita; mostrar Todavía no hay cambio confirmado
12	ActionRecommendation	COMPROMETERME hacia WF-S05
13	Action IN_PROGRESS	CONTINUAR
14	Commitment vigente	VER COMPROMISO o EMPEZAR según state
15	Commitment MISSED	RETOMAR; original visible
16	Evidence requerida	SUBIR EVIDENCIA
17	Evidence SUBMITTED	recibida, no suficiente
18	Evidence UNDER_REVIEW	no progreso; gate sólo si real
19	Evidence INSUFFICIENT	no retroceso; reenvío sólo si solicitado
20	Evidence SUFFICIENT sin ProgressUpdated	mínimo cumplido; cambio pendiente
21	Evidence VALIDATED sin ProgressUpdated	validada; cambio pendiente
22	ProgressUpdated confirmado	sólo changed_dimensions
23	paso completado autoritativamente	completion factual
24	completado sin siguiente	volver al Overview; no protocolo terminado
25	práctico	shell P0 con contenido configurado
26	teórico escrito	mismo shell P0
27	oral/fuera P0	no adaptar; volver
28	datos contradictorios	bloquear decisión local
29	datos temporalmente no disponibles	reintentar; conservar hechos previos
30	provenance/verification desconocidos	Fuente/estado no disponible
31	retorno seguro	VOLVER AL OVERVIEW con ExamPreparation inequívoca
	***
23. PROVENANCE Y VERIFICATION_STATUS

23.1. Metadata aprobada

Para datos académicos discutibles se preservan:

source_type;
source_ref;
observed_at;
valid_from / valid_until;
term / offering;
confidence;
verification_status;
uploaded_by;
rights_status cuando corresponde a Resource.

Valores aprobados de verification_status:

unverified;
corroborated;
official;
disputed.

23.2. Labels humanos

source_type / estado	Copy visible
institution + official	Fuente oficial · confirmado
instructor + official/corroborated	Cátedra · confirmado/corroborado
student + unverified	Reportado por vos · sin verificar
community	Reporte comunitario · {estado real}
inference	Estimado por Achieve · {estado real}
disputed	Dato en revisión: hay fuentes contradictorias
desconocido	Fuente o verificación no disponible
	No se traduce unverified como falso ni corroborated como official.

23.3. Aplicación en WF-S11

Assessment.date y modality conservan provenance cuando corresponda.
materia/cátedra conservan CourseOffering/term para evitar mezcla.
Resource muestra source y rights cuando llegan.
objetivo, explicación, entregable y criterion necesitan provenance/version de configuración; ese contrato no está congelado.
hasta cerrarlo, ExamProtocol.version identifica configuración pero no reemplaza provenance.
si no existe provenance del contenido, se muestra Fuente del contenido no disponible en el área secundaria; no se dice oficial.

23.4. Staleness

Freshness de ExamProtocol/ProtocolStep es SOURCE CONTRACT PENDING.

Cuando un dato se detecta desactualizado:

se invalida la CTA afectada;
se relee;
no se usa la versión vieja para completar, abrir siguiente o decidir gate;
se preserva la última verdad confirmada sólo como histórica si el owner lo permite.

***
24. MICROCOPY

24.1. Identidad

MODO EXAMEN · {Assessment}
{Materia} · {modalidad real}
PASO ACTUAL
Protocolo {version recibida}

24.2. Contenido

OBJETIVO DEL PASO
ENTREGABLE ESPERADO
CRITERIO ESPERADO
CÓMO TRABAJARLO
RECURSO CONFIGURADO

24.3. Estado

Abriste este paso. Abrirlo no lo completa.
Cierre del paso todavía no confirmado.
Todavía no hay un cambio de progreso confirmado.
Evidencia recibida. Esto no confirma suficiencia ni dominio.
Evidencia en revisión. Esto no confirma progreso.
La evidencia cumple el criterio mínimo. El progreso todavía no fue actualizado.
Evidencia validada. El progreso todavía no fue actualizado.
Cambio confirmado: {sólo changed_dimensions}.
La fuente del protocolo confirmó el cierre de este paso.
Este paso está completado. Todavía no hay otro paso disponible.

24.4. CTAs

CONTINUAR
SUBIR EVIDENCIA
VER COMPROMISO
EMPEZAR
RETOMAR
PREPARAR NUEVA EVIDENCIA
COMPROMETERME
ABRIR RECURSO
VER EVIDENCIA
VER AVANCE
VER BITÁCORA
ABRIR PASO ACTUAL
REINTENTAR
VOLVER AL OVERVIEW

Cada CTA sólo aparece con el objeto, state, destino y transición reales.

24.5. Después

Abrís la Action vigente. Terminarla usa su cierre configurado.
Abrís Evidence. Enviarla la deja SUBMITTED cuando el owner confirma recepción.
Abrís el recurso. Esto no inicia ni completa el paso.
Abrís la recomendación. El Commitment se confirma en un flujo separado.
Abrís el compromiso. Verlo no lo inicia.
Abrís el resultado confirmado. Sólo verás las dimensiones actualizadas.
Volvés al Overview. La preparación conserva su estado.

24.6. Copy prohibido

Completaste el paso, por abrirlo.
Paso en progreso, si no existe state respaldado.
Aprobado, por Evidence VALIDATED.
Dominio demostrado, sin señal aplicable.
Listo para rendir.
5 de 12.
60% completo.
Esperando a tu operador.
Tu revisor lo verá hoy.
El siguiente paso se habilita automáticamente.
Generar acción.
Recalcular prioridad.

24.7. Diferencias obligatorias

Copy A	No equivale a
Abriste este paso	Completaste este paso
Entregaste evidencia	Demostraste dominio
Evidencia validada	Progreso actualizado
Objetivo del paso	Tu próxima acción
Criterio esperado	Criterio confirmado
Commitment MISSED	Trabajo inexistente
Sin datos	Cero
	***
25. WIREFRAMES MOBILE 360 PX

25.0. Reglas comunes

ancho objetivo: 360 px;
una CTA primaria;
bloque crítico antes de explicación y Resource;
objetivo, entregable, criterion, estado, CTA y Después visibles sin tabs ni expansión;
Resource secundario puede quedar debajo cuando otra CTA domina;
labels de provenance junto al dato y con alcance local inequívoco;
datos del Assessment, contenido del protocolo y Resource usan rótulos separados;
objetivo + entregable + criterion comparten un único rótulo sólo si source, version y verification son idénticos; si falta esa metadata, muestran Fuente del contenido no disponible;
los valores de ejemplo son contenido ilustrativo recibido, no pasos ni criterios congelados;
ninguna visita modifica dominio.

25.1. Paso completo configurado — modalidad práctica

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | ANÁLISIS II · PARCIAL 1             |
    | Modalidad: Práctico                 |
    | Datos del examen · Fuente oficial   |
    +--------------------------------------+
    | PASO ACTUAL                         |
    | Práctica bajo condiciones definidas |
    | Protocolo v3                        |
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    +--------------------------------------+
    | OBJETIVO                            |
    | Producir una resolución comparable  |
    | con las condiciones configuradas.   |
    |                                      |
    | ENTREGABLE ESPERADO                 |
    | Resolución completa y legible.      |
    |                                      |
    | CRITERIO ESPERADO                   |
    | Desarrollo y resultado final        |
    | legibles. Todavía no confirmado.    |
    |                                      |
    | ESTADO                              |
    | Paso disponible                     |
    | Cierre todavía no confirmado        |
    |                                      |
    | [        ABRIR RECURSO           ]  |
    |                                      |
    | DESPUÉS                             |
    | Abrís la guía configurada. Esto no  |
    | inicia ni completa el paso.         |
    |                                      |
    | PARA CONTINUAR                      |
    | La fuente del protocolo debe        |
    | confirmar el cierre de este paso.   |
    +--------------------------------------+
    | CÓMO TRABAJARLO                     |
    | Instrucción configurada completa.   |
    |                                      |
    | RECURSO                             |
    | Guía práctica U3                    |
    | Cátedra · corroborado               |
    +--------------------------------------+

El criterion del ejemplo es ilustrativo. En implementación se muestra exclusivamente el valor real recibido; no se hardcodea este texto.

25.2. ActionRecommendation disponible

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | ANÁLISIS II · PARCIAL 1 · PRÁCTICO  |
    | Datos examen · {fuente/estado real} |
    +--------------------------------------+
    | PASO ACTUAL                         |
    | {label configurado}                 |
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    |                                      |
    | OBJETIVO                            |
    | {objetivo configurado}              |
    | ENTREGABLE: {esperado configurado}  |
    | CRITERIO: {criterion configurado}   |
    |                                      |
    | ESTADO                              |
    | PRÓXIMA ACCIÓN DISPONIBLE           |
    | Resolver ejercicios 8–14 sin ayuda  |
    | Porque: {razón del Engine}          |
    |                                      |
    | [        COMPROMETERME           ]  |
    |                                      |
    | DESPUÉS                             |
    | Abrís la recomendación. Aceptarla   |
    | no crea todavía un Commitment.      |
    +--------------------------------------+
    | Recurso del paso · secundario       |
    +--------------------------------------+

La ActionRecommendation debe existir, ser principal y estar vinculada. El objetivo del paso no se usa para crearla.

25.3. Action IN_PROGRESS

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | ANÁLISIS II · PARCIAL 1 · PRÁCTICO  |
    | Datos examen · {fuente/estado real} |
    +--------------------------------------+
    | PASO ACTUAL · {label configurado}   |
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    | OBJETIVO: {objetivo}                |
    | ENTREGABLE: {esperado}              |
    | CRITERIO: {criterion esperado}      |
    |                                      |
    | ESTADO                              |
    | ACCIÓN EN CURSO                     |
    | Resolver ejercicios 8–14            |
    |                                      |
    | [           CONTINUAR            ]  |
    |                                      |
    | DESPUÉS                             |
    | Abrís la Action vigente. Terminarla |
    | usa su cierre configurado.          |
    +--------------------------------------+
    | El paso no se completa por abrirlo. |
    +--------------------------------------+

25.4. Commitment MISSED

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | FÍSICA I · PARCIAL 2 · TEÓRICO      |
    | ESCRITO                             |
    | Datos examen · {fuente/estado real} |
    +--------------------------------------+
    | PASO ACTUAL · {label configurado}   |
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    | OBJETIVO: {objetivo}                |
    | ENTREGABLE: {esperado}              |
    | CRITERIO: {criterion esperado}      |
    |                                      |
    | ESTADO                              |
    | COMPROMISO INCUMPLIDO               |
    | Acordado: 19:00 · MISSED            |
    | Tu producción posterior no borra    |
    | este acuerdo.                       |
    |                                      |
    | [            RETOMAR             ]  |
    |                                      |
    | DESPUÉS                             |
    | Abrís la resolución existente. No   |
    | se crea un rescate automáticamente. |
    +--------------------------------------+

25.5. Evidence UNDER_REVIEW

Variante sin gate autoritativo y con Resource accionable:

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | ANÁLISIS II · PARCIAL 1 · PRÁCTICO  |
    | Datos examen · {fuente/estado real} |
    +--------------------------------------+
    | PASO ACTUAL · {label configurado}   |
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    | OBJETIVO: {objetivo}                |
    | ENTREGABLE: {esperado}              |
    | CRITERIO: {criterion esperado}      |
    |                                      |
    | ESTADO                              |
    | EVIDENCIA EN REVISIÓN               |
    | No hay progreso confirmado.         |
    |                                      |
    | [        ABRIR RECURSO           ]  |
    |                                      |
    | DESPUÉS                             |
    | Abrís el recurso y podés continuar  |
    | el trabajo permitido. No completa.  |
    +--------------------------------------+
    | Ver evidencia · acción secundaria   |
    | Revisor/plazo: sólo si existen      |
    +--------------------------------------+

Variante con gate real: el Resource no se declara accionable; CTA primaria VER EVIDENCIA. El copy del gate llega del owner. No se inventa espera humana.

25.6. SUFFICIENT o VALIDATED sin ProgressUpdated

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | ANÁLISIS II · PARCIAL 1 · PRÁCTICO  |
    | Datos examen · {fuente/estado real} |
    +--------------------------------------+
    | PASO ACTUAL · {label configurado}   |
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    | OBJETIVO: {objetivo}                |
    | ENTREGABLE: {esperado}              |
    | CRITERIO: {criterion esperado}      |
    |                                      |
    | ESTADO                              |
    | EVIDENCIA SUFFICIENT / VALIDATED    |
    | {valor real, nunca ambos}           |
    | Todavía no hay un cambio de         |
    | progreso confirmado.                |
    |                                      |
    | [        ABRIR RECURSO           ]  |
    |                                      |
    | DESPUÉS                             |
    | Abrís el recurso. La Evidence no    |
    | completa el paso por sí sola.       |
    +--------------------------------------+
    | Ver evidencia · secundario          |
    +--------------------------------------+

El renderer muestra SUFFICIENT o VALIDATED según el state real, no una combinación.

25.7. ProgressUpdated confirmado

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | ANÁLISIS II · PARCIAL 1 · PRÁCTICO  |
    | Datos examen · {fuente/estado real} |
    +--------------------------------------+
    | PASO ACTUAL · {label configurado}   |
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    | OBJETIVO: {objetivo}                |
    | ENTREGABLE: {esperado}              |
    | CRITERIO: {criterion esperado}      |
    |                                      |
    | CAMBIO CONFIRMADO                   |
    | Práctica · 12 -> 19 ejercicios      |
    | Sólo changed_dimensions recibido.   |
    | Este cambio no confirma el cierre.  |
    |                                      |
    | [        ABRIR RECURSO           ]  |
    |                                      |
    | DESPUÉS                             |
    | Abrís el recurso. El cambio queda   |
    | visible sin cerrar el hito.         |
    +--------------------------------------+
    | Ver avance · secundario con destino |
    +--------------------------------------+

Si no existe Resource accionable y WF-S08 es el destino canónico recibido, VER AVANCE pasa a primaria.

25.8. Paso sin Resource

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | FÍSICA I · PARCIAL 2 · TEÓRICO      |
    | ESCRITO                             |
    | Datos examen · {fuente/estado real} |
    +--------------------------------------+
    | PASO ACTUAL · {label configurado}   |
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    | OBJETIVO: {objetivo}                |
    | ENTREGABLE: {esperado}              |
    | CRITERIO: {criterion esperado}      |
    |                                      |
    | ESTADO                              |
    | Paso disponible                     |
    | Cierre todavía no confirmado        |
    | Este paso no tiene un recurso       |
    | configurado.                        |
    |                                      |
    | [       VOLVER AL OVERVIEW       ]  |
    |                                      |
    | DESPUÉS                             |
    | Volvés sin cambiar la preparación.  |
    +--------------------------------------+

No se crea Resource ni Action. Si existe un objeto accionable de niveles 1–6, su CTA reemplaza el retorno.

25.9. Paso sin criterion o entregable

Variante sin criterion:

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | ANÁLISIS II · PARCIAL 1 · PRÁCTICO  |
    | Datos examen · {fuente/estado real} |
    +--------------------------------------+
    | PASO ACTUAL · {label configurado}   |
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    | OBJETIVO: {objetivo}                |
    | ENTREGABLE: {esperado}              |
    | CRITERIO                            |
    | Criterio de este paso no disponible |
    |                                      |
    | ESTADO                              |
    | Contenido incompleto                |
    | No podemos confirmar cómo se cierra |
    |                                      |
    | [       VOLVER AL OVERVIEW       ]  |
    |                                      |
    | DESPUÉS                             |
    | Volvés sin completar ni modificar.  |
    +--------------------------------------+

Variante sin entregable: reemplaza el bloque por Entregable de este paso no disponible. No se infiere desde criterion, type o Resource.

25.10. Ruta no disponible

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | ANÁLISIS II · PARCIAL 1             |
    | Datos examen · {fuente/estado real} |
    +--------------------------------------+
    | PASO ACTUAL · {identidad confirmada}|
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    | OBJETIVO: {objetivo seguro}         |
    | ENTREGABLE: {esperado seguro}       |
    | CRITERIO: {criterion seguro}        |
    |                                      |
    | ESTADO                              |
    | No pudimos abrir el destino de la   |
    | acción disponible.                  |
    |                                      |
    | [       VOLVER AL OVERVIEW       ]  |
    |                                      |
    | DESPUÉS                             |
    | Volvés. El paso y la preparación    |
    | conservan su estado.                |
    +--------------------------------------+

No se muestra una CTA primaria sin destino. REINTENTAR puede ser secundaria cuando existe una relectura real.

25.11. Paso completado sin siguiente

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | ANÁLISIS II · PARCIAL 1 · PRÁCTICO  |
    | Datos examen · {fuente/estado real} |
    +--------------------------------------+
    | PASO · {label configurado}          |
    | CONTENIDO DEL PROTOCOLO             |
    | Fuente del contenido no disponible  |
    | OBJETIVO: {objetivo}                |
    | ENTREGABLE: {esperado}              |
    | CRITERIO: {criterion esperado}      |
    |                                      |
    | ESTADO                              |
    | PASO COMPLETADO                     |
    | Confirmado por la fuente del        |
    | protocolo · {fecha si existe}       |
    | Todavía no hay otro paso disponible.|
    |                                      |
    | [       VOLVER AL OVERVIEW       ]  |
    |                                      |
    | DESPUÉS                             |
    | Volvés. Esto no declara readiness   |
    | ni fin de la preparación.           |
    +--------------------------------------+

25.12. Modalidad fuera de P0

    +--------------------------------------+
    | <- MODO EXAMEN                      |
    | DERECHO I · FINAL                   |
    | Oral · Reportado por vos            |
    | sin verificar                       |
    +--------------------------------------+
    | PASO ACTUAL NO DISPONIBLE EN P0     |
    | El protocolo configurado para esta  |
    | modalidad no está disponible.       |
    |                                      |
    | OBJETIVO: no disponible             |
    | ENTREGABLE: no disponible           |
    | CRITERIO: no disponible             |
    |                                      |
    | ESTADO                              |
    | Modalidad fuera del alcance P0      |
    |                                      |
    | [       VOLVER AL OVERVIEW       ]  |
    |                                      |
    | DESPUÉS                             |
    | Volvés sin adaptar un protocolo de  |
    | otra modalidad.                     |
    +--------------------------------------+

25.13. Variante teórico escrito

El shell es idéntico a 25.1. Sólo cambian valores configurados:

    CONTENIDO DEL PROTOCOLO
    {source/version/verification idénticos}
    Si faltan: Fuente del contenido no disponible

    OBJETIVO
    {resultado configurado para este hito}

    ENTREGABLE ESPERADO
    {producción escrita configurada}

    CRITERIO ESPERADO
    {criterion real recibido}

    ESTADO + CTA + DESPUÉS
    se resuelven por la misma precedencia.

No existe bifurcación de navegación practical/theoretical.

***
26. WIREFRAMES DESKTOP

26.1. Paso configurado completo

    +----------------------------------------------------------------------------------+
    | <- MODO EXAMEN     ANÁLISIS II · PARCIAL 1 · PRÁCTICO · Fuente oficial           |
    +----------------------------------------------------------------------------------+
    | PASO ACTUAL · {label configurado}          | CÓMO TRABAJARLO                     |
    | Protocolo {version recibida}               | {explicación configurada}           |
    |                                             |                                      |
    | OBJETIVO                                    | RECURSO                              |
    | {objetivo configurado}                     | {Resource real}                      |
    |                                             | source · verification · rights       |
    | ENTREGABLE ESPERADO                        | [ Abrir recurso · secundario si      |
    | {producción configurada}                   |   otra CTA domina ]                  |
    |                                             |                                      |
    | CRITERIO ESPERADO                          | CONFIGURACIÓN                        |
    | {criterion recibido}                       | ExamProtocol/version                 |
    | Todavía no confirmado.                     | Fuente del contenido: {real/unknown} |
    |                                             |                                      |
    | ESTADO: {lifecycle dominante}              |                                      |
    | [              CTA PRIMARIA              ] |                                      |
    | DESPUÉS: {consecuencia inmediata real}     |                                      |
    +----------------------------------------------------------------------------------+

26.2. Degradación por datos incompletos

    +----------------------------------------------------------------------------------+
    | <- MODO EXAMEN     FÍSICA I · PARCIAL 2 · TEÓRICO ESCRITO                        |
    +----------------------------------------------------------------------------------+
    | PASO ACTUAL · identidad confirmada          | DATOS NO DISPONIBLES                |
    | ExamProtocol/version: no disponible         | Resource: no disponible             |
    |                                              | Provenance de contenido: desconocida |
    | OBJETIVO: no disponible                     | No usamos otra versión.             |
    | ENTREGABLE: no disponible                   |                                      |
    | CRITERIO: no disponible                     | [ Reintentar · secundario ]          |
    |                                              |                                      |
    | ESTADO: contenido incompleto                |                                      |
    | [           VOLVER AL OVERVIEW            ]|                                      |
    | DESPUÉS: conserva ExamPreparation           |                                      |
    +----------------------------------------------------------------------------------+

La degradación no usa un protocolo genérico, no infiere contenido desde type y no cambia status.

26.3. Handoff sin diseñar destino

    +----------------------------------------------------------------------------------+
    | PASO + CONTEXTO                                                                 |
    | ESTADO: ACTIONRECOMMENDATION PRINCIPAL                                          |
    | [ COMPROMETERME ] -> WF-S05                                                     |
    | DESPUÉS: abre la recomendación; WF-S11 no dibuja aceptación ni Commitment.       |
    +----------------------------------------------------------------------------------+

La misma regla aplica a Action, Commitment, Evidence, WF-S08, Bitácora y WF-S10.

***
27. ESTADOS VACÍOS, INCOMPLETOS, CONTRADICTORIOS Y DE ERROR

Caso	Copy	Primaria	Regla
current ProtocolStep ausente	No hay un paso actual disponible	VOLVER AL OVERVIEW	no elegir por sequence
ExamProtocol ausente	El protocolo de esta preparación no está disponible	VOLVER	no usar template global
version ausente	No podemos confirmar la versión de este paso	VOLVER/REINTENTAR	no declarar vigente
version contradictoria	Este paso corresponde a otra versión del protocolo	REINTENTAR o volver	no merge
objetivo ausente	Objetivo de este paso no disponible	precedencia/volver	no generar copy
explicación ausente	Explicación no disponible	precedencia	puede omitirse sin falsear
Resource ausente	Este paso no tiene un recurso configurado	precedencia/volver	no bloqueo
Resource inaccesible	No pudimos abrir el recurso configurado	volver/reintentar	no marcar leído
entregable ausente	Entregable de este paso no disponible	volver	no crear Evidence
criterion ausente	Criterio de este paso no disponible	volver	no completion
ruta Action ausente	La acción existe, pero su destino no está disponible	volver	no CTA CONTINUAR
ruta Evidence ausente	La evidencia conserva su estado, pero no podemos abrirla	volver	no reenviar
dos Recommendation sin principal	No podemos identificar una única próxima acción	volver/reintentar	UI no prioriza
objeto de otra Assessment	La información no corresponde a este examen	volver	excluir
datos temporales no disponibles	No pudimos cargar el estado actual	REINTENTAR o volver	no empty semántico
provenance desconocida	Fuente o verificación no disponible	precedencia segura	no oficializar
staleness detectada	Estamos actualizando este paso	volver/reintentar	invalidar CTA afectada
completion + Action activa del mismo paso	Los datos no coinciden	REINTENTAR	no continuar ni completar
completed sin next	Todavía no hay otro paso disponible	VOLVER	no protocolo terminado
	***
28. CONTRATOS Y OWNERSHIP

28.1. Convenciones

Campo confirmado: aparece explícitamente en una fuente aprobada.
Campo SOURCE CONTRACT PENDING: la necesidad UX existe, pero el nombre/esquema no está congelado.
Owner funcional: componente o sistema propietario aprobado.
Owner técnico: servicio concreto de escritura; si no está congelado, permanece pendiente.
Owner de proyección: WF-S11 sólo lee y compone; no escribe verdad de dominio.
Destino: superficie conceptual aprobada; ruta exacta pendiente salvo contrato posterior.

28.2. Matriz de datos visibles

Dato	Fuente/entidad	Campo confirmado	Owner escritura	Proyección	Provenance / verification	Visibilidad/estado	Destino	Si falta	Si está desactualizado
preparación	ExamPreparation	assessment_id, student_id, activated_at, status	Plataforma; owner técnico pendiente	WF-S11	identidad y vigencia de lectura	ACTIVE o posterior según handoff UX08	WF-S10	error de identidad	releer; no cambiar status
evaluación	Assessment	id, offering_id, type, date, modality, scope	Academic Data Layer	WF-S11	metadata académica completa	identidad inequívoca	Materia/Overview	bloquear ambigüedad	invalidar dato/CTA afectada
materia	CourseEnrollment/Course	identidad aprobada; nombre desde contexto	Plataforma/Academic Data	WF-S11	term/offering cuando aplica	siempre que identifica examen	Cursado/WF-S10	error	releer identidad
cátedra	CourseOffering/Instructor	commission/instructor según UX07/08	Academic Data	WF-S11	source + verification	cuando desambigua	ninguno	omitir	no mostrar como vigente
protocolo	ExamProtocol	modality, version	owner del protocolo, técnico pendiente	WF-S11	provenance de config pendiente	asociación inequívoca	WF-S10	ocultar contenido	releer
paso	ProtocolStep	sequence, type, criterion, required	owner del protocolo, técnico pendiente	WF-S11	provenance de config pendiente	current autoritativo	WF-S11	no disponible	invalidar
current step	owner del protocolo	campo no definido	pendiente	WF-S11	versión/vigencia pendientes	sólo si autoritativo	WF-S11	volver	releer
next step	owner del protocolo	campo no definido	pendiente	WF-S11	versión/vigencia pendientes	sólo tras completion y con ruta	WF-S11	volver	releer
nombre/label	configuración ProtocolStep	no definido	pendiente	WF-S11	provenance pendiente	si llega	ninguno	label no disponible	no usar viejo
objetivo	configuración ProtocolStep	no definido	pendiente	WF-S11	provenance pendiente	si llega	ninguno	copy honesto	no usar viejo
explicación	configuración ProtocolStep	no definido	pendiente	WF-S11	provenance pendiente	secundaria	ninguno	omitir/copy	no usar vieja
Resource	Resource	id, type, source, rights, url/file	Academic Data/Resource owner	WF-S11	source, rights y academic metadata	relación autoritativa + destino real	Resource	omitir	invalidar ruta
vínculo Step–Resource	configuración	no definido	pendiente	WF-S11	versión del vínculo pendiente	sólo si inequívoco	Resource	omitir	releer
entregable	ProtocolArtifact/config	step_id, artifact_type, evidence_id; descripción no definida	protocolo/Evidence, detalle pendiente	WF-S11	provenance config pendiente	si descripción respaldada	Evidence sólo con relación real	no disponible	no usar viejo
criterion	ProtocolStep	criterion	owner del protocolo	WF-S11	provenance config pendiente	siempre que llegue	ninguno	no disponible	no evaluar
required	ProtocolStep	required	owner del protocolo	WF-S11	config/version	sólo si semántica operativa está cerrada	ninguno	omitir	releer
ActionRecommendation	ActionRecommendation	action_id, reason, priority, generated_at	Academic Decision Engine	WF-S11	reason-provenance cuando existe	principal + vigente + vinculada	WF-S05	no elegir otra	releer
Action	Action	id, course_enrollment, objective, verb, scope, status	owner de Action	WF-S11	identidad/lifecycle	vínculo a contexto	Action/WF-S07	error	mostrar state vigente
Commitment	Commitment	action_id, start_at, planned_minutes, state	owner de Commitment	WF-S11	horario/timezone/state	vínculo a Action	detalle/inicio	no inferir	releer
Evidence	Evidence	action_id, content, lifecycle_state/signals según specs; payload exacto parcial	Evidence System	WF-S11	canal, actor, fecha, método cuando existen	vínculo real	WF-S07/detalle	omitir/no inferir	releer
ProtocolArtifact	ProtocolArtifact	step_id, artifact_type, evidence_id	protocolo/Evidence; detalle pendiente	WF-S11	relación/config pendiente	sólo vínculo autoritativo	Evidence	omitir	releer
ProgressUpdated	evento/owner de Progress	changed_dimensions; payload restante pendiente	owner de progreso	WF-S11	provenance del cambio si llega	resultado confirmado	WF-S08	estado pendiente	no mostrar snapshot viejo
ProgressEntry	bundle/lectura aprobada	contrato parcial	owner de progreso/Bitácora	WF-S11	provenance de hechos	histórico con destino real	Bitácora	omitir	releer
completion	ProtocolStepCompleted o lectura equivalente	evento aprobado; payload/registro no definidos	owner del protocolo, técnico pendiente	WF-S11	source/version/time si llegan	sólo hecho autoritativo	nuevo current/WF-S10	no afirmar	releer
provenance de contenido	configuración	no definido	pendiente	WF-S11	source/status/freshness pendientes	secundaria pero obligatoria cuando corresponda	ninguno	Fuente no disponible	no oficializar
	28.3. Matriz de CTAs

CTA	Fuente/entidad	Campo/state habilitante	Owner escritura	Owner proyección	Provenance	Condición de visibilidad	Destino	Si falta destino	Si está desactualizado
CONTINUAR	Action	status=IN_PROGRESS	owner Action	WF-S11	identidad/lifecycle	precedencia 1	Action activa	volver	releer; no abrir vieja
SUBIR EVIDENCIA	Action + Evidence contract	EVIDENCE_PENDING	Action/Evidence owners	WF-S11	requisito real	precedencia 2	WF-S07	volver; no crear	releer
VER COMPROMISO	Commitment	CONFIRMED	owner Commitment	WF-S11	horario/state	3a	detalle canónico	volver	state vigente
EMPEZAR	Commitment/Action	DUE autoritativo	owners Commitment/Action	WF-S11	timezone/state	3b	inicio coordinado	volver	detener
RETOMAR	Commitment	MISSED/RESCUE_REQUIRED	owner Commitment	WF-S11	original completo	4	resolución existente	volver; no rescate	preservar MISSED
PREPARAR NUEVA EVIDENCIA	Evidence	RESUBMISSION_REQUESTED	Evidence System	WF-S11	Evidence/razón real	5	WF-S07	volver	abrir state vigente
COMPROMETERME	Recommendation + Action	principal + RECOMMENDED	Engine/Action owner	WF-S11	razón cuando existe	6	WF-S05	volver; no elegir	releer
ABRIR RECURSO	Resource	vínculo + url/file real	Resource owner	WF-S11	source/rights	7 y sin gate	Resource	volver	invalidar
VER EVIDENCIA	Evidence	state informativo; o gate real	Evidence System	WF-S11	actor/canal/time si existen	8	Evidence canónica	volver	state actual
VER AVANCE	ProgressUpdated	resultado + destino WF-S08	owner Progress	WF-S11	cambio confirmado	9a	WF-S08	fallback	releer
VER BITÁCORA	ProgressEntry	objeto + destino Bitácora	owner Bitácora	WF-S11	provenance entrada	9b	Bitácora	fallback	releer
ABRIR PASO ACTUAL	new current ProtocolStep	current + ruta real	owner protocolo	WF-S11	version/vigencia	completion del abierto + nuevo current	WF-S11	volver	invalidar
REINTENTAR	fuente fallida	operación de relectura real	no muta dominio	WF-S11	no aplica	error temporal	misma pantalla	volver	nueva lectura
VOLVER AL OVERVIEW	ExamPreparation	identidad inequívoca	no muta	WF-S11	no aplica	fallback seguro	WF-S10	CourseEnrollment si válido	resolver identidad
	28.4. Owner de prioridad

WF-S11:

no ordena Recommendations;
no selecciona la mejor;
no produce reason;
no deriva Action desde ProtocolStep;
no recorta scope;
no adapta por modalidad;
no decide que un Resource es la mejor actividad académica.

ABRIR RECURSO sólo significa que, ante ausencia de un objeto académico accionable con mayor precedencia, existe una navegación respaldada dentro del paso ya current.

28.5. Proyección funcional no persistida

La vista necesita leer, sin crear una entidad nueva:

    exam_preparation + assessment + course_enrollment
    exam_protocol/version + current protocol_step
    configured_content:
      label? objective? explanation?
      resource? expected_deliverable? criterion?
    operational_primary?:
      existing_object + lifecycle + destination + consequence
    evidence_status?
    progress_result?
    completion_fact?
    next_current_step?
    provenance/freshness?

Los nombres de este bloque son descriptivos de lectura, no campos, tabla, API, evento ni contrato técnico.

***
29. HANDOFFS HACIA SUPERFICIES EXISTENTES

Origen en WF-S11	Condición	Destino	Qué delega	Qué no hace WF-S11
Recommendation	objeto principal vigente	WF-S05	detalle/aceptación de Action	no acepta
Action IN_PROGRESS	Action canónica	Action activa	ejecución	no completa
Commitment CONFIRMED	objeto vigente	detalle Commitment	lectura	no inicia
Commitment DUE	owner permite inicio	flujo coordinado	STARTED/IN_PROGRESS	no muta
MISSED	resolución existente	flujo de resolución	rescate/retoma	no borra
EVIDENCE_PENDING	requisito y ruta	WF-S07	carga/presentación	no crea Evidence
Evidence existente	id canónico	WF-S07/detalle	lifecycle	no valida
ProgressUpdated	destino WF-S08	WF-S08	resultado de progreso	no calcula
ProgressEntry	destino Bitácora	Bitácora	historial	no atribuye
Resource	relación + destino	Resource	consumo	no registra completion
nuevo current step	completion + owner	WF-S11 nuevo	contenido del paso	no decide next
retorno	ExamPreparation	WF-S10	Overview	no cambia preparación
	Ruta y payload exactos de todos los handoffs permanecen SOURCE CONTRACT PENDING cuando no fueron cerrados por una fuente aprobada.

***
30. RETORNO A WF-S10

30.1. CTA

> VOLVER AL OVERVIEW

30.2. Precondición

ExamPreparation permanece inequívoca.

30.3. Efecto

vuelve al Overview de la misma preparación;
no completa;
no descarta objetos;
no cambia Action, Commitment, Evidence o Progress;
no recalcula prioridad;
no modifica status de ExamPreparation.

30.4. Si WF-S10 falla

La preparación conserva su estado. Si CourseEnrollment sigue inequívoco, se habilita retorno seguro a Materia/Cursado según contrato de UX08. No se elige otra preparación.

***
31. CRITERIOS DE ACEPTACIÓN

31.1. Producto / PO

WF-S11 responde el JTBD sin diseñar todos los pasos.
No hardcodea 12 pasos, posiciones ni porcentajes.
ProtocolStep y ActionRecommendation están separados.
Academic Decision Engine conserva prioridad.
Abrir el paso no lo completa.
No se inventa completion.
No se muestra readiness.
P0 práctico y teórico escrito usan el mismo shell.
Oral y demás no reutilizan silenciosamente P0.

31.2. Lifecycles

Action IN_PROGRESS domina.
EVIDENCE_PENDING lleva a WF-S07.
Commitment state se consume sin mutarlo localmente.
MISSED permanece visible.
RESUBMISSION_REQUESTED conserva Evidence anterior.
SUBMITTED y UNDER_REVIEW no son progreso.
SUFFICIENT y VALIDATED no implican ProgressUpdated.
only changed_dimensions aparece como cambio.
completion no implica ProgressUpdated.
ausencia de ProtocolStepCompleted o lectura equivalente se muestra como cierre no confirmado, nunca como no completado.
lectura de completion stale se invalida y queda como cierre no confirmado hasta releer.
datos de completion contradictorios no producen afirmación positiva ni negativa.

31.3. Contenido

objetivo, explicación, Resource, entregable y criterion sólo aparecen si llegan configurados.
ProtocolStep.criterion no se evalúa en frontend.
tipos de Resource no se convierten en enum nuevo.
relación Step–Resource no se inventa.
ausencia de entregable/criterion es explícita.
provenance de contenido faltante queda visible como desconocida.
provenance del Assessment, del contenido del protocolo y del Resource usa rótulos locales separados.
objetivo + entregable + criterion sólo comparten rótulo cuando source, version y verification son idénticos.

31.4. CTA y navegación

existe una única CTA primaria.
cada CTA tiene objeto y destino real.
copy describe consecuencia inmediata.
no existe Completar paso.
ABRIR RECURSO no cambia state.
volver conserva estado.
next sólo se abre si el owner lo identifica como current y existe ruta.

31.5. Mobile 360 px

identidad visible.
objetivo visible.
entregable visible.
criterion visible.
estado visible.
CTA visible.
Después visible.
nada crítico depende de tab/acordeón/tooltip/hover/modal.

31.6. Error y degradación

datos contradictorios no se mezclan.
falla temporal no se presenta como sin datos semántico.
no se usa cero.
no se oficializa dato unverified.
una ruta inválida no deja CTA muerta.
una versión stale invalida la acción afectada.

31.7. Implementación

no se agregan entidades, eventos, enums, Engines, roles ni scores.
la proyección no se persiste como entidad nueva.
toda mutación queda en su owner.
contratos faltantes conservan SOURCE CONTRACT PENDING.

***
32. TEST DE COMPRENSIÓN DE 10 SEGUNDOS

32.1. Guion

Mostrar el primer bloque crítico durante 10 segundos y ocultarlo. Preguntar:

¿Qué paso era?
¿Para qué servía?
¿Qué debías producir?
¿Cómo sabías si cumplía?
¿Qué podías hacer?
¿Qué seguía pendiente?
¿Qué pasaba al tocar el botón?

32.2. Escenario práctico

Respuesta esperada:

El label configurado del paso de Parcial 1 de Análisis II.
Producir el resultado configurado bajo las condiciones indicadas.
Una resolución completa y legible, según contenido recibido.
Por el criterion mostrado, todavía no confirmado.
Abrir el Resource configurado.
Completion y progreso seguían sin confirmar.
Se abría el Resource; no se completaba el paso.

32.3. Escenario teórico escrito con Recommendation

Respuesta esperada:

El paso configurado del examen teórico escrito.
El objetivo configurado, distinto de la Action.
La producción escrita indicada.
El criterion visible.
Abrir la ActionRecommendation mediante COMPROMETERME.
Commitment y completion todavía no existían.
Se abría WF-S05; no se creaba Commitment.

32.4. Escenario VALIDATED sin ProgressUpdated

Respuesta esperada:

El ProtocolStep y su Assessment estaban identificados.
El objetivo configurado permanecía visible.
El entregable esperado permanecía visible.
El criterion esperado permanecía visible y no se presentaba como confirmado.
La Evidence estaba VALIDATED; Progress y el cierre del paso seguían sin confirmación.
La CTA abría el destino existente según precedencia.
Abrir ese destino no actualizaba Progress ni completaba el paso.

32.5. Escenario incompleto

Respuesta esperada:

El paso estaba identificado.
El objetivo se mostraba o figuraba explícitamente como no disponible.
El entregable figuraba explícitamente como no disponible.
El criterion figuraba explícitamente como no disponible.
El estado informaba contenido incompleto y cierre no confirmado.
La acción disponible era VOLVER AL OVERVIEW.
Volver no completaba el paso ni modificaba la preparación.

32.6. Matriz obligatoria de resultados 7/7

Variante mobile obligatoria	Paso	Objetivo	Entregable	Criterion	Estado	Acción	Después
paso disponible	identificado	visible	visible	visible; no confirmado	cierre no confirmado	ABRIR RECURSO	abre Resource; no completa
ActionRecommendation	identificado	visible	visible	visible	Recommendation disponible	COMPROMETERME	abre WF-S05; no crea Commitment
Action IN_PROGRESS	identificado	visible	visible	visible	Action en curso	CONTINUAR	abre Action vigente
Commitment MISSED	identificado	visible	visible	visible	MISSED preservado	RETOMAR	abre resolución real; no crea rescate
Evidence UNDER_REVIEW	identificado	visible	visible	visible	revisión real; no progreso	Resource o VER EVIDENCIA según gate real	abre destino; no completa
SUFFICIENT/VALIDATED sin ProgressUpdated	identificado	visible	visible	visible	lifecycle real; cambio pendiente	destino según precedencia	no infiere progreso ni cierre
ProgressUpdated	identificado	visible	visible	visible	sólo changed_dimensions	Resource o VER AVANCE según destino	no completa por el cambio
contenido incompleto	identificado	visible o no disponible	no disponible cuando falta	no disponible cuando falta	incompleto; cierre no confirmado	VOLVER AL OVERVIEW	conserva preparación
ruta no disponible	identificado	visible si seguro	visible si seguro	visible si seguro	destino no disponible	VOLVER AL OVERVIEW	conserva estados
modalidad fuera de P0	no disponible en P0	no disponible	no disponible	no disponible	fuera de alcance P0	VOLVER AL OVERVIEW	no adapta otro protocolo
	En cada celda, no disponible cuenta como comprensión correcta sólo cuando la pantalla declara explícitamente el faltante; nunca se completa contenido para aprobar el test.

32.7. Criterio de aprobación

Cada variante pasa únicamente con respuesta correcta para los 7 conceptos obligatorios: paso, objetivo, entregable, criterion, estado, acción y qué ocurre después.

Una sola respuesta incorrecta impide aprobar esa variante. Además, ninguna respuesta puede confundir:

objetivo con Action;
Evidence con dominio;
VALIDATED con ProgressUpdated;
ausencia de completion confirmada con estado negativo no recibido;
abrir con completion;
volver con abandono.

7/7 es el contrato de comprensión de esta prueba, no progreso del protocolo, score académico ni métrica de dominio.

***
33. CASOS LÍMITE

ProtocolStep cambia mientras está abierto: invalidar acciones, releer, no mantener criterio viejo.
Version cambia durante la sesión: no mergear; volver a WF-S10 o cargar la nueva versión completa.
sequence duplicada: no elegir current por orden; error de datos.
current y next son el mismo id: inconsistencia; no mostrar CTA de avance.
paso completed pero owner sigue declarándolo current: releer; no abrir como siguiente.
completion llega sin version: no asociar por label; mostrar conflicto.
Action vinculada a otra Assessment: excluir.
Recommendation principal expirada: releer; no COMPROMETERME.
Commitment MISSED + Evidence tardía: mostrar ambos; no cumplimiento retroactivo.
Evidence UNDER_REVIEW sin reviewer: En revisión; no persona ni SLA.
Evidence SUFFICIENT y VALIDATED en lecturas incompatibles: mostrar conflicto, no elegir el más favorable.
ProgressUpdated sin changed_dimensions: no inventar cambio; contrato/payload pendiente.
changed_dimensions incluye dimensión sin valor: mostrar sólo semántica respaldada; no comparación.
Resource rights restricted: no habilitar acceso si el contrato no autoriza; explicar disponibilidad sin inventar permiso.
Resource url expirada: invalidar CTA y releer.
Resource de otra versión: no mostrar.
entregable sin criterion: no afirmar evaluabilidad.
criterion sin entregable: no inferir producción.
required=false: no traducir como opcional sin semántica contractual de completion.
required=true: no bloquear navegación por sí solo.
primera apertura vs. reingreso: sin historial de visita, usar copy neutral.
dos preparaciones del mismo Assessment: error de identidad; no mergear.
fecha/modalidad disputed: labels separados; no adaptar protocolo.
modality cambia tras ACTIVE: mostrar valor vigente y volver; selección de versión pendiente.
oral con ProtocolStep accidentalmente recibido: no renderizar como P0 hasta asociación válida de modalidad/protocolo.
paso completado sin next: no asumir fin del protocolo.
paso completado + ProgressUpdated pendiente: completion factual; Progress pendiente.
ProgressUpdated + cierre del paso no confirmado: mostrar ambos separados.
WF-S10 no disponible: retorno a CourseEnrollment sólo si identidad real.
offline o falla de lectura: conservar estado conocido como histórico, no presentarlo como actual.

***
34. RIESGOS

Riesgo	Impacto	Guardarraíl
ProtocolStep se usa como Action	Engine pierde ownership	separación visual y contractual
UI completa paso por visita	progreso falso	no mutación al abrir
12 pasos se vuelven producto fijo	deuda pedagógica	sin números/porcentaje
criterion se evalúa en frontend	contrato inventado	sólo proyección
Resource se confunde con trabajo	apertura decorativa	copy no inicia/no completa
Evidence se eleva a dominio	falsa confianza	Execution/Production/Domain separados
VALIDATED actualiza progreso	causalidad falsa	ProgressUpdated separado
MISSED desaparece	historial maquillado	original persistente
revisión humana bloquea el modo	dependencia operacional	no gate sin owner/contrato; retorno siempre
contenido sin provenance parece oficial	confianza indebida	label desconocido
route/payload inventados	implementación frágil	SOURCE CONTRACT PENDING
next derivado por sequence	salto incorrecto	current/next autoritativos
modalidad oral usa práctico	experiencia incorrecta	estado fuera de P0
demasiada información en 360	falla 10 segundos	bloque crítico compacto
dos CTAs compiten	ambigüedad	precedencia única
read model se persiste	entidad nueva	proyección sin nombre de dominio
	***
35. SOURCE CONTRACT PENDING

ID	Contrato pendiente	Necesidad mínima	Fallback	Bloquea
UX09-SCP-01	asociación ExamPreparation–ExamProtocol/version	ids y vigencia	volver/ocultar	contenido
UX09-SCP-02	instancia de ProtocolStep por preparación	identidad y estado de instancia	no mostrar paso	UX09
UX09-SCP-03	current ProtocolStep	owner/campo/regla	volver a WF-S10	entrada
UX09-SCP-04	next ProtocolStep	owner/campo/regla	sin siguiente	continuidad
UX09-SCP-05	orden/sequence de instancia	orden autoritativo	sin posición	numeración
UX09-SCP-06	label/nombre	campo y versionado	label no disponible	comprensión
UX09-SCP-07	objetivo	campo, owner y provenance	objetivo no disponible	contenido
UX09-SCP-08	explicación	formato, owner, versionado	omitir	detalle
UX09-SCP-09	vínculo ProtocolStep–Resource	ids/cardinalidad	omitir Resource	recurso
UX09-SCP-10	tipos/renderer de Resource	valores soportados	link genérico sólo si real	formato
UX09-SCP-11	rights/access de Resource	regla de acceso	no abrir	recurso
UX09-SCP-12	descripción de entregable	campo/config	no disponible	producción
UX09-SCP-13	ProtocolArtifact–Evidence	cardinalidad y vínculo	no atribuir	estado
UX09-SCP-14	criterion semántico	formato y criterio evaluable	mostrar literal/no evaluar	completion
UX09-SCP-15	required semántico	efecto sobre completion	omitir label	obligatoriedad
UX09-SCP-16	condición de entrada del paso	inputs/gates	no afirmar disponible	state
UX09-SCP-17	condición de salida/completion	trigger y regla	no completar	completion
UX09-SCP-18	registro/estado por paso	entidad/lectura e historia	sólo hecho explícito	estado
UX09-SCP-19	owner técnico de protocolo	servicio de escritura	read-only	implementación
UX09-SCP-20	payload ProtocolStepCompleted	preparation, step, version, time, dedupe	no contar	completion
UX09-SCP-21	Evidence/Artifact/validation → completion	mapping explícito	separado	completion
UX09-SCP-22	ProgressUpdated → completion	si existe alguna relación	separado	causalidad
UX09-SCP-23	gate durante UNDER_REVIEW	owner, condition y copy	no gate	precedencia
UX09-SCP-24	navegación UX08→UX09	ruta/payload	volver	handoff
UX09-SCP-25	rutas a Resource y objetos	destinos canónicos	volver	CTA
UX09-SCP-26	freshness/staleness	timestamp/regla	releer/omitir	vigencia
UX09-SCP-27	provenance de contenido	source/status/version	desconocido	confianza
UX09-SCP-28	modalidad cambia tras ACTIVE	reasociación de protocolo	volver	P0
UX09-SCP-29	historial de apertura	visit/read contract	no afirmar visita previa	estados 10/11
UX09-SCP-30	agregación de Evidence múltiples	sufficiency/completion	no agregar	estado
UX09-SCP-31	ProgressUpdated payload/causalidad	snapshots, changed_dimensions, relation	sólo confirmado	avance
UX09-SCP-32	reviewer/assignment/SLA	datos reales	omitir	no bloqueo
UX09-SCP-33	deduplicación completion/current	identidad/idempotencia	releer	integridad
	Se heredan todos los SOURCE CONTRACT PENDING aplicables de UX07 y UX08 y de Próxima Acción, Compromiso, Evidencia y Progreso. Esta tabla no los resuelve.

***
36. CHANGE REQUESTS INEVITABLES

CR-UX09-01 — Contrato canónico de instancia, current, next y completion

Tipo: contrato bloqueante de implementación.  
No propone solución de dominio.

Debe congelar:

asociación ExamPreparation–ExamProtocol/version;
instancia de ProtocolStep por preparación;
owner y campo de current;
owner y campo de next;
condición de entrada/salida;
forma autoritativa de completion;
deduplicación e historia.

Hasta entonces: sin posición, sin avance automático y sin completion inferida.

CR-UX09-02 — Esquema versionado de contenido del paso

Debe congelar campos y ownership de:

label;
objetivo;
explicación;
Resource relacionado;
descripción del entregable;
provenance y freshness.

ProtocolStep.criterion y required ya existen, pero su semántica completa de render y completion debe cerrarse. WF-S11 no propone nombres técnicos.

CR-UX09-03 — Contrato de handoffs

Debe congelar ruta, payload, autorización, staleness y fallback para:

UX08 → UX09;
Resource;
Action;
Commitment;
Evidence;
WF-S08;
Bitácora;
nuevo current step;
retorno WF-S10.

Hasta entonces los destinos son conceptuales y toda CTA requiere que la capa propietaria entregue una ruta real.

CR-UX09-04 — Revisión formal sin bloqueo del Modo Examen

Las fuentes anteriores indican revisión humana para entregables formales, mientras los specs aprobados posteriores prohíben inventar reviewer/SLA y congelan que Modo Examen no espera bloqueado a un operador.

El contrato debe precisar:

qué artefactos realmente requieren revisión;
cuándo UNDER_REVIEW es un gate;
qué trabajo puede continuar sin gate;
cómo se identifica el owner;
cómo se cumple la regla no bloqueante.

Hasta entonces:

revisión sólo se muestra si es real;
no se promete persona o SLA;
UNDER_REVIEW no es progreso ni completion;
sin gate autoritativo, Resource u objeto accionable conserva precedencia;
siempre existe retorno.

36.5. Change Request heredado

CR-UX08-01 sobre owner canónico de PreparationReadiness permanece abierto. UX09 no muestra readiness y no intenta resolverlo.

***
37. TRAZABILIDAD CONTRA FUENTES APROBADAS

Fuente	Decisión aplicada en UX09
Product Spec v0.5 FINAL	Academic Decision Engine prioriza; Evidence separa ejecución/producción/dominio; Protocolos definen hitos; no readiness predictiva
User Flow + Data Model v0.2 FINAL	entidades ExamPreparation, ExamProtocol, ProtocolStep, ProtocolArtifact y Resource; campos mínimos; lifecycles; ProtocolStepCompleted; 12 pasos provisionales; P0 práctico/teórico
Hoy/Autogestión APPROVED	precedencia de lifecycle sobre contexto; una CTA; TodayView no prioriza; siguiente evento real
Materia/Cursado APPROVED	identidad CourseEnrollment/Assessment, provenance, separación de dimensiones y retorno
Próxima Acción APPROVED	Recommendation preexistente; ActionRecommendation → Action ACCEPTED; ME COMPROMETO no crea Commitment; contexto Examen no decide Action
Compromiso APPROVED	lifecycle, MISSED histórico, inicio coordinado, renegociación/rescate fuera de WF-S11
Evidencia APPROVED	lifecycle completo; UNDER_REVIEW opcional y real; SUFFICIENT/VALIDATED sin Progress; reenvío conserva anterior; reviewer/SLA sólo con datos
Progreso + Bitácora APPROVED	changed_dimensions, no-cambio vs pendiente vs error, causalidad no inferida, bitácora histórica
Activación Modo Examen APPROVED	ExamPreparation/Assessment/CourseEnrollment, P0 modality, provenance, ACTIVE no crea Action/Commitment
Modo Examen Overview APPROVED	handoff ABRIR PASO ACTUAL, precondiciones, payload conceptual, precedencia 1–10, current/next/completion/ruta pendientes, sin porcentajes/readiness
	37.1. Trazabilidad contra decisiones del sprint

Requisito UX09	Resolución
objetivo	§14 + wireframes
por qué importa/explicación	§15; sólo config
Resource	§16; Resource real
entregable	§17; ProtocolArtifact sin inferencia
criterion	§18; campo respaldado
estado operativo	§§19–22
acción disponible	matriz §19
continuar	§20 + handoffs
práctico/teórico	§§12.3, 25.1, 25.13
fuera de P0	§25.12
completion	§20 + SCP/CR
provenance	§23
360 px	§25
desktop	§26
errores	§27
contratos/ownership	§28
retorno	§30
10 segundos	§32
	37.2. Self-audit final

Criterio	Resultado
Sin 12 pasos hardcodeados	PASS
Abrir no completa	PASS
ProtocolStep ≠ ActionRecommendation	PASS
UI no prioriza	PASS
No Action creada localmente	PASS
Evidence lifecycle preservado	PASS
SUFFICIENT/VALIDATED ≠ ProgressUpdated	PASS
MISSED preservado	PASS
Execution/Production/Domain separados	PASS
Completion no inventada	PASS con SOURCE CONTRACT PENDING
Readiness no inventada	PASS
Sin aprobación/reviewer/SLA ficticios	PASS
Sin artefactos internos completos	PASS
Provenance/verification preservados	PASS con contrato de contenido pendiente
Sin Engines/entidades/eventos/enums nuevos	PASS
CTA única con destino real	PASS con rutas SOURCE CONTRACT PENDING
Objetivo/entregable/criterion visibles	PASS
Estado/CTA/Después visibles en 360 px	PASS
Retorno seguro a WF-S10	PASS
	37.3. Trazabilidad de correcciones P0/P1

Finding	Corrección aplicada	Ubicaciones principales	Contratos preservados
P0	La auditoría registró 0 P0; no se aplicaron cambios P0	no aplica	todas las decisiones aprobadas
UX09-PO-P1-01	se reemplazó toda negación default de completion por cierre no confirmado; abrir sigue sin completar y completion positiva continúa exigiendo fuente autoritativa	§§19, 24.3, 25.1, 25.7, 25.8, 32.4 y 33	sin enum, evento, owner ni completion nuevos
UX09-PO-P1-02	el test exige 7/7 conceptos en cada variante obligatoria; un faltante explícito cuenta como comprensión, no como contenido completado	§§32.4–32.7	JTBD intacto; sin scoring académico
UX09-PO-P1-03	se separó el rótulo de datos del Assessment del contenido del protocolo y del Resource; cada grupo mobile usa metadata idéntica o Fuente del contenido no disponible	§§25.0–25.13	sin source, verification_status, campo ni contrato inventados
	No se implementaron P2. Los SOURCE CONTRACT PENDING y Change Requests estructurales permanecen abiertos y sin modificación.

***
ESTADO DEL DOCUMENTO

ACHIEVE_PASO_PROTOCOLO_EXAMEN_FUNCTIONAL_WIREFRAME_v0.2_CANDIDATE.md queda:

READY FOR CLOSED LEAD PRODUCT OWNER REAUDIT


***

PARTE VII — BACKLOG DEL PROTOTIPO

ACHIEVE — BACKLOG DEL PROTOTIPO INTEGRADO

Versión: v1.0  
Rol documental: owner canónico del crosswalk backlog–contrato–CTA–fixture–escenario  


1. Alcance

La aprobación documental de este backlog no autoriza implementación ni actividad posterior por sí misma. Ordena únicamente QA interna de una baseline con fixtures sintéticos y registra dependencias futuras sin iniciarlas. Usa C01 v1.0 aprobado/promovido y CR-UX09-04 aprobado/promovido. No existen tareas para promover el CR. Cobertura canónica y exhaustiva UX01–UX09. WF-S10 → UX08; WF-S11 → UX09.

Owner de contratos/fixtures/matriz C01: ACHIEVE_CONTRATOS_MINIMOS_PROTOTIPO_v1.0_APPROVED.md. Owner de CTAs: ACHIEVE_GOLDEN_PATH_UNIFICADO_v1.0_APPROVED.md. Owner de escenarios: ACHIEVE_ESCENARIOS_PRUEBA_v1.0_APPROVED.md.

2. Crosswalk canónico de ítems conductuales de QA

Backlog	Resultado conductual verificable	Contrato	CTA/transición	Fixture	Escenario	Resultado autoritativo esperado	C01
BL-01	proyectar recomendación ADE sin ranking UI	CO-01/03/12	CTA-002	FX-DAY-BASE/FX-ADE-*	SC-DAY-02, SC-ADE-01…04	recomendación ADE, ausencia, error o pending	006
BL-02	separar recomendar y aceptar Action	CO-03	CTA-003	FX-DAY-BASE	SC-DAY-02	ActionAccepted confirmado	007
BL-03	mostrar contenido ejecutable sintético	CO-03/05	CTA-005/006	FX-DAY-BASE	SC-DAY-03	sólo navegación/estados propios	008
BL-04	aceptar Action idempotentemente	CO-03/16	CTA-003/014	FX-ERROR-IDEM	SC-ERR-01	una sola Action aceptada	009
BL-05	recorrer Commitment y rescate preservando original	CO-04	CTA-004/005/006/015	FX-DAY-BASE/FX-MISSED	SC-DAY-03/04	lifecycle confirmado; rescate preserva el original MISSED	010
BL-06	separar ActionAccepted de CommitmentCreated	CO-03/04/16	CTA-003/004	FX-DAY-BASE	SC-DAY-02/03	dos confirmaciones autoritativas distintas	011
BL-07	presentar Evidence sin auto-suficiencia	CO-05	CTA-007	FX-EVD-BASE	SC-EV-01	SUBMITTED	012
BL-08	separar criterio, suficiencia y validación	CO-05	transición owner	FX-EVD-BASE	SC-EV-02	SUFFICIENT/INSUFFICIENT; eventual VALIDATED	013
BL-09	preservar referencias Evidence–Commitment/Protocol	CO-05	CTA-007/008	FX-EVD-BASE	SC-EV-01/03	relaciones declaradas, no inferidas	014
BL-10	evitar Evidence duplicada	CO-05/16	CTA-007/014	FX-ERROR-IDEM	SC-ERR-02	una identidad reconciliada	015
BL-11	distinguir revisión real de método configurado	CO-05/08/16	transición/CTA-014	FX-REV-CREATED/CONFIG/BAD	SC-REV-01…03	sólo instancia real permite UNDER_REVIEW	016
BL-12	mostrar Progress/no-cambio y habilitar re-evaluación	CO-11/12	CTA-009	FX-ADE-*	SC-PROG-01, SC-ADE-01…04	Progress autoritativo; ADE decide	018
BL-13	mostrar dimensiones sin score universal	CO-11	CTA-009	config HUMAN-P0-02	SC-PROG-01/SC-H-02	dimensiones o ausencia honesta	019
BL-14	mostrar entrada Bitácora sin generar Action	CO-11/12	CTA-009/002	entrada sintética/FX-ADE-*	SC-PROG-01, SC-ADE-01…04	Bitácora factual; recomendación sólo ADE	020
BL-15	activar Modo Examen explícitamente	CO-13/16	CTA-011	FX-EXAM-BASE	SC-EX-01	ExamPreparation ACTIVE	024
BL-16	preservar lifecycle ExamPreparation	CO-13	CTA-011/010	FX-EXAM-BASE	SC-EX-01/05	estado autoritativo, sin readiness	025
BL-17	abrir paso actual provisto por owner	CO-14	CTA-012	FX-EXAM-BASE	SC-EX-02	WF-S10 → UX08, WF-S11 → UX09	026
BL-18	mostrar contenido/Resource versionado	CO-14	CTA-012	FX-EXAM-BASE	SC-EX-03	sólo contenido provisto	027
BL-19	separar completion de Evidence/Progress	CO-05/11/14	CTA-007/009/013	FX-EXAM-BASE/FX-EVD-BASE	SC-EX-04/05	ninguna inferencia automática	028
BL-20	proyectar assignment válido y omitir inválido	CO-09/10/15	proyección/omisión	FX-ASG-VALID/NONE/BAD	SC-ASG-01…03	referencia operacional; no Intervention/review	039
BL-21	manejar academic_context_blocker	CO-02/03	CTA-001/002/010	FX-DAY-BASE sin contexto	SC-DAY-05	navegación segura; sin recomendación inventada	050
BL-22	manejar Reflection opcional/obligatoria/inválida	CO-06/07	CTA-016/007	FX-REFL-OPT/REQ/BAD	SC-REF-01…03	objeto separado; bloqueo localizado	051
BL-23	renegociar Commitment elegible y rechazar edición retroactiva	CO-04/16	CTA-017/018	FX-REN-ELIGIBLE/INELIGIBLE	SC-REN-01/02	elegible: original RENEGOTIATED + nuevo CONFIRMED para misma Action y CommitmentRenegotiated; no elegible/error: original intacto y reconciliación	010
	Control: 23/23 ítems conductuales tienen contrato y escenario; 18/18 CTAs tienen escenario; cero escenarios sin contrato. El registro CTA normativo no se duplica aquí. SC-DAY-04 conserva exclusivamente el rescate; SC-REN-01/02 prueban renegociación.

3. Dependencias de contrato futuras — no iniciadas

Estos ítems no describen comportamiento a implementar en P01; preservan el destino documental de contratos abiertos.

Backlog	Dependencia futura	Contrato relacionado	Escenario de control	C01	Estado P01
BL-FUT-01	identidad/tenancy/schema ADL	CO-01/02	SC-GOV-01	001	OPEN — NOT STARTED
BL-FUT-02	provenance/vigencia/derechos	CO-02/15	SC-PRIV-01	002	OPEN — NOT STARTED
BL-FUT-03	lifecycles académicos	CO-02	SC-GOV-01	003	OPEN — NOT STARTED
BL-FUT-04	class_event_record	CO-11/12	SC-ADE-01	004	OPEN — NOT STARTED
BL-FUT-05	Assessment multifuente/dedupe	CO-13	SC-EX-01	005	OPEN — NOT STARTED
BL-FUT-06	privacidad/retención Evidence/Reflection	CO-07/15	SC-PRIV-01	017	OPEN — NOT STARTED
BL-FUT-07	Risk Engine/sujeto	CO-01	SC-GOV-01	021	OPEN — NOT STARTED
BL-FUT-08	Risk–Intervention–Outcome	CO-09	SC-ASG-01	022	OPEN — NOT STARTED
BL-FUT-09	Product Event Model	CO-16	SC-ERR-01	023	OPEN — NOT STARTED
BL-FUT-10	readiness scoped	CO-13/14	SC-EX-05	029	OPEN — NOT STARTED
BL-FUT-11	autorización/permisos/privacidad institucional	CO-15	SC-PRIV-01	030	OPEN — NOT STARTED
BL-FUT-12	webhooks/sync/reconciliación	CO-16	SC-ERR-03	040	OPEN — NOT STARTED
BL-FUT-13	Architecture/API/Data/Integration Spec	CO-16/18	SC-GOV-02	041	OPEN — NOT STARTED
BL-FUT-14	golden dataset/adquisición/legalidad	CO-07/15/18	SC-GATE-02	042	OPEN — NOT STARTED
BL-FUT-15	Student Model/Personal Engine	CO-03/12	SC-GOV-02	043	OPEN — NOT STARTED
BL-FUT-16	playbooks/SLA/Human QA piloto	CO-09/10/18	SC-GATE-05/06	044	OPEN — NOT STARTED
BL-FUT-17	corrigendum promoción/precedencia	CO-18	SC-GOV-03	045	OPEN — NOT STARTED
BL-FUT-18	métricas/visibilidad institucional piloto	CO-07/18	SC-GATE-06	046	OPEN — NOT STARTED
	C01-045 — OPEN — PRIMARY WS7 — BEFORE FORMAL TECHNICAL HANDOFF

P01 no es handoff técnico formal y no inicia WS7 ni otro workstream.

4. HUMAN-P0 — pendientes, no respuestas

Backlog	ID canónico	Cláusula/default	Contrato	Escenario	Estado
BL-H-01	HUMAN-P0-01	PROVISIONAL-HUMAN-P0-01 v0.1	CO-14	SC-H-01	OPEN — HUMAN CONFIRMATION PENDING
BL-H-02	HUMAN-P0-02	PROVISIONAL-HUMAN-P0-02 v0.1	CO-11	SC-H-02	OPEN — HUMAN CONFIRMATION PENDING
BL-H-03	HUMAN-P0-03	PROVISIONAL-HUMAN-P0-03 v0.1	CO-05/14	SC-H-03	OPEN — HUMAN CONFIRMATION PENDING
BL-H-04	HUMAN-P0-04	PROVISIONAL-HUMAN-P0-04 v0.1	CO-14	SC-H-04	OPEN — HUMAN CONFIRMATION PENDING
BL-H-05	HUMAN-P0-05	PROVISIONAL-HUMAN-P0-05 v0.1	CO-05/11	SC-H-05	OPEN — POTENTIALLY ANSWERED — REQUIRES SOURCE CONFIRMATION
BL-H-06	HUMAN-P0-06	PROVISIONAL-HUMAN-P0-06 v0.1	CO-05/08	SC-H-06	OPEN — HUMAN CONFIRMATION PENDING
BL-H-07	HUMAN-P0-07	PROVISIONAL-HUMAN-P0-07 v0.1	CO-05/14	SC-H-07	OPEN — HUMAN CONFIRMATION PENDING
BL-H-08	HUMAN-P0-08	PROVISIONAL-HUMAN-P0-08 v0.1	CO-06/14	SC-H-08	OPEN — HUMAN CONFIRMATION PENDING
	Owner normativo del detalle: ACHIEVE_CONFIG_PSICOPEDAGOGICA_PROVISIONAL_v1.0_APPROVED.md.

5. C01-P2 diferidos

Backlog	C01	Tratamiento	Escenario	Estado
BL-DEF-01	C01-047	modalidad oral/otras familias omitidas	SC-DEF-01	OPEN — DEFERRED — NOT IMPLEMENTED
BL-DEF-02	C01-048	integraciones profundas omitidas	SC-DEF-01	OPEN — DEFERRED — NOT IMPLEMENTED
BL-DEF-03	C01-049	hardening/automatización avanzada omitidos	SC-DEF-01	OPEN — DEFERRED — NOT IMPLEMENTED
	C01-P2 implementados: cero.

6. Separación de gates

Capa	Backlog	Autorización en este gate
QA interna con fixtures sintéticos	BL-01…23	SÍ, único alcance inmediato
comprensión futura	no iniciado; contenido sintético mientras datos/privacidad sigan abiertos	NO
UX/research futuro	no iniciado	NO
validación psicopedagógica por profesional real	BL-H-01…08	NO; sigue pendiente
implementación productiva	BL-FUT-01…18	NO
piloto institucional	BL-FUT-14/16/18	NO; estudiantes no autorizados
	Completar QA no habilita automáticamente high-fidelity. Comprensión no valida psicopedagogía; UX no responde HUMAN-P0.

7. P2 de la auditoría P01

P01-AUD-P2-01: NOT IMPLEMENTED — NON-BLOCKING IMPROVEMENT (no coverage report automático).
P01-AUD-P2-02: NOT IMPLEMENTED — NON-BLOCKING IMPROVEMENT (no glosario consolidado adicional).

8. Estado

La matriz C01 normativa confirma 51/51 OPEN, 0 P0 / 48 P1 / 3 P2. EP01 sigue provisional, reversible, no aprobado y no promovido. Ningún HUMAN-P0 fue respondido.


***

PARTE VIII — ESCENARIOS DE PRUEBA / CRITERIOS DE ACEPTACIÓN

ACHIEVE — ESCENARIOS DE PRUEBA DEL PROTOTIPO

Versión: v1.0  
Rol documental: owner canónico de escenarios de aceptación y separación de gates  


1. Alcance

Estos escenarios sirven exclusivamente para QA interna con fixtures sintéticos. Cada escenario referencia al menos un contrato observable de ACHIEVE_CONTRATOS_MINIMOS_PROTOTIPO_v1.0_APPROVED.md, un fixture y, cuando existe interacción, un CTA del registro canónico de ACHIEVE_GOLDEN_PATH_UNIFICADO_v1.0_APPROVED.md §5. Ningún escenario cierra C01/HUMAN-P0 ni autoriza estudiantes.

2. Escenarios canónicos

Escenario	Contrato observable	Fixture	CTA/transición	Resultado esperado	C01
SC-DAY-01	CO-01/02	FX-DAY-BASE	CTA-001	Hoy abre Materia sin mutar ni priorizar	001–004
SC-DAY-02	CO-03/04	FX-DAY-BASE	CTA-002/003	abre UX03 y acepta Action; aún no existe Commitment	006,007,009,011
SC-DAY-03	CO-04/05	FX-DAY-BASE	CTA-004/005/006	crea, inicia y completa Commitment; no envía Evidence	008–012
SC-DAY-04	CO-04/16	FX-MISSED	CTA-015	rescate preserva Commitment original MISSED	010,011
SC-REN-01	CO-04/16	FX-REN-ELIGIBLE	CTA-017/018	abre renegociación con original no editable; al confirmar, owner marca original RENEGOTIATED, devuelve nuevo Commitment CONFIRMED para la misma Action, preserva old/new y emite CommitmentRenegotiated	010,011
SC-REN-02	CO-04/16	FX-REN-INELIGIBLE	CTA-017 no disponible; CTA-018 no se ofrece	Commitment STARTED/MISSED o no elegible no puede editarse; original intacto; continuar/bloqueo o rescate; error de elegibilidad se relee sin mutación	010,011
SC-DAY-05	CO-01/02/03	FX-DAY-BASE sin recomendación	CTA-010	retorno seguro y ausencia honesta; UI no crea Action	006,050
SC-EV-01	CO-05	FX-EVD-BASE	CTA-007	submit confirmado produce SUBMITTED, no suficiencia	012,014
SC-EV-02	CO-05	FX-EVD-BASE con resultado	transición del owner	SUFFICIENT/INSUFFICIENT y eventual VALIDATED permanecen separados	013
SC-EV-03	CO-05/16	FX-EVD-BASE	CTA-008	resubmission conserva Evidence anterior	014,015
SC-REF-01	CO-06/07	FX-REFL-OPT	CTA-016 u omisión	Reflection opcional puede existir separada u omitirse sin bloqueo	017,051
SC-REF-02	CO-06/07	FX-REFL-REQ	CTA-016/007	Reflection obligatoria válida habilita sólo el submit dependiente	017,051
SC-REF-03	CO-06/07	FX-REFL-BAD	CTA-016	ausente/inválida no crea objeto; corregir/volver; Evidence no cambia	017,051
SC-REV-01	CO-05/08/15	FX-REV-CREATED	transición factual	revisión real creada, autorizada y consistente permite UNDER_REVIEW	016,030
SC-REV-02	CO-05/08	FX-REV-CONFIG	ninguna	método humano configurado sin revisión creada mantiene SUBMITTED	016
SC-REV-03	CO-05/08/16	FX-REV-BAD	CTA-014	referencia faltante/inconsistente produce error/reconciliación; sigue SUBMITTED	016,040
SC-ASG-01	CO-09/10/15	FX-ASG-VALID	proyección	assignment real, vigente y autorizado se muestra sólo a visibilidad permitida; no es Intervention/review	022,030,039
SC-ASG-02	CO-09/10	FX-ASG-NONE	omisión	ausencia de assignment se omite sin bloquear	039
SC-ASG-03	CO-10/15/16	FX-ASG-BAD	omisión/relectura	vencido/no autorizado se oculta y no promete atención	030,039,040
SC-PROG-01	CO-11	entrada sintética	CTA-009	Bitácora muestra sólo hecho autoritativo; sin porcentaje global	018–020
SC-ADE-01	CO-11/12/03	FX-ADE-NEW	relectura/CTA-002	hecho nuevo habilita re-evaluación; ADE devuelve nueva recomendación; UI sólo proyecta	004,006,018,020
SC-ADE-02	CO-11/12	FX-ADE-NONE	CTA-010	ADE confirma ausencia; empty honesto	006,018,020
SC-ADE-03	CO-12/16	FX-ADE-ERROR	CTA-014	error/reintento sin recomendación inventada	006,018,040
SC-ADE-04	CO-12	FX-ADE-PENDING	relectura posterior	resultado todavía no disponible; la UI no rankea	006,018
SC-EX-01	CO-13/16	FX-EXAM-BASE	CTA-011	activa ExamPreparation una vez; no crea readiness/Action/Progress	005,024,025
SC-EX-02	CO-13/14	FX-EXAM-BASE	CTA-012	WF-S10 → UX08; owner provee paso actual; WF-S11 → UX09	025,026
SC-EX-03	CO-14	FX-EXAM-BASE	CTA-012	UX09 muestra sólo contenido/Resource versionado provisto	026,027
SC-EX-04	CO-03/14	FX-EXAM-BASE + recomendación	CTA-013	ProtocolStep no crea Action; se deriva a UX03 con recomendación ADE real	006–008,028
SC-EX-05	CO-13/14	FX-EXAM-BASE	CTA-010	regreso a Overview/Materia/Hoy no abandona ExamPreparation ni afirma readiness	025,028,029
SC-ERR-01	CO-03/04/16	FX-ERROR-IDEM	CTA-003/004/014	respuesta perdida se reconcilia sin duplicar Action/Commitment	009,011,023
SC-ERR-02	CO-05/16	FX-ERROR-IDEM	CTA-007/014	submit duplicado no crea dos Evidence	015,023
SC-ERR-03	CO-10/12/16	FX-ERROR-IDEM	CTA-014	sync/relectura conserva último estado conocido	040
SC-PRIV-01	CO-07/10/15	fixture sin autorización	omisión/denegación	contenido/assignment no autorizado no se proyecta	002,017,030
SC-GOV-01	CO-01/02/11	fixtures sintéticos	lectura	fixture satisface QA pero todos los contratos asociados siguen OPEN	001–004,021
SC-GOV-02	CO-12/16	omisión	ninguna	P01 no define arquitectura/API/Data/Student Model ni inicia workstream	041,043
SC-GOV-03	CO-16	omisión documental	ninguna	se reproduce estado de C01-045 y P01 no inicia WS7	045
SC-DEF-01	CO-14/16	omisión explícita	ninguna	C01-047…049 permanecen OPEN/DEFERRED; cero P2 implementados	047–049
SC-H-01	CO-14	config HUMAN-P0-01 v0.1	lectura	granularidad visible como asunción provisional sustituible	031
SC-H-02	CO-11	config HUMAN-P0-02 v0.1	lectura	dimensiones separadas; sin score/readiness	032
SC-H-03	CO-05/14	config HUMAN-P0-03 v0.1	CTA-016/007	recuperación y apoyo permanecen outcomes separados	033
SC-H-04	CO-14	config HUMAN-P0-04 v0.1	lectura	H24 muestra prioridades, no checklist universal	034
SC-H-05	CO-05/11	config HUMAN-P0-05 v0.1	lectura	sin desempeño observable se muestra no evaluado	035
SC-H-06	CO-05/08	config HUMAN-P0-06 v0.1	transición	aplicabilidad provisional no altera mecanismo promovido del CR	036
SC-H-07	CO-05/14	config HUMAN-P0-07 v0.1	lectura	criterio diferenciado; no se inventa rúbrica	037
SC-H-08	CO-06/13/14	config HUMAN-P0-08 v0.1	CTA-016 u omisión	postmortem flexible y no culpabilizante, sin cantidad fija	038
	3. Separación obligatoria de gates

Gate	Alcance	Estado en P01	Contenido/datos	Qué no demuestra o autoriza	Escenario
QA interna	coherencia de recorrido, estados, errores y trazabilidad con fixtures	único alcance inmediato	exclusivamente sintético	no valida comprensión, UX externa, psicopedagogía, implementación ni piloto	SC-GATE-01
Comprensión futura	si una persona entiende copy/tarea	FUTURO; autorización separada	sintético mientras datos/privacidad aplicables sigan abiertos	no valida psicopedagogía ni producto	SC-GATE-02
UX/research futuro	usabilidad y experiencia	FUTURO; autorización separada	protocolo específico aprobado	no responde HUMAN-P0	SC-GATE-03
Psicopedagogía real	validar/contestar criterios HUMAN-P0	FUTURO; profesional real	paquete trazable	una prueba de comprensión/UX no la sustituye	SC-GATE-04
Implementación productiva	arquitectura, datos, seguridad, integraciones	FUTURO; gate técnico separado	contratos cerrados/autorizados	QA no autoriza implementación	SC-GATE-05
Piloto institucional	operación real y medición institucional	FUTURO; autorización institucional separada	datos/privacidad/playbooks/SLA aprobados	no hay estudiantes autorizados ahora	SC-GATE-06
	Escenarios de control de gates

Escenario	Contrato observable	Fixture	Resultado esperado	C01
SC-GATE-01	CO-18 (separación documental de gates)	todos sintéticos	QA termina sin promover ni habilitar high-fidelity automáticamente	todos OPEN
SC-GATE-02	CO-07/15/18	contenido sintético	comprensión queda futura y no usa datos reales	017,030,042
SC-GATE-03	CO-18	ninguno	UX/research queda futura y no responde HUMAN-P0	031–038
SC-GATE-04	CO-18	ninguno	sólo profesional real puede confirmar HUMAN-P0	031–038
SC-GATE-05	CO-16/18	ninguno	implementación no iniciada; sin arquitectura/API nueva	041,044
SC-GATE-06	CO-07/15/18	ninguno	piloto/estudiantes no autorizados	042,044,046
	CO-18 es el contrato observable documental de separación de gates: cada capa exige decisión, entradas, responsables y evidencia propios; no existe promoción automática entre capas.

4. Controles de cobertura

escenarios canónicos: todos referencian contrato observable;
CTAs del registro canónico: todos poseen al menos un escenario;
ramas obligatorias de Reflection: 3/3;
ramas assignment: 3/3;
ramas revisión real/config-only/inconsistente: 3/3;
ramas ADE: 4/4;
ramas de renegociación: 2/2, positiva y negativa; SC-DAY-04 reservado a rescate;
capas de gate: 6/6;
estudiantes autorizados: cero;
C01 cerrados por prueba: cero.

Conteo recalculado: 45 escenarios canónicos + 6 escenarios de gates = 51 escenarios totales, todos con contrato observable. CTAs canónicas: 18/18 con escenario.

5. Estado preservado

C01-045 — OPEN — PRIMARY WS7 — BEFORE FORMAL TECHNICAL HANDOFF

P01 no es handoff técnico formal, no inicia WS7 y no inicia ningún workstream. EP01 y HUMAN-P0 permanecen abiertos según Configuración provisional.


***

PARTE IX — CONFIGURACIÓN PSICOPEDAGÓGICA PROVISIONAL

ACHIEVE — CONFIGURACIÓN PSICOPEDAGÓGICA PROVISIONAL

Versión: v1.0  
Rol documental: owner canónico downstream de defaults provisionales y trazabilidad HUMAN-P0  


1. Declaración de seguridad y autoridad

Esta configuración consume EP01 como material provisional, reversible, no aprobado y no promovido. No atribuye decisiones a una profesional real, no responde ningún HUMAN-P0, no crea criterio psicopedagógico nuevo y no autoriza pruebas con estudiantes. El mecanismo de revisión selectiva se rige por ACHIEVE_CR_UX09_04_REVISION_HUMANA_SELECTIVA_v1.0_APPROVED.md, aprobado y promovido; la aplicabilidad concreta sigue abierta bajo HUMAN-P0-06.

Estado EP01: CANDIDATE — PROVISIONAL — HUMAN CONFIRMATION PENDING — NOT APPROVED — NOT PROMOTED.

2. Política de defaults

Todo default debe conservar ID canónico, cláusula, versión, alcance, consumidores, fallback, punto de sustitución y estado humano. Si afecta copy, criterio o comportamiento visible, la UI/fixture interno lo identifica como asunción provisional pendiente de confirmación humana. Cambiar una versión no reescribe historia ni convierte fixtures pasados en hechos productivos.

3. Registro canónico HUMAN-P0

ID canónico	Cláusula	Versión default	Default provisional y efecto visible	Fallback	Consumidores	Punto de sustitución	Estado humano exacto
HUMAN-P0-01	PROVISIONAL-HUMAN-P0-01	v0.1	baseline granular de 20 IDs; obligatoriedad/orden/repetición configurables; cualquier paso/copy visible declara asunción provisional	no mostrar 20 pasos, orden fijo ni obligatoriedad universal	UX08, UX09, ExamProtocol, ProtocolStep, Backlog, Escenarios	reglas por ID de definición/versionado; reemplazo por delta sin renumerar historia	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-02	PROVISIONAL-HUMAN-P0-02	v0.1	dimensiones preservadas; lectura breve sólo secundaria; copy no afirma score/readiness	omitir resumen y mostrar dimensiones/hechos o no evaluado	UX02, UX06, UX08, Progress, ProtocolStep	regla de proyección/comunicación, sin reconstruir datos perdidos	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-03	PROVISIONAL-HUMAN-P0-03	v0.1	recuperación activa central y apoyo producido opcional/contextual; prompts visibles separados	omitir outcome no aplicable; no inferir aprendizaje desde apoyo	UX05, UX09, Evidence, ProtocolStep, ADE	relación/aplicabilidad de outcomes del mismo paso	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-04	PROVISIONAL-HUMAN-P0-04	v0.1	H24 como jerarquía adaptable, no checklist; prioridades visibles se marcan provisionales	mostrar sólo prioridades provistas; no prometer compensación/readiness	UX08, UX09, ExamProtocol, ProtocolStep	composición H24 por definición/versionado, conservando ocurrencias previas	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-05	PROVISIONAL-HUMAN-P0-05	v0.1	aprendizaje sólo desde desempeño observable con condiciones/criterio; copy neutral si no existe	todavía no evaluado; no usar lectura, tiempo, confianza o submit	UX05, UX06, Evidence, Progress, ProtocolStep	clasificación localizada de señal conservando Evidence y provenance	OPEN — POTENTIALLY ANSWERED — REQUIRES SOURCE CONFIRMATION
HUMAN-P0-06	PROVISIONAL-HUMAN-P0-06	v0.1	criterio objetivo cuando alcanza; humano cuando requiere juicio; selección visible es provisional	sin revisión real: Evidence SUBMITTED; continuidad no dependiente	UX05, UX08, UX09, Validation, Evidence, ProtocolStep	aplicabilidad por producción/paso; no modifica mecanismo promovido del CR	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-07	PROVISIONAL-HUMAN-P0-07	v0.1	criterios diferenciados práctico/teórico escrito y pauta disciplinar cuando exista	no inventar rúbrica/score; omitir criterio no disponible o usar fixture identificado	UX05, UX09, Evidence, ProtocolStep	familia/criterio por definición versionada	OPEN — HUMAN CONFIRMATION PENDING
HUMAN-P0-08	PROVISIONAL-HUMAN-P0-08	v0.1	postmortem flexible, gradual y no culpabilizante; momento/cantidad visibles como asunción	omitir o diferir sin declarar abandono/completion	UX08, UX09, ProtocolStep post-examen, Evidence/Reflection	regla post-examen prospectiva; no altera el Assessment pasado	OPEN — HUMAN CONFIRMATION PENDING
	Estado general del conjunto: OPEN — HUMAN CONFIRMATION PENDING. Excepción conservada: HUMAN-P0-05 — OPEN — POTENTIALLY ANSWERED — REQUIRES SOURCE CONFIRMATION.

4. Tabla de aliases histórica — no normativa

Los aliases sólo ayudan a localizar candidatos v0.1. Nunca sustituyen IDs canónicos.

Alias histórico	ID canónico obligatorio	Uso permitido
P0-01 / D-01 / H-01	HUMAN-P0-01	búsqueda histórica únicamente
P0-02 / D-02 / H-02	HUMAN-P0-02	búsqueda histórica únicamente
P0-03 / D-03 / H-03	HUMAN-P0-03	búsqueda histórica únicamente
P0-04 / D-04 / H-04	HUMAN-P0-04	búsqueda histórica únicamente
P0-05 / D-05 / H-05	HUMAN-P0-05	búsqueda histórica únicamente
P0-06 / D-06 / H-06	HUMAN-P0-06	búsqueda histórica únicamente
P0-07 / D-07 / H-07	HUMAN-P0-07	búsqueda histórica únicamente
P0-08 / D-08 / H-08	HUMAN-P0-08	búsqueda histórica únicamente
	5. Reflection

Reflection es un objeto separado de Evidence. Su owner de configuración es Product/Evidence configuration. Cada fixture identifica versión y OPTIONAL o REQUIRED:

OPTIONAL: se ofrece CTA-016; omitirla no bloquea submit ni continuidad.
REQUIRED: sólo el submit explícitamente dependiente exige una Reflection válida.
ausente/inválida: no se crea ni se transforma Evidence; se permite corregir o volver.

La privacidad/retención de Reflection se rige separadamente por C01-017; la configuración/obligatoriedad, por C01-051. Ambos continúan OPEN. Fixtures: FX-REFL-OPT, FX-REFL-REQ, FX-REFL-BAD. Escenarios: SC-REF-01…03.

6. Revisión humana y assignment

método humano configurado + sin revisión real creada: Evidence permanece SUBMITTED;
revisión real creada: una review_instance_ref sintética consistente demuestra el hecho para QA y permite UNDER_REVIEW; no se inventa entidad productiva Review;
referencia inconsistente: error/reconciliación y Evidence SUBMITTED;
human_assignment pertenece a CRM/Operations, declara vigencia, finalidad y visibilidad, y es distinto de Intervention y de R1;
assignment ausente, vencido o no autorizado: omisión segura; no se promete atención.

C01-016 y C01-039 permanecen OPEN.

7. Copy seguro

Permitido en QA interna:

Configuración provisional pendiente de confirmación humana.
Evidencia recibida.
Evidencia validada · cambio de progreso todavía no confirmado.
Todavía no hay una siguiente acción disponible.
Resultado de re-evaluación todavía no disponible.

No permitido:

afirmar que una psicopedagoga validó el default;
prometer revisión, reviewer o SLA sin instancia real;
afirmar aprendizaje/readiness por lectura, tiempo, confianza, Evidence o completion;
mostrar porcentaje universal;
presentar assignment como Intervention o review.

8. Separación de gates

Sólo QA interna con fixtures sintéticos entra en el alcance inmediato. Comprensión futura usa contenido sintético mientras datos/privacidad sigan abiertos; no valida psicopedagogía. UX/research futuro no responde HUMAN-P0. Validación psicopedagógica exige profesional real. Implementación y piloto institucional requieren autorizaciones separadas. No se autorizan estudiantes y QA completa no implica high-fidelity.

9. Estado C01

La matriz normativa está en ACHIEVE_CONTRATOS_MINIMOS_PROTOTIPO_v1.0_APPROVED.md §7: 51/51 OPEN, incluyendo C01-031…038 y C01-051. C01-047…049 no se implementan. P01 no inicia workstreams ni WS7.


***