"use client";

/**
 * 🧪 LABORATORIO DESCARTABLE V3 — un diálogo modal accesible, sin librería.
 *
 * Al abrir, el foco va al primer control; Tab queda adentro; Escape cierra; al
 * cerrar, el foco vuelve a lo que lo abrió. No usa `<dialog>` porque jsdom no
 * implementa `showModal`.
 */

import { useEffect, useId, useRef } from "react";

import s from "./lab.module.css";

export function Dialogo({ titulo, children, onCerrar }: { titulo: string; children: React.ReactNode; onCerrar: () => void }) {
  const id = useId();
  const caja = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onCerrar);
  useEffect(() => {
    cerrar.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    const disparador = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const enfocables = () =>
      Array.from(caja.current?.querySelectorAll<HTMLElement>("button:not([disabled]), select, [href], [tabindex]:not([tabindex='-1'])") ?? []);
    enfocables()[0]?.focus();

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cerrar.current();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = enfocables();
      if (lista.length === 0) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener("keydown", alTeclear, true);
    return () => {
      document.removeEventListener("keydown", alTeclear, true);
      if (disparador && document.contains(disparador)) disparador.focus();
      else document.getElementById("lab3-inspector-titulo")?.focus();
    };
  }, []);

  return (
    <div className={s.velo} onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div ref={caja} className={s.dialogo} role="dialog" aria-modal="true" aria-labelledby={id} data-dialogo>
        <h2 id={id} className={s.dialogoTitulo}>
          {titulo}
        </h2>
        {children}
      </div>
    </div>
  );
}
