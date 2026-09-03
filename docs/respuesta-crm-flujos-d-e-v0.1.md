# Respuesta de la Plataforma a los flujos D y E propuestos por el CRM · v0.1

**De:** equipo Plataforma (`Achieve_Platform`)
**Para:** CTO · equipo CRM (`Achieve_CRM`)
**Responde a:** `crm-propuesta-flujos-actividad-vinculacion-v0.1.md`, 3 de septiembre de 2026
**Fecha:** 3 de septiembre de 2026
**Estado:** **`PLATAFORMA ACEPTA EL DISEÑO CON CAMBIOS REQUERIDOS`** — dos correcciones de contrato,
una dependencia de producto que no cierra este equipo, y **ningún cambio de prioridad**.

> **Resumen en cuatro líneas.** El **Flujo D (actividad)** es implementable y su diseño no tiene
> objeciones: el vocabulario que piden **ya existe declarado y con garantía de estabilidad**, pero el
> filtro que la Plataforma había propuesto para elegir qué eventos viajan **no sirve** y lo
> corregimos acá. El **Flujo E (teléfono)** no está bloqueado por transporte: **la Plataforma no tiene
> el número ni la pantalla donde pedirlo**, y crearla es una decisión de producto. Y hay **un error del
> catálogo compartido que significa dos cosas distintas** según el flujo: hay que arreglarlo antes de
> escribir el despachador, no después.

---

## 0. Encuadre — qué es nuevo y qué no

| Flujo | ¿Es nuevo? |
|---|---|
| **D · Actividad** | **No.** Es el *"Flujo 2 — Actividad"* que [`platform-integration-contract.md`](platform-integration-contract.md) §2 y §2.1 ya listaban como `⬜ a definir`, con *"webhooks firmados (HMAC), idempotentes por `event_id`"*. Lo que llega ahora es **la especificación**, y coincide con lo anticipado |
| **E · Vinculación de teléfono** | **Sí**, y es de otra naturaleza: es el **primer flujo que exige una superficie del estudiante que no existe** y el primero que transporta **un identificador directo de una persona** |

**Coincidimos con la nota de sinergia.** HMAC entrante, `webhook_events` y catálogo de errores se
construyen una vez del lado del CRM y sirven para A, D y E. Del lado de la Plataforma pasa lo mismo
con el **outbox**: un despachador para los tres flujos salientes, no tres.

---

## 1. Flujo D — Actividad

### 1.1 Lo que aceptamos sin cambios

Ruta versionada, `schemaVersion` en el body, HMAC-SHA256 sobre `timestamp + body` con el mismo secreto
entrante del Flujo A, idempotencia por `eventId`, `202` como acuse técnico, reintentos del lado del
emisor, un evento por request y **`type` opaco para el CRM**. Nada de eso pide discusión.

También aceptamos la regla de volumen: **reducimos de nuestro lado**. No mandamos cada micro-acción y
no pedimos modo batch.

### 1.2 El vocabulario de `type` ya existe, y su estabilidad está garantizada por construcción

Piden *"el vocabulario de `type` (o al menos que sea estable por alumno)"*. Podemos dar más que eso:

- El catálogo está **declarado en código**, en `lib/domain/product-events.ts`: los 23 eventos P0 del
  spec §16 más 36 extensiones, cada uno con su uso textual y su nivel
  ([ADR-027](decisions.md#adr-027)).
- Hay **guard en las dos direcciones**: un evento que el backend emita y no esté declarado rompe el
  test, y un evento declarado que nadie emita queda marcado como pendiente con su fase.
- **Los nombres no se cambian nunca.** `product_event` es append-only y ADR-027 decidió explícitamente
  no renombrar los históricos. Un `type` que el CRM reciba hoy significa lo mismo dentro de un año.

**Propuesta concreta:** `type` = el nombre canónico del evento del catálogo (`EvidenceSubmitted`,
`ProtocolStepCompleted`, …). No inventamos un vocabulario paralelo para facturación: sería una segunda
verdad sobre el mismo hecho.

### 1.3 ⚠️ Corrección nuestra: *"sólo los de nivel `NEGOCIO`"* no sirve como selector de actividad

`platform-integration-contract.md` §2.1 propuso, para este flujo, empujar **sólo los eventos de nivel
`NEGOCIO`**. **Esa propuesta era incorrecta para lo que el CRM necesita**, y lo corregimos acá antes de
que se construya contra ella:

| Problema | Caso testigo |
|---|---|
| Hay actividad real que **no** es `NEGOCIO` | **`EvidenceSubmitted` —la entrega, que es *el* caso de "produjo"— es nivel `TRANSICION`.** Con el filtro propuesto, el evento más facturable del producto no viajaría |
| Hay `NEGOCIO` que **no** es actividad del alumno | `InterventionStarted` e `InterventionResolved` son `NEGOCIO` y los produce **un operador**, no el estudiante. Facturar por ellos sería facturar porque alguien está en problemas |

**El nivel clasifica para qué sirve un evento, no quién lo produjo.** Así que el selector correcto es
una marca propia y explícita —*"cuenta como actividad del estudiante"*— en el mismo catálogo, versionada
y con su guard, y **no** una reutilización de `nivel`.

**Lista candidata**, de los que hoy **efectivamente se emiten**:

| Evento | Por qué cuenta |
|---|---|
| `EvidenceSubmitted` | Entregó algo. Es la definición operativa de *"produjo"* |
| `ProtocolStepCompleted` | Cerró un paso del protocolo de examen — y se emite **una vez por vuelta**, no una por paso ([ADR-028](decisions.md#adr-028)) |
| `ProgressUpdated` | Avanzó, con su resultado escrito |
| `RescueSucceeded` | Volvió después de un incumplimiento |

Y **lo que deliberadamente no cuenta**: `CourseViewed` —está declarado `TELEMETRIA` con el motivo
escrito: *"abrir una pantalla no es un hecho de dominio"*—, `ActionAccepted` —aceptar no es hacer, y es
un invariante del producto que aceptar una `Action` no crea nada— y `CommitmentCreated`: comprometerse
tampoco es producir.

⚠️ **La lista de arriba es una propuesta técnica, no una decisión.** Qué cuenta como *"producir"* a
efectos de **facturar** es de producto, y va con el Product Owner. Ver §3.

### 1.4 ⚠️ Corrección requerida 1 — `422 UNRESOLVABLE_STUDENT` no puede significar dos cosas

Es el hallazgo que más caro sale si se descubre tarde, porque **los dos flujos comparten catálogo de
errores y compartirían despachador**:

| Dónde | Qué dice |
|---|---|
| `contrato-riesgo-candidato-v0.2.md` §10.4 | *"El CRM define `422 UNRESOLVABLE_STUDENT` […] y su tabla lo marca **no reintentable**. El outbox tiene que distinguirlo de un `5xx`: […] una cola que reintenta eso para siempre **se tapa sola**"* |
| Esta propuesta, §1.4 | *"`422 UNRESOLVABLE_STUDENT` (`platformStudentId` no vinculado por `/authorize` todavía → **reintentar**: el alumno puede autorizarse después)"* |

Mismo código, mismo catálogo, políticas opuestas. Un único despachador no puede honrar las dos, y
**las dos formas de equivocarse tienen costo**: si trata todo `422` como terminal, se pierde
actividad y la factura sale corta; si lo trata como reintentable, la cola del Flujo A se tapa sola.

**Propuesta:** que la política de reintento **no dependa de la lectura humana del código**. Dos
opciones, en orden de preferencia:

1. **Un código propio para el caso reintentable** del Flujo D —p. ej. `STUDENT_NOT_LINKED_YET`—, dejando
   `UNRESOLVABLE_STUDENT` terminal en todos los flujos.
2. **Un campo `retryable: boolean` en el envelope de error**, y que el despachador obedezca al campo y
   no a una tabla en un documento.

Cualquiera de las dos sirve. **Lo que no sirve es dejarlo como está.**

### 1.5 Lo que la facturación implica para el outbox

El Flujo D es el primero cuya pérdida tiene **consecuencia económica**: los eventos que no lleguen son
alumnos activos que no se facturan.

Dicho con precisión, para no exagerar: como al CRM le alcanza con **≥1 evento por alumno por mes**, el
flujo es **muy tolerante a pérdidas aisladas**. Lo que no tolera es una pérdida **sistemática** —una
institución, una ventana de caída— y, por otro lado, **la graduación de operadores sí depende del
primer evento**: perderlo no la rompe, la **demora** hasta el siguiente.

No cambia lo ya escrito: sigue siendo §7.7 del contrato v0.2 y el **ítem 5 de
[ADR-005](decisions.md#adr-005)**, que es el mismo trabajo que la rotación de secretos. Lo que cambia
es que ahora hay un motivo más para hacerlo bien una sola vez.

---

## 2. Flujo E — Vinculación de teléfono

**El diseño del transporte no tiene objeciones.** HMAC, idempotencia, re-vinculación aceptada, E.164:
todo bien. El problema está antes del transporte.

### 2.1 Hoy la Plataforma no tiene el número

| Hecho | Dónde se verifica |
|---|---|
| La columna existe desde la primera migración de la capa del estudiante | `supabase/migrations/20260830020000_capa_estudiante.sql` — `whatsapp TEXT`, rotulada *"dato personal: gateado por ADR-006"* |
| **Nadie la escribe** | Ninguna ruta, ningún Service, ningún repositorio |
| El repositorio **ni siquiera la selecciona** | `lib/server/repositorios/estudiante.ts` — está escrito con su motivo: es dato personal gateado por [ADR-006](decisions.md#adr-006) |
| **No hay pantalla donde el estudiante lo escriba** | Las nueve superficies del spec (`UX01`–`UX09`) no incluyen ninguna de cuenta o perfil |

### 2.2 El bloqueo real: falta una superficie que nadie decidió

El spec sí pone el WhatsApp en la secuencia de alta —*"LOGIN / CUENTA │ WHATSAPP + ACOMPAÑANTE │
ORIENTACIÓN MÍNIMA │ …"*, §19—, pero **ese onboarding no está construido**, y no por olvido:
[ADR-039](decisions.md#adr-039) —la pantalla de ingreso, decidida por el Product Owner el 3 de
septiembre— lo dejó dicho de frente: *"entre el `authorized: true` del CRM y la primera acción del
estudiante no hay ninguna pantalla definida"*, y ese ADR cierra sólo el primer tramo.

**Crear una superficie nueva es una decisión de producto, no de este equipo.** Es exactamente la regla
que hizo que `/login` esperara a que la tomara una persona.

**Consecuencia práctica:** el Flujo E se puede **especificar y firmar hoy**, y se puede construir su
emisor en cuanto exista el dato. Lo que no puede hacer la Plataforma es empezar a emitir: **no tiene
qué emitir**.

### 2.3 Es el primer flujo que transporta un identificador directo

Los flujos A, B, C y D transportan **identificadores opacos y hechos académicos**. E transporta **el
teléfono de una persona**. Eso mueve tres cosas hacia arriba, todas dentro de la Fase B7 /
[ADR-006](decisions.md#adr-006), que los dos lados ya reconocen como bloqueo:

1. **Consentimiento explícito** para la vinculación, en la misma pantalla donde el número se pide.
2. **Borrado que cruza el límite.** Hoy no hay cláusula que diga qué pasa en el CRM cuando un
   estudiante revoca o se le borra el dato en la Plataforma. **Borrar de un lado no borra del otro**, y
   sin eso el derecho de supresión no es ejecutable. Hace falta un flujo de baja/desvinculación, o
   decirlo explícitamente y asumirlo.
3. **Retención**: cuánto conserva el CRM un número desvinculado.

### 2.4 Propiedad del dato: proponemos que el teléfono sea canónico en el CRM

[ADR-003](decisions.md#adr-003) hace a la Plataforma canónica del **dominio académico**. El teléfono no
lo es: es el dato de contacto del canal operativo, que vive y se usa del lado del CRM.

**Propuesta:** la Plataforma **reporta lo que el estudiante declaró** —procedencia `student`,
`unverified`, con nuestra disciplina de procedencia habitual— y **no lo verifica ni lo reconcilia**.
Si el número cambia por el canal del CRM, **el CRM manda**. Lo decimos ahora para que nadie construya
esperando que la Plataforma resuelva un conflicto entre dos números.

### 2.5 ⚠️ Corrección requerida 2 — falta el código de error de colisión

§2.4 de la propuesta dice que la re-vinculación se acepta *"siempre que el `phone` no colisione con
otro alumno (el teléfono es único en el CRM)"*, y el catálogo compartido **no tiene código para esa
colisión**. Sin él, el caso vuelve como un `4xx` genérico y el despachador vuelve a adivinar — el mismo
problema de §1.4.

**Propuesta:** `409 PHONE_CONFLICT`, **terminal** (no se arregla reintentando: hay que resolverlo con
una persona), y visible como tal para el emisor.

### 2.6 Lo demás que piden, aceptado

- **Normalizamos a E.164** antes de emitir, y rechazamos de nuestro lado lo que no valide.
- **Emitimos en la vinculación y en el cambio de número**, en cuanto exista la superficie.

---

## 3. Lo que necesitamos que decidan ustedes

Ninguna de estas tres la cierra este equipo, y las tres son cortas:

| # | Qué hay que decidir | Quién | Qué destraba |
|---|---|---|---|
| 1 | **Qué cuenta como *"actividad"* a efectos de facturar**, sobre la lista candidata de §1.3 | Product Owner + CTO | Que el emisor del Flujo D se pueda construir sin inventar el criterio |
| 2 | **Si existe la pantalla donde el estudiante da su WhatsApp**, y en qué tramo del alta | Product Owner | Todo el Flujo E. Es la misma decisión que el onboarding que [ADR-039](decisions.md#adr-039) dejó abierto |
| 3 | **Las dos correcciones del catálogo de errores** (§1.4 y §2.5) | CTO, con el CRM | Que el outbox tenga una política de reintento verificable en vez de interpretada |

Las dos primeras **ya quedaron registradas como ADR `PENDING`**, con sus opciones y una recomendación:
[ADR-041](decisions.md#adr-041) —qué cuenta como actividad— y [ADR-042](decisions.md#adr-042) —dónde da
el estudiante su WhatsApp—. **Las cierra una persona, no un agente**, y hasta entonces nadie construye
contra ellas.

---

## 4. Lo que esta respuesta no cambia

| | |
|---|---|
| **[ADR-035](decisions.md#adr-035) sigue vigente** | La integración con el CRM está **diferida al final del Track B — por prioridad, no por bloqueo**. Aceptar el diseño de D y E **no la descongela**, y no cuesta nada dejarlo firmado |
| **[ADR-006](decisions.md#adr-006) sigue siendo bloqueo absoluto** | Ningún flujo transporta un dato de una persona real hasta el dictamen legal. Coincidimos textualmente con ustedes: *"la aprobación técnica del contrato ≠ autorización de tratamiento de datos"* |
| **Las tres definiciones de forma de §11.1 siguen abiertas** | Envelope de error, `cause.code` y el esquema de dos secretos con rotación. **Con D y E pasan a cubrir cinco flujos en vez de tres** — sube su valor, no su urgencia, y el catálogo de errores gana las dos correcciones de arriba |
| **Lo que ya está construido de nuestro lado** | El circuito de riesgo cierra por construcción y los tres comandos del Flujo B ya existen como funciones transaccionales: cuando se descongele, falta el Controller, no la lógica |

---

## 5. Estado, para la próxima versión del contrato

| Flujo | Dirección | Endpoint | Estado tras esta respuesta |
|---|---|---|---|
| **D — Actividad** | Plataforma → CRM | `POST /api/service/v1/activity` | **Diseño aceptado.** Requiere: selector de actividad (§1.3, decisión 1) y corrección del `422` (§1.4) |
| **E — Vinculación de teléfono** | Plataforma → CRM | `POST /api/service/v1/whatsapp-link` | **Diseño aceptado.** Requiere: superficie de captura (§2.2, decisión 2), cláusula de borrado (§2.3) y código de colisión (§2.5) |

**Sin nuevo transporte y sin nuevo secreto**, tal como lo plantearon. Lo que agregamos son **dos
correcciones al catálogo compartido** y **una dependencia de producto que estaba invisible**: el Flujo E
no espera a un webhook, espera a una pantalla.
