import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivacionModoExamen } from "@/components/screens/activacion-modo-examen";
import { escenarios, escenariosConUX07 } from "@/lib/fixtures";
import { escenariosUX07 } from "@/lib/fixtures/ux07";
import type { EstadoActivacion } from "@/lib/domain/view-models";
import { ctaRegistry } from "@/lib/navigation/cta-registry";

const ids = Object.keys(escenariosUX07) as (keyof typeof escenariosUX07)[];
const todos = ids.map((id) => escenariosUX07[id]);
const vistas = todos.map((e) => e.ux07!);

/**
 * La matriz de `VI.7` §16 es obligatoria: 22 filas numeradas. El catálogo trae
 * esas 22 más `VERIFICANDO`, que §15 lista como estado funcional y §16 no
 * numera.
 */
describe("Cobertura de la matriz de estados críticos (VI.7 §16)", () => {
  it("hay 23 escenarios de UX07: los 22 de la matriz más el resultado incierto", () => {
    expect(ids).toHaveLength(23);
  });

  it("el catálogo general los incluye a todos", () => {
    for (const id of ids) expect(escenariosConUX07).toContain(id);
  });

  it("los 16 estados funcionales de §15 son alcanzables", () => {
    const esperados: EstadoActivacion[] = [
      "RECOMENDACION", "REVISION_MANUAL", "SELECCION", "SIN_ASSESSMENT",
      "FALTAN_DATOS", "FECHA_DESCONOCIDA", "MODALIDAD_DESCONOCIDA", "FUERA_DE_P0",
      "YA_ACTIVA", "CAMBIO_DE_FECHA", "CANCELADA", "PASADA",
      "CONTRADICTORIOS", "NO_DISPONIBLE", "VERIFICANDO", "HANDOFF_NO_DISPONIBLE",
    ];
    const cubiertos = new Set(vistas.map((v) => v.estado));
    for (const estado of esperados) expect(cubiertos, estado).toContain(estado);
    expect(cubiertos.size).toBe(esperados.length);
  });

  it("cada escenario renderiza sin romper", () => {
    for (const id of ids) {
      const { unmount } = render(<ActivacionModoExamen {...escenariosUX07[id].ux07!} />);
      unmount();
    }
  });
});

describe("Una sola CTA primaria por estado (I-06)", () => {
  it("ningún escenario declara más de una", () => {
    for (const e of todos) {
      // `ctaPrimaria` es un objeto o null: el tipo ya impide dos. Esto verifica
      // que el retorno seguro nunca se cuele como segunda primaria.
      expect(e.ux07!.ctaRetorno, e.id).not.toBe(e.ux07!.ctaPrimaria?.texto);
    }
  });

  it("se renderiza exactamente un botón primario, o ninguno", () => {
    for (const e of todos) {
      const { container, unmount } = render(<ActivacionModoExamen {...e.ux07!} />);
      const primarios = container.querySelectorAll("[data-cta-primaria]");
      expect(primarios.length, `${e.id}`).toBe(e.ux07!.ctaPrimaria ? 1 : 0);
      unmount();
    }
  });
});

describe("§21.3 — cuando ya está ACTIVE, el estado reemplaza el CTA de activación", () => {
  it("no queda un botón Activar deshabilitado que sugiera una segunda operación", () => {
    for (const e of todos.filter((x) => x.ux07!.estado === "YA_ACTIVA")) {
      render(<ActivacionModoExamen {...e.ux07!} />);
      expect(screen.queryByText(/ACTIVAR/), e.id).toBeNull();
      expect(screen.getByRole("button", { name: "ABRIR PREPARACIÓN" })).toBeInTheDocument();
      screen.getByText("MODO EXAMEN ACTIVO");
      document.body.innerHTML = "";
    }
  });

  it("un intento duplicado abre la existente y no ofrece crear otra", () => {
    render(<ActivacionModoExamen {...escenariosUX07["FX-LOCAL-EXAM-DUPLICADO"].ux07!} />);
    expect(screen.getByRole("button", { name: "ABRIR PREPARACIÓN" })).toBeInTheDocument();
    expect(screen.queryByText(/ACTIVAR/)).toBeNull();
  });
});

describe("Omitir, no inventar", () => {
  it("sin Assessment registrada no hay formulario de alta ni CTA primaria", () => {
    // SCP-09/SCP-10 siguen abiertos: la necesidad no es implementable.
    const v = escenariosUX07["FX-LOCAL-EXAM-SIN-ASSESSMENT"].ux07!;
    expect(v.ctaPrimaria).toBeNull();
    render(<ActivacionModoExamen {...v} />);
    expect(
      screen.getByText("No encontramos una evaluación registrada para esta materia."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("fecha desconocida: sin countdown, sin estimación y sin CTA de reporte", () => {
    const v = escenariosUX07["FX-LOCAL-EXAM-FECHA-DESCONOCIDA"].ux07!;
    render(<ActivacionModoExamen {...v} />);
    expect(screen.getByText("La fecha todavía es desconocida.")).toBeInTheDocument();
    expect(screen.queryByText(/Faltan \d+ días/)).toBeNull();
    expect(screen.queryByText(/aproximadamente/i)).toBeNull();
    expect(v.ctaPrimaria).toBeNull();
  });

  it("modalidad desconocida: sin selector y sin elegir un default", () => {
    const v = escenariosUX07["FX-LOCAL-EXAM-MODALIDAD-DESCONOCIDA"].ux07!;
    render(<ActivacionModoExamen {...v} />);
    expect(screen.getByText("Todavía no sabemos la modalidad.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(v.ctaPrimaria).toBeNull();
  });

  it("un dato sin provenance conocida no se presenta como oficial", () => {
    // La misma pantalla mezcla fuentes: la modalidad SÍ es oficial. Lo que se
    // verifica es que la fecha, que no tiene verificación conocida, no herede
    // la de al lado.
    const v = escenariosUX07["FX-LOCAL-EXAM-FECHA-DESCONOCIDA"].ux07!;
    expect(v.datos.find((d) => d.label === "Fecha")!.provenance).toBeNull();

    const { container } = render(<ActivacionModoExamen {...v} />);
    const fecha = container.querySelector('[data-dato="Fecha"]')!;
    expect(fecha.textContent).not.toContain("oficial");
    expect(container.querySelector('[data-dato="Modalidad"]')!.textContent).toContain("Cátedra · oficial");
  });
});

describe("Provenance: ninguna capa la eleva (§18)", () => {
  it("un dato reportado por el estudiante lo sigue diciendo, y su CTA lo refleja", () => {
    const v = escenariosUX07["FX-LOCAL-EXAM-REPORTADA"].ux07!;
    const { container } = render(<ActivacionModoExamen {...v} />);

    // La fecha la reportó el estudiante y sigue siendo suya: enviar el dato no
    // lo vuelve oficial (invariante I9).
    const fecha = container.querySelector('[data-dato="Fecha"]')!;
    expect(fecha.textContent).toContain("Reportado por vos · sin verificar");
    expect(fecha.textContent).not.toContain("oficial");

    // §22.2: activar un dato reportado elegible usa su propio verbo.
    expect(v.ctaPrimaria!.texto).toBe("ACTIVAR CON ESTOS DATOS");
  });

  it("una fecha estimada conserva su label y no habilita activación", () => {
    const v = escenariosUX07["FX-LOCAL-EXAM-FECHA-ESTIMADA"].ux07!;
    render(<ActivacionModoExamen {...v} />);
    expect(screen.getByText("Estimado por Achieve · sin verificar")).toBeInTheDocument();
    expect(v.ctaPrimaria).toBeNull();
  });

  it("con datos disputados la UI no elige fuente ni ofrece corregir", () => {
    const v = escenariosUX07["FX-LOCAL-EXAM-CONTRADICTORIOS"].ux07!;
    render(<ActivacionModoExamen {...v} />);
    expect(screen.getByText("Dato en revisión · hay versiones distintas")).toBeInTheDocument();
    expect(screen.getByText("Hay versiones distintas de este dato.")).toBeInTheDocument();
    expect(v.ctaPrimaria).toBeNull();
  });

  it("los enums técnicos nunca aparecen como copy visible", () => {
    const prohibidos = ["official", "unverified", "corroborated", "disputed", "inference", "student"];
    for (const e of todos) {
      const { container, unmount } = render(<ActivacionModoExamen {...e.ux07!} />);
      const texto = container.textContent ?? "";
      for (const enumTecnico of prohibidos) {
        expect(texto.toLowerCase(), `${e.id} muestra "${enumTecnico}"`).not.toContain(enumTecnico);
      }
      unmount();
    }
  });
});

describe("Copy prohibido (§22.4 y product.md §13)", () => {
  const prohibido = [
    "Empezar a estudiar",
    "Prepararme",
    "Listo para rendir",
    "Plan generado",
    "Tu operador lo aprobará",
    "Estamos calculando",
    "Te contactaremos",
  ];

  it("ningún escenario lo usa", () => {
    for (const e of todos) {
      const { container, unmount } = render(<ActivacionModoExamen {...e.ux07!} />);
      const texto = container.textContent ?? "";
      for (const frase of prohibido) {
        expect(texto, `${e.id} usa "${frase}"`).not.toContain(frase);
      }
      unmount();
    }
  });

  it("no se muestra un porcentaje ni una readiness numérica (DD5)", () => {
    for (const e of todos) {
      const { container, unmount } = render(<ActivacionModoExamen {...e.ux07!} />);
      expect(container.textContent ?? "", e.id).not.toMatch(/\d+\s?%/);
      unmount();
    }
  });
});

describe("§16.14 — varias evaluaciones: lista sin ranking local", () => {
  it("conserva el orden recibido y lo dice", () => {
    const v = escenariosUX07["FX-LOCAL-EXAM-VARIAS"].ux07!;
    render(<ActivacionModoExamen {...v} />);
    expect(
      screen.getByText("La lista conserva el orden recibido. No prioriza académicamente."),
    ).toBeInTheDocument();
    expect(v.opciones).toHaveLength(2);
    expect(v.opciones!.filter((o) => o.seleccionada)).toHaveLength(1);
  });

  it("materia y comisión no son selectores", () => {
    render(<ActivacionModoExamen {...escenariosUX07["FX-LOCAL-EXAM-VARIAS"].ux07!} />);
    expect(
      screen.getByText("Materia y comisión no son selectores: pertenecen a esta materia."),
    ).toBeInTheDocument();
  });
});

describe("§16.16 — fecha modificada", () => {
  it("muestra el valor vigente y el anterior, sin fusionarlos", () => {
    const v = escenariosUX07["FX-LOCAL-EXAM-FECHA-MODIFICADA"].ux07!;
    const fecha = v.datos.find((d) => d.label === "Fecha")!;
    expect(fecha.valor).toBe("14 sep 2026");
    expect(fecha.anterior).toBe("07 sep 2026");
    render(<ActivacionModoExamen {...v} />);
    expect(screen.getByText(/14 sep 2026/)).toBeInTheDocument();
    expect(screen.getByText(/antes: 07 sep 2026/)).toBeInTheDocument();
  });
});

describe("§25 — un error técnico no es un empty state académico", () => {
  it("la lectura fallida ofrece reintentar; la ausencia de Assessment no", () => {
    const error = escenariosUX07["FX-LOCAL-EXAM-NO-DISPONIBLE"].ux07!;
    const vacio = escenariosUX07["FX-LOCAL-EXAM-SIN-ASSESSMENT"].ux07!;
    expect(error.ctaPrimaria!.texto).toBe("REINTENTAR");
    expect(vacio.ctaPrimaria).toBeNull();
    expect(error.titulo).not.toBe(vacio.titulo);
  });

  it("un resultado incierto no ofrece reintento ciego", () => {
    const v = escenariosUX07["FX-LOCAL-EXAM-VERIFICANDO"].ux07!;
    expect(v.ctaPrimaria).toBeNull();
    render(<ActivacionModoExamen {...v} />);
    expect(screen.getByText("Estamos verificando si quedó activa.")).toBeInTheDocument();
  });

  it("si el handoff falla, la activación no se revierte", () => {
    const v = escenariosUX07["FX-LOCAL-EXAM-HANDOFF-NO-DISPONIBLE"].ux07!;
    expect(v.titulo).toBe("MODO EXAMEN ACTIVO");
    render(<ActivacionModoExamen {...v} />);
    expect(screen.getByText(/La preparación quedó activa/)).toBeInTheDocument();
  });
});

describe("CTA-011 quedó cableada al existir UX07", () => {
  it("es alcanzable desde el catálogo", () => {
    const cta = ctaRegistry["CTA-011"];
    const alcanza = Object.values(escenarios).some((e) => {
      const ctx = e.contextos.UX07;
      return ctx !== undefined && cta.aparece(ctx);
    });
    expect(alcanza).toBe(true);
  });

  it("el baseline es RECOMMENDED → CTA del estudiante → ACTIVE: no hay auto-activación", () => {
    // Si existiera una variante auto-activa, habría un escenario que llega a
    // ACTIVE sin confirmación explícita del estudiante.
    const cta = ctaRegistry["CTA-011"];
    for (const e of Object.values(escenarios)) {
      const ctx = e.contextos.UX07;
      if (ctx === undefined) continue;
      if (cta.habilitada(ctx)) expect(ctx.confirmacionExplicita, e.id).toBe(true);
    }
  });
});
