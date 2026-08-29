# Achieve Platform

Achieve es un acompañante académico para estudiantes universitarios: propone una acción concreta por
vez, registra compromisos y evidencias, y mantiene a una persona real como supervisor y fallback.

Este repositorio trabaja con **Spec Driven Development**. La fuente de verdad es `docs/`; el código
debe implementar esos documentos y no reinterpretarlos. Antes de modificar el proyecto, leer
[`AGENTS.md`](AGENTS.md).

## Estado actual

- **Track A:** experiencia clickeable con datos sintéticos, sin red ni persistencia. Listo para iniciar.
- **Track B:** backend, auth, persistencia e integraciones reales. Bloqueado por las decisiones
  pendientes, especialmente ADR-005 y ADR-006.

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
