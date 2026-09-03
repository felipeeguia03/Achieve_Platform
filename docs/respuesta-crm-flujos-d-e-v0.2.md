# Respuesta de la Plataforma a la v0.2 del CRM · flujos D, E y E′

**De:** equipo Plataforma (`Achieve_Platform`)
**Para:** CTO · equipo CRM (`Achieve_CRM`)
**Responde a:** `crm-respuesta-flujos-actividad-vinculacion-v0.2.md`, 3 de septiembre de 2026
**Continúa:** [`respuesta-crm-flujos-d-e-v0.1.md`](respuesta-crm-flujos-d-e-v0.1.md)
**Fecha:** 3 de septiembre de 2026
**Estado:** **`PLATAFORMA ACEPTA EL CIERRE DE DISEÑO`** — con **una corrección de registro**, **un
hallazgo nuevo de la misma clase que el `422`**, y **dos consecuencias de sus agregados** que hay que
dejar escritas antes de construir.

> **Resumen en cinco líneas.** Aceptamos el cierre: **su solución del `422` es mejor que la nuestra**
> y la tomamos entera, las **tres cláusulas de gobernanza de facturación** son correctas y no cuestan
> implementación, y **el desempate del teléfono y el flujo E′ son los dos mejores aportes de esta
> ronda**. `PHONE_TAKEN` se queda: no vamos a pelear un nombre. **Pero el §2.1 cita algo que el
> documento que recibimos no dice**, y eso importa por lo que implica, no por el nombre. **Y hay un
> hallazgo nuevo: la firma HMAC está especificada de dos maneras distintas** entre el contrato v0.2 y
> este documento — mismo middleware, mismo secreto, dos construcciones, y el modo de falla es el
> `401` mudo que ustedes mismos describen.

---

## 0. Tablero

| # | Punto de su v0.2 | Veredicto Plataforma |
|---|---|---|
| §1 completo | Lo que acatan | ✅ **Recibido.** Sin comentarios: es lo que propusimos |
| §2.1 | *"El §2.5 parte de un dato equivocado"* | ⚠️ **Aceptamos `PHONE_TAKEN` · rechazamos la premisa** — §2 |
| §2.2 | `422`: código por flujo + reintento acotado + dead-letter | ✅ **Acatado, y es mejor que nuestra propuesta** — §1.1 |
| §2.3 | La lista de eventos como cláusula versionada del contrato | ✅ **Acatado entero**, con una precisión — §1.2 |
| §4.1 | Desempate por `occurredAt` + procedencia | ✅ **Acatado**, con una consecuencia que hay que escribir — §4.1 |
| §4.2 | Flujo E′ · desvinculación | ✅ **Acatado**, con un requisito de orden de emisión — §4.2 |
| §5 · orden | D y E primero al descongelar | 🔴 **No lo decidimos nosotros.** Queda como [ADR-043](decisions.md#adr-043) `PENDING`, con nuestra recomendación — §6.1 |
| §5 · smoke test | *"se puede hacer ya, no toca ADR-006"* | ⚠️ **Cierto sobre ADR-006, incompleto sobre ADR-035** — §6.2 |
| §1.1 · pedido opcional | `ActionAccepted` y `CommitmentCreated` no facturables | ⚠️ **Uno sí, el otro no existe con ese nombre** — §5.1 |
| — | **La firma HMAC, especificada dos veces distinto** | 🔴 **Hallazgo nuevo de la Plataforma** — §3 |

---

## 1. Lo que acatamos

### 1.1 El `422`: su solución es mejor, y la tomamos entera

**Tenían razón en las dos objeciones.** Nuestra propuesta suponía que alguien podía distinguir
*"todavía no"* de *"nunca"*, y **el CRM no puede**: un `platformStudentId` desconocido es desconocido,
y punto. La diferencia de política **es por flujo**, no por caso, y escribirlo con esas palabras evita
que alguien construya un despachador esperando una discriminación que nadie puede hacer.

Y la disyuntiva *"terminal vs reintentable"* **era falsa**, como dicen: nuestro miedo era el reintento
infinito y el suyo el descarte silencioso, y **backoff acotado (24–48 h) → dead-letter con alerta**
resuelve los dos. Lo tomamos tal cual.

También aceptamos el desempate entre las dos opciones: **código propio, no `retryable` en el
envelope**, porque el envelope es una de las tres definiciones abiertas y colgar la política de
reintento de algo sin acordar es peor que el problema. Cuando se cierre, `retryable` se suma **como
refuerzo, no como reemplazo**.

⚠️ **Lo que esto nos cuesta, dicho de frente:** el reintento acotado con dead-letter **es** el outbox
de §7.7 más el ítem 5 de [ADR-005](decisions.md#adr-005). No está construido, sigue diferido por
[ADR-035](decisions.md#adr-035), y no lo destraba este acuerdo.

### 1.2 La lista de eventos como cláusula versionada del contrato

**Acatado, y el argumento es correcto:** *"si mañana alguien agrega `CourseViewed` a esa marca, cambia
lo que Achieve le factura a una institución y nadie de Achieve lo aprobó"*. Una marca en un catálogo
que se cambia en un commit no puede ser la definición de una línea de factura. Las tres cláusulas no
nos cuestan implementación y las firmamos.

**Una precisión, para que la cláusula no diga más de lo que queremos que diga:** lo que queda atado al
contrato es **el conjunto de eventos marcados como facturables**, no el catálogo. El catálogo sigue
creciendo libremente —eventos nuevos entran con su nivel y su guard, como hasta ahora— y **agregar un
evento no facturable no es un cambio de contrato**. Lo que exige aviso y acuerdo es **mover un evento
adentro o afuera del conjunto facturable**. Con esa redacción, la garantía comercial que piden se
cumple sin congelar el modelo de eventos del producto.

Y sobre la cláusula 3 —que el CRM pueda **angostar** su regla sin acuerdo—: de acuerdo, con la misma
lógica invertida. Angostar sólo reduce lo que se factura y no puede sorprendernos.

⚠️ **Esto convierte a [ADR-041](decisions.md#adr-041) en algo más que una decisión interna:** su
resultado pasa a ser una cláusula del contrato. Sigue `PENDING` y **la cierra el Product Owner**. La
lista candidata que ustedes aceptaron *"tal cual"* es la que le vamos a recomendar; no está firmada
hasta que él la firme.

### 1.3 Los dos agregados del §4

**Los dos son mejores que lo que teníamos, y los dos son huecos que no vimos.**

- **El desempate por `occurredAt` + procedencia (§4.1)** resuelve algo que nuestro §2.4 dejaba dicho
  como principio y no como regla. *"El CRM manda"* sin desempate significaba, en los hechos, **que
  gana el que llega**, que es exactamente lo contrario. Y no nos cuesta nada: `occurredAt` ya viaja.
- **El flujo E′ (§4.2)** es lo que hace **ejecutable** el derecho de supresión que nuestro §2.3 dejó
  como cláusula declarativa. La forma nos cierra: mismo transporte, mismos campos, sin `phone`.

---

## 2. `PHONE_TAKEN` se queda, y la premisa del §2.1 no

**Resolución primero, para que no haya ambigüedad: aceptamos `409 PHONE_TAKEN`.** Está implementado,
es más específico que `PHONE_CONFLICT`, y renombrarlo costaría código, ADR y contrato a cambio de
nada. **No hay nada que discutir sobre el nombre.**

**Lo que no aceptamos es la premisa**, y no por orgullo: por lo que implicaría si quedara escrita.

El §2.1 dice que *"la propuesta v0.1 §2.4"* contenía *"si colisiona → `409 PHONE_TAKEN` (el CRM nunca
pisa el número de otro alumno)"*. **El documento que recibimos no dice eso.** Su §2.4, completo:

> *"`202` → guardado (acuse técnico). Idempotente por `eventId`. Errores: los mismos del §0. Además,
> un **cambio de número** para el mismo alumno se acepta (re-vinculación) siempre que el `phone` no
> colisione con otro alumno (el teléfono es único en el CRM)."*

Y *"los mismos del §0"* son exactamente cinco: `INVALID_SIGNATURE` 401, `MALFORMED_PAYLOAD` 400,
`EVENT_ID_CONFLICT` 409, `UNRESOLVABLE_STUDENT` 422, `RATE_LIMITED` 429. **`PHONE_TAKEN` no está**, ni
ahí ni en el §3 que resume el catálogo compartido.

**Por qué lo señalamos igual, con el resultado ya acordado.** Porque la frase *"es una preferencia de
nombre sobre algo ya acordado, documentado e implementado"* establece, si nadie la corrige, que **lo
que existe en el código del CRM cuenta como acordado aunque no esté en el documento compartido**. Y si
eso vale, este intercambio pierde su función: **la distancia entre el código de un lado y el contrato
que ve el otro es precisamente lo que estos documentos existen para cerrar.** Nosotros no podemos ver
su ADR-0081 ni su índice `students_phone_uniq`; podemos ver lo que nos mandan.

**El resultado material es el que ustedes proponen, y es el que pedíamos:** que el código de colisión
esté en el catálogo compartido con su política. Su §6.1 lo hace. **Cerrado.**

---

## 3. Hallazgo nuevo: la firma HMAC está especificada de dos maneras

Misma clase de defecto que el `422`, y con el mismo costo si se descubre tarde.

| Documento | Cómo se construye la firma |
|---|---|
| `contrato-riesgo-candidato-v0.2.md` §2 — **Flujo A**, aceptado por los dos lados | *"HMAC-SHA256 con secreto exclusivo de esta dirección, **firma sobre timestamp + body original**"* |
| Su v0.2 §6.0 — **Flujos D, E, E′** | *"`X-Achieve-Signature` = HMAC-SHA256 hex sobre **`${timestamp}.${rawBody}`**"*, con la precisión 3: *"El separador entre timestamp y body es un **punto**. **No es concatenación directa**"* |

**Y ustedes mismos escribieron que es un solo mecanismo:** *"secreto HMAC entrante **ÚNICO** para
todos los webhooks Plataforma → CRM (el mismo del Flujo A)"*, con *"el mismo middleware"*. Un
middleware no puede verificar dos construcciones distintas.

**El modo de falla es el peor posible, y lo describe su propio §6.0:** el CRM responde *"un único
`401 INVALID_SIGNATURE` para cualquier falla de firma, ventana o headers — a propósito, para no
filtrar qué parte falló"*. Es la decisión correcta de seguridad **y** significa que quien implemente
el Flujo A leyendo el contrato congelado va a ver `401` constante **sin ninguna pista** de que el
problema es un punto.

**Propuesta: gana el punto.** Es la especificación más precisa, es la que está implementada, y es la
que evita la ambigüedad de concatenar dos strings sin separador. Lo que pedimos es que **la próxima
versión del contrato corrija el §2**, porque hoy dice otra cosa y **está congelado diciéndola**.

**Una consecuencia derivada, que no está en su §7:** con **un solo secreto entrante para A, D, E y
E′**, el radio de explosión de una rotación pasó de un flujo a cuatro. Eso no cambia el diseño —
sigue siendo lo correcto—, pero **sube el valor de cerrar la definición 3 de §11.1 (esquema de
secretos con rotación) antes de que exista el primer secreto real**, no después. Hoy no hay rotación
en ninguno de los dos sistemas.

---

## 4. Dos consecuencias de sus agregados, que conviene escribir ahora

Ninguna es una objeción. Son cosas que, si no se escriben, se descubren en el peor momento.

### 4.1 Con el desempate, `202` deja de significar *"se aplicó"* — y el emisor no puede distinguirlo

Su §4.1 lo dice con todas las letras: un evento más viejo que el número vigente *"se acepta con `202`
y no modifica el teléfono (es un `202` técnico, no de dominio: recibido, no aplicado)"*. Es coherente
con la convención del contrato y **no lo objetamos**.

Lo que hay que escribir es la consecuencia: **la Plataforma no tiene forma de saber si el número que
mandó quedó vigente.** Recibe el mismo `202` en los dos casos. Dos salidas:

| | |
|---|---|
| **A · No proyectar estado de vinculación** *(recomendada)* | La pantalla de [ADR-042](decisions.md#adr-042) confirma **lo que el estudiante hizo** —*"guardamos tu número"*—, y **nunca** afirma un estado del CRM: ni *"tu WhatsApp está vinculado"*, ni *"te van a escribir"*. Es lo coherente con §2.4: si el teléfono es canónico del CRM, la Plataforma no puede proyectarlo, del mismo modo que no proyecta quién acompaña al estudiante |
| B · Un campo `applied` en el `202` | Resuelve el hueco y **rompe** *"`202` = acuse técnico, nunca de dominio"*, que es una convención que los dos venimos sosteniendo en cinco flujos |

**Recomendamos A**, y lo decimos ahora porque la pantalla todavía no existe: es más barato diseñarla
sabiendo que no puede prometer nada que rediseñarla después. Si eligen B, lo discutimos.

### 4.2 E′ tiene un requisito de orden que no es del contrato, y es nuestro

`whatsapp-unlink` se direcciona con `platformStudentId`. En el caso que más importa —**el derecho de
supresión**— eso genera un orden obligatorio:

> **Se emite E′ y se materializa en el outbox *antes* de borrar al estudiante de la Plataforma.**

Si el borrado elimina la fila primero, **no queda a quién desvincular**: el `platformStudentId` que el
CRM necesita se fue con ella, y el número queda vivo del otro lado. El derecho de supresión se
convertiría en la mitad de un borrado, que es peor que no tenerlo, porque parece hecho.

No es una cláusula del contrato —es un requisito de nuestro outbox— pero lo escribimos acá porque
**sale del diseño de ustedes** y porque el día que se descubra va a ser con una persona real pidiendo
que la borren. Va anotado en [ADR-042](decisions.md#adr-042).

---

## 5. Dos precisiones sobre el catálogo, y una sobre el reloj

### 5.1 El pedido opcional del §1.1: uno se puede, el otro no existe con ese nombre

Pidieron `ActionAccepted` y `CommitmentCreated` marcados **no facturables**, para el embudo
*vinculado → aceptó → produjo*.

- **`ActionAccepted` se emite hoy.** Marcarlo no facturable y mandarlo no es trabajo nuevo. Nos cierra
  el argumento: no cambia la factura y les dice si el empujón del operador sirvió.
- **`CommitmentCreated` no existe como nombre emitido.** El backend emite **`CommitmentConfirmed`**,
  por el estado al que transiciona. `CommitmentCreated` es el nombre del spec §16, y reconciliarlos es
  deuda declarada en nuestro catálogo desde la Fase B3.

⚠️ **Y no lo vamos a renombrar para que coincida.** `product_event` es **append-only** y
[ADR-027](decisions.md#adr-027) decidió que los nombres históricos no se cambian: renombrar dejaría
filas que ningún consumidor sabe leer. **Así que el `type` que van a recibir en el ledger es
`CommitmentConfirmed`.** Mejor saberlo ahora que descubrirlo cuando el embudo no cierre.

### 5.2 El huso horario del corte mensual

Su §6.2 dice que el CRM cuenta *"alumnos únicos con ≥1 evento en el mes, por institución, en huso
horario de Argentina"*. De acuerdo, y para que no haya doble conversión: **nosotros mandamos
`occurredAt` como un instante en UTC**, siempre. Nunca hora local. El corte en huso argentino lo hacen
ustedes sobre ese instante — que es lo correcto, porque el huso del corte es una decisión de
facturación, no del hecho.

### 5.3 El `eventId` se ata al payload al encolar, no al despachar

Consecuencia de su regla de idempotencia (`eventId` + hash del body → `409 EVENT_ID_CONFLICT`): **un
evento que ya salió de nuestro outbox no puede cambiar de forma**. Si un despliegue nuestro cambiara
la serialización de un evento pendiente de reintento, el reintento chocaría contra su `409`. Queda
como regla del outbox: **el payload se congela con el `eventId`**, y un cambio de forma exige un
`eventId` nuevo. Lo anotamos nosotros; no les pedimos nada.

---

## 6. Prioridad y smoke test

### 6.1 El orden lo decide una persona, y no somos nosotros

Piden *"un compromiso de orden, no de calendario: que D y E salgan primero de los cinco"*. **El
argumento es bueno** —D y E habilitan facturar y operar, A/B/C mejoran una operación que para entonces
ya tiene que existir— y **el dato de que E no depende de `C01-021` ni de Meta es correcto**.

**Pero el orden es alcance de [ADR-035](decisions.md#adr-035), y esa la cerró el owner.** Un equipo no
la revierte por acuerdo con la contraparte. Queda registrada como **[ADR-043](decisions.md#adr-043)
`PENDING`**, con su pedido citado y nuestra recomendación a favor.

⚠️ **Con una precisión que conviene que tengan:** *"D y E primero"* no depende sólo de la prioridad.
**El Flujo D necesita [ADR-041](decisions.md#adr-041)** —la marca de facturación— y **el Flujo E
necesita [ADR-042](decisions.md#adr-042)** —la pantalla—, las dos `PENDING` y las dos del Product
Owner. Aunque el owner acepte el orden mañana, **el trabajo no arranca hasta que esas dos se cierren.**
Son la misma persona, así que conviene llevárselas juntas.

### 6.2 El smoke test: tienen razón sobre ADR-006, y falta la mitad

**Sobre [ADR-006](decisions.md#adr-006) tienen razón, sin matices.** Un alumno sintético no es una
persona, y [ADR-024](decisions.md#adr-024) autoriza construir y probar todo sobre datos sintéticos. El
smoke test **no toca el gate legal**.

**Lo que falta decir es que sí toca [ADR-035](decisions.md#adr-035).** Para correrlo hace falta:

1. **El cliente HMAC y un outbox mínimo del lado de la Plataforma** — que es, exactamente, la
   construcción que ADR-035 difirió.
2. **Acordar y provisionar el secreto entrante** — que es la **definición 3 de §11.1**, una de las tres
   que siguen abiertas. Y con un solo secreto para cuatro flujos (§3), estrenarlo sin esquema de
   rotación es empezar por donde no conviene.

O sea: *"cuesta un script del lado del emisor"* es cierto **si el emisor ya existe**, y no existe.

**Nuestra recomendación al owner es hacerlo igual**, y la fundamentamos: esta ronda de dos documentos
ya produjo **dos defectos de forma —el `422` y la firma— que sólo aparecen cuando alguien firma de
verdad**. Un smoke test encuentra la clase de cosa que ningún documento encuentra. Pero es decisión de
él, y va en el mismo ADR-043.

---

## 7. Qué le toca a la Plataforma, y qué lo bloquea

| | Qué | Estado |
|---|---|---|
| 1 | Marca *"cuenta como actividad del estudiante"* en el catálogo, con su guard | 🔒 [ADR-041](decisions.md#adr-041) `PENDING` |
| 2 | Confirmar la lista como cláusula versionada del contrato, con la precisión del §1.2 | 🔒 ADR-041 |
| 3 | Política de reintento del outbox: acotada + dead-letter, obedeciendo al código | ⏸️ [ADR-035](decisions.md#adr-035) · arrastra el ítem 5 de [ADR-005](decisions.md#adr-005) |
| 4 | Emisor del Flujo D | ⏸️ ADR-035 · 🔒 ADR-041 |
| 5 | La pantalla de WhatsApp, con consentimiento y **revocación** (E′) | 🔒 [ADR-042](decisions.md#adr-042) `PENDING` |
| 6 | Emisor de E y E′, con el orden de emisión del §4.2 | ⏸️ ADR-035 · 🔒 ADR-042 |
| 7 | Secreto HMAC entrante y smoke test en dev | 🔴 [ADR-043](decisions.md#adr-043) `PENDING` + definición 3 de §11.1 |

**Nada de esto está bloqueado por ustedes.** Cuatro de las siete filas esperan a una persona nuestra.

---

## 8. Cómo quedamos

**Damos por acordado:** todo su §1, la lista de eventos facturables *(sujeta a ADR-041, que la firma
una persona)*, el catálogo de errores del §6.1 con `PHONE_TAKEN` y el `422` desdoblado por flujo, el
desempate del §4.1, el flujo E′ del §4.2 y la forma de los tres flujos del §6.

**Lo que necesitamos de vuelta, y es corto:**

1. **La corrección del `§2` del contrato v0.2** para que la firma diga `${timestamp}.${rawBody}` en
   los cuatro flujos entrantes (§3). Es el único punto donde el contrato congelado dice algo falso.
2. **Su lectura del §4.1**: si les cierra la opción A —la Plataforma no proyecta estado de
   vinculación— o prefieren el campo `applied`.
3. **Nada más.** Los tres puntos de su §2 están respondidos: `PHONE_TAKEN` aceptado, `422` acatado
   entero, lista de eventos acatada con una precisión de redacción.

**Este documento no firma nada por sí solo.** Tres decisiones siguen esperando al Product Owner —
[ADR-041](decisions.md#adr-041), [ADR-042](decisions.md#adr-042) y [ADR-043](decisions.md#adr-043)— y
el gate de [ADR-006](decisions.md#adr-006) sigue cerrado para cualquier dato de una persona real.
