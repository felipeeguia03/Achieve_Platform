# Paquete para asesoría legal — Achieve

**Documento:** `docs/legal-package.md`
**Rol:** las preguntas que Achieve necesita que responda asesoría jurídica, con el contexto mínimo
para responderlas. **No es un documento de producto**: es el insumo de una consulta.
**Fecha:** 1 de septiembre de 2026
**Origen:** [ADR-006](decisions.md#adr-006), en estado `PROVISIONAL — LEGAL CONFIRMATION REQUIRED`.

---

## 0. Lo que hay que saber antes de leer las preguntas

**Achieve no tiene ningún dato real todavía.** Todo el sistema corre sobre datos sintéticos, por
decisión explícita, y hay un bloqueo técnico y documental que impide incorporar a una persona real
hasta que esta consulta se cierre. **No estamos pidiendo regularizar algo que ya pasó.** Se consulta
antes de tratar el primer dato.

**Qué es el producto, en una línea.** Un acompañante académico para estudiantes universitarios: cada
día le dice al estudiante qué acción concreta hacer para no perder el ritmo de sus materias, con una
persona real como supervisor. La universidad es quien contrata; el estudiante es quien usa.

**Qué datos trata, o va a tratar:**

| Dato | Qué es | Sensibilidad |
|---|---|---|
| Identidad del estudiante | nombre, correo, legajo | personal |
| Cursadas, unidades, evaluaciones | qué está cursando y cuándo rinde | personal, académico |
| **Compromisos y su cumplimiento** | a qué se comprometió y si lo cumplió | personal, **conductual** |
| **Evidencias** | fotos, archivos, textos y audios que el estudiante sube como prueba de su trabajo | personal, **puede contener terceros** |
| **Reflexiones** | notas breves del estudiante sobre cómo le fue | personal, **íntimo** |
| Progreso académico | cinco dimensiones separadas, sin nota ni score | personal, académico |
| Señales de riesgo e intervenciones | cuándo hace falta que una persona intervenga | personal, **puede rozar salud/bienestar** |
| Material académico | programas, apuntes, guías de cátedra | **derechos de terceros** |

⚠️ **Dos que merecen atención especial.** Las **reflexiones** son texto libre donde un estudiante
puede contar que está angustiado o que no llega. Y las **señales de riesgo** existen para que una
persona intervenga — la psicopedagoga que asesora el producto definió que los disparadores incluyen
*"frustración, inseguridad, desmotivación, ansiedad frente al examen"*. Nos preguntamos si eso
convierte parte del tratamiento en dato sensible de salud, y **no queremos responderlo nosotros**.

---

## 1. Base legal y consentimiento

**Contexto:** la universidad contrata el servicio; el estudiante es el titular de los datos. Los dos
son partes, y no son la misma parte.

1. ¿Cuál es el **marco aplicable** hoy en Argentina, y su estado vigente? Nuestro borrador menciona
   la **ley 25.326** y la **AAIP**, pero lo escribimos para que se confirme o se corrija, incluida
   cualquier reforma posterior. **No implementamos nada sobre la base de nuestra propia lectura.**
2. ¿Cuál es la **base legal correcta** para cada finalidad: consentimiento del estudiante, ejecución
   de un contrato con la institución, interés legítimo, u otra?
3. **¿Quién es responsable y quién encargado del tratamiento** — la universidad, Achieve, o hay
   corresponsabilidad? ¿Qué instrumento hace falta entre las partes?
4. Si el estudiante es **menor de edad** —posible en primer año—, ¿qué cambia?
5. ¿El consentimiento tiene que ser **por finalidad separada** (prestar el servicio · que la
   institución vea un caso individual · usar material para mejorar el producto)?
6. **¿Qué pasa cuando el estudiante revoca?** ¿Qué se borra, qué se conserva y con qué base?
7. ¿Las **reflexiones** y las **señales de riesgo** con componente emocional constituyen **dato
   sensible**? Si la respuesta es sí, ¿qué régimen adicional aplica?

## 2. Visibilidad institucional

**Contexto:** la universidad paga. Nuestra posición de producto es que eso **no** le da acceso a la
información individual del estudiante, y queremos saber si esa posición se sostiene legalmente y con
qué límites.

8. ¿Es correcto el criterio de **agregados por defecto** y caso individual sólo con consentimiento
   explícito, específico, revocable y con finalidad y plazo determinados?
9. **¿Cuál es el umbral mínimo de anonimato** para que un agregado no identifique a nadie? Es un
   número —cuántos estudiantes mínimo por celda— y **no lo queremos elegir nosotros**: en una comisión
   de ocho personas, un promedio identifica.
10. ¿Hay algún caso en que la institución pueda acceder a un dato individual **sin** consentimiento
    —por ejemplo, riesgo grave para el estudiante—? Si lo hay, ¿bajo qué condiciones y con qué
    registro?
11. ¿Qué obligaciones de **trazabilidad de accesos** aplican, y por cuánto tiempo debe guardarse ese
    registro?

## 3. Retención y borrado

**Contexto:** los plazos de abajo son **nuestra propuesta provisional**, elegida por criterio de
producto. Necesitamos que se confirmen o se corrijan.

| Qué | Plazo propuesto |
|---|---|
| Evidencias crudas | 90 días después de cerrar el compromiso, examen o intervención |
| Reflexiones y contenido personal | mientras el servicio esté activo, y hasta 12 meses desde la última actividad |
| Historial de progreso y Bitácora | 24 meses, preferentemente pseudonimizado |
| Métricas anónimas y agregadas | sin plazo |
| Solicitud de eliminación | borrado operativo en 30 días · backups en 90 días |

12. ¿Son razonables y suficientes? ¿Alguno es **demasiado largo** para la finalidad declarada?
13. ¿Qué debe conservarse **obligatoriamente** por razones legales, contables o de defensa ante
    reclamos, y por cuánto?
14. **¿Es aceptable el plazo de 90 días para backups?** Es una restricción técnica real —los backups
    no se editan— y queremos saber si alcanza.
15. ¿La **pseudonimización** que proponemos para el historial es suficiente, o el dato sigue siendo
    personal a efectos legales?

## 4. Material académico y derechos

**Contexto:** el estudiante sube apuntes, guías y programas que **no son suyos**: son de la cátedra o
de la editorial. Nuestro sistema ya registra la procedencia de cada dato y su estado de derechos
(`unknown` / `allowed` / `restricted`), pero eso es trazabilidad, no política.

16. ¿Alcanza con que **quien sube declare que tiene derecho a usarlo**, o hace falta algo más?
17. ¿Podemos **almacenar y mostrarle al propio estudiante** material de cátedra que él subió? ¿Y
    mostrárselo a **otro** estudiante de la misma materia?
18. ¿Qué se necesita para que la **institución** autorice el uso de sus programas y guías?
19. Nuestra posición es que **subir material no autoriza entrenamiento de modelos**. ¿Hace falta algo
    más explícito?

## 5. Golden dataset

**Contexto:** para que el sistema funcione con calidad necesitamos un conjunto de material académico
real de una carrera. La primera opción a **explorar** es **Ingeniería de la UCC**. Explorar no es
usar: hoy no hay ni un dato real cargado.

20. ¿Qué instrumento hace falta con la institución, y qué debe decir?
21. ¿Puede usarse el mismo material para **testing**, para **evaluación de calidad** y para
    **entrenamiento**, o cada finalidad necesita autorización separada? Nuestra hipótesis es que sí
    la necesita, y queremos confirmarlo.
22. ¿Qué pasa con el material de **cátedras individuales** dentro de una carrera autorizada? ¿La
    autorización de la universidad alcanza, o cada docente tiene derechos propios?
23. Si más adelante la institución **revoca**, ¿qué hay que poder deshacer, y en qué plazo?

---

## 6. Qué necesitamos de vuelta, en concreto

1. **Confirmación o corrección** de cada decisión provisional de [ADR-006](decisions.md#adr-006).
2. **El umbral de anonimato** (pregunta 9): es un número y lo necesitamos para poder programar.
3. **Si las reflexiones y las señales de riesgo son dato sensible** (pregunta 7): cambia el diseño,
   no sólo la política.
4. **Qué instrumentos hay que firmar** con la institución y con el estudiante, y quién los redacta.
5. **Qué podemos empezar a hacer antes** de tener todo firmado, si es que algo.

**Mientras tanto no hacemos nada.** Ni una prueba con un estudiante, ni un apunte real, ni un piloto.
El desarrollo sigue con datos sintéticos, que es como viene funcionando desde el primer día.
