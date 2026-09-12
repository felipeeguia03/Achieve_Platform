import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  nodosAbribles,
  objetoDeMateria,
  objetoDeSuperficie,
} from "@/lib/navigation/objetos-de-superficie";
import { buscarEnPaleta, entradasDeMaterias } from "@/lib/navigation/paleta";
import { indiceDePaleta } from "@/lib/fixtures/indice-paleta";
import { menu } from "@/lib/navigation/menu";
import { nodoIds, nodos } from "@/lib/navigation/surfaces";
import { claveDe } from "@/lib/domain/espacio-de-trabajo";
import { rutaConocida } from "@/lib/navigation";

/**
 * **Todo entra a la barra, no sólo las materias** —
 * [ADR-088](../docs/decisions.md#adr-088), Enmienda 6.
 *
 * El owner lo pidió así: *"que todo pueda ponerse en la barra de pestañas, no
 * sólo las materias (entregas, formación, etc.)"*. Hasta acá, entrar a Formación
 * desde el menú no dejaba nada: salir de ahí era perderla, mientras que una
 * materia quedaba a un clic. Las dos son cosas que se tienen abiertas.
 */
const ROOT = process.cwd();
const LEER = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

describe("§1 · cualquier superficie se puede abrir como objeto", () => {
  it("las cinco secciones del menú se abren, y `Entregas` también", () => {
    for (const id of ["UX01", "UX02_INDICE", "UX06", "FORMACION", "UX07", "UX05"] as const) {
      expect(objetoDeSuperficie(id), id).not.toBeNull();
    }
  });

  it("cada ítem del menú lateral tiene su objeto: ninguno queda sin ficha", () => {
    for (const item of menu) {
      expect(objetoDeSuperficie(item.nodo), item.nodo).not.toBeNull();
    }
  });

  /**
   * ⚠️ **`UX02` no, y no es un olvido.** Una materia se abre **con su cursada**
   * —`materia:<cursadaId>`—, que es la identidad que ADR-088 §1 le dio y la que
   * hace que dos materias sean dos fichas. Una ficha *«Materia / Cursado»* en
   * singular sería la promesa incumplida que ADR-077 cerró.
   */
  it("la materia genérica no se abre suelta: se abre con su cursada", () => {
    expect(objetoDeSuperficie("UX02")).toBeNull();

    // Y dos materias son dos objetos distintos, que es lo que la clave garantiza.
    const algebra = objetoDeMateria("ce-1", "Álgebra", "/materia?cursada=ce-1");
    const economia = objetoDeMateria("ce-2", "Economía", "/materia?cursada=ce-2");
    expect(claveDe(algebra.tipo, algebra.entidadId)).toBe("materia:ce-1");
    expect(claveDe(economia.tipo, economia.entidadId)).toBe("materia:ce-2");
    expect(algebra.etiqueta).toBe("Álgebra");
  });

  it("los nodos sin pantalla no se abren: no hay nada que poner en la ficha", () => {
    for (const id of ["EJECUCION", "UX04_RENEGOCIACION", "UX04_RESCATE"] as const) {
      expect(objetoDeSuperficie(id), id).toBeNull();
    }
  });

  /**
   * ⚠️ **La ruta y la etiqueta salen del grafo y del menú, no se escriben.**
   * Un nombre inventado acá sería una segunda forma de llamar a la misma
   * pantalla, que es `A-04` (`AGENTS.md` §4).
   */
  it("la etiqueta es la del menú si existe, y si no la del nodo", () => {
    expect(objetoDeSuperficie("UX07")?.etiqueta).toBe("Modo Examen");
    expect(objetoDeSuperficie("UX09")?.etiqueta).toBe(nodos.UX09.nombre);
  });

  it("toda ruta que se puede abrir es una ruta que la aplicación reconoce", () => {
    // El espacio de trabajo valida lo que restaura contra el grafo: un objeto
    // con una ruta que no pasa ese filtro desaparecería de la barra al recargar.
    for (const id of nodosAbribles) {
      const objeto = objetoDeSuperficie(id);
      expect(objeto, id).not.toBeNull();
      expect(rutaConocida(objeto!.ruta), id).toBe(true);
    }
  });

  it("cada objeto de superficie tiene una clave distinta", () => {
    const claves = nodosAbribles.map((id) => {
      const o = objetoDeSuperficie(id)!;
      return claveDe(o.tipo, o.entidadId);
    });
    expect(new Set(claves).size).toBe(claves.length);
  });

  /**
   * ⚠️ **El contexto va vacío, igual que en una materia.** El contexto de un
   * objeto es *a qué pertenece*; una superficie no pertenece a nada, y meterle
   * su pregunta —*"¿Qué necesito hacer ahora?"*— empujaría la etiqueta a `Ho…`
   * en una ficha de 160 px, que es el anti-patrón `A-07`.
   */
  it("ninguna superficie lleva contexto en la ficha", () => {
    for (const id of nodosAbribles) {
      expect(objetoDeSuperficie(id)?.etiquetaSecundaria, id).toBeNull();
    }
  });

  it("la barra lateral abre el objeto en vez de sólo navegar", () => {
    const nav = LEER("components/shell/navegacion-lateral.tsx");
    expect(nav).toContain("objetoDeSuperficie");
    /*
      ⚠️ **Y sigue siendo un `<Link>` con `href` real.** Es lo que hace que el
      clic del medio abra en otra pestaña y que la navegación funcione sin
      JavaScript; se intercepta el clic simple y nada más.
    */
    expect(nav).toContain("href={rutaDelItem(item)}");
    expect(nav).toMatch(/e\.metaKey \|\| e\.ctrlKey/);
    // Sin espacio montado no se intercepta: en `/login` cancelar el clic
    // esperando un `abrir` inerte dejaría un menú que no lleva a ningún lado.
    expect(nav).toMatch(/if \(!montado\) return;/);
  });

  it("la barra de objetos tiene ícono para todos los tipos, sin inventar emoji", () => {
    const barra = LEER("components/shell/barra-de-objetos.tsx");
    expect(barra).toMatch(/hoy: Sun/);
    expect(barra).toMatch(/materias: Library/);
    expect(barra).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
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
