# Gimnasia cognitiva — plan, API y QA

**13 de septiembre de 2026** · decidido en [ADR-102](decisions.md#adr-102) · fuente literal del pedido en
[`gimnasia-cognitiva-source.md`](gimnasia-cognitiva-source.md).

> *"El estudiante no juega para escapar del estudio. Juega brevemente para entrenar una habilidad y
> luego vuelve a aplicarla en su próxima acción académica."*

Si este documento y el ADR discrepan, gana el ADR.

---

## A. Lo que ya existía y se reusó

| Pieza | Para qué |
|---|---|
| Nodo sin wireframe (`FORMACION`, `CLASE`, `CALENDARIO`) | `GIMNASIA` en `/gimnasia` sin ser una décima superficie |
| `objetoEnPantalla` + `useMigaDelObjeto` (ADR-088 Enm. 7–8) | La rutina abierta como objeto: controles, ficha *Gimnasia · Memoria*, miga *Gimnasia › Memoria* |
| `useSuperficie` / `enviar` / `NoSePudoCargar` | Carga, `401` → login, `409 ALTA_INCOMPLETA`, errores |
| `resolverSesion` + `altaPendiente` + composición única | Autenticación, padrón y alta antes que nada |
| Idempotencia por `clave` y compare-and-swap (Modo Clase) | Sesión, intento y repaso |
| `product_event` + `product-events.ts` | Cuatro eventos `TRANSICION` declarados |
| `publication_status` + procedencia (Formación, ADR-087) | Preguntas `DRAFT` por defecto; sintéticas sólo con `MODO_PRUEBA=1` |
| `TituloDePanel`, `CTAPrincipal`, `CTASecundaria`, tokens | El lenguaje visual, sin colores propios |

**Lo que no se encontró y por eso no se usó:** un scheduler de repaso, preguntas de cátedra o de
Achieve, una capacidad para que el estudiante cree preguntas, y un punto de extensión seguro en Hoy o
en la Bitácora.

## B. Datos declarados, derivados y calculados

| Nivel | Qué | Dónde |
|---|---|---|
| **Declarado por el estudiante** | Empezar, salir, las respuestas, la clasificación de una abierta | `gym_session`, `gym_attempt.answers`, `recall_review.outcome` |
| **Calculado por el servidor** | Semilla, largo inicial, plan de preguntas, corrección, puntuación, nivel, próximo repaso | `gym_attempt`, `recall_review` |
| **Derivado al leer** | Mejor marca, nivel actual, días con rutina, pendientes, recuerdo diferido, duración | `proyectarGimnasia` |
| **Inferido por IA** | **Nada.** | — |

## C. Cortes

| # | Corte | Estado |
|---|---|---|
| 0 | ADR-102, fuente literal, este plan | ✅ |
| 1 | Dominio puro: azar con semilla, los tres juegos, política de repaso, rutina, máquinas | ✅ |
| 2 | Migración: `gym_session`, `gym_attempt`, `recall_item`, `recall_review` · aislamiento | ✅ |
| 3 | Service, Repository, composición y API · los cuatro eventos | ✅ |
| 4 | Navegación: nodo, menú, miga, objeto en pantalla, `CTA-024`/`CTA-025` | ✅ |
| 5 | Pantalla: portada, los tres juegos, la sesión y el cierre | ✅ |
| 6 | Siembra sintética (`npm run db:gimnasia`) | ✅ |

## D. La API

Todas: `401` sin token, `403` sin padrón, `409 ALTA_INCOMPLETA` antes que nada. **Lo ajeno es `404`**.
El estudiante, la institución y la zona salen de la sesión; ningún cuerpo los lleva.

| Ruta | Qué | Respuestas |
|---|---|---|
| `GET /api/gimnasia` | La portada entera en una lectura | `200` |
| `POST /api/gimnasia/sesion` | `{ origen: "ROUTINE" \| "SINGLE_GAME", juego?, clave }` — `CTA-024` / `CTA-025` | `201` · `200` repetido · `409 YA_HAY_OTRA_ABIERTA` · `409 SIN_PREGUNTAS` · `400` |
| `POST /api/gimnasia/sesion/cancelar` | `{ sesion }` | `200` (repetido también) · `404` |
| `POST /api/gimnasia/intento` | `{ sesion, juego, clave }` → semilla y largo, o la primera pregunta **sin respuesta** | `201` · `200` repetido · `409 SESION_CERRADA` · `409 JUEGO_COMPLETADO` · `409 SIN_PREGUNTAS` · `400` · `404` |
| `POST /api/gimnasia/intento/resultado` | `{ intento, respuestas }` → el resultado **que calcula el servidor** (en Recuerdo real: salir guardando) | `200` · `409 PARTIDA_SIN_TERMINAR` · `409 INTENTO_REEMPLAZADO` · `409 NADA_RESPONDIDO` · `400` · `404` |
| `GET /api/gimnasia/recuerdo?intento=` | La pregunta que toca, sin respuesta | `200` · `404` |
| `POST /api/gimnasia/recuerdo` | `{ intento, item, accion: RESPONDER \| REVELAR \| AUTOEVALUAR, respuesta?, resultado?, clave }` | `201` · `200` repetido o revelada · `409 NO_TOCA` · `409 INTENTO_CERRADO` · `400` · `404` |

## E. Preparar la demo

Después de la secuencia de [`demo-mvp.md`](demo-mvp.md) §Preparar:

```bash
npm run db:gimnasia -- --aplicar              # 17 preguntas sintéticas DRAFT (4 generales + 13 de materias)
npm run db:gimnasia -- --aplicar --historial  # además, dos rutinas pasadas del estudiante sintético
```

Las preguntas se ven **sólo con `MODO_PRUEBA=1`**, rotuladas. Sin la variable, Recuerdo real queda en
preparación y la rutina tiene dos ejercicios. **La cuenta de la UCC no recibe preguntas de materias**:
su plan es real.

## F. Recorrido de QA

1. Entrar con `estudiante.sintetico@achieve.local`. En la barra lateral, **Gimnasia**.
2. Portada: *Entrená cómo estudiás*, *Tu rutina de hoy · Memoria · 3 ejercicios*, tres tarjetas, el aviso
   al pie. Ninguna otra categoría.
3. *Empezar rutina* → la URL lleva `?sesion=`; *1 de 3*; la miga *Gimnasia › Memoria*; arriba a la derecha
   minimizar y achicar. Minimizar deja la ficha *Gimnasia · Memoria*.
4. Cuadrícula fugaz con *Presentación sin tiempo*: dos rondas bien y dos mal terminan la partida.
5. **Recargar**: retoma en *2 de 3*.
6. Cadena inversa: pegar en la respuesta no hace nada; al errar muestra la cadena correcta.
7. Recuerdo real: la referencia aparece sólo después de *Confirmar respuesta*; en una abierta, las cuatro
   clasificaciones.
8. *Rutina terminada* con los tres juegos —aunque se haya recargado— y la duración total.
   *Volver a mi próxima acción* lleva a Hoy.
9. A 390 px no hay scroll horizontal.

### Recorrido verificado en el navegador (13 sep 2026)

Chromium con `playwright-core`, contra el servidor de desarrollo y la base local: los catorce pasos de
arriba en verde, **sin errores de consola ni respuestas ≥ 400** de `/api/gimnasia`. El recorrido encontró
un defecto —el resumen final perdía los juegos jugados antes de una recarga— y quedó corregido: el
resumen lo arma el servidor (`ResultadoDeIntento.sesion`).

## G. Lo que quedó sabido al construirlo

- ⚠️ **Con empate de prioridad, las preguntas se ordenan por id**, para que el orden no dependa de la base.
- ⚠️ **Revelar una abierta no guarda nada.** Si el estudiante sale entre revelar y clasificar, la pregunta
  sigue pendiente: *abrir no es responder*.
- ⚠️ **Una recarga abandona el intento abierto** y trae otra semilla: la partida anterior no se puede
  memorizar y repetir.
- ⚠️ **La portada muestra «Continuar» dos veces** con historial (Cadena inversa y Recuerdo real): son dos
  juegos distintos y es el copy que pidió el owner.

## H. Riesgos

| Riesgo | Mitigación |
|---|---|
| Que Gimnasia se vuelva la forma elegante de no estudiar | Sin contador ni urgencia; rutina acotada; al terminar, a Hoy |
| Que *nivel* se lea como un juicio sobre la persona | Siempre con su medida; el aviso responsable; guard de copy |
| Que una pregunta sintética se tome por contenido de cátedra | `DRAFT`, `SYN-`, `inference`, sólo con `MODO_PRUEBA=1`, rótulo en pantalla |
| Puntuaciones falsificadas desde el cliente | El servidor rehace la partida con su semilla |
| Dos pestañas empezando dos rutinas | Índice único: una sesión abierta por estudiante |
