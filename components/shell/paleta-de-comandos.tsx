"use client";

/**
 * Paleta de comandos (Etapa A2.2).
 *
 * `I-03` del manual: **entrada polimórfica** —un solo campo que acepta todos
 * los tipos de identificador y desambigua solo—, con **una vía de escape para
 * forzar la interpretación cuando dos formatos colisionen**. Acá los prefijos
 * `>` y `#` son esa vía, y se muestran en pantalla: una vía de escape que hay
 * que adivinar no es una vía de escape.
 *
 * `I-04`: **el atajo se muestra dentro del control que dispara**. El `⌘K` vive
 * en el buscador de la topbar, no en un tooltip.
 *
 * `P-07`: ningún atajo elimina su camino visible — la paleta no reemplaza a la
 * navegación lateral, la acompaña.
 *
 * **Cero red y cero persistencia.** Busca sobre el catálogo en memoria y no
 * recuerda nada entre sesiones.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  buscarEnPaleta,
  entradasDeMaterias,
  type TipoDeEntrada,
} from "@/lib/navigation/paleta";
import { indiceDePaleta } from "@/lib/fixtures/indice-paleta";
import { objetoDeMateria } from "@/lib/navigation/objetos-de-superficie";
import { rutaDeCtaCon } from "@/lib/navigation";
import { pedir } from "@/lib/client/api";
import { useEspacioDeTrabajo } from "./espacio-de-trabajo";
import { t, type CopyId } from "@/lib/content/es-AR";
import type { MateriasProps } from "@/lib/domain/view-models";

/**
 * El aviso de cada vía de escape.
 *
 * ⚠️ **Una tabla y no un ternario.** Con dos tipos, `forzado === "superficie" ?
 * … : …` alcanzaba; con tres, ese ternario **manda todo lo que no sea
 * superficie al mensaje de escenario** —y una búsqueda forzada a materias diría
 * *"buscando sólo escenarios"*—. El `satisfies` hace que agregar un cuarto tipo
 * sin su mensaje no compile.
 */
const FORZADO = {
  superficie: "PALETA.FORZADO.SUPERFICIE",
  escenario: "PALETA.FORZADO.ESCENARIO",
  materia: "PALETA.FORZADO.MATERIA",
} as const satisfies Record<TipoDeEntrada, CopyId>;

/**
 * Las materias que ya se pidieron en esta sesión — Enmienda 6.
 *
 * ⚠️ **Memoria del módulo, NO persistencia.** No es `localStorage` y no
 * sobrevive a recargar: el guard de cero persistencia sigue intacto y este
 * archivo no está en su lista de excepciones. Es una variable que vive lo que
 * vive la pestaña.
 *
 * ⚠️ **Y existe porque se midió.** El diálogo se remonta en cada apertura —es
 * lo que lo deja limpio sin resetear estado en un efecto—, así que sin caché
 * cada ⌘K vuelve a pedir y hay ~75 ms en los que escribir el nombre de una
 * materia no encuentra nada. Quien escribe rápido ve *"No encontramos nada con
 * eso"* sobre una materia que existe, que es peor que esperar.
 *
 * Se sigue pidiendo igual al abrir: esto **siembra** la lista, no la reemplaza.
 * Una materia nueva aparece en la apertura siguiente y no hay que recargar.
 */
let materiasDeLaSesion: MateriasProps["materias"] = [];

export function PaletaDeComandos({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  // Remontar en cada apertura deja la paleta limpia sin resetear estado dentro
  // de un efecto, que encadena renders.
  return abierta ? <Dialogo onCerrar={onCerrar} /> : null;
}

function Dialogo({ onCerrar }: { onCerrar: () => void }) {
  const router = useRouter();
  const { abrirEnVentana } = useEspacioDeTrabajo();
  const [consulta, setConsulta] = useState("");
  const [seleccion, setSeleccion] = useState(0);
  const campo = useRef<HTMLInputElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  /**
   * Las materias del estudiante — Enmienda 6.
   *
   * ⚠️ **Se piden acá y no en el índice estático, y no hay otra opción.**
   * `indiceDePaleta` se arma una vez, en memoria, a partir del catálogo: las
   * materias son **de esta sesión** y sólo el backend las conoce. El diálogo se
   * monta recién al abrirse (la paleta lo remonta cada vez), así que el pedido
   * sale cuando alguien busca y no en cada pantalla.
   *
   * ## ⚠️ Con `pedir`, y NO con `useSuperficie`
   *
   * **Se probó con `useSuperficie` y estaba mal.** Ese hook, ante `SIN_SESION`,
   * **manda a `/login`** — y hace bien: una superficie sin sesión no tiene nada
   * que dibujar. Pero el buscador no es una superficie: es cromo. Con el hook,
   * abrir ⌘K en el recorrido del focus group —que corre con `?escenario=` y sin
   * backend— **echaba al estudiante a la pantalla de ingreso**. Se midió en el
   * navegador: el `401` de `/api/materias` se llevaba la demo puesta.
   *
   * Acá el fallo es *no hay materias que ofrecer*, y el buscador sigue
   * contestando con las pantallas. Es §2.7: la línea desaparece, nada se
   * inventa y **nada navega**.
   */
  const [materias, setMaterias] = useState<MateriasProps["materias"]>(materiasDeLaSesion);

  useEffect(() => {
    let vigente = true;
    void pedir<MateriasProps>("/api/materias").then((r) => {
      if (r.estado !== "OK") return;
      materiasDeLaSesion = r.datos.materias;
      if (vigente) setMaterias(r.datos.materias);
    });
    return () => {
      vigente = false;
    };
  }, []);

  const indice = useMemo(
    () => [
      ...indiceDePaleta,
      ...entradasDeMaterias(materias, (cursadaId, nombre) => {
        // La ruta sale del registro canónico, igual que en el índice y en `Hoy`.
        const ruta = rutaDeCtaCon("CTA-001", cursadaId);
        return ruta === null ? null : objetoDeMateria(cursadaId, nombre, ruta);
      }),
    ],
    [materias],
  );

  const { entradas, forzado } = useMemo(() => buscarEnPaleta(indice, consulta), [indice, consulta]);

  // El foco es un efecto legítimo: toca el DOM, no el estado. Reiniciar
  // consulta y selección NO se hace acá — se hace remontando el diálogo con
  // `key`, para no encadenar renders.
  useEffect(() => {
    campo.current?.focus();
  }, []);

  /**
   * Elegir un resultado.
   *
   * ⚠️ **Una materia se abre en ventana, no se navega** — Enmienda 6, y lo pidió
   * el owner: *"que pueda buscar por materias y se abra el modal"*. El buscador
   * se usa **sin querer irse de donde estás**: interrumpir la pantalla para
   * contestar una consulta es justo lo que la ventana vino a evitar. La ficha
   * queda en la barra, y desde ahí *«Ver como página»* lleva a la materia entera
   * para el que sí quería mudarse.
   *
   * ⚠️ **Un escenario navega, y no es una excepción caprichosa.** `?escenario=`
   * cambia de qué catálogo se proyecta **la pantalla**: abrirlo en una ventana
   * sobre otra pantalla dejaría dos estados del mundo a la vista al mismo
   * tiempo. No es un objeto; es un conmutador.
   */
  function elegir(indice: number) {
    const entrada = entradas[indice];
    if (entrada === undefined) return;
    onCerrar();
    if (entrada.objeto) {
      abrirEnVentana(entrada.objeto);
      return;
    }
    router.push(entrada.url);
  }

  function alTeclear(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      // Escape con jerarquía definida (`I-02`): cierra la paleta y devuelve el
      // foco a la pantalla, sin navegar.
      e.preventDefault();
      onCerrar();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSeleccion((i) => Math.min(entradas.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSeleccion((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      elegir(seleccion);
    }
  }

  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        zIndex: 50,
      }}
    >
      <div
        ref={contenedor}
        role="dialog"
        aria-modal="true"
        aria-label={t("PALETA.TITULO")}
        onKeyDown={alTeclear}
        style={{
          width: "min(640px, calc(100vw - 32px))",
          background: "var(--card)",
          borderRadius: "var(--radius)",
          border: ".5px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        <div
          className="hairline-b flex items-center gap-3"
          style={{ padding: "14px 18px", borderBottom: ".5px solid var(--border)" }}
        >
          <Search size={16} aria-hidden style={{ color: "var(--muted-foreground)" }} />
          <input
            ref={campo}
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value);
              setSeleccion(0);
            }}
            placeholder={t("PALETA.PLACEHOLDER")}
            aria-label={t("PALETA.PLACEHOLDER")}
            aria-controls="paleta-resultados"
            style={{
              flex: 1,
              background: "transparent",
              outline: "none",
              fontSize: "var(--text-body)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/*
          La vía de escape de `I-03`, visible. Forzar la interpretación no sirve
          si hay que adivinar cómo se fuerza.
        */}
        <div
          className="hairline-b"
          style={{
            padding: "8px 18px",
            borderBottom: ".5px solid var(--border)",
            fontSize: "var(--text-meta)",
            color: "var(--muted-foreground)",
          }}
        >
          {forzado === null ? t("PALETA.AYUDA") : t(FORZADO[forzado])}
        </div>

        <ul id="paleta-resultados" role="listbox" style={{ maxHeight: "48vh", overflowY: "auto" }}>
          {entradas.length === 0 ? (
            // El vacío explica qué se puede buscar, no dice "sin resultados".
            <li style={{ padding: "20px 18px" }}>
              <p style={{ fontSize: "var(--text-body)", fontWeight: 600 }}>{t("PALETA.VACIO")}</p>
              <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
                {t("PALETA.VACIO_AYUDA")}
              </p>
            </li>
          ) : (
            entradas.map((entrada, i) => (
              <li key={entrada.url} role="option" aria-selected={i === seleccion}>
                <button
                  onMouseEnter={() => setSeleccion(i)}
                  onClick={() => elegir(i)}
                  data-entrada-paleta={entrada.tipo}
                  className="flex w-full items-baseline gap-3 text-left"
                  style={{
                    padding: "10px 18px",
                    background: i === seleccion ? "var(--muted)" : "transparent",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--text-body)",
                      color: "var(--foreground)",
                      fontFamily: entrada.tipo === "escenario" ? "var(--font-mono)" : undefined,
                    }}
                  >
                    {entrada.titulo}
                  </span>
                  <span
                    className="truncate"
                    style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}
                  >
                    {entrada.detalle}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
