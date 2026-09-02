import "server-only";

import { estudiantesReal } from "./repositorios/estudiante";
import { identidadReal } from "./repositorios/identidad";
import { eventosReal } from "./repositorios/eventos";
import { ingestaReal } from "./repositorios/ingesta";
import { compromisosReal } from "./repositorios/compromiso";
import { hoyReal } from "./repositorios/hoy";
import { materiaReal } from "./repositorios/materia";
import { accionLecturaReal } from "./repositorios/accion-lectura";
import { compromisoLecturaReal } from "./repositorios/compromiso-lectura";
import { evidenciaLecturaReal } from "./repositorios/evidencia-lectura";
import { progresoLecturaReal } from "./repositorios/progreso-lectura";
import { progresoEscrituraReal } from "./repositorios/progreso";
import { institucionesReal } from "./repositorios/instituciones";
import { motorReal } from "./repositorios/motor";
import { relojReal } from "./repositorios/reloj";
import { senalesReal } from "./repositorios/riesgo";
import { intervencionesReal } from "./repositorios/intervencion";
import { auditorReal } from "./repositorios/auditoria";
import { preparacionesReal } from "./repositorios/preparacion";
import {
  activacionLecturaReal,
  preparacionLecturaReal,
  pasoLecturaReal,
} from "./repositorios/examen-lectura";
import { crearClienteDeCrm } from "./repositorios/crm";
import {
  autorizarPorPadron as autorizarPuro,
  type ResultadoDeAutorizacion,
} from "./servicios/autorizacion";
import {
  ingerirMateria as ingerirPuro,
  type GuiaDeMateria,
  type ResultadoDeIngesta,
} from "./servicios/ingesta";
import { recomendarPara as recomendarPuro, type ResultadoDelMotor } from "./servicios/motor";
import { proyectarDia } from "./servicios/proyeccion-hoy";
import { proyectarMateria } from "./servicios/proyeccion-materia";
import { proyectarAccion } from "./servicios/proyeccion-accion";
import { proyectarCompromiso } from "./servicios/proyeccion-compromiso";
import { proyectarEvidencia } from "./servicios/proyeccion-evidencia";
import { proyectarProgreso } from "./servicios/proyeccion-progreso";
import { proyectarActivacion } from "./servicios/proyeccion-activacion";
import { proyectarPreparacion } from "./servicios/proyeccion-preparacion";
import { proyectarPaso } from "./servicios/proyeccion-paso";
import { directorioNoDisponible } from "./servicios/operadores";
import {
  registrarSenal as registrarSenalPuro,
  resolver as resolverSenalPuro,
  transicionar as transicionarSenalPuro,
  type ResultadoDeResolucion,
  type ResultadoDeSenal,
  type SenalDetectada,
} from "./servicios/riesgo";
import {
  abrir as abrirIntervencionPuro,
  cerrar as cerrarIntervencionPuro,
  reconocer as reconocerIntervencionPuro,
  type AperturaDeIntervencion,
  type CierreDeIntervencion,
  type ResultadoDeApertura,
  type ResultadoDeCierre,
} from "./servicios/intervencion";
import {
  activar as activarPuro,
  completarPaso as completarPasoPuro,
  type PasoCompletado,
  type ResultadoDeActivacion,
  type ResultadoDeCompletion,
} from "./servicios/preparacion";
import {
  registrarProgreso as registrarProgresoPuro,
  type ResultadoDeProgresoEntrante,
  type ResultadoDelRegistro,
} from "./servicios/progreso";
import type {
  ActivacionExamenProps,
  OverviewExamenProps,
  PasoProtocoloProps,
  CompromisoProps,
  EvidenciaProps,
  HoyProps,
  MateriaProps,
  ProgresoProps,
  ProximaAccionProps,
} from "@/lib/domain/view-models";
import { correrReloj as correrRelojPuro, type ResumenDeCorrida } from "./servicios/reloj";
import { resolverSesion as resolverSesionPuro, type ResultadoDeSesion } from "./servicios/sesion";

/**
 * Composition root: el **único** lugar donde las implementaciones concretas se
 * atan a los Services.
 *
 * Existe porque §3.2 dice que cada capa conoce **únicamente a la capa
 * inferior**, y el Controller que importaba Repositories conocía dos. Lo cazó
 * `tests/frontera-backend.test.ts`; el guard tenía razón y el código estaba
 * mal, no al revés.
 *
 * Cambiar de proveedor de auth o de base se hace acá, y en ningún otro lado.
 */
export function resolverSesion(token: string | null): Promise<ResultadoDeSesion> {
  return resolverSesionPuro({ identidad: identidadReal, estudiantes: estudiantesReal }, token);
}

/**
 * Autorización de padrón contra el CRM (`B1.6`).
 *
 * ⚠️ **Uso con una persona real sigue bloqueado por
 * [ADR-006](../../docs/decisions.md#adr-006).** El cliente existe y está
 * probado contra el contrato con datos sintéticos; llamarlo con el email de un
 * estudiante real es procesar dato personal.
 */
export function autorizarPorPadron(input: {
  email: string;
  platformStudentId: string;
}): Promise<ResultadoDeAutorizacion> {
  return autorizarPuro({ crm: crearClienteDeCrm(), instituciones: institucionesReal }, input);
}

/**
 * Ingesta del Academic Data Layer (Fase B2b).
 *
 * ⚠️ Sobre **datos de una universidad real** sigue pendiente `C01-042` —qué
 * institución, qué carrera y qué fuentes son legalmente utilizables—. La pieza
 * funciona hoy sobre material sintético.
 */
export function ingerirMateria(
  institutionId: string,
  guia: GuiaDeMateria,
  actorId: string | null = null,
): Promise<ResultadoDeIngesta> {
  return ingerirPuro({ repo: ingestaReal, eventos: eventosReal }, institutionId, guia, actorId);
}

/**
 * Corre el reloj del lifecycle para una institución.
 *
 * `ahora` entra por parámetro incluso acá: permite correrlo sobre un instante
 * fijo para una demo o un test de integración sin tocar el reloj de la máquina.
 */
export function correrReloj(
  institutionId: string,
  ahora: string = new Date().toISOString(),
): Promise<ResumenDeCorrida> {
  return correrRelojPuro(
    {
      reloj: relojReal,
      compromisos: compromisosReal,
      eventos: eventosReal,
      senales: senalesReal,
      auditor: auditorReal,
    },
    institutionId,
    ahora,
  );
}

/** El ADE, decidiendo sobre datos persistidos (Fase B4). */
export function recomendarPara(
  institutionId: string,
  courseEnrollmentId: string,
  ahora: string = new Date().toISOString(),
): Promise<ResultadoDelMotor> {
  return recomendarPuro({ repo: motorReal, eventos: eventosReal }, institutionId, courseEnrollmentId, ahora);
}

/**
 * `UX01` desde datos persistidos (Etapa B2.5).
 *
 * Devuelve el **mismo `HoyProps`** que daba el fixture. La pantalla no se
 * entera de que cambió el mundo debajo, que era exactamente el punto de la
 * frontera.
 */
export async function diaDe(
  institutionId: string,
  studentId: string,
  ahora: string = new Date().toISOString(),
): Promise<HoyProps | null> {
  const estado = await hoyReal.estadoDelDia(institutionId, studentId, ahora);
  return estado ? proyectarDia(estado) : null;
}

/**
 * `UX02` desde datos persistidos (Etapa B2.6).
 *
 * `courseEnrollmentId` es opcional porque `/materia` no lleva id en la URL:
 * sin él, la función de base elige la cursada de la Action viva. Ponerle un id
 * a la ruta toca el registro canónico de CTAs, que es contrato — queda
 * declarado como costura en el roadmap, no resuelto de contrabando.
 */
export async function materiaDe(
  institutionId: string,
  studentId: string,
  courseEnrollmentId: string | null = null,
  ahora: string = new Date().toISOString(),
): Promise<MateriaProps | null> {
  const estado = await materiaReal.estadoDeMateria(institutionId, studentId, ahora, courseEnrollmentId);
  return estado ? proyectarMateria(estado) : null;
}

/** `UX03` desde datos persistidos (Etapa B2.6). */
export async function accionDe(
  institutionId: string,
  studentId: string,
  actionId: string | null = null,
  ahora: string = new Date().toISOString(),
): Promise<ProximaAccionProps | null> {
  const estado = await accionLecturaReal.estadoDeAccion(institutionId, studentId, ahora, actionId);
  return estado ? proyectarAccion(estado) : null;
}

/** `UX04` desde datos persistidos (Etapa B2.6). */
export async function compromisoDe(
  institutionId: string,
  studentId: string,
  commitmentId: string | null = null,
  ahora: string = new Date().toISOString(),
): Promise<CompromisoProps | null> {
  const estado = await compromisoLecturaReal.estadoDeCompromiso(institutionId, studentId, ahora, commitmentId);
  return estado ? proyectarCompromiso(estado) : null;
}

/**
 * `UX05` desde datos persistidos (Etapa B2.6).
 *
 * El requisito de `Reflection` ya no entra por acá: lo trae la Action, congelado
 * al crearla ([ADR-026](../../docs/decisions.md#adr-026)). Mientras `C01-051`
 * estuvo `OPEN` este parámetro existía para **no** elegir un default desde el
 * código; con la decisión tomada, un parámetro que el caller pudiera cambiar
 * sería una puerta trasera a una regla de negocio ya cerrada.
 */
export async function evidenciaDe(
  institutionId: string,
  studentId: string,
  evidenceId: string | null = null,
  ahora: string = new Date().toISOString(),
): Promise<EvidenciaProps | null> {
  const estado = await evidenciaLecturaReal.estadoDeEvidencia(institutionId, studentId, ahora, evidenceId);
  return estado ? proyectarEvidencia(estado) : null;
}

/**
 * `UX06` desde datos persistidos (Etapa B2.6).
 *
 * ⚠️ **Nadie escribe `progress_entry` todavía.** El `ProgressUpdated` productivo
 * —quién lo emite, con qué causalidad y con qué payload— es la Fase B3 y
 * `C01-018`. Hasta entonces la pantalla proyecta lo que haya en la tabla, que
 * con datos sintéticos es lo que siembre la demo, y sin filas dice *"todavía no
 * hay un cambio confirmado"*: la única lectura honesta.
 */
export async function progresoDe(
  institutionId: string,
  studentId: string,
  evidenceId: string | null = null,
  ahora: string = new Date().toISOString(),
): Promise<ProgresoProps | null> {
  const estado = await progresoLecturaReal.estadoDeProgreso(institutionId, studentId, ahora, evidenceId);
  return estado ? proyectarProgreso(estado) : null;
}

/**
 * Registra un resultado de progreso (Etapa B3.1).
 *
 * ⚠️ **Esto no decide que alguien aprendió algo.** Persiste un resultado que el
 * owner del progreso ya produjo; quién lo emite y con qué causalidad es
 * `C01-018`, `OPEN`. **Ninguna ruta de `Evidence` llama acá**, y hay un guard
 * estático que lo verifica: validar una evidencia no produce progreso.
 */
export function registrarProgreso(
  entrada: ResultadoDeProgresoEntrante,
): Promise<ResultadoDelRegistro> {
  return registrarProgresoPuro(
    { repo: progresoEscrituraReal, eventos: eventosReal },
    entrada,
  );
}

/**
 * `UX07` desde datos persistidos (Etapa B5.5).
 *
 * ⚠️ **No calcula la ventana de recomendación.** `C01-024` sigue `OPEN` y
 * `product.md` §9 lo fija: la UI *"consume una señal ya emitida"*. Sin una
 * preparación en `RECOMMENDED` esta superficie dice que no hay recomendación,
 * en vez de inventarse un umbral de días.
 */
export async function activacionDe(
  institutionId: string,
  studentId: string,
  courseEnrollmentId: string | null = null,
  ahora: string = new Date().toISOString(),
): Promise<ActivacionExamenProps | null> {
  const estado = await activacionLecturaReal.estadoDeActivacion(
    institutionId,
    studentId,
    ahora,
    courseEnrollmentId,
  );
  return estado ? proyectarActivacion(estado) : null;
}

/** `UX08` desde datos persistidos (Etapa B5.5). Sin readiness: ver ADR-011. */
export async function preparacionDe(
  institutionId: string,
  studentId: string,
  preparacionId: string | null = null,
  ahora: string = new Date().toISOString(),
): Promise<OverviewExamenProps | null> {
  const estado = await preparacionLecturaReal.estadoDePreparacion(
    institutionId,
    studentId,
    ahora,
    preparacionId,
  );
  return estado ? proyectarPreparacion(estado) : null;
}

/** `UX09` desde datos persistidos (Etapa B5.5). */
export async function pasoDe(
  institutionId: string,
  studentId: string,
  preparacionId: string,
  pasoId: string,
  ahora: string = new Date().toISOString(),
): Promise<PasoProtocoloProps | null> {
  const estado = await pasoLecturaReal.estadoDePaso(
    institutionId,
    studentId,
    ahora,
    preparacionId,
    pasoId,
  );
  return estado ? proyectarPaso(estado) : null;
}

/**
 * `RECOMMENDED → ACTIVE` por el CTA del estudiante (`CTA-011`).
 *
 * Activar produce `ACTIVE` y **nada más**: ni Action, ni Commitment, ni
 * Evidence, ni progreso, ni readiness (`product.md` §5.4).
 */
export function activarPreparacion(
  institutionId: string,
  preparacionId: string,
  actorId: string | null = null,
): Promise<ResultadoDeActivacion> {
  return activarPuro(
    { repo: preparacionesReal, eventos: eventosReal },
    institutionId,
    preparacionId,
    actorId,
  );
}

/**
 * Agrega una vuelta a un paso del protocolo.
 *
 * **Puede ocurrir varias veces sobre el mismo paso y el mismo tema** cuando el
 * contenido lo declara reentrante (`HUMAN-P0-01 v1.0`, ADR-028). Repetir no es
 * retroceder y ninguna superficie lo presenta como incumplimiento.
 */
export function completarPasoDeProtocolo(
  entrada: PasoCompletado,
): Promise<ResultadoDeCompletion> {
  return completarPasoPuro({ repo: preparacionesReal, eventos: eventosReal }, entrada);
}

// ── Fase B6 · Riesgo e intervención ──────────────────────────────────────────
//
// **El directorio de operadores es un puerto sin implementación real**, y es lo
// único de esta fase que espera al contrato v2 del CTO (`C01-039`). Cuando
// exista, se cambia `directorioNoDisponible` por el cliente del CRM **acá y en
// ningún otro lado**, que es para lo que este archivo existe.

const riesgo = { repo: senalesReal, eventos: eventosReal, auditor: auditorReal };
const intervenciones = {
  repo: intervencionesReal,
  eventos: eventosReal,
  auditor: auditorReal,
  operadores: directorioNoDisponible,
};

/**
 * Registra una señal de riesgo **que su owner ya produjo**.
 *
 * ⚠️ **Esto no decide que un estudiante está en riesgo.** No existe función que
 * mire el mundo y produzca señales: `C01-021` sigue `OPEN`, y las tres
 * situaciones de `HUMAN-P0-06 v1.0` están cargadas como configuración **con sus
 * umbrales sin fijar** (`C01-036`, y los fija la psicopedagoga). Mismo reparto
 * que con el progreso en la B3.
 */
export function registrarSenalDeRiesgo(entrada: SenalDetectada): Promise<ResultadoDeSenal> {
  return registrarSenalPuro(riesgo, entrada);
}

/**
 * Mueve una señal de estado.
 *
 * Dos destinos quedan fuera: `RESOLVED`, que tiene su propia función porque
 * tiene condición, y `ACKNOWLEDGED`, que quedó **legacy** con
 * [ADR-034](../../docs/decisions.md#adr-034) — ningún escritor nuevo entra ahí.
 */
export function transicionarSenal(
  institutionId: string,
  id: string,
  hacia: Exclude<
    import("@/lib/domain/types").RiskSignalStatus,
    "RESOLVED" | "ACKNOWLEDGED"
  >,
  actorId: string | null = null,
) {
  return transicionarSenalPuro(riesgo, institutionId, id, hacia, actorId);
}

/** `RESOLVED`, **sólo si hubo una intervención con outcome**. */
export function resolverSenal(
  institutionId: string,
  id: string,
  actorId: string | null = null,
): Promise<ResultadoDeResolucion> {
  return resolverSenalPuro(riesgo, institutionId, id, actorId);
}

/**
 * Abre una intervención con dueño.
 *
 * Hoy el dueño **no se puede verificar**: no hay directorio de operadores. La
 * intervención se abre igual y queda marcada `ownerVerified: false`, y
 * `circuito_de_senales()` lo cuenta y nombra el bloqueo (`C01-039`).
 */
export function abrirIntervencion(
  entrada: AperturaDeIntervencion,
): Promise<ResultadoDeApertura> {
  return abrirIntervencionPuro(intervenciones, entrada);
}

/** `open → acknowledged`: el momento en que una persona se hace cargo. */
export function reconocerIntervencion(institutionId: string, id: string, actorId: string) {
  return reconocerIntervencionPuro(intervenciones, institutionId, id, actorId);
}

/** `acknowledged → closed`, **con su outcome, en una sola escritura**. */
export function cerrarIntervencion(
  entrada: CierreDeIntervencion,
): Promise<ResultadoDeCierre> {
  return cerrarIntervencionPuro(intervenciones, entrada);
}
