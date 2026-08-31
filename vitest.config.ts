import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Sin plugins de Vite a propósito.
 *
 * `@vitejs/plugin-react` arrastra un Vite propio (rolldown) que choca a nivel
 * de tipos con el Vite que vendoriza Vitest, y `next build` type-checkea este
 * archivo. Los tests no necesitan Fast Refresh: esbuild transforma `.tsx` con
 * el `jsx: "react-jsx"` de tsconfig.json, y el alias `@/*` se declara acá.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // Ver tests/dobles/server-only.ts: el paquete real lanza bajo jsdom.
      "server-only": fileURLToPath(new URL("./tests/dobles/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "lib/**/*.test.{ts,tsx}"],
  },
});
