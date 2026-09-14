"use client";

/**
 * **Empezar o volver a Focus** desde Hoy, Materia y Compromiso — `CTA-026`,
 * [ADR-104](../../docs/decisions.md#adr-104) §4.
 *
 * Una sola función para las tres superficies: pide al servidor y va a `/focus`.
 * **El inicio lo confirma el servidor**; navegar no inicia nada.
 *
 * Si no hay qué empezar —el compromiso ya no es iniciable, o no hay ninguno—, se
 * sigue al destino que la pantalla tenía antes. No se inventa una sesión.
 */

import type { useRouter } from "next/navigation";

import { enviar } from "@/lib/client/api";
import type { HeroLevel, HeroVariante } from "@/lib/domain/precedence";
import { rutaDeCta } from "@/lib/navigation";

export const A_FOCUS = rutaDeCta("CTA-026");

/** Los niveles del Hero cuya CTA principal es Focus: *Empezar*, *Empezar rescate*, *Continuar*. */
export function heroLlevaAFocus(nivel: HeroLevel, variante: HeroVariante | null): boolean {
  return nivel === "IN_PROGRESS" || variante === "COMMITMENT_STARTABLE" || variante === "RESCATE_STARTABLE";
}

export async function irAFocus(
  router: ReturnType<typeof useRouter>,
  pedido: { compromiso?: string | null; cursada?: string | null },
  siNoHay: string | null,
): Promise<void> {
  if (!A_FOCUS) return;
  const r = await enviar<{ sesion: { id: string } }>("/api/focus", pedido);
  // Con otra sesión abierta también se va: `/focus` muestra la abierta.
  if (r.estado === "OK" || (r.estado === "RECHAZADO" && r.codigo === "YA_HAY_OTRA_ABIERTA")) {
    router.push(A_FOCUS);
    return;
  }
  if (siNoHay) router.push(siNoHay);
}
