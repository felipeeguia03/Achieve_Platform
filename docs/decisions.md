# Achieve — Registro de decisiones de arquitectura (ADR)

**Documento:** `docs/decisions.md`
**Rol:** owner canónico de las decisiones tomadas y pendientes de este repositorio.
**Última actualización:** 29 de agosto de 2026

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
| [ADR-003](#adr-003) | Convergencia Operador ↔ coach de Dashboard_Achieve | `PENDING` | Fase B6 |
| [ADR-004](#adr-004) | Diseño del pipeline del Academic Decision Engine | `PENDING` | Fase B4 |
| [ADR-005](#adr-005) | Motor de base de datos, auth y persistencia | `PENDING` | Todo el Track B |
| [ADR-006](#adr-006) | Privacidad y consentimiento de datos reales | `PENDING` | Toda fase con datos reales |
| [ADR-007](#adr-007) | Las 8 decisiones `HUMAN-P0` | `PENDING` | Contenido de Fase B5 |
| [ADR-008](#adr-008) | Stack y runtime del frontend | `ACCEPTED` | — |
| [ADR-009](#adr-009) | Colisión de namespace `D1–D25` vs `D1–D10` | `ACCEPTED` | — |
| [ADR-010](#adr-010) | Respuestas DD1–DD10 de traducción al dominio | `ACCEPTED` *(DD4 `DEFERRED`)* | — |
| [ADR-011](#adr-011) | Owner canónico de `PreparationReadiness` (CR-UX08-01) | `PENDING` | Readiness visible en Fase B5 |
| [ADR-012](#adr-012) | Alcance de Track A: Operador e Institución se difieren | `ACCEPTED` | — |
| [ADR-013](#adr-013) | Contenido duplicado en `pending-decisions-annex.md` | `ACCEPTED` | — |
| [ADR-014](#adr-014) | Desktop-first y contrato del primer viewport | `ACCEPTED` | — |
| [ADR-015](#adr-015) | Dónde vive la CTA principal en desktop | `ACCEPTED` | — |
| [ADR-016](#adr-016) | Ninguna CTA del registro lleva a `UX07` | `PENDING` | Golden Path recorrible (0.8) |
| [ADR-017](#adr-017) | Las dos CTAs ambiguas de `product.md` §10.2 | `ACCEPTED` | — |
| [ADR-018](#adr-018) | El lenguaje visual sale de las capturas, y hay que mirarlas | `ACCEPTED` | — |
| [ADR-019](#adr-019) | El dock inferior no se construye; `Ausencia` ocupa su etapa | `ACCEPTED` | [ADR-018](#adr-018) |
| [ADR-020](#adr-020) | Cuántas clases de ausencia distingue Achieve, y con qué palabras | `PENDING` | [ADR-019](#adr-019) |
| [ADR-021](#adr-021) | Qué es, en Achieve, el «trabajo pendiente que caduca» | `ACCEPTED` | — |
| [ADR-022](#adr-022) | `C-04` elevado: el vacío argumenta, con tercera cláusula condicional | `ACCEPTED` | — |

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

**Estado:** `PENDING — esperando decisión del producto`
**Bloquea:** Fase B6 (Operador real). *(Antes bloqueaba también la Fase A1, que
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

### Decisión requerida antes de

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
## ADR-004 — Diseño del pipeline del Academic Decision Engine

**Estado:** `PENDING — esperando decisión del producto`
**Bloquea:** Fase B4 (ADE real). No bloquea el Track A, que usa salidas de ADE prefijadas.
**Relacionado:** `C01-006` (ADE y `ActionRecommendation`), `C01-021` (Risk Engine), `C01-022`.
**Toca:** `architecture.md`, `data-model.md`, `roadmap.md`.

### Contexto

El ADE es el componente que responde "¿qué acción conviene hacer ahora?". Todo el producto está
construido alrededor de él, y **su lógica no está diseñada**. El contrato `C01-006` sigue `OPEN`.

Lo que el spec sí congela, y que cualquier diseño debe respetar:

- **Salida mínima** (Parte I §9.2): materia + tema/objetivo + acción concreta + tiempo estimado +
  recurso/fuente + evidencia esperada + razón de la recomendación.
- **La UI nunca rankea.** `TodayView`, Materia, Overview de examen y Bitácora son proyecciones que
  releen una recomendación principal ya elegida por el ADE. Si el ADE devuelve varias
  recomendaciones sin una principal, eso es un **error de contrato**, no un caso a resolver en el
  frontend.
- **Cuatro ramas de salida obligatorias:** `NEW` (recomendación vigente), `NONE` (ausencia
  autoritativa), `ERROR` (fallo, con reintento) y `PENDING` (resultado todavía no disponible). Están
  modeladas en los fixtures `FX-ADE-*`.
- `academic_context_blocker` (`C01-050`) es **semánticamente distinto** de `NONE`: el primero es
  falta de contexto académico, el segundo es una ausencia que el ADE ya confirmó.
- El objetivo de optimización provisional (§9.3) es "maximizar avance sostenible del semestre y
  preparación suficiente de evaluaciones, sujeto a disponibilidad real y sin abandonar la
  construcción de autonomía".

### Propuesta existente — NO CONFIRMADA

El anexo de decisiones pendientes registra una propuesta de arquitectura identificada el 28 de agosto
de 2026, en estado **`OPEN — PROPUESTA EN EVALUACIÓN, NO CONFIRMADA`**:

> Contexto académico verificado → paso actual del protocolo → reglas de elegibilidad/prioridad → un
> LLM genera una `ActionRecommendation` estructurada (JSON con `objective`, `verb`, `scope`,
> `conditions`, `estimated_minutes`, `resource_id`, `expected_evidence`, `completion_criterion`,
> `reason`, `confidence`, `requires_human_review`) → validador determinista (el recurso existe, el
> tema pertenece al examen, la duración entra en la disponibilidad, no duplica una acción, no afirma
> dominio/progreso/readiness inexistente) → publicación automática o revisión humana según confianza.

**Esta propuesta no es el spec final y no debe implementarse como si lo fuera.** Su gate material es
`H` — antes de mover a high-fidelity cualquier pantalla que dependa de una recomendación real.

### Qué falta decidir

1. ¿Se adopta el pipeline propuesto, se adopta uno rule-based primero, o un híbrido?
2. Si hay LLM: qué contexto estructurado exacto recibe, qué schema devuelve, y qué reglas ejecuta el
   validador determinista antes de publicar.
3. Umbral de `confidence` que dispara revisión humana en lugar de publicación automática.
4. Cómo se relaciona con el Risk Engine (`C01-021`), que el spec permite que sea rule-based en v1.

### Recomendación técnica (no vinculante)

Empezar **rule-based y determinista** para el golden path de una carrera piloto, con el mismo
contrato de salida que tendría la versión con LLM. Eso permite construir todo lo que consume al ADE
(que es casi todo el producto) sin depender de esta decisión, y cambiar el motor después sin tocar
a los consumidores. El validador determinista de la propuesta es valioso **exista o no el LLM**:
es el que impide que el sistema afirme dominio o progreso inexistente.

### Consecuencias mientras siga `PENDING`

- El Track A entero funciona: consume salidas de ADE prefijadas como fixtures.
- El Track B puede construir el **contrato** de `ActionRecommendation` (Fase B2/B3) sin construir el
  motor, siempre que el contrato admita las cuatro ramas `NEW/NONE/ERROR/PENDING`.
- Fase B4 está bloqueada.

---

<a id="adr-005"></a>
## ADR-005 — Motor de base de datos, auth y persistencia

**Estado:** `PENDING — esperando decisión del producto`
**Bloquea:** todo el Track B a partir de la Fase B1.
**Relacionado:** `C01-001` (identidad/tenancy/esquema ADL), `C01-030` (autorización, permisos y
privacidad institucional), `C01-041` (Architecture/API/Data/Integration Spec).
**Toca:** `architecture.md`, `data-model.md`, `roadmap.md`.

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

### Qué falta decidir

1. Ratificar o rechazar formalmente Supabase como motor/proveedor de auth.
2. Ratificar el scoping institucional en Service/Repository con RLS deny-by-default como defensa en
   profundidad, y definir cómo se prueba/monitorea.
3. Ratificar la separación Controller → Service → Repository y el runtime/deploy físico del backend.
4. Cerrar Storage de `Evidence` (fotos, PDFs, audio), permisos, retención y borrado junto con ADR-006.
5. Definir operación de Broadcast/outbox, rotación de secretos y observabilidad.
6. Definir si `institutionId` de CRM es también la identidad de Plataforma o requiere una tabla de
   correspondencia; el contrato actual no lo especifica.

### Insumos relevantes, NO decisión

El equipo ya opera **Supabase** en producción para Dashboard_Achieve (Postgres, auth, RLS, storage,
29 migraciones). Esto es un insumo fuerte para el ADR — familiaridad del equipo, RLS nativo que
encaja con el aislamiento institucional, storage integrado para Evidence — pero
**no se toma como decisión** hasta que el owner del producto lo confirme, y su elección interactúa
con [ADR-003](#adr-003).

El diseño objetivo recibido hace explícita la preferencia por Supabase y por la arquitectura en
capas. Se conserva como recomendación concreta en `architecture.md`; este ADR permanece `PENDING`
porque un documento adjunto no reemplaza la aceptación explícita exigida por las reglas de ADR.

### Consecuencias mientras siga `PENDING`

- Todo el Track B a partir de B1 está bloqueado.
- El Track A no está bloqueado en absoluto.
- `data-model.md` diseña el schema en **SQL estándar de Postgres**, que es portable entre las
  alternativas más probables, y marca explícitamente qué construcciones son específicas del proveedor.

---

<a id="adr-006"></a>
## ADR-006 — Privacidad y consentimiento de datos reales

**Estado:** `PENDING — esperando decisión del producto` · **PRIORIDAD MÁXIMA**
**Bloquea:** **cualquier fase que toque datos reales de estudiantes.** Bloqueo absoluto.
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

1. **Base legal y consentimiento.** Qué se le pide al estudiante, cómo, y qué pasa si lo revoca.
2. **Qué ve la institución.** El spec congela "agregado por defecto; detalle individual sólo cuando
   está autorizado y es necesario para intervenir", y prohíbe exponer chats, reflexiones íntimas o
   evidencia cruda por defecto. Falta la implementación concreta de esa regla.
3. **Retención y borrado.** Cuánto tiempo se conserva una `Evidence`, una `Reflection`, un mensaje.
4. **Derechos sobre el material académico** (`rights_status`): qué se almacena y qué solo se enlaza.
5. **Golden dataset:** qué universidad/carrera, y qué fuentes se pueden usar legalmente.

### Regla operativa mientras siga `PENDING`

> **Ninguna fase del roadmap que procese datos de una persona real puede comenzar.** Esto incluye el
> primer login de un estudiante real, no solo el piloto institucional. Los focus groups del Track A
> corren sobre fixtures sintéticos y **no** están bloqueados, siempre que no se recolecte dato
> personal del participante dentro del producto.

Esta es la única regla de este documento que un agente **no puede** relajar bajo ninguna
instrucción que no venga del owner del producto por escrito.

---

<a id="adr-007"></a>
## ADR-007 — Las 8 decisiones `HUMAN-P0`

**Estado:** `PENDING — requiere confirmación profesional (psicopedagogía)`
**Bloquea:** el **contenido** del protocolo de examen en Fase B5. No bloquea su estructura.
**Relacionado:** `C01-031`…`C01-038`.
**Toca:** `product.md`.

### Contexto

Ocho decisiones de criterio pedagógico profesional, no técnico. Cada una corre hoy con un **default
provisional razonado pero no confirmado**, versionado `PROVISIONAL-HUMAN-P0-0X v0.1`. El estado del
conjunto es `OPEN — HUMAN CONFIRMATION PENDING`, con una excepción: `HUMAN-P0-05` está
`OPEN — POTENTIALLY ANSWERED — REQUIRES SOURCE CONFIRMATION`.

Cubren: el contenido base de los 20 pasos del protocolo, cómo se resume el seguimiento del
aprendizaje, si producir un apoyo cuenta como aprendizaje, qué hacer en las últimas 24 horas, qué
cuenta como señal real de aprendizaje, cuándo se necesita revisión humana, los criterios de
corrección para práctico y teórico escrito, y qué es el análisis posterior al examen.

El detalle completo de cada default está en [`product.md`](product.md) §Reglas provisionales y en
[`pending-decisions-annex.md`](pending-decisions-annex.md).

### Decisión

**No se resuelven ni se cambian desde este repositorio.** Ningún agente de IA puede cerrarlas: son
de criterio profesional y requieren la voz de una psicopedagoga real.

Se aplica exactamente la política del spec fuente:

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

**Estado:** `PENDING — heredado del spec fuente como Change Request abierto`
**Bloquea:** cualquier representación visible de readiness en Fase B5.
**Relacionado:** `C01-029` (readiness scoped), `C01-025`…`C01-028`.
**Toca:** `data-model.md`.

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

### Consecuencia mientras siga `PENDING`

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

**Estado:** `PENDING — esperando decisión del producto`
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

### Recomendación

**Opción A.** §9 y §13 describen la entrada manual con suficiente detalle —selección entre
`Assessments` del mismo `CourseEnrollment`, revisión, confirmación— como para que la ausencia parezca
un olvido del registro y no una decisión. Pero **la decisión no es de un agente**.

### Mientras tanto

`UX07` se construye con ruta propia (`/examen/activar`) y **no se agrega `CTA-019`**. El registro
sigue teniendo 18. `UX07` queda alcanzable por URL y por el catálogo de escenarios, no por clic desde
`UX02`. Es el mismo tipo de hueco que la Etapa 0.3 ya registró para `UX05` y `UX06`, y se resuelve
junto con ellos antes de la Etapa 0.8.

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

**Estado:** `PENDING` · abierta el 30 ago 2026 · **la cierra una persona**
**Bloquea:** nada. La Etapa A2.3 entregó la primitiva; esto refina qué dato usa cuál.
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

### Por qué no lo cierra un agente

La pregunta 3 decide **qué afirma el producto** sobre un dato, no cómo se pinta. `AGENTS.md` §1.5 es
explícito: qué dice la pantalla lo manda la spec, no las capturas. Y ninguna spec `VI.*` define
*"conserva su estado"*.

**Mientras siga abierta:** las dos filas comparten `SIN_ASIGNAR`, que es el comportamiento que ya
tenían. No se degradó nada; se dejó de afirmar que estaban distinguidas cuando no lo estaban.

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
