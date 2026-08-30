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

import { useState } from "react";
import { NavegacionLateral } from "./navegacion-lateral";
import { BarraSuperior } from "./barra-superior";
import { migasDe } from "@/lib/navigation/migas";
import type { NodoId } from "@/lib/navigation/surfaces";

export function Shell({ nodo, children }: { nodo: NodoId; children: React.ReactNode }) {
  // Estado de sesión, no de dominio: no se persiste (regla del Track A).
  const [colapsada, setColapsada] = useState(false);

  return (
    <div className="flex" style={{ minHeight: "100vh", background: "var(--background)" }}>
      <NavegacionLateral
        nodoActivo={nodo}
        colapsada={colapsada}
        onAlternar={() => setColapsada((c) => !c)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior migas={migasDe(nodo)} />
        <main className="min-w-0 flex-1" style={{ padding: "24px" }}>
          <div style={{ maxWidth: 1120, margin: "0 auto" }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
