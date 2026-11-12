/**
 * DASI MMORPG - MÓDULO DE GAMEPLAY DE AÇÃO (CLIENT 3D NATIVO)
 * Controles de Teclado (WASD), Portais de Teleporte 3D, Sequência da Chaos Machine,
 * Efeito Visual e Sonoro de Level Up e Síntese de Áudio Harmônico.
 */

// ============================================================================
// 1. SÍNTESE DE ÁUDIO PROCEDURAL HARMÔNICA (WEB AUDIO API)
// ============================================================================
export class HarmonicAudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
  }

  init() {
    if (this.ctx) return true;
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return false;

      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return true;
    } catch (e) {
      console.warn('[HarmonicAudio] Falha ao inicializar áudio:', e);
      return false;
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0.0 : 0.85, this.ctx.currentTime);
    }
  }

  // 1.1 FANFARRA GLORIOSA DE LEVEL UP
  playLevelUpSound() {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Arpejo Ascendente Triunfante em Dó Maior (C4 -> G4 -> C5 -> E5 -> G5 -> C6)
    const notes = [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    const noteStep = 0.075;

    notes.forEach((freq, idx) => {
      const startTime = now + idx * noteStep;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.01, startTime + 0.35);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.7);
    });

    // Sino Celestial Agudo (Sustain de Ouro no clímax do arpejo)
    const climaxTime = now + notes.length * noteStep;
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(1567.98, climaxTime); // G6
    bellOsc.frequency.exponentialRampToValueAtTime(2093.0, climaxTime + 0.15); // C7

    bellGain.gain.setValueAtTime(0.35, climaxTime);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, climaxTime + 1.8);

    bellOsc.connect(bellGain);
    bellGain.connect(this.masterGain);
    bellOsc.start(climaxTime);
    bellOsc.stop(climaxTime + 1.85);

    // Impacto de Sub-Grave Dourado (Warm Aura Expansion)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130.81, now);
    subOsc.frequency.exponentialRampToValueAtTime(65.4, now + 0.5);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.85);
  }

  // 1.2 SEQUÊNCIA DE ÁUDIO DA CHAOS MACHINE
  playChaosPhaseSound(phase) {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    switch (phase) {
      case 'ignition': {
        // Catraca mecânica de engrenagens goblins acelerando
        for (let i = 0; i < 7; i++) {
          const t = now + i * 0.12 * Math.pow(0.85, i);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(160 + i * 40, t);
          osc.frequency.exponentialRampToValueAtTime(75, t + 0.04);

          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(t);
          osc.stop(t + 0.06);
        }
        break;
      }

      case 'surge': {
        // Zumbido oscilante de confinamento magnético e plasma
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(110, now);
        osc1.frequency.exponentialRampToValueAtTime(420, now + 1.2);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(220, now);
        osc2.frequency.exponentialRampToValueAtTime(840, now + 1.2);

        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.35);
        osc2.stop(now + 1.35);
        break;
      }

      case 'laser': {
        // Disparo e impacto do Raio de Fusão Solar
        const beamOsc = this.ctx.createOscillator();
        const beamGain = this.ctx.createGain();

        beamOsc.type = 'sawtooth';
        beamOsc.frequency.setValueAtTime(920, now);
        beamOsc.frequency.exponentialRampToValueAtTime(130, now + 0.25);
        beamOsc.frequency.exponentialRampToValueAtTime(45, now + 0.6);

        beamGain.gain.setValueAtTime(0.45, now);
        beamGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

        beamOsc.connect(beamGain);
        beamGain.connect(this.masterGain);
        beamOsc.start(now);
        beamOsc.stop(now + 0.75);
        break;
      }

      case 'success': {
        // Clímax Divino: Sino Sagrado Triunfante
        const s1 = this.ctx.createOscillator();
        const s2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        s1.type = 'sine';
        s1.frequency.setValueAtTime(587.33, now);
        s1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.1);
        s1.frequency.exponentialRampToValueAtTime(1760.0, now + 0.3);

        s2.type = 'triangle';
        s2.frequency.setValueAtTime(880.0, now);
        s2.frequency.exponentialRampToValueAtTime(1480.0, now + 0.25);

        g.gain.setValueAtTime(0.38, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        s1.connect(g);
        s2.connect(g);
        g.connect(this.masterGain);

        s1.start(now);
        s2.start(now);
        s1.stop(now + 1.45);
        s2.stop(now + 1.45);
        break;
      }

      case 'fail': {
        // Falha: Estrondo metálico abafado
        const fOsc = this.ctx.createOscillator();
        const fGain = this.ctx.createGain();

        fOsc.type = 'sawtooth';
        fOsc.frequency.setValueAtTime(240, now);
        fOsc.frequency.exponentialRampToValueAtTime(45, now + 0.45);

        fGain.gain.setValueAtTime(0.4, now);
        fGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        fOsc.connect(fGain);
        fGain.connect(this.masterGain);
        fOsc.start(now);
        fOsc.stop(now + 0.55);
        break;
      }
    }
  }

  // 1.3 VÓRTICE DIMENSIONAL DE PORTAL
  playPortalWarpSound(mapId = 'LORENCIA') {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Frequência base tonal de acordo com a atmosfera do mapa (8 Biomas Canônicos)
    const normalized = (mapId || '').toUpperCase();
    let baseFreq = 440; // Lorencia (Âmbar)
    if (normalized === 'NORIA' || normalized.startsWith('NOR')) baseFreq = 523.25; // Noria (Feywood C5)
    else if (normalized === 'DEVIAS' || normalized.startsWith('DEV')) baseFreq = 392.0; // Devias (Boreal G4)
    else if (normalized === 'DUNGEON' || normalized.startsWith('DNG')) baseFreq = 220.0; // Dungeon (Catacumbas A3)
    else if (normalized === 'LOST_TOWER' || normalized.startsWith('LT')) baseFreq = 164.81; // Lost Tower (Magma E3)
    else if (normalized === 'ATLANS' || normalized.startsWith('ATL')) baseFreq = 587.33; // Atlans (Oceano D5)
    else if (normalized === 'TARKAN' || normalized.startsWith('TAR')) baseFreq = 293.66; // Tarkan (Deserto D4)
    else if (normalized === 'ICARUS' || normalized.startsWith('ICA')) baseFreq = 880.0; // Icarus (Astral A5)

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq * 0.5, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.0, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, now + 0.9);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(250, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.45);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.95);
    filter.Q.setValueAtTime(4.5, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 1.1);

    const shimmerOsc = this.ctx.createOscillator();
    const shimmerGain = this.ctx.createGain();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(baseFreq * 3, now + 0.4);
    shimmerOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 1.2);

    shimmerGain.gain.setValueAtTime(0.001, now + 0.4);
    shimmerGain.gain.linearRampToValueAtTime(0.2, now + 0.55);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(this.masterGain);
    shimmerOsc.start(now + 0.4);
    shimmerOsc.stop(now + 1.3);
  }

  // 1.4 PASSOS RÍTMICOS
  playFootstep(surface = 'stone') {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    if (surface === 'stone') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + (Math.random() - 0.5) * 20, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.05);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    } else if (surface === 'grass') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80 + (Math.random() - 0.5) * 15, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else if (surface === 'snow') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220 + (Math.random() - 0.5) * 30, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.07);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(1.5, now);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } else if (surface === 'sand') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95 + (Math.random() - 0.5) * 25, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, now);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } else if (surface === 'metal') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620 + (Math.random() - 0.5) * 40, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.setValueAtTime(5.0, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else if (surface === 'crypt') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 + (Math.random() - 0.5) * 15, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.06);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else if (surface === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.05);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.09);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(2.5, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else if (surface === 'crystal') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760 + (Math.random() - 0.5) * 80, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.setValueAtTime(6.0, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.05);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // 1.5 POÇÕES, ESQUIVA E HABILIDADES
  playPotionSound(type = 'health') {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'health') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.22);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  playDodgeSound() {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.25);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  playSkillSound(skillId) {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (skillId === 'cyclone' || skillId === 'TWISTING_SLASH') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.5);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.58);
    } else if (skillId === 'death_stab' || skillId === 'DEATH_STAB') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(840, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.32);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (skillId === 'evil_spirits' || skillId === 'EVIL_SPIRITS') {
      // Evil Spirits: Coro Espectral Wailing Sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.6);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.7);
    } else if (skillId === 'ice_storm' || skillId === 'ICE_STORM') {
      // Ice Storm: Estilhaço Glacial e Chime Gélido
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.45);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.52);
    } else if (skillId === 'triple_shot' || skillId === 'TRIPLE_SHOT') {
      // Triple Shot: 3 Disparos Rápidos de Corda de Arco Élfico
      for (let i = 0; i < 3; i++) {
        const shotTime = now + i * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(620 + i * 40, shotTime);
        osc.frequency.exponentialRampToValueAtTime(180, shotTime + 0.09);

        gain.gain.setValueAtTime(0.28, shotTime);
        gain.gain.exponentialRampToValueAtTime(0.001, shotTime + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(shotTime);
        osc.stop(shotTime + 0.11);
      }
    } else if (skillId === 'fire_slash' || skillId === 'FIRE_SLASH') {
      // Fire Slash: Lâmina Flamejante de Magia e Aço
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.42);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.48);
    } else if (skillId === 'fireburst' || skillId === 'FIREBURST') {
      // Fireburst: Detonação Ígnea Trovejante do Dark Lord
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);

      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.42);
    } else if (skillId === 'earthquake' || skillId === 'EARTHQUAKE') {
      // Earthquake: Terremoto e Ruptura de Rocha com Sub-Grave
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.65);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.72);
    }
  }

  // 1.7 SINO CLÁSSICO DE QUEDA DE JOIA SAGRADA (BLESS / SOUL / LIFE / CHAOS)
  playJewelDropSound(jewelType = 'bless') {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    let f1 = 2093.0; // C7 (Bless)
    let f2 = 3135.9; // G7
    let decay = 1.6;

    if (jewelType === 'soul' || jewelType === 'jewel_of_soul') {
      f1 = 1760.0; f2 = 2637.0; decay = 1.4; // A6 / E7
    } else if (jewelType === 'life' || jewelType === 'jewel_of_life') {
      f1 = 1396.9; f2 = 2093.0; decay = 1.5; // F6 / C7
    } else if (jewelType === 'chaos' || jewelType === 'jewel_of_chaos') {
      f1 = 1046.5; f2 = 1661.2; decay = 1.1; // C6 / G#6
    }

    // Primeiro Harmônico Célere Cristalino
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(f1, now);

    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + decay + 0.05);

    // Segundo Harmônico Overtone Shimmer
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(f2, now);

    gain2.gain.setValueAtTime(0.22, now);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.75);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now);
    osc2.stop(now + decay * 0.8);
  }

  // 1.8 SOM DE COLETA DE ITEM OU MOEDA
  playItemPickupSound() {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // 1.9 SOM DE IMPACTO / DANO NO MONSTRO (GOLPE FÍSICO / HIT REACTION)
  playMonsterHitSound(monsterType = 'spider') {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    let baseFreq = 160;
    const m = String(monsterType || '').toLowerCase();
    if (m.includes('bull') || m.includes('yeti')) baseFreq = 95;
    else if (m.includes('hound')) baseFreq = 180;
    else if (m.includes('skeleton') || m.includes('lich')) baseFreq = 220;

    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 1.10 SOM DE MORTE / COLAPSO DO MONSTRO (RUGIDO DESCENDENTE AGONIZANTE)
  playMonsterDeathSound(monsterType = 'spider') {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    let startFreq = 220;
    let endFreq = 45;
    let duration = 0.45;
    const m = String(monsterType || '').toLowerCase();

    if (m.includes('bull') || m.includes('yeti')) {
      startFreq = 140; endFreq = 30; duration = 0.65;
    } else if (m.includes('demon') || m.includes('dragon')) {
      startFreq = 280; endFreq = 50; duration = 0.75;
    } else if (m.includes('skeleton')) {
      startFreq = 440; endFreq = 110; duration = 0.28;
    }

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + duration);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.06);
  }

  // 1.11 SOM DE AGGRO / ALERTA DO MONSTRO (ROSNADO SUTIL)
  playMonsterAggroSound(monsterType = 'spider') {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    let freq = 120;
    const m = String(monsterType || '').toLowerCase();
    if (m.includes('hound')) freq = 180;
    else if (m.includes('demon') || m.includes('dragon')) freq = 85;

    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 1.35, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // 1.12 SONS DA FAUNA AMBIENTAL (REVOADA DE ASAS, MORCEGOS, ÁGUA)
  playWildlifeSound(kind = 'wings') {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (kind === 'wings') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.25);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(350, now);
      filter.Q.value = 3.0;

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (kind === 'bat') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3200, now);
      osc.frequency.exponentialRampToValueAtTime(4500, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.13);
    }
  }
}

// ============================================================================
// 2. SISTEMA DE LEVEL UP (PROGRESSÃO E EFEITO 3D)
// ============================================================================
export class LevelUpSystem {
  static getXpRequiredForLevel(level) {
    if (level <= 1) return 0;
    let total = 0;
    for (let l = 1; l < level; l++) {
      total += Math.round(1000 * Math.pow(1.15, l - 1));
    }
    return total;
  }

  static processXpGain(currentLevel, currentXp, xpGained) {
    let newXp = currentXp + xpGained;
    let newLevel = currentLevel;
    let leveledUp = false;

    while (true) {
      const nextLevelXp = this.getXpRequiredForLevel(newLevel + 1);
      if (newXp >= nextLevelXp) {
        newLevel++;
        leveledUp = true;
      } else {
        break;
      }
    }

    const currentBaseXp = this.getXpRequiredForLevel(newLevel);
    const nextTargetXp = this.getXpRequiredForLevel(newLevel + 1);
    const range = Math.max(1, nextTargetXp - currentBaseXp);
    const progressInLevel = Math.max(0, newXp - currentBaseXp);
    const progressPct = Math.min(100, Math.round((progressInLevel / range) * 100));

    const maxHp = 1000 + (newLevel - 1) * 25;
    const maxMp = 450 + (newLevel - 1) * 18;

    return {
      currentLevel: newLevel,
      currentXp: newXp,
      xpForCurrentLevel: currentBaseXp,
      xpForNextLevel: nextTargetXp,
      progressPct,
      freeStatPoints: (newLevel - 1) * 5,
      maxHp,
      maxMp,
      leveledUp,
    };
  }

  static createLevelUp3DGroup(THREE) {
    const group = new THREE.Group();

    // 1. Auréola Dourada Ascendente
    const aureoleGeom = new THREE.TorusGeometry(0.75, 0.065, 12, 36);
    const aureoleMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const aureoleMesh = new THREE.Mesh(aureoleGeom, aureoleMat);
    aureoleMesh.rotation.x = Math.PI / 2;
    aureoleMesh.position.y = 0.1;
    group.add(aureoleMesh);

    // 2. Coluna Volumétrica de Luz Solar
    const beamGeom = new THREE.CylinderGeometry(0.85, 0.65, 4.5, 24, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const lightBeamMesh = new THREE.Mesh(beamGeom, beamMat);
    lightBeamMesh.position.y = 2.25;
    group.add(lightBeamMesh);

    // 3. Onda de Choque Rúnica no Solo
    const shockGeom = new THREE.RingGeometry(0.3, 0.75, 32);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const groundShockMesh = new THREE.Mesh(shockGeom, shockMat);
    groundShockMesh.rotation.x = -Math.PI / 2;
    groundShockMesh.position.y = 0.05;
    group.add(groundShockMesh);

    // 4. Partículas Solares em Espiral
    const count = 75;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 4;
      const radius = 0.55 + Math.random() * 0.4;
      positions[i * 3 + 0] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 1.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.12,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const particlesMesh = new THREE.Points(particleGeom, particleMat);
    group.add(particlesMesh);

    // 5. Luz Solar
    const lightSource = new THREE.PointLight(0xfacc15, 4.5, 12);
    lightSource.position.set(0, 1.8, 0);
    group.add(lightSource);

    return {
      group,
      aureoleMesh,
      lightBeamMesh,
      groundShockMesh,
      particlesMesh,
      particlePositions: positions,
      lightSource,
      elapsed: 0,
      duration: 1.8,
    };
  }

  static updateLevelUpAnimation(state, deltaTime) {
    state.elapsed += deltaTime;
    const progress = Math.min(1.0, state.elapsed / state.duration);
    const remainingAlpha = 1.0 - Math.pow(progress, 1.8);

    const currentY = Math.pow(progress, 0.75) * 3.8;
    const currentScale = 1.0 + progress * 1.6;
    state.aureoleMesh.position.y = currentY;
    state.aureoleMesh.scale.set(currentScale, currentScale, currentScale);
    state.aureoleMesh.material.opacity = remainingAlpha * 0.95;

    state.lightBeamMesh.scale.set(1.0 + progress * 0.4, 1.0 + progress * 0.2, 1.0 + progress * 0.4);
    state.lightBeamMesh.material.opacity = remainingAlpha * 0.55;

    const groundScale = 1.0 + progress * 4.2;
    state.groundShockMesh.scale.set(groundScale, groundScale, 1.0);
    state.groundShockMesh.material.opacity = remainingAlpha * 0.85;

    const count = state.particlePositions.length / 3;
    for (let i = 0; i < count; i++) {
      state.particlePositions[i * 3 + 1] += deltaTime * (2.4 + (i % 5) * 0.3);
      const x = state.particlePositions[i * 3 + 0];
      const z = state.particlePositions[i * 3 + 2];
      const rotSpeed = 3.5 * deltaTime;
      state.particlePositions[i * 3 + 0] = x * Math.cos(rotSpeed) - z * Math.sin(rotSpeed);
      state.particlePositions[i * 3 + 2] = x * Math.sin(rotSpeed) + z * Math.cos(rotSpeed);
    }
    state.particlesMesh.geometry.attributes.position.needsUpdate = true;
    state.particlesMesh.material.opacity = remainingAlpha * 0.9;
    state.lightSource.intensity = remainingAlpha * 4.5;

    return progress < 1.0;
  }
}

// ============================================================================
// 3. SEQUÊNCIA DE ANIMAÇÃO & VFX DO CHAOS MACHINE
// ============================================================================
export class ChaosMachineVFX {
  constructor() {
    this.config = {
      ignitionDuration: 1.4,
      surgeDuration: 1.6,
      beamDuration: 1.2,
      climaxDuration: 1.0,
    };
    this.state = {
      phase: 'IDLE',
      phaseTime: 0,
      totalTime: 0,
      gearSpeedMultiplier: 1.0,
      coreHeat: 0.0,
      laserBeamIntensity: 0.0,
      isSuccess: true,
      isFinished: false,
    };
  }

  startForge(isSuccess = true, onPhaseChange, onComplete) {
    this.state = {
      phase: 'IGNITION',
      phaseTime: 0,
      totalTime: 0,
      gearSpeedMultiplier: 1.0,
      coreHeat: 0.0,
      laserBeamIntensity: 0.0,
      isSuccess,
      isFinished: false,
    };
    this.onPhaseChange = onPhaseChange;
    this.onComplete = onComplete;

    if (this.onPhaseChange) {
      this.onPhaseChange('IGNITION', this.state);
    }
  }

  update(deltaTime) {
    if (this.state.phase === 'IDLE' || this.state.isFinished) {
      return this.state;
    }

    this.state.phaseTime += deltaTime;
    this.state.totalTime += deltaTime;

    switch (this.state.phase) {
      case 'IGNITION': {
        const progress = Math.min(1.0, this.state.phaseTime / this.config.ignitionDuration);
        this.state.gearSpeedMultiplier = 1.0 + progress * 5.0;
        this.state.coreHeat = progress * 0.4;
        this.state.laserBeamIntensity = 0.0;
        if (progress >= 1.0) this.transitionTo('SURGE');
        break;
      }
      case 'SURGE': {
        const progress = Math.min(1.0, this.state.phaseTime / this.config.surgeDuration);
        this.state.gearSpeedMultiplier = 6.0 + progress * 4.0;
        this.state.coreHeat = 0.4 + progress * 0.6;
        this.state.laserBeamIntensity = Math.sin(progress * Math.PI * 4) * 0.2;
        if (progress >= 1.0) this.transitionTo('FUSION_BEAM');
        break;
      }
      case 'FUSION_BEAM': {
        const progress = Math.min(1.0, this.state.phaseTime / this.config.beamDuration);
        this.state.gearSpeedMultiplier = 10.0;
        this.state.coreHeat = 1.0;
        this.state.laserBeamIntensity = 0.8 + Math.sin(progress * 12.0) * 0.2;
        if (progress >= 1.0) this.transitionTo('CLIMAX');
        break;
      }
      case 'CLIMAX': {
        const progress = Math.min(1.0, this.state.phaseTime / this.config.climaxDuration);
        this.state.laserBeamIntensity = Math.max(0, 1.0 - progress * 2.0);
        this.state.gearSpeedMultiplier = Math.max(1.0, 10.0 * (1.0 - progress));
        this.state.coreHeat = Math.max(0.0, 1.0 - progress);
        if (progress >= 1.0) this.transitionTo('COMPLETE');
        break;
      }
      case 'COMPLETE': {
        this.state.isFinished = true;
        this.state.gearSpeedMultiplier = 1.0;
        this.state.coreHeat = 0.0;
        this.state.laserBeamIntensity = 0.0;
        if (this.onComplete) {
          this.onComplete(this.state.isSuccess);
        }
        break;
      }
    }
    return this.state;
  }

  transitionTo(nextPhase) {
    this.state.phase = nextPhase;
    this.state.phaseTime = 0;
    if (nextPhase === 'COMPLETE') {
      this.state.isFinished = true;
      this.state.gearSpeedMultiplier = 1.0;
      this.state.coreHeat = 0.0;
      this.state.laserBeamIntensity = 0.0;
      if (this.onComplete) {
        this.onComplete(this.state.isSuccess);
      }
    }
    if (this.onPhaseChange) {
      this.onPhaseChange(nextPhase, this.state);
    }
  }

  static createFusionBeamMesh(THREE) {
    const beamGroup = new THREE.Group();

    // 1. Núcleo Laser Concentrado
    const coreGeom = new THREE.CylinderGeometry(0.12, 0.16, 9.0, 16, 1, true);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const coreLaser = new THREE.Mesh(coreGeom, coreMat);
    coreLaser.position.y = 5.6;
    beamGroup.add(coreLaser);

    // 2. Halo de Plasma Solar
    const outerGeom = new THREE.CylinderGeometry(0.45, 0.75, 9.0, 24, 1, true);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const outerPlasma = new THREE.Mesh(outerGeom, outerMat);
    outerPlasma.position.y = 5.6;
    beamGroup.add(outerPlasma);

    // 3. Esfera de Onda de Choque
    const shockGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      transparent: true,
      opacity: 0.0,
      wireframe: true,
    });
    const shockwaveSphere = new THREE.Mesh(shockGeom, shockMat);
    shockwaveSphere.position.set(0, 1.8, 0);
    beamGroup.add(shockwaveSphere);

    // 4. Centelhas Elétricas
    const sparkCount = 60;
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3 + 0] = (Math.random() - 0.5) * 1.8;
      sparkPos[i * 3 + 1] = 1.2 + Math.random() * 1.5;
      sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
    }
    const sparkGeom = new THREE.BufferGeometry();
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.09,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const sparksPoints = new THREE.Points(sparkGeom, sparkMat);
    beamGroup.add(sparksPoints);

    return {
      beamGroup,
      coreLaser,
      outerPlasma,
      shockwaveSphere,
      sparksPoints,
    };
  }

  static applyVfxToMeshes(vfxMeshes, state, deltaTime) {
    const intensity = state.laserBeamIntensity;
    vfxMeshes.coreLaser.material.opacity = intensity * 0.95;
    vfxMeshes.coreLaser.scale.set(
      1.0 + Math.sin(state.totalTime * 20) * 0.1,
      1.0,
      1.0 + Math.cos(state.totalTime * 20) * 0.1
    );

    vfxMeshes.outerPlasma.material.opacity = intensity * 0.65;
    vfxMeshes.outerPlasma.rotation.y += deltaTime * 8.0;
    vfxMeshes.sparksPoints.material.opacity = Math.max(0, state.coreHeat * 0.85);

    if (state.phase === 'CLIMAX') {
      const shockProgress = Math.min(1.0, state.phaseTime / 0.8);
      const scale = 1.0 + shockProgress * 8.0;
      vfxMeshes.shockwaveSphere.scale.set(scale, scale, scale);
      vfxMeshes.shockwaveSphere.material.opacity =
        (1.0 - shockProgress) * (state.isSuccess ? 0.9 : 0.4);
    } else {
      vfxMeshes.shockwaveSphere.scale.set(1, 1, 1);
      vfxMeshes.shockwaveSphere.material.opacity = 0.0;
    }
  }
}

// ============================================================================
// 4. SISTEMA DE PORTAIS 3D E TRANSIÇÃO DINÂMICA DE MAPAS
// ============================================================================
export class PortalSystem {
  static MAP_CONFIGS = {
    LORENCIA: {
      id: 'LORENCIA',
      name: 'Planícies de Lorencia',
      subtitle: 'Cidade Fortificada e Campos Góticos',
      ambientColor: 0x1e293b,
      sunColor: 0xffecd2,
      sunIntensity: 1.9,
      fogColor: 0x07090d,
      fogDensity: 0.028,
      groundColor: 0x1f242d,
      spawnPoint: { x: 0, z: -5.0 },
    },
    NORIA: {
      id: 'NORIA',
      name: 'Santuário de Noria',
      subtitle: 'Floresta Feywood das Fadas Élficas',
      ambientColor: 0x064e3b,
      sunColor: 0xa7f3d0,
      sunIntensity: 1.75,
      fogColor: 0x022c22,
      fogDensity: 0.035,
      groundColor: 0x047857,
      spawnPoint: { x: 0, z: 2.0 },
    },
    DEVIAS: {
      id: 'DEVIAS',
      name: 'Fortaleza Boreal de Devias',
      subtitle: 'Planícies Polares e Neves Eternas',
      ambientColor: 0x0f172a,
      sunColor: 0xbae6fd,
      sunIntensity: 1.85,
      fogColor: 0x082f49,
      fogDensity: 0.032,
      groundColor: 0xf1f5f9,
      spawnPoint: { x: 0, z: 1.5 },
    },
    DUNGEON: {
      id: 'DUNGEON',
      name: 'Catacumbas de Dungeon',
      subtitle: 'Prisões Antigas e Covil da Górgona',
      ambientColor: 0x070c08,
      sunColor: 0x86efac,
      sunIntensity: 2.0,
      fogColor: 0x070c08,
      fogDensity: 0.038,
      groundColor: 0x111827,
      spawnPoint: { x: 0, z: 12.0 },
    },
    LOST_TOWER: {
      id: 'LOST_TOWER',
      name: 'Lost Tower do Balrog',
      subtitle: 'Pináculo Vulcânico e Mar de Magma',
      ambientColor: 0x160606,
      sunColor: 0xf87171,
      sunIntensity: 2.2,
      fogColor: 0x160606,
      fogDensity: 0.034,
      groundColor: 0x0f0a0a,
      spawnPoint: { x: 0, z: 8.0 },
    },
    ATLANS: {
      id: 'ATLANS',
      name: 'Ruínas Submersas de Atlans',
      subtitle: 'Recifes de Nácar e Covil da Hydra',
      ambientColor: 0x001326,
      sunColor: 0x38bdf8,
      sunIntensity: 2.4,
      fogColor: 0x001326,
      fogDensity: 0.030,
      groundColor: 0x0284c7,
      spawnPoint: { x: 0, z: 12.0 },
    },
    TARKAN: {
      id: 'TARKAN',
      name: 'Deserto Carmesim de Tarkan',
      subtitle: 'Dunas de Areia e Cratera de Zaikan',
      ambientColor: 0x1c0909,
      sunColor: 0xfbbf24,
      sunIntensity: 2.3,
      fogColor: 0x1c0909,
      fogDensity: 0.032,
      groundColor: 0x991b1b,
      spawnPoint: { x: 0, z: 18.0 },
    },
    ICARUS: {
      id: 'ICARUS',
      name: 'Arquipélago Celeste de Icarus',
      subtitle: 'Ilhas Flutuantes e Ninho do Dark Phoenix',
      ambientColor: 0x260d33,
      sunColor: 0xfbbf24,
      sunIntensity: 2.5,
      fogColor: 0x260d33,
      fogDensity: 0.024,
      groundColor: 0x1e1b4b,
      spawnPoint: { x: 0, z: -4.0 },
    },
  };

  static getPortalsForMap(currentMap) {
    if (currentMap === 'LORENCIA') {
      return [
        {
          id: 'portal_to_noria',
          sourceMap: 'LORENCIA',
          targetMap: 'NORIA',
          targetMapName: 'Noria (Feywood)',
          position: { x: 13.5, y: 0, z: -1.0 },
          radius: 2.2,
          themeColor: 0x10b981,
          runeColor: 0x34d399,
          label: '🌿 Portal de Noria',
        },
        {
          id: 'portal_to_devias',
          sourceMap: 'LORENCIA',
          targetMap: 'DEVIAS',
          targetMapName: 'Devias (Boreal)',
          position: { x: -13.5, y: 0, z: -1.0 },
          radius: 2.2,
          themeColor: 0x38bdf8,
          runeColor: 0x7dd3fc,
          label: '❄️ Portal de Devias',
        },
      ];
    } else if (currentMap === 'NORIA') {
      return [
        {
          id: 'portal_to_lorencia',
          sourceMap: 'NORIA',
          targetMap: 'LORENCIA',
          targetMapName: 'Lorencia (Castelo)',
          position: { x: 0, y: 0, z: 9.5 },
          radius: 2.2,
          themeColor: 0xf59e0b,
          runeColor: 0xfbbf24,
          label: '🏰 Portal de Lorencia',
        },
      ];
    } else if (currentMap === 'DEVIAS' || currentMap.startsWith('DEV')) {
      return [
        {
          id: 'portal_to_lorencia',
          sourceMap: 'DEVIAS',
          targetMap: 'LORENCIA',
          targetMapName: 'Lorencia (Castelo)',
          position: { x: 0, y: 0, z: 9.5 },
          radius: 2.2,
          themeColor: 0xf59e0b,
          runeColor: 0xfbbf24,
          label: '🏰 Portal de Lorencia',
        },
      ];
    } else if (currentMap === 'DUNGEON' || currentMap.startsWith('DNG')) {
      return [
        {
          id: 'portal_to_lorencia',
          sourceMap: 'DUNGEON',
          targetMap: 'LORENCIA',
          targetMapName: 'Lorencia (Castelo)',
          position: { x: 0, y: 0, z: 12.0 },
          radius: 2.2,
          themeColor: 0xf59e0b,
          runeColor: 0xfbbf24,
          label: '🏰 Portal de Lorencia',
        },
      ];
    } else if (currentMap === 'LOST_TOWER' || currentMap.startsWith('LT')) {
      return [
        {
          id: 'portal_to_devias',
          sourceMap: 'LOST_TOWER',
          targetMap: 'DEVIAS',
          targetMapName: 'Devias (Boreal)',
          position: { x: 0, y: 0, z: 12.0 },
          radius: 2.2,
          themeColor: 0x38bdf8,
          runeColor: 0x7dd3fc,
          label: '❄️ Portal de Devias',
        },
      ];
    } else if (currentMap === 'ATLANS' || currentMap.startsWith('ATL')) {
      return [
        {
          id: 'portal_to_noria',
          sourceMap: 'ATLANS',
          targetMap: 'NORIA',
          targetMapName: 'Noria (Feywood)',
          position: { x: 0, y: 0, z: 11.0 },
          radius: 2.2,
          themeColor: 0x10b981,
          runeColor: 0x34d399,
          label: '🌿 Portal de Noria',
        },
      ];
    } else if (currentMap === 'TARKAN' || currentMap.startsWith('TAR')) {
      return [
        {
          id: 'portal_to_atlans',
          sourceMap: 'TARKAN',
          targetMap: 'ATLANS',
          targetMapName: 'Atlans (Oceano)',
          position: { x: 0, y: 0, z: 12.0 },
          radius: 2.2,
          themeColor: 0x06b6d4,
          runeColor: 0x22d3ee,
          label: '🌊 Portal de Atlans',
        },
      ];
    } else if (currentMap === 'ICARUS' || currentMap.startsWith('ICA')) {
      return [
        {
          id: 'portal_to_lost_tower',
          sourceMap: 'ICARUS',
          targetMap: 'LOST_TOWER',
          targetMapName: 'Lost Tower (Pinnacle)',
          position: { x: 0, y: 0, z: 8.0 },
          radius: 2.2,
          themeColor: 0xef4444,
          runeColor: 0xf97316,
          label: '🔥 Portal de Lost Tower',
        },
      ];
    } else {
      // Fallback padrão para Lorencia
      return [
        {
          id: 'portal_to_lorencia',
          sourceMap: currentMap,
          targetMap: 'LORENCIA',
          targetMapName: 'Lorencia (Castelo)',
          position: { x: 0, y: 0, z: 9.5 },
          radius: 2.2,
          themeColor: 0xf59e0b,
          runeColor: 0xfbbf24,
          label: '🏰 Portal de Lorencia',
        },
      ];
    }
  }

  static checkProximity(playerX, playerZ, currentMap) {
    const portals = this.getPortalsForMap(currentMap);
    for (const p of portals) {
      const dist = Math.hypot(p.position.x - playerX, p.position.z - playerZ);
      if (dist <= p.radius) {
        return p;
      }
    }
    return null;
  }

  static createPortal3DMesh(def, THREE) {
    const group = new THREE.Group();
    group.position.set(def.position.x, def.position.y, def.position.z);

    // Pilares Góticos de Pedra
    const pillarGeom = new THREE.CylinderGeometry(0.28, 0.35, 3.8, 8);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.3,
    });
    const leftPillar = new THREE.Mesh(pillarGeom, pillarMat);
    leftPillar.position.set(-1.45, 1.9, 0);
    leftPillar.castShadow = true;
    group.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeom, pillarMat);
    rightPillar.position.set(1.45, 1.9, 0);
    rightPillar.castShadow = true;
    group.add(rightPillar);

    const archGeom = new THREE.BoxGeometry(3.4, 0.45, 0.55);
    const archMesh = new THREE.Mesh(archGeom, pillarMat);
    archMesh.position.set(0, 3.8, 0);
    group.add(archMesh);

    // Anéis Rúnicos
    const outerRingGeom = new THREE.TorusGeometry(1.35, 0.05, 8, 36);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: def.runeColor,
      transparent: true,
      opacity: 0.85,
    });
    const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
    outerRing.position.y = 1.9;
    group.add(outerRing);

    const innerRingGeom = new THREE.TorusGeometry(1.05, 0.035, 8, 28);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: def.themeColor,
      transparent: true,
      opacity: 0.9,
    });
    const innerRing = new THREE.Mesh(innerRingGeom, innerRingMat);
    innerRing.position.y = 1.9;
    group.add(innerRing);

    // Disco do Horizonte de Eventos
    const discGeom = new THREE.CircleGeometry(1.25, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: def.themeColor,
      emissive: def.themeColor,
      emissiveIntensity: 1.8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const vortexDisc = new THREE.Mesh(discGeom, discMat);
    vortexDisc.position.y = 1.9;
    group.add(vortexDisc);

    // Luz Pontual do Portal
    const portalLight = new THREE.PointLight(def.themeColor, 3.2, 8.5);
    portalLight.position.set(0, 1.9, 0.2);
    group.add(portalLight);

    // Partículas de Vórtice
    const particleCount = 45;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 1.0;
      positions[i * 3 + 0] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 1.9 + Math.sin(angle) * radius;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: def.runeColor,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particlesPoints = new THREE.Points(particleGeom, particleMat);
    group.add(particlesPoints);

    // Placa Flutuante 3D
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 64;
    const lctx = labelCanvas.getContext('2d');
    if (lctx) {
      lctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
      if (lctx.roundRect) lctx.roundRect(10, 8, 236, 48, 10);
      else lctx.fillRect(10, 8, 236, 48);
      lctx.fill();
      lctx.strokeStyle = `#${def.runeColor.toString(16).padStart(6, '0')}`;
      lctx.lineWidth = 3;
      if (lctx.roundRect) lctx.strokeRect(10, 8, 236, 48);
      else lctx.stroke();

      lctx.font = 'bold 22px Cinzel, serif';
      lctx.textAlign = 'center';
      lctx.fillStyle = '#ffffff';
      lctx.fillText(def.label, 128, 40);
    }
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    const labelSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex }));
    labelSprite.position.set(0, 4.3, 0);
    labelSprite.scale.set(2.4, 0.6, 1.0);
    group.add(labelSprite);

    return {
      group,
      vortexDisc,
      innerRing,
      outerRing,
      portalLight,
      particlesPoints,
      labelSprite,
    };
  }

  static updatePortalAnimation(portalMeshes, time, delta) {
    portalMeshes.outerRing.rotation.z = time * 1.2;
    portalMeshes.innerRing.rotation.z = -time * 1.8;
    portalMeshes.vortexDisc.rotation.z = time * 0.8;
    const pulse = 1.0 + Math.sin(time * 3.5) * 0.22;
    portalMeshes.portalLight.intensity = 3.2 * pulse;
    portalMeshes.particlesPoints.rotation.z = -time * 2.2;
  }
}

// ============================================================================
// 5. CONTROLADOR DE TECLADO (WASD & FÍSICA CINEMÁTICA)
// ============================================================================
export class KeyboardController {
  constructor(initialPosition = { x: 0, z: 0 }, config = {}) {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
    };
    this.position = { x: initialPosition.x, z: initialPosition.z };
    this.velocity = { x: 0, z: 0 };
    this.rotationY = 0;
    this.isMoving = false;
    this.distanceAccumulator = 0;

    this.config = {
      maxSpeed: 5.6,
      acceleration: 30.0,
      deceleration: 36.0,
      rotationSpeed: 14.0,
      stepDistance: 1.2,
      boundsMinX: -18.5,
      boundsMaxX: 18.5,
      boundsMinZ: -10.5,
      boundsMaxZ: 10.5,
      ...config,
    };

    this.onFootstepCallback = null;
    this.onShortcutCallback = null;
  }

  attachListeners(targetWindow = window) {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const code = e.code;
      let handled = false;

      if (code === 'KeyW' || code === 'ArrowUp') {
        this.keys.forward = true;
        handled = true;
      } else if (code === 'KeyS' || code === 'ArrowDown') {
        this.keys.backward = true;
        handled = true;
      } else if (code === 'KeyA' || code === 'ArrowLeft') {
        this.keys.left = true;
        handled = true;
      } else if (code === 'KeyD' || code === 'ArrowRight') {
        this.keys.right = true;
        handled = true;
      }

      const actionCodes = [
        'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'Space', 'KeyF', 'KeyC', 'KeyL',
        'Digit1', 'Digit2', 'Digit3',
      ];
      if (actionCodes.includes(code)) {
        if (code === 'Space') e.preventDefault();
        if (this.onShortcutCallback) {
          this.onShortcutCallback(code);
        }
      }

      if (handled) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') this.keys.forward = false;
      else if (code === 'KeyS' || code === 'ArrowDown') this.keys.backward = false;
      else if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
      else if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
    };

    targetWindow.addEventListener('keydown', handleKeyDown);
    targetWindow.addEventListener('keyup', handleKeyUp);

    return () => {
      targetWindow.removeEventListener('keydown', handleKeyDown);
      targetWindow.removeEventListener('keyup', handleKeyUp);
    };
  }

  update(deltaTime) {
    const dt = Math.min(deltaTime, 0.1);

    let inputX = 0;
    let inputZ = 0;
    if (this.keys.forward) inputZ -= 1;
    if (this.keys.backward) inputZ += 1;
    if (this.keys.left) inputX -= 1;
    if (this.keys.right) inputX += 1;

    const inputLen = Math.hypot(inputX, inputZ);
    if (inputLen > 0.001) {
      inputX /= inputLen;
      inputZ /= inputLen;
    }

    if (inputLen > 0.001) {
      const targetVx = inputX * this.config.maxSpeed;
      const targetVz = inputZ * this.config.maxSpeed;

      const ax = (targetVx - this.velocity.x) * (this.config.acceleration * dt);
      const az = (targetVz - this.velocity.z) * (this.config.acceleration * dt);

      this.velocity.x += ax;
      this.velocity.z += az;
    } else {
      const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
      if (currentSpeed > 0.001) {
        const drop = this.config.deceleration * dt;
        const newSpeed = Math.max(0, currentSpeed - drop);
        const factor = newSpeed / currentSpeed;
        this.velocity.x *= factor;
        this.velocity.z *= factor;
      } else {
        this.velocity.x = 0;
        this.velocity.z = 0;
      }
    }

    const currentSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (currentSpeed > this.config.maxSpeed) {
      const clampFactor = this.config.maxSpeed / currentSpeed;
      this.velocity.x *= clampFactor;
      this.velocity.z *= clampFactor;
    }

    const moveDx = this.velocity.x * dt;
    const moveDz = this.velocity.z * dt;
    const prevX = this.position.x;
    const prevZ = this.position.z;
    this.position.x += moveDx;
    this.position.z += moveDz;

    if (this.collisionResolver) {
      const res = this.collisionResolver({ x: prevX, z: prevZ }, { x: this.position.x, z: this.position.z });
      this.position.x = res.x;
      this.position.z = res.z;
    } else {
      this.position.x = Math.max(
        this.config.boundsMinX,
        Math.min(this.config.boundsMaxX, this.position.x)
      );
      this.position.z = Math.max(
        this.config.boundsMinZ,
        Math.min(this.config.boundsMaxZ, this.position.z)
      );
    }

    this.isMoving = currentSpeed > 0.15;
    if (this.isMoving) {
      const targetAngle = Math.atan2(this.velocity.x, this.velocity.z);
      let diff = targetAngle - this.rotationY;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      this.rotationY += diff * Math.min(1.0, this.config.rotationSpeed * dt);

      this.distanceAccumulator += Math.hypot(moveDx, moveDz);
      if (this.distanceAccumulator >= this.config.stepDistance) {
        this.distanceAccumulator = 0;
        if (this.onFootstepCallback) {
          this.onFootstepCallback(this.config.stepDistance);
        }
      }
    }

    return {
      position: { x: this.position.x, z: this.position.z },
      rotationY: this.rotationY,
      velocity: { x: this.velocity.x, z: this.velocity.z },
      speed: currentSpeed,
      isMoving: this.isMoving,
    };
  }

  teleportTo(x, z) {
    this.position.x = x;
    this.position.z = z;
    this.velocity.x = 0;
    this.velocity.z = 0;
    this.distanceAccumulator = 0;
  }
}

// ============================================================================
// 6. MOTOR DE COMBATE 100% IDLE & AFK AUTO-BATTLE ENGINE (CLIENT 3D NATIVO)
// ============================================================================
export class IdleAutoCombatEngine {
  constructor(config = {}) {
    this.config = {
      enabled: true,
      searchRadius: 450,
      attackRangeMelee: 55,
      attackRangeSkill: 110,
      autoPickupRadius: 240,
      autoPotionHpPct: 0.65,
      autoPotionMpPct: 0.40,
      potionCooldownSec: 1.5,
      skillCycleDelaySec: 2.2,
      ...config,
    };

    this.metrics = {
      startTime: Date.now(),
      uptimeSec: 0,
      monstersKilled: 0,
      zenCollected: 0,
      jewelsCollected: 0,
      totalDamageDealt: 0,
      dps: 0,
      xpGained: 0,
    };

    this.skills = [
      {
        id: 'cyclone',
        name: 'Twisting Slash',
        icon: '🌪️',
        cooldownMs: 2500,
        manaCost: 35,
        lastUsedMs: 0,
        isReady: true,
      },
      {
        id: 'death_stab',
        name: 'Death Stab',
        icon: '⚡',
        cooldownMs: 4000,
        manaCost: 55,
        lastUsedMs: 0,
        isReady: true,
      },
    ];

    this.currentTargetId = null;
    this.currentAction = 'Procurando Inimigos...';
    this.lastAttackMs = 0;
    this.lastPotionHpMs = 0;
    this.lastPotionMpMs = 0;
    this.recentDamageRecords = [];
  }

  setEnabled(enabled) {
    this.config.enabled = enabled;
    if (!enabled) {
      this.currentAction = 'Auto-Hunt Pausado';
      this.currentTargetId = null;
    } else {
      this.currentAction = 'Auto-Hunt Ativo';
    }
  }

  isEnabled() {
    return this.config.enabled;
  }

  update(deltaTimeSec, state, actions) {
    const now = Date.now();
    this.metrics.uptimeSec = Math.floor((now - this.metrics.startTime) / 1000);
    this.cleanRecentDamage(now);

    if (!this.config.enabled) {
      return { action: this.currentAction, targetId: null, metrics: this.metrics };
    }

    // 1. AUTO-POTION: Avaliação inteligente de Vitais
    const hpRatio = state.playerHp / Math.max(1, state.playerMaxHp);
    if (hpRatio < this.config.autoPotionHpPct && now - this.lastPotionHpMs >= this.config.potionCooldownSec * 1000) {
      this.lastPotionHpMs = now;
      if (actions.useHealthPotion) actions.useHealthPotion();
    }

    const mpRatio = state.playerMp / Math.max(1, state.playerMaxMp);
    if (mpRatio < this.config.autoPotionMpPct && now - this.lastPotionMpMs >= this.config.potionCooldownSec * 1000) {
      this.lastPotionMpMs = now;
      if (actions.useManaPotion) actions.useManaPotion();
    }

    // 2. AUTO-LOOT: Coleta automática de drops no chão
    if (Array.isArray(state.groundDrops)) {
      for (const drop of state.groundDrops) {
        const dist = Math.hypot(drop.x - state.playerX, drop.y - state.playerY);
        if (dist <= this.config.autoPickupRadius) {
          if (actions.pickupDrop) actions.pickupDrop(drop.dropId);
        }
      }
    }

    // 3. AUTO-TARGETING: Localiza monstro vivo mais próximo
    let target = null;
    if (Array.isArray(state.monsters)) {
      target = state.monsters.find((m) => m.id === this.currentTargetId && !m.isDead);
      if (!target) {
        this.currentTargetId = null;
        let nearestDist = Infinity;
        let candidate = null;

        for (const mob of state.monsters) {
          if (mob.isDead) continue;
          const dist = Math.hypot(mob.x - state.playerX, mob.y - state.playerY);
          if (dist <= this.config.searchRadius && dist < nearestDist) {
            nearestDist = dist;
            candidate = mob;
          }
        }

        if (candidate) {
          target = candidate;
          this.currentTargetId = candidate.id;
        }
      }
    }

    // Se nenhum monstro estiver na área, aguarda ou patrulha
    if (!target) {
      this.currentAction = 'Procurando Monstros na Zona...';
      return { action: this.currentAction, targetId: null, metrics: this.metrics };
    }

    // 4. AUTO-APPROACH: Move o herói até o monstro
    const targetDist = Math.hypot(target.x - state.playerX, target.y - state.playerY);
    const chosenSkill = this.selectNextSkill(now, state.playerMp);
    const requiredRange = chosenSkill ? this.config.attackRangeSkill : this.config.attackRangeMelee;

    if (targetDist > requiredRange) {
      if (actions.movePlayer) actions.movePlayer(target.x, target.y);
      this.currentAction = `Aproximando-se de ${target.name || 'Monstro'} (${Math.round(targetDist)}m)`;
      return { action: this.currentAction, targetId: target.id, metrics: this.metrics };
    }

    // 5. AUTO-ATTACK: Executa ataque e rotação de habilidades
    const attackIntervalMs = chosenSkill ? 900 : 750;
    if (now - this.lastAttackMs >= attackIntervalMs) {
      this.lastAttackMs = now;

      if (chosenSkill) {
        chosenSkill.lastUsedMs = now;
        if (actions.attackMonster) actions.attackMonster(target.id, chosenSkill.id);
        this.currentAction = `Conjurando ${chosenSkill.name} contra ${target.name || 'Alvo'}`;
      } else {
        if (actions.attackMonster) actions.attackMonster(target.id);
        this.currentAction = `Atacando ${target.name || 'Alvo'} com Golpe de Arma`;
      }
    }

    return {
      action: this.currentAction,
      targetId: target.id,
      metrics: this.metrics,
    };
  }

  selectNextSkill(now, playerMp) {
    for (const skill of this.skills) {
      skill.isReady = now - skill.lastUsedMs >= skill.cooldownMs && playerMp >= skill.manaCost;
      if (skill.isReady) {
        return skill;
      }
    }
    return null;
  }

  recordDamageDealt(damage) {
    if (damage <= 0) return;
    const now = Date.now();
    this.metrics.totalDamageDealt += damage;
    this.recentDamageRecords.push({ time: now, damage });
    this.cleanRecentDamage(now);
  }

  recordMonsterKilled() {
    this.metrics.monstersKilled++;
  }

  recordLoot(isJewel, zen = 0) {
    if (isJewel) this.metrics.jewelsCollected++;
    if (zen > 0) this.metrics.zenCollected += zen;
  }

  cleanRecentDamage(now) {
    const windowStart = now - 5000;
    this.recentDamageRecords = this.recentDamageRecords.filter((r) => r.time >= windowStart);
    const totalInWindow = this.recentDamageRecords.reduce((acc, r) => acc + r.damage, 0);
    this.metrics.dps = Math.round(totalInWindow / 5);
  }

  simulateOfflineHunting(durationHours, mapId = 'LORENCIA') {
    const clampedHours = Math.max(0.1, Math.min(12, durationHours));

    let mobsPerHour = 180;
    let avgXpPerMob = 350;
    let avgZenPerMob = 45;

    if (mapId === 'NORIA') {
      mobsPerHour = 160;
      avgXpPerMob = 650;
      avgZenPerMob = 90;
    } else if (mapId === 'DEVIAS') {
      mobsPerHour = 140;
      avgXpPerMob = 1200;
      avgZenPerMob = 180;
    }

    const monstersKilled = Math.floor(mobsPerHour * clampedHours);
    const xpGained = monstersKilled * avgXpPerMob;
    const zenCollected = monstersKilled * avgZenPerMob;

    const blessCount = Math.floor(monstersKilled * 0.012);
    const soulCount = Math.floor(monstersKilled * 0.018);
    const chaosCount = Math.floor(monstersKilled * 0.025);
    const lifeCount = Math.floor(monstersKilled * 0.008);

    return {
      durationHours: clampedHours,
      mapId,
      monstersKilled,
      xpGained,
      zenCollected,
      jewels: {
        bless: Math.max(0, blessCount),
        soul: Math.max(0, soulCount),
        chaos: Math.max(0, chaosCount),
        life: Math.max(0, lifeCount),
      },
    };
  }
}
