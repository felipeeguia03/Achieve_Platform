"use client";

/**
 * La campanita — [ADR-097 · Enmienda 1](../../docs/decisions.md#adr-097-enmienda-1).
 *
 * ⚠️ **Con avisos simulados, y lo dice.** Achieve no tiene notificaciones: el
 * owner pidió ver cómo se vería con avisos sintéticos. Salen de `GET /api/avisos`,
 * que **sólo responde con `MODO_PRUEBA=1`**; sin la variable la ruta da `404` y
 * la campanita **no se dibuja**. Adentro, el rótulo *Simulado* va siempre a la
 * vista, arriba de la lista.
 *
 * ⚠️ **Leído es estado de esta visita, no se guarda.** No hay avisos reales que
 * marcar: persistir la lectura de algo que no ocurrió sería guardar ficción.
 *
 * Tomado del software de las capturas: el número sobre la campana, el punto en
 * lo que no leíste, *Marcar todas como leídas*. Sin *Ver todas*: no hay pantalla
 * a la que llevar.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import { t } from "@/lib/content/es-AR";
import { pedir } from "@/lib/client/api";

interface Aviso {
  id: string;
  texto: string;
  detalle: string | null;
  fecha: string;
  ruta: string | null;
  leido: boolean;
}

/** *hace 15 min*, *hace 2 h*, *ayer*, *hace 4 días*. */
export function haceCuanto(fecha: string, ahora: Date = new Date()): string {
  const minutos = Math.max(0, Math.round((ahora.getTime() - new Date(fecha).getTime()) / 60_000));
  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}

/*
  ⚠️ **Los avisos de esta visita, en memoria del módulo.** Cada página monta su
  propio `Shell`: sin esto la campanita arrancaba vacía en cada pantalla,
  aparecía con la respuesta y hacía saltar la topbar. Y lo leído se perdía al
  navegar, cuando es justamente estado *de esta visita*. No se persiste.
*/
let recuerdo: Aviso[] | null = null;

export function Campanita() {
  const [avisos, setAvisosEnPantalla] = useState<Aviso[] | null>(recuerdo);
  const [abierta, setAbierta] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  const setAvisos = (cambio: (lista: Aviso[] | null) => Aviso[] | null) =>
    setAvisosEnPantalla((lista) => (recuerdo = cambio(lista)));

  useEffect(() => {
    let vigente = true;
    // `pedir` y no `useSuperficie`: el cromo nunca redirige al login.
    void pedir<{ avisos: Aviso[] }>("/api/avisos").then((r) => {
      if (!vigente || r.estado !== "OK") return;
      // Lo que ya marcaste leído en otra pantalla sigue leído.
      setAvisos((antes) => {
        const leidos = new Set((antes ?? []).filter((a) => a.leido).map((a) => a.id));
        return r.datos.avisos.map((a) => (leidos.has(a.id) ? { ...a, leido: true } : a));
      });
    });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    if (!abierta) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setAbierta(false);
      }
    }
    function afuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierta(false);
    }
    document.addEventListener("keydown", alTeclear, true);
    document.addEventListener("mousedown", afuera);
    return () => {
      document.removeEventListener("keydown", alTeclear, true);
      document.removeEventListener("mousedown", afuera);
    };
  }, [abierta]);

  // Sin respuesta —sin `MODO_PRUEBA`, sin sesión— no hay campanita.
  if (avisos === null) return null;

  const sinLeer = avisos.filter((a) => !a.leido).length;
  const marcar = (id: string | null) =>
    setAvisos((lista) => (lista ?? []).map((a) => (id === null || a.id === id ? { ...a, leido: true } : a)));

  return (
    <div ref={caja} style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setAbierta((a) => !a)}
        aria-label={sinLeer > 0 ? `${t("AVISOS.TITULO")}, ${sinLeer} ${t("AVISOS.SIN_LEER")}` : t("AVISOS.TITULO")}
        aria-haspopup="menu"
        aria-expanded={abierta}
        className="flex items-center justify-center hover:bg-[var(--muted)]"
        style={{ position: "relative", width: 36, height: 36, borderRadius: 999, color: "var(--foreground)" }}
      >
        <Bell size={18} aria-hidden />
        {sinLeer > 0 && (
          <span
            aria-hidden
            data-contador-de-avisos
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 999,
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: "16px",
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {sinLeer}
          </span>
        )}
      </button>

      {abierta && (
        <div
          role="menu"
          aria-label={t("AVISOS.TITULO")}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 380,
            maxWidth: "calc(100vw - 32px)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: ".5px solid var(--border)",
            borderRadius: "var(--radius)",
            boxShadow: "var(--sombra-menu)",
            zIndex: 60,
            overflow: "hidden",
          }}
        >
          <div className="flex items-center justify-between" style={{ gap: 8, padding: "12px 14px 8px" }}>
            <span className="flex items-center" style={{ gap: 8 }}>
              <span style={{ fontSize: "var(--text-label)", fontWeight: 600 }}>{t("AVISOS.TITULO")}</span>
              <span
                style={{
                  fontSize: "var(--text-meta)",
                  color: "var(--muted-foreground)",
                  border: ".5px dashed var(--border)",
                  borderRadius: 999,
                  padding: "1px 8px",
                }}
              >
                {t("AVISOS.SIMULADO")}
              </span>
            </span>
            {sinLeer > 0 && (
              <button
                onClick={() => marcar(null)}
                style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", padding: "4px 6px" }}
              >
                {t("AVISOS.MARCAR_LEIDOS")}
              </button>
            )}
          </div>

          <ul style={{ maxHeight: 420, overflowY: "auto", padding: "0 6px 6px" }}>
            {avisos.map((a) => (
              <li key={a.id}>
                {/*
                  ⚠️ **Un enlace, no un botón con `router.push`.** Lleva a una
                  pantalla, y así el clic del medio abre otra pestaña; además la
                  barra de arriba se sigue pudiendo montar sin router, como en sus
                  tests. Sin ruta, el aviso no navega y es sólo texto.
                */}
                <Fila aviso={a} onTocar={() => {
                  marcar(a.id);
                  setAbierta(false);
                }} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Fila({ aviso: a, onTocar }: { aviso: Aviso; onTocar: () => void }) {
  const contenido = (
    <>
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          marginTop: 6,
          borderRadius: 999,
          flexShrink: 0,
          // Ocupa lugar siempre: el texto no salta al marcarlo leído.
          background: a.leido ? "transparent" : "var(--foreground)",
        }}
      />
      <span className="min-w-0">
        <span
          className="block"
          style={{
            fontSize: "var(--text-label)",
            lineHeight: 1.45,
            fontWeight: a.leido ? 400 : 600,
            color: "var(--foreground)",
          }}
        >
          {a.texto}
        </span>
        {a.detalle && (
          <span className="block" style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
            {a.detalle}
          </span>
        )}
        <span className="block" style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)", marginTop: 2 }}>
          {haceCuanto(a.fecha)}
        </span>
      </span>
    </>
  );
  const estilo = { gap: 10, padding: "10px 8px", borderRadius: "var(--radius-control)" };
  return a.ruta ? (
    <Link role="menuitem" href={a.ruta} onClick={onTocar} className="flex w-full text-left hover:bg-[var(--muted)]" style={estilo}>
      {contenido}
    </Link>
  ) : (
    <button role="menuitem" onClick={onTocar} className="flex w-full text-left hover:bg-[var(--muted)]" style={estilo}>
      {contenido}
    </button>
  );
}
