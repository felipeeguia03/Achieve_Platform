import { describe, expect, it } from "vitest";

import {
  ingerirMateria,
  validarFuente,
  validarGuia,
  type GuiaDeMateria,
  type RepositorioDeIngesta,
} from "@/lib/server/servicios/ingesta";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";

/** Fase B2b — ingesta del ADL ([ADR-023](../docs/decisions.md#adr-023)). */

const GUIA: GuiaDeMateria = {
  fuente: {
    tipo: "public_web",
    referencia: "https://facultad.example/programa.pdf",
    observadoEn: "2026-08-30T12:00:00.000Z",
    confianza: 0.6,
  },
  curso: { codigo: "SYN-9", nombre: "Materia SYN" },
  cursada: { periodo: "2026-2" },
  unidades: [{ nombre: "Unidad 1", orden: 1 }, { nombre: "Unidad 2", orden: 2 }],
  prerequisitos: [{ unidad: "Unidad 2", requiere: "Unidad 1" }],
  evaluaciones: [{ tipo: "parcial", titulo: "Parcial 1", fecha: "2026-09-15" }],
};

function falso(opciones: { institucionExiste?: boolean } = {}) {
  const publicados: EventoDeProducto[] = [];
  const ingeridas: GuiaDeMateria[] = [];
  const repo: RepositorioDeIngesta = {
    async existeInstitucion() {
      return opciones.institucionExiste ?? true;
    },
    async ingerirMateria(_inst, guia) {
      ingeridas.push(guia);
      return {
        cursadaId: "off-1",
        unidades: guia.unidades.length,
        evaluaciones: guia.evaluaciones?.length ?? 0,
        clases: guia.clases?.length ?? 0,
      };
    },
  };
  const eventos: PublicadorDeEventos = { async publicar(e) { publicados.push(e); } };
  return { deps: { repo, eventos }, publicados, ingeridas };
}

describe("B2b · sin procedencia no hay ingesta", () => {
  /**
   * Una fuente sin referencia es "lo dijo alguien": no se puede volver a mirar,
   * y por lo tanto **no se puede corroborar nunca**. Un dato así queda
   * `unverified` para siempre sin camino de salida.
   */
  it("una fuente sin referencia concreta se rechaza", () => {
    expect(validarFuente({ ...GUIA.fuente, referencia: "  " })).toMatch(/referencia/);
  });

  it("una confianza fuera de 0..1 se rechaza, y NaN también", () => {
    expect(validarFuente({ ...GUIA.fuente, confianza: 1.5 })).toMatch(/confianza/);
    expect(validarFuente({ ...GUIA.fuente, confianza: Number.NaN })).toMatch(/confianza/);
  });

  it("sin confianza declarada se acepta: no se asume alta", () => {
    expect(validarFuente({ ...GUIA.fuente, confianza: undefined })).toBeNull();
  });

  it("el Service no llega al repositorio si la fuente es inválida", async () => {
    const { deps, ingeridas } = falso();
    const r = await ingerirMateria(deps, "inst-A", { ...GUIA, fuente: { ...GUIA.fuente, referencia: "" } });
    expect(r.estado).toBe("FUENTE_INVALIDA");
    expect(ingeridas).toEqual([]);
  });
});

describe("B2b · el ingestor no puede declarar autoridad", () => {
  /**
   * `I9`: ninguna capa eleva un `verification_status`. El tipo `Fuente` **no
   * admite** `institution` ni `instructor` — no es que no deba usarlos: no
   * tiene por dónde. Y `verification_status` no es parámetro de nada.
   */
  it("el tipo de fuente no incluye las que afirman autoridad", () => {
    const fuente = readFileSyncSeguro("lib/server/servicios/ingesta.ts");
    const tipos = fuente.slice(fuente.indexOf("tipo:"), fuente.indexOf(";", fuente.indexOf("tipo:")));
    expect(tipos).toContain("public_web");
    expect(tipos).not.toContain('"institution"');
    expect(tipos).not.toContain('"instructor"');
  });

  it("ninguna capa de ingesta menciona `verification_status`", () => {
    expect(readFileSyncSeguro("lib/server/servicios/ingesta.ts")).not.toMatch(
      /verification_status\s*[:=]/,
    );
  });
});

describe("B2b · el orden no es un prerequisito", () => {
  /**
   * `topic_prerequisite` existe para que los prerequisitos sean **explícitos**.
   * Derivarlos de `sequence` sería inventar una regla académica que nadie
   * declaró: que la Unidad 2 vaya después de la 1 no dice que la necesite.
   */
  it("un prerequisito hacia una unidad que no está en la guía se rechaza", () => {
    expect(
      validarGuia({ ...GUIA, prerequisitos: [{ unidad: "Unidad 2", requiere: "Unidad 7" }] }),
    ).toMatch(/no está en la guía/);
  });

  it("una unidad no es prerequisito de sí misma", () => {
    expect(
      validarGuia({ ...GUIA, prerequisitos: [{ unidad: "Unidad 1", requiere: "Unidad 1" }] }),
    ).toMatch(/sí misma/);
  });

  it("sin prerequisitos declarados, no se infiere ninguno", async () => {
    const { deps, ingeridas } = falso();
    await ingerirMateria(deps, "inst-A", { ...GUIA, prerequisitos: undefined });
    expect(ingeridas[0].prerequisitos).toBeUndefined();
  });
});

describe("B2b · la guía tiene que aportar conocimiento", () => {
  it("una materia sin unidades se rechaza", () => {
    expect(validarGuia({ ...GUIA, unidades: [] })).toMatch(/sin unidades/);
  });

  it("unidades repetidas se rechazan", () => {
    expect(
      validarGuia({ ...GUIA, unidades: [{ nombre: "U" }, { nombre: "U" }] }),
    ).toMatch(/repetidas/);
  });
});

describe("B2b · la institución tiene que existir", () => {
  it("no se crea sola desde una ingesta", async () => {
    const { deps, ingeridas } = falso({ institucionExiste: false });
    const r = await ingerirMateria(deps, "inst-X", GUIA);
    expect(r.estado).toBe("INSTITUCION_DESCONOCIDA");
    expect(ingeridas).toEqual([]);
  });
});

describe("B2b · el hecho queda registrado con su fuente", () => {
  it("publica de dónde salió el material", async () => {
    const { deps, publicados } = falso();
    const r = await ingerirMateria(deps, "inst-A", GUIA, "actor-1");
    expect(r).toMatchObject({ estado: "OK", unidades: 2, evaluaciones: 1 });
    expect(publicados[0]).toMatchObject({
      nombre: "AcademicDataIngested",
      causa: "public_web:https://facultad.example/programa.pdf",
    });
  });
});

describe("Las sesiones del libro de temas (ADR-068 y ADR-069)", () => {
  const CON_CLASES = {
    ...GUIA,
    clases: [{ fecha: "2026-03-16", hora: "13:00", minutos: 120, corrida: "practico" as const, temas: [GUIA.unidades[0].nombre] }],
    cargaHoraria: { minutos: 3600, texto: "60 horas" },
  };

  it("una guía con clases y carga horaria pasa la validación", () => {
    expect(validarGuia(CON_CLASES)).toBeNull();
  });

  it("una clase que cita una unidad que no está en la guía se rechaza", () => {
    // La función de base la ignora en silencio; acá se dice, porque un vínculo
    // colgado en la ingesta es material mal leído, no un caso del mundo.
    const r = validarGuia({ ...CON_CLASES, clases: [{ fecha: "2026-03-16", temas: ["Unidad fantasma"] }] });
    expect(r).toContain("que no está en la guía");
  });

  it("una clase de cero minutos se rechaza: no es una clase corta", () => {
    expect(validarGuia({ ...CON_CLASES, clases: [{ fecha: "2026-03-16", minutos: 0 }] })).toContain(
      "cero minutos",
    );
  });

  it("una clase sin duración es legítima: NULL es desconocido", () => {
    // Es el caso de las 12 materias del corpus sin `Horario:` ni carga horaria.
    expect(validarGuia({ ...CON_CLASES, clases: [{ fecha: "2026-03-16" }] })).toBeNull();
  });

  it("la carga horaria necesita el texto literal que se leyó", () => {
    // Un total sin fuente es un número que nadie puede auditar. El CHECK de la
    // base lo exige igual; acá el error se entiende.
    expect(validarGuia({ ...CON_CLASES, cargaHoraria: { minutos: 3600, texto: "  " } })).toContain(
      "el texto que se leyó",
    );
  });

  it("el tipo de clase es opcional, y ausente NO se inventa", () => {
    // ADR-069: el importador no clasifica. La guía trae `tipo` sólo si una
    // persona lo confirmó, y el 25% de falsos positivos medidos es el motivo.
    const sinTipo = { ...CON_CLASES, clases: [{ fecha: "2026-03-16", minutos: 120 }] };
    expect(validarGuia(sinTipo)).toBeNull();
    expect(sinTipo.clases[0]).not.toHaveProperty("tipo");
  });

  it("una guía sin clases sigue siendo válida: son opcionales", () => {
    expect(validarGuia(GUIA)).toBeNull();
  });
});

function readFileSyncSeguro(ruta: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("node:fs").readFileSync(require("node:path").resolve(process.cwd(), ruta), "utf8");
}

describe("La carga de estudio declarada (ADR-075 §D)", () => {
  const CON_ESTUDIO = {
    ...GUIA,
    cargaHoraria: { minutos: 3600, texto: "60 horas" },
    cargaDeEstudio: { minutos: 5400, texto: "trabajo autónomo: 90 horas" },
  };

  it("una guía con las dos cargas pasa la validación", () => {
    expect(validarGuia(CON_ESTUDIO)).toBeNull();
  });

  it("la carga de estudio también necesita su texto literal", () => {
    // §D: *"guardar siempre la fuente y versión de la estimación"*. Un número
    // sin fuente es un número que nadie puede auditar.
    expect(
      validarGuia({ ...CON_ESTUDIO, cargaDeEstudio: { minutos: 5400, texto: "  " } }),
    ).toContain("el texto que se leyó");
  });

  it("es opcional: la mayoría de los programas no la declaran", () => {
    expect(validarGuia({ ...GUIA, cargaHoraria: { minutos: 3600, texto: "60 horas" } })).toBeNull();
  });
});
