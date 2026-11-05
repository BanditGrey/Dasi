/**
 * Dasi MMORPG - Sintetizador de Áudio Harmônico Procedural (Web Audio API)
 * Gera 100% dos efeitos sonoros dinamicamente sem necessidade de arquivos de áudio externos.
 * 
 * Funcionalidades:
 * - Fanfarra Triunfante de Level Up (Arpejo Dourado em Dó Maior + Sino Celestial)
 * - Sequência Cinemática da Chaos Machine (Engrenagens Goblins, Confinamento de Plasma e Raio Laser)
 * - Vórtice Dimensional de Portal de Teletransporte (Whoosh Cósmico e Ressonância de Mapa)
 * - Passos Rítmicos Dinâmicos por Superfície (Pedra de Lorencia, Musgo de Noria, Neve de Devias)
 * - Poções de Vida e Mana, Esquiva com I-Frames e Golpes de Combate
 */

export type SurfaceType = 'stone' | 'grass' | 'snow' | 'sand' | 'metal' | 'crypt' | 'water' | 'crystal';
export type ChaosSoundPhase = 'ignition' | 'surge' | 'laser' | 'success' | 'fail';

export class HarmonicAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    // Inicialização tardia no primeiro gesto do usuário
  }

  public init(): boolean {
    if (this.ctx) return true;
    try {
      const AudioCtxClass =
        (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) ||
        null;
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
      console.warn('[HarmonicAudio] Falha ao inicializar AudioContext:', e);
      return false;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0.0 : 0.85, this.ctx.currentTime);
    }
  }

  // ==========================================================================
  // 1. FANFARRA GLORIOSA DE LEVEL UP (AURÉOLA DOURADA & ACORDE CELESTIAL)
  // ==========================================================================
  public playLevelUpSound(): void {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Arpejo Ascendente em Dó Maior: C4 (261.6), G4 (392.0), C5 (523.2), E5 (659.2), G5 (784.0), C6 (1046.5)
    const notes = [261.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    const noteStep = 0.075;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const startTime = now + idx * noteStep;

      // Oscilador de onda triangular rica em harmônicos ímpares
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.01, startTime + 0.35);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.24, startTime + 0.02);
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
    subOsc.frequency.setValueAtTime(130.81, now); // C3
    subOsc.frequency.exponentialRampToValueAtTime(65.4, now + 0.5); // C2

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.85);
  }

  // ==========================================================================
  // 2. SEQUÊNCIA DE ÁUDIO DA CHAOS MACHINE (FORJA SAGRADA)
  // ==========================================================================
  public playChaosPhaseSound(phase: ChaosSoundPhase): void {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    switch (phase) {
      case 'ignition': {
        // Catraca mecânica e engrenagens girando aceleradamente
        for (let i = 0; i < 6; i++) {
          const t = now + i * 0.12 * Math.pow(0.85, i);
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(160 + i * 40, t);
          osc.frequency.exponentialRampToValueAtTime(80, t + 0.04);

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
        osc1.frequency.exponentialRampToValueAtTime(380, now + 1.2);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(220, now);
        osc2.frequency.exponentialRampToValueAtTime(760, now + 1.2);

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
        beamOsc.frequency.setValueAtTime(880, now);
        beamOsc.frequency.exponentialRampToValueAtTime(140, now + 0.25);
        beamOsc.frequency.exponentialRampToValueAtTime(50, now + 0.6);

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
        s1.frequency.setValueAtTime(587.33, now); // D5
        s1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.1); // D6
        s1.frequency.exponentialRampToValueAtTime(1760.0, now + 0.3); // A6

        s2.type = 'triangle';
        s2.frequency.setValueAtTime(880.0, now); // A5
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
        // Falha: Estrondo metálico abafado e estilhaço
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

  // ==========================================================================
  // 3. VÓRTICE DIMENSIONAL DE PORTAL (LORENCIA <-> NORIA <-> DEVIAS)
  // ==========================================================================
  public playPortalWarpSound(mapId: string = 'LORENCIA'): void {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Frequência base tonal de acordo com a atmosfera do mapa (8 Biomas Canônicos)
    const normalized = mapId.toUpperCase();
    let baseFreq = 440; // Lorencia (Âmbar)
    if (normalized === 'NORIA' || normalized.startsWith('NOR')) baseFreq = 523.25; // Noria (Feywood C5)
    else if (normalized === 'DEVIAS' || normalized.startsWith('DEV')) baseFreq = 392.0; // Devias (Boreal G4)
    else if (normalized === 'DUNGEON' || normalized.startsWith('DNG')) baseFreq = 220.0; // Dungeon (Catacumbas A3)
    else if (normalized === 'LOST_TOWER' || normalized.startsWith('LT')) baseFreq = 164.81; // Lost Tower (Magma E3)
    else if (normalized === 'ATLANS' || normalized.startsWith('ATL')) baseFreq = 587.33; // Atlans (Oceano D5)
    else if (normalized === 'TARKAN' || normalized.startsWith('TAR')) baseFreq = 293.66; // Tarkan (Deserto D4)
    else if (normalized === 'ICARUS' || normalized.startsWith('ICA')) baseFreq = 880.0; // Icarus (Astral A5)

    // Varredura de Filtro Ressonante (Warp Tunnel Whoosh)
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

    // Brilho Rúnico de Saída do Portal
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

  // ==========================================================================
  // 4. PASSOS RÍTMICOS DINÂMICOS (WASD FEEDBACK POR TERRENO)
  // ==========================================================================
  public playFootstep(surface: SurfaceType = 'stone'): void {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    if (surface === 'stone') {
      // Pedra Firme de Lorencia (estalo seco nítido)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + (Math.random() - 0.5) * 20, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.05);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    } else if (surface === 'grass') {
      // Musgo e Folhagem Macia de Noria (farfalhar suave)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80 + (Math.random() - 0.5) * 15, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    } else if (surface === 'snow') {
      // Neve Compactada de Devias (fricção crocante)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220 + (Math.random() - 0.5) * 30, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.07);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(1.5, now);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } else if (surface === 'sand') {
      // Areia Carmesim de Tarkan (deslizamento granuloso e atrito abafado)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95 + (Math.random() - 0.5) * 25, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.07);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, now);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } else if (surface === 'metal') {
      // Grelhas e Correntes de Ferro da Lost Tower (ressonância metálica oca)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(620 + (Math.random() - 0.5) * 40, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.Q.setValueAtTime(5.0, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else if (surface === 'crypt') {
      // Lajes Fúnebres e Ossos de Dungeon (impacto ecoante abafado)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110 + (Math.random() - 0.5) * 15, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.06);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.13, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    } else if (surface === 'water') {
      // Correntezas e Fundo Oceânico de Atlans (borbulhar de respingo aquático)
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
      // Ilhas Flutuantes de Aetherita de Icarus (sino vítreo e ressonância etérea)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760 + (Math.random() - 0.5) * 80, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.setValueAtTime(6.0, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
    } else {
      // Padrão / Fallback
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

  // ==========================================================================
  // 5. POÇÕES, ESQUIVA E HABILIDADES DE COMBATE
  // ==========================================================================
  public playPotionSound(type: 'health' | 'mana'): void {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'health') {
      // Borbulhar quente e revigorante
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    } else {
      // Ressonância Arcana Cristalina
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.22); // E6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  public playDodgeSound(): void {
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

  public playSkillSound(skillId: string): void {
    if (this.isMuted || !this.init() || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    if (skillId === 'cyclone' || skillId === 'TWISTING_SLASH') {
      // Vórtice Cortante (Cyclone Wind Slash)
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
      // Estocada Perfurante Letal (Lança de Raio)
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
    }
  }
}
