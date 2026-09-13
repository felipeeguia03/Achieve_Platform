/**
 * Modo Clase, corte 3 — el Service · [ADR-098](../docs/decisions.md#adr-098).
 *
 * El repositorio en memoria imita **las dos garantías de la base** —una sola
 * activa por estudiante y la clave única por clase— para poder probar qué hace
 * el Service cuando la base le gana una carrera. Contra Postgres, lo mismo lo
 * prueba `scripts/db-aislamiento.sh`.
 */
import { describe, expect, it } from "vitest";

import {
  completarMarca,
  guardarApuntes,
  iniciarClase,
  marcar,
  terminarClase,
  type ClaseFila,
  type Dependencias,
  type MarcaFila,
  type RepositorioDeClases,
} from "@/lib/server/servicios/clase";
import type { EventoDeProducto } from "@/lib/server/servicios/eventos";

const INST = "inst-a";
const ANA = "est-ana";
const BETO = "est-beto";

function mundo(opciones: { carreraEnCrear?: boolean; carreraEnMarca?: boolean } = {}) {
  const clases: ClaseFila[] = [];
  const marcas: MarcaFila[] = [];
  const eventos: EventoDeProducto[] = [];
  const cursadas: Record<string, string> = { "cur-analisis": ANA, "cur-fisica": ANA, "cur-beto": BETO };
  const bloques: Record<string, { cursada: string; desde: string; hasta: string }> = {
    "blq-analisis": { cursada: "cur-analisis", desde: "08:00:00", hasta: "10:00:00" },
  };
  let reloj = Date.parse("2026-09-17T11:00:00Z");
  let n = 0;

  const repo: RepositorioDeClases = {
    async cursadaPropia(_i, studentId, cursadaId) {
      return cursadas[cursadaId] === studentId;
    },
    async horarioDeBloque(_i, cursadaId, bloqueId) {
      const b = bloques[bloqueId];
      return b && b.cursada === cursadaId ? { desde: b.desde, hasta: b.hasta } : null;
    },
    async activa(_i, studentId) {
      return clases.find((c) => c.studentId === studentId && c.estado === "ACTIVE") ?? null;
    },
    async delEstudiante(_i, studentId, claseId) {
      return clases.find((c) => c.id === claseId && c.studentId === studentId) ?? null;
    },
    async crear(_i, datos) {
      if (opciones.carreraEnCrear) {
        // Otro pedido entró primero, entre la lectura y la escritura.
        opciones.carreraEnCrear = false;
        clases.push(fila({ studentId: datos.studentId, cursadaId: datos.cursadaId }));
        return null;
      }
      if (clases.some((c) => c.studentId === datos.studentId && c.estado === "ACTIVE")) return null;
      const c = fila({ studentId: datos.studentId, cursadaId: datos.cursadaId, bloqueId: datos.bloqueId, horarioDesde: datos.desde, horarioHasta: datos.hasta });
      clases.push(c);
      return c;
    },
    async guardarApuntes(_i, claseId, apuntes, ahora) {
      const c = clases.find((x) => x.id === claseId)!;
      Object.assign(c, { apuntes, apuntesGuardadosEn: ahora });
      return c;
    },
    async terminar(_i, claseId, ahora) {
      const c = clases.find((x) => x.id === claseId && x.estado === "ACTIVE");
      if (!c) return null;
      Object.assign(c, { estado: "ENDED", terminadaEn: ahora });
      return c;
    },
    async marcaPorClave(_i, claseId, clave) {
      return marcas.find((m) => m.claseId === claseId && m.clave === clave) ?? null;
    },
    async crearMarca(_i, datos) {
      if (opciones.carreraEnMarca) {
        opciones.carreraEnMarca = false;
        marcas.push({ id: `m-${++n}`, claseId: datos.claseId, tipo: datos.tipo, segundos: 1, texto: null, clave: datos.clave, creadaEn: iso() });
        return null;
      }
      if (marcas.some((m) => m.claseId === datos.claseId && m.clave === datos.clave)) return null;
      const m = { id: `m-${++n}`, ...datos, creadaEn: iso() };
      marcas.push(m);
      return m;
    },
    async marcaDelEstudiante(_i, studentId, marcaId) {
      const m = marcas.find((x) => x.id === marcaId);
      const c = m && clases.find((x) => x.id === m.claseId);
      return m && c?.studentId === studentId ? m : null;
    },
    async guardarTextoDeMarca(_i, marcaId, texto) {
      const m = marcas.find((x) => x.id === marcaId)!;
      m.texto = texto;
      return m;
    },
  };

  function iso() {
    return new Date(reloj).toISOString();
  }
  function fila(p: Partial<ClaseFila> & Pick<ClaseFila, "studentId" | "cursadaId">): ClaseFila {
    return {
      id: `cl-${++n}`, bloqueId: null, horarioDesde: null, horarioHasta: null, estado: "ACTIVE",
      iniciadaEn: iso(), terminadaEn: null, apuntes: null, apuntesGuardadosEn: null, ...p,
    };
  }

  const d: Dependencias = {
    repo,
    eventos: { async publicar(e) { eventos.push(e); } },
    ahora: iso,
  };
  return { d, clases, marcas, eventos, avanzar: (s: number) => { reloj += s * 1000; } };
}

const iniciar = (d: Dependencias, cursadaId = "cur-analisis", studentId = ANA, bloqueId: string | null = null) =>
  iniciarClase(d, INST, { studentId, cursadaId, bloqueId });

describe("iniciar una clase", () => {
  it("con horario copia el del bloque y publica ClassSessionStarted", async () => {
    const { d, eventos } = mundo();
    const r = await iniciar(d, "cur-analisis", ANA, "blq-analisis");
    expect(r).toMatchObject({ estado: "OK", duplicado: false, clase: { horarioDesde: "08:00:00", horarioHasta: "10:00:00", bloqueId: "blq-analisis" } });
    expect(eventos).toEqual([expect.objectContaining({ nombre: "ClassSessionStarted", actorId: ANA, sujetoTipo: "student_class_session", causa: "horario" })]);
  });

  it("sin bloque es válida: iniciarla a mano", async () => {
    const { d, eventos } = mundo();
    const r = await iniciar(d);
    expect(r).toMatchObject({ estado: "OK", clase: { bloqueId: null, horarioDesde: null } });
    expect(eventos[0].causa).toBe("manual");
  });

  it("repetir sobre la misma materia devuelve la misma clase, sin otro evento", async () => {
    const { d, eventos, clases } = mundo();
    const a = await iniciar(d);
    const b = await iniciar(d);
    expect(b).toMatchObject({ estado: "OK", duplicado: true });
    if (a.estado === "OK" && b.estado === "OK") expect(b.clase.id).toBe(a.clase.id);
    expect(clases).toHaveLength(1);
    expect(eventos).toHaveLength(1);
  });

  it("con otra activa de otra materia no abre una segunda, y devuelve la activa", async () => {
    const { d, clases } = mundo();
    await iniciar(d, "cur-analisis");
    const r = await iniciar(d, "cur-fisica");
    expect(r).toMatchObject({ estado: "YA_HAY_OTRA_ACTIVA", clase: { cursadaId: "cur-analisis" } });
    expect(clases).toHaveLength(1);
  });

  it("la activa de otro estudiante no cuenta", async () => {
    const { d } = mundo();
    await iniciar(d, "cur-beto", BETO);
    expect(await iniciar(d)).toMatchObject({ estado: "OK", duplicado: false });
  });

  it("sobre la cursada de otro, no", async () => {
    const { d, clases } = mundo();
    expect(await iniciar(d, "cur-beto", ANA)).toEqual({ estado: "CURSADA_AJENA" });
    expect(clases).toHaveLength(0);
  });

  it("con un bloque que no es de esa cursada, no", async () => {
    const { d } = mundo();
    expect(await iniciar(d, "cur-fisica", ANA, "blq-analisis")).toEqual({ estado: "BLOQUE_AJENO" });
  });

  it("si la base le gana la carrera, contesta con la que entró, sin evento propio", async () => {
    const { d, eventos, clases } = mundo({ carreraEnCrear: true });
    const r = await iniciar(d);
    expect(r).toMatchObject({ estado: "OK", duplicado: true });
    expect(clases).toHaveLength(1);
    expect(eventos).toHaveLength(0);
  });
});

describe("los apuntes", () => {
  it("se guardan, y siguen siendo editables con la clase terminada", async () => {
    const { d } = mundo();
    const r = await iniciar(d);
    if (r.estado !== "OK") throw new Error();
    expect(await guardarApuntes(d, INST, { studentId: ANA, claseId: r.clase.id, apuntes: "Cambio de variables" }))
      .toMatchObject({ estado: "OK", clase: { apuntes: "Cambio de variables" } });
    await terminarClase(d, INST, { studentId: ANA, claseId: r.clase.id });
    expect(await guardarApuntes(d, INST, { studentId: ANA, claseId: r.clase.id, apuntes: "y el jacobiano" }))
      .toMatchObject({ estado: "OK", clase: { apuntes: "y el jacobiano" } });
  });

  it("los de otro estudiante no existen", async () => {
    const { d } = mundo();
    const r = await iniciar(d, "cur-beto", BETO);
    if (r.estado !== "OK") throw new Error();
    expect(await guardarApuntes(d, INST, { studentId: ANA, claseId: r.clase.id, apuntes: "x" })).toEqual({ estado: "NO_ENCONTRADA" });
  });

  it("un texto por encima del límite técnico se rechaza", async () => {
    const { d } = mundo();
    const r = await iniciar(d);
    if (r.estado !== "OK") throw new Error();
    expect(await guardarApuntes(d, INST, { studentId: ANA, claseId: r.clase.id, apuntes: "x".repeat(50_001) }))
      .toEqual({ estado: "DEMASIADO_LARGO" });
  });
});

describe("terminar", () => {
  it("termina con fecha del servidor y publica ClassSessionEnded", async () => {
    const { d, eventos, avanzar } = mundo();
    const r = await iniciar(d);
    if (r.estado !== "OK") throw new Error();
    avanzar(6420);
    const fin = await terminarClase(d, INST, { studentId: ANA, claseId: r.clase.id });
    expect(fin).toMatchObject({ estado: "OK", duplicado: false, clase: { estado: "ENDED", terminadaEn: "2026-09-17T12:47:00.000Z" } });
    expect(eventos.map((e) => e.nombre)).toEqual(["ClassSessionStarted", "ClassSessionEnded"]);
  });

  it("es idempotente: la segunda vez devuelve la misma y no publica", async () => {
    const { d, eventos } = mundo();
    const r = await iniciar(d);
    if (r.estado !== "OK") throw new Error();
    await terminarClase(d, INST, { studentId: ANA, claseId: r.clase.id });
    expect(await terminarClase(d, INST, { studentId: ANA, claseId: r.clase.id })).toMatchObject({ estado: "OK", duplicado: true });
    expect(eventos.filter((e) => e.nombre === "ClassSessionEnded")).toHaveLength(1);
  });

  it("la de otro estudiante no existe", async () => {
    const { d } = mundo();
    const r = await iniciar(d, "cur-beto", BETO);
    if (r.estado !== "OK") throw new Error();
    expect(await terminarClase(d, INST, { studentId: ANA, claseId: r.clase.id })).toEqual({ estado: "NO_ENCONTRADA" });
  });

  it("con la anterior terminada se puede abrir otra", async () => {
    const { d } = mundo();
    const r = await iniciar(d);
    if (r.estado !== "OK") throw new Error();
    await terminarClase(d, INST, { studentId: ANA, claseId: r.clase.id });
    expect(await iniciar(d, "cur-fisica")).toMatchObject({ estado: "OK", duplicado: false });
  });
});

describe("marcar", () => {
  async function conClase(opciones?: Parameters<typeof mundo>[0]) {
    const m = mundo(opciones);
    const r = await iniciar(m.d);
    if (r.estado !== "OK") throw new Error();
    return { ...m, clase: r.clase };
  }

  it("las cuatro marcas entran, con el momento que calcula el servidor", async () => {
    const { d, clase, avanzar, eventos } = await conClase();
    avanzar(61);
    const r = await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "QUESTION", clave: "k1", texto: null });
    expect(r).toMatchObject({ estado: "OK", duplicado: false, marca: { tipo: "QUESTION", segundos: 61 } });
    for (const tipo of ["IMPORTANT", "ASSESSMENT", "REVIEW"]) {
      expect(await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo, clave: tipo, texto: null })).toMatchObject({ estado: "OK" });
    }
    // Ninguna marca es un evento.
    expect(eventos.map((e) => e.nombre)).toEqual(["ClassSessionStarted"]);
  });

  it("EXAM y un emoji no son tipos", async () => {
    const { d, clase } = await conClase();
    expect(await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "EXAM", clave: "k", texto: null })).toEqual({ estado: "TIPO_INVALIDO" });
    expect(await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "📝", clave: "k", texto: null })).toEqual({ estado: "TIPO_INVALIDO" });
  });

  it("el doble toque con la misma clave devuelve la misma marca", async () => {
    const { d, clase, marcas } = await conClase();
    const a = await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "QUESTION", clave: "k1", texto: null });
    const b = await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "QUESTION", clave: "k1", texto: null });
    expect(b).toMatchObject({ estado: "OK", duplicado: true });
    if (a.estado === "OK" && b.estado === "OK") expect(b.marca.id).toBe(a.marca.id);
    expect(marcas).toHaveLength(1);
  });

  it("la misma clave con otro tipo es un conflicto, no una marca nueva", async () => {
    const { d, clase } = await conClase();
    await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "QUESTION", clave: "k1", texto: null });
    expect(await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "REVIEW", clave: "k1", texto: null })).toEqual({ estado: "CONFLICTO_DE_CLAVE" });
  });

  it("con la clase terminada no se marca, pero el reintento de una que ya entró sí contesta", async () => {
    const { d, clase } = await conClase();
    await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "QUESTION", clave: "k1", texto: null });
    await terminarClase(d, INST, { studentId: ANA, claseId: clase.id });
    expect(await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "QUESTION", clave: "k1", texto: null })).toMatchObject({ estado: "OK", duplicado: true });
    expect(await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "QUESTION", clave: "k2", texto: null })).toEqual({ estado: "CLASE_TERMINADA" });
  });

  it("en la clase de otro estudiante no existe", async () => {
    const { d } = mundo();
    const r = await iniciar(d, "cur-beto", BETO);
    if (r.estado !== "OK") throw new Error();
    expect(await marcar(d, INST, { studentId: ANA, claseId: r.clase.id, tipo: "QUESTION", clave: "k", texto: null })).toEqual({ estado: "NO_ENCONTRADA" });
  });

  it("sin clave no se acepta: el reintento necesita con qué reconocerse", async () => {
    const { d, clase } = await conClase();
    expect(await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "QUESTION", clave: "  ", texto: null })).toEqual({ estado: "SIN_CLAVE" });
  });

  it("si la base le gana la carrera, contesta con la que entró", async () => {
    const { d, clase, marcas } = await conClase({ carreraEnMarca: true });
    expect(await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "QUESTION", clave: "k1", texto: null })).toMatchObject({ estado: "OK", duplicado: true });
    expect(marcas).toHaveLength(1);
  });

  it("el texto se completa después, también con la clase terminada, y en blanco es null", async () => {
    const { d, clase } = await conClase();
    const r = await marcar(d, INST, { studentId: ANA, claseId: clase.id, tipo: "QUESTION", clave: "k1", texto: null });
    if (r.estado !== "OK") throw new Error();
    await terminarClase(d, INST, { studentId: ANA, claseId: clase.id });
    expect(await completarMarca(d, INST, { studentId: ANA, marcaId: r.marca.id, texto: "  el jacobiano  " }))
      .toMatchObject({ estado: "OK", marca: { texto: "el jacobiano" } });
    expect(await completarMarca(d, INST, { studentId: ANA, marcaId: r.marca.id, texto: "   " }))
      .toMatchObject({ estado: "OK", marca: { texto: null } });
    expect(await completarMarca(d, INST, { studentId: BETO, marcaId: r.marca.id, texto: "x" })).toEqual({ estado: "NO_ENCONTRADA" });
  });
});
