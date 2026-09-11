"use client";

/**
 * La barra de título de la superficie — [ADR-088](../../docs/decisions.md#adr-088), Enmienda 3.
 *
 * Cuando la pantalla que estás mirando **es la de un objeto abierto**, arriba de
 * todo aparece su semáforo. El owner lo pidió literal: *"primero quiero que se
 * abra la materia normal, luego se puede minimizar con un botón arriba, al
 * estilo mac"*.
 *
 * ## La superficie es la ventana expandida, y por eso el tercer control restaura
 *
 * ⚠️ **No hay un botón de «expandir» acá, y no es un olvido.** La materia a
 * pantalla completa **ya está expandida**: lo único que queda es reducirla, y
 * eso es lo que hace el tercero — la convierte en una ventana sobre la pantalla
 * de la que salió. Un botón de expandir en algo ya expandido sería un control
 * muerto (`P-07`).
 *
 * ## Sólo aparece si hay objeto, y eso es correcto
 *
 * ⚠️ **Llegar a `/materia?cursada=…` pegando la URL no dibuja el semáforo**, y
 * es la misma regla de siempre: *estar en una pantalla no es tener su objeto
 * abierto* (`sincronizarConRuta`). Navegar por la aplicación siempre pasa por
 * `abrir`, así que el caso sin ficha es el de una URL pegada a mano — donde no
 * hay «de dónde volver» y minimizar no querría decir nada.
 *
 * ## No es el breadcrumb, y no lo reemplaza
 *
 * [ADR-019](../../docs/decisions.md#adr-019) §2 sigue vigente. La miga contesta
 * *"¿dónde estoy?"* y sigue en la topbar; esto dice **qué objeto es esta ventana
 * y qué podés hacer con ella**. Por eso repite el nombre y no el camino.
 */

import { t } from "@/lib/content/es-AR";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import { useEspacioDeTrabajo } from "./espacio-de-trabajo";
import { Semaforo } from "./controles-de-ventana";

export function BarraDeSuperficie() {
  const { enSuperficie, minimizarSuperficie, superficieAVentana, cerrarSuperficie } =
    useEspacioDeTrabajo();

  if (!enSuperficie) return null;

  const nombre = nombreDeObjeto(enSuperficie.etiqueta);
  const completo = enSuperficie.etiquetaSecundaria
    ? `${nombre} · ${nombreDeObjeto(enSuperficie.etiquetaSecundaria)}`
    : nombre;

  return (
    <div
      /*
        ⚠️ **Se agrupa y se nombra, y no es ceremonia.** El semáforo de la
        superficie y la ✕ de la ficha en la barra dicen *«Cerrar: Álgebra»* los
        dos, porque hacen lo mismo. Sin un grupo con nombre, un lector de
        pantalla anuncia dos controles idénticos sueltos en la página y no hay
        forma de saber cuál es el de esta ventana.
      */
      role="group"
      aria-label={t("PANEL.CONTROLES")}
      className="flex items-center"
      style={{
        gap: 12,
        // Pegado al borde superior del contenido: es la barra de título de esta
        // pantalla, no un módulo más de la columna.
        margin: "-8px 0 16px",
        paddingBottom: 12,
        /*
          ⚠️ **Acá NO va el color de la materia, y se probó puesto.**

          El color existe para **diferenciar cosas que se ven a la vez** — dos
          fichas en la barra, tres ventanas superpuestas—. En una superficie sola
          no hay de qué diferenciarla: la pantalla ya dice de qué materia es en
          la miga y en su propio eyebrow.

          Y a todo el ancho dejaba de leerse como identidad: una línea de color
          cruzando la pantalla arriba de todo **se lee como una alerta**, justo
          encima de la franja que avisa que el temario es estimado. Dos barras de
          color seguidas diciendo cosas distintas es peor que ninguna.
        */
        borderBottom: ".5px solid var(--border)",
      }}
    >
      {/*
        ⚠️ **El semáforo va solo: el nombre NO se repite acá.**

        Se probó con el nombre puesto y el mismo texto aparecía **tres veces en
        los primeros 250 px de la pantalla** — la miga, esta barra y el eyebrow
        de `UX02`, una debajo de la otra. Es `C-02` literal: repetir no es
        reforzar, es gastar la altura que necesita lo que todavía no se dijo.

        No se pierde nada accesible. Cada control **lleva el nombre adentro** de
        su `aria-label` —*«Minimizar: Arquitectura computadoras»*—, así que un
        lector de pantalla sigue sabiendo de qué ventana son estos tres botones;
        lo que se saca es el texto redundante **para quien ve**.
      */}
      <Semaforo
        nombre={completo}
        expandido
        onCerrar={cerrarSuperficie}
        onMinimizar={minimizarSuperficie}
        onExpandir={superficieAVentana}
      />
    </div>
  );
}
