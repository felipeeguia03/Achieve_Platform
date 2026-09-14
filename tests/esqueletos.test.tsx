import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AltaCarreraEsqueleto } from "@/components/alta/carrera";
import { AltaMateriasEsqueleto } from "@/components/alta/materias";
import { ActivacionModoExamenEsqueleto } from "@/components/screens/activacion-modo-examen";
import { CompromisoEsqueleto } from "@/components/screens/compromiso";
import { EvidenciaEsqueleto } from "@/components/screens/evidencia";
import { FormacionEsqueleto } from "@/components/screens/formacion";
import { GimnasiaEsqueleto } from "@/components/screens/gimnasia";
import { HoyAutogestion, HoyAutogestionEsqueleto } from "@/components/screens/hoy-autogestion";
import { IndiceDeMateriasEsqueleto } from "@/components/screens/indice-de-materias";
import { MateriaCursado, MateriaCursadoEsqueleto } from "@/components/screens/materia-cursado";
import { ModoClaseEsqueleto } from "@/components/screens/modo-clase";
import { OverviewModoExamenEsqueleto } from "@/components/screens/overview-modo-examen";
import { PasoDeProtocoloEsqueleto } from "@/components/screens/paso-de-protocolo";
import { ProgresoBitacoraEsqueleto } from "@/components/screens/progreso-bitacora";
import { ProximaAccionEsqueleto } from "@/components/screens/proxima-accion";
import { t } from "@/lib/content/es-AR";
import { getEscenario, proyectarHoy } from "@/lib/fixtures";
import type { MateriaProps } from "@/lib/domain/view-models";

/**
 * Los esqueletos de carga — `P-12`, `design-system-capturas.md` §9.1.
 *
 * Lo que se prueba no es que se vean lindos: es que **no digan nada**. Un
 * esqueleto con un nombre, un número, un color de materia o un botón es un
 * fixture colado en una pantalla real, y es exactamente lo que la B2.5 enseñó a
 * no dejar pasar (`tests/superficies-conectadas.test.ts`).
 */

const RAIZ = resolve(__dirname, "..");

const ESQUELETOS = {
  Hoy: HoyAutogestionEsqueleto,
  Materia: MateriaCursadoEsqueleto,
  Materias: IndiceDeMateriasEsqueleto,
  Accion: ProximaAccionEsqueleto,
  Compromiso: CompromisoEsqueleto,
  Evidencia: EvidenciaEsqueleto,
  Progreso: ProgresoBitacoraEsqueleto,
  ActivacionModoExamen: ActivacionModoExamenEsqueleto,
  OverviewModoExamen: OverviewModoExamenEsqueleto,
  PasoDeProtocolo: PasoDeProtocoloEsqueleto,
  Formacion: FormacionEsqueleto,
  ModoClase: ModoClaseEsqueleto,
  // ADR-102: entró por la rama de Gimnasia, antes de que existiera P-12.
  Gimnasia: GimnasiaEsqueleto,
  AltaCarrera: AltaCarreraEsqueleto,
  AltaMaterias: AltaMateriasEsqueleto,
};

describe("cada esqueleto", () => {
  it.each(Object.entries(ESQUELETOS))("%s avisa que carga una sola vez, y a quien lee con lector", (_, Esqueleto) => {
    const { container } = render(<Esqueleto />);
    const marco = container.querySelector("[data-cargando]");
    expect(marco).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent(t("COMUN.CARGANDO"));
  });

  it.each(Object.entries(ESQUELETOS))("%s no afirma nada: bloques mudos, sin botones, sin color de materia", (_, Esqueleto) => {
    const { container } = render(<Esqueleto />);
    const bloques = Array.from(container.querySelectorAll("[data-esqueleto]"));
    expect(bloques.length).toBeGreaterThan(0);
    for (const b of bloques) {
      expect(b.closest("[aria-hidden]")).not.toBeNull();
      expect(b.textContent?.trim()).toBe("");
      // Late sólo si el sistema no pide menos movimiento (§9.1).
      expect(b.className).toContain("motion-safe:animate-pulse");
      expect(b.className).not.toMatch(/(^|\s)animate-pulse/);
    }
    // Nada que apretar: una CTA antes de los datos no tiene a dónde llevar.
    expect(container.querySelectorAll("button, a, input, select, textarea")).toHaveLength(0);
    expect(container.querySelector("[data-cta-primaria]")).toBeNull();
    // Ni identidad de materia, ni tono semántico, ni ausencia tipada.
    expect(container.querySelector("[data-marca-de-materia], [data-tono], [data-ausencia], [data-evento]")).toBeNull();
    expect(container.innerHTML).not.toMatch(/--materia-\d/);
  });

  it.each(Object.entries(ESQUELETOS))("%s no inventa cifras: ni porcentajes, ni «de 12», ni cero", (_, Esqueleto) => {
    const { container } = render(<Esqueleto />);
    const texto = container.textContent ?? "";
    expect(texto).not.toMatch(/\d+ ?%|\bde 12\b|\b0\b/);
  });

  it.each(Object.entries(ESQUELETOS))("%s tiene un `h1`, y uno solo", (_, Esqueleto) => {
    const { container } = render(<Esqueleto />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
  });
});

describe("lo fijo va real desde el primer frame (§9.1)", () => {
  it("Hoy trae su título, su subcopy y los títulos del cuadro y de los riesgos", () => {
    render(<HoyAutogestionEsqueleto />);
    expect(screen.getByRole("heading", { level: 1, name: t("HOY.TITULO") })).toBeInTheDocument();
    expect(screen.getByText(t("HOY.CUADRO"))).toBeInTheDocument();
    expect(screen.getByText(t("HOY.RIESGOS"))).toBeInTheDocument();
  });

  it("Gimnasia trae su título y el aviso responsable, sin ofrecer empezar nada", () => {
    render(<GimnasiaEsqueleto />);
    expect(screen.getByRole("heading", { level: 1, name: t("GIMNASIA.TITULO") })).toBeInTheDocument();
    expect(screen.getByText(t("GIMNASIA.AVISO_RESPONSABLE"))).toBeInTheDocument();
    expect(screen.queryByText(t("GIMNASIA.RUTINA.EMPEZAR"))).toBeNull();
  });

  it("Evidencia deja leer la regla del flujo: enviar no es suficiencia", () => {
    render(<EvidenciaEsqueleto />);
    expect(screen.getByText(t("EVIDENCIA.ENVIAR_IMPLICA"))).toBeInTheDocument();
  });

  it("Paso de protocolo deja leer que el objetivo del paso no es una Action", () => {
    render(<PasoDeProtocoloEsqueleto />);
    expect(screen.getByText(t("PASO.SEPARACION"))).toBeInTheDocument();
  });
});

describe("lo que llega aparte también tiene su lugar", () => {
  const HOY = proyectarHoy(getEscenario("FX-DAY-BASE"))!;

  it("en Hoy, el tablero todavía no llegó: el Hero ya ocupa sus dos tercios y el cuadro espera", () => {
    const { container } = render(<HoyAutogestion {...HOY} tablero={null} tableroCargando />);
    expect(container.querySelector(".lg\\:col-span-2")).not.toBeNull();
    expect(container.querySelectorAll("[data-esqueleto]").length).toBeGreaterThan(0);
    // El Hero es real: su CTA sigue siendo la única principal.
    expect(container.querySelectorAll("[data-cta-primaria]")).toHaveLength(1);
  });

  it("en Hoy, un tablero que falló no se dibuja como si cargara", () => {
    const { container } = render(<HoyAutogestion {...HOY} tablero={null} tableroCargando={false} />);
    expect(container.querySelector("[data-esqueleto]")).toBeNull();
    expect(container.querySelector(".lg\\:col-span-2")).toBeNull();
  });

  it("en Materia, *Tus clases* espera en su lugar y no como sección vacía", () => {
    const materia = getEscenario("FX-DAY-BASE").materia as MateriaProps;
    const { container } = render(<MateriaCursado {...materia} tusClases={null} tusClasesCargando />);
    const titulo = screen.getByText(t("MATERIA.TUS_CLASES"));
    expect(within(titulo.closest("section")!).queryByText(t("MATERIA.TUS_CLASES.VACIO"))).toBeNull();
    expect(container.querySelectorAll("[data-esqueleto]").length).toBeGreaterThan(0);
  });
});

describe("ninguna pantalla que carga vuelve a la pantalla en blanco", () => {
  function fuentes(dir: string): string[] {
    return readdirSync(resolve(RAIZ, dir), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? fuentes(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [join(dir, e.name)] : [],
    );
  }

  it("ni las superficies ni el alta devuelven `null` mientras cargan", () => {
    const culpables = [...fuentes("components/superficies"), ...fuentes("app/alta")].filter((f) =>
      /"CARGANDO"\)\s*return null/.test(readFileSync(resolve(RAIZ, f), "utf8")),
    );
    expect(culpables).toEqual([]);
  });
});
