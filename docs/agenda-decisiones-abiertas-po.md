# Las once decisiones abiertas, para cerrarlas

**Documento:** `docs/agenda-decisiones-abiertas-po.md`
**Para:** Product Owner
**De:** equipo Plataforma
**Fecha:** 5 de septiembre de 2026
**Qué es:** el material mínimo para **responder** las once filas abiertas de
[`decisiones-abiertas.md`](decisiones-abiertas.md). Ese documento dice *qué* falta decidir; **éste
trae lo que hace falta para decidirlo**: la pregunta, las opciones, una recomendación y el lugar
donde escribir la respuesta.

> ⚠️ **Ninguna de éstas la puede cerrar un agente**, y no por prudencia: `AGENTS.md` §1.2 lo prohíbe.
> Lo que sigue son opciones y recomendaciones — **la decisión es tuya, y se guarda con tu texto
> literal**, como se hizo con [ADR-041/042/043](respuesta-po-flujos-crm-source.md).

> ## ✅ RESPONDIDA — 5 de septiembre de 2026
>
> **Las seis que dependían del owner quedaron cerradas el mismo día.** La respuesta literal está en
> [`respuesta-po-agenda-decisiones-source.md`](respuesta-po-agenda-decisiones-source.md), y su
> lectura en [ADR-054](decisions.md#adr-054) … [ADR-059](decisions.md#adr-059).
>
> | | Cómo quedó |
> |---|---|
> | **ADR-054** | **Opción `B`.** `CTA-001` transporta el `CourseEnrollment`. **`A` y `C` quedan como decisión de diseño separada** |
> | **C01-021** | **Opción `B`.** Modo humano hasta el piloto, con la condición escrita |
> | **C01-044** | **Opción `A`**, provisional: playbook completo y **cuatro horas hábiles** de SLA |
> | **C01-030** | **Opción `C`.** `DEFERRED` con motivo hasta ADR-006 |
> | **C01-029** | Regla determinística sobre los tres estados. **Sin porcentaje ni predicción de aprobación** |
> | **C01-019** | Se conserva lo actual. La semántica completa es **residuo de piloto**, y no bloquea el MVP |
>
> ⚠️ **La aprobación autoriza implementar sólo `ADR-054` opción `B`**, en un commit separado del de
> trazabilidad. Las cinco de §4 siguen abiertas y **hay que pedirlas**.
>
> **Este documento queda como el planteo que produjo esas respuestas.** No se edita para reflejarlas:
> para eso están los ADR.

---

## 0. Cómo se usa

Cada decisión tiene al pie una línea así:

```
**Respuesta:**
```

Escribí ahí. No hace falta redactar un ADR: con la respuesta, el equipo la transcribe a un archivo
`respuesta-…-source.md` **literal**, actualiza el ADR o el `C01` correspondiente, y toca el código en
un commit aparte.

**Podés responder de a una.** Ninguna depende de otra salvo donde se dice.

---

## 1. Las once, en una tabla

| # | La pregunta, en una línea | Quién | Si no se decide |
|---|---|---|---|
| **[2.1](#21--adr-054--qué-es-el-apartado-materias)** | ¿Qué es el apartado **«Materias»**: el detalle de una, o la lista? | **Vos + Diseño** | 🔴 El estudiante ve **una** materia de las que declaró, y abrir otra le abre esa misma |
| **[2.2](#22--c01-021--qué-regla-produce-qué-señal)** | ¿Con qué umbral escalan las otras dos reglas de riesgo? | Risk owner | 🟠 Dos de las tres reglas siguen en modo humano. **Bloquea cerrar la Fase B6** |
| **[2.3](#23--c01-044--playbooks-y-sla)** | ¿Qué playbook y qué SLA tiene una señal escalada? | Product Operations | 🟠 El circuito de riesgo declara los dos eslabones como `null` |
| **[2.4](#24--c01-030--quién-valida-corrobora-y-pide-un-reenvío)** | ¿Quién es la persona detrás de validar, corroborar y pedir un reenvío? | Product Security / Privacy | 🟡 **Tres operaciones construidas** corren sin identidad. Ya ratificaste el interinato; falta el definitivo |
| **[3.1](#31--c01-029--los-umbrales-de-readiness)** | ¿Qué combinación de señales hace que una preparación esté lista? | Product | 🟡 `preparation_readiness` existe **y nadie la escribe** |
| **[3.2](#32--c01-019--las-cinco-dimensiones-de-progreso)** | ¿Cómo se muestran las cinco dimensiones? | Product Progress | 🟡 Gate `H`: bloquea llevar `UX06` a high-fidelity |
| **[4.1](#41--el-dictamen-legal--adr-006)** | ¿Con qué base legal se piden los datos? | Asesoría jurídica | 🔴 **Bloqueo absoluto.** Toda la Fase B7, y B7 destraba B8 |
| **[4.2](#42--las-dos-confirmaciones-del-protocolo)** | ¿El texto de los veinte pasos está vigente? ¿Cuáles son reentrantes? | Psicopedagoga | 🟠 El protocolo corre rotulado *"vigencia sin confirmar"* |
| **[4.3](#43--el-golden-dataset-y-el-plan-2016--c01-042-y-c01-052)** | ¿Se autoriza usar los datos de la institución piloto? | Product Data + la institución | 🟠 La Etapa B2b.3 y el piloto |
| **[4.4](#44--las-dos-del-cto-con-el-crm)** | ¿Cómo se firma el HMAC, exactamente? | CTO, con el CRM | 🟡 El contrato congelado dice **dos cosas distintas** |
| **[4.5](#44--las-dos-del-cto-con-el-crm)** | ¿El `202` de vinculación lleva `applied`? | CTO, con el CRM | 🟡 Define qué puede afirmar la pantalla de WhatsApp |

**Cuatro son tuyas y no dependen de nadie más** (§2). **Dos son tuyas y pediste un paquete antes de
decidir** — el paquete está en §3. **Cinco necesitan a otra persona** (§4), y ahí lo que falta es
*pedirlas*.

---

## 2. Las cuatro que podés cerrar hoy, solo

### 2.1 · ADR-054 · ¿Qué es el apartado «Materias»?

**La pregunta.** Entrás a «Materias» y ves **una** materia. ¿La pantalla es el detalle de una, la
lista de todas, o las dos cosas en lugares distintos?

**Lo verificado**, contra Postgres, con un estudiante que declaró nueve cursadas en el alta:

| Qué se preguntó | Qué devolvió |
|---|---|
| `estado_del_dia(…)->'materias'` | **9** |
| `estado_de_materia(…, cursada => NULL)` | **1** · `Álgebra Sintética` |

**Lo que dice el spec, y es lo que cambia la pregunta.** La Parte II §10 define **dos áreas
distintas**:

| Área | Responsabilidad, textual |
|---|---|
| **Materias** | *"Espacios persistentes de cursado y evaluaciones."* |
| **Materia > Cursado** | *"Ritmo, unidades, progreso, recursos, acciones y Bitácora."* |

**El ítem del menú se llama como la primera y lleva a la segunda.** Y `VI.2` §5.1 lista *"área
existente **Materias**"* entre las entradas válidas: el spec **la da por existente** y **nunca la
especifica** — no hay wireframe, ni contenido, ni CTA en el registro canónico.

⚠️ **Y hay una línea que el código contradice hoy.** `VI.2` §5.2: *"Al entrar desde Hoy **se abre el
`CourseEnrollment` seleccionado**"*. `CTA-001` no lleva cuál, así que abrir la séptima materia de la
cola de `HOY` **abre la primera**.

**Por qué no lo cierra el equipo.** Toca el **registro canónico de CTAs**, que es contrato
([ADR-016](decisions.md#adr-016) exige un ADR detrás de toda fila que no transcriba el spec),
`components/screens/*` (regla 6) y el lenguaje visual, que sale de `docs/diseño/`.

#### Opciones

| | Qué se hace | Qué corrige | Qué cuesta |
|---|---|---|---|
| **A** | **El menú se llama como lo que hay** — «Materia», singular | Nada del hallazgo; deja de prometer una lista que no existe | Una etiqueta |
| **B** | **`CTA-001` lleva la cursada** — `?cursada=` **ya funciona** en la API y en la función de base; falta que el id llegue a la pantalla y que la CTA admita el parámetro | El incumplimiento del §5.2, entero | Un campo en `MateriaResumen`, la CTA con parámetro y **una nota en el registro canónico** |
| **C** | **Se construye el área «Materias»** que la §10 nombra | Los tres puntos | Una superficie **sin wireframe**: el spec la nombra en una línea y nunca la especifica. Necesita capturas |

**Recomendación del equipo: `B` ahora, y `A` o `C` como decisión aparte.** `B` es lo único que
convierte una respuesta equivocada en la correcta, no estrena superficie, no mueve el conteo de
nodos y tiene la mitad del camino construida. **`A` y `C` son diseño y se miran con las capturas
delante.**

**Respuesta:**

---

### 2.2 · `C01-021` · Qué regla produce qué señal

**La pregunta.** `HP0-06-1` ya corre con el criterio profesional de
[ADR-037](decisions.md#adr-037). **`HP0-06-2` y `HP0-06-3` siguen sin umbral.** ¿Cuál es?

**Lo que ya está decidido y no se vuelve a abrir:** los umbrales de `HP0-06-1` son **2 y 3**, la
psicopedagoga los ratificó sin moverlos, y lo que ella corrigió fue **qué cuenta como una
repetición**, no el número.

**Por qué no lo cierra el equipo.** Hay un **guard estático que rompe** si alguien agrega un
evaluador para las otras dos: la regla del repo es que no se inventan.

#### Opciones

| | Qué se hace |
|---|---|
| **A** | **Definir las dos ahora**, con el mismo formato que `HP0-06-1`: qué hecho se cuenta, sobre qué denominador, y con qué número escala |
| **B** | **Dejarlas en modo humano hasta el piloto**, y decirlo: `C01-021` pasa a `ANSWERED — RESIDUO ABIERTO` con la condición *"se fijan con datos del piloto"* |

**Recomendación: `B`.** Es lo mismo que la psicopedagoga hizo con `C01-036` —condicionarla al
piloto— y **destraba el cierre de la Fase B6 sin inventar un umbral**: la fase deja de estar
bloqueada por una decisión que hoy no tiene evidencia sobre la cual tomarse. `A` sólo conviene si ya
tenés el criterio.

**Respuesta:**

---

### 2.3 · `C01-044` · Playbooks y SLA

**La pregunta.** Cuando una señal llega a `INTERVENTION_REQUIRED`, ¿qué tiene que hacer la persona, y
en cuánto tiempo?

**Estado.** La tabla `playbook` **está vacía a propósito**, y `circuito_de_senales()` **declara los
dos eslabones faltantes** en vez de dar el circuito por cerrado. No hay nada que corregir en el
código: hay algo que llenar.

#### Opciones

| | Qué se hace |
|---|---|
| **A** | **Un playbook mínimo y un SLA**, aunque sean provisionales: *"contactar por WhatsApp dentro de X horas hábiles; registrar outcome"* |
| **B** | **Esperar a Product Operations**, y que el circuito siga declarando el hueco |

**Recomendación: `A`, con rótulo de provisional.** El circuito ya garantiza por construcción que una
intervención no se cierra sin outcome; lo que falta es qué se le dice a quien la toma. **Un playbook
provisional y rotulado es mejor que ninguno**, y no compromete nada: la tabla es configuración
versionada, no schema.

⚠️ Esto **no** decide *quién* interviene — eso es `C01-030`, abajo.

**Respuesta:**

---

### 2.4 · `C01-030` · Quién valida, corrobora y pide un reenvío

**La pregunta.** Son **tres operaciones ya construidas** que corren con secreto de servicio y **sin
identidad de persona**: validar una evidencia, corroborar una procedencia y pedir un reenvío. En las
tres, `reviewer_id`/`corroborated_by` quedan `NULL` y el actor del evento es `null`.

**Lo que ya respondiste, y sigue vigente:** el interinato está ratificado —mientras todo sea
sintético las tres pueden seguir así, el proceso se identifica en el payload del evento, y **no se
fabrican UUID para representar personas inexistentes**—, con su límite textual: *"esto no autoriza
revisión de evidencia de estudiantes reales"*.

**Lo que falta es el definitivo**, y tiene una consecuencia técnica que conviene saber al decidir:
`product_event.actor_id` es `uuid`. Cuando exista la identidad entra por ahí; **hasta entonces
ninguna ruta la puede recibir**, porque aceptar un identificador que no se puede escribir obliga a
inventar un UUID o a romper. Costó un `500` real.

#### Opciones

| | Qué se hace |
|---|---|
| **A** | **La identidad vive en el CRM** — coherente con [ADR-033](decisions.md#adr-033), que ya mandó las superficies de operador allá. La Plataforma recibe un identificador externo y lo guarda como texto, no como FK |
| **B** | **La identidad vive en Achieve** — hay una tabla de personas del staff, y `reviewer_id` pasa a ser FK real |
| **C** | **Se difiere hasta [ADR-006](decisions.md#adr-006)**, porque revisar evidencia de una persona real es justo lo que el gate legal bloquea |

**Recomendación: `C`, y decirlo así.** Ninguna de las tres operaciones puede tocar a una persona real
hasta que el dictamen legal esté, así que **decidir la identidad ahora no destraba nada** y sí obliga
a elegir entre `A` y `B` sin el dato que lo decide. Cerrarla como *diferida con motivo* saca la fila
de la lista de pendientes activos.

**Respuesta:**

---

## 3. Las dos que pediste con paquete previo — el paquete está adentro

Sobre estas dos dijiste que **no fijás nada sin ver el material**. Es lo que sigue. **Los números y
las definiciones no están propuestos por el equipo**: eso sería inventar la regla de negocio que
`AGENTS.md` §1.1 prohíbe. Lo que está es **todo lo que existe**, para que decidir sea llenar una
tabla.

### 3.1 · `C01-029` · Los umbrales de readiness

**Primero, una corrección al nombre.** *No son umbrales numéricos.* La tabla
`preparation_readiness` no tiene un score: tiene **cuatro señales y tres estados**. La decisión es
**qué combinación de señales produce cada estado**.

**Las señales que existen hoy, en el schema:**

| Columna | Tipo | Qué es |
|---|---|---|
| `required_steps` | `jsonb` | Qué pasos del protocolo se consideran requeridos para esta preparación |
| `evidence_status` | `text` | El estado de la evidencia de la preparación |
| `autonomous_practice` | `boolean` | ¿Practicó sin apoyo? |
| `simulation` | `boolean` | ¿Hizo una simulación? |
| `critical_gaps` | `jsonb` | Los huecos que quedan |
| `explanation` | `text` · **`NOT NULL`** | La razón legible. **El schema ya obliga a que haya una** |

**Los tres estados**, fijados por `CHECK`: `NOT_READY` · `BUILDING` · `READY_BY_PROTOCOL`.

⚠️ **`READY_BY_PROTOCOL` se llama así a propósito**: es *"cumplió el protocolo"*, **no** *"va a
aprobar"*. Cualquier regla que se decida sigue sin poder afirmar lo segundo.

**La tabla a llenar:**

| Estado | ¿`required_steps` completos? | ¿`evidence_status`? | ¿`autonomous_practice`? | ¿`simulation`? | ¿`critical_gaps` vacío? |
|---|---|---|---|---|---|
| `READY_BY_PROTOCOL` | | | | | |
| `BUILDING` | | | | | |
| `NOT_READY` | | | | | |

**Lo que ya está decidido y no hay que volver a mirar:** el disparador de Modo Examen **no depende de
readiness** ([ADR-048](decisions.md#adr-048)) — son 14 días calendario, y un test rompe si alguien
acopla las dos cosas. Así que **decidir esto no cambia cuándo aparece Modo Examen**; cambia qué se
muestra adentro.

**Y tu propia instrucción sigue en pie:** *"no implementar porcentajes provisionales"*. Con esta
tabla no hace falta ninguno — no hay un número que mostrar, hay tres estados y una explicación.

**Respuesta:**

---

### 3.2 · `C01-019` · Las cinco dimensiones de progreso

**Lo que pediste:** nombre canónico, **definición observable**, escala, fuente y un ejemplo **de cada
dimensión**. Las tres columnas de la derecha ya existen y son hechos del schema; **las dos de la
izquierda son la decisión**.

| Dimensión | Fuente en `topic_progress` | Estados posibles, por `CHECK` | Definición observable → **tuya** | Escala → **tuya** |
|---|---|---|---|---|
| **Recorrido** | `exposure_value` · `exposure_state` | `value` · `not_evaluated` · `no_information` | | |
| **Práctica** | `practice_value` · `practice_state` | idem | | |
| **Dominio** | `domain_value` · `domain_state` | idem | | |
| **Confianza** | `confidence_value` · `confidence_state` · `confidence_declared_at` | idem | | |
| **Recencia** | `recency_at` | — (es un instante) | | |

**Lo que el schema ya garantiza, y no hay que decidir:**

- **Un valor sin estado `value` es imposible.** Hay un `CHECK` por dimensión: o el estado es `value`
  y el número existe, o el estado es otro y el número es `NULL`. **«Sin datos» nunca puede leerse
  como `0`.**
- **La confianza no existe sin fecha.** `confianza_con_fecha` lo obliga.
- **`domain_state` arranca en `not_evaluated`** y el resto en `no_information` — y son distintos a
  propósito: *"existe el eje y nadie lo midió"* no es *"no hay con qué mirarlo"*.

**Qué hace hoy la pantalla, mientras esto está abierto:** `UX06` muestra **qué cambió y qué no**, y
`UX02` **omite toda dimensión medida** — existe el número y no existe la unidad en la que
expresarlo. `VI.2` §8.6 autoriza exactamente esa salida: *"si no existe semántica aprobada para
mostrar una dimensión, omite la síntesis o muestra un hecho comprensible; **nunca expone un valor
interno bruto**"*.

**La confirmación que destraba el presente**, y es una sola frase:

> *"La implementación actual, que distingue un cambio de un «sin cambio confirmado», puede
> mantenerse."*

**Lo que esta decisión NO puede hacer**, y el spec lo prohíbe textualmente: etiquetar un `% aprendido`
· promediar las cinco · convertir confianza en dominio · usar estados generales como *"consolidada"*
en vez de nombrar la dimensión.

**Respuesta:**

---

## 4. Las cinco que no dependen de vos

Acá no hay opciones que elegir: **hay que pedirlas**. Lo que sigue es a quién, y qué exactamente.

### 4.1 · El dictamen legal — [ADR-006](decisions.md#adr-006)

**A quién:** asesoría jurídica. **El paquete ya está armado** en
[`legal-package.md`](legal-package.md).

**Estado:** `PROVISIONAL — LEGAL CONFIRMATION REQUIRED`. Las decisiones de producto están tomadas
desde el 1 de septiembre; **eso no levanta el gate**. Es el único bloqueo que no se puede relajar con
ninguna instrucción que no sea tuya y por escrito, y **bloquea la Fase B7, que bloquea la B8**.

### 4.2 · Las dos confirmaciones del protocolo

**A quién:** la psicopedagoga. **Son dos frases**, y la agenda está en
[`agenda-cierre-psicopedagoga.md`](agenda-cierre-psicopedagoga.md):

1. ¿El texto de los veinte pasos **está vigente**? Hoy corre rotulado *"vigencia todavía sin
   confirmar"*, y son tres estados distintos —del equipo, sin confirmar, confirmado— que no se
   colapsan.
2. ¿**Qué pasos son reentrantes**? Hoy lo lleva `protocol_step.is_reentrant`, configurable.

⚠️ **No bloquean código.** Bloquean poder decir que el protocolo es el suyo.

### 4.3 · El golden dataset y el Plan 2016 — `C01-042` y `C01-052`

**A quién:** Product Data y la institución.

- **`C01-042`** — la autorización para usar los datos de la carrera piloto.
- **`C01-052`** — **el plan de estudios oficial del Plan 2016 de la UCC**: PDF, CSV o resolución,
  **con año y semestre por materia y los nombres completos**. Con eso se corrigen las diez filas
  truncadas, se confirma el año, se resuelve si `SEMINARIO` es asignatura o cupo y se cargan las
  opciones de `ELECTIVA I` y `ELECTIVA II`.

⚠️ **No cerrarlas no rompe nada hoy:** el alta corre entera sobre el catálogo sintético, que es
exactamente lo que ADR-006 §5 dice que sí se puede hacer.

### 4.4 · Las dos del CTO, con el CRM

1. **La firma HMAC está especificada de dos maneras.** El contrato v0.2 §2 dice *"firma sobre
   timestamp + body original"*; la v0.2 del CRM dice `${timestamp}.${rawBody}`, **con punto**. Es un
   solo middleware y un solo secreto para A, D, E y E′, y el modo de falla es **un `401` mudo**.
   **Gana el punto**, y hay que corregir el §2 en la próxima versión del contrato.
2. **¿El `202` de vinculación lleva `applied`?** Define qué puede afirmar la pantalla de WhatsApp —
   que hoy sólo puede decir *"Guardamos tu número"* o *"Recibimos tu solicitud"*.

⚠️ Las dos son **externas y están congeladas** por [ADR-035](decisions.md#adr-035). No urgen; conviene
que estén resueltas **antes** de descongelar la integración, no durante.

---

## 5. Qué pasa cuando respondés

1. Tu texto se guarda **literal** en un `respuesta-…-source.md`. Una fuente literal manda sobre
   cualquier paráfrasis.
2. El ADR o el `C01` pasa a `ACCEPTED` / `CLOSED` / `ANSWERED — RESIDUO ABIERTO`, y se anota **qué
   quedó abierto** si algo quedó.
3. `decisiones-abiertas.md` y `roadmap.md` se actualizan **en el mismo commit**.
4. El código va **aparte**, y sólo si la respuesta lo autoriza. Cerrar una decisión no es una orden
   de construir: [ADR-041/042/043](respuesta-po-flujos-crm-source.md) se cerraron y fueron a backlog.

⚠️ **Nada de esto levanta [ADR-006](decisions.md#adr-006).** Las once se responden sabiendo que el
dato de una persona real sigue bloqueado.
