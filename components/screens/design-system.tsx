"use client";

/**
 * ACHIEVE — primitivas visuales compartidas entre las 6 pantallas del loop
 * diario. Extraídas de hoy-autogestion.tsx para no duplicar (y no divergir)
 * el sistema de tokens en cada pantalla nueva.
 *
 * Tokens: ver app/globals.css. Contraste AA medido — ver auditoría en la
 * conversación de diseño. Regla fija: el color semántico NUNCA es borde fino
 * ni texto directo sobre superficie clara — siempre EstadoChip (relleno
 * sólido + texto ink).
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DatoDeEvaluacion, TipoDeAusencia, Tono } from "@/lib/domain/view-models";

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function EstadoGeneral({ children }: { children: React.ReactNode }) {
  return (
    <div className="hairline-b pb-2" style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--foreground)" }}>
      {children}
    </div>
  );
}

/** P-01: la regla de negocio va pegada al control, no en un tooltip. */
export function ReglaDeNegocio({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{children}</p>;
}

export function HeroCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="shadow-none" style={{ borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--card)" }}>
      <CardContent className="space-y-3 pt-5 pb-5">{children}</CardContent>
    </Card>
  );
}

export function EstadoChip({ tone, children }: { tone: "urgencia" | "exito" | "humano"; children: React.ReactNode }) {
  const fill = tone === "urgencia" ? "var(--urgencia-fill)" : tone === "exito" ? "var(--exito-fill)" : "var(--humano)";
  const text = tone === "humano" ? "#ffffff" : "var(--foreground)";
  return (
    <span style={{ display: "inline-block", background: fill, color: text, fontSize: "var(--text-label)", fontWeight: 600, padding: "3px 10px", borderRadius: "var(--radius-pildora)" }}>
      {children}
    </span>
  );
}

export function CTAPrincipal({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  // I-06: una sola acción destacada por pantalla, en negro/inversión.
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      // Marca estable para poder contar CTAs primarias en los tests: `w-full`
      // no sirve, lo usan también áreas de arrastre y otros controles.
      data-cta-primaria
      className="w-full"
      style={{
        background: disabled ? "var(--border)" : "var(--primary)",
        color: disabled ? "var(--muted-foreground)" : "var(--primary-foreground)",
        borderRadius: "var(--radius-control)",
        minHeight: 44,
        fontWeight: 600,
        fontSize: "var(--text-body)",
      }}
    >
      {children}
    </Button>
  );
}

export function CTASecundaria({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "center", fontSize: "var(--text-label)", color: "var(--muted-foreground)", marginTop: 10, background: "transparent", border: "none" }}>
      {children}
    </button>
  );
}

/**
 * `Ausencia` — la primitiva que `design-system.md` §3.2 declaraba faltante,
 * especificada por `design-system-capturas.md` §1.6 y §9.2.
 *
 * `P-09` exige que los estados de vacío **se vean distinto entre sí**. Hasta la
 * Etapa A2.3 el repositorio tenía un booleano `ausente` que los pintaba a todos
 * igual —itálica atenuada— y de paso atenuaba datos que no eran ausencias.
 *
 * **La distinción es de forma, no de color.** Los dos tratamientos se separan
 * por itálica vs. cifra tabular en ink pleno, no por un gris nuevo. Es
 * deliberado por dos razones: `P-06` prohíbe comunicar estado sólo por color, y
 * la auditoría de contraste de `globals.css` no tiene un cuarto gris medido —
 * inventarlo para distinguir una ausencia sería cambiar la paleta a ojo.
 *
 * La prueba que el propio `design-system.md` fija: **imprimir en blanco y negro
 * y que sigan siendo distinguibles.**
 *
 * El tercer estado —*no hay dato*— no tiene componente **a propósito**: en
 * Achieve la fila desaparece. Ver `TipoDeAusencia` en `view-models.ts`.
 */
export function Ausencia({
  tipo,
  children,
}: {
  tipo: TipoDeAusencia;
  /** El copy que la spec fija para esta ausencia. Nunca se inventa acá. */
  children: React.ReactNode;
}) {
  if (tipo === "CERO_REAL") {
    // Un cero real es un dato: ink pleno, peso normal, cifra tabular. Que no se
    // parezca a "no evaluado" es el punto entero del principio.
    return (
      <span data-ausencia="CERO_REAL" style={{ color: "var(--foreground)", fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>
        {children}
      </span>
    );
  }
  return (
    <span data-ausencia="SIN_ASIGNAR" style={{ color: "var(--muted-foreground)", fontStyle: "italic", fontWeight: 500 }}>
      {children}
    </span>
  );
}

/**
 * Par label/valor con hairline. El valor se dibuja según lo que sea:
 * una ausencia tipada, un dato adverso con chip, o un dato normal.
 *
 * `ausencia` y `tono` son excluyentes por construcción del tipo de dominio: un
 * dato adverso está **presente**, y atenuarlo como si faltara es la confusión
 * que la Etapa A2.3 vino a deshacer.
 */
export function Fila({
  label,
  value,
  ausencia,
  tono,
}: {
  label: string;
  value: React.ReactNode;
  ausencia?: TipoDeAusencia;
  tono?: Tono;
}) {
  return (
    <div className="flex items-center justify-between" style={{ padding: "9px 0", borderBottom: ".5px solid var(--border)", fontSize: "var(--text-body)" }}>
      <span style={{ color: "var(--muted-foreground)", fontSize: "var(--text-label)" }}>{label}</span>
      {ausencia ? (
        <Ausencia tipo={ausencia}>{value}</Ausencia>
      ) : tono ? (
        <EstadoChip tone={tono}>{value}</EstadoChip>
      ) : (
        <span style={{ fontWeight: 500, color: "var(--foreground)" }}>{value}</span>
      )}
    </div>
  );
}

/** Barra de progreso del recorrido de diseño — no es parte del producto. */
export function PasoDelRecorrido({ paso, total, label }: { paso: number; total: number; label: string }) {
  return (
    <div className="flex items-center justify-between hairline-b pb-3" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
      <span>{label}</span>
      <span>{paso} de {total}</span>
    </div>
  );
}

/**
 * Un dato académico con su procedencia — la primitiva `Provenance` que
 * `design-system.md` §3.2 declaraba faltante.
 *
 * **`source_type`, `verification_status` y el contexto de observación son tres
 * datos distintos** (AGENTS.md §2.6), y ninguna capa eleva la verificación. Por
 * eso la provenance viaja **por dato y no por pantalla**: una misma vista mezcla
 * una fecha reportada por el estudiante con una modalidad oficial, y la primera
 * no hereda la verificación de la segunda.
 *
 * `provenance: null` ⇒ la línea desaparece. Un dato sin verificación conocida
 * **no se presenta como oficial**; se omite, no se rellena.
 *
 * `data-dato` hace cada dato direccionable para poder verificar esa regla dato
 * por dato en vez de por pantalla.
 *
 * Extraída en la Etapa 0.6, cuando `UX07`, `UX08` y `UX09` ya la necesitaban:
 * tres copias de la regla de provenance es la que menos conviene dejar
 * divergir.
 */
export function Dato({
  dato,
  layout = "bloque",
}: {
  dato: DatoDeEvaluacion;
  /** `bloque` apila label y provenance; `inline` los alinea en una fila. */
  layout?: "bloque" | "inline";
}) {
  const inline = layout === "inline";
  return (
    <div
      data-dato={dato.label}
      style={inline ? { display: "inline-block", marginRight: 16 } : { padding: "6px 0" }}
    >
      <span style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
        {dato.label}:{" "}
      </span>
      <span style={{ fontSize: "var(--text-body)", color: "var(--foreground)" }}>{dato.valor}</span>
      {/* El valor anterior se muestra al lado, nunca fusionado con el vigente. */}
      {dato.anterior && (
        <span style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
          {" "}
          · antes: {dato.anterior}
        </span>
      )}
      {dato.provenance && (
        <div
          style={{
            fontSize: "var(--text-meta)",
            color: dato.enRevision ? "var(--urgencia-texto)" : "var(--muted-foreground)",
          }}
        >
          {dato.provenance}
        </div>
      )}
    </div>
  );
}
