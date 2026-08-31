import "server-only";

import { estudiantesReal } from "./repositorios/estudiante";
import { identidadReal } from "./repositorios/identidad";
import { eventosReal } from "./repositorios/eventos";
import { ingestaReal } from "./repositorios/ingesta";
import { compromisosReal } from "./repositorios/compromiso";
import { institucionesReal } from "./repositorios/instituciones";
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
