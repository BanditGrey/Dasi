/**
 * Dasi MMORPG - Testes Unitários do Sistema de Chefes Mundiais, Invasões e Box of Kundun
 * Valida fases dinâmicas, barreiras de escudo rúnico, canalização de telégrafos, enrage e drops.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BossEntity } from '../BossEntity.ts';
import { BOSS_CONFIGS } from '../BossDefinitions.ts';
import { BoxOfKundun } from '../BoxOfKundun.ts';
import { GoldenInvasionSystem } from '../GoldenInvasionSystem.ts';
import { BossManager } from '../BossManager.ts';
import { MobSpawner } from '../../combat/MobSpawner.ts';

describe('1. Sistema de Chefes Mundiais (BossEntity.ts)', () => {
  it('Instancia corretamente os 5 chefes canônicos com atributos e fases definidos', () => {
    const bossTypes = ['boss_gorgon', 'boss_ice_queen', 'boss_balrog', 'boss_zaikan', 'boss_kundun'];

    for (const bType of bossTypes) {
      const boss = new BossEntity(bType, 400, 250);
      assert.strictEqual(boss.type, bType);
      assert.ok(boss.name.length > 0);
      assert.ok(boss.level >= 50);
      assert.strictEqual(boss.currentHp, boss.maxHp);
      assert.strictEqual(boss.state, 'IDLE');
      assert.strictEqual(boss.currentPhaseIndex, 1);
      assert.ok(boss.config.phases.length >= 3);
    }
  });

  it('Transiciona fluidamente pelas 3 fases de Gorgon conforme a vida diminui', () => {
    const gorgon = new BossEntity('boss_gorgon', 400, 250);
    assert.strictEqual(gorgon.currentPhaseIndex, 1);
    assert.strictEqual(gorgon.isEnraged, false);

    // Causa dano para descer a 55% de vida (Gatilho da Fase 2: <= 60%)
    const dmgToPhase2 = gorgon.maxHp * 0.45;
    const r1 = gorgon.takeDamage(dmgToPhase2);

    assert.strictEqual(r1.phaseChanged, true);
    assert.strictEqual(gorgon.currentPhaseIndex, 2);
    assert.strictEqual(gorgon.currentShield, 15000, 'Fase 2 de Gorgon deve erguer escudo rúnico de 15.000');

    // Verifica se lacaios (adds) foram agendados na Fase 2
    const pendingAdds = gorgon.popPendingAdds();
    assert.strictEqual(pendingAdds.length, 1);
    assert.strictEqual(pendingAdds[0].monsterType, 'skeleton');
    assert.strictEqual(pendingAdds[0].count, 3);

    // Causa dano para quebrar o escudo e entrar na Fase 3 (<= 25% HP)
    const dmgToPhase3 = gorgon.currentShield + gorgon.maxHp * 0.35;
    const r2 = gorgon.takeDamage(dmgToPhase3);

    assert.strictEqual(r2.shieldBroken, true);
    assert.strictEqual(r2.phaseChanged, true);
    assert.strictEqual(gorgon.currentPhaseIndex, 3);
    assert.strictEqual(gorgon.isEnraged, true, 'Fase 3 de Gorgon deve ativar estado de Enrage');
  });

  it('Escudo rúnico absorve dano integralmente antes de ferir a barra de vida', () => {
    const balrog = new BossEntity('boss_balrog', 400, 250);
    // Força entrada na Fase 2
    balrog.takeDamage(balrog.maxHp * 0.45);
    assert.strictEqual(balrog.currentPhaseIndex, 2);
    assert.strictEqual(balrog.currentShield, 28000);

    const initialHp = balrog.currentHp;
    const res = balrog.takeDamage(10000);

    assert.strictEqual(res.shieldDamage, 10000);
    assert.strictEqual(res.actualHpDamage, 0, 'Vida não deve sofrer dano enquanto houver escudo');
    assert.strictEqual(balrog.currentShield, 18000);
    assert.strictEqual(balrog.currentHp, initialHp);
  });

  it('Ataque telegrafado inicia canalização e conclui após duração com cooldown', () => {
    const iceQueen = new BossEntity('boss_ice_queen', 400, 250);
    const now = 100000;

    const tel = iceQueen.tryStartTelegraph(now, 450, 250);
    assert.ok(tel, 'Deveria iniciar telégrafo da Fase 1 (Lança Glacial)');
    assert.strictEqual(tel?.skill.id, 'ice_spear_pierce');
    assert.strictEqual(iceQueen.state, 'ATTACKING');

    // Durante a canalização
    const midway = iceQueen.updateTelegraph(now + 500);
    assert.strictEqual(midway.completed, false);

    // Conclusão da canalização
    const finished = iceQueen.updateTelegraph(now + 1100);
    assert.strictEqual(finished.completed, true);
    assert.strictEqual(iceQueen.state, 'IDLE');

    // Tentativa imediata deve ser rejeitada por cooldown
    const rejected = iceQueen.tryStartTelegraph(now + 1200, 450, 250);
    assert.strictEqual(rejected, null, 'Habilidade deve estar em cooldown');
  });

  it('Chefe enraivecido tem imunidade estrita a Stagger e gera drops físicos ao morrer', () => {
    const zaikan = new BossEntity('boss_zaikan', 400, 250);
    // Força enrage (Fase 3: <= 20% HP)
    zaikan.takeDamage(zaikan.maxHp * 0.85);
    assert.strictEqual(zaikan.isEnraged, true);

    // Tenta aplicar dano massivo de postura (poise)
    const poiseHit = zaikan.takeDamage(100, 9999);
    assert.strictEqual(poiseHit.staggered, false, 'Chefe enraivecido não deve sofrer Stagger');

    // Finaliza o chefe
    const fatalHit = zaikan.takeDamage(zaikan.currentHp + 5000);
    assert.strictEqual(fatalHit.died, true);
    assert.strictEqual(zaikan.isDead, true);

    const drops = zaikan.generateBossDrops('sess-killer');
    assert.ok(drops.length >= 4, 'Zaikan deve gerar pelo menos 4 drops físicos no chão');
    const zenDrops = drops.filter((d) => d.zen > 0);
    const itemDrops = drops.filter((d) => d.item !== null);
    assert.ok(zenDrops.length >= 2, 'Deve conter pilhas de Zen');
    assert.ok(itemDrops.length >= 2, 'Deve conter itens raros/lendários');
  });
});

describe('2. Caixa de Kundun (BoxOfKundun.ts)', () => {
  it('Abre Box of Kundun +1 até +5 gerando equipamentos de tiers crescentes e joias', () => {
    for (let tier = 1; tier <= 5; tier++) {
      const boxId = `box_of_kundun_${tier}`;
      const loot = BoxOfKundun.openBox(boxId, 400, 250, 'test-session');

      assert.strictEqual(loot.boxDefId, boxId);
      assert.strictEqual(loot.tier, tier);
      assert.ok(loot.items.length >= 2, `Box +${tier} deve conceder pelo menos 2 itens`);
      assert.ok(loot.zen > 0, 'Deve conceder Zen');
      assert.ok(loot.groundDrops.length >= loot.items.length, 'Deve gerar ground drops físicos');

      // Verifica se há pelo menos um item excelente gerado
      const hasExcellent = loot.items.some((it) => (it.excellentMask ?? 0) > 0);
      assert.strictEqual(hasExcellent, true, `Box +${tier} deve conter item Excelente`);
    }
  });
});

describe('3. Invasões Douradas & BossManager (GoldenInvasionSystem.ts & BossManager.ts)', () => {
  it('Dispara Invasão Dourada registrando monstros no spawner e gerando anúncio global', () => {
    const spawner = new MobSpawner();
    const invasionSystem = new GoldenInvasionSystem();

    const inv = invasionSystem.triggerInvasion(spawner, 1, 'LORENCIA');
    assert.strictEqual(inv.tier, 1);
    assert.ok(inv.announcement.includes('Golden Budge Dragon'));
    assert.strictEqual(inv.spawnedMonsterIds.length, 3);

    for (const mobId of inv.spawnedMonsterIds) {
      const mob = spawner.getMonster(mobId);
      assert.ok(mob, `Monstro dourado ${mobId} deve estar registrado no spawner`);
      assert.strictEqual(mob?.type, 'golden_budge_dragon');
    }
  });

  it('BossManager orquestra ciclos de atualização, telégrafos e auras de proximidade', () => {
    const manager = new BossManager();
    const balrog = manager.spawnBoss('boss_balrog', 400, 250);

    // Entra na fase de enrage
    balrog.takeDamage(balrog.maxHp * 0.80);
    assert.strictEqual(balrog.isEnraged, true);

    const now = Date.now();
    const tickResult = manager.update(now);

    assert.strictEqual(tickResult.updatedBosses.length, 1);
    // Na fase 3, Balrog possui aura de fogo com dano periódico
    assert.ok(tickResult.auraHits.length >= 1, 'Balrog enraivecido deve emitir aura de fogo');
    assert.strictEqual(tickResult.auraHits[0].auraType, 'FIRE');
    assert.strictEqual(tickResult.auraHits[0].damage, 50);
  });
});
