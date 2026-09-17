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

import type { ObjetoPorAbrir } from "@/lib/domain/espacio-de-trabajo";

/**
 * ⚠️ **`materia` entró con la Enmienda 6 de
 * [ADR-088](../../docs/decisions.md#adr-088)**, y es el primer tipo de entrada
 * que **no es un destino del grafo**: es una fila del estudiante. El owner lo
 * pidió literal — *"que en la barra de búsqueda pueda buscar por materias y se
 * abra el modal"*—, y sin esto el buscador contestaba con las nueve pantallas
 * genéricas mientras la materia que se estaba escribiendo no aparecía nunca.
 */
export type TipoDeEntrada = "superficie" | "escenario" | "materia";

export interface EntradaDePaleta {
  tipo: TipoDeEntrada;
  /** Lo que se ve como título del resultado. */
  titulo: string;
  /** Contexto en una línea: la pregunta de la superficie o el propósito. */
  detalle: string;
  url: string;
  /** Texto normalizado sobre el que se busca. */
  indice: string;
  /**
   * Qué objeto abre — Enmienda 6.
   *
   * Presente ⇒ elegir esta entrada **abre una ventana** y le deja su ficha en la
   * barra. Ausente ⇒ **sólo navega**, que es lo que corresponde a un escenario:
   * `?escenario=` es el conmutador del catálogo sintético, no un objeto que se
   * pueda tener abierto.
   */
  objeto?: ObjetoPorAbrir;
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
 * La vía de escape de `I-03` son tres prefijos: `>` fuerza superficie, `#`
 * fuerza escenario y `@` fuerza materia. Hacen falta porque los tres tipos
 * colisionan de verdad — el propósito de un escenario nombra su superficie, así
 * que *"evidencia"* trae la pantalla y los escenarios de `Evidence` a la vez, y
 * una materia puede llamarse como cualquiera de las dos.
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
  } else if (crudo.startsWith("@")) {
    // La tercera vía de escape, por el tercer tipo. Los tres colisionan de
    // verdad: una materia llamada «Economía» y el escenario que la proyecta
    // comparten la palabra.
    forzado = "materia";
    termino = crudo.slice(1);
  }

  const q = normalizar(termino.trim());
  const candidatas = forzado === null ? indice : indice.filter((e) => e.tipo === forzado);
  /*
    ⚠️ **Con el campo vacío mandan las superficies, y es lo contrario que al
    buscar.** Sin nada escrito, el buscador es un menú de *a dónde puedo ir*: con
    las materias arriba, un estudiante de siete materias no vería ni una
    pantalla. Apenas escribe deja de ser un menú y pasa a ser una búsqueda, y ahí
    lo que busca por nombre son las materias.
  */
  if (q.length === 0) {
    const vacio = { superficie: 0, materia: 1, escenario: 2 } as const;
    return {
      entradas: [...candidatas].sort((a, b) => vacio[a.tipo] - vacio[b.tipo]).slice(0, limite),
      forzado,
    };
  }

  const coinciden = candidatas.filter((e) => e.indice.includes(q));
  /*
    ⚠️ **Las materias van primero cuando se escribió algo, y no por capricho.**
    Las nueve superficies son pocas y se saben de memoria; las materias son las
    que uno **busca por nombre**, que es para lo que se abre un buscador. Con las
    superficies arriba, escribir *"eco"* contestaba primero *"Compromiso"*
    —porque su pregunta dice «acuerdo»— y la materia quedaba tercera.

    Con el campo vacío el orden es el otro: ver abajo.
  */
  const orden = { materia: 0, superficie: 1, escenario: 2 } as const;
  coinciden.sort((a, b) => orden[a.tipo] - orden[b.tipo]);
  return { entradas: coinciden.slice(0, limite), forzado };
}

/**
 * Las materias del estudiante, como entradas del buscador — Enmienda 6.
 *
 * ⚠️ **La ruta la pone quien llama.** Sale del registro canónico de CTAs
 * (`CTA-001`), que es donde vive el nombre del parámetro; escribir
 * `/materia?cursada=` acá sería la segunda copia de ese contrato, y quedaría
 * vieja el día que el registro cambie.
 *
 * ⚠️ **Se indexa el nombre y nada más.** La evaluación —*"Parcial 1 · sáb 26"*—
 * tienta como texto buscable, pero haría que escribir *"parcial"* devolviera las
 * siete materias: un resultado que no distingue nada es peor que ninguno.
 */
export function entradasDeMaterias(
  materias: ReadonlyArray<{ cursadaId: string; nombre: string; evaluacion?: string | null }>,
  objetoDe: (cursadaId: string, nombre: string) => ObjetoPorAbrir | null,
): EntradaDePaleta[] {
  return materias.flatMap((m) => {
    const objeto = objetoDe(m.cursadaId, m.nombre);
    if (objeto === null) return [];
    return [
      {
        tipo: "materia" as const,
        titulo: m.nombre,
        // La próxima evaluación **como contexto y no como índice**: dice cuál es
        // esta materia hoy sin ensuciar la búsqueda.
        detalle: m.evaluacion ?? "",
        url: objeto.ruta,
        indice: normalizar(m.nombre),
        objeto,
      },
    ];
  });
}
