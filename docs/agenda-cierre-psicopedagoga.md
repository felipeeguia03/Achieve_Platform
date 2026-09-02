# Agenda de cierre — los ocho residuos psicopedagógicos

**Documento:** `docs/agenda-cierre-psicopedagoga.md`
**Fecha:** 1 de septiembre de 2026 · **§9 agregada** el 2 de septiembre de 2026
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

Para programarlo hacía falta la **cantidad** de repeticiones, la **ventana** en la que cuentan, qué
**tipo** de error cuenta y las **excepciones**.

> ⚠️ **Esto ya no está vacío, y hay que decirlo con todas las letras.** El 2 de septiembre de 2026 el
> **Product Owner** cargó valores provisionales para poder demostrar el producto con datos
> inventados ([ADR-036](decisions.md#adr-036)). **No son tuyos, no tienen validación profesional, y
> nadie va a decir que los aprobaste.** Están puestos para que el sistema pueda correr y para que vos
> puedas ver el mecanismo funcionando en vez de imaginarlo — que es más fácil de corregir que una
> hoja en blanco.
>
> **Ningún estudiante real los toca.** El sistema no tiene datos reales y no los va a tener hasta que
> se cierre el gate de privacidad.

**Lo que está puesto hoy, para que lo corrijas.** Ver §9, que es la lista completa.

### 7. `HUMAN-P0-07` — Peso de los criterios, y qué pasa si la cátedra contradice

Conservaste las dos familias de criterios y dijiste que **la pauta de la cátedra manda cuando
existe**. Falta el **peso relativo** de cada criterio, y qué hacer cuando **la pauta de la cátedra
contradice** las familias generales.

### 8. `HUMAN-P0-08` — ¿El análisis posterior va antes o después de la nota?

Confirmaste los cuatro ejes y que se registra también lo que funcionó. Falta **el momento**: antes o
después de conocer la nota. Cambia qué puede responder honestamente el estudiante.

---

## 9. Los seis valores provisionales que cargó el Product Owner ⭐⭐ · ✅ RESPONDIDA

> ✅ **Respondida el 2 de septiembre de 2026.** La transcripción completa está en
> [`validacion-psicopedagogica-source.md`](validacion-psicopedagogica-source.md), que **manda sobre
> cualquier paráfrasis**. El plan de implementación es [ADR-037](decisions.md#adr-037).
>
> **Seis `CAMBIAR` y un `APROBAR` — y ningún umbral se movió.** Lo que cambió es qué cuenta como una
> repetición. Lo que sigue abajo es la pregunta original, que se conserva para poder leer la
> respuesta contra ella.

**Es la lista más concreta de todo este documento, y la que más rápido se responde**: son seis
números y una lista de palabras. Cada uno está funcionando hoy sobre datos inventados, y cada uno se
cambia **cargando una fila de configuración** — no hay que reprogramar nada.

### 9.1 · ¿Dos apariciones ya es "reiterativo"?

**Puesto hoy:** un error se considera reiterativo a partir de la **segunda** aparición del mismo
tipo. Ahí el sistema lo marca como *atención*, sin llamar a nadie.

**Lo que necesitamos de vos:** si dos es el número, o si hace falta más.

### 9.2 · ¿A la tercera entra una persona?

**Puesto hoy:** la **tercera** aparición llama a una persona.

**Lo que necesitamos de vos:** si tres es el punto donde el acompañamiento automático deja de
alcanzar. Es literalmente el número que decide cuándo alguien recibe un mensaje de un humano.

### 9.3 · ¿Volver a fallar después de una corrección salta la fila?

**Puesto hoy:** si el estudiante recibe una acción correctiva y **vuelve a cometer el mismo tipo de
error**, se llama a una persona **sin esperar la tercera vez**.

**Lo que necesitamos de vos:** si fallar contra una corrección es distinto de fallar dos veces
seguidas, o si es lo mismo y hay que sacar esta excepción.

### 9.4 · ¿Una resolución bien hecha borra el contador, o lo baja de a uno?

**Puesto hoy:** una resolución **correcta, independiente y sin ayuda** pone el contador **en cero**.

**Lo que necesitamos de vos:** si eso es demasiado generoso. Alguien que se equivoca dos veces,
acierta una y se vuelve a equivocar, hoy vuelve a empezar de cero.

### 9.5 · ¿Los seis tipos de error son los correctos?

**Puesto hoy**, como vocabulario provisional:

| | |
|---|---|
| **Conceptual** | No comprende el concepto que la consigna requiere aplicar |
| **De procedimiento** | Comprende el concepto y falla en la ejecución |
| **De interpretación de consigna** | Resuelve bien algo distinto de lo que se pedía |
| **De cálculo** | El método es correcto y la aritmética o el álgebra no |
| **Omisión de paso obligatorio** | Saltea un paso que la resolución exige |
| **Dependencia de ayuda externa** | Sólo resuelve con asistencia; no lo sostiene solo |

**Lo que necesitamos de vos:** si esta lista sirve, si sobra alguno, o si el vocabulario correcto es
otro. **El sistema no tenía ninguno**: éstos entraron porque hacía falta algo para poder contar.

Y una precisión que ya está tomada y conviene confirmar: **el error se cuenta por su tipo, no por el
tema**. El mismo error de procedimiento en dos unidades distintas **cuenta como dos apariciones del
mismo error**. El tema queda como contexto para explicar, no como parte de la identidad.

### 9.6 · Una frase ambigua que interpretamos, y no deberíamos haber tenido que interpretar ⚠️

La instrucción decía que sólo cuentan *"intentos evaluables con **evidencia suficiente**"*.

**Se implementó como:** cuenta cualquier entrega que **alguien haya evaluado** — incluidas las que
resultaron **insuficientes**.

**Por qué:** la otra lectura posible —que sólo cuenten los errores encontrados en entregas
*suficientes*— haría que un error detectado en una entrega insuficiente **no contara nunca**, que es
al revés de lo esperable.

**Es la interpretación de un agente sobre una frase ambigua, y por eso está acá.** Si la lectura
correcta era la otra, cambia bastante quién termina recibiendo una intervención.

### 9.7 · Y dos cosas más, del Roadmap

**Vigencia.** Se puso que el Roadmap está vigente **mientras la preparación esté activa**, y que deja
de estarlo cuando el examen se rinde, se cancela, el estudiante abandona, o se replanifica con fecha
nueva. Una replanificación **no borra el historial**: crea una versión nueva.

**Volver atrás.** Se permite volver a los pasos **9 a 18** cuando una evidencia resulta insuficiente,
aparece un error reiterativo, cambia información del examen, o una replanificación exige repetir. La
vuelta **no borra evidencias ni baja el progreso**, y queda registrada con su motivo y desde qué paso
se volvió.

**Lo que necesitamos de vos:** si esas cuatro condiciones de vigencia y esos cuatro motivos para
volver atrás son los correctos, y si el tramo reentrante es 9–18 o son sólo el 14 y el 15, que es la
pregunta que quedó abierta en la §*"Antes que las ocho"*.

---

## Hasta que esta conversación se cierre

Las reglas derivadas de estos ocho residuos —y los seis valores de §9— se usan **únicamente como
defaults provisionales en entornos sintéticos**, y **no disparan intervenciones automáticas sobre
estudiantes reales**. Hoy eso no cuesta nada: no hay ningún estudiante real en el sistema, y no lo
habrá hasta que se cierre el gate de privacidad.

**La revisión de §9 es obligatoria antes de cualquier piloto con estudiantes reales**
([ADR-036](decisions.md#adr-036)). Si cambiás cualquiera de los seis, el costo es cargar una fila de
configuración: los números no están escritos en el código, y hay una prueba automática que lo
verifica.
