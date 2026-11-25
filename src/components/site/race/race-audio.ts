/**
 * Horizon Grand Prix — Zero-Leak Procedural Web Audio Synthesizer
 * Guarantees ZERO background sound leakage when exiting race, navigating pages, or hiding tab:
 * - All continuous & one-shot nodes route exclusively through a single `masterBusGain` -> `destination`
 * - Strict `sessionActive` lock stops stale frame ticks or post-exit chimes immediately
 * - `endSession()` zeroes all gains, clears pending timers, and suspends `AudioContext`
 * - Automatic global `visibilitychange` & `pagehide` listeners
 */

export class RaceAudioSystem {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private sessionActive = false;
  private globalHooksBound = false;
  private victoryStopTimer: number | null = null;
  public isMuted = false;

  // Master safety gate bus
  private masterBusGain: GainNode | null = null;

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

  private lastKerbAt = 0;
  private lastThrottle = false;
  private lastGear = "1";

  constructor() {
    if (typeof window !== "undefined") {
      this.isMuted = localStorage.getItem("race_audio_muted") === "true";
      this.bindGlobalLifecycleHooks();
    }
  }

  private bindGlobalLifecycleHooks() {
    if (this.globalHooksBound || typeof window === "undefined") return;
    this.globalHooksBound = true;

    const onHide = () => {
      if (document.hidden) {
        this.silenceAndSuspend(false);
      } else if (this.sessionActive && !this.isMuted) {
        this.resume();
      }
    };

    const onUnload = () => {
      this.endSession();
    };

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onUnload);
    window.addEventListener("beforeunload", onUnload);
  }

  private makeDistortionCurve(amount = 22): Float32Array {
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
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();

      this.masterBusGain = this.ctx.createGain();
      this.masterBusGain.gain.setValueAtTime(
        this.isMuted || !this.sessionActive ? 0 : 1,
        this.ctx.currentTime
      );
      this.masterBusGain.connect(this.ctx.destination);

      this.engineMasterGain = this.ctx.createGain();
      this.engineMasterGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = "lowpass";
      this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3.6, this.ctx.currentTime);

      this.engineDistortion = this.ctx.createWaveShaper();
      this.engineDistortion.curve = this.makeDistortionCurve(
        20
      ) as unknown as Float32Array<ArrayBuffer>;
      this.engineDistortion.oversample = "2x";

      this.oscSub = this.ctx.createOscillator();
      this.oscMain = this.ctx.createOscillator();
      this.oscHarmonic = this.ctx.createOscillator();
      this.oscTurbo = this.ctx.createOscillator();

      this.oscSub.type = "sine";
      this.oscMain.type = "sawtooth";
      this.oscHarmonic.type = "triangle";
      this.oscTurbo.type = "sine";

      this.oscSub.frequency.setValueAtTime(40, this.ctx.currentTime);
      this.oscMain.frequency.setValueAtTime(80, this.ctx.currentTime);
      this.oscHarmonic.frequency.setValueAtTime(160, this.ctx.currentTime);
      this.oscTurbo.frequency.setValueAtTime(1800, this.ctx.currentTime);

      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.oscTurbo.connect(this.turboGain);
      this.turboGain.connect(this.engineMasterGain);

      this.oscSub.connect(this.engineFilter);
      this.oscMain.connect(this.engineFilter);
      this.oscHarmonic.connect(this.engineFilter);

      this.engineFilter.connect(this.engineDistortion);
      this.engineDistortion.connect(this.engineMasterGain);
      this.engineMasterGain.connect(this.masterBusGain);

      this.oscSub.start();
      this.oscMain.start();
      this.oscHarmonic.start();
      this.oscTurbo.start();

      const bufferLength = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(
        1,
        bufferLength,
        this.ctx.sampleRate
      );
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferLength; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      // Skid Noise
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
      this.skidGain.connect(this.masterBusGain);
      skidNoise.start();

      // Nitro Noise + Sub
      const nitroNoise = this.ctx.createBufferSource();
      nitroNoise.buffer = noiseBuffer;
      nitroNoise.loop = true;

      this.nitroFilter = this.ctx.createBiquadFilter();
      this.nitroFilter.type = "lowpass";
      this.nitroFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.nitroSubOsc = this.ctx.createOscillator();
      this.nitroSubOsc.type = "sawtooth";
      this.nitroSubOsc.frequency.setValueAtTime(55, this.ctx.currentTime);
      this.nitroSubGain = this.ctx.createGain();
      this.nitroSubGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.nitroSubOsc.connect(this.nitroSubGain);
      this.nitroSubGain.connect(this.masterBusGain);
      this.nitroSubOsc.start();

      nitroNoise.connect(this.nitroFilter);
      this.nitroFilter.connect(this.nitroGain);
      this.nitroGain.connect(this.masterBusGain);
      nitroNoise.start();

      // Wind Noise
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
      this.windGain.connect(this.masterBusGain);
      windNoise.start();

      this.isInitialized = true;
    } catch {
      // Waiting for user gesture
    }
  }

  private zeroGain(node: GainNode | null) {
    if (!node || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (typeof node.gain.cancelAndHoldAtTime === "function") {
        node.gain.cancelAndHoldAtTime(now);
      } else {
        node.gain.cancelScheduledValues(0);
      }
      node.gain.setValueAtTime(0, now);
    } catch {}
  }

  private clearVictoryTimer() {
    if (this.victoryStopTimer !== null && typeof window !== "undefined") {
      window.clearTimeout(this.victoryStopTimer);
      this.victoryStopTimer = null;
    }
  }

  /** Activate a race audio session */
  public startSession() {
    this.clearVictoryTimer();
    this.sessionActive = true;
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx) {
      if (this.ctx.state === "suspended" && !this.isMuted) {
        this.ctx.resume().catch(() => {});
      }
      if (this.masterBusGain) {
        const now = this.ctx.currentTime;
        this.masterBusGain.gain.cancelScheduledValues(0);
        this.masterBusGain.gain.setValueAtTime(this.isMuted ? 0 : 1, now);
      }
    }
  }

  /** Resume AudioContext ONLY when inside an active race session */
  public resume() {
    if (!this.sessionActive) return;
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended" && !this.isMuted) {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && this.masterBusGain && !this.isMuted) {
      this.masterBusGain.gain.setValueAtTime(1, this.ctx.currentTime);
    }
  }

  /** Zero all continuous engine/skid/nitro/wind loops immediately */
  public stopCarLoops() {
    this.zeroGain(this.engineMasterGain);
    this.zeroGain(this.turboGain);
    this.zeroGain(this.skidGain);
    this.zeroGain(this.nitroGain);
    this.zeroGain(this.nitroSubGain);
    this.zeroGain(this.windGain);
  }

  private silenceAndSuspend(endSess: boolean) {
    if (endSess) {
      this.sessionActive = false;
      this.clearVictoryTimer();
    }
    if (!this.ctx) return;
    try {
      this.zeroGain(this.masterBusGain);
      this.stopCarLoops();
      if (this.ctx.state === "running") {
        this.ctx.suspend().catch(() => {});
      }
    } catch {}
  }

  /** Stop all audio & suspend WebAudio hardware thread */
  public stopAll(suspendContext = true) {
    this.silenceAndSuspend(suspendContext);
  }

  /** End session cleanly on exit/navigation so ZERO sound leaks anywhere else on site */
  public endSession() {
    this.silenceAndSuspend(true);
  }

  private canEmit(): boolean {
    return Boolean(
      this.sessionActive &&
        this.isInitialized &&
        this.ctx &&
        this.masterBusGain &&
        !this.isMuted &&
        this.ctx.state === "running"
    );
  }

  public updateCarSound(
    speed: number,
    maxSpeed: number,
    isThrottle: boolean,
    isNitro: boolean
  ) {
    if (!this.canEmit() || !this.ctx) {
      if (this.engineMasterGain && this.ctx) {
        this.zeroGain(this.engineMasterGain);
      }
      return;
    }

    const absSpeed = Math.abs(speed);
    const speedRatio = Math.min(1.25, absSpeed / maxSpeed);

    const gearRatios = [0.22, 0.42, 0.65, 0.9, 1.25];
    let currentRatio = speedRatio;
    let gearIndex = 1;
    for (let i = 0; i < gearRatios.length; i++) {
      if (speedRatio < gearRatios[i]!) {
        currentRatio = (speedRatio / gearRatios[i]!) * 0.95;
        gearIndex = i + 1;
        break;
      }
    }

    const currentGearStr = String(gearIndex);
    if (
      (this.lastThrottle && !isThrottle && absSpeed > 18) ||
      (currentGearStr !== this.lastGear && absSpeed > 22)
    ) {
      this.playExhaustPop();
    }
    this.lastThrottle = isThrottle;
    this.lastGear = currentGearStr;

    const baseFreq =
      46 + currentRatio * 190 + (isThrottle ? 30 : 0) + (isNitro ? 68 : 0);
    const t = this.ctx.currentTime;
    this.oscSub?.frequency.setTargetAtTime(baseFreq * 0.58, t, 0.045);
    this.oscMain?.frequency.setTargetAtTime(baseFreq, t, 0.045);
    this.oscHarmonic?.frequency.setTargetAtTime(baseFreq * 2.08, t, 0.045);

    const turboFreq = 1650 + speedRatio * 2300 + (isThrottle ? 550 : 0);
    this.oscTurbo?.frequency.setTargetAtTime(turboFreq, t, 0.07);
    const turboVolume =
      isThrottle && speedRatio > 0.25
        ? Math.min(0.055, (speedRatio - 0.25) * 0.075)
        : 0;
    this.turboGain?.gain.setTargetAtTime(turboVolume, t, 0.07);

    const filterCutoff = 380 + currentRatio * 2250 + (isNitro ? 1400 : 0);
    this.engineFilter?.frequency.setTargetAtTime(filterCutoff, t, 0.045);

    const targetGain = Math.min(
      0.26,
      0.065 + speedRatio * 0.135 + (isThrottle ? 0.045 : 0)
    );
    this.engineMasterGain?.gain.setTargetAtTime(targetGain, t, 0.04);

    const windTarget = speedRatio > 0.42 ? (speedRatio - 0.42) * 0.16 : 0;
    this.windGain?.gain.setTargetAtTime(windTarget, t, 0.08);
  }

  public updateDrift(isDrifting: boolean, speed: number) {
    if (!this.canEmit() || !this.ctx) {
      if (this.skidGain && this.ctx) this.zeroGain(this.skidGain);
      return;
    }
    const skidTarget = isDrifting && Math.abs(speed) > 10 ? 0.21 : 0;
    this.skidGain?.gain.setTargetAtTime(skidTarget, this.ctx.currentTime, 0.05);
    if (isDrifting && this.skidFilter) {
      const freq = 1220 + Math.random() * 420;
      this.skidFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.03);
    }
  }

  public updateNitro(isBoosting: boolean) {
    if (!this.canEmit() || !this.ctx) {
      if (this.ctx) {
        this.zeroGain(this.nitroGain);
        this.zeroGain(this.nitroSubGain);
      }
      return;
    }
    const t = this.ctx.currentTime;
    this.nitroGain?.gain.setTargetAtTime(isBoosting ? 0.26 : 0, t, 0.04);
    this.nitroSubGain?.gain.setTargetAtTime(isBoosting ? 0.16 : 0, t, 0.04);
  }

  public playKerbRumble(speed: number) {
    if (!this.canEmit() || !this.ctx || !this.masterBusGain) return;
    const nowMs = performance.now();
    if (nowMs - this.lastKerbAt < 65 || Math.abs(speed) < 12) return;
    this.lastKerbAt = nowMs;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(95, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(48, this.ctx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.masterBusGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.055);
    } catch {}
  }

  public playCountdownBeep(isGo = false) {
    if (!this.sessionActive || this.isMuted) return;
    if (!this.isInitialized) this.init();
    if (!this.ctx || !this.masterBusGain) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(isGo ? 1046.5 : 523.25, t);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (isGo ? 0.42 : 0.18));
      osc.connect(gain);
      gain.connect(this.masterBusGain);
      osc.start(t);
      osc.stop(t + (isGo ? 0.45 : 0.2));
    } catch {}
  }

  public playExhaustPop() {
    if (!this.canEmit() || !this.ctx || !this.masterBusGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(145 + Math.random() * 60, t);
      osc.frequency.exponentialRampToValueAtTime(32, t + 0.08);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(gain);
      gain.connect(this.masterBusGain);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch {}
  }

  public playCheckpointBeep(isStartFinish = false) {
    if (!this.canEmit() || !this.ctx || !this.masterBusGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      const freq = isStartFinish ? 1174.66 : 880;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.45, t + 0.1);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.masterBusGain);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }

  public playBarrierImpact() {
    if (!this.canEmit() || !this.ctx || !this.masterBusGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(210, t);
      osc.frequency.exponentialRampToValueAtTime(36, t + 0.16);
      gain.gain.setValueAtTime(0.26, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.masterBusGain);
      osc.start(t);
      osc.stop(t + 0.22);
    } catch {}
  }

  public playSpeedPadWhoosh() {
    if (!this.canEmit() || !this.ctx || !this.masterBusGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(1250, t + 0.16);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
      osc.connect(gain);
      gain.connect(this.masterBusGain);
      osc.start(t);
      osc.stop(t + 0.28);
    } catch {}
  }

  public playOvertakeChime() {
    if (!this.canEmit() || !this.ctx || !this.masterBusGain) return;
    try {
      const notes = [659.25, 880, 1046.5];
      notes.forEach((freq, i) => {
        const time = this.ctx!.currentTime + i * 0.065;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
        osc.connect(gain);
        gain.connect(this.masterBusGain!);
        osc.start(time);
        osc.stop(time + 0.24);
      });
    } catch {}
  }

  /** Play brief victory fanfare then automatically end audio session */
  public playFinishFanfareAndStop() {
    this.stopCarLoops();
    if (!this.canEmit() || !this.ctx || !this.masterBusGain) {
      this.endSession();
      return;
    }
    try {
      const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      arpeggio.forEach((note, idx) => {
        const time = this.ctx!.currentTime + idx * 0.08;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note, time);
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.36);
        osc.connect(gain);
        gain.connect(this.masterBusGain!);
        osc.start(time);
        osc.stop(time + 0.4);
      });
      this.sessionActive = false;
      this.clearVictoryTimer();
      this.victoryStopTimer = window.setTimeout(() => {
        this.endSession();
      }, 750);
    } catch {
      this.endSession();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("race_audio_muted", String(this.isMuted));
    }
    if (this.isMuted) {
      this.silenceAndSuspend(false);
    } else if (this.sessionActive) {
      this.resume();
    }
    return this.isMuted;
  }
}

export const raceAudio = new RaceAudioSystem();
