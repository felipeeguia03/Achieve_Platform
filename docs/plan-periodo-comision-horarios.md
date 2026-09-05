# Plan de implementación — período, comisión y horarios de cursada

**Documento:** `docs/plan-periodo-comision-horarios.md`
**Para:** Product Owner
**De:** equipo Plataforma
**Fecha:** 5 de septiembre de 2026
**Decisiones que ejecuta:** [ADR-060](decisions.md#adr-060) … [ADR-065](decisions.md#adr-065),
[fuente literal](respuesta-po-periodo-comision-horarios-source.md).
**Qué es:** **una propuesta.** Nada de esto está implementado, y el orden de los cortes es el que
autorizaste en §10.

> ⚠️ **Un corte = un commit.** Cada uno deja el repo con los cinco gates en verde y **el producto
> usable**: ninguno depende de que el siguiente exista para no romper lo que ya funciona.
>
> ⚠️ **Nada de esto toca** `ADR-054`, el registro canónico de CTAs, el conteo de nodos, el CRM, datos
> reales, merge ni deploy.

---

## 0. Lo que hace que este plan sea corto

Tres hallazgos del informe, y el más importante apareció después:

| | Lo que se creía | Lo que es |
|---|---|---|
| Comisión | Entidad nueva | **`course_offering.commission` existe**, con `UNIQUE (course_id, term, commission)` |
| Semestre y anualidad | Columnas nuevas | **`curriculum_requirement.term` e `is_annual` existen** y el importador ya las lee |
| Temario por materia | Migración de datos con riesgo | **`topic.course_id` existe**, con `CHECK (offering_id IS NOT NULL OR course_id IS NOT NULL)` |

**La única entidad genuinamente nueva es el bloque horario.**

---

## Corte 1 · Vocabulario del período y fixtures sintéticos — ✅ HECHO

**Ejecuta:** [ADR-061](decisions.md#adr-061) §4. **Completado el 5 de septiembre de 2026.**

> ✅ **Cómo cerró.** `lib/domain/periodo.ts` (vocabulario + normalizador + `seDictaEn`), una migración
> con los tres `CHECK` y el backfill, el importador normalizando **tres dialectos distintos** —los
> CSV traen `1`/`2`/`anual` y `S1`/`S2`/`ANUAL` a propósito—, y **9 comprobaciones nuevas** contra
> Postgres. Las dos funciones del alta derivan año y semestre de `p_term`: **ningún contrato cambió**.
>
> **Y apareció un defecto que no era de este corte:** el `jsonb_agg` de `materias` en
> `estado_del_dia()` **era el único agregado sin `ORDER BY`**. Con una materia no se notaba; con
> dieciséis y desde [ADR-054](decisions.md#adr-054) —que hace que `CTA-001` abra la cursada de la
> fila visible— significaba que el estudiante podía abrir una materia distinta de la que vio. Se
> corrigió **en su propio commit**, y el check que lo cazó comparaba contra la posición `0` en vez de
> contra el orden: también se arregló.
>
> `lint` · `typecheck` · `build` · **1160 tests** · **`db:verify` 330 ✓, exit 0**.

| | |
|---|---|
| **Migraciones** | Una: `CHECK` cerrado sobre `curriculum_requirement.term`, y **columnas separadas** en `enrollment` para año lectivo (`SMALLINT`) y semestre (`FIRST_SEMESTER`/`SECOND_SEMESTER`), con backfill desde el `term` textual actual (`'2026-2'` → `2026` + `SECOND_SEMESTER`). **`enrollment.term` no se borra**: se conserva mientras haya lectores |
| **Contratos** | Ninguno hacia afuera. `periodoDeCursado()` deja de inferir y pasa a **normalizar** lo que recibe |
| **Pantallas** | Ninguna |
| **Datos** | `term` e `is_annual` en los tres CSV sintéticos: al menos una materia anual y materias de los dos semestres |
| **Pruebas** | **Dominio:** el normalizador rechaza `'S1'`, `'primer semestre'` y `'2026-1'` como entradas distintas del mismo concepto. **Base:** `db:verify` comprueba que ninguna fila de plan publicado queda con `term` fuera del vocabulario, y que **una anual no lleva semestre** |
| **Riesgo de compatibilidad** | 🟡 Las 213 filas actuales tienen `term IS NULL`. El `CHECK` debe admitir `NULL` —*"no sabemos el período de esta fila"* es un estado legítimo, y es el del Plan 2016 por [ADR-053](decisions.md#adr-053) |
| **Aceptación** | Contra Postgres: un plan sintético devuelve materias de primer semestre, de segundo y anuales, **distinguibles por consulta**, y `enrollment` guarda año y semestre en columnas propias |

---

## Corte 2 · El período se pregunta, y `/alta/materias` agrupa por él

**Ejecuta:** [ADR-061](decisions.md#adr-061) §3.

| | |
|---|---|
| **Migraciones** | Ninguna. Usa lo del corte 1 |
| **Contratos** | `POST /api/alta/carrera` suma año lectivo y semestre. `GET /api/alta` devuelve el período declarado |
| **Pantallas** | **`/alta/carrera`**: dos controles nuevos —año lectivo y semestre—, **sin pantalla nueva y sin quinto paso**. **`/alta/materias`**: agrupa por período; las anuales **en su propio grupo**, presentes en los dos semestres |
| **Pruebas** | **Dominio:** una materia anual aparece con `FIRST_SEMESTER` y con `SECOND_SEMESTER`; una de segundo **no** aparece en primero. **API:** confirmar sin período responde `400`. **UI:** los tres grupos se renderizan y las anuales no se duplican dentro del grupo del semestre |
| **Riesgo de compatibilidad** | 🟠 **Un estudiante ya dado de alta no tiene semestre declarado.** `estado_del_alta()` no debe mandarlo a rehacer el alta: el período faltante se trata como dato a completar, **no** como alta incompleta |
| **Aceptación** | Un estudiante sintético elige *segundo semestre* y ve, en `/alta/materias`, las de segundo de su año **más** el grupo de anuales, con la salida a otros años intacta |

---

## Corte 3 · La comisión: catálogo, cuatro estados y selección

**Ejecuta:** [ADR-062](decisions.md#adr-062).

| | |
|---|---|
| **Migraciones** | Una: `course_enrollment.commission_status` con `CHECK` de los cuatro valores y **default `NOT_APPLICABLE`** para las filas existentes —hoy ninguna materia usa comisiones, así que es el valor verdadero, no un relleno—; más una columna de texto para el nombre de `NOT_LISTED`. Datos: comisiones e `instructor` en los CSV sintéticos |
| **Contratos** | `catalogo_ofrecible()` devuelve, por materia, **las comisiones con su docente**. `POST /api/alta/materias` acepta comisión elegida **o** estado |
| **Pantallas** | **Cuarto paso del alta.** Por materia: elegir · «No sé mi comisión» · «Mi comisión no aparece». Y la acción global **«No sé mis comisiones todavía»** |
| **Pruebas** | **Dominio:** ningún camino selecciona automáticamente la primera comisión —**guard estático**, como el de riesgo—. `NOT_APPLICABLE ≠ UNKNOWN`. **API:** confirmar con todo en `UNKNOWN` devuelve `201`. **UI:** la acción global marca las pendientes y **deja avanzar** |
| **Riesgo de compatibilidad** | 🟡 `UNIQUE (student_id, offering_id)`: elegir comisión implica **mover** `offering_id`, y choca si ya existe otra cursada de esa materia y comisión. Se contesta como conflicto de producto, no como `500` |
| **Aceptación** | Un estudiante confirma una comisión, otro usa la acción global, y los dos llegan a `HOY`. En la base: `commission_status` en `CONFIRMED` y en `UNKNOWN`, **sin ninguna comisión elegida por el sistema** |

---

## Corte 4 · Los bloques horarios, con sus dos propietarios

**Ejecuta:** [ADR-063](decisions.md#adr-063).

| | |
|---|---|
| **Migraciones** | **La única entidad nueva.** Un bloque con `day_of_week` · `start_time` · `end_time` · `kind` opcional · `source_type` · `verification_status`, y **exactamente un dueño**: `offering_id` **o** `course_enrollment_id`, con `CHECK` de exclusividad — el mismo patrón que `topic_belongs_somewhere` y que `una_sola_forma`. Más `course_enrollment.schedule_status` (conocidos / desconocidos) |
| **Contratos** | El catálogo devuelve los bloques publicados de cada comisión. El alta acepta bloques declarados por el estudiante |
| **Pantallas** | El cuarto paso suma la carga manual de bloques y **«Todavía no sé mis horarios»** |
| **Pruebas** | **Base:** un bloque con los dos dueños **es rechazado**; uno declarado entra `student`/`unverified` y **ninguna operación lo eleva** (extiende el guard de `I9` que ya recorre las migraciones). **Dominio:** las cuatro combinaciones comisión × horario son representables. **UI:** «no sé mis horarios» avanza sin crear filas |
| **Riesgo de compatibilidad** | 🟢 Tabla nueva, nadie la lee todavía. El riesgo real es **semántico**: que alguien la lea como `availability`. Se cubre con un guard de que el ADE **no** la consulta |
| **Aceptación** | Un estudiante con comisión `UNKNOWN` carga «martes 18–20» y queda persistido con procedencia; otro con comisión `CONFIRMED` hereda los bloques publicados. **Ninguno de los dos es «disponible» a los ojos del sistema** |

---

## Corte 5 · El conflicto de horario al comprometerse

**Ejecuta:** [ADR-064](decisions.md#adr-064).

| | |
|---|---|
| **Migraciones** | Ninguna |
| **Contratos** | `POST /api/compromiso` devuelve **`409` con motivo canónico** cuando el `start_at` se superpone con un bloque conocido. `propuestaDeCompromiso()` evita proponer un horario en conflicto |
| **Pantallas** | **`UX04`**: el conflicto se muestra con sus **dos salidas** —elegir otro horario, o corregir el bloque de clase—. Copy en `es-AR.ts`, resuelta por código como `MOTIVO_DE_CAMBIO` |
| **Pruebas** | **Dominio:** función pura de superposición, con los bordes —termina justo cuando empieza la clase **no** es conflicto—, en huso institucional ([ADR-049](decisions.md#adr-049)). **API:** el `409` con su motivo. **UI:** el conflicto se ve y **la CTA no queda apagada sin explicación** |
| **Riesgo de compatibilidad** | 🟠 **El más alto del plan:** una regla nueva sobre el camino que ya funciona. Se mitiga porque **sólo se evalúa contra bloques conocidos**: sin horarios, el comportamiento es idéntico al de hoy, y hay test de eso |
| **Aceptación** | Un compromiso a las 18:30 de un martes con clase de 18 a 20 **no se confirma** y explica por qué; el mismo a las 21 se confirma. Sin horarios cargados, los dos se confirman |

---

## Corte 6 · La electiva todavía no elegida

**Ejecuta:** [ADR-065](decisions.md#adr-065).

| | |
|---|---|
| **Migraciones** | Una: relajar `una_sola_forma` para admitir **la tercera forma** —ninguna de las dos, con estado `PENDING_SELECTION`— **sin dejar de rechazar las dos a la vez**, y agregar el estado a `requirement_declaration`. Y `confirmar_mapa_academico()` deja de borrar las pendientes |
| **Contratos** | `POST /api/alta/materias` acepta un cupo con estado *pendiente* |
| **Pantallas** | `/alta/materias`: el cupo suma **«Todavía no elegí mi electiva»** |
| **Pruebas** | **Base:** una fila con las dos formas sigue siendo rechazada; una pendiente **sobrevive a dos reconfirmaciones seguidas** —la regresión que este corte existe para impedir—. **UI:** la opción no bloquea la CTA |
| **Riesgo de compatibilidad** | 🟡 Relajar un `CHECK` es irreversible en la práctica: hay que escribir el nuevo de forma que siga prohibiendo lo que el viejo prohibía. Se prueba con las tres formas válidas y las dos inválidas |
| **Aceptación** | Un estudiante confirma con la electiva pendiente, vuelve, reconfirma, y **la declaración sigue ahí** |

---

## Corte 7 · El temario pasa a la materia

**Ejecuta:** [ADR-060](decisions.md#adr-060). **Va último a propósito:** es el que más superficie toca y el único cuyo beneficio sólo se ve cuando existen comisiones reales — que las traen los cortes 3 y 4.

| | |
|---|---|
| **Migraciones** | Una: backfill `topic.course_id` desde `course_offering.course_id` donde esté `NULL`, y las dos funciones de ingesta escriben el `course`. **`topic.offering_id` no se borra** — instrucción explícita— y queda para lo que sí sea de la cátedra |
| **Contratos** | Cuatro lecturas resuelven el temario por materia: la comprobación de `contextoIncompleto` de `estado_del_dia()`, la de `estado_de_materia()`, y el contexto del ADE |
| **Pantallas** | Ninguna. **Es el corte que no se ve, y ese es el punto** |
| **Pruebas** | **Base:** cambiar `course_enrollment.offering_id` de una comisión a otra **conserva `topic_progress`, acciones, evidencias y bitácora** — el caso que ADR-060 existe para garantizar. **Dominio:** `contextoIncompleto` sigue siendo verdadero para una materia sin temario, falso para una con temario en otra comisión |
| **Riesgo de compatibilidad** | 🟠 Un backfill sobre la tabla que alimenta al ADE. Se mitiga con el `CHECK` que ya existe —un topic siempre pertenece a algo— y porque **los dos caminos conviven**: se lee por `course_id` con caída a `offering_id` hasta que el backfill esté verificado |
| **Aceptación** | Un estudiante con progreso registrado cambia de comisión y **`UX02` muestra las mismas unidades y el mismo avance**, con la bitácora entera |

---

## Lo que este plan deja explícitamente afuera

- **Retirar `topic.offering_id`.** Instrucción textual: *"no eliminar todavía"*.
- **Overrides o remapeos de temario entre cátedras.** Fuera del MVP por [ADR-060](decisions.md#adr-060).
- **Publicar o reutilizar horarios de un estudiante para otros.** Prohibido por [ADR-063](decisions.md#adr-063).
- **Promover un horario a `verified` u `official`.** Espera a ADR-006 y `C01-030`.
- **Tocar `ADR-054`, el registro de CTAs o el conteo de nodos.**

## Lo que queda para decidir cuando el plan avance

Ninguna bloquea el corte 1, y ninguna la puede cerrar un agente:

1. **¿Un cambio de comisión es un hecho del dominio con su propio evento?** Hoy sería un `UPDATE` mudo. `product_event` es append-only y el catálogo tiene guard en las dos direcciones: agregar un evento se declara antes.
2. **¿Qué pasa con `enrollment.term` cuando el año lectivo cambia?** Hoy `UNIQUE (student_id, program_id, term)` hace que un año nuevo sea **una inscripción nueva**. Con año y semestre en columnas propias, hay que decidir si el semestre entra en esa clave.
3. **¿Quién corrobora un horario declarado?** Es `C01-030`, **diferida** por [ADR-057](decisions.md#adr-057).
