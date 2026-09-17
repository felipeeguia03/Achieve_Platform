# Mapa del sistema para «Mi Plan vivo»

**Qué es:** entradas, engines, salidas, eventos y fronteras, **con lo que ya existe marcado como tal** y
lo que el experimento agregaría marcado `PROPUESTO — ADR-109`. Nada de lo propuesto se construye antes de
que el owner conteste.

---

## 1. El flujo, de punta a punta

```text
 ENTRADAS (persistidas)                ENGINES (lib/domain, puros)            SALIDA (proyección)
 ─────────────────────                 ──────────────────────────             ───────────────────

 ── Duras: no las mueve nadie de acá ──
 class_schedule_block ─┐
   (bloques_de_cursada)│
 assessment ───────────┼──▶ calendario.ts · zona.ts ─────────────┐
 commitment CONFIRMED/ │                                          │
   DUE/STARTED ────────┘                                          │
                                                                  ▼
 ── Del estudiante ──                                     ┌──────────────────────┐
 availability (declared) ──▶ reparto.ts ─────────────────▶│  PROYECTOR DEL PLAN  │
 reflection.actual_minutes ▶ multiplicador.ts ───────────▶│  PROPUESTO · ADR-109 │
 focus_session (congelada) ▶ (realizado)                  │  puro, sin escritura │
                                                          │                      │──▶ PlanVivoProps
 ── Académicas ──                                         │  1. fija lo duro     │    (GET /api/plan,
 topic · class_session ──▶ duracion.ts ──────────────────▶│  2. ubica lo blando  │     PROPUESTO)
 evidence (estado) ──────▶ cobertura.ts · ventana.ts ────▶│  3. explica          │
                                                          │  4. contrafácticos   │
 ── Del ADE ──                                            └──────────▲───────────┘
 contexto de cursada ────▶ ade.ts (costo de no actuar) ──────────────┤
                           └▶ validador-de-recomendacion.ts ─────────┤
 ── Reglas que el plan respeta, no reimplementa ──                    │
 superposicion.ts · renegociacion.ts · reloj-compromisos.ts ·         │
 ventana-de-examen.ts · riesgos-de-planificacion.ts ──────────────────┘
```

**La flecha que no existe, y es a propósito:** del proyector hacia cualquier tabla. El plan **se calcula
al leer** y no se guarda.

---

## 2. Entradas

| Entrada | Tabla / función | Clase | Quién la escribe hoy | Procedencia |
|---|---|---|---|---|
| Horario de cursada | `class_schedule_block` vía `bloques_de_cursada()` | **Dura** | Ingesta (offering) o el estudiante (cursada) — ADR-063, ADR-105 | `source_type`: publicado · declarado · `inference` (simulado, rotulado) |
| Evaluaciones | `assessment` | **Dura** | Ingesta o el estudiante (ADR-067) | `declared_by` |
| Compromisos vivos | `commitment` en `CONFIRMED` · `DUE` · `STARTED` | **Dura del estudiante** | `POST /api/compromiso`, `/api/renegociacion`, `/api/rescate` | Hecho |
| Disponibilidad | `availability` (`source = 'declared'`) | Capacidad | `/alta/disponibilidad` | Declarada; nunca `observed` desde cumplimientos (ADR-074) |
| Temario y duración | `topic.weight`, `class_session.duration_min`, `course_offering.declared_total_min` | Académica | Ingesta | `REGLA_DE_DURACION` + fuente del factor |
| Estado de trabajo | `evidence.lifecycle_state` por tema | Hecho | Flujo de evidencia | — |
| Tiempo real | `reflection.actual_minutes`, `focus_session` (congelada al cerrar) | Hecho | Estudiante / servidor | *«tiempo registrado en Focus»* |
| Zona | `student.timezone` (mostrar), `institution.timezone` (reglas) | Contexto | Default Córdoba | ADR-049 |
| Instante | `ahora` | Parámetro | **El servidor** | Nunca `Date.now()` dentro de `lib/domain/` |

## 3. Engines

| Engine | Módulo | Responde | Estado | Qué hace en el plan |
|---|---|---|---|---|
| **Academic Decision Engine** | `lib/domain/ade.ts` | *¿Qué conviene hacer ahora en esta cursada?* | ✅ existe, v1 provisional (`C01-006`) | Aporta el **orden** y la **razón**. Hoy expone sólo la primera |
| Validador | `lib/domain/validador-de-recomendacion.ts` | *¿Se puede mostrar?* | ✅ | Toda frase del plan pasa por él o por un equivalente con las mismas reglas |
| Duración (Academic) | `lib/domain/duracion.ts` | *¿Cuánto lleva un tema, para cualquiera?* | ✅ | Minutos base con fuente |
| Multiplicador (Personal) | `lib/domain/multiplicador.ts` | *¿Cuánto le lleva a esta persona, comparado con lo estimado?* | ✅ | Estira el rango hacia arriba, nunca abajo |
| Reparto (Personal) | `lib/domain/reparto.ts` | *¿Alcanza la semana declarada?* | ✅, sin superficie | Techo semanal; brecha por tramos de ADR-075 §A3 |
| Ventana y cobertura | `lib/domain/ventana.ts`, `lib/domain/cobertura.ts` | *¿Cuánto tiempo hay y cuánto está trabajado?* | ✅ | Eje y *actividad registrada* |
| Riesgos de planificación | `lib/domain/riesgos-de-planificacion.ts` | *¿Qué choca en el calendario?* | ✅ `PLAN-v0.1` | Qué se enciende si pasa el tiempo |
| Superposición | `lib/domain/superposicion.ts` | *¿Pisa una clase?* | ✅ | Filtro al ubicar |
| Renegociación | `lib/domain/renegociacion.ts` | *¿Se puede mover este compromiso?* | ✅ | Sólo lectura: decir si se puede; mover es de `UX04` |
| Reloj | `lib/domain/reloj-compromisos.ts` | *¿Qué pasa a `DUE`/`MISSED`?* | ✅ provisional | Contrafáctico "dejar pasar", **sin llamar a `/api/reloj`** |
| Ventana de examen | `lib/domain/ventana-de-examen.ts` | *¿Se recomienda Modo Examen?* | ✅ ADR-048 | Marca de recomendación, nunca activación |
| **Proyector del plan** | `lib/domain/plan-vivo/*` | *¿Cómo se ve la semana con lo duro fijo y lo blando ubicado?* | ⛔ **PROPUESTO — ADR-109** | Compone a los de arriba. **No** agrega reglas de negocio propias sin ADR |

⚠️ **Ningún LLM en ninguna fila** ([ADR-004](../../decisions.md#adr-004)).

## 4. Salidas

| Salida | Tipo | Estado |
|---|---|---|
| `PlanVivoProps` | View model tipado en `lib/domain/view-models.ts` | PROPUESTO |
| Por cada propuesta: materia, tema, verbo, rango de minutos con fuente, franja sugerida, **razón**, y sus **dos contrafácticos precalculados** | Parte de `PlanVivoProps` | PROPUESTO |
| Ausencias tipadas (`SIN_DISPONIBILIDAD`, `SIN_EVALUACION`, `SIN_TEMAS`, `CONTEXTO_INCOMPLETO`…) | Parte de `PlanVivoProps` | PROPUESTO — reusa los motivos que ya existen |

**Por qué los contrafácticos llegan precalculados.** Si el cliente los calculara al pasar el mouse, la
pantalla estaría proyectando con su propia aritmética, y P1 dice que la UI **no decide**. Llegan del
Service, acotados a lo visible; el hover sólo **elige cuál mostrar**. Consecuencia: el hover no hace
requests, y "jamás escribe" deja de ser una promesa para ser una imposibilidad.

## 5. Escrituras y eventos

| Momento | ¿Escribe? | ¿Evento? | Por dónde |
|---|---|---|---|
| Abrir `/plan` | No | **No** | `GET /api/plan` |
| Hover / foco en una propuesta | **No. Ni request** | **No** | Estado local de la vista |
| Simular "dejar pasar el tiempo" | No | **No** | Parámetro de la proyección; nunca `/api/reloj` |
| Confirmar una propuesta como compromiso | Sí | `CommitmentConfirmed` (ya existe) | **El flujo que ya existe**: `POST /api/compromiso` con su regla de superposición |
| Aceptar una recomendación | Lo que ya hace hoy | Lo que ya emite hoy | Sin cambios. Aceptar **no** crea `Commitment` |
| Cambiar horario de un compromiso | Sí | `CommitmentRenegotiated` | `UX04` y `POST /api/renegociacion`. El plan **enlaza**, no mueve |
| Evidencia, validación, progreso | Sí | `EvidenceSubmitted` → `EvidenceValidated` → `ProgressUpdated` / `ProgressNoChangeConfirmed` | Flujos existentes; **tres operaciones**, ninguna implica la siguiente (ADR-047) |

**El experimento no declara eventos nuevos en `lib/domain/product-events.ts`.** Si un prompt siente la
necesidad, es una decisión de ADR, no un agregado.

## 6. Fronteras de responsabilidad

| Capa | Hace | No hace |
|---|---|---|
| `lib/domain/plan-vivo/*` | Componer engines existentes; ubicar lo blando; calcular contrafácticos | Leer reloj, tocar base, conocer React, inventar umbrales |
| `lib/server/servicios/proyeccion-plan.ts` | Pedir insumos, pasar `ahora` y zonas, llamar al dominio, redactar con `lib/content/` | Elegir qué propuesta gana (eso lo dice el dominio) |
| `lib/server/repositorios/plan.ts` | Leer, con `institution_id` y `student_id` en el `WHERE` | Escribir |
| `app/api/plan/route.ts` | JWT, flag, `409 ALTA_INCOMPLETA`, traducir a HTTP | Reglas |
| `app/(student)/plan/page.tsx` + componente | Dibujar `PlanVivoProps`; hover elige contrafáctico | Rankear, recalcular, escribir |
| **CRM / WhatsApp** | Acompañar y hacer seguimiento, por contrato versionado | Leer la base de la Plataforma, recibir el plan, decidir agenda |

Todos los paths de esta tabla bajo `plan` **no existen**: son la propuesta.

## 7. Qué es duro y qué es blando

| Elemento | Clase | ¿Lo mueve el proyector? | ¿Quién sí? |
|---|---|---|---|
| Bloque de clase | Duro | Nunca | Su dueño por su flujo (ingesta, o el estudiante corrigiendo su bloque — ADR-064) |
| Evaluación | Duro | Nunca | Ingesta, o el estudiante si la declaró él (ADR-067) |
| Compromiso `CONFIRMED`/`DUE` | Duro del estudiante | Nunca | El estudiante en `UX04`, con las cinco condiciones de ADR-046 |
| Compromiso `STARTED` | Duro | Nunca | Nadie: se continúa o se cierra |
| Compromiso `MISSED` | Hecho | Nunca, **ni se oculta** | Nadie. El rescate es otro objeto |
| Propuesta no aceptada | **Blanda** | Sí, en cada lectura | — (no es persistente) |
| Franja de disponibilidad | Capacidad | No; se usa como contenedor | El estudiante |
| `ProtocolStep` de una preparación activa | Marca de la preparación | No | Su máquina (ADR-028, ADR-038) |
