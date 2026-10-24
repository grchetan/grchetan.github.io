/**
 * Cyber Circuit — High-Performance Synthesized Web Audio Engine
 * Zero external audio files, 100% procedurally synthesized with Web Audio API.
 */

export class RaceAudioSystem {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  public isMuted = false;

  // Engine sound nodes
  private engineMasterGain: GainNode | null = null;
  private oscSub: OscillatorNode | null = null;
  private oscMain: OscillatorNode | null = null;
  private oscHarmonic: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineDistortion: WaveShaperNode | null = null;

  // Drift skid noise nodes
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;

  // Nitro boost sound nodes
  private nitroGain: GainNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;

  // Wind turbulence noise nodes
  private windGain: GainNode | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("race_audio_muted") === "true";
    }
  }

  private makeDistortionCurve(amount = 20): Float32Array {
    const k = amount;
    const n = 256;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public init() {
    if (this.isInitialized || typeof window === "undefined") return;

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      // Master engine gain
      this.engineMasterGain = this.ctx.createGain();
      this.engineMasterGain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Low-pass filter for engine
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = "lowpass";
      this.engineFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      // Gentle saturation for authentic engine rumble
      this.engineDistortion = this.ctx.createWaveShaper();
      this.engineDistortion.curve = this.makeDistortionCurve(18) as unknown as Float32Array<ArrayBuffer>;
      this.engineDistortion.oversample = "2x";

      // Three oscillators for rich cylinder firing harmonics
      this.oscSub = this.ctx.createOscillator();
      this.oscMain = this.ctx.createOscillator();
      this.oscHarmonic = this.ctx.createOscillator();

      this.oscSub.type = "sine";
      this.oscMain.type = "sawtooth";
      this.oscHarmonic.type = "triangle";

      this.oscSub.frequency.setValueAtTime(35, this.ctx.currentTime);
      this.oscMain.frequency.setValueAtTime(70, this.ctx.currentTime);
      this.oscHarmonic.frequency.setValueAtTime(140, this.ctx.currentTime);

      // Connect engine graph
      this.oscSub.connect(this.engineFilter);
      this.oscMain.connect(this.engineFilter);
      this.oscHarmonic.connect(this.engineFilter);

      this.engineFilter.connect(this.engineDistortion);
      this.engineDistortion.connect(this.engineMasterGain);
      this.engineMasterGain.connect(this.ctx.destination);

      this.oscSub.start();
      this.oscMain.start();
      this.oscHarmonic.start();

      // Procedural White Noise Buffer for Skidding & Wind
      const bufferLength = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferLength, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferLength; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      // Tire Skid Noise Chain
      const skidNoise = this.ctx.createBufferSource();
      skidNoise.buffer = noiseBuffer;
      skidNoise.loop = true;

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = "bandpass";
      this.skidFilter.frequency.setValueAtTime(1250, this.ctx.currentTime);
      this.skidFilter.Q.setValueAtTime(4.2, this.ctx.currentTime);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

      skidNoise.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.ctx.destination);
      skidNoise.start();

      // Nitro Jet Noise Chain
      const nitroNoise = this.ctx.createBufferSource();
      nitroNoise.buffer = noiseBuffer;
      nitroNoise.loop = true;

      this.nitroFilter = this.ctx.createBiquadFilter();
      this.nitroFilter.type = "lowpass";
      this.nitroFilter.frequency.setValueAtTime(950, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

      nitroNoise.connect(this.nitroFilter);
      this.nitroFilter.connect(this.nitroGain);
      this.nitroGain.connect(this.ctx.destination);
      nitroNoise.start();

      // Wind Turbulence Noise Chain
      const windNoise = this.ctx.createBufferSource();
      windNoise.buffer = noiseBuffer;
      windNoise.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = "lowpass";
      windFilter.frequency.setValueAtTime(550, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

      windNoise.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(this.ctx.destination);
      windNoise.start();

      this.isInitialized = true;
    } catch {
      // AudioContext waiting for browser gesture
    }
  }

  public resume() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public updateCarSound(speed: number, maxSpeed: number, isThrottle: boolean, isNitro: boolean) {
    if (!this.isInitialized || !this.ctx || this.isMuted) {
      if (this.engineMasterGain && this.ctx) {
        this.engineMasterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }

    const absSpeed = Math.abs(speed);
    const speedRatio = Math.min(1.2, absSpeed / maxSpeed);

    // Realistic RPM curves with gear shifting simulation
    const gearRatios = [0.25, 0.45, 0.7, 0.92, 1.15];
    let currentRatio = speedRatio;
    for (const g of gearRatios) {
      if (speedRatio < g) {
        currentRatio = (speedRatio / g) * 0.9;
        break;
      }
    }

    const baseFreq = 42 + currentRatio * 160 + (isThrottle ? 22 : 0) + (isNitro ? 50 : 0);
    this.oscSub?.frequency.setTargetAtTime(baseFreq * 0.65, this.ctx.currentTime, 0.06);
    this.oscMain?.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.06);
    this.oscHarmonic?.frequency.setTargetAtTime(baseFreq * 2.05, this.ctx.currentTime, 0.06);

    const filterCutoff = 300 + currentRatio * 1800 + (isNitro ? 1000 : 0);
    this.engineFilter?.frequency.setTargetAtTime(filterCutoff, this.ctx.currentTime, 0.06);

    const targetGain = Math.min(0.24, 0.07 + speedRatio * 0.12 + (isThrottle ? 0.04 : 0));
    this.engineMasterGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);

    // Wind turbulence based on high speed
    const windTarget = speedRatio > 0.45 ? (speedRatio - 0.45) * 0.15 : 0;
    this.windGain?.gain.setTargetAtTime(windTarget, this.ctx.currentTime, 0.08);
  }

  public updateDrift(isDrifting: boolean, speed: number) {
    if (!this.isInitialized || !this.ctx || this.isMuted) {
      if (this.skidGain && this.ctx) {
        this.skidGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }
    const skidTarget = isDrifting && Math.abs(speed) > 8 ? 0.18 : 0;
    this.skidGain?.gain.setTargetAtTime(skidTarget, this.ctx.currentTime, 0.07);
  }

  public updateNitro(isBoosting: boolean) {
    if (!this.isInitialized || !this.ctx || this.isMuted) {
      if (this.nitroGain && this.ctx) {
        this.nitroGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }
    const target = isBoosting ? 0.22 : 0;
    this.nitroGain?.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  public playCheckpointBeep(isStartFinish = false) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      const freq = isStartFinish ? 1046.5 : 783.99; // C6 or G5
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.24);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  public playBarrierImpact() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, this.ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {}
  }

  public playVictoryHorn() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;
    try {
      const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
      arpeggio.forEach((note, idx) => {
        const time = this.ctx!.currentTime + idx * 0.1;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note, time);
        gain.gain.setValueAtTime(0.24, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(time);
        osc.stop(time + 0.55);
      });
    } catch {}
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("race_audio_muted", String(this.isMuted));
    }
    if (this.isMuted && this.ctx) {
      this.engineMasterGain?.gain.setValueAtTime(0, this.ctx.currentTime);
      this.skidGain?.gain.setValueAtTime(0, this.ctx.currentTime);
      this.nitroGain?.gain.setValueAtTime(0, this.ctx.currentTime);
      this.windGain?.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

export const raceAudio = new RaceAudioSystem();
