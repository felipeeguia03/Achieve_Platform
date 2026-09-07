# Inventario del corpus — programas y libros de temas, Ing. en Sistemas Plan 2016

**Documento:** `docs/inventario-corpus.md`
**Para:** Product Owner
**De:** equipo Plataforma
**Fecha:** 7 de septiembre de 2026
**Fuente:** 113 PDF en `Plataforma/docs/temas/`, extraídos con PDFKit y contados por script.
**Ejecuta:** el punto 2 de [`gantt-de-preparacion.md`](gantt-de-preparacion.md) §12.

> ⚠️ **Ningún archivo de este corpus entra al repositorio.** Este documento contiene **conteos y
> estructura**, nunca contenido: sin nombres de docentes, sin nombres de estudiantes, sin legajos.
> Ver §5.

---

## 1. Qué hay

| | Cantidad |
|---|---|
| PDF totales | **113** |
| Libros de temas | **80** |
| Programas de cátedra | **32** |
| Ficha del alumno *(dato personal real)* | **1** |
| **Materias identificables** | **36** |

El Plan 2016 tiene más materias que eso: el corpus es una muestra grande, no el plan completo.

| Cobertura por materia | Materias |
|---|---|
| Libro **y** programa | **20** |
| Sólo libro de temas | **8** |
| Sólo programa | **8** |

---

## 2. El hallazgo que más cambia el diseño de ingesta

**46 de los 80 libros de temas no dicen de qué materia son.**

No es un problema de extracción: es una diferencia sistemática entre las dos corridas.

| Corrida | Libros | Traen encabezado *(Asignatura, código, Horario, Cátedra/Comisión, Dictado)* |
|---|---|---|
| `[PRACTICOS]` | 34 | **34 — todos** |
| `[TEORICOS]` | 46 | **3** |

Un libro teórico típico trae **sólo las filas de clase**: número, fecha, hora, día, `TEORICO`, tipo,
docente y el texto del tema. Ni asignatura, ni código, ni cátedra, ni dictado, ni carga horaria.

> ⚠️ **Consecuencia directa sobre la ingesta:** un libro teórico **no se puede atribuir solo**. Quien
> lo sube tiene que decir a qué materia pertenece, y eso convierte a la mitad del corpus en un caso
> de **ingesta asistida** —la Etapa B2b.1, que ya está completa— y no de importación automática.

Y hay una tercera modalidad que el esquema todavía no contempla: además de `TEORICO` y `PRACTICO`,
las filas usan **`TEORICO-PRACTICO`**. Aparece mezclada dentro de una misma corrida.

---

## 3. Cuántas materias pueden tener un Gantt completo

Una materia necesita **dos** fuentes: temas y duración.

| | Materias | % |
|---|---|---|
| Con fuente de **temas** *(unidades del programa o temas dictados)* | 30 / 36 | 83% |
| Con fuente de **duración** *(`Horario:` o carga horaria del programa)* | 24 / 36 | 67% |
| **Con las dos → Gantt completo** | **23 / 36** | **64%** |
| **Degradadas** | **13 / 36** | **36%** |

**La respuesta a la pregunta abierta en `gantt-de-preparacion.md` §12 es: no, pero un tercio.**

El estado degradado no es la vista principal —el Gantt es viable para dos de cada tres materias— pero
**tampoco es un caso borde que se pueda resolver con un cartelito**. Con 36% hay que diseñarlo bien.

Las 12 materias sin ninguna fuente de duración: `ADMINISTRACIÓN DE PROYECTOS DE SOFTWARE`,
`ANÁLISIS MATEMÁTICO II`, `ANÁLISIS NUMÉRICO`, `ANTROPOLOGÍA`, `ESTADÍSTICA Y PROBABILIDAD`,
`FÍSICA II`, `FÍSICA III`, `INGENIERÍA DE SOFTWARE II`, `LABORATORIO DE COMPUTACIÓN I`,
`PENSAMIENTO FILOSÓFICO`, `REDES TELEINFORMÁTICAS II`, `SISTEMAS DE REPRESENTACIÓN`.

---

## 4. El conteo de clases declarado es inservible, y ahora hay números

`Horario: … (120 MIN.) [ 30 CLASE/S ]` trae dos datos de calidad muy distinta. Los minutos sirven.
**El conteo de clases, no.**

| Materia | Declara | Registra | |
|---|---|---|---|
| `ANÁLISIS MATEMÁTICO I` | 60 | **24** | ❌ 40% |
| `INGENIERÍA DE SOFTWARE I` | 30 | **14** | ❌ 47% |
| `SISTEMAS DE INFORMACIÓN` | 30 | **14** | ❌ 47% |
| `ORG. Y ADM. DE EMPRESAS` | 30 | **13** | ❌ 43% |
| `ÁLGEBRA Y GEOMETRÍA` | 30 | 31 | ✅ |
| `LÓGICA Y MAT. DISCRETA` | 30 | 30 | ✅ |
| `MODELOS Y SIMULACIÓN` | 15 | 16 | ✅ |

**No hay un factor de corrección**: unas coinciden y otras están a la mitad. La regla es leer las
filas, no el encabezado.

### Los minutos declarados

Sólo aparecen en 17 de las 36 materias, y toman **tres valores**: `60`, `120` y `180`. Donde el
`Horario:` falta, la duración sale de la carga horaria del programa —`60 horas`, `30 horas`, `26 Hs`,
`3 horas prácticas + 2 teóricas`, cada materia con su formato— y donde faltan las dos, no hay
duración y **no se inventa**.

---

## 5. El archivo que no entra al repositorio

`56978999.pdf` es la **ficha del alumno**: nombre completo, DNI, legajo, número de alumno, carrera y
plan, y el historial académico con notas, fechas y actas.

> ⛔ **Sirvió como insumo de diseño. No entra al repositorio.** Ni como fixture, ni como seed, ni como
> caso de prueba, ni parafraseado. [ADR-006](decisions.md#adr-006) sigue en
> `PROVISIONAL — LEGAL CONFIRMATION REQUIRED`.

Y hay un segundo dato personal que es fácil pasar por alto: **los 80 libros de temas traen nombre y
legajo del docente en cada fila**, y varios traen el conteo de alumnos de la comisión. Si alguna vez
se importa un libro, **la columna del docente no se copia**: `class_session` no tiene dónde ponerla y
no hay que agregarle un lugar.

---

## 6. Qué se decide a partir de esto

| Hallazgo | Consecuencia |
|---|---|
| 46 libros sin encabezado | La ingesta de libros teóricos **es asistida**, no automática |
| `TEORICO-PRACTICO` existe | El `CHECK` de `stream` lleva **tres** valores, no dos |
| Conteo de clases no confiable | La duración se calcula **por filas**, nunca por el encabezado |
| 13 materias degradadas de 36 | El estado degradado se diseña en serio, no como excepción |
| Docente en cada fila | El importador **descarta** esa columna |
