# Gimnasia cognitiva — fuente literal del pedido del owner

**Recibido:** 13 de septiembre de 2026, en la sesión de Claude Code que construyó
[ADR-102](decisions.md#adr-102).
**Qué es este documento:** **extractos literales** del pedido (*"Implementación integral del MVP —
Gimnasia cognitiva: categoría Memoria"*). No se corrigen ni se parafrasean: si el ADR y este texto
discrepan, **gana este texto** (el mismo criterio que `respuesta-po-*-source.md`).

> ⚠️ **El mensaje llegó cortado** en el §23, *"Criterios de aceptación funcional"*, en la frase
> *"1. Un estudiante autenticado puede abrir Gimnas"*. Lo que seguía no se recibió y **no se
> reconstruye**: los criterios que el ADR usa salen de los §1–§22.

Se transcriben los pasajes que fijan reglas. Las listas largas de estados, tests y accesibilidad
(§18, §19, §22) se cumplen desde el ADR y el plan, y no se repiten acá.

---

## §1 · Principio rector

> El estudiante no juega para escapar del estudio. Juega brevemente para entrenar una habilidad y
> luego vuelve a aplicarla en su próxima acción académica.

## §3 · Alcance cerrado del MVP — fuera de alcance (extracto)

> No implementar: Atención. Control ejecutivo. Razonamiento. Lenguaje. Juego de sinónimos. Rankings
> globales. Competencias entre alumnos. Multijugador. Monedas. Tienda. Cofres. Vidas comprables.
> Avatares. Premios aleatorios. Notificaciones. Integración con CRM. Panel para operadores. Panel
> institucional nuevo. Diagnósticos cognitivos. Puntaje de inteligencia. Edad cerebral. Perfil
> neuropsicológico. Tratamiento clínico. Nuevas llamadas a OpenAI, Claude u otro proveedor.
> Corrección de respuestas abiertas exclusivamente mediante IA. Generación automática de contenidos
> académicos no validada. Nuevos mecanismos de subida o procesamiento de archivos. Cambios en la
> precedencia del Academic Decision Engine. Cambios ajenos a esta funcionalidad. Push, merge o
> despliegue.
>
> No muestres pestañas deshabilitadas de categorías futuras. En el MVP sólo existe Memoria.

## §4 · Nombre, navegación y copy principal

> Usar en el menú el nombre corto: **Gimnasia**
>
> Usar dentro de la pantalla: **Gimnasia cognitiva**
>
> Título principal: **Entrená cómo estudiás**
>
> Subtítulo: **Juegos breves para practicar memoria y aplicar lo aprendido en tus materias.**
>
> Al abrir Gimnasia debe poder aparecer una pestaña equivalente a: **Gimnasia · Memoria**

## §5.2 · Rutina recomendada (extracto)

> No inventar el nombre de una materia si no existe una materia válida asociada.
>
> Si no hay contenidos académicos disponibles:
> * la rutina debe incluir los dos ejercicios cognitivos genéricos
> * Recuerdo real debe utilizar contenido universal validado de Achieve si existe
> * si tampoco existe ese contenido, mostrar Recuerdo real en estado de preparación, sin fabricar
>   preguntas

## §5.3 · Progreso breve

> No mostrar:
> * “Tu memoria aumentó 23%”
> * “Tu inteligencia es alta”
> * “Tenés déficit de atención”
> * “Tu capacidad cognitiva es nivel 8”
> * comparaciones clínicas o normativas
>
> Cada nivel pertenece al juego, no a la persona.
>
> Correcto:
>
> > Nivel 6 en Cadena inversa
>
> Incorrecto:
>
> > Tu memoria es nivel 6

## §5.6 · Aviso responsable

> Las marcas describen tu rendimiento en cada ejercicio. No miden inteligencia ni constituyen un
> diagnóstico.

## §6 · Rutina diaria (extracto)

> La rutina completa debe durar aproximadamente entre 6 y 10 minutos.
>
> CTA principal: **Volver a mi próxima acción**
>
> CTA secundaria: **Ver todos los juegos**
>
> El CTA principal debe retornar al estudiante a HOY o a la próxima acción académica usando el
> mecanismo existente.
>
> No inventar una próxima acción en el frontend.

## §7 · Cuadrícula fugaz — progresión MVP

> * respuesta completamente correcta: aumenta la longitud en 1
> * respuesta incorrecta: mantiene la longitud y suma un error
> * dos errores en la sesión: termina la partida
> * máximo de 10 rondas
> * al superar secuencias de longitud 6, usar cuadrícula 4×4
> * no usar cuadrículas mayores en el MVP
>
> Por ejemplo:
> * cada ronda correcta: `longitud × 100`
> * bonificación menor por racha de rondas correctas
> * una respuesta rápida nunca compensa una respuesta incorrecta

## §8 · Cadena inversa — reglas y nivel

> * utilizar sólo dígitos
> * cadena inicial: 3 dígitos
> * máximo MVP: 12 dígitos
> * cinco pruebas por sesión
> * no permitir pegar contenido en el campo de respuesta si eso invalida la mecánica
> * normalizar espacios y separadores antes de corregir
>
> Regla determinística sugerida:
> * dos respuestas correctas en la longitud actual habilitan probar la siguiente
> * dos errores consecutivos reducen temporalmente la dificultad de la sesión
> * el nivel persistido no debe caer por una única mala sesión
> * guardar mejor cadena histórica y nivel actual por separado

## §9 · Recuerdo real — corrección y repaso

> No utilizar una IA como juez.
>
> * **No la recordé**
> * **La recordé parcialmente**
> * **La recordé**
> * **Me resultó fácil**
>
> No marcar como correcta una respuesta abierta basándose solamente en similitud textual.
>
> * No la recordé: vuelve en la misma sesión si hay espacio y queda pendiente para el día siguiente.
> * Parcialmente: vuelve al día siguiente.
> * La recordé: vuelve en 3 días.
> * Me resultó fácil: vuelve en 7 días.
>
> No implementar SM-2 completo ni un sistema predictivo opaco en esta versión.
>
> No mostrar una métrica de retención a 24 horas hasta disponer de intentos separados por al menos
> ese intervalo.

## §12 · Integración con Academic Engine (extracto)

> No debe:
> * convertir Gimnasia en una obligación
> * reemplazar una próxima acción académica
> * marcar una materia como avanzada
> * validar evidencia
> * completar compromisos
> * alterar la precedencia de HOY
> * registrar tiempo de juego como tiempo de estudio académico efectivo sin una decisión previa

## §13 · Relación con HOY (extracto)

> Sólo hacerlo si existe una integración natural y no altera contratos.

## §14 · Modelo de dominio (extracto)

> No crear un único campo ambiguo como `cognitive_score`.
>
> No mezclar:
> * puntuación arcade
> * nivel
> * retención académica
> * constancia
> * duración
>
> Son métricas distintas.
