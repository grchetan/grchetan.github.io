/**
 * Horizon Grand Prix — Realistic Racing Engine & Exhaust Web Audio Synthesizer
 * Features:
 * - Clean multi-cylinder firing-order harmonic stack (warm fundamental + 2x + 3x + subtle 4x detune)
 *   without harsh nasal filter Q or buzzy clipping
 * - Authentic 6-speed sequential gearbox RPM sweep & crisp upshift turbo flutter
 * - Realistic asphalt tire squeal, smooth turbo spool, kerb clatter & wind rush
 * - 100% Zero-Leak masterBusGain + sessionActive lock + suspend on exit/tab hide
 */

export class RaceAudioSystem {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private sessionActive = false;
  private globalHooksBound = false;
  private victoryStopTimer: number | null = null;
  public isMuted = false;

  private masterBusGain: GainNode | null = null;

  // Clean Multi-Cylinder Engine Nodes
  private engineMasterGain: GainNode | null = null;
  private oscFund: OscillatorNode | null = null;
  private oscSecond: OscillatorNode | null = null;
  private oscThird: OscillatorNode | null = null;
  private oscFourth: OscillatorNode | null = null;
  private oscTurbo: OscillatorNode | null = null;
  private turboGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private exhaustBodyFilter: BiquadFilterNode | null = null;

  // Tire Skid Noise
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;

  // Nitro Jet Nodes
  private nitroGain: GainNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;

  // Wind Turbulence
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

      // Smooth warm exhaust shaping (no harsh nasal resonance)
      this.exhaustBodyFilter = this.ctx.createBiquadFilter();
      this.exhaustBodyFilter.type = "peaking";
      this.exhaustBodyFilter.frequency.setValueAtTime(160, this.ctx.currentTime);
      this.exhaustBodyFilter.Q.setValueAtTime(0.9, this.ctx.currentTime);
      this.exhaustBodyFilter.gain.setValueAtTime(5.5, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = "lowpass";
      this.engineFilter.frequency.setValueAtTime(520, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(0.75, this.ctx.currentTime);

      // 4-Harmonic Supercar Firing-Order Engine Stack
      this.oscFund = this.ctx.createOscillator();
      this.oscSecond = this.ctx.createOscillator();
      this.oscThird = this.ctx.createOscillator();
      this.oscFourth = this.ctx.createOscillator();
      this.oscTurbo = this.ctx.createOscillator();

      this.oscFund.type = "triangle";
      this.oscSecond.type = "sawtooth";
      this.oscThird.type = "triangle";
      this.oscFourth.type = "sawtooth";
      this.oscTurbo.type = "sine";

      const gainFund = this.ctx.createGain();
      const gainSecond = this.ctx.createGain();
      const gainThird = this.ctx.createGain();
      const gainFourth = this.ctx.createGain();
      gainFund.gain.value = 0.55;
      gainSecond.gain.value = 0.24;
      gainThird.gain.value = 0.16;
      gainFourth.gain.value = 0.08;

      this.oscFund.connect(gainFund);
      this.oscSecond.connect(gainSecond);
      this.oscThird.connect(gainThird);
      this.oscFourth.connect(gainFourth);

      gainFund.connect(this.exhaustBodyFilter);
      gainSecond.connect(this.exhaustBodyFilter);
      gainThird.connect(this.exhaustBodyFilter);
      gainFourth.connect(this.exhaustBodyFilter);

      this.exhaustBodyFilter.connect(this.engineFilter);
      this.engineFilter.connect(this.engineMasterGain);
      this.engineMasterGain.connect(this.masterBusGain);

      // Subtle clean turbo spool
      this.turboGain = this.ctx.createGain();
      this.turboGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.oscTurbo.connect(this.turboGain);
      this.turboGain.connect(this.masterBusGain);

      this.oscFund.start();
      this.oscSecond.start();
      this.oscThird.start();
      this.oscFourth.start();
      this.oscTurbo.start();

      // White Noise Buffer for Tire Squeal, Nitro Jet & Wind
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

      // Tire Skid Squeal
      const skidNoise = this.ctx.createBufferSource();
      skidNoise.buffer = noiseBuffer;
      skidNoise.loop = true;

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = "bandpass";
      this.skidFilter.frequency.setValueAtTime(1150, this.ctx.currentTime);
      this.skidFilter.Q.setValueAtTime(7.0, this.ctx.currentTime);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

      skidNoise.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.masterBusGain);
      skidNoise.start();

      // Nitro Jet Whoosh
      const nitroNoise = this.ctx.createBufferSource();
      nitroNoise.buffer = noiseBuffer;
      nitroNoise.loop = true;

      this.nitroFilter = this.ctx.createBiquadFilter();
      this.nitroFilter.type = "bandpass";
      this.nitroFilter.frequency.setValueAtTime(750, this.ctx.currentTime);
      this.nitroFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.nitroGain = this.ctx.createGain();
      this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

      nitroNoise.connect(this.nitroFilter);
      this.nitroFilter.connect(this.nitroGain);
      this.nitroGain.connect(this.masterBusGain);
      nitroNoise.start();

      // Wind Air Rush
      const windNoise = this.ctx.createBufferSource();
      windNoise.buffer = noiseBuffer;
      windNoise.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = "lowpass";
      windFilter.frequency.setValueAtTime(420, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

      windNoise.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(this.masterBusGain);
      windNoise.start();

      this.isInitialized = true;
    } catch {
      // Waiting for gesture
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

  public stopCarLoops() {
    this.zeroGain(this.engineMasterGain);
    this.zeroGain(this.turboGain);
    this.zeroGain(this.skidGain);
    this.zeroGain(this.nitroGain);
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

  public stopAll(suspendContext = true) {
    this.silenceAndSuspend(suspendContext);
  }

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

    // Realistic 6-speed sequential gearbox RPM curve
    const gearBounds = [0, 0.21, 0.42, 0.63, 0.82, 1.0, 1.3];
    let gearIndex = 1;
    let rpmRatio = 0.15;
    for (let i = 0; i < gearBounds.length - 1; i++) {
      if (speedRatio <= gearBounds[i + 1]!) {
        gearIndex = i + 1;
        const span = gearBounds[i + 1]! - gearBounds[i]!;
        const localPos = (speedRatio - gearBounds[i]!) / (span || 1);
        rpmRatio = i === 0 ? Math.max(0.15, localPos) : 0.36 + localPos * 0.64;
        break;
      }
    }

    const currentGearStr = String(gearIndex);
    if (
      (this.lastThrottle && !isThrottle && absSpeed > 18) ||
      (currentGearStr !== this.lastGear && absSpeed > 18)
    ) {
      this.playExhaustPop();
    }
    this.lastThrottle = isThrottle;
    this.lastGear = currentGearStr;

    // Realistic V8 / Flat-plane pitch (idle ~42Hz -> redline ~185Hz)
    const fundamental =
      42 + rpmRatio * 138 + (isThrottle ? 14 : 0) + (isNitro ? 24 : 0);
    const t = this.ctx.currentTime;

    this.oscFund?.frequency.setTargetAtTime(fundamental, t, 0.04);
    this.oscSecond?.frequency.setTargetAtTime(fundamental * 1.995, t, 0.04);
    this.oscThird?.frequency.setTargetAtTime(fundamental * 3.01, t, 0.04);
    this.oscFourth?.frequency.setTargetAtTime(fundamental * 4.02, t, 0.04);

    // Subtle crisp turbocharger whistle on throttle
    const turboFreq = 1850 + rpmRatio * 1700 + (isNitro ? 650 : 0);
    this.oscTurbo?.frequency.setTargetAtTime(turboFreq, t, 0.07);
    const turboVol =
      isThrottle && speedRatio > 0.28 ? Math.min(0.032, rpmRatio * 0.035) : 0;
    this.turboGain?.gain.setTargetAtTime(turboVol, t, 0.07);

    // Smooth intake filter sweep
    const cutoff = 320 + rpmRatio * 1450 + (isThrottle ? 260 : 0) + (isNitro ? 550 : 0);
    this.engineFilter?.frequency.setTargetAtTime(cutoff, t, 0.045);

    const targetGain = Math.min(
      0.28,
      0.07 + rpmRatio * 0.14 + (isThrottle ? 0.05 : 0)
    );
    this.engineMasterGain?.gain.setTargetAtTime(targetGain, t, 0.04);

    const windTarget = speedRatio > 0.48 ? (speedRatio - 0.48) * 0.11 : 0;
    this.windGain?.gain.setTargetAtTime(windTarget, t, 0.08);
  }

  public updateDrift(isDrifting: boolean, speed: number) {
    if (!this.canEmit() || !this.ctx) {
      if (this.skidGain && this.ctx) this.zeroGain(this.skidGain);
      return;
    }
    const skidTarget = isDrifting && Math.abs(speed) > 12 ? 0.15 : 0;
    this.skidGain?.gain.setTargetAtTime(skidTarget, this.ctx.currentTime, 0.05);
    if (isDrifting && this.skidFilter) {
      const freq = 1050 + Math.random() * 320;
      this.skidFilter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.03);
    }
  }

  public updateNitro(isBoosting: boolean) {
    if (!this.canEmit() || !this.ctx) {
      if (this.ctx) this.zeroGain(this.nitroGain);
      return;
    }
    const t = this.ctx.currentTime;
    this.nitroGain?.gain.setTargetAtTime(isBoosting ? 0.16 : 0, t, 0.05);
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
      osc.frequency.setValueAtTime(92, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(44, this.ctx.currentTime + 0.045);
      gain.gain.setValueAtTime(0.075, this.ctx.currentTime);
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
      gain.gain.setValueAtTime(0.22, t);
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
      osc.type = "triangle";
      osc.frequency.setValueAtTime(115 + Math.random() * 45, t);
      osc.frequency.exponentialRampToValueAtTime(34, t + 0.075);
      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.085);
      osc.connect(gain);
      gain.connect(this.masterBusGain);
      osc.start(t);
      osc.stop(t + 0.095);
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
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, t + 0.09);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterBusGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  public playBarrierImpact() {
    if (!this.canEmit() || !this.ctx || !this.masterBusGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(36, t + 0.15);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterBusGain);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch {}
  }

  public playSpeedPadWhoosh() {
    if (!this.canEmit() || !this.ctx || !this.masterBusGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(1100, t + 0.15);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      osc.connect(gain);
      gain.connect(this.masterBusGain);
      osc.start(t);
      osc.stop(t + 0.26);
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
        gain.gain.setValueAtTime(0.16, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.connect(gain);
        gain.connect(this.masterBusGain!);
        osc.start(time);
        osc.stop(time + 0.22);
      });
    } catch {}
  }

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
        gain.gain.setValueAtTime(0.18, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        osc.connect(gain);
        gain.connect(this.masterBusGain!);
        osc.start(time);
        osc.stop(time + 0.38);
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
