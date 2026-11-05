/**
 * Dasi MMORPG - Testes Automatizados dos Sistemas de Gameplay de Ação
 * Valida Level Up, Chaos Machine VFX, Portais 3D, Controles WASD e Síntese Harmônica.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  HarmonicAudioSynthesizer,
  LevelUpSystem,
  ChaosMachineVFX,
  PortalSystem,
  KeyboardController,
} from '../index.ts';

describe('1. Sistema de Level Up & Progressão (LevelUpSystem.ts)', () => {
  it('Calcula corretamente os patamares de XP para níveis clássicos', () => {
    const xpLvl1 = LevelUpSystem.getXpRequiredForLevel(1);
    const xpLvl2 = LevelUpSystem.getXpRequiredForLevel(2);
    const xpLvl3 = LevelUpSystem.getXpRequiredForLevel(3);

    assert.equal(xpLvl1, 0, 'Nível 1 não requer XP');
    assert.equal(xpLvl2, 1000, 'Nível 2 requer 1000 XP base');
    assert.equal(xpLvl3, 2150, 'Nível 3 requer 1000 + 1150 = 2150 XP');
    assert.ok(xpLvl3 > xpLvl2, 'A curva de XP deve ser estritamente crescente');
  });

  it('Processa ganho de XP e identifica subida de nível e vitais recalculados', () => {
    const initialLvl = 1;
    const initialXp = 0;
    const xpGained = 2500; // Deve subir para o nível 3 (pois 2500 >= 2150)

    const result = LevelUpSystem.processXpGain(initialLvl, initialXp, xpGained);

    assert.equal(result.currentLevel, 3, 'Deve ter subido para o Nível 3');
    assert.equal(result.leveledUp, true, 'Flag leveledUp deve ser verdadeira');
    assert.equal(result.freeStatPoints, 10, 'Nível 3 ganha (3-1)*5 = 10 pontos de atributos');
    assert.equal(result.maxHp, 1050, 'Max HP deve ser 1000 + (3-1)*25 = 1050');
    assert.equal(result.maxMp, 486, 'Max MP deve ser 450 + (3-1)*18 = 486');
    assert.ok(result.progressPct >= 0 && result.progressPct <= 100, 'Percentual deve estar entre 0 e 100');
  });

  it('Simula animação do efeito de Level Up com desvanecimento e expansão suave', () => {
    // Mock de estado 3D
    const dummyState = {
      elapsed: 0,
      duration: 1.5,
      aureoleMesh: { position: { y: 0 }, scale: { set: (x: number, y: number, z: number) => {} }, material: { opacity: 1 } },
      lightBeamMesh: { scale: { set: (x: number, y: number, z: number) => {} }, material: { opacity: 1 } },
      groundShockMesh: { scale: { set: (x: number, y: number, z: number) => {} }, material: { opacity: 1 } },
      particlesMesh: { geometry: { attributes: { position: { needsUpdate: false } } }, material: { opacity: 1 } },
      particlePositions: new Float32Array(30),
      lightSource: { intensity: 4.5 },
    };

    // Atualização de 0.5s (um terço da duração)
    const active1 = LevelUpSystem.updateLevelUpAnimation(dummyState, 0.5);
    assert.equal(active1, true, 'Animação deve continuar ativa aos 0.5s');
    assert.ok(dummyState.aureoleMesh.position.y > 0, 'Auréola deve ter subido verticalmente');
    assert.ok(dummyState.aureoleMesh.material.opacity < 1.0, 'Opacidade deve começar a diminuir');

    // Atualização além da duração (1.2s adicionais -> total 1.7s >= 1.5s)
    const active2 = LevelUpSystem.updateLevelUpAnimation(dummyState, 1.2);
    assert.equal(active2, false, 'Animação deve ter concluído após ultrapassar a duração');
  });
});

describe('2. Sequência de Cinemática & VFX do Chaos Machine (ChaosMachineVFX.ts)', () => {
  it('Inicia em IGNITION com engrenagens acelerando gradualmente', () => {
    const vfx = new ChaosMachineVFX();
    let recordedPhase = '';

    vfx.startForge(true, (phase) => {
      recordedPhase = phase;
    });

    assert.equal(vfx.state.phase, 'IGNITION');
    assert.equal(recordedPhase, 'IGNITION');
    assert.equal(vfx.state.gearSpeedMultiplier, 1.0);

    // Passo de 0.7s (metade da ignição)
    vfx.update(0.7);
    assert.equal(vfx.state.phase, 'IGNITION');
    assert.ok(vfx.state.gearSpeedMultiplier > 2.0, 'Velocidade das engrenagens deve ter acelerado');
  });

  it('Transiciona fluidamente pelas 4 fases até o Raio de Fusão e Clímax', () => {
    const vfx = new ChaosMachineVFX();
    const phasesHit: string[] = [];
    let completedSuccess: boolean | null = null;

    vfx.startForge(
      true,
      (phase) => {
        phasesHit.push(phase);
      },
      (success) => {
        completedSuccess = success;
      }
    );

    // Avança para a fase SURGE (ignição completa: 1.4s)
    vfx.update(1.45);
    assert.equal(vfx.state.phase, 'SURGE');
    assert.ok(phasesHit.includes('SURGE'));
    assert.ok(vfx.state.gearSpeedMultiplier >= 6.0, 'Engrenagens devem estar em alta velocidade no Surge');

    // Avança para FUSION_BEAM (surge completo: 1.6s) e avança 0.5s dentro do raio de fusão
    vfx.update(1.65);
    assert.equal(vfx.state.phase, 'FUSION_BEAM');
    assert.ok(phasesHit.includes('FUSION_BEAM'));
    vfx.update(0.4);
    assert.equal(vfx.state.phase, 'FUSION_BEAM');
    assert.ok(vfx.state.laserBeamIntensity >= 0.6, 'Intensidade do laser deve estar no ápice durante a fusão');

    // Avança para CLIMAX (beam restante: ~0.9s)
    vfx.update(1.0);
    assert.equal(vfx.state.phase, 'CLIMAX');
    assert.ok(phasesHit.includes('CLIMAX'));

    // Avança para COMPLETE (climax completo: 1.0s)
    vfx.update(1.1);
    assert.equal(vfx.state.phase, 'COMPLETE');
    assert.equal(vfx.state.isFinished, true);
    assert.equal(completedSuccess, true, 'Callback de conclusão deve registrar sucesso');
  });
});

describe('3. Portais de Teletransporte 3D & Zonas (PortalSystem.ts)', () => {
  it('Retorna portais corretos para Lorencia, Noria e Devias', () => {
    const lorenciaPortals = PortalSystem.getPortalsForMap('LORENCIA');
    assert.equal(lorenciaPortals.length, 2, 'Lorencia deve conter 2 portais (Noria e Devias)');

    const noriaPortal = lorenciaPortals.find((p) => p.targetMap === 'NORIA');
    const deviasPortal = lorenciaPortals.find((p) => p.targetMap === 'DEVIAS');
    assert.ok(noriaPortal, 'Portal de Noria deve existir em Lorencia');
    assert.ok(deviasPortal, 'Portal de Devias deve existir em Lorencia');

    const noriaPortals = PortalSystem.getPortalsForMap('NORIA');
    assert.equal(noriaPortals.length, 1, 'Noria deve conter 1 portal de volta para Lorencia');
    assert.equal(noriaPortals[0].targetMap, 'LORENCIA');

    const deviasPortals = PortalSystem.getPortalsForMap('DEVIAS');
    assert.equal(deviasPortals.length, 1, 'Devias deve conter 1 portal de volta para Lorencia');
    assert.equal(deviasPortals[0].targetMap, 'LORENCIA');

    // Suporte aos 8 Biomas Canônicos
    const dngPortals = PortalSystem.getPortalsForMap('DUNGEON');
    assert.ok(dngPortals.length >= 1, 'Dungeon deve conter portal');
    const ltPortals = PortalSystem.getPortalsForMap('LOST_TOWER');
    assert.ok(ltPortals.length >= 1, 'Lost Tower deve conter portal');
    const atlPortals = PortalSystem.getPortalsForMap('ATLANS');
    assert.ok(atlPortals.length >= 1, 'Atlans deve conter portal');
    const tarPortals = PortalSystem.getPortalsForMap('TARKAN');
    assert.ok(tarPortals.length >= 1, 'Tarkan deve conter portal');
    const icaPortals = PortalSystem.getPortalsForMap('ICARUS');
    assert.ok(icaPortals.length >= 1, 'Icarus deve conter portal');
  });

  it('Detecta proximidade física precisa do jogador com os portais', () => {
    // Portal de Noria em Lorencia está em x: 13.5, z: -1.0 com raio 2.2
    const nearHit = PortalSystem.checkProximity(13.0, -1.0, 'LORENCIA');
    assert.ok(nearHit, 'Deve detectar proximidade a 0.5m do portal');
    assert.equal(nearHit?.targetMap, 'NORIA');

    // Jogador no centro da praça de Lorencia (x: 0, z: 0)
    const farMiss = PortalSystem.checkProximity(0, 0, 'LORENCIA');
    assert.equal(farMiss, null, 'Não deve ativar portal distante no centro de Lorencia');
  });
});

describe('4. Controlador de Teclado & Física de Movimento (KeyboardController.ts)', () => {
  it('Integra aceleração contínua e normaliza velocidade diagonal uniforme', () => {
    const controller = new KeyboardController({ x: 0, z: 0 }, { maxSpeed: 6.0, acceleration: 30.0 });

    // Pressiona W (Norte, Z-)
    controller.keys.forward = true;
    for (let i = 0; i < 20; i++) {
      controller.update(0.016); // ~320ms de aceleração
    }

    assert.ok(controller.velocity.z < -2.0, 'Velocidade em Z deve ser negativa (indo para o norte)');
    assert.equal(controller.velocity.x, 0, 'Velocidade em X deve permanecer nula');
    assert.equal(controller.isMoving, true);

    // Agora pressiona também D (Leste, X+) -> Movimento Diagonal (W + D)
    controller.keys.right = true;
    for (let i = 0; i < 30; i++) {
      controller.update(0.016);
    }

    const currentSpeed = Math.hypot(controller.velocity.x, controller.velocity.z);
    assert.ok(currentSpeed <= controller.config.maxSpeed + 0.05, 'Velocidade diagonal não pode exceder maxSpeed');
    assert.ok(controller.velocity.x > 1.0, 'Velocidade em X deve ser positiva');
    assert.ok(controller.velocity.z < -1.0, 'Velocidade em Z deve ser negativa');
  });

  it('Aplica frenagem e atrito ao soltar as teclas (Desaceleração)', () => {
    const controller = new KeyboardController({ x: 0, z: 0 }, { maxSpeed: 6.0, deceleration: 40.0 });
    controller.velocity = { x: 5.0, z: 0 };
    controller.keys.right = false;

    // Atualiza por 0.1s
    controller.update(0.1);
    assert.ok(controller.velocity.x < 5.0, 'Velocidade deve ter diminuído devido ao atrito');

    // Atualiza por mais 0.3s -> Deve parar completamente
    controller.update(0.3);
    assert.equal(controller.velocity.x, 0, 'Velocidade deve zerar após desaceleração completa');
    assert.equal(controller.isMoving, false);
  });

  it('Respeita limites de colisão com as bordas do cenário (Bounds Check)', () => {
    const controller = new KeyboardController({ x: 18.0, z: 0 }, { boundsMaxX: 18.5 });
    controller.keys.right = true;

    // Tenta caminhar muito para a direita
    for (let i = 0; i < 60; i++) {
      controller.update(0.016);
    }

    assert.equal(controller.position.x, 18.5, 'Posição X deve ser clampada no limite boundsMaxX');
  });

  it('Dispara callback de passos rítmicos a cada intervalo de distância percorrida', () => {
    const controller = new KeyboardController({ x: 0, z: 0 }, { stepDistance: 1.0, maxSpeed: 5.0 });
    let footstepCount = 0;
    controller.onFootstepCallback = () => {
      footstepCount++;
    };

    controller.keys.forward = true;
    // Avança 1 segundo a 5 m/s -> percorre ~5 metros -> deve disparar ~4 a 5 passos
    for (let i = 0; i < 60; i++) {
      controller.update(1.0 / 60.0);
    }

    assert.ok(footstepCount >= 3, `Deve disparar passos periódicos (disparou ${footstepCount})`);
  });
});

describe('5. Sintetizador de Áudio Harmônico Procedural (HarmonicAudioSynthesizer.ts)', () => {
  it('Instanciação segura e métodos tolerantes a ambientes sem interface gráfica (Node.js/Headless)', () => {
    const synth = new HarmonicAudioSynthesizer();
    assert.ok(synth);

    // Chamadas sem window.AudioContext devem degradar graciosamente sem lançar exceções
    assert.doesNotThrow(() => synth.playLevelUpSound());
    assert.doesNotThrow(() => synth.playChaosPhaseSound('ignition'));
    assert.doesNotThrow(() => synth.playChaosPhaseSound('laser'));
    assert.doesNotThrow(() => synth.playPortalWarpSound('NORIA'));
    assert.doesNotThrow(() => synth.playFootstep('stone'));
    assert.doesNotThrow(() => synth.playFootstep('grass'));
    assert.doesNotThrow(() => synth.playFootstep('snow'));
    assert.doesNotThrow(() => synth.playFootstep('sand'));
    assert.doesNotThrow(() => synth.playFootstep('metal'));
    assert.doesNotThrow(() => synth.playFootstep('crypt'));
    assert.doesNotThrow(() => synth.playFootstep('water'));
    assert.doesNotThrow(() => synth.playFootstep('crystal'));
    assert.doesNotThrow(() => synth.playPortalWarpSound('DUNGEON'));
    assert.doesNotThrow(() => synth.playPortalWarpSound('LOST_TOWER'));
    assert.doesNotThrow(() => synth.playPortalWarpSound('ATLANS'));
    assert.doesNotThrow(() => synth.playPortalWarpSound('TARKAN'));
    assert.doesNotThrow(() => synth.playPortalWarpSound('ICARUS'));
    assert.doesNotThrow(() => synth.playPotionSound('health'));
    assert.doesNotThrow(() => synth.playPotionSound('mana'));
    assert.doesNotThrow(() => synth.playDodgeSound());
    assert.doesNotThrow(() => synth.playSkillSound('cyclone'));
    assert.doesNotThrow(() => synth.playSkillSound('evil_spirits'));
    assert.doesNotThrow(() => synth.playSkillSound('ice_storm'));
    assert.doesNotThrow(() => synth.playSkillSound('triple_shot'));
    assert.doesNotThrow(() => synth.playSkillSound('fire_slash'));
    assert.doesNotThrow(() => synth.playSkillSound('fireburst'));
    assert.doesNotThrow(() => synth.playSkillSound('earthquake'));
    assert.doesNotThrow(() => synth.playJewelDropSound('bless'));
    assert.doesNotThrow(() => synth.playJewelDropSound('soul'));
    assert.doesNotThrow(() => synth.playJewelDropSound('life'));
    assert.doesNotThrow(() => synth.playJewelDropSound('chaos'));
    assert.doesNotThrow(() => synth.playItemPickupSound());
  });
});
