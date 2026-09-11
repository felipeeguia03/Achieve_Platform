# Achieve — Registro de decisiones de arquitectura (ADR)

**Documento:** `docs/decisions.md`
**Rol:** owner canónico de las decisiones tomadas y pendientes de este repositorio.
**Última actualización:** 5 de septiembre de 2026

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
| [ADR-008](#adr-008) | Stack y runtime del frontend | ✅ `ACCEPTED` · **enmendado** *([Enmienda 1](#adr-008-enmienda-1): `next` a `16.3.4` y `agentRules: false`, firmada el 3 sep 2026)* | — |
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
| [ADR-019](#adr-019) | El dock inferior no se construye; `Ausencia` ocupa su etapa | ⚠️ `SUPERSEDED` por [ADR-088](#adr-088) *(10 sep 2026 · **sólo su punto 1**)* | [ADR-018](#adr-018) |
| [ADR-020](#adr-020) | Cuántas clases de ausencia distingue Achieve, y con qué palabras | ✅ `ACCEPTED` *(un no-cambio declarado es un dato)* | — |
| [ADR-021](#adr-021) | Qué es, en Achieve, el «trabajo pendiente que caduca» | `ACCEPTED` | — |
| [ADR-022](#adr-022) | `C-04` elevado: el vacío argumenta, con tercera cláusula condicional | `ACCEPTED` | — |
| [ADR-023](#adr-023) | La ingesta del ADL se construye antes que el ADE, y empieza asistida | `ACCEPTED` | — |
| [ADR-024](#adr-024) | Modo MVP: se construye todo sobre datos sintéticos | `ACCEPTED` | — |
| [ADR-025](#adr-025) | Las ocho `HUMAN-P0`, respondidas por la psicopedagoga | ✅ `ACCEPTED` | — |
| [ADR-026](#adr-026) | Obligatoriedad de `Reflection`: dónde vive y qué la hace válida | ✅ `ACCEPTED` | — |
| [ADR-027](#adr-027) | Los ocho eventos de transición entran al Product Event Model | ✅ `ACCEPTED` | — |
| [ADR-028](#adr-028) | La completion de un paso es un hecho, no un estado | ✅ `ACCEPTED` *(cae el `UNIQUE`; la garantía pasa a `protocol_step.is_reentrant`)* | — |
| [ADR-029](#adr-029) | La pauta de la cátedra tiene entidad propia, con Provenance | ✅ `ACCEPTED` *(cargada por el estudiante entra `student`/`unverified` y no se eleva)* | — |
| [ADR-030](#adr-030) | El protocolo corre con contenido rotulado, y lo dice en sus columnas | ✅ `ACCEPTED` *(su hueco de contenido lo cerró [ADR-031](#adr-031); `EP-SPEC v0.1` quedó apagado, no borrado)* | — |
| [ADR-031](#adr-031) | Los veinte pasos entran con el texto de la psicopedagoga | ✅ `ACCEPTED` *(`HUMAN-ROADMAP v1.0`, verbatim y atado a la fuente por test)* | — |
| [ADR-032](#adr-032) | El circuito de riesgo se cierra por construcción, y lo que falta se declara | ✅ `ACCEPTED` *(corregido después por [ADR-033](#adr-033) y [ADR-034](#adr-034))* | — |
| [ADR-033](#adr-033) | La frontera de superficies, corregida en la dirección del spec | ✅ `ACCEPTED` *(corrige cláusulas de [ADR-012](#adr-012) y [ADR-032](#adr-032))* | — |
| [ADR-034](#adr-034) | `C01-022` cerrada: la necesidad de una persona la declara la Plataforma | ✅ `ACCEPTED` *(corrige la máquina de [ADR-032](#adr-032); reabre el ítem 5 de [ADR-005](#adr-005))* | — |
| [ADR-035](#adr-035) | La integración con el CRM se difiere; el dominio sigue adelante | ✅ `ACCEPTED` *(prioridad, no bloqueo: nada de lo construido se revierte)* | — |
| [ADR-036](#adr-036) | Cierre **provisional** de `C01-036` y `C01-021` para el MVP | ⚠️ ✅ `ACCEPTED` · **`PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION`** *(autoridad: Product Owner, no la psicopedagoga)* | — |
| [ADR-037](#adr-037) | La validación profesional llegó, y los números no eran el problema | ✅ `ACCEPTED` *(6 `CAMBIAR` + 1 `APROBAR`; los umbrales quedaron, cambió el denominador)* | — |
| [ADR-038](#adr-038) | Replanificar versiona dentro de la preparación; volver exige una propuesta aceptada | ✅ `ACCEPTED` *(`REPLANNED` sigue vivo; ninguna rama toca Evidence ni progreso)* | — |
| [ADR-039](#adr-039) | Hay pantalla de ingreso, y no es una superficie de producto | ✅ `ACCEPTED` *(sólo sign-in: **no hay alta**, que la decide el padrón del CRM)* | — |
| [ADR-040](#adr-040) | El camino de ejecución escribe en Postgres, y `C01-009` queda cerrada | ✅ `ACCEPTED` *(decidido por el CTO; **registrado retroactivamente** desde los commits del 3 sep 2026)* | — |
| [ADR-041](#adr-041) | Qué cuenta como «actividad» del estudiante a efectos de facturar | ✅ `ACCEPTED` *(4 sep 2026 · opción A: los cuatro eventos, como **cláusula del contrato**)* | — |
| [ADR-042](#adr-042) | Dónde da el estudiante su WhatsApp, si es que lo da | ✅ `ACCEPTED` *(4 sep 2026 · opción A: **hay tramo de onboarding**, y el owner definió el alta entera)* | — |
| [ADR-043](#adr-043) | El orden de los cinco flujos al descongelar, y el smoke test cross-sistema | ✅ `ACCEPTED` *(4 sep 2026 · **E/E′ primero**, D inmediatamente después; smoke test al empezar la integración)* | — |
| [ADR-044](#adr-044) | «Contanos» es voseo: sale de la lista del guard, no se afloja el guard | ✅ `ACCEPTED` *(4 sep 2026 · **sólo esa palabra**; las otras cinco siguen prohibidas)* | — |
| [ADR-045](#adr-045) | La reflexión se escribe dentro de la Evidencia | ✅ `ACCEPTED` *(4 sep 2026 · autoriza tocar `components/screens/evidencia.tsx`)* | — |
| [ADR-046](#adr-046) | `C01-010`: cuándo una renegociación es elegible | ✅ `ACCEPTED` *(4 sep 2026 · cinco condiciones; **una sola por cadena**)* | — |
| [ADR-047](#adr-047) | `C01-018`: el progreso no se infiere de una transición | ✅ `ACCEPTED` *(4 sep 2026 · ratifica lo que ya corre; `C01-018` `CLOSED`)* | — |
| [ADR-048](#adr-048) | `C01-024`: la ventana de Modo Examen son 14 días | ✅ `ACCEPTED` *(4 sep 2026 · **no depende de readiness**; `C01-024` `CLOSED`)* | — |
| [ADR-049](#adr-049) | La institución tiene zona horaria propia, y no es la del estudiante | ✅ `ACCEPTED` *(4 sep 2026 · el dato que ADR-046 §5 y ADR-048 nombraban y no existía)* | — |
| [ADR-050](#adr-050) | «Cambiar horario»: la renegociación llega a `UX04`, y no se llama así | ✅ `ACCEPTED` *(4 sep 2026 · acción secundaria; **«Renegociar» sale de la interfaz**)* | — |
| [ADR-051](#adr-051) | El catálogo curricular: no toda fila de un plan es una materia | ✅ `ACCEPTED` *(4 sep 2026 · `curriculum_requirement` con seis tipos; **`publication_status` ≠ `verification_status`**)* | — |
| [ADR-052](#adr-052) | El tramo de alta: tres pantallas fuera de las nueve, y el gate a `HOY` | ✅ `ACCEPTED` *(4 sep 2026 · implementa [ADR-042](#adr-042); **el número de WhatsApp sigue sin escritor**)* | — |
| [ADR-053](#adr-053) | El Plan 2016 de la UCC entra `DRAFT`, y lo que falta para publicarlo está escrito | ✅ `ACCEPTED` *(4 sep 2026 · 57 requisitos, `needs_review` en las 57; abre `C01-052`)* | — |
| [ADR-054](#adr-054) | El apartado «Materias» muestra una sola materia | ✅ `ACCEPTED` *(5 sep 2026 · **opción `B`**: `CTA-001` transporta la cursada. `A` y `C` quedan como decisión de diseño aparte)* | — |
| [ADR-055](#adr-055) | `C01-021` · las dos reglas de riesgo sin umbral quedan en modo humano hasta el piloto | ✅ `ACCEPTED` *(5 sep 2026 · `C01-021` pasa a `ANSWERED — RESIDUO ABIERTO`)* | — |
| [ADR-056](#adr-056) | `C01-044` · playbook y SLA provisionales del circuito de riesgo | ✅ `ACCEPTED` *(5 sep 2026 · provisionales y rotulados; no definen identidad ni superficie)* | — |
| [ADR-057](#adr-057) | `C01-030` · la identidad de quien revisa queda diferida hasta ADR-006 | ✅ `ACCEPTED` *(5 sep 2026 · `DEFERRED` con motivo; el interinato sigue vigente)* | — |
| [ADR-058](#adr-058) | `C01-029` · la regla determinística de readiness | ✅ `ACCEPTED` *(5 sep 2026 · tres estados, sin score ni porcentaje)* | — |
| [ADR-059](#adr-059) | `C01-019` · se conserva lo actual; la semántica completa es residuo de piloto | ✅ `ACCEPTED` *(5 sep 2026 · **no bloquea el MVP**; el gate `H` de `UX06` sigue)* | — |
| [ADR-060](#adr-060) | El temario es de la materia, no de la cátedra | ✅ `ACCEPTED` *(5 sep 2026 · el progreso sobrevive a un cambio de comisión **por construcción**)* | — |
| [ADR-061](#adr-061) | Período académico: año lectivo, semestre y anualidad con vocabulario cerrado | ✅ `ACCEPTED` *(5 sep 2026 · se pregunta en `/alta/carrera`; **el alta pasa a cuatro pasos**)* | — |
| [ADR-062](#adr-062) | La asignación de comisión: cuatro estados canónicos, en la cursada | ✅ `ACCEPTED` *(5 sep 2026 · `CONFIRMED`/`UNKNOWN`/`NOT_LISTED`/`NOT_APPLICABLE`)* | — |
| [ADR-063](#adr-063) | Horarios: dos propietarios, procedencia obligatoria y estado explícito | ✅ `ACCEPTED` *(5 sep 2026 · se usan sin corroborar y **no se elevan**)* | — |
| [ADR-064](#adr-064) | La superposición con una clase se valida en el `Commitment`, no en el ADE | ✅ `ACCEPTED` *(5 sep 2026 · el ADE no agenda)* | — |
| [ADR-065](#adr-065) | La electiva todavía no elegida persiste como `PENDING_SELECTION` | ✅ `ACCEPTED` *(5 sep 2026 · exige relajar el `CHECK` `una_sola_forma`)* | — |
| [ADR-066](#adr-066) | El Gantt de preparación es `UX02`, no una superficie nueva | ✅ `ACCEPTED` *(7 sep 2026 · no se crea `UX10`; el registro de CTAs no se toca)* | — |
| [ADR-067](#adr-067) | El estudiante da de alta su propia evaluación | ✅ `ACCEPTED` *(7 sep 2026 · reabre la Etapa 0.4 · **`CTA-020`: el registro pasa a 20**)* | — |
| [ADR-068](#adr-068) | La duración entra al modelo académico | ✅ `ACCEPTED` *(7 sep 2026 · cinco columnas · **los minutos por tema no se persisten**)* | — |
| [ADR-069](#adr-069) | `session_kind` se propone, no se importa | ✅ `ACCEPTED` *(7 sep 2026 · 25% de falsos positivos medidos)* | — |
| [ADR-070](#adr-070) | El factor de estudio es un **piso** versionado, no un valor | ✅ `ACCEPTED` *(7 sep 2026 · `1.5`, constante y no tabla)* | — |
| [ADR-071](#adr-071) | Los prerequisitos los aprueba el estudiante sobre su cursada | ✅ `ACCEPTED` *(7 sep 2026)* | — |
| [ADR-072](#adr-072) | Qué muestra la barra, y qué tiene prohibido mostrar | ✅ `ACCEPTED` *(7 sep 2026 · cobertura ≠ readiness)* | — |
| [ADR-073](#adr-073) | La disponibilidad se declara, y el reparto entre materias es una proyección | ✅ `ACCEPTED` *(7 sep 2026 · **no bloquea el alta**)* | — |
| [ADR-074](#adr-074) | El Personal Engine calibra **el trabajo**, no la vida del estudiante | ✅ `ACCEPTED` *(7 sep 2026 · el multiplicador nunca baja de `1.0`)* | — |
| [ADR-075](#adr-075) | Las respuestas de la psicopedagoga sobre tiempo y carga | ✅ `ACCEPTED` *(7 sep 2026 · **la pantalla del déficit no estaba aprobada**)* | `B6.17` |
| [ADR-076](#adr-076) | Tres perfiles operativos, y la superficie académica **no autorizada todavía** | ✅ `ACCEPTED` *(8 sep 2026 · sólo informe de solo lectura)* | **Toda construcción de la superficie** |
| [ADR-077](#adr-077) | El área «Materias» se construye: lista primero, materia después | ✅ `ACCEPTED` *(8 sep 2026 · cierra `A` y `C` de ADR-054 · **sin Gantt del período**)* | El Gantt cruzado |
| [ADR-078](#adr-078) | El Gantt del período es una ventana, no un presupuesto | ✅ `ACCEPTED` *(8 sep 2026 · **corrige a ADR-077**: no se pisa con el reparto)* | Horarios de cursada (ADR-062) |
| [ADR-079](#adr-079) | El andamio para probar el MVP: por dónde entra el contenido y quién dispara el loop | ✅ `ACCEPTED` *(8 sep 2026 · **se borra con ADR-006**)* | `C01-030`, el scheduler, la ingesta del estudiante |
| [ADR-080](#adr-080) | Enriquecimiento académico con IA — **candidato, no decidido** | 🟡 `PROVISIONAL — CANDIDATO` *(8 sep 2026 · **faltan rúbrica, revisión clínica y muestra**)* | **Todo uso productivo** |
| [ADR-081](#adr-081) | Una reingesta **borra el progreso del estudiante**: `topic` gana clave natural y deja de borrarse | ✅ `ACCEPTED` *(8 sep 2026 · **defecto medido**, no hipótesis)* | — |
| [ADR-082](#adr-082) | La Bitácora **es de una materia**: `CTA-009` transporta la cursada | ✅ `ACCEPTED` *(9 sep 2026 · corte 1 de `cursado-de-materia.md` · **segunda aplicación de ADR-054**)* | — |
| [ADR-083](#adr-083) | El bloque horario existe, entra por la ingesta y **no toca el reparto** | ✅ `ACCEPTED` *(9 sep 2026 · construye ADR-063 · **sin `kind` ni `schedule_status`**)* | El cuarto paso del alta (ADR-062), el conflicto de ADR-064 |
| [ADR-084](#adr-084) | El compromiso **no se confirma encima de una clase** | ✅ `ACCEPTED` *(9 sep 2026 · construye ADR-064 · **falta la segunda salida**)* | «Corregir el bloque» necesita el cuarto paso del alta |
| [ADR-085](#adr-085) | `UX02` se rearma alrededor del **Gantt por tema** | ✅ `ACCEPTED` *(9 sep 2026 · layout del owner · **sin `dominado`, `nivel` ni `3/3`**)* | El checklist de Confianza (corte 2) |
| [ADR-088](#adr-088) | **El espacio de trabajo**: los objetos abiertos, y ADR-019 queda `SUPERSEDED` | ✅ `ACCEPTED` *(10 sep 2026 · decidido por el owner · **los seis requisitos del multiventana, cumplidos**)* | — |
| [ADR-088 · Enm. 1](#adr-088-enmienda-1) | **La ventana interna**: la ficha despliega, minimiza y cierra | ✅ `ACCEPTED` *(10 sep 2026 · pedida por el owner · **el panel consulta, la superficie trabaja**)* | — |
| [ADR-088 · Enm. 2](#adr-088-enmienda-2) | **El marco**: se arrastra, se estira, se expande y recuerda dónde quedó | ✅ `ACCEPTED` *(10 sep 2026 · pedida por el owner · **«marco», no «ventana»: `A-04`**)* | — |
| [ADR-088 · Enm. 3](#adr-088-enmienda-3) | **El escritorio**: abrir va a la materia, la superficie se minimiza y las ventanas conviven | ✅ `ACCEPTED` *(10 sep 2026 · pedida por el owner · **retira la trampa de foco de la Enm. 1**)* | — |
| [ADR-088 · Enm. 4](#adr-088-enmienda-4) | **El movimiento**: la ventana sale de su ficha y vuelve a entrar | ✅ `ACCEPTED` *(11 sep 2026 · pedida por el owner · **§2.5, y `prefers-reduced-motion` la apaga**)* | — |
| [ADR-088 · Enm. 5](#adr-088-enmienda-5) | **El nombre y el color**: cómo se escribe un objeto y cómo se distingue de otro | ✅ `ACCEPTED` *(11 sep 2026 · pedida por el owner · **presentación, no renombre**)* | [ADR-075](#adr-075) |
| [ADR-089](#adr-089) | `UX01` gana la capa **«anticipar»**: próxima evaluación y mapa de 14 días | ✅ `ACCEPTED` *(10 sep 2026 · **sin contrato nuevo**: reusa `GET /api/materias`)* | — |
| [ADR-090](#adr-090) | El **radar académico** de `UX01` | 🟡 `PROPOSED` — **no se construye** | `C01-021`, `C01-036`, `C01-044` |
| [ADR-091](#adr-091) | La fila del índice es un solo destino, y la miga nombra el objeto | ✅ `ACCEPTED` *(10 sep 2026 · pedido del owner)* | — |
| [ADR-092](#adr-092) | **Dos materias del Plan 2016 se llamaban igual**: `ARQUITECTURA DE COMPUTADORAS I` y `II` | ✅ `ACCEPTED` *(11 sep 2026 · **con los programas oficiales delante**)* | [ADR-053](#adr-053), [ADR-086](#adr-086) |
| [ADR-093](#adr-093) | **`UX01` es un tablero**: evaluaciones en dos opciones, riesgos de planificación `PLAN-v0.1` y los próximos 7 días | ✅ `ACCEPTED` *(11 sep 2026 · **decidido por el owner con la referencia delante**)* | [ADR-089](#adr-089), [ADR-090](#adr-090), [ADR-072](#adr-072), [ADR-073](#adr-073) |
| [ADR-094](#adr-094) | **El cuadro de hoy**: clases con `Un.` y aula, *Podés avanzar* y horarios; el bloque horario gana el aula (simulada) | ✅ `ACCEPTED` *(11 sep 2026 · pedido del owner)* | [ADR-093](#adr-093), [ADR-062](#adr-062), [ADR-083](#adr-083) |

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

<a id="adr-005"></a>
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

**Estado:** `ACCEPTED` · 28 ago 2026 · **enmendado el 3 de septiembre de 2026** ([Enmienda 1](#adr-008-enmienda-1))
**Toca:** `architecture.md`, `roadmap.md`, `package.json`, `next.config.ts`.

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

<a id="adr-008-enmienda-1"></a>
### Enmienda 1 — la actualización de seguridad de `next`

**Estado:** ✅ `ACCEPTED` · 3 de septiembre de 2026
**Ratificada por:** **Conrado Verzini** · CTO
**Ejecutada por:** el Product Owner, opción A del brief, 2–3 de septiembre de 2026.
**Cierra:** las tres vulnerabilidades `high` heredadas del árbol del prototipo.
**Evidencia:** [`brief-adr-008-seguridad.md`](brief-adr-008-seguridad.md) §10 y
[`adr-008-firma-cto.md`](adr-008-firma-cto.md).

#### Qué se decide

`next` y `eslint-config-next` pasan de `16.2.6` a **`16.3.4`**, fijadas **exactas** y sin tocar
React. `postcss` y `sharp` salen del rango afectado como consecuencia: los traía `next`, no
`package.json`.

**Por qué `16.3.4` y no `16.3.0`:** `16.3.0` es el mínimo que corrige, pero elegirlo dejaba afuera
cuatro releases de parches por un delta despreciable. Ningún parche de la línea `16.2` servía: el
rango afectado llega hasta `16.3.0-preview.10`.

**Por qué el pin sigue exacto:** el rango `^` no haría entrar solo el próximo parche —con lockfile
sólo habilita, y hay que renovarlo explícitamente—, así que cambiarlo no compraba nada y sí volvía
implícita una decisión de stack. Automatizar actualizaciones queda como decisión separada, sin abrir.

**Y `agentRules: false` en `next.config.ts`:** desde `16.3.4`, `next dev` inyecta un bloque de reglas
dentro de `AGENTS.md`, que en este repositorio es normativo, y lo reescribe solo cada vez que Next
cambia ese texto. Se desactiva en el origen, no administrando el síntoma. Que el contenido de un
archivo normativo pueda cambiar por una actualización de dependencias, sin decisión humana, es
exactamente lo que este proyecto documenta para no permitir.

#### Fundamento del CTO

> En esta etapa priorizamos avanzar rápidamente hacia un MVP observable y evaluable. No buscamos
> optimizar prematuramente la arquitectura ni frenar el desarrollo por decisiones internas que no
> afectan el comportamiento del producto.
>
> La implementación es aceptable porque mantiene coherencia técnica, elimina las vulnerabilidades
> detectadas, conserva las versiones fijadas, evita modificaciones automáticas de archivos
> normativos y deja los cambios identificables en commits y ADRs.
>
> El criterio para continuar será el siguiente: los cambios pueden resolverse de la manera más
> simple que permita avanzar, siempre que sean explícitos, trazables, reversibles y verificables. Si
> más adelante una decisión necesita modificarse, debe poder identificarse qué cambió, por qué
> cambió y qué partes del sistema afecta.
>
> Autorizo el push de la rama para no bloquear el avance del MVP. Esta autorización publica el
> trabajo existente, pero no implica por sí sola autorización de merge a la rama principal ni de
> despliegue.

⚠️ **Los cuatro criterios del último párrafo —explícito, trazable, reversible y verificable— rigen de
acá en adelante**, no sólo esta enmienda. Una solución simple es aceptable; una que no se pueda
identificar, deshacer o comprobar, no.

#### Vulnerabilidades residuales

**Ninguna.** `npm audit` reporta **0** en las cinco severidades —`info`, `low`, `moderate`, `high` y
`critical`—, verificado contra el árbol instalado. No hay mitigación que documentar porque no queda
nada que mitigar.

#### Alcance de la autorización de push

**Autorizado:** push de `feat/fase-0-track-a` a `origin`. Publica el trabajo existente de la rama,
que incluye etapas ajenas a este ADR.

**No autorizado por esta firma:** merge a la rama principal, y despliegue. Las dos siguen necesitando
decisión propia, y el despliegue además sigue bloqueado por [ADR-006](#adr-006) para cualquier dato
real.

#### Consecuencias

- Los cinco gates quedaron en verde sin desvío contra la baseline: **953 tests en 52 archivos** y
  **275 comprobaciones** de `db:verify` con `db:reset` completo, más el recorrido del focus group a
  1440 y 360 px y el del MVP entero.
- El aviso de npm *"outside the stated dependency range"* se conserva: es consecuencia del pin
  exacto, no un defecto.
- Queda **una** deuda de higiene del entorno, fuera de este ADR: el `package-lock.json` huérfano del
  directorio padre. No bloqueante — el build sale `exit 0`.
- **La limitación de trazabilidad se conserva registrada:** el trabajo no se hizo en una rama
  aislada aunque el repositorio existía. Se aisló después por staging selectivo; `e703d10` es
  revisable y promovible por sí solo.

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

<a id="adr-019"></a>
## ADR-019 — El dock inferior no se construye, y la primitiva `Ausencia` ocupa su etapa

**Estado:** ⚠️ `SUPERSEDED` por [ADR-088](#adr-088) · 10 sep 2026 — **en su punto 1 solamente.**
El punto 2 (*el breadcrumb no se reemplaza*) y el punto 4 (*la primitiva `Ausencia`*) **siguen vigentes**.
Se conserva entero, con su fecha: **no se equivocaba cuando se escribió**, y caducó una premisa suya
—*«Achieve no tiene dos objetos abiertos a la vez»*— que ADR-077, ADR-082, ADR-085 y ADR-086 volvieron falsa.

**Estado original:** `ACCEPTED` · 30 ago 2026
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

<a id="adr-020"></a>
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

<a id="adr-021"></a>
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

<a id="adr-022"></a>
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

<a id="adr-023"></a>
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

<a id="adr-024"></a>
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
| ~~`npm audit` — 3 `high`~~ | ✅ **Cerrada** el 3 de septiembre de 2026 por la [Enmienda 1 de ADR-008](#adr-008-enmienda-1). `npm audit`: **0** en las cinco severidades |
| `C01-030` — modelo de usuario institucional | `OPEN`. Sin él no hay endpoints de institución |
| Identidad de docente en material ingerido | Abierta por [ADR-023](#adr-023) |

**Cada versión provisional queda marcada en el código con el contrato que la reemplaza.** El riesgo
real de un MVP no es tomar atajos: es olvidarse de cuáles se tomaron.

> ⚠️ **Corrección de dato — 3 de septiembre de 2026.** La fila de `npm audit` decía que cerrarla
> *"sube la mayor de Next"*. **Es falso:** `16.2.6 → 16.3.4` es un **minor**. Lo que dispara el
> *"outside the stated dependency range"* de npm es que `package.json` fija la versión **exacta,
> sin `^`**. El texto original se conserva tachado: era la **cuarta copia** de ese error, y la
> exageración explica parte de por qué la deuda se difirió cuatro días.

---

<a id="adr-004"></a>
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

<a id="adr-026"></a>
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

<a id="adr-027"></a>
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

Fuera del roadmap seguía en pie la deuda de [ADR-008](#adr-008): **3 vulnerabilidades `high`**, con
la restricción del owner de no correr `npm audit fix --force` sobre la rama principal.

> ✅ **Cerrada el 3 de septiembre de 2026** por la [Enmienda 1 de ADR-008](#adr-008-enmienda-1).
> `npm audit`: **0** en las cinco severidades. La restricción se respetó: la versión la eligió el
> ADR, no el comando.

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

<a id="adr-038"></a>
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

---

<a id="adr-039"></a>
## ADR-039 — Hay pantalla de ingreso, y no es una superficie de producto

**Estado:** ✅ `ACCEPTED` · 3 de septiembre de 2026 · **decidido por el Product Owner**
**Toca:** `app/login/`, `lib/client/api.ts`, `lib/client/superficie.ts`, `components/shell/`.
**Relacionado:** [ADR-006](#adr-006) (bloqueo de datos reales), `C01-030`,
[`platform-integration-contract.md`](platform-integration-contract.md) §1.

### Contexto

El spec define **nueve superficies** (`UX01`–`UX09`) y **ninguna es un login**. Hasta acá eso se
respetó literalmente: la identidad se daba de alta fuera del producto con `npm run db:sesion`, y
`lib/client/api.ts` abría sesión sola con `NEXT_PUBLIC_DEMO_*` cuando no había ninguna.

Eso alcanzaba para el MVP sintético y **no alcanza para nada más**. El propio código lo decía:
*"el spec no tiene pantalla de login y acá no se inventa una"*. Inventarla era romper la regla 1 de
`AGENTS.md`; la decisión la toma una persona, y la tomó el Product Owner.

También quedó a la vista el hueco más grande del producto: entre el `authorized: true` del CRM y la
primera acción del estudiante **no hay ninguna pantalla definida**. Este ADR cierra el primer tramo
—identificarse— y **no** el resto: el onboarding progresivo del spec §19 sigue sin construir.

### Decisión

**Existe `/login`**, con email y contraseña contra Supabase Auth.

**No es `UX10`.** No entra al registro canónico de navegación: `lib/navigation/` sigue teniendo nueve
nodos y hay guard que verifica que `UX10` no existe. No es una superficie de producto —no proyecta
estado del estudiante ni ofrece una acción de dominio—: es la puerta.

**El navegador ya no abre sesión solo.** `tokenDeSesion()` pasa a leer únicamente la sesión que ya
existe. Con auto-login, una pantalla de ingreso sería teatro: no decidiría nada, porque la sesión ya
estaría abierta antes de llegar.

**Sin sesión, las nueve superficies mandan a `/login`** y vuelven a donde estaban después de entrar.
La redirección vive en `useSuperficie`, en un solo lugar.

### Lo que esta pantalla NO hace, y por qué

| | |
|---|---|
| **No ofrece crear una cuenta** | Quién puede entrar lo decide el **padrón del CRM**, y la Plataforma hace cumplir esa decisión. Un alta desde este formulario es exactamente el camino por el que una persona real entraría sin padrón, con [ADR-006](#adr-006) todavía `PROVISIONAL` |
| **No recupera contraseña** | Manda un mail a una persona |
| **No distingue "email inexistente" de "contraseña incorrecta"** | Distinguirlos convierte el formulario en un detector de quién está en el padrón |
| **No valida contra el CRM** | El endpoint `authorize` es del CRM y su integración está diferida por [ADR-035](#adr-035). Mientras tanto, quién existe en `auth.users` lo sigue decidiendo una operación fuera del producto |

⚠️ **Esto no levanta el gate de [ADR-006](#adr-006).** Que exista un login no autoriza a que entre
una persona real: sigue habiendo bloqueo absoluto hasta el dictamen legal. Lo que cambia es que la
sesión ahora se abre con una credencial escrita por quien entra, y no con dos variables de entorno.

### Alternativas

- **Seguir sin login, con auto-sesión.** Ventaja: cero superficie nueva y literalidad total con el
  spec. Desventaja: no hay forma de que dos identidades usen el mismo navegador, ni de salir, y el
  hueco entre el alta y la primera acción sigue sin tener dónde empezar.
- **Login con alta incluida.** Ventaja: un estudiante nuevo entra solo. Desventaja: **contradice el
  contrato del CRM y perfora ADR-006.** Descartada.
- **Middleware que proteja las rutas.** Ventaja: el gate corre antes de renderizar. Desventaja:
  `next.config.ts` y el relevamiento de exposición de [ADR-008](#adr-008) registran que **no hay
  `middleware.ts`**, y varios avisos de Next dependen de que siga sin haberlo. Se difiere.

### Consecuencias

- `NEXT_PUBLIC_DEMO_EMAIL` y `NEXT_PUBLIC_DEMO_PASSWORD` dejan de abrir sesión. Siguen sirviendo como
  las credenciales que **una persona escribe** en el formulario de la demo.
- Cerrar sesión hace **navegación dura**, no `router.replace`: tiene que tirar todo el estado en
  memoria, no sólo el token.
- La auditoría `I-01` pasa a nombrar sus excepciones —la raíz y `/login`— en vez de contar *"todas
  menos una"*. Una superficie real que se olvide de `?escenario=` sigue rompiendo el test.
- **Queda abierto lo que este ADR no cierra:** el onboarding del spec §19 —orientación, mapa
  académico mínimo, disponibilidad— y qué ve un estudiante recién habilitado que todavía no tiene
  cursadas. Hoy caería en el vacío de `UX01`, que dice *"no hay una acción recomendada"*: una
  afirmación sobre el mundo que en ese caso nadie puede hacer.

---

<a id="adr-040"></a>
## ADR-040 — El camino de ejecución escribe en Postgres, y `C01-009` queda cerrada

**Estado:** ✅ `ACCEPTED`
**Fecha:** 3 de septiembre de 2026 · **decidido por el CTO**
**Registro:** ⚠️ **retroactivo.** La decisión se tomó y se implementó el 3 de septiembre; este ADR la
registra en `docs/` a partir de los commits que la ejecutan (`91a490c`, `679308c`, `d18b397`,
`ebc8d2c`, `8ce1cd5`, `8ab58d4`, `cd893f9`). **No la toma este documento.** Si algún punto no refleja
lo que el CTO decidió, se corrige por ADR posterior, no editando éste.
**Cierra:** `C01-009` — *mutaciones de `Action` e idempotencia*.
**Toca:** `roadmap.md` (Fase B6.8), `pending-decisions-annex.md`, `product.md` §10.
**Etapa:** B6.8

### Contexto

Después de la B6.7 el backend tenía **el dominio construido y sin quién lo llamara**, en cinco
lugares distintos:

- El **ADE** —Engine puro, validador determinista, repositorio y `recomendarPara`— existía desde la
  Fase B4 y **sus únicos llamadores eran los tests**. `UX01` proyectaba *"sin acciones por ahora"*
  contra la base, y no porque no hubiera nada que recomendar.
- **No existía `POST /api/compromiso`:** ninguna operación creaba el primer `Commitment` de una
  `Action`.
- **`/api/evidencia` era sólo `GET`:** no había forma de entregar contra Postgres.
- **`registrarProgreso` estaba en el composition root sin ningún caller**, así que nada movía una
  `Evidence` de `SUBMITTED` y el progreso nunca se materializaba.
- **Ninguna pantalla usaba los endpoints:** la CTA de `UX04` sólo navegaba.

Es el mismo hueco que la Etapa B4.2 le había cerrado al reloj, repetido del otro lado del loop:
**construido, probado y sin ejecución operativa**.

### Decisión

**El camino principal del estudiante escribe en Postgres, en cinco tramos.** Cada uno es una
operación explícita; ninguno infiere un hecho de un estado.

| Tramo | Qué decidió |
|---|---|
| **Disparador del ADE** | Un endpoint con secreto de servicio más un script para la demo — **la misma forma que el repositorio ya eligió para el reloj**, en vez de inventar una nueva. No toca dominio: qué unidad conviene lo sigue decidiendo el Engine puro, y si la recomendación se puede mostrar lo sigue decidiendo el validador **antes** de materializar |
| **`Commitment`** (`D1·A`, `D2·A`) | La fila **nace en `CONFIRMED`**: `DRAFT` no se persiste, así que *"hasta que confirmes no queda registrado"* deja de ser copy y pasa a ser propiedad del schema. El `GET` devuelve una **propuesta proyectada** y no escribe nada. La clave de idempotencia la genera el cliente; repetida con el mismo dueño, recurso y payload devuelve la fila existente, y con otro contenido responde `409` **sin exponer la fila** |
| **`Evidence`** (`D3·A`) | La entrega va **en dos tiempos** —firmar, subir, registrar— porque la clave del objeto se deriva del id de la evidencia y **el cliente no puede elegir la ruta**: si la eligiera podría pedir una firma para la carpeta de otra institución. Abandonar a mitad deja un objeto huérfano y **ninguna fila que afirme una entrega que no ocurrió**, que es el error caro de los dos. La fila nace `SUBMITTED` con las tres señales en `not_evaluated` —no en `none`, que afirmaría que alguien miró— y `validation_method` en `NULL` |
| **Validación y progreso** (`D4·A`, `D5·A`) | Operación declarativa **con secreto de servicio, nunca con el JWT del estudiante**: nadie valida su propia evidencia. Orquesta `SUBMITTED → SUFFICIENT → VALIDATED` y **después invoca** `registrarProgreso`. **El progreso no se infiere de que la evidencia esté `VALIDATED`** y el guard estático sigue valiendo. Reentrante en vez de transaccional —son dos entidades y el schema no ofrece una transacción—, con clave derivada de la evidencia (`I8`) |
| **Cierre de la `Action`** (`C01-009`) | Ver abajo |

### `C01-009`, cerrada — la causalidad, textual

> Una `Action` pasa de `COMMITTED` a `COMPLETED` cuando **una operación autorizada valida como
> suficiente** una `Evidence` vinculada a un `Commitment` **de esa misma `Action`**.

```
Evidence suficiente → validación registrada → progreso registrado → Action completada
```

**Cada flecha es una operación que ocurre porque la anterior ocurrió.** Ninguna se infiere de un
estado: `VALIDATED` sigue sin producir `ProgressUpdated`, y la `Action` **no se cierra por tener una
evidencia validada**, sino porque esta operación la cierra.

Las seis reglas:

1. **Sólo la operación con secreto de servicio cierra.** La ruta de subida no toca el lifecycle de la
   `Action`.
2. **Cadena causal verificable, leída de una sola vez:** la `Action` de la evidencia, el `Commitment`
   al que se adjuntó y la `Action` de **ese** commitment tienen que coincidir, con el mismo estudiante
   de los dos lados. Si no cierra: `CADENA_INVALIDA`, sin escribir nada y **sin decir cuál de los tres
   falla**.
3. **Insuficiente** → `SUBMITTED` pasa a `INSUFFICIENT`, la `Action` se queda en `COMMITTED` y la
   entrega anterior no se toca.
4. **`explicit_no_change = TRUE` cierra igual:** cumplir la acción y avanzar académicamente son hechos
   distintos ([ADR-020](#adr-020)).
5. **Reentrante de punta a punta.** Ni un `ProgressUpdated` ni un `ActionCompleted` de más.
6. **La `Action` completada no se borra ni se reutiliza.**

### El hallazgo que obligó a ampliar el cierre

**El `Commitment` quedaba `CONFIRMED` para siempre**, y el reloj lo habría pasado a `MISSED` al vencer
su hora: **un incumplimiento falso sobre trabajo hecho y validado**. El cierre recorre ahora también
su máquina —`CONFIRMED → STARTED → COMPLETED`— antes de cerrar la `Action`. **El original no se edita
para parecer otra cosa:** cada escalón publica su hecho, que es el mismo criterio del invariante *"un
`Commitment` `MISSED` nunca se edita para parecer cumplido"*.

### Dos columnas que obligaron a decidir sin inventar

`reviewer_id` y `product_event.actor_id` son `uuid`, y **quien valida hoy es identidad externa sin
FK**. En vez de fabricar un UUID para llenarlas, `reviewer_id` queda `NULL` y el actor del evento es
`null` —lo produjo un proceso, no una persona—, con el validador declarado en el payload.
**`C01-030` sigue abierto y esto no lo adelanta.**

### Consecuencias

- **`C01-009` pasa a `CLOSED`** en [`pending-decisions-annex.md`](pending-decisions-annex.md). El
  registro queda en **40 `OPEN` · 9 `ANSWERED — RESIDUO ABIERTO` · 2 `CLOSED`**.
- **Sin migraciones.** Los cinco tramos usan columnas y `UNIQUE` que ya existían: el schema no cambió.
- **El ADE corre después del cierre como paso derivado y reintentable.** Si falla, la acción sigue
  completada y el comando lo dice. Hay **guard estático** de que el Service de validación no importa
  ni menciona el motor: lo que se garantiza es que **no exista un camino por el que el ADE pueda
  invalidar un cierre que ya ocurrió**.
- **En el camino real manda el registro canónico de CTAs, no el guion del focus group.** `CTA-007`
  tiene destino `null`, así que entregar deja al estudiante viendo *"pendiente de validación"*. El
  guion sigue mandando bajo `?escenario=`.
- **El copy de `SUBMITTED`** pasa a *"Evidencia recibida · pendiente de validación"*.
- **`components/screens/*` no se tocó:** el cableado vive en `app/(student)/*` y las pantallas siguen
  siendo proyección pura.
- ⚠️ **El instante que propone el compromiso quedó marcado en el código como `PROVISIONAL — REVISAR
  ANTES DE INCORPORAR ESTUDIANTES REALES`**, ratificado por el CTO para el MVP sintético. Es
  reversible sin migrar: **lo que se persiste es el instante que el estudiante confirmó, no la regla
  que lo propuso**.
- **Nada de esto levanta [ADR-006](#adr-006).** Todo corre sobre datos sintéticos.

---

<a id="adr-041"></a>
## ADR-041 — Qué cuenta como «actividad» del estudiante a efectos de facturar

**Estado:** ✅ `ACCEPTED` — **4 de septiembre de 2026, decidido por el Product Owner** (opción A).
Fuente literal: [`respuesta-po-flujos-crm-source.md`](respuesta-po-flujos-crm-source.md).
**Fecha de apertura:** 3 de septiembre de 2026
**Origen:** `crm-propuesta-flujos-actividad-vinculacion-v0.1.md` §1 (Flujo D) y
[`respuesta-crm-flujos-d-e-v0.1.md`](respuesta-crm-flujos-d-e-v0.1.md) §1.3.
**Desbloquea:** el emisor del **Flujo D**, cuya construcción sigue diferida por [ADR-035](#adr-035).

### La decisión

**Se aprueba el conjunto versionado de eventos facturables**, tal como estaba propuesto y como el CRM
lo había aceptado: `EvidenceSubmitted`, `ProtocolStepCompleted`, `ProgressUpdated` y
`RescueSucceeded`. Los cuatro **ya se emiten**.

**No cuentan** `CourseViewed`, `ActionAccepted` ni `CommitmentConfirmed` — *"mirar, aceptar o
comprometerse no equivale a producir"*.

> ⚠️ **El pedido opcional del CRM quedó rechazado, y es una decisión, no un olvido.** Habían pedido
> `ActionAccepted` y `CommitmentConfirmed` **marcados como no facturables**, para medir el embudo
> *vinculado → aceptó → produjo*. El owner los listó entre los que **no cuentan como actividad
> facturable**, que es la pregunta que se le hizo; **no se pronunció sobre emitirlos con la marca
> apagada**. Hasta que lo haga, **no se emiten**: mandar un evento no pedido es inventar alcance.

**El conjunto pasa a ser parte del contrato Plataforma–CRM:** agregar, quitar o cambiar un evento
facturable **exige una versión nueva acordada entre las dos partes**, y no puede modificarse sólo con
un commit.

**Y la precisión que pedimos quedó firmada:** *"esta restricción no alcanza al catálogo general: la
Plataforma puede agregar eventos nuevos no facturables sin modificar el contrato"*.

**No define precios** ni habilita transmitir eventos reales mientras [ADR-006](#adr-006) siga abierto.

### Contexto — cómo se llegó acá

El CRM pide que la Plataforma le empuje **eventos de actividad real** —*"produjo, no miró"*— y los usa
para dos cosas que no son técnicas: **facturar** (US$X por alumno único activo por institución/mes) y
**graduar operadores** (al primer evento de actividad de un alumno vinculado). El CRM **no interpreta
el `type`**: cuenta al alumno como activo con que llegue ≥1 evento. **Qué cuenta como producir lo
decide la Plataforma**, y por eso la decisión aterriza acá.

La propuesta que la Plataforma tenía escrita —`platform-integration-contract.md` §2.1: *"sólo los
eventos de nivel `NEGOCIO`"*— **no sirve**, y se descubrió al contestar:

- **`EvidenceSubmitted` —la entrega, que es *el* caso de "produjo"— es nivel `TRANSICION`.** Con ese
  filtro, el evento más facturable del producto no viajaría.
- **`InterventionStarted` e `InterventionResolved` son `NEGOCIO` y los produce un operador**, no el
  estudiante. Facturar por ellos sería facturar porque alguien está en problemas.

**El nivel clasifica para qué sirve un evento, no quién lo produjo** ([ADR-027](#adr-027)).

### Opciones

| # | Opción | Consecuencia |
|---|---|---|
| **A** | **Una marca propia y explícita en el catálogo** —*"cuenta como actividad del estudiante"*— versionada y con su guard, independiente de `nivel` | El criterio queda declarado en un solo lugar, testeable, y se puede cambiar sin tocar el transporte. **Recomendada** |
| B | Reusar `nivel` con una lista de excepciones | Dos reglas para lo mismo. Es como se desincronizan los catálogos |
| C | Que el CRM reciba todo y filtre él | Contradice *"qué cuenta como producir lo decide la Plataforma"* y exporta ruido a un sistema que factura con eso |

**Lista candidata para la opción A**, de los eventos que hoy **efectivamente se emiten**:
`EvidenceSubmitted` (entregó), `ProtocolStepCompleted` (cerró un paso, una vez por vuelta —
[ADR-028](#adr-028)), `ProgressUpdated` (avanzó, con su resultado escrito) y `RescueSucceeded` (volvió
después de un incumplimiento).

**Y lo que la recomendación deja afuera a propósito:** `CourseViewed` —declarado `TELEMETRIA` con el
motivo escrito: *"abrir una pantalla no es un hecho de dominio"*—, `ActionAccepted` —aceptar no es
hacer— y `CommitmentCreated`: comprometerse tampoco es producir.

### Ampliación — 3 de septiembre de 2026, tras la v0.2 del CRM

El CRM **aceptó la lista candidata tal cual, sin agregar ni sacar**, y pidió algo que no habíamos
previsto y es correcto: **que la lista no viva solamente en nuestro catálogo**.

> *"Si mañana alguien agrega `CourseViewed` a esa marca, cambia lo que Achieve le factura a una
> institución y nadie de Achieve lo aprobó. Y el CRM no puede detectar lo que no se envió."*

Una marca que se cambia en un commit no puede ser la definición de una línea de factura. Así que
**lo que este ADR decida pasa a ser una cláusula versionada del contrato**, y moverla exige aviso y
acuerdo. El guard técnico sigue siendo nuestro; la garantía comercial es del contrato.

⚠️ **Con una precisión de redacción que la Plataforma pidió y que hay que conservar:** lo que queda
atado al contrato es **el conjunto de eventos marcados como facturables**, no el catálogo entero.
Agregar un evento nuevo **no facturable** no es un cambio de contrato — si lo fuera, el modelo de
eventos del producto quedaría congelado por un acuerdo comercial.

**El CRM también pidió, como opcional y no bloqueante**, recibir `ActionAccepted` y
`CommitmentCreated` **marcados no facturables**, para medir el embudo *vinculado → aceptó → produjo*.
`ActionAccepted` se emite hoy y no cuesta nada. **`CommitmentCreated` no existe como nombre emitido:**
el backend emite `CommitmentConfirmed`, y [ADR-027](#adr-027) prohíbe renombrarlo porque
`product_event` es append-only. Si se acepta el pedido, el `type` que viaja es `CommitmentConfirmed`.

### Lo que este ADR no decide

- **No decide el precio ni la unidad de facturación.** Eso es del contrato comercial.
- **No habilita a emitir.** Ningún evento con datos de una persona real viaja hasta el dictamen de
  [ADR-006](#adr-006).

---

<a id="adr-042"></a>
## ADR-042 — Dónde da el estudiante su WhatsApp, si es que lo da

**Estado:** ✅ `ACCEPTED` — **4 de septiembre de 2026, decidido por el Product Owner** (opción A).
Fuente literal: [`respuesta-po-flujos-crm-source.md`](respuesta-po-flujos-crm-source.md).
**Fecha de apertura:** 3 de septiembre de 2026
**Origen:** `crm-propuesta-flujos-actividad-vinculacion-v0.1.md` §2 (Flujo E) y
[`respuesta-crm-flujos-d-e-v0.1.md`](respuesta-crm-flujos-d-e-v0.1.md) §2.
**Desbloquea:** el tramo de alta que [ADR-039](#adr-039) dejó abierto, y con él los flujos **E** y
**E′**, cuya construcción sigue diferida por [ADR-035](#adr-035).
**Relacionado:** [ADR-006](#adr-006), [ADR-039](#adr-039), `C01-030`.

### La decisión

**Hay un tramo de onboarding** que captura el número de WhatsApp y el consentimiento explícito. Y el
owner decidió **más de lo que se le preguntó**: definió el orden entero del alta, que es el hueco que
[ADR-039](#adr-039) había dejado abierto.

**El orden aprobado, textual:**

| # | Tramo |
|---|---|
| 1 | El CRM responde `authorized: true` |
| 2 | **La Plataforma presenta el tramo de WhatsApp y consentimiento** |
| 3 | Continúa la orientación mínima |
| 4 | Si existe información académica suficiente, el estudiante entra a `HOY` |
| 5 | **Si todavía no existen materias cargadas, ve un estado de preparación académica**; no entra al vacío actual de `HOY` |

**Las seis reglas de producto:**

1. El consentimiento es **explícito, específico y no premarcado**.
2. **El estudiante puede rechazar u omitir WhatsApp sin perder el acceso.** No recibe acompañamiento
   por ese canal, y nada más.
3. Redacción legal, retención, base jurídica y tratamiento de datos reales quedan **subordinados a
   [ADR-006](#adr-006)**.
4. Mientras ADR-006 siga abierto, **todo se construye y prueba con identidades y teléfonos
   sintéticos**.
5. **La confirmación sólo puede afirmar** *"Guardamos tu número"* o *"Recibimos tu solicitud"*.
6. **Nunca** debe afirmar que el CRM vinculó el número, que existe un operador asignado o que alguien
   va a escribirle.

> Las reglas 5 y 6 son la respuesta del owner al hueco que la Plataforma había señalado: con el
> desempate por `occurredAt` que introdujo el CRM, **un evento puede acusarse con `202` y no
> aplicarse**, y el emisor no puede distinguirlo. La superficie confirma lo que el estudiante hizo, no
> un estado que la Plataforma no observa.

**La revocación tiene superficie propia: «WhatsApp y privacidad»**, accesible desde la cuenta o un
acceso visible equivalente, donde el estudiante puede **consultar si dio un número, reemplazarlo,
retirar el consentimiento y solicitar la desvinculación**.

⚠️ **Al revocar, la Plataforma registra la solicitud y emite `E′` cuando la integración esté
habilitada.** Hasta que haya confirmación observable del CRM, la interfaz dice **"Recibimos tu
solicitud de desvinculación"**, *no* *"WhatsApp desvinculado"*. **La revocación no espera a la
integración: el registro del pedido es local y ocurre igual.**

**El estado del estudiante sin materias, con su texto aprobado:**

> **Estamos preparando tu información académica.**
> Todavía no contamos con información suficiente para recomendarte una acción. Te avisaremos cuando
> tu recorrido esté listo.

⚠️ **Y con la prohibición explícita:** *"no debe mostrarse «no hay una acción recomendada», porque el
sistema todavía no está en condiciones de evaluar eso"*. Es la misma disciplina de *"sin datos no es
cero"*: **no evaluado no es lo mismo que evaluado y vacío.**

⚠️ **Este texto todavía no está en [`product.md`](product.md).** Se incorpora al inventario de copy
**cuando la etapa se construya**, citando la fuente; hasta entonces vive acá y en la fuente literal.

### Contexto — cómo se llegó acá

El CRM necesita mapear **teléfono → alumno** para acompañar por WhatsApp, y espera que la Plataforma
le avise el número cuando el estudiante lo vincula. Del lado de la Plataforma:

| Hecho | Dónde |
|---|---|
| La columna existe desde la primera migración de la capa del estudiante | `student.whatsapp TEXT`, rotulada *"dato personal: gateado por ADR-006"* |
| **Nadie la escribe** | Ninguna ruta, ningún Service, ningún repositorio |
| El repositorio **ni siquiera la selecciona** | Está escrito con su motivo |
| **No hay pantalla donde el estudiante lo escriba** | Las nueve superficies (`UX01`–`UX09`) no incluyen ninguna de cuenta o perfil |

El spec sí lo pone en la secuencia de alta —*"LOGIN / CUENTA │ WHATSAPP + ACOMPAÑANTE │ ORIENTACIÓN
MÍNIMA │ …"*, §19—, pero **ese onboarding no está construido**, y [ADR-039](#adr-039) lo dejó dicho:
*"entre el `authorized: true` del CRM y la primera acción del estudiante no hay ninguna pantalla
definida"*.

**Es la misma decisión que ese hueco**, y por eso conviene tomarla junto con él y no dos veces.

### Opciones

| # | Opción | Consecuencia |
|---|---|---|
| **A** | **Un tramo de alta con WhatsApp y consentimiento**, dentro del onboarding del spec §19 | Cierra el hueco de ADR-039 y el Flujo E de una sola vez, en el orden que el spec ya propone. **Recomendada** |
| B | Una pantalla de cuenta/perfil aparte | Superficie nueva fuera del spec, y el estudiante nuevo sigue sin tener dónde empezar |
| C | Que el número lo cargue el CRM y no viaje nunca desde acá | El Flujo E desaparece. Consistente con §2.4 de la respuesta —el teléfono es canónico en el CRM—, pero deja al estudiante dando su número por un canal que no es el producto |

### Lo que esta decisión arrastra, y hay que decidir con ella

1. **Consentimiento explícito** para la vinculación, en la misma pantalla donde se pide el número.
2. **Borrado que cruza el límite.** Hoy no hay cláusula que diga qué pasa en el CRM cuando el
   estudiante revoca o se le borra el dato acá. **Borrar de un lado no borra del otro**, y sin eso el
   derecho de supresión no es ejecutable.
3. **Procedencia:** el número entra declarado por el estudiante —`student`/`unverified`— y **la
   Plataforma no lo verifica ni lo reconcilia**. Si cambia por el canal del CRM, manda el CRM.

⚠️ **Nada de esto se construye antes del dictamen de [ADR-006](#adr-006):** un teléfono es un
identificador directo de una persona, y es el primer flujo del contrato que transporta uno.

### Ampliación — 3 de septiembre de 2026, tras la v0.2 del CRM

La v0.2 agregó dos cosas que **cambian lo que esta pantalla tiene que hacer**, y conviene tenerlas
antes de diseñarla, no después:

**1 · La pantalla también tiene que poder revocar.** El CRM propuso el **flujo E′**
(`POST /api/service/v1/whatsapp-unlink`), que es lo que hace **ejecutable** el derecho de supresión —
hasta ahora, del lado del CRM, `whatsapp_linked` **nunca volvía a `false`**. Si hay pantalla para dar
el número, tiene que haber camino para sacarlo.

**2 · La pantalla no puede prometer que el número quedó vinculado.** Con el desempate por
`occurredAt` + procedencia que introdujo el CRM, **un evento puede acusarse con `202` y no
aplicarse**, y el emisor no puede distinguir un caso del otro. La Plataforma **no observa** el estado
del CRM. La superficie confirma **lo que el estudiante hizo** —*"guardamos tu número"*— y **nunca**
afirma *"tu WhatsApp está vinculado"* ni *"te van a escribir"*. Es la misma disciplina por la que la
Plataforma no le dice al estudiante quién lo acompaña.

⚠️ **Y un requisito de orden que aparece con el borrado:** `whatsapp-unlink` se direcciona con
`platformStudentId`. **Se emite y se materializa en el outbox antes de borrar al estudiante de la
Plataforma.** Si el borrado elimina la fila primero, no queda a quién desvincular y el número queda
vivo del otro lado: **la mitad de un borrado, que es peor que ninguno porque parece hecho.**

---

<a id="adr-043"></a>
## ADR-043 — El orden de los cinco flujos al descongelar, y el smoke test cross-sistema

**Estado:** ✅ `ACCEPTED` — **4 de septiembre de 2026, decidido por el Product Owner**: sí a las dos
preguntas. Fuente literal:
[`respuesta-po-flujos-crm-source.md`](respuesta-po-flujos-crm-source.md).
**Fecha de apertura:** 3 de septiembre de 2026
**Origen:** `crm-respuesta-flujos-actividad-vinculacion-v0.2.md` §5, y
[`respuesta-crm-flujos-d-e-v0.2.md`](respuesta-crm-flujos-d-e-v0.2.md) §6.
**Relacionado:** [ADR-035](#adr-035), [ADR-041](#adr-041), [ADR-042](#adr-042), ítem 5 de
[ADR-005](#adr-005).

### La decisión

**Cuando [ADR-035](#adr-035) permita descongelar la integración:** los flujos **D y E/E′ se
implementan antes que A, B y C**, y **se corre el smoke test** con un estudiante completamente
sintético.

**El owner agregó un desempate que no estaba en la pregunta:** D y E/E′ pueden prepararse en
paralelo, y **si la capacidad obliga a secuenciarlos, va primero E/E′** —habilita la operación de
acompañamiento— y D **inmediatamente después** —habilita la medición facturable—. Es lo contrario del
orden en que el CRM los nombró, y está fundado.

⚠️ **El smoke test se corre al empezar el tramo de integración, no ahora.** Es la respuesta directa a
la advertencia de la Plataforma: correrlo hoy exige el cliente de firma, el outbox y provisionar el
secreto, que es exactamente lo que ADR-035 difirió.

**Los siete requisitos que deberá cubrir**, textuales: secreto compartido exclusivo de desarrollo;
firma y verificación real de mensajes; outbox mínimo durable; vinculación y desvinculación de un
teléfono sintético; emisión de al menos un evento facturable; reintento e idempotencia; y **evidencia
de recepción en los dos sistemas**.

**No se usan datos personales reales y el smoke test no levanta [ADR-006](#adr-006).**

### Contexto — cómo se llegó acá

El CRM **no pide cambiar la prioridad** de ADR-035 ni pone una fecha. Pide dos cosas concretas, y
deja escrita la consecuencia de no dárselas:

| Flujo | Qué habilita | Qué pasa mientras no se emita |
|---|---|---|
| **D · Actividad** | La **línea variable de la factura** y la graduación del alumno a cobertura plena | Achieve puede facturar **el fijo**; el variable **no tiene fuente** |
| **E · Vinculación** | **Toda la operación por WhatsApp** | Sin teléfono no hay asignación, no hay cola, **no hay conversaciones**. El padrón no trae teléfono y el inbound de un número desconocido se descarta |

Su frase, que conviene no suavizar: *"el Flujo E no es 'un flujo que falta', es la entrada de datos
del producto que Achieve vende"*.

### Las dos preguntas

**1 · ¿D y E salen primero de los cinco, antes de A/B/C?** Es un compromiso de **orden**, no de
calendario.

**2 · ¿Se corre un smoke test cross-sistema en dev, con alumno sintético?** Validaría HMAC, ventana
anti-replay, idempotencia y catálogo de errores de los cinco flujos a la vez.

### Recomendación de la Plataforma — a favor de las dos, con dos precisiones

**Sobre el orden: el argumento del CRM es bueno.** D y E habilitan **facturar y operar**; A/B/C
**mejoran** una operación que para entonces ya tiene que existir. Y su dato es correcto: **el Flujo E
no depende de `C01-021` ni de Meta**.

⚠️ **Pero el orden no alcanza.** El **Flujo D necesita [ADR-041](#adr-041)** y el **Flujo E necesita
[ADR-042](#adr-042)**, las dos `PENDING` y las dos del mismo Product Owner. Aunque el orden se acepte
mañana, **el trabajo no arranca hasta cerrarlas**: conviene llevar las tres juntas.

**Sobre el smoke test: el CRM tiene razón en que no toca [ADR-006](#adr-006)** — un alumno sintético
no es una persona, y [ADR-024](#adr-024) autoriza construir y probar sobre datos sintéticos. **Lo que
falta decir es que sí toca ADR-035**, y por eso la decisión es del owner:

1. Exige **el cliente HMAC y un outbox mínimo**, que es exactamente la construcción diferida.
2. Exige **acordar y provisionar el secreto entrante**, que es la **definición 3 de §11.1** del
   contrato — y con **un solo secreto para A, D, E y E′**, estrenarlo sin esquema de rotación es
   empezar por donde no conviene.

*"Cuesta un script del lado del emisor"* es cierto **si el emisor ya existe**, y no existe.

**Aun así lo recomendamos**, con un fundamento concreto: esta ronda de dos documentos ya produjo
**dos defectos de forma —el `422` con dos políticas y la firma HMAC especificada de dos maneras— que
sólo aparecen cuando alguien firma de verdad**. Un smoke test encuentra la clase de defecto que
ningún documento encuentra.

### Lo que este ADR no decide

- **No pone fecha.** El CRM tampoco la pidió.
- **No descongela ADR-035** para A, B y C.
- **No habilita datos reales.** [ADR-006](#adr-006) sigue siendo bloqueo absoluto, y el smoke test
  usa alumno sintético **precisamente para no tocarlo**.

---

<a id="adr-044"></a>
## ADR-044 — «Contanos» es voseo: sale de la lista del guard, no se afloja el guard

**Estado:** ✅ `ACCEPTED` — **4 de septiembre de 2026, decidido por el Product Owner** (opción A).
Fuente literal: [`respuesta-po-decisiones-abiertas-source.md`](respuesta-po-decisiones-abiertas-source.md) §1.
**Toca:** `lib/content/es-AR.ts`, `tests/auditoria-conformidad.test.ts`.

### La decisión

**Se aprueba la copy del fixture: «Contanos cómo te fue (requerido)».** Y `Contanos` **sale de la
lista de imperativos prohibidos** del guard `C-01`, *"porque es voseo correcto"*.

⚠️ **Con un límite explícito, y es la mitad de la decisión:** *"el cambio debe ser específico: **no se
afloja el resto del control** ni se modifican las otras palabras prohibidas"*. Las otras cinco
—`Entrega`, `Sube`, `Resuelve`, `Elige`, `Agrega`— son tuteo y **siguen prohibidas**.

### Por qué importa cómo se hizo

El equipo detectó el conflicto y **no tocó el guard**: usó una copy provisional y levantó la decisión.
Aflojar un control para que pase el cambio propio es lo que un control existe para impedir — y la
diferencia entre eso y esto es que **acá la lista estaba equivocada y lo dijo su dueño**.

---

<a id="adr-045"></a>
## ADR-045 — La reflexión se escribe dentro de la Evidencia, no en una pantalla nueva

**Estado:** ✅ `ACCEPTED` — **4 de septiembre de 2026, decidido por el Product Owner**.
Fuente literal: [`respuesta-po-decisiones-abiertas-source.md`](respuesta-po-decisiones-abiertas-source.md) §2.
**Desbloquea:** la superficie que la [Fase B6.10](roadmap.md) dejó pendiente.
**Toca:** `components/screens/evidencia.tsx` — **autorizado explícitamente**, y por eso deja de aplicar
la regla 6 para este cambio.

### La decisión

**La reflexión se escribe dentro de `UX05`, como parte de la misma entrega.** El fundamento, textual:
*"la reflexión y la evidencia forman parte de la misma intención del estudiante. **No se crea un flujo
independiente ni una pantalla nueva**"*.

| | Comportamiento aprobado |
|---|---|
| **Obligatoria** | El campo aparece **desplegado y visible antes del CTA principal** |
| **Opcional** | Puede quedar **contraído** detrás de una acción secundaria |
| **Copy del campo** | **«Contanos cómo te fue»** |
| **CTA principal** | Sigue siendo **«Enviar evidencia»** — no cambia |
| **Obligatoria y vacía** | La entrega **no se ejecuta** y se muestra: *"Contanos cómo te fue para enviar la evidencia."* |

**Y no hace falta esperar un rediseño:** *"se reutiliza la composición visual existente de Evidencia y
el fixture aprobado"*. Es lo que destraba el trabajo sin las capturas de `docs/diseño/`.

⚠️ **Respetando las validaciones que ya existen en el servidor.** El bloqueo real vive en
`entregarEvidencia` desde la Fase B6.10 ([ADR-026](#adr-026) hecho cumplir): **el campo desplegado no
lo reemplaza**, lo acompaña. Una pantalla que valide y un servidor que no es como estaba antes, al
revés.

---

<a id="adr-046"></a>
## ADR-046 — `C01-010`: cuándo una renegociación es elegible

**Estado:** ✅ `ACCEPTED` — **4 de septiembre de 2026, decidido por el Product Owner**.
Fuente literal: [`respuesta-po-decisiones-abiertas-source.md`](respuesta-po-decisiones-abiertas-source.md) §3.
**Responde:** `C01-010` → **`ANSWERED — RESIDUO ABIERTO`**: la regla *"se adopta para el MVP y deberá
revisarse con evidencia de uso antes del piloto"*.
**Desbloquea:** la última de las tres operaciones huérfanas que encontró la Fase B6.9.

### Las cinco condiciones, todas obligatorias

1. El compromiso está en **`CONFIRMED` o `DUE`**.
2. Todavía **no pasó a `STARTED` ni `MISSED`**.
3. **No fue renegociado antes:** una sola renegociación **por cadena de compromiso**.
4. El nuevo horario empieza **al menos 15 minutos después** del momento en que se pide el cambio.
5. El nuevo horario cae en el **mismo día calendario**, en la zona horaria de la institución.

⚠️ **Y una aclaración que evita el error más probable:** *"**no se exige una anticipación mínima
respecto del horario original**: un compromiso en `DUE` todavía puede renegociarse mientras no haya
sido declarado `MISSED`"*. El límite es el estado, no el reloj del acuerdo viejo.

### Persistencia — lo que ya garantizaba el schema, ratificado

- **La fila original nunca se modifica** para representar el acuerdo nuevo.
- La original pasa a **`RENEGOTIATED`**; el sucesor es otro `Commitment`, vinculado por
  **`renegotiated_from_id`**.
- **Atómica e idempotente**, como las demás.

**Si ya hubo una renegociación, o el compromiso está `STARTED`/`MISSED`:** la salida es **continuar o
entrar al rescate**, *"no volver a moverlo"*.

---

<a id="adr-047"></a>
## ADR-047 — `C01-018`: el progreso no se infiere de una transición, nunca

**Estado:** ✅ `ACCEPTED` — **4 de septiembre de 2026, decidido por el Product Owner**.
Fuente literal: [`respuesta-po-decisiones-abiertas-source.md`](respuesta-po-decisiones-abiertas-source.md) §4.
**Cierra:** `C01-018` → **`CLOSED`**.

### La decisión

**Se ratifica como definitivo el comportamiento que ya corre**, y eso es lo notable: no hubo que
cambiar una línea. Las cinco reglas:

1. **`VALIDATED` por sí solo no produce `ProgressUpdated`.**
2. La operación autorizada de validación **recibe un resultado explícito** de progreso.
3. Esa operación invoca `registrarProgreso` **como paso explícito y separado**.
4. Informa **`changed_dimensions` o `explicit_no_change = TRUE`** — el invariante `I10`.
5. **Una transición de Evidence nunca puede inferir por sí sola que existió progreso.**

**La causa queda registrada** por la validación y la evidencia que la originaron.

⚠️ **Y la puerta que deja abierta viene con su candado:** *"nuevas fuentes de progreso podrán
agregarse después, pero **requerirán una causalidad explícita propia; no se incorporan por
inferencia**"*.

### Qué cambia en el código

**Nada.** El guard estático que cubre los cuatro caminos y los triggers del schema pasa de proteger
una regla provisional a proteger **una decisión cerrada**.

---

<a id="adr-048"></a>
## ADR-048 — `C01-024`: la ventana de recomendación de Modo Examen son 14 días

**Estado:** ✅ `ACCEPTED` — **4 de septiembre de 2026, decidido por el Product Owner**.
Fuente literal: [`respuesta-po-decisiones-abiertas-source.md`](respuesta-po-decisiones-abiertas-source.md) §5.
**Cierra:** `C01-024` → **`CLOSED`**.
**Desbloquea:** `ExamPreparationRecommended`, el único evento `P0` del catálogo que esperaba una
decisión y no una superficie.

### Las cuatro condiciones

1. Existe una **fecha de examen conocida y vigente**.
2. Faltan **14 días calendario o menos, incluyendo el día 14**.
3. **No existe ya** un Modo Examen activo o completado para ese mismo examen.
4. La recomendación **no fue emitida antes** para ese intento.

**Se emite una sola vez por intento**, y el cálculo usa la **zona horaria institucional**.

### Las dos cosas que la decisión desacopla, y son las que evitan un error caro

⚠️ **No depende de `PreparationReadiness`.** Textual: *"los umbrales de readiness continúan abiertos y
**no deben bloquear este disparador**"*. Son dos decisiones distintas y `C01-029` sigue abierta.

⚠️ **Sin fecha confiable no se emite, y no se inventa una.** *"El sistema no inventa una ni emite
automáticamente el evento"*. La activación manual sigue disponible: **omitir, no inventar**.

---

<a id="adr-049"></a>
## ADR-049 — La institución tiene zona horaria propia, y no es la del estudiante

**Estado:** ✅ `ACCEPTED` — **4 de septiembre de 2026**, resuelto con el owner al implementar
ADR-046.
**Origen:** una contradicción concreta entre dos decisiones cerradas y el schema, reportada y
detenida en el punto exacto que la fuente del Product Owner pedía: *"si la implementación revela una
contradicción concreta con el schema o una máquina de estados existente, detenerse **únicamente en
esa contradicción** y reportarla"*.
**Desbloquea:** [ADR-046](#adr-046) y [ADR-048](#adr-048), que no se podían implementar literalmente.

### El problema

[ADR-046](#adr-046) §5 dice que el nuevo horario de una renegociación cae *"en el mismo día
calendario, en la **zona horaria de la institución**"*, y [ADR-048](#adr-048) dice que el corte de
los 14 días *"usa la **zona horaria institucional**"*.

**Esa zona no existía.** `institution` tenía cuatro columnas —`id`, `name`, `tenant_config` (vacío,
sin un solo lector en `lib`, `scripts` ni migraciones) y `created_at`—. Lo único que el producto
sabía eran otras dos zonas:

| Dato | Qué significa | Dónde se usa |
|---|---|---|
| `student.timezone` | A qué hora ve el **estudiante** su propio día | Todas las superficies: `'zona', COALESCE(s.timezone, 'UTC')` |
| `commitment.timezone_at_commit` | La **congelada en el acuerdo**, para reconstruir el horario histórico | `UX04`, y a propósito no se recalcula |
| `institution.timezone` | El día calendario **de la institución** | Las dos reglas que la nombran, y nada más |

### La decisión

Se agrega **`institution.timezone TEXT NOT NULL DEFAULT 'America/Argentina/Cordoba'`**, con el
**mismo default que `student.timezone` tiene desde la Fase B1.2**. No se elige un valor nuevo: se
elige dónde vive un dato que las decisiones ya nombraban.

**Por qué no se sustituyó por `student.timezone`, que era gratis.** Porque no es un sinónimo. Dos
estudiantes de la misma institución en husos distintos tendrían distinto *"mismo día calendario"* y
distinto día 14. Escribir las reglas con la zona del estudiante no habría sido implementarlas:
habría sido **cambiarlas en silencio**, que es exactamente lo que el SDD existe para impedir.

### Lo que esta decisión NO hace, y no es un olvido

- **No cambia ninguna superficie.** Las que proyectan `'zona'` siguen proyectando la del estudiante,
  porque muestran **su** día. La zona institucional es para las reglas, no para la pantalla.
- **No define la zona de ninguna institución real.** El default es el mismo que ya regía; asignar
  otra es un dato operativo, no una decisión de diseño.
- **No admite un fallback.** Si la institución no tiene zona, la renegociación **no se hace**
  (`SIN_ZONA_INSTITUCIONAL` → `503`). Evaluar la condición 5 con otra zona sería aplicar otra regla.

### La consecuencia en el guard de triggers

`institution_zona_valida` comprueba contra `pg_timezone_names` que la zona exista, y **sólo levanta
una excepción**: no calcula ni escribe nada. Sería un `CHECK` si el motor lo permitiera —
`pg_timezone_names` no es inmutable—, y no puede vivir sólo en la aplicación porque `service_role`
escribe la tabla directo.

Entra en la lista explícita de `servicio-progreso.test.ts` por la misma puerta que
`senal_no_entra_a_acknowledged` ([ADR-034](#adr-034)), y **se anota**: el guard existe para forzar
esa conversación, no para saltearla. `npm run db:verify` agrega además la comprobación sobre los
datos, no sólo sobre el schema.

---

<a id="adr-050"></a>
## ADR-050 — «Cambiar horario»: la renegociación llega a `UX04`, y no se llama así

**Estado:** ✅ `ACCEPTED` — **4 de septiembre de 2026, decidido por el Product Owner**.
Fuente literal: [`respuesta-po-cta-renegociacion-source.md`](respuesta-po-cta-renegociacion-source.md).
**Responde:** la fila 16 de [`decisiones-abiertas.md`](decisiones-abiertas.md), levantada al
implementar [ADR-046](#adr-046).
**Desbloquea:** que la renegociación sea alcanzable **desde la pantalla**, y que
`FX-LOCAL-COM-RENEGOCIACION-NO-ELEGIBLE` deje de describir una pantalla que nadie podía ver.

### La decisión, y la mitad que es de vocabulario

`UX04` suma **una acción secundaria: «Cambiar horario»**, debajo de «Empezar», que conserva toda la
jerarquía. Sin pantalla nueva, sin ruta nueva, y **sin otra CTA en `UX01` por ahora**: *"alcanzar
`UX04` es suficiente para cerrar el recorrido del MVP"*.

⚠️ **Y «Renegociar» sale de la interfaz.** Textual: *"es lenguaje interno, no del estudiante"*. El
dominio, los eventos y los ADR siguen diciendo `renegociar`/`CommitmentRenegotiated` —son el
vocabulario del sistema—; lo que el estudiante lee es lo que hace: cambiar la hora de algo que ya
acordó.

### El bloque, cuando se puede

Se despliega **en la misma pantalla**: horario actual de sólo lectura, selector del nuevo horario,
«Confirmar nuevo horario» y «Cancelar». El selector ofrece **sólo** horarios del mismo día
institucional y a quince minutos o más de ahora.

⚠️ **El frontend no replica las cinco reglas.** Los horarios y la elegibilidad se proyectan desde
`lib/domain/renegociacion.ts`, y la validación final sigue siendo del servidor. Un test recorre cada
horario ofrecido y lo pasa por `elegibilidadDeRenegociacion`: **ofrecer uno que el servidor rechaza
sería prometer lo que no se puede cumplir**.

### El bloque, cuando no se puede — y por qué no es un botón apagado

*"No mostrar un botón deshabilitado sin explicación."* Se muestra
**«Este compromiso ya no se puede cambiar.»** más el motivo, y **la acción que corresponde al estado
queda intacta**: empezar, continuar o rescatar.

| Motivo canónico | Lo que lee el estudiante |
|---|---|
| `CADENA_YA_RENEGOCIADA` | Ya cambiaste el horario de este compromiso una vez. |
| `YA_EMPEZO` | Este compromiso ya empezó. |
| `INCUMPLIDO` | Este compromiso se incumplió; ahora corresponde rescatarlo. |
| `SIN_HORARIO_POSIBLE` | Ya no queda un horario válido dentro del día acordado. |
| `ESTADO_TERMINAL` | **Nada.** A quien mira un compromiso cumplido o cerrado no hay que explicarle que no puede moverlo |

**El `409` usa este mismo estado, no un error técnico.** Si la elegibilidad cambia entre la carga y
la confirmación, el servidor manda su motivo canónico y la pantalla lo cuenta igual que si lo hubiera
sabido antes.

### Tres defectos que aparecieron al construirlo

**1 · La CTA principal salía del encuadre, no del lifecycle.** `estadoDe()` hace ganar «rescate» y
«renegociación» sobre el estado, y eso valía cuando el sucesor todavía no existía. Con el flujo
adentro de `UX04` ese momento **ya no existe**: el sucesor nace `CONFIRMED`, así que la pantalla
ofrecía *«Confirmar compromiso»* sobre algo ya confirmado — y, si el sucesor se incumplía, seguía
ofreciéndolo en vez de «Retomar». La CTA ahora la decide el lifecycle; de dónde viene el compromiso
lo sigue contando el bloque del original.

**2 · «Horario actualizado» se borraba solo.** Confirmar vuelve a pedir el estado, y mientras la
respuesta viaja la vista devuelve `null`: el mensaje se desmontaba con ella. Vive arriba del límite
de recarga.

**3 · Un solo `ESTADO_NO_RENEGOCIABLE` mentía.** La ruta mandaba el mismo código para `STARTED`,
`MISSED` y `RENEGOTIATED`, y la pantalla tenía que elegir una copy para los tres: decía *«ya
empezó»* de algo que se había incumplido. Ahora cada estado manda su motivo, y `RENEGOTIATED` manda
`CADENA_YA_RENEGOCIADA`, que es literalmente lo que pasó.

### Lo que esta decisión cambió del catálogo aprobado

`FX-LOCAL-COM-CONFIRMED` tenía **«Renegociar» como CTA principal**. Queda corregido en las dos
mitades —la principal es «Empezar» y el cambio baja a secundaria—, y la palabra sale de la interfaz.

### Lo que NO autoriza

- **No autoriza una CTA en `UX01`.** Queda explícitamente para después.
- **No autoriza mergear a `main` ni desplegar.**
- **No autoriza que la pantalla decida elegibilidad**: proyecta lo que el dominio resolvió.

---

<a id="adr-051"></a>
## ADR-051 — El catálogo curricular: no toda fila de un plan es una materia

**Estado:** ✅ `ACCEPTED` · 4 de septiembre de 2026 · **decidido por el Product Owner**
**Fecha de apertura:** 4 de septiembre de 2026
**Origen:** el pedido de completar el onboarding académico del MVP, con el analítico del Plan 2016
de Ingeniería de Sistemas y la página pública de Ingeniería en Informática como fuentes.
**Desbloquea:** [ADR-052](#adr-052) (el tramo de alta) y la Etapa B6.14.
**Relacionado:** [ADR-023](#adr-023), [ADR-029](#adr-029), [ADR-049](#adr-049),
[ADR-006](#adr-006), `C01-001`, `C01-002`, `C01-003`, `C01-042`.
**Toca:** `data-model.md` §7 y §8, `architecture.md`, `roadmap.md`, `pending-decisions-annex.md`.

### El problema, en una línea

**La estructura curricular existe en el schema y nadie la declara.** `academic_program` y
`curriculum_plan` están desde la B1.2 y el único camino que los puebla es `ingerir_materia()`, que
los fabrica como centinelas — con su motivo escrito en el propio SQL:

> *"El ingestor asistido no conoce programa ni plan: el material de una materia no los trae. Se usa
> un contenedor por institución, explícito y reconocible, **en vez de inventar una estructura
> curricular que nadie declaró**."* — `20260830090000_ingesta_adl.sql:48`

Ese comentario era correcto entonces. Ahora hay una estructura declarada, y hace falta dónde ponerla.

### Lo que el spec ya pedía, y el schema no tenía

`product-spec-source.md` §5.1 fija el grafo conceptual canónico:

> `Universidad → Facultad → Carrera → Plan → Año → Semestre → Materia → Cátedra/Comisión → Profesor
> → Evaluación → Tema → Recurso → Evidencia histórica`

De esos trece eslabones, **tres no eran columna de nada**: `Facultad`, `Año` y `Semestre`. Y §7.1
—*"Identidad mínima: Universidad/facultad. Carrera. Plan. Año. Semestre."*— los pide exactamente
como los pasos del alta.

### La decisión

**1 · La facultad existe.** `academic_unit`, colgando de `institution`, y `academic_program` la
referencia. Nullable: una institución puede no declararla, y **no se infiere**.

**2 · El requisito curricular es una entidad propia, y no es la materia.** Tabla
`curriculum_requirement`: la **fila del plan**. Seis tipos, más uno que declara ignorancia:

| Tipo | Qué es |
|---|---|
| `COURSE` | Materia concreta. Es el único tipo que puede apuntar a un `course` |
| `ELECTIVE_SLOT` | Un cupo abstracto del plan. **No es una materia** |
| `SEMINAR_SLOT` | Un cupo de seminario |
| `LANGUAGE_REQUIREMENT` | Una acreditación de idioma |
| `PROFESSIONAL_PRACTICE` | Práctica profesional supervisada |
| `CAPSTONE` | Trabajo final |
| `UNKNOWN` | **La fuente no permite clasificarla.** No es un default: es un dato |

> **Por qué hacía falta.** El Plan 2016 tiene 57 filas y **al menos seis no son materias**:
> `ELECTIVA I`, `ELECTIVA II`, `SEMINARIO`, `ACRED. INGLES`, `PRACTICA PROF. SUPERVISADA` y
> `TRABAJO FINAL`. Modelarlas como `course` haría que el alta le preguntara al estudiante *"¿estás
> cursando Acreditación de Inglés?"* como si fuera una materia más, y que el ADE buscara unidades y
> recursos de un trabajo final. **Cada una de esas seis va a necesitar su propia experiencia**, y
> ninguna la va a poder tener si entra como materia.

**3 · Seleccionar una opción electiva no modifica el catálogo.** `elective_option` es una relación
N:N entre un `ELECTIVE_SLOT` y los `course` que pueden satisfacerlo. Una opción puede servir a varios
cupos. **Lo que el estudiante elige no entra acá** — entra en su propia declaración
([ADR-052](#adr-052)).

**4 · El cupo se puede describir desde el día uno**, aunque hoy no se use: `min_options`,
`max_options`, `required_credits`, `valid_from`, `valid_until` y procedencia. El Plan 2016 no
requiere créditos en este recorrido, así que **quedan vacíos y declarados**, no en cero.

**5 · El año nunca se infiere por posición.** `curriculum_year` es `NULL` cuando la fuente no lo
declara, y `year_source` dice **qué se vio para afirmarlo**. `ordinal` conserva el orden de la
fuente y **no es el año**: son dos columnas porque son dos datos.

**6 · Un plan se publica; no se corrobora.** `curriculum_plan.publication_status` ∈
`DRAFT | PUBLISHED | RETIRED`, con `plan_code`, `source_type`, `source_ref`, `observed_at` y
`content_hash`. Un plan `PUBLISHED` **exige fuente y referencia** por `CHECK`. **Sólo un plan
`PUBLISHED` se le ofrece a un estudiante.**

### La distinción que este ADR se niega a colapsar

**`publication_status` no es `verification_status`, y ninguna tabla nueva lleva el segundo.**

Son dos preguntas distintas: *"¿esto se le puede mostrar a un estudiante?"* y *"¿alguien con
autoridad verificó que es cierto?"*. Un plan puede estar publicado y sin corroborar —con su
procedencia a la vista—, y puede estar corroborado y todavía sin publicar.

Colapsarlas tendría un costo concreto: `verification_status` tiene **una sola escritura en todo el
repositorio**, `corroborar_procedencia()` (invariante `I9`, Etapa B2b.2), con guard sobre las 50
migraciones. Agregar una sexta tabla con el campo obliga a tocar el `CHECK` de
`provenance_corroboration.subject_table` y el árbol de la función — y su propio SQL lo advierte:
*"agregar una sexta tabla con Provenance es agregar un valor acá"*. **Este ADR no lo hace.** Es el
mismo criterio por el que `resource` deliberadamente no lo lleva.

Lo que sí lleva el catálogo es el resto de la Provenance —`source_type`, `source_ref`, `observed_at`,
`confidence`— más `needs_review` y `label_truncated`, que dicen **qué parte del dato todavía no se
puede afirmar**. Si más adelante hace falta corroborar un requisito fila por fila, es una decisión
propia con su ADR.

### Un duplicado latente que se arregla de paso

`course_offering` tiene `UNIQUE (course_id, term, commission)` y en Postgres **dos `NULL` no
chocan**: dos cursadas de la misma materia sin comisión declarada son dos filas distintas. Hoy lo
esquiva `ingerir_materia()` leyendo con `IS NOT DISTINCT FROM` antes de insertar, que es una carrera.
Pasa a `UNIQUE NULLS NOT DISTINCT`. **Es más estricto, nunca más permisivo**: no rompe nada que hoy
funcione.

### Alternativas descartadas

| # | Alternativa | Por qué no |
|---|---|---|
| A | Agregar `curriculum_year` y `is_elective` a `course` | `course` es *materia concreta*. `ELECTIVA I` no es una materia con un año: es un requisito sin materia. Un booleano no distingue seis tipos, y `ACRED. INGLES` no entra en ninguno de los dos valores |
| B | Una tabla `subject` canónica + junction con el plan | Forkea `course.curriculum_plan_id`, que es FK de `course_offering` y por transitividad de todo el modelo del estudiante. El costo es el modelo entero; el beneficio, cero para un MVP de una carrera. **Cuando haga falta materia canónica entre planes**, el patrón ya está en el repo: `canonical_id` + `is_current`, como `error_type` y `risk_rule` |
| C | Cargar el plan como JSON en `institution.tenant_config` | La columna existe y no tiene un solo lector. Un plan en JSON no tiene FK, ni `UNIQUE`, ni RLS, ni se puede consultar por año |

### Lo que este ADR **no** decide

- **No decide qué universidad ni qué carrera son el golden dataset.** Eso es `C01-042`, y
  [ADR-006](#adr-006) §5 dice textualmente que **no se puede adelantar**.
- **No hace alcanzable `official`.** Sigue sin llegar nadie (`C01-030`).
- **No define correlativas entre materias.** `topic_prerequisite` es entre temas; entre materias no
  existe y **no se deriva del año ni del `ordinal`**.
- **No define créditos, horas ni equivalencias entre planes.**

---

<a id="adr-052"></a>
## ADR-052 — El tramo de alta: tres pantallas fuera de las nueve, y el gate a `HOY`

**Estado:** ✅ `ACCEPTED` · 4 de septiembre de 2026 · **decidido por el Product Owner**
**Fecha de apertura:** 4 de septiembre de 2026
**Implementa:** el orden del alta que [ADR-042](#adr-042) aprobó y el hueco que
[ADR-039](#adr-039) dejó declarado.
**Relacionado:** [ADR-006](#adr-006), [ADR-033](#adr-033), [ADR-035](#adr-035),
[ADR-040](#adr-040), [ADR-051](#adr-051), `C01-030`, `C01-050`.
**Toca:** `product.md` §10.2, `architecture.md`, `data-model.md` §8, `roadmap.md`, `demo-mvp.md`.

### El hueco, con su cita

> *"entre el `authorized: true` del CRM y la primera acción del estudiante **no hay ninguna pantalla
> definida** […] qué ve un estudiante recién habilitado que todavía no tiene cursadas. **Hoy caería
> en el vacío de `UX01`, que dice «no hay una acción recomendada»: una afirmación sobre el mundo que
> en ese caso nadie puede hacer.**"* — [ADR-039](#adr-039)

[ADR-042](#adr-042) ya decidió el orden entero. Este ADR lo construye.

### La decisión

**1 · Tres pantallas, en el orden aprobado por ADR-042:**

```
/login  →  /alta/whatsapp  →  /alta/carrera  →  /alta/materias  →  /hoy
```

**2 · No son superficies de producto.** Igual que `/login` ([ADR-039](#adr-039)): **no entran al
registro canónico de navegación**. `lib/navigation/` sigue teniendo nueve nodos, `UX10` sigue sin
existir y los guards que lo verifican siguen verdes. Viven en `app/(alta)/` y
`components/alta/` — **no en `components/screens/`**, así que la regla 6 de `CLAUDE.md` no se toca:
ninguna de las nueve se reescribe.

**3 · El gate es del backend, no del navegador.** Las nueve rutas de lectura devuelven
`409 { error: "ALTA_INCOMPLETA", siguiente }` mientras el alta no esté confirmada, y el cliente
redirige — el mismo mecanismo que ya tiene para el `401 → /login`. **Un gate que viva sólo en el
cliente no es un gate**: es la misma lección de la Fase B6.10, donde el requisito de reflexión se
hacía cumplir con un botón deshabilitado.

**4 · El estado del alta es una columna, no una tabla nueva.** `enrollment` existe desde la B1.3
—`(student, program, term)` con su `UNIQUE`— y **nadie la lee ni la escribe**. Se revive: gana
`curriculum_plan_id`, `curriculum_year` y `confirmed_at`. **`confirmed_at IS NOT NULL` es el alta
completa.** Crear una tabla `onboarding_state` al lado habría sido una segunda historia del mismo
hecho.

**5 · Confirmar el mapa académico es una transacción, y llama al ADE después.** Escribe
`enrollment`, las `course_offering` por defecto, las `course_enrollment` y las
`requirement_declaration`; emite **`AcademicMapMinimumReached`** —que estaba declarado en
`lib/domain/product-events.ts` desde la B3 con `instrumentacion: pendiente("B2b · cuando el ADL
declare suficiencia")`, y es exactamente esto— y **recién entonces** invoca a `recomendarPara()` en
proceso, por cada cursada.

> **El estudiante no autoriza una recomendación.** La Plataforma reacciona a un hecho de dominio, con
> el mismo patrón que [ADR-040](#adr-040) ya usa: la validación cierra la Action y **después** invoca
> al ADE. `POST /api/recomendacion` sigue siendo secreto de servicio; lo que se reusa es el Service.

**6 · La idempotencia vive en la base, no en el handler.** `course_enrollment` ya tiene
`UNIQUE (student_id, offering_id)` desde la B1.3, y `requirement_declaration` nace con
`UNIQUE (student_id, curriculum_requirement_id)`. Un doble submit escribe las mismas filas.

**7 · El estudiante sin materias deja de recibir un veredicto.** `estado_del_dia()` marca contexto
incompleto también cuando **no hay cursadas activas**, y el Hero devuelve
`CONTEXT_INCOMPLETE` con variante `PREPARANDO_INFORMACION`, cuyo copy es el **literal aprobado** por
ADR-042:

> **Estamos preparando tu información académica.**
> Todavía no contamos con información suficiente para recomendarte una acción. Te avisaremos cuando
> tu recorrido esté listo.

⚠️ **Los nueve niveles siguen siendo nueve.** No se agrega un décimo: se agrega una **variante**, que
es el mecanismo que [ADR-017](#adr-017) dejó exactamente para discriminar la CTA dentro de un nivel.
El guard de `precedence.ts` no se toca.

Y con eso, `"SIN ACCIONES POR AHORA"` **deja de alcanzar** a un estudiante sin materias, que es lo
que ADR-042 prohíbe textualmente: *"no debe mostrarse «no hay una acción recomendada», porque el
sistema todavía no está en condiciones de evaluar eso"*.

### La institución no se pregunta: la fijó el padrón

**Corregido el 5 de septiembre de 2026, recorriendo el alta a mano.** El selector ofrecía *todas*
las instituciones con plan publicado, y elegir una distinta de la propia terminaba en un `404` que la
pantalla mostraba como *"No pudimos guardar tu respuesta. Probá de nuevo en un momento"*.

**Dos cosas mal, y la segunda es peor.** Ofrecer algo que siempre falla — y después mentir sobre por
qué: reintentar no iba a funcionar nunca.

`student.institution_id` **lo fija el padrón** y es la raíz del aislamiento institucional
(`data-model.md` §7): un estudiante pertenece a una institución y no puede elegir otra. Así que
*"¿dónde estudiás?"* no era una pregunta: era un dato que ya teníamos. **Se muestra para confirmar**,
igual que la facultad y que la versión del plan — la misma regla que este ADR ya aplicaba dos veces.

Y `404` deja de decirse como un error de red. `ResultadoDeEnvio` gana `NO_ENCONTRADO`, porque *"probá
de nuevo en un momento"* sobre algo permanente le pide al estudiante que insista contra una pared.

### El modo prueba mueve la ficha del padrón, y no reabre esta decisión

**Agregado el 5 de septiembre de 2026**, del mismo recorrido a mano. Recorrer el alta una vez no
alcanza para verla: hay que volver a entrar y elegir distinto, incluso contra el catálogo de otra
institución. Con `MODO_PRUEBA=1` hay un dock que reinicia el alta, y su selector permite dejar al
estudiante sintético asignado a **otra institución**.

**Eso no le devuelve al estudiante la elección que este ADR le sacó.** La pregunta *"¿dónde
estudiás?"* sigue sin existir y el alta sigue ofreciendo **sólo** la institución del padrón: lo que el
dock hace es **mover la ficha del padrón**, que es lo que haría un backoffice, y sólo hacia una
institución **con plan publicado** — dejarlo en una sin plan es el pozo del que salió la corrección
de arriba.

Y se mueve **después** de borrar todo lo académico, nunca antes: mover a un estudiante que conserva
cursadas de la institución vieja rompe `I11` en silencio.

⚠️ **Apagado por defecto y con fecha de vencimiento.** Sin la variable, `POST /api/prueba/alta`
responde `404` y el componente no llega al HTML. Cuando [ADR-006](#adr-006) abra, la ruta **se
borra**: con personas reales, *"borrarle a alguien lo que declaró"* es una operación de privacidad
con su propio contrato (`C01-017`), no un botón. El detalle vive en
[`roadmap.md`](roadmap.md) §0.2 y en [`demo-mvp.md`](demo-mvp.md).

### WhatsApp: se construye el tramo, no se escribe el número

ADR-042 §4 autoriza construir y probar *"con identidades y teléfonos sintéticos"*. Pero el schema
dice otra cosa, y es anterior:

> `student.whatsapp` — *"**DATO PERSONAL.** Gateado por ADR-006: ninguna capa lo escribe mientras
> siga `PENDING`."* — `20260830020000_capa_estudiante.sql:27`

**Se resuelve sin elegir entre los dos:** la pantalla se construye, el consentimiento se persiste en
`whatsapp_consent` —explícito, específico, **no premarcado**, y rechazable **sin perder el
acceso**—, y **`student.whatsapp` sigue sin escritor**. La tabla de consentimiento **no tiene columna
de teléfono**: no es que no se llene, es que no existe dónde.

El día que ADR-006 tenga dictamen, entra el número. Hasta entonces el tramo está armado y **ningún
texto del repositorio queda contradicho**.

**Y la superficie no promete lo que no observa** (ADR-042 §5–6): dice *"Recibimos tu solicitud"* y
**nunca** *"tu WhatsApp está vinculado"*, *"hay un operador asignado"* ni *"te van a escribir"*. El
Flujo E hacia el CRM **no se emite**: sigue congelado por [ADR-035](#adr-035).

### Lo que se omite del spec, declarado en vez de inventado

`product-spec-source.md` §7.1 y `UF-S01` piden dos cosas que este tramo **no** hace:

- **`Semestre`.** El alta pregunta año, no semestre. La columna `term` existe en
  `curriculum_requirement` y queda `NULL`: **desconocido, no ausente.**
- ***"Asignar acompañante"*.** [ADR-033](#adr-033) sacó al Operador de la Plataforma y ADR-042 §6
  prohíbe afirmar que alguien va a escribir. **No se asigna nadie y no se menciona a nadie.**

### Lo que este ADR **no** autoriza

- **No autoriza escribir `student.whatsapp`.**
- **No autoriza emitir los flujos E / E′ al CRM** ([ADR-035](#adr-035)).
- **No autoriza la superficie «WhatsApp y privacidad»** —consultar, reemplazar, revocar— que ADR-042
  también decidió. Es backlog #2 y sigue ahí.
- **No autoriza el diagnóstico personal mínimo** del Golden Path A.
- **No levanta el gate de [ADR-006](#adr-006)**, ni autoriza mergear a `main` ni desplegar.

---

<a id="adr-053"></a>
## ADR-053 — El Plan 2016 de la UCC entra `DRAFT`, y lo que falta para publicarlo está escrito

**Estado:** ✅ `ACCEPTED` · 4 de septiembre de 2026 · **decidido por el Product Owner**
**Fecha de apertura:** 4 de septiembre de 2026
**Relacionado:** [ADR-006](#adr-006) §5, [ADR-023](#adr-023), [ADR-024](#adr-024),
[ADR-051](#adr-051), `C01-042`, `C01-052`.
**Toca:** `pending-decisions-annex.md`, `roadmap.md`, `catalogo/README.md`.

### El conflicto que hubo que resolver primero

La instrucción inicial fue publicar el plan de la UCC junto con el sintético. **No se puede hoy**, y
por dos textos que dicen lo mismo desde lados distintos:

> *"`C01-042` está gateado «antes de piloto institucional». **No se puede elegir universidad y
> carrera antes de saber con qué base legal se piden los datos** […] Lo que sí se puede hacer sin
> decidir nada: **seguir con el catálogo sintético**."* — [ADR-006](#adr-006) §5

Y la propia regla de publicación del pedido: un plan pasa a `PUBLISHED` **sólo** cuando estén
corroborados *"las materias; sus códigos; su distribución por año; sus reglas electivas; la fuente
institucional"*. **Ninguna de las cinco lo está.**

**Se planteó, y el owner decidió la reconciliación:** se publican **dos instituciones sintéticas**
—que dan aislamiento real entre instituciones y el caso de dos planes de carreras sucesoras que no se
mezclan— y **la UCC se carga completa en `DRAFT`**.

### La decisión

**1 · UCC · Ingeniería de Sistemas · Plan 2016 se carga con sus 57 requisitos, en `DRAFT`.**
No se le ofrece a ningún estudiante, y hay test de que no sale del Repository.

**2 · Ingeniería en Informática es una carrera separada, también `DRAFT`**, con
`curriculum_year = NULL` en todas sus filas. **No se mezcla con el Plan 2016**: son dos
`academic_program` distintos. La web pública no demuestra el año, el semestre, cuántas flexibles se
eligen, cuántas de Fe y Vida son obligatorias, las correlativas ni las equivalencias — y **nada de
eso se completa**.

**3 · El año del Plan 2016 se carga desde el marcador visible, y se dice que no está corroborado.**
El analítico muestra una columna angosta con marcadores `1·2·3·4·5` alineados a las filas 1, 11, 22,
35 y 46 — grupos de 10, 11, 13, 11 y 12, que suman 57. **El encabezado de esa columna no es
legible.** Se carga el valor con `needs_review = TRUE` en las 57 filas y

```
year_source = 'agrupamiento visible en el analítico; encabezado de columna no legible'
```

> **Por qué se carga y no queda `NULL`.** Es un dato visible en la fuente, no una inferencia por
> posición — que es lo que estaba prohibido. Lo que no se puede leer es **qué significa la columna**,
> y eso queda escrito en el propio dato. Deja el plan a **una** corroboración de poder publicarse.

**4 · Ningún dato personal cruza al repositorio.** El analítico contiene nombre, domicilio, matrícula
y documento. **Se extrajo únicamente la estructura curricular.** El CSV no tiene una sola columna que
pueda contenerlos, y hay test de que el archivo no contiene los encabezados del analítico.

**5 · El texto truncado se conserva truncado.** **Diez filas** están cortadas en la fuente y entran
así, con `label_truncated = TRUE`. **No se completan por intuición**, ni siquiera las obvias — y dos
pares comparten texto visible con códigos distintos (`LABORATORIO DE COMPUTACION (…` y `ARQUITECTURA
COMPUTADORAS`), que es justamente lo que el numeral cortado no deja resolver.

**6 · Los seis requisitos que no son materias**, clasificados según [ADR-051](#adr-051):

| # | Código | Texto visible | Tipo |
|---|---|---|---|
| 31 | 20180 | `ELECTIVA I` | `ELECTIVE_SLOT` |
| 38 | 10203 | `ELECTIVA II` | `ELECTIVE_SLOT` |
| 54 | 20186 | `SEMINARIO` | **`UNKNOWN`** — no se sabe si es asignatura o cupo |
| 55 | 00299 | `PRACTICA PROF. SUPERVISADA` | `PROFESSIONAL_PRACTICE` |
| 56 | 00324 | `ACRED. INGLES` | `LANGUAGE_REQUIREMENT` |
| 57 | 00301 | `TRABAJO FINAL` | `CAPSTONE` |

Recuento: **51 `COURSE` + 2 `ELECTIVE_SLOT` + 1 `UNKNOWN` + 1 `LANGUAGE_REQUIREMENT` +
1 `PROFESSIONAL_PRACTICE` + 1 `CAPSTONE` = 57.**

⚠️ **Las dos de *Formación Humana* (47 y 51) no son el `SEMINARIO` de la 54.** Tienen códigos
propios y entran como `COURSE`, con su numeral truncado y **sin asumir cuál es I y cuál es II**.

### Lo que las imágenes no permiten determinar, y no se inventó

El encabezado de la columna del año · el texto completo de las diez filas truncadas · el numeral de
las dos de Formación Humana · si `SEMINARIO` (54) es asignatura o cupo · el semestre de cualquier
fila · correlativas · créditos · qué materias satisfacen `ELECTIVA I` y `ELECTIVA II` · equivalencias
con Ingeniería en Informática.

### Qué falta, exactamente, para publicar

**El plan de estudios oficial del Plan 2016 de la UCC —PDF, CSV o resolución— con año y semestre por
materia y los nombres completos.** Con eso se corrigen los truncados, se confirma o se corrige el
año, se resuelve `SEMINARIO` y se levanta `needs_review`. La autorización institucional para usarlo
es `C01-042`, y sigue siendo de una persona.

Queda registrado como **`C01-052`** en [`pending-decisions-annex.md`](pending-decisions-annex.md).

---

<a id="adr-054"></a>

## ADR-054 — El apartado «Materias» muestra una sola materia

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-agenda-decisiones-source.md)
**Fecha de apertura:** 5 de septiembre de 2026 · **lo abrió el recorrido del producto a mano**

> ### La decisión: opción `B`, y sólo `B`
>
> > *"Elijo `B` ahora. `CTA-001` debe transportar el `CourseEnrollment` seleccionado y abrir
> > exactamente la materia desde la cual se originó la navegación. Autorizo agregar el identificador
> > necesario a `MateriaResumen`, parametrizar la CTA y registrar el cambio en el registro canónico."*
>
> ⚠️ **Y delimitó el alcance con la misma firmeza:**
>
> > *"Esto no autoriza construir todavía una nueva superficie de listado «Materias» ni cambiar el
> > nombre del ítem del menú. Las opciones `A` y `C` quedan como una decisión de diseño separada."*
>
> **Lo que eso deja cerrado:** el incumplimiento de `VI.2` §5.2 —*"al entrar desde Hoy se abre el
> `CourseEnrollment` seleccionado"*—, que era el único punto del hallazgo que producía **una
> respuesta equivocada** en vez de una ausencia.
>
> **Lo que eso deja abierto, y es deliberado:** el ítem del menú **sigue llamándose «Materias» en
> plural sobre una superficie de una sola**, y el área que la Parte II §10 nombra sigue sin
> construirse. Son `A` y `C`, y **no son residuos de este ADR**: son una decisión de diseño propia,
> que se toma con las capturas delante.
**Relacionado:** [ADR-016](#adr-016) (el registro canónico de CTAs), [ADR-018](#adr-018) (las
capturas), [ADR-051](#adr-051), [ADR-052](#adr-052), Etapa B2.6 del [roadmap](roadmap.md).
**Toca:** `lib/navigation/menu.ts`, `lib/navigation/cta-registry.ts`,
`lib/server/servicios/proyeccion-hoy.ts`, `app/(student)/hoy/page.tsx`,
`components/screens/hoy-autogestion.tsx`, `design-system.md` §1.4.

### El hallazgo

**El alta persiste todas las materias; la superficie muestra una.** Verificado contra Postgres con un
estudiante sintético que tiene **nueve cursadas activas**:

| Qué se preguntó | Qué devolvió |
|---|---|
| `estado_del_dia(…)->'materias'` | **9** |
| `estado_de_materia(…, p_course_enrollment_id => NULL)` | **1** · `Álgebra Sintética` |

**El dato está. Lo que falta es por dónde verlo.** Son tres cosas distintas, y la tercera es la peor:

**1 · El ítem «Materias» del menú lateral lleva a una sola materia.** `menu.ts` lo declara plural y
apunta a `UX02`, que es la superficie de **cursado de una materia**: `estado_de_materia()` cierra su
CTE con `LIMIT 1` —la cursada de la `Action` viva, y si no hay, la más antigua—. Con nueve cursadas
devuelve una, siempre la misma, y no hay control para cambiarla.

**2 · La lista completa existe sólo en `HOY`, debajo del fold y de a una.** Es la cola paginable que
`design-system.md` §1.4 arbitró para `DD7` —«1 de 9», con flechas—. Está bien que sea así en `UX01`:
lo que no existe es el lugar donde estén todas.

**3 · Y desde esa cola, cualquier materia abre la misma pantalla.** `onVerMateria` navega a
`/materia` **sin `?cursada=`**, y `proyeccion-hoy.ts` descarta el `cursadaId` que la base sí devuelve.
Abrir la séptima materia de la cola muestra la primera.

> ⚠️ **El punto 3 no es una ausencia: es una respuesta equivocada.** El estudiante pidió una materia y
> la pantalla le contesta con otra, sin decirlo. *Omitir, no inventar* cubre lo primero; esto es lo
> segundo, y es lo que *"la UI proyecta, nunca decide"* existe para impedir.

### Qué dice el spec — leído el 5 de septiembre, a pedido del owner

**El spec define dos áreas distintas, y el producto las colapsó en una.** Parte II §10,
*Arquitectura de información provisional*:

| Área | Responsabilidad, textual |
|---|---|
| **Materias** | *"Espacios persistentes de cursado y evaluaciones."* |
| **Materia > Cursado** | *"Ritmo, unidades, progreso, recursos, acciones y Bitácora."* |

**El ítem del menú se llama como la primera y lleva a la segunda.**

Y `VI.2` §5.1 lista, entre las entradas válidas a Cursado, **«área existente Materias»**: el spec la
**da por existente**. Pero **no la especifica en ningún lado** — `VI.2` es el wireframe de *Cursado*,
su §5.3 cierra con *"No se agrega una navegación global nueva en este sprint"*, y la propia §10 se
declara **provisional**. Hay un nombre y una responsabilidad de una línea; no hay wireframe, ni
contenido, ni CTA en el registro canónico.

⚠️ **Eso mueve la opción `C`:** una superficie de lista **no sería inventar una décima**, sería
construir un área que la arquitectura de información ya nombra. Sigue necesitando decisión y
capturas, pero deja de ser una idea nueva.

**Y hay una línea del spec que el código contradice hoy.** `VI.2` §5.2, *Contexto preservado*:

> *"Al entrar desde Hoy: **se abre el `CourseEnrollment` seleccionado**"*

`CTA-001` no lleva cuál, y `estado_de_materia()` elige con `LIMIT 1`. **El punto 3 del hallazgo deja
de ser un hueco y pasa a ser un incumplimiento literal.**

**La cola de `HOY` tampoco es lo que `DD7` resolvió.** El texto dice que *"esa lista deja de ser plana
y se vuelve **paginable**"*; lo construido muestra **una materia por vez**, así que la lista dejó de
ser lista. El disparador tampoco coincide: el spec dice *"cuando hay más de una materia **con algo
pendiente el mismo día**"*, y `MateriasQueue` pagina por `materias.length > 1` sobre **todas** las
cursadas activas.

> ℹ️ **Lo que sí está bien es el vacío.** `VI.2` §12.3 fija qué mostrar cuando falta cada fuente, y la
> proyección lo cumple: sin `TopicProgress` dice *"sin avance registrado"* y no cero, sin señal de
> riesgo no dice *"Bajo control"*, y con `contextoIncompleto` no inventa nada.
>
> ⚠️ **Pero el `LIMIT 1` hace que ese caso se vea peor de lo que es.** Una materia recién declarada en
> el alta **no tiene un solo `topic` cargado** —el mundo demo ingiere una sola por el ADL—, así que un
> estudiante con 16 cursadas ve **una**, elegida por antigüedad, **vacía**, y ninguna forma de mirar
> las otras 15. La pantalla dice la verdad; lo que falla es a cuántas materias deja llegar.

**Lo que el spec NO pide, y conviene no confundir:** el layout *"2/3 Hero + 1/3 Materias"* de la
`VI.1` está en su §14, **REVERSIBLE UX ASSUMPTIONS**, con la nota de que cambiarlo *"no debe alterar
la precedencia, los loops ni el contrato de verdad"*. **No es contrato**, y que `HOY` sea una columna
no es un incumplimiento.

### Por qué esto no lo cierra un agente

**El `LIMIT 1` fue deliberado**, y su motivo está escrito en la propia migración de la Etapa B2.6:

> *"`/materia` no lleva id en la URL y agregarle uno **toca el registro canónico de CTAs, que es
> contrato**."*

**Lo que cambió es la premisa, y nadie la revisó.** Cuando se escribió eso, un estudiante sintético
tenía una o dos cursadas sembradas a mano, y *"la de la Action viva"* era la respuesta correcta a
*"¿qué materia?"*. Desde la [Fase B6.14](roadmap.md) el alta lo deja declarar **cuantas curse**, y la
misma decisión pasó de razonable a hueco. **La decisión no se rompió: se le movió el mundo debajo.**

Y lo que hay que decidir toca tres cosas que un agente no puede resolver solo:

- **El registro canónico de CTAs.** `CTA-001` declara `origen: UX01 → destino: UX02`. [ADR-016](#adr-016)
  fijó que **toda fila que no transcriba la tabla del spec necesita un ADR `ACCEPTED` detrás**, y hay
  test.
- **`components/screens/*`**, que la regla 6 de [`CLAUDE.md`](../CLAUDE.md) protege.
- **El lenguaje visual**, que sale de `docs/diseño/` ([ADR-018](#adr-018)) y no se improvisa.

### Las tres opciones, sin elegir ninguna

| | Opción | Qué corrige | Qué cuesta |
|---|---|---|---|
| **A** | **El menú se llama como lo que hay** — «Materia», singular | Nada del hallazgo; deja de prometer una lista que no existe | Una etiqueta. **No toca el punto 3** |
| **B** | **`/materia` recibe la cursada, y la cola se la pasa** — `?cursada=` **ya funciona** en `GET /api/materia` y en `estado_de_materia()`; falta que `cursadaId` llegue a la pantalla y que `CTA-001` admita el parámetro | El punto 3, entero. El 2 queda como está y el 1 sigue abierto | Un campo en `MateriaResumen`, la CTA con parámetro y **una nota en el registro canónico** |
| **C** | **El área «Materias» que la IA del spec ya nombra** (§10) — la lista de espacios persistentes de cursado | Los tres | **Una superficie sin wireframe.** El spec la nombra en una línea y nunca la especifica; el registro dice que las superficies son nueve y que *"no existe `UX10`"*, con guard |

**Recomendación del agente: `B`, y sólo `B`.** Es lo único que convierte una respuesta equivocada en
la correcta sin estrenar superficie ni mover el conteo de nodos, y la mitad del camino ya está
construida. **`A` y `C` son decisiones de producto y de diseño, y se toman con las capturas delante.**

### Lo que no se hizo, a propósito

**Ninguna de las tres.** No se tocó `menu.ts`, ni el registro de CTAs, ni una pantalla. Se dejó
escrito el hallazgo con su verificación, que es lo que la regla 1 pide cuando falta una regla.

---

<a id="adr-055"></a>

## ADR-055 — `C01-021`: las dos reglas de riesgo sin umbral quedan en modo humano hasta el piloto

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-agenda-decisiones-source.md)
**Relacionado:** [ADR-032](#adr-032), [ADR-037](#adr-037), `C01-021`, `C01-036`.
**Toca:** `pending-decisions-annex.md`, `decisiones-abiertas.md`, `roadmap.md`.

### La decisión

> *"`HP0-06-2` y `HP0-06-3` permanecen en modo humano hasta disponer de evidencia del piloto.
> Registrar `C01-021` como `ANSWERED — RESIDUO ABIERTO`, con la condición explícita de que sus
> umbrales se definirán a partir de datos observados durante el piloto."*
>
> *"No autoriza implementar evaluadores automáticos ni inventar umbrales provisionales."*

### Qué cambia, y qué no

**No cambia una línea de código.** `HP0-06-1 v4.0-psicopedagogia` sigue siendo la única regla que
evalúa, con sus umbrales `2` y `3` en configuración, y el **guard estático que rompe si alguien
agrega un evaluador para las otras dos sigue en pie** — ahora respaldado por una decisión y no sólo
por prudencia.

**Cambia el estado de la fila.** `C01-021` deja de ser un `OPEN` sin fecha y pasa a
`ANSWERED — RESIDUO ABIERTO` con condición nombrada: *evidencia del piloto*. Es la misma forma con
la que la psicopedagoga cerró `C01-036`.

⚠️ **Y desbloquea el cierre de la Fase B6 sin inventar nada.** La fase estaba trabada por una
decisión que **hoy no tiene evidencia sobre la cual tomarse**; ahora la condición para tomarla está
escrita. Lo que queda de la fase sigue esperando a [ADR-056](#adr-056) y al contrato v2 del CTO.

---

<a id="adr-056"></a>

## ADR-056 — `C01-044`: playbook y SLA provisionales del circuito de riesgo

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-agenda-decisiones-source.md)
**Relacionado:** [ADR-032](#adr-032), [ADR-033](#adr-033), `C01-022`, `C01-030`, `C01-044`.
**Toca:** `pending-decisions-annex.md`, `decisiones-abiertas.md`, `roadmap.md`.

### La decisión, textual

**Playbook provisional:**

> *"Ante una señal `INTERVENTION_REQUIRED`, el rol operativo asignado debe revisar el contexto
> disponible, realizar un primer intento de contacto por WhatsApp, identificar el bloqueo, acordar
> una única próxima acción o activar el protocolo de rescate/no cortar, y registrar obligatoriamente
> el outcome y el próximo seguimiento."*

**SLA provisional:**

> *"Primer intento de contacto dentro de cuatro horas hábiles del horario operativo vigente. Si la
> señal se produce fuera de ese horario, el plazo comienza en la siguiente ventana operativa."*

### Lo que la decisión dice que NO decide

> *"Una intervención no puede cerrarse sin outcome. Esto no define todavía la identidad técnica de la
> persona ni autoriza construir superficies de operador dentro de Plataforma."*

⚠️ **«Una intervención no puede cerrarse sin outcome» ya se garantiza por construcción**
([ADR-032](#adr-032)): cerrar sin outcome **no es un camino que exista**. La decisión lo ratifica; no
lo introduce.

⚠️ **Sigue sin resolverse dónde vive el playbook.** `C01-044` arrastra una propuesta abierta —que
playbook y SLA sean canónicos del **CRM**, no de la Plataforma, porque el spec pone el Intervention
Engine de ese lado—. [ADR-033](#adr-033) no la cerró a propósito y **esta decisión tampoco**: fija
*qué dice* el playbook, no *de qué sistema es*. Si más adelante se acepta que es del CRM, la tabla
`playbook` de la Plataforma sobra y su `sla_at` pasa a ser referencia externa.

⚠️ **«Cuatro horas hábiles» exige un horario operativo que la Plataforma no tiene.** No hay tabla de
ventana operativa ni de feriados, y **no se inventa una**: hasta que exista, el SLA es un texto del
playbook y no un plazo que el sistema calcule. Convertirlo en `sla_at` computado es trabajo propio,
con su propia decisión sobre de dónde sale el calendario.

---

<a id="adr-057"></a>

## ADR-057 — `C01-030`: la identidad de quien revisa queda diferida hasta ADR-006

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-agenda-decisiones-source.md)
**Relacionado:** [ADR-006](#adr-006), [ADR-023](#adr-023), [ADR-033](#adr-033), [ADR-040](#adr-040),
`C01-030`.
**Toca:** `pending-decisions-annex.md`, `decisiones-abiertas.md`, `roadmap.md`.

### La decisión

> *"La definición permanente de identidad queda diferida hasta el cierre de `ADR-006`. Mientras todo
> siga siendo sintético, se mantiene el interinato ya ratificado: las operaciones pueden ejecutarse
> mediante identidad de servicio, identificando el proceso en el evento y sin fabricar UUID de
> personas inexistentes."*
>
> *"Esto no autoriza revisar, corroborar ni pedir reenvíos sobre evidencia de estudiantes reales."*
>
> *"Registrar la decisión como diferida con motivo y retirar la fila de los pendientes activos
> inmediatos."*

### Por qué diferir es una respuesta y no una postergación

Las tres operaciones que esperaban esta decisión —validar una evidencia, corroborar una procedencia,
pedir un reenvío— **no pueden tocar a una persona real hasta que el dictamen legal esté**. Elegir
ahora entre *"la identidad vive en el CRM"* y *"la identidad vive en Achieve"* sería elegir sin el
dato que lo decide.

**Lo que se conserva sin cambios:** `reviewer_id` y `corroborated_by` quedan `NULL`, el actor del
evento es `null` —lo produjo un proceso—, el proceso se identifica en el payload, y las tres rutas
van con secreto de servicio.

⚠️ **`product_event.actor_id` es `uuid` y sigue sin poder recibir una identidad externa.** Aceptar un
identificador que no se puede escribir obliga a fabricar un UUID —inventar una identidad— o a romper.
Costó un `500` real, y esta decisión **no lo cambia**.

⚠️ **A `official` sigue sin llegar nadie**, y sigue sin ser un olvido: significa que la institución lo
afirma, y la Plataforma no puede autenticar a una institución.

---

<a id="adr-058"></a>

## ADR-058 — `C01-029`: la regla determinística de readiness

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-agenda-decisiones-source.md)
**Relacionado:** [ADR-011](#adr-011), [ADR-048](#adr-048), `C01-029`.
**Toca:** `pending-decisions-annex.md`, `decisiones-abiertas.md`, `roadmap.md`, `data-model.md`.

### Lo primero que la decisión fija

> *"No se implementará un porcentaje ni una predicción de aprobación. `READY_BY_PROTOCOL` significa
> únicamente que la preparación cumplió el protocolo."*

### La regla, textual

| Estado | Condición |
|---|---|
| **`READY_BY_PROTOCOL`** | *"todos los `required_steps` están completos; la evidencia se encuentra en un estado canónico suficiente o validado; `autonomous_practice = true`; `simulation = true`; y `critical_gaps` está vacío"* |
| **`NOT_READY`** | *"existe al menos un `critical_gap`, o todavía no existe ninguna señal observable de avance"* |
| **`BUILDING`** | *"cualquier caso restante; existe avance observable, pero todavía no se cumplen todas las condiciones de `READY_BY_PROTOCOL`"* |

**Y define qué cuenta como avance**, que es lo que hace decidible la frontera entre `NOT_READY` y
`BUILDING`:

> *"Se considera señal observable de avance: al menos un paso requerido completado, evidencia
> recibida o en proceso, práctica autónoma realizada o simulación realizada."*

**Con dos obligaciones de escritura:**

> *"Toda escritura debe completar `explanation` indicando qué condición se cumplió y cuáles faltan.
> Usar únicamente los estados canónicos existentes; esta decisión no autoriza crear estados nuevos."*

### Consecuencias

**El schema ya sostiene las dos obligaciones.** `explanation` es `NOT NULL` desde la Fase B5 y
`state` tiene `CHECK` con los tres estados: no hay que migrar nada para cumplirlas.

⚠️ **`C01-029` queda respondida; la tabla sigue sin escritor.** Escribir `preparation_readiness` es
trabajo de implementación con su propia etapa. **Hasta que exista, `UX08` sigue sin card, sin score y
sin porcentaje** — y eso ya no es un hueco por falta de decisión.

⚠️ **Un residuo real, y hay que decirlo:** *"la evidencia se encuentra en un estado canónico
suficiente o validado"* nombra dos estados del lifecycle de `Evidence`, y `preparation_readiness`
lleva `evidence_status` como `text` **sin `CHECK`**. Qué valores admite esa columna, y cómo se derivan
del lifecycle real, **no lo fija esta decisión**: se resuelve al implementarla, sin inventar estados
nuevos —la propia decisión lo prohíbe—.

⚠️ **Esto no cambia cuándo aparece Modo Examen.** [ADR-048](#adr-048) desacopló el disparador de
readiness —14 días calendario— y **hay un test que rompe si alguien vuelve a acoplarlos**.

---

<a id="adr-059"></a>

## ADR-059 — `C01-019`: se conserva lo actual, y la semántica completa es residuo de piloto

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-agenda-decisiones-source.md)
**Relacionado:** [ADR-026](#adr-026), [ADR-047](#adr-047), `C01-019`, `C01-032`.
**Toca:** `pending-decisions-annex.md`, `decisiones-abiertas.md`, `roadmap.md`.

### La decisión

> *"La implementación actual, que distingue un cambio de un «sin cambio confirmado», puede
> mantenerse."*
>
> *"Esto autoriza conservar el comportamiento actual de `UX06` y que `UX02` omita dimensiones cuya
> semántica todavía no esté aprobada. No autoriza mostrar valores internos, porcentajes aprendidos,
> promedios de dimensiones ni equivalencias entre confianza y dominio."*
>
> *"Registrar la definición completa de nombres observables y escalas como residuo abierto para
> validación con evidencia del piloto. No debe bloquear el MVP actual."*

### Qué queda ratificado

**Lo que `UX02` ya hace, y ahora está autorizado:** omite toda dimensión medida, porque existe el
número y no existe la unidad en la que expresarlo. `VI.2` §8.6 lo permite textualmente —*"si no existe
semántica aprobada para mostrar una dimensión, omite la síntesis o muestra un hecho comprensible;
nunca expone un valor interno bruto"*— y la decisión lo confirma.

**Las cuatro prohibiciones son las del spec**, y siguen teniendo guard: nada de `% aprendido`, de
promediar las cinco, de convertir confianza en dominio, ni de estados generales como *"consolidada"*
en lugar de nombrar la dimensión.

⚠️ **El gate `H` de `C01-019` no se levanta.** La decisión dice que **no bloquea el MVP**, que es
otra cosa: llevar `UX06` a high-fidelity sigue necesitando los nombres observables y las escalas, y
eso quedó como residuo para el piloto. `C01-019` pasa a `ANSWERED — RESIDUO ABIERTO`, no a `CLOSED`.

⚠️ **Y el residuo de `C01-032` sigue vivo:** reconciliar los dos vocabularios de dimensiones es
exactamente lo que esta decisión difiere al piloto.

---

<a id="adr-060"></a>

## ADR-060 — El temario es de la materia, no de la cátedra

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-periodo-comision-horarios-source.md) §1
**Relacionado:** [ADR-029](#adr-029), [ADR-037](#adr-037), [ADR-051](#adr-051), `C01-019`.
**Toca:** `data-model.md`, `architecture.md`, la ingesta del ADL, `estado_de_materia()`,
`estado_del_dia()`, el contexto del ADE.

### La decisión

> *"Para el MVP, el temario canónico pertenece a la **materia**, no a cada comisión."*
>
> *"El progreso del estudiante continúa asociado a los temas de la materia y debe sobrevivir
> íntegramente a un cambio de comisión."*

**Lo que la cátedra sí aporta**, textual: *"ritmo y orden de recorrido, fechas, evaluaciones,
recursos, clases realizadas, indicaciones específicas del docente"*. Lo que **no** puede hacer:
*"crear automáticamente un universo nuevo e incompatible de temas"*.

⚠️ **Y puso el límite de lo que esto autoriza:** si aparece evidencia de temarios sustancialmente
distintos, se diseñará *"una relación explícita entre el temario base y sus variaciones"*, y eso
**queda fuera del MVP**: *"no autoriza ahora un sistema de overrides o remapeos"*.

### El schema ya lo permite, y eso cambia el tamaño del trabajo

**`topic` ya tiene las dos columnas**, con un `CHECK` que exige al menos una:

```sql
topic (id, offering_id NULL, course_id NULL, parent_id, code, name, sequence)
CHECK (offering_id IS NOT NULL OR course_id IS NOT NULL)   -- topic_belongs_somewhere
```

**Hoy los cuatro topics del mundo demo cuelgan de `offering_id` y ninguno de `course_id`**, porque
las dos funciones que los escriben —`ingerir_material_del_adl()` e `ingerir_plan_de_estudios()`—
usan la offering. **No hay columna que agregar ni que borrar:** hay que mover dónde se escribe y
dónde se lee.

**Los lectores que resuelven el temario por offering son cuatro**, y todos con la misma forma
(`WHERE tp.offering_id = …`): la comprobación de `contextoIncompleto` de `estado_del_dia()`, la de
`estado_de_materia()`, y el contexto del ADE.

⚠️ **`topic.offering_id` NO se elimina**, por instrucción explícita: *"no eliminar todavía
`topic.offering_id` sin analizar impacto y migración"*. Queda para lo que sí es de la cátedra —una
unidad que una comisión agrega y otra no— y su retiro, si alguna vez ocurre, es decisión propia.

### Consecuencia sobre el progreso

`topic_progress` guarda `(course_enrollment_id, topic_id)`. Con el temario colgado del `course`,
**mover `course_enrollment.offering_id` de una comisión a otra no cambia el conjunto de temas**, así
que el progreso, las acciones, las evidencias y la bitácora sobreviven **por construcción** y no por
una migración de datos. Era la pregunta que el informe marcó como la que condiciona todo lo demás.

---

<a id="adr-061"></a>

## ADR-061 — Período académico: año lectivo, semestre y anualidad, con vocabulario cerrado

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-periodo-comision-horarios-source.md) §3 y §4
**Relacionado:** [ADR-051](#adr-051), [ADR-052](#adr-052), [ADR-053](#adr-053).
**Toca:** `lib/domain/alta.ts`, `/alta/carrera`, `/alta/materias`, `catalogo/*.csv`,
`importar-catalogo.mjs`, `confirmar_mapa_academico()`, `data-model.md`.

### Tres conceptos que dejan de ser uno

> *"Separar conceptualmente: año lectivo · semestre actual del estudiante `FIRST_SEMESTER` o
> `SECOND_SEMESTER` · período de dictado de una materia: primer semestre, segundo semestre o anual."*

⚠️ **La anualidad no es un tercer valor del semestre del estudiante.** Textual: *"una persona puede
estar en el segundo semestre y cursar simultáneamente materias anuales"*. Es una propiedad de **la
materia**, no del alumno, y una anual *"debe poder aparecer durante ambos semestres del mismo año
lectivo"*.

### Se acaba la inferencia por el mes

> *"No continuar usando texto libre ni inferir el período según el mes actual."*

`periodoDeCursado()` deriva hoy `'2026-2'` de `Date.getMonth()`, con su propio comentario diciendo
que *"es una convención de la demo, no una regla académica"*. **Ese comentario se cumple: se
pregunta.**

### Vocabulario cerrado, y la razón está dicha

> *"Debe evitar que valores como `1`, `primer semestre`, `2026-1` y `S1` representen el mismo
> concepto de maneras diferentes."*

Hoy `enrollment.term` y `course_offering.term` son `text` **sin `CHECK`**, y
`curriculum_requirement.term` e `is_annual` **existen y están en `NULL` en las 213 filas** — el
importador de CSV ya las lee.

### Dónde se pregunta

> *"El año lectivo y el semestre actual se preguntan dentro de `/alta/carrera`. No crear una pantalla
> independiente exclusivamente para el período y no agregar un quinto paso."*

**El alta pasa de tres pasos a cuatro** —el cuarto es comisión y horarios ([ADR-062](#adr-062),
[ADR-063](#adr-063))—, no a cinco. Y `/alta/materias` **agrupa por período**: primero las del
semestre elegido, las anuales en un grupo aparte, y la salida a otros años y períodos.

⚠️ *"No asumir que el alumno cursa todas las materias sugeridas por el plan"* — es la regla de
`UF-S02` que el alta ya cumple, y se ratifica.

---

<a id="adr-062"></a>

## ADR-062 — La asignación de comisión: cuatro estados canónicos, en la cursada

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-periodo-comision-horarios-source.md) §2
**Relacionado:** [ADR-051](#adr-051), [ADR-052](#adr-052), [ADR-060](#adr-060).
**Toca:** `course_enrollment`, `catalogo_ofrecible()`, `confirmar_mapa_academico()`,
`GET /api/alta`, `POST /api/alta/materias`, la cuarta pantalla del alta.

### Los cuatro estados

| Estado | Qué dice |
|---|---|
| `CONFIRMED` | *"el estudiante confirmó una comisión existente"* |
| `UNKNOWN` | *"el estudiante todavía no sabe cuál es su comisión"* |
| `NOT_LISTED` | *"conoce su comisión, pero no aparece en el catálogo"* |
| `NOT_APPLICABLE` | *"la materia no utiliza comisiones"* |

> *"El estado pertenece a `course_enrollment`, porque describe la situación del estudiante."*

**Eso resuelve la ambigüedad que el informe marcó:** hoy `course_offering.commission IS NULL`
significa a la vez *"la institución no declara comisiones"* y *"el alumno no sabe la suya"*. El
primero sigue siendo un hecho del catálogo; el segundo pasa a ser `UNKNOWN` en la cursada. **Son dos
columnas en dos tablas, y por eso dejan de colapsarse.**

### Las cinco reglas, textuales

- *"`UNKNOWN` debe permitir continuar el alta."*
- *"`NOT_LISTED` debe permitir escribir como mínimo el nombre declarado por el estudiante y
  conservarlo como dato no verificado."*
- *"`NOT_APPLICABLE` no es equivalente a `UNKNOWN`."*
- *"**Nunca seleccionar automáticamente la primera comisión.**"*
- *"Debe existir una acción global `No sé mis comisiones todavía`, que marque como `UNKNOWN` las
  cursadas correspondientes sin bloquear el alta."*

⚠️ **`NOT_LISTED` necesita dónde guardar el nombre**, y `course_enrollment` no tiene una columna de
texto libre. Es la única consecuencia de schema que este ADR agrega más allá del estado.

⚠️ **Y lo que la comisión habilita, no lo decide este ADR.** Con `CONFIRMED` se puede usar el ritmo,
las evaluaciones y los recursos **de esa cátedra**; con los otros tres, la Plataforma trabaja con
información general de la materia — que desde [ADR-060](#adr-060) es donde vive el temario.

---

<a id="adr-063"></a>

## ADR-063 — Horarios: dos propietarios, procedencia obligatoria y estado explícito

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-periodo-comision-horarios-source.md) §6, §7 y §8
**Relacionado:** [ADR-006](#adr-006), [ADR-029](#adr-029), [ADR-057](#adr-057), `C01-030`, `I9`.
**Toca:** una entidad nueva, `course_enrollment`, la cuarta pantalla del alta, `data-model.md`.

### Dos hechos distintos, y ninguno se disfraza del otro

> *"1. El horario publicado de una comisión pertenece a `course_offering`. 2. El horario declarado
> personalmente por un estudiante que todavía no conoce su comisión pertenece a
> `course_enrollment`."*
>
> *"**No crear una comisión ficticia** ni utilizar la offering con `commission IS NULL` para guardar
> el horario personal."*

Y el caso que la representación tiene que sostener, textual: **«comisión desconocida, pero días y
horarios conocidos»**. Con dos prohibiciones de forma: *"deben mantenerse las FK reales, la
procedencia y la diferencia semántica. **No usar JSON opaco ni identificadores fabricados**"*.

### El estado va en la cursada, no en una fila negativa

> *"No crear una fila horaria negativa para representar desconocimiento. Guardar el estado explícito
> en la cursada y las filas de horario únicamente cuando exista al menos un bloque conocido."*

**Y comisión y horario son independientes**, con sus cuatro combinaciones declaradas: comisión
conocida sin horarios · comisión desconocida con horarios · ambos · ninguno.

⚠️ **La ausencia de horarios nunca se lee como disponibilidad.** Es el invariante *sin datos no es
cero* aplicado a esto, y por eso el negativo tiene que ser explícito.

⚠️ **Los bloques de clase no se mezclan con `availability`:** *"uno expresa cuándo está cursando y el
otro cuándo puede estudiar"*. `availability` sigue siendo del estudiante y sigue alimentando
`minutosDisponibles`.

### Un horario declarado se usa sin corroborar, y eso no lo eleva

> *"Un horario declarado por el estudiante puede usarse inmediatamente como una restricción personal
> para sus compromisos, con `source_type = student` y `verification_status = unverified`."*
>
> *"Usarlo como restricción personal no significa presentarlo como horario oficial de la
> institución."*

**Hasta cerrar ADR-006 y `C01-030`:** nadie lo promueve a `verified` u `official`, no hace falta
corroboración humana para que el propio estudiante lo use, y **no se publica ni se reutiliza
automáticamente para otros estudiantes**.

> **Por qué esto no rompe `I9`.** El invariante dice que **elevar** un `verification_status` es una
> operación explícita y única (`corroborar_procedencia()`). Esta decisión **no eleva nada**: usa el
> dato en el estado en que está, para quien lo declaró. La identidad de quien corrobora sigue
> diferida por [ADR-057](#adr-057).

---

<a id="adr-064"></a>

## ADR-064 — La superposición con una clase se valida en el `Commitment`, no en el ADE

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-periodo-comision-horarios-source.md) §5
**Relacionado:** [ADR-004](#adr-004), [ADR-040](#adr-040), [ADR-046](#adr-046), [ADR-063](#adr-063).
**Toca:** `POST /api/compromiso`, `propuestaDeCompromiso()`, `UX04`, `lib/domain/`.

### La decisión, y por qué importa dónde va

> *"La restricción horaria pertenece a la propuesta y validación del `Commitment`, no al ADE."*
>
> *"El ADE continúa decidiendo qué hacer, sobre qué materia o unidad, cuántos minutos dedicar. **El
> flujo de `Commitment` decide cuándo hacerlo.**"*

**Es la corrección que el informe planteó, aceptada.** El ADE nunca agenda: elige unidad y dimensiona
el bloque con `MIN(availability.capacity_min)` —una duración, sin día y sin hora—, y el `start_at` lo
manda el cliente. Poner la regla en el ADE no habría cambiado nada visible.

### Qué pasa cuando hay conflicto

> *"No confirmar silenciosamente el compromiso. Mostrar el conflicto. Pedir que elija otro horario o
> que corrija el bloque de clase si ya no corresponde."*

**Las dos salidas son del estudiante**, y la segunda importa: un bloque de clase puede estar
desactualizado, y la pantalla no puede asumir que el equivocado es él.

⚠️ **Un conflicto no es un error técnico.** Sigue el patrón de `RENEGOCIACION_NO_ELEGIBLE`
([ADR-050](#adr-050)): un estado de producto con motivo canónico, que la superficie resuelve con
`t()` — no un `500`, y no un botón apagado sin explicación.

⚠️ **Y sólo se valida contra horarios conocidos.** Con el estado en *desconocido*
([ADR-063](#adr-063)) no hay contra qué comparar, y **no se bloquea nada**: la ausencia no es
disponibilidad, pero tampoco es un impedimento.

---

<a id="adr-065"></a>

## ADR-065 — La electiva todavía no elegida persiste como `PENDING_SELECTION`

**Estado:** ✅ `ACCEPTED` · 5 de septiembre de 2026 · **decidido por el Product Owner** —
[fuente literal](respuesta-po-periodo-comision-horarios-source.md) §9
**Relacionado:** [ADR-051](#adr-051), [ADR-052](#adr-052).
**Toca:** `requirement_declaration`, `confirmar_mapa_academico()`, `components/alta/materias.tsx`.

### La decisión

> *"La declaración debe poder sobrevivir con estado `PENDING_SELECTION` aunque todavía no tenga
> `course_enrollment_id` ni nombre escrito."*
>
> *"`confirmar_mapa_academico()` **no debe borrar esa declaración** durante una reconfirmación."*

Con las tres salidas del estudiante: elegir una opción existente · declarar una que no aparece ·
**«Todavía no elegí mi electiva»**. Ninguna bloquea el alta.

### El `CHECK` que hoy lo impide, y hay que decirlo

`requirement_declaration` lleva:

```sql
CHECK (num_nonnulls(course_enrollment_id, declared_label) = 1)   -- una_sola_forma
```

**Una fila con los dos en `NULL` es imposible hoy por constraint**, no por descuido: el `CHECK` se
escribió para que una declaración siempre dijera *algo*. `PENDING_SELECTION` es un tercer valor
legítimo de *"algo"*, y el constraint tiene que admitirlo **sin dejar de rechazar el caso que
prevenía** —una fila con las dos formas a la vez—.

⚠️ **Y el borrado de la reconfirmación es el otro bloqueo.** `confirmar_mapa_academico()` elimina las
declaraciones del plan que no vengan en la selección; una electiva pendiente no viene, así que hoy se
borraría en la siguiente confirmación. **La función tiene que distinguir «no lo eligió» de «no me lo
mandaron».**


---

<a id="adr-066"></a>

## ADR-066 — El Gantt de preparación es `UX02`, no una superficie nueva

**Estado:** ✅ `ACCEPTED` · 7 de septiembre de 2026 · **decidido por el Product Owner**
**Relacionado:** [ADR-016](#adr-016), [ADR-054](#adr-054), [ADR-058](#adr-058).
**Toca:** [`gantt-de-preparacion.md`](gantt-de-preparacion.md) §7, `estado_de_materia()`,
`components/` de `UX02`. **No toca** `lib/navigation/`.

### El contexto

Dos pares de mockups del owner propusieron una vista de línea de tiempo por materia —temas, fecha de
evaluación, cobertura, minutos pendientes— dentro de una navegación de cinco secciones. La lectura
inicial del equipo fue que hacía falta **una superficie nueva**, con todo lo que eso arrastra:
un `UX10` que el registro prohíbe explícitamente, un wireframe, una ruta, y CTAs nuevas que
[ADR-054](#adr-054) dejó establecido que **las autoriza el owner, una por una**.

### La decisión

> *"es lo que Materia debería haber sido siempre"*

**El Gantt no es una pantalla nueva: es el contenido correcto de `UX02 · Materia / Cursado`.**

No se crea `UX10`. El registro sigue en **nueve superficies y 19 CTAs**. Los guards de navegación,
el conteo de nodos y el mapeo `WF-S*` **no se tocan**.

### Por qué no es sólo la opción barata

La pregunta canónica de `UX02`, fijada mucho antes de esta conversación, es
***"¿Cómo vengo en esta materia y qué hago?"***. Es exactamente la pregunta que el Gantt contesta.
`UX02` venía respondiéndola con una lista de unidades; pasa a responderla con una línea de tiempo.
**El alcance de la superficie no cambia — cambia su representación.**

### Lo que ya estaba resuelto y nadie había mirado

`estado_de_materia()` ya devuelve la mayor parte del payload, y con las reglas correctas ya
implementadas:

- El examen más próximo **ordenado `ASC NULLS LAST`**: una fecha desconocida no se estima.
- Las unidades por `sequence ASC NULLS LAST`: sin `sequence` van al final, **no se les inventa
  posición**.
- Por unidad, **el estado de cada dimensión y nunca su valor** (`dominio`, `practica`, `recorrido`).
- `contextoIncompleto` como **hecho de la base**, no inferencia — el estado degradado ya existe.

Faltan **tres campos**: `minutosBase` por unidad, `cobertura` ponderada, y los días hasta el examen
—estos últimos derivables en el cliente desde `fechaEn` e `instante`, que ya viajan—.

Y las CTAs principales del mockup ya están registradas: `CTA-001` abre la materia llevando la cursada
de la fila tocada ([ADR-054](#adr-054)), `CTA-019` es la entrada manual a Modo Examen desde `UX02`
([ADR-016](#adr-016)), y `CTA-002` y `CTA-009` ya tienen origen en `UX02`.

### Consecuencias

⚠️ **`CTA-019` colisiona con el estado degradado, y esto queda abierto.** La CTA aparece sólo si la
materia tiene una evaluación elegible, *porque el estudiante no puede crear una `Assessment` desde
`UX02`* —la Etapa 0.4 lo dejó sin implementar—. El estado degradado *"sin fecha de evaluación"*
proponía justamente ofrecer agendarla. **O esa CTA no entra al MVP, o hay que reabrir la Etapa 0.4.**

⚠️ **Esta decisión no decide la navegación.** Las cinco secciones del mockup —incluidas `Formación` y
`Mi seguimiento`— siguen sin decidir. No son parte del Gantt: son dos productos separados que
aparecieron en el mismo mockup.

⚠️ **Y no habilita la barra.** Qué muestra y qué tiene prohibido mostrar —la tensión con
[ADR-058](#adr-058), que cerró la readiness *sin porcentaje y sin predicción de aprobación*— sigue
abierta en el ADR de cobertura propuesto en [`gantt-de-preparacion.md`](gantt-de-preparacion.md) §11.


---

<a id="adr-067"></a>

## ADR-067 — El estudiante da de alta su propia evaluación

**Estado:** ✅ `ACCEPTED` · 7 de septiembre de 2026 · **decidido por el Product Owner**
**Relacionado:** [ADR-006](#adr-006), [ADR-029](#adr-029), [ADR-048](#adr-048), [ADR-054](#adr-054),
[ADR-057](#adr-057), [ADR-066](#adr-066). **Reabre la Etapa 0.4.**
**Toca:** `app/api/evaluacion/`, `lib/navigation/cta-registry.ts`, `estado_de_materia()`, `UX02`,
[`gantt-de-preparacion.md`](gantt-de-preparacion.md) §7,
[`roadmap.md`](roadmap.md#fase-b2b--ingesta-del-academic-data-layer--en-curso).

### El agujero

**Ninguna ruta de la aplicación llega a un escritor de `assessment`.** El estudiante no tiene por
dónde declarar que tiene un final.

> ⚠️ **Corrección del 7 de septiembre, el mismo día.** Este ADR decía primero que *"no existe ningún
> escritor de `assessment`, ni la ingesta asistida de B2b"*. **La segunda mitad es falsa.**
> `ingerirMateria()` sí escribe evaluaciones —servicio, repositorio y la RPC `ingerir_materia`, con
> tests—, y la primera búsqueda no la encontró porque el `INSERT` vive dentro de una función de
> Postgres y el cliente la llama por `.rpc()`.
>
> **Lo que sigue en pie es el hecho que importa:** `grep -rn "ingerirMateria" app/` no devuelve nada.
> Es un escritor completo **que ninguna ruta alcanza**.
>
> Y no sirve para esto aunque se expusiera: `ingerir_materia` **reemplaza** las unidades y las
> evaluaciones de la cursada entera. Es ingesta con forma de guía —*"acá está la materia completa"*—,
> no *"agregá esta evaluación"*. Usarla para dar de alta un final borraría el temario.

Y `assessment_date` sostiene todo lo demás: la cuenta regresiva del Gantt, `estado_de_materia().examen`,
`contexto_del_ade().proximaEvaluacion`, la aparición de `CTA-019`, y la ventana de 14 días de
[ADR-048](#adr-048).

El diseño asumía que las evaluaciones llegaban de la institución. **Esa vía está cerrada por
[ADR-006](#adr-006)** y va a seguir cerrada hasta el dictamen legal. La Etapa 0.4 registró el hueco y
decidió no taparlo —*"dar de alta una evaluación no registrada no se implementa"*—. En agosto era
razonable porque nada dependía de ello. Con el Gantt, sí.

### La decisión

**El estudiante da de alta sus evaluaciones desde `UX02`.** Es el mismo principio que ya rige para
las cátedras —*"en un principio el alumno se autoagenda"*— extendido a las evaluaciones.

| | |
|---|---|
| **Dónde** | `POST /api/evaluacion`, con `CTA-020` desde `UX02` |
| **Procedencia** | `source_type = 'student'`, `verification_status = 'unverified'`, `confidence` `NULL` |
| **Obligatorio** | `assessment_type` y `title` |
| **Opcional** | `assessment_date`, `assessment_time`, `modality`, `scope`, y el alcance en `assessment_topic` |

### Las cinco cosas que esto decide, y por qué

**1 · La fecha es opcional, y eso es el punto.**

`assessment.assessment_date` es `NULL`-able a propósito: *"una fecha desconocida NO se estima: la
línea desaparece"*. Un estudiante que sabe que tiene final pero no cuándo **tiene que poder
registrarlo**: con eso ya hay temas y alcance, que es la mitad del Gantt. Obligar la fecha lo forzaría
a inventar una, que es exactamente lo que la columna previene.

⚠️ **Sin fecha no hay Modo Examen.** La ventana de [ADR-048](#adr-048) necesita una fecha para
contar. La evaluación existe, el Gantt la muestra, y `CTA-019` **no aparece** — que es lo correcto y
no un error.

**2 · No crea `ExamPreparation`, y no activa nada.**

Igual que `CTA-019`, que lleva a `UX07` pero no activa: eso lo hace `CTA-011` con confirmación
explícita. Dar de alta una evaluación es registrar un hecho del mundo, no empezar a prepararla.

**3 · Se aceptan duplicados. Deduplicar es corroborar, y eso está diferido.**

Dos estudiantes de la misma comisión van a cargar el mismo parcial y van a quedar dos filas sobre el
mismo `offering_id`. **No se agrega un `UNIQUE`**: un `UNIQUE` haría que el error de tipeo de uno le
bloquee la carga al otro. Y no se fusionan solas: fusionar dos declaraciones `unverified` en una es
un acto de corroboración, y **quién corrobora sigue diferido por [ADR-057](#adr-057)**.

Las filas conviven `unverified` hasta que haya quién las eleve. Es lo mismo que
[ADR-029](#adr-029) ya estableció para todo lo que carga el estudiante.

**4 · La modalidad se guarda entera, aunque P0 no la cubra.**

`modality` admite `oral` y `mixta`, y `C01-047` las deja fuera de P0. Se **almacenan igual**, sin
mapearlas a una modalidad P0. Si el estudiante declara un oral, `POST /api/examen/activacion`
devuelve `SIN_PROTOCOLO` con `409` — que la ruta ya trata como *"un estado legítimo del mundo, no una
falla"*.

**5 · No lo bloquea [ADR-006](#adr-006).**

Una evaluación es un hecho académico sobre una comisión, no un dato personal. Se construye **hoy**,
sobre el mundo sintético, como todo lo demás.

### La consecuencia que hay que decir fuerte

⚠️ **El registro canónico de CTAs pasa de 19 a 20.**

`CTA-020` · `UX02 → UX02` · *dar de alta una evaluación*. Aparece **siempre** que haya cursada —a
diferencia de `CTA-019`, que exige una evaluación existente—, porque es justamente la CTA que resuelve
el caso en que no hay ninguna.

Esto toca los guards de navegación y el conteo de nodos. Es la **única** entrada nueva al registro que
el Gantt necesita: [ADR-066](#adr-066) evitó todas las demás.

⚠️ **Y el estado degradado *"sin fecha de evaluación"* de `gantt-de-preparacion.md` §6 queda
resuelto**: su CTA es `CTA-020`, no una CTA nueva.

> ⚠️ **Un defecto que este ADR introdujo, encontrado y corregido el 7 de septiembre.**
> `ingerir_materia` hacía `DELETE FROM assessment WHERE offering_id = ...` antes de cargar el material
> nuevo. Con `declared_by`, **una ingesta de material de cátedra le borraba al estudiante el final que
> él había cargado**, sin aviso.
>
> No era un defecto antes de este ADR: nadie podía declarar evaluaciones. Lo pasó a ser en el mismo
> commit que dio el alta. La corrección está en `20260920010000_ingesta_de_clases.sql`, y la regla es
> **la ingesta reemplaza lo que la ingesta trajo**: `AND declared_by IS NULL`.

### Lo que esto no decide

- **Quién eleva una evaluación a `corroborated` u `official`.** Sigue en [ADR-057](#adr-057).
- **Si el alcance se propone desde el libro de temas.** La derivación `tema → parcial` está descrita
  en [`gantt-de-preparacion.md`](gantt-de-preparacion.md) §3.1 y necesita su propio ADR.
- **Editar o borrar una evaluación ya cargada.** El alta es lo que desbloquea el Gantt; la corrección
  entra después, y por el patrón versionado de `class_event_record` —una corrección crea fila nueva,
  no sobrescribe— y no por `UPDATE`.


---

<a id="adr-068"></a>

## ADR-068 — La duración entra al modelo académico

**Estado:** ✅ `ACCEPTED` · 7 de septiembre de 2026 · **decisión técnica del equipo**
**Relacionado:** [ADR-053](#adr-053), [ADR-066](#adr-066), [ADR-069](#adr-069).
**Toca:** `class_session`, `course_offering`, `topic`, `lib/domain/`, `estado_de_materia()`.
**Fuente:** [`inventario-corpus.md`](inventario-corpus.md), [`gantt-de-preparacion.md`](gantt-de-preparacion.md) §4.

### El contexto

La capa académica está completa salvo por una cosa: **no hay duración en ninguna parte**.
`class_session` guarda `session_date` y nada más. `topic` no tiene peso ni minutos. `course` no tiene
carga horaria. Sin eso, el Gantt puede decir *qué* falta pero no *cuánto*.

### La decisión — cinco columnas

| Tabla | Columna | Qué guarda |
|---|---|---|
| `class_session` | `duration_min INTEGER` | Los minutos **observados** de esa sesión |
| `class_session` | `session_time TIME` | La hora. El libro la trae en cada fila y hoy se descarta |
| `class_session` | `stream TEXT` | `'teorico'` \| `'practico'` \| `'teorico_practico'`. `NULL` = desconocido |
| `course_offering` | `declared_total_min INTEGER` | La carga horaria **declarada** por el programa |
| `course_offering` | `declared_total_source TEXT` | **El texto literal que se leyó** para afirmarla |

⚠️ **`stream` lleva tres valores, no dos.** El corpus usa `TEORICO-PRACTICO` mezclado dentro de una
misma corrida. Modelarlo con dos valores obligaría a elegir uno de los dos y perder el dato.

Y `topic.weight NUMERIC` **nullable**, para el peso que pidió el owner.

### Las tres cosas que esto decide de verdad

**1 · Los minutos por tema NO se persisten.**

Una clase cubre varios temas (`class_session_topic`). Repartir sus minutos entre ellos es una
**derivación**, y se calcula al leer, versionada por la regla que la produjo. No lleva columna.

Dos razones, y la segunda es la que manda:

- Persistir una estimación la congela como si fuera un hecho.
- **Se vuelve mentira sola.** Cuando una clase posterior vuelve sobre el mismo tema, el reparto
  anterior deja de ser correcto y nadie lo recalcula.

Es el mismo criterio que ya rige en `topic_progress`: *"No hay columna de score agregado y no se
agrega: DD5 y P-03 prohíben la magnitud de máquina visible."*

**2 · `declared_total_source` guarda el texto, no la interpretación.**

El programa declara la carga horaria en formatos que no se parecen entre sí —`60 horas`, `30 horas`,
`26 Hs`, `3 horas prácticas + 2 teóricas semanales`, `Instancias Supervisadas: 30 horas`—. Se guardan
**las dos cosas**: los minutos normalizados y la cadena que se leyó.

Precedente directo: `curriculum_requirement.year_source`, *"qué se vio para afirmar el año, y qué no
se pudo leer"*. Cuando la normalización esté mal, se va a poder ver por qué sin volver al PDF.

**3 · El peso es todo-o-nada por materia.**

Si alguna unidad de una materia tiene `weight` declarado y otra no, **la materia se trata como sin
pesos** y todas las unidades pesan igual.

Un `weight` faltante **no es `1.0`**: es ausencia de dato, y mezclar pesos declarados con defaults
inventados produce un reparto que parece medido y no lo es. *Sin datos no es cero.*

### Lo que no cambia

⚠️ **El conteo de clases del encabezado sigue sin usarse.** `[ 30 CLASE/S ]` es inservible y ahora hay
números: `ANÁLISIS MATEMÁTICO I` declara 60 y registra 24; `INGENIERÍA DE SOFTWARE I` declara 30 y
registra 14; `ÁLGEBRA` declara 30 y registra 31. **No hay factor de corrección** — se leen las filas.

⚠️ **La reconciliación vive en `lib/domain/`, no en SQL.** Combinar el total declarado con la
distribución observada es una regla de producto que va a cambiar; una función de base la volvería
difícil de versionar.

---

<a id="adr-069"></a>

## ADR-069 — `session_kind` se propone, no se importa

**Estado:** ✅ `ACCEPTED` · 7 de septiembre de 2026 · **decisión técnica del equipo**
**Relacionado:** [ADR-029](#adr-029), [ADR-057](#adr-057), [ADR-067](#adr-067), [ADR-068](#adr-068).
**Toca:** `class_session`, el importador de libros de temas, `lib/domain/`.

### El problema

Un parcial aparece en el libro de temas como una fila más, con su fecha. Si el importador lo trata
como una clase, el Gantt cuenta el examen como tiempo de cursada **y le atribuye los temas que el
parcial evaluaba**.

Entonces hace falta distinguirlos. **Y el dato para distinguirlos no está donde debería.**

### Lo que dice el corpus, medido

La columna de tipo del libro **no marca el parcial**:

| Valor de la columna `tipo` | Filas |
|---|---|
| `NORMAL` | **988** |
| `RECUPERATORIO` | 18 |
| `CONSULTA` | 9 |
| `PARCIAL` | 1 |
| `FERIADO` | 1 |

**988 de ~1016 filas dicen `NORMAL`.** El parcial vive en el **texto libre del tema** —*"Primer
parcial"*, *"Parcial 1"*, *"1er parcial escrito teórico/práctico"*— y ese texto es ambiguo:

> **De 88 filas cuyo tema menciona una evaluación, 22 no son una evaluación: el 25%.**

| Texto | Qué es en realidad |
|---|---|
| *"Derivación. **Derivadas parciales**. Diferenciación."* | Un tema de análisis matemático |
| *"**Repaso para el parcial**. Lenguajes regulares, autómatas"* | La clase **anterior** al parcial |
| *"**entrega de parciales** — cuantificadores lógicos"* | La clase **posterior**, devolviendo notas |
| *"**Consulta** para parcial — Generación de netlist"* | Una consulta |

Las tres últimas **sí dictaron tema**. Marcarlas como parcial borraría contenido real del Gantt.

### La decisión

**`class_session.session_kind`** con `'clase'` \| `'parcial'` \| `'recuperatorio'` \| `'consulta'`
\| `'no_dictada'`, y `NULL` = desconocido.

**El importador nunca lo escribe solo.** Propone una clasificación y **una persona la confirma**, con
la fila entrando como `'clase'` hasta que alguien diga otra cosa. Es la misma forma que los
prerequisitos: el motor propone, una persona aprueba.

Con 25% de falsos positivos medidos, un importador automático marcaría *"Derivadas parciales"* como
examen: **borraría un tema e inventaría una fecha límite**. Los dos errores en la misma fila.

### Las dos reglas que se derivan

**1 · Sólo `'clase'` aporta minutos.** Un parcial ocupa el aula pero no dicta tema. Un
`'recuperatorio'` y una `'consulta'`, tampoco.

**2 · `NULL` cuenta como clase, y hay que decirlo.** El 97% de las filas son clases; tratar lo
desconocido como no-clase perdería casi todo el tiempo de cursada. **Se elige el error chico**: contar
un parcial mal clasificado suma unos minutos de más; descartar todo lo no confirmado dejaría el Gantt
vacío.

### Lo que queda afuera

- `'no_dictada'` **no sale de la columna `tipo`**: sale del asterisco que el pie del libro define como
  *"\* = CLASE NO DICTADA"*. Es otro parser y entra después.
- **Quién confirma la clasificación** sigue diferido por [ADR-057](#adr-057). Mientras tanto la
  confirma el estudiante sobre su propia cursada, como en [ADR-067](#adr-067).


---

<a id="adr-070"></a>

## ADR-070 — El factor de estudio es un **piso** versionado, no un valor

**Estado:** ✅ `ACCEPTED` · 7 de septiembre de 2026 · **decidido por el Product Owner**
**Relacionado:** [ADR-068](#adr-068), [ADR-072](#adr-072).
**Toca:** `lib/domain/`.

### La decisión, textual del owner

> *"Para mí lo mejor es que el sistema proponga **1,5 hs por cada hora de clase mínimo**, luego
> podemos pensar en algo que vaya calibrando a partir de la capacidad del alumnado en general, el
> Personal Engine pida más horas para un tema, o los datos indiquen que hace falta más tiempo."*

**La palabra que decide el diseño es «mínimo».** No es una estimación central de la que se puede
desviar en las dos direcciones: es un **piso**.

```
minutos_de_estudio(tema) = minutos_de_clase(tema) × 1.5 × multiplicador(estudiante)
                                                          └── ≥ 1.0, nunca menos
```

⚠️ **El Personal Engine puede pedir más tiempo; no puede prometer que vas a necesitar menos.** Un
multiplicador por debajo de `1.0` convertiría el motor en algo que le dice al estudiante que estudie
menos de lo que la cátedra supone — y eso no es una calibración, es una promesa que el sistema no
puede sostener.

### Constante versionada, no tabla

El repositorio tiene un patrón claro para configuración versionada —`risk_rule`, `exam_protocol`,
`error_type`—, y **este factor no entra ahí**. Esas tablas existen porque conviven varias versiones a
la vez y porque alguien fuera del equipo técnico las edita. El `1.5` no cumple ninguna de las dos:
hoy es un número, igual para todos.

Va como constante en `lib/domain/`, con su `rule_version` viajando en el resultado —igual que
`REGLA_DE_DURACION` de [ADR-068](#adr-068)—, para que **cambiar el factor no reescriba las
estimaciones viejas**. Cuando haga falta que varíe por institución o por materia, se muda a una tabla
y este ADR se supersede.

### Lo que esto no decide

**Cómo se calibra.** *"Algo que vaya calibrando a partir de la capacidad del alumnado en general"* es
Personal Engine y necesita datos que todavía no existen. Hoy el multiplicador arranca en `1.0` y se
queda ahí: **sin historia no se penaliza ni se premia a nadie.**

---

<a id="adr-071"></a>

## ADR-071 — Los prerequisitos los aprueba el estudiante sobre su cursada

**Estado:** ✅ `ACCEPTED` · 7 de septiembre de 2026 · **decidido por el Product Owner**
**Relacionado:** [ADR-029](#adr-029), [ADR-057](#adr-057), [ADR-067](#adr-067), [ADR-069](#adr-069).
**Toca:** `topic_prerequisite`, `lib/domain/`, `UX02`.

### El problema, y el dato que lo cambió

El owner propuso *"cada unidad necesita la siguiente"*, y ofreció el mecanismo: *"ofrece el engine al
administrador relaciones y él las aprueba"*.

**El corpus desmiente la primera mitad.** `SISTEMAS DE INFORMACIÓN` 2024 dictó U2, U3, U4, U7, U8,
U9… **y U1 al final, en la clase 13**. `ORG. Y ADM. DE EMPRESAS` 2025 dictó U1, U2, U4, parcial de
«U 1,2,4», y recién después U3.

Esos profesores reordenaron **a propósito**. Un prerequisito derivado de la numeración del programa
habría bloqueado al estudiante en un tema que la cátedra decidió dejar para el cierre.

`topic_prerequisite` ya existe justamente para no cometer ese error:

> *"Prerequisitos explícitos. Derivarlos de `topic.sequence` sería inventar una regla académica."*

### La decisión

**El motor propone desde el orden dictado** —`class_session.session_date`, nunca `topic.sequence`— y
**el estudiante aprueba sobre su propia cursada**.

⚠️ **La segunda mitad de la propuesta del owner no era construible como estaba escrita.** No existe
ninguna superficie de administrador: los nueve nodos del registro son del estudiante, y ADR-003
—convergencia del Operador con el CRM— y [ADR-057](#adr-057) —quién valida y corrobora— siguen
abiertos. Cablearlo a un administrador sería cablearlo a nadie.

Es el mismo principio que ya rige para las cátedras y para las evaluaciones
([ADR-067](#adr-067)): *"en un principio el alumno se autoagenda"*. Entra `unverified` y **no se
auto-eleva** ([ADR-029](#adr-029)).

### El costo, dicho

**No hay efecto red.** Cada estudiante aprueba los suyos, y la aprobación de uno no le sirve a otro de
la misma comisión — exactamente como las evaluaciones de [ADR-067](#adr-067), y por el mismo motivo:
fusionar dos declaraciones `unverified` es corroborar, y quién corrobora sigue diferido.

⚠️ **Y hoy nada consume prerequisitos.** El Gantt los muestra; no bloquea con ellos. Bloquear un tema
porque otro no está «hecho» sería una afirmación de readiness, y eso lo cierra
[ADR-058](#adr-058).

> 📋 **La superficie que este ADR no encontró es la misma que le falta a otros tres.** El planteo
> —cuántos roles humanos son, y cuál se puede construir con ADR-006 todavía cerrado— está en
> [`agenda-po-superficie-academica.md`](agenda-po-superficie-academica.md).

---

<a id="adr-072"></a>

## ADR-072 — Qué muestra la barra, y qué tiene prohibido mostrar

**Estado:** ✅ `ACCEPTED` · 7 de septiembre de 2026 · **decidido por el Product Owner**
**Relacionado:** [ADR-058](#adr-058), [ADR-066](#adr-066), [ADR-068](#adr-068).
**Toca:** `estado_de_materia()`, `lib/domain/`, `UX02`.

### La tensión

[ADR-058](#adr-058) cerró la readiness como regla determinista **sin porcentaje y sin predicción de
aprobación**. Una barra con un número al lado es exactamente la forma que tiene un producto de violar
eso sin darse cuenta.

### La decisión

**La barra muestra cobertura, y la cobertura no es readiness.** Son dos objetos distintos:

| | Qué afirma | Quién lo produce |
|---|---|---|
| **Cobertura** | Cuántas de tus unidades tienen evidencia enviada | Hechos del estudiante |
| **Readiness** | Si estás en condiciones de rendir | `preparation_readiness`, con su regla y su explicación |

El texto es el que escribió el owner en su mockup, y se adopta literal:

> **1 de 9 temas · 26% de las horas**
>
> ***\* temas marcados por vos sobre el total cargado. No es una nota ni una predicción.***

### Por qué van los dos números, y no uno

```
cobertura = Σ minutos_base(temas con evidencia enviada) / Σ minutos_base(temas declarados)
```

**Ponderada por horas**: un tema de seis horas no vale lo mismo que uno de una. Pero entonces
`1 de 9` (11%) y `26% de las horas` **no coinciden a propósito**, y la barra se dibuja con el 26%.

⚠️ **Mostrar sólo el conteo dejaría la ponderación invisible**: la barra al 26% junto a un texto que
dice «1 de 9» se lee como un defecto. **Mostrar sólo la barra sería peor**: una barra sin cifra es el
*score de máquina* que el producto se prohíbe, porque nadie puede auditar de dónde sale.

### Las cuatro cosas que la barra tiene prohibido hacer

1. **No leer `topic_progress.domain_value`.** El dominio requiere evaluación; la cobertura sólo
   requiere que el estudiante haya producido algo. Mezclarlos convierte la barra en una nota.
2. **No ordenar materias por cobertura.** Ordenar por cobertura es un ranking de qué tan mal vas. El
   orden es por próxima evaluación, con las sin fecha al fondo.
3. **No completarse sola.** Un tema sin evidencia no aporta, y **un tema sin minutos conocidos no
   entra al denominador** — si entrara, cargar el libro de temas *bajaría* la cobertura sin que el
   estudiante hiciera nada mal.
4. **No existir cuando no hay datos.** Sin minutos no hay barra: hay
   *"sin clases cargadas — no puedo estimar"*. Una barra vacía por falta de datos y una por falta de
   trabajo **no se dibujan igual** ([ADR-068](#adr-068), y el `SIN_DATOS` de `duracion.ts`).

### Qué cuenta como cubierto

**Evidencia enviada**, que es la decisión del owner: *"todo es evidencia enviada"*. Concretamente,
una `Evidence` en cualquier estado desde `SUBMITTED` en adelante —`UNDER_REVIEW`, `SUFFICIENT`,
`VALIDATED`— sobre una `Action` anclada a ese tema.

⚠️ **`EXPECTED` no cuenta**: es una evidencia que se espera, no una que llegó.

⚠️ **E `INSUFFICIENT` sí cuenta.** Es contraintuitivo y es correcto: la barra mide **que trabajaste**,
no que lo hayas hecho bien. Que la evidencia no alcance es una afirmación de suficiencia, y
suficiencia no es cobertura — el mismo corte que separa `preparar ≠ enviar ≠ suficiencia ≠
validación ≠ dominio`. Bajarle la barra a alguien porque su entrega no alcanzó sería usarla como
nota, que es justo lo que la nota al pie niega.


---

<a id="adr-073"></a>

## ADR-073 — La disponibilidad se declara, y el reparto entre materias es una proyección

**Estado:** ✅ `ACCEPTED` · 7 de septiembre de 2026 · **decidido por el Product Owner**
**Relacionado:** [ADR-042](#adr-042), [ADR-052](#adr-052), [ADR-058](#adr-058), [ADR-064](#adr-064),
[ADR-072](#adr-072).
**Toca:** `availability`, `student`, el tramo de alta, `lib/domain/`, `UX01`.

### El pedido

> *"Me gustaría que pueda empezar de cero con los usuarios y se vaya actualizando el engine: que cada
> materia que carga vaya reorganizando las horas a partir de cuántas horas requiere cada materia."*

Es una capa **entre materias**. Todo lo de la Fase B6.15 es **por materia**: cuánto lleva ésta,
cuánto cubriste de ésta. Repartir introduce algo que el producto no tenía: **un presupuesto finito**.

### El agujero, otra vez el mismo

**`availability` no tiene escritor.** La tabla existe desde la Fase B1 con `day_of_week`,
`start_time`, `end_time`, `capacity_min` y `source`. Ninguna ruta la escribe; sólo la siembra
`db-demo.sh`. Y el ADE la lee así:

```sql
SELECT MIN(av.capacity_min) FROM availability av WHERE av.student_id = ce.student_id
```

**El mínimo, nunca la suma.** Sirve para dimensionar *un* bloque y no sabe cuánto tiempo hay por
semana. Para un estudiante real eso es `NULL`, porque no tiene filas.

Es el mismo patrón que [ADR-067](#adr-067) encontró con `assessment`: una tabla completa que nadie
llena.

### Las tres decisiones

**1 · La disponibilidad se declara en el alta**, como un paso más junto a carrera y materias. Entra
como `source = 'declared'`.

La columna ya prevé `observed` e `inferred`: **el Personal Engine la corrige después**, con lo que el
estudiante efectivamente cumplió. Nadie estima bien sus propias horas, y la declarada es el punto de
partida, no la verdad.

**2 · Cuando no alcanza, se muestra el hueco como hecho y sin veredicto.**

> *"Tenés 6 h por semana. De acá al parcial, lo cargado suma 14 h."*

Dos cifras, ninguna conclusión. **Ni «no llegás» ni «apurate».** Cualquiera de las dos es una
predicción, y [ADR-058](#adr-058) las cerró.

⚠️ **Y el sistema no elige qué materia recortar.** Decidir cuál se sacrifica es una decisión de vida;
hoy no hay ni datos ni validación para sostenerla, y proponerla sería exactamente el tipo de
afirmación que el producto se prohíbe.

⚠️ **El copy exacto tiene que pasar por la psicopedagoga antes del piloto.** Mostrar un déficit puede
aplastar aunque sea cierto, y la regla de la casa es *"el sistema debe reconocer patrones, no
etiquetar personas"*. El hecho es correcto; **cómo se dice, no está validado**.

> 📋 **Planteado el 7 de septiembre** en
> [`agenda-psicopedagoga-tiempo-y-carga.md`](agenda-psicopedagoga-tiempo-y-carga.md) §A, con la
> pantalla textual y las tres preguntas que importan: si el número ayuda o aplasta, con qué palabras,
> y **a partir de qué distancia deja de ser accionable** — porque cinco horas contra siete es una
> brecha que alguien cierra, y cinco contra cincuenta y dos no.

**3 · El reparto es una proyección. No crea nada.**

No genera `Commitment`, no agenda y no reemplaza al ADE, que sigue proponiendo **una acción por vez**.
[ADR-064](#adr-064) fijó que el ADE decide *qué* y *cuánto* y el `Commitment` decide *cuándo*; un
presupuesto entre materias es un tercer objeto y **no se mete en esa frontera**.

### La consecuencia que no estaba en la pregunta, y se decide acá

⚠️ **No declarar la disponibilidad NO bloquea el alta.**

El precedente es explícito. [ADR-042](#adr-042) §2, sobre WhatsApp: *"el estudiante puede rechazar u
omitir sin perder el acceso"*, y `siguientePaso()` lo comenta: *"un alta que se trabara en `DECLINED`
sería exactamente lo que esa regla prohíbe"*.

Trabar las nueve superficies hasta que alguien diga cuántas horas tiene sería peor: es la pregunta más
difícil de contestar del alta, y la que más gente contestaría mal con tal de pasar.

**Se pregunta, se puede saltear, y saltear cuenta como contestado.** La consecuencia es que el reparto
no corre, y eso se muestra como todos los demás estados degradados de esta fase: con su motivo y con
la CTA que lo arregla.

⚠️ **Hace falta distinguir «no contestó» de «no tiene bloques».** Cero filas en `availability` hoy
significa las dos cosas a la vez. Por eso `student.availability_declared_at`: **cuándo contestó la
pregunta, haya declarado bloques o no.** Sin esa columna, el alta le volvería a preguntar para siempre
al que ya dijo que no sabe.

### Lo que esto no decide

- **Cómo se calibra desde lo observado.** `source = 'observed'` es Personal Engine y necesita historia
  que no existe.
- **El copy del déficit.** Ver arriba: el hecho está decidido, la formulación no.


---

<a id="adr-074"></a>

## ADR-074 — El Personal Engine calibra **el trabajo**, no la vida del estudiante

**Estado:** ✅ `ACCEPTED` · 7 de septiembre de 2026 · **decisión técnica del equipo, con una
corrección de diseño que hay que dejar escrita**
**Relacionado:** [ADR-058](#adr-058), [ADR-068](#adr-068), [ADR-070](#adr-070), [ADR-073](#adr-073).
**Toca:** `lib/domain/`, `reflection`, `availability`.

### La corrección, primero

[ADR-073](#adr-073) dejó anotado que `availability.source = 'observed'` era el paso siguiente: *"el
Personal Engine la corrige después, con lo que el estudiante efectivamente cumplió"*.

**Eso estaba mal planteado, y conviene decir por qué en vez de corregirlo en silencio.**

| | Qué significa |
|---|---|
| `availability` | **Cuándo podés estudiar.** Es capacidad. |
| Un `Commitment` cumplido | **Cuándo estudiaste.** Es conducta. |

Derivar lo primero de lo segundo las confunde, y la consecuencia es concreta: **un estudiante con
cinco horas disponibles que tuvo una mala semana y estudió dos no perdió disponibilidad — no la
usó.** Escribirle `observed = 2 h` haría que el sistema le reduzca el presupuesto por haber tenido
una mala semana, y después le reparta menos porque hizo menos. Es un espiral, y lo construiría el
producto.

> **Decisión: `availability.source = 'observed'` NO se escribe desde los cumplimientos.** La columna
> se conserva para una señal que mida capacidad de verdad —bloques declarados que el estudiante
> corrige, un calendario conectado—, y hasta que exista, la disponibilidad es sólo la declarada.

### Lo que sí es honesto calibrar

**Cuánto te lleva a vos el trabajo, comparado con lo estimado.** Eso es una propiedad de la tarea y
de la persona frente a la tarea, no de su vida, y el owner lo había pedido con esas palabras: *"el
personal engine, que sabe **cuánto tardás en estudiar vos**"*.

```
multiplicador = mediana( reflection.actual_minutes ÷ estimación central de la Action )
```

### Las cuatro reglas que lo hacen usable

**1 · Nunca baja de `1.0`.** [ADR-070](#adr-070) fijó que el `1.5` es un **piso**: *"el Personal
Engine puede pedir más tiempo; no puede prometer que vas a necesitar menos"*. Un multiplicador de
`0.7` le diría a alguien que estudie menos de lo que la cátedra supone, y eso no es calibrar: es una
promesa que el sistema no puede sostener.

**2 · Mediana, no promedio.** Una sesión de tres horas que se fue de cauce no puede mover la
estimación de todas las demás.

**3 · Con menos de cinco observaciones, `1.0`.** Con dos, la mediana es ruido con forma de dato.
Debajo del piso el motivo viaja como `SIN_HISTORIA` y **no se calibra nada**: es el mismo *sin datos
no es cero* de siempre.

**4 · Tiene techo, y el techo tiene significado.** Se corta en `2.0`. Que a alguien le lleve más del
doble de lo estimado, sistemáticamente, **no es un caso de calibración**: es que algo más está
pasando —el material no alcanza, la estimación está mal, hay una dificultad que nadie miró— y eso lo
tiene que ver una persona, no un coeficiente que sigue creciendo.

### Lo que este ADR prohíbe

> 📋 **Las cuatro reglas están planteadas a la psicopedagoga**, con el costo de cambiar cada una, en
> [`agenda-psicopedagoga-tiempo-y-carga.md`](agenda-psicopedagoga-tiempo-y-carga.md) §B. Hasta que
> conteste son **defaults provisionales del equipo**, igual que los seis valores de
> [ADR-036](#adr-036), y no tocan a ninguna persona real: [ADR-006](#adr-006) sigue cerrado.

⚠️ **El multiplicador no se le muestra al estudiante como un número sobre él.** *"Tardás 1,8× lo
normal"* es exactamente lo que la regla de la casa prohíbe: *"el sistema debe reconocer patrones, **no
etiquetar personas**"*. Lo que se ve es el efecto —más minutos estimados— no el coeficiente.

⚠️ **No se compara entre estudiantes.** No hay percentiles, no hay «más lento que el promedio», y la
función no recibe nada de otro estudiante.

⚠️ **No entra al Hero ni al riesgo.** Un multiplicador alto no es una señal de riesgo:
[ADR-055](#adr-055) dejó las reglas del Risk Engine en modo humano hasta el piloto, e inventar acá
una cuarta sería saltear ese circuito.

### Lo que no decide

- **Qué método te sirve más.** La otra mitad del Personal Engine que pidió el owner necesita
  `reflection.difficulty` y `result`, y una semántica que la psicopedagoga todavía no fijó.
- **Si el multiplicador debe ser por materia.** Hoy es del estudiante. Que a alguien le cueste
  Análisis y no Historia es probable, pero partirlo por materia multiplica la muestra necesaria por
  el número de materias, y hoy no hay ni la primera.


---

<a id="adr-075"></a>

## ADR-075 — Las respuestas de la psicopedagoga sobre tiempo y carga

**Estado:** ✅ `ACCEPTED` · 7 de septiembre de 2026 · **respondido por la psicopedagoga** —
[fuente literal](respuesta-psicopedagoga-tiempo-y-carga-source.md), que **manda sobre esta paráfrasis**.
**Responde:** [`agenda-psicopedagoga-tiempo-y-carga.md`](agenda-psicopedagoga-tiempo-y-carga.md).
**Relacionado:** [ADR-036](#adr-036), [ADR-055](#adr-055), [ADR-058](#adr-058), [ADR-070](#adr-070),
[ADR-072](#adr-072), [ADR-073](#adr-073), [ADR-074](#adr-074).

### Lo primero que dijo

> *"La pantalla, tal como está escrita, **no debería aprobarse todavía**."*

El motivo: mostraba *"5 h por semana · 52,5 h es lo que piden tus materias"* **sin decir que la segunda
cifra también era semanal**. Su lectura fue que podía estar comparando una tasa semanal con un total
acumulado.

⚠️ **La aritmética ya estaba sobre el mismo horizonte.** `demandaSemanal()` divide los minutos
pendientes por las semanas que quedan, así que las dos cifras eran tasas semanales.

**Y eso no salva la pantalla: la confirma.** Si la persona que tiene autoridad profesional sobre el
mensaje leyó una comparación inválida, un estudiante también. **El defecto no era del cálculo, era del
copy**, y una cifra sin su unidad al lado de otra que sí la tiene es exactamente el tipo de dato que
*"puede ser verdadero y aun así engañoso"*.

### El criterio general que fija, y aplica a todo lo demás

> *"La información puede mostrarse, pero debe cumplir cuatro condiciones: ser **comparable**, estar
> **contextualizada**, permitir una **acción concreta** y referirse al **proceso o a la tarea**, no a una
> característica de la persona."*

Y una advertencia sobre todos los números que siguen:

> *"Son **umbrales operativos provisionales para el MVP**, no puntos de corte clínicos ni constantes
> respaldadas universalmente por la psicopedagogía."*

Se rotulan igual que los seis valores de [ADR-036](#adr-036), y se versionan.

---

### A · El déficit

| | Decisión |
|---|---|
| **A1** | Se muestra la brecha, **nunca como un dato suelto** y sólo con las dos cifras sobre el mismo período. Prohibido *"no vas a llegar"*, *"deberías poder"* y *"estás atrasado"* |
| **A2** | Copy nuevo. **«Las materias no piden»** — esa personificación suena a exigencia. Se dice *"trabajo pendiente estimado"* |
| **A3** | Tres tramos por `requerido / disponible`: `≤1` entra · `1–2` las dos cifras en primer plano · `>2` **el mensaje cualitativo primero y el número como detalle secundario** |
| **A4** | Tres acciones, y las tres conservan la agencia: *Revisar mis horas* · *Elegir qué priorizar* · *Pedir ayuda* |

⚠️ **La excepción que hay que respetar:** *"Si falta fecha de evaluación, disponibilidad o alcance
evaluado, **no mostrar una comparación cerrada**. Mostrar «faltan datos para estimar» y pedir el dato
ausente."*

⚠️ **Y lo que no se ofrece nunca**, textual: *"«sumá X horas», «dejá esta materia» ni una agenda
intensiva que ignore sueño, trabajo, traslados, cuidados u otras obligaciones."*

> **El horizonte que se eligió, y en qué difiere de su ejemplo.** Ella escribió el mensaje sobre el
> horizonte *"hasta el parcial del 15 de septiembre"*, y admitió las dos opciones: *"Si el cálculo se
> refiere a una semana, ambas cifras deben decir «esta semana»."*
>
> **Se eligió la semanal**, porque con varias materias y varias fechas **no existe un único «hasta la
> evaluación»**: cada una tiene la suya, y sumar sobre horizontes distintos reintroduce el defecto que
> este ADR corrige. Queda anotado para confirmarle.

---

### B · El multiplicador personal

| | Decisión |
|---|---|
| **B1** | El piso `1,0` **se mantiene**. *"Completar antes una actividad no demuestra por sí solo que todas las futuras requerirán menos tiempo."* Y agrega qué sí se puede decir: *"Completaste esta actividad dentro del tiempo estimado"* |
| **B2** | El techo `2,0` se mantiene, y **superarlo produce una señal de «revisión de calibración», no una etiqueta de riesgo personal** |
| **B3** | Cinco observaciones habilitan **calibración provisional**; con menos de diez **no se describe como patrón estable**. Y exige comparabilidad: al menos **3 días distintos** y el mismo tipo general de actividad |
| **B4** | **Sí se le informa la calibración**, con lenguaje sobre registros. Y **tiene que poder ver qué actividades la produjeron, corregir un tiempo y desactivar el ajuste** |

⚠️ **La regla de B2 es más estricta que un umbral simple.** No alcanza con superar `2,0` una vez:
*"`≥2` en **3 de las últimas 5 actividades comparables y válidas**, realizadas en al menos dos días"*, y
antes de alertar hay que *"verificar rango estimado, pausas/interrupciones y estado de finalización"*.

⚠️ **Y la frase que define a quién convoca esa señal:**

> *"**Psicopedagogía no debe ser el primer destino automático de un error de tiempo.**"*

Primero el owner académico de la estimación —puede estar mal el contenido, no la persona—, después un
referente humano, y evaluación psicopedagógica **sólo si convergen otras señales**.

⚠️ **Prohibido:** *"sos más lento"*, *"te cuesta el doble"*, *"tu ritmo es bajo"* y equivalentes.

> 📋 **La señal de §B2 se detecta y no tiene a dónde ir.** `risk_signal.student_id` es `NOT NULL` —el
> sujeto de una señal de riesgo es siempre el estudiante— y ella pidió que el primer destino sea el
> **owner académico de la estimación**. Ese rol **no tiene superficie**, y es el cuarto ADR que
> tropieza con lo mismo. El planteo está en
> [`agenda-po-superficie-academica.md`](agenda-po-superficie-academica.md).

---

### C · La barra — **la aclaración no alcanza**

> *"Un porcentaje grande junto a una barra suele adquirir significado evaluativo aunque el texto
> inferior lo niegue."*

Y encontró algo que el equipo había justificado como una virtud: *"«1 de 9 temas» y «26% de las horas»
usan **denominadores diferentes** y pueden parecer dos medidas contradictorias."*

**Se separan en tres medidas, y el rótulo cambia.** No se llama *progreso*, ni `dominio`, `nivel`,
`rendimiento` o `avance de aprendizaje`: se llama **`actividad registrada`**. Sin colores de
calificación.

⚠️ **Y C2 corrige la pregunta, no sólo la contesta:** *"La pregunta actual fuerza una elección falsa
porque **mezcla dos constructos**: actividad y calidad del resultado."*

Una entrega insuficiente cuenta como **trabajo intentado**, y **no** como contenido cubierto. Tres
estados, no dos: `sin evidencia` · `evidencia enviada / requiere revisión` · `criterio alcanzado`.

> **La condición de revisión que hay que leer entera:** *"Si la interpreta como nota, probabilidad de
> aprobación o porcentaje aprendido, la solución **no es agregar más letra pequeña**: hay que cambiar la
> representación."*

---

### D · El `1,5` es un fallback, no una constante

> *"No encontré respaldo para afirmar que 1,5 horas de estudio autónomo por cada hora de clase sea una
> constante psicopedagógica universal."*

Y trajo la normativa: la [Resolución 2598/2023](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-2598-2023-393382/actualizacion)
define el Crédito de Referencia del Estudiante en 25–30 horas por crédito, **y no prescribe una relación
fija de 1,5 a 1**.

**El `1,5` pasa a ser el último de cuatro escalones**, no el primero:

```
carga institucional o de cátedra  →  estimación por actividad concreta
   →  mediana histórica de actividades comparables  →  fallback 1,5
```

⚠️ **Y siempre se guarda la fuente y la versión de la estimación** — que es lo que
[ADR-068](#adr-068) ya hace con `declared_total_source`.

---

### E · El método: **no se puede afirmar todavía**

> *"No permiten concluir qué método de estudio funciona mejor, porque hoy no se registra de manera
> estructurada **qué estrategia se usó**, no hay comparación entre estrategias y el resultado inmediato
> no demuestra retención o transferencia."*

Confirma que el salto que el equipo no dio era el correcto, y aporta el fundamento: asignar un *"estilo
de aprendizaje"* y adaptar la enseñanza a esa etiqueta **no tiene base de evidencia**
([Pashler et al., 2008](https://journals.sagepub.com/doi/abs/10.1111/j.1539-6053.2009.01038.x)).

**Lista ocho datos que faltan** —estrategia usada, tipo y objetivo de la tarea, criterio explícito de
resultado, **desempeño diferido a 24–72 h**, interrupciones, tipo y cantidad de ayuda, confianza antes y
después, comparaciones repetidas— y una regla de cinco puntos para el Personal Engine, cuyo núcleo es:

> *"Presentar cada personalización temprana como un **experimento**"*, y *"no decir «este es tu método»
> ni inferir causalidad"*.

**Queda fuera del MVP.** No es una postergación por costo: es que los datos para sostenerlo no existen.

---

### Las siete condiciones antes de cualquier estudiante real

Se adoptan como **gate**, junto al de [ADR-006](#adr-006):

1. Prueba de comprensión del mensaje de déficit y de la barra.
2. Prueba emocional breve y **no clínica**.
3. Verificación de que **todas** las comparaciones usan el mismo período.
4. Trazabilidad y corrección de los tiempos que alimentan el multiplicador.
5. Diferenciación visual inequívoca entre actividad realizada y criterio alcanzado.
6. Registro de fuente y versión de toda estimación.
7. Circuito humano definido como **apoyo académico**, sin convertir automáticamente una anomalía de
   datos en sospecha diagnóstica.

Y su propio límite, que se transcribe porque acota el alcance de todo lo anterior:

> *"Esta respuesta orienta decisiones de producto. **No constituye una evaluación de estudiantes ni
> habilita inferencias diagnósticas individuales.**"*


---

<a id="adr-076"></a>

## ADR-076 — Tres perfiles operativos, y la superficie académica **no autorizada todavía**

**Estado:** ✅ `ACCEPTED` · 8 de septiembre de 2026 · **decidido por el Product Owner**
**Responde:** [`agenda-po-superficie-academica.md`](agenda-po-superficie-academica.md).
**Relacionado:** [ADR-003](#adr-003), [ADR-006](#adr-006), [ADR-039](#adr-039), [ADR-057](#adr-057),
[ADR-067](#adr-067), [ADR-069](#adr-069), [ADR-071](#adr-071), [ADR-075](#adr-075).
**Bloquea:** cualquier construcción de la superficie académica hasta nueva autorización.

### La corrección al planteo, primero

El documento del equipo afirmaba que *"el backend ya existe: son las nueve rutas. Lo que falta es la
pantalla"*. **El owner lo rechazó, y tenía razón:**

> *"No aceptaría la frase «el backend ya existe; falta la pantalla». Las nueve rutas mencionadas no
> equivalen al backend de esa superficie. Para una cola académica todavía pueden faltar consultas
> agrupadas por comisión, detección de duplicados, reglas de fusión, permisos, auditoría y estados de
> procedencia."*

El informe de §6 confirmó las seis faltas y encontró una séptima
([`informe-superficie-academica.md`](informe-superficie-academica.md)):
**de las nueve rutas humanas, exactamente una opera sobre contenido.** Las otras ocho son sobre un
estudiante concreto y están bloqueadas por [ADR-006](#adr-006).

### 1 · Roles y personas

**Cinco responsabilidades del dominio, agrupadas en tres perfiles operativos.**

| Perfil MVP | Responsabilidades |
|---|---|
| **Curador académico interno de Achieve** | Owner académico de la estimación **+** corroboración de procedencia |
| **Coach/operador del CRM** | Operador **+** referente humano del caso |
| **Psicopedagogía** | Intervención especializada, **siempre separada** |

El flujo, textual:

> *"1. Se revisa primero si el contenido, la estimación o la información académica están mal.
> 2. Si el problema persiste, interviene el coach sobre el caso del estudiante.
> 3. Psicopedagogía entra solamente cuando convergen las señales definidas."*

⚠️ **Se modelan capacidades y permisos, no personas.**

> *"Una misma persona podrá ocupar responsabilidades compatibles, pero toda acción deberá conservar
> actor, rol y trazabilidad. Se mantiene la regla de que **nadie valida su propia evidencia o
> propuesta**."*

### 2 · El owner académico, durante el MVP, es interno

**Una persona de Achieve responsable de la curación académica. No la cátedra ni la universidad.**

El acceso institucional para docentes queda fuera de este corte y se resuelve dentro de
[ADR-039](#adr-039) y del modelo comercial institucional.

### 3 · Alcance de la futura superficie: **contenido, nunca casos**

Cinco operaciones, y una frontera:

1. Aprobar o descartar prerequisitos propuestos.
2. Confirmar o descartar filas que parezcan evaluaciones.
3. Detectar y resolver evaluaciones duplicadas de una misma comisión.
4. Revisar cargas de estudio declaradas.
5. Recibir señales de calibración **sólo cuando puedan presentarse sin identificar a un estudiante**.

> ⚠️ *"Si una señal requiere mostrar el recorrido de una persona concreta, **no pertenece a esta
> superficie** y queda bloqueada por ADR-006."*

Eso resuelve el hueco que [ADR-075 §B2](#adr-075) dejó abierto: la señal de calibración entra **si y
sólo si** se puede mostrar despersonalizada.

### 4 · Procedencia: tres niveles, y `official` no se alcanza curando

> *"La revisión interna de Achieve **no convierte automáticamente un dato en `official`**."*

| Nivel | Quién lo produce |
|---|---|
| Declarado por estudiantes | El estudiante ([ADR-067](#adr-067), [ADR-071](#adr-071)) |
| **Corroborado o curado por Achieve** | El curador académico interno |
| Oficial | Una institución o cátedra autorizada |

✅ **Esto ya está enforced en la base, y desde antes de la pregunta.**
`corroborar_procedencia()` rechaza `official` con su motivo:

```
nadie puede declarar official: hace falta autenticar a la institución (C01-030, OPEN)
```

El vocabulario `unverified | corroborated | official | disputed` **ya expresa los tres niveles**. La
decisión del owner no agrega una columna: **confirma la que hay y prohíbe el atajo.**

### 5 · No entra al registro canónico

> *"La superficie académica no forma parte del recorrido canónico del estudiante, de sus nueve
> superficies ni de sus veinte CTAs. Será una herramienta interna separada y no estará alcanzada por
> los guards de navegación del estudiante."*

Mismo criterio que [ADR-052](#adr-052) aplicó al tramo de alta.

### 6 · ⛔ La implementación **no está autorizada**

> *"Estas decisiones quedan aprobadas como definición de producto y arquitectura. **No autorizo
> todavía construir la superficie completa.**"*

Primero, un **informe técnico de solo lectura** con seis preguntas, y una propuesta de **primer corte
vertical pequeño, verificable y sin datos personales**.

⚠️ **Y una prohibición explícita, que rige hasta nueva autorización:**

> *"**No implementar, migrar, hacer push, merge ni deploy hasta nueva autorización.**"*

El informe está en [`informe-superficie-academica.md`](informe-superficie-academica.md).

### Por qué esta decisión es mejor que la que proponía el equipo

El planteo pedía decidir **cinco roles** y sugería construir **una superficie**. La respuesta separa
las dos cosas: **cinco responsabilidades siguen existiendo en el dominio** —no se pierden— pero se
agrupan en **tres perfiles** para el MVP, y la construcción queda condicionada a un informe.

⚠️ **Y evita un error que el equipo tenía a la vista y no vio:** agrupar en perfiles **no es lo mismo
que fusionar responsabilidades**. Modelar capacidades en vez de personas es lo que permite que una
sola persona haga dos cosas hoy **sin perder de quién fue cada acción** — y es lo que hace posible
sostener *"nadie valida su propia evidencia o propuesta"* cuando el curador y el coach son la misma
persona.


---

<a id="adr-077"></a>

## ADR-077 — El área «Materias» se construye: lista primero, materia después

**Estado:** ✅ `ACCEPTED` · 8 de septiembre de 2026 · **decidido por el Product Owner**
**Fecha de apertura:** 5 de septiembre de 2026 · **la dejó abierta [ADR-054](#adr-054), a propósito**
**Relacionado:** [ADR-054](#adr-054), [ADR-058](#adr-058), [ADR-066](#adr-066), [ADR-072](#adr-072),
[ADR-073](#adr-073).
**Toca:** `lib/navigation/surfaces.ts`, `lib/navigation/menu.ts`, `lib/navigation/cta-registry.ts`,
`lib/server/servicios/proyeccion-materias.ts`, `app/(student)/materias/`, `app/api/materias/`,
`insumos_de_reparto()`.

### Esta decisión no es nueva: estaba reservada

[ADR-054](#adr-054) cerró **sólo la opción `B`** —`CTA-001` transporta la cursada— y delimitó el
resto con firmeza:

> *"Esto no autoriza construir todavía una nueva superficie de listado «Materias» ni cambiar el
> nombre del ítem del menú. Las opciones `A` y `C` quedan como una decisión de diseño separada."*

Y dijo **cómo** se tomaría:

> *"…son una decisión de diseño propia, que se toma **con las capturas delante**."*

El 8 de septiembre el owner puso las capturas delante y eligió:

> *"esta pantalla de materias no me gusta, prefiero más el estilo de la segunda, la de color, primero
> una pantalla con todas las materias y luego podés entrar a cada una"*

**Eso cierra `A` y `C` juntas**, y en el orden correcto: el ítem del menú deja de llamarse plural
sobre una superficie de una sola porque **ahora hay una de todas**, no porque se lo haya renombrado.

### Por qué esto no inventa una décima superficie

Lo dejó dicho el propio [ADR-054](#adr-054), leyendo el spec:

> ⚠️ *"Eso mueve la opción `C`: una superficie de lista **no sería inventar una décima**, sería
> construir un área que la arquitectura de información ya nombra."*

Parte II §10 declara dos áreas distintas y el producto las había colapsado en una:

| Área | Responsabilidad, textual | Estado |
|---|---|---|
| **Materias** | *"Espacios persistentes de cursado y evaluaciones."* | **Nunca se construyó** |
| **Materia > Cursado** | *"Ritmo, unidades, progreso, recursos, acciones y Bitácora."* | `UX02` |

**`UX02` no cambia de identidad.** Sigue siendo el cursado de **una** materia, y el Gantt que le puso
[ADR-066](#adr-066) sigue viviendo ahí. Lo que se agrega es la puerta.

⚠️ **Y se agrega como nodo sin wireframe, no como superficie.** `surfaces.ts` ya tiene el patrón:
`UX04_RENEGOCIACION` y `UX04_RESCATE` son nodos con nombre y sin `wireframe`, y `superficieIds` los
filtra. El índice entra igual —`wireframe: null`, `ruta: "/materias"`— así que **la afirmación *"no
existe `UX10`"* del spec sigue siendo literalmente cierta** y los tests que la guardan siguen pasando
sin tocarse.

### El alcance: la lista, y sólo la lista

El mockup trae dos vistas con un selector —**Lista** y **Gantt del período**—. Se aprueba **una**:

| Vista | Decisión |
|---|---|
| **Lista** | ✅ Se construye ahora |
| **Gantt del período** | ⏸️ Diferido acá · ✅ **construido el mismo día por [ADR-078](#adr-078)** |

> ⚠️ **El argumento que sigue resultó ser falso, y [ADR-078](#adr-078) lo corrige.** Se conserva
> tachado en vez de borrado: la pregunta era correcta —*¿qué manda si dos superficies dicen cosas
> distintas?*— y lo que estaba mal era el supuesto. **El relleno del Gantt es cobertura, no
> asignación de horas**, y lo decía la leyenda del propio mockup que el equipo tenía delante.

~~**Por qué el Gantt cruzado no entra en este corte, y no es por tamaño.**~~ Dibujar varias materias
sobre un eje común es *decir cómo se reparte el período entre ellas* — que es exactamente lo que
[ADR-073](#adr-073) ya proyecta en `UX01` con el reparto. **Dos superficies afirmando el reparto con
reglas distintas es una contradicción esperando el momento**, y cuál manda es una decisión que nadie
tomó todavía. El Gantt del período se decide cuando esa pregunta tenga respuesta.

ℹ️ **El Gantt por materia no está afectado.** Es otro objeto: [ADR-066](#adr-066), dentro de `UX02`,
sobre las unidades de una cursada. Ése ya existe y se queda donde está.

### La cola de materias de `HOY` se queda

[ADR-054](#adr-054) había señalado que la lista completa vivía *"sólo en `HOY`, debajo del fold y de a
una"*. Con el índice construido, la tentación es sacarla. **No se saca:**

| Superficie | La pregunta que contesta |
|---|---|
| `UX01` · la cola | ¿Qué necesito hacer **ahora**? |
| El índice | ¿Cómo está **repartida** mi carga? |

Son preguntas distintas y el paginado *«1 de 9»* es lo que `DD7` arbitró en `design-system.md` §1.4.
Tocarlo sería reabrir `DD7` de refilón, sin decirlo.

### Qué muestra cada fila

| Elemento | Fuente | Ausencia |
|---|---|---|
| Nombre | `course_enrollment` | — |
| Próxima evaluación · tipo · fecha | `assessment` con fecha futura, la más cercana | *"Sin evaluación cargada"* |
| Días que faltan | `diasHastaEvaluacion` | `—` |
| Barra de cobertura | `coberturaDeMateria()` | **No se dibuja** ([ADR-072](#adr-072) §4) |
| Última actividad | `topic_progress` | *"Sin avance registrado"*, **nunca cero** |

**El orden es por próxima evaluación, con las sin fecha al fondo.** Es lo que hace el mockup y es lo
que [ADR-072](#adr-072) exige: *"ordenar por cobertura es un ranking de qué tan mal vas"*.

### ⚠️ Una palabra del mockup que NO se adopta

Las capturas rotulan la barra así:

> ~~`26% · 1/9 dominados`~~

**`dominados` es la primera prohibición de [ADR-072](#adr-072)**: *"no leer
`topic_progress.domain_value`. El dominio requiere evaluación; la cobertura sólo requiere que el
estudiante haya producido algo. Mezclarlos convierte la barra en una nota."* Es también el corte que
sostiene toda la cadena `preparar ≠ enviar ≠ suficiencia ≠ validación ≠ dominio`.

**Y el copy que se adopta tampoco es el de [ADR-072](#adr-072).** Ése fue revisado por la
psicopedagoga en [ADR-075](#adr-075) §C1 —*"un porcentaje grande junto a una barra suele adquirir
significado evaluativo aunque el texto inferior lo niegue"*, y *"«1 de 9 temas» y «26% de las horas»
usan denominadores diferentes y pueden parecer dos medidas contradictorias"*—. El vigente es el que
`UX02` ya dibuja, y el índice **no escribe uno propio: importa el mismo**:

> **1 de 9 temas tiene alguna evidencia · 26% del tiempo estimado tiene evidencia asociada**
>
> *Esto muestra trabajo registrado. No mide comprensión, no es una nota y no predice el resultado.*

⚠️ **Se comparte la función, no el texto.** `textoDeCobertura()` se extrae de
`proyeccion-materia.ts` y la usan las dos superficies. Copiar el string habría dejado dos copias de
un copy que ya cambió una vez por revisión clínica, y que va a cambiar otra vez.

ℹ️ **Es un cambio de una palabra respecto del mockup, no de diseño.** El resto del mockup —los colores por materia, el
orden, la barra, el estado *"sin temas cargados"* sin barra— cumple [ADR-072](#adr-072) tal como está
dibujado, incluido el caso difícil: una materia sin datos **no se dibuja igual** que una sin trabajo.

### El registro canónico de CTAs no cambia de tamaño

**Sigue en veinte.** Lo único que cambia es de dónde puede salir `CTA-001`:

```diff
- origen: ["UX01"]
+ origen: ["UX01", "UX02_INDICE"]
```

Es lo que ya hace la cola de `HOY`, desde otro lugar. Y `CTA-001` ya transporta la cursada desde
[ADR-054](#adr-054) opción `B`, así que **abrir la quinta fila abre la quinta materia** sin trabajo
adicional: el defecto que ese ADR corrigió no se reintroduce.

**La etiqueta del botón varía con el estado de la fila** —*Abrir*, *Completar*, *Agregar examen*— y
eso es **copy, no contrato**: las tres hacen lo mismo, navegar a esa materia, y ninguna promete algo
que el click no cumpla. Declarar tres CTAs para una navegación sería inflar el registro.

### ⛔ Lo que queda afuera de este corte, y por qué

**El botón `+ Agregar materia o evaluación` del pie no se construye.** Es el único elemento del
mockup **sin destino definido**: son dos flujos distintos —dar de alta una materia es el alta
([ADR-052](#adr-052), que es de una sola vez y no tiene reingreso especificado), y dar de alta una
evaluación es `CTA-020`, que vive **dentro** de una cursada—. Ponerlo sin resolver eso sería un botón
que no sabe adónde va.



---

<a id="adr-078"></a>

## ADR-078 — El Gantt del período es una ventana, no un presupuesto

**Estado:** ✅ `ACCEPTED` · 8 de septiembre de 2026 · **decidido por el Product Owner**
**Fecha de apertura:** 8 de septiembre de 2026 · **la abrió [ADR-077](#adr-077), el mismo día**
**Relacionado:** [ADR-072](#adr-072), [ADR-073](#adr-073), [ADR-075](#adr-075), [ADR-077](#adr-077).
**Toca:** `lib/domain/ventana.ts`, `insumos_de_reparto()`, `proyeccion-materias.ts`,
`components/screens/indice-de-materias.tsx`.

### ⚠️ Corrige a ADR-077, y la corrección es el motivo de este ADR

[ADR-077](#adr-077) difirió el «Gantt del período» con este argumento:

> ~~*"Dibujar varias materias sobre un eje común es decir cómo se reparte el período entre ellas —
> que es exactamente lo que [ADR-073](#adr-073) ya proyecta en `UX01` con el reparto. Dos superficies
> afirmando el reparto con reglas distintas es una contradicción esperando el momento."*~~

**Era falso, y lo desmiente la propia leyenda del mockup**, que el equipo tenía delante y no leyó:

> *ventana de preparación · ◆ fecha de examen · línea negra = hoy · **relleno = cobertura de temas***

**El relleno es cobertura, no asignación.** Son dos objetos que no se tocan:

| | Qué afirma | Unidad | Quién lo produce |
|---|---|---|---|
| **Reparto** (`UX01`) | *"Esta semana te tocan 4,5 h de Cálculo"* | horas por semana | `reparto.ts`, sobre la disponibilidad declarada |
| **Ventana** (el Gantt) | *"Tenés desde el 4 de agosto hasta el 15 de septiembre, y cubriste el 22%"* | días de calendario | `ventana.ts` + `cobertura.ts` |

El primero reparte un presupuesto que puede no alcanzar; el segundo describe **cuánto tiempo hay y
cuánto está cubierto**. Ninguno de los dos puede contradecir al otro porque **no afirman la misma
magnitud**. El Gantt no lee la disponibilidad, no lee el multiplicador personal y no asigna horas.

⚠️ **Que la objeción fuera falsa no la vuelve inútil.** Era la pregunta correcta —*¿qué manda si dos
superficies dicen cosas distintas?*— hecha sobre un supuesto equivocado. La respuesta —*no dicen
cosas distintas*— es lo que este ADR deja registrado, para que nadie la vuelva a hacer.

### La decisión

**Se construye la vista «Gantt del período» como segunda vista del índice**, con un selector
`Lista` / `Gantt del período`. Misma superficie —`UX02_INDICE`, sin wireframe, sin CTA nueva—, mismos
datos, otra forma de mirarlos.

### La ventana: dos hechos, y nada entre medio

```
ventana = [ primera clase dictada , fecha de la evaluación ]
```

**Las dos puntas son hechos persistidos**, y ninguna se infiere:

| Falta | Qué pasa | Por qué |
|---|---|---|
| **La fecha de evaluación** | ⛔ **No hay ventana.** Barra punteada: *"sin ventana de preparación"* | Sin fin no hay plazo. Dibujar hasta el borde del eje inventaría una fecha |
| **La primera clase** | La barra empieza en el borde del eje, **y se dice** | Hay plazo pero no se sabe desde cuándo se viene preparando |
| **Las dos** | ⛔ No hay ventana | — |

⚠️ **Se descartó empezar todas las barras en el borde izquierdo del eje**, que es como se ven en el
mockup. Es cómodo de dibujar y **no afirma nada**: una materia que empezó en marzo y una que empezó
la semana pasada tendrían la misma ventana. La primera clase es un hecho y distingue.

**El eje se adapta a los datos.** Va de `hoy − 2 semanas` a `max(última evaluación, hoy + 3 semanas)`.
El mínimo conserva la forma del mockup; el máximo existe para que **una evaluación nunca quede fuera
de cuadro** — un examen que no se ve es peor que un eje largo.

### El relleno es la misma cobertura, y sale de la misma función

**No se recalcula.** `coberturaDeMateria()` y `textoDeCobertura()` son las que ya usan `UX02` y la
Lista ([ADR-077](#adr-077)). Rigen las cuatro prohibiciones de [ADR-072](#adr-072) sin excepción, y
la cuarta se ve especialmente acá: **una materia sin minutos conocidos no dibuja relleno**, dice
*"sin temas cargados"* dentro de su barra. Una barra vacía por falta de datos y una por falta de
trabajo **no se ven igual**, y en un Gantt esa confusión es más fácil de cometer que en una lista.

### ⛔ Dos cosas del mockup que NO se construyen

**1 · `Cursás Lun 14:00-16:00 · Jue 20:00-22:00`.** El bloque horario de cursada está **decidido y no
implementado**: [ADR-062](#adr-062) lo definió con dos dueños posibles y excluyentes, y **la entidad
no existe todavía en el schema**. `class_session.session_time` guarda la hora de **una clase
dictada**, que es otra cosa: un hecho puntual, no un horario semanal. Derivar el horario de las horas
observadas sería inferir la regla desde sus instancias — *omitir, no inventar*.

**2 · `frenada hace 7 días`.** Se muestra el hecho —*"última actividad hace 7 días"*— y no el
juicio. **«Frenada» es una etiqueta**, y la regla de [ADR-075](#adr-075) es literal: *"el sistema
debe reconocer patrones, no etiquetar personas"*. Que la etiqueta caiga sobre la materia y no sobre
el estudiante no cambia quién la lee: la lee él, sobre su propia materia.

⚠️ **Y no es sólo tono: es que el hecho no la sostiene.** Siete días sin actividad registrada en una
materia que se cursa una vez por semana **es lo normal**. Llamarla «frenada» convierte una cadencia
en un problema.



---

<a id="adr-079"></a>

## ADR-079 — El andamio para probar el MVP: por dónde entra el contenido y quién dispara el loop

**Estado:** ✅ `ACCEPTED` · 8 de septiembre de 2026 · **decidido por el Product Owner**
**Fecha de apertura:** 8 de septiembre de 2026 · **la abrió el recorrido del golden path a mano**
**Relacionado:** [ADR-006](#adr-006), [ADR-039](#adr-039), [ADR-052](#adr-052), [ADR-076](#adr-076).
**Toca:** `scripts/sembrar-materia.mjs`, `app/api/prueba/loop/`, `components/prueba/panel.tsx`.

### El hallazgo: el loop funciona, y no se puede empezar

**El golden path se recorrió entero contra Postgres** el 8 de septiembre: ADE → `Commitment` →
`Evidence` (firma, subida, registro) → validación → progreso → siguiente acción. Cerró y volvió a
abrir, y todo lo derivado se movió con él:

| | antes | después |
|---|---|---|
| Cobertura de la materia | 22% | **61%** |
| Reparto | 95,5 h | **43 h** |
| `HOY` | *Derivadas* | *Límites y continuidad* |

⚠️ **Pero un estudiante que completa el alta desde cero no puede empezarlo.** Verificado
recorriendo los cuatro pasos del alta con el estudiante nuevo:

```
alta/materias  → {"cursadas":1, "declaraciones":1, "recomendadas":0}
HOY            → FALTA CONTEXTO DE CURSADO
reparto        → SIN_DATOS
la materia     → sin temas cargados — no puedo estimar · SIN VENTANA
```

**El producto está diciendo la verdad.** Lo que falta es por dónde entra el contenido: el único
escritor académico es `ingerir_materia`, y **ninguna ruta lo alcanza** — el mundo demo funciona
porque `db-demo.sh` llama al RPC desde bash.

⚠️ **Y hay una segunda mitad, peor.** Aunque el contenido se cargara después, **nada vuelve a
disparar el ADE**: se dispara en el alta (una vez, `alta.ts`) y desde `scripts/validar.mjs`. La ruta
de validación no lo re-dispara. Un estudiante cuyo ADE no encontró nada en el alta **se queda sin
acción para siempre**.

### La decisión: dos andamios declarados, y ninguna superficie

| Hueco | Qué se construye | Qué NO se construye |
|---|---|---|
| El contenido de una materia | `npm run db:materia` | Ninguna pantalla |
| ADE · validación · reloj | Tres botones en el dock de `MODO_PRUEBA` | Ningún scheduler, ningún rol |

**Por qué el contenido es un script y no una pantalla.** [ADR-076](#adr-076) **no autoriza construir
la superficie académica**, y el informe encontró algo peor que la falta de pantalla: **no hay
identidad de actor**, sólo un secreto compartido. Un script no necesita saber quién aprieta el botón
**porque no hay botón**.

### ⚠️ El cerrojo que el dock abre, dicho de frente

**El paso `validar` deja al estudiante validando su propia evidencia**, que es la regla que el
producto más protege. **No es un descuido: es la consecuencia de que `C01-030` —*quién valida*— siga
`OPEN`.** Hasta que se cierre no hay a quién darle ese botón.

Por eso vive detrás de tres cerrojos, los mismos que `/api/prueba/alta`:

1. **`404` sin `MODO_PRUEBA=1`**, no `403`: un `403` confirmaría que la ruta existe.
2. **JWT del estudiante, y sólo sobre sí mismo.** **Sin secreto de servicio a propósito**: un secreto
   podría correr el loop de cualquiera, y este paso escribe progreso.
3. **No reimplementa nada.** Llama a `recomendarPara`, `validarEvidencia` y `correrReloj`, los
   mismos que las rutas reales — un atajo que salteara el servicio probaría el atajo.

### Lo que el andamio encontró, y no se sabía

**`ingerir_materia` sin `p_curriculum_plan_id` crea una cursada nueva.** Resuelve el `course` dentro
del contenedor *«Sin programa declarado»* —otra fila con el mismo código— y la del estudiante **queda
vacía mientras el script dice «listo»**. Lo encontró un chequeo que el script hace después de
ingerir, no una lectura del SQL, y ese chequeo queda.

**`ingerir_materia` no crea recursos, y sin recursos el ADE no recomienda.** Lo dice él mismo:
`CONTEXTO_INCOMPLETO — «Fundamentos» no tiene material configurado`. Es correcto —una acción sin nada
que abrir no es ejecutable— y era la pieza que faltaba para que una materia recién cargada sirviera
de algo.

### ⛔ Lo que sigue sin resolverse, y no lo resuelve este ADR

| Qué | Quién lo cierra |
|---|---|
| **No se puede crear una cuenta.** `/login` no ofrece registro ([ADR-039](#adr-039): el padrón lo decide el CRM) | El contrato con el CRM |
| **Quién valida** | `C01-030`, `OPEN` |
| **El reloj no corre solo.** Sin scheduler, los compromisos nunca vencen y el rescate no se alcanza | Decisión de infraestructura |
| **El ADE no se re-dispara** desde la ruta de validación | Trabajo pendiente, no decisión |
| **El estudiante no puede cargar su programa.** Sería la `B2b.3` | Decisión de producto |

### Cuando ADR-006 abra, esto se borra

**Los dos andamios, enteros.** No son un paso hacia una consola de operación: con personas reales,
cargar el programa de una materia y validar la evidencia de alguien son operaciones con **actor,
procedencia y trazabilidad** — no comandos ni botones.



---

<a id="adr-080"></a>

## ADR-080 — Enriquecimiento académico con IA: **candidato, no decidido**

**Estado:** 🟡 `PROVISIONAL — CANDIDATO` · 8 de septiembre de 2026 · **autorizado a registrarse como
propuesta por el Product Owner**
**Relacionado:** [ADR-006](#adr-006), [ADR-023](#adr-023), [ADR-037](#adr-037),
[ADR-058](#adr-058), [ADR-074](#adr-074), [ADR-075](#adr-075) ·
[matriz de fuentes y autoridad](matriz-de-fuentes-y-autoridad.md).
**Toca:** nada. **No hay implementación asociada.**

> ⛔ **Esto NO es una decisión cerrada, y el estado lo dice.** Faltan tres cosas antes de que pueda
> serlo: **la rúbrica**, **la revisión de la psicopedagoga** y **la prueba sobre una muestra**.
> Ninguna de las tres existe.
>
> ⛔ **No autoriza ejecutar llamadas a OpenAI, procesar el CSV, escribir scripts, backend,
> migraciones ni cambios del ADE.** [ADR-076](#adr-076) §6 sigue vigente.

### El problema que intenta resolver

El catálogo trae **temas y sus relaciones** y no trae **ninguna noción de cuánto cuesta cada uno**.
Hoy el ADE estima con un bloque por defecto de 30–45 minutos, igual para todo, y el reparto usa un
factor de estudio constante ([ADR-070](#adr-070)) cuando la cátedra no declaró horas.

⚠️ **Y la única señal de dificultad que el producto captura no la lee nadie.**
`reflection.difficulty` —`mas_facil | esperado | mas_dificil`— tiene dos escritores y **cero
lectores** (§4.15 de la matriz). O se usa o se deja de pedir.

### La propuesta, punto por punto

**1 · La IA no se consulta durante el uso normal del estudiante.** Ni una llamada en el camino
caliente. Los temas y sus relaciones **cambian poco**, así que la inferencia se hace una vez.

⚠️ **El motivo de fondo no es el costo: es la reproducibilidad.** Una inferencia que cambia entre dos
lecturas de la misma pantalla no se puede auditar, y es exactamente el problema que la matriz señala
en las derivaciones no persistidas.

**2 · No se construye un backend de IA separado para el MVP.** Un proceso offline alcanza.

**3 · El enriquecimiento es un proceso offline sobre una versión identificada del CSV.** La entrada
tiene que ser **inmutable e identificable**: sin eso, la salida no se puede atribuir a nada.

**4 · La salida siempre lleva `source_type = 'inference'`.** Ya está en el vocabulario de
Provenance, y ADR-023 lo previó.

**5 · La inferencia nunca se eleva sola a `corroborated` ni a `official`.** Es `I9`, sin excepción:
*ninguna capa eleva su propio `verification_status`*. Y `official` sigue siendo **inalcanzable por
diseño** hasta que exista autenticación institucional.

**6 · Se registra la trazabilidad completa de cada inferencia:**

| Campo | Por qué |
|---|---|
| Modelo exacto | Dos versiones del mismo modelo no son el mismo clasificador |
| Versión del prompt | Es la regla, y las reglas se versionan (`REGLA_DE_*`) |
| Esquema de salida | Sin él, «lo que devolvió» no es comparable entre corridas |
| Fecha de generación | — |
| **Versión o hash del CSV de entrada** | Es la única forma de saber **sobre qué** se infirió |
| Justificación | Una clasificación sin razón no se puede revisar ni disputar |

**7 · La IA estima propiedades del CONTENIDO, nunca de una persona.** El corte es el de
[ADR-037](#adr-037), y no es negociable:

| Puede estimarlo | No debe afirmarlo |
|---|---|
| Complejidad conceptual del tema | *"A esta persona le va a resultar difícil"* |
| Demanda cognitiva inicial | Dificultad personal del estudiante |
| Esfuerzo inicial para un estudiante promedio | Minutos que **esa** persona necesita |

> **Puede decir:** *"este tema presupone recursividad y razonamiento abstracto"*.
> **No puede decir:** *"a Felipe este tema le va a costar"*.

⚠️ **Lo segundo sale de la evidencia de la persona** —sus entregas, repeticiones, minutos reales y
reflexiones—, que es el Personal Engine. **El sistema reconoce patrones, no etiqueta personas**
([ADR-075](#adr-075)).

**8 · No se incorpora a `costoDeNoActuar` ni modifica la prioridad del ADE.** Hoy esa función tiene
tres términos —entra en la evaluación, nunca practicada, días sin tocar— y un desempate por orden.
Meter una inferencia ahí **cambiaría qué manda a estudiar el sistema**, y eso necesita validación
clínica antes que código.

**9 · Su primer uso candidato es dimensionar, no priorizar.** Estimar minutos iniciales, evitar
juntar varios temas complejos en una misma acción, partir una unidad grande. **Decidir cuánto dura
una acción no es decidir cuál conviene hacer.**

**10 · La experiencia real tiene precedencia sobre la inferencia inicial.**

```
estimación inicial del catálogo  (inferencia)
        ↓
observaciones reales del estudiante  (reflection)
        ↓
estimación personalizada  (Personal Engine)
```

> **Cuando exista evidencia personal suficiente, la calibración del Personal Engine tiene
> precedencia sobre la inferencia inicial. Queda abierto si la estimación del catálogo continúa como
> base ajustada o si se descarta completamente.**

⚠️ **La formulación anterior decía que la experiencia «reemplaza» la estimación, y era prematura.**
Con el diseño actual el multiplicador de [ADR-074](#adr-074) —5 observaciones en ≥3 días distintos—
**calibra una estimación base que sigue existiendo**: es un factor, no un sustituto. Cuál de las dos
formas corresponde **no fue diseñado ni validado**, y cerrarlo acá fijaría una fórmula que nadie
escribió.

**11 · Antes de cualquier incorporación se prueba una muestra de 20–30 temas**, y **la psicopedagoga
evalúa la consistencia**. Si la clasificación no le parece consistente, **no se corre sobre el
catálogo completo**.

**12 · La API key vive en un proceso seguro y nunca en el frontend.** Es la misma regla que ya rige
para `SUPABASE_SERVICE_ROLE_KEY` y `RELOJ_SHARED_SECRET`.

### ⚠️ La dependencia de `topic`, y por qué parte esto en dos

**La anotación colgaría de un `topic_id`, y `topic` no conserva ni origen ni versión ni historia.**
Es la conclusión principal de la [matriz](matriz-de-fuentes-y-autoridad.md) §0: una nueva ingesta
borra las unidades con `DELETE`, y la anotación quedaría apuntando a un id que ya no existe — o
peor, a uno **recreado con otro contenido**.

Eso separa dos cosas que conviene no confundir:

| | Qué se puede hacer | Estado |
|---|---|---|
| **Experimentación** | Sobre un **CSV inmutable**, con una **clave estable por fila** y un **hash del contenido**. **Sin tocar producción**, sin persistir contra `topic_id` | 🟡 **Posible en principio** — sigue necesitando autorización propia |
| **Uso productivo** | Persistir la inferencia y que algún engine la consuma | ⛔ **Bloqueado** hasta resolver la **identidad estable del `topic`** |

⚠️ **No se puede persistir una anotación contra un `topic_id` descartable.** El campo
`catalog_version` que el planteo propone es el reconocimiento implícito del problema, y **hoy no hay
contra qué versionarlo**.

⚠️ **«Identidad estable del `topic`» NO es la identidad de actores de `C01-030`.** Son dos problemas
distintos y no se destraban juntos:

| | Qué pregunta | Estado |
|---|---|---|
| **Identidad estable del `topic`** | ¿Este id sigue nombrando la misma unidad después de una reingesta? | Brecha **1** de la matriz · **C2**. ⚠️ **Nadie externo la bloquea** |
| **Identidad de actor** (`C01-030`) | ¿Quién afirmó esto, y con qué capacidad? | Brecha **2** de la matriz. ⏸️ **`DEFERRED`** hasta [ADR-006](#adr-006) por [ADR-057](#adr-057) |

**Lo que bloquea el uso productivo de este ADR es la primera**, que es del carril A de la matriz y no
depende de ningún dictamen externo.

### ⬜ Lo que queda explícitamente abierto

**Ninguna de estas nueve está decidida por este ADR.** Registrarlas es el punto del documento.

| # | Pregunta abierta | Quién la contesta |
|---|---|---|
| 1 | **Qué rúbrica se utiliza** | Psicopedagoga |
| 2 | **Qué dimensiones se clasifican** — complejidad, demanda, esfuerzo, carga de prerequisitos, o un subconjunto | Psicopedagoga + Product Owner |
| 3 | **Quién revisa la muestra** | Product Owner |
| 4 | **Qué nivel de acuerdo se considera aceptable** — y contra qué se mide | Psicopedagoga |
| 5 | **Cómo se identifican establemente los temas** | Product Owner + CTO. ⚠️ **Depende de la brecha 1 de la matriz — la trazabilidad de `topic`**, no de `C01-030` |
| 6 | **Cómo se versionan y reemplazan las inferencias** — y si la anterior se conserva | Product Owner + CTO |
| 7 | **Cuándo puede el ADE consumirlas** | Product Owner. Ver §11 de la matriz |
| 8 | **Cómo se le muestra al estudiante que es una estimación** | Psicopedagoga. ⚠️ [ADR-058](#adr-058) prohíbe presentarlo como predicción |
| 9 | **Dónde vive el enriquecimiento aprobado** — otro CSV, entidad separada, o dentro del futuro modelo versionado de `topic` | Product Owner + CTO |

⚠️ **La 5 y la 9 son la misma pregunta vista de dos lados**, y las dos dependen de cómo se resuelva
la trazabilidad de `topic` (C2 de la matriz). **No conviene decidirlas antes que esa.**

### Por qué este ADR existe aunque no decida nada

Para que la idea quede **registrada con sus límites puestos** en vez de volver más adelante sin
ellos. Las tres restricciones que importa no perder son:

1. **La IA es `inference`, y no se eleva sola.**
2. **Estima el contenido, nunca a la persona.**
3. **Dimensiona la acción, no elige la prioridad.**

Si alguna de las tres se afloja en una conversación futura, este ADR es el lugar donde consta que se
habían puesto.


---

<a id="adr-081"></a>

## ADR-081 — Una reingesta borra el progreso del estudiante: `topic` gana clave natural y deja de borrarse

**Estado:** ✅ `ACCEPTED` · 8 de septiembre de 2026 · **decidido por el Product Owner**
**Fecha de apertura:** 8 de septiembre de 2026 · **lo abrió medir C2 antes de empezarlo**
**Relacionado:** [ADR-060](#adr-060), [ADR-067](#adr-067), [ADR-080](#adr-080) ·
[matriz de fuentes y autoridad](matriz-de-fuentes-y-autoridad.md) §4.9 y §0.
**Toca:** `topic`, `ingerir_materia`, `scripts/db-aislamiento.sh`.

### El hallazgo, y no es una hipótesis

**Cargar dos veces la misma materia destruye el trabajo del estudiante.** Medido el 8 de septiembre
sobre el mundo demo, contando antes y después de una segunda ingesta de la misma cursada:

| | antes | después |
|---|---:|---:|
| `topic_progress` de esa cursada | 1 | **0** |
| `action` ancladas a un tema | 2 | **0** |
| `action` con `topic_id NULL` | — | **7** |

**El progreso se borró y las acciones perdieron a qué unidad pertenecían.** En silencio: sin
`audit_log`, sin evento, sin nada que lo delate.

### Por qué pasa

`ingerir_materia` hace `DELETE FROM topic WHERE offering_id = …` y vuelve a insertar. **Doce tablas
apuntan a `topic`**, y sus reglas de borrado hacen el resto:

| Regla | Tablas | Efecto |
|---|---|---|
| ⚠️ `CASCADE` | `topic_progress`, `assessment_topic`, `topic_prerequisite`, `class_session_topic` | **La fila se borra** |
| `SET NULL` | `action`, `progress_entry`, `error_observation`, `resource`, `learning_objective`, `protocol_step_completion`, `support_need_observation` | La fila sobrevive **y pierde el tema** |

⚠️ **Y `topic` no tiene clave natural**: no hay `UNIQUE (offering_id, code)`. Un tema recargado es
una fila nueva con otro `id`, así que **nada podía reconectarse aunque quisiera**.

### La consecuencia que más importa

**El ADE vuelve a ver todo como `no_information`.** Lee `topic_progress` para saber qué se practicó
y cuándo; después de una reingesta no queda nada, y **recomienda como si el estudiante nunca hubiera
hecho nada**.

⚠️ **Esto es distinto de lo que la matriz había registrado.** Ahí decía *"el `DELETE` no deja
rastro"* —un problema de auditoría—. Es más grave: **destruye datos de primera parte del
estudiante**, que es lo único que el modelo trata como incuestionable en todas las otras familias.

### Los tres problemas, que estaban apilados

Se separan porque tienen urgencias distintas:

| # | Problema | Naturaleza |
|---|---|---|
| **1** | **Pérdida de datos.** Una reingesta borra progreso y desancla acciones | **Defecto vivo.** Golpea a una persona el día que alguien recargue un programa |
| **2** | **Identidad inestable.** El mismo tema recargado es otra fila | Modelo |
| **3** | **Procedencia e historia.** Quién afirmó la unidad y qué decía la versión anterior | Modelo |

### La decisión: clave natural, y la ingesta deja de borrar

**Se eligió la forma que cierra los tres de una** —de las cuatro que la
[matriz](matriz-de-fuentes-y-autoridad.md) §5.3 dejó abiertas—:

**1 · `topic` gana clave natural.** `UNIQUE (offering_id, code)` y `UNIQUE (course_id, code)`, como
índices parciales, porque `topic_belongs_somewhere` admite las dos pertenencias
([ADR-060](#adr-060): *el temario es de la materia*).

**2 · `ingerir_materia` pasa de `DELETE` + `INSERT` a upsert.** El tema que vuelve con el mismo
código **es el mismo tema**: conserva su `id`, y con él todo lo que le cuelga.

**3 · Lo que ya no viene se marca retirado, no se borra.** Una unidad que desaparece del programa
**deja de estar vigente**; sus filas dependientes sobreviven.

⚠️ **Retirar no es borrar, y la diferencia es el punto del ADR.** El progreso sobre una unidad que la
cátedra sacó del programa **sigue siendo cierto**: el estudiante lo hizo. Borrarlo sería afirmar que
no ocurrió.

### Qué NO decide este ADR

⛔ **No agrega procedencia a `topic`.** `source_type` y `verification_status` siguen sin existir ahí.
Esto hace que la identidad sea estable —precondición para poder atribuir algo a una unidad— pero
**no atribuye nada todavía**. Es el problema 3, y sigue abierto.

⛔ **No es la identidad de actor de `C01-030`.** Son dos cosas distintas y se cruzan sólo en el
nombre: acá se trata de que un `id` siga nombrando la misma unidad, no de quién está autorizado a
afirmar algo. `C01-030` sigue `DEFERRED` por [ADR-057](#adr-057).

⛔ **No habilita [ADR-080](#adr-080).** El enriquecimiento con IA sigue siendo candidato, y su
bloqueo por *identidad estable del `topic`* se levanta sólo en la parte que este ADR resuelve.

### El riesgo, y por qué se aceptó

**Un `UNIQUE` sobre datos existentes puede no entrar.** Se midió antes de decidir: **9 temas, cero
sin `code`, cero duplicados** en las dos pertenencias.

⚠️ **Es una muestra chica**, y el corpus real tiene 36 materias identificables. El índice se agrega
**después de verificar**, y si un catálogo futuro trae códigos repetidos la migración **debe fallar
ruidosamente** en vez de deduplicar por su cuenta: elegir cuál de dos unidades homónimas sobrevive
es una decisión de contenido, no de schema.

---

<a id="adr-082"></a>

## ADR-082 — La Bitácora es de una materia: `CTA-009` transporta la cursada

**Estado:** ✅ `ACCEPTED` · 9 de septiembre de 2026 · **autorizado por el owner** (*"empezá por el
1"*, sobre los cuatro cortes de [`cursado-de-materia.md`](cursado-de-materia.md) §8)
**Fecha de apertura:** 9 de septiembre de 2026 · lo abrió el mockup del cursado de materia
**Relacionado:** [ADR-054](#adr-054) *(de la que es la segunda aplicación)*, [ADR-077](#adr-077) ·
[`cursado-de-materia.md`](cursado-de-materia.md) §6 fila **B**
**Toca:** `estado_de_progreso`, `GET /api/progreso`, `CTA-009`, `MateriaProps`.

### El defecto

Dos frases del spec dicen lo mismo, y sólo una se cumplía:

> `VI.2` §8.7 — *"una preview cronológica de eventos relevantes **de esta materia**"*
> `VI.6` §8.3 — *"Bitácora es el historial completo de la misma verdad derivada. **No existe una
> segunda fuente histórica**"*

`hechos_de_cursada()` **siempre fue por cursada**. El que elegía mal era `estado_de_progreso`: su
CTE `cursada` tomaba **la primera activa** por `created_at`, sin que nadie pudiera decirle cuál.

**Con una materia eso era invisible. Con tres —que es lo que deja el alta— mirar el registro de
Álgebra abría el de Cálculo.** Es exactamente el defecto que [ADR-054](#adr-054) cerró en `CTA-001`,
en la superficie de al lado y por el mismo motivo: **no es una ausencia, es una respuesta
equivocada**, y es la clase de error que *"la UI proyecta, nunca decide"* existe para impedir.

### La decisión

**`estado_de_progreso` gana un quinto parámetro opcional, `p_course_enrollment_id`, y `CTA-009` lo
transporta.** Es el contrato de [ADR-054](#adr-054) opción `B` —el objeto viaja en la URL— aplicado
por segunda vez, con el mismo nombre de parámetro porque es el mismo objeto.

`NULL` conserva entero el comportamiento anterior: es lo que `UX01`, `UX05`, `UX08` y `UX09` siguen
pidiendo, y lo que el Track A necesita cuando **no hay `course_enrollment` que nombrar**.

### Las tres cosas que se decidieron en el camino

**1 · Se filtran las dos puntas, no una.** `estado_de_progreso` deriva la cursada de la última
evidencia del estudiante. Acotar sólo la CTE `cursada` dejaba la pantalla diciendo «Álgebra» en la
URL y mostrando la evidencia de Cálculo; acotar sólo la evidencia devolvía `NULL`. Hay check de base
para cada una.

**2 · La puerta aparece si hay algo detrás.** `verRegistro` es `null` exactamente cuando
`actividadReciente` lo es. La preview y la Bitácora salen de la misma función y de la misma
traducción (`aEntradaVisible`), así que **una preview vacía es una Bitácora vacía**, y ofrecer el
enlace ahí sería prometer un historial que no existe.

⚠️ **Con una salvedad dicha, no tapada:** la preview mira **los últimos tres hechos**, no todos. Si
esos tres no tienen copy aprobada y hay otros más viejos que sí, la puerta queda escondida. Es el
error conservador —omitir de más— y se prefirió al de prometer de más.

**3 · La CTA va arriba a la derecha, y una sola vez.** Como acción del objeto (§11.9.3) y como ya
está en `UX01`. **No se repite al pie de «Actividad reciente»**: la misma acción dos veces en una
pantalla es `C-02` roto —un concepto, un lugar—, y es el defecto que ya se corrigió una vez en
`UX01`.

### Lo que este ADR NO hace

⛔ **No mueve la Bitácora adentro de `UX02`.** El spec reparte: `UX02` muestra 2–3 entradas y `UX06`
el historial completo. Copiar el historial a la materia sería la segunda fuente que `VI.6` §8.3
prohíbe — la regla que este ADR viene a **cumplir**, no a erosionar.

⛔ **No toca la dimensión Confianza.** El checklist de la captura del owner es el corte 2, y
[`cursado-de-materia.md`](cursado-de-materia.md) §8 lo deja bloqueado hasta que la psicopedagoga lea
el vocabulario. Este ADR no adelanta ni una palabra de eso.

⛔ **No agrega una superficie ni una CTA.** El registro canónico sigue en **20**. `CTA-009` ya
existía y ya tenía origen en `UX02`: lo único que cambia es que ahora **dice de qué materia**.

⛔ **No cambia el breadcrumb.** `UX06` sigue colgando de `UX01`: `CTA-009` tiene cinco orígenes, y
`migas.ts` declara un árbol, no el camino por el que se llegó. Inventar jerarquía según el
referrer sería otra cosa.

### Cómo se verifica

**20 comprobaciones nuevas en `npm test`** (`tests/bitacora-por-materia.test.tsx`) y **8 en
`npm run db:verify`** (`scripts/db-superficies.sh`, sección `B6.20`). Las de base se verificaron
**rompiendo la regla a propósito**: sin el filtro de la CTE `cursada`, pedir Álgebra devuelve
«Análisis II» con los tres hechos de Análisis II, y el guard lo dice con esas palabras.

---

<a id="adr-083"></a>

## ADR-083 — El bloque horario existe, entra por la ingesta y **no toca el reparto**

**Estado:** ✅ `ACCEPTED` · 9 de septiembre de 2026 · **autorizado por el owner** (alcance elegido:
*entidad + ingesta + pantalla*, sobre el corte 3 de [`cursado-de-materia.md`](cursado-de-materia.md) §8)
**Fecha de apertura:** 5 de septiembre de 2026 — [ADR-063](#adr-063) lo decidió y **nadie lo
construyó en cuatro días**
**Relacionado:** [ADR-062](#adr-062), [ADR-063](#adr-063), [ADR-064](#adr-064),
[ADR-081](#adr-081) · [plan](plan-periodo-comision-horarios.md) Corte 4
**Toca:** una tabla nueva, `ingerir_materia`, `estado_de_materia`, `UX02`, `lib/content/es-AR.ts`.

### Qué se construyó

**`class_schedule_block`**, con **exactamente un dueño** y `CHECK` de exclusividad — el mismo patrón
que `topic_belongs_somewhere` y `una_sola_forma`. Dos FK reales, sin `owner_type` y sin JSON, que son
las dos prohibiciones de forma que [ADR-063](#adr-063) escribió textualmente.

| | |
|---|---|
| `offering_id` | El horario **publicado** de la comisión |
| `course_enrollment_id` | El que **declara el estudiante** que todavía no sabe su comisión |

Lo carga `ingerir_materia` con `p_horarios`, llega a `UX02` como **`CLASES DE LA SEMANA`**, y cada
bloque viaja con su procedencia.

### Las tres cosas que el bloque horario no es

**No es `class_session`.** Aquélla es **una clase dictada**, con su fecha. Ésta es **la regla
semanal**. Derivar la segunda desde las primeras —«se dictó tres martes seguidos, entonces cursa los
martes»— es inferencia, y quedaría presentada como horario de la institución. Hay guard: se cargan
tres sesiones de un lunes y el horario **sigue sin tener ningún lunes**.

**No es `availability`.** *"Uno expresa cuándo está cursando y el otro cuándo puede estudiar"*
([ADR-063](#adr-063)).

**No es una agenda.** Decisión del owner, textual: **«solo mostrar, no agendar»**. El panel no ofrece
ninguna acción, y hay guard de que no contiene ni un `button`, ni un `a`, ni un `input`.

### ⛔ Por qué NO descuenta las horas del reparto

El corte 3 de [`cursado-de-materia.md`](cursado-de-materia.md) proponía que `insumos_de_reparto()`
restara las horas de cursada. **Se dejó sin hacer, y no por falta de tiempo:** contradice tres cosas
ya decididas.

1. **[ADR-063](#adr-063) separa las dos magnitudes.** `availability` es *"cuándo puede estudiar"* —
   **ya excluye la clase por construcción**, porque eso es lo que la pregunta significa. Restarle las
   horas de cursada las descontaría **dos veces**.
2. **[ADR-064](#adr-064) ya decidió dónde se resuelve una superposición**: en el `Commitment`, *"no
   confirmar silenciosamente… mostrar el conflicto"*, con dos salidas —elegir otro horario **o
   corregir el bloque de clase**— porque *"la pantalla no puede asumir que el equivocado es él"*.
   Restar en silencio del presupuesto asume exactamente eso.
3. **El owner dijo «solo mostrar».** Consumir presupuesto es hacer algo más que mostrar.

Hay guard estático: `insumos_de_reparto` **no menciona** `class_schedule_block`, y romperlo hace
fallar el test.

⚠️ **Esto deja abierta una pregunta legítima, y es del owner:** un estudiante puede declarar
disponibilidad **encima** de su horario de clase. Hoy eso no se detecta en el reparto y aparece
recién al comprometerse, por ADR-064. Si hay que decir algo antes, es una decisión de producto — no
una resta silenciosa.

### Las dos columnas que se decidieron NO agregar

**⛔ `kind`.** El plan la listaba como opcional y **ningún ADR declara su vocabulario**: «teórico»,
«práctico», «laboratorio» serían tres palabras inventadas acá. Una columna que nada restringe y nada
lee es el defecto de `reflection.difficulty` —dos escritores, cero lectores— repetido a sabiendas.

**⛔ `course_enrollment.schedule_status`.** Ésta **sí la pide [ADR-063](#adr-063)**, y se escribió,
se probó y se sacó. El motivo está medido: el estado se pondría en `KNOWN` al ingerir el horario,
pero **`course_enrollment` se crea después de la ingesta** —lo hace `db-demo.sh` y lo hace el alta—,
así que el `UPDATE` no tocaba ninguna fila y las tres materias del mundo demo quedaban `UNKNOWN`
**con sus bloques cargados**. Una columna que miente en el caso normal es peor que no tenerla.

Y el arreglo no es un trigger: **el estado que el ADR describe es una declaración del estudiante**
—*"todavía no sé mis horarios"*— y la pantalla que la recoge es el cuarto paso del alta, que pregunta
comisión y horario juntos y arrastra [ADR-062](#adr-062) entero. **La columna llega con su
escritor.** Mientras tanto, «no se sabe» se contesta con la ausencia de bloques, que es un hecho y no
puede desincronizarse.

⚠️ **Y esa ausencia sigue sin leerse como disponibilidad**: la pantalla **omite** la sección, no
dibuja una semana libre.

### Lo que este ADR NO habilita

⛔ **No construye el cuarto paso del alta**, así que el segundo escritor de [ADR-063](#adr-063) —el
horario que declara el estudiante— **existe en el schema y no tiene pantalla**. El `CHECK` lo admite
y los guards de base lo ejercitan; ninguna ruta lo escribe todavía.

⛔ **No abre [ADR-062](#adr-062).** `commission_status`, `NOT_LISTED` y la acción global *«no sé mis
comisiones»* siguen sin construir.

⛔ **No implementa [ADR-064](#adr-064).** El conflicto al comprometerse sigue sin validarse; ahora
existe contra qué validarlo.

⛔ **No agrega aula.** [ADR-062](#adr-062) modeló el bloque sin aula y la captura del owner pedía
«Aula 305». No hay dónde ponerlo **a propósito**. ⚠️ **Cambió el 11 sep por [ADR-094](#adr-094)**: el owner pidió el aula; la columna existe y hoy sólo la llenan aulas simuladas sobre horarios simulados.

### Una corrección que salió del camino

**Había dos listas de nombres de día.** El paso de disponibilidad del alta tenía la suya, y este
corte necesitaba otra para `UX02`. Se unificó en `lib/content/es-AR.ts` —traducir un `SMALLINT` a una
palabra visible **es contenido**— con guard de que no aparezca una segunda copia en ningún
componente. Y las dos tablas usan **la misma escala `0`–`6`**, que es lo que va a permitir compararlas
el día que [ADR-064](#adr-064) se construya.

### Cómo se verifica

**19 comprobaciones nuevas en `npm test`** (`tests/horario-de-cursado.test.tsx`) y **18 en
`npm run db:verify`** —8 de constraints en `db-invariantes.sh` y 10 de lectura e ingesta en
`db-superficies.sh`—. Las cuatro reglas centrales se verificaron **rompiéndolas a propósito**.

⚠️ **Y un defecto propio, encontrado por los guards y no por una lectura:** la primera versión de la
sección de base ingería contra la oferta compartida con `p_unidades: []`, y desde
[ADR-081](#adr-081) eso **retira todas las unidades de la oferta** — nueve comprobaciones aguas abajo
se caían sin que hubiera un solo invariante roto. La sección tiene ahora su propio mundo. **Un
verificador no puede romper lo que las otras comprobaciones necesitan.**

---

<a id="adr-084"></a>

## ADR-084 — El compromiso no se confirma encima de una clase

**Estado:** ✅ `ACCEPTED` · 9 de septiembre de 2026 · **construye
[ADR-064](#adr-064)**, decidido el 5 de septiembre y sin implementar
**Relacionado:** [ADR-046](#adr-046), [ADR-049](#adr-049), [ADR-050](#adr-050),
[ADR-063](#adr-063), [ADR-083](#adr-083) · [plan](plan-periodo-comision-horarios.md) Corte 5
**Toca:** `lib/domain/superposicion.ts`, `lib/domain/zona.ts`, el Service de `Commitment`,
`POST /api/compromiso`, `POST /api/renegociacion`, `estado_de_compromiso`, `UX04`.

### Qué se construyó

La decisión de [ADR-064](#adr-064), textual:

> *"La restricción horaria pertenece a la propuesta y validación del `Commitment`, no al ADE."*
> *"No confirmar silenciosamente el compromiso. **Mostrar el conflicto.**"*

**Las dos mitades**, porque el ADR pide las dos:

| | |
|---|---|
| **Validación** | `confirmarCompromiso` y `renegociar` rechazan con `CONFLICTO_DE_HORARIO` **antes de escribir**. El `409` lleva el hecho: *"Tenés clase el miércoles de 14:00 a 16:00"* |
| **Propuesta** | `propuestaDeCompromiso` corre el horario hasta el primer hueco libre **y lo dice**; el selector de [ADR-050](#adr-050) deja de listar franjas con clase encima |

Proponer un horario que el servidor va a rechazar es exactamente el defecto que
[ADR-050](#adr-050) corrigió una vez —*"la pantalla ofrecía algo que el backend no podía hacer"*— y
la mitad de este ADR existe para no repetirlo.

### La regla, y sus bordes

**Los dos intervalos son semiabiertos.** Terminar **justo** cuando empieza la clase **no es
conflicto**, y empezar justo cuando termina, tampoco. Tratarlos como conflicto haría imposible lo más
razonable que alguien puede hacer —estudiar pegado a la clase— y nadie entendería por qué.

**Se comparan instantes absolutos, no minutos de pared.** Cada bloque se materializa en el día
concreto —y en sus dos vecinos, porque una franja puede cruzar la medianoche— preguntándole el offset
a la zona para ese día. Un `-03:00` escrito a mano se rompe en la primera institución con horario de
verano, **y se rompe en silencio**: da un resultado plausible una hora corrido.

**Contra todas sus cursadas, no contra la materia de la Action.** Comprometerse a estudiar Cálculo el
martes a las 18:30 choca con la clase de **Física** de 18 a 20 igual que con la de Cálculo. Filtrar
por materia dejaría pasar justo el caso que el estudiante no ve venir.

**La zona es la de la institución** ([ADR-049](#adr-049)), no la del estudiante: el horario de clase
es un hecho de la cátedra, y dos estudiantes de la misma comisión en husos distintos cursan a la
misma hora. **Sin zona institucional el compromiso no se confirma** (`503`), igual que la
renegociación: evaluar la regla con otra zona sería aplicar otra regla.

### El riesgo, y cómo se acotó

Es **una regla nueva sobre el camino que ya funciona** —el plan lo marcaba como el riesgo más alto
del bloque—. Se acota con una sola propiedad: **una lista vacía de bloques nunca da conflicto**. Sin
horarios cargados —el caso de casi todo el mundo hoy— el comportamiento es **idéntico** al de antes,
y hay test de eso en las tres capas.

⚠️ **La idempotencia va antes que la regla, y el orden es deliberado.** Un reintento del mismo pedido
devuelve la fila que ya existe **aunque el horario ahora choque**: si el horario de clase se cargó en
el medio, la respuesta a *"¿lo creaste?"* sigue siendo sí. Reevaluar acá convertiría un reintento en
el rechazo de algo que ya pasó. Hay guard.

### ⛔ Lo que NO se construyó, y hay que decirlo

**El ADR pide dos salidas y sólo una existe.** *"Pedir que elija otro horario **o que corrija el
bloque de clase** si ya no corresponde."*

- **Elegir otro horario** ✅ existe donde hay selector —la renegociación de [ADR-050](#adr-050)— y en
  la propuesta se resuelve solo, corriendo el horario.
- **Corregir el bloque de clase** ⛔ **no tiene dónde hacerse.** El único escritor de horarios es la
  ingesta ([ADR-083](#adr-083)); el que declara el estudiante necesita el cuarto paso del alta, que
  arrastra [ADR-062](#adr-062) entero.

Por eso la copy **enuncia el hecho y ninguna de las dos salidas**: donde la primera existe, el
selector está a la vista; describir la segunda sería señalar una puerta que no está.

### Una corrección que salió del camino

**`renegociarCompromiso` habría convertido el conflicto en una mentira.** Su `switch` termina en
`default: return { estado: "CONFLICTO" }` —*"ese compromiso cambió de estado"*—, y el conflicto de
horario salía por ahí: el estudiante habría recargado la pantalla para encontrarla igual. **Y como
hay `default`, el compilador no lo señala.** Ahora tiene su caso explícito, y un guard verifica que
esté **antes** del catch-all.

**Y había una copia privada de aritmética de husos.** `renegociacion.ts` traía su `desplazamiento()`;
esta regla necesitaba lo mismo. Se extrajo a `lib/domain/zona.ts` en vez de duplicarla — dos verdades
sobre husos horarios divergen en el primer horario de verano.

### Cómo se verifica

**27 comprobaciones nuevas en `npm test`** (`tests/superposicion-de-horario.test.ts`) y **5 en
`npm run db:verify`**. Cuatro reglas se verificaron **rompiéndolas a propósito** y las cuatro hacen
fallar su guard.

⚠️ **Una quinta rotura NO falló, y conviene saber por qué:** sacar el atajo
`if (bloques.length === 0) return null` no cambia nada, porque el bucle sobre una lista vacía tampoco
encuentra nada. **La garantía es estructural, no el atajo**, y el test fija el comportamiento.

Y el recorrido real, contra la app corriendo: con una clase de 14 a 16 cargada, la propuesta llega a
las **16:00** con su aviso; confirmar a las 14:30 devuelve `409 · "Tenés clase el miércoles de 14:00
a 16:00"` y **no crea ninguna fila**; confirmar a las 16:00 devuelve `201`.

---

<a id="adr-085"></a>

## ADR-085 — `UX02` se rearma alrededor del Gantt por tema

**Estado:** ✅ `ACCEPTED` · 9 de septiembre de 2026 · **decidido por el owner con las capturas
delante** (*"copiá el diseño tal cual, manteniendo la paleta"*)
**Relacionado:** [ADR-016](#adr-016), [ADR-054](#adr-054), [ADR-072](#adr-072), [ADR-075](#adr-075),
[ADR-078](#adr-078), [ADR-083](#adr-083) · [`cursado-de-materia.md`](cursado-de-materia.md)
**Toca:** `estado_de_materia`, `GanttProjection`, `MateriaProps`, `UX02`, `CTA-019`,
`lib/domain/ventana.ts`.

### Qué se construyó

El layout de la captura, con la paleta actual: **el Gantt por tema con eje de fechas** ocupando el
panel principal, la **tarjeta de evaluación** con la entrada a Modo Examen, el **registro**, las
**clases de la semana**, el **próximo paso** y la **actividad reciente**.

`CTA-019` —declarada desde [ADR-016](#adr-016) y **nunca renderizada**— por fin es alcanzable por
clic, y transporta la cursada como `CTA-001` y `CTA-009`: `UX07` elige entre los `Assessment` **de
esta cursada**.

### Las dos puntas de cada barra son hechos

**Cuándo se dictó** sale de `class_session_topic` y **para cuándo se evalúa** de `assessment_topic`.
Ninguna se estima.

⚠️ **Un tema sin esas fechas NO se ubica**, y la fila lo dice: *«todavía no se dictó»*. Colocarlo en
«+7 días» porque es el séptimo de la lista sería **inventar un plan de estudio que nadie hizo** y
presentarlo como si la cátedra lo hubiera dictado. Es la misma regla que impide que el ADE agende.

⚠️ **Y sin `assessment_topic` no hay alcance.** No se supone que la evaluación de la materia cubre
todos sus temas: eso lo declara la cátedra o no está. Sin evaluación, la barra termina en la última
clase que dictó el tema.

El eje es **el mismo que el índice de materias**: `marcasDelEje` se movió a `lib/domain/ventana.ts` y
la usan las dos. Dos copias serían dos escalas para el mismo eje.

### ⛔ Las tres cosas de la captura que no se copiaron, y por qué

**`Dominado`.** Primera prohibición de [ADR-072](#adr-072) —*el dominio requiere evaluación*—, el
corte que sostiene `preparar ≠ enviar ≠ suficiencia ≠ validación ≠ dominio`. Un estudiante
marcándose «dominado» **no evalúa nada: declara**.

**`nivel`.** [ADR-075](#adr-075) §C1, la psicopedagoga, textual: *"su rótulo visible debe ser
`actividad registrada`, no `dominio`, `nivel`, `rendimiento` ni `avance de aprendizaje`"*.

**`3/3`.** Un puntaje, sobre una dimensión que `C01-019` dejó sin unidad en la que expresarse.

En su lugar, la columna dice **el estado de la evidencia**, que sí es un hecho: `Sin registro ·
Entregado · Requiere revisión · Criterio alcanzado`. Los cuatro describen **actividad, no
conocimiento**, que es exactamente lo que §C1 pide.

⚠️ **Y hay una razón más honda que el vocabulario: la escala de la captura es la dimensión
Confianza**, que el estudiante autodeclara y que **todavía no tiene escritor**. Construirla es el
corte 2 de [`cursado-de-materia.md`](cursado-de-materia.md), **bloqueado** hasta que la psicopedagoga
revise las palabras.

**Un cuarto detalle, del mismo tipo:** la captura pintaba cada estado de un color —verde
«dominado», ámbar «leído»—, que es **la escala de calificación que §C1 descarta**. Las barras usan un
solo color, y el estado se lee en palabras.

### Tres decisiones de layout que el mockup forzó

**El orden va contra el spec, y es del owner.** `VI.2` §1 pide *"la acción ocupa el primer
viewport… no obligan al alumno a analizar un tablero para descubrir qué hacer"*. La captura invierte
eso. Se construyó como la captura porque el owner la eligió con las dos delante, y queda dicho en el
componente para que no se lea como un descuido.

**El `CURSÁS · Lun 14:00–16:00` de la tarjeta NO se copió.** Repetía el panel «Clases de la semana»,
que además lleva la procedencia de cada bloque. La misma cosa en dos lugares es `C-02` roto, y es el
defecto que ya se corrigió una vez en `UX01` con `CTA-009`.

**Modo Examen es CTA secundaria, no primaria.** En la captura es el botón dominante; `I-06` admite
**una sola CTA primaria por pantalla**, y la que esta pantalla propone sigue siendo la próxima
acción. Hay guard, y falla si se invierte.

### Lo que se perdió, y hay que decirlo

**La lista «Unidades» con su recencia por tema desapareció.** El Gantt la reemplaza y muestra el
estado de evidencia, **no** el *«hace 2 días»* de cada unidad. Se sacó la prop en vez de dejarla sin
renderizar —una prop que nada dibuja es la misma deuda que una columna que nadie escribe— y **la
regla que protegía sobrevive**: su test se reescribió contra la forma nueva.

### Lo que este ADR NO hace

⛔ **No construye el checklist de Confianza.** Es el corte 2, y sigue bloqueado.

⛔ **No agrega `Aula 305` ni «Seguir en etapa 3».** No hay campo de aula ([ADR-062](#adr-062) modeló
el bloque sin aula) y las «etapas» siguen sin definirse.

⛔ **No nombra a ninguna persona.** *«Analía interviene en paralelo»* es dato personal y quién
interviene es `C01-030`, `DEFERRED`.

⛔ **No toca la navegación.** «Calendario», «Formación» y «Mi seguimiento» quedaron afuera por
decisión del owner, y el registro canónico sigue en **20 CTAs**.

### Cómo se verifica

**19 comprobaciones nuevas en `npm test`** (`tests/gantt-por-tema.test.tsx`). Cuatro reglas se
verificaron **rompiéndolas a propósito** —la etiqueta prohibida, ubicar un tema sin clase, invertir
la jerarquía de CTAs y ofrecer Modo Examen sin evaluación— y las cuatro hacen fallar su guard.

Y el recorrido real: el panel llega con su eje de seis marcas, las unidades dictadas con su barra
entre dos fechas, la que no se dictó **sin barra y con su motivo**, y la tarjeta diciendo
*«Parcial 1 · mar 15 sept · 6 días · practico · 2 evidencias enviadas»*.

---

## ADR-086 — Contenido estimado, el peso como tiempo, y el Plan 2016 publicado

**Estado:** ✅ `ACCEPTED` · 9 de septiembre de 2026 · **decidido por el owner**, cuatro respuestas
explícitas más una quinta sobre el plan en borrador
**Relacionado:** [ADR-006](#adr-006), [ADR-053](#adr-053), [ADR-068](#adr-068),
[ADR-081](#adr-081), [ADR-085](#adr-085)
**Toca:** `ingerir_materia`, `contexto_del_ade`, `estado_de_materia`, `lib/domain/ade.ts`,
`MateriaProps.aviso`, `scripts/importar-temarios.mjs`, `scripts/simular-temarios.mjs`,
`scripts/importar-catalogo.mjs`, `scripts/db-catalogo.sh`.

### El problema

El Plan 2016 tiene **51 materias**. Veinticinco tenían temario real —los programas oficiales de la
UCC, cargados por `importar-temarios.mjs`— y veintiséis no tenían nada. Y **ninguna tenía
calendario**: un programa de asignatura no trae fechas, así que el Gantt quedaba vacío y no existía
la cuenta *"cuánto te falta estudiar antes del examen"*. Además el plan estaba `DRAFT`, así que
nadie podía inscribirse solo.

### Lo que se decidió

**1 · El contenido que falta se genera, y se dice que se generó.** No hay columna nueva: se usa
`source_type = 'inference'`, que ya existe en el vocabulario y que `provenance.ts` ya traduce a
*«Estimado por Achieve»*. `estado_de_materia` devuelve una clave `contenido` con tres valores
—`estimado`, `calendario_estimado`, `NULL`— derivada de mirar `source_type` en `resource` y
`class_session`.

⚠️ **`NULL` no significa «verificado»**, significa que ninguna fila dice `inference`.
`verification_status` sigue en `unverified` para todo esto, y su única escritura sigue siendo
`corroborar_procedencia()` (`I9`, intacto).

**2 · «Tomado como válido» y «estimado» conviven.** El dominio trata el contenido generado igual
que al real —el ADE recomienda sobre él, el Gantt lo ubica, el progreso cuenta— y la procedencia
dice la verdad. **Funcionalmente válido, procedencialmente estimado.** El aviso va en `UX02`, en el
slot `aviso` que ya existía, arriba del Gantt.

**3 · La «dificultad» es `topic.weight`, y ya existía.** Es *cuánto de la materia ocupa esa
unidad*, y de ahí salen los minutos por tema que `duracion.ts` ya calculaba. Lo que faltaba era el
dato: `ingerir_materia` no lo escribía. Ahora `p_unidades` acepta `peso`.

⚠️ **No es dificultad, y no se renombra a eso.** Que una unidad sea larga y que sea difícil son dos
afirmaciones, y la segunda no la declaró nadie.

⚠️ **Es todo o nada por materia** (`usaPesos()`, ADR-068). Un peso faltante no es `1.0`.

**4 · El peso entra al ranking del ADE: más peso, más prioridad.** La unidad larga es la que no
llega si se deja para el final. Aporta hasta `120`, **por debajo** de la señal de práctica (`300`) y
muy por debajo de la de evaluación (`1000`): ajusta el orden entre unidades parecidas y **no le gana
a que otra entre en el parcial**.

⚠️ La dirección contraria —arrancar por las cortas para acumular cierres— es defendible y **es de la
psicopedagoga**. Hoy no está respondida. Hay test que falla si alguien invierte el signo.

**5 · El Plan 2016 se publica.** Sin eso el alta no ofrece la carrera y nadie puede inscribirse
solo. `publicar_plan_de_estudios()` exige que no queden `needs_review`, así que **el owner los da
por revisados**, con su motivo escrito en `importar-catalogo.mjs` y en el `audit_log`.

⚠️ **Dar por revisado no es auditar.** El owner los levantó para habilitar el MVP, no porque haya
contrastado el plan con la resolución de la facultad. Y **los diez nombres cortados siguen
cortados**: `label_truncated` no se toca, porque levantar la marca no arregla el dato.

⚠️ **Tres guards se mudaron de plan, no se aflojaron.** «Un borrador no se ofrece», «`requisitos_del_plan`
devuelve `NULL`» y «publicar con `needs_review` se rechaza» ahora corren contra
`INFORMATICA/web-2026`, que sigue `DRAFT` con sus 74 sin revisar.

**6 · «UCC Sistemas» es sólo lo que ve el estudiante.** `academic_program.name` conserva
`INGENIERIA DE SISTEMAS`, que es como la nombra el CSV de la facultad. La traducción vive en
`lib/content/es-AR.ts` y se aplica al salir. **Es una traducción, no un renombre.**

**7 · Los dos códigos duplicados los resuelve el plan.** `ORGANIZACIÓN Y ADMINISTRACIÓN DE EMPRESAS`
es `22136` y `REDES TELEINFORMÁTICAS II` es `10212`; los que traen los programas (`20136`, `10210`)
se mapean al entrar. `curriculum_requirement` es la fuente administrativa.

### Lo que se aprendió construyéndolo

⚠️ **La cursada vive en el período del alta, no en el año lectivo del programa.**
`confirmar_mapa_academico()` crea la cursada con `(course, term, NULL)` usando el período que el
estudiante eligió. Ingerir bajo `2024 / cátedra A` dejaba **dos ofertas** de la misma materia: la
del contenido y la del estudiante, vacía. Medido: seis materias inscriptas, cero temas, ADE sin nada
que decidir. El año lectivo y la cátedra viajan en `source_ref`.

⚠️ **Una unidad pesada tiene que ocupar más clases.** `minutosPorTema()` reparte los minutos
**observados** entre los temas que cada sesión cubrió: con una clase por unidad, todas salían con
los mismos 120 minutos y el peso no cambiaba nada. El generador le da `peso` clases a cada unidad.

⚠️ **El ADE chequea el material DESPUÉS de rankear y sólo sobre el ganador.** Cambiar el ranking
cambia quién gana, así que una unidad sin `resource` puede ahora devolver `CONTEXTO_INCOMPLETO` donde
antes no lo hacía. Todo tema generado lleva su material, y hay test.

### Lo que NO se hizo

- **No se cargaron los 80 libros de temas.** Traen nombre y legajo del docente en cada fila.
- **No se completaron los 3 temarios reales que el parser no lee** —Sistemas de Representación e
  Ingeniería de Software II— porque no numeran sus unidades. Conviene parsearlos, no simularlos.
- **No se tocó [ADR-006](#adr-006)**, que sigue `PROVISIONAL — LEGAL CONFIRMATION REQUIRED`.
  Publicar un plan es `publication_status`; el dictamen legal es otra cosa y sigue faltando.

---

<a id="adr-087"></a>

## ADR-087 — Formación: la biblioteca del alumno autónomo

**Estado:** ✅ `ACCEPTED` · 10 de septiembre de 2026 · **decidido por el owner**, cinco decisiones
más cuatro condiciones de alcance — ver §*Decisiones del owner*
⚠️ **La construcción NO está autorizada todavía:** el owner pidió revisar este documento y el plan
antes de que se escriba código.
**Relacionado:** [ADR-006](#adr-006), [ADR-021](#adr-021), [ADR-058](#adr-058),
[ADR-072](#adr-072), [ADR-075](#adr-075), [ADR-077](#adr-077) ·
[`gantt-de-preparacion.md`](gantt-de-preparacion.md) §7 · [`cursado-de-materia.md`](cursado-de-materia.md) §5
**Toca:** una entidad nueva, `lib/navigation/surfaces.ts`, `lib/navigation/menu.ts`, el registro de
CTAs, y una superficie nueva.

### El problema

`Formación` aparece como ítem de menú en el mockup del owner, junto a `Calendario` y
`Mi seguimiento`, y **se difirió tres veces**: en `gantt-de-preparacion.md` §7 (*"son dos productos
separados que aparecieron en el mismo mockup"*), en `cursado-de-materia.md` §5 (*"afuera por
ahora"*) y en [ADR-085](#adr-085) (*"quedaron afuera por decisión del owner"*).

Pero **el concepto sí está decidido** desde el spec original. Lo que faltaba era la superficie.

### Lo que el spec ya decide, y este ADR no reabre

De `product-spec-source.md` §13 · *Formación*, los dos `DECIDIDO`:

> Formación es aplicada y adaptativa; **no una videoteca pasiva**.
> **Autónomo: biblioteca + recomendaciones contextuales.**

> Para primer año, lo obligatorio debe tender a ser **microintervención contextual y aplicada, no
> curso lineal** previo a usar el producto. *La obligatoriedad existe donde reduce un error
> probable, no como requisito burocrático de onboarding.*

Y §3.9 la define en una línea: **contenido → aplicación real → evidencia → feedback.**
Concuerdan `D5` y `D23`, las dos `DECIDIDO`. **WF-S11** la engancha como `APOYO` de un paso del
protocolo: *"PDF breve · links de Formación"*.

⚠️ **Un ítem de menú es un destino que se navega, y el spec prohíbe la videoteca pasiva.** La única
frase que lo habilita es *"Autónomo: biblioteca"*. **Por eso el alcance de este ADR es exactamente
ésa y ninguna otra.**

### Lo que este ADR decide

**1 · Se construye la biblioteca, y sólo la biblioteca.** La microintervención contextual de primer
año **no entra**: es la mitad que el spec marca como *"no curso lineal"*, define obligatoriedad
sobre personas y **es terreno de la psicopedagoga**. Queda como residuo nombrado.

**2 · Entidad nueva, no se cuelga de `resource`.** `resource` está atada a `offering_id` y
`topic_id`: es material **de una cátedra sobre un tema**. El contenido de método —cómo usar una
guía, cómo preparar un oral— **no pertenece a ninguna materia**, y forzarlo ahí obligaría a
inventarle una cursada dueña.

**3 · Nodo sin wireframe, como `/materias`.** El patrón de [ADR-077](#adr-077): entra en
`surfaces.ts` con `wireframe: null`, así **`superficieIds` sigue devolviendo nueve** y la afirmación
del spec —*no existe `UX10`*— sigue siendo cierta. Hay guard.

**4 · El contenido entra con procedencia y sin verificar.** `source_type` + `verification_status`
en su default `unverified`, como todo lo demás. **`I9` intacto:** nada eleva su propia verificación.

### La cuarta decisión — **resuelta**, ver §*Decisiones del owner*

⚠️ **No existe el Student Model, así que no se puede mostrar la biblioteca «sólo al autónomo».**

El §13 condiciona la biblioteca a que el alumno **sea** autónomo, y §539 dice que eso lo determina
el Student Model: *"primer año, recursantes o estudiantes en riesgo pueden recibir mayor estructura;
alumnos autónomos, menor intervención"*.

**`student` tiene ocho columnas y ninguna dice cuánto andamiaje necesita esta persona.** No hay
tabla de Student Model, ni nivel de scaffolding, ni nada que lo calcule.

Sin eso, mostrar el ítem de menú a todos **le da una videoteca navegable a un ingresante** — que es
literalmente lo que `D23` descarta. Las tres salidas:

| | qué implica |
|---|---|
| **A · A todos** | Lo más simple y lo que más se aleja del spec. Un ingresante ve la biblioteca completa el primer día |
| **B · Detrás de un hecho observable** | Sin Student Model, el proxy tendría que ser algo que ya existe —¿evidencia validada?, ¿compromisos cumplidos?—. **Elegir el proxy es inventar la regla**, y es de la psicopedagoga |
| **C · La biblioteca existe, la entrada es contextual** | Sin ítem de menú: se llega desde un paso del protocolo (WF-S11) o desde un bloqueo. Respeta el §13 entero y **no construye la pantalla que pediste** |

**No la resuelvo yo.** Es una regla de negocio sobre a quién se le ofrece qué, y la regla 2 dice que
la cierra una persona.

### Lo que este ADR NO hace

- **No predice, no puntúa y no dice «dominado».** [ADR-072](#adr-072) y
  [ADR-075](#adr-075) §C1 valen igual acá: nada de `nivel`, `rendimiento` ni porcentajes de avance.
- **No es la ingesta.** No extrae unidades ni toca `topic`.
- **No define quién escribe el contenido.** Con [ADR-006](#adr-006) en `PROVISIONAL`, el catálogo
  arranca **sintético**, igual que todo lo demás.
- **No construye `Calendario` ni `Mi seguimiento`.** Siguen diferidos.

### Actualización · 10 de septiembre de 2026 — llegó el contenido

El owner trajo **los cinco contenidos de prioridad máxima** de la psicopedagoga, transcriptos en
[`formacion-prioridad-maxima-source.md`](formacion-prioridad-maxima-source.md). Con eso, tres de las
incógnitas de este ADR dejan de serlo.

**1 · El catálogo ya no arranca sintético.** Hay cinco piezas reales, elegidas por frecuencia de
consultorio, y un índice temático de **diecisiete áreas y cinco ejes** que ya estaba en el repo
desde el 1 de septiembre ([`indice-psicopedagogico-source.md`](indice-psicopedagogico-source.md)).
El índice **clasifica**; los cinco **son contenido**.

**2 · La forma de la entidad la dicta el contenido, no yo.** Cada pieza trae exactamente seis
partes, y son las mismas seis en las cinco:

| parte | ejemplo (pieza 1) |
|---|---|
| **título** | *"No sé por dónde empezar a estudiar"* |
| **problema que resuelve** | la tarea se ve demasiado grande y no logra arrancar |
| **objetivo** | transformar *"tengo que estudiar"* en una primera acción concreta |
| **explicación psicopedagógica** | el texto de la autora |
| **acción concreta posterior** | definir una microacción y comenzarla |
| **evidencia** | foto del primer paso |
| **material descargable** | plantilla *"De obligación a acción"* |

⚠️ **Eso es literalmente `§3.9`**: *contenido → aplicación real → evidencia → feedback*. La entidad
no puede ser «título + video»: sin la acción posterior y la evidencia, Formación **vuelve a ser la
videoteca pasiva** que el `§13` prohíbe.

**3 · Los videos no existen.** La autora lo dice: *"son 5, faltan los guiones"*. Se construye todo
lo que rodea al video, y el video **se omite en vez de fingirse**.

### La quinta incógnita — **resuelta**, ver §*Decisiones del owner*

⚠️ **`action.course_enrollment_id` es `NOT NULL`, y `evidence.action_id` también.** Un contenido de
Formación **no puede producir una acción ni una evidencia** sin colgar de una cursada. Y Formación no
es de ninguna materia. Tres salidas:

| | qué implica |
|---|---|
| **A · Hacer la columna nullable** | Toca la tabla más central del dominio. Todas las lecturas asumen que una `Action` tiene cursada |
| **B · La pieza se aplica a una materia que el estudiante elige** | **Es lo que el contenido ya pide**: la pieza 2 dice *"simplificar el programa"* —¿de qué materia?—, y la 1, *"definir una microacción"*. La maquinaria de `Action`/`Evidence` sirve **sin tocar nada**, y la *aplicación real* del `§3.9` se vuelve literal |
| **C · v1 sin evidencia** | La pieza enuncia qué evidencia correspondería y no la recoge. Más rápido, y deja el `§3.9` a medias |

**Recomendación: `B`.** No agrega esquema, no debilita un `NOT NULL` y es la lectura más fiel del
contenido — que está escrito para aplicarse a una materia concreta.

⚠️ **Y la vigencia sigue sin confirmar.** Igual que el índice y que el protocolo: *recibido no es
aprobado*. Los tipeos del original se conservan y **no se corrigen** (precedente de ADR-031).

### Decisiones del owner · 10 de septiembre de 2026

Tomadas por el owner con las dos opciones y sus costos delante
([`agenda-formacion.md`](agenda-formacion.md)), y transcriptas acá **sin interpretarlas**.

#### D1 · A quién se le muestra — **opción `A`**

> Formación será una **biblioteca opcional visible para todos los estudiantes desde el menú**. El
> acceso **no implica obligatoriedad** ni convierte Formación en un curso lineal. Mientras no exista
> el Student Model, **no se utilizarán proxies, puntajes ni umbrales** para clasificar estudiantes
> como autónomos. En el futuro, el Student Model podrá personalizar recomendaciones, orden y
> acompañamiento, sin que esta decisión defina todavía restricciones de acceso.

⚠️ **La prohibición de proxies es la parte operativa, y es un guard.** La opción `B` de la agenda
—inventar un sustituto del Student Model— **queda cerrada**: nada en el código puede clasificar a un
estudiante como autónomo a partir de evidencias validadas, compromisos cumplidos ni tiempo de uso.
Clasificar personas con un umbral improvisado es exactamente lo que `D23` y la psicopedagoga
protegen.

⚠️ **«Opcional» y «no obligatoria» tienen consecuencias visibles:** sin badge en el menú, sin
contador, sin nada que caduque. [ADR-021](#adr-021) ya fijó que el único badge posible es el del
trabajo que vence, y **en Formación no vence nada**.

#### D2 · La evidencia — **opción `B`**

> Las piezas de Formación producen aplicación y evidencia **vinculándose a un `CourseEnrollment`
> elegido por el estudiante**. **Leer una pieza no exige seleccionar una materia**; la selección se
> solicita **al comenzar la acción**. `action.course_enrollment_id` conserva su `NOT NULL` y no se
> debilita el esquema central. **Si no existen cursadas activas, se permite leer la pieza, pero no
> iniciar su aplicación.**

⚠️ **Leer y aplicar se separan, y el orden importa.** Pedir la materia para leer convertiría la
biblioteca en un embudo; pedirla al aplicar es el momento en que la pregunta significa algo. El
estado *"sin cursadas activas"* **no oculta la pieza**: la deja leerse y dice por qué no se puede
empezar todavía.

#### D3 · Primer año — **fuera de alcance**

> La microintervención contextual u obligatoria para primer año queda **fuera de alcance y pendiente
> de definición psicopedagógica**.

#### D4 · Los videos — **se omiten, no se simulan**

> Se autoriza construir la estructura alrededor de las cinco piezas **sin videos**, pero **no
> inventar videos ni simular que existen**.

⚠️ Es *"omitir, no inventar"* aplicado a la letra: sin guion no hay video, y **la línea desaparece**
en vez de mostrar un reproductor vacío o un *"próximamente"*.

#### D5 · Fuera de producción hasta que ella autorice

> El contenido debe mantenerse **fuera de producción** hasta que la psicopedagoga **confirme su
> vigencia y autorice su publicación**. Debe conservarse **literalmente** la fuente recibida,
> incluidos sus tipeos, conforme al precedente [ADR-031](#adr-031).

**Esto no necesita un mecanismo nuevo: es `publication_status`.** La columna que
[ADR-051](#adr-051) definió para el catálogo responde exactamente esta pregunta —*"¿esto se le puede
mostrar a un estudiante?"*— con `DRAFT` por defecto. Las cinco piezas entran `DRAFT`, y **sólo lo
`PUBLISHED` se proyecta**.

⚠️ **`publication_status` NO es `verification_status`, y no se colapsan.** La segunda sigue teniendo
una sola escritura en todo el repositorio (`corroborar_procedencia()`, `I9`). Que la autora autorice
publicar **no corrobora** su contenido, y viceversa.

⚠️ **Consecuencia que hay que mirar de frente: con `D1` la biblioteca se le muestra a todos, y con
`D5` no hay nada publicado.** Hasta que ella autorice, la pantalla existe y **está vacía**. Eso es
correcto y es lo que el owner decidió, pero el vacío tiene que **decir por qué** —`C-04`, estado
vacío elevado— y no parecer un error ni una pantalla rota.

### Lo que queda abierto después de estas decisiones

- **La confirmación de vigencia de la psicopedagoga.** Bloquea la publicación, no la construcción.
- **Los guiones de los cinco videos.** Los declara faltantes la propia autora.
- **El resto del índice** — diecisiete áreas, y sólo cinco piezas escritas.
- **El Student Model.** Cuando exista, `D1` dice que podrá personalizar *recomendaciones, orden y
  acompañamiento*; **restricciones de acceso no**, y reabrirlas sería otra decisión.

### Enmienda 1 · `CTA-021` · autorizada el 10 de septiembre de 2026

El registro canónico está **cerrado en 20 CTAs** y hay test que exige que toda CTA fuera de
`product-spec-source.md` Parte III §5 tenga un ADR `ACCEPTED` que la nombre. `D2` necesita una: el
momento en que el estudiante **empieza a aplicar** una pieza y se le pide la cursada.

**`CTA-021` · Empezar** — el owner la autoriza como parte de este ADR.

| campo | valor |
|---|---|
| **Origen** | la superficie de Formación |
| **Condición de aparición** | pieza abierta **y** al menos una cursada activa |
| **Acción solicitada** | empezar a aplicar la pieza a una materia |
| **Resultado autoritativo** | `Action` creada sobre el `CourseEnrollment` elegido, con la pieza registrada en `formative_content_id` |
| **Fallback** | permanecer en la pieza sin crear nada |
| **Estado de error** | sin cursadas activas: **la pieza se sigue leyendo** y se dice por qué no se puede empezar |

⚠️ **Aparición y habilitación son dos cosas distintas, y acá se separan a propósito.** Sin cursadas
activas la CTA **no aparece** —no hay a qué aplicarla— pero la pieza **se lee igual**, que es
literalmente lo que `D2` decidió: *"se permite leer la pieza, pero no iniciar su aplicación"*.

⚠️ **Es la tercera CTA fuera del spec**, junto a [ADR-016](#adr-016) (`CTA-019`) y
[ADR-067](#adr-067) (`CTA-020`). `product-spec-source.md` **no se edita**: la corrección vive acá.

⚠️ **`escenarios` queda vacío**, igual que `CTA-020`. El spec no tiene un `SC-` para esto porque no
preveía la superficie; **inventar uno sería fabricar trazabilidad** hacia un documento que no lo dice.

### Enmienda 2 · Las decisiones del owner, y las dos verticales · 10 de septiembre de 2026

**Estado:** `ACCEPTED` · decidida por el owner, por escrito.

#### E2.1 · Las diez reglas de la aplicación

| # | regla |
|---|---|
| 1 | El CTA de la pieza se rotula **«Aplicarlo»**. |
| 2 | **Leer una pieza no requiere seleccionar una materia.** Ratifica `D2`. |
| 3 | Al presionar «Aplicarlo», el estudiante **elige una cursada vigente**. |
| 4 | **«Vigente» = `course_enrollment.status = 'active'` + período académico actual canónico del estudiante + coincidencia de estudiante e institución.** Los tres datos ya existen: **no se crea estado, puntaje ni inferencia nueva.** |
| 5 | La aplicación **crea una `Action`** vinculada al `CourseEnrollment` elegido, y sigue por el flujo normal de `Evidence`. |
| 6 | **`action.course_enrollment_id` permanece `NOT NULL`.** |
| 7 | **Sin cursadas vigentes, la pieza se lee pero no se aplica.** |
| 8 | **No se muestran videos falsos** ni controles que aparenten reproducir contenido inexistente. Ratifica `D4`. |
| 9 | **El contenido permanece fuera de producción** hasta que la psicopedagoga confirme vigencia y autorice publicación. Ratifica `D5`. |
| 10 | **La fuente se conserva literalmente.** Una versión corregida sólo la reemplaza si **proviene de la autora** y está **expresamente aprobada**, **preservando procedencia e historial**. Extiende `D5` y el precedente [ADR-031](#adr-031). |

#### E2.2 · La aplicación convive con el ADE — no compite

- Es **secundaria**: no reemplaza, cancela, reordena ni bloquea la acción principal del motor.
- **No crea `action_recommendation`**, no usa `is_primary`, y **nunca se registra como recomendación del motor**.
- **`UX01` sigue mostrando como acción principal la que determina el ADE.**
- Se muestra dentro de Formación y en lugares secundarios compatibles; **no compite por la posición principal de `HOY`**.
- **La separación se resuelve en dominio y backend.** El frontend no decide prioridad.
- **Máximo una aplicación viva por estudiante**, además de la del ADE; si ya existe, el sistema **lleva a continuarla**.
- **`CTA-021` es idempotente**: los reintentos nunca duplican.

⚠️ **Consecuencia obligatoria sobre el motor, para cuando V2 se construya.**
`materializar_recomendacion()` se niega hoy a crear si existe *cualquier* acción viva para la
cursada. Sin acotar ese guard, aplicar una pieza **impediría al ADE emitir la acción del día** de esa
materia. Corregirlo, y filtrar la lectura de `HOY`, **forma parte de esta decisión**.

#### E2.3 · La elegibilidad es de la aplicación, nunca de la lectura

⚠️ **La biblioteca no se oculta ni se condiciona por las cursadas.** `D2` es literal, y un estudiante
sin ninguna cursada vigente **ve la biblioteca completa**. La regla de vigencia describe **qué
cursadas se ofrecen al aplicar**, y se evalúa **al aplicar**.

En consecuencia `biblioteca_de_formacion()` **no devuelve cursadas**. Lo que había —una lista sin
filtro alguno, pese a que su comentario declaraba *«cursadas activas»*— **no se corrigió: se retiró**.
Como la migración era **inédita**, se editó en su archivo: **no se apila una migración correctiva
sobre una migración que nunca se aplicó.**

#### E2.4 · Las dos verticales

**V1 · Biblioteca de solo lectura — es lo que está construido.** No modifica `action`, **no agrega
`action.formative_content_id` ni `origin`**, **no registra `CTA-021`**, no muestra botón ni selector,
y **no exige cursadas para leer**. El registro canónico sigue en **20 CTAs**; las rutas son **once** y
las superficies **nueve**.

**V2 · Aplicación — diferida.** Incorpora `origin`, el vínculo con la pieza, la selección de cursada,
la creación de `Action`, la API, `CTA-021`, `Evidence` y sus invariantes.

⛔ **`CTA-021` no entra al registro hasta que exista su escritura.** Un `resultadoAutoritativo` que
promete *«Action creada sobre el CourseEnrollment elegido»* sobre un camino inexistente es un
contrato incumplido, y **documentar el incumplimiento no lo repara**. Hay guard.

#### E2.5 · Qué impide publicar contenido no aprobado

Cuatro mecanismos independientes, y **ninguno depende de que alguien se acuerde**:

1. **`publication_status NOT NULL DEFAULT 'DRAFT'`** con `CHECK`: toda pieza nace `DRAFT`.
2. **`CONSTRAINT formacion_publicada_con_fecha`**: no se publica sin dejar fecha.
3. **RLS activo y sin ninguna política**: `formative_content` es inalcanzable por PostgREST para
   `anon` y `authenticated` — **nadie llega a la tabla**, ni siquiera a las `DRAFT`.
4. **`biblioteca_de_formacion()` filtra `PUBLISHED` en la base**, con `REVOKE ALL FROM PUBLIC, anon`.
   El filtro **no vive en la proyección**, donde un `if` podría perderse.

Y **el cargador no puede publicar**: no escribe `publication_status` ni en un `set` ni en la lista de
columnas del `insert`, con guard que lo verifica. **Publicar es un acto de la autora.**

#### E2.6 · Clasificación

La implementación existente es **incompleta, no no-autorizada**: se escribió con autorización del
owner, después de que el ADR incorporara D1–D5. **Será funcional cuando `CTA-021` realice la
escritura y tenga pruebas.**

---

<a id="adr-088"></a>

## ADR-088 — El espacio de trabajo: los objetos abiertos, y ADR-019 queda `SUPERSEDED`

**Estado:** `ACCEPTED` · 10 sep 2026 · **decidido por el owner, por escrito, con ADR-019 delante**
**Toca:** `design-system-capturas.md` §7.4 · §10.1 · §11.3 · §12.8, `roadmap.md`, `tests/ausencia.test.tsx`, `tests/track-a-rules.test.ts`
**Reemplaza:** [ADR-019](#adr-019), que descartó el dock inferior **y no se equivocaba cuando lo escribió**.

### Contexto

[ADR-019](#adr-019) descartó el dock el 30 de agosto de 2026 con un argumento que **no era estético
sino estructural**, y que conviene citar entero antes de tocarlo:

> **Dónde no:** productos de tarea única, **flujos lineales**, o cualquier cosa que se use
> mayoritariamente en móvil. Ahí el dock es puro costo.

Y la premisa con la que se aplicó:

> **Achieve es exactamente el caso que el manual excluye:** un flujo lineal (`UX01`→`UX09`) de una
> decisión por pantalla (`DD9`). **No tiene dos objetos abiertos a la vez porque su unidad de trabajo
> es una `Action`.**

**Esa premisa dejó de ser cierta, y se puede fechar.** Entre el 8 y el 9 de septiembre de 2026 el
producto dejó de ser nueve pantallas encadenadas:

| Qué cambió | Dónde |
|---|---|
| El área «Materias» existe: **51 cursadas** listadas a la vez | [ADR-077](#adr-077) |
| Las 51 materias del Plan 2016 **tienen contenido**: unidades, calendario, evaluación y material | [ADR-086](#adr-086) |
| `UX02` se rearmó alrededor del **Gantt por tema**: la unidad es un objeto navegable | [ADR-085](#adr-085) |
| La Bitácora **es de una materia**, no del estudiante | [ADR-082](#adr-082) |
| `CTA-001` y `CTA-009` **transportan la cursada**: dos CTAs con parámetro | [ADR-054](#adr-054), [ADR-082](#adr-082) |

La unidad de trabajo **ya no es una `Action`**. Un estudiante con cinco materias en curso tiene
abiertos, a la vez, una unidad de Análisis, el TP2 de Computación Gráfica y la evaluación de Historia
Económica. ADR-019 acertó al decir que *un producto sin dos objetos abiertos no necesita dock*; lo
que cambió es que **ahora los tiene**.

⚠️ **Lo que ADR-019 dijo y sigue valiendo, y no se toca:** el breadcrumb no se reemplaza. Las dos
preguntas son distintas y por eso conviven — *"¿dónde estoy?"* la contesta la miga, *"¿qué tengo
abierto y quiero retomar?"* la contesta el espacio de trabajo. Un espacio que además dijera dónde
estás sería la segunda lista de destinos que ADR-019 temía, con razón.

### Decisión

**1. Se construye el espacio de trabajo.** No es un dock y no se llama dock: es **el espacio de
trabajo**, y lo que contiene son **objetos abiertos**. Un concepto, una palabra (`AGENTS.md` §4).
`ficha`, `pestaña`, `tab` y `dock` **no entran al vocabulario**.

**2. Los seis requisitos innegociables del multiventana se cumplen los seis.** El manual cierra la
sección con *"si no podés cumplirlo, **no lo hagas**"*, así que la lista no es una guía: es la
condición de la decisión.

| # | Requisito del manual | Cómo se cumple |
|---|---|---|
| 1 | **URL por ficha** | Cada objeto abierto lleva su `ruta`, que es la misma del registro de CTAs. Activar un objeto **navega**; no hay estado que viva sólo en el espacio |
| 2 | **Botón Atrás definido** | La navegación es `router.push`: atrás y adelante del navegador recorren el historial real. El espacio **no intercepta** la history API |
| 3 | **Trampa de foco y orden de tabulación** | `role="tablist"` con navegación por flechas, `Home`/`End`, y `Delete` para cerrar. El foco nunca queda huérfano al cerrar |
| 4 | **Jerarquía de `Escape` con dos capas** | `Escape` cierra primero el menú de desbordamiento o la hoja móvil; con nada abierto **no hace nada**. Nunca cierra un objeto: cerrar es destructivo y no se hace con una tecla de escape |
| 5 | **Comportamiento del dock a escala** | Se muestran hasta **5**; el resto va a un menú de desbordamiento con su contador. **Nunca se comprimen las etiquetas hasta ser ilegibles** — que es el anti-patrón `A-07`, y es el motivo de este renglón |
| 6 | **Límite duro de objetos abiertos** | **12.** Al abrir el decimotercero se cierra **el menos visitado**, y la pantalla lo dice |

⚠️ **El requisito 6 se cumple aunque el pedido decía «no hay un límite rígido».** El manual lo llama
innegociable y ADR-019 lo citó como parte de la razón para descartar el dock: construirlo salteándose
justo el renglón que lo hacía caro sería quedarse con el costo y tirar la mitigación. **El límite se
elige alto —12— para que nadie lo toque en un día normal**, y cuando actúa **se dice**: un objeto que
desaparece en silencio es peor que no tenerlo.

**3. `A-07` no se reproduce, y por eso el límite visible es 5.** El anti-patrón catalogado no es *"el
dock existe"*: es *"el dock ya trunca títulos con dos elementos abiertos"*. Cinco objetos a ancho
legible con desbordamiento explícito es la corrección del defecto, no su copia.

**4. La persistencia local se autoriza, y sólo para esto.** El guard de *cero persistencia*
(`tests/track-a-rules.test.ts`) **se relaja del mismo modo en que se relajó el de red en la B1.6**:
nombrando el único módulo que puede usarla, y dejando prohibido todo el resto.

| | |
|---|---|
| **Único módulo autorizado** | `lib/client/espacio-de-trabajo/persistencia.ts` |
| **Clave** | `achieve.espacio-de-trabajo.v1.<studentId>` — versionada y **aislada por estudiante** |
| **Qué se guarda** | `kind`, `entityId`, `label`, `secondaryLabel`, `ruta`, y dos instantes |
| **Qué NO se guarda** | Evidencia, reflexiones, mensajes humanos, nombres de personas, **nada de otro estudiante** |
| **Cambio de identidad** | Otro `studentId` es **otro namespace**. Cerrar sesión **borra** |
| **Dato corrupto** | Se descarta entero y se arranca vacío. **Nunca rompe la aplicación** |

⚠️ **Una etiqueta guardada no es una autorización.** El backend sigue decidiendo el acceso a cada
entidad: si el objeto ya no existe o el estudiante lo perdió, la ruta contesta lo que contestaba y el
objeto se puede cerrar. **El espacio no es una caché de dominio.**

**5. Los guards no se borran: se reescriben contra esta decisión.** ADR-019 §3 dijo *"una regla sin
test se pierde en dos meses"*, y eso vale igual para la regla nueva. El `describe` de
`tests/ausencia.test.tsx` que prohibía el dock pasa a verificar **los seis requisitos**.

### Consecuencias

- [ADR-019](#adr-019) queda `SUPERSEDED`. **Su punto 2 sobrevive entero:** el breadcrumb no se
  reemplaza, y el espacio de trabajo **no es navegación**.
- `design-system-capturas.md` §7.4, §10.1, §11.3 y §12.8 se actualizan: el descarte se conserva
  **con su fecha y su razón**, y se anota qué premisa caducó. **No se borra el registro** — un
  documento que borra por qué dijo que no se equivoca dos veces.
- El anti-patrón `A-07` **sigue en la lista de §11.2**. No se sacó: se dice cómo se evita.
- **Ninguna superficie nueva y ninguna CTA nueva.** El espacio de trabajo no entra a `surfaces.ts` ni
  a `cta-registry.ts`: no solicita una acción de dominio, no muta nada y no crea entidades. Es
  orientación, como la navegación lateral — el mismo motivo por el que el menú tampoco está en el
  registro.
- **La regla de una sola CTA primaria por pantalla (`I-06`) no se toca.** El espacio no tiene CTA.

---

<a id="adr-088-enmienda-1"></a>

### ADR-088 · Enmienda 1 — la ventana interna

**Estado:** `ACCEPTED` · 10 sep 2026 · **pedida por el owner con las capturas delante** —
⚠️ **enmendada en sus puntos 1, 2, 3 y 4 por la [Enmienda 3](#adr-088-enmienda-3)**, que separó
*abrir un objeto* de *desplegar su ventana* y pasó de una ventana a varias.

#### Contexto

La primera versión hacía que tocar una ficha **navegara**. Consultar en qué anda
Álgebra costaba perder la pantalla en la que estabas y volver — que es la mitad del trabajo que un
espacio de trabajo existe para ahorrar.

El software de `docs/diseño/` lo resuelve con una **ventana interna**: la ficha del pie despliega el
objeto encima de la pantalla actual, con barra de título, minimizar y cerrar. El owner pidió
exactamente eso: *"minimizar o abrir totalmente cuando tocás abajo en la barra de pestañas"*.

⚠️ **Esto es «multiventana», la palabra que [ADR-019](#adr-019) usó para descartarlo.** No se entra
por la puerta de atrás: se cumplen los seis requisitos, y **tres de ellos recién ahora se ejercitan
de verdad**.

#### Decisión

**1. Tocar una ficha despliega el panel; volver a tocarla lo minimiza.** El gesto es uno solo.

⚠️ **La [Enmienda 3](#adr-088-enmienda-3) mantiene este gesto pero le saca `abrir`:** entrar a una
materia desde el índice o el mapa **va a su superficie completa**, y la ventana chica es lo que se
elige después. Y desplegar una ficha **no baja las otras**.

**2. El panel vive en la URL** — `?abierto=<clave>` sobre la ruta actual. Es el requisito 1
(*URL por ficha*) y no es ceremonia: hace que el panel se pueda compartir, que **el botón atrás lo
cierre** y que recargar lo reponga. Una clave que no corresponde a un objeto abierto **se ignora**:
no existe la ventana huérfana.

**3. Trampa de foco y `Escape` con dos capas** — requisitos 3 y 4. `Tab` circula adentro; al cerrarse
el foco vuelve a donde estaba. `Escape` cierra primero un menú abierto y sólo después minimiza:
**nunca cierra el objeto**, porque cerrar es destructivo y no se hace con una tecla de escape.

⚠️ **La trampa de foco y el `aria-modal` los retira la [Enmienda 3](#adr-088-enmienda-3), con su
razón**: eran correctos con **una** ventana modal y, con varias no modales, encerrarían al teclado en
la última que se abrió. Lo que se conserva es devolver el foco a donde estaba, y que `Escape` minimice
**la ventana que tiene el foco** y nunca cierre el objeto.

**4. Minimizar y cerrar son dos cosas, y por eso son dos botones.** Minimizar guarda el panel y
**deja el objeto en la barra**; cerrar saca el objeto. Tocar afuera minimiza. Dos controles que
hicieran lo mismo serían ruido.

⚠️ **El *«tocar afuera minimiza»* también lo retira la [Enmienda 3](#adr-088-enmienda-3):** con varias
ventanas, el afuera es la pantalla que seguís usando, y cada clic en `Hoy` bajaría el escritorio
entero. La distinción entre minimizar y cerrar **no se toca**, y con la Enmienda 3 se dice con dos
controles del semáforo.

**5. ⚠️ El panel consulta; la superficie trabaja.** Adentro **no hay CTA de dominio**:
comprometerse, empezar y entregar tienen su precedencia y su CTA única en `UX02`–`UX05` (`I-06`), y
duplicarlas acá serían dos lugares donde se decide lo mismo. *«Ver como página»* es el camino a la
superficie.

Es la misma distinción que la fuente hace en su propia ficha —*"se listan para consultarlas:
renovar, triagear y editar el legajo se hacen en la cartera, que sigue siendo la única superficie de
trabajo"*—. Se toma **el mecanismo**, nunca su dominio: ni sus marcas, ni sus expedientes, ni sus
clientes (`AGENTS.md` §1.5).

**6. Un tipo sin vista propia lo dice.** Hoy sólo `materia` se despliega. El resto muestra que
todavía no se puede ver ahí y ofrece abrirlo como página: *omitir, no inventar* (§2.7), nunca caer a
una pantalla parecida.

#### Consecuencias

- El objeto activo pasa a ser **el del panel** cuando hay panel. Es lo que el estudiante está
  mirando; si mandara la ruta, la barra marcaría como activo algo que quedó atrás de la ventana.
- Cerrar el objeto del panel **se lleva el panel** y pasa al vecino, sin sacar al estudiante de la
  pantalla en la que estaba. ⚠️ **La [Enmienda 3](#adr-088-enmienda-3) saca el «pasa al vecino»**: con
  varias ventanas, abrir una que el estudiante no pidió encima de las que ya tenía es un escritorio
  que se reordena solo.
- **Ninguna superficie nueva, ninguna CTA nueva, ningún contrato de backend nuevo.** El panel relee
  `GET /api/materia`, la misma lectura de `UX02`.

---

<a id="adr-088-enmienda-2"></a>

### ADR-088 · Enmienda 2 — el panel se maneja como una ventana

**Estado:** `ACCEPTED` · 10 sep 2026 · **pedida por el owner**

#### Contexto

La Enmienda 1 dejó el panel centrado y de tamaño fijo. El owner pidió que se comporte como una
ventana de escritorio: *"que podés mover dentro del desktop a donde quieras, pero si lo minimizás,
queda donde estaba antes, y podés expandirlo o minimizarlo, y podés hacer que ocupe parte de la
pantalla"*.

#### Decisión

**1. Cada objeto recuerda su marco.** Se arrastra de la barra de título, se redimensiona de sus ocho
bordes y se expande. Minimizar y volver a abrir lo devuelve **al mismo lugar y al mismo tamaño**.

**2. ⚠️ Se llama «marco», no «ventana».** `Ventana` ya está tomada **dos veces** en este dominio: la
ventana de preparación de [ADR-078](#adr-078) —días de calendario hasta la evaluación— y
`VentanaDeExamen`. Reusar la palabra haría que *"la ventana de Álgebra es corta"* tuviera dos
significados incompatibles: es el anti-patrón `A-04`, deriva de vocabulario (`AGENTS.md` §4).

**3. La aritmética es dominio puro**, en `lib/domain/marco-de-panel.ts`. Topar contra los bordes,
respetar el mínimo, mover el origen al tirar del borde izquierdo y restaurar al tamaño previo son
**reglas**; probarlas con un mouse de mentira sería probar el doble. El componente sólo traduce
eventos de puntero a deltas.

**4. El marco se guarda al soltar, no en cada `pointermove`.** Escribir en el estado compartido
sesenta veces por segundo volvería a renderizar la barra y el contenido de `UX02` en cada píxel del
arrastre.

**5. ⚠️ Se reencuadra contra la pantalla de ahora, siempre.** Un marco guardado en un monitor grande
y restaurado en una laptop nacería **medio fuera de la pantalla, con su barra de título
inalcanzable**, y no habría forma de recuperarlo: no se puede arrastrar lo que no se puede agarrar.
Es el caso que rompe un manejo de ventanas casero, y tiene test.

**6. A menos de 768 px no hay ventana que manejar.** El panel ocupa la pantalla. Arrastrar y estirar
un rectángulo en un teléfono no es una función: es una forma de perderlo detrás del borde.

**7. La geometría entra a la memoria local, y no obliga a versionar la clave.** Es un campo nuevo y
opcional: lo guardado antes de esta enmienda se sigue leyendo, y un marco corrupto **pierde la
posición, no el atajo**. Sigue sin guardarse nada que no sea geometría — sólo números y un booleano,
y hay test que lo comprueba campo por campo.

#### Consecuencias

- `ObjetoAbierto` gana `marco`. `null` ⇒ **nunca se abrió**, y nace en cascada: una ventana nueva en
  el origen encima de otra es indistinguible de una que el estudiante puso ahí.
- **Mover una ventana no cuenta como visitarla.** Si contara, arrastrar la de Álgebra la salvaría del
  desalojo por encima de una que el estudiante realmente estuvo mirando.
- Los ocho agarres son `aria-hidden`: redimensionar con el teclado **no es una función que exista
  acá**, y anunciar ocho controles inutilizables sin mouse es peor que no anunciarlos. Expandir,
  minimizar, cerrar y `Escape` **sí** funcionan sin mouse.

---

<a id="adr-088-enmienda-3"></a>

### ADR-088 · Enmienda 3 — el escritorio: primero la materia, después las ventanas

**Estado:** `ACCEPTED` · 10 sep 2026 · **pedida por el owner con la pantalla delante**

#### Contexto

La Enmienda 1 hizo que **abrir una materia desplegara una ventana chica** encima de la pantalla
actual, y la Enmienda 2 le dio manejo de ventana. Las dos resolvían un problema real —consultar en
qué anda Álgebra no debería costar perder `Hoy`—, pero al mirarlo funcionando aparecieron dos cosas
que no cerraban, y el owner las nombró en una sola frase:

> *"ahora mismo cuando abrís una materia se abre el cuadro ese que está conectado con la barra de
> pestañas, primero quiero que se abra la materia normal, luego se puede minimizar con un botón
> arriba, al estilo mac, luego, cuando abrís dos o tres de esos cuadros de la barra de pestañas
> deberían existir todos, y poder acomodarlos, como una mac"*

Son **dos defectos distintos**, y conviene separarlos porque se arreglan en lugares distintos:

1. **El orden estaba invertido.** Entrar a una materia es ir a trabajar en ella: `UX02` es la
   superficie donde se ve el Gantt por tema, se activa Modo Examen y se avanza. La Enmienda 1 la
   metía en un rectángulo de 1080×760 **desde el primer gesto**, y para llegar a la pantalla entera
   había que apretar *«Ver como página»*. La ventana chica es para consultar: es el **segundo** paso,
   no el primero.
2. **Había una sola ventana, y eso no es un escritorio.** Desplegar la segunda ficha bajaba la
   primera. Todo el argumento de ADR-088 —*"un estudiante con cinco materias tiene abiertos, a la
   vez, una unidad de Análisis, el TP2 de Computación Gráfica y la evaluación de Historia
   Económica"*— pedía que existieran **a la vez**, y la implementación lo contradecía.

#### Decisión

**1. Abrir un objeto lleva a su superficie completa.** `abrir` vuelve a hacer `router.push` a la
`ruta` del objeto, como antes de la Enmienda 1. Lo que la Enmienda 1 agregó y **se conserva** es que
el objeto quede en la barra para volver.

**2. La superficie tiene su barra de título, y ahí está el botón de minimizar.** Cuando la pantalla
que estás mirando **es la de un objeto abierto**, arriba de la columna aparece su semáforo:

| Control | Qué hace |
|---|---|
| **Cerrar** | Saca el objeto de la barra y vuelve a la pantalla de la que salió |
| **Minimizar** | **El objeto queda en la barra** y la pantalla vuelve de donde vino. No se cierra nada |
| **Reducir** | La convierte en una ventana sobre la pantalla de la que salió |

⚠️ **El tercero reduce, no expande, y no es un detalle de copy.** La materia a pantalla completa **ya
está expandida**: un botón de expandir ahí sería un control muerto (`P-07`). Es la misma razón por la
que en un escritorio el botón verde de una ventana en pantalla completa la saca de pantalla completa.

⚠️ **De dónde vino es estado de sesión y NO se persiste**, a diferencia del marco. El marco es *cómo
quedó la ventana* —algo que el estudiante eligió y espera encontrar mañana—; de dónde vino es *qué
estaba haciendo hace un minuto*, y reponerlo de una sesión anterior mandaría a alguien a una pantalla
que dejó ayer. Sin origen se vuelve a `Hoy`, que es la única pantalla que nunca es un callejón.

⚠️ **El semáforo aparece sólo si el objeto está abierto**, y eso es correcto: *estar en una pantalla
no es tener su objeto abierto* es la regla de `sincronizarConRuta` desde ADR-088 §2. Llegar pegando
la URL a mano no dibuja el semáforo — y ahí tampoco habría «de dónde volver».

**3. Todas las ventanas existen a la vez, y se apilan.** Desplegar una ficha **no baja las otras**.
Tocar una ventana la sube al frente; `Escape` baja **la que tiene el foco**, no el escritorio.

**4. El escritorio entero vive en la URL** — `?abierto=<a>,<b>,<c>`, y **el orden de la lista es el
apilamiento**. Es el requisito 1 ejercitado más fuerte que antes: se comparte el link con las tres
ventanas puestas y en su orden, el botón atrás deshace el último gesto y recargar repone todo.

⚠️ **Traer una ventana al frente usa `replace`, no `push`.** Tocar tres ventanas por turno son tres
entradas de historial que no llevan a ninguna parte: el botón atrás tendría que apretarse quince
veces para salir de una pantalla. **Cambiar el apilamiento no es navegar.**

⚠️ **Una coma, no un parámetro repetido.** `?abierto=a&abierto=b` obligaría a `getAll` en la lectura
y a cuidar el orden de los repetidos, que nadie garantiza. Con una clave y una lista, **el orden es
el dato**.

**5. Se retira el fondo oscurecido y el «tocar afuera minimiza».** Los dos eran correctos con una
ventana modal y son un defecto con tres: el escritorio se apagaría entero apenas tocás la pantalla de
atrás, que es exactamente lo que tener tres ventanas viene a permitir.

**6. ⚠️ Se retira la trampa de foco de la Enmienda 1 §3, y hay que decir por qué.** Atrapar el `Tab`
adentro del panel **correspondía** cuando era una ventana modal, sola y con su fondo. Con varias
ventanas no modales, mantenerla dejaría al teclado **encerrado en la última que se abrió**, sin forma
de llegar ni a las otras ventanas ni a la barra: sería un defecto de accesibilidad, no una garantía.
Por lo mismo se saca `aria-modal` — anunciar como modal algo que no lo es le dice al lector de
pantalla que el resto de la página no existe, cuando el resto de la página es lo que se sigue usando.

**Lo que sí se conserva de ese punto es la otra mitad, que es la que importa:** el foco entra a la
ventana al abrirse y **vuelve a donde estaba** al bajarla. Y sólo vuelve si quedó sin dueño: con
varias ventanas, bajar la de atrás no puede arrancarte el foco de la de adelante.

**7. No se agrega un segundo límite duro.** Nunca puede haber más ventanas que objetos abiertos, así
que el techo de **12** del requisito 6 ya está puesto. Un número nuevo para las ventanas sería una
regla inventada (`CLAUDE.md`, regla 1).

**8. La barra dice cuáles están desplegadas.** Un punto en la ficha ⇒ tiene ventana abierta; el fondo
⇒ es la de adelante. **Son dos hechos distintos y se dicen con dos señales distintas**: con tres
desplegadas, un solo tratamiento para las dos cosas deja sin decir cuál te va a contestar el
`Escape`.

**9. A menos de 768 px se dibuja sólo la ventana de adelante, a pantalla completa.** Tres rectángulos
apilados en un teléfono no son tres ventanas: son una tapando a dos que no se pueden agarrar.

**10. El semáforo no usa los colores semánticos, ni los de ningún otro sistema operativo.** Achieve
tiene tres colores y **los tres significan algo del dominio**: `--exito-fill` en un botón de expandir
diría *"esto salió bien"* sobre un control de cromo, que es `A-04` por el eje del color. Y los
colores literales de otro producto tampoco entran: de una fuente se toma **el mecanismo**, nunca su
marca (`AGENTS.md` §1.5). Lo que hace que se lean como controles de ventana es **la forma, el tamaño,
el orden y el lugar**.

⚠️ **Y llevan su glifo puesto, no al pasar el mouse.** Un control que sólo dice qué hace cuando ya lo
estás por apretar es `P-05` al revés. Con tres círculos mudos, cerrar y minimizar se distinguen por
la posición — y equivocarse cierra el objeto.

#### Consecuencias

- **Cerrar el objeto de una ventana se lleva su ventana y no abre otra.** La Enmienda 1 desplegaba la
  del vecino, porque era eso o dejar la pantalla sin nada. Con varias, abrir una ventana que el
  estudiante no pidió **encima de las que ya tenía** es un escritorio que se reordena solo. §10.7
  sigue cumplido: la pantalla actual nunca queda rota.
- *«Ver como página»* **se lleva su propia ventana**. Dejarla desplegada encima de su propia
  superficie sería la misma materia dos veces en la misma pantalla, una tapando a la otra.
- **El apilamiento se cuenta desde 1 adentro de su contenedor**, no como `40 + i`: con la suma, la
  undécima ventana pasaría por encima de la barra de objetos y volvería el defecto de la Enmienda 1
  —la barra visible y no clickeable—. Hay guard.
- **Los controles se nombran con el objeto** (*«Minimizar: Álgebra»*). Con una sola ventana
  *«Minimizar»* alcanzaba; con tres, tres controles con el mismo nombre no le dicen nada a nadie.
- **Ninguna superficie nueva, ninguna CTA nueva, ningún contrato de backend nuevo.** Las ventanas
  releen `GET /api/materia`, la misma lectura de `UX02`. El registro sigue en **20 CTAs** y las nueve
  superficies siguen siendo nueve.
- [ADR-019](#adr-019) §2 sigue vigente: **el breadcrumb no se reemplaza.** La barra de título de la
  superficie dice *qué objeto es esta ventana y qué podés hacer con ella*; la miga sigue diciendo
  dónde estás, en la topbar.

#### Cómo se verifica

`tests/espacio-de-trabajo.test.ts` — la lista de la URL en orden, una clave inventada entre dos
válidas que no se lleva puestas a las válidas, sin repetidos, y las tres operaciones de apilamiento.
`tests/panel-de-objeto.test.tsx` — tres claves dan tres ventanas, minimizar una baja sólo ésa, tocar
afuera no baja nada, `Tab` no queda atrapado, y los cuatro gestos de la barra de título de la
superficie. `tests/barra-de-objetos.test.tsx` — desplegar no baja las que ya estaban, y el activo es
la de adelante. `tests/ausencia.test.tsx` — sin `aria-modal`, sin fondo, sin segundo límite duro, y
el apilamiento relativo al contenedor.

---

<a id="adr-088-enmienda-4"></a>

### ADR-088 · Enmienda 4 — el movimiento: la ventana sale de su ficha

**Estado:** `ACCEPTED` · 11 sep 2026 · **pedida por el owner**

#### Contexto

La Enmienda 3 dejó el escritorio funcionando: varias ventanas, apiladas, que se bajan a la barra y se
vuelven a subir. Lo que quedó sin contestar es **de dónde sale cada una**. Tocar una ficha hacía
aparecer una ventana de 940×660 en el lugar, sin relación visible con el control que se había tocado.
El owner lo pidió así:

> *"cuando apreté una de las cosas abiertas en la barra de tareas, se abra al estilo de como se abre
> una app en mac, cuando tocás en la barra de tareas, esa animación"*

No es decoración. Con tres ventanas abiertas y cinco fichas en la barra, *"¿cuál de las fichas abrió
esta ventana?"* es una pregunta real, y hoy se contesta leyendo el título. El movimiento la contesta
**sin texto y sin tiempo**.

#### Decisión

**1. La ventana sale de su ficha y vuelve a entrar.** Al desplegarla, crece desde el rectángulo exacto
de su ficha hasta su marco. Al minimizarla, hace el recorrido inverso. Es el efecto de escala de un
escritorio.

**2. La aritmética es dominio puro**, en `desdeLaFicha()` de `lib/domain/marco-de-panel.ts` — el mismo
criterio que la Enmienda 2 aplicó al marco. Que la ventana salga **exactamente** de su ficha es una
multiplicación y una resta; verificarlo moviendo un mouse de mentira probaría el doble y no diría si
el número está bien.

**3. Los números salen de `design-system-capturas.md` §2.5**, no de la intuición: `200 ms` y
`cubic-bezier(.34, 1.56, .64, 1)`. *"Nunca `ease` de 400 ms."*

⚠️ **Están escritos en `components/shell/movimiento.ts` porque §2.5 nunca se tokenizó.** El documento
especifica `--curva` y `--duracion`; `app/globals.css` no los tiene, y ese archivo **no se reescribe**
(regla 6 de `CLAUDE.md`). Se citan con su fuente en vez de inventarse, y el día que los tokens existan
esto es un `var()` y nada más. **Queda anotado como deuda de tokens.**

**4. ⚠️ `prefers-reduced-motion` lo apaga entero, y no es opcional.** §2.5 cierra con *"la pantalla
debe funcionar entera con `prefers-reduced-motion`"*. Para quien pidió menos movimiento, una ventana
que se dispara desde el pie de la pantalla no es una ayuda de orientación: **es exactamente el gesto
que tiene desactivado**. Sin animación la ventana aparece puesta —el comportamiento de la Enmienda 3,
que funciona— y **minimizar no espera nada**: esperar 200 ms de nada sería peor que no animar.

**5. ⚠️ Primero se guarda en la ficha, DESPUÉS se minimiza — y se midió al revés.** La primera versión
minimizaba y **retenía la ventana desmontada** para animarle la salida. React alcanzaba a sacarla del
árbol en el frame del medio y a volver a montarla, así que lo que se veía era una ventana nueva
desvaneciéndose en el lugar. Muestreando el `transform` cada 28 ms en el navegador, **la escala no se
movía de `1`**.

Invirtiendo el orden no hay nada que retener: la URL todavía no cambió, así que la ventana sigue
montada, se encoge, y **al terminar** se minimiza de verdad. Se borró toda la maquinaria de retención.

**6. Las dos puntas se encuentran por el DOM, y ninguna conoce a la otra.** La ficha lleva
`data-objeto`; la ventana, `data-ventana`. La ventana necesita **medir** dónde quedó su ficha —el
reparto entre visibles y desbordadas, el ancho de la columna y la barra lateral colapsada la mueven— y
la barra necesita animar la ventana antes de minimizarla, porque **tocar una ficha desplegada la baja**
y ese gesto nace en la barra. Publicar coordenadas en el estado compartido sería publicar coordenadas
viejas apenas alguien colapse la barra lateral.

⚠️ **Minimizar desde la ficha y desde el semáforo son el mismo gesto**, así que se ven igual. Si la
barra minimizara en seco, el mismo gesto tendría dos movimientos según dónde lo hicieras.

**7. Sin ficha a la vista no hay animación, y está bien.** Con seis objetos abiertos, el sexto vive en
el menú de desbordamiento y su ficha **no existe en el DOM**. Ahí la ventana aparece puesta en vez de
salir disparada desde una coordenada inventada.

#### Lo que no es obvio, y rompe callado

| | Por qué |
|---|---|
| **`transform-origin: 0 0`** | Con el origen al centro —el que trae el navegador— el `translate` tendría que compensar media escala por eje. El error **no se ve como error**: se ve como una ventana que sale de un lugar cercano y equivocado |
| **La escala es distinta en cada eje** | Una ficha es mucho más ancha que alta. Una escala uniforme haría que la ventana saliera de un cuadrado que no está en ninguna parte |
| **Nunca escala cero** | Una ficha todavía sin maquetar mide `0`, y una escala `0` es una matriz sin inversa: el navegador no puede calcular los fotogramas intermedios y se ve un parpadeo |
| **`fill: "backwards"` al entrar** | Toma el primer fotograma antes de arrancar. Con `"both"`, el `transform` queda puesto al terminar y cualquier cosa `fixed` de adentro pasa a medirse contra la ventana |
| **`fill: "forwards"` al salir** | La ventana tiene que **quedarse chica** hasta que la saquen del árbol. Sin eso, el último fotograma la devuelve a tamaño completo y se ve un destello |
| **`oncancel` además de `onfinish`** | Una animación cancelada sin `oncancel` **nunca minimizaría**, y la ficha quedaría marcada como desplegada sobre una ventana que ya no está |
| **La caja se mide del DOM, no del `Marco`** | A menos de 768 px la ventana se dibuja con un `inset`, no con el marco: el marco diría una cosa y la caja mide otra |

#### Consecuencias

- **Cerrar no anima hacia la ficha, y es una distinción del producto.** Sólo minimizar se guarda en la
  barra; cerrar saca el objeto, y meter la ventana en una ficha que ya no existe sería **mentir sobre
  dónde quedó**. Lo mismo *«Ver como página»*: no bajó a la barra, se abrió entera.
- **Ninguna superficie nueva, ninguna CTA nueva, ningún contrato de backend nuevo.** Es movimiento
  sobre lo que la Enmienda 3 ya construyó.
- **Nada del escritorio depende del movimiento.** Con `prefers-reduced-motion` el producto se comporta
  exactamente como antes de esta enmienda.

#### Cómo se verifica

`tests/marco-de-panel.test.ts` — la transformación superpone la ventana sobre la ficha exactamente,
cada eje lleva la escala de su lado, y ni una ficha sin medir ni un marco vacío producen escala cero o
`NaN`. `tests/ausencia.test.tsx` — la aritmética vive en el dominio, `prefers-reduced-motion` apaga el
efecto, la duración cae en el rango de §2.5, el origen es `0 0`, minimizar anima **antes** de tocar el
estado, y `oncancel` está.

⚠️ **Y se midió en el navegador**, que es lo único que prueba que se ve bien: muestreando el
`transform` cada 28 ms, la apertura arranca en `matrix(0.2, 0, 0, 0.0667, 611.5, 817)` —la ficha
exacta—, sobrepasa a `1.078` y suelta el `transform`; el minimizado termina en `matrix(0.2001, 0, 0,
0.0668, 611.4, 816.8)`, la misma ficha. Con `reducedMotion: "reduce"` no hay `transform` en ningún
fotograma.

---

<a id="adr-088-enmienda-5"></a>

### ADR-088 · Enmienda 5 — el nombre y el color de un objeto

**Estado:** `ACCEPTED` · 11 sep 2026 · **pedida por el owner con la pantalla delante**

#### Contexto

Con el escritorio funcionando, el owner miró una materia de la UCC abierta y señaló tres cosas:

> *"No me gusta que salga en mayúscula la de arriba, me gustaría que solo la primera letra, dsp la
> segunda vez que aparece el nombre borralo, tipo la vez del medio, y quiero que se mantenga los
> colores de la lista de materias con cada materia, algo así como para diferenciar los cuadrantes"*

Las tres son del mismo problema: **el nombre del objeto pesa demasiado y no distingue nada**.
`ARQUITECTURA COMPUTADORAS` aparecía **tres veces en los primeros 250 px** de la pantalla —la miga, la
barra de título de la superficie y el eyebrow de `UX02`—, en mayúsculas las tres, y con dos ventanas
abiertas del mismo blanco no había forma de saber cuál era cuál sin leerlas.

#### Decisión

**1. El nombre se escribe con mayúscula sólo en la primera letra.** `ARQUITECTURA COMPUTADORAS` se
dibuja *Arquitectura computadoras*. Aplica a la miga, a las fichas de la barra y a los títulos de las
ventanas — **todo el cromo del espacio de trabajo**.

**2. ⚠️ Es una traducción de presentación, NO un renombre.** Es el precedente literal de «UCC
Sistemas»: `academic_program.name` conserva `INGENIERIA DE SISTEMAS` y lo que cambia es lo que ve el
estudiante. `curriculum_requirement.label` **no se toca, no se migra y no se normaliza**. Si alguna
vez hay que auditar contra el plan oficial, el dato sigue siendo el del plan oficial.

**3. Y hay tres cosas que la función NO hace, a propósito:**

| No hace | Por qué |
|---|---|
| **Reponer acentos** | La fuente dice `ANALISIS`, y sale `Analisis`. Poner la tilde sería **inventar** sobre el dato en la capa de dibujo, donde nadie lo audita. El arreglo de verdad es un backfill con su procedencia |
| **Expandir abreviaturas** | `ORGANIZ. Y ADMIN. DE EMPRESAS` queda *Organiz. y admin. de empresas*. Adivinar qué decía el plan es la misma invención con otro nombre |
| **Tocar un nombre ya bien escrito** | Sólo se transforma lo que está **todo** en mayúsculas. `Cálculo Avanzado` sale intacto: romper un dato bueno para arreglar uno malo es mal negocio |

⚠️ **Y los números romanos sobreviven en mayúscula.** `ANALISIS MATEMATICO I` → *Analisis matematico
I*, nunca `i`. Hay tres series en el plan —Programación, Física, Análisis Matemático— y **el ordinal
es lo único que distingue una materia de la otra**: bajarlo lo convierte en una letra suelta que se
lee como un error de tipeo. En castellano no hay palabras formadas sólo por `I`, `V` y `X`, así que la
prueba no tiene falsos positivos sobre este vocabulario.

⚠️ **Los diez nombres cortados siguen cortados.** El `…` sobrevive, que es lo que `CLAUDE.md` pide.

**4. La barra de título de la superficie pierde el nombre: queda el semáforo solo.** Es `C-02` —
repetir no es reforzar, es gastar la altura que necesita lo que todavía no se dijo—. La miga ya lo
dice arriba y el eyebrow de `UX02` lo dice abajo.

⚠️ **No se pierde nada accesible.** Cada control **lleva el nombre adentro de su `aria-label`**
—*«Minimizar: Arquitectura computadoras»*—, así que un lector de pantalla sigue sabiendo de qué
ventana son esos tres botones. Lo que se saca es el texto redundante **para quien ve**.

**5. La ficha y la ventana llevan el color de su materia, y es el mismo que en la lista.** El ícono de
la ficha se tiñe; la ventana lleva una franja de 3 px arriba de su barra de título. Con tres ventanas
del mismo blanco superpuestas, *cuál es cuál* pasa de leerse a verse.

**6. ⚠️ `colorDeMateria` se mudó a `lib/domain/color-de-materia.ts`, y NO se copió.** Vivía privado
adentro de `components/screens/indice-de-materias.tsx`. Dos copias serían dos paletas el día que
alguien toque una: la lista y las ventanas dirían **colores distintos para la misma materia**, y el
color pasaría a mentir sobre la identidad en vez de fijarla. La razón por la que esto no viola
[ADR-075](#adr-075) §C1 —*identidad, no medida*— **viaja con la función**, que es donde se va a leer.

⚠️ **Y sigue pendiente de confirmar con la psicopedagoga**, igual que antes de mudarse. Que un color
sea constante no garantiza que nadie lo lea como semáforo, y esa lectura es empírica.

**7. Sólo las materias llevan color.** Un objeto de otro tipo no lleva ninguno. El argumento de
identidad se escribió mirando la lista de materias; estirarlo por mi cuenta a una `Evidence` o a un
`Commitment` sería llevar una decisión abierta a entidades que nadie miró — y **los estados de una
`Evidence` son justamente donde un color se lee como juicio**. Hoy además es todo lo que hay: sólo
`materia` se despliega en una ventana.

**8. ⚠️ La superficie NO lleva el color, y se probó puesto.** El color existe para **diferenciar cosas
que se ven a la vez**: dos fichas, tres ventanas. En una superficie sola no hay de qué diferenciarla.
Y a todo el ancho dejaba de leerse como identidad: una línea de color cruzando la pantalla arriba de
todo **se lee como una alerta** —justo encima de la franja que avisa que el temario es estimado—, y
dos barras de color seguidas diciendo cosas distintas es peor que ninguna.

#### Consecuencias

- **El eyebrow de `UX02` sigue en mayúsculas, y no se toca.** Es `textTransform` — un *estilo de
  label*, no el dato — y vive en `components/screens/*`, que la regla 6 de `CLAUDE.md` protege. El
  owner pidió borrar *"la del medio"*, no ésa.
- `lib/navigation/migas.ts` pasa a importar de `lib/domain/`. Es la dirección permitida de la
  frontera; `lib/navigation/` sigue sin importar `lib/fixtures/`.
- **Ninguna superficie nueva, ninguna CTA nueva, ningún contrato de backend nuevo.**

#### ⛔ Lo que esto destapó y NO resuelve

**Dos materias distintas del Plan 2016 se llaman igual en pantalla.** Los códigos `20162` y `10207`
tienen los dos `label = 'ARQUITECTURA COMPUTADORAS'` con `label_truncated = true`: son asignaturas
distintas cuyos nombres completos **se cortaron en el mismo punto** al importar el plan. Un estudiante
inscripto en las dos ve dos fichas con el mismo texto.

✅ **Resuelto el 11 de septiembre por [ADR-092](#adr-092)**, el día después: el owner aportó los dos
nombres y los programas oficiales de la cátedra los confirmaron —`(0820162) ARQUITECTURA DE
COMPUTADORAS I` y `(0810207) ARQUITECTURA DE COMPUTADORAS II`—. **El color fue lo que lo hizo
visible**: dos fichas con el mismo texto y distinto color es la forma más clara de decir *"acá hay dos
cosas"*.

⛔ **Pero quedan dos parejas más** —`LABORATORIO DE COMPUTACION (…` y `SEMINARIO DE FORMACION
HUMAN…`— sin nombre completo conocido. Ver ADR-092.

#### Cómo se verifica

`tests/nombre-de-objeto.test.ts` — ocho casos **sobre las etiquetas reales del plan**: romanos,
abreviaturas con punto, nombres cortados, ausencia de acentos, un nombre ya bien escrito que no se
toca, y que aplicarlo dos veces dé lo mismo. `tests/panel-de-objeto.test.tsx` — la barra de título no
repite el nombre pero sus controles lo llevan adentro, la ventana usa **la misma función de color que
la lista**, y un objeto que no es materia no lleva color. `tests/ausencia.test.tsx` — la paleta existe
una sola vez, el índice la importa, y la función de nombre no repone acentos.

---

<a id="adr-092"></a>

## ADR-092 — Dos materias del Plan 2016 se llamaban igual, y ahora no

**Estado:** `ACCEPTED` · 11 sep 2026 · **corregido con los programas oficiales delante**
**Toca:** `catalogo/ucc-ingenieria-de-sistemas-2016.csv`, `scripts/db-catalogo.sh`
**Construye sobre:** [ADR-053](#adr-053) (el Plan 2016) y [ADR-086](#adr-086)

### El problema

Los códigos `20162` y `10207` del Plan 2016 tenían **el mismo `label`**:
`ARQUITECTURA COMPUTADORAS`, los dos con `label_truncated = true`. Son **materias distintas**, y un
estudiante inscripto en las dos veía dos filas idénticas en el índice y dos fichas idénticas en la
barra del espacio de trabajo.

Salió a la luz con [ADR-088 · Enmienda 5](#adr-088-enmienda-5): al ponerle color a cada materia
quedaron dos fichas con el mismo texto y **distinto color**, que es la forma más clara posible de
decir *"acá hay dos cosas y no sabés cuáles"*.

⚠️ **La causa es la procedencia, y estaba declarada.** El Plan 2016 se transcribió de un **analítico
de estudiante** —`source_type = student`, *"analítico de estudios · transcripción anonimizada · 4 sep
2026"*—, donde la columna de nombres viene comprimida. Por eso las dos filas entraron con
`label_truncated = true` y `needs_review = true`: **el dato ya decía que estaba incompleto**.

### La decisión

**1. Se corrigen los dos nombres, y NO por intuición.** Los programas oficiales de la cátedra —los
mismos `.txt` que ingiere `importar-temarios.mjs`— los nombran completos y con su código entre
paréntesis:

| Código | Nombre oficial | Archivo |
|---|---|---|
| `20162` | `ARQUITECTURA DE COMPUTADORAS I` | `(0820162)` en el encabezado del programa |
| `10207` | `ARQUITECTURA DE COMPUTADORAS II` | `(0810207)` en el encabezado del programa |

Es exactamente lo que el esquema exige: *"`label_truncated = TRUE`: completarlo por intuición es
inventar contenido de dominio"*. **No se completó por intuición: se completó con la fuente.**

**2. Se corrige en el CSV, que es la fuente del plan — no con un `UPDATE`.** `catalogo/` es la
entrada administrativa versionada; arreglar la base y dejar el CSV viejo garantiza que el próximo
`db:reset` reponga el defecto.

**3. Se usan números romanos, no arábigos.** El owner los nombró *"1"* y *"2"*; el plan escribe
`ARQUITECTURA DE SOFTWARE I`, `BASES DE DATOS II`, `PROGRAMACION III`, y los programas oficiales
dicen `I` y `II`. Se sigue la convención del plan y de la fuente.

**4. Se toca el nombre y nada más.** `needs_review` **sigue en `true`**: corregir un nombre no es
auditar la fila. `source_type` sigue siendo `student` — el plan se sigue habiendo transcripto de un
analítico, y **esto no eleva la procedencia de nada**. `verification_status` no se toca: su única
escritura autorizada en todo el repositorio es `corroborar_procedencia()`, invariante `I9`.

**5. ⚠️ El guard baja de 10 a 8, y eso NO es aflojarlo.** `db-catalogo.sh` verificaba *"diez nombres
entran cortados, y se declara"* — precisamente para que nadie "limpiara" el síntoma. Ahora verifica
ocho, **y suma dos afirmaciones nuevas**: que `20162` y `10207` tienen dos nombres distintos, y que
**quedan exactamente dos parejas** que todavía comparten nombre. El guard dice más que antes, no
menos.

### ⛔ Lo que NO se corrigió, y por qué

**Quedan dos parejas con el mismo nombre, y no se tocan:**

| Códigos | Nombre compartido |
|---|---|
| `10182` · `20160` | `LABORATORIO DE COMPUTACION (…` |
| `10098` · `20071` | `SEMINARIO DE FORMACION HUMAN…` |

**Nadie tiene su nombre completo.** El corpus de programas oficiales no trae uno para cada código, y
`LABORATORIO DE COMPUTACION I` / `II` sería **exactamente la intuición que el esquema prohíbe**: el
paréntesis abierto sugiere que lo que sigue no es un ordinal. Se corrigen el día que aparezca la
fuente, con su ADR.

### La grieta que esto destapó, y que sigue abierta

⚠️ **`ingerir_plan()` no se puede volver a correr sobre un plan que alguien ya usó en el alta.**
Reemplaza los requisitos con `DELETE` + `INSERT` —*"reemplazo, no acumulación"*— y en cuanto un
estudiante declaró su mapa académico hay `requirement_declaration` apuntando a esos requisitos: el
`DELETE` choca contra la foreign key y el importador **aborta el archivo entero**. Se midió: con dos
altas hechas, `npm run db:catalogo` falla en `syn-universidad-syn.csv` y **ni siquiera llega** a los
archivos de la UCC.

Por eso esta corrección necesitó `scripts/sincronizar-nombres-del-plan.mjs`, que propaga **sólo
nombres** desde el CSV sin borrar ni insertar nada. Es un puente, no la solución: **la solución es que
`ingerir_plan()` haga `UPSERT` por `(plan, code)` en vez de `DELETE` + `INSERT`**, y eso es una
migración nueva con su propio ADR — no una edición de la que ya está aplicada.

### Cómo se verifica

`scripts/db-catalogo.sh` — ocho nombres cortados, los dos de Arquitectura con nombres distintos, y
exactamente dos parejas que todavía comparten nombre. `node scripts/sincronizar-nombres-del-plan.mjs`
sin `--aplicar` es el simulacro: sobre una base al día **no reporta ningún cambio**.

⚠️ **Y se miró en el navegador**: la miga dice *Hoy › Materias › Arquitectura de computadoras I*, y las
dos fichas de la barra por fin se leen distinto. El romano sobrevive a la Enmienda 5 —`I`, no `i`—,
que es para lo que esa regla estaba.

---

<a id="adr-089"></a>

## ADR-089 — `UX01` gana la capa «anticipar», y de dónde salen sus datos

**Estado:** `ACCEPTED` · 10 sep 2026 · ⚠️ **§1 enmendado por [ADR-093](#adr-093)** el 11 sep: el mapa de 14 días y la tarjeta única de *Próxima evaluación* salieron de Hoy; §2–§4 siguen vigentes
**Toca:** `components/screens/hoy-autogestion.tsx`, `lib/domain/view-models.ts`, `app/(student)/hoy/page.tsx`
**Autoriza:** la excepción de la regla 6 de [`CLAUDE.md`](../CLAUDE.md) para `hoy-autogestion.tsx`.

### Contexto

`UX01` contesta *"¿qué necesito hacer ahora?"* y lo hace bien: `selectHeroLevel` resuelve nueve
niveles y la pantalla proyecta el que le toca. Lo que **no** contesta es *"¿qué se me viene?"* — y el
estudiante que abre Hoy no puede ver que tiene un final en doce días sin entrar a otra pantalla.

Las dos preguntas son distintas y **no compiten**: la primera es conducta, la segunda es contexto.

### Decisión

**1. `UX01` gana dos módulos, y ninguno es una CTA primaria.** *Próxima evaluación* con su cuenta
regresiva, y el **mapa de catorce días** por materia. La Próxima Acción **sigue siendo la única
conducta primaria**: `I-06` no se toca y el Hero no se mueve de arriba.

**2. Los datos salen de una lectura que ya existe, y se piden aparte.** El mapa se arma con
`GET /api/materias` —el mismo `MateriasProps` que alimenta el Gantt del período de
[ADR-078](#adr-078)—, **no con un contrato nuevo**.

⚠️ **Es el precedente de `reparto`, literal:** *"llega calculado desde afuera y por separado, y es
opcional… quien lo quiera lo pide; quien no, no lo paga"*. `estado_del_dia()` **no se toca**, no hay
migración y no hay contrato de backend nuevo.

**3. Las reglas del Gantt son las de ADR-078 y ADR-085, sin excepción.** Sin fecha de evaluación **no
hay ventana** y la fila se dibuja punteada; sin primera clase el inicio **se marca como no sabido**;
un tema sin sus dos puntas **no se ubica**. El mapa de `UX01` es **la misma ventana, más chica** — no
una segunda aritmética. Por eso reusa `lib/domain/ventana.ts` y no calcula fechas en el componente.

**4. La composición se adapta al nivel del Hero, y a nada más.** Cuando `selectHeroLevel` devuelve un
nivel de rescate o incumplimiento, los módulos de contexto **se repliegan**: el estudiante atrasado
ve menos, no más.

⚠️ **Eso NO es la UI decidiendo.** El nivel llega resuelto por el dominio; la pantalla **lo proyecta
en el eje de la densidad** en vez de sólo en el del texto. No hay un segundo ranking, no se reordena
por criterio propio y no se recorta una acción. Si esto alguna vez necesita una regla que el nivel no
alcance a expresar, **es un ADR nuevo, no un `if` más**.

### Lo que NO entra, y por qué

| Pedido | Por qué no |
|---|---|
| **Radar académico** con señales y CTA por señal | `VI.1` §3.3 autoriza al riesgo a *cambiar el estado general* y nada más. Qué severidad se muestra es **`C01-021`, `OPEN`**. Ver [ADR-090](#adr-090) |
| **Videos / «Para avanzar mejor»** | Es Formación: [ADR-087](#adr-087) está `PROPOSED` con dos decisiones abiertas del owner |
| **Seguimiento humano** como módulo propio | La `Intervention` existe y **ningún motor la dispara** (`C01-036`, `C01-044`). Hoy `recuperacion` ya dice lo único que se puede sostener |
| **Cobertura como «preparación»** | [ADR-072](#adr-072): cobertura es actividad, no dominio ni pronóstico |

---

<a id="adr-090"></a>

## ADR-090 — El radar académico de `UX01`

**Estado:** `PROPOSED` — **no se construye** · ⚠️ **Reabierto en otra forma por [ADR-093](#adr-093)** el 11 sep: `UX01` muestra *Riesgos detectados* **de planificación** —calendario y carga, no `RiskSignal`—. Lo que este ADR bloquea, **la severidad de una `RiskSignal` en `UX01`**, sigue bloqueado
**Bloqueado por:** `C01-021` (`OPEN`) · `C01-036` (`OPEN`) · `C01-044` (`OPEN`)

### El problema

Un panel que liste señales de riesgo en `UX01` necesita contestar **qué severidad merece aparecer**,
y eso es exactamente `C01-021`. Elegir un umbral acá sería *"inventar el umbral por el que a un
estudiante se le dice que está en problemas"* — la frase está en
[`proyeccion-hoy.ts`](../lib/server/servicios/proyeccion-hoy.ts), y sigue siendo cierta.

Hay un segundo bloqueo, independiente: cada señal tendría que ofrecer una salida, y las salidas son
los playbooks, que `C01-044` dejó **sin valores** (*"no se inventan valores"*).

### Lo que hace falta para cerrarlo

1. **`C01-021`** — a partir de qué severidad una señal se le muestra al estudiante en `UX01`.
2. **`C01-036`** — qué motor produce la señal, y con qué causa.
3. **`C01-044`** — qué playbook ofrece cada causa.

Las tres las cierra una persona. Mientras tanto, `UX01` sigue mostrando lo único sostenible: el
estado general cambia a *necesita recuperación* **cuando la señal misma pide una persona**, que no es
un umbral local.


---

<a id="adr-091"></a>

## ADR-091 — La fila del índice es un solo destino, y la miga nombra el objeto

**Estado:** `ACCEPTED` · 10 sep 2026 · pedido del owner el 9 de septiembre, con la pantalla delante.

### El problema

1. **Sólo el botón abría la materia.** La fila se lee entera como accionable y clickearla no hacía
   nada (`P-05`: el área activa coincide con el área que parece activa).
2. **El breadcrumb decía «Materia».** La cadena sale del grafo, y el grafo conoce **nodos, no
   instancias**: `UX02` es «Materia» para las 51.

### La decisión

**1 · La fila entera abre la materia.** El `<li>` recibe el manejador de clic; el botón interior
conserva el suyo y detiene la propagación para no navegar dos veces. **El botón no desaparece**: es
el objetivo accesible, el que anuncia la acción y el que alcanza el teclado (`P-07`).

⚠️ **Una sola CTA con tres etiquetas.** *Abrir*, *Completar* y *Agregar examen* son las tres
`CTA-001` y las tres navegan a esta materia. El registro **no se toca**.

⛔ **Deuda registrada, y es de accesibilidad.** Lo correcto es que la fila sea **un solo destino de
navegación con `href` real** —el texto de acción adentro del enlace, sin controles anidados—, para
que el clic del medio, «abrir en pestaña nueva» y el foco funcionen sin escribir nada para ello. Hoy
el `onClick` del contenedor **le da al mouse una capacidad que el teclado no tiene**: quien navega
con teclado llega al botón y no a la fila. Es una mejora, no una regresión —el camino accesible
existe—, y queda en la deuda posterior al MVP.

**2 · `migasDe()` acepta con qué nombrar la última miga.**

```ts
migasDe(nodo: NodoId, etiquetaFinal?: string | null): Miga[]
```

- ⚠️ **Sólo reemplaza la última.** Las anteriores son nodos del grafo; cambiarlas rompería el camino
  de vuelta.
- ⚠️ **Vacío o ausente no borra**, deja la etiqueta del nodo. Una miga sin texto sería un hueco donde
  el usuario pierde dónde está mientras carga.

**3 · El nombre viaja por contexto.** `ProveedorDeMigaDelObjeto` + `useMigaDelObjeto`. El Shell no
puede leerlo solo: el nombre llega en la respuesta de la API, que se pide **adentro** del árbol que
el Shell envuelve. ⚠️ **Sin proveedor montado el hook es inerte**, no explota: `/login` y el alta no
montan el Shell.

### Lo que este ADR NO hace

- **No agrega superficies ni nodos.** Nueve superficies, once rutas.
- **No agrega CTAs.** El registro sigue en 20.
- **No toca el grafo, el árbol de padres ni las rutas.**
- **No reemplaza el breadcrumb.** [ADR-019](#adr-019) §2 sigue vigente.
- **No toca autenticación.** El arreglo del login viaja aparte, con su propia prueba.

### Cómo se verifica

`tests/indice-clickeable.test.tsx` — la fila abre desde cualquier parte y el botón sigue anunciando
la acción; sin manejador la fila no promete nada; la última miga dice la materia; las anteriores
conservan su enlace; en blanco vuelve a la etiqueta del nodo; las superficies que no abren un objeto
no se tocan.

---

<a id="adr-093"></a>

## ADR-093 — `UX01` es un tablero: evaluaciones, riesgos de planificación y los próximos 7 días

**Estado:** ✅ `ACCEPTED` · 11 sep 2026 · **decidido por el owner con una pantalla de referencia delante**
**Toca:** `components/screens/hoy-autogestion.tsx`, `app/(student)/hoy/page.tsx`, `lib/domain/riesgos-de-planificacion.ts`, `lib/domain/semana.ts`, `lib/server/servicios/proyeccion-tablero.ts`, `lib/server/repositorios/tablero.ts`, `app/api/tablero/route.ts`, `lib/domain/view-models.ts`, `lib/content/es-AR.ts`
**Autoriza:** la excepción de la regla 6 de [`CLAUDE.md`](../CLAUDE.md) para `hoy-autogestion.tsx`, igual que [ADR-089](#adr-089).
**Enmienda:** [ADR-089](#adr-089) §1 (sale el mapa de 14 días), `design-system.md` §1.4 (sale la cola `1 de N` de Hoy) y, **sólo para las tarjetas de `UX01`**, la forma del texto de [ADR-072](#adr-072). **Reabre en otra forma** [ADR-090](#adr-090).

### Contexto

El owner trajo una pantalla de referencia —un «Inicio» con la próxima acción, tarjetas por evaluación,
*riesgos detectados*, *próximos 7 días* y el estado de las materias— y pidió *"copiar el estilo
comunicacional para que HOY sea útil como tablero de comando y para vistas rápidas"*. Mirada al lado
de la `UX01` de ese día, la diferencia era de tono y de densidad: la referencia dice para qué es la
pantalla, pone **un número por bloque** y enuncia hechos cortos separados por `·`; la nuestra decía
*"Proyección · no prioriza"*, mostraba las materias **de a una** (`1 de 12`), repetía el tema del Hero
en mayúsculas y dejaba ver el enum `teorico_escrito`.

**Las respuestas del owner, literales** (11 sep 2026):

> *"no hace falta la tabla de estados ni las materias, cambia eso de la documentación"*
>
> Sobre el mapa de 14 días: *"Sacarlo de Hoy"*.
>
> Sobre el reparto: *"sacalo, solo me interesa por ahora que queden los rectángulos con la materia con
> la info: tipo de examen (parcial/final), día de examen, modalidad de examen, días antes de examen y
> porcentaje de cobertura, tal cual como está en la foto, para 4 materias (vos podés scrollear para la
> derecha y ver el resto de materias). esto como opción 1: como no creo que sea profesional, quiero que
> vos presentes una opción 2 justo abajo, luego veo ambas y decido, algo así como un wireframe pero
> funcional en sentido de que puedo hacer click."*
>
> *"también quiero que se mantenga lo de riesgos detectados, lo hablamos con el personal engine para
> ver qué son riesgos, no vayas a la psicopedagoga, pongamos un número estándar que consideres y un
> intento de los de próximos 7 días, hablado con el personal engine y el academic engine"*

### Decisión

**1. `UX01` queda en este orden:** encabezado (*Hoy* · *Qué necesita atención hoy* · píldora con la
fecha y **los días a la próxima evaluación**) → estado general → recuperación → **Hero (2/3) + Próximos
7 días (1/3)** → Riesgos detectados → Próximas evaluaciones (Opción 1 y Opción 2). La columna de la
semana es la que [ADR-015](#adr-015) reserva para la *continuidad*; el Hero no se mueve de arriba y
**sigue siendo la única CTA primaria** (`I-06`). La composición adaptativa de ADR-089 §4 se conserva:
en rescate o incumplimiento **todo el tablero se repliega**.

**2. Salen de Hoy, por ahora:** la cola de materias `1 de N`, el mapa de 14 días y el reparto de horas.
⚠️ **Se retira el dibujo, no el dato**: `HoyProps.materias` y `HoyProps.reparto` siguen llegando de
`/api/hoy`, y el Gantt del período sigue en `/materias` ([ADR-078](#adr-078)). El reparto de
[ADR-073](#adr-073) **se queda sin superficie visible**; su tramo `CRITICA` vuelve como un riesgo
(punto 4).

**3. Las evaluaciones van en dos formas, para que el owner elija una.** *Opción 1 · tarjetas*: la de la
foto —color de la materia arriba, días grandes, *"Parcial 1 · mar 15 sept · teórico escrito"*, barra
y *"cobertura 26% · último avance hoy"*—, cuatro a la vista y el resto con scroll horizontal.
*Opción 2 · carril*: un boceto clickeable, **una sola línea de tiempo con una marca por evaluación**;
tocar una marca abre su detalle. Las dos salen del mismo dato. ⚠️ **La que no quede se borra**: la
convivencia es una comparación, no un diseño.

**4. Riesgos de planificación, `PLAN-v0.1`.** Cinco reglas sobre hechos que ya existen:

| Regla | Dispara cuando | Motor |
|---|---|---|
| `EVALUACION_SIN_TEMAS` | evaluación a ≤ 21 días y la materia sin temas cargados | Academic |
| `COBERTURA_BAJA_CERCA` | evaluación a ≤ 7 días y cobertura < 50 % | Academic |
| `SIN_ACTIVIDAD_CERCA` | evaluación a ≤ 14 días y ≥ 10 días sin actividad, o nunca | Academic |
| `EVALUACIONES_ENCIMADAS` | dos o más evaluaciones a ≤ 1 día entre sí, dentro de 21 días | Academic |
| `PLAN_NO_ENTRA` | el reparto cae en el tramo `CRITICA` (> 2×) | Personal |

Los números los **propuso el equipo y los aceptó el owner**; viven en una sola constante versionada
(`REGLAS_DE_PLANIFICACION`). **Una regla por materia** —la más específica—, porque *sin temas*, *sin
cobertura* y *sin actividad* sobre la misma evaluación son una causa contada tres veces (`C-02`). **El
orden es por fecha, no por gravedad**: ordenar por gravedad sería decidir qué riesgo pesa más. Sin
datos **no dispara**: una cobertura que no se puede calcular no es una cobertura baja. `PLAN_NO_ENTRA`
**no inventa ni el umbral ni la frase**: los dos son de la psicopedagoga (ADR-075 §A3).

⚠️ **Esto NO es el Risk Engine.** No escribe `risk_signal` ni ninguna tabla, no emite eventos, no abre
intervenciones y **no cambia el estado general**. Mira el calendario y la carga, nunca a la persona.
`C01-021` —los umbrales de `HP0-06-2` y `HP0-06-3`— **sigue abierto** y esto no lo cierra. La única
acción por riesgo es **abrir la materia** (`CTA-001`, navegación): una salida propia por riesgo sería
el playbook que `C01-044` dejó sin valores.

**5. Los próximos 7 días** — ⚠️ **reemplazados el mismo día por el cuadro de hoy de [ADR-094](#adr-094)**. Evaluaciones (la próxima de cada materia), clases (`class_schedule_block`,
la regla semanal), compromisos pendientes con su hora acordada y las franjas de disponibilidad
**declaradas** —ADR-074: nunca derivadas de lo cumplido—. **No es una agenda**: no propone cuándo
estudiar, no crea nada y no tiene botones ([ADR-064](#adr-064)). Clases y disponibilidad se listan
como dos cosas distintas y ninguna descuenta a la otra ([ADR-083](#adr-083)).

**6. Los datos: `GET /api/tablero`, pedido aparte como antes el panorama.** Lee los insumos del
reparto —los mismos del índice, así que **una tarjeta y una fila de `/materias` no pueden
contradecirse**— y, en un repositorio propio, bloques, compromisos y disponibilidad con `.from(...)` y
el `institution_id` en el `WHERE`. **Sin migración y sin tocar `estado_del_dia()`.**

**7. El Hero en presentación.** El tema del catálogo llega TODO EN MAYÚSCULAS; se dibuja con
mayúscula inicial (`nombreDeObjeto`) y **no se repite** en el eyebrow. Es la Enmienda 5 de ADR-088
extendida a `UX01`, con sus mismas reglas: no repone acentos, conserva los romanos y no toca lo bien
escrito.

**8. La modalidad se lee en el tablero.** `teorico_escrito` → *teórico escrito*, desde el copy; un
valor que el copy no conoce **se omite**.

### Lo que la referencia tenía y NO se copió

| Elemento | Por qué no |
|---|---|
| **Tres CTAs apiladas a la derecha** del Hero (*Marcar hecha*, *Enviar evidencia · WhatsApp*, *Reprogramar*) | `I-06`: una sola primaria, a ancho completo al final de la columna ([ADR-015](#adr-015)). *Marcar hecha* completaría un `Commitment` desde el cliente (`AGENTS.md` §2.3); WhatsApp está fuera de Hoy y `student.whatsapp` no tiene escritor; renegociar es `C01-010`, `OPEN` |
| **Tarjeta *"Tu operadora · Analía"*** con una cita | No hay `human_assignment`: sería presencia humana decorativa (`product.md` §13). Las superficies de operador son del CRM ([ADR-033](#adr-033)) |
| **Tabla *Estado de materias*** | El owner la descartó |
| ***"hace 12 días"* en rojo** | Es un juicio sobre una cadencia ([ADR-078](#adr-078)); el hecho va sin color. El tono de urgencia queda sólo en la cifra de días a la evaluación |
| ***"2 abiertos"*** | Un riesgo de planificación no tiene ciclo de vida: se cuenta como *detectados* |
| ***"última actividad"*** | *Actividad* es la palabra vetada para `Action` (`C-02`, guard en `auditoria-conformidad`). Se dice *último avance*, que ya era el vocabulario de `UX01` |
| **La tipografía con serifa** de títulos y cifras | Vive en `app/globals.css`, que la regla 6 protege |

### Costos, dichos antes de ejecutar

- ⚠️ **Estado general y riesgos pueden contradecirse en la misma pantalla.** Con el dato sintético de
  la UCC, `UX01` dice *BAJO CONTROL* arriba y *5 detectados* abajo. El estado general sale del nivel
  del Hero y `product.md` §13 ya prohíbe *"Bajo control" sin lectura confiable del Risk Engine*. **No
  se tocó**: el copy de `HOY.ESTADO.*` es del owner. **Pendiente de su decisión.**
- ⚠️ **El vocabulario de riesgo no pasó por la psicopedagoga**, por instrucción explícita. Ella había
  pedido revisión experta de lenguaje *antes de probar con personas* para lo que el sistema le dice al
  estudiante sobre sí mismo. Las frases de acá enuncian hechos del calendario y ninguna usa las
  prohibidas de ADR-075 (*"estás atrasado"*, *"no vas a llegar"*), pero **la revisión sigue sin
  hacerse**.
- ⚠️ **La cobertura de las tarjetas va como porcentaje solo**, *"tal cual como está en la foto"*.
  ADR-072 adoptó los dos números (*"1 de 9 temas · 26 % de las horas"*) para que la ponderación no
  quedara invisible. En `UX01` va el porcentaje **con la nota al pie literal de ADR-072**; el índice
  conserva los dos números.
- ⚠️ **Con un estudiante recién empezado, `SIN_ACTIVIDAD_CERCA` dispara en toda materia con evaluación
  a dos semanas.** Es cierto, y puede ser ruido. Si lo es, se cambia el umbral **y la versión**.
- ⛔ **El índice y `UX02` siguen mostrando `teorico_escrito`.** `proyeccion-materia.ts` lo deja pasar
  a propósito (*"son palabras del oficio que la cátedra declaró"*), pero la columna tiene un `CHECK`
  con el enum: ninguna cátedra escribió `teorico_escrito`. Este ADR **no lo reabre**; queda para
  decidir.

### Cómo se verifica

`tests/riesgos-de-planificacion.test.ts` — cada regla en su borde, una por materia, orden por fecha,
sin datos no dispara, y guard de que el módulo no importa nada ni escribe. `tests/semana.test.ts` —
siete días que cruzan de mes, clases por día de semana, compromisos en hora de pared (las 02:00 UTC
del sábado son el viernes en Córdoba), disponibilidad sin mezclar con clases.
`tests/proyeccion-tablero.test.ts` — tarjetas en el mismo orden y cobertura que el índice, ningún enum
en la salida, la frase de la psicopedagoga en `PLAN_NO_ENTRA`. `tests/hoy-anticipar.test.tsx` — la
pantalla: lo retirado no se dibuja aunque llegue, las tres ausencias, las dos opciones, los riesgos,
la semana sin botones y el repliegue. `tests/adr-054-materia-seleccionada.test.tsx` — la garantía de
ADR-054 se mudó de la cola a la tarjeta.

---

<a id="adr-094"></a>

## ADR-094 — El cuadro de hoy, y el bloque horario gana el aula

**Estado:** ✅ `ACCEPTED` · 11 sep 2026 · **pedido del owner con el tablero delante**
**Toca:** `lib/domain/cuadro-de-hoy.ts`, `lib/server/servicios/proyeccion-tablero.ts`, `lib/server/repositorios/tablero.ts`, `components/screens/hoy-autogestion.tsx`, `supabase/migrations/20261006000000_aula_del_bloque.sql`, `scripts/simular-aulas.mjs`
**Enmienda:** [ADR-093](#adr-093) §5 (los próximos 7 días pasan a ser el día de hoy) y lo que [ADR-062](#adr-062) y [ADR-083](#adr-083) dejaron escrito del bloque: *"no lleva aula, a propósito"*.

### Contexto

Con el tablero de ADR-093 funcionando, el owner pidió, textual:

> *"me encanta lo de próximos 7 días, pero prefiero que sea un cuadro de hoy: clases de hoy tal como
> está, temas que podés avanzar, y horarios"*
>
> *"después agregale en qué aulas dan las clases, como no están, simulalas, también agregá las
> unidades que dan, todo esto en la sección de hoy, pero poca info, como diciendo: Un. 5, nada más"*

### Decisión

**1. El cuadro *Tu día*** reemplaza a los próximos 7 días, en la misma columna (la de
*continuidad*, [ADR-015](#adr-015)). Tres bloques, un renglón por cosa:

| Bloque | Renglón | De dónde |
|---|---|---|
| **Clases** | `08:00–10:00 Fundamentos de programación · Un. 6 · Aula 3.12` | `class_schedule_block` + la última clase dada |
| **Podés avanzar** | `Análisis matemático I   Un. 1 · 2 · 3 +5` | unidades dadas en clase **sin evidencia**; hasta 3 materias, en orden de próxima evaluación |
| **Horarios** | evaluaciones, compromisos pendientes y franjas **declaradas** de hoy | `assessment`, `commitment`, `availability` |

**2. ⚠️ `Un.` es la unidad de la ÚLTIMA clase dada, no la de hoy — y la pantalla lo dice.** No
existe un cronograma de clases futuras: `class_session` son clases **dadas**, con minutos
**observados** ([ADR-068](#adr-068)). Se evaluó simular las clases que vienen y se descartó:
`estado_de_materia()` toma la última fecha de cada tema de **todas** sus clases, así que una clase
futura simulada **estiraba las barras del Gantt de `UX02` y aparecía en su registro de clases** —
y [ADR-085](#adr-085) exige que las dos puntas de cada barra sean hechos. Lo que sí es un hecho es
**por dónde va la materia**; eso se muestra, con la nota *"Un.: la unidad de la última clase dada"*.

**3. El aula existe: `class_schedule_block.room`, nullable.** ⚠️ **No tiene procedencia propia:
hereda la del bloque.** El dato lo pone `scripts/simular-aulas.mjs --aplicar`, que **sólo escribe
sobre bloques `inference`** —la regla vive en el `WHERE`— y no pisa un aula existente. Con la base de
este día: **51 bloques simulados con aula, 6 `public_web` sin tocar**. Si alguna clase de hoy es
simulada, el cuadro lleva la nota *"Horarios y aulas estimados por Achieve, no publicados por la
facultad"* — obligatoria, porque sin ella el aula se lee como dato de la institución.

**4. *Podés avanzar* no es una recomendación.** Es un filtro sobre hechos —dado en clase, sin
evidencia— en el orden de próxima evaluación que [ADR-072](#adr-072) ya aceptó. La recomendación
sigue siendo **una**, y es el Hero (`DD9`). Sin ninguna clase dada, el vacío dice *"Todavía no hay
clases dadas cargadas"*, **no** *"todo hecho"*.

**5. No es una agenda.** Clases y horarios no tienen botones. Lo único que se toca es el nombre de
una materia en *Podés avanzar*, que la abre por `CTA-001` — navegación, no una acción nueva.

### Costos

- ⚠️ **Revierte una ausencia deliberada.** ADR-062 y ADR-083 dejaron el bloque sin aula *"a
  propósito"*; lo cambia el owner, y el aula de hoy es **toda simulada**.
- ⚠️ **`ingerir_materia()` no recibe aula.** Si se vuelve a correr `simular-temarios --aplicar`, los
  bloques se regeneran sin aula: hay que correr `simular-aulas --aplicar` después.
- ⚠️ **Con el calendario simulado, todas las materias ya dieron su última unidad** antes del 4 de
  septiembre. `Un.` muestra la última del programa y *Podés avanzar* ofrece todo lo que no tiene
  evidencia. Es cierto sobre el dato; es raro como producto.
- ⛔ **`db:verify` no se corrió.** La migración se aplicó a la base local con `psql`, sin `db:reset`,
  porque `db:verify` vacía la base de demo en uso. Queda pendiente.

### Cómo se verifica

`tests/cuadro-de-hoy.test.ts` — clases por día de semana y en orden; `Un.` de la última clase dada y
nunca de una futura; *Podés avanzar* sólo con lo dado y sin evidencia, en el orden recibido, con
tope y resto; el vacío sin clases dadas; compromisos en hora de pared. `tests/aula-del-bloque.test.ts`
— la columna es nullable y sin procedencia paralela, el simulador sólo toca `inference` y no inserta
ni borra, y la lectura marca como estimado todo bloque `inference`. `tests/proyeccion-tablero.test.ts`
y `tests/hoy-anticipar.test.tsx` — el cuadro redactado, las notas y la pantalla.
