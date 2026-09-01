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
3. **Datos reales: bloqueo absoluto** hasta que [ADR-006](docs/decisions.md#adr-006) esté resuelto.
   **Que ADR-005 esté aceptado no cambia esto:** el backend se construye sobre datos sintéticos.
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
| Tocar registro, elegibilidad o integración CRM | [`docs/platform-integration-contract.md`](docs/platform-integration-contract.md) |
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
función de lectura propia, y ninguna cae al fixture en silencio. `UX07`–`UX09` esperan a la Fase B5
porque no hay tablas de examen.

⚠️ **`progress_entry` existe pero nadie la escribe.** La B2.6 la migró —`data-model.md` §10 ya la
declaraba— para que `UX06` pudiera proyectar un resultado de progreso. El `ProgressUpdated`
productivo es la Fase B3 (`C01-018`), y con la tabla vacía la pantalla dice *"todavía no hay un
cambio de progreso confirmado"*, que es lo correcto.

**Trabajo adelantado.** B2b va **1 / 3** con la ingesta asistida del ADL. En B4 ya existen el ADE
v1 determinista, el reloj del lifecycle y la materialización transaccional de recomendaciones.

✅ **Las 8 decisiones psicopedagógicas están respondidas** (31 ago 2026,
[ADR-025](docs/decisions.md#adr-025)). [ADR-007](docs/decisions.md#adr-007) queda cerrado y **el
contenido de la Fase B5 se desbloquea**; su *readiness* no
([ADR-011](docs/decisions.md#adr-011), estructural). Antes de escribir la primera migración de examen
hay **tres requisitos de schema nuevos**: el tramo 9–18 del protocolo es **reentrante** y hoy un paso
se completa una sola vez, la **pauta de la cátedra** no tiene dónde guardarse, y el **núcleo de 24 h
tiene siete componentes**. Ver `roadmap.md` → Fase B5.

⚠️ **Todo el Track B corre sobre datos sintéticos.** [ADR-006](docs/decisions.md#adr-006) sigue
`PENDING` y es bloqueo absoluto desde el primer usuario real.

**Verificación de base:** `npm run db:verify` — **120 comprobaciones** contra Postgres que `npm test`
no puede hacer porque necesitan Docker. Las dos suites son distintas a propósito.

**El Done de una fase se audita, no se declara.** `tests/invariantes.test.ts` verifica el criterio de
cierre de la B2 —los 12 invariantes de `data-model.md` §11— contra el propio documento: 11 tienen
test, `I7` no puede tenerlo porque `exam_preparation` no está migrada, y un guard rompe el día que se
migre.

La frontera ya existe: `lib/domain/` (puro) → `lib/navigation/` (grafo + 18 CTAs) →
`lib/fixtures/` (catálogo) → `app/(student)/` proyecta → `components/screens/` recibe props tipadas.
**Ninguna pantalla importa un fixture** y **`lib/navigation/` no importa `lib/fixtures/`**; hay tests
estáticos que lo verifican.

✅ **El recorrido del focus group es recorrible extremo a extremo.** Conserva dos costuras
declaradas: `UX05` cruza el nodo `ejecución`, que no tiene pantalla, y `UX07` requiere navegación
del facilitador porque ninguna CTA canónica llega ahí ([ADR-016](docs/decisions.md#adr-016)).

- **Track A** (clickeable, fixtures, sin backend): **sin bloqueos.** Cerrar la Fase 0 cierra el
  track — Operador e Institución se difirieron ([ADR-012](docs/decisions.md#adr-012)).
- **Track B** (backend persistente): B1 está completa y B2 está en curso sobre datos sintéticos.
  Todo lo que toque un dato real sigue bloqueado por [ADR-006](docs/decisions.md#adr-006).

**Stack:** Next.js 16 · React 19 · Tailwind v4 CSS-first · shadcn vendorizado · Vitest.

⚠️ **`npm audit`: 3 `high` abiertas** (`next`, `postcss`, `sharp`). La Etapa 0.1 las registró como
deuda a evaluar **antes** del Done de la Fase 0 y **la fase se cerró sin evaluarlas**. Hoy no
exponen datos reales porque el entorno actual es sintético y no está desplegado, pero deben
resolverse antes de producción o de incorporar una sola persona real. Arreglarlas cambia la versión
de Next y debe registrarse bajo [ADR-008](docs/decisions.md#adr-008). Ver `roadmap.md` §3.1.

Superficies: `UX01`–`UX09`. **Las nueve existen** como componente real con ruta propia bajo
`app/(student)/`. **No existe `UX10`.** Las 18 CTAs son alcanzables y todos sus destinos tienen
pantalla.

[ADR-016](docs/decisions.md#adr-016) sigue `PENDING`, pero sólo afecta al recorrido por clic:
ninguna de las 18 CTAs lleva a `UX07`, que se alcanza por navegación del menú.

Para ver cualquier estado crítico sin panel de debug: `?escenario=<ID>` en **cualquiera** de las
nueve rutas.

El recorrido de focus group vive en `lib/navigation/focus-group.ts`, **aparte del registro
canónico**: es el guion de una sesión, no un contrato. Atraviesa dos costuras sin taparlas — `UX05`
se alcanza cruzando `ejecución`, que no tiene pantalla, y `UX07` por navegación del facilitador
porque ninguna CTA lleva ahí ([ADR-016](docs/decisions.md#adr-016), `PENDING`).

---

## Reglas del Track A

Cero red · cero persistencia · cero datos reales · **desktop-first** (360 px es el piso móvil,
[ADR-014](docs/decisions.md#adr-014)) · una sola CTA primaria.

---

## Tono

**Voseo rioplatense, sin excepciones.** *"Entregá"*, *"Subí"*, *"Comprometerme"*.
