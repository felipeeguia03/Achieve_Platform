# Matriz de fuentes, autoridad, canonicidad y consumo

> **Estado:** documento de análisis · 8 de septiembre de 2026
> **Autorizado por el Product Owner** el 8 de septiembre de 2026, con alcance estricto.
>
> ⛔ **Este documento no autoriza construir nada.** [ADR-076](decisions.md#adr-076) §6 sigue
> vigente: *"No implementar, migrar, hacer push, merge ni deploy hasta nueva autorización."* Lo
> autorizado es **únicamente la matriz**. No se agregaron columnas, no se creó ninguna tabla, no se
> escribió ningún módulo, ruta, pantalla, autenticación ni integración.
>
> ⚠️ **Corrección de alcance registrada.** El planteo previo del equipo afirmaba que *"del 1 al 4 se
> pueden hacer sin pedir autorización nueva"* —matriz, dos migraciones, una tabla de conflicto y un
> módulo de política—. **Es incorrecto**: agregar columnas, crear tablas o escribir el módulo implica
> migrar o construir, y eso está bloqueado. Sólo el punto 1 estaba permitido, y es lo que hay acá.

---

## 0 · La conclusión principal

> **El problema más urgente de los datos académicos no es todavía cómo corroborarlos, sino que las
> unidades de `topic` —consumidas por casi todos los engines— no conservan origen, versión ni
> historia, y una nueva ingesta reemplaza la anterior mediante `DELETE`.**

Corroborar presupone saber **qué** se está corroborando y **quién lo afirmó**. Sobre `topic` no hay
ninguna de las dos cosas: ni `source_type`, ni `verification_status`, ni rastro de la versión
anterior. Es el dato que leen el ADE, el Gantt, la cobertura, el reparto y la ventana —§4.9— y el
único de toda la capa académica sin ninguna trazabilidad.

⚠️ **Y esto reordena la prioridad respecto del diagnóstico previo**, que ponía la identidad de actor
primero. La identidad sigue siendo la raíz de la **cadena de confianza**, pero está **diferida con
motivo hasta [ADR-006](decisions.md#adr-006)** ([ADR-057](decisions.md#adr-057)): no la destraba el
equipo. La trazabilidad de `topic` **no depende de eso** y se puede decidir hoy.

---

## 1 · Por qué existe este documento

Para cada dato académico hay **cinco preguntas distintas**, y el producto hoy contesta bien dos:

| # | Pregunta | ¿La contesta el modelo? |
|---|---|---|
| 1 | ¿Quién lo afirmó? | ✅ `source_type` |
| 2 | ¿Quién está **autorizado** a afirmarlo? | ⛔ **No está modelado** |
| 3 | ¿Qué tan verificado está? | 🟡 `verification_status`, **en 5 de 61 tablas** |
| 4 | ¿Puede mostrarse o usarse? | 🟡 `publication_status`, **en 1 tabla** |
| 5 | ¿Qué pasa si otra fuente lo contradice? | ⛔ **No está modelado** |

**Sin esa cadena, los engines pueden ser correctos y trabajar igual sobre información incierta,
vacía o atribuida a una autoridad que no existe.** La matriz es el contrato que evita que cada
pantalla y cada engine inventen su propia regla.

### Los cuatro conceptos que hay que conservar separados

| Concepto | Pregunta | Dónde vive hoy |
|---|---|---|
| **Procedencia** | ¿Quién proporcionó el dato? | `source_type` + `source_ref` + `observed_at` |
| **Autoridad** | ¿Esa persona u organización **puede** afirmarlo? | ⛔ **En ningún lado** |
| **Verificación** | ¿Qué respaldo tiene la afirmación? | `verification_status` |
| **Canonicidad** | Si hay versiones distintas, ¿cuál **gobierna**? | ⛔ **En ningún lado** |

⚠️ **Procedencia ≠ autoridad, y hoy se confunden por omisión.** El estudiante puede ser la fuente
canónica de *"curso esta comisión"* —es verdad operativa sobre su propia cursada— y **no** tener
autoridad para volver `official` el programa de esa comisión. El schema no puede expresar esa
diferencia: sólo sabe que el `source_type` fue `student`.

### Y un tercer eje que ya está bien separado, y conviene no perderlo

`publication_status` **no es** `verification_status`. *"¿Se le puede mostrar a un estudiante?"* y
*"¿alguien con autoridad lo verificó?"* son preguntas distintas, y el proyecto las separó a
conciencia en la Fase B6.14.2. Existe en **una sola tabla**: `curriculum_plan`.

---

## 2 · Cómo leer la matriz

Cada familia de datos documenta los **16 puntos** que pidió el owner. Para no repetir dieciséis
encabezados veinte veces, se agrupan en tres bloques por familia:

- **Qué es y dónde vive** — puntos 1, 2, 16
- **Procedencia, autoridad y verificación** — puntos 3 a 8, 13
- **Publicación, consumo y contradicción** — puntos 9 a 12, 14, 15

Y todo lo afirmado se separa en **tres niveles**, que nunca se mezclan:

| Nivel | Qué significa |
|---|---|
| 🟢 **Estado actual comprobado** | Verificado contra el repositorio o contra Postgres. Se cita la evidencia |
| 🟡 **Regla transitoria** | Lo que debe regir **hoy** para no apagar el MVP. No está implementada como política; describe el comportamiento vigente y lo vuelve explícito |
| 🔵 **Modelo objetivo** | Propuesta. **No autorizada.** Nunca se presenta como estado actual |

⚠️ **Lo que no se pudo comprobar se marca `HIPÓTESIS`** y no se presenta como estado.

---

## 3 · La evidencia base: qué columnas de procedencia existen realmente

Medido contra Postgres el 8 de septiembre de 2026 (`information_schema.columns`, 61 tablas en
`public`). Sólo se listan las tablas que tienen **alguna** columna de procedencia:

| Tabla | `source_type` | `verification_status` | `source_ref` | `observed_at` | `confidence` |
|---|:---:|:---:|:---:|:---:|:---:|
| `assessment` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `class_session` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `assessment_criterion` | ✅ | ✅ | ✅ | ✅ | — |
| `learning_objective` | ✅ | ✅ | ✅ | ✅ | — |
| `class_event_record` | ✅ | ✅ | — | ✅ | — |
| `curriculum_requirement` | ✅ | — | ✅ | ✅ | ✅ |
| `curriculum_plan` | ✅ | — | ✅ | ✅ | — |
| `elective_option` | ✅ | — | ✅ | ✅ | — |
| `requirement_declaration` | ✅ | — | ✅ | ✅ | — |
| **`resource`** | ✅ | ⛔ | ✅ | ✅ | — |
| `provenance_corroboration` | ✅ | — | ✅ | — | — |
| `risk_signal` | — | — | ✅ | — | — |
| `error_observation` · `support_need_observation` · `early_review_observation` | — | — | — | ✅ | — |
| `reflection` | — | — | — | — | ✅ |
| **`topic`** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |

> 🟢 **`verification_status` existe en 5 tablas: `assessment`, `class_session`,
> `assessment_criterion`, `learning_objective`, `class_event_record`.** En ninguna otra.

> 🟢 **`topic` no tiene ninguna columna de procedencia.** Ni `source_type`. Es más grave que lo que
> el diagnóstico previo decía —*"le falta `verification_status`"*—: **de una unidad no se sabe
> siquiera quién la afirmó**.

> 🟢 **`resource` tiene procedencia y no tiene verificación.** Se sabe de dónde salió un material y
> no hay dónde registrar que alguien lo revisó.

### Identidad de actor: veinte columnas, cero integridad referencial

| Columnas `*_by` / `actor_id` / `reviewer_id` | 20 |
|---|---|
| Con `FOREIGN KEY` | **0** |

> 🟢 **Ninguna columna de actor tiene FK.** Verificado sobre `pg_constraint`: la consulta que busca
> constraints de tipo `f` sobre columnas `%_by`, `actor_id` y `reviewer_id` **no devuelve filas**.
> `evidence.reviewer_id`, `provenance_corroboration.corroborated_by`, `product_event.actor_id` y
> `error_observation.recorded_by` son `uuid` libres.
>
> Es **deliberado** —los actores no estudiantes son identidades externas sin tabla, `C01-030`— y a la
> vez es la razón por la que **hoy no se puede demostrar separación de funciones**.

### Los escritores reales: qué función escribe qué

Extraído de `pg_get_functiondef` sobre las 30 funciones que hacen `INSERT`/`UPDATE`. Las que importan
para esta matriz:

| Función | Escribe |
|---|---|
| `ingerir_plan_de_estudios` | `institution`, `academic_program`, `academic_unit`, `curriculum_plan`, `curriculum_requirement`, `course`, `elective_option` |
| `publicar_plan_de_estudios` | `curriculum_plan`, `audit_log` |
| `confirmar_mapa_academico` | `enrollment`, `course_offering`, `course_enrollment`, `requirement_declaration` |
| `ingerir_materia` | `course`, `course_offering`, `topic`, `topic_prerequisite`, `assessment`, `class_session`, `class_session_topic`, `academic_program`, `curriculum_plan` |
| `declarar_evaluacion` | `assessment` |
| `corroborar_procedencia` | `provenance_corroboration` |
| `materializar_recomendacion` | `action`, `action_recommendation`, `action_resource` |
| `registrar_progreso` | `progress_entry`, `topic_progress` |
| `registrar_observacion_de_error` · `registrar_observacion_b6_7_3` | `error_observation` |
| `registrar_senal` · `registrar_senal_b6_7_3` · `resolver_senal` | `risk_signal` |

> 🟢 **`resource` no aparece en ninguna función.** No tiene escritor en el producto: lo insertan
> `scripts/db-demo.sh` y `scripts/sembrar-materia.mjs` con el cliente de servicio.

---

# 4 · La matriz, familia por familia

## 4.1 · Identidad y padrón

**Qué es.** Quién es la persona y si está habilitada a entrar.
**Dónde vive.** `student` (`auth_user_id`, `institution_id`), `institution_crm_ref`, `auth.users`.

| | |
|---|---|
| **Fuentes admitidas** | CRM. **Ninguna alternativa** |
| **Procedencia hoy** | ⛔ Sin `source_type`. La habilitación **no es una afirmación con procedencia**: es un hecho de sistema |
| **Autoridad** | El CRM, y sólo él. `student.auth_user_id NULL` es el estado *"identidad válida, sin padrón"* |
| **Canónica** | El CRM. La Plataforma conserva la atadura, no la decide |
| **Verificación** | No aplica: no hay `verification_status` ni haría falta |
| **Quién corrobora** | Nadie. Se resuelve por integración |
| **Publicación** | No se muestra |
| **Consumo por engines** | Ninguno la lee. Es previa a todo |
| **Default operativo transitorio** | `403 SIN_PADRON` — 🟢 implementado, y es el correcto: no autenticar sino **no habilitar** |
| **Contradicción** | No aplica |
| **Auditoría** | 🟢 `product_event` registra el ingreso |
| **Estado real** | 🟢 **Implementado** |
| **Depende de** | [ADR-039](decisions.md#adr-039) (no hay registro: el padrón decide) |
| **Evidencia** | `lib/server/servicios/sesion.ts:44` · `app/login/page.tsx:28` |

⚠️ **No se puede crear una cuenta desde el producto, y es por diseño.** Hoy el alta de identidad
ocurre fuera: `scripts/sesion-demo.mjs`.

---

## 4.2 · Carrera y plan de estudios

**Qué es.** Qué carreras existen, con qué plan y qué materias lo componen.
**Dónde vive.** `academic_program`, `academic_unit`, `curriculum_plan`, `curriculum_requirement`,
`elective_option`.

| | |
|---|---|
| **Fuentes admitidas** | Institución. **Alternativa MVP**: catálogo curado desde CSV |
| **Procedencia hoy** | 🟢 `source_type` + `source_ref` + `observed_at` en las cuatro tablas |
| **Autoridad** | ⛔ **No modelada.** Quien corre `db:catalogo` puede declarar cualquier `source_type`, incluido `institution` |
| **Canónica** | El plan **publicado** de la institución del estudiante. 🟢 Resuelto vía `publication_status` |
| **Verificación** | ⛔ **Sin `verification_status`.** Un plan curado desde CSV y uno provisto por la universidad son indistinguibles |
| **Quién corrobora** | Nadie. `corroborar_procedencia()` no cubre estas tablas |
| **Publicación** | 🟢 `curriculum_plan.publication_status`. `DRAFT` no se le ofrece a nadie, con test |
| **Consumo** | El **alta** lo lee (sólo publicados). Ningún engine |
| **Default operativo transitorio** | 🟡 `DRAFT` por defecto; publicar es un acto explícito y auditado |
| **Contradicción** | ⛔ Dos planes de la misma carrera conviven por `version`; **nada declara cuál gobierna** salvo el `publication_status` |
| **Auditoría** | 🟢 `publicar_plan_de_estudios` escribe `audit_log` |
| **Estado real** | 🟡 **Parcialmente representable.** Publicación sí, verificación no, autoridad no |
| **Depende de** | [ADR-051](decisions.md#adr-051), [ADR-053](decisions.md#adr-053), `C01-052` |
| **Evidencia** | `scripts/importar-catalogo.mjs` · `docs/data-model.md:351` |

⚠️ **Los planes de la UCC están cargados y en `DRAFT`.** No se le ofrecen a nadie. Publicarlos es
`C01-052` y necesita el plan oficial.

---

## 4.3 · Período académico

**Qué es.** Semestre, anualidad, año lectivo.
**Dónde vive.** `curriculum_requirement.term` / `is_annual`, `enrollment.term` +
`curriculum_year`, `course_offering.term`.

| | |
|---|---|
| **Fuentes admitidas** | Institución. **Alternativa**: configuración curada |
| **Procedencia hoy** | Hereda la de `curriculum_requirement` (🟢 tiene `source_type`) |
| **Autoridad** | ⛔ No modelada |
| **Canónica** | El plan publicado |
| **Verificación** | ⛔ Sin `verification_status` |
| **Publicación** | Sigue al plan |
| **Consumo** | El alta y `insumos_de_reparto()` (a través de la cursada) |
| **Default operativo transitorio** | 🟢 `NULL` — las 213 filas del catálogo lo tienen así, y **es correcto**: falta el dato, no la columna |
| **Contradicción** | ⛔ No modelada |
| **Auditoría** | La del plan |
| **Estado real** | 🟢 **Vocabulario cerrado e implementado**, con chequeos de base |
| **Depende de** | [ADR-061](decisions.md#adr-061) |
| **Evidencia** | `scripts/db-aislamiento.sh` · *"ADR-061 · el período académico es vocabulario cerrado"* |

---

## 4.4 · Inscripción y cursada

**Qué es.** Que esta persona cursa esta materia este período.
**Dónde vive.** `enrollment` (carrera), `course_enrollment` (materia),
`requirement_declaration` (qué requisito del plan cubre).

| | |
|---|---|
| **Fuentes admitidas** | Institución/CRM. **Alternativa MVP**: 🟢 declaración del estudiante, que es lo implementado |
| **Procedencia hoy** | `requirement_declaration` 🟢 tiene `source_type`; `enrollment` y `course_enrollment` ⛔ no |
| **Autoridad** | 🟡 **El estudiante ES autoridad suficiente acá**, y es correcto: es verdad operativa sobre su propia cursada, no sobre el plan |
| **Canónica** | 🟢 La declaración del estudiante, hasta que exista integración |
| **Verificación** | ⛔ Sin `verification_status` |
| **Quién corrobora** | Nadie |
| **Publicación** | Sólo a su dueño. 🟢 Verificado por chequeos de aislamiento |
| **Consumo** | **Todo**: el ADE, el reparto, el Gantt, `HOY` |
| **Default operativo transitorio** | 🟢 Lo declarado vale. Sin esto no hay producto |
| **Contradicción** | ⛔ No modelada. Si el CRM dijera otra cosa, no hay dónde ponerlo |
| **Auditoría** | 🟢 `product_event` |
| **Estado real** | 🟢 **Implementado** |
| **Depende de** | [ADR-052](decisions.md#adr-052) |
| **Evidencia** | `confirmar_mapa_academico` |

---

## 4.5 · Materia

**Qué es.** La materia como entidad del plan.
**Dónde vive.** `course` (`curriculum_plan_id`, `code`, `name`).

| | |
|---|---|
| **Procedencia hoy** | ⛔ **`course` no tiene ninguna columna de procedencia.** Hereda la del plan por pertenencia, no por dato |
| **Autoridad** | ⛔ No modelada |
| **Canónica** | 🟢 El `course` del plan publicado. `UNIQUE (curriculum_plan_id, code)` lo sostiene |
| **Verificación** | ⛔ No existe |
| **Estado real** | 🟡 **Parcialmente representable** |
| **Evidencia** | `ingerir_plan_de_estudios` · `ingerir_materia` |

⚠️ **Hallazgo operativo, descubierto el 8 de septiembre.** `ingerir_materia` sin
`p_curriculum_plan_id` resuelve el `course` dentro del contenedor *«Sin programa declarado»* —otra
fila con el mismo código— y **crea una segunda cursada**, dejando la del estudiante vacía. Es
exactamente el problema de canonicidad sin modelar: **dos filas afirman la misma materia y nada dice
cuál gobierna.**

---

## 4.6 · Comisión y cátedra

**Qué es.** Qué comisión cursa y quién la dicta.
**Dónde vive.** `course_offering.commission` + `instructor_id`, `instructor`.

| | |
|---|---|
| **Fuentes admitidas** | Institución. **Alternativa**: estudiante, incluido *"no sé"* |
| **Procedencia hoy** | ⛔ `course_offering` no tiene columnas de procedencia |
| **Autoridad** | ⛔ No modelada |
| **Canónica** | ⛔ No modelada |
| **Default operativo transitorio** | 🟢 `commission = NULL` — el alta la crea siempre así, y **`NULL` es el *"no sé"***. Con una comisión inventada, confirmar el alta crearía una segunda cursada de la misma materia |
| **Contradicción** | ⛔ No modelada |
| **Estado real** | 🟡 **La entidad existe y nadie la llena** |
| **Depende de** | [ADR-062](decisions.md#adr-062)…[ADR-065](decisions.md#adr-065), decididos y **no implementados** |
| **Evidencia** | `UNIQUE (course_id, term, commission)` |

⚠️ **`instructor` existe como tabla y el importador de libros de temas descarta el nombre del
docente a propósito.** Los 80 libros del corpus real traen nombre y legajo del docente en cada fila;
`class_session` **no tiene dónde ponerlo y no se le debe dar** ([ADR-006](decisions.md#adr-006)).

---

## 4.7 · Horarios de cursada

**Qué es.** Los bloques semanales en que se dicta la materia.

> 🟢 **No existe ninguna tabla de bloque horario.** Verificado sobre las 61 tablas de `public`.
> [ADR-062](decisions.md#adr-062) lo decidió —con **dos dueños posibles y excluyentes**: la offering
> (horario publicado) o la cursada (horario que el estudiante declara sin saber su comisión)— y
> **nunca se implementó**.

⚠️ **`class_session.session_time` NO es esto.** Es la hora de **una clase dictada**: un hecho
puntual con fecha. Derivar el horario semanal de las horas observadas sería **inferir la regla desde
sus instancias**, y es exactamente lo que la matriz existe para impedir.

⚠️ **Y no se mezcla con `availability`.** Una dice **cuándo cursa**; la otra, **cuándo puede
estudiar**. Son dos preguntas y dos tablas.

| **Estado real** | ⛔ **Imposible con el schema actual** |
|---|---|
| **Depende de** | [ADR-062](decisions.md#adr-062), decidido y no autorizado a construir |
| **Consecuencia visible** | La línea *"Cursás Lun 14:00-16:00"* del mockup **no se construyó** ([ADR-078](decisions.md#adr-078)) |

---

## 4.8 · Clases dictadas

**Qué es.** Que tal día se dictó tal cosa, cuánto duró y qué unidades cubrió.
**Dónde vive.** `class_session` (+ `class_session_topic`), `class_event_record`.

| | |
|---|---|
| **Fuentes admitidas** | Cátedra/institución (libro de temas). **Alternativa**: estudiante |
| **Procedencia hoy** | 🟢 **La más completa del schema**: `source_type`, `source_ref`, `observed_at`, `confidence`, `verification_status`, `uploaded_by` |
| **Autoridad** | ⛔ No modelada. `uploaded_by` es un `uuid` **sin FK** |
| **Canónica** | ⛔ No modelada |
| **Verificación inicial** | 🟢 `unverified`. Estados posibles: `unverified → corroborated → disputed` (`official` inalcanzable) |
| **Quién corrobora** | 🟢 `corroborar_procedencia()` la cubre. ⛔ **Ninguna ruta la alcanza** desde el producto |
| **Publicación** | Se muestra al dueño de la cursada |
| **Consumo** | 🟢 `duracion.ts` (minutos por tema), `ventana.ts` (primera clase), el Gantt, el reparto. **Ninguno mira `verification_status`** |
| **Default operativo transitorio** | 🟡 **`unverified` se consume igual.** Sin esto no hay Gantt ni reparto: es el 100% de las clases |
| **Contradicción** | ⛔ `disputed` marca **una fila**, no la relación con la que la contradice |
| **Auditoría** | 🟢 `corroborar_procedencia` escribe `audit_log` con antes y después |
| **Estado real** | 🟢 **Implementado**, sin política de consumo |
| **Depende de** | [ADR-068](decisions.md#adr-068), [ADR-069](decisions.md#adr-069) |
| **Evidencia** | `supabase/migrations/20260920000000_duracion_y_tipo_de_clase.sql` |

⚠️ **`session_kind` se propone, no se importa** ([ADR-069](decisions.md#adr-069)): la clasificación
automática midió **25% de falsos positivos**. Ausente queda `NULL`, y el dominio lo cuenta como
clase. Es un caso donde **la incertidumbre ya está modelada bien**.

---

## 4.9 · Unidades (`topic`)

**Qué es.** Las unidades del programa: el eje sobre el que el ADE decide y el Gantt dibuja.
**Dónde vive.** `topic` (+ `topic_prerequisite`).

> 🟢 **`topic` no tiene ninguna columna de procedencia.** Ni `source_type`, ni `source_ref`, ni
> `observed_at`, ni `verification_status`.

| | |
|---|---|
| **Fuentes admitidas** | Cátedra/institución. **Alternativa**: PDF subido por el estudiante o curador |
| **Procedencia hoy** | ⛔ **Ninguna.** Se hereda *implícitamente* de la corrida de `ingerir_materia` que la creó, y esa herencia **no está registrada en ningún campo** |
| **Autoridad** | ⛔ No modelada |
| **Canónica** | 🟡 De hecho: la última corrida de `ingerir_materia`, que **borra las unidades anteriores** (`DELETE FROM topic WHERE offering_id = …`) |
| **Verificación** | ⛔ No existe |
| **Consumo** | 🟢 **El ADE, el Gantt, la cobertura, el reparto y la ventana.** Es el dato más consumido del sistema |
| **Default operativo transitorio** | 🟡 Todo se consume. No hay alternativa: sin unidades no hay producto |
| **Contradicción** | ⛔ **Imposible de representar.** Dos programas distintos de la misma cursada no coexisten: el segundo borra al primero |
| **Auditoría** | ⛔ **Ninguna.** El `DELETE` no deja rastro |
| **Estado real** | ⛔ **Imposible con el schema actual** representar procedencia, verificación o conflicto de una unidad |
| **Depende de** | ninguna decisión abierta: **es una brecha de modelo, no de decisión** |
| **Evidencia** | `ingerir_materia`, líneas del `DELETE`; `contexto_del_ade` |

⚠️ **Ésta es la brecha más grande de la matriz**, y es la que el diagnóstico previo subestimó. El
dato sobre el que se apoya *toda* la capa académica es el único sin ninguna trazabilidad.

---

## 4.10 · Objetivos de aprendizaje

**Qué es.** La demanda concreta contra la que se compara un error, para saber si dos son comparables.
**Dónde vive.** `learning_objective`.

| | |
|---|---|
| **Procedencia hoy** | 🟢 `source_type`, `source_ref`, `observed_at`, `verification_status` |
| **Autoridad** | ⛔ No modelada |
| **Consumo** | 🟢 El Risk Engine: es el **denominador** de la comparabilidad ([ADR-037](decisions.md#adr-037)) |
| **Default operativo transitorio** | 🟢 **Nace vacía, y sin objetivo declarado NO se escala.** El circuito cuenta la repetición y **no llama a nadie** — eso es correcto, no un defecto |
| **Estado real** | 🟢 **Implementado** |
| **Depende de** | *"Cómo se define una tarea comparable"* — **de la psicopedagoga, abierto** |

---

## 4.11 · Evaluaciones y criterios

**Qué es.** Qué se rinde, cuándo, con qué modalidad y qué unidades cubre.
**Dónde vive.** `assessment` (+ `assessment_topic`), `assessment_criterion`.

| | |
|---|---|
| **Fuentes admitidas** | Cátedra/institución. **Alternativa**: 🟢 el estudiante, implementado |
| **Procedencia hoy** | 🟢 Completa en `assessment` y `assessment_criterion`. ⛔ `assessment_topic` (el alcance) **no tiene ninguna** |
| **Autoridad** | 🟢 **El único caso donde la autoridad SÍ está parcialmente modelada**: `assessment.declared_by` distingue *"lo trajo la ingesta"* (`NULL`) de *"lo declaró este estudiante"* |
| **Canónica** | 🟢 **Resuelto por visibilidad, no por canonicidad**: cada estudiante ve la institucional más la suya; la de otro estudiante **no le llega** |
| **Verificación inicial** | 🟢 `unverified` |
| **Quién corrobora** | 🟢 `corroborar_procedencia()`. ⛔ Ninguna ruta la alcanza |
| **Publicación** | 🟢 Predicado de visibilidad en **4 funciones de lectura** |
| **Consumo** | El ADE (`+1000` si la unidad entra), el reparto, la ventana, el Gantt. **Sin mirar `verification_status`** |
| **Default operativo transitorio** | 🟡 `unverified` se consume. Es el 100% |
| **Contradicción** | 🟡 **Se admiten duplicados a propósito** —no hay `UNIQUE`— pero **nada los relaciona**: dos evaluaciones que son la misma conviven sin saberlo |
| **Auditoría** | 🟢 La ingesta **preserva** lo declarado por el estudiante: `DELETE … AND declared_by IS NULL` |
| **Estado real** | 🟢 **Implementado**, con canonicidad resuelta por visibilidad |
| **Depende de** | [ADR-067](decisions.md#adr-067) |
| **Evidencia** | `supabase/migrations/20260919000000_alta_de_evaluacion.sql` · chequeo *"la que declaró el estudiante SOBREVIVE a la ingesta"* |

⚠️ **El alcance se declara, nunca se infiere del texto de `scope`.** Vacío significa *"nadie lo
declaró"*, y entonces cuenta la materia entera.

---

## 4.12 · Recursos y materiales

**Qué es.** Lo que el estudiante abre para hacer la acción.
**Dónde vive.** `resource`.

| | |
|---|---|
| **Fuentes admitidas** | Docente/cátedra. **Alternativa**: estudiante o fuente pública |
| **Procedencia hoy** | 🟢 `source_type`, `source_ref`, `observed_at`, `uploaded_by`, `rights_status` |
| **Autoridad** | ⛔ No modelada. `uploaded_by` sin FK |
| **Canónica** | ⛔ No modelada |
| **Verificación** | ⛔ **Sin `verification_status`.** No hay dónde registrar que alguien revisó un material |
| **Quién corrobora** | ⛔ **Nadie puede**: `corroborar_procedencia()` no tiene sobre qué campo actuar |
| **Publicación** | 🟢 `rights_status`: `unknown` / `allowed` / `restricted` — **es una tercera dimensión**, de derechos, no de verdad |
| **Consumo** | 🟢 **El ADE.** Y es condición de ejecutabilidad: sin recurso, `CONTEXTO_INCOMPLETO` |
| **Default operativo transitorio** | 🟡 **Todo recurso se consume.** El ADE no mira `source_type` ni `rights_status` |
| **Contradicción** | ⛔ No modelada |
| **Auditoría** | ⛔ Ninguna |
| **Estado real** | ⛔ **Imposible** aplicar una política de consumo: **no hay campo de verificación sobre el que decidir** |
| **Evidencia** | `contexto_del_ade`: `FROM resource r WHERE r.topic_id = t.id` — **sin ninguna cláusula de filtro** |

⚠️ **`resource` no tiene escritor en el producto.** Ninguna de las 30 funciones lo escribe; lo
insertan `db-demo.sh` y `sembrar-materia.mjs` con el cliente de servicio.

⚠️ **Y `rights_status` no se consulta en ninguna parte.** Un material `restricted` se le ofrece al
estudiante igual que uno `allowed`. 🟢 Verificado: la única lectura de `resource` en
`contexto_del_ade` no lo menciona.

---

## 4.13 · Compromisos

**Qué es.** Cuándo y bajo qué acuerdo el estudiante va a hacer la acción.
**Dónde vive.** `commitment`.

| | |
|---|---|
| **Fuentes admitidas** | El estudiante. **Ninguna alternativa** |
| **Procedencia** | ⛔ Sin columnas, y **no hacen falta**: es un hecho de primera parte creado por una operación autenticada |
| **Autoridad** | 🟢 El estudiante, sobre su propia acción. Se verifica por sesión |
| **Canónica** | 🟢 Única. `crear_rescate` crea **otro** objeto que apunta al incumplido |
| **Verificación** | No aplica |
| **Consumo** | `HOY` (precedencia), el reloj |
| **Default operativo transitorio** | No aplica |
| **Contradicción** | 🟢 **Resuelta por diseño, y es el mejor ejemplo del repositorio**: un `MISSED` **nunca se edita** para parecer cumplido. El rescate lo apunta sin borrarlo |
| **Auditoría** | 🟢 `product_event` |
| **Estado real** | 🟢 **Implementado** |
| **Depende de** | [ADR-064](decisions.md#adr-064) (el ADE decide *qué*; el `Commitment`, *cuándo*) |

⚠️ **El reloj no corre solo.** Sin scheduler, ningún compromiso vence, y **el camino del rescate no
se alcanza** salvo corriendo `npm run reloj` o el botón del dock de prueba.

---

## 4.14 · Evidencias

**Qué es.** La producción que el estudiante entrega.
**Dónde vive.** `evidence`, `evidence_content`.

| | |
|---|---|
| **Fuentes admitidas** | El estudiante. **Ninguna alternativa** |
| **Procedencia** | ⛔ Sin columnas de procedencia; sí `uploaded_by` |
| **Autoridad** | 🟢 El estudiante, sobre su compromiso |
| **Verificación** | 🟢 **Tiene su propio lifecycle, que NO es `verification_status`**: `EXPECTED → SUBMITTED → UNDER_REVIEW → SUFFICIENT / INSUFFICIENT / RESUBMISSION_REQUESTED → VALIDATED` |
| **Consumo** | 🟢 `cobertura.ts`. ⚠️ **`INSUFFICIENT` cuenta** como cobertura: la barra mide **que trabajaste**, no que esté bien |
| **Default operativo transitorio** | 🟢 `SUBMITTED` no implica suficiencia. Es un invariante con test |
| **Contradicción** | No aplica |
| **Auditoría** | 🟢 `product_event` + máquina de estados |
| **Estado real** | 🟢 **Implementado** |
| **Evidencia** | `lib/domain/cobertura.ts` · `ESTADOS_QUE_CUENTAN` |

---

## 4.15 · Reflexiones

**Qué es.** Cuánto tardó de verdad y cómo le resultó.
**Dónde vive.** `reflection` (`actual_minutes`, `difficulty`, `note`, `confidence`).

| | |
|---|---|
| **Fuentes admitidas** | El estudiante. **Ninguna alternativa**: es autorreporte y no necesita autoridad institucional |
| **Procedencia** | ⛔ Sin columnas; 🟢 tiene `confidence` |
| **Consumo** | 🟢 El Personal Engine lee **`actual_minutes`** contra la estimación de la `Action` |
| **Default operativo transitorio** | 🟢 Mínimo **5 observaciones** en **≥3 días distintos**; techo **2×**; **nunca baja de 1,0** |
| **Estado real** | 🟢 **Implementado** |
| **Depende de** | [ADR-074](decisions.md#adr-074), [ADR-075](decisions.md#adr-075) |

> 🟢 **`reflection.difficulty` se escribe y nadie la lee.** Vocabulario:
> `mas_facil | esperado | mas_dificil`. Aparece en `lib/server/servicios/reflexion.ts:42` y
> `lib/server/repositorios/reflexion.ts:78`, **las dos escribiendo**. Ningún módulo de `lib/domain/`
> la consume. **Es un dato capturado sin consumidor.**

ℹ️ **Qué hacer con esto está en discusión, sin decidir.** [ADR-080](decisions.md#adr-080) registra un
candidato —clasificar la **complejidad del contenido** con IA, offline y como `inference`— y deja
explícito que **eso no es lo mismo** que la dificultad que el estudiante declara acá. Son dos datos
distintos y ninguno de los dos se usa hoy.

⚠️ **El multiplicador sale de `reflection`, no de los `Commitment` cumplidos**, y es una decisión
explícita: lo segundo mediría **conducta**, y una mala semana le reduciría el presupuesto al
estudiante — el reparto le daría menos **porque hizo menos**.

⚠️ **No hay ninguna clasificación de dificultad de materias ni de estudiantes.** El ADE no la mira:
su función `costoDeNoActuar` tiene tres términos —entra en la evaluación (`+1000`), nunca practicada
(`+300`), días sin tocar (tope `60`)— y un desempate por orden del programa. La regla de
[ADR-037](decisions.md#adr-037) va en la dirección contraria: separar *"repetición detectada"* de
*"dificultad confirmada"*, porque **el sistema reconoce patrones, no etiqueta personas**.

---

## 4.16 · Validaciones

**Qué es.** El juicio de que una entrega alcanza, y quién lo emitió.
**Dónde vive.** ⚠️ **No hay tabla propia.** Es `evidence.reviewer_id` + `evidence.lifecycle_state`
+ el `progress_entry` que la operación escribe.

| | |
|---|---|
| **Fuentes admitidas** | Un actor autorizado **distinto del autor**. **Ninguna alternativa** |
| **Procedencia** | ⛔ Sin columnas |
| **Autoridad** | ⛔ **El agujero estructural de todo el modelo** |
| **Canónica** | Única por evidencia |
| **Quién valida hoy** | 🟢 Quien presente el **secreto de servicio**. `reviewer_id` queda `NULL`; el actor del evento es `null` —*"lo produjo un proceso"*— |
| **Consumo** | 🟢 `registrar_progreso` escribe progreso y **cierra la `Action`** |
| **Default operativo transitorio** | 🟡 **El interinato que [ADR-057](decisions.md#adr-057) declaró vigente**: el secreto de servicio. La operación es confiable **porque el secreto no circula**, no porque el modelo lo garantice. **No es un descuido — es una solución transitoria que un ADR aceptó**, y lo que no se puede demostrar mientras dure es la separación de funciones |
| **Contradicción** | No aplica |
| **Auditoría** | 🟢 `product_event`, con `actor_id = null` |
| **Estado real** | ⛔ **Imposible demostrar separación de funciones** |
| **Depende de** | `C01-030`, ⏸️ **`DEFERRED` con motivo hasta [ADR-006](decisions.md#adr-006)** ([ADR-057](decisions.md#adr-057)) · [ADR-076](decisions.md#adr-076) |
| **Evidencia** | `esSecretoDeServicio()` compara contra **una sola variable de entorno** |

> 🟢 **Una credencial de servicio compartida no permite demostrar separación entre curador, coach y
> validador.** Los tres presentarían la misma credencial. Con eso, la regla que
> [ADR-076](decisions.md#adr-076) conserva —*"nadie valida su propia evidencia o propuesta"*— **no
> se puede sostener hoy**, aunque se construyera todo lo demás.

⚠️ **`VALIDATED` no produce progreso.** Lo escribe **la operación**, y la `Action` se cierra porque
esa operación la cierra. Hay guard estático sobre los cuatro caminos.

⚠️ **La ruta de validación no vuelve a disparar el ADE.** 🟢 Verificado: el ADE se dispara en
**dos** lugares —`confirmar_mapa_academico` (el alta, una vez por cursada) y `scripts/validar.mjs`—.
`app/api/validacion/route.ts` **no lo invoca**. Un estudiante cuyo ADE no encontró nada en el alta se
queda sin acción hasta que alguien corra el script.

---

## 4.17 · Progreso

**Qué es.** Que algo cambió en alguna de las cinco dimensiones.
**Dónde vive.** `progress_entry`, `topic_progress`.

| | |
|---|---|
| **Fuentes admitidas** | La operación de validación |
| **Autoridad** | La misma que valida ⇒ 🟡 hereda el agujero de §4.16 |
| **Consumo** | 🟢 El ADE (`practicaEstado`, `recenciaEn`), `UX02`, `UX06` |
| **Default operativo transitorio** | 🟢 **`no_information` y `not_evaluated` NO son cero**, y el ADE los trata como **más caros** que un valor bajo conocido: desconocido cerca de un examen cuesta más |
| **Estado real** | 🟢 **Implementado** |
| **Depende de** | `C01-018` (quién emite el progreso y con qué causalidad), `OPEN` · `C01-019` (mostrar las cinco dimensiones), gate `H` |

---

## 4.18 · Observaciones para el Risk Engine

**Qué es.** Que se registró un error de tal familia, sobre tal objetivo, con tal calidad de evidencia.
**Dónde vive.** `error_observation`, `support_need_observation`, `early_review_observation`,
`error_type`, `error_classification_correction`.

| | |
|---|---|
| **Fuentes admitidas** | Observación identificada. **Alternativa MVP**: registro humano provisional |
| **Procedencia** | ⛔ Sin `source_type`; 🟢 con `observed_at` y `recorded_by` |
| **Autoridad** | ⛔ `recorded_by` es `uuid` **sin FK**; la ruta va con secreto de servicio |
| **Canónica** | 🟢 **Append-only con corrección explícita**: `error_classification_correction` no borra la observación |
| **Consumo** | 🟢 El Risk Engine, contando **por familia** (`canonical_id`), nunca por fila de versión |
| **Default operativo transitorio** | 🟢 **Sin objetivo declarado no se escala.** Cuenta la repetición y no llama a nadie |
| **Contradicción** | 🟢 **Bien resuelta**: la corrección es un hecho nuevo, no una sobrescritura |
| **Auditoría** | 🟢 Append-only |
| **Estado real** | 🟢 **Implementado y sin alimentar** |
| **Depende de** | [ADR-036](decisions.md#adr-036), [ADR-037](decisions.md#adr-037) · `C01-021` para `HP0-06-2` y `HP0-06-3` |

> 🟢 **`POST /api/observacion` no tiene productor dentro del flujo.** Verificado: la única aparición
> fuera de la propia ruta es un `curl` que **imprime** `scripts/db-demo.sh:291` para que alguien lo
> copie. Ninguna pantalla, ningún servicio y ningún engine la llama.
>
> **El Risk Engine funciona y no tiene fuente.**

⚠️ **De sus tres reglas, sólo `HP0-06-1 v4.0-psicopedagogia` está implementada.** `HP0-06-2` y
`HP0-06-3` siguen en modo humano.

---

## 4.19 · Intervenciones humanas

**Qué es.** Que una persona tomó una señal y qué resultado tuvo.
**Dónde vive.** `risk_signal`, `intervention`, `intervention_outcome`, `escalation_sink`.

| | |
|---|---|
| **Fuentes admitidas** | La Plataforma. **Alternativa**: confirmación del CRM |
| **Autoridad** | ⛔ No modelada. Va con secreto de servicio |
| **Canónica** | 🟢 **La Plataforma conserva el hecho canónico**, que es lo correcto |
| **Consumo** | `HOY` (como **modificador del estado general**, no del Hero) |
| **Default operativo transitorio** | 🟢 **`RESOLVED` sólo se alcanza con una intervención que registró outcome.** Cerrar sin resultado **no es un camino que exista** |
| **Auditoría** | 🟢 `audit_log`, que existía desde la B1 y la B6 por fin escribe |
| **Estado real** | 🟢 **Implementado** |
| **Depende de** | [ADR-032](decisions.md#adr-032) · `C01-044` (playbooks y SLA), `OPEN` |

⚠️ **El riesgo no gana el Hero.** Cambia el estado general y nada más: no interrumpe `IN_PROGRESS`,
no reordena materias y no inventa una CTA. Ni siquiera entra a `HeroInput`, y hay guard.

---

## 4.20 · Resultados derivados de los engines

**Qué es.** Lo que los motores concluyen. **No son datos oficiales: son inferencias versionadas.**

⚠️ **Son dos grupos con comportamientos opuestos, y no se pueden describir juntos.**

### A · Los que SÍ se persisten

| Resultado | Dónde vive | Versión de regla | Contradicción | Auditabilidad |
|---|---|---|---|---|
| Recomendación del ADE | `action`, `action_recommendation` | ⛔ **Sin `rule_version`** | 🟢 **No se apilan dos**: una segunda corrida devuelve `CONFLICTO` y no materializa | 🟡 Queda la fila y el `ActionRecommended`, **pero no con qué versión del ADE se decidió** |
| Señal de riesgo | `risk_signal` | 🟢 `rule_version` | 🟢 Lifecycle propio; `resolver_senal` no borra | 🟢 **Completa**: la fila, su regla y su versión |
| Readiness | `preparation_readiness` | 🟢 `rule_version` · ⛔ **nadie la escribe** | — | 🟢 Preparada, **sin uso** |

⚠️ **La recomendación del ADE es el hueco de este grupo.** Se persiste, se le muestra al estudiante,
y **no guarda con qué versión de la regla se produjo** —a diferencia de `risk_signal` y
`preparation_readiness`, que sí—. El día que `costoDeNoActuar` cambie, no habrá forma de saber con
qué criterio se recomendó lo que el estudiante hizo el mes pasado.

### B · Los que se recalculan en cada lectura

| Resultado | Versión de regla | Contradicción | Auditabilidad |
|---|---|---|---|
| Cobertura | `cobertura-v1` | 🟢 **No puede haber dos versiones en disco** | ⛔ **Ninguna** |
| Reparto | `reparto-v1` | 🟢 ídem | ⛔ Ninguna |
| Ventana | `ventana-v1` | 🟢 ídem | ⛔ Ninguna |
| Multiplicador personal | `multiplicador-v1` | 🟢 ídem | ⛔ Ninguna |
| Minutos por tema | `duracion-v1` | 🟢 ídem | ⛔ Ninguna |

⚠️ **Acá la contradicción se evita, no se resuelve.** No hay dos versiones porque no hay ninguna
guardada, y el costo es directo: **no se puede reconstruir qué vio el estudiante ayer**. Si la regla
cambia, la pantalla de hoy y el recuerdo de la semana pasada difieren sin que nada lo explique.

| | |
|---|---|
| **Autoridad** | ⛔ **No modelada, tampoco acá.** `product_event.actor_id = null` registra **procedencia** —*"lo produjo el Engine, no una persona"*—, y eso **no es autoridad**: no afirma que el engine esté habilitado a concluir lo que concluye. Lo único que acota sus afirmaciones es el validador, que es **una restricción de contenido**, no una capacidad |
| **Verificación** | 🟢 **El validador determinista**: diez reglas que rechazan toda recomendación que afirme dominio, progreso o readiness inexistente. **Lo que no se puede mostrar, no se persiste** |
| **Publicación** | 🟢 [ADR-058](decisions.md#adr-058): sin porcentaje y sin predicción de aprobación |
| **Contradicción** | ⚠️ **No hay una respuesta única: ver los grupos A y B de arriba.** Los persistidos la resuelven cada uno con su mecanismo; los recalculados **la evitan** por no guardar nada, a costa de no ser auditables |
| **Estado real** | 🟢 **Implementado**, con auditabilidad desigual entre grupos |

⚠️ **El reparto y la cobertura no se guardan a propósito** ([ADR-068](decisions.md#adr-068)): *"no
existe columna de minutos por tema: el reparto es derivación, no dato"*, con chequeo de base que lo
vigila.

⚠️ **`preparation_readiness` existe y nadie la escribe.** Los umbrales son `C01-029`. Sin card, sin
score, sin porcentaje.

---

# 5 · Los tres niveles, resumidos

## 5.1 · 🟢 Estado actual comprobado

| Afirmación | Evidencia |
|---|---|
| `verification_status` existe en **5 tablas** de 61 | `information_schema.columns` |
| **`topic` no tiene ninguna columna de procedencia** | ídem |
| **`resource` tiene procedencia y no tiene verificación** | ídem |
| **El ADE no consulta `verification_status` en ningún punto** | `contexto_del_ade`: `FROM resource r WHERE r.topic_id = t.id`, sin filtro; `FROM topic t WHERE t.offering_id = ce.offering_id`, sin filtro. Tampoco `lib/domain/ade.ts` ni `lib/server/servicios/motor.ts` |
| **`disputed` no representa una relación entre afirmaciones** | No existe ninguna tabla de conflicto ni de versionado de afirmaciones en `public` |
| **Autoridad y fuente canónica no están modeladas** | Ninguna columna, tabla ni función las expresa |
| **Ninguna columna de actor tiene FK** | `pg_constraint`, `contype='f'` sobre `%_by`, `actor_id`, `reviewer_id`: **cero filas** |
| **Una credencial de servicio compartida no distingue curador, coach y validador** | `esSecretoDeServicio()` compara contra una sola variable de entorno |
| **La ruta de validación no vuelve a disparar el ADE** | El ADE se invoca sólo desde `confirmar_mapa_academico` y `scripts/validar.mjs` |
| **`POST /api/observacion` no tiene productor en el flujo** | Única aparición fuera de la ruta: un `curl` impreso por `scripts/db-demo.sh:291` |
| **`resource` no tiene escritor en el producto** | No aparece en ninguna de las 30 funciones que escriben |
| **`rights_status` no se consulta en ninguna parte** | La única lectura de `resource` no lo menciona |
| **`reflection.difficulty` se escribe y nadie la lee** | Dos escritores, cero lectores en `lib/domain/` |
| **No existe entidad de bloque horario** | 61 tablas revisadas |

Y el hallazgo que ordena todo lo demás:

> **Aplicar hoy un filtro que excluya todo `unverified` dejaría al producto sin recomendaciones.**
> Todo el contenido académico nace `unverified`, `corroborar_procedencia()` **no tiene ninguna ruta
> que la alcance**, y `official` es **inalcanzable por diseño**. El conjunto de datos `corroborated`
> es, hoy, **vacío**.

## 5.2 · 🟡 Regla transitoria, para no apagar el MVP

**Esto describe lo que rige hoy y lo vuelve explícito. No es una política implementada.**

| Regla | Alcance |
|---|---|
| **`unverified` es utilizable por todos los engines** | Todo el contenido académico |
| **La señalización es obligatoria en pantalla** | 🟡 **Se cumple parcialmente.** En `UX02` la procedencia se muestra **en lenguaje natural**, y cátedra y estudiante van **en columnas separadas**, nunca fusionadas. ⛔ **Pero la acción recomendada no dice de dónde salió el material que propone** —ver §11, criterio 5—, así que el punto donde el estudiante actúa es justamente donde falta |
| **`disputed` debería excluirse de decisiones automáticas** | 🔵 **No implementado, y hoy no se puede**: ningún engine lee el campo |
| **Ningún engine puede afirmar autoridad que no tiene** | 🟡 **Se cumple por limitación, no por modelo.** El validador determinista acota **qué puede decir** una recomendación, y `actor_id = null` registra **que la produjo un proceso**. ⛔ Ninguna de las dos cosas **modela autoridad**: no dicen que el engine esté habilitado a afirmar algo, sólo que no es una persona |
| **Ninguna capa eleva su propio `verification_status`** | 🟢 `I9`, con guard que recorre **todas** las migraciones del directorio |

⚠️ **No se llama «default seguro», y el nombre importa.** Consumir todo lo `unverified` es el
**default operativo transitorio**: lo que evita apagar el MVP, no lo que lo vuelve seguro. Un producto
que se apaga por prudencia no es más prudente —deja al estudiante sin acompañamiento y sin
explicación—, pero llamar «seguro» a lo que no lo es sería exactamente el error que esta matriz
existe para impedir.

**Sus tres riesgos, explícitos:**

| Riesgo | Por qué no es seguro |
|---|---|
| **`topic` no conserva procedencia** | Se consume un dato del que **no se sabe quién lo afirmó**, y una nueva ingesta borra la anterior sin rastro |
| **`resource.rights_status` no se consulta** | Se le ofrece al estudiante material marcado `restricted` igual que uno `allowed` |
| **La acción recomendada no informa de dónde salió el material** | El estudiante no puede evaluar la fuente de lo que se le pide abrir |

## 5.3 · 🔵 Modelo objetivo propuesto — **no autorizado**

**Registrado como derivación posible, no como plan.** El owner pidió explícitamente **no fijar** que
habrá dos migraciones, una tabla o una columna de autoridad: la matriz debe permitir decidir **la
forma**.

**Autoridad** — se puede resolver de al menos cuatro formas, y la matriz no elige:

| Forma | Qué implicaría |
|---|---|
| **Campo** en cada tabla | `asserted_by_role`. Simple; multiplica la columna por tabla |
| **Relación** actor→capacidad | Tabla de capacidades. Es lo más cercano a [ADR-076](decisions.md#adr-076) (*capacidades, no personas*) |
| **Política** declarativa | Un módulo versionado que responde *"¿puede X afirmar Y?"*. No toca el schema |
| **Registro de resolución** | Un hecho append-only por afirmación, con quién y con qué capacidad |

**Canonicidad** — mismas cuatro formas. Y hay un caso donde **ya está resuelta sin columna**: las
evaluaciones, por **visibilidad** (`declared_by`). Vale la pena mirarlo antes de agregar campos: la
pregunta *"¿cuál gobierna?"* a veces es en realidad *"¿para quién?"*.

**Verificación de `topic` y `resource`** — hoy imposible. La forma queda abierta.

**Relación de contradicción** — hoy imposible. Podría ser una tabla de conflicto, un campo que apunte
a la afirmación que reemplaza, o un registro de resolución con historia.

---

# 6 · Brechas ordenadas por impacto

> ⚠️ **Reordenado el 8 de septiembre.** La primera versión ponía la identidad de actor en el primer
> lugar. **El orden ahora pondera también si el equipo puede actuar**: la identidad está diferida por
> [ADR-057](decisions.md#adr-057) hasta el dictamen de [ADR-006](decisions.md#adr-006), y `topic` no
> depende de nadie externo. La identidad **no bajó de importancia**: bajó de *accionabilidad*.

| # | Brecha | Carril | Por qué está acá |
|---|---|---|---|
| **1** | **`topic` no tiene procedencia, versión ni historia**, y es el dato más consumido del sistema | **A** | El ADE, el Gantt, la cobertura, el reparto y la ventana se apoyan en él. Un `DELETE` sin rastro lo reemplaza entero. **Es la conclusión principal — §0** |
| **2** | **No hay identidad de actor.** Veinte columnas `*_by` sin FK y **una sola credencial de servicio** | **B** | Bloquea la separación de funciones, que sostiene todo lo demás. **Aunque se construyera la superficie académica, no se podría demostrar quién hizo qué.** ⏸️ Diferida por [ADR-057](decisions.md#adr-057); el interinato del secreto de servicio **está declarado y vigente** |
| **3** | **No hay por dónde entra el contenido académico** | **A** | Sin esto el golden path no arranca para nadie que se dé de alta desde cero |
| **4** | **El Risk Engine no tiene fuente** | **B** | Funciona, está validado por la psicopedagoga y **nadie lo alimenta** |
| **5** | **`resource` no tiene verificación** y el ADE lo consume sin filtro | **B** | Es lo que el estudiante abre. Una política de materiales hoy no se puede escribir |
| **6** | **`disputed` no relaciona afirmaciones** | **B** | Cada contradicción se resuelve borrando |
| **7** | **El reloj no corre solo** | **A** | Ningún compromiso vence; el rescate no se alcanza |
| **8** | **La validación no re-dispara el ADE** | **A** | Un estudiante puede quedarse sin acción para siempre |
| **9** | **`reflection.difficulty` sin consumidor** | **A** | Dato pedido al estudiante que no se usa. **O se usa o no se pide**. Ver [ADR-080](decisions.md#adr-080), candidato |
| **10** | **`rights_status` sin consumidor** | **A** | Se ofrece material `restricted` igual que `allowed` |

---

# 7 · Decisiones ya cerradas que la matriz debe respetar

| Decisión | Qué fija |
|---|---|
| [ADR-006](decisions.md#adr-006) | Datos reales bloqueados. `PROVISIONAL — LEGAL CONFIRMATION REQUIRED` |
| [ADR-039](decisions.md#adr-039) | No hay registro: el padrón lo decide el CRM |
| [ADR-052](decisions.md#adr-052) | El alta, y que el estudiante declara sus materias |
| [ADR-058](decisions.md#adr-058) | Readiness **sin porcentaje y sin predicción** |
| [ADR-067](decisions.md#adr-067) | El estudiante declara sus evaluaciones; `declared_by` |
| [ADR-069](decisions.md#adr-069) | `session_kind` se propone, no se importa |
| [ADR-072](decisions.md#adr-072) | Qué muestra la barra y qué tiene prohibido |
| [ADR-074](decisions.md#adr-074) | El Personal Engine calibra el trabajo, no la vida |
| **[ADR-076](decisions.md#adr-076)** | **Tres perfiles operativos · capacidades, no personas · `corroborated` como techo · `official` reservado · separación de funciones** |
| [ADR-076](decisions.md#adr-076) §6 | ⛔ **No autoriza implementar** |

> ⚠️ **[ADR-076](decisions.md#adr-076) ya define lo que el planteo del equipo proponía decidir.** La
> re-derivación independiente es buena validación del criterio; **no es una decisión nueva**, y no
> levanta la prohibición de construir.

---

# 8 · Decisiones humanas pendientes

> ⚠️ **Corrección aplicada el 8 de septiembre.** La primera versión de esta sección listaba
> `C01-018`, `C01-021`, `C01-029`, `C01-030` y `C01-044` como **abiertas**. **Era incorrecto**: las
> cinco tienen ADR. Se contrastó contra [`decisions.md`](decisions.md) y
> [`decisiones-abiertas.md`](decisiones-abiertas.md), y **el repositorio coincide con el owner en las
> cinco**. Lo que sigue es el estado real, con sus residuos.

## 8.1 · Las cinco que ya tienen ADR — **no son decisiones pendientes**

| Fila | Estado real | ADR | Residuo, si lo hay |
|---|---|---|---|
| `C01-018` · causalidad de `ProgressUpdated` | ✅ **`CLOSED`** | [ADR-047](decisions.md#adr-047) *(4 sep 2026)* | Ninguno. **Ratifica lo que ya corre** |
| `C01-029` · umbrales de readiness | ✅ **`CLOSED`** | [ADR-058](decisions.md#adr-058) *(5 sep 2026)* | 🟡 **La regla está cerrada; la tabla sigue sin escritor.** Eso es implementación, no decisión |
| `C01-030` · quién valida y corrobora | ⏸️ **`DEFERRED` con motivo** | [ADR-057](decisions.md#adr-057) *(5 sep 2026)* | **Se retoma con [ADR-006](decisions.md#adr-006)**, y **el interinato sigue vigente**: el secreto de servicio es la solución declarada mientras tanto |
| `C01-021` · qué regla produce qué señal | 🟡 **`ANSWERED — RESIDUO ABIERTO`** | [ADR-055](decisions.md#adr-055) *(5 sep 2026)* | `HP0-06-2` y `HP0-06-3` quedan en **modo humano hasta el piloto**. **Es la respuesta, no una omisión** |
| `C01-044` · playbooks y SLA | 🟡 **`ANSWERED — RESIDUO ABIERTO`** | [ADR-056](decisions.md#adr-056) *(5 sep 2026)* | Provisionales y rotulados, con **contacto dentro de cuatro horas hábiles**. ⬜ Sigue abierto **de qué sistema es** el playbook |

⚠️ **`C01-030` no es «`OPEN`», y la diferencia cambia el plan.** Está **diferido con motivo hasta que
[ADR-006](decisions.md#adr-006) tenga dictamen legal**. No espera una decisión de producto que
alguien podría tomar mañana: **espera un dictamen externo**. Por eso §10 se reordenó.

⚠️ **Y el interinato que ADR-057 declaró vigente es exactamente lo que §4.16 describe**: el secreto
de servicio con `reviewer_id = NULL`. La matriz no lo denuncia como descuido — lo registra como **la
solución transitoria que un ADR aceptó**, y señala qué no se puede demostrar mientras dure.

## 8.2 · Las que sí siguen pendientes

| Decisión | Quién la cierra | Qué destraba |
|---|---|---|
| **Cómo entra el contenido académico** | Product Owner | Brecha 3 |
| **Forma de la trazabilidad de `topic`** — granularidad, versionado, conservación histórica | Product Owner + CTO | Brecha 2. **Ver §9, C2** |
| **`C01-019` — mostrar las cinco dimensiones** | Product Owner (gate `H`) | `UX06` |
| **`C01-052` — publicar los planes de la UCC** | Product Owner + institución | §4.2 |
| **Qué es una tarea comparable** | Psicopedagoga | §4.10 |
| **¿Se usa `difficulty` o se deja de pedir?** | Psicopedagoga | Brecha 9 |
| **Scheduler del reloj** | CTO | Brecha 7 |
| **De qué sistema es el playbook** | Product Owner | Residuo de [ADR-056](decisions.md#adr-056) |

---

# 9 · Cambios técnicos candidatos — **sin implementar**

**Ninguno está autorizado.** Se listan para que la decisión de forma sea explícita.

| # | Candidato | Forma abierta | Precondición |
|---|---|---|---|
| C1 | Identidad y capacidades de actor | Tabla, política, o registro de resolución | `C01-030` |
| C2 | Trazabilidad de `topic` | Campos en la tabla · afirmación versionada aparte · registro append-only con vigencia | ⚠️ **Requiere decisión técnica explícita**: granularidad, versionado y conservación histórica |
| C3 | Verificación de `resource` | Campo, o política sobre `source_type` + `rights_status` | Ninguna |
| C4 | Relación de contradicción | Tabla de conflicto, campo de reemplazo, o registro de resolución | Ninguna |
| C5 | Política de consumo de engines | Módulo versionado consultado por los engines | Requiere C2 y C3 |
| C6 | Historia de `topic` en vez de `DELETE` | Versionado, o append-only con vigencia | Ninguna |
| C7 | Re-disparo del ADE al validar | Orquestación en el service | Ninguna — **es trabajo, no decisión** |
| C8 | Scheduler del reloj | Cron o job externo | Infraestructura |
| C9 | Productor de observaciones de error | Depende de quién juzga | `C01-030` + `C01-021` |

⚠️ **C7 no depende de ninguna decisión humana abierta**, y es el más barato de la lista. **Eso no lo
autoriza**: sigue siendo un candidato, y **puede autorizarse por separado** cuando el owner lo
decida. Ningún ítem de esta tabla queda habilitado por este documento.

⚠️ **C2 no es «una brecha sin decisión».** Que `topic` necesite trazabilidad **está comprobado**; lo
que no está decidido es **la forma**: por unidad o por ingesta, con versión o con vigencia, y si la
historia se conserva o alcanza con saber quién afirmó la versión actual. Son decisiones técnicas
distintas y con costos distintos.

---

# 10 · Secuencia recomendada de autorización e implementación

> ⚠️ **Corrección aplicada el 8 de septiembre.** La primera versión decía *"cerrar `C01-030` va
> primero y no es negociable"*. **Era incorrecto por dos motivos**: `C01-030` está **diferido con
> motivo hasta [ADR-006](decisions.md#adr-006)** ([ADR-057](decisions.md#adr-057)), así que no es una
> decisión que el equipo pueda destrabar; y **no toda mejora del MVP depende de él**. Hay dos
> carriles con dependencias distintas y conviene no encadenarlos.

⛔ **Ninguno de los dos carriles queda autorizado a construirse por este documento.**

## 10.1 · Carril A — Integridad operativa del MVP

**No depende de `C01-030` ni de `ADR-006`.** Son cosas que el producto hace mal o no hace, y que se
pueden arreglar sin resolver la cadena de confianza.

| # | Qué | Cierra | Naturaleza |
|---|---|---|---|
| A1 | **C7** — re-disparo del ADE al validar | Brecha 8 | Construcción. Ninguna decisión previa |
| A2 | **C8** — scheduler del reloj | Brecha 7 | Infraestructura |
| A3 | `rule_version` en `action_recommendation` | §11 criterio 7 | Migración |
| A4 | Señalizar la procedencia **en la acción recomendada** | §11 criterio 5 · §5.2 | Copy + proyección |
| A5 | Definir **la ingesta estudiantil `unverified`** | Brecha 3 | ⚠️ **Decisión de producto**, después construcción |
| A6 | **C2** — trazabilidad de `topic`, con su forma decidida | Brecha 2 | ⚠️ Decisión técnica, después migración |

⚠️ **A5 y A6 llevan una decisión adelante; A1 a A4 no.** Es la diferencia que hay que mirar antes de
ordenarlos.

## 10.2 · Carril B — La cadena de confianza

**Encadenada, y su primer eslabón es externo.**

```
ADR-006 (dictamen legal)
   → C01-030 (quién valida y corrobora)
      → identidad y capacidades de actor  (C1)
         → corroboración operativa        (rutas hacia corroborar_procedencia)
            → official                    (autenticación institucional)
```

| # | Qué | Bloqueado por |
|---|---|---|
| B1 | Dictamen de [ADR-006](decisions.md#adr-006) | **Externo.** No lo destraba el equipo |
| B2 | Retomar `C01-030` | B1, por [ADR-057](decisions.md#adr-057) |
| B3 | Elegir la **forma** de autoridad y canonicidad (C1) | B2 |
| B4 | **C3 + C5** — verificación de `resource` y política de consumo | B3, y **C2 del carril A** |
| B5 | **C4 + C6** — contradicción e historia | B3 |
| B6 | La ingesta curada y la superficie académica | B3 · [ADR-076](decisions.md#adr-076) §6 |

⚠️ **`official` es el último eslabón y hoy es inalcanzable por diseño**, no por falta de trabajo:
`corroborar_procedencia()` lo rechaza explícitamente hasta que exista autenticación institucional.

⚠️ **El único cruce entre carriles es C2.** La trazabilidad de `topic` es del carril A —no necesita
`C01-030`— y a la vez es **precondición de la política de consumo** del carril B: sin saber quién
afirmó una unidad, no hay sobre qué decidir si usarla.

---

# 11 · Criterio mínimo para que el ADE consuma sin ocultar su incertidumbre

**El ADE no debe apagarse por falta de verificación. Debe decir sobre qué está decidiendo.**

| Criterio | Estado |
|---|---|
| **1 · Nunca afirmar más de lo que el dato sostiene** | 🟢 **Cumplido.** El validador determinista rechaza toda recomendación que afirme dominio, progreso o readiness inexistente, con diez reglas que citan su fila del spec |
| **2 · Distinguir ausencia de cero** | 🟢 **Cumplido.** `no_information` y `not_evaluated` no son `0`, y el ADE los trata como **más caros** que un valor bajo conocido |
| **3 · No recomendar sobre contexto incompleto** | 🟢 **Cumplido.** Sin unidades o sin material devuelve `CONTEXTO_INCOMPLETO` con el detalle, **y no inventa una acción** |
| **4 · Declararse como inferencia, no como dato** | 🟢 **Cumplido**, y con el alcance justo: `actor_id = null` declara **quién no lo produjo** —ninguna persona—. **No declara autoridad**, que no está modelada |
| **5 · Que la procedencia de lo que usó sea visible al estudiante** | 🟡 **Parcial.** `UX02` muestra cátedra y estudiante en columnas separadas; **la acción recomendada no dice de dónde salió el material que propone** |
| **6 · Excluir lo disputado de decisiones automáticas** | ⛔ **No cumplido, y hoy imposible**: ningún engine lee `verification_status`, y `topic` y `resource` no lo tienen |
| **7 · Versionar la regla con la que decidió** | ⛔ **No cumplido.** `action_recommendation` **no tiene `rule_version`**, a diferencia de `risk_signal` y `preparation_readiness` |

> **El criterio mínimo alcanzable hoy son los puntos 1 a 4, y ya se cumplen.** El 5 es copy. El 6
> requiere C2 y C3. **El 7 es el más barato de los tres que faltan y el que más se echaría de menos
> el día que una regla cambie**: sin él, no se puede saber con qué versión del ADE se recomendó lo
> que el estudiante hizo el mes pasado.

---

## Fuentes inspeccionadas

**Base de datos** (Postgres local, 8 de septiembre de 2026): `information_schema.columns` y
`information_schema.tables` sobre las 61 tablas de `public`; `pg_constraint` para FKs y CHECKs;
`pg_proc` / `pg_get_functiondef` sobre las 59 funciones, con extracción de escrituras por regex.

**Código**: `lib/domain/` (ade, cobertura, duracion, reparto, ventana, multiplicador, precedence,
reiteracion, validador-de-recomendacion), `lib/server/servicios/`, `lib/server/repositorios/`,
`app/api/` (26 rutas), `scripts/`.

**Documentación**: `docs/decisions.md` (ADR-006 … ADR-079), `docs/data-model.md`, `docs/product.md`,
`docs/informe-superficie-academica.md`, `docs/decisiones-abiertas.md`.
