"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

import { t } from "@/lib/content/es-AR";
import { clienteDeNavegador } from "@/lib/client/supabase-navegador";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * El ingreso — **la única superficie fuera de las nueve del spec**.
 *
 * ## Por qué existe, y por qué no es `UX10`
 *
 * El spec define nueve superficies y ninguna es un login; hasta acá la sesión
 * se daba de alta fuera del producto, con `npm run db:sesion`, y el navegador
 * entraba solo con credenciales de entorno. Esto lo autorizó el Product Owner y
 * queda registrado en [ADR-039](../../docs/decisions.md#adr-039).
 *
 * **No entra al registro canónico de navegación.** No es una superficie de
 * producto: es la puerta. `lib/navigation/` sigue teniendo nueve nodos y
 * `UX10` sigue sin existir — hay guard que lo verifica.
 *
 * ## Lo que deliberadamente NO hace
 *
 * **No ofrece crear una cuenta.** Quién puede entrar lo decide el padrón del
 * CRM (`POST /api/service/v1/authorize`), y la Plataforma hace cumplir esa
 * decisión: un alta desde este formulario sería exactamente el camino por el
 * que una persona real entraría sin padrón, con
 * [ADR-006](../../docs/decisions.md#adr-006) todavía `PROVISIONAL`. Tampoco hay
 * recuperación de contraseña por el mismo motivo: manda un mail a una persona.
 *
 * **No dice si el email existe.** Credenciales incorrectas y email inexistente
 * dan el mismo mensaje: distinguirlos convierte el formulario en un detector de
 * quién está en el padrón.
 */
function Formulario() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A dónde volver después de entrar. Sólo rutas internas: un `?volver=` con
  // destino externo convertiría el login en un redirector abierto.
  const pedido = params.get("volver");
  const destino = pedido && pedido.startsWith("/") && !pedido.startsWith("//") ? pedido : "/hoy";

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enCurso) return;
    setEnCurso(true);
    setError(null);

    try {
      const { error: fallo } = await clienteDeNavegador().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (fallo) {
        setError(t("LOGIN.ERROR.CREDENCIALES"));
        setEnCurso(false);
        return;
      }
      /*
        Navegación dura, no `router.replace`. Dos razones, y la segunda es la
        que importa: el token acaba de escribirse en `localStorage`, y una
        transición del router conserva el árbol montado —con lo que cada
        pantalla ya hubiera resuelto **sin** sesión—. Una carga limpia hace que
        todos lean la sesión nueva. Y `assign` sobre una ruta interna deja el
        login atrás sin que quede como paso intermedio del historial.
      */
      window.location.assign(destino);
    } catch {
      setError(t("LOGIN.ERROR.RED"));
      setEnCurso(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "var(--background)",
      }}
    >
      <form
        onSubmit={entrar}
        noValidate
        style={{
          width: "100%",
          maxWidth: "360px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>{t("LOGIN.TITULO")}</h1>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: 0 }}>
            {t("LOGIN.SUBCOPY")}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Label htmlFor="email">{t("LOGIN.EMAIL")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Label htmlFor="password">{t("LOGIN.PASSWORD")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/*
          `role="alert"` para que un lector de pantalla lo anuncie sin tener que
          volver a recorrer el formulario.
        */}
        {error && (
          <p role="alert" style={{ fontSize: "13px", color: "var(--urgencia-texto)", margin: 0 }}>
            {error}
          </p>
        )}

        <Button type="submit" disabled={enCurso || !email || !password}>
          {enCurso ? t("LOGIN.ENTRANDO") : t("LOGIN.CTA")}
        </Button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <Formulario />
    </Suspense>
  );
}
