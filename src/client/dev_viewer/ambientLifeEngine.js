/**
 * DASI MMORPG - AMBIENT LIFE & WORLD VITALITY ENGINE
 * Motor de vida ambiental, fauna dinâmica (critters), bandos de aves reativas,
 * cardumes de peixes de Atlans e iluminação dinâmica de tochas/braseiros.
 */

import * as THREE from './libs/three.module.js';
import { loadAnimatedCreatureGLB } from './dasi3dContent.js';

export class AmbientLifeEngine {
  constructor(scene, currentScenarioId = 'lorencia_citadel', audioSynthesizer = null) {
    this.scene = scene;
    this.currentScenarioId = currentScenarioId;
    this.audioSynthesizer = audioSynthesizer;
    this.enabled = true;
    this.containerGroup = new THREE.Group();
    this.containerGroup.name = 'DASI_AMBIENT_LIFE_ROOT';
    this.scene.add(this.containerGroup);

    this.birds = [];
    this.bats = [];
    this.fishes = [];
    this.torches = [];
    this.critters = [];
    this.clock = new THREE.Clock();

    this.initBiomeFauna(currentScenarioId);
  }

  /**
   * Alterna a visibilidade e atualização da fauna ambiental
   */
  toggleAmbient(enable) {
    this.enabled = enable !== undefined ? !!enable : !this.enabled;
    this.containerGroup.visible = this.enabled;
    return this.enabled;
  }

  /**
   * Limpa entidades ambientais ativas ao trocar de cenário
   */
  publicClear() {
    while (this.containerGroup.children.length > 0) {
      const child = this.containerGroup.children[0];
      this.containerGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
    this.birds = [];
    this.bats = [];
    this.fishes = [];
    this.torches = [];
    this.critters = [];
  }

  /**
   * Inicializa a fauna e ambientação específica do bioma ativo
   */
  initBiomeFauna(scenarioId) {
    this.publicClear();
    this.currentScenarioId = scenarioId;
    const sId = String(scenarioId || '').toLowerCase();

    if (sId.includes('lorencia') || sId.includes('noria')) {
      this.initFlockOfBirds(12, sId.includes('noria') ? 0x60a5fa : 0x334155);
      this.initTorches([
        { x: -6.5, y: 2.2, z: -6.5, color: 0xff7722, intensity: 2.2, dist: 14 },
        { x: 6.5, y: 2.2, z: -6.5, color: 0xff7722, intensity: 2.2, dist: 14 },
        { x: -6.5, y: 2.2, z: 6.5, color: 0xff7722, intensity: 2.2, dist: 14 },
        { x: 6.5, y: 2.2, z: 6.5, color: 0xff7722, intensity: 2.2, dist: 14 },
      ]);
      this.initWildCritters(3, 'fox');
    } else if (sId.includes('devias')) {
      // Braseiro Rei de Devias (Chama azul-dourada épica)
      this.initTorches([
        { x: 0, y: 3.5, z: 0, color: 0x38bdf8, intensity: 4.5, dist: 24 },
        { x: -10, y: 2.0, z: -8, color: 0xf59e0b, intensity: 2.5, dist: 12 },
        { x: 10, y: 2.0, z: -8, color: 0xf59e0b, intensity: 2.5, dist: 12 },
      ]);
    } else if (sId.includes('dungeon')) {
      this.initCaveBats(10);
      this.initTorches([
        { x: -4, y: 2.1, z: -4, color: 0x22c55e, intensity: 1.8, dist: 10 },
        { x: 4, y: 2.1, z: -4, color: 0x22c55e, intensity: 1.8, dist: 10 },
        { x: 0, y: 2.5, z: 8, color: 0x10b981, intensity: 2.0, dist: 12 },
      ]);
    } else if (sId.includes('atlans')) {
      this.initSchoolOfFish(18);
    } else if (sId.includes('lost_tower')) {
      this.initTorches([
        { x: -5, y: 2.4, z: -5, color: 0xef4444, intensity: 3.2, dist: 16 },
        { x: 5, y: 2.4, z: -5, color: 0xef4444, intensity: 3.2, dist: 16 },
      ]);
    }
  }

  // =========================================================================
  // 1. BANDO DE AVES REATIVAS (LORENCIA & NORIA)
  // =========================================================================
  initFlockOfBirds(count = 10, featherColor = 0x334155) {
    const birdGeo = new THREE.BufferGeometry();
    // V-shaped wing mesh simples e ultra-leve para 60 FPS
    const verts = new Float32Array([
      // Asa Esquerda
      -0.35, 0.0, -0.15,
      0.0, 0.0, 0.0,
      -0.15, 0.0, 0.2,
      // Asa Direita
      0.0, 0.0, 0.0,
      0.35, 0.0, -0.15,
      0.15, 0.0, 0.2,
    ]);
    birdGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    birdGeo.computeVertexNormals();

    const birdMat = new THREE.MeshStandardMaterial({
      color: featherColor,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(birdGeo, birdMat);
      const perchX = (Math.random() - 0.5) * 22;
      const perchZ = (Math.random() - 0.5) * 22;
      const perchY = 0.05 + Math.random() * 0.1;

      mesh.position.set(perchX, perchY, perchZ);
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.scale.setScalar(0.7 + Math.random() * 0.4);
      this.containerGroup.add(mesh);

      this.birds.push({
        mesh,
        state: 'LANDED', // 'LANDED' | 'TAKING_OFF' | 'FLYING' | 'LANDING'
        perchPos: new THREE.Vector3(perchX, perchY, perchZ),
        flyTarget: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        wingFlapSpeed: 10 + Math.random() * 6,
        wingFlapPhase: Math.random() * Math.PI * 2,
        flightAltitude: 3.5 + Math.random() * 3.5,
        orbitCenter: new THREE.Vector3(0, 5, 0),
        orbitRadius: 10 + Math.random() * 8,
        orbitSpeed: 0.8 + Math.random() * 0.6,
        orbitAngle: Math.random() * Math.PI * 2,
        stateTimer: Math.random() * 5,
      });
    }
  }

  // =========================================================================
  // 2. MORCEGOS CAVERNADORES (DUNGEON CATACOMBS)
  // =========================================================================
  initCaveBats(count = 8) {
    const batGeo = new THREE.BufferGeometry();
    const verts = new Float32Array([
      -0.25, 0, -0.1,  0, 0, 0,  -0.1, 0, 0.15,
       0, 0, 0,  0.25, 0, -0.1,   0.1, 0, 0.15,
    ]);
    batGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    batGeo.computeVertexNormals();

    const batMat = new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.DoubleSide });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(batGeo, batMat);
      mesh.position.set((Math.random() - 0.5) * 16, 2.5 + Math.random() * 1.5, (Math.random() - 0.5) * 16);
      this.containerGroup.add(mesh);

      this.bats.push({
        mesh,
        center: new THREE.Vector3((Math.random() - 0.5) * 10, 2.8, (Math.random() - 0.5) * 10),
        radius: 3 + Math.random() * 4,
        speed: 1.5 + Math.random() * 1.2,
        angle: Math.random() * Math.PI * 2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // =========================================================================
  // 3. CARDUME DE PEIXES (ATLANS THALASSA)
  // =========================================================================
  initSchoolOfFish(count = 15) {
    const fishGeo = new THREE.ConeGeometry(0.08, 0.32, 5);
    fishGeo.rotateX(Math.PI / 2);
    const fishMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.3,
    });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(fishGeo, fishMat);
      const angle = (i / count) * Math.PI * 2;
      mesh.position.set(Math.cos(angle) * 7, 0.6 + Math.random() * 1.8, Math.sin(angle) * 7);
      this.containerGroup.add(mesh);

      this.fishes.push({
        mesh,
        baseY: mesh.position.y,
        radius: 6 + Math.random() * 4,
        speed: 0.6 + Math.random() * 0.4,
        angle,
        wigglePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  // =========================================================================
  // 4. TOCHAS E BRASEIROS COM FLICKER DE LUZ DINÂMICA
  // =========================================================================
  initTorches(torchConfigs) {
    for (const cfg of torchConfigs) {
      const light = new THREE.PointLight(cfg.color, cfg.intensity, cfg.dist);
      light.position.set(cfg.x, cfg.y, cfg.z);
      light.castShadow = false; // Leveza de performance para manter 60 FPS
      this.containerGroup.add(light);

      // Partículas sutis de fogo
      const emberGeo = new THREE.BufferGeometry();
      const emberPos = new Float32Array(15 * 3);
      for (let i = 0; i < 15; i++) {
        emberPos[i * 3 + 0] = cfg.x + (Math.random() - 0.5) * 0.2;
        emberPos[i * 3 + 1] = cfg.y + Math.random() * 0.5;
        emberPos[i * 3 + 2] = cfg.z + (Math.random() - 0.5) * 0.2;
      }
      emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPos, 3));
      const emberMat = new THREE.PointsMaterial({
        color: cfg.color,
        size: 0.08,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const emberPoints = new THREE.Points(emberGeo, emberMat);
      this.containerGroup.add(emberPoints);

      this.torches.push({
        light,
        emberPoints,
        baseIntensity: cfg.intensity,
        baseColor: new THREE.Color(cfg.color),
        flickerSeed: Math.random() * 100,
      });
    }
  }

  // =========================================================================
  // 5. FAUNA TERRESTRE (RAPOSAS SELVAGENS & CRITTERS DE LORENCIA/NORIA)
  // =========================================================================
  initWildCritters(count = 3, kind = 'fox') {
    const glbPath = 'models/critters/fox_animated.glb';

    for (let i = 0; i < count; i++) {
      const group = new THREE.Group();
      group.name = `CRITTER_${kind.toUpperCase()}_${i}`;

      const posX = (i === 0 ? -5.5 : i === 1 ? 5.5 : 0) + (Math.random() - 0.5) * 2.0;
      const posZ = 7.0 + i * 3.5 + (Math.random() - 0.5) * 2.0;
      group.position.set(posX, 0, posZ);
      group.rotation.y = Math.random() * Math.PI * 2;

      // Geometria leve de fallback/placeholder caso o GLB demore a carregar ou ambiente headless
      const bodyGeo = new THREE.ConeGeometry(0.25, 0.6, 6);
      bodyGeo.rotateX(Math.PI / 2);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xd97706,
        roughness: 0.65,
        metalness: 0.1,
      });
      const fallbackMesh = new THREE.Mesh(bodyGeo, bodyMat);
      fallbackMesh.position.y = 0.25;
      fallbackMesh.name = 'CRITTER_FALLBACK_BODY';
      group.add(fallbackMesh);

      const critterData = {
        group,
        fallbackMesh,
        kind,
        state: 'GRAZING', // 'GRAZING' | 'PATROL' | 'FLEEING'
        territoryCenter: new THREE.Vector3(posX, 0, posZ),
        targetPos: new THREE.Vector3(posX, 0, posZ),
        fleeDirection: new THREE.Vector3(),
        speed: 1.1,
        stateTimer: 2.0 + Math.random() * 3.0,
        animController: null,
      };

      if (typeof window !== 'undefined' && typeof loadAnimatedCreatureGLB === 'function') {
        loadAnimatedCreatureGLB(
          glbPath,
          group,
          THREE,
          (model, animCtrl) => {
            critterData.animController = animCtrl;
            fallbackMesh.visible = false;
            model.scale.setScalar(0.7);
            animCtrl.playAction('idle');
          },
          [fallbackMesh]
        );
      }

      this.critters.push(critterData);
      this.containerGroup.add(group);
    }
  }

  // =========================================================================
  // CICLO DE ATUALIZAÇÃO POR FRAME (60 FPS)
  // =========================================================================
  update(delta, playerPos) {
    if (!this.enabled || !this.containerGroup.visible) return;
    const elapsed = this.clock.getElapsedTime();

    // 1. Atualiza Aves (Lorencia / Noria)
    for (const bird of this.birds) {
      const bPos = bird.mesh.position;
      const distToPlayer = playerPos ? bPos.distanceTo(playerPos) : 999;

      // Reação ao Jogador: se o jogador se aproximar a menos de 4m, a ave decola
      if (bird.state === 'LANDED') {
        if (distToPlayer < 4.2) {
          bird.state = 'TAKING_OFF';
          bird.velocity.set((bPos.x - playerPos.x) * 1.5, 3.5, (bPos.z - playerPos.z) * 1.5);
          if (this.audioSynthesizer && typeof this.audioSynthesizer.playWildlifeSound === 'function') {
            this.audioSynthesizer.playWildlifeSound('wings');
          }
        } else {
          // Bate a asa sutilmente ou bica o chão
          bird.mesh.rotation.x = Math.sin(elapsed * 2 + bird.wingFlapPhase) * 0.1;
        }
      } else if (bird.state === 'TAKING_OFF') {
        bPos.addScaledVector(bird.velocity, delta);
        bird.mesh.rotation.y = Math.atan2(bird.velocity.x, bird.velocity.z);
        // Bater de asas rápido
        bird.mesh.scale.x = (0.7 + Math.sin(elapsed * bird.wingFlapSpeed) * 0.3);

        if (bPos.y >= bird.flightAltitude) {
          bird.state = 'FLYING';
          bird.orbitCenter.set(bPos.x, bird.flightAltitude, bPos.z);
        }
      } else if (bird.state === 'FLYING') {
        bird.orbitAngle += bird.orbitSpeed * delta;
        const targetX = bird.orbitCenter.x + Math.cos(bird.orbitAngle) * bird.orbitRadius;
        const targetZ = bird.orbitCenter.z + Math.sin(bird.orbitAngle) * bird.orbitRadius;
        const targetY = bird.flightAltitude + Math.sin(elapsed * 1.2 + bird.wingFlapPhase) * 0.6;

        const dx = targetX - bPos.x;
        const dz = targetZ - bPos.z;
        bPos.x += dx * 2.0 * delta;
        bPos.z += dz * 2.0 * delta;
        bPos.y = targetY;

        bird.mesh.rotation.y = Math.atan2(dx, dz);
        bird.mesh.rotation.z = Math.sin(elapsed * 2) * 0.15; // Inclinação aerodinâmica
        bird.mesh.scale.x = 0.8 + Math.sin(elapsed * (bird.wingFlapSpeed * 0.7)) * 0.25;

        // Se o jogador estiver longe e a ave voou bastante, ela pousa de volta
        bird.stateTimer += delta;
        if (bird.stateTimer > 18.0 && distToPlayer > 8.0) {
          bird.state = 'LANDING';
        }
      } else if (bird.state === 'LANDING') {
        bPos.lerp(bird.perchPos, 1.2 * delta);
        bird.mesh.scale.x = 0.8 + Math.sin(elapsed * bird.wingFlapSpeed) * 0.2;
        if (bPos.distanceTo(bird.perchPos) < 0.25) {
          bPos.copy(bird.perchPos);
          bird.state = 'LANDED';
          bird.stateTimer = 0;
          bird.mesh.rotation.z = 0;
        }
      }
    }

    // 2. Atualiza Morcegos (Dungeon)
    for (const bat of this.bats) {
      bat.angle += bat.speed * delta;
      bat.mesh.position.x = bat.center.x + Math.cos(bat.angle) * bat.radius;
      bat.mesh.position.z = bat.center.z + Math.sin(bat.angle) * bat.radius;
      bat.mesh.position.y = bat.center.y + Math.sin(elapsed * 4 + bat.phase) * 0.35;
      bat.mesh.rotation.y = bat.angle + Math.PI / 2;
      bat.mesh.scale.x = 0.8 + Math.sin(elapsed * 18 + bat.phase) * 0.3; // Bate asas rápido
    }
    if (this.bats.length > 0 && this.audioSynthesizer && typeof this.audioSynthesizer.playWildlifeSound === 'function') {
      if (Math.random() < 0.003) {
        this.audioSynthesizer.playWildlifeSound('bat');
      }
    }

    // 3. Atualiza Cardume de Peixes (Atlans)
    for (const fish of this.fishes) {
      fish.angle += fish.speed * delta;
      fish.mesh.position.x = Math.cos(fish.angle) * fish.radius;
      fish.mesh.position.z = Math.sin(fish.angle) * fish.radius;
      fish.mesh.position.y = fish.baseY + Math.sin(elapsed * 2.5 + fish.wigglePhase) * 0.2;
      fish.mesh.rotation.y = fish.angle + Math.PI;
      fish.mesh.rotation.z = Math.sin(elapsed * 8 + fish.wigglePhase) * 0.15; // Ondulação da cauda
    }

    // 4. Atualiza Tochas e Braseiros (Flicker Orgânico)
    for (const torch of this.torches) {
      const flicker = 1.0 + 0.14 * Math.sin(elapsed * 14 + torch.flickerSeed) +
                            0.08 * Math.cos(elapsed * 29 + torch.flickerSeed * 1.5) +
                            0.05 * Math.sin(elapsed * 47);
      torch.light.intensity = torch.baseIntensity * flicker;

      // Anima partículas de fuligem subindo
      if (torch.emberPoints) {
        const posAttr = torch.emberPoints.geometry.attributes.position;
        const arr = posAttr.array;
        for (let i = 0; i < arr.length / 3; i++) {
          arr[i * 3 + 1] += delta * 0.45;
          arr[i * 3 + 0] += Math.sin(elapsed * 3 + i) * 0.003;
          if (arr[i * 3 + 1] > torch.light.position.y + 0.9) {
            arr[i * 3 + 1] = torch.light.position.y;
            arr[i * 3 + 0] = torch.light.position.x + (Math.random() - 0.5) * 0.18;
          }
        }
        posAttr.needsUpdate = true;
      }
    }

    // 5. Atualiza Fauna Terrestre (Raposas Selvagens)
    for (const critter of this.critters) {
      const cPos = critter.group.position;
      const distToPlayer = playerPos ? cPos.distanceTo(playerPos) : 999;

      if (critter.state === 'FLEEING') {
        // Fuga galopando em alta velocidade
        cPos.addScaledVector(critter.fleeDirection, critter.speed * delta);
        const targetAngle = Math.atan2(critter.fleeDirection.x, critter.fleeDirection.z);
        critter.group.rotation.y = THREE.MathUtils.lerp(critter.group.rotation.y, targetAngle, Math.min(1.0, 10 * delta));

        critter.stateTimer -= delta;
        if (critter.stateTimer <= 0 && distToPlayer > 8.0) {
          critter.state = 'GRAZING';
          critter.speed = 1.1;
          critter.stateTimer = 3.0 + Math.random() * 4.0;
          if (critter.animController) critter.animController.playAction('idle');
        }
      } else {
        // Reação ao Jogador: aproximação súbita (< 4.5m) assusta o animal
        if (distToPlayer < 4.5 && playerPos) {
          critter.state = 'FLEEING';
          critter.speed = 4.2; // Galope rápido
          critter.fleeDirection.set(cPos.x - playerPos.x, 0, cPos.z - playerPos.z).normalize();
          if (critter.fleeDirection.lengthSq() < 0.001) {
            critter.fleeDirection.set(1, 0, 0);
          }
          critter.stateTimer = 3.5 + Math.random() * 2.0;
          if (critter.animController) critter.animController.playAction('run');
          if (this.audioSynthesizer && typeof this.audioSynthesizer.playWildlifeSound === 'function') {
            this.audioSynthesizer.playWildlifeSound('wings');
          }
        } else if (critter.state === 'PATROL') {
          const dx = critter.targetPos.x - cPos.x;
          const dz = critter.targetPos.z - cPos.z;
          const distToTarget = Math.sqrt(dx * dx + dz * dz);

          if (distToTarget < 0.35) {
            critter.state = 'GRAZING';
            critter.stateTimer = 2.5 + Math.random() * 3.5;
            if (critter.animController) critter.animController.playAction('idle');
          } else {
            cPos.x += (dx / distToTarget) * critter.speed * delta;
            cPos.z += (dz / distToTarget) * critter.speed * delta;
            const targetAngle = Math.atan2(dx, dz);
            critter.group.rotation.y = THREE.MathUtils.lerp(critter.group.rotation.y, targetAngle, Math.min(1.0, 8 * delta));
          }
        } else if (critter.state === 'GRAZING') {
          critter.stateTimer -= delta;
          if (critter.stateTimer <= 0) {
            critter.state = 'PATROL';
            critter.speed = 1.2;
            const patrolAngle = Math.random() * Math.PI * 2;
            const patrolDist = 1.5 + Math.random() * 3.5;
            critter.targetPos.set(
              critter.territoryCenter.x + Math.cos(patrolAngle) * patrolDist,
              critter.territoryCenter.y,
              critter.territoryCenter.z + Math.sin(patrolAngle) * patrolDist
            );
            if (critter.animController) critter.animController.playAction('walk');
          }
        }
      }

      if (critter.animController) {
        critter.animController.update(delta);
      }
    }
  }
}
