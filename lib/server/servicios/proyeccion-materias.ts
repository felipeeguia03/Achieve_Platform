import { minutosPorTema, type SesionDeClase } from "@/lib/domain/duracion";
import { coberturaDeMateria, porcentajeDeHoras } from "@/lib/domain/cobertura";
import {
  ejeDelPeriodo,
  marcasDelEje,
  posicionEnEje,
  ventanaDe,
  type Eje,
} from "@/lib/domain/ventana";
import type { InsumosDeReparto } from "./proyeccion-reparto";
import { ACLARACION_DE_COBERTURA, textoDeCobertura } from "./proyeccion-materia";
import { fechaDeCalendario, haceCuanto } from "./tiempo";
import type { MateriaEnIndice, MateriasProps } from "@/lib/domain/view-models";

/**
 * El área «Materias» — [ADR-077](../../../docs/decisions.md#adr-077).
 *
 * El área que la Parte II §10 del spec nombra desde siempre —*"espacios
 * persistentes de cursado y evaluaciones"*— y que
 * [ADR-054](../../../docs/decisions.md#adr-054) dejó pendiente de decisión de
 * diseño. **No es una superficie nueva**: `UX02` sigue siendo el cursado de una
 * materia, y esto es la puerta que faltaba.
 *
 * ## Por qué lee los insumos del reparto y no una consulta propia
 *
 * Necesita exactamente lo mismo: las clases con su duración, los temas que
 * cubrieron, la carga declarada y el estado de la evidencia. Una segunda
 * consulta podría divergir, y entonces la barra del índice contradiría el
 * reparto de `HOY` **sobre la misma materia**.
 *
 * ## Lo que esta proyección tiene prohibido
 *
 * `ADR-072`, las cuatro: no lee `domain_value`, no ordena por cobertura, no
 * completa la barra sola, y **no dibuja barra cuando no hay datos**.
 */
export function proyectarMaterias(
  i: InsumosDeReparto,
  ahora: string,
  zona: string,
): MateriasProps {
  // ⚠️ **El eje se calcula una vez, sobre TODAS las materias.** Un eje por fila
  // haría que dos barras de la misma longitud representaran plazos distintos,
  // que es exactamente lo que un Gantt existe para impedir.
  const hoy = ahora.slice(0, 10);
  const eje = ejeDelPeriodo(
    hoy,
    i.materias.map((m) => m.evaluacion?.fecha).filter((f): f is string => f !== undefined),
  );

  const materias = i.materias.map((m) => aFila(m, ahora, zona, eje));

  // ⚠️ **El orden se decide acá, no en SQL.** `insumos_de_reparto()` ordena por
  // nombre porque la cola de `HOY` indexa por posición; cambiarlo allá
  // desalinearía la tarjeta de `HOY` con su reparto. Acá el orden es el que pide
  // ADR-072: **por próxima evaluación, con las sin fecha al fondo**.
  //
  // ⚠️ **Nunca por cobertura**, textual: *"ordenar por cobertura es un ranking
  // de qué tan mal vas"*.
  const orden = [...i.materias]
    .map((m, n) => ({ n, dias: m.diasHastaEvaluacion }))
    .sort((a, b) => {
      if (a.dias === b.dias) return a.n - b.n;
      if (a.dias === null) return 1;
      if (b.dias === null) return -1;
      return a.dias - b.dias;
    })
    .map((x) => materias[x.n]);

  const proximos = i.materias
    .map((m) => m.diasHastaEvaluacion)
    .filter((d): d is number => d !== null);

  return {
    fecha: fechaDeCalendario(hoy),
    eje: marcasDelEje(hoy, eje),
    // `null` ⇒ ninguna materia tiene evaluación con fecha. **No dice «0 días»**:
    // no saber cuándo y que sea hoy son cosas distintas.
    proximaEvaluacion:
      proximos.length === 0 ? null : `${Math.min(...proximos)} días para la próxima evaluación`,
    materias: orden,
    // La aclaración acompaña a la barra. Sin ninguna barra no hay nada que
    // aclarar, y ponerla igual sería explicar algo que no está en pantalla.
    aclaracion: orden.some((m) => m.cobertura !== null) ? ACLARACION_DE_COBERTURA : null,
  };
}

function aFila(
  m: InsumosDeReparto["materias"][number],
  ahora: string,
  zona: string,
  eje: Eje,
): MateriaEnIndice {
  const sesiones: SesionDeClase[] = m.clases.map((c) => ({
    tipo: c.tipo,
    minutos: c.minutos,
    temas: c.temas,
  }));

  const reparto = minutosPorTema(
    m.unidades.map((u) => ({ id: u.id, peso: u.peso })),
    sesiones,
    m.cargaDeclarada?.minutos ?? null,
  );

  // ⚠️ **La cobertura es de la materia entera, no del alcance del parcial.** El
  // reparto sí recorta por alcance —porque estima el trabajo que falta para esa
  // evaluación—, pero la barra responde otra pregunta: cuánto de la materia
  // tiene evidencia. Recortarla haría que declarar el alcance de un parcial
  // *subiera* la cobertura sin que el estudiante hiciera nada.
  const cobertura = coberturaDeMateria(
    m.unidades.map((u) => ({
      id: u.id,
      minutos: reparto.estado === "OK" ? (reparto.minutos[u.id] ?? null) : null,
      estado: u.evidencia,
    })),
  );

  const barra = porcentajeDeHoras(cobertura);
  const texto = textoDeCobertura(cobertura, m.unidades.length);

  return {
    cursadaId: m.cursadaId,
    nombre: m.nombre,
    evaluacion: rotuloDeEvaluacion(m.evaluacion),
    // `null` ⇒ sin fecha. La columna queda vacía: un `0` diría «es hoy».
    faltan: m.diasHastaEvaluacion === null ? null : `${m.diasHastaEvaluacion} d`,
    // ADR-072 §4: **sin datos no hay barra**. Una barra vacía por falta de datos
    // y una por falta de trabajo no se dibujan igual.
    cobertura: barra === null ? null : { fraccion: barra / 100, texto },
    sinCobertura: barra === null ? texto : null,
    // `null` ⇒ *"Sin avance registrado"* lo pone la pantalla. Acá no se
    // convierte en «hace 0 días» (`P-09`).
    ultimoAvance: m.ultimoAvanceEn === null ? null : haceCuanto(m.ultimoAvanceEn, ahora, zona),
    // ⚠️ **La ventana se resuelve acá, no en la pantalla.** El componente recibe
    // dos fracciones y dibuja; poner el recorte en el JSX dejaría la regla en un
    // lugar sin versión, al lado de otro que sí la tiene.
    ventana: aVentana(m, eje),
    // ⚠️ **Copy, no contrato.** Las tres etiquetas son `CTA-001` y las tres
    // navegan a la misma materia. Lo que cambia es qué le falta a esa fila.
    etiqueta:
      m.evaluacion === null ? "Agregar examen" : barra === null ? "Completar" : "Abrir",
    // Urgencia sólo con una fecha real y cercana. Sin fecha no hay urgencia que
    // afirmar, y teñir por cobertura baja sería el ranking que ADR-072 prohíbe.
    tono: m.diasHastaEvaluacion !== null && m.diasHastaEvaluacion <= DIAS_DE_URGENCIA
      ? "urgencia"
      : "neutral",
  };
}

/**
 * Cuántos días antes de una evaluación la fila se destaca.
 *
 * ⚠️ **Es un umbral de presentación, no una regla pedagógica.** No decide nada
 * sobre la preparación —eso es `preparation_readiness`, con su regla y su
 * versión— ni activa Modo Examen: sólo elige un color.
 */
const DIAS_DE_URGENCIA = 7;

/** *"Parcial 1 · escrito · mar 15 sept"*. `null` ⇒ la fila dice que no hay. */
function rotuloDeEvaluacion(
  e: InsumosDeReparto["materias"][number]["evaluacion"],
): string | null {
  if (e === null) return null;
  // ⚠️ **El tipo sólo aparece si no hay título.** «Parcial 1 · parcial» dice dos
  // veces lo mismo; el título ya lo nombra. Sin título, el tipo es lo único que
  // identifica la instancia y entonces sí va.
  //
  // Se omite lo que falta, **no se completa**: una evaluación sin título ni tipo
  // es eso, y ponerle «Examen» sería inventarle un nombre.
  return [e.titulo ?? e.tipo, e.modalidad, fechaDeCalendario(e.fecha)]
    .filter(Boolean)
    .join(" · ");
}

/** La barra del Gantt, ya en fracciones del eje. `null` ⇒ no hay ventana. */
function aVentana(
  m: InsumosDeReparto["materias"][number],
  eje: Eje,
): MateriaEnIndice["ventana"] {
  const v = ventanaDe(
    { primeraClase: m.primeraClase, fechaDeEvaluacion: m.evaluacion?.fecha ?? null },
    eje.desde,
  );
  if (v.estado !== "OK") return null;
  return {
    desde: posicionEnEje(v.inicio, eje),
    hasta: posicionEnEje(v.fin, eje),
    inicioDesconocido: v.inicioDesconocido,
  };
}
