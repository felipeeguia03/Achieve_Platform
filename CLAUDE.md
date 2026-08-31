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

1. **No inventes reglas de negocio.** Hay 51 decisiones abiertas. Si falta una regla, registrala como
   ADR `PENDING` y **preguntá**.
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
| Tocar registro, elegibilidad o integración CRM | [`docs/platform-integration-contract.md`](docs/platform-integration-contract.md) |
| El spec original completo | `docs/product-spec-source.md` — **no se edita** |

---

## Estado actual

**Fase 0 — Cerrar el Track A.** ✅ **COMPLETA.** Las nueve superficies existen, todos los estados
críticos son alcanzables, el Golden Path se recorre por clic y **el test de comprensión de 10
segundos se corrió con resultado PASS** (reportado por el owner, 30 ago 2026).

**Fase B0 — Cerrar decisiones.** 🟡 **1 / 5.** [ADR-005](docs/decisions.md#adr-005) quedó
✅ `ACCEPTED` **alcanzado a su Bloque A** el 30 ago 2026 — Supabase, scoping en Service/Repository
con RLS deny-by-default, y Controller → Service → Repository. El **Bloque B** (Storage de `Evidence`,
operación, mapping de `institutionId`) quedó `DEFERRED` con sus fases marcadas.

**Fase B1 — Fundación.** 🟢 **DESBLOQUEADA para `B1.1`–`B1.5`**, es lo que toca ahora. `B1.6` espera
el ítem 6 del Bloque B. **Toda la fase corre sobre datos sintéticos:**
[ADR-006](docs/decisions.md#adr-006) sigue `PENDING` y es bloqueo absoluto desde el primer usuario
real — aceptar ADR-005 **no** adelantó ese permiso.

**Fase A2 — Shell de aplicación.** ✅ **5 / 5 etapas.** Navegación lateral y topbar, paleta `⌘K`,
la primitiva `Ausencia`, la comparación con las capturas y la cabecera de panel con sus nueve
subcopys. **Eran 6:** [ADR-019](docs/decisions.md#adr-019) descartó el dock inferior porque la fuente
misma lo desaconseja para flujos lineales.

De las **siete diferencias** contra las capturas
([`design-system-capturas.md`](docs/design-system-capturas.md) §14) hay **seis cerradas**. Queda
**`D-03`** —los controles segmentados—, bloqueada porque las listas de opciones no existen en los
view models: fabricarlas sería inventar dominio.

La frontera ya existe: `lib/domain/` (puro) → `lib/navigation/` (grafo + 18 CTAs) →
`lib/fixtures/` (catálogo) → `app/(student)/` proyecta → `components/screens/` recibe props tipadas.
**Ninguna pantalla importa un fixture** y **`lib/navigation/` no importa `lib/fixtures/`**; hay tests
estáticos que lo verifican.

⚠️ **El Golden Path todavía NO es recorrible extremo a extremo.** `UX05` no tiene entrada por clic
(el spec la rutea por `ejecución`, que no tiene pantalla) y `UX06` tampoco (`CTA-009` está declarada
pero ninguna pantalla la renderiza). Ver `docs/roadmap.md`, Etapa 0.3.

- **Track A** (clickeable, fixtures, sin backend): **sin bloqueos.** Cerrar la Fase 0 cierra el
  track — Operador e Institución se difirieron ([ADR-012](docs/decisions.md#adr-012)).
- **Track B** (backend real): `B1.1`–`B1.5` **desbloqueadas** por
  [ADR-005](docs/decisions.md#adr-005) Bloque A. Todo lo que toque un dato real sigue bloqueado por
  [ADR-006](docs/decisions.md#adr-006).

**Stack:** Next.js 16 · React 19 · Tailwind v4 CSS-first · shadcn vendorizado · Vitest.

⚠️ **`npm audit`: 3 `high` abiertas** (`next`, `postcss`, `sharp`). La Etapa 0.1 las registró como
deuda a evaluar **antes** del Done de la Fase 0 y **la fase se cerró sin evaluarlas**. Hoy no
exponen nada —el Track A no tiene red ni deploy—, pero **bloquean la Fase B1**. Arreglarlas sube la
mayor de Next, o sea [ADR-008](docs/decisions.md#adr-008). Ver `roadmap.md` §3.1.

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
