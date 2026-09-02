import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * El vocabulario, con criterio profesional — Etapa B6.7.1, punto **9.5** de
 * [ADR-037](../docs/decisions.md#adr-037).
 *
 * La fuente literal es
 * [`validacion-psicopedagogica-source.md`](../docs/validacion-psicopedagogica-source.md)
 * y **manda sobre cualquier paráfrasis**, incluidos estos tests: lo que se
 * verifica acá se cita de ahí.
 *
 * La frase que ordena la etapa: **«el sistema debe reconocer patrones, no
 * etiquetar personas»**.
 */
const MIGRACION = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260906000000_vocabulario_psicopedagogico.sql"),
  "utf8",
);

const FUENTE = readFileSync(
  resolve(process.cwd(), "docs/validacion-psicopedagogica-source.md"),
  "utf8",
);

describe("9.5 · las cinco familias, y la sexta que no vuelve", () => {
  it("la fuente sigue diciendo lo que esta etapa implementa", () => {
    // Si alguien edita la transcripción, esta etapa deja de tener fundamento.
    // La fuente **no se corrige**: es lo que la profesional escribió.
    // Se compara sin los saltos de línea del markdown: lo que no puede cambiar
    // son las palabras, no dónde corta la línea.
    const plano = FUENTE.replace(/\s+/g, " ");
    expect(plano).toContain("Conservar **cinco familias académicas**");
    expect(plano).toContain(
      "**Reemplazar 'dependencia de ayuda externa' por «necesidad de apoyo para avanzar», registrada como condición de desempeño y no como error.**",
    );
    expect(plano).toContain("Permitir **categoría principal + secundaria**");
    expect(plano).toContain("Incluir **'clasificación incierta'** y **opción de corrección humana**");
  });

  it("las cinco familias entran como versión nueva, no como filas nuevas", () => {
    // Los `canonical_id` **no cambian**: es la misma familia redefinida. Si
    // cambiaran, el contador vería familias distintas donde hay una sola.
    for (const canonical of ["conceptual", "procedimiento", "consigna", "calculo", "omision"]) {
      expect(MIGRACION).toContain(`('${canonical}', 'v2.0-psicopedagogia'`);
    }
  });

  it("'dependencia' NO tiene fila en v2.0", () => {
    // > *"La necesidad de ayuda puede ser esperable y productiva; denominarla
    // > 'dependencia' corre el riesgo de estigmatizar."*
    expect(MIGRACION).not.toContain("('dependencia', 'v2.0-psicopedagogia'");
  });

  it("y la fila que el Product Owner escribió no se edita ni se borra", () => {
    // Se apaga con un `UPDATE`, como `EP-SPEC v0.1` y como `ACKNOWLEDGED`.
    // Editarla sería reescribir lo que él afirmó en su momento.
    expect(MIGRACION).toContain(
      "UPDATE error_type SET is_current = FALSE WHERE version = 'v1.0-po-provisional';",
    );
    expect(MIGRACION).not.toMatch(/DELETE\s+FROM\s+error_type/i);
    expect(MIGRACION).not.toMatch(/UPDATE\s+error_type\s+SET\s+(label|canonical_id|es_familia)/i);
  });

  it("'clasificación incierta' está en el catálogo y se declara no-familia", () => {
    // *"No se pudo determinar"* **es una respuesta**, y por eso entra al
    // catálogo en vez de dejar la clasificación en `NULL`. Pero no es una
    // familia: contar repeticiones de "no sé" es el falso positivo que ella marcó.
    expect(MIGRACION).toMatch(
      /\('clasificacion_incierta', 'v2\.0-psicopedagogia'[\s\S]*?FALSE, TRUE\)/,
    );
  });

  it("la necesidad de apoyo vive en otra tabla, con su propio vocabulario", () => {
    expect(MIGRACION).toContain("CREATE TABLE support_need_observation");
    expect(MIGRACION).toContain("CREATE TABLE support_need_type");
    expect(MIGRACION).toContain("('necesidad_de_apoyo', 'v1.0-psicopedagogia'");
    // Una sola fila: ella nombró **una** condición, y no se inventan valores.
    expect(MIGRACION.match(/INSERT INTO support_need_type/g) ?? []).toHaveLength(1);
  });

  it("la corrección humana es append-only y exige motivo", () => {
    expect(MIGRACION).toContain("CREATE TABLE error_classification_correction");
    expect(MIGRACION).toContain("reason         TEXT NOT NULL CHECK (length(btrim(reason)) > 0)");
    // Identidad externa **sin FK**: quién puede corregir no está definido.
    expect(MIGRACION).toMatch(/corrected_by\s+UUID,/);
    expect(MIGRACION).not.toMatch(/corrected_by\s+UUID[^,]*REFERENCES/);
  });

  it("la corrección registra la fila y recién después actualiza", () => {
    // Que el `INSERT` de la corrección esté **antes** del `UPDATE` de la
    // observación es lo que hace que la clasificación anterior no se pierda.
    const insert = MIGRACION.indexOf("INSERT INTO error_classification_correction");
    const update = MIGRACION.indexOf("UPDATE error_observation");
    expect(insert).toBeGreaterThan(-1);
    expect(update).toBeGreaterThan(insert);
  });

  it("las tres tablas nuevas nacen con RLS", () => {
    for (const tabla of [
      "support_need_type",
      "support_need_observation",
      "error_classification_correction",
    ]) {
      expect(MIGRACION).toMatch(new RegExp(`ALTER TABLE ${tabla}\\s+ENABLE ROW LEVEL SECURITY`));
    }
  });

  it("no toca un solo umbral: eso es la B6.7.2", () => {
    // Ella no objetó los números —`repeat_signal_at = 2` y `human_review_at = 3`
    // quedaron donde estaban—, objetó **qué cuenta como una repetición**. Se
    // miran las sentencias, no los comentarios: el encabezado explica por qué
    // los umbrales siguen donde están, y nombrarlos ahí es correcto.
    const sentencias = MIGRACION.split("\n")
      .filter((l) => !l.trimStart().startsWith("--"))
      .join("\n");
    expect(sentencias).not.toContain("threshold_config");
    expect(sentencias).not.toContain("risk_rule");
  });
});

describe("9.5 · el contador no puede leer lo que no es un error", () => {
  const SERVICIO = readFileSync(
    resolve(process.cwd(), "lib/server/servicios/reiteracion.ts"),
    "utf8",
  );
  const REPO = readFileSync(
    resolve(process.cwd(), "lib/server/repositorios/reiteracion.ts"),
    "utf8",
  );
  const DOMINIO = readFileSync(resolve(process.cwd(), "lib/domain/reiteracion.ts"), "utf8");

  it("ni el Service ni el repositorio nombran la tabla de necesidades de apoyo al contar", () => {
    // B6.7.3 sí la lee para **entregar contexto a la persona**. Lo que sigue
    // prohibido es que la query del contador la toque.
    const contador = REPO.match(/async observaciones[\s\S]*?\n  },\n\n  \/\*\* La corrección/)?.[0] ?? "";
    expect(contador).not.toContain('from("support_need_observation")');
    expect(REPO).toContain('from("support_need_observation")');
    expect(SERVICIO).not.toContain("support_need_observation");
  });

  it("registrar una necesidad de apoyo no recibe con qué escalar", () => {
    // La firma no tiene `senales` ni `destino`: **no puede** acercar a nadie a
    // una escalada, y eso es más fuerte que un comentario pidiendo que no.
    expect(SERVICIO).toMatch(
      /export async function registrarNecesidadDeApoyo\(\s*deps: \{ repo: RepositorioDeReiteracion \},/,
    );
  });

  it("la categoría secundaria no llega al evaluador puro", () => {
    // *"Mantener un indicador transversal por tipo para análisis, **pero sin
    // usarlo solo para escalar**."*
    expect(DOMINIO).not.toContain("secondary");
    expect(DOMINIO).not.toContain("secundaria: ");
  });

  it("el contador lee por familia, nunca por fila de versión", () => {
    // Filtrar por `error_type_id` partiría el contador al cargar una versión
    // nueva del vocabulario, en silencio.
    expect(REPO).toContain("error_type.canonical_id");
    expect(REPO).not.toContain('.eq("error_type_id", errorTypeId)');
  });

  it("el embed nombra la FK de la categoría principal", () => {
    // Desde que existe `secondary_error_type_id` hay **dos** relaciones entre
    // `error_observation` y `error_type`, y un embed sin nombre falla contra
    // PostgREST —*"more than one relationship was found"*—. Nombrar la FK es
    // además lo que garantiza que el contador lee **la principal**.
    expect(REPO).toContain("error_observation_error_type_id_fkey");
    expect(REPO).not.toContain("error_type!inner(");
  });
});
