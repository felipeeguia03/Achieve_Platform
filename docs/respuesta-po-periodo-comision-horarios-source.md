# Respuesta del Product Owner — período, comisión y horarios de cursada · fuente literal

**Documento:** `docs/respuesta-po-periodo-comision-horarios-source.md`
**Autor:** Product Owner de Achieve
**Fecha:** 5 de septiembre de 2026
**Responde a:** [`informe-periodo-comision-horarios.md`](informe-periodo-comision-horarios.md)
**Rol:** **fuente literal.** No se edita, no se corrige, no se parafrasea. Si un ADR y este texto
discrepan, **gana este texto**.

**Cierra:** [ADR-060](decisions.md#adr-060) · [ADR-061](decisions.md#adr-061) ·
[ADR-062](decisions.md#adr-062) · [ADR-063](decisions.md#adr-063) ·
[ADR-064](decisions.md#adr-064) · [ADR-065](decisions.md#adr-065).
**Y responde las seis preguntas** que el §7 del informe dejó nombradas.

---

## Transcripción

Leí `docs/informe-periodo-comision-horarios.md`. Estas son mis decisiones como Product Owner.

## 1. ¿El temario es de la materia o de la cátedra?

Para el MVP, el temario canónico pertenece a la **materia**, no a cada comisión.

Las diferentes cátedras/comisiones pueden aportar:

* Ritmo y orden de recorrido.
* Fechas.
* Evaluaciones.
* Recursos.
* Clases realizadas.
* Indicaciones específicas del docente.

Pero no deben crear automáticamente un universo nuevo e incompatible de temas.

El progreso del estudiante continúa asociado a los temas de la materia y debe sobrevivir íntegramente a un cambio de comisión.

Si en el futuro aparece evidencia real de que dos cátedras tienen temarios sustancialmente diferentes, se diseñará una relación explícita entre el temario base y sus variaciones. Eso queda fuera del MVP y no autoriza ahora un sistema de overrides o remapeos.

No eliminar todavía `topic.offering_id` sin analizar impacto y migración. Registrar esta semántica y proponer el cambio técnico mínimo que la haga cumplir sin perder datos.

## 2. Estados de asignación de comisión

La asignación de comisión tendrá cuatro estados canónicos:

* `CONFIRMED`: el estudiante confirmó una comisión existente.
* `UNKNOWN`: el estudiante todavía no sabe cuál es su comisión.
* `NOT_LISTED`: conoce su comisión, pero no aparece en el catálogo.
* `NOT_APPLICABLE`: la materia no utiliza comisiones.

El estado pertenece a `course_enrollment`, porque describe la situación del estudiante.

Reglas:

* `UNKNOWN` debe permitir continuar el alta.
* `NOT_LISTED` debe permitir escribir como mínimo el nombre declarado por el estudiante y conservarlo como dato no verificado.
* `NOT_APPLICABLE` no es equivalente a `UNKNOWN`.
* Nunca seleccionar automáticamente la primera comisión.
* Debe existir una acción global `No sé mis comisiones todavía`, que marque como `UNKNOWN` las cursadas correspondientes sin bloquear el alta.

## 3. Ubicación del período en el alta

El año lectivo y el semestre actual se preguntan dentro de `/alta/carrera`.

No crear una pantalla independiente exclusivamente para el período y no agregar un quinto paso.

La pantalla debe preguntar:

* Año lectivo.
* Semestre actual: primero o segundo.

La anualidad no es una alternativa al semestre actual del estudiante. Una persona puede estar en el segundo semestre y cursar simultáneamente materias anuales.

En `/alta/materias`:

* Mostrar primero las materias del semestre seleccionado.
* Mostrar las materias anuales en un grupo separado.
* Permitir agregar materias de otros años o períodos.
* No asumir que el alumno cursa todas las materias sugeridas por el plan.

La pantalla de comisión y horarios sí permanece como el cuarto paso del alta.

## 4. Vocabulario del período

No continuar usando texto libre ni inferir el período según el mes actual.

Separar conceptualmente:

* Año lectivo.
* Semestre actual del estudiante: `FIRST_SEMESTER` o `SECOND_SEMESTER`.
* Período de dictado de una materia: primer semestre, segundo semestre o anual.

Usar vocabulario cerrado.

Para una materia anual:

* `is_annual = true`.
* No inventar que pertenece al primer o al segundo semestre.
* Debe poder aparecer durante ambos semestres del mismo año lectivo.

La representación técnica puede reutilizar y normalizar las columnas existentes, pero debe evitar que valores como `1`, `primer semestre`, `2026-1` y `S1` representen el mismo concepto de maneras diferentes.

## 5. Horarios y `Commitment`

La restricción horaria pertenece a la propuesta y validación del `Commitment`, no al ADE.

El ADE continúa decidiendo:

* Qué hacer.
* Sobre qué materia o unidad.
* Cuántos minutos dedicar.

El flujo de `Commitment` decide cuándo hacerlo.

Cuando el estudiante elija un horario que se superponga con una clase conocida:

* No confirmar silenciosamente el compromiso.
* Mostrar el conflicto.
* Pedir que elija otro horario o que corrija el bloque de clase si ya no corresponde.

La ausencia de horarios nunca se interpreta como disponibilidad.

No mezclar los bloques de clase con `availability`: uno expresa cuándo está cursando y el otro cuándo puede estudiar.

## 6. Verificación de horarios declarados

Un horario declarado por el estudiante puede usarse inmediatamente como una restricción personal para sus compromisos, con:

* `source_type = student`.
* `verification_status = unverified`.

Usarlo como restricción personal no significa presentarlo como horario oficial de la institución.

Hasta cerrar `ADR-006` y `C01-030`:

* Nadie puede promoverlo a `verified` u `official`.
* No se requiere corroboración humana para que el propio estudiante lo utilice en su planificación.
* No debe publicarse ni reutilizarse automáticamente para otros estudiantes.

Esta decisión mantiene diferida la identidad de quien eventualmente corrobora.

## 7. Propiedad de los bloques horarios

Hay dos hechos diferentes que el modelo debe poder representar:

1. El horario publicado de una comisión pertenece a `course_offering`.
2. El horario declarado personalmente por un estudiante que todavía no conoce su comisión pertenece a `course_enrollment`.

No crear una comisión ficticia ni utilizar la offering con `commission IS NULL` para guardar el horario personal.

Proponer la representación técnica mínima que mantenga ambas procedencias y permita el caso:

> Comisión desconocida, pero días y horarios conocidos.

Puede resolverse con una estructura común o con estructuras separadas, pero deben mantenerse las FK reales, la procedencia y la diferencia semántica. No usar JSON opaco ni identificadores fabricados.

## 8. Estado de horarios

La cursada debe distinguir como mínimo:

* Horarios conocidos.
* Horarios todavía desconocidos.

`Todavía no sé mis horarios` debe permitir continuar.

No crear una fila horaria negativa para representar desconocimiento. Guardar el estado explícito en la cursada y las filas de horario únicamente cuando exista al menos un bloque conocido.

Comisión y horarios son independientes:

* Comisión conocida con horarios desconocidos.
* Comisión desconocida con horarios conocidos.
* Ambos conocidos.
* Ambos desconocidos.

## 9. Electiva todavía no elegida

Una posición como `ELECTIVA I` o `ELECTIVA II` no es una materia concreta.

La declaración debe poder sobrevivir con estado `PENDING_SELECTION` aunque todavía no tenga `course_enrollment_id` ni nombre escrito.

`confirmar_mapa_academico()` no debe borrar esa declaración durante una reconfirmación.

El estudiante debe poder:

* Elegir una opción existente.
* Declarar una electiva que no aparece.
* Indicar `Todavía no elegí mi electiva`.

Esto tampoco bloquea el alta.

## 10. Secuencia autorizada

Registrar primero estas decisiones en una fuente literal y en los ADR correspondientes.

Después presentar un plan de implementación dividido en cortes verificables:

1. Normalización de año lectivo, semestre y anualidad; carga de fixtures sintéticos.
2. Período dentro de `/alta/carrera` y agrupamiento de `/alta/materias`.
3. Estados y selección de comisión.
4. Horarios institucionales y horarios declarados por el estudiante.
5. Validación de superposición al crear un `Commitment`.
6. Persistencia de electivas todavía no elegidas.
7. Adecuación del temario para que el progreso sea estable ante cambios de comisión.

Cada corte debe indicar:

* Migraciones.
* Contratos afectados.
* Pantallas afectadas.
* Pruebas de dominio, API y UI.
* Riesgos de compatibilidad.
* Criterio observable de aceptación.

No implementar todo en un único commit. No tocar `ADR-054`, el registro canónico de CTAs, el conteo de nodos, CRM, datos reales, merge ni deploy.

En esta ejecución, guardar las decisiones, actualizar trazabilidad, proponer el plan por cortes y detenerse antes de modificar código.
