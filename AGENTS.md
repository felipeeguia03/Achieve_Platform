# AGENTS.md — Reglas canónicas para agentes de IA en este repositorio

**Leé este archivo entero antes de tocar nada.** Es normativo, no orientativo.

---

## 0. Lo que tenés que saber en 30 segundos

**Achieve** es un acompañante académico para estudiantes universitarios: cada día le dice al
estudiante qué acción concreta hacer para no perder el ritmo de sus materias, con una persona real
como supervisor y fallback.

Este repositorio se trabaja con **Spec Driven Development**:

> **La fuente de verdad son los documentos markdown de `docs/`. El código sigue a la documentación,
> nunca al revés.**

Si el código y `docs/` discrepan, **el código es el defectuoso**.

---

## 1. Las seis reglas que no se rompen

### 1.1 No inventes reglas de negocio

Este proyecto tiene **41 decisiones de negocio abiertas**. El registro va de `C01-001` a
`C01-051`: 51 filas, de las cuales **41 siguen `OPEN`**, 9 están respondidas con residuo y
`C01-022` está cerrada. Las **8 decisiones psicopedagógicas** (`HUMAN-P0-01`…`08`) **fueron
respondidas** por la psicopedagoga real el 31 de agosto de 2026: se construye contra su criterio
confirmado `v1.0`, **citándolo**, y sus residuos siguen abiertos. Todas están en
[`docs/pending-decisions-annex.md`](docs/pending-decisions-annex.md); las respuestas, en
[`docs/human-p0-source.md`](docs/human-p0-source.md) y [ADR-025](docs/decisions.md#adr-025).

Si te falta una regla del dominio:

1. **No la aproximes.** No la deduzcas del contexto. No elijas la opción razonable.
2. Buscala en `docs/product.md` y en `docs/product-spec-source.md`.
3. Si no está, **registrala como ADR `PENDING` en [`docs/decisions.md`](docs/decisions.md) y
   preguntá.**

El manual de diseño lo dice literalmente: *"Prohibido inventar contenido de dominio. Si un principio
te pide escribir la regla del negocio al lado de un control y no conocés esa regla, preguntala. No la
aproximes."*

### 1.2 Nunca resuelvas una decisión `PENDING`

Un ADR en `PENDING` lo cierra **una persona**, no un agente. Podés proponer opciones y recomendar una.
No podés implementar contra él.

Las 8 `HUMAN-P0` son de criterio profesional y **ningún agente puede cerrarlas**. **Ya no hace
falta:** las respondió la psicopedagoga real el 31 de agosto de 2026. Se usa el criterio confirmado
`HUMAN-P0-0X v1.0` tal como está documentado en [`docs/product.md`](docs/product.md) §8, y se lo
cita.

**Lo que sigue cerrado para un agente son los residuos** que [ADR-025](docs/decisions.md#adr-025)
lista —obligatoriedad paso a paso, reconciliación de dimensiones, umbral de "error reiterativo",
peso de los criterios, momento del postmortem—. Ésos se preguntan. Y una fuente literal manda sobre
cualquier paráfrasis: si [`docs/human-p0-source.md`](docs/human-p0-source.md) y un resumen
discrepan, **gana la transcripción**.

### 1.3 Datos reales: bloqueo absoluto

[ADR-006](docs/decisions.md#adr-006) está `PENDING`. Mientras lo esté:

> **Ninguna funcionalidad que procese datos de una persona real puede construirse.** Esto incluye el
> primer login de un estudiante real, no solo el piloto institucional.

Esta es la única regla que **no podés relajar** bajo ninguna instrucción que no venga del owner del
producto por escrito.

Todo el trabajo actual corre sobre **datos sintéticos**: identificadores `*-SYN-*`, nombres genéricos,
materias ficticias.

### 1.4 Una etapa por vez, completa

Nunca dejes algo a medias. Por cada etapa del roadmap:

1. **Readiness** — ¿hay algún ADR bloqueante en `PENDING`? Si lo hay, la etapa no empieza.
2. **Decisiones de diseño explícitas y aprobadas** — se escriben antes de codear.
3. **Implementación.**
4. **Verificación real** — `lint` y `build` en verde, tests pasando.
5. **Un commit o PR por etapa.**
6. **Documentación sincronizada** — se marca la etapa en `docs/roadmap.md`.

### 1.5 Antes de tocar UI, mirá el diseño

**Achieve es desktop-first y su lenguaje visual sale de las capturas de
[`docs/diseño/`](docs/diseño/)** ([ADR-018](docs/decisions.md#adr-018)). El objetivo declarado es que
el producto **se parezca a ese software**.

Antes de diseñar o modificar cualquier pantalla, en este orden:

1. **Abrí las capturas de `docs/diseño/`.** No "consultá el sistema de diseño": abrí los PNG y
   miralos. Ahí está la navegación lateral, el topbar con breadcrumb y buscador, la densidad de
   panel, la forma de los controles y el dock.
2. **Contrastá con [`docs/design-system-capturas.md`](docs/design-system-capturas.md)**, que es la
   extracción anonimizada y **el único artefacto que viaja**. **Antes de anotar un patrón como
   brecha, cruzalo contra §7.4 y §11.3** —lo que Achieve descarta y lo que no se copia aunque esté
   bien hecho—. Un patrón visible en una captura **no es** un patrón a construir: el dock estaba
   descartado en tres lugares y aun así entró al roadmap ([ADR-019](docs/decisions.md#adr-019)).
3. **Si `docs/diseño/` está vacía, decilo y frená.**

> ⚠️ **La carpeta no está versionada.** Contiene datos de un sistema real y
> [ADR-006](docs/decisions.md#adr-006) la mantiene fuera del repositorio. En una máquina que no sea
> la del owner, **vas a encontrarla vacía**.
>
> Cuando eso pase: **decí que no tenés las capturas y pará.** No improvises un lenguaje visual, no lo
> deduzcas de lo que ya existe en el repo, no sigas como si nada. *"No tengo las capturas para
> mirar"* es la respuesta correcta; inventar un diseño no lo es.

**Dos cosas que no se hacen nunca:**

- **No commitees las capturas**, ni recortadas ni difuminadas a ojo. ADR-006 exige anonimización
  **verificable**.
- **No copies su contenido de dominio.** De ahí se toma el **mecanismo visual** —cómo se ve, cómo se
  ordena, cómo se comporta—, jamás sus marcas, expedientes, clientes ni nombres.

**Qué manda cuándo.** Las capturas y las specs `VI.*` no hablan de lo mismo:

| Pregunta | Manda |
|---|---|
| **Qué dice la pantalla** — objeto, estado, CTA, qué se omite, qué no se promete | La spec `VI.*`. Las capturas **no tienen autoridad de dominio** |
| **Cómo se ve** — shell, densidad, tipografía, espaciado, forma de los controles | Las capturas, y su extracción versionada |

Si los dos hablan del mismo píxel, gana la spec ([ADR-015](docs/decisions.md#adr-015)) **y el choque
se registra** en `design-system-capturas.md` §12. No se resuelve en silencio.

### 1.6 No reescribas lo que ya funciona

En particular: **no reescribas `components/screens/*` ni `app/globals.css`** salvo que el roadmap lo
pida explícitamente. `globals.css` tiene una auditoría de contraste WCAG AA **medida** anotada en el
propio código. Los componentes de `components/ui/` son un registro shadcn vendorizado: **no se
editan**.

---

## 2. Los invariantes del dominio

Estos son los que se violan sin darse cuenta. Cada uno es una regla del spec, no una opinión.

### 2.1 La cadena de no-implicación

> **Preparar contenido no es enviarlo. Enviar no es demostrar suficiencia. Suficiencia no es
> validación. Validación no es dominio.**

Concretamente:

- Aceptar una `Action` **no** crea un `Commitment`.
- Un `Commitment` `COMPLETED` **no** implica que exista `Evidence`.
- `Evidence` `SUBMITTED` **no** implica suficiencia ni revisión.
- `UNDER_REVIEW` **exige una revisión real creada**. Un método humano *configurado* no alcanza.
- `VALIDATED` **no** produce `ProgressUpdated` ni completa un `ProtocolStep`.
- `ProtocolStepCompleted` **no** implica progreso.
- Un `ProtocolStep` **no** crea una `Action`.

### 2.2 La UI proyecta; nunca decide

Ninguna superficie rankea, prioriza, calcula elegibilidad ni genera una `Action`. Las vistas releen
resultados autoritativos.

Si el backend devuelve varias recomendaciones sin una principal, eso es un **error de contrato**: se
muestra un error técnico. **No se elige una.**

Lo único que la UI sí resuelve es la **precedencia operativa de lifecycle**, que es determinista y
está especificada en `docs/product.md` §10.2.

**Una CTA cuya condición de aparición no se cumple no se renderiza.** No deshabilitada, no en gris:
no está. Distinto es la **habilitación**: si la CTA aparece pero falta algo que el estudiante puede
completar en esa misma pantalla, se renderiza deshabilitada con tratamiento propio (`A-08`). El
registro canónico vive en `lib/navigation/cta-registry.ts`.

### 2.3 Ningún estado se escribe por inferencia del cliente

- Un timer local **no** completa un `Commitment`.
- El paso del tiempo **no** produce `DUE` ni `MISSED`.
- Un upload exitoso **no** produce `SUBMITTED`.
- El frontend **no** marca `ACCEPTED` hasta recibir confirmación del owner.

### 2.4 No Cortar

**Un `Commitment` `MISSED` nunca se edita para parecer cumplido.** Su única salida es `CLOSED`. El
rescate es un objeto separado que preserva el original.

Renegociar **antes** del vencimiento es válido y **crea un Commitment nuevo**; el original queda
`RENEGOTIATED`. Editar después para ocultar el incumplimiento no es válido.

### 2.5 Sin datos no es cero

Cuatro estados distintos que nunca se colapsan:

| Estado | No es |
|---|---|
| No hay dato | No es `0` |
| No cargó todavía (error de lectura) | No es "no hay dato" |
| Existe pero no evaluado | No es "bajo" |
| Cero real | Es `0`, un valor legítimo |

*"Dominio: no evaluado"* ≠ *"Dominio: bajo"* ≠ *"Dominio: no disponible"* ≠ `0`.

### 2.6 La provenance es parte del dato

`source_type`, `verification_status` y el contexto de observación son **tres datos distintos**.

- Un reporte del alumno registrado durante una clase **no** se convierte en voz de la cátedra.
- **Ninguna capa eleva un `verification_status`.** Enviar una corrección no vuelve `official` a un
  reporte del estudiante.
- Los enums técnicos (`official`, `unverified`, `disputed`…) **nunca** aparecen como copy visible.

### 2.7 Omitir, no inventar

Cuando falta un contrato, la línea **desaparece**. Nunca se rellena con un placeholder que parezca un
dato. Si falta `estimated_duration`, no se muestra la línea de tiempo. Si falta `expected_evidence`,
no se inventa el requisito. Si falta `human_assignment`, se omite la identidad humana **por completo**.

### 2.8 No prometas lo que no podés sostener

Prohibido: *"Agus la revisará hoy"* sin assignment ni SLA · *"Te contactaremos en breve"* ·
*"Estamos calculando"* sin proceso real · *"Listo para rendir"* · *"5 de 12"* del protocolo ·
*"Dominaste la unidad"* sin prueba aplicable.

La lista completa está en `docs/product.md` §13.

---

## 3. Mapa de la documentación

| Documento | Qué contiene | Cuándo leerlo |
|---|---|---|
| [`docs/product.md`](docs/product.md) | Glosario, roles, máquinas de estado, scope, copy prohibido | **Siempre.** Antes de escribir cualquier lógica de dominio |
| [`docs/architecture.md`](docs/architecture.md) | Arquitectura, capas, contratos pendientes | Antes de tocar estructura |
| [`docs/data-model.md`](docs/data-model.md) | Entidades, relaciones, schema, invariantes | Antes de tocar datos |
| [`docs/design-system.md`](docs/design-system.md) | Tokens, primitivas, principios, auditoría | Antes de tocar UI |
| [`docs/roadmap.md`](docs/roadmap.md) | Fases, etapas, bloqueos, estado | Antes de empezar cualquier trabajo |
| [`docs/decisions.md`](docs/decisions.md) | ADRs numerados | **Siempre.** Para saber qué está bloqueado |
| [`docs/domain-translation-dd1-dd10.md`](docs/domain-translation-dd1-dd10.md) | Las respuestas `DD1`–`DD10` que el manual de diseño exige | Antes de aplicar un principio del manual |
| [`docs/pending-decisions-annex.md`](docs/pending-decisions-annex.md) | Las 51 `C01` — **42 abiertas**, 9 respondidas | Cuando dudes si algo está decidido |
| [`docs/human-p0-source.md`](docs/human-p0-source.md) | **Fuente literal** de las 8 respuestas psicopedagógicas | Antes de escribir contenido del protocolo de examen |
| [`docs/design-system-capturas.md`](docs/design-system-capturas.md) | Extracción visual anonimizada + §12, las decisiones de diseño abiertas | Antes de tocar layout, espaciado o la posición de una CTA |
| **`docs/diseño/*.png`** | **Las 34 capturas: la fuente del lenguaje visual.** No versionadas ([ADR-006](docs/decisions.md#adr-006)) | **Siempre, antes de tocar UI.** Ver §1.5 |
| [`docs/platform-integration-contract.md`](docs/platform-integration-contract.md) | Contrato máquina-a-máquina vigente Plataforma ↔ CRM | Antes de tocar registro, elegibilidad o integración CRM |
| [`docs/guion-focus-group.md`](docs/guion-focus-group.md) | El recorrido de sesión y el test de 10 segundos por pantalla | Antes de correr un focus group |

### Documentos de referencia — **no se editan**

| Documento | Qué es |
|---|---|
| `docs/product-spec-source.md` | Spec maestro, ~14.900 líneas, nueve partes |
| `docs/design-system-source.md` | Manual de diseño normativo |

El manual HTML y las capturas originales no se versionan: contienen datos de un sistema real. Solo
pueden incorporarse después de anonimización verificable, conforme a ADR-006.

---

## 4. Vocabulario canónico

**Un concepto = una palabra**, en el código, en la UI, en los commits y en la documentación. La deriva
de vocabulario es el anti-patrón `A-04`.

| Se dice | Nunca |
|---|---|
| `Action` | tarea, actividad, to-do |
| `Commitment` | promesa, cita, evento |
| `Evidence` | entrega, adjunto, archivo |
| `Reflection` | comentario, nota, diario |
| `Assessment` | examen, prueba *(en código; en UI se dice "evaluación")* |
| `ExamPreparation` | plan de examen, modo estudio |
| `ProtocolStep` | hito, fase, etapa |
| `TopicProgress` | avance, porcentaje |
| `CourseEnrollment` | materia *(en código; en UI se dice "materia")* |
| `Operador` | coach, tutor, mentor — **ver [ADR-003](docs/decisions.md#adr-003)** |

Glosario completo: `docs/product.md` §3.

**Tono de la UI: voseo rioplatense, sin excepciones.** *"Entregá"*, *"Subí"*, *"Comprometerme"*.
Regla `C-01`; el anti-patrón `A-05` es exactamente una grieta de tono en la pantalla más importante.

---

## 5. Estado actual del proyecto

**Fases B1–B6.7: ✅ completas en su alcance disponible.** No queda otra etapa desbloqueada: B7
espera el dictamen legal de ADR-006 y B2b.2 espera un owner para corroboración. B6.7.4 dejó la
replanificación versionada y la reentrada explicada antes de mover el recorrido.

Track A y la Fase A2 están cerrados: las nueve superficies existen, todos los estados críticos son
alcanzables y el test de comprensión de 10 segundos fue reportado `PASS` por el owner.

En el Track B, hoy:

- **Las nueve superficies leen de Postgres** con sesión real, cada una con una función de lectura
  propia, y ninguna cae al fixture en silencio. El catálogo sintético sigue disponible bajo
  `?escenario=`. `UX07`–`UX09` se conectaron en la Fase B5.
- **Modo Examen existe.** El protocolo es **configuración versionada**: sus pasos se cargan con
  `INSERT`, nunca se hardcodean. Hoy corre `HUMAN-ROADMAP v1.0`, **los veinte pasos con el texto
  literal de la psicopedagoga** ([ADR-031](docs/decisions.md#adr-031)), rotulado en pantalla como
  *vigencia todavía sin confirmar*. ⚠️ **Readiness no se calcula:** sin card, sin score, sin
  porcentaje, y **nunca "paso 5 de 12"**.
- **La fuente pedagógica no se corrige.** Ni la redacción ni los tipeos: `docs/*-source.md` existen
  para que quien los lea encuentre lo que la profesional escribió. Y **lo que la fuente no define no
  se completa** — evidencia esperada, criterio de cierre y obligatoriedad de los veinte pasos entraron
  vacíos. Hay tests que rompen en las dos direcciones.
- **Riesgo e intervención existen, y ningún motor los dispara.** `C01-021` y `C01-036` están
  abiertos: las tres reglas de `HUMAN-P0-06 v1.0` son configuración **sin umbral** y hay guard
  estático contra agregar un evaluador. Los playbooks tampoco: `C01-044` dice *"no se inventan
  valores"*. ⚠️ **Una señal sin causa no existe** —`CHECK` en la base—, **cerrar una intervención sin
  outcome no es un camino posible**, y el riesgo en `UX01` **sólo cambia el estado general**.
- **Repetir un paso no es retroceder.** Cada vuelta es un hecho más
  ([ADR-028](docs/decisions.md#adr-028)); el copy dice *"volviste sobre"*, nunca *"repetiste"*.
- **El loop diario está persistido entero** — `Action`, `Commitment`, `Evidence` y `Reflection`,
  esta última desde que [ADR-026](docs/decisions.md#adr-026) decidió `C01-051`.
- **El progreso se escribe con sus invariantes** y `UX06` lo proyecta. ⚠️ **El Service recibe el
  resultado; no decide que hubo progreso:** `C01-018` sigue `OPEN`. Ninguna ruta de `Evidence`
  escribe progreso, con guard.
- **El Product Event Model está declarado** en `lib/domain/product-events.ts`: 23 eventos P0 del
  spec §16 más 18 extensiones que el backend emite y el P0 no lista. Antes de agregar un evento,
  declaralo ahí.
- **B2b va 1/3**, y el ADE v1, su materialización y el reloj del lifecycle se construyeron por
  adelantado en B4.

Dónde vive cada cosa hoy:

| Carpeta | Qué es |
|---|---|
| `lib/domain/` | Tipos, las 4 máquinas de estado, `selectHeroLevel`, y los view models de `UX01`–`UX06`. **Puro:** sin React, sin I/O |
| `lib/content/` | El copy con ID tipado (regla `C-07`) |
| `lib/navigation/` | El grafo del Golden Path y el registro de las 19 CTAs. **No importa `lib/fixtures/`** |
| `lib/fixtures/` | El catálogo de escenarios sintéticos. **Ninguna pantalla importa de acá** |
| `components/screens/` | Las 9 superficies, con props tipadas |
| `app/(student)/` | Una URL por superficie; la ruta lee el escenario y lo proyecta |

Dos tracks con costos muy distintos:

- **Track A** — experiencia clickeable con fixtures, sin backend, para focus groups.
  **Cerrado.** La Fase 0 quedó completa; las vistas de Operador e Institución se difirieron al
  Track B ([ADR-012](docs/decisions.md#adr-012)).
- **Track B** — backend, auth, persistencia y ADE. Avanza bajo [ADR-024](docs/decisions.md#adr-024)
  exclusivamente con datos sintéticos. [ADR-006](docs/decisions.md#adr-006) sigue siendo bloqueo
  absoluto para cualquier dato de una persona real.

**Stack decidido:** Next.js 16 App Router, React 19, Tailwind v4 CSS-first, shadcn vendorizado,
Vitest ([ADR-008](docs/decisions.md#adr-008)).

### Reglas del Track A

- **Cero red.** Sin `fetch`, `XMLHttpRequest` ni `WebSocket`.
- **Cero persistencia.** Sin `localStorage`, `sessionStorage` ni `IndexedDB`.
- **Cero datos reales.** Solo identificadores sintéticos.
- **Desktop-first** ([ADR-014](docs/decisions.md#adr-014)). El viewport primario de diseño y de
  verificación es desktop; **360 px es el piso obligatorio** de la variante móvil, no la medida de
  referencia. El contrato del primer viewport de `docs/design-system.md` §6.1 es de **orden
  semántico** y rige en todo ancho.
- **El lenguaje visual sale de `docs/diseño/`** ([ADR-018](docs/decisions.md#adr-018)). Se miran las
  capturas antes de diseñar. Si no están, se dice y se para. Ver §1.5.
- **Una sola CTA primaria** por pantalla y por estado.

### Las nueve superficies

`UX01` Hoy · `UX02` Materia/Cursado · `UX03` Próxima Acción · `UX04` Compromiso · `UX05` Evidencia ·
`UX06` Progreso/Bitácora · `UX07` Activación Modo Examen · `UX08` Modo Examen/Overview ·
`UX09` Paso de Protocolo.

**Las nueve existen** como componente real con ruta propia.

**Hay tres matrices de precedencia distintas y no se mezclan**, porque son tres documentos
normativos con owners distintos:

| Módulo | Superficie | Niveles |
|---|---|---|
| `lib/domain/precedence.ts` | `UX01` — el día del estudiante | 9 |
| `lib/domain/overview-precedence.ts` | `UX08` — una preparación concreta | 10 en 14 filas |
| `lib/domain/step-precedence.ts` | `UX09` — un paso del protocolo | 11 en 14 filas |

Las dos últimas **no comparan materias**. Unificarlas haría que un cambio en una spec alterara la
otra pantalla en silencio.

Mapeo canónico: `WF-S10 → UX08`, `WF-S11 → UX09`. **No existe `UX10`.**

---

## 6. Convenciones de código

- **TypeScript estricto.** Sin `any` sin justificación escrita.
- **`lib/domain/` es puro:** sin I/O, sin React, sin fetch. Testeable en aislamiento.
- **Las pantallas nunca importan un fixture directamente.** Reciben props tipadas. Esta frontera es
  lo que hace barato el Track B.
- **Las máquinas de estado son tablas de transición explícitas**, no `if` encadenados. Las
  transiciones prohibidas tienen test.
- **Arquitectura implementada de Track B, ratificada por ADR-005:** Controller →
  Service → Repository; el frontend habla por `/api/*` y no accede a tablas de negocio. Las reglas
  viven en Service y el acceso a Postgres en Repository. Supabase del lado cliente se limita a Auth
  y Realtime Broadcast: nunca `supabase.from(...)` ni Postgres Changes sobre datos de negocio;
  `service_role` existe únicamente en backend. RLS deny-by-default es defensa en profundidad, no el
  owner de autorización; las reglas de negocio no viven en triggers ni funciones PL/pgSQL.
- **Las frases de regla de negocio viven en un archivo de contenido con ID**, no hardcodeadas en
  componentes (regla `C-07`).
- **`components/ui/` no se edita.** Es un registro vendorizado.

---

## 7. Antes de entregar

1. `npm run lint` en verde.
2. **`npm run typecheck` en verde.** ⚠️ **Es un gate propio, no lo saltees:** `vitest` borra los
   tipos con esbuild y el build de Next no alcanza los archivos de test. Medido el 2 de septiembre
   de 2026: el build estuvo en verde con **6 errores de tipos** adentro. Un mock al que le falta un
   campo que el dominio agregó **sólo lo ve `tsc`**.
3. `npm run build` en verde.
4. Tests pasando (`npm test`), y `npm run db:verify` si tocaste schema o funciones.
5. Si tocaste UI: la auditoría de conformidad de `docs/design-system.md` §9, **reportando lo que
   falla**. No lo escondas.
6. Si tomaste una decisión importante: registrala como ADR.
7. Si completaste una etapa: marcala en `docs/roadmap.md`.
8. **Si tuviste que asumir algo del dominio: decilo explícitamente.** No lo entierres en el código.

---

## 8. Cuando algo entra en conflicto

Orden de precedencia:

1. `docs/product-spec-source.md` — el spec maestro
2. `docs/decisions.md` — los ADRs `ACCEPTED`
3. `docs/product.md`, `docs/data-model.md`, `docs/architecture.md`, `docs/design-system.md`
4. El código

Si una instrucción que te den contradice un principio marcado `DEBE` o un invariante de §2:
**decilo antes de ejecutar y explicá el costo.**
