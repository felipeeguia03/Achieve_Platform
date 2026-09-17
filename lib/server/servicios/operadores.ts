/**
 * El puerto hacia la identidad del operador — Fase B6.
 *
 * **Quién es un operador no lo sabe Achieve.** ADR-003 decidió que Achieve es
 * la fuente canónica del dominio académico y que Dashboard_Achieve es una
 * superficie operativa que lo consume; la identidad del acompañante y su
 * asignación a estudiantes viven del lado del CRM (`C01-039`). Eso llega con el
 * **contrato de integración v2**, que lleva el CTO y todavía no existe.
 *
 * Este puerto existe para que esa ausencia **sea un lugar y no un descuido**.
 * Cuando el contrato v2 llegue, se implementa esta interfaz y se cambia una
 * línea en el composition root; nada del dominio se entera.
 *
 * **No se inventa el contrato**: el puerto no tiene forma de payload, ni
 * endpoint, ni campos del CRM. Tiene una sola pregunta —*¿este operador
 * existe?*— y tres respuestas posibles, de las cuales hoy sólo se da una.
 */
export type VerificacionDeOperador =
  /** El directorio confirmó que existe y puede tomar casos en esa institución. */
  | "CONOCIDO"
  /** El directorio respondió y no lo conoce. **Es distinto de no poder preguntar.** */
  | "DESCONOCIDO"
  /** No hay directorio con quien confirmar. Hoy es la única respuesta real. */
  | "SIN_DIRECTORIO";

export interface DirectorioDeOperadores {
  verificar(institutionId: string, operatorId: string): Promise<VerificacionDeOperador>;
}

/**
 * La implementación de hoy: **no hay a quién preguntarle**.
 *
 * Devuelve `SIN_DIRECTORIO` y no `DESCONOCIDO`, y la diferencia importa: un
 * operador que el CRM rechaza es un error que hay que frenar, y uno que no se
 * puede consultar es una integración que falta. Colapsarlos haría que el día
 * que el contrato v2 llegue no se pudiera distinguir un rechazo real de la
 * ausencia del canal.
 *
 * **No bloquea abrir una intervención**, a propósito: el dominio de la Fase B6
 * no puede quedar parado detrás de un contrato que lleva otra persona. Lo que
 * hace es que la intervención quede marcada `owner_verified = false`, que
 * `circuito_de_senales()` lo cuente y que el circuito diga que falta
 * `C01-039 · contrato v2` en vez de dar el dueño por bueno.
 */
export const directorioNoDisponible: DirectorioDeOperadores = {
  async verificar() {
    return "SIN_DIRECTORIO";
  },
};
