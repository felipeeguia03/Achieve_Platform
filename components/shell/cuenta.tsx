"use client";

/**
 * Dónde estudiás y quién sos, arriba a la derecha — [ADR-097](../../docs/decisions.md#adr-097).
 *
 * Tomado del software de las capturas, **con lo que Achieve puede sostener**:
 *
 * - **La institución y la carrera, fijas.** Allá hay un selector de
 *   organización con «Crear organización»; acá el estudiante pertenece a una
 *   sola institución, que decide el padrón del CRM. Un selector con una opción
 *   es un control que no controla nada.
 * - **El avatar con su menú: email y cerrar sesión.** Sin «Administrar cuenta»:
 *   no hay nada que administrar —no se crea ni se edita una cuenta desde acá
 *   ([ADR-039](../../docs/decisions.md#adr-039))—.
 * - **La campanita va aparte** (`campanita.tsx`): por ahora con avisos simulados
 *   y sólo en la demo, porque no existe nada real que notificar.
 *
 * ⚠️ **Sin sesión no se dibuja nada.** El Track A corre con `?escenario=` y sin
 * backend: un avatar vacío o una institución inventada serían la demo mintiendo.
 */

import { useEffect, useRef, useState } from "react";
import { Building2, LogOut, Moon, Sun } from "lucide-react";

import { t } from "@/lib/content/es-AR";
import { cerrarSesion, emailDeSesion, pedir } from "@/lib/client/api";
import { elegirTema, temaVigente } from "@/lib/client/tema";

interface Cuenta {
  institucion: string | null;
  carrera: string | null;
}

/** Dos letras del email: `felipe.eguia@…` ⇒ `FE`. No hay nombre en la base. */
export function iniciales(email: string): string {
  const local = email.split("@")[0] ?? "";
  const partes = local.split(/[._-]+/).filter(Boolean);
  const letras =
    partes.length >= 2 ? `${partes[0]![0]}${partes[1]![0]}` : local.slice(0, 2);
  return letras.toUpperCase();
}

export function CuentaDelTopbar() {
  const [email, setEmail] = useState<string | null>(null);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vigente = true;
    void emailDeSesion().then((e) => {
      if (!vigente || e === null) return;
      setEmail(e);
      // `pedir` y no `useSuperficie`: el cromo nunca redirige al login (Enm. 6).
      void pedir<Cuenta>("/api/cuenta").then((r) => {
        if (vigente && r.estado === "OK") setCuenta(r.datos);
      });
    });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    if (!abierto) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setAbierto(false);
      }
    }
    function afuera(e: MouseEvent) {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("keydown", alTeclear, true);
    document.addEventListener("mousedown", afuera);
    return () => {
      document.removeEventListener("keydown", alTeclear, true);
      document.removeEventListener("mousedown", afuera);
    };
  }, [abierto]);

  if (email === null) return null;

  const donde = [cuenta?.institucion, cuenta?.carrera].filter(Boolean).join(" · ");

  async function salir() {
    await cerrarSesion();
    // Recarga dura: cerrar sesión tiene que tirar todo el estado en memoria.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga deliberada
    window.location.assign("/login");
  }

  return (
    <div className="flex items-center" style={{ gap: 12, flexShrink: 0 }}>
      {cuenta?.institucion && (
        <>
          <span aria-hidden className="hidden lg:block" style={{ width: 1, height: 20, background: "var(--border)" }} />
          <span
            className="hidden lg:flex items-center"
            title={donde}
            style={{ gap: 8, fontSize: "var(--text-label)", color: "var(--foreground)", maxWidth: 280, minWidth: 0 }}
          >
            <span
              aria-hidden
              className="flex items-center justify-center"
              style={{ width: 24, height: 24, borderRadius: 6, background: "var(--muted)", flexShrink: 0 }}
            >
              <Building2 size={14} />
            </span>
            <span className="truncate">{donde}</span>
          </span>
        </>
      )}

      <div ref={caja} style={{ position: "relative" }}>
        <button
          onClick={() => setAbierto((a) => !a)}
          aria-label={t("CUENTA.MENU")}
          aria-haspopup="menu"
          aria-expanded={abierto}
          className="flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            fontSize: "var(--text-meta)",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          {iniciales(email)}
        </button>

        {abierto && (
          <div
            role="menu"
            aria-label={t("CUENTA.MENU")}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 280,
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              border: ".5px solid var(--border)",
              borderRadius: "var(--radius)",
              boxShadow: "var(--sombra-menu)",
              padding: 6,
              zIndex: 60,
            }}
          >
            <div className="flex items-center" style={{ gap: 12, padding: "10px 10px 12px" }}>
              <span
                aria-hidden
                className="flex items-center justify-center"
                style={{
                  width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                  background: "var(--primary)", color: "var(--primary-foreground)",
                  fontSize: "var(--text-label)", fontWeight: 600,
                }}
              >
                {iniciales(email)}
              </span>
              <span className="min-w-0">
                <span className="block truncate" style={{ fontSize: "var(--text-label)", fontWeight: 600 }}>
                  {email}
                </span>
                {donde && (
                  <span className="block truncate" style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
                    {donde}
                  </span>
                )}
              </span>
            </div>

            <div style={{ height: ".5px", background: "var(--border)", margin: "0 4px 4px" }} />

            {/*
              El tema, también acá, **sólo en pantallas chicas**: a menos de 768 px
              el menú lateral no está, y con él se iría el único botón de tema.
            */}
            <ItemDeMenu
              className="md:hidden"
              onClick={() => {
                elegirTema(temaVigente() === "oscuro" ? "claro" : "oscuro");
                setAbierto(false);
              }}
            >
              {temaVigente() === "oscuro" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
              {t(temaVigente() === "oscuro" ? "TEMA.A_CLARO" : "TEMA.A_OSCURO")}
            </ItemDeMenu>

            <ItemDeMenu onClick={() => void salir()}>
              <LogOut size={16} aria-hidden />
              {t("CUENTA.CERRAR_SESION")}
            </ItemDeMenu>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemDeMenu({
  onClick,
  className = "",
  children,
}: {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center hover:bg-[var(--muted)] ${className}`}
      style={{
        gap: 10,
        minHeight: 40,
        padding: "8px 10px",
        fontSize: "var(--text-label)",
        color: "var(--foreground)",
        textAlign: "left",
      }}
    >
      {children}
    </button>
  );
}
