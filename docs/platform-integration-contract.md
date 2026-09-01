# Achieve — Contrato de integración Plataforma ↔ CRM

**Documento:** `docs/platform-integration-contract.md`
**Rol:** owner canónico del contrato máquina-a-máquina actualmente disponible entre Plataforma y CRM.
**Última verificación documental:** 28 de agosto de 2026
**Estado:** el endpoint de autorización de §1 existe; los flujos de §2 son contexto futuro sin contrato implementable.
**Última corrección:** 1 de septiembre de 2026 — §2.1 y §2.2, por [ADR-033](decisions.md#adr-033). **§1 no se tocó.**

> Este documento registra un contrato externo. No acepta por sí mismo [ADR-005](decisions.md#adr-005),
> no habilita datos reales mientras [ADR-006](decisions.md#adr-006) siga `PENDING` y no cierra por
> completo `C01-039`/`C01-040`: solamente congela el flujo de autorización que el CRM declara disponible.

---

> Para el equipo que construye la **Plataforma del estudiante** (Achieve_Platform). Describe lo que el
> CRM de Achieve **expone hoy** y cómo consumirlo. Es un contrato **máquina-a-máquina**. Todo lo que está
> fuera de la sección "Lo que existe hoy" es contexto futuro (no hay que implementarlo todavía).

## 0. Panorama

- Son **dos sistemas separados**: el **CRM** (interno, de Achieve) y la **Plataforma** (donde estudian los
  alumnos). Cada uno tiene su **propio proyecto Supabase** (ambos en `us-east-1`). **Nadie toca la base del
  otro**: se comunican **solo por HTTP** con contratos versionados.
- La **identidad canónica** de un estudiante es su **`platformStudentId`**: un **UUID único** que genera la
  Plataforma y que el CRM guarda como llave. Debe ser estable (el mismo alumno = el mismo UUID siempre).

## 1. Lo que EXISTE HOY: endpoint de Autorización (Plataforma → CRM)

**Único endpoint implementado y disponible hoy.** Sirve para una sola cosa: cuando un alumno se registra en
la Plataforma, ésta le **pregunta al CRM** si ese alumno está **autorizado** a usar el servicio y **de qué
institución** es. **El CRM define la respuesta; la Plataforma la hace cumplir** (si el CRM dice que no, la
Plataforma no lo deja entrar).

### 1.1. Endpoint

```
POST /api/service/v1/authorize
```

- **Base URL producción:** `https://crm.achieve.com.ar`
- **Base URL desarrollo:** `http://localhost:3001`
- **URL completa (prod):** `https://crm.achieve.com.ar/api/service/v1/authorize`

### 1.2. Autenticación

Cabecera obligatoria, con un **secreto compartido** (NO es un JWT de usuario; es un secreto máquina-a-máquina
que se acuerda por fuera y se guarda en variables de entorno de la Plataforma):

```
Authorization: Bearer <PLATFORM_SHARED_SECRET>
Content-Type: application/json
```

> El valor de `PLATFORM_SHARED_SECRET` se pasa por un canal seguro, **no** va en este documento ni en el
> código. Si falta o es incorrecto → `401`.

### 1.3. Request (body JSON)

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `email` | string (email válido) | **sí** | Email **institucional** del alumno (el que la institución cargó en su padrón). |
| `platformStudentId` | string (UUID v4) | **sí** | Identidad canónica del alumno en la Plataforma. Único y estable. |
| `firstName` | string | no | Nombre. **Fallback**: si el alumno está en el padrón, el CRM usa el dato del padrón; esto se usa solo si el padrón no lo trae. |
| `lastName` | string | no | Apellido/s. Mismo criterio de fallback. |
| `studentNumber` | string | no | Legajo/matrícula. Mismo criterio de fallback. |

Ejemplo de body:
```json
{
  "email": "ana@uni.edu",
  "platformStudentId": "11111111-1111-1111-1111-111111111111",
  "firstName": "Ana",
  "lastName": "Pérez",
  "studentNumber": "L-1234"
}
```

### 1.4. Responses

**Autorizado — `200 OK`:**
```json
{ "authorized": true, "institutionId": "<uuid>", "studentId": "<uuid>" }
```
- `institutionId`: la institución (cliente del CRM) a la que pertenece el alumno.
- `studentId`: el id del estudiante **en el CRM** (distinto del `platformStudentId`). Guardalo si te sirve
  para trazabilidad, pero la llave que ambos sistemas comparten es `platformStudentId`.

**NO autorizado — `200 OK`** (la petición fue válida; la respuesta es un "no"):
```json
{ "authorized": false, "reason": "not_in_roster" }
```
Valores posibles de `reason`:

| `reason` | Qué significa | Qué debería hacer la Plataforma |
|---|---|---|
| `not_in_roster` | El email no está en el padrón de **ninguna** institución. | No dar acceso. Mensaje tipo "tu institución no te tiene habilitado". |
| `institution_terminated` | El alumno está en el padrón, pero el **contrato de su institución está dado de baja**. | No dar acceso. Es un caso de institución que dejó de ser cliente. |
| `ambiguous` | El mismo email aparece en el padrón **activo de más de una institución**. El CRM **no adivina**. | No dar acceso. Caso raro; requiere resolución manual (avisar a Achieve). |

**Errores:**

| HTTP | Body | Causa |
|---|---|---|
| `401` | `{ "error": "unauthorized" }` | Falta el header `Authorization` o el secreto es incorrecto. |
| `400` | `{ "error": "invalid_request", "details": { … } }` | Body mal formado (ej. `email` no es un email, `platformStudentId` no es un UUID). `details` trae el detalle por campo. |

### 1.5. Reglas de comportamiento (importantes)

1. **Autoriza SOLO por padrón.** El CRM matchea el `email` contra las entradas **activas** del padrón. No
   hay "autorización por dominio de email": tener `@uni.edu` no alcanza; el email tiene que estar cargado.
2. **Match case-insensitive.** `ANA@UNI.EDU` y `ana@uni.edu` son el mismo.
3. **Idempotente por `platformStudentId`.** Si llamás dos veces con el mismo `platformStudentId`, el
   resultado es el mismo y **no se duplica** el estudiante en el CRM. → Es **seguro reintentar** ante
   errores de red o timeouts.
4. **Efecto de un `authorized: true`:** el CRM **crea o vincula** al estudiante en su base (registra el
   `platformStudentId` + la institución). Por eso este endpoint **no es de solo lectura**: la primera
   autorización exitosa da de alta al alumno en el CRM.

### 1.6. Cuándo llamarlo

- En el **registro** del alumno en la Plataforma (antes de darle acceso), o cuando necesites revalidar su
  autorización. La Plataforma **hace cumplir** la decisión del CRM.

### 1.7. Ejemplos (curl)

```bash
# 1) Alumno autorizado (institución activa) → 200 authorized:true
curl -s -X POST https://crm.achieve.com.ar/api/service/v1/authorize \
  -H "Authorization: Bearer $PLATFORM_SHARED_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@uni.edu","platformStudentId":"11111111-1111-1111-1111-111111111111","firstName":"Ana"}'
# → {"authorized":true,"institutionId":"…","studentId":"…"}

# 2) Institución dada de baja → 200 authorized:false
#   → {"authorized":false,"reason":"institution_terminated"}

# 3) Email que no está en ningún padrón → 200 authorized:false
#   → {"authorized":false,"reason":"not_in_roster"}

# 4) Secreto incorrecto → 401
#   → {"error":"unauthorized"}
```

## 2. Lo que NO existe todavía (contexto futuro — NO implementar ahora)

Se listan solo para que tengan el mapa completo. **No hay que construir nada de esto hoy.**

- **Flujo 2 — Actividad (Plataforma → CRM):** más adelante la Plataforma le va a **empujar eventos de
  actividad** del alumno al CRM (para medir alumnos activos y facturar). Serán **webhooks firmados (HMAC)**,
  **idempotentes por un `event_id`**. El contrato exacto se define cuando se construya (del lado CRM).
- **Flujo 3 — Contexto en vivo (CRM → Plataforma):** el CRM le va a **pedir a la Plataforma** el progreso
  del alumno (materias, evaluaciones, próxima acción) para mostrárselo al operador. Esto lo tiene que
  **exponer la Plataforma** como una **API de servicio** (autenticada con token de servicio, no con token de
  alumno). Se acordará el contrato cuando toque.

## 2.1 Contrato v2 — propuesta · [ADR-003](decisions.md#adr-003), 1 de septiembre de 2026

> **Es una propuesta para el CTO, no un contrato acordado.** ADR-003 decidió el reparto de
> responsabilidades; el versionado del contrato lo lleva el CTO, con OpenAPI y/o esquemas de eventos
> versionados, compatibilidad explícita y registro de cambios.

### Qué decidió ADR-003, y qué implica para el contrato

| Quién | Rol |
|---|---|
| **Achieve Plataforma** | **Fuente canónica** de compromisos, evidencias, lifecycle, readiness e intervenciones |
| **Dashboard_Achieve** | **Superficie operativa** que consume esos contratos |

Los dos codebases **siguen separados**; lo que converge es el dominio. La consecuencia directa para
el contrato: **Dashboard no escribe dominio de Achieve**. Lee, muestra y opera; los hechos los
produce Achieve.

> **Cómo se cumple esa frase ahora que el operador trabaja en el CRM**
> ([ADR-033](decisions.md#adr-033)). El CRM **no escribe: envía comandos autenticados**. La
> Plataforma los valida contra sus máquinas de estados y produce el hecho canónico. Sin esa
> distinción, esta frase y la propiedad canónica de `Intervention` que declaró ADR-003 no podían ser
> ciertas al mismo tiempo, porque la intervención y su outcome ocurren en el otro sistema. Con ella,
> las dos se cumplen literales: sin DB compartida y sin saltear el lifecycle.

### La tabla de reconciliación, completa

Las filas que ADR-003 dejaba *"a confirmar"* quedaron resueltas. **La fila que importa es la de
`Checkpoint`**, que parecía ser `Commitment` + `Evidence` fusionados y **no lo es**:

| Concepto | Definición canónica | En Dashboard hoy | Estado |
|---|---|---|---|
| `Commitment` | **Obligación concreta acordada con el estudiante** | — | Canónico en Achieve |
| `Checkpoint` | **Momento planificado de revisión o control** | `checkpoints` | Concepto propio de Dashboard |
| `Evidence` | **Prueba presentada para demostrar el cumplimiento** | — | Canónico en Achieve |
| `CheckpointResult` | **Resultado de revisar uno o más compromisos y evidencias** | `checkpoint_validations` (parcial) | A construir |
| Operador | Persona que acompaña | `coaches` | Mismo rol — confirmar permisos |
| Estudiante | Titular de los datos | `users` | Mismo |
| `human_assignment` | A qué operador está asignado | `users.coach_id` | Mismo |
| `Intervention` | Acción del operador con playbook, SLA y outcome | `coach_notes` / `activities` | **Parcial:** una nota no tiene SLA ni outcome |
| `ProgressEntry` / Bitácora | Historial derivado de hechos | `achieve_daily_logs` | **Parcial:** el log es diario; la Bitácora se agrupa por ciclo |
| — | — | `challenges`, `streaks`, `payments`, `leads` | **Sin equivalente**, y no se importan: rachas y puntos son gamificación, que el spec de Achieve excluye |

**Un `Checkpoint` puede** revisar un compromiso, solicitar una evidencia y producir un resultado —
pero son entidades distintas con lifecycle propio. Fusionarlas borraría el primer eslabón de
*enviar no es suficiencia, suficiencia no es validación, validación no es dominio*.

### Los tres flujos de v2

| # | Flujo | Dirección | Estado |
|---|---|---|---|
| 1 | **Autorización de padrón** | Plataforma → CRM | ✅ **v1, vigente.** §1 de este documento |
| 2 | **Actividad** | Plataforma → CRM | ⬜ a definir. Webhooks firmados (HMAC), idempotentes por `event_id` |
| 3 | **Contexto vivo** | CRM → Plataforma | ⬜ a definir. API de servicio, token de servicio |
| **4** | **Comandos de intervención y outcome** | **CRM → Plataforma** | ⬜ **Falta en esta lista, y hace falta.** Ver §2.2 |

> ⚠️ **Los tres flujos originales son dos de lectura y uno de alta de estudiante: ninguno permite al
> CRM devolverle a la Plataforma un hecho de intervención.** Es el hallazgo de
> [ADR-033](decisions.md#adr-033), y se detalla en §2.2.

**Propuesta para el flujo 2 — actividad.** Que transporte **los eventos del Product Event Model que
ya existen**, no un formato nuevo: el catálogo está declarado en `lib/domain/product-events.ts` con
sus niveles ([ADR-027](decisions.md#adr-027)). Sugerencia concreta: **sólo los de nivel `NEGOCIO`**.
Los de `TRANSICION` son trazabilidad interna del lifecycle y empujarlos al CRM sería exportar ruido.

**Propuesta para el flujo 3 — contexto vivo.** Que devuelva **la misma proyección que ya consume
`UX02`**, que es exactamente *"materias, evaluaciones, próxima acción"*: `estado_de_materia()` ya la
compone en una sola lectura consistente. Construir una segunda vista para el operador crearía dos
verdades sobre el mismo estudiante — el mismo error que `VI.6` §8.3 prohíbe para el historial.

⚠️ **Ninguno de los dos se implementa hasta que el CTO versione el contrato.** Y ninguno transporta
datos de una persona real mientras [ADR-006](decisions.md#adr-006) siga sin dictamen legal.

### 2.2 Lo que la Fase B6 necesita del contrato v2 — 1 de septiembre de 2026

> **Hay candidato.** El CTO respondió con un contrato candidato el 1 de septiembre de 2026, y la
> Plataforma lo revisó y corrigió: [`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md).
> Ese documento es ahora el owner de los tres flujos, con su matriz de diferencias y su plan de
> migración. Esta sección queda como el **requerimiento** que lo originó. **Ninguno de los dos está
> implementado**, y §1 de este documento sigue siendo el único contrato vigente.

**Esto no es una propuesta de contrato: es la lista de lo que Achieve no puede saber solo.** El
dominio de riesgo e intervención está construido ([ADR-032](decisions.md#adr-032)) y **no está
esperando a este documento**. Endpoint, payload, nombres de campo, autenticación y SLA **los define
el CTO**: proponerlos acá obligaría a rehacerlos después, que es exactamente lo que ADR-003 quiso
evitar.

> **Reemplaza a la versión del 2 de septiembre de 2026**, que pedía un *directorio de operadores*.
> Esa versión partía de un supuesto que [ADR-033](decisions.md#adr-033) corrigió: que existirían
> superficies de operador dentro de la Plataforma. **No existen y no deben existir.** Lo que hace
> falta no es poder preguntarle al CRM quién es un operador — es un canal por el que el CRM le
> devuelva hechos a la Plataforma.

#### 1 · La frontera confirmada

El CTO confirmó, y coincide con el spec fuente (§8 *"Wireframes low-fi — Operador / CRM"*, Parte II
§18.1):

- El operador **no interactúa con la Plataforma** y **nunca inicia sesión** en ella.
- **Todas** las superficies de operador pertenecen al CRM.
- A la Plataforma acceden **únicamente los estudiantes autorizados por el CRM**, por §1.

Consecuencia para el contrato: **la Plataforma no autentica personas del lado operativo. Autentica al
CRM como sistema.** La identidad del operador viaja **asertada por el CRM** dentro del comando;
`intervention.owner_operator_id` es `UUID NOT NULL` **sin FK**, y así se queda.

#### 2 · Los tres flujos que faltan

Descritos como **requerimiento**: qué necesita saber cada lado y qué garantías necesita. Nada de
esto fija un endpoint.

**Flujo A — Señal que requiere intervención humana · Plataforma → CRM**

| | |
|---|---|
| **Qué necesita saber el CRM** | Que existe una señal que pide una persona, sobre qué estudiante, **con su causa** y su severidad |
| **Por qué la causa es obligatoria** | `WF-O01` es explícito: *"cada caso muestra causa y playbook sugerido"*, y el spec prohíbe *"un score opaco como única salida"* |
| **Garantías** | Idempotencia por identificador de evento; que un reenvío no duplique el caso en la cola |
| **Abierto** | Si es push (webhook firmado, la forma que anticipa el flujo 2) o pull (el CRM consulta la cola). El spec §18.1 admite las dos |
| **Qué NO viaja** | El orden de la cola. *"No ordenar por último mensaje"* es una regla del CRM, y priorizar la cartera es suyo |

**Flujo B — Comandos de intervención y outcome · CRM → Plataforma · ⚠️ no existe hoy**

| | |
|---|---|
| **Qué necesita la Plataforma** | Que el CRM le informe tres hechos: que una intervención **se abrió** con un dueño, que alguien **se hizo cargo**, y que **se cerró con su resultado** |
| **Por qué es indispensable** | ADR-003 hace a la Plataforma fuente canónica de intervenciones, y el operador trabaja en el CRM. **Sin este canal el circuito de la B6 no puede cerrarse nunca**, porque el eslabón que lo cierra ocurre en el otro sistema |
| **Qué hay del lado de Achieve** | Los comandos **ya existen y son transaccionales**: `abrir_intervencion()`, `reconocer` y `cerrar_intervencion()`. No les falta lógica; les falta un Controller y este contrato |
| **Garantías** | Autenticación de servicio; idempotencia (cada escritor ya tiene su clave); que el cierre traiga **su outcome en el mismo comando** — cerrar sin resultado no es un camino que exista del lado de Achieve, y el contrato no debería poder pedirlo |
| **Vocabulario congelado** | Los cinco outcomes (`recuperado`, `replanificado`, `sin_respuesta`, `escalado`, `falso_positivo`) los posee la Plataforma: `data-model.md` §10 |
| **Abierto** | **Quién produce cada transición entre `OPEN`, `ACKNOWLEDGED` e `INTERVENTION_REQUIRED`.** *"Un operador la vio"* es un hecho del CRM; *"esto necesita una persona"* lo declara `risk_rule.modo = 'HUMANA'`, que es configuración de la Plataforma. Es `C01-022` |

**Flujo C — Lectura de contexto académico · CRM → Plataforma**

| | |
|---|---|
| **Qué necesita el CRM** | El contexto que `WF-O02` exige: *"materias, evaluaciones, próxima acción"*, en menos de 10 segundos de lectura humana |
| **Propuesta** | **La misma proyección que ya consume `UX02`**. `estado_de_materia()` la compone en una sola lectura consistente. Construir una segunda vista crearía dos verdades sobre el mismo estudiante — el error que `VI.6` §8.3 prohíbe para el historial |
| **Garantías** | Token de servicio, no token de alumno |

#### 3 · Lo que este contrato no puede saltear

⚠️ **Cualquier contrato que transporte notas, causas detalladas, evidencias o información individual
de un estudiante queda condicionado por la Fase B7**: consentimiento, minimización, retención y
borrado, bajo [ADR-006](decisions.md#adr-006). Que un flujo esté especificado no lo habilita a
transportar datos de una persona real.

Lo que se transporte debe ser **el mínimo que hace posible la intervención**, no todo lo que la
Plataforma sabe. La matriz de visibilidad (`product.md` §4.1) sigue rigiendo del lado de Achieve.

#### 4 · Qué sigue gateado, y qué no

| Bloqueado | Por qué |
|---|---|
| El flujo B, y con él el cierre real del circuito | No existe el contrato. **Es lo único que la Fase B6 espera de afuera** |
| `human_assignment` — qué estudiantes ve cada operador | `C01-039`. La matriz de visibilidad dice *"sus asignados"*, y quién es asignado a quién vive en el CRM |

**Lo que NO está bloqueado, y conviene decirlo:** el circuito cerrado entero —señal con causa,
intervención con dueño, outcome obligatorio para cerrar, auditoría— ya corre y está probado contra
Postgres. Y **el mecanismo de autenticación tampoco es el bloqueo**: la persona nunca se autentica
contra la Plataforma, y el patrón de secreto de servicio ya corre acá en `POST /api/reloj`.

#### 5 · El componente transitorio

`DirectorioDeOperadores` sigue en el código, **superado en dirección y pendiente de retiro**
([ADR-033](decisions.md#adr-033)): preguntarle al CRM *"¿existe este operador?"* sobre una identidad
que el propio CRM asertó en un comando autenticado es pedirle a un emisor que valide su propia
afirmación. Se retira cuando exista un contrato aceptado.

Hasta entonces es lo único que hace que `intervention.owner_verified = false` sea un hecho registrado
y no un descuido. **Su significado no se redefine en el lugar:** cuando el contrato llegue, columna,
valor o versión nuevos que preserven las filas históricas.

#### 6 · Ownership por eslabón

| Eslabón | Lo produce | Canónico en |
|---|---|---|
| **causa** | Plataforma | Plataforma |
| **severidad** | Plataforma (`risk_rule`, `C01-021` abierta) | Plataforma |
| *orden de la cola* | CRM | CRM |
| **owner** | CRM | CRM; la Plataforma guarda la referencia |
| **playbook** | ⬜ **Propuesta pendiente de `C01-044`** — el spec pone el Intervention Engine del lado del CRM (§15.3, §21), pero **no está decidido** | ⬜ |
| **SLA** | ⬜ Ídem: parte del playbook | ⬜ |
| **intervención** | CRM la ejecuta | **Plataforma** |
| **outcome** | CRM lo elige; el vocabulario es de la Plataforma | **Plataforma** |

## 3. Checklist para la Plataforma (lo de HOY)

- [ ] Guardar `PLATFORM_SHARED_SECRET` en variables de entorno (nunca hardcodear).
- [ ] Generar un `platformStudentId` (UUID) **estable y único** por alumno.
- [ ] En el registro, llamar a `POST /api/service/v1/authorize` con `email` + `platformStudentId`.
- [ ] Dar acceso solo si `authorized: true`.
- [ ] Manejar los 3 `reason` de rechazo con mensajes claros al alumno.
- [ ] Tratar `401`/`400` como errores de configuración/bug (no mostrárselos al alumno).
- [ ] Reintentar con backoff ante errores de red / 5xx (es idempotente).
