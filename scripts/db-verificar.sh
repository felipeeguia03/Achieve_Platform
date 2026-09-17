#!/usr/bin/env bash
# Achieve Platform · Etapa B1.1 — verificación del entorno local.
#
# Comprueba lo que la Fase B1 promete y que ningún test de `npm test` puede
# comprobar, porque necesita una base corriendo: migraciones aplicadas y el
# deny-by-default de `docs/data-model.md` §6.
#
# NO está dentro de `npm test` a propósito: esa suite corre sin Docker, en
# cualquier máquina. Mezclarlas haría que las 531 dependieran del stack.
set -euo pipefail

CONTENEDOR="supabase_db_achieve-platform"

if ! docker exec "$CONTENEDOR" true 2>/dev/null; then
  echo "✗ El stack local no está corriendo. Levantalo con: npm run db:start"
  exit 1
fi

q() { docker exec -i "$CONTENEDOR" psql -U postgres -d postgres -tAX -c "$1"; }

fallos=0

echo "→ Migraciones aplicadas"
q "select version || '  ' || name from supabase_migrations.schema_migrations order by version;" | sed 's/^/   /'

echo "→ RLS deny-by-default (data-model.md §6)"
sin_rls=$(q "select coalesce(string_agg(nombre, ', '), '') from public.tablas_sin_rls();")
if [ -n "$sin_rls" ]; then
  echo "   ✗ Tablas de 'public' SIN RLS: $sin_rls"
  echo "     RLS es el cierre de la superficie autoexpuesta de Supabase, no la"
  echo "     autorización primaria. Una tabla sin RLS es una fuga."
  fallos=$((fallos + 1))
else
  echo "   ✓ ninguna tabla de 'public' sin RLS"
fi

echo "→ Privilegios de tabla (B1.3)"
sin_servicio=$(q "select coalesce(string_agg(nombre, ', '), '') from public.tablas_sin_acceso_de_servicio();")
if [ -n "$sin_servicio" ]; then
  echo "   ✗ el backend no puede leer: $sin_servicio"; fallos=$((fallos + 1))
else
  echo "   ✓ service_role llega a todas las tablas"
fi
expuestas=$(q "select coalesce(string_agg(nombre || ':' || rol, ', '), '') from public.tablas_expuestas_al_cliente();")
if [ -n "$expuestas" ]; then
  echo "   ✗ tablas de negocio alcanzables por el cliente: $expuestas"
  echo "     El frontend nunca lee ni escribe tablas de negocio (architecture.md §3.2)."
  fallos=$((fallos + 1))
else
  echo "   ✓ anon/authenticated no alcanzan ninguna tabla de negocio"
fi

echo "→ Append-only de product_event y audit_log (I12)"
violado=$(q "select coalesce(string_agg(nombre || ':' || privilegio, ', '), '') from public.tablas_append_only_violadas();")
if [ -n "$violado" ]; then
  echo "   ✗ el pasado se puede reescribir: $violado"; fallos=$((fallos + 1))
else
  echo "   ✓ nadie puede UPDATE ni DELETE sobre el registro de hechos"
fi

echo "→ Zona horaria institucional (ADR-049)"
zonas_malas=$(q "select coalesce(string_agg(i.name || ':' || i.timezone, ', '), '')
                   from institution i
                   left join pg_timezone_names z on z.name = i.timezone
                  where z.name is null;")
if [ -n "$zonas_malas" ]; then
  echo "   ✗ instituciones con una zona que el motor no conoce: $zonas_malas"
  echo "     Define el 'día calendario' de ADR-046 §5 y de la ventana de 14 días"
  echo "     de ADR-048. Mal escrita no falla al escribirla: falla al comparar días."
  fallos=$((fallos + 1))
else
  echo "   ✓ toda institución tiene una zona IANA que el motor reconoce"
fi

echo "→ Convenciones de §6 disponibles"
for fn in set_updated_at tablas_sin_rls tablas_sin_acceso_de_servicio tablas_expuestas_al_cliente tablas_append_only_violadas; do
  if [ "$(q "select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and proname='$fn';")" = "1" ]; then
    echo "   ✓ $fn()"
  else
    echo "   ✗ falta $fn()"; fallos=$((fallos + 1))
  fi
done

if [ "$fallos" -gt 0 ]; then
  echo; echo "✗ $fallos verificación(es) fallida(s)"; exit 1
fi
echo; echo "✓ entorno local conforme"
