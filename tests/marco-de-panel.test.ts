import { describe, expect, it } from "vitest";

import {
  MARCO_MINIMO,
  alternarExpandido,
  areaDe,
  comoMarco,
  encuadrar,
  desdeLaFicha,
  marcoInicial,
  mover,
  redimensionar,
  type Marco,
} from "@/lib/domain/marco-de-panel";

/**
 * El marco del panel — [ADR-088](../docs/decisions.md#adr-088), Enmienda 2.
 *
 * ⚠️ **Se llama «marco» y no «ventana» a propósito.** `Ventana` ya está tomada
 * dos veces en este dominio —la ventana de preparación de ADR-078 y
 * `VentanaDeExamen`—, y reusar la palabra para un rectángulo de la pantalla es
 * el anti-patrón `A-04` (`AGENTS.md` §4).
 *
 * Toda la aritmética se prueba acá, sin DOM: topar contra los bordes, respetar
 * el mínimo y restaurar al tamaño previo son reglas, y probarlas con un mouse de
 * mentira sería probar el doble.
 */

const AREA = areaDe({ ancho: 1440, alto: 900 });

function marco(over: Partial<Marco> = {}): Marco {
  return { x: 100, y: 100, ancho: 800, alto: 500, expandido: false, previo: null, ...over };
}

describe("el área", () => {
  it("reserva el pie **para que la barra siga a la vista y clickeable**", () => {
    // Si el panel llegara hasta abajo, taparía la ficha de la que salió — y con
    // ella el gesto de pasar de un objeto a otro sin cerrar la ventana.
    expect(AREA.y + AREA.alto).toBeLessThan(900);
  });

  it("en una pantalla diminuta nunca devuelve un área menor que el mínimo", () => {
    const chica = areaDe({ ancho: 320, alto: 300 });
    expect(chica.ancho).toBeGreaterThanOrEqual(MARCO_MINIMO.ancho);
    expect(chica.alto).toBeGreaterThanOrEqual(MARCO_MINIMO.alto);
  });
});

describe("dónde nace", () => {
  it("**en cascada**: la segunda no nace encima de la primera", () => {
    expect(marcoInicial(AREA, 1).x).toBeGreaterThan(marcoInicial(AREA, 0).x);
    expect(marcoInicial(AREA, 1).y).toBeGreaterThan(marcoInicial(AREA, 0).y);
  });

  it("el corrimiento cicla: abrir muchas no las manda fuera de cuadro", () => {
    for (let i = 0; i < 40; i++) {
      const m = marcoInicial(AREA, i);
      expect(m.x + m.ancho).toBeLessThanOrEqual(AREA.x + AREA.ancho + 0.001);
      expect(m.y + m.alto).toBeLessThanOrEqual(AREA.y + AREA.alto + 0.001);
    }
  });

  it("nace sin expandir y sin marco previo", () => {
    expect(marcoInicial(AREA, 0).expandido).toBe(false);
    expect(marcoInicial(AREA, 0).previo).toBeNull();
  });
});

describe("encuadrar — el caso que rompe un manejo de ventanas casero", () => {
  /**
   * Un marco guardado en un monitor grande y restaurado en una laptop nacería
   * **medio fuera de la pantalla**, con su barra de título inalcanzable. No
   * habría forma de recuperarlo: no se puede arrastrar lo que no se puede
   * agarrar.
   */
  it("un marco de una pantalla más grande entra entero en la chica", () => {
    const chica = areaDe({ ancho: 900, alto: 700 });
    const m = encuadrar(marco({ x: 1200, y: 800, ancho: 1300, alto: 900 }), chica);

    expect(m.x).toBeGreaterThanOrEqual(chica.x);
    expect(m.y).toBeGreaterThanOrEqual(chica.y);
    expect(m.x + m.ancho).toBeLessThanOrEqual(chica.x + chica.ancho + 0.001);
    expect(m.y + m.alto).toBeLessThanOrEqual(chica.y + chica.alto + 0.001);
  });

  it("nunca lo achica por debajo del mínimo", () => {
    const m = encuadrar(marco({ ancho: 10, alto: 10 }), AREA);
    expect(m.ancho).toBeGreaterThanOrEqual(MARCO_MINIMO.ancho);
    expect(m.alto).toBeGreaterThanOrEqual(MARCO_MINIMO.alto);
  });

  it("una coordenada negativa vuelve adentro", () => {
    const m = encuadrar(marco({ x: -500, y: -500 }), AREA);
    expect(m.x).toBe(AREA.x);
    expect(m.y).toBe(AREA.y);
  });

  it("un marco expandido se recalcula al área nueva", () => {
    const m = encuadrar(marco({ expandido: true }), AREA);
    expect(m).toMatchObject({ x: AREA.x, y: AREA.y, ancho: AREA.ancho, alto: AREA.alto });
  });
});

describe("arrastrar", () => {
  it("mueve por el delta", () => {
    expect(mover(marco(), 50, 30, AREA)).toMatchObject({ x: 150, y: 130 });
  });

  it("topa contra los bordes en vez de salirse", () => {
    const m = mover(marco(), 99999, 99999, AREA);
    expect(m.x + m.ancho).toBeLessThanOrEqual(AREA.x + AREA.ancho + 0.001);
    expect(m.y + m.alto).toBeLessThanOrEqual(AREA.y + AREA.alto + 0.001);
  });

  it("**una ventana expandida no se mueve**: ocupa todo, no hay a dónde llevarla", () => {
    const expandida = marco({ expandido: true });
    expect(mover(expandida, 100, 100, AREA)).toBe(expandida);
  });

  it("mover no cambia el tamaño", () => {
    const m = mover(marco(), 40, 40, AREA);
    expect(m.ancho).toBe(800);
    expect(m.alto).toBe(500);
  });
});

describe("redimensionar", () => {
  it("desde el este crece hacia la derecha, sin mover el origen", () => {
    const m = redimensionar(marco(), "e", 120, 0, AREA);
    expect(m.ancho).toBe(920);
    expect(m.x).toBe(100);
  });

  /**
   * ⚠️ **La mitad que se hace mal.** Si tirar del borde izquierdo sólo cambiara
   * el ancho, arrastrar hacia la izquierda agrandaría la ventana **hacia la
   * derecha**: lo contrario de lo que hace la mano.
   */
  it("desde el oeste el origen acompaña a la mano", () => {
    const m = redimensionar(marco(), "o", -60, 0, AREA);
    expect(m.ancho).toBe(860);
    expect(m.x).toBe(40);
    // El borde derecho se queda quieto, que es lo que se ve al hacerlo.
    expect(m.x + m.ancho).toBe(900);
  });

  it("desde el norte, lo mismo en vertical", () => {
    const m = redimensionar(marco(), "n", 0, -40, AREA);
    expect(m.alto).toBe(540);
    expect(m.y).toBe(60);
    expect(m.y + m.alto).toBe(600);
  });

  it("una esquina cambia las dos medidas a la vez", () => {
    const m = redimensionar(marco(), "se", 100, 80, AREA);
    expect(m.ancho).toBe(900);
    expect(m.alto).toBe(580);
  });

  it("al topar el mínimo **el origen se queda quieto**", () => {
    // Sin esto, seguir tirando después del mínimo empuja la ventana por la
    // pantalla en vez de frenar.
    const m = redimensionar(marco(), "o", 99999, 0, AREA);
    expect(m.ancho).toBe(MARCO_MINIMO.ancho);
    expect(m.x + m.ancho).toBe(900);
  });

  it("nunca baja del mínimo, desde ningún borde", () => {
    for (const borde of ["n", "s", "e", "o", "ne", "no", "se", "so"] as const) {
      const m = redimensionar(marco(), borde, -99999, -99999, AREA);
      expect(m.ancho).toBeGreaterThanOrEqual(MARCO_MINIMO.ancho);
      expect(m.alto).toBeGreaterThanOrEqual(MARCO_MINIMO.alto);
    }
  });

  it("una expandida tampoco se estira", () => {
    const expandida = marco({ expandido: true });
    expect(redimensionar(expandida, "se", 100, 100, AREA)).toBe(expandida);
  });
});

describe("expandir y restaurar", () => {
  it("expandir ocupa el área entera y **guarda a dónde volver**", () => {
    const m = alternarExpandido(marco(), AREA);
    expect(m.expandido).toBe(true);
    expect(m).toMatchObject({ x: AREA.x, y: AREA.y, ancho: AREA.ancho, alto: AREA.alto });
    expect(m.previo).toEqual({ x: 100, y: 100, ancho: 800, alto: 500 });
  });

  /**
   * Toda la diferencia entre un botón de expandir y uno que te tira el tamaño
   * que elegiste.
   */
  it("restaurar vuelve **al que el estudiante eligió**, no a uno por defecto", () => {
    const original = marco({ x: 210, y: 140, ancho: 640, alto: 420 });
    const vuelto = alternarExpandido(alternarExpandido(original, AREA), AREA);

    expect(vuelto.expandido).toBe(false);
    expect(vuelto).toMatchObject({ x: 210, y: 140, ancho: 640, alto: 420 });
    expect(vuelto.previo).toBeNull();
  });

  it("restaurar sin marco previo no rompe: queda donde está", () => {
    const m = alternarExpandido(marco({ expandido: true, previo: null }), AREA);
    expect(m.expandido).toBe(false);
    expect(m.ancho).toBeGreaterThanOrEqual(MARCO_MINIMO.ancho);
  });
});

describe("lo que se lee del navegador no se cree", () => {
  it("acepta un marco bien formado", () => {
    const m = { x: 1, y: 2, ancho: 400, alto: 300, expandido: false, previo: null };
    expect(comoMarco(m)).toEqual(m);
  });

  it("rechaza lo que no tiene forma de marco", () => {
    for (const basura of [null, undefined, 42, "marco", {}, { x: 1 }, { x: "a", y: 2, ancho: 3, alto: 4, expandido: false }]) {
      expect(comoMarco(basura)).toBeNull();
    }
  });

  it("rechaza números que no son números", () => {
    expect(comoMarco({ x: NaN, y: 0, ancho: 400, alto: 300, expandido: false })).toBeNull();
    expect(comoMarco({ x: Infinity, y: 0, ancho: 400, alto: 300, expandido: false })).toBeNull();
  });

  it("un `previo` corrupto se descarta **sin tirar el marco**", () => {
    const m = comoMarco({ x: 1, y: 2, ancho: 400, alto: 300, expandido: true, previo: { x: "no" } });
    expect(m).not.toBeNull();
    expect(m?.previo).toBeNull();
  });
});

/**
 * El efecto de escala del escritorio — ADR-088, Enmienda 4.
 *
 * ⚠️ **Esto es aritmética, y por eso se prueba acá y no con un navegador.** Que
 * la ventana salga **exactamente** de su ficha es una multiplicación y una
 * resta; verificarla moviendo un mouse de mentira probaría el doble y no diría
 * si el número está bien.
 */
describe("desdeLaFicha — la ventana sale de su ficha", () => {
  const MARCO = { x: 100, y: 200, ancho: 940, alto: 660 };
  const FICHA = { x: 628, y: 833, ancho: 188, alto: 44 };

  /**
   * Aplicando la transformación con `transform-origin: 0 0`, la esquina de la
   * ventana tiene que caer sobre la esquina de la ficha y su tamaño tiene que
   * ser el de la ficha. Si esto falla, la ventana sale de un lugar **cercano y
   * equivocado**, que es peor que no animar: parece un defecto de posición.
   */
  it("superpone la ventana sobre la ficha, exactamente", () => {
    const d = desdeLaFicha(MARCO, FICHA);
    expect(MARCO.x + d.x).toBe(FICHA.x);
    expect(MARCO.y + d.y).toBe(FICHA.y);
    expect(MARCO.ancho * d.escalaX).toBeCloseTo(FICHA.ancho, 6);
    expect(MARCO.alto * d.escalaY).toBeCloseTo(FICHA.alto, 6);
  });

  /**
   * ⚠️ **La escala es distinta en cada eje.** Una ficha es mucho más ancha que
   * alta; una escala uniforme haría que la ventana saliera de un cuadrado que no
   * está en ninguna parte, en vez de de la ficha que se tocó.
   */
  it("la escala de cada eje es la de su propio lado", () => {
    const d = desdeLaFicha(MARCO, FICHA);
    expect(d.escalaX).not.toBeCloseTo(d.escalaY, 2);
    expect(d.escalaX).toBeCloseTo(188 / 940, 6);
    expect(d.escalaY).toBeCloseTo(44 / 660, 6);
  });

  /**
   * ⚠️ **Una escala cero es una matriz sin inversa**: el navegador no puede
   * calcular los fotogramas intermedios y la animación se ve como un parpadeo.
   * Una ficha todavía sin maquetar mide exactamente eso.
   */
  it("nunca devuelve escala cero, ni con una ficha sin medir", () => {
    const d = desdeLaFicha(MARCO, { x: 0, y: 0, ancho: 0, alto: 0 });
    expect(d.escalaX).toBeGreaterThan(0);
    expect(d.escalaY).toBeGreaterThan(0);
  });

  it("no divide por cero si el marco viniera vacío", () => {
    const d = desdeLaFicha({ x: 0, y: 0, ancho: 0, alto: 0 }, FICHA);
    expect(Number.isFinite(d.escalaX)).toBe(true);
    expect(Number.isFinite(d.escalaY)).toBe(true);
  });

  /** Una ficha que ya mide lo mismo que la ventana no mueve ni escala nada. */
  it("una ficha del tamaño del marco es la identidad", () => {
    const d = desdeLaFicha(MARCO, { x: MARCO.x, y: MARCO.y, ancho: MARCO.ancho, alto: MARCO.alto });
    expect(d).toEqual({ x: 0, y: 0, escalaX: 1, escalaY: 1 });
  });
});
