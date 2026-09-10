import { beforeEach, describe, expect, it } from "vitest";

import {
  ESPACIO_VACIO,
  LIMITE_DURO,
  VISIBLES,
  abrir,
  activar,
  cerrar,
  cerrarOtros,
  cerrarTodos,
  claveDe,
  encuadrarObjeto,
  mover,
  reordenar,
  repartir,
  sincronizarConRuta,
  validarContra,
  type EspacioDeTrabajo,
  type ObjetoPorAbrir,
} from "@/lib/domain/espacio-de-trabajo";
import {
  claveDeAlmacenamiento,
  guardar,
  leer,
  olvidar,
  olvidarTodo,
} from "@/lib/client/espacio-de-trabajo/persistencia";

/**
 * El espacio de trabajo — [ADR-088](../docs/decisions.md#adr-088).
 *
 * Las reglas se prueban **sobre el módulo puro**, sin React y sin navegador: es
 * la razón por la que el dominio no toca `localStorage`. Probar el desalojo con
 * un almacenamiento de mentira sería probar el doble, no la regla.
 */

const T0 = "2026-09-10T09:00:00.000Z";
const T1 = "2026-09-10T10:00:00.000Z";
const T2 = "2026-09-10T11:00:00.000Z";

function objeto(n: number, extra: Partial<ObjetoPorAbrir> = {}): ObjetoPorAbrir {
  return {
    tipo: "unidad",
    entidadId: `u${n}`,
    etiqueta: `Unidad ${n}`,
    etiquetaSecundaria: "Economía",
    ruta: `/materia?cursada=c${n}`,
    ...extra,
  };
}

function conObjetos(cantidad: number): EspacioDeTrabajo {
  let espacio = ESPACIO_VACIO;
  for (let i = 1; i <= cantidad; i++) {
    espacio = abrir(espacio, objeto(i), `2026-09-10T${String(i).padStart(2, "0")}:00:00.000Z`).espacio;
  }
  return espacio;
}

describe("abrir", () => {
  it("abre un objeto y lo deja activo", () => {
    const { espacio, yaEstaba, desalojado } = abrir(ESPACIO_VACIO, objeto(1), T0);
    expect(espacio.objetos).toHaveLength(1);
    expect(espacio.activo).toBe(claveDe("unidad", "u1"));
    expect(yaEstaba).toBe(false);
    expect(desalojado).toBeNull();
  });

  it("la identidad es `tipo:entidadId`, **nunca la etiqueta visible**", () => {
    // Dos objetos con el mismo texto y distinta entidad son dos objetos.
    let espacio = abrir(ESPACIO_VACIO, objeto(1, { etiqueta: "Unidad 2" }), T0).espacio;
    espacio = abrir(espacio, objeto(2, { etiqueta: "Unidad 2" }), T1).espacio;
    expect(espacio.objetos).toHaveLength(2);
  });

  it("no crea duplicados: reabrir lo mismo activa el que ya estaba", () => {
    const primero = abrir(ESPACIO_VACIO, objeto(1), T0);
    const segundo = abrir(primero.espacio, objeto(2), T1);
    const tercero = abrir(segundo.espacio, objeto(1), T2);

    expect(tercero.espacio.objetos).toHaveLength(2);
    expect(tercero.yaEstaba).toBe(true);
    expect(tercero.espacio.activo).toBe(claveDe("unidad", "u1"));
    expect(tercero.espacio.objetos[0]?.visitadoEn).toBe(T2);
  });

  it("reabrir NO reordena la barra: se movería sola bajo el cursor", () => {
    const espacio = abrir(conObjetos(3), objeto(1), T2).espacio;
    expect(espacio.objetos.map((o) => o.entidadId)).toEqual(["u1", "u2", "u3"]);
  });

  it("un tipo distinto sobre la misma entidad es otro objeto", () => {
    let espacio = abrir(ESPACIO_VACIO, objeto(1, { tipo: "materia" }), T0).espacio;
    espacio = abrir(espacio, objeto(1, { tipo: "bitacora" }), T1).espacio;
    expect(espacio.objetos).toHaveLength(2);
  });

  it("sin etiqueta secundaria queda `null`, y **no se inventa contexto**", () => {
    const { espacio } = abrir(ESPACIO_VACIO, { ...objeto(1), etiquetaSecundaria: undefined }, T0);
    expect(espacio.objetos[0]?.etiquetaSecundaria).toBeNull();
  });
});

describe("el límite duro — requisito 6 del multiventana", () => {
  it("nunca se pasa de `LIMITE_DURO`", () => {
    let espacio = conObjetos(LIMITE_DURO);
    expect(espacio.objetos).toHaveLength(LIMITE_DURO);
    espacio = abrir(espacio, objeto(99), T2).espacio;
    expect(espacio.objetos).toHaveLength(LIMITE_DURO);
  });

  it("desaloja **el menos visitado**, y lo devuelve para poder decirlo", () => {
    let espacio = conObjetos(LIMITE_DURO);
    // `u1` es el más viejo; se lo visita para que deje de ser el candidato.
    espacio = activar(espacio, claveDe("unidad", "u1"), T2);
    const { espacio: despues, desalojado } = abrir(espacio, objeto(99), T2);

    expect(desalojado?.entidadId).toBe("u2");
    expect(despues.objetos.some((o) => o.entidadId === "u2")).toBe(false);
    expect(despues.objetos.some((o) => o.entidadId === "u1")).toBe(true);
  });
});

describe("activar", () => {
  it("activa y actualiza la visita", () => {
    const espacio = activar(conObjetos(3), claveDe("unidad", "u2"), T2);
    expect(espacio.activo).toBe(claveDe("unidad", "u2"));
    expect(espacio.objetos[1]?.visitadoEn).toBe(T2);
  });

  it("una clave desconocida no cambia nada", () => {
    const antes = conObjetos(2);
    expect(activar(antes, "unidad:no-existe", T2)).toBe(antes);
  });
});

describe("cerrar", () => {
  it("al cerrar el activo queda activo **el vecino más recientemente visitado**", () => {
    let espacio = conObjetos(3);
    espacio = activar(espacio, claveDe("unidad", "u1"), T1); // u1 visitada última
    espacio = activar(espacio, claveDe("unidad", "u3"), T2); // y ahora u3 es la activa
    espacio = cerrar(espacio, claveDe("unidad", "u3"));

    expect(espacio.activo).toBe(claveDe("unidad", "u1"));
  });

  it("cerrar una que no es la activa no mueve el activo", () => {
    let espacio = activar(conObjetos(3), claveDe("unidad", "u2"), T2);
    espacio = cerrar(espacio, claveDe("unidad", "u1"));
    expect(espacio.activo).toBe(claveDe("unidad", "u2"));
  });

  it("cerrar el último deja `activo` en `null` y **no rompe nada**", () => {
    const espacio = cerrar(conObjetos(1), claveDe("unidad", "u1"));
    expect(espacio.objetos).toEqual([]);
    expect(espacio.activo).toBeNull();
  });

  it("cerrar los otros conserva sólo uno; una clave desconocida no vacía el espacio", () => {
    expect(cerrarOtros(conObjetos(4), claveDe("unidad", "u2")).objetos).toHaveLength(1);
    const antes = conObjetos(4);
    expect(cerrarOtros(antes, "unidad:no-existe")).toBe(antes);
  });

  it("cerrar todos deja el espacio vacío", () => {
    expect(cerrarTodos()).toEqual(ESPACIO_VACIO);
  });
});

describe("reordenar — requisito 3, su mitad accesible", () => {
  it("mueve a una posición", () => {
    const espacio = reordenar(conObjetos(3), claveDe("unidad", "u3"), 0);
    expect(espacio.objetos.map((o) => o.entidadId)).toEqual(["u3", "u1", "u2"]);
  });

  it("izquierda y derecha, sin salirse de los bordes", () => {
    const base = conObjetos(3);
    expect(mover(base, claveDe("unidad", "u1"), -1).objetos.map((o) => o.entidadId)).toEqual([
      "u1", "u2", "u3",
    ]);
    expect(mover(base, claveDe("unidad", "u1"), 1).objetos.map((o) => o.entidadId)).toEqual([
      "u2", "u1", "u3",
    ]);
  });

  it("reordenar no cambia cuál está activo", () => {
    const base = activar(conObjetos(3), claveDe("unidad", "u1"), T2);
    expect(reordenar(base, claveDe("unidad", "u1"), 2).activo).toBe(claveDe("unidad", "u1"));
  });
});

describe("repartir — requisito 5, y la corrección de `A-07`", () => {
  it("con pocos objetos no hay desbordamiento", () => {
    const { visibles, desbordados } = repartir(conObjetos(VISIBLES));
    expect(visibles).toHaveLength(VISIBLES);
    expect(desbordados).toEqual([]);
  });

  it("el sexto va al desbordamiento **entero**, no se comprime el resto", () => {
    const { visibles, desbordados } = repartir(conObjetos(VISIBLES + 2));
    expect(visibles).toHaveLength(VISIBLES);
    expect(desbordados).toHaveLength(2);
  });

  /**
   * El cupo medido — se agregó **después de ver el defecto en el navegador**.
   *
   * A 1024 px, cinco objetos abiertos daban una barra de ~1100 px contra 720 px
   * de columna, y el `body` ganaba scroll horizontal. La corrección no es
   * achicar etiquetas —eso es volver a `A-07`—: es mostrar menos.
   */
  it("un cupo más chico manda: se muestran menos, no más apretados", () => {
    const { visibles, desbordados } = repartir(conObjetos(5), 2);
    expect(visibles).toHaveLength(2);
    expect(desbordados).toHaveLength(3);
  });

  it("el cupo nunca sube por encima de `VISIBLES`", () => {
    expect(repartir(conObjetos(9), 99).visibles).toHaveLength(VISIBLES);
  });

  it("**siempre queda al menos uno visible**: una barra que es sólo un menú no dice nada", () => {
    for (const cupo of [0, -1, -99]) {
      const { visibles, desbordados } = repartir(conObjetos(4), cupo);
      expect(visibles).toHaveLength(1);
      expect(desbordados).toHaveLength(3);
    }
  });

  it("con cupo chico, el activo sigue siendo el que se ve", () => {
    const espacio = activar(conObjetos(5), claveDe("unidad", "u5"), T2);
    const { visibles } = repartir(espacio, 2);
    expect(visibles.some((o) => o.clave === espacio.activo)).toBe(true);
  });

  it("**el activo siempre se ve**, aunque haya quedado más allá del corte", () => {
    const espacio = activar(conObjetos(VISIBLES + 3), claveDe("unidad", `u${VISIBLES + 3}`), T2);
    const { visibles, desbordados } = repartir(espacio);

    expect(visibles.some((o) => o.clave === espacio.activo)).toBe(true);
    expect(desbordados.some((o) => o.clave === espacio.activo)).toBe(false);
    // Y no se pierde ninguno al hacerle lugar.
    expect(visibles.length + desbordados.length).toBe(VISIBLES + 3);
  });
});

describe("sincronizar con la ruta — requisito 2", () => {
  it("navegar a la ruta de un objeto abierto lo activa", () => {
    const espacio = sincronizarConRuta(conObjetos(3), "/materia?cursada=c2", T2);
    expect(espacio.activo).toBe(claveDe("unidad", "u2"));
  });

  it("una ruta sin objeto abierto **no abre uno**: el espacio no es un historial", () => {
    const espacio = sincronizarConRuta(conObjetos(3), "/progreso", T2);
    expect(espacio.objetos).toHaveLength(3);
    expect(espacio.activo).toBeNull();
  });

  it("`?escenario=` no rompe la coincidencia: es el conmutador del Track A", () => {
    const espacio = sincronizarConRuta(conObjetos(2), "/materia?cursada=c1&escenario=FX-DAY-BASE", T2);
    expect(espacio.activo).toBe(claveDe("unidad", "u1"));
  });

  it("el orden de los parámetros no cambia la identidad de la ruta", () => {
    let espacio = abrir(ESPACIO_VACIO, objeto(1, { ruta: "/materia?a=1&b=2" }), T0).espacio;
    espacio = sincronizarConRuta(espacio, "/materia?b=2&a=1", T2);
    expect(espacio.activo).toBe(claveDe("unidad", "u1"));
  });

  it("no cicla: sin cambios devuelve el mismo objeto", () => {
    const base = sincronizarConRuta(conObjetos(2), "/materia?cursada=c1", T2);
    expect(sincronizarConRuta(base, "/materia?cursada=c1", T2)).toBe(base);
  });
});

describe("validarContra — el objeto que ya no está disponible", () => {
  it("descarta las rutas que la aplicación no reconoce", () => {
    let espacio = conObjetos(2);
    espacio = abrir(espacio, objeto(9, { ruta: "/inventada" }), T2).espacio;

    const validado = validarContra(espacio, (r) => !r.startsWith("/inventada"));
    expect(validado.objetos).toHaveLength(2);
    // Era el activo, y al descartarlo el activo **no queda colgado**.
    expect(validado.activo).toBeNull();
  });

  it("sin nada que descartar devuelve el mismo objeto", () => {
    const base = conObjetos(2);
    expect(validarContra(base, () => true)).toBe(base);
  });
});

// ── La memoria ───────────────────────────────────────────────────────────────

describe("persistencia", () => {
  const ANA = "est-SYN-ana";
  const BETO = "est-SYN-beto";

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("guarda y restaura", () => {
    const espacio = activar(conObjetos(3), claveDe("unidad", "u2"), T2);
    guardar(ANA, espacio);

    const restaurado = leer(ANA);
    expect(restaurado.objetos.map((o) => o.entidadId)).toEqual(["u1", "u2", "u3"]);
    expect(restaurado.activo).toBe(claveDe("unidad", "u2"));
  });

  it("**aísla por estudiante**: lo de Ana no aparece en la sesión de Beto", () => {
    guardar(ANA, conObjetos(3));
    expect(leer(BETO)).toEqual(ESPACIO_VACIO);
    // Y son claves distintas, no contenidos distintos en la misma.
    expect(claveDeAlmacenamiento(ANA)).not.toBe(claveDeAlmacenamiento(BETO));
  });

  it("la clave lleva la versión: cambiar la forma no obliga a migrar", () => {
    expect(claveDeAlmacenamiento(ANA)).toMatch(/^achieve\.espacio-de-trabajo\.v1\./);
  });

  it("un JSON roto **no rompe la aplicación**: se arranca vacío", () => {
    window.localStorage.setItem(claveDeAlmacenamiento(ANA), "{esto no es json");
    expect(leer(ANA)).toEqual(ESPACIO_VACIO);
  });

  it("una fila inválida se descarta **sin tirar las válidas**", () => {
    window.localStorage.setItem(
      claveDeAlmacenamiento(ANA),
      JSON.stringify({
        objetos: [
          { tipo: "unidad", entidadId: "u1", etiqueta: "Unidad 1", ruta: "/materia", abiertoEn: T0, visitadoEn: T0 },
          { tipo: "inventado", entidadId: "x", etiqueta: "X", ruta: "/materia", abiertoEn: T0, visitadoEn: T0 },
          { tipo: "unidad", entidadId: "u2", etiqueta: "Unidad 2", ruta: "javascript:alert(1)", abiertoEn: T0, visitadoEn: T0 },
        ],
        activo: "unidad:u1",
      }),
    );
    const restaurado = leer(ANA);
    expect(restaurado.objetos.map((o) => o.entidadId)).toEqual(["u1"]);
  });

  it("un activo que no corresponde a ningún objeto queda en `null`", () => {
    window.localStorage.setItem(
      claveDeAlmacenamiento(ANA),
      JSON.stringify({ objetos: [], activo: "unidad:u9" }),
    );
    expect(leer(ANA).activo).toBeNull();
  });

  it("un archivo con la misma clave dos veces no restaura duplicados", () => {
    const fila = { tipo: "unidad", entidadId: "u1", etiqueta: "Unidad 1", ruta: "/materia", abiertoEn: T0, visitadoEn: T0 };
    window.localStorage.setItem(
      claveDeAlmacenamiento(ANA),
      JSON.stringify({ objetos: [fila, fila], activo: null }),
    );
    expect(leer(ANA).objetos).toHaveLength(1);
  });

  it("**no se guarda nada que no sea un atajo**", () => {
    guardar(ANA, conObjetos(2));
    const crudo = window.localStorage.getItem(claveDeAlmacenamiento(ANA)) ?? "";
    // El contrato de ADR-088 §4, verificado sobre el texto que queda escrito.
    for (const campo of ["evidencia", "reflexion", "reflection", "intervencion", "whatsapp", "email"]) {
      expect(crudo.toLowerCase()).not.toContain(campo);
    }
    expect(Object.keys(JSON.parse(crudo).objetos[0]).sort()).toEqual([
      "abiertoEn", "clave", "entidadId", "etiqueta", "etiquetaSecundaria",
      // `marco` entró con la Enmienda 2. **Es geometría y nada más**: la línea de
      // abajo lo comprueba en vez de confiar en el nombre.
      "marco",
      "ruta", "tipo", "visitadoEn",
    ]);
  });

  it("el marco guardado es **geometría**, no contenido", () => {
    let espacio = conObjetos(1);
    const clave = claveDe("unidad", "u1");
    espacio = encuadrarObjeto(espacio, clave, {
      x: 40, y: 32, ancho: 900, alto: 600, expandido: false, previo: null,
    });
    guardar(ANA, espacio);

    const guardado = JSON.parse(window.localStorage.getItem(claveDeAlmacenamiento(ANA)) ?? "{}");
    const marco = guardado.objetos[0].marco;
    expect(Object.keys(marco).sort()).toEqual(["alto", "ancho", "expandido", "previo", "x", "y"]);
    // Sólo números y un booleano: no hay por dónde filtrar un texto del dominio.
    for (const campo of ["x", "y", "ancho", "alto"]) expect(typeof marco[campo]).toBe("number");
    expect(typeof marco.expandido).toBe("boolean");
  });

  it("el marco sobrevive a la recarga: la ventana vuelve donde estaba", () => {
    const clave = claveDe("unidad", "u1");
    const marco = { x: 120, y: 64, ancho: 820, alto: 540, expandido: false, previo: null };
    guardar(ANA, encuadrarObjeto(conObjetos(2), clave, marco));

    expect(leer(ANA).objetos[0]?.marco).toEqual(marco);
    // Y el que nunca se movió sigue sin marco: **no se le inventa uno**.
    expect(leer(ANA).objetos[1]?.marco).toBeNull();
  });

  it("una entrada guardada **antes** de la Enmienda 2 se sigue leyendo", () => {
    window.localStorage.setItem(
      claveDeAlmacenamiento(ANA),
      JSON.stringify({
        objetos: [{
          tipo: "unidad", entidadId: "u1", etiqueta: "Unidad 1",
          ruta: "/materia", abiertoEn: T0, visitadoEn: T0,
        }],
        activo: null,
      }),
    );
    const restaurado = leer(ANA);
    expect(restaurado.objetos).toHaveLength(1);
    expect(restaurado.objetos[0]?.marco).toBeNull();
  });

  it("un marco corrupto **no invalida el objeto**: se pierde la posición, no el atajo", () => {
    window.localStorage.setItem(
      claveDeAlmacenamiento(ANA),
      JSON.stringify({
        objetos: [{
          tipo: "unidad", entidadId: "u1", etiqueta: "Unidad 1", ruta: "/materia",
          abiertoEn: T0, visitadoEn: T0, marco: { x: "ochenta", y: null },
        }],
        activo: null,
      }),
    );
    const restaurado = leer(ANA);
    expect(restaurado.objetos).toHaveLength(1);
    expect(restaurado.objetos[0]?.marco).toBeNull();
  });

  it("olvidar borra el de uno y **deja el del otro**", () => {
    guardar(ANA, conObjetos(2));
    guardar(BETO, conObjetos(3));
    olvidar(ANA);
    expect(leer(ANA)).toEqual(ESPACIO_VACIO);
    expect(leer(BETO).objetos).toHaveLength(3);
  });

  it("cerrar sesión borra **todos**: no queda uno esperando a que entre otro", () => {
    guardar(ANA, conObjetos(2));
    guardar(BETO, conObjetos(3));
    window.localStorage.setItem("otra.cosa", "se queda");

    olvidarTodo();

    expect(leer(ANA)).toEqual(ESPACIO_VACIO);
    expect(leer(BETO)).toEqual(ESPACIO_VACIO);
    // Y no barre el resto del almacenamiento del navegador.
    expect(window.localStorage.getItem("otra.cosa")).toBe("se queda");
  });
});
