import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PasoDeProtocolo } from "@/components/screens/paso-de-protocolo";
import { escenariosUX09 } from "@/lib/fixtures/ux09";
import { escenariosConUX09 } from "@/lib/fixtures";
import { nivelesPaso, selectStepLevel, type StepInput } from "@/lib/domain/step-precedence";

const ids = Object.keys(escenariosUX09) as (keyof typeof escenariosUX09)[];
const todos = ids.map((id) => escenariosUX09[id]);
const vistas = todos.map((e) => e.ux09!);

const nada: StepInput = {
  action: "NONE", commitment: "NONE", rescate: "NONE", evidence: "NONE",
  recomendacionPrimariaVigente: false, recursoDisponible: false, cierreNoConfirmado: true,
  gateAutoritativo: false, progreso: "NONE", nuevoCurrentDisponible: false,
};

describe("Los once niveles de VI.9 §19", () => {
  const minimos: Record<number, StepInput> = {
    1: { ...nada, action: "IN_PROGRESS" },
    2: { ...nada, action: "EVIDENCE_PENDING" },
    3: { ...nada, commitment: "DUE" },
    4: { ...nada, commitment: "MISSED" },
    5: { ...nada, evidence: "RESUBMISSION_REQUESTED" },
    6: { ...nada, recomendacionPrimariaVigente: true },
    7: { ...nada, recursoDisponible: true },
    8: { ...nada, evidence: "INFORMATIVA" },
    9: { ...nada, progreso: "PROGRESS_UPDATED" },
    10: { ...nada, cierreNoConfirmado: false, nuevoCurrentDisponible: true },
    11: { ...nada },
  };

  for (const nivel of nivelesPaso) {
    it(`alcanza el nivel ${nivel}`, () => {
      expect(selectStepLevel(minimos[nivel]).nivel).toBe(nivel);
    });
  }

  it("cada nivel gana sobre todos los posteriores", () => {
    const activa: Record<number, Partial<StepInput>> = {
      1: { action: "IN_PROGRESS" }, 2: { action: "EVIDENCE_PENDING" },
      3: { commitment: "DUE" }, 4: { commitment: "MISSED" },
      5: { evidence: "RESUBMISSION_REQUESTED" }, 6: { recomendacionPrimariaVigente: true },
      7: { recursoDisponible: true }, 8: { evidence: "INFORMATIVA" },
      9: { progreso: "PROGRESS_UPDATED" }, 10: { nuevoCurrentDisponible: true }, 11: {},
    };
    for (const nivel of nivelesPaso) {
      let input: StepInput = { ...nada };
      for (let j = 11; j >= nivel; j--) input = { ...input, ...activa[j] };
      expect(selectStepLevel(input).nivel, `nivel ${nivel} debía ganar`).toBe(nivel);
    }
  });
});

describe("Los conflictos que §19.1 declara", () => {
  it("IN_PROGRESS vence a MISSED, Evidence informativa, progreso y recomendación", () => {
    expect(selectStepLevel({
      ...nada, action: "IN_PROGRESS", commitment: "MISSED", evidence: "INFORMATIVA",
      progreso: "PROGRESS_UPDATED", recomendacionPrimariaVigente: true,
    }).nivel).toBe(1);
  });

  it("EVIDENCE_PENDING vence a recomendación y a Resource", () => {
    expect(selectStepLevel({
      ...nada, action: "EVIDENCE_PENDING", recomendacionPrimariaVigente: true, recursoDisponible: true,
    }).nivel).toBe(2);
  });

  it("un Commitment vigente vence a recomendación y a Resource", () => {
    expect(selectStepLevel({
      ...nada, commitment: "DUE", recomendacionPrimariaVigente: true, recursoDisponible: true,
    }).nivel).toBe(3);
  });

  it("RESUBMISSION_REQUESTED vence a recomendación y a Resource", () => {
    expect(selectStepLevel({
      ...nada, evidence: "RESUBMISSION_REQUESTED", recomendacionPrimariaVigente: true, recursoDisponible: true,
    }).nivel).toBe(5);
  });

  it("la recomendación vence a Resource, Evidence informativa y ProgressUpdated", () => {
    expect(selectStepLevel({
      ...nada, recomendacionPrimariaVigente: true, recursoDisponible: true,
      evidence: "INFORMATIVA", progreso: "PROGRESS_UPDATED",
    }).nivel).toBe(6);
  });

  it("el Resource accionable conserva prioridad sobre una Evidence informativa sin gate", () => {
    expect(selectStepLevel({ ...nada, recursoDisponible: true, evidence: "UNDER_REVIEW" }).nivel).toBe(7);
  });

  it("con gate autoritativo durante la revisión, VER EVIDENCIA puede ser primaria", () => {
    expect(selectStepLevel({
      ...nada, recursoDisponible: true, evidence: "UNDER_REVIEW", gateAutoritativo: true,
    }).nivel).toBe(8);
  });

  it("ProgressUpdated no desplaza una Action, Commitment, recomendación ni Resource", () => {
    for (const extra of [
      { action: "IN_PROGRESS" }, { commitment: "DUE" },
      { recomendacionPrimariaVigente: true }, { recursoDisponible: true },
    ] as Partial<StepInput>[]) {
      expect(selectStepLevel({ ...nada, ...extra, progreso: "PROGRESS_UPDATED" }).nivel).toBeLessThan(9);
    }
  });

  it("la completion no habilita el nivel 10 si todavía hay lifecycles activos", () => {
    expect(selectStepLevel({
      ...nada, cierreNoConfirmado: false, nuevoCurrentDisponible: true, action: "IN_PROGRESS",
    }).nivel).toBe(1);
  });
});

describe("Cobertura de la matriz de estados críticos (VI.9 §22)", () => {
  it("hay 35 escenarios cubriendo los 31 estados obligatorios", () => {
    expect(ids).toHaveLength(35);
  });

  it("el catálogo general los incluye a todos", () => {
    for (const id of ids) expect(escenariosConUX09).toContain(id);
  });

  it("cada escenario renderiza sin romper", () => {
    for (const id of ids) {
      const { unmount } = render(<PasoDeProtocolo {...escenariosUX09[id].ux09!} />);
      unmount();
    }
  });

  it("se renderiza exactamente una CTA primaria, o ninguna", () => {
    for (const e of todos) {
      const { container, unmount } = render(<PasoDeProtocolo {...e.ux09!} />);
      expect(container.querySelectorAll("[data-cta-primaria]").length, e.id).toBe(e.ux09!.ctaPrimaria ? 1 : 0);
      unmount();
    }
  });
});

describe("§13.2 — nunca se muestra la posición", () => {
  it("ningún escenario dice 'Paso N de M' ni un porcentaje", () => {
    for (const e of todos) {
      const { container, unmount } = render(<PasoDeProtocolo {...e.ux09!} />);
      const texto = container.textContent ?? "";
      expect(texto, e.id).not.toMatch(/\bde 12\b/);
      expect(texto, e.id).not.toMatch(/Paso \d+ de \d+/);
      expect(texto, e.id).not.toMatch(/\d+\s?%/);
      unmount();
    }
  });

  it("la versión se muestra tal como llega, sin declararla vigente", () => {
    const { container } = render(<PasoDeProtocolo {...escenariosUX09["FX-LOCAL-PASO-COMPLETO"].ux09!} />);
    const texto = container.textContent ?? "";
    expect(texto).toContain("Protocolo v3");
    expect(texto).not.toMatch(/protocolo (vigente|actual|última)/i);
  });
});

describe("§12.1 — se renderiza contenido recibido, no se genera", () => {
  it("un bloque ausente usa el copy exacto del spec, no una versión propia", () => {
    const casos: [keyof typeof escenariosUX09, string, string][] = [
      ["FX-LOCAL-PASO-SIN-ENTREGABLE", "ENTREGABLE ESPERADO", "Entregable de este paso no disponible"],
      ["FX-LOCAL-PASO-SIN-CRITERIO", "CRITERIO ESPERADO", "Criterio de este paso no disponible"],
      ["FX-LOCAL-PASO-NO-DISPONIBLE", "OBJETIVO DEL PASO", "Objetivo de este paso no disponible"],
    ];
    for (const [id, bloque, copy] of casos) {
      const { container, unmount } = render(<PasoDeProtocolo {...escenariosUX09[id].ux09!} />);
      expect(container.querySelector(`[data-bloque="${bloque}"]`)!.textContent).toContain(copy);
      unmount();
    }
  });

  it("sin recurso configurado se dice, y no bloquea el paso", () => {
    const v = escenariosUX09["FX-LOCAL-PASO-SIN-RECURSO"].ux09!;
    expect(v.recurso).toBeNull();
    const { container } = render(<PasoDeProtocolo {...v} />);
    expect(screen.getByText("Este paso no tiene un recurso configurado")).toBeInTheDocument();
    expect(container.querySelector("[data-recurso]")).toBeNull();
    // Hay CTA: la falta de recurso no deja la pantalla sin salida.
    expect(v.ctaPrimaria).not.toBeNull();
  });

  it("el objetivo se separa explícitamente de una Action del Engine", () => {
    render(<PasoDeProtocolo {...escenariosUX09["FX-LOCAL-PASO-COMPLETO"].ux09!} />);
    expect(
      screen.getByText("Objetivo del paso. No es una próxima acción generada por el Engine."),
    ).toBeInTheDocument();
  });
});

describe("Abrir no completa (§19.3 y §20)", () => {
  it("el aviso de apertura lo dice donde el paso está disponible", () => {
    render(<PasoDeProtocolo {...escenariosUX09["FX-LOCAL-PASO-COMPLETO"].ux09!} />);
    expect(screen.getByText("Abriste este paso. Abrirlo no lo completa.")).toBeInTheDocument();
  });

  it("abrir el recurso no promete completar ni iniciar", () => {
    const v = escenariosUX09["FX-LOCAL-PASO-COMPLETO"].ux09!;
    expect(v.despues).toBe("Abrís el recurso. Esto no inicia ni completa el paso.");
  });

  it("un paso completado sin siguiente no declara el protocolo terminado", () => {
    const v = escenariosUX09["FX-LOCAL-PASO-COMPLETADO-SIN-SIGUIENTE"].ux09!;
    const { container } = render(<PasoDeProtocolo {...v} />);
    expect(screen.getByText("Este paso está completado. Todavía no hay otro paso disponible.")).toBeInTheDocument();
    expect(container.textContent ?? "").not.toMatch(/protocolo (terminado|completo|finalizado)/i);
  });

  it("abrir el paso siguiente no lo completa", () => {
    const v = escenariosUX09["FX-LOCAL-PASO-COMPLETADO-CON-SIGUIENTE"].ux09!;
    expect(v.nivel).toBe(10);
    expect(v.despues).toContain("Abrirlo no lo completa.");
  });
});

describe("Ningún estado de Evidence es progreso (§21)", () => {
  const casos: [keyof typeof escenariosUX09, string][] = [
    ["FX-LOCAL-PASO-EVIDENCE-SUBMITTED", "Evidencia recibida. Esto no confirma suficiencia ni dominio."],
    ["FX-LOCAL-PASO-EVIDENCE-UNDER-REVIEW", "Evidencia en revisión. Esto no confirma progreso."],
    ["FX-LOCAL-PASO-EVIDENCE-SUFFICIENT", "La evidencia cumple el criterio mínimo. El progreso todavía no fue actualizado."],
    ["FX-LOCAL-PASO-EVIDENCE-VALIDATED", "Evidencia validada. El progreso todavía no fue actualizado."],
  ];

  for (const [id, copy] of casos) {
    it(`${id} lo dice explícitamente`, () => {
      render(<PasoDeProtocolo {...escenariosUX09[id].ux09!} />);
      expect(screen.getByText(copy)).toBeInTheDocument();
    });
  }

  it("INSUFFICIENT no es un fracaso y no habilita reenvío por sí solo", () => {
    const v = escenariosUX09["FX-LOCAL-PASO-EVIDENCE-INSUFFICIENT"].ux09!;
    expect(v.ctaPrimaria!.texto).not.toBe("PREPARAR NUEVA EVIDENCIA");
    render(<PasoDeProtocolo {...v} />);
    expect(screen.getByText(/Sólo se reenvía si el owner lo solicita/)).toBeInTheDocument();
  });

  it("solo RESUBMISSION_REQUESTED ofrece preparar una nueva", () => {
    const conSolicitud = vistas.filter((v) => v.ctaPrimaria?.texto === "PREPARAR NUEVA EVIDENCIA");
    expect(conSolicitud).toHaveLength(1);
    expect(conSolicitud[0].nivel).toBe(5);
  });
});

describe("Copy prohibido (§24.6)", () => {
  const prohibido = [
    "Completaste el paso", "Paso en progreso", "Aprobado",
    "Dominio demostrado", "Listo para rendir", "5 de 12",
  ];

  it("ningún escenario lo usa", () => {
    for (const e of todos) {
      const { container, unmount } = render(<PasoDeProtocolo {...e.ux09!} />);
      const texto = container.textContent ?? "";
      for (const frase of prohibido) expect(texto, `${e.id} usa "${frase}"`).not.toContain(frase);
      unmount();
    }
  });

  it("los enums técnicos nunca son copy visible", () => {
    for (const e of todos) {
      const { container, unmount } = render(<PasoDeProtocolo {...e.ux09!} />);
      const texto = (container.textContent ?? "").toLowerCase();
      for (const enumTecnico of ["official", "unverified", "corroborated", "disputed"]) {
        expect(texto, `${e.id} muestra "${enumTecnico}"`).not.toContain(enumTecnico);
      }
      unmount();
    }
  });
});

describe("Provenance del recurso", () => {
  it("desconocida no se oficializa", () => {
    const v = escenariosUX09["FX-LOCAL-PASO-PROVENANCE-DESCONOCIDA"].ux09!;
    expect(v.recurso!.provenance).toBeNull();
    const { container } = render(<PasoDeProtocolo {...v} />);
    const recurso = container.querySelector("[data-recurso]")!;
    expect(recurso.textContent).toContain("Fuente o verificación no disponible");
    expect(recurso.textContent).not.toContain("oficial");
  });

  it("conocida se muestra tal cual", () => {
    const { container } = render(<PasoDeProtocolo {...escenariosUX09["FX-LOCAL-PASO-COMPLETO"].ux09!} />);
    expect(container.querySelector("[data-recurso]")!.textContent).toContain("Cátedra · oficial");
  });
});

describe("Retorno seguro (§30)", () => {
  it("todos los escenarios conservan una salida al Overview", () => {
    for (const e of todos) {
      const { unmount } = render(<PasoDeProtocolo {...e.ux09!} />);
      expect(screen.getAllByText("VOLVER AL OVERVIEW").length, e.id).toBeGreaterThan(0);
      unmount();
    }
  });

  it("sin objeto accionable se dice, y no se genera una Action para evitar el vacío", () => {
    const v = escenariosUX09["FX-LOCAL-PASO-RETORNO-SEGURO"].ux09!;
    expect(v.nivel).toBe(11);
    render(<PasoDeProtocolo {...v} />);
    expect(screen.getByText("No hay una acción disponible desde este paso.")).toBeInTheDocument();
  });
});
