import { buildEditedScenarioSnapshot } from './exportEditedScenario.js';
import { TILE_SIZE, makeTileDocument, tileDocumentLayers, validateTileDocument } from './tileFloor.js';

const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let i = 0; i < 8; i++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** ZIP simples sem compressão, com nomes ASCII e CRC32 (sem dependências externas). */
export function createStoredZip(entries) {
  if (entries.length > 65535) throw new Error('Arquivos demais para ZIP clássico');
  const encoder = new TextEncoder();
  const parts = [], central = [];
  let offset = 0, centralSize = 0;
  const seen = new Set();
  for (const entry of entries) {
    if (!/^[A-Za-z0-9_.-]+$/.test(entry.name) || seen.has(entry.name)) throw new Error('Nome de arquivo inválido ou duplicado');
    seen.add(entry.name);
    const name = encoder.encode(entry.name);
    const bytes = entry.bytes instanceof Uint8Array ? entry.bytes : new Uint8Array(entry.bytes);
    if (bytes.byteLength > 0xffffffff || offset + bytes.byteLength + 30 + name.length > 0xffffffff) throw new Error('Lote excede limite ZIP clássico');
    const crc = crc32(bytes);
    const local = new Uint8Array(30 + name.length), l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(12, 33, true);
    l.setUint32(14, crc, true); l.setUint32(18, bytes.byteLength, true); l.setUint32(22, bytes.byteLength, true);
    l.setUint16(26, name.length, true); local.set(name, 30);
    const record = new Uint8Array(46 + name.length), c = new DataView(record.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(14, 33, true);
    c.setUint32(16, crc, true); c.setUint32(20, bytes.byteLength, true); c.setUint32(24, bytes.byteLength, true);
    c.setUint16(28, name.length, true); c.setUint32(42, offset, true); record.set(name, 46);
    parts.push(local, bytes); central.push(record);
    offset += local.length + bytes.byteLength; centralSize += record.length;
  }
  if (offset + centralSize + 22 > 0xffffffff) throw new Error('Lote excede limite ZIP clássico');
  const end = new Uint8Array(22), e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, entries.length, true); e.setUint16(10, entries.length, true);
  e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

/** Gera todos ou falha sem entregar ZIP parcial. As edições locais são capturadas no início. */
export async function exportScenarioBatch({ THREE, scenarioIds, storage, createEnvironment, Exporter, onProgress = (_progress) => {} }) {
  if (!storage || typeof storage.getItem !== 'function') throw new Error('Armazenamento local indisponível');
  if (!Array.isArray(scenarioIds) || !scenarioIds.length || new Set(scenarioIds).size !== scenarioIds.length || scenarioIds.some(id => !/^[A-Z]+_\d{2}$/.test(id))) throw new Error('Lista de cenários inválida');
  // A captura é síncrona para que o usuário não misture versões ao editar durante o lote.
  const saved = new Map(scenarioIds.map(id => [id, storage.getItem(`dasi:tiles:v1:${id}`)]));
  const entries = [], manifest = { version: 1, kind: 'dasi-visual-glb-batch', scenarios: [], notes: 'Visual estático; sem colisões ou efeitos dinâmicos.' };
  for (const [i, id] of scenarioIds.entries()) {
    onProgress({ id, completed: i, total: scenarioIds.length });
    const env = createEnvironment(id, THREE);
    if (!env.tileFloor) throw new Error(`${id}: piso editável indisponível`);
    const raw = saved.get(id);
    env.tileFloor.clearEdits();
    if (raw !== null) {
      let data;
      try { data = JSON.parse(raw); } catch { throw new Error(`${id}: edições locais inválidas`); }
      if (data?.version === 1 && data.tileSize === undefined) data.tileSize = TILE_SIZE, data.cols = env.tileFloor.cols, data.rows = env.tileFloor.rows;
      if (!validateTileDocument(data, id, env.tileFloor)) throw new Error(`${id}: edições locais incompatíveis`);
      const layers = tileDocumentLayers(data);
      env.tileFloor.applyEdits(layers.floor);
      env.tileFloor.applyEdits(layers.objects, 'objects');
    }
    const document = makeTileDocument(id, env.tileFloor);
    const snapshot = buildEditedScenarioSnapshot(THREE, env.group);
    const bytes = await new Exporter().parseAsync(snapshot, { binary: true, onlyVisible: true });
    if (!(bytes instanceof ArrayBuffer)) throw new Error(`${id}: saída GLB inválida`);
    const filename = `${id.toLowerCase()}-editado.glb`;
    entries.push({ name: filename, bytes });
    manifest.scenarios.push({ id, file: filename, floorEdits: Object.keys(document.floor).length, objectEdits: Object.keys(document.objects).length });
  }
  entries.push({ name: 'manifesto.json', bytes: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) });
  onProgress({ id: null, completed: scenarioIds.length, total: scenarioIds.length });
  return createStoredZip(entries);
}
