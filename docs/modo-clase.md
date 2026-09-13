# Modo Clase — informe y plan

**13 de septiembre de 2026** · decidido en [ADR-098](decisions.md#adr-098).

> *"Tengo Análisis. Abro Achieve."* — el norte que pidió el owner. Achieve sabe que el estudiante está
> cursando, lo acompaña mientras pasa la clase, le deja capturar lo importante casi sin esfuerzo y
> conecta eso con el resto de su cursado.

Este documento tiene dos mitades: **qué encontró la auditoría** antes de construir (§A–§D), y **cómo
se construye** (§E–§G). La decisión vive en el ADR; si este documento y el ADR discrepan, gana el ADR.

---

## A. Lo que ya existía

| Pieza | Sirve para | Límite |
|---|---|---|
| `class_schedule_block` ([ADR-083](decisions.md#adr-083)) — regla semanal con dos dueños, aula y procedencia | Detectar la clase de ahora | **Hoy es toda simulada** (`inference`) y `simular-temarios` la regenera |
| `horariosReal.deCursadas()` — la lectura única de Hoy y Materias | La fuente de la detección | No se duplica |
| `lib/domain/zona.ts` + la zona de la institución ([ADR-049](decisions.md#adr-049)) | *"Empieza en 10 min"* | Intervalos semiabiertos, instantes absolutos |
| `course_enrollment`, `course_offering.commission` + `instructor_id` | La clase cuelga de la cursada | Comisión **siempre `NULL`** (ADR-062 sin construir) |
| `product_event` + `lib/domain/product-events.ts` | Inicio y fin | Guard en las dos direcciones |
| Bucket privado `evidencia` con URL firmada | El audio, cuando se autorice | Sin borrado: es ADR-006 |

**Lo que parecía servir y no sirve:**

- **`class_session`** es la clase **dictada**, de la comisión. Alimenta el Gantt, `Un.` y el ritmo de
  cátedra de todos los alumnos.
- **`class_event_record`** es el *"Pasó algo en clase"* del spec. `C01-004` `OPEN`, sin escritor.

## B. Los cinco choques, y cómo quedaron

| Pedido | Chocaba con | Quedó |
|---|---|---|
| Entidad `ClassSession` | `class_session` existente | Entidad nueva, `student_class_session` |
| Botón en la tarjeta de Hoy | ADR-094 §5 + guard | Enmienda: sólo la fila en curso o próxima |
| CTAs *Entrar* / *Finalizar* | Registro cerrado en 20 | `CTA-022` y `CTA-023` |
| Pantalla nueva | *"No existe `UX10`"* | Nodo `CLASE` sin wireframe |
| Audio, checkpoint | ADR-006; vocabulario de Confianza | Afuera, con dueño |

Y cuatro correcciones de vocabulario: **apuntes** (no *notas*), **Posible evaluación** /
`ASSESSMENT` (no *Parcial* / `EXAM`), **última clase dada** (no *unidad actual*), y **Modo Estudio no
se nombra** (es sinónimo prohibido de `ExamPreparation`).

## C. Datos declarados, derivados e inferidos

| Nivel | En Modo Clase | Dónde |
|---|---|---|
| **Declarado por el estudiante** | Las marcas, los apuntes, iniciar y terminar | `class_marker`, `student_class_session.notes`, las dos fechas |
| **Derivado** | Duración, cantidad de marcas por tipo, momento de cada marca | Se calcula al leer; `elapsed_seconds` lo pone el servidor |
| **De la procedencia del horario** | Si la clase coincide con un horario, y si ese horario es estimado | `class_schedule_block.source_type` |
| **Inferido por IA** | **Nada.** | — |

## D. Lo que queda afuera

Ver [ADR-098](decisions.md#adr-098) *"Lo que queda afuera"*. En corto: **el checkpoint** espera a la
psicopedagoga, **el audio** a ADR-006 y a legal, **la IA** a ADR-080, y **Bitácora, barra de
objetos, unidad, fotos y Modo Examen** son P1. Lo que requiere contrato nuevo (*"Preguntale a la
materia"*, candidatos al ADE, convertir una marca en reporte de clase) es P2.

---

## E. Cortes

Cada corte cierra con `lint`, `typecheck`, `build`, `test` y —si toca base— `db:verify`, y lleva un
commit.

| # | Corte | Estado |
|---|---|---|
| 0 | Decisión y documentación: ADR-098, este documento, glosario, agendas | ✅ |
| 1 | Dominio puro: la clase de ahora, la máquina de estados, las marcas | ✅ |
| 2 | Migración: `student_class_session`, `class_marker`, aislamiento | ✅ |
| 3 | Repository, Service y API · los dos eventos | ✅ |
| 4 | La pantalla `/clase` | ✅ |
| 5 | Hoy: la fila en curso lleva *Entrar a clase* | ✅ |
| 6 | Materia: *Tus clases* | ✅ |

### La API

| Ruta | Qué | Respuestas |
|---|---|---|
| `GET /api/clase` | La clase activa, o `null` | `200` |
| `GET /api/clase?clase=<id>` | Una clase, con apuntes y marcas | `200` · `404` si no es suya |
| `GET /api/clase?cursada=<id>` | Las clases de una materia, **sin apuntes** | `200` · `404` |
| `POST /api/clase` | Iniciar: `{ cursada, bloque? }` | `201` · `200` (la misma, repetido) · `409` otra activa · `404` |
| `PATCH /api/clase` | Apuntes: `{ clase, apuntes }` | `200` · `404` |
| `POST /api/clase/fin` | Finalizar: `{ clase }` | `200` (repetido también) · `404` |
| `POST /api/clase/marca` | Marcar: `{ clase, tipo, clave, texto? }` | `201` · `200` repetido · `409` clase terminada · `409` clave de otro pedido · `404` |
| `PATCH /api/clase/marca` | Texto de una marca: `{ marca, texto }` | `200` · `404` |

Todas: `401` sin token, `403` sin padrón, `409 ALTA_INCOMPLETA` antes que nada. **Lo ajeno es `404`,
nunca `403`**: `403` confirmaría que existe.

### Recorrido de QA a mano

1. `npm run db:demo` y entrar con el estudiante sintético.
2. Hoy: con una clase en curso, la fila dice *Entrar a clase*. Sin horario hoy, no hay botón.
3. Entrar. Escribir *"Cambio de variables"*. Recargar: el apunte sigue.
4. *No entendí*. Esperar. *Posible evaluación*. La timeline muestra las dos, en orden.
5. Volver a Hoy: la fila dice *Volver a la clase*.
6. *Finalizar clase*: duración y cantidades.
7. Materia → *Tus clases*: la clase está. Abrirla: apunte y marcas. Recargar.
8. Con otro estudiante sintético, `GET /api/clase?clase=<id>` de la primera: `404`.

### Lo que quedó sabido al construirlo

- ⚠️ **`/clase?clase=<id>` de otro estudiante muestra *"No se pudo cargar"*.** La API contesta `404`
  bien; es `pedir()`, compartido por las nueve superficies, el que no distingue `404` de un error.
  No hay fuga —no se ve nada ajeno— pero el texto invita a reintentar.
- ⚠️ **Si el Hero se repliega, Hoy no muestra el tablero** y con él la fila de *Entrar a clase*.
  Se entra igual desde la materia.
- ⚠️ **La demo local conserva tres clases sintéticas** de *Bases de Datos*, creadas al recorrerla.

## F. Riesgos

| Riesgo | Mitigación |
|---|---|
| Una clase olvidada abierta infla la duración | Hoy la muestra siempre; no se autocierra (§2.3) |
| Horarios simulados detectan clases que no existen | La nota de estimado; entrar a mano igual funciona |
| Confundir *Tus clases* con las clases dictadas de `UX02` | Secciones y nombres distintos, con test |
| Que las marcas terminen reordenando el ADE | Guard: el motor no lee `class_marker` |
| Reintentos del autosave pisando un apunte más nuevo | Último que llega gana; el cliente manda sólo el último texto |

## G. Audio — lo que ya se sabe, para cuando se autorice

**No se construye ahora.** Queda escrito para no redescubrirlo:

- La grabación es **un objeto aparte** de la clase: si falla, la clase sigue; se borra sin borrar
  apuntes ni marcas.
- **Bucket privado, URL firmada**, como la `Evidence`. Nunca audio en una columna.
- **Hipótesis a medir con un prototipo, no afirmaciones:** `MediaRecorder` graba en formatos distintos
  en Chrome y en Safari; en iOS la grabación puede cortarse con la pantalla bloqueada o la pestaña en
  segundo plano; si el grabador vive en la pantalla se corta al navegar, así que tiene que vivir en el
  shell; cerrar la pestaña no garantiza el upload, así que se sube por partes.
- **Grabar se inicia con una acción explícita**, nunca al entrar, y sin permiso de micrófono la clase
  funciona igual.
