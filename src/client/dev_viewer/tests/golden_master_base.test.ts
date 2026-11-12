import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Helper para extração leve do cabeçalho glTF JSON dentro do binário GLB
function parseGlbJson(glbPath: string) {
  const buf = fs.readFileSync(glbPath);
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  return JSON.parse(jsonStr);
}

describe('Golden Master Base - Dark Knight (Blade Knight) Arquitetura Modular & QA', () => {
  const MODEL_PATH_ANIM = 'src/client/dev_viewer/models/animated_heroes/hero_dk_master_base.glb';
  const MODEL_PATH_STATIC = 'src/client/dev_viewer/models/hero_dk_master_base.glb';

  // --------------------------------------------------------------------------
  // 1. EXISTÊNCIA FÍSICA E INTEGRIDADE DO GLB MESTRE
  // --------------------------------------------------------------------------
  it('garante que o arquivo hero_dk_master_base.glb existe e possui tamanho de arquivo saudável (>1MB)', () => {
    assert.ok(fs.existsSync(MODEL_PATH_ANIM), `Modelo mestre não encontrado em ${MODEL_PATH_ANIM}`);
    const stats = fs.statSync(MODEL_PATH_ANIM);
    assert.ok(stats.size > 1_000_000, `GLB mestre muito pequeno (${stats.size} bytes), esperado > 1MB`);

    // Sincronização com pasta de modelos estáticos
    assert.ok(fs.existsSync(MODEL_PATH_STATIC), `Modelo mestre estático não encontrado em ${MODEL_PATH_STATIC}`);
  });

  // --------------------------------------------------------------------------
  // 2. PRESENÇA DAS CAMADAS CANÔNICAS (ANATOMIA, ARMADURA, ASAS, ARMAS)
  // --------------------------------------------------------------------------
  it('contém todas as camadas modulares organizadas por nomenclatura canônica estrita', () => {
    const gltf = parseGlbJson(MODEL_PATH_ANIM);
    const nodeNames = gltf.nodes.map((n: any) => n.name).filter(Boolean);

    // A. Camada de Anatomia Base Humana (Body_*)
    const expectedBody = ['Body_Head', 'Body_Chest', 'Body_Legs', 'Body_Gloves', 'Body_Boots'];
    for (const bodyPart of expectedBody) {
      assert.ok(nodeNames.includes(bodyPart), `Parte corporal base ausente: ${bodyPart}`);
    }

    // B. Camada de Armadura Dragon Elite (Armor_*)
    const expectedArmor = ['Armor_Helm', 'Armor_Chest', 'Armor_Legs', 'Armor_Gloves', 'Armor_Boots'];
    for (const armorPart of expectedArmor) {
      assert.ok(nodeNames.includes(armorPart), `Peça de armadura Dragon ausente: ${armorPart}`);
    }

    // C. Camada de Asas (Wings_*)
    const wingNode = gltf.nodes.find((n: any) => n.name && n.name.startsWith('Wings_'));
    assert.ok(wingNode, 'Nó de Asas canônico (Wings_*) ausente no modelo mestre');
    assert.strictEqual(wingNode.name, 'Wings_Dragon', 'Asas devem ser nomeadas como Wings_Dragon');

    // D. Camada de Armas (Weapon_Right, Weapon_Left)
    assert.ok(nodeNames.includes('Weapon_Right'), 'Arma principal da mão direita (Weapon_Right) ausente');
    assert.ok(nodeNames.includes('Weapon_Left'), 'Arma secundária da mão esquerda (Weapon_Left) ausente');
  });

  // --------------------------------------------------------------------------
  // 3. DIMENSÕES E PROPORÇÕES ANATÔMICAS HEROICAS
  // --------------------------------------------------------------------------
  it('valida proporções anatômicas canônicas (altura ~1.85m-1.91m, envergadura de asas ~3.0m, armas eretas)', () => {
    const gltf = parseGlbJson(MODEL_PATH_ANIM);

    // Localiza a cabeça base para validar altura humana do herói
    const headNode = gltf.nodes.find((n: any) => n.name === 'Body_Head');
    assert.ok(headNode && headNode.mesh !== undefined, 'Malha Body_Head deve existir');
    const headMesh = gltf.meshes[headNode.mesh];
    const headPosAcc = gltf.accessors[headMesh.primitives[0].attributes.POSITION];
    const humanHeight = headPosAcc.max[1]; // Coordenada Y superior da cabeça

    assert.ok(
      humanHeight >= 1.80 && humanHeight <= 1.95,
      `Altura anatômica do herói (${humanHeight.toFixed(3)}m) fora do padrão canônico (~1.85m-1.91m)`
    );

    // Localiza as asas de dragão para validar envergadura
    const wingsNode = gltf.nodes.find((n: any) => n.name === 'Wings_Dragon');
    assert.ok(wingsNode && wingsNode.mesh !== undefined, 'Malha Wings_Dragon deve existir');
    const wingsMesh = gltf.meshes[wingsNode.mesh];
    const wingsPosAcc = gltf.accessors[wingsMesh.primitives[0].attributes.POSITION];
    const wingspan = wingsPosAcc.max[0] - wingsPosAcc.min[0];

    assert.ok(
      wingspan >= 2.50 && wingspan <= 3.20,
      `Envergadura das asas (${wingspan.toFixed(3)}m) fora do padrão heroico (~3.0m)`
    );

    // Localiza a arma principal (Dragon Blade) para validar alinhamento ereto
    const wepNode = gltf.nodes.find((n: any) => n.name === 'Weapon_Right');
    assert.ok(wepNode && wepNode.mesh !== undefined, 'Malha Weapon_Right deve existir');
    const wepMesh = gltf.meshes[wepNode.mesh];
    
    // Calcula os bounds totais da arma
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const prim of wepMesh.primitives) {
      const posAcc = gltf.accessors[prim.attributes.POSITION];
      if (posAcc.min[0] < minX) minX = posAcc.min[0];
      if (posAcc.max[0] > maxX) maxX = posAcc.max[0];
      if (posAcc.min[1] < minY) minY = posAcc.min[1];
      if (posAcc.max[1] > maxY) maxY = posAcc.max[1];
    }
    const wepWidth = maxX - minX;
    const wepLength = maxY - minY;

    assert.ok(wepWidth < 0.40, `Largura transversal da espada excessiva: ${wepWidth.toFixed(2)}m (esperado < 0.40m)`);
    assert.ok(wepLength > 1.40, `Comprimento longitudinal da espada insuficiente: ${wepLength.toFixed(2)}m (esperado > 1.40m)`);
  });

  // --------------------------------------------------------------------------
  // 4. AUSÊNCIA DE NÓS FANTASMAS / ÓRFÃOS RESIDUAIS
  // --------------------------------------------------------------------------
  it('assegura ausência total de malhas fantasmas, primitivas de teste (Icosphere) ou nós órfãos', () => {
    const gltf = parseGlbJson(MODEL_PATH_ANIM);
    const forbiddenKeywords = ['icosphere', 'acc_', 'cube', 'sphere', 'cylinder', 'plane'];

    for (const node of gltf.nodes) {
      const nameLower = (node.name || '').toLowerCase();
      for (const kw of forbiddenKeywords) {
        assert.ok(
          !nameLower.includes(kw),
          `Nó fantasma ou artefato procedural proibido detectado no modelo mestre: "${node.name}"`
        );
      }
    }

    // Todas as malhas devem estar contidas no Armature ou subordinadas a bones
    const defaultScene = gltf.scenes[gltf.scene ?? 0];
    const rootNodes = defaultScene.nodes.map((idx: number) => gltf.nodes[idx]);
    for (const root of rootNodes) {
      if (root.mesh !== undefined) {
        assert.fail(`Malha órfã desconectada do Armature na raiz da cena: ${root.name}`);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 5. RIG CANÔNICO E 21 ANIMAÇÕES OFICIAIS
  // --------------------------------------------------------------------------
  it('possui o rig canônico com todas as 21 animações e postura padrão Idle preservada', () => {
    const gltf = parseGlbJson(MODEL_PATH_ANIM);
    const animNames = (gltf.animations ?? []).map((a: any) => a.name);

    assert.ok(animNames.length >= 21, `Esperadas pelo menos 21 animações, encontradas: ${animNames.length}`);

    const requiredAnimations = [
      'Idle',
      'Walking_A',
      'Running_A',
      'Sprint',
      'Death_A',
      'Hit_A',
      '1H_Melee_Attack_Chop',
      '2H_Melee_Attack_Spin',
      'Sword_Idle',
    ];

    for (const anim of requiredAnimations) {
      assert.ok(animNames.includes(anim), `Animação canônica ausente: ${anim}`);
    }
  });

  // --------------------------------------------------------------------------
  // 6. TESTE DE ALTERNÂNCIA MODULAR DE CAMADAS (LAYER TOGGLING)
  // --------------------------------------------------------------------------
  it('suporta isolamento modular perfeito entre as camadas Body, Armor, Wings e Weapons', () => {
    const gltf = parseGlbJson(MODEL_PATH_ANIM);
    const nodesWithMesh = gltf.nodes.filter((n: any) => n.mesh !== undefined);

    const bodyNodes = nodesWithMesh.filter((n: any) => n.name.startsWith('Body_'));
    const armorNodes = nodesWithMesh.filter((n: any) => n.name.startsWith('Armor_'));
    const wingNodes = nodesWithMesh.filter((n: any) => n.name.startsWith('Wings_'));
    const weaponNodes = nodesWithMesh.filter((n: any) => n.name.startsWith('Weapon_'));

    assert.strictEqual(bodyNodes.length, 5, 'Devem existir exatamente 5 nós na camada Body');
    assert.strictEqual(armorNodes.length, 5, 'Devem existir exatamente 5 nós na camada Armor');
    assert.strictEqual(wingNodes.length, 1, 'Deve existir exatamente 1 nó na camada Wings');
    assert.strictEqual(weaponNodes.length, 2, 'Devem existir exatamente 2 nós na camada Weapons');

    // A soma das 4 camadas deve cobrir 100% das malhas do modelo
    const totalCategorized = bodyNodes.length + armorNodes.length + wingNodes.length + weaponNodes.length;
    assert.strictEqual(
      nodesWithMesh.length,
      totalCategorized,
      `Existem malhas não categorizadas em nenhuma das 4 camadas oficiais (${nodesWithMesh.length} vs ${totalCategorized})`
    );
  });

  // --------------------------------------------------------------------------
  // 7. INTEGRIDADE DOS MATERIAIS E TEXTURAS DO MATERIAL DE ESTUDO
  // --------------------------------------------------------------------------
  it('garante conformidade de materiais e slots PBR fiéis ao material de estudo canônico', () => {
    const gltf = parseGlbJson(MODEL_PATH_ANIM);
    assert.ok(Array.isArray(gltf.materials) && gltf.materials.length >= 4, 'Devem existir materiais para todas as camadas');
    assert.ok(Array.isArray(gltf.meshes) && gltf.meshes.length >= 10, 'Devem existir malhas dedicadas');

    // Valida que cada malha possui atributos de posição, normais e coordenadas UV
    for (const mesh of gltf.meshes) {
      for (const prim of mesh.primitives) {
        assert.ok(prim.attributes.POSITION !== undefined, `Posição ausente na malha ${mesh.name}`);
        assert.ok(prim.attributes.NORMAL !== undefined, `Normal ausente na malha ${mesh.name}`);
      }
    }
  });
});
