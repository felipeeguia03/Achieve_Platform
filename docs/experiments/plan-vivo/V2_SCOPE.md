# Laboratorio «Mi Plan vivo» V2 — alcance

**Estado:** 🟡 `READY FOR PRODUCT REVIEW` — **no validado, no aprobado, no listo para integrar.**
**Fecha:** 15 de septiembre de 2026 · **Rama:** `feat/plan-vivo-lab-v2`, creada desde `067947c` (V1, rama `feat/paralelo`).
**No cierra** [ADR-109](../../decisions.md#adr-109), que sigue `PENDING`.

---

## 1. Hipótesis

> Mantener la planificación semanal de V1, pero permitir seleccionar cualquier elemento, reorganizar
> lo que legítimamente puede moverse, construir un escenario acumulativo de hasta cinco workitems y
> observar al mismo tiempo su impacto temporal y académico.

Lo que prueba es **el modelo de interacción**: si tres representaciones sincronizadas del mismo plan
ayudan a decidir. No prueba un planificador real: ver §9.

| Representación | Pregunta que responde |
|---|---|
| **Plan semanal** | ¿Cuándo ocurrirá cada cosa? |
| **Tu plan traducido** | ¿En qué orden conviene avanzar y qué opciones tengo? |
| **Gantt académico** | ¿Qué parte objetiva del cursado cambiaría? |

Las tres leen **la misma proyección** (`proyectar(escenario)` en `proyeccion.ts`), y el Calendario también.

## 2. Cómo abrirlo

```bash
npm run build
PLAN_VIVO_SPIKE_V2=1 npx next start -p 3111
# o, en desarrollo:  PLAN_VIVO_SPIKE_V2=1 npm run dev
```

Sin `PLAN_VIVO_SPIKE_V2=1` la ruta responde `404`. **`PLAN_VIVO_SPIKE=1` prende V1 y no prende V2**; los dos
pueden convivir. Verificado con servidores reales: sin flags, 404 y 404; sólo V1, 200 y 404; sólo V2, 404 y
200; los dos, 200 y 200.

`/demo/plan-vivo-spike-v2?escenario=<estado>` abre un estado demostrativo. Cada uno se arma **con las mismas
acciones que la pantalla**, desde el mismo fixture. Se combinan con `&vista=calendario` y `&modo=limpio`.

| Estado | Qué muestra |
|---|---|
| `base` | El plan real |
| `futuro` | Límites seleccionado (propuesta futura) |
| `historico` | Práctica 1 de Arquitectura seleccionada (hecho con progreso registrado) |
| `clase-pasada` · `clase-futura` · `evaluacion` | Clase del lunes · clase del miércoles · parcial |
| `un-paso` · `tres-pasos` | Límites · Límites → Teoría de Derivadas → Práctica de Derivadas |
| `prioridad-inferior` | Los tres de arriba y Economía elegida antes del simulacro |
| `dependencia` | Práctica de Derivadas simulada sin Límites |
| `reubicada` | Lectura de Economía reubicada al sábado 10:00 |
| `renegociado` | Compromiso de Arquitectura con horario cambiado al jueves 19:30 |
| `limpio` | `tres-pasos` en Modo limpio |
| `calendario` | Reubicada + renegociado, en el Calendario del escenario |

## 3. Qué cambió respecto de V1

| V1 | V2 |
|---|---|
| `Ahora 17:30` repetido en cada fila | **Un solo** `Ahora · lunes 14 · 17:30`, en la cabecera de la columna de hoy, con la columna resaltada. No finge una posición horaria que el eje de días no tiene |
| *Trabajo pendiente estimado* | *Trabajo pendiente esta semana*, con probable, rango, horizonte y *Qué es* |
| Fila *Próximas acciones* | *Trabajo académico*, con *Ya ocurrió* y *Por venir* separados hoy |
| *Disponible y margen* en una fila | *Disponibilidad declarada* y *Margen* en carriles distintos |
| Panel con una sola acción simulable | **Inspector universal** para siete tipos de elemento |
| Escenarios preparados a mano, sólo desde la base | **Escenario acumulativo** de hasta cinco pasos, cada uno sobre el anterior |
| Ubicaciones escritas a mano | **Acomodador local del laboratorio**, determinista (§9) |
| Lo simulado al 60 % de opacidad (contraste sin medir) | Fondo de acento, borde discontinuo y texto *Simulado · paso N* a contraste pleno |
| Con teclado, la tarjeta de acción llegaba después de los bloques | La acción recomendada va antes del plan en el orden del documento |
| En mobile, la tarjeta quedaba lejos del movimiento | Tocar selecciona; el inspector se trae a la vista y recibe el foco |
| — | *Tu plan traducido* y *Gantt académico* |

**V1 no se tocó**: `git diff 067947c -- app/demo/plan-vivo-spike tests/plan-vivo-spike*` está vacío, y
`tests/plan-vivo-spike-v2.test.ts` guarda la huella SHA-256 de cada archivo de V1.

## 4. Modelo de interacción

Dos acciones que no se mezclan:

| Gesto | Qué hace | Qué **no** hace |
|---|---|---|
| **Clic, Enter o Espacio** sobre cualquier bloque, franja o estación | Selecciona y abre el inspector, que ya dice *Si lo simulás* qué cambiaría | No simula |
| **Botón *Simular este workitem*** | Agrega el paso a la pila. Antes avisa si falta un prerequisito o hay trabajo más prioritario | No confirma nada ni cuenta como avance |

🆕 **Pasar el mouse no hace nada** (owner, 15 sep 2026). La primera entrega de V2 tenía vista previa por
hover o foco sobre el botón y las estaciones; se retiró para que simular sea siempre un clic deliberado.
Hay test que lo verifica.

Lo único que se previsualiza es **el lugar elegido** en *Reubicar* o *Cambiar horario*, también por clic, y
va rotulado *Vista previa · Todavía no se agregó al escenario*. Escape cierra esa vista previa, el
selector de lugar, el menú y los avisos. Mientras tanto, inspector, camino y franja de acción leen la
proyección *sin* vista previa, y los indicadores tienen alto fijo.

### Supuesto de cumplimiento

Simular no es marcar como hecho. El paso declara:

> Se supone que el workitem se realiza dentro del rango previsto, la evidencia resulta suficiente y
> después se registra el progreso correspondiente, si ese workitem realmente puede producir progreso
> académico.

Y lo separa en cinco hechos: se ejecuta, se envía la evidencia, resulta suficiente, se registra el
progreso sólo cuando corresponde y el plan se recalcula.

## 5. Qué se mueve y qué no

La diferencia está **en la forma del dato** (`kind`), no en un booleano.

| Elemento | ¿Se mueve? | Cómo |
|---|---|---|
| Clase, parcial (`CLASE`, `EVALUACION`) | **No** | Sin controles. Candado, fuente y estado en el inspector |
| Hecho histórico (`HECHO`), compromiso incumplido | **No** | Sin controles. *Ya ocurrió: no se mueve* |
| Propuesta (`WORKITEM`) | **Sí, en el escenario** | *Reubicar en el escenario* o *Elegir cuándo* → lugares válidos → vista previa → *Confirmar en el escenario*. **Sigue siendo propuesta** |
| Trabajo por ubicar | **Sí, si hay lugar** | El mismo flujo. Si no entra, dice por qué (*necesita 1 h 50 seguidos y el hueco más largo es de…*) y **no acorta** la duración |
| Compromiso confirmado (`COMPROMISO`) | **Sólo explícitamente** | *Cambiar horario* → lugar → antes y después → confirmar. La promesa original queda dibujada y en el inspector, con el registro del cambio |
| Disponibilidad | **Sí, en el escenario** | Agregar una de tres excepciones preparadas, quitar una franja, restablecer. **Quitar la franja de un compromiso no lo mueve**: un aviso pide cambiarle el horario primero |

Drag-and-drop **no se hizo**: el pedido lo dejaba opcional y no hay librería en el repo. El flujo por
inspector funciona igual con teclado y con toque.

## 6. Prioridad frente a dependencia

| | Prioridad blanda | Dependencia académica |
|---|---|---|
| Qué es | Un nivel: *Primero*, *Enseguida*, *Después*. Varios pueden compartirlo | *Práctica de Derivadas depende de Límites* |
| Mismo nivel, sin dependencia | Se intercambian **sin aviso** (Límites ↔ Teoría de Derivadas; Economía ↔ Caché) | — |
| Elegir algo de nivel inferior | Aviso **Hay trabajo más prioritario antes** con lo que posterga y **qué costaría**. *Volver al orden recomendado* o *Simular igual*. **No bloquea**; el orden elegido queda marcado en la pila | — |
| Simularlo sin el prerequisito | — | Aviso **Le falta un prerequisito**: *Simular primero Límites*, *Explorar el intento igual* o *Cancelar* |
| Qué pasa si se explora igual | — | Queda un **intento**: usa su tiempo, **no** queda hecho, **no** mueve el Gantt, **no** desbloquea lo que depende de él, agrega un riesgo y deja Límites como acción recomendada |

## 7. Simulación acumulativa

`P0 = plan real`, `P1 = simular(P0, w1)`, `P2 = simular(P1, w2)`… hasta **5**.

- **Cada paso va en el primer hueco libre después del anterior**, así el orden de la pila es el orden de
  hacerlo. Agregar un segundo paso no mueve el primero (test sobre todos los pares).
- Por paso se conservan el supuesto, qué cambió y qué quedó igual, el impacto temporal y el académico, los
  riesgos agregados o quitados y la siguiente acción.
- **Deshacer último** deshace el último cambio del escenario, sea un paso, una reubicación o un cambio de
  horario, y devuelve **exactamente** la proyección anterior (test). **Volver a este paso** corta el
  historial ahí. **Restablecer escenario** vuelve al vacío. **Volver al plan real** cambia la vista sin
  borrar el escenario.
- **Con cinco**, el botón queda deshabilitado con el motivo: *el límite existe para que el escenario siga
  siendo comprensible*.
- **Cierre:** *Empezar el primero* y *Elegir cuándo para el primero* sólo muestran un aviso de
  demostración: no confirman compromisos ni cuentan como avance. Sin recompensas, puntos ni rachas.

### Cifras del recorrido pedido

| Escenario | Pendiente esta semana | Declarada (usada por lo simulado) | Sin ubicar | Margen |
|---|---:|---:|---:|---:|
| Plan real | 9 h 20 | 7 h 30 (0) | 1 h 50 | 0 |
| 1. Límites | 7 h 35 | 7 h 30 (1 h) | 1 h 50 | 45 min |
| 2. + Teoría de Derivadas | 6 h 50 | 7 h 30 (1 h 45) | 1 h 50 | 45 min |
| 3. + Práctica de Derivadas | 6 h 05 | 7 h 30 (2 h 30) | 1 h 50 | 45 min |
| 4. + Economía (orden elegido) | 5 h 05 | 7 h 30 (3 h 30) | 1 h 50 | 45 min |

El paso 4 mueve el parcial de práctica del jueves 19:30 al viernes 15:00 y agrega el riesgo *Resolver un
parcial de práctica queda a 2 h del parcial*. En todos los escenarios, y hay test sobre más de 100:
`pendiente − (declarada − usada) = sin ubicar − margen`.

**Margen y trabajo sin ubicar a la vez** aparecen desde el paso 1. La razón se dice en pantalla: *el margen
está en huecos de hasta 45 min, y lo que falta ubicar necesita al menos 1 h 50 seguidos. No se parten ni
se acortan bloques.*

## 8. Plan real frente a escenario

- **Tu plan real** es `proyectar(VACIO)`: una constante que nada del laboratorio modifica (test).
- **Escenario** contiene la pila, las reubicaciones, los cambios de horario y las excepciones de
  disponibilidad. Siempre rotulado **Escenario hipotético · Tu plan real no cambió**, en texto.
- Los indicadores muestran *plan real: X* cuando el escenario difiere.
- **Modo explicado** (predeterminado) dibuja *antes aquí → nueva posición*, *ya no hace falta* y *antes sin
  lugar*, y abre el detalle del paso. **Modo limpio** oculta las huellas, deja el movimiento y una frase, y
  ofrece *Ver por qué cambió*. Los dos conservan la etiqueta de escenario y la vuelta al plan real.
- Movimiento FLIP de **480 ms**, sólo en lo que cambió de franja; sin animar la carga, las clases ni la
  evaluación; nada con `prefers-reduced-motion`.
- El **Calendario** lee la proyección seleccionada: la reubicación y el nuevo horario aparecen sólo en el
  del escenario, con la promesa original al lado.
- El **Gantt** tiene tres pistas por tema: *Cátedra* (dada o esperada, con fuente y confianza), *Vos hoy*
  (progreso registrado; **la simulación nunca la mueve**) y *Si cumplís este escenario*. Sin porcentajes ni
  predicciones.

## 9. Limitaciones conocidas

**Del modelo**

- ⚠️ **El acomodador es del laboratorio.** Es codicioso: prioridad, orden del fixture, primer hueco que
  alcance, sin partir bloques. Existe porque cinco pasos combinables no se pueden preparar a mano. **No es
  el motor del producto ni una propuesta de motor**, y no resuelve [D-01](DECISIONS.md#d-01) ni
  [D-02](DECISIONS.md#d-02).
- **Los riesgos son reglas del laboratorio**: sin lugar, a menos de 3 h del parcial, intento sin
  prerequisito. No son `RiskSignal` ni `PLAN-v0.1`.
- **Cambiar horario no aplica las condiciones de ADR-046**: mismo día institucional, una vez por cadena y
  15 min de anticipación. La pantalla lo dice.
- **Un compromiso simulado queda en su horario**, aunque en la pila esté antes que otro paso posterior.
- **El aviso de prioridad sólo aparece al simular**, no al reubicar.
- **Sin reloj adelantado**: V2 no repite el escenario de incumplimiento de V1. El incumplido es un hecho
  del fixture y lleva a *Reorganizar sin cortar*.

**De la pantalla**

- *Empezar ahora*, *Abrir Modo Clase*, *Abrir registro de clase* y el vínculo con Modo Examen son avisos o
  bloques locales: no navegan.
- **A 1024 px** el inspector mide 320 px y apila sus datos, y el Calendario desplaza el domingo dentro de
  su grilla.
- **Tablet (768 px)**: se verificó sólo que la página no se desplace horizontalmente.
- Los eventos cortos del Calendario recortan el texto; el nombre completo está en `aria-label`.
- Los conectores entre estaciones de la misma fila son cortos.

**De accesibilidad**

- **Contraste:** lo simulado usa el par `--accent` / `--accent-foreground` de `app/globals.css`, pero
  **no se midió con una herramienta** en este laboratorio.
- La grilla usa `role="table"` sobre filas con `subgrid`: **no se probó con un lector de pantalla real**.
- **Tema noche: no se inspeccionó.** Todo es por tokens, pero no se miró.

**De copy**

- *«Simular este workitem»* va en inglés porque lo fijó el pedido. El producto lo prohíbe en
  `lib/content/` (`tests/copy-sin-ingles.test.ts`) y diría *acción*.

## 10. Verificación

| Gate | Resultado |
|---|---|
| Formatter | ⛔ **El repo no tiene formatter configurado** y no se instaló ninguno |
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm test` | ✅ **124 archivos, 3330 tests.** V2 suma `tests/plan-vivo-spike-v2.test.ts` (623, parametrizados sobre el muestrario) y `tests/plan-vivo-spike-v2-vista.test.tsx` (38). Los 92 de V1 siguen verdes y sin cambios |
| `npm run build` | ✅ Las dos rutas se sirven dinámicas (`ƒ`) |
| Smoke con servidores reales | ✅ Las cuatro combinaciones de flags (§2) |
| Navegador real (Chromium headless) | ✅ 1440 × 900, 1024 × 768, 768 × 1024 y 390 × 844: sin scroll horizontal de página y sin errores de consola. Recorrido del §28 hecho funcionando, con las animaciones medidas en curso |
| `npm run db:verify` | ⛔ **No se corrió**, como pide el prompt: V2 no toca base ni schema, y el comando vacía la base del servidor de desarrollo |

## 11. Cómo borrarlo

```bash
rm -r app/demo/plan-vivo-spike-v2 tests/plan-vivo-spike-v2.test.ts tests/plan-vivo-spike-v2-vista.test.tsx \
  docs/experiments/plan-vivo/V2_SCOPE.md docs/experiments/plan-vivo/V2_REVIEW.md
```

Además, sacar la nota *V2* de ADR-109 y la fila de `README.md`. Nada del producto ni de V1 lo importa, y
hay test que lo verifica.
