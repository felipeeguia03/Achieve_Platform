# ACHIEVE — ANEXO: DECISIONES DE NEGOCIO PENDIENTES

**Documento:** `ACHIEVE_PENDING_DECISIONS_ANNEX_v1.0.md`
**Consolidado:** 28 de agosto de 2026
**Relación con el spec:** este anexo es deliberadamente independiente de `ACHIEVE_MASTER_PRODUCT_SPEC_v1.0.md`. El spec te sirve para generar pantallas; este anexo te sirve para saber qué todavía **no está decidido** y por lo tanto ningún builder debería inventar.

## Qué es esto y qué no es

Son 51 decisiones de negocio/producto sin resolver (registro C01) más 8 decisiones psicopedagógicas específicas que forman parte de esas 51 (`HUMAN-P0-01…08`, dentro de C01-031…038). Ninguna bloquea generar el prototipo low-fi: para eso alcanza con fixtures y estados sintéticos, que es justamente lo que ya cubre el spec consolidado. Bloquean, en cambio, cualquier paso hacia high-fidelity, implementación real o piloto — ahí estas 51 filas dejan de poder resolverse con un fixture y necesitan una respuesta real de un owner.

**Severidad:**
- `P1` — tiene fallback reversible hoy (fixture/omisión/estado neutral), pero debe cerrarse antes de su gate material.
- `P2` — diferido, fuera del alcance del MVP.

**Gate material** (a partir de qué etapa deja de poder posponerse):
`I` = antes de implementación productiva · `H` = antes de high-fidelity · `P` = antes de piloto institucional · `O` = fuera del MVP, no bloquea nada del corte actual.

Las 51 filas están `OPEN`. Ninguna reclasificación ni uso en el low-fi las cierra — cerrarlas requiere una respuesta real de su owner, documentada, no una inferencia.

## Tabla maestra — 51 decisiones pendientes (C01)

| ID | Título y alcance | Owner de decisión; consumidores; dependencias | Estado / conflicto | Sev. | Gate material |
|---|---|---|---|---|---|
| C01-001 | Identidad, tenancy y esquema base de Academic Data Layer | Product Data; todas las vistas/Engines; institución, C01-002 | OPEN; `platformStudentId` UUID definido para integración, tenancy/schema integral pendiente | P1 | I |
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
| C01-013 | Criterios, validación y señales de Evidence | Evidence System/Product; Progress/Protocol/ADE; C01-008/012 | OPEN; selectividad resuelta por CR, semántica técnica abierta | P1 | I |
| C01-014 | Relaciones, agregación y tardanza de Evidence | Evidence System; Commitment/Progress/Protocol; C01-007/010/012/027 | OPEN | P1 | I |
| C01-015 | Idempotencia y normalización Web/WhatsApp de Evidence | Evidence Integration; UX05/auditoría; C01-012/014/023 | OPEN | P1 | I |
| C01-016 | Instancia técnica de revisión R1 | Validation/Security; Evidence/R1; C01-013/030 | OPEN; R1 autorizada, R3 fallback, assignment técnico pendiente | P1 | I |
| C01-017 | Privacidad y retención de Evidence/Reflection | Product Privacy; estudiante/R1/institución; C01-001/030/051 | OPEN | P1 | I |
| C01-018 | `ProgressUpdated`: payload, causalidad y no-cambio | Progress owner; UX06/08/09/ADE/Risk; C01-013/014/023 | OPEN | P1 | I |
| C01-019 | TopicProgress y resumen de materia | Product Progress; Hoy/Materia/Bitácora/Risk; C01-003/018 | OPEN; semántica técnica pendiente | P1 | H |
| C01-020 | ProgressEntry / Bitácora bundle | Progress/Event owner; Bitácora/Materia; C01-018/019/023 | OPEN; read model/materialización no decididos | P1 | I |
| C01-021 | Risk Engine v1 y sujeto de RiskSignal | Risk owner; TodayView/CRM/ADE; C01-001/002/019/023 | OPEN | P1 | I |
| C01-022 | Closed-loop Risk–Intervention–Outcome | Product Operations; CRM/Risk/institución; C01-021/039/044 | OPEN; core sin contrato completo | P1 | I |
| C01-023 | Product Event Model | Product Event owner; analytics/servicios; C01-001 | OPEN; artifact ausente | P1 | I |
| C01-024 | Recomendación/activación temporal de Modo Examen | Product/ADE; UX01/02/07; C01-005/006/023 | OPEN; default configurable | P1 | I |
| C01-025 | ExamPreparation: ownership y lifecycle | ExamPreparation owner; UX07–09; C01-005/023/024 | OPEN | P1 | I |
| C01-026 | ExamProtocol instance y estado por paso | Exam Protocol owner; UX08/09/Evidence/ADE; C01-025 | OPEN | P1 | I |
| C01-027 | Contenido/Resource versionado de ProtocolStep | Exam Protocol content owner; UX09/Evidence; C01-002/026/031–038/051 | OPEN; defaults sustituibles | P1 | I |
| C01-028 | Completion, gates y `ProtocolStepCompleted` | Exam Protocol/Evidence; UX08/09/Progress; C01-013/014/016/023/026/027 | OPEN | P1 | I |
| C01-029 | Readiness scoped de ExamPreparation | Product; UX08/ADE/Risk; C01-025–028/031–038 | OPEN; `C01-CF-02` contradicción real | P1 | I |
| C01-030 | Autorización, permisos y privacidad institucional | Product Security/Privacy; todas las superficies/CRM; C01-001/002/017/039 | OPEN; diseño JWT/backend/RLS recibido, política y aceptación técnica pendientes | P1 | I |
| C01-031 | `HUMAN-P0-01`: baseline granular de 20 IDs | Psicopedagoga real; Protocol content; provenance humana | OPEN; default configurable | P1 | I |
| C01-032 | `HUMAN-P0-02`: dimensiones y proyección breve | Psicopedagoga real; Evidence/Progress/Protocol | OPEN; default configurable | P1 | I |
| C01-033 | `HUMAN-P0-03`: recuperación y apoyos producidos | Psicopedagoga real; Protocol/ADE/Evidence | OPEN; default configurable | P1 | I |
| C01-034 | `HUMAN-P0-04`: núcleo H24 adaptable | Psicopedagoga real; Protocol/readiness scoped | OPEN; default configurable | P1 | I |
| C01-035 | `HUMAN-P0-05`: señal de aprendizaje | Psicopedagoga real; Evidence signals/Progress | OPEN; potentially answered, source confirmation required | P1 | I |
| C01-036 | `HUMAN-P0-06`: aplicabilidad de revisión humana | Psicopedagoga real; Protocol/Validation | OPEN; no reabre R1/R3 | P1 | I |
| C01-037 | `HUMAN-P0-07`: criterios práctico/teórico escrito | Psicopedagoga real; Protocol content/completion | OPEN; default configurable | P1 | I |
| C01-038 | `HUMAN-P0-08`: postmortem | Psicopedagoga real; Protocol post-exam | OPEN; asunción visible | P1 | I |
| C01-039 | CRM–Plataforma, incl. `human_assignment` | CRM/Operations; Plataforma/Hoy/Compromiso/Risk; C01-001/021/022/030 | OPEN; autorización v1 documentada, actividad/contexto/assignment pendientes | P1 | I |
| C01-040 | Webhooks, sincronización y reconciliación | Integration/Security; CRM/Evidence/Event Model; C01-015/023/030/039 | OPEN; retry de autorización v1 definido, webhooks/reconciliación futuros sin contrato | P1 | I |
| C01-041 | Architecture/API/Data/Integration Spec | CTO/Architecture; equipos; depende de contratos funcionales | OPEN; artefacto parcial recibido, falta aceptación y contratos productivos completos | P1 | I |
| C01-042 | Golden dataset, adquisición y legalidad | Product Data; ADL/Risk/ADE; C01-001/002/030 | OPEN; selección institucional pendiente | P1 | P |
| C01-043 | Student Model / Personal Engine | Product; ADE/Risk/Intervention; C01-001/002/023 | OPEN; mencionado, no especificado | P1 | I |
| C01-044 | Playbooks, SLA y Human QA del piloto | Product Operations; Intervention/CRM; C01-022/039/046 | OPEN; no se inventan valores | P1 | P |
| C01-045 | Corrigendum de promoción y precedencia | Product Owner/Document Control; auditores/equipos | OPEN; divergencia administrativa | P1 | antes de promoción/handoff formal |
| C01-046 | Métricas y visibilidad institucional del piloto | Product Measurement/Privacy; institución/QA; C01-023/030/042 | OPEN | P1 | P |
| C01-047 | Modalidad oral y otras familias | Product Owner examen; Exam Protocol | OPEN — DEFERRED | P2 | O |
| C01-048 | Integraciones profundas Calendar/LMS/SIS | Product Architecture; institución/estudiante | OPEN — DEFERRED | P2 | O |
| C01-049 | Hardening de escala y automatización avanzada | Product Architecture/Data; escala | OPEN — DEFERRED | P2 | O |
| C01-050 | `academic_context_blocker` | ADL posee contexto; ADE disponibilidad/prioridad; Materia/TodayView; C01-001/002/006 | OPEN; SCP antes omitido, no alias semántico | P1 | I |
| C01-051 | Configuración y obligatoriedad funcional de Reflection | Product/Evidence configuration; Evidence/Protocol/Bitácora; C01-008/012/017/027 | OPEN; SCP antes omitido, distinto de privacidad | P1 | H |


## Detalle — las 8 decisiones psicopedagógicas (`HUMAN-P0-01…08`)

Estas ocho son un subconjunto de C01-031…038: no son técnicas, son de criterio profesional (una psicopedagoga real tiene que confirmarlas). Hoy cada una corre con un **default provisional** razonado pero no confirmado. Resumen — para el detalle completo con fundamento, riesgos y fallback ver `ACHIEVE_EP01_PROVISIONAL_HUMAN_DEFAULTS_v0.1.md` dentro del paquete C01.

| ID | Qué decide | Default provisional en uso | Qué falta confirmar |
|---|---|---|---|
| `HUMAN-P0-01` | Contenido base de los 20 pasos del protocolo de examen | Usar la matriz `PE-PSY-01…20` completa como baseline, con granularidad y trazabilidad por paso — no como bloque indivisible | Obligatoriedad, dependencias, repetición y variantes H24 de cada uno de los 20 pasos, uno por uno |
| `HUMAN-P0-02` | Cómo se resume el seguimiento del aprendizaje | Modelo híbrido: escala breve para lectura rápida + dimensiones separadas (contacto, recuperación, aplicación, corrección, confianza) cuando hay desempeño observable | Si la escala breve es aceptable como lectura secundaria reversible, o si debe eliminarse y dejar solo dimensiones separadas |
| `HUMAN-P0-03` | Si producir un apoyo (mapa, ficha, resumen) cuenta como aprendizaje | No — la recuperación activa sin ayuda es el resultado central; producir un apoyo es opcional/contextual | Excepciones por disciplina, nivel previo o modalidad donde construir la representación sí sea parte de la tarea evaluada |
| `HUMAN-P0-04` | Qué hacer cuando quedan menos de 24hs para el examen | Priorizar logística + una única actividad cognitiva de mayor retorno + proteger descanso, no un checklist fijo | Composición exacta del núcleo adaptable; qué es indelegable vs. omitible |
| `HUMAN-P0-05` | Qué cuenta como señal real de aprendizaje | Solo desempeño observable bajo condiciones y criterios claros; fotos/checklists/mapas no alcanzan | Alcance exacto de "producciones admisibles" por disciplina |
| `HUMAN-P0-06` | Cuándo se necesita revisión humana vs. corrección automática | Pauta objetiva cuando existe; persona real ante respuesta abierta, ambigua o de alto impacto | Definición operativa de "alto impacto"; qué producciones admiten autoevaluación |
| `HUMAN-P0-07` | Criterios de corrección para práctico y teórico escrito | Familias generales (procedimiento/resultado para práctico; precisión/relación conceptual/aplicación para teórico), pauta de la materia tiene precedencia | Peso relativo de cada criterio; mínimos por disciplina |
| `HUMAN-P0-08` | Qué es el análisis posterior al examen | Revisión narrativa breve y no culpabilizante; sin número fijo de ajustes obligatorios | Momento exacto (antes/después de la nota); contenido mínimo obligatorio |

## Cómo usar esto en la práctica

1. Ninguna de estas 51 filas te frena para seguir generando pantallas del low-fi con el spec consolidado — ya están resueltas ahí como fixture o estado neutral.
2. Antes de mover cualquier pantalla a high-fidelity, revisá si toca una fila con gate `H` (hoy: C01-008, C01-019, C01-051) y conseguí la respuesta real primero.
3. Las 8 `HUMAN-P0` no las podés cerrar vos ni un builder de IA — necesitan la voz de la psicopedagoga real. Todo lo demás (gate `I`) sí lo podés ir resolviendo con el equipo técnico a medida que avanzás.


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
