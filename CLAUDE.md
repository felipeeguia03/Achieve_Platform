# CLAUDE.md

## ⚠️ Leé [`AGENTS.md`](AGENTS.md) primero

Este repositorio tiene reglas canónicas para agentes de IA en **[`AGENTS.md`](AGENTS.md)**. Son
normativas, no orientativas. Este archivo es solo una referencia rápida.

---

## Qué es esto

**Achieve** — acompañante académico para estudiantes universitarios. Cada día le dice al estudiante
qué acción concreta hacer para no perder el ritmo de sus materias, con una persona real como
supervisor y fallback.

Se trabaja con **Spec Driven Development**: la fuente de verdad son los markdown de `docs/`, y el
código sigue a la documentación. Si discrepan, **el código es el defectuoso**.

---

## Las seis reglas

1. **No inventes reglas de negocio.** Siguen abiertas **32 de las 51 filas `C01`** (más
   `C01-052`) y **8 de las 20** de [`decisiones-abiertas.md`](docs/decisiones-abiertas.md). Las 8
   psicopedagógicas ([ADR-025](docs/decisions.md#adr-025)) y la obligatoriedad de `Reflection`
   ([ADR-026](docs/decisions.md#adr-026)) están respondidas, pero **con residuos**. Si falta una
   regla, registrala como ADR `PENDING` y **preguntá**.
2. **No resuelvas una decisión `PENDING`.** La cierra una persona.
3. **Datos reales: bloqueo absoluto** hasta que [ADR-006](docs/decisions.md#adr-006) tenga
   **dictamen legal**. Sus decisiones de producto ya están tomadas (1 sep 2026), pero en estado
   `PROVISIONAL — LEGAL CONFIRMATION REQUIRED`: **eso no levanta el gate.** El backend se construye
   sobre datos sintéticos, sin excepciones ni "una prueba chica".
4. **Una etapa por vez, completa.** Readiness → decisiones aprobadas → implementar → verificar →
   commit → docs actualizados. **Verificar es `npm run lint`, `npm run typecheck`, `npm run build`,
   `npm test` y `npm run db:verify`** — los cinco. ⚠️ `typecheck` es un gate propio: `vitest` borra
   los tipos con esbuild y el build de Next no alcanza los tests, así que un mock desactualizado
   pasa los dos y **sólo lo ve `tsc`**.
5. **Antes de tocar UI, abrí las capturas de `docs/diseño/`.** Achieve es desktop-first y su
   lenguaje visual sale de ahí ([ADR-018](docs/decisions.md#adr-018)). **La carpeta no está
   versionada:** si la encontrás vacía, **decilo y pará** — no improvises un diseño.
6. **No reescribas `components/screens/*`, `app/globals.css` ni `components/ui/*`** salvo que el
   roadmap lo pida.

---

## Los invariantes que más se rompen

> Preparar contenido no es enviarlo. Enviar no es suficiencia. Suficiencia no es validación.
> Validación no es dominio.

- Aceptar una `Action` **no** crea un `Commitment`.
- `Evidence` `SUBMITTED` **no** implica suficiencia ni revisión.
- `UNDER_REVIEW` **exige una revisión real creada**, no un método configurado.
- `VALIDATED` **no** produce `ProgressUpdated`.
- **Un `Commitment` `MISSED` nunca se edita para parecer cumplido.** El rescate es otro objeto.
- **Sin datos no es cero.** "No evaluado" ≠ "bajo" ≠ "no disponible" ≠ `0`.
- **La UI proyecta, nunca decide.** No rankea ni genera Actions.
- **Omitir, no inventar.** Si falta un contrato, la línea desaparece.

Lista completa: [`AGENTS.md`](AGENTS.md) §2.

---

## Dónde está cada cosa

| Necesito… | Voy a |
|---|---|
| Entender el dominio, un estado o el copy permitido | [`docs/product.md`](docs/product.md) |
| Saber qué está bloqueado y por qué | [`docs/decisions.md`](docs/decisions.md) |
| Saber qué toca hacer ahora | [`docs/roadmap.md`](docs/roadmap.md) |
| Tocar UI | **`docs/diseño/*.png` primero**, después [`docs/design-system.md`](docs/design-system.md) |
| Ver qué patrón visual usar | [`docs/design-system-capturas.md`](docs/design-system-capturas.md) |
| Tocar datos | [`docs/data-model.md`](docs/data-model.md) |
| Tocar estructura | [`docs/architecture.md`](docs/architecture.md) |
| Aplicar un principio del manual de diseño | [`docs/domain-translation-dd1-dd10.md`](docs/domain-translation-dd1-dd10.md) |
| Saber si algo está decidido | [`docs/pending-decisions-annex.md`](docs/pending-decisions-annex.md) |
| Saber **qué falta decidir y quién lo decide** | [`docs/decisiones-abiertas.md`](docs/decisiones-abiertas.md) — veinte filas, **ocho abiertas**, por lo que destraban |
| Período, comisión y horarios de cursada | [ADR-060](docs/decisions.md#adr-060)…[ADR-065](docs/decisions.md#adr-065) · impacto en [`informe-periodo-comision-horarios.md`](docs/informe-periodo-comision-horarios.md) · plan en [`plan-periodo-comision-horarios.md`](docs/plan-periodo-comision-horarios.md) |
| **Responder** las abiertas | [`docs/agenda-decisiones-abiertas-po.md`](docs/agenda-decisiones-abiertas-po.md) — **seis ya respondidas el 5 sep 2026**; quedan las cinco de terceros |
| Qué decidió el owner el 5 de septiembre | [`docs/respuesta-po-agenda-decisiones-source.md`](docs/respuesta-po-agenda-decisiones-source.md) — **fuente literal**, manda sobre cualquier paráfrasis |
| Saber qué levantó el recorrido a mano | [`docs/roadmap.md`](docs/roadmap.md) §0.2 — los dos hallazgos del 5 de septiembre, y el dock de **modo prueba** |
| Volver a recorrer el alta desde cero | `MODO_PRUEBA=1` y el dock al pie — [`docs/demo-mvp.md`](docs/demo-mvp.md) |
| Escribir contenido del protocolo de examen | [`docs/roadmap-modo-examen-source.md`](docs/roadmap-modo-examen-source.md) — **los 20 pasos, su voz literal**. Y [`human-p0-source.md`](docs/human-p0-source.md) para las ocho reglas |
| Buscar evidencia esperada de un paso | [`docs/cuadro-problemas-source.md`](docs/cuadro-problemas-source.md) — **propuesto, no cargado**: tiene preguntas abiertas de la autora |
| Nombrar algo como lo nombra el oficio | [`docs/indice-psicopedagogico-source.md`](docs/indice-psicopedagogico-source.md) |
| Tocar registro, elegibilidad o integración CRM | [`docs/platform-integration-contract.md`](docs/platform-integration-contract.md) — §2.1 la propuesta de contrato v2, §2.2 **lo que la Fase B6 necesita de él** |
| Saber en qué quedó la integración con el CRM | [`docs/contrato-riesgo-candidato-v0.2.md`](docs/contrato-riesgo-candidato-v0.2.md) §11 (flujos A·B·C, **congelados**) y [`docs/respuesta-crm-flujos-d-e-v0.1.md`](docs/respuesta-crm-flujos-d-e-v0.1.md) (flujos **D · actividad** y **E · teléfono**, aceptados con cambios) |
| Preparar la consulta legal | [`docs/legal-package.md`](docs/legal-package.md) |
| Cerrar los residuos psicopedagógicos | [`docs/agenda-cierre-psicopedagoga.md`](docs/agenda-cierre-psicopedagoga.md) |
| Cerrar las tres decisiones del Product Owner | [`docs/agenda-decisiones-po-crm.md`](docs/agenda-decisiones-po-crm.md) — ADR-041, ADR-042 y ADR-043, con contexto y opciones |
| Resolver las vulnerabilidades `high` | [`docs/brief-adr-008-seguridad.md`](docs/brief-adr-008-seguridad.md) |
| El spec original completo | `docs/product-spec-source.md` — **no se edita** |

---

## Estado actual

🔴 **El recorrido a mano del 5 de septiembre dejó dos hallazgos abiertos** —
[`roadmap.md`](docs/roadmap.md) §0.2. Los dos importan antes de tocar nada:

🆕 **`UX01` es un tablero desde el 11 de septiembre** — [ADR-093](docs/decisions.md#adr-093). Hero +
próximos 7 días, *Riesgos detectados* y las evaluaciones **en dos opciones que conviven sólo hasta que
el owner elija una**. Salieron de Hoy la cola `1 de N`, el mapa de 14 días y el reparto (los datos
siguen en `HoyProps`).

⚠️ **Los riesgos de `UX01` NO son `RiskSignal`.** Son reglas de **planificación** sobre el calendario y
la carga (`lib/domain/riesgos-de-planificacion.ts`, `PLAN-v0.1`): no escriben, no emiten eventos, no
abren intervenciones y **no cambian el estado general**. `C01-021` sigue abierto. Si tocás un umbral,
**cambiá la versión**.

🆕 **Y el mismo día los 7 días pasaron a ser *Tu día*** — [ADR-094](docs/decisions.md#adr-094):
clases de hoy con `Un.` y aula, *Podés avanzar* y horarios. **No es una agenda**: sin botones salvo
abrir una materia.

⚠️ **`Un.` es la unidad de la ÚLTIMA clase dada, no la de hoy.** No hay cronograma futuro, y
simular clases futuras estiraba el Gantt de `UX02`. **No lo "arregles" inventando clases.**

⚠️ **`class_schedule_block.room` existe y hereda la procedencia del bloque.** Hoy toda aula es
simulada: `node scripts/simular-aulas.mjs --aplicar` sólo escribe sobre bloques `inference`, y hay
que correrlo **después** de `simular-temarios --aplicar`, que regenera los bloques sin aula.

✅ **El apartado «Materias» quedó decidido** el 5 de septiembre de 2026:
[ADR-054](docs/decisions.md#adr-054), **opción `B`** — `CTA-001` transporta el `CourseEnrollment`
seleccionado y la pantalla abre exactamente ése. El incumplimiento de `VI.2` §5.2 está cerrado.

✅ **Y las opciones `A` y `C` se cerraron el 8 de septiembre de 2026** —
[ADR-077](docs/decisions.md#adr-077), decididas por el owner con las capturas delante, que es como
[ADR-054](docs/decisions.md#adr-054) pidió que se tomaran. **El área «Materias» existe**: `/materias`
lista todas las cursadas ordenadas por próxima evaluación, y el ítem del menú por fin apunta ahí.

⚠️ **`/materias` NO es `UX10`, y el modo de lograrlo importa.** Es un nodo con `wireframe: null` en
`surfaces.ts` —el mismo patrón que `UX04_RENEGOCIACION`—, así que `superficieIds` sigue devolviendo
**nueve** y la afirmación del spec sigue siendo cierta. **Hay once rutas bajo `app/(student)` y nueve
superficies** —`/materias` y `/formacion` son los dos nodos sin wireframe—, y los dos números se
verifican por separado en `tests/shell.test.tsx`.

⚠️ **El registro canónico sigue en 20 CTAs.** Entrar a una materia desde el índice es `CTA-001`, que
ganó un origen. Las tres etiquetas del botón —*Abrir*, *Completar*, *Agregar examen*— son **copy**:
las tres navegan a la misma materia.

✅ **Y el «Gantt del período» se construyó el mismo día** — [ADR-078](docs/decisions.md#adr-078).
`/materias` tiene **dos vistas** sobre los mismos datos, con un selector.

⚠️ **ADR-078 corrige a ADR-077, y la corrección importa.** El Gantt se había diferido diciendo que
*"se pisa con el reparto de `UX01`"*. **Era falso**, y lo desmentía la leyenda del propio mockup:
*"relleno = cobertura de temas"*. El reparto afirma **horas por semana** sobre un presupuesto; la
ventana afirma **días de calendario**. No son la misma magnitud y no pueden contradecirse — por eso
`lib/domain/ventana.ts` **no importa `reparto.ts` ni conoce la disponibilidad**.

⚠️ **Las dos puntas de la ventana son hechos.** Sin fecha de evaluación **no hay ventana**: barra
punteada. Sin primera clase hay ventana desde el borde del eje **con la marca puesta**, que es
distinto de haber empezado ahí. Y el eje **se estira** si una evaluación cae más lejos que `+3
semanas`: un examen fuera de cuadro es peor que un eje largo.

⚠️ **Tres cosas del mockup que NO se construyeron, y no las adelantes:**

- ~~**`Cursás Lun 14:00-16:00`**~~ ✅ **construido el 9 de septiembre** —
  [ADR-083](docs/decisions.md#adr-083). `class_schedule_block` existe y `UX02` lo muestra como
  *«Clases de la semana»*. Lo que sigue valiendo es el porqué: `class_session.session_time` es la
  hora de **una clase dictada**, no un horario semanal, y **derivarlo sigue prohibido** — hay guard.
- **`frenada hace 7 días`** — se muestra el hecho, *"última actividad hace 7 días"*. Siete días sin
  actividad en una materia que se cursa una vez por semana **es lo normal**
  ([ADR-078](docs/decisions.md#adr-078)).
- **`+ Agregar materia o evaluación`** — el único elemento **sin destino definido**.

✅ **`npm run db:verify` corre entero: 434 comprobaciones, cero fallos.** Estaba roto desde
la B6.14 —a `limpiar_mundo` le faltaban cinco tablas y, como las 40 sentencias van en **una sola
transacción**, una FK abortaba todo y no se borraba nada—. Arreglarlo destapó un segundo defecto que
el primero tapaba: `db-aislamiento.sh` **vacía el catálogo que `db-catalogo.sh` necesita después**,
así que `db:verify` ahora lo reimporta entre los dos.

⚠️ **Regla que salió de ahí:** toda tabla nueva que referencie a las del mundo académico **se agrega
a `limpiar_mundo` en el mismo commit**. Si no, el verificador deja de correr y el error no nombra la
causa.

🟡 **La biblioteca de Formación existe, y está vacía a propósito** —
[ADR-087](docs/decisions.md#adr-087), 10 de septiembre. Cinco piezas de la psicopedagoga cargadas en
`DRAFT`: el contenido **no se publica hasta que ella confirme vigencia** (`D5`).

⚠️ **`D1` prohíbe clasificar al estudiante.** No existe el Student Model, y hasta que exista **no se
usan proxies, puntajes ni umbrales** para decidir quién es autónomo: la biblioteca es la misma para
todos. Hay guard sobre el SQL de lectura y sobre la proyección.

⚠️ **Leer y aplicar se separan** (`D2`). Sin cursadas activas la pieza **se lee igual**; lo que se
apaga es `CTA-021`. La materia se pide **al empezar**, no al abrir.

⚠️ **`formative_content` NO lleva `institution_id`, `eje`, `area` ni `video`.** No es de ninguna
institución; el eje y el área no los declara el documento de las cinco piezas; y sin guion no hay
video. Las cuatro ausencias son decisiones, no olvidos.

⚠️ **Formación entró como V1 de solo lectura** — ADR-087 Enmienda 2. **No toca `action`**, no agrega
`origin` ni `formative_content_id`, no pide cursada, no muestra botón y **`CTA-021` NO está en el
registro canónico**: una CTA que promete crear una `Action` que nadie crea es un contrato
incumplido. La vertical de aplicación es **V2**, y la CTA vuelve **con** su escritura.

⚠️ **El registro sigue en 20 CTAs.** Y **once rutas, nueve superficies**: `FORMACION` es un nodo con
`wireframe: null`, como `/materias`.

⚠️ **La biblioteca se lee aunque el estudiante no tenga ninguna cursada.** La elegibilidad de
cursadas es de la aplicación, nunca de la lectura (`E2.3`).

✅ **Las 51 materias del Plan 2016 tienen contenido** — [ADR-086](docs/decisions.md#adr-086), 9 de
septiembre. 25 con temario real de los programas oficiales de la UCC y 26 generadas; **todas** con
unidades, pesos, calendario, evaluación y material. El ADE corre sobre ellas.

⚠️ **Lo que generó el sistema se marca con `source_type = 'inference'`, no con una columna nueva.**
`estado_de_materia` devuelve `contenido` —`estimado` · `calendario_estimado` · `NULL`— y `UX02` lo
avisa arriba del Gantt. **`NULL` no significa «verificado»**: significa que ninguna fila dice
`inference`. `verification_status` sigue `unverified` y su única escritura sigue siendo
`corroborar_procedencia()`.

⚠️ **«Tomado como válido» y «estimado» conviven a propósito.** El dominio trata lo generado igual
que lo real; la procedencia dice la verdad.

⚠️ **`topic.weight` NO es dificultad, y es todo o nada por materia.** Es cuánto de la materia ocupa
la unidad, y de ahí salen sus minutos. Si una unidad lo tiene y otra no, la materia entera vuelve a
repartirse pareja (`usaPesos()`, ADR-068). **Un peso faltante no es `1.0`.**

⚠️ **El peso entra al ranking del ADE: más peso, más prioridad.** Aporta hasta `120`, contra `300`
de práctica y `1000` de evaluación — ajusta, no decide. **La dirección contraria es de la
psicopedagoga y no está respondida**; hay test que falla si se invierte el signo.

⚠️ **La cursada vive en el período del alta, no en el año lectivo del programa.**
`confirmar_mapa_academico()` la crea con `(course, term, NULL)`. Ingerir bajo `2024/cátedra A`
dejaba **dos ofertas** de la misma materia: la del contenido y la del estudiante, vacía.

⚠️ **Una unidad pesada tiene que ocupar más clases.** `minutosPorTema()` reparte los minutos
**observados**: con una clase por unidad todas salen iguales y el peso no cambia nada.

✅ **El Plan 2016 está `PUBLISHED`** — sin eso el alta no ofrece la carrera y nadie se inscribe solo.
⚠️ **Los 57 `needs_review` los levantó el owner para habilitar el MVP: eso no es una auditoría del
plan**, y los diez nombres cortados **siguen cortados**. Tres guards del borrador se mudaron a
`INFORMATICA/web-2026`, que sigue `DRAFT`.

⚠️ **«UCC Sistemas» es sólo lo que ve el estudiante.** `academic_program.name` conserva
`INGENIERIA DE SISTEMAS`. Es una traducción en `lib/content/es-AR.ts`, no un renombre.

⛔ **ADR-006 sigue `PROVISIONAL`.** Publicar un plan es `publication_status`; el dictamen legal es
otra cosa y sigue faltando.

✅ **`UX02` se rearmó alrededor del Gantt por tema** — [ADR-085](docs/decisions.md#adr-085), 9 de
septiembre, con las capturas del owner delante. Panel de temas con eje de fechas, tarjeta de
evaluación, registro, clases y próximo paso. **`CTA-019` por fin es alcanzable por clic**: estaba
declarada desde ADR-016 y nunca se había renderizado.

⚠️ **Las dos puntas de cada barra son hechos, y un tema sin ellas NO se ubica.** Ponerlo en «+7 días»
porque es el séptimo de la lista sería inventar un plan de estudio que nadie hizo. Hay guard.

⛔ **Tres palabras de la captura NO se copiaron, y no las repongas:** `Dominado`
([ADR-072](docs/decisions.md#adr-072)), `nivel` ([ADR-075](docs/decisions.md#adr-075) §C1) y `3/3`.
La columna dice el **estado de la evidencia** — actividad, no conocimiento. Tampoco hay color por
estado: verde/ámbar por nivel **es la escala de calificación que §C1 descarta**.

⚠️ **La escala de la captura es la dimensión Confianza**, que no tiene escritor. Es el corte 2 y
sigue bloqueado hasta que la psicopedagoga revise el vocabulario.

⚠️ **Modo Examen es CTA secundaria, no primaria** (`I-06`: una sola por pantalla), y el `CURSÁS` de
la tarjeta **no se copió** porque repetía el panel de clases (`C-02`).

⚠️ **`MateriaProps.unidades` ya no existe.** La reemplaza el Gantt por tema; se perdió el *«hace 2
días»* por unidad, y está dicho en el ADR.

✅ **Un compromiso ya no se confirma encima de una clase** —
[ADR-084](docs/decisions.md#adr-084), 9 de septiembre, que construye
[ADR-064](docs/decisions.md#adr-064). Las **dos mitades**: `confirmarCompromiso` y `renegociar`
rechazan con `CONFLICTO_DE_HORARIO` **antes de escribir**, y la propuesta corre el horario hasta el
primer hueco **y lo dice**.

⚠️ **Antes de tocar la regla, tres cosas que no son obvias.** Los intervalos son **semiabiertos**:
terminar justo cuando empieza la clase **no es conflicto**. Se comparan **instantes absolutos**, no
minutos de pared — un `-03:00` a mano se rompe en el primer horario de verano, y en silencio. Y se
valida contra **todas** las cursadas: estudiar Cálculo el martes a las 18:30 choca con la clase de
Física igual que con la de Cálculo.

⚠️ **La idempotencia va ANTES que la regla, a propósito.** Un reintento del mismo pedido devuelve la
fila que ya existe aunque el horario ahora choque: si el horario se cargó en el medio, la respuesta a
*"¿lo creaste?"* sigue siendo sí.

⚠️ **Sin horarios cargados no pasa nada, y ésa es la mitigación.** Una lista vacía de bloques **nunca
da conflicto**, así que el camino que ya funcionaba se comporta igual que antes. Hay test en las tres
capas: si lo tocás, no lo aflojes.

⛔ **Falta la segunda salida de ADR-064.** *"Elegir otro horario **o corregir el bloque de clase**"*:
la primera existe, la segunda **no tiene dónde hacerse** hasta el cuarto paso del alta. La copy
enuncia el hecho y ninguna salida, a propósito.

⚠️ **La aritmética de husos vive en `lib/domain/zona.ts`, y hay una sola.** `renegociacion.ts` tenía
su copia privada. **No la vuelvas a duplicar.**

✅ **El bloque horario existe** — [ADR-083](docs/decisions.md#adr-083), 9 de septiembre. Era **la
única entidad genuinamente nueva** de ADR-060…065, decidida el 5 de septiembre y sin construir.
`class_schedule_block` con **exactamente un dueño** —la oferta o la cursada—, cargada por
`ingerir_materia` con `p_horarios`, y visible en `UX02`.

⚠️ **Tres cosas que el bloque horario NO es, y las tres tienen guard.** No es `class_session` —una
clase **dictada**, con fecha— y **derivar la regla semanal de sus instancias sigue prohibido**. No es
`availability`: *"uno expresa cuándo está cursando y el otro cuándo puede estudiar"*. Y **no es una
agenda**: *«solo mostrar, no agendar»*, y el panel no contiene ni un `button`.

⛔ **El reparto NO descuenta las horas de cursada, y es una decisión.** `availability` **ya es** el
tiempo que queda, así que restarle las clases las descontaría dos veces; y donde sí hay
superposición, [ADR-064](docs/decisions.md#adr-064) manda mostrarla porque *"la pantalla no puede
asumir que el equivocado es él"*. Hay guard: `insumos_de_reparto` no menciona la tabla.

⚠️ **Falta el segundo escritor de [ADR-063](docs/decisions.md#adr-063).** El horario que **declara el
estudiante** existe en el schema —el `CHECK` lo admite y los guards lo ejercitan— y **ninguna ruta lo
escribe**: es el cuarto paso del alta, que pregunta comisión y horario juntos y arrastra
[ADR-062](docs/decisions.md#adr-062) entero.

⚠️ **Y `course_enrollment.schedule_status` NO existe, aunque ADR-063 lo pida.** Se escribió, se probó
y se sacó: la cursada se crea **después** de la ingesta, así que el `UPDATE` no tocaba ninguna fila y
las tres materias del demo quedaban `UNKNOWN` con sus bloques cargados. **Llega con su escritor.**
Mientras tanto «no se sabe» es la ausencia de bloques — que sigue **sin leerse como disponibilidad**.

✅ **La Bitácora dejó de ser la de otra materia** — [ADR-082](docs/decisions.md#adr-082), 9 de
septiembre, **corte 1** de [`cursado-de-materia.md`](docs/cursado-de-materia.md) §8 y el único
autorizado. `estado_de_progreso` tomaba **la primera cursada activa** porque nadie podía decirle
cuál: con tres materias en curso, mirar el registro de Álgebra abría el de Cálculo. `CTA-009` ahora
transporta la cursada, igual que `CTA-001` desde [ADR-054](docs/decisions.md#adr-054).

⚠️ **El registro canónico tiene ahora dos CTAs con parámetro, y sigue siendo una lista cerrada.**
`CTA-001` y `CTA-009`, las dos con `cursada` porque es el mismo objeto. El guard de ADR-054 se hizo
**más estricto**, no más laxo: enumera las dos y exige el nombre.

⚠️ **Antes de tocar `estado_de_progreso`:** filtra **dos** puntas, no una. La cursada sale de la
última evidencia del estudiante, así que acotar sólo la CTE `cursada` deja la URL diciendo una
materia y la evidencia siendo de otra. Hay un check de base por cada punta.

⚠️ **La Bitácora NO se mudó adentro de `UX02`, y no se muda.** `VI.2` §8.7 da 2–3 entradas y `VI.6`
§8.3 el historial completo, sobre la misma fuente: *"no existe una segunda fuente histórica"*.

⚠️ **El checklist de la captura del owner es la quinta dimensión, no una escala nueva.**
`confidence_value`, `confidence_state` y `confidence_declared_at` existen desde la B1 y **el único
escritor es `registrar_progreso`**: por eso `UX02` muestra cuatro dimensiones y no cinco. Es el
**corte 2**, y está **bloqueado** hasta que la psicopedagoga revise el vocabulario — `Dominado` viola
[ADR-072](docs/decisions.md#adr-072) y `nivel` viola [ADR-075](docs/decisions.md#adr-075) §C1.

🛠️ **El andamio para probar el MVP creció** — [ADR-079](docs/decisions.md#adr-079), 8 de septiembre.
**El golden path se recorre entero desde una cuenta nueva, por navegador.** Dos piezas nuevas:

- **`npm run db:materia -- <email> "<materia>"`** — carga contenido sintético en la cursada que el
  alta ya creó. Sin esto, un estudiante recién dado de alta queda con `FALTA CONTEXTO DE CURSADO`,
  reparto `SIN_DATOS` y el ADE sin nada que decidir: el alta crea `course_enrollment` **y nada
  adentro**, y `ingerir_materia` **no lo alcanza ninguna ruta**.
- **Tres botones en el dock**: `correr el ADE`, `validar la entrega`, `correr el reloj`.

⚠️ **`validar` deja al estudiante validando su propia evidencia**, que es la regla que el producto
más protege. Es la consecuencia de que `C01-030` siga `OPEN`: **no hay a quién darle ese botón**.
`404` sin `MODO_PRUEBA=1`, **sin secreto de servicio**, y se borra con ADR-006.

⚠️ **Dos defectos que el andamio destapó, y conviene saberlos antes de tocar la ingesta:**
`ingerir_materia` **sin `p_curriculum_plan_id` crea una cursada nueva** —resuelve el `course` en el
contenedor «Sin programa declarado»— y deja la del estudiante vacía; y **no crea recursos**, sin los
cuales el ADE contesta `CONTEXTO_INCOMPLETO`.

⚠️ **Lo que sigue sin resolverse:** no se puede **crear una cuenta**
([ADR-039](docs/decisions.md#adr-039)); **quién valida** es `C01-030`, `OPEN`; **el reloj no corre
solo**, así que los compromisos nunca vencen y el rescate no se alcanza sin apretar el botón; y **la
ruta de validación no re-dispara el ADE** — sólo lo hace `scripts/validar.mjs`.

🛠️ **Y el control original del dock sigue igual**: reinicia el alta del estudiante sintético sin
volver a sembrar el mundo. **No es producto.** Apagado por defecto —sin la
variable la ruta responde `404` y el componente no llega al HTML—, no agrega superficies ni CTAs, no
emite eventos y no toca `product_event`, `audit_log` ni el catálogo. **Su selector de institución
simula el padrón; no reabre [ADR-052](docs/decisions.md#adr-052).** Se borra cuando ADR-006 abra.

🆕 **Período, comisión y horarios de cursada: decidido el 5 de septiembre, NO implementado.**
[ADR-060](docs/decisions.md#adr-060) … [ADR-065](docs/decisions.md#adr-065). Antes de tocar nada de
esto, tres cosas que ya se verificaron contra el schema y ahorran trabajo:

⚠️ **La comisión ya existe** — `course_offering.commission` + `instructor_id`, con
`UNIQUE (course_id, term, commission)`. El alta la crea siempre en `NULL`. **No inventes una entidad.**

⚠️ **El semestre y la anualidad ya existen** — `curriculum_requirement.term` e `is_annual`, y el
importador de CSV **ya los lee**. Están en `NULL` en las 213 filas: falta el dato, no la columna.

⚠️ **`topic.course_id` ya existe**, con `CHECK (offering_id IS NOT NULL OR course_id IS NOT NULL)`.
Por eso [ADR-060](docs/decisions.md#adr-060) —*el temario es de la materia*— es un backfill y no una
migración riesgosa. **`topic.offering_id` NO se elimina**, por instrucción explícita del owner.

⚠️ **La única entidad nueva es el bloque horario**, y tiene **dos dueños posibles y excluyentes**: la
offering (horario publicado) o la cursada (horario que el estudiante declara sin saber su comisión).
**Nunca una comisión ficticia, nunca JSON opaco.** Y **no se mezcla con `availability`**: una dice
cuándo cursa, la otra cuándo puede estudiar.

⚠️ **El ADE no agenda, y sigue sin hacerlo.** La superposición con una clase se valida en el
`Commitment` ([ADR-064](docs/decisions.md#adr-064)).

**Fase 0 — Cerrar el Track A.** ✅ **COMPLETA.** Las nueve superficies existen, todos los estados
críticos son alcanzables, el Golden Path se recorre por clic y **el test de comprensión de 10
segundos se corrió con resultado PASS** (reportado por el owner, 30 ago 2026).

**Fase B0 — Cerrar decisiones.** 🟡 **4 / 5.** [ADR-003](docs/decisions.md#adr-003),
[ADR-004](docs/decisions.md#adr-004), [ADR-005](docs/decisions.md#adr-005) y
[ADR-010](docs/decisions.md#adr-010) están `ACCEPTED`; [ADR-006](docs/decisions.md#adr-006) sigue
`PROVISIONAL — LEGAL CONFIRMATION REQUIRED`.

**Fase B1 — Fundación.** ✅ **COMPLETA, 6 / 6.** Supabase local reproducible, capa académica y del
estudiante, la frontera Controller → Service → Repository, `product_event`/`audit_log` append-only y
el cliente de autorización del CRM.

**Fase B2 — Dominio de ejecución.** ✅ **COMPLETA, 6 / 6** — 1 de septiembre de 2026. `Action`,
`Commitment`, `Evidence` y `Reflection`, esta última cuando el owner cerró `C01-051`
([ADR-026](docs/decisions.md#adr-026)): el requisito vive en la Action, **congelado al crearla**, y
es ternario —`NO_CONFIGURADA` no ofrece nada, `OPTIONAL` ofrece y no bloquea, `REQUIRED` bloquea sólo
el submit dependiente—. **La Etapa B2.6 cerró:** `UX01`–`UX06` leen de Postgres con sesión real, cada una con una
función de lectura propia, y ninguna cae al fixture en silencio. `UX07`–`UX09` se conectaron en la
Fase B5.

**Fase B6.14 — El catálogo curricular y el tramo de alta.** ✅ **COMPLETA, 6 / 6** — 5 de septiembre
de 2026. Cierra **el hueco más grande del producto**, que [ADR-039](docs/decisions.md#adr-039) había
dejado escrito: *"entre el `authorized: true` del CRM y la primera acción del estudiante no hay
ninguna pantalla definida"*. Tres decisiones: [ADR-051](docs/decisions.md#adr-051) (el catálogo),
[ADR-052](docs/decisions.md#adr-052) (el alta) y [ADR-053](docs/decisions.md#adr-053) (el Plan 2016).

⚠️ **No toda fila de un plan es una materia.** `curriculum_requirement` tiene **siete tipos**: el
Plan 2016 tiene 57 filas y **sólo 51 son materias**. `ELECTIVA I` es un cupo, `ACRED. INGLES` una
acreditación y `TRABAJO FINAL` un capstone; modelarlas como `course` haría que el alta preguntara si
las cursás y que el ADE les buscara unidades.

⚠️ **`publication_status` NO es `verification_status`, y no se colapsan.** *"¿Se le puede mostrar a
un estudiante?"* y *"¿alguien con autoridad lo verificó?"* son dos preguntas. La segunda tiene **una
sola escritura en todo el repo** (`corroborar_procedencia`, `I9`) y **ninguna tabla nueva la lleva**.

⚠️ **Antes de tocar el alta:** el gate vive en el **backend**. Las nueve rutas devuelven
`409 ALTA_INCOMPLETA` con la ruta a la que ir. Un gate que viva sólo en el cliente no es un gate —
es la lección de la B6.10, donde el requisito de reflexión lo hacía cumplir un botón deshabilitado.

⚠️ **`student.whatsapp` sigue sin escritor.** Se persiste el **consentimiento**, y
`whatsapp_consent` **no tiene columna de teléfono**: no es que no se llene, es que no existe dónde.
ADR-042 §4 autoriza teléfonos sintéticos; el schema dice que nadie escribe esa columna hasta el
dictamen de ADR-006, y ADR-052 eligió **no contradecir a ninguno de los dos**.

⚠️ **Los planes de la UCC están cargados y en `DRAFT`.** No se le ofrecen a nadie, y hay test.
Publicarlos es `C01-052` y necesita el plan oficial; [ADR-006](docs/decisions.md#adr-006) §5 dice que
*"no se puede elegir universidad y carrera antes de saber con qué base legal se piden los datos"*.

⚠️ **`"SIN ACCIONES POR AHORA"` ya no alcanza a un estudiante sin materias.** Ahora dice *"Estamos
preparando tu información académica"* — el texto literal que aprobó el owner — y **sin CTA**. Los
nueve niveles de precedencia **siguen siendo nueve**: es una variante.

**Fase B6.10 — La reflexión existe y se exige.** ✅ **COMPLETA** — 4 de septiembre de 2026. La tabla
`reflection` existía desde la B1 y **nadie la escribía**; el estudiante no tenía por dónde reflexionar.
Ahora hay `POST /api/reflexion` con su JWT.

⚠️ **Y el bloqueo de `REQUIRED` vivía sólo en la proyección.** La CTA se apagaba y
`POST /api/evidencia` **nunca consultaba el requisito**: lo único que impedía entregar sin la
reflexión obligatoria era **un botón deshabilitado**, con lo cual [ADR-026](docs/decisions.md#adr-026)
no lo hacía cumplir nadie. **Ahora se comprueba en el servidor, antes de escribir.**

⚠️ **Antes de tocar la proyección de la primera entrega:** el requisito vive en la **`Action`**,
congelado al crearla — no en la Evidence. La primera entrega es justamente la que **no puede** tener
una Evidence previa, y por eso proyectaba `reflection: null` y ofrecía una CTA que el servidor
rechaza.

⚠️ **No hay formulario para escribirla.** `components/screens/evidencia.tsx` muestra
`reflection.titulo` como CTA secundaria y nada más: hoy la reflexión **se escribe por API**.
Construir la superficie toca `components/screens/*` —regla 6— y necesita las capturas.

⚠️ **Una decisión de copy quedó levantada:** el fixture aprobado dice *"Contanos cómo te fue
(requerido)"* y el guard `C-01` prohíbe `Contanos`. **No aflojes el guard**: la decide una persona.

**Fase B6.9 — La salida del camino que no salió bien.** ✅ **COMPLETA, 2 / 2** — 4 de septiembre de 2026. El
loop tenía **sólo camino feliz**: el reloj llevaba un compromiso a `MISSED` y ahí el estudiante quedaba
sin salida, porque la máquina no admite `MISSED → CONFIRMED` y `POST /api/compromiso` sólo crea el
primero de una `Action`. **La B6.9.1 abrió el rescate** (`POST /api/rescate`, con JWT del estudiante).

⚠️ **`RescueSucceeded` no era alcanzable por ningún camino**, y es uno de los cuatro eventos que
[ADR-041](docs/decisions.md#adr-041) volvió cláusula del contrato. Ahora ocurre.

⚠️ **Un `MISSED` ahora ofrece CTA, y no es la de confirmar.** Es `CTA-015` · «Retomar», que empieza
**otro objeto**. El incumplido **sigue `MISSED` para siempre** y esa garantía no está en la ruta: está
en `crear_rescate` y en la máquina de estados.

⚠️ **Antes de tocar `propuestaDeCompromiso`:** un incumplimiento sin rescate **no es** *"todavía sin
compromiso"*. Si volvés a proponer ahí, `UX04` ofrece una CTA que termina en `409`.

**La B6.9.2 abrió el reenvío**, que son **dos operaciones y dos rutas** porque son dos decisiones:
`POST /api/pedido-de-reenvio` es del que evalúa —secreto de servicio, **motivo obligatorio**— y
`POST /api/reenvio` es del estudiante. Juzgar que algo no alcanza no obliga a pedir otra cosa.

⚠️ **Antes de tocar una ruta de servicio: no recibas identidades que no podés escribir.**
`product_event.actor_id` es `uuid` y quien evalúa es identidad externa sin FK (`C01-030`). El actor va
`null` —lo produjo un proceso— y lo que queda escrito es el motivo. Aceptar un `pedidoPor` costó un
`500` real.

⚠️ **La renegociación sigue sin cablear, y es a propósito.** `renegociar()` existe sin llamador porque
`renegociacionElegible` **sólo vive en fixtures**: qué hace elegible a un compromiso es `C01-010`,
`OPEN`. **No la inventes.**

**Fase B6.8 — El camino de ejecución escribe en Postgres.** ✅ **COMPLETA, 5 / 5** — 3 de septiembre
de 2026, decidida por el CTO ([ADR-040](docs/decisions.md#adr-040)). El ADE tiene disparador
(`POST /api/recomendacion`), el `Commitment` nace de una confirmación explícita, la entrega crea una
`Evidence` real en dos tiempos, la validación registra el progreso y **`C01-009` quedó cerrada**:

> `Evidence` suficiente → validación registrada → progreso registrado → `Action` completada.
> **Cada flecha es una operación que ocurre porque la anterior ocurrió.**

⚠️ **`VALIDATED` sigue sin producir `ProgressUpdated`.** El progreso lo escribe la operación, no el
estado, y el guard de los cuatro caminos sigue valiendo. **La `Action` no se cierra por tener una
evidencia validada:** se cierra porque la operación autorizada la cierra, con la cadena causal
verificada de una sola vez.

⚠️ **El cierre recorre también la máquina del `Commitment`** (`CONFIRMED → STARTED → COMPLETED`). Sin
eso, el reloj lo pasaba a `MISSED`: un incumplimiento falso sobre trabajo hecho y validado.

⚠️ **Quién valida sigue sin definirse.** `reviewer_id` queda `NULL` y el actor del evento es `null`
—lo produjo un proceso, no una persona—. `C01-030` sigue `OPEN` y esto no lo adelanta.

**Hay pantalla de ingreso: `/login`** ([ADR-039](docs/decisions.md#adr-039), Product Owner, 3 de
septiembre de 2026). **No es `UX10`** —el registro canónico sigue con nueve nodos y hay guard—, no
ofrece crear cuenta (eso lo decide el padrón del CRM) y **no levanta el gate de
[ADR-006](docs/decisions.md#adr-006)**. El navegador ya no abre sesión solo.

✅ **Las tres decisiones de los flujos del CRM quedaron cerradas** el 4 de septiembre de 2026 por el
Product Owner: [ADR-041](docs/decisions.md#adr-041) (actividad facturable),
[ADR-042](docs/decisions.md#adr-042) (WhatsApp, consentimiento y el alta entera) y
[ADR-043](docs/decisions.md#adr-043) (orden y smoke test). Fuente literal:
[`respuesta-po-flujos-crm-source.md`](docs/respuesta-po-flujos-crm-source.md).

⚠️ **Cerradas no es "a construir".** El owner autorizó **cerrarlas, documentarlas y ponerlas en
backlog**, y fijó qué va primero: *"primero se termina y verifica el loop actual del MVP de
Plataforma"*. [ADR-035](docs/decisions.md#adr-035) y [ADR-006](docs/decisions.md#adr-006) siguen
plenamente vigentes.

⚠️ **Y traen reglas de producto que ya rigen, aunque la superficie no exista:**

- **La confirmación sólo puede decir** *"Guardamos tu número"* o *"Recibimos tu solicitud"*. **Nunca**
  que el CRM vinculó el número, que hay un operador asignado o que alguien va a escribirle: la
  Plataforma **no observa** ese estado.
- **Al estudiante sin materias no se le muestra *"no hay una acción recomendada"***, porque el sistema
  todavía no está en condiciones de evaluar eso. El texto aprobado es *"Estamos preparando tu
  información académica"*.
- **Se emiten los cuatro eventos facturables y ninguno más.** El CRM pidió `ActionAccepted` y
  `CommitmentConfirmed` apagados para su embudo; el owner no se pronunció sobre eso. **Hasta que lo
  haga, no se emiten.**

**Fase B6 — Risk e Intervención.** 🟡 **DOMINIO COMPLETO** — 2 de septiembre de 2026
([ADR-032](docs/decisions.md#adr-032)). El **circuito cerrado se garantiza por construcción**: cerrar
una intervención sin resultado no es un camino que exista, y `RESOLVED` sólo se alcanza con una
intervención que registró outcome. `circuito_de_senales()` **audita el Done** y nombra el contrato que
falta en vez de dar el circuito por cerrado. `audit_log`, que existía desde la B1.5 y nadie escribía,
por fin se escribe.

⚠️ **Antes de tocar riesgo:** `HP0-06-1 v4.0-psicopedagogia` ya produce señales, pero sólo desde
hechos comparables bajo el criterio de ADR-037. `HP0-06-2` y `HP0-06-3` siguen en modo humano;
`C01-021` permanece abierto para esas reglas y `C01-044` para playbooks/SLA. No inventes ninguno.

⚠️ **El riesgo en `UX01` es un modificador, no un reemplazo.** Cambia el estado general y **nada
más**: no gana el Hero, no interrumpe `IN_PROGRESS`, no reordena materias y no inventa una CTA. Ni
siquiera entra a `HeroInput`, y hay guard.

**Fase B6.7 — La validación profesional, aplicada.** ✅ **4 / 4** — 2 de septiembre de 2026
([ADR-037](docs/decisions.md#adr-037)). La psicopedagoga respondió con **6 `CAMBIAR` + 1 `APROBAR`**
y **sin mover un solo umbral**: lo que objetó es **qué cuenta como una repetición**. La frase que
ordena la fase: **«el sistema debe reconocer patrones, no etiquetar personas»**.

**B6.7.1 cerró el punto `9.5`** — el vocabulario. `v2.0-psicopedagogia` con **cinco familias**;
*"dependencia de ayuda externa"* **sale como error** y pasa a `support_need_observation` como
condición de desempeño; categoría **principal + secundaria** (la secundaria **no cuenta**);
*clasificación incierta* como fila del catálogo con `es_familia = FALSE`; y **corrección humana
append-only**.

⚠️ **Antes de tocar el contador de reiteración:** cuenta por **familia** (`canonical_id`), **nunca**
por fila de versión de `error_type`. Filtrar por `error_type_id` parte el contador al medio en
silencio la próxima vez que se cargue una versión del vocabulario. Y **el vocabulario vigente decide
qué cuenta**: sin fila vigente que declare la familia, no se evalúa — es lo que retira `dependencia`
sin haber editado la fila que el Product Owner escribió.

**B6.7.2 cerró `9.1` y `9.6`** — el denominador. La unidad de conteo pasó a
`(estudiante, preparación, familia, objetivo/demanda)`; `learning_objective` es una tabla nueva que
**nace vacía**; y el resultado separa **`repeticionDetectada`** (misma familia, no escala sola) de
**`apariciones`** comparables (mismo objetivo, lo único que lee el umbral). La regla vigente es
`HP0-06-1 v4.0-psicopedagogia`.

**B6.7.3 cerró `9.2`, `9.3` y `9.4`** — acelerar exige las cinco condiciones de corrección válida;
recuperar exige dos aciertos independientes; y una recaída abre un `reiteration_episode` vinculado
al anterior, sin borrar historia. Los seis disparadores cualitativos tempranos viven en configuración
y `review_context` lleva evidencia e historial de apoyos a la cola sintética.

**B6.7.4 cerró `9.7`** — una replanificación crea `exam_preparation_plan_version` dentro de la
misma preparación; `REPLANNED` sigue vivo. La reentrada 9–18 usa seis motivos configurados y una
propuesta en dos tiempos: explicar primero, mover `current_step_id` sólo al aceptar u override.
Pedir otra opción conserva el paso; ninguna rama toca Evidence, progreso ni completions.

⚠️ **Recuperar un episodio no resuelve una obligación humana.** Si una `RiskSignal` ya llegó a
`INTERVENTION_REQUIRED`, sólo una intervención con outcome puede llevarla a `RESOLVED` (ADR-032).
Son dos lifecycles distintos y no se colapsan.

⚠️ **Los umbrales siguen siendo `2` y `3`.** Ella los recomendó tal cual: no objetó los números,
objetó **qué cuenta como una repetición**. Si algo no escala, mirá el denominador antes que el
umbral.

⚠️ **Sin objetivo declarado no hay comparabilidad, y no se escala.** El mundo demo declara uno; si
sembrás observaciones sin `learning_objective_id`, el circuito cuenta la repetición y **no llama a
nadie** — eso es correcto, no un bug. *"Cómo se define una tarea comparable"* es de la psicopedagoga
y sigue abierto: **no lo infieras**.

⚠️ **`evidence_quality` no es `evidence.lifecycle_state`.** Una entrega `INSUFFICIENT` **cuenta** si
el error es identificable — es el único `APROBAR` de los siete, y excluirla *"sesgaría la detección
contra quienes más necesitan acompañamiento"*. Lo que no cuenta es lo ilegible, no lo incompleto.

⚠️ **`risk_signal.reason` llega a la pantalla del estudiante.** No estrenes vocabulario ahí: ella
pidió revisión experta de lenguaje, accesibilidad y no estigmatización **antes** de probar con
personas.

⚠️ **Quién puede corregir una clasificación no está definido.** `corrected_by` es identidad externa
sin FK y `POST /api/observacion/correccion` va con secreto de servicio. **No inventes el rol.**

**Fase B5 — Modo Examen real.** ✅ **COMPLETA, 5 / 5** — 1 de septiembre de 2026. **Las nueve
superficies del estudiante leen de Postgres**; `UX07`–`UX09` eran las tres últimas que proyectaban
fixtures. Los tres requisitos de schema se cerraron **antes** de la primera migración, porque una
migración aplicada no se edita:

- [ADR-028](docs/decisions.md#adr-028) — **la completion de un paso es un hecho, no un estado.** Se
  cayó el `UNIQUE`; cada vuelta es una fila con su `occurrence` y **su tema**. La garantía vieja no se
  perdió: se volvió configurable en `protocol_step.is_reentrant`.
- [ADR-029](docs/decisions.md#adr-029) — **la pauta de la cátedra tiene entidad propia**, con
  Provenance completa. Cargada por el estudiante entra `student`/`unverified` y **no se eleva**.
- [ADR-030](docs/decisions.md#adr-030) — **el protocolo corre con contenido rotulado.** Arrancó con
  `EP-SPEC v0.1` porque el texto de los 20 pasos no estaba en el repositorio.
- [ADR-031](docs/decisions.md#adr-031) — **los veinte pasos entraron con el texto de la
  psicopedagoga**, el mismo día. `HUMAN-ROADMAP v1.0`, verbatim, con `source_text` atado a
  [`roadmap-modo-examen-source.md`](docs/roadmap-modo-examen-source.md) por test. `EP-SPEC v0.1`
  quedó **apagado, no borrado**.

⚠️ **Antes de tocar Modo Examen:** readiness **no se calcula**. La tabla existe (ADR-011) y nadie la
escribe: los umbrales son `C01-029`. Sin card, sin score, sin porcentaje. Y **no se muestra "paso 5 de
12"** — desde `HUMAN-P0-01 v1.0` además sería falso.

**Fase B4 — ADE v1 y el reloj.** ✅ **COMPLETA** — 1 de septiembre de 2026. El **validador
determinista** rechaza toda recomendación que afirme dominio, progreso o readiness inexistente
—sus diez reglas salen de `product.md` §13 y **cada una cita su fila**—, y con él la rama `ERROR`
dejó de ser teórica. El **reloj corre** por `POST /api/reloj` con secreto de servicio comparado en
tiempo constante; `npm run reloj -- <institucion>` hace lo mismo a mano.

⚠️ **Antes de tocar el ADE:** lo que el motor escriba pasa por
`lib/domain/validador-de-recomendacion.ts` **antes de materializar**. Lo que no se puede mostrar no
se persiste.

**Fase B3 — Progreso, Bitácora y eventos.** ✅ **COMPLETA, 3 / 3** — 1 de septiembre de 2026.

- **El resultado de progreso se escribe** con sus invariantes: `I10` en el Service y en la base, `I8`
  con el duplicado declarado, y todo en una transacción con `topic_progress`.
- **El Product Event Model está declarado** en `lib/domain/product-events.ts`: los 23 eventos P0 del
  spec §16 con su uso textual, más 36 extensiones que el backend emite o conserva como legacy. De los 23 se
  emiten 9. **Antes de agregar un evento nuevo, declaralo ahí:** hay guard en las dos direcciones.
- **Una sola fuente histórica.** La Bitácora de `UX06` y la Actividad reciente de `UX02` salen de
  `hechos_de_cursada()` y comparten la traducción: `VI.6` §8.3 dice que no existe una segunda, y hay
  guard de las dos cosas.

Con una parte del objetivo **explícitamente no hecha**: mostrar las cinco dimensiones con sus valores
es `C01-019`, gate `H`, y lo responde una persona.

⚠️ **El Service recibe el resultado; no decide que hubo progreso.** `C01-018` —quién lo emite y con
qué causalidad— sigue `OPEN`. **Ninguna ruta de `Evidence` escribe progreso**, y hay un guard
estático que cubre los cuatro caminos, la maquinaria de transiciones y los triggers del schema:
`VALIDATED` no produce `ProgressUpdated`, y es el error más barato de cometer.

✅ **Resuelta por [ADR-027](docs/decisions.md#adr-027):** los ocho eventos que `product.md` §11
declaraba inexistentes **entraron al modelo** como nivel `TRANSICION`. El catálogo clasifica en
`NEGOCIO` · `TRANSICION` · `TELEMETRIA`, y los nombres históricos no se cambian: `product_event` es
append-only.

**➡️ Lo que sigue, tras las decisiones del 1 de septiembre.** El owner cerró
[ADR-011](docs/decisions.md#adr-011), [ADR-003](docs/decisions.md#adr-003) y
[ADR-027](docs/decisions.md#adr-027), y dejó [ADR-006](docs/decisions.md#adr-006) en `PROVISIONAL`.
Con eso quedó **un frente con trabajo real**, y dos que se cerraron el mismo día:

- ~~Fase B4~~ ✅ **COMPLETA** el 1 de septiembre: el **validador determinista** —que el Done exigía
  desde el primer día y no existía— y **el reloj corriendo** por `POST /api/reloj` con secreto de
  servicio. Verificado de punta a punta: un `CONFIRMED` vencido pasa a `DUE`, después a `MISSED`, y
  la tercera corrida converge.
- ~~Fase B5~~ ✅ **COMPLETA** el 1 de septiembre: la capa de examen, el protocolo como configuración
  versionada y las tres superficies conectadas.
- ~~Fase B6~~ 🟡 **DOMINIO COMPLETO** el 2 de septiembre. Lo que queda de la fase **no está
  desbloqueado para implementar**: `C01-021` para las dos reglas todavía humanas, `C01-044` (playbooks y SLA), y el
  **contrato v2** del CTO. B6.7 ya incorporó el criterio profesional a `HP0-06-1`.

Lo que **no** se puede hacer sigue siendo lo mismo: tocar un dato real. El mapa de bloqueos del
`roadmap.md` ahora dice **quién** cierra cada cosa.

**Trabajo adelantado.** B2b va **2 / 3**: la ingesta asistida del ADL y la corroboración. En B4 ya existen el ADE
v1 determinista, el reloj del lifecycle y la materialización transaccional de recomendaciones.

✅ **Las 8 decisiones psicopedagógicas están respondidas** (31 ago 2026,
[ADR-025](docs/decisions.md#adr-025)), y sus tres consecuencias de schema se cerraron con la Fase B5.

✅ **Y el 1 de septiembre llegó el texto de los veinte pasos** — el *Roadmap Modo Examen*, de la misma
profesional. Está en [`roadmap-modo-examen-source.md`](docs/roadmap-modo-examen-source.md) y corre
como `HUMAN-ROADMAP v1.0`.

⚠️ **La fuente no se corrige, ni los tipeos.** *"a desarrollae"*, *"icnorporando"*, *"Siemrpe"*: hay
un test que rompe si alguien los "arregla". Y **lo que la fuente no define no se completa** — los
veinte tienen `expected_artifact` y `criterion` en `NULL` y `requirement` en `NO_CONFIGURADA`. El
[cuadro de acciones](docs/cuadro-problemas-source.md) propone evidencias y **no se carga**: conserva
preguntas de la propia autora.

⚠️ **Su vigencia todavía no está confirmada.** El rótulo dice *"texto de la psicopedagoga · vigencia
todavía sin confirmar"*, y son tres estados distintos —del equipo, sin confirmar, confirmado—: no se
colapsan. La pregunta está arriba de todo en la
[agenda](docs/agenda-cierre-psicopedagoga.md).

⚠️ **Todo el Track B corre sobre datos sintéticos.** [ADR-006](docs/decisions.md#adr-006) sigue
`PROVISIONAL — LEGAL CONFIRMATION REQUIRED` y es bloqueo absoluto desde el primer usuario real.

**Fase B2b — Ingesta del ADL.** 🟡 **2 / 3.** La **B2b.2 cerró el invariante `I9`**: existe por fin
la operación explícita que eleva un `verification_status`, y es la única —`corroborar_procedencia()`,
append-only, con fuente concreta, motivo obligatorio y entrada de `audit_log` con antes y después.

⚠️ **Antes de tocar `verification_status`:** no lo escribas desde ningún lado. Hay guard sobre las 46
migraciones y sobre los repositorios de que **ninguna otra escritura existe**. Corregirlo "a mano"
también es una corroboración, con su fuente y su motivo.

⚠️ **A `official` no llega nadie, y no es un olvido.** Significa que la institución lo afirma, y la
Plataforma no puede autenticar a una institución: `C01-030` está `OPEN`, ADR-023 sacó la identidad de
docente y ADR-033 mandó las superficies de operador al CRM. El estado sigue en el enum y conserva su
salida; ninguna operación lo produce. **No lo hagas alcanzable.**

⚠️ **Nada vuelve a `unverified`**, y **`disputed` no es terminal**: una disputa resuelta puede volver.

⚠️ **Quién puede corroborar sigue sin definirse** (`C01-030`). `corroborated_by` es identidad externa
sin FK y `POST /api/corroboracion` va con secreto de servicio. **Nunca un JWT de estudiante:** alguien
confirmando lo que él mismo declaró no es verificación.

**Verificación de base:** `npm run db:verify` — **434 comprobaciones** contra Postgres que `npm test`
no puede hacer porque necesitan Docker. Las dos suites son distintas a propósito. ⚠️ **Vacía la base
de negocio a propósito:** después hay que volver a sembrar con `npm run db:demo`.

**El Done de una fase se audita, no se declara.** `tests/invariantes.test.ts` verifica el criterio de
cierre de la B2 —los 12 invariantes de `data-model.md` §11— contra el propio documento. **Los doce
tienen test** desde que la B5 migró `exam_preparation`: `I7` era el único pendiente, y el guard rompió
solo el día que la migración entró, que es para lo que estaba escrito.

La frontera ya existe: `lib/domain/` (puro) → `lib/navigation/` (grafo + 20 CTAs) →
`lib/fixtures/` (catálogo) → `app/(student)/` proyecta → `components/screens/` recibe props tipadas.
**Ninguna pantalla importa un fixture** y **`lib/navigation/` no importa `lib/fixtures/`**; hay tests
estáticos que lo verifican.

✅ **El recorrido del focus group es recorrible extremo a extremo, y ahora entero por clic.**
Conserva **una** costura declarada: `UX05` cruza el nodo `ejecución`, que no tiene pantalla. La de
`UX07` se cerró con `CTA-019` ([ADR-016](docs/decisions.md#adr-016)).

- **Track A** (clickeable, fixtures, sin backend): **sin bloqueos.** Cerrar la Fase 0 cierra el
  track — Operador e Institución se difirieron ([ADR-012](docs/decisions.md#adr-012)).
- **Track B** (backend persistente): B1–B6.7 completas en su alcance disponible y B2b en 2/3, sobre datos sintéticos.
  Todo lo que toque un dato real sigue bloqueado por [ADR-006](docs/decisions.md#adr-006).

**Stack:** Next.js 16 · React 19 · Tailwind v4 CSS-first · shadcn vendorizado · Vitest.

**`npm audit`: 0 vulnerabilidades.** Eran **3 `high`** —`next`, `postcss`, `sharp`, que eran **la
misma deuda contada tres veces**: ni `postcss` ni `sharp` estaban en `package.json`, los traía
`next`—. Se cerraron subiendo `next` y `eslint-config-next` de `16.2.6` a **`16.3.4`**, fijadas
exactas y sin tocar React.

✅ **`ACCEPTED — AMENDED AND SIGNED`** · 3 de septiembre de 2026. El CTO ratificó la
[Enmienda 1 de ADR-008](docs/decisions.md#adr-008-enmienda-1): la versión, `agentRules: false` y el
push de `feat/fase-0-track-a`. La revisión de trazabilidad se cerró el mismo día.

⚠️ **La firma autoriza el push, y nada más.** **No hay autorización de merge a la rama principal ni
de despliegue** — las dos necesitan decisión propia, y el despliegue además sigue bloqueado por
[ADR-006](docs/decisions.md#adr-006).

⚠️ **El criterio del CTO rige de acá en adelante:** un cambio puede resolverse de la manera más
simple que permita avanzar **siempre que sea explícito, trazable, reversible y verificable**. Si más
adelante hay que modificarlo, tiene que poder identificarse qué cambió, por qué y a qué afecta.

⚠️ **No corras `npm audit fix --force`.** La versión la elige el ADR, no una etapa. Todo el
resultado y la exposición real, en [`brief-adr-008-seguridad.md`](docs/brief-adr-008-seguridad.md)
§10; el resumen, en `roadmap.md` §3.1.

Superficies: `UX01`–`UX09`. **Las nueve existen** como componente real con ruta propia bajo
`app/(student)/`. **No existe `UX10`.** Las 20 CTAs son alcanzables y todos sus destinos tienen
pantalla.

El registro canónico tiene **20 CTAs**, y **dos no transcriben la tabla del spec**: `CTA-019`
(`UX02 → UX07`) entró el 1 de septiembre de 2026 por [ADR-016](docs/decisions.md#adr-016), y
`CTA-020` (el alta de evaluación, dentro de `UX02`) el 7 de septiembre por
[ADR-067](docs/decisions.md#adr-067). Las dos son correcciones aprobadas, y hay un test que exige que
toda CTA fuera del spec tenga un ADR `ACCEPTED` que la nombre.

Para ver cualquier estado crítico sin panel de debug: `?escenario=<ID>` en **cualquiera** de las
nueve rutas.

El recorrido de focus group vive en `lib/navigation/focus-group.ts`, **aparte del registro
canónico**: es el guion de una sesión, no un contrato. Queda **una** costura, dicha de frente:
`UX05` se alcanza cruzando `ejecución`, que no tiene pantalla. La otra se cerró — `UX07` ya se
alcanza por clic con `CTA-019` ([ADR-016](docs/decisions.md#adr-016)).

---

## Reglas del Track A

Cero red · cero persistencia · cero datos reales · **desktop-first** (360 px es el piso móvil,
[ADR-014](docs/decisions.md#adr-014)) · una sola CTA primaria.

---

## Tono

**Voseo rioplatense, sin excepciones.** *"Entregá"*, *"Subí"*, *"Comprometerme"*.
