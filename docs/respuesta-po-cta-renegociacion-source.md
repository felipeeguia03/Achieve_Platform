# Respuesta del Product Owner · la CTA de renegociación en `UX04`

**Fecha:** 4 de septiembre de 2026
**Rol:** fuente literal. **No se edita, ni los tipeos.** Si esta fuente y un ADR
discrepan, **manda la fuente** (`AGENTS.md` §1.2).
**Responde a:** la fila 16 de [`decisiones-abiertas.md`](decisiones-abiertas.md),
levantada al implementar [ADR-046](decisions.md#adr-046).
**Se registró como:** [ADR-050](decisions.md#adr-050).

---

Acepto las implementaciones de ADR-046, ADR-048 y ADR-049, incluida la interpretación de que “mismo día calendario” refiere al día del compromiso original.

## Decisión de diseño · CTA de renegociación en UX04

Se autoriza agregar en `UX04 · Compromiso` una acción secundaria con copy:

> **Cambiar horario**

No usar “Renegociar” en la interfaz: es lenguaje interno, no del estudiante.

### Ubicación y jerarquía

* La CTA aparece debajo de la acción principal **“Empezar”**.
* “Empezar” conserva toda la jerarquía visual.
* “Cambiar horario” se presenta como botón secundario o acción de texto.
* No se agrega una pantalla ni una ruta nueva.
* No se agrega por ahora otra CTA en `UX01/Hoy`: alcanzar UX04 es suficiente para cerrar el recorrido del MVP.

### Cuando la renegociación es elegible

Al presionar **“Cambiar horario”**, UX04 despliega en la misma pantalla un bloque con:

* horario actual, sólo lectura;
* selector del nuevo horario;
* CTA principal **“Confirmar nuevo horario”**;
* acción secundaria **“Cancelar”**.

El selector sólo ofrece horarios:

* del mismo día institucional del compromiso original;
* al menos 15 minutos posteriores al momento actual.

La elegibilidad y la validación final provienen del dominio y del servidor. El frontend no replica ni redefine las cinco reglas de `renegociacion.ts`.

Al confirmar:

* se llama a `POST /api/renegociacion`;
* la fila original se conserva y pasa a `RENEGOTIATED`;
* la pantalla se actualiza con el compromiso sucesor;
* se muestra **“Horario actualizado”**;
* la acción principal vuelve a ser **“Empezar”**.

### Cuando no es elegible

Si `renegociacionElegible` es falso, no mostrar un botón deshabilitado sin explicación. En su lugar, UX04 muestra el estado aprobado `RENEGOCIACION_NO_ELEGIBLE`, con una explicación breve basada en el motivo canónico devuelto por el servidor.

Copy general:

> **Este compromiso ya no se puede cambiar.**

Debajo debe mostrarse el motivo correspondiente, por ejemplo:

* **Ya cambiaste el horario de este compromiso una vez.**
* **Este compromiso ya empezó.**
* **Este compromiso se incumplió; ahora corresponde rescatarlo.**
* **Ya no queda un horario válido dentro del día acordado.**

El estudiante conserva las acciones que correspondan al estado: empezar, continuar o rescatar. La pantalla nunca propone editar la fila original.

Si la elegibilidad cambia entre la carga de la pantalla y la confirmación, el `409` debe representarse mediante este mismo estado, no como error técnico genérico.

## Alcance autorizado

Esta decisión autoriza:

* actualizar `CompromisoProps` para recibir elegibilidad y motivo;
* conectar UX04 con `POST /api/renegociacion`;
* tocar exclusivamente los componentes, proyecciones y pruebas necesarios;
* registrar la decisión y retirar la fila 16 de decisiones abiertas;
* ejecutar los gates y pushear commits enfocados en `feat/fase-0-track-a`.

No hace falta producir nuevas capturas ni esperar diseño high-fidelity. Reutilizar la composición visual actual de UX04.

## Criterio de cierre

Entregar evidencia de estos cuatro recorridos contra Postgres:

1. Renegociación elegible y exitosa.
2. Segunda renegociación rechazada con explicación visible.
3. Compromiso `STARTED` o `MISSED` sin opción incorrecta de cambiar horario.
4. `409` por cambio de elegibilidad representado como estado de producto.

Verificar que el horario original permanece intacto, existe un único sucesor y se emite un solo `CommitmentRenegotiated`.

No mergear a `main` ni desplegar. Al terminar, dejar el servidor local corriendo y entregar URL y capturas para revisar personalmente UX04.
