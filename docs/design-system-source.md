Manual de diseño transferible
Principios extraídos de un producto B2B experto, reescritos para aplicarse a cualquier dominio

Versión: 1.0
Origen: ingeniería inversa de un software legal de propiedad intelectual cuya calidad percibida fue auditada por un panel de crítica de siete perfiles.
Estado del origen: irrelevante. Todo lo que sigue está despojado del dominio original. Si en algún punto el manual huele a "abogados", es un error del manual, no una limitación del principio.

***
0. CÓMO USAR ESTE DOCUMENTO

0.1 Si sos una IA leyendo esto

Este documento es normativo, no descriptivo. No lo trates como inspiración ni como referencia de estilo visual.

Reglas de lectura:

Cada principio tiene un identificador estable (P-01, A-03, T-05). Citalos por ID cuando justifiques una decisión.
La fuerza de cada regla está declarada con tres niveles:
DEBE — violarlo es un defecto. Si el usuario te pide algo que lo viola, señalá el conflicto antes de ejecutarlo.
DEBERÍA — violarlo requiere una justificación explícita escrita en la entrega.
PUEDE — opcional, depende del contexto.
Antes de aplicar cualquier principio, completá la Fase de traducción al dominio (sección 1). Sin ese mapeo, este manual produce cargo cult: pantallas que se parecen al original y no resuelven nada.
Cuando dos principios entren en conflicto, resolvé por este orden de precedencia:
   (1) costo de error irreversible → (2) verdad sobre el dato → (3) comprensión del usuario novato → (4) velocidad del usuario experto → (5) consistencia interna → (6) economía visual.
Prohibido inventar contenido de dominio. Si un principio te pide escribir la regla del negocio al lado de un control y no conocés esa regla, preguntala. No la aproximes.
Al final de cada entrega, corré la auditoría de conformidad (sección 7) y reportá los ítems que fallan. No la escondas.

0.2 Si sos una persona leyendo esto

Las secciones 1 y 7 son las que se usan a diario. La 2 es la doctrina. La 6 son los errores que el producto original comete y que no hay que copiar por admiración.

0.3 Advertencia sobre el origen

El material fuente fueron capturas estáticas, en buena parte de pantallas vacías o en estado de carga. Los principios que siguen están validados por coherencia interna y por argumentación, no por telemetría ni por pruebas con usuarios. Trátalos como hipótesis fuertes, no como hechos. Cada principio incluye un test que permite falsarlo en tu propio producto.

***
1. FASE DE TRADUCCIÓN AL DOMINIO

DEBE completarse antes de aplicar el resto del manual. Si sos una IA y no tenés estas respuestas, pedilas.

#	Pregunta	Para qué sirve
D1	¿Cuál es la acción irreversible de tu producto? La que, si sale mal, no se arregla.	Define P-05, P-10, P-11
D2	¿Cuál es el reloj? Qué se pierde por no actuar a tiempo, y en qué unidad se mide.	Define el orden por defecto de toda lista
D3	¿Existe una fuente externa autoritativa con la que tus datos pueden discrepar?	Activa o desactiva P-08
D4	¿Cuáles son los 10 términos del oficio que tu usuario ya usa y que un producto mediocre traduciría a lenguaje llano?	Define P-02 y el glosario
D5	¿Qué magnitudes de máquina le mostrás al usuario (scores, porcentajes, rankings, confianza del modelo)?	Define P-03
D6	¿Cuáles son los 3 o 4 eventos que merecen color?	Define P-06 y la paleta entera
D7	¿Cuál es la decisión repetitiva que tu usuario toma decenas de veces por semana?	Define P-10
D8	¿Qué default tomaría el mejor profesional de tu rubro, si nadie lo estuviera mirando?	Define P-04
D9	¿Cuál es la unidad de trabajo: un registro, una comparación entre dos, una cola, un documento?	Define el layout base
D10	¿Qué es lo que hoy tu usuario tiene que saber de memoria para no equivocarse?	Define P-01: eso va escrito en pantalla
	> Regla de oro de la traducción: el producto original no es bueno porque sea gris y espacioso. Es bueno porque contestó estas diez preguntas antes de dibujar. Si copiás la estética sin contestarlas, vas a producir un producto vacío que parece caro.

***
2. PRINCIPIOS

Formato fijo de cada principio, para que sea parseable:
REGLA · FUERZA · PROBLEMA · IMPLEMENTACIÓN · EJEMPLOS · LÍMITES · VALIDACIÓN DEL PANEL · DISENSO · TEST

***
P-01 — La interfaz explica la regla del negocio, no la función del control

REGLA: Al lado de todo control cuyo comportamiento derive de una regla del dominio, escribí esa regla en una frase corta, en el idioma del usuario. No expliques qué hace el botón: explicá qué es verdad en el mundo.
FUERZA: DEBE

PROBLEMA: En productos expertos, el error caro casi nunca es "no encontré el botón". Es "no entendí la regla y actué mal creyendo que actuaba bien". Ese error no lo resuelve la usabilidad; lo resuelve el contenido.

IMPLEMENTACIÓN:
Listá todos los controles cuyo resultado sorprendería a alguien que recién llega.
Para cada uno, escribí una frase de entre 5 y 25 palabras que enuncie la regla.
Ponela pegada al control, no en un tooltip, no en un modal de ayuda, no en la documentación.
Escribila en presente y en la lógica del dominio, no del sistema.

EJEMPLOS (genéricos, mapeá al tuyo):
✅ Filtro de categorías · sin selección = todas las categorías
❌ Filtro de categorías (?) con un tooltip que dice "seleccioná una o más categorías"
✅ Lo que edites acá queda marcado como cambio manual: la próxima sincronización no lo pisa.
❌ Los datos se sincronizan periódicamente.
✅ El tipo se deduce del prefijo del identificador, por eso no se puede editar.
❌ Campo gris deshabilitado, sin explicación.
✅ Oculta los resultados con menos de 30% de puntaje del motor.
❌ Umbral de relevancia

LÍMITES: No aplicar a controles universales (guardar, cerrar, buscar). Explicar lo obvio degrada la señal de todas las demás explicaciones.

VALIDACIÓN DEL PANEL:
UX Writer: es el principio que más calidad percibida produce por unidad de esfuerzo. Cualquiera copia una tipografía; casi nadie escribe la regla.
Investigadora HCI: mueve carga de la memoria de largo plazo a la pantalla. El experto la saltea con la mirada en ~200 ms; el novato la lee una vez y aprende el dominio, no la app.
Arquitecta de IA: funciona como red de seguridad de una estructura imperfecta, y ahí está el riesgo — puede usarse para tapar una IA mal resuelta con párrafos explicativos.
Usuario experto: si la frase es correcta, subo la confianza en todo el producto. Si una sola está desactualizada, la bajo en todo el producto.

DISENSO REGISTRADO: Crítico adversario — es deuda de contenido sin sistema de mantenimiento. Cambia una regla del negocio y hay N frases desperdigadas que ahora mienten, y ningún test las detecta. Mitigación obligatoria: llevá las frases de regla en un archivo de contenido único, con ID, no hardcodeadas en componentes.

TEST: Tomá a alguien que conoce el dominio pero no el producto. Que use una pantalla sin ayuda. Cada pregunta que haga sobre el negocio (no sobre el producto) es una frase que falta.

***
P-02 — Conservá el vocabulario del oficio intacto, y adosale la glosa

REGLA: No traduzcas los términos técnicos del dominio a lenguaje llano. Usalos exactos, y pegales una explicación corta en el punto de uso.
FUERZA: DEBE

PROBLEMA: Traducir el vocabulario experto a "lenguaje simple" produce dos víctimas: el experto pierde precisión y confianza (el producto no habla su idioma, entonces probablemente no entiende su problema), y el novato aprende un vocabulario falso que no le sirve para hablar con sus colegas.

IMPLEMENTACIÓN:
El término técnico es el label. La glosa es el texto de apoyo. Nunca al revés.
La glosa se escribe una sola vez por término y se reutiliza; no la reescribas por pantalla.
Si un término tiene un formato de dato asociado, mostralo como ejemplo: ej. AB-1042 o un número de expediente.

EJEMPLOS:
✅ Búsqueda fonética + Encuentra nombres que suenan parecido aunque se escriban distinto.
❌ Búsqueda por sonido
✅ Cohorte de retención + El grupo de usuarios que entró en el mismo mes.
❌ Grupo de gente

LÍMITES: Solo válido si tu usuario es un experto certificado o practicante del oficio. En consumo masivo, esto es exclusión, no respeto. Verificá D4 antes de aplicarlo.

VALIDACIÓN DEL PANEL:
Usuario experto: es lo primero que evalúo, sin darme cuenta. Si el producto usa mal una palabra de mi oficio, asumo que quien lo hizo no entendió mi trabajo.
UX Writer: este principio y P-01 son el mismo movimiento: el producto sube al usuario en vez de bajar el dominio.
Investigadora HCI: el término técnico es un ancla de recuperación en la memoria del experto. Renombrarlo lo obliga a mantener dos vocabularios en paralelo — costo puro.

DISENSO: Arquitecta de IA — el vocabulario del oficio suele ser ambiguo o inconsistente en la práctica real (la misma palabra significa cosas distintas en dos estudios). Conservarlo "intacto" puede importar una ambigüedad al producto. Mitigación: cuando el término del oficio es ambiguo, elegí uno y definilo en la glosa; no inventes uno nuevo.

TEST: Grabá a dos usuarios hablando entre ellos del trabajo. Contá cuántas palabras que usan no existen en tu producto.

***
P-03 — Traducí las magnitudes de máquina a escala de juicio humano

REGLA: Todo número que salga de un modelo, un motor o un algoritmo DEBE mostrarse anclado a una escala cualitativa que el usuario ya tiene en la cabeza. El número puede quedar; la decisión se toma sobre la escala.
FUERZA: DEBE

PROBLEMA: Un 0.73 de similitud, un score 82 o un 85% de confianza no significan nada para quien no entrenó el modelo. Pedirle al usuario que calibre un umbral en unidades de máquina es transferirle un trabajo que no puede hacer.

IMPLEMENTACIÓN:
Definí 3 a 5 anclas cualitativas en el vocabulario del oficio (Todo / Débil / Fuerte / Muy fuerte, Riesgo bajo / medio / alto, Descartable / Revisar / Urgente).
Mostrá el número y el ancla, simultáneamente. El número da precisión, el ancla da significado.
Marcá en negrita o resaltá el ancla activa según la posición actual.
Debajo, una frase que diga qué hace el control (P-01): Oculta los resultados con menos de 30% de puntaje del motor.

EJEMPLOS:
✅ Slider con desde 30% arriba, marcas Todo · Débil · Fuerte · Muy fuerte abajo, ancla activa en negrita.
❌ Slider 0 ————•———— 100
❌ Solo Alta / Media / Baja sin el número (el experto pierde la capacidad de afinar).

LÍMITES: Si tu magnitud tiene unidad natural conocida por el usuario (pesos, días, kilómetros), no la anclees: ya es humana.

VALIDACIÓN DEL PANEL:
Investigadora HCI: reconocimiento en lugar de recuerdo, y calibración de expectativa antes de ver resultados, no después. Reduce el ciclo de prueba y error de N iteraciones a una.
Usuario experto: yo no decido con un score. Decido con "cuánto parecido me importa". La escala me deja decidir en mi idioma.
Diseñador de interacción: el ancla también funciona como feedback continuo mientras arrastro; sin ella el slider es un control ciego.

DISENSO: Crítico adversario — cuatro anclas sobre un rango continuo hacen creer que hay cuatro modos discretos, y el usuario deja de mover el control entre anclas. Se pierde resolución real. Mitigación: las anclas son marcas de referencia, no snaps. Nunca hagas que el control se imante a ellas.

TEST: Preguntale a cinco usuarios qué significa el número crudo. Si más de uno duda, el ancla es obligatoria.

***
P-04 — Los defaults toman partido profesional

REGLA: El valor por defecto DEBE ser el que elegiría el mejor profesional del rubro, no el valor neutro ni el que simplifica la implementación. Y DEBE ser reversible en un click, visible sin abrir configuración.
FUERZA: DEBE

PROBLEMA: El default neutro parece humilde y en realidad es abandono: le pasa al usuario una decisión que el equipo de producto podría haber tomado con mejor información.

IMPLEMENTACIÓN:
Para cada opción binaria, respondé D8: ¿qué haría el mejor practicante?
Poné ese valor por defecto.
Dejá el control visible en la misma pantalla, no en preferencias.
Si el default es no obvio, explicá por qué con una frase (P-01).

EJEMPLOS:
✅ Incluir registros vencidos — apagado (un registro vencido no sirve para fundar la acción).
✅ Incluir categorías relacionadas — encendido (el riesgo real cruza categorías).
✅ Lista ordenada por vencimiento, no por fecha de creación.
✅ Ítems cerrados ocultos, con Mostrar 5 cerradas a la vista.
❌ Todos los filtros apagados "para no sesgar".

LÍMITES: Requiere que exista una práctica profesional consensuada. Donde no la hay, el default opinado es arbitrariedad disfrazada de criterio.

VALIDACIÓN DEL PANEL:
Usuario experto: que el producto ya haya tomado las decisiones aburridas de la manera correcta es la señal más fuerte de que quien lo hizo conoce el trabajo.
Investigadora HCI: cada default correcto es una decisión menos por sesión. En una tarea que se repite 40 veces por día, eso es el diseño entero.

DISENSO: Crítico adversario — un default opinado que está mal para un cliente particular es peor que ninguno, porque es invisible: nadie revisa lo que ya venía puesto. Mitigación obligatoria: cualquier filtro activo por defecto tiene que ser visible en la pantalla de resultados, no solo en el formulario. Un resultado filtrado sin indicación del filtro es un bug de confianza.

TEST: Mostrale a un usuario nuevo la pantalla con los defaults y preguntale qué haría distinto. Si cambia más del 30%, tus defaults están mal.

***
P-05 — Ordená por costo de no actuar

REGLA: El orden por defecto de toda lista de trabajo DEBE ser el de irreversibilidad decreciente: primero lo que se pierde antes. No por importancia declarada, no por fecha de creación, no por score.
FUERZA: DEBE

PROBLEMA: El orden por defecto es la priorización que el producto le impone al usuario. Si ordenás por fecha de creación, estás diciendo "lo viejo primero", que casi nunca es cierto.

IMPLEMENTACIÓN:
Respondé D2 (¿cuál es el reloj?).
Ordená por eso.
Mostrá la fecha absoluta y la distancia relativa juntas: Cierra el 28 de agosto + Queda 1 día. Una sirve para agendar, la otra para sentir la urgencia. No son redundantes.
La distancia relativa lleva color cuando entra en zona crítica (P-06).

EJEMPLOS:
✅ Vence el 3 de marzo · Quedan 2 días en naranja.
❌ Actualizado hace 3 días como único dato temporal.
❌ Ordenar por severidad cuando lo severo no vence y lo leve vence mañana.

LÍMITES: Si tu producto no tiene reloj (D2 sin respuesta), este principio no aplica. Ordená por valor y decilo explícitamente.

VALIDACIÓN DEL PANEL:
Arquitecta de IA: alinea el orden de lectura con el orden de consecuencia. Es la decisión estructural más barata y de mayor impacto de todo el manual.
Diseñadora visual: la doble codificación temporal (absoluta + relativa) justifica gastar dos líneas donde parecía alcanzar una.

DISENSO: Usuario experto — el orden por vencimiento me esconde el conjunto. Necesito saber cuántos vencen esta semana antes de abrir el primero. Mitigación obligatoria: toda lista ordenada por reloj necesita un resumen agregado arriba (3 vencen esta semana · 1 mañana). El orden resuelve el recorrido, no la planificación.

TEST: Cronometrá cuánto tarda un usuario en identificar el ítem más urgente. Si abre más de uno, el orden o el resumen fallan.

***
P-06 — El color se raciona a eventos semánticos

REGLA: La base DEBE ser acromática (grises + negro/blanco). El color se reserva para 3 o 4 significados declarados de antemano y se prohíbe en todo lo demás, incluida la marca propia.
FUERZA: DEBE

PROBLEMA: Cuando todo tiene color, el color no informa. La calma visual de los buenos productos expertos no es estética: es contraste guardado para la alarma.

IMPLEMENTACIÓN — plantilla de tokens semánticos (mapeá tus hex, no copies los del original):

base:
  fondo_app:        gris muy claro
  superficie:       blanco
  texto_primario:   casi negro
  texto_secundario: gris medio
  texto_terciario:  gris claro   # solo metadatos, nunca información necesaria
  borde:            gris muy claro
  accion_primaria:  negro

semanticos:   # máximo 4. Definí el evento ANTES del color.
  riesgo:       "estado grave o vencido"        # rosa / vino
  amenaza:      "el objeto externo que hay que mirar"  # magenta
  urgencia:     "el reloj corriendo, algo falta"  # naranja
  exito:        "la acción se completó"         # verde
prohibido:
  - color en la marca propia dentro de la app
  - color decorativo en ilustraciones o encabezados
  - gradientes
  - un quinto color semántico sin borrar uno existente

REGLA COMPLEMENTARIA (DEBE): ningún estado puede comunicarse solo por color. Siempre color + palabra (Alta, Vencida, Queda 1 día). El color acelera la detección; la palabra la confirma.

EJEMPLOS:
✅ Una pantalla entera en grises donde lo único saturado es la imagen del objeto que hay que evaluar.
✅ El verde de éxito aparece una vez en todo el producto.
❌ Botones primarios de color de marca en cada pantalla, compitiendo con las alertas.

VALIDACIÓN DEL PANEL:
Diseñadora visual: la escasez es lo que produce la señal. Un color usado dos veces vale más que una paleta de doce.
Investigadora HCI: el color saturado sobre fondo acromático se detecta en visión periférica sin leer. Eso es literalmente ganar tiempo de reacción.

DISENSO: Crítico adversario — con la base acromática cargando toda la jerarquía, el gris termina significando dos cosas a la vez: "secundario" y "deshabilitado". El producto original tiene exactamente ese bug (un botón de acción gris que no se sabe si está inhabilitado). Mitigación obligatoria: definí un tratamiento distinto de gris para deshabilitado (opacidad + cursor + aria-disabled), nunca solo un tono más claro.
Accesibilidad: medí todos los pares contra WCAG AA. La estética gris-sobre-gris falla contraste con una facilidad alarmante en textos de apoyo y placeholders.

TEST: Imprimí una pantalla en blanco y negro. Si perdés información, violaste la regla complementaria.

***
P-07 — Ningún atajo elimina su camino visible

REGLA: Toda vía rápida para expertos DEBE convivir con su vía visible para novatos, en el mismo lugar de la pantalla, no en un menú de preferencias ni en la documentación.
FUERZA: DEBE

PROBLEMA: Este es el mecanismo exacto que hace que un producto sea "simple pero no castigue al que sabe". No son dos modos. Es una sola interfaz donde ambos caminos son visibles y ninguno paga por el otro.

IMPLEMENTACIÓN — patrones concretos:
Vía experta	Vía visible	Cómo conviven
Atajo de teclado	Botón	El atajo se imprime dentro del botón (⌘K dentro del campo de búsqueda)
Pegar / arrastrar	Click para elegir archivo	Las tres se enuncian en una línea dentro de la zona: Arrastrá acá, pegá (Ctrl+V) o hacé clic
Buscar por texto	Elegir de una grilla	Buscador encima de la grilla, con ejemplo en el placeholder
Selección masiva	Selección uno a uno	Acciones Todos / Ninguno / Invertir al lado del título del grupo
Entrada libre desambiguada	Selector de tipo	Un solo campo que acepta todo + frase que lo promete: No hace falta decir de qué se trata.
	LÍMITES: Cuesta superficie de pantalla. Si la pantalla ya está saturada, el problema es de arquitectura (P-01 no arregla eso), no de atajos.

VALIDACIÓN DEL PANEL:
Investigadora HCI: el atajo impreso en el control es aprendizaje por exposición: el novato lo ve cien veces antes de usarlo, y el día que lo necesita ya lo sabe. Un atajo escondido en la documentación no se aprende nunca.
Diseñador de interacción: declarar las tres vías de entrada en una línea es documentación en el punto de uso, con costo cero de descubrimiento.

DISENSO: Diseñadora visual — cada vía duplicada es superficie. El resultado es un formulario que muestra tres modos de búsqueda, dos vías de entrada y 45 chips antes de que exista un solo resultado. Mitigación: el principio aplica a acciones, no a opciones. Duplicar caminos hacia la misma acción está bien; multiplicar opciones no.

TEST: Pedile a un usuario experto que use el producto solo con mouse, y a uno nuevo que lo use sin ayuda. Si alguno de los dos se traba, falló.

***
P-08 — La procedencia del dato es parte del dato

REGLA: Si tu producto sincroniza contra una fuente externa autoritativa, nunca fusiones las dos verdades en un número. Mostrá ambas, y marcá qué tocó una persona.
FUERZA: DEBE (si D3 es afirmativa) · N/A (si no)

PROBLEMA: En productos donde el dato tiene consecuencias, no saber de dónde viene un dato es peor que no tenerlo. Un valor fusionado y silencioso es una mentira cómoda.

IMPLEMENTACIÓN:
Contadores duales visibles: 10 gestionadas · 10 en el registro, con íconos distintos. Cuando coinciden parece gratuito; el día que sean 10 y 7, ese par de números vale más que la pantalla entera.
Campo ORIGEN explícito por registro.
Toda edición local se marca y DEBE documentarse su comportamiento frente a la sincronización: Lo que corrijas acá queda marcado como cambio manual: una actualización de la fuente no lo pisa.

EJEMPLOS:
✅ 12 en tu sistema · 9 confirmados por el proveedor
❌ 12 registros
❌ Sobrescribir silenciosamente ediciones manuales en la próxima sincronización.

VALIDACIÓN DEL PANEL:
Arquitecta de IA: mantener dos fuentes de verdad visibles es más honesto y más difícil que fusionarlas. Es la decisión estructural que más confianza produce.
Usuario experto: si el sistema me oculta que discrepa con la fuente oficial, todo el resto del producto pasa a ser sospechoso.

DISENSO GRAVE: Crítico adversario — el producto original usa este principio como coartada para no limpiar los datos. Muestra texto roto de la fuente (palabras concatenadas sin separador) y lo justifica como fidelidad. Eso no es procedencia, es un bug de parseo con buena prensa. Ver A-01. La regla correcta es: fidelidad en el valor, calidad en la presentación. Nunca muestres un dato ilegible y le llames transparencia.

TEST: Cargá 50 registros sin curar desde la fuente real y mirá la tabla. Todo lo que sea ilegible es tuyo, no de la fuente.

***
P-09 — La ausencia se tipa

REGLA: Un valor vacío DEBE verse distinto de un valor que todavía no cargó, y ambos distintos de cero.
FUERZA: DEBE

IMPLEMENTACIÓN:
Estado	Tratamiento
No hay dato	Em-dash — en gris
No cargó todavía	Esqueleto con la forma del contenido (P-12)
Hay dato pero está sin asignar	Texto en itálica gris: Sin responsable
Cero real	0 en el mismo estilo que cualquier número
Falta y bloquea	Banner de urgencia + acción directa: Poder — falta + Cargar
	VALIDACIÓN DEL PANEL:
Investigadora HCI: el usuario resuelve cada uno de estos estados de forma distinta. Colapsarlos en una celda en blanco lo obliga a averiguar cuál es, y esa averiguación es pura fricción.
UX Writer: Sin responsable en itálica es una ausencia nombrada. Una celda vacía es un misterio.

DISENSO: Diseñadora visual — cuatro tratamientos distintos de vacío en una tabla densa producen ruido tipográfico. Mitigación: el em-dash y la itálica son suficientes en tablas; los banners solo para ausencias que bloquean.

TEST: Mostrale una tabla con vacíos a un usuario y preguntale, celda por celda, qué significa. Si duda, no está tipada.

***
P-10 — Una decisión por vez, con el reloj a la vista

REGLA: Cuando la tarea principal es una decisión repetitiva (D7), convertí la lista en una cola numerada con avance explícito, y mantené el reloj visible junto a la decisión.
FUERZA: DEBERÍA

IMPLEMENTACIÓN:
Contador de posición: 1 de 17, con flechas anterior/siguiente.
El control de retroceso se atenúa en el primero: el estado del control informa la posición.
Layout en espejo cuando la decisión es una comparación: mismos slots, mismo orden, en ambos lados, para poder comparar por barrido vertical sin releer los labels.
Los desenlaces posibles se nombran explícitamente y son pocos (idealmente dos).
El reloj está en la misma pantalla que la acción, no en la lista.

EJEMPLOS:
✅ 1 de 17 + Queda 1 día de plazo en la misma vista que los botones de resolución.
❌ Abrir cada ítem en una pantalla nueva y volver a la lista cada vez.

VALIDACIÓN DEL PANEL:
Investigadora HCI: convierte un problema de priorización (17 ítems compitiendo) en 17 decisiones binarias secuenciales. Baja drásticamente la carga.
Diseñador de interacción: el contador también es una promesa de progreso: sé cuánto falta.

DISENSO: Usuario experto — la vista de a uno me esconde el conjunto. Es la misma objeción de P-05 y se resuelve igual: resumen agregado en la lista.
Crítico adversario: si el contador no decrece al resolver, la cola miente. Requisito: al resolver, el total baja y el avance es automático, con posibilidad de deshacer (P-11).

TEST: Que un usuario resuelva diez ítems seguidos. Contá clicks fuera de la cola. Deberían ser cero.

***
P-11 — Confirmación única, acuse persistente, deshacer real

REGLA: Una decisión se confirma una sola vez, por un solo mecanismo. El resultado se acusa de forma visible y persistente. Toda acción irreversible (D1) DEBE tener deshacer o, si es imposible, una confirmación que enuncie la consecuencia.
FUERZA: DEBE

IMPLEMENTACIÓN:
Resumen antes de ejecutar: mostrá en texto plano lo que va a pasar, redactado como el sistema lo va a registrar, no como el usuario lo dijo.
Dos salidas: Confirmar y Corregir. Nada más.
Un solo pedido de confirmación. Si un widget pide la decisión, ningún otro elemento la vuelve a pedir. Ver A-02.
Acuse persistente: un chip o línea que queda en pantalla (✓ Enviado), no un toast que desaparece.
Reapertura: después del acuse, ofrecé el siguiente paso (¿Necesitás algo más?).

VALIDACIÓN DEL PANEL:
Diseñador de interacción: el acuse persistente es el eslabón que casi todos los flujos se saltean, y es el que produce la sensación de que el sistema es confiable.
Usuario experto: si la acción es irreversible y no hay deshacer, quiero ver la consecuencia escrita antes de tocar el botón.

DISENSO: Crítico adversario — el producto original aplica esto con rigor en el canal de feedback (lo barato) y no hay evidencia de que lo aplique en la acción irreversible del negocio (lo caro). Es un patrón de superficie hasta que se demuestre lo contrario. Requisito de conformidad: auditá primero la acción de D1, después el resto.

TEST: Ejecutá la acción irreversible y contá los segundos hasta poder deshacerla. Si es infinito, tiene que haber confirmación con consecuencia enunciada.

***
P-12 — Los estados de carga tienen la forma del contenido real

REGLA: Los esqueletos de carga DEBEN reproducir la geometría exacta del contenido que van a reemplazar: cantidad de bloques, líneas, miniaturas y acciones.
FUERZA: DEBERÍA

PROBLEMA: Un spinner genérico no reserva layout: al llegar el contenido, todo salta y el usuario pierde el punto de fijación. Un esqueleto fiel elimina el salto y además enseña la estructura antes de que llegue el dato.

IMPLEMENTACIÓN: por cada componente listable, un esqueleto derivado del mismo layout, no dibujado a mano aparte.

VALIDACIÓN DEL PANEL:
Diseñador de interacción: es trabajo que nadie agradece explícitamente y que todos perciben. Señal de que alguien se ocupó.

DISENSO: Diseñadora visual — un esqueleto de altura fija miente si el contenido real tiene alturas variables. O el esqueleto miente, o las tarjetas truncan. Decidí cuál a propósito.

TEST: Grabá la carga en cámara lenta. Si algo salta de posición, el esqueleto está mal.

***
P-13 — Canal de feedback: alcance angosto, reformulación cerrada, cierre visible

REGLA: Si incluís un asistente conversacional, DEBE declarar un alcance angosto y cumplirlo. Su trabajo es capturar y enrutar, no resolver.
FUERZA: DEBERÍA

IMPLEMENTACIÓN — el patrón completo, en orden:
Declaración de alcance en el saludo: qué hace y qué no. Contame si encontraste un problema o se te ocurrió una mejora, y yo me encargo de que le llegue al equipo. La frase clave es "me encargo de que le llegue": promete mensajería, no solución.
Dos botones de entrada en vez de campo libre: clasifica el ticket sin pedir un campo "categoría" y reduce el espacio de decisión inicial.
Ante ambigüedad, reformulación en pregunta cerrada. No pidas que reformule: proponé una interpretación completa y pedí sí/no. El trabajo cognitivo es del sistema; el usuario solo confirma.
Justificá la repregunta: Para que quede claro para el equipo…. Sin esa cláusula, la misma pregunta se lee como "no te entendí".
Traducí sin corregir. El texto final tiene que ser utilizable por el equipo receptor, y nunca hacerle notar al usuario que escribió mal o informal.
Una confirmación (P-11) y un acuse visible.
Aceptá adjuntos desde el primer input: Contame qué pasó o pegá una captura….

FALTANTES QUE HAY QUE AGREGAR (el original no los tiene):
Referencia de seguimiento (número de ticket) en el acuse.
Triage de urgencia: un bug que bloquea trabajo crítico no puede entrar por la misma puerta que una idea de UI.
Camino explícito para el "no" en la reformulación.

VALIDACIÓN DEL PANEL:
UX Writer: la reformulación que traduce coloquial a especificación es el valor real del bot. Convierte un reporte inservible en un ticket accionable sin fricción para quien reporta.
Usuario experto: reporté algo sin salir de la pantalla donde me pasó, sin abrir mail, sin buscar a nadie. Eso es todo lo que me importa.

DISENSO: Crítico adversario — un bot sin número de ticket es un buzón sin acuse real: el usuario no puede hacer seguimiento y va a dejar de reportar cuando note que sus reportes no vuelven.

TEST: Reportá un problema y esperá una semana. Si no volvió nada, el canal está muerto aunque el diseño sea perfecto.

***
3. SISTEMA VISUAL — REGLAS MÍNIMAS

V-01 (DEBE) Máximo 4 tamaños de texto por pantalla: título, cuerpo, label, metadato.
V-02 (DEBE) Códigos, identificadores y cualquier cosa que se compare carácter por carácter va en monoespaciada. El texto que se lee va en la sans. Es una distinción ontológica, no decorativa.
V-03 (DEBE) Padding con ceros a la izquierda en identificadores y listas numeradas (01, 0003-A): permite grilla modular sin ajustes, ordenamiento correcto y tipeo predecible.
V-04 (DEBERÍA) Un solo radio de esquina en todo el sistema, y píldoras (radio completo) reservadas para chips de estado y controles segmentados.
V-05 (DEBE) El elemento seleccionado en un segmentado se marca con inversión de contraste (fondo negro, texto blanco), no con color de marca.
V-06 (DEBE) Los números que se comparan entre filas usan cifras tabulares.
V-07 (DEBERÍA) Aire generoso en pantallas de decisión (una unidad de trabajo); densidad alta en pantallas de barrido (tablas, listas). No apliques la misma densidad a las dos.
V-08 (DEBE) Prohibido que la posición de un elemento en una grilla dependa del ancho del viewport si el usuario puede desarrollar memoria muscular sobre él (ver A-03).

***
4. SISTEMA DE CONTENIDO — REGLAS MÍNIMAS

C-01 (DEBE) Una sola persona gramatical y un solo registro en todo el producto. Elegilo y no lo mezcles nunca. El producto original tiene una sola grieta de tono y está en su pantalla más importante (ver A-05).
C-02 (DEBE) Vocabulario único por concepto. Un concepto = una palabra, en la navegación, en los breadcrumbs, en los títulos y en el copy explicativo (ver A-04).
C-03 (DEBE) Los placeholders enseñan formato con ejemplos reales: ej. PAMPA LIBRE o un n° de acta, no Ingresá un valor.
C-04 (DEBERÍA) Los estados vacíos explican qué va a aparecer ahí y cómo hacer que aparezca.
C-05 (DEBE) Nombrá roles en la situación, no estados de base de datos. La marca de tu cliente / Recién publicada es infinitamente mejor que Registro A / Registro B. El usuario tiene que saber en dos segundos quién es quién.
C-06 (DEBE) Las etiquetas describen, no juzgan. Ver A-06.
C-07 (DEBERÍA) Las frases de regla (P-01) viven en un archivo de contenido con ID único, versionado, nunca hardcodeadas en componentes.

Plantillas de microcopy reutilizables:

Situación	Plantilla
Filtro vacío	sin filtro = todos los {X}
Umbral	Oculta los {X} con menos de {N}% de {métrica}.
Campo no editable	{Campo} sale de {fuente}, así que no se pregunta ni se puede contradecir.
Edición local vs. sync	Lo que corrijas acá queda marcado como cambio manual: una actualización de {fuente} no lo pisa.
Entrada polimórfica	Escribí {ejemplos}. No hace falta decir de qué se trata.
Explicación de lista	{Qué hay acá}, ordenado por {criterio} — {la regla del reloj}. Resolvelos como {A} o {B}; el historial queda en {lugar}.
	***
5. ARQUITECTURA E INTERACCIÓN — REGLAS MÍNIMAS

I-01 (DEBE) Todo estado que el usuario querría compartir o volver a abrir tiene URL propia. Esto incluye modales, fichas y ventanas internas.
I-02 (DEBE) Si implementás ventanas/fichas dentro de la app (multi-documento), son obligatorios: URL por ficha, trampa de foco, orden de tabulación, Escape con jerarquía definida, y comportamiento declarado del botón Atrás del navegador. Sin eso, no lo implementes (ver A-07).
I-03 (DEBERÍA) Paleta de comandos con entrada polimórfica: un solo campo que acepta todos los tipos de identificador y desambigua solo. Requisito: una vía de escape para forzar la interpretación cuando dos formatos colisionen.
I-04 (DEBE) El atajo de teclado se muestra dentro del control que dispara (P-07).
I-05 (DEBE) El bloqueante va primero. Si falta algo sin lo cual el usuario no puede completar su tarea, va arriba de todo el contenido, con la acción de resolverlo al lado.
I-06 (DEBERÍA) Una acción destacada por pantalla como máximo, en negro/inversión, no en color semántico.

***
6. ANTI-PATRONES — LO QUE EL PRODUCTO ORIGINAL HACE MAL

Están acá porque la admiración copia todo, incluidos los defectos.

A-01 — Dato roto presentado como transparencia.
El original muestra texto de la fuente externa con las palabras concatenadas sin separador, ilegible, justo en la pantalla donde se toma la decisión más cara. No es fidelidad: es un bug de parseo. Regla: fidelidad en el valor, calidad en la presentación. Si no podés presentar bien un dato, mostralo truncado con acceso al crudo, nunca roto.

A-02 — Doble confirmación.
Una tarjeta pide confirmar con botones y, acto seguido, el bot pregunta lo mismo en texto. Resultado observado: el usuario terminó confirmando escribiendo, no tocando el botón. La redundancia lo sacó del camino de un click. Regla: cuando un widget pide una decisión, todo lo demás se calla.

A-03 — Colapso de navegación que destruye información.
Al colapsar el menú, un contador (17) se degrada a un punto. Se perdió información para ganar 250 px, y los íconos sin etiqueta obligan a recordar en un producto que en todo lo demás evita el recuerdo. Regla: un modo compacto puede reducir tamaño, nunca cantidad de información.

A-04 — Deriva de vocabulario.
El mismo flujo se llama de cuatro maneras según dónde estés parado (menú, breadcrumb, título, copy), y el copy menciona un lugar que no existe en la navegación. Regla: C-02, sin excepciones.

A-05 — Deriva de tono.
Todo el producto tutea/vosea, menos una etiqueta en la pantalla más importante, que trata de usted. Una sola grieta, en el peor lugar. Regla: C-01.

A-06 — La etiqueta que prejuzga.
El original rotula al objeto externo como "la amenaza". Es memorable y acelera la comprensión, pero el sistema está enunciando la conclusión antes de que el usuario la saque, y esa palabra queda escrita si la pantalla se comparte con un tercero. Regla: describí el rol (recién publicada, en conflicto potencial), no el veredicto.

A-07 — Gestor de ventanas a medio hacer.
Dock que ya trunca títulos con dos elementos abiertos, sin evidencia de URL por ficha ni de manejo de foco. Y la sugerencia que el propio usuario reportó por el bot del producto era pedir la parte que falta. Regla: I-02 o no lo hagas.

A-08 — El gris que significa dos cosas.
"Secundario" y "deshabilitado" comparten tono. En el momento en que el estado importa, el usuario no sabe si el botón no anda o si es de menor jerarquía. Regla: P-06, mitigación obligatoria.

A-09 — Superficie de terceros sin integrar.
El menú de cuenta muestra el branding de un proveedor de autenticación, metiendo un lenguaje visual ajeno en el único lugar donde el usuario administra su identidad. Regla: los proveedores se integran o se ocultan; no se exhiben.

***
7. AUDITORÍA DE CONFORMIDAD

Corré esto antes de entregar. Formato de reporte: ID · PASA / FALLA / N/A · evidencia en una línea.

Bloque 1 — Traducción al dominio
D1 a D10 contestadas y escritas, no supuestas.
La acción irreversible está identificada por nombre.

Bloque 2 — Contenido
P-01 Cada control con regla de negocio tiene su frase, pegada al control.
P-02 Los 10 términos del oficio aparecen exactos.
C-01 Una sola persona gramatical en todo el producto. Buscá la excepción; siempre hay una.
C-02 Un concepto = una palabra en menú, breadcrumb, título y copy.
C-03 Ningún placeholder genérico.
C-05 Los objetos se nombran por su rol en la situación.
C-06 Ninguna etiqueta emite un veredicto.

Bloque 3 — Decisión y riesgo
P-04 Cada default responde "qué haría el mejor profesional", y es visible en resultados.
P-05 Orden por costo de no actuar + fecha absoluta y relativa juntas.
P-05/P-10 Hay resumen agregado arriba de la lista.
P-10 La cola numera, avanza y decrece al resolver.
P-11 La acción irreversible tiene deshacer o consecuencia enunciada.
P-11 Una sola confirmación por decisión (buscá A-02).
P-11 El acuse persiste en pantalla.

Bloque 4 — Datos
P-03 Ninguna magnitud de máquina llega cruda al usuario.
P-08 Las dos fuentes de verdad son visibles y las ediciones locales están marcadas.
P-09 Vacío, no-cargado, sin-asignar y cero se ven distinto.
A-01 Cargaste datos reales sucios y ninguna celda quedó ilegible.

Bloque 5 — Visual
P-06 Máximo 4 colores semánticos, con evento declarado por cada uno.
P-06 Ningún estado se comunica solo por color (prueba: imprimir en B/N).
A-08 Deshabilitado tiene tratamiento propio, distinto de secundario.
V-01 a V-06 verificados.
Contraste WCAG AA medido en labels, placeholders y textos de apoyo. No estimado: medido.

Bloque 6 — Interacción
P-07 Cada atajo tiene su camino visible en la misma pantalla.
P-12 Los esqueletos tienen la forma real y nada salta al cargar.
I-01 Todo estado compartible tiene URL.
I-02 Si hay ventanas internas: URL, foco, tab, Escape y Atrás definidos.
I-05 El bloqueante está arriba de todo.
Recorrido completo con Tab, sin mouse, sin trabarse.
Lector de pantalla sobre la pantalla más compleja.
Modo oscuro: los 4 colores semánticos siguen funcionando.
Responsive: la pantalla de decisión sirve en 390 px.

***
8. PROTOCOLO DE VALIDACIÓN POR PANEL

Antes de cerrar cualquier decisión de diseño relevante, simulá estas siete voces. Regla: si las siete coinciden, la decisión es sospechosa y una voz DEBE atacarla igual.

Arquitecta de información — estructura, navegación, modelos mentales, jerarquía. Sospecha de toda decisión visual que tape un problema de estructura.
Diseñador de interacción — estados, feedback, reversibilidad, caminos de error, qué pasa cuando falla.
Diseñadora visual / tipógrafa — escala, ritmo, densidad, color como señal.
UX writer — cada palabra, el tono, el microcopy que enseña, los nombres de las cosas.
Investigadora HCI — carga cognitiva, reconocimiento vs. recuerdo, curvas experto/novato. Cita el principio, mostrá el píxel.
Usuario experto del dominio — no le importa el diseño: le importa si puede terminar su trabajo y si confía en el dato.
Crítico adversario — su único trabajo es atacar: deuda de diseño, casos límite, accesibilidad, escalabilidad, "buen gusto" que en uso real es fricción. DEBE producir objeciones sustantivas aunque la decisión sea buena.

Salida obligatoria del panel: decisión propuesta · principios que la respaldan (por ID) · objeción más fuerte que sobrevivió · qué evidencia la resolvería.

***
9. INSTRUCCIÓN LISTA PARA OTRA IA

> Vas a diseñar (o revisar) {pantalla / flujo} de {producto}, un software de {dominio} cuyos usuarios son {perfil}.
>
> Aplicá el Manual de diseño transferible v1.0 adjunto como documento normativo. Procedé así:
>
> 1. Completá la Fase de traducción al dominio (D1–D10). Si te falta información, preguntámela antes de diseñar. No inventes reglas de mi negocio.
> 2. Proponé la solución citando los principios que la respaldan por ID (P-01, V-03, etc.).
> 3. Escribí el microcopy usando las plantillas de la sección 4, adaptadas a mi vocabulario. El microcopy no es relleno: es el entregable principal.
> 4. Simulá el panel de validación de la sección 8 sobre las tres decisiones más discutibles. Dejá el disenso visible; no lo concilies.
> 5. Corré la auditoría de conformidad de la sección 7 y reportá cada FALLA con su ID. No omitas las que no supiste resolver.
> 6. Revisá explícitamente contra los anti-patrones A-01 a A-09 y confirmá que no reprodujiste ninguno.
> 7. Si alguna instrucción mía contradice un principio marcado como DEBE, decímelo antes de ejecutar y explicame el costo.

***
10. RESUMEN EN UNA PÁGINA

Si tuvieras que quedarte con seis frases:

Escribí la regla del negocio al lado del control. Es lo que más calidad percibida produce por unidad de esfuerzo, y casi nadie lo hace.
No simplifiques el dominio; simplificá el acceso al dominio. Vocabulario experto intacto + glosa pegada. Ese es el mecanismo exacto de "simple pero no castiga al que sabe".
Ningún atajo elimina su camino visible, y ambos viven en el mismo lugar de la pantalla.
El color se gasta solo en riesgo, urgencia y confirmación. La calma no es estética: es contraste guardado para la alarma.
Ordená por costo de no actuar, y decí la verdad sobre de dónde viene cada dato.
La estética minimalista es replicable en un producto malo. Lo que no se puede fingir es haber entendido el trabajo antes de dibujarlo. Las tres mejores decisiones del producto que originó este manual son frases, no píxeles.
