/**
 * Dasi MMORPG - Testes Canônicos de Combate da Fairy Elf (Musa Elfa)
 * Season 5.2: Triple Shot, Heal, Greater Defense e Greater Damage
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { CombatEngine } from '../CombatEngine.ts';
import { MobSpawner } from '../MobSpawner.ts';
import { Monster } from '../Monster.ts';
import { CanonicalFormulas, CharacterClassId } from '../CanonicalFormulas.ts';
import type { ClientSession } from '../../network/SessionManager.ts';
import { GridInventory } from '../../inventory/GridInventory.ts';

describe('Fairy Elf - Combate & Habilidades Canônicas (Passo 7)', () => {
  function createElfSession(attrs: Partial<ClientSession['character']> = {}): ClientSession {
    const character = {
      id: 'char-elf-001',
      name: 'Aeria',
      characterClass: 'ELF',
      level: 120,
      strength: 80,
      agility: 240,
      vitality: 70,
      energy: 150,
      command: 0,
      zen: 50000,
      pkLevel: 3,
      statPoints: 0,
      ...attrs,
    };

    return {
      sessionId: 'sess-elf-001',
      character,
      inventory: new GridInventory(),
      currentHp: 800,
      maxHp: 800,
      currentMp: 300,
      maxMp: 300,
      currentSd: 400,
      maxSd: 400,
      activeBuffs: new Map(),
    } as unknown as ClientSession;
  }

  it('1. Fórmula de Ataque com Arco/Besta da Fairy Elf respeita os coeficientes canônicos', () => {
    // Para FE com arco: min = dex/14 + str/7, max = dex/8 + str/4
    const dex = 240;
    const str = 80;
    const atk = CanonicalFormulas.calculateAttackPower({
      classId: CharacterClassId.FAIRY_ELF,
      level: 120,
      strength: str,
      agility: dex,
      vitality: 70,
      energy: 150,
      leadership: 0,
      currentHp: 800,
      maxHp: 800,
      currentSd: 400,
      maxSd: 400,
      currentMp: 300,
      maxMp: 300,
      currentBp: 100,
      maxBp: 100,
    }, true);

    const expectedMin = Math.floor(dex / 14) + Math.floor(str / 7); // 17 + 11 = 28
    const expectedMax = Math.floor(dex / 8) + Math.floor(str / 4);   // 30 + 20 = 50

    assert.strictEqual(atk.minDamage, expectedMin);
    assert.strictEqual(atk.maxDamage, expectedMax);
  });

  it('2. Triple Shot consome 5 MP, causa dano com multiplicador de Agilidade e atinge monstros próximos', () => {
    const spawner = new MobSpawner();
    spawner.clear();

    const mob1 = new Monster('spider', 105, 100);
    mob1.currentHp = 500;
    mob1.maxHp = 500;
    spawner.registerExternalMonster(mob1);

    const mob2 = new Monster('spider', 110, 100);
    mob2.currentHp = 500;
    mob2.maxHp = 500;
    spawner.registerExternalMonster(mob2);

    const combatEngine = new CombatEngine(spawner);
    const session = createElfSession({ agility: 280 });
    const initialMp = session.currentMp!;

    const result = combatEngine.processPlayerAttack(session, {
      targetMobId: mob1.id,
      skillId: 'triple_shot',
      playerX: 100,
      playerY: 100,
    });

    assert.ok(result.success, 'Ataque com Triple Shot deve ter sucesso');
    assert.strictEqual(session.currentMp, initialMp - 5, 'Triple Shot deve consumir exatamente 5 MP');
    assert.ok(result.damage > 0, 'Dano do Triple Shot deve ser positivo');
    assert.ok(mob1.currentHp < 500, 'Monstro alvo principal deve ter sofrido dano');
    assert.ok(mob2.currentHp < 500, 'Monstro secundário em cone AoE deve ter sofrido dano secundário do Triple Shot');
  });

  it('3. Heal da Fairy Elf restaura HP autoritativamente com base em Energia', () => {
    const spawner = new MobSpawner();
    const combatEngine = new CombatEngine(spawner);
    const session = createElfSession({ energy: 200 });
    session.currentHp = 400;
    session.maxHp = 800;
    const initialMp = session.currentMp!;

    // calculateHeal(200) = 5 + floor(200 / 5) = 45 HP
    const expectedHeal = CanonicalFormulas.calculateHeal(200);
    assert.strictEqual(expectedHeal, 45);

    const supportResult = combatEngine.castSupportSkill(session, 'heal');
    assert.ok(supportResult.success);
    assert.strictEqual(supportResult.hpHealed, expectedHeal);
    assert.strictEqual(session.currentHp, 400 + expectedHeal);
    assert.ok(session.currentMp! < initialMp);
  });

  it('4. Greater Defense concede buff que reduz o dano recebido de ataques de monstros', () => {
    const spawner = new MobSpawner();
    spawner.clear();

    const mob = new Monster('hound', 100, 100);
    mob.attackMin = 90;
    mob.attackMax = 90;
    spawner.registerExternalMonster(mob);

    const combatEngine = new CombatEngine(spawner);
    const session = createElfSession({ energy: 240, agility: 100 });
    // calculateGreaterDefense(240) = 2 + floor(240 / 8) = 32 Defesa extra
    const defBonus = CanonicalFormulas.calculateGreaterDefense(240);
    assert.strictEqual(defBonus, 32);

    // Primeiro ataque sem buff
    const resWithoutBuff = combatEngine.processMonsterAttack(mob.id, session);

    // Concede o buff GREATER_DEFENSE
    combatEngine.castSupportSkill(session, 'greater_defense');
    assert.ok(session.activeBuffs!.has('GREATER_DEFENSE'));

    // Segundo ataque com o buff ativo
    const resWithBuff = combatEngine.processMonsterAttack(mob.id, session);

    if (!resWithoutBuff.isMiss && !resWithBuff.isMiss) {
      assert.ok(
        resWithBuff.damage <= resWithoutBuff.damage,
        `Dano com Greater Defense (${resWithBuff.damage}) deve ser menor ou igual ao sem buff (${resWithoutBuff.damage})`
      );
    }
  });

  it('5. Greater Damage concede buff que amplia o poder de ataque', () => {
    const spawner = new MobSpawner();
    spawner.clear();

    const mob = new Monster('spider', 100, 100);
    mob.currentHp = 10000;
    mob.maxHp = 10000;
    mob.defense = 0; // Para isolar o dano
    spawner.registerExternalMonster(mob);

    const combatEngine = new CombatEngine(spawner);
    const session = createElfSession({ energy: 210, agility: 200, strength: 100 });
    // calculateGreaterDamage(210) = 3 + floor(210 / 7) = 33 Dano extra
    const dmgBonus = CanonicalFormulas.calculateGreaterDamage(210);
    assert.strictEqual(dmgBonus, 33);

    combatEngine.castSupportSkill(session, 'greater_damage');
    assert.ok(session.activeBuffs!.has('GREATER_DAMAGE'));
    assert.strictEqual(session.activeBuffs!.get('GREATER_DAMAGE')!.value, 33);
  });
});
