import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  observarError,
  corregirClasificacion,
  registrarNecesidadDeApoyo,
  registrarDisparadorTemprano,
  type ErrorObservado,
  type ObservacionPersistida,
  type RepositorioDeReiteracion,
} from "@/lib/server/servicios/reiteracion";
import type { EventoDeProducto, PublicadorDeEventos } from "@/lib/server/servicios/eventos";
import type { EntradaDeAuditoria } from "@/lib/server/servicios/auditoria";
import type { RepositorioDeSenales, Senal } from "@/lib/server/servicios/riesgo";
import type { RiskSignalStatus } from "@/lib/domain/types";

/**
 * El recorrido del MVP, de punta a punta — Etapa B6.5,
 * [ADR-036](../docs/decisions.md#adr-036).
 *
 * ⚠️ **PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION.**
 *
 * El estudiante se equivoca, repite el error, recibe una acción correctiva,
 * vuelve a equivocarse — y el sistema **produce una señal que pide una
 * persona**, sin que nadie la haya mirado. Es lo que la Fase B6 dejó imposible
 * a propósito hasta que alguien cerrara el umbral.
 */
const CONFIG = {
  apariciones: { atencion: 2, intervencion: 3 },
  reincidencia_tras_correctiva: "intervencion",
  reinicia_con_resolucion_limpia: true,
  solo_corroboradas: true,
};

/**
 * La configuración de la psicopedagoga — `9.1`, B6.7.2. **Los umbrales son los
 * mismos**; lo que cambia es la unidad de conteo.
 */
const CONFIG_PSICO = { ...CONFIG, exige_objetivo_comparable: true };

/**
 * El catálogo, con las dos filas que **no cuentan** — B6.7.1, `9.5`.
 *
 * `clasificacion_incierta` está vigente y se declara no-familia. `dependencia`
 * es lo contrario: la fila del Product Owner sigue existiendo, y **ninguna
 * versión vigente la declara**, porque `9.5` la sacó de los errores.
 */
const CATALOGO: Record<string, { canonicalId: string; label: string }> = {
  "tipo-procedimiento": { canonicalId: "procedimiento", label: "Error de procedimiento" },
  // La fila **apagada** de la misma familia: así se ve una observación vieja,
  // clasificada con el vocabulario anterior.
  "tipo-procedimiento-v1": { canonicalId: "procedimiento", label: "Error de procedimiento" },
  "tipo-consigna": { canonicalId: "consigna", label: "Error de interpretación de consigna" },
  "tipo-incierta": { canonicalId: "clasificacion_incierta", label: "Clasificación incierta" },
  "tipo-dependencia-v1": { canonicalId: "dependencia", label: "Dependencia de ayuda externa" },
};

const VIGENTES: Record<string, { label: string; esFamilia: boolean }> = {
  procedimiento: { label: "Error de procedimiento o estrategia", esFamilia: true },
  consigna: { label: "Error de interpretación de consigna", esFamilia: true },
  clasificacion_incierta: { label: "Clasificación incierta", esFamilia: false },
  // `dependencia` **no está**, y ésa es la decisión de `9.5`.
};

function mundo(opciones: { sinUmbral?: boolean; exigeObjetivo?: boolean; b673?: boolean } = {}) {
  const observaciones: (ObservacionPersistida & { id: string; canonicalId: string })[] = [];
  const correcciones: { observacionId: string; desde: string; hacia: string; motivo: string }[] =
    [];
  const apoyos: { preparacionId: string }[] = [];
  const senales = new Map<string, Senal>();
  const publicados: EventoDeProducto[] = [];
  const auditado: EntradaDeAuditoria[] = [];
  const claves = new Map<string, string>();
  let reloj = 0;
  let n = 0;

  const repo: RepositorioDeReiteracion = {
    async registrarObservacion(e) {
      reloj++;
      const fila = CATALOGO[e.errorTypeId];
      if (!fila) throw new Error(`el tipo de error ${e.errorTypeId} no existe`);
      observaciones.push({
        id: `obs-${observaciones.length + 1}`,
        canonicalId: fila.canonicalId,
        kind: e.kind,
        corroborated: e.corroborated,
        observedAt: `2026-09-0${reloj}T10:00:00.000Z`,
        trasAccionCorrectiva: (e.afterActionId ?? null) !== null,
        errorTypeId: e.errorTypeId,
        etiqueta: fila.label,
        objetivoId: e.learningObjectiveId ?? null,
        calidad: e.evidenceQuality ?? null,
        errorIdentificable: e.errorIdentifiable ?? null,
        confianza: e.classificationConfidence ?? null,
        correccionEntregada: e.correctionDelivered ?? null,
        correccionAccesible: e.correctionAccessible ?? null,
        estudianteSeInvolucro: e.learnerEngaged ?? null,
        nuevoIntentoIndependiente: e.newIndependentAttempt ?? null,
        confianzaMismoError: e.sameErrorConfidence ?? null,
        identidadIntento: e.attemptIdentity ?? null,
        tareaEquivalenteNoIdentica: e.equivalentNotIdentical ?? null,
        espaciadaOSinModeloInmediato: e.spacedOrNoImmediateModel ?? null,
      });
      return { id: `obs-${observaciones.length}`, duplicado: false };
    },
    async reglaVigente(canonicalId) {
      return {
        id: "regla-1",
        canonicalId,
        version: "v2.0-po-provisional",
        signalType: "error_reiterado",
        thresholdConfig: opciones.sinUmbral
          ? null
          : opciones.b673
            ? {
                ...CONFIG_PSICO,
                early_review_severity: "intervencion",
                early_review_triggers: [
                  { canonical_id: "pedido_explicito_de_ayuda", label: "Pedido explícito de ayuda" },
                ],
              }
          : opciones.exigeObjetivo
            ? CONFIG_PSICO
            : CONFIG,
      };
    },
    async familiaDelTipo(errorTypeId) {
      return CATALOGO[errorTypeId]?.canonicalId ?? null;
    },
    async familiaVigente(canonicalId) {
      const v = VIGENTES[canonicalId];
      return v ? { canonicalId, label: v.label, esFamilia: v.esFamilia } : null;
    },
    async observaciones(_i, _p, canonicalId) {
      // Por **familia**, cruzando versiones del vocabulario.
      return observaciones.filter((o) => o.canonicalId === canonicalId);
    },
    async preparacion() {
      return { studentId: "est-1", courseEnrollmentId: "ce-1" };
    },
    async corregirClasificacion(entrada) {
      const o = observaciones.find((x) => x.id === entrada.observacionId);
      if (!o) throw new Error("la observación no pertenece a la institución");
      const destino = CATALOGO[entrada.aTipoDeErrorId];
      if (!destino) throw new Error("no se puede reclasificar a una versión apagada");
      const desde = o.canonicalId;
      // Append-only: la corrección se registra **antes** de actualizar.
      correcciones.push({
        observacionId: o.id,
        desde,
        hacia: destino.canonicalId,
        motivo: entrada.motivo,
      });
      o.canonicalId = destino.canonicalId;
      o.errorTypeId = entrada.aTipoDeErrorId;
      o.etiqueta = destino.label;
      return {
        correccionId: `corr-${correcciones.length}`,
        desdeCanonicalId: desde,
        aCanonicalId: destino.canonicalId,
        examPreparationId: "prep-1",
        learningObjectiveId: o.objetivoId,
      };
    },
    async registrarNecesidadDeApoyo(entrada) {
      apoyos.push({ preparacionId: entrada.examPreparationId });
      return { id: `apoyo-${apoyos.length}`, duplicado: false };
    },
    async sincronizarEpisodio(entrada) {
      return {
        id: "episodio-1",
        previousId: entrada.recuperada ? "episodio-0" : null,
        status: entrada.recuperada ? "recovered" : "active",
      };
    },
    async contextoParaRevision() {
      return { observaciones: observaciones.map((o) => o.id), historialDeApoyos: apoyos };
    },
    async registrarDisparadorTemprano() {
      return { id: "temprana-1", duplicado: false };
    },
  };

  const repoSenales: RepositorioDeSenales = {
    async porId(_i, id) {
      return senales.get(id) ?? null;
    },
    async cambiarEstadoSi(_i, id, esperado, nuevo) {
      const s = senales.get(id);
      if (!s || s.state !== esperado) return null;
      const next = { ...s, state: nuevo as RiskSignalStatus };
      senales.set(id, next);
      return next;
    },
    async registrar(e) {
      const clave = e.claveDeIdempotencia;
      if (clave && claves.has(clave)) return { id: claves.get(clave)!, duplicado: true };
      n++;
      const id = `s-${n}`;
      senales.set(id, {
        id,
        institutionId: e.institutionId,
        state: "OPEN",
        studentId: e.studentId,
        severity: e.severity,
        reason: e.reason,
        reviewContext: e.reviewContext ?? {},
      });
      if (clave) claves.set(clave, id);
      return { id, duplicado: false };
    },
    async resolver() {
      return { resuelta: false, motivo: null };
    },
  };

  const eventos: PublicadorDeEventos = { async publicar(e) { publicados.push(e); } };
  const auditor = { async registrar(e: EntradaDeAuditoria) { auditado.push(e); } };

  const base: ErrorObservado = {
    institutionId: "inst-A",
    examPreparationId: "prep-1",
    errorTypeId: "tipo-procedimiento",
    kind: "error",
    corroborated: true,
  };

  return {
    deps: { repo, senales: repoSenales, eventos, auditor },
    base,
    senales,
    publicados,
    auditado,
    observaciones,
    correcciones,
    apoyos,
  };
}

describe("MVP · el recorrido completo, sin que nadie mire", () => {
  it("error → error → correctiva → error = una señal que pide una persona", async () => {
    const m = mundo();

    // 1. Se equivoca por primera vez. No pasa nada, y está bien.
    const uno = await observarError(m.deps, m.base);
    expect(uno).toMatchObject({ estado: "OK" });
    expect(uno.estado === "OK" && uno.evaluacion.estado).toBe("SIN_SENAL");

    // 2. Repite el mismo tipo de error. Aparece la primera señal, de atención.
    const dos = await observarError(m.deps, m.base);
    const evalDos = dos.estado === "OK" ? dos.evaluacion : null;
    expect(evalDos).toMatchObject({ estado: "OK", apariciones: 2, necesitaPersona: false });
    expect([...m.senales.values()][0]).toMatchObject({
      severity: "atencion",
      // Todavía nadie tiene que hacer nada: queda abierta.
      state: "OPEN",
    });

    // 3. Recibe una acción correctiva y **vuelve a fallar contra ella**.
    const tres = await observarError(m.deps, { ...m.base, afterActionId: "accion-correctiva" });
    const evalTres = tres.estado === "OK" ? tres.evaluacion : null;
    expect(evalTres).toMatchObject({ estado: "OK", necesitaPersona: true });

    // 4. La señal pide una persona, y nadie la miró: la produjo la regla.
    const ultima = [...m.senales.values()].at(-1)!;
    expect(ultima.severity).toBe("intervencion");
    expect(ultima.state).toBe("INTERVENTION_REQUIRED");
    expect(ultima.reason).toContain("volvió a aparecer después de una acción correctiva");

    // 5. Y quedó registrado como hecho del sistema, no de una persona.
    const creadas = m.publicados.filter((e) => e.nombre === "RiskSignalCreated");
    expect(creadas).toHaveLength(2);
    expect(creadas.every((e) => e.actorId === null)).toBe(true);
    expect(m.publicados.map((e) => e.nombre)).toContain("RiskSignalInterventionRequired");
    expect(m.auditado.map((a) => a.accion)).toContain("risk_signal.transition");
  });

  it("reprocesar la misma evidencia no duplica la señal", async () => {
    // "Las señales no deben duplicarse por reprocesamiento del mismo evento o
    // evidencia." La clave incluye el conteo: mismo conteo, misma señal.
    const m = mundo();
    await observarError(m.deps, m.base);
    await observarError(m.deps, m.base);
    expect(m.senales.size).toBe(1);

    // Volver a evaluar sin observación nueva devuelve la misma.
    const repetido = await observarError(m.deps, { ...m.base, corroborated: false });
    expect(repetido.estado === "OK" && repetido.evaluacion.estado).toBe("OK");
    expect(m.senales.size).toBe(1);
  });

  it("una resolución limpia apaga el camino hacia la intervención", async () => {
    const m = mundo();
    await observarError(m.deps, m.base);
    await observarError(m.deps, m.base);
    await observarError(m.deps, { ...m.base, kind: "resolucion_limpia" });
    const despues = await observarError(m.deps, m.base);
    expect(despues.estado === "OK" && despues.evaluacion).toMatchObject({
      estado: "SIN_SENAL",
      apariciones: 1,
    });
    // La señal de atención anterior **no se borra**: fue un hecho.
    expect(m.senales.size).toBe(1);
  });

  it("sin umbral configurado no se evalúa nada, y se dice", async () => {
    // `HP0-06-2` y `HP0-06-3` siguen así: nadie decidió las suyas.
    const m = mundo({ sinUmbral: true });
    const r = await observarError(m.deps, m.base);
    expect(r.estado === "OK" && r.evaluacion.estado).toBe("SIN_UMBRAL");
    expect(m.senales.size).toBe(0);
  });

  it("si la base rechaza la observación, no se evalúa nada", async () => {
    // Corroborar contra una evidencia que nadie evaluó es el error inferido que
    // `C01-036` prohíbe contar. La base lo rechaza, y acá no hay hecho nuevo.
    const m = mundo();
    m.deps.repo.registrarObservacion = async () => {
      throw new Error("la evidencia está en SUBMITTED y nadie la evaluó");
    };
    const r = await observarError(m.deps, m.base);
    expect(r.estado).toBe("RECHAZADA");
    expect(m.senales.size).toBe(0);
  });
});

describe("MVP · el borde HTTP no le da al estudiante lo que no es suyo", () => {
  const RUTA = readFileSync(
    resolve(process.cwd(), "app/api/observacion/route.ts"),
    "utf8",
  );

  /**
   * Registrar un error **no es una acción del estudiante**: es de quien evalúa
   * su entrega. Un JWT de estudiante acá le permitiría declarar sus propios
   * errores, y el punto 6 de `C01-036` dice que una observación sin corroborar
   * no cuenta — con lo cual sería una función que no hace nada, o una que
   * miente.
   */
  it("usa secreto de servicio, no JWT de estudiante", () => {
    expect(RUTA).toContain("esSecretoDeServicio");
    expect(RUTA).not.toMatch(/sesionDe|estudianteDe|resolverSesion/);
  });

  it("`corroborada` no tiene un default que infle el contador", () => {
    // El camino más corto —mandar el campo vacío— tiene que ser el que NO
    // cuenta. Un default en `true` haría lo contrario.
    expect(RUTA).toContain("corroborated: cuerpo.corroborada === true");
  });

  it("no barre: evalúa la preparación que acaba de recibir un hecho", () => {
    // Un barrido por institución sería el motor general que `C01-021` no
    // autoriza. El endpoint recibe una preparación y un tipo, y nada más.
    // Una sola invocación, con una preparación que llega en el cuerpo. Si
    // alguien agrega una segunda —o un loop sobre preparaciones— esto lo ve.
    expect(RUTA.match(/observarErrorDeEstudiante\(/g) ?? []).toHaveLength(1);
    expect(RUTA).toContain("examPreparationId: cuerpo.preparacionId as string");
  });

  it("un rechazo de dominio es 422, no 500", () => {
    expect(RUTA).toMatch(/estado === "RECHAZADA"[\s\S]{0,200}status: 422/);
  });
});

describe("9.2 · el contador no es el único camino", () => {
  it("un disparador configurado pide una persona y lleva evidencia + apoyos", async () => {
    const m = mundo({ b673: true });
    await observarError(m.deps, m.base);
    await registrarNecesidadDeApoyo(
      { repo: m.deps.repo },
      { institutionId: "inst-A", examPreparationId: "prep-1", supportNeedTypeId: "apoyo" },
    );
    const r = await registrarDisparadorTemprano(m.deps, {
      institutionId: "inst-A",
      examPreparationId: "prep-1",
      triggerCanonicalId: "pedido_explicito_de_ayuda",
    });
    expect(r).toMatchObject({ estado: "OK", duplicado: false });
    const senal = [...m.senales.values()].at(-1)!;
    expect(senal).toMatchObject({ state: "INTERVENTION_REQUIRED", reason: "Pedido explícito de ayuda" });
    expect(senal.reviewContext).toMatchObject({
      observaciones: ["obs-1"],
      historialDeApoyos: [{ preparacionId: "prep-1" }],
      disparadorTemprano: "pedido_explicito_de_ayuda",
    });
  });

  it("un disparador no configurado se rechaza sin crear señal", async () => {
    const m = mundo({ b673: true });
    const r = await registrarDisparadorTemprano(m.deps, {
      institutionId: "inst-A",
      examPreparationId: "prep-1",
      triggerCanonicalId: "diagnostico_inventado",
    });
    expect(r.estado).toBe("RECHAZADA");
    expect(m.senales.size).toBe(0);
  });
});

/**
 * El vocabulario con criterio profesional — Etapa B6.7.1, punto **9.5** de
 * [ADR-037](../docs/decisions.md#adr-037).
 *
 * > **«el sistema debe reconocer patrones, no etiquetar personas»**
 */
describe("9.5 · lo que está en el catálogo y no cuenta", () => {
  it("'clasificación incierta' se registra y no alimenta ningún contador", async () => {
    // *"No se pudo determinar"* **es una respuesta**: el error ocurrió y queda
    // registrado. Lo que no puede pasar es que tres "no sé" se sumen entre sí
    // como si fueran el mismo error.
    const m = mundo();
    for (let i = 0; i < 3; i++) {
      const r = await observarError(m.deps, { ...m.base, errorTypeId: "tipo-incierta" });
      expect(r.estado).toBe("OK");
      expect(r.estado === "OK" && r.evaluacion.estado).toBe("NO_CUENTA");
    }
    expect(m.observaciones).toHaveLength(3);
    expect(m.senales.size).toBe(0);
  });

  it("'dependencia de ayuda externa' dejó de contar sin que se editara su fila", async () => {
    // La fila del Product Owner sigue existiendo, apagada e intacta. Lo que la
    // saca del contador es que **ninguna versión vigente la declara familia**.
    // (Contra Postgres ni siquiera se puede registrar: el escritor rechaza una
    // versión apagada del vocabulario. Acá se prueba el otro cerrojo.)
    const m = mundo();
    for (let i = 0; i < 3; i++) {
      await observarError(m.deps, { ...m.base, errorTypeId: "tipo-dependencia-v1" });
    }
    const r = await observarError(m.deps, { ...m.base, errorTypeId: "tipo-dependencia-v1" });
    expect(r.estado === "OK" && r.evaluacion).toMatchObject({
      estado: "NO_CUENTA",
      motivo: expect.stringContaining("ya no declara"),
    });
    expect(m.senales.size).toBe(0);
  });

  it("la categoría secundaria no suma en la familia secundaria", async () => {
    // *"Mantener un indicador transversal por tipo para análisis, **pero sin
    // usarlo solo para escalar**."* Tres errores de procedimiento con consigna
    // como secundaria escalan **una vez**, no dos.
    const m = mundo();
    for (let i = 0; i < 3; i++) {
      await observarError(m.deps, { ...m.base, secondaryErrorTypeId: "tipo-consigna" });
    }
    expect([...m.senales.values()].every((s) => s.reason?.includes("procedimiento"))).toBe(true);
    const consigna = await m.deps.repo.observaciones("inst-A", "prep-1", "consigna");
    expect(consigna).toHaveLength(0);
  });

  it("una necesidad de apoyo no mueve el contador", async () => {
    // > *"La necesidad de ayuda **puede ser esperable y productiva**."*
    const m = mundo();
    await observarError(m.deps, m.base);
    await registrarNecesidadDeApoyo(
      { repo: m.deps.repo },
      {
        institutionId: "inst-A",
        examPreparationId: "prep-1",
        supportNeedTypeId: "apoyo-para-avanzar",
      },
    );
    const despues = await observarError(m.deps, m.base);
    // Sigue siendo la segunda aparición, no la tercera.
    expect(despues.estado === "OK" && despues.evaluacion).toMatchObject({
      estado: "OK",
      apariciones: 2,
      necesitaPersona: false,
    });
    expect(m.apoyos).toHaveLength(1);
  });
});

describe("9.5 · el contador cruza versiones del vocabulario", () => {
  it("una observación vieja y una nueva de la misma familia se suman", async () => {
    // Éste es el error que la B6.7.1 tuvo que resolver **antes** de cargar
    // `v2.0`: `error_type_id` apunta a una fila de versión, así que un contador
    // que filtre por ese id vería dos tipos distintos donde hay una sola
    // familia — y se partiría al medio, en silencio.
    const m = mundo();
    await observarError(m.deps, { ...m.base, errorTypeId: "tipo-procedimiento-v1" });
    await observarError(m.deps, { ...m.base, errorTypeId: "tipo-procedimiento-v1" });
    const nueva = await observarError(m.deps, m.base);

    expect(nueva.estado === "OK" && nueva.evaluacion).toMatchObject({
      estado: "OK",
      apariciones: 3,
      necesitaPersona: true,
    });
  });

  it("y la causa se escribe con la etiqueta vigente, no con la vieja", async () => {
    // Lo que se le muestra a una persona es **cómo se llama hoy**.
    const m = mundo();
    for (let i = 0; i < 3; i++) {
      await observarError(m.deps, { ...m.base, errorTypeId: "tipo-procedimiento-v1" });
    }
    expect([...m.senales.values()].at(-1)!.reason).toContain(
      "Error de procedimiento o estrategia",
    );
  });
});

describe("9.5 · la corrección humana de una clasificación", () => {
  it("mueve la aparición de una familia a otra, y no borra la anterior", async () => {
    const m = mundo();
    for (let i = 0; i < 3; i++) await observarError(m.deps, m.base);
    expect([...m.senales.values()].at(-1)).toMatchObject({ severity: "intervencion" });

    const r = await corregirClasificacion(m.deps, {
      institutionId: "inst-A",
      observacionId: "obs-1",
      aTipoDeErrorId: "tipo-consigna",
      motivo: "la consigna pedía otra cosa; no era el procedimiento",
    });

    expect(r.estado).toBe("OK");
    if (r.estado !== "OK") return;
    expect(r.desde.canonicalId).toBe("procedimiento");
    expect(r.hacia.canonicalId).toBe("consigna");

    // La familia de origen perdió una aparición; la de destino la ganó.
    expect(r.desde.evaluacion).toMatchObject({ apariciones: 2 });
    expect(r.hacia.evaluacion).toMatchObject({ estado: "SIN_SENAL", apariciones: 1 });

    // Y la corrección quedó registrada con su motivo: no se pisó nada.
    expect(m.correcciones).toHaveLength(1);
    expect(m.correcciones[0]).toMatchObject({ desde: "procedimiento", hacia: "consigna" });
  });

  it("no retracta una señal ya emitida, y tampoco emite una nueva", async () => {
    // La señal fue cierta bajo la clasificación vigente entonces. Retractarla
    // exigiría una transición que **nadie definió**.
    const m = mundo();
    for (let i = 0; i < 3; i++) await observarError(m.deps, m.base);
    const antes = m.senales.size;
    const estados = [...m.senales.values()].map((s) => s.state);

    await corregirClasificacion(m.deps, {
      institutionId: "inst-A",
      observacionId: "obs-1",
      aTipoDeErrorId: "tipo-consigna",
      motivo: "reclasificada por quien revisó la entrega",
    });

    expect(m.senales.size).toBe(antes);
    expect([...m.senales.values()].map((s) => s.state)).toEqual(estados);
  });

  it("sin motivo no se corrige nada", async () => {
    // Una reclasificación sin motivo es indistinguible de un error de tipeo.
    const m = mundo();
    await observarError(m.deps, m.base);
    const r = await corregirClasificacion(m.deps, {
      institutionId: "inst-A",
      observacionId: "obs-1",
      aTipoDeErrorId: "tipo-consigna",
      motivo: "   ",
    });
    expect(r.estado).toBe("RECHAZADA");
    expect(m.correcciones).toHaveLength(0);
  });

  it("si la base rechaza la corrección, no se re-evalúa nada", async () => {
    const m = mundo();
    await observarError(m.deps, m.base);
    const r = await corregirClasificacion(m.deps, {
      institutionId: "inst-A",
      observacionId: "obs-inexistente",
      aTipoDeErrorId: "tipo-consigna",
      motivo: "no debería llegar",
    });
    expect(r.estado).toBe("RECHAZADA");
    expect(m.correcciones).toHaveLength(0);
  });
});

describe("9.5 · los dos bordes HTTP nuevos", () => {
  const CORRECCION = readFileSync(
    resolve(process.cwd(), "app/api/observacion/correccion/route.ts"),
    "utf8",
  );
  const APOYO = readFileSync(resolve(process.cwd(), "app/api/apoyo/route.ts"), "utf8");

  it("los dos usan secreto de servicio", () => {
    // ⚠️ **Quién puede corregir una clasificación no está definido**: ella lo
    // puso entre lo que hay que resolver antes de un piloto. Inventar el rol acá
    // sería lo que `AGENTS.md` §1.1 prohíbe.
    for (const ruta of [CORRECCION, APOYO]) {
      expect(ruta).toContain("esSecretoDeServicio");
      expect(ruta).not.toMatch(/sesionDe|estudianteDe|resolverSesion/);
    }
  });

  it("la corrección exige motivo en el borde, no sólo en la base", () => {
    expect(CORRECCION).toContain('"motivo"');
    expect(CORRECCION).toMatch(/trim\(\)\.length === 0/);
  });

  it("el endpoint de apoyo no tiene por dónde evaluar una regla", () => {
    // No importa el Service de reiteración ni nada que registre señales.
    expect(APOYO).not.toContain("observarErrorDeEstudiante");
    expect(APOYO).not.toMatch(/registrarSenal|evaluar/);
  });

  it("un rechazo de dominio es 422 en las dos", () => {
    for (const ruta of [CORRECCION, APOYO]) {
      expect(ruta).toMatch(/estado === "RECHAZADA"[\s\S]{0,200}status: 422/);
    }
  });
});

/**
 * El denominador, de punta a punta — Etapa B6.7.2, `9.1`.
 *
 * Lo que estos tests fijan no es el número: es que **la unidad de conteo llega
 * de la configuración**, y que cambiarla cambia el resultado sin tocar código.
 */
describe("9.1 · el objetivo entra a la unidad de conteo", () => {
  it("tres errores en objetivos distintos no producen ninguna señal", async () => {
    // El falso positivo que ella marcó: la misma etiqueta amplia, tres veces,
    // en contenidos que nadie comparó entre sí.
    const m = mundo({ exigeObjetivo: true });
    let ultimo!: Awaited<ReturnType<typeof observarError>>;
    for (const obj of ["obj-A", "obj-B", "obj-C"]) {
      ultimo = await observarError(m.deps, { ...m.base, learningObjectiveId: obj });
    }
    expect(ultimo.estado === "OK" && ultimo.evaluacion).toMatchObject({
      estado: "SIN_SENAL",
      apariciones: 1,
      repeticionDetectada: 3,
    });
    expect(m.senales.size).toBe(0);
  });

  it("y los mismos tres en el mismo objetivo sí, con el mismo umbral", async () => {
    const m = mundo({ exigeObjetivo: true });
    for (let i = 0; i < 3; i++) {
      await observarError(m.deps, { ...m.base, learningObjectiveId: "obj-A" });
    }
    expect(m.senales.size).toBeGreaterThan(0);
    expect([...m.senales.values()].at(-1)).toMatchObject({ severity: "intervencion" });
  });

  it("sin objetivo declarado se cuenta la repetición y no se escala", async () => {
    const m = mundo({ exigeObjetivo: true });
    for (let i = 0; i < 3; i++) await observarError(m.deps, m.base);
    const r = await observarError(m.deps, m.base);
    expect(r.estado === "OK" && r.evaluacion).toMatchObject({
      estado: "SIN_SENAL",
      apariciones: 0,
      repeticionDetectada: 4,
    });
    expect(m.senales.size).toBe(0);
  });

  it("dos objetivos distintos no comparten señal por idempotencia", async () => {
    // La clave incluye el objetivo: si no, la segunda familia comparable se
    // comería la señal de la primera y nadie se enteraría.
    const m = mundo({ exigeObjetivo: true });
    for (let i = 0; i < 2; i++) {
      await observarError(m.deps, { ...m.base, learningObjectiveId: "obj-A" });
    }
    for (let i = 0; i < 2; i++) {
      await observarError(m.deps, { ...m.base, learningObjectiveId: "obj-B" });
    }
    expect(m.senales.size).toBe(2);
  });

  it("una corrección re-evalúa el mismo objetivo en las dos familias", async () => {
    const m = mundo({ exigeObjetivo: true });
    for (let i = 0; i < 3; i++) {
      await observarError(m.deps, { ...m.base, learningObjectiveId: "obj-A" });
    }
    const r = await corregirClasificacion(m.deps, {
      institutionId: "inst-A",
      observacionId: "obs-1",
      aTipoDeErrorId: "tipo-consigna",
      motivo: "era de consigna",
    });
    expect(r.estado).toBe("OK");
    if (r.estado !== "OK") return;
    // El objetivo no cambia con una reclasificación: las dos re-evaluaciones
    // son del mismo objetivo, en familias distintas.
    expect(r.desde.evaluacion).toMatchObject({ apariciones: 2 });
    expect(r.hacia.evaluacion).toMatchObject({ estado: "SIN_SENAL", apariciones: 1 });
  });
});
