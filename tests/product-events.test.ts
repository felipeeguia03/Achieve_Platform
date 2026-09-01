import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  catalogoP0,
  EXTENSIONES,
  eventosDeBitacora,
  eventosDeclarados,
} from "@/lib/domain/product-events";
import { tituloDeHecho } from "@/lib/content/bitacora";
import {
  actionTransitions,
  commitmentTransitions,
  evidenceOwnerTransitions,
} from "@/lib/domain/state-machines";
import { nombreDeEventoDeAction } from "@/lib/server/servicios/accion";
import { NOMBRES_DE_EVENTO } from "@/lib/server/servicios/progreso";
import { nombreDeEventoDeCommitment } from "@/lib/server/servicios/compromiso";
import { nombreDeEventoDeEvidence } from "@/lib/server/servicios/evidencia";

/**
 * Etapa B3.2 — el Product Event Model, declarado y verificado.
 *
 * El spec advierte contra *"un evento nuevo para cada interacción"*, y eso es
 * exactamente lo que había pasado sin que nadie lo notara: la maquinaria de
 * transiciones emite un evento **por cada estado al que se llega**, así que la
 * base tenía hechos que el catálogo P0 no lista.
 *
 * Los guards corren en las dos direcciones. Un catálogo que se desincroniza del
 * código en silencio es peor que no tener catálogo: da la impresión de que
 * alguien lo está mirando.
 */

const spec = readFileSync(resolve(process.cwd(), "docs/product-spec-source.md"), "utf8");

/**
 * Todo nombre que el backend **puede** emitir, derivado de las máquinas de
 * estado y no de una lista escrita a mano.
 *
 * Es la parte que hace que este test siga valiendo dentro de un año: si alguien
 * agrega un estado a `Evidence`, aparece acá solo y el guard exige declararlo.
 */
function emitibles(): string[] {
  // Los **destinos** de cada transición, no todos los estados: el evento se
  // emite al llegar. `DRAFT` es donde un Commitment nace y nadie transiciona
  // hacia él, así que `CommitmentDraft` no existe como hecho.
  const destinos = <S extends string>(t: Readonly<Record<S, readonly S[]>>): S[] => [
    ...new Set(Object.values(t).flat() as S[]),
  ];
  const deTransiciones = [
    ...destinos(actionTransitions).map(nombreDeEventoDeAction),
    ...destinos(commitmentTransitions).map(nombreDeEventoDeCommitment),
    ...destinos(evidenceOwnerTransitions).map(nombreDeEventoDeEvidence),
  ];
  // Los que se publican con nombre literal, fuera de la maquinaria compartida.
  // **Se leen del código**, no de una lista acá: una lista a mano no se entera
  // del próximo `publicar({ nombre: "Algo" })` y el guard pasaría en verde
  // mientras la base se llena de hechos sin declarar.
  const dir = resolve(process.cwd(), "lib/server/servicios");
  const fuente = readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => readFileSync(resolve(dir, f), "utf8"))
    .join("\n");
  const literales = [...fuente.matchAll(/nombre:\s*"([A-Z][A-Za-z]+)"/g)].map((m) => m[1]);
  // Los que un Service devuelve en vez de publicar con literal los declara él
  // mismo, tipados: un regex sobre un ternario es exactamente la clase de guard
  // que pasa en verde por el motivo equivocado.
  return [...new Set([...deTransiciones, ...literales, ...NOMBRES_DE_EVENTO])];
}

describe("B3.2 · el catálogo P0 es el del spec", () => {
  it("son los 23 de §16", () => {
    // Veintitrés, contados sobre la tabla. La primera versión de este test decía
    // 25 porque el número se estimó en vez de contarse, y el propio guard lo
    // cazó: es exactamente para lo que sirve.
    expect(Object.keys(catalogoP0)).toHaveLength(23);
  });

  it("cada uno existe en el spec con su uso textual", () => {
    // Si alguien reescribe un "uso" acá y no en el spec, esto rompe. Es la misma
    // regla con la que el registro de CTAs se ata a su tabla.
    for (const [nombre, evento] of Object.entries(catalogoP0)) {
      expect(spec, `${nombre} no está en el spec`).toContain(nombre);
      expect(spec, `el uso de ${nombre} no coincide con el spec`).toContain(evento.uso);
    }
  });
});

describe("B3.2 · el catálogo y el código no se desincronizan", () => {
  it("todo evento que el backend puede emitir está declarado", () => {
    const declarados = new Set(eventosDeclarados());
    for (const nombre of emitibles()) {
      expect(
        declarados,
        `${nombre} se emite y no está declarado: agregalo al catálogo o a EXTENSIONES`,
      ).toContain(nombre);
    }
  });

  it("todo evento declarado como emitido tiene quién lo emita", () => {
    const puedeEmitirse = new Set(emitibles());
    for (const [nombre, evento] of Object.entries(catalogoP0)) {
      if (evento.instrumentacion.estado !== "EMITIDO") continue;
      expect(puedeEmitirse, `${nombre} dice que se emite y nadie lo emite`).toContain(nombre);
    }
    // Las extensiones existen **porque** el código las emite: si una deja de
    // emitirse, sobra en la lista.
    for (const nombre of Object.keys(EXTENSIONES)) {
      expect(puedeEmitirse, `${nombre} está declarado como extensión y ya nadie lo emite`).toContain(
        nombre,
      );
    }
  });

  it("una extensión no puede pisar un nombre del P0", () => {
    for (const nombre of Object.keys(EXTENSIONES)) {
      expect(Object.keys(catalogoP0), `${nombre} está en los dos lados`).not.toContain(nombre);
    }
  });

  it("todo pendiente nombra la fase que lo va a instrumentar", () => {
    for (const [nombre, evento] of Object.entries(catalogoP0)) {
      if (evento.instrumentacion.estado !== "PENDIENTE") continue;
      expect(evento.instrumentacion.fase.length, `${nombre} no dice de qué fase es`).toBeGreaterThan(
        3,
      );
    }
  });
});

describe("B3.2 · la Bitácora se define desde el catálogo", () => {
  it("todo evento visible tiene copy aprobada", () => {
    for (const nombre of eventosDeBitacora()) {
      expect(tituloDeHecho(nombre), `${nombre} es visible y no tiene copy`).not.toBeNull();
    }
  });

  it("ninguna copy existe para un evento que no es visible", () => {
    // La dirección que se olvida: una copy de más significa que alguien la
    // agregó sin declarar que el hecho se muestra, y entonces se muestra sin
    // que el catálogo lo diga.
    const visibles = new Set(eventosDeBitacora());
    for (const nombre of eventosDeclarados()) {
      if (visibles.has(nombre)) continue;
      expect(tituloDeHecho(nombre), `${nombre} tiene copy y no está declarado visible`).toBeNull();
    }
  });

  it("la Bitácora no muestra hechos operativos ni de plataforma", () => {
    // Es memoria privada del estudiante, no un log del sistema (`VI.6` §6).
    for (const nombre of ["RiskSignalCreated", "InterventionStarted", "AcademicMapMinimumReached"]) {
      expect(catalogoP0[nombre].enBitacora, nombre).toBe(false);
    }
    expect(EXTENSIONES.AcademicDataIngested.enBitacora).toBe(false);
    expect(EXTENSIONES.CommitmentDue.enBitacora, "lo dispara el reloj, no la persona").toBe(false);
  });
});
