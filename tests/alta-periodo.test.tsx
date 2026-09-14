import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AltaCarrera } from "@/components/alta/carrera";
import { AltaMaterias, type RequisitoElegible } from "@/components/alta/materias";
import { t } from "@/lib/content/es-AR";

/**
 * El período se pregunta — [ADR-061](../docs/decisions.md#adr-061) y
 * [ADR-105](../docs/decisions.md#adr-105) §2, corte 2 del plan.
 *
 * Lo que se protege: **ninguna respuesta llega elegida**, confirmar sin período
 * no es posible, y `/alta/materias` muestra las anuales en su propio grupo, una
 * sola vez.
 */

const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const INSTITUCION = {
  institucionId: "inst-syn",
  nombre: "Universidad SYN",
  carreras: [{ carreraId: "prog-syn", nombre: "Carrera SYN", facultad: null, tienePlan: true }],
};

describe("/alta/carrera pregunta año lectivo y semestre", () => {
  async function montarConPlan(onContinuar = vi.fn(async () => ({ ok: true as const }))) {
    render(
      <AltaCarrera
        institucion={INSTITUCION}
        onResolverPlan={async () => ({ estado: "OK", planId: "plan-syn", version: "SYN-1" })}
        onAniosDelPlan={async () => [1, 2]}
        aniosLectivos={[2025, 2026, 2027]}
        onContinuar={onContinuar}
      />,
    );
    fireEvent.change(screen.getByLabelText(t("ALTA.CARRERA.CARRERA")), { target: { value: "prog-syn" } });
    await waitFor(() => screen.getByLabelText(t("ALTA.CARRERA.ANIO")));
    return onContinuar;
  }

  it("ningún semestre llega elegido", async () => {
    await montarConPlan();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(2);
    for (const r of radios) expect(r.getAttribute("aria-checked")).toBe("false");
    expect((screen.getByLabelText(t("ALTA.CARRERA.ANIO_LECTIVO")) as HTMLSelectElement).value).toBe("");
  });

  it("sin año lectivo y semestre la CTA no avanza", async () => {
    const onContinuar = await montarConPlan();
    fireEvent.change(screen.getByLabelText(t("ALTA.CARRERA.ANIO")), { target: { value: "2" } });
    const cta = screen.getByRole("button", { name: t("ALTA.CARRERA.CTA") }) as HTMLButtonElement;
    expect(cta.disabled).toBe(true);
    fireEvent.click(cta);
    expect(onContinuar).not.toHaveBeenCalled();
  });

  it("con las tres respuestas, manda exactamente lo que el estudiante eligió", async () => {
    const onContinuar = await montarConPlan();
    fireEvent.change(screen.getByLabelText(t("ALTA.CARRERA.ANIO")), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText(t("ALTA.CARRERA.ANIO_LECTIVO")), { target: { value: "2026" } });
    fireEvent.click(screen.getByRole("radio", { name: t("ALTA.CARRERA.SEMESTRE_SEGUNDO") }));
    fireEvent.click(screen.getByRole("button", { name: t("ALTA.CARRERA.CTA") }));
    await waitFor(() => expect(onContinuar).toHaveBeenCalledTimes(1));
    expect(onContinuar).toHaveBeenCalledWith({
      planId: "plan-syn",
      anio: 2,
      anioLectivo: 2026,
      semestre: "SECOND_SEMESTER",
    });
  });
});

describe("/alta/materias agrupa por período", () => {
  const req = (id: string, extra: Partial<RequisitoElegible>): RequisitoElegible => ({
    requisitoId: id,
    codigo: id,
    nombre: `Materia ${id}`,
    tipo: "COURSE",
    anio: 2,
    periodo: null,
    esAnual: false,
    nombreCortado: false,
    materiaId: `mat-${id}`,
    opciones: [],
    ...extra,
  });

  const REQUISITOS = [
    req("P1", { periodo: "FIRST_SEMESTER" }),
    req("S2", { periodo: "SECOND_SEMESTER" }),
    req("AN", { esAnual: true }),
    req("SD", {}),
  ];

  it("las anuales van en su grupo, una sola vez, y la de segundo no está entre las de primero", () => {
    const { container } = render(
      <AltaMaterias anioElegido={2} semestreElegido="FIRST_SEMESTER" requisitos={REQUISITOS} onConfirmar={vi.fn()} />,
    );
    const del = container.querySelector('[data-grupo="del-semestre"]')!;
    const anuales = container.querySelector('[data-grupo="anuales"]')!;
    expect(del.textContent).toContain("Materia P1");
    expect(del.textContent).toContain("Materia SD");
    expect(del.textContent).not.toContain("Materia S2");
    expect(del.textContent).not.toContain("Materia AN");
    expect(anuales.textContent).toContain("Materia AN");
    expect(screen.getAllByText("Materia AN")).toHaveLength(1);
  });

  it("en segundo semestre, la anual sigue apareciendo", () => {
    const { container } = render(
      <AltaMaterias anioElegido={2} semestreElegido="SECOND_SEMESTER" requisitos={REQUISITOS} onConfirmar={vi.fn()} />,
    );
    expect(container.querySelector('[data-grupo="anuales"]')!.textContent).toContain("Materia AN");
    expect(container.querySelector('[data-grupo="del-semestre"]')!.textContent).toContain("Materia S2");
  });
});

describe("las rutas del alta rechazan un período que no eligió nadie", () => {
  for (const ruta of ["app/api/alta/carrera/route.ts", "app/api/alta/materias/route.ts"]) {
    it(`${ruta}: valida la clave canónica y responde 400`, () => {
      const fuente = LEER(ruta);
      expect(fuente).toContain("!leerClaveDePeriodo(cuerpo.periodo)");
      expect(fuente).toMatch(/leerClaveDePeriodo\(cuerpo\.periodo\)\) \{\s*return NextResponse\.json\([^)]*\{ status: 400 \}/);
    });
  }
});
