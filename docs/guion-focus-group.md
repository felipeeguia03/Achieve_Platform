# Achieve — Guion del focus group

**Documento:** `docs/guion-focus-group.md`
**Rol:** owner canónico del recorrido de sesión y del test de comprensión de 10 segundos.
**Última actualización:** 30 de agosto de 2026
**Deriva de:** `product-spec-source.md` §VI.1–§VI.9. Las preguntas y las respuestas esperadas **están
escritas en las specs**; acá se ordenan para conducir una sesión.

---

## 0. Antes de empezar

### Qué se está probando

**Comprensión, no satisfacción.** La pregunta no es si le gusta: es si entiende **dónde está, qué
tiene que hacer ahora, qué tiene que entregar y qué va a pasar después** sin que nadie se lo
explique.

### Qué no se está probando

- No se prueba el motor de recomendación: los datos son sintéticos y **ninguna recomendación de esta
  sesión es real**.
- No se prueba retención ni uso: eso necesita el Track B.
- **No se prueba con datos de ninguna persona real.** Todo el recorrido corre sobre identificadores
  sintéticos y materias ficticias.

### Regla del facilitador

**No explicar.** Si el participante pregunta qué significa algo, se anota la pregunta y se responde
**después** de terminar la estación. Una explicación durante el test invalida esa estación.

### Reset entre participantes

**Recargar `/hoy` en el navegador.** Eso es todo, y es determinista: el Track A no persiste nada —sin
`localStorage`, sin `sessionStorage`, sin `IndexedDB`, sin red—, así que lo único que sobrevive a una
navegación es el estado local de un componente montado, y una recarga lo descarta.

> Verificado con un test: tras adjuntar una evidencia y paginar la lista de materias, una recarga
> devuelve el DOM inicial idéntico.

### Dispositivo

**Desktop es el viewport primario** ([ADR-014](decisions.md#adr-014)). El recorrido también se corre
a **360 px**, que es el piso obligatorio de la variante móvil: si una pantalla se entiende en desktop
y se pierde a 360, no está terminada.

---

## 1. El recorrido

Diez estaciones. Cada una avanza con **su CTA principal**, salvo donde se indica.

| # | Pantalla | Ruta | Se llega con |
|---|---|---|---|
| 1 | `UX01` Hoy | `/hoy` | *(inicio)* |
| 2 | `UX03` Próxima Acción | `/accion` | `CTA-002` **Comprometerme** |
| 3 | `UX04` Compromiso | `/compromiso` | `CTA-003` **Me comprometo** |
| 4 | `UX04` Compromiso · es la hora | `/compromiso?escenario=FX-LOCAL-COM-DUE` | `CTA-004` **Confirmar compromiso** |
| 5 | `UX05` Evidencia | `/evidencia` | `CTA-005` **Empezar** → atraviesa *ejecución* → `CTA-006` |
| 6 | `UX06` Progreso | `/progreso` | `CTA-007` **Enviar evidencia** |
| 7 | `UX02` Materia | `/materia` | `CTA-010` **Ver siguiente acción** |
| 8 | `UX07` Activación de Examen | `/examen/activar` | ⚠️ **navegación del facilitador** |
| 9 | `UX08` Modo Examen | `/examen/overview?escenario=FX-LOCAL-OV-HANDOFF-DISPONIBLE` | `CTA-011` **Activar preparación** |
| 10 | `UX09` Paso de Protocolo | `/examen/paso` | `CTA-012` **Abrir paso actual** |

### Las dos costuras, dichas de frente

**Estación 5.** El spec rutea `UX04 → ejecución → UX05`, y **`ejecución` no tiene pantalla**. El
recorrido atraviesa los dos contratos de una vez. No se inventó una transición: se cruza un nodo que
no tiene superficie.

**Estación 5, dentro de la pantalla.** Es la **única interacción obligatoria** del recorrido:
*Enviar evidencia* está **visible pero deshabilitada** hasta que el participante adjunta algo. Es a
propósito —el botón dice qué va a pasar antes de que se pueda hacer— y es un buen momento para
observar si el participante entiende **qué le falta** sin que nadie se lo diga.

**Estación 8.** **Ninguna de las 18 CTAs del registro canónico lleva a `UX07`**, aunque `VI.7` §9
describe una entrada manual desde Materia/Cursado. Es [ADR-016](decisions.md#adr-016), que sigue
`PENDING`. **El facilitador escribe la URL.** No se agregó una `CTA-019` para tapar el hueco.

> Si un participante pregunta cómo se llega a Modo Examen, **esa es información valiosa**: anotarla.
> Es exactamente la pregunta que ADR-016 necesita para cerrarse.

---

## 2. El test de comprensión de 10 segundos

**Protocolo, de `VI.7` §29.1:** mostrar sólo el **primer viewport** durante 10 segundos. Preguntar
**sin ayudas**. Anotar la respuesta textual, no una interpretación.

### Estación 1 · `UX01` Hoy

**Fuente:** spec maestro §1 — *"entender en menos de 10 segundos dónde está, qué tiene que hacer
ahora, qué tiene que entregar para demostrar que avanzó y qué va a pasar después"*.

| # | Pregunta | Respuesta esperada |
|---|---|---|
| 1 | ¿Cómo venís en general? | Bajo control |
| 2 | ¿Qué tenés que hacer ahora? | Resolver ejercicios 1–5, de Programación · Unidad 4 |
| 3 | ¿Por qué esa y no otra? | Porque consolida lo visto hoy |
| 4 | ¿Qué tenés que entregar? | 5 ejercicios, en unos 40 minutos |
| 5 | ¿Qué pasa si tocás el botón? | Queda definido cuándo va a hacerla — **no** que ya la hizo |

**PASS:** 5/5, y **sin decir que el botón completa la acción**.

### Estación 2 · `UX03` Próxima Acción

**Fuente:** `VI.3`. En menos de 10 segundos debe poder responder:

| # | Pregunta | Respuesta esperada |
|---|---|---|
| 1 | Qué tiene que hacer | Resolver ejercicios 8–14 |
| 2 | En qué materia y tema | Análisis II · Unidad 3 |
| 3 | Por qué importa | Prepara la próxima clase |
| 4 | Cuánto tiempo necesita | 60–75 min |
| 5 | Qué recurso debe usar | Guía 3, de la cátedra |
| 6 | Qué evidencia se espera | 7 ejercicios resueltos |
| 7 | Qué criterio cierra la acción | Completos y con la producción adjunta |
| 8 | Qué pasa si la acepta | Define cuándo la va a hacer |

**PASS:** 8/8. **Falla si dice que aceptar ya crea el compromiso.**

### Estación 3 · `UX04` Compromiso

**Fuente:** `VI.4`.

| # | Pregunta | Respuesta esperada |
|---|---|---|
| 1 | Qué Action está comprometiendo | Resolver ejercicios 8–14 |
| 2 | Qué día y a qué hora | Sáb 30 ago, 19:00 |
| 3 | Cuál es la estimación original | 60–75 min |
| 4 | Cuánto declara disponible | 70 min |
| 5 | Qué evidencia deberá producir | 7 ejercicios |
| 6 | Qué registra el CTA final | Que queda acordado; no que lo hizo |
| 7 | Qué pantalla o estado sigue | Queda acordado en Hoy y Materia |

**PASS:** 7/7.

### Estación 5 · `UX05` Evidencia

**Fuente:** `VI.5`.

| # | Pregunta | Respuesta esperada |
|---|---|---|
| 1 | Para qué Action envía evidencia | Resolver ejercicios 8–14 |
| 2 | Qué evidencia se esperaba | 7 completos y adjuntos |
| 3 | Qué puede subir | Foto o archivo |
| 4 | Qué información mínima debe completar | El adjunto; la reflexión es opcional |
| 5 | Qué significa Enviar evidencia | Que queda enviada |
| 6 | En qué estado queda | Enviada, pendiente de validación |
| 7 | Qué ocurrirá después | Sigue la validación |
| 8 | **Qué NO demuestra todavía** | **Ni suficiencia ni dominio** |

**PASS:** 8/8. La 8 es la que más importa: **si dice que enviar ya demuestra que aprendió, es FAIL**.

### Estación 6 · `UX06` Progreso

**Fuente:** `VI.6`.

| # | Pregunta | Respuesta esperada |
|---|---|---|
| 1 | ¿Qué acaba de pasar? | Se validó la evidencia de los ejercicios 8–14 |
| 2 | ¿En qué estado está tu evidencia? | Validada |
| 3 | ¿Tu progreso cambió? | Sí, la práctica: de 12 a 19 ejercicios |
| 4 | ¿Qué dato respalda el cambio? | La evidencia validada |
| 5 | ¿Qué dimensión no cambió? | Recorrido conserva su estado; Dominio sigue **no evaluado** |
| 6 | ¿Qué hacés después? | Reforzar cambio de variables |

**PASS:** 6/6. **Falla si confunde "no evaluado" con "bajo" o con cero.**

### Estación 7 · `UX02` Materia

**Fuente:** `VI.2`.

| # | Pregunta | Respuesta esperada |
|---|---|---|
| 1 | ¿Cómo está esta materia? | Necesita atención; último avance hace 2 días |
| 2 | ¿Qué tenés que hacer ahora? | Resolver ejercicios 8–14, Unidad 3 |
| 3 | ¿Por qué esa acción importa? | Prepara la próxima clase |
| 4 | ¿Dónde está la cátedra y dónde estás vos? | La cátedra en U4; vos con práctica pendiente de U3 |

**PASS:** 4/4. **Falla si atribuye a la cátedra el reporte que hizo el propio estudiante.**

### Estación 8 · `UX07` Activación de Modo Examen

**Fuente:** `VI.7` §29.1 y §29.2, literal.

| # | Pregunta | Respuesta esperada |
|---|---|---|
| 1 | ¿Qué examen es? | Parcial 1 |
| 2 | ¿De qué materia? | Análisis II, Comisión A |
| 3 | ¿Cuándo y cómo se toma? | 07 sep, práctico — datos oficiales de la cátedra |
| 4 | ¿Por qué apareció? | Entró en una ventana de recomendación decidida fuera de la vista |
| 5 | ¿Ya está activo? | **No**; todavía hay que activarlo |
| 6 | ¿Qué hace el botón y qué pasa después? | Activa la preparación de ese examen y abre su contexto; **no crea un compromiso** |

**PASS:** 6/6 **sin confundir activación con estudio o preparación** (criterio literal de §29.1).

### Estación 9 · `UX08` Modo Examen / Overview

**Fuente:** `VI.8`.

| # | Pregunta | Respuesta esperada |
|---|---|---|
| 1 | ¿De qué examen es esta preparación? | Parcial 1 de Análisis II, 07 sep, práctico |
| 2 | ¿Qué tenés que atender ahora? | Lo que muestre el estado dominante |
| 3 | ¿Dónde estás en el recorrido? | Un hito confirmado y un paso actual |
| 4 | ¿Cambió tu progreso? | Sólo lo que figure bajo Cambio confirmado |
| 5 | ¿Qué pasa con el Cursado? | Sigue disponible; la preparación no lo reemplaza |

**PASS:** 5/5. **Falla si dice que está "listo para rendir" o menciona un porcentaje** — no hay
ninguno en pantalla.

### Estación 10 · `UX09` Paso de Protocolo

**Fuente:** `VI.9`.

| # | Pregunta | Respuesta esperada |
|---|---|---|
| 1 | ¿Qué exige este paso? | Consolidar el método de sustitución |
| 2 | ¿Qué tenés que producir? | Siete ejercicios resueltos con su desarrollo |
| 3 | ¿Cuándo se da por cerrado? | Cuando cada ejercicio muestra la sustitución y su justificación |
| 4 | ¿Qué recurso usás? | Guía 3, de la cátedra |
| 5 | ¿Abrir el recurso completa el paso? | **No** |

**PASS:** 5/5. La 5 es la crítica: **abrir no completa**.

---

## 3. Planilla de resultados

Una fila por participante y estación.

| Participante | Estación | Correctas / total | ¿PASS? | Preguntas que hizo | Dónde dudó |
|---|---|---|---|---|---|
| | | | | | |

### Qué mirar al cerrar la sesión

1. **Las preguntas que hizo el participante** valen más que los aciertos: marcan dónde la pantalla no
   se explica sola.
2. **Toda confusión entre enviar y demostrar** es un hallazgo de producto, no de diseño visual. La
   cadena *preparar → enviar → suficiencia → validación → dominio* es el invariante central.
3. **Si alguien pregunta cómo llegar a Modo Examen**, anotarlo: es el insumo de
   [ADR-016](decisions.md#adr-016).

---

## 4. Lo que este guion no cubre

- **El lector de pantalla.** La auditoría de `design-system.md` §9 lo declara **no corrido**: exige
  una persona usándolo, no una simulación.
- **`A-01` con datos sucios reales.** Exige datos reales, que el Track A no tiene y que
  [ADR-006](decisions.md#adr-006) bloquea.
- **`UX07` sin `Assessment` registrada y los otros estados críticos.** El recorrido muestra el camino
  feliz. Cada estado crítico tiene su URL propia vía `?escenario=`, y se revisan aparte del test de
  comprensión.
