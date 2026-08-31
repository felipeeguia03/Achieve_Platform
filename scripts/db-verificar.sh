#!/usr/bin/env bash
# Achieve Platform · Etapa B1.1 — verificación del entorno local.
#
# Comprueba lo que la Fase B1 promete y que ningún test de `npm test` puede
# comprobar, porque necesita una base corriendo: migraciones aplicadas y el
# deny-by-default de `docs/data-model.md` §6.
#
# NO está dentro de `npm test` a propósito: esa suite corre sin Docker, en
# cualquier máquina. Mezclarlas haría que las 396 dependieran del stack.
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

echo "→ Convenciones de §6 disponibles"
for fn in set_updated_at tablas_sin_rls; do
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
