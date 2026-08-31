# Achieve — Roadmap

**Documento:** `docs/roadmap.md`
**Rol:** owner canónico del plan por fases y del estado de avance.
**Última actualización:** 30 de agosto de 2026

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

> ✅ **Test de comprensión de 10 segundos: corrido, con resultado PASS.** Reportado por el owner el
> 30 de agosto de 2026. Con esto **la Fase 0 queda cerrada**: era el último criterio de Done y el
> único que un agente no podía ejecutar.
>
> ⚠️ **Las observaciones por pantalla no están registradas acá.** Este documento sólo asienta el
> resultado que reportó el owner; nadie más lo presenció. El guion de
> [`guion-focus-group.md`](guion-focus-group.md) tiene una fila por pantalla — si esas respuestas se
> quieren conservar como evidencia, hay que volcarlas antes de que se pierdan.

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
| 0.6 | **`UX09` — Paso de Protocolo** | Componente real con contenido configurable | ✅ |
| 0.7 | **Estados críticos de `UX01`–`UX06`** | Los 9 niveles de precedencia, los 7 estados de Evidence, renegociación, rescate, idempotencia y provenance, todos alcanzables | ✅ |
| 0.8 | **Modo focus group** | Recorrido limpio sin panel de debug + guion del test de 10 segundos | ✅ |

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
   **Resuelto después** por [ADR-015](decisions.md#adr-015); §6.2 quedó implementado en `UX07`,
   `UX08` y `UX09`, y la CTA principal va a ancho completo al final de la columna.
5. **`npm audit` reporta 3 vulnerabilidades `high`** en el árbol de dependencias heredado del
   prototipo. No se tocaron: cambiar versiones del stack es una decisión de ADR-008, no de esta
   etapa. **Queda registrado como deuda a evaluar antes de la Fase 0 Done.**

   > ⚠️ **Ese gate no se cumplió, y hay que decirlo.** La Fase 0 se cerró 8/8 sin evaluar esta
   > deuda. Re-verificado el 30 de agosto de 2026: **siguen siendo 3 `high`** — `next`, el `postcss`
   > que arrastra, y `sharp` por CVEs heredadas de `libvips`. Ver §3.1.

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
5. ✅ **Confirmado en la 0.6.** `UX09`: **no se muestra "Paso 5 de 12"** ni porcentaje. `VI.9` §13.2
   lo funda: instancia, orden, `current`/`next` y deduplicación siguen `SOURCE CONTRACT PENDING`. La
   versión del protocolo sí se muestra, tal como llega y **sin declararla vigente**. Hay un test que
   verifica las tres cosas sobre los 35 escenarios.

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

#### ✅ Etapa 0.6 — `UX09` COMPLETA · 29 de agosto de 2026

**Con esto existen las nueve superficies.**

| Criterio | Resultado |
|---|---|
| Estados críticos alcanzables | ✅ **35 escenarios** cubriendo los 31 estados obligatorios de `VI.9` §22 |
| Los 11 niveles de precedencia de §19 | ✅ todos alcanzables, más un test de que cada nivel gana sobre los posteriores |
| Los 9 conflictos que §19.1 declara | ✅ uno por uno |
| Nunca `Paso N de M` ni porcentaje | ✅ test sobre los 35, en código y en navegador |
| Una sola CTA primaria por estado | ✅ test por escenario |
| Retorno seguro en todos los estados | ✅ los 35 conservan salida al Overview |
| `npm run lint` · `build` · `test` | ✅ verde · verde · **249 tests en 11 archivos** |

**Tres matrices de precedencia, tres funciones puras separadas.** `UX09` §19 se parece mucho a
`UX08` §13, pero no es la misma: el nivel 7 abre el **recurso** en vez del paso, hay un nivel 10
propio (paso completado → abrir el nuevo current) y el fallback vuelve al Overview, no al Cursado.
Se mantuvieron separadas porque son dos documentos normativos distintos: unificarlas haría que un
cambio en §13 alterara `UX09` en silencio.

**Se extrajo la primitiva `Dato`** a `components/screens/design-system.tsx` —la primitiva
`Provenance` que §3.2 del sistema de diseño declaraba faltante—. `UX07`, `UX08` y `UX09` ya tenían
tres copias de la misma regla, y la regla de provenance es justamente la que menos conviene dejar
divergir. Los 53 tests de `UX07` y `UX08` siguen en verde tras el cambio.

**El guard de destinos se vació.** Al darle ruta a `UX09`, `CTA-012` dejó de tener destino pendiente:
**las 18 CTAs son alcanzables y todos sus destinos tienen pantalla.**

**Deuda declarada:** en el Track A no hay un `Resource` real que abrir, así que *ABRIR RECURSO*
no navega. Es coherente con §19.3 —abrir el recurso es navegación, no transición, y no muta nada—
pero significa que ese CTA no hace nada visible. La **Etapa 0.8** decide si el recorrido de focus
group lo incluye y con qué destino sintético.

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

#### ✅ Etapa 0.7 — COMPLETA · 30 de agosto de 2026

| Criterio | Resultado |
|---|---|
| Los 9 niveles de precedencia de `UX01` | ✅ los nueve, más sus **cinco variantes de CTA** |
| Los 8 estados del lifecycle de `Commitment` | ✅ los ocho, verificados contra la tabla de transiciones |
| Los 7 estados de `Evidence` | ✅ los siete, más upload en curso, upload fallido, artefacto formal, entrega tardía y Reflection requerida |
| Renegociación, rescate y provenance | ✅ elegible y no elegible, con el original visible y no editable |
| Las 4 variantes de resultado de progreso | ✅ y los tres estados de no-cambio, distinguibles entre sí |
| Imprimir en blanco y negro | ✅ verificado en el navegador: el texto es idéntico con `grayscale(1)` |
| `npm run lint` · `build` · `test` | ✅ verde · verde · **304 tests en 13 archivos** |

**37 escenarios nuevos** para `UX02`–`UX06` más **7** para los niveles que le faltaban a `UX01`.
Las seis rutas aceptan `?escenario=`, así que **todo estado crítico tiene URL** (`I-01`).

**[ADR-017](decisions.md#adr-017) cerró la deuda que venía desde la Etapa 0.2.** Los dos verbos que
`product.md` §10.2 dejaba ambiguos no eran una decisión abierta: era **un resumen que había perdido
el discriminador**. `VI.1` §3.2 lo dice completo —el nivel 3 se decide por **tiempo acordado**, el 8
por **lifecycle de la Evidence**— y `VI.2` lo repite en su tabla de CTA por lifecycle. Mismo patrón
que ADR-015: la respuesta estaba en la fuente de mayor precedencia.

**Un defecto real que el ADR destapó.** `selectHeroLevel` trataba `RESCUE_MATERIALIZED` como un nivel
3 automático. `VI.1` §3.2 dice lo contrario: *"no describe por sí solo qué necesita hacer el alumno
ahora, por eso participa en la precedencia según su lifecycle real"*. Con el código anterior, un
rescate materializado **desplazaba a una recomendación vigente sin tener objeto que abrir**. Ahora
participa por su lifecycle y hay un test que fija la conducta.

**`UX06` pasó a ser alcanzable por clic.** `CTA-009` (*ver progreso*) estaba declarada desde la
Etapa 0.3 y ninguna pantalla la renderizaba. Ahora aparece en `UX01` **sólo si el contexto declara la
Bitácora disponible** —es su condición de aparición— y el recorrido `Hoy → Progreso → Hoy` funciona.

**Auditoría de conformidad de [`design-system.md`](design-system.md) §9.** Corrida, con los fallos
reportados:

| Bloque | Resultado |
|---|---|
| 2 · Contenido | ✅ `C-01`, `C-02`, `C-03`, `C-06`, `C-07` automatizados y en verde |
| 4 · Datos | ✅ `P-03` sin magnitudes crudas; `P-09` las cuatro ausencias con copy propio |
| 5 · Visual | ✅ `A-08` deshabilitado con tratamiento propio; `P-06` ningún estado sólo por color; `V-02` mono sólo donde corresponde |
| 6 · Interacción | ✅ `I-01` todo estado con URL; `I-05` el bloqueante arriba de la CTA; **recorrido completo con `Tab` en las 9 superficies, con anillo de foco visible en todas las paradas** |
| **No corrido** | ⚠️ **Lector de pantalla** sobre la pantalla más compleja, y **`A-01` con datos sucios reales**. Los dos exigen una persona y datos que el Track A no tiene. Quedan para la **0.8** y para el Track B respectivamente |

**Se cerró la grieta de tono que la 0.2 había dejado anotada.** `UX02` decía *"Entrega:"* donde
`UX01` dice *"Entregá:"*, para el mismo campo. No era un error —las dos formas son español
correcto—: era **la excepción que el propio checklist pide buscar** (*"`C-01` Una sola persona
gramatical. Buscá la excepción: siempre hay una"*). Se unificó a la forma de `UX01` por `C-01` y
`C-02`. **Es un cambio de copy respecto del prototipo** y queda anotado.

**Cambio menor de infraestructura:** la CTA primaria lleva `data-cta-primaria`. Contar por `w-full`
daba falsos positivos —el área de adjuntar de `UX05` también la usa— y el test de *una sola CTA
primaria* estaba midiendo mal.

**Lo que sigue abierto para la 0.8:** `UX05` **todavía no es alcanzable por clic**. El spec la rutea
`UX04 → ejecución → UX05`, y `ejecución` es un nodo sin pantalla. Junto con
[ADR-016](decisions.md#adr-016) (ninguna CTA lleva a `UX07`), son los dos huecos que quedan del
recorrido.

---

### Etapa 0.8 — Modo focus group

**Trabajo:** un recorrido limpio sin panel de debug, con reset determinista, y el guion del test de
10 segundos por pantalla con las respuestas esperadas (ya están escritas en cada spec).

**Done cuando:** una persona ajena al proyecto puede recorrer el Golden Path completo en un teléfono
sin instrucciones, y el facilitador tiene el guion con los criterios de PASS.

---

#### ✅ Etapa 0.8 — COMPLETA · 30 de agosto de 2026

| Criterio | Resultado |
|---|---|
| Recorrido completo por clic, a 360 px | ✅ **10 de 10 estaciones**, sin errores de consola |
| Sin panel de debug | ✅ ninguna pantalla muestra IDs de fixture ni andamiaje interno |
| Reset determinista | ✅ recargar `/hoy`. Verificado: tras paginar la lista y adjuntar evidencia, la recarga devuelve el DOM inicial |
| Guion del facilitador | ✅ [`guion-focus-group.md`](guion-focus-group.md), con las preguntas y respuestas de cada spec `VI.*` y su criterio de PASS |
| `npm run lint` · `build` · `test` | ✅ verde · verde · **337 tests en 14 archivos** |

**El recorrido es una cadena coherente**, no nueve pantallas sueltas: el mismo estudiante avanzando
por el loop, y la CTA principal de cada estación lleva a la siguiente. Vive en
`lib/navigation/focus-group.ts`, **aparte del registro canónico**, porque es el guion de una sesión y
no un contrato de producto.

**Las dos costuras se atraviesan sin taparlas:**

1. **`UX05`** — el spec la rutea `UX04 → ejecución → UX05` y `ejecución` **no tiene pantalla**. El
   recorrido recorre los dos contratos de una vez (`CTA-005` sale, `CTA-006` llega) y la estación lo
   **declara**. No se inventó una transición.
2. **`UX07`** — ninguna CTA lleva ahí ([ADR-016](decisions.md#adr-016), `PENDING`). Esa estación se
   alcanza por **navegación del facilitador**, marcada como tal. **No se agregó `CTA-019`.**

**Tres defectos que encontró el propio recorrido:**

1. **El marcador `facilitador` era decorativo.** `siguienteUrl` encadenaba igual, así que el botón de
   `UX02` **llevaba a `UX07`** — creando en los hechos la `CTA-019` que este mismo trabajo se había
   negado a inventar. Corregido: la cadena se corta antes de una estación del facilitador, con test.
2. **`UX08` decía una cosa y llevaba a otra.** El escenario por defecto de la ruta es una preparación
   recién activada, cuya CTA es *"VOLVER A CURSADO"*; encadenada al paso, el botón decía *volver* y
   avanzaba. La estación pasó a usar el escenario con handoff disponible, cuya CTA sí es *ABRIR PASO
   ACTUAL*, y hay un guard que prohíbe que una estación avance con un verbo de retorno.
3. **El guard de cero-persistencia se disparaba con su propia documentación.** Escaneaba prosa además
   de código. Ahora quita comentarios antes de escanear, y **siete tests nuevos prueban que la
   relajación no abrió un agujero**: sigue cazando `localStorage.setItem`, `fetch(` y código pegado a
   un comentario.

**Un hallazgo de producto, no un defecto:** `Enviar evidencia` está **visible pero deshabilitada**
hasta que el participante adjunta algo. Es la **única interacción obligatoria** del recorrido y es la
regla de aparición/habilitación de la Etapa 0.3 funcionando: el botón dice qué va a pasar antes de
que se pueda hacer. Quedó anotado en el guion como momento de observación.

**Lo que el guion declara que NO cubre:** el lector de pantalla y `A-01` con datos sucios reales. Los
dos exigen una persona y datos que el Track A no tiene.

### Fase 0 — Done cuando…

- [x] Las 9 superficies existen como componentes reales con el sistema visual final — **29 ago 2026**
- [x] Todos los estados críticos de las 9 specs son alcanzables — **30 ago 2026**
- [x] El Golden Path es recorrible extremo a extremo — **30 ago 2026.** 10 de 10 estaciones por clic a 360 px, con una navegación del facilitador declarada ([ADR-016](decisions.md#adr-016))
- [x] Cero red, cero persistencia, cero datos reales — **verificado por test estático**
- [x] La auditoría de conformidad de [`design-system.md`](design-system.md) §9 corrida, con los
      fallos reportados y no escondidos — **30 ago 2026.** Dos ítems **no corridos**: lector de
      pantalla y `A-01` con datos sucios reales
- [x] Lint, build y tests en verde — **337 tests**
- [ ] El test de comprensión de 10 segundos ejecutado **con personas reales, en desktop**
      ([ADR-014](decisions.md#adr-014)), sin pérdida de información a 360 px
      → ⏳ **lo único que falta.** El guion está listo en
      [`guion-focus-group.md`](guion-focus-group.md); ejecutarlo requiere personas y no lo puede
      hacer un agente

---

## Fase A2 — Shell de aplicación · ✅ COMPLETA

**Estado:** ✅ **5 / 5 etapas.** Eran 6: [ADR-019](decisions.md#adr-019) descartó el dock.

De las **siete diferencias** contra las capturas (§14.2), **seis cerradas**. Queda **`D-03`**
—segmentados—, bloqueada porque las listas de opciones no existen en los view models y fabricarlas
sería inventar dominio. **`D-05` se volvió a medir** después de la subcopy y cambió de signo: ver
§14.5.
**Abierta por:** [ADR-018](decisions.md#adr-018), 30 de agosto de 2026.

**Objetivo.** Que Achieve **se parezca al software de `docs/diseño/`**. Las nueve superficies ya
existen, con sus estados críticos y su Golden Path; lo que falta es el **marco que las contiene**.

**Por qué es una fase nueva y no una etapa más de la Fase 0.** La Fase 0 se cerró con un criterio de
Done que **nunca incluyó parecerse a las capturas**. Pedírselo ahora sería mover el arco después del
gol. Esto es trabajo nuevo, con su propio objetivo.

### La brecha, en concreto

Lo que muestran las capturas y Achieve hoy no tiene:

| Patrón en las capturas | Achieve hoy |
|---|---|
| **Navegación lateral** persistente, colapsable, con el ítem activo en píldora y contadores | No hay navegación: se llega por URL o por CTA |
| **Topbar** con breadcrumb, buscador `⌘K`, notificaciones y selector de cuenta | No hay topbar |
| ~~**Dock inferior** con lo que quedó abierto~~ | **Descartado.** La fuente misma lo desaconseja para flujos lineales ([ADR-019](decisions.md#adr-019)) |
| **Controles segmentados** en píldora para alternar vistas | No existen |
| **Densidad de panel**: tarjeta con título, subcopy explicativa y contenido tabular | Tarjetas de una sola columna, centradas |
| **Vacíos que explican** qué va a aparecer y por qué importa | Los vacíos dicen que no hay dato, sin explicar |

### Etapas

| # | Etapa | Entregable |
|---|---|---|
| A2.1 | **Navegación lateral + topbar** ✅ | El shell: sidebar colapsable con ítem activo y contadores, topbar con breadcrumb y selector |
| A2.2 | **Buscador `⌘K`** ✅ | Paleta de comandos con navegación por teclado. **Cero red:** busca sobre el catálogo de escenarios |
| A2.3 | **Ausencia tipada** ✅ | La primitiva que `design-system.md` §3.2 declaraba faltante. **Reemplaza al dock**, descartado por [ADR-019](decisions.md#adr-019) |
| A2.4 | **Cabecera de panel** ✅ | `TituloDePanel` y `AccionDeObjeto`. Cierra `D-01` y `D-07`; deja `D-02` con el hueco listo y `D-03`/`D-05` bloqueadas por contenido (§14.5) |
| A2.5 | **Las nueve dentro del shell + comparación** ✅ | Verificado con guard estático, y la **comparación lado a lado** con las capturas: 7 diferencias reportadas (§14.2) |
| A2.6 | **Subcopy de panel y vacíos** ✅ | Las nueve frases, escritas por el owner desde el JTBD de cada spec. Cierra `D-02` y, con [ADR-022](decisions.md#adr-022), `D-04` |

### Lo que esta fase NO toca

Dominio, fixtures, registro de CTAs, las tres matrices de precedencia, los estados críticos y el
guion del focus group. **Todo eso ya está y no depende del shell.** Si una etapa de A2 necesita
cambiar una regla de dominio, es señal de que se pasó de alcance.

### Antes de empezar — ✅ resuelto el 30 de agosto de 2026

1. ✅ **Capturas abiertas.** Regla de `AGENTS.md` §1.5.
2. ✅ **§12.3 cerrada por medición, no por inferencia.** Se detectaron los hairlines por gradiente de
   luminancia sobre las capturas: sidebar **255,5 px → 256**, colapsada **79,5 → 80**, topbar
   **55,5 → 56**. Los tres múltiplos de 8, así que **la escala base 4/8 queda confirmada**.
3. ✅ **§12.4 — sin modo oscuro**, y **el conmutador no se dibuja**. Un control de tema que no cambia
   nada sería prometer lo que no se sostiene. El ítem del checklist §9 se marca `N/A` con
   justificación escrita.
4. ✅ **§12.6 — `UX06` es lista de tarjetas, no tabla.** La tabla de las capturas es densidad de
   trabajo diario; la Bitácora se mira ocasionalmente y ya viene agrupada por ciclo.

---

#### ✅ Etapa A2.1 — COMPLETA · 30 de agosto de 2026

| Criterio | Resultado |
|---|---|
| Medidas fieles a las capturas | ✅ sidebar **256 px**, colapsada **80**, topbar **56** — medido en el build, idéntico a la captura |
| Ítem activo y breadcrumb | ✅ `aria-current`, no sólo color. `UX09` da `Hoy › Materia › Modo Examen › Preparación › Paso` |
| A 360 px | ✅ la barra se oculta y **no aparece scroll horizontal** |
| Las nueve superficies dentro del shell | ✅ sin tocar su contenido |
| `lint` · `build` · `test` | ✅ verde · verde · **354 tests en 15 archivos** |

**El menú no duplica el registro de CTAs.** La navegación lateral es orientación, no acción de
dominio: no lleva ninguna CTA primaria y hay un test que lo verifica. `UX03`–`UX05` **no están en el
menú** — son pasos de un flujo que se abren desde su origen, y ofrecerlos sería dejar entrar a una
evidencia sin la acción que la pide.

**Efecto lateral bueno:** el menú alcanza `UX07`, que es justo la superficie que ninguna CTA alcanza
([ADR-016](decisions.md#adr-016)). **No la convierte en una `CTA-019`**: sigue siendo navegación, y
el recorrido de focus group sigue marcándola como paso del facilitador.

**El buscador se dibujó deshabilitado** hasta A2.2, con tratamiento propio distinto de secundario
(`A-08`). No se ofrece un campo que no busca nada.

---

#### ✅ Etapa A2.2 — Paleta de comandos · COMPLETA · 30 de agosto de 2026

| Criterio | Resultado |
|---|---|
| `I-03` entrada polimórfica que desambigua sola | ✅ *"evidencia"* trae la pantalla **y** los escenarios; las superficies primero, porque son destinos |
| `I-03` vía de escape para formatos que colisionan | ✅ `>` fuerza pantallas, `#` fuerza escenarios, **y se muestran en la propia paleta** |
| `I-04` el atajo dentro del control que dispara | ✅ el `⌘K` vive en el buscador, no en un tooltip |
| `P-07` el atajo no elimina su camino visible | ✅ el mismo control se puede tocar |
| Navegación por teclado y `Escape` con jerarquía | ✅ flechas, `Enter`, y `Escape` cierra **sin navegar** |
| Cero red | ✅ índice estático en memoria sobre el catálogo |
| `lint` · `build` · `test` | ✅ verde · verde · **370 tests en 16 archivos** |

**Los prefijos no son un adorno.** Los dos tipos colisionan de verdad: el propósito de un escenario
nombra su superficie, así que *"evidencia"* trae `UX05` y los escenarios de `Evidence` a la vez. `I-03`
pide exactamente una vía de escape para ese caso, y **se muestra en pantalla**: una vía de escape que
hay que adivinar no es una vía de escape.

**Dos defectos propios, corregidos en la misma etapa:**

1. **`lib/navigation/paleta.ts` importaba `lib/fixtures/`**, rompiendo la dirección de dependencias
   que la Etapa 0.3 fijó y que un test verifica. **El test lo cazó.** Se separó: la búsqueda queda en
   `navigation`, **pura y sin datos**, y el índice lo arma `lib/fixtures/indice-paleta.ts`, que es
   quien tiene el catálogo. La misma función busca sobre cualquier índice, y hay un test que lo
   prueba.
2. **`setState` dentro de un efecto**, que encadena renders. Se resolvió remontando el diálogo en
   cada apertura en vez de resetear estado desde un efecto.

#### ✅ Etapa A2.3 — `Ausencia` tipada · COMPLETA · 30 de agosto de 2026

**Esta etapa era el dock. La fuente dijo que no.**

Al abrir las capturas para especificarlo —regla de [`AGENTS.md`](../AGENTS.md) §1.5— la captura 07
cierra con dos bloques literales: *"**Dónde no:** productos de tarea única, **flujos lineales**… ahí
el dock es puro costo"*, y una lista de **seis requisitos innegociables** del multiventana que
termina en *"si no podés cumplirlo, no lo hagas"*. Achieve es exactamente el caso excluido: nueve
superficies encadenadas, una decisión por pantalla.

`design-system-capturas.md` ya lo descartaba en **§7.4, §10.1 y §11.3**, y `A-07` —uno de los nueve
anti-patrones catalogados— **es un defecto del dock**. La tabla de brecha de esta fase lo listó
igual, por ser visible. **Es la misma falla que produjo `A-03` en la A2.1: tomar la superficie de
una captura en vez de su razonamiento.** Registrado en [ADR-019](decisions.md#adr-019).

**La etapa se reasignó** a la primitiva que sí faltaba y que las capturas sí especifican.

| Criterio | Resultado |
|---|---|
| Primitiva `Ausencia` | ✅ `design-system.md` §3.2 la declaraba faltante desde el primer día |
| `P-09` verificable | ✅ los tratamientos se distinguen **sin color** — test que compara forma, no gris |
| El dock no vuelve | ✅ guard estático sobre `app/`, `components/` y `lib/` |
| `lint` · `build` · `test` | ✅ verde · verde · **379 tests en 17 archivos** |

**Lo que se encontró al migrar.** El booleano `ausente` marcaba tres cosas distintas con el mismo
gris en itálica:

| Fixture | Qué era en realidad |
|---|---|
| *Dominio: no evaluado* | Una ausencia. Correcto |
| *Recorrido: conserva su estado* | Un no-cambio **declarado por el owner**. Ver [ADR-020](decisions.md#adr-020) |
| *Estado: **incumplido*** | **No es una ausencia**: es un dato presente y adverso |

El tercero importa más de lo que parece. Atenuar *"incumplido"* con el gris del vacío es **ablandar
visualmente el único estado que el dominio prohíbe ablandar** — *un `Commitment` `MISSED` nunca se
edita para parecer cumplido*. Ahora lleva chip de urgencia, que es lo que §1.6 le da al dato adverso.

**Dos de los cuatro estados de `P-09` no se dibujaron, y es deliberado:**

- ***No hay dato*** → §1.6 usa em-dash porque en una **tabla** la columna conserva su lugar. Achieve
  no es una tabla (§12.6) y su regla es más fuerte: **omitir, no inventar**; la fila desaparece
  entera. Un em-dash sería copiar la superficie otra vez.
- ***No cargado*** → es la primitiva `Esqueleto`, y bajo **cero red** no ocurre. Dibujar un esqueleto
  para una carga que no existe es prometer lo que no se sostiene.

**Un defecto que los tests unitarios no vieron.** `Fila` dibujaba el chip bien y `FilaDato` llevaba
el `tono`, pero **seis de las siete llamadas no lo pasaban**: *"incumplido"* salía como texto común.
Verde en 378 tests, mal en la pantalla. **Lo encontró abrir el navegador**, que es exactamente para
lo que sirve. Se corrigió y se agregó el guard que faltaba: si una llamada proyecta `ausencia`,
proyecta también `tono` — son las dos mitades de *qué clase de cosa es este valor*.

**Lo que quedó abierto y no se cerró solo:** [ADR-020](decisions.md#adr-020) `PENDING`. Un fixture
declaraba *"tres estados de no-cambio, distinguibles entre sí"* y **dos de los tres se ven igual**.
Distinguirlos exige decidir si un no-cambio declarado es una ausencia o un dato — que es dominio, no
estilo. Se dejó de afirmar la distinción en vez de fabricarla.

---

#### ✅ Etapa A2.5 — Las nueve dentro del shell, y la comparación · COMPLETA · 30 de agosto de 2026

**La mitad de esta etapa ya estaba hecha, y decirlo es parte del trabajo.** La A2.1 recolocó las
nueve superficies dentro del shell cuando construyó el marco. No había nada que mover.

Lo que **no** estaba hecho es lo que la etapa verifica y lo que la fase pedía como criterio de Done:

| Criterio | Resultado |
|---|---|
| Las nueve dentro del shell, sin cambiar su contenido | ✅ **ahora con guard estático**: toda ruta de `app/(student)/` envuelve su superficie en `Shell` con un nodo propio y sin repetir |
| Recorrido de focus group de punta a punta | ✅ sigue verde |
| Auditoría de conformidad §9 | ✅ sin regresiones; `P-09` pasó a `[x]` en la A2.3 |
| **Comparación lado a lado con las capturas** | ✅ **corrida por primera vez** — 1440 × 900, build de producción, las nueve. `design-system-capturas.md` §14 |
| `lint` · `build` · `test` | ✅ verde · verde · **381 tests en 17 archivos** |

**Nueve coincidencias y siete diferencias**, todas escritas en §14 con su evidencia. Las que más
importan:

- **`D-01` — ninguna superficie tiene `<h1>`, y cuatro no tienen encabezado alguno.** Es el hallazgo
  más caro y no es estético: es el ítem *"lector de pantalla"* de §9 bloque 6, que estaba sin correr.
- **`D-02` y `D-04` — falta la subcopy de panel y los vacíos no explican.** Las capturas dicen *qué
  es esto y por qué importa*; Achieve dice el título y la fecha.
- **`D-05` — la columna mide 1120 px y el contenido no la usa.** Sólo `UX08` tiene dos columnas.

**Las siete diferencias son de densidad y estructura, no de lenguaje visual.** Tokens, tipografía,
hairlines, racionamiento de color y shell ya son los de las capturas.

**`D-06` se reportó y no se tocó.** El único badge del menú está en Progreso, y la regla de la
captura 02 dice que el único badge es el del **trabajo pendiente que caduca** — la Bitácora no
caduca. Moverlo exige definir qué es, en Achieve, ese trabajo: es dominio, no estilo. Ver §14.3.

---

#### ✅ Etapa A2.4 — Cabecera de panel · COMPLETA · 30 de agosto de 2026

**La etapa entró con cinco diferencias asignadas y sale con dos cerradas, una andamiada y dos
bloqueadas.** El desglose está abajo; ninguna se escondió.

| Criterio | Resultado |
|---|---|
| `D-01` — toda superficie con `<h1>` | ✅ **cerrada.** Las nueve tienen exactamente uno, con guard estático |
| `D-07` — acciones del objeto arriba a la derecha | ✅ **cerrada.** `AccionDeObjeto` en píldora de borde fino; `CTA-009` se movió en `UX01` |
| `D-02` — subcopy explicativa | 🟡 **hueco listo, texto pendiente.** Ver abajo |
| `D-03` — segmentados · `D-05` — densidad | ⚠️ **bloqueadas por contenido**, no diferidas. §14.5 |
| `lint` · `build` · `test` | ✅ verde · verde · **390 tests en 18 archivos** |

**`D-01` no era estético.** Ninguna de las nueve superficies tenía `<h1>`: para un lector de
pantalla, **ninguna pantalla se llamaba nada**. Era el ítem *"lector de pantalla"* de §9 bloque 6,
que figuraba sin correr.

**Cuatro superficies no tienen título propio**, sólo un eyebrow. `TituloDePanel` **promueve el
eyebrow a `h1`** en vez de inventarles un nombre: les da título de documento **sin agregar una
palabra**. La flecha de retorno queda fuera del nombre accesible — es afordancia visual, no parte
del nombre.

**`D-02` está andamiado y vacío a propósito.** `SUBCOPY_PENDIENTE` en
[`lib/content/es-AR.ts`](../lib/content/es-AR.ts) tiene una entrada por superficie, en `null`, con
qué debería contestar cada una. **Mientras valga `null`, el panel no dibuja subcopy** — omitir, no
inventar. Se completa reemplazando el `null` por la frase: **no hay que tocar ningún componente**.
`npm test` imprime en cada corrida cuáles siguen pendientes, para que la deuda no se pierda por no
verse.

**Un defecto propio, encontrado en una captura de pantalla y no en un test.** Al mover `CTA-009`
arriba dejé el botón viejo al pie: *"Ver progreso"* aparecía **dos veces** en la única superficie
donde el estudiante decide. Es `C-02` roto —un concepto, un lugar—. Corregido, con guard nuevo que
falla si una superficie ofrece la misma acción arriba y abajo.

---

#### ✅ Etapa A2.6 — Subcopy de panel · COMPLETA · 30 de agosto de 2026

**Las nueve frases las escribió el owner**, que es como tenía que pasar: `D-02` afirma qué contiene
cada pantalla y qué se espera del estudiante, y eso es dominio. La capa visual dejó el hueco listo
en la A2.4 y no lo llenó.

| Criterio | Resultado |
|---|---|
| `D-02` — subcopy en las nueve | ✅ **cerrada.** Cada frase sale del JTBD de su spec (`Parte VI`) |
| Cita textual verificada | ✅ un test compara cada cita del comentario contra `product-spec-source.md`. **Siete estaban parafraseadas** y se corrigieron a la cita exacta |
| Título propio en las cuatro que no lo tenían | ✅ `Progreso`, `Activación`, `Modo Examen`, `Paso` |
| `D-06` — el badge del menú | ✅ cerrada por [ADR-021](decisions.md#adr-021) |
| `lint` · `build` · `test` | ✅ verde · verde · **392 tests en 18 archivos** |

**`UX07` tenía dos cosas peleando por el mismo lugar.** Su `h1` era el banner de estado
—*"RECOMENDACIÓN DE ACTIVACIÓN"*, *"FALTAN DATOS PARA ACTIVAR"*…—, así que **la pantalla se llamaba
distinto en cada estado** y un lector de pantalla la anunciaba con otro nombre cada vez. Ahora la
superficie se llama `Activación` y el banner volvió a ser lo que es: estado.

**El test de citas no es decoración.** Si mañana la spec cambia y una cita deja de existir, la
subcopy pasa a afirmar algo que ya nadie respalda — que es justo lo que `C-07` intenta evitar. Lee
las citas del propio comentario, así que no hay una segunda lista que mantener sincronizada.

---

#### ✅ `D-06` — el badge del menú · [ADR-021](decisions.md#adr-021)

**Lo que caduca en Achieve es el `Commitment`**: es el único objeto que el estudiante acordó hacer
*para un momento*, y al pasar ese momento cambia a `MISSED` de forma irreversible. Una `Action` se
reemplaza, una `Evidence` `SUBMITTED` espera a otra persona, la Bitácora sólo acumula.

Así que el badge **no iba en Progreso** — estaba en la única superficie sin nada que vencer.

**Y apareció un segundo problema, peor:** el número era un **literal `1`**, una cifra sin un hecho
detrás. Se retiró. Vuelve cuando haya de dónde contarlo, en `Hoy`. Un badge que aparece en una ruta
y desaparece en las otras tres **miente más que un badge ausente**.

---

#### ✅ `D-04` — los vacíos argumentan · [ADR-022](decisions.md#adr-022) · 30 de agosto de 2026

**`C-04` elevado por el owner**, con una condición que cambia la regla más de lo que parece.

| Cláusula | Cuándo |
|---|---|
| Qué va a aparecer | Siempre |
| Por qué importa | Siempre |
| **Cómo hacer que aparezca** | **Sólo si depende del estudiante** |

**La condición es lo que sostiene la regla.** Cuando el dato no aparece por algo que el estudiante
pueda hacer, el vacío queda en dos cláusulas: **no se inventa una acción falsa para completar el
patrón**. De los tres vacíos de Achieve, sólo `EVIDENCIA.SIN_ADJUNTO` lleva las tres — la próxima
acción la produce el Engine y el recorrido lo arma el servicio propietario.

**Dos precisiones que quedaron en el ADR**, porque cambian de dónde partía la decisión: la cláusula
*"por qué importa"* **es decisión nueva de ese día** —`design-system.md` sólo tenía la primera—, y el
manual normativo ya pedía una tercera que §12.2 no mencionaba (*"y cómo hacer que aparezca"*), que
entró condicional.

**`OVERVIEW.SIN_RECORRIDO` era un rótulo con nada debajo**, el caso más puro del defecto.
**`HOY.VACIO` pasó a decir *"Hoy no hay"*** en vez de *"No hay"*: es una ausencia confirmada por el
ADE, no una carga pendiente, y el copy no debe dejar creer que algo está por llegar.

**Y el vacío dejó de usar itálica.** La itálica atenuada es el tratamiento de `SIN_ASIGNAR`
([ADR-019](decisions.md#adr-019)): un vacío que explica **no es un dato que falta**, y pintarlos
igual rompía la distinción que `P-09` obliga a sostener.

**Dos guards, los dos probados contra su regresión:** ninguno de los tres vacíos puede volver a ser
una sola frase de ausencia, y **sólo lleva instrucción el que el estudiante puede resolver**.

---

### Done cuando… — ✅ los cinco, 30 de agosto de 2026

- [x] Las nueve superficies viven dentro del shell, sin haber cambiado su contenido ni sus estados
      — con guard estático desde la A2.5
- [x] El recorrido del focus group sigue funcionando de punta a punta
- [x] La auditoría de conformidad de [`design-system.md`](design-system.md) §9 sigue en verde —
      **`P-09` pasó a `[x]`** en la A2.3; ningún ítem retrocedió
- [x] Lint, build y tests en verde — **396 tests en 19 archivos**
- [x] **Comparación lado a lado con las capturas**, con las diferencias reportadas y no escondidas
      — §14, **siete diferencias, seis cerradas**, la séptima con su bloqueo escrito

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
| ✅ Backend, auth, persistencia | [ADR-005](decisions.md#adr-005) — **`ACCEPTED` (Bloque A)** 30 ago 2026 | Producto + CTO |
| Pipeline del ADE | [ADR-004](decisions.md#adr-004) | Producto |
| Convergencia con Dashboard_Achieve | [ADR-003](decisions.md#adr-003) | Producto + CTO |
| Privacidad y consentimiento | [ADR-006](decisions.md#adr-006) | Producto + asesoría legal |
| Respuestas `DD1`–`DD10` | [ADR-010](decisions.md#adr-010) | Producto |

**Done cuando:** cada ADR está `ACCEPTED` o explícitamente `DEFERRED` con su fase bloqueada marcada.

### Los cuatro no se deciden en el mismo orden — 30 de agosto de 2026

Al preparar las decisiones apareció que **la secuencia importa más que el conjunto**:

**1. `ADR-006` no bloquea el arranque de B1.** El encabezado de la Fase B1 dice que entra *"desde el
momento en que exista **un solo usuario real**"*, y `B1.6` exige explícitamente datos sintéticos.
`B1.1`–`B1.5` corren enteras sin tocar un dato de una persona.

**2. `ADR-005` no hace falta cerrarlo entero.** Sus seis ítems se separan en un **Bloque A** —tres
ratificaciones de un diseño que ya existe— y un **Bloque B** —tres cosas todavía por diseñar—.
Verificado contra este roadmap: `B1.1`–`B1.5` no tocan Storage de `Evidence` (aparece en `B2.3`) ni
Broadcast, y sólo `B1.6` necesita el mapping de `institutionId`.

**3. `ADR-006` tiene el plazo más largo** porque necesita asesoría legal, y **sus cinco preguntas no
son todas legales**: tres las puede contestar producto hoy.

**Secuencia recomendada, no vinculante:**

| Orden | Qué | Por qué |
|---|---|---|
| 1.º ✅ | Aceptar **`ADR-005` Bloque A**, con Bloque B `DEFERRED` — **hecho el 30 ago 2026** | Desbloqueó `B1.1`–`B1.5` sin comprometer lo no diseñado |
| 2.º ⬅️ | Arrancar **B1 sobre datos sintéticos** | **Es lo que toca ahora.** El trabajo de fundación no espera al abogado |
| 3.º | **`ADR-006`** con asesoría, en paralelo desde ya | Es el de plazo más largo y **debe cerrar antes del primer usuario real** |
| 4.º | `ADR-003` y `ADR-004` | Bloquean B6 y B4: hay tiempo |

> ⚠️ **Lo que esta secuencia no relaja.** `ADR-006` sigue siendo bloqueo absoluto para cualquier dato
> de una persona real. Arrancar B1 antes **no** adelanta ese permiso: lo separa de un trabajo que
> genuinamente no lo necesita.

---

## Fase B1 — Fundación

**Estado:** ✅ **COMPLETA — 6 / 6**, el 30 de agosto de 2026. [ADR-005](decisions.md#adr-005) cerró
el Bloque A y después los ítems 4 y 6, que eran los que faltaban.

⚠️ **Toda la fase corre sobre datos sintéticos.** [ADR-006](decisions.md#adr-006) entra desde el
momento en que exista **un solo usuario real**, y sigue `PENDING`.

**Objetivo.** Backend en capas, base de datos, auth, tenancy y esquema base de la Academic Data Layer,
sin acceso del frontend a tablas de negocio.

| # | Etapa |
|---|---|
| B1.1 | ✅ **COMPLETA** — proyecto Supabase propio, migración de bootstrap y entorno local reproducible |
| B1.2 | ✅ **COMPLETA** — schema de la capa académica ([`data-model.md`](data-model.md) §7), 13 tablas |
| B1.3 | 🟡 **PARCIAL** — auth, `student` y JWT en `/api/*` completos. **El rol institucional no tiene modelo en el doc**: ver abajo |
| B1.4 | ✅ **COMPLETA** — frontera Controller → Service → Repository, con §9 y los cuatro criterios de aislamiento probados |
| B1.5 | ✅ **COMPLETA** — `product_event` y `audit_log`, append-only **probado contra el propio backend** |
| B1.6 | ✅ **COMPLETA** — cliente de autorización CRM v1 con contract tests y datos sintéticos; uso real gateado por ADR-006 |

#### ✅ Etapa B1.1 — COMPLETA · 30 de agosto de 2026

**Proyecto Supabase propio**, decidido por el owner: separado de Dashboard_Achieve. El spec prohíbe
base compartida con el CRM (Parte II §18.1) y **compartir proveedor no relaja esa regla** — es la
pendiente que [ADR-005](decisions.md#adr-005) dejó anotada al ratificar Supabase.

| Criterio | Resultado |
|---|---|
| Proyecto propio, aislado | ✅ `project_id = achieve-platform`, **puertos 54420–54429** para que los dos stacks locales convivan |
| Migración inicial | ✅ `20260830000000_bootstrap.sql` — las convenciones de `data-model.md` §6 como código, **sin tablas de dominio** (eso es B1.2) |
| Entorno reproducible | ✅ **verificado con `db:reset`**: se tira abajo y se reconstruye desde cero, y queda conforme |
| Verificación | ✅ `npm run db:verify` |

**Lo que la migración hace, y por qué no es sólo scaffolding.** `data-model.md` §6 dice *"todas las
tablas quedan con RLS deny-by-default"*. Eso era una afirmación que había que confiar. Ahora
`tablas_sin_rls()` la vuelve **comprobable**, y `db:verify` falla si alguna tabla de `public` se
queda sin RLS. **Probado contra su regresión:** con una tabla sin RLS devuelve 1; al habilitarla,
0.

**Una decisión que conviene mirar:** `updated_at` va en un **trigger**, no en el Repository. No
contradice la regla de ADR-005 de no poner reglas de negocio en la base —esto es plomería de
auditoría, no dominio— y va ahí porque tiene que valer **sin importar qué camino de código
escribió**: en el Repository, un método que se olvide produce un timestamp falso en silencio. Cada
tabla lo engancha explícitamente; no hay magia que lo aplique sola.

**`db:verify` queda fuera de `npm test`.** La suite de 396 corre sin Docker; atarla al stack haría
que todas fallaran en una máquina sin él.

⚠️ **Todo corre sobre datos sintéticos.** [ADR-006](decisions.md#adr-006) sigue `PENDING`.

---

#### ✅ Etapa B1.2 — Capa académica · COMPLETA · 30 de agosto de 2026

Las **13 tablas** de `data-model.md` §7, implementadas **literalmente**: constraints y `CHECK` salen
del documento sin reinterpretarlos.

| Criterio | Resultado |
|---|---|
| 13 tablas de §7 | ✅ |
| RLS deny-by-default | ✅ en las 13, y `tablas_sin_rls()` lo verifica |
| Constraints que rechazan | ✅ **10 invariantes probados** con `npm run db:verify` |
| Reproducible | ✅ `db:reset` reconstruye desde cero y queda conforme |

**Un `CHECK` escrito no es un `CHECK` que funciona**, así que `scripts/db-invariantes.sh` intenta
insertar lo que el spec declara imposible y falla si la base lo acepta: un `topic` que no cuelga de
nada, un tema prerequisito de sí mismo, un `source_type` inventado, un `confidence` fuera de `[0,1]`,
una `modality` que no existe.

Y comprueba lo simétrico, que es donde se cuelan los errores: **`modality='oral'` se acepta** —el
spec dice que se *almacena* aunque quede fuera de P0 (`C01-047`)—, una `assessment` **sin fecha** se
acepta porque una fecha desconocida no se estima, y `rights_status` arranca en **`unknown`** y no en
`allowed`: no se presume permiso sobre material de terceros.

**Dos cosas que la migración agrega y §7 no escribe**, ambas ancladas en §6: el `ENABLE ROW LEVEL
SECURITY` de las 13, y los **índices sobre las claves foráneas** — Postgres no los crea solo, y sin
ellos cada borrado del padre escanea la tabla hija entera.

**Lo que no lleva, y no es olvido:** `updated_at`. En este diseño la capa académica no se edita en
sitio —una corrección crea una fila nueva, ver `class_event_record.supersedes_id`—, así que la
convención de §6 aplica a §8 y §9, que es donde el documento sí lo escribe.

**Un error propio que vale registrar.** El script de invariantes daba los 10 en verde con el schema
roto y luego 3 en rojo con el schema sano: primero grepeaba la palabra `ERROR` en la salida de
`psql` en vez de mirar el código de salida, y después el helper devolvía `0` en caso de éxito
mientras se llamaba `falla`. **Un test que miente es peor que no tenerlo**, y las dos veces lo delató
que el resultado fuera implausible, no que fallara.

---

#### 🟡 Etapa B1.3 — Auth y capa del estudiante · PARCIAL · 30 de agosto de 2026

| Criterio | Resultado |
|---|---|
| Las 5 tablas de §8 | ✅ |
| `student.auth_user_id` ligado al proveedor | ✅ **FK real a `auth.users`**, habilitada por ADR-005 |
| JWT en `/api/*` | ✅ verificado de punta a punta: **401 / 401 / 401 / 200 / 403** |
| RLS deny-by-default | ✅ en las 18 tablas |
| Rol `institution` | 🔴 **no se pudo hacer: no existe el modelo.** Ver abajo |
| `lint` · `build` · `test` | ✅ verde · verde · **400 tests en 20 archivos** |

**Los invariantes que ahora hace cumplir la base, no la prosa.** `topic_progress` guarda cinco
dimensiones con su estado, y hasta hoy nada impedía guardar `domain_state='not_evaluated'` **con un
`0` al lado** — que es literalmente *"sin datos es cero"*, el invariante que `AGENTS.md` §2 marca
como el que más se rompe. Cuatro `CHECK` nuevos lo vuelven imposible, y un quinto exige que **la
confianza lleve su fecha**: sin cuándo no es confianza, es un número.

**Un defecto encontrado al probar, no al escribir.** `/api/sesion` devolvía **500** con *"permission
denied for table student"*: las migraciones no daban `GRANT` a `service_role`. Se declara explícito
en vez de heredarlo del proveedor —un privilegio que nadie revisó falla el día que cambia el
default— y quedó **simétricamente verificable**: `tablas_sin_acceso_de_servicio()` comprueba que el
backend **puede** entrar, y `tablas_expuestas_al_cliente()` que `anon`/`authenticated` **no**.
Sin la segunda, un `GRANT` de más pasa inadvertido.

**Una corrección de capa.** `tokenDelHeader` estaba en el Service, que es el lugar equivocado: §3.2
dice que un Service *"no lee headers"*. Se movió a `lib/server/http.ts`. El síntoma fue que el test
no podía importarlo por `server-only`, pero el problema no era el test.

#### 🔴 El rol institucional no tiene modelo — hallazgo de la B1.3

`data-model.md` **no define ninguna tabla de usuario institucional**: no hay `operator`, no hay
`institution_user`, no hay columna de rol. El único rastro es `owner_operator_id UUID NOT NULL` en
§10, **sin `REFERENCES`**: un UUID que no apunta a ninguna tabla.

**No se inventó.** Crear una tabla de identidad institucional sería definir quién puede ver datos de
un estudiante, que es exactamente lo que `C01-030` (autorización, permisos y privacidad
institucional) tiene `OPEN` y lo que [ADR-006](decisions.md#adr-006) gatea.

Así que la B1.3 entrega **el rol `student` completo** y deja el institucional registrado. No bloquea
`B1.4` ni `B1.5`; sí bloquea cualquier endpoint institucional, y hay que cerrarlo antes de la
Fase B6, que [ADR-012](decisions.md#adr-012) ya había diferido.

---

#### ✅ Etapa B1.4 — La frontera, y §9 · COMPLETA · 30 de agosto de 2026

Las **7 tablas** de `data-model.md` §9 —el loop diario— y la frontera de tres capas funcionando.

| Criterio de Done de la Fase B1 | Resultado |
|---|---|
| Un tenant no puede leer datos de otro | ✅ el `institution_id` va **en el `WHERE`**, no se compara después de leer |
| Las transiciones prohibidas fallan **incluso bajo concurrencia** | ✅ compare-and-swap: el estado esperado viaja en el `WHERE` |
| Ningún código cliente accede a tablas de negocio | ✅ **guard estático**, `tests/frontera-backend.test.ts` |
| `lint` · `build` · `test` | ✅ verde · verde · **417 tests en 22 archivos** |

**La máquina de estados no se reescribió.** El Service ejecuta la misma
`commitmentTransitions` de `lib/domain/` que el Track A usa para proyectar — el módulo ya lo
anticipaba: *"el Track B la ejecuta en Service"*. Dos tablas de transiciones serían dos verdades
sobre el mismo dominio, y divergirían. Un test recorre **todos los pares prohibidos** de la tabla y
verifica que ninguno llega a escribir.

**La concurrencia se prueba contra Postgres, no contra un mock.** Dos transiciones válidas desde
`CONFIRMED` compiten; **gana una sola** porque la segunda no encuentra el estado esperado. Simular
esa carrera con un doble sólo probaría que el doble la simula.

**Un `MISSED` no vuelve.** Verificado en las dos capas: la máquina no tiene la arista, y el
compare-and-swap tampoco encuentra el estado. El incumplimiento no se borra ni por código ni por
carrera.

**Dos defectos propios que cazó el guard nuevo, no una relectura:**

1. **El Service de sesión importaba el cliente de Supabase.** §3.2 dice que un Service *"no conoce
   SQL"*, y conocer el cliente ya es conocerlo. Se invirtió la dependencia.
2. **El Controller importaba Repositories**, o sea conocía dos capas abajo. Apareció
   `lib/server/composicion.ts` como **composition root**: el único lugar donde las implementaciones
   concretas se atan.

**Y un tercero en el propio guard.** `sinComentarios` sólo borraba comentarios a principio de línea,
así que un `// .from("x")` al final de una línea seguía contando como violación. Lo encontró su
auto-prueba. **Un guard con falsos positivos enseña a no documentar la regla que vigila.**

---

#### ✅ Etapa B1.5 — Eventos y auditoría · COMPLETA · 30 de agosto de 2026

| Criterio | Resultado |
|---|---|
| `product_event` registra actor, timestamp, institución, objeto y causa | ✅ los cinco, en columnas propias |
| Append-only (I12) | ✅ **revocado también a `service_role`**, y probado con un `UPDATE` real |
| `lint` · `build` · `test` | ✅ verde · verde · **421 tests en 22 archivos** |

**Append-only que aguanta al propio backend.** I12 dice *"revocar `UPDATE`/`DELETE`"*, y se revocó
**incluyendo `service_role`** — el rol con el que entra el backend. Una regla que sólo vale para
roles que nadie usa no es una regla: el riesgo real no es un cliente anónimo que ya no llega a la
tabla, es un `UPDATE` del propio backend. El test lo comprueba **ejecutando** el `UPDATE`, no
leyendo el catálogo de privilegios, y verifica además que la revocación **no se llevó puesto el
resto del schema**.

**El evento se publica después de que la escritura ganó**, nunca antes: un evento de algo que perdió
la carrera sería un hecho que no ocurrió. Y el nombre es semántico —`CommitmentDue`, no
`commitment_update`—: `product_event` es el registro de lo que pasó en el producto, no un diario de
escrituras.

#### Dónde choca esto con [ADR-006](decisions.md#adr-006), y qué se hizo

Un log append-only y un derecho de supresión empujan en direcciones opuestas. **No se resolvió, y
tampoco se cerró ninguna de las dos salidas:**

- **El hecho y el contenido viven en columnas distintas.** `event_name`, `actor_id`, `subject_*` y
  `occurred_at` son el hecho; `payload`, `before_value` y `after_value` son lo único que podría
  contener dato personal. Vaciar esas tres conservando la fila es una operación de una línea el día
  que asesoría lo autorice.
- **No se construyó ningún mecanismo de borrado.** Inventarlo hoy sería adelantar la decisión — y
  además el propio append-only lo impide: haría falta levantar la revocación, que es fricción
  deliberada.

Un test verifica que **el hecho no viaja dentro del `payload`**: si empezara a viajar ahí, la
separación existiría en el schema y no en la práctica.

---

#### ✅ Etapa B1.6 — Autorización de padrón · COMPLETA · 30 de agosto de 2026

**Cierra la Fase B1.** Habilitada por ADR-005 ítem 6, cerrado por el owner: **tabla de
correspondencia, con alta manual.**

| Criterio de Done | Resultado |
|---|---|
| El contrato cubre `authorized:true` | ✅ |
| **Los tres rechazos** — `not_in_roster`, `institution_terminated`, `ambiguous` | ✅ y **viajan sin reinterpretarse** |
| `400` y `401` | ✅ separados: uno es el body, el otro el secreto. Ninguno es *"tu institución no te habilitó"* |
| Reintento de red / `5xx` | ✅ misma clase, reintentable |
| Datos sintéticos | ✅ ninguna llamada sale a un CRM real |
| `lint` · `build` · `test` | ✅ verde · verde · **450 tests en 24 archivos**, **63 verificaciones** contra Postgres |

**La identidad no se adopta, se traduce.** El `institutionId` del CRM es una identidad externa;
`institution_crm_ref` la mapea a la de Plataforma. Lo decidió un precedente que ya estaba escrito:
`data-model.md` §6.1 dice que el `studentId` del CRM *"nunca reemplaza `student.id`"*. Y el propio
contrato: *"cada uno tiene su propio proyecto Supabase… **nadie toca la base del otro**"*.

**Una institución desconocida no se crea sola.** Si el CRM autoriza a alguien de una institución que
Plataforma no tiene mapeada, **se rechaza**. Dar de alta una institución es firmar un convenio, no un
efecto secundario de un login — y por eso el repositorio **no tiene método de alta**: un `crear()`
ahí sería la puerta por la que la institución termina apareciendo sola.

**Una caída de red no es un "no".** Se distingue `INTEGRACION_CAIDA` de `RECHAZADO`: decirle al
estudiante que su institución no lo habilitó cuando se cayó una conexión es mentirle sobre su
situación, y además le esconde que hay que reintentar.

**Dos cosas de herramienta que hubo que resolver bien, no rápido:**

1. **`server-only` lanza bajo `jsdom`**, así que los contract tests no podían cargar el cliente. Se
   stubeó **sólo en tests**; quitarlo del código de producción habría cambiado el código para
   acomodar la herramienta y perdido la garantía que da en el build.
2. **El guard de *cero datos reales* prohibía todo email**, y el contrato tiene un campo `email`. Se
   acotó a **los dominios que RFC 2606 reserva** —inasignables por definición—, con auto-pruebas de
   que `ana@uni.edu.ar` y `x@example.com.ar` siguen siendo delito.

---

**Done cuando:** un test de aislamiento demuestra que un tenant **no puede** leer datos de otro; las
transiciones prohibidas fallan en Service incluso bajo concurrencia; ningún código cliente accede a
tablas de negocio; `product_event` registra actor, timestamp, institución, objeto y causa; y el
contrato CRM cubre `authorized:true`, los tres rechazos, `400`, `401` y reintento de red/5xx.

**Contratos que hay que cerrar antes:** `C01-001`, `C01-002`, `C01-003`, `C01-030`; y para persistir
la autorización CRM, el mapping institucional de `C01-039`.

---

## Fase B2 — Dominio de ejecución · 🟡 EN CURSO

**Estado:** 🟡 **2 / 5.** `B1.1`–`B1.5` la desbloquearon; **`B1.6` no la bloquea** —es el cliente de
autorización CRM, no dominio—. Corre sobre datos sintéticos: [ADR-006](decisions.md#adr-006) sigue
`PENDING`.

**Objetivo.** El loop diario completo con persistencia real: `Action`, `Commitment`, `Evidence`,
`Reflection`.

| # | Etapa |
|---|---|
| B2.1 | ✅ **COMPLETA** — `Action` + `ActionRecommendation` + máquina de estados |
| B2.2 | ✅ **COMPLETA** — `Commitment` + renegociación + rescate + idempotencia |
| B2.3 | `Evidence` + resubmission + storage + revisión real |
| B2.4 | `Reflection` configurable `OPTIONAL`/`REQUIRED` |
| B2.5 | Reemplazo de `lib/fixtures/` por llamadas reales — **sin tocar las pantallas** |

**Done cuando:** los 12 invariantes de [`data-model.md`](data-model.md) §11 tienen test; el mismo
request enviado dos veces produce una sola entidad; `UNDER_REVIEW` es imposible sin instancia real.

**Contratos a cerrar:** `C01-007`…`C01-016`, `C01-051`.

#### ✅ Etapa B2.2 — Renegociación y rescate · COMPLETA · 30 de agosto de 2026

Los tres invariantes más delicados del producto, probados contra Postgres.

| Invariante | Resultado |
|---|---|
| `I2` — renegociar **crea una fila nueva**; el original queda `RENEGOTIATED` | ✅ y **la fecha y los minutos del original no se tocan** |
| `I3` — un rescate sólo apunta a un `MISSED` | ✅ y **el incumplido sigue `MISSED`** |
| `I8` — la misma clave no crea dos entidades | ✅ |
| `lint` · `build` · `test` | ✅ verde · verde · **434 tests en 23 archivos**, **54 verificaciones** contra Postgres |

**La tensión que había que resolver antes de escribir nada.** `data-model.md` §11 pide
**transacción** para `I2` e `I3`; ADR-005 prohíbe lógica de negocio en la base. La salida está en la
propia separación:

| Qué | Dónde | Por qué |
|---|---|---|
| **Qué estados se pueden renegociar** | Service, TypeScript, `commitmentTransitions` | Es la regla |
| **Que las dos escrituras ocurran juntas** | Función de base | Es atomicidad, que §6 asigna explícitamente a la base |
| El `WHERE state = …` de adentro | Función de base | Es el mismo compare-and-swap del Repository: control de concurrencia, no regla |

**La prueba de que la regla no quedó en la base:** si mañana `commitmentTransitions` admite
renegociar desde un estado nuevo, **las funciones SQL no cambian**.

**`STARTED` no se renegocia**, y lo decide el Service: renegociar es válido sólo **antes** del
vencimiento. El test verifica que ni siquiera llega a la base.

**Y lo que más importa:** rescatar un `MISSED` crea otro objeto y **no toca el incumplimiento**.
Verificado en las dos capas. Es *No Cortar* — el incumplido sigue incumplido para siempre, y el
rescate lo apunta sin borrarlo.

**Renegociar dos veces en carrera produce un solo sucesor.** Sin el compare-and-swap dentro de la
transacción, dos requests concurrentes dejan al estudiante con dos compromisos nuevos para el mismo
original.

---

#### ✅ Etapa B2.1 — `Action` · COMPLETA · 30 de agosto de 2026

| Criterio | Resultado |
|---|---|
| Máquina de estados de `Action` | ✅ la misma `actionTransitions` de `lib/domain/`; un test recorre **todos** los pares prohibidos |
| **Aceptar una Action NO crea un Commitment** | ✅ con test que verifica que no aparece nada de `commitment` |
| `I6` — una sola recomendación primaria | ✅ probado contra la base |
| `lint` · `build` · `test` | ✅ verde · verde · **427 tests en 24 archivos**, y **46 verificaciones** contra Postgres |

**La secuencia de transición se extrajo en vez de duplicarse.** `Action` y `Commitment` hacen
exactamente lo mismo —leer con scoping, validar contra la máquina, escribir con compare-and-swap,
publicar el hecho— y sólo difieren en la tabla y en qué columnas extra tocan. Dos copias divergirían
**en el orden**, que es donde están los errores: publicar antes de escribir, o escribir sin comparar.
Vive en `lib/server/servicios/transiciones.ts`; el refactor pasó los tests de `Commitment` sin
tocarlos.

**`BLOCKED` explica, o no ocurre.** Bloquear sin razón se rechaza antes de tocar la base: `P-01` pide
que la interfaz explique la regla, y un estado bloqueado sin motivo deja al estudiante con una
pantalla y nada que hacer. **Y salir de `BLOCKED` limpia la razón** — conservarla haría que `UX03`
mostrara un bloqueo que ya no existe.

**Hasta dónde llega `I6`, dicho en el test.** El índice parcial garantiza *"como máximo una primaria
por `action_id`"*, no *"una por contexto"*: eso necesita una identidad canónica de contexto que el
spec todavía no define. El propio `data-model.md` §11 lo aclara en su fila, y el test no promete más
que eso.

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
| Fase 0 — Cerrar Track A | ✅ **COMPLETA** — 8/8 etapas y el test de 10 segundos corrido | 8 / 8 |
| Fase A2 — Shell de aplicación | ✅ **5 / 5 etapas completas** | 5 / 5 |
| Fase A1 — Operador e Institución | ⏸️ DIFERIDA al Track B | — |
| Fase B0 — Cerrar decisiones | 🟡 EN CURSO — `ADR-005` aceptado (Bloque A) | 1 / 5 |
| Fase B1 — Fundación | ✅ **COMPLETA** | 6 / 6 |
| Fase B2 — Dominio de ejecución | 🔒 BLOQUEADA | — |
| Fase B3 — Progreso y eventos | 🔒 BLOQUEADA | — |
| Fase B4 — ADE v1 | 🔒 BLOQUEADA | — |
| Fase B5 — Modo Examen real | 🔒 BLOQUEADA | — |
| Fase B6 — Risk e Intervención | 🔒 BLOQUEADA | — |
| Fase B7 — Privacidad | 🔒 BLOQUEADA | — |
| Fase B8 — Piloto | 🔒 BLOQUEADA | — |

**Estado de los 51 contratos `C01`: 51 `OPEN`, 0 `CLOSED`.** Ver
[`pending-decisions-annex.md`](pending-decisions-annex.md).

### 3.1 Deuda técnica abierta — `npm audit`

**Re-verificado el 30 de agosto de 2026: 3 vulnerabilidades `high`.**

| Paquete | Por qué está |
|---|---|
| `next` (`16.2.6`) | La versión fijada cae dentro del rango afectado |
| `postcss` | Transitiva de `next` |
| `sharp` | CVEs heredadas de `libvips` (`GHSA-f88m-g3jw-g9cj`) |

**No se arreglan solas.** `npm audit fix --force` instala `next@16.3.3`, **fuera del rango declarado**
en `package.json`: subir la versión mayor del framework es una decisión de
[ADR-008](decisions.md#adr-008), no de una etapa de UI.

**Lo incómodo:** la Etapa 0.1 registró esto como *"deuda a evaluar **antes de la Fase 0 Done**"*, y
**la Fase 0 se cerró 8/8 sin evaluarla**. El gate estaba escrito y no se cumplió. Queda acá visible
en vez de enterrado en la narrativa de una etapa vieja.

**Qué mitiga el riesgo hoy, y qué no.** El Track A no tiene red, ni persistencia, ni datos reales, ni
se despliega: el árbol vulnerable no está expuesto a nadie. **Eso deja de valer en cuanto el Track B
arranque**, así que esto es un bloqueante real de la Fase B1 y no una nota al pie.
