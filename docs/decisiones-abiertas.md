# Decisiones que esperan a una persona · 4 de septiembre de 2026

**Documento:** `docs/decisiones-abiertas.md`
**Rol:** el índice de **todo lo que un agente no puede cerrar**, ordenado por qué destraba.
**Se actualiza:** cuando una decisión se cierra —con su ADR— o cuando el equipo levanta una nueva.

> **Por qué existe este documento.** El registro `C01` tiene 51 filas y `decisions.md` tiene 43 ADR:
> los dos son completos y ninguno contesta *"¿qué tengo que decidir yo, y qué pasa si no lo hago?"*.
> Esto sí. **No reemplaza a ninguno de los dos** — cada fila apunta al lugar donde vive la decisión.
>
> ⚠️ **Ninguna de estas la puede cerrar un agente**, y no por prudencia: `AGENTS.md` §1.2 lo prohíbe,
> y las que ya se cerraron se cerraron **por escrito, con su fuente literal guardada**.

---

## 0. Todo, en una tabla

| # | Decisión | Quién | Qué destraba | Urgencia real |
|---|---|---|---|---|
| 1 | La **copy** de la reflexión obligatoria | Product Owner | Que el texto deje de contradecir a un guard | 🔴 **Hay código esperándola** |
| 2 | La **superficie** para escribir una reflexión | Product Owner + diseño | Que la reflexión se escriba desde el producto y no por API | 🔴 Hay código esperándola |
| 3 | **`C01-010`** · qué hace *elegible* a una renegociación | Commitment owner | La última operación del loop sin cablear | 🔴 Hay código esperándola |
| 4 | **`C01-029`** · los umbrales de readiness | Product | Que Modo Examen deje de tener una tabla que nadie escribe | 🟡 Hueco visible en la demo |
| 5 | **`C01-019`** · las cinco dimensiones de progreso | Product Progress | Lo que `UX06` puede mostrar. Gate `H` | 🟡 Hueco visible |
| 6 | **`C01-018`** · quién emite `ProgressUpdated` y con qué causalidad | Progress owner | Que el progreso deje de depender de una operación externa | 🟡 |
| 7 | **`C01-024`** · cuándo se recomienda Modo Examen | Product + ADE | El único evento `P0` del catálogo que nadie dispara | 🟡 |
| 8 | **`C01-030`** · quién valida, quién corrobora y quién pide un reenvío | Product Security / Privacy | **Tres operaciones ya construidas** que hoy corren con secreto de servicio y sin identidad | 🟡 |
| 9 | **`C01-021`** · qué regla produce qué señal | Risk owner | Las dos reglas de riesgo todavía humanas | 🟠 Bloquea el cierre de la Fase B6 |
| 10 | **`C01-044`** · playbooks y SLA | Product Operations | Los dos eslabones que le faltan al circuito de riesgo | 🟠 |
| 11 | Las **dos confirmaciones** del protocolo de examen | Psicopedagoga | Que los veinte pasos dejen de decir *"vigencia sin confirmar"* | 🟠 |
| 12 | **[ADR-006](decisions.md#adr-006)** · el dictamen legal | Asesoría jurídica | **Toda la Fase B7, y B7 destraba B8** | 🔴 **Bloqueo absoluto** |
| 13 | **`C01-042`** · el golden dataset y su autorización | Product Data + la institución | La Etapa B2b.3 y el piloto | 🟠 |
| 14 | La **corrección del §2** del contrato congelado | CTO, con el CRM | Que la firma HMAC no esté especificada de dos maneras | 🟡 Externa |
| 15 | Si el `202` de vinculación lleva `applied` | CTO, con el CRM | Lo que la pantalla de WhatsApp puede afirmar | 🟡 Externa |

**Leyenda de urgencia.** 🔴 hay trabajo listo para empezar que no arranca sin esto · 🟠 bloquea el
cierre de una fase · 🟡 el producto funciona, con un hueco declarado.

---

## 1. Las tres que tienen código esperándolas

Son las únicas con esa propiedad: **el trabajo está identificado y no arranca**.

### 1.1 · La copy de la reflexión obligatoria — **Product Owner**

**La pregunta:** cuando la reflexión **bloquea** la entrega, ¿qué dice el botón?

**El conflicto, textual.** El fixture `FX-LOCAL-EVD-REFLECTION-REQUERIDA` —el diseño aprobado— dice
**"Contanos cómo te fue (requerido)"**. El guard `C-01` de `auditoria-conformidad` **prohíbe
`Contanos`** en su lista de imperativos que no son voseo.

**Los dos no pueden tener razón**, y el análisis del equipo es que **la lista del guard tiene el
defecto**: *contanos* **es** voseo —*contá* + *nos*—, a diferencia de *cuéntanos*. Los otros seis de
la lista (`Entrega`, `Sube`, `Resuelve`, `Elige`, `Agrega`) sí son tuteo.

**Por qué no lo arreglamos nosotros:** aflojar un guard para que pase el cambio de uno es exactamente
lo que un guard existe para impedir. Y elegir la copy es de producto.

| | Opción | Consecuencia |
|---|---|---|
| **A** | **Sacar `Contanos` de la lista del guard** y usar la copy del fixture | **Recomendada.** El guard queda diciendo la verdad y la pantalla usa el texto aprobado |
| B | Dejar el guard y aprobar otra copy | Hoy se usa *"Agregar reflexión (requerido)"*, que no estrena voz. Funciona, y el fixture queda desalineado |

**Mientras tanto** rige la B: nada está roto, y el fixture y la pantalla dicen cosas distintas.

### 1.2 · La superficie para escribir una reflexión — **Product Owner + diseño**

**La pregunta:** ¿dónde escribe el estudiante su reflexión?

**Estado:** desde la [Fase B6.10](roadmap.md) la reflexión **se persiste y su requisito se hace
cumplir en el servidor**. Lo que no existe es el **formulario**:
`components/screens/evidencia.tsx` renderiza `reflection.titulo` como CTA secundaria y nada más.
**Hoy la reflexión se escribe por API.**

**Por qué no lo construimos:** toca `components/screens/*` —**regla 6** de `CLAUDE.md`, que exige que
el roadmap lo pida— y el lenguaje visual sale de las capturas de `docs/diseño/`, **que no están
versionadas** ([ADR-018](decisions.md#adr-018)).

**Lo que hace falta:** que el roadmap lo pida, y las capturas.

### 1.3 · `C01-010` — qué hace *elegible* a una renegociación — **Commitment owner**

**La pregunta:** un compromiso `CONFIRMED` o `DUE`, ¿cuándo se puede mover?

**Estado:** `renegociar()` está **construido, transaccional y probado**, y **no lo llama nadie**. Es
la última de las tres operaciones que la Fase B6.9 encontró huérfanas: el rescate y el reenvío ya se
cablearon; ésta no, porque `CTA-017` exige `renegociacionElegible` y **eso sólo existe en fixtures**:
nada lo calcula.

**Lo que la máquina ya decide, y no hay que volver a decidir:** `CONFIRMED` y `DUE` admiten
`RENEGOTIATED`; **`STARTED` no** —renegociar es válido sólo antes de empezar— y **`MISSED` tampoco**,
que para eso está el rescate.

**Lo que falta es lo temporal:** hasta cuándo, cuántas veces, con qué anticipación. **No lo inferimos:
sería inventar la regla.**

---

## 2. Los huecos visibles del loop

El producto funciona con estos abiertos, y **cada uno se nota**.

### 2.1 · `C01-029` — los umbrales de readiness — **Product**

`PreparationReadiness` es la fuente canónica desde [ADR-011](decisions.md#adr-011), **la tabla existe
desde la Fase B5 y nadie la escribe**. Sin umbrales no hay card, ni score, ni porcentaje — y así
está bien: **mostrar un número que nadie definió sería peor**. Lo que falta es decidir los umbrales.

### 2.2 · `C01-019` — las cinco dimensiones de progreso — **Product Progress** · gate `H`

`UX06` muestra qué cambió y qué no, pero **mostrar las cinco dimensiones con sus valores** es esta
decisión. Es una de las **dos filas con gate `H`** que quedan: bloquea pasar esa pantalla a
high-fidelity.

### 2.3 · `C01-018` — quién emite `ProgressUpdated` — **Progress owner**

El Service **recibe** el resultado de progreso; no decide que hubo progreso. Hoy lo dispara la
operación de validación ([ADR-040](decisions.md#adr-040)), y **`VALIDATED` sigue sin producirlo por
sí solo**, que es correcto. Lo que falta es la causalidad definitiva.

### 2.4 · `C01-024` — cuándo se recomienda Modo Examen — **Product + ADE**

`ExamPreparationRecommended` está en el catálogo `P0` y **nadie lo emite**: falta la ventana de
recomendación. Es el único evento del catálogo que espera una decisión y no una superficie.

### 2.5 · `C01-030` — quién valida, corrobora y pide un reenvío — **Product Security / Privacy**

**La más acumulada:** ya son **tres operaciones construidas** que corren con secreto de servicio y
**sin identidad de persona detrás** — validar una evidencia, corroborar una procedencia y pedir un
reenvío. En las tres, `reviewer_id`/`corroborated_by` quedan `NULL` y el actor del evento es `null`.

⚠️ **Y hay una consecuencia técnica que conviene saber al decidir:** `product_event.actor_id` es
`uuid`. Cuando exista la identidad, entra por ahí; **hasta entonces ninguna ruta la recibe**, porque
aceptar un identificador que no se puede escribir obliga a fabricar un UUID —inventar una identidad—
o a romper. Lo aprendimos con un `500` real.

**Y el rol `R1` (Reviewer) sigue sin superficie**, por [ADR-033](decisions.md#adr-033): no está claro
si vive acá o en el CRM.

---

## 3. Lo que bloquea el cierre de una fase

### 3.1 · `C01-021` — qué regla produce qué señal — **Risk owner**

Una de las tres reglas corre, con el criterio profesional de [ADR-037](decisions.md#adr-037).
**`HP0-06-2` y `HP0-06-3` siguen en modo humano, sin umbral.** Hay un guard estático que rompe si
alguien agrega un evaluador: **no se inventan.**

### 3.2 · `C01-044` — playbooks y SLA — **Product Operations**

Los dos eslabones que le faltan al circuito de riesgo. **La tabla está vacía a propósito** y
`circuito_de_senales()` lo declara en vez de dar el circuito por cerrado.

### 3.3 · Las dos confirmaciones del protocolo — **Psicopedagoga**

Los veinte pasos corren con **su texto literal** ([ADR-031](decisions.md#adr-031)) y el rótulo dice
*"vigencia todavía sin confirmar"*. Faltan **dos frases**: si el texto está vigente, y qué pasos son
reentrantes. **No bloquean código** — bloquean poder decir que el protocolo es el suyo.

La agenda completa, con sus residuos: [`agenda-cierre-psicopedagoga.md`](agenda-cierre-psicopedagoga.md).

---

## 4. El bloqueo absoluto, y el que depende de él

### 4.1 · [ADR-006](decisions.md#adr-006) — el dictamen legal — **Asesoría jurídica**

**Es el único bloqueo absoluto del proyecto.** Las decisiones de producto están tomadas desde el 1 de
septiembre; lo que falta es el **dictamen**, y sin él **no entra una sola persona real** — ni a la
Plataforma, ni al CRM por ninguno de los cinco flujos.

Las preguntas están armadas en [`legal-package.md`](legal-package.md).

⚠️ **Todo lo construido corre sobre datos sintéticos**, y eso **no es una limitación temporal que se
levante sola**: es lo que hace que el gate se pueda sostener.

### 4.2 · `C01-042` — el golden dataset — **Product Data + la institución**

Bloquea la Etapa **B2b.3** —la segunda fuente del ingestor— y el piloto de la Fase B8. Necesita
**autorización institucional**, que es una conversación con una institución, no una decisión interna.

---

## 5. Lo que espera del otro lado

No las decide Achieve Plataforma sola: van con el CTO y el equipo del CRM.

| | Qué | Por qué importa |
|---|---|---|
| **1** | **Corregir el §2 del contrato congelado**: la firma es `${timestamp}.${rawBody}`, con punto | **Es el único punto donde el contrato congelado dice algo falso.** Un solo middleware y un solo secreto para los cuatro flujos entrantes, y dos construcciones distintas. El modo de falla es un `401` mudo que no dice cuál de las tres cosas falló |
| **2** | Si el `202` de vinculación lleva un campo `applied` | Define **qué puede afirmar la pantalla de WhatsApp**. La recomendación del equipo es que **no**: la Plataforma no proyecta un estado del CRM que no observa, que es lo que el Product Owner ya ratificó en [ADR-042](decisions.md#adr-042) |

Los dos están planteados en [`respuesta-crm-flujos-d-e-v0.2.md`](respuesta-crm-flujos-d-e-v0.2.md) §3
y §4.1.

---

## 6. Cómo se cierra una de éstas

Como se cerraron las últimas cuatro, y no es burocracia: es lo que permite construir contra una
decisión sin volver a preguntarla.

1. **Se responde por escrito.** Un mail, un documento, un mensaje: lo que sea, pero escrito.
2. **La respuesta se guarda literal**, en un `*-source.md`. **No se edita, ni los tipeos.** Si el ADR
   y la fuente discrepan, **manda la fuente**.
3. **Se escribe el ADR** con lo que se decidió, lo que **no** se decidió, y las alternativas
   descartadas con su motivo.
4. **Recién ahí se construye.**

**Ejemplos de esta semana:** [ADR-041](decisions.md#adr-041), [ADR-042](decisions.md#adr-042) y
[ADR-043](decisions.md#adr-043), con su fuente en
[`respuesta-po-flujos-crm-source.md`](respuesta-po-flujos-crm-source.md); y
[ADR-037](decisions.md#adr-037), con la de la psicopedagoga.
