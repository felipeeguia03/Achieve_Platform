# Achieve — Registro de decisiones de arquitectura (ADR)

**Documento:** `docs/decisions.md`
**Rol:** owner canónico de las decisiones tomadas y pendientes de este repositorio.
**Última actualización:** 2 de septiembre de 2026

---

## Cómo se usa este documento

Cada decisión importante de producto o arquitectura se registra acá como un ADR numerado, con
contexto, decisión, alternativas y consecuencias. Reglas:

1. **Nada se implementa contra un ADR en estado `PENDING`.** Si una etapa del roadmap depende de
   un ADR pendiente, la etapa está bloqueada hasta que el ADR se resuelva.
2. **Un ADR lo cierra una persona, no un agente.** Un agente puede proponer opciones y recomendar
   una; la transición a `ACCEPTED` requiere respuesta explícita del owner del producto.
3. **Cada ADR anota qué documentos toca.** Al aceptarse, esos documentos se actualizan en el mismo
   commit.
4. **Un ADR aceptado no se edita: se supersede.** Se crea un ADR nuevo que lo reemplaza y el viejo
   pasa a `SUPERSEDED por ADR-XXX`.

### Estados

| Estado | Significado |
|---|---|
| `ACCEPTED` | Decidido. El código puede depender de esto. |
| `PENDING` | Esperando decisión del producto. Bloquea las etapas que lo listan como dependencia. |
| `PROPOSED` | Hay una propuesta razonada con alternativas, esperando aprobación. |
| `SUPERSEDED` | Reemplazado por un ADR posterior. |
| `DEFERRED` | Fuera del alcance actual; se reevalúa más adelante. |

### Relación con el registro C01

Este documento **no reemplaza** a [`pending-decisions-annex.md`](pending-decisions-annex.md), que
contiene las 51 decisiones de negocio `C01` heredadas del spec fuente. Relación:

- `C01-XXX` = decisión **de negocio/producto** pendiente, heredada del spec. Su owner suele estar
  fuera del equipo técnico.
- `ADR-XXX` = decisión **de este repositorio**. Puede consumir, agrupar o depender de varios `C01`.

Cuando un ADR depende de un `C01`, lo cita. Cerrar un ADR **no cierra** el `C01` asociado.

---

## Índice

| ADR | Título | Estado | Bloquea |
|---|---|---|---|
| [ADR-001](#adr-001) | Adoptar Spec Driven Development | `ACCEPTED` | — |
| [ADR-002](#adr-002) | Scaffold nuevo reusando solo la capa de UI | `ACCEPTED` | — |
| [ADR-003](#adr-003) | Convergencia Operador ↔ coach de Dashboard_Achieve | ✅ `ACCEPTED` *(se integra el dominio, no los frontends)* | — |
| [ADR-004](#adr-004) | Diseño del pipeline del ADE | ✅ `ACCEPTED` *(v1 provisional, alcance MVP)* | — |
| [ADR-005](#adr-005) | Motor de base de datos, auth y persistencia | ✅ `ACCEPTED` *(sólo el ítem 5 `DEFERRED`)* | `B3` |
| [ADR-006](#adr-006) | Privacidad y consentimiento de datos reales | 🟡 `PROVISIONAL — LEGAL CONFIRMATION REQUIRED` | **Toda fase con datos reales: el gate sigue cerrado** |
| [ADR-007](#adr-007) | Las 8 decisiones `HUMAN-P0` | ✅ `ACCEPTED` *(resuelto por [ADR-025](#adr-025))* | — |
| [ADR-008](#adr-008) | Stack y runtime del frontend | `ACCEPTED` | — |
| [ADR-009](#adr-009) | Colisión de namespace `D1–D25` vs `D1–D10` | `ACCEPTED` | — |
| [ADR-010](#adr-010) | Respuestas DD1–DD10 de traducción al dominio | `ACCEPTED` *(DD4 `DEFERRED`)* | — |
| [ADR-011](#adr-011) | Owner canónico de `PreparationReadiness` (CR-UX08-01) | ✅ `ACCEPTED` *(la entidad separada es canónica)* | — |
| [ADR-012](#adr-012) | Alcance de Track A: Operador e Institución se difieren | `ACCEPTED` | — |
| [ADR-013](#adr-013) | Contenido duplicado en `pending-decisions-annex.md` | `ACCEPTED` | — |
| [ADR-014](#adr-014) | Desktop-first y contrato del primer viewport | `ACCEPTED` | — |
| [ADR-015](#adr-015) | Dónde vive la CTA principal en desktop | `ACCEPTED` | — |
| [ADR-016](#adr-016) | Ninguna CTA del registro lleva a `UX07` | ✅ `ACCEPTED` *(Opción A: se agrega `CTA-019`)* | — |
| [ADR-017](#adr-017) | Las dos CTAs ambiguas de `product.md` §10.2 | `ACCEPTED` | — |
| [ADR-018](#adr-018) | El lenguaje visual sale de las capturas, y hay que mirarlas | `ACCEPTED` | — |
| [ADR-019](#adr-019) | El dock inferior no se construye; `Ausencia` ocupa su etapa | `ACCEPTED` | [ADR-018](#adr-018) |
| [ADR-020](#adr-020) | Cuántas clases de ausencia distingue Achieve, y con qué palabras | ✅ `ACCEPTED` *(un no-cambio declarado es un dato)* | — |
| [ADR-021](#adr-021) | Qué es, en Achieve, el «trabajo pendiente que caduca» | `ACCEPTED` | — |
| [ADR-022](#adr-022) | `C-04` elevado: el vacío argumenta, con tercera cláusula condicional | `ACCEPTED` | — |
| [ADR-023](#adr-023) | La ingesta del ADL se construye antes que el ADE, y empieza asistida | `ACCEPTED` | — |
| [ADR-024](#adr-024) | Modo MVP: se construye todo sobre datos sintéticos | `ACCEPTED` | — |
| [ADR-025](#adr-025) | Las ocho `HUMAN-P0`, respondidas por la psicopedagoga | ✅ `ACCEPTED` | — |
| [ADR-026](#adr-026) | Obligatoriedad de `Reflection`: dónde vive y qué la hace válida | ✅ `ACCEPTED` | — |
| [ADR-027](#adr-027) | Los ocho eventos de transición entran al Product Event Model | ✅ `ACCEPTED` | — |
| [ADR-033](#adr-033) | La frontera de superficies, corregida en la dirección del spec | ✅ `ACCEPTED` *(corrige cláusulas de [ADR-012](#adr-012) y [ADR-032](#adr-032))* | — |
| [ADR-034](#adr-034) | `C01-022` cerrada: la necesidad de una persona la declara la Plataforma | ✅ `ACCEPTED` *(corrige la máquina de [ADR-032](#adr-032); reabre el ítem 5 de [ADR-005](#adr-005))* | — |
| [ADR-035](#adr-035) | La integración con el CRM se difiere; el dominio sigue adelante | ✅ `ACCEPTED` *(prioridad, no bloqueo: nada de lo construido se revierte)* | — |
| [ADR-036](#adr-036) | Cierre **provisional** de `C01-036` y `C01-021` para el MVP | ⚠️ ✅ `ACCEPTED` · **`PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION`** *(autoridad: Product Owner, no la psicopedagoga)* | — |
| [ADR-037](#adr-037) | La validación profesional llegó, y los números no eran el problema | ✅ `ACCEPTED` *(6 `CAMBIAR` + 1 `APROBAR`; los umbrales quedaron, cambió el denominador)* | — |

---

<a id="adr-001"></a>
## ADR-001 — Adoptar Spec Driven Development

**Estado:** `ACCEPTED` · 28 ago 2026
**Toca:** todos los documentos.

### Contexto

El proyecto llega con un spec de producto excepcionalmente detallado (~16.000 líneas repartidas en
nueve partes) y un prototipo low-fi que fue construido como arnés de verificación de QA. El riesgo
inmediato es que el código empiece a divergir del spec y que cada agente de IA que toque el repo
reinterprete las reglas de negocio por su cuenta.

### Decisión

La **fuente de verdad son los documentos markdown de `docs/`**. El código sigue a la documentación,
nunca al revés. Se trabaja fase por fase y etapa por etapa: readiness → decisiones de diseño
aprobadas → implementación → pruebas en verde → un commit por etapa → documentación actualizada.

### Alternativas consideradas

- **Code-first con el spec como referencia.** Descartada: el spec contiene cientos de invariantes
  negativos ("X no implica Y") que se pierden si no están escritos en un lugar que el código cite.
- **Generar código directamente desde el spec fuente.** Descartada: el spec fuente es un documento
  de gobernanza de handoff, no una especificación de implementación. Mezcla decisiones vigentes,
  auditorías, self-audits y trazabilidad documental.

### Consecuencias

- Ninguna línea de código de producto se escribe antes de que la documentación y el roadmap estén
  aprobados.
- Cada etapa termina con la documentación sincronizada; un roadmap desactualizado es un defecto.
- Los agentes de IA leen [`AGENTS.md`](../AGENTS.md) antes de tocar nada.

---

<a id="adr-002"></a>
## ADR-002 — Scaffold nuevo reusando solo la capa de UI

**Estado:** `ACCEPTED` · 28 ago 2026
**Toca:** `architecture.md`, `roadmap.md` (Etapa 0.1).

### Contexto

El prototipo low-fi vive fuera de este repositorio, en una carpeta suelta sin git
(`~/Desktop/ACHIEVE_LOW_FI_REVERSIBLE_PROTOTYPE_BUILD_v0.2 3/`). Contiene dos cosas de naturaleza
muy distinta:

- **Arnés descartable:** `app/prototype.tsx` (un `switch` de 9 casos con JSX de hasta 3.000
  caracteres por línea, 12 `useState` sueltos y reglas de negocio codificadas como comparaciones de
  string de fixture), `lib/targeted-correction.ts` y 12 documentos `ACHIEVE_LOW_FI_*.md` de
  gobernanza de QA.
- **UI real y reusable:** `app/globals.css` (sistema de tokens con auditoría de contraste WCAG AA
  anotada en el propio código), `components/screens/*` (8 archivos con las 6 pantallas del loop
  diario más las primitivas visuales) y `components/ui/*` (80 componentes shadcn vendorizados).

### Decisión

Se crea un **scaffold nuevo** en este repositorio trayendo únicamente:

- `app/globals.css`
- `components/screens/` (las 8 primitivas y pantallas)
- `components/ui/` (shadcn vendorizado) y `vendor/shadcn-tailwind-4.13.0.css`
- `lib/utils.ts` y `hooks/use-mobile.ts`

El arnés `app/prototype.tsx`, `lib/targeted-correction.ts`, `worker/index.ts` y los 12 `.md` de
gobernanza **quedan fuera del repositorio**, como referencia de lectura en su carpeta original.

### Alternativas consideradas

- **Traer el prototipo completo y retirarlo por etapas.** Ventaja: el arnés QA seguía corriendo como
  herramienta viva y el historial de git mostraba la procedencia. Descartada por el owner del
  producto: el arnés contamina la base con patrones que no queremos que ningún agente tome como
  referencia.
- **Repositorio solo-docs con el código en otro repo.** Descartada: no hay razón para separarlos.

### Consecuencias

- El arnés QA deja de ser ejecutable desde este repo. La cobertura que daba (27 fixtures × 9
  pantallas) se reconstruye en la Etapa 0.2 como una **capa de fixtures tipada**, que es un artefacto
  de producto, no un arnés.
- `lib/targeted-correction.ts` no se copia como código, pero su `evidenceOwnerTransitions` sí se
  hereda como **especificación** de la máquina de estados de Evidence en
  [`data-model.md`](data-model.md).
- Se pierde la trazabilidad automática que daba `scripts/verify-low-fi.mjs`. La Etapa 0.2 la
  reemplaza con verificaciones sobre la capa de fixtures.

---

<a id="adr-003"></a>
## ADR-003 — Convergencia Operador ↔ coach de Dashboard_Achieve

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Desbloquea:** la Fase B6 (Operador real) en su parte de dominio. La ejecución del contrato v2 la
lleva el CTO. *(Antes bloqueaba también la Fase A1, que
[ADR-012](#adr-012) difirió al Track B.)*
**Relacionado:** `C01-039` (CRM–Plataforma, `human_assignment`), `C01-022`, `C01-044`.
**Toca:** `product.md` (glosario y roles), `data-model.md`, `roadmap.md`.

### Contexto

Existe un segundo codebase en producción, **Dashboard_Achieve** (`~/Desktop/Dashboard_Achieve`):
Next.js 16 + Supabase, con 29 migraciones SQL y tablas `coaches`, `users`, `challenges`,
`checkpoints`, `conversations`, `messages`, `leads`, `payments`, más integración de WhatsApp,
`achieve_daily_logs` y `achieve_streaks`. Es un CRM de coaching con supervisor humano.

Hechos establecidos por el owner del producto (28 ago 2026):

- Los dos codebases están separados **porque los construye gente distinta en paralelo** — el CTO
  lleva Dashboard_Achieve.
- **Ninguno de los dos tiene datos reales todavía.**
- El objetivo a mediano plazo es que el rol **Operador** de Achieve Plataforma y los **coaches** de
  Dashboard_Achieve **converjan**.

Esto es coherente con el spec fuente, que congela la frontera Plataforma ↔ CRM
(Parte II §18.1): ownership separado, sin base de datos compartida, integración por contratos
HTTP/eventos versionados. Pero el spec no dice qué hacer cuando el CRM ya existe y usa otro
vocabulario.

El 28 de agosto de 2026 se recibió el primer contrato concreto entre ambos sistemas:
[`platform-integration-contract.md`](platform-integration-contract.md). Confirma la separación actual
y congela únicamente la autorización de padrón Plataforma → CRM. No define todavía actividad,
contexto vivo ni la convergencia de roles/modelos.

### Qué falta decidir

1. Aunque hoy operan separados, ¿convergen a mediano plazo en un solo sistema o esa separación queda
   como arquitectura permanente?
2. ¿Quién versiona el contrato integral? Hoy existe autorización v1; actividad y contexto vivo aún no
   tienen endpoint/payload/SLA acordado.
3. **Reconciliación de terminología**, que es lo urgente y lo barato de hacer ahora:

| Achieve Plataforma | Dashboard_Achieve | ¿Son lo mismo? |
|---|---|---|
| Operador | `coaches` | Probablemente sí — confirmar rol y permisos |
| Estudiante | `users` | Probablemente sí |
| Commitment | `checkpoints` | **No obviamente.** Un checkpoint parece más cercano a Commitment + Evidence fusionados |
| Evidence | `checkpoint_validations` | Parcial — validations es la definición, no la presentación |
| Intervention | `coach_notes` / `activities` | A confirmar |
| `human_assignment` | `users.coach_id` | Probablemente sí |
| ProgressEntry / Bitácora | `achieve_daily_logs` | A confirmar |
| — | `challenges`, `streaks`, `payments`, `leads` | Sin equivalente en Plataforma |

### Decisión — se integra el dominio, no los frontends

**Los dos codebases pueden seguir separados** en el corto y mediano plazo. Lo que **no** puede seguir
separado es el modelo: no deben evolucionar como dos productos con conceptos incompatibles.

| Quién | Qué es |
|---|---|
| **Achieve Plataforma** | **La fuente canónica** de compromisos, evidencias, lifecycle, readiness e intervenciones |
| **Dashboard_Achieve** | Una **superficie operativa** que consume esos contratos |

**El CTO versiona el contrato** con OpenAPI y/o esquemas de eventos versionados, con compatibilidad
explícita y registro de cambios. **No hace falta fusionar los codebases ahora.**

#### La terminología, resuelta — y `Checkpoint` no era lo que parecía

El hallazgo que abrió este ADR era que `checkpoints` de Dashboard *"parecía Commitment + Evidence
fusionados"*. **No lo es.** Son cuatro conceptos distintos, y confundirlos habría fusionado en uno
las dos cosas que el producto entero existe para separar:

| Concepto | Definición |
|---|---|
| `Commitment` | **Obligación concreta acordada con el estudiante** |
| `Checkpoint` | **Momento planificado de revisión o control** |
| `Evidence` | **Prueba presentada para demostrar el cumplimiento** |
| `CheckpointResult` | **Resultado de revisar uno o más compromisos y evidencias** |

Un `Checkpoint` **puede** revisar un compromiso, **puede** solicitar una evidencia y **puede**
producir un resultado — pero son entidades diferentes, con lifecycle propio. Que un momento de
revisión mire un compromiso no lo convierte en ese compromiso.

**Por qué importa tanto esta fila.** El invariante central de Achieve es *enviar no es suficiencia,
suficiencia no es validación, validación no es dominio*. Un objeto que fuera `Commitment` y
`Evidence` a la vez borraría el primer eslabón de esa cadena, y con él la distinción entre
comprometerse y cumplir.

#### Lo que queda por preparar

1. **La tabla de reconciliación completa** — con las filas que este ADR marcaba *"a confirmar"*:
   `Intervention` ↔ `coach_notes`/`activities`, `ProgressEntry` ↔ `achieve_daily_logs`, y los que no
   tienen equivalente (`challenges`, `streaks`, `payments`, `leads`).
2. **La propuesta de contrato v2**, que hoy sólo cubre autorización de padrón (v1): faltan actividad
   y contexto vivo, con endpoint, payload y SLA.

Las dos quedan en [`platform-integration-contract.md`](platform-integration-contract.md).

### Por qué se decidió ahora y no después

- **Antes de construir la fase de Operador** en el roadmap de Achieve Plataforma, hay que comparar
  la terminología con Dashboard_Achieve para no bautizar las mismas cosas con nombres distintos y
  tener que renombrar todo después.
- **Antes de que cualquiera de los dos llegue a producción**, hay que reconciliar el modelo. Ahora
  es barato porque ninguno tiene datos reales; después implica migración.

### Consecuencias mientras siga `PENDING`

- Fase B6 queda bloqueada.
- El Track A completo (Fase 0, solo estudiante) **no está bloqueado**: no toca el rol Operador más
  allá de `human_assignment` como referencia read-only, que ya tiene contrato de omisión segura.
- `product.md` documenta los términos de Plataforma como provisionales en lo que hace al rol
  Operador, y marca esta tabla como el punto de reconciliación.

---

<a id="adr-004"></a>
## ADR-005 — Motor de base de datos, auth y persistencia

**Estado:** ✅ **`ACCEPTED`** · Bloque A el 30 ago 2026; **ítems 4 y 6 del Bloque B cerrados el mismo día**
**Sigue `DEFERRED`:** sólo el ítem 5 (operación: Broadcast/outbox, rotación de secretos, observabilidad).
**Bloquea:** nada de la Fase B1.
**Relacionado:** `C01-001` (identidad/tenancy/esquema ADL), `C01-030` (autorización, permisos y
privacidad institucional), `C01-041` (Architecture/API/Data/Integration Spec).
**Toca:** `architecture.md`, `data-model.md`, `roadmap.md`.

### Alcance de la aceptación — 30 de agosto de 2026

**Aceptado (Bloque A), y ya no se vuelve a discutir sin un ADR que lo revierta:**

1. **Supabase** como Postgres gestionado + Auth.
2. **Scoping institucional en Service/Repository**, con **RLS deny-by-default** como defensa en
   profundidad — **las dos capas**, no una.
3. **Controller → Service → Repository**, con dependencias inyectadas. El runtime físico se puede
   mover después sin tocar dominio.

**Bloque B — ítems 4 y 6 cerrados el 30 de agosto de 2026 por el owner:**

**Ítem 4 · Storage de `Evidence` — la mitad técnica.** ✅ **Supabase Storage, bucket privado.**
`evidence_content.storage_ref` guarda **la clave del objeto, no una URL**: una URL guardada vence y
deja un dato muerto en la base.

**El navegador sube directo, con URL firmada de corta duración que emite el backend.** La firma
**es** el control de acceso: sin ella no hay subida, y el archivo no consume memoria ni tiempo del
servidor de aplicación. `R11` habla de tablas de negocio; el storage no es una tabla, y el backend
sigue decidiendo quién sube y dónde.

> ⚠️ **La otra mitad sigue abierta:** retención y borrado dependen de
> [ADR-006](#adr-006). El motor no.

**Ítem 6 · `institutionId` — ✅ tabla de correspondencia, con alta manual.**

Plataforma es dueña de su `institution.id`. El UUID que devuelve el CRM es **una identidad externa**
y se traduce.

**Lo decidió un precedente que ya estaba escrito:** `data-model.md` §6.1 dice que el `studentId` del
CRM *"es una identidad externa distinta… **nunca reemplaza `student.id`**"*. Ya se había elegido
esto para la entidad más importante; usar el criterio contrario con instituciones habrían sido dos
reglas de identidad en el mismo contrato.

Y el propio contrato lo respalda: *"cada uno tiene su propio proyecto Supabase… **nadie toca la base
del otro**"*. Compartir la clave primaria del tenant es la versión silenciosa de compartir base.

**Una institución desconocida NO se crea sola.** Si el CRM autoriza a un estudiante de una
institución que Plataforma no tiene mapeada, **la autorización se rechaza** y queda registrada para
alta manual. Dar de alta una institución es firmar un convenio, no un efecto secundario de un login.

**Sigue `DEFERRED`:**

| # | Qué | Bloquea |
|---|---|---|
| 5 | Operación: Broadcast/outbox, rotación de secretos, observabilidad | **`B3`** en adelante |

**Lo que esta aceptación NO habilita.** [ADR-006](#adr-006) sigue siendo bloqueo absoluto para
cualquier dato de una persona real: `B1` corre **sobre datos sintéticos**, y `B1.6` los exige de
forma explícita para sus contract tests.

### Consecuencia que hay que mirar de frente: esto acerca [ADR-003](#adr-003)

Ratificar Supabase **no decide** la convergencia con Dashboard_Achieve, que ya corre sobre Supabase
con 29 migraciones — pero **la hace más barata y por lo tanto más probable**. Dos productos sobre el
mismo proveedor tienden a compartir proyecto, y de ahí a compartir base hay un paso.

**El spec lo prohíbe** (Parte II §18.1: sin base de datos compartida con el CRM; la integración es
por contratos HTTP/eventos versionados), y esa prohibición **no se relaja por compartir proveedor**.
Queda escrito acá porque es el momento en que el riesgo aparece, no cuando alguien proponga la
migración.

### Contexto

El spec fuente fue escrito **a propósito sin decidir esto**: era un prototipo low-fi con fixtures y
cero backend. La declaración de datos del prototipo lista explícitamente como ausentes backend, API
propia, base de datos, autenticación, cookies de dominio, `localStorage` y persistencia entre
recargas.

El spec sí congela restricciones que cualquier opción debe cumplir:

- **Aislamiento institucional:** los datos de cada institución permanecen segregados lógica y
  contractualmente (Parte I §29).
- **RBAC por rol:** estudiante, operador, docente y autoridad no ven el mismo nivel de detalle.
- **Auditoría:** cambios de caminos, `RiskSignal`, `Evidence`, intervenciones y accesos críticos
  quedan registrados.
- **Sin base de datos compartida con el CRM.** La integración es por contratos HTTP/eventos
  versionados (Parte II §18.1).
- **Idempotencia real en el servidor.** El spec exige, para `Action`, `Commitment` y `Evidence`, que
  la deduplicación esté en el servicio propietario: "la protección real debe estar en el servicio
  propietario; el frontend solo no es suficiente".
- **Provenance en el dato, no en la vista:** `source_type`, `source_ref`, `observed_at`,
  `valid_from/valid_until`, `confidence`, `verification_status`, `uploaded_by`, `rights_status`.

En [`architecture.md`](architecture.md) hay una propuesta razonada con alternativas y trade-offs.
**Es una propuesta, no una decisión.**

### Nuevo insumo de arquitectura recibido — pendiente de aceptación

El 28 de agosto de 2026 se incorporó un diseño objetivo específico para el backend:

- Supabase como Postgres/Auth/Realtime Broadcast/Storage gestionado.
- Backend TypeScript en capas **Controller → Service → Repository**, con dependencias inyectadas.
- Toda lógica de negocio y autorización fina en Service; todo acceso a tablas en Repository.
- Frontend sin acceso directo a tablas: `/api/*` para negocio; cliente Supabase sólo para Auth y
  Broadcast.
- `service_role` únicamente en backend y RLS deny-by-default como cierre de la API autoexpuesta, no
  como autorización primaria.
- Constraints/índices/atomicidad en base; sin reglas de negocio en triggers o PL/pgSQL.

El mismo paquete aportó el contrato vigente de autorización CRM, documentado en
[`platform-integration-contract.md`](platform-integration-contract.md). Esto convierte el vacío de
`C01-041` en un artefacto parcial y reduce `C01-039`, pero no resuelve Storage/permisos de Evidence,
operación/runtime ni los flujos futuros de `C01-040`.

### Qué falta decidir — **y no hace falta decidirlo todo junto**

Los seis ítems no tienen el mismo peso ni bloquean lo mismo. **La Fase B1 sólo necesita los tres
primeros**, que son *ratificaciones* de un diseño que ya existe; los otros tres son *diseño
todavía por hacer* y bloquean fases posteriores.

Verificado contra `roadmap.md`: `B1.1`–`B1.5` no tocan Storage de `Evidence` —eso aparece recién en
**`B2.3`**— ni Broadcast. Sólo `B1.6` necesita el ítem 6.

#### Bloque A — lo que B1 necesita. Son ratificaciones, no diseño

| # | Qué se ratifica | Opciones reales | Recomendación *(no vinculante)* |
|---|---|---|---|
| 1 | **Supabase** como Postgres + Auth | (a) Supabase · (b) Postgres gestionado + auth propia · (c) otro BaaS | **(a).** El equipo ya lo opera en producción con 29 migraciones; RLS nativo encaja con el aislamiento institucional que exige Parte I §29 |
| 2 | **Scoping en Service/Repository + RLS deny-by-default** como defensa en profundidad | (a) las dos capas · (b) sólo RLS · (c) sólo Service | **(a).** (b) mete reglas de negocio en la base, que el propio diseño prohíbe; (c) deja la API autoexpuesta sin cierre |
| 3 | **Controller → Service → Repository**, y dónde corre | (a) capas + runtime junto al frontend · (b) capas + servicio aparte · (c) sin capas | **(a) o (b);** lo que no es opción es (c). El runtime se puede mover después sin tocar dominio |

**Coste de equivocarse en el Bloque A: bajo.** `data-model.md` escribe el schema en **SQL estándar de
Postgres** y marca qué es específico del proveedor, así que (1) es reversible con trabajo acotado.

#### Bloque B — se puede diferir sin frenar B1

| # | Qué falta | Qué bloquea | Por qué puede esperar |
|---|---|---|---|
| 4 | **Storage de `Evidence`:** motor, permisos, retención, borrado | `B2.3` | La *retención y el borrado* dependen de [ADR-006](#adr-006), que tiene el plazo más largo. El *motor* no |
| 5 | **Operación:** Broadcast/outbox, rotación de secretos, observabilidad | `B3` en adelante | Es operación, no dominio. No cambia el schema |
| 6 | **`institutionId`: ¿identidad compartida con CRM o tabla de correspondencia?** | `B1.6` | `B1.1`–`B1.5` no lo tocan. Depende de `C01-039` y de [ADR-003](#adr-003) |

> **Recomendación de secuencia (no vinculante):** aceptar **ADR-005 alcanzado al Bloque A**, con el
> Bloque B declarado `DEFERRED` y su fase bloqueada marcada. Eso desbloquea `B1.1`–`B1.5` sin
> comprometer nada de lo que todavía no está diseñado, y es lo que el propio criterio de Done de la
> Fase B0 admite: *"`ACCEPTED` **o explícitamente `DEFERRED`** con su fase bloqueada marcada"*.

### Insumos relevantes, NO decisión

El equipo ya opera **Supabase** en producción para Dashboard_Achieve (Postgres, auth, RLS, storage,
29 migraciones). Esto es un insumo fuerte para el ADR — familiaridad del equipo, RLS nativo que
encaja con el aislamiento institucional, storage integrado para Evidence — pero
**no se toma como decisión** hasta que el owner del producto lo confirme, y su elección interactúa
con [ADR-003](#adr-003).

El diseño objetivo recibido hace explícita la preferencia por Supabase y por la arquitectura en
capas. Se conserva como recomendación concreta en `architecture.md`; este ADR permanece `PENDING`
porque un documento adjunto no reemplaza la aceptación explícita exigida por las reglas de ADR.

### Consecuencias

- **`B1.1`–`B1.5` quedan desbloqueadas.** `B1.6` espera el ítem 6.
- El Track A no está afectado.
- `data-model.md` diseña el schema en **SQL estándar de Postgres**, que es portable entre las
  alternativas más probables, y marca explícitamente qué construcciones son específicas del proveedor.

---

<a id="adr-006"></a>
## ADR-006 — Privacidad y consentimiento de datos reales

**Estado:** 🟡 `PROVISIONAL — LEGAL CONFIRMATION REQUIRED` · 1 de septiembre de 2026 ·
**decidido por el owner, sujeto a validación legal** · **PRIORIDAD MÁXIMA**
**Bloquea:** **cualquier fase que toque datos reales de estudiantes.** Bloqueo absoluto, **y sigue
en pie**: las decisiones de abajo son de producto y **no levantan el gate**. Lo levanta el dictamen
legal más la autorización institucional.
**Relacionado:** `C01-042` (golden dataset, adquisición y legalidad, gate `P`), `C01-017`
(privacidad y retención de Evidence/Reflection), `C01-030`, `C01-046` (métricas institucionales).
**Toca:** `product.md`, `architecture.md`, `data-model.md`, `roadmap.md`.

### Contexto

**Todo el spec fuente corre sobre datos sintéticos a propósito.** La declaración de cero datos reales
del prototipo es explícita: sin nombres, correos, imágenes, cursos, notas, evaluaciones, calendarios,
Evidence, instituciones, docentes, operadores ni estudiantes reales.

El único contrato que toca esto, `C01-042` (golden dataset, adquisición y legalidad), está gateado
explícitamente **"antes de piloto institucional"** y sigue sin resolver. `C01-017` (privacidad y
retención de Evidence/Reflection) también sigue `OPEN`.

El spec fuente además prohíbe explícitamente pruebas con estudiantes en el gate actual: "Student
Comprehension Testing: `NOT AUTHORIZED`", "no se autorizan estudiantes".

### Qué falta decidir

Las cinco preguntas, con opciones. **Tres las puede contestar producto hoy; dos necesitan asesoría
legal**, y esa separación es la que permite avanzar en paralelo en vez de esperar a un solo bloque.

> ⚠️ **Este ADR no da asesoramiento legal y no cita normativa como si fuera un hecho verificado.**
> Donde abajo se nombra la ley argentina de protección de datos personales (**25.326**) o su
> autoridad de aplicación (**AAIP**), es para que asesoría legal **confirme o corrija** el marco
> aplicable y su estado vigente — incluida cualquier reforma posterior. Nada de esto se implementa
> sobre la palabra de este documento.

#### 1. Base legal y consentimiento — **necesita asesoría legal**

| Opción | Qué implica | Coste |
|---|---|---|
| (a) **Consentimiento del estudiante**, otorgado en el producto | El estudiante es el titular y decide. Revocable | Hay que diseñar el flujo de revocación y qué pasa con lo ya producido |
| (b) **Convenio institucional**, la universidad aporta la base | Menos fricción de alta | El estudiante no eligió. Choca con *"agregado por defecto"* si la institución asume que puede ver todo |
| (c) **Las dos**: convenio para el padrón, consentimiento para lo que el estudiante produce | Separa *estar habilitado* de *entregar tu trabajo* | Dos artefactos que mantener |

**Recomendación (no vinculante): (c).** Es la que ya está implícita en el producto — el padrón se
autoriza por CRM (`platform-integration-contract.md`) y la `Evidence` la produce el estudiante.

**Preguntas para asesoría, no para producto:** qué base legal aplica a cada mitad; **si hay
estudiantes menores de edad** y qué cambia; qué exige la revocación sobre datos ya derivados.

#### 2. Qué ve la institución — **producto puede decidirlo hoy**

El spec ya congela la regla: *"agregado por defecto; detalle individual sólo cuando está autorizado y
es necesario para intervenir"*, y prohíbe exponer chats, reflexiones o evidencia cruda por defecto.
**Falta la implementación, no la regla.**

| Qué definir | Opciones |
|---|---|
| **Umbral de agregación** | (a) `n` mínimo por cohorte antes de mostrar cualquier métrica · (b) sin umbral |
| **Cómo se autoriza el detalle** | (a) el estudiante lo habilita · (b) lo habilita una intervención registrada · (c) rol institucional con `audit_log` |
| **Qué nunca se expone** | `Reflection`, contenido crudo de `Evidence`, mensajes — **con o sin autorización** |

**Recomendación (no vinculante):** umbral `n` mínimo, detalle por intervención registrada y
auditada, y una lista corta de campos **jamás exponibles** escrita en `data-model.md` como
constraint, no como convención.

#### 3. Retención y borrado — **producto decide, asesoría confirma plazos**

| Objeto | Opciones de retención |
|---|---|
| `Evidence` (archivo) | (a) mientras dure el cursado · (b) N ciclos · (c) hasta que el estudiante lo borre |
| `Reflection` | (a) igual que Evidence · (b) más corta: es lo más íntimo del producto |
| `product_event` / `audit_log` | **Append-only.** El borrado de un dato personal **no** puede borrar el rastro de auditoría — hay que decidir cómo se concilia |

**El punto difícil, y hay que nombrarlo:** `B1.5` exige `audit_log` **append-only**, y un derecho de
supresión empuja en la dirección contraria. La salida habitual es **borrar el contenido y conservar
el hecho** (quién, cuándo, sobre qué objeto), pero eso es exactamente lo que asesoría tiene que
validar antes de que se escriba el schema.

#### 4. Derechos sobre el material académico (`rights_status`) — **producto decide**

| Opción | Qué implica |
|---|---|
| (a) **Sólo se enlaza** el material de cátedra; nunca se copia | Cero riesgo de derechos. Depende de que el enlace siga vivo |
| (b) **Se almacena** con `rights_status` declarado | Sobrevive al enlace roto. Hay que sostener el estado |
| (c) Mixto: se enlaza lo de terceros, se almacena lo que produce el estudiante | — |

**Recomendación (no vinculante): (c).** Es coherente con lo que el producto ya hace: la `Evidence` es
del estudiante; el recurso de cátedra es de la cátedra. `UX09` ya dice *"RECURSO CONFIGURADO"* y no
lo copia.

#### 5. Golden dataset — **bloqueado por 1, y es el de plazo más largo**

`C01-042` está gateado *"antes de piloto institucional"*. **No se puede elegir universidad y carrera
antes de saber con qué base legal se piden los datos**, así que esta pregunta **depende de la 1** y
no se puede adelantar.

Lo que sí se puede hacer sin decidir nada: **seguir con el catálogo sintético**, que es lo que el
Track A ya usa y lo que `B1.6` exige explícitamente para los contract tests del CRM.

### Decisiones de producto — `PROVISIONAL`, 1 de septiembre de 2026

> ⚠️ **Cada una de estas decisiones está sujeta a validación legal y ninguna habilita datos reales.**
> Se registran ahora para que el producto pueda seguir construyéndose contra un criterio explícito en
> vez de contra el vacío, y para que el paquete legal tenga algo concreto que confirmar o corregir.
> Las preguntas para asesoría están en [`legal-package.md`](legal-package.md).

#### 1. Visibilidad institucional

- La institución ve **por defecto información agregada** por cohorte, carrera, comisión y materia.
- **No ve** evidencia cruda, reflexiones, conversaciones ni perfiles individuales.
- Un **caso individual identificable** se habilita únicamente:
  - con **consentimiento explícito, informado, específico y revocable** del estudiante;
  - para una **finalidad y un plazo determinados**;
  - o bajo otra base legal **expresamente validada** por asesoría jurídica.
- **Que la institución pague no implica acceso a la información individual.** Es la regla que el
  propio spec fuente ya declaraba, y acá queda como decisión y no como advertencia.
- Achieve accede a los datos individuales **estrictamente necesarios** para prestar el acompañamiento
  contratado, con permisos por rol y **trazabilidad de accesos**.
- Los agregados institucionales aplican un **umbral mínimo de anonimato**. ⚠️ **El número exacto lo
  confirma asesoría legal** — sin él, un agregado de una comisión chica identifica personas.

#### 2. Retención y borrado

| Qué | Plazo provisional |
|---|---|
| **Evidencias crudas** | hasta **90 días** después de cerrar el compromiso, examen o intervención al que pertenecen |
| **Reflexiones y contenido personal** | mientras el servicio esté activo, y hasta **12 meses** desde la última actividad |
| **Historial estructurado de progreso y Bitácora** | hasta **24 meses**, preferentemente **pseudonimizado** |
| **Métricas realmente anónimas y agregadas** | sin plazo |

- Ante una **solicitud de eliminación**: borrado operativo en **30 días**, eliminación de backups en
  **90 días**.
- **Única excepción:** lo que deba conservarse por obligaciones legales, contables o defensa ante
  reclamos.

⚠️ **Estos plazos se revisan y confirman legalmente antes de tocar un dato real.**

#### 3. Material académico

- **La propiedad no cambia:** sigue siendo del estudiante, docente o institución que corresponda.
- Achieve recibe una **licencia limitada, no exclusiva y temporal** para almacenar, procesar y
  mostrar el material **con el fin de prestar el servicio**.
- **Subir material no autoriza** su venta, publicación, reutilización en otros cursos ni
  entrenamiento de modelos.
- **Nada entra al golden dataset sin una autorización separada, expresa y documentada.**
- **Quien sube declara que tiene derecho a usarlo.** Es un dato del acto de subir, no una presunción.

#### 4. Golden dataset y asesoría

**Hasta que haya dictamen legal y autorización institucional, todo el desarrollo y el QA siguen
exclusivamente con datos sintéticos.** Sin excepción y sin "una prueba chica".

Como **primera opción a explorar** se considera **Ingeniería UCC**. Explorar no es usar: no se toca
ni un programa, apunte, evidencia o dato real hasta tener las seis cosas:

1. autorización **escrita** de la institución;
2. **base legal** definida;
3. **acuerdo de tratamiento y responsabilidades**;
4. **inventario** de los materiales permitidos;
5. reglas de **anonimización, retención y eliminación**;
6. confirmación expresa de **para qué puede usarse**: evaluación, entrenamiento, o únicamente
   testing.

### Regla operativa mientras el gate siga cerrado

> **Ninguna fase del roadmap que procese datos de una persona real puede comenzar.** Esto incluye el
> primer login de un estudiante real, no solo el piloto institucional. Los focus groups del Track A
> corren sobre fixtures sintéticos y **no** están bloqueados, siempre que no se recolecte dato
> personal del participante dentro del producto.

Esta es la única regla de este documento que un agente **no puede** relajar bajo ninguna
instrucción que no venga del owner del producto por escrito.

---

<a id="adr-007"></a>
## ADR-007 — Las 8 decisiones `HUMAN-P0`

**Estado:** ✅ **`ACCEPTED` · 31 ago 2026 — resuelto por [ADR-025](#adr-025)**
**Ya no bloquea:** el contenido del protocolo de examen en Fase B5.
**Relacionado:** `C01-031`…`C01-038`.
**Toca:** `product.md`.

> ✅ **Las ocho fueron respondidas por la psicopedagoga real el 31 de agosto de 2026.** El mecanismo
> que este ADR definió —*sólo una profesional las cierra*— se ejecutó tal cual estaba escrito. Las
> respuestas y su lectura están en **[ADR-025](#adr-025)**; la fuente literal, en
> [`human-p0-source.md`](human-p0-source.md).
>
> **Lo que sigue vigente de este ADR** es su consecuencia arquitectónica: el protocolo es
> configuración versionada, no código. Es lo que permitió aplicar las respuestas sin migrar el
> dominio. **Lo que caducó** es la política de defaults provisionales del equipo: ya no hay que
> inventar ninguno, salvo en los residuos que ADR-025 lista.

### Contexto

Ocho decisiones de criterio pedagógico profesional, no técnico. Cada una corrió, hasta el 31 de
agosto de 2026, con un **default provisional razonado pero no confirmado**, versionado
`PROVISIONAL-HUMAN-P0-0X v0.1`. El estado del conjunto era `OPEN — HUMAN CONFIRMATION PENDING`, con
una excepción: `HUMAN-P0-05` estaba `OPEN — POTENTIALLY ANSWERED — REQUIRES SOURCE CONFIRMATION` —
**y la fuente lo confirmó.**

Cubren: el contenido base de los 20 pasos del protocolo, cómo se resume el seguimiento del
aprendizaje, si producir un apoyo cuenta como aprendizaje, qué hacer en las últimas 24 horas, qué
cuenta como señal real de aprendizaje, cuándo se necesita revisión humana, los criterios de
corrección para práctico y teórico escrito, y qué es el análisis posterior al examen.

El detalle completo de cada default está en [`product.md`](product.md) §Reglas provisionales y en
[`pending-decisions-annex.md`](pending-decisions-annex.md).

### Decisión — la política que rigió hasta que llegaron las respuestas

**No se resuelven ni se cambian desde este repositorio.** Ningún agente de IA puede cerrarlas: son
de criterio profesional y requieren la voz de una psicopedagoga real. **Esa voz llegó, y por eso
este ADR está cerrado** — no porque la regla se haya relajado.

Mientras no estuvieron, se aplicó exactamente la política del spec fuente:

1. Cada default se identifica en `product.md` como **"default provisional, pendiente de confirmación
   profesional"**, con su ID canónico y su versión.
2. Se **sigue usando el default tal como está documentado** hasta que se confirme lo contrario.
3. Cuando un default afecta copy, criterio o comportamiento visible, la UI lo rotula internamente
   como asunción provisional.
4. El software soporta un **CORE versionable con variantes por modalidad**. Los 12 pasos `EP-01`…
   `EP-12` del spec y los 20 IDs de la matriz `PE-PSY` **no se hardcodean**: son configuración.
5. Cambiar la versión de un default no reescribe historia ni convierte fixtures pasados en hechos.

### Consecuencia arquitectónica

`ExamProtocol` / `ProtocolVersion` / `ProtocolStep` se modelan como **configuración versionada**, no
como código ni como enum, para que la definición pedagógica pueda cambiar sin migrar el dominio
central. Esto está reflejado en [`data-model.md`](data-model.md).

**Y esto es lo que se cobró el 31 de agosto.** Las respuestas de la profesional cambiaron el
contenido de cuatro de las ocho decisiones respecto del default del equipo. Con el protocolo como
configuración, eso es **cargar otra versión**; hardcodeado, habría sido migrar el dominio para
cambiar una regla pedagógica. Ver [ADR-025](#adr-025).

---

<a id="adr-008"></a>
## ADR-008 — Stack y runtime del frontend

**Estado:** `ACCEPTED` · 28 ago 2026
**Toca:** `architecture.md`, `roadmap.md`.

### Contexto

El prototipo corre sobre una combinación poco habitual: Next.js 16.2.6 App Router **servido por
vinext 0.0.50 + Vite 8**, con destino Cloudflare Workers (`@cloudflare/vite-plugin`, wrangler 4.92,
un `worker/index.ts`). No usa `next dev` ni `next build`; usa `vinext`.

Esto tiene consecuencias:

- `vinext` está en versión `0.0.50`. Es una dependencia joven en el camino crítico del build.
- El build corre a través de `scripts/build-verified.sh`, que requiere GNU `timeout` y falla con
  código 69 si `vinext` no está instalado.
- Dashboard_Achieve, el otro codebase del equipo, usa **Next.js 16 estándar**.

Lo que **sí** hay que preservar de ese stack, porque el sistema visual depende de ello:

- **Tailwind v4 en modo CSS-first** (sin `tailwind.config.js`), con `@theme inline` y `@utility`.
- El CSS vendorizado `vendor/shadcn-tailwind-4.13.0.css`.
- React 19.

### Propuesta

**Next.js 16 estándar** (`next dev` / `next build`), sin `vinext` ni Cloudflare Workers en el Track A.

Razones:

1. **Convergencia con el otro codebase del equipo.** Dashboard_Achieve ya es Next 16 estándar; si
   [ADR-003](#adr-003) termina en convergencia, tener dos runtimes distintos es deuda pura.
2. **Track A no necesita el runtime de Workers.** Es una experiencia clickeable con fixtures: no hay
   backend, no hay optimización de imágenes en el edge, no hay bindings de D1 ni R2 (el
   `localBindingConfig` del prototipo los declara vacíos).
3. **Menos superficie de fallo en el camino crítico.** El scaffold tiene que compilar de forma
   confiable para que la Fase 0 avance; `vinext 0.0.50` es un riesgo evitable.
4. Tailwind v4, shadcn y React 19 funcionan idénticamente en ambos.

La decisión de runtime de producción del Track B (Vercel, Cloudflare, contenedor propio) se difiere y
depende de [ADR-005](#adr-005).

### Alternativas

- **Conservar vinext + Cloudflare Workers.** Ventaja: el prototipo ya está probado ahí y el deploy al
  edge es barato. Desventaja: divergencia con Dashboard_Achieve, dependencia joven, y complejidad que
  el Track A no usa.
- **Vite + React sin Next.** Ventaja: el más simple para una app puramente cliente. Desventaja: se
  pierde el App Router y habría que rehacer el routing al entrar al Track B.

### Consecuencias

- Se descartan `worker/index.ts`, `vite.config.ts`, `scripts/build-verified.sh`,
  `scripts/sites-env.sh` y `scripts/install-ci.sh`.
- `package.json` pasa a `next dev` / `next build` / `next start`.
- Los tests dejan de depender de `dist/server/index.js`; pasan a Vitest sobre componentes, alineado
  con Dashboard_Achieve.

---

<a id="adr-009"></a>
## ADR-009 — Colisión de namespace `D1–D25` vs `D1–D10`

**Estado:** `ACCEPTED` · 28 ago 2026
**Toca:** `product.md`, `design-system.md`, `domain-translation-dd1-dd10.md`.

### Contexto

Hay dos registros distintos que usan el mismo prefijo `D`:

- **Spec de producto, Parte I §30:** `D1`…`D25` son el registro de decisiones de producto
  (`D1 Sistema académico integral`, `D6 Humano como componente deliberado`, `D15 Academic Data Layer
  como core`…).
- **Manual de diseño, §1:** `D1`…`D10` son las preguntas de traducción al dominio
  (`D6 ¿Cuáles son los 3 o 4 eventos que merecen color?`).

La colisión ya produjo ambigüedad real: `app/globals.css` dice *"semánticos: EXACTAMENTE 3, por D6"*,
refiriéndose al `D6` del manual de diseño, no al `D6` del spec de producto.

### Decisión

Renombrar en la documentación de este repositorio:

- Las decisiones de producto conservan `D1`…`D25` (son las que más se citan en el spec fuente y
  renombrarlas rompería la trazabilidad).
- Las preguntas de traducción al dominio pasan a **`DD1`…`DD10`** (*Domain Design*), con una tabla de
  equivalencia en [`design-system.md`](design-system.md).

La nomenclatura quedó confirmada al usarse en
[`domain-translation-dd1-dd10.md`](domain-translation-dd1-dd10.md).

---

<a id="adr-010"></a>
## ADR-010 — Respuestas DD1–DD10 de traducción al dominio

**Estado:** `ACCEPTED` · 28 ago 2026 — **con `DD4` en `DEFERRED`**
**Toca:** `design-system.md`, `domain-translation-dd1-dd10.md`.

### Contexto

El manual de diseño es **normativo** y exige, como su primera regla `DEBE`, completar la fase de
traducción al dominio antes de aplicar cualquier otro principio:

> *"DEBE completarse antes de aplicar el resto del manual. Si sos una IA y no tenés estas respuestas,
> pedilas."* … *"Prohibido inventar contenido de dominio."*

Su auditoría de conformidad §7, Bloque 1, exige: *"D1 a D10 contestadas y escritas, no supuestas"* y
*"La acción irreversible está identificada por nombre"*.

Cuando se levantó este ADR, esas respuestas **no estaban registradas como decisiones canónicas del
repositorio**: `design-system-source.md` las contiene como preguntas, no como respuestas de Achieve.

### Resolución

**Las respuestas existían.** Se decidieron en conversación directa entre el owner del producto y un
asistente de IA el 28 de agosto de 2026, durante el diseño del sistema visual, **antes de que
existiera este repositorio**, y nunca se escribieron a un archivo. El owner las aportó y quedaron
registradas en **[`domain-translation-dd1-dd10.md`](domain-translation-dd1-dd10.md)**, que es a
partir de ahora el owner canónico de esas diez respuestas.

Esto explica retroactivamente varias decisiones que ya estaban implementadas en el código sin que
constara su fundamento: los tres colores semánticos (`DD6`), el pager `MateriasQueue` de Hoy (`DD7`)
y la línea `Porque:` del Hero (`DD10`).

### Decisión

| ID | Respuesta | Estado |
|---|---|---|
| `DD1` | **Ninguna acción irreversible dentro de la app**, a propósito. El único momento sin vuelta atrás —rendir— pasa afuera de Achieve | ✅ |
| `DD2` | **Doble reloj:** hora del Commitment acordado (primero) y días hasta el examen (segundo) | ✅ |
| `DD3` | **Sí:** la cátedra/institución. Activa `P-08`, ya implementado como "Cátedra y vos" | ✅ |
| `DD4` | Vocabulario académico argentino: `parcial`, `final`, `TP`, `cursada`, `cátedra`, `comisión`… | ⚠️ **`DEFERRED`** |
| `DD5` | **Ninguna magnitud de máquina visible.** `P-03` se cumple no mostrándola | ✅ |
| `DD6` | **Exactamente 3:** éxito, urgencia, intervención humana. Riesgo queda sin color | ✅ |
| `DD7` | *"¿Me comprometo con esta acción?"* — resuelto con cola paginable en la lista de materias, sin tocar el Hero | ✅ |
| `DD8` | Defaults ya resueltos en el spec Parte II §21 | ✅ |
| `DD9` | **Una `Action` a la vez** — el Hero de Hoy | ✅ |
| `DD10` | **Por qué esa acción va primero** — la línea `Porque:` | ✅ |

**`DD4` queda `DEFERRED`** porque es la única sin confirmación explícita del owner del producto. Se
revisa junto con el glosario completo de [`product.md`](product.md) §3. **No bloquea ninguna etapa de
la Fase 0.**

### Consecuencias

- La auditoría de conformidad visual, Bloque 1, **pasa** — salvo la revisión pendiente de `DD4`.
- **`P-11` se resuelve por `DD1`:** Achieve no necesita patrón de deshacer ni confirmación con
  consecuencia enunciada en ningún flujo del Track A, porque no hay acción irreversible.
  ⚠️ **Esta respuesta se revisa si el Track B introduce una** (datos reales, pagos, borrado
  definitivo).
- **`P-05` se desbloquea por `DD2`:** el orden por defecto de las listas prioriza Commitment por
  vencer y luego proximidad del examen, sin fusionarlos en un número.
- **`P-10` se resuelve por `DD7`** con la tensión ya arbitrada: la cola se aplica a la lista de
  materias, no al Hero.
- **Resabio detectado:** `--chart-2` en `app/globals.css` sigue siendo `#ff9500`, el naranja original
  de `DD6` antes de la corrección a rosa/magenta. El propio CSS declara que los charts heredan de los
  tres semánticos, así que ese valor quedó huérfano. Se reconcilia en la Etapa 0.1.

<a id="adr-011"></a>
## ADR-011 — Owner canónico de `PreparationReadiness` (CR-UX08-01)

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Cierra:** `CR-UX08-01`, la contradicción estructural que el spec fuente registraba sin resolver.
**Desbloquea:** la representación visible de readiness en la Fase B5.
**Relacionado:** `C01-029` (readiness scoped), `C01-025`…`C01-028`.
**Toca:** `data-model.md`.

> ⚠️ **[ADR-025](#adr-025) no lo desbloquea, y conviene decir por qué.** Al cerrarse las ocho
> `HUMAN-P0` es tentador dar readiness por resuelta: no lo está. Lo que este ADR discute es **quién
> es el owner canónico del dato** —entidad separada, `status` de `ExamPreparation`, o ambos—, y eso
> es una contradicción **estructural** del spec, no una pregunta pedagógica. La profesional no fue
> consultada sobre esto ni podría haberlo sido. **Sigue `PENDING`.**
>
> Lo que sí aportan las respuestas es **insumo para los umbrales** cuando esta contradicción se
> resuelva: qué cuenta como señal de aprendizaje (`HUMAN-P0-05`) y qué es el núcleo mínimo con menos
> de 24 horas (`HUMAN-P0-04`) son entradas directas de `C01-029`.

### Contexto

Este ADR **no lo introduzco yo**: es una contradicción estructural que el propio spec fuente registra
como `CR-UX08-01`, prioridad P1 arquitectónica.

El modelo de datos:

- incluye `BUILDING`, `READY_BY_PROTOCOL` y `NOT_READY` dentro de **`ExamPreparation.status`**;
- define además una entidad separada **`PreparationReadiness`** con `state`, `required_steps`,
  `evidence_status`, `autonomous_practice`, `simulation` y `critical_gaps`;
- usa `NOT_READY → BUILDING → READY_BY_PROTOCOL` como los estados P0 de readiness.

No queda congelado si readiness es una entidad separada, un status de `ExamPreparation`, o ambos;
ni cuál es la fuente canónica.

### Qué falta decidir

Entidad/campo canónico, owner, relación entre el lifecycle y readiness, mapping, transición e
historia.

### Decisión — `PreparationReadiness` es la fuente canónica

**Hay una sola verdad sobre readiness, y vive en `PreparationReadiness`.** `ExamPreparation` sigue
siendo la entidad que representa la preparación general del examen, pero **no mantiene una segunda
verdad independiente** sobre si el estudiante está listo.

| Pieza | Qué le toca |
|---|---|
| **`PreparationReadiness`** | El estado —`BUILDING`, `READY_BY_PROTOCOL`, `NOT_READY`— **más sus señales, su explicación, la versión de la regla que lo calculó, la fecha de cálculo y los overrides autorizados** |
| **`ExamPreparation`** | Referencia el readiness vigente, o lo expone como **proyección de lectura** por rendimiento |
| Campos duplicados que hoy existan en `ExamPreparation` | **Derivados y no escribibles por separado** |

**Toda modificación entra por la fuente canónica**, y después se actualizan las proyecciones. Nunca
al revés: una proyección que se puede escribir es una segunda fuente con otro nombre.

**Y una regla de producto que va con la decisión:** el producto **no presenta readiness como certeza
predictiva de aprobación**. Lo que comunica es *"preparación según el protocolo de Achieve"*.
`READY_BY_PROTOCOL` significa que el protocolo se cumplió, no que el examen se va a aprobar — y la
diferencia es exactamente la que separa un acompañante de una promesa que el producto no puede
sostener.

**Por qué esta forma y no la otra.** El campo dentro de `ExamPreparation` habría sido más corto de
escribir y no tiene dónde poner lo que hace que readiness sea legible: **la explicación, las señales
que lo produjeron y la versión de la regla**. Un estado sin su explicación es un veredicto, y este
producto no emite veredictos sobre personas.

### ✅ Ejecutada — Fase B5, 1 de septiembre de 2026

La tabla `preparation_readiness` existe, con estado, señales, explicación **obligatoria**, versión de
la regla que lo calculó, fecha de cálculo y overrides. Y `ExamPreparation` **perdió los tres estados
de readiness**: `BUILDING`, `READY_BY_PROTOCOL` y `NOT_READY` salieron de su `CHECK`, del tipo
`ExamPreparationStatus` y de la máquina de transiciones. La segunda verdad no quedó desalentada:
quedó imposible de escribir.

> ⚠️ **Nadie escribe esa tabla todavía, y no es un olvido.** Los umbrales son `C01-029`, abierto: qué
> cuenta como señal suficiente lo fija la psicopedagoga con el insumo de `HUMAN-P0-04` y
> `HUMAN-P0-05`. Hasta entonces rige lo que este ADR dejó vigente —**sin card, sin score, sin
> cálculo**— y `UX08` muestra el `status` recibido con su descargo al lado. La tabla existe para que
> el día que haya regla no haya además que decidir dónde vive el resultado.

### Lo que estuvo vigente mientras el ADR estuvo abierto

Sin card de readiness, sin score, sin cálculo. Se puede mostrar el `status` recibido de
`ExamPreparation` y los lifecycles operativos. `READY_BY_PROTOCOL` nunca se presenta como predicción
ni garantía de aprobación — es una condición del protocolo, no un pronóstico.

---

<a id="adr-012"></a>
## ADR-012 — Alcance de Track A: Operador e Institución se difieren

**Estado:** `ACCEPTED` · 28 ago 2026
**Toca:** `roadmap.md`.

### Contexto

El spec define **cinco superficies de Operador e Institución** que no existen en ningún lado — ni
como componente, ni siquiera en el arnés QA descartado:

| Wireframe | Superficie |
|---|---|
| `WF-O01` | Cola priorizada de intervención |
| `WF-O02` | Contexto de estudiante (<10 segundos) |
| `WF-O03` | Registrar intervención + outcome |
| `WF-O04` | Revisión de evidencia |
| `WF-I01` | Dashboard institucional mínimo |

El spec es enfático en que **el operador es usuario P0** (Parte I §21.0): *"El operador no es un
parche humano detrás de la app"*, y *"el golden path del MVP incluye tanto el flujo del estudiante
como el flujo paralelo del operador"*.

Pero el objetivo inmediato del Track A es un MVP con lindo diseño para **focus groups con
estudiantes**, testeando comprensión y flujo del loop diario.

### Decisión

**La Fase A1 se difiere al Track B.** No entra en el Track A.

Razones:

1. Los focus groups son con estudiantes. Las vistas de Operador no aportan a ese test.
2. Construirlas ahora significa bautizar el vocabulario del rol Operador **antes** de reconciliarlo
   con Dashboard_Achieve ([ADR-003](#adr-003)) — exactamente el renombrado masivo que ese ADR quiere
   evitar.

### Consecuencias

- La Fase A1 sale del Track A y su contenido se absorbe en la **Fase B6** (Risk, Intervención y
  Operador), que ya está gateada por [ADR-003](#adr-003).
- **La Fase 0 pasa a ser el Track A completo.** Cerrarla cierra el track.
- Queda pendiente de evaluar, cuando se llegue a B6, si `WF-O04` (revisión de evidencia) merece una
  versión mínima anticipada: es la contraparte del estado `UNDER_REVIEW` que el estudiante **sí** ve
  en el Track A, y sin ella el loop de evidencia no se puede demostrar completo.

<a id="adr-013"></a>
## ADR-013 — Contenido duplicado en `pending-decisions-annex.md`

**Estado:** `ACCEPTED` · 28 ago 2026
**Toca:** `pending-decisions-annex.md`.

### Contexto

El archivo contiene su contenido **dos veces**:

- Líneas 1–96: versión markdown formateada, con tablas.
- Líneas 97–198: el mismo contenido pegado en texto plano, con las tablas como texto separado por
  tabulaciones.

Las dos versiones **no son idénticas**. La versión plana incluye una sección que la markdown no
tiene: **"Decisión agregada — diseño del pipeline del Academic Decision Engine"**, que es
precisamente la propuesta citada en [ADR-004](#adr-004). Si alguien lee solo la mitad formateada, se
pierde esa fila entera.

### Decisión

Deduplicar: se conserva la versión markdown y se **porta a ella la sección del pipeline del ADE** que
solo existía en la copia plana. El archivo sigue siendo un documento vivo y se actualiza cuando
alguna de las 51 filas se resuelva.

### Consecuencias

- El archivo pasa de 198 a ~110 líneas, sin pérdida de contenido.
- La decisión agregada del pipeline del ADE ahora es visible en la versión formateada, y queda
  enlazada desde [ADR-004](#adr-004).
- **Ninguna de las 51 filas cambia de estado.** Siguen 51 `OPEN`.

---

<a id="adr-014"></a>
## ADR-014 — Desktop-first, y qué pasa con el contrato del primer viewport

**Estado:** `ACCEPTED` · 29 ago 2026
**Toca:** `AGENTS.md`, `CLAUDE.md`, `architecture.md`, `design-system.md`,
`design-system-capturas.md`, `roadmap.md`.
**Resuelve:** [`design-system-capturas.md`](design-system-capturas.md) §12.1.
**Desbloquea:** §12.7 (posición de la CTA principal en desktop), que dependía de esta decisión.

### Contexto

El repositorio decía **dos cosas distintas al mismo tiempo**:

- [`AGENTS.md`](../AGENTS.md) §5, [`CLAUDE.md`](../CLAUDE.md), [`architecture.md`](architecture.md)
  §2.6 y [`design-system.md`](design-system.md) §6.1 establecían **mobile-first a 360 px** como regla
  del Track A.
- La conducción del producto indicó el **28 de agosto de 2026** que Achieve se piensa
  **desktop-first**, escalando el mismo lenguaje visual a móvil.
  [`design-system-capturas.md`](design-system-capturas.md) se escribió siguiendo esa indicación y
  registró el conflicto en su §12.1 **sin tocar** §6.1.

**Qué estaba realmente en juego.** No era una preferencia de ancho. `design-system.md` §6.1 no define
un breakpoint: define el **contrato del primer viewport** —el orden exacto de siete elementos above
the fold y qué está prohibido entre el estado y la CTA—. Ese contrato es el criterio que hace
verificable el test de comprensión de 10 segundos. Estaba escrito *a 360 px*, y esa medida era lo
único que lo hacía falsable. Desktop-first no lo invalidaba, pero lo dejaba sin criterio de
verificación.

### Decisión

**1. Achieve es desktop-first.** El viewport primario de diseño y de verificación es desktop.

**2. El contrato del primer viewport de §6.1 deja de estar atado a 360 px y pasa a ser un contrato de
orden semántico, obligatorio en todo viewport.** Los siete elementos, su orden, y la lista de lo
prohibido entre el estado y la CTA **no cambian**. Lo que cambia es que ya no se enuncian como una
propiedad de la pantalla de 360 px, sino de toda pantalla de decisión.

**3. Se verifica en dos anchos:**

| Ancho | Rol | Qué se verifica |
|---|---|---|
| **Desktop** | Primario | El contrato de orden completo. Es donde se corre el test de 10 segundos |
| **360 px** | Piso obligatorio de la variante móvil | El mismo contrato de orden, sin pérdida de información |

360 px deja de ser *la medida de referencia* y pasa a ser *el piso que no se puede romper*. Una
pantalla que cumple el contrato en desktop y lo pierde a 360 px **no está terminada**.

**4. `design-system.md` §6.2 (Desktop) pasa de apéndice a sección primaria**, y §6.1 se reencuadra
como el contrato transversal. La proporción 2/3 Hero + 1/3 contexto y la regla de que el panel
lateral no contiene CTAs competidoras se conservan tal cual.

### Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Reescribir §6.1 solo en términos de desktop, y definir móvil después | Deja las etapas 0.4–0.7 sin criterio verificable en móvil y saca el 360 px del Done de la Fase 0. El contrato se vuelve más débil, no más claro |
| Mantener mobile-first e interpretar que "desktop-first" aplicaba solo a la exploración visual de `design-system-capturas.md` | Contradice la indicación explícita de la conducción del 28 de agosto de 2026 |

### Consecuencias

- `AGENTS.md` §5, `CLAUDE.md`, `architecture.md` §2.1/§2.6 y `roadmap.md` cambian
  *"mobile-first a 360 px"* por *"desktop-first; 360 px es el piso obligatorio de la variante
  móvil"*.
- `design-system.md` §6.1 conserva **el mismo contrato**, reencuadrado como viewport-agnóstico; §6.2
  pasa a primaria. Ningún token, ninguna primitiva y ningún principio cambian.
- `design-system-capturas.md` §12.1 pasa de `PENDING` a **`RESUELTO por ADR-014`**. Su §13 deja de
  registrar el conflicto como abierto.
- **§12.7 queda desbloqueado** pero **sigue `PENDING`**: dónde vive la CTA principal en desktop
  —píldora negra arriba a la derecha, como en las capturas, o a ancho completo al final del primer
  viewport— es una decisión propia que este ADR no toma. Se cierra antes de la Etapa 0.4.
- El criterio de Done de la Fase 0 *"el test de comprensión de 10 segundos ejecutado con personas
  reales"* se corre **en desktop**.
- **No afecta a la Etapa 0.1.** El scaffold no depende del breakpoint.

---

<a id="adr-015"></a>
## ADR-015 — Dónde vive la CTA principal en desktop

**Estado:** `ACCEPTED` · 29 ago 2026
**Toca:** `design-system.md`, `design-system-capturas.md`.
**Resuelve:** [`design-system-capturas.md`](design-system-capturas.md) §12.7.
**Depende de:** [ADR-014](#adr-014), que lo desbloqueó sin decidirlo.

### Contexto

`design-system-capturas.md` §12.7 dejó `PENDING` la posición de la CTA principal en desktop, con dos
candidatas:

- **a ancho completo al final del primer viewport**, como dice `design-system.md` §6.1 — que era una
  definición móvil;
- **píldora negra arriba a la derecha**, con ancho de contenido, como se observó en las capturas.

La Etapa 0.4 (`UX07`) es la primera pantalla que necesita la respuesta.

**El hallazgo.** La pregunta estaba mal planteada, no sin responder. §12.7 razonó desde las capturas
anonimizadas, que son de **otro producto**. La spec de Achieve tiene wireframes desktop propios y
normativos para `UX07`, y ya contestan:

> **`product-spec-source.md` §VI.7 §21.2 — Jerarquía visual · Desktop**
> *"Columna principal: identidad, datos, razón y decisión. Columna secundaria: efecto real,
> continuidad de Cursado y provenance expandida. **Una sola CTA primaria.** … El ancho adicional no
> agrega protocolo, analytics ni cronograma."*

Y §24.1 la dibuja: la CTA ocupa **el ancho completo de la columna principal, al final de ella**, con
el retorno seguro en la columna secundaria.

[`AGENTS.md`](../AGENTS.md) §8 fija el orden de precedencia: `product-spec-source.md` está **por
encima** de `design-system.md` y de cualquier extracción visual.

### Decisión

**La CTA principal va a ancho completo al final de la columna principal**, en un layout de dos
columnas: principal con identidad, datos, razón y decisión; secundaria con efecto real, continuidad y
provenance expandida. **Una sola CTA primaria por pantalla y por estado.** El retorno seguro vive en
la columna secundaria y **nunca se estiliza como primaria**.

La píldora negra arriba a la derecha **se descarta**: pertenece al producto de las capturas, no a
Achieve.

**Regla general que este ADR fija, más allá de `UX07`:** cuando `design-system-capturas.md` y una
spec `VI.*` describan lo mismo, **manda la spec**. Las capturas aportan vocabulario visual, no
contrato de layout.

### Consecuencias

- `design-system.md` §6.2 deja de remitir a §12.7 como `PENDING` y describe el layout de dos
  columnas con la CTA al final de la principal.
- `design-system-capturas.md` §12.7 pasa a **`RESUELTO por ADR-015`**.
- **La Fase 0 se queda sin decisiones abiertas.** §12.7 era la última.
- Las etapas 0.5 y 0.6 no vuelven a preguntarlo: `UX08` y `UX09` heredan la regla.
- No afecta al contrato de orden semántico de §6.1, que ADR-014 dejó viewport-agnóstico.

---

<a id="adr-016"></a>
## ADR-016 — Ninguna CTA del registro canónico lleva a `UX07`

**Estado:** ✅ `ACCEPTED` · **Opción A** · 1 de septiembre de 2026 · **decidido por el owner**
**Toca:** `product-spec-source.md` Parte III §5 (registro canónico), `product.md` §10.3.
**Detectado en:** Etapa 0.4, al construir `UX07`.
**No bloquea:** la Etapa 0.4. `UX07` se construye igual, con ruta propia.

### Contexto

Al transcribir el registro canónico de CTAs en la Etapa 0.3 y revisar los 18 destinos, **`UX07` no
aparece en ninguno**:

```
UX01 · UX02 · UX03 · UX04 · UX05 · UX06 · UX08 · UX09
EJECUCION · UX04_RENEGOCIACION · UX04_RESCATE
```

Sin embargo, `product-spec-source.md` §VI.7 §9 describe **dos entradas** a la superficie:

1. **Recomendación automática** — una señal propietaria ya emitida presenta una `ExamPreparation`
   `RECOMMENDED`. Eso no es una CTA: es una señal.
2. **Entrada manual contextual** — *"el estudiante llega desde Materia/Cursado con un
   `CourseEnrollment` de origen inmutable y una `Assessment` existente de esa materia"*. Eso **sí**
   describe una navegación `UX02 → UX07`, y **no tiene CTA en el registro**.

El registro es explícito en que *"ningún otro artifact mantiene una copia normativa"*, así que
agregar una `CTA-019` sería inventar una regla de negocio que ninguna fuente respalda
([AGENTS.md](../AGENTS.md) §1.1).

### Opciones

| # | Opción | Costo |
|---|---|---|
| A | Falta una CTA en el registro: se agrega `UX02 → UX07` como `CTA-019` y se corrige el spec | Toca la fuente normativa; requiere quien la posea |
| B | La entrada manual no es una CTA sino una affordance de `UX02` no registrada | Deja `UX02` con una navegación sin contrato observable |
| C | `UX07` se alcanza **sólo** por recomendación automática, y §9 describe un flujo futuro | Deja sin implementar la entrada manual, que §9 y §13 detallan largo |

### Decisión — Opción A

**La ausencia era un olvido del registro, no una decisión.** §9 y §13 describen la entrada manual con
demasiado detalle —selección entre `Assessments` del mismo `CourseEnrollment`, revisión,
confirmación— como para que se la haya omitido a propósito. Se agrega `CTA-019`:

| Campo | Valor |
|---|---|
| Origen | `UX02` |
| Condición | Assessment existente y elegible en la misma cursada |
| Acción | preparar el examen |
| Destino | `UX07` |
| Resultado autoritativo | **ninguno; navegación** |
| Fallback | permanecer en la materia |
| Estado de error | mostrar Modo Examen no disponible; no presumir preparación |

**Navegar no activa nada.** Llegar a `UX07` no crea `ExamPreparation` ni la pone `ACTIVE`: eso sigue
siendo `CTA-011`, con confirmación explícita del estudiante. La distinción importa porque es la que
impide que una CTA de navegación se convierta en una mutación encubierta.

**Aparece sólo si hay evaluación elegible**, y si no la hay **no se renderiza** —ni siquiera
deshabilitada—: el estudiante no puede crear una `Assessment` desde `UX02`, porque dar de alta una
evaluación no registrada **no se implementa** (Etapa 0.4). Una CTA deshabilitada que nadie puede
habilitar es peor que ninguna.

**`product-spec-source.md` no se edita** (`AGENTS.md` §1.1). La corrección vive en este ADR, en
`product.md` §10.3 y en el registro ejecutable, que la marca como la única fila que no transcribe la
tabla del spec. Hay un test que exige que toda CTA fuera del spec esté respaldada por un ADR
`ACCEPTED`.

### Lo que se destrabó

**El recorrido del focus group ya no necesita al facilitador.** `UX07` era la única estación sin CTA
que la respaldara, y el guion marcaba ese paso como navegación de la persona que conduce la sesión.
Ahora se llega por clic desde la materia, que es de donde el spec decía que se llegaba. De las dos
costuras declaradas del recorrido queda **una**: `UX05`, que se alcanza cruzando `ejecución`, un nodo
sin pantalla.

Y **ninguna superficie del menú depende ya sólo del menú**: la navegación lateral vuelve a ser
orientación y no el único camino a una pantalla.

---

<a id="adr-017"></a>
## ADR-017 — Las dos CTAs que `product.md` §10.2 dejaba ambiguas

**Estado:** `ACCEPTED` · 29 ago 2026
**Toca:** `product.md` §10.2, `lib/domain/precedence.ts`, `lib/content/hero.ts`.
**Detectado en:** Etapa 0.2, al mapear nivel → copy. Resuelto en la Etapa 0.7.

### Contexto

`product.md` §10.2 resume la tabla de precedencia del Hero y en dos niveles ofrece **dos verbos sin
decir cuál aplica cuándo**:

| Nivel | Lo que dice §10.2 |
|---|---|
| 3 | `Commitment CONFIRMED/DUE, o rescate materializado` → *"Ver compromiso" / "Empezar"* |
| 8 | `Evidence informativa sin acción posterior` → *"Ver evidencia" / "Ver avance"* |

Por eso `lib/content/hero.ts` cubría 5 de los 9 niveles desde la Etapa 0.2, y las etapas siguientes lo
arrastraron como decisión abierta.

**El hallazgo.** No era una decisión abierta: era **un resumen que perdió el discriminador**. La spec
lo dice completo, y en tres lugares distintos:

> **`product-spec-source.md` §VI.1 §3.2**
> Nivel 3 — *"**Ver compromiso si es próximo**; **Empezar** / **Empezar rescate** **si es startable
> now**. Se decide por lifecycle y tiempo acordado, no por prioridad académica."*
> Nivel 8 — *"**Ver evidencia / Ver avance según lifecycle**."*

> **§VI.1 §5** — `COMMITMENT_CONFIRMED` → *"Ver compromiso si es próximo; Empezar si es startable
> now"*. `EVIDENCE_VALIDATED` → *"Ver avance"*.

> **§VI.2 — CTA por lifecycle** — *"Commitment futuro → Ver compromiso"*; *"Commitment startable →
> Empezar"*; *"Evidence enviada sin nueva acción → Ver evidencia"*; *"Evidence validada sin nueva
> acción → Ver avance"*; *"rescue materializado startable → Empezar rescate"*.

Es el mismo patrón que [ADR-015](#adr-015): la respuesta existía en la fuente de mayor precedencia y
se había perdido en un documento derivado. [`AGENTS.md`](../AGENTS.md) §8 pone
`product-spec-source.md` por encima de `product.md`.

### Decisión

**El discriminador del nivel 3 es el tiempo acordado del Commitment; el del nivel 8 es el lifecycle
de la Evidence.** No hay nada que inventar:

| Condición | CTA |
|---|---|
| Commitment **próximo** (acordado a futuro) | `Ver compromiso` |
| Commitment **startable now** | `Empezar` |
| Rescate materializado y **startable now** | `Empezar rescate` |
| Evidence **enviada** (`SUBMITTED` / `UNDER_REVIEW`), sin acción posterior | `Ver evidencia` |
| Evidence **validada**, sin acción posterior | `Ver avance` |

**Corolario que §10.2 también había perdido:** `RESCUE_MATERIALIZED` **no es un nivel propio**.
§VI.1 §3.2 lo dice explícitamente — *"no describe por sí solo qué necesita hacer el alumno ahora,
por eso participa en la precedencia según su lifecycle real"*: una Action de rescate `IN_PROGRESS`
es nivel 1, `EVIDENCE_PENDING` es nivel 2, y un Commitment de rescate `CONFIRMED`/`DUE` es nivel 3.
Un compromiso actual **no** es desplazado por un rescate anterior sólo por ser un rescate.

### Consecuencias

- `product.md` §10.2 se corrige: los dos niveles ambiguos pasan a declarar su discriminador, y se
  agrega la regla de `RESCUE_MATERIALIZED`.
- `selectHeroLevel` deja de tratar `MATERIALIZED` como un nivel 3 automático y pasa a devolver
  **nivel + variante**, como ya hacían `UX08` y `UX09`.
- `lib/content/hero.ts` cubre los **nueve** niveles y sus variantes. La cobertura parcial que la
  Etapa 0.2 declaró a propósito deja de existir.
- La Etapa 0.7 puede renderizar los nueve niveles de `UX01`.

---

<a id="adr-018"></a>
## ADR-018 — El lenguaje visual sale de las capturas, y hay que mirarlas

**Estado:** `ACCEPTED` · 30 ago 2026
**Toca:** `AGENTS.md`, `CLAUDE.md`, `design-system.md`, `design-system-capturas.md`, `roadmap.md`.
**Precisa:** [ADR-015](#adr-015), sin contradecirlo. Ver *Reconciliación*.
**Depende de:** [ADR-006](#adr-006), que es la razón de la parte incómoda.

### Contexto

La conducción del producto pidió, el 30 de agosto de 2026, que **Achieve se construya desktop-first
bajo el diseño de `docs/diseño/`**, y que el resultado **se parezca al software de esas capturas**.

`docs/diseño/` tiene **34 PNG** de **Zop**, un producto B2B real de gestión de marcas. De ahí sale el
lenguaje visual que Achieve quiere: navegación lateral con ítem activo en píldora, topbar con
breadcrumb y buscador `⌘K`, tarjetas de radio generoso con hairlines, subcopy explicativa bajo cada
título de sección, controles segmentados en píldora, dock inferior persistente, vacíos que explican
en vez de decir "sin datos".

**El problema con la regla tal como se pidió.** Las 34 capturas **no están versionadas**: el
`.gitignore` las excluye desde el primer commit porque contienen **datos de un sistema real** —
nombres completos de clientes, un estudio jurídico identificable, cantidades de expedientes—. Es
[ADR-006](#adr-006).

Una regla que diga *"andá siempre a `docs/diseño/`"* funciona en la máquina donde están las
capturas y **falla en silencio en cualquier otra**: otro agente, otra máquina, CI o un compañero ven
una carpeta vacía y, sin una instrucción explícita, improvisan un diseño creyendo que cumplen.

### Decisión

**1. Achieve es desktop-first y su lenguaje visual sale de las capturas.** El objetivo declarado es
que el producto se parezca al de `docs/diseño/`.

**2. Antes de tocar UI hay dos anclas, y las dos son obligatorias:**

| Ancla | Qué es | Dónde vive |
|---|---|---|
| **Las capturas** | La fuente. Se **abren y se miran** antes de diseñar cualquier pantalla | `docs/diseño/*.png`, **local, nunca versionado** |
| **La extracción** | El contrato de layout, anonimizado y versionado | [`design-system-capturas.md`](design-system-capturas.md) |

**3. Si `docs/diseño/` está vacía, el agente lo dice y para.** No improvisa un lenguaje visual, no lo
deduce de lo que ya existe en el repo y no sigue como si nada. Decir *"no tengo las capturas"* es la
respuesta correcta; inventar un diseño no lo es.

**4. Las capturas siguen fuera del repositorio.** No se commitean, ni siquiera recortadas. Su
contenido de dominio —marcas, expedientes, clientes, el nombre del estudio— **no se copia jamás**:
de Zop se toma el **mecanismo visual**, nunca su contenido.

**5. `design-system-capturas.md` se mantiene sincronizado.** Cuando las capturas muestren un patrón
que el documento no describe, se agrega al documento. Es el único artefacto que viaja, así que si no
está ahí, para el resto del mundo no existe.

### Reconciliación con [ADR-015](#adr-015)

ADR-015 dijo: *"cuando `design-system-capturas.md` y una spec `VI.*` describan lo mismo, manda la
spec. Las capturas aportan vocabulario visual, no contrato de layout."*

**Sigue vigente, y este ADR lo precisa** separando dos preguntas que se estaban mezclando:

| Pregunta | Quién manda |
|---|---|
| **Qué dice la pantalla** — qué objeto, qué estado, qué CTA, qué se omite, qué no se promete | **La spec `VI.*`.** Siempre. Las capturas no tienen ninguna autoridad de dominio |
| **Cómo se ve** — shell, densidad, tipografía, espaciado, forma de los controles | **Las capturas**, y su extracción versionada |

No hay conflicto porque nunca hablaron de lo mismo. Lo que ADR-015 resolvió —dónde va la CTA
principal en desktop— era **contrato de pantalla**, y por eso ganó la spec. El shell de la aplicación
es **lenguaje visual**, y ahí manda la captura.

Cuando los dos hablen del mismo píxel, sigue mandando la spec, **y se registra el choque** en
`design-system-capturas.md` §12 en vez de resolverlo en silencio.

### Consecuencias

- `AGENTS.md` gana un paso obligatorio antes de tocar UI, con la instrucción explícita de frenar si
  las capturas no están.
- Se abre la **Fase A2 — Shell de aplicación** en el roadmap. La Fase 0 se cerró sin este objetivo y
  no se le mueve el arco: cambia el marco que contiene a las nueve superficies, no su contenido.
- **Lo que la Fase A2 no toca:** dominio, fixtures, registro de CTAs, las tres matrices de
  precedencia, los estados críticos y el guion del focus group. Todo eso ya está y no depende del
  shell.
- El riesgo que este ADR **no** elimina: mientras las capturas no viajen, un agente en otra máquina
  sólo tiene la extracción textual. Por eso la sincronización de `design-system-capturas.md` deja de
  ser una cortesía y pasa a ser parte del trabajo.

---

## ADR-019 — El dock inferior no se construye, y la primitiva `Ausencia` ocupa su etapa

**Estado:** `ACCEPTED` · 30 ago 2026
**Toca:** `roadmap.md` (Fase A2), `design-system-capturas.md` §12.8, `design-system.md` §3.2.
**Corrige:** [ADR-018](#adr-018), que enumeró el dock entre los patrones a tomar sin advertir que
`design-system-capturas.md` §7.4 ya lo había descartado.

### Contexto

El roadmap de la Fase A2 abrió una etapa **A2.3 — Dock inferior**: *"lo que quedó abierto,
persistente entre superficies"*. Al abrir las capturas para especificarla —regla de `AGENTS.md`
§1.5— resultó que **la fuente misma dice que no**.

La captura 07 del manual visual documenta el dock y cierra la sección con dos bloques literales:

> **Dónde no:** productos de tarea única, flujos lineales, o cualquier cosa que se use
> mayoritariamente en móvil. **Ahí el dock es puro costo.**

> **Requisitos innegociables del multi-ventana.** Si vas a hacer ventanas internas, **todo** esto es
> obligatorio. Si no podés cumplirlo, **no lo hagas**: una vista dividida de dos paneles resuelve el
> 80 % del problema al 10 % del costo.
>
> 1. URL por ficha · 2. Botón Atrás definido · 3. Trampa de foco y orden de tabulación ·
> 4. Jerarquía de `Escape` con dos capas · 5. Comportamiento del dock a escala · 6. Límite duro de
> fichas abiertas.

**Achieve es exactamente el caso que el manual excluye:** un flujo lineal (`UX01`→`UX09`) de una
decisión por pantalla (`DD9`). No tiene dos objetos abiertos a la vez porque su unidad de trabajo es
**una Action**.

`design-system-capturas.md` ya lo había registrado en **tres lugares distintos** —§7.4 (*"requiere
multiventana"*), §10.1 (*"no aplica"*) y §11.3 (*"lo que no se copia aunque esté bien hecho"*)— y
`A-07`, uno de los nueve anti-patrones catalogados, **es un defecto del dock**: ya trunca títulos
con dos elementos abiertos.

**De dónde salió el error.** La tabla de brecha de la Fase A2 se armó mirando las capturas y
listando lo que Achieve no tenía. El dock entró en esa lista por ser visible, sin cruzarlo contra
§7.4. Es la misma falla que produjo el defecto `A-03` en la Etapa A2.1: **tomar la superficie de una
captura en vez de su razonamiento.**

### Decisión

**1. No se construye el dock inferior.** No hay etapa, no hay componente, no hay deuda pendiente:
queda descartado, no diferido.

**2. El trabajo que el dock decía resolver ya está resuelto.** *"No perder el lugar"* en un producto
lineal lo contesta el **breadcrumb** de la Etapa A2.1, que muestra el camino completo y el objeto
actual. Un dock encima duplicaría esa función y agregaría una segunda lista de destinos que compite
con la navegación lateral.

**3. Un test estático prohíbe reintroducirlo**, del mismo modo que los tests de la Etapa 0.3
verifican la dirección de dependencias. Una regla sin test se pierde en dos meses.

**4. La etapa A2.3 se reasigna a la primitiva `Ausencia`**, que sí sale de las capturas (§1.6, tres
tratamientos observados en columnas contiguas de la misma tabla), sí está declarada faltante
(`design-system.md` §3.2) y sí sirve al invariante más caro de Achieve: **sin datos no es cero**.

### Consecuencias

- La Fase A2 pasa de **6 etapas a 5**. Se achica quitando trabajo que la propia fuente desaconseja.
- ADR-018 queda corregido en un punto: su enumeración de patrones a tomar incluía el dock. **El resto
  de ADR-018 no se toca.**
- La regla de `AGENTS.md` §1.5 funcionó como se esperaba —abrir las capturas antes de tocar UI
  evitó construir la etapa equivocada—, pero funcionó **tarde**: el error ya estaba escrito en el
  roadmap. Se agrega a §1.5 el paso de cruzar contra §7.4/§11.3 **antes de anotar un patrón como
  brecha**, no sólo antes de implementarlo.

---

## ADR-020 — Cuántas clases de ausencia distingue Achieve, y con qué palabras

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Bloquea:** nada. La Etapa A2.3 entregó la primitiva; esto refinó qué dato usa cuál.
**Sale de:** [ADR-019](#adr-019), al migrar el booleano `ausente` a tipos.

### Contexto

`P-09` exige distinguir **vacío, no-cargado, sin-asignar y cero**. La Etapa A2.3 tipó los
tratamientos y resolvió tres de los cuatro sin inventar nada: *cero real* es un valor con cifra
tabular, *no cargado* no ocurre bajo la regla de cero red del Track A, y *no hay dato* se resuelve
omitiendo la fila entera (*omitir, no inventar*).

Queda uno abierto, y se ve en un fixture que ya se contradice a sí mismo. `FX-LOCAL-PROG-SIN-CAMBIO-EXPLICITO`
declara *"los tres estados de no-cambio, **distinguibles entre sí**"* y lista:

| Fila | Qué significa | Cómo se ve |
|---|---|---|
| *Recorrido: conserva su estado* | El owner **declaró** que no hubo cambio | itálica atenuada |
| *Dominio: no evaluado* | La dimensión **nunca se midió** | itálica atenuada |
| *Confianza: alta · declarada ayer* | Dato presente | normal |

**Los dos primeros son hechos distintos y se ven igual.** Un no-cambio declarado es información
positiva —alguien miró y dijo que no cambió—; *no evaluado* es la ausencia de esa mirada. El
invariante *"sin datos no es cero"* separa justamente esas dos cosas, y hoy la interfaz las funde.

### Qué hay que decidir

1. **¿Son dos clases de ausencia o son dos copys de la misma clase?** Si son dos, hace falta un
   tratamiento visual más, y `design-system-capturas.md` §1.6 sólo tiene tres, todos ya asignados.
2. **¿Cuál es el vocabulario canónico?** `design-system.md` §4.1 nombra *"no evaluado"* ≠ *"no
   disponible"* ≠ `0`. *"conserva su estado"* no está en esa lista y aparece sólo en un fixture.
3. **¿Un no-cambio declarado es una ausencia?** Se puede argumentar que **no** lo es —es un dato
   confirmado por una persona— y que entonces debería verse como dato presente, con su provenance.
   Esa lectura cerraría la decisión sin agregar tratamiento visual, pero **cambia lo que la pantalla
   afirma**, y eso es dominio.

### Por qué no lo cerró un agente

La pregunta 3 decide **qué afirma el producto** sobre un dato, no cómo se pinta. `AGENTS.md` §1.5 es
explícito: qué dice la pantalla lo manda la spec, no las capturas. Y ninguna spec `VI.*` define
*"conserva su estado"*.

### Decisión — un no-cambio declarado **no es una ausencia**

**Es un dato.** Alguien miró y confirmó que la dimensión no cambió: eso es información positiva, y se
muestra como dato presente, con su fuente. *"No evaluado"* y *"sin información"* siguen siendo
ausencias tipadas, con su itálica atenuada.

Tres consecuencias, y las tres importan:

1. **No hace falta un cuarto tratamiento visual.** `design-system-capturas.md` §1.6 observó tres y
   los tres están asignados; inventar uno más habría sido dibujar sin captura que lo respalde. La
   distinción sale de algo que ya existe: **dato** contra **ausencia**.
2. **Se ve sin color.** Una fila tiene tratamiento de dato y la otra de ausencia, así que imprimir en
   blanco y negro no pierde la diferencia. Es lo que `P-09` exige y lo que la Etapa 0.7 verificó con
   `grayscale(1)`.
3. **El no-cambio lleva su fuente.** Una afirmación sobre un dato la lleva (`P-08`); una ausencia no
   tiene fuente que citar, y por eso `fuenteSinCambio` es `null` cuando el bloque son puras
   ausencias. La distinción es verificable, no estética.

**El vocabulario canónico no cambia.** `design-system.md` §4.1 sigue nombrando *"no evaluado"* ≠ *"no
disponible"* ≠ `0` **para las ausencias**. *"Conserva su estado"* deja de ser candidato a esa lista
porque ya no es una de ellas.

**Lo que esta decisión cambia y hay que decir de frente:** la pantalla ahora **afirma** algo que
antes atenuaba. Si el owner del progreso declara un no-cambio, el estudiante lo lee como un hecho
—porque lo es—. Eso descansa en que `progress_entry.explicit_no_change` sólo lo escribe el owner del
dato, que es justamente lo que `I10` garantiza.

---

## ADR-021 — Qué es, en Achieve, el «trabajo pendiente que caduca»

**Estado:** `ACCEPTED` · 30 ago 2026
**Toca:** `lib/navigation/menu.ts`, `design-system-capturas.md` §14.2 (`D-06`).
**Delegado por el owner** el 30 de agosto de 2026, con la pregunta abierta en §14.3.

### Contexto

La captura 02 fija una regla precisa para el badge del menú:

> Un solo badge numérico en todo el menú: **el del trabajo pendiente que caduca**. Si todo tiene
> badge, nada tiene badge.

La Etapa A2.1 puso un contador en **Progreso**. La comparación de la A2.5 lo marcó como `D-06`: la
Bitácora no caduca. Al abrirlo aparecieron **dos problemas, no uno**.

### Decisión

**1. Lo que caduca en Achieve es el `Commitment`.**

Es el único objeto que el estudiante **acordó hacer para un momento**, y al pasar ese momento cambia
a `MISSED` de forma irreversible — el invariante dice que *un `Commitment` `MISSED` nunca se edita
para parecer cumplido*. Esa irreversibilidad **es** la caducidad.

Nada más en el producto caduca:

| Objeto | Por qué no |
|---|---|
| `Action` recomendada | No vence: la reemplaza la siguiente |
| `Evidence` `SUBMITTED` | Espera a otra persona. El estudiante no puede actuar sobre ella |
| Bitácora / Progreso | Sólo acumula. No hay nada que se pierda por no mirarlo |
| Modo Examen | El examen tiene fecha, pero la **preparación** no vence: se sigue trabajando |

**Corolario: el badge no va en Progreso.** Estaba en la única superficie que no tiene nada que
vencer. Su lugar es `Hoy`, que es donde la matriz de precedencia de `UX01` ya eleva el `Commitment`
(`COMMITMENT_NEXT`, `COMMITMENT_MISSED`).

**2. Y todavía no se dibuja, en ninguna.**

El número que había era un **literal `1`** en `menu.ts`: una cifra en pantalla sin un hecho detrás.
Eso es peor que estar en el ítem equivocado — es el reverso de *sin datos no es cero*.

Bajo el Track A cada ruta proyecta su propio escenario, y **sólo `/hoy` conoce el estado del
`Commitment`**. Un badge real aparecería en `Hoy` y desaparecería en las otras tres superficies, y el
estudiante leería esa ausencia como *"no hay nada por vencer"*. **Un badge intermitente miente más
que un badge ausente.**

Así que el contador se retira, y **vuelve cuando haya de dónde contarlo**: con el `Commitment` como
fuente y en `Hoy`. El componente ya sabe dibujarlo.

### Por qué esto no es inventar una regla de negocio

No define un contrato nuevo: **lee** los que ya están escritos. Que el `Commitment` tenga hora
acordada y transición a `MISSED` está en `data-model.md` y en las máquinas de estado; que `UX01` lo
eleve está en su matriz de precedencia. La decisión es **de traducción visual**, que es lo que
`AGENTS.md` §1.5 asigna a las capturas.

Lo que sí quedaría abierto —**cuántos** commitments cuenta el badge, y si cuenta los `MISSED` además
de los que vencen— no hace falta contestarlo mientras el badge no se dibuje.

### Consecuencias

- `tests/shell.test.tsx` verifica `A-03` sobre un **ítem sintético** con contador, no sobre el menú de
  producción. La regla del componente se sigue probando aunque ningún ítem real lleve número — atarla
  al menú la haría dejar de verificarse justo cuando el menú cambia.
- Un guard nuevo impide que vuelva a colarse un contador literal sin fuente.
- **Sigue habiendo cero badges, que es lo que la regla pide** mientras no haya uno que se gane el
  lugar: *si todo tiene badge, nada tiene badge*.

---

## ADR-022 — `C-04` elevado: el vacío argumenta, y la tercera cláusula es condicional

**Estado:** `ACCEPTED` · 30 ago 2026 · **decidido por el owner**
**Toca:** `design-system.md` §4.4 y §7, `design-system-capturas.md` §12.2 y §14.2 (`D-04`).
**Cierra:** §12.2, abierta desde que se escribió `design-system-capturas.md`.

### Contexto

`design-system-capturas.md` §1.4 registró el hallazgo más fuerte de las capturas: el vacío del panel
de contactos **no dice qué va a aparecer, dice por qué importa que aparezca**.

> *"Sin contactos cargados. Es el dato que hace que la cuenta se pueda atender sin preguntarle a
> quien la abrió."*

§12.2 lo dejó como propuesta con un argumento en contra escrito: eleva la deuda de contenido que
`C-07` ya declara, y *"cada vacío pasa de una frase a dos, y las dos mienten si cambia la regla"*.

**Dos precisiones sobre qué estaba escrito y qué no**, porque el ADR tiene que ser honesto sobre su
propio punto de partida:

1. **`design-system.md` tenía sólo la primera cláusula:** *"Los estados vacíos explican qué va a
   aparecer"*. **La cláusula «por qué importa» es decisión nueva del 30 de agosto de 2026**, no algo
   que ya estuviera aprobado y sólo faltara aplicar.
2. **El manual normativo tenía una tercera que §12.2 no menciona.** `design-system-source.md`:
   *"C-04 (DEBERÍA) Los estados vacíos explican qué va a aparecer ahí **y cómo hacer que
   aparezca**."* Es distinta de «por qué importa», y ya era normativa.

### Decisión

**`C-04` queda con tres cláusulas, y la tercera es condicional:**

| Cláusula | Cuándo |
|---|---|
| **Qué va a aparecer** | Siempre |
| **Por qué importa** | Siempre |
| **Cómo hacer que aparezca** | **Sólo si la aparición depende de una acción del estudiante** |

**La condición es la parte que importa.** Cuando el dato no aparece por algo que el estudiante pueda
hacer, el vacío queda en **dos cláusulas**. **No se inventa una acción falsa para completar el
patrón**: darle una palanca que no tiene es peor que un vacío corto, y es exactamente la clase de
promesa que el resto del producto evita.

Se ve en los tres vacíos que la decisión tocó:

| Vacío | Cláusulas | Por qué |
|---|---|---|
| `EVIDENCIA.SIN_ADJUNTO` | **3** | El estudiante adjunta. La palanca es suya |
| `HOY.VACIO` | **2** | La próxima acción la produce el Academic Decision Engine |
| `OVERVIEW.SIN_RECORRIDO` | **2** | El recorrido lo arma el servicio propietario |

**Tratamiento visual.** Párrafo de `--text-label`, ancho máximo ~380 px (§9.2). **Nunca itálica
atenuada:** ése es el tratamiento de `SIN_ASIGNAR` ([ADR-019](#adr-019)), y **un vacío que explica no
es un dato que falta**. Usar el mismo gris en itálica para las dos cosas rompe la distinción que
`P-09` obliga a sostener.

### Qué responde al argumento en contra de §12.2

§12.2 objetaba que *"las dos frases mienten si cambia la regla"*. Sigue siendo cierto, y por eso la
deuda queda **acotada, no negada**: son tres vacíos, todos en `lib/content/es-AR.ts` con ID, que es
lo que `C-07` pide justamente para que una regla que cambia se corrija en un lugar.

### Consecuencias

- **`OVERVIEW.SIN_RECORRIDO` era un rótulo con nada debajo** — el caso más puro del defecto. Ahora la
  sección explica. Se agregó `OVERVIEW.SIN_RECORRIDO_EXPLICA`; el rótulo no cambió.
- **`HOY.VACIO` pasó a decir *"Hoy no hay"* en vez de *"No hay"***: es una **ausencia confirmada**
  —el ADE respondió que no hay recomendación—, no una carga pendiente, y el copy no debe dejar creer
  que algo está por llegar.
- `D-04` de §14.2 queda cerrada.

---

## ADR-023 — La ingesta del ADL se construye antes que el ADE, y empieza asistida

**Estado:** `ACCEPTED` · 30 ago 2026 · **decidido por el owner**
**Abre:** Fase B2b — Ingesta del Academic Data Layer.
**No cerró en ese momento:** [ADR-004](#adr-004) (el ADE) ni `C01-042` (golden dataset y legalidad).
Después, ADR-004 quedó `ACCEPTED (v1 provisional)`; `C01-042` sigue `OPEN`.

### Contexto

La Etapa B2.5 iba a reemplazar los fixtures por llamadas reales y al mirarla apareció que **el
producto no se mueve solo**: faltan dos productores.

| Falta | Qué produciría | Estado |
|---|---|---|
| **El reloj del lifecycle** | `CONFIRMED → DUE → MISSED` por paso del tiempo | ✅ Construido bajo [ADR-024](#adr-024), con ventana provisional por `C01-010` |
| **El ADE** | Las `Action` con estado `RECOMMENDED`, y `ACADEMIC_CONTEXT_INCOMPLETE` | ✅ [ADR-004](#adr-004), `ACCEPTED (v1 provisional)` |

`product.md` §226 es explícito: *"la UI **no** declara `MISSED` ni `DUE` por el paso del tiempo. Lo
hace el owner del lifecycle."*

El owner pidió construir el Engine. **Lo que describió no era el ADE sino la ingesta del ADL** — el
glosario los separa: el **ADL** contesta *"¿qué sabemos de esta realidad universitaria?"*; el **ADE**,
*"¿qué conviene hacer ahora?"*. El ADE decide **sobre** el ADL, así que sin ADL poblado no tiene
sobre qué decidir.

### Decisión

**1. Se construye primero la ingesta del ADL**, como fase propia. No requiere [ADR-004](#adr-004).

**2. Empieza asistida, no con scraping.** Una persona aporta el material —programa, cronograma,
fecha de un parcial— y el sistema lo estructura. Un scraper es **otra fuente para el mismo
ingestor**, no otro sistema: cuando `C01-042` defina universidad y fuentes legales, se enchufa una
entrada más sin tocar lo construido.

**3. Toda fila ingerida lleva procedencia obligatoria y entra `unverified`.** Es `I9` aplicado:
*"ninguna capa eleva un `verification_status`"*. Lo que trae el ingestor **nunca se presenta como
oficial**; corroborar es una operación explícita de alguien con autoridad, y no la hace el ingestor.

El schema ya lo anticipaba: `source_type` incluye `public_web` e `inference`, y la primitiva `Dato`
con provenance por dato existe desde la Etapa 0.6. **No hay que inventar nada estructural.**

### Lo que esto NO decide

- **`C01-042` sigue `OPEN`:** qué universidad, qué carrera y qué fuentes son legalmente utilizables.
  La ingesta se construye y se prueba **sobre una materia sintética**.
- **[ADR-004](#adr-004) quedó `ACCEPTED (v1 provisional)` después de esta decisión.** La ingesta
  sigue sin recomendar nada: estructura conocimiento para que el ADE decida sobre él.

### Un dato personal que apareció al analizarlo, y no estaba en ningún contrato

**Un programa de materia suele traer el nombre del docente**, y `instructor.name` es una columna del
ADL. [ADR-006](#adr-006) habla de estudiantes, pero **un docente también es una persona real**.

**Regla operativa mientras `C01-006` no lo cubra:** el ingestor **no carga identidad de docente**.
`instructor` queda fuera de la ingesta asistida. Si el material la trae, se omite — *omitir, no
inventar*, y acá además *omitir, no recolectar*.

---

## ADR-024 — Modo MVP: se construye todo sobre datos sintéticos

**Estado:** `ACCEPTED` · 30 ago 2026 · **decidido por el owner**
**Objetivo:** un MVP interno demostrable a inversores.

### Decisión

**Se levanta el bloqueo de construcción de todas las fases.** Lo que frenaba el roadmap era, casi
siempre, *procesar dato real* — no *construir*. Un producto completo sobre datos sintéticos **no
toca ninguna de esas decisiones**, así que se construye entero: ADE, reloj del lifecycle, progreso,
modo examen, riesgo.

Las decisiones abiertas que quedaban en el camino se resuelven **como versión provisional de alcance
MVP**, derivadas de lo que el spec ya congela, y **marcadas como tales**:

| Decisión | Cómo queda |
|---|---|
| [ADR-004](#adr-004) — pipeline del ADE | `ACCEPTED (v1 provisional)`. Reglas deterministas. Ver el ADR |
| ADR-005 ítem 5 — operación | Se construye el reloj del lifecycle; observabilidad y rotación quedan para producción |
| `C01-*` con gate `H`/`I` | Se implementa una lectura provisional **anotada en el código**, no una decisión de producto |

### Lo único que NO se levanta, y por qué conviene que no se levante

**Ningún flujo procesa datos de una persona real.** [ADR-006](#adr-006) sigue `PENDING`, y para este
MVP **no estorba**: el owner pidió *"todo testing"*, así que la restricción **no cuesta nada** hoy.

Y protege el objetivo, no lo frena: **una demo a inversores con datos de un estudiante real es un
pasivo, no una función.** Si algo sale mal, sale mal con el nombre de una persona adentro. Con datos
sintéticos la demo es igual de convincente y no hay nada que explicar después.

El guard estático que lo verifica se queda. Cuesta cero mientras todo sea sintético, y avisa el día
que alguien conecte un padrón real sin querer.

### La deuda que este ADR no borra, sólo aplaza

**Nada de esto desaparece por construir el MVP.** Antes de que entre **una sola persona real**:

| Qué | Estado |
|---|---|
| [ADR-006](#adr-006) — privacidad y consentimiento, con asesoría legal | `PENDING` · **bloqueo absoluto** |
| `C01-042` — golden dataset: qué universidad, qué fuentes, legalidad | `OPEN` |
| `npm audit` — 3 `high` | Sube la mayor de Next: [ADR-008](#adr-008). Ver `roadmap.md` §3.1 |
| `C01-030` — modelo de usuario institucional | `OPEN`. Sin él no hay endpoints de institución |
| Identidad de docente en material ingerido | Abierta por [ADR-023](#adr-023) |

**Cada versión provisional queda marcada en el código con el contrato que la reemplaza.** El riesgo
real de un MVP no es tomar atajos: es olvidarse de cuáles se tomaron.

---

## ADR-004 — Diseño del pipeline del Academic Decision Engine

**Estado:** ✅ **`ACCEPTED (v1 provisional — alcance MVP)`** · 30 ago 2026 · por [ADR-024](#adr-024)
**Sigue abierto:** `C01-006`. La v1 **no lo cierra**; lo implementa provisionalmente.

### Decisión: v1 determinista, sin LLM

El anexo registra una propuesta con un LLM generando la `ActionRecommendation` y un **validador
determinista** detrás. **La v1 construye el validador y las reglas; el LLM no.**

**Por qué en ese orden:**

1. **El validador hace falta igual.** En la propuesta, el LLM propone y un validador determinista
   comprueba que el recurso existe, que el tema pertenece al examen, que la duración entra en la
   disponibilidad y que **no se afirma dominio, progreso ni readiness inexistente**. Ese validador es
   trabajo obligatorio en cualquier versión.
2. **Con las reglas puestas, el LLM es otro generador detrás del mismo validador** — el mismo patrón
   que la ingesta: primero el núcleo, después la fuente más ambiciosa.
3. **Para una demo, determinista es mejor.** Una recomendación explicable y reproducible se puede
   mostrar; una que alucina, no.

### Lo que la v1 respeta, porque el spec ya lo congela

- **Salida mínima** (Parte I §9.2): materia + tema/objetivo + acción concreta + tiempo estimado +
  recurso/fuente + evidencia esperada + **razón**.
- **Cuatro ramas obligatorias:** `NEW`, `NONE`, `ERROR`, `PENDING`, ya modeladas en `FX-ADE-*`.
- **`academic_context_blocker` es distinto de `NONE`:** falta de contexto no es ausencia confirmada.
- **Exactamente una recomendación principal.** Varias sin principal es **error de contrato**, no un
  caso a resolver en el frontend.
- **Ninguna magnitud de máquina visible** (`P-03`): `priority` ordena, **nunca se muestra**.

### Lo que la v1 explícitamente NO hace

No modela al estudiante, no predice, no aprende y no pondera riesgo. Ordena por **costo de no
actuar** con reglas escritas y legibles. Cuando `C01-006` se cierre, esto se reemplaza o se envuelve.

---

<a id="adr-025"></a>
## ADR-025 — Las ocho `HUMAN-P0`, respondidas por la psicopedagoga

**Estado:** ✅ **`ACCEPTED`** · 31 ago 2026 · **respondidas por la psicopedagoga real (Emi)**
**Resuelve:** [ADR-007](#adr-007). **Cierra el bloqueo de contenido de la Fase B5.**
**Relacionado:** `C01-031`…`C01-038` (las ocho), y por consecuencia `C01-013`, `C01-016`, `C01-019`,
`C01-021`, `C01-022`, `C01-027`, `C01-029`, `C01-037`.
**Fuente literal:** [`human-p0-source.md`](human-p0-source.md) — transcripción de la hoja de
respuestas. **Esa es la fuente; este ADR es su lectura.**
**Toca:** `product.md`, `data-model.md`, `pending-decisions-annex.md`, `roadmap.md`, `AGENTS.md`,
`CLAUDE.md`.

### Contexto

[ADR-007](#adr-007) dejó las ocho decisiones psicopedagógicas corriendo con **defaults provisionales
escritos por el equipo**, con una sola regla: *ningún agente de IA puede cerrarlas; las cierra una
psicopedagoga real*. Ese es exactamente el mecanismo que se ejecutó: se le mandó un cuestionario con
tres opciones por decisión, y volvió con las ocho marcadas y observaciones escritas.

**Las ocho respuestas están dadas. Ninguna se respondió "depende"**, aunque el cuestionario ofrecía
esa salida explícitamente.

> ⚠️ **Procedencia, dicha entera.** La hoja es la **respuesta escrita previa** a la reunión de cierre
> que el propio cuestionario anunciaba (*"lo resolvemos juntos el lunes a las 16"*). Es la voz de la
> profesional y alcanza para cerrar lo que marcó. Los **residuos** que este ADR deja abiertos son, en
> buena medida, el temario de esa conversación: si algo de ahí contradice esta lectura, **se
> supersede este ADR**, no se lo edita.

### Decisión

**Las ocho dejan de ser defaults provisionales del equipo y pasan a ser criterio profesional
confirmado, `HUMAN-P0-0X v1.0`.** El rótulo interno cambia: donde el código y el contenido decían
*"asunción provisional, pendiente de confirmación"*, ahora dicen *"criterio profesional confirmado
v1.0"* — **salvo en los residuos listados abajo, que siguen rotulados como abiertos.**

| # | Qué se confirmó | Contra el default anterior |
|---|---|---|
| **01** · Los 20 pasos | La secuencia `PE-PSY-01…20` **se confirma como base**, sin cambiar ningún paso. **Pero los pasos 9 a 18 no son un recorrido lineal ni rígido:** el orden es variable, modificable y transversal, y **una misma acción puede repetirse varias veces sobre el mismo tema** | **Amplía.** El default confirmaba la matriz y la granularidad por paso; **no** decía que el tramo central fuera reentrante |
| **02** · Registro del aprendizaje | **Modelo mixto:** escala breve para el día a día **+ dimensiones separadas cuando hay desempeño observable** | **Ratifica** el híbrido, y responde lo que faltaba: la escala breve **es aceptable** y se queda |
| **03** · Apoyos y recuperación | Producir un apoyo y recuperar sin ayuda son **dos resultados separados dentro del mismo paso**, y **según el caso uno puede no aplicar** | **Corrige.** El default subordinaba el apoyo a "opcional y contextual"; ahora es un resultado propio, y la técnica se usa **sólo cuando cumple una función concreta** |
| **04** · Núcleo de menos de 24 h | **Siete componentes:** situación real y logística · contenidos críticos · una prueba breve sin ayuda · priorización · práctica parecida al examen · corrección de los errores importantes · descanso y estrategia | **Reemplaza.** El default era *"logística + **una única** actividad cognitiva + descanso"*. El núcleo real es más rico y **conserva el diagnóstico y la corrección** |
| **05** · Señal de aprendizaje | **Confirmada**, y nombrada: **evidencia de trabajo ≠ evidencia de aprendizaje.** Un cronograma, una foto, un checklist, una ficha o un resumen prueban que hubo actividad, **no** que hubo aprendizaje | **Ratifica y bautiza.** Sale del estado `POTENTIALLY ANSWERED — REQUIRES SOURCE CONFIRMATION`: **la fuente confirmó** |
| **06** · Revisión humana | **Selectiva y proporcional.** Comparar contra la pauta cuando existe; **la persona entra por la situación del estudiante, no por el tipo de entrega** | **Redefine.** El default hablaba de *"respuesta abierta, ambigua o de alto impacto"*. La profesional dio otros disparadores — ver abajo |
| **07** · Práctico vs. teórico | Se conservan las dos familias de criterios, **y la pauta de la cátedra manda cuando existe** | **Ratifica y jerarquiza.** La precedencia de la pauta deja de ser una nota: es *"lo que va a determinar qué se espera del estudiante en ese examen"* |
| **08** · Postmortem | Separar **preparación, desempeño, estrategia y contexto**; registrar aprendizajes; **uno o más ajustes cuando correspondan, sin cantidad fija**; y **registrar también lo que funcionó y debe mantenerse** | **Ratifica y agrega.** Mata el *"exactamente dos cambios"* de la intervención #32: era un ejemplo, no una regla. Lo nuevo es **conservar lo que funcionó** |

### Las tres respuestas que cambian el producto, no sólo el contenido

**1. El tramo 9–18 es reentrante, y el modelo de datos hoy no lo admite.**
[`data-model.md`](data-model.md) §10 tiene `protocol_step.sequence INTEGER NOT NULL`,
`exam_preparation.current_step_id` (un puntero único) y, sobre todo,
`protocol_step_completion UNIQUE (exam_preparation_id, protocol_step_id)`: **un paso se completa una
vez y no vuelve.** La respuesta 1 dice literalmente lo contrario para el tramo de estudio,
recuperación, revisión y práctica. **Esto es una brecha estructural, no una preferencia de copy**, y
la Fase B5 no puede construirse contra el schema actual sin resolverla. Queda anotada en
`data-model.md` §10 y §12.

**2. La revisión humana se dispara por la persona, no por el artefacto.** Los tres casos que la
profesional nombró son *"un error reiterativo que requiere identificar qué está haciendo mal y
corregir la forma/método"*, *"no logra avanzar a pesar de las devoluciones"* y *"factores más
subjetivos: frustración, inseguridad, desmotivación, ansiedad frente al examen"*. **Ninguno es una
propiedad de la entrega**: los tres son **patrones a lo largo del tiempo**. Consecuencia: `HUMAN-P0-06`
no se implementa sólo en `validation_method` de `Evidence` (`C01-016`) — **alimenta el Risk Engine y
el circuito de Intervención de la Fase B6** (`C01-021`, `C01-022`). Y su cierre es explícito: *"ya no
se trata de verificar si una respuesta está bien o mal, sino de comprender qué le está pasando a ese
estudiante"*. Eso es un `Operator`, no un reviewer.

**3. La pauta de la cátedra manda, y no hay dónde guardarla.** La respuesta 7 la vuelve la referencia
determinante de la corrección, y el ADL de [`data-model.md`](data-model.md) §7 **no tiene entidad ni
campo para la pauta o criterio de evaluación de una cátedra**. Además, el ingestor de la
[Fase B2b.1](roadmap.md#fase-b2b--ingesta-del-academic-data-layer--en-curso) **no puede declarar
`institution` ni `instructor` como fuente** ([ADR-023](#adr-023)): una pauta cargada por el
estudiante entra `student` / `unverified`, y así debe mostrarse. **No se inventa el campo acá:** se
registra la ausencia y se resuelve al construir B5, junto con `C01-027`.

### Lo que sigue abierto — y por qué no lo cierra este ADR

Ninguno de estos residuos lo puede cerrar un agente. Siguen bajo la regla de
[`AGENTS.md`](../AGENTS.md) §1.1: **se preguntan, no se aproximan.**

| Residuo | De dónde sale | Dónde vive |
|---|---|---|
| **Obligatoriedad paso a paso.** La respuesta confirma la secuencia y su orden; **no dice cuáles de los 20 son obligatorios** en cada caso | La pregunta 1 pedía *"los pasos que cambiarías"*, y la respuesta fue *"no modificaría los pasos en si"* | `C01-031` · `protocol_step.is_required` |
| **Cómo se reconcilian las dimensiones.** La profesional nombra **contacto, recuperación, aplicación y corrección** (+ confianza aparte). El modelo tiene **exposure, practice, domain, confidence, recency**. No son el mismo conjunto: *corrección* no tiene eje propio y *recuperación* y *aplicación* están colapsadas en `domain` | Pregunta 2 | `C01-019`, gate `H` · `product.md` §6 |
| **Si la recuperación también puede no aplicar.** La opción marcada dice *"uno puede no aplicar"* sin decir cuál; la observación sólo justifica omitir **la ficha** | Pregunta 3 | `C01-033` |
| **Si los siete componentes de H24 son obligatorios o priorizables.** La respuesta 1 dice que el recorrido no es rígido y la 4 enumera siete piezas; falta el orden de sacrificio cuando no entran todas | Preguntas 1 y 4 | `C01-034` |
| **Qué tareas "exigen comprensión" por sí mismas.** La excepción está declarada (*"salvo que la tarea misma exija comprensión"*), su alcance por disciplina no | Pregunta 5 | `C01-035` |
| **Cuántas repeticiones, y qué cuenta como "reiterativo".** El disparador de revisión humana es un error que se repite; el umbral es una decisión de operación | Pregunta 6 | `C01-036`, `C01-021` |
| **Peso relativo de cada criterio** de corrección, y qué pasa cuando la pauta de la cátedra **contradice** las familias generales | Pregunta 7 | `C01-037` |
| **Momento del postmortem** — antes o después de conocer la nota | Pregunta 8 | `C01-038` |

### Consecuencias

1. **[ADR-007](#adr-007) queda resuelto.** Su consecuencia arquitectónica —protocolo como
   **configuración versionada**, nunca código ni enum— **no cambia**: sigue siendo la razón por la
   que estas respuestas se pueden aplicar sin migrar el dominio.
2. **La Fase B5 se desbloquea en contenido.** Sigue bloqueada en **readiness** por
   [ADR-011](#adr-011), que es una contradicción **estructural** del spec (`CR-UX08-01`) y **no** una
   pregunta pedagógica: estas respuestas no la tocan.
3. **El rótulo cambia de sentido.** `protocol_step.provisional_default_id` /
   `provisional_version` dejan de rotular *"asunción del equipo"* para rotular *"criterio profesional
   v1.0"*. **Lo provisional ahora son los residuos**, y son menos.
4. **Nada de lo ya construido se invalida.** Ninguna de las ocho toca el loop diario ya persistido
   (`Action`, `Commitment`, `Evidence`, `Reflection`): tocan el **protocolo de examen**, que todavía
   no tiene tablas. Llegaron **antes** de construir B5, que es exactamente cuando servían.
5. **Se versiona la fuente literal** en [`human-p0-source.md`](human-p0-source.md). Toda paráfrasis
   —esta incluida— **pierde** contra ese archivo.

---

## ADR-026 — Obligatoriedad de `Reflection`: dónde vive, quién la pone y qué la hace válida

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Cierra:** `C01-051` (gate `H`) — **con un residuo pedagógico declarado abajo.**
**Relacionado:** `C01-012` (Evidence content), `C01-017` (privacidad y retención de
Evidence/Reflection — **no lo toca**), `C01-027`, [ADR-025](#adr-025).
**Toca:** `product.md` §7, `data-model.md` §9, `pending-decisions-annex.md`, `roadmap.md`.

### Qué estaba realmente abierto

Menos de lo que parecía. El spec fuente ya congela tres cosas, y esta decisión **no las reabre**:

- **`CO-06`:** *"objeto separado de Evidence […] `OPTIONAL`: omitir no bloquea; `REQUIRED`:
  ausencia/invalidación impide **sólo el submit dependiente** y muestra fallback; **nunca se
  infiere**"*.
- **Parte III §7:** *"`REQUIRED`: **la configuración versionada** identifica ámbito, criterio mínimo
  y destino. Una Reflection válida es precondición del submit específicamente configurado, **no de
  todo el recorrido**"*.
- **`CTA-016`:** su condición de aparición es *"Reflection **configurada** y visible"* — no
  *"requerida"*.

Lo abierto eran tres preguntas concretas: **dónde vive el flag**, **quién lo pone** y **qué hace
válida** a una Reflection.

### Decisión

**1. El requisito vive en la configuración versionada del contenido, nunca en una tabla de
preferencias.** Dos lugares y ningún tercero: el paso del protocolo (`protocol_step`, cuando la Fase
B5 lo migre) y la Action. **Un flag global mutable queda descartado explícitamente:** cambiarlo
mañana reescribiría retroactivamente si la entrega de la semana pasada era válida. Es el mismo
argumento con el que `commitment.timezone_at_commit` se congela y con el que un `MISSED` no se edita.

**2. Se congela en la instancia al crearla.** `action.reflection_requirement` guarda el valor vigente
**en el momento en que la Action se crea**, y no cambia después. El estudiante acordó con las reglas
de ese día.

**3. El default del MVP es `OPTIONAL` en el loop diario.** `REQUIRED` sólo donde el contenido
versionado lo declare. Tres razones, y las tres salen de fuentes que ya existen:

- **`HUMAN-P0-02 v1.0`** ([ADR-025](#adr-025)) eligió un registro breve *"que no le coma el tiempo al
  estudiante"*. Una reflexión obligatoria en cada entrega es exactamente eso.
- **`HUMAN-P0-05 v1.0`** separó **evidencia de trabajo** de **evidencia de aprendizaje**. Una
  Reflection es autorreporte: bloquear el submit de la Evidence —lo más fuerte que el sistema
  recoge— por la ausencia de lo más débil pone el gate del lado equivocado.
- **Obligar ensucia el dato.** Una reflexión escrita para destrabar un botón entra a la Bitácora
  **idéntica** a una real. La Etapa B2.4 ya había cazado la versión chica de esto: *"un objeto en
  blanco aparecería en la Bitácora como si el estudiante hubiera reflexionado"*.

Y es la dirección **reversible**: pasar de `OPTIONAL` a `REQUIRED` es trivial; al revés se arrastran
meses de relleno que no se puede separar de lo genuino.

**4. Válida = no vacía, salvo criterio declarado.** Ya implementado en la B2.4: una Reflection sin
ningún dato no es una Reflection. Si la configuración declara un criterio mínimo, ése manda.

### El estado que faltaba: son tres, no dos

`OPTIONAL` **no es** *"no hay Reflection"*. El registro canónico de CTAs ya lo modelaba
—`CTA-016.aparece` mira `reflectionConfigurada`, no `reflectionRequerida`— y **la capa de servidor lo
había colapsado a un booleano**: con `false` no se ofrecía nada, así que la Reflection opcional no
existía en la UI. El requisito pasa a ser ternario:

| Valor | La CTA-016 se ofrece | Bloquea el submit dependiente |
|---|---|---|
| `NO_CONFIGURADA` | no | no |
| `OPTIONAL` | **sí** | no |
| `REQUIRED` | sí | sí, y **sólo** ese submit |

### Lo que esta decisión NO cierra

**En qué pasos del protocolo de examen la reflexión debe ser obligatoria es criterio pedagógico**, y
lo responde la misma profesional que respondió las ocho `HUMAN-P0`. Roza dos residuos que
[ADR-025](#adr-025) dejó abiertos: cuáles de los 20 pasos son obligatorios (`C01-031`) y el momento
del análisis posterior (`C01-038`).

Por eso `C01-051` queda **`ANSWERED — RESIDUO ABIERTO`**, no `CLOSED`: la **forma** está decidida
—dónde vive, quién lo pone, cómo se congela, qué es válida— y el **cuándo** pedagógico no. La forma
es lo que bloqueaba el código; el cuándo bloquea contenido que todavía no existe.

Tampoco toca **privacidad ni retención** de la Reflection: eso es `C01-017`, sigue `OPEN`, y el
propio anexo advierte que son cosas distintas.


---

## ADR-027 — Los ocho eventos de transición entran al Product Event Model

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Cierra:** la contradicción que la Etapa B3.2 destapó entre `product.md` §11 y el backend.
**Relacionado:** `C01-023` (Product Event Model), que sigue `OPEN` en lo demás.
**Toca:** `product.md` §11, `lib/domain/product-events.ts`, la Bitácora y sus tests.

### El problema

`product.md` §11 declaraba textualmente que **no existen** `CommitmentDue`, `CommitmentCompleted`,
`CommitmentClosed`, `EvidenceUnderReview`, `EvidenceSufficient`, `EvidenceInsufficient`,
`EvidenceResubmissionRequested` ni `RescueCreated`. **El backend los emite** desde B1/B2: la
maquinaria compartida de transiciones publica un evento por cada estado al que se llega.

O sea: un catálogo normativo decía que ocho hechos no existían mientras estaban almacenados de forma
append-only y **sostenían experiencias visibles para el estudiante**.

### Decisión

**Los ocho entran al modelo oficial**, como **eventos de transición de dominio**.

El razonamiento del owner, textual: *"no quiero mantener un catálogo normativo que diga que 'no
existen' mientras el backend los emite, están almacenados de manera append-only y sostienen
experiencias visibles para el estudiante"*.

**Y el catálogo pasa a clasificar por nivel**, para que aprobarlos no signifique mezclar cosas de
naturaleza distinta:

| Nivel | Qué es | Ejemplos |
|---|---|---|
| **`NEGOCIO`** | Los hechos que el producto existe para producir y medir | `ActionRecommended`, `ProgressUpdated`, `RescueSucceeded` |
| **`TRANSICION`** | El objeto cambió de estado. Trazabilidad del lifecycle | `CommitmentDue`, `EvidenceSufficient` |
| **`TELEMETRIA`** | Uso e interacción. **Ninguno instrumentado hoy** | `CourseViewed` |

**Compatibilidad:** los eventos históricos **conservan su nombre**. Ninguno se renombra sin un plan
de migración — `product_event` es append-only, y renombrar dejaría filas viejas que ningún consumidor
sabe leer.

### Lo que esta decisión NO cierra

`C01-023` sigue `OPEN`. Lo que se resolvió es la contradicción entre el catálogo y el código, no el
Product Event Model completo: **falta el naming de telemetría**, y siguen sin instrumentarse 14 de
los eventos del P0 —los de examen, riesgo, intervención y consentimiento—, cada uno esperando la fase
que los produce.

Y quedan **dos nombres que el P0 usa y el código no**: `CommitmentCreated`, que el backend emite como
`CommitmentConfirmed` —por el estado al que transiciona—, y que no se renombra por la misma regla de
compatibilidad.

---

<a id="adr-028"></a>
## ADR-028 — La completion de un paso es un hecho, no un estado

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Cierra:** el requisito de schema #1 de la Fase B5. Avanza `C01-026` y `C01-028`.
**Toca:** `data-model.md` §10, `product.md` §5.6 y §8.2.

### Contexto

`HUMAN-P0-01 v1.0` dice, textual, que en el tramo 9–18 *"el estudiante puede avanzar, volver sobre un
tema, recuperar, detectar un error, corregir, practicar, repasar y de nuevo recuperar. Incluso algunas
de estas acciones pueden darse varias veces sobre un mismo tema"*.

El schema de `data-model.md` §10 decía lo contrario, y lo decía en una línea:

```sql
UNIQUE (exam_preparation_id, protocol_step_id)
```

**Un paso se completa una vez y no vuelve.** Construir la Fase B5 sobre eso habría congelado en la
base una afirmación que el criterio profesional confirmado contradice.

### Decisión

**Se cae el `UNIQUE`. Cada vuelta es una fila más**, con dos columnas nuevas:

| Columna | Qué guarda |
|---|---|
| `occurrence` | El ordinal de la vuelta, asignado **dentro de la transacción** |
| `topic_id` | El tema sobre el que se volvió. `NULL` ⇒ no se sabe, **no** "todos" |

**El tema es parte del hecho.** La fuente no dice "varias veces", dice *"varias veces sobre un mismo
tema"*: sin el tema, la repetición se puede contar pero no se puede leer, y la superficie tendría que
decir *"repetiste el paso 12"* en vez de *"volviste sobre Series"*.

**La garantía vieja no se pierde: se vuelve configurable.** `protocol_step.is_reentrant` viaja con el
contenido del protocolo, y un paso no reentrante conserva exactamente el comportamiento del `UNIQUE`
—se completa una vez—. La regla pedagógica vive en la configuración, que es donde `HUMAN-P0-01` la
puso.

**Y `ProtocolStepCompleted` se emite por cada vuelta**, no sólo por la primera. Un evento que marcara
únicamente la primera pasada convertiría a las siguientes en trabajo invisible.

### Por qué esta forma y no la otra

Las alternativas eran conservar el `UNIQUE` con una tabla de "revisitas" al lado, o hacer la
completion única por tema.

La primera crea **dos verdades sobre el mismo hecho** y obliga a toda lectura de historia a unir dos
tablas; peor, privilegia la primera pasada sobre las demás, que es justamente lo que la profesional
negó. La segunda es más chica pero pierde la repetición sobre el **mismo** tema, que es literalmente
lo que la fuente describe.

Y hay un argumento que ya estaba escrito: `product.md` §5.6 dice desde el principio que *"no existe un
enum de estado por paso congelado; sólo hay un hecho factual de completion"*. **El `UNIQUE` era lo
único que sostenía la lectura de estado.** Sacarlo alinea el schema con la regla que el producto ya
declaraba.

### Regla de producto que va con la decisión

**Repetir no es retroceder.** Ninguna superficie presenta una repetición como incumplimiento, recaída
ni pérdida de progreso. El copy dice *"volviste sobre"* y *"lo trabajaste N veces"*, nunca
*"repetiste"*; hay tests que lo verifican sobre las tres superficies de examen.

---

<a id="adr-029"></a>
## ADR-029 — La pauta de la cátedra tiene entidad propia, con Provenance

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Cierra:** el requisito de schema #2 de la Fase B5. Avanza `C01-027`.
**Relacionado:** `C01-037` (peso relativo de cada criterio), `I9`, [ADR-023](#adr-023).

### Contexto

`HUMAN-P0-07 v1.0` convierte la pauta de la cátedra en **la referencia determinante** de la
corrección: *"siempre tomando como referencia la pauta o criterio de evaluación de la cátedra porque
en definitiva es lo que va a determinar qué se espera del estudiante en ese examen"*.

Y el Academic Data Layer **no tenía dónde guardarla**. Peor: cargada por el estudiante entra
`student`/`unverified` ([ADR-023](#adr-023)), y `I9` prohíbe elevar la procedencia. Una pauta
`unverified` presentada como *"criterio de la cátedra"* sería exactamente esa elevación.

### Decisión

Entidad propia — `assessment_criterion` — colgando del `Assessment`, **con las columnas de Provenance
que ya lleva todo dato académico discutible**.

**Es la única forma de guardar la pauta y a la vez negarse a decir que es oficial.** Con
`source_type = student` la superficie la muestra como *lo que el estudiante cargó*; sólo
`institution` o `instructor` la presenta como criterio de cátedra. `I9` no se toca.

`weight` existe y admite `NULL`: `C01-037` —el peso relativo de cada criterio— sigue abierto, y un
`NULL` **no se lee como "pesa poco"**.

### Por qué no un adjunto

Guardarla como archivo del `Assessment` era más barato y deja el criterio **enterrado**: el motor no
puede citar *procedimiento* o *claridad* por separado, y `C01-037` no tendría dónde aterrizar el día
que se cierre. Un PDF no es un criterio consultable.

### Lo que esta decisión NO cierra

`C01-037` sigue `OPEN`: **qué pasa cuando la pauta de la cátedra contradice las familias generales**
de `HUMAN-P0-07`. La entidad guarda las dos cosas; cuál gana lo decide una persona.

---

<a id="adr-030"></a>
## ADR-030 — El protocolo corre con contenido provisional, y lo dice en sus columnas

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Cierra:** el requisito de schema #3 de la Fase B5. Avanza `C01-027`.

### Contexto — un hueco que nadie había visto

`HUMAN-P0-01 v1.0` confirma la secuencia `PE-PSY-01…20` **como base**. Al ir a cargarla apareció
esto: **el contenido de esos 20 pasos no está en el repositorio.** Vive en el PDF del cuestionario y
nunca se transcribió. Lo único que hay son los 12 `EP-01…EP-12` del spec, que `product.md` §8.1
rotula como *"arquitectura funcional provisional"* del equipo.

Es decir: la Fase B5 estaba marcada como *"contenido desbloqueado"* y lo que se desbloqueó fue **el
criterio**, no el texto. Escribir los 20 desde los 12 habría sido inventar criterio pedagógico, que es
lo único que `AGENTS.md` prohíbe sin excepción.

### Decisión

Se carga `EP-SPEC v0.1` —los 12 del spec— **rotulado como provisional en sus propias columnas**:
`provisional_default_id = 'EP-SPEC'`, `provisional_version = 'v0.1'`. Las superficies leen ese rótulo
y lo dicen: *"contenido provisional del equipo, todavía sin confirmación profesional"*.

**El día que la hoja se transcriba, cargar los 20 es un `INSERT` y un `UPDATE is_current`.** No hay
migración de dominio: es exactamente para esto que el protocolo se diseñó como configuración
versionada, y es la segunda vez que esa decisión se cobra sola.

### Y una versión que sí es criterio confirmado

En la misma migración entra **`HUMAN-P0-04 v1.0`, el núcleo de las últimas 24 horas**, transcripto
literal de la respuesta profesional: *situación real y logística · contenidos críticos · una prueba
breve sin ayuda · priorización · práctica parecida al examen · corrección de los errores importantes ·
descanso y estrategia*.

**Son siete componentes, no uno.** El default que corría antes —*"consolidar y no incorporar contenido
nuevo"*— era uno solo, y la profesional lo acotó: eso *"supone un ideal en el que ya todos los temas
fueron vistos, comprendidos y aprendidos"*.

Entra como **una versión de protocolo aparte**, con `alcance = 'NUCLEO_H24'`, y no como un paso del
protocolo completo: siete componentes con su propio criterio de cierre son un protocolo. Modelarlo así
permitió cargarlo **sin inventar a qué paso de los 20 corresponde cada uno**, que es lo que `C01-034`
deja abierto.

### Una corrección al schema que vino con esto

`data-model.md` §10 declaraba `is_required BOOLEAN NOT NULL DEFAULT TRUE`, que **afirma que los 20
pasos son obligatorios**. `C01-031` es exactamente esa pregunta y sigue abierta.

Un booleano no tiene dónde poner *"todavía nadie lo declaró"*, así que la columna pasó a ser ternaria
con el patrón que [ADR-026](#adr-026) ya fijó para `Reflection`: `NO_CONFIGURADA` / `OPCIONAL` /
`OBLIGATORIO`. Los siete del núcleo H24 quedan `NO_CONFIGURADA` porque `C01-034` pregunta si son
obligatorios o priorizables, y en qué orden se sacrifican cuando no entran todos.

### Lo que esta decisión NO cerraba, y se cerró el mismo día

**La transcripción de los 20 `PE-PSY`.** Apareció horas después: el documento con los veinte pasos
desarrollados existía, se llama *Roadmap Modo Examen* y no había llegado al repositorio. Ver
[ADR-031](#adr-031). `EP-SPEC v0.1` **no se borró**: quedó apagado, y esta decisión sigue siendo la
que explica por qué el rótulo de procedencia existe.


---

<a id="adr-031"></a>
## ADR-031 — Los veinte pasos entran con el texto de la psicopedagoga

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Cierra:** el hueco de contenido que [ADR-030](#adr-030) declaró abierto. Avanza `C01-027`.
**Toca:** el protocolo vigente, `product.md` §8, `data-model.md` §10.
**Fuente:** [`roadmap-modo-examen-source.md`](roadmap-modo-examen-source.md), transcripción literal.

### Contexto

ADR-030 se tomó sobre un hecho: **el texto de los veinte pasos `PE-PSY` no estaba en el repositorio.**
`HUMAN-P0-01 v1.0` confirmaba la secuencia como base y nadie había transcripto el contenido, así que
el protocolo corría con `EP-SPEC v0.1` —los doce del spec— rotulado como asunción del equipo.

**El documento apareció.** Se llama *Roadmap Modo Examen*, es de la misma profesional, y no trae sólo
la secuencia: trae **los veinte pasos desarrollados** y agrupados en cinco fases —diagnóstico,
planificación, estudio activo, revisión y práctica—.

### Decisión

Se carga como **una versión nueva del protocolo**, `HUMAN-ROADMAP v1.0`, y `EP-SPEC v0.1` **se apaga
sin borrarse**. Las preparaciones que ya arrancaron contra la versión vieja conservan su recorrido:
cambiar la versión vigente no reescribe historia, y para eso el protocolo es configuración versionada.

**Qué se cargó, y qué no:**

| Campo | Qué entró | Por qué |
|---|---|---|
| `source_text` | El párrafo **verbatim** de cada paso | Columna nueva. Existe para que la trazabilidad sea verificable y no una promesa |
| `label` · `explanation` | Un **corte determinista** de ese texto: hasta el primer punto o los primeros dos puntos, lo que llegue antes | **Ningún título lo escribió un agente.** Hay test que reconstruye `source_text` desde las dos columnas y lo busca en el documento fuente |
| `step_type` | La fase del documento —`DIAGNOSTICO`, `PLANIFICACION`, `ESTUDIO_ACTIVO`, `REVISION`, `PRACTICA`— | La agrupación está en la fuente; no se inventó una taxonomía |
| `expected_artifact` | **NULL** | El Roadmap dice qué hacer, no qué se entrega |
| `criterion` | **NULL** | Ninguno de los veinte declara cuándo cierra |
| `requirement` | **`NO_CONFIGURADA`** | `C01-031`, abierto |

**Los errores tipográficos de la autora se conservan** —*"a desarrollae"*, *"icnorporando"*,
*"Siemrpe"*—, y hay un test que rompe si alguien los "arregla". Corregirle la redacción a la fuente se
siente como cortesía y es exactamente lo que este repositorio prohíbe: quien la lea dentro de tres
meses tiene que encontrar lo que ella escribió.

### El tramo reentrante: 9–18, y por qué no 14–15

Leer sólo el Roadmap sugiere marcar **14 y 15**, que son los que describen volver sobre algo con todas
las letras — *"volver a trabajar específicamente aquello que falló"*, *"volver sobre contenidos
anteriores evitando que cada tema se estudie una sola vez"*.

**Se carga 9–18**, y la razón es que hay una fuente más específica: `HUMAN-P0-01 v1.0` es la respuesta
escrita de la profesional **a una pregunta sobre esta misma matriz numerada**, y dice *"entre los
puntos 9 al 18 el recorrido no es lineal ni rígido… Incluso algunas de estas acciones pueden darse
varias veces sobre un mismo tema"*.

**Y los números cierran.** *"Estudio, recuperación, revisión y práctica"* son, en este documento,
`ESTUDIO ACTIVO` (9–15), `REVISION` (16) y `PRACTICA` hasta el simulacro (17–18). El 19 —últimas 24
horas— y el 20 —durante el examen— no pertenecen a esa etapa, y por eso el tramo termina en 18 y no en
20. Esa coincidencia es además **la mejor evidencia de que la numeración de este documento es la de
`PE-PSY-01…20`** que el cuestionario nombraba.

### Un rótulo nuevo: ni del equipo, ni confirmado

La procedencia del contenido tenía dos estados y ahora tiene **tres**, porque apareció el del medio:

| Rótulo | Qué significa | Qué se muestra |
|---|---|---|
| `EP-SPEC` | Asunción del equipo | *"Contenido provisional del equipo, todavía sin confirmación profesional."* |
| `HUMAN-ROADMAP` `v1.0-sin-confirmar` | **Su texto, sin confirmación escrita de vigencia** | *"Texto de la psicopedagoga · vigencia todavía sin confirmar."* |
| `HUMAN-P0-0X` `v1.0` | Criterio profesional confirmado | *"Criterio profesional confirmado · …"* |

Colapsar el del medio con *"confirmado"* le daría al estudiante una garantía que nadie dio; colapsarlo
con *"provisional del equipo"* le sacaría el crédito a la profesional que lo escribió. **No son lo
mismo y no se muestran igual.**

### Qué falta, y es de una persona

Una confirmación escrita, en dos frases, que ya está en la
[agenda de cierre](agenda-cierre-psicopedagoga.md):

1. ¿Este documento es **la versión vigente** de los veinte pasos?
2. ¿Se repite **todo el tramo 9–18**, como dice tu respuesta del cuestionario, o sólo los pasos 14 y
   15?

Cuando llegue, es cambiar `v1.0-sin-confirmar` por `v1.0`. Si la respuesta al punto 2 es "sólo 14 y
15", es un `UPDATE` de dos filas y una versión nueva — **no una migración de dominio**.

### Lo que esta decisión NO cierra

`C01-027` sigue abierto en su parte de **evidencia esperada y criterio de cierre por paso**. El
[cuadro de problemas y acciones](cuadro-problemas-source.md) de la misma profesional propone
evidencias concretas y **no se carga**: no está mapeado uno a uno con estos veinte, y conserva
preguntas suyas sin resolver —`(intervención??)`, `(asistencia??)`, `(checklist predeterminado?)`—.
**Un campo con un signo de pregunta de quien lo escribió no es criterio confirmado.**

Y sigue abierto todo lo que ya estaba: los umbrales de readiness (`C01-029`), quién escribe
`current_step_id`, la ventana de recomendación (`C01-024`) y la obligatoriedad de los pasos
(`C01-031`).

---

<a id="adr-032"></a>
## ADR-032 — El circuito de riesgo se cierra por construcción, y lo que falta se declara

**Estado:** ✅ `ACCEPTED` · 2 de septiembre de 2026 · **decidido por el owner**
**Ejecuta:** la parte de dominio de la Fase B6, desbloqueada por [ADR-003](#adr-003).
**No cierra:** `C01-021`, `C01-022`, `C01-039`, `C01-040`, `C01-044`, `C01-036`.
**Toca:** `data-model.md` §10, `product.md` §5.5, `roadmap.md`.

### Contexto

El Done de la Fase B6 es una sola frase: *"toda señal relevante cierra su circuito causa → owner →
playbook → SLA → intervención → outcome; ninguna señal queda sin outcome registrado"*.

De esos seis eslabones, **tres están decididos y tres no**:

| Eslabón | Estado |
|---|---|
| **causa** | ✅ Decidido. El spec lo exige dos veces: *"nunca un score opaco como única salida"* |
| **owner** | 🟡 La columna está; **quién es un operador viene del CRM** (`C01-039`, contrato v2) |
| **playbook** | ❌ `C01-044`, gate `P`, textual: *"no se inventan valores"* |
| **SLA** | ❌ Parte del playbook |
| **intervención** | ✅ Decidido: entidad, estados y lifecycle |
| **outcome** | ✅ Vocabulario congelado en `data-model.md` §10 |

La tentación obvia era esperar a tener los seis. La otra era inventar los tres que faltan para poder
mostrar un circuito completo.

### Decisión — se construye el mecanismo, no las reglas

**Lo que hay que hacer imposible se hace imposible ahora**; lo que falta decidir **se declara y se
cuenta**, en vez de completarse con un default.

**1 · Cerrar sin resultado no es un camino que exista.** `cerrar_intervencion()` escribe el estado y
el outcome **en una sola transacción**. No hay forma de dejar una intervención cerrada sin resultado,
porque no hay función que lo permita.

**2 · `RESOLVED` sólo se alcanza desde `INTERVENTION_REQUIRED`, y sólo con una intervención con
outcome.** Es la traducción literal de *"el dashboard no es el final del Risk Engine"*: una señal que
se pudiera marcar resuelta sin que nadie la trabajara **es** el tablero en verde con nada detrás.

**3 · `EXPIRED` sale sólo de `OPEN` y `ACKNOWLEDGED`.** Una señal que ya pidió una persona no se
vence sola: hacerlo borraría una obligación humana pendiente. El spec autoriza expirar *"si deja de
ser relevante"*, y una que espera a alguien no dejó de serlo.

**4 · Lo que falta se cuenta.** `circuito_de_senales()` devuelve dónde está roto el circuito y
**nombra el contrato que lo cierra**: hoy responde `playbooks: C01-044` y `reglasSinUmbral: C01-036`.
Un Done que se revisa a mano se marca cumplido sin revisar — mismo criterio que
`tests/invariantes.test.ts`.

**5 · Ninguna regla corre sola.** Las tres situaciones de `HUMAN-P0-06 v1.0` entran como
**configuración versionada** —igual que el protocolo de examen— con `threshold_config` en `NULL`, y
un `CHECK` impide que una regla sin umbral pase a modo `AUTOMATICA`. **No existe evaluador**, y hay un
guard estático que rompe si alguien lo agrega.

**6 · `modo = 'HUMANA'` en las tres, porque lo dijo ella.** *"En esos casos si considero importante la
intervención de una persona"*. La pregunta del spec §32 —*"¿qué `RiskSignals` disparan intervención
automática, humana o sólo observación?"*— queda contestada **para esas tres** y abierta para el resto.

**7 · El operador entra por un puerto, no por un contrato inventado.**
`DirectorioDeOperadores.verificar()` tiene **una pregunta y tres respuestas**; hoy la única
implementación devuelve `SIN_DIRECTORIO`. No hay endpoint, ni payload, ni campos del CRM: eso es del
CTO.

> **`SIN_DIRECTORIO` no bloquea, `DESCONOCIDO` sí.** Un operador que el CRM rechaza es un error que
> hay que frenar; uno que no se puede consultar es una integración que falta. Colapsarlos haría que el
> día que el contrato v2 llegue no se pudiera distinguir un rechazo real de la ausencia del canal —y
> mientras tanto, dejaría el dominio de la fase parado detrás del trabajo de otra persona.
>
> La intervención se abre igual, queda `owner_verified = false`, y el circuito lo cuenta y nombra
> `C01-039 · contrato v2`.

**8 · `audit_log` deja de ser decorativa.** Existía desde la B1.5, append-only, y **nadie la
escribía**. Esta fase es la primera que el spec nombra explícitamente —*"registrar cambios de caminos,
`RiskSignals`, `Evidence`, intervenciones y accesos críticos"*—, y toda escritura de riesgo e
intervención pasa por el `Auditor`.

> **No reemplaza a `product_event`, y las dos existen a propósito.** El evento dice *qué le pasó al
> estudiante* y alimenta Bitácora y métricas; la auditoría dice *quién tocó qué y cómo estaba antes*,
> y existe para responderle a una institución. Un mismo hecho genera los dos.

### En `UX01`, el riesgo es un modificador y nada más

`VI.1` §3.3: `HIGH_RISK` *"no gana automáticamente el Hero"* y *"no puede interrumpir `IN_PROGRESS` ni
`EVIDENCE_PENDING` sólo por severidad"*. Lo implementado es exactamente lo que esa sección autoriza:
**cambiar el estado general a *"Necesita recuperación"***, y nada más.

La señal **ni siquiera entra a `HeroInput`** —hay un guard estático que lo verifica—, y el disparador
**no es una severidad**: es que la señal misma esté en `INTERVENTION_REQUIRED`. Elegir una severidad
sería fijar el umbral por el que a un estudiante se le dice que está en problemas, y eso es
`C01-021`.

### Lo que esta decisión NO cierra

- **`C01-021`** · qué regla produce qué señal, con qué severidad y sobre qué sujeto.
- **`C01-036`** · cuántas repeticiones hacen a un error *"reiterativo"*. **Es de la psicopedagoga.**
- **`C01-044`** · los 4–6 playbooks del piloto y sus SLA. Gate `P`.
- **`C01-039` y `C01-040`** · el directorio de operadores, la asignación y los webhooks. **Contrato
  v2, del CTO.**
- **`C01-022`** · qué outcome cierra formalmente y cuál escala.
- **Las cinco superficies de operador** (`WF-O01`…`WF-O04`, `WF-I01`). No se construyeron: **no hay
  sesión de operador**, y fabricar una sería inventar el esquema de autenticación que el contrato v2
  tiene que definir. Es el mismo criterio con el que la Fase B5 no inventó el escritor de
  `current_step_id`.

---

<a id="adr-033"></a>
## ADR-033 — La frontera de superficies, corregida en la dirección del spec

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Confirma:** [ADR-003](#adr-003), sin cambios.
**Corrige cláusulas de:** [ADR-012](#adr-012) y [ADR-032](#adr-032). **Ninguno se edita**: los dos
siguen `ACCEPTED` y su historia queda como está — ver *"Qué cláusulas corrige"* más abajo.
**No reabre:** el dominio construido en la Fase B6. Ver *"Qué NO toca"*.
**Toca:** `product.md`, `roadmap.md`, `platform-integration-contract.md`,
`pending-decisions-annex.md`, `architecture.md`.

### Contexto — el CTO confirmó la arquitectura, y coincide con el spec fuente

El CTO responsable del CRM confirmó cinco hechos:

1. El operador **no interactúa** con la Plataforma.
2. El operador **nunca inicia sesión** en la Plataforma.
3. **Todas** las superficies de operador pertenecen al CRM.
4. A la Plataforma acceden **únicamente los estudiantes autorizados por el CRM**.
5. Esa autorización se hace hoy con `POST /api/service/v1/authorize`.

**Esto no corrige al spec fuente: corrige una lectura nuestra del spec fuente.** La sección que
define las cinco superficies se llama, textualmente:

> `product-spec-source.md` — **"8. Wireframes low-fi — Operador / CRM"**

y el mockup de `WF-O01` lleva su propio encabezado dibujado adentro: **`ACHIEVE CRM · Cola de
intervención`**. Tres declaraciones más del mismo documento apuntan al mismo lado:

| Fuente | Qué dice |
|---|---|
| Parte II §18.1 | *"CRM es fuente de verdad de la relación B2B y operación: institución cliente, elegibilidad/padrón, **operadores, asignaciones**"* |
| Parte I §22 | *"CRM — **Vista operacional** para priorizar y acompañar"* |
| Parte I §15.3 y §21 | Los títulos son *"Intervention Engine / **CRM**"* y *"**CRM**, Orquestación e Intervention Engine"* |

**Dónde se metió la divergencia.** [ADR-012](#adr-012) leyó *"cinco superficies que no existen en
ningún lado"* como *"que todavía no construimos nosotros"*, y las difirió al Track B absorbiéndolas
en la Fase B6. De ahí bajaron a `product.md` §10.1 —listadas junto a `UX01`–`UX09` como *"No
construida"*—, al roadmap, y finalmente a `platform-integration-contract.md` §2.2, donde el supuesto
ya se había endurecido en un bloqueo: *"no hay sesión de operador"*.

Era comprensible: ADR-012 se escribió para decidir un alcance de focus groups con **estudiantes**, y
en ese contexto la pregunta era cuándo construirlas, no dónde viven.

### Decisión

**1 · Ninguna superficie de operador vive en la Plataforma.** Las cinco —`WF-O01` cola priorizada,
`WF-O02` contexto de estudiante, `WF-O03` registrar intervención, `WF-O04` revisión de evidencia,
`WF-I01` dashboard institucional— **pertenecen al CRM**. No es un diferimiento con fecha: es una
reubicación. Salen del inventario de construcción de la Plataforma y quedan registradas como
superficies del CRM, con su trazabilidad a §8 y §9 del spec.

**2 · La Plataforma no autentica operadores.** En las integraciones que correspondan autentica **al
CRM como sistema**. Un operador no tiene, y no debe tener, sesión acá.

La consecuencia es una que ya estaba escrita en el schema antes de saberlo:
`intervention.owner_operator_id` es `UUID NOT NULL` **sin FK**, y seguirá siéndolo. Es una identidad
externa **asertada por un par autenticado**, no una identidad que la Plataforma pueda verificar. Un
secreto compartido autentica al CRM; nunca a la persona.

**3 · El CRM no escribe el dominio de la Plataforma: envía comandos autenticados.** La Plataforma
valida contra sus máquinas de estados y **produce el hecho canónico**. Esto no es una excepción a la
regla de `platform-integration-contract.md` §2.1 —*"Dashboard no escribe dominio de Achieve"*—: es
la distinción que la hace cumplible. Sin ella, esa frase y la propiedad canónica de `Intervention`
que declaró [ADR-003](#adr-003) no podían ser ciertas al mismo tiempo, porque el operador trabaja en
el otro sistema.

`abrir_intervencion()`, `reconocer` y `cerrar_intervencion()` **ya son exactamente esos comandos**.
Son transaccionales y agnósticos de quién los llama. No les falta lógica: les falta un Controller y
un contrato.

**4 · `WF-O04` queda fuera del alcance de la Plataforma**, por la misma razón que las otras cuatro.
[ADR-012](#adr-012) había dejado abierto *"evaluar en B6 si merece una versión mínima anticipada"*.
**Se cierra por no-aplicable**, no por postergación.

> ⚠️ Esto dispone de `WF-O04` **como superficie de operador**, y de nada más. El lifecycle
> `UNDER_REVIEW` de `Evidence` es dominio canónico de la Plataforma y no se toca. Si el **Reviewer
> (R1)** —que `product.md` §4 lista como un rol **separado** del Operador— es o no un operador,
> queda abierto abajo.

### Lo que este ADR NO decide

Siete cosas, y ninguna la cierra la confirmación del CTO:

| Abierto | Por qué no lo cierra este ADR |
|---|---|
| **Si `playbook` y SLA son canónicos del CRM o de la Plataforma** | La evidencia del spec apunta al CRM (§15.3, §21: el Intervention Engine es del CRM), pero **es una propuesta pendiente de `C01-044`, no una decisión de este ADR**. Queda anotada como tal en el anexo |
| **Si Reviewer (R1) es un operador** | El CTO confirmó sobre **operadores**. `product.md` §4 lista R1 como rol distinto. Si no lo es, su superficie no queda dispuesta acá |
| **Dónde vive `WF-I01`** | Está en la sección **9 — Institución** del spec, no en la 8. Es una superficie de **cliente B2B**, no de operador. §18.1 le da al CRM la relación B2B, pero lo que `WF-I01` muestra son agregados académicos |
| **Quién produce `OPEN → ACKNOWLEDGED → INTERVENTION_REQUIRED`** | *"Un operador la vio"* es un hecho del CRM; *"esto necesita una persona"* lo declara `risk_rule.modo = 'HUMANA'`, que es configuración de la Plataforma. Pertenece a `C01-022` |
| **Endpoints, payloads y nombres de campo** | Los versiona el CTO ([ADR-003](#adr-003)) |
| **El mecanismo concreto de autenticación entre servicios** | Ídem. Que exista el patrón —`POST /api/reloj` ya corre con secreto de servicio— no lo elige |
| **Qué contenido personal circula entre sistemas** | Queda condicionado por [ADR-006](#adr-006) y la Fase B7: consentimiento, minimización y retención |

### Qué cláusulas corrige, y qué se preserva

**Ninguno de los dos ADR se edita.** Los dos siguen `ACCEPTED`, con su contexto y sus razones
intactos: lo que decidieron era correcto para lo que tenían adelante.

| ADR | Cláusula corregida | Cómo queda |
|---|---|---|
| [ADR-012](#adr-012) | *"La Fase A1 se difiere al Track B"* y *"su contenido se absorbe en la Fase B6"* | **Corregido:** no se difiere, se reubica. Las cinco no vuelven al roadmap de la Plataforma en ninguna fase |
| [ADR-012](#adr-012) | *"Queda pendiente de evaluar, cuando se llegue a B6, si `WF-O04` merece una versión mínima anticipada"* | **Cerrado por no-aplicable** (Decisión 4) |
| [ADR-032](#adr-032) | *"Las cinco superficies de operador. No se construyeron: **no hay sesión de operador**, y fabricar una sería inventar el esquema de autenticación"* | **Corregido:** no es que falte la sesión de operador — **no debe existir**. El bloqueo era circular: la persona nunca se autentica contra la Plataforma |
| [ADR-032](#adr-032) | *"Cualquier endpoint HTTP de riesgo o intervención"* como bloqueado por la autenticación | **Corregido:** el mecanismo no está bloqueado —`POST /api/reloj` ya usa secreto de servicio—. Lo que falta es la **forma y el versionado del contrato**, que es del CTO |
| [ADR-012](#adr-012) razón 2, y [ADR-003](#adr-003) entero | Reconciliar el vocabulario del rol Operador antes de bautizarlo | **Se confirma, y se cumplió.** El vocabulario del operador nunca se bautizó en la Plataforma |

### Qué NO toca

**El dominio de la Fase B6 sigue siendo válido.** Se construyó sin asumir en ningún momento una
superficie de operador, y esta corrección no cambia una línea de él: `risk_signal` con causa
obligatoria, `risk_rule` como configuración sin umbral, `intervention` con dueño y outcome
obligatorio, los cuatro escritores transaccionales, `circuito_de_senales()`, el `Auditor`, el reloj y
el modificador de riesgo en `UX01`.

Que la corrección sea documental **es consecuencia de no haber inventado el contrato v2**. Si en la
B6 se hubiera fabricado una sesión de operador para poder mostrar una cola, hoy habría que borrarla.

Tres artefactos quedan marcados, y **ninguno se toca en este commit**:

| Artefacto | Estado | Cuándo cambia |
|---|---|---|
| `DirectorioDeOperadores` | **Transitorio, superado en dirección.** Preguntarle al CRM *"¿existe este operador?"* sobre una identidad que el propio CRM asertó en un comando autenticado es pedirle a un emisor que valide su propia afirmación | Se retira cuando exista un contrato aceptado. Hasta entonces es lo único que hace que `owner_verified = false` sea un hecho registrado y no un descuido |
| `intervention.owner_verified` | Significa hoy *"había un directorio que pudiera confirmarlo"* | **No se redefine en el lugar.** Cuando llegue el contrato, columna, valor o versión nuevos que preserven las filas históricas |
| `playbook` | Tabla vacía, ownership propuesto al CRM | Lo decide `C01-044`, no este ADR |

### Consecuencias

- La ex-Fase A1 **desaparece del roadmap de la Plataforma**. No está diferida: no es nuestra.
- `C01-039` deja de bloquear cinco superficies. Sigue abierta por `human_assignment` y por el canal
  de comandos.
- **El contrato v2, como está redactado, no tiene canal de escritura CRM → Plataforma.** Sus tres
  flujos son autorización (Plataforma→CRM), actividad (Plataforma→CRM) y contexto vivo
  (CRM→Plataforma, **de lectura**). Sin un cuarto, el circuito que la B6 construyó **no puede
  cerrarse nunca**, porque el eslabón que lo cierra ocurre en el otro sistema. Queda registrado en
  `platform-integration-contract.md` §2.2.
- `POST /api/service/v1/authorize`, la autorización de estudiantes y `platformStudentId` quedan
  **intactos**. Son de estudiantes, no de operadores, y no se mezclan con Risk ni con Intervención.

---

<a id="adr-034"></a>
## ADR-034 — `C01-022` cerrada: la necesidad de una persona la declara la Plataforma, no quien la mira

**Estado:** ✅ `ACCEPTED` · 1 de septiembre de 2026 · **decidido por el owner**
**Cierra:** `C01-022` — la semántica de las transiciones del closed-loop.
**Corrige la máquina que fijó:** [ADR-032](#adr-032) *(no se edita; ver "Qué cláusula corrige")*.
**Depende de:** [ADR-033](#adr-033), que puso al operador del lado del CRM.
**Reabre como dependencia obligatoria:** el ítem 5 de [ADR-005](#adr-005) (outbox y observabilidad),
que estaba `DEFERRED`.
**No cierra:** `C01-021`, `C01-044`, `C01-039`, `C01-036`, ni [ADR-006](#adr-006).
**Toca:** `product.md` §5.5, `data-model.md` §10, `roadmap.md`,
[`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md).

### Contexto — la máquina no se podía recorrer

[ADR-033](#adr-033) sacó al operador de la Plataforma. Al contrastar el contrato candidato del CTO
contra el código apareció un bloqueo duro: la secuencia que ese contrato propone **no se puede
ejecutar**.

La máquina de [ADR-032](#adr-032) era `OPEN → ACKNOWLEDGED → INTERVENTION_REQUIRED`, y
`abrir_intervencion()` frena si la señal no está en `INTERVENTION_REQUIRED`. Para que el CRM pudiera
abrir una intervención, la Plataforma tenía que escribir antes `ACKNOWLEDGED` — un estado que
significa *"alguien tomó conocimiento"* cuando **todavía nadie vio nada**.

El error de origen es de la B6, y es identificable: la máquina se dibujó cuando se suponía que la
cola de operador viviría acá. Con el operador adentro, *"alguien la miró"* era un paso real del
recorrido. Con el operador afuera, ese paso **no tiene quién lo produzca** y quedó como un peaje sin
cobrador.

### Decisión — Opción A

**1 · Se habilita `OPEN → INTERVENTION_REQUIRED`.** La necesidad de intervención humana **la produce
la Plataforma a partir de su configuración**, particularmente `risk_rule.modo`. No depende de que
alguien la haya visto, y no depende del CRM.

**2 · El transporte no es estado de dominio.** Que el webhook se haya enviado, entregado o
reintentado **no mueve `risk_signal`**. Ese estado vive en el outbox. `ACKNOWLEDGED` **no** significa
*"evento enviado al CRM"*, y no se lo reutiliza para eso.

**3 · Hacerse cargo es un hecho de la intervención, no de la señal.** Lo asserta el CRM con el
comando `acknowledge`, y **no es paso previo** para determinar que la señal requiere intervención.

**4 · La señal se queda en `INTERVENTION_REQUIRED` mientras la obligación humana esté abierta.** Al
cerrar, en **una sola transacción**: se registra el outcome, se cierra la intervención y la señal
pasa a `RESOLVED`.

**5 · `EXPIRED` sale sólo de `OPEN`.** Una señal que ya pide una persona no se vence sola —era la
regla 3 de ADR-032 y **se endurece**: al desaparecer `ACKNOWLEDGED` del recorrido vivo, la única
puerta que queda hacia `EXPIRED` es `OPEN`.

La máquina resultante:

```
OPEN ──────────────► INTERVENTION_REQUIRED ──► RESOLVED
 │                                          ↘  ESCALATED
 └──► EXPIRED

ACKNOWLEDGED  ·  legacy (ver abajo)
```

### `ACKNOWLEDGED`: qué se audita y qué NO hay que construir

El owner pidió auditar cuál es la representación técnica mínima para que el reconocimiento del
operador quede registrado **sin mover la señal**. El resultado de la auditoría es que **ya existe, y
no hay que construir nada**:

| Pieza | Dónde está | Desde |
|---|---|---|
| El estado `acknowledged` de la intervención | `intervention.status` | B6 |
| El momento en que se hizo cargo | `intervention.acknowledged_at` | B6 |
| La transición, con su máquina | `interventionTransitions`, `open → acknowledged` | B6 |
| El evento | `InterventionAcknowledged`, nivel `TRANSICION` | B6 |

El reconocimiento **siempre estuvo del lado correcto**. Lo que sobraba era su duplicado en
`risk_signal`.

**`ACKNOWLEDGED` queda `legacy` y no se borra.** Ni el valor del `CHECK`, ni la columna
`risk_signal.acknowledged_at`, ni el evento `RiskSignalAcknowledged`, ni las filas que lo tengan. Una
fila histórica **conserva su significado original** —*"alguien tomó conocimiento"*— y conserva sus
salidas, para que una señal vieja pueda terminar su recorrido. Lo único que cambia es que **ninguna
señal nueva entra ahí**.

> Es la misma regla con la que la B5 apagó `EP-SPEC v0.1` con un `UPDATE` y no un `DELETE`, y con la
> que ADR-033 prohibió redefinir `owner_verified` en el lugar. **Reinterpretar un valor existente es
> reescribir lo que pasó.**

### Las decisiones del contrato v1

Se detallan en [`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md). En resumen:

| Asunto | Decisión |
|---|---|
| **Severidad** | El enum queda fijado tal como está en el schema: `bajo`, `atencion`, `riesgo`, `intervencion`. **`C01-021` no bloquea el vocabulario**; sigue bloqueando qué regla asigna cuál |
| **Causa** | `cause` obligatorio. Su **texto legible es obligatorio**; `cause.code` puede ser `NULL` cuando no haya `risk_rule_id`. **No se inventa una regla para completar un código** |
| **Institución** | `institutionId` **sale del payload v1**. El CRM resuelve la institución por `platformStudentId`, cuya relación creó `/authorize`. No se comparan UUID de instituciones por inferencia (`C01-001`) |
| **Playbook** | `playbookRef` **fuera de v1** hasta `C01-044`. La tabla local no se toca |
| **`crmCaseId`** | **Se acepta.** Requiere ampliación de schema **no destructiva**. No se descarta en silencio |
| **Timestamps** | `occurredAt` es la hora **declarada por el CRM** y se conserva para auditoría. La hora canónica de la transición es la del servidor de la Plataforma. **El CRM no puede backdatear el lifecycle** |
| **Owner** | En v1, quien reconoce y cierra **debe ser el mismo `ownerOperatorId` que abrió**. Una diferencia es rechazo explícito. La reasignación necesita un comando propio |
| **Cierre** | `outcome` y `humanMinutes` (entero `>= 0`) **obligatorios**. `note` opcional, y **bloqueada para datos reales por B7**: no es un canal lateral para evidencia |
| **Flujo C** | La fuente es `estado_del_dia()`, no `estado_de_materia()`. Salen `subjects[].status` y `nextAction.dueAt` |

### El outbox deja de ser opcional

El flujo A es **push**, y push sin outbox durable es pérdida silenciosa de señales. El ítem 5 de
[ADR-005](#adr-005) —Broadcast/outbox, rotación de secretos, observabilidad— estaba `DEFERRED` y
**pasa a ser dependencia obligatoria** de la integración: persistencia transaccional del evento,
reintentos, backoff, idempotencia, observabilidad, rotación de secretos y estados de entrega.

**El outbox no toca `risk_signal`.** Que un evento esté pendiente, entregado o agotado es estado de
transporte, y confundirlo con estado de dominio es exactamente lo que la decisión 2 prohíbe.

### Qué cláusula corrige de ADR-032

[ADR-032](#adr-032) **no se edita.** Sigue `ACCEPTED`, y sus otras siete decisiones siguen vigentes
sin cambios.

| Cláusula | Cómo queda |
|---|---|
| *"`RESOLVED` sólo se alcanza desde `INTERVENTION_REQUIRED`, y sólo con una intervención con outcome"* | **Intacta.** Es la que más importa y no se toca |
| *"`EXPIRED` sale sólo de `OPEN` y `ACKNOWLEDGED`"* | **Corregida y endurecida:** sale sólo de `OPEN` |
| La máquina `OPEN → ACKNOWLEDGED → INTERVENTION_REQUIRED` | **Corregida:** `OPEN → INTERVENTION_REQUIRED`. `ACKNOWLEDGED` queda legacy |
| *"El disparador no es una severidad: es que la señal misma esté en `INTERVENTION_REQUIRED`"* | **Intacta**, y ahora además es coherente: ese estado lo declara `risk_rule.modo`, no un umbral |

### Lo que NO cierra

- **`C01-021`** · qué regla produce qué señal y con qué severidad. El enum quedó fijo; el asignador no
  existe, y sigue el guard estático que rompe si alguien lo agrega.
- **`C01-044`** · playbooks y SLA. Sigue siendo propuesta que `playbookRef` sea del CRM.
- **`C01-039`** · `human_assignment` y el directorio.
- **`C01-036`** · qué es un error *"reiterativo"*. **De la psicopedagoga.**
- **[ADR-006](#adr-006)** · ningún dato real circula por ninguno de los tres flujos.
- **`assessments[]` del flujo C** — hallazgo nuevo de esta revisión: **ninguna proyección canónica
  produce hoy la lista de evaluaciones a través de todas las materias**. Ver el §4 del contrato v0.2.

### Estado de implementación

✅ **§7.1 y §7.2 ejecutados** el 2 de septiembre de 2026. `OPEN → INTERVENTION_REQUIRED` es directo,
`ACKNOWLEDGED` quedó legacy con triple cierre —fuera de la tabla de transiciones, excluido del tipo
de `transicionar`, y un trigger que lo rechaza en la base—, el reloj sólo levanta `OPEN`, y las filas
históricas conservan estado, marca y salidas.

✅ **§7.4 y §7.5 ejecutados** el 2 de septiembre de 2026. `cerrar_intervencion()` escribe outcome,
cierra la intervención y resuelve la señal en una transacción, y rechaza a quien no es el dueño del
caso. `resolver_senal()` se conserva intacta para los cierres por otro camino.

✅ **§7.6 ejecutado** el 2 de septiembre de 2026, cuando el CRM aceptó el diseño del flujo C y pidió
los identificadores: `estado_del_dia()` expone `materias[].cursadaId` y `accion.id`, sin que ninguno
llegue a la pantalla.

⏸️ **Pendientes:** §7.3 (`crmCaseId`), que espera el endpoint que escriba la columna, y §7.7 (outbox),
que espera `C01-021` — sin reglas que produzcan señales no tiene qué transportar. Ver
[`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md) §7 y §10.

---

<a id="adr-035"></a>
## ADR-035 — La integración con el CRM se difiere; el dominio sigue adelante

**Estado:** ✅ `ACCEPTED` · 2 de septiembre de 2026 · **decidido por el owner**
**Difiere:** la firma y la construcción de los tres flujos de
[`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md).
**No revierte:** nada de lo construido. **No reabre:** [ADR-033](#adr-033) ni [ADR-034](#adr-034).
**Toca:** `roadmap.md`, `contrato-riesgo-candidato-v0.2.md`, `pending-decisions-annex.md`.

### Contexto

El contrato llegó a un punto raro y bueno: **el diseño está aceptado por los dos lados y no hay una
sola objeción**. El CRM lo revisó contra su código, confirmó que resuelve institución, cola y
operador partiendo sólo de `platformStudentId`, y no pidió de vuelta ninguno de los cinco campos que
la v0.2 había retirado.

Lo que falta son **tres definiciones de forma** —envelope de error, `cause.code`, y el esquema de dos
secretos con rotación— y **construcción de los dos lados**, casi toda del lado del CRM.

Pero por debajo hay un hecho que ordena la prioridad: **`C01-021` sigue abierta**. Sin reglas que
produzcan señales, el flujo A no tiene qué transportar. Se puede construir el mecanismo entero —HMAC,
outbox, endpoints, idempotencia— y no va a circular un solo evento.

### Decisión

**La integración con el CRM se difiere al final del Track B.** No se firman las tres definiciones ni
se construyen los flujos hasta que el resto esté cerrado.

**No es un bloqueo: es una prioridad.** Nada impide firmar mañana; lo que dice esta decisión es que
no es lo que sigue.

### Por qué se puede diferir sin costo

**El dominio de riesgo e intervención está completo y no espera al contrato.** El circuito cierra por
construcción, corre contra Postgres y está probado: señal con causa obligatoria, `OPEN →
INTERVENTION_REQUIRED` directo, intervención con dueño, outcome obligatorio para cerrar, señal
`RESOLVED` con el mismo `COMMIT`, y auditoría de todo.

**Los tres comandos del flujo B ya existen** como funciones transaccionales. Cuando el contrato se
firme, lo que falta es un Controller que las llame — no lógica de dominio.

**Nada caduca.** Las tres definiciones pendientes son de forma, no de diseño, y ninguna depende del
paso del tiempo. El acuerdo bilateral queda escrito con su evidencia en §10 del contrato.

**Y la parte que sí se podía adelantar, se adelantó.** `estado_del_dia()` ya expone los
identificadores que el CRM pidió (§7.6): era lo único de su lista que dependía sólo de nosotros.

### Qué queda pendiente, y en qué orden se retoma

Cuando se retome, el orden está escrito en §7.8 del contrato y §10.5 dice quién construye qué. Del
lado de la Plataforma quedan exactamente dos pasos —§7.3 (`crmCaseId`) y §7.7 (outbox)— más los
Controllers.

**El outbox arrastra el ítem 5 de [ADR-005](#adr-005)**, que sigue `DEFERRED`, y **es el mismo trabajo
que la rotación de secretos** que el contrato necesita. Conviene hacerlos juntos, una sola vez.

### Consecuencias — qué es el camino crítico ahora

Con la integración diferida, **lo que queda del Track B es de tres personas distintas y una etapa
nuestra**:

| Qué | De quién |
|---|---|
| `C01-021` · qué regla produce qué señal y con qué severidad | Risk owner. **Es el bloqueo #1 de los dos sistemas** |
| `C01-036` · cuántas repeticiones hacen a un error *"reiterativo"* | **Psicopedagoga.** Ya está en su agenda, y `C01-021` lo necesita |
| `C01-044` · playbooks y SLA | Product Operations |
| [ADR-006](#adr-006) · dictamen legal | Legal. Bloquea B7, y B7 bloquea B8 |
| **Etapa B2b.2 · corroboración** | **Nuestra, y no depende de nadie** |

**B2b.2 es el único frente de construcción que queda sin dependencias externas**: la operación
explícita que sí puede elevar un `verification_status`, que hoy no existe porque `I9` prohíbe que el
ingestor lo toque. (B2b.3 necesita `C01-042`.)

Fuera del roadmap sigue en pie la deuda de [ADR-008](#adr-008): **3 vulnerabilidades `high`**, con la
restricción del owner de no correr `npm audit fix --force` sobre la rama principal.

---

<a id="adr-036"></a>
## ADR-036 — Cierre **provisional** de `C01-036` y `C01-021` para desbloquear el MVP

> ## ⚠️ `PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION`
>
> | | |
> |---|---|
> | **Autoridad** | **Product Owner.** No es una definición clínica, pedagógica ni psicopedagógica, y **no se le atribuye a la psicopedagoga** |
> | **Alcance** | MVP con **datos sintéticos** exclusivamente |
> | **Estado** | **Provisional** |
> | **Revisión obligatoria** | **Antes de cualquier piloto con estudiantes reales** |
> | **Responsable de la validación posterior** | La **psicopedagoga** |
> | **Impacto si cambia** | **Configuración y reglas versionadas. No rediseño del dominio** |

**Estado:** ✅ `ACCEPTED` · 2 de septiembre de 2026 · **decidido por el owner**
**Avanza provisionalmente:** `C01-036` y `C01-021`. **No los cierra**: siguen `OPEN` en el anexo,
esperando validación profesional.
**No toca:** [ADR-035](#adr-035) — la integración con el CRM sigue congelada.
**Toca:** `data-model.md`, `product.md`, `roadmap.md`, `pending-decisions-annex.md`.

### Contexto — el hallazgo que ordenó el trabajo

**No existía ninguna entidad de error.** Ni tabla, ni `error_type`, ni el `WF-S12 Mapa de Errores`
del spec. La regla cuenta apariciones *"del mismo `error_type` normalizado"*, y ese dato no se
registraba en ningún lado.

Sin eso, cualquier regla habría tenido que **inferir** el error desde el texto de una evidencia — que
es exactamente lo que la decisión prohíbe: *"un error meramente inferido, ambiguo o no corroborado no
incrementa el contador"*.

### Decisión 1 · `C01-036` — qué es un error reiterativo, provisionalmente

**La identidad del error es el tipo, no el tema.** El tema es contexto explicativo; dos errores del
mismo tipo cuentan aunque ocurran en ejercicios distintos.

El alcance del contador es **la preparación del mismo examen**. Sólo cuentan las observaciones
**corroboradas**, y una **resolución correcta, independiente y sin ayuda reinicia el contador** de ese
tipo. Si no se puede determinar con confianza que dos errores son del mismo tipo, **se conservan
separados**.

**Seis tipos**, cargados como configuración versionada `v1.0-po-provisional`: conceptual,
procedimiento, interpretación de consigna, cálculo, omisión de paso obligatorio y dependencia de
ayuda externa. **Se verificó que el dominio no tuviera otro vocabulario** antes de introducir éste.

> ⚠️ **Una ambigüedad que resolví y hay que revisar.** *"Sólo cuentan intentos evaluables con
> evidencia suficiente"* se implementó como **"una evidencia que alguien juzgó"** —`SUFFICIENT`,
> `INSUFFICIENT` o `VALIDATED`— y no como *"una evidencia en estado `SUFFICIENT`"*. La segunda lectura
> haría que un error encontrado en una entrega insuficiente no contara, que es al revés de lo
> esperable. **Es la interpretación de un agente sobre una frase ambigua, y va a la lista de la
> psicopedagoga.**

### Decisión 2 · `C01-021` — la regla mínima, provisional

Una sola regla, sobre `HP0-06-1`: segunda aparición → `atencion`; tercera → `intervencion` con
`requiresHumanIntervention`; **una nueva aparición después de una acción correctiva** → `intervencion`
sin esperar la tercera; una resolución limpia reinicia; las señales no se duplican por
reprocesamiento.

**No se agregó ninguna otra regla.** `HP0-06-2` y `HP0-06-3` siguen en `v1.0`, sin umbral y en modo
`HUMANA`: nadie decidió las suyas.

**No hay motor probabilístico.** Es un conteo sobre una lista ordenada, puro, en `lib/domain/`. El
mismo input da el mismo output siempre, y hay tests que lo prueban corriendo dos veces.

#### Cómo se preservó lo que dijo ella

`HP0-06-1 v1.0` **no se tocó**: se apagó con un `UPDATE` de `is_current` y su `source_text` verbatim
quedó intacto. El umbral entra en una **fila nueva**, `v2.0-po-provisional`, cuya procedencia dice de
quién es: `provisional_default_id = 'PO-MVP-C01-021'`, no `HUMAN-P0-06`.

Mismo criterio con el que la B5 apagó `EP-SPEC v0.1` y [ADR-034](#adr-034) dejó `ACKNOWLEDGED` como
legacy. **Cambiar una configuración histórica en el lugar es reescribir lo que alguien afirmó.**

Y como `risk_signal` guarda `risk_rule_id` y `rule_version`, **una señal conserva la versión que la
produjo**: cambiar el umbral mañana no reescribe las señales de ayer.

### Decisión 3 · Vigencia del Roadmap de examen

El Roadmap **está vigente mientras la preparación esté activa**, y deja de estarlo cuando el examen se
rinde (`EXAM_TAKEN`), el estudiante abandona (`ABANDONED`), el examen se cancela, o una
replanificación crea una versión nueva del plan. **Una replanificación no borra el historial: produce
una versión trazable.**

> ⚠️ **Dos cosas que esta decisión encontró y no fusiona.**
>
> **Cancelar un examen no es abandonar una preparación.** Lo primero es un hecho del `assessment`; lo
> segundo, un estado de `exam_preparation`. Hoy sólo existe el segundo. No se inventa el primero.
>
> **La replanificación choca con `UNIQUE (student_id, assessment_id)`**, que es donde vive el
> invariante `I7`, y `exam_preparation` no tiene columna de versión. Versionar el plan **no se
> implementa acá**: exige decidir si la nueva versión es otra fila (y entonces `I7` cambia de
> significado) o una entidad aparte. Queda registrado como abierto.

### Decisión 4 · Reentrancia de los pasos 9–18

Se permite volver a los pasos 9–18 desde uno posterior cuando una evidencia resulta insuficiente,
aparece un error reiterativo, cambia información del examen o una replanificación exige repetir.

**La reentrada no borra evidencias ni reduce el progreso histórico.** Eso ya era cierto desde la B5:
`protocol_step_completion` es append-only y `occurrence` cuenta las vueltas. Lo que se agrega ahora es
que la vuelta diga **por qué**, **desde qué paso** y **contra qué intento anterior** —
`reentry_reason`, `reentry_from_step_id`, `previous_completion_id`—, con un `CHECK` que impide
declarar una reentrada en la primera vuelta.

**No se permite saltear una condición obligatoria para mostrar progreso**, y no hay forma: la
completion es un hecho factual y `requirement` sigue en `NO_CONFIGURADA` para los veinte pasos.

### Lo que esta decisión NO hace

- **No cierra `C01-036` ni `C01-021`.** Siguen `OPEN`, con su avance provisional anotado.
- **No descongela la integración con el CRM** ([ADR-035](#adr-035)). No se construyó ningún endpoint,
  ni HMAC, ni outbox.
- **No construye superficies de operador.** Siguen siendo del CRM ([ADR-033](#adr-033)).
- **No habilita datos reales.** [ADR-006](#adr-006) sigue siendo bloqueo absoluto.
- **No cierra `C01-044`.** Playbook y SLA siguen en `null`, y el circuito lo declara.

### Qué tiene que validar la psicopedagoga

1. Si **dos apariciones** es el umbral correcto para *"reiterativo"*, y si **tres** lo es para llamar
   a una persona.
2. Si los **seis tipos de error** son el vocabulario correcto, o si hay otro.
3. Si *"intentos evaluables con evidencia suficiente"* significa lo que se implementó — ver la
   advertencia de la Decisión 1.
4. Si una **reincidencia tras una acción correctiva** debe saltar directo a intervención.
5. Si una **resolución limpia** debe reiniciar el contador **a cero** o descontar de a uno.
6. Las cuatro condiciones de vigencia del Roadmap y la lista de motivos de reentrada.

**Si cambia cualquiera de las seis, el impacto es cargar una versión nueva de configuración.** El
dominio no se rediseña: los umbrales no están en el código, y hay un guard estático que lo verifica.

---

<a id="adr-037"></a>
## ADR-037 — La validación profesional llegó, y los números no eran el problema

**Estado:** ✅ `ACCEPTED` · 2 de septiembre de 2026 · **respondido por la psicopedagoga**
**Fuente literal:** [`validacion-psicopedagogica-source.md`](validacion-psicopedagogica-source.md).
**Manda sobre este ADR**, que es una paráfrasis con plan de implementación.
**Responde a:** los seis valores provisionales de [ADR-036](#adr-036).
**Toca:** `data-model.md`, `product.md`, `roadmap.md`, `pending-decisions-annex.md`,
`agenda-cierre-psicopedagoga.md`.

> **Su dictamen, textual:** *"VALIDACIÓN CON MODIFICACIONES PARA MVP CON DATOS SINTÉTICOS. Las reglas
> pueden implementarse como defaults configurables, pero **no deberían trasladarse sin piloto a
> estudiantes reales**."*
>
> Y la frase que ordena todo lo demás: **"el sistema debe reconocer patrones, no etiquetar personas;
> toda escalada humana debe presentarse como apoyo y nunca como sanción."**

### El hallazgo: los umbrales quedaron donde estaban

Seis `CAMBIAR` y un `APROBAR`, y sin embargo **los dos números centrales no se movieron**:
`repeat_signal_at = 2` y `human_review_at = 3` son exactamente los que había puesto el Product Owner.

Lo que cambió es **qué cuenta como una repetición**. Su objeción no fue *"tres es poco"*: fue que
*"los umbrales numéricos… por sí solos no distinguen entre una dificultad persistente, una consigna
ambigua, una ayuda inadecuada, fatiga, ansiedad, barreras de accesibilidad o falta de enseñanza
previa"*.

**El problema no era el umbral. Era el denominador.**

### Lo que ya estaba bien, y conviene registrarlo

Tres cosas que validó sin cambios, y que son decisiones que el repositorio tomó defendiéndose de sí
mismo:

| Qué | Dónde estaba |
|---|---|
| **Separar la suficiencia de una entrega de la identificabilidad del error** (9.6, `APROBAR`) | La interpretación ambigua que [ADR-036](#adr-036) marcó como *"de un agente, y no debería haber tenido que interpretarla"*. Era la correcta: *"excluir entregas insuficientes **sesgaría la detección contra quienes más necesitan acompañamiento**"* |
| **Conservar evidencias y versionar el Roadmap** | `protocol_step_completion` append-only desde la B5 |
| **No bloquear el avance mientras espera respuesta** | El riesgo nunca ganó el Hero (`VI.1` §3.3) |

### Las siete decisiones, y qué le falta al sistema para cumplirlas

**1 · `9.1` — la unidad de conteo cambia.** Hoy se cuenta por `(preparación, tipo de error)`. Ella
exige `(estudiante, preparación, tipo de error, **objetivo de aprendizaje o demanda**)`, y avisa por
qué: *"dos errores procedimentales en contenidos no comparables **no necesariamente expresan la misma
dificultad**"*.

Y una separación que hoy no existe: **'repetición detectada' no es 'dificultad confirmada'**. La
señal es *"una señal para explorar, no una prueba"*.

**2 · `9.2` — el contador deja de ser el único camino.** Se suman `early_review_triggers`
configurables: bloqueo manifiesto, malestar, pedido explícito de ayuda, alto impacto académico,
barrera de accesibilidad y **baja confianza del sistema**. Y *"la persona debe recibir el caso con la
evidencia y el historial de apoyos, **no sólo con un contador**"*.

**3 · `9.3` — acelerar exige que la ayuda haya sido válida.** Hoy alcanza con `after_action_id`. Ella
pide cinco condiciones: `correction_delivered`, `correction_accessible`, `learner_engaged`,
`new_independent_attempt` y `same_error_confidence`. El motivo es contundente: *"un feedback genérico,
demasiado complejo o no leído **no demuestra falta de aprendizaje; puede demostrar un problema de
intervención**"*.

**4 · `9.4` — dos aciertos, y el reinicio deja de ser un borrado.** Hoy un acierto limpio pone el
contador en cero. Ella pide dos, *"en tareas equivalentes pero no idénticas"*, y redefine la palabra:
*"'reiniciar' debe significar **cerrar el estado activo, no eliminar datos previos**"*. Con una
consecuencia estructural: una recaída **abre un episodio nuevo vinculado al anterior**.

**5 · `9.5` — 'dependencia de ayuda externa' sale, y no por precisión sino por daño.** *"La necesidad
de ayuda puede ser esperable y productiva; denominarla 'dependencia' corre el riesgo de
estigmatizar."* Pasa a ser **«necesidad de apoyo para avanzar», una condición de desempeño y no un
error**. Quedan cinco familias, con categoría **principal + secundaria**, **'clasificación incierta'**
y **corrección humana**.

**6 · `9.6` — aprobado, con tres estados de evidencia.** *Suficiente de logro*, *suficiente para
identificar un error*, *no interpretable*. Con `evidence_quality`, `error_identifiable` y
`classification_confidence`.

**7 · `9.7` — replanificar no cierra nada.** *"Cambiar una fecha suele ser una replanificación, **no
el inicio de un proceso completamente nuevo**"*. Estados `active`, `replanned`, `completed`,
`cancelled`, `explicitly_abandoned`, y **la inactividad sola no es abandono**.

La reentrada sigue siendo 9–18, pero **al primer paso estrictamente necesario**: *"una vuelta
indiscriminada puede aumentar carga, frustración y abandono"*. Se agregan dos motivos —pedido
fundamentado del estudiante, indicación humana— y **override humano**.

> **Y una regla transversal que es de interfaz, no de dominio.** Antes de volver atrás, Achieve tiene
> que explicar **por qué lo propone, qué se repite, qué evidencia sigue vigente y cómo pedir otra
> opción**.

### Lo que esto resuelve del `UNIQUE (student_id, assessment_id)`

[ADR-036](#adr-036) dejó abierto si versionar el plan era otra fila o una entidad aparte, porque
chocaba con el invariante `I7`. **Ella lo contestó sin saberlo:** *"crear una nueva versión del plan
**dentro del mismo historial**"* y *"cerrar y abrir otra preparación **sólo si cambia el evento
objetivo**"*.

Es decir: **una preparación por evaluación sigue siendo cierto**, `I7` no se toca, y la versión del
plan es algo **adentro** de la preparación. La restricción no era un obstáculo: era la respuesta.

### Estado de las decisiones

`C01-036` y `C01-021` pasan de **provisionales del Product Owner** a **criterio profesional con
modificaciones**. **No se cierran**: ella condicionó explícitamente el uso con estudiantes reales a
*"piloto, revisión humana, explicabilidad, accesibilidad y monitoreo de equidad"*.

Y **[ADR-006](#adr-006) sigue siendo bloqueo absoluto**: su validación es de producto, no una
autorización de tratamiento de datos.

### Estado de implementación

| Punto | Etapa | Estado |
|---|---|---|
| `9.5` — el vocabulario | **B6.7.1** | ✅ **Implementado** el 2 de septiembre de 2026. Migración `20260906000000_vocabulario_psicopedagogico.sql`. Ver [`roadmap.md`](roadmap.md) y [`data-model.md`](data-model.md) §10.0.1 |
| `9.1`, `9.6` — el denominador | **B6.7.2** | ✅ **Implementado** el 2 de septiembre de 2026. Migración `20260907000000_denominador_psicopedagogico.sql`. Ver [`data-model.md`](data-model.md) §10.0.2 |
| `9.2`, `9.3`, `9.4` — acelerar y reiniciar | B6.7.3 | ✅ **Implementado** el 2 de septiembre de 2026. Migración `20260908000000_acelerar_y_reiniciar.sql`: cinco condiciones conjuntas, dos aciertos, episodio vinculado y seis disparadores tempranos |
| `9.7` — replanificar y volver | B6.7.4 | ✅ **Implementado** el 2 de septiembre de 2026. Migración `20260909000000_replanificar_y_volver.sql`, contrato técnico en ADR-038 y fixture `FX-LOCAL-PASO-REENTRADA-MINIMA` |

**Lo que la B6.7.2 dejó explícitamente sin hacer:** *"cómo se define una **tarea comparable**"* está
entre lo que ella pidió evaluar antes de un piloto, así que `learning_objective` **nace vacía** y la
comparabilidad se declara. Y dos claves de `threshold_config` —`reincidencia_tras_correctiva` y
`reinicia_con_resolucion_limpia`— siguen llevando el valor del Product Owner: están nombradas en
`pendiente_b6_7_3`, porque `9.3` y `9.4` las corrigen.

**Un hallazgo de la B6.7.1 que conviene dejar escrito acá:** cargar una versión nueva del vocabulario
**parte el contador** si éste filtra por `error_type_id`, porque esa columna apunta a una fila de
versión. La identidad de un error es el `canonical_id`. Se corrigió antes de cargar `v2.0`, y vale
para cualquier vocabulario versionado que un contador lea.

### Lo que NO cambia

- **La arquitectura.** Todo esto es configuración versionada, columnas aditivas y una regla pura que
  ya recibe su umbral de afuera. [ADR-036](#adr-036) prometió que *"si cambia, el impacto es cargar
  una fila de configuración"* — se cumple para los números, y para lo demás son columnas nullable.
- **La integración con el CRM**, congelada por [ADR-035](#adr-035).
- **Los valores del Product Owner no se borran.** `v2.0-po-provisional` se apaga con un `UPDATE`,
  como `EP-SPEC v0.1` y como `ACKNOWLEDGED`.

---

## ADR-038 — Replanificar versiona dentro de la preparación; volver exige una propuesta aceptada

**Estado:** `ACCEPTED`  
**Fecha:** 2 de septiembre de 2026  
**Origen:** `validacion-psicopedagogica-source.md` §9.7 y ADR-037  
**Etapa:** B6.7.4

### Contexto

La respuesta profesional resolvió dos ambigüedades que ADR-036 había dejado abiertas. Un cambio de
fecha del mismo examen conserva la preparación y crea *"una nueva versión del plan dentro del mismo
historial"*; una reentrada vuelve al *"primer paso estrictamente necesario"* y, antes de mover el
recorrido, explica motivo, actividad, evidencia conservada y cómo pedir otra opción.

### Decisión

1. **`I7` queda intacto.** Sigue existiendo una sola `exam_preparation` por estudiante y
   `assessment`. Cada replanificación agrega una `exam_preparation_plan_version`; nunca crea una
   segunda preparación ni borra una versión anterior.
2. **`REPLANNED` sigue siendo un estado vivo.** Completar pasos admite `ACTIVE` y `REPLANNED`.
   `CANCELLED` y `EXPLICITLY_ABANDONED` son cierres explícitos; el legacy `ABANDONED` se migra al
   segundo. Ningún reloj ni regla de inactividad produce esos estados.
3. **La política es configuración versionada.** El tramo 9–18 y los seis motivos confirmados viven
   en `protocol_reentry_policy`/`protocol_reentry_reason`, versión
   `HUMAN-P0-9.7 v1.0`; no quedan como constantes del Service.
4. **Volver es una decisión en dos tiempos.** Primero se persiste una
   `protocol_reentry_proposal`, con motivo, paso de origen, primer paso necesario declarado,
   justificación, actividad que se vuelve a trabajar y explicación de la evidencia que sigue
   vigente. Eso **no mueve** `current_step_id`. Sólo aceptar la propuesta —o un override humano
   explícito— mueve el puntero; pedir otra opción conserva el paso actual.
5. **La Plataforma no decide cuál paso es necesario.** El destino lo declara el owner de la
   propuesta y Postgres sólo comprueba que pertenece al mismo protocolo, está dentro del tramo
   configurado y es anterior al origen. Elegir entre varias rutas sigue siendo decisión compartida,
   no ranking local.
6. **Mover el puntero no completa nada.** La operación no escribe `protocol_step_completion`,
   `Evidence`, `ProgressUpdated`, apoyos ni alertas. Todos esos hechos siguen ligados a la misma
   preparación y por eso permanecen visibles en el historial.

### Interfaz

`UX09` proyecta la propuesta pendiente como panel explicativo antes de cualquier CTA del paso. La
acción primaria acepta la vuelta; la secundaria pide otra opción. La pantalla no deriva el motivo,
no reduce progreso y no presenta la reentrada como castigo.

### Consecuencias

- La explicación existe antes del cambio, no como texto retrospectivo.
- Replanificar varias veces conserva una secuencia auditable y una sola preparación.
- El override humano queda soportado en dominio y persistencia, pero no se inventa una superficie de
  operador: esa frontera sigue en ADR-033.
- Todo continúa limitado a datos sintéticos por ADR-006.
