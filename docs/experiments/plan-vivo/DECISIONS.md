# Decisiones del experimento «Mi Plan vivo»

**Estado:** 🔴 `PENDING` — registrado como [ADR-109](../../decisions.md#adr-109). **Lo cierra el owner.**
Un agente propuso y recomendó; no decidió (`docs/decisions.md`, regla 2).

Este documento hace tres cosas:

1. Contrasta las **doce invariantes** del pedido con lo que ya rige en el repositorio.
2. Contrasta las **reglas de producto** del pedido (hover, rangos, zona, CRM, Modo Examen).
3. Lista las **decisiones que faltan**, con opciones y una recomendación cada una.

Leyenda: ✅ **CONFIRMA** lo vigente · 🟡 **TENSIÓN** (compatible con una precisión) · 🔴 **CONFLICTO**
con un ADR `ACCEPTED` (necesita decisión).

---

## 1. Las doce invariantes contra el repositorio

| # | Invariante del pedido | Veredicto | Qué dice el repo | Resolución propuesta |
|---|---|---|---|---|
| 1 | Plataforma = verdad académica; CRM = operación y relación | ✅ | `architecture.md` §3.10; ADR-033 | Sin cambios |
| 2 | CRM/WhatsApp sólo por contratos versionados, sin base compartida | ✅ | `architecture.md` R4; ADR-035 difiere los flujos; ADR-041 limita los eventos facturables a cuatro | El plan **no viaja al CRM** en ningún prompt |
| 3 | Clases y evaluaciones = duras e inamovibles salvo actualización de la fuente institucional | 🟡 | La fuente **no siempre es institucional**: el estudiante declara bloques (ADR-063) y evaluaciones (ADR-067), hay bloques `inference` simulados (ADR-094), y ADR-064 manda ofrecer *"corregir el bloque de clase"* porque *"la pantalla no puede asumir que el equivocado es él"* | **Duras para el proyector**: nunca las mueve. **Editables por su dueño** por sus flujos existentes. Lo `inference` se rotula como estimado. Ver [D-08](#d-08) |
| 4 | Compromisos confirmados = restricciones; nunca se reubican en silencio | ✅ | `commitmentTransitions`; ADR-046 (el original queda `RENEGOTIATED`, nace otro) | El plan los fija y **enlaza** a `UX04` para cambiarlos |
| 5 | Acciones sugeridas no confirmadas = blandas, reordenables | 🔴 | Hoy **no existen varias**: `recomendar()` devuelve una por cursada y `NONE` si hay acción viva. Y ubicarlas en el tiempo choca con ADR-064 (*"el ADE nunca agenda"*), ADR-073 §3 (*"no agenda"*), ADR-085 (*"inventar un plan de estudio que nadie hizo"*), ADR-100 (sin *"Plan de estudio"* ni *"agendar un bloque"*) y `product.md` §12.3 (*"calendario propio completo"* fuera de alcance) | [D-01](#d-01) y [D-02](#d-02) |
| 6 | `EvidenceSubmitted`, `EvidenceValidated` y `ProgressUpdated` son transiciones distintas; validar no actualiza progreso por efecto lateral | ✅ | ADR-047 cerró `C01-018`: la validación **recibe un resultado explícito** y llama a `registrarProgreso` como paso separado; guard estático sobre los cuatro caminos. Los nombres canónicos son en inglés (`Evidence*`), no *"Evidencia*"* | Sin cambios; el plan no escribe ninguno |
| 7 | Pasar el tiempo recalcula una proyección; no escribe cada segundo | ✅ | El reloj sólo corre por `POST /api/reloj` (servicio); Focus late cada 30 s **sólo mientras hay sesión** (ADR-104 §9) | La proyección recibe `ahora` como parámetro; la vista no hace polling de escritura |
| 8 | Engines determinísticos, auditables, testeables; ningún LLM agenda | ✅ | ADR-004; ADR-080 `candidato, no decidido`; `lib/domain/` puro | Toda regla nueva con constante `REGLA_*` versionada |
| 9 | Duraciones como rango `min/probable/max`, con confianza y fuente | 🟡 | Hay `action.estimated_minutes_min/max` (nullable, `SOURCE CONTRACT PENDING`), sin `probable` ni confianza por `Action`. `estimacionCentral()` ya usa el punto medio (ADR-074). Los temas llevan fuente (`FuenteDelFactor`) y ADR-075 §D exige *"guardar siempre la fuente y la versión"* | [D-03](#d-03) |
| 10 | Modo Examen: manual o por regla (14 días) y agrega hitos/prioridad al plan común | 🟡 | La regla existe, pero **recomienda, no activa** (ADR-048; activar es `CTA-019`/`UX07`). `ExamPreparation` tiene su propio protocolo y sus versiones de plan (ADR-038). *"Hito"* es vocabulario vetado: se dice `ProtocolStep` (`AGENTS.md` §4). *"Tu plan fue generado"* está prohibido al activar (`product.md` §13) | [D-07](#d-07) |
| 11 | Compromiso con acción, día/hora, duración, evidencia esperada, estado, prometido vs realizado; renegociable antes; el incumplimiento no se borra | 🟡 | Todo existe salvo el matiz: *evidencia esperada* vive en la `Action` y es contrato pendiente (se omite si falta); *realizado* es `focus_session` (*«tiempo registrado en Focus»*, nunca *«tiempo efectivo»*) y `reflection.actual_minutes`; renegociar tiene **cinco condiciones** (mismo día institucional, una vez por cadena, ≥ 15 min — ADR-046) | Se adoptan los límites de ADR-046 tal cual. `MISSED` visible siempre (ADR-100 §2 ya lo dibuja *incumplido*) |
| 12 | Cada acción responde *"¿qué parte de mi futuro académico cambia si hago esto?"* | 🟡 | La salida mínima del ADE ya exige **razón** (ADR-004). Pero *"futuro"* roza lo prohibido: sin predicción de aprobación ni readiness (ADR-058), cobertura ≠ dominio (ADR-072), y ADR-075 exige que todo número sea *comparable, contextualizado, accionable y sobre la tarea* | [D-04](#d-04) |

## 2. Las reglas de producto del pedido

| Regla | Veredicto | Resolución |
|---|---|---|
| Hover/foco sólo simula, nunca escribe | ✅ | Contrafácticos precalculados por el Service; el hover no hace requests (`SYSTEM_MAP.md` §4) |
| Completar una acción ≠ registrar progreso | ✅ | ADR-047 y la cadena de no-implicación (`AGENTS.md` §2.1) |
| Estimaciones como rangos con confianza y fuente; sin falsa precisión | 🟡 | [D-03](#d-03). Si falta el rango, **la línea se omite** (`architecture.md` §4) |
| CRM y WhatsApp acompañan; la Plataforma es la fuente | ✅ | Sin cambios |
| Modo Examen no es otro planificador | 🟡 | [D-07](#d-07) |
| Fechas visibles en `America/Argentina/Cordoba`; persistencia con la convención existente | 🟡 | ADR-049: las superficies muestran **`student.timezone`** (default Córdoba) y las reglas usan **`institution.timezone`**. Hardcodear Córdoba contradice ese ADR y `lib/domain/zona.ts`. [D-06](#d-06) |

## 3. Otras reglas vigentes que el experimento hereda sin discusión

- **La UI proyecta, nunca decide** (`architecture.md` P1). El orden viene del dominio.
- **Sin datos no es cero.** Sin disponibilidad declarada no se ubica nada: se dice que falta y se ofrece
  el dato (ADR-075 §A, *"faltan datos para estimar"*).
- **Omitir, no inventar.** Sin evaluación no hay ventana (ADR-078); un tema sin sus puntas no se ubica
  (ADR-085); sin rango, no hay línea de duración.
- **Ninguna frase prohibida** de `product.md` §13 ni de ADR-075: nada de *"no vas a llegar"*, *"estás
  atrasado"*, *"sumá X horas"*, *"dejá esta materia"*, ni *"una agenda intensiva que ignore sueño,
  trabajo, traslados, cuidados u otras obligaciones"*.
- **El multiplicador no se muestra como número sobre la persona** (ADR-074).
- **No se ordena por cobertura** (ADR-072 §2) ni por gravedad de riesgo (ADR-093 §4).
- **Voseo**, y copy con ID en `lib/content/` (`C-07`).
- **Datos sintéticos** únicamente (ADR-006).

---

## 4. Decisiones para el owner

Cada una con opciones y una recomendación. **La recomendación no es la decisión.**

<a id="d-01"></a>

### D-01 · ¿Se autoriza ubicar en el tiempo propuestas que nadie comprometió?

**Choca con:** ADR-064, ADR-073 §3, ADR-085, ADR-100 y `product.md` §12.3.

| Opción | Qué es | Costo |
|---|---|---|
| **A · Laboratorio con flag** | Se ubican franjas **sugeridas** dentro de la disponibilidad declarada, sin pisar lo duro. Rotuladas como propuesta, no persistidas, sin crear nada. Sólo con `PLAN_VIVO=1`. Enmienda acotada a los cuatro ADR, **sólo para la ruta del experimento** | Una segunda representación del tiempo que convive con `UX01`, Calendario y Materias; hay que evitar que se contradigan |
| B · Secuencia sin horario | Se ordena *qué va primero* por día, sin hora | Menos choque (no agenda), menos "plan visible" |
| C · No se autoriza | El experimento se reduce a explicar la próxima acción y sus contrafácticos | Cae la mitad de la hipótesis |

**Recomendación: A**, con la regla de que la franja **se deriva sólo** de disponibilidad declarada menos
lo duro, y que sin disponibilidad declarada **no hay franja**.

<a id="d-02"></a>

### D-02 · ¿De dónde salen varias propuestas si el ADE da una?

| Opción | Qué es | Costo |
|---|---|---|
| **A · Candidatos proyectados** | El dominio expone el orden completo de `costoDeNoActuar` (hoy local en `recomendar`) como función pura nueva. **Sólo la primera se materializa como `Action`**, igual que hoy; las demás son *candidatos* de la proyección, **no `Action`** | Hay que nombrar "candidato" en el glosario; no puede decirse *acción* en la UI de algo que no es `Action` |
| B · Materializar N `Action` `RECOMMENDED` | Cada propuesta es una fila | Rompe *"exactamente una recomendación principal"* (ADR-004, `DD9`) y el `NONE` con acción viva |

**Recomendación: A.** No toca el ADE persistido ni el Hero.

<a id="d-03"></a>

### D-03 · Rango `min/probable/max` y confianza

| Opción | Qué es | Costo |
|---|---|---|
| **A · Derivado, sin migración** | `probable` = `estimacionCentral()` (ya existe); `confianza` = escalón de la fuente de ADR-075 §D (*institucional → por actividad → mediana histórica → fallback 1,5*) más el estado del multiplicador (`SIN_HISTORIA`, provisional con 5–9, estable con ≥ 10) | *Probable* es un punto medio, no una moda observada: se tiene que decir |
| B · Columnas nuevas en `action` | `estimated_minutes_probable`, `estimate_confidence` | Migración y escritor antes de tener dato que la llene ("no crees las columnas antes que su escritor") |

**Recomendación: A.** Y sin `min` ni `max`, **sin línea**.

<a id="d-04"></a>

### D-04 · Qué se puede decir sobre "el futuro"

**Propuesta de frontera**, sobre hechos que el repo ya calcula:

| Se puede afirmar (hecho o proyección rotulada) | No se afirma |
|---|---|
| Qué tema y qué evaluación toca la propuesta | Que vas a aprobar, o a llegar |
| Cuántos minutos pendientes estimados quedan en esa materia, en rango, y cuánto baja **si se registra la evidencia** | Dominio, nivel, readiness o porcentaje aprendido |
| Cuántos días de ventana quedan hasta la evaluación | *"Estás atrasado"*, *"frenada"* |
| Qué riesgo de `PLAN-v0.1` se enciende o se apaga (p. ej. `SIN_ACTIVIDAD_CERCA`) | Un riesgo sobre la persona |
| *Actividad registrada* con los tres estados de ADR-075 §C | Cobertura como nota |

**Pregunta al owner:** ¿esta frontera alcanza para la hipótesis? **Y un gate:** ADR-075 exige
**revisión de la psicopedagoga** del copy antes de cualquier estudiante real. El experimento es
sintético, así que no bloquea construir, pero **bloquea mostrarlo a personas**.

<a id="d-05"></a>

### D-05 · "Dejar pasar el tiempo"

| Opción | Qué es | Costo |
|---|---|---|
| **A · Horizonte fijo** | Dos lecturas: *si la hacés hoy* y *si pasan N días sin hacerla*, con N elegido por el owner (propuesta: 3 y 7) | Simple, auditable |
| B · Control deslizante | El estudiante elige cuántos días | Más contrafácticos precalculados; más payload |

En los dos casos: sobre un compromiso vivo, pasar el tiempo **usa la regla provisional de
`reloj-compromisos.ts`** y lo dice (*"según la regla provisional"*), sin llamar a `/api/reloj`.

**Recomendación: A**, con N = 3 y 7.

<a id="d-06"></a>

### D-06 · Zona horaria de lo visible

| Opción | Qué es |
|---|---|
| **A · Seguir ADR-049** | Se muestra en `student.timezone` (default Córdoba); las reglas con `institution.timezone`; aritmética sólo por `lib/domain/zona.ts` |
| B · Córdoba fija en la vista | Contradice ADR-049 para cualquier estudiante con otra zona |

**Recomendación: A.** Para los datos sintéticos da el mismo resultado que pide el prompt.

<a id="d-07"></a>

### D-07 · Modo Examen dentro del plan

**Propuesta:**

- La regla de 14 días **recomienda** (marca en el plan con `CTA-019` hacia `UX07`). **Nunca activa.**
- Con una preparación `ACTIVE`, el plan muestra sus `ProtocolStep` como **marcas de esa preparación**,
  sin *"paso N de M"*, sin readiness y sin *"tu plan fue generado"*.
- *"Modifica prioridades"* ya ocurre: la evaluación suma `+1000` en `costoDeNoActuar`. **No se agrega
  un segundo ponderador** para Modo Examen sin ADR.
- La replanificación sigue siendo de la preparación (ADR-038), no del plan.

**Pregunta al owner:** ¿acepta que "el mismo plan" signifique *mostrar* la preparación sobre el mismo
eje, y no *fusionar* sus máquinas?

<a id="d-08"></a>

### D-08 · "Salvo actualización de la fuente institucional"

**Propuesta:** reemplazar por *"salvo corrección por su dueño, por el flujo que ya existe"*. El dueño
puede ser la institución, la ingesta o el estudiante (ADR-063, ADR-064, ADR-067). El proyector no
distingue: **nunca las mueve**.

<a id="d-09"></a>

### D-09 · Ruta, nodo, flag y nombre

| Pieza | Propuesta |
|---|---|
| Ruta | `/plan` en `app/(student)/plan/page.tsx` |
| Nodo | `PLAN_VIVO`, `wireframe: null`. **No es `UX10`** |
| Flag | `PLAN_VIVO=1`, server-side, `404`/`notFound()` sin él; sin ítem de barra lateral sin él |
| CTAs nuevas | **Ninguna.** Confirmar lleva a `UX04`/`POST /api/compromiso` con las CTAs existentes; abrir materia es `CTA-001`; Modo Examen es `CTA-019` |
| Tests que cambian | `tests/shell.test.tsx` (16 → 17 rutas, un nodo más) |
| Nombre visible | ⚠️ **Abierto.** *"Mi Plan"* choca con el rechazo de *"Plan de estudio"* en ADR-100 y con *"Tu plan fue generado"* en `product.md` §13. Alternativas: *"Tu semana"*, *"Lo que se viene"*. **Lo nombra el owner** |

---

## 5. Lo que queda bloqueado mientras ADR-109 siga `PENDING`

- **Prompts 2 a 10** de la secuencia, en lo que implemente contra D-01, D-02 o D-09.
- Se puede, sin esperar: **leer**, **proponer tipos en documentos** y **escribir tests de las reglas
  vigentes** que el plan va a respetar, siempre que no introduzcan comportamiento nuevo.
