import { describe, expect, it } from "vitest";

import {
  REGLA_DE_SUPERPOSICION,
  bloqueQueSeSuperpone,
  primerInicioSinClase,
  type BloqueSemanal,
} from "@/lib/domain/superposicion";
import { cambioDeHorarioPosible } from "@/lib/domain/renegociacion";

/**
 * **Fase B6.22 — la superposición con una clase.**
 *
 * [ADR-064](../docs/decisions.md#adr-064), decidido el 5 de septiembre de 2026:
 *
 * > *"La restricción horaria pertenece a la propuesta y validación del
 * > `Commitment`, no al ADE."*
 * >
 * > *"No confirmar silenciosamente el compromiso. **Mostrar el conflicto.**"*
 *
 * Lo que más protege este archivo no es que detecte el conflicto: es **que no
 * lo invente**. Sin horarios conocidos, sin duración, o pegado al borde de la
 * clase, la respuesta tiene que ser la misma que antes de que la regla
 * existiera.
 */

const CBA = "America/Argentina/Cordoba";

/** Martes de 14 a 16, con los segundos que entrega Postgres. */
const MARTES: BloqueSemanal = { dia: 2, desde: "14:00:00", hasta: "16:00:00" };

/** 2026-09-08 es martes. Las horas van en `-03:00`, la zona de Córdoba. */
const martes = (hhmm: string) => `2026-09-08T${hhmm}:00.000-03:00`;

const franja = (inicio: string, minutos = 60) => ({ inicio, minutos, zonaInstitucional: CBA });

// ─────────────────────────────────────────────────────────────────────────────

describe("§1 · Sin horarios conocidos no pasa nada", () => {
  it("una lista vacía nunca da conflicto", () => {
    // **La mitigación de riesgo del corte.** Es una regla nueva sobre el camino
    // que ya funciona; con la lista vacía —el caso de casi todo el mundo hoy—
    // el comportamiento es idéntico al de antes.
    expect(bloqueQueSeSuperpone(franja(martes("14:30")), [])).toBeNull();
  });

  it("y tampoco mueve la propuesta", () => {
    // El mismo instante, normalizado: la función siempre devuelve ISO en UTC,
    // porque el que llama compara strings para saber si se corrió.
    expect(primerInicioSinClase(franja(martes("14:30")), [])).toBe(
      new Date(martes("14:30")).toISOString(),
    );
  });

  it("una franja sin duración no se evalúa, no se rechaza", () => {
    // Omitir, no inventar: sin saber cuánto dura no se puede saber qué pisa, y
    // adivinar una duración sería decidir por el estudiante.
    expect(bloqueQueSeSuperpone(franja(martes("14:30"), 0), [MARTES])).toBeNull();
  });

  it("y un instante ilegible tampoco", () => {
    expect(bloqueQueSeSuperpone(franja("no es una fecha"), [MARTES])).toBeNull();
  });
});

describe("§2 · Los bordes, que son la mitad de la regla", () => {
  it("terminar JUSTO cuando empieza la clase no es conflicto", () => {
    // 13:00–14:00 contra 14:00–16:00. Tratarlo como conflicto haría imposible
    // lo más razonable que alguien puede hacer: estudiar pegado a la clase.
    expect(bloqueQueSeSuperpone(franja(martes("13:00"), 60), [MARTES])).toBeNull();
  });

  it("empezar JUSTO cuando termina, tampoco", () => {
    expect(bloqueQueSeSuperpone(franja(martes("16:00"), 60), [MARTES])).toBeNull();
  });

  it("un minuto antes del final sí es conflicto", () => {
    expect(bloqueQueSeSuperpone(franja(martes("13:00"), 61), [MARTES])).toEqual(MARTES);
  });

  it("y un minuto antes del principio, también", () => {
    expect(bloqueQueSeSuperpone(franja(martes("15:59"), 60), [MARTES])).toEqual(MARTES);
  });
});

describe("§3 · Detecta lo que tiene que detectar", () => {
  it("empezar en el medio de la clase", () => {
    expect(bloqueQueSeSuperpone(franja(martes("14:30")), [MARTES])).toEqual(MARTES);
  });

  it("y contenerla entera", () => {
    expect(bloqueQueSeSuperpone(franja(martes("13:00"), 240), [MARTES])).toEqual(MARTES);
  });

  it("el mismo horario otro día NO es conflicto", () => {
    // El bloque es semanal: la clase del martes no ocupa el miércoles.
    expect(bloqueQueSeSuperpone(franja("2026-09-09T14:30:00.000-03:00"), [MARTES])).toBeNull();
  });

  it("una franja que cruza la medianoche alcanza el día siguiente", () => {
    // Domingo 23:00 + 4 h llega al lunes a las 3. Si sólo se mirara el día del
    // inicio, la clase del lunes temprano no se vería.
    const lunesTemprano: BloqueSemanal = { dia: 1, desde: "01:00:00", hasta: "03:00:00" };
    const domingoNoche = "2026-09-13T23:00:00.000-03:00";
    expect(bloqueQueSeSuperpone(franja(domingoNoche, 240), [lunesTemprano])).toEqual(lunesTemprano);
  });

  it("devuelve el bloque que pisa, no sólo que pisa", () => {
    // La ruta necesita poder decir CUÁNDO es la clase: «no se puede» sin el
    // hecho no le sirve a nadie.
    const jueves: BloqueSemanal = { dia: 4, desde: "18:00:00", hasta: "21:00:00" };
    expect(bloqueQueSeSuperpone(franja(martes("14:30")), [jueves, MARTES])).toEqual(MARTES);
  });
});

describe("§4 · La propuesta esquiva la clase", () => {
  it("salta al final del bloque, redondeado", () => {
    // 14:30 cae en la clase; la siguiente media hora libre es 16:00.
    expect(primerInicioSinClase(franja(martes("14:30")), [MARTES])).toBe(
      new Date(martes("16:00")).toISOString(),
    );
  });

  it("un horario libre no se mueve", () => {
    expect(primerInicioSinClase(franja(martes("10:00")), [MARTES])).toBe(
      new Date(martes("10:00")).toISOString(),
    );
  });

  it("salta dos clases pegadas de una vez", () => {
    const seguida: BloqueSemanal = { dia: 2, desde: "16:00:00", hasta: "18:00:00" };
    expect(primerInicioSinClase(franja(martes("14:30")), [MARTES, seguida])).toBe(
      new Date(martes("18:00")).toISOString(),
    );
  });

  it("y lo que devuelve nunca vuelve a dar conflicto", () => {
    // La propiedad que importa: si la propuesta se corrigió, el servidor no la
    // puede rechazar. Ofrecer algo que el backend rechaza es el defecto que
    // ADR-050 ya corrigió una vez.
    const salida = primerInicioSinClase(franja(martes("14:30")), [MARTES]);
    expect(bloqueQueSeSuperpone(franja(salida), [MARTES])).toBeNull();
  });
});

describe("§5 · El selector de horarios no ofrece lo que el servidor rechaza", () => {
  const base = {
    estado: "CONFIRMED" as const,
    renegociadoDeId: null,
    inicioOriginal: martes("20:00"),
    ahora: martes("10:00"),
    zonaInstitucional: CBA,
  };

  it("sin bloques ofrece lo mismo de siempre", () => {
    const sin = cambioDeHorarioPosible(base);
    const con = cambioDeHorarioPosible({ ...base, bloques: [], minutos: 60 });
    expect(con).toEqual(sin);
  });

  it("con una clase encima, esas franjas desaparecen", () => {
    const r = cambioDeHorarioPosible({ ...base, bloques: [MARTES], minutos: 60 });
    expect(r.sePuede).toBe(true);
    if (!r.sePuede) return;
    // Ninguna franja ofrecida se pisa con la clase.
    for (const inicio of r.horarios) {
      expect(bloqueQueSeSuperpone(franja(inicio, 60), [MARTES])).toBeNull();
    }
    // Y sigue habiendo horarios: filtrar no es vaciar.
    expect(r.horarios.length).toBeGreaterThan(0);
  });

  it("sin duración no filtra nada: no se adivina cuánto dura", () => {
    const r = cambioDeHorarioPosible({ ...base, bloques: [MARTES] });
    expect(r).toEqual(cambioDeHorarioPosible(base));
  });
});

describe("§6 · La regla viaja con su versión", () => {
  it("está declarada", () => {
    // Como `REGLA_DE_DURACION` y `REGLA_DE_VENTANA`: cambiarla no reescribe
    // compromisos viejos, y para eso hay que poder nombrarla.
    expect(REGLA_DE_SUPERPOSICION).toBe("superposicion-v1");
  });
});

describe("§7 · El Service rechaza, y lo dice como estado de producto", () => {
  it("confirmar sobre una clase no escribe nada", async () => {
    const { confirmarCompromiso } = await import("@/lib/server/servicios/compromiso");
    let creados = 0;
    const repo = {
      huellaDeClave: async () => null,
      crearConfirmado: async () => {
        creados++;
        throw new Error("no debería llegar acá");
      },
    };
    const eventos = { publicados: [] as unknown[], publicar: async (e: unknown) => { eventos.publicados.push(e); } };

    const r = await confirmarCompromiso(
      { repo, eventos },
      "inst",
      {
        actionId: "a", estudianteId: "e", startAt: martes("14:30"),
        timezone: CBA, plannedMinutes: 60, claveDeIdempotencia: "k",
      },
      { zonaInstitucional: CBA, bloques: [MARTES] },
    );

    expect(r).toEqual({ estado: "CONFLICTO_DE_HORARIO", bloque: MARTES });
    // **No es sólo que devuelva el estado: es que no escribió.** «No confirmar
    // silenciosamente» tiene que significar no confirmar.
    expect(creados).toBe(0);
    expect(eventos.publicados).toHaveLength(0);
  });

  it("y la idempotencia va ANTES que la regla", async () => {
    const { confirmarCompromiso } = await import("@/lib/server/servicios/compromiso");
    const compromiso = {
      id: "c1", institutionId: "inst", state: "CONFIRMED" as const, actionId: "a",
      rescuesCommitmentId: null, renegotiatedFromId: null, scheduledFor: martes("14:30"),
    };
    const repo = {
      huellaDeClave: async () => ({
        compromiso, estudianteId: "e", startAt: martes("14:30"),
        timezone: CBA, plannedMinutes: 60,
      }),
      crearConfirmado: async () => { throw new Error("no debería llegar acá"); },
    };

    // Un reintento del mismo pedido devuelve la fila que ya existe, **aunque el
    // horario ahora choque**: si el horario de clase se cargó en el medio, la
    // respuesta a «¿lo creaste?» sigue siendo sí. Reevaluar la regla acá
    // convertiría un reintento en un rechazo de algo que ya pasó.
    const r = await confirmarCompromiso(
      { repo, eventos: { publicar: async () => {} } },
      "inst",
      {
        actionId: "a", estudianteId: "e", startAt: martes("14:30"),
        timezone: CBA, plannedMinutes: 60, claveDeIdempotencia: "k",
      },
      { zonaInstitucional: CBA, bloques: [MARTES] },
    );

    expect(r).toEqual({ estado: "OK", compromiso, duplicado: true });
  });
});

describe("§8 · El conflicto no se disfraza de otra cosa", () => {
  const RAIZ = process.cwd();
  const leer = async (p: string) =>
    (await import("node:fs")).readFileSync((await import("node:path")).resolve(RAIZ, p), "utf8");

  it("`renegociarCompromiso` le da su propio caso, antes del `default`", async () => {
    /*
      **El defecto que esto caza ya estaba escrito.** El `switch` termina en
      `default: return { estado: "CONFLICTO" }`, así que un conflicto de horario
      salía por el catch-all como «ese compromiso cambió de estado» — que no
      cambió, y el estudiante habría recargado la pantalla para encontrarla
      igual. Y como hay `default`, **el compilador no lo señala**: por eso hay
      guard y no confianza en `tsc`.
    */
    const fuente = await leer("lib/server/composicion.ts");
    // Sólo dentro de `renegociarCompromiso`: el archivo tiene otros `switch` y
    // otros `default`, y compararlos entre sí no diría nada.
    const desde = fuente.indexOf("export async function renegociarCompromiso");
    expect(desde).toBeGreaterThan(-1);
    const cuerpo = fuente.slice(desde, fuente.indexOf("\n}", desde));

    const caso = cuerpo.indexOf('case "CONFLICTO_DE_HORARIO"');
    const fallback = cuerpo.indexOf("default:");
    expect(caso).toBeGreaterThan(-1);
    expect(fallback).toBeGreaterThan(-1);
    expect(caso).toBeLessThan(fallback);
  });

  it("las dos rutas explican el conflicto con la misma función", async () => {
    // Si cada una armara su frase, el mismo hecho se contaría distinto según
    // por dónde entró — y una de las dos envejecería sola.
    for (const ruta of ["app/api/compromiso/route.ts", "app/api/renegociacion/route.ts"]) {
      const fuente = await leer(ruta);
      expect(fuente).toContain("textoDeClase(resultado.bloque)");
      expect(fuente).toContain('motivo: "CONFLICTO_DE_HORARIO"');
    }
  });

  it("y el `409` lleva el hecho, no sólo la negativa", async () => {
    const { textoDeClase } = await import("@/lib/content/es-AR");
    // «No se puede» sin decir contra qué choca no le sirve a nadie: ADR-064
    // pide **mostrar el conflicto**.
    expect(textoDeClase(MARTES)).toBe("el martes de 14:00 a 16:00");
  });

  it("un día que no nombra ningún día no arma media frase", async () => {
    const { textoDeClase } = await import("@/lib/content/es-AR");
    expect(textoDeClase({ ...MARTES, dia: 9 })).toBeNull();
  });
});
