# Modo Focus — informe y plan

**13 de septiembre de 2026** · [ADR-104](decisions.md#adr-104), `ACCEPTED`. La propuesta del CFO
—un Pomodoro integrado— la reencuadró el owner como **Sesión de Focus**, y ordenó: *"hacé todo lo
recomendado y empezá, no dejes nada pending"*.

> Compromiso → Acción → **Sesión de Focus** → Bitácora → Evidencia opcional → Progreso

Una sesión **registra tiempo sobre una acción comprometida**. No es evidencia, ni progreso, ni
cumplimiento, y la copy lo dice.

---

## A. Lo que ya existía

| Pieza | Dónde | Qué aportó |
|---|---|---|
| `EJECUCION`, el nodo del loop sin pantalla | `lib/navigation/surfaces.ts` | El hueco exacto: `UX04 → ejecución → UX05`. `UX05` no se alcanzaba por clic |
| El patrón de sesión del estudiante | Modo Clase, [ADR-098](decisions.md#adr-098) | Una abierta con índice único, sin cierre por tiempo, instantes del servidor |
| `commitment.planned_minutes` | `data-model.md` §3.2 | Estimado contra real sin datos nuevos |
| `hechos_de_cursada()` | la única fuente histórica | Una sesión tiene `Action`: entra a la Bitácora sin segunda fuente |
| Los tokens del modo noche | `app/globals.css`, [ADR-097](decisions.md#adr-097) | La concentración oscura sin colores nuevos |
| La barra de objetos | [ADR-088](decisions.md#adr-088) | El «dock» de la propuesta ya existía |

**Dos hechos del código que la propuesta no conocía:**

1. **Nadie escribía `STARTED`.** *Empezar* navegaba a `/accion`; el compromiso recorría
   `CONFIRMED → STARTED → COMPLETED` recién al validar (`completarAccion`, B6.8).
2. **La entrega exige un compromiso vivo** (`CONFIRMED`, `DUE` o `STARTED`). Cerrar el compromiso en
   *Terminé* dejaría al estudiante sin poder entregar.

## B. Los seis choques, y cómo quedaron

| # | Choque | Decisión (ADR-104) |
|---|---|---|
| 1 | `CommitmentStarted` no se emite por un timer local | Empezar es **una operación del servidor**: compromiso `STARTED` y acción `IN_PROGRESS` por sus máquinas, después la sesión (§3) |
| 2 | `CTA-005` sólo sale de Hoy y Compromiso; «Vencido» en `DUE` | **`CTA-026`** desde `UX01`, `UX02` y `UX04`; se puede empezar antes de la hora; el chip dice *«Es hora de empezar»* (§2, §4) |
| 3 | Enm. 8 de ADR-088 exige controles; `Escape` minimiza | Focus es un objeto con controles, pero **la concentración ocupa todo** y salir de ella **pausa primero** (§10) |
| 4 | La Bitácora la ve el operador | El anotador **no va** a `product_event`, `hechos_de_cursada()` ni la Bitácora (§12) |
| 5 | *¿Qué avanzaste?* se pisa con `Reflection` | Es **otra cosa**: «avance», no satisface ADR-026 (§13) |
| 6 | SOS no existe; sin captura de Focus; sugerir preset es un recomendador | SOS **afuera**; pantalla con los tokens y primitivas existentes; sólo **preferencias** (§17, §18, §20) |

Y un desvío declarado del spec §8.4: **`Terminé` no lleva el compromiso a `COMPLETED`** (§15).

## C. Datos declarados, derivados e inferidos

| Declarado (lo sella el servidor) | Derivado | Inferido |
|---|---|---|
| empezar, pausar, continuar, pasar a Pomodoro, volver antes, cerrar, el último latido, el avance, el anotador | la fase, la recuperación, el bloque, foco/descanso/pausado/total, bloques completos y parciales | **nada** |

La fase **no se persiste**: sale del tramo abierto. La recuperación, del último latido. Los números
**se congelan al cerrar** y la Bitácora los lee.

## D. Lo que queda afuera

SOS/chat · Picture-in-Picture · PWA · notificaciones del sistema · inicio automático del siguiente
bloque · recomendación de duración · estadísticas comparativas · predicciones · intervenciones
automáticas · métricas para universidades · catálogo de sonidos. **Decididos, no pendientes** (§17).

## E. Cortes

| Corte | Qué | Estado |
|---|---|---|
| 1 | Dominio puro: presets, límites, tramos, avance del reloj, comandos, recuperación, resumen | ✅ `lib/domain/sesion-de-focus.ts` |
| 2 | Migración: `focus_session`, `focus_segment`, `focus_preference`, dos funciones atómicas, `hechos_de_cursada()` con `datos` | ✅ `20261022000000_modo_focus.sql` |
| 3 | Service, Repository, cinco rutas, dos eventos `TRANSICION` | ✅ |
| 4 | Nodo `FOCUS`, `CTA-026`, `CTA-027`, orígenes nuevos de `CTA-006` y `CTA-009`, ficha *Focus · materia* | ✅ |
| 5 | Pantallas: sin sesión, concentración, pausa, lista, descanso, recuperación, cierre, cerrada; selector Pomodoro; anotador; sonido | ✅ |
| 6 | Hoy, Materia y Compromiso llevan a Focus; la Bitácora muestra la sesión | ✅ |

### La API

| Ruta | Qué |
|---|---|
| `GET /api/focus` | La sesión abierta; sin ninguna, `iniciable` y las preferencias. `?sesion=<id>`, una del estudiante |
| `POST /api/focus { compromiso?, cursada? }` | Empezar (`CTA-026`). Repetir devuelve la misma. Otra abierta: `409 YA_HAY_OTRA_ABIERTA` |
| `POST /api/focus/comando { sesion, comando }` | `PAUSAR` · `CONTINUAR` · `POMODORO {configuracion}` · `VOLVER_ANTES` · `LATIDO` · `RECUPERAR {opcion}`. Fuera de fase: `409 FASE_INVALIDA` |
| `POST /api/focus/fin { sesion, como, avance? }` | `SAVED` (`CTA-027`) · `DONE` (`CTA-006`, acción a `EVIDENCE_PENDING`) · `RECUPERADA` (cierra en el último latido). Sin `sesion` y `DONE`: *Terminé* sin reloj |
| `POST /api/focus/anotador { sesion, texto }` | *Para después*. Privado, sin eventos. También con `keepalive` al irse |
| `POST /api/focus/preferencias` | Modo, preset, personalizado, sonido y volumen |

⚠️ **Ningún instante viaja desde el cliente.** Lo ajeno es `404`.

### Recorrido verificado en el navegador (13 sep, Chromium, `estudiante.ucc@achieve.local`)

1. Hoy *Comprometerme* → *Me comprometo* → confirmar → Hoy *Ver compromiso* → `UX04` *Empezar*.
2. `/focus` en concentración oscura, reloj libre corriendo. Anotador: *Guardado*.
3. `Escape` → *Sesión pausada*. *Minimizar* → Hoy, con la ficha *Focus · Laboratorio de computacion*.
   Hoy dice *Continuar*.
4. Volver: sigue pausada y el anotador sigue ahí. *Pasar a Pomodoro* → *Clásico* → `24:58`,
   *Foco 1 de 4 · termina 23:38*.
5. *Pausar* → *Salir y guardar* → avance → *Sesión guardada*. *Ver en la Bitácora*: *Sesión de Focus
   · …*, el detalle y *Avance: «…»*. **El anotador no aparece.**
6. Base: compromiso `STARTED`, acción `IN_PROGRESS`; tramos `FOCUS:PAUSED, PAUSE:RESUMED,
   FOCUS(POMODORO,1):PAUSED, PAUSE:SAVED`; eventos `CommitmentStarted`, `ActionInProgress`,
   `FocusSessionStarted`, `FocusSessionEnded`.
7. Segunda sesión desde Hoy *Continuar*; se simuló la notebook cerrada (último latido hace 10 min,
   tramo de 12) → *Encontramos una sesión sin cerrar* → *Reanudar*: **el reloj muestra `02:00`, no
   `12:00`**. *Terminé · Subir evidencia* → `/evidencia`; base: `STARTED` + `EVIDENCE_PENDING`. Hoy
   pasa a *Subir evidencia*; `UX04`, a *Continuar*.
8. A 360 px, sin scroll horizontal. Sin errores de consola en ningún paso.

La demo se restauró después desde la copia previa (`db:verify` la vacía).

### Lo que quedó sabido al construirlo

- **El desempate de `estado_del_dia()` no es determinista**: el alta escribe el mismo `created_at` en
  todas las cursadas. Copiarlo para elegir el compromiso de *Empezar* falló en el navegador (`404`).
  Focus elige **el compromiso vivo del estudiante** (`STARTED` › `DUE` › `CONFIRMED`, el más reciente).
- **`StrictMode` monta, desmonta y vuelve a montar**: pausar al desmontar pausaba al abrir. Hay un
  contador de pantallas montadas.
- **Una CTA en el registro exige un escenario que la alcance**: `FX-LOCAL-COMMITMENT-CONFIRMED` gana
  el contexto `FOCUS`.
- **«0 min» se lee como que no pasó nada**: *«menos de un minuto»*, como Modo Clase.

## F. Riesgos

| Riesgo | Mitigación |
|---|---|
| Una pestaña de fondo frena los timers | El reloj se calcula de instantes; la alarma se agenda en el reloj de audio; gracia de 2 min sobre latidos de 30 s |
| Dos clics a la vez | Versión optimista y `aplicar_comando_de_focus()` todo o nada; índice de un solo tramo abierto |
| Tiempo inventado por una notebook cerrada | Recuperación: nunca más allá del último latido ni del fin planeado |
| El anotador filtrado | Guards en la migración, el Service, `db-aislamiento.sh` y el test de API |
| El compromiso cerrado antes de entregar | *Terminé* no lo cierra (§15); lo cierra la validación |
