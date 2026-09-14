"use client";

/**
 * El shell de aplicación (Fase A2.1).
 *
 * Junta navegación lateral y topbar alrededor de las nueve superficies, con el
 * patrón de `docs/diseño/` ([ADR-018](../../docs/decisions.md)).
 *
 * **No toca el contenido de las superficies.** Cambia el marco: ninguna
 * pantalla, fixture, CTA ni matriz de precedencia se modifica por estar acá
 * adentro.
 *
 * A 360 px la barra lateral se oculta —el piso móvil no tiene espacio para
 * 256 px de navegación— y el breadcrumb de la topbar queda como orientación.
 * El contrato de orden semántico de `design-system.md` §6.1 no cambia: lo que
 * se apila es el marco, no el contenido.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import { NavegacionLateral } from "./navegacion-lateral";
import { BarraSuperior } from "./barra-superior";
import { PaletaDeComandos } from "./paleta-de-comandos";
import { migasDe } from "@/lib/navigation/migas";
import { ProveedorDeMigaDelObjeto, type MigaIntermedia } from "./miga-del-objeto";
import { ProveedorDeEspacioDeTrabajo } from "./espacio-de-trabajo";
import { BarraDeObjetos } from "./barra-de-objetos";
import { PanelDeObjeto } from "./panel-de-objeto";
import { BarraDeSuperficie } from "./barra-de-superficie";
import { useBarraRecogida } from "@/lib/client/barra-lateral";
import type { NodoId } from "@/lib/navigation/surfaces";

export function Shell({ nodo, children }: { nodo: NodoId; children: React.ReactNode }) {
  /*
    ⚠️ **No es un `useState`** — ADR-101. Cada ruta monta su propio `Shell`, y
    un estado local se reiniciaba en cada navegación: la barra recogida se
    volvía a abrir al cambiar de pantalla. Es preferencia del navegador, como
    el tema, no dato del estudiante.
  */
  const [colapsada, alternarBarra] = useBarraRecogida();
  const [paleta, setPaleta] = useState(false);

  // Con qué nombrar la última miga, si la pantalla abrió un objeto concreto.
  // Lo declara ella con `useMigaDelObjeto`, porque el nombre llega en la
  // respuesta de la API y para cuando el Shell renderiza todavía no existe.
  const [objeto, setObjeto] = useState<string | null>(null);
  // ADR-099 §9: la miga del medio, cuando el objeto cuelga de otro objeto.
  const [intermedia, setIntermedia] = useState<MigaIntermedia | null>(null);
  const nombrarObjeto = useCallback((nombre: string | null, medio?: MigaIntermedia | null) => {
    setObjeto(nombre);
    setIntermedia(medio ?? null);
  }, []);

  // ⌘K / Ctrl+K. El atajo no reemplaza al control: la topbar sigue siendo
  // clickeable (`P-07`, ningún atajo elimina su camino visible).
  useEffect(() => {
    function alTeclear(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaleta((p) => !p);
      }
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  return (
    /*
      ⚠️ **El `Suspense` no es decorativo.** El proveedor del espacio de trabajo
      usa `useSearchParams` para sincronizar el objeto activo con la URL, y Next
      exige una frontera de suspensión alrededor de quien lo llame o el build
      falla. Envolver acá arriba la pone una sola vez, en vez de en las diez
      rutas.
    */
    <Suspense>
      <ProveedorDeEspacioDeTrabajo nombreEnPantalla={objeto}>
        <div className="flex" style={{ minHeight: "100vh", background: "var(--background)" }}>
          <NavegacionLateral
            nodoActivo={nodo}
            colapsada={colapsada}
            onAlternar={alternarBarra}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <BarraSuperior migas={migasDe(nodo, objeto, intermedia)} onAbrirPaleta={() => setPaleta(true)} />
            {/*
              ⚠️ **El encuadre es uno solo para todas las pantallas**, y es la
              identidad del software de las capturas: el título cae siempre en el
              mismo lugar. 48 px de lado y 40 arriba en desktop (§4.2); ninguna
              pantalla agrega padding propio alrededor de su contenido.
            */}
            <main className="min-w-0 flex-1 px-4 pt-6 md:px-12 md:pt-10" style={{ paddingBottom: 88 }}>
              <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>
                {/*
                  El semáforo de **esta** pantalla, cuando es la de un objeto —
                  ADR-088, Enmiendas 3 y 7. Va acá y no adentro de la superficie:
                  es cromo del marco, y `components/screens/*` no se toca (regla
                  6 de `CLAUDE.md`).
                */}
                <BarraDeSuperficie />
                <ProveedorDeMigaDelObjeto value={nombrarObjeto}>{children}</ProveedorDeMigaDelObjeto>
              </div>
            </main>

            {/*
              El espacio de trabajo vive **dentro de la columna de contenido**,
              no del `<main>`: así nunca queda debajo de la barra lateral y el
              scroll del contenido no lo arrastra fuera de cuadro.

              ⚠️ **Y no tapa nada**: `main` reserva el espacio con su
              `padding-bottom`, que es la mitad que se olvida y produce una CTA
              inalcanzable al final de la página.
            */}
            <BarraDeObjetos onAbrirPaleta={() => setPaleta(true)} />
          </div>

          {/*
            Las ventanas internas van **fuera de la columna**, en `fixed`: se
            mueven por la pantalla entera menos el pie, donde queda la barra a la
            vista. Que se siga viendo la ficha de la que salió cada una es lo que
            hace que se entienda de dónde vinieron.
          */}
          <PanelDeObjeto />

          <PaletaDeComandos abierta={paleta} onCerrar={() => setPaleta(false)} />
        </div>
      </ProveedorDeEspacioDeTrabajo>
    </Suspense>
  );
}
