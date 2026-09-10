"use client";

/**
 * Cómo una pantalla le dice al Shell **qué objeto está abierto**.
 *
 * El breadcrumb sale del grafo (`migasDe`), y el grafo conoce nodos, no
 * instancias: `UX02` es *"Materia"* para todas las materias. Cuando la pantalla
 * abre **una**, la última miga tiene que decir cuál — `Hoy › Materias ›
 * Emprendedorismo`.
 *
 * ⚠️ **El Shell no puede leerlo solo.** El nombre llega en la respuesta de la
 * API, que se pide **adentro** del árbol que el Shell envuelve; para cuando el
 * Shell renderiza, todavía no existe. Por eso viaja hacia arriba por contexto y
 * no por props.
 *
 * ⚠️ **Es sólo presentación.** No cambia el grafo, ni las rutas, ni el registro
 * de CTAs: `migasDe` sigue derivando la cadena del mismo árbol de padres, y lo
 * único que se reemplaza es el texto de la miga que **ya no tiene enlace**.
 */

import { createContext, useContext, useEffect } from "react";

const Contexto = createContext<((nombre: string | null) => void) | null>(null);

export const ProveedorDeMigaDelObjeto = Contexto.Provider;

/**
 * Nombra la última miga con el objeto que esta pantalla abrió.
 *
 * `null` la deja como está. Al desmontar se limpia, para que volver al índice no
 * arrastre el nombre de la materia anterior.
 */
export function useMigaDelObjeto(nombre: string | null): void {
  const avisar = useContext(Contexto);
  useEffect(() => {
    if (!avisar) return;
    avisar(nombre);
    return () => avisar(null);
  }, [avisar, nombre]);
}
