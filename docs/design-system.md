# Achieve — Sistema de diseño

**Documento:** `docs/design-system.md`
**Rol:** owner canónico de tokens, primitivas visuales y principios de interfaz.
**Deriva de:** `docs/design-system-source.md` (manual normativo), la extracción visual anonimizada
en [`design-system-capturas.md`](design-system-capturas.md) y `app/globals.css` (implementación
auditada). Los originales visuales no se versionan por ADR-006.

> **La fuente del lenguaje visual son las capturas de `docs/diseño/`**
> ([ADR-018](decisions.md#adr-018)). **Se miran antes de tocar UI.** No están versionadas: si la
> carpeta está vacía, se dice y se para — no se improvisa un diseño. Ver `AGENTS.md` §1.5.
**Última actualización:** 29 de agosto de 2026

---

## 1. Traducción al dominio — resuelta

El manual de diseño es **normativo**, no inspiracional. Su primera regla `DEBE` es completar la fase
de traducción al dominio antes de aplicar cualquier otro principio:

> *"DEBE completarse antes de aplicar el resto del manual. Si sos una IA y no tenés estas respuestas,
> pedilas."* … *"Prohibido inventar contenido de dominio."*

✅ **Las diez respuestas están resueltas y escritas** en
**[`domain-translation-dd1-dd10.md`](domain-translation-dd1-dd10.md)**, que es su owner canónico.
Se decidieron durante el diseño del sistema visual, antes de que existiera este repositorio, y se
incorporaron al repo el 28 de agosto de 2026 ([ADR-010](decisions.md#adr-010)).

### 1.1 Nomenclatura

Para evitar la colisión con las decisiones de producto `D1`–`D25` del spec, en este repositorio las
preguntas de traducción al dominio se citan como **`DD1`–`DD10`**
([ADR-009](decisions.md#adr-009)).

### 1.2 Las diez respuestas

| ID | Pregunta | Respuesta |
|---|---|---|
| `DD1` | ¿Cuál es la acción irreversible? | **Ninguna dentro de la app, a propósito.** Rendir el examen —el único momento sin vuelta atrás— pasa afuera de Achieve |
| `DD2` | ¿Cuál es el reloj? | **Doble:** hora del Commitment acordado (primero), días hasta el examen (segundo) |
| `DD3` | ¿Fuente externa autoritativa? | **Sí:** la cátedra/institución, que puede discrepar de lo que reporta el estudiante |
| `DD4` | ¿Los 10 términos del oficio? | `parcial`, `final`, `TP`, `cursada`, `cátedra`, `comisión`, `Modo Examen`, `Bitácora`, `Compromiso`, `Evidencia` — ⚠️ **`DEFERRED`**, sin confirmación formal |
| `DD5` | ¿Qué magnitudes de máquina se muestran? | **Ninguna.** Sin scores, porcentajes, readiness numérica ni probabilidad |
| `DD6` | ¿Los 3–4 eventos que merecen color? | **Exactamente 3:** éxito, urgencia, intervención humana. Riesgo queda sin color propio |
| `DD7` | ¿La decisión repetitiva? | *"¿Me comprometo con esta acción?"* |
| `DD8` | ¿Qué default tomaría el mejor profesional? | Último ritmo de cátedra confirmado; cinco dimensiones separadas |
| `DD9` | ¿Cuál es la unidad de trabajo? | **Una `Action` a la vez** — el Hero de Hoy |
| `DD10` | ¿Qué se sabe hoy de memoria? | **Por qué esa acción va primero** — la línea `Porque:` |

### 1.3 Qué desbloquea cada respuesta

| Respuesta | Consecuencia sobre los principios |
|---|---|
| `DD1` | **`P-11` no requiere patrón de deshacer.** No hay acción irreversible que confirmar con consecuencia enunciada. ⚠️ Se revisa si el Track B introduce una (datos reales, pagos, borrado definitivo) |
| `DD2` | **`P-05` operativo:** el orden por defecto prioriza Commitment por vencer y luego proximidad del examen, sin fusionarlos en un número |
| `DD3` | **`P-08` activo** — ya implementado como "Cátedra y vos" en `UX02`, con las dos fuentes en columnas separadas y su `provenance` |
| `DD5` | **`P-03` se cumple por la vía más fuerte:** no mostrando la magnitud, en vez de anclarla |
| `DD6` | **`P-06` cerrado.** Tres semánticos, cuarta ranura deliberadamente vacía |
| `DD7` | **`P-10` resuelto con tensión arbitrada** — ver §1.4 |
| `DD9` | Confirma el layout base: una unidad de decisión por pantalla |
| `DD10` | **`P-01` ya implementado** como `ReglaDeNegocio` en todas las pantallas |

### 1.4 La tensión de `P-10`, y cómo se resolvió

El owner del producto pidió aplicar el patrón de cola numerada (`1 de N`) **también en Hoy**, no solo
en una futura cola de Operador. Eso chocaba con la regla de cambio controlado del spec (Parte II
§22.3): *"no se agrega navegación para acomodar ideas que todavía no tienen función"*.

Resolución adoptada:

> El **Hero de Hoy no cambia** — lo sigue eligiendo la tabla de precedencia de 9 niveles tal cual
> está. El patrón de cola se aplica **únicamente a la lista de materias debajo del fold**: cuando hay
> más de una materia con algo pendiente el mismo día, esa lista deja de ser plana y se vuelve
> paginable, con flechas y contador. **No se agrega pantalla ni CTA nuevo.**

Ya implementado en `components/screens/hoy-autogestion.tsx`, componente `MateriasQueue`.

### 1.5 Deuda detectada por `DD6`

`--chart-2` en `app/globals.css` sigue siendo `#ff9500`, el **naranja original** que `DD6` eligió
antes de corregirse a rosa/magenta para compartir familia de color con Dashboard_Achieve. El propio
CSS declara que *"charts heredan de los 3 semánticos + ink, nunca colores nuevos"*, así que ese valor
quedó huérfano de la corrección.

No afecta a ninguna pantalla actual —no hay charts en el Track A— pero **se reconcilia en la Etapa
0.1** para que la paleta no tenga dos verdades.

---

## 2. Tokens

Fuente de verdad ejecutable: **`app/globals.css`**. Tailwind v4 en modo CSS-first: sin
`tailwind.config.js`, con `@theme inline` y `@utility`.

> Los valores de contraste de esta sección están **medidos, no estimados**, como exige la auditoría
> del manual. La corrección de `--muted-foreground` está anotada en el propio CSS.

### 2.1 Superficies

```css
--background: #f5f5f7;   /* el gris de Apple, no #fafafa ni #eee */
--foreground: #1d1d1f;   /* ink — nunca negro puro */
--card:       #ffffff;
--popover:    #ffffff;
--muted:      #f5f5f7;
--muted-foreground: #707070;
```

> **`--muted-foreground` = `#707070`, no `#86868b`.** El valor de Apple daba 3.33:1 y falla WCAG AA.
> El corregido da 4.55:1 como mínimo. Esta es exactamente la trampa que el manual advierte: *"la
> estética gris-sobre-gris falla contraste con una facilidad alarmante"*.

### 2.2 Acción primaria

```css
--primary:            #1d1d1f;   /* negro/inversión, NUNCA color semántico */
--primary-foreground: #ffffff;
```

Implementa `I-06`: una sola acción destacada por pantalla, en negro o inversión. El color semántico
**no** se gasta en botones primarios; se guarda para la alarma.

### 2.3 Semánticos — exactamente tres (`DD6`)

El manual permite hasta cuatro. Achieve usa **tres**, y la cuarta ranura queda deliberadamente vacía:
*"un quinto color divide por dos el valor de los anteriores"*.

```css
--exito-fill:     #34c759;  /* relleno de chip; ink encima → 7.58:1 */
--exito-texto:    #23883c;  /* texto/ícono directo sobre card → 4.51:1 */
--urgencia-fill:  #f472b6;  /* ink encima → 6.35:1 */
--urgencia-texto: #9c3d68;  /* pasa 4.5:1 contra card, background y su propio fill */
--humano:         #0071e3;  /* Intervention abierta; pasa 4.5:1 como texto directo */
--destructive:    #9c3d68;  /* reusa urgencia-texto: rescate ES urgencia, no un 4º color */
```

| Token | Evento declarado |
|---|---|
| `exito` | La acción se completó, la evidencia fue validada |
| `urgencia` | El reloj corriendo, algo falta, un compromiso incumplido |
| `humano` | Hay una Intervention real abierta con un operador asignado |

**Dos reglas no negociables:**

1. **Cada semántico existe en dos variantes.** `-fill` es relleno sólido con texto ink encima.
   `-texto` es uso directo como color de texto o ícono sobre superficie clara. **Nunca** se usa la
   variante `-fill` como color de texto ni como borde fino: falla contraste. Está medido.
2. **Ningún estado se comunica solo por color.** Siempre color + palabra. *Prueba: imprimir la
   pantalla en blanco y negro; si se pierde información, la regla está violada.*

> **El riesgo se comunica sin color.** El spec prohíbe scores de riesgo visibles; la severidad se
> expresa en el estado general y en la razón, en texto.

### 2.4 Bordes — hairlines

```css
--border: rgba(0, 0, 0, 0.09);
--input:  rgba(0, 0, 0, 0.09);
--ring:   #1d1d1f;
```

Se usan a **0.5px**, no 1px. Utilidades `.hairline-t` y `.hairline-b`.

### 2.5 Radios

```css
--radius:         0.75rem;    /* 12px — tarjeta */
--radius-control: 0.4375rem;  /* 7px  — control */
--radius-pildora: 980px;      /* chips de estado y segmentados */
```

`V-04`: **el radio interior siempre menor que el exterior.** Una tarjeta de 12px no puede contener un
botón de 12px. Se aplica globalmente:

```css
button, [role="combobox"] { border-radius: var(--radius-control) !important; }
textarea, input           { border-radius: var(--radius-control) !important; }
.pill, [data-slot="badge"]{ border-radius: var(--radius-pildora) !important; }
```

### 2.6 Tipografía — cinco tamaños (`V-01`)

```css
--text-meta:     0.6875rem;  /* 11px — metadatos, IDs */
--text-label:    0.8125rem;  /* 13px — labels, eyebrow */
--text-body:     0.9375rem;  /* 15px — cuerpo */
--text-title-sm: 1.1875rem;  /* 19px — subtítulo de tarjeta */
--text-title-lg: 1.875rem;   /* 30px — título de pantalla */
```

- Familia: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue",
  Inter, system-ui`.
- **Tracking negativo en títulos** (`-0.022em`), cero en cuerpo. Es la mitad de la sensación Apple.
- **Monoespaciada solo para lo que se compara carácter por carácter** (`V-02`): identificadores,
  fixture IDs, códigos. `font-variant-numeric: tabular-nums` para números que se comparan entre filas
  (`V-06`).

> **Corrección aplicada.** El `.eyebrow` usaba monoespaciada y se corrigió a sans: un eyebrow es un
> *label de categoría*, no un identificador. `V-02` reserva la mono para lo que se compara.

### 2.7 Foco

```css
*:focus-visible { outline: 2px solid var(--foreground); outline-offset: 2px; }
```

Alto contraste con ink, **sin consumir presupuesto de color semántico** (`P-06`, `A-08`).

### 2.8 Chrome translúcido

```css
.chrome-translucent {
  background: rgba(250, 250, 252, 0.82);
  backdrop-filter: saturate(180%) blur(24px);
}
```

**Solo para barras fijas.** El contenido es opaco. Invertir esto es *"el error número uno"* del
estilo Mac: si el contenido también es translúcido, el texto pierde contraste y todo se vuelve sopa.

---

## 3. Primitivas

Viven en `components/screens/design-system.tsx`. Son la capa que las nueve pantallas comparten para
no duplicar ni divergir el sistema de tokens.

| Primitiva | Función | Principio |
|---|---|---|
| `Eyebrow` | Label de categoría en mayúsculas | `V-01` |
| `EstadoGeneral` | Una línea de estado, sin repetir la causa | — |
| `ReglaDeNegocio` | **La regla del negocio pegada al control** | **`P-01`** |
| `HeroCard` | Contenedor de la acción principal | `V-04` |
| `EstadoChip` | Chip de estado con relleno sólido + ink encima | `P-06` |
| `CTAPrincipal` | Una sola por pantalla, en negro/inversión | `I-06` |
| `CTASecundaria` | Acción secundaria, nunca compite | `I-06` |
| `Fila` | Par label/valor con hairline. Delega en `Ausencia` (tipada) o en `EstadoChip` (dato adverso) | **`P-09`** |
| `PasoDelRecorrido` | Progreso del recorrido de diseño — **no es parte del producto** | — |

### 3.1 `ReglaDeNegocio` es la primitiva más importante

`P-01` es el principio que el manual identifica como *"el que más calidad percibida produce por unidad
de esfuerzo, y casi nadie lo hace"*. En Achieve se manifiesta en el patrón de copy del Hero:

```
Porque: consolida lo visto hoy.              ← una causa, una sola
40 min · Entregá: 5 ejercicios               ← tiempo + evidencia esperada
Después: queda definido cuándo vas a hacerla. ← el siguiente evento REAL
```

**Deuda de contenido — mitigación obligatoria del manual.** El propio manual advierte que `P-01` es
*"deuda de contenido sin sistema de mantenimiento"*: cambia una regla del negocio y hay N frases
desperdigadas que ahora mienten, y ningún test las detecta.

> **Regla `C-07`:** las frases de regla viven en un archivo de contenido con ID único, versionado,
> **nunca hardcodeadas en componentes.**

Hoy están hardcodeadas en `components/screens/*`. **Extraerlas es parte de la Etapa 0.2.**

### 3.2 Primitivas que faltan

Detectadas al comparar las primitivas existentes con lo que exigen las specs de `UX07`–`UX09`:

| Primitiva | Para qué | Principio |
|---|---|---|
| `Provenance` | Label de fuente + `verification_status` junto al dato | `P-08` |
| ~~`Ausencia`~~ | ✅ **Extraída** en la Etapa A2.3. Dos tratamientos dibujados; *no hay dato* omite la fila y *no cargado* no ocurre bajo cero red. Ver [ADR-019](decisions.md#adr-019) | `P-09` |
| `Esqueleto` | Estados de carga con la geometría real del contenido | `P-12` |
| `SeleccionExplicita` | Elegir entre varios Assessment sin ranking local | `UX07` |

---

## 4. Principios aplicados

### 4.1 Los que aplican con fuerza `DEBE`

| ID | Principio | Cómo se aplica en Achieve |
|---|---|---|
| `P-01` | La interfaz explica **la regla del negocio**, no la función del control | `ReglaDeNegocio` en cada Hero. *"Porque: prepara la próxima clase."* |
| `P-02` | Vocabulario del oficio intacto + glosa | Se dice "Unidad 3", "Parcial 1", "cátedra", "comisión". No se traduce a lenguaje llano |
| `P-04` | Los defaults toman partido profesional | ⚠️ Varios defaults son `HUMAN-P0` **provisionales**. Ver [ADR-007](decisions.md#adr-007) |
| `P-06` | El color se raciona a eventos semánticos | Base acromática + exactamente 3 semánticos |
| `P-08` | La procedencia del dato es parte del dato | `source_type` + `verification_status` junto a cada dato discutible |
| `P-09` | La ausencia se tipa | Cuatro estados distintos. *"Dominio: no evaluado"* ≠ *"no disponible"* ≠ `0` |
| `P-11` | Confirmación única, acuse persistente, deshacer real | ✅ **Resuelto por `DD1`:** no hay acción irreversible en la app. Sigue aplicando la confirmación única y el acuse persistente; **no** hace falta deshacer |

### 4.2 Los que aplican con fuerza `DEBERÍA`

| ID | Principio | Estado |
|---|---|---|
| `P-05` | Ordená por costo de no actuar | ✅ **Resuelto por `DD2`:** Commitment por vencer primero, proximidad del examen después |
| `P-07` | Ningún atajo elimina su camino visible | Aplica poco: la interfaz del estudiante tiene pocos atajos |
| `P-10` | Una decisión por vez, con el reloj a la vista | ✅ **Resuelto por `DD7`:** cola paginable en la lista de materias, sin tocar el Hero. Ver §1.4 |
| `P-12` | Los estados de carga tienen la forma del contenido real | Pendiente: falta la primitiva `Esqueleto` |
| `P-13` | Canal de feedback de alcance angosto | `N/A` en el Track A |

### 4.4 `C-04` elevado — el vacío argumenta

**Elevado el 30 de agosto de 2026** por [ADR-022](decisions.md#adr-022). Antes pedía una sola cosa:
*"los estados vacíos explican qué va a aparecer"*. Ahora pide hasta tres.

| Cláusula | Obligatoria | Ejemplo |
|---|---|---|
| **Qué va a aparecer** | Siempre | *"Acá va a aparecer el orden de pasos de esta preparación."* |
| **Por qué importa** | Siempre | *"Es lo que te dice por dónde seguir sin tener que reconstruirlo vos."* |
| **Cómo hacer que aparezca** | **Sólo si depende del estudiante** | *"Hacé clic para adjuntarla."* |

**La tercera es condicional, y esa condición es la parte importante de la regla.** Cuando la
aparición del dato **no** depende del estudiante —el recorrido lo arma el servicio propietario, la
próxima acción la produce el Engine—, el vacío queda en **dos cláusulas**. No se inventa una acción
falsa para completar el patrón: darle una palanca que no tiene es peor que un vacío corto.

**Tratamiento.** Párrafo, `--text-label`, ancho máximo ~380 px (§9.2 de
[`design-system-capturas.md`](design-system-capturas.md)). **Nunca en itálica atenuada**: ése es el
tratamiento de `SIN_ASIGNAR` ([ADR-019](decisions.md#adr-019)), y un vacío que explica **no es un
dato que falta** — usar el mismo tratamiento para las dos cosas rompe la distinción que `P-09` pide.

**Lo que el vacío no hace:** no promete cuándo va a estar el dato, no emite veredicto sobre el
estudiante (`C-06`) y no repite lo que ya está al lado.

### 4.3 `P-03` — mayormente `N/A`, y es una decisión fuerte

El manual exige anclar toda magnitud de máquina a una escala de juicio humano. **En Achieve no hay
magnitudes de máquina visibles**: el spec prohíbe explícitamente scores de riesgo, porcentajes de
materia aprendida, readiness numérica y probabilidad de aprobación.

`P-03` se cumple, entonces, por la vía más fuerte: **no mostrando el número en absoluto**. Donde el
spec sí permite una cifra, es un hecho contable con unidad natural —*"Práctica: 12 → 19 ejercicios"*—
que el manual exime explícitamente de anclaje.

---

## 5. Reglas de contenido

| ID | Regla | Aplicación |
|---|---|---|
| `C-01` | Una sola persona gramatical | **Voseo rioplatense en todo el producto.** *"Entregá"*, *"Subí"*, *"Comprometerme"*. El anti-patrón `A-05` es exactamente una grieta de tono en la pantalla más importante |
| `C-02` | Un concepto = una palabra | El glosario de [`product.md`](product.md) §3 es normativo. `A-04` es la deriva de vocabulario |
| `C-03` | Placeholders con ejemplos reales | Nunca *"Ingresá un valor"* |
| `C-04` | **Elevado ([ADR-022](decisions.md#adr-022)).** El vacío explica **qué va a aparecer** y **por qué importa**, y —**sólo si la aparición depende del estudiante**— **cómo hacer que aparezca**. Ver §4.4 | *"Acá va a aparecer el orden de pasos de esta preparación. Es lo que te dice por dónde seguir sin tener que reconstruirlo vos."* |
| `C-05` | Nombrá roles en la situación, no estados de base | *"Compromiso incumplido"*, no *"state: MISSED"* |
| `C-06` | Las etiquetas describen, no juzgan | `INSUFFICIENT` se dice *"Todavía no cumple el criterio mínimo"*, nunca *"Fallaste"* |
| `C-07` | Las frases de regla en archivo de contenido versionado | ⚠️ **Deuda: hoy están hardcodeadas** |

### 5.1 La traducción obligatoria de enums

Los enums técnicos **nunca** aparecen como copy visible. Tabla completa en
[`product.md`](product.md) §7.

### 5.2 Copy prohibido

Lista consolidada en [`product.md`](product.md) §13.

---

## 6. Layout y responsive

> **Desktop-first** ([ADR-014](decisions.md#adr-014), 29 ago 2026). El viewport primario de diseño y
> de verificación es **desktop**. **360 px es el piso obligatorio** de la variante móvil, no la medida
> de referencia. El contrato de §6.1 **no cambió**: dejó de enunciarse como una propiedad de la
> pantalla de 360 px y pasó a ser un contrato de **orden semántico**, obligatorio en todo ancho.

### 6.1 El contrato del primer viewport — orden semántico

Rige en **todo viewport**. Para toda pantalla de decisión:

```
estado en una línea
contexto (materia · tema, o examen)
acción o estado operativo dominante
una razón — UNA sola
tiempo cuando aplica + evidencia esperada
qué pasa después, en una línea
[ CTA PRINCIPAL A ANCHO COMPLETO ]
──────── fin above the fold ────────
```

**Prohibido entre el estado y la CTA:** lista de materias, alerta con la misma causa, feedback,
último mensaje, indicador de progreso, link secundario que compita, o presencia humana sin hecho
operacional.

**Dónde se verifica:**

| Ancho | Rol | Qué se verifica |
|---|---|---|
| **Desktop** | Primario | El contrato de orden completo. Es donde corre el test de 10 segundos |
| **360 px** | Piso obligatorio de la variante móvil | El mismo orden, sin pérdida de información |

Una pantalla que cumple el contrato en desktop y lo pierde a 360 px **no está terminada**. La
reducción a 360 px baja el **tamaño**, nunca la **cantidad de información** — es el anti-patrón
`A-03`.

### 6.2 Desktop — el viewport primario

Mantiene **el mismo orden semántico** de §6.1. El espacio adicional se usa para conciencia periférica,
no para sumar información al Hero. Proporción aproximada: 2/3 Hero + 1/3 contexto.

**Las dos columnas tienen contenido asignado** ([ADR-015](decisions.md#adr-015), derivado de
`product-spec-source.md` §VI.7 §21.2):

| Columna | Qué lleva |
|---|---|
| **Principal** (2/3) | Identidad, datos, razón y **decisión** |
| **Secundaria** (1/3) | Efecto real, continuidad y provenance expandida |

**La CTA principal va a ancho completo, al final de la columna principal.** Una sola por pantalla y
por estado. El retorno seguro vive en la columna secundaria y **nunca se estiliza como primaria** —
el panel lateral no contiene CTAs competidoras.

> **La píldora negra arriba a la derecha se descartó.** Pertenece al producto de las capturas
> anonimizadas, no a Achieve. Regla general de ADR-015: cuando
> [`design-system-capturas.md`](design-system-capturas.md) y una spec `VI.*` describan lo mismo,
> **manda la spec**. Las capturas aportan vocabulario visual, no contrato de layout.

**El ancho adicional no agrega información al Hero.** Ni protocolo, ni analytics, ni cronograma.

### 6.3 Un dato, un dueño visual

| Información | Lugar principal | Representación secundaria |
|---|---|---|
| Estado general | Franja mínima | No se repite como alerta |
| Causa de prioridad | Hero | Materia usa solo estado resumido |
| Acción actual | Hero | No se duplica en la lista de materias |
| Evidencia esperada | Hero | Detalle completo en Action/Evidence |
| Riesgo | Modifica estado y razón | Señal secundaria solo si aporta otra causa |
| Examen activo | Contexto del Hero | El protocolo completo vive fuera de Hoy |
| Humano | Hecho operacional contextual | WhatsApp/CRM fuera de Hoy |

---

## 7. Accesibilidad

Requisitos verificables, no aspiracionales:

- **Contraste WCAG AA medido, no estimado**, en labels, placeholders y textos de apoyo.
- **El color nunca es el único portador de estado.** Prueba: imprimir en blanco y negro.
- `Reportado`, `Pendiente de corroboración`, `Confirmado`, `Programado`, `Estimado`, `Disputado` y
  `Desconocido` tienen texto o iconografía distinguible.
- **`No evaluado` se distingue visualmente de un valor bajo, y ambos de `0`.**
- Los indicadores dimensionales llevan label accesible con el nombre de su dimensión.
- Los tiempos relativos tienen su fecha absoluta disponible al profundizar.
- La pantalla funciona **sin animación** y no depende de `hover`.
- Recorrido completo con `Tab`, sin mouse, sin trabarse.
- **Deshabilitado tiene tratamiento propio** —opacidad + cursor + `aria-disabled`— distinto de
  secundario. Es el anti-patrón `A-08`.

---

## 8. Anti-patrones

Los nueve del manual, con su riesgo concreto en Achieve:

| ID | Anti-patrón | Riesgo específico en Achieve |
|---|---|---|
| `A-01` | Dato roto presentado como transparencia | Mostrar contenido de cátedra mal parseado y llamarlo provenance. **Fidelidad en el valor, calidad en la presentación** |
| `A-02` | Doble confirmación | Confirmar un Commitment con botón y volver a preguntarlo en texto |
| `A-03` | Colapso que destruye información | Un modo compacto reduce **tamaño**, nunca **cantidad de información** |
| `A-04` | Deriva de vocabulario | Llamar al mismo objeto "acción", "tarea" y "actividad" según la pantalla |
| `A-05` | Deriva de tono | Una etiqueta en usted dentro de un producto que vosea |
| `A-06` | La etiqueta que prejuzga | Rotular al estudiante como "en riesgo" en vez de describir la situación |
| `A-07` | Gestor de ventanas a medio hacer | `N/A` en el Track A |
| `A-08` | El gris que significa dos cosas | Secundario y deshabilitado compartiendo tono |
| `A-09` | Superficie de terceros sin integrar | El branding del proveedor de auth en el menú de cuenta (relevante en Track B) |

---

## 9. Auditoría de conformidad

Se corre **antes de cerrar cada etapa** que toque UI. Formato: `ID · PASA / FALLA / N/A · evidencia
en una línea`. **No se esconden los que fallan.**

### Bloque 1 — Traducción al dominio
- [x] `DD1`–`DD10` contestadas y **escritas**, no supuestas → ✅ **PASA.** [`domain-translation-dd1-dd10.md`](domain-translation-dd1-dd10.md). *Salvo `DD4`, `DEFERRED`*
- [x] La acción irreversible está identificada **por nombre** → ✅ **PASA.** `DD1`: no existe dentro de la app, a propósito

### Bloque 2 — Contenido
- [ ] `P-01` Cada control con regla de negocio tiene su frase, pegada al control
- [ ] `P-02` Los términos del oficio aparecen exactos
- [ ] `C-01` Una sola persona gramatical. **Buscá la excepción: siempre hay una**
- [ ] `C-02` Un concepto = una palabra en menú, título y copy
- [ ] `C-03` Ningún placeholder genérico
- [ ] `C-05` Los objetos se nombran por su rol en la situación
- [ ] `C-06` Ninguna etiqueta emite un veredicto
- [ ] `C-07` Las frases de regla están en contenido versionado → ⚠️ **deuda conocida**

### Bloque 3 — Decisión y riesgo
- [ ] `P-04` Cada default responde "qué haría el mejor profesional", y **es visible en resultados**
- [ ] `P-05` Orden por costo de no actuar → criterio definido por `DD2`
- [x] `P-11` La acción irreversible tiene deshacer o consecuencia enunciada → ✅ **N/A por `DD1`**: no hay acción irreversible
- [ ] `P-11` Una sola confirmación por decisión (buscá `A-02`)
- [ ] `P-11` El acuse **persiste** en pantalla; no es un toast

### Bloque 4 — Datos
- [ ] `P-03` Ninguna magnitud de máquina llega cruda → ✅ el spec prohíbe mostrarlas
- [ ] `P-08` Las dos fuentes de verdad son visibles; las ediciones locales están marcadas
- [x] `P-09` Vacío, no-cargado, sin-asignar y cero se ven distinto — **A2.3**, con matiz declarado:
      *sin-asignar* y *cero* se dibujan y se testean sin depender del color; *vacío* omite la fila
      entera (*omitir, no inventar*); *no cargado* es `N/A` bajo cero red. Falta separar dos clases
      de ausencia que hoy comparten tratamiento: [ADR-020](decisions.md#adr-020) `PENDING`
- [ ] `A-01` Con datos sucios reales, ninguna celda quedó ilegible

### Bloque 5 — Visual
- [ ] `P-06` Máximo 4 semánticos, con evento declarado → ✅ Achieve usa 3
- [ ] `P-06` Ningún estado solo por color → **prueba: imprimir en B/N**
- [ ] `A-08` Deshabilitado tiene tratamiento propio
- [ ] `V-01`…`V-06` verificados
- [ ] **Contraste WCAG AA medido, no estimado**

### Bloque 6 — Interacción
- [ ] `P-07` Cada atajo tiene su camino visible en la misma pantalla
- [ ] `P-12` Los esqueletos tienen la forma real y nada salta al cargar
- [ ] `I-01` Todo estado compartible tiene URL
- [ ] `I-05` El bloqueante está arriba de todo
- [ ] Recorrido completo con `Tab`
- [ ] Lector de pantalla sobre la pantalla más compleja
- [x] **La pantalla de decisión cumple el contrato de orden de §6.1 en desktop, y no lo pierde a 360 px**
      — medido el 30 ago 2026 en las nueve superficies a **1440×900 y 1280×800**: la CTA primaria
      termina entre 436 y 741 px, **siempre sobre el pliegue**; a 360 px no hay scroll horizontal.
      ⚠️ **No automatizado:** es layout, `jsdom` no lo verifica. Se repite si crece el contenido

---

## 10. Protocolo de validación por panel

Antes de cerrar una decisión de diseño relevante, se simulan siete voces:

**Arquitecta de información** · **Diseñador de interacción** · **Diseñadora visual** ·
**UX writer** · **Investigadora HCI** · **Usuario experto del dominio** · **Crítico adversario**.

> **Regla:** si las siete coinciden, la decisión es sospechosa y una voz **DEBE** atacarla igual.

**Salida obligatoria:** decisión propuesta · principios que la respaldan **por ID** · la objeción más
fuerte que sobrevivió · qué evidencia la resolvería.

---

## 11. Resumen operativo

Si hay que quedarse con seis frases:

1. **Escribí la regla del negocio al lado del control.** Es lo que más calidad percibida produce por
   unidad de esfuerzo, y casi nadie lo hace.
2. **No simplifiques el dominio; simplificá el acceso al dominio.** Vocabulario experto intacto +
   glosa pegada.
3. **Ningún atajo elimina su camino visible**, y ambos viven en el mismo lugar de la pantalla.
4. **El color se gasta solo en urgencia, éxito y presencia humana.** La calma no es estética: es
   contraste guardado para la alarma.
5. **Ordená por costo de no actuar, y decí la verdad sobre de dónde viene cada dato.**
6. **La estética minimalista es replicable en un producto malo.** Lo que no se puede fingir es haber
   entendido el trabajo antes de dibujarlo.
