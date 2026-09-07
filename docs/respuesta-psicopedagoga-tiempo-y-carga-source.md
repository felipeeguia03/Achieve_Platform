# Fuente — respuesta psicopedagógica: tiempo, carga y devoluciones al estudiante

**Documento:** `docs/respuesta-psicopedagoga-tiempo-y-carga-source.md`
**Rol:** transcripción **literal** de la respuesta profesional. **No se edita ni se interpreta acá.**
Su lectura para el producto vive en [ADR-075](decisions.md#adr-075).
**Responde a:** [`agenda-psicopedagoga-tiempo-y-carga.md`](agenda-psicopedagoga-tiempo-y-carga.md)
**Recibido:** 7 de septiembre de 2026.

> ⚠️ **Lo único que se tocó de este texto es la codificación.** El archivo llegó con los acentos
> rotos por transporte (`informaciÃ³n` en vez de `información`). Restaurar los caracteres **no es
> corregir a la profesional**: es leer lo que escribió. Ninguna palabra, número ni cita cambió.

---

## Criterio general

La información puede mostrarse, pero debe cumplir cuatro condiciones: ser **comparable**, estar
**contextualizada**, permitir una **acción concreta** y referirse al **proceso o a la tarea**, no a una
característica de la persona.

Una cifra verdadera también puede resultar engañosa si enfrenta períodos distintos, si parece una
predicción o si presenta un problema sin salida. La investigación sobre feedback muestra, además, que su
efecto puede ser positivo o negativo según el tipo de devolución y que resulta más útil cuando orienta
sobre la tarea, el proceso y el paso siguiente que cuando formula juicios sobre la persona
([Hattie y Timperley, 2007](https://journals.sagepub.com/doi/abs/10.3102/003465430298487)). Los estudios
sobre tableros para estudiantes también encuentran respuestas mixtas —motivación en algunos casos y
ansiedad en otros—, por lo que la redacción y las pruebas con usuarios no son un detalle cosmético
([Duan et al., 2022](https://academicweb.nd.edu/~cwang11/papers/csedu22-lad.pdf)).

Las reglas numéricas que propongo a continuación son **umbrales operativos provisionales para el MVP**,
no puntos de corte clínicos ni constantes respaldadas universalmente por la psicopedagogía. Deben quedar
versionadas y revisarse después de pruebas de comprensión y de un piloto controlado.

---

## Bloque A — El déficit

### Observación previa indispensable

La pantalla, tal como está escrita, **no debería aprobarse todavía**. Compara «5 horas por semana» con
«52,5 horas que piden tus materias», pero no explicita que ambas cifras correspondan al mismo período. Si
las 52,5 horas son el trabajo pendiente hasta un parcial en ocho días, se está comparando una tasa semanal
con un total acumulado. Las dos cifras pueden ser individualmente correctas y, aun así, la comparación ser
confusa.

Antes de evaluar el efecto emocional del mensaje, el sistema debe expresar ambas cifras sobre el mismo
horizonte. Por ejemplo:

> **Tu plan no entra completo en el tiempo disponible**
> Hasta el parcial del 15 de septiembre declaraste **5 h disponibles**.
> El trabajo pendiente se estima en **52 h 30 min**.
> Es una estimación para organizarte; no predice tu resultado.
> **Elegir qué priorizar** · **Revisar mis horas** · **Pedir ayuda**

Si el cálculo se refiere a una semana, ambas cifras deben decir «esta semana». Si se refiere al tiempo
restante hasta una evaluación, ambas deben decir «hasta la evaluación».

### A1 — ¿El número ayuda o aplasta?

| Campo | Respuesta |
|---|---|
| **Decisión** | Mostrar la brecha, pero nunca como un dato suelto y sólo después de igualar el período de ambas cifras. |
| **Fundamento** | La brecha es necesaria para planificar. Sin contexto ni salida puede sentirse como un veredicto y favorecer evitación, especialmente cuando es extrema. El problema no es la sinceridad del dato sino presentarlo sin un próximo paso posible. La experiencia de «fallar» frente a metas altas puede afectar la autoevaluación, por lo que conviene separar estado del plan de valor personal ([Höpfner y Keith, 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8490751/)). |
| **Regla operativa** | Mostrar siempre: período, disponibilidad declarada, trabajo estimado pendiente, carácter estimativo y al menos una acción bajo control del estudiante. No usar «no vas a llegar», «deberías poder» ni «estás atrasado». |
| **Excepciones** | Si falta fecha de evaluación, disponibilidad o alcance evaluado, no mostrar una comparación cerrada. Mostrar «faltan datos para estimar» y pedir el dato ausente. |
| **Señal observable** | `required_hours > available_hours` dentro del mismo intervalo. |
| **Momento de intervención humana** | No por cualquier déficit. Ofrecer ayuda humana desde la pantalla; convertirla en revisión activa según A3. |
| **Responsable** | El estudiante decide prioridades; una persona acompaña la reorganización cuando se activa la ayuda. El sistema no decide qué materia abandonar. |
| **Condición para revisar** | En pruebas de comprensión, si más del 10% interpreta la cifra como probabilidad de aprobar, nota o sentencia personal, hay que revisar copy y jerarquía visual antes del piloto. |

### A2 — Palabras recomendadas

**Título:** `Tu plan no entra completo en el tiempo disponible`
**Detalle:** `Hasta [fecha], declaraste [X h] disponibles. El trabajo pendiente se estima en [Y h].`
**Aclaración:** `Es una estimación para organizarte; no predice tu resultado.`
**Acciones:** `Elegir qué priorizar` · `Revisar mis horas` · `Pedir ayuda`

Evitaría «52,5 h es lo que piden tus materias»: las materias no «piden» y esa personificación puede sonar
a exigencia. «Trabajo pendiente estimado» describe mejor qué representa el cálculo.

### A3 — ¿Cuándo deja de ser accionable?

No existe un punto de corte psicopedagógico universal. Para el MVP propongo esta regla provisional:

- Si `required / available ≤ 1`, mostrar que el plan entra, sin prometer resultados.
- Si `1 < required / available ≤ 2`, mostrar ambas cifras en primer plano y ofrecer reorganización.
- Si `required / available > 2`, o si `available = 0` con trabajo pendiente, priorizar el mensaje cualitativo
  `Tu plan no entra completo` y dejar el número exacto como detalle secundario. Ofrecer ayuda humana de
  manera destacada.
- Si además faltan **7 días o menos** para una evaluación de alta importancia, generar una señal de
  revisión humana. La señal significa «el plan requiere conversación», no «el estudiante está en riesgo
  clínico» ni «va a desaprobar».

| Campo | Respuesta |
|---|---|
| **Decisión** | Usar `2×` como umbral operativo provisional de brecha crítica. |
| **Fundamento** | Más allá de ese punto, el dato bruto pierde capacidad de orientar por sí solo. `2×` no es un corte clínico ni una constante científica; es una decisión prudencial de producto que deberá validarse. |
| **Excepciones** | No aplicar si las estimaciones usan períodos distintos, faltan datos, la fecha es incierta o el estudiante indicó que no pretende cubrir todo el alcance. |
| **Señal observable** | Relación entre horas pendientes y disponibles, calculada para el mismo período; proximidad de evaluación. |
| **Momento de intervención humana** | Brecha `>2×` y evaluación en `≤7 días`, o solicitud expresa del estudiante. |
| **Responsable** | Referente académico/operador entrenado. Derivación psicopedagógica sólo si aparecen dificultades persistentes que exceden la planificación. |
| **Condición para revisar** | Luego de pruebas con estudiantes y del piloto: comprensión del mensaje, ansiedad/autoevaluación reportada, pedidos de ayuda, cambios de plan y cumplimiento posterior. |

### A4 — Qué debe ir al lado

Sí debe haber acciones. Ofrecerlas no implica decidir sobre la vida del estudiante si conservan su agencia:

1. **Revisar mis horas**, por si la disponibilidad fue cargada incorrectamente.
2. **Elegir qué priorizar**, mostrando consecuencias sin seleccionar por la persona.
3. **Pedir ayuda para reorganizar**, con contexto mínimo ya adjunto para no obligarlo a explicar todo de
   nuevo.

No ofrecería como respuesta automática «sumá X horas», «dejá esta materia» ni una agenda intensiva que
ignore sueño, trabajo, traslados, cuidados u otras obligaciones.

---

## Bloque B — El multiplicador personal

### B1 — Piso en 1,0

| Campo | Respuesta |
|---|---|
| **Decisión** | Mantener el piso `1,0` durante el MVP. Reconocer el buen desempeño mediante feedback descriptivo, no prometiendo menos tiempo futuro. |
| **Fundamento** | Completar antes una actividad no demuestra por sí solo que todas las actividades futuras requerirán menos tiempo. Puede haber diferencias de dificultad, conocimientos previos o calidad de la producción. El costo principal de mantener el piso no es «quitar reconocimiento», sino perder precisión; eso puede compensarse con una devolución positiva basada en hechos. |
| **Regla operativa** | El ajuste no baja de `1,0`. Si existe evidencia suficiente/validada y el tiempo quedó dentro o por debajo de lo estimado, se puede decir: `Completaste esta actividad dentro del tiempo estimado`. |
| **Excepciones** | No dar reconocimiento de velocidad si la actividad quedó incompleta, fue marcada insuficiente o el tiempo no es confiable. |
| **Señal observable** | Tiempo informado dentro/debajo del rango y resultado suficiente o validado. |
| **Momento de intervención humana** | No requiere. |
| **Responsable** | Sistema. |
| **Condición para revisar** | Si, con al menos 10 actividades comparables y válidas, el sistema sobreestima de manera sostenida y esa sobreestimación afecta la planificación. En ese caso podrá evaluarse un ajuste descendente conservador, sin rotular a la persona. |

### B2 — Techo en 2,0 e intervención

El techo `2,0` es razonable como protección contra estimaciones desmesuradas, pero **superarlo una vez no
es una señal psicopedagógica por sí misma**. Primero puede señalar un error de estimación, una tarea mal
definida, interrupciones, registro inexacto, material insuficiente o ayuda no contabilizada.

| Campo | Respuesta |
|---|---|
| **Decisión** | Mantener el techo `2,0`. Crear una señal de **revisión de calibración**, no una etiqueta de riesgo personal. |
| **Fundamento** | Un patrón sostenido merece ser comprendido, pero el dato aislado no permite atribuir la causa al estudiante. Los métodos de estimación del tiempo pueden cambiar significativamente las conclusiones de analítica de aprendizaje ([Kovanović et al., 2015](https://research.monash.edu/en/publications/does-time-on-task-estimation-matter-implications-on-validity-of-l/)). |
| **Regla operativa** | Activar revisión cuando el cociente real/estimado sea `≥2` en **3 de las últimas 5 actividades comparables y válidas**, realizadas en al menos dos días. Antes de alertar: verificar rango estimado, pausas/interrupciones y estado de finalización. |
| **Excepciones** | No computar registros corregidos, actividades incompletas, sesiones con interrupción declarada, tareas nuevas sin estimación confiable ni actividades no comparables. |
| **Señal observable** | Tres cocientes `≥2` entre las últimas cinco observaciones comparables. |
| **Momento de intervención humana** | Primero revisión académica del contenido y de la estimación. Conversación con el estudiante si el patrón persiste tras esa revisión o si él pide ayuda. Evaluación psicopedagógica sólo si convergen otras señales. |
| **Responsable** | Primero owner académico de la estimación; luego referente humano. Psicopedagogía no debe ser el primer destino automático de un error de tiempo. |
| **Condición para revisar** | Tasa de falsos positivos, causas encontradas y proporción de alertas debidas a errores del contenido o del registro. |

### B3 — Cinco observaciones

Cinco observaciones son razonables para **iniciar un ajuste provisional**, pero no para afirmar una
característica estable de la persona. Importa tanto la calidad y comparabilidad de las observaciones como
la cantidad.

| Campo | Respuesta |
|---|---|
| **Decisión** | Con 5 observaciones válidas, permitir calibración provisional; con menos de 10, no describirla como patrón estable. |
| **Regla operativa** | Exigir que provengan de al menos 3 días y del mismo tipo general de actividad. Rotular internamente la confianza como baja entre 5 y 9; no exponer ese rótulo como evaluación personal. |
| **Excepciones** | Excluir outliers explicados, tiempos corregidos, tareas incompletas y registros no comparables. Reiniciar o separar la serie cuando cambia sustancialmente el tipo de tarea. |
| **Señal observable** | Cantidad, dispersión, días distintos, comparabilidad y validez de los registros. |
| **Momento de intervención humana** | Sólo bajo la regla B2 o a pedido del estudiante. |
| **Responsable** | Sistema para cálculo; owner académico para auditar clases de actividad. |
| **Condición para revisar** | Error entre duración estimada y real en 5–9 observaciones frente a 10 o más, usando datos del piloto. |

El número cinco debe documentarse como una decisión de producto provisional; no corresponde presentarlo
como un estándar psicométrico.

### B4 — Transparencia de la calibración

Sí conviene informarla. Un sistema que cambia la carga sin explicar por qué puede parecer arbitrario. La
devolución debe describir registros y no identidad:

> `Actualizamos la duración estimada porque, en tus últimas actividades similares, el tiempo registrado
> fue mayor que la estimación inicial. Podés revisar los registros o desactivar este ajuste.`

No usar: `sos más lento`, `te cuesta el doble`, `tu ritmo es bajo` ni equivalentes.

Debe permitirse ver qué actividades produjeron el ajuste, corregir un tiempo y recalcular. Esa trazabilidad
es parte de la validez de la devolución, no sólo una función técnica.

---

## Bloque C — La barra de cobertura

### C1 — La aclaración actual no alcanza

Un porcentaje grande junto a una barra suele adquirir significado evaluativo aunque el texto inferior lo
niegue. Además, «1 de 9 temas» y «26% de las horas» usan denominadores diferentes y pueden parecer dos
medidas contradictorias.

**Decisión:** no mostrar una única barra ambigua llamada «progreso». Separar al menos:

- `Temas con alguna actividad registrada: 1 de 9`.
- `Tiempo estimado con evidencia: 26%`.
- `Entregas que requieren revisión: X`, cuando corresponda.

Copy recomendado:

> **Actividad registrada**
> 1 de 9 temas tiene alguna evidencia · 26% del tiempo estimado tiene evidencia asociada.
> Esto muestra trabajo registrado. No mide comprensión, no es una nota y no predice el resultado.

Evitar colores propios de calificación —rojo/verde— para el porcentaje de actividad. Si se conserva una
barra, su rótulo visible debe ser `actividad registrada`, no `dominio`, `nivel`, `rendimiento` ni `avance de
aprendizaje`.

**Condición para revisar:** prueba de comprensión en la que el estudiante explique con sus palabras qué
mide la barra. Si la interpreta como nota, probabilidad de aprobación o porcentaje aprendido, la solución
no es agregar más letra pequeña: hay que cambiar la representación.

### C2 — Entrega insuficiente

Una entrega insuficiente debe contar como **trabajo intentado**, pero no como **contenido cubierto,
consolidado o comprendido**. La pregunta actual fuerza una elección falsa porque mezcla dos constructos:
actividad y calidad del resultado.

| Campo | Respuesta |
|---|---|
| **Decisión** | Reconocer el intento sin mostrarlo como avance equivalente a una entrega suficiente. |
| **Fundamento** | No reconocerlo invisibiliza el esfuerzo y castiga dos veces. Contarlo como cobertura plena puede producir una falsa sensación de preparación. |
| **Regla operativa** | Usar tres estados visuales: `sin evidencia`, `evidencia enviada/requiere revisión` y `criterio alcanzado`. La porción insuficiente puede aparecer como actividad registrada, pero no completar el indicador de criterio alcanzado. |
| **Excepciones** | Una actividad puede no tener evaluación de suficiencia; en ese caso mostrar sólo `evidencia enviada`, sin inferir calidad. |
| **Señal observable** | Estado de la evidencia y criterio de corrección aplicable. |
| **Momento de intervención humana** | Según las reglas ya definidas para insuficiencia reiterada; no por una primera entrega aislada. |
| **Responsable** | Sistema representa el estado; docente/referente define el criterio; estudiante conserva una próxima acción de revisión. |
| **Condición para revisar** | Casos en que estudiantes interpreten `evidencia enviada` como `tema aprendido`, o en que la distinción desincentive nuevos intentos. |

---

## Bloque D — Factor de estudio 1,5

### D1 — Qué es ese valor

No encontré respaldo para afirmar que **1,5 horas de estudio autónomo por cada hora de clase** sea una
constante psicopedagógica universal. Puede utilizarse como heurística inicial, pero debe rotularse como
provisional.

La normativa argentina vigente define el Crédito de Referencia del Estudiante como tiempo total de trabajo
académico —interacción docente más trabajo autónomo— y asigna entre 25 y 30 horas por crédito, pero **no
prescribe una relación fija de 1,5 a 1** entre trabajo autónomo y clase
([Resolución 2598/2023, texto actualizado](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-2598-2023-393382/actualizacion)).

| Campo | Respuesta |
|---|---|
| **Decisión** | Conservar `1,5` sólo como fallback provisional cuando no exista una estimación mejor. |
| **Fundamento** | La demanda cambia según tipo de actividad, complejidad, conocimientos previos, modalidad de evaluación, calidad del material y momento del semestre. Un único multiplicador no representa esa variabilidad. |
| **Regla operativa** | Orden de fuentes: carga/estimación institucional o de cátedra → estimación por actividad concreta → mediana histórica de actividades comparables → fallback `1,5`. Guardar siempre la fuente y versión de la estimación. |
| **Excepciones** | Laboratorios, proyectos, prácticas, lectura, resolución de problemas y preparación de exámenes no deben forzarse al mismo factor si existe una estimación específica. |
| **Señal observable** | Tipo de actividad, horas de clase, entregables, alcance, tiempo real informado y calidad del resultado. |
| **Momento de intervención humana** | Cuando la estimación de una materia se desvía sistemáticamente o genera brechas críticas en varios estudiantes. |
| **Responsable** | Owner académico/cátedra para el valor base; producto para versionado; estudiante sólo informa su experiencia, no corrige la carga institucional. |
| **Condición para revisar** | Cuando la mediana del error absoluto del fallback supere el 25% en un conjunto suficiente de actividades comparables del piloto. El `25%` es también una tolerancia operativa provisional, no un corte científico. |

---

## Bloque E — Qué método «sirve»

### E1 — Qué puede afirmarse con los datos actuales

Con `difficulty`, `result` y `quantity_without_help / quantity_total` pueden hacerse descripciones de una
actividad y detectar repeticiones. No permiten concluir qué método de estudio funciona mejor, porque hoy
no se registra de manera estructurada **qué estrategia se usó**, no hay comparación entre estrategias y el
resultado inmediato no demuestra retención o transferencia.

**Sí puede decirse:**

- `En esta actividad informaste que fue más difícil de lo esperado.`
- `Resolviste 4 de 10 consignas sin ayuda.`
- `En 3 de las últimas 5 actividades comparables necesitaste ayuda en más de la mitad.`

**No puede decirse:**

- `La práctica te funciona y el resumen no.`
- `Tu método de aprendizaje es visual/práctico.`
- `Tenés una dificultad de atención, memoria o comprensión.`
- `Este método causó el resultado.`

Asignar a una persona un «estilo de aprendizaje» y adaptar la enseñanza a esa etiqueta no cuenta con una
base adecuada de evidencia ([Pashler et al., 2008](https://journals.sagepub.com/doi/abs/10.1111/j.1539-6053.2009.01038.x)). Sí existen estrategias con respaldo general —por ejemplo, práctica de
recuperación y práctica distribuida—, aunque su aplicación depende del contenido y del objetivo
([Dunlosky et al., 2013](https://journals.sagepub.com/doi/abs/10.1177/1529100612453266)).

### Datos mínimos adicionales

| Dato | Para qué hace falta |
|---|---|
| Estrategia concreta utilizada | Saber qué se está comparando: resolver sin mirar, explicar con palabras propias, releer, resumir, distribuir sesiones, etc. |
| Tipo y objetivo de la tarea | Comparar actividades realmente comparables: recordar, comprender, resolver, aplicar, exponer. |
| Estado del resultado con criterio explícito | Distinguir esfuerzo de desempeño: enviado, insuficiente, suficiente, validado. |
| Desempeño diferido | Comprobar al menos una vez, 24–72 horas después o en una tarea de transferencia, si el aprendizaje se sostuvo. |
| Tiempo e interrupciones | Evitar atribuir a la estrategia una diferencia producida por pausas o contexto. |
| Tipo y cantidad de ayuda | Diferenciar resolución autónoma, pista, ejemplo completo, persona o material. |
| Confianza antes y después | Explorar calibración metacognitiva sin tratarla como diagnóstico. |
| Comparaciones repetidas | Evitar conclusiones a partir de una sola experiencia o de contenidos de dificultad distinta. |

### Regla recomendada para el Personal Engine

1. Recomendar primero estrategias con respaldo general según el objetivo de la tarea, no según una supuesta
   identidad del estudiante.
2. Presentar cada personalización temprana como un **experimento**: `Probemos resolver tres preguntas sin
   mirar y revisemos mañana cuánto se sostuvo`.
3. Con datos repetidos, comunicar asociaciones observadas: `En 4 de 6 actividades comparables en las que
   usaste práctica de recuperación, alcanzaste el criterio con menos ayuda`.
4. No decir `este es tu método` ni inferir causalidad.
5. Permitir al estudiante corregir el registro y rechazar la sugerencia.

Como umbral operativo provisional, una sugerencia exploratoria puede aparecer luego de **3 experiencias
comparables**; una afirmación visible de patrón no debería aparecer antes de **6 experiencias comparables,
en al menos dos momentos o contenidos**, con un criterio de resultado. Estos números deben pilotearse: no
son baremos psicométricos.

### Intervención humana

La intervención corresponde cuando el patrón persiste a través de tareas y estrategias distintas, hay
insuficiencia reiterada pese a apoyos, la brecha entre esfuerzo y resultado es marcada, o el propio
estudiante expresa preocupación. Una sola estrategia poco eficaz no justifica una derivación ni una
hipótesis diagnóstica.

---

## Decisiones ejecutivas

| Pregunta | Respuesta para avanzar |
|---|---|
| **A1–A2** | Mostrar la brecha sólo con el mismo horizonte temporal, contexto, aclaración no predictiva y acciones. Cambiar el copy. |
| **A3** | Umbral crítico provisional `required / available > 2`; cifra secundaria y ayuda destacada. Revisión humana si además la evaluación está a 7 días o menos. |
| **A4** | Ofrecer revisar horas, elegir prioridad y pedir ayuda. Nunca recortar una materia automáticamente. |
| **B1** | Mantener piso `1,0` en MVP; reconocer cumplimiento dentro del rango sin prometer menos tiempo futuro. |
| **B2** | Mantener techo `2,0`; activar revisión de calibración ante `≥2` en 3 de 5 actividades comparables, no una alerta clínica directa. |
| **B3** | Cinco observaciones habilitan ajuste provisional, no una afirmación estable; exigir comparabilidad y al menos tres días. |
| **B4** | Informar el ajuste con lenguaje sobre registros y permitir inspección/corrección. |
| **C1** | La aclaración sola no alcanza; separar actividad, tiempo con evidencia y calidad. |
| **C2** | Insuficiente cuenta como intento, no como criterio alcanzado. Representar ambos estados. |
| **D1** | `1,5` es un fallback provisional, no una constante basada en evidencia. Priorizar fuentes institucionales y estimaciones por actividad. |
| **E1** | Los datos actuales permiten descripción, no determinar el método eficaz. Registrar estrategia, tarea, resultado y desempeño diferido; personalizar mediante experimentos revisables. |

## Condiciones mínimas antes de probar con estudiantes reales

1. Prueba de comprensión del mensaje de déficit y de la barra: qué creen que significa cada cifra.
2. Prueba emocional breve y no clínica: qué les hace pensar/sentir y qué harían después de verla.
3. Verificación de que todas las comparaciones usan el mismo período.
4. Trazabilidad y corrección de los tiempos que alimentan el multiplicador.
5. Diferenciación visual inequívoca entre actividad realizada y criterio alcanzado.
6. Registro de fuente y versión de toda estimación.
7. Circuito humano definido como apoyo académico, sin convertir automáticamente una anomalía de datos en
   sospecha diagnóstica.

Esta respuesta orienta decisiones de producto. No constituye una evaluación de estudiantes ni habilita
inferencias diagnósticas individuales.
