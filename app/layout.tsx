import type { Metadata } from "next";
import "./globals.css";

import { SCRIPT_DE_TEMA } from "@/lib/client/tema";

export const metadata: Metadata = {
  title: "Achieve",
  description:
    "Acompañante académico: una acción concreta por vez, con una persona real como supervisor.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
      ⚠️ **`suppressHydrationWarning` sólo en <html>, y es por el tema** —
      ADR-097. El script de abajo pone `data-tema` antes de que React hidrate, y
      el servidor no puede saberlo: sin esto React avisaría de un atributo que
      no esperaba. No silencia nada de los hijos.
    */
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Antes de pintar: sin esto la página se ve clara un instante y salta. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_DE_TEMA }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
