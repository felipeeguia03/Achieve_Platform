"use client";

/**
 * El estado de **fallo de carga** de una superficie (Etapa B2.6).
 *
 * ## Por qué no es una pantalla de vacío
 *
 * Vive en `components/shell/` y no en `components/screens/` porque **no es una
 * superficie del producto**: no proyecta dominio, no tiene escenario y no
 * aparece en el registro de las nueve. Es marco, como la topbar.
 *
 * Reemplaza al fallback silencioso que dejó la `B2.5`: cuando `/api/hoy`
 * respondía `401`, la ruta dibujaba el fixture `FX-DAY-BASE` y el estudiante
 * veía **el día de otro, indistinguible del suyo**. Eso contradice dos
 * invariantes que el propio repositorio declara —*omitir, no inventar* y *la UI
 * proyecta, nunca decide*—: proyectar un día que no se pudo leer es decidir que
 * el estudiante tiene uno.
 *
 * ## Por qué no reusa el copy de vacío
 *
 * `HOY.VACIO` afirma *"hoy no hay una acción recomendada"*. Es una afirmación
 * sobre el mundo y sólo vale cuando el ADE contestó. Acá **no se pudo
 * preguntar**, así que el copy dice qué pasó y no habla del estado académico.
 *
 * El copy lleva ID tipado (`C-07`) y el título va en un `h2` real: el fallo es
 * una parada legítima del recorrido con teclado, no un cartel decorativo.
 */

import { t, type CopyId } from "@/lib/content/es-AR";

/** Los tres motivos que la ruta puede distinguir. Ver `Respuesta` en `lib/client/api.ts`. */
export type MotivoDeFallo = "SIN_SESION" | "SIN_PADRON" | "ERROR";

const COPY: Record<MotivoDeFallo, { titulo: CopyId; cuerpo: CopyId }> = {
  SIN_SESION: { titulo: "CARGA.SIN_SESION.TITULO", cuerpo: "CARGA.SIN_SESION.CUERPO" },
  SIN_PADRON: { titulo: "CARGA.SIN_PADRON.TITULO", cuerpo: "CARGA.SIN_PADRON.CUERPO" },
  ERROR: { titulo: "CARGA.ERROR.TITULO", cuerpo: "CARGA.ERROR.CUERPO" },
};

export function NoSePudoCargar({
  motivo,
  onReintentar,
}: {
  motivo: MotivoDeFallo;
  /**
   * Se omite cuando reintentar no puede cambiar nada. **`SIN_PADRON` no se
   * reintenta:** la habilitación la da la institución, y ofrecer un botón que
   * no depende del estudiante es inventarle una palanca que no tiene — el mismo
   * criterio con el que `HOY.VACIO` se quedó en dos cláusulas.
   */
  onReintentar?: () => void;
}) {
  const ids = COPY[motivo];

  return (
    <section
      data-fallo={motivo}
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 24,
        background: "var(--card)",
        maxWidth: 560,
      }}
    >
      <h2 style={{ fontSize: "var(--text-body)", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
        {t(ids.titulo)}
      </h2>
      <p style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", margin: "8px 0 0" }}>
        {t(ids.cuerpo)}
      </p>
      {onReintentar && (
        <button
          onClick={onReintentar}
          style={{
            marginTop: 16,
            minHeight: 44,
            padding: "0 16px",
            border: "1px solid var(--border)",
            borderRadius: 8,
            background: "transparent",
            color: "var(--foreground)",
            fontSize: "var(--text-label)",
            fontWeight: 600,
          }}
        >
          {t("CTA.CARGA.REINTENTAR")}
        </button>
      )}
    </section>
  );
}
