/**
 * El color de una materia — **identidad, no medida**.
 *
 * ⚠️ **Por qué esto no viola [ADR-075](../../docs/decisions.md#adr-075) §C1.** La
 * psicopedagoga prohibió *"colores propios de calificación —rojo/verde— para el
 * porcentaje de actividad"*. Un color de calificación es el que **cambia con el
 * número**: verde si vas bien, rojo si vas mal. Éste sale del `cursadaId` y es
 * **constante**: la misma materia tiene el mismo color al 3% y al 100%, así que
 * no puede leerse como un juicio sobre la cifra.
 *
 * **Es lo que hace que la pantalla se vea como el mockup sin afirmar nada**: el
 * color distingue materias, que es para lo que el owner lo quería.
 *
 * ⚠️ **Queda para confirmar con la psicopedagoga.** Que un color sea constante
 * no garantiza que nadie lo lea como semáforo, y esa lectura es empírica: se
 * prueba con personas, no se decide acá.
 *
 * ## Por qué vive acá y no adentro del índice — Enmienda 5
 *
 * ⚠️ **Porque ahora lo usan dos superficies, y el color tiene que ser EL MISMO.**
 * Vivía privado en `components/screens/indice-de-materias.tsx`; el escritorio lo
 * necesita para que la ventana de Álgebra tenga el color que Álgebra tiene en la
 * lista. Copiar la función sería garantizar que el día que alguien toque la
 * paleta, la lista y las ventanas digan **colores distintos para la misma
 * materia** — que es peor que no tener color, porque el color estaría mintiendo
 * sobre la identidad.
 *
 * Es puro y sin React, así que entra a `lib/domain/` sin traer nada consigo.
 */

/**
 * ⚠️ **Seis tonos apagados, y ninguno es de los semánticos.** `--exito-fill`,
 * `--urgencia-fill` y `--humano` significan algo del dominio; un séptimo color
 * de identidad que coincidiera con uno de ellos haría que *"la materia verde"* y
 * *"la materia que va bien"* fueran la misma frase.
 */
const PALETA = ["#b04a2f", "#3d6b4a", "#b8862f", "#41508f", "#6b4a80", "#2f6b73"] as const;

/**
 * ⚠️ **Determinista, y por eso sirve como identidad.** La misma cursada da el
 * mismo color en la lista, en la ficha de la barra y en la ventana, entre
 * sesiones y entre dispositivos. Un color al azar por render sería ruido.
 */
export function colorDeMateria(cursadaId: string): string {
  let n = 0;
  for (const c of cursadaId) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA[n % PALETA.length] as string;
}

/**
 * El color de un objeto abierto, para la barra y las ventanas — Enmienda 5.
 *
 * `null` ⇒ **no se le pone color**, y no es un olvido.
 *
 * ⚠️ **Sólo las materias llevan color, porque sólo para ellas está razonado.**
 * El argumento que sostiene esto contra [ADR-075](../../docs/decisions.md#adr-075)
 * §C1 —*identidad, no medida*— se escribió mirando la lista de materias, y
 * **sigue pendiente de confirmar con la psicopedagoga**. Extenderlo por mi cuenta
 * a una evidencia o a un compromiso sería estirar una decisión abierta a
 * entidades que nadie miró: los estados de una `Evidence` son justamente donde un
 * color se lee como juicio.
 *
 * Hoy además es todo lo que hay: sólo `materia` se despliega en una ventana
 * (ADR-088, Enmienda 1 §6).
 */
export function colorDelObjeto(tipo: string, entidadId: string): string | null {
  return tipo === "materia" ? colorDeMateria(entidadId) : null;
}
