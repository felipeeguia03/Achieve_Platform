/**
 * Los view models de UX01–UX06: la forma exacta de las props que recibe cada
 * pantalla.
 *
 * **Esta es la frontera que hace barato el Track B** (architecture.md §2.4).
 * Las pantallas nunca importan un fixture: reciben uno de estos objetos. Cuando
 * `lib/fixtures/` se reemplace por llamadas reales, la capa de presentación no
 * se toca.
 *
 * Son **proyecciones de lectura**, no entidades. La UI proyecta, nunca decide
 * (AGENTS.md §2.2): acá no hay estado de dominio que la pantalla pueda escribir.
 *
 * Convención de ausencia, transversal a todos los tipos de este archivo:
 * **`null` significa "se omite la línea entera"**, nunca "mostrar un
 * placeholder" (AGENTS.md §2.7, "omitir, no inventar").
 */

import type { HeroLevel, HeroVariante } from "./precedence";
import type { NivelOverview, VarianteOverview } from "./overview-precedence";
import type { NivelPaso, VariantePaso } from "./step-precedence";

export type Tono = "urgencia" | "exito" | "humano";

export interface Chip {
  tono: Tono;
  texto: string;
}

/**
 * Los tratamientos de ausencia, tipados. `P-09` exige que vacío, no-cargado,
 * sin-asignar y cero **se vean distinto**; un booleano `ausente` los colapsaba
 * en uno solo, que es exactamente lo que el principio prohíbe.
 *
 * `design-system-capturas.md` §1.6 observa tres tratamientos en columnas
 * contiguas de una misma tabla, y §9.2 agrega el cuarto caso. **Achieve usa
 * dos de ellos, y resuelve los otros dos por vías más fuertes:**
 *
 * | Estado de `P-09` | En Achieve |
 * |---|---|
 * | Sin asignar | `SIN_ASIGNAR` — *itálica* atenuada, con el copy que fija la spec |
 * | Cero real | `CERO_REAL` — el número, ink pleno, cifra tabular |
 * | No hay dato | **la fila no se renderiza.** Ver abajo |
 * | No cargado | **no ocurre:** el Track A es cero red |
 *
 * **Por qué no hay em-dash.** §1.6 pinta *"no hay dato"* con un em-dash en la
 * celda, porque en una tabla la columna tiene que conservar su lugar. Achieve
 * no es una tabla —§12.6 decidió tarjetas— y su regla es más fuerte:
 * **omitir, no inventar**; si falta el contrato, la línea desaparece entera.
 * Un em-dash acá sería copiar la superficie de la captura en vez de su
 * razonamiento, y además dejaría un renglón que no dice nada.
 *
 * **`CERO_REAL` no es una ausencia: es un valor.** Está en la lista porque el
 * checklist lo exige distinguible de las otras, y porque confundirlo con ellas
 * es la trampa concreta que `design-system.md` §7 marca como verificable.
 *
 * ⚠️ **Un dato adverso tampoco es una ausencia.** *"incumplido"*, *"vencido"* o
 * *"necesita atención"* son datos presentes, y §1.6 les da chip de color. Se
 * expresan con `tono`, nunca con `ausencia`.
 */
export type TipoDeAusencia = "SIN_ASIGNAR" | "CERO_REAL";

/**
 * Una fila etiqueta/valor. `ausencia` la marca como ausencia tipada, no como
 * dato: se renderiza distinto porque "no evaluado" no es un valor.
 *
 * Se llama `FilaDato` y no `Fila` para no colisionar con el componente `Fila`
 * de `components/screens/design-system.tsx`, que es quien la dibuja.
 */
/**
 * La proyección del Gantt para la pantalla.
 *
 * ⚠️ **`barra` es `null` cuando no hay estimación, y eso NO es `0`.** Una barra
 * vacía por falta de datos y una por falta de trabajo no se dibujan igual: la
 * primera no existe, la segunda está en cero. El componente no puede colapsar
 * los dos casos porque el tipo no se lo permite.
 */
export interface GanttProjection {
  /** `0..100`, ya redondeado por el dominio. `null` ⇒ sin barra. */
  barra: number | null;
  /** Siempre presente, incluso sin barra: dice algo verdadero igual. */
  pie: string;
  /** La nota al pie. `null` cuando no hay número que aclarar. */
  aclaracion: string | null;
  /**
   * Entregas que no alcanzaron el criterio — [ADR-075](../../docs/decisions.md#adr-075)
   * §C1. `0` ⇒ **la línea no se dibuja**: decir «0 pendientes» inventa una
   * tranquilidad que nadie afirmó.
   */
  enRevision: number;
  /** Temas que alcanzaron el criterio. Es la tercera medida, y **no** la barra. */
  criterioAlcanzado: number;
  /**
   * El eje temporal del panel — [ADR-085](../../docs/decisions.md#adr-085).
   *
   * **El mismo que el índice de materias**, con las mismas marcas y la misma
   * escala: `marcasDelEje` vive en `lib/domain/ventana.ts` y la usan las dos.
   */
  eje: EjeDelPeriodo;
  /** Las unidades **en el orden dictado**. La pantalla no las reordena. */
  unidades: ReadonlyArray<{
    /** `T1`, `U3`… `null` ⇒ la unidad no declara código y se muestra sin él. */
    codigo: string | null;
    nombre: string;
    /** `null` ⇒ no se sabe cuánto lleva. La fila se dibuja sin barra propia. */
    minutos: number | null;
    /**
     * Cuatro estados, no un booleano. Una entrega insuficiente es **actividad
     * registrada** y **no** criterio alcanzado (§C2).
     */
    estado: "sin_evidencia" | "enviada" | "requiere_revision" | "criterio_alcanzado";
    /**
     * El estado en copy. **Describe actividad, no conocimiento**: `dominado` y
     * `nivel` están prohibidos por [ADR-072](../../docs/decisions.md#adr-072) y
     * [ADR-075](../../docs/decisions.md#adr-075) §C1.
     */
    etiqueta: string;
    /**
     * Dónde empieza y termina la barra en el eje, `0`–`1`.
     *
     * ⚠️ **`null` ⇒ el tema NO se ubica**, y la fila lo dice. Las dos puntas son
     * hechos —la primera clase que lo dictó y la evaluación que lo evalúa— y
     * ninguna se estima: poner un tema en «+7 días» porque es el séptimo de la
     * lista sería **inventar un plan de estudio que nadie hizo**.
     */
    desde: number | null;
    hasta: number | null;
    /** Por qué no se ubica. `null` cuando sí se ubica. */
    nota: string | null;
  }>;
}

export interface FilaDato {
  label: string;
  valor: string;
  /** Qué clase de ausencia es. Ausente ⇒ el valor es un dato normal. */
  ausencia?: TipoDeAusencia;
  /** El color lo trae el dato, nunca una comparación de string en el componente. */
  tono?: Tono;
}

// ── UX01 · Hoy / Autogestión ─────────────────────────────────────────────────

export interface HeroProjection {
  /** Lo elige `selectHeroLevel`, no la pantalla. */
  nivel: HeroLevel;
  /** El discriminador de CTA dentro del nivel (ADR-017). */
  variante: HeroVariante | null;
  contexto: string | null;
  titulo: string | null;
  /** La línea `Porque:` — DD10. Sin el prefijo: el prefijo es copy. */
  razon: string | null;
  /**
   * Primer segmento de la línea operativa. Normalmente la estimación de la
   * Action ("40 min"), pero la spec usa esa misma posición para un estado
   * ("En curso") cuando la Action ya arrancó. `null` ⇒ el segmento se omite y
   * la línea empieza por la evidencia esperada.
   */
  tiempoOEstado: string | null;
  /** `null` ⇒ no se inventa el requisito de evidencia. */
  evidenciaEsperada: string | null;
  /**
   * La línea de qué pasa después. `conPrefijo` decide si lleva el rótulo
   * "Después:" delante: la spec lo usa en unos estados y en otros no, y el
   * texto es dato mientras el rótulo es copy (regla `C-07`).
   * `null` ⇒ se omite la línea entera.
   */
  queSigue: { texto: string; conPrefijo: boolean } | null;
  chip: Chip | null;
}

export interface MateriaResumen {
  /**
   * **Cuál cursada es ésta** — `course_enrollment.id`, [ADR-054](../../docs/decisions.md#adr-054).
   *
   * `VI.2` §5.2 es literal: *"al entrar desde Hoy **se abre el `CourseEnrollment`
   * seleccionado**"*. Sin este id, `CTA-001` navegaba a `/materia` sin decir a
   * cuál, y la lectura elegía por su cuenta con un `LIMIT 1`: abrir la séptima
   * materia de la cola abría la primera. **No era una ausencia — era una
   * respuesta equivocada.**
   *
   * `null` ⇒ **no hay una cursada persistida detrás**, que es el caso del Track
   * A: un escenario declara un mundo y no tiene `course_enrollment`. Ahí la CTA
   * navega sin parámetro y el backend elige, como antes. **No se inventa un id
   * para completar el tipo.**
   */
  cursadaId: string | null;
  nombre: string;
  /**
   * El estado general de la materia. **`null` ⇒ no hay lectura y la línea no se
   * dibuja** (Etapa B2.6).
   *
   * Un estado de materia es una lectura de riesgo, y el Risk Engine es la Fase
   * B6. La `B2.5` lo resolvió devolviendo `'Bajo control'` fijo desde SQL para
   * toda materia: eso es exactamente el copy que
   * [`product.md`](../../docs/product.md) §13 prohíbe —*"Bajo control" sin
   * lectura confiable del Risk Engine*—, y con datos persistidos la pantalla se
   * lo estaba afirmando al estudiante sin que nadie lo hubiera evaluado.
   *
   * En el Track A sigue siendo un `string`: ahí el estado **es dato del
   * escenario**, y un fixture que simula una lectura no afirma nada sobre nadie.
   */
  estado: string | null;
  /** `null` ⇒ "Sin avance registrado", que no es lo mismo que "hace 0 días". */
  ultimoAvance: string | null;
  tono: "neutral" | "urgencia";
}

/**
 * Lo que el estudiante ve de su propia señal — Etapa B6.6.2.
 *
 * **Es una traducción, no una segunda evaluación.** La causa canónica sale de
 * `risk_signal.reason`, que produjo la regla; esta capa la dice en castellano y
 * con el tono del producto. Si acá se decidiera algo, habría dos verdades sobre
 * el mismo estudiante.
 *
 * **Nada de esto nombra el mecanismo.** Sin `risk_signal`, sin severidad, sin
 * `risk_rule_id`, sin `rule_version`, sin estados internos y **sin identidad de
 * quien acompaña**. `VI.2` §8.6: *"nunca expone un valor interno bruto"*.
 *
 * **Y ninguna frase es un diagnóstico.** Describe lo que pasó —*"volvimos varias
 * veces sobre lo mismo"*—, no lo que el estudiante es.
 */
export interface RecuperacionProjection {
  /**
   * Los seis estados observables, **derivados de los canónicos**: el de la
   * señal y el de la intervención. No hay un lifecycle paralelo acá.
   */
  estado:
    /** No hay señal viva. La sección no se dibuja. */
    | "SIN_SENAL"
    /** Dificultad reiterada, todavía sin pedir una persona. */
    | "REITERADA"
    /** La señal pide una persona y nadie la tomó todavía. */
    | "ELEVADA"
    /** Alguien la tomó. */
    | "TOMADA"
    /** Alguien se hizo cargo y la está trabajando. */
    | "EN_CURSO"
    /** Se cerró con su resultado. **Deja de mostrarse como activa.** */
    | "RESUELTA";
  titulo: string;
  /** Por qué esto pide atención, en lenguaje llano. */
  explicacion: string;
  /**
   * La causa concreta, tal como la registró la señal. **Es el hecho**, y por eso
   * viaja aparte del texto de producto: `VI.1` §3.3 pide *"explicación útil"*, y
   * una explicación sin el hecho concreto es una frase amable y nada más.
   */
  detalle: string;
  /** Qué puede hacer ahora. `null` ⇒ no hay nada que ofrecerle todavía. */
  queSigue: string | null;
}

/**
 * El reparto de horas entre materias — [ADR-073](../../docs/decisions.md#adr-073).
 *
 * ⚠️ **Todo viaja ya formateado y `falta` es un booleano sobre dos números, no
 * un juicio.** El componente tiene prohibido convertirlo en «no vas a llegar»:
 * lo que se muestra son las dos cifras.
 */
export interface RepartoProjection {
  /** Lo declarado, en horas. `null` ⇒ no contestó la pregunta. */
  disponible: string | null;
  /** Lo que el conjunto pide por semana. `null` ⇒ nada estimable. */
  requerido: string | null;
  /** `true` = falta tiempo. `null` = no se puede saber. **No es un veredicto.** */
  falta: boolean | null;
  /**
   * En qué tramo cae la brecha — [ADR-075](../../docs/decisions.md#adr-075) §A3.
   * Decide **la jerarquía**: en `CRITICA` el mensaje va primero y el número
   * pasa a detalle secundario, porque más allá de `2×` *"el dato bruto pierde
   * capacidad de orientar por sí solo"*.
   */
  tramo: "ENTRA" | "AJUSTABLE" | "CRITICA" | "SIN_DATOS";
  /** El título del tramo, ya resuelto. Siempre presente. */
  titulo: string;
  /** Las dos cifras con su período **en las dos**. `null` en `SIN_DATOS`. */
  cifras: string | null;
  /** *"Es una estimación para organizarte; no predice tu resultado."* */
  aclaracion: string;
  /**
   * ⚠️ **Nunca vacío salvo en `ENTRA`.** §A1: *"al menos una acción bajo control
   * del estudiante"*. Un déficit sin salida *"puede sentirse como un veredicto
   * y favorecer evitación"*.
   */
  acciones: readonly string[];
  materias: ReadonlyArray<{
    cursadaId: string;
    nombre: string;
    /** `null` ⇒ no se reparte. **No es cero**: cero diría que no necesita tiempo. */
    asignado: string | null;
    motivo: "POR_URGENCIA" | "SIN_FECHA" | "SIN_ESTIMACION" | "SIN_DISPONIBILIDAD";
  }>;
  regla: string;
}

export interface HoyProps {
  fecha: string;
  estadoGeneral: string;
  hero: HeroProjection;
  /**
   * `null` ⇒ **no hay señal viva y la sección no existe**, que no es lo mismo
   * que una sección vacía diciendo "todo bien" (`P-09`).
   */
  recuperacion: RecuperacionProjection | null;
  materias: MateriaResumen[];
  /** `null` ⇒ no hay materias y la sección **no se dibuja vacía**. */
  reparto: RepartoProjection | null;
  /**
   * `CTA-009` — *ver progreso*. `null` ⇒ la Bitácora no está disponible y la
   * CTA **no se renderiza**, en vez de renderizarse deshabilitada.
   */
  verProgreso: string | null;
  /**
   * El tablero — [ADR-093](../../docs/decisions.md#adr-093), que reemplaza la
   * capa «anticipar» de [ADR-089](../../docs/decisions.md#adr-089).
   *
   * ⚠️ **Llega por separado y es opcional**, igual que antes el panorama — *"quien
   * lo quiera lo pide; quien no, no lo paga"*. Sale de `GET /api/tablero`;
   * `estado_del_dia()` no se tocó. `null` ⇒ **la capa no se dibuja**: no es un
   * tablero vacío diciendo *"no tenés nada"*, es la ausencia de una lectura que
   * puede estar cargando, haber fallado o no corresponder.
   */
  tablero: TableroProps | null;
}

// ── El tablero de `UX01` · ADR-093 ───────────────────────────────────────────

/**
 * Una tarjeta de evaluación — la *Opción 1* de ADR-093, y los datos de la *Opción 2*.
 *
 * Sale de los mismos insumos que el índice de materias: una tarjeta y una fila
 * del índice **no pueden decir cosas distintas** sobre la misma materia.
 */
export interface TarjetaDeEvaluacion {
  cursadaId: string;
  /** Ya en presentación (`nombreDeObjeto`, ADR-088 Enmienda 5). */
  nombre: string;
  /**
   * `null` ⇒ **no hay evaluación con fecha futura**, y la tarjeta lo dice.
   * `modalidad` ya traducida: el enum nunca es copy (`AGENTS.md` §2.6).
   */
  evaluacion: { rotulo: string | null; fecha: string; modalidad: string | null } | null;
  /** Días que faltan. `null` ⇒ sin fecha, **no** cero. */
  dias: number | null;
  /** *"4 d"*. `null` ⇒ la cifra no se dibuja. */
  faltan: string | null;
  /**
   * Cobertura ponderada por horas ([ADR-072](../../docs/decisions.md#adr-072)).
   * `null` ⇒ **no hay barra**, y `sinCobertura` dice por qué.
   */
  cobertura: { fraccion: number; porcentaje: number } | null;
  sinCobertura: string | null;
  /** *"hace 3 días"*. `null` ⇒ sin actividad registrada, que **no es** «hace 0 días». */
  ultimoAvance: string | null;
  tono: "neutral" | "urgencia";
}

/** Un riesgo de planificación ya redactado. Ver `lib/domain/riesgos-de-planificacion.ts`. */
export interface RiesgoProyectado {
  regla:
    | "EVALUACION_SIN_TEMAS"
    | "COBERTURA_BAJA_CERCA"
    | "SIN_ACTIVIDAD_CERCA"
    | "EVALUACIONES_ENCIMADAS"
    | "PLAN_NO_ENTRA";
  /** Quién aporta el hecho: el Academic Engine o el Personal Engine. */
  motor: "ACADEMICO" | "PERSONAL";
  titulo: string;
  /** `null` ⇒ la línea se omite. */
  detalle: string | null;
  /** `null` ⇒ el riesgo no es de una materia y **no ofrece abrir ninguna**. */
  cursadaId: string | null;
}

/** Un renglón de *Horarios* del cuadro de hoy, ya redactado. */
export interface ItemDeHorario {
  tipo: "EVALUACION" | "COMPROMISO" | "DISPONIBLE";
  /** *"18:00"* o *"18:00–20:00"*. `null` ⇒ sin hora, y **no se inventa una**. */
  hora: string | null;
  texto: string;
  cursadaId: string | null;
}

/** Una clase de hoy — [ADR-094](../../docs/decisions.md#adr-094). */
export interface ClaseDeHoy {
  cursadaId: string;
  /** *"08:00–10:00"*. */
  hora: string;
  materia: string;
  /**
   * *"Un. 6 · Aula 3.12"*. Cada parte se omite si falta; `null` ⇒ ninguna.
   * ⚠️ `Un.` es la unidad de la **última clase dada**, no la de hoy.
   */
  detalle: string | null;
}

/** Una materia de *Podés avanzar*: unidades dadas en clase y todavía sin evidencia. */
export interface AvanceDisponible {
  cursadaId: string;
  materia: string;
  /** *"Un. 1 · 2 · 3 +5"*. */
  unidades: string;
}

export interface CuadroDeHoy {
  clases: ClaseDeHoy[];
  avanzar: AvanceDisponible[];
  /** Qué decir cuando `avanzar` está vacío. **No es lo mismo sin clases dadas que con todo hecho.** */
  vacioDeAvance: string;
  horarios: ItemDeHorario[];
  /** Notas al pie: qué es simulado y qué significa `Un.`. Vacío ⇒ ninguna. */
  notas: string[];
}

export interface TableroProps {
  /** La cifra de la píldora del encabezado. `null` ⇒ ninguna materia tiene fecha. */
  proximaEvaluacion: { dias: number } | null;
  /** Todas las materias, **por próxima evaluación** y las sin fecha al fondo (ADR-072). */
  tarjetas: TarjetaDeEvaluacion[];
  /** La nota al pie de ADR-072, obligatoria si hay alguna barra. */
  aclaracionDeCobertura: string | null;
  /** El largo del carril de la *Opción 2*, en días. Múltiplo de 7, nunca menos de 14. */
  horizonteEnDias: number;
  riesgos: RiesgoProyectado[];
  /** El cuadro de hoy — ADR-094, que reemplaza los próximos 7 días. */
  hoy: CuadroDeHoy;
}

// ── El índice de materias ────────────────────────────────────────────────────

/**
 * Una fila del área «Materias» — [ADR-077](../../docs/decisions.md#adr-077).
 *
 * El área que la Parte II §10 del spec nombra desde siempre —*"espacios
 * persistentes de cursado y evaluaciones"*— y que nunca se había construido.
 * **No es una décima superficie**: `UX02` sigue siendo el cursado de una
 * materia, y esto es la puerta.
 */
export interface MateriaEnIndice {
  cursadaId: string;
  nombre: string;
  /**
   * *"Parcial 1 · escrito · mar 15 sept"*. `null` ⇒ **no hay evaluación con
   * fecha futura**, y la fila lo dice.
   *
   * ⚠️ No se cae a la última pasada: una evaluación que ya ocurrió no es la
   * próxima.
   */
  evaluacion: string | null;
  /** *"15 d"*. `null` ⇒ sin fecha, y la columna queda vacía en vez de en cero. */
  faltan: string | null;
  /**
   * La barra de [ADR-072](../../docs/decisions.md#adr-072). **Cobertura, no
   * readiness**: cuántas de tus unidades tienen evidencia enviada.
   *
   * `null` ⇒ **no se dibuja barra**. Es la cuarta prohibición del ADR: *"una
   * barra vacía por falta de datos y una por falta de trabajo no se dibujan
   * igual"*.
   */
  cobertura: CoberturaEnIndice | null;
  /**
   * Por qué no hay barra. `null` ⇒ hay barra. Se muestra **en su lugar**, nunca
   * además.
   */
  sinCobertura: string | null;
  /**
   * *"última actividad hace 7 días"*. `null` ⇒ *"Sin avance registrado"*, **no** cero.
   *
   * ⚠️ **El hecho, nunca el juicio.** El mockup decía *«frenada hace 7 días»* y
   * eso **no se adoptó** ([ADR-078](../../docs/decisions.md#adr-078)): siete
   * días sin actividad en una materia que se cursa una vez por semana **es lo
   * normal**, y llamarla «frenada» convierte una cadencia en un problema.
   */
  ultimoAvance: string | null;
  /**
   * La barra del Gantt del período — [ADR-078](../../docs/decisions.md#adr-078).
   *
   * `null` ⇒ **no hay ventana** y la fila se dibuja punteada. La vista Lista lo
   * ignora: es la misma fila, mirada de otra forma.
   */
  ventana: VentanaEnIndice | null;
  /**
   * La etiqueta del botón — *Abrir*, *Completar*, *Agregar examen*.
   *
   * ⚠️ **Es copy, no contrato.** Las tres son `CTA-001` y las tres hacen lo
   * mismo: navegar a esa materia. Declarar tres CTAs para una navegación
   * inflaría el registro canónico sin agregar una sola condición nueva.
   */
  etiqueta: string;
  tono: "neutral" | "urgencia";
}

export interface CoberturaEnIndice {
  /** `0`–`1`. Es lo que se dibuja: **ponderado por horas**, no por conteo. */
  fraccion: number;
  /**
   * *"1 de 9 temas · 26% de las horas"* — el copy literal que aprobó el owner
   * en [ADR-072](../../docs/decisions.md#adr-072).
   *
   * ⚠️ Los dos números **no coinciden a propósito**: un tema de seis horas no
   * vale lo mismo que uno de una. Mostrar sólo el conteo dejaría la ponderación
   * invisible; mostrar sólo la barra sería el *score de máquina* que el
   * producto se prohíbe.
   */
  texto: string;
}

/**
 * Una ventana ya resuelta a fracciones del eje, `0`–`1`.
 *
 * ⚠️ **La pantalla no hace aritmética de fechas.** Recibe posiciones y dibuja:
 * calcular el recorte en el componente pondría la regla en dos lugares, y uno de
 * ellos sin versión.
 */
export interface VentanaEnIndice {
  /** Dónde empieza la barra dentro del eje. */
  desde: number;
  /** Dónde termina. La evaluación cae acá, y ahí va el rombo. */
  hasta: number;
  /**
   * `true` ⇒ el arranque **no es un hecho**: no hay clases cargadas y se tomó el
   * borde. La barra lo dice; no lo disimula.
   */
  inicioDesconocido: boolean;
}

/**
 * Una pieza de Formación, ya proyectada · ADR-087.
 *
 * ⚠️ **No hay `video`.** La autora declara que faltan los guiones, y `D4`
 * decidió omitirlos en vez de simularlos: *sin guion no hay video, y la línea
 * desaparece*. Cuando exista, llega con su columna.
 */
export interface PiezaDeFormacion {
  id: string;
  codigo: string;
  /** La frase del estudiante: *"No sé por dónde empezar a estudiar"*. */
  titulo: string;
  problema: string;
  objetivo: string;
  explicacion: string;
  accionPosterior: string;
  evidenciaEsperada: string;
  /** `null` ⇒ la pieza no declara material. La línea se omite. */
  material: string | null;
  /** *"Cátedra · sin verificar"*, ya traducida por `provenanceVisible()`. */
  procedencia: string;
}

/**
 * La biblioteca de Formación, **V1 de solo lectura** — ADR-087 Enmienda 2.
 *
 * ⚠️ **No hay `cursadas` ni `empezar`, y las dos ausencias son la decisión.**
 * V1 no ofrece aplicar: sin `CTA-021`, sin selector de materia y sin botón que
 * prometa una escritura que todavía no existe. La biblioteca **se lee aunque el
 * estudiante no tenga ninguna cursada**.
 */
export interface FormacionProps {
  piezas: readonly PiezaDeFormacion[];
  /** Aviso de estado vacío. `null` ⇒ se omite. */
  aviso: string | null;
}

export interface MateriasProps {
  fecha: string;
  /**
   * El eje del Gantt: sus marcas, ya rotuladas y posicionadas.
   *
   * ⚠️ **Incluye `hoy`**, que es una marca más y no un caso especial de la
   * pantalla.
   */
  eje: EjeDelPeriodo;
  /** *"15 días para el próximo final"*. `null` ⇒ ninguna materia tiene fecha. */
  proximaEvaluacion: string | null;
  /**
   * Ordenadas por **próxima evaluación**, con las sin fecha al fondo.
   *
   * ⚠️ **Nunca por cobertura.** [ADR-072](../../docs/decisions.md#adr-072):
   * *"ordenar por cobertura es un ranking de qué tan mal vas"*.
   */
  materias: MateriaEnIndice[];
  /** La nota al pie de [ADR-072](../../docs/decisions.md#adr-072), obligatoria si hay alguna barra. */
  aclaracion: string | null;
}

export interface EjeDelPeriodo {
  /** *"−2 sem"*, *"hoy"*, *"+1 sem"*… con su posición `0`–`1` en el eje. */
  marcas: ReadonlyArray<{ etiqueta: string; posicion: number; esHoy: boolean }>;
  /** Dónde cae hoy. La línea vertical se dibuja acá. */
  hoy: number;
}

// ── UX02 · Materia / Cursado ─────────────────────────────────────────────────

/**
 * `P-08`: cátedra y estudiante son **dos fuentes en columnas separadas**, nunca
 * fusionadas. Un reporte del alumno no se convierte en voz de la cátedra
 * (AGENTS.md §2.6).
 */
export interface ColumnaFuente {
  titulo: string;
  contenido: string;
  /** Provenance en lenguaje natural. Los enums técnicos nunca son copy visible. */
  detalle: string;
  tono: "neutral" | "urgencia";
}

/** Estados críticos de `UX02` (spec `VI.2`). */
export type EstadoMateria =
  | "NORMAL"
  | "CONTEXTO_INCOMPLETO"
  | "CONFIANZA_VS_DOMINIO"
  | "SIN_RECOMENDACION"
  | "NO_DISPONIBLE";

export interface MateriaProps {
  estado: EstadoMateria;
  materia: string;
  /**
   * De qué cursada habla la pantalla — [ADR-054](../../docs/decisions.md#adr-054),
   * opción `B`.
   *
   * No es contenido: `UX02` no muestra ids. Es lo que `CTA-009` necesita para
   * abrir **la Bitácora de esta materia** y no la de otra. Sin él, el enlace
   * viajaba pelado y la lectura elegía la primera cursada activa: con tres
   * materias en curso, mirar el registro de Álgebra abría el de Cálculo.
   *
   * `null` ⇒ **no hay una cursada persistida detrás**, que es el Track A: un
   * escenario declara un mundo y no tiene `course_enrollment`. Ahí la CTA
   * navega sin parámetro, igual que `MateriaResumen.cursadaId`. **No se
   * inventa un id para completar el tipo.**
   */
  cursadaId: string | null;
  /**
   * La tarjeta de evaluación — [ADR-085](../../docs/decisions.md#adr-085).
   *
   * `null` ⇒ **no hay evaluación registrada** y la tarjeta no se dibuja. Una
   * evaluación sin fecha conserva su título: la fecha desconocida no se estima.
   */
  evaluacion: {
    titulo: string;
    /** *"6 días · práctico · 2 evidencias enviadas"*. `null` ⇒ se omite. */
    detalle: string | null;
  } | null;
  /**
   * `CTA-019` — *activar Modo Examen* desde la materia
   * ([ADR-016](../../docs/decisions.md#adr-016)).
   *
   * `null` ⇒ **no se renderiza**, en vez de renderizarse deshabilitada. Es el
   * caso de una materia sin evaluación registrada: no hay qué activar.
   */
  modoExamen: string | null;
  /**
   * El chip de estado general de la materia. **`null` ⇒ no se renderiza**, en
   * vez de renderizarse con una afirmación sin fuente (Etapa B2.6).
   *
   * Mismo motivo que `MateriaResumen.estado`: sin Risk Engine (Fase B6) nadie
   * evaluó esta materia, y *"Bajo control"* o *"Necesita atención"* serían
   * juicios que el sistema no puede sostener.
   */
  chip: Chip | null;
  ultimoAvance: string | null;
  hero: HeroProjection;
  catedraYVos: { catedra: ColumnaFuente; vos: ColumnaFuente } | null;
  /**
   * **El Gantt de preparación** — [ADR-072](../../docs/decisions.md#adr-072).
   *
   * `null` ⇒ no se dibuja. Es el caso de los fixtures del focus group, que
   * declaran un mundo anterior a esta etapa, y el de cualquier materia sin
   * unidades cargadas.
   */
  gantt: GanttProjection | null;
  /**
   * Las cinco dimensiones, **separadas**. Confianza no es dominio: una
   * confianza alta con dominio no evaluado se muestra como dos hechos
   * distintos, y la vista **no genera una Action** a partir de la brecha.
   */
  dimensiones: readonly FilaDato[];
  /**
   * Actividad reciente — `VI.2` §8.7: *"una preview cronológica de eventos
   * relevantes de esta materia"*, de **2–3 entradas**.
   *
   * Es la **misma verdad** que la Bitácora de `UX06`, no un resumen aparte:
   * `VI.6` §8.3 dice que *"no existe una segunda fuente histórica"*. Por eso
   * comparte tipo, traducción y forma con ella; lo único distinto es cuántas
   * entradas se muestran.
   *
   * `null` ⇒ todavía no pasó nada en esta materia, y la sección **no se
   * renderiza vacía**.
   */
  /**
   * `CLASES DE LA SEMANA` — el horario semanal de cursado
   * ([ADR-063](../../docs/decisions.md#adr-063)).
   *
   * **Solo muestra.** Es la decisión del owner, textual —*«solo mostrar, no
   * agendar»*—, y coincide con lo que ya estaba decidido: el *cuándo* de una
   * tarea vive en el `Commitment` ([ADR-064](../../docs/decisions.md#adr-064)),
   * no en esta pantalla.
   *
   * ⚠️ **No es `class_session`.** Aquéllas son las clases **dictadas**, con su
   * fecha; esto es la **regla semanal**. Y **no es `availability`**: una dice
   * cuándo cursa, la otra cuándo puede estudiar, y ADR-063 prohíbe mezclarlas.
   *
   * `null` ⇒ **no se sabe el horario**, y la sección no se dibuja vacía. No
   * saberlo **no significa tener la semana libre**.
   */
  clasesDeLaSemana: readonly { cuando: string; procedencia: string }[] | null;
  actividadReciente: readonly EntradaDeBitacora[] | null;
  /**
   * `CTA-009` — *ver progreso*, con la materia puesta. `null` ⇒ **no se
   * renderiza**, en vez de renderizarse deshabilitada.
   *
   * Es `null` exactamente cuando `actividadReciente` lo es, y no por
   * comodidad: la preview y la Bitácora salen de `hechos_de_cursada()` y
   * comparten la traducción (`aEntradaVisible`), así que **una preview vacía
   * es una Bitácora vacía**. Ofrecer la puerta ahí sería prometer un historial
   * que no existe.
   *
   * ⚠️ Con una salvedad dicha: la preview mira **los últimos tres hechos**, no
   * todos. Si esos tres no tienen copy aprobada y hay otros más viejos que sí,
   * la puerta queda escondida. Es el error conservador —omitir de más— y no el
   * de prometer de más.
   */
  verRegistro: string | null;
  /** Aviso de estado vacío, incompleto o de error. `null` ⇒ se omite. */
  aviso: string | null;
  /**
   * Captura de "pasó algo en clase". `null` ⇒ no se ofrece.
   *
   * Un reporte del alumno registrado durante una clase **no** se convierte en
   * voz de la cátedra (AGENTS.md §2.6).
   */
  capturaDeClase: string | null;
}

// ── UX03 · Próxima Acción ────────────────────────────────────────────────────

/** Estados críticos de `UX03` (spec `VI.3`). */
export type EstadoAccion =
  | "NORMAL"
  | "INCERTIDUMBRE"
  | "RAZON_NO_CONFIRMADA"
  | "SIN_RECURSO"
  | "BLOQUEADA"
  | "REEMPLAZADA"
  | "CORRECCION";

export interface ProximaAccionProps {
  estado: EstadoAccion;
  contexto: string;
  unidad: string;
  titulo: string;
  razon: string | null;
  /** Cada fila ausente se omite entera. */
  duracion: string | null;
  recurso: string | null;
  evidenciaEsperada: string | null;
  criterioCierre: string | null;
  queSigue: string | null;
  /** Provenance del recurso. `null` ⇒ no se oficializa lo desconocido. */
  provenanceRecurso: string | null;
  aviso: string | null;
  /** `null` ⇒ **no se renderiza CTA primaria**, en vez de una deshabilitada. */
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
}

// ── UX04 · Compromiso ────────────────────────────────────────────────────────

/**
 * Estados críticos de `UX04` (spec `VI.4`), incluidos los ocho del lifecycle de
 * `Commitment`.
 */
export type EstadoCompromiso =
  | "DRAFT"
  | "CONFIRMED"
  | "DUE"
  | "STARTED"
  | "COMPLETED"
  | "RENEGOTIATED"
  | "MISSED"
  | "CLOSED"
  | "CAPACIDAD_INSUFICIENTE"
  | "FECHA_INVALIDA"
  | "RENEGOCIACION"
  | "RENEGOCIACION_NO_ELEGIBLE"
  | "RESCATE";

export interface CompromisoProps {
  estado: EstadoCompromiso;
  contexto: string;
  titulo: string;
  fecha: string | null;
  hora: string | null;
  tiempoDeclarado: string | null;
  /** Nota de capacidad + zona horaria. `null` ⇒ se omite. */
  notaEstimacion: string | null;
  evidenciaEsperada: string | null;
  criterioCierre: string | null;
  /** El estado en que queda al confirmar. Se muestra como chip. */
  estadoResultante: Chip | null;
  aviso: string | null;
  /**
   * El Commitment original, cuando esta vista es una renegociación o un
   * rescate. **No es editable**: el original se preserva (AGENTS.md §2.4).
   */
  original: readonly FilaDato[] | null;
  /** `null` ⇒ no se renderiza CTA primaria. */
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
  /**
   * **Cambiar horario** — [ADR-050](../../docs/decisions.md#adr-050).
   *
   * La acción secundaria de `UX04`. Va **debajo** de la principal y no le
   * saca jerarquía: «Empezar» sigue siendo lo que la pantalla propone.
   *
   * `null` ⇒ la pantalla no habla del tema. **`sePuede: false` NO es `null`**:
   * cuando el estudiante no puede cambiar el horario se le dice por qué, en
   * vez de dejarle un botón apagado sin explicación.
   *
   * ⚠️ **La pantalla no decide nada de esto.** Los horarios y el motivo salen
   * de `lib/domain/renegociacion.ts`; acá llegan resueltos.
   */
  cambioDeHorario:
    | { sePuede: true; horaActual: string; horarios: readonly { valor: string; etiqueta: string }[] }
    | { sePuede: false; motivo: string }
    | null;
}

// ── UX05 · Evidencia ─────────────────────────────────────────────────────────

/** Los siete estados de `Evidence` más los de la propia entrega (`VI.5`). */
export type EstadoEvidencia =
  | "EXPECTED"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SUFFICIENT"
  | "INSUFFICIENT"
  | "RESUBMISSION_REQUESTED"
  | "VALIDATED"
  | "SUBIENDO"
  | "UPLOAD_FALLIDO"
  | "ARTEFACTO_FORMAL"
  | "TARDIA";

export interface EvidenciaProps {
  estado: EstadoEvidencia;
  contexto: string;
  titulo: string;
  unidad: string | null;
  evidenciaEsperada: string | null;
  criterioCierre: string | null;
  /** Tipos permitidos, en copy de dominio. `null` ⇒ se omite la línea. */
  formatosPermitidos: string | null;
  /** Nombre del archivo sintético que simula el adjunto en el Track A. */
  nombreAdjuntoDemo: string;
  /** Estado del lifecycle en copy de producto. Nunca el enum crudo. */
  estadoVisible: string | null;
  aviso: string | null;
  /**
   * La Reflection configurada. `requerida` bloquea sólo el submit dependiente;
   * `null` ⇒ no se ofrece.
   */
  reflection: { titulo: string; requerida: boolean } | null;
  /** `null` ⇒ no se renderiza CTA primaria: no hay entrega posible. */
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
  /** El adjunto ya existe y la pantalla no lo pide de nuevo. */
  adjuntoPrevio: string | null;
}

// ── UX06 · Progreso / Bitácora ───────────────────────────────────────────────

/** Los cuatro resultados posibles de una re-evaluación (`VI.6`). */
export type EstadoProgreso =
  | "CAMBIO_CONFIRMADO"
  | "SIN_CAMBIO_EXPLICITO"
  | "SIN_DATOS"
  | "NO_DISPONIBLE";

/** Una entrada de la Bitácora. Los eventos del mismo ciclo se agrupan. */
export interface EntradaDeBitacora {
  titulo: string;
  detalle: string;
  /** Provenance ya en copy. `null` ⇒ *"Fuente o estado no disponible"*. */
  provenance: string | null;
}

export interface ProgresoProps {
  estado: EstadoProgreso;
  contexto: string;
  estadoEvidencia: Chip;
  detalleEvidencia: string;
  /**
   * Solo se lista acá una dimensión con un `ProgressUpdated` real detrás.
   * `VALIDATED` no produce `ProgressUpdated` por sí solo (AGENTS.md §2.1).
   */
  cambioConfirmado: FilaDato[];
  fuenteCambio: string | null;
  /**
   * Los estados de no-cambio, que son distinguibles entre sí: "conserva su
   * estado" ≠ "no evaluado" ≠ "no disponible" ≠ `0` (AGENTS.md §2.5).
   *
   * **Desde [ADR-020] no comparten tratamiento.** Un no-cambio declarado por el
   * owner es un **dato presente** —alguien miró y confirmó— y va sin `ausencia`;
   * "no evaluado" y "sin información" son ausencias tipadas y la llevan. La
   * distinción se ve sin color, que es lo que `P-09` exige.
   */
  sinCambioConfirmado: FilaDato[];
  /**
   * De dónde sale el no-cambio, cuando lo declaró el owner. `null` ⇒ el bloque
   * sólo tiene ausencias, y una ausencia no tiene fuente que citar.
   */
  fuenteSinCambio: string | null;
  queSigue: string | null;
  aviso: string | null;
  /**
   * Bitácora agrupada por ciclo. Los eventos de un mismo ciclo se muestran
   * juntos y **no como cuatro avances independientes**.
   */
  bitacora: readonly { ciclo: string; entradas: readonly EntradaDeBitacora[] }[] | null;
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
}

// ── UX07 · Activación de Modo Examen ─────────────────────────────────────────

/**
 * Los estados visibles de `UX07`, de `product-spec-source.md` §VI.7 §15.
 *
 * **No son una máquina paralela de UI.** Describen una situación sobre
 * entidades y lecturas que ya existen. El spec es explícito: *"No se usan
 * `DRAFT`, `PENDING_ACTIVATION`, `DUPLICATE`, `CANCELLED_ASSESSMENT` ni otros
 * estados técnicos inventados."*
 */
export type EstadoActivacion =
  | "RECOMENDACION"
  | "REVISION_MANUAL"
  | "SELECCION"
  | "SIN_ASSESSMENT"
  | "FALTAN_DATOS"
  | "FECHA_DESCONOCIDA"
  | "MODALIDAD_DESCONOCIDA"
  | "FUERA_DE_P0"
  | "YA_ACTIVA"
  | "CAMBIO_DE_FECHA"
  | "CANCELADA"
  | "PASADA"
  | "CONTRADICTORIOS"
  | "NO_DISPONIBLE"
  | "VERIFICANDO"
  | "HANDOFF_NO_DISPONIBLE";

/**
 * Un dato de la evaluación con su procedencia.
 *
 * `provenance` llega **ya traducido a copy de producto** (`VI.7` §18.2):
 * *"Cátedra · oficial"*, *"Reportado por vos · sin verificar"*, *"Dato en
 * revisión · hay versiones distintas"*. Los enums técnicos nunca son copy
 * visible (AGENTS.md §2.6), y ninguna capa eleva la verificación.
 *
 * `null` ⇒ se omite. Un dato sin provenance conocida no dice *"oficial"*.
 */
export interface DatoDeEvaluacion {
  label: string;
  valor: string;
  provenance: string | null;
  /** Valor anterior, sólo cuando el owner expone el cambio (`VI.7` §16.16). */
  anterior: string | null;
  /** Marca visual de dato en disputa. El owner resuelve; la UI no elige. */
  enRevision?: boolean;
}

/** Una evaluación elegible dentro del mismo `CourseEnrollment` (`VI.7` §16.14). */
export interface OpcionDeEvaluacion {
  id: string;
  evaluacion: string;
  datos: DatoDeEvaluacion[];
  seleccionada: boolean;
}

export interface ActivacionExamenProps {
  estado: EstadoActivacion;
  /**
   * La `ExamPreparation` sobre la que actúa `CTA-011`. **No se muestra.**
   *
   * Está acá porque una CTA que escribe tiene que nombrar su objeto: sin esto,
   * la pantalla activaría "la preparación que el servidor decida", y elegir cuál
   * es la elegibilidad que `C01-024` deja abierta. `null` ⇒ no hay nada que
   * activar, y entonces tampoco hay CTA.
   */
  preparacionId: string | null;
  /** El `CourseEnrollment` de origen. Materia y comisión NO son selectores. */
  materia: string;
  comision: string | null;
  /** Título del microcopy de `VI.7` §22.1, resuelto por estado. */
  titulo: string;
  /** `null` cuando todavía no hay una Assessment inequívoca. */
  evaluacion: string | null;
  datos: DatoDeEvaluacion[];
  /**
   * Por qué apareció. Sólo la razón **recibida**: la vista no calcula
   * elegibilidad ni prioridad, y no convierte proximidad en hecho.
   */
  razonAparicion: string | null;
  /** Lista corta de faltantes (`VI.7` §16.6). Vacía ⇒ no se muestra. */
  faltantes: readonly string[];
  /** Aviso de estado vacío, desconocido, contradictorio o de error (`§25`). */
  aviso: string | null;
  /** Sólo en `SELECCION`. La lista conserva el orden recibido; no rankea. */
  opciones: readonly OpcionDeEvaluacion[] | null;
  // ── Columna secundaria ────────────────────────────────────────────────────
  queCambia: readonly string[];
  queNoCambia: readonly string[];
  /** Qué ocurrirá después. `null` ⇒ se omite: no se promete un destino. */
  despues: string | null;
  // ── Decisión ──────────────────────────────────────────────────────────────
  /**
   * `null` ⇒ **no hay CTA primaria y no se renderiza ninguna**. `VI.7` §21.3 es
   * explícito: cuando ya existe `ACTIVE`, el estado reemplaza el CTA de
   * activación y *"no se conserva un botón Activar deshabilitado que sugiera
   * una segunda operación"*.
   */
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
  /** El retorno seguro. Vive en la columna secundaria, nunca como primaria. */
  ctaRetorno: string;
}

// ── UX08 · Modo Examen / Overview ────────────────────────────────────────────

/** Un hito del recorrido. Sin porcentaje y sin lista fija de pasos. */
export interface PasoDelRecorrido {
  label: string;
  estado: "CONFIRMADO" | "ACTUAL" | "PENDIENTE";
}

export interface OverviewExamenProps {
  /** Lo decide `selectOverviewLevel`, no la pantalla. */
  nivel: NivelOverview;
  variante: VarianteOverview | null;

  // ── Identidad y contexto ──────────────────────────────────────────────────
  materia: string;
  evaluacion: string;
  datos: DatoDeEvaluacion[];

  // ── Estado dominante · columna principal ──────────────────────────────────
  /** Microcopy de `VI.8` §23, resuelto por estado. */
  estadoDominante: string;
  /** El objeto que gana la precedencia. `null` ⇒ no hay objeto que mostrar. */
  objeto: string | null;
  /**
   * Una sola CTA primaria, sobre el mismo objeto y lifecycle autoritativo, con
   * destino real. `null` ⇒ no se renderiza ninguna.
   */
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
  /** Qué pasa después. Sin outcome anticipado ni saltos. */
  despues: string | null;
  /** Lo que queda secundario por precedencia. Se muestra, no se oculta. */
  secundarios: readonly string[];
  aviso: string | null;

  // ── Columna secundaria ────────────────────────────────────────────────────
  /** `null` ⇒ *"Recorrido todavía no disponible."* No se listan 12 pasos. */
  recorrido: readonly PasoDelRecorrido[] | null;
  /** Sólo dimensiones con un `ProgressUpdated` real detrás. */
  cambioConfirmado: readonly FilaDato[];
  /** Lo que no cambió, distinguible entre sí: "no evaluado" ≠ "sin datos". */
  pendiente: readonly FilaDato[];
  fuenteProgreso: string | null;

  /**
   * Status de preparación **recibido del owner**, con su descargo literal.
   *
   * `UX08` **no calcula readiness, no muestra score ni porcentaje y no crea
   * card** ([ADR-011](../../docs/decisions.md), `VI.8` §18). Esto es otra cosa:
   * releer un valor que `ExamPreparation` ya trae. `null` ⇒ no se muestra nada.
   */
  statusRecibido: { valor: string; descargo: string } | null;

  // ── Banda de continuidad ──────────────────────────────────────────────────
  /** Cursado, sus cinco dimensiones y la Bitácora continúan. */
  cursadoPersistente: string;
  ctaRetorno: string;
}

// ── UX09 · Paso de Protocolo ─────────────────────────────────────────────────

/**
 * Un bloque de contenido configurado del paso.
 *
 * `WF-S11` **renderiza contenido recibido**: no deriva, no resume con
 * significado nuevo, no completa y no corrige contenido pedagógico
 * (`VI.9` §12.1). `valor: null` ⇒ se muestra el copy de ausencia que el spec
 * fija en §27, nunca una versión generada.
 */
export interface BloqueDePaso {
  titulo: string;
  valor: string | null;
  /** Copy exacto de §27 cuando el contenido falta. */
  ausencia: string;
}

export interface RecursoConfigurado {
  nombre: string;
  tipo: string | null;
  /** Provenance ya traducida a copy. `null` ⇒ *"Fuente o verificación no disponible"*. */
  provenance: string | null;
  /** Derechos de uso, si el owner los declara. */
  derechos: string | null;
}

/** Propuesta que debe explicarse y responderse antes de mover el recorrido. */
export interface ReentradaPendiente {
  id: string;
  titulo: string;
  motivo: string;
  justificacion: string;
  actividad: string;
  evidenciaVigente: string;
  recorrido: string;
  comoPedirOtraOpcion: string;
  ctaAceptar: string;
  ctaOtraOpcion: string;
}

export interface PasoProtocoloProps {
  nivel: NivelPaso;
  variante: VariantePaso | null;

  // ── Identidad (§13.1) ─────────────────────────────────────────────────────
  assessment: string;
  materia: string;
  modalidad: string;
  /** Label configurado del paso. `null` ⇒ identidad parcial. */
  labelDelPaso: string | null;
  /**
   * *"Protocolo {version recibida}"*. `null` ⇒ no se declara vigencia ni se usa
   * un protocolo genérico.
   *
   * **Nunca se muestra `Paso 5 de 12` ni un porcentaje** (§13.2): instancia,
   * orden, `current`/`next` y deduplicación siguen `SOURCE CONTRACT PENDING`.
   */
  version: string | null;

  // ── Contenido configurable (§12) ──────────────────────────────────────────
  objetivo: BloqueDePaso;
  explicacion: BloqueDePaso;
  entregable: BloqueDePaso;
  criterio: BloqueDePaso;
  recurso: RecursoConfigurado | null;
  /** *"Este paso no tiene un recurso configurado"*. No es un bloqueo. */
  avisoRecurso: string | null;

  // ── Estado y decisión ─────────────────────────────────────────────────────
  estadoDominante: string;
  /** *"Abriste este paso. Abrirlo no lo completa."* */
  avisoDeApertura: string | null;
  aviso: string | null;
  ctaPrimaria: { texto: string; habilitada: boolean } | null;
  despues: string | null;
  secundarios: readonly string[];
  /** Presente ⇒ domina la decisión y `ctaPrimaria` queda en `null`. */
  reentradaPendiente: ReentradaPendiente | null;

  // ── Configuración · columna secundaria ────────────────────────────────────
  /** Fuente del contenido: real o desconocida. Nunca se oficializa. */
  fuenteDelContenido: string;
  ctaRetorno: string;
}
