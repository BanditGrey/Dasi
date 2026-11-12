/**
 * Cobertura das texturas PBR procedurais do bestiário articulado.
 *
 * As texturas são geradas no Node (pixels RGBA → PNG próprio) e injetadas no
 * contêiner GLB depois da exportação, porque o GLTFExporter só codifica imagens
 * com canvas DOM. Este teste valida três camadas:
 *   1. o contêiner GLB (chunks, alinhamento, índices e ligações dos materiais);
 *   2. o PNG em si (assinatura, CRC, IHDR, filtros, inflate pelo zlib do Node);
 *   3. o conteúdo dos pixels (faixas PBR, alpha, normal tangente-espaço, emenda).
 *
 * Também garante reprodutibilidade: regenerar produz os mesmos bytes.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// @ts-ignore - módulos ESM JavaScript de ferramentas.
import { parseGlb, serializeGlb } from '../../../../tools/glb_texture_injector.mjs';
// @ts-ignore
import {
  BESTIARY_TEXTURE_PROFILES,
  BESTIARY_TEXTURE_SIZE,
  createBestiaryHeightField,
  createBestiaryTextureSet,
  decodePNG,
} from '../../../../tools/procedural_textures.mjs';

const CREATURES = [
  { id: 'ICE_QUEEN', filename: 'ice_queen', normalScale: 0.85 },
  { id: 'GORGON', filename: 'gorgon', normalScale: 1.15 },
  { id: 'HYDRA', filename: 'hydra', normalScale: 1.1 },
  { id: 'BALROG', filename: 'balrog', normalScale: 1.5 },
  { id: 'ZAIKAN', filename: 'zaikan', normalScale: 1.35 },
  { id: 'KUNDUN', filename: 'kundun', normalScale: 1.2 },
  { id: 'GOLDEN_TITAN', filename: 'golden_titan', normalScale: 0.95 },
  { id: 'GOLDEN_BUDGE_DRAGON', filename: 'golden_budge_dragon', normalScale: 1.05 },
  { id: 'GOLDEN_SOLDIER', filename: 'golden_soldier', normalScale: 1.25 },
  { id: 'GOLDEN_LIZARD_KING', filename: 'golden_lizard_king', normalScale: 1.2 },
  { id: 'GOLDEN_TANTALOS', filename: 'golden_tantalos', normalScale: 1.4 },
  { id: 'GOLDEN_DRAGON', filename: 'golden_dragon', normalScale: 1.3 },
] as const;

const MAP_NAMES = ['baseColor', 'metallicRoughness', 'normal'] as const;

// Ver comentário equivalente em bestiary_animated_coverage.test.ts.
(globalThis as any).self ??= globalThis;

function readAnimatedGlb(filename: string) {
  const path = `src/client/dev_viewer/models/bestiary_animated/${filename}.glb`;
  assert.ok(existsSync(path), `${filename}: arquivo ausente`);
  return parseGlb(readFileSync(path));
}

function imageBuffers(json: any, bin: Buffer) {
  return (json.images as any[]).map((image: any) => {
    const view = json.bufferViews[image.bufferView];
    return bin.subarray(view.byteOffset, view.byteOffset + view.byteLength);
  });
}

function channelStats(rgba: Uint8Array, channel: number) {
  let min = 255;
  let max = 0;
  let sum = 0;
  for (let index = channel; index < rgba.length; index += 4) {
    const value = rgba[index];
    if (value < min) min = value;
    if (value > max) max = value;
    sum += value;
  }
  return { min, max, average: sum / (rgba.length / 4) };
}

describe('Texturas PBR procedurais do bestiário', () => {
  it('define um perfil para cada criatura, com padrões conhecidos e faixas válidas', () => {
    assert.deepStrictEqual(Object.keys(BESTIARY_TEXTURE_PROFILES).sort(), CREATURES.map(({ id }) => id).sort());
    assert.strictEqual(BESTIARY_TEXTURE_SIZE, 256);

    for (const { id, normalScale } of CREATURES) {
      const profile = BESTIARY_TEXTURE_PROFILES[id];
      assert.ok(profile.patterns.length > 0, `${id}: sem camadas de padrão`);
      assert.ok(Math.abs(profile.patterns.reduce((sum: number, layer: any) => sum + layer.weight, 0) - 1) < 1e-9, `${id}: pesos não somam 1`);
      for (const layer of profile.patterns) {
        assert.ok(['scales', 'plates', 'cracks', 'leather', 'facets', 'rock'].includes(layer.name), `${id}: padrão ${layer.name} inexistente`);
        assert.ok(layer.frequency > 0, `${id}: frequência inválida`);
      }
      assert.ok(profile.contrast > 0 && profile.contrast < 1, `${id}: contraste fora de 0..1`);
      assert.strictEqual(profile.normalScale, normalScale, `${id}: normalScale divergente`);
      for (const range of [profile.roughnessRange, profile.metalnessRange]) {
        assert.ok(range[0] > 0 && range[0] <= range[1] && range[1] <= 1.1, `${id}: faixa multiplicativa inválida`);
      }
      assert.strictEqual(profile.tint.length, 3, `${id}: tint precisa ter 3 canais`);
    }

    assert.throws(() => createBestiaryTextureSet('NAO_EXISTE'), /sem perfil de textura/);
  });

  it('escreve um contêiner GLB válido: chunks alinhados e byteLength coerente', () => {
    for (const { id, filename } of CREATURES) {
      const bytes = readFileSync(`src/client/dev_viewer/models/bestiary_animated/${filename}.glb`);
      const { json, bin } = readAnimatedGlb(filename);

      assert.strictEqual(bytes.readUInt32LE(8), bytes.length, `${id}: comprimento total do GLB`);
      assert.strictEqual(bytes.length % 4, 0, `${id}: arquivo não alinhado a 4 bytes`);
      assert.strictEqual(json.buffers[0].byteLength, bin.length, `${id}: buffer.byteLength ≠ chunk BIN`);
      assert.deepStrictEqual(serializeGlb(json, bin), bytes, `${id}: reescrita do contêiner não é idêntica`);
      assert.deepStrictEqual(readFileSync(`prototypes/3d_bestiary_animated/${filename}.glb`), bytes, `${id}: cópias divergentes`);
    }
  });

  it('embute três imagens PNG por criatura e liga todos os materiais a elas', () => {
    for (const { id, filename, normalScale } of CREATURES) {
      const { json, bin } = readAnimatedGlb(filename);

      assert.strictEqual(json.images.length, 3, `${id}: quantidade de imagens`);
      assert.strictEqual(json.textures.length, 3, `${id}: quantidade de texturas`);
      assert.strictEqual(json.samplers.length, 1, `${id}: um sampler compartilhado`);
      assert.deepStrictEqual(json.images.map((image: any) => image.mimeType), ['image/png', 'image/png', 'image/png'], `${id}: mimeType`);
      assert.deepStrictEqual(json.images.map((image: any) => image.name), MAP_NAMES.map((map) => `${id}_${map}`), `${id}: nomes das imagens`);

      const sampler = json.samplers[0];
      assert.strictEqual(sampler.wrapS, 10497, `${id}: wrapS deve ser REPEAT`);
      assert.strictEqual(sampler.wrapT, 10497, `${id}: wrapT deve ser REPEAT`);
      assert.strictEqual(sampler.minFilter, 9937, `${id}: minFilter deve gerar mipmaps`);
      for (const texture of json.textures) {
        assert.strictEqual(texture.sampler, 0, `${id}: textura sem sampler`);
        assert.ok(texture.source >= 0 && texture.source < 3, `${id}: source inválido`);
      }

      // Offsets das imagens alinhados a 4 bytes, como exige o glTF.
      for (const image of json.images) {
        const view = json.bufferViews[image.bufferView];
        assert.strictEqual(view.byteOffset % 4, 0, `${id}: bufferView de imagem desalinhada`);
        assert.ok(view.byteOffset + view.byteLength <= bin.length, `${id}: imagem fora do chunk BIN`);
        assert.strictEqual(bin.subarray(view.byteOffset, view.byteOffset + 8)[0], 0x89, `${id}: PNG sem assinatura`);
      }

      for (const [index, material] of json.materials.entries()) {
        const pbr = material.pbrMetallicRoughness;
        for (const slot of [pbr.baseColorTexture, pbr.metallicRoughnessTexture, material.normalTexture]) {
          assert.ok(slot && slot.index >= 0 && slot.index < 3, `${id}: material ${index} sem textura válida`);
          assert.strictEqual(slot.texCoord, 0, `${id}: material ${index} com canal UV inesperado`);
        }
        assert.strictEqual(material.normalTexture.scale, normalScale, `${id}: material ${index} com normalScale divergente`);
        assert.ok(pbr.baseColorFactor && pbr.baseColorFactor.length === 4, `${id}: material ${index} perdeu a cor base`);
      }

      // Nenhuma malha ficou sem UV: sem TEXCOORD_0 a textura não aparece.
      for (const mesh of json.meshes) {
        for (const primitive of mesh.primitives) {
          assert.ok(primitive.attributes.TEXCOORD_0 !== undefined, `${id}/${mesh.name}: primitive sem TEXCOORD_0`);
          assert.ok(primitive.attributes.POSITION !== undefined && primitive.attributes.NORMAL !== undefined, `${id}/${mesh.name}: atributos essenciais`);
        }
      }
    }
  });

  it('produz PNGs válidos com pixels PBR dentro das faixas do perfil', () => {
    for (const { id, filename } of CREATURES) {
      const { json, bin } = readAnimatedGlb(filename);
      const profile = BESTIARY_TEXTURE_PROFILES[id];
      const [baseColor, metallicRoughness, normal] = imageBuffers(json, bin).map((png: Buffer) => decodePNG(png));

      for (const image of [baseColor, metallicRoughness, normal]) {
        assert.strictEqual(image.width, BESTIARY_TEXTURE_SIZE, `${id}: largura`);
        assert.strictEqual(image.height, BESTIARY_TEXTURE_SIZE, `${id}: altura`);
        assert.strictEqual(image.rgba.length, BESTIARY_TEXTURE_SIZE * BESTIARY_TEXTURE_SIZE * 4, `${id}: contagem de pixels`);
        for (let index = 3; index < image.rgba.length; index += 4) {
          assert.strictEqual(image.rgba[index], 255, `${id}: alpha deve ser opaco`);
        }
      }

      // baseColor é modulação multiplicativa: nunca pode zerar a cor do material.
      const base = channelStats(baseColor.rgba, 0);
      assert.ok(base.min > 100, `${id}: detalhe de cor escurece demais (min ${base.min})`);
      assert.ok(base.max - base.min > 12, `${id}: detalhe de cor sem variação`);
      assert.ok(channelStats(baseColor.rgba, 1).min > 100 && channelStats(baseColor.rgba, 2).min > 100, `${id}: canais G/B do baseColor`);

      // metallicRoughness: R livre, G = roughness, B = metalness (glTF).
      const roughness = channelStats(metallicRoughness.rgba, 1);
      const metalness = channelStats(metallicRoughness.rgba, 2);
      assert.strictEqual(channelStats(metallicRoughness.rgba, 0).max, 0, `${id}: canal R do metallicRoughness deve ser 0`);
      assert.ok(roughness.min >= Math.floor(profile.roughnessRange[0] * 255) - 2, `${id}: roughness abaixo do perfil`);
      assert.ok(roughness.max <= Math.ceil(profile.roughnessRange[1] * 255) + 2, `${id}: roughness acima do perfil`);
      assert.ok(metalness.min >= Math.floor(profile.metalnessRange[0] * 255) - 2, `${id}: metalness abaixo do perfil`);
      assert.ok(metalness.max <= Math.ceil(profile.metalnessRange[1] * 255) + 2, `${id}: metalness acima do perfil`);
      assert.ok(roughness.max - roughness.min > 8 && metalness.max - metalness.min > 4, `${id}: metallicRoughness sem variação`);

      // normal tangente-espaço: vetores unitários com Z dominante positivo.
      const normalZ = channelStats(normal.rgba, 2);
      assert.ok(normalZ.average > 190, `${id}: normal map sem dominância de +Z (média ${normalZ.average})`);
      assert.strictEqual(normalZ.min > 0, true, `${id}: normal invertida em algum pixel`);
      let worstDeviation = 0;
      for (let index = 0; index < normal.rgba.length; index += 4) {
        const nx = (normal.rgba[index] / 255) * 2 - 1;
        const ny = (normal.rgba[index + 1] / 255) * 2 - 1;
        const nz = (normal.rgba[index + 2] / 255) * 2 - 1;
        worstDeviation = Math.max(worstDeviation, Math.abs(Math.hypot(nx, ny, nz) - 1));
      }
      assert.ok(worstDeviation < 0.05, `${id}: normais não unitárias (desvio ${worstDeviation})`);
    }
  });

  it('gera mapas sem emenda e reproduzíveis byte a byte', () => {
    for (const { id, filename } of CREATURES) {
      const { json, bin } = readAnimatedGlb(filename);
      const regenerated = createBestiaryTextureSet(id);
      const embedded = imageBuffers(json, bin);
      for (const [index, map] of MAP_NAMES.entries()) {
        assert.deepStrictEqual(
          Buffer.from(regenerated[map] as unknown as ArrayBuffer),
          Buffer.from(embedded[index]),
          `${id}: textura ${map} não reproduzível`
        );
      }

      // Sem emenda: a diferença entre a última e a primeira coluna (e linha)
      // deve ser comparável à diferença entre colunas vizinhas internas.
      const field = createBestiaryHeightField(id);
      const size = BESTIARY_TEXTURE_SIZE;
      let seam = 0;
      let inner = 0;
      for (let y = 0; y < size; y++) {
        seam += Math.abs(field[y * size + size - 1] - field[y * size]);
        for (let x = 1; x < size - 1; x++) inner += Math.abs(field[y * size + x] - field[y * size + x - 1]);
        seam += Math.abs(field[(size - 1) * size + y] - field[y]);
        for (let x = 1; x < size - 1; x++) inner += Math.abs(field[x * size + y] - field[(x - 1) * size + y]);
      }
      const seamAverage = seam / (size * 2);
      const innerAverage = inner / ((size - 2) * size * 2);
      assert.ok(seamAverage <= innerAverage * 2, `${id}: emenda visível (${seamAverage} vs ${innerAverage})`);
    }
  });

  it('mantém os protótipos estáticos sem texturas e preserva a geometria articulada', async () => {
    for (const { id, filename } of CREATURES) {
      const staticGlb = parseGlb(readFileSync(`src/client/dev_viewer/models/bestiary/${filename}.glb`));
      assert.ok(!staticGlb.json.images || staticGlb.json.images.length === 0, `${id}: GLB estático passou a ter imagens`);
      assert.ok(!staticGlb.json.textures || staticGlb.json.textures.length === 0, `${id}: GLB estático passou a ter texturas`);

      const animated = readAnimatedGlb(filename);
      assert.strictEqual(animated.json.animations.length, 5, `${id}: clips perdidos após texturização`);
      assert.strictEqual(animated.json.materials.length, staticGlb.json.materials.length, `${id}: contagem de materiais mudou`);
      assert.strictEqual(animated.json.meshes.length, staticGlb.json.meshes.length, `${id}: contagem de malhas mudou`);

      // Os metadados de rig e de textura convivem na raiz do asset.
      const buffer = readFileSync(`src/client/dev_viewer/models/bestiary_animated/${filename}.glb`);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
      const originalError = console.error;
      console.error = () => {};
      let gltf: any;
      try {
        gltf = await new GLTFLoader().parseAsync(arrayBuffer, '');
      } finally {
        console.error = originalError;
      }
      const root = gltf.scene.getObjectByName(`BESTIARY_${id}`) as THREE.Object3D & { userData: Record<string, any> };
      assert.ok(root, `${id}: raiz ausente`);
      assert.strictEqual(root.userData.pbrTexturesIncluded, true);
      assert.strictEqual(root.userData.pbrTextureSize, BESTIARY_TEXTURE_SIZE);
      assert.deepStrictEqual(root.userData.pbrTextureMaps, [...MAP_NAMES]);
      assert.strictEqual(root.userData.pbrTextureSource, 'procedural');
      assert.strictEqual(root.userData.animationClipsIncluded, true);
      assert.strictEqual(root.userData.skeletalRigIncluded, false);
      assert.strictEqual(root.userData.collisionsIncluded, false);
      assert.ok(root.userData.rigJointCount >= 2, `${id}: pivôs perdidos`);
    }
  });
});
