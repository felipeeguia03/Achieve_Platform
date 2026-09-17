import { describe, expect, it } from "vitest";
import {
  actionTransitions,
  assertTransition,
  canTransition,
  commitmentTransitions,
  evidenceOwnerTransitions,
  ForbiddenTransitionError,
  isTerminal,
} from "@/lib/domain/state-machines";
import type { ActionStatus, CommitmentState, EvidenceState } from "@/lib/domain/types";

describe("Commitment — No Cortar (AGENTS.md §2.4, invariante I1)", () => {
  it("MISSED → COMPLETED falla", () => {
    expect(canTransition(commitmentTransitions, "MISSED", "COMPLETED")).toBe(false);
    expect(() => assertTransition("Commitment", commitmentTransitions, "MISSED", "COMPLETED"))
      .toThrow(ForbiddenTransitionError);
  });

  it("MISSED no vuelve a ningún estado de cumplimiento", () => {
    const prohibidos: CommitmentState[] = ["COMPLETED", "CONFIRMED", "RENEGOTIATED", "DUE", "STARTED", "DRAFT"];
    for (const destino of prohibidos) {
      expect(canTransition(commitmentTransitions, "MISSED", destino)).toBe(false);
    }
  });

  it("la única salida de MISSED es CLOSED", () => {
    expect(commitmentTransitions.MISSED).toEqual(["CLOSED"]);
  });

  it("STARTED NO admite RENEGOTIATED: renegociar es válido solo antes del vencimiento", () => {
    expect(canTransition(commitmentTransitions, "STARTED", "RENEGOTIATED")).toBe(false);
    expect(canTransition(commitmentTransitions, "CONFIRMED", "RENEGOTIATED")).toBe(true);
    expect(canTransition(commitmentTransitions, "DUE", "RENEGOTIATED")).toBe(true);
  });

  it("RENEGOTIATED es terminal: el Commitment nuevo es otra fila (invariante I2)", () => {
    expect(isTerminal(commitmentTransitions, "RENEGOTIATED")).toBe(true);
  });

  it("las transiciones declaradas sí pasan", () => {
    expect(canTransition(commitmentTransitions, "DRAFT", "CONFIRMED")).toBe(true);
    expect(canTransition(commitmentTransitions, "STARTED", "COMPLETED")).toBe(true);
    expect(canTransition(commitmentTransitions, "MISSED", "CLOSED")).toBe(true);
  });
});

describe("Action", () => {
  it("no se salta la aceptación: RECOMMENDED → COMMITTED falla", () => {
    expect(canTransition(actionTransitions, "RECOMMENDED", "COMMITTED")).toBe(false);
  });

  it("aceptar una Action no la compromete: RECOMMENDED → ACCEPTED, y ahí se detiene", () => {
    expect(canTransition(actionTransitions, "RECOMMENDED", "ACCEPTED")).toBe(true);
    expect(canTransition(actionTransitions, "ACCEPTED", "COMMITTED")).toBe(true);
  });

  it("COMPLETED, CANCELLED y REPLACED son terminales", () => {
    for (const estado of ["COMPLETED", "CANCELLED", "REPLACED"] as ActionStatus[]) {
      expect(isTerminal(actionTransitions, estado)).toBe(true);
    }
  });

  it("no se resucita una Action terminal", () => {
    expect(canTransition(actionTransitions, "COMPLETED", "IN_PROGRESS")).toBe(false);
    expect(canTransition(actionTransitions, "CANCELLED", "RECOMMENDED")).toBe(false);
  });
});

describe("Evidence — la cadena de no-implicación (AGENTS.md §2.1)", () => {
  it("SUBMITTED no salta a VALIDATED: enviar no es suficiencia ni validación", () => {
    expect(canTransition(evidenceOwnerTransitions, "SUBMITTED", "VALIDATED")).toBe(false);
  });

  it("UNDER_REVIEW no salta a VALIDATED sin pasar por suficiencia", () => {
    expect(canTransition(evidenceOwnerTransitions, "UNDER_REVIEW", "VALIDATED")).toBe(false);
    expect(canTransition(evidenceOwnerTransitions, "SUFFICIENT", "VALIDATED")).toBe(true);
  });

  it("EXPECTED solo puede pasar a SUBMITTED", () => {
    expect(evidenceOwnerTransitions.EXPECTED).toEqual(["SUBMITTED"]);
  });

  it("VALIDATED es terminal", () => {
    expect(isTerminal(evidenceOwnerTransitions, "VALIDATED")).toBe(true);
  });

  it("una Evidence insuficiente no se re-envía sola: pasa por RESUBMISSION_REQUESTED", () => {
    expect(canTransition(evidenceOwnerTransitions, "INSUFFICIENT", "SUBMITTED")).toBe(false);
    expect(canTransition(evidenceOwnerTransitions, "INSUFFICIENT", "RESUBMISSION_REQUESTED")).toBe(true);
    expect(canTransition(evidenceOwnerTransitions, "RESUBMISSION_REQUESTED", "SUBMITTED")).toBe(true);
  });
});

describe("Las tablas son deny-by-default y están completas", () => {
  it("ningún estado transiciona a sí mismo", () => {
    const tablas = [
      ["Action", actionTransitions] as const,
      ["Commitment", commitmentTransitions] as const,
      ["Evidence", evidenceOwnerTransitions] as const,
    ];
    for (const [nombre, tabla] of tablas) {
      for (const [from, destinos] of Object.entries(tabla) as [string, readonly string[]][]) {
        expect(destinos, `${nombre}.${from}`).not.toContain(from);
      }
    }
  });

  it("todo destino declarado existe como estado de origen en su propia tabla", () => {
    const tablas = [actionTransitions, commitmentTransitions, evidenceOwnerTransitions];
    for (const tabla of tablas) {
      const estados = Object.keys(tabla);
      for (const destinos of Object.values(tabla) as readonly string[][]) {
        for (const destino of destinos) expect(estados).toContain(destino);
      }
    }
  });

  it("un estado desconocido no habilita nada", () => {
    expect(canTransition(evidenceOwnerTransitions, "INVENTADO" as EvidenceState, "SUBMITTED")).toBe(false);
  });
});
