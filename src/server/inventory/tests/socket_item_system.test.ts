import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SocketItemSystem,
  SocketElementType,
  SOCKET_SLOT_EMPTY,
  SOCKET_SLOT_NONE,
  SocketBonusOption,
  CANONICAL_SOCKET_OPTIONS,
} from '../SocketItemSystem.ts';

describe('SocketItemSystem - Canonical Webzen Season 5.2 Implementation', () => {
  it('codifica e decodifica bytes de socket perfeitamente (OptionIndex + SphereLevel * 50)', () => {
    // Exemplo: Index 18 (Add Skill Damage, Ice), Sphere Level 4 (Sphere Level 5)
    // Byte esperado = 18 + (4 * 50) = 218
    const encoded = SocketItemSystem.encodeSocketByte(18, 4);
    assert.equal(encoded, 218);

    const decoded = SocketItemSystem.decodeSocketByte(218);
    assert.equal(decoded.isEmpty, false);
    assert.equal(decoded.isNone, false);
    assert.equal(decoded.optionIndex, 18);
    assert.equal(decoded.sphereLevel, 4);
    assert.equal(decoded.definition?.name, 'Add Skill Damage');
    assert.equal(decoded.definition?.type, SocketElementType.ICE);
    assert.equal(decoded.value, 60); // Nível 5 de Skill Damage = 60
  });

  it('identifica corretamente slots vazios (254) e slots inexistentes (255)', () => {
    const emptySlot = SocketItemSystem.decodeSocketByte(SOCKET_SLOT_EMPTY);
    assert.equal(emptySlot.isEmpty, true);
    assert.equal(emptySlot.value, 0);

    const noneSlot = SocketItemSystem.decodeSocketByte(SOCKET_SLOT_NONE);
    assert.equal(noneSlot.isNone, true);
    assert.equal(noneSlot.value, 0);
  });

  it('calcula bônus de arma (Fire + Lightning + Ice => +11 Dano)', () => {
    const fireByte = SocketItemSystem.encodeSocketByte(4, 0); // Add Damage, Fire
    const lightningByte = SocketItemSystem.encodeSocketByte(31, 0); // Add Critical Damage, Lightning
    const iceByte = SocketItemSystem.encodeSocketByte(18, 0); // Add Skill Damage, Ice

    const slots = [fireByte, lightningByte, iceByte, SOCKET_SLOT_EMPTY, SOCKET_SLOT_EMPTY];
    const bonus = SocketItemSystem.calculateBonusOption(slots, true, false);

    assert.equal(bonus, SocketBonusOption.WEAPON_DAMAGE);
  });

  it('calcula bônus de cajado (Lightning + Ice + Fire => +11 Skill Dano)', () => {
    const lightningByte = SocketItemSystem.encodeSocketByte(31, 0);
    const iceByte = SocketItemSystem.encodeSocketByte(18, 0);
    const fireByte = SocketItemSystem.encodeSocketByte(4, 0);

    const slots = [lightningByte, iceByte, fireByte, SOCKET_SLOT_EMPTY, SOCKET_SLOT_EMPTY];
    const bonus = SocketItemSystem.calculateBonusOption(slots, true, true);

    assert.equal(bonus, SocketBonusOption.STAFF_SKILL_DAMAGE);
  });

  it('calcula bônus de armadura (Water + Earth + Wind => +24 Defesa)', () => {
    const waterByte = SocketItemSystem.encodeSocketByte(11, 0); // Add Defense, Water
    const earthByte = SocketItemSystem.encodeSocketByte(36, 0); // Add Vitality, Earth
    const windByte = SocketItemSystem.encodeSocketByte(22, 0);  // Mul Max HP, Wind

    const slots = [waterByte, earthByte, windByte, SOCKET_SLOT_EMPTY, SOCKET_SLOT_EMPTY];
    const bonus = SocketItemSystem.calculateBonusOption(slots, false, false);

    assert.equal(bonus, SocketBonusOption.ARMOR_DEFENSE);
  });

  it('ativa opções de pacote combinadas (Double Damage +3% e Ignore Defense +1%)', () => {
    // Cria um conjunto de slots simulando equipamentos completos com os 6 elementos
    const fire = SocketItemSystem.encodeSocketByte(4, 0);      // 1 Fire
    const water = SocketItemSystem.encodeSocketByte(11, 0);    // 3 Water
    const ice = SocketItemSystem.encodeSocketByte(18, 0);      // 1 Ice
    const wind = SocketItemSystem.encodeSocketByte(22, 0);     // 3 Wind
    const lightning = SocketItemSystem.encodeSocketByte(31, 0);// 1 Lightning
    const earth = SocketItemSystem.encodeSocketByte(34, 0);    // 2 Earth

    const weaponSlots = [fire, ice, lightning, SOCKET_SLOT_EMPTY, SOCKET_SLOT_EMPTY];
    const armorSlots1 = [water, water, water, SOCKET_SLOT_EMPTY, SOCKET_SLOT_EMPTY];
    const armorSlots2 = [wind, wind, wind, earth, earth];

    const packageOptions = SocketItemSystem.calculatePackageOptions([weaponSlots, armorSlots1, armorSlots2]);

    // Possui >=1 de cada elemento => Double Damage +3%
    assert.equal(packageOptions.doubleDamageRate, 3);
    // Possui exatamente 1 Fire, 3 Water, 1 Ice, 3 Wind, 1 Lightning, 2 Earth => Ignore Defense +1%
    assert.equal(packageOptions.ignoreDefenseRate, 1);
  });

  it('monta uma esfera em slot vazio e recalcula o bônus', () => {
    const initialSlots: [number, number, number, number, number] = [
      SOCKET_SLOT_EMPTY,
      SOCKET_SLOT_EMPTY,
      SOCKET_SLOT_EMPTY,
      SOCKET_SLOT_NONE,
      SOCKET_SLOT_NONE,
    ];

    const mountResult = SocketItemSystem.mountSeedSphere(initialSlots, 0, 4, 2, true, false);
    assert.equal(mountResult.success, true);
    assert.notEqual(mountResult.newSlots[0], SOCKET_SLOT_EMPTY);

    const decoded = SocketItemSystem.decodeSocketByte(mountResult.newSlots[0]);
    assert.equal(decoded.optionIndex, 4);
    assert.equal(decoded.sphereLevel, 2);
    assert.equal(decoded.value, 25); // Nível 3 de Add Damage = 25
  });

  it('desmonta uma esfera liberando o slot para vazio (254)', () => {
    const filledSlots: [number, number, number, number, number] = [
      SocketItemSystem.encodeSocketByte(4, 0),
      SOCKET_SLOT_EMPTY,
      SOCKET_SLOT_EMPTY,
      SOCKET_SLOT_NONE,
      SOCKET_SLOT_NONE,
    ];

    const unmountResult = SocketItemSystem.unmountSeedSphere(filledSlots, 0, true, false);
    assert.equal(unmountResult.success, true);
    assert.equal(unmountResult.newSlots[0], SOCKET_SLOT_EMPTY);
  });
});
