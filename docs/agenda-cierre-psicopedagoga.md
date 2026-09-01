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

## Los ocho

### 1. `HUMAN-P0-01` — ¿Cuáles de los 20 pasos son obligatorios?

Confirmaste la secuencia `PE-PSY-01…20` como base y que **el tramo 9–18 no es lineal**: el orden es
variable y **una misma acción puede repetirse varias veces** sobre el mismo tema. Lo que no quedó
dicho es **cuáles son obligatorios**.

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
