/**
 * Gimnasia cognitiva — el dominio puro · [ADR-102](../docs/decisions.md#adr-102).
 *
 * Todo lo que el servidor usa para corregir y el navegador para mostrar sale de
 * estas funciones. Si una cambia, cambia la versión de sus reglas.
 */
import { describe, expect, it } from "vitest";

import { azarDePrueba, esSemilla, generador, semillaDeTexto } from "@/lib/domain/gimnasia/azar";
import {
  jugarCuadricula,
  ladoDeCuadricula,
  largoInicialDeCuadricula,
  REGLAS_CUADRICULA,
  secuenciaDeRonda,
} from "@/lib/domain/gimnasia/cuadricula-fugaz";
import {
  cadenaDePrueba,
  invertir,
  jugarCadena,
  largoInicialDeCadena,
  nivelDeLargo,
  nivelResultante,
  normalizarCadena,
} from "@/lib/domain/gimnasia/cadena-inversa";
import {
  colaDeLaSesion,
  conRepasos,
  corregirCerrada,
  normalizarTexto,
  pendientesDeHoy,
  proximoRepaso,
  recuerdoDiferido,
  seleccionarPreguntas,
  siguienteDeLaCola,
  sumarDias,
  type CandidataDeRecuerdo,
  type RepasoPrevio,
} from "@/lib/domain/gimnasia/recuerdo-real";
import { diasConRutina, juegoSiguiente, juegosDeLaRutina, marcaDe, minutosDe } from "@/lib/domain/gimnasia/rutina";
import { canTransition, gymAttemptTransitions, gymSessionTransitions } from "@/lib/domain/state-machines";

describe("el azar tiene semilla", () => {
  it("la misma semilla da la misma serie, en cualquier motor", () => {
    const a = generador(42);
    const b = generador(42);
    const serie = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(serie);
    expect(serie.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it("un texto da siempre el mismo entero sin signo", () => {
    expect(semillaDeTexto("hola")).toBe(semillaDeTexto("hola"));
    expect(semillaDeTexto("hola")).not.toBe(semillaDeTexto("holb"));
    expect(semillaDeTexto("x")).toBeGreaterThanOrEqual(0);
  });

  it("cada prueba de una partida tiene su serie, y cambia con el largo", () => {
    expect(azarDePrueba(7, 0, 3)()).toBe(azarDePrueba(7, 0, 3)());
    expect(azarDePrueba(7, 0, 3)()).not.toBe(azarDePrueba(7, 0, 4)());
  });

  it("una semilla válida entra en un integer de Postgres", () => {
    expect(esSemilla(0)).toBe(true);
    expect(esSemilla(2147483647)).toBe(true);
    expect(esSemilla(2147483648)).toBe(false);
    expect(esSemilla(-1)).toBe(false);
    expect(esSemilla(1.5)).toBe(false);
  });
});

/** Responde bien una ronda. */
const bien = (semilla: number, ronda: number, largo: number) => secuenciaDeRonda(semilla, ronda, largo);
/** Una respuesta que nunca es la secuencia: la misma casilla repetida. */
const mal = (largo: number) => Array.from({ length: largo }, () => 0);

describe("Cuadrícula fugaz", () => {
  it("la secuencia es determinística y no se altera entre llamadas (un re-render no la cambia)", () => {
    expect(secuenciaDeRonda(99, 2, 5)).toEqual(secuenciaDeRonda(99, 2, 5));
  });

  it("no repite casillas y no se sale de la cuadrícula", () => {
    for (let semilla = 0; semilla < 50; semilla++) {
      for (const largo of [3, 6, 7, 12, 16]) {
        const s = secuenciaDeRonda(semilla, 0, largo);
        const lado = ladoDeCuadricula(largo);
        expect(new Set(s).size).toBe(largo);
        expect(s.every((c) => c >= 0 && c < lado * lado)).toBe(true);
      }
    }
  });

  it("3×3 hasta seis casillas, 4×4 desde siete, y nunca más grande", () => {
    expect(ladoDeCuadricula(3)).toBe(3);
    expect(ladoDeCuadricula(6)).toBe(3);
    expect(ladoDeCuadricula(7)).toBe(4);
    expect(ladoDeCuadricula(16)).toBe(4);
  });

  it("acierto suma una casilla y puntúa largo × 100 más una bonificación menor por racha", () => {
    const s = 5;
    const r = jugarCuadricula(s, 3, [bien(s, 0, 3), bien(s, 1, 4), bien(s, 2, 5)]);
    expect(r.estado).toBe("OK");
    if (r.estado !== "OK") return;
    expect(r.partida.resultado.rondas.map((x) => x.largo)).toEqual([3, 4, 5]);
    // 300 + (400 + 25) + (500 + 50)
    expect(r.partida.resultado.puntuacion).toBe(1275);
    expect(r.partida.resultado.secuenciaMaxima).toBe(5);
    expect(r.partida.siguiente?.largo).toBe(6);
  });

  it("un error mantiene el largo y corta la racha", () => {
    const s = 5;
    const r = jugarCuadricula(s, 3, [bien(s, 0, 3), mal(4), bien(s, 2, 4)]);
    if (r.estado !== "OK") throw new Error("inválida");
    expect(r.partida.resultado.rondas.map((x) => x.largo)).toEqual([3, 4, 4]);
    // 300 + 0 + 400 (sin bono: el error cortó la racha)
    expect(r.partida.resultado.puntuacion).toBe(700);
    expect(r.partida.resultado.errores).toBe(1);
  });

  it("con dos errores termina, y una respuesta de más se rechaza", () => {
    const r = jugarCuadricula(1, 3, [mal(3), mal(3)]);
    if (r.estado !== "OK") throw new Error("inválida");
    expect(r.partida.terminada).toBe(true);
    expect(r.partida.siguiente).toBeNull();
    expect(r.partida.resultado.secuenciaMaxima).toBe(0);
    expect(jugarCuadricula(1, 3, [mal(3), mal(3), mal(3)])).toEqual({ estado: "INVALIDA", motivo: "RESPUESTAS_DE_MAS" });
  });

  it("máximo diez rondas, y al pasar de seis casillas la ronda es 4×4", () => {
    const s = 3;
    const respuestas: number[][] = [];
    for (let i = 0; i < 10; i++) respuestas.push(bien(s, i, 3 + i));
    const r = jugarCuadricula(s, 3, respuestas);
    if (r.estado !== "OK") throw new Error("inválida");
    expect(r.partida.terminada).toBe(true);
    expect(r.partida.resultado.rondas[3].lado).toBe(3);
    expect(r.partida.resultado.rondas[4].lado).toBe(4);
  });

  it("una casilla fuera de la cuadrícula invalida la partida entera", () => {
    expect(jugarCuadricula(1, 3, [[0, 1, 9]])).toEqual({ estado: "INVALIDA", motivo: "CASILLA_INEXISTENTE" });
  });

  it("la primera sesión arranca en 3; después, cerca de lo reciente pero por debajo, y sólo mira los tres últimos", () => {
    expect(largoInicialDeCuadricula([])).toBe(REGLAS_CUADRICULA.largoInicial);
    expect(largoInicialDeCuadricula([8])).toBe(6);
    expect(largoInicialDeCuadricula([4])).toBe(3);
    // Una marca vieja de 12 no pesa: está cuarta.
    expect(largoInicialDeCuadricula([5, 5, 5, 12])).toBe(3);
  });
});

/** La respuesta correcta de una prueba de cadena. */
const alReves = (semilla: number, prueba: number, largo: number) => invertir(cadenaDePrueba(semilla, prueba, largo));

describe("Cadena inversa", () => {
  it("sólo dígitos, del largo pedido y sin dos iguales seguidos", () => {
    for (let s = 0; s < 40; s++) {
      const c = cadenaDePrueba(s, 1, 12);
      expect(c).toMatch(/^\d{12}$/);
      expect(/(\d)\1/.test(c)).toBe(false);
    }
  });

  it("invierte y normaliza espacios y separadores; lo que no es dígito no se corrige como casi", () => {
    expect(invertir("381")).toBe("183");
    expect(normalizarCadena(" 1 8-3 ")).toBe("183");
    expect(normalizarCadena("1.8,3")).toBe("183");
    expect(normalizarCadena("18a3")).toBeNull();
    expect(normalizarCadena("")).toBeNull();
  });

  it("dos aciertos en el largo habilitan el siguiente; son cinco pruebas", () => {
    const s = 8;
    const r = jugarCadena(s, 3, [alReves(s, 0, 3), alReves(s, 1, 3), alReves(s, 2, 4), alReves(s, 3, 4), alReves(s, 4, 5)]);
    if (r.estado !== "OK") throw new Error("inválida");
    expect(r.partida.resultado.pruebas.map((p) => p.largo)).toEqual([3, 3, 4, 4, 5]);
    expect(r.partida.resultado.largoConsolidado).toBe(4);
    expect(r.partida.resultado.largoMaximoCorrecto).toBe(5);
    expect(r.partida.terminada).toBe(true);
  });

  it("dos errores seguidos bajan el largo en la sesión, nunca por debajo de 3", () => {
    const r = jugarCadena(8, 5, ["0", "0", "0"]);
    if (r.estado !== "OK") throw new Error("inválida");
    expect(r.partida.resultado.pruebas.map((p) => p.largo)).toEqual([5, 5, 4]);
    const piso = jugarCadena(8, 3, ["0", "0", "0"]);
    if (piso.estado !== "OK") throw new Error("inválida");
    expect(piso.partida.resultado.pruebas.map((p) => p.largo)).toEqual([3, 3, 3]);
  });

  it("muestra la cadena correcta al equivocarse", () => {
    const r = jugarCadena(2, 3, ["999"]);
    if (r.estado !== "OK") throw new Error("inválida");
    expect(r.partida.resultado.pruebas[0].correctaEra).toBe(alReves(2, 0, 3));
  });

  it("el nivel no cae por una mala sesión, y nivel y mejor cadena son cosas distintas", () => {
    expect(nivelDeLargo(3)).toBe(1);
    expect(nivelResultante(null, null)).toBe(1);
    expect(nivelResultante(4, null)).toBe(4);
    expect(nivelResultante(4, 3)).toBe(4);
    expect(nivelResultante(2, 5)).toBe(3);
  });

  it("empieza en el largo de su nivel, y en 3 la primera vez; tope 12", () => {
    expect(largoInicialDeCadena(null)).toBe(3);
    expect(largoInicialDeCadena(4)).toBe(6);
    expect(largoInicialDeCadena(40)).toBe(12);
  });

  it("no acepta más de cinco respuestas", () => {
    expect(jugarCadena(1, 3, ["1", "2", "3", "4", "5", "6"])).toEqual({ estado: "INVALIDA", motivo: "RESPUESTAS_DE_MAS" });
  });
});

describe("Recuerdo real · corrección", () => {
  it("una corta se compara normalizada, sin sinónimos que la pregunta no declare", () => {
    expect(normalizarTexto("  Recuperación   ACTIVA. ")).toBe("recuperacion activa");
    expect(corregirCerrada("SHORT_ANSWER", ["recuperación activa"], "recuperacion activa")).toBe(true);
    expect(corregirCerrada("SHORT_ANSWER", ["recuperación activa"], "releer")).toBe(false);
    expect(corregirCerrada("SHORT_ANSWER", ["x"], "   ")).toBe(false);
  });

  it("opción múltiple y verdadero/falso comparan exacto", () => {
    expect(corregirCerrada("MULTIPLE_CHOICE", ["b"], "b")).toBe(true);
    expect(corregirCerrada("MULTIPLE_CHOICE", ["b"], "B")).toBe(false);
    expect(corregirCerrada("TRUE_FALSE", ["false"], "false")).toBe(true);
  });

  it("una abierta no se corrige automáticamente, nunca", () => {
    expect(() => corregirCerrada("SELF_ASSESSED", [], "cualquier cosa")).toThrow();
  });

  it("sirve para cualquier carrera: la mecánica no sabe de qué materia es", () => {
    // Derecho, Medicina y Contabilidad son la misma respuesta corta.
    expect(corregirCerrada("SHORT_ANSWER", ["dolo"], "Dolo")).toBe(true);
    expect(corregirCerrada("SHORT_ANSWER", ["fémur"], "femur")).toBe(true);
    expect(corregirCerrada("SHORT_ANSWER", ["activo corriente"], "Activo  corriente")).toBe(true);
  });
});

describe("Recuerdo real · política de repaso RR-1", () => {
  it("1 · 1 · 3 · 7 días, en aritmética de calendario", () => {
    expect(proximoRepaso("2026-09-13", "NOT_RECALLED")).toBe("2026-09-14");
    expect(proximoRepaso("2026-09-13", "PARTIAL")).toBe("2026-09-14");
    expect(proximoRepaso("2026-09-13", "RECALLED")).toBe("2026-09-16");
    expect(proximoRepaso("2026-09-13", "EASY")).toBe("2026-09-20");
  });

  it("cruza meses y años, y el horario de verano no corre un día", () => {
    expect(sumarDias("2026-12-29", 7)).toBe("2027-01-05");
    expect(sumarDias("2028-02-27", 3)).toBe("2028-03-01");
    expect(sumarDias("2026-10-03", 1)).toBe("2026-10-04");
  });
});

const candidata = (itemId: string, over: Partial<CandidataDeRecuerdo> = {}): CandidataDeRecuerdo => ({
  itemId,
  cursoId: "c1",
  unidadActiva: false,
  evaluacionEnDias: null,
  ...over,
});
const repaso = (itemId: string, respondidoEn: string, proximo: string, resultado: RepasoPrevio["resultado"] = "RECALLED"): RepasoPrevio => ({
  itemId,
  respondidoEn,
  proximoRepaso: proximo,
  resultado,
});

describe("Recuerdo real · qué preguntas tocan", () => {
  const HOY = "2026-09-13";

  it("vencidas primero, después evaluación cercana, después más fallos, y nuevas al final; lo programado no entra", () => {
    const estados = conRepasos(
      [candidata("nueva"), candidata("examen", { evaluacionEnDias: 5 }), candidata("vencida"), candidata("fallada"), candidata("programada")],
      [
        repaso("vencida", "2026-09-10T10:00:00Z", "2026-09-13"),
        repaso("fallada", "2026-09-11T10:00:00Z", "2026-09-12", "NOT_RECALLED"),
        repaso("programada", "2026-09-12T10:00:00Z", "2026-09-15"),
      ],
    );
    // «fallada» también está vencida: gana el grupo 1 y dentro de él los fallos.
    expect(seleccionarPreguntas(estados, HOY)).toEqual(["fallada", "vencida", "examen", "nueva"]);
  });

  it("la unidad activa sube la prioridad por encima de la evaluación cercana", () => {
    const estados = conRepasos([candidata("examen", { evaluacionEnDias: 2 }), candidata("unidad", { unidadActiva: true })], []);
    expect(seleccionarPreguntas(estados, HOY)).toEqual(["unidad", "examen"]);
  });

  it("una evaluación lejana o pasada no cuenta como cercana", () => {
    const estados = conRepasos([candidata("b-lejos", { evaluacionEnDias: 30 }), candidata("a-nada")], []);
    expect(seleccionarPreguntas(estados, HOY)).toEqual(["a-nada", "b-lejos"]);
  });

  it("cinco por sesión, y cuenta vencidas y nuevas por separado", () => {
    const estados = conRepasos(Array.from({ length: 9 }, (_, i) => candidata(`q${i}`)), [repaso("q0", "2026-09-01T00:00:00Z", "2026-09-02")]);
    expect(seleccionarPreguntas(estados, HOY)).toHaveLength(5);
    expect(pendientesDeHoy(estados, HOY)).toEqual({ vencidas: 1, nuevas: 8 });
  });

  it("sin historial, todas son nuevas", () => {
    expect(pendientesDeHoy(conRepasos([candidata("a")], []), HOY)).toEqual({ vencidas: 0, nuevas: 1 });
  });
});

describe("Recuerdo real · la cola de la sesión", () => {
  it("un «No la recordé» vuelve una sola vez al final", () => {
    const plan = ["a", "b"];
    expect(colaDeLaSesion(plan, [{ itemId: "a", resultado: "NOT_RECALLED" }])).toEqual(["a", "b", "a"]);
    expect(
      colaDeLaSesion(plan, [
        { itemId: "a", resultado: "NOT_RECALLED" },
        { itemId: "b", resultado: "RECALLED" },
        { itemId: "a", resultado: "NOT_RECALLED" },
      ]),
    ).toEqual(["a", "b", "a"]);
  });

  it("no pasa de siete presentaciones", () => {
    const plan = ["a", "b", "c", "d", "e"];
    const respondidas = plan.map((itemId) => ({ itemId, resultado: "NOT_RECALLED" as const }));
    expect(colaDeLaSesion(plan, respondidas)).toHaveLength(7);
  });

  it("la que toca, con su lugar; y null cuando se terminó", () => {
    expect(siguienteDeLaCola(["a", "b"], [])).toEqual({ itemId: "a", posicion: 0, total: 2 });
    expect(siguienteDeLaCola(["a"], [{ itemId: "a", resultado: "EASY" }])).toBeNull();
  });
});

describe("Recuerdo real · lo que se puede afirmar", () => {
  it("sin repasos separados por 24 h suficientes no hay recuerdo diferido: null, no cero", () => {
    expect(recuerdoDiferido([])).toBeNull();
    const mismoDia = [repaso("a", "2026-09-13T10:00:00Z", "x"), repaso("a", "2026-09-13T12:00:00Z", "x")];
    expect(recuerdoDiferido(mismoDia)).toBeNull();
  });

  it("con cinco o más, cuenta sólo los recordados después de 24 h", () => {
    const lista: RepasoPrevio[] = [];
    for (let i = 0; i < 5; i++) {
      lista.push(repaso(`q${i}`, "2026-09-01T10:00:00Z", "x"));
      lista.push(repaso(`q${i}`, "2026-09-03T10:00:00Z", "x", i < 3 ? "RECALLED" : "PARTIAL"));
    }
    expect(recuerdoDiferido(lista)).toEqual({ recordados: 3, total: 5 });
  });
});

describe("La rutina", () => {
  it("tres ejercicios en ocho minutos; sin preguntas, los dos genéricos", () => {
    expect(juegosDeLaRutina(true)).toEqual(["FLASH_GRID", "REVERSE_CHAIN", "REAL_RECALL"]);
    expect(minutosDe(juegosDeLaRutina(true))).toBe(8);
    expect(juegosDeLaRutina(false)).toEqual(["FLASH_GRID", "REVERSE_CHAIN"]);
  });

  it("el siguiente es el primero sin completar, en orden", () => {
    expect(juegoSiguiente(["FLASH_GRID", "REVERSE_CHAIN"], ["FLASH_GRID"])).toBe("REVERSE_CHAIN");
    expect(juegoSiguiente(["FLASH_GRID"], ["FLASH_GRID"])).toBeNull();
  });

  it("los días con rutina son días distintos", () => {
    expect(diasConRutina(["2026-09-12", "2026-09-12", "2026-09-13"])).toBe(2);
    expect(diasConRutina([])).toBe(0);
  });

  it("sin marca anterior es la primera, no una «nueva marca»", () => {
    expect(marcaDe(500, null)).toBe("PRIMERA");
    expect(marcaDe(500, 400)).toBe("NUEVA");
    expect(marcaDe(400, 400)).toBe("SIN_CAMBIO");
  });

  it("las transiciones prohibidas lo están: una sesión cerrada no se reabre", () => {
    expect(canTransition(gymSessionTransitions, "IN_PROGRESS", "COMPLETED")).toBe(true);
    expect(canTransition(gymSessionTransitions, "COMPLETED", "IN_PROGRESS")).toBe(false);
    expect(canTransition(gymSessionTransitions, "CANCELLED", "COMPLETED")).toBe(false);
    expect(canTransition(gymAttemptTransitions, "ABANDONED", "COMPLETED")).toBe(false);
    expect(canTransition(gymAttemptTransitions, "COMPLETED", "ABANDONED")).toBe(false);
  });
});
