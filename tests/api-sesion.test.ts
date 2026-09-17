import { describe, expect, it } from "vitest";
import { tokenDelHeader } from "@/lib/server/http";

/**
 * Etapa B1.3 — la parte del borde de auth que se puede probar sin base ni red.
 *
 * La resolución de sesión contra el proveedor de auth se verifica de punta a
 * punta con el stack local (`scripts/`, ver roadmap B1.3): pedirle a `npm test`
 * que levante Docker haría que las 396 dependieran de él.
 */
describe("B1.3 · lectura del header Authorization", () => {
  it("acepta Bearer con su token", () => {
    expect(tokenDelHeader("Bearer abc.def.ghi")).toBe("abc.def.ghi");
  });

  it("el esquema es case-insensitive, como manda HTTP", () => {
    expect(tokenDelHeader("bearer abc")).toBe("abc");
    expect(tokenDelHeader("BEARER abc")).toBe("abc");
  });

  /**
   * `Basic` con un JWT válido adentro es el caso que importa: si el borde sólo
   * partiera por el espacio, aceptaría un token bajo un esquema que no es el
   * suyo. Devuelve `null`, y el Controller responde 401.
   */
  it("rechaza otro esquema aunque el token sea válido", () => {
    expect(tokenDelHeader("Basic abc.def.ghi")).toBeNull();
  });

  it("rechaza header ausente, vacío o sin token", () => {
    expect(tokenDelHeader(null)).toBeNull();
    expect(tokenDelHeader("")).toBeNull();
    expect(tokenDelHeader("Bearer")).toBeNull();
    expect(tokenDelHeader("Bearer ")).toBeNull();
  });
});
