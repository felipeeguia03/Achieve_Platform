# Laboratorio «Mi Plan vivo» V3 — el calendario como plan

**Estado:** 🟡 `READY FOR PRODUCT REVIEW` — **no validado, no aprobado, no listo para integrar.**
**Fecha:** 15 de septiembre de 2026 · **Rama:** `experiment/plan-vivo-spike-v3-calendar-first`, creada desde
`4078e24` (la punta de V2, rama `feat/plan-vivo-lab-v2`).
**No cierra** [ADR-109](../../decisions.md#adr-109), que sigue `PENDING`, ni ninguna de las decisiones de
[`plan-vivo/DECISIONS.md`](../plan-vivo/DECISIONS.md).

> Esta carpeta no es una segunda fuente de verdad. Es el informe de un laboratorio descartable: lo que se
> decida después entra a `docs/decisions.md` como ADR.

---

## 1. Hipótesis

> **El calendario puede ser la única representación temporal del plan.** Si el estudiante ve en una
> semana real sus clases, evaluaciones, compromisos, historia y huecos, y puede ubicar ahí lo que falta,
> ya no hace falta una vista *Plan* separada.

La pantalla intenta responder una pregunta:

> ¿Dónde entra mi trabajo académico en mi semana y qué pasaría con mi cursado si cumplo determinadas
> acciones?

**Sacar la vista Plan no saca el plan.** Siguen existiendo el trabajo pendiente, la capacidad, las
acciones propuestas, los compromisos, las restricciones, las prioridades, las dependencias, la simulación y
el recálculo. El Plan Engine del laboratorio (`motor.ts`) sigue generando propuestas, priorizando,
detectando conflictos, calculando capacidad y simulando. El calendario es desde donde se lo mira y se lo
edita.

⚠️ **Esto se comprueba con personas, no con tests.** Que la pantalla funcione no valida la hipótesis: ver
§11.

## 2. Cómo abrirlo

```bash
npm run build
PLAN_VIVO_SPIKE_V3=1 npx next start -p 3133
# o, en desarrollo:  PLAN_VIVO_SPIKE_V3=1 npm run dev
```

Sin `PLAN_VIVO_SPIKE_V3=1` la ruta responde `404`, también en build de producción (la página llama a
`connection()` para que no se prerenderice con el valor de la variable al compilar). Los flags de V1 y V2 no
la prenden, y V3 no prende a ninguna de las dos. V1 y V2 no se tocaron: hay un test que guarda la huella
SHA-256 de sus dos carpetas.

| URL | Qué muestra |
|---|---|
| `/demo/plan-vivo-spike-v3` | El plan real, martes 15 a las 17:30 |
| `?escenario=ubicacion` | *Límites* seleccionada, con su ubicación sugerida en contorno punteado |
| `?escenario=prioridad` | *Repasar Unidad 2* soltada el martes 19:00: aviso de acción más prioritaria |
| `?escenario=conflicto` | *Límites* soltada sobre la clase del miércoles: conflicto duro |
| `?escenario=compromiso` | *Límites* ubicada y comprometida el martes 19:00 |
| `?escenario=renegociacion` | El compromiso de Arquitectura arrastrado al viernes: pide confirmación |
| `?escenario=simulacion` | *Límites* simulada, en *Explicar movimientos* |
| `?escenario=simulacion-multiple` | Límites → Teoría de Derivadas → Práctica de Derivadas |
| `?escenario=disponibilidad` | *Reajustar disponibilidad* con cinco horas más en vista previa |
| `?escenario=reloj` | Jueves 19:10: un compromiso incumplido y una sesión de Focus en curso |
| `?escenario=rescate` | Jueves 19:10 con *Reorganizar sin cortar* abierto |

Cada estado se arma **aplicando las mismas acciones que la pantalla** sobre el fixture, así que es
reproducible. Al refrescar vuelve al estado de la URL: nada se guarda.

## 3. Qué cambió respecto de V2

| V2 | V3 |
|---|---|
| Selector `Plan \| Calendario` | **No existe.** Sólo el calendario |
| Plan semanal en carriles por tipo (facultad, compromisos, trabajo) | Grilla semanal real: días en columnas, horas de 07:00 a 23:00, bloques con **alto proporcional a la duración probable** |
| `Ahora` en la cabecera de la columna de hoy | Una **línea horizontal** en el día actual, a su hora, rotulada `Ahora · 17:30`. Un solo elemento en todo el DOM |
| Trabajo por ubicar como carril | Bandeja **Acciones por ubicar** debajo del calendario, por prioridad, con arrastre y *Elegir horario* |
| Reubicar desde el inspector, sin arrastre | **Arrastrar y soltar** nativo, más la alternativa accesible *Elegir horario* |
| Sin diferencia entre conflicto y preferencia | **Conflicto duro** (bloquea, con motivo y alternativas) frente a **advertencia blanda** (explica y deja seguir) |
| No se creaban compromisos | **Comprometerme** convierte una propuesta ubicada en compromiso local |
| *Tu plan traducido* (el «caminito») | Sale. Lo reemplaza **Impacto académico** |
| Gantt de tres pistas en tabla (*Cátedra / Vos / Escenario*) | **Réplica del Gantt de Materia** (`UX02`): Tema · eje de fechas · Estado, una fila por unidad |
| Actividades hechas mezcladas con lo próximo | La historia aparece **en el día y la hora en que ocurrió**, y nunca en la bandeja |
| Sin reloj adelantado | *Adelantar el reloj a jueves 19:10* y *Reorganizar sin cortar* |
| Movimiento de 480 ms en los dos modos | **240 ms** en *Modo limpio*, **650 ms** y secuencia de frases en *Explicar movimientos* |

## 4. Qué se mueve y qué no

La diferencia vive **en la forma del dato** (`tipos.ts`), no en un booleano. No hay una entidad genérica
`WorkItem`: `CalendarProjectionItem` une los orígenes sólo para dibujar, y cada variante conserva la
referencia a su entidad.

| Origen | Bloque | ¿Se mueve? | Cómo |
|---|---|---|---|
| Clase | Tinte de la materia, borde izquierdo, candado | **No** | No es arrastrable. Ninguna acción del reducer la toca |
| Evaluación | Tinte de urgencia, bandera | **No** | Igual |
| Registro (completada, evidencia enviada, validada, insuficiente) | Gris, con ícono y estado | **No** | Ya ocurrió |
| Compromiso incumplido | Gris punteado, *Compromiso incumplido* | **No** | Nunca se edita para parecer cumplido |
| Focus en curso | Sólido con reloj | **No** mientras dura | — |
| Acción propuesta, sugerida por Achieve | **Contorno punteado**, *Ubicación sugerida* | Sí | Aceptar, arrastrar, elegir otro horario o ignorar |
| Acción propuesta, ubicada por el estudiante | **Contorno sólido**, *Propuesta ubicada* | Sí | Arrastrar, *Elegir horario*, *Devolver a Acciones por ubicar* |
| Compromiso confirmado | **Bloque sólido** con ícono de calendario | **Sólo con renegociación** | Arrastrarlo o *Cambiar horario* abre *Cambiar horario del compromiso*: antes, nuevo, consecuencias, confirmar. *Cancelar* conserva el original |
| Simulado | **Rayado**, *Simulado · paso N* | No | Existe sólo en el escenario |

Una acción ubicada **no es** un compromiso: sigue en la bandeja con *Ubicada · todavía no es compromiso*.

## 5. Conflictos duros y advertencias blandas

### Conflictos duros — *Esta acción no puede quedarse acá*

Bloquean. El diálogo dice el motivo concreto, ofrece hasta dos horarios donde sí entra completa y **no
tiene** «ubicar igual». El reducer también los rechaza.

| Motivo | Ejemplo de texto |
|---|---|
| Se superpone con una clase | *Se superpone con la clase de Análisis Matemático I (miércoles 16, 14:00–16:00).* |
| Se superpone con una evaluación | *Se superpone con Primer parcial · Unidades 1 a 3 de Análisis Matemático I (…).* |
| Se superpone con un compromiso no renegociado, o con un Focus en curso | *… Para usar ese horario, primero cambiale el horario al compromiso.* |
| Se superpone con otra propuesta ubicada | *Se superpone con «…», que ya ubicaste el …* |
| No entra completa | Pasa de las 23:00, o el horario ya pasó |
| Viola una dependencia temporal obligatoria | Antes de la clase que da el tema (*Práctica de Derivadas* antes del miércoles 16:00), o antes de que termine un prerrequisito ya ubicado |
| Queda después de su fecha límite | *Queda después de su fecha límite: la entrega de Bases es el jueves a las 21:00.* |

### Advertencias blandas — dejan seguir

**Nunca bloquean por preferencia del motor.** Aparecen sólo cuando la decisión produce una consecuencia
material, comparando el mundo antes y después de ubicar:

| Advertencia | Cuándo aparece |
|---|---|
| **Hay una acción más prioritaria** | Una acción de prioridad **estrictamente mayor** pierde su **último** bloque completo antes de la fecha que le conviene o de su fecha límite |
| **Se reduce tu margen** | El margen antes de una evaluación de la semana cruza el mínimo del laboratorio (60 min) |
| **Si te lleva el máximo** | Con la duración máxima se superpondría con algo |
| **Fuera de tu disponibilidad** | El bloque cae fuera de lo declarado |
| **Prerrequisito sin horario** | La acción depende de otra que todavía no tiene lugar |

El caso del pedido sale literal del motor, no de un texto escrito a mano:

> *Si ubicás Economía el martes a las 19:00, Límites pierde el último bloque completo antes de la clase de
> Derivadas.*

Salidas: **Volver y revisar** (no ubica y abre la acción afectada) o **Ubicar igual**.

**Misma prioridad se reordena sin aviso.** Poner *Reforzar Límites* en el lugar que el motor sugería para
*Leer teoría de Derivadas* (las dos altas) no avisa; poner *Repasar Unidad 2* el sábado, aunque sea de
prioridad baja, tampoco: no le quita nada a nadie. Hay test de los dos casos.

### Prioridad

Cuatro niveles en palabras —**Muy alta, Alta, Media, Baja**— con un medidor de barras y el texto al lado.
Nunca un puntaje ni sólo color. El orden de la bandeja es ése, y dentro de un nivel, el del fixture.

## 6. Qué significa un compromiso

**Comprometerme** (sólo sobre una propuesta ubicada en el futuro) abre un resumen con día, hora, duración y
evidencia esperada. Al confirmar, en el estado local:

- se crea el compromiso vinculado a la acción, con su promesa original;
- sale de *Acciones por ubicar*;
- el bloque pasa de contorno a sólido, con ícono y texto;
- se anota en la bitácora del laboratorio.

**No cambia** el progreso, el trabajo pendiente, el estado de la unidad, la evidencia ni el Gantt
(test sobre el HTML del Gantt antes y después). *Comprometerse no es avanzar.*

## 7. Qué significa simular

*Simular impacto* supone, explícitamente y en pantalla:

1. la acción se realiza en el horario indicado (el ubicado, el comprometido o el sugerido);
2. la evidencia resulta suficiente;
3. se registra el progreso académico correspondiente —si la acción suma recorrido; un repaso o un refuerzo
   no lo hacen—;
4. el Plan Engine recalcula el escenario.

Siempre acompañado de **«Esto es una simulación. No modifica tu plan real.»** Ubicar o comprometerse
**no** simula.

**Acumulativa, hasta cinco.** `P1 = simular(P0, a1)`, `P2 = simular(P1, a2)`… Cada paso usa el horario que la
acción tiene **en el mundo del paso anterior** (test que lo reconstruye paso por paso). Sin el prerrequisito
simulado, ofrece *Simular primero Límites*. Con cinco, el sexto se rechaza con el motivo.
*Deshacer último paso* devuelve exactamente la proyección anterior; *Reiniciar escenario* vuelve al plan
real; *Plan real | Escenario* cambia lo que se ve sin borrar la pila. La simulación no se guarda al
recargar.

**Plan real** muestra sólo hechos y decisiones: clases, evaluaciones, compromisos, disponibilidad,
registros, propuestas. **Escenario** agrega lo simulado (rayado y rotulado), las posiciones que resultan
(sugeridas en el escenario) y los márgenes y pendientes hipotéticos, con *plan real: X* al lado de cada cifra
que cambia.

### Recorrido del pedido

| Escenario | Pendiente | Sin ubicar | Margen antes del parcial | Qué se mueve |
|---|---:|---:|---:|---|
| Plan real | 8 h 10 | 7 h 10 | 4 h 30 | — |
| 1. Límites | 6 h 25 | 5 h 25 | 5 h 15 | *Reforzar Límites* se retira (se libera jueves 19:45–20:30); *Práctica de Derivadas* pasa de viernes 08:30 a **jueves 19:45**; Cinemática y Economía también se adelantan |
| 2. + Teoría de Derivadas | 5 h 40 | 4 h 40 | 5 h 15 | — |
| 3. + Práctica de Derivadas | 4 h 40 | 3 h 40 | 5 h 15 | Derivadas completa en el escenario |

Tiempo disponible: 14 h en los tres. El margen antes de la entrega de Bases **baja** (4 h → 1 h 15) porque lo
simulado ocupa horas antes del jueves; la pantalla lo dice (*Se achica el margen…*).

## 8. Modo limpio y Explicar movimientos

| | Modo limpio | Explicar movimientos |
|---|---|---|
| Para qué | La experiencia candidata a producto | El modo pedagógico del laboratorio |
| Movimiento | FLIP de 240 ms en los bloques que cambiaron de lugar | 650 ms |
| Texto | Una frase: *Límites, simulada. Práctica de Derivadas se adelanta al jueves 19:45. …* | Secuencia que aparece de a una: *Antes estaba acá* → *Este espacio se libera* → *… puede adelantarse* → *Queda este nuevo margen* → *El Gantt académico avanza hasta este punto* |
| Calendario | Posiciones nuevas | Además, huellas punteadas *Antes estaba acá* y rayadas *Este espacio se libera* |
| Gantt | Transición terminada | Además, la barra anterior punteada |

Las frases salen de **comparar dos proyecciones** (`explicacion.ts`), no de un guion. Con
`prefers-reduced-motion` la duración es cero, sin desplazamientos ni aparición escalonada.

## 9. Relación calendario–Gantt

*Impacto académico* **replica el Gantt de Materia** (`components/screens/materia-cursado.tsx`, ADR-085),
sin importarlo: columna *Tema*, eje con marcas y línea de hoy, una fila por unidad en el orden dictado y
columna *Estado* en palabras. Conserva sus reglas: la ventana va de la **primera clase dictada** a la
**evaluación** que cubre el tema; **sin evaluación no hay barra** y la fila dice por qué; un solo color por
materia. El eje tiene dos vistas: *Esta semana* (predeterminada, para que el movimiento se vea) y *Período*
(−2 sem … +3 sem, el de Materia). No se pudo usar la captura del owner porque no llegó con el pedido: la
referencia fue el código de `UX02`.

Encima de la ventana, el laboratorio agrega:

- **Lo que falta**: una barra desde el primer bloque pendiente del tema hasta el último.
- **Margen**: del fin de lo que falta hasta la evaluación, rayado.
- **Actividades**: un medidor por pieza (constatada, enviada, simulada, pendiente) y la etiqueta *Recorrido
  registrado · 1 de 2*, *Evidencia suficiente · 2 de 2*, *Simulado · 2 de 2*. Al pie: *Dominio todavía no
  evaluado*.
- **Dependencia**: *Espera Límites* o *Desbloqueada: Límites simulada*.
- **Dos capas** en el escenario: el plan real punteado y el escenario rayado.

⚠️ **Una decisión de este laboratorio que conviene revisar.** La barra *Lo que falta* **no** sale de las
posiciones que el estudiante eligió: sale de la propuesta del motor **sin las decisiones de agenda tomadas en
la sesión** (`mundoDelGantt`: sin propuestas ubicadas ni compromisos creados acá, y los que ya existían en su
promesa original). Es lo que permite cumplir, a la vez, *«ubicar no cambia el Gantt»* y *«el Gantt se mueve
al simular»*. Consecuencias: el Gantt sí cambia con la simulación, el retiro de trabajo condicional, el reloj
y **el reajuste de disponibilidad**; y la barra de un tema puede no coincidir con el horario que el
estudiante eligió para esa acción. La leyenda lo dice: *según la propuesta de Achieve (no cambia al ubicar ni
al comprometerte)*.

Al seleccionar *Resolver Práctica 2 de Límites*, el Gantt pasa a Análisis, resalta *U2 · Límites* y muestra
**en texto** lo que haría la simulación —estado anterior, avance, dependencia desbloqueada, cambio sobre
Derivadas, margen nuevo— sin mover ninguna barra hasta que se toca *Simular impacto*.

**Una sola proyección**: `proyectar(estado, plano)` alimenta calendario, bandeja, encabezado, inspector y
Gantt. Hay test de que las cifras del encabezado son las del motor, de que el pendiente es la suma de sus
bloques y de que lo simulado en el calendario es lo simulado en el Gantt, sobre los once estados de URL y dos
más.

## 10. Disponibilidad, reloj y rescate

**Disponibilidad** es el fondo verde de cada columna, no otra fila. *Reajustar disponibilidad* permite
previsualizar cinco horas preparadas, marcar franjas como no disponibles y agregar horas; antes de aplicar
muestra capacidad anterior y nueva, acciones que ahora entran, las que podrían adelantarse y el margen
recuperado, y avisa si un compromiso queda fuera (no se mueve). Se aplica sólo al laboratorio. Las clases y
evaluaciones nunca se mueven para hacer lugar.

**Adelantar el reloj a jueves 19:10**: el compromiso del jueves 15:00 queda **incumplido en su horario
original**, su trabajo vuelve a la bandeja con *Retoma el compromiso incumplido…*, las propuestas cuyo horario
pasó vuelven a la bandeja, sólo se recalculan propuestas futuras, ningún compromiso se mueve y la pila del
escenario se vacía. **Reorganizar sin cortar** propone horarios enteros para lo pendiente y, sólo al
confirmar, los ubica **como propuestas**, no como compromisos.

## 11. Limitaciones conocidas

**Del modelo**

- ⚠️ **El motor es del laboratorio**: codicioso, primer hueco donde entra entero, sin partir bloques. No es
  una propuesta de motor ni resuelve [D-01](../plan-vivo/DECISIONS.md#d-01) ni D-02.
- **El margen es una regla del laboratorio**: disponibilidad antes de la evaluación, menos lo ocupado por el
  estudiante en ese tramo, menos lo que tiene fecha antes y todavía no tiene horario. El mínimo de 60 min es
  inventado.
- **No existe «patrón de mejor cumplimiento»**: el pedido lo mencionaba como advertencia blanda y no hay
  datos para calcularlo. No se simuló.
- **Cambiar horario no aplica ADR-046** (mismo día, una vez por cadena, 15 min de anticipación).
- **Ubicar fuera de la disponibilidad declarada se permite con advertencia**; no se decidió si debería ser
  duro.
- **La validación de la evidencia no tiene latencia**: una práctica simulada desbloquea a la siguiente en el
  instante en que termina.
- **El reloj salta a un único instante** (jueves 19:10) y supone que entre el martes y el jueves no pasó
  nada más.

**De la pantalla**

- *Abrir la clase*, *Ver la evidencia* y *Abrir el registro de la clase* son avisos: no navegan.
- **A 1024 px** el inspector es un panel superpuesto a la derecha que tapa parte del encabezado mientras
  está abierto (se cierra con la cruz o Escape).
- **En móvil** el arrastre no funciona (el arrastre nativo no existe en pantallas táctiles): se ubica con
  *Elegir horario*. Se verificó sólo en Chromium con viewport de 390 px, no en un teléfono.
- **Los bloques cortos recortan el título**; el texto completo, la duración y la movilidad están en
  `aria-label` y en el inspector.
- **La leyenda del calendario usa glifos** (▮ ▭ ┅ ■ ▨ ▒) que un lector de pantalla puede leer raro.

**De accesibilidad**

- **Contraste**: todo usa tokens de `app/globals.css`, pero **no se midió** con herramienta en este
  laboratorio. El rayado de lo simulado y el fondo verde de disponibilidad son los que más conviene medir.
- **No se probó con un lector de pantalla real**, ni el modo noche.

## 12. Recorrido de prueba

1. Abrí `/demo/plan-vivo-spike-v3` y mirá diez segundos sin tocar: ¿qué es fijo, qué pasó, qué falta, dónde
   está *Ahora*?
2. Tocá *Resolver Práctica 2 de Límites* en la bandeja y leé *Ubicación sugerida*. **Aceptá el horario
   sugerido.**
3. Arrastrá la propuesta media hora más tarde. Después, sobre la clase del miércoles.
4. Recargá. Arrastrá *Repasar Unidad 2* al martes 19:00 y leé la advertencia. Elegí **Ubicar igual**.
5. **Comprometete** con esa acción. Intentá arrastrar el compromiso al sábado y **cancelá**.
6. Recargá. Pasá a **Explicar movimientos** y simulá *Límites*. Leé la secuencia y mirá las huellas del
   calendario y el Gantt de Análisis.
7. Simulá Teoría de Derivadas, Práctica de Derivadas, Cinemática y Pipeline. Intentá una sexta.
8. Alterná **Plan real | Escenario** y **Modo limpio | Explicar movimientos**. **Deshacé** y **reiniciá**.
9. En plan real, **adelantá el reloj** y usá **Reorganizar sin cortar**.
10. Abrí **Reajustar disponibilidad** y previsualizá cinco horas más.
11. Repetí 2, 4 y 6 en un teléfono o a 390 px.

## 13. Preguntas para el Product Owner

**Sin responder a propósito.** Las completa el Product Owner después de probarlo; un agente no las completa
ni las convierte en decisión.

1. ¿El calendario permite entender la semana sin una vista Plan separada?
   > _Respuesta del PO:_
2. ¿La bandeja *Acciones por ubicar* resulta accionable o genera carga manual?
   > _Respuesta del PO:_
3. ¿Las ubicaciones sugeridas reducen suficiente fricción?
   > _Respuesta del PO:_
4. ¿Las advertencias aparecen solo cuando existe una consecuencia real?
   > _Respuesta del PO:_
5. ¿Se distingue propuesta de Commitment?
   > _Respuesta del PO:_
6. ¿Se entiende que simular no registra progreso?
   > _Respuesta del PO:_
7. ¿El Gantt muestra avance académico real?
   > _Respuesta del PO:_
8. ¿La simulación acumulativa ayuda a decidir o invita a planificar sin ejecutar?
   > _Respuesta del PO:_
9. ¿El estudiante entiende qué es fijo y qué puede cambiar?
   > _Respuesta del PO:_
10. ¿El calendario sigue siendo útil en mobile?
    > _Respuesta del PO:_

Y cuatro que salieron de construirlo:

11. ¿La barra *Lo que falta* del Gantt tiene que seguir la propuesta de Achieve (y no moverse al ubicar) o las
    posiciones que eligió el estudiante (y moverse)? §9.
12. ¿Ubicar fuera de la disponibilidad declarada es advertencia o conflicto duro?
13. ¿Una acción ubicada debería seguir en la bandeja hasta el compromiso, como ahora, o salir de ahí al
    ubicarla?
14. ¿El margen mínimo antes de una evaluación es una hora, otro número o una decisión de la
    psicopedagoga?

## 14. Verificación

| Gate | Resultado |
|---|---|
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm test` | ✅ **126 archivos, 3569 tests.** V3 suma `tests/plan-vivo-spike-v3.test.ts` (206, parametrizados sobre los estados de URL) y `tests/plan-vivo-spike-v3-vista.test.tsx` (33) |
| `npm run build` | ✅ `/demo/plan-vivo-spike-v3` se sirve dinámica (`ƒ`) |
| Smoke con servidor real | ✅ con sólo `PLAN_VIVO_SPIKE_V3=1`: V3 200, V2 404 |
| Chromium headless | ✅ 1440 × 900, 1024 × 768 y 390 × 844 sobre cinco estados: sin scroll horizontal de página y sin errores ni advertencias de consola. Recorrido del pedido (§30, pasos 1 a 19) hecho con arrastre nativo real |
| `npm run db:verify` | ⛔ **No se corrió**: V3 no toca base, schema ni endpoints, y el comando vacía la base de negocio |

## 15. Cómo borrarlo

```bash
rm -r app/demo/plan-vivo-spike-v3 docs/experiments/plan-vivo-v3 \
  tests/plan-vivo-spike-v3.test.ts tests/plan-vivo-spike-v3-vista.test.tsx
```

Además, sacar la nota *V3* de ADR-109 y la línea del README de `plan-vivo/`. Nada del producto, de V1 ni de
V2 la importa, y hay test que lo verifica.
