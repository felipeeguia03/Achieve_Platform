"use client";

import { useCallback, useEffect, useState } from "react";

import { pedir, type Respuesta } from "./api";

/**
 * El hook que las cinco superficies de la Etapa B2.6 comparten.
 *
 * Existe para que el patrón sea **uno solo**: `UX02`–`UX06` no repiten cinco
 * veces el `useEffect` con su bandera de vigencia, su manejo de `401` y su
 * estado de carga. Cinco copias de eso son cinco lugares donde arreglar el
 * próximo bug de carga, y la `B2.5` ya mostró que uno solo alcanza para que
 * `UX01` mintiera durante una etapa entera.
 *
 * `omitir` es para la rama de `?escenario=`: con un escenario explícito no se
 * pide nada a la red, porque el catálogo sintético es la fuente por decisión y
 * no un fallback.
 */
export type EstadoDeSuperficie<T> = Respuesta<T> | { estado: "CARGANDO" };

export function useSuperficie<T>(ruta: string, opciones: { omitir?: boolean } = {}) {
  const omitir = opciones.omitir ?? false;
  // Cambiarlo fuerza el `useEffect` a correr de nuevo. Un `reintentar` que sólo
  // volviera a llamar a `pedir` dejaría el estado de carga sin tocar.
  const [intento, setIntento] = useState(0);
  const clave = `${ruta}#${intento}`;

  /**
   * **La respuesta se guarda junto con la clave que la produjo.**
   *
   * La primera versión hacía `setRespuesta({ estado: "CARGANDO" })` al empezar
   * el efecto, y eso es un `setState` síncrono dentro de un efecto: dispara un
   * render en cascada, y el lint lo rechaza con razón.
   *
   * Guardando la clave, *cargando* deja de ser un estado que alguien setea y
   * pasa a ser **lo que se deduce** cuando la respuesta que hay no corresponde a
   * lo que se está pidiendo. Y de paso cierra un agujero que la bandera de
   * vigencia no cubría: una respuesta vieja no puede quedar en pantalla bajo una
   * ruta nueva, porque su clave ya no coincide.
   */
  const [resultado, setResultado] = useState<{ clave: string; r: Respuesta<T> } | null>(null);

  useEffect(() => {
    if (omitir) return;
    let vigente = true;
    pedir<T>(ruta).then((r) => {
      // Sin esta guarda se setea estado sobre un componente que ya se fue.
      if (vigente) setResultado({ clave, r });
    });
    return () => {
      vigente = false;
    };
  }, [ruta, omitir, clave]);

  const reintentar = useCallback(() => setIntento((i) => i + 1), []);

  const respuesta: EstadoDeSuperficie<T> =
    resultado && resultado.clave === clave ? resultado.r : { estado: "CARGANDO" };

  return { respuesta, reintentar };
}
