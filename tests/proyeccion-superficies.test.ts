import { describe, expect, it } from "vitest";

import { proyectarAccion, type EstadoDeAccion } from "@/lib/server/servicios/proyeccion-accion";
import {
  proyectarCompromiso,
  type EstadoDeCompromiso,
} from "@/lib/server/servicios/proyeccion-compromiso";
import {
  proyectarEvidencia,
  type EstadoDeEvidencia,
} from "@/lib/server/servicios/proyeccion-evidencia";
import {
  proyectarProgreso,
  type EstadoDeProgreso,
} from "@/lib/server/servicios/proyeccion-progreso";
import { provenanceVisible } from "@/lib/content/provenance";

/**
 * Etapa B2.6 — `UX03`, `UX04` y `UX05` desde datos persistidos.
 *
 * Lo que más se prueba acá son los invariantes que se rompen solos cuando uno
 * proyecta mirando el schema en vez del producto.
 */

// ── UX03 · Próxima acción ────────────────────────────────────────────────────

const accion: EstadoDeAccion = {
  instante: "2026-08-31T15:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  accionId: "act-syn-1",
  status: "RECOMMENDED",
  materia: "Análisis Matemático II",
  unidad: "Unidad 3",
  objetivo: "Resolver la guía de integrales",
  verbo: "resolver",
  alcance: "guía 3",
  razon: "Entra en Parcial 1.",
  minutosMin: 60,
  minutosMax: 75,
  evidenciaEsperada: "7 ejercicios",
  criterioCierre: "están completos",
  bloqueoRazon: null,
  reemplazada: false,
  recurso: { titulo: "Guía 3", fuente: "instructor", verificacion: null },
  compromisoVivo: false,
};

describe("B2.6 · UX03 no oficializa lo que nadie verificó", () => {
  it("un recurso de la cátedra sin verificación NO se muestra como oficial", () => {
    // `resource` no tiene `verification_status`. Decir "Cátedra · oficial"
    // sería elevar la verificación desde la UI, que es `I9`.
    const p = proyectarAccion(accion);
    expect(p.provenanceRecurso).toBe("Fuente o estado de verificación no disponible");
    expect(p.provenanceRecurso).not.toContain("oficial");
  });

  it("sin recurso no hay procedencia y el estado lo dice", () => {
    const p = proyectarAccion({ ...accion, recurso: null });
    expect(p.provenanceRecurso).toBeNull();
    expect(p.estado).toBe("SIN_RECURSO");
  });

  it("una Action bloqueada explica y no ofrece comprometerse", () => {
    const p = proyectarAccion({ ...accion, status: "BLOCKED", bloqueoRazon: "Falta confirmar tu comisión." });
    expect(p.estado).toBe("BLOQUEADA");
    expect(p.aviso).toBe("Falta confirmar tu comisión.");
    // `null` ⇒ no se renderiza. Una CTA deshabilitada de adorno sería peor.
    expect(p.ctaPrimaria).toBeNull();
  });

  it("con compromiso vivo no se ofrece comprometerse de nuevo", () => {
    const p = proyectarAccion({ ...accion, compromisoVivo: true });
    expect(p.ctaPrimaria?.texto).toBe("Ver compromiso");
  });

  it("sin estimación, la línea de tiempo desaparece", () => {
    expect(proyectarAccion({ ...accion, minutosMin: null, minutosMax: null }).duracion).toBeNull();
  });

  it("no inventa el estado de incertidumbre desde una evidencia faltante", () => {
    // Sin `expected_evidence` puede ser una Action de incertidumbre o un
    // contrato de contenido incompleto (`C01-008`). No son lo mismo.
    const p = proyectarAccion({ ...accion, evidenciaEsperada: null });
    expect(p.estado).not.toBe("INCERTIDUMBRE");
    expect(p.evidenciaEsperada).toBeNull();
  });
});

describe("B2.6 · la tabla de provenance de `product.md` §7", () => {
  it("traduce cada combinación sin exponer el enum", () => {
    expect(provenanceVisible("instructor", "official")).toBe("Cátedra · oficial");
    expect(provenanceVisible("institution", "official")).toBe("Institución · oficial");
    expect(provenanceVisible("student", "unverified")).toBe("Reportado por vos · sin verificar");
    expect(provenanceVisible("inference", "unverified")).toBe("Estimado por Achieve · sin verificar");
    expect(provenanceVisible("community", "corroborated")).toBe("Comunidad · corroborado");
    expect(provenanceVisible("student", "disputed")).toBe("Dato en revisión · hay versiones distintas");
    expect(provenanceVisible(null, null)).toBe("Fuente o estado de verificación no disponible");
  });

  it("un reporte del estudiante marcado oficial no se presenta como voz de la cátedra", () => {
    expect(provenanceVisible("student", "official")).toBe("Reportado por vos · corroborado");
  });
});

// ── UX04 · Compromiso ────────────────────────────────────────────────────────

const compromiso: EstadoDeCompromiso = {
  instante: "2026-08-31T15:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  compromisoId: "cm-syn-1",
  state: "CONFIRMED",
  materia: "Análisis Matemático II",
  objetivo: "Resolver la guía de integrales",
  inicioEn: "2026-08-31T02:00:00.000Z", // 23:00 del 30 en Córdoba
  zonaDelAcuerdo: "America/Argentina/Cordoba",
  minutosPlanificados: 60,
  evidenciaEsperada: "7 ejercicios",
  criterioCierre: null,
  esRenegociacion: false,
  esRescate: false,
  original: null,
  yaEmpezo: false,
};

describe("B2.6 · UX04 respeta el acuerdo, incluida su hora", () => {
  it("muestra la hora en la zona congelada del acuerdo, no en otra", () => {
    const p = proyectarCompromiso(compromiso);
    expect(p.hora).toBe("23:00");
    expect(p.fecha).toMatch(/30 ago/);
  });

  it("un acuerdo hecho en otra zona conserva su hora original", () => {
    // El estudiante viajó; el compromiso no se recalcula.
    const p = proyectarCompromiso({ ...compromiso, zonaDelAcuerdo: "Europe/Madrid" });
    expect(p.hora).toBe("04:00");
    expect(p.notaEstimacion).toContain("Madrid");
  });

  it("un MISSED no ofrece ninguna CTA que lo haga parecer cumplido", () => {
    const p = proyectarCompromiso({ ...compromiso, state: "MISSED" });
    expect(p.ctaPrimaria).toBeNull();
    expect(p.estadoResultante?.texto).toBe("Incumplido");
  });

  it("un rescate muestra el incumplido original, intacto y como lectura", () => {
    const p = proyectarCompromiso({
      ...compromiso,
      state: "DRAFT",
      esRescate: true,
      original: {
        state: "MISSED",
        inicioEn: "2026-08-28T02:00:00.000Z",
        zonaDelAcuerdo: "America/Argentina/Cordoba",
        minutosPlanificados: 45,
      },
    });
    expect(p.estado).toBe("RESCATE");
    expect(p.original?.[0]).toEqual({ label: "Compromiso incumplido", valor: "MISSED" });
    // Los valores del original no se recalculan ni se redondean.
    expect(p.original?.[2].valor).toBe("45 min");
  });

  it("una renegociación muestra el original como original, no como incumplido", () => {
    const p = proyectarCompromiso({
      ...compromiso,
      esRenegociacion: true,
      original: { state: "RENEGOTIATED", inicioEn: compromiso.inicioEn, zonaDelAcuerdo: "America/Argentina/Cordoba", minutosPlanificados: 60 },
    });
    expect(p.estado).toBe("RENEGOCIACION");
    expect(p.original?.[0].label).toBe("Compromiso original");
  });
});

// ── UX05 · Evidencia ─────────────────────────────────────────────────────────

const evidencia: EstadoDeEvidencia = {
  instante: "2026-08-31T15:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  evidenciaId: "ev-syn-1",
  lifecycle: "EXPECTED",
  materia: "Análisis Matemático II",
  unidad: "Unidad 3",
  objetivo: "Resolver la guía de integrales",
  evidenciaEsperada: "7 ejercicios",
  criterioCierre: "están completos",
  reflexionRequerida: false,
  reflexionPresente: false,
  adjuntoPrevio: null,
  esResubmission: false,
  razonResubmission: null,
  revisionReal: false,
  tardia: false,
};

describe("B2.6 · UX05 no cierra `C01-051` ni confunde el lifecycle", () => {
  it("sin requisito declarado no se ofrece una Reflection obligatoria", () => {
    // El default no se elige acá: `C01-051` sigue abierto.
    expect(proyectarEvidencia(evidencia).reflection).toBeNull();
  });

  it("una Reflection requerida y ausente bloquea el envío, y sólo eso", () => {
    const p = proyectarEvidencia({ ...evidencia, reflexionRequerida: true });
    expect(p.ctaPrimaria?.habilitada).toBe(false);
    // No emite ningún juicio sobre la evidencia ni sobre el dominio.
    expect(p.estadoVisible).toBe("Todavía no entregaste esta evidencia");
    expect(p.estado).toBe("EXPECTED");
  });

  it("con la Reflection presente, el envío se habilita", () => {
    const p = proyectarEvidencia({ ...evidencia, reflexionRequerida: true, reflexionPresente: true });
    expect(p.ctaPrimaria?.habilitada).toBe(true);
  });

  it("el enum del lifecycle nunca sale como copy visible", () => {
    for (const estado of ["SUBMITTED", "UNDER_REVIEW", "SUFFICIENT", "VALIDATED"]) {
      const p = proyectarEvidencia({ ...evidencia, lifecycle: estado });
      expect(p.estadoVisible).not.toContain(estado);
      expect(p.estadoVisible).toBeTruthy();
    }
  });

  it("`SUBMITTED` no se presenta como suficiencia ni como revisión en curso", () => {
    const p = proyectarEvidencia({ ...evidencia, lifecycle: "SUBMITTED" });
    expect(p.estadoVisible).toBe("Entregada · todavía no revisada");
    expect(p.ctaPrimaria).toBeNull();
  });

  it("una entrega tardía se encuadra como tardía sin perder su lifecycle", () => {
    const p = proyectarEvidencia({ ...evidencia, lifecycle: "SUBMITTED", tardia: true });
    expect(p.estado).toBe("TARDIA");
    expect(p.estadoVisible).toBe("Entregada · todavía no revisada");
  });

  it("no inventa los formatos permitidos", () => {
    // Qué acepta una Action es `C01-008`, gate `H`.
    expect(proyectarEvidencia(evidencia).formatosPermitidos).toBeNull();
  });
});

// ── UX06 · Progreso / Bitácora ───────────────────────────────────────────────

const progreso: EstadoDeProgreso = {
  instante: "2026-08-31T22:00:00.000Z",
  zona: "America/Argentina/Cordoba",
  materia: "Análisis Matemático II",
  unidad: "Unidad 3",
  evidencia: {
    id: "evd-syn-1",
    lifecycle: "VALIDATED",
    objetivo: "Ejercicios 8–14",
    enviadaEn: "2026-08-31T21:26:00.000Z",
  },
  resultado: null,
  dimensiones: {
    recorrido: "value",
    practica: "value",
    dominio: "not_evaluated",
    confianza: "no_information",
    confianzaEn: null,
    recenciaEn: "2026-08-31T21:26:00.000Z",
  },
  siguiente: { objetivo: "Reforzar cambio de variables", razon: "Entra en Parcial 1." },
  bitacora: [],
};

const conCambio = (cambiadas: string[], valores?: Record<string, unknown>): EstadoDeProgreso => ({
  ...progreso,
  resultado: {
    occurridoEn: "2026-08-31T21:30:00.000Z",
    tipo: "progress_updated",
    dimensionesCambiadas: cambiadas,
    valoresAnteriores: null,
    valoresActuales: valores ?? null,
    noCambioExplicito: false,
    razonDeNoCambio: null,
    esDeEstaEvidencia: true,
  },
});

describe("B2.6 · UX06 no convierte una evidencia validada en aprendizaje", () => {
  /**
   * El invariante que la pantalla existe para no romper. El dato está ahí —la
   * evidencia dice `VALIDATED`— y derivar progreso de él es lo que el schema
   * invita a hacer.
   */
  it("`VALIDATED` sin `progress_entry` NO produce un cambio confirmado", () => {
    const p = proyectarProgreso(progreso);
    expect(p.estado).toBe("SIN_DATOS");
    expect(p.cambioConfirmado).toHaveLength(0);
    expect(p.aviso).toBe("Todavía no hay un cambio de progreso confirmado.");
  });

  it("«todavía no confirmado» y «no hay con qué» son avisos distintos", () => {
    const sinEvidencia = proyectarProgreso({ ...progreso, evidencia: null });
    expect(sinEvidencia.estado).toBe("SIN_DATOS");
    expect(sinEvidencia.aviso).toBe("Sin información suficiente para mostrar un avance.");
    expect(sinEvidencia.aviso).not.toBe(proyectarProgreso(progreso).aviso);
  });

  it("el chip, el detalle y el aviso no repiten la misma frase", () => {
    const p = proyectarProgreso({ ...progreso, evidencia: null });
    const lineas = [p.estadoEvidencia.texto, p.detalleEvidencia, p.aviso];
    expect(new Set(lineas).size).toBe(3);
  });

  it("un no-cambio declarado por el owner no es una espera", () => {
    const p = proyectarProgreso({
      ...progreso,
      resultado: {
        occurridoEn: "2026-08-31T21:30:00.000Z",
        tipo: "progress_updated",
        dimensionesCambiadas: [],
        valoresAnteriores: null,
        valoresActuales: null,
        noCambioExplicito: true,
        razonDeNoCambio: "La entrega no cubre la unidad completa.",
        esDeEstaEvidencia: true,
      },
    });
    expect(p.estado).toBe("SIN_CAMBIO_EXPLICITO");
    // La razón se muestra sólo si existe; acá existe y es la del owner.
    expect(p.aviso).toBe("La entrega no cubre la unidad completa.");
  });
});

describe("B2.6 · UX06 sólo lista lo que `changed_dimensions` declara", () => {
  it("la dimensión cambiada va arriba y las conservadas en el bloque separado", () => {
    const p = proyectarProgreso(conCambio(["practice"]));
    expect(p.estado).toBe("CAMBIO_CONFIRMADO");
    expect(p.cambioConfirmado.map((f) => f.label)).toEqual(["Práctica"]);
    // `PROG-P1-04`: la autoritativa conservada se identifica aparte.
    expect(p.sinCambioConfirmado.map((f) => f.label)).toContain("Recorrido");
    expect(p.sinCambioConfirmado.map((f) => f.label)).not.toContain("Práctica");
  });

  it("no muestra una magnitud que nadie declaró en una unidad (`C01-019`)", () => {
    // `current_values` con un número crudo: 19 no dice nada y "19 ejercicios"
    // inventaría la unidad.
    const p = proyectarProgreso(conCambio(["practice"], { practice: 19 }));
    expect(p.cambioConfirmado[0].valor).toBe("cambió");
    expect(p.cambioConfirmado[0].valor).not.toContain("19");
  });

  it("si el owner escribió la magnitud como texto, se muestra tal cual", () => {
    const e = conCambio(["practice"], { practice: "19 ejercicios" });
    e.resultado!.valoresAnteriores = { practice: "12 ejercicios" };
    expect(proyectarProgreso(e).cambioConfirmado[0].valor).toBe("12 ejercicios → 19 ejercicios");
  });

  it("la Recencia sí muestra su magnitud: es una fecha, no un número sin unidad", () => {
    const p = proyectarProgreso(conCambio(["recency"]));
    expect(p.cambioConfirmado[0]).toEqual({ label: "Recencia", valor: "hoy" });
  });

  it("los tres estados de no-cambio se distinguen entre sí", () => {
    const filas = proyectarProgreso(conCambio(["practice"])).sinCambioConfirmado;
    const valor = (label: string) => filas.find((f) => f.label === label)?.valor;
    expect(valor("Recorrido")).toBe("conserva su estado");
    expect(valor("Dominio")).toBe("no evaluado");
    expect(valor("Confianza")).toBe("sin información");
    expect(new Set([valor("Recorrido"), valor("Dominio"), valor("Confianza")]).size).toBe(3);
  });

  it("sin resultado autoritativo, una dimensión medida no «conserva» nada", () => {
    // Nadie comparó: que exista un número no autoriza a afirmar continuidad.
    const filas = proyectarProgreso(progreso).sinCambioConfirmado;
    expect(filas.map((f) => f.label)).not.toContain("Recorrido");
    expect(filas.map((f) => f.label)).toContain("Dominio");
  });
});

describe("B2.6 · UX06 no inventa causalidad ni procedencia", () => {
  it("un resultado que no habla de esta evidencia no recibe fuente", () => {
    const e = conCambio(["practice"]);
    e.resultado!.esDeEstaEvidencia = false;
    const p = proyectarProgreso(e);
    expect(p.cambioConfirmado).toHaveLength(1);
    expect(p.fuenteCambio).toBeNull();
  });

  it("sin evidencia validada detrás, el cambio se muestra sin atribuirle fuente", () => {
    const e = conCambio(["practice"]);
    e.evidencia = { ...e.evidencia!, lifecycle: "SUBMITTED" };
    expect(proyectarProgreso(e).fuenteCambio).toBeNull();
  });

  it("con la evidencia validada y el resultado ligado a ella, sí la nombra", () => {
    expect(proyectarProgreso(conCambio(["practice"])).fuenteCambio).toBe("Evidencia validada");
  });

  it("la Bitácora agrupa por ciclo y no eleva la verificación", () => {
    const p = proyectarProgreso({
      ...progreso,
      bitacora: [
        {
          accionId: "act-1",
          objetivo: "Ejercicios 8–14",
          desde: "2026-08-28T22:00:00.000Z",
          entradas: [
            { evento: "CommitmentConfirmed", en: "2026-08-28T22:00:00.000Z", porElEstudiante: true },
            { evento: "EvidenceValidated", en: "2026-08-28T23:26:00.000Z", porElEstudiante: false },
          ],
        },
      ],
    });
    // Un solo ciclo con los dos hechos juntos, no dos avances independientes.
    expect(p.bitacora).toHaveLength(1);
    expect(p.bitacora![0].entradas).toHaveLength(2);
    expect(p.bitacora![0].entradas[0].provenance).toBe("Reportado por vos · sin verificar");
    // `evidence` no guarda `source_type` ni `verification_status`: decir
    // "Cátedra · oficial" sería elevar la verificación desde la UI (`I9`).
    const validada = p.bitacora![0].entradas[1];
    expect(validada.titulo).not.toContain("cátedra");
    expect(validada.provenance).toBeNull();
  });

  it("un hecho sin copy aprobada se omite en vez de mostrar su enum", () => {
    const p = proyectarProgreso({
      ...progreso,
      bitacora: [
        {
          accionId: "act-1",
          objetivo: "Ejercicios 8–14",
          desde: "2026-08-28T22:00:00.000Z",
          entradas: [
            { evento: "CommitmentDue", en: "2026-08-28T22:00:00.000Z", porElEstudiante: false },
          ],
        },
      ],
    });
    // El único hecho del ciclo no era mostrable: no queda un ciclo vacío.
    expect(p.bitacora).toBeNull();
  });
});

describe("B2.6 · UX06 no prioriza ni genera una Action", () => {
  it("«qué sigue» es la Action que el ADE ya emitió", () => {
    expect(proyectarProgreso(progreso).queSigue).toBe("Reforzar cambio de variables");
    expect(proyectarProgreso(progreso).ctaPrimaria?.texto).toBe("Ver siguiente acción");
  });

  it("sin una Action viva no hay CTA de adorno", () => {
    const p = proyectarProgreso({ ...progreso, siguiente: null });
    expect(p.queSigue).toBeNull();
    expect(p.ctaPrimaria).toBeNull();
  });
});
