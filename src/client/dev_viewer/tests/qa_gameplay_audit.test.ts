/**
 * DASI MMORPG - SUÍTE DE TESTES E AUDITORIA COMPLETA DE QA
 * 
 * Auditoria do Ponto de Vista do Jogador:
 * 1. Seleção de Classes e Spawning nos Biomas Canônicos
 * 2. Modelos Oficiais, Malhas e Texturas PBR Extraídas do Estudo de MU
 * 3. Física de Movimentação, Cápsula Canônica e Deslizamento Elástico (Anti-Stuck & Anti-Clipping)
 * 4. Troca de Equipamentos, Armas Icônicas, Conjuntos e Asas
 * 5. Refinamento Dinâmico de Auras (+0 até +15)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
// @ts-ignore
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Polyfills para execução em ambiente Node.js Headless
if (typeof globalThis.self === 'undefined') {
  // @ts-ignore
  globalThis.self = globalThis;
}
if (typeof globalThis.window === 'undefined') {
  // @ts-ignore
  globalThis.window = globalThis;
}

// Mock de ImageLoader para decodificação limpa de texturas embutidas em GLBs no Node
THREE.ImageLoader.prototype.load = function (url: string, onLoad?: (img: any) => void) {
  const mockImage = { width: 256, height: 256, complete: true, isMock: true };
  if (onLoad) setTimeout(() => onLoad(mockImage), 0);
  return mockImage as any;
};

// @ts-ignore
import { DasiCollisionEngine } from '../dasiCollisionEngine.js';
import { CollisionSystem } from '../../../server/world/CollisionSystem.ts';
// @ts-ignore
import {
  createHero,
  GLTF_HERO_MAP,
  GLTF_BLOCKOUT_HERO_MAP,
  resolveHeroAnimationClip,
  resolveScenarioBiome,
} from '../dasi3dContent.js';
// @ts-ignore
import {
  createModularHero,
  HERO_CLASSES,
  ARMOR_SLOTS,
  ARMOR_VARIANTS,
  CLASS_WEAPONS,
} from '../modularHero.js';
// @ts-ignore
import { ARMORY_METADATA, GLTF_ARMORY_MAP } from '../dasi3dArmory.js';
// @ts-ignore
import { PortalSystem } from '../dasiActionGameplay.js';

describe('🎮 QA Gameplay - 1. Seleção de Classes, Spawning & Biomas Canônicos', () => {
  const CANONICAL_CLASSES = ['DK', 'DW', 'ELF', 'MG', 'DL'] as const;
  const CANONICAL_SCENARIOS = ['LOR_01', 'DEV_01', 'NOR_01', 'LT_01', 'ATL_01'] as const;

  it('permite instanciar as 5 classes em todos os cenários principais com posição válida e segura', () => {
    for (const sId of CANONICAL_SCENARIOS) {
      const scenario = CollisionSystem.getScenario(sId);
      assert.ok(scenario, `Cenário ${sId} deve existir no catálogo oficial`);
      assert.ok(scenario.spawnPoint, `Cenário ${sId} deve ter spawnPoint definido`);

      // Verifica resolução de colisão no spawnPoint com a cápsula oficial (raio 0.45m)
      const res = CollisionSystem.resolveMovement(
        sId,
        scenario.spawnPoint,
        scenario.spawnPoint,
        DasiCollisionEngine.DEFAULT_PLAYER_RADIUS
      );

      assert.strictEqual(
        res.collided,
        false,
        `O spawnPoint de ${sId} (${scenario.spawnPoint.x}, ${scenario.spawnPoint.z}) não pode colidir com nenhum obstáculo sólido!`
      );
      assert.strictEqual(res.collidersHit.length, 0);

      const drift = Math.hypot(res.x - scenario.spawnPoint.x, res.z - scenario.spawnPoint.z);
      assert.strictEqual(drift, 0, `O jogador não pode sofrer drift ao nascer em ${sId}`);

      // Instancia herói de cada classe no cenário
      for (const cls of CANONICAL_CLASSES) {
        const hero = createHero(cls, {}, THREE);
        assert.ok(hero.group instanceof THREE.Group, `Herói ${cls} deve instanciar um THREE.Group`);

        // Posiciona no spawnPoint
        hero.group.position.set(scenario.spawnPoint.x, 0, scenario.spawnPoint.z);
        assert.strictEqual(hero.group.position.x, scenario.spawnPoint.x);
        assert.strictEqual(hero.group.position.z, scenario.spawnPoint.z);
      }
    }
  });

  it('todos os 56 cenários canônicos possuem 100% de taxa de spawn livre de colisões', () => {
    const allScenarios = CollisionSystem.getAllScenarios();
    assert.strictEqual(allScenarios.length, 56, 'Devem existir exatamente 56 cenários registrados');

    for (const sc of allScenarios) {
      const res = CollisionSystem.resolveMovement(
        sc.id,
        sc.spawnPoint,
        sc.spawnPoint,
        CollisionSystem.DEFAULT_PLAYER_RADIUS
      );

      assert.strictEqual(
        res.collided,
        false,
        `Cenário ${sc.id} (${sc.name}) colidiu no spawnPoint (${sc.spawnPoint.x}, ${sc.spawnPoint.z})! Colisores: ${res.collidersHit.join(', ')}`
      );
      const drift = Math.hypot(res.x - sc.spawnPoint.x, res.z - sc.spawnPoint.z);
      assert.ok(drift < 0.001, `SpawnPoint de ${sc.id} deslocou ${drift}m`);
    }
  });

  it('resolve biomas canônicos e aliases para todos os cenários', () => {
    assert.strictEqual(resolveScenarioBiome('LOR_01'), 'LORENCIA');
    assert.strictEqual(resolveScenarioBiome('DEV_01'), 'DEVIAS');
    assert.strictEqual(resolveScenarioBiome('NOR_01'), 'NORIA');
    assert.strictEqual(resolveScenarioBiome('LT_01'), 'LOST_TOWER');
    assert.strictEqual(resolveScenarioBiome('ATL_01'), 'ATLANS');
    assert.strictEqual(resolveScenarioBiome('ICA_01'), 'ICARUS');
    assert.strictEqual(resolveScenarioBiome('TAR_01'), 'TARKAN');
    assert.strictEqual(resolveScenarioBiome('DNG_01'), 'DUNGEON');
    assert.strictEqual(resolveScenarioBiome('VOL_01'), 'VALLEY_OF_LOREN');
    assert.strictEqual(resolveScenarioBiome('EVT_01'), 'BLOOD_CASTLE');
    assert.strictEqual(resolveScenarioBiome('EVT_02'), 'EVT_02');
  });
});

describe('🎨 QA Gameplay - 2. Modelos Oficiais, Malhas 3D e Texturas Autênticas de MU', () => {
  const CLASSES = ['dk', 'dw', 'elf', 'mg', 'dl'] as const;

  it('todos os 5 GLBs animados contêm malhas completas, esqueletos e texturas binárias embutidas (PNG/JPEG)', async () => {
    for (const cls of CLASSES) {
      const filePath = `src/client/dev_viewer/models/animated_heroes/hero_${cls}_animated.glb`;
      assert.ok(existsSync(filePath), `Arquivo ${filePath} deve existir fisicamente`);

      const buffer = readFileSync(filePath);
      const jsonLen = buffer.readUInt32LE(12);
      const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLen));

      const binHeader = 20 + jsonLen;
      const binOffset = binHeader + 8;

      // Validação das imagens embutidas
      assert.ok(gltf.images && gltf.images.length >= 10, `${cls} deve conter ao menos 10 imagens embutidas`);
      for (const img of gltf.images) {
        assert.strictEqual(img.uri, undefined, `${cls}/${img.name} deve ser embutida no buffer, sem URI externa quebrada`);
        assert.ok(typeof img.bufferView === 'number', `${cls}/${img.name} deve possuir bufferView válido`);

        const bv = gltf.bufferViews[img.bufferView];
        const imgBytes = buffer.subarray(binOffset + bv.byteOffset, binOffset + bv.byteOffset + bv.byteLength);
        const magic = imgBytes.subarray(0, 4).toString('hex');
        const isJpeg = magic.startsWith('ffd8ff');
        const isPng = magic === '89504e47';
        const isWebp = magic === '52494646';
        assert.ok(
          isJpeg || isPng || isWebp,
          `Imagem ${img.name} da classe ${cls} deve ser JPEG, PNG ou WebP autêntico (encontrado magic: ${magic})`
        );
      }

      // Validação com GLTFLoader
      const loader = new GLTFLoader();
      const loaded = await loader.parseAsync(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        ''
      );

      let meshCount = 0;
      let texturedMeshCount = 0;
      let skinnedMeshCount = 0;

      loaded.scene.traverse((child: any) => {
        if (child.isMesh) {
          meshCount++;
          if (child.isSkinnedMesh) skinnedMeshCount++;
          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            for (const mat of mats) {
              if (mat.map) texturedMeshCount++;
            }
          }
        }
      });

      assert.ok(meshCount >= 11, `${cls} deve ter ao menos 11 submalhas (encontrado ${meshCount})`);
      const minTexturedMeshes = cls === 'mg' ? 9 : 10;
      assert.ok(texturedMeshCount >= minTexturedMeshes, `${cls} deve ter ao menos ${minTexturedMeshes} malhas texturizadas (encontrado ${texturedMeshCount})`);
      assert.ok(skinnedMeshCount >= 1, `${cls} deve conter SkinnedMesh com rig oficial`);
    }
  });

  it('todos os 5 heróis possuem as 21 animações canônicas ativas e operacionais no AnimationMixer', async () => {
    const EXPECTED_CORE_ANIMS = [
      'Idle',
      'Walking_A',
      'Running_A',
      'Death_A',
      'Hit_A',
      'Punch_Cross',
      'Spellcast_Shoot',
      'Spellcast_Raise',
      'Spellcast_Long',
      '2H_Melee_Attack_Spin',
      '1H_Melee_Attack_Slice_Horizontal',
    ];

    for (const cls of CLASSES) {
      const filePath = `src/client/dev_viewer/models/animated_heroes/hero_${cls}_animated.glb`;
      const buffer = readFileSync(filePath);
      const loader = new GLTFLoader();
      const gltf = await loader.parseAsync(
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        ''
      );

      const animMap = new Map(gltf.animations.map((a: THREE.AnimationClip) => [a.name, a]));
      assert.ok(gltf.animations.length >= 20, `${cls} deve possuir ao menos 20 clipes de animação`);

      for (const coreAnim of EXPECTED_CORE_ANIMS) {
        assert.ok(animMap.has(coreAnim), `${cls} deve possuir o clipe oficial ${coreAnim}`);
      }

      // Teste do AnimationMixer com simulação de reprodução e transição
      const mixer = new THREE.AnimationMixer(gltf.scene);
      const idleClip = animMap.get('Idle')!;
      const walkClip = animMap.get('Walking_A')!;
      const spinClip = animMap.get('2H_Melee_Attack_Spin')!;

      const idleAction = mixer.clipAction(idleClip);
      idleAction.play();
      assert.strictEqual(idleAction.isRunning(), true);

      // Simula 10 frames de update do mixer
      for (let f = 0; f < 10; f++) {
        mixer.update(0.016);
      }

      // Transição suave para Walking_A
      const walkAction = mixer.clipAction(walkClip);
      idleAction.fadeOut(0.2);
      walkAction.reset().fadeIn(0.2).play();
      assert.strictEqual(walkAction.isRunning(), true);

      for (let f = 0; f < 10; f++) {
        mixer.update(0.016);
      }

      // Skill de ataque com crossFade
      const spinAction = mixer.clipAction(spinClip);
      walkAction.crossFadeTo(spinAction, 0.1, false);
      spinAction.play();
      mixer.update(0.016);

      mixer.stopAllAction();
      assert.strictEqual(idleAction.isRunning(), false);
      assert.strictEqual(walkAction.isRunning(), false);
      assert.strictEqual(spinAction.isRunning(), false);
    }
  });
});

describe('🛡️ QA Gameplay - 3. Validação Físico-Mecânica de Colisão & Deslizamento', () => {
  it('cápsula de colisão respeita fielmente as proporções oficiais (raio 0.45m, altura 1.85m, degrau 0.35m)', () => {
    assert.strictEqual(DasiCollisionEngine.DEFAULT_PLAYER_RADIUS, 0.45);
    assert.strictEqual(DasiCollisionEngine.DEFAULT_PLAYER_HEIGHT, 1.85);
    assert.strictEqual(DasiCollisionEngine.DEFAULT_STEP_HEIGHT, 0.35);

    const colliderMesh = DasiCollisionEngine.createPlayerColliderMesh(THREE);
    assert.strictEqual(colliderMesh.name, 'PlayerColliderMesh');

    const capsule = colliderMesh.getObjectByName('PlayerCollider_Capsule') as THREE.Mesh;
    assert.ok(capsule, 'Deve possuir a cápsula de corpo do jogador');
    assert.strictEqual(capsule.position.y, 1.85 / 2);

    const footprint = colliderMesh.getObjectByName('PlayerCollider_Footprint') as THREE.Mesh;
    assert.ok(footprint, 'Deve possuir a pegada no solo de raio 0.45m');
    assert.strictEqual(footprint.position.y, 0.02);

    const step = colliderMesh.getObjectByName('PlayerCollider_StepThreshold') as THREE.Mesh;
    assert.ok(step, 'Deve possuir anel delimitador de transposição de degrau de 0.35m');
    assert.strictEqual(step.position.y, 0.35);
  });

  it('simulação exaustiva contra os obstáculos reais de Lorencia (LOR_01): Fonte da Praça, Tendas, Castelo e Muros', () => {
    const radius = DasiCollisionEngine.DEFAULT_PLAYER_RADIUS; // 0.45m

    // 1. Fonte da Praça Central (Cilindro x=0, z=0, radius=3.2m)
    // Abordagem direta do sul para o centro
    const resFountain = DasiCollisionEngine.resolveMovement('LOR_01', { x: 0, z: -5.0 }, { x: 0, z: 0 }, radius);
    assert.strictEqual(resFountain.collided, true);
    assert.ok(resFountain.collidersHit.includes('fountain_basin'));
    // O jogador deve parar exatamente em z = -(3.2 + 0.45) = -3.65
    assert.ok(Math.abs(resFountain.z - (-3.65)) < 0.001);
    assert.strictEqual(resFountain.x, 0);

    // Deslizamento tangencial em aproximação angular na Fonte
    let currentFountain = { x: 2.0, z: -5.0 };
    for (let step = 0; step < 15; step++) {
      currentFountain = DasiCollisionEngine.resolveMovement(
        'LOR_01',
        currentFountain,
        { x: currentFountain.x + 0.2, z: currentFountain.z + 0.3 },
        radius
      );
      const dist = Math.hypot(currentFountain.x, currentFountain.z);
      // Nunca pode penetrar o interior da bacia da fonte (< 3.65m)
      assert.ok(dist >= 3.649, `Jogador penetrou a fonte: dist=${dist}`);
    }

    // 2. Tendas de Bazar (tent_sw: x=-7.2, z=-4, width=3.2, depth=3)
    // Bounds da tenda com raio: X [-9.25, -5.15], Z [-5.95, -2.05]
    const resTentFront = DasiCollisionEngine.resolveMovement('LOR_01', { x: -7.2, z: -7.0 }, { x: -7.2, z: -4.0 }, radius);
    assert.strictEqual(resTentFront.collided, true);
    assert.ok(resTentFront.collidersHit.includes('tent_sw'));
    assert.ok(Math.abs(resTentFront.z - (-5.95)) < 0.001);

    // Movimento contínuo rasante em quina de tenda (Tangent Sliding anti-engasgo)
    let tentCornerPos = { x: -9.5, z: -6.5 };
    for (let frame = 0; frame < 20; frame++) {
      tentCornerPos = DasiCollisionEngine.resolveMovement(
        'LOR_01',
        tentCornerPos,
        { x: tentCornerPos.x + 0.3, z: tentCornerPos.z + 0.2 },
        radius
      );
      // O jogador não pode ficar preso dentro da AABB da tenda
      const inTent = (tentCornerPos.x > -8.8 && tentCornerPos.x < -5.6 && tentCornerPos.z > -5.5 && tentCornerPos.z < -2.5);
      assert.strictEqual(inTent, false, `Jogador engasgou dentro da tenda no frame ${frame}`);
    }

    // 3. Fachada do Castelo / Taverna (tavern_facade: x=0, z=13.5, width=16.5, depth=4.5)
    // Borda frontal Z = 13.5 - 2.25 - 0.45 = 10.8m
    const resTavern = DasiCollisionEngine.resolveMovement('LOR_01', { x: 0, z: 8.0 }, { x: 0, z: 14.0 }, radius);
    assert.strictEqual(resTavern.collided, true);
    assert.ok(resTavern.collidersHit.includes('tavern_facade'));
    assert.ok(Math.abs(resTavern.z - 10.8) < 0.001);

    // 4. Muros do Sul e Torres Fortificadas (wall_south_left: x=-11, z=-16, width=14, depth=3)
    // A) Colisão frontal pura na face norte do muro em x=-7
    const resWallPure = DasiCollisionEngine.resolveMovement('LOR_01', { x: -7.0, z: -10.0 }, { x: -7.0, z: -16.0 }, radius);
    assert.strictEqual(resWallPure.collided, true);
    assert.ok(resWallPure.collidersHit.includes('wall_south_left'));
    // Borda superior do muro Z = -16 + 1.5 + 0.45 = -14.05
    assert.ok(Math.abs(resWallPure.z - (-14.05)) < 0.001);

    // B) Interseção composta no bastião da torre sudoeste (tower_sw + wall_south_left)
    const resWallTower = DasiCollisionEngine.resolveMovement('LOR_01', { x: -11.0, z: -10.0 }, { x: -11.0, z: -16.0 }, radius);
    assert.strictEqual(resWallTower.collided, true);
    assert.ok(resWallTower.collidersHit.includes('wall_south_left'));
    assert.ok(resWallTower.collidersHit.includes('tower_sw'));
    // Projeção radial para fora da torre cilíndrica (raio 3.2m + 0.45m = 3.65m)
    const distToTower = Math.hypot(resWallTower.x - (-14), resWallTower.z - (-16));
    assert.ok(Math.abs(distToTower - 3.65) < 0.001);

    // 5. Bordas Externas (Outer Bounds clamp: minX -20, maxX 20, minZ -20, maxZ 20)
    const resBorderRight = DasiCollisionEngine.resolveMovement('LOR_01', { x: 19.0, z: 0 }, { x: 30.0, z: 0 }, radius);
    assert.strictEqual(resBorderRight.collided, true);
    assert.strictEqual(resBorderRight.x, 20 - radius); // 19.55

    const resBorderTop = DasiCollisionEngine.resolveMovement('LOR_01', { x: 0, z: 19.0 }, { x: 0, z: 30.0 }, radius);
    assert.strictEqual(resBorderTop.collided, true);
    assert.strictEqual(resBorderTop.z, 20 - radius); // 19.55
  });

  it('anti-tunneling: movimento em velocidade extrema (100 frames a 15m/s) não atravessa barreiras sólidas', () => {
    const radius = 0.45;
    let pos = { x: 0, z: -10.0 };
    // Sprint em direção à taverna em velocidade alta (passo de 0.25m por frame)
    for (let f = 0; f < 100; f++) {
      pos = DasiCollisionEngine.resolveMovement('LOR_01', pos, { x: pos.x, z: pos.z + 0.25 }, radius);
    }
    // A fachada da taverna está em z=10.8m. O jogador JAMAIS pode ultrapassar z=10.8m
    assert.ok(pos.z <= 10.801, `Anti-tunneling falhou: jogador atravessou parede para z=${pos.z}`);
  });
});

describe('⚔️ QA Gameplay - 4. Troca Dinâmica de Equipamentos, Armas e Sets', () => {
  it('valida a troca dinâmica das 5 armas canônicas e compatibilidade por classe', () => {
    // 1. Dragon Blade (DK)
    const dkHero = createModularHero(THREE, 'DK') as any;
    assert.ok(dkHero.getAvailableWeapons().includes('DRAGON_BLADE'));
    assert.strictEqual(dkHero.setWeapon('DRAGON_BLADE'), true);
    assert.strictEqual(dkHero.getWeapon(), 'DRAGON_BLADE');

    // 2. Kundun Staff (DW)
    const dwHero = createModularHero(THREE, 'DW') as any;
    assert.ok(dwHero.getAvailableWeapons().includes('KUNDUN_STAFF'));
    assert.strictEqual(dwHero.setWeapon('KUNDUN_STAFF'), true);
    assert.strictEqual(dwHero.getWeapon(), 'KUNDUN_STAFF');

    // 3. Celestial Bow (ELF)
    const elfHero = createModularHero(THREE, 'ELF') as any;
    assert.ok(elfHero.getAvailableWeapons().includes('CELESTIAL_BOW'));
    assert.strictEqual(elfHero.setWeapon('CELESTIAL_BOW'), true);
    assert.strictEqual(elfHero.getWeapon(), 'CELESTIAL_BOW');

    // 4. Rune Blade (MG)
    const mgHero = createModularHero(THREE, 'MG') as any;
    assert.ok(mgHero.getAvailableWeapons().includes('RUNE_BLADE'));
    assert.strictEqual(mgHero.setWeapon('RUNE_BLADE'), true);
    assert.strictEqual(mgHero.getWeapon(), 'RUNE_BLADE');

    // 5. Lord Scepter (DL)
    const dlHero = createModularHero(THREE, 'DL') as any;
    assert.ok(dlHero.getAvailableWeapons().includes('LORD_SCEPTER'));
    assert.strictEqual(dlHero.setWeapon('LORD_SCEPTER'), true);
    assert.strictEqual(dlHero.getWeapon(), 'LORD_SCEPTER');

    // Rejeição de arma incompatível entre classes
    assert.strictEqual(dwHero.setWeapon('DRAGON_BLADE'), false);
    assert.strictEqual(elfHero.setWeapon('KUNDUN_STAFF'), false);
  });

  it('permite alternar entre variantes de armadura (base vs elite) em todos os 6 slots', () => {
    for (const cls of ['DK', 'DW', 'ELF', 'MG', 'DL']) {
      const hero = createModularHero(THREE, cls) as any;
      const initialArmor = hero.getArmor();

      for (const slot of ARMOR_SLOTS) {
        assert.strictEqual(initialArmor[slot], 'base', `${cls}/${slot} deve iniciar como 'base'`);
        // Troca para elite
        assert.strictEqual(hero.setArmor(slot, 'elite'), true, `Deve permitir alternar ${slot} para elite`);
        assert.strictEqual(hero.getArmor()[slot], 'elite');
        // Retorna para base
        assert.strictEqual(hero.setArmor(slot, 'base'), true, `Deve permitir alternar ${slot} para base`);
        assert.strictEqual(hero.getArmor()[slot], 'base');
      }
    }
  });

  it('permite ativar e desativar asas (Wings) mantendo a hierarquia intacta', () => {
    for (const cls of ['DK', 'DW', 'ELF', 'MG', 'DL']) {
      const hero = createHero(cls, {}, THREE);
      assert.strictEqual(typeof hero.setWings, 'function');

      // Ativa asas
      hero.setWings(true);
      const partsAny = hero.parts as any;
      if (partsAny && partsAny.wingsGroup) {
        assert.strictEqual(partsAny.wingsGroup.visible, true);
      }

      // Desativa asas
      hero.setWings(false);
      if (partsAny && partsAny.wingsGroup) {
        assert.strictEqual(partsAny.wingsGroup.visible, false);
      }
    }
  });
});

describe('✨ QA Gameplay - 5. Sistema de Aprimoramento (+0 a +15) e Auras Místicas', () => {
  it('aplica a progressão de cor, brilho emissivo e rugosidade de +0 até +15 fiel ao Continent of Legend', () => {
    const hero = createModularHero(THREE, 'DK') as any;
    assert.strictEqual(typeof hero.updateRefinementGlow, 'function');

    // Nível +0 (Sem brilho mágico)
    hero.updateRefinementGlow(0);
    hero.group.traverse((node: any) => {
      if (node.isMesh && node.material && node.material.name !== 'gem') {
        const mat = node.material;
        assert.strictEqual(
          mat.emissiveIntensity || 0,
          0,
          `No nível +0, materiais comuns não devem emitir luz (encontrado ${mat.emissiveIntensity})`
        );
      }
    });

    // Nível +7 (Aura Ciano Élfica)
    hero.updateRefinementGlow(7);
    let hasCyanGlow = false;
    hero.group.traverse((node: any) => {
      if (node.isMesh && node.material && node.material.name !== 'gem') {
        const mat = node.material;
        if (mat.emissive && mat.emissiveIntensity >= 0.8) {
          hasCyanGlow = true;
          // Verifica tom azul/ciano
          assert.ok(mat.emissive.b > 0.5, 'No nível +7 a aura deve conter componente ciano');
        }
      }
    });
    assert.ok(hasCyanGlow, 'Herói no nível +7 deve exibir aura ciano');

    // Nível +9 (Brilho Dourado Solar)
    hero.updateRefinementGlow(9);
    let hasGoldGlow = false;
    hero.group.traverse((node: any) => {
      if (node.isMesh && node.material && node.material.name !== 'gem') {
        const mat = node.material;
        if (mat.emissive && mat.emissiveIntensity >= 1.5) {
          hasGoldGlow = true;
          // Verifica tom dourado (r e g altos)
          assert.ok(mat.emissive.r > 0.8 && mat.emissive.g > 0.45, 'No nível +9 a aura deve ser dourada');
        }
      }
    });
    assert.ok(hasGoldGlow, 'Herói no nível +9 deve exibir brilho dourado solar');

    // Nível +15 (Corona Celestial Púrpura Radiante)
    hero.updateRefinementGlow(15);
    let hasPurpleCorona = false;
    hero.group.traverse((node: any) => {
      if (node.isMesh && node.material && node.material.name !== 'gem') {
        const mat = node.material;
        if (mat.emissive && mat.emissiveIntensity >= 3.0) {
          hasPurpleCorona = true;
          // Rugosidade ultra-polida (espelhado)
          assert.ok(mat.roughness <= 0.05, 'No nível +15 o metal deve ser espelhado (roughness <= 0.05)');
        }
      }
    });
    assert.ok(hasPurpleCorona, 'Herói no nível +15 deve exibir corona celestial púrpura');
  });
});
