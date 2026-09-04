import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MateriaCursado } from "@/components/screens/materia-cursado";
import { ProximaAccion } from "@/components/screens/proxima-accion";
import { Compromiso } from "@/components/screens/compromiso";
import { Evidencia } from "@/components/screens/evidencia";
import { ProgresoBitacora } from "@/components/screens/progreso-bitacora";
import { escenarios, escenarioIds } from "@/lib/fixtures";
import { commitmentTransitions, evidenceOwnerTransitions } from "@/lib/domain/state-machines";
import type { CommitmentState, EvidenceState } from "@/lib/domain/types";

const todos = escenarioIds.map((id) => escenarios[id]);
const con = <K extends "materia" | "accion" | "compromiso" | "evidencia" | "progreso">(k: K) =>
  todos.filter((e) => e[k] !== undefined);

describe("UX04 — los ocho estados del lifecycle de Commitment son alcanzables", () => {
  it("los ocho están cubiertos por el catálogo", () => {
    const cubiertos = new Set(con("compromiso").map((e) => e.compromiso!.estado));
    for (const estado of Object.keys(commitmentTransitions) as CommitmentState[]) {
      expect(cubiertos, estado).toContain(estado);
    }
  });

  it("MISSED no ofrece editar el original para parecer cumplido", () => {
    const v = escenarios["FX-LOCAL-COM-MISSED"].compromiso!;
    render(<Compromiso {...v} />);
    expect(screen.getByText("Este compromiso no se edita. El rescate es un acuerdo nuevo.")).toBeInTheDocument();
    expect(v.ctaPrimaria!.texto).toBe("Retomar");
  });

  /**
   * ADR-050 cambió **cómo** se dice, no qué se dice: el aviso en lenguaje
   * interno pasó al bloque de «Cambiar horario», con la copy del estudiante.
   * Lo que se sigue exigiendo es lo mismo — que no haya edición retroactiva—,
   * y ahora además que la pantalla **explique** en vez de apagar un botón.
   */
  it("STARTED no ofrece cambiar el horario, y dice por qué", () => {
    const v = escenarios["FX-LOCAL-COM-STARTED"].compromiso!;
    expect(v.ctaPrimaria!.texto).not.toBe("Renegociar");
    expect(v.cambioDeHorario).toEqual({ sePuede: false, motivo: "Este compromiso ya empezó." });
    render(<Compromiso {...v} />);
    expect(screen.getByText("Este compromiso ya no se puede cambiar.")).toBeInTheDocument();
    expect(screen.getByText("Este compromiso ya empezó.")).toBeInTheDocument();
    expect(screen.queryByText("Cambiar horario")).not.toBeInTheDocument();
  });

  it("los estados terminales no ofrecen ninguna operación", () => {
    for (const id of ["FX-LOCAL-COM-RENEGOTIATED", "FX-LOCAL-COM-CLOSED"] as const) {
      expect(escenarios[id].compromiso!.ctaPrimaria, id).toBeNull();
    }
  });

  it("renegociación y rescate muestran el original, y no editable", () => {
    for (const id of ["FX-LOCAL-COM-RENEGOCIACION", "FX-LOCAL-COM-RESCATE"] as const) {
      const { container, unmount } = render(<Compromiso {...escenarios[id].compromiso!} />);
      expect(container.querySelector("[data-original]"), id).not.toBeNull();
      expect(screen.getByText("El original se conserva sin cambios.")).toBeInTheDocument();
      unmount();
    }
  });

  it("una renegociación no elegible no ofrece confirmación", () => {
    expect(escenarios["FX-LOCAL-COM-RENEGOCIACION-NO-ELEGIBLE"].compromiso!.ctaPrimaria).toBeNull();
  });

  it("COMPLETED no implica que exista Evidence", () => {
    render(<Compromiso {...escenarios["FX-LOCAL-COM-COMPLETED"].compromiso!} />);
    expect(screen.getByText("Cerrar el compromiso no presenta la evidencia acordada.")).toBeInTheDocument();
  });

  it("sin fecha válida la confirmación se ofrece deshabilitada, no oculta", () => {
    // El estudiante puede completarla acá mismo: es habilitación, no aparición.
    const v = escenarios["FX-LOCAL-COM-FECHA-INVALIDA"].compromiso!;
    expect(v.ctaPrimaria).not.toBeNull();
    expect(v.ctaPrimaria!.habilitada).toBe(false);
  });
});

describe("UX05 — los siete estados de Evidence son alcanzables", () => {
  it("los siete están cubiertos por el catálogo", () => {
    const cubiertos = new Set(con("evidencia").map((e) => e.evidencia!.estado));
    for (const estado of Object.keys(evidenceOwnerTransitions) as EvidenceState[]) {
      expect(cubiertos, estado).toContain(estado);
    }
  });

  it("ninguno de los estados posteriores al envío promete progreso", () => {
    const prohibido = ["dominio demostrado", "aprobado", "listo para rendir"];
    for (const e of con("evidencia")) {
      const { container, unmount } = render(<Evidencia {...e.evidencia!} />);
      const texto = (container.textContent ?? "").toLowerCase();
      for (const frase of prohibido) expect(texto, `${e.id}`).not.toContain(frase);
      unmount();
    }
  });

  it("SUBMITTED no implica suficiencia ni revisión", () => {
    render(<Evidencia {...escenarios["FX-LOCAL-EVD-SUBMITTED"].evidencia!} />);
    expect(screen.getByText(/no confirma suficiencia ni que alguien la haya revisado/)).toBeInTheDocument();
  });

  it("UNDER_REVIEW no promete persona ni hora", () => {
    const { container } = render(<Evidencia {...escenarios["FX-LOCAL-EVD-UNDER-REVIEW"].evidencia!} />);
    const texto = container.textContent ?? "";
    expect(texto).toContain("En revisión.");
    expect(texto).not.toMatch(/revisará hoy|te contactaremos|en breve/i);
  });

  it("VALIDATED no afirma dominio", () => {
    render(<Evidencia {...escenarios["FX-LOCAL-EVD-VALIDATED"].evidencia!} />);
    expect(screen.getByText("Validar cierra el método. No demuestra dominio por sí solo.")).toBeInTheDocument();
  });

  it("una Evidence tardía no borra el incumplimiento", () => {
    render(<Evidencia {...escenarios["FX-LOCAL-EVD-TARDIA"].evidencia!} />);
    expect(screen.getByText("El compromiso sigue incumplido. Entregar ahora no lo cambia.")).toBeInTheDocument();
  });

  it("un upload fallido no es un envío", () => {
    const v = escenarios["FX-LOCAL-EVD-UPLOAD-FALLIDO"].evidencia!;
    render(<Evidencia {...v} />);
    expect(screen.getByText("El archivo no se subió. Tu entrega anterior conserva su estado.")).toBeInTheDocument();
    expect(v.ctaPrimaria!.texto).toBe("Reintentar");
  });

  it("una Reflection requerida bloquea el envío, sin ocultarlo", () => {
    const v = escenarios["FX-LOCAL-EVD-REFLECTION-REQUERIDA"].evidencia!;
    expect(v.reflection!.requerida).toBe(true);
    expect(v.ctaPrimaria!.habilitada).toBe(false);
  });

  it("con una entrega previa no se vuelve a pedir el adjunto", () => {
    const { container } = render(<Evidencia {...escenarios["FX-LOCAL-EVD-SUBMITTED"].evidencia!} />);
    expect(container.querySelector("[data-adjunto-previo]")).not.toBeNull();
    expect(screen.queryByText("Adjuntar evidencia")).toBeNull();
  });
});

describe("UX06 — los cuatro resultados de progreso son distinguibles", () => {
  it("los cuatro están cubiertos", () => {
    const cubiertos = new Set(con("progreso").map((e) => e.progreso!.estado));
    expect(cubiertos).toEqual(
      new Set(["CAMBIO_CONFIRMADO", "SIN_CAMBIO_EXPLICITO", "SIN_DATOS", "NO_DISPONIBLE"]),
    );
  });

  it("una falla de lectura NO se presenta como un no-cambio", () => {
    const falla = escenarios["FX-LOCAL-PROG-NO-DISPONIBLE"].progreso!;
    const noCambio = escenarios["FX-LOCAL-PROG-SIN-CAMBIO-EXPLICITO"].progreso!;
    expect(falla.aviso).not.toBe(noCambio.aviso);
    const { container } = render(<ProgresoBitacora {...falla} />);
    // La frase aparece dos veces a propósito: en el detalle y en el aviso.
    expect(screen.getAllByText(/Tu evidencia conserva su estado/).length).toBeGreaterThan(0);
    expect(container.textContent).toContain("No pudimos cargar el progreso");
    expect(screen.queryByText(/Todavía no hay un cambio de progreso confirmado/)).toBeNull();
  });

  it("'sin información' no se muestra como cero", () => {
    for (const e of con("progreso")) {
      const { container, unmount } = render(<ProgresoBitacora {...e.progreso!} />);
      expect(container.textContent ?? "", e.id).not.toMatch(/\b0\s?%|\b0 de\b/);
      unmount();
    }
  });

  it("los tres estados de no-cambio se distinguen entre sí", () => {
    const filas = escenarios["FX-LOCAL-PROG-SIN-CAMBIO-EXPLICITO"].progreso!.sinCambioConfirmado;
    const valores = filas.map((f) => f.valor);
    expect(new Set(valores).size).toBe(valores.length);
    expect(valores).toContain("conserva su estado");
    expect(valores).toContain("no evaluado");
  });

  it("la Bitácora agrupa por ciclo, sin duplicar el ciclo como cuatro avances", () => {
    const v = escenarios["FX-LOCAL-PROG-BITACORA"].progreso!;
    const { container } = render(<ProgresoBitacora {...v} />);
    const ciclos = container.querySelectorAll("[data-ciclo]");
    expect(ciclos).toHaveLength(2);
    // Los cuatro eventos del 28 viven bajo un solo ciclo.
    expect(v.bitacora![0].entradas).toHaveLength(4);
    expect(container.querySelector('[data-ciclo="Ciclo del 28 de agosto"]')).not.toBeNull();
  });

  it("una entrada sin provenance no se presenta como oficial", () => {
    const { container } = render(<ProgresoBitacora {...escenarios["FX-LOCAL-PROG-BITACORA"].progreso!} />);
    const sinFuente = container.querySelector('[data-ciclo="Ciclo del 25 de agosto"]')!;
    expect(sinFuente.textContent).toContain("Fuente o estado no disponible");
    expect(sinFuente.textContent).not.toContain("oficial");
  });

  it("sólo hay cambio confirmado donde hay un ProgressUpdated real", () => {
    for (const e of con("progreso")) {
      if (e.progreso!.cambioConfirmado.length > 0) {
        expect(e.progreso!.estado, e.id).toBe("CAMBIO_CONFIRMADO");
      }
    }
  });
});

describe("UX02 y UX03 — estados críticos", () => {
  it("confianza y dominio se muestran separadas, sin generar una Action", () => {
    const v = escenarios["FX-LOCAL-MAT-CONFIANZA-VS-DOMINIO"].materia!;
    expect(v.dimensiones).toHaveLength(5);
    render(<MateriaCursado {...v} />);
    expect(screen.getByText("Confianza")).toBeInTheDocument();
    expect(screen.getByText("no evaluado")).toBeInTheDocument();
  });

  it("la captura de clase no eleva la verificación del reporte", () => {
    const { container } = render(<MateriaCursado {...escenarios["FX-LOCAL-MAT-PROVENANCE"].materia!} />);
    expect(container.textContent).toContain("reportado por vos · sin corroborar");
    expect(screen.getByText("Pasó algo en clase")).toBeInTheDocument();
  });

  it("con contexto incompleto no se ofrece captura ni se inventa recomendación", () => {
    const v = escenarios["FX-LOCAL-MAT-CONTEXTO-INCOMPLETO"].materia!;
    expect(v.capturaDeClase).toBeNull();
    render(<MateriaCursado {...v} />);
    expect(screen.getByText("No pudimos confirmar tu comisión en esta materia.")).toBeInTheDocument();
  });

  it("una Action bloqueada o reemplazada no ofrece CTA primaria", () => {
    for (const id of ["FX-LOCAL-ACC-BLOQUEADA", "FX-LOCAL-ACC-REEMPLAZADA"] as const) {
      const v = escenarios[id].accion!;
      expect(v.ctaPrimaria, id).toBeNull();
      const { container, unmount } = render(<ProximaAccion {...v} />);
      expect(container.querySelectorAll("[data-cta-primaria]"), id).toHaveLength(0);
      unmount();
    }
  });

  it("una acción de incertidumbre no inventa un entregable", () => {
    const v = escenarios["FX-LOCAL-ACC-INCERTIDUMBRE"].accion!;
    expect(v.evidenciaEsperada).toBeNull();
    expect(v.criterioCierre).toBeNull();
    render(<ProximaAccion {...v} />);
    expect(screen.queryByText("Evidencia")).toBeNull();
    expect(screen.queryByText(/Cerrás cuando/)).toBeNull();
  });

  it("sin recurso configurado la línea desaparece entera", () => {
    const v = escenarios["FX-LOCAL-ACC-SIN-RECURSO"].accion!;
    render(<ProximaAccion {...v} />);
    expect(screen.queryByText("Usá")).toBeNull();
  });

  it("enviar una corrección no vuelve oficial un reporte del estudiante", () => {
    const { container } = render(<ProximaAccion {...escenarios["FX-LOCAL-ACC-CORRECCION"].accion!} />);
    expect(container.textContent).toContain("Reportado por vos · sin verificar");
    expect(container.textContent).toContain("hasta que la cátedra la confirme");
  });
});

describe("Auditoría transversal sobre todos los escenarios de UX01–UX06", () => {
  const vistas = [
    ["materia", MateriaCursado],
    ["accion", ProximaAccion],
    ["compromiso", Compromiso],
    ["evidencia", Evidencia],
    ["progreso", ProgresoBitacora],
  ] as const;

  it("ninguna pantalla muestra copy prohibido de product.md §13", () => {
    const prohibido = [
      "Listo para rendir", "Estamos calculando", "Te contactaremos",
      "Dominaste la unidad", "5 de 12", "Plan generado",
    ];
    for (const [clave, Componente] of vistas) {
      for (const e of con(clave)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { container, unmount } = render(<Componente {...(e[clave] as any)} />);
        const texto = container.textContent ?? "";
        for (const frase of prohibido) expect(texto, `${e.id} usa "${frase}"`).not.toContain(frase);
        unmount();
      }
    }
  });

  it("los enums técnicos no son copy visible, salvo los que la spec muestra", () => {
    // VI.4 muestra CONFIRMED como estado operativo; el resto no aparece.
    const prohibido = ["official", "unverified", "corroborated", "disputed", "EVIDENCE_PENDING", "RENEGOTIATED"];
    for (const [clave, Componente] of vistas) {
      for (const e of con(clave)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { container, unmount } = render(<Componente {...(e[clave] as any)} />);
        const texto = container.textContent ?? "";
        for (const enumTecnico of prohibido) {
          expect(texto, `${e.id} muestra "${enumTecnico}"`).not.toContain(enumTecnico);
        }
        unmount();
      }
    }
  });

  it("como máximo una CTA primaria por pantalla y por estado (I-06)", () => {
    for (const [clave, Componente] of vistas) {
      for (const e of con(clave)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { container, unmount } = render(<Componente {...(e[clave] as any)} />);
        expect(container.querySelectorAll("[data-cta-primaria]").length, e.id).toBeLessThanOrEqual(1);
        unmount();
      }
    }
  });
});
