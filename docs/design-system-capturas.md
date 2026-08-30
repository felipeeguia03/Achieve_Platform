# Achieve — Extracción visual de las capturas de referencia

**Documento:** `docs/design-system-capturas.md`
**Rol:** owner de la **especificación visual medida** — densidad, composición, anatomía de
componentes y estados — extraída de las capturas del software de referencia.
**Subordinado a:** [`design-system.md`](design-system.md), que sigue siendo el owner canónico de
tokens, principios y auditoría. **Este documento no redefine nada de allí.**
**Deriva de:** una revisión local de 34 capturas —27 páginas del manual visual y 7 capturas crudas
del software de referencia—. Los originales no se versionan porque contienen datos reales; este
documento conserva únicamente observaciones visuales sin identidad personal, conforme a ADR-006.
**Última actualización:** 30 de agosto de 2026

---

## 0. Alcance, y por qué este documento es corto

### 0.1 Qué ya estaba resuelto

Las capturas 01–27 del set corresponden al **manual visual completo** y ya están destiladas en
[`design-system.md`](design-system.md) bajo [ADR-010](decisions.md#adr-010). El HTML original con
imágenes embebidas se conserva solo localmente hasta que exista una versión anonimizada.

**Nada de lo siguiente se reescribe acá:** principios `P-01`–`P-13`, reglas visuales `V-01`–`V-06`,
contenido `C-01`–`C-07`, interacción `I-01`–`I-06`, anti-patrones `A-01`–`A-09`, los tres semánticos,
los cinco tamaños de texto, los cuatro niveles de tinta, la auditoría de conformidad y las respuestas
`DD1`–`DD10`. Todo eso es de `design-system.md`. Si este documento y aquel discrepan, **aquel gana**.

### 0.2 Qué agrega este documento

Las 7 capturas crudas del software aportan lo que la prosa del manual no fija: **medidas, densidad y
anatomía observables**. Tres de ellas muestran además superficies que el manual nunca documentó.

| Aporte | Estado previo en `design-system.md` |
|---|---|
| Escala de espaciado | ❌ inexistente |
| Alturas de control y densidad de fila | ❌ inexistente |
| Cuarto radio (panel) y su anidamiento | ⚠️ solo tres radios definidos |
| Anatomía completa de formulario | ❌ inexistente |
| Tabla de listado densa | ❌ superficie no documentada |
| Panel de notificaciones | ❌ superficie no documentada |
| Encabezado de entidad y ficha-como-página | ❌ superficie no documentada |
| Los cuatro estados (carga, vacío, error, éxito) | ⚠️ declarados como primitivas faltantes (§3.2) |

### 0.3 Método y su límite

Las medidas se tomaron sobre capturas de **3024 × 1964 px físicos = 1512 × 982 px CSS** (retina 2×).
Están redondeadas a la escala base de 4 px. **Son medidas, no lecturas de código fuente:** tienen un
error estimado de ±2 px. Donde la lectura fue ambigua, está declarado.

**Advertencia heredada del manual, que sigue vigente:** el material fuente son capturas estáticas, en
buena parte de pantallas vacías o en carga. Todo lo de acá está validado por coherencia, no por
telemetría. Son hipótesis fuertes.

### 0.4 El viewport — resuelto

> ✅ **Resuelto por [ADR-014](decisions.md#adr-014), 29 de agosto de 2026.** Achieve es
> **desktop-first**, con el mismo lenguaje visual escalado a móvil. **360 px es el piso obligatorio**
> de la variante móvil, no la medida de referencia.
>
> **Este documento está escrito desktop-first** y ya no contradice a `AGENTS.md` ni a
> [`design-system.md`](design-system.md) §6.1, que se corrigieron en el mismo commit. El contrato del
> primer viewport de §6.1 se conservó entero, reencuadrado como contrato de **orden semántico**
> obligatorio en todo ancho. Ver §12.1.

---

## 1. Principios visuales identificados

Siete observaciones sobre **cómo se ve** el software, no sobre cómo se comporta. Son las que la
lectura del manual no alcanza a fijar.

### 1.1 El texto explicativo es un elemento de layout, no un adorno

Toda pantalla del software abre con la misma tríada, sin excepción:

```
Título (30px)
Párrafo de 2 a 3 líneas, ancho ~65ch, en ink-3
[ tarjeta ]
```

Ese párrafo **explica la regla del negocio de la pantalla entera**, no de un control. Es `P-01`
elevado de escala. Y ocupa lugar reservado: el diseño lo previó, no lo acomodó después.

Lo mismo se repite un nivel abajo: cada sección dentro de una tarjeta lleva
`Título · ⟨contador⟩` y debajo su propio párrafo de dos líneas.

### 1.2 La base es acromática para que el color signifique

El color aparece **exclusivamente** en dos lugares: la columna de estado y el reloj. Nunca en
navegación, nunca en un botón, nunca en un encabezado. El botón primario es negro sólido. El destino
activo del menú es una superficie blanca. La marca no tiene color en la interfaz.

Es la confirmación visual de `P-06` e `I-06`: la pantalla puede tener 40 elementos y **dos** llevan
color.

### 1.3 La jerarquía se construye por superficie, no por peso tipográfico

Cuatro planos apilados, cada uno separado del anterior por elevación mínima, no por tamaño de letra:

```
fondo de app (#f5f5f7)
 └ panel / tarjeta contenedora (#ffffff + hairline + sombra difusa)
    └ tarjeta interna (#ffffff + hairline, sin sombra)
       └ control (superficie gris o blanca)
```

Casi todo el texto de la interfaz vive en dos tamaños —13 y 15 px— y la diferencia entre un nivel y
otro la hace **el plano en el que está**, no la negrita.

### 1.4 El vacío argumenta

El hallazgo más fuerte de las capturas nuevas. El estado vacío del panel de contactos no dice qué va
a aparecer: dice **por qué importa que aparezca**.

> *"Sin contactos cargados. Es el dato que hace que la cuenta se pueda atender sin preguntarle a
> quien la abrió."*

`C-04` en `design-system.md` pide que el vacío explique qué va a aparecer. Esto es un escalón más
arriba. Ver §12.2 — es un candidato a modificar `C-04`.

### 1.5 Lo inaplicable se atenúa, no se oculta

Al cambiar el modo de búsqueda de *Multi* a *Textual*, el bloque «Coincidencia mínima» **completo**
—label, slider, anclas, frase de regla— baja a ~35 % de opacidad y queda en su lugar. No desaparece,
no colapsa, no se mueve nada de lo que está alrededor.

El formulario conserva su forma. El usuario aprende que ese control existe y cuándo aplica. Es la
lectura correcta de `A-03` y de `A-08` a la vez.

### 1.6 La ausencia tiene tres tratamientos distintos y distinguibles

Observado en la misma tabla, en columnas contiguas:

| Situación | Tratamiento | Ejemplo |
|---|---|---|
| No hay dato | Em-dash `—` en ink-4 | columna `TIPO` |
| Hay campo, nadie asignado | *Itálica* en ink-3 | *Sin responsable* · *sin CUIT* |
| Hay dato, y es adverso | Chip con color + palabra | `Vencida` · `Falta poder` |

Tres estados que `P-09` exige separar, resueltos visualmente sin ambigüedad. Es la especificación que
le faltaba a la primitiva `Ausencia`, declarada pendiente en `design-system.md` §3.2.

### 1.7 Densidad alta sin ruido

La tabla muestra 11 filas × 7 columnas en un viewport de 982 px y no se siente apretada. El
mecanismo: **una sola línea divisoria por fila, a 0.5 px y 9 % de opacidad, y cero divisiones
verticales.** No hay zebra striping, no hay bordes de celda, no hay fondos alternos. La columna se
lee por alineación, no por caja.

---

## 2. Design tokens propuestos

> Los tokens de color, tipografía y semántica **ya están definidos** en
> [`design-system.md`](design-system.md) §2 y no se tocan. Acá van únicamente los que ese documento
> no tiene.

### 2.1 Layout — nuevos

```css
--nav-ancho:            16rem;      /* 256px — sidebar expandida */
--nav-ancho-colapsada:  4.25rem;    /* 68px  — solo íconos */
--topbar-alto:          3.5rem;     /* 56px */
--contenido-max:        66rem;      /* 1056px — columna de contenido, centrada */
--contenido-pad-x:      3rem;       /* 48px */
--prosa-max:            65ch;       /* párrafos explicativos */
```

**Medido:** con la sidebar expandida, el contenido ocupa 1056 px centrados en los 1256 px restantes
del viewport de 1512. Con la sidebar colapsada el contenido se ensancha; **no es un ancho fijo, es un
máximo.**

### 2.2 Alturas de control — nuevos

```css
--alto-control:      2.5rem;    /* 40px — input, botón, ítem de menú */
--alto-control-sm:   2rem;      /* 32px — chip de filtro, botón de tabla */
--alto-fila:         3.5rem;    /* 56px — fila de tabla de dos líneas */
--alto-fila-sm:      2.75rem;   /* 44px — fila de lista de una línea */
--alto-barra-titulo: 2.5rem;    /* 40px — barra de una vista modal */
```

### 2.3 Radios — se agrega un cuarto nivel

`design-system.md` §2.5 define tres radios. Las capturas muestran **cuatro niveles anidados**: las
tarjetas contenedoras grandes usan un radio visiblemente mayor que las internas.

```css
--radius-panel:   1rem;         /* 16px — panel contenedor (NUEVO) */
--radius:         0.75rem;      /* 12px — tarjeta        (existente) */
--radius-control: 0.5rem;       /* 8px  — control        (ver nota) */
--radius-pildora: 980px;        /* píldora               (existente) */
```

> **Nota sobre `--radius-control`.** `design-system.md` lo fija en `0.4375rem` (7 px), heredado del
> manual. En las capturas los controles miden **8 px**. La diferencia es de 1 px y es visualmente
> irrelevante; **se conserva el valor del documento canónico (7 px)** y se registra la discrepancia
> acá para que no vuelva a discutirse. No es una decisión pendiente.

Con cuatro niveles, `V-04` —radio interior siempre menor que el exterior— se cumple en toda la
cadena: `16 → 12 → 8 → píldora`.

### 2.4 Sombras — nuevos

Tres niveles observados, cada uno con su hairline incluida. Nunca hay sombra sin borde.

```css
--sombra-tarjeta:  0 1px 2px rgba(0,0,0,.04), 0 0 0 .5px rgba(0,0,0,.09);
--sombra-flotante: 0 8px 24px -8px rgba(0,0,0,.18), 0 0 0 .5px rgba(0,0,0,.09);
--sombra-ventana:  0 50px 100px -20px rgba(0,0,0,.45), 0 0 0 .5px rgba(0,0,0,.25);
```

`--sombra-tarjeta` para tarjetas en flujo · `--sombra-flotante` para popovers, dock y menús ·
`--sombra-ventana` solo para vistas modales.

**Regla:** sombras largas y muy difusas con opacidad baja. Una sombra corta y dura lee como Material,
no como el lenguaje de estas capturas.

### 2.5 Movimiento

```css
--curva:     cubic-bezier(.34, 1.56, .64, 1);
--duracion:  200ms;   /* rango observado: 180–220ms */
```

Nunca `ease` de 400 ms. Y la pantalla debe funcionar entera con `prefers-reduced-motion`.

---

## 3. Tipografía y escalas

> Los cinco tamaños y la familia **ya están en** [`design-system.md`](design-system.md) §2.6. Acá va
> solo el uso observado, que ese documento no especifica.

### 3.1 Dónde cae cada tamaño

| Token | px | Uso observado |
|---|---|---|
| `--text-meta` | 11 | Header de tabla (mayúsculas, `letter-spacing: .06em`), fecha de notificación, código bajo el nombre |
| `--text-label` | 13 | **El tamaño de trabajo.** Label de campo, ítem de navegación, fila de tabla, párrafo explicativo, ítem de menú |
| `--text-body` | 15 | Valor de un campo, nombre en fila de tabla, título de sección |
| `--text-title-sm` | 19 | Título de tarjeta grande, nombre en encabezado de ficha compacto |
| `--text-title-lg` | 30 | Título de pantalla y nombre de entidad. **Uno solo por pantalla.** |

**El hallazgo de densidad:** el software trabaja mayoritariamente en **13 px**, no en 15. El 15 se
reserva para el dato que importa dentro de la fila. Esto es lo que produce la sensación de densidad
sin apretar nada.

### 3.2 Pesos — tres, no más

`400` cuerpo y valores · `500` labels, ítems de navegación, nombres en tabla · `600` títulos y el
dato destacado de una fila. **No hay `700` en ninguna captura.**

### 3.3 Mayúsculas

Solo en dos sitios: header de columna de tabla y eyebrow de sección (`CONTACTOS`, `COBERTURA`,
`PLAZO DE OPOSICIÓN`). Siempre en 11 px, `letter-spacing: .06em`, ink-3. **Nunca en un botón, nunca
en un título.**

### 3.4 Monoespaciada

Confirma `V-02` y lo hace concreto: los identificadores van en mono **11 px, en ink-3, en una
segunda línea debajo del nombre** —por ejemplo, `ID-SYN-001`—. Nunca el nombre en mono, nunca la
mono en tamaño de cuerpo. Los identificadores observados en los originales no se reproducen.

`font-variant-numeric: tabular-nums` en toda columna numérica comparada entre filas (`V-06`).

---

## 4. Sistema de espaciado

**No existe en `design-system.md`.** Es la laguna más grande que cierran las capturas.

### 4.1 Escala base 4

```css
--esp-1:  0.25rem;   /*  4px */
--esp-2:  0.5rem;    /*  8px */
--esp-3:  0.75rem;   /* 12px */
--esp-4:  1rem;      /* 16px */
--esp-5:  1.25rem;   /* 20px */
--esp-6:  1.5rem;    /* 24px */
--esp-8:  2rem;      /* 32px */
--esp-10: 2.5rem;    /* 40px */
--esp-12: 3rem;      /* 48px */
--esp-16: 4rem;      /* 64px */
```

### 4.2 Dónde cae cada valor

| Relación | Valor | Medido |
|---|---|---|
| Label → su control | `--esp-2` | 8 |
| Control → su nota de regla | `--esp-2` | 8 |
| Campo → campo dentro de un grupo | `--esp-5` | 20 |
| Grupo → grupo dentro de una tarjeta | `--esp-6` | 24 |
| Padding interno de tarjeta | `--esp-6` | 24 |
| Padding interno de panel contenedor | `--esp-8` | 32 |
| Título de pantalla → su párrafo | `--esp-3` | 12 |
| Párrafo → primera tarjeta | `--esp-10` | 40 |
| Tarjeta → tarjeta | `--esp-8` | 32 |
| Sección → sección | `--esp-12` | 48 |
| Padding lateral del contenido | `--esp-12` | 48 |
| Gap horizontal ícono ↔ label | `--esp-3` | 12 |
| Gap en grilla de chips | `--esp-2` | 8 |

### 4.3 La regla que gobierna la escala

**El espacio dentro de un grupo es siempre menor que el espacio entre grupos, en al menos un
salto de la escala.** Es lo único que hace legible un formulario de nueve controles sin una sola
línea divisoria entre ellos. En las capturas, el formulario de búsqueda tiene **cero separadores
internos** y se lee como cinco bloques distintos, por espaciado puro.

---

## 5. Colores y superficies

> La paleta **ya está cerrada** en [`design-system.md`](design-system.md) §2.1–§2.3: tres semánticos
> (`exito`, `urgencia`, `humano`), base acromática, cuatro niveles de tinta. **No se agrega ningún
> color.** Acá va solo la distribución observada.

### 5.1 Los cuatro planos de superficie

| Plano | Valor | Uso |
|---|---|---|
| Fondo de app | `--background` `#f5f5f7` | El lienzo. Nunca lleva contenido directo |
| Chrome | `rgba(250,250,252,.82)` + `blur(24px)` | **Solo** topbar y sidebar |
| Panel / tarjeta | `--card` `#ffffff` | Todo el contenido. **Siempre opaco** |
| Control | `--muted` `#f5f5f7` | Input en reposo, contenedor de segmentado, chip |

**El error número uno**, ya advertido en `design-system.md` §2.8: si el contenido también es
translúcido, el texto pierde contraste y todo se vuelve sopa. El blur va en las barras. Nunca en una
tarjeta.

### 5.2 Presupuesto de color por pantalla

Contado sobre la tabla de listado: **204 filas, 7 columnas, y el color aparece en una sola columna.**

La regla operativa que se desprende:

> En una pantalla, el color semántico ocupa **menos del 2 % del área**. Si ocupa más, dejó de
> significar.

### 5.3 Un cuarto semántico que Achieve no adopta

El software usa **ámbar** para «falta documentación» — una advertencia que no es urgencia ni error.
Achieve tiene **tres** semánticos por `DD6`, con la cuarta ranura deliberadamente vacía, y el manual
es explícito: *"cada color semántico nuevo divide por dos el valor de los anteriores"*.

**Traducción para Achieve:** ese estado se comunica con el chip acromático + palabra, o cae dentro de
`urgencia` si el reloj corre. **No se agrega ámbar.**

---

## 6. Bordes, radios y sombras

### 6.1 Hairlines

`0.5px solid rgba(0,0,0,.09)`, ya en `design-system.md` §2.4. Uso observado:

- **Separador de fila de tabla:** solo abajo. Nunca a los lados, nunca vertical entre columnas.
- **Contorno de tarjeta:** siempre, y siempre acompañando a la sombra.
- **Separador de sección en menú:** ancho completo del popover.
- **Borde de input:** hairline en reposo; en foco, `outline` de 2 px en ink (`design-system.md` §2.7).

**La regla que más aparece:** *nunca una sombra sin su hairline.* La sombra da profundidad, el borde
da el filo. Sin borde la tarjeta se ve borrosa contra el fondo gris.

### 6.2 Dropzone

Único borde punteado del sistema: `1px dashed`, radio de control, 40 px de alto, con las tres vías de
entrada declaradas en una sola línea de texto centrada.

### 6.3 Anidamiento de radios

```
panel 16px
 └ tarjeta 12px
    └ control 7px
       └ chip / píldora 980px
```

Verificable a ojo: una tarjeta de 12 px no puede contener un botón de 12 px (`V-04`).

---

## 7. Patrones de navegación

> **Traducción, no copia.** Achieve tiene 9 superficies encadenadas por un Golden Path, no 7
> destinos independientes. Lo que sigue marca qué se toma y qué se descarta.

### 7.1 Sidebar — se toma la anatomía

| Elemento | Especificación medida |
|---|---|
| Ancho | 256 px expandida · 68 px colapsada |
| Superficie | Chrome translúcido, hairline a la derecha |
| Cabecera | Logo + botón de colapsar (chevron), altura 56 px |
| Ítem | 40 px de alto, radio 7, padding 12 px, ícono 16 px + gap 12 px + label 13 px peso 500 |
| **Activo** | **Superficie blanca sólida + hairline + sombra mínima. Inversión de contraste, nunca color** |
| Hover | `--muted`, sin cambio de peso ni de color de texto |
| Badge | **Uno solo en todo el menú.** Píldora negra, texto blanco 11 px, a la derecha del ítem |
| Pie | Separado por hairline. Preferencia de tema, **fuera del flujo de trabajo** |

**Las dos reglas duras del manual:** máximo siete destinos de primer nivel; **un solo badge numérico
en todo el menú** — el del trabajo pendiente que caduca. Si todo tiene badge, nada tiene badge.

### 7.2 Topbar

56 px, chrome translúcido, hairline abajo. De izquierda a derecha: **breadcrumb** (`Cartera › Titulares`,
segmentos previos en ink-3, actual en ink, separador `›`) · espacio flexible · **buscador global** con
el atajo `⌘K` impreso dentro del campo · **campana** con badge · **selector de contexto** · **avatar**.

El atajo va impreso en el control, no en la documentación: *un atajo escondido no se aprende nunca;
uno visible se aprende por exposición* (`P-07`).

### 7.3 Popovers — dos, con la misma anatomía

Ambos: 320 px de ancho, radio 12, `--sombra-flotante`, anclados al disparador.

**Menú de cuenta:** identidad completa arriba (avatar 32 px + nombre + correo) → hairline → **dos
acciones, cero submenús**. Resuelve *"¿con qué cuenta estoy?"* sin navegar.

**Notificaciones:** header con título 13 px + acción de texto a la derecha → lista → footer «Ver
todas» sobre hairline. Cada ítem: punto de no-leído de 6 px + **el hecho completo en texto**, no una
categoría + fecha absoluta 11 px en ink-3.

> El ítem enuncia el hecho completo con identidad sintética —por ejemplo, *"La evaluación de
> Materia SYN (ID-SYN-001) terminó: revisada"*—, no una categoría genérica como *"Actualización"*.
> Eso es `P-01` dentro de una notificación.

### 7.4 Lo que Achieve descarta de la navegación

| Patrón | Por qué no |
|---|---|
| **Sidebar de 7 destinos** | Achieve no tiene 7 destinos paralelos. Tiene un Golden Path. Ver §10.1 |
| **Dock inferior de fichas** | Requiere multiventana. El manual mismo lo desaconseja fuera de escritorio |
| **Multiventana con barra de título** | Los 6 requisitos innegociables (URL por ficha, trampa de foco, jerarquía de `Escape`, límite duro…) son costo puro para 9 pantallas encadenadas |
| **Selector de contexto de organización** | Un estudiante no cambia de organización |
| **Panel de notificaciones** | **No hay superficie de notificaciones en `UX01`–`UX09`.** El spec Parte II §22.3 prohíbe agregar navegación para ideas sin función. Queda registrado como patrón disponible, no como pantalla |

---

## 8. Patrones de formularios

### 8.1 Orden del formulario

Especificidad decreciente, declarado en el propio manual:

```
qué buscar → cómo → dónde acotar → cuánto tolerar → excepciones
```

**Es el orden en que se toman las decisiones, no el orden de la base de datos.**

### 8.2 Anatomía de un campo

```
Label                        13px · ink-3 · peso 400
[ control ]                  40px de alto · radio 7 · hairline
Regla del negocio            12px · ink-3 · máx. 2 líneas
```

La tercera línea es `P-01` y es **el elemento que más calidad percibida produce por unidad de
esfuerzo**. En las capturas aparece en todos los controles cuyo resultado sorprendería a alguien que
recién llega.

### 8.3 Los seis controles observados

**Segmentado.** Contenedor `--muted` en píldora, opción activa **negra sólida con texto blanco**
(o blanca con sombra, según contexto), 32 px de alto. Para modos excluyentes, 2 a 4 opciones. Las
opciones inaplicables van atenuadas, **no ausentes**.

**Campo de texto.** 40 px, hairline, placeholder con **ejemplo real** — `ej. PAMPA LIBRE o un nº de
acta` — nunca *"Ingresá un valor"* (`C-03`). Acción primaria como píldora adosada a la derecha.

**Dropzone.** 40 px, `1px dashed`, ícono + las tres vías declaradas en una línea: *"Arrastrá una
imagen acá, pegala (Ctrl+V) o hacé clic para elegir un archivo"*.

**Filtro facetado.** El label lleva la regla incorporada: `Clases de Niza · sin filtro = todas las
clases`. A la derecha, tres acciones de conjunto en texto con ícono: `Todas · Ninguna · Invertir`.
Debajo, buscador propio y grilla de chips de 32 × 32, radio 7, gap 8.

> **Esa media línea de label mata de raíz** el error de *"no seleccioné nada, entonces no busca
> nada"*. Es el ejemplo más económico de `P-01` en todo el set.

**Umbral con escala de juicio.** Slider + valor a la derecha en peso 600 (`desde 30%`) + **cuatro
anclas cualitativas** debajo (`Todo · Débil · Fuerte · Muy fuerte`, la activa resaltada) + frase de
consecuencia (*"Oculta los resultados con menos de 30% de puntaje del motor"*).

Cuatro anclas, no cinco: *si son muchas, el usuario se imanta a ellas y perdés resolución real*
(`P-03`).

**Interruptor.** Fila completa dentro de caja con hairline: label a la izquierda, toggle a la
derecha, 40 px de alto. **El default toma partido profesional** (`P-04`): lo vencido apagado, lo
relacionado encendido. Y el default activo **debe verse también en la pantalla de resultados** — un
resultado filtrado sin indicación del filtro es un bug de confianza.

### 8.4 Composición de bloque

Dos columnas cuando los controles son independientes entre sí: el umbral a la izquierda, los
interruptores a la derecha. Nunca cuando hay dependencia lógica.

Y —§1.5— cuando un modo deja un bloque inaplicable, **el bloque se atenúa entero y no se mueve nada
a su alrededor.**

---

## 9. Estados de carga, vacío, error y éxito

### 9.1 Carga — esqueleto isomorfo

**Derivado del mismo layout que el componente real**, nunca dibujado aparte: si se dibuja aparte, se
desincroniza en el primer cambio.

El esqueleto observado reproduce la geometría exacta de la tarjeta destino: dos miniaturas, tres
líneas, tres acciones, un chip de estado. **La cabecera y el párrafo explicativo se renderizan reales
desde el primer frame** — el usuario ya puede leer la regla del flujo mientras carga.

Especificación: bloques en `--muted`, radio del elemento que reemplazan, **sin animación de shimmer**
o con `prefers-reduced-motion` respetado. Alturas variables: o el esqueleto miente, o las tarjetas
truncan a alto fijo. **Las dos son válidas; la que no vale es no haberlo decidido.**

Test: grabar la carga en cámara lenta. **Si algo salta de posición, el esqueleto está mal.**

### 9.2 Vacío — dos niveles distintos

**Vacío de pantalla.** Dentro de la tarjeta que contendrá el resultado, centrado, ~200 px de alto:
ícono lineal 24 px en ink-4 → título 15 px peso 600 → párrafo 13 px en ink-3, dos líneas, máx. 380 px.

> *"Todavía no buscaste nada"* / *"Escribí una marca arriba y presioná Buscar. Podés filtrar por
> clase con la grilla o dejarla vacía para buscar en todas las clases."*

El párrafo **repite la instrucción operativa**, no da la bienvenida.

**Vacío de sección.** Alineado a la izquierda, sin ícono, en el flujo: párrafo de 13 px que dice
**por qué importa el dato que falta** (§1.4).

**Los cuatro vacíos que Achieve necesita distinguir** (`P-09`) — sin captura de referencia para los
cuatro, se especifican por extensión de §1.6:

| Estado | Tratamiento propuesto |
|---|---|
| Vacío | Bloque centrado con ícono + título + instrucción |
| No cargado | Esqueleto isomorfo |
| Sin asignar | *Itálica* en ink-3, en el lugar del valor |
| Cero real | El número `0`, en peso normal, tabular |

**«No evaluado» nunca se ve como `0`.** Es la trampa que `design-system.md` §7 marca como
verificable.

### 9.3 Error — laguna declarada

> ⚠️ **Ninguna de las 34 capturas muestra un estado de error.** Ni de campo, ni de carga, ni de red.

**No lo invento.** Lo que sí se deriva del sistema, sin inventar nada:

- El error de campo hereda la anatomía de la nota de regla (§8.2): tercera línea bajo el control, 12
  px — cambiando ink-3 por `--urgencia-texto` **y agregando un ícono**, porque `P-06` prohíbe
  comunicar estado solo por color.
- El error nunca reemplaza al contenido: se apila arriba, dentro de la tarjeta afectada (`I-05`: el
  bloqueante va arriba de todo).
- El error dice **qué se rompió y qué hacer**, en la persona del producto (voseo, `C-01`), sin
  emitir veredicto (`C-06`).

**Esto es una propuesta, no una extracción.** Ver §12.5.

### 9.4 Éxito — acuse persistente, nunca toast

Observado en el cierre del asistente:

```
[ ✓ Reporte enviado ]      chip verde, borde, ícono + palabra
¿Necesitás algo más?       reapertura explícita, sin obligar a empezar de nuevo
```

Tres propiedades:

1. **Persiste en pantalla.** No es un toast que desaparece. Es el eslabón que casi todos los flujos
   de feedback se saltean.
2. **Ícono + palabra.** Nunca solo el verde.
3. **Deja el canal abierto** sin forzar a reiniciar.

**Y una sola confirmación por decisión.** El propio software falla acá y el manual lo marca como
`A-02`: un widget pide la decisión con botones y el bot la vuelve a pedir en texto. **Cuando un
widget pide una decisión, todo lo demás se calla.**

### 9.5 Lo que le falta al acuse del original

El manual lo señala y aplica igual a Achieve: **el acuse necesita referencia de seguimiento.** Un
acuse sin identificador es un buzón sin acuse real — el usuario deja de reportar cuando nota que sus
reportes no vuelven.

---

## 10. Mapeo entre patrones observados y pantallas de Achieve

### 10.1 La traducción estructural

| Referencia | Achieve |
|---|---|
| 7 destinos paralelos en sidebar | **9 superficies encadenadas** por el Golden Path (`UX01`→`UX09`) |
| Un registro por destino | **Una decisión por pantalla** (`DD9`) |
| Cola `N de M` en pantalla de decisión | Cola paginable **solo en la lista de materias** de `UX01`, resuelto en `design-system.md` §1.4 |
| Dos objetos comparados en espejo | **No aplica.** Achieve nunca compara dos objetos |
| Dock + multiventana | **No aplica.** Ver §7.4 |

### 10.2 Patrón → superficie

| Patrón observado | Superficie | Cómo se aplica |
|---|---|---|
| **Título + párrafo de regla** (§1.1) | `UX01`–`UX09`, todas | Ya existe como `ReglaDeNegocio`. Se agrega el nivel de pantalla |
| **Sección con contador + párrafo** (§1.1) | `UX02`, `UX06`, `UX08` | *"Compromisos ⟨3⟩"* + qué contiene la sección |
| **Partición sin fusión** (`Del estudio 37 / No son del estudio …`) | **`UX02`** | **Directo a *"Cátedra y vos"***: dos fuentes contadas por separado, jamás sumadas (`P-08`) |
| **Ausencia en tres tratamientos** (§1.6) | `UX02`, `UX06`, `UX08` | Especifica la primitiva `Ausencia`, pendiente en §3.2 |
| **Esqueleto isomorfo** (§9.1) | Todas | Especifica la primitiva `Esqueleto`, pendiente en §3.2 |
| **Anatomía de campo con regla** (§8.2) | `UX04`, `UX05` | Compromiso y Evidencia son los dos formularios reales del producto |
| **Interruptor con default profesional** (§8.3) | `UX04`, `UX07` | ⚠️ Los defaults de Achieve son `HUMAN-P0` provisionales ([ADR-007](decisions.md#adr-007)) |
| **Segmentado con opciones atenuadas** (§8.3) | `UX05`, `UX07` | Método de evidencia / tipo de examen, con lo inaplicable visible y atenuado |
| **Umbral con escala de juicio** (§8.3) | **Ninguna** | `DD5`: Achieve no muestra magnitudes de máquina. Se documenta, no se usa |
| **Encabezado de entidad** (§10.3) | `UX02`, `UX08` | Materia y Examen son las dos entidades con ficha propia |
| **Tabla densa** (§10.4) | `UX06` | Bitácora. Es la única superficie tabular de Achieve |
| **Acuse persistente + reapertura** (§9.4) | `UX04`, `UX05` | Confirmar Compromiso y enviar Evidencia. `P-11` |
| **Atajo impreso en el control** (§7.2) | Todas | `P-07` |
| **Notificaciones** (§7.3) | **Ninguna** | Sin superficie asignada. No se construye |

### 10.3 Encabezado de entidad — especificación

Para `UX02` (Materia) y `UX08` (Modo Examen):

```
[ícono 44px]  NOMBRE DE LA ENTIDAD              [acción sec.]  [acción sec.]
              #código-mono · responsable
              ⟨ícono⟩ N unidades   ⟨ícono⟩ N compromisos
```

Nombre en 30 px. Primera línea meta con identificador en **mono 11 px**. Segunda línea con contadores
—**ícono + número + sustantivo**, nunca el número solo. Acciones secundarias a la derecha, en
píldora con hairline. **Ninguna es la CTA principal** (`I-06`: una sola por pantalla, y en `UX02`
vive en el Hero).

### 10.4 Tabla densa — especificación para `UX06` (Bitácora)

| Elemento | Especificación |
|---|---|
| Header | 11 px, mayúsculas, `letter-spacing: .06em`, ink-3, 32 px de alto |
| Fila | 56 px, hairline abajo. **Sin zebra, sin bordes verticales** |
| Celda principal | Nombre 15 px peso 500 + identificador mono 11 px ink-3 en segunda línea |
| Ausencia | Los tres tratamientos de §1.6 |
| Estado | Ícono + palabra. **El color va en el ícono, el texto queda en ink** |
| Numérico | Derecha, `tabular-nums` |
| Hover | Subrayado en el nombre + chevron a la derecha. **Nunca el único indicador de que la fila es navegable** |
| Cabecera de tabla | Botón `Filtros` + buscador a la izquierda · **contador de resultados a la derecha** (`204 titulares`) |

El contador de resultados no es decorativo: es el «resumen agregado arriba de la lista, no solo el
orden» que pide el checklist del manual.

---

## 11. Elementos que no deben copiarse

### 11.1 Del dominio y la marca

**Nada del software de referencia cruza a Achieve:** ni el dominio de propiedad intelectual (marcas,
actas, clases de Niza, INPI, titulares, expedientes, oposiciones), ni el nombre, ni el logotipo, ni
la arquitectura de información, ni los nombres de sus destinos, ni su copy literal.

Lo que cruza es el **lenguaje visual** y los **patrones estructurales**. El manual lo dice de sí
mismo: *"si algo huele a su industria, es un error del documento"*.

### 11.2 Los nueve anti-patrones — visibles en las capturas

Ya están en [`design-system.md`](design-system.md) §8. Acá va **dónde se ven**, que es lo que hace
falta para reconocerlos:

| ID | Dónde se ve en las capturas |
|---|---|
| `A-01` | El texto de cobertura llega de la fuente externa **con las palabras concatenadas**, ilegible, en la pantalla donde se toma la decisión más cara |
| `A-02` | El asistente pide la confirmación con botones y **la vuelve a pedir en texto**. El usuario terminó confirmando por teclado |
| `A-03` | Al colapsar la sidebar, el badge **`17` se degrada a un punto**. El modo compacto reduce tamaño, nunca cantidad de información |
| `A-04` | El mismo flujo se nombra de cuatro maneras según dónde estés |
| `A-05` | Todo el producto vosea **menos una etiqueta en la pantalla más importante** |
| `A-06` | El objeto externo rotulado **«LA AMENAZA»** — el sistema enuncia la conclusión antes de que el usuario la saque, y esa palabra queda escrita si la pantalla se comparte |
| `A-07` | El dock **ya trunca títulos con dos elementos abiertos** |
| `A-08` | Deshabilitado sin tratamiento propio, indistinguible del secundario |
| `A-09` | **`Secured by Clerk`** al pie del menú de cuenta: lenguaje visual ajeno en el único lugar donde el usuario administra su identidad |

### 11.3 Lo que no se copia aunque esté bien hecho

| Elemento | Por qué no en Achieve |
|---|---|
| **Dock + multiventana** | Seis requisitos innegociables de costo alto, para un producto de 9 pantallas encadenadas |
| **Sidebar de 7 destinos** | Achieve no tiene 7 destinos. Imponerla obligaría a inventar navegación (spec Parte II §22.3) |
| **Cuarto color semántico (ámbar)** | `DD6`: tres, con la cuarta ranura vacía a propósito |
| **Umbral con score visible** | `DD5`: el spec prohíbe magnitudes de máquina visibles |
| **Comparación en espejo** | Achieve nunca compara dos objetos. Su unidad es **una Action** (`DD9`) |
| **Selector de organización** | No hay multi-organización en el Track A |
| **Panel de notificaciones** | Sin superficie asignada |
| **Semáforo decorativo** | Tres puntos de color que no cierran nada es cosplay de escritorio |

### 11.4 Y la advertencia de fondo

> **La estética minimalista es replicable en un producto malo.** Lo que no se puede fingir es haber
> entendido el trabajo antes de dibujarlo.

Copiar la densidad, los hairlines y el gris **sin** las respuestas `DD1`–`DD10` produce cargo cult:
pantallas que se parecen al original y no resuelven nada. Achieve tiene las diez respuestas escritas
([`domain-translation-dd1-dd10.md`](domain-translation-dd1-dd10.md)) — por eso puede tomar prestado
el lenguaje sin quedar vacío.

---

## 11.9 El shell de aplicación — lo que Achieve todavía no tiene

Registrado el 30 de agosto de 2026 por [ADR-018](decisions.md#adr-018). **Este documento es el único
artefacto del lenguaje visual que viaja**: las capturas no se versionan
([ADR-006](decisions.md#adr-006)), así que un patrón que no esté descrito acá, para cualquier máquina
que no sea la del owner, **no existe**.

### 11.9.1 Navegación lateral

- Persistente a la izquierda, **colapsable** con un control en la cabecera.
- Ítems con **ícono + etiqueta**, agrupados sin separadores visibles.
- El **ítem activo** es una píldora de superficie clara con sombra suave — no un fondo de color ni
  una barra lateral.
- **Contadores** a la derecha del ítem, en píldora oscura con número en blanco. Sólo donde el número
  cambia una decisión.
- Al pie: el conmutador de tema.

### 11.9.2 Topbar

- **Breadcrumb** a la izquierda, con el camino completo y el objeto actual al final.
- **Buscador** centrado, con el atajo visible dentro del control.
- **Notificaciones** con contador, y **selector de cuenta** con avatar a la derecha.
- La topbar **no lleva la CTA primaria de la pantalla**: lleva navegación y contexto.

### 11.9.3 Acciones secundarias del objeto

Arriba a la derecha del título, en **píldora de borde fino con ancho de contenido**. Son
**navegación** —abrir en otro lado, ver en otro contexto—, nunca la decisión principal.

> Esto **no contradice** [ADR-015](decisions.md#adr-015). Aquél decidió dónde va la **CTA primaria**
> —a ancho completo, al final de la columna principal— y sigue vigente. Las píldoras de arriba a la
> derecha son secundarias.

### 11.9.4 Densidad de panel

- Tarjeta blanca, radio generoso, hairline.
- **Título + subcopy explicativa** debajo: la subcopy dice **qué es esto y por qué importa**, en
  lenguaje llano. Es `P-01` aplicado al panel entero.
- Contenido en dos columnas cuando hay una lista y un detalle.

### 11.9.5 Controles segmentados

Grupo de píldoras para alternar vistas del mismo objeto. El activo es superficie clara con sombra;
los inactivos, texto atenuado. **Alternar no muta nada.**

### 11.9.6 Vacíos que explican

El vacío **no dice que no hay dato**: dice **qué va a aparecer ahí y por qué importa**. Es la
elevación de `C-04` que §12.2 dejó como propuesta, y las capturas la usan de forma consistente.

### 11.9.7 Dock inferior

Barra persistente con lo que quedó abierto, cada ítem con su identificador y un cierre. Sobrevive a
la navegación entre superficies.

---

## 12. Decisiones que necesitan interpretación propia

Cada una es **candidata a ADR**. Ninguna se resuelve en este documento
([`AGENTS.md`](../AGENTS.md): *no inventes reglas; registralas como `PENDING` y preguntá*).

### 12.1 Desktop-first vs. mobile-first — ✅ `RESUELTO` por [ADR-014](decisions.md#adr-014)

**Resuelto el 29 de agosto de 2026.** Achieve es **desktop-first**. El contrato del primer viewport de
`design-system.md` §6.1 —los siete elementos, su orden y lo prohibido entre el estado y la CTA— **no
cambió**: dejó de estar atado a 360 px y pasó a ser un contrato de **orden semántico**, obligatorio en
todo ancho. Se verifica en **desktop** (viewport primario, donde corre el test de 10 segundos) y a
**360 px** (piso obligatorio de la variante móvil).

`AGENTS.md` §5, `CLAUDE.md`, `architecture.md` §2.1/§2.6, `design-system.md` §6.1/§6.2 y `roadmap.md`
se corrigieron en el mismo commit. Este documento, escrito desktop-first, **ya no contradice a
ninguno**.

### 12.2 ¿Se eleva `C-04`? — `PENDING`

**A favor:** el vacío que dice *por qué importa el dato* (§1.4) es medible como mejor. Es `P-01`
aplicado a la ausencia.

**En contra:** multiplica la deuda de contenido que `C-07` ya declara. Cada vacío pasa de una frase a
dos, y las dos mienten si cambia la regla.

**Qué decidir:** si `C-04` pasa a *"el vacío explica qué va a aparecer **y por qué importa**"*, o si
queda como está y esto es solo una recomendación.

### 12.3 Escala de espaciado — propuesta, no observación pura

§4 es **una escala inferida** de medidas con ±2 px de error. Los valores caen limpio en base 4, lo
que sugiere que el original la usa, pero **no está confirmado**.

**Qué decidir:** adoptar §4.1 como canónica y moverla a `design-system.md` §2, o tratarla como
provisional hasta la primera pantalla implementada.

### 12.4 Modo oscuro — sin decidir, y el checklist lo exige

El checklist del manual incluye *"Modo oscuro: los colores semánticos siguen funcionando"*, y el
software tiene toggle de tema. **`design-system.md` no define paleta oscura.**

**El problema real:** los tres semánticos están medidos para contraste **sobre superficie clara**.
`--exito-texto` `#23883c` da 4.51:1 sobre card blanco; sobre una superficie oscura **falla**. Un modo
oscuro exige una segunda tabla de contrastes medida, no estimada.

**Qué decidir:** si el Track A tiene modo oscuro. Si no lo tiene, ese ítem del checklist se marca
`N/A` con justificación escrita, no se deja en blanco.

### 12.5 Estados de error — no hay fuente

§9.3 es la única sección **derivada del sistema, no extraída de una captura**. Ninguna de las 34
imágenes muestra un error.

**Qué decidir:** aprobar §9.3 como especificación propia de Achieve, o dejar los estados de error
abiertos hasta tener referencia. El Track A los necesita: `UX05` (Evidencia) tiene siete estados y
varios son de falla.

### 12.6 Densidad de `UX06` — `PENDING`

La tabla de referencia muestra **7 columnas y 204 filas** para un usuario experto que la mira ocho
horas por día. La Bitácora de Achieve la mira un estudiante, ocasionalmente.

**Qué decidir:** si `UX06` es una tabla o una lista de tarjetas. §10.4 especifica la tabla; la
decisión de usarla no está tomada.

### 12.7 Dónde vive la CTA principal en desktop — ✅ `RESUELTO` por [ADR-015](decisions.md#adr-015)

**Resuelto el 29 de agosto de 2026.** La CTA principal va **a ancho completo al final de la columna
principal**, en el layout de dos columnas de `design-system.md` §6.2. La píldora negra arriba a la
derecha **se descartó**.

**Esta sección estaba mal planteada.** Preguntaba razonando desde las capturas, que son de **otro
producto**. La spec de Achieve tiene wireframes desktop propios y normativos: `VI.7` §21.2 y §24.1
ya contestaban, y [`AGENTS.md`](../AGENTS.md) §8 pone `product-spec-source.md` por encima de este
documento.

**Regla general que dejó ADR-015:** cuando este documento y una spec `VI.*` describan lo mismo,
**manda la spec**. Lo de acá es vocabulario visual, no contrato de layout.

---

## 13. Qué le agrega este documento a `design-system.md`

Registro de reconciliación, para cuando se sincronicen los documentos.

| Sección de acá | Efecto sobre `design-system.md` |
|---|---|
| §2.1–§2.5 | **Agrega** tokens de layout, altura, sombra y movimiento. No modifica ninguno |
| §2.3 | **Agrega** `--radius-panel` (16 px) como cuarto nivel. Registra la discrepancia de 1 px en `--radius-control` como cerrada a favor del canónico |
| §4 | **Agrega** la escala de espaciado, hoy inexistente. Sujeto a §12.3 |
| §9.1 | **Especifica** la primitiva `Esqueleto`, declarada faltante en §3.2 |
| §9.2 / §1.6 | **Especifica** la primitiva `Ausencia`, declarada faltante en §3.2 |
| §10.2 | **Especifica** la primitiva `Provenance` vía el patrón de partición sin fusión |
| §1.4 | **Propone** modificar `C-04`. Sujeto a §12.2 |
| §5.3 | **Confirma** los tres semánticos. Rechaza explícitamente el cuarto color del original |
| §11.2 | **Ancla** los nueve anti-patrones a evidencia visual concreta |
| §12.1 | ✅ **Conflicto cerrado** por [ADR-014](decisions.md#adr-014): §6.1 se reencuadró como contrato de orden semántico y §6.2 pasó a primaria |
| §12.7 | ✅ **Cerrado** por [ADR-015](decisions.md#adr-015) con los wireframes desktop de `VI.7` §24: CTA a ancho completo al final de la columna principal |
| §12.4 | ⚠️ **Abre laguna**: modo oscuro sin paleta ni contrastes medidos |

**Ninguna de estas modificaciones se aplica** hasta que los ADR de §12 estén resueltos, **salvo §12.1,
que ya se aplicó** por [ADR-014](decisions.md#adr-014) el 29 de agosto de 2026. Para el resto este
documento las registra; no las ejecuta.
