import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { IdleAutoCombatEngine } from '../IdleAutoCombatEngine.ts';

describe('6. Motor de Combate 100% Idle & Mu Helper (IdleAutoCombatEngine.ts)', () => {
  it('Inicializa com auto-combate ativado e métricas zeradas', () => {
    const idle = new IdleAutoCombatEngine();
    assert.equal(idle.isEnabled(), true);
    assert.equal(idle.metrics.monstersKilled, 0);
    assert.equal(idle.metrics.zenCollected, 0);
    assert.equal(idle.metrics.jewelsCollected, 0);
  });

  it('Auto-Targeting: Seleciona o monstro vivo mais próximo dentro do raio', () => {
    const idle = new IdleAutoCombatEngine({ searchRadius: 300 });

    const state = {
      playerX: 100,
      playerY: 100,
      playerHp: 1000,
      playerMaxHp: 1000,
      playerMp: 500,
      playerMaxMp: 500,
      monsters: [
        { id: 'mob_far', x: 280, y: 280, isDead: false, name: 'Bull Fighter' }, // dist ~254
        { id: 'mob_close', x: 120, y: 110, isDead: false, name: 'Spider' },    // dist ~22
        { id: 'mob_dead', x: 105, y: 105, isDead: true, name: 'Spider Morta' },
      ],
      groundDrops: [],
    };

    let movedTo = null;
    let attacked = null;

    idle.update(
      0.1,
      state,
      {
        movePlayer: (x, y) => { movedTo = { x, y }; },
        attackMonster: (mobId) => { attacked = mobId; },
        pickupDrop: () => {},
        useHealthPotion: () => {},
        useManaPotion: () => {},
      }
    );

    assert.equal(idle.currentTargetId, 'mob_close', 'Deve mirar no monstro vivo mais próximo');
  });

  it('Auto-Approach: Move o jogador quando o monstro está fora do alcance', () => {
    const idle = new IdleAutoCombatEngine({ attackRangeMelee: 50 });

    const state = {
      playerX: 0,
      playerY: 0,
      playerHp: 1000,
      playerMaxHp: 1000,
      playerMp: 0, // Sem mana para skills
      playerMaxMp: 500,
      monsters: [
        { id: 'mob_distant', x: 150, y: 0, isDead: false, name: 'Skeleton' }, // dist 150 > 50
      ],
      groundDrops: [],
    };

    let movedCoords: { x: number; y: number } | null = null;
    let attackCalled = false;

    idle.update(
      0.1,
      state,
      {
        movePlayer: (x, y) => { movedCoords = { x, y }; },
        attackMonster: () => { attackCalled = true; },
        pickupDrop: () => {},
        useHealthPotion: () => {},
        useManaPotion: () => {},
      }
    );

    assert.deepEqual(movedCoords, { x: 150, y: 0 }, 'Deve se mover até o monstro');
    assert.equal(attackCalled, false, 'Não deve atacar antes de estar no alcance');
  });

  it('Auto-Attack & Skill Rotation: Executa ataque e rotação de habilidades no alcance', () => {
    const idle = new IdleAutoCombatEngine({ attackRangeMelee: 50, attackRangeSkill: 100 });

    const state = {
      playerX: 0,
      playerY: 0,
      playerHp: 1000,
      playerMaxHp: 1000,
      playerMp: 200,
      playerMaxMp: 500,
      monsters: [
        { id: 'mob_in_range', x: 40, y: 0, isDead: false, name: 'Hound' }, // dist 40 <= 50
      ],
      groundDrops: [],
    };

    let attackedMob: string | null = null;
    let usedSkill: string | undefined = undefined;

    idle.update(
      0.1,
      state,
      {
        movePlayer: () => {},
        attackMonster: (mobId, skillId) => {
          attackedMob = mobId;
          usedSkill = skillId;
        },
        pickupDrop: () => {},
        useHealthPotion: () => {},
        useManaPotion: () => {},
      }
    );

    assert.equal(attackedMob, 'mob_in_range', 'Deve atacar o monstro no alcance');
    assert.equal(usedSkill, 'cyclone', 'Primeira habilidade da rotação deve ser Twisting Slash');
  });

  it('Auto-Potion: Bebe poção de vida automaticamente se HP < 65%', () => {
    const idle = new IdleAutoCombatEngine({ autoPotionHpPct: 0.65 });

    let hpPotionDrank = false;

    const state = {
      playerX: 0,
      playerY: 0,
      playerHp: 500, // 50% < 65%
      playerMaxHp: 1000,
      playerMp: 500,
      playerMaxMp: 500,
      monsters: [],
      groundDrops: [],
    };

    idle.update(
      0.1,
      state,
      {
        movePlayer: () => {},
        attackMonster: () => {},
        pickupDrop: () => {},
        useHealthPotion: () => { hpPotionDrank = true; },
        useManaPotion: () => {},
      }
    );

    assert.equal(hpPotionDrank, true, 'Deve ter acionado a poção de vida automaticamente');
  });

  it('Auto-Loot: Coleta drops de joias e zen próximos sem intervenção manual', () => {
    const idle = new IdleAutoCombatEngine({ autoPickupRadius: 200 });

    const collectedDrops: string[] = [];

    const state = {
      playerX: 50,
      playerY: 50,
      playerHp: 1000,
      playerMaxHp: 1000,
      playerMp: 500,
      playerMaxMp: 500,
      monsters: [],
      groundDrops: [
        { dropId: 'drop_bless', x: 80, y: 60, isJewel: true }, // dist ~31 <= 200
        { dropId: 'drop_zen', x: 60, y: 70, zen: 5000 },      // dist ~22 <= 200
        { dropId: 'drop_far', x: 500, y: 500, zen: 1000 },    // dist ~636 > 200
      ],
    };

    idle.update(
      0.1,
      state,
      {
        movePlayer: () => {},
        attackMonster: () => {},
        pickupDrop: (dropId) => { collectedDrops.push(dropId); },
        useHealthPotion: () => {},
        useManaPotion: () => {},
      }
    );

    assert.deepEqual(collectedDrops, ['drop_bless', 'drop_zen'], 'Deve recolher todos os drops próximos');
  });

  it('Telemetria AFK: Registra dano, recalcula DPS e acumula kills e loot', () => {
    const idle = new IdleAutoCombatEngine();

    idle.recordDamageDealt(500);
    idle.recordDamageDealt(1000);
    idle.recordMonsterKilled();
    idle.recordLoot(true, 15000);

    assert.equal(idle.metrics.monstersKilled, 1);
    assert.equal(idle.metrics.zenCollected, 15000);
    assert.equal(idle.metrics.jewelsCollected, 1);
    assert.equal(idle.metrics.totalDamageDealt, 1500);
    assert.ok(idle.metrics.dps >= 200, 'DPS deve refletir o dano dividido pela janela de tempo');
  });

  it('Caça AFK Offline: Calcula corretamente recompensas acumuladas de tempo offline', () => {
    const idle = new IdleAutoCombatEngine();

    const rewards1h = idle.simulateOfflineHunting(1, 'LORENCIA');
    assert.equal(rewards1h.durationHours, 1);
    assert.equal(rewards1h.monstersKilled, 180);
    assert.equal(rewards1h.xpGained, 180 * 350);
    assert.equal(rewards1h.zenCollected, 180 * 45);
    assert.ok(rewards1h.jewels.chaos >= 4, 'Deve gerar joias do caos');
    assert.ok(rewards1h.jewels.bless >= 2, 'Deve gerar joias da bênção');

    const rewardsDevias = idle.simulateOfflineHunting(4, 'DEVIAS');
    assert.equal(rewardsDevias.durationHours, 4);
    assert.equal(rewardsDevias.monstersKilled, 140 * 4);
    assert.equal(rewardsDevias.xpGained, 560 * 1200);
    assert.equal(rewardsDevias.zenCollected, 560 * 180);
    assert.ok(rewardsDevias.jewels.soul >= 10, 'Deve gerar joias de alma');
  });
});
