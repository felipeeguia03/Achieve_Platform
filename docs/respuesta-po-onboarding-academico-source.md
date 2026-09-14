# Respuesta del Product Owner — onboarding académico · fuente literal

**Fecha:** 13 de septiembre de 2026
**De:** Product Owner
**Responde a:** el diagnóstico del *Master prompt — onboarding académico inteligente* (analítico,
entrevista adaptativa, Personal Engine, cursado actual, cátedras y horarios), §I *Preguntas
bloqueantes*.
**Decisiones que registra:** [ADR-105](decisions.md#adr-105), [ADR-106](decisions.md#adr-106),
[ADR-107](decisions.md#adr-107).

> ⚠️ **Este documento no se edita.** Es la transcripción de lo que el owner contestó. Si una
> paráfrasis en `decisions.md` o en el código discrepa, **gana esto**.

---

## Las cuatro preguntas, como se plantearon

1. **Archivos compartidos con la sesión de Focus.** ¿Se editan en `feat/paralelo` asumiendo el
   conflicto al mergear, o se espera a que Focus entre?
2. **Dónde van comisión y horarios** (choque ADR-061 ↔ ADR-073). **(a)** enmendar ADR-061 y aceptar un
   quinto paso, antes de disponibilidad *(recomendada)* · **(b)** dentro de `/alta/materias` · **(c)**
   dentro del paso de disponibilidad.
3. **Analítico:** ¿se autoriza abrir el dominio «historia académica» como ADR, sólo sintético, y que
   viva **después de HOY y opcional**, en vez de dentro del alta?
4. **Preguntas y perfil:** ¿se llevan a la psicopedagoga (con `C01-043`) antes de diseñarlos? Hoy D1 y
   su fuente literal impiden los disparadores y el resumen tal como vienen en el pedido.

## La respuesta, literal

> 1- ya termino la rama que hacia lo de focus, anda a resolver
> 2-a
> 3-autorizo,
> 4-no se llevan, que no se impida nada
> hace lo recomendado y segui

---

## Cómo se lee cada una — sin interpretarla más allá de lo escrito

| # | Lo que dijo | Lo que autoriza | Lo que **no** toca |
|---|---|---|---|
| 1 | *"ya termino la rama que hacia lo de focus, anda a resolver"* | Integrar la rama de Focus en `feat/paralelo` y resolver sus conflictos | Push, merge a `main`, deploy |
| 2 | *"a"* | **Enmendar ADR-061**: el alta pasa a **cinco pasos**, con comisión y horarios **antes** de disponibilidad | ADR-062 y ADR-063, que siguen enteros |
| 3 | *"autorizo"* | Abrir el dominio del analítico **sintético, después de HOY y opcional** — la opción recomendada | [ADR-006](decisions.md#adr-006): **sigue el bloqueo absoluto sobre datos reales** |
| 4 | *"no se llevan, que no se impida nada"* | Construir preguntas adaptativas e hipótesis de perfil **sin esperar a la psicopedagoga**, y **sin que D1 ni los umbrales 3/6 las bloqueen** | ADR-006, ni el copy prohibido de `product.md` §13 |
| — | *"hace lo recomendado y segui"* | Ejecutar el plan por cortes del diagnóstico | Push, merge o deploy |

⚠️ **Lo que la respuesta 4 no dice.** No dice que se pueda **etiquetar** a una persona ni afirmar
causalidad: dice que la validación profesional **no bloquea**. Por eso las hipótesis se construyen, y
se redactan como lo que son —lo que el estudiante declaró y lo que muestra su analítico—, que no
impide nada.
