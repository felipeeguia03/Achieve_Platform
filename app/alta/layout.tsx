/**
 * El tramo de alta — Fase B6.14.5,
 * [ADR-052](../../docs/decisions.md#adr-052).
 *
 * **Fuera del `Shell` a propósito**, igual que `/login` (ADR-039). No son
 * superficies de producto: `lib/navigation/` sigue teniendo nueve nodos y
 * `UX10` sigue sin existir, con guard que lo verifica.
 *
 * Y hay un motivo de producto además del formal: la navegación lateral ofrece
 * nueve destinos que este estudiante todavía no puede visitar — las nueve
 * devuelven `409 ALTA_INCOMPLETA` y lo traerían de vuelta acá.
 */
import { PanelDePrueba } from "@/components/prueba/panel";

export default function AltaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--background)" }}>
      {children}
      {/*
        ⚠️ **MODO PRUEBA.** Va también acá, y no es de más: el caso que más se
        repite es querer volver a empezar **a mitad del alta**, después de ver
        cómo toma una carrera y querer probar otra. Sin la variable de entorno
        el componente no llega al HTML.
      */}
      {process.env.MODO_PRUEBA === "1" && <PanelDePrueba />}
    </div>
  );
}
