import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { copy } from "@/lib/content/es-AR";

/**
 * `/login` no le puede decir al estudiante que su contraseña está mal cuando lo
 * que pasó es que **no se pudo verificar**.
 *
 * El defecto era real y se veía así: con el stack de Docker apagado, la pantalla
 * mostraba *"Ese email y esa contraseña no coinciden"*. La persona revisaba sus
 * datos —que estaban bien— porque la pantalla le afirmaba algo que nadie había
 * comprobado.
 *
 * ⚠️ La causa está en la librería, no en el copy: `signInWithPassword` **no
 * lanza** cuando no llega al proveedor, devuelve el fallo por el mismo camino
 * que un rechazo de credenciales. El `catch` nunca corría.
 */
const FUENTE = readFileSync(resolve(process.cwd(), "app/login/page.tsx"), "utf8");

describe("El login distingue «no coinciden» de «no pudimos verificar»", () => {
  it("los dos mensajes existen y dicen cosas distintas", () => {
    expect(copy["LOGIN.ERROR.CREDENCIALES"]).not.toBe(copy["LOGIN.ERROR.RED"]);
    // El de red **no** habla de la contraseña: si lo hiciera, volvería a
    // acusar a los datos del estudiante con otras palabras.
    expect(copy["LOGIN.ERROR.RED"]).not.toMatch(/contraseña|email/i);
  });

  /**
   * ⚠️ **El guard mira la rama, no el texto.** Que el copy exista no sirve de
   * nada si nadie lo elige: eso era exactamente lo que pasaba —`LOGIN.ERROR.RED`
   * estaba escrito y sólo lo alcanzaba un `catch` que no se ejecutaba nunca.
   */
  it("el fallo de la librería se clasifica antes de culpar a las credenciales", () => {
    const rama = FUENTE.slice(FUENTE.indexOf("if (fallo) {"), FUENTE.indexOf("window.location.assign"));
    expect(rama).toContain("LOGIN.ERROR.RED");
    expect(rama).toContain("LOGIN.ERROR.CREDENCIALES");
    // Se decide con el `status`: sin él, o con `0`, no hubo respuesta del
    // proveedor y no hay nada que afirmar sobre las credenciales.
    expect(rama).toMatch(/status/);
  });

  it("y ante la duda no acusa: sin status conocido, es un fallo de verificación", () => {
    // La condición tiene que cubrir `undefined` **y** `0`. Con sólo uno de los
    // dos, la mitad de los fallos de red vuelve a leerse como contraseña mala.
    const rama = FUENTE.slice(FUENTE.indexOf("const status ="), FUENTE.indexOf("setEnCurso(false);"));
    expect(rama).toContain("undefined");
    expect(rama).toContain("0");
  });
});
