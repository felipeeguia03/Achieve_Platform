# ACHIEVE — ANEXO: DECISIONES DE NEGOCIO PENDIENTES

**Documento:** `ACHIEVE_PENDING_DECISIONS_ANNEX_v1.0.md`
**Consolidado:** 28 de agosto de 2026
**Relación con el spec:** este anexo es deliberadamente independiente de `ACHIEVE_MASTER_PRODUCT_SPEC_v1.0.md`. El spec te sirve para generar pantallas; este anexo te sirve para saber qué todavía **no está decidido** y por lo tanto ningún builder debería inventar.

## Qué es esto y qué no es

Son 51 decisiones de negocio/producto (registro C01), de las que **42 siguen sin resolver** más 8 decisiones psicopedagógicas específicas que forman parte de esas 51 (`HUMAN-P0-01…08`, dentro de C01-031…038). Ninguna bloquea generar el prototipo low-fi: para eso alcanza con fixtures y estados sintéticos, que es justamente lo que ya cubre el spec consolidado. Bloquean, en cambio, cualquier paso hacia high-fidelity, implementación real o piloto — ahí estas 51 filas dejan de poder resolverse con un fixture y necesitan una respuesta real de un owner.

**Severidad:**
- `P1` — tiene fallback reversible hoy (fixture/omisión/estado neutral), pero debe cerrarse antes de su gate material.
- `P2` — diferido, fuera del alcance del MVP.

**Gate material** (a partir de qué etapa deja de poder posponerse):
`I` = antes de implementación productiva · `H` = antes de high-fidelity · `P` = antes de piloto institucional · `O` = fuera del MVP, no bloquea nada del corte actual.

**42 de las 51 filas siguen `OPEN`.** Las ocho `HUMAN-P0` (`C01-031`…`C01-038`) pasaron a
`ANSWERED — RESIDUO ABIERTO` el 31 de agosto de 2026, y `C01-051` el 1 de septiembre: su owner —una psicopedagoga real— respondió por
escrito. Ver [ADR-025](decisions.md#adr-025) y la fuente literal en
[`human-p0-source.md`](human-p0-source.md).

Eso es exactamente lo que este anexo pedía: **una respuesta real de su owner, documentada, no una
inferencia.** Ninguna reclasificación ni uso en el low-fi cierra una fila; sólo su owner.

**`ANSWERED — RESIDUO ABIERTO` no es `CLOSED`.** El criterio principal está confirmado y se puede
construir contra él; lo que queda listado en la columna de residuo sigue sin poder inventarse.

## Tabla maestra — 51 decisiones pendientes (C01)

| ID | Título y alcance | Owner de decisión; consumidores; dependencias | Estado / conflicto | Sev. | Gate material |
|---|---|---|---|---|---|
| C01-001 | Identidad, tenancy y esquema base de Academic Data Layer | Product Data; todas las vistas/Engines; institución, C01-002 | OPEN; `platformStudentId` UUID definido para integración, tenancy/schema integral pendiente. ✅ **Deja de bloquear los tres flujos de riesgo**: el CRM verificó contra su código que resuelve institución, cola y operador partiendo sólo de `platformStudentId`, y `institutionId` salió del payload ([`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md) §10.1) | P1 | I |
| C01-002 | Provenance, `verification_status`, vigencia y derechos | Academic Data Layer; vistas, Risk/ADE, auditoría; C01-001 | OPEN; fragmentado | P1 | I |
| C01-003 | Relaciones y lifecycles académicos | Product Data; Materia/Hoy/Risk/Progress; C01-001/002 | OPEN; gaps estructurales | P1 | I |
| C01-004 | `class_event_record`: captura/corrección/versionado | Academic Data Layer; Materia/Risk/Bitácora/ADE; C01-001–003 | OPEN; forma técnica pendiente | P1 | I |
| C01-005 | Assessment multifuente y lifecycle | Product Data; UX07–09/ExamPreparation; C01-001/002 | OPEN | P1 | I |
| C01-006 | Academic Decision Engine y `ActionRecommendation` | Academic Decision owner; TodayView/Materia/Action/Exam; C01-001/002/021 | OPEN; owner funcional conocido | P1 | I |
| C01-007 | Action: identidad, lifecycle y contexto inequívoco | Academic Decision Engine mantiene ownership; Action lifecycle consume CourseEnrollment y contexto ExamPreparation; C01-003/006/026 | OPEN; `C01-CF-03` gap, no contradicción | P1 | I |
| C01-008 | Contenido ejecutable de Action y Resource | Action content owner; Hoy/Materia/Commitment/Evidence/Protocol; C01-006/007 | OPEN | P1 | H |
| C01-009 | Mutaciones de Action e idempotencia | Action lifecycle owner; UX03/04/analytics; C01-007/023 | OPEN | P1 | I |
| C01-010 | Commitment temporal, renegociación y rescate | Commitment owner; Hoy/Materia/Bitácora/CRM; C01-003/008 | OPEN | P1 | I |
| C01-011 | Coordinación observable Action–Commitment | Product lifecycle owner; UX01/03/04; C01-007/009/010/023 | OPEN | P1 | I |
| C01-012 | Evidence content y pre-submission | Evidence System; UX05/Protocol; C01-001/008 | OPEN; Reflection config separada en C01-051 | P1 | I |
| C01-013 | Criterios, validación y señales de Evidence | Evidence System/Product; Progress/Protocol/ADE; C01-008/012/035 | OPEN; semántica técnica abierta. **Confirmado por `HUMAN-P0-05 v1.0`:** `signal_execution`/`signal_production` son **evidencia de trabajo**; sólo `signal_domain` es **evidencia de aprendizaje** | P1 | I |
| C01-014 | Relaciones, agregación y tardanza de Evidence | Evidence System; Commitment/Progress/Protocol; C01-007/010/012/027 | OPEN | P1 | I |
| C01-015 | Idempotencia y normalización Web/WhatsApp de Evidence | Evidence Integration; UX05/auditoría; C01-012/014/023 | OPEN | P1 | I |
| C01-016 | Instancia técnica de revisión R1 | Validation/Security; Evidence/R1; C01-013/030/036 | OPEN; R1 autorizada, R3 fallback, assignment técnico pendiente. `HUMAN-P0-06 v1.0` dice **cuándo** hace falta una persona, y el disparador es la situación del estudiante: por eso sus tres reglas viven en `risk_rule` y no en el lifecycle de `Evidence` ([ADR-032](decisions.md#adr-032)) | P1 | I |
| C01-017 | Privacidad y retención de Evidence/Reflection | Product Privacy; estudiante/R1/institución; C01-001/030/051 | OPEN | P1 | I |
| C01-018 | `ProgressUpdated`: payload, causalidad y no-cambio | Progress owner; UX06/08/09/ADE/Risk; C01-013/014/023 | OPEN | P1 | I |
| C01-019 | TopicProgress y resumen de materia | Product Progress; Hoy/Materia/Bitácora/Risk; C01-003/018 | OPEN; semántica técnica pendiente | P1 | H |
| C01-020 | ProgressEntry / Bitácora bundle | Progress/Event owner; Bitácora/Materia; C01-018/019/023 | OPEN; read model/materialización no decididos | P1 | I |
| C01-021 | Risk Engine v1 y sujeto de RiskSignal | Risk owner; TodayView/CRM/ADE; C01-001/002/019/023/036 | OPEN. El **sujeto** quedó resuelto por schema (estudiante, opcionalmente scoped a una cursada) y los tres disparadores de `HUMAN-P0-06 v1.0` están **cargados como configuración sin umbral** ([ADR-032](decisions.md#adr-032)). Sigue abierto **qué regla produce qué señal y con qué severidad**: no existe evaluador, y hay guard que rompe si aparece. ⚠️ **El vocabulario de severidad NO está bloqueado por esta decisión**: `bajo`/`atencion`/`riesgo`/`intervencion` ya está congelado en el `CHECK` del schema y [ADR-034](decisions.md#adr-034) lo fijó para el contrato v1. Lo que falta es **el asignador**, no el enum | P1 | I |
| C01-022 | Closed-loop Risk–Intervention–Outcome | Product Operations; CRM/Risk/institución; C01-021/039/044 | OPEN. ✅ **El mecanismo está construido y es inviolable**: cerrar sin outcome no es un camino que exista, y `RESOLVED` exige una intervención con resultado ([ADR-032](decisions.md#adr-032)). ✅ **CERRADA el 1 de septiembre de 2026 por [ADR-034](decisions.md#adr-034)**, opción A: la necesidad de intervención humana la produce la Plataforma desde `risk_rule.modo`; se habilita `OPEN → INTERVENTION_REQUIRED`; `ACKNOWLEDGED` queda legacy y hacerse cargo es un hecho de la `Intervention`; `EXPIRED` sale sólo de `OPEN`; el cierre escribe outcome, intervención y `RESOLVED` en una transacción. **Decidida, todavía no implementada** (plan en [`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md) §7) | P1 | I |
| C01-023 | Product Event Model | Product Event owner; analytics/servicios; C01-001 | OPEN; artifact ausente | P1 | I |
| C01-024 | Recomendación/activación temporal de Modo Examen | Product/ADE; UX01/02/07; C01-005/006/023 | OPEN; default configurable | P1 | I |
| C01-025 | ExamPreparation: ownership y lifecycle | ExamPreparation owner; UX07–09; C01-005/023/024 | OPEN | P1 | I |
| C01-026 | ExamProtocol instance y estado por paso | Exam Protocol owner; UX08/09/Evidence/ADE; C01-025 | OPEN. **Avanzado por [ADR-028](decisions.md#adr-028):** no hay estado por paso, hay hechos de completion, y son varios por paso | P1 | I |
| C01-027 | Contenido/Resource versionado de ProtocolStep | Exam Protocol content owner; UX09/Evidence; C01-002/026/031–038/051 | OPEN. **La pauta de la cátedra ya tiene dónde vivir** ([ADR-029](decisions.md#adr-029)) y el contenido se carga rotulado ([ADR-030](decisions.md#adr-030)). Sigue abierto **el criterio de cierre**, y aparece un hecho nuevo: **el texto de los 20 pasos `PE-PSY` nunca se transcribió al repositorio** | P1 | I |
| C01-028 | Completion, gates y `ProtocolStepCompleted` | Exam Protocol/Evidence; UX08/09/Progress; C01-013/014/016/023/026/027 | OPEN. ✅ **La reentrancia está resuelta** ([ADR-028](decisions.md#adr-028)): cada vuelta es una fila con su ordinal y su tema, y el evento se emite una vez por vuelta. Siguen abiertos **los gates** | P1 | I |
| C01-029 | Readiness scoped de ExamPreparation | Product; UX08/ADE/Risk; C01-025–028/031–038 | OPEN. ✅ **El owner canónico se cerró** ([ADR-011](decisions.md#adr-011)) y la tabla existe desde la Fase B5. Lo que sigue abierto son **los umbrales**, y por eso **nadie escribe esa tabla**: sin card, sin score, sin cálculo | P1 | I |
| C01-030 | Autorización, permisos y privacidad institucional | Product Security/Privacy; todas las superficies/CRM; C01-001/002/017/039 | OPEN; diseño JWT/backend/RLS recibido, política y aceptación técnica pendientes | P1 | I |
| C01-031 | `HUMAN-P0-01`: baseline granular de 20 IDs | Psicopedagoga real; Protocol content; provenance humana | **ANSWERED 31 ago 2026** ([ADR-025](decisions.md#adr-025)) — secuencia confirmada como base, tramo 9–18 **reentrante**. Residuo: **obligatoriedad paso a paso** | P1 | I |
| C01-032 | `HUMAN-P0-02`: dimensiones y proyección breve | Psicopedagoga real; Evidence/Progress/Protocol | **ANSWERED 31 ago 2026** — modelo mixto confirmado, la escala breve **se queda**. Residuo: **reconciliar los dos vocabularios de dimensiones** (`C01-019`) | P1 | I |
| C01-033 | `HUMAN-P0-03`: recuperación y apoyos producidos | Psicopedagoga real; Protocol/ADE/Evidence | **ANSWERED 31 ago 2026** — dos resultados **separados**; la técnica se usa cuando cumple una función concreta. Residuo: **si la recuperación también puede omitirse** | P1 | I |
| C01-034 | `HUMAN-P0-04`: núcleo H24 adaptable | Psicopedagoga real; Protocol/readiness scoped | **ANSWERED 31 ago 2026** — **siete componentes**, con diagnóstico y corrección adentro. Residuo: **si son obligatorios o priorizables**, y el orden de sacrificio | P1 | I |
| C01-035 | `HUMAN-P0-05`: señal de aprendizaje | Psicopedagoga real; Evidence signals/Progress | **ANSWERED 31 ago 2026** — la fuente **confirmó**: evidencia de trabajo ≠ evidencia de aprendizaje. Sale de `POTENTIALLY ANSWERED`. Residuo: **qué tareas exigen comprensión por sí mismas** | P1 | I |
| C01-036 | `HUMAN-P0-06`: aplicabilidad de revisión humana | Psicopedagoga real; Protocol/Validation; **y Risk/Intervention** | **ANSWERED 31 ago 2026** — selectiva y proporcional; **la persona entra por la situación del estudiante, no por el tipo de entrega**. Residuo: **umbral de "error reiterativo"** | P1 | I |
| C01-037 | `HUMAN-P0-07`: criterios práctico/teórico escrito | Psicopedagoga real; Protocol content/completion | **ANSWERED 31 ago 2026** — las dos familias se conservan y **la pauta de la cátedra manda**. Residuo: **peso relativo**, y qué pasa si la pauta contradice las familias | P1 | I |
| C01-038 | `HUMAN-P0-08`: postmortem | Psicopedagoga real; Protocol post-exam | **ANSWERED 31 ago 2026** — cuatro ejes, **sin cantidad fija** de ajustes, y **se registra lo que funcionó**. Residuo: **el momento**, antes o después de la nota | P1 | I |
| C01-039 | CRM–Plataforma, incl. `human_assignment` | CRM/Operations; Plataforma/Hoy/Compromiso/Risk; C01-001/021/022/030 | OPEN; autorización v1 documentada, actividad/contexto/assignment pendientes. **Achieve ya dejó el puerto** —`DirectorioDeOperadores`, una pregunta y tres respuestas— y lo que necesita está en [`platform-integration-contract.md`](platform-integration-contract.md) §2.2. **Ya no bloquea superficies de operador**: [ADR-033](decisions.md#adr-033) las retiró del alcance de la Plataforma por pertenecer al CRM. **La estructura existe del lado del CRM** —`operator_assignments` con operador, nivel, turno y vigencia—; lo que falta es la política de visibilidad ([`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md) §10.1) | P1 | I |
| C01-040 | Webhooks, sincronización y reconciliación | Integration/Security; CRM/Evidence/Event Model; C01-015/023/030/039 | OPEN; retry de autorización v1 definido, webhooks/reconciliación futuros sin contrato. **Alcanza a los tres flujos pendientes** de [`platform-integration-contract.md`](platform-integration-contract.md) §2.2, incluido el de comandos CRM → Plataforma que hoy no existe | P1 | I |
| C01-041 | Architecture/API/Data/Integration Spec | CTO/Architecture; equipos; depende de contratos funcionales | OPEN; artefacto parcial recibido, falta aceptación y contratos productivos completos | P1 | I |
| C01-042 | Golden dataset, adquisición y legalidad | Product Data; ADL/Risk/ADE; C01-001/002/030 | OPEN; selección institucional pendiente | P1 | P |
| C01-043 | Student Model / Personal Engine | Product; ADE/Risk/Intervention; C01-001/002/023 | OPEN; mencionado, no especificado | P1 | I |
| C01-044 | Playbooks, SLA y Human QA del piloto | Product Operations; Intervention/CRM; C01-022/039/046 | OPEN; **no se inventan valores**, y por eso la tabla `playbook` se creó vacía. `circuito_de_senales()` reporta `faltan.playbooks: C01-044` en vez de dar el circuito por cerrado. ⬜ **Propuesta abierta, no decidida:** que playbook y SLA sean canónicos del **CRM**, no de la Plataforma — el spec pone el Intervention Engine de ese lado (*"Intervention Engine / CRM"*, §15.3 y §21). [ADR-033](decisions.md#adr-033) **no la cerró a propósito**; la decide el owner de esta `C01`. Si se acepta, la tabla `playbook` de la Plataforma sobra y su `sla_at` pasa a ser una referencia externa, como `owner_operator_id` | P1 | P |
| C01-045 | Corrigendum de promoción y precedencia | Product Owner/Document Control; auditores/equipos | OPEN; divergencia administrativa | P1 | antes de promoción/handoff formal |
| C01-046 | Métricas y visibilidad institucional del piloto | Product Measurement/Privacy; institución/QA; C01-023/030/042 | OPEN | P1 | P |
| C01-047 | Modalidad oral y otras familias | Product Owner examen; Exam Protocol | OPEN — DEFERRED | P2 | O |
| C01-048 | Integraciones profundas Calendar/LMS/SIS | Product Architecture; institución/estudiante | OPEN — DEFERRED | P2 | O |
| C01-049 | Hardening de escala y automatización avanzada | Product Architecture/Data; escala | OPEN — DEFERRED | P2 | O |
| C01-050 | `academic_context_blocker` | ADL posee contexto; ADE disponibilidad/prioridad; Materia/TodayView; C01-001/002/006 | OPEN; SCP antes omitido, no alias semántico | P1 | I |
| C01-051 | Configuración y obligatoriedad funcional de Reflection | Product/Evidence configuration; Evidence/Protocol/Bitácora; C01-008/012/017/027 | **ANSWERED — RESIDUO ABIERTO** (1 sep 2026, [ADR-026](decisions.md#adr-026)): vive en la Action y en el paso, congelado al crear; ternario `NO_CONFIGURADA`/`OPTIONAL`/`REQUIRED`; default del loop diario `OPTIONAL`. **Residuo:** en qué pasos del protocolo es obligatoria — criterio pedagógico. Privacidad sigue en C01-017 | P1 | H |


## Detalle — las 8 decisiones psicopedagógicas (`HUMAN-P0-01…08`) — **RESPONDIDAS**

Estas ocho son un subconjunto de C01-031…038: no son técnicas, son de criterio profesional. **El 31
de agosto de 2026 la psicopedagoga real las respondió por escrito**, con las ocho opciones marcadas y
observaciones. La fuente literal está en [`human-p0-source.md`](human-p0-source.md); su lectura, en
[ADR-025](decisions.md#adr-025). Los defaults `PROVISIONAL-HUMAN-P0-0X v0.1` que el equipo venía
usando quedan **reemplazados** por `HUMAN-P0-0X v1.0`.

**Cuatro de las ocho cambiaron el criterio que el equipo asumía.** Vale la pena mirarlas: son las que
habrían quedado mal si se construía B5 antes de preguntar.

| ID | Criterio confirmado (`v1.0`) | ¿Cambió el default? | Residuo abierto |
|---|---|---|---|
| `HUMAN-P0-01` | Secuencia `PE-PSY-01…20` confirmada como base, sin cambiar ningún paso. **Los pasos 9 a 18 no son lineales ni rígidos** y una misma acción puede repetirse varias veces sobre el mismo tema | **Amplía** — el default no decía que el tramo central fuera reentrante | Cuáles de los 20 son **obligatorios** |
| `HUMAN-P0-02` | Modelo **mixto**: escala breve para el día a día + dimensiones separadas cuando hay desempeño observable | **Ratifica** — y responde que la escala breve se queda | Reconciliar *contacto / recuperación / aplicación / corrección* con las cinco dimensiones del modelo |
| `HUMAN-P0-03` | Producir un apoyo y recuperar sin ayuda son **dos resultados separados** del mismo paso; **uno puede no aplicar**. La técnica se usa cuando cumple una función concreta | **Corrige** — el apoyo deja de estar subordinado | Si la **recuperación** también puede omitirse |
| `HUMAN-P0-04` | **Siete componentes:** situación y logística · contenidos críticos · prueba breve sin ayuda · priorización · práctica parecida al examen · corrección de errores importantes · descanso y estrategia. Un contenido central nunca trabajado **puede** abordarse | **Reemplaza** — el default era *una única* actividad cognitiva | Si los siete son obligatorios o priorizables |
| `HUMAN-P0-05` | **Evidencia de trabajo ≠ evidencia de aprendizaje.** Foto, cronograma, checklist, ficha y resumen prueban actividad, no aprendizaje | **Ratifica y bautiza** — y sale de `POTENTIALLY ANSWERED` | Qué tareas exigen comprensión por sí mismas |
| `HUMAN-P0-06` | Revisión **selectiva y proporcional**. Lo comprobable se automatiza. **La persona entra por la situación del estudiante** —error reiterado, no avanzar pese a devoluciones, factores subjetivos—, no por el tipo de entrega | **Redefine** — el default hablaba de *"alto impacto"* del artefacto | Umbral de *"error reiterativo"* |
| `HUMAN-P0-07` | Las dos familias de criterios se conservan **y la pauta de la cátedra manda cuando existe** | **Ratifica y jerarquiza** | Peso relativo; qué pasa si la pauta contradice las familias |
| `HUMAN-P0-08` | Cuatro ejes —preparación, desempeño, estrategia, contexto—, **sin cantidad fija** de ajustes, y **se registra también lo que funcionó** | **Ratifica y agrega** — el *"exactamente dos cambios"* era ejemplo, no regla | El **momento**: antes o después de la nota |

> ⚠️ **Procedencia.** La hoja es la respuesta escrita **previa** a la reunión de cierre que el propio
> cuestionario anunciaba. Alcanza para cerrar lo marcado; los residuos de arriba son, en buena parte,
> el temario de esa conversación. Si algo de ahí contradice esta lectura, **se supersede
> [ADR-025](decisions.md#adr-025)**, no se lo edita.

## Cómo usar esto en la práctica

1. Ninguna de estas 51 filas te frena para seguir generando pantallas del low-fi con el spec consolidado — ya están resueltas ahí como fixture o estado neutral.
2. Antes de mover cualquier pantalla a high-fidelity, revisá si toca una fila con gate `H` (hoy quedan **dos**: C01-008 y C01-019; `C01-051` fue respondida el 1 sep 2026 por [ADR-026](decisions.md#adr-026), con su residuo pedagógico declarado) y conseguí la respuesta real primero.
3. **Las 8 `HUMAN-P0` ya tienen la voz de la psicopedagoga real** (31 ago 2026). Podés construir contra el criterio confirmado `v1.0`, citándolo. **Lo que no podés** es cerrar sus residuos: ésos siguen necesitando a la misma persona, y aproximarlos es exactamente lo que este anexo existe para impedir.
4. Todo lo demás (gate `I`) sí lo podés ir resolviendo con el equipo técnico a medida que avanzás.


## Decisión agregada — diseño del pipeline del Academic Decision Engine

> **Nota de procedencia.** Esta sección existía únicamente en la copia en texto plano del archivo
> original, que duplicaba todo el contenido. Al deduplicar el documento se portó acá sin cambios de
> contenido. Ver [ADR-013](decisions.md#adr-013).

Esta fila no viene del registro C01 original — es una decisión de arquitectura identificada el 28 de
agosto de 2026 a partir de un análisis externo sobre cómo automatizar C01-006 (Academic Decision
Engine). Se agrega acá porque cae exactamente en el mismo tipo de vacío que las 51 filas de arriba:
hoy no hay spec de cómo se genera la `ActionRecommendation`, solo se asume que "el Engine ya la
emitió".

| Campo | Contenido |
|---|---|
| **Relacionada con** | `C01-006` (ADE), `C01-021` (Risk Engine), `C01-022` (Risk–Intervention–Outcome) |
| **Qué falta decidir** | El pipeline concreto para generar `ActionRecommendation`: qué contexto estructurado recibe un LLM, qué schema devuelve, y qué validador determinista corre antes de publicar o mandar a revisión humana |
| **Propuesta en evaluación (no confirmada)** | Contexto académico verificado → paso actual del protocolo → reglas de elegibilidad/prioridad → LLM genera `ActionRecommendation` estructurada (JSON con `objective`, `verb`, `scope`, `conditions`, `estimated_minutes`, `resource_id`, `expected_evidence`, `completion_criterion`, `reason`, `confidence`, `requires_human_review`) → validador determinista (el recurso existe, el tema pertenece al examen, la duración entra en la disponibilidad, no duplica acción, no afirma dominio/progreso/readiness inexistente) → publicación automática o revisión humana según confianza |
| **Por qué no se hardcodea todavía** | Es una propuesta externa, no una decisión de producto tomada. Toca directamente el mismo vacío que `C01-006`/`021`/`022`, que siguen `OPEN` |
| **Gate material** | `H` — antes de mover a high-fidelity cualquier pantalla que dependa de una recomendación real (no fixture) |
| **Estado** | `OPEN — PROPUESTA EN EVALUACIÓN, NO CONFIRMADA` |

**Seguimiento en este repositorio:** [ADR-004](decisions.md#adr-004).

---

> **Nota de mantenimiento.** El archivo original contenía todo su contenido **dos veces**: una
> versión markdown formateada y una copia pegada en texto plano. Las dos no eran idénticas — solo la
> copia plana incluía la decisión agregada del pipeline del ADE. Se deduplicó conservando la versión
> markdown y portando esa sección. Ninguna de las 51 filas cambió de estado. Ver
> [ADR-013](decisions.md#adr-013).
