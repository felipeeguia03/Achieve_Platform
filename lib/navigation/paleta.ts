/**
 * La búsqueda de la paleta de comandos (Etapa A2.2).
 *
 * `I-03` del manual pide **entrada polimórfica**: un solo campo que acepta
 * todos los tipos de identificador y **desambigua solo**, con una vía de escape
 * para forzar la interpretación cuando dos formatos colisionan.
 *
 * ── Por qué acá sólo está la búsqueda ──────────────────────────────────────
 *
 * `lib/navigation/` **no importa `lib/fixtures/`**: la dirección es
 * fixtures → navigation, y hay un test que lo verifica. Así que acá vive la
 * lógica —pura, sin datos— y el índice lo arma quien sí tiene los escenarios,
 * en `lib/fixtures/indice-paleta.ts`.
 *
 * **Cero red:** busca sobre un arreglo en memoria que recibe por parámetro.
 */

export type TipoDeEntrada = "superficie" | "escenario";

export interface EntradaDePaleta {
  tipo: TipoDeEntrada;
  /** Lo que se ve como título del resultado. */
  titulo: string;
  /** Contexto en una línea: la pregunta de la superficie o el propósito. */
  detalle: string;
  url: string;
  /** Texto normalizado sobre el que se busca. */
  indice: string;
}

/** Sin acentos y en minúscula, para que buscar no dependa de cómo se escriba. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface ResultadoDeBusqueda {
  entradas: EntradaDePaleta[];
  /** El filtro forzado por el prefijo, si lo hubo. */
  forzado: TipoDeEntrada | null;
}

/**
 * Busca en el índice.
 *
 * Sin prefijo desambigua sola: las superficies van primero, porque son destinos
 * y son pocas; los escenarios después, porque son variantes de un destino.
 *
 * La vía de escape de `I-03` son dos prefijos: `>` fuerza superficie, `#`
 * fuerza escenario. Hacen falta porque los dos tipos colisionan de verdad —
 * el propósito de un escenario nombra su superficie, así que *"evidencia"* trae
 * la pantalla y los escenarios de `Evidence` a la vez.
 */
export function buscarEnPaleta(
  indice: readonly EntradaDePaleta[],
  consulta: string,
  limite = 12,
): ResultadoDeBusqueda {
  const crudo = consulta.trim();
  let forzado: TipoDeEntrada | null = null;
  let termino = crudo;

  if (crudo.startsWith(">")) {
    forzado = "superficie";
    termino = crudo.slice(1);
  } else if (crudo.startsWith("#")) {
    forzado = "escenario";
    termino = crudo.slice(1);
  }

  const q = normalizar(termino.trim());
  const candidatas = forzado === null ? indice : indice.filter((e) => e.tipo === forzado);
  if (q.length === 0) return { entradas: candidatas.slice(0, limite), forzado };

  const coinciden = candidatas.filter((e) => e.indice.includes(q));
  const orden = { superficie: 0, escenario: 1 } as const;
  coinciden.sort((a, b) => orden[a.tipo] - orden[b.tipo]);
  return { entradas: coinciden.slice(0, limite), forzado };
}
