import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AltaCursada, type CursadaDelPasoProps } from "@/components/alta/cursada";
import { t } from "@/lib/content/es-AR";
import { RUTA_DEL_PASO, siguientePaso } from "@/lib/domain/alta";
import {
  clasesQueSeSuperponen,
  motivoDeRespuestaInvalida,
  origenDeLosBloques,
  resumenDeCursada,
  type OpcionesDeUnaCursada,
  type RespuestaDeCursada,
} from "@/lib/domain/cursada";
import { declararCursada, type RepositorioDeCursada } from "@/lib/server/servicios/cursada";

/**
 * El cuarto paso del alta — [ADR-105](../docs/decisions.md#adr-105), que
 * construye [ADR-062](../docs/decisions.md#adr-062) y [ADR-063](../docs/decisions.md#adr-063).
 *
 * La precedencia contra Postgres la verifica `scripts/db-superficies.sh`. Acá:
 * el dominio, el Service con dobles, la pantalla y **las ausencias**.
 */

const LEER = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const sinComentariosSql = (sql: string) => sql.replace(/^\s*--.*$/gm, "");
const codigo = (ts: string) => ts.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const LUN_18 = { dia: 1, desde: "18:00", hasta: "20:00" };

const CON_COMISIONES: OpcionesDeUnaCursada = {
  cursadaId: "ce-1",
  materia: "Análisis SYN",
  comisiones: [
    { ofertaId: "of-a", nombre: "A", bloques: [LUN_18] },
    { ofertaId: "of-b", nombre: "B", bloques: [] },
  ],
  bloquesDeLaMateria: [],
};
const SIN_COMISIONES: OpcionesDeUnaCursada = {
  cursadaId: "ce-2",
  materia: "Física SYN",
  comisiones: [],
  bloquesDeLaMateria: [{ dia: 3, desde: "10:00", hasta: "12:00" }],
};

describe("ADR-105 §5 · la precedencia de bloques, espejo de la base", () => {
  it("«no sé mi horario» gana sobre todo: ningún bloque", () => {
    expect(origenDeLosBloques({ horario: "UNKNOWN", comision: "CONFIRMED", hayDeclarados: true })).toBe("NINGUNO");
  });
  it("lo que declaró el estudiante gana sobre su comisión", () => {
    expect(origenDeLosBloques({ horario: "KNOWN", comision: "CONFIRMED", hayDeclarados: true })).toBe("DECLARADOS");
  });
  it("comisión confirmada sin declarados: los de la comisión", () => {
    expect(origenDeLosBloques({ horario: "KNOWN", comision: "CONFIRMED", hayDeclarados: false })).toBe("COMISION");
  });
  it("comisión desconocida o no listada: NUNCA los de la materia", () => {
    for (const comision of ["UNKNOWN", "NOT_LISTED"] as const) {
      expect(origenDeLosBloques({ horario: "KNOWN", comision, hayDeclarados: false })).toBe("NINGUNO");
    }
  });
  it("sin estado o sin comisiones: los de la cursada, como antes del paso", () => {
    expect(origenDeLosBloques({ horario: null, comision: null, hayDeclarados: false })).toBe("MATERIA");
    expect(origenDeLosBloques({ horario: "KNOWN", comision: "NOT_APPLICABLE", hayDeclarados: false })).toBe("MATERIA");
  });
  it("la base implementa la misma tabla, en una sola función", () => {
    const sql = sinComentariosSql(LEER("supabase/migrations/20261102000000_cursada_en_el_alta.sql"));
    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.bloques_de_cursada(");
    expect(sql).toContain("COALESCE(cu.schedule_status, '') <> 'UNKNOWN'");
    expect(sql).toContain("cu.commission_status = 'CONFIRMED' AND b.offering_id = cu.commission_offering_id");
    expect(sql).toContain("COALESCE(cu.commission_status, 'NOT_APPLICABLE') = 'NOT_APPLICABLE'");
  });
});

describe("ADR-063 · las cuatro combinaciones comisión × horario son representables", () => {
  const casos: [string, RespuestaDeCursada, OpcionesDeUnaCursada][] = [
    ["comisión conocida, horario conocido", { cursadaId: "ce-1", comision: { estado: "CONFIRMED", ofertaId: "of-a" }, horario: { estado: "KNOWN" } }, CON_COMISIONES],
    ["comisión desconocida, horario conocido", { cursadaId: "ce-1", comision: { estado: "UNKNOWN" }, horario: { estado: "KNOWN", bloques: [LUN_18] } }, CON_COMISIONES],
    ["comisión conocida, horario desconocido", { cursadaId: "ce-1", comision: { estado: "CONFIRMED", ofertaId: "of-b" }, horario: { estado: "UNKNOWN" } }, CON_COMISIONES],
    ["ninguno de los dos", { cursadaId: "ce-1", comision: { estado: "UNKNOWN" }, horario: { estado: "UNKNOWN" } }, CON_COMISIONES],
  ];
  it.each(casos)("%s: válida", (_, r, o) => {
    expect(motivoDeRespuestaInvalida(r, o)).toBeNull();
  });

  it("una comisión que no es de esa materia se rechaza", () => {
    expect(
      motivoDeRespuestaInvalida({ cursadaId: "ce-1", comision: { estado: "CONFIRMED", ofertaId: "otra" }, horario: { estado: "UNKNOWN" } }, CON_COMISIONES),
    ).not.toBeNull();
  });
  it("«mi comisión no aparece» exige el nombre", () => {
    expect(
      motivoDeRespuestaInvalida({ cursadaId: "ce-1", comision: { estado: "NOT_LISTED", nombre: "  " }, horario: { estado: "UNKNOWN" } }, CON_COMISIONES),
    ).not.toBeNull();
  });
  it("«conozco mi horario» sin un solo bloque no es un horario", () => {
    expect(
      motivoDeRespuestaInvalida({ cursadaId: "ce-1", comision: { estado: "CONFIRMED", ofertaId: "of-b" }, horario: { estado: "KNOWN" } }, CON_COMISIONES),
    ).not.toBeNull();
    expect(
      motivoDeRespuestaInvalida({ cursadaId: "ce-1", comision: { estado: "UNKNOWN" }, horario: { estado: "KNOWN" } }, CON_COMISIONES),
    ).not.toBeNull();
  });
  it("una clase que termina antes de empezar se rechaza", () => {
    expect(
      motivoDeRespuestaInvalida(
        { cursadaId: "ce-1", comision: { estado: "UNKNOWN" }, horario: { estado: "KNOWN", bloques: [{ dia: 1, desde: "20:00", hasta: "18:00" }] } },
        CON_COMISIONES,
      ),
    ).not.toBeNull();
  });
});

describe("superposición y resumen", () => {
  it("dos clases de materias distintas que se pisan se señalan; tocarse no es pisarse", () => {
    expect(
      clasesQueSeSuperponen([
        { ...LUN_18, materia: "A" },
        { dia: 1, desde: "19:00", hasta: "21:00", materia: "B" },
        { dia: 1, desde: "20:00", hasta: "22:00", materia: "C" },
      ]),
    ).toEqual([["A", "B"], ["B", "C"]]);
  });

  it("el resumen cuenta horario sabido y no sabido, sin inventar", () => {
    const r = resumenDeCursada(
      [
        { cursadaId: "ce-1", comision: { estado: "UNKNOWN" }, horario: { estado: "KNOWN", bloques: [LUN_18] } },
        { cursadaId: "ce-2", comision: { estado: "NOT_APPLICABLE" }, horario: { estado: "UNKNOWN" } },
      ],
      [CON_COMISIONES, SIN_COMISIONES],
    );
    expect(r).toEqual({ materias: 2, conHorario: 1, sinHorario: 1, comisionDesconocida: 1 });
  });
});

describe("el Service del paso", () => {
  function repo(): RepositorioDeCursada & { escritas: RespuestaDeCursada[][] } {
    const escritas: RespuestaDeCursada[][] = [];
    return {
      escritas,
      async opciones() {
        return [
          { ...CON_COMISIONES, periodo: "2026-2", comision: { estado: null, ofertaId: null, nombre: null }, horario: { estado: null }, bloquesDeclarados: [] },
          { ...SIN_COMISIONES, periodo: "2026-2", comision: { estado: null, ofertaId: null, nombre: null }, horario: { estado: null }, bloquesDeclarados: [] },
        ];
      },
      async declarar(_i, _s, r) {
        escritas.push([...r]);
        return { cursadas: r.length, faltan: 0 };
      },
    };
  }
  const todoUnknown: RespuestaDeCursada[] = [
    { cursadaId: "ce-1", comision: { estado: "UNKNOWN" }, horario: { estado: "UNKNOWN" } },
    { cursadaId: "ce-2", comision: { estado: "UNKNOWN" }, horario: { estado: "UNKNOWN" } },
  ];

  it("todo en «no sé» es una respuesta completa y se guarda", async () => {
    const r = repo();
    expect(await declararCursada(r, "i", "s", todoUnknown, () => null)).toEqual({ estado: "OK", cursadas: 2 });
    expect(r.escritas).toHaveLength(1);
  });

  it("con una materia sin contestar no escribe nada", async () => {
    const r = repo();
    const res = await declararCursada(r, "i", "s", [todoUnknown[0]], () => null);
    expect(res).toEqual({ estado: "FALTAN_MATERIAS", cursadas: ["ce-2"] });
    expect(r.escritas).toHaveLength(0);
  });

  it("una respuesta inválida no escribe nada", async () => {
    const r = repo();
    const res = await declararCursada(
      r,
      "i",
      "s",
      [{ ...todoUnknown[0], comision: { estado: "CONFIRMED", ofertaId: "inventada" } }, todoUnknown[1]],
      () => null,
    );
    expect(res.estado).toBe("DATOS_INVALIDOS");
    expect(r.escritas).toHaveLength(0);
  });
});

describe("la pantalla /alta/cursada", () => {
  const cursada = (o: OpcionesDeUnaCursada): CursadaDelPasoProps => ({
    ...o,
    comision: { estado: null, ofertaId: null, nombre: null },
    horario: { estado: null },
    bloquesDeclarados: [],
  });

  it("ninguna comisión llega elegida, ni siquiera la primera", () => {
    render(<AltaCursada cursadas={[cursada(CON_COMISIONES)]} onGuardar={vi.fn()} />);
    for (const r of screen.getAllByRole("radio")) expect(r.getAttribute("aria-checked")).toBe("false");
  });

  it("sin comisiones en el catálogo no se inventa una: sólo las otras tres", () => {
    const { container } = render(<AltaCursada cursadas={[cursada(SIN_COMISIONES)]} onGuardar={vi.fn()} />);
    expect(container.querySelectorAll('[data-opcion^="oferta:"]')).toHaveLength(0);
    expect(screen.getByRole("radio", { name: t("ALTA.CURSADA.NO_SE_COMISION") })).toBeTruthy();
  });

  it("«No sé mis comisiones todavía» y «Todavía no sé mi horario» dejan guardar", async () => {
    const onGuardar = vi.fn(async () => ({ ok: true }));
    render(<AltaCursada cursadas={[cursada(CON_COMISIONES), cursada(SIN_COMISIONES)]} onGuardar={onGuardar} />);
    fireEvent.click(screen.getByRole("button", { name: t("ALTA.CURSADA.NO_SE_COMISIONES") }));
    for (const r of screen.getAllByRole("radio", { name: t("ALTA.CURSADA.NO_SE_HORARIO") })) fireEvent.click(r);
    fireEvent.click(screen.getByRole("button", { name: t("ALTA.CURSADA.CTA") }));
    await waitFor(() => expect(onGuardar).toHaveBeenCalledTimes(1));
    expect(onGuardar).toHaveBeenCalledWith([
      { cursadaId: "ce-1", comision: { estado: "UNKNOWN" }, horario: { estado: "UNKNOWN" } },
      { cursadaId: "ce-2", comision: { estado: "UNKNOWN" }, horario: { estado: "UNKNOWN" } },
    ]);
  });

  it("sin contestar todo, avisa y no guarda", () => {
    const onGuardar = vi.fn();
    render(<AltaCursada cursadas={[cursada(CON_COMISIONES)]} onGuardar={onGuardar} />);
    fireEvent.click(screen.getByRole("button", { name: t("ALTA.CURSADA.CTA") }));
    expect(onGuardar).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe(t("ALTA.CURSADA.FALTA_CONTESTAR"));
  });
});

describe("las ausencias que protege ADR-105", () => {
  const MIGRACION = sinComentariosSql(LEER("supabase/migrations/20261102000000_cursada_en_el_alta.sql"));

  it("el paso va después de materias y es el último", () => {
    expect(RUTA_DEL_PASO.CURSADA).toBe("/alta/cursada");
    expect(
      siguientePaso({ consentimientoRespondido: true, carreraDeclarada: true, materiasConfirmadas: true, cursadaRespondida: false }),
    ).toBe("CURSADA");
    expect(
      siguientePaso({ consentimientoRespondido: true, carreraDeclarada: true, materiasConfirmadas: true, cursadaRespondida: true }),
    ).toBeNull();
  });

  it("contestar el paso no crea ninguna class_session: el horario semanal no es una clase dictada", () => {
    expect(MIGRACION).not.toMatch(/INSERT INTO class_session\b/);
  });

  it("la cursada NO se muda de offering al elegir comisión (ADR-105 §4)", () => {
    expect(MIGRACION).not.toMatch(/SET\s+offering_id\s*=/);
    expect(MIGRACION).toMatch(/commission_offering_id\s*=\s*v_oferta/);
  });

  it("un horario declarado entra student / unverified", () => {
    expect(MIGRACION).toMatch(/'student', 'alta: horario declarado', 'unverified'/);
  });

  it("la disponibilidad no se toca: el paso no escribe availability", () => {
    expect(MIGRACION).not.toMatch(/(INSERT INTO|UPDATE|DELETE FROM)\s+availability\b/);
  });

  it("los lectores de horario de la app leen la precedencia, no la tabla", () => {
    for (const archivo of ["lib/server/repositorios/horarios.ts", "lib/server/repositorios/clase.ts"]) {
      expect(codigo(LEER(archivo)), archivo).not.toMatch(/from\(\s*"class_schedule_block"\s*\)/);
    }
  });

  it("ninguna comisión se elige sola en la pantalla ni en el Service", () => {
    for (const archivo of ["components/alta/cursada.tsx", "lib/server/servicios/cursada.ts", "lib/domain/cursada.ts"]) {
      expect(codigo(LEER(archivo)), archivo).not.toMatch(/comisiones\[0\]/);
    }
  });
});

