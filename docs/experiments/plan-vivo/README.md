# Experimento «Mi Plan vivo»

**Carpeta:** `docs/experiments/plan-vivo/`
**Rama:** `feat/paralelo` (la secuencia sugería `feat/plan-vivo-lab`; se trabaja en la rama actual, que
no es `main`)
**Abierto:** 14 de septiembre de 2026
**Estado:** 🔴 **CONTRATO CONGELADO, IMPLEMENTACIÓN BLOQUEADA** hasta que el owner conteste
[ADR-109](../../decisions.md#adr-109) (`PENDING`).
**Spike visual:** 🟡 `READY FOR PRODUCT REVIEW` — [`SPIKE.md`](SPIKE.md). Una demostración aislada y
descartable en `/demo/plan-vivo-spike`, detrás de `PLAN_VIVO_SPIKE=1`, con datos de demostración y
ubicaciones preparadas a mano. **No es el producto y no cierra ADR-109.**
**Laboratorio V2:** 🟡 `READY FOR PRODUCT REVIEW` — [`V2_SCOPE.md`](V2_SCOPE.md) y [`V2_REVIEW.md`](V2_REVIEW.md).
En `/demo/plan-vivo-spike-v2`, detrás de `PLAN_VIVO_SPIKE_V2=1`, en la rama `feat/plan-vivo-lab-v2`. V1 queda
intacta.

> Esta carpeta **no es una segunda fuente de verdad**. Manda el orden de `AGENTS.md` §8: spec →
> ADRs `ACCEPTED` → `product.md`/`data-model.md`/`architecture.md` → código. Lo que se decida acá
> entra a `docs/decisions.md` como ADR, y esta carpeta sólo lo detalla.

---

## 1. Para qué

La hipótesis que guía la secuencia:

> Achieve no es un dashboard ni una lista de tareas. Es un sistema que convierte la realidad académica
> del alumno en un plan visible, explica cuál es la mejor próxima acción y muestra cómo cambia el
> futuro si el alumno actúa —o si deja pasar el tiempo.

Lo que el experimento quiere poder mostrar, en una sola vista:

1. **Lo que no se mueve**: clases, evaluaciones y compromisos ya confirmados.
2. **Lo que el sistema propone** alrededor de eso, y que sí puede reordenarse.
3. **Por qué** la próxima acción es ésa.
4. **Qué cambia** si el estudiante la hace, y qué cambia si deja pasar el tiempo — sin predecir notas
   ni readiness.

## 2. Por qué está bloqueado, en una línea

**Varias decisiones `ACCEPTED` prohíben hoy exactamente el objeto central del experimento**: ubicar en
el tiempo acciones que nadie comprometió. El ADE *"nunca agenda"* ([ADR-064](../../decisions.md#adr-064)),
el reparto *"no agenda"* ([ADR-073](../../decisions.md#adr-073) §3), un tema sin puntas *"no se ubica"*
porque sería *"inventar un plan de estudio que nadie hizo"* ([ADR-085](../../decisions.md#adr-085)), y
el Calendario descartó *"Plan de estudio"* y *"agendar un bloque"* ([ADR-100](../../decisions.md#adr-100)).
Un agente no puede levantar eso: **lo decide el owner**. El detalle está en
[`DECISIONS.md`](DECISIONS.md).

## 3. Alcance

**Entra (si ADR-109 se acepta):**

- Una proyección de **solo lectura**, calculada por funciones puras en `lib/domain/` y armada por un
  Service, sobre **datos sintéticos**.
- Una vista nueva detrás de un flag apagado por defecto.
- Simulación por hover/foco que **no hace ningún request de escritura ni emite eventos**.
- Confirmar una propuesta usa **los flujos que ya existen** (`POST /api/compromiso`, con la regla de
  superposición de [ADR-084](../../decisions.md#adr-084)). El experimento no agrega escrituras propias.

**No entra, en ningún prompt de la secuencia:**

- Datos reales ([ADR-006](../../decisions.md#adr-006)).
- Migraciones que persistan "el plan". Un plan persistido **se vuelve mentira solo**
  ([ADR-068](../../decisions.md#adr-068) §1, el mismo argumento que para los minutos por tema).
- Eventos nuevos en `product_event`. El spec: *"evento nuevo para cada interacción: **no está aprobado**"*
  (`lib/domain/product-events.ts`).
- Un LLM decidiendo nada ([ADR-004](../../decisions.md#adr-004); [ADR-080](../../decisions.md#adr-080)
  sigue candidato).
- CRM, WhatsApp o cualquier llamada de red hacia afuera ([ADR-035](../../decisions.md#adr-035)).
- Tocar `components/screens/*`, `components/ui/*` o `app/globals.css` fuera de lo que autorice el ADR.

## 4. Ruta y flag propuestos

⚠️ **Propuesta, no decisión.** Es la [D-09](DECISIONS.md#d-09) de ADR-109.

| | Propuesta | Precedente en el repo |
|---|---|---|
| **Ruta** | `app/(student)/plan/page.tsx` → `/plan` | Nodos con ruta y sin wireframe: `CALENDARIO`, `FOCUS`, `RECORRIDO` (`lib/navigation/surfaces.ts`) |
| **Nodo** | `PLAN_VIVO` con `wireframe: null`. **No es `UX10`**; `superficieIds` sigue en nueve | ADR-066, ADR-100 §1, ADR-104 §5 |
| **Lectura** | `GET /api/plan`, con JWT del estudiante | `GET /api/tablero` y `GET /api/calendario`: lectura aparte, sin tocar `estado_del_dia()` |
| **Flag** | `PLAN_VIVO=1`, leído **en el servidor**. Sin él la página hace `notFound()`, la API responde `404` (no `403`) y no hay ítem en la barra lateral | `ESCALAMIENTO_SINTETICO=1` en `app/api/escalamiento/route.ts` |
| **Datos** | El mundo sintético de `npm run db:demo` y `npm run db:materia` | `docs/demo-mvp.md` |

**Por qué un flag propio y no `MODO_PRUEBA=1`.** `MODO_PRUEBA` prende el dock, los avisos, el asistente,
Formación simulada, los requisitos y lo simulado de Modo Clase: es la variable con la que el owner hace
demos. Colgar de ella un experimento que contradice ADRs aceptados lo encendería en cada demo. Con un
flag propio se prende, se apaga y **se borra** sin tocar lo demás.

**Costo conocido:** `tests/shell.test.tsx` fija **16** rutas bajo `app/(student)` y un nodo por ruta;
agregar `/plan` lo lleva a 17 y exige tocar ese test en el mismo commit que la ruta.

## 5. Cómo se ejecuta (cuando esté desbloqueado)

```bash
npm run db:start && npm run db:demo      # mundo sintético
PLAN_VIVO=1 npm run dev                  # la ruta /plan existe sólo con la variable
```

Verificación de cada prompt, los cinco gates de `CLAUDE.md` regla 4:

```bash
npm run lint && npm run typecheck && npm run build && npm test && npm run db:verify
```

⚠️ `db:verify` **vacía la base de negocio**: después, `npm run db:demo` otra vez.

## 6. Antes de tocar UI

Las 34 capturas **no están en este worktree** (`docs/diseño/` no existe acá). Están en el checkout
principal, `../Achieve_Platform/docs/diseño/`. Todo prompt que dibuje pantalla tiene que **abrirlas desde
ahí**, sin copiarlas ni commitearlas (ADR-006, AGENTS.md §1.5). Si no se pueden abrir: se dice y se para.

## 7. Documentos de esta carpeta

| Archivo | Qué contiene |
|---|---|
| [`REPOSITORY_AUDIT.md`](REPOSITORY_AUDIT.md) | Qué existe, qué se reusa, qué falta. Con paths verificados |
| [`SYSTEM_MAP.md`](SYSTEM_MAP.md) | Entradas, engines, salidas, eventos y fronteras |
| [`DECISIONS.md`](DECISIONS.md) | Las 12 invariantes contra los ADRs vigentes, y las decisiones para el owner |
| [`IMPLEMENTATION_SEQUENCE.md`](IMPLEMENTATION_SEQUENCE.md) | Los nueve prompts que siguen, y qué necesita cada uno |
| [`SPIKE.md`](SPIKE.md) | El spike visual V1: cómo abrirlo, qué es preparado, qué se hizo distinto del pedido y qué mirar |
| [`V2_SCOPE.md`](V2_SCOPE.md) | 🆕 El laboratorio V2: inspector, simulación acumulativa, camino y Gantt; qué se mueve, qué no, y sus limitaciones |
| [`V2_REVIEW.md`](V2_REVIEW.md) | 🆕 Las preguntas para el Product Owner, sin responder |
