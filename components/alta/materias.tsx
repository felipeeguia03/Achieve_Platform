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
import { tratoEnElAlta, sePreselecciona, type TipoDeRequisito } from "@/lib/domain/alta";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  CTAPrincipal,
  CTASecundaria,
  ReglaDeNegocio,
  TituloDePanel,
} from "@/components/screens/design-system";
import { ErrorDelAlta, MarcoDelAlta } from "./marco";

export interface RequisitoElegible {
  requisitoId: string;
  codigo: string;
  nombre: string;
  tipo: TipoDeRequisito;
  anio: number | null;
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
  requisitos: RequisitoElegible[];
  onConfirmar: (selecciones: SeleccionEnviada[]) => Promise<{ ok: boolean; motivo?: string }>;
}

export function AltaMaterias({ anioElegido, requisitos, onConfirmar }: MateriasProps) {
  const { delAnio, deOtrosAnios, cupos } = useMemo(() => {
    const materias = requisitos.filter((r) => tratoEnElAlta(r.tipo) === "MATERIA");
    return {
      delAnio: materias.filter((r) => r.anio === anioElegido),
      deOtrosAnios: materias.filter((r) => r.anio !== anioElegido),
      // Los cupos del año elegido. Preguntar por los de quinto a alguien de
      // segundo sería ruido.
      cupos: requisitos.filter(
        (r) => tratoEnElAlta(r.tipo) === "CUPO" && (r.anio === null || r.anio === anioElegido),
      ),
    };
  }, [requisitos, anioElegido]);

  /** Arranca con las obligatorias del año marcadas. Todas se pueden desmarcar. */
  const [marcadas, setMarcadas] = useState<Set<string>>(
    () => new Set(requisitos.filter((r) => sePreselecciona(r.tipo, r.anio, anioElegido)).map((r) => r.requisitoId)),
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
      <section style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {delAnio.map((r) => (
          <FilaDeMateria
            key={r.requisitoId}
            requisito={r}
            marcada={marcadas.has(r.requisitoId)}
            onAlternar={() => alternar(r.requisitoId)}
          />
        ))}
      </section>

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
          <TituloDePanel titulo={t("ALTA.MATERIAS.ELECTIVAS")} />
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
