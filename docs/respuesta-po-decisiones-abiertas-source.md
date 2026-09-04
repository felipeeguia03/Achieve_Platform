# Fuente — Respuesta del Product Owner · decisiones abiertas

> ⚠️ **Documento fuente. No se edita, ni los tipeos.** Es la respuesta literal del Product Owner del
> 4 de septiembre de 2026. Su lectura interpretada vive en [ADR-044](decisions.md#adr-044) …
> [ADR-048](decisions.md#adr-048); **si un ADR y esta fuente discrepan, manda la fuente**.
>
> **Contexto:** responde a [`decisiones-abiertas.md`](decisiones-abiertas.md).

---

# Respuesta del Product Owner · decisiones abiertas

**Fecha:** 4 de septiembre de 2026
**Fuente:** respuesta escrita del Product Owner
**Alcance:** cierra cinco decisiones. Las restantes continúan abiertas con sus responsables actuales.

## 1. Copy de la reflexión obligatoria

**Decisión: opción A.**

Se aprueba la copy del fixture:

> **Contanos cómo te fue (requerido)**

`Contanos` debe eliminarse de la lista de términos prohibidos del guard porque es voseo correcto. El cambio debe ser específico: no se afloja el resto del control ni se modifican las otras palabras prohibidas.

## 2. Superficie para escribir la reflexión

La reflexión se escribe **dentro de la pantalla de Evidencia**, como parte de la misma entrega.

### Comportamiento

* Si la reflexión es obligatoria, el campo aparece desplegado y visible antes del CTA principal.
* Si es opcional, puede permanecer contraído detrás de una acción secundaria.
* El campo utiliza la copy **“Contanos cómo te fue”**.
* El CTA principal sigue siendo **“Enviar evidencia”**.
* Si la reflexión es obligatoria y está vacía, la entrega no se ejecuta y se muestra:

> **Contanos cómo te fue para enviar la evidencia.**

* La reflexión y la evidencia forman parte de la misma intención del estudiante. No se crea un flujo independiente ni una pantalla nueva.
* Se reutiliza la composición visual existente de Evidencia y el fixture aprobado. No hace falta esperar un rediseño high-fidelity.

Esta respuesta autoriza incorporar la superficie al roadmap e implementarla sobre `components/screens/evidencia.tsx`, respetando las validaciones ya existentes en el servidor.

## 3. `C01-010` · Elegibilidad de renegociación

Una renegociación es elegible cuando se cumplen todas estas condiciones:

1. El compromiso está en `CONFIRMED` o `DUE`.
2. Todavía no pasó a `STARTED` ni `MISSED`.
3. No fue renegociado anteriormente: se permite **una sola renegociación por cadena de compromiso**.
4. El nuevo horario comienza al menos **15 minutos después** del momento en que se solicita el cambio.
5. El nuevo horario pertenece al mismo día calendario en la zona horaria de la institución.

No se exige una anticipación mínima respecto del horario original: un compromiso en `DUE` todavía puede renegociarse mientras no haya sido declarado `MISSED`.

### Persistencia

* La fila original nunca se modifica para representar el nuevo acuerdo.
* La original pasa a `RENEGOTIATED`.
* Se crea un nuevo `Commitment` mediante `renegotiated_from_id`.
* La operación debe conservar su atomicidad e idempotencia.
* Si ya hubo una renegociación, o el compromiso está `STARTED`/`MISSED`, la alternativa correspondiente es continuar o entrar al rescate; no volver a moverlo.

Esta regla se adopta para el MVP y deberá revisarse con evidencia de uso antes del piloto.

## 4. `C01-018` · Causalidad de `ProgressUpdated`

Se ratifica como decisión definitiva el comportamiento utilizado en el loop actual:

* `VALIDATED` por sí solo no produce `ProgressUpdated`.
* La operación autorizada de validación debe recibir un resultado explícito de progreso.
* Esa operación invoca `registrarProgreso` como paso explícito y separado.
* Debe informar `changed_dimensions` o `explicit_no_change = TRUE`.
* Una transición de Evidence nunca puede inferir por sí sola que existió progreso.

La causa queda registrada mediante la validación y la evidencia que originaron la actualización. Nuevas fuentes de progreso podrán agregarse después, pero requerirán una causalidad explícita propia; no se incorporan por inferencia.

Con esto puede cerrarse `C01-018`.

## 5. `C01-024` · Recomendación de Modo Examen

Modo Examen se recomienda automáticamente cuando:

1. Existe una fecha de examen conocida y vigente.
2. Faltan **14 días calendario o menos**, incluyendo el día 14.
3. No existe ya un Modo Examen activo o completado para ese mismo examen.
4. La recomendación no fue emitida anteriormente para ese intento.

La ventana automática no depende de `PreparationReadiness`: los umbrales de readiness continúan abiertos y no deben bloquear este disparador.

Si no existe fecha confiable, el sistema no inventa una ni emite automáticamente el evento. La activación manual continúa disponible según el contrato actual.

`ExamPreparationRecommended` se emite una sola vez por intento de examen. El cálculo utiliza la zona horaria institucional.

Con esto puede cerrarse `C01-024`.

## Decisiones que permanecen abiertas

### `C01-029` · Readiness

No se fijan umbrales sin ver:

* variables disponibles;
* escala y fórmula actual;
* efecto exacto de cada umbral;
* tres ejemplos de estudiantes que quedarían en cada estado.

Presentar un paquete breve con recomendación y alternativas. No implementar porcentajes provisionales.

### `C01-019` · Cinco dimensiones de progreso

No se decide sin presentar los nombres canónicos, definición observable, escala, fuente y ejemplo de cada dimensión. La implementación actual que distingue cambio de “sin cambio confirmado” puede mantenerse.

### `C01-030` · Identidad de revisión

Permanece abierto hasta resolver dónde vive el Reviewer y cómo llega su identidad desde el CRM.

Mientras todo sea sintético:

* las operaciones pueden continuar con secreto de servicio;
* `reviewer_id`, `corroborated_by` y `actor_id` pueden permanecer en `NULL`;
* el proceso debe identificarse en el payload del evento;
* no se fabrican UUID para representar personas inexistentes.

Esto no autoriza revisión de evidencia de estudiantes reales.

### Decisiones de otros responsables

Continúan sin cambios:

* `C01-021`: Risk owner.
* `C01-044`: Product Operations.
* Confirmaciones del protocolo: psicopedagoga.
* ADR-006: asesoría jurídica.
* `C01-042`: Producto, datos e institución.
* Contrato HMAC y campo `applied`: CTO y CRM.

## Autorización de ejecución

Esta respuesta autoriza:

* guardar esta fuente literalmente;
* cerrar mediante sus ADR las cinco decisiones anteriores;
* actualizar `decisiones-abiertas.md`, `decisions.md` y el roadmap;
* implementar la reflexión, la renegociación y el disparador de Modo Examen en commits separados y trazables;
* ejecutar los gates correspondientes y pushear a la rama de trabajo actual.

No autoriza:

* inventar umbrales de readiness;
* definir identidades humanas;
* usar datos personales reales;
* adelantar la integración CRM diferida;
* mergear a `main`;
* realizar un despliegue productivo.

No abrir una auditoría general. Si la implementación revela una contradicción concreta con el schema o una máquina de estados existente, detenerse únicamente en esa contradicción y reportarla.
