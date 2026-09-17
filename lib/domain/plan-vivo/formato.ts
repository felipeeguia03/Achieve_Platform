import { fechaEnZona, instanteEnZona } from "../zona";

/**
 * Formato del Plan vivo. **Puro**, con la zona como parámetro: el mismo
 * instante se lee igual en el servidor y en el navegador.
 */

/** `HH:MM` del instante en la zona. */
export function horaEnZona(instante: number, zona: string): string {
  const partes = new Intl.DateTimeFormat("en-GB", { timeZone: zona, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(
    new Date(instante),
  );
  const h = partes.find((p) => p.type === "hour")?.value ?? "00";
  const m = partes.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

/** Minutos desde la medianoche local. */
export function minutoDelDia(instante: number, zona: string): number {
  const [h, m] = horaEnZona(instante, zona).split(":").map(Number);
  return h * 60 + m;
}

/** El instante de `fecha` + `minutos` desde la medianoche local. */
export function instanteDelDia(fecha: string, minutos: number, zona: string): number {
  const h = String(Math.floor(minutos / 60)).padStart(2, "0");
  const m = String(minutos % 60).padStart(2, "0");
  return instanteEnZona(fecha, `${h}:${m}`, zona);
}

/** *«3 h 10»*, *«45 min»*, *«2 h»*. `0` es un valor: *«0 min»*. */
export function enHoras(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** *«martes 15, 19:00–20:00»*. */
export function tramo(ini: number, fin: number, zona: string): string {
  const fecha = fechaEnZona(ini, zona);
  const dia = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", timeZone: "UTC" })
    .format(new Date(`${fecha}T12:00:00Z`))
    .replace(",", "");
  return `${dia}, ${horaEnZona(ini, zona)}–${horaEnZona(fin, zona)}`;
}

export { fechaEnZona };
