# Auditoría del repositorio para «Mi Plan vivo»

**Fecha:** 14 de septiembre de 2026 · **Commit base:** `e5a8dcd` · **Rama:** `feat/paralelo`
**Método:** lectura de `AGENTS.md`, `CLAUDE.md`, `docs/architecture.md` completo, las secciones de
`docs/product.md` §5, §10–§13, y de `docs/decisions.md` los ADR-004, 046–050, 064, 066, 068–075, 078,
089–091, 093, 094, 100 y 104; más `rg` por concepto sobre `lib/`, `app/`, `supabase/migrations/` y
`tests/`. **Cada path de este documento se verificó en el árbol**; lo que no existe se dice.

---

## 1. Arquitectura real, en una pantalla

```text
app/(student)/*/page.tsx ──fetch Bearer──▶ app/api/*/route.ts        (Controller)
                                              │
                                              ▼
                                  lib/server/composicion.ts           (composition root, único)
                                              │
                         ┌────────────────────┼─────────────────────┐
                         ▼                    ▼                     ▼
          lib/server/servicios/*     lib/domain/* (PURO)    lib/server/simulacion/*
          reglas, transacciones,     engines, máquinas,      sólo con MODO_PRUEBA=1
          eventos, proyecciones      precedencia, zona
                         │
                         ▼
          lib/server/repositorios/*  ──▶  Postgres (Supabase)  ·  supabase/migrations/*.sql
```

- **Controller → Service → Repository**, ratificado por [ADR-005](../../decisions.md#adr-005)
  (`docs/architecture.md` §3.2). El frontend no toca tablas; nunca `supabase.from(...)` en el cliente.
- **`lib/domain/` es puro**: sin I/O, sin React, sin `Date.now()` — el tiempo entra por parámetro
  (`lib/domain/ade.ts`, cabecera).
- **Las pantallas reciben props tipadas** (`lib/domain/view-models.ts`) y **nunca importan fixtures**.
- **Toda regla versionada lleva su constante `REGLA_*`**: `REGLA_DE_DURACION`, `REGLA_DE_REPARTO`,
  `REGLA_DE_MULTIPLICADOR`, `REGLA_DE_SUPERPOSICION`, `REGLAS_DE_PLANIFICACION` (`PLAN-v0.1`).

**Comandos reales** (`package.json`): `lint` = `eslint .` · `typecheck` = `tsc --noEmit` · `build` =
`next build` · `test` = `vitest run` · `db:verify` = cinco scripts de `scripts/` contra Postgres local.

**Stack:** Next.js `16.3.4`, React `19.2.6`, Tailwind v4, shadcn vendorizado, Vitest, zod,
`@supabase/supabase-js`. **No hay librería de feature flags.**

---

## 2. Documentos base que el proyecto exige

| Exigido | Existe | Dónde | Estado para este experimento |
|---|---|---|---|
| ARCHITECTURE | ✅ | `docs/architecture.md` | Vigente. §3.9 tiene conteos viejos (61 migraciones, 330 comprobaciones) |
| DATA_MODEL | ✅ | `docs/data-model.md` | Vigente |
| UX_FLOWS | 🟡 | No hay archivo con ese nombre. Lo cubren `docs/product.md` §10, `lib/navigation/surfaces.ts` y `lib/navigation/cta-registry.ts` | Suficiente; **no es bloqueo** |
| DECISIONS / ADR | ✅ | `docs/decisions.md` (ADR-001…ADR-108) | Vigente |
| ROADMAP | ✅ | `docs/roadmap.md` | **No tiene etapa para este experimento**: no es trabajo del roadmap |
| Criterios verificables | ✅ | Los cinco gates de `CLAUDE.md` regla 4 + «Cómo se verifica» de cada ADR | Vigente |
| Capturas de diseño | ⛔ **en este worktree** | `docs/diseño/` no existe acá. Las 34 están en `../Achieve_Platform/docs/diseño/` | **Bloqueo para todo prompt de UI** si no se abren desde ahí |

**Bloqueo documental real:** ninguno de los base. **Bloqueo de decisión:** [ADR-109](../../decisions.md#adr-109).

---

## 3. Qué existe, por concepto

Leyenda de la última columna: **R** = se reusa tal cual · **E** = se reusa extendiendo (con ADR) ·
**—** = no sirve para esto.

### 3.1 Hoy (`UX01`)

| Pieza | Path | Qué hace | Uso |
|---|---|---|---|
| Pantalla | `components/screens/hoy-autogestion.tsx`, `app/(student)/hoy/page.tsx` | Tablero de tres cuerpos: Hero, *Tu día*, *Riesgos detectados* (ADR-093, ADR-096) | — (regla 6) |
| Precedencia del Hero | `lib/domain/precedence.ts` (`selectHeroLevel`) | Nueve niveles de lifecycle | **R** para saber si hay algo en curso |
| Lectura del día | `app/api/hoy/route.ts`, `lib/server/servicios/proyeccion-hoy.ts`, función `estado_del_dia()` | Una lectura por superficie | R (no se toca) |
| Tablero | `app/api/tablero/route.ts`, `lib/server/servicios/proyeccion-tablero.ts` (`proyectarTablero`), `lib/server/repositorios/tablero.ts` | Lectura aparte con bloques, compromisos y disponibilidad | **R**: es el precedente de "pedido aparte" |
| Cuadro de hoy | `lib/domain/cuadro-de-hoy.ts` (`cuadroDeHoy`) | Clases de hoy, *Podés avanzar*, horarios. **"No es una agenda"** (ADR-094 §5) | R |
| Riesgos de planificación | `lib/domain/riesgos-de-planificacion.ts` (`riesgosDePlanificacion`) | Cinco reglas `PLAN-v0.1` sobre calendario y carga; no escriben ni emiten | **R** como insumo del "si dejo pasar el tiempo" |

### 3.2 Materia (`UX02`) y Materias

| Pieza | Path | Qué hace | Uso |
|---|---|---|---|
| Pantallas | `components/screens/materia-cursado.tsx`, `components/screens/indice-de-materias.tsx` | Gantt por tema (ADR-085), Lista y Gantt del período (ADR-078) | — |
| Gantt por tema | `ganttDeMateria` en `lib/server/servicios/proyeccion-materia.ts` | Barras con dos puntas **que son hechos**; sin puntas no se ubica | R (regla que el plan tiene que respetar) |
| Ventana | `lib/domain/ventana.ts` (`ventanaDe`, `ejeDelPeriodo`, `posicionEnEje`) | `[primera clase, evaluación]`; sin evaluación **no hay ventana** | **R** para el eje temporal |
| Cobertura | `lib/domain/cobertura.ts` (`coberturaDeMateria`, `minutosPendientes`, `porcentajeDeHoras`) | *Actividad registrada*, no dominio (ADR-072, ADR-075 §C) | **R** para "qué cambia si hago esto" |
| Duración por tema | `lib/domain/duracion.ts` (`REGLA_DE_DURACION`, `FACTOR_DE_ESTUDIO_FALLBACK = 1.5`) | Minutos por tema derivados, **no persistidos**, con fuente | **R** |
| Cursada / bloques | `lib/domain/cursada.ts`, función `bloques_de_cursada()`, `lib/server/repositorios/horarios.ts` | La **única** fuente de bloques de una cursada (ADR-105) | **R**, obligatorio |

### 3.3 Calendario

| Pieza | Path | Qué hace | Uso |
|---|---|---|---|
| Pantalla | `components/screens/calendario.tsx`, `app/(student)/calendario/page.tsx` | Día · semana · mes. **No agenda** (ADR-100) | — |
| Aritmética de fechas | `lib/domain/calendario.ts` (`fechasEntre`, `fechasDelBloque`, `rangoDeVista`, `minutosDelDia`) | Fechas `YYYY-MM-DD` sin huso | **R** |
| Lectura | `app/api/calendario/route.ts`, `lib/server/servicios/proyeccion-calendario.ts`, `lib/server/repositorios/calendario.ts` | Clases (`horariosReal.deCursadas()`), evaluaciones, compromisos; rango ≤ 42 días | **R** como insumo de restricciones duras |

### 3.4 Próxima Acción y ADE

| Pieza | Path | Qué hace | Uso |
|---|---|---|---|
| Engine | `lib/domain/ade.ts` (`recomendar`) | **Una** recomendación por cursada, por *costo de no actuar*: evaluación `+1000`, práctica `+300`, recencia `0..60`, peso `0..120`. Bloque por defecto `{min: 30, max: 45}`. **Si hay una acción viva devuelve `NONE`: no apila** | **E**: el plan necesita la lista ordenada que hoy muere adentro (`conCosto`) |
| Validador | `lib/domain/validador-de-recomendacion.ts` (`validarRecomendacion`) | Diez reglas; nada afirma dominio, progreso ni readiness | **R**, obligatorio para cualquier texto del plan |
| Service | `lib/server/servicios/motor.ts`, `lib/server/repositorios/motor.ts`, `materializar_recomendacion()` | Arma contexto, llama al engine, materializa `Action` + `ActionRecommendation` | R (no se toca) |
| Disparador | `app/api/recomendacion/route.ts` | Secreto de servicio | R |
| Pantalla | `components/screens/proxima-accion.tsx` | `UX03` | — |

### 3.5 Compromiso

| Pieza | Path | Qué hace | Uso |
|---|---|---|---|
| Máquina | `lib/domain/state-machines.ts` (`commitmentTransitions`) | `MISSED → CLOSED` única salida; `STARTED` no renegocia | **R** |
| Service | `lib/server/servicios/compromiso.ts` (`confirmarCompromiso`, `renegociar`, `rescatar`, `transicionar`) | Crear, renegociar, rescatar | **R**: confirmar desde el plan pasa por acá |
| Renegociación | `lib/domain/renegociacion.ts` (`elegibilidadDeRenegociacion`, `cambioDeHorarioPosible`), `app/api/renegociacion/route.ts` | Cinco condiciones de ADR-046: mismo día institucional, una vez, ≥ 15 min | **R** |
| Superposición | `lib/domain/superposicion.ts` (`bloqueQueSeSuperpone`, `primerInicioSinClase`) | Conflicto con clase; lista vacía nunca da conflicto (ADR-084) | **R** para ubicar propuestas |
| Reloj | `lib/domain/reloj-compromisos.ts`, `lib/server/servicios/reloj.ts`, `app/api/reloj/route.ts` | `DUE`/`MISSED` por tiempo, **sólo** cuando alguien llama al endpoint | **R** en modo simulación pura (sin llamar al endpoint) |
| Rescate | `app/api/rescate/route.ts` | Otro objeto; el `MISSED` queda | R |
| Propuesta | `propuestaDeCompromiso` en `lib/server/composicion.ts` | Horario sugerido para `UX04` | R |
| Datos | `commitment.start_at`, `planned_minutes`, `timezone_at_commit`, `renegotiated_from_id` (`supabase/migrations/20260830040000_capa_ejecucion.sql` y siguientes) | | R |

### 3.6 Focus, Evidencia, Progreso y Bitácora

| Pieza | Path | Qué hace | Uso |
|---|---|---|---|
| Focus | `lib/domain/sesion-de-focus.ts`, `lib/server/servicios/focus.ts`, `app/api/focus/*`, `focus_session`/`focus_segment` (`20261022000000_modo_focus.sql`) | Tiempo **sellado por el servidor**; *«tiempo registrado en Focus»* | **R** como "realizado" |
| Evidencia | `lib/server/servicios/evidencia.ts`, `app/api/evidencia/route.ts`, `evidenceOwnerTransitions` | `SUBMITTED` no implica suficiencia | R |
| Validación | `lib/server/servicios/validacion.ts`, `app/api/validacion/route.ts` | Registra la validación **y llama a `registrarProgreso` como paso explícito** (ADR-040, ADR-047) | R |
| Progreso | `lib/server/servicios/progreso.ts`, `lib/server/servicios/proyeccion-progreso.ts` | `I10`: `changed_dimensions` o `explicit_no_change` | R |
| Historia | `lib/server/servicios/hechos.ts`, función `hechos_de_cursada()` | **Una sola** fuente histórica | R (el plan no escribe historia) |
| Reflexión | `reflection.actual_minutes`, `reflection.confidence` | Minutos reales declarados | R como "realizado" |

### 3.7 Modo Clase y Modo Examen

| Pieza | Path | Qué hace | Uso |
|---|---|---|---|
| Modo Clase | `lib/domain/sesion-de-clase.ts`, `lib/server/servicios/clase.ts`, `student_class_session` | La clase **del estudiante**, no la dictada | — (no aporta al plan salvo como hecho) |
| Ventana de examen | `lib/domain/ventana-de-examen.ts` (`DIAS_DE_VENTANA = 14`) | Recomendar Modo Examen, **no activarlo** (ADR-048) | **R** |
| Preparación | `lib/server/servicios/preparacion.ts`, `app/api/examen/*`, `exam_preparation_plan_version` (`20260909000000_replanificar_y_volver.sql`) | Protocolo versionado `HUMAN-ROADMAP v1.0`, replanificación (ADR-038) | **R** como capa que se superpone |
| Precedencias | `lib/domain/overview-precedence.ts`, `lib/domain/step-precedence.ts` | Dos matrices **que no comparan materias** | R (no se mezclan con el plan) |

### 3.8 Tiempo y carga (Personal Engine)

| Pieza | Path | Qué hace | Uso |
|---|---|---|---|
| Reparto | `lib/domain/reparto.ts` (`repartir`, `demandaSemanal`, `tramoDeBrecha`), `lib/server/servicios/proyeccion-reparto.ts` | Presupuesto semanal entre materias. **"No agenda"** (ADR-073 §3). Hoy **sin superficie visible** (ADR-093 §2) | **R** como techo semanal |
| Multiplicador | `lib/domain/multiplicador.ts` (`estimacionCentral`, `MINIMO_DE_OBSERVACIONES = 5`) | Nunca `< 1.0`, techo `2.0`, nunca se muestra como número sobre la persona | **R** |
| Disponibilidad | `availability` (`20260830020000_capa_estudiante.sql`), `student.availability_declared_at`, `/alta/disponibilidad` | **Declarada**; nunca derivada de lo cumplido (ADR-074) | **R**: única fuente de "cuándo podés" |

### 3.9 Zona horaria

| Dato | Dónde | Para qué |
|---|---|---|
| `student.timezone` | `DEFAULT 'America/Argentina/Cordoba'` | **Lo que ve el estudiante** en todas las superficies |
| `institution.timezone` | `DEFAULT 'America/Argentina/Cordoba'` (ADR-049) | **Las reglas**: día de renegociación, corte de 14 días |
| `commitment.timezone_at_commit` | congelada al acordar | Reconstruir el horario histórico |
| Aritmética | `lib/domain/zona.ts` (`desplazamiento`, `fechaEnZona`, `diaDeSemana`, `instanteEnZona`) | **Una sola**; nunca un `-03:00` a mano |
| Formato | `lib/server/servicios/tiempo.ts` (`fechaCorta`, `horaCorta`, `haceCuanto`) | Presentación en zona |

Persistencia: `TIMESTAMPTZ` (instantes UTC) y `DATE`/`TIME` de pared para bloques y evaluaciones.

### 3.10 Eventos, navegación y flags

| Pieza | Path | Nota |
|---|---|---|
| Catálogo de eventos | `lib/domain/product-events.ts` | 23 P0 + extensiones; guard en las dos direcciones. Existen `EvidenceSubmitted`, `EvidenceValidated`, `ProgressUpdated`, `ProgressNoChangeConfirmed`, `CommitmentConfirmed`, `CommitmentRenegotiated`, `CommitmentMissed`, `ExamPreparationRecommended`, `FocusSessionStarted`… |
| Nodos y rutas | `lib/navigation/surfaces.ts` | Nodos con `wireframe: null`: `UX02_INDICE`, `FORMACION`, `CLASE`, `CALENDARIO`, `GIMNASIA`, `FOCUS`, `RECORRIDO`, `UX04_RENEGOCIACION`, `UX04_RESCATE`, `EJECUCION` |
| CTAs | `lib/navigation/cta-registry.ts` | Lista cerrada; toda CTA fuera del spec exige ADR `ACCEPTED` que la nombre (`tests/navigation.test.ts`) |
| Conteo de rutas | `tests/shell.test.tsx` | **16** rutas bajo `app/(student)` |
| Flag de demo | `MODO_PRUEBA=1` — `app/(student)/layout.tsx`, `lib/server/composicion.ts`, `lib/server/simulacion/*`, `app/api/prueba/*` | Server-side; `404` sin la variable; lo simulado se rotula |
| Flag por feature | `ESCALAMIENTO_SINTETICO=1` — `app/api/escalamiento/route.ts` | `404`, no `403`, *"un despliegue que no la declara no la tiene"* |
| Guard del flag | `tests/modo-prueba.test.ts` | Verifica que el andamio no cree superficies, CTAs ni eventos |

### 3.11 Frontera con el CRM

| Pieza | Path | Nota |
|---|---|---|
| Autorización de padrón | `lib/server/servicios/autorizacion.ts`, `lib/server/repositorios/crm.ts`, `docs/platform-integration-contract.md` | Único contrato vivo |
| Directorio de operadores | `lib/server/servicios/operadores.ts` | Transitorio (ADR-033) |
| Flujos futuros | `docs/contrato-riesgo-candidato-v0.2.md`, `docs/respuesta-crm-flujos-d-e-v0.2.md` | Diferidos (ADR-035). Sólo cuatro eventos facturables (ADR-041) |

---

## 4. Qué falta para el experimento

| # | Falta | Por qué importa | Quién lo destraba |
|---|---|---|---|
| F1 | **Un objeto "plan"**: propuestas ubicadas en el tiempo que no son `Action` ni `Commitment` | Es el núcleo del experimento. Hoy **está prohibido** por ADR-064/073/085/100 | Owner — [D-01](DECISIONS.md#d-01) |
| F2 | **Más de una propuesta a la vez.** El ADE devuelve una por cursada y `NONE` si hay una acción viva | Sin lista no hay nada que reordenar | Owner — [D-02](DECISIONS.md#d-02) |
| F3 | **Rango `min/probable/max` con confianza.** Existe `action.estimated_minutes_min/max` (nullable, `SOURCE CONTRACT PENDING`); no hay `probable` ni confianza por `Action`. `estimacionCentral()` ya usa el punto medio | Invariante 9 | Owner — [D-03](DECISIONS.md#d-03) |
| F4 | **Una proyección contrafáctica** ("si hago / si dejo pasar"). Lo más cercano: `riesgosDePlanificacion`, `demandaSemanal`, `minutosPendientes`, `ventanaDe` | Invariante 12 | Owner — [D-04](DECISIONS.md#d-04), [D-05](DECISIONS.md#d-05) |
| F5 | **Fechas del período.** No existen en el schema (ADR-100 §2): no hay fin de cuatrimestre | El horizonte del plan no puede pasar la última evaluación conocida | Corte 2 de ADR-060…065 |
| F6 | **Regla de cuándo se declara `MISSED`.** `reloj-compromisos.ts` la marca provisional; ADR-046 respondió elegibilidad, no el vencimiento | "Dejar pasar el tiempo" sobre un compromiso la necesita | Residuo de `C01-010` |
| F7 | **Nodo, ruta, flag** | Ver [D-09](DECISIONS.md#d-09) | Owner |
| F8 | **Capturas en el worktree** | Regla 5 de `CLAUDE.md` para UI | Abrir `../Achieve_Platform/docs/diseño/` |

---

## 5. Desfasajes documentales encontrados (no se corrigen en este commit)

Se registran para que nadie los tome por reglas vigentes. **No son parte del experimento.**

| Dónde | Dice | Lo que rige |
|---|---|---|
| `CLAUDE.md`, bloque B6.9 | *"La renegociación sigue sin cablear"* y *"`C01-010`, `OPEN`"* | ADR-046 y ADR-050 `ACCEPTED`: `app/api/renegociacion/route.ts` y `elegibilidadDeRenegociacion` existen |
| `AGENTS.md` §5 | Evaluaciones de `UX01` *"en dos opciones que conviven"* | ADR-096: las dos se descartaron |
| `docs/architecture.md` §3.9 | *"61 migraciones"*, *"330 comprobaciones"* | `CLAUDE.md`: 434 comprobaciones |
| `lib/domain/reloj-compromisos.ts` | `C01-010` `OPEN` | `ANSWERED — RESIDUO ABIERTO` (ADR-046); el vencimiento sigue provisional, así que la regla **sí** sigue siendo provisional |
