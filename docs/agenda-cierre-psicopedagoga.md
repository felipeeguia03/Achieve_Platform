# Agenda de cierre — los ocho residuos psicopedagógicos

**Documento:** `docs/agenda-cierre-psicopedagoga.md`
**Fecha:** 1 de septiembre de 2026
**Con:** la psicopedagoga que respondió las ocho `HUMAN-P0` el 31 de agosto de 2026.
**Origen:** [ADR-025](decisions.md#adr-025). La fuente literal de sus respuestas está en
[`human-p0-source.md`](human-p0-source.md), y **manda sobre cualquier paráfrasis, incluida esta**.

---

## Por qué esta reunión

La hoja que respondiste era **previa a una reunión de cierre que el propio cuestionario anunciaba**.
Alcanzó para cerrar el criterio principal de las ocho —y con eso se desbloqueó el contenido de la
fase de Modo Examen—, pero cada respuesta dejó **una pregunta abierta**. Esas ocho son la agenda.

**Ninguna se puede inferir del resto.** El equipo tiene prohibido por regla explícita elegir por vos:
lo que no está respondido, se pregunta.

## Cómo queremos registrar cada respuesta

Para que la regla se pueda programar sin interpretarla, y sobre todo para que se pueda **revisar
después**, cada una queda como:

| Campo | Qué es |
|---|---|
| **Decisión** | Qué se hace |
| **Fundamento** | Por qué. Es lo que permite revisarla sin volver a discutir todo |
| **Regla operativa** | Cómo se traduce a algo que el sistema pueda hacer |
| **Excepciones** | Cuándo no aplica |
| **Señal observable** | Qué tiene que ver el sistema para saber que aplica |
| **Momento de intervención humana** | Cuándo deja de ser automático |
| **Responsable** | Quién decide en ese momento |
| **Condición para revisar la regla** | Qué tendría que pasar para volver a mirarla |

---

## Antes que las ocho: dos frases sobre el Roadmap ⭐

**Es lo más corto de la lista y lo que más destraba.** El 1 de septiembre llegó tu documento *Roadmap
Modo Examen*, con los veinte pasos desarrollados. Se cargó tal cual —sin corregir una palabra, ni
siquiera los tipeos— y **está corriendo**, pero rotulado en la pantalla del estudiante como *"texto de
la psicopedagoga · vigencia todavía sin confirmar"*, porque no tenemos tu confirmación escrita.

> **1. ¿Ese documento es la versión vigente de los veinte pasos, y podemos usar esos textos como
> fuente profesional del producto?**
>
> **2. En tu respuesta del cuestionario dijiste que «entre los puntos 9 al 18 el recorrido no es
> lineal ni rígido». Cargamos los diez como repetibles. ¿Es así, o sólo se repiten el 14 —corregir y
> volver a demostrar— y el 15 —repasos distribuidos—?**

La segunda importa porque **el sistema ya distingue las dos cosas**: un paso marcado como repetible
admite volver sobre él las veces que haga falta, y uno que no, se completa una sola vez. Hoy están
los diez. Si la respuesta es "sólo 14 y 15", se cambia en dos filas.

Un sí a la primera convierte el rótulo en *"criterio profesional confirmado"* y es todo lo que hace
falta. Ver [ADR-031](decisions.md#adr-031) y la transcripción en
[`roadmap-modo-examen-source.md`](roadmap-modo-examen-source.md).

### Y una tercera, sobre el cuadro de acciones

Tu *Cuadro de Problemas y Acciones Concretas* propone, para cada problema, una **evidencia concreta**
— que es justamente lo que al Roadmap le falta. **No lo cargamos**, por dos razones que preferimos
decirte antes de que las descubras vos:

1. No sabemos **qué acción corresponde a qué paso** de los veinte, y asignarlo nosotros sería
   inventar.
2. El cuadro conserva **tus propias preguntas sin resolver**: `(intervención??)`, `(asistencia??)`,
   `(acompañamiento durante el paso??)`, `(checklist predeterminado?)`, `(espacio de consulta y
   ajuste?)`. Un campo con un signo de pregunta de quien lo escribió no es criterio cerrado.

> **3. ¿Querés que trabajemos ese cuadro como la evidencia esperada de cada paso? Si sí, necesitamos
> el mapeo acción → paso, y una respuesta a los cinco signos de pregunta que quedaron.**

Y un aviso, porque toca una regla del producto: una de las filas propone *"porcentaje de logro por
tema"* como evidencia. **Hoy el producto no muestra porcentajes de preparación**, porque el umbral que
los haría significar algo es una de las cosas que faltan decidir. No es una contradicción tuya con
nosotros: es que el orden correcto es fijar el umbral primero.

---

## Los ocho

### 1. `HUMAN-P0-01` — ¿Cuáles de los 20 pasos son obligatorios?

Confirmaste la secuencia `PE-PSY-01…20` como base y que **el tramo 9–18 no es lineal**: el orden es
variable y **una misma acción puede repetirse varias veces** sobre el mismo tema. Lo que no quedó
dicho es **cuáles son obligatorios**.

> Desde el 1 de septiembre los veinte están cargados con tu texto, y **los veinte figuran como "sin
> configurar"** en obligatoriedad: el sistema no supone que todos lo sean. Esta pregunta es la que
> convierte eso en un dato.

⚠️ **Impacto técnico directo:** el schema actual permite completar un paso **una sola vez**, y tu
respuesta ya dijo que eso es incorrecto. La corrección está pendiente y depende de esta conversación.

### 2. `HUMAN-P0-02` — Los dos vocabularios de dimensiones

Elegiste el **modelo mixto**: escala breve para el día a día, dimensiones separadas cuando hay
desempeño observable. Pero nombraste *contacto, recuperación, aplicación y corrección* (+ confianza
aparte), y el modelo del producto tiene **Recorrido, Práctica, Dominio, Confianza y Recencia**.

**No son el mismo conjunto.** ¿Se mapean, se reemplazan, o conviven en niveles distintos?

### 3. `HUMAN-P0-03` — ¿La recuperación también puede omitirse?

Dijiste que producir un apoyo y recuperar sin ayuda son **dos resultados separados** y que **uno
puede no aplicar** — pero la justificación cubre sólo el caso de la ficha. **¿Puede omitirse la
recuperación?** Si la respuesta es no, es un piso que el sistema debe hacer cumplir.

### 4. `HUMAN-P0-04` — Los siete componentes de las últimas 24 h

¿Son **obligatorios o priorizables**? Y si no entran todos —que es el caso frecuente—, **¿en qué
orden se sacrifican?**

### 5. `HUMAN-P0-05` — Qué tareas exigen comprensión por sí mismas

Confirmaste que **evidencia de trabajo ≠ evidencia de aprendizaje**, con una excepción: tareas que
por su naturaleza no se pueden hacer sin comprender. **¿Cuáles?** ¿Cambia por disciplina?

### 6. `HUMAN-P0-06` — Qué es un "error reiterativo" ⭐

**La más importante de las ocho para el sistema**, porque es la que dispara que una persona
intervenga. Dijiste que la persona entra por la **situación del estudiante** —error reiterado, no
avanzar pese a las devoluciones, factores subjetivos— y no por el tipo de entrega.

Para programarlo hace falta:

- **cantidad** de repeticiones;
- **ventana temporal** en la que cuentan;
- **tipo** de error que cuenta (¿el mismo error, o errores del mismo tipo?);
- **excepciones**.

### 7. `HUMAN-P0-07` — Peso de los criterios, y qué pasa si la cátedra contradice

Conservaste las dos familias de criterios y dijiste que **la pauta de la cátedra manda cuando
existe**. Falta el **peso relativo** de cada criterio, y qué hacer cuando **la pauta de la cátedra
contradice** las familias generales.

### 8. `HUMAN-P0-08` — ¿El análisis posterior va antes o después de la nota?

Confirmaste los cuatro ejes y que se registra también lo que funcionó. Falta **el momento**: antes o
después de conocer la nota. Cambia qué puede responder honestamente el estudiante.

---

## Hasta que esta conversación se cierre

Las reglas derivadas de estos ocho residuos se usan **únicamente como defaults provisionales en
entornos sintéticos**, y **no disparan intervenciones automáticas sobre estudiantes reales**. Hoy eso
no cuesta nada: no hay ningún estudiante real en el sistema, y no lo habrá hasta que se cierre el
gate de privacidad.
