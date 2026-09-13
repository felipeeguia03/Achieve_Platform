"use client";

/**
 * «Administrar cuenta» — [ADR-097 · Enmienda 2](../../docs/decisions.md#adr-097-enmienda-2).
 *
 * Tomado del software de las capturas, **con lo que Achieve puede sostener**:
 *
 * - **Perfil:** foto, nombre y apellido, que escribe el propio estudiante. El
 *   email se muestra como primario y **no se agregan otros**: quién entra lo
 *   decide el padrón del CRM por email ([ADR-039](../../docs/decisions.md#adr-039)).
 * - **Seguridad:** cambiar la contraseña y los dispositivos con sesión abierta,
 *   con IP y ciudad. **Sin «Eliminar cuenta»**: la cuenta la da de alta el
 *   padrón y el borrado espera a [ADR-006](../../docs/decisions.md#adr-006).
 */

import { useEffect, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { CircleUser, Ellipsis, Monitor, ShieldCheck, Smartphone, X } from "lucide-react";

import { t } from "@/lib/content/es-AR";
import {
  cambiarContrasena,
  enviar,
  guardarNombre,
  pedir,
  subirFotoDePerfil,
  type PerfilDeSesion,
} from "@/lib/client/api";

type Seccion = "PERFIL" | "SEGURIDAD";

interface Dispositivo {
  id: string;
  sistema: string | null;
  navegador: string | null;
  ip: string | null;
  ciudad: string | null;
  pais: string | null;
  ultimoUso: string;
  esEste: boolean;
  movil: boolean;
}

const TIPOS_DE_IMAGEN = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAXIMO_DE_IMAGEN = 10 * 1024 * 1024;

/** Dos letras del email: `felipe.eguia@…` ⇒ `FE`. */
export function iniciales(email: string): string {
  const local = email.split("@")[0] ?? "";
  const partes = local.split(/[._-]+/).filter(Boolean);
  return (partes.length >= 2 ? `${partes[0]![0]}${partes[1]![0]}` : local.slice(0, 2)).toUpperCase();
}

/** Dos letras: nombre y apellido si los cargó; si no, las del email. */
export function inicialesDePerfil(perfil: PerfilDeSesion): string {
  if (perfil.nombre && perfil.apellido) return `${perfil.nombre[0]}${perfil.apellido[0]}`.toUpperCase();
  if (perfil.nombre) return perfil.nombre.slice(0, 2).toUpperCase();
  return iniciales(perfil.email);
}

export function nombreCompleto(perfil: PerfilDeSesion): string | null {
  const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ");
  return nombre || null;
}

/** «Hoy a las 16:40», «Ayer a las 9:12», «viernes a las 8:35», «3 sep a las 8:35». */
export function cuandoSeUso(iso: string, ahora: Date = new Date()): string {
  const fecha = new Date(iso);
  const hora = `${fecha.getHours()}:${String(fecha.getMinutes()).padStart(2, "0")}`;
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((dia(ahora) - dia(fecha)) / 86_400_000);
  if (dias <= 0) return `${t("CUENTA.HOY_A_LAS")} ${hora}`;
  if (dias === 1) return `${t("CUENTA.AYER_A_LAS")} ${hora}`;
  const cuando =
    dias < 7
      ? fecha.toLocaleDateString("es-AR", { weekday: "long" })
      : fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short" }).replace(".", "");
  return `${cuando} ${t("CUENTA.A_LAS")} ${hora}`;
}

export function AvatarDeCuenta({
  perfil,
  foto,
  tamano,
}: {
  perfil: PerfilDeSesion;
  foto: string | null;
  tamano: number;
}) {
  return (
    <span
      aria-hidden
      className="flex items-center justify-center overflow-hidden"
      style={{
        width: tamano,
        height: tamano,
        borderRadius: 999,
        flexShrink: 0,
        background: "var(--primary)",
        color: "var(--primary-foreground)",
        fontSize: tamano >= 40 ? "var(--text-body)" : "var(--text-meta)",
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Storage, que vence
        <img src={foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        inicialesDePerfil(perfil)
      )}
    </span>
  );
}

export function AdministrarCuenta({
  abierto,
  onCambiarAbierto,
  perfil,
  foto,
  onFotoCambiada,
}: {
  abierto: boolean;
  onCambiarAbierto: (abierto: boolean) => void;
  perfil: PerfilDeSesion;
  foto: string | null;
  onFotoCambiada: () => void;
}) {
  const [seccion, setSeccion] = useState<Seccion>("PERFIL");

  return (
    <DialogPrimitive.Root open={abierto} onOpenChange={onCambiarAbierto}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0"
          style={{ zIndex: 70, background: "rgba(0,0,0,0.5)" }}
        />
        <DialogPrimitive.Content
          className="fixed grid grid-rows-[auto_1fr] md:grid-rows-1 md:grid-cols-[260px_1fr] overflow-hidden outline-none"
          style={{
            zIndex: 71,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(1000px, calc(100vw - 32px))",
            height: "min(640px, calc(100vh - 48px))",
            background: "var(--card)",
            color: "var(--card-foreground)",
            border: ".5px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--sombra-flotante)",
          }}
        >
          {/* La columna de secciones. En pantallas chicas se vuelve una fila. */}
          <aside
            className="flex flex-col md:border-r"
            style={{ background: "var(--muted)", borderColor: "var(--border)", padding: "24px 12px 16px" }}
          >
            <div style={{ padding: "0 12px 20px" }}>
              <DialogPrimitive.Title style={{ fontSize: "var(--text-title-lg)", fontWeight: 600, lineHeight: 1.2 }}>
                {t("CUENTA.TITULO")}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)", marginTop: 4 }}
              >
                {t("CUENTA.BAJADA")}
              </DialogPrimitive.Description>
            </div>
            <nav className="flex md:flex-col" style={{ gap: 4 }}>
              <BotonDeSeccion activa={seccion === "PERFIL"} onClick={() => setSeccion("PERFIL")}>
                <CircleUser size={16} aria-hidden />
                {t("CUENTA.PERFIL")}
              </BotonDeSeccion>
              <BotonDeSeccion activa={seccion === "SEGURIDAD"} onClick={() => setSeccion("SEGURIDAD")}>
                <ShieldCheck size={16} aria-hidden />
                {t("CUENTA.SEGURIDAD")}
              </BotonDeSeccion>
            </nav>
          </aside>

          <section className="relative overflow-y-auto" style={{ padding: "28px 32px 32px" }}>
            <DialogPrimitive.Close
              aria-label={t("CUENTA.CERRAR")}
              className="absolute flex items-center justify-center hover:bg-[var(--muted)]"
              style={{ top: 20, right: 20, width: 32, height: 32, borderRadius: 8, color: "var(--muted-foreground)" }}
            >
              <X size={16} aria-hidden />
            </DialogPrimitive.Close>

            <h3 style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, paddingBottom: 18 }}>
              {seccion === "PERFIL" ? t("CUENTA.TITULO") : t("CUENTA.SEGURIDAD")}
            </h3>

            {seccion === "PERFIL" ? (
              <SeccionPerfil perfil={perfil} foto={foto} onFotoCambiada={onFotoCambiada} />
            ) : (
              <SeccionSeguridad abierto={abierto} />
            )}
          </section>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ── Perfil ────────────────────────────────────────────────────────────────────

function SeccionPerfil({
  perfil,
  foto,
  onFotoCambiada,
}: {
  perfil: PerfilDeSesion;
  foto: string | null;
  onFotoCambiada: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(perfil.nombre ?? "");
  const [apellido, setApellido] = useState(perfil.apellido ?? "");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const selector = useRef<HTMLInputElement>(null);

  // La vista previa es un `blob:` que hay que soltar al reemplazarla o al salir.
  useEffect(() => {
    if (!vistaPrevia) return;
    return () => URL.revokeObjectURL(vistaPrevia);
  }, [vistaPrevia]);

  function empezar() {
    setNombre(perfil.nombre ?? "");
    setApellido(perfil.apellido ?? "");
    setArchivo(null);
    setVistaPrevia(null);
    setError(null);
    setEditando(true);
  }

  function elegirArchivo(elegido: File | undefined) {
    if (!elegido) return;
    if (!TIPOS_DE_IMAGEN.includes(elegido.type) || elegido.size > MAXIMO_DE_IMAGEN) {
      setError(t("CUENTA.IMAGEN_INVALIDA"));
      return;
    }
    setError(null);
    setArchivo(elegido);
    setVistaPrevia(URL.createObjectURL(elegido));
  }

  async function guardar() {
    setGuardando(true);
    setError(null);
    let bien = true;
    if (archivo) {
      const firma = await enviar<{ url: string }>("/api/cuenta/foto", {});
      bien = firma.estado === "OK" && (await subirFotoDePerfil(firma.datos.url, archivo));
      if (bien) onFotoCambiada();
    }
    if (bien && (nombre.trim() !== (perfil.nombre ?? "") || apellido.trim() !== (perfil.apellido ?? ""))) {
      bien = await guardarNombre(nombre, apellido);
    }
    setGuardando(false);
    if (!bien) return setError(t("CUENTA.NO_SE_PUDO"));
    setEditando(false);
  }

  const cambio =
    archivo !== null || nombre.trim() !== (perfil.nombre ?? "") || apellido.trim() !== (perfil.apellido ?? "");

  return (
    <>
      <Fila etiqueta={t("CUENTA.PERFIL")}>
        {editando ? (
          <Tarjeta titulo={t("CUENTA.ACTUALIZAR_PERFIL")}>
            <div className="flex items-center" style={{ gap: 16 }}>
              <AvatarDeCuenta perfil={{ ...perfil, nombre: nombre || null, apellido: apellido || null }} foto={vistaPrevia ?? foto} tamano={56} />
              <div className="min-w-0">
                <BotonSecundario onClick={() => selector.current?.click()}>{t("CUENTA.CARGAR_IMAGEN")}</BotonSecundario>
                <p style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)", marginTop: 6 }}>
                  {t("CUENTA.CARGAR_IMAGEN_AYUDA")}
                </p>
                <input
                  ref={selector}
                  type="file"
                  accept={TIPOS_DE_IMAGEN.join(",")}
                  hidden
                  onChange={(e) => {
                    elegirArchivo(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2" style={{ gap: 16, marginTop: 20 }}>
              <Campo etiqueta={t("CUENTA.NOMBRE")} valor={nombre} onCambiar={setNombre} autoComplete="given-name" autoFocus />
              <Campo etiqueta={t("CUENTA.APELLIDO")} valor={apellido} onCambiar={setApellido} autoComplete="family-name" />
            </div>

            <PieDeTarjeta
              error={error}
              guardando={guardando}
              puedeGuardar={cambio}
              onCancelar={() => setEditando(false)}
              onGuardar={() => void guardar()}
            />
          </Tarjeta>
        ) : (
          <div className="flex items-center" style={{ gap: 14 }}>
            <AvatarDeCuenta perfil={perfil} foto={foto} tamano={44} />
            <span className="truncate" style={{ fontSize: "var(--text-body)", fontWeight: 500 }}>
              {nombreCompleto(perfil) ?? perfil.email}
            </span>
            <BotonDeTexto className="ml-auto" onClick={empezar}>
              {t("CUENTA.ACTUALIZAR_PERFIL")}
            </BotonDeTexto>
          </div>
        )}
      </Fila>

      <Fila etiqueta={t("CUENTA.CORREOS")}>
        <div className="flex flex-wrap items-center" style={{ gap: 8, minHeight: 32 }}>
          <span style={{ fontSize: "var(--text-body)" }}>{perfil.email}</span>
          <Chip>{t("CUENTA.PRIMARIO")}</Chip>
        </div>
      </Fila>
    </>
  );
}

// ── Seguridad ─────────────────────────────────────────────────────────────────

function SeccionSeguridad({ abierto }: { abierto: boolean }) {
  const [editando, setEditando] = useState(false);
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [cerrarOtras, setCerrarOtras] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [dispositivos, setDispositivos] = useState<Dispositivo[] | null>(null);

  function cargarDispositivos() {
    return pedir<{ dispositivos: Dispositivo[] }>("/api/cuenta/dispositivos").then((r) =>
      setDispositivos(r.estado === "OK" ? r.datos.dispositivos : []),
    );
  }

  useEffect(() => {
    if (!abierto) return;
    let vigente = true;
    void pedir<{ dispositivos: Dispositivo[] }>("/api/cuenta/dispositivos").then((r) => {
      if (vigente) setDispositivos(r.estado === "OK" ? r.datos.dispositivos : []);
    });
    return () => {
      vigente = false;
    };
  }, [abierto]);

  async function guardar() {
    if (nueva.length < 6) return setError(t("CUENTA.CONTRASENA_CORTA"));
    if (nueva !== confirmacion) return setError(t("CUENTA.CONTRASENAS_DISTINTAS"));
    setGuardando(true);
    setError(null);
    const fallo = await cambiarContrasena(nueva, cerrarOtras);
    setGuardando(false);
    if (fallo) return setError(fallo);
    setEditando(false);
    setAviso(t("CUENTA.CONTRASENA_CAMBIADA"));
    if (cerrarOtras) void cargarDispositivos();
  }

  async function cerrarEn(id: string) {
    const r = await enviar<{ cerrada: boolean }>("/api/cuenta/dispositivos", { sesion: id });
    if (r.estado === "OK" || r.estado === "NO_ENCONTRADO") {
      setDispositivos((d) => d?.filter((x) => x.id !== id) ?? null);
    }
  }

  return (
    <>
      <Fila etiqueta={t("CUENTA.CONTRASENA")}>
        {editando ? (
          <Tarjeta titulo={t("CUENTA.CAMBIAR_CONTRASENA")}>
            <div className="grid" style={{ gap: 16 }}>
              <Campo
                etiqueta={t("CUENTA.NUEVA_CONTRASENA")}
                valor={nueva}
                onCambiar={setNueva}
                tipo="password"
                autoComplete="new-password"
                autoFocus
              />
              <Campo
                etiqueta={t("CUENTA.CONFIRMAR_CONTRASENA")}
                valor={confirmacion}
                onCambiar={setConfirmacion}
                tipo="password"
                autoComplete="new-password"
              />
              <label className="flex items-center" style={{ gap: 10, fontSize: "var(--text-label)" }}>
                <input type="checkbox" checked={cerrarOtras} onChange={(e) => setCerrarOtras(e.target.checked)} />
                {t("CUENTA.CERRAR_OTRAS")}
              </label>
            </div>
            <PieDeTarjeta
              error={error}
              guardando={guardando}
              puedeGuardar={nueva.length > 0 && confirmacion.length > 0}
              onCancelar={() => setEditando(false)}
              onGuardar={() => void guardar()}
            />
          </Tarjeta>
        ) : (
          <div className="flex items-center" style={{ gap: 14, minHeight: 32 }}>
            <span aria-hidden style={{ letterSpacing: "0.2em", fontSize: "var(--text-body)" }}>
              ••••••••••
            </span>
            {aviso && (
              <span role="status" style={{ fontSize: "var(--text-meta)", color: "var(--exito-texto)" }}>
                {aviso}
              </span>
            )}
            <BotonDeTexto
              className="ml-auto"
              onClick={() => {
                setNueva("");
                setConfirmacion("");
                setError(null);
                setAviso(null);
                setEditando(true);
              }}
            >
              {t("CUENTA.CAMBIAR_CONTRASENA")}
            </BotonDeTexto>
          </div>
        )}
      </Fila>

      <Fila etiqueta={t("CUENTA.DISPOSITIVOS")}>
        {dispositivos === null ? (
          <span style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>…</span>
        ) : (
          <ul className="grid" style={{ gap: 20 }}>
            {dispositivos.map((d) => (
              <FilaDeDispositivo key={d.id} dispositivo={d} onCerrar={() => void cerrarEn(d.id)} />
            ))}
            {dispositivos.every((d) => d.esEste) && dispositivos.length <= 1 && (
              <li style={{ fontSize: "var(--text-label)", color: "var(--muted-foreground)" }}>
                {t("CUENTA.SIN_DISPOSITIVOS")}
              </li>
            )}
          </ul>
        )}
      </Fila>
    </>
  );
}

function FilaDeDispositivo({ dispositivo: d, onCerrar }: { dispositivo: Dispositivo; onCerrar: () => void }) {
  const [menu, setMenu] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const Icono = d.movil ? Smartphone : Monitor;
  const lugar = [d.ciudad, d.pais].filter(Boolean).join(", ");

  useEffect(() => {
    if (!menu) return;
    const afuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", afuera);
    return () => document.removeEventListener("mousedown", afuera);
  }, [menu]);

  return (
    <li className="flex items-start" style={{ gap: 16 }}>
      <span
        aria-hidden
        className="flex items-center justify-center"
        style={{ width: 40, height: 40, borderRadius: 8, background: "var(--muted)", flexShrink: 0 }}
      >
        <Icono size={18} />
      </span>
      <div className="min-w-0 flex-1" style={{ fontSize: "var(--text-label)", lineHeight: 1.7 }}>
        <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
          <span style={{ fontWeight: 500, color: "var(--foreground)" }}>{d.sistema ?? t("CUENTA.OTRO_DISPOSITIVO")}</span>
          {d.esEste && <Chip>{t("CUENTA.ESTE_DISPOSITIVO")}</Chip>}
        </div>
        <div style={{ color: "var(--muted-foreground)" }}>
          {d.navegador && <div>{d.navegador}</div>}
          {d.ip && <div>{lugar ? `${d.ip} (${lugar})` : d.ip}</div>}
          <div>{cuandoSeUso(d.ultimoUso)}</div>
        </div>
      </div>
      {!d.esEste && (
        <div ref={caja} style={{ position: "relative" }}>
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label={t("CUENTA.OPCIONES_DISPOSITIVO")}
            aria-haspopup="menu"
            aria-expanded={menu}
            className="flex items-center justify-center hover:bg-[var(--muted)]"
            style={{ width: 32, height: 32, borderRadius: 8, color: "var(--muted-foreground)" }}
          >
            <Ellipsis size={16} aria-hidden />
          </button>
          {menu && (
            <div
              role="menu"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                width: 260,
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                border: ".5px solid var(--border)",
                borderRadius: "var(--radius)",
                boxShadow: "var(--sombra-menu)",
                padding: 4,
                zIndex: 1,
              }}
            >
              <button
                role="menuitem"
                onClick={() => {
                  setMenu(false);
                  onCerrar();
                }}
                className="flex w-full items-center hover:bg-[var(--muted)]"
                style={{
                  minHeight: 36,
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: "var(--text-label)",
                  color: "var(--destructive)",
                  textAlign: "left",
                }}
              >
                {t("CUENTA.CERRAR_EN_DISPOSITIVO")}
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// ── Piezas ────────────────────────────────────────────────────────────────────

function BotonDeSeccion({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={activa ? "page" : undefined}
      className={`flex items-center ${activa ? "" : "hover:bg-[var(--accent)]"}`}
      style={{
        gap: 10,
        minHeight: 40,
        padding: "8px 12px",
        borderRadius: 8,
        fontSize: "var(--text-label)",
        fontWeight: activa ? 500 : 400,
        color: activa ? "var(--foreground)" : "var(--muted-foreground)",
        background: activa ? "var(--card)" : "transparent",
        textAlign: "left",
      }}
    >
      {children}
    </button>
  );
}

function Fila({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div
      className="grid md:grid-cols-[200px_1fr]"
      style={{ gap: 12, padding: "20px 0", borderTop: ".5px solid var(--border)" }}
    >
      <div style={{ fontSize: "var(--text-label)", fontWeight: 500, paddingTop: 6 }}>{etiqueta}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Tarjeta({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ border: ".5px solid var(--border)", borderRadius: "var(--radius)", padding: 20 }}>
      <h4 style={{ fontSize: "var(--text-label)", fontWeight: 600, marginBottom: 18 }}>{titulo}</h4>
      {children}
    </div>
  );
}

function PieDeTarjeta({
  error,
  guardando,
  puedeGuardar,
  onCancelar,
  onGuardar,
}: {
  error: string | null;
  guardando: boolean;
  puedeGuardar: boolean;
  onCancelar: () => void;
  onGuardar: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end" style={{ gap: 12, marginTop: 20 }}>
      {error && (
        <span role="alert" className="mr-auto" style={{ fontSize: "var(--text-meta)", color: "var(--destructive)" }}>
          {error}
        </span>
      )}
      <BotonDeTexto onClick={onCancelar}>{t("CUENTA.CANCELAR")}</BotonDeTexto>
      <button
        onClick={onGuardar}
        disabled={!puedeGuardar || guardando}
        style={{
          minHeight: 36,
          padding: "0 16px",
          borderRadius: "var(--radius-control)",
          background: "var(--primary)",
          color: "var(--primary-foreground)",
          fontSize: "var(--text-label)",
          fontWeight: 500,
          opacity: !puedeGuardar || guardando ? 0.5 : 1,
        }}
      >
        {t("CUENTA.GUARDAR")}
      </button>
    </div>
  );
}

function Campo({
  etiqueta,
  valor,
  onCambiar,
  tipo = "text",
  autoComplete,
  autoFocus,
}: {
  etiqueta: string;
  valor: string;
  onCambiar: (v: string) => void;
  tipo?: "text" | "password";
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="grid" style={{ gap: 6 }}>
      <span style={{ fontSize: "var(--text-label)", fontWeight: 500 }}>{etiqueta}</span>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className="focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
        style={{
          minHeight: 40,
          padding: "0 12px",
          borderRadius: "var(--radius-control)",
          border: "1px solid var(--input)",
          background: "var(--background)",
          color: "var(--foreground)",
          fontSize: "var(--text-body)",
        }}
      />
    </label>
  );
}

function BotonDeTexto({
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
      onClick={onClick}
      className={`hover:bg-[var(--muted)] ${className}`}
      style={{
        minHeight: 36,
        padding: "0 12px",
        borderRadius: "var(--radius-control)",
        fontSize: "var(--text-label)",
        fontWeight: 500,
        color: "var(--foreground)",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function BotonSecundario({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-[var(--muted)]"
      style={{
        minHeight: 32,
        padding: "0 12px",
        borderRadius: "var(--radius-control)",
        border: ".5px solid var(--border)",
        fontSize: "var(--text-label)",
        color: "var(--foreground)",
      }}
    >
      {children}
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: "var(--text-meta)",
        color: "var(--muted-foreground)",
        border: ".5px solid var(--border)",
        borderRadius: 6,
        padding: "1px 6px",
        lineHeight: 1.5,
      }}
    >
      {children}
    </span>
  );
}
