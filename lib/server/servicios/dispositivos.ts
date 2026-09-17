import type { RepositorioDeCuentaDeAuth } from "../repositorios/cuenta-de-auth";
import type { Ubicacion } from "../repositorios/geolocalizacion";

/**
 * «Dispositivos activos» — [ADR-097 · Enmienda 2](../../../docs/decisions.md#adr-097-enmienda-2).
 *
 * Una fila por sesión de Auth abierta. **No es un dato del dominio**: no lo lee
 * ninguna superficie ni ninguna regla, sólo el modal de la cuenta.
 */
export interface Dispositivo {
  id: string;
  /** `Macintosh`, `Windows`… `null` ⇒ el agente no lo dice, y no se adivina. */
  sistema: string | null;
  /** `Safari 26.6.2`, `Chrome 143.0.0.0`, o el producto crudo si no es un navegador. */
  navegador: string | null;
  ip: string | null;
  ciudad: string | null;
  pais: string | null;
  ultimoUso: string;
  esEste: boolean;
  movil: boolean;
}

const SISTEMAS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Macintosh|Mac OS X/, "Macintosh"],
  [/Windows/, "Windows"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

/** El orden importa: Edge y Opera dicen «Chrome», y Chrome dice «Safari». */
const NAVEGADORES: [RegExp, string][] = [
  [/Edg\/([\d.]+)/, "Edge"],
  [/OPR\/([\d.]+)/, "Opera"],
  [/Firefox\/([\d.]+)/, "Firefox"],
  [/HeadlessChrome\/([\d.]+)/, "Chrome sin interfaz"],
  [/Chrome\/([\d.]+)/, "Chrome"],
  [/Version\/([\d.]+).*Safari/, "Safari"],
];

export function describirAgente(ua: string | null): Pick<Dispositivo, "sistema" | "navegador" | "movil"> {
  if (!ua) return { sistema: null, navegador: null, movil: false };
  const sistema = SISTEMAS.find(([re]) => re.test(ua))?.[1] ?? null;
  const movil = /Mobile|iPhone|Android/.test(ua);
  for (const [re, nombre] of NAVEGADORES) {
    const m = re.exec(ua);
    if (m) return { sistema, navegador: `${nombre} ${m[1]}`, movil };
  }
  // Un script (`curl/8.7.1`, `node`) también abre sesión: se nombra tal cual.
  const producto = ua.split(" ")[0]?.replace("/", " ") ?? null;
  return { sistema, navegador: producto, movil };
}

export async function dispositivos(
  deps: {
    cuenta: RepositorioDeCuentaDeAuth;
    ubicacion: (ip: string) => Promise<Ubicacion | null>;
  },
  authUserId: string,
  sesionActual: string | null,
): Promise<Dispositivo[]> {
  const sesiones = await deps.cuenta.sesiones(authUserId);
  const filas = await Promise.all(
    sesiones.map(async (s): Promise<Dispositivo> => {
      const donde = s.ip ? await deps.ubicacion(s.ip) : null;
      return {
        id: s.id,
        ...describirAgente(s.userAgent),
        ip: s.ip,
        ciudad: donde?.ciudad ?? null,
        pais: donde?.pais ?? null,
        ultimoUso: s.ultimoUso,
        esEste: s.id === sesionActual,
      };
    }),
  );
  // Este dispositivo primero; el resto, del uso más reciente al más viejo.
  return filas.sort((a, b) => Number(b.esEste) - Number(a.esEste) || b.ultimoUso.localeCompare(a.ultimoUso));
}
