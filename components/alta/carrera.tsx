"use client";

/**
 * Universidad, carrera y año — el tramo de **identidad académica** del spec.
 *
 * `product-spec-source.md` §7.1 la define exactamente así: *"Universidad/
 * facultad. Carrera. Plan. Año. Semestre."*, y `UF-S01` la pide como paso del
 * primer día: *"Solicitar universidad, carrera, plan, año y semestre"*.
 *
 * ## Dos cosas que esta pantalla no pregunta
 *
 * **La facultad.** Se infiere del plan y **se muestra para confirmar**: agregar
 * un paso que el sistema puede contestar solo es fricción sin información. Si
 * la fuente no la declara, la línea **desaparece** — omitir, no inventar.
 *
 * **La versión del plan, cuando hay una sola.** Se muestra igual que la
 * facultad. Se pregunta **sólo** si hay más de una vigente, porque ahí elegir
 * por el estudiante le cambiaría la carrera en silencio.
 *
 * ⚠️ **El semestre no se pregunta**, y queda declarado: el spec lo pide y este
 * tramo no lo cubre ([ADR-052](../../docs/decisions.md#adr-052)).
 *
 * ## Y una que dice la verdad
 *
 * Si la carrera no tiene plan publicado, la pantalla lo dice —*"Todavía no
 * tenemos el plan de esta carrera"*— y **no sigue**. No inventa materias ni
 * manda al estudiante a un `HOY` que afirme que no hay recomendación.
 */

import { useEffect, useState } from "react";

import { t } from "@/lib/content/es-AR";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { CTAPrincipal, HeroCard, ReglaDeNegocio } from "@/components/screens/design-system";
import { ErrorDelAlta, MarcoDelAlta } from "./marco";

export interface InstitucionElegible {
  institucionId: string;
  nombre: string;
  carreras: { carreraId: string; nombre: string; facultad: string | null; tienePlan: boolean }[];
}

export type PlanResuelto =
  | { estado: "OK"; planId: string; version: string }
  | { estado: "AMBIGUA"; planes: readonly { id: string; version: string }[] }
  | { estado: "SIN_PLAN" };

export interface CarreraProps {
  instituciones: InstitucionElegible[];
  /** Resuelve la versión del plan de una carrera. Lo decide el servidor. */
  onResolverPlan: (carreraId: string) => Promise<PlanResuelto | null>;
  /** Los años que ese plan declara. `[]` ⇒ el plan no declara ninguno. */
  onAniosDelPlan: (planId: string) => Promise<number[]>;
  onContinuar: (datos: { planId: string; anio: number }) => Promise<{ ok: boolean }>;
}

export function AltaCarrera({
  instituciones,
  onResolverPlan,
  onAniosDelPlan,
  onContinuar,
}: CarreraProps) {
  const [institucionId, setInstitucionId] = useState("");
  const [carreraId, setCarreraId] = useState("");
  const [planElegido, setPlanElegido] = useState("");
  const [anio, setAnio] = useState("");
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * **La respuesta se guarda junto con la clave que la produjo**, y *cargando*
   * se deduce en vez de setearse.
   *
   * Es el mismo patrón que `lib/client/superficie.ts` — y por el mismo motivo:
   * un `setState` síncrono dentro de un efecto dispara un render en cascada, y
   * el lint lo rechaza con razón. De paso cierra el agujero que una bandera de
   * vigencia no cubre: una respuesta vieja no puede quedar bajo una clave nueva.
   */
  const [planResuelto, setPlanResuelto] = useState<{ clave: string; r: PlanResuelto | null } | null>(
    null,
  );
  const [aniosCargados, setAniosCargados] = useState<{ clave: string; a: number[] } | null>(null);

  const institucion = instituciones.find((i) => i.institucionId === institucionId) ?? null;
  const carrera = institucion?.carreras.find((c) => c.carreraId === carreraId) ?? null;

  useEffect(() => {
    if (!carreraId) return;
    let vigente = true;
    onResolverPlan(carreraId).then((r) => {
      if (vigente) setPlanResuelto({ clave: carreraId, r });
    });
    return () => {
      vigente = false;
    };
  }, [carreraId, onResolverPlan]);

  /**
   * La carrera existe y **no tiene plan publicado**.
   *
   * Sale del catálogo, no de una segunda pregunta al servidor: `catalogo_ofrecible()`
   * ya trae `tienePlan`, y volver a preguntarlo sería dos verdades sobre lo mismo.
   */
  const sinPlanCargado = carrera !== null && !carrera.tienePlan;

  const plan = planResuelto && planResuelto.clave === carreraId ? planResuelto.r : null;

  /**
   * El plan efectivo: el único vigente, o el que el estudiante eligió cuando
   * hay más de uno. **No se elige por él** — `planElegido` sólo manda en la
   * rama ambigua.
   */
  const planActivo = plan?.estado === "OK" ? plan.planId : plan?.estado === "AMBIGUA" ? planElegido : "";

  useEffect(() => {
    if (!planActivo) return;
    let vigente = true;
    onAniosDelPlan(planActivo).then((a) => {
      if (vigente) setAniosCargados({ clave: planActivo, a });
    });
    return () => {
      vigente = false;
    };
  }, [planActivo, onAniosDelPlan]);

  // Los años que el plan **declara**. Mientras no hayan llegado, la lista está
  // vacía y el selector no aparece: nada salta al cargar (`P-12`).
  const anios = aniosCargados && aniosCargados.clave === planActivo ? aniosCargados.a : [];

  async function continuar() {
    if (!planActivo || !anio || enCurso) return;
    setEnCurso(true);
    setError(null);
    const r = await onContinuar({ planId: planActivo, anio: Number(anio) });
    if (!r.ok) {
      setError(t("ALTA.ERROR.RED"));
      setEnCurso(false);
    }
  }

  return (
    <MarcoDelAlta paso={2} titulo={t("ALTA.CARRERA.TITULO")} ancho={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Label htmlFor="institucion">{t("ALTA.CARRERA.INSTITUCION")}</Label>
        <NativeSelect
          id="institucion"
          value={institucionId}
          onChange={(e) => {
            setInstitucionId(e.target.value);
            setCarreraId("");
            setPlanElegido("");
            setAnio("");
          }}
        >
          <option value="" />
          {instituciones.map((i) => (
            <option key={i.institucionId} value={i.institucionId}>
              {i.nombre}
            </option>
          ))}
        </NativeSelect>
      </div>

      {institucion && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Label htmlFor="carrera">{t("ALTA.CARRERA.CARRERA")}</Label>
          <NativeSelect
            id="carrera"
            value={carreraId}
            onChange={(e) => {
              setCarreraId(e.target.value);
              setPlanElegido("");
              setAnio("");
            }}
          >
            <option value="" />
            {institucion.carreras.map((c) => (
              <option key={c.carreraId} value={c.carreraId}>
                {c.nombre}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      {/* Inferida y mostrada para confirmar. Sin dato, la línea desaparece. */}
      {carrera?.facultad && (
        <ReglaDeNegocio>
          {t("ALTA.CARRERA.FACULTAD")} {carrera.facultad}
        </ReglaDeNegocio>
      )}

      {plan?.estado === "OK" && (
        <ReglaDeNegocio>
          {t("ALTA.CARRERA.PLAN_UNICO")} {plan.version}
        </ReglaDeNegocio>
      )}

      {plan?.estado === "AMBIGUA" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Label htmlFor="plan">{t("ALTA.CARRERA.PLAN_VARIOS")}</Label>
          <NativeSelect
            id="plan"
            value={planElegido}
            onChange={(e) => {
              setPlanElegido(e.target.value);
              setAnio("");
            }}
          >
            <option value="" />
            {plan.planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.version}
              </option>
            ))}
          </NativeSelect>
          <ReglaDeNegocio>{t("ALTA.CARRERA.PLAN_AYUDA")}</ReglaDeNegocio>
        </div>
      )}

      {/*
        El estado honesto. **No es un error de carga:** es una carrera cuyo plan
        todavía no tenemos, dicho con todas las letras y sin materias inventadas.
      */}
      {(sinPlanCargado || plan?.estado === "SIN_PLAN") && (
        <HeroCard>
          <p style={{ fontSize: "var(--text-title-sm)", fontWeight: 600, margin: 0 }}>
            {t("ALTA.CARRERA.SIN_PLAN")}
          </p>
          <ReglaDeNegocio>{t("ALTA.CARRERA.SIN_PLAN_QUE_SIGUE")}</ReglaDeNegocio>
        </HeroCard>
      )}

      {planActivo && anios.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <Label htmlFor="anio">{t("ALTA.CARRERA.ANIO")}</Label>
          <NativeSelect id="anio" value={anio} onChange={(e) => setAnio(e.target.value)}>
            <option value="" />
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      <ErrorDelAlta mensaje={error} />

      <CTAPrincipal disabled={!planActivo || !anio || enCurso} onClick={continuar}>
        {t("ALTA.CARRERA.CTA")}
      </CTAPrincipal>
    </MarcoDelAlta>
  );
}
