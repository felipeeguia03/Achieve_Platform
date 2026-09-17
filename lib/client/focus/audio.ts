/**
 * El audio de Modo Focus — [ADR-104](../../../docs/decisions.md#adr-104) §19.
 *
 * ## Sin archivos
 *
 * Los sonidos **se calculan** en `sonidos.ts` —lluvia, mar, viento, chimenea,
 * ruido marrón y rosa— y acá sólo se reproducen. Sin archivos no hay licencias
 * que revisar, nada que alojar y ningún streaming externo. La alarma son dos
 * tonos de un oscilador.
 *
 * ## ⚠️ La alarma se programa en el reloj de audio
 *
 * Un `setTimeout` en una pestaña de fondo se frena a uno por minuto; el reloj de
 * un `AudioContext` que ya está sonando, no. Por eso el fin de un bloque se
 * **agenda** en `ctx.currentTime + segundos` apenas se conoce, y el fundido de
 * salida también.
 *
 * **Muestra; no escribe nada.** Que suene la alarma no cierra un bloque: eso lo
 * decide el servidor con el instante planeado.
 */

import type { Sonido } from "@/lib/domain/sesion-de-focus";
import { muestrasDe } from "./sonidos";

const FUNDIDO_EN_SEGUNDOS = 2;

type ContextoDeAudio = AudioContext;

function crearContexto(): ContextoDeAudio | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/** El loop del sonido, calculado. Ver `sonidos.ts`: acá sólo se lo pasa a Web Audio. */
function bufferDe(ctx: ContextoDeAudio, sonido: Exclude<Sonido, "NINGUNO">): AudioBuffer {
  const muestras = muestrasDe(sonido, ctx.sampleRate)!;
  const buffer = ctx.createBuffer(1, muestras.length, ctx.sampleRate);
  buffer.getChannelData(0).set(muestras);
  return buffer;
}

export class MotorDeAudio {
  private ctx: ContextoDeAudio | null = null;
  private fuente: AudioBufferSourceNode | null = null;
  private ganancia: GainNode | null = null;
  private alarma: OscillatorNode[] = [];
  private volumen = 0.4;
  private silenciado = false;

  /**
   * Crea o despierta el contexto. **Se llama desde un clic** —*Empezar*,
   * *Continuar*, *Probar*—: sin gesto, el navegador no deja sonar.
   */
  despertar(): boolean {
    this.ctx ??= crearContexto();
    if (!this.ctx) return false;
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return true;
  }

  private objetivo(): number {
    return this.silenciado ? 0 : this.volumen;
  }

  /** Empieza el sonido con un fundido de entrada. `NINGUNO` lo apaga. */
  sonar(sonido: Sonido, volumen: number): void {
    this.volumen = Math.max(0, Math.min(1, volumen / 100));
    this.parar();
    if (sonido === "NINGUNO" || !this.despertar() || !this.ctx) return;
    const ctx = this.ctx;
    const ganancia = ctx.createGain();
    ganancia.gain.setValueAtTime(0, ctx.currentTime);
    ganancia.gain.linearRampToValueAtTime(this.objetivo(), ctx.currentTime + FUNDIDO_EN_SEGUNDOS);
    ganancia.connect(ctx.destination);
    const fuente = ctx.createBufferSource();
    fuente.buffer = bufferDe(ctx, sonido);
    fuente.loop = true;
    fuente.connect(ganancia);
    fuente.start();
    this.fuente = fuente;
    this.ganancia = ganancia;
  }

  /** Corta **ya**: pausar no espera un fundido. */
  parar(): void {
    try {
      this.fuente?.stop();
    } catch {
      // Ya estaba detenida.
    }
    this.fuente?.disconnect();
    this.ganancia?.disconnect();
    this.fuente = null;
    this.ganancia = null;
  }

  cambiarVolumen(volumen: number): void {
    this.volumen = Math.max(0, Math.min(1, volumen / 100));
    if (this.ganancia && this.ctx) this.ganancia.gain.setTargetAtTime(this.objetivo(), this.ctx.currentTime, 0.05);
  }

  /** Silenciar **no pausa** (§19): el reloj sigue. */
  silenciar(silenciado: boolean): void {
    this.silenciado = silenciado;
    if (this.ganancia && this.ctx) this.ganancia.gain.setTargetAtTime(this.objetivo(), this.ctx.currentTime, 0.05);
  }

  /**
   * Agenda el fin de un bloque o de un descanso: el fundido de salida en los
   * últimos dos segundos y la alarma en el instante. Reprogramar cancela lo
   * anterior.
   */
  programarFin(enSegundos: number, conFundido: boolean): void {
    this.cancelarFin();
    if (!this.ctx || enSegundos < 0) return;
    const ctx = this.ctx;
    const cuando = ctx.currentTime + enSegundos;
    if (conFundido && this.ganancia) {
      const g = this.ganancia.gain;
      g.cancelScheduledValues(ctx.currentTime);
      g.setValueAtTime(this.objetivo(), Math.max(ctx.currentTime, cuando - FUNDIDO_EN_SEGUNDOS));
      g.linearRampToValueAtTime(0, cuando);
    }
    // Dos tonos suaves: distinta de cualquier sonido de fondo.
    for (const [frecuencia, desfase] of [[660, 0], [880, 0.35]] as const) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frecuencia;
      env.gain.setValueAtTime(0, cuando + desfase);
      env.gain.linearRampToValueAtTime(0.25, cuando + desfase + 0.04);
      env.gain.exponentialRampToValueAtTime(0.0001, cuando + desfase + 0.9);
      osc.connect(env).connect(ctx.destination);
      osc.start(cuando + desfase);
      osc.stop(cuando + desfase + 1);
      this.alarma.push(osc);
    }
  }

  cancelarFin(): void {
    for (const osc of this.alarma) {
      try {
        osc.stop();
      } catch {
        // Ya sonó.
      }
      osc.disconnect();
    }
    this.alarma = [];
    if (this.ganancia && this.ctx) {
      this.ganancia.gain.cancelScheduledValues(this.ctx.currentTime);
      this.ganancia.gain.setValueAtTime(this.objetivo(), this.ctx.currentTime);
    }
  }

  /** *Probar*: tres segundos del sonido elegido. */
  probar(sonido: Sonido, volumen: number): void {
    if (sonido === "NINGUNO") return;
    this.sonar(sonido, volumen);
    window.setTimeout(() => this.parar(), 3000);
  }

  cerrar(): void {
    this.cancelarFin();
    this.parar();
    void this.ctx?.close();
    this.ctx = null;
  }
}

let compartido: MotorDeAudio | null = null;

/**
 * **Un solo motor por pestaña.** *Probar* en la pantalla sin sesión y el sonido
 * de la concentración son el mismo contexto: el gesto que lo despertó al probar
 * sirve para sonar después, y dos contextos sonarían encimados.
 */
export function motorDeAudio(): MotorDeAudio {
  compartido ??= new MotorDeAudio();
  return compartido;
}
