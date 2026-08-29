/**
 * Layout del rol estudiante.
 *
 * Desktop-first (ADR-014): el viewport primario de diseño y verificación es
 * desktop; 360 px es el piso obligatorio de la variante móvil. El contrato de
 * orden semántico del primer viewport (design-system.md §6.1) rige en los dos
 * anchos.
 *
 * La proporción 2/3 Hero + 1/3 contexto de §6.2 y la posición de la CTA
 * principal en desktop NO se implementan acá: dependen de una decisión que
 * sigue PENDING (design-system-capturas.md §12.7) y se cierran antes de la
 * Etapa 0.4. Hasta entonces este layout solo centra el contenido.
 */
export default function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <main className="mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
