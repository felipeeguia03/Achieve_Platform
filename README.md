# Achieve Platform

Achieve es un acompañante académico para estudiantes universitarios: propone una acción concreta por
vez, registra compromisos y evidencias, y mantiene a una persona real como supervisor y fallback.

Este repositorio trabaja con **Spec Driven Development**. La fuente de verdad es `docs/`; el código
debe implementar esos documentos y no reinterpretarlos. Antes de modificar el proyecto, leer
[`AGENTS.md`](AGENTS.md).

## Estado actual

- **Track A:** experiencia clickeable con datos sintéticos, sin red ni persistencia. **Las 8 etapas
  de la Fase 0 están completas.** Las nueve superficies `UX01`–`UX09` existen, todos los estados
  críticos de sus specs son alcanzables con URL propia, y el Golden Path se recorre por clic de
  punta a punta, y **el test de comprensión de 10 segundos se corrió con resultado PASS**
  ([guion](docs/guion-focus-group.md)). **La Fase 0 está cerrada.**
- **Fase A2 — shell de aplicación: completa.** Navegación lateral, topbar con breadcrumb, paleta
  `⌘K`, la primitiva `Ausencia` y la cabecera de panel. La comparación lado a lado con las capturas
  está en [`docs/design-system-capturas.md`](docs/design-system-capturas.md) §14: **siete
  diferencias, seis cerradas**, y la séptima con su bloqueo escrito.
- **Track B:** backend, auth, persistencia e integraciones reales. **[ADR-005](docs/decisions.md#adr-005)
  quedó `ACCEPTED` alcanzado a su Bloque A** (Supabase, scoping en dos capas, Controller → Service →
  Repository), así que las etapas `B1.1`–`B1.5` de la Fase B1 están desbloqueadas **sobre datos
  sintéticos**. Cualquier flujo que toque un dato de una persona real sigue bloqueado por
  [ADR-006](docs/decisions.md#adr-006).

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
npm run db:verify    # comprueba migraciones y el deny-by-default de §6
npm run db:studio    # http://127.0.0.1:54423
npm run db:stop
```

Copiá [`.env.local.example`](.env.local.example) a `.env.local` con lo que imprime `db:start`.

**`db:verify` no está dentro de `npm test`** a propósito: la suite de 396 corre sin Docker, en
cualquier máquina. Mezclarlas haría que todas dependieran de tener el stack levantado.

⚠️ **Este entorno corre sólo con datos sintéticos.** [ADR-006](docs/decisions.md#adr-006) sigue
`PENDING` y es bloqueo absoluto para cualquier dato de una persona real — que
[ADR-005](docs/decisions.md#adr-005) esté aceptado **no** cambia eso.

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

El proveedor, el aislamiento y las capas quedaron ratificados por
[ADR-005](docs/decisions.md#adr-005) (Bloque A). **Storage de `Evidence`, operación y el mapping de
`institutionId` siguen `DEFERRED`**, y ningún flujo puede procesar datos reales mientras
[ADR-006](docs/decisions.md#adr-006) siga `PENDING`.
