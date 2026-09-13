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

/**
 * La miga **del medio**, cuando el objeto abierto cuelga de otro objeto —
 * [ADR-099](../../docs/decisions.md#adr-099) §9: *Materias › Arquitectura de
 * computadoras I › Clase práctica jueves 18/05*. El grafo sabe que `CLASE`
 * cuelga de `UX02`; qué materia es, y a qué URL vuelve, sólo lo sabe la pantalla.
 */
export type MigaIntermedia = { etiqueta: string; href: string };

const Contexto = createContext<((nombre: string | null, intermedia?: MigaIntermedia | null) => void) | null>(null);

export const ProveedorDeMigaDelObjeto = Contexto.Provider;

/**
 * Nombra la última miga con el objeto que esta pantalla abrió.
 *
 * `null` la deja como está. Al desmontar se limpia, para que volver al índice no
 * arrastre el nombre de la materia anterior.
 */
export function useMigaDelObjeto(nombre: string | null, intermedia?: MigaIntermedia | null): void {
  const avisar = useContext(Contexto);
  // Primitivos en las dependencias: un objeto nuevo en cada render volvería a
  // avisar sin fin.
  const etiqueta = intermedia?.etiqueta ?? null;
  const href = intermedia?.href ?? null;
  useEffect(() => {
    if (!avisar) return;
    avisar(nombre, etiqueta !== null && href !== null ? { etiqueta, href } : null);
    return () => avisar(null, null);
  }, [avisar, nombre, etiqueta, href]);
}
