/** Inventário estrutural GLB sem decodificar imagens nem inferir qualidade visual. */
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function inspectHeroGlb(buffer) {
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2 || buffer.readUInt32LE(8) !== buffer.length) throw new Error('Cabeçalho GLB inválido');
  const jsonLength = buffer.readUInt32LE(12);
  if (buffer.readUInt32LE(16) !== 0x4e4f534a || 20 + jsonLength > buffer.length) throw new Error('Chunk JSON inválido');
  const data = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'));
  let vertices = 0, triangles = 0, primitives = 0;
  for (const mesh of data.meshes ?? []) for (const primitive of mesh.primitives ?? []) {
    const position = data.accessors?.[primitive.attributes?.POSITION];
    if (!position || !Number.isInteger(position.count)) throw new Error('Primitiva sem posições válidas');
    const indices = primitive.indices === undefined ? position.count : data.accessors?.[primitive.indices]?.count;
    if (!Number.isInteger(indices)) throw new Error('Índices inválidos');
    vertices += position.count;
    if ((primitive.mode ?? 4) === 4) triangles += Math.floor(indices / 3);
    primitives++;
  }
  return { meshes: data.meshes?.length ?? 0, primitives, vertices, triangles, materials: data.materials?.length ?? 0,
    images: data.images?.length ?? 0, skins: data.skins?.length ?? 0, animations: (data.animations ?? []).map(a => a.name ?? ''), nodes: data.nodes?.length ?? 0 };
}

const heroes = ['dark_knight', 'dark_wizard', 'fairy_elf', 'magic_gladiator', 'dark_lord'];
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const id of heroes) {
    const path = `src/client/dev_viewer/models/hero_${id}.glb`;
    const buffer = await readFile(path);
    console.log(JSON.stringify({ id, bytes: buffer.length, ...inspectHeroGlb(buffer) }));
  }
}
