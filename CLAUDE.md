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

## Las cinco reglas

1. **No inventes reglas de negocio.** Hay 51 decisiones abiertas. Si falta una regla, registrala como
   ADR `PENDING` y **preguntá**.
2. **No resuelvas una decisión `PENDING`.** La cierra una persona.
3. **Datos reales: bloqueo absoluto** hasta que [ADR-006](docs/decisions.md#adr-006) esté resuelto.
4. **Una etapa por vez, completa.** Readiness → decisiones aprobadas → implementar → verificar →
   commit → docs actualizados.
5. **No reescribas `components/screens/*`, `app/globals.css` ni `components/ui/*`** salvo que el
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
| Tocar UI | [`docs/design-system.md`](docs/design-system.md) |
| Tocar datos | [`docs/data-model.md`](docs/data-model.md) |
| Tocar estructura | [`docs/architecture.md`](docs/architecture.md) |
| Aplicar un principio del manual de diseño | [`docs/domain-translation-dd1-dd10.md`](docs/domain-translation-dd1-dd10.md) |
| Saber si algo está decidido | [`docs/pending-decisions-annex.md`](docs/pending-decisions-annex.md) |
| Tocar registro, elegibilidad o integración CRM | [`docs/platform-integration-contract.md`](docs/platform-integration-contract.md) |
| El spec original completo | `docs/product-spec-source.md` — **no se edita** |

---

## Estado actual

**Fase 0 — Cerrar el Track A.** 🔵 EN CURSO · **1 / 8**. La Etapa 0.1 (scaffold + migración de UI)
cerró el 29 ago 2026. **Toca la Etapa 0.2:** capa de dominio, fixtures y parametrización de
`UX01`–`UX06`.

- **Track A** (clickeable, fixtures, sin backend): **sin bloqueos.** Cerrar la Fase 0 cierra el
  track — Operador e Institución se difirieron ([ADR-012](docs/decisions.md#adr-012)).
- **Track B** (backend real): bloqueado por [ADR-005](docs/decisions.md#adr-005) y
  [ADR-006](docs/decisions.md#adr-006).

**Stack:** Next.js 16 · React 19 · Tailwind v4 CSS-first · shadcn vendorizado · Vitest.

Superficies: `UX01`–`UX09`. Seis existen como componente real y tienen ruta propia bajo
`app/(student)/`; faltan `UX07`, `UX08`, `UX09`. **No existe `UX10`.**

**Único `PENDING` dentro de la Fase 0:** dónde vive la CTA principal en desktop
([`docs/design-system-capturas.md`](docs/design-system-capturas.md) §12.7). No afecta a las etapas
0.1–0.3; se cierra antes de la 0.4.

---

## Reglas del Track A

Cero red · cero persistencia · cero datos reales · **desktop-first** (360 px es el piso móvil,
[ADR-014](docs/decisions.md#adr-014)) · una sola CTA primaria.

---

## Tono

**Voseo rioplatense, sin excepciones.** *"Entregá"*, *"Subí"*, *"Comprometerme"*.
