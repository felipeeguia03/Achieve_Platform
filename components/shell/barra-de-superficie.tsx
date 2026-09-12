"use client";

/**
 * La barra de título de la pantalla — [ADR-088](../../docs/decisions.md#adr-088),
 * Enmiendas 3 y 7.
 *
 * Cuando la pantalla que estás mirando **es la de un objeto** —una materia, un
 * video de Formación, la acción del día—, arriba del contenido aparece su
 * semáforo. El owner lo pidió literal: *"primero quiero que se abra la materia
 * normal, luego se puede minimizar con un botón arriba, al estilo mac"*.
 *
 * ## Dos controles, a la derecha — Enmienda 7
 *
 * ⚠️ **Sin cruz.** La pantalla completa no se cierra: se sale de ella, como de
 * cualquier pantalla. Cerrar es sacar la ficha de la barra, y eso se hace en la
 * ficha. Quedan **minimizar** —la guarda en la barra y lleva a `Hoy`— y
 * **achicar** —la guarda y la vuelve ventana sobre la sección de la que cuelga—.
 *
 * ⚠️ **A la derecha, no a la izquierda.** El owner lo pidió con la pantalla
 * delante: a la izquierda los círculos quedaban justo arriba del eyebrow y
 * competían con el primer renglón de la pantalla.
 *
 * ## Sólo en pantallas de objeto
 *
 * ⚠️ **Una sección del menú no lleva semáforo** —*Hoy*, *Materias*, *Progreso*,
 * *Formación* sin video abierto—: `enPantalla` es `null` y no se dibuja nada.
 * *"No debería haber esos botones en las pestañas que son producto de apretar
 * el sidebar."*
 *
 * ## No es el breadcrumb, y no lo reemplaza
 *
 * [ADR-019](../../docs/decisions.md#adr-019) §2 sigue vigente. La miga contesta
 * *"¿dónde estoy?"* y sigue en la topbar; esto dice **qué podés hacer con esta
 * pantalla**.
 */

import { t } from "@/lib/content/es-AR";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import { useEspacioDeTrabajo } from "./espacio-de-trabajo";
import { Semaforo } from "./controles-de-ventana";

export function BarraDeSuperficie() {
  const { enPantalla, listo, minimizarPantalla, achicarPantalla } = useEspacioDeTrabajo();

  // Antes de leer la memoria no se dibuja: un objeto guardado aparecería con la
  // etiqueta equivocada un frame (`P-12`).
  if (!listo || enPantalla === null) return null;

  const nombre = nombreDeObjeto(enPantalla.etiqueta);

  return (
    <div
      /*
        ⚠️ **Se agrupa y se nombra, y no es ceremonia.** Con una ventana abierta
        encima, hay dos semáforos en la pantalla que dicen *«Minimizar:
        Álgebra»*: sin un grupo con nombre, un lector de pantalla no sabe cuál es
        el de esta pantalla.
      */
      role="group"
      aria-label={t("PANEL.CONTROLES")}
      className="flex items-center justify-end"
      style={{
        gap: 12,
        // Pegado al borde superior del contenido: es la barra de título de esta
        // pantalla, no un módulo más de la columna.
        margin: "-8px 0 16px",
        paddingBottom: 12,
        borderBottom: ".5px solid var(--border)",
      }}
    >
      {/*
        ⚠️ **El nombre NO se repite acá** — Enmienda 5. Aparecía tres veces en los
        primeros 250 px de la pantalla: la miga, esta barra y el eyebrow. Cada
        control **lleva el nombre adentro** de su `aria-label`, así que nada
        accesible se pierde.
      */}
      <Semaforo
        nombre={nombre}
        expandido
        onMinimizar={minimizarPantalla}
        onExpandir={achicarPantalla}
      />
    </div>
  );
}
