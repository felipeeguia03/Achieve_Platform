# Achieve Platform

Achieve es un acompañante académico para estudiantes universitarios: propone una acción concreta por
vez, registra compromisos y evidencias, y mantiene a una persona real como supervisor y fallback.

Este repositorio trabaja con **Spec Driven Development**. La fuente de verdad es `docs/`; el código
debe implementar esos documentos y no reinterpretarlos. Antes de modificar el proyecto, leer
[`AGENTS.md`](AGENTS.md).

## Estado actual

- **Track A:** experiencia clickeable con datos sintéticos, sin red ni persistencia. **Fase 0 en
  curso, 5 / 8 etapas.** Las etapas 0.1 (scaffold), 0.2 (dominio, fixtures y parametrización de
  `UX01`–`UX06`), 0.3 (Golden Path y registro de las 18 CTAs), 0.4 (`UX07`) y 0.5 (`UX08`, con su
  matriz de precedencia de 10 niveles) cerraron el 29 de agosto de 2026.
- **Track B:** backend, auth, persistencia e integraciones reales. Bloqueado por las decisiones
  pendientes, especialmente ADR-005 y ADR-006.

## Cómo correrlo

```bash
npm install
npm run dev     # http://localhost:3000 → redirige a /hoy
npm run lint
npm run build
npm test
```

**Stack:** Next.js 16 App Router · React 19 · Tailwind v4 CSS-first (sin `tailwind.config.js`) ·
shadcn/ui vendorizado · Vitest. Ver [ADR-008](docs/decisions.md#adr-008).

Superficies con ruta propia hoy: `/hoy` (`UX01`), `/materia` (`UX02`), `/accion` (`UX03`),
`/compromiso` (`UX04`), `/evidencia` (`UX05`), `/progreso` (`UX06`), `/examen/activar` (`UX07`) y
`/examen/overview` (`UX08`). `UX09` llega en la etapa 0.6.

Para abrir un estado crítico concreto sin panel de debug:
`/examen/overview?escenario=FX-LOCAL-OV-UNDER-REVIEW-CON-GATE`. Es un parámetro de lectura; no
persiste nada.

**Reglas del Track A:** cero red · cero persistencia · cero datos reales · desktop-first, con 360 px
como piso obligatorio de la variante móvil ([ADR-014](docs/decisions.md#adr-014)) · una sola CTA
primaria por pantalla y por estado. Las tres primeras se verifican con un test estático
(`tests/track-a-rules.test.ts`).

## Cómo está organizado el código

```
lib/domain/      tipos, máquinas de estado, precedencia y view models · PURO
lib/content/     el copy, con ID tipado (regla C-07)
lib/navigation/  grafo del Golden Path + registro canónico de las 18 CTAs
lib/fixtures/    el catálogo de escenarios sintéticos
app/(student)/   una URL por superficie; la ruta lee el escenario y lo proyecta
components/screens/   las superficies, con props tipadas
components/ui/   registro shadcn vendorizado · NO se edita
```

El destino de cada CTA sale del registro canónico, no de un recorrido escrito a mano.

**Las pantallas nunca importan un fixture.** Esa frontera es la que hace barato el Track B: cuando
el backend exista, cambia lo que hay adentro de `lib/fixtures/` y la capa de presentación no se
toca. Hay un test estático que lo verifica.

## Documentación esencial

| Documento | Importancia |
|---|---|
| [`docs/product.md`](docs/product.md) | Glosario, roles, lifecycles, invariantes y scope del producto. |
| [`docs/architecture.md`](docs/architecture.md) | Arquitectura de Track A y diseño objetivo del backend de Track B. |
| [`docs/data-model.md`](docs/data-model.md) | Entidades, relaciones, máquinas de estado y schema propuesto. |
| [`docs/platform-integration-contract.md`](docs/platform-integration-contract.md) | Contrato HTTP vigente entre Plataforma y CRM; hoy sólo autorización de padrón. |
| [`docs/decisions.md`](docs/decisions.md) | ADRs aceptados y pendientes; determina qué se puede implementar. |
| [`docs/roadmap.md`](docs/roadmap.md) | Orden de trabajo, gates y estado de cada fase. |
| [`docs/pending-decisions-annex.md`](docs/pending-decisions-annex.md) | Registro de los 51 contratos de negocio y 8 decisiones profesionales aún abiertos. |

Los documentos `*-source.md` son referencias normativas de origen y no se editan.

## Reglas técnicas del backend objetivo

- Frontend → `/api/*` → Controller → Service → Repository → Postgres/Supabase.
- El frontend nunca lee o escribe tablas de negocio directamente.
- Las reglas viven en Services TypeScript; Postgres aporta persistencia, constraints e índices.
- Supabase cliente se limita a Auth y Realtime Broadcast.
- CRM y Plataforma no comparten base: se integran únicamente por HTTP versionado.

Este diseño todavía requiere aceptación formal de [ADR-005](docs/decisions.md#adr-005), y ningún flujo
puede procesar datos reales mientras [ADR-006](docs/decisions.md#adr-006) siga `PENDING`.
