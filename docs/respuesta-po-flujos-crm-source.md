# Fuente — Respuesta del Product Owner · ADR-041, ADR-042 y ADR-043

> ⚠️ **Documento fuente. No se edita, ni los tipeos.** Es la respuesta literal del Product Owner del
> 4 de septiembre de 2026, recibida por escrito. Lo que se construya cita **esta** fuente, no una
> paráfrasis. Su lectura interpretada vive en [ADR-041](decisions.md#adr-041),
> [ADR-042](decisions.md#adr-042) y [ADR-043](decisions.md#adr-043); si el ADR y esta fuente
> discrepan, **manda la fuente**.
>
> **Contexto:** responde al brief [`agenda-decisiones-po-crm.md`](agenda-decisiones-po-crm.md), que a
> su vez sale de las dos rondas con el CRM ([v0.1](respuesta-crm-flujos-d-e-v0.1.md) ·
> [v0.2](respuesta-crm-flujos-d-e-v0.2.md)).

---

# Respuesta del Product Owner · ADR-041, ADR-042 y ADR-043

**Fecha:** 4 de septiembre de 2026
**Estado:** decisiones ratificadas

## ADR-041 · Actividad facturable

**Decisión: opción A.**

Se aprueba como conjunto versionado de eventos facturables:

* `EvidenceSubmitted`
* `ProtocolStepCompleted`
* `ProgressUpdated`
* `RescueSucceeded`

`CourseViewed`, `ActionAccepted` y `CommitmentConfirmed` no cuentan como actividad facturable: mirar, aceptar o comprometerse no equivale a producir.

El conjunto de eventos facturables pasa a formar parte del contrato Plataforma–CRM. Agregar, quitar o cambiar un evento facturable exige una nueva versión acordada entre ambas partes; no puede modificarse únicamente mediante un commit.

Esta restricción no alcanza al catálogo general: la Plataforma puede agregar eventos nuevos no facturables sin modificar el contrato.

La decisión no define precios ni habilita la transmisión de eventos reales mientras ADR-006 permanezca abierto.

## ADR-042 · WhatsApp y consentimiento

**Decisión: opción A.**

Se aprueba un tramo de onboarding para capturar el número de WhatsApp y el consentimiento explícito del estudiante.

### Ubicación

El orden será:

1. El CRM responde `authorized: true`.
2. La Plataforma presenta el tramo de WhatsApp y consentimiento.
3. Continúa la orientación mínima.
4. Si existe información académica suficiente, el estudiante entra a `HOY`.
5. Si todavía no existen materias cargadas, ve un estado de preparación académica; no entra al vacío actual de `HOY`.

### Reglas de producto

* El consentimiento debe ser explícito, específico y no premarcado.
* El estudiante puede rechazar u omitir WhatsApp sin perder el acceso a la Plataforma; en ese caso no recibe acompañamiento por ese canal.
* La redacción legal definitiva, retención, base jurídica y tratamiento de datos reales quedan subordinados a ADR-006.
* Mientras ADR-006 permanezca abierto, todo se construye y prueba exclusivamente con identidades y teléfonos sintéticos.
* La confirmación sólo puede afirmar: **“Guardamos tu número”** o **“Recibimos tu solicitud”**.
* Nunca debe afirmar que el CRM vinculó el número, que existe un operador asignado o que alguien va a escribirle.

### Revocación

Se aprueba un acceso posterior denominado **“WhatsApp y privacidad”**, disponible desde la cuenta o desde un acceso visible equivalente.

Desde allí el estudiante puede:

* consultar si proporcionó un número;
* reemplazarlo;
* retirar el consentimiento;
* solicitar su desvinculación.

Al revocar, la Plataforma registra la solicitud y emite E′ cuando la integración esté habilitada. Hasta que exista confirmación observable del CRM, la interfaz dice **“Recibimos tu solicitud de desvinculación”**, no “WhatsApp desvinculado”.

### Estudiante sin materias

El estado aprobado es:

> **Estamos preparando tu información académica.**
> Todavía no contamos con información suficiente para recomendarte una acción. Te avisaremos cuando tu recorrido esté listo.

No debe mostrarse “no hay una acción recomendada”, porque el sistema todavía no está en condiciones de evaluar eso.

## ADR-043 · Orden y smoke test

**Decisión: sí a ambas preguntas.**

Cuando ADR-035 permita descongelar la integración:

1. Los flujos D y E/E′ se implementan antes que A, B y C.
2. Se ejecuta un smoke test entre Plataforma y CRM con un estudiante completamente sintético.

D y E/E′ pueden prepararse en paralelo. Si la capacidad obliga a secuenciarlos, E/E′ va primero porque habilita la operación de acompañamiento; D va inmediatamente después porque habilita la medición facturable.

El smoke test se realizará al comenzar efectivamente el tramo de integración previsto por ADR-035, no ahora. En ese momento deberá incluir:

* secreto compartido exclusivo de desarrollo;
* firma y verificación real de mensajes;
* outbox mínimo durable;
* vinculación y desvinculación de un teléfono sintético;
* emisión de al menos un evento facturable;
* reintento e idempotencia;
* evidencia de recepción en ambos sistemas.

No se utilizarán datos personales reales y el smoke test no levanta ADR-006.

## Alcance de esta aprobación

Esta respuesta autoriza:

* cerrar ADR-041, ADR-042 y ADR-043;
* actualizar su trazabilidad y el roadmap;
* incorporar las decisiones al backlog correspondiente.

No autoriza adelantar ahora la integración CRM, provisionar secretos productivos, transmitir datos reales ni alterar la prioridad vigente del Track B. ADR-035 y ADR-006 permanecen plenamente vigentes.

Primero se termina y verifica el loop actual del MVP de Plataforma. Después se ejecutará este trabajo en el orden aprobado.
