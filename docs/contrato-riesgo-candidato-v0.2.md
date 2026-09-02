# Achieve — Contrato candidato de riesgo e intervención · Plataforma ↔ CRM · **v0.2**

**Documento:** `docs/contrato-riesgo-candidato-v0.2.md`
**Estado:** `CANDIDATE — DESIGN ACCEPTED BILATERALLY`. El CRM lo revisó contra su código el 2 de
septiembre de 2026 y devolvió `CRM ACCEPTS WITH REQUIRED CHANGES`: **ninguna objeción de diseño**, y
dos acuerdos de forma pendientes (§10).
**Fecha:** 1 de septiembre de 2026
**Referencias:** [ADR-033](decisions.md#adr-033) (la frontera), [ADR-034](decisions.md#adr-034) (`C01-022`).
**Sustituye a:** el candidato v0.1 del CTO, del 1 de septiembre de 2026.

> ⚠️ **Este documento no es un contrato vigente.** El único contrato vigente entre los dos sistemas
> es el de autorización de padrón, en [`platform-integration-contract.md`](platform-integration-contract.md)
> §1, que **no se toca acá**. Nada de lo que sigue está implementado: el schema y el código están
> como los dejó `b450b8e`.
>
> ⚠️ **Ningún flujo de este documento transporta datos de una persona real** mientras
> [ADR-006](decisions.md#adr-006) siga sin dictamen legal. Se especifica y se prueba con datos
> sintéticos.

---

## 1. Lo que la Plataforma acepta sin cambios

Los siete puntos de arquitectura del candidato v0.1 quedan confirmados, y coinciden con
[ADR-033](decisions.md#adr-033):

1. El operador trabaja exclusivamente en el CRM.
2. No inicia sesión ni interactúa con la Plataforma.
3. La Plataforma autentica al CRM **como sistema**, nunca a la persona.
4. El CRM es responsable de la cola, la asignación y la ejecución humana.
5. La Plataforma conserva el dominio académico canónico: señales, causas, severidades,
   intervenciones registradas y outcomes.
6. El CRM **no escribe** en la base de la Plataforma: envía comandos, y la Plataforma decide si son
   válidos.
7. `POST /api/service/v1/authorize` **permanece intacto y separado**.

También se aceptan sin cambios: el versionado por URL con `schemaVersion` en cada mensaje (§7 del
candidato), el bloque de seguridad y observabilidad (§8) y el bloque de privacidad (§9).

**Secretos distintos por dirección**, tal como propuso el CTO: ni `/authorize` ni el secreto de
`POST /api/reloj` se reutilizan. Que el patrón de secreto de servicio ya exista acá **no significa
que el secreto se comparta**.

---

## 2. Flujo A · Señal que requiere intervención · Plataforma → CRM

**Push con webhook firmado.** Aceptado: HMAC-SHA256 con secreto exclusivo de esta dirección, firma
sobre timestamp + body original, ventana de tolerancia contra replay, y los cinco headers propuestos
(`X-Achieve-Event-Id`, `X-Achieve-Timestamp`, `X-Achieve-Signature`, `X-Correlation-Id`,
`Content-Type`).

La tabla de respuestas, la semántica de reintentos y la exigencia de un `error.code` estable se
aceptan **tal como están** en el candidato v0.1.

### 2.1 Payload v0.2

```json
{
  "schemaVersion": "1.0",
  "eventId": "uuid",
  "occurredAt": "2026-09-01T20:00:00Z",
  "riskSignalId": "uuid",
  "platformStudentId": "uuid",
  "cause": {
    "code": "string | null",
    "label": "string"
  },
  "severity": "bajo | atencion | riesgo | intervencion",
  "requiresHumanIntervention": true
}
```

### 2.2 Qué cambió, y por qué

**`institutionId` sale del payload.** El contrato v1 de autorización dice que el `institutionId` que
devuelve el CRM es *"la institución (cliente del CRM)"*, y `architecture.md` §3.10 registra que
**nunca se definió si ese UUID es el mismo que `institution.id` de la Plataforma** (`C01-001`,
`C01-039`). Mandarlo obligaría a uno de los dos lados a igualarlos por inferencia. **El CRM resuelve
la institución por `platformStudentId`**, cuya relación creó `/authorize` — que es la única
correspondencia que los dos sistemas acordaron.

**La severidad queda fijada como enum.** El schema ya la tiene congelada:

```sql
severity TEXT NOT NULL CHECK (severity IN ('bajo','atencion','riesgo','intervencion'))
```

`C01-021` **no bloquea el vocabulario**: bloquea **qué regla asigna cuál**. Son dos cosas distintas y
el contrato puede fijar la primera hoy.

**`cause.code` es nullable; `cause.label` no.** `risk_signal.risk_rule_id` es nullable: una señal
puede existir sin regla que la haya producido. Pero `reason` es `NOT NULL` con
`CHECK (length(btrim(reason)) > 0)`, porque el spec lo exige dos veces —*"nunca un score opaco como
única salida"*—. **No se inventa una regla para poder completar un código.**

### 2.3 Minimización

Se acepta entera la lista del candidato: en v1 **no viajan** evidencias, archivos, notas libres,
reflexiones, mensajes privados ni contenido académico completo.

⚠️ **`cause.label` es texto libre escrito por quien produjo la señal.** Es el campo de este flujo con
más riesgo de arrastrar contenido personal. Antes de habilitar datos reales, B7 tiene que decidir si
se transporta tal cual, se acota a un vocabulario, o se reduce a `cause.code` más una etiqueta corta.

### 2.4 El transporte no es dominio

**La recepción técnica del webhook no cambia el estado de `risk_signal`** — decisión 2 de
[ADR-034](decisions.md#adr-034). Que un evento esté pendiente, entregado, reintentado o agotado vive
en el outbox (§6). Un `202` del CRM **no es** un reconocimiento de dominio.

---

## 3. Flujo B · Comandos de intervención y outcome · CRM → Plataforma

Los tres comandos separados se aceptan, y se corresponden 1:1 con funciones que **ya existen y son
transaccionales**:

| Comando | Función de la Plataforma |
|---|---|
| `open` | `abrir_intervencion()` |
| `acknowledge` | `reconocer` → `interventionTransitions: open → acknowledged` |
| `close` | `cerrar_intervencion()` — estado y outcome en **una sola escritura** |

Autenticación, `Idempotency-Key`, `X-Correlation-Id`, la tabla de respuestas y los siete códigos de
error (`INVALID_TRANSITION`, `UNKNOWN_RISK_SIGNAL`, `UNKNOWN_INTERVENTION`, `IDEMPOTENCY_CONFLICT`,
`INVALID_OUTCOME`, `INVALID_OWNER_ASSERTION`, `UNSUPPORTED_SCHEMA_VERSION`) se aceptan **sin
cambios**.

### 3.1 `open`

```json
{
  "schemaVersion": "1.0",
  "commandId": "uuid",
  "occurredAt": "2026-09-01T20:05:00Z",
  "riskSignalId": "uuid",
  "ownerOperatorId": "uuid",
  "crmCaseId": "uuid"
}
```

**`playbookRef` sale de v1.** `intervention.playbook_id` es una **FK a la tabla local `playbook`**,
que está vacía a propósito porque `C01-044` dice textual *"no se inventan valores"*. Una referencia
del CRM no entra en esa columna, y aceptar el campo obligaría a resolver hoy quién es dueño del
playbook. Vuelve cuando `C01-044` cierre.

**`crmCaseId` se acepta y se conserva.** Es el dato con el que los dos sistemas reconcilian un caso.
Hoy **no hay columna**, y descartarlo en silencio sería peor que rechazarlo. Requiere una ampliación
de schema no destructiva (§7).

La Plataforma valida: que la señal exista en la institución del estudiante, que esté en
`INTERVENTION_REQUIRED`, que la transición sea válida, idempotencia por `Idempotency-Key`, y
presencia de owner.

### 3.2 `acknowledge`

```json
{
  "schemaVersion": "1.0",
  "commandId": "uuid",
  "occurredAt": "2026-09-01T20:10:00Z",
  "ownerOperatorId": "uuid",
  "crmCaseId": "uuid"
}
```

**Este comando mueve la intervención, no la señal.** La señal se queda en `INTERVENTION_REQUIRED`
mientras la obligación humana esté abierta ([ADR-034](decisions.md#adr-034), decisión 3). El
reconocimiento del operador ya tiene dónde vivir desde la B6: `intervention.status = 'acknowledged'`,
`intervention.acknowledged_at` y el evento `InterventionAcknowledged`.

### 3.3 `close`

```json
{
  "schemaVersion": "1.0",
  "commandId": "uuid",
  "occurredAt": "2026-09-01T21:00:00Z",
  "ownerOperatorId": "uuid",
  "crmCaseId": "uuid",
  "outcome": "recuperado",
  "humanMinutes": 12,
  "note": "string | null"
}
```

**`outcome` obligatorio**, con exactamente cinco valores, idénticos a los que ya están congelados en
`data-model.md` §10 y en el `CHECK` de `intervention_outcome`:

```text
recuperado · replanificado · sin_respuesta · escalado · falso_positivo
```

**`humanMinutes` obligatorio, entero `>= 0`.** `WF-O03` lo pide textual —*"Registrar minutos
humanos"*— y la columna `intervention.human_minutes` ya existe con su `CHECK`. El candidato v0.1 no
tenía dónde ponerlos.

**`note` opcional.** ⚠️ Su transporte con datos reales queda **bloqueado por B7**, y no es un canal
lateral para mandar evidencia ni contenido sensible.

**No existe un comando de cierre sin outcome**, y no puede existir: `cerrar_intervencion()` escribe
estado y resultado en la misma transacción. El CRM no debe considerar cerrado el caso hasta recibir
confirmación exitosa.

**El cierre resuelve la señal en la misma transacción** — ✅ implementado.
`cerrar_intervencion()` escribe outcome, cierra la intervención y pasa la señal a `RESOLVED` con el
mismo `COMMIT`, y devuelve `senal_resuelta` para que el CRM sepa si el caso quedó cerrado de punta a
punta. Una señal ya resuelta o escalada **no se pisa**.

### 3.4 Owner y timestamps

**El operador que reconoce y cierra debe ser el mismo que abrió.** Una diferencia produce
`INVALID_OWNER_ASSERTION`. La reasignación **requiere un comando propio**, que no está en v1: no se
cambia el dueño de un caso de costado, dentro de un `acknowledge` o un `close`.

**`occurredAt` es la hora declarada por el CRM**, y se conserva para auditoría. **La hora canónica de
la transición es la del servidor de la Plataforma.** El CRM no puede aplicar backdating al lifecycle:
un `closed_at` que llegara desde afuera permitiría reescribir cuándo pasó algo que ya pasó.

---

## 4. Flujo C · Contexto académico · CRM → Plataforma

Endpoint candidato, autenticación con token de servicio y la lista de errores a distinguir
(estudiante inexistente, no asociado a la institución esperada, autorización insuficiente,
integración no disponible) se aceptan sin cambios.

### 4.1 La fuente correcta

El candidato v0.1 decía *"la misma lectura canónica utilizada por `UX02`"*, pero dibujaba un payload
**multi-materia**. `estado_de_materia()` (UX02) devuelve **una sola cursada**. La proyección que
tiene la forma pedida es **`estado_del_dia()`** (UX01), y es la fuente correcta.

### 4.2 Payload v0.2

```json
{
  "schemaVersion": "1.0",
  "asOf": "2026-09-01T21:00:00Z",
  "platformStudentId": "uuid",
  "subjects": [
    { "subjectId": "uuid", "name": "string" }
  ],
  "nextAction": {
    "actionId": "uuid",
    "type": "string",
    "title": "string"
  }
}
```

### 4.3 Qué se retiró, y por qué

**`subjects[].status`.** La Plataforma **no produce un estado de materia**, y la razón está escrita en
el código: sin Risk Engine nadie lo evaluó, y una versión anterior que devolvía `'Bajo control'` fijo
desde SQL le estaba afirmando al estudiante algo que nadie había verificado —el copy exacto que
`product.md` §13 prohíbe. Hoy es `null`, a propósito. Vuelve con `C01-021`.

**`nextAction.dueAt`.** Una `Action` **no tiene vencimiento**. Lo que vence es el `Commitment`, que es
otra entidad con lifecycle propio. Fusionarlos borraría la distinción entre *recomendar* y
*comprometerse*, que es la misma razón por la que [ADR-003](decisions.md#adr-003) se negó a fusionar
`Commitment` con `Checkpoint`. **Si el CRM necesita el compromiso vigente, se modela después como un
objeto separado.**

**`institutionId`** sale por la misma razón que en el flujo A.

### 4.4 ⚠️ Hallazgo nuevo: `assessments[]` no tiene fuente canónica

El candidato v0.1 pedía una lista de evaluaciones **a través de todas las materias**. Ninguna
proyección la produce hoy:

| Proyección | Qué da |
|---|---|
| `estado_del_dia()` | `materias[]` con nombre y último avance. **Sin evaluaciones** |
| `estado_de_materia()` | **Una** evaluación, de **una** cursada |

Queda **fuera de v0.2** hasta que se decida cómo se obtiene. Inventar una segunda lectura para el CRM
sería crear una segunda verdad sobre el mismo estudiante — el error que `VI.6` §8.3 prohíbe.

### 4.5 ✅ La proyección ya expone sus identificadores

`estado_del_dia()` devuelve `materias[].cursadaId` y `accion.id` desde la migración
`20260903020000_ids_en_estado_del_dia.sql` (§7.6). Era una ampliación, no una invención: los dos ids
existían en la base desde la B1.

⚠️ **`subjectId` es la cursada, no la materia del catálogo.** `cursadaId` es `course_enrollment.id`
—*esta materia para este estudiante*—, y es lo que aceptan `estado_de_materia()` y `GET /api/materia`.
`course.id` identifica la materia del catálogo, que es otra cosa: devolver ésa obligaría al CRM a
resolver la cursada por su cuenta, o sea a adivinar. **Hay comprobación contra Postgres de que el id
que viaja no es el del catálogo.**

Ninguno de los dos llega a la pantalla: `UX01` no los necesita, y hay guard de que la proyección no
los deja pasar.

---

## 5. Propiedad de las transiciones

La división del candidato v0.1 se acepta, **con la corrección de [ADR-034](decisions.md#adr-034)**.

| Produce | Quién |
|---|---|
| Creación de la señal, causa, severidad | **Plataforma** |
| **Que la señal requiere una persona** | **Plataforma**, desde `risk_rule.modo`. **No depende de que alguien la haya visto** |
| Validación de todos los comandos y transición efectiva | **Plataforma** |
| Registro canónico de intervención y outcome | **Plataforma** |
| Orden de la cola, owner, asignación | **CRM** |
| Que un operador se hizo cargo | **CRM**, por comando `acknowledge` |
| Ejecución humana, selección del outcome, timestamps operativos | **CRM** |

### 5.1 La secuencia, ya ejecutable

1. La Plataforma determina que la señal requiere una persona → **`OPEN → INTERVENTION_REQUIRED`**.
2. La Plataforma encola el evento A en el outbox y lo despacha. **Nada de esto mueve el dominio.**
3. El CRM acepta técnicamente (`202`). **No es `ACKNOWLEDGED` de dominio.**
4. El CRM asigna owner y envía `open`. La señal ya está en `INTERVENTION_REQUIRED`: **la función no
   rechaza.**
5. Cuando el operador se hace cargo, el CRM envía `acknowledge`. Mueve la **intervención**.
6. Al finalizar, el CRM envía `close` con `outcome` y `humanMinutes`.
7. La Plataforma valida y, en una transacción: outcome + intervención cerrada + señal `RESOLVED`.

**El CRM no envía nombres de estados internos como autoridad.** Envía hechos y comandos; la
Plataforma decide cómo se reflejan.

---

## 6. Outbox — dependencia obligatoria

El flujo A es push, y push sin outbox durable **pierde señales en silencio**. El ítem 5 de
[ADR-005](decisions.md#adr-005) estaba `DEFERRED` y [ADR-034](decisions.md#adr-034) lo reabre como
dependencia obligatoria de implementación:

persistencia transaccional del evento · reintentos · backoff con jitter · idempotencia ·
observabilidad · rotación de secretos · estados de entrega.

**El outbox no toca `risk_signal`.** Estado de transporte y estado de dominio son cosas distintas, y
mezclarlos es la decisión 2 de ADR-034 al revés.

---

## 7. Plan de migración no destructivo

✅ **§7.1, §7.2, §7.4, §7.5 y §7.6 ejecutados** el 2 de septiembre de 2026 — migraciones
`20260903000000_lifecycle_senal.sql`, `20260903010000_cierre_transaccional.sql` y
`20260903020000_ids_en_estado_del_dia.sql`.
⏸️ **§7.3 y §7.7 pendientes:** el primero espera el endpoint que escriba la columna; el segundo,
`C01-021`, porque sin reglas que produzcan señales el outbox no tiene qué transportar.

Regla que atraviesa los cinco pasos: **nada se borra, nada se reinterpreta en el lugar.** Una
migración aplicada no se edita; las funciones se reemplazan desde una migración nueva.

### 7.1 Lifecycle de `risk_signal` · ✅ hecho

| Qué | Cómo |
|---|---|
| Habilitar `OPEN → INTERVENTION_REQUIRED` | Agregar el destino en `riskSignalTransitions`. **Aditivo** |
| `ACKNOWLEDGED` legacy | **Se conserva** en el `CHECK`, y **conserva sus salidas** (`INTERVENTION_REQUIRED`, `EXPIRED`) para que las filas históricas puedan terminar su recorrido. Ninguna señal nueva entra ahí |
| `EXPIRED` sólo desde `OPEN` | Sacar `ACKNOWLEDGED` del `WHERE` de `senalesVencidas()`. Las filas históricas en `ACKNOWLEDGED` **dejan de expirarse solas**, que es más conservador, no menos |
| `risk_signal.acknowledged_at` | **No se borra.** Queda como dato histórico |
| `RiskSignalAcknowledged` | **No se borra** del Product Event Model. Se marca legacy: ya no se emite, y los eventos publicados siguen siendo válidos |

**Verificación:** un test que pruebe que una fila histórica en `ACKNOWLEDGED` sigue pudiendo llegar a
`RESOLVED`. Si la migración rompe el pasado, lo rompe ahí.

### 7.2 Reconocimiento de la intervención · ✅ hecho (no había nada que construir)

**No hay nada que construir.** `intervention.status = 'acknowledged'`, `acknowledged_at`,
`interventionTransitions` y `InterventionAcknowledged` existen desde la B6. El único trabajo es
**dejar de duplicarlo** en la señal.

### 7.3 `crmCaseId` · ⏸️ pendiente

`ALTER TABLE intervention ADD COLUMN crm_case_id UUID` — **nullable, sin FK** (es una identidad
externa, igual que `owner_operator_id`), con índice para reconciliar. Las filas existentes quedan en
`NULL`, que es la verdad: no vinieron del CRM.

### 7.4 Cierre en una transacción · ✅ hecho

`cerrar_intervencion()` pasa a resolver también la señal, desde una **migración nueva** con
`CREATE OR REPLACE`. La regla de `resolver_senal` —*`RESOLVED` exige una intervención con outcome*—
**no se relaja**: se cumple por construcción, porque el outcome se escribe en la misma transacción.
`resolver_senal()` se conserva para las señales que se resuelvan por otro camino.

### 7.5 Validación de owner y de comandos · ✅ hecho

`reconocer` y `cerrar` comparan el `ownerOperatorId` contra `intervention.owner_operator_id` y
devuelven `INVALID_OWNER_ASSERTION` si difieren. Es un rechazo nuevo, no un cambio de comportamiento
existente: hoy **nadie** manda ese campo.

### 7.6 Lectura del flujo C · ✅ hecho

`estado_del_dia()` expone `materias[].cursadaId` y `accion.id`, desde una migración nueva. **Aditivo**:
ninguna de las nueve superficies cambió, y los ids no llegan a la pantalla. Se hizo cuando el CRM
aceptó el diseño del flujo C y lo pidió explícitamente — antes habría sido construir contra un payload
en revisión.

### 7.7 Outbox · ⏸️ pendiente

Tabla nueva, escritura en la misma transacción que la transición que la origina, y un despachador.
Ningún objeto existente se modifica.

### 7.8 Orden sugerido

`7.1` → `7.2` → `7.4` → `7.3` → `7.5` → `7.6` → `7.7`. **Ejecutado:** 7.1, 7.2, 7.4, 7.5 y 7.6. El lifecycle primero, porque todo lo demás
asume la máquina corregida; el outbox último, porque es lo único que no bloquea a nadie.

---

## 8. Matriz de diferencias · v0.1 → v0.2

| # | Sección | v0.1 (CTO) | v0.2 (Plataforma) | Motivo |
|---|---|---|---|---|
| 1 | Lifecycle | `OPEN → ACKNOWLEDGED → INTERVENTION_REQUIRED` | **`OPEN → INTERVENTION_REQUIRED`** | La secuencia del candidato no era ejecutable. `C01-022`, [ADR-034](decisions.md#adr-034) |
| 2 | Lifecycle | `EXPIRED` desde `OPEN` y `ACKNOWLEDGED` | **Sólo desde `OPEN`** | `ACKNOWLEDGED` sale del recorrido vivo |
| 3 | Flujo A | `institutionId` en el payload | **Retirado** | La equivalencia de UUID de institución no está resuelta (`C01-001`) |
| 4 | Flujo A | *"severidad no congelable hasta `C01-021`"* | **Enum fijado** en v1 | Ya está congelado en el `CHECK` del schema. `C01-021` bloquea el asignador, no el vocabulario |
| 5 | Flujo A | `cause.code` implícitamente presente | **`code` nullable, `label` obligatorio** | `risk_rule_id` es nullable; `reason` es `NOT NULL` |
| 6 | Flujo B `open` | `playbookRef {id, version}` | **Retirado de v1** | `playbook_id` es FK a la tabla local vacía. `C01-044` |
| 7 | Flujo B | `crmCaseId` sin destino | **Aceptado**, con ampliación de schema | Es el dato de reconciliación; descartarlo en silencio es peor |
| 8 | Flujo B `close` | Sin minutos humanos | **`humanMinutes` obligatorio, `>= 0`** | `WF-O03`: *"Registrar minutos humanos"*. La columna ya existe |
| 9 | Flujo B `close` | Sin `note` | **`note` opcional**, bloqueada para datos reales por B7 | La columna existe; el riesgo de privacidad, también |
| 10 | Flujo B | Owner no verificado entre comandos | **Debe coincidir con quien abrió** → `INVALID_OWNER_ASSERTION` | No se cambia dueño de costado |
| 11 | Flujo B | `occurredAt` ambiguo | **Auditoría sí; hora canónica no** | Sin backdating del lifecycle |
| 12 | Flujo B | Cierre y resolución en pasos separados | **Una transacción** | Decisión 4 de ADR-034 |
| 13 | Flujo C | Fuente: `estado_de_materia()` (UX02) | **`estado_del_dia()`** (UX01) | UX02 devuelve una sola cursada; el payload es multi-materia |
| 14 | Flujo C | `subjects[].status` | **Retirado** | La Plataforma no produce estado de materia. `C01-021` |
| 15 | Flujo C | `nextAction.dueAt` | **Retirado** | Lo que vence es el `Commitment`, no la `Action` |
| 16 | Flujo C | `assessments[]` | **Fuera de v0.2** | ⚠️ **Ninguna proyección canónica lo produce.** Hallazgo nuevo |
| 17 | Flujo C | ids asumidos disponibles | **Requiere ampliar la lectura** | `estado_del_dia()` no expone `subjectId` ni `actionId` |
| 18 | Infra | Outbox mencionado al pasar | **Dependencia obligatoria** — ítem 5 de ADR-005, reabierto | Push sin outbox pierde señales en silencio |

**Aceptado sin cambios:** los 7 puntos de arquitectura, HMAC y headers, la tabla de respuestas de los
dos flujos, los siete códigos de error, `Idempotency-Key`, los cinco outcomes, versionado, seguridad,
observabilidad, privacidad, y la recomendación de §6 sobre playbook/SLA como **propuesta** de
`C01-044`.

---

## 9. Lo que sigue abierto

| Asunto | Owner | Efecto |
|---|---|---|
| `C01-021` — qué regla produce qué señal y con qué severidad | Risk owner | Sin esto **nada produce señales**, y el flujo A no tiene qué transportar |
| `C01-044` — playbooks, SLA, y si son canónicos del CRM | Product Operations | Devuelve `playbookRef` al contrato |
| `C01-036` — qué es un error *"reiterativo"* | **Psicopedagoga** | Umbral de una de las tres reglas cargadas |
| `C01-039` — `human_assignment` | CRM/Operations | Qué estudiantes ve cada operador |
| `C01-001` — equivalencia de identificadores de institución | Integration | Devuelve `institutionId` al payload, si corresponde |
| `assessments[]` del flujo C | Producto | Cómo se obtiene sin crear una segunda verdad |
| Reviewer `R1` y `WF-I01` | Producto | [ADR-033](decisions.md#adr-033) los dejó abiertos |
| **B7 / [ADR-006](decisions.md#adr-006)** | Legal + Producto | **Ningún flujo transporta datos reales hasta cerrarlo.** La aprobación técnica del contrato no es autorización de tratamiento |

---

## 10. Devolución del CRM · 2 de septiembre de 2026

> **`CRM ACCEPTS WITH REQUIRED CHANGES`** — sin objeciones de diseño. Lo que falta es construcción
> del lado del CRM y **dos acuerdos de forma**.

### 10.1 Lo que quedó cerrado de común acuerdo

**`institutionId` fuera del payload, probado contra su código.** El CRM no dijo *"debería andar"*:
verificó el camino entero —`students.platform_student_id` con índice único, `institution_id NOT NULL`
con FK a `institutions`, y `operator_assignments` para resolver cola y operadores— y confirmó que
**resuelve institución, cola y operador partiendo sólo de `platformStudentId`**.

`C01-001` sigue abierta y **deja de bloquear estos tres flujos**: ninguno depende de la equivalencia
de UUID de institución entre los dos sistemas.

**Ningún campo retirado se pidió de vuelta.** Ni `institutionId`, ni `playbookRef`, ni
`subjects[].status`, ni `nextAction.dueAt`, ni `assessments[]`. Los cinco quedan fuera de v1 **por
acuerdo**, no por imposición de un lado.

**El outbox es del emisor.** Coinciden: la durabilidad del push es responsabilidad de la Plataforma;
del lado del CRM lo equivalente es la recepción idempotente por `eventId`.

**`C01-039` está modelado del lado del CRM** (`operator_assignments` con `operator_id`, `level`,
`shift`, `active`, más ruteo por turno). Falta la política, no la estructura.

### 10.2 Dos acuerdos de forma pendientes

**1 · El envelope de error.** El CRM propone `{ "error": { "code", "message" }, "correlationId" }`;
hoy emite `{ "error": "<code>", "message": "..." }` plano.

**Ninguno de los dos emite hoy lo que el contrato necesita, y nadie tiene que migrar nada viejo.** Las
nueve rutas de estudiante de la Plataforma devuelven `{ error: "No autenticado" }` — plano, y con
**prosa en castellano**, porque del otro lado hay una persona. Eso está bien y se queda como está.

`/api/service/v1/*` es una superficie nueva con otro consumidor —una máquina—, así que el envelope
anidado **se adopta ahí y en ningún otro lado**. Propuesta: aceptar la forma del CRM tal cual.

**2 · Los dos secretos nuevos y su rotación.** Uno para el HMAC del flujo A (Plataforma → CRM) y otro
Bearer para B y C (CRM → Plataforma), **sin reusar** el de `/authorize` ni el de `POST /api/reloj`.

⚠️ **Hoy no hay rotación de secretos en ninguno de los dos sistemas.** Del lado del CRM es una env var
única sin versionado ni overlap; del lado de la Plataforma es el ítem 5 de
[ADR-005](decisions.md#adr-005), que sigue `DEFERRED` y que
[ADR-034](decisions.md#adr-034) ya reabrió por el outbox. **Es el mismo trabajo**, y conviene
resolverlo una vez.

### 10.3 ⚠️ Hallazgo: `cause.code` no tiene vocabulario acordado

El fixture del CRM manda `"code": "reiterative_error"`. **Ese valor no existe de este lado.** Hay dos
candidatos reales y ninguno es ése:

| Fuente | Valores |
|---|---|
| `risk_rule.canonical_id` | `HP0-06-1`, `HP0-06-2`, `HP0-06-3` |
| `risk_signal.signal_type` | `error_reiterado`, `sin_avance_pese_a_devoluciones`, `factores_subjetivos` |

**Propuesta: `cause.code` = `risk_rule.canonical_id`.** Es el identificador **versionado**: cambiar un
umbral carga una versión nueva de la regla y el código sigue siendo trazable a la fuente profesional.
El texto para humanos ya viaja en `cause.label`, así que el `code` no tiene que ser legible.

`signal_type` es `TEXT` libre, no un enum: elegirlo dejaría el contrato **sin vocabulario cerrado que
ofrecer** hasta que `C01-021` diga cuáles son las situaciones.

Sin acordar esto, **los fixtures compartidos no coinciden**.

### 10.4 Una implicancia para el outbox

El CRM define `422 UNRESOLVABLE_STUDENT` para un `platformStudentId` que no puede resolver, y su tabla
lo marca **no reintentable**. El outbox de §7.7 tiene que distinguirlo de un `5xx`: un estudiante que
el CRM no conoce no se arregla insistiendo, y una cola que reintenta eso para siempre **se tapa sola**
y deja de entregar las señales que sí podría entregar.

### 10.5 Estado por lado

| | Plataforma | CRM |
|---|---|---|
| Lifecycle y cierre transaccional | ✅ construido | — |
| Identificadores del flujo C | ✅ construido | — |
| Verificación HMAC / anti-replay | ⏸️ emisor | 🔴 a construir |
| Idempotencia entrante (`webhook_events`) | — | 🔴 a construir |
| Cliente saliente + reintentos | — | 🔴 a construir |
| Entidad de caso con owner fijo | ✅ es `intervention` | 🔴 a construir |
| `crmCaseId` | ⏸️ §7.3 | 🔴 a construir |
| Outbox | ⏸️ §7.7 | — |
| Secretos y rotación | 🔴 acuerdo | 🔴 acuerdo |
| Envelope de error | 🔴 acuerdo | 🔴 acuerdo |

**Bloqueos externos, iguales para los dos:** `C01-021` —sin reglas el flujo A no tiene qué
transportar— y **B7 / [ADR-006](decisions.md#adr-006)**, que el CRM también reconoce: *"la aprobación
técnica ≠ autorización de datos"*.
