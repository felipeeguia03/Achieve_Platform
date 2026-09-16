# Auditoría de integración — Plan vivo V3 en el producto

**Estado:** 🔴 `BLOCKED ON OWNER` · 16 sep 2026 · rama `feature/plan-vivo-calendar-integration`, creada
desde `48c2913` (punta de `experiment/plan-vivo-spike-v3-calendar-first`).
**Pedido:** *«Integrar Plan vivo V3 en Achieve»* (calendario propuesto por el sistema, disponibilidad
editable, planificación manual, simulación y compromisos), bajo `PLAN_VIVO_CALENDAR_INTEGRATION=1`.
**Método:** solo lectura de `AGENTS.md`, ADR-004, 046, 064, 100 y 109, `plan-vivo/DECISIONS.md`, el
laboratorio V3 completo, las migraciones de `action`, `commitment`, `availability`, `class_session` y
`assessment`, `lib/domain/ade.ts`, `lib/server/servicios/compromiso.ts`, `app/api/compromiso` y
`app/(student)/calendario`.

> Esta auditoría no decide nada. Lo que se decida entra a `docs/decisions.md`.

---

## 0. Divergencia de ramas

`main` es ancestro directo de la rama del spike (189 commits adelante, 0 atrás). **No hay divergencia**:
la rama de integración parte de la punta del spike y contiene el producto entero. El spike V3 queda
intacto.

**No existe `/plan`** en `app/(student)` (ADR-109 D-09 la propuso y no se construyó). No hay nada que
redirigir.

## 1. El bloqueo

**[ADR-109](../../decisions.md#adr-109) sigue `PENDING`**, y dice textual: *«Mientras siga `PENDING`,
sólo documentación y tests de reglas vigentes.»* El pedido implementa exactamente contra sus tres
decisiones bloqueantes, y además contra cuatro ADR `ACCEPTED`:

| Pedido | Choca con | Estado |
|---|---|---|
| El sistema **ubica en el tiempo** acciones no comprometidas | ADR-109 **D-01** · ADR-064 (*el ADE nunca agenda*) · ADR-073 §3 (*el reparto no agenda*) | `PENDING` / `ACCEPTED` |
| Una **cola de varias Actions** por ubicar | ADR-109 **D-02** · ADR-004 (*una recomendación principal*) · `ade.ts`: *«el ADE no apila acciones encima»* — **hay a lo sumo una `Action` viva por cursada** | `PENDING` / `ACCEPTED` |
| El **Calendario** se vuelve el plan, con *«Agregar disponibilidad»* y propuestas | **ADR-100** (*«sólo lee y no agenda»*; ⛔ *«Click para agendar un bloque»*, ⛔ *«Plan de estudio»*) · `product.md` §12.3 (*calendario propio completo* fuera de alcance) | `ACCEPTED` |
| Ubicar temas sin fecha propia | ADR-085 (*un tema sin puntas no se ubica*) | `ACCEPTED` |
| *«Prioridad muy alta»* visible | **`P-03`** (*ninguna magnitud de máquina visible*) · `ade.ts` `razonDe`: *«nunca dice "prioridad alta"»* · `C-06` | `ACCEPTED` (design-system §4.3) |
| Ruta, flag y **nombre visible** | ADR-109 **D-09** — *«lo nombra el owner»* | `PENDING` |

**Regla 2 de `AGENTS.md`:** un agente no resuelve una decisión `PENDING`. **§8:** si una instrucción
contradice un `ACCEPTED`, se dice antes de ejecutar.

## 2. Qué puede reutilizarse

| Pieza | Dónde | Sirve para |
|---|---|---|
| Aritmética de intervalos (`unir`, `intersectar`, `restar`, `buscarHueco`) | `app/demo/plan-vivo-spike-v3/_lab/motor.ts` | El planificador puro — **acoplada a globales del fixture** (`ACCIONES`, `FIJOS`): hay que parametrizarla antes de moverla a `lib/domain/` |
| Conflicto con clase | `lib/domain/superposicion.ts` (`bloqueQueSeSuperpone`, `primerInicioSinClase`) | Conflicto duro. **Una sola** aritmética de husos: `lib/domain/zona.ts` |
| Elegibilidad de cambio de horario | `lib/domain/renegociacion.ts` (ADR-046/050) | Arrastrar un `Commitment` → flujo explícito |
| Orden de unidades | `lib/domain/ade.ts` `costoDeNoActuar` — **privado** | Prioridad determinista; D-02 A propone exponerlo |
| Duración | `action.estimated_minutes_min/max`, `lib/domain/duracion.ts`, `multiplicador.ts` | Rango; *probable* no existe (D-03) |
| Prerrequisitos explícitos | `topic_prerequisite` + `UnidadCandidata.requiere` | Dependencias **duras** entre temas — nunca derivadas de `orden` |
| Riesgos de planificación | `lib/domain/riesgos-de-planificacion.ts` (`PLAN-v0.1`) | Margen, evaluaciones encimadas |
| Grilla y fechas | `lib/domain/calendario.ts`, `components/screens/calendario.tsx`, `GET /api/calendario` | Región izquierda |
| Gantt por tema | `components/screens/materia-cursado.tsx`, `ganttDeMateria` | Región inferior — el spike lo **replica**, no lo importa |
| Compromiso | `POST /api/compromiso` (`accion`, `inicio`, `zona`, `minutos`, `clave`) + `UX04` | *Comprometerme* |
| Horarios | `bloques_de_cursada()` / `horariosReal.deCursadas()` | Clases fijas |

## 3. Qué existe sólo en el spike

Cola de varias acciones con prioridad en cuatro niveles; ubicaciones sugeridas; fijar; simulación
acumulativa; advertencias blandas por consecuencia; margen mínimo de 60 min (**inventado**, pregunta 14 del
README); disponibilidad por fecha; reloj adelantado; rescate *sin cortar*. **Todo sobre fixture propio y en
memoria.**

## 4. Contratos que faltan

| Falta | Por qué importa | ¿Migración? |
|---|---|---|
| **Varias `Action` por ubicar** | El ADE da una por cursada; la cola del pedido no tiene fuente | D-02: A = candidatos proyectados (no `Action`) · B = N filas `RECOMMENDED` |
| **Comprometerse con una acción que no es la vigente** | `POST /api/compromiso` acepta cualquier `action` del estudiante en estado comprometible, pero `UX04` sólo se abre sobre la vigente (`propuestaDeCompromiso`) y no recibe fecha/hora precargada | Sin migración si los candidatos son `Action`; **imposible** si son candidatos proyectados |
| **Persistir propuestas, fijados y overrides** | Sin eso, el «plan real» es estado del navegador y se pierde al recargar — y el Track B prohíbe `localStorage` para estado de dominio | Sí (tabla nueva) o se acepta que el plan real es efímero |
| **Disponibilidad editable desde el calendario** | `availability` es **semanal** (`day_of_week`) y su único escritor es el alta (`declarar_disponibilidad`, reemplaza todo `declared`). No hay franjas por fecha ni «repetir» | Semanal: sin migración (nueva ruta sobre la función existente). Por fecha: **migración** |
| **Dependencias `HARD`/`SOFT` entre acciones** | Sólo existe `topic_prerequisite` (duro, entre temas). *Blando* no existe en ningún lado | Sí, y **el criterio es de la psicopedagoga** (*«cómo se define una tarea comparable»* sigue abierto) |
| **Duración probable y confianza** | `action` tiene `min`/`max`, no `probable` | D-03 A: derivado sin migración |
| **«No fui a clase» (ausencia)** | **No existe** entidad de asistencia. `student_class_session` es la clase que el estudiante abrió, no asistencia | Sí + decisión de producto |
| **«Se canceló la clase»** | `class_session.status = 'cancelled'` existe **sin escritor**, y `class_session` es la clase dictada: mueve el Gantt de todos. Que un estudiante la marque es provenance `student`/`unverified` (ADR-029, I9) | Escritor nuevo + decisión de quién puede |
| **Registrar un override en Bitácora** | La Bitácora sale sólo de `hechos_de_cursada()`; un override local no es un hecho | Sí, o no se registra |
| **Personal Engine / Plan Engine** | No existen como módulos del producto; *Plan Engine* sólo nombra el motor del laboratorio | El planificador puro sería el primero |
| **Simulación de cumplimiento** | Suponer `Evidence` suficiente + progreso choca con la cadena de no-implicación **si no se rotula**; el spike lo rotula | No; es proyección |

## 5. Qué podría hacerse sin tocar base de datos

**Si el owner autoriza D-01 y D-02 (opción A):** un planificador puro en `lib/domain/` con tests; una
proyección de lectura en `lib/server/servicios/` que arme los candidatos desde el orden del ADE; la
experiencia del calendario bajo flag, con propuestas, fijados, simulación y deshacer **efímeros**;
*Comprometerme* sólo sobre la `Action` vigente de cada cursada (la única que es fila).

**Sin autorización:** sólo esta documentación y tests de reglas vigentes (ADR-109).

## 6. Riesgos de regresión

- `tests/shell.test.tsx` cuenta rutas y superficies; `tests/calendario.test.tsx` **verifica que el
  calendario no ofrece agendar ni un plan** — con el flag, esos guards tienen que distinguir.
- `components/screens/*` no se reescribe (regla 6): la experiencia nueva tiene que ser una superficie
  aparte que el flag elige, no una edición de `calendario.tsx`.
- `lib/domain/` puro: el motor del spike lee globales; moverlo tal cual rompe la frontera.
- Registro de CTAs cerrado (26): *Comprometerme* desde el calendario es un origen nuevo de una CTA
  existente o una CTA nueva con ADR.
- Tres representaciones del tiempo (`UX01` *Tu día*, Calendario, Gantt de Materia) pueden contradecirse
  si la proyección no es una sola.

## 7. Decisiones que necesita el owner antes del corte 2

1. **Cerrar ADR-109 D-01, D-02 y D-09** (y enmendar ADR-064, ADR-073 §3, ADR-100 y `product.md` §12.3
   para el flag).
2. **Prioridad visible** — ¿se enmienda `P-03` para permitir *Muy alta · Alta · Media · Baja*, o la cola
   muestra sólo la razón (*«Entra en el Primer parcial»*) y el orden?
3. **Persistencia del plan real** — ¿efímero (se pierde al recargar) en esta integración, o tabla nueva?
4. **Disponibilidad** — ¿semanal sobre la función existente, o por fecha con migración?
5. **Ausencia y clase cancelada** — ¿se difieren (sin persistencia, sin adaptador local), o se diseña su
   modelo con ADR propio?
6. **Dependencias blandas y margen mínimo** — ¿se difieren a la psicopedagoga?
