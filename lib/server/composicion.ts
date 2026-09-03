import "server-only";

import { estudiantesReal } from "./repositorios/estudiante";
import { identidadReal } from "./repositorios/identidad";
import { eventosReal } from "./repositorios/eventos";
import { ingestaReal } from "./repositorios/ingesta";
import { compromisosReal } from "./repositorios/compromiso";
import { accionesReal } from "./repositorios/accion";
import {
  contextoDeEvidencia,
  entregaReal,
  evidenciaDeCompromiso,
  evidenciasReal,
} from "./repositorios/evidencia";
import {
  validarEvidencia as validarEvidenciaPuro,
  type ResultadoDeValidacion,
  type ValidacionEntrante,
} from "./servicios/validacion";
import { claveDeObjeto, urlFirmadaParaSubir } from "./repositorios/almacenamiento";
import {
  entregarEvidencia as entregarEvidenciaPuro,
  type EntregaDeEvidencia,
  type ResultadoDeEntrega,
} from "./servicios/evidencia";
import { transicionar as transicionarAccion } from "./servicios/accion";
import {
  confirmarCompromiso as confirmarCompromisoPuro,
  transicionar as transicionarCompromiso,
  type ConfirmacionDeCompromiso,
  type ResultadoDeConfirmacion,
} from "./servicios/compromiso";
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
  observarError as observarErrorPuro,
  corregirClasificacion as corregirClasificacionPuro,
  registrarNecesidadDeApoyo as registrarNecesidadDeApoyoPuro,
  registrarDisparadorTemprano as registrarDisparadorTempranoPuro,
  type ErrorObservado,
  type CorreccionDeClasificacion,
  type NecesidadDeApoyo,
  type DisparadorTemprano,
} from "./servicios/reiteracion";
import { reiteracionReal } from "./repositorios/reiteracion";
import {
  corroborarProcedencia as corroborarProcedenciaPuro,
  type Corroboracion,
} from "./servicios/corroboracion";
import { corroboracionReal } from "./repositorios/corroboracion";
// ⚠️ **Cola SINTÉTICA, no el CRM** (B6.6.3). El día que exista el adaptador del
// flujo A del contrato, se cambia `colaSintetica` por él **acá y en ningún otro
// lado**: el dominio no sabe adónde va el caso.
import { colaSintetica, colaPendiente } from "./repositorios/escalamiento";
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
  proponerReentrada as proponerReentradaPuro,
  replanificar as replanificarPuro,
  responderReentrada as responderReentradaPuro,
  type PasoCompletado,
  type PropuestaDeReentrada,
  type Replanificacion,
  type RespuestaDeReentrada,
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
 * Confirma el primer compromiso de una `Action` — el paso 5 del recorrido.
 *
 * ## Por qué la `Action` se mueve acá y no en el Service del compromiso
 *
 * Son dos entidades con su propio lifecycle, y `RECOMMENDED → ACCEPTED →
 * COMMITTED` no se puede saltar: la máquina de `Action` no admite el atajo. El
 * orden importa y es el que fijó el CTO — **`ACCEPTED → COMMITTED` ocurre
 * únicamente cuando el `Commitment` fue creado correctamente**—, así que las
 * dos transiciones van **después** de que la fila existe. Si alguna fallara, un
 * reintento con la misma clave resuelve por idempotencia y vuelve a intentarlas.
 *
 * **Ningún `GET` llega hasta acá.** `RECOMMENDED → ACCEPTED` no lo dispara
 * abrir la pantalla: lo dispara este `POST`, que es la intención explícita.
 */
export async function confirmarCompromiso(
  institutionId: string,
  datos: ConfirmacionDeCompromiso,
): Promise<ResultadoDeConfirmacion> {
  const resultado = await confirmarCompromisoPuro(
    { repo: compromisosReal, eventos: eventosReal },
    institutionId,
    datos,
  );

  if (resultado.estado !== "OK" || resultado.duplicado) return resultado;

  const deps = { repo: accionesReal, eventos: eventosReal };
  // Idempotentes por construcción: `transicionar` compara y falla sin efecto si
  // el estado ya no es el esperado, que es justo lo que pasa en un reintento.
  await transicionarAccion(deps, institutionId, datos.actionId, "ACCEPTED", {}, datos.estudianteId);
  await transicionarAccion(deps, institutionId, datos.actionId, "COMMITTED", {}, datos.estudianteId);

  return resultado;
}

/**
 * El compromiso vigente del estudiante, sólo su identidad y su estado.
 *
 * `UX05` necesita saber **a qué compromiso** adjunta la entrega, y eso no viaja
 * en `EvidenciaProps` porque la pantalla no lo muestra. Sale de la misma
 * lectura que ya proyecta `UX04`: no hay consulta nueva.
 */
export async function compromisoVigenteDe(
  institutionId: string,
  studentId: string,
  ahora: string = new Date().toISOString(),
): Promise<{ compromisoId: string; state: string } | null> {
  const estado = await compromisoLecturaReal.estadoDeCompromiso(institutionId, studentId, ahora, null);
  return estado ? { compromisoId: estado.compromisoId, state: estado.state } : null;
}

/**
 * La entrega **esperada** de un compromiso que todavía no tiene evidencia.
 *
 * Es la contraparte de `propuestaDeCompromiso`, y por la misma razón: D3·A dice
 * que la fila nace `SUBMITTED` cuando el archivo ya subió, así que antes de eso
 * no hay nada que proyectar — y sin esto `UX05` mostraba **la evidencia de otra
 * acción**, que es peor que no mostrar nada.
 *
 * `EXPECTED` acá es estado de vista, no una fila. `null` ⇒ no hay compromiso
 * vivo, o ese compromiso ya tiene su entrega y manda la proyección real.
 */
export async function entregaEsperadaDe(
  institutionId: string,
  studentId: string,
  ahora: string = new Date().toISOString(),
): Promise<{ props: EvidenciaProps; compromisoId: string } | null> {
  // Se parte de la **acción vigente**, no del último compromiso del estudiante:
  // después de una vuelta cerrada, ese último es el `COMPLETED` de la anterior.
  const accion = await accionLecturaReal.estadoDeAccion(institutionId, studentId, ahora, null);
  if (!accion) return null;

  const vivo = await compromisosReal.vivoDeAccion(institutionId, accion.accionId);
  if (!vivo) return null;
  if (await evidenciaDeCompromiso(institutionId, vivo.id)) return null;
  const vigente = { compromisoId: vivo.id };

  return {
    compromisoId: vigente.compromisoId,
    props: {
      estado: "EXPECTED",
      contexto: `Cursado · ${accion.materia}`,
      titulo: accion.objetivo,
      unidad: accion.unidad,
      evidenciaEsperada: accion.evidenciaEsperada,
      criterioCierre: accion.criterioCierre,
      // Qué formatos acepta una Action es `C01-008`, gate `H`. Sin contrato,
      // la línea desaparece: omitir, no inventar.
      formatosPermitidos: null,
      nombreAdjuntoDemo: "practica.pdf",
      estadoVisible: "Todavía no entregaste esta evidencia",
      aviso: null,
      // El requisito de Reflection vive en la Action y lo proyecta la lectura
      // real; acá todavía no hay Evidence de la cual colgarlo.
      reflection: null,
      ctaPrimaria: { texto: "Enviar evidencia", habilitada: true },
      adjuntoPrevio: null,
    },
  };
}

/**
 * Reserva el id de una evidencia y firma su subida — **no escribe ninguna fila**.
 *
 * La clave del objeto se deriva de la institución y de este id, nunca de lo que
 * proponga el cliente: si el cliente eligiera la ruta podría pedir una firma
 * para la carpeta de otra institución. El id se emite acá por eso, y la fila
 * recién se crea cuando la subida cerró (D3·A).
 */
export async function firmarSubidaDeEvidencia(
  institutionId: string,
  nombre: string,
): Promise<{ evidenciaId: string; clave: string; url: string; token: string }> {
  const evidenciaId = crypto.randomUUID();
  const clave = claveDeObjeto(institutionId, evidenciaId, nombre);
  const { url, token } = await urlFirmadaParaSubir(clave);
  return { evidenciaId, clave, url, token };
}

/** Registra la entrega una vez que el archivo está arriba (D3·A). */
export function entregarEvidencia(
  institutionId: string,
  datos: EntregaDeEvidencia,
): Promise<ResultadoDeEntrega> {
  return entregarEvidenciaPuro({ repo: entregaReal, eventos: eventosReal }, institutionId, datos);
}

/**
 * Valida una evidencia y **registra el progreso como paso aparte** (D4·A, D5·A).
 *
 * Ninguna ruta de `Evidence` llega hasta acá: el progreso no se infiere de que
 * la evidencia haya quedado `VALIDATED`, lo registra este orquestador porque
 * alguien decidió validarla.
 */
export function validarEvidencia(entrada: ValidacionEntrante): Promise<ResultadoDeValidacion> {
  return validarEvidenciaPuro(
    {
      evidencias: evidenciasReal,
      eventos: eventosReal,
      contextoDeEvidencia,
      registrarProgreso,
      completarAccion,
    },
    entrada,
  );
}

/**
 * Lleva una `Action` a `COMPLETED` **recorriendo su máquina**, sin saltos.
 *
 * `COMMITTED → IN_PROGRESS → EVIDENCE_PENDING → COMPLETED`: los tres escalones
 * existen y cada uno publica su hecho. Saltarlos con un `update` directo
 * ahorraría dos escrituras y perdería el rastro de por dónde pasó la acción,
 * que es lo que la Bitácora proyecta.
 *
 * **Idempotente**: `transicionar` hace compare-and-swap, así que un escalón ya
 * recorrido no vuelve a escribir ni a publicar. Devuelve si la acción quedó
 * `COMPLETED`, la haya completado esta corrida o una anterior.
 */
const CAMINO_AL_CIERRE = ["IN_PROGRESS", "EVIDENCE_PENDING", "COMPLETED"] as const;
const CIERRE_DEL_COMPROMISO = ["STARTED", "COMPLETED"] as const;

export async function completarAccion(
  institutionId: string,
  actionId: string,
  commitmentId: string,
  actorId: string | null,
): Promise<boolean> {
  /*
    El compromiso primero, y **no es un detalle**: un `CONFIRMED` que nadie
    cierra lo levanta el reloj y lo pasa a `MISSED` cuando vence su hora — un
    incumplimiento falso sobre trabajo que se hizo y se validó. Cerrarlo es lo
    que hace que el hecho quede como lo que fue.

    El original no se edita para parecer otra cosa: recorre su propia máquina,
    `CONFIRMED → STARTED → COMPLETED`, y cada escalón publica su hecho.
  */
  const compromisos = { repo: compromisosReal, eventos: eventosReal };
  for (const hacia of CIERRE_DEL_COMPROMISO) {
    await transicionarCompromiso(compromisos, institutionId, commitmentId, hacia, actorId);
  }

  const acciones = { repo: accionesReal, eventos: eventosReal };
  for (const hacia of CAMINO_AL_CIERRE) {
    await transicionarAccion(acciones, institutionId, actionId, hacia, {}, actorId);
  }

  const final = await accionesReal.porId(institutionId, actionId);
  return final?.state === "COMPLETED";
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
 * La **propuesta** de compromiso para una `Action` que todavía no tiene ninguno.
 *
 * ## Por qué existe, y qué no es
 *
 * D1·A dice que la fila nace en `CONFIRMED` y que antes no hay nada
 * persistido. Pero `UX04` tiene que mostrar *algo* para que el estudiante
 * confirme, así que esto **proyecta una propuesta sin escribirla**: mismo
 * `CompromisoProps` que la pantalla ya sabe dibujar, `estado: "DRAFT"` como
 * estado de vista, y ni una fila en la base.
 *
 * ⚠️ **`PROVISIONAL — REVISAR ANTES DE INCORPORAR ESTUDIANTES REALES`.** El
 * instante propuesto —la próxima media hora en punto en la zona de la
 * institución— es un **default ratificado provisionalmente por el CTO para el
 * MVP sintético**, no una regla de negocio. Elegir el momento es parte de
 * `C01-010`, que sigue `OPEN`.
 *
 * **Es reversible sin migrar nada:** lo que se persiste es el instante que el
 * estudiante confirmó, no la regla que lo propuso. Cambiar el default no toca
 * ninguna fila existente, porque ninguna depende de él.
 */
export async function propuestaDeCompromiso(
  institutionId: string,
  studentId: string,
  ahora: string = new Date().toISOString(),
): Promise<{ props: CompromisoProps; actionId: string; startAt: string; timezone: string; plannedMinutes: number } | null> {
  const estado = await accionLecturaReal.estadoDeAccion(institutionId, studentId, ahora, null);
  if (!estado || estado.compromisoVivo) return null;

  const zona = estado.zona;
  const inicio = new Date(ahora);
  inicio.setSeconds(0, 0);
  inicio.setMinutes(inicio.getMinutes() > 30 ? 60 : 30);
  const startAt = inicio.toISOString();
  const minutos = estado.minutosMax ?? estado.minutosMin ?? 45;

  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-AR", { ...o, timeZone: zona }).format(inicio).replace(/[.,]/g, "");

  return {
    actionId: estado.accionId,
    startAt,
    timezone: zona,
    plannedMinutes: minutos,
    props: {
      estado: "DRAFT",
      contexto: `${estado.materia}${estado.unidad ? ` · ${estado.unidad}` : ""}`,
      titulo: estado.objetivo,
      fecha: fmt({ weekday: "short", day: "numeric", month: "short" }),
      hora: fmt({ hour: "2-digit", minute: "2-digit", hour12: false }),
      tiempoDeclarado: `${minutos} min`,
      notaEstimacion: `Zona horaria: ${zona}.`,
      evidenciaEsperada: estado.evidenciaEsperada,
      criterioCierre: estado.criterioCierre,
      estadoResultante: { tono: "exito", texto: "Confirmado" },
      aviso: null,
      original: null,
      ctaPrimaria: { texto: "Me comprometo", habilitada: true },
    },
  };
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

/** Crea una versión del plan dentro de la misma preparación. */
export function replanificarPreparacion(entrada: Replanificacion) {
  return replanificarPuro({ repo: preparacionesReal, eventos: eventosReal }, entrada);
}

/** Registra la explicación previa; no mueve el paso. */
export function proponerReentradaDeProtocolo(entrada: PropuestaDeReentrada) {
  return proponerReentradaPuro({ repo: preparacionesReal, eventos: eventosReal }, entrada);
}

/** La aceptación mueve el puntero; pedir otra opción lo conserva. */
export function responderReentradaDeProtocolo(entrada: RespuestaDeReentrada) {
  return responderReentradaPuro({ repo: preparacionesReal, eventos: eventosReal }, entrada);
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
  return transicionarSenalPuro({ ...riesgo, destino: colaSintetica }, institutionId, id, hacia, actorId);
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

/**
 * Registra un error observado y evalúa la regla provisional de `C01-021`
 * ([ADR-036](../../docs/decisions.md#adr-036)).
 *
 * ⚠️ **PROVISIONAL — REQUIRES POST-MVP HUMAN VALIDATION.** El umbral es una
 * decisión del Product Owner sobre datos sintéticos, sin validación
 * psicopedagógica.
 */
export function observarErrorDeEstudiante(entrada: ErrorObservado) {
  return observarErrorPuro(
    {
      repo: reiteracionReal,
      senales: senalesReal,
      eventos: eventosReal,
      auditor: auditorReal,
      destino: colaSintetica,
    },
    entrada,
  );
}

/**
 * Corrige la clasificación de una observación y re-evalúa las dos familias
 * afectadas — B6.7.1, `9.5` ([ADR-037](../../docs/decisions.md#adr-037)).
 *
 * ⚠️ **Quién puede corregir no está definido.** Es una de las cosas que la
 * psicopedagoga puso entre lo que hay que evaluar antes de un piloto.
 */
export function corregirClasificacionDeError(entrada: CorreccionDeClasificacion) {
  return corregirClasificacionPuro(
    {
      repo: reiteracionReal,
      senales: senalesReal,
      eventos: eventosReal,
      auditor: auditorReal,
      destino: colaSintetica,
    },
    entrada,
  );
}

/**
 * Registra una **necesidad de apoyo para avanzar** — B6.7.1, `9.5`.
 *
 * **Sólo recibe el repositorio.** Ni señales, ni escalamiento: registrar que
 * alguien necesitó ayuda no puede acercarlo a una escalada, y la firma no tiene
 * por dónde hacerlo.
 */
export function registrarNecesidadDeApoyoDeEstudiante(entrada: NecesidadDeApoyo) {
  return registrarNecesidadDeApoyoPuro({ repo: reiteracionReal }, entrada);
}

export function registrarDisparadorTempranoDeEstudiante(entrada: DisparadorTemprano) {
  return registrarDisparadorTempranoPuro(
    {
      repo: reiteracionReal,
      senales: senalesReal,
      eventos: eventosReal,
      auditor: auditorReal,
      destino: colaSintetica,
    },
    entrada,
  );
}

/**
 * Los casos pendientes de la cola **sintética** — sólo demostración (B6.6.3).
 *
 * ⚠️ No es el CRM. Cuando llegue el adaptador del flujo A, esto se borra.
 */
export function colaPendienteDeDemo(institutionId: string) {
  return colaPendiente(institutionId);
}

/**
 * Corrobora la procedencia de una fila del ADL — Etapa B2b.2, invariante `I9`.
 *
 * Es **la única operación del sistema que mueve un `verification_status`**.
 *
 * ⚠️ **Quién puede corroborar no está definido** (`C01-030`, `OPEN`), así que
 * `corroboradoPor` es una identidad externa que no se valida contra nada.
 */
export function corroborarProcedenciaDelADL(entrada: Corroboracion) {
  return corroborarProcedenciaPuro(
    { repo: corroboracionReal, auditor: auditorReal },
    entrada,
  );
}
