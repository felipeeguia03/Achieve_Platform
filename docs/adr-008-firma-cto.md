# ADR-008 · Enmienda 1 — el paquete de firma del CTO

**Documento:** `docs/adr-008-firma-cto.md`
**Fecha:** 3 de septiembre de 2026 · **re-medido contra el árbol instalado**
**Estado:** ✅ **`SIGNED`** · ratificado por el CTO el 3 de septiembre de 2026
**Para:** CTO
**Origen:** [`brief-adr-008-seguridad.md`](brief-adr-008-seguridad.md) §10, ejecutado por el Product
Owner con la opción A autorizada.

> ✅ **Firmado.** Las tres decisiones quedaron ratificadas y el fundamento del CTO está transcripto en
> §7. La enmienda vive ahora en [ADR-008 · Enmienda 1](decisions.md#adr-008-enmienda-1), que es el
> registro canónico; este documento queda como el pliego que la sustentó.

---

## 0. Qué se firma, en una línea

Que **`next` y `eslint-config-next` pasan de `16.2.6` a `16.3.4`** —fijadas exactas, sin tocar
React— queda registrado como decisión de stack en ADR-008, y no como efecto colateral de un comando.

---

## 1. Las cuatro decisiones que se firmaron

### D1 · La versión: `16.3.4`

Ejecutada la **opción A** del brief §6. Las tres alternativas que estaban sobre la mesa:

| | Qué era | Por qué no |
|---|---|---|
| **A · `16.3.4`** ✅ | La última de la línea `16.3` | — **es la que se ejecutó** |
| B · `16.3.0` | El mínimo que corrige | Se perdían los parches de `16.3.1`–`16.3.4` |
| C · No mover | Deuda documentada | No es viable antes de desplegar o de incorporar una persona real |

**Lo que hay que dejar escrito es la versión y su fundamento.** Ninguna de las tres es indefendible;
lo que no se puede es que no quede dicha cuál se eligió.

⚠️ **Ningún parche de la línea `16.2` era una opción conservadora.** El rango afectado llega hasta
`16.3.0-preview.10`, así que `16.2.7`…`16.2.12` siguen adentro. **El mínimo que corrige es `16.3.0`.**

### D2 · El pin exacto se conserva, sin `^`

`package.json` sigue fijando la versión **exacta**. Eso es lo que dispara el aviso de npm
*"outside the stated dependency range"* en cada actualización futura — es ruido conocido, no un
defecto.

⚠️ **Pasar a `^` no haría que el próximo parche entre solo.** Con lockfile, `^` **sólo habilita**: para
que entre hay que renovar el lockfile explícitamente. Automatizar eso es la decisión separada de §3.

### D3 · `agentRules: false` en `next.config.ts`

**Es la parte de más alcance de toda la actualización, y no es una dependencia.** Desde `16.3.4`,
`next dev` inyecta un bloque de reglas dentro de **`AGENTS.md`**, que en este repositorio es el
**archivo normativo para agentes**.

| Lo que hace el generador, leído en el código | Consecuencia |
|---|---|
| `upsertAgentRulesBlock` reemplaza sólo lo que está entre marcadores | El texto de alrededor sobrevive |
| Si `AGENTS.md` existe y hospeda el bloque, hace *upsert* ahí | Es lo que pasaba acá |
| `writeFileSync(claudeMdPath, CLAUDE_MD_CONTENT)` | **Sobrescribe `CLAUDE.md` entero** — sólo si no existe ninguno de los dos archivos |
| `hasCurrentAgentRules` compara el bloque byte a byte contra el de la versión en uso | El día que Next cambie una coma, **lo reescribe solo** |
| Sólo `next dev`, nunca `next build`; sólo si detecta un agente de IA | El gate está en `start-server.js`, dentro de `if (isDev)` |

Se desactivó **en el origen**, no administrando el síntoma: `agentRules: false` es el opt-out oficial
y declarativo, y con él el generador no se llama nunca.

**El fundamento a ratificar:** que el contenido de un archivo normativo pueda cambiar por una
actualización de dependencias, sin decisión humana, es exactamente lo que este proyecto documenta
para no permitir.

⚠️ **Lo que esto no cubre:** en un clon donde **no existan** ni `AGENTS.md` ni `CLAUDE.md`, la tercera
rama del generador escribiría su propio `CLAUDE.md`. `agentRules: false` lo previene porque
`next.config.ts` va commiteado — pero depende de que el clon lo tenga.

### D4 · La promoción

Al momento de la firma el trabajo estaba **commiteado localmente y sin pushear**: la rama
`feat/fase-0-track-a` iba **35 commits adelante** de `origin`.

✅ **Ratificado: la firma autoriza el push** de `feat/fase-0-track-a`.

⚠️ **Y nada más.** El propio CTO acotó el alcance: *"Esta autorización publica el trabajo existente,
pero no implica por sí sola autorización de merge a la rama principal ni de despliegue."*

---

## 2. La evidencia sobre la que firmás

Todo lo de esta sección está **medido contra el árbol instalado el 3 de septiembre de 2026**, no
copiado del brief.

### 2.1 Versiones resueltas

| Paquete | Antes | Ahora | |
|---|---|---|---|
| `next` | `16.2.6` | **`16.3.4`** | fuera del rango afectado |
| `eslint-config-next` | `16.2.6` | **`16.3.4`** | movida junto, como exigía |
| `postcss` (interno de `next`) | `8.4.31` | **`8.5.23`** | el aviso era `<= 8.5.22` |
| `sharp` | `0.34.5` | **`0.35.4`** | el aviso era `< 0.35.0` |
| `react` · `react-dom` | `19.2.6` | `19.2.6` | **sin cambio** |
| `postcss` (raíz, de Tailwind) | `8.5.26` | `8.5.26` | ya estaba sano |

**`postcss` y `sharp` no eran deudas propias:** ninguno de los dos figura en `package.json`. Eran la
misma deuda de `next`, contada tres veces.

### 2.2 Auditoría

| | Antes | Ahora |
|---|---|---|
| `high` | **3** | **0** |
| `info` · `low` · `moderate` · `high` · `critical` | 3 en total | **0 en todas** |

### 2.3 Los gates

| # | Gate | Baseline | Resultado | Verificado |
|---|---|---|---|---|
| 1 | `npm run lint` | verde | **verde**, `exit 0` | ✅ **hoy** |
| 2 | `npm run typecheck` | verde | **verde**, `exit 0` | ✅ **hoy** |
| 3 | `npm run build` | verde | verde, `exit 0` · `Next.js 16.3.4` | 2 sep · ⚠️ warning ambiental, §3 |
| 4 | `npm test` | 953 en 52 archivos | **953 en 52 archivos** | ✅ **hoy** |
| 5 | `npm run db:reset && npm run db:verify` | 275 comprobaciones | 275, `0` fallos, ambos `exit 0` | 2 sep — necesita Docker |

⚠️ **Los gates 3 y 5 no se re-corrieron hoy**, y hay que decirlo: el 5 hace `db:reset`, que borra el
mundo demo sembrado. Los números son los de la corrida del 2 de septiembre documentada en el brief
§10.3. Los otros tres se midieron para este documento.

### 2.4 El alcance real del cambio en el repositorio

`git show --stat e703d10` — **cinco archivos, y nada más**:

| Archivo | Qué |
|---|---|
| `package.json` | **4 líneas**: las dos versiones |
| `package-lock.json` | Consecuencia de un único `npm install` sin flags |
| `docs/brief-adr-008-seguridad.md` | El brief |
| `docs/roadmap.md` | Sólo el hunk de §3.1 |
| `CLAUDE.md` | Sólo el hunk de `npm audit` |

`agentRules: false` entró después, en `c8c03e6`, junto con la restauración de `AGENTS.md`.

---

## 3. Lo que **no** se firma acá

Está declarado fuera de alcance a propósito. Firmar la enmienda **no** decide ninguna de las tres:

| | Qué es | Estado |
|---|---|---|
| **Automatizar actualizaciones** | Dependabot / Renovate | Decisión separada, sin abrir |
| **El `package-lock.json` huérfano** | 89 bytes en `Desktop/Plataforma/`, sin `package.json` al lado. Hace que `next build` avise que ignora un lockfile fuera del repo | **Hallazgo ambiental no bloqueante.** El build sale `exit 0`. Sin tocar, por decisión del PO |
| **El rango `^`** | Ver D2 | No se cambia |

---

## 4. La limitación que se conserva registrada

**El trabajo no se hizo en una rama aislada, aunque el repositorio Git existía.** Se aisló después,
por staging selectivo, y el commit `e703d10` es revisable y promovible por sí solo — pero **el
aislamiento fue posterior, no de origen**.

Eso no se borra ni se corrige: queda dicho. La revisión de trazabilidad que esto abrió **la resolvió
el Product Owner el 3 de septiembre**: los commits locales se conservan, el defecto documental de
`e703d10` se corrigió por commit posterior, y `193140b` —el commit del bloque inyectado— **se conserva
en el historial** en vez de reescribirse.

---

## 5. El texto que se pegó en `decisions.md`

✅ **Ya está aplicado**, dentro de [ADR-008](decisions.md#adr-008) como
[Enmienda 1](decisions.md#adr-008-enmienda-1), con el fundamento del CTO transcripto. No reemplazó el
cuerpo original: la decisión de agosto —Next 16 estándar en lugar de `vinext` + Cloudflare Workers—
sigue siendo la que es, y ésta la enmienda.

Queda abajo como referencia de lo que se escribió.

```markdown
**Estado:** `ACCEPTED` · 28 ago 2026 · **enmendado el ___ de _________ de 2026** (Enmienda 1)
**Toca:** `architecture.md`, `roadmap.md`, `package.json`, `next.config.ts`.

---

### Enmienda 1 — la actualización de seguridad de `next`

**Estado:** `ACCEPTED` · ___ de _________ de 2026
**Ratificada por:** _________________________ · CTO
**Ejecutada por:** el Product Owner, opción A del brief, 2–3 de septiembre de 2026.
**Cierra:** las tres vulnerabilidades `high` heredadas del árbol del prototipo.

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

#### Vulnerabilidades residuales

**Ninguna.** `npm audit` reporta **0** en las cinco severidades, verificado contra el árbol
instalado. No hay mitigación que documentar porque no queda nada que mitigar.

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
```

---

## 6. Lo que se sincronizó al firmar

✅ **Los cinco están hechos.** En los dos textos históricos de `decisions.md` —filas de ADR-024 y
ADR-035— la corrección fue **por nota fechada, conservando el original**, que es la convención del
repositorio y lo que pide el criterio de trazabilidad del CTO: se puede ver qué decía antes.

| # | Dónde | Cómo quedó |
|---|---|---|
| 1 | Índice de ADR-008 | `ACCEPTED` · **enmendado**, con enlace a la Enmienda 1 |
| 2 | ADR-024, «la deuda que este ADR no borra» | Fila tachada y cerrada + nota que corrige *«sube la mayor de Next»* — era la **cuarta copia** de ese error |
| 3 | ADR-035, cierre | Nota de cierre fechada |
| 4 | `CLAUDE.md` y `roadmap.md` §3.1 | `ACCEPTED — AMENDED AND SIGNED`, con el límite del push explícito |
| 5 | `roadmap.md` §2, Mapa de bloqueos | La fila **salió** |

El detalle de lo que decía cada uno antes de la firma:

| # | Dónde | Qué dice hoy | Qué pasa a decir |
|---|---|---|---|
| 1 | [`decisions.md`](decisions.md) fila del índice de ADR-008 | `ACCEPTED` | `ACCEPTED` · enmendado |
| 2 | [`decisions.md`](decisions.md) §"la deuda que este ADR no borra" | `` `npm audit` — 3 `high` \| **Sube la mayor de Next** `` | Cerrada. ⚠️ Y **"la mayor" es falso**: es un minor, y ésta es la cuarta copia de ese error |
| 3 | [`decisions.md`](decisions.md), cierre de ADR-035 | *"sigue en pie la deuda de ADR-008: 3 vulnerabilidades `high`"* | Cerrada |
| 4 | [`CLAUDE.md`](../CLAUDE.md) y [`roadmap.md`](roadmap.md) §3.1 | `TRACEABILITY REVIEW REQUIRED — NO PUSH` | El estado que quede tras D4 |
| 5 | [`roadmap.md`](roadmap.md) §2, Mapa de bloqueos | *"La revisión de trazabilidad de ADR-008"* | La fila **sale**: la revisión se resolvió el 3 de septiembre |

---

## 7. Firma

> ✅ **Ratificada el 3 de septiembre de 2026.** El estado de ADR-008 pasó a
> `ACCEPTED — AMENDED AND SIGNED`.

| | |
|---|---|
| **Versión ratificada** | ☑ **`16.3.4` (opción A)** — pin exacto, React sin modificar |
| **`agentRules: false` ratificado** | ☑ **sí** |
| **La firma autoriza el push** | ☑ **sí**, sobre `feat/fase-0-track-a` |
| **Nombre y fecha** | **Conrado Verzini** · CTO · **3 de septiembre de 2026** |

⚠️ **Lo que la firma *no* autoriza**, dicho por el propio CTO: **merge a la rama principal** y
**despliegue**. Las dos necesitan decisión propia, y el despliegue además sigue bloqueado por
[ADR-006](decisions.md#adr-006) para cualquier dato real.

### Fundamento del CTO

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

**Los cuatro criterios del último párrafo —explícito, trazable, reversible y verificable— rigen de
acá en adelante**, no sólo esta enmienda. Quedaron replicados en
[`CLAUDE.md`](../CLAUDE.md) y en la Enmienda 1.
