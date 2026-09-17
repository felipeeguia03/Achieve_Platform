import { describe, expect, it } from "vitest";

import {
  evaluarReiteracion,
  umbralDesdeConfig,
  type ObservacionDeError,
  type UmbralDeReiteracion,
} from "@/lib/domain/reiteracion";

/**
 * La regla provisional de `C01-021` — Etapa B6.5, [ADR-036](../docs/decisions.md#adr-036).
 *
 * ⚠️ Los números de acá **son los del Product Owner**, provisionales y sin
 * validación psicopedagógica. Lo que estos tests fijan no es que 3 sea el
 * número correcto: es que **el conteo sea determinístico** y que el umbral
 * llegue de afuera. Si mañana ella dice 4, cambia una fila de configuración y
 * estos tests siguen valiendo con otro `UMBRAL`.
 */
const UMBRAL: UmbralDeReiteracion = {
  apariciones: { atencion: 2, intervencion: 3 },
  reincidenciaTrasCorrectiva: "intervencion",
  reiniciaConResolucionLimpia: true,
  soloCorroboradas: true,
  // **La configuración del PO no exigía nada de esto**, y estos tests siguen
  // corriendo con su semántica a propósito: sirven para probar que cargar la
  // versión de la psicopedagoga no reinterpretó en el lugar lo que él decidió.
  // El denominador de ella tiene su propio bloque, más abajo.
  exigeObjetivoComparable: false,
  exigeErrorIdentificable: false,
  calidadExcluida: [],
  confianzaMinima: null,
};

/**
 * `9.1` aislado: sólo la comparabilidad. Los filtros de evidencia son `9.6` y
 * tienen su propio bloque — mezclarlos haría que un test de comparabilidad
 * fallara por una razón que no es la que está probando.
 */
const UMBRAL_COMPARABLE: UmbralDeReiteracion = {
  ...UMBRAL,
  exigeObjetivoComparable: true,
};

/** La configuración completa de la psicopedagoga — `9.1` + `9.6`, B6.7.2. */
const UMBRAL_PSICO: UmbralDeReiteracion = {
  ...UMBRAL_COMPARABLE,
  exigeErrorIdentificable: true,
  calidadExcluida: ["no_interpretable"],
  confianzaMinima: "media",
};

let reloj = 0;
function err(o: Partial<ObservacionDeError> = {}): ObservacionDeError {
  reloj++;
  return {
    kind: "error",
    corroborated: true,
    observedAt: `2026-09-0${reloj}T10:00:00.000Z`,
    trasAccionCorrectiva: false,
    objetivoId: null,
    calidad: null,
    errorIdentificable: null,
    confianza: null,
    correccionEntregada: null,
    correccionAccesible: null,
    estudianteSeInvolucro: null,
    nuevoIntentoIndependiente: null,
    confianzaMismoError: null,
    identidadIntento: null,
    tareaEquivalenteNoIdentica: null,
    espaciadaOSinModeloInmediato: null,
    ...o,
  };
}
function limpia(o: Partial<ObservacionDeError> = {}): ObservacionDeError {
  return err({ kind: "resolucion_limpia", ...o });
}

describe("C01-021 provisional · el conteo", () => {
  it("la primera aparición no pide nada", () => {
    reloj = 0;
    const r = evaluarReiteracion([err()], UMBRAL, "Error de cálculo");
    expect(r).toMatchObject({ apariciones: 1, severidad: null, necesitaPersona: false });
    // Sin severidad no hay motivo, y sin motivo no hay señal: `registrarSenal`
    // rechaza una causa vacía.
    expect(r.motivo).toBeNull();
  });

  it("la segunda es `atencion`, y todavía no llama a una persona", () => {
    reloj = 0;
    const r = evaluarReiteracion([err(), err()], UMBRAL, "Error de cálculo");
    expect(r).toMatchObject({ apariciones: 2, severidad: "atencion", necesitaPersona: false });
    expect(r.motivo).toBe("Error de cálculo: 2 veces en la preparación de este examen");
  });

  it("la tercera pide una persona", () => {
    reloj = 0;
    const r = evaluarReiteracion([err(), err(), err()], UMBRAL, "Error de cálculo");
    expect(r).toMatchObject({ apariciones: 3, severidad: "intervencion", necesitaPersona: true });
  });

  it("el mismo tipo cuenta aunque el tema sea otro", () => {
    // Decisión del PO, textual: el tema *"es contexto explicativo"*. El
    // evaluador ni siquiera recibe el tema — es la forma más fuerte de que no
    // pueda influir.
    reloj = 0;
    const r = evaluarReiteracion([err(), err(), err()], UMBRAL, "Error conceptual");
    expect(r.apariciones).toBe(3);
  });
});

describe("C01-021 provisional · lo que reinicia y lo que no cuenta", () => {
  it("una resolución limpia reinicia el contador de ese tipo", () => {
    reloj = 0;
    const r = evaluarReiteracion([err(), err(), limpia(), err()], UMBRAL, "Error de cálculo");
    expect(r).toMatchObject({ apariciones: 1, severidad: null });
  });

  it("y después del reinicio se vuelve a contar desde cero", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [err(), err(), limpia(), err(), err(), err()],
      UMBRAL,
      "Error de cálculo",
    );
    expect(r).toMatchObject({ apariciones: 3, severidad: "intervencion" });
  });

  it("una observación sin corroborar no cuenta", () => {
    // Punto 6 de `C01-036`: un error inferido, ambiguo o no corroborado no
    // incrementa el contador.
    reloj = 0;
    const r = evaluarReiteracion(
      [err(), err({ corroborated: false }), err({ corroborated: false })],
      UMBRAL,
      "Error de cálculo",
    );
    expect(r).toMatchObject({ apariciones: 1, severidad: null });
  });

  it("y tampoco reinicia: una resolución que nadie verificó no borra nada", () => {
    // La simetría importa. Si lo no corroborado no suma pero sí resta, alcanza
    // con declarar una resolución para apagar una señal.
    reloj = 0;
    const r = evaluarReiteracion(
      [err(), err(), limpia({ corroborated: false }), err()],
      UMBRAL,
      "Error de cálculo",
    );
    expect(r).toMatchObject({ apariciones: 3, severidad: "intervencion" });
  });
});

describe("C01-021 provisional · la reincidencia tras una correctiva", () => {
  it("volver a fallar después de una acción correctiva pide una persona sin esperar la tercera", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [err(), err({ trasAccionCorrectiva: true })],
      UMBRAL,
      "Error de procedimiento",
    );
    expect(r).toMatchObject({ apariciones: 2, severidad: "intervencion", necesitaPersona: true });
    expect(r.motivo).toContain("volvió a aparecer después de una acción correctiva");
  });

  it("pero una PRIMERA aparición tras una correctiva no es una reincidencia", () => {
    // "Una **nueva** aparición", dijo el PO. Un primer error no es volver a
    // equivocarse, y tratarlo así castigaría a alguien que recién empieza.
    reloj = 0;
    const r = evaluarReiteracion([err({ trasAccionCorrectiva: true })], UMBRAL, "Error conceptual");
    expect(r).toMatchObject({ apariciones: 1, severidad: null });
  });

  it("una resolución limpia posterior también borra la reincidencia", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [err(), err({ trasAccionCorrectiva: true }), limpia(), err()],
      UMBRAL,
      "Error conceptual",
    );
    expect(r).toMatchObject({ apariciones: 1, severidad: null });
  });
});

describe("C01-021 provisional · determinismo y ausencia de umbral", () => {
  it("el orden de entrada no cambia el resultado: se ordena por fecha", () => {
    const a: ObservacionDeError[] = [
      err({ observedAt: "2026-09-03T10:00:00Z" }),
      limpia({ observedAt: "2026-09-02T10:00:00Z" }),
      err({ observedAt: "2026-09-01T10:00:00Z" }),
    ];
    const enOrden = evaluarReiteracion([...a].reverse(), UMBRAL, "x");
    const desordenado = evaluarReiteracion(a, UMBRAL, "x");
    expect(desordenado).toEqual(enOrden);
    expect(desordenado.apariciones).toBe(1);
  });

  it("correr dos veces sobre lo mismo da lo mismo: no hay azar", () => {
    reloj = 0;
    const obs = [err(), err(), err()];
    expect(evaluarReiteracion(obs, UMBRAL, "x")).toEqual(evaluarReiteracion(obs, UMBRAL, "x"));
  });

  it("sin apariciones no hay nada que decir", () => {
    expect(evaluarReiteracion([], UMBRAL, "x")).toMatchObject({
      apariciones: 0,
      severidad: null,
      motivo: null,
    });
  });

  it("una regla sin umbral no produce un umbral por defecto", () => {
    // `HP0-06-2` y `HP0-06-3` siguen así. Devolver un default sería inventar la
    // decisión que nadie tomó.
    expect(umbralDesdeConfig(null)).toBeNull();
    expect(umbralDesdeConfig({})).toBeNull();
    expect(umbralDesdeConfig({ apariciones: { atencion: 2 } })).toBeNull();
  });

  it("el umbral se lee tal como está en la configuración", () => {
    const u = umbralDesdeConfig({
      apariciones: { atencion: 4, intervencion: 7 },
      reincidencia_tras_correctiva: "riesgo",
      reinicia_con_resolucion_limpia: true,
      solo_corroboradas: true,
    });
    expect(u).toMatchObject({
      apariciones: { atencion: 4, intervencion: 7 },
      reincidenciaTrasCorrectiva: "riesgo",
      reiniciaConResolucionLimpia: true,
      soloCorroboradas: true,
      // **Una configuración que no declara las exigencias de la B6.7.2 no las
      // hereda.** Si las heredara, cargar la versión nueva del lector cambiaría
      // el significado de una fila que alguien escribió antes — que es la misma
      // regla que impide editar una migración aplicada.
      exigeObjetivoComparable: false,
      exigeErrorIdentificable: false,
      calidadExcluida: [],
      confianzaMinima: null,
    });
    // Y con otro umbral, el mismo conteo da otra cosa: la regla no está fijada
    // en el código.
    reloj = 0;
    expect(evaluarReiteracion([err(), err()], u!, "x").severidad).toBeNull();
  });
});

describe("9.3 y 9.4 · acelerar y reiniciar sin borrar", () => {
  const UMBRAL_B673: UmbralDeReiteracion = {
    ...UMBRAL_PSICO,
    aceleraTrasCorreccionValida: true,
    confianzaMismoErrorMinima: "media",
    aciertosLimpiosParaResolver: 2,
    exigeIntentosDistintos: true,
    exigeUnoEspaciadoOSinModelo: true,
  };
  const base = { objetivoId: "obj-A", errorIdentificable: true, confianza: "alta" } as const;
  const correccion = {
    ...base,
    trasAccionCorrectiva: true,
    correccionEntregada: true,
    correccionAccesible: true,
    estudianteSeInvolucro: true,
    nuevoIntentoIndependiente: true,
    confianzaMismoError: "alta",
  } as const;

  it("acelera sólo cuando las cinco condiciones están presentes", () => {
    reloj = 0;
    const valida = evaluarReiteracion([err(base), err(correccion)], UMBRAL_B673, "Error", "obj-A");
    expect(valida).toMatchObject({ apariciones: 2, severidad: "intervencion" });

    reloj = 0;
    const invalida = evaluarReiteracion(
      [err(base), err({ ...correccion, correccionAccesible: false })],
      UMBRAL_B673,
      "Error",
      "obj-A",
    );
    expect(invalida).toMatchObject({ apariciones: 2, severidad: "atencion" });
  });

  it("un acierto no cierra; dos distintos y uno espaciado sí", () => {
    reloj = 0;
    const uno = evaluarReiteracion(
      [err(base), err(base), limpia({ ...base, nuevoIntentoIndependiente: true, identidadIntento: "a", tareaEquivalenteNoIdentica: true, espaciadaOSinModeloInmediato: true })],
      UMBRAL_B673,
      "Error",
      "obj-A",
    );
    expect(uno).toMatchObject({ apariciones: 2, aciertosLimpios: 1, recuperada: false });

    reloj = 0;
    const dos = evaluarReiteracion(
      [
        err(base),
        err(base),
        limpia({ ...base, nuevoIntentoIndependiente: true, identidadIntento: "a", tareaEquivalenteNoIdentica: true, espaciadaOSinModeloInmediato: true }),
        limpia({ ...base, nuevoIntentoIndependiente: true, identidadIntento: "b", tareaEquivalenteNoIdentica: true }),
      ],
      UMBRAL_B673,
      "Error",
      "obj-A",
    );
    expect(dos).toMatchObject({ apariciones: 0, recuperaciones: 1, recuperada: true });
  });

  it("una recaída queda separada del episodio recuperado", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [
        err(base), err(base),
        limpia({ ...base, nuevoIntentoIndependiente: true, identidadIntento: "a", tareaEquivalenteNoIdentica: true, espaciadaOSinModeloInmediato: true }),
        limpia({ ...base, nuevoIntentoIndependiente: true, identidadIntento: "b", tareaEquivalenteNoIdentica: true }),
        err(base),
      ],
      UMBRAL_B673,
      "Error",
      "obj-A",
    );
    expect(r).toMatchObject({ apariciones: 1, recuperaciones: 1, recuperada: false, recaida: true });
  });
});

/**
 * El denominador — Etapa B6.7.2, puntos **9.1** y **9.6** de
 * [ADR-037](../docs/decisions.md#adr-037).
 *
 * > *"No contar automáticamente dos errores sólo porque comparten una etiqueta
 * > amplia. **Deben coincidir el tipo de error y el objetivo de aprendizaje o
 * > demanda cognitiva principal.**"*
 *
 * Los umbrales son **los mismos** que arriba. Lo único que cambia es qué se
 * cuenta, y eso alcanza para que el mismo input dé otro resultado.
 */
describe("9.1 · lo comparable y lo meramente repetido", () => {
  it("tres errores del mismo tipo en objetivos distintos NO escalan", () => {
    // El falso positivo que ella marcó: *"dos errores procedimentales en
    // contenidos no comparables no necesariamente expresan la misma
    // dificultad"*.
    reloj = 0;
    const r = evaluarReiteracion(
      [err({ objetivoId: "obj-A" }), err({ objetivoId: "obj-B" }), err({ objetivoId: "obj-C" })],
      UMBRAL_COMPARABLE,
      "Error de procedimiento o estrategia",
      "obj-A",
    );
    expect(r).toMatchObject({
      apariciones: 1,
      repeticionDetectada: 3,
      severidad: null,
      necesitaPersona: false,
    });
  });

  it("y con el mismo umbral, tres en el MISMO objetivo sí", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [err({ objetivoId: "obj-A" }), err({ objetivoId: "obj-A" }), err({ objetivoId: "obj-A" })],
      UMBRAL_COMPARABLE,
      "Error de procedimiento o estrategia",
      "obj-A",
    );
    expect(r).toMatchObject({ apariciones: 3, severidad: "intervencion", necesitaPersona: true });
    // **La causa no estrena vocabulario**: `reason` llega a la pantalla del
    // estudiante, y ella pidió revisión experta de lenguaje antes de probar con
    // personas. La frase es la misma que ya estaba.
    expect(r.motivo).toBe("Error de procedimiento o estrategia: 3 veces en la preparación de este examen");
  });

  it("la causa dice cuántas hubo en total, cuando hubo más sin comparar", () => {
    // Que el comparable sea menor que el detectado **es información**: hubo más
    // errores del mismo tipo, y nadie los comparó entre sí.
    reloj = 0;
    const r = evaluarReiteracion(
      [
        err({ objetivoId: "obj-A" }),
        err({ objetivoId: "obj-A" }),
        err({ objetivoId: "obj-Z" }),
        err({ objetivoId: "obj-A" }),
      ],
      UMBRAL_COMPARABLE,
      "Error conceptual",
      "obj-A",
    );
    expect(r).toMatchObject({ apariciones: 3, repeticionDetectada: 4 });
    // La distinción viaja en el **resultado**, no en la frase: la cuarta
    // aparición no comparable no aparece en el texto que ve el estudiante.
    expect(r.motivo).not.toContain("4");
    expect(r.motivo).toContain("3 veces en la preparación de este examen");
  });

  it("sin objetivo declarado se detecta la repetición y no se escala", () => {
    // *"Deben coincidir el tipo de error **y** el objetivo."* Si no sabemos el
    // objetivo, no podemos afirmar que coinciden.
    reloj = 0;
    const r = evaluarReiteracion([err(), err(), err()], UMBRAL_COMPARABLE, "Error de cálculo", null);
    expect(r).toMatchObject({
      apariciones: 0,
      repeticionDetectada: 3,
      severidad: null,
      necesitaPersona: false,
    });
    expect(r.motivo).toBeNull();
  });

  it("una resolución limpia de OTRO objetivo no reinicia este contador", () => {
    // Reiniciar por algo no comparable sería el mismo error al revés.
    reloj = 0;
    const r = evaluarReiteracion(
      [
        err({ objetivoId: "obj-A" }),
        err({ objetivoId: "obj-A" }),
        limpia({ objetivoId: "obj-B" }),
        err({ objetivoId: "obj-A" }),
      ],
      UMBRAL_COMPARABLE,
      "Error conceptual",
      "obj-A",
    );
    expect(r).toMatchObject({ apariciones: 3, severidad: "intervencion" });
  });

  it("pero una del mismo objetivo sí", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [
        err({ objetivoId: "obj-A" }),
        err({ objetivoId: "obj-A" }),
        limpia({ objetivoId: "obj-A" }),
        err({ objetivoId: "obj-A" }),
      ],
      UMBRAL_COMPARABLE,
      "Error conceptual",
      "obj-A",
    );
    expect(r).toMatchObject({ apariciones: 1, severidad: null });
  });
});

describe("9.6 · qué evidencia deja contar", () => {
  const enA = { objetivoId: "obj-A", errorIdentificable: true, confianza: "alta" } as const;

  it("una entrega insuficiente CUENTA si el error es identificable", () => {
    // Su `APROBAR`, textual: *"excluir entregas insuficientes sesgaría la
    // detección contra quienes más necesitan acompañamiento"*.
    reloj = 0;
    const r = evaluarReiteracion(
      [
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
      ],
      UMBRAL_PSICO,
      "Error de cálculo",
      "obj-A",
    );
    expect(r).toMatchObject({ apariciones: 3, necesitaPersona: true });
  });

  it("una evidencia no interpretable se registra y no cuenta", () => {
    // *"No contar fotos ilegibles, respuestas vacías, abandono sin producción."*
    reloj = 0;
    const r = evaluarReiteracion(
      [
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
        err({ objetivoId: "obj-A", calidad: "no_interpretable", errorIdentificable: false, confianza: "alta" }),
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
      ],
      UMBRAL_PSICO,
      "Error de cálculo",
      "obj-A",
    );
    expect(r).toMatchObject({ apariciones: 2, noInterpretables: 1, severidad: "atencion" });
  });

  it("un error sin identificar no cuenta, aunque la evidencia se lea", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
        err({ objetivoId: "obj-A", calidad: "suficiente_de_logro", errorIdentificable: false, confianza: "alta" }),
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
      ],
      UMBRAL_PSICO,
      "Error de cálculo",
      "obj-A",
    );
    expect(r).toMatchObject({ apariciones: 2, severidad: "atencion" });
  });

  it("una clasificación de confianza baja no llega al contador", () => {
    reloj = 0;
    const r = evaluarReiteracion(
      [
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
        err({ objetivoId: "obj-A", calidad: "suficiente_para_identificar_error", errorIdentificable: true, confianza: "baja" }),
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
      ],
      UMBRAL_PSICO,
      "Error de cálculo",
      "obj-A",
    );
    expect(r).toMatchObject({ apariciones: 2, severidad: "atencion" });
  });

  it("una resolución limpia no necesita un error identificable para reiniciar", () => {
    // La identificabilidad es una condición sobre el **error**. Exigírsela a una
    // resolución limpia impediría reiniciar cualquier contador.
    reloj = 0;
    const r = evaluarReiteracion(
      [
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
        limpia({ objetivoId: "obj-A", calidad: "suficiente_de_logro", errorIdentificable: null, confianza: "alta" }),
        err({ ...enA, calidad: "suficiente_para_identificar_error" }),
      ],
      UMBRAL_PSICO,
      "Error de cálculo",
      "obj-A",
    );
    expect(r).toMatchObject({ apariciones: 1, severidad: null });
  });
});
