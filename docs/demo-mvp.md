# Achieve — El recorrido del MVP, ejecutable

**Documento:** `docs/demo-mvp.md`
**Rol:** el guion reproducible del recorrido que la Fase B6.6 dejó demostrable.
**Fecha:** 2 de septiembre de 2026 · **corrido y corregido el 3 de septiembre de 2026**

> ⚠️ **Este documento se volvió a correr entero el 3 de septiembre**, y **tres cosas habían dejado de
> ser ciertas**: el navegador ya no abre sesión solo ([ADR-039](decisions.md#adr-039)), `HOY` ahora
> arranca vacío hasta que se corre el ADE, y el texto de la causa cambió al que produce la regla
> vigente. Están corregidas abajo, en su lugar. **Un guion que no se corre deja de ser un guion.**

> ⚠️ **Todo lo de acá corre sobre datos sintéticos.** [ADR-006](decisions.md#adr-006) sigue siendo
> bloqueo absoluto para cualquier dato de una persona real.
>
> ✅ **La regla que dispara este recorrido ya incorpora la validación profesional** —
> [ADR-037](decisions.md#adr-037). Los umbrales `2` y `3` se conservaron; cambió qué cuenta como una
> repetición y cuándo una corrección permite acelerar. Esto no autoriza datos reales.
>
> ⚠️ **La cola de escalamiento es sintética y transitoria.** No es el CRM, cuya integración está
> congelada por [ADR-035](decisions.md#adr-035).

---

## Qué demuestra

Los seis puntos que el owner fijó como definición del MVP, en un solo recorrido:

| | |
|---|---|
| Entender qué tiene que hacer el estudiante | El ADE recomienda; `UX01` lo muestra |
| Pedirle una evidencia | `Action` con su evidencia esperada |
| Evaluar si avanzó | La evidencia se juzga: `SUFFICIENT` / `INSUFFICIENT` |
| **Detectar que está trabado** | La regla cuenta errores del mismo tipo y produce una señal |
| Darle una siguiente acción | La acción correctiva, y la reentrada al paso |
| **Escalar cuando no alcanza** | La señal pide una persona y el caso aterriza en una cola |

---

## Preparar

```bash
npm run db:start        # Docker tiene que estar corriendo
npm run db:reset        # 46 migraciones desde cero
npm run db:demo         # el mundo sintético
npm run db:sesion       # la identidad del estudiante sintético
npm run dev
```

**Y después hay que entrar**, que es lo que cambió el 3 de septiembre
([ADR-039](decisions.md#adr-039)): **el navegador ya no abre sesión solo.** `npm run db:sesion`
imprime las credenciales, y **se escriben en `/login`**:

```
email:    estudiante.sintetico@achieve.local
password: achieve-demo-sintetica
```

Cualquiera de las nueve superficies sin sesión redirige a `/login?volver=<la que pediste>` y **vuelve
sola** después de entrar. `NEXT_PUBLIC_DEMO_EMAIL` y `NEXT_PUBLIC_DEMO_PASSWORD` **ya no autentican
nada**: son el recordatorio de qué tipear.

En `.env.local` hacen falta `RELOJ_SHARED_SECRET` y, **sólo para el paso 9**,
`ESCALAMIENTO_SINTETICO=1`. Sin esa segunda variable la ruta de inspección **no existe**: responde
`404`, no `403`.

**Y para el loop diario, dos más:** `DEMO_INSTITUTION_ID` y `DEMO_COURSE_ENROLLMENT_ID`. Sin ellas,
`npm run recomendar` corre igual pero **hay que pasarle los dos UUID a mano**:

```bash
npm run recomendar -- <institution-id> <course-enrollment-id>
```

> `npm run db:verify` **deja la base vacía** de datos de negocio y comparte UUID con `db:demo`.
> Después de verificar hay que volver a sembrar.

---

## El loop diario, primero — Fase B6.8

**Esto no estaba en la versión del 2 de septiembre, y sin ello el recorrido de abajo no se entiende:**
hasta la [Fase B6.8](roadmap.md) el camino del estudiante **no escribía**, así que la demo empezaba
con el mundo ya sembrado. Ahora se recorre entero, y **conviene mostrarlo antes que la detección**:
primero el producto funcionando, después qué pasa cuando el estudiante se traba.

**El mundo recién sembrado no tiene ninguna acción**, y eso es correcto: el ADE no corrió todavía.

```
estadoGeneral : SIN ACCIONES POR AHORA
hero.nivel    : NO_ACTION_AVAILABLE
```

| # | Qué se hace | Qué pasa |
|---|---|---|
| 1 | `npm run recomendar` | El ADE materializa una `Action` real. `HOY` pasa a **`BAJO CONTROL`** con *"Derivadas · Porque: Entra en Parcial 1 · 45 min · Entregá: Producción de la práctica"* |
| 2 | **Comprometerme** en `UX01` → **Me comprometo** en `UX04` | El `Commitment` **nace acá**: mientras el estudiante mira la propuesta no hay nada escrito. `HOY` pasa a **`COMPROMISO ACORDADO`** |
| 3 | **Entregar** en `UX05` | Firma, sube y **después** registra: la fila nace `SUBMITTED` y la pantalla dice *"Evidencia recibida · pendiente de validación"* |
| 4 | `npm run validar -- <institución> <evidencia> practice=19` | Valida, **registra el progreso** y **cierra la `Action`**. Después invoca al ADE: *"Siguiente acción materializada"* |
| 5 | `UX06` | **`CAMBIO CONFIRMADO`**, con *"Práctica · cambió"*, la fuente (*"Evidencia validada"*) y las cuatro dimensiones que **no** se afirman: `sin información` y `no evaluado`, que no son cero |
| 6 | `HOY`, otra vez | **`BAJO CONTROL`**, con la acción siguiente: *"Límites y continuidad"*. El loop cerró y volvió a abrir |

> **Lo que no hay que perderse en el paso 4:** el progreso **no sale de que la evidencia esté
> `VALIDATED`**. Lo escribe la operación, y la `Action` se cierra porque esa operación la cierra
> ([ADR-040](decisions.md#adr-040)). Validar con `--sin-cambio` también cierra: cumplir la acción y
> avanzar académicamente son hechos distintos.
>
> **Y el paso 4 usa secreto de servicio, nunca el JWT del estudiante.** Nadie valida su propia
> evidencia.

---

## El recorrido de la detección

`npm run db:demo` deja el mundo **a una aparición** de que el sistema llame a una persona: dos
entregas evaluadas y sus dos errores del mismo tipo, ya corroborados. **La señal no está sembrada**:
la produce la regla, o no existe.

> **Y desde la B6.7.2 el seed declara un objetivo de aprendizaje** ([ADR-037](decisions.md#adr-037),
> `9.1`). Sin él el circuito **ya no escala**, y ése es exactamente el punto: dos errores del mismo
> tipo sólo son comparables si coinciden en el objetivo o demanda. `learning_objective` está vacía en
> el schema — la comparabilidad **se declara, nunca se infiere**.
>
> Las dos entregas son **`INSUFFICIENT`** y aun así cuentan, porque el error es identificable
> (`9.6`). Excluirlas *"sesgaría la detección contra quienes más necesitan acompañamiento"*.

El propio seed imprime el `curl` del paso 3 con los UUID de esa corrida.

### 3 · La tercera aparición, después de una acción correctiva

```bash
curl -s -X POST http://localhost:3000/api/observacion \
  -H "Authorization: Bearer $RELOJ_SHARED_SECRET" -H 'Content-Type: application/json' \
  -d '{"institucionId":"…","preparacionId":"…","tipoDeErrorId":"…",
       "corroborada":true,"evidenciaId":"…","trasAccionId":"…",
       "objetivoId":"…","calidadDeEvidencia":"suficiente_para_identificar_error",
       "errorIdentificable":true,"confianzaDeClasificacion":"alta",
       "claveDeIdempotencia":"demo-obs-3"}'
```

```json
{"observacionId":"3b29dfb4-…","duplicado":false,
 "evaluacion":{"estado":"OK","senalId":"bb1993a3-…","apariciones":3,
               "repeticionDetectada":3,"noInterpretables":0,
               "duplicado":false,"necesitaPersona":true}}
```

### 4 · La misma tercera aparición, en otro objetivo · **no escala**

El paso que hace visible la corrección de la psicopedagoga. Mismo tipo de error, misma cantidad,
**otro objetivo de aprendizaje**:

```json
{"evaluacion":{"estado":"SIN_SENAL","apariciones":1,
               "repeticionDetectada":3,"noInterpretables":0}}
```

**Tres repeticiones detectadas, una comparable, cero señales.** Es el falso positivo que ella marcó:
*"dos errores procedimentales en contenidos no comparables no necesariamente expresan la misma
dificultad"*. El umbral es el mismo de siempre — lo que cambió es el denominador.

### 5 · La señal que produjo la regla

```
intervencion | INTERVENTION_REQUIRED
```

**Nadie la miró.** El actor del evento es `null`, porque la produjo la configuración y no una persona.

### 6–8 · Lo que ve el estudiante

```
estadoGeneral : NECESITA RECUPERACIÓN
hero.nivel    : ACTION_RECOMMENDED        ← con el loop diario corrido
recuperacion:
    estado      = ELEVADA
    titulo      = Pedimos que alguien te acompañe
    explicacion = Esto siguió apareciendo después de trabajarlo, así que no alcanza con seguir solo.
    detalle     = Error de procedimiento o estrategia: 3 veces en la preparación
                  de este examen
    queSigue    = Ya avisamos al equipo de acompañamiento.
fugas internas: ninguna
```

Las dos líneas que importan:

- **El Hero no cambió, y ahora se puede ver.** `VI.1` §3.3: el riesgo *"no gana automáticamente el
  Hero"*. Hasta el 2 de septiembre esto se leía como `NO_ACTION_AVAILABLE`, porque **no había
  ninguna acción que el riesgo pudiera desplazar** — la invariante se cumplía sin poder demostrarse.
  Con el loop diario corrido, el Hero tiene una recomendación real y **la señal no la toca**: cambia
  el estado general, agrega la explicación, y la decisión del día sigue intacta. **Es la misma regla,
  por fin visible.**
- **`fugas internas: ninguna`.** Ni `risk_signal`, ni `rule_version`, ni `HP0-06`, ni el estado
  interno, ni la severidad, ni nada que huela a operador.

> ⚠️ **El `detalle` cambió, y no es un cambio de copy: es qué rama de la regla se disparó.** La
> versión del 2 de septiembre decía *"volvió a aparecer después de una acción correctiva"*. Esa frase
> sale de la rama de **reincidencia tras correctiva**, y desde la **B6.7.3**
> ([ADR-037](decisions.md#adr-037), `9.2`) esa rama exige **las cinco condiciones de corrección
> válida** —entregada, accesible, con el estudiante involucrado, con un nuevo intento independiente y
> con confianza suficiente—. El `curl` de arriba **no declara ninguna**, así que la corrección no
> cuenta como válida y la causa la escribe la rama de repetición simple.
>
> **El circuito escala igual**, porque tres apariciones comparables alcanzan el umbral. Lo que
> cambia es **qué dice la causa**, y dice la verdad: nadie declaró que hubo una corrección válida.
> Para ver la otra rama hay que mandar las cinco condiciones en la observación.

> **La etiqueta salió del vocabulario vigente**, que desde la B6.7.1 es `v2.0-psicopedagogia`
> ([ADR-037](decisions.md#adr-037), `9.5`). Antes decía *"Error de procedimiento"*; el texto de la
> causa **se escribe con la versión de hoy**, no con la que estuviera vigente cuando se registró cada
> aparición. Los umbrales no cambiaron: siguen siendo `2` y `3`.
>
> **Y la B6.7.2 no tocó una sola palabra de lo que ve el estudiante**, a propósito. La distinción
> entre repetición detectada y aparición comparable viaja en el resultado estructurado, no en esta
> frase: ella pidió *"una revisión experta de lenguaje, accesibilidad, privacidad y no
> estigmatización **antes de probar con personas**"*, y estrenar vocabulario acá sería saltearla.

### 9–10 · La cola sintética

```bash
curl -s "http://localhost:3000/api/escalamiento?institucion=…" \
  -H "Authorization: Bearer $RELOJ_SHARED_SECRET"
```

```json
{"sintetica":true,
 "advertencia":"Cola de demostración. No es el CRM y no es una consola de operador.",
 "pendientes":1,
 "casos":[{"escalationId":"5e2b8901-…","riskSignalId":"eeea1dd6-…",
           "platformStudentId":"a5000000-…",
           "explanation":"Error de procedimiento o estrategia: volvió a aparecer después de una acción correctiva, 3 veces en esta preparación",
           "deliveryStatus":"pendiente","createdAt":"2026-09-02T15:04:18Z"}]}
```

### 11–12 · Repetir, y que no aparezca un segundo caso

Se manda **el mismo comando del paso 3**:

```json
{"observacionId":"1b64d494-…","duplicado":true, …}
```
```
pendientes: 1
```

**Un caso por señal**, y la unicidad vive en el índice de la base — no en un `SELECT` previo, que
tendría carrera.

---

## Limitaciones de la cola sintética

| | |
|---|---|
| **No es el CRM** | Y no es un paso hacia una consola de operador: esa superficie es del CRM ([ADR-033](decisions.md#adr-033)) y no debe existir acá |
| **No entrega nada** | `deliveryStatus` es siempre `pendiente`. Quien entregue todavía no existe |
| **No es lifecycle** | Encolar no resuelve, no reconoce y no cierra: `risk_signal` e `intervention` no se enteran. Misma separación que [ADR-034](decisions.md#adr-034) hizo entre transporte y dominio |
| **Apagada por defecto** | Sin `ESCALAMIENTO_SINTETICO=1`, la ruta responde `404`. **No se declara en producción** |
| **Sólo lee** | No hay `POST` ni `PATCH`: no hay camino para tocar el dominio desde ahí |

### Cómo se reemplaza por el CRM

El dominio **no sabe adónde va el caso**: sale por el puerto `DestinoDeEscalamiento`, que tiene un
método y ningún endpoint, payload ni firma. Cuando llegue el adaptador del **flujo A** de
[`contrato-riesgo-candidato-v0.2.md`](contrato-riesgo-candidato-v0.2.md):

1. se implementa `DestinoDeEscalamiento` con el cliente HMAC;
2. se cambia **una línea** en el composition root;
3. **esta ruta se borra**, y con ella la tabla.

Hay un guard estático que verifica que el Service de riesgo **no nombre** al CRM, HMAC, webhooks,
outbox ni `fetch`. El día que el destino sea un webhook firmado, el dominio no cambia.

---

## Qué sigue simulado

- **El operador.** No hay cola operativa ni superficie: son del CRM.
- **La entrega.** Nada consume la cola.
- **La revisión de evidencia.** Quién registra un error observado en producción depende del rol
  Reviewer `R1`, que [ADR-033](decisions.md#adr-033) dejó abierto. Acá lo hace el seed.
- **Los dos disparadores todavía humanos.** `HP0-06-2` y `HP0-06-3` no tienen automatización ni
  umbral inventado; `C01-021` sigue abierto para su operación.
