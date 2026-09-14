/**
 * **Recuerdo real** — recuperación activa y repaso espaciado sobre contenido de
 * materias · [ADR-102](../../../docs/decisions.md#adr-102) §8.
 *
 * ## La política de repaso es del MVP, y está versionada
 *
 * `POLITICA_DE_REPASO` no es SM-2 ni un modelo predictivo: son cuatro intervalos
 * fijos que el owner escribió. Cambiar uno **cambia la versión**, y cada repaso
 * guarda con cuál se programó.
 *
 * ## Lo que no se hace
 *
 * - **Una respuesta abierta no la corrige nadie más que el estudiante.** Ni IA
 *   ni similitud de texto: escribe, confirma, ve la respuesta de referencia y
 *   clasifica su recuerdo.
 * - **Abrir una pregunta no es responderla.** Cuenta sólo lo confirmado.
 * - **No hay porcentaje de retención** hasta que haya repasos separados por al
 *   menos 24 horas.
 */

export const POLITICA_DE_REPASO = {
  version: "RR-1",
  /** Días hasta el próximo repaso, desde el día (local) en que se respondió. */
  diasPorResultado: {
    NOT_RECALLED: 1,
    PARTIAL: 1,
    RECALLED: 3,
    EASY: 7,
  },
  preguntasPorSesion: 5,
  /**
   * *"No la recordé: vuelve en la misma sesión si hay espacio"*. El espacio es
   * éste: la sesión no pasa de siete preguntas presentadas, y cada una vuelve
   * **una sola vez**.
   */
  presentacionesMaximas: 7,
  /** Una evaluación dentro de estos días sube la prioridad de su materia. */
  diasDeEvaluacionCercana: 14,
  /** Cuántos repasos recientes miran los fallos. */
  repasosRecientes: 3,
  /** El recuerdo diferido se muestra desde esta cantidad de repasos separados por 24 h. */
  minimoParaRecuerdoDiferido: 5,
  largoMaximoDeRespuesta: 200,
} as const;

export type ResultadoDeRecuerdo = keyof typeof POLITICA_DE_REPASO.diasPorResultado;
export const RESULTADOS_DE_RECUERDO = ["NOT_RECALLED", "PARTIAL", "RECALLED", "EASY"] as const satisfies readonly ResultadoDeRecuerdo[];

export function esResultadoDeRecuerdo(v: unknown): v is ResultadoDeRecuerdo {
  return typeof v === "string" && (RESULTADOS_DE_RECUERDO as readonly string[]).includes(v);
}

/**
 * Los cuatro tipos del MVP. **Ninguno supone una carrera**: una definición de
 * Derecho y una fórmula de Física son el mismo `SHORT_ANSWER`.
 */
export type TipoDeRespuesta = "SHORT_ANSWER" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SELF_ASSESSED";

export const esCerrada = (tipo: TipoDeRespuesta) => tipo !== "SELF_ASSESSED";

/** `YYYY-MM-DD` + días, en aritmética de calendario: sin husos, sin horario de verano. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10);
}

export function proximoRepaso(fechaLocal: string, resultado: ResultadoDeRecuerdo): string {
  return sumarDias(fechaLocal, POLITICA_DE_REPASO.diasPorResultado[resultado]);
}

/** Días de calendario entre dos fechas locales. Negativo si `hasta` es anterior. */
export function diasEntre(desde: string, hasta: string): number {
  const ms = (f: string) => {
    const [a, m, d] = f.split("-").map(Number);
    return Date.UTC(a, m - 1, d);
  };
  return Math.round((ms(hasta) - ms(desde)) / 86_400_000);
}

/**
 * Para comparar una respuesta corta: minúsculas, sin tildes, espacios de a uno y
 * sin puntuación al final. **Nada más.** Aceptar sinónimos o errores de tipeo es
 * decidir qué cuenta como saber, y eso lo declara la pregunta en sus respuestas
 * aceptadas, no el corrector.
 */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.;:,!¡?¿]+$/g, "")
    .trim();
}

/**
 * Corrige una respuesta **cerrada**.
 *
 * - `SHORT_ANSWER`: igual, normalizada, a alguna de las aceptadas.
 * - `MULTIPLE_CHOICE`: el id de la opción, exacto.
 * - `TRUE_FALSE`: `"true"` o `"false"`, exacto.
 *
 * ⚠️ `SELF_ASSESSED` **no se corrige**: tirar una excepción es mejor que devolver
 * un booleano que alguien lea como juicio.
 */
export function corregirCerrada(tipo: TipoDeRespuesta, aceptadas: readonly string[], respuesta: string): boolean {
  if (tipo === "SELF_ASSESSED") throw new Error("Una respuesta abierta no se corrige automáticamente");
  if (tipo === "SHORT_ANSWER") {
    const r = normalizarTexto(respuesta);
    return r !== "" && aceptadas.some((a) => normalizarTexto(a) === r);
  }
  return aceptadas.includes(respuesta);
}

/** Una cerrada bien respondida se programa como *La recordé*; mal, como *No la recordé*. */
export const resultadoDeCerrada = (correcta: boolean): ResultadoDeRecuerdo => (correcta ? "RECALLED" : "NOT_RECALLED");

// ── Qué preguntas tocan ─────────────────────────────────────────────────────

export interface RepasoPrevio {
  itemId: string;
  resultado: ResultadoDeRecuerdo;
  /** ISO del servidor. */
  respondidoEn: string;
  /** `YYYY-MM-DD`. */
  proximoRepaso: string;
}

export interface CandidataDeRecuerdo {
  itemId: string;
  /** `null` ⇒ contenido general, no de una materia. */
  cursoId: string | null;
  /** La unidad del ítem está activa en la cursada. **Hoy siempre `false`**: ver `ADR-102` §9. */
  unidadActiva: boolean;
  /** Días hasta la evaluación más próxima de su materia. `null` ⇒ no hay ninguna con fecha. */
  evaluacionEnDias: number | null;
}

export interface EstadoDeCandidata extends CandidataDeRecuerdo {
  /** Del más reciente al más viejo. */
  repasos: readonly RepasoPrevio[];
}

/** Agrupa los repasos por ítem, el más reciente primero. */
export function conRepasos(candidatas: readonly CandidataDeRecuerdo[], repasos: readonly RepasoPrevio[]): EstadoDeCandidata[] {
  const porItem = new Map<string, RepasoPrevio[]>();
  for (const r of [...repasos].sort((a, b) => b.respondidoEn.localeCompare(a.respondidoEn))) {
    const lista = porItem.get(r.itemId) ?? [];
    lista.push(r);
    porItem.set(r.itemId, lista);
  }
  return candidatas.map((c) => ({ ...c, repasos: porItem.get(c.itemId) ?? [] }));
}

/** Nueva: nunca respondida. Vencida: su próximo repaso es hoy o antes. Lo demás no está pendiente. */
export function situacionDe(c: EstadoDeCandidata, hoy: string): "NUEVA" | "VENCIDA" | "PROGRAMADA" {
  const ultimo = c.repasos[0];
  if (!ultimo) return "NUEVA";
  return ultimo.proximoRepaso <= hoy ? "VENCIDA" : "PROGRAMADA";
}

/**
 * Las preguntas de una sesión, en el orden de prioridad del owner:
 *
 * 1. vencidas · 2. de unidades activas · 3. de materias con evaluación cercana ·
 * 4. con más fallos recientes · 5. nuevas.
 *
 * ⚠️ **Lo programado para más adelante no entra**, aunque sobre lugar: repasarlo
 * antes le quitaría sentido al espaciado. Empates, por el vencimiento más viejo
 * y después por id, para que el orden no dependa de la base.
 */
export function seleccionarPreguntas(estados: readonly EstadoDeCandidata[], hoy: string, cantidad: number = POLITICA_DE_REPASO.preguntasPorSesion): string[] {
  const p = POLITICA_DE_REPASO;
  const clave = (c: EstadoDeCandidata) => {
    const situacion = situacionDe(c, hoy);
    const fallos = c.repasos.slice(0, p.repasosRecientes).filter((r) => r.resultado === "NOT_RECALLED").length;
    const cercana = c.evaluacionEnDias !== null && c.evaluacionEnDias >= 0 && c.evaluacionEnDias <= p.diasDeEvaluacionCercana;
    return [
      situacion === "VENCIDA" ? 0 : 1,
      c.unidadActiva ? 0 : 1,
      cercana ? 0 : 1,
      -fallos,
      situacion === "NUEVA" ? 1 : 0,
    ];
  };
  return estados
    .filter((c) => situacionDe(c, hoy) !== "PROGRAMADA")
    .map((c) => ({ c, k: clave(c) }))
    .sort((a, b) => {
      for (let i = 0; i < a.k.length; i++) if (a.k[i] !== b.k[i]) return a.k[i] - b.k[i];
      const va = a.c.repasos[0]?.proximoRepaso ?? "9999-12-31";
      const vb = b.c.repasos[0]?.proximoRepaso ?? "9999-12-31";
      return va.localeCompare(vb) || a.c.itemId.localeCompare(b.c.itemId);
    })
    .slice(0, cantidad)
    .map((x) => x.c.itemId);
}

export function pendientesDeHoy(estados: readonly EstadoDeCandidata[], hoy: string): { vencidas: number; nuevas: number } {
  let vencidas = 0;
  let nuevas = 0;
  for (const c of estados) {
    const s = situacionDe(c, hoy);
    if (s === "VENCIDA") vencidas += 1;
    if (s === "NUEVA") nuevas += 1;
  }
  return { vencidas, nuevas };
}

// ── La cola de la sesión ────────────────────────────────────────────────────

export interface RespuestaDeLaSesion {
  itemId: string;
  resultado: ResultadoDeRecuerdo;
}

/**
 * La cola completa de la sesión, derivada del plan y de lo respondido.
 *
 * **No se guarda: se deduce.** Un *No la recordé* agrega su pregunta al final
 * **una vez**, si la sesión no pasó de `presentacionesMaximas`. Rehacerla en el
 * servidor es lo que impide responder una pregunta que no toca.
 */
export function colaDeLaSesion(plan: readonly string[], respondidas: readonly RespuestaDeLaSesion[]): string[] {
  const cola = [...plan];
  respondidas.forEach((r) => {
    const yaVuelve = cola.filter((id) => id === r.itemId).length > 1;
    if (r.resultado === "NOT_RECALLED" && !yaVuelve && cola.length < POLITICA_DE_REPASO.presentacionesMaximas) {
      cola.push(r.itemId);
    }
  });
  return cola;
}

/** La pregunta que toca, o `null` si la sesión terminó. */
export function siguienteDeLaCola(plan: readonly string[], respondidas: readonly RespuestaDeLaSesion[]): { itemId: string; posicion: number; total: number } | null {
  const cola = colaDeLaSesion(plan, respondidas);
  const itemId = cola[respondidas.length];
  return itemId === undefined ? null : { itemId, posicion: respondidas.length, total: cola.length };
}

// ── Lo que se puede afirmar después ─────────────────────────────────────────

/**
 * El recuerdo diferido: de los repasos hechos **24 horas o más** después del
 * anterior de la misma pregunta, cuántos se recordaron (*La recordé* o *Me
 * resultó fácil*).
 *
 * `null` ⇒ **no hay datos suficientes**, que no es cero (AGENTS.md §2.5).
 */
export function recuerdoDiferido(repasos: readonly RepasoPrevio[]): { recordados: number; total: number } | null {
  const porItem = new Map<string, RepasoPrevio[]>();
  for (const r of [...repasos].sort((a, b) => a.respondidoEn.localeCompare(b.respondidoEn))) {
    porItem.set(r.itemId, [...(porItem.get(r.itemId) ?? []), r]);
  }
  let total = 0;
  let recordados = 0;
  for (const lista of porItem.values()) {
    for (let i = 1; i < lista.length; i++) {
      if (Date.parse(lista[i].respondidoEn) - Date.parse(lista[i - 1].respondidoEn) < 86_400_000) continue;
      total += 1;
      if (lista[i].resultado === "RECALLED" || lista[i].resultado === "EASY") recordados += 1;
    }
  }
  return total >= POLITICA_DE_REPASO.minimoParaRecuerdoDiferido ? { recordados, total } : null;
}
