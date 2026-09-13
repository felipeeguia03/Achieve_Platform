/**
 * Service de lo que el estudiante **guarda de su clase** —
 * [ADR-099](../../../docs/decisions.md#adr-099): apuntes por entrada, material
 * (archivos y links), grabaciones de audio y sus etiquetas.
 *
 * ## Lo que este Service NO hace, y cada ausencia es la decisión
 *
 * - **No crea `Evidence`, progreso, `Action`s ni eventos.** Es material propio.
 * - **No transcribe ni interpreta audio.** ADR-080 sigue candidato.
 * - **No empieza a grabar.** Firma una subida que el estudiante pidió.
 * - **No confía en lo que declara el cliente sobre un archivo**: el tamaño y el
 *   tipo que se guardan son los que dice el storage.
 *
 * ⚠️ **Lo ajeno no existe.** Cada lectura va scoped por estudiante; una clase,
 * una entrada o una grabación de otro devuelven `NO_ENCONTRADA`, y la ruta `404`.
 */
import {
  DURACION_MAXIMA_DE_GRABACION,
  esLinkValido,
  esTipoDeAudio,
  esTipoDeMaterial,
  MAXIMO_DE_ARCHIVO,
  MAXIMO_DE_AUDIO,
  MAXIMO_DE_ENTRADA,
  MAXIMO_DE_ETIQUETA,
  MAXIMO_DE_TITULO,
  segundosEntre,
} from "@/lib/domain/sesion-de-clase";
import type { ClaseFila, RepositorioDeClases } from "./clase";

export type BucketDeClase = "clase-audio" | "clase-material";

export interface AlmacenDeClase {
  firmarSubida(bucket: BucketDeClase, clave: string): Promise<{ url: string; token: string }>;
  /** `descarga` ⇒ el navegador lo baja con ese nombre en vez de abrirlo. */
  firmarLectura(bucket: BucketDeClase, clave: string, descarga?: string): Promise<string>;
  /** `null` ⇒ el objeto no está: la subida no ocurrió. */
  objeto(bucket: BucketDeClase, clave: string): Promise<{ bytes: number; mime: string | null } | null>;
  borrar(bucket: BucketDeClase, clave: string): Promise<void>;
}

export interface ApunteFila {
  id: string;
  claseId: string;
  texto: string;
  segundos: number | null;
  clave: string;
  creadoEn: string;
  editadoEn: string | null;
}

export interface MaterialFila {
  id: string;
  claseId: string;
  tipo: "ARCHIVO" | "LINK";
  titulo: string;
  clave: string | null;
  url: string | null;
  mime: string | null;
  bytes: number | null;
  creadoEn: string;
}

export interface EtiquetaFila {
  id: string;
  grabacionId: string;
  texto: string;
  segundo: number | null;
  creadaEn: string;
}

export interface GrabacionFila {
  id: string;
  claseId: string;
  clave: string;
  mime: string;
  bytes: number;
  duracion: number;
  inicioEnClase: number;
  idempotencia: string;
  creadaEn: string;
}

export interface RepositorioDeMaterialDeClase {
  apuntesDe(institutionId: string, claseId: string): Promise<ApunteFila[]>;
  apuntePorClave(institutionId: string, claseId: string, clave: string): Promise<ApunteFila | null>;
  /** `null` ⇒ la base rechazó la clave: otro pedido la ganó. */
  crearApunte(
    institutionId: string,
    datos: { claseId: string; texto: string; segundos: number | null; clave: string },
  ): Promise<ApunteFila | null>;
  apunteDelEstudiante(institutionId: string, studentId: string, apunteId: string): Promise<ApunteFila | null>;
  editarApunte(institutionId: string, apunteId: string, texto: string, ahora: string): Promise<ApunteFila>;
  borrarApunte(institutionId: string, apunteId: string): Promise<void>;

  materialDe(institutionId: string, claseId: string): Promise<MaterialFila[]>;
  materialPorClave(institutionId: string, clave: string): Promise<MaterialFila | null>;
  crearMaterial(
    institutionId: string,
    datos: Omit<MaterialFila, "id" | "creadoEn">,
  ): Promise<MaterialFila | null>;
  materialDelEstudiante(institutionId: string, studentId: string, materialId: string): Promise<MaterialFila | null>;
  borrarMaterial(institutionId: string, materialId: string): Promise<void>;

  grabacionesDe(institutionId: string, claseId: string): Promise<Array<GrabacionFila & { etiquetas: EtiquetaFila[] }>>;
  grabacionPorClave(institutionId: string, claseId: string, idempotencia: string): Promise<GrabacionFila | null>;
  /** `null` ⇒ la base rechazó la clave de idempotencia: otro pedido la ganó. */
  crearGrabacion(
    institutionId: string,
    datos: Omit<GrabacionFila, "id" | "creadaEn">,
    etiquetas: ReadonlyArray<{ texto: string; segundo: number | null }>,
  ): Promise<GrabacionFila | null>;
  grabacionDelEstudiante(institutionId: string, studentId: string, grabacionId: string): Promise<GrabacionFila | null>;
  borrarGrabacion(institutionId: string, grabacionId: string): Promise<void>;
  crearEtiqueta(
    institutionId: string,
    datos: { grabacionId: string; texto: string; segundo: number | null },
  ): Promise<EtiquetaFila>;
  etiquetaDelEstudiante(institutionId: string, studentId: string, etiquetaId: string): Promise<EtiquetaFila | null>;
  borrarEtiqueta(institutionId: string, etiquetaId: string): Promise<void>;
}

export interface DependenciasDeMaterial {
  repo: RepositorioDeMaterialDeClase;
  clases: Pick<RepositorioDeClases, "delEstudiante">;
  almacen: AlmacenDeClase;
  ahora: () => string;
  nuevoId: () => string;
}

type NoEncontrada = { estado: "NO_ENCONTRADA" };
const NO_ENCONTRADA: NoEncontrada = { estado: "NO_ENCONTRADA" };

// ── Claves de objeto ─────────────────────────────────────────────────────────

/**
 * La clave **la deriva el servidor**, con la institución y la clase adentro. Si
 * el cliente propusiera la ruta, podría escribir en la carpeta de otro con sólo
 * pedir una firma para esa ruta (el mismo criterio que `evidencia`).
 */
export function claveDeClase(institutionId: string, claseId: string, id: string, nombre: string): string {
  const limpio = nombre.replace(/[^\w.-]/g, "_").replace(/\.{2,}/g, ".").slice(-80) || "archivo";
  return `${institutionId}/${claseId}/${id}/${limpio}`;
}

/** ¿Esta clave es de esta clase? Una clave con `..` o con otra carpeta, no. */
export function claveEsDeLaClase(clave: unknown, institutionId: string, claseId: string): clave is string {
  if (typeof clave !== "string" || clave.includes("..")) return false;
  const partes = clave.split("/");
  return partes.length === 4 && partes[0] === institutionId && partes[1] === claseId && partes[3] !== "";
}

const EXTENSION_DE_AUDIO: Record<string, string> = { webm: "webm", ogg: "ogg", mp4: "m4a", mpeg: "mp3", aac: "aac", wav: "wav" };
function nombreDeGrabacion(mime: string): string {
  const sub = /^audio\/([a-z0-9]+)/i.exec(mime)?.[1]?.toLowerCase() ?? "webm";
  return `grabacion.${EXTENSION_DE_AUDIO[sub] ?? "webm"}`;
}

async function claseDelEstudiante(d: DependenciasDeMaterial, institutionId: string, studentId: string, claseId: string) {
  return d.clases.delEstudiante(institutionId, studentId, claseId);
}

/** El momento de la clase **ahora**. `null` si la clase terminó: no se inventa. */
function momentoDeLaClase(clase: ClaseFila, ahora: string): number | null {
  return clase.estado === "ACTIVE" ? segundosEntre(clase.iniciadaEn, ahora) : null;
}

// ── Apuntes ──────────────────────────────────────────────────────────────────

export type ResultadoDeApunte =
  | { estado: "OK"; apunte: ApunteFila; duplicado: boolean }
  | NoEncontrada
  | { estado: "VACIO" }
  | { estado: "DEMASIADO_LARGO" }
  | { estado: "SIN_CLAVE" };

/**
 * Enter guarda una entrada (ADR-099 §4). **También con la clase terminada**: los
 * apuntes son material del estudiante. La idempotencia va antes que todo lo
 * demás: el segundo Enter del mismo texto no crea otra.
 */
export async function anotar(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; claseId: string; texto: string; clave: string },
): Promise<ResultadoDeApunte> {
  const texto = pedido.texto.trim();
  if (!pedido.clave.trim()) return { estado: "SIN_CLAVE" };
  if (!texto) return { estado: "VACIO" };
  if (texto.length > MAXIMO_DE_ENTRADA) return { estado: "DEMASIADO_LARGO" };

  const clase = await claseDelEstudiante(d, institutionId, pedido.studentId, pedido.claseId);
  if (!clase) return NO_ENCONTRADA;

  const previa = await d.repo.apuntePorClave(institutionId, clase.id, pedido.clave);
  if (previa) return { estado: "OK", apunte: previa, duplicado: true };

  const creado = await d.repo.crearApunte(institutionId, {
    claseId: clase.id,
    texto,
    segundos: momentoDeLaClase(clase, d.ahora()),
    clave: pedido.clave,
  });
  if (!creado) {
    const ganador = await d.repo.apuntePorClave(institutionId, clase.id, pedido.clave);
    if (!ganador) throw new Error("La base rechazó el apunte y no hay ninguno con esa clave");
    return { estado: "OK", apunte: ganador, duplicado: true };
  }
  return { estado: "OK", apunte: creado, duplicado: false };
}

export async function editarApunte(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; apunteId: string; texto: string },
): Promise<Exclude<ResultadoDeApunte, { estado: "SIN_CLAVE" }>> {
  const texto = pedido.texto.trim();
  if (!texto) return { estado: "VACIO" };
  if (texto.length > MAXIMO_DE_ENTRADA) return { estado: "DEMASIADO_LARGO" };
  const apunte = await d.repo.apunteDelEstudiante(institutionId, pedido.studentId, pedido.apunteId);
  if (!apunte) return NO_ENCONTRADA;
  return { estado: "OK", apunte: await d.repo.editarApunte(institutionId, apunte.id, texto, d.ahora()), duplicado: false };
}

export async function borrarApunte(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; apunteId: string },
): Promise<{ estado: "OK" } | NoEncontrada> {
  const apunte = await d.repo.apunteDelEstudiante(institutionId, pedido.studentId, pedido.apunteId);
  if (!apunte) return NO_ENCONTRADA;
  await d.repo.borrarApunte(institutionId, apunte.id);
  return { estado: "OK" };
}

// ── Material ─────────────────────────────────────────────────────────────────

export type ResultadoDeFirma =
  | { estado: "OK"; clave: string; url: string; token: string }
  | NoEncontrada
  | { estado: "TIPO_NO_ADMITIDO" }
  | { estado: "DEMASIADO_GRANDE" }
  | { estado: "CLASE_TERMINADA" };

/** Firma la subida de un archivo de la clase. Lo declarado se vuelve a mirar al registrar. */
export async function firmarMaterial(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; claseId: string; nombre: string; mime: unknown; bytes: unknown },
): Promise<ResultadoDeFirma> {
  if (!esTipoDeMaterial(pedido.mime)) return { estado: "TIPO_NO_ADMITIDO" };
  if (typeof pedido.bytes !== "number" || pedido.bytes <= 0 || pedido.bytes > MAXIMO_DE_ARCHIVO) {
    return { estado: "DEMASIADO_GRANDE" };
  }
  const clase = await claseDelEstudiante(d, institutionId, pedido.studentId, pedido.claseId);
  if (!clase) return NO_ENCONTRADA;
  const clave = claveDeClase(institutionId, clase.id, d.nuevoId(), pedido.nombre);
  return { estado: "OK", clave, ...(await d.almacen.firmarSubida("clase-material", clave)) };
}

export type ResultadoDeMaterial =
  | { estado: "OK"; material: MaterialFila; duplicado: boolean }
  | NoEncontrada
  | { estado: "CLAVE_AJENA" }
  | { estado: "NO_SUBIDO" }
  | { estado: "TIPO_NO_ADMITIDO" }
  | { estado: "DEMASIADO_GRANDE" }
  | { estado: "LINK_INVALIDO" };

/** Registra un archivo **que ya está arriba**. Idempotente por clave de objeto. */
export async function registrarArchivo(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; claseId: string; clave: unknown; nombre: string },
): Promise<ResultadoDeMaterial> {
  const clase = await claseDelEstudiante(d, institutionId, pedido.studentId, pedido.claseId);
  if (!clase) return NO_ENCONTRADA;
  if (!claveEsDeLaClase(pedido.clave, institutionId, clase.id)) return { estado: "CLAVE_AJENA" };

  const previo = await d.repo.materialPorClave(institutionId, pedido.clave);
  if (previo) return { estado: "OK", material: previo, duplicado: true };

  const objeto = await d.almacen.objeto("clase-material", pedido.clave);
  if (!objeto) return { estado: "NO_SUBIDO" };
  if (!esTipoDeMaterial(objeto.mime)) return { estado: "TIPO_NO_ADMITIDO" };
  if (objeto.bytes <= 0 || objeto.bytes > MAXIMO_DE_ARCHIVO) return { estado: "DEMASIADO_GRANDE" };
  const titulo = pedido.nombre.trim().slice(0, MAXIMO_DE_TITULO) || "Archivo";

  const creado = await d.repo.crearMaterial(institutionId, {
    claseId: clase.id,
    tipo: "ARCHIVO",
    titulo,
    clave: pedido.clave,
    url: null,
    mime: objeto.mime,
    bytes: objeto.bytes,
  });
  if (!creado) {
    const ganador = await d.repo.materialPorClave(institutionId, pedido.clave);
    if (!ganador) throw new Error("La base rechazó el material y no hay ninguno con esa clave");
    return { estado: "OK", material: ganador, duplicado: true };
  }
  return { estado: "OK", material: creado, duplicado: false };
}

export async function registrarLink(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; claseId: string; url: unknown; titulo: string | null },
): Promise<ResultadoDeMaterial> {
  if (!esLinkValido(pedido.url)) return { estado: "LINK_INVALIDO" };
  const titulo = (pedido.titulo?.trim() || new URL(pedido.url).hostname).slice(0, MAXIMO_DE_TITULO);
  const clase = await claseDelEstudiante(d, institutionId, pedido.studentId, pedido.claseId);
  if (!clase) return NO_ENCONTRADA;
  const creado = await d.repo.crearMaterial(institutionId, {
    claseId: clase.id,
    tipo: "LINK",
    titulo,
    clave: null,
    url: pedido.url,
    mime: null,
    bytes: null,
  });
  if (!creado) throw new Error("La base rechazó el link");
  return { estado: "OK", material: creado, duplicado: false };
}

export async function abrirMaterial(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; materialId: string },
): Promise<{ estado: "OK"; url: string } | NoEncontrada> {
  const m = await d.repo.materialDelEstudiante(institutionId, pedido.studentId, pedido.materialId);
  if (!m) return NO_ENCONTRADA;
  if (m.tipo === "LINK") return { estado: "OK", url: m.url as string };
  return { estado: "OK", url: await d.almacen.firmarLectura("clase-material", m.clave as string) };
}

/**
 * Borrar: **el objeto primero, la fila después.** Al revés, una falla dejaría
 * el archivo en el storage sin nada que lo nombre, y el estudiante creería que
 * lo sacó.
 */
export async function borrarMaterial(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; materialId: string },
): Promise<{ estado: "OK" } | NoEncontrada> {
  const m = await d.repo.materialDelEstudiante(institutionId, pedido.studentId, pedido.materialId);
  if (!m) return NO_ENCONTRADA;
  if (m.clave) await d.almacen.borrar("clase-material", m.clave);
  await d.repo.borrarMaterial(institutionId, m.id);
  return { estado: "OK" };
}

// ── Grabaciones ──────────────────────────────────────────────────────────────

/**
 * Firma la subida de una grabación. **Sólo con la clase `ACTIVE`** (ADR-099 §2):
 * se graba la clase que está pasando.
 */
export async function firmarGrabacion(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; claseId: string; mime: unknown; bytes: unknown },
): Promise<ResultadoDeFirma> {
  if (!esTipoDeAudio(pedido.mime)) return { estado: "TIPO_NO_ADMITIDO" };
  if (typeof pedido.bytes !== "number" || pedido.bytes <= 0 || pedido.bytes > MAXIMO_DE_AUDIO) {
    return { estado: "DEMASIADO_GRANDE" };
  }
  const clase = await claseDelEstudiante(d, institutionId, pedido.studentId, pedido.claseId);
  if (!clase) return NO_ENCONTRADA;
  // ⚠️ La firma se pide **al terminar de grabar**, y la pantalla sube la
  // grabación **antes** de finalizar la clase: por eso acá se exige `ACTIVE`
  // sin excepciones. Registrarla después sí puede caer con la clase terminada.
  if (clase.estado !== "ACTIVE") return { estado: "CLASE_TERMINADA" };
  const clave = claveDeClase(institutionId, clase.id, d.nuevoId(), nombreDeGrabacion(pedido.mime as string));
  return { estado: "OK", clave, ...(await d.almacen.firmarSubida("clase-audio", clave)) };
}

export type ResultadoDeGrabacion =
  | { estado: "OK"; grabacion: GrabacionFila; duplicado: boolean }
  | NoEncontrada
  | { estado: "CLAVE_AJENA" }
  | { estado: "NO_SUBIDO" }
  | { estado: "TIPO_NO_ADMITIDO" }
  | { estado: "DEMASIADO_GRANDE" }
  | { estado: "DURACION_INVALIDA" }
  | { estado: "ETIQUETA_INVALIDA" }
  | { estado: "SIN_CLAVE" };

type EtiquetaPedida = { texto: unknown; segundo: unknown };

function etiquetaValida(e: EtiquetaPedida, duracion: number | null): { texto: string; segundo: number | null } | null {
  if (typeof e.texto !== "string") return null;
  const texto = e.texto.trim();
  if (!texto || texto.length > MAXIMO_DE_ETIQUETA) return null;
  if (e.segundo === null || e.segundo === undefined) return { texto, segundo: null };
  if (typeof e.segundo !== "number" || !Number.isFinite(e.segundo) || e.segundo < 0) return null;
  const segundo = Math.floor(e.segundo);
  // Una etiqueta en un segundo que la grabación no tiene no marca nada.
  if (duracion !== null && segundo > duracion) return null;
  return { texto, segundo };
}

/**
 * Registra una grabación **que ya está arriba**, con las etiquetas que se
 * pusieron mientras se grababa. Idempotente por `idempotencia`.
 *
 * El momento de la clase en que empezó lo calcula el servidor: el fin de la
 * grabación (ahora, o el fin de la clase si terminó antes) menos su duración.
 */
export async function registrarGrabacion(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: {
    studentId: string;
    claseId: string;
    clave: unknown;
    idempotencia: string;
    duracion: unknown;
    etiquetas: readonly EtiquetaPedida[];
  },
): Promise<ResultadoDeGrabacion> {
  if (!pedido.idempotencia.trim()) return { estado: "SIN_CLAVE" };
  if (
    typeof pedido.duracion !== "number" ||
    !Number.isFinite(pedido.duracion) ||
    Math.round(pedido.duracion) < 1 ||
    Math.round(pedido.duracion) > DURACION_MAXIMA_DE_GRABACION
  ) {
    return { estado: "DURACION_INVALIDA" };
  }
  const duracion = Math.round(pedido.duracion);
  const etiquetas = pedido.etiquetas.map((e) => etiquetaValida(e, duracion));
  if (etiquetas.some((e) => e === null)) return { estado: "ETIQUETA_INVALIDA" };

  const clase = await claseDelEstudiante(d, institutionId, pedido.studentId, pedido.claseId);
  if (!clase) return NO_ENCONTRADA;

  const previa = await d.repo.grabacionPorClave(institutionId, clase.id, pedido.idempotencia);
  if (previa) return { estado: "OK", grabacion: previa, duplicado: true };

  if (!claveEsDeLaClase(pedido.clave, institutionId, clase.id)) return { estado: "CLAVE_AJENA" };
  const objeto = await d.almacen.objeto("clase-audio", pedido.clave);
  if (!objeto) return { estado: "NO_SUBIDO" };
  if (!esTipoDeAudio(objeto.mime)) return { estado: "TIPO_NO_ADMITIDO" };
  if (objeto.bytes <= 0 || objeto.bytes > MAXIMO_DE_AUDIO) return { estado: "DEMASIADO_GRANDE" };

  const fin = clase.terminadaEn && clase.terminadaEn < d.ahora() ? clase.terminadaEn : d.ahora();
  const creada = await d.repo.crearGrabacion(
    institutionId,
    {
      claseId: clase.id,
      clave: pedido.clave,
      mime: objeto.mime as string,
      bytes: objeto.bytes,
      duracion,
      inicioEnClase: Math.max(0, segundosEntre(clase.iniciadaEn, fin) - duracion),
      idempotencia: pedido.idempotencia,
    },
    etiquetas as Array<{ texto: string; segundo: number | null }>,
  );
  if (!creada) {
    const ganadora = await d.repo.grabacionPorClave(institutionId, clase.id, pedido.idempotencia);
    if (!ganadora) throw new Error("La base rechazó la grabación y no hay ninguna con esa clave");
    return { estado: "OK", grabacion: ganadora, duplicado: true };
  }
  return { estado: "OK", grabacion: creada, duplicado: false };
}

export async function escucharGrabacion(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; grabacionId: string },
): Promise<{ estado: "OK"; url: string } | NoEncontrada> {
  const g = await d.repo.grabacionDelEstudiante(institutionId, pedido.studentId, pedido.grabacionId);
  if (!g) return NO_ENCONTRADA;
  return { estado: "OK", url: await d.almacen.firmarLectura("clase-audio", g.clave) };
}

/** Borrar una grabación: el audio primero, la fila (y sus etiquetas) después. */
export async function borrarGrabacion(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; grabacionId: string },
): Promise<{ estado: "OK" } | NoEncontrada> {
  const g = await d.repo.grabacionDelEstudiante(institutionId, pedido.studentId, pedido.grabacionId);
  if (!g) return NO_ENCONTRADA;
  await d.almacen.borrar("clase-audio", g.clave);
  await d.repo.borrarGrabacion(institutionId, g.id);
  return { estado: "OK" };
}

export async function etiquetar(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; grabacionId: string; texto: unknown; segundo: unknown },
): Promise<{ estado: "OK"; etiqueta: EtiquetaFila } | NoEncontrada | { estado: "ETIQUETA_INVALIDA" }> {
  const g = await d.repo.grabacionDelEstudiante(institutionId, pedido.studentId, pedido.grabacionId);
  if (!g) return NO_ENCONTRADA;
  const valida = etiquetaValida({ texto: pedido.texto, segundo: pedido.segundo }, g.duracion);
  if (!valida) return { estado: "ETIQUETA_INVALIDA" };
  return { estado: "OK", etiqueta: await d.repo.crearEtiqueta(institutionId, { grabacionId: g.id, ...valida }) };
}

export async function borrarEtiqueta(
  d: DependenciasDeMaterial,
  institutionId: string,
  pedido: { studentId: string; etiquetaId: string },
): Promise<{ estado: "OK" } | NoEncontrada> {
  const e = await d.repo.etiquetaDelEstudiante(institutionId, pedido.studentId, pedido.etiquetaId);
  if (!e) return NO_ENCONTRADA;
  await d.repo.borrarEtiqueta(institutionId, e.id);
  return { estado: "OK" };
}
