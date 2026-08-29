# Achieve — Contrato de integración Plataforma ↔ CRM

**Documento:** `docs/platform-integration-contract.md`
**Rol:** owner canónico del contrato máquina-a-máquina actualmente disponible entre Plataforma y CRM.
**Última verificación documental:** 28 de agosto de 2026
**Estado:** el endpoint de autorización de §1 existe; los flujos de §2 son contexto futuro sin contrato implementable.

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

## 3. Checklist para la Plataforma (lo de HOY)

- [ ] Guardar `PLATFORM_SHARED_SECRET` en variables de entorno (nunca hardcodear).
- [ ] Generar un `platformStudentId` (UUID) **estable y único** por alumno.
- [ ] En el registro, llamar a `POST /api/service/v1/authorize` con `email` + `platformStudentId`.
- [ ] Dar acceso solo si `authorized: true`.
- [ ] Manejar los 3 `reason` de rechazo con mensajes claros al alumno.
- [ ] Tratar `401`/`400` como errores de configuración/bug (no mostrárselos al alumno).
- [ ] Reintentar con backoff ante errores de red / 5xx (es idempotente).
