# Achieve Platform

Achieve es un acompañante académico para estudiantes universitarios: propone una acción concreta por
vez, registra compromisos y evidencias, y mantiene a una persona real como supervisor y fallback.

Este repositorio trabaja con **Spec Driven Development**. La fuente de verdad es `docs/`; el código
debe implementar esos documentos y no reinterpretarlos. Antes de modificar el proyecto, leer
[`AGENTS.md`](AGENTS.md).

## Estado actual

- **Track A:** experiencia clickeable con datos sintéticos, sin red ni persistencia. **Las 8 etapas
  de la Fase 0 están completas.** Las nueve superficies `UX01`–`UX09` existen, todos los estados
  críticos de sus specs son alcanzables con URL propia, el Golden Path se recorre por clic de
  punta a punta y **el test de comprensión de 10 segundos se corrió con resultado PASS**
  ([guion](docs/guion-focus-group.md)). **La Fase 0 está cerrada.**
- **Fase A2 — shell de aplicación: completa.** Navegación lateral, topbar con breadcrumb, paleta
  `⌘K`, la primitiva `Ausencia` y la cabecera de panel. La comparación lado a lado con las capturas
  está en [`docs/design-system-capturas.md`](docs/design-system-capturas.md) §14: **siete
  diferencias, seis cerradas**, y la séptima con su bloqueo escrito.
- **Track B:** el MVP persistente avanza **sólo con datos sintéticos**. **B1–B6.7 están completas
  en su alcance disponible** y B2b va **2 / 3** (2 sep 2026):
  - **B1 — Fundación.** Supabase local reproducible, capa académica y del estudiante, la frontera
    Controller → Service → Repository, `product_event` y `audit_log` append-only.
  - **B2 — Dominio de ejecución.** El loop diario persistido —`Action`, `Commitment`, `Evidence`,
    `Reflection`— leyendo de Postgres con sesión real.
  - **B3 — Progreso, Bitácora y eventos.** El resultado de progreso se escribe con sus invariantes,
    el Product Event Model está declarado con su cobertura, y la Bitácora de `UX06` y la Actividad
    reciente de `UX02` salen de **una sola fuente histórica**.
  - **B4 — ADE v1 y el reloj.** El validador determinista rechaza toda recomendación que afirme
    dominio, progreso o readiness inexistente, **antes de materializar**; el reloj corre por
    `POST /api/reloj` con secreto de servicio.
  - **B5 — Modo Examen real.** La capa de examen, **los veinte pasos del protocolo con el texto
    literal de la psicopedagoga** y las nueve superficies del estudiante leyendo de Postgres.
    Readiness sigue sin calcularse: los umbrales son `C01-029`.

  - **B6 — Risk e Intervención.** El circuito cerrado *causa → owner → playbook → SLA → intervención
    → outcome* queda protegido por construcción. Una regla profesional produce señales desde hechos
    comparables; los otros disparadores, playbooks y SLA siguen sujetos a decisiones abiertas.
  - **B6.7 — Validación profesional aplicada.** Vocabulario, denominador, corrección válida,
    episodios, revisión temprana y reentrada mínima están versionados. Replanificar conserva la
    preparación y explica la vuelta antes de mover el recorrido.
  - **B2b — Ingesta ADL.** La ingesta asistida y la corroboración append-only están construidas;
    B2b.3 espera la autorización institucional `C01-042`.

  Cualquier flujo que toque un dato de una persona real sigue bloqueado por
  [ADR-006](docs/decisions.md#adr-006).
- **El 1 de septiembre de 2026 el owner cerró tres decisiones y dejó una provisional:**
  [ADR-011](docs/decisions.md#adr-011) (readiness: `PreparationReadiness` es canónica),
  [ADR-003](docs/decisions.md#adr-003) (se integra el dominio, no los frontends),
  [ADR-027](docs/decisions.md#adr-027) (los eventos de transición entran al modelo) y
  [ADR-006](docs/decisions.md#adr-006) en `PROVISIONAL — LEGAL CONFIRMATION REQUIRED`.
- **No hay una etapa siguiente desbloqueada para implementar sin una decisión humana.** B2b.3 espera
  `C01-042`; B7 espera el dictamen legal de ADR-006. El [mapa de bloqueos](docs/roadmap.md) dice
  quién cierra cada cosa.

## Cómo correrlo

```bash
npm install
npm run dev     # http://localhost:3000 → redirige a /hoy
npm run lint
npm run typecheck
npm run build
npm test
```

**Stack:** Next.js 16 App Router · React 19 · Tailwind v4 CSS-first (sin `tailwind.config.js`) ·
shadcn/ui vendorizado · Vitest. Ver [ADR-008](docs/decisions.md#adr-008).

Superficies con ruta propia hoy: `/hoy` (`UX01`), `/materia` (`UX02`), `/accion` (`UX03`),
`/compromiso` (`UX04`), `/evidencia` (`UX05`), `/progreso` (`UX06`), `/examen/activar` (`UX07`),
`/examen/overview` (`UX08`) y `/examen/paso` (`UX09`).

Para abrir un estado crítico concreto sin panel de debug, en **cualquier** ruta:
`/compromiso?escenario=FX-LOCAL-COM-MISSED`. Es un parámetro de lectura; no persiste nada.

**Reglas del Track A:** cero red · cero persistencia · cero datos reales · desktop-first, con 360 px
como piso obligatorio de la variante móvil ([ADR-014](docs/decisions.md#adr-014)) · una sola CTA
primaria por pantalla y por estado. Las tres primeras se verifican con un test estático
(`tests/track-a-rules.test.ts`).

## Base de datos local (Track B, Etapa B1.1)

**Proyecto Supabase propio, separado de Dashboard_Achieve.** El spec prohíbe base compartida con el
CRM ([Parte II §18.1](docs/architecture.md)); compartir proveedor no relaja esa regla. Los puertos
locales son **54420–54429** para que los dos stacks puedan correr al mismo tiempo.

```bash
npm run db:start     # levanta el stack local (necesita Docker corriendo)
npm run db:reset     # tira abajo y re-aplica todas las migraciones desde cero
npm run db:verify    # migraciones, deny-by-default de §6 y los 12 invariantes de §7
npm run db:studio    # http://127.0.0.1:54423
npm run db:stop
```

Copiá [`.env.local.example`](.env.local.example) a `.env.local` con lo que imprime `db:start`.

**`db:verify` no está dentro de `npm test`** a propósito: la suite de **953 tests en 52 archivos**
corre sin Docker, en cualquier máquina. Mezclarlas haría que todas dependieran de tener el stack
levantado.

⚠️ **`db:verify` es dueño de la base local y la deja vacía de datos de negocio.** Comparte UUID con
`db:demo` a propósito —`aaaaaaaa-…` es la misma institución en los dos—, así que **no pueden
convivir**: después de verificar hay que volver a sembrar con `npm run db:demo`. Las **275
comprobaciones** limpian lo suyo también al empezar y por `trap EXIT`, para que una corrida que
falla no arrastre a la siguiente.

⚠️ **Este entorno corre sólo con datos sintéticos.** [ADR-006](docs/decisions.md#adr-006) sigue
`PROVISIONAL — LEGAL CONFIRMATION REQUIRED` y es bloqueo absoluto para cualquier dato de una persona real — que
[ADR-005](docs/decisions.md#adr-005) esté aceptado **no** cambia eso.

## Cómo está organizado el código

```
lib/domain/      tipos, máquinas de estado, precedencia y view models · PURO
lib/server/      backend: http (borde) · servicios (dominio) · repositorios (SQL)
app/api/         Controller: valida JWT, llama a un Service, traduce a HTTP
supabase/        migraciones y entorno local reproducible
lib/content/     el copy, con ID tipado (regla C-07)
lib/navigation/  grafo del Golden Path + registro canónico de las 19 CTAs
lib/fixtures/    el catálogo de escenarios sintéticos
app/(student)/   una URL por superficie; la ruta lee el escenario y lo proyecta
components/screens/   las superficies, con props tipadas
components/ui/   registro shadcn vendorizado · NO se edita
```

El destino de cada CTA sale del registro canónico, no de un recorrido escrito a mano.

**Las pantallas nunca importan un fixture.** Esa frontera permitió conectar las nueve superficies al
backend **sin tocar `components/screens/`**: cada página pide a `/api/*` y, con `?escenario=`,
proyecta el catálogo sintético. Hay un test estático que lo verifica en las dos direcciones.

## Antes de tocar UI

**Achieve es desktop-first y su lenguaje visual sale de las capturas de `docs/diseño/`**
([ADR-018](docs/decisions.md#adr-018)). Se miran **antes** de diseñar cualquier pantalla.

⚠️ **Esa carpeta no está versionada.** Contiene datos de un sistema real y
[ADR-006](docs/decisions.md#adr-006) la mantiene fuera del repositorio. Si al clonar la encontrás
vacía, **eso es lo esperado**: pedile las capturas al owner. **No improvises un diseño** — ver
[`AGENTS.md`](AGENTS.md) §1.5.

El contrato de layout que sí viaja es
[`docs/design-system-capturas.md`](docs/design-system-capturas.md), §11.9 en particular.

## Documentación esencial

| Documento | Importancia |
|---|---|
| [`docs/product.md`](docs/product.md) | Glosario, roles, lifecycles, invariantes y scope del producto. |
| [`docs/architecture.md`](docs/architecture.md) | Arquitectura de Track A y baseline implementada del backend de Track B. |
| [`docs/data-model.md`](docs/data-model.md) | Entidades, relaciones, máquinas de estado y schema implementado/provisional. |
| [`docs/platform-integration-contract.md`](docs/platform-integration-contract.md) | Contrato HTTP vigente entre Plataforma y CRM; hoy sólo autorización de padrón. |
| [`docs/decisions.md`](docs/decisions.md) | ADRs aceptados y pendientes; determina qué se puede implementar. |
| [`docs/roadmap.md`](docs/roadmap.md) | Orden de trabajo, gates y estado de cada fase. |
| [`docs/pending-decisions-annex.md`](docs/pending-decisions-annex.md) | Registro de los 51 contratos de negocio: **41 abiertos**, 9 respondidos con residuo y `C01-022` cerrado. |
| [`docs/legal-package.md`](docs/legal-package.md) | Las preguntas para asesoría jurídica, con el contexto para responderlas. |
| [`docs/agenda-cierre-psicopedagoga.md`](docs/agenda-cierre-psicopedagoga.md) | Los ocho residuos de `ADR-025`, como agenda de la reunión de cierre. |
| [`docs/brief-adr-008-seguridad.md`](docs/brief-adr-008-seguridad.md) | El brief del CTO para las tres vulnerabilidades `high`. |
| [`docs/human-p0-source.md`](docs/human-p0-source.md) | Las ocho respuestas psicopedagógicas, transcriptas literalmente. **Manda sobre cualquier paráfrasis.** |

Los documentos `*-source.md` son referencias normativas de origen y no se editan.

## Reglas técnicas del backend objetivo

- Frontend → `/api/*` → Controller → Service → Repository → Postgres/Supabase.
- El frontend nunca lee o escribe tablas de negocio directamente.
- Las reglas viven en Services TypeScript; Postgres aporta persistencia, constraints e índices.
- Supabase cliente se limita a Auth y Realtime Broadcast.
- CRM y Plataforma no comparten base: se integran únicamente por HTTP versionado.

El proveedor, el aislamiento y las capas quedaron ratificados por
[ADR-005](docs/decisions.md#adr-005). El Storage privado de `Evidence` y el mapping manual de
`institutionId` ya están implementados; sólo la operación/runtime de producción sigue `DEFERRED`.
Ningún flujo puede procesar datos reales mientras [ADR-006](docs/decisions.md#adr-006) no tenga
confirmación legal.
