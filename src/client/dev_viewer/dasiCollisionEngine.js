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
  static DEFAULT_PLAYER_RADIUS = 0.45; // Raio da cápsula do herói em metros

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
            // Em caso de colisão no exato centro
            finalX += minDist;
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

          // Determina a borda mais próxima para deslizar
          const dLeft = Math.abs(finalX - minBoxX);
          const dRight = Math.abs(maxBoxX - finalX);
          const dTop = Math.abs(maxBoxZ - finalZ);
          const dBottom = Math.abs(finalZ - minBoxZ);

          const minD = Math.min(dLeft, dRight, dTop, dBottom);
          if (minD === dLeft) finalX = minBoxX;
          else if (minD === dRight) finalX = maxBoxX;
          else if (minD === dBottom) finalZ = minBoxZ;
          else if (minD === dTop) finalZ = maxBoxZ;
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
}

// ============================================================================
// REGISTRO OFICIAL DOS 56 CENÁRIOS CANÔNICOS DE DASI
// ============================================================================

import { SCENARIO_CATALOG } from '#dasi/server/world/CollisionSystem.ts';

for (const scenario of SCENARIO_CATALOG) {
  DasiCollisionEngine.registerScenario(scenario);
}
