"use client";

/**
 * *"¿Qué materias estás cursando?"* — el **Mapa Académico Mínimo** del spec.
 *
 * `product-spec-source.md` §7.3: *"Suficiente información para producir al menos
 * una próxima acción académica real. **No es necesario completar toda la
 * carrera** para empezar a recibir valor"*. Y `UF-S02` fija el mecanismo:
 * *"Mostrar materias probables. **Alumno confirma/corrige**"*, con su motivo en
 * §6.4: *"Reduce fricción: el alumno corrige en vez de cargar todo desde cero"*.
 *
 * ## Qué se muestra y qué no
 *
 * **No toda fila del plan es una materia** ([ADR-051](../../docs/decisions.md#adr-051)):
 *
 * - **Materias** (`COURSE`): se listan. Las del año elegido llegan marcadas y se
 *   pueden desmarcar; las de otros años se agregan a pedido.
 * - **Cupos** (electivas, seminarios): se listan **aparte y nunca marcados**. Se
 *   pregunta, y si el estudiante eligió algo que no está en el plan puede
 *   escribirlo — queda **pendiente de verificación** y **no entra al catálogo**.
 * - **Acreditación de idioma, práctica profesional y trabajo final**: no se
 *   muestran como materias comunes. Cada uno va a necesitar su propia
 *   experiencia, y ninguno la podría tener entrando como una materia más.
 *
 * ⚠️ **Preseleccionar no es dar por confirmado.** Nada se persiste hasta la CTA.
 */

import { useMemo, useState } from "react";

import { t } from "@/lib/content/es-AR";
import { grupoEnElAlta, tratoEnElAlta, sePreselecciona, type TipoDeRequisito } from "@/lib/domain/alta";
import type { Semestre } from "@/lib/domain/periodo";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  CTAPrincipal,
  CTASecundaria,
  ReglaDeNegocio,
} from "@/components/screens/design-system";
import { CTAEsqueleto, Esqueleto, PantallaCargando, Renglon } from "@/components/screens/esqueleto";
import { ErrorDelAlta, MarcoDelAlta } from "./marco";

/**
 * `/alta/materias` mientras el plan no llegó — `P-12`. El paso, el título y la
 * regla van reales; las materias, en filas con la casilla y el nombre en bloque.
 *
 * ⚠️ **Ninguna casilla aparece marcada.** Qué se preselecciona lo decide
 * `sePreselecciona` sobre el plan real; un tilde de ejemplo sugeriría una
 * inscripción que nadie eligió.
 */
export function AltaMateriasEsqueleto() {
  return (
    <MarcoDelAlta paso={3} titulo={t("ALTA.MATERIAS.TITULO")} ayuda={t("ALTA.MATERIAS.REGLA")} ancho={720}>
      <PantallaCargando style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <section aria-hidden style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid var(--border)" }}
            >
              <Esqueleto ancho={16} alto={16} radio={4} style={{ marginTop: 3 }} />
              <Renglon cuerpo="body" ancho={[220, 180, 260, 150, 240, 200][i]} style={{ maxWidth: "80%" }} />
            </div>
          ))}
        </section>
        <CTAEsqueleto />
      </PantallaCargando>
    </MarcoDelAlta>
  );
}

export interface RequisitoElegible {
  requisitoId: string;
  codigo: string;
  nombre: string;
  tipo: TipoDeRequisito;
  anio: number | null;
  /** Período de dictado. `null` ⇒ el plan no lo declara (ADR-053), no «ninguno». */
  periodo: Semestre | null;
  /** Se dicta todo el año: aparece en los dos semestres (ADR-061). */
  esAnual: boolean;
  nombreCortado: boolean;
  materiaId: string | null;
  opciones: { materiaId: string; nombre: string }[];
}

export interface SeleccionEnviada {
  requisito: string;
  materia?: string;
  nombreEscrito?: string;
}

export interface MateriasProps {
  anioElegido: number;
  /** El semestre que el estudiante eligió en `/alta/carrera`. Nunca del mes. */
  semestreElegido: Semestre;
  requisitos: RequisitoElegible[];
  onConfirmar: (selecciones: SeleccionEnviada[]) => Promise<{ ok: boolean; motivo?: string }>;
}

export function AltaMaterias({ anioElegido, semestreElegido, requisitos, onConfirmar }: MateriasProps) {
  const grupo = (r: RequisitoElegible) => grupoEnElAlta(r, anioElegido, semestreElegido);
  const { delAnio, anuales, deOtrosAnios, cupos } = useMemo(() => {
    const materias = requisitos.filter((r) => tratoEnElAlta(r.tipo) === "MATERIA");
    const de = (r: RequisitoElegible) => grupoEnElAlta(r, anioElegido, semestreElegido);
    return {
      // ADR-061: *"Mostrar primero las materias del semestre seleccionado. Mostrar
      // las materias anuales en un grupo separado. Permitir agregar materias de
      // otros años o períodos."*
      delAnio: materias.filter((r) => de(r) === "DEL_SEMESTRE"),
      anuales: materias.filter((r) => de(r) === "ANUALES"),
      deOtrosAnios: materias.filter((r) => de(r) === "OTROS"),
      // Los cupos del año elegido. Preguntar por los de quinto a alguien de
      // segundo sería ruido.
      cupos: requisitos.filter(
        (r) => tratoEnElAlta(r.tipo) === "CUPO" && (r.anio === null || r.anio === anioElegido),
      ),
    };
  }, [requisitos, anioElegido, semestreElegido]);

  /** Arranca con las obligatorias del año marcadas. Todas se pueden desmarcar. */
  const [marcadas, setMarcadas] = useState<Set<string>>(
    () => new Set(requisitos.filter((r) => sePreselecciona(r.tipo, grupo(r))).map((r) => r.requisitoId)),
  );
  const [verOtros, setVerOtros] = useState(false);
  /** Por cupo: la opción del plan elegida, o el nombre escrito a mano. */
  const [opcionDeCupo, setOpcionDeCupo] = useState<Record<string, string>>({});
  const [nombreDeCupo, setNombreDeCupo] = useState<Record<string, string>>({});
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function alternar(id: string) {
    setMarcadas((previas) => {
      const siguiente = new Set(previas);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  const selecciones: SeleccionEnviada[] = [
    ...requisitos
      .filter((r) => marcadas.has(r.requisitoId) && r.materiaId !== null)
      .map((r) => ({ requisito: r.requisitoId, materia: r.materiaId! })),
    ...cupos.flatMap<SeleccionEnviada>((c) => {
      const opcion = opcionDeCupo[c.requisitoId];
      if (opcion) return [{ requisito: c.requisitoId, materia: opcion }];
      const escrito = (nombreDeCupo[c.requisitoId] ?? "").trim();
      // Escrito a mano: entra como declaración del estudiante y **no toca el
      // catálogo**. Vacío no es un dato: la selección simplemente no existe.
      if (escrito) return [{ requisito: c.requisitoId, nombreEscrito: escrito }];
      return [];
    }),
  ];

  async function confirmar() {
    if (enCurso) return;
    if (selecciones.length === 0) {
      setError(t("ALTA.MATERIAS.SIN_SELECCION"));
      return;
    }
    setEnCurso(true);
    setError(null);
    const r = await onConfirmar(selecciones);
    if (!r.ok) {
      setError(r.motivo ?? t("ALTA.ERROR.RED"));
      setEnCurso(false);
    }
  }

  return (
    <MarcoDelAlta
      paso={3}
      titulo={t("ALTA.MATERIAS.TITULO")}
      ayuda={t("ALTA.MATERIAS.REGLA")}
      ancho={720}
    >
      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }} data-grupo="del-semestre">
        {delAnio.map((r) => (
          <FilaDeMateria
            key={r.requisitoId}
            requisito={r}
            marcada={marcadas.has(r.requisitoId)}
            onAlternar={() => alternar(r.requisitoId)}
          />
        ))}
      </section>

      {anuales.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: "8px" }} data-grupo="anuales">
          <h2 style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: 0 }}>
            {t("ALTA.MATERIAS.ANUALES")}
          </h2>
          <ReglaDeNegocio>{t("ALTA.MATERIAS.ANUALES_AYUDA")}</ReglaDeNegocio>
          {anuales.map((r) => (
            <FilaDeMateria
              key={r.requisitoId}
              requisito={r}
              marcada={marcadas.has(r.requisitoId)}
              onAlternar={() => alternar(r.requisitoId)}
            />
          ))}
        </section>
      )}

      {/*
        `CTA-017` del alta: la salida a otros años. Es secundaria porque el caso
        normal es cursar el año que declaraste — recursar o adelantarse es real y
        no es lo primero que se pregunta.
      */}
      {deOtrosAnios.length > 0 && (
        <CTASecundaria onClick={() => setVerOtros((v) => !v)}>
          {verOtros ? t("ALTA.MATERIAS.OCULTAR_OTROS") : t("ALTA.MATERIAS.OTROS_ANIOS")}
        </CTASecundaria>
      )}

      {verOtros && (
        <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {deOtrosAnios.map((r) => (
            <FilaDeMateria
              key={r.requisitoId}
              requisito={r}
              marcada={marcadas.has(r.requisitoId)}
              onAlternar={() => alternar(r.requisitoId)}
              mostrarAnio
            />
          ))}
        </section>
      )}

      {cupos.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/*
            Un subtítulo de sección, no la cabecera de la pantalla: el `h1` del
            alta lo pone el marco, y `TituloDePanel` dibuja el título de pantalla.
          */}
          <h2 style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: 0 }}>
            {t("ALTA.MATERIAS.ELECTIVAS")}
          </h2>
          <ReglaDeNegocio>{t("ALTA.MATERIAS.ELECTIVA_AYUDA")}</ReglaDeNegocio>
          {cupos.map((c) => (
            <Cupo
              key={c.requisitoId}
              cupo={c}
              opcion={opcionDeCupo[c.requisitoId] ?? ""}
              nombre={nombreDeCupo[c.requisitoId] ?? ""}
              onOpcion={(v) => setOpcionDeCupo((p) => ({ ...p, [c.requisitoId]: v }))}
              onNombre={(v) => setNombreDeCupo((p) => ({ ...p, [c.requisitoId]: v }))}
            />
          ))}
        </section>
      )}

      <ErrorDelAlta mensaje={error} />

      <CTAPrincipal disabled={enCurso} onClick={confirmar}>
        {enCurso ? t("ALTA.MATERIAS.GUARDANDO") : t("ALTA.MATERIAS.CTA")}
      </CTAPrincipal>
    </MarcoDelAlta>
  );
}

function FilaDeMateria({
  requisito,
  marcada,
  onAlternar,
  mostrarAnio = false,
}: {
  requisito: RequisitoElegible;
  marcada: boolean;
  onAlternar: () => void;
  mostrarAnio?: boolean;
}) {
  return (
    <label
      htmlFor={requisito.requisitoId}
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        cursor: "pointer",
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Checkbox
        id={requisito.requisitoId}
        checked={marcada}
        onCheckedChange={onAlternar}
        style={{ marginTop: "3px" }}
      />
      <span style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <span style={{ fontSize: "var(--text-body)" }}>{requisito.nombre}</span>
        {mostrarAnio && requisito.anio !== null && (
          <span style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
            {t("ALTA.MATERIAS.ANIO")} {requisito.anio}
            {/* Sin período declarado, la línea no lo inventa. */}
            {requisito.periodo !== null &&
              ` · ${t("ALTA.MATERIAS.SEMESTRE")} ${requisito.periodo === "FIRST_SEMESTER" ? 1 : 2}`}
          </span>
        )}
        {/*
          El nombre vino cortado de la fuente y **no se completa** (ADR-053). Se
          dice, en vez de mostrar un texto truncado que parezca un nombre.
        */}
        {requisito.nombreCortado && (
          <span style={{ fontSize: "var(--text-meta)", color: "var(--muted-foreground)" }}>
            {t("ALTA.MATERIAS.NOMBRE_CORTADO")}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * Un cupo. **Nunca preseleccionado**, y con dos caminos:
 *
 * - Hay opciones cargadas ⇒ se elige una del plan.
 * - No hay ⇒ el estudiante escribe el nombre, y queda **sin verificar**. Lo que
 *   escribe **no modifica el plan de nadie**.
 */
function Cupo({
  cupo,
  opcion,
  nombre,
  onOpcion,
  onNombre,
}: {
  cupo: RequisitoElegible;
  opcion: string;
  nombre: string;
  onOpcion: (v: string) => void;
  onNombre: (v: string) => void;
}) {
  const [aMano, setAMano] = useState(false);
  const hayOpciones = cupo.opciones.length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <Label htmlFor={`cupo-${cupo.requisitoId}`}>{cupo.nombre}</Label>

      {hayOpciones && !aMano ? (
        <>
          <NativeSelect
            id={`cupo-${cupo.requisitoId}`}
            value={opcion}
            onChange={(e) => onOpcion(e.target.value)}
          >
            <option value="">{t("ALTA.MATERIAS.ELECTIVA_NINGUNA")}</option>
            {cupo.opciones.map((o) => (
              <option key={o.materiaId} value={o.materiaId}>
                {o.nombre}
              </option>
            ))}
          </NativeSelect>
          <CTASecundaria
            onClick={() => {
              setAMano(true);
              onOpcion("");
            }}
          >
            {t("ALTA.MATERIAS.ELECTIVA_NO_ENCONTRADA")}
          </CTASecundaria>
        </>
      ) : (
        <>
          <Input
            id={`cupo-${cupo.requisitoId}`}
            value={nombre}
            placeholder=""
            onChange={(e) => onNombre(e.target.value)}
          />
          <ReglaDeNegocio>{t("ALTA.MATERIAS.ELECTIVA_SIN_OPCIONES")}</ReglaDeNegocio>
        </>
      )}
    </div>
  );
}
