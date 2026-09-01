# Achieve — Fuente: el Roadmap de Modo Examen de la psicopedagoga

**Documento:** `docs/roadmap-modo-examen-source.md`
**Rol:** transcripción **literal** de los veinte pasos del protocolo de examen. **No se edita ni se
interpreta acá.** Su carga como configuración vive en
`supabase/migrations/20260901080000_protocolo_roadmap.sql` y su decisión en
[ADR-031](decisions.md#adr-031).
**Fuente:** `ROADMAP MODO EXAMEN (MIO) (1).doc` — documento de la psicopedagoga (Emi).
**Recibido:** 1 de septiembre de 2026.

---

## Por qué existe este archivo

[ADR-025](decisions.md#adr-025) cerró las ocho `HUMAN-P0` y dio por desbloqueado *"el contenido de la
Fase B5"*. Al ir a cargarlo, en la Fase B5, apareció que **lo desbloqueado era el criterio y no el
texto**: `HUMAN-P0-01 v1.0` confirma la secuencia `PE-PSY-01…20` **como base** y el texto de esos
veinte pasos no estaba en ningún lado del repositorio. Por eso el protocolo corrió durante unas horas
con `EP-SPEC v0.1`, los doce pasos del spec, rotulados como asunción del equipo
([ADR-030](decisions.md#adr-030)).

**Este archivo es ese texto.** Se versiona la fuente literal, separada de su interpretación, por la
misma razón que [`human-p0-source.md`](human-p0-source.md) y `product-spec-source.md`: cuando alguien
discuta dentro de tres meses si el producto entendió bien un paso, tiene que poder leer **lo que la
profesional escribió**, no el resumen que hizo un agente. Toda paráfrasis en `product.md`, en el
schema o en el código es derivada y **pierde** contra este archivo.

> ⚠️ **Vigencia sin confirmar.** Esta hoja es el documento entregado, y **todavía no hay una
> confirmación escrita de que sea la versión vigente** ni de qué pasos se repiten. La pregunta está
> en [`agenda-cierre-psicopedagoga.md`](agenda-cierre-psicopedagoga.md). Hasta que llegue, el
> protocolo se rotula como **texto profesional con vigencia sin confirmar** — que no es lo mismo que
> una asunción del equipo, ni lo mismo que criterio confirmado.

## Sobre la transcripción

- **Los errores tipográficos se conservan**: *"a desarrollae"*, *"Siemrpe"*, *"esdtudio"*, *"ppales"*,
  *"cometi"*, *"loq ue"*, *"vacios"*, *"icnorporando"*, *"leido"*, *"revision"*, *"practica"*,
  *"explicacion"*, *"mas que nada"*, *"Seria"*, *"esta recordando"*. No se corrigen: corregirlos sería
  editar la fuente, y este archivo existe justamente para que no se edite.
- **Lo que sí se reparó es la codificación.** El archivo llegó con la corrupción típica de un UTF-8
  leído como Latin-1 (`Ã¡`, `Ã³`, `â`). Eso no es un error de la autora: es un artefacto de conversión,
  y restaurar `Ã³` a `ó` es recuperar lo que escribió, no cambiarlo. **Tres signos llegaron truncados**
  —las comillas tipográficas y unos puntos suspensivos— y se restauraron como el carácter más probable;
  están señalados abajo.
- Los paréntesis con comentarios de la autora —*"(la autopercepción sirve como punto de partida…)"*—
  **son parte del paso** y viajan con él.

---

## El ciclo, en sus palabras

> El estudiante debería atravesar un ciclo de diferentes fases: diagnóstico, planificación, estudio
> activo, recuperación, revision y practica (autoevaluación). *(que c/ etapa cuente con acciones
> concretas para poder ser llevadas a cabo)*

Las cinco fases del documento agrupan los veinte pasos así:

| Fase | Pasos |
|---|---|
| `DIAGNOSTICO` | 1 – 6 |
| `PLANIFICACIÓN` | 7 – 8 |
| `ESTUDIO ACTIVO` | 9 – 15 |
| `REVISION` | 16 |
| `PRACTICA` | 17 – 20 |

---

## DIAGNOSTICO

**1.** Relevar las condiciones REALES del examen. Registrar fecha, horario, modalidad (oral, escrito,
práctico, mult choice, a desarrollae, mixto)…, temario, unidades incluidas, bibliografía obligatoria,
modalidad de evaluación. Antes de planificar hay que saber exactamente qué demanda la evaluación.

> Los puntos suspensivos después de `mixto)` llegaron truncados en la conversión. Se restauran como
> `…`, que es el carácter más probable; no cambia el sentido del paso.

**2.** Reunir y ordenar todo el material. Programa (simplificarlo), bibliografía, apuntes clases,
guías, trabajos prácticos, modelos de examen y material proporcionado por la cátedra. Clasificarlo en
3: fuente principal, material complementario y material de consulta.

**3.** Delimitar que entra y que no. Transformar el programa general en un temario concreto y real. Si
existen dudas respecto del alcance del examen identificarlas antes de empezar. El estudiante debería
terminar esta etapa con un mapa claro del contenido mas que nada.

**4.** Realizar un “diagnóstico inicial” de cada tema. Antes de distribuir el tiempo, identificar el
dominio de cada tema: no lo se / tengo alguna idea / lo entiendo bastante / creo que lo sé. (la
autopercepción sirve como punto de partida y calma ansiedades)

**5.** Jerarquizar los contenidos. No todos los temas tienen el mismo peso. Priorizar considerando
importancia para el examen, dificultad personal, nivel de dominio y tiempo necesario para aprenderlo.
(Seria importante que distinga entre contenidos críticos, importantes y secundarios.)

**6.** Calcular el tiempo real disponible. Sin contar clases, trabajo, compromisos personales,
descanso, deporte etc. Siemrpe es preferible un plan no tan ambicioso pero que sea ejecutable,
realista (eso evita frustraciones)

## PLANIFICACIÓN

**7.** Realizar un cronograma. Planificar desde el día del examen hacia atrás. Guardando unos dias
para la práctica o repaso final - luego distribuir los bloques de aprendizaje por dias. El cronograma
no debería contener solo los contenidos por días, sino también las fases de esdtudio (leer, recuperar,
practicar, ver errores)

**8.** Preparar las condiciones/ambiente de estudio. Tener a mano los materiales necesarios, reducir
los distractores previsibles (sobretodo plan de acción para el celular) y definir duración aproximada
del tiempo de estudio. (El ambiente puede facilitar o interferir significativamente en el
aprendizaje!!!)

## ESTUDIO ACTIVO

**9.** Primer abordaje comprensivo del contenido. Leer (a conciencia) buscando entender la estructura
general del texto mientras subrayo o resalto las ideas centrales: que concepto se está explicando,
cuáles son las ideas ppales, cómo se relacionan. No intentar memorizar información , primero entender.

**10.** Procesar activamente la información. Después de la lectura (ir por temas) realizar actividades
que me obliguen a trabajar cognitivamente con el contenido: explicar con palabras propias, comparar
conceptos, relacionar, buscar ejemplos, formular preguntas, resolver casos o construir
representaciones gráficas cuando sean pertinentes. Subrayar o copiar no debería constituir la
actividad principal de estudio.

**11.** Elegir la técnica según lo que estoy aprendiendo. Para contenidos teóricos conceptuales:
explicación, preguntas, relaciones, mapas conceptuales. Para procedimientos y cálculo:
formulas/resolución de ejercicios. Para exámenes orales: producción oral, explicacion en voz alta,
audios. Para memorización de palabras / formulas: desarmar palabra, dibujos, asociación, rimas,
ritmos.

> En el original, las cuatro familias de técnica están en párrafos separados y sin punto final entre
> ellas. Se unieron en un párrafo con el punto que el original omite entre *"audios"* y *"Para
> memorización"*. **Ninguna palabra se agregó ni se sacó.**

**12.** Construir esquemas, cuadros, enumerar conceptos, fichas de estudio con las ideas principales
de cada tema. Practicar recuperación activa, con cuestionarios por ejemplo, o ejercicios. Intentar
recordar antes de volver a leer. Esta instancia es fundamental porque permite diferenciar familiaridad
con el material de conocimiento (recuperación)

**13.** Registrar las brechas de aprendizaje. Lo que no esta recordando o entendiendo. Ver qué
ocurrió: no sabía el contenido, lo comprendía pero no podía recuperarlo, confundí conceptos, olvidé
información relevante, cometi error de procedimiento, interpreté mal la consigna o sabía la respuesta
pero no logré expresarla adecuadamente. (Esta información debe orientar)

**14.** Corregir y volver a demostrar. Volver a trabajar específicamente aquello que falló y después
generar una nueva respuesta sin ayuda. (loq ue no supe responder o respondí mal no es un error, sino
una oportunidad para identificar y reforzar)

**15.** Programar repasos distribuidos. Volver sobre contenidos anteriores evitando que cada tema se
estudie una sola vez. El repaso debe comenzar preferentemente intentando recuperar sin material y
luego revisar. Cuanto más cercano esté el examen, menor será el intervalo posible entre
recuperaciones.

## REVISION

**16.** Monitorear el dominio de los temas/unidades diferenciando estos estados: no visto / leido /
recuperado parcialmente / consolidado

## PRACTICA

**17.** Practicar sobretodo la modalidad. Si es un oral, hablar en voz alta, responder preguntas,
simular dar clase. Si es práctico, resolver problemas nuevos. Si es escrito de desarrollo, organizar
respuestas completas. Si es múltiple choice, practicar discriminación entre alternativas justificando
por qué una opción es correcta y las demás no.

**18.** Realizar un simulacro de examen, cuando todavía exista tiempo para corregir, instancia sin
consultar material. Analizar el simulacro. Identificar qué conocimientos están sólidos, cuáles
presentan vacios, qué errores se repiten, si el tiempo fue suficiente, si existen problemas para
interpretar consignas y qué debería modificarse antes de rendir.

**19.** En las últimas 24 horas consolidar, no seguir icnorporando. Se sugiere solo repaso con
flashcards o fichas. Cuidar el descanso y la alimentación. Especialmente la noche anterior, evitar que
el esfuerzo termine deteriorando la atención, recuperación y desempeño del día siguiente.

**20.** Durante el examen: Leer detenidamente las consignas, identificar que se solicita, administrar
el tiempo, organizar las respuestas y reservar cuando sea posible un momento de revisión. En un oral,
escuchar la pregunta completa, organizar la respuesta y contestar.

---

## Lo que este documento **no** define

Está acá porque es la lista de lo que **no se puede completar leyéndolo**, y por lo tanto no se
completa:

| Campo del protocolo | Por qué queda vacío |
|---|---|
| **Evidencia esperada de cada paso** | El documento describe qué hacer, no qué se entrega ni con qué formato. El [cuadro de problemas y acciones](cuadro-problemas-source.md) propone evidencias, pero **no está mapeado uno a uno** con estos veinte pasos y conserva preguntas sin resolver de la propia autora |
| **Criterio de cierre** | Ninguno de los veinte declara cuándo se da por terminado |
| **Obligatoriedad** | No dice cuáles de los veinte son obligatorios. Es `C01-031`, abierto |
| **Condición de apertura** | No dice qué habilita cada paso |
| **Qué pasos se repiten** | Ver abajo — la respuesta viene de otro documento, y hay una discrepancia que **no se resuelve por inferencia** |

### La reentrancia, y por qué se toma de `HUMAN-P0-01 v1.0`

Los pasos **14** y **15** describen explícitamente volver sobre algo: *"volver a trabajar
específicamente aquello que falló"* y *"volver sobre contenidos anteriores evitando que cada tema se
estudie una sola vez"*.

Pero la respuesta del cuestionario, que es la que la profesional dio **por escrito y sobre esta misma
matriz numerada**, dice más:

> *"entre los puntos 9 al 18 el recorrido no es lineal ni rígido. En la etapa de estudio,
> recuperación, revisión y práctica, el orden puede ser variable, modificable y transversal… El
> estudiante puede avanzar, volver sobre un tema, recuperar, detectar un error, corregir, practicar,
> repasar y de nuevo recuperar. Incluso algunas de estas acciones pueden darse varias veces sobre un
> mismo tema."*
> — [`human-p0-source.md`](human-p0-source.md) §1

**Y los números cierran exactamente.** *"Estudio, recuperación, revisión y práctica"* son, en este
documento, `ESTUDIO ACTIVO` (9–15), `REVISION` (16) y `PRACTICA` hasta el simulacro (17–18). El 19
—últimas 24 horas— y el 20 —durante el examen— no pertenecen a esa etapa, y por eso el tramo termina
en 18 y no en 20. Esa coincidencia es la mejor evidencia de que **la numeración de este documento es
la de `PE-PSY-01…20`** que el cuestionario nombraba.

Así que **9–18 se cargan como reentrantes** y el resto no. La confirmación explícita sigue siendo
necesaria y está pedida.
