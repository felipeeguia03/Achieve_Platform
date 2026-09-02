# Achieve — Producto: glosario, roles, estados y scope

**Documento:** `docs/product.md`
**Rol:** owner canónico del vocabulario, los roles, las máquinas de estado observables y el alcance.
**Deriva de:** `docs/product-spec-source.md` (Partes I, II, IV, VI, IX).
**Última actualización:** 29 de agosto de 2026

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
| **Evidencia de trabajo** | Prueba de que el estudiante **hizo una actividad**: cronograma, foto del material, checklist, ficha, resumen | **No prueba aprendizaje.** Nunca alimenta una afirmación de dominio |
| **Evidencia de aprendizaje** | Instancia que comprueba **qué puede hacer con el contenido de manera autónoma** | No es una entrega más: exige desempeño observable, con condiciones y criterios claros |
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
| **Recuperación activa** | Traer el contenido a la memoria **sin el material a la vista**. `HUMAN-P0-03 v1.0`: es un proceso cognitivo **distinto** de producir un apoyo, y ninguno reemplaza al otro |
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

> **El Operador es un rol del producto, no un usuario de la Plataforma**
> ([ADR-033](decisions.md#adr-033)). Su alcance sigue siendo el que fija el spec —*"el operador no es
> un parche humano detrás de la app"* (Parte I §21.0)—, pero lo ejerce **desde el CRM**: sus
> superficies viven ahí (§10.1) y su identidad y asignación son fuente de verdad del CRM (Parte II
> §18.1). La Plataforma no le da sesión.

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

**La columna Operador se satisface por contrato, no por pantalla.** Lo que un operador ve llega por
el flujo de contexto académico vivo (CRM → Plataforma, de lectura), no porque tenga acceso a una
superficie de acá. La fila `human_assignment` —*qué estudiantes son "sus asignados"*— es del CRM
(`C01-039`).

Todo esto queda gateado por [ADR-006](decisions.md#adr-006) antes de tocar datos reales. **Cualquier
contrato que transporte notas, causas detalladas, evidencias o información individual de un
estudiante entre los dos sistemas queda condicionado por las decisiones de privacidad,
consentimiento, minimización y retención de la Fase B7.**

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
RECOMMENDED → ACTIVE → EXAM_TAKEN → CLOSED
                    ↘ BLOCKED
                    ↘ ABANDONED (conserva historial)
```

✅ **[ADR-011](decisions.md#adr-011), implementada en la Fase B5.** `BUILDING`, `READY_BY_PROTOCOL` y
`NOT_READY` **salieron de este lifecycle**: son estados de `PreparationReadiness`, su única fuente.
La cadena central se cierra en `ACTIVE → EXAM_TAKEN`, que no es un atajo nuevo sino el mismo camino
sin los nodos que dejaron de pertenecer a esta entidad.

**Invariantes:**
- Activar produce `ACTIVE` y **nada más**: no crea Action, Commitment, Evidence, Progress, protocolo
  completo ni readiness. Lo único que se anota además es **contra qué versión del protocolo corre**,
  que no es crear un protocolo: sin eso, cambiar la versión vigente le reescribiría el recorrido a
  alguien que ya arrancó.
- **La activación es siempre del estudiante.** El spec fuente lo fija: *"la misma entrada produce
  siempre `RECOMMENDED` → CTA → `ACTIVE`"*. No existe camino que cree una preparación ya activa.
- `READY_BY_PROTOCOL` significa que se cumplieron las condiciones del protocolo vigente.
  **No predice ni garantiza aprobación.** Nunca se dice "listo para rendir".
- Volver a Cursado, al Overview o a Hoy **no** abandona la preparación.
- `BLOCKED` **no tiene salida declarada**, y no se le inventa una: el diagrama no dibuja el retorno y
  `C01-025` sigue `OPEN`.
- Abandonar **conserva el historial**: es un estado, no un borrado. Sus completions quedan.

### 5.5 RiskSignal

**Máquina canónica** — [ADR-034](decisions.md#adr-034), que cerró `C01-022`:

```
OPEN ──────────────► INTERVENTION_REQUIRED ──► RESOLVED
 │                                          ↘  ESCALATED
 └──► EXPIRED

ACKNOWLEDGED  ·  legacy
```

> ✅ **Implementada** el 2 de septiembre de 2026 (§7.1–§7.2 del plan). El resto de la integración
> —`crmCaseId`, cierre y resolución en una transacción, validación de owner, outbox— sigue pendiente
> en [`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md) §7.

**La necesidad de una persona la declara la Plataforma**, desde `risk_rule.modo`, y **no depende de
que alguien haya visto la señal**. Mientras el operador trabajaba acá, *"alguien la miró"* era un
paso real del recorrido; con el operador en el CRM ([ADR-033](decisions.md#adr-033)) ese paso no
tiene quién lo produzca.

**`ACKNOWLEDGED` queda legacy y no se borra.** Ni el valor, ni la columna `acknowledged_at`, ni el
evento, ni las filas que lo tengan: una señal histórica conserva su significado y sus salidas.
Ninguna señal nueva entra ahí. **Hacerse cargo es un hecho de la `Intervention`** —§5.5.1—, y ya
tenía dónde vivir desde la B6.

**`EXPIRED` sale sólo de `OPEN`.** Al salir `ACKNOWLEDGED` del recorrido vivo, es la única puerta que
queda: una señal que ya pide una persona no se vence sola.

**Closed-loop obligatorio (Parte I §8.6):** toda señal relevante tiene causa → owner → playbook →
SLA → intervención → outcome. *El dashboard no es el final del Risk Engine.*

✅ **Implementado en la Fase B6** ([ADR-032](decisions.md#adr-032)), con tres reglas que salen del
diagrama y que no son restricciones de más:

- **`RESOLVED` sólo se alcanza desde `INTERVENTION_REQUIRED`, y sólo con una intervención que
  registró outcome.** Una señal que se pudiera marcar resuelta sin que nadie la trabajara **es** el
  tablero en verde con nada detrás.
- **`EXPIRED` sale sólo de `OPEN`.** Una señal puede expirar si deja de ser relevante y se guarda la causa histórica; una
  que **ya pidió una persona** no dejó de serlo, y vencerla borraría una obligación humana pendiente.
  Lo ejecuta el reloj del lifecycle, sobre el `valid_until` que declaró quien la creó.
- **`RESOLVED`, `ESCALATED` y `EXPIRED` son terminales.** Qué pasa después de escalar es `C01-022`.

🟡 **Una regla produce señales, y es provisional** — [ADR-036](decisions.md#adr-036).

> ⚠️ **`PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION`.** El umbral lo fijó el **Product Owner**
> para poder demostrar el MVP con datos sintéticos. **No tiene validación psicopedagógica y no se le
> atribuye a la psicopedagoga**, que lo revisa antes de cualquier piloto con estudiantes reales.

`HP0-06-1` corre en `v2.0-po-provisional`: la segunda aparición corroborada del mismo tipo de error
da `atencion`, la tercera —o una nueva tras una acción correctiva— da `intervencion` y pide una
persona. **La versión de la psicopedagoga no se tocó**: quedó apagada, con su texto intacto, y una
señal conserva la versión de la regla que la produjo.

`HP0-06-2` y `HP0-06-3` **siguen sin umbral y en modo `HUMANA`**: nadie decidió las suyas. El umbral
vive en `risk_rule.threshold_config`, nunca en el código, y hay un guard estático que lo verifica.

### 5.5.1 Intervention

```
open → acknowledged → closed
```

`data-model.md` §10 declara los tres estados y **no** su tabla de transiciones; el orden sale del
Golden Path D del spec —*selecciona caso → contexto → intervención → resultado*—. Reconocer no es
decorativo: es el momento en que una persona se hace cargo, y sin él *"cerrada"* no distingue una
intervención trabajada de una despachada.

**Cerrar, registrar el resultado y resolver la señal son una sola escritura** — ✅ implementado por
[ADR-034](decisions.md#adr-034) §7.4. No existe camino que deje una intervención cerrada sin outcome,
ni una señal pidiendo una persona que ya la atendió.

**Y sólo la reconoce y la cierra su dueño** (§7.5). Que la tome un tercero dejaría
`owner_operator_id` diciendo una cosa y el outcome diciendo que lo registró otro; la reasignación
necesita un comando propio, y no existe en v1. `closed` es terminal: reabrirla sería editar un hecho con su resultado ya
registrado — la misma regla de *No Cortar* que impide tocar un `Commitment` `MISSED`.

⚠️ **Playbook y SLA quedan en `null` y el circuito lo declara.** `C01-044` es explícito —*"no se
inventan valores"*— y su gate es antes del piloto. Un playbook inventado sería una instrucción
escrita por un agente sobre qué hacer con un estudiante que está mal.

### 5.6 ProtocolStep

**No existe un enum de estado por paso congelado.** Solo hay un hecho factual de completion, emitido
por el owner del protocolo (`ProtocolStepCompleted` o una lectura autoritativa equivalente).

**No completan un paso:** abrirlo, volver a abrirlo, leer el objetivo, abrir un recurso, declarar
confianza, aceptar una recomendación, crear o cumplir un Commitment, iniciar o completar una Action,
subir Evidence, ni ninguno de los estados `SUBMITTED`, `UNDER_REVIEW`, `SUFFICIENT`, `VALIDATED`,
`ProgressUpdated`, recibir feedback, pasar tiempo o alcanzar una fecha.

**Y un paso completado puede volver a trabajarse.** `HUMAN-P0-01 v1.0` confirma que en el tramo 9–18
—estudio, recuperación, revisión y práctica— el recorrido es reentrante: el estudiante vuelve sobre
un tema, corrige y recupera de nuevo, **varias veces sobre el mismo tema**. Repetir un paso **no es
retroceder** y no se presenta como incumplimiento ni como pérdida de progreso.

✅ **El modelo de datos ya lo admite** ([ADR-028](decisions.md#adr-028)): cada vuelta es una fila con
su ordinal y su tema, y `ProtocolStepCompleted` se emite **una vez por vuelta**. La reentrancia viaja
con el contenido del protocolo (`protocol_step.is_reentrant`), no con el código: un paso no
reentrante conserva la garantía de completarse una sola vez.

**Completar un paso no es progreso.** Sigue estando en la lista de arriba, y ahora que las
completions existen importa más: `UX08` las muestra como pasos trabajados, nunca como dimensiones
cambiadas.

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

### 6.1 La escala breve, confirmada — y el vocabulario que todavía no cierra

`HUMAN-P0-02 v1.0` ([ADR-025](decisions.md#adr-025)) confirma el **modelo mixto**: una **escala
breve para el día a día**, y **las dimensiones separadas cuando hay desempeño observable**. La razón
que dio la profesional es de carga, no de precisión: un registro simple que no le coma el tiempo al
estudiante, y detalle sólo cuando hay evidencia concreta.

Eso **no relaja** ninguna regla de abajo. La escala breve es **proyección de lectura**: se deriva,
nunca se persiste como verdad, nunca reemplaza a las dimensiones y **nunca es la fuente de un
`ProgressUpdated`**. La UI sintetiza; el modelo no colapsa.

⚠️ **Los dos vocabularios todavía no se reconciliaron.** La profesional nombra **contacto,
recuperación, aplicación y corrección**, con la **confianza aparte**. La tabla de arriba tiene
**Recorrido, Práctica, Dominio, Confianza y Recencia**. No son el mismo conjunto:

| Lo que dijo la profesional | Dónde cae hoy |
|---|---|
| Contacto con el contenido | **Recorrido** — coincide |
| Recuperación sin ayuda | Colapsada dentro de **Dominio** |
| Aplicación | Colapsada dentro de **Dominio** |
| Corrección de errores | **No tiene eje propio** |
| Confianza, aparte | **Confianza** — coincide, y ya está separada |
| — | **Recencia** no es una dimensión que ella nombre |

Traducir un conjunto al otro **es exactamente el tipo de inferencia que este producto no hace**.
Queda abierto en `C01-019` (gate `H`), y hasta que se cierre **el modelo no gana ni pierde ejes**.

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

## 8. Las ocho reglas `HUMAN-P0` — confirmadas por la psicopedagoga

> ✅ **Las ocho fueron respondidas por la psicopedagoga real el 31 de agosto de 2026.** Dejaron de
> ser defaults provisionales del equipo: son **criterio profesional confirmado, `v1.0`**. Ver
> [ADR-025](decisions.md#adr-025), y la **fuente literal** en
> [`human-p0-source.md`](human-p0-source.md) — cuando esta tabla y esa transcripción discrepen,
> **manda la transcripción**.
>
> **Lo que sigue abierto son los residuos** de la columna derecha. Ésos siguen bajo la regla de
> siempre: ningún agente de IA los cierra, se preguntan y no se aproximan.

| ID | Versión | Qué decide | Criterio confirmado | Residuo abierto |
|---|---|---|---|---|
| `HUMAN-P0-01` | `v1.0` | Contenido base de los 20 pasos del protocolo de examen | La secuencia `PE-PSY-01…20` **se confirma como base**, con granularidad y trazabilidad **por paso**. **Los pasos 9 a 18 no son lineales ni rígidos:** el orden es variable, modificable y transversal según contenido, modalidad y nivel de dominio, y **una misma acción puede repetirse varias veces sobre el mismo tema** | **Cuáles de los 20 son obligatorios.** La respuesta confirma la secuencia y no cambia ningún paso, pero no declara obligatoriedad caso por caso (`C01-031`) |
| `HUMAN-P0-02` | `v1.0` | Cómo se resume el seguimiento del aprendizaje | **Modelo mixto:** una **escala breve** para el día a día **+ dimensiones separadas cuando hay desempeño observable**. Razón dada: mantener un registro simple que no le coma el tiempo al estudiante, y profundizar sólo cuando hay evidencia concreta de desempeño | **Cómo se reconcilian los dos vocabularios.** La profesional nombra *contacto, recuperación, aplicación y corrección* (+ confianza aparte); el modelo tiene las cinco de §6. No son el mismo conjunto (`C01-019`, gate `H`) |
| `HUMAN-P0-03` | `v1.0` | Si producir un apoyo (mapa, ficha, resumen) cuenta como aprendizaje | Son **dos resultados separados dentro del mismo paso**, y **según el caso uno puede no aplicar**. Organizar el contenido y recuperarlo sin ayuda son **procesos cognitivos distintos**: una buena ficha no reemplaza la recuperación, y una buena recuperación no obliga a producir una ficha. **La técnica se usa cuando cumple una función concreta** — si el estudiante ya comprende y organiza el tema, exigirle producirla es tiempo perdido | **Si la recuperación también puede omitirse.** La opción dice *"uno puede no aplicar"* sin decir cuál; la justificación sólo cubre la ficha (`C01-033`) |
| `HUMAN-P0-04` | `v1.0` | Qué hacer cuando quedan menos de 24 h para el examen | **Siete componentes:** situación real y logística · contenidos críticos · **una prueba breve sin ayuda** · priorización · práctica parecida al examen · **corrección de los errores importantes** · descanso y estrategia. *"Consolidar y no incorporar contenido nuevo"* supone un ideal donde **todo ya fue visto y recuperado**: si hay un **contenido central que nunca se trabajó, puede ser necesario abordarlo**, con expectativas realistas. El descanso se mide en **efectividad, no en horas** | **Si los siete son obligatorios o priorizables**, y en qué orden se sacrifican cuando no entran todos (`C01-034`) |
| `HUMAN-P0-05` | `v1.0` | Qué cuenta como señal real de aprendizaje | **Confirmado, y con nombre propio: evidencia de trabajo ≠ evidencia de aprendizaje.** Un cronograma, una foto del material, un checklist, una ficha o un resumen **muestran que hubo actividad**; por sí solos **no permiten afirmar que el estudiante aprendió**. Hace falta una instancia que compruebe **qué puede hacer con ese contenido de manera autónoma** | **Qué tareas "exigen comprensión" por sí mismas.** La excepción está declarada, su alcance por disciplina no (`C01-035`) |
| `HUMAN-P0-06` | `v1.0` | Cuándo se necesita revisión humana vs. corrección automática | **Selectiva y proporcional.** Lo comprobable **se automatiza**: no es pedagógicamente necesario que una persona mire cada entrega. **La persona entra por la situación del estudiante, no por el tipo de entrega** — error reiterado que exige corregir el método, no avanzar a pesar de las devoluciones, o factores subjetivos (frustración, inseguridad, desmotivación, ansiedad frente al examen). Ahí **ya no se trata de verificar si una respuesta está bien o mal, sino de entender qué le está pasando** | **Cuántas repeticiones hacen a un error "reiterativo"** y qué umbral dispara la intervención (`C01-036`, `C01-021`) |
| `HUMAN-P0-07` | `v1.0` | Criterios de corrección para práctico y teórico escrito | Se conservan **las dos familias**, distintas entre sí — **práctico:** procedimiento, resultado, elección del método, resolver variaciones; **teórico escrito:** precisión, relaciones entre conceptos, aplicación, claridad, responder la consigna — **y la pauta de la cátedra manda cuando existe**, porque *"es lo que va a determinar qué se espera del estudiante en ese examen"* | **Peso relativo de cada criterio**, y qué pasa cuando la pauta de la cátedra **contradice** las familias generales (`C01-037`) |
| `HUMAN-P0-08` | `v1.0` | Qué es el análisis posterior al examen | Separar **preparación, desempeño, estrategia y contexto**; registrar aprendizajes; **uno o más ajustes viables cuando correspondan, sin cantidad fija** — el *"exactamente dos cambios"* de la intervención #32 era un ejemplo, **no una regla**. Y **también se registra lo que funcionó y debe mantenerse** | **El momento**: antes o después de conocer la nota (`C01-038`) |

### 8.1 Consecuencia arquitectónica

Los 12 pasos `EP-01`…`EP-12` documentados en el spec (Parte II §5) son una **arquitectura funcional
provisional**. La propia fuente prohíbe hardcodearlos. Por eso:

- `ExamProtocol` / `ProtocolVersion` / `ProtocolStep` son **configuración versionada**, no código.
- No se muestra "Paso 5 de 12" ni un porcentaje de protocolo.
- No se deriva el paso actual desde la posición en una lista.
- Cambiar la versión de un default **no reescribe historia**.

**Esto ya se cobró dos veces.** Las respuestas del 31 de agosto cambiaron el contenido de cuatro de
las ocho reglas. Y el 1 de septiembre entraron **los veinte pasos reales**
([ADR-031](decisions.md#adr-031)), que reemplazaron a los doce provisionales: fue un `INSERT` y un
`UPDATE is_current`, con la versión vieja **apagada y conservada** para las preparaciones que ya
corrían contra ella. Hardcodeado, cada una de las dos habría sido migrar el dominio para cambiar una
regla pedagógica.

> **El protocolo vigente es `HUMAN-ROADMAP v1.0`**, transcripto literal en
> [`roadmap-modo-examen-source.md`](roadmap-modo-examen-source.md) — con los tipeos de la autora
> intactos y un test que rompe si alguien los corrige. Lo que la fuente **no** define
> —evidencia esperada, criterio de cierre, obligatoriedad— entró vacío, no completado.

### 8.2 El tramo 9–18 es reentrante — ✅ y el modelo ya lo admite

`HUMAN-P0-01 v1.0` dice que en estudio, recuperación, revisión y práctica el estudiante **avanza,
vuelve sobre un tema, recupera, detecta un error, corrige, practica, repasa y vuelve a recuperar**, y
que **algunas de esas acciones pueden darse varias veces sobre el mismo tema**.

El modelo de examen de [`data-model.md`](data-model.md) §10 asumía lo contrario: **una sola completion
por paso**, `UNIQUE (exam_preparation_id, protocol_step_id)`. Un paso se completaba una vez y no
volvía.

✅ **[ADR-028](decisions.md#adr-028) lo cerró antes de la primera migración de la Fase B5.** El
`UNIQUE` se cayó, cada vuelta es una fila con su `occurrence` y **su `topic_id`** —la fuente no dice
"varias veces", dice *"varias veces sobre un mismo tema"*—, y la garantía vieja no se perdió: se
volvió configurable en `protocol_step.is_reentrant`.

Las consecuencias siguen siendo las mismas, y ahora tienen dónde verificarse:

- **Volver sobre un tema no es retroceder.** Ninguna superficie presenta una repetición como
  incumplimiento, recaída ni pérdida de progreso.
- **El paso actual no se deriva de la posición en la lista** — ya era regla, y ahora además sería
  falso: en el tramo central no hay "el siguiente".
- **El orden depende del contenido, la modalidad y el nivel de dominio.** Un protocolo que fuerce una
  única secuencia en 9–18 contradice el criterio profesional confirmado.

---

## 9. Otras reglas marcadas como provisionales o pendientes

Las ocho `HUMAN-P0` ya no están en esta lista: [ADR-025](decisions.md#adr-025) las cerró. Estas
reglas visibles del producto **sí** siguen corriendo sobre un default no cerrado:

| Regla | Estado | Referencia |
|---|---|---|
| Activación de Modo Examen a los **14 días** | **Default UX documentado, no regla pedagógica rígida.** La UI **no calcula la ventana**: consume una señal ya emitida. Desde la Fase B5 esa señal es concreta —una preparación en `RECOMMENDED`— y **nadie la emite todavía**: sin ella `UX07` dice que no hay recomendación, en vez de inventarse un umbral de días | `C01-024`, `SCP-01`/`SCP-02` |
| Owner canónico de readiness | ✅ **Cerrado e implementado:** `PreparationReadiness` es la fuente canónica y `ExamPreparation` perdió sus tres estados. **Sigue sin card, sin score y sin cálculo**, porque los umbrales son otra cosa | ✅ [ADR-011](decisions.md#adr-011) |
| Umbrales de `BUILDING` → `READY_BY_PROTOCOL` | Criterios generales definidos; umbrales exactos pendientes. **Ya hay insumo profesional** para fijarlos: `HUMAN-P0-04` y `HUMAN-P0-05` | `C01-029` |
| Obligatoriedad de `Reflection` | **Tres estados**, no dos: `NO_CONFIGURADA` no ofrece nada, `OPTIONAL` ofrece la `CTA-016` y omitirla es válido, `REQUIRED` bloquea **sólo el submit dependiente**. Vive en la Action y en el paso del protocolo, **congelado al crearlos**; el default del loop diario es `OPTIONAL` | ✅ [ADR-026](decisions.md#adr-026) · residuo: en qué pasos del protocolo es obligatoria |
| Secuencia y criterio de cierre del Exam Protocol | **La secuencia dejó de estar abierta** (`HUMAN-P0-01 v1.0`) y **el tramo reentrante ya tiene modelo** ([ADR-028](decisions.md#adr-028)). Sigue abierto **el criterio de cierre** | `C01-027` |
| Dónde vive la **pauta de la cátedra** | ✅ **`assessment_criterion`, con Provenance completa.** Cargada por el estudiante entra `student`/`unverified` y no se eleva. Sigue abierto qué pasa cuando **contradice** las familias generales | ✅ [ADR-029](decisions.md#adr-029) · residuo: `C01-037` |
| **El texto de los 20 pasos `PE-PSY`** | ✅ **Cargado el 1 de septiembre** desde el *Roadmap Modo Examen* de la psicopedagoga, verbatim y con test que lo ata a la fuente. Falta **su confirmación escrita de vigencia**, y hasta que llegue el rótulo dice *"vigencia todavía sin confirmar"* | ✅ [ADR-031](decisions.md#adr-031) |
| **Qué pasos del protocolo se repiten** | Cargados **9–18**, por `HUMAN-P0-01 v1.0`. Leyendo sólo el Roadmap saldrían 14 y 15: la respuesta del cuestionario es más específica porque contesta por número de paso | [ADR-031](decisions.md#adr-031) · falta confirmación |
| **Evidencia esperada de cada paso** | El Roadmap dice qué hacer, no qué se entrega. El [cuadro de acciones](cuadro-problemas-source.md) de la misma profesional lo propone y **no se carga**: no está mapeado uno a uno y conserva preguntas suyas sin resolver | `C01-027` |
| **Cuáles pasos son obligatorios** | `protocol_step.requirement` es ternario y todos están en `NO_CONFIGURADA`. El booleano anterior afirmaba que los 20 eran obligatorios | `C01-031`, `C01-034` |
| `TopicProgress` y resumen de materia | Semántica técnica pendiente, **más la reconciliación de vocabularios** que abre `HUMAN-P0-02` — ver §6 | `C01-019` (gate `H`) |
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

### 10.1 Superficies de Operador — **pertenecen al CRM**

**No están en el inventario de construcción de la Plataforma, y no van a estarlo**
([ADR-033](decisions.md#adr-033)). El spec fuente ya las ubicaba ahí: la sección que las define se
llama *"8. Wireframes low-fi — **Operador / CRM**"*, y el mockup de `WF-O01` lleva dibujado su propio
encabezado, `ACHIEVE CRM · Cola de intervención`.

| ID | Nombre | Dónde vive |
|---|---|---|
| `WF-O01` | Cola priorizada de intervención | **CRM** |
| `WF-O02` | Contexto de estudiante (<10 s) | **CRM** — lo alimenta el flujo de contexto académico vivo |
| `WF-O03` | Registrar intervención + outcome | **CRM** — el hecho canónico lo produce la Plataforma, por comando |
| `WF-O04` | Revisión de evidencia | **CRM** |

**El operador no interactúa con la Plataforma y no tiene sesión acá.** No es que falte construirla:
no debe existir. A la Plataforma acceden únicamente los estudiantes que el CRM autoriza
([`platform-integration-contract.md`](platform-integration-contract.md) §1). En las integraciones
que correspondan, la Plataforma **autentica al CRM como sistema**, nunca a la persona.

> `WF-O04` sale del alcance **como superficie de operador**, y nada más. El lifecycle `UNDER_REVIEW`
> de `Evidence` sigue siendo dominio canónico de la Plataforma. Si el **Reviewer (R1)** de §4 —un rol
> distinto del Operador— es o no un operador, sigue abierto.

### 10.1.1 `WF-I01` — dashboard institucional · sin resolver

| ID | Nombre | Dónde vive |
|---|---|---|
| `WF-I01` | Dashboard institucional mínimo | ⬜ **Abierto** |

Está en la sección **9 — Institución** del spec, no en la 8, y su usuario es el **cliente B2B**, no
el operador. La confirmación del CTO fue sobre superficies de operador y **no dispone de ésta**: el
spec §18.1 le da al CRM la relación B2B, pero lo que `WF-I01` muestra son agregados académicos, que
son de la Plataforma. Se decide aparte ([ADR-033](decisions.md#adr-033)).

### 10.2 Precedencia operativa del Hero (UX01)

La selección de qué ocupa el Hero separa dos responsabilidades:

- **Prioridad académica** → la decide el **ADE**: qué materia y qué trabajo tienen más valor ahora.
- **Precedencia operativa de lifecycle** → la decide **TodayView**: qué objeto **ya priorizado** o
  **ya iniciado** requiere una conducta inmediata.

```
1. Action IN_PROGRESS                          → "Continuar"
2. Action EVIDENCE_PENDING                     → "Subir evidencia"
3. Commitment CONFIRMED/DUE                    → "Ver compromiso" si es próximo
                                                  "Empezar" si es startable now
                                                  "Empezar rescate" si es un rescate
4. RESCUE_REQUIRED sin rescate concreto        → "Retomar"
5. Commitment MISSED sin resolución            → "Retomar"
6. ACTION_RECOMMENDED (principal del ADE)      → "Comprometerme"
7. ACADEMIC_CONTEXT_INCOMPLETE que bloquea     → "Completar información"
8. Evidence informativa sin acción posterior   → "Ver evidencia" si está enviada
                                                  "Ver avance" si está validada
9. NO_ACTION_AVAILABLE                         → "Ver materias"
```

> **La proyección no puede sustituir la recomendación principal por otra materia** debido a fecha de
> examen, riesgo, dificultad, brecha, antigüedad o starvation. Los estados de riesgo y de examen
> activo son **modificadores**, no reemplazantes: cambian el estado general y el contexto, no la CTA.

Esta función vive como **función pura** en
[`lib/domain/precedence.ts`](../lib/domain/precedence.ts), extraída de
`components/screens/hoy-autogestion.tsx` en la Etapa 0.2. Los nueve niveles tienen test propio.

✅ **La función cubre los nueve niveles y `UX01` los dibuja todos** desde la Etapa 0.7.

**Los discriminadores de los niveles 3 y 8** los fija `product-spec-source.md` §VI.1 §3.2 y los
cerró [ADR-017](decisions.md#adr-017): el nivel 3 se decide **por lifecycle y tiempo acordado**, no
por prioridad académica; el nivel 8, **por lifecycle de la Evidence**.

> **`RESCUE_MATERIALIZED` no es un nivel propio.** §VI.1 §3.2: *"no describe por sí solo qué necesita
> hacer el alumno ahora, por eso participa en la precedencia según su lifecycle real"*. Una Action de
> rescate `IN_PROGRESS` es nivel 1; `EVIDENCE_PENDING`, nivel 2; un Commitment de rescate
> `CONFIRMED`/`DUE`, nivel 3. **Un compromiso actual no es desplazado por un rescate anterior sólo
> por tratarse de un rescate.**

---

### 10.3 Registro canónico de CTAs

`CTA-001`…`CTA-018`. El registro normativo completo, con condición de aparición, acción solicitada,
destino, resultado autoritativo, fallback y estado de error, vive en `product-spec-source.md`
Parte III §5. Su **transcripción ejecutable** está en
[`lib/navigation/cta-registry.ts`](../lib/navigation/cta-registry.ts), con un test que verifica que
cada condición siga siendo literalmente la del spec.

**Aparición ≠ habilitación** (Etapa 0.3). Si la *condición de aparición* no se cumple, la CTA **no se
renderiza** — no en gris, no oculta: no está. Si aparece pero falta algo que el estudiante puede
completar en esa misma pantalla, se renderiza **deshabilitada** con tratamiento propio (`A-08`). El
propio registro distingue los dos casos: el estado de error de `CTA-017` dice *"ocultar **o** no
habilitar"*.

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

> **El catálogo ejecutable vive en `lib/domain/product-events.ts`** desde la Etapa B3.2, con **la
> cobertura real**: cuáles se emiten hoy, cuáles esperan a qué fase y cuáles se le muestran al
> estudiante en la Bitácora. **De los 23 se emiten 11** desde la Fase B5: los ocho del loop diario,
> `RescueSucceeded` (B3.3) y los dos de examen —`ExamPreparationActivated` y `ProtocolStepCompleted`—.
> Hay guard en **tres** direcciones: ningún evento emitible queda sin declarar, ninguno declarado como
> emitido se queda sin emisor, y **nada declarado como pendiente se está emitiendo ya**. El tercero se
> agregó en la B5, cuando esos dos eventos pasaron a emitirse y el catálogo los siguió declarando
> *"pendientes por falta de tablas de examen"* en verde. Un catálogo que miente sobre lo que ya
> ocurre es peor que uno vacío.

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
| `ExamPreparationRecommended` | Modo Examen recomendado. **Sin emisor todavía:** cuándo aparece la señal es `C01-024` |
| `ExamPreparationActivated` | El alumno activó la preparación. ✅ Emitido desde la Fase B5 |
| `ProtocolStepCompleted` | Hito cerrado. ✅ Emitido desde la Fase B5, **una vez por vuelta** ([ADR-028](decisions.md#adr-028)) |
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

> ### ✅ Resuelto — [ADR-027](decisions.md#adr-027), 1 de septiembre de 2026
>
> **Los ocho entraron al modelo.** La lista de arriba decía que no existían `CommitmentDue`,
> `CommitmentCompleted`, `CommitmentClosed`, `EvidenceUnderReview`, `EvidenceSufficient`,
> `EvidenceInsufficient`, `EvidenceResubmissionRequested` ni `CommitmentRescueCreated` — y el backend
> los emitía desde B1/B2, uno por cada transición de estado.
>
> No se podía sostener un catálogo normativo que negara ocho hechos **almacenados de forma
> append-only y que sostienen experiencias visibles para el estudiante**: *"En revisión"*, *"Cumplió
> el criterio"*, *"Necesita cambios"* y *"Te pidieron volver a entregarla"* salen de ahí.
>
> **Son eventos de `TRANSICION`, no de negocio**, y esa clasificación es la mitad de la decisión.

## 11.1 Los tres niveles del modelo — `ADR-027`

Aprobar los eventos de transición no significa mezclarlos con los de negocio. El catálogo ejecutable
—`lib/domain/product-events.ts`— clasifica cada hecho, y hay guard de que ninguno quede sin nivel:

| Nivel | Qué es | Ejemplos |
|---|---|---|
| **`NEGOCIO`** | Lo que el producto existe para producir y medir | `ActionRecommended`, `ProgressUpdated`, `RescueSucceeded`, `ProgressNoChangeConfirmed` |
| **`TRANSICION`** | El objeto cambió de estado. Trazabilidad del lifecycle | `CommitmentDue`, `EvidenceSufficient`, `ActionReplaced` |
| **`TELEMETRIA`** | Uso e interacción. **Ninguno instrumentado**, y su naming sigue pendiente (`C01-023`) | `CourseViewed` |

**Los nombres históricos no se cambian.** `product_event` es append-only: renombrar dejaría filas
viejas que ningún consumidor sabe leer. Por eso `CommitmentCreated` de §16 sigue emitiéndose como
`CommitmentConfirmed`, y cualquier renombre futuro necesita un plan de migración.

**Lo que sigue abierto en `C01-023`:** el naming de telemetría, y la instrumentación de los 14
eventos del P0 que esperan la fase que los produce —examen, riesgo, intervención, consentimiento—.

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
| *"Tu resumen / tu ficha / tu cronograma demuestra que aprendiste"* | `HUMAN-P0-05 v1.0`: eso es **evidencia de trabajo**, no de aprendizaje |
| *"Retrocediste"* / *"Volviste atrás"* al repetir un paso del tramo 9–18 | `HUMAN-P0-01 v1.0`: el recorrido es reentrante. Volver sobre un tema es el método, no una recaída |
| *"Te falta el resumen para completar el paso"* cuando el apoyo no aplica | `HUMAN-P0-03 v1.0`: producir un apoyo y recuperar son resultados separados; uno puede no aplicar |
| *"Hacé dos cambios para el próximo examen"* | `HUMAN-P0-08 v1.0`: la cantidad de ajustes **no es fija**; salen del análisis o no salen |
| *"No incorpores ningún contenido nuevo"* como prohibición absoluta a menos de 24 h | `HUMAN-P0-04 v1.0`: un contenido central nunca trabajado **puede** abordarse, con expectativas realistas |
| *"Dormí 8 horas"* como requisito | `HUMAN-P0-04 v1.0`: el descanso se cuida en **efectividad**, no en una cantidad fija de horas |
