# Achieve — Roadmap

**Documento:** `docs/roadmap.md`
**Rol:** owner canónico del plan por fases y del estado de avance.
**Última actualización:** 29 de agosto de 2026

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
quedaron `ACCEPTED` el 28 de agosto de 2026; [ADR-014](decisions.md#adr-014) (desktop-first y contrato
del primer viewport) el 29 de agosto de 2026. **La fase está en curso.**

> **Único `PENDING` dentro de la Fase 0:** dónde vive la CTA principal en desktop
> ([`design-system-capturas.md`](design-system-capturas.md) §12.7). ADR-014 lo desbloqueó. **No afecta
> a las etapas 0.1–0.3**; se cierra antes de la 0.4.

### Pre-flight checklist

- [x] [ADR-008](decisions.md#adr-008) **aprobado** — Next.js 16 estándar
- [x] [ADR-010](decisions.md#adr-010) **aprobado** — las respuestas `DD1`–`DD10` están escritas
- [x] [ADR-012](decisions.md#adr-012) **aprobado** — Operador e Institución se difieren al Track B
- [x] [ADR-014](decisions.md#adr-014) **aprobado** — desktop-first; 360 px es el piso móvil
- [x] Documentación SDD aprobada — 29 ago 2026
- [x] Confirmado que la carpeta del prototipo sigue accesible como origen de la migración —
      `~/Desktop/ACHIEVE_LOW_FI_REVERSIBLE_PROTOTYPE_BUILD_v0.2 3/`, verificado el 29 ago 2026
- [x] Node ≥ 22.13 disponible (local: v24.10.0 ✓, npm 11.6.0)
- [x] Confirmado que las 3 pantallas nuevas se construyen **desde las specs `VI.7`–`VI.9`**, no desde
      el arnés QA

### Etapas

| # | Etapa | Entregable | Estado |
|---|---|---|---|
| 0.1 | **Scaffold + migración de UI** | Repo que compila con `globals.css`, `components/ui/` (61), `components/screens/` (7), `lib/utils.ts`, `hooks/`. `lint` y `build` en verde | ✅ |
| 0.2 | **Capa de dominio + fixtures + parametrización** | `lib/domain/` con tipos y máquinas de estado puras; `lib/fixtures/` con el catálogo de escenarios; `UX01`–`UX06` recibiendo props tipadas | ✅ |
| 0.3 | **Golden Path + registro de CTAs** | `lib/navigation/` con el grafo de transiciones y `CTA-001`…`CTA-018` con su condición de aparición y destino | ✅ |
| 0.4 | **`UX07` — Activación de Modo Examen** | Componente real con sus estados críticos | ✅ |
| 0.5 | **`UX08` — Modo Examen / Overview** | Componente real con la matriz de precedencia de 10 niveles | ✅ |
| 0.6 | **`UX09` — Paso de Protocolo** | Componente real con contenido configurable | ⬜ |
| 0.7 | **Estados críticos de `UX01`–`UX06`** | Los 9 niveles de precedencia, los 7 estados de Evidence, renegociación, rescate, idempotencia y provenance, todos alcanzables | ⬜ |
| 0.8 | **Modo focus group** | Recorrido limpio sin panel de debug + guion del test de 10 segundos | ⬜ |

---

### Etapa 0.1 — Scaffold + migración de UI

**Decisiones de diseño — ✅ aprobadas el 29 de agosto de 2026:**

1. **Se conservan los 61 componentes de `components/ui/`**, verbatim. Es un registro vendorizado;
   podar ahora crea trabajo cuando aparezca una pantalla nueva en 0.4–0.6, y el bundler descarta lo
   no usado.
   *Corrección de dato: el prototipo tiene **61** archivos en `components/ui/`, no 80. El número
   anterior estaba mal en `architecture.md` §2.2 y §2.5; se corrigió por medición.*
2. **Rutas del App Router: route group `(student)` con rutas en el vocabulario de la UI**, tal como
   [`architecture.md`](architecture.md) §2.3 ya declaraba. El identificador `UXnn` vive en el registro
   de navegación (Etapa 0.3), **no en la URL** — el estudiante del focus group no ve identificadores
   internos. Cumple `I-01`: una URL propia por superficie.

   ```
   app/
   ├── layout.tsx
   ├── globals.css
   └── (student)/
       ├── hoy/                 UX01
       ├── materia/[id]/        UX02
       ├── accion/[id]/         UX03
       ├── compromiso/[id]/     UX04
       ├── evidencia/[id]/      UX05
       ├── progreso/            UX06
       └── examen/
           ├── activar/         UX07
           ├── [id]/            UX08
           └── [id]/paso/[n]/   UX09
   ```

   El route group deja lugar a `(operador)` en la Fase B6 sin refactorizar layouts.
3. **ESLint mantiene la excepción para `components/ui/**`** (código vendorizado, no se edita).
4. **`--chart-2` se reconcilia a `#f472b6`** (`--urgencia-fill`), no se elimina la familia. Es lo que
   la regla ya escrita implica: `chart-1` es `exito-fill`, `chart-3` es `humano`, `chart-4`/`chart-5`
   son grises ink; la ranura 2 es la de urgencia. No se inventa un color: se usa el que `DD6` ya
   eligió. Ver [`design-system.md`](design-system.md) §1.5.

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

#### ✅ Etapa 0.1 — COMPLETA · 29 de agosto de 2026

**Verificación real:**

| Criterio | Resultado |
|---|---|
| `npm run lint` | ✅ verde, sin warnings |
| `npm run build` | ✅ verde · Next.js 16.2.6 · 7 rutas estáticas prerenderizadas |
| `npm test` | ✅ 9 tests en 2 archivos |
| La app renderiza con tokens correctos | ✅ verificado en desktop 1440×900 y a 360 px, sin errores de consola ni pérdida de información |
| `--chart-2` reconciliado | ✅ `#ff9500` → `#f472b6` (`--urgencia-fill`), verificado en el CSS servido y en los tokens computados del navegador |
| Commit único | ✅ |

**Migrado desde el prototipo:** `app/globals.css`, `vendor/` (2), `components/ui/` (61),
`components/screens/` (7), `lib/utils.ts`, `hooks/use-mobile.ts`, `public/favicon.svg`.

**Rutas creadas:** `/hoy` `/materia` `/accion` `/compromiso` `/evidencia` `/progreso` bajo el route
group `(student)`, más `/` que redirige a `/hoy`.

**Tests agregados:** `tests/design-tokens.test.ts` (los 3 semánticos, la herencia de los charts, la
corrección de contraste de `--muted-foreground`) y `tests/track-a-rules.test.ts` (guard estático de
cero red, cero persistencia y cero datos reales). El segundo es un criterio de Done de la **Fase 0**,
no de esta etapa: se agregó desde el primer commit para que no haya que retrofitearlo en la 0.8.

**Correcciones de dato aplicadas a los docs** (medidas, no decididas):

- `components/ui/` tiene **61** archivos, no 80. `architecture.md` §2.2 y §2.5 decían 80.
- El entregable de esta etapa decía `components/screens/` **(8)**, contando
  `recorrido-diseno-visual.tsx`. [`architecture.md`](architecture.md) §2.5 —que este mismo párrafo
  cita como la lista a copiar— lo marca **Reemplazado**: es un pager lineal de 6 pasos, no el grafo
  del Golden Path, y su reemplazo es la Etapa 0.3. **No se migró.** Migran **7**.

**Desviaciones y deuda declarada:**

1. **Los segmentos dinámicos `[id]` no se crearon todavía.** La forma de rutas aprobada los incluye
   (`materia/[id]`, `accion/[id]`, `compromiso/[id]`, `evidencia/[id]`), pero en esta etapa no existe
   identidad sobre la cual rutear: el catálogo de fixtures es el entregable de la **Etapa 0.2**.
   Crear el segmento ahora obligaba a inventar un identificador sintético sin catálogo que lo
   respalde. **Los `[id]` se agregan en la 0.2, junto con los fixtures que les dan significado.**
2. **El conmutador de demo interno de `HoyAutogestion`** (los chips `A · Al día`, `B · En curso`,
   `C · Evidencia`, `D1 · Rescate`) **sigue visible.** La migración es verbatim por diseño; quitarlo
   es trabajo explícito de la **Etapa 0.2**.
3. **Las CTAs no navegan.** Las pantallas reciben `onAvanzar`/`onVerMateria` opcionales y nadie se
   los pasa. El grafo de transiciones es la **Etapa 0.3**.
4. **`(student)/layout.tsx` solo centra el contenido.** No implementa la proporción 2/3 + 1/3 de
   `design-system.md` §6.2 ni ubica la CTA principal en desktop: eso depende de
   [`design-system-capturas.md`](design-system-capturas.md) §12.7, que sigue `PENDING`.
5. **`npm audit` reporta 3 vulnerabilidades `high`** en el árbol de dependencias heredado del
   prototipo. No se tocaron: cambiar versiones del stack es una decisión de ADR-008, no de esta
   etapa. **Queda registrado como deuda a evaluar antes de la Fase 0 Done.**

---

### Etapa 0.2 — Capa de dominio, fixtures y parametrización

**La etapa más importante de la Fase 0.** Define la frontera que hace barato el Track B.

**Decisiones de diseño — ✅ aprobadas el 29 de agosto de 2026:**

1. **Escenarios completos y explícitos.** Un objeto por escenario, con su estado escrito literal.
   Nada hereda de nada y no hay merges. Es verboso a propósito: el arnés original demostró que la
   composición implícita produce reglas de negocio escondidas en comparaciones de string.
2. **Se conservan los IDs del spec.** `FX-DAY-BASE`, `FX-MISSED`, `FX-EVD-BASE`, `FX-ADE-NONE` salen
   del registro canónico de `product-spec-source.md` §7, y cada escenario declara qué `C01` y qué
   `SC-*` cubre. **Un test verifica que un ID marcado como del spec realmente esté en el spec.**

   *Consecuencia no prevista por el roadmap:* el registro del spec **no nombra todos** los
   escenarios que el Track A necesita — no hay `FX` para "Action ya iniciada" ni para progreso.
   Inventar un `FX-` con forma canónica haría que alguien lo buscara en el spec y no lo encontrara.
   Los que el spec no nombra llevan prefijo **`FX-LOCAL-`**, y un test verifica que esos **no**
   estén en el spec. Hoy son dos: `FX-LOCAL-DAY-IN-PROGRESS` y `FX-LOCAL-PROG-VALIDATED`.
3. **El copy vive en `lib/content/es-AR.ts` con ID tipado**, cumpliendo `C-07`. Los datos del
   dominio viven en el fixture. Un test estático verifica que los prefijos de dominio
   (`Porque:`, `Entregá:`, `Después:`, `Cerrás cuando:`) no vuelvan al JSX.
4. **Alcance:** frontera + escenarios base. Esta etapa entrega la capa de dominio completa y los
   escenarios que hacen que las 6 pantallas rendericen lo que ya rendían. **La cobertura completa de
   estados críticos sigue siendo la Etapa 0.7**, y no se adelanta acá: escribir escenarios para
   estados que las pantallas todavía no saben dibujar produce fixtures sin verificación visual.
5. El orden por defecto de las listas ya estaba definido por `DD2`: **Commitment más próximo a
   vencer primero, proximidad del examen en segundo lugar**, nunca fusionados en un solo número
   ([`domain-translation-dd1-dd10.md`](domain-translation-dd1-dd10.md)). Implementado como
   `compareByDefaultOrder`, con un test que verifica que un examen inminente **no** adelanta a un
   Commitment que vence antes — que es exactamente lo que pasaría si los dos relojes se fusionaran
   en un score.

**Trabajo:**
- `lib/domain/types.ts` — los tipos de [`data-model.md`](data-model.md) §13.
- `lib/domain/state-machines.ts` — las cuatro máquinas como tablas de transición puras.
- `lib/domain/precedence.ts` — `selectHeroLevel` extraída de `hoy-autogestion.tsx`.

  > **Corrección de dato.** El roadmap decía "ampliada de 4 a los 9 niveles". La función **ya tenía
  > los 9**; lo que estaba limitado a 4 era el **renderizado** en `UX01`. La extracción no amplió
  > nada: agregó el test por nivel que faltaba. Dibujar los niveles restantes sigue siendo trabajo
  > de la Etapa 0.7, tal como esa etapa ya lo declara.
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

#### ✅ Etapa 0.2 — COMPLETA · 29 de agosto de 2026

**Verificación real:**

| Criterio | Resultado |
|---|---|
| Ninguna pantalla importa un fixture | ✅ test estático en `tests/track-a-rules.test.ts`, junto con "`lib/domain/` no importa React ni fixtures" |
| Transiciones prohibidas con test | ✅ 18 tests. `MISSED → COMPLETED` falla, `MISSED` solo sale a `CLOSED`, `STARTED` no admite `RENEGOTIATED`, `SUBMITTED` no salta a `VALIDATED` |
| `selectHeroLevel` con test por nivel | ✅ los 9, más un test que verifica que **cada nivel gana sobre todos los posteriores** |
| Las 6 pantallas renderizan igual | ✅ ver abajo |
| `npm run lint` · `npm run build` · `npm test` | ✅ verde · verde · **76 tests en 6 archivos** |

**Verificación visual, en dos capas.**

1. **Diff píxel a píxel** contra las capturas de la Etapa 0.1, en desktop 1440×900 y a 360 px.
   `UX05` salió **idéntica byte a byte**. `UX02`, `UX03`, `UX04` y `UX06` difieren en **97–459
   píxeles (≤ 0,07 % de la imagen)**, con los deltas confinados a los bordes de glifo de las líneas
   donde el prefijo de copy y el dato ahora son dos nodos de texto en vez de uno. Sin corrimiento de
   layout y sin cambio de contenido. `UX01` difiere mucho, como corresponde: **se le quitó el
   conmutador de demo interno**, que es trabajo pedido por esta etapa.
2. **Comparación de texto renderizado** contra el árbol de la Etapa 0.1 (commit `2c2ac8b`): los 84
   fragmentos de texto del código anterior siguen presentes. 67 visibles hoy en una URL, 11 en el
   catálogo esperando que la 0.3 los cablee, y 6 que ahora se **componen** en tiempo de render.
   Esos 6 quedaron cubiertos por `tests/screens-render.test.tsx`, que afirma las frases exactas de
   la 0.1 —*"En curso · Entregá: 7 ejercicios"*, *"Porque: la acción se cierra con evidencia
   verificable."*…— en los cinco niveles que `UX01` dibuja. La verificación manual quedó convertida
   en guard permanente.

**Entregado:**

- `lib/domain/` — `types.ts` (entidades, provenance, las 4 formas de ausencia tipada),
  `state-machines.ts` (las 4 tablas de transición), `precedence.ts` (`selectHeroLevel` + el orden
  por defecto de `DD2`), `view-models.ts` (la frontera: las props de cada pantalla).
- `lib/content/` — `es-AR.ts` (copy con ID tipado) y `hero.ts` (nivel → copy).
- `lib/fixtures/` — 6 escenarios: `FX-DAY-BASE`, `FX-EVD-BASE`, `FX-MISSED`, `FX-ADE-NONE`,
  `FX-LOCAL-DAY-IN-PROGRESS`, `FX-LOCAL-PROG-VALIDATED`.
- Las 6 pantallas con props tipadas; las rutas leen el escenario y lo proyectan.

**Deuda declarada:**

1. **Los segmentos `[id]` siguen sin crearse.** El catálogo ya da identidad, pero elegir escenario
   por URL es parte del grafo de navegación, que es la **Etapa 0.3**. Cada ruta usa hoy un escenario
   fijo, y por eso 11 fragmentos de copy están en el catálogo sin URL que los alcance.
2. **`lib/content/hero.ts` cubre 5 de los 9 niveles**, a propósito. Los otros cuatro entran en la
   0.7 y dos de ellos **necesitan una decisión previa**: `product.md` §10.2 le da a
   `COMMITMENT_NEXT` dos verbos (*"Ver compromiso"* / *"Empezar"*) y a `EVIDENCE_INFO` otros dos
   (*"Ver evidencia"* / *"Ver avance"*) sin decir cuál aplica cuándo. **No se eligió**: elegir sería
   inventar una regla de negocio.
3. **`ExamPreparation` no tiene tabla de transiciones.** `data-model.md` §3.4 declara los nueve
   estados pero no sus transiciones, y tres de ellos colisionan con
   [ADR-011](decisions.md#adr-011). Se exportan los estados y **no se aproxima una tabla**. Se cierra
   en la Fase B5.
4. **`UX02` dice "Entrega:" donde `UX01` dice "Entregá:".** Viene del copy original de las dos specs
   y **se preservó tal cual**, con los dos IDs separados en `lib/content/`. Si es una grieta de tono
   (anti-patrón `A-05`) o dos usos legítimos —imperativo voseado vs. sustantivo— lo resuelve la
   auditoría de la Etapa 0.7. No se normalizó en silencio.
5. **`DimensionValue` y `TopicProgressDimensions` están tipados pero `UX06` todavía no se apoya en
   ellos**: sus filas siguen siendo texto con marca de ausencia, como en la 0.1. Atar las cinco
   dimensiones al tipo es trabajo de la 0.7 y de la Fase B3.

---

### Etapa 0.3 — Golden Path y registro de CTAs

**Decisiones de diseño — ✅ aprobadas el 29 de agosto de 2026:**

1. **Cada superficie tiene URL propia** (`I-01`). Ya quedó resuelto en la Etapa 0.1 con el route
   group `(student)`; acá solo se confirma. Un test verifica que cada superficie **o** tiene ruta
   **o** declara qué etapa la construye, nunca las dos ni ninguna.
2. **Los fallbacks son aristas del grafo, no texto.** El grafo tiene dos clases de arista:
   `canonica` y `retornoSeguro`, y las dos apuntan a nodos reales. Eso permite verificar por test
   que todo destino de retorno existe y que ningún nodo queda encerrado — que es literalmente lo que
   promete "retorno seguro".
3. **Aparición y habilitación son cosas distintas.** El Done de esta etapa decía que *"una CTA cuya
   condición no se cumple no se renderiza, en vez de renderizarse deshabilitada"*, y eso chocaba con
   `UX05`, que muestra *Enviar evidencia* deshabilitada hasta que hay adjunto. Se resolvió
   separando:

   | | Pregunta | Si no se cumple |
   |---|---|---|
   | `aparece` | ¿Existe el contrato y el objeto está en el estado que la CTA supone? | **No se renderiza.** No en gris: desaparece |
   | `habilitada` | ¿Falta algo que el estudiante puede completar en esta misma pantalla? | Se renderiza **deshabilitada**, con tratamiento propio (`A-08`) |

   El spec respalda la distinción: el estado de error de `CTA-017` dice literalmente *"ocultar **o**
   no habilitar"*. `UX05` no cambió.
4. **Alcance:** se declaran las 18 y el test de alcance se exige sobre las CTAs cuya superficie de
   origen ya existe. `CTA-011`, `CTA-012` y `CTA-013` quedan bloqueadas por etapa, **y un test
   afirma que lo están porque su superficie es la que falta**: en cuanto la 0.4 le dé ruta a `UX07`,
   ese test rompe hasta que se cablee `CTA-011`. La brecha no puede quedarse callada.

**Trabajo:** `lib/navigation/golden-path.ts` con el grafo, y `lib/navigation/cta-registry.ts` con las
18 CTAs, cada una con condición de aparición, acción solicitada, destino, resultado autoritativo,
fallback y estado de error, según `product-spec-source.md` Parte III §5.

**Done cuando:**
- Las 18 CTAs están declaradas y son alcanzables desde algún escenario.
- Una CTA cuya condición no se cumple **no se renderiza**, en vez de renderizarse deshabilitada.
- Test estático: toda CTA del registro tiene al menos un escenario que la alcanza.

---

#### ✅ Etapa 0.3 — COMPLETA · 29 de agosto de 2026

**Verificación real:**

| Criterio | Resultado |
|---|---|
| Las 18 CTAs declaradas con sus 9 campos | ✅ `lib/navigation/cta-registry.ts`, transcripción de `product-spec-source.md` Parte III §5 |
| Alcanzables desde algún escenario | ✅ **15 de 15 exigibles.** Las 3 restantes bloqueadas por etapa, con guard que rompe cuando su superficie exista |
| Una CTA sin condición no se renderiza | ✅ `ctasVisibles` no la devuelve. Con el contexto vacío **ninguna** CTA aparece en **ningún** nodo: deny-by-default |
| Test estático de alcance | ✅ un test por CTA, más dos que impiden que la lista de bloqueadas crezca o se quede vieja |
| `npm run lint` · `build` · `test` | ✅ verde · verde · **122 tests en 7 archivos** |

**El grafo camina de verdad.** Las rutas ya no usan escenario fijo: el destino de cada CTA sale del
registro. Verificado por clic en el navegador, sin errores de consola:

```
/hoy  --[Comprometerme]-->      /accion      (CTA-002)
/accion --[Me comprometo]-->    /compromiso  (CTA-003)
/compromiso --[Confirmar]-->    /hoy         (CTA-004)
/hoy  --[Programación]-->       /materia     (CTA-001)
/materia --[Comprometerme]-->   /accion      (CTA-002)
/progreso --[Ver siguiente]-->  /hoy         (CTA-010)
```

**Dos correcciones que el propio test encontró:**

1. **`CTA-015` apuntaba a `UX04`, saliendo de `UX04`** — un bucle. El spec dice `UX04/rescate`, que
   es un flujo propio. Se modeló `UX04_RESCATE` como nodo separado, por la misma razón que
   `UX04_RENEGOCIACION` y por una de fondo: **el rescate es otro objeto, no una edición del
   original**. Colapsarlo en `UX04` haría parecer que `CTA-015` vuelve sobre el Commitment
   incumplido.
2. **Quedarse quieto no es una arista.** El *"conservar Hoy"* de `CTA-001` desde `UX01` no es una
   transición. Se decide por arista y no por fila, porque una CTA con varios orígenes puede ser las
   dos cosas: el *"mantener Commitment vigente"* de `CTA-017` es un movimiento real desde `UX01` y
   ninguno desde `UX04`.

**Tres huecos encontrados, que esta etapa no cierra:**

1. **`UX05` no es alcanzable por clic.** El spec rutea `UX04 → ejecución → UX05`, y `ejecución` es
   un nodo **sin pantalla**. Hoy sólo se llega a `/evidencia` escribiendo la URL. No se inventó una
   transición: el grafo dice lo que el spec dice. **Lo tiene que resolver la Etapa 0.8**, que es la
   que promete un recorrido limpio para focus group.
2. **`UX06` tampoco es alcanzable por clic.** `CTA-009` (*ver progreso*) está declarada y es
   alcanzable en contexto desde `UX01`, `UX02` y `UX05`, pero **ninguna pantalla la renderiza
   todavía**. Es trabajo de la **Etapa 0.7**, que es la que lleva cada pantalla a la cobertura de
   CTAs de su spec.
3. **`UX06` promete una transición que el registro no autoriza.** Su CTA principal dice *"Ver
   siguiente acción"*, pero desde `UX06` la única CTA del registro es `CTA-010`, cuya acción es
   *"volver a Hoy"*. Se cableó `CTA-010` —lo que el spec autoriza— y **no se tocó el copy**. Si el
   copy está mal o si falta una CTA en el registro es una pregunta para la auditoría de la **0.7**.

> ⚠️ **Consecuencia para el Done de la Fase 0.** El criterio *"el Golden Path es recorrible extremo a
> extremo"* **todavía no se cumple**: el loop `UX01 → UX03 → UX04 → UX01` y la rama de lectura sí,
> pero `UX05` y `UX06` no tienen entrada por clic. Queda anotado acá para que no se dé por hecho al
> llegar a la 0.8.

**Deuda declarada:**

- **`EJECUCION` no tiene retorno seguro**, y es correcto: su único fallback declarado es *"mantener
  ejecución"*. El spec no define una salida de la ejecución que no sea terminarla, y agregar una
  sería inventar una transición. Un test fija la lista de nodos sin retorno en exactamente
  `["EJECUCION"]`, para que aparezca un segundo y nadie lo note.
- Los escenarios de navegación nuevos —`FX-REN-ELIGIBLE`, `FX-REN-INELIGIBLE`, `FX-REFL-OPT`,
  `FX-ERROR-IDEM`, `FX-LOCAL-COMMITMENT-CONFIRMED`, `FX-LOCAL-EVD-RESUBMISSION`— **declaran contexto
  sin vista**. Dicen en qué estado está el mundo para que las CTAs sean alcanzables; dibujar esos
  estados es la Etapa 0.7.

---

### Etapas 0.4–0.6 — Las tres pantallas de Modo Examen

Son **secuenciales**: `UX08` recibe el handoff de `UX07`, y `UX09` el de `UX08`.

**Fuente:** `product-spec-source.md` §VI.7 (líneas 10131–11556), §VI.8 (11557–12714), §VI.9
(12715–14607). **No** el arnés QA.

**Decisiones de diseño transversales a las tres:**
1. ✅ **Confirmado en la 0.4.** `UX07`: el baseline es `RECOMMENDED → CTA del estudiante → ACTIVE`.
   **No existe variante auto-activa.** Hay un test que lo verifica: ningún escenario habilita
   `CTA-011` sin confirmación explícita del estudiante.
2. ✅ **Confirmado en la 0.4.** El alta de un `Assessment` no registrado **no se implementa**
   (`SCP-09`/`SCP-10` abiertos). `FX-LOCAL-EXAM-SIN-ASSESSMENT` muestra el estado no implementable
   con retorno seguro, sin formulario y sin CTA primaria.
3. ✅ **Confirmado en la 0.5.** `UX08`: la matriz de precedencia tiene **10 niveles ordenados, en
   14 filas** — el spec abre el nivel 3 en tres variantes (`CONFIRMED` futuro / `DUE` / `STARTED`),
   el 4 en dos (rescate requerido / rescate materializado) y el 9 en `9a`/`9b`. Se conservó la
   numeración del spec en vez de aplanarla a catorce, porque aplanarla rompía la trazabilidad contra
   §13. Implementada como `selectOverviewLevel`, función pura, con los **nueve conflictos que §13
   declara** testeados uno por uno.
4. ✅ **Confirmado y precisado en la 0.5.** `UX08` **no crea card de readiness**
   ([ADR-011](decisions.md#adr-011)). Pero eso no es lo mismo que ocultar un status recibido:
   `VI.8` §18 autoriza mostrar `READY_BY_PROTOCOL` con una frase literal cuando el owner lo manda.
   **Son cosas distintas** — calcular y presentar readiness *versus* releer un valor que
   `ExamPreparation` ya trae. La pantalla no calcula, no deriva, no muestra score ni porcentaje, y
   el descargo *"Esto no predice ni garantiza el resultado"* viaja siempre pegado al valor.
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
- El primer viewport cumple el contrato de orden semántico de su spec **en desktop**, y no lo pierde
  a 360 px ([ADR-014](decisions.md#adr-014)).
- Una sola CTA primaria por estado.
- Los fallbacks **omiten**, no inventan.
- Lint, build y tests en verde.

---

#### ✅ Etapa 0.4 — `UX07` COMPLETA · 29 de agosto de 2026

**Readiness.** La etapa arrancó con `design-system-capturas.md` §12.7 en `PENDING`, que era su único
bloqueo. Se cerró antes de codear con [ADR-015](decisions.md#adr-015) — y **no hizo falta decidir
nada nuevo**: la pregunta estaba mal planteada. §12.7 razonaba desde las capturas anonimizadas, que
son de **otro producto**; la spec `VI.7` tiene wireframes desktop propios (§21.2 y §24) y ya
contestaba. `AGENTS.md` §8 pone `product-spec-source.md` por encima de las capturas.

**Verificación real:**

| Criterio | Resultado |
|---|---|
| Estados críticos alcanzables | ✅ **23 escenarios**: los 22 de la matriz de `VI.7` §16 más `VERIFICANDO`, que §15 lista y §16 no numera |
| Los 16 estados funcionales de §15 | ✅ todos cubiertos, verificado por test |
| Una sola CTA primaria por estado | ✅ test por escenario: se renderiza exactamente una, o ninguna |
| Fallbacks que omiten, no inventan | ✅ sin alta de `Assessment`, sin countdown con fecha desconocida, sin selector de modalidad, sin elegir entre fuentes disputadas |
| Contrato de orden en desktop y a 360 px | ✅ los 23 estados renderizados en ambos anchos, sin scroll horizontal ni errores de consola |
| `npm run lint` · `build` · `test` | ✅ verde · verde · **149 tests en 8 archivos** |

**Layout, según ADR-015 y `VI.7` §21.2.** Dos columnas: principal con identidad, datos, razón y
decisión; secundaria con efecto real, continuidad y salida. La CTA primaria va **a ancho completo al
final de la columna principal** —medido: ocupa el 92 % del ancho de su columna y es su último
elemento— y el retorno seguro vive en la secundaria, sin estilizarse como primaria. A 360 px las
columnas se apilan conservando el orden obligatorio de §21.1.

**Cómo se alcanza cada estado.** `/examen/activar?escenario=<ID>` abre cualquiera de los 23 sin panel
de debug en pantalla. Es un parámetro de **lectura**: no persiste nada, sigue siendo cero red y cero
storage. La 0.8 decide cuáles entran en el recorrido limpio.

**Invariantes que la pantalla hace visibles:**

- **§21.3 — cuando ya existe `ACTIVE`, el estado reemplaza el CTA de activación.** No queda un botón
  *Activar* deshabilitado que sugiera una segunda operación. Es el caso donde la regla de la 0.3
  cae del lado de *ocultar*, no de *deshabilitar*.
- **Ninguna capa eleva la verificación.** La provenance se verifica **por dato**, no por pantalla:
  una misma vista mezcla una fecha reportada por el estudiante con una modalidad oficial, y la
  primera no hereda la verificación de la segunda. Los datos son direccionables (`data-dato`)
  justamente para poder testearlo así.
- **Los enums técnicos nunca son copy visible** — test sobre los 23 escenarios.
- **Sin porcentajes ni readiness numérica** (`DD5`) — test sobre los 23.

**`CTA-011` quedó cableada.** El guard que la 0.3 dejó puesto hizo exactamente lo que prometía: al
darle ruta a `UX07`, el test rompió hasta sacarla de la lista de bloqueadas y hacerla alcanzable.
Quedan 2 bloqueadas: `CTA-012` (0.5) y `CTA-013` (0.5).

**Hallazgo registrado como [ADR-016](decisions.md#adr-016) `PENDING`:** **ninguna de las 18 CTAs del
registro canónico lleva a `UX07`**, pero `VI.7` §9 describe en detalle una entrada manual *"desde
Materia/Cursado"*. O falta una CTA en el registro, o la entrada manual es una affordance sin
contrato. **No se inventó `CTA-019`.** `UX07` queda alcanzable por URL y por catálogo, no por clic
desde `UX02` — el mismo tipo de hueco que la 0.3 registró para `UX05` y `UX06`, y se resuelve junto
con ellos antes de la 0.8.

**Diferencias con el wireframe, anotadas para la auditoría de la 0.7:**

1. `VI.7` §24.2 dibuja la lista de selección y el panel de revisión en **columnas contiguas**. Acá
   van una debajo de otra dentro de la columna principal, porque la secundaria ya lleva el efecto
   real que §21.2 le asigna. La lista va **antes** del panel: primero se elige y el panel *"sólo
   aparece para la seleccionada"*.
2. `CTA-011` apunta a `UX08`, que no existe hasta la 0.5. Hasta entonces la CTA **no navega**; no se
   inventó un destino.

---

#### ✅ Etapa 0.5 — `UX08` COMPLETA · 29 de agosto de 2026

**Verificación real:**

| Criterio | Resultado |
|---|---|
| Estados críticos alcanzables | ✅ **35 escenarios** cubriendo los 28 estados obligatorios de `VI.8` §16 y sus variantes |
| Los 10 niveles de precedencia | ✅ todos alcanzables desde el catálogo, y las 7 variantes también |
| Los 9 conflictos que §13 declara | ✅ un test por conflicto, más el de que cada nivel gana sobre todos los posteriores |
| Una sola CTA primaria por estado | ✅ test por escenario |
| Sin readiness calculada | ✅ ningún escenario muestra porcentaje, score ni *"Listo para rendir"*; sólo uno trae status recibido, y con su descargo |
| Contrato de orden en desktop y a 360 px | ✅ los 35 renderizados en ambos anchos, sin scroll horizontal ni errores de consola |
| `npm run lint` · `build` · `test` | ✅ verde · verde · **203 tests en 10 archivos** |

**La matriz de precedencia es distinta de la de `UX01`.** Aquélla ordena el día; ésta ordena una
preparación concreta y **no compara materias**. Vive en `lib/domain/overview-precedence.ts`, separada
de `precedence.ts`, y sigue el mismo patrón: la función decide, el fixture declara la condición.

**Dos huecos que encontraron los propios tests:**

1. **Faltaba el nivel 5** — `Evidence RESUBMISSION_REQUESTED` → *PREPARAR NUEVA EVIDENCIA*. §16 no lo
   numera como estado obligatorio, pero §13 y §14 lo declaran. El test de cobertura de niveles lo
   cazó y se agregó `FX-LOCAL-OV-RESUBMISSION`.
2. **Faltaba la variante de rescate materializado** del nivel 4, que tiene su propio lifecycle y
   convive con el `MISSED` original preservado. Se agregó `FX-LOCAL-OV-RESCATE-REAL`.

**El guard de CTAs se afinó, porque estaba midiendo lo que no era.** Al darle ruta a `UX08` rompió
por `CTA-012` — pero `CTA-012` **nace** en `UX08`, así que su origen ya existe; lo que le falta es el
**destino** (`UX09`, Etapa 0.6). Son dos huecos distintos y ahora se testean por separado:

- la lista de CTAs con **superficie de origen pendiente** quedó **vacía**: las 18 son exigibles y
  alcanzables;
- una lista nueva fija las CTAs con **destino sin ruta**, hoy exactamente `["CTA-012"]`, que se
  vacía cuando la 0.6 construya `UX09`.

**Diferencia con el wireframe, anotada para la 0.7:** `VI.8` §25 muestra el estado de la preparación
como el enum `ExamPreparation ACTIVE`. Acá se usa el microcopy que §23 define —*"PREPARACIÓN
ACTIVA"*— porque §19 prohíbe que los enums técnicos sean copy principal, y §24 declara que los
wireframes son funcionales y no high-fi.

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
- [ ] El test de comprensión de 10 segundos ejecutado **con personas reales, en desktop**
      ([ADR-014](decisions.md#adr-014)), sin pérdida de información a 360 px

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
| [ADR-016](decisions.md#adr-016) Entrada a `UX07` | Golden Path recorrible (0.8) |

✅ **Resueltos el 28 de agosto de 2026,** y por eso ya no aparecen arriba:
[ADR-008](decisions.md#adr-008) (stack), [ADR-009](decisions.md#adr-009) (nomenclatura `DD`),
[ADR-010](decisions.md#adr-010) (`DD1`–`DD10`, salvo `DD4` `DEFERRED`),
[ADR-012](decisions.md#adr-012) (alcance del Track A) y
[ADR-013](decisions.md#adr-013) (anexo deduplicado).

✅ **Resuelto el 29 de agosto de 2026:** [ADR-014](decisions.md#adr-014) (desktop-first; el contrato
del primer viewport pasa a orden semántico, con 360 px como piso móvil).

> **Nada bloquea la Fase 0. Está lista para arrancar.**

**Único pendiente que no bloquea nada de la Fase 0:** `DD4` (vocabulario del oficio), en `DEFERRED`.
Se revisa junto con el glosario de [`product.md`](product.md) §3.

---

## 3. Estado de avance

| Fase | Estado | Etapas completas |
|---|---|---|
| Fase 0 — Cerrar Track A | 🔵 **EN CURSO** | 5 / 8 |
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
