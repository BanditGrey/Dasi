/**
 * Dasi MMORPG - Sequência Cinemática & VFX do Chaos Machine (Client Gameplay)
 * Simula forja ativa dos Goblins de Noria, engrenagens mecânicas aceleradas e raio de fusão solar.
 */

export type ChaosForgePhase = 'IDLE' | 'IGNITION' | 'SURGE' | 'FUSION_BEAM' | 'CLIMAX' | 'COMPLETE';

export interface ChaosForgeConfig {
  ignitionDuration: number;  // tempo da fase 1 (engrenagens acelerando)
  surgeDuration: number;     // tempo da fase 2 (plasma e arcos elétricos)
  beamDuration: number;      // tempo da fase 3 (raio de fusão vertical)
  climaxDuration: number;    // tempo da fase 4 (explosão de shockwave e revelação)
}

export interface ChaosForgeState {
  phase: ChaosForgePhase;
  phaseTime: number;
  totalTime: number;
  gearSpeedMultiplier: number;
  coreHeat: number;
  laserBeamIntensity: number;
  isSuccess: boolean;
  isFinished: boolean;
}

export class ChaosMachineVFX {
  public config: ChaosForgeConfig = {
    ignitionDuration: 1.4,
    surgeDuration: 1.6,
    beamDuration: 1.2,
    climaxDuration: 1.0,
  };

  public state: ChaosForgeState = {
    phase: 'IDLE',
    phaseTime: 0,
    totalTime: 0,
    gearSpeedMultiplier: 1.0,
    coreHeat: 0.0,
    laserBeamIntensity: 0.0,
    isSuccess: true,
    isFinished: false,
  };

  private onPhaseCallback?: (phase: ChaosForgePhase, state: ChaosForgeState) => void;
  private onCompleteCallback?: (success: boolean) => void;

  public startForge(
    isSuccess: boolean = true,
    onPhaseChange?: (phase: ChaosForgePhase, state: ChaosForgeState) => void,
    onComplete?: (success: boolean) => void
  ): void {
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
    this.onPhaseCallback = onPhaseChange;
    this.onCompleteCallback = onComplete;

    if (this.onPhaseCallback) {
      this.onPhaseCallback('IGNITION', this.state);
    }
  }

  public reset(): void {
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

  /**
   * Atualização de ciclo de frame da simulação cinematográfica
   */
  public update(deltaTime: number): ChaosForgeState {
    if (this.state.phase === 'IDLE' || this.state.isFinished) {
      return this.state;
    }

    this.state.phaseTime += deltaTime;
    this.state.totalTime += deltaTime;

    switch (this.state.phase) {
      case 'IGNITION': {
        const progress = Math.min(1.0, this.state.phaseTime / this.config.ignitionDuration);
        // Engrenagens aceleram de 1x para 6x
        this.state.gearSpeedMultiplier = 1.0 + progress * 5.0;
        this.state.coreHeat = progress * 0.4;
        this.state.laserBeamIntensity = 0.0;

        if (progress >= 1.0) {
          this.transitionTo('SURGE');
        }
        break;
      }

      case 'SURGE': {
        const progress = Math.min(1.0, this.state.phaseTime / this.config.surgeDuration);
        // Engrenagens giram em velocidade máxima (8x)
        this.state.gearSpeedMultiplier = 6.0 + progress * 4.0;
        // Núcleo aquece para incandescência plena
        this.state.coreHeat = 0.4 + progress * 0.6;
        this.state.laserBeamIntensity = Math.sin(progress * Math.PI * 4) * 0.2;

        if (progress >= 1.0) {
          this.transitionTo('FUSION_BEAM');
        }
        break;
      }

      case 'FUSION_BEAM': {
        const progress = Math.min(1.0, this.state.phaseTime / this.config.beamDuration);
        // Raio de fusão desce com força máxima
        this.state.gearSpeedMultiplier = 10.0;
        this.state.coreHeat = 1.0;
        this.state.laserBeamIntensity = 0.8 + Math.sin(progress * 12.0) * 0.2;

        if (progress >= 1.0) {
          this.transitionTo('CLIMAX');
        }
        break;
      }

      case 'CLIMAX': {
        const progress = Math.min(1.0, this.state.phaseTime / this.config.climaxDuration);
        // Flash expansivo e desaceleração brusca
        this.state.laserBeamIntensity = Math.max(0, 1.0 - progress * 2.0);
        this.state.gearSpeedMultiplier = Math.max(1.0, 10.0 * (1.0 - progress));
        this.state.coreHeat = Math.max(0.0, 1.0 - progress);

        if (progress >= 1.0) {
          this.transitionTo('COMPLETE');
        }
        break;
      }

      case 'COMPLETE': {
        this.state.isFinished = true;
        this.state.gearSpeedMultiplier = 1.0;
        this.state.coreHeat = 0.0;
        this.state.laserBeamIntensity = 0.0;
        if (this.onCompleteCallback) {
          this.onCompleteCallback(this.state.isSuccess);
        }
        break;
      }
    }

    return this.state;
  }

  private transitionTo(nextPhase: ChaosForgePhase): void {
    this.state.phase = nextPhase;
    this.state.phaseTime = 0;
    if (nextPhase === 'COMPLETE') {
      this.state.isFinished = true;
      this.state.gearSpeedMultiplier = 1.0;
      this.state.coreHeat = 0.0;
      this.state.laserBeamIntensity = 0.0;
      if (this.onCompleteCallback) {
        this.onCompleteCallback(this.state.isSuccess);
      }
    }
    if (this.onPhaseCallback) {
      this.onPhaseCallback(nextPhase, this.state);
    }
  }

  // ==========================================================================
  // HELPERS PROCEDURAIS PARA RENDERIZAÇÃO 3D (THREE.JS)
  // ==========================================================================

  /**
   * Constrói o Raio de Fusão 3D e componentes de VFX para adicionar à cena
   */
  public static createFusionBeamMesh(THREE: any): {
    beamGroup: any;
    coreLaser: any;
    outerPlasma: any;
    shockwaveSphere: any;
    sparksPoints: any;
  } {
    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, 0, 0);

    // 1. Núcleo Laser Branco-Dourado Concentrado
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

    // 2. Halo de Plasma Solar Alaranjado
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

    // 3. Esfera de Onda de Choque no Impacto do Caldeirão
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

    // 4. Centelhas Elétricas Volumétricas
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

  /**
   * Atualiza a geometria e intensidade do raio de fusão na cena
   */
  public static applyVfxToMeshes(
    vfxMeshes: {
      coreLaser: any;
      outerPlasma: any;
      shockwaveSphere: any;
      sparksPoints: any;
    },
    state: ChaosForgeState,
    deltaTime: number
  ): void {
    const intensity = state.laserBeamIntensity;

    // Laser central
    vfxMeshes.coreLaser.material.opacity = intensity * 0.95;
    vfxMeshes.coreLaser.scale.set(1.0 + Math.sin(state.totalTime * 20) * 0.1, 1.0, 1.0 + Math.cos(state.totalTime * 20) * 0.1);

    // Plasma externo
    vfxMeshes.outerPlasma.material.opacity = intensity * 0.65;
    vfxMeshes.outerPlasma.rotation.y += deltaTime * 8.0;

    // Centelhas
    vfxMeshes.sparksPoints.material.opacity = Math.max(0, state.coreHeat * 0.85);

    // Onda de choque
    if (state.phase === 'CLIMAX') {
      const shockProgress = Math.min(1.0, state.phaseTime / 0.8);
      const scale = 1.0 + shockProgress * 8.0;
      vfxMeshes.shockwaveSphere.scale.set(scale, scale, scale);
      vfxMeshes.shockwaveSphere.material.opacity = (1.0 - shockProgress) * (state.isSuccess ? 0.9 : 0.4);
    } else {
      vfxMeshes.shockwaveSphere.scale.set(1, 1, 1);
      vfxMeshes.shockwaveSphere.material.opacity = 0.0;
    }
  }
}
