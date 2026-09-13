import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  esFichaDeSeccion,
  fondoDe,
  objetoDeMateria,
  objetoEnPantalla,
} from "@/lib/navigation/objeto-en-pantalla";
import { migasDe, seccionesDelMenu } from "@/lib/navigation/migas";
import { buscarEnPaleta, entradasDeMaterias } from "@/lib/navigation/paleta";
import { indiceDePaleta } from "@/lib/fixtures/indice-paleta";
import { menu } from "@/lib/navigation/menu";
import { nodoIds, nodos, type NodoId } from "@/lib/navigation/surfaces";
import { claveDe } from "@/lib/domain/espacio-de-trabajo";
import { rutaConocida } from "@/lib/navigation";

/**
 * **La barra no se llena sola** — [ADR-088](../docs/decisions.md#adr-088),
 * Enmienda 7.
 *
 * La Enmienda 6 guardaba una ficha por cada pantalla a la que se entraba, y la
 * barra se volvía un historial. El owner lo corrigió: *"que no se popule la
 * barra apenas entrás; para que se popule tenés que minimizar"*, y los controles
 * *"sólo deberían aparecer luego de entrar a un video, o algo dentro de esa
 * pantalla producto del sidebar"*.
 */
const ROOT = process.cwd();
const LEER = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

describe("§1 · las secciones del menú no son objetos", () => {
  it("ninguna sección del menú lleva controles", () => {
    for (const item of menu) {
      expect(objetoEnPantalla(item.nodo, nodos[item.nodo].ruta!, null), item.nodo).toBeNull();
    }
  });

  /**
   * ⚠️ **Tampoco con un nombre declarado.** Si la pantalla de una sección llamara
   * a `useMigaDelObjeto` por error, eso no la convierte en objeto: lo que hace
   * objeto a Formación es **tener un video abierto**, no tener nombre.
   */
  it("una sección con nombre pero sin nada abierto sigue sin controles", () => {
    expect(objetoEnPantalla("FORMACION", "/formacion", "Formación")).toBeNull();
    expect(objetoEnPantalla("UX01", "/hoy", "Hoy")).toBeNull();
  });

  it("la barra lateral navega y nada más: no guarda nada en la barra", () => {
    const nav = LEER("components/shell/navegacion-lateral.tsx");
    expect(nav).not.toMatch(/useEspacioDeTrabajo|objetoEnPantalla|preventDefault/);
    // Y sigue siendo un `<Link>` con `href` real.
    expect(nav).toContain("href={rutaDelItem(item)}");
  });

  it("entrar a una materia desde Hoy o desde el índice sólo navega", () => {
    for (const archivo of ["components/superficies/hoy.tsx", "components/superficies/materias.tsx"]) {
      expect(LEER(archivo), archivo).not.toMatch(/useEspacioDeTrabajo|abrir\(objeto/);
    }
  });

  /**
   * ⚠️ **Las fichas que dejó la Enmienda 6 se reconocen, y se descartan al leer.**
   * Están en el navegador de quien ya usó la barra; sin esto seguirían ahí.
   */
  it("las fichas de sección guardadas antes se reconocen", () => {
    for (const item of menu) {
      expect(esFichaDeSeccion({ entidadId: item.nodo }), item.nodo).toBe(true);
    }
    expect(esFichaDeSeccion({ entidadId: "ce-1" })).toBe(false);
    expect(LEER("components/shell/espacio-de-trabajo.tsx")).toContain("esFichaDeSeccion");
  });
});

describe("§1 · lo que se abre adentro sí es un objeto", () => {
  it("una materia, con su cursada y su nombre", () => {
    const o = objetoEnPantalla("UX02", "/materia?cursada=ce-1", "Álgebra");
    expect(o).toMatchObject({ tipo: "materia", entidadId: "ce-1", etiqueta: "Álgebra" });
    expect(claveDe(o!.tipo, o!.entidadId)).toBe("materia:ce-1");
  });

  it("un video de Formación, con su pieza y su título", () => {
    const o = objetoEnPantalla("FORMACION", "/formacion?pieza=p-3", "Tengo mucho para estudiar");
    expect(o).toMatchObject({ tipo: "formacion", entidadId: "p-3", etiqueta: "Tengo mucho para estudiar" });
    expect(rutaConocida(o!.ruta)).toBe(true);
  });

  it("el flujo de la acción y el protocolo, con el nombre de su miga", () => {
    expect(objetoEnPantalla("UX03", "/accion", null)?.etiqueta).toBe("Próxima acción");
    expect(objetoEnPantalla("UX05", "/evidencia", null)?.tipo).toBe("evidencia");
    expect(objetoEnPantalla("UX09", "/examen/paso", null)?.tipo).toBe("modo-examen");
  });

  /**
   * ⚠️ **Omitir, no inventar.** Sin cursada no hay de qué materia es la ficha, y
   * sin nombre se guardaría como *«Materia»* mientras carga.
   */
  it("sin su parámetro, o sin nombre todavía, no hay objeto", () => {
    expect(objetoEnPantalla("UX02", "/materia", "Álgebra")).toBeNull();
    expect(objetoEnPantalla("UX02", "/materia?cursada=ce-1", null)).toBeNull();
    expect(objetoEnPantalla("UX02", "/materia?cursada=ce-1", "   ")).toBeNull();
  });

  it("la ruta del objeto no arrastra las ventanas del escritorio", () => {
    const o = objetoEnPantalla("UX02", "/materia?cursada=ce-1&abierto=materia:ce-2", "Álgebra");
    expect(o?.ruta).toBe("/materia?cursada=ce-1");
  });
});

describe("§2 · a dónde van minimizar y achicar", () => {
  it("achicar deja atrás la sección de la que cuelga", () => {
    expect(fondoDe("UX02")).toBe("/materias");
    expect(fondoDe("FORMACION")).toBe("/formacion");
  });

  it("lo que no cuelga de ninguna sección se achica sobre Hoy", () => {
    expect(fondoDe("UX03")).toBe("/hoy");
    expect(fondoDe("UX05")).toBe("/hoy");
    // ADR-100 · Enmienda 1: Modo Examen salió del menú, así que un paso del
    // protocolo ya no cuelga de una sección.
    expect(fondoDe("UX09")).toBe("/hoy");
  });
});

describe("§3 · la miga empieza en la sección, no en Hoy", () => {
  it("una materia es Materias › nombre", () => {
    expect(migasDe("UX02", "Análisis").map((m) => m.etiqueta)).toEqual(["Materias", "Análisis"]);
  });

  it("un video es Formación › título, con Formación enlazada", () => {
    const migas = migasDe("FORMACION", "Tengo mucho para estudiar y no me alcanza el tiempo");
    expect(migas).toEqual([
      { etiqueta: "Formación", href: "/formacion" },
      { etiqueta: "Tengo mucho para estudiar y no me alcanza el tiempo", href: null },
    ]);
    expect(migasDe("FORMACION").map((m) => m.etiqueta)).toEqual(["Formación"]);
  });

  it("ninguna sección del menú cuelga de otra", () => {
    for (const item of menu) {
      expect(migasDe(item.nodo), item.nodo).toHaveLength(1);
    }
  });

  it("el flujo de ejecución empieza en la acción, como decidió el owner", () => {
    expect(migasDe("UX05").map((m) => m.etiqueta)).toEqual(["Próxima acción", "Compromiso", "Evidencia"]);
  });

  it("ninguna miga de ninguna pantalla empieza en Hoy salvo Hoy", () => {
    for (const id of nodoIds) {
      if (id === "UX01" || nodos[id].ruta === null) continue;
      expect(migasDe(id)[0]?.etiqueta, id).not.toBe("Hoy");
    }
  });
});

/**
 * **Buscar una materia y que se abra** — Enmienda 6, pedido 4 del owner:
 * *"que en la barra de búsqueda pueda buscar por materias y se abra el modal"*.
 */
describe("§4 · el buscador encuentra materias y las abre en ventana", () => {
  const MATERIAS = [
    { cursadaId: "ce-1", nombre: "Análisis Matemático II", evaluacion: "Parcial 1 · sáb 26 sept" },
    { cursadaId: "ce-2", nombre: "Economía", evaluacion: null },
  ];
  const entradas = entradasDeMaterias(MATERIAS, (id, nombre) =>
    objetoDeMateria(id, nombre, `/materia?cursada=${id}`),
  );
  const indice = [...indiceDePaleta, ...entradas];

  it("se la encuentra escribiendo su nombre, sin acentos y en minúscula", () => {
    // Buscar no puede depender de cómo se escriba: `normalizar` saca acentos.
    const r = buscarEnPaleta(indice, "analisis");
    expect(r.entradas[0]?.titulo).toBe("Análisis Matemático II");
  });

  it("la materia gana a las pantallas cuando se escribió algo", () => {
    /*
      ⚠️ El defecto que esto previene: con las superficies primero, escribir
      *"eco"* contestaba *"Compromiso"* —porque su pregunta dice «acuerdo»— y la
      materia quedaba tercera. Un buscador que no encuentra lo que se escribe no
      es un buscador.
    */
    const r = buscarEnPaleta(indice, "econom");
    expect(r.entradas[0]?.tipo).toBe("materia");
  });

  it("con el campo vacío manda el menú de pantallas, no la lista de materias", () => {
    // Sin nada escrito el buscador es un menú de *a dónde puedo ir*: con siete
    // materias arriba, no se vería ni una pantalla.
    expect(buscarEnPaleta(indice, "").entradas[0]?.tipo).toBe("superficie");
  });

  it("elegir una materia **abre un objeto**, no navega", () => {
    const r = buscarEnPaleta(indice, "analisis");
    expect(r.entradas[0]?.objeto?.tipo).toBe("materia");
    expect(r.entradas[0]?.objeto?.entidadId).toBe("ce-1");
  });

  it("`@` fuerza materias, que es la vía de escape de `I-03`", () => {
    // Los tres tipos colisionan: una materia puede llamarse como una pantalla o
    // como el propósito de un escenario.
    const r = buscarEnPaleta(indice, "@econom");
    expect(r.forzado).toBe("materia");
    expect(r.entradas.every((e) => e.tipo === "materia")).toBe(true);
  });

  /**
   * ⚠️ **Se indexa el nombre y nada más.** La próxima evaluación tienta como
   * texto buscable, pero haría que escribir *"parcial"* devolviera las siete
   * materias: un resultado que no distingue nada es peor que ninguno.
   */
  it("la evaluación es contexto, no índice", () => {
    expect(entradas[0]?.detalle).toContain("Parcial 1");
    expect(buscarEnPaleta(indice, "parcial").entradas.some((e) => e.tipo === "materia")).toBe(false);
  });

  it("la paleta abre la ventana sin moverse de pantalla", () => {
    const paleta = LEER("components/shell/paleta-de-comandos.tsx");
    expect(paleta).toContain("abrirEnVentana");
    // Y la ruta de la materia sale del registro canónico, no escrita a mano.
    expect(paleta).toContain('rutaDeCtaCon("CTA-001"');
    expect(paleta).not.toMatch(/"\/materia\?cursada=/);
  });

  /**
   * ⚠️ **El buscador nunca puede navegar solo, y esto lo aprendí mirándolo en
   * el navegador.**
   *
   * La primera versión pedía las materias con `useSuperficie`, que ante
   * `SIN_SESION` **manda a `/login`** — correcto para una superficie, desastroso
   * para el cromo: abrir ⌘K en el recorrido del focus group, que corre con
   * `?escenario=` y sin backend, echaba al estudiante a la pantalla de ingreso.
   *
   * El buscador pide con `pedir` y, si no hay materias, ofrece las pantallas.
   */
  it("el buscador no usa el hook que redirige al login", () => {
    const paleta = LEER("components/shell/paleta-de-comandos.tsx");
    // Se mira **el import**, no la palabra: el comentario de arriba de ese
    // pedido nombra el hook para explicar por qué no se usa, y un guard que
    // castiga documentar la regla enseña a no documentarla.
    expect(paleta).not.toMatch(/import .*useSuperficie.* from/);
    expect(paleta).toContain('pedir<MateriasProps>("/api/materias")');
    // Y no navega a ningún lado por su cuenta: ni `replace`, ni `assign`, ni
    // un `push` que no sea el de elegir un resultado.
    expect(paleta).not.toMatch(/router\.replace|location\.(assign|href)/);
  });
});

/** Todo nodo con ruta está en el buscador: no hay pantalla inalcanzable. */
describe("§1 · ninguna pantalla queda fuera del buscador", () => {
  it("cada nodo con ruta tiene su entrada", () => {
    const urls = new Set(indiceDePaleta.map((e) => e.url));
    for (const id of nodoIds) {
      const ruta = nodos[id].ruta;
      if (ruta === null) continue;
      expect(urls.has(ruta), `${id} (${ruta})`).toBe(true);
    }
  });
});

/**
 * ADR-088 · Enmienda 8 — **toda pantalla que abre algo lleva minimizar y
 * achicar.** Clase, Progreso y la activación de Modo Examen no los tenían.
 */
describe("§5 · toda pantalla de objeto lleva los controles", () => {
  it("una clase, con su id o la activa", () => {
    expect(objetoEnPantalla("CLASE", "/clase?clase=sc-1", "Clase práctica jueves 18/05")).toMatchObject({
      tipo: "clase",
      entidadId: "sc-1",
    });
    expect(objetoEnPantalla("CLASE", "/clase", "Clase teórica lunes 14/09")).toMatchObject({
      tipo: "clase",
      entidadId: "CLASE",
    });
    expect(fondoDe("CLASE")).toBe("/materias");
  });

  it("Progreso y Modo Examen son de una cursada, y su ficha no se toma por sección vieja", () => {
    const progreso = objetoEnPantalla("UX06", "/progreso?cursada=ce-1", "Progreso · Álgebra");
    const examen = objetoEnPantalla("UX07", "/examen/activar?cursada=ce-1", "Modo Examen · Álgebra");
    expect(progreso).toMatchObject({ tipo: "bitacora", entidadId: "ce-1" });
    expect(examen).toMatchObject({ tipo: "modo-examen", entidadId: "ce-1" });
    expect(esFichaDeSeccion(progreso!)).toBe(false);
    expect(esFichaDeSeccion(examen!)).toBe(false);
  });

  it("toda pantalla con ruta que no es sección del menú lleva controles", () => {
    const sinControles = (Object.values(nodos) as { id: NodoId; ruta: string | null }[])
      .filter((n) => n.ruta !== null && !seccionesDelMenu.has(n.id))
      .filter((n) => objetoEnPantalla(n.id, `${n.ruta}?cursada=x&clase=x`, "Nombre") === null)
      .map((n) => n.id);
    expect(sinControles).toEqual([]);
  });
});
