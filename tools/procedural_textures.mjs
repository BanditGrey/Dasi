/**
 * Texturas PBR procedurais do bestiário (Node, sem canvas e sem dependências).
 *
 * O GLTFExporter do three precisa de um canvas DOM para codificar imagens, o
 * que não existe no Node. Então as texturas são geradas aqui como pixels RGBA,
 * codificadas em PNG por este módulo e injetadas no contêiner GLB depois da
 * exportação (ver `tools/glb_texture_injector.mjs`).
 *
 * As três imagens seguem a convenção glTF:
 *   - baseColor:  multiplicada por `baseColorFactor` (modulação de cor/cavidade)
 *   - metallicRoughness: G = roughness, B = metalness (multiplicam os factors)
 *   - normal:     tangente-espaço, derivada do mesmo campo de altura
 *
 * Tudo é determinístico: a semente vem do ID da criatura e o deflate é fixo,
 * então regenerar produz bytes idênticos (requisito de reprodutibilidade).
 */

import { deflateSync, inflateSync } from 'node:zlib';

// ---------------------------------------------------------------------------
// Aleatoriedade determinística
// ---------------------------------------------------------------------------

function hashString(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Ruído em valor, periódico (texturas sem emenda sob wrap REPEAT)
// ---------------------------------------------------------------------------

function latticeHash(ix, iy, seed) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

/** Ruído em valor com período `period` células — fecha nas bordas do mapa. */
function noiseTileable(x, y, period, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smoothstep(x - xi);
  const ty = smoothstep(y - yi);
  const wrap = (value) => ((value % period) + period) % period;
  const x0 = wrap(xi);
  const x1 = wrap(xi + 1);
  const y0 = wrap(yi);
  const y1 = wrap(yi + 1);
  const a = latticeHash(x0, y0, seed);
  const b = latticeHash(x1, y0, seed);
  const c = latticeHash(x0, y1, seed);
  const d = latticeHash(x1, y1, seed);
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
}

/** fBm periódico: cada oitava dobra a frequência e o período juntos. */
function fbmTileable(x, y, basePeriod, octaves, seed, gain = 0.5) {
  let sum = 0;
  let amplitude = 1;
  let total = 0;
  let frequency = 1;
  let period = basePeriod;
  for (let octave = 0; octave < octaves; octave++) {
    sum += noiseTileable(x * frequency, y * frequency, period, seed + octave * 1013) * amplitude;
    total += amplitude;
    amplitude *= gain;
    frequency *= 2;
    period *= 2;
  }
  return sum / total;
}

/** Ruído "crista" (ridged): realça linhas finas, bom para rachaduras e veios. */
function ridgedTileable(x, y, basePeriod, octaves, seed) {
  let sum = 0;
  let amplitude = 0.55;
  let total = 0;
  let frequency = 1;
  let period = basePeriod;
  for (let octave = 0; octave < octaves; octave++) {
    const n = noiseTileable(x * frequency, y * frequency, period, seed + octave * 7877);
    sum += (1 - Math.abs(n * 2 - 1)) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
    period *= 2;
  }
  return sum / total;
}

/** Voronoi periódico (F1 e arestas F2-F1) para escamas, placas e cristais. */
function voronoiTileable(x, y, cells, seed) {
  const wrap = (value) => ((value % cells) + cells) % cells;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  let f1 = Infinity;
  let f2 = Infinity;
  for (let oy = -1; oy <= 1; oy++) {
    for (let ox = -1; ox <= 1; ox++) {
      const gx = wrap(cx + ox);
      const gy = wrap(cy + oy);
      const jx = latticeHash(gx, gy, seed + 11);
      const jy = latticeHash(gx, gy, seed + 29);
      const dx = cx + ox + jx - x;
      const dy = cy + oy + jy - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < f1) { f2 = f1; f1 = dist; } else if (dist < f2) { f2 = dist; }
    }
  }
  return { f1, edge: Math.min(1, (f2 - f1) * 2.2) };
}

// ---------------------------------------------------------------------------
// Padrões de superfície (campo de altura em 0..1)
// ---------------------------------------------------------------------------

/**
 * Regra de periodicidade: todo ruído recebe um domínio inteiro (`span`) igual
 * ao seu período base. Assim `noiseTileable` fecha exatamente nas bordas do
 * mapa e o wrap REPEAT não produz emenda. `stretch` também precisa ser inteiro.
 */
const PATTERNS = {
  /** Escamas sobrepostas em linhas desencontradas. */
  scales(u, v, options, seed) {
    // A alternância de linhas tem período 2, então a contagem precisa ser par
    // para o padrão fechar no wrap vertical (13 → 14, por exemplo).
    const rows = 2 * Math.max(1, Math.round(options.frequency / 2));
    // Fase de meia célula: a borda do mapa (wrap) cai no meio de uma escama,
    // nunca no sulco, evitando um vinco reto nas costuras de UV.
    const sy = v * rows + 0.5;
    const row = Math.floor(sy);
    const shift = (row & 1) === 0 ? 0 : 0.5;
    const sx = (u + shift) * rows * options.stretch + 0.5;
    const col = Math.floor(sx);
    const lu = sx - col;
    const lv = sy - row;
    // Dome de escama: distância ao centro da célula, achatada na base.
    // Dome centrado na célula: assim o valor nas duas bordas do wrap é 0.
    const dx = (lu - 0.5) * 2;
    const dy = (lv - 0.5) * 2;
    const dome = Math.max(0, 1 - Math.sqrt(dx * dx * 0.85 + dy * dy * 1.15));
    const grain = fbmTileable(u * rows * 2, v * rows * 2, rows * 2, 4, seed + 5);
    const seam = Math.pow(1 - dome, 3) * 0.55;
    return clamp01(dome * 0.72 + grain * 0.28 - seam);
  },

  /** Placas de armadura com chanfro e vão entre painéis. */
  plates(u, v, options, seed) {
    const cells = options.frequency;
    // Mesma fase de meia célula do padrão de escamas.
    const sx = u * cells + 0.5;
    const sy = v * cells * options.stretch + 0.5;
    const lu = sx - Math.floor(sx);
    const lv = sy - Math.floor(sy);
    const jitter = fbmTileable(u * cells, v * cells * options.stretch, cells, 3, seed + 17) * 0.16;
    // Distâncias às bordas da célula: periódicas em u e em v, sem salto no wrap.
    const du = Math.min(lu, 1 - lu);
    const dv = Math.min(lv, 1 - lv);
    const bevel = clamp01((Math.min(du, dv) + jitter) / 0.22);
    const crown = 1 - Math.abs(du - dv) * 0.35;
    const grain = fbmTileable(u * 24, v * 24, 12, 4, seed + 31) * 0.22;
    return clamp01(bevel * 0.72 * crown + grain);
  },

  /** Rachaduras e fissuras finas (gelo, magma, pedra rachada). */
  cracks(u, v, options, seed) {
    const span = options.frequency;
    const ridge = ridgedTileable(u * span, v * span * options.stretch, span, 4, seed + 41);
    const fissure = Math.pow(clamp01(1 - ridge * 1.35), 2.4);
    const shell = fbmTileable(u * span * 2, v * span * 2 * options.stretch, span * 2, 4, seed + 53);
    return clamp01(shell * 0.42 + 0.42 + fissure * 0.42);
  },

  /** Couro/membrana: células irregulares com rugas. */
  leather(u, v, options, seed) {
    const cells = options.frequency;
    const cell = voronoiTileable(u * cells, v * cells * options.stretch, cells, seed + 67);
    const wrinkles = ridgedTileable(u * cells * 2, v * cells * 2 * options.stretch, cells * 2, 3, seed + 79);
    const bulge = clamp01(1 - cell.f1 * 2.1);
    return clamp01(bulge * 0.5 + cell.edge * 0.18 + wrinkles * 0.32);
  },

  /** Cristais facetados (gelo, minerais). */
  facets(u, v, options, seed) {
    const cells = options.frequency;
    const cell = voronoiTileable(u * cells, v * cells * options.stretch, cells, seed + 97);
    const inner = clamp01(1 - cell.f1 * 2.4);
    const shard = fbmTileable(u * cells, v * cells * options.stretch, cells, 3, seed + 109);
    const facet = Math.pow(inner, 1.6) * 0.8 + shard * 0.2;
    const edge = (1 - cell.edge) * 0.45;
    return clamp01(facet + edge);
  },

  /** Rocha/areia: fBm com grão grosso. */
  rock(u, v, options, seed) {
    const span = options.frequency;
    const base = fbmTileable(u * span, v * span * options.stretch, span, 5, seed + 131);
    const grain = fbmTileable(u * span * 8, v * span * 8 * options.stretch, span * 8, 3, seed + 149);
    return clamp01(base * 0.7 + grain * 0.3);
  },
};

function clamp01(value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function clamp255(value) {
  const scaled = Math.round(value * 255);
  return scaled < 0 ? 0 : scaled > 255 ? 255 : scaled;
}

// ---------------------------------------------------------------------------
// Perfis por criatura
// ---------------------------------------------------------------------------

/**
 * `contrast` modula a cor, `normalScale` a profundidade do relevo,
 * `roughnessRange`/`metalnessRange` são faixas multiplicativas (o glTF
 * multiplica a textura pelos factors do material).
 */
export const BESTIARY_TEXTURE_PROFILES = {
  ICE_QUEEN: { patterns: [{ name: 'facets', weight: 0.72, frequency: 9 }, { name: 'cracks', weight: 0.28, frequency: 5 }], contrast: 0.34, normalScale: 0.85, roughnessRange: [0.72, 1.0], metalnessRange: [0.85, 1.0], tint: [1.0, 1.02, 1.06] },
  GORGON: { patterns: [{ name: 'scales', weight: 0.78, frequency: 22 }, { name: 'leather', weight: 0.22, frequency: 12 }], contrast: 0.42, normalScale: 1.15, roughnessRange: [0.78, 1.02], metalnessRange: [0.8, 1.0], tint: [1.0, 1.01, 0.99] },
  HYDRA: { patterns: [{ name: 'scales', weight: 0.68, frequency: 16 }, { name: 'leather', weight: 0.32, frequency: 9 }], contrast: 0.4, normalScale: 1.1, roughnessRange: [0.62, 1.0], metalnessRange: [0.85, 1.0], tint: [0.99, 1.02, 1.0] },
  BALROG: { patterns: [{ name: 'plates', weight: 0.5, frequency: 7 }, { name: 'cracks', weight: 0.34, frequency: 6 }, { name: 'rock', weight: 0.16, frequency: 8 }], contrast: 0.52, normalScale: 1.5, roughnessRange: [0.68, 1.05], metalnessRange: [0.72, 1.0], tint: [1.03, 0.99, 0.97] },
  ZAIKAN: { patterns: [{ name: 'plates', weight: 0.62, frequency: 10 }, { name: 'rock', weight: 0.24, frequency: 12 }, { name: 'cracks', weight: 0.14, frequency: 8 }], contrast: 0.46, normalScale: 1.35, roughnessRange: [0.7, 1.04], metalnessRange: [0.75, 1.0], tint: [1.02, 1.0, 0.96] },
  KUNDUN: { patterns: [{ name: 'leather', weight: 0.5, frequency: 8 }, { name: 'rock', weight: 0.3, frequency: 6 }, { name: 'cracks', weight: 0.2, frequency: 4 }], contrast: 0.44, normalScale: 1.2, roughnessRange: [0.74, 1.03], metalnessRange: [0.78, 1.0], tint: [1.0, 0.99, 1.03] },
  GOLDEN_TITAN: { patterns: [{ name: 'plates', weight: 0.66, frequency: 6 }, { name: 'rock', weight: 0.34, frequency: 10 }], contrast: 0.34, normalScale: 0.95, roughnessRange: [0.55, 1.0], metalnessRange: [0.86, 1.0], tint: [1.03, 1.01, 0.96] },
  GOLDEN_BUDGE_DRAGON: { patterns: [{ name: 'scales', weight: 0.74, frequency: 18 }, { name: 'leather', weight: 0.26, frequency: 10 }], contrast: 0.38, normalScale: 1.05, roughnessRange: [0.6, 1.0], metalnessRange: [0.88, 1.0], tint: [1.04, 1.01, 0.95] },
  GOLDEN_SOLDIER: { patterns: [{ name: 'plates', weight: 0.54, frequency: 8 }, { name: 'cracks', weight: 0.28, frequency: 7 }, { name: 'rock', weight: 0.18, frequency: 11 }], contrast: 0.44, normalScale: 1.25, roughnessRange: [0.58, 1.02], metalnessRange: [0.84, 1.0], tint: [1.03, 1.0, 0.95] },
  GOLDEN_LIZARD_KING: { patterns: [{ name: 'scales', weight: 0.6, frequency: 14 }, { name: 'leather', weight: 0.4, frequency: 8 }], contrast: 0.42, normalScale: 1.2, roughnessRange: [0.55, 1.0], metalnessRange: [0.86, 1.0], tint: [1.02, 1.02, 0.96] },
  GOLDEN_TANTALOS: { patterns: [{ name: 'rock', weight: 0.48, frequency: 7 }, { name: 'plates', weight: 0.34, frequency: 5 }, { name: 'cracks', weight: 0.18, frequency: 6 }], contrast: 0.48, normalScale: 1.4, roughnessRange: [0.72, 1.05], metalnessRange: [0.7, 1.0], tint: [1.04, 1.0, 0.94] },
  GOLDEN_DRAGON: { patterns: [{ name: 'scales', weight: 0.72, frequency: 13 }, { name: 'plates', weight: 0.28, frequency: 6 }], contrast: 0.4, normalScale: 1.3, roughnessRange: [0.56, 1.0], metalnessRange: [0.87, 1.0], tint: [1.04, 1.01, 0.95] },
};

const DEFAULT_TEXTURE_SIZE = 256;

function blendPatterns(u, v, profile, seed) {
  let sum = 0;
  let weightTotal = 0;
  for (const layer of profile.patterns) {
    const pattern = PATTERNS[layer.name];
    if (!pattern) throw new Error(`Padrão de textura desconhecido: ${layer.name}`);
    sum += pattern(u, v, { frequency: layer.frequency, stretch: layer.stretch ?? 1 }, seed + hashString(layer.name)) * layer.weight;
    weightTotal += layer.weight;
  }
  return sum / weightTotal;
}

/**
 * Gera o campo de altura de uma criatura.
 * @returns {Float32Array} valores 0..1, tamanho `size * size`
 */
export function createBestiaryHeightField(creatureId, size = DEFAULT_TEXTURE_SIZE) {
  const profile = BESTIARY_TEXTURE_PROFILES[creatureId];
  if (!profile) throw new Error(`Criatura sem perfil de textura: ${creatureId}`);
  const seed = hashString(`dasi:${creatureId}`);
  const field = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      field[y * size + x] = blendPatterns(x / size, v, profile, seed);
    }
  }
  return field;
}

function heightAt(field, size, x, y) {
  const xi = ((x % size) + size) % size;
  const yi = ((y % size) + size) % size;
  return field[yi * size + xi];
}

/** Normal tangente-espaço a partir do campo de altura (diferenças centrais). */
export function heightFieldToNormalMap(field, size, strength = 1) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (heightAt(field, size, x + 1, y) - heightAt(field, size, x - 1, y)) * strength;
      const dy = (heightAt(field, size, x, y + 1) - heightAt(field, size, x, y - 1)) * strength;
      // Normal = normalize(-dx, -dy, 1); o eixo V do glTF aponta para baixo.
      const nx = -dx;
      const ny = dy;
      const nz = 1;
      const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const index = (y * size + x) * 4;
      data[index] = clamp255((nx / length) * 0.5 + 0.5);
      data[index + 1] = clamp255((ny / length) * 0.5 + 0.5);
      data[index + 2] = clamp255((nz / length) * 0.5 + 0.5);
      data[index + 3] = 255;
    }
  }
  return data;
}

/** Detalhe de cor: luminância modulando o `baseColorFactor` do material. */
export function heightFieldToBaseColor(field, size, profile) {
  const data = new Uint8Array(size * size * 4);
  const contrast = profile.contrast ?? 0.4;
  const tint = profile.tint ?? [1, 1, 1];
  for (let index = 0; index < size * size; index++) {
    const cavity = (field[index] - 0.5) * 2; // -1 (fundo) .. +1 (crista)
    const shade = 1 + cavity * contrast * 0.5;
    const ao = 1 - Math.max(0, -cavity) * contrast * 0.32; // cavidades mais escuras
    const out = index * 4;
    data[out] = clamp255(shade * ao * tint[0]);
    data[out + 1] = clamp255(shade * ao * tint[1]);
    data[out + 2] = clamp255(shade * ao * tint[2]);
    data[out + 3] = 255;
  }
  return data;
}

/** G = roughness, B = metalness (faixas multiplicativas sobre os factors). */
export function heightFieldToMetallicRoughness(field, size, profile) {
  const data = new Uint8Array(size * size * 4);
  const [roughMin, roughMax] = profile.roughnessRange ?? [0.8, 1];
  const [metalMin, metalMax] = profile.metalnessRange ?? [0.85, 1];
  const random = mulberry32(hashString(`mr:${size}:${roughMin}:${metalMin}`));
  const speckle = new Float32Array(size * size);
  for (let index = 0; index < speckle.length; index++) speckle[index] = random();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = y * size + x;
      const height = field[index];
      // Cristas polidas, cavidades foscas; risco fino quebra o brilho uniforme.
      const grain = speckle[index] * 0.08 + heightAt(speckle, size, x + 1, y) * 0.04;
      const roughness = roughMax - (roughMax - roughMin) * clamp01(height * 0.85 + grain);
      const metalness = metalMin + (metalMax - metalMin) * clamp01(height * 0.7 + grain * 0.5);
      const out = index * 4;
      data[out] = 0;
      data[out + 1] = clamp255(roughness);
      data[out + 2] = clamp255(metalness);
      data[out + 3] = 255;
    }
  }
  return data;
}

// ---------------------------------------------------------------------------
// Codificador PNG (RGBA8, filtros por linha escolhidos por heurística)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(bytes) {
  let crc = -1;
  for (let index = 0; index < bytes.length; index++) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) >>> 0;
}

function pngChunk(type, payload) {
  const chunk = Buffer.alloc(8 + payload.length + 4);
  chunk.writeUInt32BE(payload.length, 0);
  chunk.write(type, 4, 4, 'ascii');
  payload.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(chunk.subarray(4, 8 + payload.length)), 8 + payload.length);
  return chunk;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/** Aplica o filtro que minimiza a soma dos módulos (heurística clássica do PNG). */
function filterScanlines(rgba, width, height) {
  const bpp = 4;
  const stride = width * bpp;
  const raw = Buffer.alloc((stride + 1) * height);
  const current = Buffer.alloc(stride);
  const previous = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const row = rgba.subarray(y * stride, (y + 1) * stride);
    const candidates = [];
    for (let filter = 0; filter < 5; filter++) {
      for (let x = 0; x < stride; x++) {
        const left = x >= bpp ? row[x - bpp] : 0;
        const up = previous[x];
        const upLeft = x >= bpp ? previous[x - bpp] : 0;
        let value;
        if (filter === 0) value = row[x];
        else if (filter === 1) value = row[x] - left;
        else if (filter === 2) value = row[x] - up;
        else if (filter === 3) value = row[x] - ((left + up) >> 1);
        else value = row[x] - paeth(left, up, upLeft);
        current[x] = value & 0xff;
      }
      let score = 0;
      for (let x = 0; x < stride; x++) {
        const v = current[x];
        score += v < 128 ? v : 256 - v;
      }
      candidates.push({ filter, score, bytes: Buffer.from(current) });
    }
    candidates.sort((a, b) => a.score - b.score || a.filter - b.filter);
    const best = candidates[0];
    raw[y * (stride + 1)] = best.filter;
    best.bytes.copy(raw, y * (stride + 1) + 1);
    row.copy(previous);
  }
  return raw;
}

/**
 * Codifica RGBA8 em PNG (color type 6, bit depth 8, sem interlace).
 * @param {Uint8Array|Buffer} rgba
 */
export function encodePNG(width, height, rgba) {
  if (rgba.length !== width * height * 4) {
    throw new Error(`encodePNG: esperado ${width * height * 4} bytes, recebido ${rgba.length}`);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compressão
  ihdr[11] = 0; // filtro
  ihdr[12] = 0; // sem interlace
  const idat = deflateSync(filterScanlines(Buffer.from(rgba.buffer, rgba.byteOffset, rgba.length), width, height), { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Decodifica um PNG RGBA8 gerado por `encodePNG` — usado por testes e pelo
 * verificador do exportador. Valida assinatura, CRC de cada chunk, IHDR e a
 * estrutura de filtros por linha; o inflate é feito pelo zlib do Node, ou seja,
 * o fluxo IDAT é conferido por um decodificador independente deste módulo.
 * @returns {{ width: number, height: number, rgba: Uint8Array }}
 */
export function decodePNG(png) {
  const bytes = Buffer.isBuffer(png) ? png : Buffer.from(png);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!bytes.subarray(0, 8).equals(signature)) throw new Error('decodePNG: assinatura PNG inválida');

  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  let sawIEND = false;
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const payload = bytes.subarray(offset + 8, offset + 8 + length);
    const declaredCrc = bytes.readUInt32BE(offset + 8 + length);
    if (crc32(Buffer.concat([Buffer.from(type, 'ascii'), payload])) !== declaredCrc) {
      throw new Error(`decodePNG: CRC inválido no chunk ${type}`);
    }
    if (type === 'IHDR') {
      width = payload.readUInt32BE(0);
      height = payload.readUInt32BE(4);
      if (payload[8] !== 8) throw new Error(`decodePNG: bit depth ${payload[8]} ≠ 8`);
      if (payload[9] !== 6) throw new Error(`decodePNG: color type ${payload[9]} ≠ 6 (RGBA)`);
      if (payload[12] !== 0) throw new Error('decodePNG: interlace não suportado');
    } else if (type === 'IDAT') {
      idat.push(payload);
    } else if (type === 'IEND') {
      sawIEND = true;
      break;
    }
    offset += 12 + length;
  }
  if (!sawIEND) throw new Error('decodePNG: chunk IEND ausente');
  if (idat.length === 0) throw new Error('decodePNG: sem IDAT');

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  if (raw.length !== (stride + 1) * height) {
    throw new Error(`decodePNG: dados inflados com ${raw.length} bytes, esperado ${(stride + 1) * height}`);
  }

  const rgba = new Uint8Array(width * height * bpp);
  const previous = Buffer.alloc(stride);
  const current = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const left = x >= bpp ? current[x - bpp] : 0;
      const up = previous[x];
      const upLeft = x >= bpp ? previous[x - bpp] : 0;
      let value = line[x];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += (left + up) >> 1;
      else if (filter === 4) value += paeth(left, up, upLeft);
      else if (filter !== 0) throw new Error(`decodePNG: filtro ${filter} inválido na linha ${y}`);
      current[x] = value & 0xff;
    }
    current.copy(rgba, y * stride);
    current.copy(previous);
  }
  return { width, height, rgba };
}

// ---------------------------------------------------------------------------
// Conjunto PBR por criatura
// ---------------------------------------------------------------------------

/**
 * Gera as três texturas PBR de uma criatura, já em PNG.
 * @returns {{ size: number, baseColor: Buffer, metallicRoughness: Buffer, normal: Buffer, profile: object }}
 */
export function createBestiaryTextureSet(creatureId, size = DEFAULT_TEXTURE_SIZE) {
  const profile = BESTIARY_TEXTURE_PROFILES[creatureId];
  if (!profile) throw new Error(`Criatura sem perfil de textura: ${creatureId}`);
  const field = createBestiaryHeightField(creatureId, size);
  return {
    size,
    profile,
    baseColor: encodePNG(size, size, heightFieldToBaseColor(field, size, profile)),
    metallicRoughness: encodePNG(size, size, heightFieldToMetallicRoughness(field, size, profile)),
    normal: encodePNG(size, size, heightFieldToNormalMap(field, size, profile.normalScale ?? 1)),
  };
}

export { PATTERNS as BESTIARY_TEXTURE_PATTERNS, DEFAULT_TEXTURE_SIZE as BESTIARY_TEXTURE_SIZE };
