# El Gantt de preparación — modelo, derivaciones y decisiones que faltan

**Documento:** `docs/gantt-de-preparacion.md`
**Para:** Product Owner
**De:** equipo Plataforma
**Fecha:** 7 de septiembre de 2026
**Estado:** **propuesta de diseño. Nada de esto está implementado y nada debe implementarse todavía.**
**Decidido desde entonces:** [ADR-066](decisions.md#adr-066) — **el Gantt es `UX02`**, y
[ADR-067](decisions.md#adr-067) — **el estudiante da de alta su evaluación**. Ver §7.
**Corpus medido:** [`inventario-corpus.md`](inventario-corpus.md) — 113 PDF, 36 materias, **13
degradadas**.
**Origen:** conversación de arquitectura del 7 de septiembre sobre el corpus de programas de cátedra
y libros de temas de Ingeniería en Sistemas, Plan 2016 (UCC), más dos pares de mockups del owner.

> ⚠️ **Este documento no cierra decisiones: las propone.** Marca qué parte del modelo ya existe en el
> repositorio y lista los ADR que hay que abrir. Los ADR los cierra el owner, no un agente
> ([`decisions.md`](decisions.md) regla 2) — y de los siete de §11, **uno ya está cerrado**.

---

## 0. El hallazgo que hace corto este documento

Entré a esto asumiendo que había que modelar la capa académica desde cero. **No hay que hacerlo.**

| Lo que hace falta para el Gantt | Estado real en el repo |
|---|---|
| Materia → temas → subtemas | ✅ `topic` con `parent_id`, `code`, `sequence`, y `course_id`/`offering_id` |
| Relación entre temas | ✅ `topic_prerequisite`, **explícita por diseño** |
| Clases, y qué temas dio cada una | ✅ `class_session` + `class_session_topic`, **muchos a muchos**, con `relation` |
| Qué entra en cada evaluación | ✅ `assessment_topic`, declarado |
| Fecha de la evaluación | ✅ `assessment.assessment_date`, **nullable a propósito** |
| Objetivos académicos | ✅ `learning_objective`, con `kind` `objetivo_de_aprendizaje` \| `demanda_cognitiva` |
| Estado del alumno por tema | ✅ `topic_progress`, cinco dimensiones con tri-estado |
| Que el ADE sepa qué entra en el próximo examen | ✅ `contexto_del_ade()` ya lo lee |
| **Cuánto tiempo lleva** | ❌ **no existe en ninguna parte** |

**La única cosa que falta es el tiempo.** `class_session` guarda `session_date` y nada más: no tiene
hora, no tiene duración, no distingue teórico de práctico y no distingue una clase de un parcial.
`topic` no tiene peso ni minutos. `course` no tiene carga horaria.

Todo el Gantt se apoya en eso. Es una columna, más de dónde sacarla.

---

## 1. Qué es el Gantt, y qué no es

**Es:** una línea de tiempo por materia, desde hoy hasta la evaluación, que muestra qué temas entran,
cuáles ya tienen evidencia enviada y cuántos minutos quedan por delante.

**No es** —y estas cuatro cosas son invariantes, no preferencias:

1. **No es una nota.** La barra mide cobertura declarada, no calidad.
2. **No es una predicción de aprobación.** [ADR-058](decisions.md#adr-058) cerró `C01-029` como regla
   determinista **sin porcentaje y sin predicción**. Una barra que insinúe "vas a aprobar" lo viola.
3. **No es dominio.** `topic_progress` tiene `domain_value`, y **el Gantt no lo lee**. El dominio
   requiere evaluación; la cobertura sólo requiere que alguien haya producido algo.
4. **No decide.** La superficie proyecta lo que el dominio ya calculó. Si el dominio no calculó, la
   superficie **omite** — no rellena.

> La nota al pie que el owner escribió en el mockup es la formulación canónica y se adopta textual:
>
> ***"temas marcados por vos sobre el total cargado. No es una nota ni una predicción."***

---

## 2. El corpus: dos documentos distintos que la gente confunde

El material que existe por materia es de dos tipos, y **dicen cosas diferentes**:

| | **Programa de cátedra** | **Libro de temas** |
|---|---|---|
| Qué es | Lo **declarado** al inicio | Lo que **efectivamente pasó** |
| Contiene | `CONTENIDO`, `UNIDAD`, `BIBLIOGRAFÍA`, `TRABAJOS PRÁCTICOS`, `Dictado:`, `Horario:` | fecha, hora, día, `TEÓRICO`/`PRÁCTICO`, tipo, docente, texto del tema |
| Sirve para | Alcance, unidades, carga horaria total | Orden real, ritmo, minutos por tema, fechas de parcial |
| `source_type` | `institution` | `institution` o `instructor` |
| Cobertura del corpus | Alta | **Parcial. Hay materias sin ninguno de los dos.** |

⚠️ **El programa miente sobre el conteo de clases, y hay que decirlo.** El encabezado
`Horario: … (120 MIN.) [ 15 CLASE/S ]` trae dos datos de calidad muy distinta:

- Los **minutos son confiables** y son la fuente primaria de duración.
- El **conteo de clases no lo es**: `LÓGICA Y MATEMÁTICA DISCRETA` declara 30 clases y el libro
  registra 15; `INGENIERÍA DE SOFTWARE I` declara 30 y registra 7.

Y el campo `Horario:` **viene vacío en varias materias**. No es un caso raro: es el caso normal.

---

## 3. Las tres derivaciones que sostienen el Gantt

### 3.1 · `tema → evaluación → fecha límite`

**La derivación más valiosa del corpus — y más frágil de lo que parecía.** El libro de temas registra
el parcial como una fila más, en su fecha. Todo tema dictado antes de esa fila entra en ese parcial:

| Materia | Evidencia |
|---|---|
| `LÓGICA Y MAT. DISCRETA` 2022 C/1 | clases 1–5 → parcial del 18/04 · clases 7–12 → parcial del 06/06 |
| `ARQ. DE COMPUTADORAS II` 2024 B/1 | mismo patrón, misma limpieza |

⚠️ **Pero encontrar la fila del parcial es el problema, no repartir los temas.** La columna de tipo
del libro dice `NORMAL` en **988 de ~1016 filas**: el parcial vive en el texto libre del tema, y ese
texto tiene **25% de falsos positivos medidos** — *"Derivadas parciales"* es un tema de análisis,
*"Repaso para el parcial"* es la clase anterior, *"entrega de parciales"* la posterior. Por eso
[ADR-069](decisions.md#adr-069) decidió que `session_kind` **se propone y una persona lo confirma**.

⚠️ **Y aun con la fila bien identificada sigue siendo una inferencia, y `assessment_topic` guarda
declaraciones.** El comentario de la tabla
es explícito: *"Declarado, nunca inferido de `scope`"*. Entonces la derivación **no escribe
`assessment_topic` sola**: propone, y el alumno o el operador confirma. Entra con
`source_type = 'inference'` y `verification_status = 'unverified'`, que es exactamente lo que
[ADR-029](decisions.md#adr-029) exige.

### 3.2 · `orden dictado → prerequisitos`

El owner propuso *"cada unidad necesita la siguiente"*. **El corpus lo desmiente**, y la corrección
importa porque `topic_prerequisite` es explícita justamente para no cometer este error:

| Materia | Orden real de dictado |
|---|---|
| `SISTEMAS DE INFORMACIÓN` 2024 | U2, U3, U4, U7, U8, U9, U8, U9, U6-U10 … **y U1 al final, clase 13** |
| `ORGANIZACIÓN Y ADM. DE EMPRESAS` 2025 | U1, U2, U4, **PARCIAL (U 1,2,4)**, U3, U5, U6, U7 |

El profesor de Sistemas de Información dio la unidad 1 al final **a propósito**. Un prerequisito
derivado de la numeración del programa habría bloqueado al alumno en un tema que la cátedra decidió
dejar para el cierre.

> **Regla:** los prerequisitos se proponen desde el **orden dictado** (`class_session.session_date`),
> nunca desde `topic.sequence`. El comentario de la tabla ya lo dice: *"Derivarlos de `topic.sequence`
> sería inventar una regla académica."*

Y como el owner pidió, **el motor propone y el administrador aprueba**. La propuesta no es una fila
de `topic_prerequisite`: es una sugerencia que necesita un acto humano para convertirse en una.

### 3.3 · `minutos de clase → minutos de estudio`

La decisión del owner: **1,5 horas de estudio por cada hora de clase, como piso**.

```
minutos_base(tema) = minutos_de_clase(tema) × factor_de_estudio      ← factor por defecto: 1.5
```

⚠️ **El 1,5 no es un número del tema: es configuración versionada.** Tiene que vivir con
`rule_version`, igual que `preparation_readiness.rule_version`, para que cambiar el factor **no
reescriba las estimaciones viejas**. Si mañana los datos dicen 1,8, las estimaciones de septiembre
siguen diciendo lo que dijeron cuando se hicieron.

---

## 4. De dónde salen los minutos: dos fuentes, y cómo se reconcilian

### Fuente A — bottom-up, desde el libro de temas

`duración de la clase × (temas de esa clase)`, repartido. Precisa cuando el libro existe.

### Fuente B — top-down, desde la carga horaria del programa

El programa declara el total de otra forma, y **varía el formato por materia**:

| Materia | Cómo lo dice |
|---|---|
| `FÍSICA I` | *"práctica semanal: 3 horas · teórica: 2 horas"* |
| `ANÁLISIS MATEMÁTICO I` | *"60 horas"* |
| `BASES DE DATOS I` y `II` | *"Instancias Supervisadas: 30 horas"* |
| `ARQ. DE COMPUTADORAS II` | *"26 Hs"* |

### La reconciliación

**B da el total, A da la distribución.** Cuando existen las dos, el total del programa es el
denominador y el libro reparte; cuando falta A, el total se reparte parejo entre las unidades
declaradas y **la estimación se marca como tal**; cuando falta B, se suma A y listo.

⚠️ **Cuando faltan las dos, no hay minutos, y no se inventan.** Esa materia entra al Gantt en estado
degradado (§6). Es el mismo principio que `assessment.assessment_date`: *"una fecha desconocida NO se
estima: la línea desaparece."*

### Lo que hay que agregar al esquema

| Tabla | Columna | Por qué |
|---|---|---|
| `class_session` | `duration_min INTEGER` | No existe. Es el dato que falta. |
| `class_session` | `session_time TIME` | El libro trae la hora; hoy se tira. |
| `class_session` | `stream TEXT CHECK (stream IN ('teorico','practico','teorico_practico'))` | Corridas con asistencia separada; hoy se mezclan. **Tres valores**, no dos: el corpus usa `TEORICO-PRACTICO` ([inventario](inventario-corpus.md) §2). |
| `class_session` | `session_kind` — `clase` \| `parcial` \| `consulta` \| `feriado` \| `suspendida` | Un parcial **no es una clase que dio temas**. Hoy entraría como si lo fuera. |
| `course_offering` | `declared_total_min INTEGER` + `declared_total_source TEXT` | La fuente B, con de dónde salió. |
| `topic` | `weight NUMERIC` | El peso que pidió el owner. **Nullable**: sin peso declarado, todos pesan igual. |

⚠️ **`session_kind` es el más urgente de los cinco.** Sin él, `ORGANIZACIÓN Y ADM. DE EMPRESAS`
importa su parcial como una clase que dictó las unidades 1, 2 y 4 — y el Gantt contaría el examen
como tiempo de cursada.

---

## 5. Academic Engine y Personal Engine: dónde se corta

La fórmula, con cada factor atribuido a su motor:

```
minutos_pendientes(tema) =   minutos_base(tema)             ← Academic Engine
                           × multiplicador(estudiante)      ← Personal Engine
                           − minutos_con_evidencia(tema)    ← hechos
```

| Factor | Motor | De dónde sale | Qué pasa si no hay dato |
|---|---|---|---|
| `minutos_base` | Academic | Libro de temas + programa (§4) | No hay estimación. Se omite. |
| `factor_de_estudio` | Academic | Configuración versionada, hoy `1.5` | — |
| `dificultad relativa` | Academic | Cuánto tiempo le dedicó la cátedra al tema | Todos los temas pesan igual |
| `multiplicador` | Personal | Evidencia previa del alumno | **`1.0`.** Sin historia, no se penaliza ni se premia. |
| `minutos_con_evidencia` | hechos | `evidence` + `commitment` | `0` |

⚠️ **Los factores se guardan por separado, nunca multiplicados.** Si se persiste sólo el producto, la
pantalla no puede explicar por qué dice lo que dice — y la explicabilidad es obligatoria acá
(`risk_signal.reason`, `preparation_readiness.explanation`). Un número sin desglose es exactamente el
*score opaco* que el producto se prohíbe.

⚠️ **El multiplicador personal arranca en `1.0` y no baja del 1,5× académico.** El piso lo puso el
owner: *"que el sistema proponga 1,5 hs por cada hora de clase mínimo"*. El Personal Engine puede
pedir **más** tiempo; no puede prometer que vas a necesitar menos.

### La cobertura, que es otra cosa

```
cobertura(materia) = Σ minutos_base(temas con evidencia enviada) / Σ minutos_base(temas del alcance)
```

Ponderada por horas, no por conteo — un tema de 6 horas no vale lo mismo que uno de 1. Y el conteo
se muestra al lado porque la gente lo entiende mejor:

> **1 de 9 temas · 26% de las horas**

⚠️ **El mockup mostraba `26%` junto a `1/9`, que por conteo es 11%.** No es un error del mockup: es
la diferencia entre las dos métricas, y por eso van juntas. Mostrar sólo el porcentaje sin el conteo
hace que el número parezca arbitrario.

---

## 6. Materias sin datos: entran degradadas y etiquetadas

**Una materia sin temas cargados entra al Gantt igual.** Sacarla la vuelve invisible, y lo que el
alumno necesita saber es justamente que ahí falta algo.

| Falta | Qué muestra | Qué NO muestra | Qué ofrece |
|---|---|---|---|
| Temas | *"sin temas cargados — no puedo estimar"* | barra, minutos, cobertura | Cargar temas · *"10 minutos de carga desbloquean la estimación"* |
| Fecha de evaluación | temas y cobertura | **cuenta regresiva** | Agendar la evaluación |
| Clases / duración | temas, fecha, cobertura **por conteo** | cobertura ponderada, minutos pendientes | Cargar el libro de temas |
| Nada | todo | — | La próxima acción |

**Tres reglas sobre estos estados:**

1. **Primera persona, y admitir el límite.** *"No puedo estimar"* dice quién no puede y por qué. Es
   la formulación del owner y es mejor que cualquier etiqueta de sistema.
2. **Siempre decir el costo del arreglo.** *"10 minutos de carga"* convierte un reproche en una
   oferta.
3. **Ausencia no es cero.** `topic_progress` ya distingue `no_information` de `not_evaluated` de
   `value`, con `CHECK` que impide guardar un `0` donde no hubo dato. El Gantt hereda eso: una barra
   vacía por falta de datos y una barra vacía por falta de trabajo **no se dibujan igual**.

---

## 7. La superficie: el Gantt **es** `UX02`

> **Decidido por el Product Owner, 7 de septiembre de 2026:**
> *"es lo que Materia debería haber sido siempre"*

**No hay superficie nueva. No hay `UX10`. El registro sigue en nueve superficies y 19 CTAs.**

Y no es sólo la opción barata: es la correcta. La pregunta canónica de `UX02` —fijada mucho antes de
esta conversación— es literalmente la del Gantt:

| | |
|---|---|
| `UX02 · Materia / Cursado` | ***"¿Cómo vengo en esta materia y qué hago?"*** |

El Gantt es la respuesta a esa pregunta dibujada en una línea de tiempo. `UX02` venía contestándola
con una lista.

### Los dos mockups mapean a dos superficies que ya existen

| Pantalla del mockup | Superficie | Estado |
|---|---|---|
| *Inicio · Qué necesita atención hoy* — las tarjetas con `15 d` y cobertura | **`UX01` Hoy / Autogestión** | Existe. `estado_del_dia()` ya devuelve `materias[]` |
| *El Gantt de una materia* | **`UX02` Materia / Cursado** | Existe. `estado_de_materia()` ya devuelve unidades y examen |

### Cuánto del Gantt ya está en `estado_de_materia()`

Fui a leer la función esperando tener que escribir una nueva. **No hace falta.** Ya devuelve:

| Campo que devuelve hoy | Qué es en el Gantt |
|---|---|
| `examen: { titulo, fechaEn }` | La fecha límite. **Ordenada `ASC NULLS LAST`** — sin fecha va al final y conserva su `null` |
| `unidades[]` con `codigo`, `nombre`, `ultimoAvanceEn` | Las barras, **ordenadas por `sequence ASC NULLS LAST`** |
| `dominio`, `practica`, `recorrido` por unidad | **El estado de cada dimensión, nunca su valor** |
| `contextoIncompleto` | **El estado degradado, ya calculado**: `NOT EXISTS (topic WHERE offering_id = …)` |
| `ultimoAvanceEn` | *"última actividad hace 7 días"* del mockup |
| El agregado por estado | El *"1 de 9"* |

Tres cosas que yo iba a proponer **ya están implementadas y con el comentario que explica por qué**:
el orden por fecha con las sin fecha al fondo, el estado degradado como hecho de la base *—"acá es un
hecho de la base, no una inferencia"—*, y la regla de no exponer valores sino estados.

**Lo que falta en el payload son tres campos**, y dos salen del mismo dato de §4:

1. `minutosBase` por unidad ← necesita `class_session.duration_min`
2. `cobertura` de la materia, ponderada por horas
3. Los días hasta el examen — **derivables en el cliente** desde `fechaEn` e `instante`, que ya viajan

### Las CTAs: menos nuevas de las que creí

Fui a contar las once del mockup contra el registro. **Las principales ya están:**

| CTA del mockup | Registro |
|---|---|
| Abrir la materia desde Hoy | ✅ `CTA-001` `UX01 → UX02`, y desde [ADR-054](decisions.md#adr-054) **lleva la cursada de la fila que se tocó** |
| *Abrir Modo Examen* | ✅ `CTA-019` `UX02 → UX07` — *"la entrada manual a Modo Examen"*, ADR-016 |
| La próxima acción | ✅ `CTA-002`, con origen en `UX01` **y `UX02`** |
| *Ver seguimiento* / progreso | ✅ `CTA-009`, con origen en `UX01` **y `UX02`** |

⚠️ **Y `CTA-019` trae una restricción que el Gantt tiene que respetar.** Aparece sólo si la materia
**tiene una evaluación elegible**; si no la tiene, no se renderiza, *"porque el estudiante no puede
crear una `Assessment` desde `UX02` —dar de alta una evaluación no registrada **no se implementa**"*.

Eso choca de frente con el estado degradado *"sin fecha de examen"* de §6, cuya CTA propuesta era
**agendar la evaluación**. O esa CTA no existe en el MVP, o hay que reabrir la Etapa 0.4. **Es la
única CTA genuinamente nueva que el Gantt necesita**, junto con *Cargar temas*.

### ⛔ El agujero debajo de todo esto: **nadie escribe `assessment`**

Fui a resolver la colisión de `CTA-019` y encontré la causa, que es peor que el síntoma.

**Ninguna ruta de la aplicación llega a un escritor de `assessment`.** El estudiante no tiene por
dónde declarar que tiene un final.

⚠️ **Corregido el mismo día:** sí existe un escritor —`ingerirMateria()`, con servicio, repositorio y
la RPC `ingerir_materia`, todo con tests—. Pero **ninguna ruta lo alcanza**, y tampoco serviría:
`ingerir_materia` **reemplaza** las unidades y evaluaciones de la cursada entera. Usarla para agregar
un final borraría el temario.

Y `assessment_date` es la columna de la que cuelga todo:

| Depende de `assessment_date` | Qué pasa sin ella |
|---|---|
| La cuenta regresiva del Gantt | No hay *"15 días"* |
| `estado_de_materia().examen` | Viaja `null` |
| `contexto_del_ade().proximaEvaluacion` | El ADE no sabe qué entra en el próximo examen |
| `CTA-019` | **No se renderiza**: no hay evaluación elegible |
| La ventana de 14 días de [ADR-048](decisions.md#adr-048) | Modo Examen no se recomienda |
| El riesgo *"dos finales el mismo día"* (§8.2) | No hay dos fechas que comparar |

El diseño asumía que las evaluaciones llegaban de la institución. **Esa vía está cerrada por
[ADR-006](decisions.md#adr-006)**, y va a seguir cerrada hasta el dictamen legal.

> ⚠️ **Entonces el Gantt no arranca por la duración: arranca por acá.** `class_session.duration_min`
> hace que las barras tengan tamaño; sin `assessment` no hay línea de tiempo sobre la cual dibujarlas.
>
> ✅ **Resuelto por [ADR-067](decisions.md#adr-067)**, 7 de septiembre.

**Y el mockup ya trae la respuesta.** *"+ Nueva evaluación"*, fijada abajo en la barra lateral, es
exactamente el escritor que falta. Es el mismo principio que el owner ya aplicó a las cátedras
—*"en un principio el alumno se autoagenda"*— extendido a las evaluaciones: entra con
`source_type = 'student'` y `verification_status = 'unverified'`, sin auto-elevarse
([ADR-029](decisions.md#adr-029)).

Eso **reabre la Etapa 0.4**, que registró el hueco y decidió no taparlo: *"dar de alta una evaluación
no registrada no se implementa"*. En agosto era una decisión razonable porque nada dependía de ello.
Con el Gantt, sí.

### Lo que esta decisión **no** decide

La navegación del mockup —Inicio · Materias · Calendario · **Formación** · **Mi seguimiento**— sigue
sin decidir, y ahora **queda fuera del alcance de este documento**. `Formación` y `Mi seguimiento` no
son parte del Gantt: son dos productos separados que aparecieron en el mismo mockup.

---

## 8. Cuatro problemas abiertos que no tienen respuesta todavía

### 8.1 · ¿*"Marcar hecha"* mueve la barra?

El owner decidió que **todo es evidencia enviada**. Entonces la respuesta tiene que ser **no**: marcar
hecha cierra la `Action`, pero la cobertura sólo se mueve con `evidence`.

⚠️ **Y eso es un problema de producto, no de implementación.** Si el alumno marca diez cosas hechas y
la barra sigue en 26%, se va a sentir estafado. O la pantalla lo explica, o *"Marcar hecha"* no
debería existir. **Sin resolver.**

### 8.2 · *"Riesgos detectados"* mezcla dos cosas que no son la misma

De los tres ítems del mockup, **sólo uno es riesgo** en el sentido que el sistema le da a esa palabra
—`risk_signal` con lifecycle, umbrales de `HUMAN-P0-06`, y dos de las tres reglas todavía en modo
humano hasta el piloto por [ADR-055](decisions.md#adr-055):

| Ítem del mockup | Qué es realmente |
|---|---|
| *7 días sin avance en Análisis Matemático II* | **Señal de riesgo.** Entra al circuito. |
| *Historia Económica: fecha sin temas ni plan* | Dato faltante. Lo arregla el alumno solo. |
| *Dos finales el mismo día (17 sep)* | Colisión de calendario. Hecho determinista. |

Juntarlos bajo un mismo título o infla el circuito de riesgo con cosas que no lo son, o lo saltea.
**Propuesta: dos bloques** — *"Necesita tu atención"* (determinista, self-service) y *"Riesgo"*
(entra al lifecycle, puede convocar a una persona).

⚠️ Y *"es lo más lejos de estar listo"* hay que reescribirlo: es un ranking de readiness, y ADR-058
prohíbe la predicción. El hecho equivalente: *"la de menor cobertura con el final más cerca"*.

**La colisión de finales sí entra**, y es barata: se deriva de `assessment_date`, no dice nada sobre
la persona, y es la misma familia de regla que [ADR-064](decisions.md#adr-064) —superposición
validada en el `Commitment`— aplicada a otro objeto.

### 8.3 · *"Enviar evidencia · WhatsApp"* es correcto y está bloqueado

Resolvería de una que hoy la `Evidence` **sólo se escribe por API**: no hay formulario. Pero el Flujo
E (`whatsapp-link`) no está construido, `student.whatsapp` no tiene escritor, `whatsapp_consent` no
tiene columna de teléfono, y [ADR-006](decisions.md#adr-006) sigue cerrado para el número de una
persona real.

**Es la dirección correcta y no puede entrar al MVP** sin que se descongele esa cadena. Vale como
norte, no como alcance.

### 8.4 · La Operadora con nombre propio llega antes que dos decisiones

El bloque *"TU OPERADORA · ANALÍA"* es lo mejor escrito de los mockups —*"No hace falta ponerse al día
hoy: hacé las 10 integrales y mandame la foto"* reduce el pedido en vez de exigir recuperar, que es
exactamente el tono que pidió la psicopedagoga—. Pero:

- [ADR-003](decisions.md#adr-003) integra el dominio del Operador con el coach del CRM, **no los
  frontends**. Quién aparece en pantalla no está resuelto.
- [ADR-057](decisions.md#adr-057) difirió **quién valida y corrobora** (`C01-030`) hasta el dictamen
  legal.

El bloque es correcto. **El nombre y la atribución necesitan que esas dos cierren.**

---

## 9. Fuera de alcance del MVP

| Qué | Por qué |
|---|---|
| TP y entregables de cátedra como objeto propio | La evidencia ancla al tema vía `Action`. Un tipo más no agrega nada al Gantt. |
| Gantt de cursada completa | v2. Misma derivación, distinto `assessment_type`. |
| Los 7 módulos de *Formación* | **Contenido pedagógico.** Misma clase de artefacto que los 20 pasos del protocolo: lo escribe la psicopedagoga, entra versionado y rotulado, con `source_text` atado al documento fuente. No se redacta desde acá. |
| Carga institucional de cátedras | El owner fue explícito: *"en un principio el alumno se autoagenda las cátedras"*. La carga por la facultad es futuro. |
| Cualquier ingesta de datos reales | ADR-006. Ver §10. |

---

## 10. La restricción que no se negocia

El corpus que originó este diseño incluye **un certificado analítico real** con nombre completo, DNI,
legajo, domicilio y teléfono.

> ⚠️ **Sirve como insumo de diseño. No entra al repositorio.** Ni como fixture, ni como seed, ni como
> caso de prueba, ni parafraseado. [ADR-006](decisions.md#adr-006) sigue en
> `PROVISIONAL — LEGAL CONFIRMATION REQUIRED` y el backend se construye **sólo sobre datos
> sintéticos**. Las materias, códigos y estructura del Plan 2016 son información pública del plan de
> estudios y sí pueden modelarse; **las filas de una persona no**.

---

## 11. Los ADR que hay que abrir

La numeración es tentativa —el último aceptado es [ADR-066](decisions.md#adr-066)— y el orden es el
de dependencia. **Los cuatro primeros ya están cerrados**; los tres que quedan son del owner.

| # | Título propuesto | Qué desbloquea | Quién decide |
|---|---|---|---|
| ADR-066 | ✅ **El Gantt es `UX02`, no una superficie nueva** | La pantalla, sin tocar el registro | **Owner — decidido 7 sep** |
| ADR-067 | ✅ **El estudiante da de alta su evaluación** — reabre la Etapa 0.4, `CTA-020` | La fecha, y con ella todo lo demás (§7) | **Owner — decidido 7 sep** |
| ADR-068 | ✅ **La duración entra al modelo** — cinco columnas; los minutos por tema **no se persisten** | Todo lo cuantitativo | Equipo — decidido 7 sep |
| ADR-069 | ✅ **`session_kind` se propone, no se importa** — 25% de falsos positivos | Que el importador no borre un tema inventando un examen | Equipo — decidido 7 sep |
| ADR-070 | El factor de estudio (`1.5`) es configuración versionada con `rule_version` | Que cambiar el factor no reescriba el pasado | Owner |
| ADR-071 | Los prerequisitos se proponen desde el orden dictado y **los aprueba una persona** | La relación entre temas | Owner |
| ADR-072 | Cobertura ponderada por horas: qué muestra la barra y qué tiene prohibido mostrar | La barra, sin violar ADR-058 | Owner |
| ADR-073 | Separar *"Necesita tu atención"* de *"Riesgo"* (§8.2) | Que el circuito de riesgo no se infle | Owner + psicopedagoga |

⚠️ **Ya no hay un ADR de navegación en esta lista.** ADR-066 lo volvió innecesario para el Gantt.

---

## 12. Lo que recomiendo hacer primero

Cuatro de los siete ADR están cerrados. Lo que queda:

| | Qué | Estado |
|---|---|---|
| ~~1~~ | ~~El estudiante da de alta su evaluación~~ | ✅ [ADR-067](decisions.md#adr-067) |
| ~~2~~ | ~~Inventario del corpus~~ | ✅ [`inventario-corpus.md`](inventario-corpus.md) |
| ~~3~~ | ~~Duración y `session_kind`~~ | ✅ [ADR-068](decisions.md#adr-068) · [ADR-069](decisions.md#adr-069) |
| 4 | **ADR-070, 071 y 072** — el factor `1.5`, los prerequisitos, la barra | **Owner** |
| 5 | **Corte 1**: `CTA-020` y `POST /api/evaluacion` | Ejecuta ADR-067. **No depende de 4** |
| 6 | **Corte 2**: las cinco columnas de ADR-068 y el importador | Ejecuta ADR-068 y 069 |
| 7 | **Corte 3**: los tres campos nuevos de `estado_de_materia()` y el componente | Depende de 4 |

⚠️ **Los cortes 1 y 2 no esperan a nada.** ADR-067, 068 y 069 están cerrados y ninguno de los tres
depende de las decisiones de producto que faltan. **La barra sí espera**: qué número muestra es
ADR-072, y sin eso el corte 3 no se puede terminar.

### Lo que el inventario contestó

**El estado degradado alcanza a 13 de 36 materias — 36%.** No es la vista principal, pero tampoco un
caso borde: el Gantt es viable para dos de cada tres materias y hay que diseñar bien el otro tercio.

Y trajo tres correcciones al modelo:

1. **`stream` lleva tres valores, no dos** — el corpus usa `TEORICO-PRACTICO`.
2. **La mitad del corpus no se puede atribuir sola.** 46 de los 80 libros —prácticamente todos los
   teóricos— no dicen de qué materia son. La ingesta de teóricos es asistida, no automática.
3. **Encontrar el parcial es el problema.** La columna de tipo dice `NORMAL` en 988 de ~1016 filas, y
   el texto libre tiene 25% de falsos positivos. De ahí [ADR-069](decisions.md#adr-069).

### Lo que [ADR-066](decisions.md#adr-066) abarató

Sin superficie nueva no hay `UX10`, no hay wireframe `WF-S12`, no hay ruta nueva, y los guards de
navegación sólo se tocan por la **única** CTA que el Gantt necesita: `CTA-020`
([ADR-067](decisions.md#adr-067)).

**El Gantt pasó de ser una pantalla a ser cinco columnas, tres campos, un componente y un escritor.**
