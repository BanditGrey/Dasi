/**
 * Dasi MMORPG - Sistema de Level Up e Efeitos Visuais/Sonoros (Client Gameplay)
 * Auréola dourada ascendente, partículas de luz solar em espiral e fanfarra triunfante.
 */

export interface LevelProgression {
  currentLevel: number;
  currentXp: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPct: number;
  freeStatPoints: number;
  maxHp: number;
  maxMp: number;
  leveledUp: boolean;
}

export interface LevelUpParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class LevelUpSystem {
  public static readonly BASE_XP = 1000;
  public static readonly XP_GROWTH_FACTOR = 1.15;
  public static readonly STAT_POINTS_PER_LEVEL = 5;

  /**
   * Calcula o XP total necessário para alcançar determinado nível.
   */
  public static getXpRequiredForLevel(level: number): number {
    if (level <= 1) return 0;
    let total = 0;
    for (let l = 1; l < level; l++) {
      total += Math.round(this.BASE_XP * Math.pow(this.XP_GROWTH_FACTOR, l - 1));
    }
    return total;
  }

  /**
   * Processa acúmulo de XP e identifica progressão e elevação de nível.
   */
  public static processXpGain(
    currentLevel: number,
    currentXp: number,
    xpGained: number
  ): LevelProgression {
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

    // Bônus de vitais calculados com base no nível
    const maxHp = 1000 + (newLevel - 1) * 25;
    const maxMp = 450 + (newLevel - 1) * 18;

    return {
      currentLevel: newLevel,
      currentXp: newXp,
      xpForCurrentLevel: currentBaseXp,
      xpForNextLevel: nextTargetXp,
      progressPct,
      freeStatPoints: (newLevel - 1) * this.STAT_POINTS_PER_LEVEL,
      maxHp,
      maxMp,
      leveledUp,
    };
  }

  // ==========================================================================
  // GERENCIADOR DO EFEITO VISUAL 3D (THREE.JS COMPATIBLE)
  // ==========================================================================

  /**
   * Constrói a estrutura de malhas 3D para o efeito de Level Up
   * (Auréola dourada, Coluna de Luz Solar, Anel de Chão e Partículas)
   */
  public static createLevelUp3DGroup(THREE: any): {
    group: any;
    aureoleMesh: any;
    lightBeamMesh: any;
    groundShockMesh: any;
    particlesMesh: any;
    particlePositions: Float32Array;
    lightSource: any;
  } {
    const group = new THREE.Group();

    // 1. Auréola Dourada Ascendente (Torus brilhante)
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

    // 4. Partículas Solares em Espiral Ascendente
    const particleCount = 80;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleGeom = new THREE.BufferGeometry();

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 4;
      const radius = 0.55 + Math.random() * 0.4;
      particlePositions[i * 3 + 0] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = Math.random() * 1.5;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.12,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const particlesMesh = new THREE.Points(particleGeom, particleMat);
    group.add(particlesMesh);

    // 5. Luz Pontual Solar Dourada
    const lightSource = new THREE.PointLight(0xfacc15, 4.5, 12);
    lightSource.position.set(0, 1.8, 0);
    group.add(lightSource);

    return {
      group,
      aureoleMesh,
      lightBeamMesh,
      groundShockMesh,
      particlesMesh,
      particlePositions,
      lightSource,
    };
  }

  /**
   * Atualiza a física de animação do efeito de Level Up
   * Retorna true enquanto a animação estiver ativa.
   */
  public static updateLevelUpAnimation(
    state: {
      elapsed: number;
      duration: number;
      aureoleMesh: any;
      lightBeamMesh: any;
      groundShockMesh: any;
      particlesMesh: any;
      particlePositions: Float32Array;
      lightSource: any;
    },
    deltaTime: number
  ): boolean {
    state.elapsed += deltaTime;
    const progress = Math.min(1.0, state.elapsed / state.duration);
    const remainingAlpha = 1.0 - Math.pow(progress, 1.8);

    // 1. Auréola sobe em aceleração suave e expande em raio
    const currentY = Math.pow(progress, 0.75) * 3.8;
    const currentScale = 1.0 + progress * 1.6;
    state.aureoleMesh.position.y = currentY;
    state.aureoleMesh.scale.set(currentScale, currentScale, currentScale);
    state.aureoleMesh.material.opacity = remainingAlpha * 0.95;

    // 2. Coluna de luz expande e desvanece
    state.lightBeamMesh.scale.set(1.0 + progress * 0.4, 1.0 + progress * 0.2, 1.0 + progress * 0.4);
    state.lightBeamMesh.material.opacity = remainingAlpha * 0.55;

    // 3. Onda de choque no chão expande velozmente
    const groundScale = 1.0 + progress * 4.2;
    state.groundShockMesh.scale.set(groundScale, groundScale, 1.0);
    state.groundShockMesh.material.opacity = remainingAlpha * 0.85;

    // 4. Partículas sobem em rotação espiral
    const count = state.particlePositions.length / 3;
    for (let i = 0; i < count; i++) {
      state.particlePositions[i * 3 + 1] += deltaTime * (2.4 + (i % 5) * 0.3); // sobe
      const x = state.particlePositions[i * 3 + 0];
      const z = state.particlePositions[i * 3 + 2];
      const rotSpeed = 3.5 * deltaTime;
      state.particlePositions[i * 3 + 0] = x * Math.cos(rotSpeed) - z * Math.sin(rotSpeed);
      state.particlePositions[i * 3 + 2] = x * Math.sin(rotSpeed) + z * Math.cos(rotSpeed);
    }
    state.particlesMesh.geometry.attributes.position.needsUpdate = true;
    state.particlesMesh.material.opacity = remainingAlpha * 0.9;

    // 5. Luz Solar
    state.lightSource.intensity = remainingAlpha * 4.5;

    return progress < 1.0;
  }

  // ==========================================================================
  // RENDERIZADOR 2D DE FALLBACK (CANVAS RETRO)
  // ==========================================================================
  public static render2DLevelUpEffect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    progress: number
  ): void {
    const alpha = Math.max(0, 1 - progress);
    ctx.save();

    // 1. Anel Dourado Ascendente
    const aureoleY = y - progress * 80;
    const ringRadius = 24 + progress * 32;

    ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`;
    ctx.lineWidth = 4 * alpha;
    ctx.beginPath();
    ctx.ellipse(x, aureoleY, ringRadius, ringRadius * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Coluna de Luz Solar
    const colGrad = ctx.createLinearGradient(x, y + 10, x, y - 120);
    colGrad.addColorStop(0, `rgba(253, 224, 71, ${alpha * 0.6})`);
    colGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = colGrad;
    ctx.fillRect(x - 22, y - 120, 44, 130);

    // 3. Faíscas Solares em Órbita
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + progress * 6.0;
      const dist = 30 + (i % 4) * 8;
      const px = x + Math.cos(angle) * dist;
      const py = y - progress * 90 + Math.sin(angle) * 12;

      ctx.fillStyle = `rgba(254, 240, 138, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
