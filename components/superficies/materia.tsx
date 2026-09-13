"use client";

import { useConsulta, type PropsDeSuperficie } from "./consulta";

import { useMigaDelObjeto } from "@/components/shell/miga-del-objeto";
import { useRouter } from "next/navigation";
import { MateriaCursado, MateriaCursadoEsqueleto } from "@/components/screens/materia-cursado";
import { NoSePudoCargar } from "@/components/shell/no-se-pudo-cargar";
import { escenarioDesde, getEscenario } from "@/lib/fixtures";
import { useSuperficie } from "@/lib/client/superficie";
import { rutaDeCta, rutaDeCtaCon, siguienteUrl } from "@/lib/navigation";
import { enviar } from "@/lib/client/api";
import { rutaDe } from "@/lib/navigation";
import type { ClaseEnLista, ClaseProps, MateriaProps, TusClases } from "@/lib/domain/view-models";

const DESTINO = rutaDeCta("CTA-002");
/** `CTA-009` — la Bitácora. Existe la ruta aunque no haya cursada que nombrar. */
const A_REGISTRO = rutaDeCta("CTA-009");
/** `CTA-019` — la entrada manual a Modo Examen desde la materia (ADR-016). */
const A_MODO_EXAMEN = rutaDeCta("CTA-019");
/** `CTA-022` — Modo Clase (ADR-098). */
const A_CLASE = rutaDeCta("CTA-022");

/**
 * Etapa B2.6 — `UX02` desde la base.
 *
 * Mismo patrón que `UX01`: con `?escenario=` proyecta el catálogo sintético;
 * sin él pide `/api/materia` con la sesión del estudiante. **Si la carga falla
 * no se dibuja el fixture**, porque un día que no es el del estudiante es
 * indistinguible de uno real.
 */
export function VistaDeMateria({ consulta }: PropsDeSuperficie) {
  const router = useRouter();
  const params = useConsulta(consulta);

  const escenario = params.get("escenario");
  // `?cursada=` sólo viaja si está: sin él el backend elige la de la Action viva.
  const cursada = params.get("cursada");
  const ruta = cursada ? `/api/materia?cursada=${encodeURIComponent(cursada)}` : "/api/materia";
  const { respuesta, reintentar } = useSuperficie<MateriaProps>(ruta, { omitir: !!escenario });

  if (escenario) {
    const id = escenarioDesde(escenario, "materia") ?? "FX-DAY-BASE";
    const props = getEscenario(id).materia;
    if (!props) throw new Error(`El escenario ${id} no proyecta esta vista`);
    return <Pantalla props={props} router={router} params={params} />;
  }

  // Mientras llega la respuesta, el esqueleto (`P-12`: nada salta al cargar).
  if (respuesta.estado === "CARGANDO") return <MateriaCursadoEsqueleto />;
  if (respuesta.estado !== "OK") {
    return (
      <NoSePudoCargar
        motivo={respuesta.estado}
        onReintentar={respuesta.estado === "SIN_PADRON" ? undefined : reintentar}
      />
    );
  }

  return <Pantalla props={respuesta.datos} router={router} params={params} />;
}

/**
 * *Tus clases* — [ADR-098](../../docs/decisions.md#adr-098) §9.
 *
 * ⚠️ **Se pide aparte, como el tablero de Hoy.** Si falla, la materia se dibuja
 * **sin la sección** en vez de no dibujarse: la cursada no depende de sus clases.
 * Bajo `?escenario=` no se pide nada: el Track A no tiene clases que listar.
 */
function useTusClases(cursadaId: string | null, omitir: boolean): { tusClases: TusClases | null; cargando: boolean } {
  const sinCursada = omitir || cursadaId === null;
  const lista = useSuperficie<{ clases: ClaseEnLista[] }>(
    `/api/clase?cursada=${encodeURIComponent(cursadaId ?? "")}`,
    { omitir: sinCursada },
  );
  const activa = useSuperficie<{ activa: ClaseProps | null }>("/api/clase", { omitir: sinCursada });
  if (sinCursada) return { tusClases: null, cargando: false };
  // Cargando mientras falte cualquiera de las dos y ninguna haya fallado: si una
  // falla, la sección no está, como antes.
  const estados = [lista.respuesta.estado, activa.respuesta.estado];
  if (lista.respuesta.estado !== "OK" || activa.respuesta.estado !== "OK") {
    return { tusClases: null, cargando: estados.every((e) => e === "OK" || e === "CARGANDO") };
  }

  const abierta = activa.respuesta.datos.activa;
  return {
    tusClases: {
      clases: lista.respuesta.datos.clases,
      entrada: abierta === null ? "INICIAR" : abierta.cursadaId === cursadaId ? "VOLVER" : null,
    },
    cargando: false,
  };
}

function Pantalla({
  props,
  router,
  params,
}: {
  props: MateriaProps;
  router: ReturnType<typeof useRouter>;
  params: URLSearchParams;
}) {
  // La última miga dice **qué materia**, no «Materia»: `Hoy › Materias ›
  // Emprendedorismo`. Pedido del owner, 9 sep 2026.
  useMigaDelObjeto(props.materia);

  // El recorrido de focus group manda sobre el destino genérico: en una
  // sesión, la CTA tiene que llevar a la estación siguiente.
  const destino = siguienteUrl("/materia", params.get("escenario")) ?? DESTINO;
  const { tusClases, cargando: tusClasesCargando } = useTusClases(props.cursadaId, !!params.get("escenario"));

  /**
   * `CTA-022` desde la materia: **Iniciar clase** fuera de horario, sin bloque.
   * Si ya había una abierta, el servidor la devuelve (`200`) o contesta `409`
   * con ella, y en los dos casos se va a `/clase`, que la muestra.
   */
  async function entrarAClase() {
    if (!A_CLASE || !props.cursadaId) return;
    if (tusClases?.entrada === "VOLVER") return router.push(A_CLASE);
    const r = await enviar<{ clase: string }>("/api/clase", { cursada: props.cursadaId, bloque: null });
    if (r.estado === "OK" || r.estado === "RECHAZADO") router.push(A_CLASE);
  }

  return (
    <MateriaCursado
      {...props}
      onAvanzar={destino ? () => router.push(destino) : undefined}
      // `CTA-009` con la cursada puesta. Con `cursadaId` en `null` —el Track A—
      // `rutaDeCtaCon` devuelve la ruta pelada y el backend elige, que es
      // exactamente lo que ADR-054 previó: no se inventa un id para completar
      // la URL.
      onVerRegistro={
        A_REGISTRO
          ? () => router.push(rutaDeCtaCon("CTA-009", props.cursadaId) ?? A_REGISTRO)
          : undefined
      }
      // `CTA-019`. `UX07` elige entre los `Assessment` de la cursada, así que
      // le llega la misma cursada que abrió esta pantalla.
      onModoExamen={
        A_MODO_EXAMEN
          ? () => router.push(rutaDeCtaCon("CTA-019", props.cursadaId) ?? A_MODO_EXAMEN)
          : undefined
      }
      tusClases={tusClases}
      tusClasesCargando={tusClasesCargando}
      onEntrarAClase={() => void entrarAClase()}
      onAbrirClase={(c) => {
        const base = rutaDe("CLASE");
        if (base) router.push(c.estado === "ACTIVE" ? base : `${base}?clase=${encodeURIComponent(c.id)}`);
      }}
    />
  );
}
