/**
 * Modo Clase, segunda vuelta — el Service de lo que se guarda de una clase ·
 * [ADR-099](../docs/decisions.md#adr-099).
 *
 * Repositorio y storage en memoria. Lo que la base garantiza (claves únicas,
 * `CHECK`s) lo prueba `scripts/db-aislamiento.sh` contra Postgres.
 */
import { describe, expect, it } from "vitest";

import type { ClaseFila } from "@/lib/server/servicios/clase";
import {
  abrirMaterial,
  anotar,
  borrarApunte,
  borrarEtiqueta,
  borrarGrabacion,
  borrarMaterial,
  claveDeClase,
  claveEsDeLaClase,
  editarApunte,
  escucharGrabacion,
  etiquetar,
  firmarGrabacion,
  firmarMaterial,
  registrarArchivo,
  registrarGrabacion,
  registrarLink,
  type AlmacenDeClase,
  type ApunteFila,
  type DependenciasDeMaterial,
  type EtiquetaFila,
  type GrabacionFila,
  type MaterialFila,
  type RepositorioDeMaterialDeClase,
} from "@/lib/server/servicios/clase-material";

const INST = "inst-a";
const ANA = "est-ana";
const BETO = "est-beto";

function mundo() {
  let reloj = Date.parse("2026-05-18T11:00:00Z");
  let n = 0;
  const iso = () => new Date(reloj).toISOString();
  const clases: ClaseFila[] = [
    { id: "cl-ana", studentId: ANA, cursadaId: "cur", bloqueId: null, horarioDesde: null, horarioHasta: null, estado: "ACTIVE", iniciadaEn: iso(), terminadaEn: null },
    { id: "cl-beto", studentId: BETO, cursadaId: "cur-b", bloqueId: null, horarioDesde: null, horarioHasta: null, estado: "ACTIVE", iniciadaEn: iso(), terminadaEn: null },
  ];
  const apuntes: ApunteFila[] = [];
  const material: MaterialFila[] = [];
  const grabaciones: GrabacionFila[] = [];
  const etiquetas: EtiquetaFila[] = [];
  const objetos = new Map<string, { bytes: number; mime: string | null }>();
  const borrados: string[] = [];
  const duenoDe = (claseId: string) => clases.find((c) => c.id === claseId)?.studentId;

  const repo: RepositorioDeMaterialDeClase = {
    async apuntesDe(_i, claseId) { return apuntes.filter((a) => a.claseId === claseId); },
    async apuntePorClave(_i, claseId, clave) { return apuntes.find((a) => a.claseId === claseId && a.clave === clave) ?? null; },
    async crearApunte(_i, d) {
      const a = { id: `ap-${++n}`, ...d, creadoEn: iso(), editadoEn: null };
      apuntes.push(a);
      return a;
    },
    async apunteDelEstudiante(_i, s, id) { const a = apuntes.find((x) => x.id === id); return a && duenoDe(a.claseId) === s ? a : null; },
    async editarApunte(_i, id, texto, ahora) { const a = apuntes.find((x) => x.id === id)!; Object.assign(a, { texto, editadoEn: ahora }); return a; },
    async borrarApunte(_i, id) { apuntes.splice(apuntes.findIndex((x) => x.id === id), 1); },

    async materialDe(_i, claseId) { return material.filter((m) => m.claseId === claseId); },
    async materialPorClave(_i, clave) { return material.find((m) => m.clave === clave) ?? null; },
    async crearMaterial(_i, d) { const m = { id: `mat-${++n}`, ...d, creadoEn: iso() }; material.push(m); return m; },
    async materialDelEstudiante(_i, s, id) { const m = material.find((x) => x.id === id); return m && duenoDe(m.claseId) === s ? m : null; },
    async borrarMaterial(_i, id) { material.splice(material.findIndex((x) => x.id === id), 1); },

    async grabacionesDe(_i, claseId) {
      return grabaciones.filter((g) => g.claseId === claseId).map((g) => ({ ...g, etiquetas: etiquetas.filter((e) => e.grabacionId === g.id) }));
    },
    async grabacionPorClave(_i, claseId, k) { return grabaciones.find((g) => g.claseId === claseId && g.idempotencia === k) ?? null; },
    async crearGrabacion(_i, d, es) {
      const g = { id: `g-${++n}`, ...d, creadaEn: iso() };
      grabaciones.push(g);
      for (const e of es) etiquetas.push({ id: `e-${++n}`, grabacionId: g.id, ...e, creadaEn: iso() });
      return g;
    },
    async grabacionDelEstudiante(_i, s, id) { const g = grabaciones.find((x) => x.id === id); return g && duenoDe(g.claseId) === s ? g : null; },
    async borrarGrabacion(_i, id) {
      grabaciones.splice(grabaciones.findIndex((x) => x.id === id), 1);
      for (let i = etiquetas.length - 1; i >= 0; i--) if (etiquetas[i].grabacionId === id) etiquetas.splice(i, 1);
    },
    async crearEtiqueta(_i, d) { const e = { id: `e-${++n}`, ...d, creadaEn: iso() }; etiquetas.push(e); return e; },
    async etiquetaDelEstudiante(_i, s, id) {
      const e = etiquetas.find((x) => x.id === id);
      const g = e && grabaciones.find((x) => x.id === e.grabacionId);
      return e && g && duenoDe(g.claseId) === s ? e : null;
    },
    async borrarEtiqueta(_i, id) { etiquetas.splice(etiquetas.findIndex((x) => x.id === id), 1); },
  };

  const almacen: AlmacenDeClase = {
    async firmarSubida(bucket, clave) { return { url: `https://storage/${bucket}/${clave}?firma`, token: "tok" }; },
    async firmarLectura(bucket, clave) { return `https://storage/${bucket}/${clave}?lectura`; },
    async objeto(bucket, clave) { return objetos.get(`${bucket}/${clave}`) ?? null; },
    async borrar(bucket, clave) { borrados.push(`${bucket}/${clave}`); objetos.delete(`${bucket}/${clave}`); },
  };

  const d: DependenciasDeMaterial = {
    repo,
    clases: { async delEstudiante(_i, s, id) { return clases.find((c) => c.id === id && c.studentId === s) ?? null; } },
    almacen,
    ahora: iso,
    nuevoId: () => `id-${++n}`,
  };
  return {
    d, clases, apuntes, material, grabaciones, etiquetas, borrados,
    subir: (bucket: string, clave: string, bytes: number, mime: string | null) => objetos.set(`${bucket}/${clave}`, { bytes, mime }),
    avanzar: (s: number) => { reloj += s * 1000; },
    terminar: () => Object.assign(clases[0], { estado: "ENDED", terminadaEn: iso() }),
  };
}

describe("apuntes por entrada · §4", () => {
  it("Enter guarda con el momento de la clase, que pone el servidor", async () => {
    const m = mundo();
    m.avanzar(125);
    const r = await anotar(m.d, INST, { studentId: ANA, claseId: "cl-ana", texto: "  bus de datos  ", clave: "k1" });
    expect(r).toMatchObject({ estado: "OK", duplicado: false, apunte: { texto: "bus de datos", segundos: 125 } });
  });

  it("el mismo Enter repetido (misma clave) no crea otra entrada", async () => {
    const m = mundo();
    await anotar(m.d, INST, { studentId: ANA, claseId: "cl-ana", texto: "uno", clave: "k1" });
    expect(await anotar(m.d, INST, { studentId: ANA, claseId: "cl-ana", texto: "uno", clave: "k1" })).toMatchObject({ duplicado: true });
    expect(m.apuntes).toHaveLength(1);
  });

  it("con la clase terminada se sigue anotando, sin momento inventado", async () => {
    const m = mundo();
    m.terminar();
    expect(await anotar(m.d, INST, { studentId: ANA, claseId: "cl-ana", texto: "en casa", clave: "k" })).toMatchObject({
      estado: "OK",
      apunte: { segundos: null },
    });
  });

  it("vacío, demasiado largo o sin clave se rechaza antes de escribir", async () => {
    const m = mundo();
    const base = { studentId: ANA, claseId: "cl-ana" };
    expect(await anotar(m.d, INST, { ...base, texto: "   ", clave: "k" })).toEqual({ estado: "VACIO" });
    expect(await anotar(m.d, INST, { ...base, texto: "x".repeat(4001), clave: "k" })).toEqual({ estado: "DEMASIADO_LARGO" });
    expect(await anotar(m.d, INST, { ...base, texto: "x", clave: " " })).toEqual({ estado: "SIN_CLAVE" });
    expect(m.apuntes).toHaveLength(0);
  });

  it("lo de otro estudiante no existe: ni anotar en su clase, ni editar ni borrar su entrada", async () => {
    const m = mundo();
    expect(await anotar(m.d, INST, { studentId: ANA, claseId: "cl-beto", texto: "x", clave: "k" })).toEqual({ estado: "NO_ENCONTRADA" });
    const r = await anotar(m.d, INST, { studentId: BETO, claseId: "cl-beto", texto: "de beto", clave: "k" });
    if (r.estado !== "OK") throw new Error();
    expect(await editarApunte(m.d, INST, { studentId: ANA, apunteId: r.apunte.id, texto: "pisado" })).toEqual({ estado: "NO_ENCONTRADA" });
    expect(await borrarApunte(m.d, INST, { studentId: ANA, apunteId: r.apunte.id })).toEqual({ estado: "NO_ENCONTRADA" });
    expect(m.apuntes[0].texto).toBe("de beto");
  });

  it("se edita y se borra la propia", async () => {
    const m = mundo();
    const r = await anotar(m.d, INST, { studentId: ANA, claseId: "cl-ana", texto: "uno", clave: "k" });
    if (r.estado !== "OK") throw new Error();
    expect(await editarApunte(m.d, INST, { studentId: ANA, apunteId: r.apunte.id, texto: "dos" })).toMatchObject({ apunte: { texto: "dos" } });
    expect(await borrarApunte(m.d, INST, { studentId: ANA, apunteId: r.apunte.id })).toEqual({ estado: "OK" });
    expect(m.apuntes).toHaveLength(0);
  });
});

describe("claves de objeto", () => {
  it("la deriva el servidor, con institución y clase, y limpia el nombre", () => {
    expect(claveDeClase("inst", "cl", "id", "../../otra/Guía TP 3.pdf")).toBe("inst/cl/id/._._otra_Gu_a_TP_3.pdf");
  });

  it("una clave de otra clase, otra institución o con `..` no es de esta clase", () => {
    expect(claveEsDeLaClase("inst/cl/id/a.pdf", "inst", "cl")).toBe(true);
    expect(claveEsDeLaClase("inst/otra/id/a.pdf", "inst", "cl")).toBe(false);
    expect(claveEsDeLaClase("otra/cl/id/a.pdf", "inst", "cl")).toBe(false);
    expect(claveEsDeLaClase("inst/cl/../a.pdf", "inst", "cl")).toBe(false);
    expect(claveEsDeLaClase("inst/cl/a.pdf", "inst", "cl")).toBe(false);
  });
});

describe("material · §5", () => {
  it("firma sólo tipos de la lista cerrada y hasta 25 MB", async () => {
    const m = mundo();
    const base = { studentId: ANA, claseId: "cl-ana", nombre: "x" };
    expect(await firmarMaterial(m.d, INST, { ...base, mime: "application/x-msdownload", bytes: 10 })).toEqual({ estado: "TIPO_NO_ADMITIDO" });
    expect(await firmarMaterial(m.d, INST, { ...base, mime: "application/pdf", bytes: 26_214_401 })).toEqual({ estado: "DEMASIADO_GRANDE" });
    const ok = await firmarMaterial(m.d, INST, { ...base, nombre: "guia.pdf", mime: "application/pdf", bytes: 1000 });
    expect(ok).toMatchObject({ estado: "OK", clave: expect.stringMatching(/^inst-a\/cl-ana\/id-\d+\/guia\.pdf$/) });
  });

  it("registrar un archivo usa lo que dice el storage, no lo que declaró el cliente", async () => {
    const m = mundo();
    const f = await firmarMaterial(m.d, INST, { studentId: ANA, claseId: "cl-ana", nombre: "guia.pdf", mime: "application/pdf", bytes: 10 });
    if (f.estado !== "OK") throw new Error();
    const pedido = { studentId: ANA, claseId: "cl-ana", clave: f.clave, nombre: "guia.pdf" };
    expect(await registrarArchivo(m.d, INST, pedido)).toEqual({ estado: "NO_SUBIDO" });
    m.subir("clase-material", f.clave, 30_000_000, "application/pdf");
    expect(await registrarArchivo(m.d, INST, pedido)).toEqual({ estado: "DEMASIADO_GRANDE" });
    m.subir("clase-material", f.clave, 2048, "application/x-sh");
    expect(await registrarArchivo(m.d, INST, pedido)).toEqual({ estado: "TIPO_NO_ADMITIDO" });
    m.subir("clase-material", f.clave, 2048, "application/pdf");
    expect(await registrarArchivo(m.d, INST, pedido)).toMatchObject({ estado: "OK", material: { bytes: 2048, tipo: "ARCHIVO" } });
    expect(await registrarArchivo(m.d, INST, pedido)).toMatchObject({ duplicado: true });
    expect(m.material).toHaveLength(1);
  });

  it("una clave de otra clase se rechaza aunque el objeto exista", async () => {
    const m = mundo();
    m.subir("clase-material", "inst-a/cl-beto/x/a.pdf", 10, "application/pdf");
    expect(await registrarArchivo(m.d, INST, { studentId: ANA, claseId: "cl-ana", clave: "inst-a/cl-beto/x/a.pdf", nombre: "a" })).toEqual({
      estado: "CLAVE_AJENA",
    });
  });

  it("un link sólo http(s); el título cae al dominio", async () => {
    const m = mundo();
    const base = { studentId: ANA, claseId: "cl-ana", titulo: null };
    expect(await registrarLink(m.d, INST, { ...base, url: "javascript:alert(1)" })).toEqual({ estado: "LINK_INVALIDO" });
    expect(await registrarLink(m.d, INST, { ...base, url: "https://campus.ucc.edu.ar/tp" })).toMatchObject({
      material: { tipo: "LINK", titulo: "campus.ucc.edu.ar" },
    });
  });

  it("abrir: el link tal cual, el archivo con firma de lectura; ajeno no existe", async () => {
    const m = mundo();
    const l = await registrarLink(m.d, INST, { studentId: ANA, claseId: "cl-ana", url: "https://a.b/c", titulo: "x" });
    if (l.estado !== "OK") throw new Error();
    expect(await abrirMaterial(m.d, INST, { studentId: ANA, materialId: l.material.id })).toEqual({ estado: "OK", url: "https://a.b/c" });
    expect(await abrirMaterial(m.d, INST, { studentId: BETO, materialId: l.material.id })).toEqual({ estado: "NO_ENCONTRADA" });
  });

  it("borrar saca el objeto del storage antes que la fila", async () => {
    const m = mundo();
    const f = await firmarMaterial(m.d, INST, { studentId: ANA, claseId: "cl-ana", nombre: "a.pdf", mime: "application/pdf", bytes: 10 });
    if (f.estado !== "OK") throw new Error();
    m.subir("clase-material", f.clave, 10, "application/pdf");
    const r = await registrarArchivo(m.d, INST, { studentId: ANA, claseId: "cl-ana", clave: f.clave, nombre: "a.pdf" });
    if (r.estado !== "OK") throw new Error();
    expect(await borrarMaterial(m.d, INST, { studentId: BETO, materialId: r.material.id })).toEqual({ estado: "NO_ENCONTRADA" });
    expect(await borrarMaterial(m.d, INST, { studentId: ANA, materialId: r.material.id })).toEqual({ estado: "OK" });
    expect(m.borrados).toEqual([`clase-material/${f.clave}`]);
    expect(m.material).toHaveLength(0);
  });
});

describe("grabaciones y etiquetas · §2–§3", () => {
  async function grabar(m: ReturnType<typeof mundo>, duracion = 600, etiquetas: Array<{ texto: unknown; segundo: unknown }> = []) {
    const f = await firmarGrabacion(m.d, INST, { studentId: ANA, claseId: "cl-ana", mime: "audio/webm;codecs=opus", bytes: 5000 });
    if (f.estado !== "OK") throw new Error(f.estado);
    m.subir("clase-audio", f.clave, 5000, "audio/webm");
    return registrarGrabacion(m.d, INST, { studentId: ANA, claseId: "cl-ana", clave: f.clave, idempotencia: "g1", duracion, etiquetas });
  }

  it("sólo se firma con la clase activa, y sólo audio", async () => {
    const m = mundo();
    expect(await firmarGrabacion(m.d, INST, { studentId: ANA, claseId: "cl-ana", mime: "video/mp4", bytes: 10 })).toEqual({ estado: "TIPO_NO_ADMITIDO" });
    expect(await firmarGrabacion(m.d, INST, { studentId: ANA, claseId: "cl-ana", mime: "audio/webm", bytes: 52_428_801 })).toEqual({ estado: "DEMASIADO_GRANDE" });
    m.terminar();
    expect(await firmarGrabacion(m.d, INST, { studentId: ANA, claseId: "cl-ana", mime: "audio/webm", bytes: 10 })).toEqual({ estado: "CLASE_TERMINADA" });
  });

  it("el momento de la clase en que empezó lo calcula el servidor", async () => {
    const m = mundo();
    m.avanzar(3000);
    expect(await grabar(m, 600)).toMatchObject({ estado: "OK", grabacion: { duracion: 600, inicioEnClase: 2400, mime: "audio/webm" } });
  });

  it("las etiquetas viajan con la grabación; una fuera de la duración la rechaza entera", async () => {
    const m = mundo();
    m.avanzar(700);
    expect(await grabar(m, 600, [{ texto: "Ejercicio", segundo: 601 }])).toEqual({ estado: "ETIQUETA_INVALIDA" });
    expect(await grabar(m, 600, [{ texto: "x".repeat(61), segundo: null }])).toEqual({ estado: "ETIQUETA_INVALIDA" });
    expect(m.grabaciones).toHaveLength(0);
    const r = await grabar(m, 600, [{ texto: " Ejercicio 3 ", segundo: 750 / 2 }, { texto: "Teoría", segundo: null }]);
    expect(r.estado).toBe("OK");
    expect(m.etiquetas.map((e) => [e.texto, e.segundo])).toEqual([["Ejercicio 3", 375], ["Teoría", null]]);
  });

  it("una duración fuera de 1…14 400 s no entra", async () => {
    const m = mundo();
    expect(await grabar(m, 0)).toEqual({ estado: "DURACION_INVALIDA" });
    expect(await grabar(m, 14_401)).toEqual({ estado: "DURACION_INVALIDA" });
  });

  it("registrar dos veces con la misma clave no duplica", async () => {
    const m = mundo();
    const a = await grabar(m);
    const f = await firmarGrabacion(m.d, INST, { studentId: ANA, claseId: "cl-ana", mime: "audio/webm", bytes: 10 });
    if (a.estado !== "OK" || f.estado !== "OK") throw new Error();
    const b = await registrarGrabacion(m.d, INST, { studentId: ANA, claseId: "cl-ana", clave: f.clave, idempotencia: "g1", duracion: 600, etiquetas: [] });
    expect(b).toMatchObject({ duplicado: true, grabacion: { id: a.grabacion.id } });
  });

  it("escuchar, etiquetar y borrar: lo ajeno no existe; borrar saca el audio primero", async () => {
    const m = mundo();
    const r = await grabar(m);
    if (r.estado !== "OK") throw new Error();
    const id = r.grabacion.id;
    expect(await escucharGrabacion(m.d, INST, { studentId: BETO, grabacionId: id })).toEqual({ estado: "NO_ENCONTRADA" });
    expect(await escucharGrabacion(m.d, INST, { studentId: ANA, grabacionId: id })).toMatchObject({ estado: "OK" });
    expect(await etiquetar(m.d, INST, { studentId: BETO, grabacionId: id, texto: "x", segundo: null })).toEqual({ estado: "NO_ENCONTRADA" });
    const e = await etiquetar(m.d, INST, { studentId: ANA, grabacionId: id, texto: "Consigna", segundo: 30 });
    if (e.estado !== "OK") throw new Error();
    expect(await borrarEtiqueta(m.d, INST, { studentId: BETO, etiquetaId: e.etiqueta.id })).toEqual({ estado: "NO_ENCONTRADA" });
    expect(await borrarGrabacion(m.d, INST, { studentId: BETO, grabacionId: id })).toEqual({ estado: "NO_ENCONTRADA" });
    expect(await borrarGrabacion(m.d, INST, { studentId: ANA, grabacionId: id })).toEqual({ estado: "OK" });
    expect(m.borrados).toHaveLength(1);
    expect(m.grabaciones).toHaveLength(0);
    expect(m.etiquetas).toHaveLength(0);
  });

  it("con la clase terminada, una grabación se sigue escuchando y etiquetando", async () => {
    const m = mundo();
    const r = await grabar(m);
    if (r.estado !== "OK") throw new Error();
    m.terminar();
    expect(await etiquetar(m.d, INST, { studentId: ANA, grabacionId: r.grabacion.id, texto: "Repasar", segundo: null })).toMatchObject({ estado: "OK" });
  });
});
