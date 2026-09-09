"use client";

/**
 * La disponibilidad — el paso 4 del alta, [ADR-073](../../docs/decisions.md#adr-073).
 *
 * ## Las tres reglas que esta pantalla hace cumplir
 *
 * 1. **Se puede saltear, y saltear es una respuesta.** Mismo precedente que
 *    WhatsApp ([ADR-042](../../docs/decisions.md#adr-042) §2): la pregunta más
 *    difícil del alta no puede costarle el acceso a nadie. *"Todavía no sé"* va
 *    al mismo lugar que guardar, y **dice qué se pierde** en vez de castigar en
 *    silencio.
 * 2. **No agenda nada.** Declarar cuándo podés estudiar no crea `Commitment`:
 *    [ADR-064](../../docs/decisions.md#adr-064) deja el *cuándo* en el
 *    compromiso. La regla de negocio lo dice en pantalla, porque un formulario
 *    con días y horas se lee como una agenda si nadie aclara que no lo es.
 * 3. **Los minutos van primero y la hora es opcional.** *"90 minutos los
 *    martes"* es una respuesta completa; *"de 18 a 19:30"* es más precisa y no
 *    es obligatoria. Exigir la hora dejaría afuera a quien sabe cuánto tiempo
 *    tiene pero no cuándo.
 */

import { useState } from "react";

import { DIAS, t } from "@/lib/content/es-AR";
import { Button } from "@/components/ui/button";
import { CTAPrincipal, ReglaDeNegocio } from "@/components/screens/design-system";
import { ErrorDelAlta, MarcoDelAlta } from "./marco";

export interface Bloque {
  dia: number;
  minutos: number;
}

export interface DisponibilidadProps {
  onDeclarar: (bloques: Bloque[]) => Promise<{ ok: boolean; motivo?: string }>;
  onListo: () => void;
}

export function AltaDisponibilidad({ onDeclarar, onListo }: DisponibilidadProps) {
  // `minutos[d]` = 0 significa «ese día no». No es lo mismo que no haber
  // contestado: eso es saltear la pantalla entera.
  const [minutos, setMinutos] = useState<number[]>(() => Array(7).fill(0));
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = minutos.reduce((a, b) => a + b, 0);

  async function enviar(bloques: Bloque[]) {
    if (enCurso) return;
    setEnCurso(true);
    setError(null);
    const r = await onDeclarar(bloques);
    if (!r.ok) {
      setError(r.motivo ?? t("ALTA.ERROR.RED"));
      setEnCurso(false);
      return;
    }
    onListo();
  }

  return (
    <MarcoDelAlta
      paso={4}
      titulo={t("ALTA.DISPONIBILIDAD.TITULO")}
      ayuda={t("ALTA.DISPONIBILIDAD.EXPLICACION")}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {DIAS.map((nombre, dia) => (
          <label
            key={nombre}
            style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-body)" }}
          >
            <span style={{ width: 44 }}>{nombre}</span>
            <input
              type="number"
              min={0}
              step={15}
              value={minutos[dia] || ""}
              placeholder="0"
              aria-label={`Minutos el ${nombre}`}
              onChange={(e) =>
                setMinutos((m) =>
                  m.map((v, i) => (i === dia ? Math.max(0, Number(e.target.value) || 0) : v)),
                )
              }
              style={{
                width: 88,
                padding: "4px 8px",
                fontSize: "var(--text-body)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--background)",
                color: "var(--foreground)",
              }}
            />
            <span style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
              minutos
            </span>
          </label>
        ))}
      </div>

      {/*
        El total se muestra porque es el número que después reparte, y verlo acá
        es la única oportunidad de corregirlo antes de que signifique algo.
      */}
      {total > 0 && (
        <p style={{ fontSize: "var(--text-body)" }}>
          {Math.round((total / 60) * 10) / 10} h por semana
        </p>
      )}

      <ReglaDeNegocio>{t("ALTA.DISPONIBILIDAD.REGLA")}</ReglaDeNegocio>

      <ErrorDelAlta mensaje={error} />

      <CTAPrincipal
        disabled={total === 0 || enCurso}
        onClick={() =>
          enviar(
            minutos
              .map((m, dia) => ({ dia, minutos: m }))
              .filter((b) => b.minutos > 0),
          )
        }
      >
        {t("ALTA.DISPONIBILIDAD.CTA")}
      </CTAPrincipal>

      {/*
        ⚠️ Saltear **no es una salida de emergencia**: es una respuesta, y va al
        mismo lugar que guardar. Manda una lista vacía, que el backend registra
        como «contestó y no sabe» — sin eso, el alta le volvería a preguntar
        para siempre.
      */}
      <Button variant="ghost" disabled={enCurso} onClick={() => enviar([])}>
        {t("ALTA.DISPONIBILIDAD.OMITIR")}
      </Button>
      <ReglaDeNegocio>{t("ALTA.DISPONIBILIDAD.OMITIR_REGLA")}</ReglaDeNegocio>
    </MarcoDelAlta>
  );
}
