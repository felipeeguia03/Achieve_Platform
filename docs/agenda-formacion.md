# Dos decisiones que esperan al owner · la pantalla de Formación

**Documento:** `docs/agenda-formacion.md`
**Para:** el owner. Una de las dos conviene consultarla con la psicopedagoga.
**Estado del trabajo:** [ADR-087](decisions.md#adr-087) está escrito y `PROPOSED`. **No se escribió
código todavía**, a pedido del owner: *"ADR primero, después código"*.
**Qué destraba:** sin estas dos, la superficie no se puede construir sin inventar una regla de
negocio — y eso lo prohíbe la regla 1 de [`CLAUDE.md`](../CLAUDE.md).

---

## 0. Las dos, en una tabla

| # | La pregunta | Por qué no la puede contestar el equipo técnico |
|---|---|---|
| **1** | **¿A quién se le muestra la biblioteca?** | El spec la condiciona a que el alumno **sea autónomo**, y eso lo determina el Student Model, que **no existe**. Elegir un sustituto es inventar la regla |
| **2** | **¿La pieza de Formación produce evidencia, y cómo?** | Cada una pide una evidencia concreta, y el esquema **no admite** una acción que no cuelgue de una cursada |

---

## 1. De dónde sale esto

`Formación` apareció como ítem de menú en un mockup del owner, junto a `Calendario` y
`Mi seguimiento`, y **se difirió tres veces**:

- [`gantt-de-preparacion.md`](gantt-de-preparacion.md) §7 — *"son dos productos separados que
  aparecieron en el mismo mockup"*
- [`cursado-de-materia.md`](cursado-de-materia.md) §5 — *"afuera por ahora"*
- [ADR-085](decisions.md#adr-085) — *"quedaron afuera por decisión del owner"*

El 10 de septiembre de 2026 el owner pidió construirla, y trajo el contenido.

---

## 2. Lo que ya está decidido, y no se reabre

**Del spec original** (`product-spec-source.md`, que no se edita), §13 · *Formación*:

> Formación es aplicada y adaptativa; **no una videoteca pasiva**.
> **Autónomo: biblioteca + recomendaciones contextuales.**

> Para primer año, lo obligatorio debe tender a ser **microintervención contextual y aplicada, no
> curso lineal** previo a usar el producto.

Y §3.9 la define en una línea: **contenido → aplicación real → evidencia → feedback.**

**Del owner, el 10 de septiembre:**

| decisión | consecuencia |
|---|---|
| Es la **biblioteca del alumno autónomo** | Es el único caso que el §13 habilita. La microintervención de primer año queda afuera |
| **Entidad nueva**, no se cuelga de `resource` | `resource` está atada a cursada y tema; el material de método no es de ninguna materia |
| **El ADR primero** | Este documento |

**Y del contenido que llegó** — [`formacion-prioridad-maxima-source.md`](formacion-prioridad-maxima-source.md):
las cinco piezas traen **las mismas seis partes** (título, problema, objetivo, explicación, acción
posterior, evidencia, material), que es literalmente la forma que pide el §3.9.

---

## 3. Decisión 1 · ¿A quién se le muestra?

### La pregunta

¿La biblioteca aparece en el menú para todos, para algunos, o no aparece en el menú?

### El contexto que importa

El §13 **no dice** *"hay una biblioteca"*. Dice **"Autónomo: biblioteca"** — es condicional. Y el
§539 aclara quién determina eso:

> El Student Model puede determinar cuánto acompañamiento y conducción necesita cada persona. Primer
> año, recursantes o estudiantes en riesgo pueden recibir mayor estructura; **alumnos autónomos,
> menor intervención.**

⚠️ **Ese Student Model no existe.** La tabla `student` tiene ocho columnas —`id`, `institution_id`,
`auth_user_id`, `timezone`, `whatsapp`, `created_at`, `availability_declared_at`,
`time_calibration_enabled`— y **ninguna dice cuánto andamiaje necesita la persona**.

Sin eso, poner el ítem en el menú **le da la biblioteca completa a un ingresante el primer día**, que
es exactamente lo que `D23` descarta.

### Opciones

| | qué implica | costo |
|---|---|---|
| **A · A todos** | Lo más simple. Un ingresante ve todo el catálogo desde el día uno | Se aleja del §13 y contradice `D23` |
| **B · Detrás de un hecho observable** | Sin Student Model, el sustituto tendría que ser algo que ya existe: ¿evidencias validadas?, ¿compromisos cumplidos?, ¿tiempo en la plataforma? | **Elegir el sustituto es inventar la regla.** Es de la psicopedagoga |
| **C · Sin ítem de menú** | La biblioteca existe y se entra desde un paso del protocolo (`WF-S11` ya la referencia) o desde un bloqueo | Respeta el §13 entero, y **no construye la pantalla que el owner pidió** |

### Qué NO decide

No decide si algún día habrá Student Model. Decide qué hacer **mientras no lo haya**.

---

## 4. Decisión 2 · ¿La pieza produce evidencia?

### La pregunta

Cada una de las cinco piezas termina pidiendo algo concreto —*"foto del primer paso"*, *"audio
cortito sin consultar apuntes"*, *"un cuestionario o ejercicio"*, *"mensaje contando el tiempo sin
celular"*—. ¿Eso se recoge, y dónde queda?

### El contexto que importa

Verificado contra el esquema:

```
action.course_enrollment_id  →  NOT NULL
evidence.action_id           →  NOT NULL
```

⚠️ **Una pieza de Formación no puede producir una acción ni una evidencia sin colgar de una
cursada**, y Formación no es de ninguna materia.

### Opciones

| | qué implica | costo |
|---|---|---|
| **A · Hacer la columna nullable** | `Action` deja de necesitar cursada | Toca la tabla más central del dominio; **todas** las lecturas asumen que la tiene |
| **B · La pieza se aplica a una materia que el estudiante elige** ⭐ | *"Aplicá esto a Bases de Datos"*. La maquinaria de `Action`/`Evidence` sirve **sin tocar el esquema** | Hay que elegir la materia, que es un paso más en la pantalla |
| **C · v1 sin evidencia** | La pieza enuncia qué evidencia correspondería y no la recoge | Deja el §3.9 a medias: hay contenido, no hay aplicación |

### Recomendación del equipo: `B`

**Y la sugiere el propio contenido.** La pieza 2 dice *"simplificar el programa"* — ¿de qué materia?
La 1 dice *"definir una microacción"* — ¿sobre qué? Están escritas para aplicarse a una materia
concreta. Con `B` la *"aplicación real"* del §3.9 se vuelve literal, no hay migración de riesgo y no
se debilita un `NOT NULL` que hoy protege a todo el dominio.

---

## 5. Dos cosas que hay que confirmarle a la psicopedagoga

No son decisiones del owner, pero **bloquean lo mismo**:

⚠️ **Los videos no existen.** La autora lo dice en el encabezado del documento: *"son 5, faltan los
guiones"*. Se puede construir todo lo que rodea al video —problema, explicación, acción, evidencia,
material— y **omitir el video en vez de fingirlo**. Conviene que ella sepa que va a salir así.

⚠️ **La vigencia del texto no está confirmada.** Igual que el índice temático y que el protocolo de
examen: **recibido no es aprobado**. Es su contenido y va a aparecer con su voz en la pantalla de un
estudiante.

> Los tipeos del original **se conservan y no se corrigen** —precedente de
> [ADR-031](decisions.md#adr-031)—, y hay test que rompe si alguien los "arregla".

---

## 6. Qué pasa después de decidir

Con las dos respuestas, el orden de construcción es:

1. Firmar [ADR-087](decisions.md#adr-087) con las dos decisiones incorporadas
2. Migración: la entidad, con las seis partes que dicta el contenido y su procedencia
3. Cargar las cinco piezas desde la fuente literal
4. Nodo, ruta y proyección — con `wireframe: null`, para que **sigan siendo nueve superficies**
5. La pantalla, con su copy y sus guards
6. Las cinco puertas: `lint`, `typecheck`, `build`, `test`, `db:verify`

---

## 7. Lo que este documento no decide

- **La microintervención contextual de primer año.** Es la otra mitad del §13, define obligatoriedad
  sobre personas y es de la psicopedagoga.
- **Quién escribe el contenido futuro.** Las cinco piezas son de ella; el resto del índice —17 áreas—
  no está escrito.
- **`Calendario` y `Mi seguimiento`.** Siguen diferidos.
- **[ADR-006](decisions.md#adr-006).** Sigue `PROVISIONAL`, y nada de esto lo toca.
