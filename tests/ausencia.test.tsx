import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Ausencia, Fila } from "@/components/screens/design-system";

/**
 * Etapa A2.3 — la primitiva `Ausencia` y el dock que no se construye.
 *
 * Dos reglas distintas conviven acá porque las dos salen del mismo hallazgo
 * ([ADR-019](../docs/decisions.md#adr-019)): al abrir las capturas para
 * especificar el dock, la fuente dijo que no, y la etapa se reasignó a la
 * primitiva que sí faltaba.
 *
 * ⚠️ **La segunda mitad cambió de signo el 10 de septiembre de 2026.**
 * [ADR-088](../docs/decisions.md#adr-088) construyó el espacio de trabajo, así
 * que el guard **ya no prohíbe**: verifica los seis requisitos innegociables del
 * multiventana bajo los cuales se autorizó. El motivo de tener un test es el
 * mismo que daba ADR-019 §3 — *una regla sin test se pierde en dos meses*.
 *
 * `Ausencia` no se toca: sigue siendo la primitiva de *sin datos no es cero*.
 */

const ROOT = process.cwd();

function archivosFuente(dir: string): string[] {
  const abs = resolve(ROOT, dir);
  let entradas: string[];
  try {
    entradas = readdirSync(abs);
  } catch {
    return [];
  }
  return entradas.flatMap((entrada) => {
    const full = join(abs, entrada);
    if (statSync(full).isDirectory()) return archivosFuente(join(dir, entrada));
    return /\.(ts|tsx)$/.test(entrada) ? [join(dir, entrada)] : [];
  });
}

// ── P-09: los tratamientos de ausencia se ven distinto ───────────────────────

describe("P-09 · la ausencia se tipa", () => {
  it("sin-asignar y cero real se ven distinto", () => {
    const { container } = render(
      <>
        <Ausencia tipo="SIN_ASIGNAR">no evaluado</Ausencia>
        <Ausencia tipo="CERO_REAL">0</Ausencia>
      </>,
    );
    const sinAsignar = container.querySelector('[data-ausencia="SIN_ASIGNAR"]') as HTMLElement;
    const cero = container.querySelector('[data-ausencia="CERO_REAL"]') as HTMLElement;

    expect(sinAsignar).not.toBeNull();
    expect(cero).not.toBeNull();
    expect(sinAsignar.style.fontStyle).toBe("italic");
    expect(cero.style.fontStyle).not.toBe("italic");
  });

  /**
   * La prueba que `design-system.md` §7 fija: imprimir en blanco y negro. Si la
   * única diferencia fuera el color, `P-06` se rompe y la distinción se pierde
   * en una fotocopia.
   */
  it("la distinción sobrevive sin color", () => {
    const { container } = render(
      <>
        <Ausencia tipo="SIN_ASIGNAR">no evaluado</Ausencia>
        <Ausencia tipo="CERO_REAL">0</Ausencia>
      </>,
    );
    const marcas = [...container.querySelectorAll("[data-ausencia]")].map((el) => {
      const { fontStyle, fontVariantNumeric } = (el as HTMLElement).style;
      return `${fontStyle}|${fontVariantNumeric}`;
    });
    expect(new Set(marcas).size).toBe(marcas.length);
  });

  it("un cero real no se atenúa: es un valor, no una ausencia", () => {
    const { container } = render(<Ausencia tipo="CERO_REAL">0</Ausencia>);
    const cero = container.querySelector('[data-ausencia="CERO_REAL"]') as HTMLElement;
    expect(cero.style.color).toContain("--foreground");
    expect(cero.style.color).not.toContain("--muted-foreground");
  });
});

// ── Un dato adverso no es una ausencia ───────────────────────────────────────

describe("un dato presente y adverso no se dibuja como ausencia", () => {
  it("`tono` produce chip, no itálica atenuada", () => {
    const { container } = render(<Fila label="Estado" value="incumplido" tono="urgencia" />);
    expect(container.querySelector("[data-ausencia]")).toBeNull();
    expect(screen.getByText("incumplido")).toBeTruthy();
  });

  /**
   * El caso concreto que motivó la corrección: el compromiso original de una
   * renegociación. Un `Commitment` `MISSED` nunca se edita para parecer
   * cumplido, y pintarlo con el gris del vacío es la versión visual de eso.
   */
  it("ningún fixture marca como ausencia una palabra de estado adverso", () => {
    const ADVERSAS = /incumplid|vencid|necesita atención|falta /i;
    // Se lee la fuente y no el objeto: así entra todo fixture nuevo sin que
    // haya que acordarse de sumarlo a una lista de imports.
    const culpables = archivosFuente("lib/fixtures")
      .flatMap((f) => readFileSync(resolve(ROOT, f), "utf8").split("\n").map((l, i) => [f, i + 1, l] as const))
      .filter(([, , linea]) => /ausencia:\s*"/.test(linea) && ADVERSAS.test(linea))
      .map(([f, n, linea]) => `${f}:${n} ${linea.trim()}`);
    expect(culpables).toEqual([]);
  });

  /**
   * Este test existe porque los unitarios **no alcanzaron**. `Fila` dibujaba el
   * chip correctamente y `FilaDato` llevaba el `tono`, pero seis de siete
   * llamadas no lo pasaban: *"incumplido"* volvía a salir como texto común.
   * Sólo se vio abriendo el navegador.
   *
   * La regla: si una llamada proyecta `ausencia`, proyecta también `tono`. Son
   * las dos mitades de "qué clase de cosa es este valor", y pasar una sola deja
   * la otra en silencio.
   */
  it("toda llamada a `Fila` que pasa `ausencia` pasa también `tono`", () => {
    const culpables = archivosFuente("components/screens")
      .flatMap((f) => {
        const src = readFileSync(resolve(ROOT, f), "utf8");
        return [...src.matchAll(/<Fila\b[^>]*?\/>/g)].map((m) => [f, m[0]] as const);
      })
      .filter(([, tag]) => /ausencia=/.test(tag) && !/tono=/.test(tag))
      .map(([f, tag]) => `${f}: ${tag.replace(/\s+/g, " ")}`);
    expect(culpables).toEqual([]);
  });
});

// ── ADR-088: el espacio de trabajo, y los seis requisitos ────────────────────

/**
 * **Este bloque reemplaza al de ADR-019, y no por haberlo perdido.**
 *
 * [ADR-019](../docs/decisions.md#adr-019) prohibía el dock y decía por qué se
 * probaba: *"una regla sin test se pierde en dos meses"*. Ese motivo vale igual
 * para la regla nueva, así que el guard **no se borró: se dio vuelta**.
 *
 * [ADR-088](../docs/decisions.md#adr-088) construye el espacio de trabajo **con
 * la condición** de cumplir los seis requisitos innegociables del multiventana
 * que el manual enumera y que ADR-019 citó para descartarlo. Sin esa condición
 * la decisión no se sostiene, así que se verifican acá.
 */
describe("ADR-088 · el espacio de trabajo cumple los seis requisitos", () => {
  const dominio = readFileSync(resolve(ROOT, "lib/domain/espacio-de-trabajo.ts"), "utf8");
  const proveedor = readFileSync(resolve(ROOT, "components/shell/espacio-de-trabajo.tsx"), "utf8");
  const barra = readFileSync(resolve(ROOT, "components/shell/barra-de-objetos.tsx"), "utf8");
  const panel = readFileSync(resolve(ROOT, "components/shell/panel-de-objeto.tsx"), "utf8");

  it("1 · URL por objeto: ningún objeto existe sin su ruta", () => {
    // El tipo la exige, y la persistencia rechaza lo que no empiece con `/`.
    expect(dominio).toMatch(/ruta: string;/);
    const persistencia = readFileSync(
      resolve(ROOT, "lib/client/espacio-de-trabajo/persistencia.ts"),
      "utf8",
    );
    expect(persistencia).toMatch(/startsWith\("\/"\)/);
  });

  it("2 · atrás y adelante: el espacio NO intercepta la history API", () => {
    // Si alguna vez alguien agrega `pushState` o `popstate` acá, el botón atrás
    // deja de ser del navegador y el requisito 2 se rompe en silencio.
    for (const fuente of [proveedor, barra]) {
      expect(fuente).not.toMatch(/\b(pushState|replaceState|popstate|beforeunload)\b/);
    }
    /*
      Y sí sigue la ruta, que es la otra mitad del requisito — **derivando el
      activo de ella**, no guardándolo aparte. Dos fuentes de verdad sobre qué
      está activo se desincronizan en la primera navegación que no pase por la
      barra, y el botón atrás es exactamente esa navegación.
    */
    expect(proveedor).toMatch(/claveEnRuta/);
    expect(proveedor).not.toMatch(/useState<string \| null>\(.*activo/);
  });

  it("3 · orden de tabulación, y el arrastre no es el único camino", () => {
    expect(barra).toMatch(/role="tablist"/);
    expect(barra).toMatch(/ArrowRight/);
    expect(barra).toMatch(/ArrowLeft/);
    expect(barra).toMatch(/"Home"/);
    expect(barra).toMatch(/"End"/);
    // La mitad accesible del reordenamiento: sin esto, mover un objeto exigiría
    // un mouse.
    expect(barra).toMatch(/MOVER_IZQUIERDA/);
    expect(barra).toMatch(/MOVER_DERECHA/);
  });

  it("4 · jerarquía de Escape: cierra una capa, y nunca cierra un objeto", () => {
    // `Escape` aparece sólo en los cierres de capa (menú y hoja móvil).
    expect(barra).toMatch(/Escape/);
    // Cerrar un objeto es destructivo y va por `Delete`, no por `Escape`.
    expect(barra).toMatch(/"Delete"/);

    /*
      Las **dos capas**, con la ventana interna de la Enmienda 1: los menús de la
      barra escuchan en captura y frenan el evento; el panel escucha normal. Si
      alguien pusiera el panel en captura, `Escape` cerraría las dos a la vez y la
      jerarquía dejaría de existir.
    */
    expect(barra).toMatch(/addEventListener\("keydown", alTeclear, true\)/);
    expect(panel).not.toMatch(/addEventListener\("keydown"[^)]*true\)/);
  });

  it("la barra queda **por encima** del panel: se puede cambiar de objeto sin cerrarlo", () => {
    // Medido en el navegador: con el fondo del panel encima, la barra se veía y
    // no se podía tocar. El orden importa y por eso se prueba.
    const zBarra = /zIndex: (\d+), padding: "0 16px", pointerEvents: "none"/.exec(barra);
    const zPanel = /zIndex: (\d+),\n\s*background: "rgba\(0,0,0,0\.18\)"/.exec(panel);
    expect(zBarra).not.toBeNull();
    expect(zPanel).not.toBeNull();
    expect(Number(zBarra?.[1])).toBeGreaterThan(Number(zPanel?.[1]));
  });

  /**
   * El marco — ADR-088, Enmienda 2.
   *
   * ⚠️ **La aritmética vive en el dominio, y eso se prueba.** Si el arrastre se
   * calculara en el componente, el caso que rompe un manejo de ventanas
   * casero —un marco de otra pantalla que nace inalcanzable— sólo se podría
   * probar con un mouse de mentira.
   */
  it("el marco se calcula en el dominio, y no reusa la palabra `ventana`", () => {
    const marco = readFileSync(resolve(ROOT, "lib/domain/marco-de-panel.ts"), "utf8");
    expect(marco).toMatch(/export function (mover|redimensionar|alternarExpandido)/);
    // Puro: sin React y sin DOM.
    expect(marco).not.toMatch(/from "react"|document\.|window\./);

    /*
      `Ventana` ya significa **dos cosas** en este dominio —la de preparación de
      ADR-078 y `VentanaDeExamen`—. Que el marco no se llame así es lo que
      impide que *"la ventana de Álgebra es corta"* tenga dos sentidos (`A-04`).
    */
    expect(marco).not.toMatch(/\b(interface|type|const|function) Ventana\b/);
  });

  /**
   * Los dos defectos que la Enmienda 2 tuvo **y que se midieron en el navegador**.
   * Los dos son del tipo que vuelve en la próxima refactorización.
   */
  it("el marco se guarda desde el gesto, no desde el estado", () => {
    /*
      La primera versión leía `arrastre` —estado— al soltar y **guardaba el
      marco de antes**: el `setArrastre` del último `pointermove` todavía no
      había llegado a ese closure. La ventana se achicaba y volvía al tamaño
      original al minimizarla.
    */
    expect(panel).toMatch(/guardarMarco\(clave, g\.ultimo\)/);
    expect(panel).not.toMatch(/guardarMarco\(clave, arrastre\)/);
  });

  it("la ventana se agarra de toda la barra **menos de sus botones**", () => {
    /*
      La primera versión exigía `e.target === e.currentTarget`, o sea sólo el
      fondo: agarrar del nombre del objeto —de donde agarra cualquiera— no movía
      nada. Lo que sí hay que excluir son los botones, o apretar «minimizar»
      movería la ventana.
    */
    expect(panel).toMatch(/closest\("button"\)/);
    expect(panel).not.toMatch(/e\.target !== e\.currentTarget/);
  });

  /** La ventana interna — ADR-088, Enmienda 1. */
  it("la ventana interna vive en la URL, atrapa el foco y no ofrece CTA de dominio", () => {
    // Requisito 1: el panel es un parámetro, no un estado en memoria.
    expect(dominio).toMatch(/export const PARAM_PANEL/);
    expect(panel).toMatch(/role="dialog"/);
    expect(panel).toMatch(/aria-modal="true"/);
    // Requisito 3: trampa de foco y devolución del foco al cerrar.
    expect(panel).toMatch(/"Tab"/);
    expect(panel).toMatch(/anterior\?\.focus\?\.\(\)/);
    /*
      **Ninguna CTA muerta.** `MateriaCursado` dibuja sus CTAs por el dato, no
      por el manejador: sin cablearlas, *«Activar Modo Examen»* aparecía adentro
      del panel y no hacía nada. Se midió en el navegador.

      Y cablearlas no rompe la Enmienda 1: **todas navegan**, así que el panel
      sigue sin decidir — te lleva al lugar donde se decide.
    */
    expect(panel).toMatch(/onAvanzar=/);
    expect(panel).toMatch(/onModoExamen=/);
    expect(panel).toMatch(/router\.push/);
    // Y los destinos salen del registro canónico, no escritos a mano.
    expect(panel).toMatch(/rutaDeCta\("CTA-002"\)/);
    expect(panel).not.toMatch(/router\.push\("\/(materia|examen|progreso)/);
  });

  it("5 · comportamiento a escala: se reparte, no se comprime — `A-07`", () => {
    expect(dominio).toMatch(/export const VISIBLES/);
    expect(dominio).toMatch(/export function repartir/);
    expect(barra).toMatch(/repartir\(/);
  });

  /**
   * **Se agregó después de verlo fallar en pantalla.**
   *
   * La primera versión pasaba la evaluación como contexto del objeto, y
   * *"Parcial 1 · practico · sáb 26 sept"* empujaba el nombre de la materia a
   * `ANALISI…`. Eso **es** `A-07`, no algo parecido: el anti-patrón catalogado
   * dice *"el dock ya trunca títulos con dos elementos abiertos"*.
   *
   * Lo que lo evita son dos cosas, y las dos se prueban: el contexto se recorta
   * **antes** que el nombre, y una materia no lleva contexto porque **es** el
   * objeto.
   */
  it("5b · cuando no entra, se sacrifica el contexto **antes** que el nombre", () => {
    const etiqueta = barra.slice(barra.indexOf("objeto.etiqueta}"));
    const nombre = /flexShrink: 1, minWidth: 0/.exec(barra);
    const contexto = /flexShrink: 6, minWidth: 0/.exec(barra);
    expect(nombre).not.toBeNull();
    expect(contexto).not.toBeNull();
    // El contexto cede más que el nombre. Si alguien los iguala, el nombre
    // vuelve a truncarse primero y el defecto regresa sin que nadie lo note.
    expect(etiqueta.length).toBeGreaterThan(0);
    expect((contexto?.index ?? 0) > (nombre?.index ?? 0)).toBe(true);
  });

  it("6 · límite duro de objetos abiertos, y desalojar no es silencioso", () => {
    expect(dominio).toMatch(/export const LIMITE_DURO/);
    // El aviso es la mitad que importa: un objeto que desaparece sin decirlo es
    // peor que no tener límite.
    expect(barra).toMatch(/ESPACIO\.DESALOJADO/);
  });

  /**
   * **El punto 2 de ADR-019 no fue superseded, y se sigue probando.**
   *
   * El breadcrumb contesta *"¿dónde estoy?"* y el espacio *"¿qué tengo
   * abierto?"*. Si la miga desapareciera, el espacio habría terminado siendo la
   * segunda lista de destinos que ADR-019 temía — que es justo lo que ADR-088
   * se comprometió a no hacer.
   */
  it("el breadcrumb sigue existiendo: el espacio NO lo reemplaza", () => {
    const topbar = readFileSync(resolve(ROOT, "components/shell/barra-superior.tsx"), "utf8");
    expect(topbar).toMatch(/breadcrumb|miga/i);
  });

  it("el espacio no es navegación: no entra al menú ni al registro de CTAs", () => {
    // No solicita una acción de dominio, así que no es una CTA; y no es un
    // destino que uno elige, así que no es un ítem de menú.
    const menu = readFileSync(resolve(ROOT, "lib/navigation/menu.ts"), "utf8");
    const registro = readFileSync(resolve(ROOT, "lib/navigation/cta-registry.ts"), "utf8");
    expect(menu).not.toMatch(/espacio-de-trabajo|objeto-abierto/i);
    expect(registro).not.toMatch(/espacio-de-trabajo|objeto-abierto/i);
  });

  /**
   * `design-system-capturas.md` §12.8 conserva el descarte original **con su
   * fecha y su razón**, y anota qué premisa caducó. Un documento que borra por
   * qué dijo que no se equivoca dos veces.
   */
  it("§12.8 conserva el descarte original y registra la supersesión", () => {
    const doc = readFileSync(resolve(ROOT, "docs/design-system-capturas.md"), "utf8");
    const descartes = doc
      .split("\n")
      .filter((l) => /dock/i.test(l) && /no aplica|no se copia|requiere multiventana/i.test(l));
    expect(descartes.length).toBeGreaterThanOrEqual(2);
    expect(doc).toMatch(/adr-088/i);
    // `A-07` no se saca de la lista de anti-patrones: se dice cómo se evita.
    expect(doc).toMatch(/`A-07` \| El dock \*\*ya trunca títulos/);
  });
});
