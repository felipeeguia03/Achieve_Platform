# Validación psicopedagógica de las reglas de acompañamiento — FUENTE

**Documento:** `docs/validacion-psicopedagogica-source.md`
**Rol:** transcripción de la respuesta profesional. **Manda sobre cualquier paráfrasis, incluidos los ADR.**
**Origen:** `ACHIEVE_VALIDACION_PSICOPEDAGOGICA_MVP_v1_RESPONDIDA.pdf`
**Fecha de respuesta:** 2 de septiembre de 2026
**Responde a:** §9 de [`agenda-cierre-psicopedagoga.md`](agenda-cierre-psicopedagoga.md), es decir los seis
valores provisionales que había cargado el Product Owner ([ADR-036](decisions.md#adr-036)).

> **Carácter, según el propio documento:** *"validación psicopedagógica orientativa de producto; no
> constituye evaluación clínica ni diagnóstico individual"*.

---

## Dictamen ejecutivo

> **VALIDACIÓN CON MODIFICACIONES PARA MVP CON DATOS SINTÉTICOS.** Las reglas pueden implementarse
> como defaults configurables, pero **no deberían trasladarse sin piloto a estudiantes reales**. El
> sistema debe **reconocer patrones, no etiquetar personas**; toda escalada humana debe presentarse
> como **apoyo y nunca como sanción**.

## Alcance y límites

> Esta revisión analiza decisiones de producto desde una perspectiva psicopedagógica integral. No
> evalúa a una persona concreta, no formula diagnósticos y no reemplaza una validación con población
> real, diferenciada por edad, nivel educativo, accesibilidad y contexto institucional.

## Tabla de decisiones

| Punto | Decisión | Síntesis |
|---|---|---|
| 9.1 Reiteración | **CAMBIAR** | Desde la 2ª aparición **comparable**; registrar como **señal, no como conclusión** |
| 9.2 Persona | **CAMBIAR** | 3ª aparición comparable como default, con **ingreso anticipado por criterios cualitativos** |
| 9.3 Tras corrección | **CAMBIAR** | Acelerar **sólo si la ayuda fue válida** y hubo un **nuevo intento independiente** |
| 9.4 Reinicio | **CAMBIAR** | Pedir **2 aciertos limpios**; cerrar alerta **sin borrar historial** |
| 9.5 Tipos | **CAMBIAR** | Reformular categorías y contar por **tipo + objetivo de aprendizaje/contexto** |
| 9.6 Evidencia | **APROBAR** | Una entrega insuficiente cuenta **si el error es identificable con confianza suficiente** |
| 9.7 Roadmap | **CAMBIAR** | **Versionar sin borrar**; reentrada 9–18 **mínima, justificada y con control humano** |

---

## Lo que observo

> - El documento **separa adecuadamente la suficiencia de una entrega de la posibilidad de
>   identificar un error**. Esa distinción protege a estudiantes que producen evidencia incompleta,
>   pero informativa.
> - Los umbrales numéricos son útiles para configurar un MVP, aunque **por sí solos no distinguen**
>   entre una dificultad persistente, una consigna ambigua, una ayuda inadecuada, fatiga, ansiedad,
>   barreras de accesibilidad o falta de enseñanza previa.
> - La propuesta **mezcla categorías de error cognitivo o académico con una condición de desempeño**
>   ('dependencia de ayuda externa'). Esto puede inducir interpretaciones deficitarias si no se
>   reformula.
> - **Contar el mismo tipo de error a través de temas diferentes** puede detectar patrones generales,
>   pero también **producir falsos positivos**: dos errores procedimentales en contenidos no
>   comparables no necesariamente expresan la misma dificultad.
> - El diseño **conserva evidencias anteriores y versiona el Roadmap**. Esa trazabilidad es una
>   fortaleza relevante para evitar que una recaída borre avances o que una replanificación
>   distorsione la historia de aprendizaje.

## Posibles explicaciones que el sistema debe diferenciar

| Dimensión | Ejemplos | Implicancia |
|---|---|---|
| Aprendizaje | Concepto no consolidado; estrategia inestable; automatización insuficiente | Puede requerir enseñanza, práctica guiada y recuperación espaciada |
| Pedagógica | Consigna ambigua; feedback genérico; actividad no alineada con lo enseñado | **No atribuir el patrón solamente al estudiante** |
| Emocional / autorregulación | Ansiedad, bloqueo, evitación, sobrecarga, baja percepción de eficacia | Registrar como **hipótesis contextual, nunca como diagnóstico automático** |
| Ambiental | Falta de tiempo, conectividad, espacio, materiales o acompañamiento | Ofrecer ajustes y alternativas de acceso |
| Desarrollo / accesibilidad | Lectura, lenguaje, atención, funciones ejecutivas, visión o audición | Derivar a evaluación profesional **sólo si hay señales persistentes y convergentes** |

> **Hipótesis orientativa de producto.** La repetición de un error es **una señal para explorar, no
> una prueba** de una dificultad específica. La interpretación gana validez cuando el patrón aparece
> en **tareas comparables**, con **evidencia legible**, después de **oportunidades de enseñanza
> adecuadas** y bajo **condiciones conocidas**.

---

## 9.1 · ¿Desde qué aparición un error se considera reiterativo? — **CAMBIAR**

**Respuesta recomendada.** Reconocer una **señal de repetición desde la segunda aparición
comparable**. No contar automáticamente dos errores sólo porque comparten una etiqueta amplia. **Deben
coincidir el tipo de error y el objetivo de aprendizaje o demanda cognitiva principal.**

**Fundamento.** La segunda aparición justifica observar un patrón, pero todavía puede explicarse por
variabilidad normal, una consigna confusa o una clasificación incorrecta. Por eso conviene separar
**'repetición detectada' de 'dificultad confirmada'**.

**Regla configurable sugerida.** `repeat_signal_at = 2`; unidad de conteo = **estudiante + preparación
+ tipo de error + objetivo/demanda**. Registrar además **tema, ayuda, formato de tarea y confianza de
clasificación**.

## 9.2 · ¿En qué aparición debe entrar una persona? — **CAMBIAR**

**Respuesta recomendada.** Usar la **tercera aparición comparable** como default para revisión
humana. Permitir **ingreso anticipado** si hay bloqueo manifiesto, malestar, pedido explícito de
ayuda, alto impacto académico, barrera de accesibilidad o **baja confianza del sistema**.

**Fundamento.** Un umbral híbrido equilibra oportunidad y carga operativa. La cantidad de errores no
capta por sí sola severidad, contexto ni costo emocional. **La persona debe recibir el caso con la
evidencia y el historial de apoyos, no sólo con un contador.**

**Regla configurable sugerida.** `human_review_at = 3`; `early_review_triggers` configurables;
revisión humana **presentada como apoyo**. **Nunca bloquear el avance** mientras espera respuesta,
salvo riesgo o requisito institucional explícito.

## 9.3 · ¿Fallar después de una corrección debe acelerar la intervención? — **CAMBIAR**

**Respuesta recomendada.** Sí, pero **sólo cuando la corrección fue explícita, pertinente, accesible y
suficientemente comprendida**, y luego existió una **nueva oportunidad de respuesta independiente en
una tarea comparable**. Si falta alguna condición, el nuevo error **cuenta, pero no activa escalada
acelerada**.

**Fundamento.** Persistir después de una ayuda válida es información más fuerte que repetir sin ayuda.
Sin embargo, **un feedback genérico, demasiado complejo o no leído no demuestra falta de aprendizaje;
puede demostrar un problema de intervención**.

**Regla configurable sugerida.** `accelerate_after_valid_correction = true`. Exigir:
`correction_delivered`, `correction_accessible`, `learner_engaged`, `new_independent_attempt` y
`same_error_confidence` por encima del umbral.

## 9.4 · ¿Un acierto limpio reinicia el contador? — **CAMBIAR**

**Respuesta recomendada.** Pedir **dos aciertos limpios** antes de cerrar la alerta. Idealmente deben
darse en **tareas equivalentes pero no idénticas**; al menos uno debería ocurrir **después de un
intervalo** o sin repetición inmediata del modelo. **El historial no se borra.**

**Fundamento.** Un único acierto puede reflejar azar, memoria inmediata o una tarea más fácil. Dos
desempeños independientes aportan una señal más estable de recuperación. **'Reiniciar' debe significar
cerrar el estado activo, no eliminar datos previos.**

**Regla configurable sugerida.** `clean_successes_to_resolve = 2`; conservar **contador histórico y
fecha de recuperación**. Si hay recaída, **abrir un nuevo episodio vinculado al anterior**, sin
tratarlo como si nunca hubiera ocurrido.

## 9.5 · ¿Estos seis tipos permiten reconocer la repetición? — **CAMBIAR**

**Respuesta recomendada.** Conservar **cinco familias académicas**: conceptual,
**procedimiento/estrategia**, interpretación de consigna, **cálculo/ejecución** y
**omisión/monitoreo**. **Reemplazar 'dependencia de ayuda externa' por «necesidad de apoyo para
avanzar», registrada como condición de desempeño y no como error.** Permitir **categoría principal +
secundaria**.

**Fundamento.** La necesidad de ayuda **puede ser esperable y productiva**; denominarla 'dependencia'
corre el riesgo de **estigmatizar**. Además, las categorías pueden solaparse: una omisión puede
derivar de interpretación, atención, método o demanda excesiva.

**Regla configurable sugerida.** Contador principal por **tipo + objetivo de aprendizaje/demanda**.
Mantener un indicador transversal por tipo para análisis, **pero sin usarlo solo para escalar**.
Incluir **'clasificación incierta'** y **opción de corrección humana**.

## 9.6 · ¿Un error encontrado en una entrega insuficiente debe contar? — **APROBAR CON CONDICIONES**

**Respuesta recomendada.** **Aprobar la propuesta**: una entrega insuficiente cuenta **cuando fue
evaluada y permite identificar el error con claridad**. Separar **tres estados**: *evidencia suficiente
de logro*, *evidencia suficiente para identificar un error* y *evidencia no interpretable*.

**Fundamento.** **Excluir entregas insuficientes sesgaría la detección contra quienes más necesitan
acompañamiento.** A la vez, contar evidencia ilegible o demasiado breve generaría inferencias
injustificadas.

**Regla configurable sugerida.** Guardar `evidence_quality`, `error_identifiable` y
`classification_confidence`. **No contar** fotos ilegibles, respuestas vacías, abandono sin producción
o materiales donde no pueda distinguirse qué ocurrió.

## 9.7 A · ¿Hasta cuándo continúa vigente una preparación de examen? — **CAMBIAR**

**Respuesta recomendada.** Aprobar cierre por examen rendido, examen cancelado o abandono explícito.
**Si cambia la fecha del mismo examen, no cerrar necesariamente la preparación: crear una nueva
versión del plan dentro del mismo historial.** Cerrar y abrir otra preparación **sólo si cambia el
evento objetivo o el estudiante lo decide**.

**Fundamento.** Cambiar una fecha suele ser una replanificación, **no el inicio de un proceso
psicológico y pedagógico completamente nuevo**. Mantener continuidad evita perder información útil y
**reduce la sensación de 'volver a cero'**.

**Regla configurable sugerida.** Estados sugeridos: `active`, `replanned`, `completed`, `cancelled`,
`explicitly_abandoned`. Toda versión conserva evidencias, apoyos, alertas y decisiones anteriores.
**No usar inactividad sola como abandono.**

## 9.7 B · ¿A qué tramo puede volver el estudiante? — **CAMBIAR**

**Respuesta recomendada.** Permitir reentrada en **todo el tramo 9–18**, pero **volver al primer paso
estrictamente necesario** según el motivo. **Evitar repetir pasos ya dominados** que no estén
relacionados con la dificultad. Ofrecer **decisión compartida** cuando existan varias rutas válidas.

**Fundamento.** La reentrada amplia permite corregir causas tempranas; **una vuelta indiscriminada
puede aumentar carga, frustración y abandono**. La adaptación debe ser proporcional y comprensible
para el estudiante.

**Regla configurable sugerida.** Registrar **motivo, paso de origen, paso de destino y
justificación**. Mantener los cuatro motivos y **agregar: pedido fundamentado del estudiante o
indicación humana**. Permitir **override humano** y **mostrar qué se conserva**.

> **Regla transversal para toda reentrada.** Antes de volver atrás, Achieve debe **explicar en
> lenguaje simple** por qué lo propone, **qué actividad se repetirá**, **qué evidencia anterior
> seguirá vigente** y **cómo pedir otra opción**. La reentrada **no reduce silenciosamente el progreso
> ni se presenta como castigo**.

---

## Qué sería importante evaluar antes de un piloto real

> - Edad, nivel educativo, tipo de institución, modalidades de evaluación y materias incluidas.
> - **Cómo se define una 'tarea comparable' y quién puede corregir una clasificación de error.**
> - Calidad, accesibilidad y comprensión de las acciones correctivas ofrecidas.
> - **Diferencias en tasas de alerta** por género, contexto socioeconómico, discapacidad,
>   neurodivergencia, idioma y modalidad de cursado, cuidando privacidad y evitando inferencias
>   sensibles.
> - **Falsos positivos**: estudiantes escalados sin necesidad; **falsos negativos**: estudiantes
>   trabados que no llegan al umbral.
> - Tiempo hasta recibir ayuda, experiencia subjetiva del estudiante y **percepción de apoyo versus
>   vigilancia o sanción**.
> - **Capacidad real del equipo humano** para responder y cerrar el circuito con una intervención
>   documentada.

## Estrategias recomendadas

> - Usar **feedback específico**: qué estuvo bien, cuál fue el punto de quiebre y cuál es el próximo
>   paso posible.
> - Aplicar **ayudas graduadas**: pregunta orientadora, ejemplo parcial, organizador o recordatorio, y
>   sólo después resolución más directa.
> - Ofrecer un **nuevo intento independiente** después de la ayuda, con una consigna **equivalente y
>   no idéntica**.
> - **Registrar fortalezas junto con errores**: estrategias que sí funcionaron, pasos dominados,
>   autonomía y mejora entre intentos.
> - **Separar desempeño de identidad**: decir *'este procedimiento volvió a aparecer'* y no *'sos
>   dependiente'* o *'tenés una dificultad'*.
> - **Permitir que el estudiante solicite ayuda o cuestione la clasificación** antes de alcanzar el
>   umbral.

## Cómo acompañar desde la institución, docentes y familia

| Actor | Acompañamiento recomendado |
|---|---|
| Docentes / tutores | Revisar evidencia concreta, **descartar problemas de consigna o enseñanza**, acordar una intervención breve y verificar transferencia en un nuevo intento |
| Familia | Acompañar la organización y el clima emocional **sin resolver la tarea**. Preguntar qué ayuda necesita y reconocer el progreso, no sólo el resultado |
| Estudiante | **Acceder a la explicación de la alerta**, aportar contexto, pedir apoyo, **elegir entre rutas razonables** y **conocer qué datos se registran** |
| Equipo de producto | **Auditar clasificaciones**, monitorear equidad, revisar umbrales y **documentar cada cambio de configuración con su versión y fundamento** |

## Próximos pasos

> 1. **Traducir estas decisiones a configuración versionada** y mantener separadas las métricas de
>    señal, alerta y revisión humana.
> 2. **Crear fixtures** que cubran: error repetido comparable; errores del mismo tipo en temas no
>    comparables; corrección válida e inválida; evidencia insuficiente interpretable y no
>    interpretable; recuperación y recaída; reentrada mínima.
> 3. Realizar una **revisión experta de lenguaje, accesibilidad, privacidad y no estigmatización**
>    antes de probar con personas.
> 4. Ejecutar un **piloto acotado, con consentimiento y canal de feedback, sin consecuencias
>    académicas automáticas**.
> 5. **Recalibrar umbrales** a partir de resultados y registrar la versión aprobada antes de cualquier
>    despliegue real.

> **Señales para evaluación de otros profesionales.** El MVP **no debe sugerir derivaciones por un
> contador aislado**. Sólo corresponde recomendar consulta con psicopedagogía, psicología,
> fonoaudiología, neurología u otro profesional **cuando una persona competente observa señales
> persistentes, en más de un contexto, con impacto funcional y luego de descartar barreras pedagógicas
> o ambientales**. La comunicación debe ser clara, no alarmista y acordada con el estudiante y/o
> responsables según la edad.

## Cierre

> La propuesta tiene una base valiosa: intervenir gradualmente, conservar trazabilidad y separar
> suficiencia de logro de identificabilidad del error. Con las modificaciones indicadas, Achieve puede
> usar estas reglas como **defaults reversibles para datos sintéticos**. La autorización para
> estudiantes reales debería quedar **condicionada a piloto, revisión humana, explicabilidad,
> accesibilidad y monitoreo de equidad**.
