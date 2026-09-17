/**
 * El marco del panel — [ADR-088](../../docs/decisions.md#adr-088), Enmienda 2.
 *
 * Dónde está y cuánto mide la ventana interna de un objeto: se arrastra, se
 * redimensiona, se expande y **vuelve al mismo lugar** cuando se la minimiza y
 * se la abre de nuevo.
 *
 * ## ⚠️ Se llama «marco» y no «ventana», y no es un capricho
 *
 * `Ventana` ya está tomada **dos veces** en este dominio: la ventana de
 * preparación de [ADR-078](../../docs/decisions.md#adr-078) —días de calendario
 * hasta la evaluación— y `VentanaDeExamen`. Llamar «ventana» a un rectángulo de
 * la pantalla haría que *"la ventana de Álgebra es corta"* tuviera dos
 * significados incompatibles: es exactamente el anti-patrón `A-04`, deriva de
 * vocabulario (`AGENTS.md` §4).
 *
 * ## Por qué es puro
 *
 * Toda la aritmética vive acá, sin React y sin DOM: arrastrar, topar contra los
 * bordes, respetar el mínimo y expandir son reglas, y probarlas con un mouse de
 * mentira sería probar el doble. El componente sólo traduce eventos a deltas.
 */

export interface Marco {
  x: number;
  y: number;
  ancho: number;
  alto: number;
  expandido: boolean;
  /**
   * En qué mitad o cuarto de la pantalla está encajada — Enmienda 6.
   *
   * `null` ⇒ la ventana es libre: está donde el estudiante la dejó. Un valor
   * quiere decir que **la calcula el área**, no la memoria: cambiar el tamaño
   * del navegador la vuelve a repartir sola, que es lo que un mosaico tiene que
   * hacer para seguir siendo un mosaico.
   *
   * ⚠️ **Nunca conviven con `expandido`.** Pantalla completa es *el área
   * entera*, y una zona es *una parte del área*: las dos a la vez no quieren
   * decir nada, y el par se mantiene excluyente en `amosaicar` y en
   * `alternarExpandido`, que son los dos únicos que lo escriben.
   */
  zona: Zona | null;
  /**
   * A dónde vuelve al restaurar. `null` ⇒ no está expandido **ni en mosaico**.
   *
   * ⚠️ **Se guarda al expandir, no se recalcula al restaurar.** Volver a un
   * tamaño «por defecto» perdería el que el estudiante eligió, que es
   * precisamente lo que un manejo de ventanas existe para conservar.
   */
  previo: { x: number; y: number; ancho: number; alto: number } | null;
}

/**
 * Las zonas del mosaico — Enmienda 6.
 *
 * ⚠️ **Se toma el mecanismo, no la marca** (`AGENTS.md` §1.5). El gesto —
 * mantener apretado el control de expandir y elegir a qué mitad va la ventana —
 * es el de un escritorio conocido; los nombres son los de acá y en castellano,
 * y las medidas salen del área utilizable de Achieve, que ya reserva la barra
 * de objetos al pie.
 *
 * Cuatro mitades y cuatro cuartos. **No hay tercios**: con `MARCO_MINIMO.ancho`
 * en 380 px, un tercio de una pantalla de 1280 px queda en 405 px y el contenido
 * de `UX02` deja de ser legible en cuanto alguien colapsa menos de eso. Una zona
 * que no se puede usar es peor que una zona que no existe.
 */
export type Zona =
  | "izquierda"
  | "derecha"
  | "arriba"
  | "abajo"
  | "sup-izq"
  | "sup-der"
  | "inf-izq"
  | "inf-der";

export const ZONAS: readonly Zona[] = [
  "izquierda",
  "derecha",
  "arriba",
  "abajo",
  "sup-izq",
  "sup-der",
  "inf-izq",
  "inf-der",
] as const;

/** `true` si el valor es una zona conocida. Lo usa la validación de la memoria. */
export function esZona(valor: unknown): valor is Zona {
  return typeof valor === "string" && (ZONAS as readonly string[]).includes(valor);
}

/** El rectángulo donde el panel puede vivir. */
export interface Area {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * El mínimo. Por debajo de esto el contenido de `UX02` deja de ser legible, y
 * una ventana que se puede achicar hasta no servir es una forma de romperla.
 */
export const MARCO_MINIMO = { ancho: 380, alto: 260 } as const;

const MARGEN_SUPERIOR = 16;

/**
 * ⚠️ **Lo que se reserva para que la barra siga a la vista y clickeable.**
 *
 * El panel es *de* una ficha; si la tapara, se perdería de dónde salió — y con
 * ella el gesto de pasar de un objeto a otro sin cerrar la ventana.
 */
const MARGEN_INFERIOR = 96;

const MARGEN_LATERAL = 16;

/** El área utilizable, dado el tamaño de la ventana del navegador. */
export function areaDe(viewport: { ancho: number; alto: number }): Area {
  return {
    x: MARGEN_LATERAL,
    y: MARGEN_SUPERIOR,
    ancho: Math.max(MARCO_MINIMO.ancho, viewport.ancho - MARGEN_LATERAL * 2),
    alto: Math.max(MARCO_MINIMO.alto, viewport.alto - MARGEN_SUPERIOR - MARGEN_INFERIOR),
  };
}

/**
 * Cuánto mide una ventana que nunca se abrió.
 *
 * ⚠️ **Se achicó con la Enmienda 3, y se midió en el navegador.** Con
 * `1080 × 760` en un área de `1408 × 788`, la segunda ventana tapaba el 96 % de
 * la primera: tres ventanas se veían **como una**, que es exactamente lo que la
 * Enmienda 3 vino a arreglar. El tamaño por defecto de un escritorio con varias
 * ventanas no puede ser casi la pantalla entera.
 *
 * Sigue siendo cómodo para leer `UX02` —el Gantt por tema entra sin comprimirse—
 * y el que quiera la materia entera tiene *«Ver como página»*.
 */
const MARCO_INICIAL = { ancho: 940, alto: 660 } as const;

/**
 * Cuánto se corre cada ventana nueva respecto de la anterior.
 *
 * ⚠️ **Tiene que alcanzar para agarrar la de abajo.** El corrimiento no es
 * decoración: es lo que deja asomando un pedazo de barra de título de la ventana
 * anterior, y sin barra de título no hay de dónde arrastrarla.
 */
const CASCADA = 32;

/**
 * Dónde nace una ventana que nunca se abrió.
 *
 * **En cascada**, como cualquier manejo de ventanas: la segunda no nace encima
 * de la primera. El corrimiento cicla cada cinco para que abrir muchas no las
 * mande fuera de cuadro.
 */
export function marcoInicial(area: Area, indice: number): Marco {
  const corrimiento = (indice % 5) * CASCADA;
  const ancho = Math.min(MARCO_INICIAL.ancho, area.ancho);
  const alto = Math.min(MARCO_INICIAL.alto, area.alto);
  return encuadrar(
    {
      x: area.x + corrimiento,
      y: area.y + corrimiento,
      ancho,
      alto,
      expandido: false,
      zona: null,
      previo: null,
    },
    area,
  );
}

/**
 * Mete el marco adentro del área, respetando el mínimo.
 *
 * ⚠️ **Se aplica siempre que el área cambia**, no sólo al crear. Un marco
 * guardado en un monitor grande y restaurado en una laptop nacería medio fuera
 * de la pantalla —con su barra de título inalcanzable— y no habría forma de
 * recuperarlo. Es el caso que rompe un manejo de ventanas casero.
 */
export function encuadrar(marco: Marco, area: Area): Marco {
  if (marco.expandido) return { ...marco, ...expandidoEn(area) };

  /*
    ⚠️ **La zona se recalcula, no se restaura** — Enmienda 6. Una ventana
    amosaicada a la izquierda tiene que seguir siendo *la mitad izquierda* de la
    pantalla de ahora, no las 704 px que medía esa mitad en el monitor de ayer.
    Es la diferencia entre un mosaico y dos ventanas que casualmente empezaron
    partidas al medio.

    El `Math.max` contra el mínimo sigue corriendo debajo: si el cuarto queda más
    angosto que 380 px, gana el mínimo y la ventana se sale un poco de su cuarto
    —ilegible es peor que desprolijo—.
  */
  const encajado = marco.zona === null ? marco : { ...marco, ...rectanguloDeZona(area, marco.zona) };

  const ancho = Math.min(Math.max(encajado.ancho, MARCO_MINIMO.ancho), area.ancho);
  const alto = Math.min(Math.max(encajado.alto, MARCO_MINIMO.alto), area.alto);
  const x = Math.min(Math.max(encajado.x, area.x), area.x + area.ancho - ancho);
  const y = Math.min(Math.max(encajado.y, area.y), area.y + area.alto - alto);
  return { ...encajado, x, y, ancho, alto };
}

function expandidoEn(area: Area) {
  return { x: area.x, y: area.y, ancho: area.ancho, alto: area.alto };
}

/**
 * El rectángulo de una zona, dentro del área — Enmienda 6.
 *
 * ⚠️ **Se reparte el área, no el viewport.** El área ya descuenta los 96 px que
 * la barra de objetos necesita al pie: repartir la pantalla entera dejaría la
 * mitad inferior por debajo de la barra, y las dos ventanas de abajo del mosaico
 * de cuartos nacerían con su barra de título tapada.
 *
 * ⚠️ **No hay separación entre las dos mitades, y es a propósito.** Cada ventana
 * tiene su borde de medio píxel y su sombra; un canal de 8 px entre las dos
 * sumaría una tercera línea vertical que no separa nada que no esté ya separado.
 */
export function rectanguloDeZona(area: Area, zona: Zona): Rect {
  const medioAncho = area.ancho / 2;
  const medioAlto = area.alto / 2;
  const derecha = area.x + medioAncho;
  const abajo = area.y + medioAlto;

  switch (zona) {
    case "izquierda":
      return { x: area.x, y: area.y, ancho: medioAncho, alto: area.alto };
    case "derecha":
      return { x: derecha, y: area.y, ancho: medioAncho, alto: area.alto };
    case "arriba":
      return { x: area.x, y: area.y, ancho: area.ancho, alto: medioAlto };
    case "abajo":
      return { x: area.x, y: abajo, ancho: area.ancho, alto: medioAlto };
    case "sup-izq":
      return { x: area.x, y: area.y, ancho: medioAncho, alto: medioAlto };
    case "sup-der":
      return { x: derecha, y: area.y, ancho: medioAncho, alto: medioAlto };
    case "inf-izq":
      return { x: area.x, y: abajo, ancho: medioAncho, alto: medioAlto };
    case "inf-der":
      return { x: derecha, y: abajo, ancho: medioAncho, alto: medioAlto };
  }
}

/**
 * Manda la ventana a una zona, o **la saca si ya estaba en ésa**.
 *
 * ⚠️ **El `previo` que se guarda es el de la ventana libre, no el de la zona
 * anterior.** Pasar de la mitad izquierda a la derecha y después restaurar tiene
 * que devolver la ventana al tamaño que el estudiante eligió a mano, no a media
 * pantalla: media pantalla es un lugar donde la puso el mosaico, no un tamaño
 * que ella haya tenido nunca.
 *
 * ⚠️ **Una zona puede quedar por debajo del mínimo, y no se fuerza.** Un cuarto
 * de una pantalla de 1024 px mide 496 × 346, que entra; uno de 720 px mide 344 y
 * **no**. `encuadrar` sube ese ancho a 380 px y la ventana se sale un poco de su
 * cuarto: es mejor que dibujar un contenido ilegible adentro de un rectángulo
 * prolijo. Quien decide si la zona se ofrece es la pantalla, que sabe cuánto
 * mide.
 */
export function amosaicar(marco: Marco, zona: Zona, area: Area): Marco {
  if (marco.zona === zona) return alternarExpandido(marco, area);

  const previo =
    marco.expandido || marco.zona !== null
      ? marco.previo
      : { x: marco.x, y: marco.y, ancho: marco.ancho, alto: marco.alto };

  return encuadrar(
    { ...rectanguloDeZona(area, zona), expandido: false, zona, previo },
    area,
  );
}

/**
 * Saca la ventana del mosaico dejándola donde está.
 *
 * Es lo que pasa al arrastrarla o estirarla: en cuanto la mano la mueve deja de
 * ser *"la mitad izquierda"* y pasa a ser *"donde la puse"*. Sin esto, mover una
 * ventana amosaicada la haría volver sola a su zona en el próximo `encuadrar`
 * —el siguiente `resize` de la ventana del navegador— y se vería como que el
 * arrastre no tomó.
 */
function liberar(marco: Marco): Marco {
  return marco.zona === null ? marco : { ...marco, zona: null, previo: null };
}

/**
 * Arrastrar.
 *
 * ⚠️ **Una ventana expandida no se mueve**, igual que en un escritorio real:
 * ocupa todo, así que no hay a dónde llevarla. Arrastrarla la dejaría a medio
 * camino entre expandida y no.
 */
export function mover(marco: Marco, dx: number, dy: number, area: Area): Marco {
  if (marco.expandido) return marco;
  // ⚠️ **Arrastrarla la saca del mosaico** — Enmienda 6. En cuanto la mano la
  // mueve deja de ser «la mitad izquierda» y pasa a ser «donde la puse».
  const libre = liberar(marco);
  return encuadrar({ ...libre, x: libre.x + dx, y: libre.y + dy }, area);
}

/** Los ocho agarres, en el vocabulario de los puntos cardinales. */
export type Borde = "n" | "s" | "e" | "o" | "ne" | "no" | "se" | "so";

/**
 * Redimensionar desde un borde o una esquina.
 *
 * ⚠️ **Tirar del borde izquierdo o superior mueve el origen**, no sólo el
 * tamaño: si sólo cambiara el ancho, arrastrar hacia la izquierda agrandaría la
 * ventana hacia la derecha, que es lo contrario de lo que hace la mano.
 *
 * Y al topar contra el mínimo **el origen se queda quieto**. Sin eso, seguir
 * tirando después del mínimo empuja la ventana por la pantalla.
 */
export function redimensionar(marco: Marco, borde: Borde, dx: number, dy: number, area: Area): Marco {
  if (marco.expandido) return marco;

  // Estirarla también la saca del mosaico, por el mismo motivo que arrastrarla.
  const base = liberar(marco);
  let { x, y, ancho, alto } = base;

  if (borde.includes("e")) ancho = base.ancho + dx;
  if (borde.includes("o")) {
    ancho = base.ancho - dx;
    // El mínimo topa el origen, no lo empuja.
    const efectivo = Math.max(ancho, MARCO_MINIMO.ancho);
    x = base.x + (base.ancho - efectivo);
  }
  if (borde.includes("s")) alto = base.alto + dy;
  if (borde.includes("n")) {
    alto = base.alto - dy;
    const efectivo = Math.max(alto, MARCO_MINIMO.alto);
    y = base.y + (base.alto - efectivo);
  }

  return encuadrar(
    {
      ...base,
      x,
      y,
      ancho: Math.max(ancho, MARCO_MINIMO.ancho),
      alto: Math.max(alto, MARCO_MINIMO.alto),
    },
    area,
  );
}

/**
 * Expandir y restaurar.
 *
 * Al expandir se guarda el marco anterior; al restaurar se vuelve **a ése**, no
 * a uno por defecto. Es toda la diferencia entre un botón de expandir y uno que
 * te tira el tamaño que elegiste.
 */
export function alternarExpandido(marco: Marco, area: Area): Marco {
  /*
    ⚠️ **Restaurar también saca del mosaico** — Enmienda 6. Con la ventana
    encajada en media pantalla, el tercer control es el único que la devuelve a
    su tamaño libre: si sólo mirara `expandido`, apretarlo sobre una ventana
    amosaicada la expandiría a pantalla completa y no habría gesto para volver
    al tamaño que el estudiante había elegido.
  */
  if (marco.expandido || marco.zona !== null) {
    const previo = marco.previo;
    if (!previo) return encuadrar({ ...marco, expandido: false, zona: null, previo: null }, area);
    return encuadrar({ ...previo, expandido: false, zona: null, previo: null }, area);
  }

  return {
    ...expandidoEn(area),
    expandido: true,
    zona: null,
    previo: { x: marco.x, y: marco.y, ancho: marco.ancho, alto: marco.alto },
  };
}

/**
 * Un rectángulo medido en la pantalla — el de la ficha en la barra.
 *
 * Está en las mismas coordenadas que el marco: el contenedor de las ventanas es
 * `fixed` con `inset: 0`, así que `marco.x` y un `getBoundingClientRect()` miden
 * desde el mismo origen. **Si eso dejara de ser cierto, la ventana saldría
 * disparada desde otro lado** y no habría nada en el cálculo que lo delatara.
 */
export interface Rect {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * De dónde nace la ventana cuando se la despliega desde su ficha — Enmienda 4.
 *
 * Devuelve la transformación que hace que la ventana **coincida exactamente con
 * su ficha**: aplicándola, el rectángulo de 940×660 se superpone al de ~190×44
 * de la barra. Animar de ahí a la identidad es el efecto de escala de un
 * escritorio — la ventana sale de la ficha que la abrió.
 *
 * ⚠️ **Va con `transform-origin: 0 0`.** Con el origen al centro —que es el que
 * trae el navegador— el `translate` tendría que compensar media escala en cada
 * eje, y el error no se ve como error: se ve como una ventana que sale de un
 * lugar cercano pero equivocado.
 *
 * ⚠️ **La escala es distinta en cada eje, y es a propósito.** Una ficha es mucho
 * más ancha que alta; forzar una escala uniforme haría que la ventana saliera de
 * un cuadrado que no está en ninguna parte en vez de de la ficha que se tocó.
 *
 * ⚠️ **Nunca devuelve escala cero.** Una ficha todavía sin maquetar mide `0` y
 * una escala `0` es una matriz sin inversa: el navegador deja de poder calcular
 * los fotogramas intermedios y la animación se ve como un parpadeo.
 */
export function desdeLaFicha(
  marco: Pick<Marco, "x" | "y" | "ancho" | "alto">,
  ficha: Rect,
): { x: number; y: number; escalaX: number; escalaY: number } {
  const MINIMA = 0.01;
  return {
    x: ficha.x - marco.x,
    y: ficha.y - marco.y,
    escalaX: Math.max(MINIMA, ficha.ancho / Math.max(1, marco.ancho)),
    escalaY: Math.max(MINIMA, ficha.alto / Math.max(1, marco.alto)),
  };
}

/** Valida un marco leído del navegador. `null` si no tiene forma de marco. */
export function comoMarco(valor: unknown): Marco | null {
  if (typeof valor !== "object" || valor === null) return null;
  const m = valor as Record<string, unknown>;
  const numeros = ["x", "y", "ancho", "alto"] as const;
  for (const campo of numeros) {
    if (typeof m[campo] !== "number" || !Number.isFinite(m[campo])) return null;
  }
  if (typeof m.expandido !== "boolean") return null;

  const previo = m.previo;
  let previoValido: Marco["previo"] = null;
  if (previo !== null && previo !== undefined) {
    const p = previo as Record<string, unknown>;
    if (numeros.every((c) => typeof p[c] === "number" && Number.isFinite(p[c]))) {
      previoValido = {
        x: p.x as number,
        y: p.y as number,
        ancho: p.ancho as number,
        alto: p.alto as number,
      };
    }
  }

  /*
    ⚠️ **Una zona desconocida se descarta, y la ventana no.** Es lo mismo que
    hace `clavesDesplegadas` con una clave inventada: un campo editado a mano no
    es motivo para tirar el marco entero, que es lo único que sabe dónde estaba
    la ventana. Sin zona vuelve a ser libre, que es el estado por defecto.

    ⚠️ **Y nunca sale con `expandido` y zona a la vez.** Es el invariante de
    `Marco.zona`, y acá es donde entra lo que escribió otra versión del código.
  */
  const zona = esZona(m.zona) && m.expandido !== true ? m.zona : null;

  return {
    x: m.x as number,
    y: m.y as number,
    ancho: m.ancho as number,
    alto: m.alto as number,
    expandido: m.expandido,
    zona,
    previo: previoValido,
  };
}
