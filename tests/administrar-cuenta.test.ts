import { describe, expect, it } from "vitest";

import { cuandoSeUso, inicialesDePerfil, nombreCompleto } from "@/components/shell/administrar-cuenta";
import { esIpPrivada } from "@/lib/server/repositorios/geolocalizacion";
import type { RepositorioDeCuentaDeAuth } from "@/lib/server/repositorios/cuenta-de-auth";
import { describirAgente, dispositivos } from "@/lib/server/servicios/dispositivos";

/** ADR-097 · Enmienda 2 — «Administrar cuenta». */

describe("el perfil", () => {
  it("las iniciales salen del nombre si lo cargó, y del email si no", () => {
    expect(inicialesDePerfil({ email: "x@example.com", nombre: "Felipe", apellido: "Eguia" })).toBe("FE");
    expect(inicialesDePerfil({ email: "ana.paz@example.org", nombre: null, apellido: null })).toBe("AP");
  });

  it("sin nombre no hay nombre completo: se muestra el email, no un vacío", () => {
    expect(nombreCompleto({ email: "a@b.c", nombre: null, apellido: null })).toBeNull();
    expect(nombreCompleto({ email: "a@b.c", nombre: "Ana", apellido: null })).toBe("Ana");
  });
});

describe("los dispositivos", () => {
  it("lee sistema y navegador del agente, con Chrome y Safari en el orden correcto", () => {
    expect(
      describirAgente(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.2 Safari/605.1.15",
      ),
    ).toEqual({ sistema: "Macintosh", navegador: "Safari 26.6.2", movil: false });
    expect(
      describirAgente(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      ),
    ).toEqual({ sistema: "Windows", navegador: "Chrome 143.0.0.0", movil: false });
  });

  it("un script se nombra tal cual, sin inventarle un sistema", () => {
    expect(describirAgente("curl/8.7.1")).toEqual({ sistema: null, navegador: "curl 8.7.1", movil: false });
  });

  it("una IP de red local no sale a geolocalizarse", () => {
    for (const ip of ["127.0.0.1", "192.168.65.1", "10.0.0.4", "172.20.1.1", "::1"]) {
      expect(esIpPrivada(ip), ip).toBe(true);
    }
    expect(esIpPrivada("190.227.144.182")).toBe(false);
    expect(esIpPrivada("172.32.0.1")).toBe(false);
  });

  it("este dispositivo va primero y lo marca la sesión del token", async () => {
    const cuenta: RepositorioDeCuentaDeAuth = {
      sesiones: async () => [
        { id: "vieja", userAgent: "curl/8.7.1", ip: "190.227.144.182", ultimoUso: "2026-09-13T20:00:00Z" },
        { id: "esta", userAgent: null, ip: "192.168.65.1", ultimoUso: "2026-09-12T10:00:00Z" },
      ],
      cerrarSesion: async () => true,
      firmarSubidaDeFoto: async () => ({ url: "" }),
      firmarLecturaDeFoto: async () => null,
    };
    const filas = await dispositivos(
      { cuenta, ubicacion: async () => ({ ciudad: "Córdoba", pais: "Argentina" }) },
      "usuario",
      "esta",
    );
    expect(filas.map((f) => [f.id, f.esEste])).toEqual([
      ["esta", true],
      ["vieja", false],
    ]);
    expect(filas[1]).toMatchObject({ ciudad: "Córdoba", pais: "Argentina" });
  });

  it("dice cuándo se usó en palabras", () => {
    const ahora = new Date(2026, 8, 13, 18, 0);
    expect(cuandoSeUso(new Date(2026, 8, 13, 16, 40).toISOString(), ahora)).toMatch(/^Hoy a las 16:40/);
    expect(cuandoSeUso(new Date(2026, 8, 12, 9, 5).toISOString(), ahora)).toMatch(/^Ayer a las 9:05/);
    expect(cuandoSeUso(new Date(2026, 8, 11, 8, 35).toISOString(), ahora)).toMatch(/^viernes a las 8:35/);
  });
});
