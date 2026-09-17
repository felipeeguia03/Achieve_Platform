# Plan vivo en el Calendario — informe de integración

**Estado:** 🟡 `IMPLEMENTED BEHIND FLAG` · 16 sep 2026 · rama `feature/plan-vivo-calendar-integration`
**Decisión:** [ADR-110](decisions.md#adr-110) (cierra ADR-109 D-01, D-02 y D-09) · diferido: [ADR-111](decisions.md#adr-111)
**Flag:** `PLAN_VIVO_CALENDAR_INTEGRATION=1` · **Auditoría previa:** [`experiments/plan-vivo-v3/INTEGRATION_AUDIT.md`](experiments/plan-vivo-v3/INTEGRATION_AUDIT.md)

> ⛔ **No se promueve a producción.** Corre sobre datos sintéticos ([ADR-006](decisions.md#adr-006)), el
> copy no pasó por la psicopedagoga (ADR-075) y la hipótesis *«el calendario alcanza como plan»* se
> valida con personas, no con tests. Que la pantalla funcione no dice que el plan mejore resultados.

---

## 1. Qué es

Con el flag, **`/calendario` es el plan**: Achieve propone dónde entra el trabajo pendiente de la semana
dentro de la disponibilidad declarada, y el estudiante acepta, mueve, fija, vacía o reconstruye esa
propuesta. Sin el flag, `/calendario` es exactamente [ADR-100](decisions.md#adr-100) y
`GET /api/plan-vivo` responde `404`.

Tres regiones: **la semana** (calendario de 7 días, un día por vez en móvil), **trabajo por ubicar**
(columna derecha, plegable debajo de `lg`) e **impacto académico** (el `Gantt` de Materia, reutilizado tal
cual).

## 2. Dónde vive

| Capa | Archivo |
|---|---|
| Tipos | `lib/domain/plan-vivo/tipos.ts` — `PlanningWorkItem`, los tres ejes, `PlanningInput`, `PlanningProjection` |
| Planificador puro | `lib/domain/plan-vivo/planificador.ts` — `planificar`, `validarUbicacion`, `validarIntercambio` |
| Sesión | `lib/domain/plan-vivo/sesion.ts` — operaciones, deshacer/rehacer, simulación |
| Impacto | `lib/domain/plan-vivo/impacto.ts` |
| Orden del ADE | `lib/domain/ade.ts` — `candidatosDelAde` (mismo costo, misma razón, mismo bloque que `recomendar`) |
| Base del servidor | `lib/server/servicios/proyeccion-plan-vivo.ts` + `lib/server/repositorios/plan-vivo.ts` |
| API | `app/api/plan-vivo/route.ts` (sólo `GET`) |
| Flag | `lib/server/plan-vivo-flag.ts`, `lib/client/plan-vivo-flag.tsx`, `app/(student)/calendario/page.tsx` (dinámica) |
| Pantalla | `components/screens/plan-vivo.tsx` · contenedor `components/superficies/plan-vivo.tsx` · elección `components/superficies/calendario-o-plan.tsx` |
| Copy | `lib/content/es-AR.ts`, claves `PLAN_VIVO.*` |

**Una sola proyección:** calendario, cola, métricas, explicación e impacto leen el mismo
`planificar(entradaDe(base, estado))`. La simulación es `snapshot(real) ⊕ operaciones`.

## 3. Contratos reutilizados y faltantes

**Reutilizados, sin cambios:** `GET /api/calendario` (su lectura), `contexto_del_ade`, `GET /api/materia`
(el Gantt), `POST /api/compromiso` (idempotencia, pertenencia, estado y ADR-064 los valida el servidor),
`POST /api/alta/disponibilidad` (la función del alta, que reemplaza las filas `declared`).

**Faltantes, y no se inventaron:** ausencia y clase cancelada ([ADR-111](decisions.md#adr-111)),
persistencia de propuestas y fijados (efímeros por decisión del owner), dependencias blandas y margen
mínimo (psicopedagoga), disponibilidad por fecha (`availability` es semanal), duración de una evaluación.

## 4. Cómo funciona

**Automático.** Recorre el trabajo por prioridad, con los prerrequisitos antes, y le da a cada uno el
primer hueco libre de la disponibilidad donde entra **entero** y termina antes de su evaluación. Respeta
clases, evaluaciones, compromisos, Focus en curso, lo fijado y lo que el estudiante ubicó. Lo devuelto a
la lista no se vuelve a ubicar hasta *Volver a la propuesta de Achieve*. La columna muestra **lo que
todavía no entra**, con su causa: sin tiempo estimado, espera a otra unidad, sin lugar antes de la
evaluación, **fragmentación** (hay tiempo, partido en ratos más cortos) o capacidad.

**Manual guiado.** No ubica nada solo. El mismo recorrido corre a la sombra y separa *Entrarían en tu plan*
de *No entran todavía*. Pasar a manual **conserva** las propuestas que estaban a la vista.

**Manual libre.** Una sola lista, en el orden de Achieve o por duración, filtrable por materia, con
insignia *Entra* / *No entra todavía*. Siempre se ven disponibilidad libre, sin ubicar y no entra; lo libre
se llama *Margen disponible* y no es un error.

**Prioridad.** Orden lexicográfico: costo del ADE (`costoDeNoActuar`: evaluación `+1000`, sin práctica
`+300`, recencia `0..60`, peso `0..120`) → plazo más cercano → materia → id. **Nunca se muestra como
nivel** (`P-03`): cada tarjeta dice su razón (*«Entra en Parcial 2.»*) y *¿Por qué?* abre un panel con
razones, dependencias, evaluación, por qué quedó donde quedó y lo que sigue en la lista.

**Métricas.**

| | Definición | Cambia con |
|---|---|---|
| Trabajo pendiente | Minutos probables de todo el trabajo sin avance registrado (comprometido incluido) | Sólo *Simular como realizada* |
| Sin ubicar | Pendiente − asignado (ubicado + comprometido) | Ubicar, devolver, vaciar |
| No entra | Minutos probables de lo que el recorrido no pudo ubicar | Disponibilidad, ubicaciones |
| Disponibilidad | Franjas futuras de la semana · libre = total − ocupada por propuestas, compromisos y Focus | Agregar o quitar franjas |

*Probable* es el **punto medio** de `min`/`max` (ADR-109 D-03 · A, provisional). Sin rango, el trabajo no se
ubica y se cuenta aparte: sin datos no es cero.

**Dependencias.** Sólo duras, de `topic_prerequisite`. El automático nunca las viola; a mano, ubicar antes
del prerrequisito es conflicto con motivo. Un tema cuya acción espera evidencia **no** satisface a sus
dependientes.

**Soltar un trabajo** — en orden: conflicto duro (clase, evaluación, compromiso, Focus, pasado, fuera de
la semana, después de la evaluación, prerrequisito) con hasta dos horarios alternativos → pisa propuestas
elegidas (*Ubicar y reorganizar*) o una fijada (conflicto) → horario libre no declarado (*Agregar
disponibilidad y ubicar*) → **consecuencia material** (trabajo más prioritario pierde su lugar: *Ubicar
igual* / *Ver la que pierde lugar*) → ubicado sin diálogo. Sobre un compromiso, el diálogo ofrece
*Cambiar horario del compromiso* (el flujo de ADR-046/050) y nunca lo mueve.

**Intercambiar.** Directo si las dos son propuestas sin fijar, duran lo mismo y no mueven a nadie;
con vista previa si duran distinto o desplazan a otras; prohibido con motivo si una está fijada o no entra.

**Fijar.** Conserva día y hora ante cualquier recálculo, sigue sin ser compromiso. Lo fijado en el plan real
sigue fijado en la simulación; lo fijado en la simulación se va al descartarla.

**Vaciar organización.** Saca todas las propuestas (fijadas incluidas) y pasa a manual. Conserva
disponibilidad, clases, evaluaciones, compromisos, Focus y avances; el pendiente no cambia.

**Comprometerme.** Sólo sobre la `Action` viva de una cursada (la única que es fila), ubicada en el futuro
y fuera de la simulación. CTA en el panel o doble clic. Abre un diálogo con acción, materia, horario,
duración probable y rango, evidencia esperada y motivo, y confirma por `POST /api/compromiso`. Después, la
base se relee: el bloque pasa a compromiso sólido y sale de la cola. **No toca progreso, pendiente ni
Gantt.** Un candidato no ofrece la CTA y lo dice.

**Simulación.** *Simular cambios* congela el plan real; borde punteado y banner *Estás simulando · Los
cambios no modifican tu plan real* con deshacer, rehacer y descartar. Dos impactos separados:
capacidad (disponibilidad, mover, fijar, estrategia: nunca baja el pendiente) y cumplimiento (*Simular
como realizada*: supone evidencia suficiente y avance, baja el pendiente y marca el tema *Supuesto:
criterio alcanzado* en el Gantt). Cada cifra que cambia dice *plan real: X*. Descartar restaura el plan
real **exacto**.

**Impacto académico.** *Cómo está* (el Gantt real, con los supuestos de la simulación si los hay), *Si
hacés la seleccionada* (su tema supuesto y qué trabajo deja de esperar) y *Ver impacto si cumplís este
plan* (todo lo ubicado y comprometido: pendiente final por materia, qué tiene lugar antes de su
evaluación y qué no). El Gantt real nunca se modifica: se dibuja una copia.

**Disponibilidad.** *Agregar disponibilidad* permite arrastrar sobre la grilla o usar el formulario
(día, desde, hasta) y quitar franjas. En el plan real queda **sin guardar** hasta *Guardar
disponibilidad*, que la escribe **semanal** —un martes vale para todos los martes— y lo avisa.

## 5. Decisiones y supuestos de esta integración

| Qué | Por qué |
|---|---|
| Evaluación con hora bloquea **60 min**; sin hora no bloquea | El schema no guarda duración |
| Clases en la zona del estudiante | Igual que el Calendario de ADR-100; `POST /api/compromiso` valida en la zona institucional |
| `EVIDENCE_PENDING` y `BLOCKED` no se planifican | Su trabajo ya se hizo o espera otra cosa |
| Entre materias se compara el mismo costo del ADE | Sin segundo ponderador |
| La página `/calendario` es dinámica | Para leer el flag en cada pedido, como la API. En una **ventana** del espacio de trabajo el flag es el del build (como `MODO_PRUEBA`) |
| `Gantt` de `materia-cursado.tsx` se exporta | Reutilizarlo sin copiarlo; su código no cambió |

## 6. Verificación

| Gate | Resultado |
|---|---|
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm test` | ✅ 128 archivos · `tests/plan-vivo-planificador.test.ts` (47) y `tests/plan-vivo-integracion.test.tsx` (23) |
| `npm run build` | ✅ `/calendario` y `/api/plan-vivo` dinámicas |
| `npm run db:verify` | ⛔ **No se corrió.** No hay schema ni funciones nuevas, y el comando vacía la base local, compartida con otro checkout en uso |
| Navegador (Chromium, `next start`) | ✅ con el estudiante sintético: plan inicial, *sin disponibilidad → agregar y ubicar*, fijar, *¿Por qué?* con Escape, simulación con disponibilidad nueva y cumplimiento, descartar = plan real idéntico, manual guiado y libre, vaciar, deshacer; 1440, 1024 y 390 px sin scroll horizontal de página y sin errores de consola. **Sin flag:** `/calendario` es ADR-100 y la API da `404` |
| No verificado | Confirmar un compromiso y guardar disponibilidad **en el navegador** (escriben en la base compartida; los contratos son los de siempre y la pantalla sólo los llama), lector de pantalla real, contraste medido, modo noche, teléfono real, arrastre táctil (en táctil se usa *Elegir horario*) |

Para el recorrido del alta del estudiante sintético hubo que completar `/alta/cursada` (ADR-105) con *No sé
mi comisión* y *Todavía no sé mi horario*: por eso ese estudiante no tiene clases dibujadas.

## 7. Limitaciones y riesgos

- **Todo lo que no es compromiso ni disponibilidad se pierde al recargar**, y la pantalla lo dice.
- **Con muchas materias, la cola es larga** (20 trabajos en el estudiante sintético): lo que no entra es
  la mayoría. Falta decidir si se agrupa o se recorta.
- **El candidato no se puede comprometer**: el estudiante ve trabajo que todavía no puede tomar. Es la
  consecuencia directa de D-02 · A.
- **El Gantt busca el tema por nombre**: dos unidades homónimas se marcarían juntas.
- **Guardar disponibilidad reemplaza todas las filas `declared`**; lo que tenía horario por fecha no existe.
- **La consecuencia material recalcula el plan dos veces por intento** y *Elegir horario* prueba cada
  cuarto de hora: con semanas muy cargadas puede sentirse lento.
- **No se registra nada en la Bitácora desde el plan** salvo lo que ya registra el compromiso.
- **Riesgo de producto:** planificar sin ejecutar. La pantalla no lo mide.

## 8. Qué no se promueve todavía

El flag entero. Antes: dictamen legal (ADR-006), revisión del copy por la psicopedagoga, decisión sobre la
persistencia, ADR-111, y las preguntas 1–14 del [informe de V3](experiments/plan-vivo-v3/README.md#13-preguntas-para-el-product-owner)
respondidas mirando esta pantalla.
