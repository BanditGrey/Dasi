/**
 * DASI MMORPG - MOTOR DE COLISÃO FÍSICA CLIENT-SIDE & REGISTRO DOS 56 CENÁRIOS
 * Compatível com WebGL Three.js e movimentação em tempo real (WASD & Click-to-Move).
 * 
 * Funcionalidades:
 * - Resolução física com deslizamento elástico (Sliding Contact Response)
 * - Projeção vetorial em tangentes de obstáculos para evitar engasgos em quinas
 * - Caixas AABB 3D, Cilindros Radiais, Limites Cilíndricos e Retangulares
 * - Geração de Wireframes 3D em tempo real para Debug Visual de Colisão
 */

export class DasiCollisionEngine {
  static DEFAULT_PLAYER_RADIUS = 0.45; // Raio da cápsula do herói em metros (0.45m a 0.50m)
  static DEFAULT_PLAYER_HEIGHT = 1.85; // Altura total oficial da cápsula (1.80m a 1.95m)
  static DEFAULT_STEP_HEIGHT = 0.35;   // Altura máxima para transposição de degraus

  /**
   * Catálogo de Colisores Oficiais do Bestiário Canônico (MU Online Season 5.2)
   */
  static MONSTER_COLLISIONS = Object.freeze({
    SPIDER: { radius: 0.45, height: 0.70, stepHeight: 0.25 },
    HOUND: { radius: 0.50, height: 1.10, stepHeight: 0.30 },
    BUDGE_DRAGON: { radius: 0.40, height: 1.00, stepHeight: 0.25 },
    BULL_FIGHTER: { radius: 0.65, height: 1.90, stepHeight: 0.35 },
    SKELETON: { radius: 0.45, height: 1.80, stepHeight: 0.35 },
    LICH: { radius: 0.55, height: 1.90, stepHeight: 0.35 },
    DEATH_KNIGHT: { radius: 0.60, height: 2.10, stepHeight: 0.35 },

    // Chefes Canônicos
    GORGON: { radius: 0.85, height: 2.40, stepHeight: 0.35 },
    ICE_QUEEN: { radius: 0.55, height: 2.00, stepHeight: 0.35 },
    BALROG: { radius: 1.10, height: 3.20, stepHeight: 0.45 },
    HYDRA: { radius: 1.40, height: 3.00, stepHeight: 0.45 },
    ZAIKAN: { radius: 1.20, height: 2.80, stepHeight: 0.45 },
    KUNDUN: { radius: 1.50, height: 3.60, stepHeight: 0.45 },

    // Invasão Dourada
    GOLDEN_BUDGE_DRAGON: { radius: 0.40, height: 1.00, stepHeight: 0.25 },
    GOLDEN_TITAN: { radius: 0.90, height: 2.60, stepHeight: 0.40 },
    GOLDEN_SOLDIER: { radius: 0.60, height: 2.10, stepHeight: 0.35 },
    GOLDEN_DRAGON: { radius: 1.20, height: 2.80, stepHeight: 0.45 },
    GOLDEN_LIZARD_KING: { radius: 0.85, height: 2.40, stepHeight: 0.40 },
    GOLDEN_TANTALOS: { radius: 1.20, height: 2.80, stepHeight: 0.45 },
  });

  static getMonsterCollision(type) {
    const key = String(type || '').trim().toUpperCase();
    return DasiCollisionEngine.MONSTER_COLLISIONS[key] || {
      radius: DasiCollisionEngine.DEFAULT_PLAYER_RADIUS,
      height: DasiCollisionEngine.DEFAULT_PLAYER_HEIGHT,
      stepHeight: DasiCollisionEngine.DEFAULT_STEP_HEIGHT,
    };
  }

  /**
   * Catálogo de Todos os 56 Cenários com Bounds, Spawn Points e Colisores Físicos
   * (47 de progressão nos 8 biomas + 5 de Castle Siege + 4 arenas de evento)
   */
  static SCENARIOS = {};

  static registerScenario(scenario) {
    DasiCollisionEngine.SCENARIOS[scenario.id] = scenario;
    if (scenario.code) {
      DasiCollisionEngine.SCENARIOS[scenario.code] = scenario;
    }
  }

  static getScenario(idOrCode) {
    return DasiCollisionEngine.SCENARIOS[idOrCode] || DasiCollisionEngine.SCENARIOS['LOR_01'];
  }

  static getAllScenarios() {
    // Retorna lista única filtrando os aliases de código
    const unique = new Map();
    for (const key of Object.keys(DasiCollisionEngine.SCENARIOS)) {
      const s = DasiCollisionEngine.SCENARIOS[key];
      unique.set(s.id, s);
    }
    return Array.from(unique.values());
  }

  /**
   * Resolve a movimentação física do jogador contra as barreiras do cenário
   * com resposta de deslizamento (tangent sliding) e clamp de limites.
   *
   * @param {string} scenarioId ID do cenário ativo (ex: 'LOR_01', 'DNG_06', 'LT_07')
   * @param {{x: number, z: number}} currentPos Posição atual do jogador
   * @param {{x: number, z: number}} targetPos Posição desejada
   * @param {number} playerRadius Raio da cápsula do jogador (padrão 0.45m)
   * @returns {{x: number, z: number, collided: boolean, collidersHit: string[]}}
   */
  static resolveMovement(
    scenarioId,
    currentPos,
    targetPos,
    playerRadius = DasiCollisionEngine.DEFAULT_PLAYER_RADIUS
  ) {
    const scenario = DasiCollisionEngine.getScenario(scenarioId);
    let finalX = targetPos.x;
    let finalZ = targetPos.z;
    let collided = false;
    const collidersHit = [];
    const hazardsHit = [];

    // 1. Clampa limites externos retangulares da cena
    const clampedX = Math.max(scenario.bounds.minX + playerRadius, Math.min(scenario.bounds.maxX - playerRadius, finalX));
    const clampedZ = Math.max(scenario.bounds.minZ + playerRadius, Math.min(scenario.bounds.maxZ - playerRadius, finalZ));
    if (clampedX !== finalX || clampedZ !== finalZ) {
      collided = true;
      collidersHit.push('BOUNDS_OUTER');
      finalX = clampedX;
      finalZ = clampedZ;
    }

    // 2. Itera pelos colisores físicos do cenário
    for (const col of scenario.colliders) {
      if (col.type === 'CYLINDER' || col.type === 'HAZARD') {
        const dx = finalX - col.x;
        const dz = finalZ - col.z;
        const dist = Math.hypot(dx, dz);
        const minDist = col.radius + playerRadius;

        if (dist < minDist) {
          collided = true;
          if (col.type === 'HAZARD') {
            // Zonas de perigo (lava, areia movediça, ácido) são atravessáveis:
            // sinalizam dano/queda ao gameplay sem bloquear o movimento.
            hazardsHit.push(col.id);
            continue;
          }
          collidersHit.push(col.id);
          if (dist > 0.0001) {
            const nx = dx / dist;
            const nz = dz / dist;
            // Projeta o jogador para fora do raio do cilindro (deslizamento radial)
            finalX = col.x + nx * minDist;
            finalZ = col.z + nz * minDist;
          } else {
            // Em caso de colisão no exato centro, projeta para fora na direção de onde o jogador veio
            const fromDx = currentPos.x - col.x;
            const fromDz = currentPos.z - col.z;
            const fromDist = Math.hypot(fromDx, fromDz);
            if (fromDist > 0.0001) {
              finalX = col.x + (fromDx / fromDist) * minDist;
              finalZ = col.z + (fromDz / fromDist) * minDist;
            } else {
              finalX += minDist;
            }
          }
        }
      } else if (col.type === 'BOX') {
        const halfW = col.width / 2 + playerRadius;
        const halfD = col.depth / 2 + playerRadius;
        const minBoxX = col.x - halfW;
        const maxBoxX = col.x + halfW;
        const minBoxZ = col.z - halfD;
        const maxBoxZ = col.z + halfD;

        if (finalX > minBoxX && finalX < maxBoxX && finalZ > minBoxZ && finalZ < maxBoxZ) {
          collided = true;
          collidersHit.push(col.id);

          // Restringe faces de saída válidas baseadas na direção de aproximação do jogador (anti-tunneling)
          const dLeft = Math.abs(finalX - minBoxX);
          const dRight = Math.abs(maxBoxX - finalX);
          const dTop = Math.abs(maxBoxZ - finalZ);
          const dBottom = Math.abs(finalZ - minBoxZ);

          const fromLeft = currentPos.x <= minBoxX;
          const fromRight = currentPos.x >= maxBoxX;
          const fromBottom = currentPos.z <= minBoxZ;
          const fromTop = currentPos.z >= maxBoxZ;

          let minD = Infinity;
          let edge = 'bottom';

          if (fromLeft && dLeft < minD) { minD = dLeft; edge = 'left'; }
          if (fromRight && dRight < minD) { minD = dRight; edge = 'right'; }
          if (fromBottom && dBottom < minD) { minD = dBottom; edge = 'bottom'; }
          if (fromTop && dTop < minD) { minD = dTop; edge = 'top'; }

          // Fallback se o jogador já começou dentro da AABB
          if (minD === Infinity) {
            minD = Math.min(dLeft, dRight, dTop, dBottom);
            if (minD === dLeft) edge = 'left';
            else if (minD === dRight) edge = 'right';
            else if (minD === dBottom) edge = 'bottom';
            else edge = 'top';
          }

          if (edge === 'left') finalX = minBoxX;
          else if (edge === 'right') finalX = maxBoxX;
          else if (edge === 'bottom') finalZ = minBoxZ;
          else if (edge === 'top') finalZ = maxBoxZ;
        }
      } else if (col.type === 'RADIAL_BOUNDARY') {
        const dx = finalX - col.x;
        const dz = finalZ - col.z;
        const dist = Math.hypot(dx, dz);
        const maxAllowed = col.maxRadius - playerRadius;

        if (dist > maxAllowed) {
          collided = true;
          collidersHit.push(col.id);
          if (dist > 0.0001) {
            const nx = dx / dist;
            const nz = dz / dist;
            finalX = col.x + nx * maxAllowed;
            finalZ = col.z + nz * maxAllowed;
          }
        }
      }
    }

    return { x: finalX, z: finalZ, collided, collidersHit, hazardsHit };
  }

  /**
   * Constrói uma malha Three.js em wireframe neon de todos os colisores do cenário
   * para visualização e verificação física em tempo real na tela.
   *
   * @param {string} scenarioId ID do cenário
   * @param {any} THREE Instância da biblioteca Three.js
   * @returns {any} THREE.Group com wireframes
   */
  static createDebugCollidersMesh(scenarioId, THREE) {
    const scenario = DasiCollisionEngine.getScenario(scenarioId);
    const debugGroup = new THREE.Group();
    debugGroup.name = `DebugColliders_${scenario.id}`;

    // Material de Borda do Mapa (Ciano Neon)
    const boundsMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85,
      linewidth: 2,
    });

    // Borda Retangular do Cenário
    const b = scenario.bounds;
    const boundsPts = [
      new THREE.Vector3(b.minX, 0.05, b.minZ),
      new THREE.Vector3(b.maxX, 0.05, b.minZ),
      new THREE.Vector3(b.maxX, 0.05, b.maxZ),
      new THREE.Vector3(b.minX, 0.05, b.maxZ),
      new THREE.Vector3(b.minX, 0.05, b.minZ),
    ];
    const boundsGeom = new THREE.BufferGeometry().setFromPoints(boundsPts);
    const boundsLine = new THREE.Line(boundsGeom, boundsMat);
    debugGroup.add(boundsLine);

    // Materiais dos Colisores
    const boxMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const cylMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const hazardMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });

    for (const col of scenario.colliders) {
      if (col.type === 'BOX') {
        const height = col.height || 2.5;
        const geo = new THREE.BoxGeometry(col.width, height, col.depth);
        const mesh = new THREE.Mesh(geo, boxMat);
        mesh.position.set(col.x, height / 2, col.z);
        debugGroup.add(mesh);
      } else if (col.type === 'CYLINDER') {
        const height = col.height || 3.0;
        const geo = new THREE.CylinderGeometry(col.radius, col.radius, height, 16);
        const mesh = new THREE.Mesh(geo, cylMat);
        mesh.position.set(col.x, height / 2, col.z);
        debugGroup.add(mesh);
      } else if (col.type === 'RADIAL_BOUNDARY') {
        const geo = new THREE.RingGeometry(col.maxRadius - 0.2, col.maxRadius, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          wireframe: true,
        });
        const mesh = new THREE.Mesh(geo, ringMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(col.x, 0.08, col.z);
        debugGroup.add(mesh);
      } else if (col.type === 'HAZARD') {
        const height = col.height || 1.0;
        const geo = new THREE.CylinderGeometry(col.radius, col.radius, height, 12);
        const mesh = new THREE.Mesh(geo, hazardMat);
        mesh.position.set(col.x, height / 2, col.z);
        debugGroup.add(mesh);
      }
    }

    return debugGroup;
  }

  /**
   * Constrói a cápsula wireframe oficial de colisão do herói (raio 0.45m, altura 1.85m,
   * anel de passo 0.35m) para depuração física em tempo real no cliente WebGL.
   *
   * @param {any} THREE Instância da biblioteca Three.js
   * @param {number} [radius=0.45] Raio da cápsula (0.45m a 0.50m)
   * @param {number} [height=1.85] Altura total da cápsula (1.80m a 1.95m)
   * @returns {any} THREE.Group contendo as malhas wireframe do volume de colisão do jogador
   */
  static createPlayerColliderMesh(
    THREE,
    radius = DasiCollisionEngine.DEFAULT_PLAYER_RADIUS,
    height = DasiCollisionEngine.DEFAULT_PLAYER_HEIGHT
  ) {
    const colliderGroup = new THREE.Group();
    colliderGroup.name = 'PlayerColliderMesh';

    // Material da cápsula wireframe (verde neon - entidade controlada pelo jogador)
    const capsuleMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });

    let capsuleGeom;
    if (typeof THREE.CapsuleGeometry === 'function') {
      const cylinderLength = Math.max(0.1, height - radius * 2);
      capsuleGeom = new THREE.CapsuleGeometry(radius, cylinderLength, 8, 16);
    } else {
      capsuleGeom = new THREE.CylinderGeometry(radius, radius, height, 16);
    }

    const capsuleMesh = new THREE.Mesh(capsuleGeom, capsuleMat);
    capsuleMesh.position.y = height / 2;
    capsuleMesh.name = 'PlayerCollider_Capsule';
    colliderGroup.add(capsuleMesh);

    // Anel de pegada radial no solo (0.45m)
    const baseMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const baseGeom = new THREE.RingGeometry(Math.max(0.05, radius - 0.04), radius, 32);
    const baseRing = new THREE.Mesh(baseGeom, baseMat);
    baseRing.rotation.x = -Math.PI / 2;
    baseRing.position.y = 0.02;
    baseRing.name = 'PlayerCollider_Footprint';
    colliderGroup.add(baseRing);

    // Anel de tolerância de passo (Step Height = 0.35m para degraus)
    const stepMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const stepGeom = new THREE.RingGeometry(Math.max(0.05, radius - 0.03), radius, 32);
    const stepRing = new THREE.Mesh(stepGeom, stepMat);
    stepRing.rotation.x = -Math.PI / 2;
    stepRing.position.y = DasiCollisionEngine.DEFAULT_STEP_HEIGHT;
    stepRing.name = 'PlayerCollider_StepThreshold';
    colliderGroup.add(stepRing);

    return colliderGroup;
  }
}

// ============================================================================
// REGISTRO OFICIAL DOS 56 CENÁRIOS CANÔNICOS DE DASI
// ============================================================================

import { SCENARIO_CATALOG } from '#dasi/server/world/CollisionSystem.ts';

for (const scenario of SCENARIO_CATALOG) {
  DasiCollisionEngine.registerScenario(scenario);
}
