/**
 * Parser de CSV, ~30 líneas y sin dependencia nueva.
 *
 * No se agrega un paquete: `npm audit` está en 0 vulnerabilidades y la versión
 * de `next` la fija un ADR — sumar un árbol de dependencias por un `split` con
 * comillas sería el peor negocio del repositorio. Soporta lo que estos archivos
 * usan: comillas dobles, comas adentro y comillas escapadas por duplicación.
 *
 * ## ⚠️ Por qué vive en su propio archivo
 *
 * Lo usan **dos** scripts: `importar-catalogo.mjs`, que ingiere los planes, y
 * `sincronizar-nombres-del-plan.mjs`, que corrige nombres sobre una base ya
 * cargada. La primera versión del segundo traía su propio `split(",")` y reventó
 * en la fila 29 de `ucc-ingenieria-en-informatica.csv`, donde un `year_source`
 * lleva una coma adentro —y la fila 70 lleva un título entero entre comillas—.
 *
 * ⚠️ **Y no se importa del importador**, aunque el parser naciera ahí: ese
 * archivo es un script, no un módulo. Importarlo **lo ejecuta entero** — se
 * probó, y salió ingiriendo planes en el medio de un simulacro.
 */
export function parsearCsv(texto) {
  const filas = [];
  let campo = "";
  let fila = [];
  let enComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else { enComillas = false; }
      } else campo += c;
      continue;
    }
    if (c === '"') { enComillas = true; continue; }
    if (c === ",") { fila.push(campo); campo = ""; continue; }
    if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; continue; }
    if (c === "\r") continue;
    campo += c;
  }
  if (campo.length > 0 || fila.length > 0) { fila.push(campo); filas.push(fila); }
  return filas.filter((f) => f.some((v) => v.trim().length > 0));
}
