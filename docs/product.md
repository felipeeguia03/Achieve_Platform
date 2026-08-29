# Achieve — Producto: glosario, roles, estados y scope

**Documento:** `docs/product.md`
**Rol:** owner canónico del vocabulario, los roles, las máquinas de estado observables y el alcance.
**Deriva de:** `docs/product-spec-source.md` (Partes I, II, IV, VI, IX).
**Última actualización:** 28 de agosto de 2026

> **Regla de precedencia.** Si este documento entra en conflicto con `product-spec-source.md`, gana
> el spec fuente y este documento es el defectuoso. Si entra en conflicto con el código, gana este
> documento y el código es el defectuoso.

---

## 1. Qué es Achieve

Achieve es un **acompañante académico para estudiantes universitarios**: cada día le dice al
estudiante qué acción concreta hacer para no perder el ritmo de sus materias, con una persona real
como supervisor y fallback — no como motor permanente.

**Regla funcional (Parte I §1.2).** En cualquier momento del semestre, un alumno debería poder entrar
a Achieve y entender **en menos de 10 segundos**: dónde está, qué tiene que hacer ahora, qué tiene
que entregar para demostrar que avanzó, y qué va a pasar después.

**Contrato de doble valor.** Achieve es B2B2C: la institución es el cliente, pero la adopción depende
de que el alumno reciba valor real. El producto no puede optimizar solo para dashboards
institucionales ni solo para conveniencia del estudiante.

| Actor | Valor principal |
|---|---|
| Estudiante | Reducir incertidumbre, tener un plan, saber qué hacer, sentirse acompañado, ver progreso y llegar mejor preparado |
| Universidad | Detectar desvíos antes de una mala nota o un abandono, intervenir con criterio, mejorar adherencia y disponer de datos de proceso |
| Achieve | Conectar información académica + decisión + comportamiento + evidencia + intervención humana en un mismo sistema |

**Límite arquitectónico (Parte I §4.0).** Achieve es una **Academic Execution Layer**: una capa de
ejecución complementaria a LMS, SIS, campus y calendarios existentes. No los reemplaza.

---

## 2. Los ocho principios que gobiernan el código

De los principios del spec (Parte I §3), estos ocho son los que un desarrollador viola sin darse
cuenta. Están ordenados por frecuencia con la que aparecen como invariante en el spec.

1. **Hacer no equivale a aprender.** Ejecución, producción y dominio son tres cosas distintas.
   Ninguna implica la siguiente.
2. **Percepción no equivale a dominio.** La confianza declarada por el estudiante y el dominio
   demostrado por evidencia son señales separadas. Cuando divergen (*Perception–Evidence Gap*), la
   evidencia pesa más para decidir, pero la confianza no se borra ni se corrige.
3. **La realidad académica es versionada y probabilística.** Cada dato tiene fuente, vigencia y
   confianza. **Achieve no presenta inferencias como hechos.**
4. **No Cortar sin maquillar el incumplimiento.** Rescatar el día no borra el compromiso original.
5. **Próxima acción antes que dashboard decorativo.** Toda representación debe ayudar a entender,
   decidir o ejecutar. No se construyen métricas visuales sin consecuencia.
6. **Sin datos no es cero.** "No evaluado", "desconocido", "pendiente" y "temporalmente no
   disponible" son cuatro estados distintos, y ninguno es `0`.
7. **La UI proyecta, no decide.** Ninguna superficie rankea, prioriza ni genera una Action. Eso es
   del Academic Decision Engine.
8. **Autonomía creciente.** El sistema reduce el scaffolding a medida que el estudiante demuestra
   criterio. La calidad no se mide por cuánto decide Achieve por el alumno, sino por cuánto logra que
   el alumno internalice mejores decisiones.

---

## 3. Glosario canónico

Este vocabulario es **normativo**. Un concepto = una palabra, en la navegación, en los breadcrumbs,
en los títulos, en el copy y en el código (regla `C-02` del manual de diseño; el anti-patrón `A-04`
es exactamente la deriva de vocabulario).

### 3.1 Motores y capas

| Término | Definición | Pregunta que responde |
|---|---|---|
| **Academic Data Layer (ADL)** | Capa compartida de conocimiento académico estructurado, versionado y con procedencia | ¿Qué sabemos de esta realidad universitaria? |
| **Mapa Académico** | Instancia viva de la realidad académica de un estudiante concreto | ¿Qué está pasando con este estudiante? |
| **Academic Decision Engine (ADE)** | Sistema que recomienda y prioriza la próxima acción | ¿Qué conviene hacer ahora? |
| **Academic Risk Engine** | Sistema que detecta desvío y necesidad de intervención | ¿Dónde se está desviando? |
| **Student Model / Personal Engine** | Modelo personal de aprendizaje, conducta, motivación y autonomía | ¿Cómo aprende y ejecuta esta persona? |
| **Evidence System** | Sistema que comprueba ejecución, producción y dominio | ¿Qué ocurrió realmente? |
| **Human Accountability** | Sistema humano de compromiso, exigencia, rescate y reconocimiento | ¿Cómo conseguimos que ocurra? |
| **Intervention Engine / CRM** | Lógica que prioriza cuándo una intervención humana aporta más valor | ¿Quién necesita humano y con qué contexto? |
| **Exam Protocol** | Estructura configurable de hitos de preparación por modalidad y versión | ¿Qué condiciones hay que atravesar antes de rendir? |

> **Separación crítica.** El **ADE** decide *qué trabajo académico concreto* conviene hacer. El
> **Exam Protocol** define *qué hitos de preparación* deben ocurrir. Nunca se duplican: el protocolo
> define el hito, el Engine define el trabajo dentro de ese hito. Un `ProtocolStep` **no** crea una
> `Action`.

### 3.2 Entidades académicas

| Término | Definición |
|---|---|
| **Institution** | Universidad o facultad cliente |
| **AcademicProgram** | Carrera |
| **CurriculumPlan** | Plan de estudios versionado |
| **Course** | Materia abstracta dentro de un plan |
| **CourseOffering** | Dictado concreto de un `Course` en un período y cátedra. Aporta comisión e instructor |
| **ClassSession** | Clase prevista o real, con fecha y temas. **Unidad temporal del ritmo de cátedra** |
| **Topic** | Unidad o tema académico. Puede tener padre y prerequisitos |
| **Resource** | Material vinculado a materia o tema, con `source` y `rights_status` |
| **Assessment** | Evaluación concreta: parcial, final, TP o entrega. **Entidad técnica canónica para "evaluación"** |

### 3.3 Entidades del estudiante

| Término | Definición |
|---|---|
| **Student** | Usuario estudiante |
| **CourseEnrollment** | Instancia personal de una materia. **Contexto persistente de Cursado** |
| **TopicProgress** | Estado personal por tema, en cinco dimensiones separadas |
| **Availability** | Restricciones y ventanas horarias útiles del estudiante |
| **AcademicGoal** | Objetivo de semestre, materia o examen |

### 3.4 Entidades de ejecución — el loop diario

| Término | Definición | Lo que **no** es |
|---|---|---|
| **ActionRecommendation** | Propuesta emitida por el ADE, con razón y prioridad | No es una `Action` aceptada |
| **Action** | Unidad ejecutable de trabajo: verbo + alcance + objetivo | No es un compromiso |
| **Commitment** | Acuerdo conductual: qué, cuándo, cuánto tiempo, qué evidencia | No es ejecución ni producción |
| **Evidence** | Presentación canónica de la producción acordada | No es suficiencia, validación ni dominio |
| **Reflection** | Feedback breve y contextual del alumno. **Objeto separado de Evidence** | No es un diario ni un diagnóstico |
| **ProgressEntry** | Bundle derivado de eventos que reconstruye la Bitácora | No es una entidad de verdad paralela |

### 3.5 Entidades de preparación de examen

| Término | Definición |
|---|---|
| **ExamPreparation** | Instancia personal de preparación para un `Assessment` concreto |
| **ExamProtocol** | Plantilla versionada de hitos, por modalidad |
| **ProtocolStep** | Hito configurado dentro de una versión de `ExamProtocol` |
| **ProtocolArtifact** | Entregable que cierra un paso |
| **Diagnostic** | Baseline inicial de preparación |
| **ErrorMap** | Brechas detectadas por práctica o simulación |
| **Simulation** | Práctica comparable al examen real |
| **PreparationReadiness** | Estado operativo de preparación según protocolo. **Ver [ADR-011](decisions.md#adr-011): su owner canónico está en disputa** |

### 3.6 Riesgo e intervención

| Término | Definición |
|---|---|
| **RiskSignal** | Señal explicable de desvío, con causa, severidad y vigencia |
| **Intervention** | Acción de soporte humano con dueño, playbook y SLA |
| **InterventionOutcome** | Resultado registrado: recuperado, replanificado, sin respuesta, escalado, falso positivo |
| **Playbook** | Metodología versionada de respuesta a un disparador |
| **Operator** | Acompañante humano. **Ver [ADR-003](decisions.md#adr-003): converge con `coaches` de Dashboard_Achieve** |
| **human_assignment** | Referencia operacional de CRM/Operations con owner, vigencia, finalidad y visibilidad. **No es Intervention, ni reviewer, ni cola, ni promesa de SLA** |

### 3.7 Conceptos transversales

| Término | Definición |
|---|---|
| **Desvío académico** | Diferencia relevante entre dónde debería estar el estudiante y dónde está |
| **Perception–Evidence Gap** | Brecha entre la confianza declarada y el dominio demostrado |
| **No Cortar** | Rescate mínimo que evita el cero sin borrar el incumplimiento original |
| **Golden Path** | Recorrido pequeño pero completo que representa la promesa real de Achieve |
| **Golden Dataset** | Datos académicos de una carrera suficientemente completos para demostrar la experiencia objetivo |
| **Scaffolding decreciente** | Reducción progresiva de conducción a medida que el estudiante demuestra autonomía |
| **TodayView** | **Proyección efímera de lectura.** Sin tabla propia, sin lifecycle, sin identidad persistida |
| **academic_context_blocker** | Bloqueo por falta de contexto académico. **Semánticamente distinto de una ausencia `NONE` del ADE** |

---

## 4. Roles y visibilidad

| Rol | Quién es | Alcance |
|---|---|---|
| **Estudiante** | Usuario final del loop diario | Su propio mapa, acciones, compromisos, evidencias, reflexiones y bitácora |
| **Operador** | Acompañante humano que interviene cuando puede cambiar el resultado. **Usuario P0** | Cola priorizada, contexto de sus estudiantes asignados, registro de intervención y outcome |
| **Reviewer (R1)** | Quien aplica el criterio a una `Evidence` que requiere revisión humana | El contenido necesario para aplicar el criterio, según assignment |
| **Institución** | Cliente B2B | **Agregado por defecto.** Caso individual solo si está autorizado y es necesario para intervenir |

### 4.1 Matriz de visibilidad (Parte II §17)

| Dato | Estudiante | Operador | Institución |
|---|---|---|---|
| Mapa personal | Sí | Sí, asignados | Agregado por defecto |
| Compromisos | Sí | Sí | Agregado por defecto |
| Evidencias | Sí | Según rol | **No por defecto** |
| Reflexiones personales | Sí | Según necesidad | **No por defecto** |
| RiskSignal | Explicación útil | Completo operativo | Agregado; individual solo autorizado y accionable |
| Intervenciones | Propias relevantes | Completo | Métricas, estado y outcome; detalle solo autorizado |
| Bitácora | Sí | Sí | **No por defecto**; resumen agregado |

> **Regla (Parte II §17).** No asumir que porque la universidad paga puede ver toda la información
> individual del estudiante. La institución **no** recibe chats, reflexiones íntimas ni evidencia
> cruda por defecto.

Todo esto queda gateado por [ADR-006](decisions.md#adr-006) antes de tocar datos reales.

---

## 5. Máquinas de estado

Estas son las máquinas canónicas. Su implementación en schema está en
[`data-model.md`](data-model.md).

### 5.1 Action

```
RECOMMENDED → ACCEPTED → COMMITTED → IN_PROGRESS → EVIDENCE_PENDING → COMPLETED
                                                 ↘ BLOCKED
                                                 ↘ CANCELLED / REPLACED
```

**Invariantes:**
- Aceptar una Action **no** crea un Commitment.
- El frontend nunca marca `ACCEPTED`: espera confirmación del owner.
- `BLOCKED`, `CANCELLED` y `REPLACED` los declara el owner; la UI los consume.

### 5.2 Commitment

```
DRAFT → CONFIRMED → DUE → STARTED → COMPLETED
          ↓   ↓
          ↓   └→ RENEGOTIATED → (nuevo Commitment CONFIRMED, misma Action)
          └────→ MISSED → [resolución] / CLOSED
```

**Invariantes:**
- **Un `MISSED` no puede editarse retroactivamente hasta parecer cumplido.** Es la regla más fuerte
  del lifecycle.
- Renegociar **antes** del vencimiento es válido; editar después para ocultar el incumplimiento no.
- Renegociar preserva el original como `RENEGOTIATED` y **crea un Commitment nuevo** para la misma
  Action. No sobrescribe.
- `DRAFT` es **no autoritativo**: no aparece en Hoy, Materia ni CRM, y no cambia la Action.
- La UI **no** declara `MISSED` ni `DUE` por el paso del tiempo. Lo hace el owner del lifecycle.
- `RESCUE_REQUIRED` y `RESCUE_MATERIALIZED` son **condiciones derivadas de la proyección**, no
  estados persistidos: la primera indica que no existe rescate concreto, la segunda que sí existe una
  Action o Commitment de rescate vinculada.

### 5.3 Evidence

```
EXPECTED → SUBMITTED ─┬→ UNDER_REVIEW ─┬→ SUFFICIENT → VALIDATED
                      │                └→ INSUFFICIENT → RESUBMISSION_REQUESTED → (nueva Evidence)
                      └→ SUFFICIENT / INSUFFICIENT      (cuando el método no requiere cola de revisión)
```

**Invariantes — la cadena de no-implicación:**

> **Preparar contenido no es enviarlo. Enviar no es demostrar suficiencia. Suficiencia no es
> validación. Validación no es dominio.**

- `SUBMITTED` significa que el owner recibió algo. Nada más.
- `UNDER_REVIEW` **exige una revisión real creada**. Un método humano *configurado* no alcanza: sin
  instancia real, la Evidence permanece `SUBMITTED`.
- `VALIDATED` **no** implica `ProgressUpdated` ni completa un `ProtocolStep`.
- `RESUBMISSION_REQUESTED` **conserva todas las Evidence anteriores**. Nunca sobrescribe.
- Una Action puede tener varias Evidence (1:N). Cada una conserva identidad y `action_id`.
- Evidence tardía conserva su `submitted_at` y **no** cambia un Commitment `MISSED`.

### 5.4 ExamPreparation

```
RECOMMENDED → ACTIVE → BUILDING → READY_BY_PROTOCOL → EXAM_TAKEN → CLOSED
                    ↘ NOT_READY / BLOCKED
                    ↘ ABANDONED (conserva historial)
```

**Invariantes:**
- Activar produce `ACTIVE` y **nada más**: no crea Action, Commitment, Evidence, Progress, protocolo
  completo ni readiness.
- `READY_BY_PROTOCOL` significa que se cumplieron las condiciones del protocolo vigente.
  **No predice ni garantiza aprobación.** Nunca se dice "listo para rendir".
- Volver a Cursado, al Overview o a Hoy **no** abandona la preparación.
- Ver [ADR-011](decisions.md#adr-011) sobre la contradicción entre este `status` y la entidad
  `PreparationReadiness`.

### 5.5 RiskSignal

```
OPEN → ACKNOWLEDGED → INTERVENTION_REQUIRED → RESOLVED
                                            ↘ ESCALATED
```

Una señal puede expirar si deja de ser relevante; se guarda la causa histórica.

**Closed-loop obligatorio (Parte I §8.6):** toda señal relevante tiene causa → owner → playbook →
SLA → intervención → outcome. *El dashboard no es el final del Risk Engine.*

### 5.6 ProtocolStep

**No existe un enum de estado por paso congelado.** Solo hay un hecho factual de completion, emitido
por el owner del protocolo (`ProtocolStepCompleted` o una lectura autoritativa equivalente).

**No completan un paso:** abrirlo, volver a abrirlo, leer el objetivo, abrir un recurso, declarar
confianza, aceptar una recomendación, crear o cumplir un Commitment, iniciar o completar una Action,
subir Evidence, ni ninguno de los estados `SUBMITTED`, `UNDER_REVIEW`, `SUFFICIENT`, `VALIDATED`,
`ProgressUpdated`, recibir feedback, pasar tiempo o alcanzar una fecha.

---

## 6. Las cinco dimensiones de progreso

**No existe un único porcentaje universal de "materia aprendida".** La UI puede sintetizar; el modelo
**nunca** colapsa las dimensiones.

| Dimensión | Pregunta | Fuente típica |
|---|---|---|
| **Recorrido** (*exposure*) | ¿Tuvo contacto relevante con el contenido? | Clase, lectura, video, recurso |
| **Práctica** (*practice*) | ¿Produjo trabajo relevante? | Ejercicios, resumen, explicación, código |
| **Dominio** (*domain*) | ¿Puede aplicar o recuperar sin apoyo completo? | Prueba sin red, simulacro |
| **Confianza** (*confidence*) | ¿Cuánto cree dominarlo? | Autorreporte contextual, con fecha |
| **Recencia** (*recency*) | ¿Hace cuánto no lo trabaja? | Eventos de progreso |

**Reglas de representación:**

- Prohibido etiquetar `% aprendido`.
- Prohibido promediar las cinco dimensiones.
- Prohibido convertir Confianza en Dominio.
- "Dominio: no evaluado" ≠ "Dominio: bajo" ≠ "Dominio: no disponible".
- Una dimensión solo se muestra como **cambiada** con un `ProgressUpdated` o lectura autoritativa
  equivalente. El lifecycle de Evidence, una Reflection o el registro de actividad **nunca** son
  disparadores alternativos.
- Los tres estados que no deben colapsarse:

| Estado | Copy canónico |
|---|---|
| Resultado pendiente | *"Todavía no hay un cambio de progreso confirmado."* |
| No-cambio confirmado | *"Esta actividad quedó registrada, pero no cambió las dimensiones de progreso."* |
| Dato no disponible | *"No pudimos cargar el progreso. Tu evidencia conserva su estado."* |

---

## 7. Provenance — la procedencia es parte del dato

Todo dato académico que pueda cambiar o discutirse conserva:

| Campo | Descripción |
|---|---|
| `value` | El dato estructurado |
| `source_type` | `institution` / `instructor` / `student` / `community` / `public_web` / `inference` |
| `source_ref` | Documento, URL, mensaje, archivo o entidad de origen |
| `observed_at` | Cuándo se capturó |
| `valid_from` / `valid_until` | Vigencia conocida |
| `term` / `offering` | Período y cátedra a la que aplica |
| `confidence` | Confianza operativa. **No es la confianza del alumno** |
| `verification_status` | `unverified` / `corroborated` / `official` / `disputed` |
| `uploaded_by` | Actor o sistema que incorporó el dato |
| `rights_status` | `unknown` / `allowed` / `restricted` |

**Reglas de presentación:**

- `source_type`, el contexto de clase y `verification_status` son **tres datos distintos**. Un reporte
  del alumno registrado durante una clase **no** se convierte en voz de la cátedra.
- La UI **nunca eleva** un `verification_status`. Enviar una corrección no vuelve `official` a un
  reporte del estudiante.
- Los enums técnicos (`official`, `corroborated`, `unverified`, `disputed`) **nunca** aparecen como
  copy visible. Se traducen a labels humanos:

| Fuente + estado | Copy visible |
|---|---|
| institución/cátedra + `official` | *Cátedra · oficial* / *Institución · oficial* |
| cualquiera + `corroborated` | *{Fuente} · corroborado* |
| `student` + `unverified` | *Reportado por vos · sin verificar* |
| `inference` + `unverified` | *Estimado por Achieve · sin verificar* |
| cualquiera + `disputed` | *Dato en revisión · hay versiones distintas* |
| sin dato | *Fuente o estado de verificación no disponible* |

- La provenance va **junto al dato**, nunca solo en un tooltip, hover, tab o modal.
- Un rótulo grupal solo cubre varios campos si **todos** comparten exactamente el mismo `source_type`,
  `source_ref`, vigencia y `verification_status`, y el grupo enumera qué datos cubre.

---

## 8. Reglas provisionales — `HUMAN-P0`

> ⚠️ **Las ocho reglas de esta sección son defaults provisionales pendientes de confirmación
> profesional.** No son decisiones cerradas. Ningún agente de IA puede resolverlas ni cambiarlas:
> requieren la voz de una psicopedagoga real. Ver [ADR-007](decisions.md#adr-007).
>
> **Se sigue usando cada default tal como está documentado** hasta que se confirme lo contrario.
> Cuando un default afecta copy, criterio o comportamiento visible, la UI lo rotula internamente como
> asunción provisional.

| ID | Cláusula | Qué decide | Default provisional en uso | Qué falta confirmar |
|---|---|---|---|---|
| `HUMAN-P0-01` | `PROVISIONAL-HUMAN-P0-01 v0.1` | Contenido base de los 20 pasos del protocolo de examen | Usar la matriz `PE-PSY-01…20` completa como baseline, con granularidad y trazabilidad **por paso**, no como bloque indivisible | Obligatoriedad, dependencias, repetición y variantes H24 de cada uno de los 20 pasos, uno por uno |
| `HUMAN-P0-02` | `PROVISIONAL-HUMAN-P0-02 v0.1` | Cómo se resume el seguimiento del aprendizaje | Modelo híbrido: escala breve para lectura rápida **+ dimensiones separadas** (contacto, recuperación, aplicación, corrección, confianza) cuando hay desempeño observable | Si la escala breve es aceptable como lectura secundaria reversible, o si debe eliminarse |
| `HUMAN-P0-03` | `PROVISIONAL-HUMAN-P0-03 v0.1` | Si producir un apoyo (mapa, ficha, resumen) cuenta como aprendizaje | **No.** La recuperación activa sin ayuda es el resultado central; producir un apoyo es opcional y contextual | Excepciones por disciplina, nivel previo o modalidad donde construir la representación **sí** sea parte de la tarea evaluada |
| `HUMAN-P0-04` | `PROVISIONAL-HUMAN-P0-04 v0.1` | Qué hacer cuando quedan menos de 24 h para el examen | Priorizar logística + **una única** actividad cognitiva de mayor retorno + proteger descanso. **Jerarquía adaptable, no checklist fijo** | Composición exacta del núcleo adaptable; qué es indelegable vs. omitible |
| `HUMAN-P0-05` | `PROVISIONAL-HUMAN-P0-05 v0.1` | Qué cuenta como señal real de aprendizaje | Solo **desempeño observable** bajo condiciones y criterios claros. Fotos, checklists y mapas no alcanzan | Alcance exacto de "producciones admisibles" por disciplina. **Estado especial: `POTENTIALLY ANSWERED — REQUIRES SOURCE CONFIRMATION`** |
| `HUMAN-P0-06` | `PROVISIONAL-HUMAN-P0-06 v0.1` | Cuándo se necesita revisión humana vs. corrección automática | Pauta objetiva cuando existe; **persona real** ante respuesta abierta, ambigua o de alto impacto | Definición operativa de "alto impacto"; qué producciones admiten autoevaluación |
| `HUMAN-P0-07` | `PROVISIONAL-HUMAN-P0-07 v0.1` | Criterios de corrección para práctico y teórico escrito | Familias generales (procedimiento/resultado para práctico; precisión/relación conceptual/aplicación para teórico). **La pauta de la materia tiene precedencia** | Peso relativo de cada criterio; mínimos por disciplina |
| `HUMAN-P0-08` | `PROVISIONAL-HUMAN-P0-08 v0.1` | Qué es el análisis posterior al examen | Revisión narrativa **breve y no culpabilizante**, sin número fijo de ajustes obligatorios | Momento exacto (antes/después de la nota); contenido mínimo obligatorio |

### 8.1 Consecuencia arquitectónica

Los 12 pasos `EP-01`…`EP-12` documentados en el spec (Parte II §5) son una **arquitectura funcional
provisional**. La propia fuente prohíbe hardcodearlos. Por eso:

- `ExamProtocol` / `ProtocolVersion` / `ProtocolStep` son **configuración versionada**, no código.
- No se muestra "Paso 5 de 12" ni un porcentaje de protocolo.
- No se deriva el paso actual desde la posición en una lista.
- Cambiar la versión de un default **no reescribe historia**.

---

## 9. Otras reglas marcadas como provisionales o pendientes

Además de las ocho `HUMAN-P0`, estas reglas visibles del producto corren sobre un default no cerrado:

| Regla | Estado | Referencia |
|---|---|---|
| Activación de Modo Examen a los **14 días** | **Default UX documentado, no regla pedagógica rígida.** La UI **no calcula la ventana**: consume una señal ya emitida | `C01-024`, `SCP-01`/`SCP-02` |
| Umbrales de `BUILDING` → `READY_BY_PROTOCOL` | Criterios generales definidos; **umbrales exactos pendientes** de psicopedagogía | `C01-029`, [ADR-011](decisions.md#adr-011) |
| Obligatoriedad de `Reflection` | Configurable `OPTIONAL` / `REQUIRED` por Action o paso. **La configuración exacta no está cerrada** | `C01-051` (gate `H`) |
| Secuencia y criterio de cierre del Exam Protocol | Abiertos deliberadamente | `C01-027` |
| `TopicProgress` y resumen de materia | Semántica técnica pendiente | `C01-019` (gate `H`) |
| Contenido ejecutable de Action y Resource | Pendiente | `C01-008` (gate `H`) |

---

## 10. Las nueve superficies del estudiante

| ID | Wireframe | Nombre | Pregunta que responde |
|---|---|---|---|
| `UX01` | `WF-S01` | Hoy / Autogestión | ¿Qué necesito hacer **ahora**? |
| `UX02` | `WF-S02` | Materia / Cursado | ¿Cómo vengo en esta materia y qué hago? |
| `UX03` | `WF-S05` | Próxima Acción | ¿Qué significa esta acción y qué debo producir? |
| `UX04` | `WF-S06` | Compromiso | ¿Cuándo y bajo qué acuerdo real lo haré? |
| `UX05` | `WF-S07` | Evidencia | ¿Cómo presento la producción acordada? |
| `UX06` | `WF-S08` | Progreso / Bitácora | ¿Qué cambió realmente y qué sigue? |
| `UX07` | `WF-S09` | Activación de Modo Examen | ¿Qué examen activo y qué implica? |
| `UX08` | `WF-S10` | Modo Examen / Overview | ¿Dónde estoy en la preparación y qué atiendo? |
| `UX09` | `WF-S11` | Paso de Protocolo | ¿Qué exige este hito y cómo lo completo? |

**Mapeo canónico obligatorio:** `WF-S10 → UX08` y `WF-S11 → UX09`. **No existe `UX10`.**

### 10.1 Superficies de Operador e Institución

| ID | Nombre | Estado |
|---|---|---|
| `WF-O01` | Cola priorizada de intervención | No construida. Ver [ADR-012](decisions.md#adr-012) |
| `WF-O02` | Contexto de estudiante (<10 s) | No construida |
| `WF-O03` | Registrar intervención + outcome | No construida |
| `WF-O04` | Revisión de evidencia | No construida |
| `WF-I01` | Dashboard institucional mínimo | No construida |

### 10.2 Precedencia operativa del Hero (UX01)

La selección de qué ocupa el Hero separa dos responsabilidades:

- **Prioridad académica** → la decide el **ADE**: qué materia y qué trabajo tienen más valor ahora.
- **Precedencia operativa de lifecycle** → la decide **TodayView**: qué objeto **ya priorizado** o
  **ya iniciado** requiere una conducta inmediata.

```
1. Action IN_PROGRESS                          → "Continuar"
2. Action EVIDENCE_PENDING                     → "Subir evidencia"
3. Commitment CONFIRMED/DUE, o rescate         → "Ver compromiso" / "Empezar"
   materializado
4. RESCUE_REQUIRED sin rescate concreto        → "Retomar"
5. Commitment MISSED sin resolución            → "Retomar"
6. ACTION_RECOMMENDED (principal del ADE)      → "Comprometerme"
7. ACADEMIC_CONTEXT_INCOMPLETE que bloquea     → "Completar información"
8. Evidence informativa sin acción posterior   → "Ver evidencia" / "Ver avance"
9. NO_ACTION_AVAILABLE                         → "Ver materias"
```

> **La proyección no puede sustituir la recomendación principal por otra materia** debido a fecha de
> examen, riesgo, dificultad, brecha, antigüedad o starvation. Los estados de riesgo y de examen
> activo son **modificadores**, no reemplazantes: cambian el estado general y el contexto, no la CTA.

Esta función ya está implementada como `selectHeroLevel()` en
`components/screens/hoy-autogestion.tsx`.

### 10.3 Registro canónico de CTAs

`CTA-001`…`CTA-018`. El registro normativo completo, con condición de aparición, acción solicitada,
destino, resultado autoritativo, fallback y estado de error, vive en `product-spec-source.md`
Parte III §5.

| CTA | Condición | Resultado autoritativo |
|---|---|---|
| `CTA-001` | Course visible | Ninguno; navegación a UX02 |
| `CTA-002` | `ActionRecommendation` primaria vigente | Ninguno; navegación a UX03 |
| `CTA-003` | Action `RECOMMENDED` | `ActionAccepted`; Action → `ACCEPTED` |
| `CTA-004` | Action `ACCEPTED` + datos válidos | `CommitmentCreated`; Commitment → `CONFIRMED`; Action → `COMMITTED` |
| `CTA-005` | Commitment iniciable según owner | `CommitmentStarted`; Commitment → `STARTED`; Action → `IN_PROGRESS` |
| `CTA-006` | Cierre conductual permitido | Commitment → `COMPLETED`; Action normalmente → `EVIDENCE_PENDING` |
| `CTA-007` | Contenido válido + Reflection requerida válida | `EvidenceSubmitted`; Evidence → `SUBMITTED` |
| `CTA-008` | `RESUBMISSION_REQUESTED` | Nueva Evidence; **la original se preserva** |
| `CTA-009` | Progress/Bitácora disponible | Ninguno; lectura |
| `CTA-010` | Navegación disponible | Ninguno; **no abandona ExamPreparation** |
| `CTA-011` | Assessment elegible + confirmación explícita | `ExamPreparationActivated`; → `ACTIVE` |
| `CTA-012` | Paso actual autoritativo, sin gate | Ninguno; navegación a UX09 |
| `CTA-013` | Recomendación primaria real del ADE | Ninguno en origen; deriva a UX03 |
| `CTA-014` | Error recuperable con operación idempotente | **Solo el owner confirma el resultado.** No presumir éxito |
| `CTA-015` | Commitment `MISSED`/`RESCUE_REQUIRED` | Rescate creado; **original preservado** |
| `CTA-016` | Reflection configurada y visible | Reflection separada válida |
| `CTA-017` | Commitment `CONFIRMED`/`DUE` + elegibilidad vigente | Ninguno al abrir; original visible y **no editable** |
| `CTA-018` | Elegibilidad revalidada + propuesta válida | Original → `RENEGOTIATED`; nuevo Commitment `CONFIRMED`; `CommitmentRenegotiated` |

---

## 11. Product Event Model

Eventos aprobados. Los nombres son provisionales; lo obligatorio es preservar **actor, timestamp,
institución, objeto relacionado, causa/origen y outcome** cuando corresponda (`C01-023`, `OPEN`).

| Evento | Cuándo |
|---|---|
| `StudentRegistered` | Cuenta creada |
| `StudentActivated` | Mapa mínimo + primera acción + compromiso/evidencia esperada |
| `AcademicMapMinimumReached` | Hay información suficiente para conducir |
| `CourseViewed` | Materia abierta |
| `ActionRecommended` | El ADE emitió una recomendación |
| `ActionAccepted` | El alumno aceptó la Action |
| `CommitmentCreated` | Compromiso confirmado |
| `CommitmentStarted` | Inicio confirmado por el owner |
| `CommitmentRenegotiated` | Cambio responsable antes del vencimiento |
| `CommitmentMissed` | Incumplimiento confirmado por el owner |
| `EvidenceSubmitted` | Evidencia recibida. **Una vez por Evidence canónica** |
| `EvidenceValidated` | Evidencia validada |
| `ProgressUpdated` | Cambió `TopicProgress`/`CourseProgress`. **Único evento que habilita mostrar un cambio confirmado** |
| `ExamPreparationRecommended` | Modo Examen recomendado |
| `ExamPreparationActivated` | El alumno activó la preparación |
| `ProtocolStepCompleted` | Hito cerrado |
| `SimulationCompleted` | Simulación registrada |
| `RiskSignalCreated` | Señal generada |
| `InterventionStarted` / `InterventionResolved` | Intervención humana |
| `RescueSucceeded` | Retorno después de un incumplimiento |
| `AssessmentTaken` / `AssessmentOutcomeRecorded` | Rendida y resultado |

**Eventos que NO se inventan.** El spec es explícito: no existen `CommitmentDrafted`,
`CommitmentDue`, `CommitmentCompleted`, `CommitmentCancelled`, `CommitmentReminderSent`,
`EvidenceUploadStarted`, `EvidenceUploadFailed`, `EvidencePrepared`, `EvidenceUnderReview`,
`EvidenceSufficient`, `EvidenceInsufficient`, `EvidenceResubmissionRequested`, `EvidenceDeleted`,
`RescueCreated` ni `HumanFollowupRequested`. Si la telemetría necesita observar upload, error o
funnel, su naming queda pendiente y **no reemplaza** a los eventos de dominio.

---

## 12. Scope

### 12.1 Track A — validable ya (sin backend)

Experiencia clickeable con fixtures sintéticos, para focus groups y test de comprensión.

**Incluye:** las 9 superficies `UX01`–`UX09` como componentes reales con el sistema visual final;
navegación por el Golden Path; los estados críticos de cada pantalla; cero backend.

**No incluye:** auth, persistencia, ADE real, datos reales, WhatsApp, CRM.

### 12.2 Track B — MVP real

**Must have (Parte I §26.1):** closed-loop Risk con causa/owner/playbook/SLA/outcome; consola
operativa P0; playbooks mínimos; lifecycle formal de evidencia; instrumentación de eventos; permisos
por rol + aislamiento institucional + auditoría; login + perfil + WhatsApp; ADL mínima con
fuente/confianza/vigencia; Mapa Académico Mínimo; Risk rule-based; próxima acción explicable;
compromiso horario; seguimiento humano por CRM; evidencia con niveles de validación; progreso
visible; No Cortar; Modo Examen completo para modalidades prioritarias.

**Acceso institucional.** En el registro, Plataforma consulta al CRM mediante el contrato vigente de
[`platform-integration-contract.md`](platform-integration-contract.md). Sólo `authorized: true`
habilita acceso. La autorización es por email presente en padrón activo —nunca por dominio— y conserva
`platformStudentId` como identidad canónica. Los tres rechazos (`not_in_roster`,
`institution_terminated`, `ambiguous`) son resultados de negocio; `400`/`401` son errores técnicos y
no se presentan como rechazo del estudiante. Este flujo permanece bloqueado para personas reales por
[ADR-006](decisions.md#adr-006).

**Should have:** dashboard institucional mínimo, herramientas de QA de intervenciones, exportación de
analítica, importación CSV institucional, scrapers específicos, curación asistida por IA,
timeline/Gantt, simulacro básico.

### 12.3 Fuera de alcance — no bloquear por esto

Scraper universal · Ingestion Engine generalizado · comprensión automática de audio de clase ·
modelos predictivos complejos · validación automática universal · dashboard institucional avanzado ·
gamificación compleja · marketplace de apuntes · app móvil nativa · calendario propio completo ·
detector de IA.

### 12.4 Diferidos explícitamente (`P2`)

| C01 | Qué | Gate |
|---|---|---|
| `C01-047` | Modalidad **oral** y otras familias de examen | `O` — fuera del MVP |
| `C01-048` | Integraciones profundas Calendar / LMS / SIS | `O` |
| `C01-049` | Hardening de escala y automatización avanzada | `O` |

**Modalidades P0: práctico y teórico escrito.** Oral y las demás son P1. Si un `Assessment` llega con
modalidad oral, se muestra el valor real y se sale con retorno seguro: **nunca** se lo fuerza a un
protocolo P0.

---

## 13. Copy prohibido

Lista consolidada de frases que el producto **no dice nunca**, con la razón:

| Prohibido | Por qué |
|---|---|
| *"Dominaste la unidad"* sin prueba aplicable | Confunde actividad con dominio |
| *"Subiste tu nivel"* / *"Ganaste progreso"* | Gamificación sin hecho autoritativo |
| *"La materia aumentó X%"* | No existe métrica de porcentaje aprobada |
| *"No avanzaste"* por ausencia de datos | Sin datos no es cero |
| *"Tu evidencia está mal"* / *"Fallaste"* | `INSUFFICIENT` no es fracaso personal |
| *"Listo para rendir"* | `READY_BY_PROTOCOL` no predice aprobación |
| *"5 de 12"* / *"60% completo"* del protocolo | Los 12 pasos son provisionales; no se hardcodean |
| *"Agus la revisará hoy"* sin assignment ni SLA | Presencia humana decorativa |
| *"Te contactaremos en breve"* | Promesa sin contrato real |
| *"Estamos calculando"* sin proceso real observado | Falsa actividad del sistema |
| *"Elegimos lo siguiente desde esta vista"* | La UI no genera recomendaciones |
| *"Bajo control"* sin lectura confiable del Risk Engine | Afirmación sin fuente |
| *"Empezar a estudiar"* al activar Modo Examen | Activar no es estudiar |
| *"Tu plan fue generado"* | Activar no crea un plan |
| *"Completaste el paso"* por abrirlo | Abrir no completa |
