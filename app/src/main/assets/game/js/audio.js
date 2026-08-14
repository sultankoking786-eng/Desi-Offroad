/**
 * Desi Offroad — Audio Engine (Web Audio API Synthesizer)
 * Realistic synthesized vehicle engine RPM, Desi multi-tone truck horn,
 * tire skids, mud splashes, crash thuds, rain, and rural ambient.
 */
class DesiAudioEngine {
    constructor() {
        this.ctx = null;
        this.soundVolume = 0.8;
        this.musicVolume = 0.6;
        this.isMuted = false;
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineGain = null;
        this.engineFilter = null;
        this.ambientGain = null;
        this.isEngineRunning = false;
        this.init();
    }

    init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.ctx = new AudioContext();
        }
    }

    resumeContext() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolumes(soundVol, musicVol) {
        this.soundVolume = Math.max(0, Math.min(1, soundVol));
        this.musicVolume = Math.max(0, Math.min(1, musicVol));
        if (this.engineGain) {
            this.engineGain.gain.setValueAtTime(this.soundVolume * 0.25, this.ctx.currentTime);
        }
        if (this.ambientGain) {
            this.ambientGain.gain.setValueAtTime(this.musicVolume * 0.15, this.ctx.currentTime);
        }
    }

    startEngine() {
        if (!this.ctx || this.isEngineRunning) return;
        this.resumeContext();

        try {
            const now = this.ctx.currentTime;
            this.engineOsc1 = this.ctx.createOscillator();
            this.engineOsc2 = this.ctx.createOscillator();
            this.engineGain = this.ctx.createGain();
            this.engineFilter = this.ctx.createBiquadFilter();

            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'triangle';

            this.engineOsc1.frequency.setValueAtTime(45, now);
            this.engineOsc2.frequency.setValueAtTime(90, now);

            this.engineFilter.type = 'lowpass';
            this.engineFilter.frequency.setValueAtTime(320, now);

            this.engineGain.gain.setValueAtTime(this.soundVolume * 0.25, now);

            this.engineOsc1.connect(this.engineFilter);
            this.engineOsc2.connect(this.engineFilter);
            this.engineFilter.connect(this.engineGain);
            this.engineGain.connect(this.ctx.destination);

            this.engineOsc1.start();
            this.engineOsc2.start();
            this.isEngineRunning = true;
        } catch (e) {
            console.log('Audio init error', e);
        }
    }

    updateEngineRPM(rpmPct, speed) {
        if (!this.ctx || !this.isEngineRunning) return;
        const now = this.ctx.currentTime;
        const baseFreq = 40 + rpmPct * 110 + (speed * 0.4);
        const filterFreq = 280 + rpmPct * 500;

        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.8, now, 0.05);
        this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.05);
    }

    stopEngine() {
        if (!this.isEngineRunning) return;
        try {
            this.engineOsc1?.stop();
            this.engineOsc2?.stop();
            this.isEngineRunning = false;
        } catch (e) {}
    }

    /**
     * Famous Desi Melodic Multi-Tone Horn ("Pee-Poo-Pee" Indian truck/jeep horn)
     */
    playDesiHorn() {
        if (!this.ctx || this.soundVolume <= 0) return;
        this.resumeContext();

        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
        const timing = [0, 0.12, 0.24, 0.36];
        const duration = 0.14;

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = this.ctx.currentTime + timing[idx];

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(this.soundVolume * 0.45, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + duration);
        });
    }

    playCrashSound(intensity = 1.0) {
        if (!this.ctx || this.soundVolume <= 0) return;
        this.resumeContext();

        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.06));
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400 * intensity, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.soundVolume * 0.6 * Math.min(1.5, intensity), now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        whiteNoise.start(now);
    }

    playMudSplash() {
        if (!this.ctx || this.soundVolume <= 0) return;
        this.resumeContext();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);

        gain.gain.setValueAtTime(this.soundVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    playButtonClick() {
        if (!this.ctx || this.soundVolume <= 0) return;
        this.resumeContext();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(this.soundVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    playVictoryJingle() {
        if (!this.ctx || this.soundVolume <= 0) return;
        this.resumeContext();

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = this.ctx.currentTime + idx * 0.15;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(this.soundVolume * 0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.4);
        });
    }
}

window.DesiAudio = new DesiAudioEngine();
