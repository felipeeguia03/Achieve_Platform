# Agenda — el tiempo, la carga y lo que el sistema le dice al estudiante sobre sí mismo

**Documento:** `docs/agenda-psicopedagoga-tiempo-y-carga.md`
**Fecha:** 7 de septiembre de 2026
**Para:** la psicopedagoga que respondió las ocho `HUMAN-P0` el 31 de agosto y la validación del
6 de septiembre.
**De:** equipo Plataforma
**Continúa:** [`agenda-cierre-psicopedagoga.md`](agenda-cierre-psicopedagoga.md). **No la reemplaza:**
aquellos ocho residuos siguen abiertos y esto es material nuevo.

---

## Qué se construyó desde la última vez, en dos párrafos

El producto ahora estima **cuántas horas lleva cada materia** —a partir de los libros de temas y los
programas de cátedra reales de una carrera— y **cuánto de eso ya tiene evidencia enviada**. Con eso
dibuja una línea de tiempo por materia.

Y desde esta semana hace algo más: **reparte el tiempo que el estudiante declara tener entre todas
sus materias**, según cuánto le falta a cada una y cuán cerca está su evaluación. Cuando el tiempo no
alcanza, **lo dice**.

Ahí es donde entra esta agenda. **El sistema pasó a hacerle afirmaciones al estudiante sobre su
propio tiempo, y ninguna de esas frases pasó por vos.**

---

## Lo que NO te preguntamos, porque ya lo respondiste

Se aplicó tu frase —*"el sistema debe reconocer patrones, **no etiquetar personas**"*— a cada decisión
de esta tanda, y en varias fue el argumento que cerró la discusión:

| Se decidió | Por tu regla |
|---|---|
| El sistema **no elige qué materia recortar** cuando falta tiempo | Decidir cuál se sacrifica es una decisión de vida |
| El multiplicador personal **no se muestra como un número sobre la persona** | *"Tardás 1,8× lo normal"* es etiquetar |
| **No se comparan estudiantes**: no hay percentiles ni «más lento que el promedio» | Idem |
| La disponibilidad **no se deriva de lo que el estudiante cumplió** | Una mala semana le reduciría el presupuesto, y después le repartiría menos porque hizo menos |

**Lo que sigue es lo que esa regla no alcanza a resolver sola.**

---

## ⭐⭐ Bloque A — El déficit. Es lo único que bloquea

Un estudiante declara cuánto tiempo tiene por semana. El sistema calcula cuánto piden sus materias.
**Cuando no alcanza, hoy se ven las dos cifras y nada más.**

Es la pantalla, textual, con datos reales de una materia de la carrera:

```
TUS HORAS ESTA SEMANA
5 h por semana · 52,5 h es lo que piden tus materias

Cálculo Avanzado                                      5 h

Es una estimación, no una agenda. Nada se agenda desde acá.
```

**Las dos cifras son correctas.** El parcial es en ocho días, el estudiante declaró cinco horas
semanales, y de las cuarenta horas de contenido que entran sólo tiene trabajada una unidad.

El Product Owner ya decidió **que el hueco se muestre** —la alternativa era ocultarlo, y planificar
sobre una foto que esconde el dato más importante es peor—. Y decidió que **no lleve veredicto**: no
dice *"no vas a llegar"* ni *"apurate"*.

**Lo que no sabemos es si eso alcanza.**

> ### A1 ⭐ — ¿Ese número, así, ayuda o aplasta?
>
> No preguntamos si es cierto: lo es. Preguntamos si **decírselo de esa forma** le sirve a alguien
> que ya está atrasado, o si lo único que produce es la confirmación de que no llega.

> ### A2 ⭐ — Si se muestra, ¿con qué palabras?
>
> Hoy dice *"5 h por semana · 52,5 h es lo que piden tus materias"*. Es la formulación más neutra que
> encontramos, y **la escribimos nosotros**. Si hay una manera mejor de decir lo mismo sin
> suavizarlo hasta que deje de ser cierto, esa frase es tuya.

> ### A3 ⭐ — ¿Hay un punto donde el número deja de informar?
>
> Cinco contra siete horas es una brecha que alguien puede cerrar. Cinco contra cincuenta y dos no.
> **¿A partir de qué distancia conviene decir otra cosa** —y qué otra cosa—, en vez de un número que
> ya no es accionable?
>
> Si la respuesta es *"a partir de ahí no va un número, va una conversación con una persona"*, eso el
> sistema lo puede hacer: es el mismo circuito de intervención que ya existe.

> ### A4 — ¿Qué va al lado del número?
>
> Hoy: nada. Es un hecho suelto. **¿Debería ofrecer algo** —una acción, un recorte, un pedido de
> ayuda—, o cualquier cosa que ofrezcamos ahí es el sistema opinando sobre cómo organizar una vida
> que no conoce?

---

## ⭐ Bloque B — El multiplicador personal

El sistema mide **cuánto tarda cada estudiante comparado con lo estimado**, a partir de lo que él
mismo declara en la reflexión (*"esto me llevó 75 minutos"* contra una `Action` estimada en 40–60).

Con eso ajusta hacia arriba las horas que le pide. **Se ve el efecto —más minutos—, nunca el
coeficiente.**

Estas cuatro reglas las decidió el equipo, y las cuatro son tuyas por materia:

> ### B1 ⭐ — El piso: el multiplicador **nunca baja de 1,0**
>
> A quien tarda la mitad de lo estimado, el sistema **no le promete que va a necesitar menos**: le
> deja la estimación como está.
>
> El fundamento es que una promesa de «vas a tardar menos» es algo que el sistema no puede sostener.
> **¿Es correcto, o quitarle reconocimiento a alguien que va bien tiene un costo que no vimos?**

> ### B2 ⭐ — El techo: se corta en 2,0, y ahí **debería aparecer una persona**
>
> Que a alguien le lleve sistemáticamente **más del doble** de lo estimado nos pareció que ya no es
> un problema de calibración: es que algo más está pasando —el material no alcanza, la estimación
> está mal, hay una dificultad que nadie miró—.
>
> Hoy el sistema **sólo corta el número**. No avisa a nadie. **¿Debería ser una señal que convoque a
> una persona?** Si la respuesta es sí, es una regla más del circuito de riesgo, y necesita las
> mismas ocho columnas que las otras.

> ### B3 — El mínimo: cinco observaciones
>
> Con menos de cinco, el sistema **no calibra nada** y deja el multiplicador en 1,0. El número lo
> elegimos nosotros, con el argumento de que con dos la mediana es ruido. **¿Cinco es razonable, o
> hacen falta más para afirmar algo sobre cómo trabaja una persona?**

> ### B4 — ¿Se le puede decir que el sistema lo está calibrando?
>
> Hoy no se le dice nada: los bloques simplemente le piden más minutos. La alternativa sería algo
> como *"tus bloques suelen llevarte más de lo estimado, así que ajustamos"*.
>
> **¿Sirve saberlo, o es exactamente el tipo de devolución sobre uno mismo que conviene no dar?**

---

## Bloque C — La barra de cobertura

Cada materia muestra cuánto lleva trabajado. La frase de abajo la escribió el Product Owner y se
adoptó textual:

```
1 de 9 temas · 26% de las horas
* temas marcados por vos sobre el total cargado. No es una nota ni una predicción.
```

> ### C1 — ¿La aclaración alcanza?
>
> Es lo único que separa ese `26%` de una nota. **¿Alcanza, o un porcentaje al lado de una barra se
> lee como calificación por más aclaración que tenga abajo?**

> ### C2 ⭐ — Una entrega **insuficiente** cuenta como trabajada
>
> Si un estudiante entrega algo y la entrega no alcanza, **la barra igual avanza**. El argumento del
> equipo: la barra mide *que trabajaste*, no que lo hayas hecho bien; descontarla sería usarla como
> nota, y castigar dos veces el mismo intento.
>
> **¿Es correcto?** El riesgo que vemos es el opuesto: que alguien acumule cobertura sin aprender y
> la barra se lo oculte.

---

## Bloque D — El factor de estudio

El sistema propone **1,5 horas de estudio por cada hora de clase**, como piso. Lo decidió el Product
Owner y hoy es el número que multiplica todas las estimaciones.

> ### D1 — ¿Ese `1,5` tiene algún respaldo, o es una intuición razonable?
>
> No lo preguntamos para cambiarlo: preguntamos **para saber qué es**. Si es una intuición, se rotula
> como provisional igual que los seis valores de `§9` de la agenda anterior. Si hay literatura que
> diga otra cosa —o que diga que depende del tipo de materia—, cambia una fila de configuración.

---

## Bloque E — La mitad del motor que todavía no existe, y es tuya

El Product Owner describió el Personal Engine como *"el que sabe cuánto tardás en estudiar vos, **y
qué método te sirve más**"*. La primera mitad está construida (Bloque B). **La segunda no, y no se
puede empezar sin vos.**

Los datos ya se recogen y **nadie los lee**:

| Dato | Qué guarda hoy |
|---|---|
| `reflection.difficulty` | `más fácil` \| `esperado` \| `más difícil` |
| `reflection.result` | Texto libre de qué pasó |
| `reflection.quantity_without_help` / `quantity_total` | Cuánto pudo solo, sobre el total |

> ### E1 — ¿Qué se puede afirmar con eso, y qué no?
>
> Lo obvio sería inferir *"a esta persona le funciona la práctica y no el resumen"*. **Nos parece que
> es exactamente el salto que tu regla prohíbe**, y por eso no lo hicimos.
>
> **¿Hay algo que sí se pueda decir con estos tres datos?** Y si la respuesta es que no alcanzan,
> ¿qué habría que registrar además?

---

## El estado, para que sepas qué está en juego

⚠️ **Nada de esto toca a una persona real todavía.** No hay ningún estudiante real en el sistema, y
no lo habrá hasta que se cierre el gate de privacidad ([ADR-006](decisions.md#adr-006), todavía
`PROVISIONAL`). Todo corre sobre datos sintéticos.

**Lo que cuesta cambiar cada cosa, para que puedas decir que no sin culpa:**

| Si decís que… | El costo es |
|---|---|
| El déficit no se muestra así | Una frase de copy. Está en un solo archivo |
| El multiplicador tiene otro piso, techo o mínimo | Tres constantes. Ninguna está escrita en el código de la pantalla |
| El `1,5` es otro número | Una constante, versionada: **las estimaciones viejas no se reescriben** |
| Una entrega insuficiente no debería contar | Una lista de estados, en un archivo |
| El techo del multiplicador debe llamar a una persona | Una regla más en el circuito que ya existe |

**Lo único caro sería descubrir esto con estudiantes reales usándolo.** Por eso se pregunta ahora.

### Cómo nos sirve la respuesta

El mismo formato de la agenda anterior, y por el mismo motivo —que la regla se pueda programar sin
interpretarla, y **revisar después sin volver a discutir todo**:

| Campo | Qué es |
|---|---|
| **Decisión** | Qué se hace |
| **Fundamento** | Por qué |
| **Regla operativa** | Cómo se traduce a algo que el sistema pueda hacer |
| **Excepciones** | Cuándo no aplica |
| **Señal observable** | Qué tiene que ver el sistema para saber que aplica |
| **Momento de intervención humana** | Cuándo deja de ser automático |
| **Responsable** | Quién decide en ese momento |
| **Condición para revisar la regla** | Qué tendría que pasar para volver a mirarla |

Y si alguna pregunta está mal planteada, **decilo en vez de contestarla**: nos pasó ya una vez esta
semana —dimos por bueno derivar la disponibilidad de lo que el estudiante había cumplido, y era
confundir capacidad con conducta— y lo caro no fue corregirlo, fue no haberlo visto antes.
