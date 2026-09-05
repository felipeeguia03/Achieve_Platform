"use client";

/**
 * WhatsApp y consentimiento — el tramo 2 del alta que aprobó
 * [ADR-042](../../docs/decisions.md#adr-042).
 *
 * ## Las tres reglas que esta pantalla hace cumplir
 *
 * 1. **El consentimiento es explícito, específico y no premarcado** (§1). El
 *    checkbox arranca vacío y la CTA no se habilita sola.
 * 2. **Se puede rechazar u omitir sin perder el acceso** (§2). *"Ahora no"* no
 *    es un escape de emergencia: es una respuesta, y sigue al mismo lugar.
 * 3. **La confirmación sólo dice lo que el estudiante hizo** (§5-6). *"Recibimos
 *    tu solicitud"*, nunca *"tu WhatsApp está vinculado"*, *"hay alguien
 *    asignado"* ni *"te van a escribir"*: la Plataforma **no observa** ese
 *    estado del otro lado.
 *
 * ⚠️ **No hay campo de teléfono, y no es un olvido.** `student.whatsapp` sigue
 * sin escritor mientras [ADR-006](../../docs/decisions.md#adr-006) siga
 * `PROVISIONAL`, y `whatsapp_consent` no tiene dónde guardarlo
 * ([ADR-052](../../docs/decisions.md#adr-052)). Lo que se registra hoy es la
 * decisión; el número entra el día del dictamen.
 */

import { useState } from "react";

import { t } from "@/lib/content/es-AR";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CTAPrincipal, ReglaDeNegocio } from "@/components/screens/design-system";
import { ErrorDelAlta, MarcoDelAlta } from "./marco";

export interface WhatsappProps {
  onDecidir: (decision: "GRANTED" | "DECLINED") => Promise<{ ok: boolean }>;
  onListo: () => void;
}

export function AltaWhatsapp({ onDecidir, onListo }: WhatsappProps) {
  const [acepta, setAcepta] = useState(false);
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function responder(decision: "GRANTED" | "DECLINED") {
    if (enCurso) return;
    setEnCurso(true);
    setError(null);
    const r = await onDecidir(decision);
    if (!r.ok) {
      setError(t("ALTA.ERROR.RED"));
      setEnCurso(false);
      return;
    }
    onListo();
  }

  return (
    <MarcoDelAlta
      paso={1}
      titulo={t("ALTA.WHATSAPP.TITULO")}
      ayuda={t("ALTA.WHATSAPP.EXPLICACION")}
    >
      <label
        htmlFor="consentimiento"
        style={{ display: "flex", gap: "10px", alignItems: "flex-start", cursor: "pointer" }}
      >
        {/*
          **Sin `defaultChecked`.** Un consentimiento premarcado no es un
          consentimiento: es una casilla que alguien no llegó a desmarcar.
        */}
        <Checkbox
          id="consentimiento"
          checked={acepta}
          onCheckedChange={(v) => setAcepta(v === true)}
          style={{ marginTop: "2px" }}
        />
        <span style={{ fontSize: "var(--text-body)" }}>{t("ALTA.WHATSAPP.CONSENTIMIENTO")}</span>
      </label>

      <ReglaDeNegocio>{t("ALTA.WHATSAPP.REGLA")}</ReglaDeNegocio>

      <ErrorDelAlta mensaje={error} />

      {/*
        Una sola CTA primaria. **Deshabilitada tiene tratamiento propio** (`A-08`)
        y no se esconde: el estudiante ve que existe y qué le falta para usarla.
      */}
      <CTAPrincipal disabled={!acepta || enCurso} onClick={() => responder("GRANTED")}>
        {t("ALTA.WHATSAPP.CTA")}
      </CTAPrincipal>

      {/*
        Rechazar no es una salida de emergencia: es una respuesta válida, y va al
        mismo lugar que aceptar. Por eso es un control real y no un link chico.
      */}
      <Button variant="ghost" disabled={enCurso} onClick={() => responder("DECLINED")}>
        {t("ALTA.WHATSAPP.OMITIR")}
      </Button>
    </MarcoDelAlta>
  );
}
