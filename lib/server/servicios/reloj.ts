import {
  transicionesPorTiempo,
  type CompromisoConReloj,
} from "@/lib/domain/reloj-compromisos";
import { ventanaDeExamen } from "@/lib/domain/ventana-de-examen";
import type { PublicadorDeEventos } from "./eventos";
import type { RepositorioDeCompromisos } from "./compromiso";
import { transicionar } from "./compromiso";
import type { Auditor } from "./auditoria";
import type { RepositorioDeSenales } from "./riesgo";
import { transicionar as transicionarSenal } from "./riesgo";

/**
 * El owner del lifecycle, ejecutando — Fase B4 / [ADR-024](../../../docs/decisions.md#adr-024).
 *
 * **No decide nada nuevo.** La regla vive en `lib/domain/reloj-compromisos.ts`,
 * pura; acá sólo se aplica cada transición **por la misma vía que cualquier
 * otra**: `transicionar()`, con su compare-and-swap y su evento. Un camino
 * paralelo que escribiera directo se saltearía la máquina de estados, y sería
 * exactamente el agujero por donde un `MISSED` podría volver.
 */
export interface RepositorioDeReloj {
  /** Los que dependen del tiempo. Sólo `CONFIRMED` y `DUE`: el resto no se mueve. */
  candidatosPorTiempo(institutionId: string, limite: number): Promise<CompromisoConReloj[]>;
  /**
   * Señales vencidas — Fase B6.
   *
   * `product.md` §5.5: *"una señal puede expirar si deja de ser relevante; se
   * guarda la causa histórica"*. **El reloj no decide cuándo deja de ser
   * relevante**: eso lo declaró quien la creó, en `valid_until`. Acá sólo se
   * ejecuta ese vencimiento, igual que un `CONFIRMED` que pasa a `DUE`.
   *
   * **Sólo `OPEN`** — [ADR-034](../../../docs/decisions.md#adr-034). Una señal
   * que ya pidió una persona **no expira sola**: hacerlo borraría una
   * obligación humana pendiente, y el Done de la fase dice que ninguna señal
   * queda sin outcome.
   *
   * `ACKNOWLEDGED` salió de esta lista con el lifecycle nuevo. Las filas
   * históricas que quedaron ahí **dejan de expirarse solas**, que es la
   * dirección conservadora: el reloj no toca lo que ya no produce, y moverlas
   * queda en manos de alguien.
   */
  senalesVencidas(
    institutionId: string,
    ahora: string,
    limite: number,
  ): Promise<Array<{ id: string; status: "OPEN" }>>;

  /**
   * Evaluaciones **con fecha** y sin preparación, por estudiante — ADR-048.
   *
   * Entrega la fecha cruda; **no aplica la ventana**. Quién decide si faltan
   * catorce días o menos es `ventanaDeExamen`, puro, con la zona institucional
   * de ADR-049. Las que no tienen fecha no viajan: no se estima una.
   */
  candidatosDeModoExamen(
    institutionId: string,
    limite: number,
  ): Promise<CandidatoDeModoExamen[]>;

  /**
   * Crea la preparación en `RECOMMENDED`, o `null` si ya existía.
   *
   * El `null` no es un error: es la condición 3 y la 4 de ADR-048 a la vez —
   * `UNIQUE (student_id, assessment_id)` desde la B5—, y por eso el llamador
   * **no publica el evento** cuando llega.
   */
  recomendarModoExamen(
    institutionId: string,
    candidato: CandidatoDeModoExamen,
  ): Promise<{ id: string } | null>;

  /** La zona de la institución (ADR-049). `null` ⇒ no existe la institución. */
  zonaInstitucional(institutionId: string): Promise<string | null>;
}

export interface CandidatoDeModoExamen {
  assessmentId: string;
  studentId: string;
  courseEnrollmentId: string;
  /** `YYYY-MM-DD`. Nunca `null`: sin fecha la fila no viaja. */
  fechaDeExamen: string;
}

export interface ResumenDeCorrida {
  vencidos: number;
  incumplidos: number;
  /** Señales que dejaron de ser relevantes (Fase B6). */
  senalesExpiradas: number;
  /** Modos Examen recomendados en esta corrida (ADR-048). */
  examenesRecomendados: number;
  /** Perdieron una carrera contra otra escritura. No es error: se reintenta. */
  conflictos: number;
}

export async function correrReloj(
  deps: {
    reloj: RepositorioDeReloj;
    compromisos: RepositorioDeCompromisos;
    eventos: PublicadorDeEventos;
    senales: RepositorioDeSenales;
    auditor: Auditor;
  },
  institutionId: string,
  ahora: string,
  limite = 500,
): Promise<ResumenDeCorrida> {
  const candidatos = await deps.reloj.candidatosPorTiempo(institutionId, limite);
  const pendientes = transicionesPorTiempo(candidatos, ahora);

  const resumen: ResumenDeCorrida = {
    vencidos: 0,
    incumplidos: 0,
    senalesExpiradas: 0,
    examenesRecomendados: 0,
    conflictos: 0,
  };

  for (const t of pendientes) {
    const r = await transicionar(
      { repo: deps.compromisos, eventos: deps.eventos },
      institutionId,
      t.id,
      t.hacia,
      // El actor es el sistema, no una persona: nadie apretó nada. Poner un
      // `actorId` de estudiante acá diría en la auditoría que lo hizo él.
      null,
      () => new Date(ahora),
    );

    if (r.estado === "OK") {
      if (t.hacia === "DUE") resumen.vencidos++;
      else resumen.incumplidos++;
    } else if (r.estado === "CONFLICTO") {
      // El estudiante lo movió mientras corríamos. Su acción gana: la próxima
      // corrida verá el estado nuevo.
      resumen.conflictos++;
    }
    // `TRANSICION_PROHIBIDA` y `NO_ENCONTRADO` no se cuentan como error: el
    // reloj lee una foto y el mundo sigue moviéndose entre la lectura y la
    // escritura. Es lo esperado, no una falla.
  }

  // ── Las señales que dejaron de ser relevantes ──────────────────────────────
  //
  // Por la misma vía que todo lo demás: `transicionar()` de `riesgo.ts`, con su
  // máquina, su compare-and-swap y su evento. Un `UPDATE` directo acá se
  // saltearía la regla de que una señal en `INTERVENTION_REQUIRED` no expira.
  for (const s of await deps.reloj.senalesVencidas(institutionId, ahora, limite)) {
    const r = await transicionarSenal(
      { repo: deps.senales, eventos: deps.eventos, auditor: deps.auditor },
      institutionId,
      s.id,
      "EXPIRED",
      // Sistema, no persona: nadie decidió que dejara de importar.
      null,
      () => new Date(ahora),
    );
    if (r.estado === "OK") resumen.senalesExpiradas++;
    else if (r.estado === "CONFLICTO") resumen.conflictos++;
  }

  // ── El disparador de Modo Examen — ADR-048 ────────────────────────────────
  //
  // Vive en el reloj porque es exactamente lo que el reloj hace: aplicar una
  // regla que depende del paso del tiempo y que **nadie apretó**. Un endpoint
  // propio habría necesitado un segundo secreto y un segundo scheduler para
  // hacer lo mismo un minuto después.
  //
  // ⚠️ **La zona se lee una vez y, si falta, no se recomienda nada.** Sin ella
  // "faltan 14 días" no tiene un día contra el cual contarse, y contarlo con
  // otra zona sería aplicar otra regla. El resto de la corrida no se interrumpe:
  // los compromisos y las señales no dependen de este dato.
  const zonaInstitucional = await deps.reloj.zonaInstitucional(institutionId);
  if (zonaInstitucional) {
    for (const c of await deps.reloj.candidatosDeModoExamen(institutionId, limite)) {
      const ventana = ventanaDeExamen({
        fechaDeExamen: c.fechaDeExamen,
        ahora,
        zonaInstitucional,
      });
      if (!ventana.recomendar) continue;

      const creada = await deps.reloj.recomendarModoExamen(institutionId, c);
      // `null` ⇒ ya existía. **No se publica**: un evento por corrida
      // convertiría el registro de hechos en un latido.
      if (!creada) continue;

      await deps.eventos.publicar({
        nombre: "ExamPreparationRecommended",
        institutionId,
        // Nadie apretó nada: lo produjo el paso del tiempo. Poner acá al
        // estudiante diría en la auditoría que lo pidió él.
        actorId: null,
        sujetoTipo: "exam_preparation",
        sujetoId: creada.id,
        causa: `ventana:${ventana.diasRestantes}d`,
        // Por qué apareció, en el hecho: la fecha que se usó y cuántos días
        // faltaban. Sin esto, la recomendación no se puede explicar después.
        payload: {
          assessmentId: c.assessmentId,
          fechaDeExamen: c.fechaDeExamen,
          diasRestantes: ventana.diasRestantes,
          zonaInstitucional,
        },
      });
      resumen.examenesRecomendados++;
    }
  }

  return resumen;
}
