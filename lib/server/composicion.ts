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
import {
  registrarProgreso as registrarProgresoPuro,
  type ResultadoDeProgresoEntrante,
  type ResultadoDelRegistro,
} from "./servicios/progreso";
import type {
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
    { reloj: relojReal, compromisos: compromisosReal, eventos: eventosReal },
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
