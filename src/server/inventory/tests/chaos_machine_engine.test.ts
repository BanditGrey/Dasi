import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ChaosMachineEngine,
} from '../ChaosMachineEngine.ts';
import type { ItemInstance } from '../types.ts';

describe('ChaosMachineEngine - Noria Goblin Chaos Combination Suite', () => {
  it('aplica upgrade de nível (+10 a +15) com bônus de Luck (+25%) e destruição em falha', () => {
    const item: ItemInstance = {
      uuid: 'blade-upgrade',
      defId: 'dragon_blade',
      level: 9,
      durability: 100,
      maxDurability: 100,
      skill: true,
      luck: true, // +25% de taxa
      optionLevel: 16,
      excellentMask: 0,
    };

    // +9 -> +10: Base 50% + Luck 25% = 75%
    // Requer 1 Bless, 1 Soul, 1 Chaos, 2.000.000 Zen
    const successRes = ChaosMachineEngine.mixPlusLevel(item, 1, 1, 1, 3_000_000, 0.70);
    assert.equal(successRes.success, true);
    assert.equal(successRes.itemDestroyed, false);
    assert.equal(item.level, 10);

    // Tentativa com falha: roll 0.85 (> 75%) -> DESTRUIÇÃO
    const failRes = ChaosMachineEngine.mixPlusLevel(item, 2, 2, 1, 5_000_000, 0.85);
    assert.equal(failRes.success, false);
    assert.equal(failRes.itemDestroyed, true);
  });

  it('cria Armas do Caos a partir de itens +4+4 e Jewel of Chaos', () => {
    const items: ItemInstance[] = [
      {
        uuid: 'mat-1',
        defId: 'blade',
        level: 7,
        durability: 100,
        maxDurability: 100,
        skill: false,
        luck: false,
        optionLevel: 8,
        excellentMask: 0,
      },
    ];

    const mixRes = ChaosMachineEngine.mixChaosWeapon(items, true, 200_000, 0.1);
    assert.equal(mixRes.success, true);
    assert.ok(
      ['chaos_dragon_axe', 'chaos_lightning_staff', 'chaos_nature_bow'].includes(
        mixRes.resultItem!.defId
      )
    );
  });

  it('cria Asas Nível 1 a partir de Arma do Caos +4+4 e Jewel of Chaos', () => {
    const chaosWpn: ItemInstance = {
      uuid: 'chaos-wpn',
      defId: 'chaos_dragon_axe',
      level: 8,
      durability: 100,
      maxDurability: 100,
      skill: true,
      luck: true,
      optionLevel: 12,
      excellentMask: 0,
    };

    const res = ChaosMachineEngine.mixWing1(chaosWpn, true, 2_000_000, 0.1);
    assert.equal(res.success, true);
    assert.ok(
      ['wings_of_satan', 'wings_of_heaven', 'wings_of_elf', 'wings_of_mistery'].includes(
        res.resultItem!.defId
      )
    );
  });

  it('cria Asas Nível 2 a partir de Asas Nível 1 e Lochs Feather ou Crest of Monarch', () => {
    const wing1: ItemInstance = {
      uuid: 'wing1-mat',
      defId: 'wings_of_satan',
      level: 9,
      durability: 200,
      maxDurability: 200,
      skill: false,
      luck: true,
      optionLevel: 4,
      excellentMask: 0,
    };

    // Com Crest of Monarch -> Cape of Lord (DL)
    const dlRes = ChaosMachineEngine.mixWing2(wing1, true, true, true, 6_000_000, 0.1);
    assert.equal(dlRes.success, true);
    assert.equal(dlRes.resultItem!.defId, 'cape_of_lord');

    // Com Loch's Feather -> Wings 2 normais (Dragon, Soul, Spirits, Darkness)
    const normalRes = ChaosMachineEngine.mixWing2(wing1, true, false, true, 6_000_000, 0.1);
    assert.equal(normalRes.success, true);
    assert.ok(
      ['wings_of_dragon', 'wings_of_soul', 'wings_of_spirits', 'wings_of_darkness'].includes(
        normalRes.resultItem!.defId
      )
    );
  });

  it('pipeline completa de criação do Lobo Fenrir (Etapas 1, 2, 3 e 4)', () => {
    // Etapa 1: Piece of Horn (70% taxa)
    const pRes = ChaosMachineEngine.mixPieceOfHorn(20, 20, true, 0.50);
    assert.equal(pRes.success, true);
    assert.equal(pRes.resultItem!.defId, 'piece_of_horn');

    // Etapa 2: Broken Horn (50% taxa)
    const bRes = ChaosMachineEngine.mixBrokenHorn(5, 10, true, 0.40);
    assert.equal(bRes.success, true);
    assert.equal(bRes.resultItem!.defId, 'broken_horn');

    // Etapa 3: Horn of Fenrir Vermelho (30% taxa canônica)
    const fRes = ChaosMachineEngine.mixHornOfFenrir(true, 3, true, 15_000_000, 0.20);
    assert.equal(fRes.success, true);
    assert.equal(fRes.resultItem!.defId, 'fenrir_red');
    assert.equal(fRes.resultItem!.skill, true);

    // Etapa 4: Fenrir Upgrade (Destruction com arma, Protection com armadura)
    const redFenrir = fRes.resultItem!;
    const weaponCat: ItemInstance = {
      uuid: 'cat-wpn',
      defId: 'blade',
      level: 4,
      durability: 100,
      maxDurability: 100,
      skill: true,
      luck: false,
      optionLevel: 4,
      excellentMask: 0,
    };
    const blackRes = ChaosMachineEngine.mixFenrirUpgrade(redFenrir, weaponCat, 5, true, 15_000_000, 0.50);
    assert.equal(blackRes.success, true);
    assert.equal(blackRes.resultItem!.defId, 'fenrir_black');

    const armorCat: ItemInstance = {
      uuid: 'cat-arm',
      defId: 'dragon_armor',
      level: 4,
      durability: 100,
      maxDurability: 100,
      skill: false,
      luck: false,
      optionLevel: 4,
      excellentMask: 0,
    };
    const blueRes = ChaosMachineEngine.mixFenrirUpgrade(redFenrir, armorCat, 5, true, 15_000_000, 0.50);
    assert.equal(blueRes.success, true);
    assert.equal(blueRes.resultItem!.defId, 'fenrir_blue');
  });

  it('criação de Dinorant (10 Unirias + Chaos -> 70% rate)', () => {
    const dinoRes = ChaosMachineEngine.mixDinorant(10, true, 1_000_000, 0.60);
    assert.equal(dinoRes.success, true);
    assert.equal(dinoRes.resultItem!.defId, 'dinorant');
  });

  it('criação de Frutas de Atributo (Chaos + Creation -> 90% rate)', () => {
    const fruitRes = ChaosMachineEngine.mixFruit(true, true, 5_000_000, 0.80);
    assert.equal(fruitRes.success, true);
    assert.ok(
      [
        'fruit_strength',
        'fruit_agility',
        'fruit_vitality',
        'fruit_energy',
        'fruit_command',
      ].includes(fruitRes.resultItem!.defId)
    );
  });
});
