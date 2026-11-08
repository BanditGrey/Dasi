/**
 * Injeção de texturas PBR em GLBs já exportados.
 *
 * O GLTFExporter do three só codifica imagens com canvas DOM, indisponível no
 * Node. Este módulo faz a cirurgia no contêiner GLB: anexa os PNGs ao chunk
 * BIN, declara `bufferViews`, `images`, `samplers` e `textures` e liga cada
 * material às três texturas. Nenhuma geometria, animação ou material existente
 * é alterada — só são acrescentados índices de textura.
 *
 * Também resolve o único caso de malha sem UV do bestiário (as asas do Dragão
 * Dourado, construídas à mão) projetando UVs planares antes da exportação.
 */

const GLB_MAGIC = 0x46546c67; // 'glTF'
const CHUNK_JSON = 0x4e4f534a; // 'JSON'
const CHUNK_BIN = 0x004e4942;  // 'BIN\0'
const FILTER_LINEAR = 9729;
const FILTER_LINEAR_MIPMAP_LINEAR = 9937;
const WRAP_REPEAT = 10497;

export function parseGlb(buffer) {
  const view = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (view.readUInt32LE(0) !== GLB_MAGIC) throw new Error('parseGlb: arquivo não é um GLB (magic ausente)');
  const version = view.readUInt32LE(4);
  if (version !== 2) throw new Error(`parseGlb: versão ${version} não suportada`);
  const totalLength = view.readUInt32LE(8);
  if (totalLength !== view.length) throw new Error(`parseGlb: comprimento ${totalLength} ≠ arquivo ${view.length}`);

  const jsonLength = view.readUInt32LE(12);
  if (view.readUInt32LE(16) !== CHUNK_JSON) throw new Error('parseGlb: primeiro chunk não é JSON');
  const json = JSON.parse(view.subarray(20, 20 + jsonLength).toString('utf8'));

  const binOffset = 20 + jsonLength;
  const binLength = view.readUInt32LE(binOffset);
  if (view.readUInt32LE(binOffset + 4) !== CHUNK_BIN) throw new Error('parseGlb: segundo chunk não é BIN');
  const bin = Buffer.from(view.subarray(binOffset + 8, binOffset + 8 + binLength));

  return { json, bin, version };
}

function alignTo4(value) {
  return (value + 3) & ~3;
}

export function serializeGlb(json, bin) {
  const jsonBytes = Buffer.from(JSON.stringify(json), 'utf8');
  const jsonPadded = Buffer.alloc(alignTo4(jsonBytes.length), 0x20); // espaços, como o three faz
  jsonBytes.copy(jsonPadded);
  const binPadded = Buffer.alloc(alignTo4(bin.length), 0x00);
  bin.copy(binPadded);

  const total = 12 + 8 + jsonPadded.length + 8 + binPadded.length;
  const out = Buffer.alloc(total);
  out.writeUInt32LE(GLB_MAGIC, 0);
  out.writeUInt32LE(2, 4);
  out.writeUInt32LE(total, 8);
  out.writeUInt32LE(jsonPadded.length, 12);
  out.writeUInt32LE(CHUNK_JSON, 16);
  jsonPadded.copy(out, 20);
  const binHeader = 20 + jsonPadded.length;
  out.writeUInt32LE(binPadded.length, binHeader);
  out.writeUInt32LE(CHUNK_BIN, binHeader + 4);
  binPadded.copy(out, binHeader + 8);
  return out;
}

/**
 * Anexa um conjunto de texturas PBR e liga todos os materiais a ele.
 * @param {Buffer} glb GLB original
 * @param {{ creatureId: string, size: number, baseColor: Buffer, metallicRoughness: Buffer, normal: Buffer, normalScale?: number }} textureSet
 * @returns {Buffer} novo GLB com imagens embutidas
 */
export function injectBestiaryTextures(glb, textureSet) {
  const { json, bin } = parseGlb(glb);
  if (!Array.isArray(json.materials) || json.materials.length === 0) {
    throw new Error('injectBestiaryTextures: GLB sem materiais');
  }

  const pending = [
    { name: `${textureSet.creatureId}_baseColor`, bytes: textureSet.baseColor },
    { name: `${textureSet.creatureId}_metallicRoughness`, bytes: textureSet.metallicRoughness },
    { name: `${textureSet.creatureId}_normal`, bytes: textureSet.normal },
  ];

  // Anexa cada PNG ao chunk BIN começando em offset alinhado a 4 bytes e
  // declara a bufferView correspondente com o offset real.
  const binViews = json.bufferViews ?? [];
  const appended = [];
  let cursor = bin.length;
  const bufferViewIndices = pending.map((entry) => {
    const aligned = alignTo4(cursor);
    if (aligned > cursor) appended.push(Buffer.alloc(aligned - cursor, 0));
    appended.push(entry.bytes);
    const index = binViews.push({ buffer: 0, byteOffset: aligned, byteLength: entry.bytes.length }) - 1;
    cursor = aligned + entry.bytes.length;
    return index;
  });
  json.bufferViews = binViews;
  const nextBin = Buffer.concat([bin, ...appended]);

  json.images = json.images ?? [];
  json.samplers = json.samplers ?? [];
  json.textures = json.textures ?? [];

  const samplerIndex = json.samplers.push({
    magFilter: FILTER_LINEAR,
    minFilter: FILTER_LINEAR_MIPMAP_LINEAR,
    wrapS: WRAP_REPEAT,
    wrapT: WRAP_REPEAT,
    name: `${textureSet.creatureId}_pbr_sampler`,
  }) - 1;

  const textureIndices = pending.map((entry, order) => {
    const imageIndex = json.images.push({
      mimeType: 'image/png',
      bufferView: bufferViewIndices[order],
      name: entry.name,
    }) - 1;
    return json.textures.push({ sampler: samplerIndex, source: imageIndex, name: entry.name }) - 1;
  });

  const [baseColorTexture, metallicRoughnessTexture, normalTexture] = textureIndices;
  for (const material of json.materials) {
    material.pbrMetallicRoughness = material.pbrMetallicRoughness ?? {};
    material.pbrMetallicRoughness.baseColorTexture = { index: baseColorTexture, texCoord: 0 };
    material.pbrMetallicRoughness.metallicRoughnessTexture = { index: metallicRoughnessTexture, texCoord: 0 };
    material.normalTexture = { index: normalTexture, texCoord: 0, scale: textureSet.normalScale ?? 1 };
  }

  // Convenção do próprio GLTFExporter: o buffer é paddeado a 4 bytes e o
  // `byteLength` declarado inclui esse padding (assim ele iguala o chunk BIN).
  const paddedBin = Buffer.alloc(alignTo4(nextBin.length), 0);
  nextBin.copy(paddedBin);
  json.buffers[0].byteLength = paddedBin.length;

  // Metadados honestos na raiz do asset.
  const rootName = `BESTIARY_${textureSet.creatureId}`;
  const rootNode = (json.nodes ?? []).find((node) => node.name === rootName);
  if (!rootNode) throw new Error(`injectBestiaryTextures: nó raiz ${rootName} ausente`);
  rootNode.extras = rootNode.extras ?? {};
  Object.assign(rootNode.extras, {
    pbrTexturesIncluded: true,
    pbrTextureMaps: ['baseColor', 'metallicRoughness', 'normal'],
    pbrTextureSize: textureSet.size,
    pbrTextureSource: 'procedural',
  });

  return serializeGlb(json, paddedBin);
}

/**
 * Garante UV em todas as malhas: projeta planarmente as que não têm
 * (no bestiário, só as asas do Dragão Dourado), preservando as demais.
 * @returns {string[]} nomes das malhas que receberam UV
 */
export function ensureMeshUvs(THREE, root, tileWorldSize = 0.6) {
  const patched = [];
  root.traverse((object) => {
    if (!object.isMesh) return;
    const geometry = object.geometry;
    if (!geometry || geometry.attributes.uv) return;
    const position = geometry.attributes.position;
    if (!position) return;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    const size = new THREE.Vector3();
    box.getSize(size);
    // Descarta o eixo de menor extensão: é a normal do plano de projeção.
    const axes = [
      { u: 0, v: 1, normal: 2, extent: size.z },
      { u: 0, v: 2, normal: 1, extent: size.y },
      { u: 1, v: 2, normal: 0, extent: size.x },
    ].sort((a, b) => a.extent - b.extent);
    const plane = axes[0];
    const spans = [size.getComponent(plane.u), size.getComponent(plane.v)];
    const origin = [box.min.getComponent(plane.u), box.min.getComponent(plane.v)];
    const repeats = spans.map((span) => Math.max(1, Math.min(8, Math.round(span / tileWorldSize) || 1)));
    const uv = new Float32Array(position.count * 2);
    for (let index = 0; index < position.count; index++) {
      const pu = position.getComponent(index, plane.u);
      const pv = position.getComponent(index, plane.v);
      uv[index * 2] = ((pu - origin[0]) / (spans[0] || 1)) * repeats[0];
      uv[index * 2 + 1] = ((pv - origin[1]) / (spans[1] || 1)) * repeats[1];
    }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    patched.push(object.name || '(sem nome)');
  });
  return patched;
}
