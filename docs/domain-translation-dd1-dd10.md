# Achieve — Traducción al dominio (DD1–DD10)

**Documento:** `docs/domain-translation-dd1-dd10.md`
**Rol:** owner canónico de las respuestas de traducción al dominio que exige el manual de diseño.
**Resuelve:** [ADR-010](decisions.md#adr-010)
**Última actualización:** 28 de agosto de 2026

**Origen:** estas diez respuestas se decidieron en conversación directa entre el owner del producto
y un asistente de IA, el 28 de agosto de 2026, durante el diseño del sistema visual — **antes** de
que existiera este repositorio. No estaban escritas en ningún archivo; por eso `ADR-010` las
registró como vacío. Este documento cierra ese vacío.

**Nomenclatura:** `DD1`–`DD10` en vez de `D1`–`D10`, por la colisión con las decisiones de producto
`D1`–`D25` del spec ([ADR-009](decisions.md#adr-009)).

> **Por qué este documento importa.** El manual de diseño es normativo y su primera regla `DEBE` es
> completar esta fase antes de aplicar cualquier otro principio: *"Si sos una IA y no tenés estas
> respuestas, pedilas."* … *"Prohibido inventar contenido de dominio."* Sin este archivo, la
> auditoría de conformidad falla en su Bloque 1.

---

## DD1 — ¿Cuál es la acción irreversible?

**Respuesta:** Ninguna, adentro de la app, a propósito. El único momento sin vuelta atrás — rendir
el examen real — pasa **afuera** de Achieve. Todo lo que la app controla está deliberadamente
diseñado para ser corregible: Evidence se puede reenviar, Commitment se puede renegociar, un `MISSED`
tiene camino de rescate.

**Cómo se llegó a esta respuesta:** el registro `C01` define `C01-P0` literalmente como *"ausencia de
toda vía reversible"* y registra **cero** filas en esa severidad sobre los 51 contratos — es decir,
el propio spec ya fue diseñado para que nada dentro de la app sea un callejón sin salida.

**Consecuencia para `P-11`:** Achieve **no necesita** un patrón de confirmación fuerte
(deshacer / consecuencia enunciada) en ningún flujo actual del Track A. Si en el futuro aparece una
acción real dentro de la app que sí sea irreversible (por ejemplo, algo del Track B con datos reales
o pagos), esta respuesta debe revisarse — no asumir que sigue valiendo para siempre.

---

## DD2 — ¿Cuál es el reloj?

**Respuesta:** Doble reloj, no uno solo:

1. **Días hasta el examen** — la fecha del `Assessment` activo (ej. *"PARCIAL 1 · 6 DÍAS"*).
2. **Hora del Commitment acordado** — cuándo el estudiante dijo que iba a hacer la acción.

**Consecuencia para `P-05`:** el orden por defecto de cualquier lista prioriza primero por el
Commitment más próximo a vencer, y en segundo lugar por proximidad del examen — nunca al revés, y
nunca mezclando ambos en un solo número.

---

## DD3 — ¿Hay una fuente externa autoritativa?

**Respuesta:** Sí. La cátedra/institución es la fuente autoritativa del ritmo real de la materia
(`ClassSession`, `class_event_record`), y lo que el estudiante reporta o construye puede discrepar de
eso.

**Consecuencia para `P-08`:** activo y ya implementado — es el patrón "Cátedra y vos" en
`UX02 Materia/Cursado`, con las dos fuentes visibles en columnas separadas, cada una con su
`provenance` (`reportado por vos · sin corroborar` vs. `oficial`).

---

## DD4 — ¿Cuáles son los 10 términos del oficio?

**Respuesta:** Candidatos propuestos, **no confirmados formalmente** — el vocabulario académico
argentino que ya aparece en el spec y que la UI debe usar tal cual, sin traducir a lenguaje llano:

`parcial` · `final` · `TP` (trabajo práctico) · `cursada` · `cátedra` · `comisión` ·
`Modo Examen` · `Bitácora` · `Compromiso` · `Evidencia`

**Estado:** ⚠️ `DEFERRED`. A diferencia de las otras nueve, esta no se cerró con una confirmación
explícita del owner del producto. Vale la pena revisarla una vez antes de dar por completo el
glosario de [`product.md`](product.md) §3.

**No bloquea ninguna etapa de la Fase 0.**

---

## DD5 — ¿Qué magnitudes de máquina se muestran?

**Respuesta:** Ninguna. El spec prohíbe explícitamente exponer scores de riesgo numéricos,
porcentaje de materia aprendida, readiness numérica y probabilidad de aprobación.

**Consecuencia para `P-03`:** el principio se cumple por la vía más fuerte — no mostrando la
magnitud en absoluto, en vez de anclarla a una escala humana. Donde el spec sí permite una cifra
(ej. *"Práctica: 12 → 19 ejercicios"*), es un hecho contable con unidad natural, exento de anclaje.

---

## DD6 — ¿Cuáles son los 3–4 eventos que merecen color?

**Respuesta:** Exactamente **3**, elegidos explícitamente por el owner del producto sobre 4
candidatos:

| Elegido | Color | Token |
|---|---|---|
| Éxito — evidencia validada, compromiso completado | Verde | `--exito-fill` / `--exito-texto` |
| Urgencia — examen cercano, compromiso por vencer, rescate | Rosa/magenta | `--urgencia-fill` / `--urgencia-texto` |
| Intervención humana abierta | Azul | `--humano` |

**No elegido:** riesgo/necesita recuperación — queda comunicado solo por texto, sin color propio.

**Nota de paleta:** el hue original decidido fue naranja (`#ff9500`); se corrigió a rosa/magenta
(`#f472b6` / `#9c3d68`) para compartir familia de color con Dashboard_Achieve, el otro producto del
mismo dueño — decisión tomada el mismo día, después de comparar capturas reales de ese producto.
Ambos cambios están reflejados en `app/globals.css` y en [`design-system.md`](design-system.md) §2.3.

> **Resabio a limpiar.** `--chart-2` en `app/globals.css` sigue siendo `#ff9500`, el naranja
> original. Los charts declaran heredar de los tres semánticos más ink, así que ese valor quedó
> huérfano de la corrección. No afecta a ninguna pantalla actual (no hay charts en el Track A), pero
> conviene reconciliarlo en la Etapa 0.1 para que la paleta no tenga dos verdades.

---

## DD7 — ¿Cuál es la decisión repetitiva?

**Respuesta:** *"¿Me comprometo con esta acción?"* — la decisión que el estudiante toma varias veces
por semana, una vez por cada Action que se le presenta.

**Consecuencia para `P-10`:** el owner del producto pidió explícitamente aplicar el patrón de cola
numerada (`P-10`, "1 de N") **también en Hoy**, no solo en una futura cola de Operador. Esto generó
una tensión real con la regla de cambio controlado del spec (Parte II §22.3, *"no se agrega
navegación para acomodar ideas que todavía no tienen función"*), resuelta así:

> El Hero de Hoy **no cambia** — lo sigue eligiendo la tabla de precedencia de 9 niveles tal cual
> está. El patrón de cola se aplica únicamente a la lista de materias debajo del fold: cuando hay
> más de una materia con algo pendiente el mismo día, esa lista deja de ser plana y se convierte en
> paginable (`1 de N`, con flechas). No se agrega pantalla ni CTA nuevo.

Ya implementado en `components/screens/hoy-autogestion.tsx`, componente `MateriasQueue`.

---

## DD8 — ¿Qué default tomaría el mejor profesional?

**Respuesta:** Ya resueltos en el spec, Parte II §21 ("DECIDIDO"). Los dos ejemplos concretos:

- Mostrar siempre el **último ritmo de cátedra confirmado**; nunca inventar "una unidad por clase"
  cuando no hay confirmación.
- El progreso se muestra con las **5 dimensiones separadas**, nunca fusionadas en un solo número.

**Nota:** varios defaults del dominio pedagógico específico (protocolo de examen, criterios de
corrección) **no** entran acá — son las 8 `HUMAN-P0`, que se resolvieron como corresponde: **con
confirmación profesional real**, no con "mejor criterio" inferido. Respondidas el 31 de agosto de
2026; ver [ADR-025](decisions.md#adr-025) y la fuente en
[`human-p0-source.md`](human-p0-source.md). **Sus residuos siguen abiertos y se preguntan igual.**

---

## DD9 — ¿Cuál es la unidad de trabajo?

**Respuesta:** Para el estudiante, **una `Action` a la vez** — el Hero de Hoy. El estudiante nunca ve
ni gestiona una lista de acciones pendientes simultáneas; siempre hay una sola cosa "actual".

**Nota:** para el rol Operador (todavía no construido), la unidad de trabajo sería distinta —
probablemente un caso en cola — pero eso queda pendiente de [ADR-003](decisions.md#adr-003) y
[ADR-012](decisions.md#adr-012).

---

## DD10 — ¿Qué tiene que saber de memoria el usuario hoy?

**Respuesta:** Por qué esa acción va primero.

**Consecuencia:** ya resuelto e implementado, sin que en su momento se supiera que era la respuesta a
esta pregunta — es la línea `Porque:` (`ReglaDeNegocio`) que aparece en el Hero de cada pantalla del
loop diario. Es `P-01` aplicado de forma consistente desde el principio.

---

## Resumen — qué queda abierto todavía

De las diez, **`DD4` es la única sin confirmación explícita del owner del producto.** Las otras nueve
tienen una decisión tomada y su razón registrada arriba.

| ID | Estado |
|---|---|
| `DD1`, `DD2`, `DD3`, `DD5`, `DD6`, `DD7`, `DD8`, `DD9`, `DD10` | ✅ Resueltas |
| `DD4` (vocabulario del oficio) | ⚠️ `DEFERRED` — propuesta, no confirmada formalmente |

Con esto, [ADR-010](decisions.md#adr-010) queda `ACCEPTED` salvo por `DD4`, que queda `DEFERRED`
hasta que se revise el glosario completo — **no bloquea ninguna etapa de la Fase 0.**

---

## Trabajo que estas respuestas habilitan

| Respuesta | Habilita |
|---|---|
| `DD1` | Cerrar `P-11` en la auditoría de conformidad: no hace falta patrón de deshacer |
| `DD2` | Definir el orden por defecto de las listas (`P-05`) en la Etapa 0.2 |
| `DD6` | Reconciliar `--chart-2` en la Etapa 0.1 |
| `DD7` | `MateriasQueue` ya cumple `P-10`; queda verificarlo en la auditoría |
| `DD9` | Confirma el layout base de una Action por vez — ya implementado |
