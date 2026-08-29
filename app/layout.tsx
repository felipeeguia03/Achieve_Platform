import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
