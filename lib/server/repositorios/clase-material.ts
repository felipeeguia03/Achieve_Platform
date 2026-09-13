import "server-only";

import type {
  ApunteFila,
  EtiquetaFila,
  GrabacionFila,
  MaterialFila,
  RepositorioDeMaterialDeClase,
} from "../servicios/clase-material";
import { clienteDeServicio } from "../supabase";

/**
 * Apuntes, material y grabaciones de una clase contra Postgres —
 * [ADR-099](../../../docs/decisions.md#adr-099).
 *
 * ⚠️ **El `institution_id` va en el `WHERE`** (I11), y lo que es «del
 * estudiante» se lee **uniendo con su clase**: una fila de otro no se lee y
 * después se descarta — no se lee.
 */

const UNICIDAD = "23505";

const COLUMNAS_APUNTE = "id, student_class_session_id, body, elapsed_seconds, idempotency_key, created_at, updated_at";
const COLUMNAS_MATERIAL = "id, student_class_session_id, kind, title, storage_key, url, mime_type, size_bytes, created_at";
const COLUMNAS_GRABACION =
  "id, student_class_session_id, storage_key, mime_type, size_bytes, duration_seconds, started_at_seconds, idempotency_key, created_at";
const COLUMNAS_ETIQUETA = "id, class_recording_id, label, at_seconds, created_at";

type Fila = Record<string, unknown>;

const aApunte = (f: Fila): ApunteFila => ({
  id: f.id as string,
  claseId: f.student_class_session_id as string,
  texto: f.body as string,
  segundos: (f.elapsed_seconds as number | null) ?? null,
  clave: f.idempotency_key as string,
  creadoEn: f.created_at as string,
  editadoEn: (f.updated_at as string | null) ?? null,
});

const aMaterial = (f: Fila): MaterialFila => ({
  id: f.id as string,
  claseId: f.student_class_session_id as string,
  tipo: f.kind === "FILE" ? "ARCHIVO" : "LINK",
  titulo: f.title as string,
  clave: (f.storage_key as string | null) ?? null,
  url: (f.url as string | null) ?? null,
  mime: (f.mime_type as string | null) ?? null,
  bytes: (f.size_bytes as number | null) ?? null,
  creadoEn: f.created_at as string,
});

const aGrabacion = (f: Fila): GrabacionFila => ({
  id: f.id as string,
  claseId: f.student_class_session_id as string,
  clave: f.storage_key as string,
  mime: f.mime_type as string,
  bytes: f.size_bytes as number,
  duracion: f.duration_seconds as number,
  inicioEnClase: f.started_at_seconds as number,
  idempotencia: f.idempotency_key as string,
  creadaEn: f.created_at as string,
});

const aEtiqueta = (f: Fila): EtiquetaFila => ({
  id: f.id as string,
  grabacionId: f.class_recording_id as string,
  texto: f.label as string,
  segundo: (f.at_seconds as number | null) ?? null,
  creadaEn: f.created_at as string,
});

function fallo(que: string, error: { message: string }): never {
  throw new Error(`No se pudo ${que}: ${error.message}`);
}

export const materialDeClaseReal: RepositorioDeMaterialDeClase = {
  // ── Apuntes ────────────────────────────────────────────────────────────────
  async apuntesDe(institutionId, claseId) {
    const { data, error } = await clienteDeServicio()
      .from("class_note_entry")
      .select(COLUMNAS_APUNTE)
      .eq("institution_id", institutionId)
      .eq("student_class_session_id", claseId)
      .order("created_at", { ascending: true });
    if (error) fallo("leer los apuntes", error);
    return ((data ?? []) as Fila[]).map(aApunte);
  },

  async apuntePorClave(institutionId, claseId, clave) {
    const { data, error } = await clienteDeServicio()
      .from("class_note_entry")
      .select(COLUMNAS_APUNTE)
      .eq("institution_id", institutionId)
      .eq("student_class_session_id", claseId)
      .eq("idempotency_key", clave)
      .maybeSingle();
    if (error) fallo("leer el apunte", error);
    return data ? aApunte(data as Fila) : null;
  },

  async crearApunte(institutionId, datos) {
    const { data, error } = await clienteDeServicio()
      .from("class_note_entry")
      .insert({
        institution_id: institutionId,
        student_class_session_id: datos.claseId,
        body: datos.texto,
        elapsed_seconds: datos.segundos,
        idempotency_key: datos.clave,
      })
      .select(COLUMNAS_APUNTE)
      .single();
    if (error?.code === UNICIDAD) return null;
    if (error) fallo("guardar el apunte", error);
    return aApunte(data as Fila);
  },

  async apunteDelEstudiante(institutionId, studentId, apunteId) {
    const { data, error } = await clienteDeServicio()
      .from("class_note_entry")
      .select(`${COLUMNAS_APUNTE}, clase:student_class_session_id!inner(student_id)`)
      .eq("institution_id", institutionId)
      .eq("id", apunteId)
      .eq("clase.student_id", studentId)
      .maybeSingle();
    if (error) fallo("leer el apunte", error);
    return data ? aApunte(data as Fila) : null;
  },

  async editarApunte(institutionId, apunteId, texto, ahora) {
    const { data, error } = await clienteDeServicio()
      .from("class_note_entry")
      .update({ body: texto, updated_at: ahora })
      .eq("institution_id", institutionId)
      .eq("id", apunteId)
      .select(COLUMNAS_APUNTE)
      .single();
    if (error) fallo("editar el apunte", error);
    return aApunte(data as Fila);
  },

  async borrarApunte(institutionId, apunteId) {
    const { error } = await clienteDeServicio()
      .from("class_note_entry")
      .delete()
      .eq("institution_id", institutionId)
      .eq("id", apunteId);
    if (error) fallo("borrar el apunte", error);
  },

  // ── Material ───────────────────────────────────────────────────────────────
  async materialDe(institutionId, claseId) {
    const { data, error } = await clienteDeServicio()
      .from("class_attachment")
      .select(COLUMNAS_MATERIAL)
      .eq("institution_id", institutionId)
      .eq("student_class_session_id", claseId)
      .order("created_at", { ascending: true });
    if (error) fallo("leer el material", error);
    return ((data ?? []) as Fila[]).map(aMaterial);
  },

  async materialPorClave(institutionId, clave) {
    const { data, error } = await clienteDeServicio()
      .from("class_attachment")
      .select(COLUMNAS_MATERIAL)
      .eq("institution_id", institutionId)
      .eq("storage_key", clave)
      .maybeSingle();
    if (error) fallo("leer el material", error);
    return data ? aMaterial(data as Fila) : null;
  },

  async crearMaterial(institutionId, datos) {
    const { data, error } = await clienteDeServicio()
      .from("class_attachment")
      .insert({
        institution_id: institutionId,
        student_class_session_id: datos.claseId,
        kind: datos.tipo === "ARCHIVO" ? "FILE" : "LINK",
        title: datos.titulo,
        storage_key: datos.clave,
        url: datos.url,
        mime_type: datos.mime,
        size_bytes: datos.bytes,
      })
      .select(COLUMNAS_MATERIAL)
      .single();
    if (error?.code === UNICIDAD) return null;
    if (error) fallo("guardar el material", error);
    return aMaterial(data as Fila);
  },

  async materialDelEstudiante(institutionId, studentId, materialId) {
    const { data, error } = await clienteDeServicio()
      .from("class_attachment")
      .select(`${COLUMNAS_MATERIAL}, clase:student_class_session_id!inner(student_id)`)
      .eq("institution_id", institutionId)
      .eq("id", materialId)
      .eq("clase.student_id", studentId)
      .maybeSingle();
    if (error) fallo("leer el material", error);
    return data ? aMaterial(data as Fila) : null;
  },

  async borrarMaterial(institutionId, materialId) {
    const { error } = await clienteDeServicio()
      .from("class_attachment")
      .delete()
      .eq("institution_id", institutionId)
      .eq("id", materialId);
    if (error) fallo("borrar el material", error);
  },

  // ── Grabaciones ────────────────────────────────────────────────────────────
  async grabacionesDe(institutionId, claseId) {
    const { data, error } = await clienteDeServicio()
      .from("class_recording")
      .select(`${COLUMNAS_GRABACION}, class_recording_tag(${COLUMNAS_ETIQUETA})`)
      .eq("institution_id", institutionId)
      .eq("student_class_session_id", claseId)
      .order("created_at", { ascending: true });
    if (error) fallo("leer las grabaciones", error);
    return ((data ?? []) as Fila[]).map((f) => ({
      ...aGrabacion(f),
      etiquetas: ((f.class_recording_tag as Fila[] | null) ?? []).map(aEtiqueta),
    }));
  },

  async grabacionPorClave(institutionId, claseId, idempotencia) {
    const { data, error } = await clienteDeServicio()
      .from("class_recording")
      .select(COLUMNAS_GRABACION)
      .eq("institution_id", institutionId)
      .eq("student_class_session_id", claseId)
      .eq("idempotency_key", idempotencia)
      .maybeSingle();
    if (error) fallo("leer la grabación", error);
    return data ? aGrabacion(data as Fila) : null;
  },

  async crearGrabacion(institutionId, datos, etiquetas) {
    const db = clienteDeServicio();
    const { data, error } = await db
      .from("class_recording")
      .insert({
        institution_id: institutionId,
        student_class_session_id: datos.claseId,
        storage_key: datos.clave,
        mime_type: datos.mime,
        size_bytes: datos.bytes,
        duration_seconds: datos.duracion,
        started_at_seconds: datos.inicioEnClase,
        idempotency_key: datos.idempotencia,
      })
      .select(COLUMNAS_GRABACION)
      .single();
    if (error?.code === UNICIDAD) return null;
    if (error) fallo("guardar la grabación", error);
    const grabacion = aGrabacion(data as Fila);
    if (etiquetas.length > 0) {
      const r = await db.from("class_recording_tag").insert(
        etiquetas.map((e) => ({
          institution_id: institutionId,
          class_recording_id: grabacion.id,
          label: e.texto,
          at_seconds: e.segundo,
        })),
      );
      if (r.error) fallo("guardar las etiquetas", r.error);
    }
    return grabacion;
  },

  async grabacionDelEstudiante(institutionId, studentId, grabacionId) {
    const { data, error } = await clienteDeServicio()
      .from("class_recording")
      .select(`${COLUMNAS_GRABACION}, clase:student_class_session_id!inner(student_id)`)
      .eq("institution_id", institutionId)
      .eq("id", grabacionId)
      .eq("clase.student_id", studentId)
      .maybeSingle();
    if (error) fallo("leer la grabación", error);
    return data ? aGrabacion(data as Fila) : null;
  },

  async borrarGrabacion(institutionId, grabacionId) {
    const { error } = await clienteDeServicio()
      .from("class_recording")
      .delete()
      .eq("institution_id", institutionId)
      .eq("id", grabacionId);
    if (error) fallo("borrar la grabación", error);
  },

  async crearEtiqueta(institutionId, datos) {
    const { data, error } = await clienteDeServicio()
      .from("class_recording_tag")
      .insert({
        institution_id: institutionId,
        class_recording_id: datos.grabacionId,
        label: datos.texto,
        at_seconds: datos.segundo,
      })
      .select(COLUMNAS_ETIQUETA)
      .single();
    if (error) fallo("guardar la etiqueta", error);
    return aEtiqueta(data as Fila);
  },

  async etiquetaDelEstudiante(institutionId, studentId, etiquetaId) {
    const { data, error } = await clienteDeServicio()
      .from("class_recording_tag")
      .select(`${COLUMNAS_ETIQUETA}, grabacion:class_recording_id!inner(clase:student_class_session_id!inner(student_id))`)
      .eq("institution_id", institutionId)
      .eq("id", etiquetaId)
      .eq("grabacion.clase.student_id", studentId)
      .maybeSingle();
    if (error) fallo("leer la etiqueta", error);
    return data ? aEtiqueta(data as Fila) : null;
  },

  async borrarEtiqueta(institutionId, etiquetaId) {
    const { error } = await clienteDeServicio()
      .from("class_recording_tag")
      .delete()
      .eq("institution_id", institutionId)
      .eq("id", etiquetaId);
    if (error) fallo("borrar la etiqueta", error);
  },
};
