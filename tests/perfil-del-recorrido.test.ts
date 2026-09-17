import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { copy } from "@/lib/content/es-AR";
import type { RecorridoLeido, ResultadoLeido } from "@/lib/domain/analitico";
import {
  elegirPreguntas,
  estadoDeHipotesis,
  hipotesisDeRespuesta,
  motivoDeRespuestaInvalida,
  OPCIONES,
  preguntasPosibles,
  PREGUNTAS_MAXIMAS,
  type Disparador,
  type Pregunta,
  type ResultadoParaPreguntar,
} from "@/lib/domain/preguntas-de-recorrido";
import { perfilDelRecorrido, responderPregunta, type DependenciasDelPerfil } from "@/lib/server/servicios/perfil";

/**
 * Las preguntas del recorrido y las hipótesis — [ADR-107](../docs/decisions.md#adr-107).
 */

const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

let n = 0;
const r = (materia: string, estado: ResultadoParaPreguntar["estado"], fecha: string, nota: number | null = null): ResultadoParaPreguntar => ({
  id: `e-${++n}`,
  requisitoId: `req-${materia}`,
  materia,
  estado,
  nota,
  fecha,
});

/** Un recorrido con cada patrón una vez. */
const HISTORIA: ResultadoParaPreguntar[] = [
  // Recuperación
  r("Análisis I", "FAILED", "2022-07-10", 2), r("Análisis I", "APPROVED", "2022-12-10", 7),
  // Persistencia
  r("Física I", "FAILED", "2022-07-10", 3), r("Física I", "FAILED", "2022-12-10", 3), r("Física I", "APPROVED", "2023-03-10", 6),
  // Materia actual con un intento previo
  r("Álgebra", "FAILED", "2025-12-10"),
  // Fortalezas
  r("Programación I", "APPROVED", "2023-12-10", 10), r("Programación II", "APPROVED", "2024-07-10", 9), r("Sistemas", "PROMOTED", "2024-12-10", 9),
  // Años: 2022 (1), 2023 (2), 2024 (2)… con otro año flojo
  r("Química", "APPROVED", "2023-07-10", 6), r("Inglés", "APPROVED", "2024-12-10", 8),
  r("Ética", "APPROVED", "2025-07-10", 8), r("Historia", "APPROVED", "2025-12-10", 7), r("Lógica", "APPROVED", "2025-12-12", 7),
];
const CURSADOS = new Set(["req-Álgebra"]);

describe("RECORRIDO-v0.1 · qué se pregunta", () => {
  const posibles = preguntasPosibles(HISTORIA, CURSADOS);
  const por = (d: Disparador) => posibles.filter((p) => p.disparador === d);

  it("sólo se pregunta con evidencia: sin analítico no hay ninguna", () => {
    expect(preguntasPosibles([], new Set())).toEqual([]);
  });

  it("reconoce cada patrón una vez, sobre la materia que lo sostiene", () => {
    expect(por("MATERIA_ACTUAL").map((p) => p.valores.materias)).toEqual([["Álgebra"]]);
    expect(por("RECUPERACION").map((p) => p.valores.materias)).toEqual([["Análisis I"]]);
    expect(por("PERSISTENCIA").map((p) => p.valores.materias)).toEqual([["Física I"]]);
    expect(por("FORTALEZA")[0].valores.materias).toEqual(["Programación I", "Sistemas", "Programación II"]); // nota, y a igual nota la más reciente
    expect(por("CALIBRACION")[0].opciones.at(-1)).toEqual({ valor: "NINGUNA" });
  });

  it("una materia actual sin tropiezo previo no dispara la pregunta de materia actual", () => {
    expect(preguntasPosibles([r("Álgebra", "APPROVED", "2024-01-01", 7)], CURSADOS).filter((p) => p.disparador === "MATERIA_ACTUAL")).toEqual([]);
  });

  it("es determinista: las mismas filas dan las mismas preguntas, en el mismo orden", () => {
    const otra = preguntasPosibles([...HISTORIA].reverse(), CURSADOS);
    expect(elegirPreguntas(otra).map((p) => p.clave)).toEqual(elegirPreguntas(posibles).map((p) => p.clave));
  });

  it("la clave no depende del documento: una versión nueva conserva la respuesta si el patrón sigue", () => {
    expect(por("RECUPERACION")[0].clave).toBe("RECUPERACION:req-Análisis I");
  });
});

describe("RECORRIDO-v0.1 · cuántas y cuáles", () => {
  const posibles = preguntasPosibles(HISTORIA, CURSADOS);

  it("objetivo 3, máximo 5", () => {
    expect(elegirPreguntas(posibles)).toHaveLength(3);
    expect(elegirPreguntas(posibles, 99)).toHaveLength(Math.min(PREGUNTAS_MAXIMAS, posibles.length));
  });

  it("no todas son de dificultad: si hay una de fortaleza o calibración, entra", () => {
    const soloDificultad = posibles.filter((p) => p.tipo === "DIFICULTAD");
    const conUnaPositiva = [...soloDificultad, ...posibles.filter((p) => p.disparador === "CALIBRACION")];
    const elegidas = elegirPreguntas(conUnaPositiva);
    expect(elegidas.some((p) => p.tipo === "FORTALEZA" || p.tipo === "CALIBRACION")).toBe(true);
  });

  it("una materia no se pregunta dos veces", () => {
    const elegidas = elegirPreguntas(posibles, 5).filter((p) => p.disparador !== "CALIBRACION");
    const materias = elegidas.flatMap((p) => p.requisitos);
    expect(new Set(materias).size).toBe(materias.length);
  });
});

describe("las respuestas: saltear siempre se puede", () => {
  const recuperacion = preguntasPosibles(HISTORIA, CURSADOS).find((p) => p.disparador === "RECUPERACION")!;
  const calibracion = preguntasPosibles(HISTORIA, CURSADOS).find((p) => p.disparador === "CALIBRACION")!;
  const resp = (estado: "ANSWERED" | "UNSURE" | "PREFER_NOT_TO_SAY" | "SKIPPED", opciones: string[] = [], texto: string | null = null) => ({ clave: "x", estado, opciones, texto });

  it("saltear, no saber y preferir no responder son respuestas completas", () => {
    for (const e of ["UNSURE", "PREFER_NOT_TO_SAY", "SKIPPED"] as const) expect(motivoDeRespuestaInvalida(recuperacion, resp(e))).toBeNull();
  });
  it("una opción que no es de la pregunta se rechaza; «ninguna» no va con otras", () => {
    expect(motivoDeRespuestaInvalida(recuperacion, resp("ANSWERED", ["INVENTADA"]))).not.toBeNull();
    expect(motivoDeRespuestaInvalida(calibracion, resp("ANSWERED", ["NINGUNA", calibracion.opciones[0].valor]))).not.toBeNull();
  });

  it("respondida: hipótesis declaradas, MEDIA, y el texto libre no se convierte en hipótesis", () => {
    const h = hipotesisDeRespuesta(recuperacion, resp("ANSWERED", ["CAMBIE_METODO", "EXAMEN_FAVORABLE"], "trabajaba mucho"));
    expect(h).toEqual([expect.objectContaining({ dimension: "ESTRATEGIA_QUE_FUNCIONO", evidencia: "HISTORICO_Y_DECLARADO", confianza: "MEDIA", plantilla: "PERFIL.RECUPERACION.CAMBIE_METODO" })]);
    expect(JSON.stringify(h)).not.toContain("trabajaba");
  });
  it("salteada: sólo el hecho del analítico, BAJA; preferir no responder: ninguna", () => {
    expect(hipotesisDeRespuesta(recuperacion, resp("SKIPPED"))).toEqual([expect.objectContaining({ evidencia: "HISTORICO", confianza: "BAJA" })]);
    expect(hipotesisDeRespuesta(recuperacion, resp("PREFER_NOT_TO_SAY"))).toEqual([]);
  });
  it("ninguna hipótesis del onboarding es de confianza alta", () => {
    for (const p of preguntasPosibles(HISTORIA, CURSADOS)) {
      for (const o of OPCIONES[p.disparador]) {
        for (const h of hipotesisDeRespuesta(p, resp("ANSWERED", [o]))) expect(h.confianza).not.toBe("ALTA");
      }
    }
  });
});

describe("ADR-107 §6 · la vigencia se deduce", () => {
  it("rechazada gana; si la pregunta ya no sale, queda sin vigencia; si sale, vigente", () => {
    const vigentes = new Set(["A"]);
    expect(estadoDeHipotesis({ estado: "RECHAZADA", clave: "A" }, vigentes)).toBe("RECHAZADA");
    expect(estadoDeHipotesis({ estado: "VIGENTE", clave: "B" }, vigentes)).toBe("SIN_VIGENCIA");
    expect(estadoDeHipotesis({ estado: "VIGENTE", clave: "A" }, vigentes)).toBe("VIGENTE");
  });
});

describe("el Service del perfil", () => {
  function recorridoCon(resultados: ResultadoParaPreguntar[], confirmado = true): RecorridoLeido {
    return {
      consentimiento: { decision: "GRANTED", version: "v", en: "x" },
      ultimoFallido: null,
      documentosAnteriores: 0,
      documento: {
        id: "doc", subidoEn: "x", confirmadoEn: confirmado ? "x" : null, tipo: "application/pdf", paginas: 1,
        resultados: resultados.map<ResultadoLeido>((x, i) => ({
          id: x.id, ordinal: i + 1, crudo: { nombre: x.materia, codigo: null, estado: null, nota: null, fecha: null, periodo: null },
          estado: x.estado, nota: x.nota, fecha: x.fecha, requisitoId: x.requisitoId, requisito: x.materia, anio: 1, materiaId: null,
          regla: "CODE", revision: "AUTO",
        })),
      },
      requisitos: [],
    };
  }
  function deps(rec: RecorridoLeido) {
    const guardadas: { respuesta: Record<string, unknown>; hipotesis: readonly Record<string, unknown>[] }[] = [];
    const eventos: { nombre: string; payload?: Record<string, unknown> }[] = [];
    const d: DependenciasDelPerfil = {
      recorrido: async () => rec,
      repo: {
        perfil: async () => ({ respuestas: [], hipotesis: [], requisitosCursados: ["req-Álgebra"] }),
        responder: async (_i, _s, respuesta, hipotesis) => { guardadas.push({ respuesta, hipotesis }); return "ans-1"; },
        rechazar: async () => true,
      },
      eventos: { publicar: async (e) => { eventos.push(e); } },
    };
    return { d, guardadas, eventos };
  }

  it("sin recorrido confirmado no hay preguntas", async () => {
    const { d } = deps(recorridoCon(HISTORIA, false));
    expect((await perfilDelRecorrido(d, "i", "s")).preguntas).toEqual([]);
  });

  it("las preguntas se redactan con copy aprobada y sin veredictos", async () => {
    const { d } = deps(recorridoCon(HISTORIA));
    const perfil = await perfilDelRecorrido(d, "i", "s");
    expect(perfil.preguntas.length).toBeGreaterThan(0);
    for (const p of perfil.preguntas) {
      expect(p.texto).not.toMatch(/\{|\}/);
      expect(p.texto).not.toMatch(/fracas|por qué no|malo|problema de/i);
    }
  });

  it("responder guarda la declaración y, APARTE, las hipótesis ya redactadas; el evento no lleva qué contestó", async () => {
    const { d, guardadas, eventos } = deps(recorridoCon(HISTORIA));
    const pregunta = (await perfilDelRecorrido(d, "i", "s")).preguntas.find((p) => p.disparador === "RECUPERACION")!;
    const res = await responderPregunta(d, "i", "s", { clave: pregunta.clave, estado: "ANSWERED", opciones: ["BUSQUE_AYUDA"], textoLibre: "mi texto privado" });
    expect(res).toEqual({ estado: "OK", hipotesis: 1 });
    expect(guardadas[0].respuesta).toMatchObject({ estado: "ANSWERED", opciones: ["BUSQUE_AYUDA"], textoLibre: "mi texto privado", regla: "RECORRIDO-v0.1" });
    expect(guardadas[0].hipotesis[0].enunciado).toBe("Nos contaste que en Análisis I buscar ayuda te ayudó a aprobar.");
    expect(JSON.stringify(eventos)).not.toMatch(/BUSQUE_AYUDA|mi texto privado|Análisis/);
  });

  it("no se contesta una pregunta que el analítico de hoy no hace", async () => {
    const { d, guardadas } = deps(recorridoCon(HISTORIA));
    expect(await responderPregunta(d, "i", "s", { clave: "RECUPERACION:inventada", estado: "SKIPPED", opciones: [], textoLibre: null })).toEqual({ estado: "NO_DISPONIBLE" });
    expect(guardadas).toEqual([]);
  });
});

describe("la copy del perfil", () => {
  const perfil = Object.entries(copy).filter(([k]) => k.startsWith("PERFIL."));

  it("toda plantilla y toda opción que la regla puede pedir existe", () => {
    const pregunta = (d: Disparador): Pregunta => ({ clave: d, disparador: d, tipo: "DIFICULTAD", valores: { materias: ["M"], anio: 2024 }, requisitos: ["r"], resultados: [], opciones: OPCIONES[d].map((valor) => ({ valor })), multiple: true });
    for (const d of Object.keys(OPCIONES) as Disparador[]) {
      expect(copy, d).toHaveProperty(`PERFIL.PREGUNTA.${d}`);
      for (const o of OPCIONES[d]) {
        expect(copy, o).toHaveProperty(`PERFIL.OPCION.${o}`);
        for (const h of hipotesisDeRespuesta(pregunta(d), { clave: d, estado: "ANSWERED", opciones: [o], texto: null })) {
          expect(copy, h.plantilla).toHaveProperty(h.plantilla);
        }
      }
      for (const h of hipotesisDeRespuesta(pregunta(d), { clave: d, estado: "SKIPPED", opciones: [], texto: null })) {
        expect(copy, h.plantilla).toHaveProperty(h.plantilla);
      }
    }
  });

  it("ninguna frase etiqueta a la persona ni la acusa (ADR-107 §5)", () => {
    for (const [k, v] of perfil) {
      expect(String(v), k).not.toMatch(/\bsos (bueno|malo|mala|buena)\b|tenés un problema|fracas|por qué no te|poco constante|de riesgo|perfil débil|te funciona|tu método/i);
    }
  });

  it("toda hipótesis se redacta como lo que es: «nos contaste/dijiste» o «en tu analítico»", () => {
    for (const [k, v] of perfil.filter(([k]) => /^PERFIL\.(HECHO|CALIBRACION_|MATERIA_ACTUAL\.|RECUPERACION\.|PERSISTENCIA\.|CAMBIO_DE_PERIODO\.|FORTALEZA\.)/.test(k))) {
      expect(String(v), k).toMatch(/^(Nos contaste|Nos dijiste|En tu analítico)/);
    }
  });
});

describe("las ausencias que protege ADR-107", () => {
  function fuentes(dir: string): string[] {
    return readdirSync(dir).flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? fuentes(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
    });
  }

  it("el ADE, Hoy, el riesgo y el reparto no leen el perfil ni el analítico", () => {
    const lectores = [
      "lib/domain/ade.ts",
      "lib/domain/precedence.ts",
      "lib/domain/riesgos-de-planificacion.ts",
      "lib/domain/reparto.ts",
      "lib/server/servicios/motor.ts",
      "lib/server/servicios/riesgo.ts",
      "lib/server/servicios/proyeccion-hoy.ts",
      "lib/server/servicios/proyeccion-tablero.ts",
    ];
    for (const p of lectores) {
      expect(LEER(p), p).not.toMatch(/preguntas-de-recorrido|servicios\/perfil|repositorios\/perfil|analitico|profile_hypothesis|profile_answer/);
    }
  });

  it("el seam del Personal Engine existe y no tiene llamadores fuera de la composición", () => {
    const usos = fuentes("lib").concat(fuentes("app"), fuentes("components"))
      .filter((p) => !p.endsWith("lib/server/composicion.ts"))
      .filter((p) => LEER(p).includes("hipotesisVigentesDelEstudiante"));
    expect(usos).toEqual([]);
  });

  it("las respuestas son append-only y las hipótesis nunca son de confianza alta, en la base", () => {
    const sql = LEER("supabase/migrations/20261104000000_perfil_del_recorrido.sql").replace(/^\s*--.*$/gm, "");
    expect(sql).toMatch(/REVOKE UPDATE ON profile_answer FROM service_role/);
    expect(sql).toMatch(/confidence\s+TEXT NOT NULL CHECK \(confidence IN \('BAJA','MEDIA'\)\)/);
    expect(sql).not.toMatch(/INSERT INTO (course_enrollment|action|topic_progress|risk_signal)/);
  });
});
