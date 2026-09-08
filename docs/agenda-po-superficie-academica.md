# Agenda — nueve rutas esperan a una persona que no tiene pantalla

**Documento:** `docs/agenda-po-superficie-academica.md`
**Para:** Product Owner
**De:** equipo Plataforma
**Fecha:** 8 de septiembre de 2026
**Qué es:** **un planteo, no un plan.** No propone construir una consola. Propone decidir **cuántas
personas distintas** estamos llamando *"una persona"*, porque de eso depende cuánta superficie hace
falta — y la respuesta puede ser bastante menos de la que parece.

---

## 1. El hecho, medido

**Once rutas de API llevan secreto de servicio. Nueve esperan a un ser humano. Ninguna tiene
pantalla.**

| Ruta | Qué espera de una persona |
|---|---|
| `POST /api/validacion` | Que alguien juzgue si una entrega alcanza. *"Nadie valida su propia evidencia."* |
| `POST /api/corroboracion` | Elevar o disputar un `verification_status` — la operación que el invariante `I9` exige |
| `POST /api/pedido-de-reenvio` | Decidir que hay que volver a entregar, que es distinto de *"no alcanzó"* |
| `POST /api/observacion` · `/correccion` | Registrar y corregir un error observado |
| `POST /api/revision-temprana` | Pedir una persona **sin esperar** al tercer error comparable |
| `POST /api/apoyo` | Registrar una necesidad de apoyo para avanzar |
| `POST /api/examen/reentrada/propuesta` | Proponer volver a un paso del protocolo |
| `GET /api/escalamiento` | Mirar la cola |

Las otras dos —`/api/reloj` y `/api/recomendacion`— son del sistema, no de nadie.

Y la de escalamiento **lo dice de sí misma**, en su propio encabezado:

> ⚠️⚠️ *"**INTERNO Y SINTÉTICO. NO ES EL CRM, Y NO ES UNA CONSOLA DE OPERADOR.** Existe para una sola
> cosa: que el recorrido del MVP se pueda verificar."*

**No es que falte una pantalla. Es que la mitad del producto está construida para alguien que todavía
no existe en el sistema.**

---

## 2. Lo que se decidió *hacia el estudiante* porque no había otro lado

Ninguna de estas decisiones fue mala. Todas fueron **la mejor disponible dado que la alternativa era
cablear algo a nadie**. Pero conviene verlas juntas:

| Decisión | Qué dice | Qué se perdió |
|---|---|---|
| [ADR-067](decisions.md#adr-067) | El estudiante da de alta sus evaluaciones | **Sin efecto red.** Veinte personas de la misma comisión cargan el mismo parcial veinte veces, y las veinte filas conviven `unverified` |
| [ADR-069](decisions.md#adr-069) | El estudiante confirma qué fila del libro fue un parcial | Cada uno reclasifica el mismo libro de temas |
| [ADR-071](decisions.md#adr-071) | El estudiante aprueba sus prerequisitos | Ídem. Y **hoy nada los consume** |
| [ADR-057](decisions.md#adr-057) | **Quién valida y corrobora queda diferido** | `corroborar_procedencia()` existe y no lo llama nadie |
| [ADR-075 §B2](decisions.md#adr-075) | La señal de revisión de calibración | **Se detecta y no tiene a dónde ir** |
| [ADR-075 §D](decisions.md#adr-075) | *"Owner académico/cátedra para el valor base"* | La carga de estudio la puede declarar la ingesta; **nadie la revisa** |

> ⚠️ **El patrón se repitió cuatro veces, y cada vez la salida fue la misma:** *"en un principio el
> alumno se autoagenda"*. Es coherente y funciona. **Y no escala**, porque hace que cada estudiante
> reconstruya solo lo que la cátedra sabe una vez.

---

## 3. La pregunta que en realidad hay que contestar

**No es «¿construimos una consola?». Es «¿cuántas personas distintas son?».**

Hoy el sistema dice *"una persona"* para al menos cinco roles, y ya hay documentos que los
distinguen sin haberlos nombrado:

| Rol | De dónde sale | Sobre qué decide |
|---|---|---|
| **Operador** | [ADR-003](decisions.md#adr-003), a converger con el coach del CRM | Acompaña a **una persona** |
| **Owner académico de la estimación** | [ADR-075 §B2](decisions.md#adr-075) y §D | El **contenido**: si la estimación está bien, si el material alcanza |
| **Referente humano** | §B2, segundo paso | El caso, cuando el patrón persiste tras la revisión de contenido |
| **Psicopedagogía** | §B2, y sólo si convergen otras señales | — |
| **Quien corrobora procedencia** | `I9`, diferido por ADR-057 | Si un dato pasa de `unverified` a `official` |

Y la psicopedagoga fue explícita en que **no son intercambiables**:

> *"**Psicopedagogía no debe ser el primer destino automático de un error de tiempo.**"*
>
> *"Primero owner académico de la estimación; luego referente humano."*

**Ese orden es una arquitectura, no una cortesía.** Si el sistema tiene un solo buzón humano, cada
anomalía de datos termina pareciendo un problema de la persona — que es exactamente lo que ella
señaló que no debe pasar.

---

## 4. El corte que nadie había hecho, y que abarata todo

**El owner académico no trabaja sobre datos personales. Trabaja sobre contenido.**

| | Sobre qué | ¿Lo bloquea [ADR-006](decisions.md#adr-006)? |
|---|---|---|
| **Owner académico** | Temas, clases, estimaciones, prerequisitos, alcance de evaluaciones | ❌ **No.** Es material de cátedra |
| **Operador / coach** | El recorrido de un estudiante concreto | ✅ **Sí.** Es una persona real |
| **Psicopedagogía** | Ídem | ✅ **Sí** |

**Sólo uno de los cinco roles está desbloqueado hoy**, y es justamente el que más decisiones tiene
esperando: los prerequisitos, la clasificación del libro de temas, la carga de estudio y la revisión
de calibración son **todas sobre contenido**.

⚠️ **Y ninguno de los otros cuatro se puede construir todavía**, porque no hay a quién mostrárselo:
ADR-006 sigue `PROVISIONAL` y no hay un solo estudiante real en el sistema.

---

## 5. Lo que recomiendo, y lo que explícitamente no

**Recomiendo decidir los roles ahora y construir una sola superficie: la académica.**

No porque sea la más urgente para el estudiante —no lo es—, sino porque es **la única que se puede
construir hoy**, la que desbloquea cuatro decisiones ya tomadas, y la que no toca ADR-006.

⚠️ **No recomiendo una consola de operador.** Sería construir para datos que no existen, y además
pisaría [ADR-003](decisions.md#adr-003): el Dashboard_Achieve ya tiene coaches, y la convergencia
está aceptada como *"se integra el dominio, no los frontends"*. Una consola nuestra sería el segundo
frontend que ese ADR dice que no hagamos.

⚠️ **Y no recomiendo revertir ninguna de las cuatro decisiones de §2.** Que el estudiante pueda
declarar sus evaluaciones y sus prerequisitos **es correcto y se queda**. Lo que la superficie
académica agrega es que alguien pueda **corroborar** lo que veinte estudiantes declararon por
separado — que es `corroborar_procedencia()`, la función que existe y nadie llama.

---

## 6. Lo que hace falta decidir, en orden

> ### 6.1 ⭐ ¿Son cinco roles, o menos?
>
> El más probable colapso: **owner académico y referente humano pueden ser la misma persona en una
> cátedra chica**. Si lo son, la superficie es una sola y el orden de §B2 se vuelve una cola, no dos.
>
> Lo que **no** se puede colapsar sin contradecir a la psicopedagoga es psicopedagogía con
> cualquiera de los otros.

> ### 6.2 ⭐ ¿Quién es el owner académico — la cátedra, o nosotros?
>
> Cambia todo. Si es **la cátedra**, hay que construir un acceso institucional, y eso es alcance de
> [ADR-039](decisions.md#adr-039) y del CRM. Si somos **nosotros** —alguien de Achieve revisando el
> material que se ingiere—, es una superficie interna y se construye la semana que viene.
>
> Para el MVP, *"nosotros"* parece lo razonable: el material ya lo ingerimos nosotros.

> ### 6.3 ¿Qué ve en esa pantalla?
>
> Lo que hoy no tiene destino, y nada más:
>
> - Prerequisitos propuestos desde el orden dictado, para aprobar o descartar ([ADR-071](decisions.md#adr-071))
> - Filas del libro de temas que **parecen** un parcial, para confirmar ([ADR-069](decisions.md#adr-069) — 25% de falsos positivos medidos)
> - Evaluaciones declaradas por varios estudiantes de la misma comisión, para fusionar ([ADR-067](decisions.md#adr-067))
> - Señales de revisión de calibración ([ADR-075 §B2](decisions.md#adr-075))
> - Cargas de estudio declaradas, para revisar (§D)

> ### 6.4 ¿Es una superficie del registro canónico?
>
> **Creo que no, y es la misma respuesta que [ADR-052](decisions.md#adr-052) le dio al alta.** Las
> nueve superficies y las veinte CTAs son **el recorrido del estudiante**. Una pantalla interna no
> entra ahí, igual que `/alta/*` no entró: los guards de navegación la excluirían por el mismo
> criterio.

---

## 7. Lo que cuesta

| | |
|---|---|
| **Decidir los roles** | Una conversación. Nada de código |
| **La superficie académica** | El backend ya existe: son las nueve rutas. Lo que falta es la pantalla y la autorización |
| **No hacer nada** | Sigue funcionando. Cada estudiante reconstruye solo lo que la cátedra sabe una vez, y `corroborar_procedencia()` sigue sin llamador |

⚠️ **Y una fecha que conviene mirar:** cuando ADR-006 se abra, van a hacer falta **las cinco**
superficies a la vez, porque van a existir estudiantes reales. Decidir los roles ahora es lo que
evita que ese día se decidan a las apuradas.

---

## 8. Lo que este documento no decide

- **La convergencia con Dashboard_Achieve.** [ADR-003](decisions.md#adr-003) está aceptado y dice
  *"se integra el dominio, no los frontends"*. Este planteo **no lo toca**.
- **Quién corrobora procedencia.** [ADR-057](decisions.md#adr-057) lo difirió hasta el dictamen
  legal, y sigue diferido: acá se pregunta **qué pantalla existe**, no **quién tiene autoridad**.
- **La navegación del mockup.** `Formación` y `Mi seguimiento` siguen sin decidir, y son otro tema.
