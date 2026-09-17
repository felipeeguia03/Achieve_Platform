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

import { colorDeMateria } from "@/lib/domain/color-de-materia";
import { nombreDeObjeto } from "@/lib/domain/nombre-de-objeto";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DatoDeEvaluacion, TipoDeAusencia, Tono } from "@/lib/domain/view-models";

/**
 * El título de una sección dentro de la pantalla — *«Temas del programa»*,
 * *«Qué cambia»*. **En caja normal**: era el eyebrow en mayúsculas, y el owner
 * sacó todos los rótulos en mayúsculas el 13 sep 2026 (`design-system-capturas`
 * §3.3). Los que sólo decoraban se fueron; los que distinguen un bloque de otro
 * quedaron acá.
 */
export function TituloDeSeccion({ children }: { children: React.ReactNode }) {
  return <p className="titulo-de-seccion">{enCajaNormal(children)}</p>;
}

/**
 * Un rótulo o una línea de estado que llega **TODO EN MAYÚSCULAS**, en caja
 * normal — 13 sep 2026, el owner sacó las mayúsculas de la interfaz.
 *
 * ⚠️ **Es presentación, no un renombre.** Las proyecciones y los fixtures
 * siguen devolviendo `PREPARACIÓN ACTIVA`, y sus tests lo siguen afirmando: lo
 * que cambia es lo que se dibuja, igual que `nombreDeObjeto` con los nombres del
 * plan. Así una línea de estado nueva escrita en mayúsculas no vuelve a gritar.
 *
 * Sólo toca un `string` entero en mayúsculas. Respeta los romanos (vía
 * `nombreDeObjeto`), las palabras con dígitos —`P0`— y el nombre propio
 * *Modo Examen*.
 */
export function enCajaNormal(contenido: React.ReactNode): React.ReactNode {
  if (typeof contenido !== "string" || contenido !== contenido.toUpperCase()) return contenido;
  const conDigitos = new Set(contenido.split(" ").filter((p) => /\d/.test(p)));
  return nombreDeObjeto(contenido)
    .split(" ")
    .map((p) => (conDigitos.has(p.toUpperCase()) ? p.toUpperCase() : p))
    .join(" ")
    .replace(/\bmodo examen\b/i, "Modo Examen");
}

export function EstadoGeneral({ children }: { children: React.ReactNode }) {
  return (
    <div className="hairline-b pb-2" style={{ fontSize: "var(--text-label)", fontWeight: 600, color: "var(--foreground)" }}>
      {enCajaNormal(children)}
    </div>
  );
}

/** P-01: la regla de negocio va pegada al control, no en un tooltip. */
export function ReglaDeNegocio({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", lineHeight: 1.5 }}>{children}</p>;
}

/**
 * `TituloDePanel` — la cabecera de una superficie: título, línea de contexto,
 * subcopy explicativa y acciones secundarias del objeto.
 *
 * Cierra tres diferencias de `design-system-capturas.md` §14.2:
 *
 * - **`D-01`** — ninguna de las nueve superficies tenía `<h1>`, y cuatro no
 *   tenían encabezado alguno. Un producto sin `h1` no tiene título de
 *   documento: para un lector de pantalla, la pantalla no se llama nada.
 * - **`D-02`** — falta la subcopy que dice *qué es esto y por qué importa*
 *   (§11.9.4). El hueco existe; el texto **no se inventa**. Ver `subcopy`.
 * - **`D-07`** — las acciones secundarias del objeto van **arriba a la
 *   derecha**, en píldora de borde fino con ancho de contenido (§11.9.3), no
 *   al pie centradas. Son navegación, nunca la decisión principal, así que
 *   esto **no toca** [ADR-015](../../docs/decisions.md#adr-015): la CTA
 *   primaria sigue a ancho completo al final de la columna.
 *
 * ## Sin eyebrow — 13 sep 2026
 *
 * ⚠️ **La cabecera ya no lleva la línea en mayúsculas arriba del título**, y
 * lo pidió el owner con las capturas delante: *"no sirven de nada"*. El título
 * es lo primero de la pantalla, como en el software de referencia. Lo que el
 * eyebrow decía **y era un dato** —la materia, la evaluación, la comisión— va
 * en `meta`, en caja normal, debajo del título. Una frase de propósito que no
 * decía nada que el título no dijera, se fue.
 *
 * ## Una sola medida para todas las pantallas
 *
 * ⚠️ **No hay `escala`, y no la vuelvas a agregar.** Cada pantalla le pasaba la
 * suya —20, 22, 30— y el título saltaba de tamaño y de altura al cambiar de
 * sección: la identidad del software de las capturas es que el título cae
 * **siempre en el mismo lugar y con el mismo cuerpo**. El título es
 * `--text-title-lg` (§3.1: *uno solo por pantalla*), y la cabecera lleva su
 * propia distancia hasta el contenido (32 px, §4.2), para que no dependa del
 * `space-y` o del `gap` de cada pantalla.
 *
 * ⚠️ **El `marginBottom` va en línea a propósito**: le gana al `space-y-*` del
 * padre. Dentro de un contenedor con `gap` se sumaría — ahí la cabecera va
 * **fuera** del contenedor con `gap`.
 */
export function TituloDePanel({
  titulo,
  meta,
  subcopy,
  acciones,
}: {
  titulo: React.ReactNode;
  /** Línea de contexto bajo el título — una fecha, una modalidad. */
  meta?: React.ReactNode;
  /**
   * Qué es este panel y por qué importa (§11.9.4). `null` ⇒ **no se dibuja**.
   * Omitir, no inventar: una subcopy escrita por la capa visual afirmaría algo
   * del dominio que ninguna spec dice.
   */
  subcopy?: string | null;
  /** Navegación del objeto, arriba a la derecha. Nunca la decisión principal. */
  acciones?: React.ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4" style={{ marginBottom: 32 }}>
      <div className="min-w-0">
        <h1
          style={{
            fontSize: "var(--text-title-lg)",
            lineHeight: 1.2,
            letterSpacing: "-0.022em",
            fontWeight: 600,
            margin: 0,
          }}
        >
          {titulo}
        </h1>
        {meta && (
          <p className="subcopy" style={{ marginTop: 6, lineHeight: 1.5 }}>
            {meta}
          </p>
        )}
        {subcopy && (
          <p className="subcopy" style={{ marginTop: meta ? 4 : 8, maxWidth: 660, lineHeight: 1.6 }}>
            {subcopy}
          </p>
        )}
      </div>
      {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
    </header>
  );
}

/**
 * Acción secundaria del objeto, en píldora de borde fino con ancho de
 * contenido (§11.9.3). Va arriba a la derecha del título, no al pie.
 */
export function AccionDeObjeto({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-pildora)",
        padding: "5px 12px",
        fontSize: "var(--text-label)",
        fontWeight: 500,
        color: "var(--foreground)",
        background: "var(--card)",
      }}
    >
      {children}
    </button>
  );
}

export function HeroCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="shadow-none" style={{ borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--card)" }}>
      <CardContent className="space-y-3 pt-5 pb-5">{children}</CardContent>
    </Card>
  );
}

/**
 * El chip de estado — **tintado**, [ADR-097](../../docs/decisions.md#adr-097).
 *
 * Era un relleno sólido del color semántico con tinta encima. Pasa a ser el
 * tratamiento del software de las capturas: **fondo suave del mismo color y
 * texto de ese tono**, con un punto adelante.
 *
 * ⚠️ **No agrega ningún color ni cambia qué estado lleva cuál.** El `tone` lo
 * sigue decidiendo la proyección, con las mismas reglas (`D6`: tres semánticos);
 * lo que cambia es la intensidad. Un chip sólido pesaba más que el título de la
 * pantalla, y con tres por pantalla el presupuesto de §5.2 se iba entero en
 * chips.
 *
 * ⚠️ **El texto se mide sobre el tinte, no sobre la tarjeta.** Por eso cada tono
 * tiene su `-tinte-texto`: el verde de texto de siempre no alcanza 4.5:1 encima
 * de su propio tinte. Lo verifica `tests/tema.test.ts` en los dos temas.
 */
export function EstadoChip({ tone, children }: { tone: "urgencia" | "exito" | "humano"; children: React.ReactNode }) {
  return (
    <span
      data-tono={tone}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: `var(--${tone}-tinte)`,
        color: `var(--${tone}-tinte-texto)`,
        fontSize: "var(--text-label)",
        fontWeight: 600,
        padding: "3px 10px",
        borderRadius: "var(--radius-pildora)",
      }}
    >
      {/* Forma además de color (`P-06`): el punto no depende de distinguir tonos. */}
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor", flexShrink: 0 }} />
      {children}
    </span>
  );
}

/**
 * La marca de color de una materia — [ADR-097](../../docs/decisions.md#adr-097).
 *
 * El color de identidad de la Enmienda 5 de ADR-088, **llevado a donde aparezca
 * una materia**: Hoy, la página de la materia, el Gantt. Es el mismo punto que
 * ya tenía el índice.
 *
 * ⚠️ **Identidad, no medida.** Sale de la cursada y es constante: la misma
 * materia tiene el mismo color con 0% o con 100% de cobertura, así que no puede
 * leerse como un juicio (ADR-075 §C1). `null` ⇒ **no se dibuja**: en el Track A
 * no hay cursada, y un color sin identidad detrás sería decoración.
 */
export function MarcaDeMateria({ cursadaId, tamano = 8 }: { cursadaId: string | null; tamano?: number }) {
  if (cursadaId === null) return null;
  return (
    <span
      aria-hidden
      data-marca-de-materia
      style={{
        display: "inline-block",
        width: tamano,
        height: tamano,
        borderRadius: 999,
        background: colorDeMateria(cursadaId),
        flexShrink: 0,
      }}
    />
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
      {/* Sin mayúsculas en un botón (§3.3): el texto puede llegar así de una proyección. */}
      {enCajaNormal(children)}
    </Button>
  );
}

export function CTASecundaria({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{ width: "100%", textAlign: "center", fontSize: "var(--text-label)", color: "var(--muted-foreground)", marginTop: 10, background: "transparent", border: "none" }}>
      {enCajaNormal(children)}
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
