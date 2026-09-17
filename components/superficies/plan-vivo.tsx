"use client";

import { useConsulta, type PropsDeSuperficie } from "./consulta";

import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { PlanVivo, type DialogoDelPlan, type ModoDeImpacto } from "@/components/screens/plan-vivo";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { enviar } from "@/lib/client/api";
import { useSuperficie } from "@/lib/client/superficie";
import { t } from "@/lib/content/es-AR";
import { esFechaDeCalendario, lunesDe, sumarDias } from "@/lib/domain/calendario";
import { filasSemanales } from "@/lib/domain/plan-vivo/disponibilidad";
import { MINUTO, unir } from "@/lib/domain/plan-vivo/intervalos";
import {
  planificar,
  validarIntercambio,
  validarUbicacion,
} from "@/lib/domain/plan-vivo/planificador";
import {
  disponibilidadDeHistorial,
  disponibilidadSinGuardar,
  entradaDe,
  estadoReal,
  estadoVisible,
  propuestasAutomaticas,
  reducir,
  SESION_INICIAL,
  type Operacion,
} from "@/lib/domain/plan-vivo/sesion";
import type { Intervalo, ManualPresentation, PlanningInput, PlanVivoBase } from "@/lib/domain/plan-vivo/tipos";
import type { MateriaProps } from "@/lib/domain/view-models";
import { desdeElPlan } from "@/lib/navigation/migas";

/**
 * **Plan vivo en el Calendario** — [ADR-110](../../docs/decisions.md#adr-110).
 *
 * El contenedor: pide la base, lleva la sesión (operaciones, deshacer,
 * simulación), valida lo que hace el estudiante y escribe **sólo** por los dos
 * contratos que ya existen —`POST /api/compromiso` y
 * `POST /api/alta/disponibilidad`—. La pantalla recibe todo calculado.
 *
 * ⚠️ **Una sola proyección.** Calendario, cola, métricas e impacto leen el
 * mismo `planificar(entrada)`; nadie recalcula su propio mundo.
 */
export function VistaDePlanVivo({ consulta }: PropsDeSuperficie) {
  const params = useConsulta(consulta);
  const pedida = params.get("semana");
  const semana = esFechaDeCalendario(pedida) ? lunesDe(pedida) : null;
  // La sesión es de una semana: otra semana empieza de cero.
  return <PlanDeLaSemana key={semana ?? "actual"} semana={semana} params={params} />;
}

function PlanDeLaSemana({ semana, params }: { semana: string | null; params: URLSearchParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const { respuesta, reintentar } = useSuperficie<PlanVivoBase>(
    semana ? `/api/plan-vivo?semana=${semana}` : "/api/plan-vivo",
  );

  if (respuesta.estado !== "OK" && respuesta.estado !== "CARGANDO") {
    return (
      <NoSePudoCargar motivo={respuesta.estado} onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar} />
    );
  }

  const irA = (lunes: string | null) => {
    const siguiente = new URLSearchParams(params.toString());
    if (lunes) siguiente.set("semana", lunes);
    else siguiente.delete("semana");
    const texto = siguiente.toString();
    router.replace(texto ? `${pathname}?${texto}` : pathname, { scroll: false });
  };

  if (respuesta.estado === "CARGANDO") return <PlanVivo cargando />;
  return <Plan base={respuesta.datos} recargar={reintentar} irA={irA} />;
}

function Plan({ base, recargar, irA }: { base: PlanVivoBase; recargar: () => void; irA: (lunes: string | null) => void }) {
  const router = useRouter();
  const [sesion, despachar] = useReducer(reducir, SESION_INICIAL);
  const [presentacion, setPresentacion] = useState<ManualPresentation>("GUIDED");
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [explicacion, setExplicacion] = useState<string | null>(null);
  const [editandoDisponibilidad, setEditandoDisponibilidad] = useState(false);
  const [dialogo, setDialogo] = useState<DialogoDelPlan | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [impacto, setImpacto] = useState<ModoDeImpacto>("ACTUAL");
  const [materiaDelImpacto, setMateriaDelImpacto] = useState<string | null>(base.materias[0]?.cursadaId ?? null);
  const [ocupado, setOcupado] = useState(false);
  const clave = useRef<string | null>(null);

  const estado = useMemo(() => estadoVisible(sesion), [sesion]);
  const entrada = useMemo(() => entradaDe(base, estado), [base, estado]);
  const proyeccion = useMemo(() => planificar(entrada), [entrada]);
  const real = useMemo(() => estadoReal(sesion), [sesion]);
  const proyeccionReal = useMemo(() => planificar(entradaDe(base, real)), [base, real]);

  const itemDe = useCallback((id: string) => base.items.find((i) => i.id === id) ?? null, [base]);
  const materiaSeleccionada = seleccion ? (itemDe(seleccion)?.cursadaId ?? null) : materiaDelImpacto;
  const materia = useSuperficie<MateriaProps>(
    materiaSeleccionada ? `/api/materia?cursada=${encodeURIComponent(materiaSeleccionada)}` : "/api/materia",
    { omitir: !materiaSeleccionada },
  );

  const operar = (op: Operacion, mensaje?: string) => {
    despachar({ tipo: "OPERAR", op });
    setDialogo(null);
    if (mensaje) setAviso(mensaje);
  };

  const titulo = (id: string) => itemDe(id)?.title ?? "";

  /** Hasta `n` horarios de la disponibilidad libre donde el trabajo entra sin conflicto. */
  const alternativas = (input: PlanningInput, itemId: string, n: number): number[] => {
    const item = itemDe(itemId);
    if (!item?.durationRange) return [];
    const libres = unir(input.disponibilidad.map((d) => ({ ini: Math.max(d.ini, base.ahora), fin: d.fin })));
    const salida: number[] = [];
    const paso = 15 * MINUTO;
    for (const f of libres) {
      for (let ini = Math.ceil(f.ini / paso) * paso; ini + item.durationRange.likelyMinutes * MINUTO <= f.fin; ini += paso) {
        if (validarUbicacion(input, itemId, ini).tipo === "OK") {
          salida.push(ini);
          ini += item.durationRange.likelyMinutes * MINUTO - paso;
          if (salida.length >= n) return salida;
        }
      }
    }
    return salida;
  };

  const ubicar = (itemId: string, ini: number) => {
    const r = validarUbicacion(entrada, itemId, ini);
    switch (r.tipo) {
      case "OK":
        return operar({ tipo: "UBICAR", itemId, ini, salen: [] }, `${titulo(itemId)}: ubicada.`);
      case "CONFLICTO":
        return setDialogo({ tipo: "CONFLICTO", itemId, motivo: r.motivo, contra: r.contra, alternativas: alternativas(entrada, itemId, 2) });
      case "CONFIRMAR":
        return setDialogo({ tipo: "CONFIRMAR", itemId, ini, sinDisponibilidad: r.sinDisponibilidad, superpone: r.superpone, reubica: r.reubica, pierden: r.pierden });
    }
  };

  const soltarSobre = (arrastrado: string, destino: string) => {
    const colocado = proyeccion.placedItems.find((p) => p.itemId === destino);
    if (!colocado || arrastrado === destino) return;
    if (!proyeccion.placedItems.some((p) => p.itemId === arrastrado)) return ubicar(arrastrado, colocado.ini);
    const r = validarIntercambio(entrada, arrastrado, destino);
    if (r.tipo === "DIRECTO") {
      return operar({ tipo: "INTERCAMBIAR", a: r.a, b: r.b, salen: r.salen }, `${titulo(arrastrado)} y ${titulo(destino)}: intercambiadas.`);
    }
    if (r.tipo === "REORGANIZAR") {
      return setDialogo({ tipo: "INTERCAMBIO", a: r.a, b: r.b, salen: r.salen, afectados: [...r.salen, ...r.movidos] });
    }
    setDialogo({ tipo: "CONFLICTO", itemId: r.itemId, motivo: r.motivo, contra: null, alternativas: [] });
  };

  const confirmarCompromiso = async (itemId: string, ini: number) => {
    const item = itemDe(itemId);
    if (!item?.actionId || !item.durationRange) return;
    clave.current ??= crypto.randomUUID();
    setOcupado(true);
    const r = await enviar<{ compromiso: string }>("/api/compromiso", {
      accion: item.actionId,
      inicio: new Date(ini).toISOString(),
      zona: base.zona,
      minutos: item.durationRange.likelyMinutes,
      clave: clave.current,
    });
    setOcupado(false);
    if (r.estado === "OK") {
      clave.current = null;
      setDialogo(null);
      setAviso(t("PLAN_VIVO.COMPROMISO.LISTO"));
      // Lo que el estudiante movió sobrevive a la base nueva; el compromiso sale de la cola solo.
      despachar({ tipo: "BASE_ACTUALIZADA", conservar: estadoReal(sesion) });
      recargar();
      return;
    }
    const motivo = r.estado === "RECHAZADO" ? r.motivo : t("PLAN_VIVO.ERROR");
    setDialogo({ tipo: "COMPROMETERME", itemId, ini, error: motivo });
  };

  const guardarDisponibilidad = async () => {
    setOcupado(true);
    const r = await enviar("/api/alta/disponibilidad", { bloques: filasSemanales(base, entradaDe(base, real).disponibilidad) });
    setOcupado(false);
    if (r.estado !== "OK") {
      setAviso(r.estado === "RECHAZADO" ? r.motivo : t("PLAN_VIVO.ERROR"));
      return;
    }
    despachar({ tipo: "BASE_ACTUALIZADA", conservar: { ...real, agregada: [], quitada: [] } });
    setAviso(t("PLAN_VIVO.DISPONIBILIDAD_GUARDADA"));
    recargar();
  };

  const colocado = (id: string) => proyeccion.placedItems.find((p) => p.itemId === id) ?? null;
  const historial = disponibilidadDeHistorial(sesion);

  return (
    <PlanVivo
      base={base}
      proyeccion={proyeccion}
      proyeccionReal={sesion.simulacion ? proyeccionReal : null}
      estado={estado}
      simulando={sesion.simulacion !== null}
      presentacion={presentacion}
      seleccion={seleccion}
      explicacion={explicacion}
      editandoDisponibilidad={editandoDisponibilidad}
      puedeDeshacer={historial.deshacer}
      puedeRehacer={historial.rehacer}
      disponibilidadSinGuardar={!sesion.simulacion && disponibilidadSinGuardar(real)}
      dialogo={dialogo}
      aviso={aviso}
      ocupado={ocupado}
      impacto={impacto}
      materiaDelImpacto={materiaSeleccionada}
      materia={materia.respuesta.estado === "OK" ? materia.respuesta.datos : null}
      materiaCargando={materia.respuesta.estado === "CARGANDO"}
      onSemana={(sentido) => irA(sentido === 0 ? null : sumarDias(base.semana, 7 * sentido))}
      onEstrategia={(valor) =>
        operar({ tipo: "ESTRATEGIA", valor, conservar: propuestasAutomaticas(proyeccion) })
      }
      onPresentacion={setPresentacion}
      onSeleccionar={(id) => {
        setSeleccion(id);
        if (id) setImpacto("SELECCION");
      }}
      onPorQue={setExplicacion}
      onUbicar={ubicar}
      onSoltarSobre={soltarSobre}
      onDevolver={(id) => operar({ tipo: "DEVOLVER", itemId: id }, `${titulo(id)}: devuelta a la lista.`)}
      onFijar={(id) => {
        const p = colocado(id);
        if (p) operar({ tipo: "FIJAR", itemId: id, ini: p.ini }, `${titulo(id)}: fijada.`);
      }}
      onDesfijar={(id) => operar({ tipo: "DESFIJAR", itemId: id }, `${titulo(id)}: desfijada.`)}
      onElegirHorario={(id) => setDialogo({ tipo: "ELEGIR", itemId: id, opciones: alternativas(entrada, id, 6) })}
      onComprometerme={(id) => {
        const p = colocado(id);
        if (p) setDialogo({ tipo: "COMPROMETERME", itemId: id, ini: p.ini, error: null });
      }}
      onConfirmarCompromiso={confirmarCompromiso}
      onEditarDisponibilidad={setEditandoDisponibilidad}
      onCrearDisponibilidad={(franja: Intervalo) =>
        operar({ tipo: "AGREGAR_DISPONIBILIDAD", franja }, "Disponibilidad agregada.")
      }
      onQuitarDisponibilidad={(franja: Intervalo) =>
        operar({ tipo: "QUITAR_DISPONIBILIDAD", franja }, "Disponibilidad quitada.")
      }
      onGuardarDisponibilidad={guardarDisponibilidad}
      onVaciar={() => setDialogo({ tipo: "VACIAR" })}
      onReconstruir={() => operar({ tipo: "RECONSTRUIR" }, "Volviste a la propuesta de Achieve.")}
      onSimular={() => {
        despachar({ tipo: "ENTRAR_A_SIMULACION" });
        setAviso(`${t("PLAN_VIVO.SIMULANDO")}. ${t("PLAN_VIVO.SIMULANDO_AYUDA")}`);
      }}
      onDescartarSimulacion={() => {
        despachar({ tipo: "DESCARTAR_SIMULACION" });
        setAviso("Simulación descartada. Volviste a tu plan real.");
      }}
      onSimularHecha={(id) => operar({ tipo: "SIMULAR_HECHA", itemId: id }, `${titulo(id)}: supuesta realizada.`)}
      onDeshacer={() => {
        despachar({ tipo: "DESHACER" });
        setAviso("Deshecho.");
      }}
      onRehacer={() => {
        despachar({ tipo: "REHACER" });
        setAviso("Rehecho.");
      }}
      onImpacto={(modo, cursada) => {
        setImpacto(modo);
        if (cursada !== undefined) {
          setMateriaDelImpacto(cursada);
          setSeleccion(null);
        }
      }}
      onAbrir={(ruta) => router.push(desdeElPlan(ruta, base.semana))}
      onCerrarDialogo={() => {
        clave.current = null;
        setDialogo(null);
      }}
      onAceptarDialogo={(d) => {
        switch (d.tipo) {
          case "CONFIRMAR":
            // Con disponibilidad nueva, la franja se agrega en la misma operación: deshacer saca las dos cosas.
            return d.sinDisponibilidad
              ? operar({ tipo: "AGREGAR_Y_UBICAR", franja: d.sinDisponibilidad, itemId: d.itemId, ini: d.ini }, `${titulo(d.itemId)}: asignada. Se agregó disponibilidad.`)
              : operar({ tipo: "UBICAR", itemId: d.itemId, ini: d.ini, salen: [] }, `${titulo(d.itemId)}: asignada.`);
          case "INTERCAMBIO":
            return operar({ tipo: "INTERCAMBIAR", a: d.a, b: d.b, salen: d.salen }, "Intercambiadas.");
          case "VACIAR":
            return operar({ tipo: "VACIAR" }, "Propuestas quitadas. Organizás a mano.");
          default:
            return setDialogo(null);
        }
      }}
    />
  );
}
