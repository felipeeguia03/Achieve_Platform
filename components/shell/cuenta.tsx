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
 * - **El avatar con su menú: nombre, email, «Administrar cuenta» y cerrar
 *   sesión.** Administrar llegó con la [Enmienda 2](../../docs/decisions.md#adr-097-enmienda-2):
 *   perfil, contraseña y dispositivos. Sigue sin crearse una cuenta desde acá
 *   ([ADR-039](../../docs/decisions.md#adr-039)).
 * - **La campanita va aparte** (`campanita.tsx`): por ahora con avisos simulados
 *   y sólo en la demo, porque no existe nada real que notificar.
 *
 * ⚠️ **Sin sesión no se dibuja nada.** El Track A corre con `?escenario=` y sin
 * backend: un avatar vacío o una institución inventada serían la demo mintiendo.
 */

import { useEffect, useRef, useState } from "react";
import { Building2, LogOut, Moon, Settings, Sun } from "lucide-react";

import { t } from "@/lib/content/es-AR";
import { alCambiarElPerfil, cerrarSesion, pedir, perfilDeSesion, type PerfilDeSesion } from "@/lib/client/api";
import { elegirTema, temaVigente } from "@/lib/client/tema";
import { AdministrarCuenta, AvatarDeCuenta, nombreCompleto } from "./administrar-cuenta";

interface Cuenta {
  institucion: string | null;
  carrera: string | null;
}

/** Dos letras del email: `felipe.eguia@…` ⇒ `FE`. Es el respaldo cuando no cargó su nombre. */
export { iniciales } from "./administrar-cuenta";

/*
  ⚠️ **Lo último que se cargó, en memoria del módulo.** Cada página monta su
  propio `Shell`, así que navegar desmonta y vuelve a montar la topbar. Sin esto
  el avatar y la institución arrancaban en `null` en cada pantalla: desaparecían
  un instante, volvían con la respuesta y empujaban al buscador — la topbar
  entera saltaba mientras la barra lateral quedaba quieta. Con esto la pantalla
  nueva la dibuja igual en el primer render y la refresca por detrás.

  No se persiste: vive lo que vive la pestaña, y cerrar sesión recarga la página.
*/
const recuerdo: { perfil: PerfilDeSesion | null; cuenta: Cuenta | null; foto: string | null } = {
  perfil: null,
  cuenta: null,
  foto: null,
};

export function CuentaDelTopbar() {
  const [perfil, setPerfil] = useState<PerfilDeSesion | null>(recuerdo.perfil);
  const [cuenta, setCuenta] = useState<Cuenta | null>(recuerdo.cuenta);
  const [foto, setFoto] = useState<string | null>(recuerdo.foto);
  const [abierto, setAbierto] = useState(false);
  const [administrando, setAdministrando] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  // El estado arranca del recuerdo, así que copiarlo de vuelta nunca pisa nada
  // con un `null` de carga; y un `null` real —borrar la foto— sí tiene que quedar.
  useEffect(() => {
    recuerdo.perfil = perfil;
    recuerdo.cuenta = cuenta;
    recuerdo.foto = foto;
  }, [perfil, cuenta, foto]);

  function cargarFoto() {
    void pedir<{ url: string | null }>("/api/cuenta/foto").then((r) => {
      if (r.estado === "OK") setFoto(r.datos.url);
    });
  }

  useEffect(() => {
    let vigente = true;
    void perfilDeSesion().then((p) => {
      if (!vigente || p === null) return;
      setPerfil(p);
      // `pedir` y no `useSuperficie`: el cromo nunca redirige al login (Enm. 6).
      void pedir<Cuenta>("/api/cuenta").then((r) => {
        if (vigente && r.estado === "OK") setCuenta(r.datos);
      });
      cargarFoto();
    });
    // Guardar el nombre en «Administrar cuenta» actualiza la sesión: el avatar lo sigue.
    const soltar = alCambiarElPerfil((p) => {
      if (!vigente) return;
      if (p !== null) setPerfil(p);
      // Sin sesión, que la próxima pantalla no dibuje la cuenta que se fue.
      else recuerdo.perfil = recuerdo.cuenta = recuerdo.foto = null;
    });
    return () => {
      vigente = false;
      soltar();
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

  if (perfil === null) return null;
  const nombre = nombreCompleto(perfil);

  const donde = [cuenta?.institucion, cuenta?.carrera].filter(Boolean).join(" · ");

  async function salir() {
    await cerrarSesion();
    // Recarga dura: cerrar sesión tiene que tirar todo el estado en memoria.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga deliberada
    window.location.assign("/login");
  }

  return (
    <div className="flex items-center min-w-0" style={{ gap: 12 }}>
      {cuenta?.institucion && (
        <>
          <span aria-hidden className="hidden lg:block" style={{ width: 1, height: 20, background: "var(--border)" }} />
          <span
            className="hidden lg:flex items-center"
            title={donde}
            style={{ gap: 8, fontSize: "var(--text-label)", color: "var(--foreground)", minWidth: 0 }}
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

      <div ref={caja} style={{ position: "relative", flexShrink: 0 }}>
        <button
          onClick={() => setAbierto((a) => !a)}
          aria-label={t("CUENTA.MENU")}
          aria-haspopup="menu"
          aria-expanded={abierto}
          className="flex items-center justify-center"
          style={{ borderRadius: 999 }}
        >
          <AvatarDeCuenta perfil={perfil} foto={foto} tamano={32} />
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
              <AvatarDeCuenta perfil={perfil} foto={foto} tamano={36} />
              <span className="min-w-0">
                <span className="block truncate" style={{ fontSize: "var(--text-label)", fontWeight: 600 }}>
                  {nombre ?? perfil.email}
                </span>
                {nombre && (
                  <span className="block truncate" style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
                    {perfil.email}
                  </span>
                )}
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

            <ItemDeMenu
              onClick={() => {
                setAbierto(false);
                setAdministrando(true);
              }}
            >
              <Settings size={16} aria-hidden />
              {t("CUENTA.ADMINISTRAR")}
            </ItemDeMenu>

            <ItemDeMenu onClick={() => void salir()}>
              <LogOut size={16} aria-hidden />
              {t("CUENTA.CERRAR_SESION")}
            </ItemDeMenu>
          </div>
        )}
      </div>

      <AdministrarCuenta
        abierto={administrando}
        onCambiarAbierto={setAdministrando}
        perfil={perfil}
        foto={foto}
        onFotoCambiada={cargarFoto}
      />
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
