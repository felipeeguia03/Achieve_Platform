import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OverviewModoExamen } from "@/components/screens/overview-modo-examen";
import { escenariosUX08 } from "@/lib/fixtures/ux08";
import { escenariosConUX08 } from "@/lib/fixtures";
import { nivelesOverview } from "@/lib/domain/overview-precedence";

const ids = Object.keys(escenariosUX08) as (keyof typeof escenariosUX08)[];
const todos = ids.map((id) => escenariosUX08[id]);
const vistas = todos.map((e) => e.ux08!);

describe("Cobertura de la matriz de estados críticos (VI.8 §16)", () => {
  it("hay 35 escenarios cubriendo los 28 estados obligatorios y sus variantes", () => {
    expect(ids).toHaveLength(35);
  });

  it("el catálogo general los incluye a todos", () => {
    for (const id of ids) expect(escenariosConUX08).toContain(id);
  });

  it("los diez niveles de precedencia son alcanzables desde el catálogo", () => {
    const cubiertos = new Set(vistas.map((v) => v.nivel));
    for (const nivel of nivelesOverview) expect(cubiertos, `nivel ${nivel}`).toContain(nivel);
  });

  it("las siete variantes también", () => {
    const cubiertas = new Set(vistas.map((v) => v.variante).filter((v) => v !== null));
    for (const variante of [
      "COMMITMENT_CONFIRMED_FUTURO", "COMMITMENT_DUE", "COMMITMENT_STARTED",
      "RESCUE_REQUIRED", "RESCATE_REAL", "PROGRESS_UPDATED", "PROGRESS_ENTRY",
    ]) {
      expect(cubiertas, variante).toContain(variante);
    }
  });

  it("cada escenario renderiza sin romper", () => {
    for (const id of ids) {
      const { unmount } = render(<OverviewModoExamen {...escenariosUX08[id].ux08!} />);
      unmount();
    }
  });
});

describe("Una sola CTA primaria (§14)", () => {
  it("se renderiza exactamente una, o ninguna", () => {
    for (const e of todos) {
      const { container, unmount } = render(<OverviewModoExamen {...e.ux08!} />);
      expect(container.querySelectorAll("button.w-full").length, e.id).toBe(e.ux08!.ctaPrimaria ? 1 : 0);
      unmount();
    }
  });

  it("el retorno nunca coincide con la primaria", () => {
    for (const e of todos) {
      if (e.ux08!.ctaPrimaria?.texto === "VOLVER A CURSADO") continue; // nivel 10: es la misma acción
      expect(e.ux08!.ctaRetorno, e.id).not.toBe(e.ux08!.ctaPrimaria?.texto);
    }
  });
});

describe("§18 y ADR-011 — readiness", () => {
  it("ningún escenario muestra score, porcentaje ni 'Listo para rendir'", () => {
    for (const e of todos) {
      const { container, unmount } = render(<OverviewModoExamen {...e.ux08!} />);
      const texto = container.textContent ?? "";
      expect(texto, e.id).not.toMatch(/\d+\s?%/);
      expect(texto, e.id).not.toContain("Listo para rendir");
      expect(texto, e.id).not.toContain("Preparación 60");
      unmount();
    }
  });

  it("el status recibido se muestra con su descargo, y sin card", () => {
    const v = escenariosUX08["FX-LOCAL-OV-READY-BY-PROTOCOL"].ux08!;
    const { container } = render(<OverviewModoExamen {...v} />);
    expect(
      screen.getByText(/informa que cumpliste las condiciones del protocolo vigente/),
    ).toBeInTheDocument();
    // El descargo va SIEMPRE junto al valor: sin él, el valor promete.
    expect(screen.getByText("Esto no predice ni garantiza el resultado.")).toBeInTheDocument();
    expect(container.querySelectorAll("[data-status-recibido]")).toHaveLength(1);
  });

  it("solo un escenario trae status recibido: el resto no muestra nada", () => {
    const conStatus = vistas.filter((v) => v.statusRecibido !== null);
    expect(conStatus).toHaveLength(1);
  });
});

describe("§17 — progreso y no progreso", () => {
  it("solo aparece un cambio confirmado donde hay un ProgressUpdated real", () => {
    for (const e of todos) {
      const v = e.ux08!;
      if (v.cambioConfirmado.length > 0) {
        expect(v.variante, `${e.id} muestra cambio sin ProgressUpdated`).toBe("PROGRESS_UPDATED");
      }
    }
  });

  it("una evidencia en revisión no produce cambio de progreso", () => {
    for (const id of ["FX-LOCAL-OV-UNDER-REVIEW-SIN-GATE", "FX-LOCAL-OV-UNDER-REVIEW-CON-GATE"] as const) {
      expect(escenariosUX08[id].ux08!.cambioConfirmado).toHaveLength(0);
    }
  });

  it("'sin información' no se muestra como cero", () => {
    for (const e of todos) {
      const { container, unmount } = render(<OverviewModoExamen {...e.ux08!} />);
      expect(container.textContent ?? "", e.id).not.toMatch(/\b0\s?%/);
      unmount();
    }
  });

  it("una falla de lectura no se presenta como no-cambio", () => {
    const v = escenariosUX08["FX-LOCAL-OV-NO-DISPONIBLE"].ux08!;
    render(<OverviewModoExamen {...v} />);
    expect(screen.getByText("No pudimos cargar el progreso. Tu evidencia conserva su estado.")).toBeInTheDocument();
    expect(screen.queryByText(/Todavía no hay un cambio/)).toBeNull();
  });
});

describe("Precedencia en pantalla", () => {
  it("IN_PROGRESS gana y lo secundario se muestra como secundario, no se oculta", () => {
    const v = escenariosUX08["FX-LOCAL-OV-IN-PROGRESS"].ux08!;
    expect(v.nivel).toBe(1);
    render(<OverviewModoExamen {...v} />);
    expect(screen.getByRole("button", { name: "CONTINUAR" })).toBeInTheDocument();
    expect(screen.getByText("Hay un compromiso incumplido sin resolver.")).toBeInTheDocument();
    expect(screen.getByText("Una evidencia anterior sigue en revisión.")).toBeInTheDocument();
  });

  it("UNDER_REVIEW sin gate deja el paso primario; con gate pasa a VER EVIDENCIA", () => {
    const sinGate = escenariosUX08["FX-LOCAL-OV-UNDER-REVIEW-SIN-GATE"].ux08!;
    const conGate = escenariosUX08["FX-LOCAL-OV-UNDER-REVIEW-CON-GATE"].ux08!;
    expect(sinGate.nivel).toBe(7);
    expect(sinGate.ctaPrimaria!.texto).toBe("ABRIR PASO ACTUAL");
    expect(conGate.nivel).toBe(8);
    expect(conGate.ctaPrimaria!.texto).toBe("VER EVIDENCIA");
  });

  it("con destino de progreso ambiguo no se elige entre VER AVANCE y VER BITÁCORA", () => {
    const v = escenariosUX08["FX-LOCAL-OV-PROGRESO-AMBIGUO"].ux08!;
    expect(v.nivel).toBe(10);
    render(<OverviewModoExamen {...v} />);
    expect(screen.queryByText("VER AVANCE")).toBeNull();
    expect(screen.queryByText("VER BITÁCORA")).toBeNull();
  });
});

describe("Omitir, no inventar", () => {
  it("sin protocolo no se listan doce pasos: se dice que no está disponible", () => {
    const v = escenariosUX08["FX-LOCAL-OV-SIN-RECORRIDO"].ux08!;
    expect(v.recorrido).toBeNull();
    const { container } = render(<OverviewModoExamen {...v} />);
    expect(screen.getByText("RECORRIDO TODAVÍA NO DISPONIBLE")).toBeInTheDocument();
    expect(container.textContent ?? "").not.toMatch(/de 12|Paso \d+ de/);
  });

  it("ningún escenario muestra 'Paso N de M'", () => {
    for (const e of todos) {
      const { container, unmount } = render(<OverviewModoExamen {...e.ux08!} />);
      expect(container.textContent ?? "", e.id).not.toMatch(/\bde 12\b|\bPaso \d+ de \d+/);
      unmount();
    }
  });

  it("fecha desconocida: sin countdown", () => {
    const v = escenariosUX08["FX-LOCAL-OV-FECHA-DESCONOCIDA"].ux08!;
    const { container } = render(<OverviewModoExamen {...v} />);
    expect(container.querySelector('[data-dato="Fecha"]')!.textContent).toContain("Desconocida");
    expect(container.textContent ?? "").not.toMatch(/faltan \d+ días/i);
  });

  it("un relativo solo aparece cuando el owner lo manda", () => {
    const conRelativo = escenariosUX08["FX-LOCAL-OV-FECHA-PROXIMA"].ux08!;
    render(<OverviewModoExamen {...conRelativo} />);
    expect(screen.getByText(/faltan 9 días/)).toBeInTheDocument();
  });
});

describe("Provenance: por dato, y ninguna capa la eleva (§19)", () => {
  it("una fecha reportada nunca parece oficial", () => {
    const { container } = render(
      <OverviewModoExamen {...escenariosUX08["FX-LOCAL-OV-FECHA-REPORTADA"].ux08!} />,
    );
    const fecha = container.querySelector('[data-dato="Fecha"]')!;
    expect(fecha.textContent).toContain("Reportado por vos · sin verificar");
    expect(fecha.textContent).not.toContain("oficial");
  });

  it("los datos contradictorios quedan separados y no se resuelven localmente", () => {
    const v = escenariosUX08["FX-LOCAL-OV-CONTRADICTORIOS"].ux08!;
    render(<OverviewModoExamen {...v} />);
    expect(screen.getByText("Dato en revisión · hay versiones distintas")).toBeInTheDocument();
    expect(screen.getByText("HAY DATOS CONTRADICTORIOS")).toBeInTheDocument();
  });

  it("confianza y dominio se muestran separadas: la confianza no es dominio", () => {
    const v = escenariosUX08["FX-LOCAL-OV-CONFIANZA-VS-DOMINIO"].ux08!;
    render(<OverviewModoExamen {...v} />);
    expect(screen.getByText("Confianza")).toBeInTheDocument();
    expect(screen.getByText("alta · declarada ayer")).toBeInTheDocument();
    expect(screen.getByText("Dominio")).toBeInTheDocument();
    expect(screen.getByText("no evaluado")).toBeInTheDocument();
  });

  it("los enums técnicos nunca aparecen como copy visible", () => {
    const prohibidos = ["official", "unverified", "corroborated", "disputed", "inference"];
    for (const e of todos) {
      const { container, unmount } = render(<OverviewModoExamen {...e.ux08!} />);
      const texto = (container.textContent ?? "").toLowerCase();
      for (const enumTecnico of prohibidos) {
        expect(texto, `${e.id} muestra "${enumTecnico}"`).not.toContain(enumTecnico);
      }
      unmount();
    }
  });
});

describe("Copy prohibido (§23)", () => {
  const prohibido = [
    "Ya dominás", "Listo para rendir", "Casi aprobado",
    "No avanzaste por ausencia de datos", "Plan generado", "Tu operador",
  ];

  it("ningún escenario lo usa", () => {
    for (const e of todos) {
      const { container, unmount } = render(<OverviewModoExamen {...e.ux08!} />);
      const texto = container.textContent ?? "";
      for (const frase of prohibido) expect(texto, `${e.id} usa "${frase}"`).not.toContain(frase);
      unmount();
    }
  });
});

describe("El Cursado no se interrumpe (§20)", () => {
  it("todos los escenarios conservan la banda de continuidad y su retorno", () => {
    for (const e of todos) {
      const { unmount } = render(<OverviewModoExamen {...e.ux08!} />);
      expect(screen.getByText("CURSADO PERSISTENTE")).toBeInTheDocument();
      expect(
        screen.getByText("Cursado, sus cinco dimensiones y la Bitácora continúan disponibles."),
      ).toBeInTheDocument();
      unmount();
    }
  });
});
