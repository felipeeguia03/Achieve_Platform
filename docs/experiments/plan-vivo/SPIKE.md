# Spike visual de «Mi Plan vivo»

**Estado:** 🟡 `READY FOR PRODUCT REVIEW` — **no validado, no aprobado, no listo para integrar.**
**Fecha:** 14 de septiembre de 2026 · **Rama:** `feat/paralelo`
**Reemplaza, por ahora,** al paso 2 de [`IMPLEMENTATION_SEQUENCE.md`](IMPLEMENTATION_SEQUENCE.md).
**No cierra** [ADR-109](../../decisions.md#adr-109), que sigue `PENDING`: sirve para decidirlo mirando.

---

## 1. La única pregunta que contesta

> ¿Ver cómo el plan se mueve ayuda al estudiante a entender por qué debe actuar ahora y qué cambia en
> su futuro académico?

Prueba el **lenguaje visual y el modelo mental**. No prueba la inteligencia del planificador: **no hay
planificador**. Ver §4.

## 2. Cómo abrirlo

La ruta está **apagada por defecto** y responde `404` sin la variable.

```bash
npm run build
PLAN_VIVO_SPIKE=1 npx next start -p 3111
# o, en desarrollo:  PLAN_VIVO_SPIKE=1 npm run dev
```

| Para ver | URL |
|---|---|
| El plan actual (lunes 14, 17:30) | `/demo/plan-vivo-spike` |
| La simulación de Límites, ya fijada | `/demo/plan-vivo-spike?escenario=simulacion` |
| Cinco horas más, en vista previa | `/demo/plan-vivo-spike?escenario=disponibilidad` |
| Cinco horas más, aplicadas en el demo | `/demo/plan-vivo-spike?escenario=disponibilidad-aplicada` |
| El reloj adelantado al jueves 19:10 | `/demo/plan-vivo-spike?escenario=reloj` |
| Reorganizar sin cortar, en vista previa | `/demo/plan-vivo-spike?escenario=rescate` |
| El Calendario con el compromiso | agregar `&vista=calendario` a cualquiera |

`?escenario=` sólo elige **desde dónde arranca**. Todo lo demás vive en memoria: al refrescar vuelve a
ese punto de partida, y nada se guarda.

## 3. Recorrido sugerido para la revisión

1. **Abrí la base y no toques nada durante diez segundos.** ¿Se entiende qué conviene hacer ahora, qué
   evento está más cerca, qué es de la facultad, qué ya comprometiste, qué es sólo una propuesta y cuánto
   no entra?
2. **Pasá el mouse por la tarjeta de Próxima acción** (a la derecha, arriba). Límites queda hecho en
   forma simulada, el repaso previo deja de hacer falta, Derivadas se adelanta al martes y aparecen 45 min
   de margen el miércoles. Sacá el mouse: vuelve. Clic o Enter la deja fija; Escape o *Volver al plan
   actual* la cierran.
3. **Reajustar disponibilidad → Esta semana tengo 5 horas más.** La guía de elasticidad entra, Caché y
   Economía se adelantan al jueves y queda margen antes del parcial. El trabajo sigue siendo 9 h 20.
4. **Restablecer fixture → Adelantar reloj → Jueves 17 · 19:10.** El compromiso del miércoles queda
   *Incumplido* en su lugar, su trabajo aparece en *Necesita reubicación*, y la disponibilidad de lunes a
   miércoles deja de contar. *Reorganizar sin cortar* muestra dónde podría ir, **sin confirmarlo**.
5. **Tocá el compromiso y *Ver en Calendario*.** Mismos datos, incluido el estado.

## 4. Qué es preparado y qué es calculado

| Pieza | Cómo sale | Dónde |
|---|---|---|
| Materias, clases, parcial, disponibilidad, duraciones, confianzas y fuentes | **Inventado para el demo** | `app/demo/plan-vivo-spike/_spike/fixture.ts` |
| **Dónde va cada propuesta en cada escenario** | **Escrito a mano.** No hay algoritmo | `fixture.ts` → `ESCENARIOS` |
| Totales, márgenes, *antes → después* | **Calculado** desde los bloques | `proyecciones.ts` |
| Huellas y frases de *Qué cambió* | **Calculado** comparando dos proyecciones | `celdas.ts`, `panel-explicativo.tsx` |
| Razones de la recomendada | Hechos del fixture con el día y la hora del escenario | `panel-explicativo.tsx` |
| Alternativas | Escritas a mano, **sin puntaje** | `fixture.ts` → `ALTERNATIVAS` |

Las cifras cierran siempre, y hay test que lo verifica en los seis escenarios:
`pendiente − disponible = sin ubicar − margen`.

| Escenario | Pendiente | Disponible | Sin ubicar | Margen |
|---|---:|---:|---:|---:|
| Plan actual | 9 h 20 | 7 h 30 | 1 h 50 | 0 |
| Simular Límites | 7 h 35 | 6 h 30 | 1 h 50 | 45 min |
| 5 h más (vista previa y aplicada) | 9 h 20 | 12 h 30 | 0 | 3 h 10 |
| Reloj adelantado | 9 h 20 | 3 h 15 | 6 h 20 | 15 min |
| Reorganizar sin cortar | 9 h 20 | 3 h 15 | 6 h 35 | 30 min |

⚠️ **En la simulación el disponible baja de 7 h 30 a 6 h 30**, porque la hora del lunes la usa Límites.
Es correcto, y puede leerse raro: es una de las cosas a mirar.

## 5. Lo que se hizo distinto del pedido, y por qué

| Pedido | Lo construido | Por qué |
|---|---|---|
| Eje horizontal cronológico con escala fija | **Siete columnas iguales por día**; dentro de cada día, orden por hora, y el divisor *Ahora* separa pasado de futuro | Una escala proporcional a la hora dejaba bloques de 50 min en ~12 px. La escala sigue sin cambiar entre escenarios |
| *Límites · 50–65 min* | Igual, con duración **probable 60** | Para que el bloque del lunes (18:00–19:00) cierre las cuentas. Si se estira al máximo, pasa 5 min, y la pantalla lo dice |
| *Ayer no pudiste* | *Ayer no se empezó el compromiso de Arquitectura* | «No pudiste» le atribuye la causa a la persona (ADR-075: el mensaje va sobre la tarea) |
| *SIMULACIÓN · Todavía no cambió tu plan* | *Simulación · Todavía no cambió tu plan* | El repo no dibuja rótulos en mayúsculas (`tests/titulos.test.tsx`) |
| *Progreso constatado* | *Progreso registrado* | Es el nombre de la operación que ya existe (`registrarProgreso`, ADR-047) |
| Movimiento de 350–650 ms | **480 ms**, sin sobrepaso | `design-system-capturas.md` §2.5 fija 180–220 ms **para ventanas**. Acá el movimiento es la explicación. **Queda para el owner** |
| Cinco estados | **Seis**: se agregó `RESCUE_PREVIEW` | Para mostrar la propuesta de reubicación sin confirmarla |
| Hover opcional sobre el bloque del Gantt | **No se hizo.** Sólo la tarjeta fija del panel | Evita el parpadeo del bloque que se mueve bajo el cursor |
| — | La simulación y los escenarios de disponibilidad y reloj **sólo arrancan desde el plan actual** | Son proyecciones preparadas: combinarlas exigiría preparar cada combinación. Los controles lo dicen |
| Ruta `/demo/plan-vivo-spike` | Igual, **detrás de `PLAN_VIVO_SPIKE=1`** | Mismo cerrojo que `ESCALAMIENTO_SINTETICO`. Sin la variable, `404` |
| Reutilizar el AppShell | **No se reutilizó** | El Shell espera un nodo del registro de navegación y una sesión; usarlo obligaba a tocar `lib/navigation/`. Se copió el lenguaje visual (tokens, paneles, controles) sin tocar nada compartido |

## 6. Invariantes: cómo quedaron

| # | Invariante | Cómo se garantiza |
|---|---|---|
| 1–2 | Clases y evaluaciones no se mueven | Tienen `franjaFija` en el catálogo: un escenario **no puede** ubicarlas (test) |
| 3 | El compromiso confirmado no se reubica en silencio | También `franjaFija`; en el reloj cambia de estado, no de lugar (test) |
| 4 | Las propuestas se reordenan | Sólo ellas tienen ubicación por escenario |
| 5 | Simular nunca escribe | Sin red, sin almacenamiento, sin `/api`: guard estático + `fetch` espiado en el recorrido completo |
| 6 | Disponibilidad no reduce trabajo | `diff.minutos.pendiente === 0` con 5 h más (test) |
| 7–9 | Compromiso ≠ progreso; tiempo ≠ dominio; evidencia validada ≠ progreso | Estados separados; la simulación enumera los cinco hechos y dice que ninguno implica al siguiente |
| 10–11 | El incumplido no desaparece; su trabajo sigue pendiente | Queda en su franja; el trabajo es **otro elemento** y no se cuenta dos veces (test) |
| 12 | Plan y Calendario dicen lo mismo | Los dos leen `itemDe(proyeccion, id)` de la misma proyección (test en pantalla) |
| 13–15 | Rangos, confianza con fuente, sin falsa precisión | Rango + probable + confianza + fuente en cada propuesta; el total muestra *entre 8 h 05 y 11 h* |
| 16–18 | Sin predicción, sin readiness, sin puntaje | Guard sobre el copy |
| 19 | Horarios institucionales sólo del fixture | Todo dato está rotulado como demostración |
| 20 | Mismo reloj y zona | Un reloj por escenario, `America/Argentina/Cordoba`, visible arriba a la derecha |

## 7. Accesibilidad

✅ **Hecho:** todo es navegable con teclado; foco visible con el anillo del sistema; la tarjeta activa la
simulación con foco y la fija con Enter o Espacio; Escape la cierra; los menús usan `aria-expanded`; cada
bloque tiene un nombre accesible con materia, título, estado y hora; los cambios de escenario se anuncian
con `aria-live`; `prefers-reduced-motion` apaga el movimiento y deja huellas, rótulos y texto; ningún
estado depende sólo del color; sin scroll horizontal de página a 390 y 1024 px.

⚠️ **Pendiente, y dicho:**

- **El orden de tabulación recorre el camino antes que la tarjeta.** Con teclado se llega a *Próxima
  acción* después de pasar por los bloques. No hay atajo.
- **Los bloques simulados van al 60 % de opacidad**: no se midió su contraste, y es probable que no
  alcance AA. La trama y el rótulo *simulado* llevan la información.
- **La grilla usa `role="table"` sobre `display: contents`**: los lectores de pantalla no siempre
  anuncian bien esa combinación.
- **En mobile la tarjeta queda debajo del camino**: tocarla simula, pero hay que volver a subir para ver
  el movimiento.
- El pedido llegó cortado en su §17: estos criterios siguen los del repositorio
  (`docs/design-system.md` §9), no los que faltaron.

## 8. Qué mirar para decidir

- ¿La huella y el movimiento **explican** o **distraen**?
- ¿*Simulación · Todavía no cambió tu plan* alcanza para que nadie crea que ya pasó?
- ¿*Disponible 6 h 30* en la simulación se entiende, o parece que se perdió una hora?
- ¿Se distinguen a simple vista *Propuesta*, *Confirmado* e *Incumplido*?
- ¿*Reorganizar sin cortar* muestra la salida sin sonar a reproche?
- ¿El nombre *Mi Plan* choca con el *Plan de estudio* que ADR-100 descartó? ([D-09](DECISIONS.md#d-09))

**Y lo que el spike no puede contestar:** si un motor real puede producir estas ubicaciones. Eso es
[D-01](DECISIONS.md#d-01) y [D-02](DECISIONS.md#d-02), y lo decide el owner.

## 9. Verificación

| Gate | Resultado |
|---|---|
| `npm run lint` | ✅ |
| `npm run typecheck` | ✅ |
| `npm run build` | ✅ — la ruta se sirve dinámica (`ƒ`), así el flag se lee en cada request |
| `npm test` | ✅ — incluye `tests/plan-vivo-spike.test.ts` (cuentas e invariantes) y `tests/plan-vivo-spike-vista.test.tsx` (interacción) |
| `npm run db:verify` | ⛔ **No se corrió.** El spike no toca schema ni funciones, y el comando **vacía la base de negocio** que usa el dev server abierto en `:3001` |
| Navegador real | ✅ 1440 × 900, 1024 × 768 y 390 × 844 en Chromium headless: sin errores de consola; sin la variable, `404` |

## 10. Cómo borrarlo

```bash
rm -r app/demo/plan-vivo-spike tests/plan-vivo-spike.test.ts tests/plan-vivo-spike-vista.test.tsx docs/experiments/plan-vivo/SPIKE.md
```

Nada del producto lo importa, y hay test que lo verifica.
