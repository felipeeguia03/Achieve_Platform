import "server-only";

import type { SimulacionDePieza } from "@/lib/domain/view-models";

/**
 * La vista simulada de Formación — [ADR-087](../../../docs/decisions.md#adr-087)
 * Enmienda 3.
 *
 * ⚠️ **Nada de este archivo es contenido de la psicopedagoga.** Lo escribió el
 * agente bajo la delegación del owner del 12 de septiembre de 2026, para que el
 * MVP **muestre cómo se ve** Formación. Todo lo que sale de acá lleva rótulo en
 * pantalla, y sólo se sirve con `MODO_PRUEBA=1`.
 *
 * ⚠️ **No es una columna ni una tabla, a propósito** (`E3.5`). La forma de la
 * entidad la dicta el contenido real: cuando la autora escriba sus tips y sus
 * ejemplos, entran con la forma que ella les dé, no con la de esta simulación.
 *
 * Lo que **sí** es literal: los nombres y las preguntas de los ejes, y los
 * títulos de las piezas simuladas — son ítems de
 * [`indice-psicopedagogico-source.md`](../../../docs/indice-psicopedagogico-source.md),
 * sin el punto final.
 */

export interface GrupoSimulado {
  codigo: string;
  titulo: string;
  pregunta: string;
  /** Códigos de pieza, en el orden en que se muestran. */
  piezas: readonly string[];
}

/** Los cinco ejes transversales del índice, con la asignación de `E3.3`. */
export const GRUPOS: readonly GrupoSimulado[] = [
  {
    codigo: "PLANIFICAR",
    titulo: "Planificar",
    pregunta: "¿Qué tengo que hacer y cómo voy a hacerlo?",
    piezas: ["F02", "S01"],
  },
  {
    codigo: "EJECUTAR",
    titulo: "Ejecutar",
    pregunta: "¿Cómo paso de la intención a la acción?",
    piezas: ["F01", "F05"],
  },
  {
    codigo: "APRENDER",
    titulo: "Aprender",
    pregunta: "¿Qué hago con el contenido para incorporarlo/saberlo?",
    piezas: ["F03", "S02"],
  },
  {
    codigo: "MONITOREAR",
    titulo: "Monitorear",
    pregunta: "¿Cómo sé si lo que estoy haciendo funciona?",
    piezas: ["F04", "S03"],
  },
  {
    codigo: "AJUSTAR",
    titulo: "Ajustar",
    pregunta: "¿Qué hago cuando el plan, la estrategia o el resultado no son los esperados?",
    piezas: ["S04", "S05"],
  },
];

/**
 * Lo que se simula **alrededor** de las cinco piezas de la autora.
 *
 * Los tips están **derivados de su explicación**, no traídos de afuera: cada
 * uno reformula algo que ella ya dice. Los ejemplos usan materias del mundo
 * sintético.
 */
export const SIMULACION_POR_PIEZA: Readonly<Record<string, SimulacionDePieza>> = {
  F01: {
    duracionMinutos: 4,
    tips: [
      "Escribí el primer paso con un verbo concreto: «leer las páginas 14 a 16», no «estudiar la unidad 2».",
      "Si el primer paso todavía te cuesta, sigue siendo grande: dividilo otra vez.",
      "Empezalo apenas lo definís. Entre planear y arrancar es donde más se pierde.",
    ],
    ejemploDeEntregable:
      "Foto del cuaderno abierto con el título «Unidad 2 · leer págs. 14 a 16» y las primeras líneas ya escritas.",
  },
  F02: {
    duracionMinutos: 6,
    tips: [
      "Antes de repartir días, listá qué tenés que aprender y marcá qué temas te van a costar más.",
      "Contá el tiempo real que tenés, descontando cursada, trabajo y descanso.",
      "Dejá días libres en el cronograma: un plan sin aire se atrasa con el primer imprevisto.",
    ],
    ejemploDeEntregable:
      "Lista de seis bloques del programa de Bases de Datos, cada uno con sus días asignados y dos marcados como «más difíciles».",
  },
  F03: {
    duracionMinutos: 5,
    tips: [
      "Reconocer algo cuando lo tenés adelante no es lo mismo que poder recuperarlo sin ayuda.",
      "Después de leer, cerrá el material y decí o escribí lo que recordás.",
      "Lo que no te salió sin mirar es lo que conviene volver a trabajar.",
    ],
    ejemploDeEntregable:
      "Audio de dos minutos explicando qué es una clave foránea, grabado con el apunte cerrado.",
  },
  F04: {
    duracionMinutos: 5,
    tips: [
      "Sentirte seguro orienta, pero no alcanza: buscá algo que puedas hacer sin la respuesta delante.",
      "Según el tema, probá explicar, relacionar, aplicar o resolver.",
      "Anotá lo que no pudiste resolver: te dice qué repasar.",
    ],
    ejemploDeEntregable:
      "Cinco preguntas sobre la unidad 3 de Sistemas Operativos, respondidas sin apuntes, con las dos que costaron marcadas.",
  },
  F05: {
    duracionMinutos: 4,
    tips: [
      "Proponerte «no voy a mirar el celular» no alcanza: cambiá dónde está.",
      "Decidí antes de empezar qué vas a hacer si aparecen las ganas de agarrarlo.",
      "Usá un reloj o cronómetro para el tiempo pactado, así no necesitás el celular para ver la hora.",
    ],
    ejemploDeEntregable:
      "«Estudié 40 minutos con el celu en otra habitación, en modo avión. Lo agarré recién al terminar.»",
  },
};

/** Una pieza entera simulada: título literal del índice, el resto escrito para la demo. */
export interface PiezaSimulada {
  codigo: string;
  titulo: string;
  problema: string;
  objetivo: string;
  explicacion: string;
  accionPosterior: string;
  evidenciaEsperada: string;
  material: string | null;
  simulacion: SimulacionDePieza;
}

export const PIEZAS_SIMULADAS: readonly PiezaSimulada[] = [
  {
    codigo: "S01",
    titulo: "Cómo organizar la semana/semestre",
    problema:
      "Cursada, prácticos y exámenes se superponen, y la semana se llena sin que quede claro cuándo se estudia.",
    objetivo: "Ver la semana completa antes de que empiece y reservar momentos concretos de estudio.",
    explicacion:
      "Cuando el estudio no tiene un lugar fijo en la semana, compite con todo lo demás y suele perder. Mirar la semana entera de antemano permite ubicar primero lo que no se mueve y después los momentos de estudio.",
    accionPosterior: "Armar la semana que viene con clases, prácticos y al menos dos momentos de estudio fijos.",
    evidenciaEsperada: "Foto o captura de la semana armada.",
    material: "Plantilla de semana",
    simulacion: {
      duracionMinutos: 5,
      tips: [
        "Primero ubicá lo que no se mueve: clases, trabajo, viajes.",
        "Poné los momentos de estudio donde tenés más energía, no donde sobra tiempo.",
        "Revisá el domingo si la semana que pasó se pareció a la planeada.",
      ],
      ejemploDeEntregable:
        "Captura de un calendario semanal con las clases en gris y dos bloques de estudio de Álgebra, martes y jueves a la tarde.",
    },
  },
  {
    codigo: "S02",
    titulo: "Cómo hacer un resumen que realmente sirva",
    problema: "Los resúmenes terminan siendo el apunte copiado en menos hojas, y después no ayudan a estudiar.",
    objetivo: "Hacer un resumen que ordene las ideas y sirva para recuperarlas, no para releer.",
    explicacion:
      "Copiar frases del material mantiene el contacto con la información, pero no obliga a decidir qué es importante ni cómo se relaciona. Un resumen útil se escribe con palabras propias y deja a la vista las ideas principales y sus conexiones.",
    accionPosterior: "Resumir un tema en una sola carilla, con palabras propias y sin copiar frases.",
    evidenciaEsperada: "Foto del resumen.",
    material: "Guía de resumen en una carilla",
    simulacion: {
      duracionMinutos: 6,
      tips: [
        "Leé el tema completo antes de empezar a escribir.",
        "Si una frase quedó igual al libro, reescribila con tus palabras.",
        "Terminá el resumen con dos o tres preguntas que puedas responder sin mirar.",
      ],
      ejemploDeEntregable:
        "Una carilla sobre normalización con tres ideas principales, flechas entre ellas y dos preguntas al pie.",
    },
  },
  {
    codigo: "S03",
    titulo: "Cómo utilizar el error como información",
    problema: "Cuando algo sale mal en un ejercicio, se pasa al siguiente sin mirar qué falló.",
    objetivo: "Usar cada error para saber qué hay que volver a trabajar.",
    explicacion:
      "Un error dice algo sobre dónde está la dificultad: puede ser un concepto que no quedó claro, un paso que se saltea o una distracción. Clasificarlo permite decidir qué hacer, en lugar de repetir lo mismo esperando otro resultado.",
    accionPosterior: "Revisar tres ejercicios con errores y anotar para cada uno qué falló.",
    evidenciaEsperada: "Lista de los errores con su causa.",
    material: "Registro de errores",
    simulacion: {
      duracionMinutos: 4,
      tips: [
        "Separá «no lo entendí» de «me confundí en un paso».",
        "Si el mismo error aparece dos veces, ya es un tema para repasar.",
        "Volvé a hacer el ejercicio sin mirar la corrección.",
      ],
      ejemploDeEntregable:
        "Tabla con tres ejercicios de Física I: el error, si fue de concepto o de cálculo, y qué repasar.",
    },
  },
  {
    codigo: "S04",
    titulo: "Qué hacer cuando me atraso en el cronograma",
    problema: "El cronograma se atrasa unos días y parece que ya no sirve, así que se abandona.",
    objetivo: "Reajustar el plan con el tiempo que queda, sin tirarlo entero.",
    explicacion:
      "Atrasarse es habitual y no significa que el plan haya fallado. Lo que suele fallar es intentar recuperar todo de golpe. Reajustar implica mirar qué queda, cuánto tiempo hay y qué se puede simplificar.",
    accionPosterior: "Rearmar lo que queda del cronograma con el tiempo disponible hoy.",
    evidenciaEsperada: "El cronograma reajustado.",
    material: null,
    simulacion: {
      duracionMinutos: 5,
      tips: [
        "No intentes recuperar los días perdidos sumando horas: redistribuí.",
        "Decidí qué temas pueden verse más breve.",
        "Anotá qué causó el atraso para anticiparlo la próxima vez.",
      ],
      ejemploDeEntregable:
        "El cronograma de Programación II con dos bloques corridos a la semana siguiente y uno marcado para repaso breve.",
    },
  },
  {
    codigo: "S05",
    titulo: "Qué hacer después de desaprobar",
    problema: "Después de desaprobar cuesta volver a empezar, y no queda claro qué cambiar.",
    objetivo: "Retomar con un análisis concreto de qué pasó y qué cambiar para el próximo intento.",
    explicacion:
      "Desaprobar puede deberse al conocimiento, a la estrategia, a la planificación o a lo que pasó durante el examen. Distinguirlo evita repetir la misma preparación y permite retomar con un cambio concreto.",
    accionPosterior: "Revisar el examen y escribir qué cambiarías para el próximo intento.",
    evidenciaEsperada: "Una nota breve con lo que cambiarías.",
    material: "Guía para revisar un examen",
    simulacion: {
      duracionMinutos: 6,
      tips: [
        "Pedí ver el examen corregido antes de volver a estudiar.",
        "Separá lo que no sabías de lo que sabías y no pudiste mostrar.",
        "Elegí un solo cambio para empezar, no diez.",
      ],
      ejemploDeEntregable:
        "«Estudié leyendo y en el examen no pude resolver sin mirar. Para el recuperatorio voy a practicar ejercicios sin apuntes.»",
    },
  },
];
