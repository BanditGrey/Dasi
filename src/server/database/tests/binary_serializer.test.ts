import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BinaryItemSerializer,
  ITEM_INDEX_BY_DEF_ID,
} from '../BinaryItemSerializer.ts';
import type { ItemInstance, PlacedItem } from '../../inventory/types.ts';

describe('BinaryItemSerializer - Webzen Canonical 16-byte DB & 12-byte Packet Packing', () => {
  it('serializa e deserializa um item de 16 bytes preservando todos os atributos canônicos', () => {
    const item: ItemInstance = {
      uuid: 'test-item-1',
      defId: 'bone_blade',
      level: 13,
      durability: 140,
      maxDurability: 153,
      skill: true,
      luck: true,
      optionLevel: 28, // +28 JoL (7 * 4)
      excellentMask: 0x3f, // Todas as 6 opções excelentes ativas
      ancientOption: 5,
      itemOption380: true,
      harmonyOption: {
        type: 'HARMONY_OPT_1' as any,
        level: 10,
        value: 15,
      },
      socketOptions: [0x01, 0x02, 0x03, 0x04, 0x05],
      serial: 0x12345678,
    };
    (item.harmonyOption as any).id = 1;

    const buffer = BinaryItemSerializer.serializeItem16(item);
    assert.equal(buffer.length, 16);

    const deserialized = BinaryItemSerializer.deserializeItem16(buffer);
    assert.ok(deserialized);
    assert.equal(deserialized.item.defId, 'bone_blade');
    assert.equal(deserialized.item.level, 13);
    assert.equal(deserialized.item.skill, true);
    assert.equal(deserialized.item.luck, true);
    assert.equal(deserialized.item.optionLevel, 28);
    assert.equal(deserialized.item.durability, 140);
    assert.equal(deserialized.item.excellentMask, 0x3f);
    assert.equal(deserialized.item.ancientOption, 5);
    assert.equal(deserialized.item.itemOption380, true);
    assert.equal(deserialized.item.serial, 0x12345678);
    assert.deepEqual(deserialized.item.socketOptions, [0x01, 0x02, 0x03, 0x04, 0x05]);
  });

  it('reconhece e trata slots vazios serializados como 0xFF', () => {
    const emptyBuffer = BinaryItemSerializer.serializeItem16(null);
    assert.equal(emptyBuffer.length, 16);
    assert.equal(emptyBuffer[0], 0xff);

    const result = BinaryItemSerializer.deserializeItem16(emptyBuffer);
    assert.equal(result, null);
  });

  it('serializa e deserializa um inventário completo de 108 slots (1.728 bytes)', () => {
    const placedItems: PlacedItem[] = [
      {
        item: {
          uuid: 'sword-1',
          defId: 'dragon_blade',
          level: 11,
          durability: 100,
          maxDurability: 100,
          skill: true,
          luck: false,
          optionLevel: 16,
          excellentMask: 4,
          serial: 111,
        },
        x: 0,
        y: 0,
        width: 1,
        height: 4,
      },
      {
        item: {
          uuid: 'helm-1',
          defId: 'dragon_helm',
          level: 15,
          durability: 120,
          maxDurability: 120,
          skill: false,
          luck: true,
          optionLevel: 12,
          excellentMask: 0,
          serial: 222,
        },
        x: 2,
        y: 0,
        width: 2,
        height: 2,
      },
    ];

    const invBuffer = BinaryItemSerializer.serializeInventory(placedItems, 108);
    assert.equal(invBuffer.length, 108 * 16); // 1.728 bytes exatos

    const loadedSlots = BinaryItemSerializer.deserializeInventory(invBuffer, 108);
    assert.equal(loadedSlots.length, 108);

    // Slot 0 tem a espada
    assert.ok(loadedSlots[0]);
    assert.equal(loadedSlots[0]!.item.defId, 'dragon_blade');
    assert.equal(loadedSlots[0]!.item.level, 11);

    // Slot 1 tem o elmo
    assert.ok(loadedSlots[1]);
    assert.equal(loadedSlots[1]!.item.defId, 'dragon_helm');
    assert.equal(loadedSlots[1]!.item.level, 15);

    // Slot 2 em diante é nulo (vazio)
    assert.equal(loadedSlots[2], null);
  });

  it('serializa e deserializa um baú (Warehouse) completo de 240 slots (3.840 bytes)', () => {
    const warehouseItems: PlacedItem[] = [
      {
        item: {
          uuid: 'jewel-1',
          defId: 'jewel_of_chaos',
          level: 0,
          durability: 1,
          maxDurability: 1,
          skill: false,
          luck: false,
          optionLevel: 0,
          excellentMask: 0,
          serial: 333,
        },
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      },
    ];

    const vaultBuffer = BinaryItemSerializer.serializeWarehouse(warehouseItems, 240);
    assert.equal(vaultBuffer.length, 240 * 16); // 3.840 bytes exatos

    const loadedVault = BinaryItemSerializer.deserializeWarehouse(vaultBuffer, 240);
    assert.equal(loadedVault.length, 240);
    assert.equal(loadedVault[0]!.item.defId, 'jewel_of_chaos');
    assert.equal(loadedVault[1], null);
  });

  it('serializa pacote de rede canônico de 12 bytes (CItemManager::ItemByteConvert)', () => {
    const item: ItemInstance = {
      uuid: 'net-item',
      defId: 'grand_viper_staff',
      level: 11,
      durability: 130,
      maxDurability: 141,
      skill: true,
      luck: true,
      optionLevel: 16,
      excellentMask: 0x02,
      itemOption380: true,
    };

    const packetBuf = BinaryItemSerializer.serializeItemPacket12(item);
    assert.equal(packetBuf.length, 12);
    assert.equal(packetBuf[0], ITEM_INDEX_BY_DEF_ID['grand_viper_staff'] & 0xff);
    assert.equal(Math.floor(packetBuf[1] / 8) & 15, 11); // Nível 11
  });
});
