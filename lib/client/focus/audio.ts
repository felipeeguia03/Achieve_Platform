/**
 * El audio de Modo Focus — [ADR-104](../../../docs/decisions.md#adr-104) §19.
 *
 * ## Sin archivos
 *
 * Los dos sonidos **se generan acá**, con Web Audio: ruido marrón y ruido rosa.
 * Sin archivos no hay licencias que revisar, nada que alojar y ningún streaming
 * externo. La alarma son dos tonos de un oscilador.
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

const FUNDIDO_EN_SEGUNDOS = 2;

type ContextoDeAudio = AudioContext;

function crearContexto(): ContextoDeAudio | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
}

/** Diez segundos de ruido que se repiten. El oído no encuentra la costura. */
function bufferDeRuido(ctx: ContextoDeAudio, sonido: Exclude<Sonido, "NINGUNO">): AudioBuffer {
  const largo = ctx.sampleRate * 10;
  const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  if (sonido === "MARRON") {
    let ultimo = 0;
    for (let i = 0; i < largo; i++) {
      const blanco = Math.random() * 2 - 1;
      ultimo = (ultimo + 0.02 * blanco) / 1.02;
      datos[i] = ultimo * 3.5;
    }
  } else {
    // Filtro de Paul Kellet: ruido rosa a partir de blanco.
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < largo; i++) {
      const blanco = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + blanco * 0.0555179;
      b1 = 0.99332 * b1 + blanco * 0.0750759;
      b2 = 0.969 * b2 + blanco * 0.153852;
      b3 = 0.8665 * b3 + blanco * 0.3104856;
      b4 = 0.55 * b4 + blanco * 0.5329522;
      b5 = -0.7616 * b5 - blanco * 0.016898;
      datos[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + blanco * 0.5362) * 0.11;
      b6 = blanco * 0.115926;
    }
  }
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
    fuente.buffer = bufferDeRuido(ctx, sonido);
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
