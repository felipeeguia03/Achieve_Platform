# Achieve — Arquitectura técnica

**Documento:** `docs/architecture.md`
**Rol:** owner canónico de la arquitectura del repositorio.
**Última actualización:** 3 de septiembre de 2026

> ⚠️ **Estado de este documento.** La arquitectura del **Track A** está **decidida y aprobada**
> ([ADR-008](decisions.md#adr-008), 28 ago 2026). La arquitectura del **Track B** también está
> ratificada e implementada sobre datos sintéticos: Supabase detrás de un backend TypeScript en tres
> capas, scoping institucional, Storage privado de `Evidence` y mapping manual de `institutionId`.
> [ADR-005](decisions.md#adr-005) está `ACCEPTED`; sólo la operación/runtime de producción sigue
> `DEFERRED`. Ningún flujo con personas reales se habilita mientras
> [ADR-006](decisions.md#adr-006) siga abierto.

---

## 1. Principios de arquitectura

Estos cinco principios derivan directamente de invariantes del spec y gobiernan todas las decisiones
técnicas.

### P1 — La UI proyecta; nunca decide

Ninguna superficie rankea, prioriza, calcula elegibilidad ni genera una `Action`. Las vistas son
**proyecciones de lectura** (*read models*) que releen resultados autoritativos.

**Consecuencia de implementación:** el frontend no contiene lógica de priorización académica.
Contiene, como máximo, **precedencia operativa de lifecycle** — que es determinista, está
especificada en `product.md` §10.2, y vive como función pura en `lib/domain/precedence.ts`.

Un fixture declara **la condición del dominio**, nunca la respuesta: el nivel del Hero lo calcula
`selectHeroLevel` en la proyección, y un test lo verifica escenario por escenario.

Si el backend devuelve varias recomendaciones sin una principal, eso es un **error de contrato**: la
UI muestra un error técnico, **no** elige una.

### P2 — Ningún estado se escribe desde el cliente por inferencia

El cliente **nunca** deriva un estado de dominio. Casos concretos que el spec prohíbe:

- Un timer local no completa un `Commitment`.
- El paso del tiempo no produce `DUE` ni `MISSED`.
- Un upload exitoso no produce `SUBMITTED`.
- `EvidenceSubmitted` no cambia un `Commitment` a `COMPLETED`.
- El frontend no marca `ACCEPTED` hasta recibir confirmación del owner.

### P3 — Idempotencia en el servidor, no en el botón

Deshabilitar el botón durante el request es cortesía, no protección. El spec es explícito: *"la
protección real debe estar en el servicio propietario; el frontend solo no es suficiente."*

Ante una **respuesta incierta** (red caída después de enviar), el cliente **relee por identidad**
antes de reintentar. Nunca reintenta a ciegas. Aplica a `Action`, `Commitment`, `Evidence` y
activación de `ExamPreparation`.

### P4 — La ausencia se tipa

El dominio persistido distingue tres estados semánticos y el contrato de lectura agrega un cuarto
estado operativo. La UI debe poder distinguir los cuatro:

| Estado | Significado |
|---|---|
| `no_information` / no hay dato | No existe el valor; se persiste como ausencia tipada |
| No cargó todavía | Error o latencia de lectura; lo emite la capa de lectura y no se persiste |
| Existe pero sin evaluar | `Dominio: no evaluado` |
| Cero real | `0`, un valor legítimo |

Colapsarlos es un defecto. Ver `product.md` §6.

### P5 — La provenance viaja con el dato

`source_type`, `verification_status` y el contexto de observación son **columnas del modelo**, no
decoración de la vista. Ninguna capa eleva un `verification_status`.

---

## 2. Arquitectura del Track A

### 2.1 Objetivo

Una experiencia clickeable de las 9 superficies `UX01`–`UX09`, con fixtures sintéticos, sin backend,
apta para focus groups y test de comprensión de 10 segundos en desktop, con 360 px como piso
obligatorio de la variante móvil ([ADR-014](decisions.md#adr-014)).

### 2.2 Stack

Decidido por [ADR-008](decisions.md#adr-008) (`ACCEPTED`).

| Capa | Elección | Estado |
|---|---|---|
| Framework | **Next.js 16 App Router** (`next dev` / `next build`) | ✅ Decidido — reemplaza `vinext` + Cloudflare Workers |
| React | **19.2** | Heredado, confirmado |
| Estilos | **Tailwind v4 CSS-first** (`@theme inline`, `@utility`, sin `tailwind.config.js`) | Heredado, confirmado |
| Componentes | **shadcn/ui "new-york"** vendorizado, 61 componentes | Heredado, confirmado |
| Iconos | `lucide-react` | Heredado |
| Validación | `zod` | Heredado |
| Tests | **Vitest** + Testing Library | ✅ Decidido — alinea con Dashboard_Achieve |
| Persistencia | **Ninguna.** Estado en memoria | Confirmado por el spec |

### 2.3 Estructura de directorios

```
Achieve_Platform/
├── AGENTS.md                    ← reglas canónicas para agentes de IA
├── CLAUDE.md                    ← puntero a AGENTS.md + quick reference
├── docs/                        ← FUENTE DE VERDAD
│   ├── product.md               ← glosario, roles, estados, scope
│   ├── architecture.md          ← este documento
│   ├── platform-integration-contract.md ← contrato HTTP vigente Plataforma ↔ CRM
│   ├── data-model.md            ← entidades y schema
│   ├── design-system.md         ← tokens, componentes, principios
│   ├── roadmap.md               ← fases y etapas
│   ├── decisions.md             ← ADRs
│   ├── domain-translation-dd1-dd10.md  ← respuestas DD1–DD10
│   ├── pending-decisions-annex.md   ← las 51 C01: 41 abiertas, 9 respondidas, 1 cerrada
│   ├── legal-package.md             ← las preguntas para asesoría jurídica
│   ├── agenda-cierre-psicopedagoga.md ← los 8 residuos de ADR-025
│   ├── brief-adr-008-seguridad.md   ← el brief del CTO para las 3 `high`
│   ├── human-p0-source.md           ← respuestas de la psicopedagoga, literales
│   ├── product-spec-source.md       ← spec maestro (referencia, no se edita)
│   └── design-system-source.md     ← manual de diseño (referencia, no se edita)
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 ← redirige a /hoy
│   ├── globals.css              ← tokens del sistema visual · REUSADO
│   └── (student)/               ← rutas del Golden Path
│       ├── layout.tsx
│       ├── hoy/                 ← UX01
│       ├── materia/             ← UX02
│       ├── accion/              ← UX03
│       ├── compromiso/          ← UX04
│       ├── evidencia/           ← UX05
│       ├── progreso/            ← UX06
│       └── examen/              ← UX07–UX09 · Etapas 0.4–0.6
│
├── components/
│   ├── ui/                      ← shadcn vendorizado · REUSADO · no se edita
│   └── screens/                 ← las 9 superficies + primitivas · REUSADO/EXTENDIDO
│
├── lib/
│   ├── utils.ts                 ← cn() · REUSADO
│   ├── domain/                  ← tipos y máquinas de estado (puras, sin I/O)
│   ├── content/                 ← el copy, con ID tipado (regla C-07)
│   ├── navigation/              ← grafo del Golden Path + registro de las 19 CTAs
│   └── fixtures/                ← catálogo de escenarios sintéticos
│
└── hooks/
```

### 2.4 Las cuatro capas del Track A

```
┌──────────────────────────────────────────────────────────────────┐
│  components/screens/          Presentación                        │
│  Componentes puros. Reciben props tipadas. Sin fetch, sin estado  │
│  de dominio, sin fixtures hardcodeados.                           │
└───────────────────────────────┬──────────────────────────────────┘
                                │ props tipadas
┌───────────────────────────────┴──────────────────────────────────┐
│  lib/navigation/              Golden Path                         │
│  Grafo de transiciones con dos clases de arista —canónica y de    │
│  retorno seguro—, ambas hacia nodos reales. Registro de las 19    │
│  CTAs con su condición de aparición, habilitación y destino.      │
│  NO importa lib/fixtures/: la dirección es fixtures → navigation.  │
└───────────────────────────────┬──────────────────────────────────┘
                                │ lee escenario
┌───────────────────────────────┴──────────────────────────────────┐
│  lib/fixtures/                Escenarios sintéticos               │
│  Catálogo de estados del dominio. En el Track B, esta capa se     │
│  reemplaza por llamadas al backend SIN tocar las dos de arriba.   │
└───────────────────────────────┬──────────────────────────────────┘
                                │ usa tipos
┌───────────────────────────────┴──────────────────────────────────┐
│  lib/domain/                  Tipos y máquinas de estado          │
│  Funciones puras. Los mismos tipos los consume el backend en el   │
│  Track B. Sin I/O, sin React, testeables en aislamiento.          │
└──────────────────────────────────────────────────────────────────┘
```

**La frontera que hace barato el Track B** es la de `lib/fixtures/`. Si las pantallas nunca importan
un fixture directamente y siempre reciben props, cambiar de fixtures a backend real no toca la capa
de presentación.

### 2.5 Qué se reusa y qué no del prototipo

| Origen | Destino | Tratamiento |
|---|---|---|
| `app/globals.css` | `app/globals.css` | **Verbatim.** Tiene auditoría de contraste anotada |
| `vendor/shadcn-tailwind-4.13.0.css` | `vendor/` | Verbatim |
| `components/ui/*` (61) | `components/ui/*` | Verbatim. **No se editan** (registro vendorizado) |
| `components/screens/design-system.tsx` | idem | Verbatim + se extiende con primitivas faltantes |
| `components/screens/{hoy,materia,proxima,compromiso,evidencia,progreso}.tsx` | idem | **Parametrizados con props tipadas.** El JSX y el copy se preservan |
| `components/screens/hoy-autogestion.tsx` → `selectHeroLevel()` | `lib/domain/precedence.ts` | ✅ Extraída como función pura en la Etapa 0.2. Ya cubría los 9 niveles; lo que faltaba era renderizarlos |
| `components/screens/recorrido-diseno-visual.tsx` | `lib/navigation/` | **Reemplazado.** Es un pager lineal de 6 pasos, no el grafo del Golden Path |
| `lib/utils.ts`, `hooks/use-mobile.ts` | idem | Verbatim |
| `lib/targeted-correction.ts` | — | **Descartado como código.** `evidenceOwnerTransitions` se hereda como especificación en `data-model.md` |
| `app/prototype.tsx` | — | **Descartado.** Ver [ADR-002](decisions.md#adr-002) |
| `worker/index.ts`, `vite.config.ts`, `scripts/*` | — | Descartados por [ADR-008](decisions.md#adr-008) |

### 2.6 Reglas del Track A

- **Cero red.** Sin `fetch`, `XMLHttpRequest` ni `WebSocket`.
- **Cero persistencia.** Sin `localStorage`, `sessionStorage` ni `IndexedDB`. Todo el estado es de
  sesión y el reset lo devuelve al inicial.
- **Cero datos reales.** Solo identificadores sintéticos (`ACT-SYN-*`, `COM-SYN-*`, `EVD-SYN-*`) y
  nombres genéricos.
- **Desktop-first** ([ADR-014](decisions.md#adr-014)). El test de 10 segundos corre sobre el primer
  viewport de desktop; **360 px es el piso obligatorio** de la variante móvil. El contrato de orden
  semántico de `design-system.md` §6.1 rige en los dos anchos.
- **Una sola CTA primaria por pantalla y por estado.**

---

## 3. Arquitectura del Track B — baseline implementada

> **Todo lo que sigue define la arquitectura vigente del MVP sintético.**
> [ADR-005](decisions.md#adr-005) está `ACCEPTED` y B1 la implementó. La política de privacidad,
> consentimiento, retención y visibilidad de datos reales sigue bloqueada por
> [ADR-006](decisions.md#adr-006).

### 3.1 Requisitos que cualquier opción debe cumplir

Derivados del spec, no negociables:

| # | Requisito | Fuente |
|---|---|---|
| R1 | **Aislamiento institucional** lógico y contractual | Parte I §29 |
| R2 | **RBAC**: estudiante, operador, reviewer e institución ven distinto | Parte I §29, Parte II §17 |
| R3 | **Auditoría** de cambios críticos, `RiskSignal`, `Evidence`, intervenciones y accesos | Parte I §29 |
| R4 | **Sin base de datos compartida con el CRM.** Contratos HTTP/eventos versionados | Parte II §18.1 |
| R5 | **Idempotencia del lado del servidor** para Action, Commitment, Evidence y activación | Parte VI, transversal |
| R6 | **Provenance por dato**, con `verification_status` que ninguna capa eleva | Parte II §15 |
| R7 | **Storage de archivos** de Evidence (foto, archivo, texto, audio) con política de acceso | Parte VI §VI.5 |
| R8 | **Versionado sin sobrescribir historia**: planes, programas, correcciones de clase | Parte I §29 |
| R9 | **Product Event Model** instrumentado desde el día uno | Parte I §25.8 |
| R10 | **Minimización**: recolectar solo lo necesario para una finalidad explícita | Parte I §29 |
| R11 | **El frontend no accede a tablas de negocio.** Todo dato de dominio cruza `/api/*` | Diseño objetivo de backend |
| R12 | **Separación Controller → Service → Repository** con dependencias inyectadas | Diseño objetivo de backend |

### 3.2 Regla de oro y flujo de dependencias

**Toda la lógica de negocio vive en el backend TypeScript. El frontend habla por HTTP con `/api/*`;
nunca lee ni escribe tablas de negocio. La base persiste y protege integridad, pero no decide el
dominio.**

```text
Frontend ──HTTP /api/*──▶ Controller ──▶ Service ──▶ Repository ──▶ Postgres (Supabase)
                          borde HTTP      dominio      persistencia
```

Cada capa conoce únicamente a la capa inferior mediante inyección de dependencias:

- **Controller:** valida el JWT de sesión, el input y los requisitos gruesos de autenticación/rol;
  llama a un Service y traduce su resultado a HTTP. No contiene reglas de negocio ni consultas.
- **Service:** posee reglas, máquinas de estado, permisos finos sobre el recurso, transacciones,
  idempotencia, orquestación y publicación de eventos semánticos. No lee headers ni conoce SQL.
- **Repository:** única capa que accede a Postgres/Supabase y traduce objetos de dominio a filas. No
  decide permisos ni transiciones.

Un route handler de Next.js puede materializar la capa Controller; la separación es lógica y
testeable, no exige por sí sola un proceso o repositorio físico separado.

### 3.3 Supabase como infraestructura gestionada

El diseño objetivo usa Supabase para **Postgres, Auth, Realtime Broadcast y Storage**, sin convertirlo
en el owner de las reglas:

- Los Repositories acceden a Postgres desde el backend con `service_role`; esa credencial nunca se
  entrega al navegador, se versiona ni se registra en logs.
- Supabase Auth emite la sesión/JWT. Todos los endpoints de estudiante bajo `/api/*` validan el JWT.
- La autorización fina y el scoping por institución/recurso ocurren en el backend.
- Todas las tablas habilitan RLS **deny-by-default** para cerrar la API autoexpuesta por Supabase.
  Como `service_role` saltea RLS, esa política es defensa en profundidad, no el control primario.
- Los escritores atómicos repiten el scope de la sesión en su predicado. En operaciones de
  estudiante no alcanza con `institution_id`: también validan `student_id` contra el recurso.
- Storage se usa para Evidence cuando su contrato y política de acceso estén cerrados.

### 3.4 Fronteras del frontend y Realtime

El cliente de Supabase en el frontend se limita a:

1. Auth y manejo de sesión para obtener el JWT.
2. Realtime **Broadcast** para escuchar eventos autorizados.

Quedan prohibidos `supabase.from(...)` y **Postgres Changes** en el cliente para datos de negocio. Las
escrituras siempre pasan por `/api/*`; Broadcast notifica que ocurrió un hecho y nunca actúa como
comando. Los canales se autorizan con el JWT para impedir suscripciones cruzadas entre estudiantes o
instituciones.

El Service publica el evento semántico después de cada cambio relevante. Si un flujo necesita
garantía fuerte entre persistencia y publicación, usa un **outbox transaccional**; hasta que esa
garantía se especifique, no se promete entrega exactamente una vez.

### 3.5 Responsabilidades de Postgres

**Sí pertenecen a la base:** FK, `UNIQUE`, `NOT NULL`, `CHECK`, índices, transacciones y guards mínimos
de concurrencia/atomicidad. También puede registrar auditoría técnica append-only, siempre que no
derive un resultado de negocio.

**No pertenecen a la base:** transiciones, cálculos o decisiones de negocio implementados con triggers
o funciones PL/pgSQL. Las máquinas de estado viven en Services y se prueban como TypeScript puro. Los
Repositories pueden combinar una transición validada con predicates atómicos y constraints para que
dos requests concurrentes no violen el resultado.

### 3.6 Seguridad

- JWT válido en todos los endpoints de estudiante `/api/*`, salvo excepciones públicas explícitas.
- Autenticación y rol grueso en Controller; acceso al recurso y scoping institucional en Service.
- Input validado con schemas en el borde y queries parametrizadas únicamente en Repositories.
- `service_role`, secretos HMAC y tokens de servicio sólo en variables de entorno del backend.
- Endpoints públicos: rate limiting, validación estricta e idempotencia.
- Webhooks: firma HMAC, deduplicación por ID de evento y reintentos at-least-once.
- PII minimizada. El cumplimiento aplicable —incluida Ley argentina 25.326— y las políticas de
  consentimiento/retención continúan bloqueados por [ADR-006](decisions.md#adr-006).

### 3.7 Testing y portabilidad

- **Services:** unit tests con Repositories falsos, sin HTTP ni base real.
- **Repositories:** integration tests contra Postgres/Supabase reproducible.
- **Controllers:** contract tests de autenticación, validación, status codes y schemas.
- **Sistema:** tests de aislamiento, concurrencia, idempotencia y autorización de canales Broadcast.

El acoplamiento a Supabase queda confinado a Repositories, proveedor de JWT, Storage y transporte de
Broadcast. Cambiar uno de ellos no debe modificar las reglas de Service.

Estructura orientativa. El runtime físico quedó explícitamente movible en la aceptación de ADR-005:

```text
backend/src/
  controllers/     # HTTP: autentica, valida y delega
  services/        # dominio, permisos finos, transacciones y eventos
  repositories/    # único acceso a Postgres/Supabase
  lib/             # auth, errores y utilidades
  http/            # composición y registro de rutas
```

### 3.8 Estado de decisión y alternativas preservadas

Este diseño concreta la alternativa híbrida antes recomendada: infraestructura gestionada con una
capa de servicio propia. Desplaza dos aspectos de la propuesta anterior:

- RLS deja de ser el mecanismo primario de autorización y pasa a ser un cierre deny-by-default de la
  superficie autoexpuesta.
- Las reglas de dominio dejan de proponerse como triggers; los triggers quedan limitados a funciones
  técnicas que no deciden el negocio.

Proveedor, aislamiento y capas quedaron ratificados por ADR-005. Storage privado y las migraciones
locales ya están implementados; el runtime operativo de producción sigue `DEFERRED`.

### 3.9 El código que hoy la implementa

Actualizado el 2 de septiembre de 2026, con B1–B6.7 completas en su alcance disponible y B2b en
2/3. **§3.2 describe el diseño; esto dice dónde vive**, para no tener que deducirlo del `grep`.

```text
app/
├── (student)/            ← las nueve superficies. Piden a /api/* con Bearer y
│                            dibujan `Ausencia` si la carga falla: nunca el fixture
└── api/                  ← Controller. Valida sesión, llama a UN Service, traduce a HTTP
    ├── hoy · materia · accion · compromiso · evidencia · progreso
    ├── examen/           ← Modo Examen. Activación y paso; replanificación y
    │                        reentrada explicada en dos tiempos
    ├── corroboracion     ← POST. Secreto de SERVICIO; eleva procedencia con auditoría
    ├── observacion       ← POST. Secreto de SERVICIO: registrar un error es de
    │                        quien evalúa la entrega, y ese rol no tiene superficie acá
    ├── reloj             ← POST. Secreto de SERVICIO, no JWT: no lo dispara una persona.
    │                        Además de los compromisos, expira las señales vencidas
    └── sesion            ← alta de la sesión sintética, fuera de las nueve

lib/
├── client/               ← el cliente de /api/*: token, tipo suma de respuesta, hook
├── domain/               ← PURO. Tipos, máquinas de estado, precedencia,
│   ├── product-events.ts    el Product Event Model (§16) con su cobertura
│   └── view-models.ts       lo que cada pantalla recibe
└── server/
    ├── composicion.ts    ← composition root: EL único lugar que ata implementaciones
    ├── servicios/        ← reglas, transacciones, eventos. No leen headers ni SQL
    │   ├── operadores.ts    PUERTO al directorio del CRM. TRANSITORIO: ADR-033 lo dejó
    │   │                    superado en dirección, pendiente de retiro
    │   ├── auditoria.ts     PUERTO de `audit_log`. Distinto de `product_event`:
    │   │                    uno dice qué le pasó al estudiante, el otro quién tocó qué
    │   ├── reiteracion.ts   la regla profesional HP0-06-1. Umbrales y denominador
    │   │                    llegan de configuración versionada, no viven acá
    │   ├── proyeccion-*     traducen estado persistido al view model de cada superficie
    │   ├── hechos.ts        la traducción de un hecho a entrada visible. UNA, para UX02 y UX06
    │   ├── tiempo.ts        formato en la zona del estudiante. El formato es presentación
    │   └── transiciones.ts  el núcleo compartido: leer, validar, compare-and-swap, publicar
    └── repositorios/     ← única capa que toca Postgres. No decide permisos ni transiciones

supabase/migrations/      ← 46 migraciones. Una aplicada NO se edita: se reemplaza
                             la función desde una nueva
scripts/                  ← db:verify — 275 comprobaciones que npm test no puede hacer
```

**Una lectura, una función de base.** Las nueve superficies tienen la suya —`estado_del_dia`,
`estado_de_materia`, `estado_de_accion`, `estado_de_compromiso`, `estado_de_evidencia`,
`estado_de_progreso`, `estado_de_activacion`, `estado_de_preparacion` y `estado_de_paso`— porque
varias lecturas por pantalla dan una foto inconsistente entre sí. El
historial es la excepción a la regla de *una por superficie*, y a propósito: `hechos_de_cursada()` la
comparten `UX02` y `UX06`, porque `VI.6` §8.3 dice que **no existe una segunda fuente histórica**.

**El reloj del lifecycle** corre por `POST /api/reloj`, con secreto de servicio: es lo que hace que
un compromiso vencido pase a `DUE` y después a `MISSED` sin que nadie apriete nada. **Con qué
frecuencia se lo llama es operación**, y [ADR-005](decisions.md#adr-005) la dejó `DEFERRED`.

**Y ya no está solo.** Desde [ADR-040](decisions.md#adr-040) son **cinco los endpoints que corren con
secreto de servicio y sin persona detrás** —`/api/reloj`, `/api/recomendacion`, `/api/validacion`,
`/api/observacion` y `/api/corroboracion`—, más `/api/escalamiento`, que es sólo lectura y está
apagado por defecto. **El criterio que los junta es siempre el mismo:** ninguno es una acción del
estudiante, y darle un JWT de estudiante a cualquiera de ellos lo dejaría declarando sobre sí mismo
—validando su propia evidencia, corroborando lo que él mismo cargó, registrando sus propios errores—.
**Quién es esa identidad externa sigue sin definirse:** `C01-030` está `OPEN`, y ninguno de los cinco
la valida contra nada.

**Las escrituras que existen hoy:** las transiciones de `Action`, `Commitment`, `Evidence`,
`ExamPreparation`, `RiskSignal` e `Intervention`; **la creación del primer `Commitment` de una
`Action` y la de una `Evidence` entregada** ([ADR-040](decisions.md#adr-040)); `registrar_progreso`;
`completar_paso_de_protocolo`; replanificación y reentrada; `registrar_senal`, `abrir_intervencion`,
`cerrar_intervencion` y `resolver_senal`; `materializar_recomendacion` del ADE;
`ingerir_materia` y `corroborar_procedencia` del ADL. Todas publican su hecho en
`product_event` **después** de que la escritura ganó — un evento de algo que perdió la carrera sería
un hecho que no ocurrió.

**Seis entidades comparten `transiciones.ts`**, y es a propósito: `ExamPreparation` entró en la
Fase B5 sin escribir una quinta copia de *leer con scoping → validar contra la máquina →
compare-and-swap → publicar*. Las copias divergen en el orden, que es justo donde están los errores.

### 3.10 Frontera Plataforma ↔ CRM

Congelada por el spec (Parte II §18.1), independientemente de qué opción se elija:

| | Fuente de verdad de |
|---|---|
| **Plataforma** | Materias, evaluaciones, progreso, acciones, compromisos académicos, evidencias, `ExamPreparation`, `RiskSignal` académico, `Intervention` y Bitácora |
| **CRM** | Institución cliente, elegibilidad/padrón, operadores, asignaciones, contratos/cobranza y métricas de negocio |

- **No existe base de datos compartida.**
- Integración por contratos HTTP/eventos versionados.

#### Quién usa cada sistema, y quién escribe qué — [ADR-033](decisions.md#adr-033)

**A la Plataforma acceden únicamente los estudiantes que el CRM autoriza.** El operador no interactúa
con ella y **no tiene sesión acá**: sus superficies (`WF-O01`…`WF-O04`) viven en el CRM, y el spec
fuente ya las ubicaba ahí — la sección que las define se llama *"8. Wireframes low-fi — Operador /
CRM"*.

| Dirección | Qué es | Quién se autentica |
|---|---|---|
| Estudiante → Plataforma | El loop diario, las nueve superficies | **La persona**, con su JWT |
| Plataforma → CRM | Autorización de padrón (§1 del contrato), y a futuro actividad | La Plataforma, con secreto compartido |
| CRM → Plataforma | Lectura de contexto académico, y **comandos de intervención y outcome** | **El CRM como sistema.** Nunca la persona |

**El CRM no escribe el dominio de la Plataforma: envía comandos.** La Plataforma los valida contra
sus máquinas de estados —el mismo `transiciones.ts` que usa todo lo demás— y produce el hecho
canónico. La identidad del operador viaja **asertada por el CRM**: `intervention.owner_operator_id`
es `UUID NOT NULL` sin FK, porque no hay nada de este lado contra qué verificarla.

El mecanismo no es nuevo. `POST /api/reloj` ya corre con secreto de servicio y sin persona detrás; lo
que falta es la forma del contrato, que versiona el CTO.
- **Contrato existente hoy:** Plataforma consulta elegibilidad con
  `POST /api/service/v1/authorize`. El request, las respuestas, la autenticación y la idempotencia
  segura para reintentos están especificados en
  [`platform-integration-contract.md`](platform-integration-contract.md). El presupuesto concreto
  del cliente —timeouts, cantidad máxima de intentos, jitter y agotamiento— sigue pendiente.
- **Contexto futuro, sin implementar:** (2) Plataforma publica actividad académica relevante; (3) CRM
  consulta contexto académico vivo; **(4) el CRM devuelve comandos de intervención y outcome —que el
  contrato actual no contempla y sin el cual no se cierra el tramo operativo entre sistemas**; y (5)
  la Plataforma le informa el teléfono que el estudiante vinculó. Ninguno está implementado, y
  **ninguno tiene contrato firmado**: los tres primeros están congelados por
  [ADR-035](decisions.md#adr-035) en
  [`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md), y los flujos de actividad
  y teléfono los especificó el CRM el 3 de septiembre de 2026, con la respuesta de la Plataforma en
  [`respuesta-crm-flujos-d-e-v0.1.md`](respuesta-crm-flujos-d-e-v0.1.md). El requerimiento original
  sigue en [`platform-integration-contract.md`](platform-integration-contract.md) §2.2.
- **Si el CRM no recibió un Commitment confirmado, el Commitment no se duplica ni se revierte.**
  Plataforma sigue siendo la fuente; la reparación pertenece al contrato de sincronización.

La identidad compartida es el UUID estable de Plataforma, expuesto por HTTP como
`platformStudentId`. El email institucional sirve sólo para el match inicial; no reemplaza esa
identidad. El `studentId` devuelto por CRM es una identidad externa distinta.

El contrato no define si `institutionId` del CRM coincide con `institution.id` de Plataforma o si
requiere una correspondencia explícita. Esa decisión queda abierta en `C01-001`/`C01-039`; ninguna
capa puede igualarlos por inferencia. Los pagos pertenecen al CRM/institución: Plataforma no procesa
pagos de estudiantes.

Aunque el endpoint exista, su uso procesa email/nombre/legajo de una persona y por eso **no se llama
con datos reales** mientras ADR-006 no tenga confirmación legal.

Cómo interactúa esto con la convergencia hacia Dashboard_Achieve es exactamente
[ADR-003](decisions.md#adr-003).

### 3.11 WhatsApp

**WhatsApp es un canal, no la base de datos del producto.** Puede recibir foto, archivo, texto o
audio como Evidence, pero esa Evidence se **normaliza dentro de Plataforma**: misma entidad, mismo
lifecycle, mismo evento `EvidenceSubmitted`, con `submission_channel = WHATSAPP` y la referencia de
origen preservada para deduplicación y auditoría.

Si el estudiante o la Action son ambiguos, la integración **no vincula por inferencia**.

⚠️ **Hoy la Plataforma no tiene el número, y no es un olvido.** `student.whatsapp` existe desde la
capa del estudiante rotulada como dato personal gateada por [ADR-006](decisions.md#adr-006), **nadie
la escribe**, el repositorio **ni siquiera la selecciona**, y **ninguna de las nueve superficies pide
un teléfono**. Que el CRM necesite el mapeo teléfono → alumno para acompañar por WhatsApp no crea la
pantalla donde el estudiante lo daría: eso es [ADR-042](decisions.md#adr-042), está `PENDING`, y **es
la misma decisión que el onboarding del spec §19** que [ADR-039](decisions.md#adr-039) dejó abierto.
Es, además, **el primer flujo del contrato que transportaría un identificador directo de una
persona**.

---

## 4. Contratos pendientes que bloquean implementación

El spec marca decenas de necesidades funcionales aprobadas cuyo campo, owner técnico o mutación exacta
**no está cerrado** (`SOURCE CONTRACT PENDING`). Estas son las que bloquean implementación fiel y
deben cerrarse en el Track B antes de codear la superficie que las consume:

| Contrato | Para qué | Fallback mientras siga abierto |
|---|---|---|
| `estimated_duration` | Estimación de la Action | Omitir la línea; no afirmar suficiencia de capacidad |
| `expected_evidence` | Qué debe entregar el alumno | Omitir; **no inventar el requisito** |
| `completion_criterion` | Qué cierra la Action | Omitir; no inferir cierre |
| `sufficiency_criterion` | Regla mínima evaluable de Evidence | No decidir `SUFFICIENT`/`INSUFFICIENT` |
| `validation_method` | Método de validación aplicable | Copy neutral; no prometer automático ni humano |
| `allowed_content_types` | Tipos aceptados por esa Action | **Bloquear la captura.** No ofrecer tipos por inferencia |
| Vínculo Action ↔ Resource | Mostrar solo los recursos de esa Action | Omitir opcionales; bloquear honestamente si el requerido falta |
| `rescue_relation` | Vincular rescate con el `MISSED` original | No afirmar que existe rescate |
| Vínculo Evidence ↔ Commitment | Explicar puntualidad, tardanza, original vs. rescate | No afirmar puntual/tardía |
| `human_assignment` | Mostrar una persona | **Omitir la identidad humana por completo** |
| `academic_context_blocker` | Proyectar el bloqueo de contexto | No mostrar bloqueo inventado |
| `class_event_record` | Crear/corregir/versionar reportes de clase | No persistir localmente; error honesto |
| Clave de idempotencia | Evitar duplicados ante reintento | No reintentar a ciegas |
| Coordinación Action ↔ Commitment | Atomicidad de las transiciones | Error técnico si la combinación es incompatible |
| Payload de `ProgressUpdated` | Snapshots anterior/actual y causalidad | Mostrar solo el valor actual; sin atribución causal |
| Outcome explícito de no-cambio | Distinguir "no cambió" de "todavía no llegó" | Usar *"Todavía sin cambio confirmado"* |
| `current` / `next` `ProtocolStep` | Ubicación en el recorrido y ruta a UX09 | Ocultar el recorrido; `ACTIVE` persiste |
| Owner de readiness | Card de readiness | **Sin card, sin score, sin cálculo.** [ADR-011](decisions.md#adr-011) |
| Mapping `institutionId` CRM ↔ `institution.id` Plataforma | Persistir una autorización sin mezclar tenants | No asumir igualdad; bloquear persistencia real hasta cerrar `C01-001`/`C01-039` |

> **Patrón común de todos los fallbacks: omitir, no inventar.** Si el contrato no está, la línea
> desaparece; nunca se rellena con un placeholder que parezca un dato.

---

## 5. Testing

### 5.1 Track A

| Nivel | Qué verifica |
|---|---|
| **Unitario** (`lib/domain/`) | Máquinas de estado y precedencia como funciones puras. Las transiciones prohibidas fallan |
| **Componente** | Cada pantalla renderiza correctamente cada estado crítico de su spec |
| **Invariantes de fixture** | Todos los escenarios del catálogo son alcanzables y su reset es determinista |
| **Estático** | Cero `fetch`/`localStorage`; cero identificadores no sintéticos; todas las CTAs declaradas existen |
| **Comprensión** | Test de 10 segundos en desktop — **con personas, no simulado** |

La verificación estática hereda el espíritu de `scripts/verify-low-fi.mjs`: existen `UX01`–`UX09`, no
existe `UX10`, `CTA-001`…`CTA-018` están declaradas, y ninguna capacidad de red o persistencia se
coló.

### 5.2 Track B

Se agregan: tests unitarios de Service con Repository falso; tests de integración de Repository;
contract tests de Controllers; idempotencia (el mismo request dos veces produce una sola entidad);
aislamiento (un tenant no ve datos de otro); autorización de canales Broadcast; y tests de contrato
sobre eventos de dominio y sobre el endpoint vigente de CRM.

---

## 6. Lo que esta arquitectura NO decide

Explícitamente fuera de alcance de este documento hasta que se resuelvan sus ADRs:

- ✅ Proveedor, aislamiento y capas → [ADR-005](decisions.md#adr-005) Bloque A, `ACCEPTED`. **Operación y runtime de producción siguen `DEFERRED`** (Bloque B, ítem 5)
- ✅ Pipeline del ADE v1 determinista → [ADR-004](decisions.md#adr-004), `ACCEPTED (v1 provisional)`
- Runtime de producción del Track B → ADR-005 Bloque B, ítem 5, `DEFERRED`
- Convergencia con Dashboard_Achieve → [ADR-003](decisions.md#adr-003)
- Política de privacidad, retención y consentimiento → [ADR-006](decisions.md#adr-006)
- Owner de `PreparationReadiness` → [ADR-011](decisions.md#adr-011)

✅ **Ya no está abierto:** el stack del Track A ([ADR-008](decisions.md#adr-008)) y las respuestas de
traducción al dominio ([ADR-010](decisions.md#adr-010)).
