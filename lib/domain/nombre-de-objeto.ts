/**
 * Cómo se escribe el nombre de un objeto académico en pantalla — [ADR-088](../../docs/decisions.md#adr-088), Enmienda 5.
 *
 * Los nombres del Plan 2016 vienen **en mayúsculas** de la fuente oficial:
 * `ARQUITECTURA COMPUTADORAS`, `ANALISIS MATEMATICO I`. Así entraron y así se
 * guardan. Pero una miga que grita —*Hoy › Materias › ARQUITECTURA
 * COMPUTADORAS*— desequilibra la línea entera: el último tramo pesa más que los
 * dos anteriores juntos, cuando es el que menos navegación ofrece.
 *
 * ## ⚠️ Esto es una traducción de presentación, NO un renombre
 *
 * Es exactamente el precedente de «UCC Sistemas»: `academic_program.name`
 * conserva `INGENIERIA DE SISTEMAS` y lo que cambia es **lo que ve el
 * estudiante**. Acá igual — `curriculum_requirement.label` no se toca, no se
 * migra y no se normaliza en la base. Si alguna vez hay que auditar contra el
 * plan oficial, el dato sigue siendo el del plan oficial.
 *
 * ## Lo que NO hace, y son tres cosas
 *
 * ⚠️ **No repone acentos.** La fuente dice `ANALISIS`, y esto devuelve
 * `Analisis`, no `Análisis`. Poner la tilde sería **inventar** sobre el dato:
 * *omitir, no inventar* (`AGENTS.md` §2.7). Que los nombres oficiales vengan sin
 * acentos es un defecto de la fuente, y arreglarlo es un backfill con su
 * procedencia, no un `replace` en la capa de dibujo.
 *
 * ⚠️ **No expande abreviaturas.** `ORGANIZ. Y ADMIN. DE EMPRESAS` queda
 * `Organiz. y admin. de empresas`. Adivinar qué decía el plan es la misma
 * invención con otro nombre.
 *
 * ⚠️ **No destruye los nombres cortados.** Diez llegan con `…` desde el
 * importador y **siguen cortados**, que es lo que `CLAUDE.md` pide.
 */

/**
 * Los números romanos, que son la razón por la que esto no es un `toLowerCase()`.
 *
 * ⚠️ **`ANALISIS MATEMATICO I` no es `Analisis matematico i`.** Hay tres series
 * en el plan —Programación, Física, Análisis Matemático— y el ordinal es lo
 * único que distingue a una materia de la otra. Bajarlo a minúscula lo convierte
 * en una letra suelta que se lee como un error de tipeo.
 *
 * En castellano no existe ninguna palabra formada sólo por `I`, `V` y `X`, así
 * que la prueba no tiene falsos positivos sobre este vocabulario.
 */
const ROMANO = /^[IVX]+$/;

/**
 * Mayúscula sólo en la primera letra.
 *
 * Devuelve el texto tal cual si viene vacío: una cadena vacía es *"todavía no
 * llegó el nombre"*, y no hay nada que capitalizar.
 */
export function nombreDeObjeto(texto: string): string {
  if (texto === "") return texto;

  /*
    ⚠️ **Sólo se toca lo que está TODO en mayúsculas.** Un nombre que alguien ya
    escribió bien —`Cálculo Avanzado`, del mundo sintético— no tiene por qué
    pasar por acá y salir como `Cálculo avanzado`: eso sería romper un dato bueno
    para arreglar uno malo. La regla es angosta a propósito.
  */
  if (texto !== texto.toUpperCase()) return texto;

  const bajado = texto
    .split(" ")
    .map((palabra) => (ROMANO.test(palabra) ? palabra : palabra.toLowerCase()))
    .join(" ");

  // La primera letra, que puede no estar en la posición 0 si el nombre arranca
  // con un signo. `replace` con la primera letra que encuentre lo cubre.
  return bajado.replace(/\p{Letter}/u, (l) => l.toUpperCase());
}
