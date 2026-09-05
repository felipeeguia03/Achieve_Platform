"use client";

/**
 * ⚠️⚠️ **MODO PRUEBA. No es una superficie del producto.**
 *
 * El control para **reiniciar el alta** y volver a recorrerla: cómo va tomando
 * las materias, y cómo se comporta con el catálogo de otra institución. Antes de
 * esto había que bajar a la terminal y correr `npm run db:demo`, que vuelve a
 * sembrar el mundo entero.
 *
 * ── Por qué está construido así ─────────────────────────────────────────────
 *
 * **No es una superficie.** `lib/navigation/` sigue teniendo **nueve nodos** y
 * `UX10` sigue sin existir; esto no entra al registro canónico de CTAs ni al
 * grafo, igual que `/login` y que `app/alta/*`. Se monta desde los *layouts*, y
 * sólo cuando `MODO_PRUEBA=1`.
 *
 * **No compite con la acción primaria** (`I-06`). Es un dock utilitario al pie,
 * con borde punteado y etiqueta en monoespaciada: tiene que leerse como
 * andamio, no como producto. Un control de laboratorio que se ve como una CTA
 * termina en una captura de pantalla que alguien muestra en una demo.
 *
 * **No habla por red directamente.** Va por `lib/client/api.ts`, como todo lo
 * demás: el guard de `tests/track-a-rules.test.ts` dice que la presentación no
 * hace `fetch`, y esto es presentación.
 *
 * **No usa `t()`.** El copy del producto vive en `lib/content/es-AR.ts` y pasa
 * por la auditoría de conformidad (`C-01`, `C-02`). Este texto **no es copy del
 * producto** y meterlo ahí sería afirmar que sí: nadie lo va a leer nunca fuera
 * de una máquina de desarrollo.
 */

import { useEffect, useState } from "react";
import { enviar, pedir } from "@/lib/client/api";

interface Institucion {
  institucionId: string;
  nombre: string;
  carreras: number;
}

interface Catalogos {
  institucionActual: string;
  instituciones: Institucion[];
}

interface Reinicio {
  borrado: {
    cursadas: number;
    declaraciones: number;
    consentimientos: number;
    inscripciones: number;
    institucionId: string;
  };
  siguiente: string;
}

export function PanelDePrueba() {
  const [abierto, setAbierto] = useState(false);
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [destino, setDestino] = useState("");
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se piden al abrir, no al montar: el panel está en las nueve superficies y en
  // el alta, y una request en cada carga de página es ruido en todas ellas.
  useEffect(() => {
    if (!abierto || catalogos) return;
    let vivo = true;
    void pedir<Catalogos>("/api/prueba/alta").then((r) => {
      if (!vivo) return;
      if (r.estado === "OK") setCatalogos(r.datos);
      else setError(`No se pudo leer el catálogo de prueba (${r.estado})`);
    });
    return () => {
      vivo = false;
    };
  }, [abierto, catalogos]);

  async function reiniciar() {
    if (enCurso) return;
    setEnCurso(true);
    setError(null);

    const r = await enviar<Reinicio>("/api/prueba/alta", destino ? { institucion: destino } : {});

    if (r.estado !== "OK") {
      setError(
        r.estado === "RECHAZADO"
          ? r.motivo
          : r.estado === "NO_ENCONTRADO"
            ? "El modo prueba está apagado: falta MODO_PRUEBA=1"
            : `No se pudo reiniciar (${r.estado})`,
      );
      setEnCurso(false);
      return;
    }

    /*
      Navegación dura y no `router.push`, por el mismo motivo que «Salir»: hay
      que tirar **todo** el estado en memoria. Cada superficie montada tiene
      cargado el mundo del estudiante que se acaba de borrar, y un `push`
      conserva el árbol — se vería el alta nueva con los datos viejos alrededor.
    */
    window.location.assign(r.datos.siguiente);
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 50,
        maxWidth: 320,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      {abierto && (
        <div
          style={{
            width: 320,
            background: "var(--card)",
            border: "1px dashed var(--muted-foreground)",
            borderRadius: "var(--radius)",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-meta)",
              color: "var(--muted-foreground)",
              margin: 0,
            }}
          >
            MODO PRUEBA · datos sintéticos
          </p>

          <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)", margin: 0 }}>
            Borra el consentimiento, la carrera, las cursadas y lo que el ADE creó encima. No toca el
            catálogo, la sesión ni los eventos ya emitidos.
          </p>

          {/*
            El selector de institución **simula el padrón**, y por eso se dice
            así: ADR-052 decidió que el estudiante no elige universidad, y el
            alta sigue ofreciendo sólo la suya. Esto mueve la ficha del padrón
            para poder probar con otro catálogo — no le devuelve una elección.
          */}
          <label
            htmlFor="prueba-institucion"
            style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}
          >
            Padrón (simulado): a qué institución queda asignado
          </label>
          <select
            id="prueba-institucion"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            disabled={!catalogos}
            style={{
              fontSize: "var(--text-body)",
              padding: "6px 8px",
              borderRadius: "var(--radius)",
              border: ".5px solid var(--border)",
              background: "var(--background)",
              color: "var(--foreground)",
            }}
          >
            <option value="">La misma de ahora</option>
            {(catalogos?.instituciones ?? []).map((i) => (
              <option key={i.institucionId} value={i.institucionId}>
                {i.nombre} · {i.carreras} carrera{i.carreras === 1 ? "" : "s"}
                {i.institucionId === catalogos?.institucionActual ? " (actual)" : ""}
              </option>
            ))}
          </select>

          {error && (
            <p style={{ fontSize: "var(--text-meta)", color: "var(--destructive)", margin: 0 }}>
              {error}
            </p>
          )}

          <button
            onClick={reiniciar}
            disabled={enCurso}
            style={{
              fontSize: "var(--text-body)",
              padding: "8px 12px",
              borderRadius: "var(--radius)",
              border: "1px dashed var(--muted-foreground)",
              color: "var(--foreground)",
              opacity: enCurso ? 0.5 : 1,
            }}
          >
            {enCurso ? "Reiniciando…" : "Reiniciar el alta y volver a empezar"}
          </button>
        </div>
      )}

      <button
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-meta)",
          padding: "6px 10px",
          borderRadius: "var(--radius-pildora)",
          border: "1px dashed var(--muted-foreground)",
          background: "var(--card)",
          color: "var(--muted-foreground)",
        }}
      >
        {abierto ? "cerrar" : "modo prueba"}
      </button>
    </div>
  );
}
