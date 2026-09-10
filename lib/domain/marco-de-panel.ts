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
   * A dónde vuelve al restaurar. `null` ⇒ no está expandido.
   *
   * ⚠️ **Se guarda al expandir, no se recalcula al restaurar.** Volver a un
   * tamaño «por defecto» perdería el que el estudiante eligió, que es
   * precisamente lo que un manejo de ventanas existe para conservar.
   */
  previo: { x: number; y: number; ancho: number; alto: number } | null;
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
 * Dónde nace una ventana que nunca se abrió.
 *
 * **En cascada**, como cualquier manejo de ventanas: la segunda no nace encima
 * de la primera. El corrimiento cicla cada cinco para que abrir muchas no las
 * mande fuera de cuadro.
 */
export function marcoInicial(area: Area, indice: number): Marco {
  const corrimiento = (indice % 5) * 28;
  const ancho = Math.min(1080, area.ancho);
  const alto = Math.min(760, area.alto);
  return encuadrar(
    {
      x: area.x + corrimiento,
      y: area.y + corrimiento,
      ancho,
      alto,
      expandido: false,
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

  const ancho = Math.min(Math.max(marco.ancho, MARCO_MINIMO.ancho), area.ancho);
  const alto = Math.min(Math.max(marco.alto, MARCO_MINIMO.alto), area.alto);
  const x = Math.min(Math.max(marco.x, area.x), area.x + area.ancho - ancho);
  const y = Math.min(Math.max(marco.y, area.y), area.y + area.alto - alto);
  return { ...marco, x, y, ancho, alto };
}

function expandidoEn(area: Area) {
  return { x: area.x, y: area.y, ancho: area.ancho, alto: area.alto };
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
  return encuadrar({ ...marco, x: marco.x + dx, y: marco.y + dy }, area);
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

  let { x, y, ancho, alto } = marco;

  if (borde.includes("e")) ancho = marco.ancho + dx;
  if (borde.includes("o")) {
    ancho = marco.ancho - dx;
    // El mínimo topa el origen, no lo empuja.
    const efectivo = Math.max(ancho, MARCO_MINIMO.ancho);
    x = marco.x + (marco.ancho - efectivo);
  }
  if (borde.includes("s")) alto = marco.alto + dy;
  if (borde.includes("n")) {
    alto = marco.alto - dy;
    const efectivo = Math.max(alto, MARCO_MINIMO.alto);
    y = marco.y + (marco.alto - efectivo);
  }

  return encuadrar(
    {
      ...marco,
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
  if (marco.expandido) {
    const previo = marco.previo;
    if (!previo) return encuadrar({ ...marco, expandido: false, previo: null }, area);
    return encuadrar({ ...previo, expandido: false, previo: null }, area);
  }

  return {
    ...expandidoEn(area),
    expandido: true,
    previo: { x: marco.x, y: marco.y, ancho: marco.ancho, alto: marco.alto },
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

  return {
    x: m.x as number,
    y: m.y as number,
    ancho: m.ancho as number,
    alto: m.alto as number,
    expandido: m.expandido,
    previo: previoValido,
  };
}
