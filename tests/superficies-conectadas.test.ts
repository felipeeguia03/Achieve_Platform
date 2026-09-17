import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Etapa B2.6 — el criterio de Done, verificado.
 *
 * > *Ninguna superficie dibuja un fixture sin `?escenario=` explícito.*
 *
 * Es la regla que la `B2.5` rompió sin que nadie se enterara: `/api/hoy`
 * respondía `401`, el `catch` dejaba los datos en `null` y la ruta caía al
 * catálogo. En un navegador, `UX01` **nunca** mostró datos persistidos, y lo
 * hacía sin decirlo. Un fallback silencioso es indistinguible del éxito, y por
 * eso hace falta un guard y no una convención.
 */

const RUTA = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

/**
 * Las superficies conectadas a la base, y las que todavía no.
 *
 * `UX06` **sí está**. Exigió crear `progress_entry`, que es la tabla que
 * `data-model.md` §10 ya declaraba y que ninguna migración había traído. No
 * adelanta la Fase B3: la B3 es el `ProgressUpdated` productivo —quién lo emite
 * y con qué causalidad (`C01-018`), qué magnitudes son mostrables (`C01-019`)—
 * y **nadie escribe esa tabla todavía**. Lo que se agregó es la estructura y su
 * invariante `I10`; la proyección se sigue negando a mostrar magnitudes.
 *
 * `UX07`–`UX09` **entraron el 1 de septiembre de 2026** con la Fase B5: la capa
 * de examen existe, el protocolo se carga como configuración versionada y las
 * tres proyectan desde Postgres. La lista de no conectadas quedó **vacía**, y el
 * bloque que la recorre se conserva a propósito: el día que aparezca una
 * superficie nueva sin backend, tiene dónde declararse en vez de aparecer
 * conectada a medias.
 *
 * ⚠️ **Lo que se mira ahora es `components/superficies/`, no `app/`** —
 * ADR-088, Enmienda 6. Las rutas quedaron con el `Shell` y nada más: la
 * superficie vive aparte porque se dibuja en dos lugares —la pantalla y la
 * ventana de su ficha— y **tiene que ser el mismo componente**. El guard sigue
 * mirando el mismo código; cambió el archivo donde está, y se apunta a los dos
 * para que mudarlo de vuelta a la ruta también rompa.
 */
const CONECTADAS = [
  { ux: "UX01", pagina: "app/(student)/hoy/page.tsx", superficie: "components/superficies/hoy.tsx", api: "/api/hoy" },
  { ux: "UX02", pagina: "app/(student)/materia/page.tsx", superficie: "components/superficies/materia.tsx", api: "/api/materia" },
  { ux: "UX03", pagina: "app/(student)/accion/page.tsx", superficie: "components/superficies/accion.tsx", api: "/api/accion" },
  { ux: "UX04", pagina: "app/(student)/compromiso/page.tsx", superficie: "components/superficies/compromiso.tsx", api: "/api/compromiso" },
  { ux: "UX05", pagina: "app/(student)/evidencia/page.tsx", superficie: "components/superficies/evidencia.tsx", api: "/api/evidencia" },
  { ux: "UX06", pagina: "app/(student)/progreso/page.tsx", superficie: "components/superficies/progreso.tsx", api: "/api/progreso" },
  { ux: "UX07", pagina: "app/(student)/examen/activar/page.tsx", superficie: "components/superficies/examen-activacion.tsx", api: "/api/examen/activacion" },
  { ux: "UX08", pagina: "app/(student)/examen/overview/page.tsx", superficie: "components/superficies/examen-overview.tsx", api: "/api/examen" },
  { ux: "UX09", pagina: "app/(student)/examen/paso/page.tsx", superficie: "components/superficies/examen-paso.tsx", api: "/api/examen/paso" },
] as const;

/** Vacía desde la Fase B5. Las nueve superficies leen de la base. */
const SIN_CONECTAR: ReadonlyArray<{ ux: string; pagina: string; falta: string }> = [];

describe("B2.6 · las superficies conectadas no caen al fixture en silencio", () => {
  for (const { ux, pagina, superficie, api } of CONECTADAS) {
    it(`${ux} pide a la API y trata el fallo como fallo`, () => {
      const src = RUTA(superficie);
      expect(src).toContain("useSuperficie");
      expect(src).toContain(api);
      // El fallo se dibuja como fallo. Sin esto vuelve el fallback silencioso.
      expect(src).toContain("NoSePudoCargar");
    });

    it(`${ux} sólo toca el catálogo dentro de la rama de \`?escenario=\``, () => {
      const src = RUTA(superficie);
      const guarda = src.indexOf("if (escenario)");
      const fixture = src.indexOf("getEscenario(");
      expect(guarda).toBeGreaterThan(-1);
      // El fixture se lee DESPUÉS de la guarda, nunca antes ni fuera de ella.
      expect(fixture).toBeGreaterThan(guarda);
    });

    /**
     * `P-12`: mientras carga va **el esqueleto** de la pantalla, no un estado ni
     * un fixture. Antes no se dibujaba nada y el contenido aparecía de golpe;
     * el esqueleto tiene su forma y no afirma nada (`tests/esqueletos.test.tsx`).
     */
    it(`${ux} dibuja su esqueleto mientras carga (P-12)`, () => {
      const src = RUTA(superficie);
      expect(src).toMatch(/respuesta\.estado === "CARGANDO"\) return <\w+Esqueleto \/>/);
      expect(src).not.toContain('"CARGANDO") return null');
    });

    /**
     * ⚠️ **La ruta no vuelve a pedir datos por su cuenta** — Enmienda 6.
     *
     * Si alguien copiara el `useSuperficie` de vuelta a `app/`, habría **dos**
     * lugares pidiendo lo mismo con reglas propias: la pantalla y la ventana
     * dejarían de mostrar lo mismo, que es exactamente lo que el componente
     * compartido vino a impedir. La ruta es el `Shell` y nada más.
     */
    it(`${ux} deja la ruta como marco: ni API ni fixture`, () => {
      const src = RUTA(pagina);
      expect(src).toContain("Shell");
      expect(src).not.toContain("useSuperficie");
      expect(src).not.toContain("getEscenario(");
    });
  }
});

describe("B2.6 · las que no se conectaron están declaradas, no olvidadas", () => {
  it("las nueve superficies del estudiante están conectadas", () => {
    expect(CONECTADAS).toHaveLength(9);
    expect(SIN_CONECTAR).toEqual([]);
  });

  /**
   * Las dos pantallas que **no** son superficies —ADR-077 y ADR-087— siguen la
   * misma regla, y desde la Enmienda 6 también se dibujan adentro de una
   * ventana. Van aparte para que el `toHaveLength(9)` de arriba siga diciendo lo
   * que dice: las superficies son nueve.
   */
  for (const [nombre, archivo, api] of [
    ["el índice de Materias", "components/superficies/materias.tsx", "/api/materias"],
    ["Formación", "components/superficies/formacion.tsx", "/api/formacion"],
  ] as const) {
    it(`${nombre} pide a la API y trata el fallo como fallo`, () => {
      const src = RUTA(archivo);
      expect(src).toContain("useSuperficie");
      expect(src).toContain(api);
      expect(src).toContain("NoSePudoCargar");
    });
  }

  for (const { ux, pagina, falta } of SIN_CONECTAR) {
    it(`${ux} sigue en fixtures — falta ${falta}`, () => {
      const src = RUTA(pagina);
      expect(src).toContain("getEscenario(");
      // Si alguien la conecta, este test rompe y obliga a moverla de lista.
      expect(src).not.toContain("useSuperficie");
    });
  }
});

describe("B2.6 · la frontera con la pantalla", () => {
  /**
   * `components/screens/` se tocó **tres veces**, todas con autorización del
   * owner: dos guardas que permiten **no** dibujar un estado de materia que
   * nadie evaluó (`product.md` §13), y la key de la Bitácora en `UX06`, que con
   * datos reales podía repetirse dentro de un ciclo —una resubmission emite dos
   * veces el mismo hecho— y hacía que React reutilizara el nodo equivocado. El
   * criterio original de la etapa era *cero cambios*; quedó registrado en el
   * roadmap por qué se relajó.
   *
   * Este test fija el alcance de esa excepción: ninguna pantalla pide datos ni
   * conoce la API, y ninguna importa un fixture.
   */
  const PANTALLAS = [
    "components/screens/hoy-autogestion.tsx",
    "components/screens/materia-cursado.tsx",
    "components/screens/proxima-accion.tsx",
    "components/screens/compromiso.tsx",
    "components/screens/evidencia.tsx",
    "components/screens/progreso-bitacora.tsx",
    "components/screens/activacion-modo-examen.tsx",
    "components/screens/overview-modo-examen.tsx",
    "components/screens/paso-de-protocolo.tsx",
  ];

  it("ninguna pantalla sabe que existe una API", () => {
    for (const p of PANTALLAS) {
      const src = RUTA(p);
      expect(src).not.toContain("useSuperficie");
      expect(src).not.toContain("/api/");
      expect(src).not.toContain("fetch(");
    }
  });

  it("ninguna pantalla importa un fixture", () => {
    for (const p of PANTALLAS) expect(RUTA(p)).not.toMatch(/from\s+"@\/lib\/fixtures/);
  });
});
