/**
 * Cyber Circuit — High-Performance Procedural Web Audio Engine
 * Features:
 * - V8 Twin-Turbo Engine Synthesizer with sub-bass growl, mechanical buzz & turbo whistle
 * - Exhaust crackles and pops on throttle lift & gear shifts
 * - Intense tire screeching sound with frequency modulation for drifts & hard turns
 * - Afterburner nitro rocket roar with deep sub-bass drop
 * - Metallic barrier impact crunch & victory arpeggios
 * - 100% procedural Web Audio API with zero external file dependencies
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
  private oscTurbo: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineDistortion: WaveShaperNode | null = null;

  // Drift skid noise nodes
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;

  // Nitro boost sound nodes
  private nitroGain: GainNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;
  private nitroSubOsc: OscillatorNode | null = null;
  private nitroSubGain: GainNode | null = null;

  // Wind turbulence noise nodes
  private windGain: GainNode | null = null;

  // Throttle state tracker for pops & crackles
  private lastThrottle = false;
  private lastGear = "1";

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("race_audio_muted") === "true";
    }
  }

  private makeDistortionCurve(amount = 25): Float32Array {
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
      this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.8, this.ctx.currentTime);

      // Warm analog distortion
      this.engineDistortion = this.ctx.createWaveShaper();
      this.engineDistortion.curve = this.makeDistortionCurve(22) as unknown as Float32Array<ArrayBuffer>;
      this.engineDistortion.oversample = "2x";

      // 4 Oscillators for deep V8 engine harmonics
      this.oscSub = this.ctx.createOscillator();
      this.oscMain = this.ctx.createOscillator();
      this.oscHarmonic = this.ctx.createOscillator();
      this.oscTurbo = this.ctx.createOscillator();

      this.oscSub.type = "sine";
      this.oscMain.type = "sawtooth";
      this.oscHarmonic.type = "triangle";
      this.oscTurbo.type = "sine"; // High-pitched turbo whistle

      this.oscSub.frequency.setValueAtTime(40, this.ctx.currentTime);
      this.oscMain.frequency.setValueAtTime(80, this.ctx.currentTime);
      this.oscHarmonic.frequency.setValueAtTime(160, this.ctx.currentTime);
      this.oscTurbo.frequency.setValueAtTime(1800, this.ctx.currentTime);

      // Turbo whistle gain node
      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.oscTurbo.connect(this.turboGain);
      this.turboGain.connect(this.engineMasterGain);

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
      this.oscTurbo.start();

      // Procedural White Noise Buffer
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
      this.skidFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      this.skidFilter.Q.setValueAtTime(5.5, this.ctx.currentTime);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

      skidNoise.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.ctx.destination);
      skidNoise.start();

      // Nitro Jet Noise Chain with Sub-Bass Roar
      const nitroNoise = this.ctx.createBufferSource();
      nitroNoise.buffer = noiseBuffer;
      nitroNoise.loop = true;

      this.nitroFilter = this.ctx.createBiquadFilter();
      this.nitroFilter.type = "lowpass";
      this.nitroFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

      // Nitro Sub Bass Oscillator for deep rocket rumble
      this.nitroSubOsc = this.ctx.createOscillator();
      this.nitroSubOsc.type = "sawtooth";
      this.nitroSubOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.nitroSubGain = this.ctx.createGain();
      this.nitroSubGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.nitroSubOsc.connect(this.nitroSubGain);
      this.nitroSubGain.connect(this.ctx.destination);
      this.nitroSubOsc.start();

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
      windFilter.frequency.setValueAtTime(600, this.ctx.currentTime);

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
    const speedRatio = Math.min(1.25, absSpeed / maxSpeed);

    // Dynamic 5-gear ratio curves
    const gearRatios = [0.24, 0.44, 0.68, 0.92, 1.2];
    let currentRatio = speedRatio;
    let gearIndex = 1;
    for (let i = 0; i < gearRatios.length; i++) {
      if (speedRatio < gearRatios[i]) {
        currentRatio = (speedRatio / gearRatios[i]) * 0.95;
        gearIndex = i + 1;
        break;
      }
    }

    // Trigger exhaust pops when lifting off throttle or shifting up
    const currentGearStr = String(gearIndex);
    if ((this.lastThrottle && !isThrottle && absSpeed > 15) || (currentGearStr !== this.lastGear && absSpeed > 20)) {
      this.playExhaustPop();
    }
    this.lastThrottle = isThrottle;
    this.lastGear = currentGearStr;

    // Pitch bends
    const baseFreq = 44 + currentRatio * 185 + (isThrottle ? 28 : 0) + (isNitro ? 65 : 0);
    this.oscSub?.frequency.setTargetAtTime(baseFreq * 0.6, this.ctx.currentTime, 0.05);
    this.oscMain?.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    this.oscHarmonic?.frequency.setTargetAtTime(baseFreq * 2.1, this.ctx.currentTime, 0.05);

    // Turbo whistle frequency scales with throttle & speed
    const turboFreq = 1600 + speedRatio * 2400 + (isThrottle ? 600 : 0);
    this.oscTurbo?.frequency.setTargetAtTime(turboFreq, this.ctx.currentTime, 0.08);
    const turboVolume = isThrottle && speedRatio > 0.25 ? Math.min(0.06, (speedRatio - 0.25) * 0.08) : 0;
    this.turboGain?.gain.setTargetAtTime(turboVolume, this.ctx.currentTime, 0.08);

    // Filter opening on acceleration
    const filterCutoff = 350 + currentRatio * 2200 + (isNitro ? 1400 : 0);
    this.engineFilter?.frequency.setTargetAtTime(filterCutoff, this.ctx.currentTime, 0.05);

    const targetGain = Math.min(0.28, 0.08 + speedRatio * 0.14 + (isThrottle ? 0.05 : 0));
    this.engineMasterGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.04);

    // Wind turbulence based on high speed
    const windTarget = speedRatio > 0.4 ? (speedRatio - 0.4) * 0.18 : 0;
    this.windGain?.gain.setTargetAtTime(windTarget, this.ctx.currentTime, 0.08);
  }

  public updateDrift(isDrifting: boolean, speed: number) {
    if (!this.isInitialized || !this.ctx || this.isMuted) {
      if (this.skidGain && this.ctx) {
        this.skidGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }
    const skidTarget = isDrifting && Math.abs(speed) > 9 ? 0.22 : 0;
    this.skidGain?.gain.setTargetAtTime(skidTarget, this.ctx.currentTime, 0.05);
    if (isDrifting && this.skidFilter) {
      // Dynamic screech pitch variation
      const freq = 1200 + Math.random() * 400;
      this.skidFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.03);
    }
  }

  public updateNitro(isBoosting: boolean) {
    if (!this.isInitialized || !this.ctx || this.isMuted) {
      if (this.nitroGain && this.ctx) {
        this.nitroGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      if (this.nitroSubGain && this.ctx) {
        this.nitroSubGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }
    const target = isBoosting ? 0.28 : 0;
    this.nitroGain?.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
    this.nitroSubGain?.gain.setTargetAtTime(isBoosting ? 0.18 : 0, this.ctx.currentTime, 0.04);
  }

  public playExhaustPop() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140 + Math.random() * 60, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }

  public playCheckpointBeep(isStartFinish = false) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      const freq = isStartFinish ? 1174.66 : 880; // D6 or A5
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.23);
    } catch {}
  }

  public playBarrierImpact() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.32, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.24);
    } catch {}
  }

  public playVictoryHorn() {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;
    try {
      const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      arpeggio.forEach((note, idx) => {
        const time = this.ctx!.currentTime + idx * 0.1;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note, time);
        gain.gain.setValueAtTime(0.25, time);
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
      this.nitroSubGain?.gain.setValueAtTime(0, this.ctx.currentTime);
      this.windGain?.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

export const raceAudio = new RaceAudioSystem();
