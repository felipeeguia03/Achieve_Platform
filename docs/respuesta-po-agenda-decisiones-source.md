# Respuesta del Product Owner a la agenda de decisiones abiertas — fuente literal

**Documento:** `docs/respuesta-po-agenda-decisiones-source.md`
**Autor:** Product Owner de Achieve
**Fecha:** 5 de septiembre de 2026
**Responde a:** [`agenda-decisiones-abiertas-po.md`](agenda-decisiones-abiertas-po.md)
**Rol:** **fuente literal.** No se edita, no se corrige, no se parafrasea. Si un ADR y este texto
discrepan, **gana este texto** — es la misma regla que rige para
[`respuesta-po-flujos-crm-source.md`](respuesta-po-flujos-crm-source.md) y para
[`human-p0-source.md`](human-p0-source.md).

**Cierra:** [ADR-054](decisions.md#adr-054) · [ADR-055](decisions.md#adr-055) ·
[ADR-056](decisions.md#adr-056) · [ADR-057](decisions.md#adr-057) ·
[ADR-058](decisions.md#adr-058) · [ADR-059](decisions.md#adr-059).

---

## Transcripción

Leí `docs/agenda-decisiones-abiertas-po.md`.

Mi prioridad sigue siendo obtener un MVP observable sobre datos sintéticos, sin ampliar alcance, sin desbloquear datos reales y sin construir superficies nuevas. Estas son mis respuestas literales como Product Owner.

## ADR-054 — Apartado «Materias»

**Respuesta:**

Elijo `B` ahora.

`CTA-001` debe transportar el `CourseEnrollment` seleccionado y abrir exactamente la materia desde la cual se originó la navegación. Autorizo agregar el identificador necesario a `MateriaResumen`, parametrizar la CTA y registrar el cambio en el registro canónico.

Esto no autoriza construir todavía una nueva superficie de listado «Materias» ni cambiar el nombre del ítem del menú. Las opciones `A` y `C` quedan como una decisión de diseño separada.

## C01-021 — Reglas de riesgo sin umbral

**Respuesta:**

Elijo `B`.

`HP0-06-2` y `HP0-06-3` permanecen en modo humano hasta disponer de evidencia del piloto. Registrar `C01-021` como `ANSWERED — RESIDUO ABIERTO`, con la condición explícita de que sus umbrales se definirán a partir de datos observados durante el piloto.

No autoriza implementar evaluadores automáticos ni inventar umbrales provisionales.

## C01-044 — Playbook y SLA

**Respuesta:**

Elijo `A`, con carácter provisional.

Playbook provisional: ante una señal `INTERVENTION_REQUIRED`, el rol operativo asignado debe revisar el contexto disponible, realizar un primer intento de contacto por WhatsApp, identificar el bloqueo, acordar una única próxima acción o activar el protocolo de rescate/no cortar, y registrar obligatoriamente el outcome y el próximo seguimiento.

SLA provisional: primer intento de contacto dentro de cuatro horas hábiles del horario operativo vigente. Si la señal se produce fuera de ese horario, el plazo comienza en la siguiente ventana operativa.

Una intervención no puede cerrarse sin outcome. Esto no define todavía la identidad técnica de la persona ni autoriza construir superficies de operador dentro de Plataforma.

## C01-030 — Identidad de quien revisa

**Respuesta:**

Elijo `C`.

La definición permanente de identidad queda diferida hasta el cierre de `ADR-006`. Mientras todo siga siendo sintético, se mantiene el interinato ya ratificado: las operaciones pueden ejecutarse mediante identidad de servicio, identificando el proceso en el evento y sin fabricar UUID de personas inexistentes.

Esto no autoriza revisar, corroborar ni pedir reenvíos sobre evidencia de estudiantes reales.

Registrar la decisión como diferida con motivo y retirar la fila de los pendientes activos inmediatos.

## C01-029 — Readiness

**Respuesta:**

No se implementará un porcentaje ni una predicción de aprobación. `READY_BY_PROTOCOL` significa únicamente que la preparación cumplió el protocolo.

Aplicar esta regla determinística:

* `READY_BY_PROTOCOL`: todos los `required_steps` están completos; la evidencia se encuentra en un estado canónico suficiente o validado; `autonomous_practice = true`; `simulation = true`; y `critical_gaps` está vacío.
* `NOT_READY`: existe al menos un `critical_gap`, o todavía no existe ninguna señal observable de avance.
* `BUILDING`: cualquier caso restante; existe avance observable, pero todavía no se cumplen todas las condiciones de `READY_BY_PROTOCOL`.

Se considera señal observable de avance: al menos un paso requerido completado, evidencia recibida o en proceso, práctica autónoma realizada o simulación realizada.

Toda escritura debe completar `explanation` indicando qué condición se cumplió y cuáles faltan. Usar únicamente los estados canónicos existentes; esta decisión no autoriza crear estados nuevos.

## C01-019 — Dimensiones de progreso

**Respuesta:**

La implementación actual, que distingue un cambio de un «sin cambio confirmado», puede mantenerse.

Esto autoriza conservar el comportamiento actual de `UX06` y que `UX02` omita dimensiones cuya semántica todavía no esté aprobada. No autoriza mostrar valores internos, porcentajes aprendidos, promedios de dimensiones ni equivalencias entre confianza y dominio.

Registrar la definición completa de nombres observables y escalas como residuo abierto para validación con evidencia del piloto. No debe bloquear el MVP actual.

## Decisiones dependientes de terceros

Mantener abiertos, sin reinterpretarlos ni relajarlos:

* `ADR-006`: requiere dictamen de asesoría jurídica. Continúa bloqueando datos de personas reales, B7 y B8.
* Protocolo: pedir a la psicopedagoga confirmación de vigencia de los veinte pasos y cuáles son reentrantes.
* `C01-042` y `C01-052`: pedir autorización institucional y el Plan 2016 oficial. Mientras tanto, continuar exclusivamente con catálogo sintético.
* CRM/HMAC: pedir al CTO confirmación escrita de `${timestamp}.${rawBody}` y de si el `202` incluye `applied`. No modificar ahora la integración congelada.

## Ejecución autorizada

Trabajá en dos commits separados:

### Commit 1 — Decisiones y trazabilidad

1. Guardar este texto literalmente en un archivo `respuesta-…-source.md`.
2. Actualizar los ADR/C01 correspondientes.
3. Actualizar `decisiones-abiertas.md` y `roadmap.md` en el mismo commit.
4. Distinguir claramente decisiones cerradas, residuos abiertos y dependencias externas.
5. No modificar código en este commit.

### Commit 2 — Corrección visible del MVP

Implementar exclusivamente `ADR-054`, opción `B`:

* `CTA-001` debe transportar la cursada seleccionada.
* La pantalla debe abrir exactamente ese `CourseEnrollment`.
* Agregar las pruebas necesarias para demostrar navegación correcta con más de una materia.
* Verificar especialmente que seleccionar la segunda, séptima o novena materia no abra la primera.
* No construir el listado general de Materias.
* No cambiar el menú.
* No agregar superficies, entidades, engines ni migraciones.
* No realizar refactors ajenos al cambio.

Después de ambos commits:

* ejecutar los gates aplicables;
* informar hashes y títulos;
* listar archivos modificados por commit;
* mostrar las pruebas ejecutadas y sus resultados;
* mostrar `git status --short`;
* detenerse.

No hacer push, merge ni deploy.
