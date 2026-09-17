import "server-only";

/**
 * Ciudad y país de una IP, para «Dispositivos activos» —
 * [ADR-097 · Enmienda 2](../../../docs/decisions.md#adr-097-enmienda-2).
 *
 * ⚠️ **Manda la IP a un servicio externo.** El owner lo eligió sabiendo eso. Por
 * eso sólo sale una IP **pública**: las de red local no dicen dónde está nadie y
 * no tienen por qué salir de la máquina.
 *
 * Omitir, no inventar: si el servicio no contesta a tiempo, la línea dice la IP
 * sola.
 */
export interface Ubicacion {
  ciudad: string | null;
  pais: string | null;
}

const SERVICIO = "https://ipapi.co";
const ESPERA_MS = 1500;

/** Una IP no cambia de ciudad entre dos aperturas del modal. */
const cache = new Map<string, Ubicacion | null>();

export function esIpPrivada(ip: string): boolean {
  if (ip === "::1" || ip.startsWith("127.") || ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.") || /^f[cd]/i.test(ip) || /^fe80:/i.test(ip)) return true;
  const m = /^172\.(\d+)\./.exec(ip);
  return m !== null && Number(m[1]) >= 16 && Number(m[1]) <= 31;
}

export async function ubicacionDeIp(ip: string): Promise<Ubicacion | null> {
  if (esIpPrivada(ip)) return null;
  if (cache.has(ip)) return cache.get(ip) ?? null;

  let ubicacion: Ubicacion | null = null;
  try {
    const r = await fetch(`${SERVICIO}/${encodeURIComponent(ip)}/json/`, {
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    if (r.ok) {
      const cuerpo = (await r.json()) as { city?: string; country_name?: string; error?: boolean };
      if (!cuerpo.error) ubicacion = { ciudad: cuerpo.city ?? null, pais: cuerpo.country_name ?? null };
    }
  } catch {
    // Sin red o sin respuesta a tiempo: no se cachea, se reintenta la próxima.
    return null;
  }
  cache.set(ip, ubicacion);
  return ubicacion;
}
