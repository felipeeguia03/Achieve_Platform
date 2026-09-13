"use client";

/**
 * Luna y sol, al pie del menú lateral — [ADR-097](../../docs/decisions.md#adr-097).
 *
 * ⚠️ **El ícono dice en qué modo estás**: luna en modo noche, sol en modo día.
 * Lo decidió el owner, y es al revés que el software de las capturas —que
 * muestra a dónde vas—. Lo que hace el botón lo dicen el `aria-label` y el
 * `title`: *Modo noche* o *Modo claro*.
 *
 * ⚠️ **Sin elección guardada, sigue al sistema en vivo.** Si la computadora
 * cambia de tema con la página abierta, Achieve cambia con ella; una vez que el
 * estudiante tocó el botón, manda su elección.
 */

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { t } from "@/lib/content/es-AR";
import {
  aplicarTema,
  elegirTema,
  temaDelSistema,
  temaGuardado,
  temaVigente,
  type Tema,
} from "@/lib/client/tema";

export function ConmutadorDeTema({ colapsada = false }: { colapsada?: boolean }) {
  /*
    ⚠️ **`null` hasta montar.** En el servidor no se sabe el tema, y dibujar la
    luna para después cambiarla al sol sería un ícono que salta. El botón ocupa
    su lugar igual —sin ícono un frame— para que el pie no se mueva.
  */
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    // Sincroniza el estado de React con lo que el script del <head> ya pintó:
    // es una lectura del DOM al montar, no un estado derivado.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ver arriba
    setTema(temaVigente());
    if (typeof window.matchMedia !== "function") return;
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = () => {
      if (temaGuardado() !== null) return;
      const delSistema = temaDelSistema();
      aplicarTema(delSistema);
      setTema(delSistema);
    };
    consulta.addEventListener("change", alCambiar);
    return () => consulta.removeEventListener("change", alCambiar);
  }, []);

  const siguiente: Tema = tema === "oscuro" ? "claro" : "oscuro";
  const etiqueta = t(siguiente === "oscuro" ? "TEMA.A_OSCURO" : "TEMA.A_CLARO");

  return (
    /*
      ⚠️ **Sólo el ícono, chico y a la derecha** — lo pidió el owner mirando el
      software de referencia. El nombre no se pierde: va en el `aria-label` y en
      el `title`, así que lo lee un lector de pantalla y aparece al pasar el mouse.
    */
    <div className="flex" style={{ justifyContent: colapsada ? "center" : "flex-end" }}>
      <button
        onClick={() => {
          elegirTema(siguiente);
          setTema(siguiente);
        }}
        aria-label={etiqueta}
        title={etiqueta}
        className="flex items-center justify-center hover:bg-[var(--card)]"
        style={{
          width: 32,
          height: 32,
          color: "var(--foreground)",
          borderRadius: 999,
        }}
      >
        {tema === null ? (
          <span aria-hidden style={{ width: 16, height: 16 }} />
        ) : tema === "oscuro" ? (
          <Moon size={16} aria-hidden />
        ) : (
          <Sun size={16} aria-hidden />
        )}
      </button>
    </div>
  );
}
