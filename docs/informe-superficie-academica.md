# Informe técnico — la superficie académica, de solo lectura

**Documento:** `docs/informe-superficie-academica.md`
**Para:** Product Owner
**De:** equipo Plataforma
**Fecha:** 8 de septiembre de 2026
**Ejecuta:** [ADR-076](decisions.md#adr-076) §6.
**Qué es:** **un informe. No se escribió una línea de código de producto para producirlo**, y no hay
migración, push, merge ni deploy asociados.

---

## 0. La corrección, antes que nada

El planteo anterior decía *"el backend ya existe: son las nueve rutas. Lo que falta es la pantalla"*.
**Es falso, y el owner lo señaló antes de que el informe lo midiera.**

La medición encontró las seis faltas que él anticipó —consultas agrupadas, detección de duplicados,
reglas de fusión, permisos, auditoría y estados de procedencia— **y una séptima que nadie había
nombrado**:

> ⛔ **De las nueve rutas humanas, exactamente UNA opera sobre contenido.** Las otras ocho tienen como
> sujeto a un estudiante concreto, así que **no son el backend de esta superficie**: son el backend de
> la del coach, y están bloqueadas por [ADR-006](decisions.md#adr-006).

---

## 1. ¿Cuáles de las operaciones necesarias ya están soportadas?

Las cinco de [ADR-076](decisions.md#adr-076) §3, medidas contra el código:

| Operación | Detección | Escritura | Estado |
|---|---|---|---|
| 1 · Aprobar/descartar **prerequisitos** propuestos | ❌ no existe | 🟡 sólo `ingerir_materia`, que **reemplaza todo** | **No soportada** |
| 2 · Confirmar filas que **parezcan evaluaciones** | ❌ no existe en código | 🟡 sólo la ingesta; `session_kind` **no tiene escritor** en `app/` ni `lib/` | **No soportada** |
| 3 · Resolver **duplicados** de una comisión | ❌ no existe | 🟡 `corroborar_procedencia()` puede marcar `disputed`, pero **no fusionar** | **Parcial** |
| 4 · Revisar **cargas de estudio** declaradas | ❌ no existe | 🟡 sólo la ingesta, que reemplaza | **No soportada** |
| 5 · Recibir **señales de calibración** | ✅ `revisionDeCalibracion()` | ❌ **no se persiste en ninguna tabla** | **No soportada** |

**Cero de cinco soportadas de punta a punta. Una parcial.**

⚠️ **Y el patrón detrás de las cuatro «no soportadas» es el mismo:** la única forma de escribir
contenido académico hoy es `ingerir_materia`, que **reemplaza la cursada entera**. Sirve para cargar
material; **no sirve para curar**, porque curar es cambiar una fila sin tocar las demás.

---

## 2. ¿Qué consultas, agregaciones y read models faltan?

**Hay 57 funciones en la base. Todas las de lectura menos una están scopeadas a un estudiante o a una
cursada.**

La excepción es `candidatos_de_modo_examen(institution_id, limite)`, que sí cruza estudiantes — y
existe para el reloj, no para una persona.

**Una cola académica necesita el eje que no existe: la comisión.**

| Read model que falta | Qué tendría que devolver |
|---|---|
| `clases_a_clasificar(offering)` | Filas de `class_session` cuyo tema **parece** una evaluación, con su `session_kind` actual. La regla está caracterizada —25% de falsos positivos medidos— y **no está en código** |
| `evaluaciones_duplicadas(offering)` | Grupos de `assessment` de la misma comisión con `declared_by` distinto y tipo/fecha compatibles |
| `prerequisitos_propuestos(offering)` | Pares derivados del orden dictado que **no** están en `topic_prerequisite` |
| `cargas_declaradas(institution)` | Comisiones con `declared_study_min` cargado, con su texto de origen |
| `calibraciones_a_revisar(institution)` | ⚠️ **Sólo si se puede despersonalizar** — ver §6 |

⚠️ **Ninguno es una consulta trivial sobre lo que hay.** Tres de los cinco necesitan **derivar** algo
que hoy se calcula en TypeScript por estudiante, y llevarlo a un eje por comisión — que es
exactamente el trabajo que el planteo anterior daba por hecho.

---

## 3. ¿Cómo funcionaría la fusión de evaluaciones duplicadas?

**Hoy no funciona de ninguna manera: no hay detección ni fusión.**

### Lo que hay

`assessment` con `declared_by`, **sin `UNIQUE`** — decisión deliberada de
[ADR-067](decisions.md#adr-067): un `UNIQUE` haría que el error de tipeo de uno le bloquee la carga al
otro.

### Qué haría falta, y dónde se pone difícil

**La detección es lo fácil**: misma comisión, mismo `assessment_type`, fechas iguales o cercanas.

**La fusión es lo difícil, y por tres razones concretas:**

1. **`assessment` tiene dependientes.** `assessment_topic` (el alcance), `exam_preparation` con
   `UNIQUE (student_id, assessment_id)`, y `preparation_readiness` colgando de ésa. Fusionar dos filas
   obliga a decidir qué pasa con las preparaciones que ya cuelgan de la que se descarta.
2. **`exam_preparation` puede estar `ACTIVE`.** Descartar la fila de la que cuelga una preparación
   activa le rompe el Modo Examen a alguien **en el medio de estudiar**.
3. **Fusionar es una elevación de procedencia disfrazada.** Decir *"éstas dos son la misma"* es una
   afirmación sobre el mundo, y `I9` exige que eso sea una operación explícita. **Debería pasar por
   `corroborar_procedencia()`**, no por un `UPDATE`.

> **Recomendación:** no fusionar en el primer corte. **Marcar `disputed` la que sobra** —que
> `corroborar_procedencia()` ya sabe hacer— y dejar que la fusión real espere a que exista el
> caso. Un `disputed` es reversible; un `DELETE` con dependientes, no.

---

## 4. ¿Qué permisos y auditoría hacen falta?

### Permisos: **hoy no hay roles. Hay un secreto.**

Las nueve rutas humanas se protegen con `esSecretoDeServicio()`, que compara en tiempo constante
contra **una sola variable de entorno**.

⚠️ **Consecuencia directa sobre §1 de ADR-076:** el curador académico y el coach presentarían **la
misma credencial**. El sistema no puede distinguirlos, y por lo tanto **no puede sostener hoy** la
regla que el owner mantuvo:

> *"Nadie valida su propia evidencia o propuesta."*

**Lo que falta:** identidad por actor, un vocabulario de capacidades, y que la ruta compruebe la
capacidad — no el secreto.

### Auditoría: **la tabla existe y casi nadie la escribe**

`audit_log` tiene `actor_id`, `action`, `target_type`, `target_id`, `before_value`, `after_value`.
Es la forma correcta. Pero:

⚠️ **`actor_id` viaja en el cuerpo del request.** El propio encabezado de `/api/corroboracion` lo dice:
*"del otro lado **no hay una persona autenticada**, y `corroboradoPor` viaja"*. Es decir: **el actor
es lo que el llamador dice que es.** Para datos sintéticos alcanza; para una acción de curación con
consecuencias, no.

**Lo que falta:** que el actor salga de la credencial, no del cuerpo.

---

## 5. ¿Qué rutas trabajan sobre contenido y cuáles sobre estudiantes?

**Éste es el hallazgo que más cambia el plan.**

| Ruta | Sujeto | ¿Sirve a la superficie académica? |
|---|---|---|
| `POST /api/corroboracion` | `class_session`, `assessment`, `class_event_record`, `assessment_criterion`, `learning_objective` | ✅ **Sí. Es la única.** |
| `POST /api/validacion` | La evidencia de un estudiante | ❌ Es del coach |
| `POST /api/pedido-de-reenvio` | Ídem | ❌ Es del coach |
| `POST /api/observacion` · `/correccion` | Errores en la preparación de un estudiante | ❌ Es del coach |
| `POST /api/revision-temprana` | Preparación de un estudiante | ❌ Es del coach |
| `POST /api/apoyo` | Ídem | ❌ Es del coach |
| `POST /api/examen/reentrada/propuesta` | Ídem | ❌ Es del coach |
| `GET /api/escalamiento` | Cola de estudiantes | ❌ Es del coach, y ya se declara sintética |

> ⛔ **Una de nueve.** El planteo anterior contó las nueve como si fueran el backend de esta
> superficie. **Ocho pertenecen a la superficie del coach**, que es la que ADR-006 bloquea — y por
> eso *"el backend ya existe"* era exactamente al revés de la verdad: **el backend que existe es el
> del rol que no se puede construir.**

---

## 6. ¿Qué cambios de estado puede hacer Achieve sin atribuir carácter oficial?

✅ **La restricción del owner ya está enforced, y desde antes de que la pidiera.**

`corroborar_procedencia()` rechaza `official` con su motivo:

```
nadie puede declarar official: hace falta autenticar a la institución (C01-030, OPEN)
```

Y rechaza también volver a `unverified`: *"bajar a «nadie lo miró» borraría que alguien lo miró"*.

**Lo que Achieve puede hacer hoy, sobre cinco tablas de contenido:**

| Transición | ¿Permitida? |
|---|---|
| `unverified → corroborated` | ✅ Es exactamente *"curado por Achieve"* |
| `unverified → disputed` · `corroborated → disputed` | ✅ |
| `→ official` | ⛔ **Rechazada con su razón** |
| `→ unverified` | ⛔ Rechazada |

**El vocabulario de tres niveles que pidió el owner ya existe.** Su decisión no agrega una columna:
**confirma la que hay y prohíbe el atajo.**

⚠️ **Y una cosa que NO puede hacer y hace falta para la operación 2:** `session_kind` **no lleva
`verification_status`**. Confirmar que una fila fue un parcial no es una corroboración de procedencia:
es un dato nuevo sobre la fila. Hoy sólo lo escribe `ingerir_materia`.

### Sobre la operación 5 — las señales de calibración

El owner la condicionó: *"sólo cuando puedan presentarse sin identificar a un estudiante"*.

⚠️ **Con la regla actual, no se puede.** `revisionDeCalibracion()` mira **las últimas cinco
observaciones de una persona**: el patrón *es* de esa persona. Despersonalizarla exigiría agregarla
—*"la estimación de esta unidad se está pasando para varios"*— y **esa regla no existe y no es la que
escribió la psicopedagoga**.

> **Recomendación: la operación 5 queda fuera del primer corte**, y su despersonalización se le
> pregunta a ella antes de intentarla.

---

## 7. El primer corte vertical que propongo

**Confirmar qué filas del libro de temas fueron una evaluación** — la operación 2.

### Por qué ésta

| | |
|---|---|
| **Cero datos personales** | `class_session` cuelga de una comisión. No hay estudiante en ninguna parte de la operación |
| **La regla ya está caracterizada** | 25% de falsos positivos medidos sobre 88 candidatos del corpus real |
| **Desbloquea un ADR ya decidido** | [ADR-069](decisions.md#adr-069) dice *"se propone y una persona confirma"*, y esa persona no existía |
| **No necesita fusión ni dependientes** | Es una columna en una fila. Nada cuelga de ella |
| **Es verificable de punta a punta** | El resultado se ve en el Gantt: un parcial mal clasificado le atribuye sus minutos a las unidades que evaluaba |

### Qué incluiría

1. **Un read model**: `clases_a_clasificar(offering)` — filas cuyo tema matchea el patrón, con su
   `session_kind` actual y el texto que las hizo candidatas.
2. **Un escritor angosto**: fijar `session_kind` de **una** fila, sin tocar nada más — porque hoy la
   única forma es `ingerir_materia`, que reemplaza la cursada entera.
3. **Identidad de actor real**, y no en el cuerpo del request. Es el pedazo más chico de §4 que se
   puede hacer sin construir todo el modelo de capacidades.
4. **Una pantalla interna**, fuera del registro canónico ([ADR-076](decisions.md#adr-076) §5).

### Qué dejaría explícitamente afuera

- **La fusión de duplicados** — §3: `disputed` primero, fusión cuando exista el caso.
- **Las señales de calibración** — §6: no se pueden despersonalizar con la regla actual.
- **Los prerequisitos** — necesitan generar y persistir propuestas, que es una tabla nueva.
- **El modelo completo de capacidades** — el corte necesita distinguir *un* actor, no cinco roles.

---

## 8. Lo que este informe no hace

⛔ **No implementa nada.** No hay migración, no hay ruta nueva, no hay pantalla. No se hizo push,
merge ni deploy, y no se hará hasta nueva autorización ([ADR-076](decisions.md#adr-076) §6).

⚠️ **Y una advertencia sobre el costo, que era el punto del owner.** Aun el corte más chico de §7
toca **identidad de actor**, que hoy no existe. Es la pieza que el planteo anterior no vio, y la que
hace que *"falta la pantalla"* fuera una subestimación: **falta saber quién es el que aprieta el
botón.**
