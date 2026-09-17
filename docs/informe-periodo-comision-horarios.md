# Informe de impacto — período académico, comisión y horarios de cursada

**Documento:** `docs/informe-periodo-comision-horarios.md`
**Para:** Product Owner
**De:** equipo Plataforma
**Fecha:** 5 de septiembre de 2026
**Qué es:** una **inspección de sólo lectura**, pedida junto con la nueva decisión de producto. No se
implementó nada, no se creó ninguna entidad y no se tocó el código de los dos commits autorizados.

> ## El titular
>
> **El modelo que pediste ya está construido en su mayor parte, y no lo sabíamos.**
> `course_offering` **ya tiene `term`, `commission` e `instructor_id`**, y la cursada del alumno
> **ya cuelga de la comisión, no de la materia** — que es exactamente la separación que planteaste.
> `curriculum_requirement` **ya tiene `term` e `is_annual`**, y el importador de CSV **ya los lee**:
> están vacíos en las 213 filas, no ausentes.
>
> **Falta una sola entidad de verdad:** el **bloque horario recurrente de una cátedra**. No existe, y
> no hay nada equivalente que reusar.
>
> ⚠️ **Y hay un problema que la propuesta destapa y conviene mirar antes de diseñar nada:** con el
> modelo actual, **cambiar de comisión cambia el conjunto de unidades de la materia**, porque `topic`
> cuelga de la offering. El progreso no se pierde por la cursada — se pierde por los temas. Está en
> §5, y **no lo puede resolver un agente.**

> ## ✅ RESPONDIDO — 5 de septiembre de 2026
>
> **Las seis preguntas del §7 quedaron cerradas el mismo día.** Respuesta literal en
> [`respuesta-po-periodo-comision-horarios-source.md`](respuesta-po-periodo-comision-horarios-source.md);
> su lectura en [ADR-060](decisions.md#adr-060) … [ADR-065](decisions.md#adr-065); el plan por cortes
> en [`plan-periodo-comision-horarios.md`](plan-periodo-comision-horarios.md).
>
> | § | Cómo quedó |
> |---|---|
> | **7.1** temario | **De la materia.** El progreso sobrevive a un cambio de comisión. Sin overrides ni remapeos, y **`topic.offering_id` no se elimina** |
> | **7.2** estados de comisión | **Cuatro**, en la cursada: `CONFIRMED` · `UNKNOWN` · `NOT_LISTED` · `NOT_APPLICABLE`. **Nunca elegir la primera automáticamente** |
> | **7.3** dónde va el período | **Dentro de `/alta/carrera`.** Sin pantalla propia y sin quinto paso; el cuarto es comisión y horarios |
> | **7.4** vocabulario | **Cerrado**, y tres conceptos separados: año lectivo · semestre del estudiante · período de dictado. **La anualidad no es un semestre** |
> | **7.5** dónde va la restricción horaria | **En el `Commitment`.** El ADE no agenda |
> | **7.6** corroboración | Un horario declarado **se usa sin corroborar** como restricción personal, y **no se eleva** |
>
> ⚠️ **Y apareció un hallazgo que este informe no tenía:** **`topic.course_id` ya existe**, con
> `CHECK (offering_id IS NOT NULL OR course_id IS NOT NULL)`. El §5 daba el temario por atado a la
> offering; el schema ya admite las dos formas, y eso convierte el corte más riesgoso en un backfill.
>
> **Este documento queda como el planteo que produjo esas respuestas.** No se edita para reflejarlas.

---

## 1. Qué existe hoy

### 1.1 · La jerarquía que planteaste **ya es la del schema**

| Tu concepto | Dónde vive hoy | Estado |
|---|---|---|
| Materia | `course` (cuelga de `curriculum_plan`) | ✅ existe |
| Período académico | `course_offering.term` · `enrollment.term` | ✅ existe, **como texto libre** |
| Cátedra/comisión | **`course_offering.commission`** (`text`, nullable) + `course_offering.instructor_id` → `instructor` | ✅ **existe y nadie la escribe** |
| Horarios | — | ❌ **no existe** (ver §2.1) |
| Cursada del alumno | `course_enrollment(student_id, offering_id)` | ✅ existe, **ya apunta a la comisión** |

La unicidad es `UNIQUE (course_id, term, commission) NULLS NOT DISTINCT`: **dos comisiones de la
misma materia en el mismo período son dos `course_offering`**, y `NULLS NOT DISTINCT` hace que
*"sin comisión"* sea **una sola fila** y no infinitas. Eso ya está bien puesto.

⚠️ **Y la consecuencia buena que buscabas ya se cumple:** el progreso, las acciones, los compromisos,
las evidencias y la bitácora cuelgan de **`course_enrollment.id`**, no de la offering. Ver §5 para lo
que igual hay que decidir.

### 1.2 · Semestre y anualidad: las columnas están, el dato no

`curriculum_requirement` tiene **`term`** y **`is_annual`** desde la Fase B6.14, y
`scripts/importar-catalogo.mjs` **ya las lee del CSV** (columnas `term` e `is_annual` del encabezado).

**Están en `NULL` en las 213 filas de los seis planes.** No es una carencia del modelo: es que ningún
dataset las cargó, porque [ADR-053](decisions.md#adr-053) declaró que *"el semestre de cualquier
fila"* era una de las cosas que las imágenes del Plan 2016 **no permiten determinar**.

> Para los planes **sintéticos** no hay ese impedimento: los escribimos nosotros
> ([ADR-024](decisions.md#adr-024)). Cargarles `term` e `is_annual` es **editar tres CSV**, no migrar.

### 1.3 · El período del alumno se **infiere**, y el código ya dice que está mal

```ts
export function periodoDeCursado(ahora: Date = new Date()): string {
  return `${ahora.getFullYear()}-${ahora.getMonth() < 6 ? 1 : 2}`;
}
```

Con su propia advertencia arriba: *"**es una convención de la demo, no una regla académica.** El
calendario de una institución no se infiere de un mes"*. Hoy produce `'2026-2'`, y es lo que va a
`enrollment.term` y a `course_offering.term`.

**Tu decisión de preguntarlo es exactamente lo que ese comentario pedía.**

### 1.4 · Lo que ya está plumbeado y se ve en pantalla

- **`UX07` ya muestra la comisión.** `proyeccion-activacion.ts` la proyecta y
  `activacion-modo-examen.tsx` la renderiza: `{comision ? ` · ${comision}` : ""}`. Sale de
  `estado_de_examen()`, que lee `o.commission`.
- **La ingesta del ADL ya acepta comisión**: `lib/server/servicios/ingesta.ts` declara
  `cursada: { periodo: string; comision?: string }`.

**Ninguna otra parte del código TypeScript menciona `commission`.** El alta la crea siempre en `NULL`
(`confirmar_mapa_academico()`, migración `20260915040000`).

### 1.5 · Lo más parecido a un horario, y por qué no alcanza

| Tabla | Qué guarda | Por qué no sirve para esto |
|---|---|---|
| **`availability`** | `student_id`, `day_of_week` (0–6), `start_time`, `end_time`, `capacity_min`, `source` ∈ `declared`/`observed`/`inferred` | Es **del estudiante**, no de la cátedra. Es *cuándo puede estudiar*, y vos pedís *cuándo está en clase*. **Son opuestos y no se pueden colapsar** |
| **`class_session`** | `offering_id`, **`session_date`** (una fecha concreta), `status`, `source_type`, `verification_status` | Es el calendario **observado, clase por clase**, con provenance. No es un patrón semanal: no responde *"cursa los martes de 18 a 20"* |

**`availability` es la única tabla del schema con `day_of_week`/`start_time`/`end_time`.** Y hoy
**nadie la lee salvo el ADE**, que sólo usa `MIN(capacity_min)` — ver §3.

---

## 2. Qué falta de verdad

### 2.1 · El bloque horario recurrente de una cátedra — **la única entidad nueva**

No hay nada equivalente que reusar. La forma mínima que el modelo pide, con la provenance que el
repo exige en todo dato académico:

| Campo | Por qué |
|---|---|
| `offering_id` | el horario es **de la comisión**, no de la materia |
| `day_of_week` · `start_time` · `end_time` | el patrón semanal. Mismo tipo que `availability`, que ya los tiene |
| `kind` opcional (`teorico`/`practico`/`laboratorio`) | lo pediste explícitamente como opcional |
| `source_type` + `verification_status` | **obligatorio en este repo.** `institution` / `student` / `public_web`, y `unverified` hasta que alguien corrobore (`I9`) |

⚠️ **Un horario cargado por el estudiante entra `student`/`unverified` y no se eleva solo** — es la
regla que [ADR-029](decisions.md#adr-029) ya fijó para la pauta de cátedra. Y **`official` sigue
inalcanzable** hasta `C01-030`.

### 2.2 · «No sé mi comisión» **no se puede decir hoy**, y no es un campo que falte

`commission IS NULL` significa **dos cosas distintas** en la misma columna:

1. *"la institución no declara comisiones para esta materia"* — un hecho del catálogo;
2. *"el estudiante no sabe cuál le tocó"* — un hecho de **su cursada**.

Colapsarlas es exactamente el error que la Fase B6.14 evitó con `publication_status` y
`verification_status`. **El estado va en `course_enrollment`, no en `course_offering`**: es del
alumno, no de la oferta.

Y tu tercera opción —*"mi comisión no aparece"*— es **un cuarto estado**, no el mismo que *"no sé"*:
uno dice *no tengo el dato*, el otro dice *tengo el dato y el catálogo está incompleto*. El segundo es
información para corregir el catálogo.

### 2.3 · «Todavía no sé mis horarios» tampoco

Sin filas de horario, hoy no se distingue *"no cargó"* de *"declaró que no sabe"*. **La ausencia de
horarios no puede leerse como disponibilidad** —lo dijiste, y es literalmente el invariante *"sin
datos no es cero"* de `AGENTS.md` §2.5—, así que el negativo tiene que ser explícito.

### 2.4 · «Todavía no elegí mi electiva» tampoco se puede expresar

`requirement_declaration` tiene `course_enrollment_id` y `declared_label`, los dos nullable — así que
la fila *podría* existir con ambos vacíos. **Pero no llega a existir:**

- `components/alta/materias.tsx` **omite el cupo** cuando no hay opción ni nombre escrito
  (*"vacío no es un dato: la selección simplemente no existe"*);
- `confirmar_mapa_academico()` **borra** las declaraciones del plan que no vengan en la selección.

Así que *"no elegí todavía"* y *"no me preguntaron"* son hoy el mismo estado: ninguno.

### 2.5 · El período no se pregunta

Ver §1.3. Y `siguientePaso()` tiene **tres pasos** (`WHATSAPP` → `CARRERA` → `MATERIAS`): agregar uno
toca `PasoDelAlta`, `RUTA_DEL_PASO`, `estado_del_alta()` y **el gate `409 ALTA_INCOMPLETA` de las
nueve rutas**.

---

## 3. ⚠️ Una corrección al motivo, y conviene saberla antes de decidir

Escribiste que *"los horarios permiten que el Academic Engine no proponga estudiar mientras está en
clase"*. **Hoy el ADE no ubica trabajo en el tiempo.**

Lo que hace `recomendar()` es elegir **qué unidad** y **cuántos minutos**:

```ts
const bloque = ctx.minutosDisponibles
  ? { min: Math.min(30, ctx.minutosDisponibles), max: ctx.minutosDisponibles }
```

y `minutosDisponibles` sale de `SELECT MIN(av.capacity_min) FROM availability` — **una duración, sin
día y sin hora**. El ADE dimensiona un bloque; **nunca lo agenda**.

**Quien pone la hora es el `Commitment`**, y su `start_at` **lo manda el cliente**
(`app/api/compromiso/route.ts`: `startAt: new Date(cuerpo.inicio).toISOString()`).

> **Consecuencia:** el horario de clase restringe **la propuesta y la validación del compromiso**, no
> la decisión del ADE. Implementarlo dentro del ADE no cambiaría nada visible. Es una diferencia de
> dónde va la regla, y cambia qué hay que construir.

---

## 4. Qué se toca

### 4.1 · Base

| Cambio | Tipo |
|---|---|
| Cargar `term` e `is_annual` en los CSV sintéticos | **Datos.** Sin migración |
| Escribir `course_offering.commission` e `instructor_id` desde el catálogo | **Datos + importador.** Las columnas existen |
| Tabla de **bloque horario de la offering** | **Entidad nueva** — la única |
| Estado de asignación de comisión en `course_enrollment` | **Columna nueva** en tabla existente |
| Estado explícito *"no sé mis horarios"* | Decisión de forma: columna en `course_enrollment` o fila negativa |
| `confirmar_mapa_academico()` acepta comisión y estados pendientes | **Reemplazo de función**, como ya se hizo dos veces |
| Que la electiva sin elegir **sobreviva** al borrado de declaraciones | Cambio en la misma función |

### 4.2 · Contratos y superficies

| Qué | Cómo queda |
|---|---|
| `GET /api/alta` + `catalogo_ofrecible()` | Hoy devuelve carreras. Tendría que devolver también **offerings con comisión, docente y horarios** |
| `POST /api/alta/materias` | Hoy manda `{requisito, materia?, nombreEscrito?}`. Sumaría comisión y/o estado pendiente |
| `siguientePaso()` · `RUTA_DEL_PASO` · gate `409` | **Un paso más de alta** toca las nueve rutas |
| `/alta/carrera` | Suma año lectivo + semestre/anual |
| `/alta/materias` | Hoy agrupa **por año** (`delAnio` / `deOtrosAnios` / `cupos`). Pasaría a agrupar por **período**, con las anuales aparte |
| Paso de comisión y horarios | **Nuevo.** Cuarta pantalla del alta, fuera del registro canónico como las otras tres |
| `estado_de_materia()` · `UX02` | Podría mostrar comisión y horario. **Hoy no los proyecta** |
| `estado_de_examen()` · `UX07` | **Ya muestra la comisión.** No cambia |
| [ADR-051](decisions.md#adr-051) y [ADR-052](decisions.md#adr-052) | Se **enmiendan o se supersiguen**: los dos describen un alta de tres pasos sin comisión |

⚠️ **Lo que NO se toca:** el registro canónico de CTAs (el alta vive fuera), las nueve superficies, y
el conteo de nodos.

---

## 5. 🔴 La continuidad al cambiar de comisión — el punto que hay que decidir

**La mitad fácil ya está resuelta.** Todo lo que importa cuelga de `course_enrollment.id`:

```
action · commitment · evidence · reflection · topic_progress · progress_entry
risk_signal · exam_preparation · requirement_declaration   →  course_enrollment.id
```

Así que **cambiar de comisión es mover `course_enrollment.offering_id`**, conservando el `id`. Nada
se borra, nada se recrea, la bitácora sigue entera. Con dos detalles:

- `UNIQUE (student_id, offering_id)` **rechaza el movimiento** si ya existe otra cursada de la misma
  materia y comisión destino. Es correcto, y hay que contestarle algo al estudiante.
- La FK es `ON DELETE RESTRICT`: la offering vieja **no se borra**, y está bien.

### ⚠️ Y la mitad difícil, que la propuesta destapa

**`topic` cuelga de `offering_id`, no de `course`.** También `assessment`, `resource`,
`class_session` y `class_event_record`.

> **Si cada comisión tiene sus propias unidades, cambiar de comisión cambia el temario** — y
> `topic_progress` guarda `(course_enrollment_id, topic_id)`. La cursada sobrevive; **el progreso
> queda apuntando a temas de una comisión que el alumno ya no cursa**.

Eso **no es un bug a arreglar**: es una pregunta de dominio que hoy nadie contestó, porque hasta
ahora `commission` era siempre `NULL` y había **una sola offering por materia y período**. Al
introducir comisiones reales, hay que decidir:

- ¿el temario es **de la materia** —y las offerings lo comparten— o **de la cátedra**?
- si es de la cátedra, ¿qué pasa con el progreso registrado sobre temas de la anterior: **se
  conserva como historia**, se remapea, o se declara no comparable?

**No lo puede cerrar un agente.** Es exactamente la clase de regla que `AGENTS.md` §1.1 manda
registrar como ADR `PENDING` y preguntar. Y toca de cerca a `C01-036`/[ADR-037](decisions.md#adr-037):
*"sin objetivo declarado no hay comparabilidad"*.

---

## 6. Fixtures sintéticos mínimos

Los seis que pediste, con lo que cada uno necesita. **Todos caben en los CSV sintéticos y en
`db-demo.sh`**; ninguno necesita dato real.

| # | Caso | Qué hace falta |
|---|---|---|
| 1 | **Materia semestral** | Una fila de plan con `term = '2'` e `is_annual = false` |
| 2 | **Materia anual** | Otra con `is_annual = true` y `term` en `NULL` — **la anualidad no es un semestre** |
| 3 | **Dos comisiones con horarios distintos** | Dos `course_offering` del mismo `course_id` y `term`, con `commission` `'A'` y `'B'`, cada una con sus bloques y su `instructor_id` |
| 4 | **Comisión desconocida** | Una cursada con el estado *pendiente* — **no** una cursada apuntando a la offering con `commission IS NULL`: eso es «la materia no tiene comisiones», que es el otro caso |
| 5 | **Horarios conocidos sin comisión conocida** | El de arriba **más** bloques cargados por el estudiante, `student`/`unverified`. Es el que prueba que los dos datos son independientes |
| 6 | **Electiva sin elegir** | Un `ELECTIVE_SLOT` con `elective_option` cargadas y una declaración en estado *no elegida* que **sobreviva** a la reconfirmación |

⚠️ **Falta un séptimo que no pediste y conviene tener:** *"la materia no ofrece comisiones"* — el
`commission IS NULL` legítimo. Sin él, el caso 4 no se puede distinguir del catálogo incompleto, que
es justo la confusión que §2.2 describe.

---

## 7. Qué hace falta decidir antes de construir

Ninguna la puede cerrar un agente. **No están propuestas acá**: están nombradas.

| | La pregunta |
|---|---|
| **1** | **¿El temario es de la materia o de la cátedra?** — §5. Es la que condiciona todo lo demás |
| **2** | **¿Cuántos estados tiene la asignación de comisión?** Confirmada · no la sé · no aparece · la materia no ofrece. Son cuatro y **hoy hay uno** |
| **3** | **¿El período es un paso propio del alta o parte de «carrera»?** El primero agrega un cuarto paso y toca el gate de las nueve rutas |
| **4** | **¿`term` es texto libre o vocabulario cerrado?** Hoy es `text` sin `CHECK` y vale `'2026-2'`. «Primer semestre / segundo semestre / anual» pide un vocabulario, y el año lectivo es otro campo |
| **5** | **¿Dónde vive la restricción de horario: en el ADE o en el `Commitment`?** — §3. Hoy el ADE no agenda |
| **6** | **¿Quién puede corroborar un horario cargado por el estudiante?** Es `C01-030`, **diferida** por [ADR-057](decisions.md#adr-057) hasta ADR-006 |

---

## 8. Recomendación de secuencia

No es una decisión: es el orden que el propio modelo sugiere, para que cada paso se pueda verificar.

1. **Cargar `term` e `is_annual` en los CSV sintéticos.** Sin migración, sin código, y **hace visible
   el agrupamiento por semestre que la pantalla ya podría hacer**.
2. **Preguntar el período en el alta** y dejar de inferirlo del mes.
3. **Decidir §7.1** —el temario— antes de escribir una sola comisión real. Es lo único que, si se
   elige mal, obliga a rehacer el progreso.
4. **Comisiones y sus horarios**, con la entidad nueva y los cuatro estados de asignación.
5. **La electiva sin elegir**, que es independiente de todo lo anterior.

---

**Esto es un informe. No se implementó nada** y el árbol quedó limpio después de los dos commits
autorizados.
