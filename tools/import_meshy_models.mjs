/**
 * Dasi MMORPG - Meshy & External 3D GLB Model Importer
 * 
 * Permite varrer a pasta de Downloads (capturas do MeshyGrab) ou repositórios locais (como Lemuria)
 * e importar/instalar modelos 3D com rig e animações diretamente no ecossistema Dasi.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { inspectHeroGlb } from './audit_hero_glb.mjs';
import { readFile } from 'node:fs/promises';

const TARGET_HEROES_DIR = resolve('src/client/dev_viewer/models/animated_heroes');
const TARGET_MONSTERS_DIR = resolve('src/client/dev_viewer/models/monsters');
const TARGET_MOUNTS_DIR = resolve('src/client/dev_viewer/models/mounts');

// Garante pastas de destino
[TARGET_HEROES_DIR, TARGET_MONSTERS_DIR, TARGET_MOUNTS_DIR].forEach((dir) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

// Mapa de correspondência para modelos Lemuria -> Classes MU
const LEMURIA_MAP = {
  'Knight.glb': { targetDir: TARGET_HEROES_DIR, targetName: 'hero_dk_animated.glb', class: 'DK' },
  'Mage.glb': { targetDir: TARGET_HEROES_DIR, targetName: 'hero_dw_animated.glb', class: 'DW' },
  'WindRanger.glb': { targetDir: TARGET_HEROES_DIR, targetName: 'hero_elf_animated.glb', class: 'ELF' },
  'BladeGuardian.glb': { targetDir: TARGET_HEROES_DIR, targetName: 'hero_mg_animated.glb', class: 'MG' },
  'VoidHerald.glb': { targetDir: TARGET_HEROES_DIR, targetName: 'hero_dl_animated.glb', class: 'DL' },
  'Skeleton_Warrior.glb': { targetDir: TARGET_MONSTERS_DIR, targetName: 'skeleton_warrior_animated.glb', class: 'MONSTER' },
  'Dragon_Evolved.glb': { targetDir: TARGET_MONSTERS_DIR, targetName: 'dragon_evolved.glb', class: 'MONSTER' },
  'Demon.glb': { targetDir: TARGET_MONSTERS_DIR, targetName: 'demon_animated.glb', class: 'MONSTER' },
  'Bull.glb': { targetDir: TARGET_MONSTERS_DIR, targetName: 'bull_animated.glb', class: 'MONSTER' },
  'Wolf.glb': { targetDir: TARGET_MONSTERS_DIR, targetName: 'wolf_animated.glb', class: 'MONSTER' },
  'Yeti.glb': { targetDir: TARGET_MONSTERS_DIR, targetName: 'yeti_animated.glb', class: 'MONSTER' },
  'mount_dragon.glb': { targetDir: TARGET_MOUNTS_DIR, targetName: 'mount_dragon.glb', class: 'MOUNT' },
  'mount_chimera.glb': { targetDir: TARGET_MOUNTS_DIR, targetName: 'mount_chimera.glb', class: 'MOUNT' },
  'mount_wolf.glb': { targetDir: TARGET_MOUNTS_DIR, targetName: 'mount_wolf.glb', class: 'MOUNT' }
};

export async function importFromFolder(sourceDir) {
  console.log(`[Importer] Varrendo diretório fonte: ${sourceDir}`);
  if (!existsSync(sourceDir)) {
    console.warn(`[Importer] Diretório não encontrado: ${sourceDir}`);
    return [];
  }

  const results = [];
  const files = readdirSync(sourceDir);

  for (const file of files) {
    if (!file.toLowerCase().endsWith('.glb')) continue;
    const fullSource = join(sourceDir, file);
    
    // Verifica se temos mapeamento pré-definido
    const mapping = LEMURIA_MAP[file];
    let destPath = '';

    if (mapping) {
      destPath = join(mapping.targetDir, mapping.targetName);
    } else {
      // Capturas arbitrárias do MeshyGrab em Downloads
      destPath = join(TARGET_HEROES_DIR, file);
    }

    try {
      const buffer = await readFile(fullSource);
      const audit = inspectHeroGlb(buffer);
      copyFileSync(fullSource, destPath);

      results.push({
        sourceFile: file,
        destPath,
        sizeMb: (buffer.length / (1024 * 1024)).toFixed(2),
        animations: audit.animations.length,
        animationNames: audit.animations.slice(0, 5),
        meshes: audit.meshes,
        vertices: audit.vertices
      });
      console.log(`[Importer] ✅ Importado: ${file} -> ${basename(destPath)} (${audit.animations.length} animações, ${audit.meshes} meshes)`);
    } catch (err) {
      console.warn(`[Importer] ⚠️ Erro ao processar ${file}:`, err.message);
    }
  }

  return results;
}

// Se executado diretamente
if (process.argv[1] && process.argv[1].endsWith('import_meshy_models.mjs')) {
  const lemuriaModels = 'D:/Lemuria-Online-main/public/models';
  const downloadsModels = 'C:/Users/Daniel/Downloads';

  (async () => {
    console.log('=== DASI 3D MODEL IMPORTER ===');
    if (existsSync(lemuriaModels)) {
      console.log('\n--- Importando Acervo Lemuria MU 3D ---');
      await importFromFolder(lemuriaModels);
    }
    
    console.log('\n--- Importando Capturas do MeshyGrab em Downloads ---');
    await importFromFolder(downloadsModels);
    console.log('\n=== Importação Concluída ===');
  })();
}
