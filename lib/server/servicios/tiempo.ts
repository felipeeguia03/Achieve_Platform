/**
 * Formato de tiempo para las proyecciones, **en la zona del estudiante**.
 *
 * Vive acá porque ya iba por la tercera copia: `proyeccion-hoy` y
 * `proyeccion-materia` tenían el mismo `fechaCorta` con el mismo comentario, y
 * `UX06` necesitaba las dos funciones. Tres copias de una regla de presentación
 * son tres lugares donde arreglar el próximo *"Sun 30 Aug"*.
 *
 * **El formato es presentación, no base.** La `B2.5` lo aprendió al revés: la
 * primera versión formateaba en SQL y salía en inglés y en UTC. Un compromiso
 * de las 23:00 en Córdoba no puede aparecer como del día siguiente porque el
 * servidor esté en otra zona.
 */

/** *"vie 28 ago"*. */
export function fechaCorta(instante: string, zona: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: zona,
  })
    .format(new Date(instante))
    // `Intl` da "lun, 31 ago"; el formato del producto es "lun 31 ago".
    .replace(/[.,]/g, "");
}

/** *"28 de agosto"*, para rotular un ciclo de la Bitácora. */
export function fechaLarga(instante: string, zona: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    timeZone: zona,
  }).format(new Date(instante));
}

/** *"19:04"*, en la zona del estudiante. */
export function horaCorta(instante: string, zona: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: zona,
  }).format(new Date(instante));
}

/**
 * *"hoy"* / *"ayer"* / *"hace 3 días"*.
 *
 * Compara **días de calendario en la zona del estudiante**, no diferencias de
 * milisegundos: a las 00:30 lo de anoche es "ayer", aunque hayan pasado dos
 * horas.
 */
export function haceCuanto(instante: string, ahora: string, zona: string): string {
  const dia = (iso: string) =>
    new Date(new Intl.DateTimeFormat("en-CA", { timeZone: zona }).format(new Date(iso))).getTime();
  const dias = Math.round((dia(ahora) - dia(instante)) / 86_400_000);
  if (dias <= 0) return "hoy";
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}

/**
 * *"lun 15 sep"* para una **fecha de calendario**, sin zona horaria.
 *
 * Existe porque `fechaCorta` estaba formateando `assessment.assessment_date`,
 * que es un `DATE`, y lo mostraba **un día antes**: `new Date("2026-09-15")` es
 * medianoche UTC, y en Córdoba eso son las 21:00 del 14.
 *
 * Una fecha de examen **no tiene hora ni zona**: es el 15 de septiembre en
 * cualquier lado. Convertirla es introducir una precisión que el dato no tiene
 * y equivocarse justo en el borde. Se formatea en UTC, que para un `DATE` es
 * exactamente no convertir nada.
 */
export function fechaDeCalendario(fecha: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${fecha.slice(0, 10)}T00:00:00Z`))
    .replace(/[.,]/g, "");
}
