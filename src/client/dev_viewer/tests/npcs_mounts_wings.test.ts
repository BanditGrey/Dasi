/**
 * DASI MMORPG - TESTES DE INTEGRIDADE DE NPCS, MONTARIAS E ASAS 3D
 * Valida a existência, tamanho de arquivo e formato binário GLB (glTF 2.0).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('1. Integridade dos NPCs 3D Canônicos (models/npcs/)', () => {
  const expectedNpcs = [
    'npc_han_blacksmith.glb',
    'npc_pupa_pharmacist.glb',
    'npc_sentinel_guard.glb',
    'npc_lumen_barmaid.glb',
    'npc_chaos_goblin.glb',
    'npc_charon_boatman.glb',
    'npc_lahap_jeweler.glb',
    'npc_lala_craftswoman.glb',
    'npc_sebina_priestess.glb',
    'npc_shadow_phantom.glb',
  ];

  it('verifica que todos os 10 NPCs canônicos existem e possuem cabeçalho GLTF válido', () => {
    for (const npcFile of expectedNpcs) {
      const fullPath = path.join('src/client/dev_viewer/models/npcs', npcFile);
      assert.ok(fs.existsSync(fullPath), `NPC ${npcFile} deve existir`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 2000, `NPC ${npcFile} deve ter tamanho substancial (> 2KB), tem ${stat.size}`);

      const fd = fs.openSync(fullPath, 'r');
      const header = Buffer.alloc(12);
      fs.readSync(fd, header, 0, 12, 0);
      fs.closeSync(fd);

      const magic = header.toString('utf8', 0, 4);
      const version = header.readUInt32LE(4);
      assert.strictEqual(magic, 'glTF', `${npcFile} deve ter cabeçalho binário 'glTF'`);
      assert.strictEqual(version, 2, `${npcFile} deve ser glTF versão 2.0`);
    }
  });
});

describe('2. Integridade de Montarias e Pets Oficiais (models/mounts/)', () => {
  const expectedMountsAndPets = [
    'mount_dark_horse.glb',
    'mount_dinorant.glb',
    'mount_uniria.glb',
    'mount_fenrir_red.glb',
    'mount_fenrir_black.glb',
    'mount_fenrir_blue.glb',
    'mount_fenrir_golden.glb',
    'pet_dark_raven.glb',
    'pet_imp_satan.glb',
    'pet_guardian_angel.glb',
  ];

  it('verifica que todas as 10 montarias e pets existem e possuem cabeçalho GLTF válido', () => {
    for (const file of expectedMountsAndPets) {
      const fullPath = path.join('src/client/dev_viewer/models/mounts', file);
      assert.ok(fs.existsSync(fullPath), `Mount/Pet ${file} deve existir`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 2000, `Mount/Pet ${file} deve ter tamanho substancial (> 2KB), tem ${stat.size}`);

      const fd = fs.openSync(fullPath, 'r');
      const header = Buffer.alloc(12);
      fs.readSync(fd, header, 0, 12, 0);
      fs.closeSync(fd);

      const magic = header.toString('utf8', 0, 4);
      const version = header.readUInt32LE(4);
      assert.strictEqual(magic, 'glTF', `${file} deve ter cabeçalho binário 'glTF'`);
      assert.strictEqual(version, 2, `${file} deve ser glTF versão 2.0`);
    }
  });
});

describe('3. Integridade das Asas e Capas Nível 2 (models/wings/)', () => {
  const expectedWings = [
    'wings_dragon_level2.glb',
    'wings_soul_level2.glb',
    'wings_spirits_level2.glb',
    'wings_darkness_level2.glb',
    'cape_of_lord.glb',
  ];

  it('verifica que todas as 5 asas e capa de lorde existem e possuem cabeçalho GLTF válido', () => {
    for (const wingFile of expectedWings) {
      const fullPath = path.join('src/client/dev_viewer/models/wings', wingFile);
      assert.ok(fs.existsSync(fullPath), `Asa ${wingFile} deve existir`);
      const stat = fs.statSync(fullPath);
      assert.ok(stat.size > 2000, `Asa ${wingFile} deve ter tamanho substancial (> 2KB), tem ${stat.size}`);

      const fd = fs.openSync(fullPath, 'r');
      const header = Buffer.alloc(12);
      fs.readSync(fd, header, 0, 12, 0);
      fs.closeSync(fd);

      const magic = header.toString('utf8', 0, 4);
      const version = header.readUInt32LE(4);
      assert.strictEqual(magic, 'glTF', `${wingFile} deve ter cabeçalho binário 'glTF'`);
      assert.strictEqual(version, 2, `${wingFile} deve ser glTF versão 2.0`);
    }
  });
});
