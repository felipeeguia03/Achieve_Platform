# CLAUDE.md

## ⚠️ Leé [`AGENTS.md`](AGENTS.md) primero

Este repositorio tiene reglas canónicas para agentes de IA en **[`AGENTS.md`](AGENTS.md)**. Son
normativas, no orientativas. Este archivo es solo una referencia rápida.

---

## Qué es esto

**Achieve** — acompañante académico para estudiantes universitarios. Cada día le dice al estudiante
qué acción concreta hacer para no perder el ritmo de sus materias, con una persona real como
supervisor y fallback.

Se trabaja con **Spec Driven Development**: la fuente de verdad son los markdown de `docs/`, y el
código sigue a la documentación. Si discrepan, **el código es el defectuoso**.

---

## Las seis reglas

1. **No inventes reglas de negocio.** Hay 42 decisiones abiertas; las 8 psicopedagógicas
   ([ADR-025](docs/decisions.md#adr-025)) y la obligatoriedad de `Reflection`
   ([ADR-026](docs/decisions.md#adr-026)) están respondidas, pero **con residuos**. Si falta una
   regla, registrala como ADR `PENDING` y **preguntá**.
2. **No resuelvas una decisión `PENDING`.** La cierra una persona.
3. **Datos reales: bloqueo absoluto** hasta que [ADR-006](docs/decisions.md#adr-006) tenga
   **dictamen legal**. Sus decisiones de producto ya están tomadas (1 sep 2026), pero en estado
   `PROVISIONAL — LEGAL CONFIRMATION REQUIRED`: **eso no levanta el gate.** El backend se construye
   sobre datos sintéticos, sin excepciones ni "una prueba chica".
4. **Una etapa por vez, completa.** Readiness → decisiones aprobadas → implementar → verificar →
   commit → docs actualizados.
5. **Antes de tocar UI, abrí las capturas de `docs/diseño/`.** Achieve es desktop-first y su
   lenguaje visual sale de ahí ([ADR-018](docs/decisions.md#adr-018)). **La carpeta no está
   versionada:** si la encontrás vacía, **decilo y pará** — no improvises un diseño.
6. **No reescribas `components/screens/*`, `app/globals.css` ni `components/ui/*`** salvo que el
   roadmap lo pida.

---

## Los invariantes que más se rompen

> Preparar contenido no es enviarlo. Enviar no es suficiencia. Suficiencia no es validación.
> Validación no es dominio.

- Aceptar una `Action` **no** crea un `Commitment`.
- `Evidence` `SUBMITTED` **no** implica suficiencia ni revisión.
- `UNDER_REVIEW` **exige una revisión real creada**, no un método configurado.
- `VALIDATED` **no** produce `ProgressUpdated`.
- **Un `Commitment` `MISSED` nunca se edita para parecer cumplido.** El rescate es otro objeto.
- **Sin datos no es cero.** "No evaluado" ≠ "bajo" ≠ "no disponible" ≠ `0`.
- **La UI proyecta, nunca decide.** No rankea ni genera Actions.
- **Omitir, no inventar.** Si falta un contrato, la línea desaparece.

Lista completa: [`AGENTS.md`](AGENTS.md) §2.

---

## Dónde está cada cosa

| Necesito… | Voy a |
|---|---|
| Entender el dominio, un estado o el copy permitido | [`docs/product.md`](docs/product.md) |
| Saber qué está bloqueado y por qué | [`docs/decisions.md`](docs/decisions.md) |
| Saber qué toca hacer ahora | [`docs/roadmap.md`](docs/roadmap.md) |
| Tocar UI | **`docs/diseño/*.png` primero**, después [`docs/design-system.md`](docs/design-system.md) |
| Ver qué patrón visual usar | [`docs/design-system-capturas.md`](docs/design-system-capturas.md) |
| Tocar datos | [`docs/data-model.md`](docs/data-model.md) |
| Tocar estructura | [`docs/architecture.md`](docs/architecture.md) |
| Aplicar un principio del manual de diseño | [`docs/domain-translation-dd1-dd10.md`](docs/domain-translation-dd1-dd10.md) |
| Saber si algo está decidido | [`docs/pending-decisions-annex.md`](docs/pending-decisions-annex.md) |
| Escribir contenido del protocolo de examen | [`docs/human-p0-source.md`](docs/human-p0-source.md) — **la voz de la psicopedagoga, literal** |
| Tocar registro, elegibilidad o integración CRM | [`docs/platform-integration-contract.md`](docs/platform-integration-contract.md) — §2.1 tiene la propuesta de contrato v2 |
| Preparar la consulta legal | [`docs/legal-package.md`](docs/legal-package.md) |
| Cerrar los residuos psicopedagógicos | [`docs/agenda-cierre-psicopedagoga.md`](docs/agenda-cierre-psicopedagoga.md) |
| Resolver las vulnerabilidades `high` | [`docs/brief-adr-008-seguridad.md`](docs/brief-adr-008-seguridad.md) |
| El spec original completo | `docs/product-spec-source.md` — **no se edita** |

---

## Estado actual

**Fase 0 — Cerrar el Track A.** ✅ **COMPLETA.** Las nueve superficies existen, todos los estados
críticos son alcanzables, el Golden Path se recorre por clic y **el test de comprensión de 10
segundos se corrió con resultado PASS** (reportado por el owner, 30 ago 2026).

**Fase B0 — Cerrar decisiones.** 🟡 **3 / 5.** [ADR-004](docs/decisions.md#adr-004),
[ADR-005](docs/decisions.md#adr-005) y [ADR-010](docs/decisions.md#adr-010) están `ACCEPTED`;
[ADR-003](docs/decisions.md#adr-003) y [ADR-006](docs/decisions.md#adr-006) siguen `PENDING`.

**Fase B1 — Fundación.** ✅ **COMPLETA, 6 / 6.** Supabase local reproducible, capa académica y del
estudiante, la frontera Controller → Service → Repository, `product_event`/`audit_log` append-only y
el cliente de autorización del CRM.

**Fase B2 — Dominio de ejecución.** ✅ **COMPLETA, 6 / 6** — 1 de septiembre de 2026. `Action`,
`Commitment`, `Evidence` y `Reflection`, esta última cuando el owner cerró `C01-051`
([ADR-026](docs/decisions.md#adr-026)): el requisito vive en la Action, **congelado al crearla**, y
es ternario —`NO_CONFIGURADA` no ofrece nada, `OPTIONAL` ofrece y no bloquea, `REQUIRED` bloquea sólo
el submit dependiente—. **La Etapa B2.6 cerró:** `UX01`–`UX06` leen de Postgres con sesión real, cada una con una
función de lectura propia, y ninguna cae al fixture en silencio. `UX07`–`UX09` se conectaron en la
Fase B5.

**Fase B5 — Modo Examen real.** ✅ **COMPLETA, 5 / 5** — 1 de septiembre de 2026. **Las nueve
superficies del estudiante leen de Postgres**; `UX07`–`UX09` eran las tres últimas que proyectaban
fixtures. Los tres requisitos de schema se cerraron **antes** de la primera migración, porque una
migración aplicada no se edita:

- [ADR-028](docs/decisions.md#adr-028) — **la completion de un paso es un hecho, no un estado.** Se
  cayó el `UNIQUE`; cada vuelta es una fila con su `occurrence` y **su tema**. La garantía vieja no se
  perdió: se volvió configurable en `protocol_step.is_reentrant`.
- [ADR-029](docs/decisions.md#adr-029) — **la pauta de la cátedra tiene entidad propia**, con
  Provenance completa. Cargada por el estudiante entra `student`/`unverified` y **no se eleva**.
- [ADR-030](docs/decisions.md#adr-030) — **el protocolo corre con contenido provisional y lo dice en
  sus columnas.** El texto de los 20 pasos `PE-PSY` **nunca se transcribió al repositorio**: corre
  `EP-SPEC v0.1`, y la pantalla lo declara.

⚠️ **Antes de tocar Modo Examen:** readiness **no se calcula**. La tabla existe (ADR-011) y nadie la
escribe: los umbrales son `C01-029`. Sin card, sin score, sin porcentaje. Y **no se muestra "paso 5 de
12"** — desde `HUMAN-P0-01 v1.0` además sería falso.

**Fase B4 — ADE v1 y el reloj.** ✅ **COMPLETA** — 1 de septiembre de 2026. El **validador
determinista** rechaza toda recomendación que afirme dominio, progreso o readiness inexistente
—sus diez reglas salen de `product.md` §13 y **cada una cita su fila**—, y con él la rama `ERROR`
dejó de ser teórica. El **reloj corre** por `POST /api/reloj` con secreto de servicio comparado en
tiempo constante; `npm run reloj -- <institucion>` hace lo mismo a mano.

⚠️ **Antes de tocar el ADE:** lo que el motor escriba pasa por
`lib/domain/validador-de-recomendacion.ts` **antes de materializar**. Lo que no se puede mostrar no
se persiste.

**Fase B3 — Progreso, Bitácora y eventos.** ✅ **COMPLETA, 3 / 3** — 1 de septiembre de 2026.

- **El resultado de progreso se escribe** con sus invariantes: `I10` en el Service y en la base, `I8`
  con el duplicado declarado, y todo en una transacción con `topic_progress`.
- **El Product Event Model está declarado** en `lib/domain/product-events.ts`: los 23 eventos P0 del
  spec §16 con su uso textual, más 18 extensiones que el backend emite y el P0 no lista. De los 23 se
  emiten 9. **Antes de agregar un evento nuevo, declaralo ahí:** hay guard en las dos direcciones.
- **Una sola fuente histórica.** La Bitácora de `UX06` y la Actividad reciente de `UX02` salen de
  `hechos_de_cursada()` y comparten la traducción: `VI.6` §8.3 dice que no existe una segunda, y hay
  guard de las dos cosas.

Con una parte del objetivo **explícitamente no hecha**: mostrar las cinco dimensiones con sus valores
es `C01-019`, gate `H`, y lo responde una persona.

⚠️ **El Service recibe el resultado; no decide que hubo progreso.** `C01-018` —quién lo emite y con
qué causalidad— sigue `OPEN`. **Ninguna ruta de `Evidence` escribe progreso**, y hay un guard
estático que cubre los cuatro caminos, la maquinaria de transiciones y los triggers del schema:
`VALIDATED` no produce `ProgressUpdated`, y es el error más barato de cometer.

✅ **Resuelta por [ADR-027](docs/decisions.md#adr-027):** los ocho eventos que `product.md` §11
declaraba inexistentes **entraron al modelo** como nivel `TRANSICION`. El catálogo clasifica en
`NEGOCIO` · `TRANSICION` · `TELEMETRIA`, y los nombres históricos no se cambian: `product_event` es
append-only.

**➡️ Lo que sigue, tras las decisiones del 1 de septiembre.** El owner cerró
[ADR-011](docs/decisions.md#adr-011), [ADR-003](docs/decisions.md#adr-003) y
[ADR-027](docs/decisions.md#adr-027), y dejó [ADR-006](docs/decisions.md#adr-006) en `PROVISIONAL`.
Con eso quedó **un frente con trabajo real**, y dos que se cerraron el mismo día:

- ~~Fase B4~~ ✅ **COMPLETA** el 1 de septiembre: el **validador determinista** —que el Done exigía
  desde el primer día y no existía— y **el reloj corriendo** por `POST /api/reloj` con secreto de
  servicio. Verificado de punta a punta: un `CONFIRMED` vencido pasa a `DUE`, después a `MISSED`, y
  la tercera corrida converge.
- ~~Fase B5~~ ✅ **COMPLETA** el 1 de septiembre: la capa de examen, el protocolo como configuración
  versionada y las tres superficies conectadas. **La que queda es la B6.**
- **Fase B6 · Risk e Intervención** — ADR-003 repartió: Achieve es canónico, Dashboard consume. **Es
  la fase grande que queda.**

Lo que **no** se puede hacer sigue siendo lo mismo: tocar un dato real. El mapa de bloqueos del
`roadmap.md` ahora dice **quién** cierra cada cosa.

**Trabajo adelantado.** B2b va **1 / 3** con la ingesta asistida del ADL. En B4 ya existen el ADE
v1 determinista, el reloj del lifecycle y la materialización transaccional de recomendaciones.

✅ **Las 8 decisiones psicopedagógicas están respondidas** (31 ago 2026,
[ADR-025](docs/decisions.md#adr-025)), y sus tres consecuencias de schema se cerraron con la Fase B5.

⚠️ **Lo que ADR-025 desbloqueó fue el criterio, no el texto.** El contenido de los 20 pasos
`PE-PSY` **no está en el repositorio**: vive en el PDF del cuestionario. Escribirlo desde los 12
`EP-01…EP-12` del spec sería inventar criterio pedagógico. Hasta que se transcriba corre
`EP-SPEC v0.1` rotulado como provisional ([ADR-030](docs/decisions.md#adr-030)), y cargar los 20 es
un `INSERT`, no una migración.

⚠️ **Todo el Track B corre sobre datos sintéticos.** [ADR-006](docs/decisions.md#adr-006) sigue
`PENDING` y es bloqueo absoluto desde el primer usuario real.

**Verificación de base:** `npm run db:verify` — **165 comprobaciones** contra Postgres que `npm test`
no puede hacer porque necesitan Docker. Las dos suites son distintas a propósito.

**El Done de una fase se audita, no se declara.** `tests/invariantes.test.ts` verifica el criterio de
cierre de la B2 —los 12 invariantes de `data-model.md` §11— contra el propio documento. **Los doce
tienen test** desde que la B5 migró `exam_preparation`: `I7` era el único pendiente, y el guard rompió
solo el día que la migración entró, que es para lo que estaba escrito.

La frontera ya existe: `lib/domain/` (puro) → `lib/navigation/` (grafo + 19 CTAs) →
`lib/fixtures/` (catálogo) → `app/(student)/` proyecta → `components/screens/` recibe props tipadas.
**Ninguna pantalla importa un fixture** y **`lib/navigation/` no importa `lib/fixtures/`**; hay tests
estáticos que lo verifican.

✅ **El recorrido del focus group es recorrible extremo a extremo, y ahora entero por clic.**
Conserva **una** costura declarada: `UX05` cruza el nodo `ejecución`, que no tiene pantalla. La de
`UX07` se cerró con `CTA-019` ([ADR-016](docs/decisions.md#adr-016)).

- **Track A** (clickeable, fixtures, sin backend): **sin bloqueos.** Cerrar la Fase 0 cierra el
  track — Operador e Institución se difirieron ([ADR-012](docs/decisions.md#adr-012)).
- **Track B** (backend persistente): B1 a B5 completas sobre datos sintéticos. Todo lo que toque un
  dato real sigue bloqueado por [ADR-006](docs/decisions.md#adr-006).

**Stack:** Next.js 16 · React 19 · Tailwind v4 CSS-first · shadcn vendorizado · Vitest.

⚠️ **`npm audit`: 3 `high` abiertas** (`next`, `postcss`, `sharp`). La Etapa 0.1 las registró como
deuda a evaluar **antes** del Done de la Fase 0 y **la fase se cerró sin evaluarlas**. Hoy no
exponen datos reales porque el entorno actual es sintético y no está desplegado, pero deben
resolverse antes de producción o de incorporar una sola persona real. Arreglarlas cambia la versión
de Next y debe registrarse bajo [ADR-008](docs/decisions.md#adr-008). Ver `roadmap.md` §3.1.

Superficies: `UX01`–`UX09`. **Las nueve existen** como componente real con ruta propia bajo
`app/(student)/`. **No existe `UX10`.** Las 19 CTAs son alcanzables y todos sus destinos tienen
pantalla.

El registro canónico tiene **19 CTAs**: `CTA-019` (`UX02 → UX07`) se agregó el 1 de septiembre de
2026 por [ADR-016](docs/decisions.md#adr-016). Es la única fila que no transcribe la tabla del spec
—es una corrección aprobada— y hay un test que exige que toda CTA fuera del spec tenga un ADR
`ACCEPTED` detrás.

Para ver cualquier estado crítico sin panel de debug: `?escenario=<ID>` en **cualquiera** de las
nueve rutas.

El recorrido de focus group vive en `lib/navigation/focus-group.ts`, **aparte del registro
canónico**: es el guion de una sesión, no un contrato. Queda **una** costura, dicha de frente:
`UX05` se alcanza cruzando `ejecución`, que no tiene pantalla. La otra se cerró — `UX07` ya se
alcanza por clic con `CTA-019` ([ADR-016](docs/decisions.md#adr-016)).

---

## Reglas del Track A

Cero red · cero persistencia · cero datos reales · **desktop-first** (360 px es el piso móvil,
[ADR-014](docs/decisions.md#adr-014)) · una sola CTA primaria.

---

## Tono

**Voseo rioplatense, sin excepciones.** *"Entregá"*, *"Subí"*, *"Comprometerme"*.
