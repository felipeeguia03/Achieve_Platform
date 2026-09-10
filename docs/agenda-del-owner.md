# Todo lo que espera una decisión · al 10 de septiembre de 2026

**Documento:** `docs/agenda-del-owner.md`
**Qué es:** el mapa completo de lo que está trabado esperando que **alguien decida**, separado por
quién. No es una lista de trabajo pendiente: acá sólo entra lo que **no se puede construir sin que
una persona conteste**.
**Qué no es:** la fuente. Cada fila apunta a su ADR o a su documento, que es donde está el detalle.

> ⚠️ **[`decisiones-abiertas.md`](decisiones-abiertas.md) tiene filas desactualizadas.** La **18**
> —el área «Materias», opciones `A` y `C`— figura abierta y la cerró
> [ADR-077](decisions.md#adr-077) el 8 de septiembre. Este documento la da por cerrada.

---

## 0. Todo, en una tabla

| | Decisión | Quién | Qué destraba | Urgencia |
|---|---|---|---|---|
| **1** | `action.verb` y `action.scope` de una pieza de Formación | **Owner** | La escritura de `CTA-021`. Sin esto la biblioteca se lee y no se aplica | 🟠 |
| **2** | Qué se hace con [ADR-006](decisions.md#adr-006) ahora que hay datos reales cargados | **Owner** | La coherencia del repositorio consigo mismo | 🔴 |
| **3** | La copy `Contanos` de la reflexión obligatoria | **Owner** | Un guard que hoy contradice al fixture aprobado | 🟡 |
| **4** | ¿Un cambio de comisión es un hecho del dominio con evento propio? | **Owner** | Que mover una cursada deje rastro | 🟡 |
| **5** | ¿El semestre entra en la clave de `enrollment`? | **Owner** | Cómo se identifica una inscripción | 🟡 |
| **6** | El corte 4 de [`cursado-de-materia.md`](cursado-de-materia.md): documentos por cursada | **Owner** | Nada urgente; está sin autorizar | 🟢 |
| **7** | Merge a la rama principal y despliegue | **Owner + CTO** | Que esto salga de la máquina | 🟢 |
| **8** | **Ocho cosas de la psicopedagoga** — ver §2 | Psicopedagoga | Formación, el corte 2, el protocolo y el ranking del ADE | 🟠 |
| **9** | El dictamen legal de [ADR-006](decisions.md#adr-006) | Asesoría jurídica | Toda la Fase B7, y B7 destraba B8 | 🔴 |
| **10** | `C01-042` · el golden dataset y su autorización | Product Data + institución | La Etapa B2b.3 y el piloto | 🟠 |
| **11** | El §2 del contrato congelado, y el `applied` del `202` | CTO, con el CRM | Que la firma HMAC no esté especificada de dos formas | 🟡 |

---

## 1. Lo que decidís vos

### 1.1 · `action.verb` y `action.scope` de una pieza de Formación 🟠

**La pregunta.** Cuando el estudiante empieza a aplicar una pieza, se crea una `Action`. `objective`
y `expected_evidence` salen del texto de la psicopedagoga —*"definir una microacción y comenzarla
inmediatamente"*, *"foto del primer paso"*—. Pero `verb` y `scope` son `NOT NULL` y **ella no los
declara**.

**Por qué no lo resuelvo yo.** Son palabras que terminan en la pantalla del estudiante, en `UX03`.
Partir su frase en verbo y alcance es una interpretación mía de su texto.

| | opción | costo |
|---|---|---|
| **A** | Un verbo fijo para toda Formación —*aplicar*— y el título de la pieza como alcance | Es vocabulario nuevo, y lo estrena el sistema, no ella |
| **B** | Que ella los declare, una vez por pieza | Lo más fiel. Son cinco filas y bloquea hasta que conteste |
| **C** | Derivarlos de su frase partiéndola | **No lo recomiendo**: la interpretación queda escondida en un parser |

**Mientras tanto no se nota**, porque con todo en `DRAFT` la biblioteca está vacía.

### 1.2 · Qué se hace con ADR-006 🔴

**La situación, dicha de frente.** El 9 de septiembre autorizaste cargar los temarios reales de la
UCC, y están cargados: 25 programas oficiales, 51 materias, el Plan 2016 publicado. **Y
[ADR-006](decisions.md#adr-006) sigue diciendo `PROVISIONAL — LEGAL CONFIRMATION REQUIRED`**, y la
regla 3 de [`CLAUDE.md`](../CLAUDE.md) sigue diciendo *"bloqueo absoluto… sin excepciones"*.

**El repositorio se contradice consigo mismo.** No es un problema técnico: es que quien lea las
reglas mañana no va a saber cuál rige.

| | opción | costo |
|---|---|---|
| **A** | Enmendar ADR-006 y la regla 3 para que digan lo que realmente rige | Honesto. Hay que escribir qué queda permitido y qué no |
| **B** | Revertir la carga real y volver a sintético | Recuperás la coherencia y perdés el MVP con datos reales |
| **C** | Dejarlo así | **No lo recomiendo.** Una regla que se incumple y sigue escrita deja de proteger |

⚠️ **Ninguna de las tres reemplaza el dictamen legal**, que sigue siendo de otra persona (§2.9).

### 1.3 · La copy `Contanos` 🟡

El fixture aprobado dice *"Contanos cómo te fue (requerido)"* y el guard `C-01` prohíbe `Contanos`.
Hoy se usa *"Agregar reflexión (requerido)"*, que funciona y deja el fixture desalineado.

**Sacar `Contanos` de la lista del guard** es lo recomendado en
[`decisiones-abiertas.md`](decisiones-abiertas.md): el guard queda diciendo la verdad y la pantalla
usa el texto que aprobaste.

### 1.4 · ¿Un cambio de comisión es un hecho del dominio? 🟡

Hoy sería un `UPDATE` mudo. `product_event` es append-only y tiene guard en las dos direcciones: si
querés que mover una cursada de comisión deje rastro, hay que declarar el evento.

### 1.5 · ¿El semestre entra en la clave de `enrollment`? 🟡

Hoy `UNIQUE (student_id, program_id, term)` hace que **un año nuevo sea una inscripción nueva**. Con
año y semestre en columnas propias desde [ADR-061](decisions.md#adr-061), hay que decidir si la clave
cambia.

### 1.6 · El corte 4 de `cursado-de-materia.md` 🟢

Documentos por cursada. Está **sin autorizar y sin construir**, y el ADR de la captura ya dejó dicho
que es *"sólo guardar archivos, no la ingesta"*.

### 1.7 · Merge y despliegue 🟢

La [Enmienda 1 de ADR-008](decisions.md#adr-008-enmienda-1) autoriza **el push de
`feat/fase-0-track-a`, y nada más**. Merge a la rama principal y despliegue necesitan decisión
propia — y el despliegue además sigue bloqueado por ADR-006.

---

## 2. Lo que espera a la psicopedagoga

**Son ocho, y conviene mandárselas juntas.** Cuatro bloquean cosas ya construidas.

| | Qué | Bloquea |
|---|---|---|
| **2.1** | **La vigencia de los cinco contenidos de Formación** | Que la biblioteca deje de estar vacía. Están cargados en `DRAFT` |
| **2.2** | **Los guiones de los cinco videos** — los declara faltantes ella misma | Que las piezas tengan video. Hoy se omite, no se finge |
| **2.3** | **El vocabulario del checklist de Confianza** — *sin marcar · lo leí · lo practiqué · puedo explicarlo* | El **corte 2** de `cursado-de-materia.md`. `Dominado` viola [ADR-072](decisions.md#adr-072) y `nivel` viola [ADR-075](decisions.md#adr-075) §C1 |
| **2.4** | **Las dos confirmaciones del protocolo de examen** | Que los veinte pasos dejen de decir *"vigencia sin confirmar"* |
| **2.5** | **La dirección del peso en el ranking del ADE** | Hoy: más peso, más prioridad. La contraria —arrancar por las cortas— es criterio suyo |
| **2.6** | **La microintervención contextual de primer año** | La otra mitad del §13 del spec. Define obligatoriedad sobre personas |
| **2.7** | **Cómo se define una tarea comparable** | El denominador del contador de reiteración |
| **2.8** | **El resto del índice** — diecisiete áreas, cinco piezas escritas | Que Formación tenga más de cinco contenidos |

---

## 3. Lo que espera a otros

**2.9 · El dictamen legal de ADR-006** — asesoría jurídica. Bloqueo absoluto de la Fase B7, y B7
destraba B8. El material está en [`legal-package.md`](legal-package.md).

**2.10 · `C01-042` · el golden dataset** — Product Data y la institución. Destraba la Etapa B2b.3 y
el piloto.

**2.11 · El contrato del CRM** — el CTO, con el CRM: corregir el §2 (la firma es
`${timestamp}.${rawBody}`, con punto) y decidir si el `202` de vinculación lleva `applied`. Detalle
en [`agenda-decisiones-po-crm.md`](agenda-decisiones-po-crm.md).

**2.12 · `C01-030` · quién valida y quién corrobora** — `DEFERRED` con motivo
([ADR-057](decisions.md#adr-057)), se retoma con ADR-006. Mientras tanto el botón `validar` del dock
deja al estudiante validando su propia evidencia, y **se borra cuando ADR-006 abra**.

---

## 4. Lo que no es una decisión de producto, y bloquea igual

⚠️ **Hay 82 archivos sin commitear, y el último commit es `04fcce5` (ADR-084).**

Están afuera del historial: **ADR-085** (el Gantt por tema), **ADR-086** (las 51 materias con
contenido), **ADR-087** (Formación) y **ADR-088** (el espacio de trabajo) — este último **escrito por
otra sesión**, no por la que armó este documento.

**Dos sesiones escribiendo sobre el mismo árbol sin commitear es la forma más barata de perder
trabajo.** No es una decisión de producto, pero conviene resolverlo antes de seguir.

---

## 5. Lo que ya está cerrado, y no conviene reabrir

Para que no vuelvas sobre terreno decidido: el área «Materias» y su Gantt
([ADR-077](decisions.md#adr-077), [ADR-078](decisions.md#adr-078)), el layout de `UX02`
([ADR-085](decisions.md#adr-085)), el conflicto de horario ([ADR-084](decisions.md#adr-084)), el
bloque horario ([ADR-083](decisions.md#adr-083)), la Bitácora por materia
([ADR-082](decisions.md#adr-082)), los umbrales de readiness ([ADR-058](decisions.md#adr-058)) y las
tres decisiones de los flujos del CRM ([ADR-041](decisions.md#adr-041) …
[ADR-043](decisions.md#adr-043)).
