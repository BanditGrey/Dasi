/**
 * Dasi MMORPG - Portais de Teletransporte 3D e Transição Dinâmica de Mapas (Client Gameplay)
 * Vórtice tridimensional místico com horizonte de eventos e transição contínua entre Lorencia, Noria e Devias.
 */

export interface PortalDefinition {
  id: string;
  sourceMap: string;
  targetMap: string;
  targetMapName: string;
  position: { x: number; y: number; z: number };
  radius: number;
  themeColor: number;
  runeColor: number;
  label: string;
}

export interface MapEnvironmentConfig {
  id: string;
  name: string;
  subtitle: string;
  ambientColor: number;
  sunColor: number;
  sunIntensity: number;
  fogColor: number;
  fogDensity: number;
  groundColor: number;
  spawnPoint: { x: number; z: number };
  monstersAllowed: string[];
}

export class PortalSystem {
  // Configuração dos 3 Reinos Principais do Continent of Legend
  public static readonly MAP_CONFIGS: Record<string, MapEnvironmentConfig> = {
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
      spawnPoint: { x: 0, z: 0 },
      monstersAllowed: ['SPIDER', 'BUDGE_DRAGON', 'BULL_FIGHTER', 'SKELETON'],
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
      monstersAllowed: ['SPIDER', 'BUDGE_DRAGON'],
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
      monstersAllowed: ['BULL_FIGHTER', 'SKELETON'],
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
      monstersAllowed: ['SKELETON', 'BULL_FIGHTER'],
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
      monstersAllowed: ['BULL_FIGHTER', 'SKELETON'],
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
      monstersAllowed: ['SPIDER', 'BUDGE_DRAGON'],
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
      monstersAllowed: ['BULL_FIGHTER', 'SPIDER'],
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
      monstersAllowed: ['BUDGE_DRAGON'],
    },
  };

  /**
   * Catálogo de Portais Existentes em cada mapa
   */
  public static getPortalsForMap(currentMap: string): PortalDefinition[] {
    if (currentMap === 'LORENCIA') {
      return [
        {
          id: 'portal_to_noria',
          sourceMap: 'LORENCIA',
          targetMap: 'NORIA',
          targetMapName: 'Noria (Feywood)',
          position: { x: 13.5, y: 0, z: -1.0 },
          radius: 2.2,
          themeColor: 0x10b981, // Esmeralda Élfica
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
          themeColor: 0x38bdf8, // Azul Glacial
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
          themeColor: 0xf59e0b, // Dourado Lorencia
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

  /**
   * Verifica se o jogador está em raio de ativação de algum portal
   */
  public static checkProximity(
    playerX: number,
    playerZ: number,
    currentMap: string
  ): PortalDefinition | null {
    const portals = this.getPortalsForMap(currentMap);
    for (const p of portals) {
      const dist = Math.hypot(p.position.x - playerX, p.position.z - playerZ);
      if (dist <= p.radius) {
        return p;
      }
    }
    return null;
  }

  // ==========================================================================
  // CONSTRUTOR DE MALHA 3D DE PORTAL COM VÓRTICE (THREE.JS)
  // ==========================================================================

  public static createPortal3DMesh(def: PortalDefinition, THREE: any): {
    group: any;
    vortexDisc: any;
    innerRing: any;
    outerRing: any;
    portalLight: any;
    particlesPoints: any;
    labelSprite: any;
  } {
    const group = new THREE.Group();
    group.position.set(def.position.x, def.position.y, def.position.z);

    // 1. Pilares Góticos de Pedra com Entalhes Rúnicos
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

    // Arco Superior Conector
    const archGeom = new THREE.BoxGeometry(3.4, 0.45, 0.55);
    const archMesh = new THREE.Mesh(archGeom, pillarMat);
    archMesh.position.set(0, 3.8, 0);
    group.add(archMesh);

    // 2. Anéis Rúnicos de Confinamento Dimensional
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

    // 3. Disco do Horizonte de Eventos (Vórtice Translúcido)
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

    // 4. Luz Pontual Temática do Portal
    const portalLight = new THREE.PointLight(def.themeColor, 3.2, 8.5);
    portalLight.position.set(0, 1.9, 0.2);
    group.add(portalLight);

    // 5. Partículas de Vórtice Espacial
    const particleCount = 45;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.3 + Math.random() * 1.0;
      particlePositions[i * 3 + 0] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = 1.9 + Math.sin(angle) * radius;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: def.runeColor,
      size: 0.08,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const particlesPoints = new THREE.Points(particleGeom, particleMat);
    group.add(particlesPoints);

    // 6. Placa / Etiqueta do Portal Flutuante (Billboard)
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 64;
    const lctx = labelCanvas.getContext('2d');
    if (lctx) {
      lctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
      lctx.roundRect ? lctx.roundRect(10, 8, 236, 48, 10) : lctx.fillRect(10, 8, 236, 48);
      lctx.fill();
      lctx.strokeStyle = `#${def.runeColor.toString(16).padStart(6, '0')}`;
      lctx.lineWidth = 3;
      lctx.strokeRect ? lctx.strokeRect(10, 8, 236, 48) : lctx.stroke();

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

  /**
   * Atualização contínua do vórtice 3D (rotação e pulso de luz)
   */
  public static updatePortalAnimation(
    portalMeshes: {
      vortexDisc: any;
      innerRing: any;
      outerRing: any;
      portalLight: any;
      particlesPoints: any;
    },
    time: number,
    delta: number
  ): void {
    // Rotação dos anéis em direções opostas
    portalMeshes.outerRing.rotation.z = time * 1.2;
    portalMeshes.innerRing.rotation.z = -time * 1.8;

    // Rotação sutil do disco de vórtice
    portalMeshes.vortexDisc.rotation.z = time * 0.8;

    // Pulso de respiração luminosa
    const pulse = 1.0 + Math.sin(time * 3.5) * 0.22;
    portalMeshes.portalLight.intensity = 3.2 * pulse;

    // Rotação das partículas em vórtice
    portalMeshes.particlesPoints.rotation.z = -time * 2.2;
  }
}
