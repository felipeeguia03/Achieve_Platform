# Brief para el CTO — ADR-008 · las tres vulnerabilidades `high`

**Documento:** `docs/brief-adr-008-seguridad.md`
**Fecha:** 2 de septiembre de 2026 · **re-medido contra el árbol instalado**
**Estado:** ✅ **`ADR-008 ACCEPTED — AMENDED AND SIGNED`** · 3 de septiembre de 2026
**El CTO ratificó la [Enmienda 1](decisions.md#adr-008-enmienda-1)**: opción A (`16.3.4`, pin exacto,
React sin tocar), `agentRules: false`, y **push autorizado** sobre `feat/fase-0-track-a`. Resultado
completo en §10; la firma y su fundamento, en [`adr-008-firma-cto.md`](adr-008-firma-cto.md).
⚠️ **La firma no autoriza merge a la rama principal ni despliegue.**
**Asignado a:** CTO
**Condición:** **previa a cualquier despliegue con usuarios o datos reales.**
**Sustituye a:** la versión del 1 de septiembre de 2026, que tenía dos datos mal. Ver §2.

---

## 1. Qué hay, medido hoy

`npm audit` reporta **3 vulnerabilidades `high`**, y las tres tienen el mismo origen:

| Paquete | Instalado | Rango afectado | Corregido en | De dónde viene |
|---|---|---|---|---|
| `next` | `16.2.6` | `9.3.4-canary.0` – `16.3.0-preview.10` | **`16.3.0`** | Declarado en `package.json` |
| `postcss` | `8.4.31` | `<= 8.5.22` | `8.5.23` | **Dependencia directa de `next`**, fijada por él |
| `sharp` | `0.34.5` | `< 0.35.0` | `0.35.0` | **Opcional de `next`**, para optimización de imágenes |

**`postcss` y `sharp` no son deudas propias: son la misma deuda de `next`, contada tres veces.**
Ninguno de los dos figura en `package.json`.

---

## 2. Dos correcciones de dato, y una importa mucho

### ⚠️ **No es un salto de versión mayor.** Es un minor.

`roadmap.md` §3.1, la Etapa 0.1 y la versión anterior de este brief decían que arreglarlo *"cambia la
versión mayor del framework"*. **No es cierto:** `16.2.6 → 16.3.4` es `16.x → 16.x`.

Lo que dispara el mensaje de npm —*"outside the stated dependency range"*— **no es un major**: es que
`package.json` fija la versión **exacta**, sin `^`:

```json
"next": "16.2.6",
"eslint-config-next": "16.2.6",
```

Cualquier versión distinta queda fuera del rango declarado, incluso un parche. El costo real del
upgrade es el de un minor, no el de un major — y eso cambia la decisión que hay que tomar.

### ⚠️ Ningún parche de la línea `16.2` sirve

Existen `16.2.7` … `16.2.12`, y **todas están dentro del rango afectado**, que llega hasta
`16.3.0-preview.10`. **El mínimo que corrige es `16.3.0`.** Quedarse en la línea `16.2` no es una
opción conservadora: es no arreglarlo.

---

## 3. Un solo cambio coordinado cierra las tres

```
next               16.2.6 → 16.3.4
eslint-config-next 16.2.6 → 16.3.4     (tiene que moverse junto)
```

Y las otras dos se resuelven solas, porque son de `next`:

| | Antes | Después de `next@16.3.4` | ¿Sale del rango afectado? |
|---|---|---|---|
| `postcss` (interno de `next`) | `8.4.31` | `8.5.23` | ✅ el aviso es `<= 8.5.22` |
| `sharp` (opcional de `next`) | `0.34.5` | `^0.35.4` | ✅ el aviso es `< 0.35.0` |

**React no se toca.** `next@16.3.4` pide `react ^18.2.0 || ^19.0.0` y el repo tiene `19.2.6`.

**El `postcss` que compila nuestro CSS ya está sano.** Tailwind v4 trae el suyo —`8.5.26`, fuera del
rango—; el vulnerable es **la copia interna de `next`**, en `node_modules/next/node_modules/postcss`.

---

## 4. Exposición real de este repositorio

> ⚠️ **Esto es un relevamiento de qué usa el repo, no un peritaje de seguridad ni una habilitación.**
> Sirve para dimensionar la urgencia y **no** para justificar no arreglarlo. Un aviso que hoy no
> aplica pasa a aplicar el día que alguien agregue la función que le falta.

**Lo que el repo NO tiene, verificado por medición:** no hay `middleware.ts`; **no hay una sola
Server Action** (`"use server"` no aparece en ningún archivo); no hay `i18n` ni locales; no hay
`rewrites` ni `redirects` —`next.config.ts` está vacío salvo un comentario—; no hay servidor
custom; no se declara Edge runtime; y **`next/image` no se usa en ninguna pantalla**.

Contra los nueve avisos de `next`:

| Aviso | Qué necesita para ser alcanzable | Estado hoy |
|---|---|---|
| Bypass de middleware/proxy (Turbopack + locale único) | `middleware.ts` + locales | No hay ninguno de los dos |
| DoS en App Router con Server Actions | Server Actions | No hay |
| SSRF en Server Actions con servidor custom | Server Actions + servidor custom | No hay |
| **Cache confusion de bodies en requests con body** | Rutas que reciben body | ⚠️ **Sí: 14 Route Handlers, varios `POST`** |
| **Cache confusion con UTF-8 inválido en el body** | Ídem | ⚠️ **Sí** |
| Payload sin límite de Server Action en Edge | Server Actions + Edge | No hay |
| SSRF por `rewrites` con destino controlado | `rewrites` | No hay |
| DoS en Image Optimization con SVG | `next/image` | No se usa |
| Exposición de endpoints internos de Server Functions | Server Actions | No hay |

**Los dos de *cache confusion* son los que hay que tomar en serio.** Los demás piden funciones que
este repo no tiene.

**`sharp` sólo lo usa la optimización de imágenes**, que no está en uso: las CVE de `libvips` no
tienen hoy camino de ejecución. **`postcss` corre en build**, sobre CSS propio.

**Y lo que de verdad contiene el riesgo hoy es otra cosa:** el MVP **no está desplegado** —no hay
`Dockerfile`, ni `.github/`, ni `.vercel/` en el repo— y corre con datos sintéticos. **Eso deja de
valer con el primer despliegue o la primera persona real**, y lo único que hoy frena las dos cosas es
el gate de [ADR-006](decisions.md#adr-006).

---

## 5. Qué NO hacer

**`npm audit fix --force` sobre la rama principal.** Instala `next@16.3.4` saltándose el rango
declarado y **sin quedar registrado en ningún ADR**. El problema no es la versión que elige —de hecho
es la correcta— sino que una decisión de stack quede como efecto colateral de un comando.

---

## 6. La decisión que le toca al CTO

| | Qué es | A favor | En contra |
|---|---|---|---|
| **A · `16.3.4`** *(recomendada)* | La última de la línea `16.3` | Cero `high`. Incluye cuatro releases de parches sobre `16.3.0` | Delta un poco mayor |
| **B · `16.3.0`** | El mínimo que corrige | Delta mínimo sobre `16.2.6` | Se pierde lo corregido en `16.3.1`–`16.3.4` |
| **C · No mover, con mitigación escrita** | Dejar la deuda documentada | Cero trabajo ahora | **No es viable antes de desplegar o de incorporar una persona real.** Sólo aplaza |

**Recomendación: A.** Es un minor, cierra las tres de una, no toca React y el repo tiene con qué
demostrar que no rompió nada (§7).

**Lo que hay que escribir en `ADR-008` al decidir:** la versión elegida y por qué.

> ⚠️ **Corrección al brief, del Product Owner.** Una versión anterior de este documento decía que pasar a rango
> con `^` haría que *"el próximo parche de seguridad entre solo"*. **Es falso.** Con un lockfile, `^`
> **sólo habilita** la actualización: para que entre hay que **renovar el lockfile explícitamente**,
> a mano o con Dependabot/Renovate. Automatizar actualizaciones es una **decisión separada** y no
> forma parte de este cambio.

---

## 7. El procedimiento, con los números de hoy

1. **Abrir la decisión en [ADR-008](decisions.md#adr-008)** con la versión y su fundamento.
2. **Rama aislada.** Subir `next` **y** `eslint-config-next` juntos.
3. **Los cinco gates**, que son los que pide el protocolo por etapa:

   | Comando | Estado actual, a batir |
   |---|---|
   | `npm run lint` | verde |
   | `npm run typecheck` | verde — ⚠️ **gate propio**: el build no alcanza los archivos de test |
   | `npm run build` | verde |
   | `npm test` | **953 tests en 52 archivos** |
   | `npm run db:reset && npm run db:verify` | **275 comprobaciones** contra Postgres, que `npm test` no puede hacer porque necesitan Docker |

4. **El recorrido del focus group en el navegador**, a 1440 y a 360 px
   ([ADR-014](decisions.md#adr-014): desktop-first, 360 px es el piso).
5. **El recorrido del MVP entero**, que está escrito paso a paso en [`demo-mvp.md`](demo-mvp.md) con
   su salida real. Es la prueba funcional más barata que tiene el repo.
6. **`npm audit` de nuevo.** Objetivo: **cero `high`**.
7. **Documentar cualquier vulnerabilidad residual y su mitigación** en el propio ADR-008.
8. **Corregir la afirmación de que era un major** en `roadmap.md` §3.1 y en la narrativa de la Etapa
   0.1, que hoy dicen otra cosa.

---

## 8. Lo que este repo ya tiene y conviene no romper

Un upgrade que rompa cualquiera de estas cuatro lo va a mostrar **`db:verify`, no el build**:

- **RLS deny-by-default** en todas las tablas, verificado en cada corrida.
- **El frontend no alcanza ninguna tabla de negocio** — guard estático más verificación de
  privilegios contra Postgres.
- **`product_event` y `audit_log` son append-only**, revocado incluso para `service_role`.
- **Storage privado**: leer sin firma da `400`, probado contra el storage real.

---

## 9. Contexto que conviene tener

**Esto ya se saltó un gate una vez.** La Etapa 0.1 registró la deuda como *"a evaluar antes del Done
de la Fase 0"* y **la Fase 0 se cerró 8/8 sin evaluarla**. Quedó anotado en `roadmap.md` §3.1 en vez
de enterrado en la narrativa de una etapa vieja, precisamente para que no volviera a pasar — y desde
entonces pasaron cuatro días.

**Una hipótesis sobre por qué se difirió tantas veces:** la deuda estaba descrita como *"subir la
versión mayor del framework"*, que suena a un trabajo de días y a un riesgo de regresión alto. **No lo
es**, y ese dato estaba mal en tres documentos.


---

## 10. Resultado de la actualización controlada · 2 de septiembre de 2026

> **Opción A autorizada para ejecución por el Product Owner y ejecutada satisfactoriamente.
> Pendiente de ratificación y cierre por el CTO en [ADR-008](decisions.md#adr-008).**

Ejecutada con seis condiciones, verificada contra la baseline. **No se declara firma, cierre ni
promoción en nombre del CTO.**

### 10.1 El cambio, y su alcance exacto

`package.json` — **dos líneas, nada más**:

```diff
- "next": "16.2.6",                 - "eslint-config-next": "16.2.6",
+ "next": "16.3.4",                 + "eslint-config-next": "16.3.4",
```

**Las seis condiciones, una por una:**

| # | Condición | Cómo se cumplió |
|---|---|---|
| 1 | Versiones fijadas exactas, sin `^` | ✅ Las dos quedaron exactas. Se verificó por `grep` sobre el archivo |
| 2 | No modificar React | ✅ `react` y `react-dom` siguen en `19.2.6`, sin tocar |
| 3 | Lockfile sólo como consecuencia | ✅ Un único `npm install`, sin flags. `11 784 → 11 857` líneas |
| 4 | Los cinco gates sobre la baseline | ✅ §10.3 — el de base de datos, **`db:reset && db:verify` completo**, con los dos códigos de salida |
| 5 | Registro antes/después completo | ✅ §10.2 y §10.3 |
| 6 | Si un gate falla, detener sin ampliar alcance | ✅ Ninguno falló. **Y el hallazgo ambiental no se tocó**: §10.4 |

### ⚠️ Limitación de trazabilidad — se conserva explícitamente

> **Corrección de un dato que este documento afirmó mal.** Una versión anterior de esta sección decía
> que *"el directorio no es un repositorio Git"*. **Es falso.** `Achieve_Platform/` **sí es un
> repositorio Git**: rama `feat/fase-0-track-a`, último commit `dfdfc40` (ADR-037). Lo que no es
> repositorio es el **directorio padre**, `Desktop/Plataforma/` — y de ahí salió la generalización
> equivocada. **Una rama aislada era posible, y no se usó.**

> **ADR-008 no fue desarrollado inicialmente en una rama aislada y actualmente comparte el working
> tree con 55 cambios anteriores. Sin embargo, Git permite aislarlo mediante staging selectivo y
> convertirlo en una unidad revisable y promovible sin arrastrar esos cambios. Ese aislamiento debe
> verificarse antes del commit.**

> ⚠️ **Segunda corrección a este documento.** Una versión anterior de esta tabla afirmaba que el
> cambio **no podía** revisarse ni promoverse por separado, *"porque cualquier commit arrastraría las
> otras 55 modificaciones"*. **Es falso.** Git permite seleccionar archivos **y hunks individuales**;
> que 55 archivos estén modificados no obliga a incluirlos.

**El aislamiento se ejecutó y se verificó** — §10.1.1 — y **después el trabajo se commiteó
localmente**, en cuatro commits. Estado de hecho, al 2 de septiembre de 2026:

| | |
|---|---|
| ✅ Revisable como unidad | `git show e703d10` — **5 archivos y nada más** |
| ✅ Separado del resto | El commit de ADR-008 no contiene ningún archivo de B6.7, B2b.2 ni del gate `typecheck` |
| ✅ Reversible | Los cuatro commits son **locales y no pusheados** |
| ⚠️ **Bajo revisión de trazabilidad** | Los commits se crearon **antes** de que su aislamiento se presentara para revisión, que era lo indicado. **Si se conservan tal como están, se rehacen o se deshacen, está sin decidir** — y este documento no lo decide |
| ⚠️ Sin firma | `decisions.md` sigue **sin tocar**. La ratificación es del CTO |

**Lo que sigue siendo cierto:** el trabajo no se hizo en una rama, y la copia previa no equivale a una
rama ni a un commit. **La limitación de origen queda registrada**; lo que dejó de ser cierto es que
fuera irreversible.

### 10.1.1 El candidato de revisión, aislado por staging selectivo

**Preparado el 2 de septiembre de 2026, sin commit.** El index estaba vacío antes de empezar
(`git diff --cached --name-only` → sin salida), así que **no se desarmó staging ajeno**.

| Archivo | Qué se incluyó | Cómo |
|---|---|---|
| `package.json` | **Sólo** los hunks de `next` y `eslint-config-next` | Patch construido a mano y aplicado con `git apply --cached`. **El hunk del script `typecheck` quedó fuera**, y sigue sin stagear |
| `package-lock.json` | Completo | **Después de confirmar el origen**: en `packages[""]` cambian únicamente esas dos versiones, y las 4 entradas nuevas son binarios de `sharp 0.35.4` y transitivas de `eslint-config-next 16.3.4` |
| `docs/brief-adr-008-seguridad.md` | Completo | Todo su contenido es de ADR-008 |
| `docs/roadmap.md` | **Sólo el hunk de §3.1** | 1 de 11 hunks. Los otros 10 —B2b.2, B6.7, el protocolo de `typecheck`— quedaron fuera |
| `CLAUDE.md` | **Sólo el hunk de `npm audit`** | 1 de 5 hunks. Los otros 4 —protocolo de `typecheck`, B6.7, B2b.2— quedaron fuera. ⚠️ Su texto **se actualizó primero**: decía *"3 `high` abiertas"* y `next@16.2.6`, que después de la actualización habría inducido al error |
| `docs/decisions.md` | **Nada** | El cierre espera la firma del CTO |

**Acreditación del candidato:**

| Criterio | Resultado |
|---|---|
| El script `typecheck` no está en el diff staged | ✅ **0 coincidencias en `package.json`**. Las 4 del brief son **referencias en prosa al gate**, no el cambio del script |
| Sin archivos de B6.7.1, B6.7.2, B2b.2 ni otras etapas | ✅ **5 archivos, ninguno ajeno** |
| Sin firma, cierre ni promoción atribuidos al CTO | ✅ Dice `AWAITING CTO SIGN-OFF` |
| El cambio técnico limitado a las dos versiones y su lockfile | ✅ 4 líneas en `package.json`, y el lockfile con origen confirmado |
| Los cambios documentales sólo de ADR-008 | ✅ El brief entero y §3.1 del roadmap |
| `git diff --cached --check` | ✅ sin whitespace ni marcadores de conflicto |

**El árbol, con su composición exacta** — `git status --short`, 57 entradas:

| | Cuántos | Qué son |
|---|---|---|
| Staged | **5** | El candidato de ADR-008. Dos completos (`package-lock.json`, el brief) y **tres parciales** (`package.json`, `docs/roadmap.md` y `CLAUDE.md`, con `MM`: la parte de ADR-008 en el index, el resto en el working tree) |
| Modificados sin stagear | **35** | B6.7.1, B6.7.2, B6.7.3, B6.7.4, B2b.2 y el gate de `typecheck` |
| **Sin trackear** | **17** | Migraciones, rutas, servicios y tests de esas mismas etapas |

Los 55 archivos con trabajo ajeno a ADR-008 son esos `36 + 17`, más las mitades sin stagear de los
dos `MM`.

⚠️ **Dato operativo para quien vaya a commitear:** `git commit -a` **barrería los 35 modificados**
—aunque no los 17 sin trackear— y rompería el aislamiento. El commit de ADR-008 tiene que ser
`git commit` **sin `-a`**, que toma el index y nada más.

**No se ejecutó** commit, push, stash, restore, rebase, cherry-pick ni reorganización alguna de los
otros archivos.

### 10.2 Versiones resueltas, antes y después

| Paquete | Antes | Después | |
|---|---|---|---|
| `next` | `16.2.6` | **`16.3.4`** | fuera del rango afectado |
| `eslint-config-next` | `16.2.6` | **`16.3.4`** | movida junto, como exigía |
| `postcss` (interno de `next`) | `8.4.31` | **`8.5.23`** | el aviso era `<= 8.5.22` |
| `sharp` | `0.34.5` | **`0.35.4`** | el aviso era `< 0.35.0` |
| `react` · `react-dom` | `19.2.6` | `19.2.6` | **sin cambio, como se pidió** |
| `postcss` (raíz, de Tailwind) | `8.5.26` | `8.5.26` | ya estaba sano |

**Auditoría de dependencias:**

| | Antes | Después |
|---|---|---|
| `high` | **3** (`next`, `postcss`, `sharp`) | **0** |
| Todas las severidades | 3 | **0** — `info`, `low`, `moderate`, `high`, `critical` en cero |

`npm install` lo reportó solo: *"added 4 packages, changed 39 packages… found 0 vulnerabilities"*.

### 10.3 Los cinco gates, contra la baseline

| # | Gate | Baseline | Después | |
|---|---|---|---|---|
| 1 | `npm run lint` | verde | **verde**, `exit 0` | ✅ |
| 2 | `npm run typecheck` | verde | **verde**, `exit 0` | ✅ |
| 3 | `npm run build` | verde | **verde**, `exit 0` · `Next.js 16.3.4` | ✅ ⚠️ warning nuevo, §10.4 |
| 4 | `npm test` | 953 en 52 archivos | **953 en 52 archivos** | ✅ sin desvío |
| 5 | `npm run db:reset && npm run db:verify` | 275 comprobaciones | **275**, `0` fallos | ✅ sin desvío |

**El gate 5, con su evidencia completa.** La primera corrida documentaba sólo `db:verify`: el reset
se había ejecutado como `npx supabase db reset` con la salida descartada, así que **no había
evidencia de su código de salida**. Y después de aquella corrida se sembró el mundo demo y se
ejecutó el recorrido del MVP, con lo cual la base **ya no estaba limpia**. Se volvió a correr el gate
entero, en orden y con todo capturado:

| Paso | Comando | Código de salida |
|---|---|---|
| 1 | `npm run db:reset` | **`EXIT_RESET=0`** — 46 migraciones aplicadas sobre base limpia |
| 2 | `npm run db:verify` | **`EXIT_VERIFY=0`** |

**Resultado:** **275 comprobaciones**, **0 fallos**, y las cuatro suites en verde — *entorno local
conforme* · *los constraints rechazan lo que el spec prohíbe* · *aislamiento, transiciones,
concurrencia e idempotencia* · *las funciones de lectura devuelven lo que las superficies proyectan*.
**Sin desvío contra la baseline.**

**Recorrido del focus group**, contra el **build de producción** —no el de desarrollo—, a los dos
viewports de [ADR-014](decisions.md#adr-014):

> **Las 9 superficies × 2 viewports = 18 cargas.** Cero errores de consola, cero `pageerror`, cero
> pantallas de error, y **cero scroll horizontal del body a 360 px**, que es el contrato del piso
> móvil.

**Recorrido del MVP** ([`demo-mvp.md`](demo-mvp.md)), de punta a punta contra el stack local: la
tercera aparición produjo `{"apariciones":3,"necesitaPersona":true}`, la señal quedó en
`INTERVENTION_REQUIRED`, el estudiante ve su explicación sin filtraciones internas, la cola sintética
tiene **un** caso, y **el replay no encoló un segundo**.

### 10.4 Hallazgo ambiental no bloqueante — **fuera del alcance de ADR-008**

**Un warning nuevo en el build**, que no existía en `16.2.6` y **no lo hace fallar**:

```
⚠ Next.js ignored package-lock.json in /Users/felipeeguia03/Desktop/Plataforma
  because it is outside the current Git repository.
  To use this directory, set `turbopack.root` in your Next.js config.
```

**Causa, medida:** hay un `package-lock.json` **huérfano en el directorio padre** —89 bytes,
`"packages": {}`, sin ningún `package.json` al lado, del 30 de agosto—. Next 16.3 infiere la raíz de
Turbopack y lo encuentra.

> **Decisión del Product Owner: no se corrige dentro de ADR-008.** **No se borra** el
> `package-lock.json` externo y **no se modifica** `next.config.ts`. Es un **hallazgo ambiental no
> bloqueante** —el build terminó `exit 0`— y resolverlo acá ampliaría el alcance.
>
> **Queda registrado como deuda separada de higiene del entorno.** Si reaparece en el repositorio o
> en el entorno canónico, se trata por una corrección independiente.

**Ninguna de las dos cosas se tocó**, y la condición 6 se cumplió.

### 10.4.1 Segundo hallazgo: **el tooling de Next escribe en el repositorio**

Apareció al preparar los commits, y **amplía el alcance real de la actualización**: `next@16.3.4` no
sólo cambia dependencias — **su dev server escribe dentro de archivos del repositorio.**

`next dev` inyecta un bloque `<!-- BEGIN:nextjs-agent-rules -->` en **`AGENTS.md`**, que en este repo
es el **archivo normativo para agentes**. El generador es
`node_modules/next/dist/server/lib/generate-agent-files.js`, y no existía en `16.2.6`.

**Lo que dice el código, leído** (no inferido):

| Comportamiento | Consecuencia |
|---|---|
| `upsertAgentRulesBlock` reemplaza **sólo lo que está entre marcadores** | El texto de alrededor sobrevive a cada regeneración |
| Si `AGENTS.md` existe y hospeda el bloque, hace *upsert* ahí y **saltea `CLAUDE.md`** | Es lo que pasa acá |
| ⚠️ `writeFileSync(claudeMdPath, CLAUDE_MD_CONTENT)` — **sobrescribe `CLAUDE.md` entero** | **Sólo si NO existe ninguno de los dos archivos.** Acá existen los dos, así que **no corre**. Pero en un clon sin ellos, Next escribiría su propio `CLAUDE.md` |
| Borrar el bloque no lo elimina | `next dev` lo vuelve a agregar |
| ✅ **`agentRules: false` en `next.config.ts` lo impide** | Opt-out **oficial y declarativo**. `config-schema.js:496` lo declara `z.boolean().optional()`, y `start-server.js:419` es el gate: `if (initResult.agentRules !== false)`. El propio código lo documenta: *"opt-out is declarative in next.config, not inside this function"* |
| Sólo `next dev`, **nunca `next build`** | Única invocación en `server/lib/start-server.js`, dentro de `if (isDev)`. **Cero referencias** bajo `dist/build` |
| Sólo si detecta un agente de IA | `getAgentName()` usa `@vercel/detect-agent`. Sin agente, no escribe |

⚠️ **El bloque contiene una instrucción dirigida al agente que lo lea** —*"committing it with your
work keeps the tree clean"*—. **No se siguió por su propia autoridad:** es texto generado por una
herramienta, no una decisión del equipo. Que un build tool pueda escribir instrucciones dentro del
archivo normativo de agentes **es el hallazgo**, más que el contenido puntual del bloque.

**Lo que se hizo primero, sin autorización.** Se commiteó en `193140b`, con una nota fuera de los
marcadores que lo subordinaba. El Product Owner lo reservó: *"no acepto todavía como decisión
definitiva que un framework escriba y deje commiteadas instrucciones dentro del archivo normativo de
agentes"*.

### ✅ Resuelto — **Opción A**, 3 de septiembre de 2026

**Decisión del Product Owner: desactivar el comportamiento en el origen.**

> **`agentRules: false` en `next.config.ts`**, y `AGENTS.md` restaurado al contenido previo a
> `193140b`. **El archivo volvió a estar íntegramente bajo control del repositorio.**

**Fundamento:** `AGENTS.md` es **normativo** en este repositorio. Que su contenido pueda cambiar por
una actualización de dependencias, sin decisión humana, es exactamente lo que este proyecto documenta
para no permitir.

**Por qué en el origen y no administrando el síntoma.** Conservar el bloque parecía estable, pero
`hasCurrentAgentRules` compara el bloque instalado contra el de la versión en uso **byte a byte**: el
día que Next cambie una coma de ese texto, la comparación falla y **lo reescribe solo**, en una
actualización futura y sin aviso. `agentRules: false` corta eso de raíz — el gate de
`start-server.js` ni siquiera llama al generador.

**`193140b` se conserva en el historial.** No se reescribió ni se revirtió: el rastro de que esto
ocurrió, y de cómo se resolvió, queda completo.

| Estado | Verificación |
|---|---|
| `next.config.ts` | `agentRules: false`, top-level de `NextConfig` — es donde el tipo lo declara, no bajo `experimental` |
| `AGENTS.md` | **Cero marcadores `nextjs-agent-rules`**, cero rastros de la nota manual |
| `next dev` | Arrancado y detenido: **no volvió a crear ni modificar `AGENTS.md` ni `CLAUDE.md`** |

⚠️ **Lo que esto no cubre:** en un clon donde **no existan** ni `AGENTS.md` ni `CLAUDE.md`, la tercera
rama del generador escribiría su propio `CLAUDE.md` completo. `agentRules: false` lo previene, porque
`next.config.ts` va commiteado — pero depende de que el clon lo tenga.

### 10.4.2 Tercer hallazgo: `git diff --check` falla en el rango

`git diff --check dfdfc40..HEAD` sale con **exit 2**. Tres líneas con *trailing whitespace* en
`docs/decisions.md` (3096–3098), que son saltos de línea markdown de dos espacios y **provienen de
trabajo anterior a esta sesión** (el ADR de la etapa B6.7.4).

Por commit: **`7e99849` reporta**; `b611eb3`, `e703d10` y `193140b` salen limpios. **El commit de
ADR-008 no está afectado.**

⚠️ **Fue un hueco de la verificación:** `--check` se corrió sobre el index del candidato de ADR-008,
que salía limpio, pero **nunca sobre el commit del trabajo de dominio**.

✅ **Resuelto el 3 de septiembre de 2026: no se corrige, porque no es un defecto.** Son **saltos de
línea Markdown intencionales** —dos espacios al final— en el encabezado de ADR-038. `docs/decisions.md`
queda intacto.

### 10.5 Lo que queda pendiente

**✅ Resuelto por el Product Owner — 3 de septiembre de 2026:**

0. **Los cuatro commits locales se conservan.** `b611eb3` y `e703d10` son atómicos; rehacer `7e99849`
   no habría recuperado una separación verificable entre etapas ya superpuestas; y deshacerlos habría
   devuelto trabajo validado a un árbol sin custodia. El defecto documental de `e703d10` se corrigió
   **por commit posterior**, conservando el rastro. Y **`AGENTS.md` se resolvió por la opción A**
   (§10.4.1), conservando `193140b` en el historial.

**✅ Cerrado por el CTO — 3 de septiembre de 2026:**

1. **[ADR-008](decisions.md#adr-008) está ratificado y firmado.** La
   [Enmienda 1](decisions.md#adr-008-enmienda-1) registra la versión, su fundamento y el alcance de
   la autorización. El estado pasó a `ACCEPTED — AMENDED AND SIGNED`.
   ⚠️ **El nombre del firmante quedó como marcador** (`[Nombre del CTO]`) y hay que reemplazarlo:
   no se inventa. Todo lo demás de la firma llegó completo.
   ⚠️ **La promoción autorizada es el push de la rama, y nada más.** Merge a principal y despliegue
   siguen sin autorización.

**Fuera de ADR-008, registrado como deuda separada:**

2. **Higiene del entorno** — el `package-lock.json` huérfano del directorio padre (§10.4). No
   bloqueante, **sin tocar**. Se trata por una corrección independiente si reaparece en el
   repositorio o el entorno canónico. *(El otro hallazgo ambiental, el de `AGENTS.md`, quedó resuelto
   en §10.4.1.)*
3. **Trazabilidad** — el trabajo **no se hizo en una rama aislada**, aunque el repositorio Git
   existía (§10.1). **Ya está aislado por staging selectivo** (§10.1.1) y es promovible por sí solo;
   lo que queda registrado es que el aislamiento fue posterior, no de origen.
4. **Automatizar actualizaciones** —Dependabot/Renovate— quedó explícitamente **fuera** de este
   cambio, como decisión separada.
