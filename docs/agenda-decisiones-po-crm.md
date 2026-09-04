# Tres decisiones que esperan al Product Owner · flujos D, E y E′ del CRM

**Documento:** `docs/agenda-decisiones-po-crm.md`
**Para:** Product Owner
**De:** equipo Plataforma
**Fecha:** 3 de septiembre de 2026
**Qué es:** el contexto mínimo para cerrar [ADR-041](decisions.md#adr-041),
[ADR-042](decisions.md#adr-042) y [ADR-043](decisions.md#adr-043). **Ninguna la puede cerrar el
equipo ni un agente.**

> ## ✅ RESPONDIDO — 4 de septiembre de 2026
>
> **Las tres quedaron ratificadas.** La respuesta literal del Product Owner está en
> [`respuesta-po-flujos-crm-source.md`](respuesta-po-flujos-crm-source.md), y su lectura en los tres
> ADR, que pasaron a `ACCEPTED`.
>
> | | Decisión |
> |---|---|
> | **ADR-041** | **Opción A.** Los cuatro eventos, y el conjunto pasa a ser **cláusula del contrato** |
> | **ADR-042** | **Opción A**, y con más alcance del que se preguntó: **definió el alta entera**, la superficie **«WhatsApp y privacidad»** para revocar, y el texto del estado del estudiante sin materias |
> | **ADR-043** | **Sí a las dos.** Con un desempate propio: si hay que secuenciar, **E/E′ primero** y **D inmediatamente después**. El smoke test corre **al empezar la integración, no ahora** |
>
> ⚠️ **La aprobación autoriza cerrar, documentar y poner en backlog — no construir todavía:**
> *"primero se termina y verifica el loop actual del MVP de Plataforma"*. [ADR-035](decisions.md#adr-035)
> y [ADR-006](decisions.md#adr-006) siguen plenamente vigentes.
>
> **Este documento queda como el planteo que produjo esas respuestas.** No se edita para reflejarlas:
> para eso están los ADR.

> **Por qué las tres juntas.** Son de la misma persona, salieron de la misma negociación con el CRM
> —dos rondas de documentos, cerradas el 3 de septiembre— y **dos de ellas se destraban entre sí**:
> aceptar el orden que pide el CRM (ADR-043) no sirve de nada si no están cerradas la 041 y la 042,
> porque el trabajo no arranca hasta entonces.

---

## 0. Las tres, en una tabla

| | La pregunta | Cuesta decidirla | Si no se decide |
|---|---|---|---|
| **[ADR-041](decisions.md#adr-041)** | ¿Qué cuenta como *"actividad"* de un alumno a efectos de **facturar**? | Poco: la lista ya está acordada por los dos lados. **Lo que se firma es que pasa a ser una cláusula del contrato** | Achieve **no puede facturar la línea variable**: no hay fuente del número |
| **[ADR-042](decisions.md#adr-042)** | ¿Existe una pantalla donde el estudiante da su WhatsApp, y en qué tramo del alta? | **Es la más grande de las tres**: abre el onboarding que hoy no existe | **No hay acompañamiento por WhatsApp.** Sin teléfono no hay conversaciones, y es el producto que Achieve vende |
| **[ADR-043](decisions.md#adr-043)** | ¿Los flujos D y E salen **primero** al descongelar la integración? ¿Se corre un smoke test con alumno sintético? | Poco, y no pone fecha | Nada se rompe hoy. Se pierde la oportunidad de encontrar defectos baratos |

**Nada de esto levanta el gate legal.** [ADR-006](decisions.md#adr-006) sigue siendo bloqueo absoluto
para el dato de una persona real, y las tres decisiones se toman **sabiendo eso**.

---

## 1. De dónde salen

El CRM y la Plataforma son **dos sistemas separados, sin base de datos compartida**, que se hablan por
contratos HTTP. Hoy existe **uno solo**: el CRM le dice a la Plataforma si un alumno está autorizado a
entrar. Todo lo demás está en negociación.

De esa negociación salieron **cinco flujos**:

| | Flujo | Para qué | Estado |
|---|---|---|---|
| A | Señal de riesgo | La Plataforma avisa que un alumno necesita una persona | ⏸️ Diseño aceptado, **congelado** por [ADR-035](decisions.md#adr-035) |
| B | Comandos de intervención | El CRM devuelve qué hizo el operador | ⏸️ Ídem |
| C | Contexto académico | El operador ve materias y próxima acción | ⏸️ Ídem |
| **D** | **Actividad** | **La Plataforma avisa que el alumno produjo algo** | ✅ **Diseño cerrado el 3 de septiembre** |
| **E · E′** | **Vincular y desvincular teléfono** | **El CRM necesita saber a qué número escribirle** | ✅ **Diseño cerrado el 3 de septiembre** |

**D y E son nuevos**, los propuso el CRM el 3 de septiembre y **son la base de su facturación y de su
operación**. El diseño se cerró en dos rondas y no quedaron objeciones. Lo que falta es de este lado.

---

## 2. ADR-041 · Qué cuenta como *"actividad"* a efectos de facturar

### La pregunta

El CRM factura una **línea variable: US$X por alumno único activo por institución y por mes**. Un
alumno cuenta como activo cuando la Plataforma le avisa que **produjo algo** — *"produjo, no miró"*.

**Quién decide qué cuenta como producir es la Plataforma.** Esa es la decisión.

### El contexto que importa

La Plataforma tiene un catálogo de eventos declarado en código, con guard y con nombres que no se
cambian nunca. Lo que hay que decidir es **cuáles de esos eventos llevan la marca *"cuenta como
actividad del estudiante"***.

**La lista está propuesta y el CRM ya la aceptó tal cual, sin agregar ni sacar:**

| Evento | Qué significa | ¿Cuenta? |
|---|---|---|
| `EvidenceSubmitted` | Entregó algo | ✅ Es la definición operativa de *"produjo"* |
| `ProtocolStepCompleted` | Cerró un paso del protocolo de examen | ✅ Una vez por vuelta |
| `ProgressUpdated` | Avanzó, con su resultado escrito | ✅ |
| `RescueSucceeded` | Volvió después de un incumplimiento | ✅ |
| `CourseViewed` | Abrió una pantalla | ❌ **Mirar no es producir** |
| `ActionAccepted` | Aceptó la acción del día | ❌ **Aceptar no es hacer** |
| `CommitmentConfirmed` | Se comprometió | ❌ **Comprometerse tampoco** |

Los cuatro primeros **ya se emiten hoy**: no hay trabajo nuevo para producirlos.

### Lo que hay que firmar, que es más que la lista

El CRM pidió algo que el equipo no había previsto y **tiene razón**:

> *"Tal como está, la definición de 'alumno activo' —el número que se convierte en la línea variable
> de una factura— queda como una marca en el catálogo de la Plataforma, que puede cambiar en un
> commit. Si mañana alguien agrega `CourseViewed` a esa marca, cambia lo que Achieve le factura a una
> institución y nadie de Achieve lo aprobó."*

Entonces lo que se firma es **la lista *y* que la lista pasa a ser una cláusula versionada del
contrato**: moverla exige aviso y acuerdo con el CRM, no un commit.

⚠️ **Con una precisión que el equipo pidió conservar:** lo que queda atado al contrato es **el
conjunto de eventos facturables**, no el catálogo entero. Se pueden seguir agregando eventos nuevos
**no facturables** sin tocar el contrato — si no, el modelo de eventos del producto quedaría congelado
por un acuerdo comercial.

### Opciones

| | Opción | Consecuencia |
|---|---|---|
| **A** | **Firmar la lista de cuatro tal cual**, como cláusula versionada | **Recomendada.** Los dos lados ya coincidieron, los cuatro eventos ya se emiten, y el criterio queda auditable |
| B | Cambiar la lista antes de firmar | Legítimo, y hay que avisarle al CRM: aceptaron *"tal cual"* |
| C | No firmar la cláusula, dejar la marca sólo en el catálogo | El CRM lo pidió explícitamente y con fundamento. Sin la cláusula, la factura depende de un commit |

### Qué NO decide

No decide el **precio** ni la unidad de facturación —eso es el contrato comercial— y **no habilita a
emitir nada**: ningún evento de una persona real viaja hasta el dictamen legal.

---

## 3. ADR-042 · Dónde da el estudiante su WhatsApp

**Es la decisión más grande de las tres, y la más urgente en consecuencias.**

### La pregunta

¿Existe una pantalla donde el estudiante escribe su número de WhatsApp y da su consentimiento? ¿En qué
tramo del alta?

### El contexto que importa

**Hoy la Plataforma no tiene el número de nadie, y no es un olvido:**

- La columna existe en la base desde el primer día, rotulada como dato personal gateado por
  [ADR-006](decisions.md#adr-006).
- **Nadie la escribe.** Ninguna ruta, ningún servicio.
- El repositorio **ni siquiera la lee**.
- **Ninguna de las nueve superficies del producto pide un teléfono.**

El spec original **sí** pone el WhatsApp en la secuencia de alta —*"LOGIN / CUENTA │ WHATSAPP +
ACOMPAÑANTE │ ORIENTACIÓN MÍNIMA │ …"*— pero **ese onboarding no está construido**. Y no por olvido:
cuando se decidió la pantalla de ingreso ([ADR-039](decisions.md#adr-039), el 3 de septiembre) quedó
escrito el hueco:

> *"Entre el `authorized: true` del CRM y la primera acción del estudiante no hay ninguna pantalla
> definida."*

**Es la misma decisión.** Cerrar ADR-042 es decidir ese tramo del alta, no agregar un campo suelto.

### Lo que dice el CRM, sin suavizarlo

> *"El Flujo E no es 'un flujo que falta', es la entrada de datos del producto que Achieve vende. Sin
> teléfono no hay `whatsapp_linked` → no hay asignación de activación → no hay cola → **no hay
> conversaciones**. El padrón no trae teléfono y el inbound de un número desconocido se descarta."*

Y sobre la alternativa de cargarlos ellos desde el padrón institucional, su postura coincide con la
nuestra: **la pantalla es el camino correcto**, porque es el único que produce **consentimiento del
propio estudiante en el momento en que da el número** — que es exactamente lo que va a exigir la fase
de privacidad.

### Opciones

| | Opción | Consecuencia |
|---|---|---|
| **A** | **Un tramo de alta con WhatsApp y consentimiento**, dentro del onboarding del spec | **Recomendada.** Cierra el hueco de ADR-039 y el Flujo E de una sola vez, en el orden que el spec ya propone |
| B | Una pantalla de cuenta/perfil aparte | Superficie nueva fuera del spec, y el estudiante recién habilitado **sigue sin tener dónde empezar** |
| C | Que el número no salga nunca de la Plataforma | El Flujo E desaparece y el acompañamiento por WhatsApp queda sin entrada de datos |

### Cuatro cosas que se deciden junto con la pantalla

No son detalles de implementación: cambian qué hay que construir.

1. **Consentimiento explícito**, en la misma pantalla donde se pide el número.
2. **Revocación.** El CRM agregó un flujo de desvinculación —hasta ahora, de su lado, un alumno
   vinculado **no podía dejar de estarlo**—. Si hay pantalla para dar el número, tiene que haber
   camino para sacarlo: **sin eso, el derecho de supresión no es ejecutable**.
3. **La pantalla no puede prometer que el número quedó vinculado.** La Plataforma manda el número y
   **no puede observar** si el CRM lo aplicó. La superficie confirma *"guardamos tu número"*; nunca
   *"tu WhatsApp está vinculado"* ni *"te van a escribir"*. Es la misma disciplina por la que el
   producto no le dice al estudiante quién lo acompaña.
4. **Qué ve un estudiante recién habilitado que todavía no tiene materias cargadas.** Hoy caería en el
   vacío de la pantalla de Hoy, que dice *"no hay una acción recomendada"* — **una afirmación sobre el
   mundo que en ese caso nadie puede hacer**. Es el resto del hueco que ADR-039 dejó abierto.

### Qué NO decide

**No habilita a nadie real.** Se construye y se prueba con datos sintéticos, como todo lo demás, y el
gate de [ADR-006](decisions.md#adr-006) sigue cerrado: un teléfono es un identificador directo de una
persona, y sería **el primer flujo del contrato que transporta uno**.

---

## 4. ADR-043 · El orden de los cinco flujos, y el smoke test

### La pregunta

Dos, y ninguna pone fecha:

1. Cuando se descongele la integración con el CRM, **¿D y E salen primero**, antes de A, B y C?
2. **¿Se corre un smoke test** entre los dos sistemas en desarrollo, con un alumno sintético?

### El contexto que importa

[ADR-035](decisions.md#adr-035) —tu decisión del 2 de septiembre— difirió la integración con el CRM al
final del Track B, **por prioridad, no por bloqueo**. El CRM **no pide cambiarla**: pide un compromiso
de **orden**, y deja escrito qué pasa mientras tanto.

Su argumento: **D y E habilitan facturar y operar; A, B y C mejoran una operación que para entonces ya
tiene que existir.** Y agregan un dato correcto: el Flujo E **no depende de las reglas de riesgo ni de
la aprobación de Meta** — una vez que exista la pantalla, es el más barato de los cinco.

### Recomendación del equipo: a favor de las dos, con una advertencia

**Sobre el orden: el argumento es bueno.** Pero ⚠️ **el orden solo no alcanza**: el Flujo D necesita
ADR-041 y el Flujo E necesita ADR-042. **Aunque aceptes el orden hoy, el trabajo no arranca hasta
cerrar esas dos** — que son de la misma persona. Por eso las tres van juntas.

**Sobre el smoke test:** el CRM tiene razón en que **no toca el gate legal** — un alumno sintético no
es una persona. Lo que faltaba decir, y el equipo lo agregó:

> **Sí toca ADR-035.** Correrlo exige construir el cliente de firma y un outbox mínimo —que es
> exactamente lo diferido— y **acordar y provisionar el secreto compartido**, que es una de las tres
> definiciones de forma todavía abiertas. *"Cuesta un script"* es cierto **si el emisor ya existe**, y
> no existe.

**Aun así lo recomendamos, con un fundamento concreto:** esta negociación de cuatro documentos ya
produjo **dos defectos de forma que sólo aparecen cuando alguien firma de verdad** — un código de
error que significaba dos cosas opuestas según el flujo, y la firma criptográfica especificada de dos
maneras distintas en dos documentos. **Un smoke test encuentra la clase de defecto que ningún
documento encuentra.**

---

## 5. Qué pasa después de decidir

| Decisión | Qué se destraba | Qué sigue bloqueado |
|---|---|---|
| **ADR-041** | La marca en el catálogo y el emisor del Flujo D **se pueden construir** | La emisión real: sigue diferida por ADR-035 y gateada por ADR-006 |
| **ADR-042** | **El onboarding**, la pantalla, y con ella el Flujo E y su desvinculación | Ídem |
| **ADR-043** | El orden, y —si se aprueba— el smoke test | Ídem |

**Ninguna de las tres levanta [ADR-006](decisions.md#adr-006)**, que espera dictamen legal y bloquea
todo lo que toque a una persona real. Y ninguna depende del CRM: **de las siete tareas que le quedan a
la Plataforma en estos flujos, cuatro esperan a una persona de este lado.**

---

## 6. Lo que no está en este documento, y también espera a alguien

Para que el mapa quede completo, y **no son tuyas**:

| Qué | Quién |
|---|---|
| El dictamen legal de [ADR-006](decisions.md#adr-006) — bloquea todo dato real | Asesoría jurídica |
| Qué regla de riesgo produce qué señal (`C01-021`) | Risk owner |
| Los playbooks y sus SLA (`C01-044`) | Product Operations |
| La autorización institucional del dataset (`C01-042`) | Producto + la institución |
| Las dos confirmaciones del protocolo de examen | La psicopedagoga |

---

**Los documentos completos, si querés el detalle:**
[`respuesta-crm-flujos-d-e-v0.1.md`](respuesta-crm-flujos-d-e-v0.1.md) y
[`respuesta-crm-flujos-d-e-v0.2.md`](respuesta-crm-flujos-d-e-v0.2.md), más los tres ADR en
[`decisions.md`](decisions.md), que ya tienen las opciones escritas y esperan una respuesta.
