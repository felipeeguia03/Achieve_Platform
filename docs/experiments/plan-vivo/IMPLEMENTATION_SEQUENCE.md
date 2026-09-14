# Secuencia de implementación de «Mi Plan vivo»

**Qué es:** el mapa de los nueve pasos que siguen a este, con qué decisión necesita cada uno, qué
reusa (**paths verificados**) y qué crearía (**paths propuestos, que hoy no existen**, marcados `✚`).

⚠️ **Los prompts 2–10 todavía no se leyeron.** Este orden es la propuesta que sale de la auditoría.
Cuando llegue cada prompt, **manda el prompt**; si pide algo que este mapa pone después o que depende
de una decisión abierta, se dice antes de ejecutar.

⚠️ **Ningún paso arranca con [ADR-109](../../decisions.md#adr-109) en `PENDING`** si depende de la
decisión que la columna nombra.

---

## Reglas para todos los pasos

1. **Dominio primero, pantalla al final.** Todo cálculo en `lib/domain/plan-vivo/` ✚, puro, con `ahora`
   y zonas por parámetro y una constante `REGLA_*` versionada.
2. **Reusar, no copiar.** Si una regla existe (`zona.ts`, `superposicion.ts`, `cobertura.ts`,
   `ventana.ts`, `duracion.ts`, `multiplicador.ts`, `reparto.ts`, `riesgos-de-planificacion.ts`,
   `ventana-de-examen.ts`, `renegociacion.ts`, `reloj-compromisos.ts`), se importa. **Una segunda
   aritmética es un defecto**, aunque dé lo mismo.
3. **Sin escrituras nuevas, sin migraciones, sin eventos nuevos.**
4. **Un commit por paso**, con los cinco gates en verde: `npm run lint`, `npm run typecheck`,
   `npm run build`, `npm test`, `npm run db:verify` (y `npm run db:demo` después).
5. **Tests en las dos direcciones**: lo que tiene que pasar y lo que tiene prohibido pasar.

---

## Paso 2 · El contrato de la proyección

| | |
|---|---|
| **Necesita** | D-02 (qué es un *candidato*), D-03 (forma del rango) |
| **Crea** ✚ | `lib/domain/plan-vivo/tipos.ts` — elementos duros, candidatos, rango `{min, probable, max, confianza, fuente, regla}`, ausencias tipadas · la entrada `PlanVivoProps` en `lib/domain/view-models.ts` |
| **Reusa** | `lib/domain/types.ts` (`CommitmentState`, `ActionStatus`), los motivos de ausencia de `lib/domain/ade.ts` (`MotivoDeAusencia`) y de `lib/domain/reparto.ts` |
| **Tests** ✚ | `tests/plan-vivo-tipos.test.ts`: ningún campo numérico sin su estado de ausencia; ningún campo de score, readiness ni dominio; los tipos no importan nada de `lib/server/` |

## Paso 3 · Lo duro: la línea de tiempo que no se mueve

| | |
|---|---|
| **Necesita** | D-06 (zona), D-08 (qué es duro) |
| **Crea** ✚ | `lib/domain/plan-vivo/restricciones.ts` |
| **Reusa** | `lib/domain/calendario.ts` (`fechasEntre`, `fechasDelBloque`, `minutosDelDia`), `lib/domain/zona.ts`, la forma de `BloqueSemanal` de `lib/domain/superposicion.ts` |
| **Reglas** | Bloques de `bloques_de_cursada()` y **ningún otro lado**; `inference` rotulado; compromisos `CONFIRMED`/`DUE`/`STARTED` fijos; `MISSED`/`CLOSED` visibles como incumplidos; `RENEGOTIATED` y `DRAFT` fuera (ADR-100 §2); horizonte ≤ última evaluación conocida (el período no tiene fechas) |
| **Tests** ✚ | Cambio de mes, compromiso a las 02:00 UTC que cae el día anterior en Córdoba, lista vacía de bloques, nada de otra cursada |

## Paso 4 · Estimaciones con rango, confianza y fuente

| | |
|---|---|
| **Necesita** | D-03 |
| **Crea** ✚ | `lib/domain/plan-vivo/estimacion.ts` |
| **Reusa** | `estimacionCentral()` y `MINIMO_DE_OBSERVACIONES` de `lib/domain/multiplicador.ts`; `FACTOR_DE_ESTUDIO_FALLBACK` y `FuenteDelFactor` de `lib/domain/duracion.ts` |
| **Reglas** | Multiplicador `≥ 1.0` y `≤ 2.0`; nunca expuesto como coeficiente; sin `min` ni `max` → sin rango; la fuente y la versión viajan siempre (ADR-075 §D) |
| **Tests** ✚ | Sin historia no calibra; `probable` nunca fuera de `[min, max]`; ningún texto dice *"tardás"* |

## Paso 5 · Los candidatos ordenados

| | |
|---|---|
| **Necesita** | **D-02** |
| **Crea** ✚ | Una función pura **nueva** que devuelva el orden completo que hoy calcula `recomendar()` en `lib/domain/ade.ts`. `recomendar()` **no cambia su salida** |
| **Reusa** | `lib/domain/ade.ts`, `lib/domain/validador-de-recomendacion.ts` |
| **Reglas** | El primer candidato **es exactamente** lo que `recomendar()` elige (test de equivalencia sobre los escenarios existentes); prerequisitos explícitos respetados; sin recurso no hay candidato ejecutable |
| **Tests** ✚ | Equivalencia; orden estable ante empates; `tests/` existentes del ADE siguen verdes sin tocarlos |

## Paso 6 · Ubicar lo blando

| | |
|---|---|
| **Necesita** | **D-01** |
| **Crea** ✚ | `lib/domain/plan-vivo/ubicacion.ts` |
| **Reusa** | `bloqueQueSeSuperpone`, `primerInicioSinClase` (`lib/domain/superposicion.ts`); `repartir`, `demandaSemanal` (`lib/domain/reparto.ts`) como techo semanal |
| **Reglas** | Sólo dentro de `availability` declarada; nunca sobre lo duro; sin disponibilidad declarada **no se ubica** y se dice; el sistema **no elige qué materia recortar** (ADR-073); sin *"agenda intensiva"* (ADR-075 §A) |
| **Tests** ✚ | Determinismo (misma entrada → misma salida); ninguna franja pisa un bloque o un compromiso; intervalos semiabiertos (terminar cuando empieza la clase no es conflicto, ADR-084) |

## Paso 7 · Explicación y contrafácticos

| | |
|---|---|
| **Necesita** | **D-04**, **D-05** |
| **Crea** ✚ | `lib/domain/plan-vivo/contrafacticos.ts`; claves `PLAN_VIVO.*` en `lib/content/es-AR.ts` |
| **Reusa** | `minutosPendientes`, `coberturaDeMateria` (`lib/domain/cobertura.ts`); `ventanaDe` (`lib/domain/ventana.ts`); `riesgosDePlanificacion`; `lib/domain/reloj-compromisos.ts` sin llamar a `/api/reloj`; `validarRecomendacion` |
| **Reglas** | Hechos, no predicciones; ni readiness ni dominio; frases prohibidas de `product.md` §13 y ADR-075 bajo guard |
| **Tests** ✚ | Guard de copy prohibido; "si la hacés" nunca afirma progreso (sólo *actividad registrada si se registra la evidencia*); "si pasan N días" nunca produce `MISSED` real |

## Paso 8 · El backend de lectura, detrás del flag

| | |
|---|---|
| **Necesita** | **D-09** |
| **Crea** ✚ | `lib/server/servicios/proyeccion-plan.ts`, `lib/server/repositorios/plan.ts`, `app/api/plan/route.ts`, el cableado en `lib/server/composicion.ts` |
| **Reusa** | Las lecturas de `lib/server/repositorios/tablero.ts`, `lib/server/repositorios/calendario.ts` y `lib/server/repositorios/horarios.ts`; `resolverSesion()` y el `409 ALTA_INCOMPLETA`; `lib/server/servicios/tiempo.ts` |
| **Reglas** | `PLAN_VIVO=1` o `404`; JWT; `institution_id` y `student_id` en el `WHERE`; **cero escrituras**; contrafácticos precalculados y acotados |
| **Tests** ✚ | Contrato del Controller (404 sin flag, 401 sin JWT, 409 alta incompleta); guard estático de que el repositorio no escribe; guard de que no emite eventos |

## Paso 9 · La vista `/plan`

| | |
|---|---|
| **Necesita** | D-09 y **las capturas**: abrir `../Achieve_Platform/docs/diseño/*.png` antes de dibujar. Si no se pueden abrir, **se para** |
| **Crea** ✚ | `app/(student)/plan/page.tsx`, un componente nuevo (no dentro de `components/screens/*` existentes), el nodo `PLAN_VIVO` en `lib/navigation/surfaces.ts` |
| **Reusa** | `EstadoChip`, `MarcaDeMateria`/`colorDeMateria`, tokens de `app/globals.css` (sin hex), el Shell y la miga |
| **Reglas** | Hover/foco elige un contrafáctico precalculado **sin request**; teclado con el mismo alcance que el mouse; una sola CTA primaria; los dos temas (claro/noche) |
| **Tests** ✚ | `tests/shell.test.tsx` a 17 rutas; hover no llama a `fetch`; sin flag no hay ítem en la barra; auditoría de `docs/design-system.md` §9 reportando lo que falle |

## Paso 10 · Modo Examen sobre el mismo eje, y cierre

| | |
|---|---|
| **Necesita** | **D-07** |
| **Crea** ✚ | Capa de marcas de preparación en `lib/domain/plan-vivo/` |
| **Reusa** | `lib/domain/ventana-de-examen.ts`, lecturas de `lib/server/servicios/preparacion.ts`, `CTA-019` |
| **Reglas** | Recomendar ≠ activar; sin *"paso N de M"*; sin readiness; sin segundo ponderador |
| **Cierre** | Actualizar esta carpeta, ADR-109 con lo construido, y **un plan de borrado** (qué se quita si el experimento no sigue: ruta, nodo, flag, módulos, tests) |

---

## Dependencias, en una línea por decisión

| Decisión | Pasos que bloquea |
|---|---|
| D-01 · ubicar lo no comprometido | 6, 8, 9 |
| D-02 · candidatos | 2, 5, 6, 7, 8, 9 |
| D-03 · rango y confianza | 2, 4 |
| D-04 · qué se dice del futuro | 7 |
| D-05 · dejar pasar el tiempo | 7 |
| D-06 · zona visible | 3 |
| D-07 · Modo Examen | 10 |
| D-08 · qué es duro | 3 |
| D-09 · ruta, flag, nombre | 8, 9 |
