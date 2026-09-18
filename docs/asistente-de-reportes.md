# Asistente de reportes → Pull Request

**Documento:** `docs/asistente-de-reportes.md`
**Rol:** plan de construcción del backend del asistente de reportes y mejoras.
**Estado:** 🟡 **PROPUESTO — NO EMPEZADO.** Última actualización: 18 de septiembre de 2026.

> ⚠️ **Esto es un plan, no un ADR.** Ninguna decisión de negocio de acá está tomada. Las cierra
> **ADR-112**, que todavía no existe, y las decide una persona (§12). Si estás por implementar algo
> y este documento es tu única fuente, **parate**: falta el ADR.

---

## 0.0 Estado del trabajo — 18 de septiembre de 2026

| Rama | Estado |
|---|---|
| **`chore/ci`** | ✅ **Completa.** El arreglo de `db:verify`, este documento, los dos workflows de CI y los números de `CLAUDE.md` y `README.md`. Se integra a `main` por PR, y **el merge lo hace una persona** |
| **`feat/reportes`** | ⬜ No empezada. **La bloquea ADR-112** |

Los cinco gates, verificados sobre `chore/ci`: `lint` ✅ · `typecheck` ✅ · `build` ✅ ·
`test` ✅ 3675 en 129 archivos · `db:verify` ✅ 552, cero fallos.

**Lo que falta, en orden:**

1. **Mergear `chore/ci`**, con el CI en verde en su PR. No contiene ninguna decisión de negocio, así
   que no espera a ADR-112.
2. **ADR-112** (§12). Lo decide una persona.
3. **`feat/reportes`**, etapa por etapa.

⚠️ **Para la etapa 1 alcanzan cuatro de las nueve decisiones** —`D-01`, `D-02`, `D-06` y `D-08`—.
Las demás frenan las etapas 3 y 4.

⚠️ **Escribir en el repositorio no es administrarlo.** El permiso de escritura alcanza para pushear
ramas y abrir PRs. **La etapa 4 necesita más:** instalar una GitHub App y proteger `main` son
cambios de la configuración del repositorio, y en un repo de cuenta personal los hace el dueño,
`felipeeguia03`.

---

## 0. Qué existe hoy

El asistente **ya está construido como interfaz** — [ADR-103](decisions.md#adr-103), pedido por el
owner el 13 de septiembre con capturas de otro software delante. Botón redondo abajo a la derecha,
panel con dos opciones, pregunta aclaratoria, tarjeta *Tu sugerencia*, *Confirmar y enviar*, píldora
*Reporte enviado*.

**Lo que contesta es un guion fijo. No envía nada, no persiste nada, no habla por red.** Sólo se
monta con `MODO_PRUEBA=1` y lleva el rótulo *Simulado* siempre a la vista.

| Pieza | Archivo |
|---|---|
| El componente | `components/shell/asistente.tsx` |
| El guion simulado | `lib/client/simulacion/asistente.ts` |
| El marco (título, botones, `aria-label`) | `lib/content/es-AR.ts`, claves `ASISTENTE.*` |
| Dónde se monta | `app/(student)/layout.tsx` y `app/alta/layout.tsx`, las dos detrás de `MODO_PRUEBA` |
| Su test | `tests/asistente.test.tsx` |

El propio ADR-103 dejó escrito qué sigue:

> *"El guion no es el contrato del backend. La pregunta aclaratoria y el resumen los va a escribir
> él; esta máquina de fases **se reemplaza**, no se extiende. […] Qué se guarda de un reporte, a
> quién le llega, si lleva la pantalla y la sesión en la que ocurrió y cómo se tratan las capturas
> —que pueden mostrar datos de una persona— se decide entonces, y **esa parte sí toca ADR-006**."*

Y el comentario de `es-AR.ts:1328` lo repite: *"lo reemplaza el backend"*.

**Este documento es ese trabajo.**

---

## 1. Qué se construye

El estudiante reporta un problema o propone una mejora conversando. Eso termina en un **Pull Request
abierto contra este repositorio, con el arreglo escrito y el CI corrido**. El owner revisa y mergea.

### La corrección conceptual que hay que sostener siempre

**NO es "el chat conectado a Claude y al código fuente".** Esa imagen mental hace que el proyecto
salga mal.

Son **cinco etapas separadas, en máquinas distintas, con niveles de confianza distintos**. El chat
que ve el estudiante **nunca** habla con el agente que escribe código. El agente tampoco "entra al
sistema": se levanta un contenedor efímero, se clona el repo adentro, trabaja sobre esa copia
descartable y el contenedor se destruye.

### Las cinco etapas

| # | Etapa | Dónde corre | Qué hace |
|---|---|---|---|
| 1 | **Captura** | Navegador + `/api/reporte` | Extrae lo necesario para reproducir. La salida es un JSON, no una charla. **Sin pasos de reproducción, el pipeline corta acá** |
| 2 | **Triage** | Servidor, asincrónico | Clasifica, **deduplica**, y recién ahí crea el issue con token de bot. El estudiante nunca toca GitHub |
| 3 | **Compuerta humana** | Celular del owner | Aprueba cada issue antes de que vaya al agente. **Innegociable** |
| 4 | **Agente** | Sandbox efímero | Clona, escribe el arreglo mínimo, corre los tests, abre el PR. Devuelve `IN_REVIEW` / `NEEDS_INFO` / `DECLINED` |
| 5 | **Verificación** | CI + review | CI sobre el PR, revisor automático, **merge humano siempre** |

`NEEDS_INFO` es el mejor detalle del diseño: el agente tiene una pregunta y **vuelve al chat del
estudiante**. Cierra el círculo sin meter a un desarrollador.

Y lo que cierra el producto: **el estado vuelve al widget**. *"Lo estamos mirando"* → *"hay un
arreglo en revisión"* → *"salió"*. Sin eso, para el estudiante es un buzón sin fondo.

---

## 2. Lo innegociable

Si algo de esto se propone saltear, **frenar y citar esta sección**.

1. **Las cinco etapas separadas.** El chat nunca habla con el agente de código.
2. **La compuerta humana antes del agente.** Sin ella, cualquier estudiante logueado le está dando
   instrucciones directas a un agente con permiso de escritura sobre el repo. Es la defensa
   principal, no un detalle de UX. En 2026 se documentó que **un solo título de PR, escrito por
   alguien sin ningún permiso especial, secuestró simultáneamente al agente de security review de
   Anthropic, a la Gemini CLI Action de Google y al Copilot Coding Agent de GitHub**, y los tres
   exfiltraron secretos del repositorio.
3. **Lista negra mecánica de rutas** (§6). No un prompt pidiéndole que se porte bien.
4. **El CI tiene que correr sobre el PR del agente.** GitHub **no dispara workflows sobre commits
   hechos con el `GITHUB_TOKEN` por defecto**: hay que autenticar con una GitHub App. Si no, el PR
   llega sin verificar y se pierde toda la red de contención. **Es el gotcha que arruina el proyecto
   en silencio.**
5. **Merge humano siempre.** Nunca auto-merge.
6. **El orden de fases: capturar → triagear → aprobar → arreglar.** Y después de la fase 1 se
   **para a medir** (§10).

---

## 3. Dónde va cada cosa

| Pieza | Archivo |
|---|---|
| Widget (existe) | `components/shell/asistente.tsx` |
| Guion simulado | `lib/client/simulacion/asistente.ts` → **se borra** |
| Red del widget | `lib/client/api.ts` (`enviar` / `pedir`) |
| Contexto del navegador | nuevo `lib/client/reporte/contexto.ts` |
| Buffer de errores de consola | nuevo componente cliente montado en el layout (§4.3) |
| Controller | `app/api/reporte/route.ts`, `app/api/reporte/mensaje/route.ts`, `app/api/reporte/captura/firma/route.ts` |
| Service | `lib/server/servicios/reporte.ts` + `proyeccion-reporte.ts` |
| Repository | `lib/server/repositorios/reporte.ts` |
| **Llamada a Anthropic** | `lib/server/repositorios/anthropic.ts`, con `import "server-only"` |
| Repository de GitHub (etapa 2) | `lib/server/repositorios/github.ts`, `server-only` |
| Inyección de dependencias | `lib/server/composicion.ts` |
| Dominio puro | `lib/domain/reporte.ts` — máquina de estados + criterio de accionabilidad |
| Copy | `lib/content/es-AR.ts` (regla `C-07`) |
| Migración | `supabase/migrations/2026…_reporte.sql` — **la número 100** |
| Storage | bucket privado + URL firmada, patrón de `analitico` / `clase-material` |
| Evento | `lib/domain/product-events.ts` → `EXTENSIONES` |
| Limpieza | `scripts/db-aislamiento.sh` → `limpiar_mundo` |
| Secretos | `ANTHROPIC_API_KEY`, `GITHUB_APP_*` en `.env.local.example`, **sólo servidor** |

⚠️ **`lib/client/` y `lib/server/repositorios/` son las dos únicas capas que pueden hablar por red.**
Hay guard: `tests/track-a-rules.test.ts` prohíbe `fetch(` en todo el resto. Una pantalla que hace
`fetch` decide de dónde salen sus datos, y esa frontera es lo que hace barato todo lo demás.

⚠️ **El frontend nunca llama al modelo.** `ANTHROPIC_API_KEY` es secreto de servidor. El navegador
sólo usa la clave `anon` y sólo para Auth ([ADR-005](decisions.md#adr-005)).

---

## 4. Modelo de datos

### 4.1 Los nombres

**`product_report`, no `feedback_report`.** En este dominio *feedback* ya significa otra cosa: el
feedback académico sobre una evidencia (`product.md:129`, y la pantalla de revisión del spec tiene un
campo *Feedback*). `product_report` rima con `product_event`, que es exactamente la misma idea: **del
producto, no de lo académico**.

| Tabla | Qué guarda |
|---|---|
| `product_report` | Un reporte de un estudiante |
| `product_report_message` | Los turnos de la conversación. Append-only |
| `product_report_attachment` | Las capturas, en bucket privado |
| `product_report_issue` | **El problema**, al que apuntan N reportes |

### 4.2 Las reglas que no son negociables

- **RLS habilitada y sin políticas.** Es el patrón de las 26 tablas que ya la tienen: deny-by-default
  total, y el acceso pasa sólo por `service_role` desde el Repository. **No se escribe una política
  anclada a `auth.uid()`**: este repo no las usa.
- **Se agrega a `limpiar_mundo` en el mismo commit** (`scripts/db-aislamiento.sh`). Es la regla que
  salió del 14 de septiembre: las 40 sentencias van en **una sola transacción**, así que una FK que
  falta aborta todo y `db:verify` deja de correr con un error que no nombra la causa.
- **La máquina de estados es una tabla de transición explícita**, no `if` encadenados, con test de
  transiciones prohibidas. Un `DECLINED` no se reabre: se crea otro reporte.
- **El reporte NO es un hecho de cursada.** No entra a `hechos_de_cursada()`, no aparece en la
  Bitácora (`enBitacora: false`), no toca `action`, `evidence`, el ADE ni el riesgo. Reportar un bug
  no es avance académico.
- `product_event.subject_id` es `uuid NOT NULL` → el sujeto es el id del reporte.

### 4.3 Tres detalles que no son obvios

**⚠️ La ruta NO puede devolver `409 ALTA_INCOMPLETA`.** El widget también se monta en
`app/alta/layout.tsx` —hay guard que lo exige—, y un estudiante a mitad del alta es justo el que más
se topa con un bug. Misma excepción que `GET /api/alta` y `/api/prueba/alta`.

**⚠️ Cuando el estudiante abre el chat, el error de consola ya pasó.** Hace falta un componente
cliente chico montado temprano en el layout, con un **buffer circular en memoria**. Nada de
`localStorage`: `tests/track-a-rules.test.ts` lo prohíbe y la lista de excepciones está **cerrada en
tres módulos**, cada uno con su ADR. Ampliarla exige un ADR, no ensanchar el regex.

**⚠️ No existe un SHA de build.** Next no lo expone y la firma de deduplicación lo necesita: hay que
inyectar `NEXT_PUBLIC_BUILD_SHA` al compilar.

### 4.4 🔴 Texto escrito por un modelo va a llegar a la pantalla del estudiante

**Es la primera vez que pasa en este repo, y es el riesgo de calidad más grande de la etapa 1.**

Hoy **cada frase que lee un estudiante es un `CopyId` de `lib/content/es-AR.ts`**, con guards que
verifican voseo (`C-01`), ausencia de inglés (`tests/copy-sin-ingles.test.ts`) y vocabulario
prohibido. Una pregunta aclaratoria escrita por un modelo **se saltea todo ese control**.

Lo que ADR-112 tiene que fijar:

- El modelo escribe **una sola cosa: la pregunta aclaratoria.** Todo lo demás sigue siendo `CopyId`.
- **El servidor valida su salida antes de mandarla al cliente**: largo máximo, voseo, sin inglés, y
  **sin prometer contacto ni plazos** — ADR-103 y `product.md` §13: la Plataforma no observa quién
  lee el reporte ni cuándo.
- Si la validación falla, se cae a un `CopyId` fijo. **Nunca se muestra texto del modelo sin validar.**

### 4.5 El triage devuelve estructura, no prosa

El texto del estudiante entra a un modelo cuya salida decide duplicados y redacta el issue. Es
prompt injection de manual.

**Structured outputs con esquema estricto** (`output_config.format`): el modelo sólo puede devolver
la forma que definimos. Una entrada maliciosa no puede convertir la salida en prosa ni en
instrucciones. Y el texto del estudiante entra **como dato, delimitado y etiquetado como no
confiable**, nunca como instrucción.

### 4.6 🔴 El repositorio es público, y eso cambia el diseño

Verificado el 17 de septiembre de 2026: `felipeeguia03/Achieve_Platform` **responde `200` a la API
pública de GitHub**. Es público.

El plan asume que el triage crea un issue de GitHub con el reporte. **Con el repositorio público, el
texto que escribe un estudiante y sus capturas de pantalla quedan visibles para cualquiera en
internet** — y una captura puede mostrar materias, notas, fechas y a veces el nombre.

Es bastante más grave que *"viaja a GitHub, un tercero"*, que es como estaba anotado antes. **Y no
hay depuración que alcance del todo**: el campo de texto es libre y el estudiante puede escribir
cualquier cosa.

Salidas posibles, y **la elección es de `D-09`**:

| Opción | Costo |
|---|---|
| Pasar el repositorio a privado | Gratis, pero es una decisión sobre el proyecto entero |
| Los issues van a un repositorio privado aparte; el agente trabaja contra éste | El agente necesita acceso a los dos |
| No crear issues en GitHub: el reporte vive en la base y sólo el PR sale afuera | Se pierde el hilo público, pero es lo más conservador |

⚠️ **Mientras esto no se decida, la etapa 2 no crea issues.** Es el único punto del plan donde una
decisión pendiente bloquea trabajo que ya estaba listo para empezar.

---

## 5. Deduplicación

**El requisito:** treinta estudiantes reportando lo mismo son **un** issue, no treinta PRs.

### La garantía es estructural, no del modelo

1. **Un reporte no es un issue.** N reportes apuntan a un `product_report_issue`. El reporte número
   30 no crea nada: suma. Y eso no es sólo ahorro — 30 reportes en un issue dicen que es urgente, y
   30 navegadores distintos acotan la causa.
2. **El agente trabaja sobre issues, nunca sobre reportes.** Un issue tiene **un solo PR abierto a la
   vez**, por estado.

**Aunque el modelo se equivoque, lo peor que pasa es un issue de más, que el owner ve en la compuerta
y descarta.** Nunca se convierte en dos PRs. Eso es lo que hace que el requisito se cumpla.

### Cómo se agrupa, en dos capas

**Capa 1 — mecánica, sin modelo.** La firma del problema: ruta + request que falló (método, endpoint,
código) + error de consola normalizado + build. Misma firma = mismo problema, sin importar cómo lo
escribió cada uno. *"No me carga nada"* y *"la pantalla de materias queda en blanco"* caen juntos
solos. Gratis, instantáneo y no se equivoca.

⚠️ **Cubre menos de lo que parece:** sólo alcanza a lo que tira un error. Una queja de UX no tiene
firma.

**Capa 2 — con modelo, para el resto.** Compara contra los issues **abiertos** —conjunto chico— y
**no compara texto crudo contra texto crudo**: compara el enunciado normalizado que el propio triage
escribió (*"en tal pantalla, al hacer tal cosa, pasa tal otra"*). Enunciado contra enunciado es mucho
más confiable que queja contra queja.

⚠️ **Sólo contra issues abiertos y de un build compatible.** Un bug que se arregló hace tres semanas
y reaparece es un issue nuevo, no el viejo resucitado.

⚠️ **Escala hasta donde el conjunto de issues abiertos entre en un prompt.** A decenas, bien. Si
algún día son cientos, la capa 2 hay que repensarla.

---

## 6. Lista negra y lista blanca

Se verifica **mecánicamente sobre `git diff --name-only`** antes de que el agente commitee. No es un
prompt pidiéndole que se porte bien.

### Negra

| Ruta | Por qué |
|---|---|
| `supabase/migrations/**` | Una migración aplicada no se edita nunca |
| `docs/**` | Los ADRs y los `*-source.md` los escribe una persona; los source no se editan jamás |
| `AGENTS.md` · `CLAUDE.md` · `README.md` | Normativos |
| `lib/domain/**` | Ahí viven los números de negocio: pesos del ADE (120/300/1000), `RANGO_POR_NIVEL`, umbrales `PLAN-v0.1`, las máquinas de estado |
| `lib/navigation/**` | Registro de 26 CTAs y las nueve superficies. Lista cerrada |
| `lib/server/servicios/**` · `lib/server/repositorios/**` · `app/api/**` | Reglas de negocio, Postgres y la frontera de auth |
| `components/ui/**` · `app/globals.css` | Registro vendorizado y tokens. Regla 6 |
| `.github/**` | Escalada de privilegios directa |
| `next.config.ts` · `eslint.config.mjs` · `vitest.config.ts` · `package.json` · `tsconfig.json` · `supabase/config.toml` · `.env*` | Configuración. `next.config.ts` además lleva `agentRules: false`, decisión firmada del CTO |
| `scripts/**` | Los verificadores de base |
| `tests/**` — **sólo `M` y `D`** | Puede **crear** tests (`A`). No puede modificar ni borrar los que existen: ahí es donde un agente afloja el guard que lo contenía |

⚠️ **La lista negra rige para el agente autónomo, no para el trabajo de implementación.** Nosotros sí
tocamos `tests/` y `scripts/` —de hecho hay que hacerlo, §8— con ADR delante.

### Blanca

- `lib/content/es-AR.ts` y `lib/content/*.ts` — **acá cae la mayoría de los arreglos reales**: textos,
  labels, mensajes de error.
- `components/shell/**`, `components/alta/**`, `components/superficies/**`.
- Archivos de test nuevos.

### ⚠️ La tensión que hay que resolver en ADR-112

La lista negra más la regla 6 dejan **`components/screens/**` afuera, y ahí es donde el estudiante ve
casi todos los bugs**. Un agente que sólo toca copy arregla poco.

**Propuesta:** ADR-112 autoriza `components/screens/**` **para una lista cerrada de cambios** —copy
vía `CopyId`, `aria-*` y foco, estado vacío o de carga faltante, guard contra `null`/`undefined`—
**con tope mecánico de diff: ≤ 3 archivos y ≤ 40 líneas**. El tope es el proxy mecánico de *"cambio
mínimo"*, que es justo donde Claude tiende a sobre-diseñar. **Nunca estructura, layout ni lógica de
dominio.**

La regla 6 dice *"salvo que el roadmap lo pida"*: el ADR y su entrada de roadmap son exactamente esa
autorización. No es una excepción inventada.

---

## 7. Reglas del repo que el agente va a violar

| Regla | Cómo la viola | Cómo se resuelve |
|---|---|---|
| §7 — los cinco gates | Da por terminado con el build verde | Los corre el CI |
| §7.6 — ADR para decisiones | Inventa una regla de negocio para "arreglar" | Prompt: *si falta una regla, devolvé `DECLINED` con la pregunta*. **Nunca escribe un ADR** |
| §7.7 — marcar el roadmap | Edita `docs/roadmap.md` | Lista negra. Lo hace el humano al mergear |
| Regla 1 — no inventar reglas de negocio | El "bug" es una decisión de producto | Se filtra en el triage + estado `DECLINED` |
| Regla 5 — capturas de diseño | `docs/diseño/` **no existe**; improvisa un diseño | Prohibición explícita de tocar layout o estructura |
| Regla 6 — no reescribir `screens` | Reescribe la pantalla entera | Lista negra + tope de diff |
| `C-07` — frases con ID | Hardcodea texto en el componente | Prompt + `auditoria-conformidad` |
| Voseo | Escribe tuteo, o *"Contanos"*, que `C-01` prohíbe | Los tests lo cazan |
| Vocabulario prohibido | Repone `Dominado`, `nivel`, *"tiempo efectivo"*, *"¿cómo te quedó?"* | Guards + lista literal en el prompt |

**`AGENTS.md` (29 KB) es literalmente el prompt del agente**: seis reglas, ocho invariantes,
convenciones de capas, vocabulario canónico y orden de precedencia ante conflictos. Va entero al
contexto de cada corrida. Es el activo más valioso que tiene este proyecto para esto.

---

## 8. El CI

**No existía.** No había `.github/`, ni git hooks, ni husky. Era el pilar que el plan original daba
por hecho.

La buena noticia: la suite ya caza casi todo lo que un agente puede romper. Sólo faltaba que alguien
la corriera sola.

| Guard | Qué impide |
|---|---|
| `tests/track-a-rules.test.ts` | `fetch` en una pantalla; `localStorage` fuera de los tres módulos con ADR |
| `tests/frontera-backend.test.ts` | Importar Supabase desde el dominio; un Service leyendo headers |
| `tests/product-events.test.ts` | Evento emitido sin declarar, y declarado sin emisor |
| `tests/copy-sin-ingles.test.ts` | `Action`, `SUBMITTED`, `owner` en texto de pantalla |
| `tests/auditoria-conformidad.test.ts` | Tuteo, usted, imperativos sin voseo |
| `tests/tema.test.ts` · `design-tokens.test.ts` | Hex suelto; token definido en un solo bloque de tema |
| `tests/shell.test.tsx` | Rutas (17) y superficies (9) cambiadas sin ADR |
| `tests/state-machines.test.ts` · `invariantes.test.ts` | Transiciones prohibidas; los 12 invariantes |

⚠️ **`npm run typecheck` es un gate propio.** Medido el 2 de septiembre: el build estuvo en verde con
**6 errores de tipos** adentro. `vitest` borra los tipos con esbuild y el build de Next no alcanza los
archivos de test.

### El defecto que destapó correr `db:verify`

El 17 de septiembre, corriéndolo por primera vez desde el 14, **fallaban 2 de 552 comprobaciones**,
en `insumos_de_reparto()`.

**Causa, probada contra Postgres:** la migración `20261105000000_disponibilidad_solo_del_plan.sql`
—que había entrado ese mismo día a las 11:28, en `74a4ec0`— agregó
`CHECK (source <> 'declared' OR (start_time IS NOT NULL AND end_time IS NOT NULL))`, y
`scripts/db-aislamiento.sh` declaraba disponibilidad con el payload viejo, sin horas. Medido: con el
payload viejo escribe **0 filas** y devuelve `NULL`; con horas escribe y da 300.

**El producto estaba bien. La comprobación había quedado vieja.** Y nadie lo vio porque `db:verify`
no se corría desde el 14 — CLAUDE.md lo advertía textualmente: *"el número deja de estar verificado
contra Postgres a partir de acá"*.

Es el argumento a favor del segundo workflow: un job de base que corra cuando cambian `supabase/**`
o `scripts/**` lo habría cazado en el mismo PR.

### Un detalle de `db.yml` que no es obvio

`db:verify` corre `npm run db:catalogo`, y `scripts/importar-catalogo.mjs` **lee `.env.local` del
disco y corta con `exit 1` si no existe**: no mira las variables del proceso. Pasarle las claves por
`env:` no alcanza — la primera versión del workflow lo hacía así y habría fallado siempre.

El workflow arma `.env.local` con lo que imprime `supabase status`, que es exactamente lo que el
README le pide a quien levanta el proyecto. Las claves salen del stack recién levantado, no del
archivo del workflow.

---

## 9. Modelos y costos

Precios verificados el 17 de septiembre de 2026 (in/out por millón de tokens). Lectura de caché ≈
0,1× la entrada.

| Etapa | Modelo | Por qué |
|---|---|---|
| Chat del widget | **`claude-sonnet-5`** · US$2/US$10 | Es lo único que el estudiante espera en vivo. Opus agrega segundos por turno y no extrae mejor los pasos de reproducción. **La única parte donde Opus es peor** |
| Triage y deduplicación | **`claude-opus-5`**, effort `high` · US$5/US$25 | Decide si dos reportes son el mismo problema |
| Agente que escribe código | **`claude-opus-5`**, effort `xhigh` | `high` es el default; para código y trabajo agéntico `xhigh` rinde mejor |

| Etapa | Costo por uso |
|---|---|
| Chat de captura (5–8 turnos) | ~US$0,03 |
| Triage | ~US$0,01 |
| Agente escribiendo el PR | **~US$4–6** (repo de 820 archivos) |

**Los tokens no son el problema. El costo real de este proyecto es tiempo de desarrollo.** No hay que
diseñar el plan alrededor de ahorrar tokens. Palancas de control igual: `--max-turns`, timeout de
workflow, `concurrency` y topes diarios duros.

---

## 10. Plan de ejecución

| Rama | Contenido |
|---|---|
| `chore/ci` | El arreglo de `db-aislamiento.sh`, este documento, los workflows y los números de `CLAUDE.md` y `README.md` |
| `feat/reportes` | Las cuatro etapas, **un commit por etapa** |

**Una rama para las cuatro etapas, no cuatro.** La unidad de cierre es el commit: cada uno entra con
los cinco gates en verde y no se empieza el siguiente hasta que el anterior cierra. La regla del
roadmap dice *"un commit **o** PR por etapa"*.

| Fase | Qué se construye | Estado de bloqueo |
|---|---|---|
| **0a** | Este documento + **ADR-112** (§12) | Listo para escribir |
| **0b** | El arreglo de `db:verify` + los workflows de CI | Listo |
| **1** | **Captura.** Borrar el guion, cablear a `/api/reporte`, contexto del navegador, tablas + migración + `limpiar_mundo`, bucket, evento. **Sigue detrás de `MODO_PRUEBA=1`** | Listo |
| **2** | **Triage.** Clasificar, deduplicar, crear el issue con token de bot | Listo |
| **3** | **Compuerta humana.** Aprobación desde el celular, dos botones | Listo |
| **4** | **Agente.** Lista blanca, `--max-turns`, timeout, tope diario, rama `feedback/{id}-{slug}`, PR que linkea al reporte | 🔴 Requiere CI verificado sobre el PR del agente vía GitHub App, `main` protegida y **admin de `felipeeguia03`** |
| **—** | Sacar el widget de `MODO_PRUEBA` y mostrárselo a estudiantes reales | ⛔ **[ADR-006](decisions.md#adr-006)**. Texto libre y capturas de un estudiante viajando a GitHub y a un modelo es un flujo de datos personales nuevo. Va a `legal-package.md` |

### 🔴 El punto de medición, que es una compuerta y no una nota al pie

**Después de la fase 1 se para y se mide cuántos reportes son realmente accionables.** Si es el 10%,
la fase 4 no vale la pena y se ahorró el 80% del trabajo.

⚠️ **Y acá hay un problema honesto que hay que mirar de frente: no hay población para medir.**
ADR-006 impide usuarios reales, y detrás de `MODO_PRUEBA=1` los únicos que ven el widget son el owner
y el equipo. **Barra mínima antes de la fase 4: 20 reportes con pasos de reproducción reales.** Si no
se llega a 20, la fase 4 es especulación y **se para**. Es exactamente para eso que existe la
compuerta.

**Cada etapa deja un sistema coherente.** Si se corta después de la 1, ya se ganó algo: reportes
estructurados de verdad en lugar de un buzón falso. Si se corta después de la 2, se dejaron de leer
reportes basura. Ninguna etapa deja la anterior a medias.

---

## 11. Qué está verificado y qué no

**Esto importa: no todo lo de arriba tiene el mismo respaldo.**

### ✅ Verificado contra este repositorio el 17 y el 18 de septiembre de 2026

- Los cinco gates: `lint` ✅ · `typecheck` ✅ · `build` ✅ · `test` ✅ **3675 tests en 129 archivos** ·
  `db:verify` ✅ **552, cero fallos** — antes del arreglo fallaban 2 de 552 (§8).
- No había `.github/`, ni git hooks, ni husky.
- RLS habilitada en 26 migraciones, **cero `CREATE POLICY`** en todo el repo.
- El widget existe, se monta en los dos layouts detrás de `MODO_PRUEBA`, y su test afirma que no
  habla por red.
- El spec **no dice nada** sobre reportar bugs: no hay regla de negocio previa que violar.
- `ADR-112` libre · `product_report` libre.
- **El repositorio es público** (§4.6).
- **El CI, simulado en local como lo corre GitHub** (18/09): `npm ci` sobre el lock, los cuatro gates
  **sin ninguna variable de entorno** —pasan todos—, y el paso de `db.yml` que arma `.env.local`
  seguido de `db:verify`: 552, cero fallos.
- Las versiones de las actions, contra sus releases: `actions/checkout@v7` y `actions/setup-node@v7`
  (corren en Node 24), `supabase/setup-cli@v3`, y el CLI fijado en `2.108.0`, el verificado en local.
- `npm audit`: **2 vulnerabilidades moderadas** en `@vitest/mocker`, dependencia de desarrollo.
  CLAUDE.md dice 0 porque el aviso es posterior. **No se tocan acá**: ADR-008 dice que la versión la
  elige un ADR, no un `npm audit fix --force`.
- La app levanta en `localhost:3000` con Supabase local en 54421-54424, sin pisar Parkit (54321-54325)
  ni el otro Achieve (54521-54527).

### ⚠️ NO verificado — hay que chequearlo antes de usarlo

- **Los detalles de `anthropics/claude-code-action`** (automation mode, input `prompt:`, `claude_args`,
  `allowed_bots`). Vienen de investigación de otra sesión, **no los verifiqué contra la documentación
  oficial**. Se chequean al empezar la etapa 4.
- **La primera corrida de los workflows en GitHub.** Se simularon en local, pero el runner real es
  otra máquina: el resultado queda en el PR de `chore/ci`.
- Los precios de los modelos: verificados el 17/09/2026. Volver a chequear si pasó tiempo.

### 📉 Números que estaban desactualizados

`README.md` decía 2590 tests en 121 archivos y 545 comprobaciones; `CLAUDE.md` decía 3652 tests, 545
comprobaciones y 98 migraciones. **Son 3675 tests en 129 archivos, 552 comprobaciones y 99
migraciones.** Se corrigieron en `chore/ci`.

---

## 12. Lo que decide ADR-112

Ninguna de estas está tomada. **Las cierra una persona** (regla 1 de `CLAUDE.md`, §1.1 de `AGENTS.md`).

| # | Decisión |
|---|---|
| D-01 | **Qué se guarda de un reporte** y qué se depura antes de que salga del backend hacia GitHub o hacia el modelo |
| D-02 | **Retención**: cuánto viven los reportes y las capturas. Engancha con la revisión legal de `AGENTS.md` §9 |
| D-03 | **Topes diarios**: cuántas corridas del agente y cuántos PRs por día. Son números de negocio |
| D-04 | **Quién aprueba** en la compuerta, y qué pasa si no aprueba nadie |
| D-05 | **La lista negra definitiva** (§6) y si se autoriza `components/screens/**` con tope de diff |
| D-06 | **El texto del modelo en pantalla** (§4.4): límites y qué se hace si la validación falla |
| D-07 | **Qué pasa cuando ADR-006 abra**: consentimiento, y si el widget sale de `MODO_PRUEBA` |
| D-08 | **Los nombres de los eventos nuevos** y su nivel en `product-events.ts` |
| D-09 | 🔴 **Dónde viven los issues, dado que el repositorio es público** (§4.6). Bloquea la etapa 2 |

---

## 13. Fuentes

- **Rondo Club — agente autónomo de feedback**: https://joost.blog/autonomous-feedback-agent/
- **BugPilot** — widget con triage IA y auto-fix: https://github.com/rodlunt/bugpilot
- **Claude Code GitHub Actions**: https://code.claude.com/docs/en/github-actions
- **Seguridad de la action**: https://github.com/anthropics/claude-code-action/blob/main/docs/security.md
- Prompt injection en agentes de código:
  https://labs.cloudsecurityalliance.org/research/csa-research-note-claude-code-github-action-prompt-injection/ ·
  https://www.aikido.dev/blog/promptpwnd-github-actions-ai-agents
- **Sentry Seer Autofix**, la misma idea disparada por telemetría: https://sentry.io/product/seer/autofix/

Un complemento que vale la pena mirar: **los crashes no necesitan que nadie los reporte.** Widget
para la confusión y los pedidos; telemetría para lo que se rompe.
