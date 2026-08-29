# Achieve — Roadmap

**Documento:** `docs/roadmap.md`
**Rol:** owner canónico del plan por fases y del estado de avance.
**Última actualización:** 28 de agosto de 2026

---

## 0. Cómo se lee y se mantiene este documento

### Dos tracks con costos muy distintos

| | **Track A — validable ya** | **Track B — MVP real** |
|---|---|---|
| Qué es | Experiencia clickeable con fixtures, sin backend | Backend, auth, persistencia, motor de decisión real |
| Para qué | Focus groups y test de comprensión | Probar con estudiantes reales, medir retención y uso |
| Horizonte | Semanas | Meses |
| Riesgo | Bajo. Todo es reversible y descartable | Alto. Toca datos de personas reales |
| Decisiones abiertas que lo bloquean | **Ninguna** para la Fase 0 | ADR-005, ADR-006, ADR-004, ADR-003 |
| Datos | Exclusivamente sintéticos | Reales — **gateado por [ADR-006](decisions.md#adr-006)** |

**No se mezclan.** El Track A puede completarse entero sin resolver una sola decisión abierta. El
Track B no puede empezar sin resolver varias.

### Protocolo por etapa

Cada etapa, sin excepción:

1. **Readiness.** ¿Están las dependencias? ¿Hay algún ADR bloqueante en `PENDING`? Si lo hay, la
   etapa no empieza.
2. **Decisiones de diseño explícitas y aprobadas.** Se escriben antes de codear y se hacen aprobar.
3. **Implementación.**
4. **Verificación real.** `lint` y `build` en verde, tests pasando, y verificación funcional de lo
   que la etapa prometió.
5. **Un commit o PR por etapa**, completo.
6. **Documentación sincronizada.** Se marca la etapa acá y se actualizan los docs que el trabajo tocó.

### Estados

`⬜ NO INICIADA` · `🔵 EN CURSO` · `✅ COMPLETA` · `🔒 BLOQUEADA` · `⏸️ DIFERIDA`

---

## 1. Diagrama de dependencias

```
TRACK A ─── no depende de ninguna decisión abierta ───────────────────────────┐
                                                                              │
  Fase 0 · Cerrar Track A                                                     │
  ┌──────────────────────────────────────────────────────────────────────┐   │
  │  0.1 Scaffold + migración de UI          [ADR-008]                   │   │
  │       ↓                                                              │   │
  │  0.2 Capa de dominio + fixtures + parametrización de UX01–UX06       │   │
  │       ↓                                                              │   │
  │  0.3 Grafo del Golden Path + registro de CTAs                        │   │
  │       ↓                                                              │   │
  │  0.4 UX07 ──→ 0.5 UX08 ──→ 0.6 UX09      (secuencial: 08 depende     │   │
  │       ↓                                   de 07, y 09 de 08)         │   │
  │  0.7 Estados críticos completos de UX01–UX06                         │   │
  │       ↓                                                              │   │
  │  0.8 Modo focus group + guion del test de 10 segundos                │   │
  └──────────────────────────────────────────────────────────────────────┘   │
                                                                              │
  Cerrar la Fase 0 cierra el Track A. Operador e Institución se               │
  difirieron al Track B por ADR-012.                                          │
═══════════════════════════════════════════════════════════════════════════════
                                                                              │
TRACK B ─── cada fase tiene su gate ──────────────────────────────────────────┘

  Fase B0 · Cerrar decisiones          → resuelve ADR-005, ADR-006, ADR-004, ADR-003
       ↓
  Fase B1 · Fundación                  🔒 ADR-005 · ADR-006 (si hay usuario real)
       ↓
  Fase B2 · Dominio de ejecución       🔒 B1
       ↓
  Fase B3 · Progreso + eventos         🔒 B2
       ↓
  ┌────┴─────────────────────────┐
  ↓                              ↓
  Fase B4 · ADE v1               Fase B5 · Modo Examen real
  🔒 ADR-004                     🔒 ADR-007 (contenido) · ADR-011 (readiness)
  └────┬─────────────────────────┘
       ↓
  Fase B6 · Risk + Intervención + Operador   🔒 ADR-003
  (absorbe las 5 vistas que iban en la Fase A1)
       ↓
  Fase B7 · Privacidad y golden dataset      🔒 ADR-006  ← BLOQUEO ABSOLUTO
       ↓
  Fase B8 · Piloto institucional             🔒 B7 · C01-042 · C01-044 · C01-046
```

---

# TRACK A — Validable ya

## Fase 0 — Cerrar el Track A

**Objetivo.** Las nueve superficies `UX01`–`UX09` existen como componentes reales con el sistema
visual final, recorribles por el Golden Path, con todos los estados críticos de sus specs
representados como escenarios sintéticos. Apto para focus groups.

**Por qué va primero.** **No depende de ninguna decisión abierta.** Es el único trabajo sustancial
que se puede hacer hoy sin esperar una respuesta de nadie.

**Dependencias.** ✅ **Ninguna abierta.** [ADR-008](decisions.md#adr-008) (stack),
[ADR-010](decisions.md#adr-010) (traducción al dominio) y [ADR-012](decisions.md#adr-012) (alcance)
quedaron `ACCEPTED` el 28 de agosto de 2026. **La fase está lista para arrancar.**

### Pre-flight checklist

- [x] [ADR-008](decisions.md#adr-008) **aprobado** — Next.js 16 estándar
- [x] [ADR-010](decisions.md#adr-010) **aprobado** — las respuestas `DD1`–`DD10` están escritas
- [x] [ADR-012](decisions.md#adr-012) **aprobado** — Operador e Institución se difieren al Track B
- [ ] Documentación SDD aprobada
- [ ] Confirmado que la carpeta del prototipo sigue accesible como origen de la migración
- [ ] Node ≥ 22.13 disponible (local: v24.10.0 ✓)
- [ ] Confirmado que las 3 pantallas nuevas se construyen **desde las specs `VI.7`–`VI.9`**, no desde
      el arnés QA

### Etapas

| # | Etapa | Entregable | Estado |
|---|---|---|---|
| 0.1 | **Scaffold + migración de UI** | Repo que compila con `globals.css`, `components/ui/` (80), `components/screens/` (8), `lib/utils.ts`, `hooks/`. `lint` y `build` en verde | ⬜ |
| 0.2 | **Capa de dominio + fixtures + parametrización** | `lib/domain/` con tipos y máquinas de estado puras; `lib/fixtures/` con el catálogo de escenarios; `UX01`–`UX06` recibiendo props tipadas | ⬜ |
| 0.3 | **Golden Path + registro de CTAs** | `lib/navigation/` con el grafo de transiciones y `CTA-001`…`CTA-018` con su condición de aparición y destino | ⬜ |
| 0.4 | **`UX07` — Activación de Modo Examen** | Componente real con sus estados críticos | ⬜ |
| 0.5 | **`UX08` — Modo Examen / Overview** | Componente real con la matriz de precedencia de 10 niveles | ⬜ |
| 0.6 | **`UX09` — Paso de Protocolo** | Componente real con contenido configurable | ⬜ |
| 0.7 | **Estados críticos de `UX01`–`UX06`** | Los 9 niveles de precedencia, los 7 estados de Evidence, renegociación, rescate, idempotencia y provenance, todos alcanzables | ⬜ |
| 0.8 | **Modo focus group** | Recorrido limpio sin panel de debug + guion del test de 10 segundos | ⬜ |

---

### Etapa 0.1 — Scaffold + migración de UI

**Decisiones de diseño a aprobar antes de codear:**
1. ¿Se conservan los 80 componentes de `components/ui/` o solo los que se usan? *Recomendación:
   conservarlos todos — es un registro vendorizado y podar ahora crea trabajo cuando aparezca una
   pantalla nueva.*
2. Estructura de rutas del App Router.
3. Configuración de ESLint: mantener la excepción para `components/ui/**` (código vendorizado).

**Trabajo:** copiar los archivos listados en [`architecture.md`](architecture.md) §2.5, adaptar
`package.json` al stack de ADR-008, `layout.tsx` mínimo, `tsconfig.json` con `@/*`.

**Corrección puntual incluida en esta etapa:** reconciliar `--chart-2` en `globals.css`, que sigue
siendo el naranja `#ff9500` de la versión anterior de `DD6`, cuando el propio CSS declara que los
charts heredan solo de los tres semánticos. Ver
[`design-system.md`](design-system.md) §1.5.

**Done cuando:**
- `npm run lint` en verde, `npm run build` en verde.
- La app arranca y renderiza una pantalla de las existentes con sus tokens correctos.
- `--chart-2` reconciliado con la paleta de tres semánticos.
- `git log` muestra un commit único y descriptivo.

---

### Etapa 0.2 — Capa de dominio, fixtures y parametrización

**La etapa más importante de la Fase 0.** Define la frontera que hace barato el Track B.

**Decisiones de diseño a aprobar:**
1. Forma del catálogo de fixtures: ¿escenarios completos (un objeto por escenario) o composición de
   fragmentos? *Recomendación: escenarios completos y explícitos — el arnés original demostró que la
   composición implícita produce reglas de negocio escondidas en comparaciones de string.*
2. Nomenclatura de los escenarios. *Recomendación: conservar los IDs del spec (`FX-DAY-BASE`,
   `SC-EV-01`…) para preservar trazabilidad con `product-spec-source.md`.*
3. Dónde vive el copy: ¿en el componente o en un archivo de contenido con ID? *Recomendación:
   archivo de contenido, cumpliendo `C-07`.*
4. El orden por defecto de las listas ya está definido por `DD2`: **Commitment más próximo a vencer
   primero, proximidad del examen en segundo lugar**, nunca fusionados en un solo número
   ([`domain-translation-dd1-dd10.md`](domain-translation-dd1-dd10.md)).

**Trabajo:**
- `lib/domain/types.ts` — los tipos de [`data-model.md`](data-model.md) §13.
- `lib/domain/state-machines.ts` — las cuatro máquinas como tablas de transición puras.
- `lib/domain/precedence.ts` — `selectHeroLevel` extraída de `hoy-autogestion.tsx` y **ampliada de
  4 a los 9 niveles** de `product.md` §10.2.
- `lib/fixtures/` — el catálogo.
- `lib/content/` — las frases de regla de negocio con ID.
- Parametrizar `UX01`–`UX06`: **preservando el JSX y el copy**, reemplazando los datos hardcodeados
  por props tipadas y quitando el conmutador de demo interno de `HoyAutogestion`.

**Done cuando:**
- Ninguna pantalla importa un fixture directamente.
- Las máquinas de estado tienen tests unitarios, incluyendo **las transiciones prohibidas**
  (`MISSED → COMPLETED` falla).
- `selectHeroLevel` cubre los 9 niveles con test por nivel.
- Las 6 pantallas renderizan igual que antes. **Verificación visual explícita.**
- Lint y build en verde.

---

### Etapa 0.3 — Golden Path y registro de CTAs

**Decisiones de diseño a aprobar:**
1. ¿Cada superficie tiene URL propia (`I-01`)? *Recomendación: sí — es requisito del manual y hace el
   focus group mucho más manejable.*
2. Cómo se representa una transición no canónica (los fallbacks de retorno seguro).

**Trabajo:** `lib/navigation/golden-path.ts` con el grafo, y `lib/navigation/cta-registry.ts` con las
18 CTAs, cada una con condición de aparición, acción solicitada, destino, resultado autoritativo,
fallback y estado de error, según `product-spec-source.md` Parte III §5.

**Done cuando:**
- Las 18 CTAs están declaradas y son alcanzables desde algún escenario.
- Una CTA cuya condición no se cumple **no se renderiza**, en vez de renderizarse deshabilitada.
- Test estático: toda CTA del registro tiene al menos un escenario que la alcanza.

---

### Etapas 0.4–0.6 — Las tres pantallas de Modo Examen

Son **secuenciales**: `UX08` recibe el handoff de `UX07`, y `UX09` el de `UX08`.

**Fuente:** `product-spec-source.md` §VI.7 (líneas 10131–11556), §VI.8 (11557–12714), §VI.9
(12715–14607). **No** el arnés QA.

**Decisiones de diseño transversales a las tres, a aprobar:**
1. `UX07`: el baseline es `RECOMMENDED → CTA del estudiante → ACTIVE`. **No existe variante
   auto-activa.** Confirmar que se respeta.
2. `UX07`: el alta de un `Assessment` no registrado **no se implementa** (`SCP-09`/`SCP-10` abiertos).
   Se muestra el estado no implementable con retorno seguro.
3. `UX08`: la matriz de precedencia tiene 10 niveles. Confirmar el orden.
4. `UX08`: **sin card de readiness** ([ADR-011](decisions.md#adr-011)).
5. `UX09`: **no se muestra "Paso 5 de 12"** ni porcentaje. Los 12 pasos son provisionales.

**Estados críticos mínimos por pantalla:**

- **`UX07`** (22 escenarios en la spec): recomendación con datos oficiales · evaluación reportada por
  el alumno · fecha estimada · manual con Assessment existente · Assessment no registrada · datos
  incompletos · fecha desconocida · modalidad desconocida · práctico · teórico escrito · oral fuera de
  P0 · ya activa · intento duplicado · varias evaluaciones · fecha modificada · datos contradictorios ·
  evaluación pasada · datos no disponibles · activación completada · handoff no disponible.
- **`UX08`** (28 escenarios): `ACTIVE` recién activada · con recomendación · `IN_PROGRESS` ·
  Commitment vigente · `MISSED` · Evidence requerida · `UNDER_REVIEW` con y sin gate · `ProgressUpdated` ·
  sin recomendación · sin recorrido · las seis variantes de fecha · las tres de modalidad · confianza
  alta + dominio bajo · datos contradictorios · no disponibles · varias preparaciones · handoff.
- **`UX09`** (31 escenarios): paso disponible · contenido completo · sin Resource · sin entregable ·
  sin criterio · paso no disponible · versión inconsistente · ruta no disponible · los estados de
  Evidence · paso completado con y sin siguiente · práctico · teórico escrito · oral · contradictorios ·
  no disponibles · retorno seguro.

**Done cuando (cada una):**
- Todos los estados críticos de su spec son alcanzables desde el catálogo de fixtures.
- El primer viewport a 360 px cumple el contrato de su spec.
- Una sola CTA primaria por estado.
- Los fallbacks **omiten**, no inventan.
- Lint, build y tests en verde.

---

### Etapa 0.7 — Estados críticos completos de UX01–UX06

**Contexto.** Las 6 pantallas existentes son maquetas de **una sola vista cada una**. El arnés QA
modelaba mucho más estado del que las pantallas bonitas muestran hoy.

**Trabajo:** llevar cada pantalla a la cobertura de estados de su spec:

| Pantalla | Qué falta hoy |
|---|---|
| `UX01` | 5 de los 9 niveles de precedencia; señal secundaria; hecho humano condicional; empty y error |
| `UX02` | Cátedra vs. alumno con provenance; captura "Pasó algo en clase"; contexto incompleto; confianza alta + dominio bajo |
| `UX03` | Acción de incertidumbre; razón no confirmada; recurso faltante; sheet de corrección; bloqueada; reemplazada |
| `UX04` | Capacidad insuficiente; fecha inválida; los 8 estados del lifecycle; renegociación; `MISSED`; rescate |
| `UX05` | Los 7 estados de Evidence; upload en progreso y fallido; artefacto formal; Evidence tardía; Reflection contextual |
| `UX06` | Las 4 variantes de resultado de progreso; agrupación de Bitácora; provenance diversa; los tres estados de no-cambio |

**Done cuando:** cada estado crítico listado en las specs `VI.1`–`VI.6` es alcanzable, y la prueba de
imprimir en blanco y negro no pierde información.

---

### Etapa 0.8 — Modo focus group

**Trabajo:** un recorrido limpio sin panel de debug, con reset determinista, y el guion del test de
10 segundos por pantalla con las respuestas esperadas (ya están escritas en cada spec).

**Done cuando:** una persona ajena al proyecto puede recorrer el Golden Path completo en un teléfono
sin instrucciones, y el facilitador tiene el guion con los criterios de PASS.

### Fase 0 — Done cuando…

- [ ] Las 9 superficies existen como componentes reales con el sistema visual final
- [ ] Todos los estados críticos de las 9 specs son alcanzables
- [ ] El Golden Path es recorrible extremo a extremo
- [ ] Cero red, cero persistencia, cero datos reales — **verificado por test estático**
- [ ] La auditoría de conformidad de [`design-system.md`](design-system.md) §9 corrida, con los
      fallos reportados y no escondidos
- [ ] Lint, build y tests en verde
- [ ] El test de comprensión de 10 segundos ejecutado **con personas reales**

---

## Fase A1 — Operador e Institución · ⏸️ DIFERIDA al Track B

**Estado:** ⏸️ **DIFERIDA** por [ADR-012](decisions.md#adr-012), aprobado el 28 de agosto de 2026.

Las cinco superficies —`WF-O01` cola priorizada, `WF-O02` contexto de estudiante, `WF-O03` registrar
intervención, `WF-O04` revisión de evidencia, `WF-I01` dashboard institucional— **salen del Track A**
y su contenido se absorbe en la **Fase B6**, que ya está gateada por
[ADR-003](decisions.md#adr-003).

**Razones:** los focus groups son con estudiantes, y construirlas ahora significaría bautizar el
vocabulario del rol Operador antes de reconciliarlo con Dashboard_Achieve.

**Pendiente de evaluar en B6:** si `WF-O04` (revisión de evidencia) merece una versión mínima
anticipada. Es la contraparte del estado `UNDER_REVIEW` que el estudiante **sí** ve en el Track A.

> **Con esto, cerrar la Fase 0 cierra el Track A completo.**

---

# TRACK B — MVP real

> ⚠️ Ninguna fase del Track B empieza sin que su gate esté resuelto. La regla de
> [ADR-006](decisions.md#adr-006) es absoluta: **ninguna fase que procese datos de una persona real
> puede comenzar** hasta que la política de privacidad y consentimiento esté cerrada.

## Fase B0 — Cerrar decisiones (sin código)

**Objetivo.** Convertir en `ACCEPTED` los ADRs que bloquean el resto del Track B.

**Insumo nuevo disponible.** Ya existe un diseño objetivo de backend en
[`architecture.md`](architecture.md) §3 y un contrato vigente de autorización CRM en
[`platform-integration-contract.md`](platform-integration-contract.md). Reducen incertidumbre, pero
no cambian por sí solos el estado de los ADRs ni habilitan datos reales.

| Decisión | ADR | Quién decide |
|---|---|---|
| Backend, auth, persistencia | [ADR-005](decisions.md#adr-005) | Producto + CTO |
| Pipeline del ADE | [ADR-004](decisions.md#adr-004) | Producto |
| Convergencia con Dashboard_Achieve | [ADR-003](decisions.md#adr-003) | Producto + CTO |
| Privacidad y consentimiento | [ADR-006](decisions.md#adr-006) | Producto + asesoría legal |
| Respuestas `DD1`–`DD10` | [ADR-010](decisions.md#adr-010) | Producto |

**Done cuando:** cada ADR está `ACCEPTED` o explícitamente `DEFERRED` con su fase bloqueada marcada.

---

## Fase B1 — Fundación

**Estado:** 🔒 [ADR-005](decisions.md#adr-005). Además [ADR-006](decisions.md#adr-006) desde el
momento en que exista **un solo usuario real**.

**Objetivo.** Backend en capas, base de datos, auth, tenancy y esquema base de la Academic Data Layer,
sin acceso del frontend a tablas de negocio.

| # | Etapa |
|---|---|
| B1.1 | Proyecto Supabase + migraciones iniciales + entorno local reproducible *(sujeto a aceptación de ADR-005)* |
| B1.2 | Schema de la capa académica ([`data-model.md`](data-model.md) §7) |
| B1.3 | Auth + `student` + `institution`; JWT en `/api/*`; RLS deny-by-default |
| B1.4 | Frontera Controller → Service → Repository; máquinas de estado, scoping e idempotencia en Service |
| B1.5 | `product_event` y `audit_log` append-only |
| B1.6 | Cliente de autorización CRM v1 con contract tests y datos sintéticos; uso real gateado por ADR-006 |

**Done cuando:** un test de aislamiento demuestra que un tenant **no puede** leer datos de otro; las
transiciones prohibidas fallan en Service incluso bajo concurrencia; ningún código cliente accede a
tablas de negocio; `product_event` registra actor, timestamp, institución, objeto y causa; y el
contrato CRM cubre `authorized:true`, los tres rechazos, `400`, `401` y reintento de red/5xx.

**Contratos que hay que cerrar antes:** `C01-001`, `C01-002`, `C01-003`, `C01-030`; y para persistir
la autorización CRM, el mapping institucional de `C01-039`.

---

## Fase B2 — Dominio de ejecución

**Estado:** 🔒 B1.

**Objetivo.** El loop diario completo con persistencia real: `Action`, `Commitment`, `Evidence`,
`Reflection`.

| # | Etapa |
|---|---|
| B2.1 | `Action` + `ActionRecommendation` + máquina de estados |
| B2.2 | `Commitment` + renegociación + rescate + idempotencia |
| B2.3 | `Evidence` + resubmission + storage + revisión real |
| B2.4 | `Reflection` configurable `OPTIONAL`/`REQUIRED` |
| B2.5 | Reemplazo de `lib/fixtures/` por llamadas reales — **sin tocar las pantallas** |

**Done cuando:** los 12 invariantes de [`data-model.md`](data-model.md) §11 tienen test; el mismo
request enviado dos veces produce una sola entidad; `UNDER_REVIEW` es imposible sin instancia real.

**Contratos a cerrar:** `C01-007`…`C01-016`, `C01-051`.

---

## Fase B3 — Progreso, Bitácora y eventos

**Estado:** 🔒 B2.

**Objetivo.** `TopicProgress` con las cinco dimensiones separadas, `ProgressEntry`, Bitácora y el
Product Event Model completo.

**Done cuando:** una dimensión solo se muestra como cambiada con un `ProgressUpdated` real; los tres
estados de no-cambio son distinguibles; la Bitácora agrupa los eventos del mismo ciclo sin
duplicarlos como cuatro avances independientes.

**Contratos a cerrar:** `C01-018`, `C01-019`, `C01-020`, `C01-023`.

---

## Fase B4 — Academic Decision Engine v1

**Estado:** 🔒 [ADR-004](decisions.md#adr-004).

**Objetivo.** Un ADE real que emita `ActionRecommendation` con las cuatro ramas
`NEW` / `NONE` / `ERROR` / `PENDING`.

**Done cuando:** el ADE emite exactamente una recomendación principal por contexto; el validador
determinista impide publicar una recomendación que afirme dominio, progreso o readiness inexistente;
las cuatro ramas son observables.

---

## Fase B5 — Modo Examen real

**Estado:** 🔒 [ADR-007](decisions.md#adr-007) para el **contenido**, [ADR-011](decisions.md#adr-011)
para readiness. La **estructura** no está bloqueada.

**Objetivo.** `ExamPreparation` real con `ExamProtocol` como configuración versionada.

**Regla:** los pasos son configuración, nunca código. Los defaults `HUMAN-P0` se usan tal como están
documentados y se rotulan como asunción provisional.

**Contratos a cerrar:** `C01-005`, `C01-024`…`C01-029`.

---

## Fase B6 — Risk Engine, Intervención y Operador

**Estado:** 🔒 [ADR-003](decisions.md#adr-003).

**Objetivo.** `RiskSignal` rule-based explicable, `Intervention` con playbook/SLA/outcome, y la
consola operativa P0.

**Absorbe la ex-Fase A1:** las cinco superficies `WF-O01`…`WF-O04` y `WF-I01`, diferidas por
[ADR-012](decisions.md#adr-012).

**Done cuando:** toda señal relevante cierra su circuito causa → owner → playbook → SLA →
intervención → outcome; ninguna señal queda sin outcome registrado.

**Contratos a cerrar:** `C01-021`, `C01-022`, `C01-039`, `C01-040`, `C01-044`.

---

## Fase B7 — Privacidad, consentimiento y golden dataset

**Estado:** 🔒 [ADR-006](decisions.md#adr-006). **BLOQUEO ABSOLUTO para datos reales.**

**Objetivo.** Política de privacidad implementada, consentimiento, retención y borrado, matriz de
visibilidad institucional, y el golden dataset de la carrera piloto.

**Done cuando:** un estudiante puede dar y revocar consentimiento con efecto real; la institución ve
agregado por defecto y el detalle individual exige autorización explícita; existe política de
retención y borrado ejecutable.

**Contratos a cerrar:** `C01-017`, `C01-030`, `C01-042`, `C01-046`.

---

## Fase B8 — Piloto institucional

**Estado:** 🔒 B7.

**Objetivo.** El piloto del spec: ~50 ingresantes + 1–2 materias críticas + primer parcial + 6–8
semanas.

**Done cuando:** se mide TFVP (*Time to First Validated Progress*), cumplimiento de compromisos,
desvío, riesgo y recuperación.

---

## 2. Mapa de bloqueos

| Decisión abierta | Bloquea |
|---|---|
| [ADR-005](decisions.md#adr-005) Backend | **Todo el Track B desde B1** |
| [ADR-006](decisions.md#adr-006) Privacidad | **Cualquier fase con datos reales.** Absoluto |
| [ADR-004](decisions.md#adr-004) ADE | Fase B4 |
| [ADR-003](decisions.md#adr-003) Convergencia | Fase B6 |
| [ADR-007](decisions.md#adr-007) HUMAN-P0 | Contenido de Fase B5 |
| [ADR-011](decisions.md#adr-011) Readiness | Readiness visible en B5 |

✅ **Resueltos el 28 de agosto de 2026,** y por eso ya no aparecen arriba:
[ADR-008](decisions.md#adr-008) (stack), [ADR-009](decisions.md#adr-009) (nomenclatura `DD`),
[ADR-010](decisions.md#adr-010) (`DD1`–`DD10`, salvo `DD4` `DEFERRED`),
[ADR-012](decisions.md#adr-012) (alcance del Track A) y
[ADR-013](decisions.md#adr-013) (anexo deduplicado).

> **Nada bloquea la Fase 0. Está lista para arrancar.**

**Único pendiente que no bloquea nada de la Fase 0:** `DD4` (vocabulario del oficio), en `DEFERRED`.
Se revisa junto con el glosario de [`product.md`](product.md) §3.

---

## 3. Estado de avance

| Fase | Estado | Etapas completas |
|---|---|---|
| Fase 0 — Cerrar Track A | ⬜ **NO INICIADA · lista para arrancar** | 0 / 8 |
| Fase A1 — Operador e Institución | ⏸️ DIFERIDA al Track B | — |
| Fase B0 — Cerrar decisiones | ⬜ NO INICIADA | 0 / 5 |
| Fase B1 — Fundación | 🔒 BLOQUEADA | — |
| Fase B2 — Dominio de ejecución | 🔒 BLOQUEADA | — |
| Fase B3 — Progreso y eventos | 🔒 BLOQUEADA | — |
| Fase B4 — ADE v1 | 🔒 BLOQUEADA | — |
| Fase B5 — Modo Examen real | 🔒 BLOQUEADA | — |
| Fase B6 — Risk e Intervención | 🔒 BLOQUEADA | — |
| Fase B7 — Privacidad | 🔒 BLOQUEADA | — |
| Fase B8 — Piloto | 🔒 BLOQUEADA | — |

**Estado de los 51 contratos `C01`: 51 `OPEN`, 0 `CLOSED`.** Ver
[`pending-decisions-annex.md`](pending-decisions-annex.md).
