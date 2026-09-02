# Achieve — El recorrido del MVP, ejecutable

**Documento:** `docs/demo-mvp.md`
**Rol:** el guion reproducible del recorrido que la Fase B6.6 dejó demostrable.
**Fecha:** 2 de septiembre de 2026

> ⚠️ **Todo lo de acá corre sobre datos sintéticos.** [ADR-006](decisions.md#adr-006) sigue siendo
> bloqueo absoluto para cualquier dato de una persona real.
>
> ⚠️ **La regla que dispara este recorrido es `PROVISIONAL`** — [ADR-036](decisions.md#adr-036).
> Los umbrales los fijó el **Product Owner**, no la psicopedagoga, y esperan su validación (§9 de
> [`agenda-cierre-psicopedagoga.md`](agenda-cierre-psicopedagoga.md)).
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
npm run db:reset        # 41 migraciones desde cero
npm run db:demo         # el mundo sintético
npm run db:sesion       # la identidad del estudiante sintético
npm run dev
```

En `.env.local` hacen falta `RELOJ_SHARED_SECRET` y, **sólo para el paso 9**,
`ESCALAMIENTO_SINTETICO=1`. Sin esa segunda variable la ruta de inspección **no existe**: responde
`404`, no `403`.

> `npm run db:verify` **deja la base vacía** de datos de negocio y comparte UUID con `db:demo`.
> Después de verificar hay que volver a sembrar.

---

## El recorrido

`npm run db:demo` deja el mundo **a una aparición** de que el sistema llame a una persona: dos
entregas evaluadas y sus dos errores del mismo tipo, ya corroborados. **La señal no está sembrada**:
la produce la regla, o no existe.

El propio seed imprime el `curl` del paso 3 con los UUID de esa corrida.

### 3 · La tercera aparición, después de una acción correctiva

```bash
curl -s -X POST http://localhost:3000/api/observacion \
  -H "Authorization: Bearer $RELOJ_SHARED_SECRET" -H 'Content-Type: application/json' \
  -d '{"institucionId":"…","preparacionId":"…","tipoDeErrorId":"…",
       "corroborada":true,"evidenciaId":"…","trasAccionId":"…",
       "claveDeIdempotencia":"demo-obs-3"}'
```

```json
{"observacionId":"1b64d494-…","duplicado":false,
 "evaluacion":{"estado":"OK","senalId":"eeea1dd6-…","apariciones":3,
               "duplicado":false,"necesitaPersona":true}}
```

### 5 · La señal que produjo la regla

```
intervencion | INTERVENTION_REQUIRED
```

**Nadie la miró.** El actor del evento es `null`, porque la produjo la configuración y no una persona.

### 6–8 · Lo que ve el estudiante

```
estadoGeneral : NECESITA RECUPERACIÓN
hero.nivel    : NO_ACTION_AVAILABLE
recuperacion:
    estado      = ELEVADA
    titulo      = Pedimos que alguien te acompañe
    explicacion = Esto siguió apareciendo después de trabajarlo, así que no alcanza con seguir solo.
    detalle     = Error de procedimiento: volvió a aparecer después de una acción correctiva,
                  3 veces en esta preparación
    queSigue    = Ya avisamos al equipo de acompañamiento.
fugas internas: ninguna
```

Las dos líneas que importan:

- **`hero.nivel` no cambió.** `VI.1` §3.3: el riesgo *"no gana automáticamente el Hero"*. Modifica el
  estado general y agrega una explicación; **no reemplaza** la decisión del día.
- **`fugas internas: ninguna`.** Ni `risk_signal`, ni `rule_version`, ni `HP0-06`, ni el estado
  interno, ni la severidad, ni nada que huela a operador.

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
           "explanation":"Error de procedimiento: volvió a aparecer después de una acción correctiva, 3 veces en esta preparación",
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
- **Los umbrales.** `PROVISIONAL`, del Product Owner, esperando a la psicopedagoga.
