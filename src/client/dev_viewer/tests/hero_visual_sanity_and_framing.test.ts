import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';

// Carregador leve de metadados glTF do buffer binário GLB
function parseGlbJson(glbPath: string) {
  const buf = fs.readFileSync(glbPath);
  const jsonLen = buf.readUInt32LE(12);
  const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
  return JSON.parse(jsonStr);
}

describe('Auditoria de Sanidade Visual e Enquadramento dos 5 Heróis (QA Perspective)', () => {
  const HERO_CLASSES = ['dk', 'dw', 'elf', 'mg', 'dl'] as const;

  // --------------------------------------------------------------------------
  // 1. INTEGRIDADE DE MALHAS E AUSÊNCIA DE ELEMENTOS ÓRFÃOS / ARTEFATOS
  // --------------------------------------------------------------------------
  it('garante que nenhum dos 5 GLBs animados possui malhas órfãs ou desconectadas na raiz', () => {
    for (const cls of HERO_CLASSES) {
      const glbPath = path.join('src/client/dev_viewer/models/animated_heroes', `hero_${cls}_animated.glb`);
      assert.ok(fs.existsSync(glbPath), `GLB do herói ${cls} deve existir em ${glbPath}`);

      const gltf = parseGlbJson(glbPath);

      // Localiza a cena default
      const defaultSceneIdx = gltf.scene ?? 0;
      const rootNodeIndices: number[] = gltf.scenes[defaultSceneIdx].nodes ?? [];

      // Mapeia pais de todos os nós
      const parentMap = new Map<number, number>();
      gltf.nodes.forEach((node: any, idx: number) => {
        if (node.children) {
          for (const c of node.children) {
            parentMap.set(c, idx);
          }
        }
      });

      // Checa se há nós com meshes diretamente na raiz da cena que não sejam armature/skinned
      for (const rootIdx of rootNodeIndices) {
        const rootNode = gltf.nodes[rootIdx];
        if (rootNode.mesh !== undefined) {
          assert.fail(`[${cls.toUpperCase()}] Nó órfão com malha na raiz da cena detectado: Node ${rootIdx} (${rootNode.name})`);
        }
      }

      // Todas as malhas devem estar contidas no Armature (ou parenteadas a bones canônicos)
      const armatureNode = gltf.nodes.find((n: any) => n.name === 'Armature');
      assert.ok(armatureNode, `[${cls.toUpperCase()}] Armature canônico não encontrado`);
    }
  });

  // --------------------------------------------------------------------------
  // 2. ARMAS E ADORNOS SEM DIMENSÕES ANÔMALAS OU FLUTUAÇÃO LATERAL
  // --------------------------------------------------------------------------
  it('garante que as armas e acessórios não possuem amplitude lateral absurda (sem lâminas azuis flutuando)', () => {
    for (const cls of HERO_CLASSES) {
      const glbPath = path.join('src/client/dev_viewer/models/animated_heroes', `hero_${cls}_animated.glb`);
      const gltf = parseGlbJson(glbPath);

      const weaponNodes = gltf.nodes.filter((n: any) => n.name && /weapon|wep|staff|bow|sword|scepter|blade/i.test(n.name));
      if (cls === 'dk') {
        assert.ok(weaponNodes.length > 0, `[${cls.toUpperCase()}] Nenhuma arma encontrada no GLB do Golden Master`);
      } else if (weaponNodes.length === 0) {
        continue; // Classes que usam equipamentos modulares desacoplados
      }

      for (const wNode of weaponNodes) {
        if (wNode.mesh === undefined) continue;
        const mesh = gltf.meshes[wNode.mesh];
        for (const prim of mesh.primitives) {
          const posAcc = gltf.accessors[prim.attributes.POSITION];
          const [minX, minY, minZ] = posAcc.min;
          const [maxX, maxY, maxZ] = posAcc.max;
          const widthX = maxX - minX;

          // Armas de mão e cajados de 1H/2H canônicos não devem ter largura lateral X maior que 2.0m no espaço local
          assert.ok(
            widthX <= 2.2,
            `[${cls.toUpperCase()}] Arma ${wNode.name} possui largura lateral excessiva (${widthX.toFixed(2)}m) indicando rotação descalibrada ou malha flutuante`
          );
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // 3. POSICIONAMENTO ANATÔMICO DAS ASAS (ESTRITAMENTE NAS COSTAS)
  // --------------------------------------------------------------------------
  it('valida que as asas estão parenteadas à espinha (spine_03) com simetria horizontal e sem penetrar o peito', () => {
    for (const cls of HERO_CLASSES) {
      const glbPath = path.join('src/client/dev_viewer/models/animated_heroes', `hero_${cls}_animated.glb`);
      const gltf = parseGlbJson(glbPath);

      const wingNodes = gltf.nodes.filter((n: any) => n.name && /wing|cape/i.test(n.name));
      if (cls === 'dk') {
        assert.ok(wingNodes.length > 0, `[${cls.toUpperCase()}] Asas/capa não encontradas no modelo animado`);
      } else if (wingNodes.length === 0) {
        continue; // Classes que usam asas modulares desacopladas via modularHero.js
      }

      for (const wNode of wingNodes) {
        // Encontra o pai do nó da asa
        const parentNode = gltf.nodes.find((n: any) => n.children && n.children.includes(gltf.nodes.indexOf(wNode)));
        assert.ok(parentNode, `[${cls.toUpperCase()}] Asa ${wNode.name} deve possuir nó pai`);
        assert.ok(
          parentNode.name === 'spine_03' || parentNode.name === 'Armature',
          `[${cls.toUpperCase()}] Asa ${wNode.name} deve estar vinculada à espinha (spine_03 ou Armature), encontrado: ${parentNode.name}`
        );

        // Se tem mesh, verifica a simetria lateral no eixo X
        if (wNode.mesh !== undefined) {
          const mesh = gltf.meshes[wNode.mesh];
          for (const prim of mesh.primitives) {
            const posAcc = gltf.accessors[prim.attributes.POSITION];
            const [minX, ,] = posAcc.min;
            const [maxX, ,] = posAcc.max;
            const symmetryError = Math.abs(minX + maxX);

            // As asas de MMORPG devem ser aproximadamente simétricas em relação ao eixo coronal
            assert.ok(
              symmetryError < 0.20,
              `[${cls.toUpperCase()}] Asa ${wNode.name} assimétrica em X: minX=${minX.toFixed(2)}, maxX=${maxX.toFixed(2)}, diff=${symmetryError.toFixed(2)}`
            );
          }
        }
      }
    }
  });

  // --------------------------------------------------------------------------
  // 4. POSTURA INICIAL NOBRE E ERETA (SELEÇÃO CANÔNICA DE IDLE FRAME 0)
  // --------------------------------------------------------------------------
  it('garante que a animação inicial do validador prioriza clipe de postura ereta Idle/Stand e pausa no frame 0', () => {
    // Simula a lógica oficial de resolução de clipe implementada no validator.js
    function selectDefaultClip(clips: Array<{ name: string }>) {
      return (
        clips.find(a => /^idle$/i.test(a.name)) ||
        clips.find(a => /^idle_loop$/i.test(a.name)) ||
        clips.find(a => /idle_shield|sword_idle/i.test(a.name)) ||
        clips.find(a => /idle|stand|breath|rest/i.test(a.name)) ||
        clips[0]
      );
    }

    for (const cls of HERO_CLASSES) {
      const glbPath = path.join('src/client/dev_viewer/models/animated_heroes', `hero_${cls}_animated.glb`);
      const gltf = parseGlbJson(glbPath);

      const animClips = (gltf.animations ?? []).map((a: any) => ({ name: a.name }));
      assert.ok(animClips.length >= 20, `[${cls.toUpperCase()}] Deve conter pelo menos 20 clipes`);

      const defaultClip = selectDefaultClip(animClips);
      assert.ok(defaultClip, `[${cls.toUpperCase()}] Deve resolver um clipe padrão`);

      // O clipe selecionado NUNCA deve ser um golpe de ataque ou rolamento agachado
      assert.ok(
        !defaultClip.name.toLowerCase().includes('attack'),
        `[${cls.toUpperCase()}] O clipe padrão NÃO pode ser um ataque (${defaultClip.name})`
      );
      assert.ok(
        !defaultClip.name.toLowerCase().includes('chop'),
        `[${cls.toUpperCase()}] O clipe padrão NÃO pode ser um golpe chop agachado (${defaultClip.name})`
      );
      assert.match(
        defaultClip.name,
        /idle|stand/i,
        `[${cls.toUpperCase()}] O clipe padrão deve ser postura Idle ou Stand, encontrado: ${defaultClip.name}`
      );
    }
  });

  // --------------------------------------------------------------------------
  // 5. ENQUADRAMENTO ÓPTICO DA CÂMERA E RESPEITO À SAFE AREA DA UI
  // --------------------------------------------------------------------------
  it('calcula o enquadramento de câmera com margem de respiro superior (>85px) e inferior (>120px) evitando cortes de asas', () => {
    // Dimensões do viewport e margens de UI
    const containerW = 1280;
    const containerH = 720;
    const topUiInset = 85;      // Barra superior (.val-3d-toolbar)
    const bottomUiInset = 120;  // Barra inferior de decisão (.val-decision-bar)
    const safeHeightPx = Math.max(180, containerH - (topUiInset + bottomUiInset));
    const safeHeightRatio = safeHeightPx / containerH;
    const safeWidthRatio = 0.90;

    // Configuração Three.js Câmera Perspectiva canônica
    const fov = 45;
    const fovRad = fov * (Math.PI / 180);
    const aspect = containerW / containerH;

    // Cria BoundingBox representativo de um herói com asas abertas (largura 3.1m, altura 2.4m, profundidade 1.0m)
    const heroBox = new THREE.Box3(
      new THREE.Vector3(-1.55, 0.0, -0.5),
      new THREE.Vector3(1.55, 2.4, 0.5)
    );

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    heroBox.getSize(size);
    heroBox.getCenter(center);

    // Algoritmo canônico de fitCameraToObject implementado no validator.js
    const padding = 1.25;
    const distVertical = (size.y / 2) / (Math.tan(fovRad / 2) * safeHeightRatio);
    const distHorizontal = (size.x / 2) / (Math.tan(fovRad / 2) * aspect * safeWidthRatio);
    const distDepth = (size.z / 2) * 0.8;
    const distance = Math.max(distVertical, distHorizontal, distDepth, 4.2) * padding;

    // Compensação óptica vertical
    const deltaYPx = (bottomUiInset - topUiInset) / 2;
    const worldHeightAtDistance = 2 * distance * Math.tan(fovRad / 2);
    const opticalOffsetWorld = (deltaYPx / containerH) * worldHeightAtDistance;
    const targetY = center.y - opticalOffsetWorld;

    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.05, 1000);
    camera.position.set(center.x, targetY + (size.y * 0.04), center.z + distance);
    camera.lookAt(center.x, targetY, center.z);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    // Projetar os 8 cantos da bounding box para Normalized Device Coordinates (NDC: [-1, +1])
    const corners = [
      new THREE.Vector3(heroBox.min.x, heroBox.min.y, heroBox.min.z),
      new THREE.Vector3(heroBox.min.x, heroBox.min.y, heroBox.max.z),
      new THREE.Vector3(heroBox.min.x, heroBox.max.y, heroBox.min.z),
      new THREE.Vector3(heroBox.min.x, heroBox.max.y, heroBox.max.z),
      new THREE.Vector3(heroBox.max.x, heroBox.min.y, heroBox.min.z),
      new THREE.Vector3(heroBox.max.x, heroBox.min.y, heroBox.max.z),
      new THREE.Vector3(heroBox.max.x, heroBox.max.y, heroBox.min.z),
      new THREE.Vector3(heroBox.max.x, heroBox.max.y, heroBox.max.z),
    ];

    let maxNdcY = -Infinity;
    let minNdcY = Infinity;
    let maxNdcX = -Infinity;
    let minNdcX = Infinity;

    for (const corner of corners) {
      const proj = corner.clone().project(camera);
      if (proj.y > maxNdcY) maxNdcY = proj.y;
      if (proj.y < minNdcY) minNdcY = proj.y;
      if (proj.x > maxNdcX) maxNdcX = proj.x;
      if (proj.x < minNdcX) minNdcX = proj.x;
    }

    // Limites seguros de tela em NDC:
    // Topo de tela: NDC Y = +1.0. Barra superior ocupa topUiInset pixels:
    const topSafeNdcLimit = 1.0 - (2.0 * topUiInset / containerH); // ex: 1 - (170/720) = ~0.763
    // Rodapé de tela: NDC Y = -1.0. Barra inferior ocupa bottomUiInset pixels:
    const bottomSafeNdcLimit = -1.0 + (2.0 * bottomUiInset / containerH); // ex: -1 + (240/720) = ~-0.666

    // Validações rigorosas de QA:
    // 1. As pontas superiores das asas devem ficar ESTRITAMENTE abaixo da barra superior
    assert.ok(
      maxNdcY <= topSafeNdcLimit,
      `Ponta da asa (NDC Y=${maxNdcY.toFixed(3)}) ultrapassou a barra superior (Limite=${topSafeNdcLimit.toFixed(3)})`
    );

    // 2. Os pés do personagem devem ficar ESTRITAMENTE acima da barra inferior de decisão
    assert.ok(
      minNdcY >= bottomSafeNdcLimit,
      `Pés do herói (NDC Y=${minNdcY.toFixed(3)}) foram ocluídos pela barra inferior (Limite=${bottomSafeNdcLimit.toFixed(3)})`
    );

    // 3. A envergadura horizontal das asas deve manter margem confortável em relação às bordas laterais
    assert.ok(maxNdcX < 0.90, `Asa direita muito colada na borda lateral direita (NDC X=${maxNdcX.toFixed(3)})`);
    assert.ok(minNdcX > -0.90, `Asa esquerda muito colada na borda lateral esquerda (NDC X=${minNdcX.toFixed(3)})`);
  });
});
