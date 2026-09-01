# Brief para el CTO — ADR-008 · las tres vulnerabilidades `high`

**Documento:** `docs/brief-adr-008-seguridad.md`
**Fecha:** 1 de septiembre de 2026
**Asignado a:** CTO
**Condición:** **previa a cualquier despliegue con usuarios o datos reales.**

---

## Qué hay

`npm audit` reporta **3 vulnerabilidades `high`**, verificadas el 30 de agosto de 2026:

| Paquete | Por qué está |
|---|---|
| `next` (`16.2.6`) | La versión fijada cae dentro del rango afectado |
| `postcss` | Transitiva de `next` |
| `sharp` | CVEs heredadas de `libvips` (`GHSA-f88m-g3jw-g9cj`) |

## Qué NO hacer

**`npm audit fix --force` directo sobre la rama principal.** Instala `next@16.3.3`, que está **fuera
del rango declarado** en `package.json`: subir la versión mayor del framework es una decisión de
[ADR-008](decisions.md#adr-008), no un efecto colateral de un comando.

## El procedimiento acordado

1. **Abrir ADR-008** con la decisión de versión.
2. **Identificar versiones corregidas compatibles** — no la última, la que resuelve y es compatible.
3. **Upgrade en una rama aislada.**
4. **Ejecutar build, tests, migraciones y pruebas de regresión.** En este repo eso es:
   - `npm run lint` · `npm run build` · `npm test` — **678 tests**
   - `npm run db:reset` y `npm run db:verify` — **134 comprobaciones contra Postgres**, que
     `npm test` no puede hacer porque necesitan Docker
   - El recorrido de focus group en el navegador, a 1440 y a 360 px
5. **Volver a correr `npm audit`.**
6. **Documentar cualquier vulnerabilidad residual y su mitigación** en el propio ADR-008.

**Objetivo: cero `high` antes del despliegue.**

## Contexto que conviene tener

**Esto ya se saltó un gate una vez.** La Etapa 0.1 registró la deuda como *"a evaluar antes del Done
de la Fase 0"*, y **la Fase 0 se cerró 8/8 sin evaluarla**. Está anotado en `roadmap.md` §3.1 en vez
de enterrado en la narrativa de una etapa vieja, precisamente para que no vuelva a pasar.

**Qué mitiga el riesgo hoy, y qué no.** El MVP corre con persistencia local y datos sintéticos, y no
está desplegado: el árbol vulnerable no está expuesto. **Eso deja de valer con el primer despliegue o
la primera persona real**, y las dos cosas están cerca — el gate de [ADR-006](decisions.md#adr-006)
es lo único que hoy las frena.

## Lo que este repo ya tiene y conviene no romper

- **RLS deny-by-default** en las 19 tablas, verificado en cada corrida de `db:verify`.
- **El frontend no alcanza ninguna tabla de negocio** — hay guard estático y verificación de
  privilegios contra Postgres.
- **`product_event` y `audit_log` son append-only**, revocado incluso para `service_role`.
- **Storage privado**: leer sin firma da `400`, probado contra el storage real.

Un upgrade que rompa cualquiera de esas cuatro cosas lo va a mostrar `db:verify`, no el build.
