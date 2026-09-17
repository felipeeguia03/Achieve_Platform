"use client";

/**
 * Qué componente dibuja cada ruta — [ADR-088](../../docs/decisions.md#adr-088),
 * Enmienda 6.
 *
 * La ventana de una ficha tiene que dibujar **la superficie de ese objeto**, y
 * lo único que el objeto lleva adentro es su ruta. Acá está la traducción, en un
 * solo lugar.
 *
 * ## ⚠️ Por la ruta, no por el tipo
 *
 * El tipo de un objeto dice *qué es* —una evidencia, una acción—, y eso no
 * alcanza: `modo-examen` son **tres** pantallas distintas (activación, overview
 * y paso). La ruta ya las distingue, ya está guardada y ya es la que la ficha
 * usó para abrir el objeto. Un segundo mapa por tipo sería un segundo lugar
 * donde equivocarse.
 *
 * ## ⚠️ Los caminos se leen del grafo, no se escriben acá
 *
 * `nodos[…].ruta` es la fuente: si mañana `/progreso` pasa a ser `/bitacora`, el
 * mapa sigue bien sin que nadie se acuerde de este archivo. Escribir las once
 * rutas a mano sería la lista de destinos paralela que ADR-019 §2 rechazó.
 */

import type { ComponentType } from "react";

import { nodos } from "@/lib/navigation/surfaces";
import type { PropsDeSuperficie } from "./consulta";

import { VistaDeHoy } from "./hoy";
import { VistaDeMateria } from "./materia";
import { VistaDeMaterias } from "./materias";
import { VistaDeAccion } from "./accion";
import { VistaDeCompromiso } from "./compromiso";
import { VistaDeEvidencia } from "./evidencia";
import { VistaDeProgreso } from "./progreso";
import { VistaDeFormacion } from "./formacion";
import { VistaDeClase } from "./clase";
import { VistaDeCalendario } from "./calendario";
import { VistaDePlanVivo } from "./plan-vivo";
import { VistaDeGimnasia } from "./gimnasia";
import { VistaDeFocus } from "./focus";
import { VistaDeRecorrido } from "./recorrido";
import { VistaDeActivacionDeExamen } from "./examen-activacion";
import { VistaDeOverviewDeExamen } from "./examen-overview";
import { VistaDePasoDeProtocolo } from "./examen-paso";

type Superficie = ComponentType<PropsDeSuperficie>;

/** Una entrada por nodo con pantalla. El nodo pone la ruta; esto pone el dibujo. */
const POR_NODO: ReadonlyArray<readonly [keyof typeof nodos, Superficie]> = [
  ["UX01", VistaDeHoy],
  ["UX02", VistaDeMateria],
  ["UX02_INDICE", VistaDeMaterias],
  ["UX03", VistaDeAccion],
  ["UX04", VistaDeCompromiso],
  ["UX05", VistaDeEvidencia],
  ["UX06", VistaDeProgreso],
  ["FORMACION", VistaDeFormacion],
  ["CLASE", VistaDeClase],
  ["CALENDARIO", VistaDeCalendario],
  ["PLAN_VIVO", VistaDePlanVivo],
  ["GIMNASIA", VistaDeGimnasia],
  ["FOCUS", VistaDeFocus],
  ["RECORRIDO", VistaDeRecorrido],
  ["UX07", VistaDeActivacionDeExamen],
  ["UX08", VistaDeOverviewDeExamen],
  ["UX09", VistaDePasoDeProtocolo],
];

/**
 * El mapa `camino → componente`, sin parámetros.
 *
 * ⚠️ **La clave es el camino pelado.** `/materia?cursada=abc` y
 * `/materia?cursada=xyz` son la misma pantalla con distinta consulta; quien
 * dibuja parte la ruta y busca por la primera mitad.
 */
export const VISTA_POR_CAMINO: Readonly<Record<string, Superficie>> =
  Object.fromEntries(
    POR_NODO.flatMap(([id, vista]) => {
      const ruta = nodos[id].ruta;
      return ruta === null ? [] : [[ruta, vista] as const];
    }),
  );
