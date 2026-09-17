# El catálogo curricular, como entrada administrativa

**Rol:** los CSV que alimentan `ingerir_plan_de_estudios()`.
**No son la fuente de verdad en runtime.** Lo que el alta lee es **lo que quedó en Postgres**; esto
es lo que se importa para que quede ahí.

```bash
npm run db:catalogo      # importa los cuatro archivos. Idempotente.
```

Es lo que el spec pone como *"Importación institucional CSV"* (§26.2, *Should have*) y lo que su
propio guardarraíl respalda: *"ninguna integración profunda debe bloquear el primer piloto **si
CSV/formulario resuelve el caso**"*.

---

## Los cuatro archivos

| Archivo | Institución · carrera · plan | Estado | Qué es |
|---|---|---|---|
| `syn-universidad-syn.csv` | `SYN-U` · Ingeniería Sintética · `SYN-2016` **y** Ingeniería Sintética Aplicada · `SYN-2021` | **PUBLISHED** | El dataset del recorrido. Dos **carreras sucesoras** en la misma institución, para que se vea que no se mezclan |
| `syn-instituto-syn-2.csv` | `SYN-I2` · Ingeniería Sintética del Instituto · `SYN2-2020` | **PUBLISHED** | Segunda institución. Existe para verificar aislamiento |
| `ucc-ingenieria-de-sistemas-2016.csv` | `UCC` · `08` Ingeniería de Sistemas · `2016` | **DRAFT** | Los 57 requisitos, transcritos de un analítico. **No se le ofrece a nadie** |
| `ucc-ingenieria-en-informatica.csv` | `UCC` · Ingeniería en Informática · `web-2026` | **DRAFT** | El plan de la web pública. **Carrera separada**, nunca mezclada con el 2016 |

> **Publicar no es un efecto secundario de agregar un archivo.** La lista de lo que se publica está
> escrita a mano en `scripts/importar-catalogo.mjs`, con el motivo de cada uno, y
> `publicar_plan_de_estudios()` **rechaza publicar un plan con requisitos `needs_review`**.

---

## Las columnas

| Columna | Qué es |
|---|---|
| `institution_key` · `institution_name` | Clave estable + nombre. La clave es lo que evita duplicar al reimportar |
| `academic_unit_key` · `academic_unit_name` | La facultad. **Vacío = la fuente no la declara**, y no se infiere |
| `program_key` · `program_name` | La carrera |
| `plan_code` | La versión del plan. Se mapea a `curriculum_plan.version`, que ya era eso |
| `plan_valid_from` · `plan_valid_to` | Vigencia. Vacío = sin declarar |
| `requirement_ordinal` | El orden de la fuente. **NO es el año** |
| `subject_code` · `subject_name` | Código y **texto visible**. Si la fuente lo trae cortado, entra cortado |
| `requirement_type` | `COURSE` · `ELECTIVE_SLOT` · `SEMINAR_SLOT` · `LANGUAGE_REQUIREMENT` · `PROFESSIONAL_PRACTICE` · `CAPSTONE` · `UNKNOWN` |
| `curriculum_year` | **Vacío = desconocido.** Nunca se deriva del `ordinal` |
| `year_source` | Qué se vio para afirmar el año, y qué no se pudo leer |
| `term` · `is_annual` | El semestre y si es anual. Vacío = desconocido |
| `min_options` · `max_options` | Del cupo electivo. Vacío = sin declarar, **no cero** |
| `label_truncated` | El nombre está cortado en la fuente |
| `elective_for` | El **código del cupo** que esta materia puede satisfacer. Se resuelve en una segunda pasada; si el cupo no existe, la importación falla |
| `needs_review` | **`true` bloquea la publicación.** Es la regla de ADR-053 puesta donde no se puede saltear |
| `source_type` | `institution` · `instructor` · `student` · `community` · `public_web` · `inference` |
| `source_reference` | URL o documento. **Obligatorio y no vacío:** *"lo dijo alguien"* no se puede volver a mirar |

Sólo un `requirement_type = COURSE` crea una fila en `course`. Por eso el importador reporta
**requisitos y materias por separado**, y en el Plan 2016 los números no coinciden: 57 y 51.

---

## El Plan 2016 de la UCC — qué se transcribió y qué no

[ADR-053](../docs/decisions.md#adr-053). **57 requisitos**, `DRAFT`, `needs_review = true` en las 57.

**Ningún dato personal cruzó al repositorio.** El analítico contiene nombre, domicilio, matrícula y
documento; se extrajo **únicamente la estructura curricular**, y este archivo no tiene una columna
donde pudieran entrar.

**El año sale de un dato visible, no de una inferencia.** El analítico muestra una columna angosta
con marcadores `1·2·3·4·5` alineados a las filas 1, 11, 22, 35 y 46 — grupos de 10, 11, 13, 11 y 12,
que suman 57. **El encabezado de esa columna no es legible**, así que cada fila lleva escrito:

```
year_source = "agrupamiento visible en el analítico; encabezado de columna no legible"
```

**Diez nombres entran cortados**, con `label_truncated = true` y sin completar: `FUNDAMENTOS DE
PROGRAMACIO…` · `LABORATORIO DE COMPUTACION (…` (dos, con códigos distintos) · `LENGUAJES FORMALES Y
AUTOMA…` · `ARQUITECTURA COMPUTADORAS` (dos, con códigos distintos y numeral ilegible) · `ETICA Y
DEONTOLOGIA PROFESION…` · `SEMINARIO DE FORMACION HUMAN…` (dos, **sin asumir cuál es I y cuál es
II**) · `ADMINISTR. PROY. DE SOFTWARE…`.

**Los seis requisitos que no son materias:**

| # | Código | Texto visible | Tipo |
|---|---|---|---|
| 31 | 20180 | `ELECTIVA I` | `ELECTIVE_SLOT` |
| 38 | 10203 | `ELECTIVA II` | `ELECTIVE_SLOT` |
| 54 | 20186 | `SEMINARIO` | **`UNKNOWN`** — no se sabe si es asignatura o cupo |
| 55 | 00299 | `PRACTICA PROF. SUPERVISADA` | `PROFESSIONAL_PRACTICE` |
| 56 | 00324 | `ACRED. INGLES` | `LANGUAGE_REQUIREMENT` |
| 57 | 00301 | `TRABAJO FINAL` | `CAPSTONE` |

⚠️ Las dos de **Formación Humana** (47 y 51) tienen código propio y entran como `COURSE`: **no son**
el `SEMINARIO` genérico de la 54.

**Lo que las imágenes no permiten determinar, y no se inventó:** el encabezado de la columna del año
· el texto completo de las diez filas cortadas · el numeral de las dos de Formación Humana · si
`SEMINARIO` (54) es asignatura o cupo · el semestre de cualquier fila · correlativas · créditos ·
qué materias satisfacen `ELECTIVA I` y `ELECTIVA II` · equivalencias con Ingeniería en Informática.

**Qué falta para publicarlo:** el plan de estudios oficial del Plan 2016 —PDF, CSV o resolución— con
**año y semestre por materia y los nombres completos**. Está registrado como `C01-052`, y la
autorización para usarlo es `C01-042`.

---

## Ingeniería en Informática — por qué es otra carrera

74 filas, `DRAFT`, `curriculum_year` **vacío en todas**: la página pública no declara el año de
ninguna materia. **No se mezcla con el Plan 2016**: son dos `academic_program` distintos, y el
propio importador no tiene forma de cruzarlos.

El área de conocimiento a la que pertenece cada fila —*Matemática*, *Programación y Datos*,
*Ingeniería de Software*…— viaja dentro de `source_reference`, que es donde se dice de qué parte de
la fuente salió el dato. **No se modela como estructura** todavía: agrupar por área es una decisión
curricular, no una de formato.

Las doce líneas de **Fe y Vida (optativos)** entran como `UNKNOWN`: la página las rotula
*"optativos"* y **no dice cuántas son obligatorias**, así que no se puede afirmar si cada línea es un
requisito o una opción de un cupo. `UNKNOWN` es exactamente eso.

---

## Antes de agregar un archivo

1. **Nunca un dato personal.** Ni en una columna, ni en `source_reference`.
2. **`needs_review = true` mientras la fuente no esté corroborada.** Un plan con una sola fila sin
   revisar no se publica, y eso es una garantía de la base, no una convención.
3. **Una fuente sin referencia concreta se rechaza.** La función levanta.
4. **Publicarlo exige agregarlo a `SE_PUBLICAN` en el script, con su motivo.**
5. **Datos reales de una persona siguen bloqueados** por
   [ADR-006](../docs/decisions.md#adr-006), que es el único bloqueo absoluto del proyecto.
