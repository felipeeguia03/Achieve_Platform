/**
 * Layout del rol estudiante.
 *
 * Desktop-first (ADR-014): el viewport primario de diseño y verificación es
 * desktop; 360 px es el piso obligatorio de la variante móvil. El contrato de
 * orden semántico del primer viewport (design-system.md §6.1) rige en los dos
 * anchos.
 *
 * Desde la Fase A2.1 el marco lo pone `components/shell/`: navegación lateral,
 * topbar con breadcrumb y el centrado del contenido. Este layout sólo aporta
 * el color base.
 */
import { PanelDePrueba } from "@/components/prueba/panel";
import { Asistente } from "@/components/shell/asistente";
import { ProveedorDePlanVivo } from "@/lib/client/plan-vivo-flag";
import { planVivoEnCalendario } from "@/lib/server/plan-vivo-flag";

export default function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // El centrado y el padding los pone el Shell (Fase A2.1). Acá sólo queda
    // el color base, para que el fondo no lo pinte el navegador.
    <div style={{ background: "var(--background)", color: "var(--foreground)" }}>
      {/*
        🧪 **Plan vivo en el Calendario** — ADR-110. El flag baja por contexto
        para el Calendario abierto **en una ventana**. Como el resto del layout,
        se fija al compilar (igual que `MODO_PRUEBA`); la página `/calendario` lo
        vuelve a leer en cada pedido.
      */}
      <ProveedorDePlanVivo activo={planVivoEnCalendario()}>{children}</ProveedorDePlanVivo>
      {/*
        ⚠️ **MODO PRUEBA.** El dock para reiniciar el alta. Se monta acá —en el
        layout, que es Server Component— y no en el `Shell`, por dos razones:
        el `Shell` lo instancia cada página y no podría recibir una variable de
        entorno del servidor, y esto **no es parte del marco del producto**.

        `process.env.MODO_PRUEBA` se lee en el servidor: sin la variable, el
        componente **no llega al HTML**. No es un `display: none`.
      */}
      {process.env.MODO_PRUEBA === "1" && <PanelDePrueba />}
      {/*
        🧪 **El asistente de reportes y mejoras, simulado** — ADR-103. Mismo
        cerrojo que el dock: contesta con un guion y **no envía nada**, así que
        sin `MODO_PRUEBA=1` un *"Reporte enviado"* sería mentira.
      */}
      {process.env.MODO_PRUEBA === "1" && <Asistente />}
    </div>
  );
}
