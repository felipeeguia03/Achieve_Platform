# CLAUDE.md

## ⚠️ Leé [`AGENTS.md`](AGENTS.md) primero

Este repositorio tiene reglas canónicas para agentes de IA en **[`AGENTS.md`](AGENTS.md)**. Son
normativas, no orientativas. Este archivo es solo una referencia rápida.

---

## Qué es esto

**Achieve** — acompañante académico para estudiantes universitarios. Cada día le dice al estudiante
qué acción concreta hacer para no perder el ritmo de sus materias, con una persona real como
supervisor y fallback.

Se trabaja con **Spec Driven Development**: la fuente de verdad son los markdown de `docs/`, y el
código sigue a la documentación. Si discrepan, **el código es el defectuoso**.

---

## Las seis reglas

1. **No inventes reglas de negocio.** Hay 40 decisiones abiertas; las 8 psicopedagógicas
   ([ADR-025](docs/decisions.md#adr-025)) y la obligatoriedad de `Reflection`
   ([ADR-026](docs/decisions.md#adr-026)) están respondidas, pero **con residuos**. Si falta una
   regla, registrala como ADR `PENDING` y **preguntá**.
2. **No resuelvas una decisión `PENDING`.** La cierra una persona.
3. **Datos reales: bloqueo absoluto** hasta que [ADR-006](docs/decisions.md#adr-006) tenga
   **dictamen legal**. Sus decisiones de producto ya están tomadas (1 sep 2026), pero en estado
   `PROVISIONAL — LEGAL CONFIRMATION REQUIRED`: **eso no levanta el gate.** El backend se construye
   sobre datos sintéticos, sin excepciones ni "una prueba chica".
4. **Una etapa por vez, completa.** Readiness → decisiones aprobadas → implementar → verificar →
   commit → docs actualizados. **Verificar es `npm run lint`, `npm run typecheck`, `npm run build`,
   `npm test` y `npm run db:verify`** — los cinco. ⚠️ `typecheck` es un gate propio: `vitest` borra
   los tipos con esbuild y el build de Next no alcanza los tests, así que un mock desactualizado
   pasa los dos y **sólo lo ve `tsc`**.
5. **Antes de tocar UI, abrí las capturas de `docs/diseño/`.** Achieve es desktop-first y su
   lenguaje visual sale de ahí ([ADR-018](docs/decisions.md#adr-018)). **La carpeta no está
   versionada:** si la encontrás vacía, **decilo y pará** — no improvises un diseño.
6. **No reescribas `components/screens/*`, `app/globals.css` ni `components/ui/*`** salvo que el
   roadmap lo pida.

---

## Los invariantes que más se rompen

> Preparar contenido no es enviarlo. Enviar no es suficiencia. Suficiencia no es validación.
> Validación no es dominio.

- Aceptar una `Action` **no** crea un `Commitment`.
- `Evidence` `SUBMITTED` **no** implica suficiencia ni revisión.
- `UNDER_REVIEW` **exige una revisión real creada**, no un método configurado.
- `VALIDATED` **no** produce `ProgressUpdated`.
- **Un `Commitment` `MISSED` nunca se edita para parecer cumplido.** El rescate es otro objeto.
- **Sin datos no es cero.** "No evaluado" ≠ "bajo" ≠ "no disponible" ≠ `0`.
- **La UI proyecta, nunca decide.** No rankea ni genera Actions.
- **Omitir, no inventar.** Si falta un contrato, la línea desaparece.

Lista completa: [`AGENTS.md`](AGENTS.md) §2.

---

## Dónde está cada cosa

| Necesito… | Voy a |
|---|---|
| Entender el dominio, un estado o el copy permitido | [`docs/product.md`](docs/product.md) |
| Saber qué está bloqueado y por qué | [`docs/decisions.md`](docs/decisions.md) |
| Saber qué toca hacer ahora | [`docs/roadmap.md`](docs/roadmap.md) |
| Tocar UI | **`docs/diseño/*.png` primero**, después [`docs/design-system.md`](docs/design-system.md) |
| Ver qué patrón visual usar | [`docs/design-system-capturas.md`](docs/design-system-capturas.md) |
| Tocar datos | [`docs/data-model.md`](docs/data-model.md) |
| Tocar estructura | [`docs/architecture.md`](docs/architecture.md) |
| Aplicar un principio del manual de diseño | [`docs/domain-translation-dd1-dd10.md`](docs/domain-translation-dd1-dd10.md) |
| Saber si algo está decidido | [`docs/pending-decisions-annex.md`](docs/pending-decisions-annex.md) |
| Escribir contenido del protocolo de examen | [`docs/roadmap-modo-examen-source.md`](docs/roadmap-modo-examen-source.md) — **los 20 pasos, su voz literal**. Y [`human-p0-source.md`](docs/human-p0-source.md) para las ocho reglas |
| Buscar evidencia esperada de un paso | [`docs/cuadro-problemas-source.md`](docs/cuadro-problemas-source.md) — **propuesto, no cargado**: tiene preguntas abiertas de la autora |
| Nombrar algo como lo nombra el oficio | [`docs/indice-psicopedagogico-source.md`](docs/indice-psicopedagogico-source.md) |
| Tocar registro, elegibilidad o integración CRM | [`docs/platform-integration-contract.md`](docs/platform-integration-contract.md) — §2.1 la propuesta de contrato v2, §2.2 **lo que la Fase B6 necesita de él** |
| Saber en qué quedó la integración con el CRM | [`docs/contrato-riesgo-candidato-v0.2.md`](docs/contrato-riesgo-candidato-v0.2.md) §11 (flujos A·B·C, **congelados**) y [`docs/respuesta-crm-flujos-d-e-v0.1.md`](docs/respuesta-crm-flujos-d-e-v0.1.md) (flujos **D · actividad** y **E · teléfono**, aceptados con cambios) |
| Preparar la consulta legal | [`docs/legal-package.md`](docs/legal-package.md) |
| Cerrar los residuos psicopedagógicos | [`docs/agenda-cierre-psicopedagoga.md`](docs/agenda-cierre-psicopedagoga.md) |
| Cerrar las tres decisiones del Product Owner | [`docs/agenda-decisiones-po-crm.md`](docs/agenda-decisiones-po-crm.md) — ADR-041, ADR-042 y ADR-043, con contexto y opciones |
| Resolver las vulnerabilidades `high` | [`docs/brief-adr-008-seguridad.md`](docs/brief-adr-008-seguridad.md) |
| El spec original completo | `docs/product-spec-source.md` — **no se edita** |

---

## Estado actual

**Fase 0 — Cerrar el Track A.** ✅ **COMPLETA.** Las nueve superficies existen, todos los estados
críticos son alcanzables, el Golden Path se recorre por clic y **el test de comprensión de 10
segundos se corrió con resultado PASS** (reportado por el owner, 30 ago 2026).

**Fase B0 — Cerrar decisiones.** 🟡 **4 / 5.** [ADR-003](docs/decisions.md#adr-003),
[ADR-004](docs/decisions.md#adr-004), [ADR-005](docs/decisions.md#adr-005) y
[ADR-010](docs/decisions.md#adr-010) están `ACCEPTED`; [ADR-006](docs/decisions.md#adr-006) sigue
`PROVISIONAL — LEGAL CONFIRMATION REQUIRED`.

**Fase B1 — Fundación.** ✅ **COMPLETA, 6 / 6.** Supabase local reproducible, capa académica y del
estudiante, la frontera Controller → Service → Repository, `product_event`/`audit_log` append-only y
el cliente de autorización del CRM.

**Fase B2 — Dominio de ejecución.** ✅ **COMPLETA, 6 / 6** — 1 de septiembre de 2026. `Action`,
`Commitment`, `Evidence` y `Reflection`, esta última cuando el owner cerró `C01-051`
([ADR-026](docs/decisions.md#adr-026)): el requisito vive en la Action, **congelado al crearla**, y
es ternario —`NO_CONFIGURADA` no ofrece nada, `OPTIONAL` ofrece y no bloquea, `REQUIRED` bloquea sólo
el submit dependiente—. **La Etapa B2.6 cerró:** `UX01`–`UX06` leen de Postgres con sesión real, cada una con una
función de lectura propia, y ninguna cae al fixture en silencio. `UX07`–`UX09` se conectaron en la
Fase B5.

**Fase B6.8 — El camino de ejecución escribe en Postgres.** ✅ **COMPLETA, 5 / 5** — 3 de septiembre
de 2026, decidida por el CTO ([ADR-040](docs/decisions.md#adr-040)). El ADE tiene disparador
(`POST /api/recomendacion`), el `Commitment` nace de una confirmación explícita, la entrega crea una
`Evidence` real en dos tiempos, la validación registra el progreso y **`C01-009` quedó cerrada**:

> `Evidence` suficiente → validación registrada → progreso registrado → `Action` completada.
> **Cada flecha es una operación que ocurre porque la anterior ocurrió.**

⚠️ **`VALIDATED` sigue sin producir `ProgressUpdated`.** El progreso lo escribe la operación, no el
estado, y el guard de los cuatro caminos sigue valiendo. **La `Action` no se cierra por tener una
evidencia validada:** se cierra porque la operación autorizada la cierra, con la cadena causal
verificada de una sola vez.

⚠️ **El cierre recorre también la máquina del `Commitment`** (`CONFIRMED → STARTED → COMPLETED`). Sin
eso, el reloj lo pasaba a `MISSED`: un incumplimiento falso sobre trabajo hecho y validado.

⚠️ **Quién valida sigue sin definirse.** `reviewer_id` queda `NULL` y el actor del evento es `null`
—lo produjo un proceso, no una persona—. `C01-030` sigue `OPEN` y esto no lo adelanta.

**Hay pantalla de ingreso: `/login`** ([ADR-039](docs/decisions.md#adr-039), Product Owner, 3 de
septiembre de 2026). **No es `UX10`** —el registro canónico sigue con nueve nodos y hay guard—, no
ofrece crear cuenta (eso lo decide el padrón del CRM) y **no levanta el gate de
[ADR-006](docs/decisions.md#adr-006)**. El navegador ya no abre sesión solo.

✅ **Las tres decisiones de los flujos del CRM quedaron cerradas** el 4 de septiembre de 2026 por el
Product Owner: [ADR-041](docs/decisions.md#adr-041) (actividad facturable),
[ADR-042](docs/decisions.md#adr-042) (WhatsApp, consentimiento y el alta entera) y
[ADR-043](docs/decisions.md#adr-043) (orden y smoke test). Fuente literal:
[`respuesta-po-flujos-crm-source.md`](docs/respuesta-po-flujos-crm-source.md).

⚠️ **Cerradas no es "a construir".** El owner autorizó **cerrarlas, documentarlas y ponerlas en
backlog**, y fijó qué va primero: *"primero se termina y verifica el loop actual del MVP de
Plataforma"*. [ADR-035](docs/decisions.md#adr-035) y [ADR-006](docs/decisions.md#adr-006) siguen
plenamente vigentes.

⚠️ **Y traen reglas de producto que ya rigen, aunque la superficie no exista:**

- **La confirmación sólo puede decir** *"Guardamos tu número"* o *"Recibimos tu solicitud"*. **Nunca**
  que el CRM vinculó el número, que hay un operador asignado o que alguien va a escribirle: la
  Plataforma **no observa** ese estado.
- **Al estudiante sin materias no se le muestra *"no hay una acción recomendada"***, porque el sistema
  todavía no está en condiciones de evaluar eso. El texto aprobado es *"Estamos preparando tu
  información académica"*.
- **Se emiten los cuatro eventos facturables y ninguno más.** El CRM pidió `ActionAccepted` y
  `CommitmentConfirmed` apagados para su embudo; el owner no se pronunció sobre eso. **Hasta que lo
  haga, no se emiten.**

**Fase B6 — Risk e Intervención.** 🟡 **DOMINIO COMPLETO** — 2 de septiembre de 2026
([ADR-032](docs/decisions.md#adr-032)). El **circuito cerrado se garantiza por construcción**: cerrar
una intervención sin resultado no es un camino que exista, y `RESOLVED` sólo se alcanza con una
intervención que registró outcome. `circuito_de_senales()` **audita el Done** y nombra el contrato que
falta en vez de dar el circuito por cerrado. `audit_log`, que existía desde la B1.5 y nadie escribía,
por fin se escribe.

⚠️ **Antes de tocar riesgo:** `HP0-06-1 v4.0-psicopedagogia` ya produce señales, pero sólo desde
hechos comparables bajo el criterio de ADR-037. `HP0-06-2` y `HP0-06-3` siguen en modo humano;
`C01-021` permanece abierto para esas reglas y `C01-044` para playbooks/SLA. No inventes ninguno.

⚠️ **El riesgo en `UX01` es un modificador, no un reemplazo.** Cambia el estado general y **nada
más**: no gana el Hero, no interrumpe `IN_PROGRESS`, no reordena materias y no inventa una CTA. Ni
siquiera entra a `HeroInput`, y hay guard.

**Fase B6.7 — La validación profesional, aplicada.** ✅ **4 / 4** — 2 de septiembre de 2026
([ADR-037](docs/decisions.md#adr-037)). La psicopedagoga respondió con **6 `CAMBIAR` + 1 `APROBAR`**
y **sin mover un solo umbral**: lo que objetó es **qué cuenta como una repetición**. La frase que
ordena la fase: **«el sistema debe reconocer patrones, no etiquetar personas»**.

**B6.7.1 cerró el punto `9.5`** — el vocabulario. `v2.0-psicopedagogia` con **cinco familias**;
*"dependencia de ayuda externa"* **sale como error** y pasa a `support_need_observation` como
condición de desempeño; categoría **principal + secundaria** (la secundaria **no cuenta**);
*clasificación incierta* como fila del catálogo con `es_familia = FALSE`; y **corrección humana
append-only**.

⚠️ **Antes de tocar el contador de reiteración:** cuenta por **familia** (`canonical_id`), **nunca**
por fila de versión de `error_type`. Filtrar por `error_type_id` parte el contador al medio en
silencio la próxima vez que se cargue una versión del vocabulario. Y **el vocabulario vigente decide
qué cuenta**: sin fila vigente que declare la familia, no se evalúa — es lo que retira `dependencia`
sin haber editado la fila que el Product Owner escribió.

**B6.7.2 cerró `9.1` y `9.6`** — el denominador. La unidad de conteo pasó a
`(estudiante, preparación, familia, objetivo/demanda)`; `learning_objective` es una tabla nueva que
**nace vacía**; y el resultado separa **`repeticionDetectada`** (misma familia, no escala sola) de
**`apariciones`** comparables (mismo objetivo, lo único que lee el umbral). La regla vigente es
`HP0-06-1 v4.0-psicopedagogia`.

**B6.7.3 cerró `9.2`, `9.3` y `9.4`** — acelerar exige las cinco condiciones de corrección válida;
recuperar exige dos aciertos independientes; y una recaída abre un `reiteration_episode` vinculado
al anterior, sin borrar historia. Los seis disparadores cualitativos tempranos viven en configuración
y `review_context` lleva evidencia e historial de apoyos a la cola sintética.

**B6.7.4 cerró `9.7`** — una replanificación crea `exam_preparation_plan_version` dentro de la
misma preparación; `REPLANNED` sigue vivo. La reentrada 9–18 usa seis motivos configurados y una
propuesta en dos tiempos: explicar primero, mover `current_step_id` sólo al aceptar u override.
Pedir otra opción conserva el paso; ninguna rama toca Evidence, progreso ni completions.

⚠️ **Recuperar un episodio no resuelve una obligación humana.** Si una `RiskSignal` ya llegó a
`INTERVENTION_REQUIRED`, sólo una intervención con outcome puede llevarla a `RESOLVED` (ADR-032).
Son dos lifecycles distintos y no se colapsan.

⚠️ **Los umbrales siguen siendo `2` y `3`.** Ella los recomendó tal cual: no objetó los números,
objetó **qué cuenta como una repetición**. Si algo no escala, mirá el denominador antes que el
umbral.

⚠️ **Sin objetivo declarado no hay comparabilidad, y no se escala.** El mundo demo declara uno; si
sembrás observaciones sin `learning_objective_id`, el circuito cuenta la repetición y **no llama a
nadie** — eso es correcto, no un bug. *"Cómo se define una tarea comparable"* es de la psicopedagoga
y sigue abierto: **no lo infieras**.

⚠️ **`evidence_quality` no es `evidence.lifecycle_state`.** Una entrega `INSUFFICIENT` **cuenta** si
el error es identificable — es el único `APROBAR` de los siete, y excluirla *"sesgaría la detección
contra quienes más necesitan acompañamiento"*. Lo que no cuenta es lo ilegible, no lo incompleto.

⚠️ **`risk_signal.reason` llega a la pantalla del estudiante.** No estrenes vocabulario ahí: ella
pidió revisión experta de lenguaje, accesibilidad y no estigmatización **antes** de probar con
personas.

⚠️ **Quién puede corregir una clasificación no está definido.** `corrected_by` es identidad externa
sin FK y `POST /api/observacion/correccion` va con secreto de servicio. **No inventes el rol.**

**Fase B5 — Modo Examen real.** ✅ **COMPLETA, 5 / 5** — 1 de septiembre de 2026. **Las nueve
superficies del estudiante leen de Postgres**; `UX07`–`UX09` eran las tres últimas que proyectaban
fixtures. Los tres requisitos de schema se cerraron **antes** de la primera migración, porque una
migración aplicada no se edita:

- [ADR-028](docs/decisions.md#adr-028) — **la completion de un paso es un hecho, no un estado.** Se
  cayó el `UNIQUE`; cada vuelta es una fila con su `occurrence` y **su tema**. La garantía vieja no se
  perdió: se volvió configurable en `protocol_step.is_reentrant`.
- [ADR-029](docs/decisions.md#adr-029) — **la pauta de la cátedra tiene entidad propia**, con
  Provenance completa. Cargada por el estudiante entra `student`/`unverified` y **no se eleva**.
- [ADR-030](docs/decisions.md#adr-030) — **el protocolo corre con contenido rotulado.** Arrancó con
  `EP-SPEC v0.1` porque el texto de los 20 pasos no estaba en el repositorio.
- [ADR-031](docs/decisions.md#adr-031) — **los veinte pasos entraron con el texto de la
  psicopedagoga**, el mismo día. `HUMAN-ROADMAP v1.0`, verbatim, con `source_text` atado a
  [`roadmap-modo-examen-source.md`](docs/roadmap-modo-examen-source.md) por test. `EP-SPEC v0.1`
  quedó **apagado, no borrado**.

⚠️ **Antes de tocar Modo Examen:** readiness **no se calcula**. La tabla existe (ADR-011) y nadie la
escribe: los umbrales son `C01-029`. Sin card, sin score, sin porcentaje. Y **no se muestra "paso 5 de
12"** — desde `HUMAN-P0-01 v1.0` además sería falso.

**Fase B4 — ADE v1 y el reloj.** ✅ **COMPLETA** — 1 de septiembre de 2026. El **validador
determinista** rechaza toda recomendación que afirme dominio, progreso o readiness inexistente
—sus diez reglas salen de `product.md` §13 y **cada una cita su fila**—, y con él la rama `ERROR`
dejó de ser teórica. El **reloj corre** por `POST /api/reloj` con secreto de servicio comparado en
tiempo constante; `npm run reloj -- <institucion>` hace lo mismo a mano.

⚠️ **Antes de tocar el ADE:** lo que el motor escriba pasa por
`lib/domain/validador-de-recomendacion.ts` **antes de materializar**. Lo que no se puede mostrar no
se persiste.

**Fase B3 — Progreso, Bitácora y eventos.** ✅ **COMPLETA, 3 / 3** — 1 de septiembre de 2026.

- **El resultado de progreso se escribe** con sus invariantes: `I10` en el Service y en la base, `I8`
  con el duplicado declarado, y todo en una transacción con `topic_progress`.
- **El Product Event Model está declarado** en `lib/domain/product-events.ts`: los 23 eventos P0 del
  spec §16 con su uso textual, más 36 extensiones que el backend emite o conserva como legacy. De los 23 se
  emiten 9. **Antes de agregar un evento nuevo, declaralo ahí:** hay guard en las dos direcciones.
- **Una sola fuente histórica.** La Bitácora de `UX06` y la Actividad reciente de `UX02` salen de
  `hechos_de_cursada()` y comparten la traducción: `VI.6` §8.3 dice que no existe una segunda, y hay
  guard de las dos cosas.

Con una parte del objetivo **explícitamente no hecha**: mostrar las cinco dimensiones con sus valores
es `C01-019`, gate `H`, y lo responde una persona.

⚠️ **El Service recibe el resultado; no decide que hubo progreso.** `C01-018` —quién lo emite y con
qué causalidad— sigue `OPEN`. **Ninguna ruta de `Evidence` escribe progreso**, y hay un guard
estático que cubre los cuatro caminos, la maquinaria de transiciones y los triggers del schema:
`VALIDATED` no produce `ProgressUpdated`, y es el error más barato de cometer.

✅ **Resuelta por [ADR-027](docs/decisions.md#adr-027):** los ocho eventos que `product.md` §11
declaraba inexistentes **entraron al modelo** como nivel `TRANSICION`. El catálogo clasifica en
`NEGOCIO` · `TRANSICION` · `TELEMETRIA`, y los nombres históricos no se cambian: `product_event` es
append-only.

**➡️ Lo que sigue, tras las decisiones del 1 de septiembre.** El owner cerró
[ADR-011](docs/decisions.md#adr-011), [ADR-003](docs/decisions.md#adr-003) y
[ADR-027](docs/decisions.md#adr-027), y dejó [ADR-006](docs/decisions.md#adr-006) en `PROVISIONAL`.
Con eso quedó **un frente con trabajo real**, y dos que se cerraron el mismo día:

- ~~Fase B4~~ ✅ **COMPLETA** el 1 de septiembre: el **validador determinista** —que el Done exigía
  desde el primer día y no existía— y **el reloj corriendo** por `POST /api/reloj` con secreto de
  servicio. Verificado de punta a punta: un `CONFIRMED` vencido pasa a `DUE`, después a `MISSED`, y
  la tercera corrida converge.
- ~~Fase B5~~ ✅ **COMPLETA** el 1 de septiembre: la capa de examen, el protocolo como configuración
  versionada y las tres superficies conectadas.
- ~~Fase B6~~ 🟡 **DOMINIO COMPLETO** el 2 de septiembre. Lo que queda de la fase **no está
  desbloqueado para implementar**: `C01-021` para las dos reglas todavía humanas, `C01-044` (playbooks y SLA), y el
  **contrato v2** del CTO. B6.7 ya incorporó el criterio profesional a `HP0-06-1`.

Lo que **no** se puede hacer sigue siendo lo mismo: tocar un dato real. El mapa de bloqueos del
`roadmap.md` ahora dice **quién** cierra cada cosa.

**Trabajo adelantado.** B2b va **2 / 3**: la ingesta asistida del ADL y la corroboración. En B4 ya existen el ADE
v1 determinista, el reloj del lifecycle y la materialización transaccional de recomendaciones.

✅ **Las 8 decisiones psicopedagógicas están respondidas** (31 ago 2026,
[ADR-025](docs/decisions.md#adr-025)), y sus tres consecuencias de schema se cerraron con la Fase B5.

✅ **Y el 1 de septiembre llegó el texto de los veinte pasos** — el *Roadmap Modo Examen*, de la misma
profesional. Está en [`roadmap-modo-examen-source.md`](docs/roadmap-modo-examen-source.md) y corre
como `HUMAN-ROADMAP v1.0`.

⚠️ **La fuente no se corrige, ni los tipeos.** *"a desarrollae"*, *"icnorporando"*, *"Siemrpe"*: hay
un test que rompe si alguien los "arregla". Y **lo que la fuente no define no se completa** — los
veinte tienen `expected_artifact` y `criterion` en `NULL` y `requirement` en `NO_CONFIGURADA`. El
[cuadro de acciones](docs/cuadro-problemas-source.md) propone evidencias y **no se carga**: conserva
preguntas de la propia autora.

⚠️ **Su vigencia todavía no está confirmada.** El rótulo dice *"texto de la psicopedagoga · vigencia
todavía sin confirmar"*, y son tres estados distintos —del equipo, sin confirmar, confirmado—: no se
colapsan. La pregunta está arriba de todo en la
[agenda](docs/agenda-cierre-psicopedagoga.md).

⚠️ **Todo el Track B corre sobre datos sintéticos.** [ADR-006](docs/decisions.md#adr-006) sigue
`PROVISIONAL — LEGAL CONFIRMATION REQUIRED` y es bloqueo absoluto desde el primer usuario real.

**Fase B2b — Ingesta del ADL.** 🟡 **2 / 3.** La **B2b.2 cerró el invariante `I9`**: existe por fin
la operación explícita que eleva un `verification_status`, y es la única —`corroborar_procedencia()`,
append-only, con fuente concreta, motivo obligatorio y entrada de `audit_log` con antes y después.

⚠️ **Antes de tocar `verification_status`:** no lo escribas desde ningún lado. Hay guard sobre las 46
migraciones y sobre los repositorios de que **ninguna otra escritura existe**. Corregirlo "a mano"
también es una corroboración, con su fuente y su motivo.

⚠️ **A `official` no llega nadie, y no es un olvido.** Significa que la institución lo afirma, y la
Plataforma no puede autenticar a una institución: `C01-030` está `OPEN`, ADR-023 sacó la identidad de
docente y ADR-033 mandó las superficies de operador al CRM. El estado sigue en el enum y conserva su
salida; ninguna operación lo produce. **No lo hagas alcanzable.**

⚠️ **Nada vuelve a `unverified`**, y **`disputed` no es terminal**: una disputa resuelta puede volver.

⚠️ **Quién puede corroborar sigue sin definirse** (`C01-030`). `corroborated_by` es identidad externa
sin FK y `POST /api/corroboracion` va con secreto de servicio. **Nunca un JWT de estudiante:** alguien
confirmando lo que él mismo declaró no es verificación.

**Verificación de base:** `npm run db:verify` — **275 comprobaciones** contra Postgres que `npm test`
no puede hacer porque necesitan Docker. Las dos suites son distintas a propósito.

**El Done de una fase se audita, no se declara.** `tests/invariantes.test.ts` verifica el criterio de
cierre de la B2 —los 12 invariantes de `data-model.md` §11— contra el propio documento. **Los doce
tienen test** desde que la B5 migró `exam_preparation`: `I7` era el único pendiente, y el guard rompió
solo el día que la migración entró, que es para lo que estaba escrito.

La frontera ya existe: `lib/domain/` (puro) → `lib/navigation/` (grafo + 19 CTAs) →
`lib/fixtures/` (catálogo) → `app/(student)/` proyecta → `components/screens/` recibe props tipadas.
**Ninguna pantalla importa un fixture** y **`lib/navigation/` no importa `lib/fixtures/`**; hay tests
estáticos que lo verifican.

✅ **El recorrido del focus group es recorrible extremo a extremo, y ahora entero por clic.**
Conserva **una** costura declarada: `UX05` cruza el nodo `ejecución`, que no tiene pantalla. La de
`UX07` se cerró con `CTA-019` ([ADR-016](docs/decisions.md#adr-016)).

- **Track A** (clickeable, fixtures, sin backend): **sin bloqueos.** Cerrar la Fase 0 cierra el
  track — Operador e Institución se difirieron ([ADR-012](docs/decisions.md#adr-012)).
- **Track B** (backend persistente): B1–B6.7 completas en su alcance disponible y B2b en 2/3, sobre datos sintéticos.
  Todo lo que toque un dato real sigue bloqueado por [ADR-006](docs/decisions.md#adr-006).

**Stack:** Next.js 16 · React 19 · Tailwind v4 CSS-first · shadcn vendorizado · Vitest.

**`npm audit`: 0 vulnerabilidades.** Eran **3 `high`** —`next`, `postcss`, `sharp`, que eran **la
misma deuda contada tres veces**: ni `postcss` ni `sharp` estaban en `package.json`, los traía
`next`—. Se cerraron subiendo `next` y `eslint-config-next` de `16.2.6` a **`16.3.4`**, fijadas
exactas y sin tocar React.

✅ **`ACCEPTED — AMENDED AND SIGNED`** · 3 de septiembre de 2026. El CTO ratificó la
[Enmienda 1 de ADR-008](docs/decisions.md#adr-008-enmienda-1): la versión, `agentRules: false` y el
push de `feat/fase-0-track-a`. La revisión de trazabilidad se cerró el mismo día.

⚠️ **La firma autoriza el push, y nada más.** **No hay autorización de merge a la rama principal ni
de despliegue** — las dos necesitan decisión propia, y el despliegue además sigue bloqueado por
[ADR-006](docs/decisions.md#adr-006).

⚠️ **El criterio del CTO rige de acá en adelante:** un cambio puede resolverse de la manera más
simple que permita avanzar **siempre que sea explícito, trazable, reversible y verificable**. Si más
adelante hay que modificarlo, tiene que poder identificarse qué cambió, por qué y a qué afecta.

⚠️ **No corras `npm audit fix --force`.** La versión la elige el ADR, no una etapa. Todo el
resultado y la exposición real, en [`brief-adr-008-seguridad.md`](docs/brief-adr-008-seguridad.md)
§10; el resumen, en `roadmap.md` §3.1.

Superficies: `UX01`–`UX09`. **Las nueve existen** como componente real con ruta propia bajo
`app/(student)/`. **No existe `UX10`.** Las 19 CTAs son alcanzables y todos sus destinos tienen
pantalla.

El registro canónico tiene **19 CTAs**: `CTA-019` (`UX02 → UX07`) se agregó el 1 de septiembre de
2026 por [ADR-016](docs/decisions.md#adr-016). Es la única fila que no transcribe la tabla del spec
—es una corrección aprobada— y hay un test que exige que toda CTA fuera del spec tenga un ADR
`ACCEPTED` detrás.

Para ver cualquier estado crítico sin panel de debug: `?escenario=<ID>` en **cualquiera** de las
nueve rutas.

El recorrido de focus group vive en `lib/navigation/focus-group.ts`, **aparte del registro
canónico**: es el guion de una sesión, no un contrato. Queda **una** costura, dicha de frente:
`UX05` se alcanza cruzando `ejecución`, que no tiene pantalla. La otra se cerró — `UX07` ya se
alcanza por clic con `CTA-019` ([ADR-016](docs/decisions.md#adr-016)).

---

## Reglas del Track A

Cero red · cero persistencia · cero datos reales · **desktop-first** (360 px es el piso móvil,
[ADR-014](docs/decisions.md#adr-014)) · una sola CTA primaria.

---

## Tono

**Voseo rioplatense, sin excepciones.** *"Entregá"*, *"Subí"*, *"Comprometerme"*.
