# Cursado de materia — el diseño de la pantalla

> **Estado:** documento de diseño · 9 de septiembre de 2026
> **Origen:** dos capturas del owner y cuatro decisiones tomadas sobre ellas.
> **Fuente de verdad:** `VI.2` del [spec](product-spec-source.md), líneas 3836 en adelante.
>
> ⛔ **Ninguna implementación estaba autorizada por este documento.** Era el paso previo, como
> [`gantt-de-preparacion.md`](gantt-de-preparacion.md) lo fue para la Fase B6.15.
>
> ✅ **El 9 de septiembre de 2026 el owner autorizó el corte 1** —*"empezá por el 1"*— y después
> **la parte C del corte 3**, eligiendo el alcance *entidad + ingesta + pantalla*. Están construidos:
> [ADR-082](decisions.md#adr-082) (Fase B6.20) y [ADR-083](decisions.md#adr-083) (Fase B6.21).
>
> ⛔ **Siguen sin autorizar el corte 2 y el 4**, y el 2 sigue además bloqueado por la revisión de
> vocabulario. **La parte D del 3 no se construyó**: ver §8.

---

## 1 · Qué contesta esta pantalla

`VI.2` §1 la define como **el espacio persistente por materia**, con un orden funcional literal:

> *estado de materia → acción actual → cátedra vs. alumno → próximo → unidades/temas →
> actividad reciente → trabajo acumulado/Bitácora*

Y una decisión de arquitectura que explica ese orden:

> *"La pantalla conduce primero y explica después. La acción ocupa el primer viewport. La
> comparación de ritmo y el historial aportan contexto, pero no obligan al alumno a analizar un
> tablero para descubrir qué hacer."*

⚠️ **La captura del owner invierte eso**: el Gantt ocupa el primer viewport y la acción sugerida
queda al pie. **Es una decisión de diseño que hay que tomar a conciencia**, no un detalle de orden:
el spec eligió conducir primero justamente para que la pantalla no obligue a leer un tablero.

---

## 2 · El hallazgo: el checklist ya existe en el modelo

**Las cinco dimensiones no son cinco cosas del mismo tipo.** `VI.2` §8.6 las tabula:

| Dimensión | Pregunta | Cómo se produce |
|---|---|---|
| Recorrido | ¿Tuvo contacto relevante? | **Derivada** |
| Práctica | ¿Produjo trabajo? | **Derivada** |
| Dominio | ¿Puede aplicar sin apoyo completo? | **Requiere evaluación** |
| **Confianza** | **¿Cuánto cree dominarlo?** | **Valor autorreportado con fecha** |
| Recencia | ¿Cuándo fue el último trabajo útil? | **Derivada** |

Y el modelo lo dice igual de claro — [`data-model.md`](data-model.md) línea 254:

```ts
confidence: DimensionValue;   // Confianza (autorreporte, con fecha)
```

> 🟢 **El checklist de la captura ES la dimensión Confianza.** No es una escala nueva: es **el
> escritor que le falta**. Las columnas existen desde la Fase B1 —`confidence_value`,
> `confidence_state`, `confidence_declared_at`— y **la única función que las escribe es
> `registrar_progreso`**, que corre en la validación. El estudiante nunca declara nada.

⚠️ **Y por eso `UX02` muestra cuatro dimensiones y no cinco.** La Confianza se omite porque nunca se
declaró — *omitir, no inventar*. La captura del owner llena exactamente ese hueco.

---

## 3 · El problema del vocabulario, y cómo lo resuelve el spec

La captura rotula los niveles **`Leído 1 · Practicado 2 · Dominado 3`**, con la leyenda *"el relleno
de cada barra es **el nivel** del tema"*. Dos de esas palabras están prohibidas:

**⛔ `Dominado`.** Es la primera prohibición de [ADR-072](decisions.md#adr-072) —*el dominio requiere
evaluación*— y el corte que sostiene toda la cadena `preparar ≠ enviar ≠ suficiencia ≠ validación ≠
dominio`. Un estudiante marcándose «dominado» **no evalúa nada**: declara.

**⛔ `nivel`.** [ADR-075](decisions.md#adr-075) §C1, la psicopedagoga, textual: *"si se conserva una
barra, su rótulo visible debe ser `actividad registrada`, no `dominio`, `nivel`, `rendimiento` ni
`avance de aprendizaje`"*.

### Lo que el spec sí autoriza

`VI.2` §8.6 muestra en su wireframe de detalle:

```
| Confianza  · alta · registrada ayer  |
```

Y cierra con la línea que destraba todo:

> *"El wireframe no define escalas, umbrales ni una normalización común."*

**Ahí está la diferencia que importa.** Hoy `proyeccion-materia.ts` se niega a mostrar el nivel, y
con razón:

> *"La confianza viaja **sólo con su fecha**, nunca con su nivel: convertir `0.8` en «alta» sería
> fijar un umbral, que es lo que la spec prohíbe."*

⚠️ **Pero eso aplica a derivar una etiqueta desde un número. No a devolverle al estudiante la
etiqueta que él eligió.** Si el vocabulario es cerrado y él elige de esa lista, **no hay umbral que
fijar**: la etiqueta *es* el dato. El producto no está interpretando nada.

### El vocabulario propuesto

**Cuatro estados, todos en primera persona y sobre lo que él hizo** — nunca sobre lo que sabe:

| Estado | Qué afirma | Reemplaza a |
|---|---|---|
| `sin_marcar` | Nada. Es la ausencia | *Sin empezar* |
| `lo_lei` | Tuvo contacto | *Leído* |
| `lo_practique` | Produjo trabajo | *Practicado* |
| `puedo_explicarlo` | **Lo que él cree**, dicho como creencia | ⛔ *Dominado* |

⚠️ **`puedo_explicarlo` sigue siendo una creencia y hay que rotularla como tal.** El pie de la barra
tiene que decir de quién es la afirmación —*"lo marcás vos; no es una nota ni una evaluación"*— y el
rótulo de la sección sigue siendo el que fijó la psicopedagoga.

⚠️ **La fracción `3/3` no se adopta.** Es un puntaje, y con un vocabulario declarado no significa
nada: `2/3` sugiere que falta un tercio de algo medible.

> ℹ️ **Esto necesita la revisión de la psicopedagoga antes de construirse.** Ella escribió el rótulo
> vigente y objetó específicamente el vocabulario evaluativo. Cuatro palabras nuevas en la superficie
> que el estudiante más mira no se estrenan sin que las lea.

---

## 4 · Lo que esto toca de `C01-019`

`C01-019` —*cómo se muestran las cinco dimensiones*— está **abierta, gate `H`**, y es lo que hoy
impide mostrar valores. Este diseño **no la cierra entera**: propone cerrarla **para una sola
dimensión**, y por el camino que la vuelve trivial.

| Dimensión | Sigue esperando `C01-019` |
|---|---|
| Recorrido · Práctica · Dominio | ✅ Sí. Son derivadas y su semántica sigue sin aprobarse |
| **Confianza** | ⛔ **No**, si el valor deja de ser numérico y pasa a ser una etiqueta declarada |

⚠️ **Y hay una segunda cosa que este diseño NO puede hacer, y el spec la dibuja.** Su wireframe
incluye un bloque:

```
| ATENCION                             |
| Confianza alta sin dominio evaluado  |
```

**Esa comparación está prohibida.** `VI.2` §8.4: *"sólo aparece si Student/Risk Model entrega la
brecha derivada y su explicación; **la vista no compara umbrales**"*, y `C01-043` está `OPEN`. Las
dos dimensiones se muestran separadas y **nadie las compara**.

---

## 5 · Las cuatro decisiones tomadas sobre la captura

| Elemento | Decisión | Consecuencia |
|---|---|---|
| **El checklist por tema** | Lo marca **el estudiante**. Es autorreporte | Escribe la dimensión Confianza. Vocabulario a revisar por la psicopedagoga |
| **Clases de la semana** | **Se muestran, no agendan** | Se declaran y el reparto las descuenta. Nada se agenda solo: [ADR-064](decisions.md#adr-064) intacto |
| **La navegación nueva** | **Afuera por ahora** | `Calendario`, `Formación`, `Mi seguimiento` y los contadores quedan sin construir |
| **Documentos** | **Sólo guardar archivos** | No es la ingesta. No extrae unidades del programa |

---

## 6 · Qué hace falta para cada pieza

| # | Pieza de la captura | Qué necesita | Existe hoy |
|---|---|---|---|
| **A** | Checklist por tema | Un escritor de `confidence_*` con vocabulario declarado | ⛔ Columnas sí, escritor no |
| **B** | `REGISTRO` de la derecha | La Bitácora **filtrada por materia** | ✅ **hecho** — [ADR-082](decisions.md#adr-082). `CTA-009` transporta la cursada |
| **C** | `CLASES DE LA SEMANA` | El **bloque horario** de [ADR-063](decisions.md#adr-063) | ✅ **hecho** — [ADR-083](decisions.md#adr-083). Entidad, ingesta y panel |
| **D** | Descontar las clases del reparto | Que `insumos_de_reparto()` reste las horas de cursada | ⛔ **No se hizo, y es una decisión.** Contradice ADR-063, ADR-064 y *«solo mostrar»*. Ver [ADR-083](decisions.md#adr-083) |
| **E** | `PRÓXIMO PASO SUGERIDO` | El ADE | 🟢 Existe |
| **F** | `ÚLTIMA ACTIVIDAD` | `ultimoAvance` | 🟢 Existe |
| **G** | `DOCUMENTOS` | Almacenamiento por cursada | 🟡 Hay bucket de evidencia; no hay uno de material |
| **H** | `Aula 305` | Un campo de aula | ⛔ No existe en ninguna tabla |
| **I** | `Seguir en etapa 3` · *"Analía interviene en paralelo"* | Etapas, y **nombrar a una persona** | ⛔ Sin definir. Ver §7 |

---

## 7 · ⛔ Lo que la captura pide y este documento NO resuelve

**`Seguir en etapa 3`.** No está claro qué son las etapas. Si son los pasos del protocolo de Modo
Examen, ya existen —veinte, `HUMAN-ROADMAP v1.0`— y viven en `UX08`/`UX09`, no acá. Si son otra cosa,
es un concepto nuevo.

**«Analía interviene en paralelo».** El producto **hoy no nombra a ninguna persona**. Que exista una
persona detrás está en el modelo —`intervention`, con su outcome— pero *quién es* no viaja a la
pantalla, y `C01-030` —la identidad de quien interviene— está **`DEFERRED` hasta
[ADR-006](decisions.md#adr-006)**. Mostrar un nombre real es dato personal.

**`Aula 305`.** Sigue sin tener dónde ir, y no es un olvido: [ADR-062](decisions.md#adr-062) modeló
el bloque horario sin aula, y [ADR-083](decisions.md#adr-083) lo construyó así. El horario **sí**
llegó; el aula no.

**Y una pregunta nueva, que abrió el corte 3.** Un estudiante puede declarar disponibilidad **encima**
de su horario de clase. Hoy eso no se detecta en el reparto y aparece recién al comprometerse
([ADR-064](decisions.md#adr-064)). Si hay que decir algo antes, **es una decisión de producto** — no
una resta silenciosa al presupuesto.

**El orden de la pantalla.** La captura pone el Gantt primero y la acción al pie. El spec pide lo
contrario, con un argumento explícito. Es decisión del owner y conviene tomarla mirando las dos.

---

## 8 · Cortes propuestos

**El 1 y la mitad del 3 quedaron construidos el 9 de septiembre** —
[ADR-082](decisions.md#adr-082) y [ADR-083](decisions.md#adr-083)—. **El 2 y el 4 no.** El orden sale
de qué destraba a qué, no de qué es más vistoso.

| Corte | Qué | Por qué va ahí |
|---|---|---|
| **1** ✅ | **B — la Bitácora por materia** | El más barato: el dato ya viene por cursada. Cierra un hueco que el spec pide y nadie construyó |
| **2** | **A — el checklist de Confianza** | Es el corazón de la captura. **Precondición: que la psicopedagoga apruebe el vocabulario** |
| **3** 🟡 | **C + D — clases de la semana y su descuento** | **C hecho** ([ADR-083](decisions.md#adr-083)). **D no**: el descuento contradice tres decisiones ya tomadas, y queda como pregunta del owner |
| **4** | **G — documentos** | Independiente de todo lo demás |

⚠️ **El corte 2 no puede empezar antes que su revisión.** Cuatro palabras nuevas en la superficie que
el estudiante más mira, sobre la dimensión que él mismo declara, no se estrenan sin que las lea la
persona que objetó el vocabulario anterior.
