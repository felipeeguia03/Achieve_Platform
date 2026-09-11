"use client";

/**
 * Los controles de ventana — [ADR-088](../../docs/decisions.md#adr-088), Enmienda 3.
 *
 * Tres controles redondos arriba a la izquierda: **cerrar, minimizar y
 * expandir**, en ese orden. Es el mecanismo de un escritorio, y el owner lo
 * pidió con ese nombre.
 *
 * ## Se toma el mecanismo, no la marca
 *
 * ⚠️ **No son rojo, amarillo y verde.** Achieve tiene tres colores semánticos
 * —éxito, urgencia y humano— y **los tres significan algo del dominio**:
 * `--exito-fill` en un botón de expandir diría *"esto salió bien"* sobre un
 * control de cromo. Eso es deriva de vocabulario por el eje del color, el mismo
 * `A-04` que hizo que el marco no se llamara «ventana».
 *
 * Y los colores literales de otro sistema operativo tampoco entran:
 * `AGENTS.md` §1.5 es explícito en que de una fuente se toma **el mecanismo**,
 * nunca su marca. Lo que hace que se lean como controles de ventana es **la
 * forma, el tamaño, el orden y el lugar**, no de quién son los colores.
 *
 * ## Y llevan su glifo puesto
 *
 * ⚠️ **No aparecen al pasar el mouse.** Un control que sólo dice qué hace cuando
 * ya lo estás por apretar es `P-05` al revés: el área activa tiene que
 * **parecer** lo que es. Con tres círculos mudos, cerrar y minimizar se
 * distinguen por la posición — y equivocarse cierra el objeto.
 */

import { useState } from "react";
import { Maximize2, Minimize2, Minus, X } from "lucide-react";

import { t } from "@/lib/content/es-AR";

/** Un control redondo. El `hover` vive en estado porque el estilo es inline. */
function ControlRedondo({
  etiqueta,
  onClick,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const [encima, setEncima] = useState(false);

  return (
    <button
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
      onFocus={() => setEncima(true)}
      onBlur={() => setEncima(false)}
      className="flex items-center justify-center"
      style={{
        /*
          ⚠️ **14 px de círculo dentro de 28 px de área táctil.** El punto se
          dibuja chico porque tres puntos grandes al lado del nombre del objeto
          pesan más que el nombre; lo que no puede ser chico es **dónde se puede
          apretar**, y por eso el `padding` va afuera del círculo y no adentro.
        */
        width: 14,
        height: 14,
        flexShrink: 0,
        borderRadius: 999,
        border: ".5px solid var(--border)",
        background: encima ? "var(--foreground)" : "var(--muted)",
        color: encima ? "var(--primary-foreground)" : "var(--muted-foreground)",
        transition: "background 140ms ease, color 140ms ease",
      }}
    >
      {children}
    </button>
  );
}

/**
 * El semáforo: cerrar · minimizar · expandir.
 *
 * `onExpandir` ausente ⇒ **el control no se dibuja**. Es §2.7 —*omitir, no
 * inventar*—: a menos de 768 px no hay tamaño que alternar, y un botón que no
 * hace nada es peor que ninguno.
 */
export function Semaforo({
  nombre,
  expandido,
  onCerrar,
  onMinimizar,
  onExpandir,
}: {
  /** Con qué nombrar el objeto en los `aria-label`. Con varias ventanas, «Cerrar» a secas es ambiguo. */
  nombre: string;
  expandido?: boolean;
  onCerrar: () => void;
  onMinimizar: () => void;
  onExpandir?: () => void;
}) {
  return (
    <span className="flex items-center" style={{ gap: 8, flexShrink: 0 }}>
      <ControlRedondo etiqueta={`${t("PANEL.CERRAR")}: ${nombre}`} onClick={onCerrar}>
        <X size={9} strokeWidth={2.5} aria-hidden />
      </ControlRedondo>

      {/*
        ⚠️ **Minimizar y cerrar NO son lo mismo, y por eso son dos.** Minimizar
        deja el objeto en la barra; cerrar lo saca. Es la Enmienda 1 §4, y con
        dos controles pegados importa el doble.
      */}
      <ControlRedondo etiqueta={`${t("PANEL.MINIMIZAR")}: ${nombre}`} onClick={onMinimizar}>
        <Minus size={9} strokeWidth={2.5} aria-hidden />
      </ControlRedondo>

      {onExpandir && (
        <ControlRedondo
          etiqueta={`${expandido ? t("PANEL.RESTAURAR") : t("PANEL.EXPANDIR")}: ${nombre}`}
          onClick={onExpandir}
        >
          {expandido ? (
            <Minimize2 size={8} strokeWidth={2.5} aria-hidden />
          ) : (
            <Maximize2 size={8} strokeWidth={2.5} aria-hidden />
          )}
        </ControlRedondo>
      )}
    </span>
  );
}
