import { t } from "@/lib/content/es-AR";
import type {
  EntradaDeBitacora,
  EstadoProgreso,
  FilaDato,
  ProgresoProps,
  Tono,
} from "@/lib/domain/view-models";
import { aEntradaVisible } from "./hechos";
import { fechaLarga, haceCuanto, horaCorta } from "./tiempo";

/**
 * `UX06` proyectada desde datos persistidos — Etapa B2.6.
 *
 * ## La regla que esta pantalla existe para no romper
 *
 * **Una dimensión sólo aparece como cambiada si hay una fila de
 * `progress_entry` que lo diga.** `VALIDATED` no produce un cambio de progreso
 * por sí solo (`VI.6` §6): una evidencia puede recorrer los siete estados sin
 * que ninguna dimensión se mueva. Derivar el progreso del lifecycle —que es lo
 * que el schema invita a hacer, porque el dato está ahí— convierte *"entregué
 * algo"* en *"aprendí algo"*, que es el error que el producto entero está
 * escrito para evitar.
 *
 * ## Los cuatro resultados de `VI.6` §4.2, y cómo se distinguen acá
 *
 * | Resultado del spec | Estado | Qué lo produce |
 * |---|---|---|
 * | Evidence cambió de estado; progreso todavía no confirmado | `SIN_DATOS` | no hay `progress_entry` |
 * | Evidence validada; el progreso confirmó un cambio limitado | `CAMBIO_CONFIRMADO` | `changed_dimensions` no vacío |
 * | El owner confirmó que no hubo cambio | `SIN_CAMBIO_EXPLICITO` | `explicit_no_change` |
 * | El dato no está disponible | `NO_DISPONIBLE` | **no lo produce esta función** |
 *
 * `SIN_DATOS` es *"todavía no"*, no *"no hay nada"*: son dos avisos distintos
 * según haya o no una evidencia esperando resultado, porque §7.1 separa la
 * espera del veredicto.
 *
 * `NO_DISPONIBLE` ya no llega como props. Una falla de lectura se dibuja como
 * falla —`NoSePudoCargar`, la primitiva de la Etapa A2.3— y no como una pantalla
 * de progreso que dice que no pudo. Mostrarlo como un estado más de `UX06`
 * habría sido, otra vez, un fallback indistinguible del éxito.
 *
 * ## Lo que se niega a mostrar
 *
 * **Ninguna magnitud que el owner no haya escrito como texto.** `C01-019`
 * (gate `H`) no cerró qué es mostrable: `12` no dice nada y *"12 ejercicios"*
 * inventa la unidad. Si `current_values` trae un número, la fila dice que la
 * dimensión **cambió** —que es el hecho— y omite la magnitud.
 */

/** Las claves de copy, para que una etiqueta inventada no compile. */
type ClaveDeCopy = Parameters<typeof t>[0];

/** El estado de una dimensión, tal como lo guarda `topic_progress`. */
type EstadoDimension = "value" | "not_evaluated" | "no_information" | null;

/** Las cinco, con el nombre con el que viajan en `changed_dimensions`. */
const DIMENSIONES = [
  { clave: "exposure", label: "DIMENSION.RECORRIDO" },
  { clave: "practice", label: "DIMENSION.PRACTICA" },
  { clave: "domain", label: "DIMENSION.DOMINIO" },
  { clave: "confidence", label: "DIMENSION.CONFIANZA" },
  { clave: "recency", label: "DIMENSION.RECENCIA" },
] as const;

export interface ResultadoDeProgreso {
  occurridoEn: string;
  /** `entry_kind`. **No se muestra:** su vocabulario es `C01-018`, `OPEN`. */
  tipo: string;
  dimensionesCambiadas: string[];
  valoresAnteriores: Record<string, unknown> | null;
  valoresActuales: Record<string, unknown> | null;
  noCambioExplicito: boolean;
  razonDeNoCambio: string | null;
  /** Si es `false`, el resultado existe pero **no habla de esta evidencia**. */
  esDeEstaEvidencia: boolean;
}

export interface DimensionesDeUnidad {
  recorrido: EstadoDimension;
  practica: EstadoDimension;
  dominio: EstadoDimension;
  confianza: EstadoDimension;
  /** Cuándo se declaró. El nivel no viaja: convertir `0.8` en "alta" es un umbral. */
  confianzaEn: string | null;
  recenciaEn: string | null;
}

/** Un ciclo de la Bitácora: los hechos de una misma Action, juntos. */
export interface CicloPersistido {
  accionId: string;
  objetivo: string;
  desde: string;
  entradas: Array<{ evento: string; en: string; porElEstudiante: boolean | null }>;
}

export interface EstadoDeProgreso {
  instante: string;
  zona: string;
  materia: string;
  unidad: string | null;
  evidencia: {
    id: string;
    lifecycle: string;
    objetivo: string;
    enviadaEn: string | null;
  } | null;
  resultado: ResultadoDeProgreso | null;
  dimensiones: DimensionesDeUnidad | null;
  siguiente: { objetivo: string; razon: string | null } | null;
  bitacora: CicloPersistido[];
}

export interface RepositorioDeProgreso {
  estadoDeProgreso(
    institutionId: string,
    studentId: string,
    ahora: string,
    evidenceId?: string | null,
  ): Promise<EstadoDeProgreso | null>;
}

/** El lifecycle en copy, con su tono. **El enum crudo nunca se muestra.** */
const EVIDENCIA_VISIBLE: Record<string, { texto: string; tono: Tono }> = {
  EXPECTED: { texto: "Todavía no entregaste esta evidencia", tono: "humano" },
  SUBMITTED: { texto: "Evidencia registrada", tono: "humano" },
  UNDER_REVIEW: { texto: "En revisión", tono: "humano" },
  SUFFICIENT: { texto: "Cumplió el criterio", tono: "humano" },
  INSUFFICIENT: { texto: "Necesita cambios", tono: "urgencia" },
  RESUBMISSION_REQUESTED: { texto: "Te pidieron volver a entregarla", tono: "urgencia" },
  VALIDATED: { texto: "Evidencia validada", tono: "exito" },
};

function estadoDe(e: EstadoDeProgreso): EstadoProgreso {
  if (!e.resultado) return "SIN_DATOS";
  if (e.resultado.dimensionesCambiadas.length > 0) return "CAMBIO_CONFIRMADO";
  if (e.resultado.noCambioExplicito) return "SIN_CAMBIO_EXPLICITO";
  // `I10` lo hace imposible en la base; si igual llega, es una fila que no
  // afirma nada, y una fila que no afirma nada no es un no-cambio.
  return "SIN_DATOS";
}

/**
 * La magnitud, **sólo si el owner la escribió como texto**.
 *
 * Un número en `current_values` es una magnitud interna sin unidad declarada
 * (`C01-019`): la fila dice que la dimensión cambió y calla el número, que es
 * la misma decisión con la que `estado_de_materia` se niega a devolver
 * `topic_progress.*_value`.
 */
function magnitud(res: ResultadoDeProgreso, clave: string): string {
  const antes = res.valoresAnteriores?.[clave];
  const ahora = res.valoresActuales?.[clave];
  const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  const a = texto(antes);
  const b = texto(ahora);
  if (a && b) return `${a} → ${b}`;
  if (b) return b;
  return t("PROGRESO.CAMBIO_SIN_MAGNITUD");
}

/** Sólo las dimensiones que `changed_dimensions` incluye (`PROG-P1-04`). */
function cambioConfirmadoDe(e: EstadoDeProgreso): FilaDato[] {
  const res = e.resultado;
  if (!res) return [];
  return DIMENSIONES.filter((d) => res.dimensionesCambiadas.includes(d.clave)).map((d) => ({
    label: t(d.label),
    // La Recencia es la única de las cinco cuya magnitud **sí** tiene unidad
    // conocida: es una fecha, y la fecha está en la base. Decir "hoy" no
    // inventa nada; decir "cambió" escondería el único dato mostrable.
    valor:
      d.clave === "recency" && e.dimensiones?.recenciaEn
        ? haceCuanto(e.dimensiones.recenciaEn, e.instante, e.zona)
        : magnitud(res, d.clave),
  }));
}

/**
 * El bloque separado que exige `PROG-P1-04` / `REG-P1-01`: las dimensiones
 * autoritativas **conservadas**, que no son las que cambiaron ni un relleno.
 *
 * ## Un no-cambio declarado **no es una ausencia** — `ADR-020`
 *
 * Decidido por el owner el 1 de septiembre de 2026. *"Conserva su estado"* es
 * información positiva: **alguien miró y confirmó que no cambió**. *"No
 * evaluado"* es la ausencia de esa mirada. Hasta hoy las dos filas compartían
 * `SIN_ASIGNAR` y se veían idénticas, mientras el fixture prometía que eran
 * *"distinguibles entre sí"*.
 *
 * Así que el no-cambio sube a **dato presente**, con su fuente, y la itálica
 * atenuada queda para lo que de verdad falta. Se distinguen **sin color** —una
 * fila tiene tratamiento de dato y la otra de ausencia—, que es lo que `P-09`
 * pide y lo que la prueba de imprimir en blanco y negro verifica.
 *
 * Sin un resultado autoritativo detrás, una dimensión medida **se omite**: que
 * exista un número no autoriza a decir *"conserva su estado"*, porque nadie
 * comparó nada. Las ausencias sí se muestran siempre, y **distinguidas**: "no
 * evaluado" es que el eje existe y nadie lo midió; "sin información" es que no
 * hay ni con qué mirarlo.
 */
function sinCambioDe(e: EstadoDeProgreso): FilaDato[] {
  const d = e.dimensiones;
  if (!d) return [];
  const cambiadas = e.resultado?.dimensionesCambiadas ?? [];
  const hayResultado = e.resultado !== null;
  const filas: FilaDato[] = [];

  const agregar = (clave: string, label: ClaveDeCopy, estado: EstadoDimension) => {
    if (cambiadas.includes(clave)) return;

    if (estado === "value") {
      // Un no-cambio confirmado por el owner: **dato**, no ausencia (`ADR-020`).
      if (!hayResultado) return;
      filas.push({ label: t(label), valor: t("PROGRESO.CONSERVA") });
      return;
    }

    filas.push({
      label: t(label),
      valor: estado === "not_evaluated" ? t("DIMENSION.NO_EVALUADO") : t("DIMENSION.SIN_INFORMACION"),
      ausencia: "SIN_ASIGNAR",
    });
  };

  agregar("exposure", "DIMENSION.RECORRIDO", d.recorrido);
  agregar("practice", "DIMENSION.PRACTICA", d.practica);
  agregar("domain", "DIMENSION.DOMINIO", d.dominio);

  // La confianza viaja **sólo con su fecha**, nunca con su nivel. Y no se
  // compara con Dominio: la brecha la entrega el Student Model (`C01-043`,
  // `OPEN`) o no existe.
  if (!cambiadas.includes("confidence")) {
    if (d.confianzaEn) {
      filas.push({
        label: t("DIMENSION.CONFIANZA"),
        valor: `declarada ${haceCuanto(d.confianzaEn, e.instante, e.zona)}`,
      });
    } else {
      agregar("confidence", "DIMENSION.CONFIANZA", d.confianza);
    }
  }

  if (!cambiadas.includes("recency")) {
    filas.push(
      d.recenciaEn
        ? { label: t("DIMENSION.RECENCIA"), valor: haceCuanto(d.recenciaEn, e.instante, e.zona) }
        : { label: t("DIMENSION.RECENCIA"), valor: t("COMUN.SIN_AVANCE"), ausencia: "SIN_ASIGNAR" },
    );
  }

  return filas;
}

/**
 * La fuente que respalda el cambio (`VI.6` §8.1).
 *
 * **Sólo se nombra si el resultado dice que habla de esta evidencia.** Una
 * entrada de progreso anterior mostrada al lado de la evidencia de hoy no
 * autoriza a decir que ésta la causó: eso es inventar causalidad, que es
 * justamente lo que `C01-018` todavía no cerró.
 */
function fuenteDe(e: EstadoDeProgreso): string | null {
  if (!e.resultado?.esDeEstaEvidencia) return null;
  if (e.evidencia?.lifecycle !== "VALIDATED") return null;
  return t("PROGRESO.FUENTE_EVIDENCIA_VALIDADA");
}

/**
 * La Bitácora, agrupada por ciclo.
 *
 * Los hechos de una misma Action se muestran **juntos**, no como cuatro avances
 * independientes (`VI.6` §1). Un hecho sin copy aprobada **se omite**: mostrar
 * `CommitmentDue` sería mostrar un enum, y traducirlo a una frase que nadie
 * aprobó sería inventar contenido.
 *
 * La procedencia no se eleva: lo que declaró el estudiante viaja como suyo y
 * sin verificar, y lo que hizo el sistema **no tiene fuente académica** — el
 * reloj del lifecycle no es la cátedra.
 */
function bitacoraDe(e: EstadoDeProgreso): ProgresoProps["bitacora"] {
  const ciclos = e.bitacora
    .map((c) => {
      const entradas: EntradaDeBitacora[] = c.entradas
        .map((h) => aEntradaVisible(h, e.zona))
        .filter((x): x is EntradaDeBitacora => x !== null);

      return { ciclo: `Ciclo del ${fechaLarga(c.desde, e.zona)}`, entradas };
    })
    // Un ciclo sin ninguna entrada mostrable no se dibuja vacío.
    .filter((c) => c.entradas.length > 0);

  return ciclos.length > 0 ? ciclos : null;
}

export function proyectarProgreso(e: EstadoDeProgreso): ProgresoProps {
  const estado = estadoDe(e);
  const visible = e.evidencia ? EVIDENCIA_VISIBLE[e.evidencia.lifecycle] : undefined;

  const aviso =
    estado === "CAMBIO_CONFIRMADO"
      ? null
      : estado === "SIN_CAMBIO_EXPLICITO"
        ? // La razón se muestra **sólo si existe** (`VI.6` §1). Sin ella, el
          // no-cambio se afirma igual: lo declaró el owner.
          (e.resultado?.razonDeNoCambio ?? t("PROGRESO.NO_CAMBIO"))
        : e.evidencia
          ? // Hay entrega y todavía no llegó el resultado: es una espera.
            t("PROGRESO.PENDIENTE")
          : // No hay con qué: ni siquiera hay una entrega esperando resultado.
            t("PROGRESO.SIN_INFORMACION_AVANCE");

  return {
    estado,
    contexto: e.unidad ? `${e.materia} · ${e.unidad}` : e.materia,
    estadoEvidencia: visible
      ? { tono: visible.tono, texto: visible.texto }
      : { tono: "humano", texto: t("PROGRESO.SIN_EVIDENCIA") },
    // El chip dice el estado y el detalle dice el hecho: **no la misma frase
    // dos veces**. Repetir el mismo texto en las tres líneas de arriba fue lo
    // primero que salió al probar contra la base con el mundo vacío.
    detalleEvidencia: e.evidencia
      ? [e.evidencia.objetivo, e.evidencia.enviadaEn && `enviada ${horaCorta(e.evidencia.enviadaEn, e.zona)}`]
          .filter(Boolean)
          .join(" · ")
      : t("PROGRESO.SIN_ENTREGA"),
    cambioConfirmado: cambioConfirmadoDe(e),
    fuenteCambio: fuenteDe(e),
    sinCambioConfirmado: sinCambioDe(e),
    // `ADR-020`: si alguna fila de ese bloque es un no-cambio **declarado**, se
    // dice de dónde sale. Una afirmación sobre un dato lleva su fuente (`P-08`);
    // una ausencia no tiene fuente que citar.
    fuenteSinCambio: hayNoCambioDeclarado(e) ? t("PROGRESO.FUENTE_RESULTADO") : null,
    // Lo que sigue es una Action que el ADE **ya emitió**. Esta pantalla no
    // prioriza ni genera ninguna (`VI.6` §5).
    queSigue: e.siguiente?.objetivo ?? null,
    aviso,
    bitacora: bitacoraDe(e),
    // Sin una Action viva no hay a dónde ir, y una CTA deshabilitada de adorno
    // es peor que ninguna.
    ctaPrimaria: e.siguiente ? { texto: t("CTA.VER_SIGUIENTE_ACCION"), habilitada: true } : null,
  };
}

/**
 * ¿Alguna dimensión conservada viene de un resultado autoritativo?
 *
 * Es lo que distingue *"nadie tocó esto"* de *"alguien miró y no cambió"*, y lo
 * único que autoriza a citar una fuente en el bloque de no-cambio (`ADR-020`).
 */
function hayNoCambioDeclarado(e: EstadoDeProgreso): boolean {
  return sinCambioDe(e).some((f) => f.valor === t("PROGRESO.CONSERVA"));
}
