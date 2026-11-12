/**
 * Rig de puppet de partes rígidas e clips de animação GLTF do bestiário Dasi.
 *
 * Os protótipos de `tools/bestiary_models.mjs` já possuem hierarquia com nomes
 * semânticos (asas, mandíbulas, caudas, armas, halos...). Este módulo aproveita
 * esses nomes para criar PIVÔS articulados ao redor das partes existentes — sem
 * skinning, sem pesar vértices e sem alterar a geometria — e gera clips GLTF
 * (`IDLE`, locomocão, `ATTACK`, `HURT`, `DEATH`) reproduzíveis por qualquer
 * `AnimationMixer` (Dev Viewer, arena realtime ou cliente futuro).
 *
 * Decisões de projeto:
 *  - Toda parte articulada é envolvida por um `Group` pivô em repouso identidade;
 *    os clips só animam pivôs, nunca o nó original (preserva a pose artística).
 *  - Segmentos de um mesmo membro são agrupados em NÍVEIS por proximidade e
 *    aninhados (proximal → distal), o que articula asas com ossos e membranas,
 *    pernas com coxa/joelho/garra e caudas com placas escalonadas.
 *  - Um pivô `body` envolve todo o conteúdo e carrega respiração, avanço,
 *    recuo e a queda da morte; partes não articuladas acompanham o corpo.
 */

const TAU = Math.PI * 2;

export const BESTIARY_RIG_FORMAT_VERSION = 1;

/** Estados lógicos do controlador; o clip de locomocão varia por arquétipo. */
export const BESTIARY_ANIMATION_STATES = Object.freeze(['IDLE', 'MOVE', 'ATTACK', 'HURT', 'DEATH']);

/** Nomes de clips de locomocão conhecidos, em ordem de preferência. */
export const BESTIARY_LOCOMOTION_CLIPS = Object.freeze(['WALK', 'SCUTTLE', 'SLITHER', 'SWIM', 'FLY', 'FLOAT', 'RUN', 'MOVE']);

/**
 * Perfil de animação por criatura. `locomotion` define o clip gerado no lugar
 * do estado lógico MOVE; `death` escolhe a queda; `caster`/`wings`/`heavy`
 * ajustam a leitura do ataque e da amplitude.
 */
export const BESTIARY_RIG_PROFILES = Object.freeze({
  ICE_QUEEN: Object.freeze({ archetype: 'caster', locomotion: 'WALK', death: 'topple', caster: true, intensity: 0.85 }),
  GORGON: Object.freeze({ archetype: 'serpent', locomotion: 'SLITHER', death: 'topple', intensity: 1.0 }),
  HYDRA: Object.freeze({ archetype: 'leviathan', locomotion: 'SWIM', death: 'collapse', wings: false, intensity: 1.0 }),
  BALROG: Object.freeze({ archetype: 'winged_brute', locomotion: 'WALK', death: 'topple', wings: true, heavy: true, intensity: 1.1 }),
  ZAIKAN: Object.freeze({ archetype: 'arachnid_chimera', locomotion: 'SCUTTLE', death: 'topple', intensity: 1.15 }),
  KUNDUN: Object.freeze({ archetype: 'chaos_sovereign', locomotion: 'FLOAT', death: 'sink', caster: true, intensity: 0.8 }),
  GOLDEN_TITAN: Object.freeze({ archetype: 'solar_titan', locomotion: 'WALK', death: 'topple', heavy: true, intensity: 1.0 }),
  GOLDEN_BUDGE_DRAGON: Object.freeze({ archetype: 'wyrmling', locomotion: 'FLY', death: 'collapse', wings: true, intensity: 1.2 }),
  GOLDEN_SOLDIER: Object.freeze({ archetype: 'skeletal_knight', locomotion: 'WALK', death: 'topple', intensity: 1.0 }),
  GOLDEN_LIZARD_KING: Object.freeze({ archetype: 'amphibian_quadruped', locomotion: 'WALK', death: 'topple', intensity: 1.0 }),
  GOLDEN_TANTALOS: Object.freeze({ archetype: 'desert_colossus', locomotion: 'WALK', death: 'topple', heavy: true, intensity: 0.95 }),
  GOLDEN_DRAGON: Object.freeze({ archetype: 'colossal_dragon', locomotion: 'FLY', death: 'collapse', wings: true, intensity: 1.1 }),
});

const DEFAULT_PROFILE = Object.freeze({ archetype: 'brute', locomotion: 'WALK', death: 'topple', intensity: 1.0 });

export function resolveBestiaryRigProfile(creatureId) {
  const key = String(creatureId ?? '').trim().toUpperCase();
  return BESTIARY_RIG_PROFILES[key] ?? DEFAULT_PROFILE;
}

/**
 * Regras de classificação por nome, da mais específica para a mais genérica.
 * `descendFor` permite reivindicar canais filhos dentro de uma parte já
 * reivindicada (mandíbula dentro da cabeça da Hydra, por exemplo).
 */
const CHANNEL_RULES = Object.freeze([
  { channel: 'jaw', test: /(^|_)(lower_jaw|jaw)(_|$)|mandible_(left|right)|(^|_)muzzle_lower/ },
  { channel: 'head', test: /head|skull|(^|_)face($|_)|demon_head|serpent_crown|chitinous_head|helm|helmet|visor|hood|diadem|(^|_)eye|brow|muzzle|snout|fang/, descendFor: ['jaw'] },
  { channel: 'neck', test: /neck/ },
  { channel: 'wing', test: /wing/ },
  { channel: 'tail', test: /tail|stinger|caudal/ },
  { channel: 'extra', test: /antenna|fin($|_)|_fin_|gill|cape|plume|crest|mantle|hem($|_)|tass?et|tassel|medallion|badge|buckle|rib_\d|vent|gown|robe|cloak|skirt|drape/ },
  { channel: 'weapon', test: /staff|scythe|axe|sword|scepter|maul|blade|shield|sunblade|solar_blade/ },
  { channel: 'spin', test: /halo|ring|orb|rune|aureole|gravitational|gem|crystal|core/ },
  { channel: 'arm', test: /(^|_)(arm|elbow|forearm|gauntlet|bracer|fist|finger|claw|wrist|pauldron|sickle|hand)(_|$)/ },
  { channel: 'leg', test: /(^|_)(leg|thigh|knee|greave|hoof|boot|foot|webbed|toe|tarsal|spur)(_|$)|pelvis/ },
  { channel: 'extra', test: /horn|spike|spine|dorsal|plate_\d|crown|shell|carapace/ },
]);

/**
 * Grupos que embrulham o corpo inteiro (ex.: `golden_soldier_armored_skeleton`,
 * `hydra_coiled_body`) nunca viram uma parte: são atravessados para que os
 * membros reais sejam classificados dentro deles.
 */
const CONTAINER_TEST = /(^|_)(body|skeleton|titan|mantle|torso|thorax|abdomen|coil|armature|assembly|frame)(_|$)/;

/** Canais que produzem cadeia articulada com níveis; os demais são pivôs únicos. */
const CHAINED_CHANNELS = Object.freeze(['arm', 'leg', 'wing', 'tail', 'head', 'jaw', 'neck', 'extra']);

function sideToken(name) {
  if (/(^|_)left(_|$)|_-1(_|$)/.test(name)) return 'left';
  if (/(^|_)right(_|$)/.test(name)) return 'right';
  if (/(claw|finger|gill|spike|horn|fang|leg|arm)_1(_|$)/.test(name)) return 'right';
  if (/(^|_)center(_|$)/.test(name)) return 'center';
  return null;
}

/** Número do membro (leg_1..4, walking_leg_2) — não confundir com índice de segmento. */
function limbNumber(name) {
  const match = name.match(/(?:leg|arm|wing|antenna|sickle)_(-?\d+)(?:_|$)/);
  return match ? Number(match[1]) : null;
}

/** Índice explícito de segmento (tail_spine_3, abdominal_armor_2, dorsal_plate_05). */
function segmentIndex(name) {
  const matches = [...name.matchAll(/_(\d{1,2})(?:_|$)/g)].map((m) => Number(m[1]));
  return matches.length ? matches[matches.length - 1] : null;
}

function slug(name, creaturePrefix) {
  const trimmed = creaturePrefix && name.startsWith(creaturePrefix) ? name.slice(creaturePrefix.length) : name;
  return (trimmed || name).replace(/^_+/, '').replace(/_(left|right|center|-?1)$/g, '').slice(0, 40);
}

/** Classifica um nó pelo nome. Retorna null quando o nó deve permanecer rígido. */
export function classifyBestiaryNode(name, creatureId = '') {
  const lower = String(name ?? '').toLowerCase();
  if (!lower) return null;
  for (const rule of CHANNEL_RULES) {
    if (!rule.test.test(lower)) continue;
    const side = sideToken(lower);
    const prefix = String(creatureId).toLowerCase();
    return {
      channel: rule.channel,
      side,
      limb: limbNumber(lower),
      segment: segmentIndex(lower),
      descendFor: rule.descendFor ?? null,
      chainKey: chainKeyFor(rule.channel, lower, side, prefix),
    };
  }
  return null;
}

function chainKeyFor(channel, lower, side, prefix) {
  const sideKey = side ?? 'main';
  switch (channel) {
    case 'tail': return 'tail';
    case 'wing': return `wing_${sideKey}`;
    case 'head': return `head_${sideKey}`;
    case 'jaw': return `jaw_${sideKey}`;
    case 'neck': return `neck_${sideKey}`;
    case 'arm':
    case 'leg': {
      const limb = limbNumber(lower);
      return `${channel}_${sideKey}${limb && limb > 0 ? `_${limb}` : ''}`;
    }
    case 'weapon': return `weapon_${slug(lower, prefix)}`;
    case 'spin': return `spin_${slug(lower, prefix)}`;
    default: return `extra_${slug(lower, prefix)}`;
  }
}

function round(value, digits = 5) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clampToBox(box, point) {
  return point.clone().clamp(box.min, box.max);
}

/**
 * Levanta as cadeias articulares de uma criatura sem modificar a hierarquia.
 * Retorna também os nós rígidos candidatos a absorção (chifres, elmos, olhos).
 */
function analyseChains(THREE, root, creatureId) {
  const prefix = String(creatureId).toLowerCase();
  root.updateMatrixWorld(true);
  const rootBox = new THREE.Box3().setFromObject(root);
  const core = new THREE.Vector3(
    (rootBox.min.x + rootBox.max.x) / 2,
    rootBox.min.y + (rootBox.max.y - rootBox.min.y) * 0.58,
    (rootBox.min.z + rootBox.max.z) / 2
  );

  const chains = new Map();
  const unclaimed = [];
  const claimed = new Set();

  const claim = (node, info, box) => {
    claimed.add(node);
    const key = info.chainKey;
    if (!chains.has(key)) chains.set(key, { chainKey: key, channel: info.channel, side: info.side, limb: info.limb, segments: [] });
    chains.get(key).segments.push({ node, info, box, depth: nodeDepth(node), center: box.getCenter(new THREE.Vector3()), size: box.getSize(new THREE.Vector3()) });
  };

  const visit = (node, insideClaimedChannel) => {
    const isRoot = node === root;
    const box = isRoot ? null : new THREE.Box3().setFromObject(node);
    const lower = String(node.name ?? '').toLowerCase();
    // O prefixo da criatura pode conter um token de contêiner (golden_TITAN_*),
    // então o teste de contêiner vale apenas para o nome sem o prefixo.
    const stripped = prefix && lower.startsWith(prefix) ? lower.slice(prefix.length) : lower;
    const isContainer = !isRoot && node.children.length > 0 && CONTAINER_TEST.test(stripped);
    const info = isRoot || isContainer ? null : classifyBestiaryNode(node.name, creatureId);
    const nestedAllowed = !!insideClaimedChannel && info?.channel === insideClaimedChannel;
    if (info && (insideClaimedChannel === null || nestedAllowed)) {
      claim(node, info, box);
      // Dentro de uma parte reivindicada só descemos para canais autorizados
      // (mandíbula articulada dentro da cabeça, por exemplo).
      const descendChannels = info.descendFor ?? null;
      if (descendChannels?.length) {
        for (const child of [...node.children]) visitNested(child, descendChannels);
      }
      return;
    }
    if (!isRoot && box && !box.isEmpty()) {
      unclaimed.push({ node, box, center: box.getCenter(new THREE.Vector3()), size: box.getSize(new THREE.Vector3()), depth: nodeDepth(node) });
    }
    for (const child of [...node.children]) visit(child, null);
  };

  const visitNested = (node, channels) => {
    const info = classifyBestiaryNode(node.name, creatureId);
    const box = new THREE.Box3().setFromObject(node);
    if (info && channels.includes(info.channel) && !claimed.has(node)) {
      claim(node, info, box);
      return;
    }
    for (const child of [...node.children]) visitNested(child, channels);
  };

  for (const child of [...root.children]) visit(child, null);

  return { chains, unclaimed, rootBox, core, prefix };
}

function nodeDepth(node) {
  let depth = 0;
  let current = node.parent;
  while (current) { depth += 1; current = current.parent; }
  return depth;
}

/** Move `node` para `newParent` preservando exatamente sua transformação mundial. */
function reparentPreservingWorld(THREE, node, newParent) {
  node.updateWorldMatrix(true, false);
  const world = node.matrixWorld.clone();
  newParent.updateWorldMatrix(true, false);
  newParent.add(node);
  const relative = new THREE.Matrix4().copy(newParent.matrixWorld).invert().multiply(world);
  node.matrix.copy(relative);
  node.matrix.decompose(node.position, node.quaternion, node.scale);
  node.updateWorldMatrix(true, false);
}

function containsPivot(node) {
  let found = false;
  node.traverse((child) => { if (child !== node && child.userData?.jointPivot) found = true; });
  return found;
}

function isUnderPivot(node) {
  let current = node.parent;
  while (current) {
    if (current.userData?.jointPivot) return true;
    current = current.parent;
  }
  return false;
}

/**
 * Anexa rigidamente adereços soltos ao pivô de cabeça/mandíbula/pescoço mais
 * próximo. Vale apenas para os nós genéricos que o compilador do bestiário
 * nomeia como `<criatura>_mesh_NNN` (serpentes da Górgona, chifres e olhos do
 * Balrog): partes com nome semântico já foram classificadas ou ficam no corpo.
 */
const GENERIC_NODE_TEST = /_(mesh|node)_\d{2,}$/;

function attachLooseParts(THREE, joints, unclaimed, rootBox) {
  const anchors = joints.filter((joint) => joint.level === 0 && ['head', 'jaw', 'neck'].includes(joint.channel));
  if (!anchors.length) return 0;
  const rootHeight = Math.max(0.001, rootBox.max.y - rootBox.min.y);
  const growth = Math.max(0.15, rootHeight * 0.05);
  let attached = 0;
  for (const candidate of unclaimed) {
    if (candidate.absorbed) continue;
    const node = candidate.node;
    if (!node.parent || !GENERIC_NODE_TEST.test(String(node.name ?? ''))) continue;
    if (containsPivot(node) || isUnderPivot(node)) continue;
    let best = null;
    for (const anchor of anchors) {
      const box = new THREE.Box3().setFromObject(anchor.pivot);
      if (box.isEmpty()) continue;
      if (!box.clone().expandByScalar(growth).containsPoint(candidate.center)) continue;
      const distance = candidate.center.distanceTo(box.getCenter(new THREE.Vector3()));
      if (!best || distance < best.distance) best = { anchor, distance };
    }
    if (!best) continue;
    reparentPreservingWorld(THREE, node, best.anchor.pivot);
    best.anchor.nodeCount += countMeshes(node);
    attached += 1;
  }
  return attached;
}

/** Garra/pata no chão vira segmento de perna, não de braço. */
function refineByGeometry(channel, center, rootBox) {  if (channel !== 'arm') return channel;
  const height = Math.max(0.001, rootBox.max.y - rootBox.min.y);
  return center.y - rootBox.min.y < height * 0.3 ? 'leg' : channel;
}

/**
 * Absorve nós rígidos próximos a uma cabeça (elmo, coroa, chifres, olhos) ou a
 * uma mandíbula (presas) para que acompanhem a parte articulada.
 */
function absorbAttachments(THREE, chains, unclaimed, rootBox) {
  const anchors = [];
  for (const chain of chains.values()) {
    if (chain.channel !== 'head' && chain.channel !== 'jaw') continue;
    const box = new THREE.Box3();
    for (const segment of chain.segments) box.union(segment.box);
    anchors.push({ chain, box });
  }
  if (!anchors.length) return;
  const rootSize = rootBox.getSize(new THREE.Vector3());
  const maxSize = Math.max(rootSize.x, rootSize.y, rootSize.z);

  for (const candidate of unclaimed) {
    if (candidate.absorbed) continue;
    if (candidate.size.length() > maxSize * 0.55) continue; // massas corporais ficam rígidas
    let best = null;
    for (const anchor of anchors) {
      const grown = anchor.box.clone().expandByScalar(Math.max(0.12, maxSize * 0.06));
      if (!grown.containsPoint(candidate.center)) continue;
      const fits = candidate.size.x <= anchor.box.getSize(new THREE.Vector3()).x * 1.35 + 0.05
        && candidate.size.y <= anchor.box.getSize(new THREE.Vector3()).y * 1.35 + 0.05;
      if (!fits) continue;
      const distance = candidate.center.distanceTo(anchor.box.getCenter(new THREE.Vector3()));
      if (!best || distance < best.distance) best = { anchor, distance };
    }
    if (!best) continue;
    candidate.absorbed = true;
    best.anchor.chain.segments.push({
      node: candidate.node,
      info: { channel: best.anchor.chain.channel, side: best.anchor.chain.side, limb: null, segment: null, chainKey: best.anchor.chain.chainKey },
      box: candidate.box,
      depth: candidate.depth,
      center: candidate.center,
      size: candidate.size,
    });
  }
}

/** Ordem proximal → distal dentro de uma cauda: base, placas numeradas, ferrão. */
function tailOrder(segment) {
  const name = String(segment.node.name ?? '');
  if (/stinger|solar_blade|spade|tip$/.test(name)) return 900 + (segment.info.segment ?? 0);
  if (segment.info.segment !== null) return segment.info.segment;
  return 0;
}

/** Ordem anatômica aproximada por nome (coxa → joelho → garra). */
function partRank(segment) {
  const name = String(segment.node.name ?? '');
  if (segment.info.channel === 'extra' && segment.info.segment !== null) return segment.info.segment;
  if (/upper|thigh|shoulder|pauldron|membrane/.test(name)) return 0;
  if (/fore|elbow|knee|joint|lower|greave|main_bone|inner_rib/.test(name)) return 1;
  if (/hand|gauntlet|fist|foot|boot|webbed|claw|finger|toe|wrist|spur|outer_bone|middle_rib/.test(name)) return 2;
  return 1;
}

/**
 * Agrupa os segmentos de uma cadeia em níveis por proximidade e devolve a
 * âncora de cada nível (ponto de articulação).
 */
function organiseLevels(chain, anchorPoint) {
  const segments = [...chain.segments];
  const isTail = chain.channel === 'tail';
  const rankOf = (segment) => (isTail ? tailOrder(segment) : partRank(segment));

  segments.sort((a, b) => {
    const rankDelta = rankOf(a) - rankOf(b);
    if (rankDelta !== 0) return rankDelta;
    return a.center.distanceTo(anchorPoint) - b.center.distanceTo(anchorPoint);
  });

  const distances = segments.map((segment) => segment.center.distanceTo(anchorPoint));
  const span = distances.length ? Math.max(...distances) - Math.min(...distances) : 0;
  const tolerance = Math.max(0.14, span * 0.22);

  const levels = [];
  let current = null;
  for (const segment of segments) {
    const rank = rankOf(segment);
    const distance = segment.center.distanceTo(anchorPoint);
    // Caudas usam ordem inteira explícita; membros separam por anatomia e vão
    // para um novo nível quando o salto de distância indica outra articulação.
    const gap = isTail ? rank - (current?.rank ?? -Infinity) > 0.5
      : rank !== current?.rank || distance - current?.distance > tolerance;
    if (!current || gap) {
      current = { rank, distance, box: segment.box.clone(), segments: [segment] };
      levels.push(current);
      continue;
    }
    current.distance = Math.max(current.distance, distance);
    current.box.union(segment.box);
    current.segments.push(segment);
  }
  return levels;
}

/**
 * Cria o rig completo: pivô de corpo, cadeias aninhadas e metadados.
 * Modifica a hierarquia de `root` preservando transforms mundiais.
 */
export function attachBestiaryRig(THREE, root, creatureId, options = {}) {
  const id = String(creatureId ?? '').trim().toUpperCase();
  if (!root) throw new Error('attachBestiaryRig exige um nó raiz');
  const prefix = id.toLowerCase();
  const profile = options.profile ?? resolveBestiaryRigProfile(id);

  const analysis = analyseChains(THREE, root, id);
  absorbAttachments(THREE, analysis.chains, analysis.unclaimed, analysis.rootBox);

  // Pivô de corpo: carrega respiração, avanço e queda sem tocar nas partes.
  const bodyPivot = new THREE.Group();
  bodyPivot.name = `${prefix}_rig_body`;
  bodyPivot.userData.jointPivot = true;
  bodyPivot.userData.jointChannel = 'body';
  root.add(bodyPivot);
  for (const child of [...root.children]) {
    if (child === bodyPivot) continue;
    bodyPivot.add(child);
  }
  root.updateMatrixWorld(true);

  const joints = [];
  const registerJoint = (joint) => { joints.push(joint); return joint; };

  registerJoint({
    chainKey: 'body',
    channel: 'body',
    side: null,
    sideSign: 1,
    level: 0,
    levelCount: 1,
    pivotName: bodyPivot.name,
    pivot: bodyPivot,
    nodeCount: countMeshes(bodyPivot),
    center: analysis.rootBox.getCenter(new THREE.Vector3()),
    size: analysis.rootBox.getSize(new THREE.Vector3()),
    rest: new THREE.Vector3(0, 0, 0),
  });

  const chainList = [...analysis.chains.values()].sort((a, b) => maxDepth(b) - maxDepth(a));

  for (const chain of chainList) {
    if (!chain.segments.length) continue;
    const channel = refineChainChannel(chain, analysis.rootBox);
    const anchorForChain = chainAnchor(THREE, chain, channel, analysis, chains => chains);
    const levels = organiseLevels(chain, anchorForChain);
    const side = chain.side ?? geometricSide(THREE, levels, analysis.rootBox);
    const sideSign = side === 'left' ? -1 : 1;

    let parentPivot = null;
    let previousBox = null;
    for (let index = 0; index < levels.length; index++) {
      const level = levels[index];
      const anchorPoint = index === 0 ? anchorForChain : previousBox.getCenter(new THREE.Vector3());
      const pivotWorld = channel === 'spin'
        ? level.box.getCenter(new THREE.Vector3())
        : clampToBox(level.box, anchorPoint);

      // Pivôs nascem SEM rotação/escala: os clips gravam quaterniões absolutos,
      // então qualquer rotação de repouso seria sobrescrita na reprodução.
      const host = index === 0 ? (level.segments[0].node.parent ?? root) : parentPivot;
      host.updateWorldMatrix(true, false);
      const pivot = new THREE.Group();
      pivot.name = uniqueName(`${prefix}_rig_${channel}_${side ?? 'main'}_${index + 1}`, joints, root);
      pivot.position.copy(host.worldToLocal(pivotWorld.clone()));
      pivot.userData.jointPivot = true;
      pivot.userData.jointChannel = channel;
      pivot.userData.jointChain = chain.chainKey;
      pivot.userData.jointLevel = index;
      host.add(pivot);
      pivot.updateWorldMatrix(true, false);

      for (const segment of level.segments) reparentPreservingWorld(THREE, segment.node, pivot);

      parentPivot = pivot;
      previousBox = level.box;
      registerJoint({
        chainKey: chain.chainKey,
        channel,
        side,
        sideSign,
        level: index,
        levelCount: levels.length,
        pivotName: pivot.name,
        pivot,
        nodeCount: level.segments.reduce((total, segment) => total + countMeshes(segment.node), 0),
        center: level.box.getCenter(new THREE.Vector3()),
        size: level.box.getSize(new THREE.Vector3()),
        rest: pivot.position.clone(),
        parentName: host.name || null,
      });
    }
  }

  const attachedLooseParts = attachLooseParts(THREE, joints, analysis.unclaimed, analysis.rootBox);

  root.updateMatrixWorld(true);
  const riggedBox = new THREE.Box3().setFromObject(root);

  const rig = {
    creatureId: id,
    prefix,
    profile,
    root,
    bodyPivot,
    joints,
    attachedLooseParts,
    height: riggedBox.max.y - riggedBox.min.y,
    bounds: riggedBox,
    core: analysis.core,
    locomotion: profile.locomotion,
  };

  root.userData = {
    ...root.userData,
    assetKind: 'bestiary-creature-animated',
    assetVersion: 1,
    rigFormatVersion: BESTIARY_RIG_FORMAT_VERSION,
    creatureId: id,
    staticVisualOnly: false,
    rigIncluded: true,
    rigKind: 'rigid-part-puppet',
    skeletalRigIncluded: false,
    animationClipsIncluded: true,
    collisionsIncluded: false,
    runtimeEffectsIncluded: false,
    animationLocomotion: profile.locomotion,
    animationProfile: profile.archetype,
    rigJointCount: joints.length,
    rigAttachedLooseParts: attachedLooseParts,
    rigChannels: [...new Set(joints.map((joint) => joint.channel))].sort(),
  };

  return rig;
}

function refineChainChannel(chain, rootBox) {
  if (!chain.segments.length) return chain.channel;
  const first = chain.segments[0];
  const refined = refineByGeometry(chain.channel, first.center, rootBox);
  return refined;
}

function geometricSide(THREE, levels, rootBox) {
  const center = (rootBox.min.x + rootBox.max.x) / 2;
  const x = levels[0]?.box.getCenter(new THREE.Vector3()).x ?? center;
  const spread = Math.max(0.001, rootBox.max.x - rootBox.min.x);
  if (Math.abs(x - center) < spread * 0.06) return null;
  return x < center ? 'left' : 'right';
}

function maxDepth(chain) {
  return chain.segments.reduce((deepest, segment) => Math.max(deepest, segment.depth), 0);
}

function countMeshes(node) {
  let total = node.isMesh ? 1 : 0;
  for (const child of node.children) total += countMeshes(child);
  return total;
}

function uniqueName(candidate, joints, root) {
  const taken = new Set(joints.map((joint) => joint.pivotName));
  if (!taken.has(candidate) && !root.getObjectByName(candidate)) return candidate;
  let index = 2;
  while (taken.has(`${candidate}_${index}`) || root.getObjectByName(`${candidate}_${index}`)) index += 1;
  return `${candidate}_${index}`;
}

/** Âncora de articulação: núcleo do corpo, cabeça (para mandíbulas) ou base da cauda. */
function chainAnchor(THREE, chain, channel, analysis) {
  const { chains, core, rootBox } = analysis;
  if (channel === 'jaw') {
    const sideKey = chain.side ?? 'main';
    const head = chains.get(`head_${sideKey}`) ?? findNearestChain(THREE, chains, chain, 'head');
    if (head?.segments.length) {
      const box = new THREE.Box3();
      for (const segment of head.segments) box.union(segment.box);
      return box.getCenter(new THREE.Vector3());
    }
  }
  if (channel === 'weapon') {
    // Armas acompanham a mão mais próxima para o golpe ler como conectado.
    const side = chain.side ?? geometricSideFromSegments(chain.segments, rootBox);
    const arm = side ? [...chains.values()].find((entry) => entry.channel === 'arm' && (entry.side ?? geometricSideFromSegments(entry.segments, rootBox)) === side) : null;
    if (arm?.segments.length) {
      const box = new THREE.Box3();
      for (const segment of arm.segments) box.union(segment.box);
      return box.getCenter(new THREE.Vector3());
    }
  }
  if (channel === 'tail') {
    const rear = rootBox.min.z;
    return new THREE.Vector3(core.x, core.y * 0.8, rear + (rootBox.max.z - rear) * 0.35);
  }
  return core.clone();
}

function geometricSideFromSegments(segments, rootBox) {
  const center = (rootBox.min.x + rootBox.max.x) / 2;
  const x = segments[0]?.center.x ?? center;
  const spread = Math.max(0.001, rootBox.max.x - rootBox.min.x);
  if (Math.abs(x - center) < spread * 0.06) return null;
  return x < center ? 'left' : 'right';
}

function findNearestChain(THREE, chains, chain, channel) {
  let best = null;
  for (const candidate of chains.values()) {
    if (candidate.channel !== channel || !candidate.segments.length) continue;
    const box = new THREE.Box3();
    for (const segment of candidate.segments) box.union(segment.box);
    const distance = box.getCenter(new THREE.Vector3()).distanceTo(chain.segments[0].center);
    if (!best || distance < best.distance) best = { chain: candidate, distance };
  }
  return best?.chain ?? null;
}

// ============================================================================
// GERAÇÃO DE CLIPS
// ============================================================================

function quaternionFromEuler(THREE, cache, x, y, z) {
  cache.euler.set(x, y, z);
  cache.quaternion.setFromEuler(cache.euler);
  return cache.quaternion;
}

function makeCache(THREE) {
  return { euler: new THREE.Euler(), quaternion: new THREE.Quaternion() };
}

/** Track de rotação amostrada por função de fase (0..1), sempre fechando o ciclo. */
function loopRotationTrack(THREE, cache, pivotName, duration, cycles, fn, samplesPerCycle = 8) {
  const samples = Math.max(12, Math.ceil(cycles * samplesPerCycle));
  const times = [];
  const values = [];
  for (let index = 0; index <= samples; index++) {
    const phase = index / samples;
    times.push(round((duration * phase), 5));
    const angles = fn(phase * cycles * TAU, phase);
    const quaternion = quaternionFromEuler(THREE, cache, angles[0], angles[1], angles[2]);
    values.push(round(quaternion.x, 6), round(quaternion.y, 6), round(quaternion.z, 6), round(quaternion.w, 6));
  }
  return new THREE.QuaternionKeyframeTrack(`${pivotName}.quaternion`, times, values);
}

/** Track de rotação por chaves explícitas (tiros únicos: ATTACK, HURT, DEATH). */
function keyedRotationTrack(THREE, cache, pivotName, keys) {
  const times = [];
  const values = [];
  for (const key of keys) {
    times.push(round(key.t, 5));
    const quaternion = quaternionFromEuler(THREE, cache, key.r[0], key.r[1], key.r[2]);
    values.push(round(quaternion.x, 6), round(quaternion.y, 6), round(quaternion.z, 6), round(quaternion.w, 6));
  }
  return new THREE.QuaternionKeyframeTrack(`${pivotName}.quaternion`, times, values);
}

function keyedPositionTrack(THREE, pivotName, keys) {
  const times = [];
  const values = [];
  for (const key of keys) {
    times.push(round(key.t, 5));
    values.push(round(key.p[0], 5), round(key.p[1], 5), round(key.p[2], 5));
  }
  return new THREE.VectorKeyframeTrack(`${pivotName}.position`, times, values);
}

function keyedScaleTrack(THREE, pivotName, keys) {
  const times = [];
  const values = [];
  for (const key of keys) {
    times.push(round(key.t, 5));
    values.push(round(key.s[0], 5), round(key.s[1], 5), round(key.s[2], 5));
  }
  return new THREE.VectorKeyframeTrack(`${pivotName}.scale`, times, values);
}

/** Atenuação e atraso por nível: proximais comandam, distais chicoteiam. */
function levelFactor(joint) {
  return Math.pow(0.72, joint.level);
}

function levelPhase(joint) {
  return -joint.level * 0.42;
}

function channelsOf(rig) {
  const map = new Map();
  for (const joint of rig.joints) {
    if (!map.has(joint.channel)) map.set(joint.channel, []);
    map.get(joint.channel).push(joint);
  }
  for (const list of map.values()) list.sort((a, b) => a.chainKey.localeCompare(b.chainKey) || a.level - b.level);
  return map;
}

function isFlyer(profile) {
  return profile.locomotion === 'FLY';
}

function hasWings(rig) {
  return rig.joints.some((joint) => joint.channel === 'wing');
}

/** IDLE: respiração, olhar, cauda, asas em repouso e giros perpétuos. */
function buildIdleClip(THREE, rig) {
  const cache = makeCache(THREE);
  const profile = rig.profile;
  const duration = 6;
  const intensity = (profile.intensity ?? 1) * 0.9;
  const heightScale = Math.max(0.4, rig.height / 3);
  const tracks = [];
  const channels = channelsOf(rig);
  const flyer = isFlyer(profile) || hasWings(rig);

  const body = channels.get('body')?.[0];
  if (body) {
    tracks.push(loopRotationTrack(THREE, cache, body.pivotName, duration, 2, (angle) => [
      0.018 * intensity * Math.sin(angle),
      0.03 * intensity * Math.sin(angle * 0.5),
      0.012 * intensity * Math.sin(angle + 0.6),
    ]));
    tracks.push(keyedPositionTrack(THREE, body.pivotName, [
      { t: 0, p: [0, 0, 0] },
      { t: duration / 4, p: [0, 0.022 * heightScale * intensity, 0] },
      { t: duration / 2, p: [0, 0, 0] },
      { t: (duration * 3) / 4, p: [0, 0.018 * heightScale * intensity, 0] },
      { t: duration, p: [0, 0, 0] },
    ]));
    tracks.push(keyedScaleTrack(THREE, body.pivotName, [
      { t: 0, s: [1, 1, 1] },
      { t: duration / 2, s: [1.008, 1.012, 1.008] },
      { t: duration, s: [1, 1, 1] },
    ]));
  }

  for (const joint of rig.joints) {
    if (joint.channel === 'body') continue;
    const factor = levelFactor(joint);
    const phase = levelPhase(joint);
    switch (joint.channel) {
      case 'head':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 1, (angle) => [
          0.05 * intensity * Math.sin(angle * 2 + phase),
          0.2 * intensity * Math.sin(angle + phase),
          0.02 * intensity * Math.sin(angle + 1.1),
        ]));
        break;
      case 'jaw':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 2, (angle) => [
          0.045 * intensity * factor * (0.5 + 0.5 * Math.sin(angle + phase)), 0, 0,
        ]));
        break;
      case 'neck':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 1, (angle) => [
          0.03 * intensity * Math.sin(angle + phase), 0.09 * intensity * Math.sin(angle + phase), 0,
        ]));
        break;
      case 'arm':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 2, (angle) => [
          0.06 * intensity * factor * Math.sin(angle + phase),
          0.02 * intensity * factor * Math.sin(angle * 0.5),
          joint.sideSign * 0.05 * intensity * factor * Math.sin(angle + phase + 0.7),
        ]));
        break;
      case 'leg':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 2, (angle) => [
          0.035 * intensity * factor * Math.sin(angle + phase + (joint.side === 'left' ? 0 : Math.PI)), 0, 0,
        ]));
        break;
      case 'wing':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, flyer ? 4 : 2, (angle) => [
          (flyer ? 0.22 : 0.1) * intensity * factor * Math.sin(angle + phase),
          0.05 * intensity * factor * Math.sin(angle * 0.5 + phase),
          joint.sideSign * (flyer ? 0.18 : 0.09) * intensity * factor * Math.sin(angle + phase + 0.4),
        ]));
        break;
      case 'tail':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 2, (angle) => [
          0.05 * intensity * factor * Math.sin(angle + phase),
          0.17 * intensity * factor * Math.sin(angle + phase),
          0.02 * intensity * factor * Math.sin(angle * 2 + phase),
        ]));
        break;
      case 'weapon':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 2, (angle) => [
          0.04 * intensity * Math.sin(angle + phase), 0, 0.05 * intensity * Math.sin(angle + phase + 0.5),
        ]));
        break;
      case 'spin':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 1, (angle) => [
          0.12 * Math.sin(angle), angle, 0.08 * Math.sin(angle + 1),
        ], 24));
        break;
      default:
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 3, (angle) => [
          0.05 * intensity * factor * Math.sin(angle + phase),
          0.04 * intensity * factor * Math.sin(angle + phase),
          0.03 * intensity * factor * Math.sin(angle + phase + 0.9),
        ]));
        break;
    }
  }

  return new THREE.AnimationClip('IDLE', duration, tracks);
}

/** Locomoção: passada, braceio, batida de asa, ondulação ou levitação. */
function buildLocomotionClip(THREE, rig) {
  const cache = makeCache(THREE);
  const profile = rig.profile;
  const mode = profile.locomotion;
  const intensity = profile.intensity ?? 1;
  const heightScale = Math.max(0.4, rig.height / 3);
  const flyer = mode === 'FLY';
  const duration = { WALK: 1.0, RUN: 0.7, SCUTTLE: 0.55, SLITHER: 1.5, SWIM: 1.8, FLOAT: 3.2, FLY: 0.9 }[mode] ?? 1.0;
  const tracks = [];
  const legPhase = (joint) => (joint.side === 'left' ? 0 : Math.PI) + (joint.limbGroupIndex ?? 0) * Math.PI * 0.5;

  const legChains = new Map();
  for (const joint of rig.joints) {
    if (joint.channel !== 'leg') continue;
    if (!legChains.has(joint.chainKey)) legChains.set(joint.chainKey, joint);
  }
  let legIndex = 0;
  for (const joint of legChains.values()) joint.limbGroupIndex = legIndex++;

  const body = rig.joints.find((entry) => entry.channel === 'body');
  if (body) {
    if (flyer || mode === 'SWIM' || mode === 'FLOAT') {
      tracks.push(keyedPositionTrack(THREE, body.pivotName, [
        { t: 0, p: [0, 0, 0] },
        { t: duration / 2, p: [0, (flyer ? 0.16 : 0.09) * heightScale * intensity, 0] },
        { t: duration, p: [0, 0, 0] },
      ]));
      tracks.push(loopRotationTrack(THREE, cache, body.pivotName, duration, 1, (angle) => [
        (flyer ? 0.1 : 0.05) * intensity * Math.sin(angle),
        mode === 'SWIM' || mode === 'SLITHER' ? 0.12 * intensity * Math.sin(angle) : 0.02 * intensity * Math.sin(angle),
        flyer ? 0.05 * intensity * Math.sin(angle * 2) : 0,
      ]));
    } else {
      tracks.push(keyedPositionTrack(THREE, body.pivotName, [
        { t: 0, p: [0, 0, 0] },
        { t: duration / 4, p: [0, 0.05 * heightScale * intensity, 0] },
        { t: duration / 2, p: [0, 0, 0] },
        { t: (duration * 3) / 4, p: [0, 0.05 * heightScale * intensity, 0] },
        { t: duration, p: [0, 0, 0] },
      ]));
      tracks.push(loopRotationTrack(THREE, cache, body.pivotName, duration, 2, (angle) => [
        0.045 * intensity * Math.sin(angle), 0.06 * intensity * Math.sin(angle * 0.5), 0.035 * intensity * Math.sin(angle),
      ]));
    }
  }

  for (const joint of rig.joints) {
    if (joint.channel === 'body') continue;
    const factor = levelFactor(joint);
    const phase = levelPhase(joint);
    const stride = mode === 'SCUTTLE' ? 0.34 : 0.46;
    switch (joint.channel) {
      case 'leg': {
        const swing = stride * intensity * factor;
        const lift = joint.level === 0 ? 1 : 0.55;
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 1, (angle) => {
          const wave = Math.sin(angle + legPhase(joint) + phase);
          const knee = Math.max(0, -Math.sin(angle + legPhase(joint) + phase)) * 0.6;
          return [
            -swing * wave * lift + (joint.level > 0 ? knee * lift : 0),
            mode === 'SCUTTLE' ? 0.16 * intensity * factor * Math.sin(angle + legPhase(joint) + 1.2) : 0.03 * factor * wave,
            joint.sideSign * 0.05 * intensity * factor * wave,
          ];
        }));
        break;
      }
      case 'arm': {
        const swing = (flyer ? 0.12 : mode === 'SCUTTLE' ? 0.3 : 0.36) * intensity * factor;
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 1, (angle) => [
          swing * Math.sin(angle + Math.PI + phase),
          mode === 'SLITHER' ? 0.12 * intensity * Math.sin(angle + phase) : 0.03 * factor * Math.sin(angle + phase),
          joint.sideSign * 0.09 * intensity * factor * Math.sin(angle + phase + 0.8),
        ]));
        break;
      }
      case 'wing': {
        const flap = (flyer ? 0.78 : mode === 'SWIM' ? 0.3 : 0.4) * intensity * factor;
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, flyer ? 1 : 2, (angle) => [
          flap * 0.55 * Math.sin(angle + phase + 0.5),
          flyer ? 0.12 * intensity * factor * Math.sin(angle * 2 + phase) : 0.04 * factor * Math.sin(angle + phase),
          joint.sideSign * flap * Math.sin(angle + phase),
        ]));
        break;
      }
      case 'tail':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, mode === 'SLITHER' || mode === 'SWIM' ? 2 : 1, (angle) => [
          0.07 * intensity * factor * Math.sin(angle + phase),
          (mode === 'SLITHER' || mode === 'SWIM' ? 0.42 : 0.2) * intensity * factor * Math.sin(angle + phase),
          0.03 * intensity * factor * Math.sin(angle * 2 + phase),
        ]));
        break;
      case 'head':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 1, (angle) => [
          (flyer ? 0.06 : 0.04) * intensity * Math.sin(angle + phase + Math.PI),
          mode === 'SLITHER' ? 0.24 * intensity * Math.sin(angle + Math.PI + phase) : 0.05 * intensity * Math.sin(angle),
          0,
        ]));
        break;
      case 'jaw':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 2, (angle) => [
          0.06 * intensity * factor * (0.5 + 0.5 * Math.sin(angle + phase)), 0, 0,
        ]));
        break;
      case 'neck':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 1, (angle) => [
          0.05 * intensity * Math.sin(angle + phase),
          mode === 'SWIM' || mode === 'SLITHER' ? 0.2 * intensity * Math.sin(angle + phase) : 0.04 * intensity * Math.sin(angle),
          0,
        ]));
        break;
      case 'weapon':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 1, (angle) => [
          (flyer ? 0.05 : 0.3) * intensity * Math.sin(angle + Math.PI + phase), 0, 0.07 * intensity * Math.sin(angle + phase),
        ]));
        break;
      case 'spin':
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, mode === 'FLOAT' ? 2 : 1, (angle) => [
          0.1 * Math.sin(angle), angle, 0.06 * Math.sin(angle + 1),
        ], 24));
        break;
      default:
        tracks.push(loopRotationTrack(THREE, cache, joint.pivotName, duration, 2, (angle) => [
          0.09 * intensity * factor * Math.sin(angle + phase),
          0.07 * intensity * factor * Math.sin(angle + phase + 0.6),
          0.05 * intensity * factor * Math.sin(angle * 2 + phase),
        ]));
        break;
    }
  }

  return new THREE.AnimationClip(mode, duration, tracks);
}

/** ATTACK: preparo, golpe e recuperação, com variante para conjuradores. */
function buildAttackClip(THREE, rig) {
  const cache = makeCache(THREE);
  const profile = rig.profile;
  const caster = !!profile.caster;
  const intensity = profile.intensity ?? 1;
  const duration = caster ? 1.5 : 1.15;
  const wind = caster ? 0.55 : 0.34;
  const strike = wind + 0.16;
  const follow = strike + 0.22;
  const heightScale = Math.max(0.4, rig.height / 3);
  const tracks = [];

  const rest = [0, 0, 0];
  const body = rig.joints.find((entry) => entry.channel === 'body');
  if (body) {
    tracks.push(keyedRotationTrack(THREE, cache, body.pivotName, [
      { t: 0, r: rest },
      { t: wind, r: [-0.14 * intensity, 0, 0] },
      { t: strike, r: [0.2 * intensity, 0, 0] },
      { t: follow, r: [0.07 * intensity, 0, 0] },
      { t: duration, r: rest },
    ]));
    tracks.push(keyedPositionTrack(THREE, body.pivotName, [
      { t: 0, p: [0, 0, 0] },
      { t: wind, p: [0, 0.03 * heightScale, -0.09 * heightScale * intensity] },
      { t: strike, p: [0, -0.02 * heightScale, 0.2 * heightScale * intensity] },
      { t: follow, p: [0, 0, 0.06 * heightScale] },
      { t: duration, p: [0, 0, 0] },
    ]));
  }

  for (const joint of rig.joints) {
    if (joint.channel === 'body') continue;
    const factor = levelFactor(joint);
    const amp = intensity * factor;
    switch (joint.channel) {
      case 'arm':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, caster ? [
          { t: 0, r: rest },
          { t: wind, r: [-0.95 * amp, 0, joint.sideSign * -0.25 * amp] },
          { t: strike, r: [-0.35 * amp, 0, joint.sideSign * -0.1 * amp] },
          { t: follow, r: [-0.5 * amp, 0, joint.sideSign * -0.18 * amp] },
          { t: duration, r: rest },
        ] : [
          { t: 0, r: rest },
          { t: wind, r: [-1.05 * amp, 0, joint.sideSign * -0.22 * amp] },
          { t: strike, r: [1.25 * amp, 0, joint.sideSign * 0.18 * amp] },
          { t: follow, r: [0.4 * amp, 0, joint.sideSign * 0.06 * amp] },
          { t: duration, r: rest },
        ]));
        break;
      case 'weapon':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, caster ? [
          { t: 0, r: rest },
          { t: wind, r: [-0.5 * amp, 0, -0.25 * amp] },
          { t: strike, r: [-0.75 * amp, 0.4 * amp, -0.1 * amp] },
          { t: follow, r: [-0.6 * amp, 0.2 * amp, 0] },
          { t: duration, r: rest },
        ] : [
          { t: 0, r: rest },
          { t: wind, r: [-1.25 * amp, 0, -0.35 * amp] },
          { t: strike, r: [1.5 * amp, 0.25 * amp, 0.3 * amp] },
          { t: follow, r: [0.5 * amp, 0, 0.1 * amp] },
          { t: duration, r: rest },
        ]));
        break;
      case 'jaw':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: wind, r: [0.12 * amp, 0, 0] },
          { t: strike, r: [0.6 * amp, 0, 0] },
          { t: follow, r: [0.28 * amp, 0, 0] },
          { t: duration, r: rest },
        ]));
        break;
      case 'head':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: wind, r: [-0.2 * amp, 0.08 * amp, 0] },
          { t: strike, r: [0.26 * amp, -0.05 * amp, 0] },
          { t: follow, r: [0.08 * amp, 0, 0] },
          { t: duration, r: rest },
        ]));
        break;
      case 'neck':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: wind, r: [-0.16 * amp, 0.14 * amp, 0] },
          { t: strike, r: [0.3 * amp, -0.2 * amp, 0] },
          { t: follow, r: [0.1 * amp, 0, 0] },
          { t: duration, r: rest },
        ]));
        break;
      case 'tail':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: wind, r: [0.1 * amp, -0.45 * amp, 0] },
          { t: strike, r: [-0.22 * amp, 0.7 * amp, 0] },
          { t: follow, r: [0.06 * amp, 0.2 * amp, 0] },
          { t: duration, r: rest },
        ]));
        break;
      case 'wing':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: wind, r: [-0.35 * amp, 0, joint.sideSign * -0.45 * amp] },
          { t: strike, r: [0.3 * amp, 0, joint.sideSign * 0.6 * amp] },
          { t: follow, r: [0.05 * amp, 0, joint.sideSign * 0.12 * amp] },
          { t: duration, r: rest },
        ]));
        break;
      case 'leg':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: wind, r: [0.16 * amp * (joint.side === 'left' ? -1 : 1), 0, 0] },
          { t: strike, r: [-0.24 * amp * (joint.side === 'left' ? -1 : 1), 0, 0] },
          { t: follow, r: [-0.06 * amp, 0, 0] },
          { t: duration, r: rest },
        ]));
        break;
      case 'spin':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: wind, r: [0.35, TAU * 0.35, 0.2] },
          { t: strike, r: [-0.2, TAU * 0.85, -0.15] },
          { t: follow, r: [0.1, TAU * 0.95, 0.05] },
          { t: duration, r: [0, TAU, 0] },
        ]));
        break;
      default:
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: wind, r: [-0.12 * amp, 0.08 * amp, 0] },
          { t: strike, r: [0.2 * amp, -0.12 * amp, 0] },
          { t: follow, r: [0.05 * amp, 0, 0] },
          { t: duration, r: rest },
        ]));
        break;
    }
  }

  return new THREE.AnimationClip('ATTACK', duration, tracks);
}

/** HURT: recuo curto do impacto, mantém o monstro legível durante o dano. */
function buildHurtClip(THREE, rig) {
  const cache = makeCache(THREE);
  const intensity = rig.profile.intensity ?? 1;
  const duration = 0.55;
  const heightScale = Math.max(0.4, rig.height / 3);
  const rest = [0, 0, 0];
  const tracks = [];

  const body = rig.joints.find((entry) => entry.channel === 'body');
  if (body) {
    tracks.push(keyedRotationTrack(THREE, cache, body.pivotName, [
      { t: 0, r: rest },
      { t: 0.12, r: [-0.2 * intensity, 0, 0.04 * intensity] },
      { t: 0.3, r: [-0.08 * intensity, 0, 0] },
      { t: duration, r: rest },
    ]));
    tracks.push(keyedPositionTrack(THREE, body.pivotName, [
      { t: 0, p: [0, 0, 0] },
      { t: 0.12, p: [0, 0.02 * heightScale, -0.1 * heightScale * intensity] },
      { t: duration, p: [0, 0, 0] },
    ]));
  }

  for (const joint of rig.joints) {
    if (joint.channel === 'body') continue;
    const factor = levelFactor(joint);
    const amp = intensity * factor;
    if (joint.channel === 'head' || joint.channel === 'neck') {
      tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
        { t: 0, r: rest },
        { t: 0.12, r: [-0.32 * amp, 0.1 * amp, 0] },
        { t: 0.32, r: [-0.1 * amp, 0, 0] },
        { t: duration, r: rest },
      ]));
    } else if (joint.channel === 'arm' || joint.channel === 'wing') {
      tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
        { t: 0, r: rest },
        { t: 0.12, r: [-0.22 * amp, 0, joint.sideSign * -0.3 * amp] },
        { t: 0.32, r: [-0.06 * amp, 0, joint.sideSign * -0.08 * amp] },
        { t: duration, r: rest },
      ]));
    } else if (joint.channel === 'tail') {
      tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
        { t: 0, r: rest },
        { t: 0.14, r: [0.1 * amp, -0.28 * amp, 0] },
        { t: duration, r: rest },
      ]));
    } else if (joint.channel === 'jaw') {
      tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
        { t: 0, r: rest },
        { t: 0.1, r: [0.35 * amp, 0, 0] },
        { t: duration, r: rest },
      ]));
    }
  }

  return new THREE.AnimationClip('HURT', duration, tracks);
}

/** DEATH: queda, membros soltos e pose final segura (clamp). */
function buildDeathClip(THREE, rig) {
  const cache = makeCache(THREE);
  const profile = rig.profile;
  const style = profile.death ?? 'topple';
  const intensity = profile.intensity ?? 1;
  const duration = style === 'sink' ? 2.4 : 2.0;
  const heightScale = Math.max(0.4, rig.height / 3);
  const rest = [0, 0, 0];
  const tracks = [];
  const fall = Math.min(duration * 0.55, 1.0);
  const settle = Math.min(duration * 0.8, fall + 0.4);

  const body = rig.joints.find((entry) => entry.channel === 'body');
  if (body) {
    if (style === 'collapse') {
      tracks.push(keyedRotationTrack(THREE, cache, body.pivotName, [
        { t: 0, r: rest },
        { t: fall * 0.5, r: [0.18 * intensity, 0.1 * intensity, 0.25 * intensity] },
        { t: fall, r: [0.42 * intensity, -0.12 * intensity, 0.85 * intensity] },
        { t: settle, r: [0.5 * intensity, -0.15 * intensity, 1.05 * intensity] },
        { t: duration, r: [0.5 * intensity, -0.15 * intensity, 1.08 * intensity] },
      ]));
      tracks.push(keyedPositionTrack(THREE, body.pivotName, [
        { t: 0, p: [0, 0, 0] },
        { t: fall, p: [0, -0.34 * rig.height * 0.35, 0.05 * heightScale] },
        { t: duration, p: [0, -0.42 * rig.height * 0.35, 0.08 * heightScale] },
      ]));
    } else if (style === 'sink') {
      tracks.push(keyedRotationTrack(THREE, cache, body.pivotName, [
        { t: 0, r: rest },
        { t: fall, r: [0.1 * intensity, 0.35 * intensity, 0.05 * intensity] },
        { t: duration, r: [0.12 * intensity, 0.5 * intensity, 0.06 * intensity] },
      ]));
      tracks.push(keyedPositionTrack(THREE, body.pivotName, [
        { t: 0, p: [0, 0, 0] },
        { t: fall, p: [0, -0.22 * rig.height * 0.35, 0] },
        { t: duration, p: [0, -0.55 * rig.height * 0.35, 0] },
      ]));
      tracks.push(keyedScaleTrack(THREE, body.pivotName, [
        { t: 0, s: [1, 1, 1] },
        { t: fall, s: [0.94, 0.9, 0.94] },
        { t: duration, s: [0.72, 0.62, 0.72] },
      ]));
    } else {
      tracks.push(keyedRotationTrack(THREE, cache, body.pivotName, [
        { t: 0, r: rest },
        { t: fall * 0.6, r: [-0.4 * intensity, 0, 0.06 * intensity] },
        { t: fall, r: [-1.02 * intensity, 0.05 * intensity, 0.12 * intensity] },
        { t: settle, r: [-1.24 * intensity, 0.06 * intensity, 0.14 * intensity] },
        { t: duration, r: [-1.28 * intensity, 0.06 * intensity, 0.14 * intensity] },
      ]));
      tracks.push(keyedPositionTrack(THREE, body.pivotName, [
        { t: 0, p: [0, 0, 0] },
        { t: fall, p: [0, -0.12 * rig.height * 0.35, -0.06 * heightScale] },
        { t: duration, p: [0, -0.16 * rig.height * 0.35, -0.08 * heightScale] },
      ]));
    }
  }

  for (const joint of rig.joints) {
    if (joint.channel === 'body') continue;
    const factor = levelFactor(joint);
    const amp = intensity * factor;
    switch (joint.channel) {
      case 'head':
      case 'neck':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: fall * 0.5, r: [-0.35 * amp, 0.1 * amp, 0] },
          { t: settle, r: [0.42 * amp, 0.18 * amp, joint.sideSign * 0.12 * amp] },
          { t: duration, r: [0.46 * amp, 0.2 * amp, joint.sideSign * 0.14 * amp] },
        ]));
        break;
      case 'jaw':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: fall * 0.5, r: [0.45 * amp, 0, 0] },
          { t: settle, r: [0.2 * amp, 0, 0] },
          { t: duration, r: [0.24 * amp, 0, 0] },
        ]));
        break;
      case 'arm':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: fall * 0.5, r: [-0.5 * amp, 0, joint.sideSign * -0.35 * amp] },
          { t: settle, r: [0.22 * amp, 0, joint.sideSign * 0.55 * amp] },
          { t: duration, r: [0.25 * amp, 0, joint.sideSign * 0.6 * amp] },
        ]));
        break;
      case 'leg':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: fall * 0.6, r: [0.4 * amp, 0, joint.sideSign * 0.12 * amp] },
          { t: settle, r: [0.18 * amp, 0, joint.sideSign * 0.22 * amp] },
          { t: duration, r: [0.2 * amp, 0, joint.sideSign * 0.24 * amp] },
        ]));
        break;
      case 'wing':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: fall * 0.4, r: [-0.5 * amp, 0, joint.sideSign * -0.5 * amp] },
          { t: settle, r: [0.3 * amp, 0, joint.sideSign * 0.42 * amp] },
          { t: duration, r: [0.34 * amp, 0, joint.sideSign * 0.46 * amp] },
        ]));
        break;
      case 'tail':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: fall * 0.5, r: [-0.18 * amp, 0.3 * amp, 0] },
          { t: settle, r: [0.26 * amp, -0.16 * amp, 0] },
          { t: duration, r: [0.28 * amp, -0.18 * amp, 0] },
        ]));
        break;
      case 'weapon':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: fall, r: [0.9 * amp, 0.2 * amp, joint.sideSign * 0.5 * amp] },
          { t: duration, r: [1.15 * amp, 0.25 * amp, joint.sideSign * 0.62 * amp] },
        ]));
        break;
      case 'spin':
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: fall, r: [0.4, TAU * 0.6, 0.3] },
          { t: duration, r: [0.55, TAU * 0.72, 0.42] },
        ]));
        break;
      default:
        tracks.push(keyedRotationTrack(THREE, cache, joint.pivotName, [
          { t: 0, r: rest },
          { t: settle, r: [0.16 * amp, 0.1 * amp, joint.sideSign * 0.12 * amp] },
          { t: duration, r: [0.18 * amp, 0.1 * amp, joint.sideSign * 0.14 * amp] },
        ]));
        break;
    }
  }

  return new THREE.AnimationClip('DEATH', duration, tracks);
}

/** Gera os cinco clips (IDLE, locomocão, ATTACK, HURT, DEATH) de uma criatura. */
export function createBestiaryAnimationClips(THREE, rig) {
  if (!rig?.joints?.length) throw new Error('Rig inválido: nenhum pivô articulado');
  const clips = [
    buildIdleClip(THREE, rig),
    buildLocomotionClip(THREE, rig),
    buildAttackClip(THREE, rig),
    buildHurtClip(THREE, rig),
    buildDeathClip(THREE, rig),
  ];
  for (const clip of clips) {
    if (!clip.tracks.length) throw new Error(`Clip ${clip.name} sem tracks`);
    for (const track of clip.tracks) {
      if (!Number.isFinite(track.times[0]) || track.times.length < 2) throw new Error(`Track inválida em ${clip.name}: ${track.name}`);
    }
  }
  return clips;
}

/** Constrói a criatura já articulada e com clips prontos para exportar. */
export function buildAnimatedBestiaryCreature(THREE, creatureId, buildStaticCreature, options = {}) {
  const root = buildStaticCreature(creatureId);
  const rig = attachBestiaryRig(THREE, root, creatureId, options);
  const clips = createBestiaryAnimationClips(THREE, rig);
  root.animations = clips;
  root.userData.animationStates = clips.map((clip) => clip.name);
  return { root, rig, clips };
}

// ============================================================================
// CONTROLADOR DE RUNTIME (AnimationMixer + máquina de estados)
// ============================================================================

/**
 * Máquina de estados de animação para GLBs do bestiário. Estados lógicos:
 * IDLE, MOVE (resolve o clip de locomocão do arquétipo), ATTACK, HURT e DEATH.
 * Tiros únicos retornam sozinhos ao estado base; DEATH é terminal.
 */
export function createBestiaryAnimationController(THREE, model, clips, options = {}) {
  if (!model || !Array.isArray(clips) || clips.length === 0) return null;
  const byName = new Map(clips.map((clip) => [clip.name.toUpperCase(), clip]));
  const locomotionName = (options.locomotion
    ?? [...byName.keys()].find((name) => BESTIARY_LOCOMOTION_CLIPS.includes(name))
    ?? 'MOVE');
  const locomotionClip = byName.get(String(locomotionName).toUpperCase()) ?? byName.get('MOVE') ?? null;

  const mixer = new THREE.AnimationMixer(model);
  const fade = Number.isFinite(options.fadeDuration) ? options.fadeDuration : 0.22;
  let baseState = 'IDLE';
  let activeState = 'IDLE';
  let activeAction = null;
  let disposed = false;

  const actionFor = (state) => {
    const key = String(state).toUpperCase();
    const clip = key === 'MOVE' ? locomotionClip : byName.get(key) ?? null;
    if (!clip) return null;
    return mixer.clipAction(clip);
  };

  const playState = (state, { loop = true, clamp = false, fadeIn = fade } = {}) => {
    const action = actionFor(state);
    if (!action) return false;
    if (activeAction === action) return true;
    action.reset();
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = clamp;
    action.enabled = true;
    action.setEffectiveWeight(1);
    action.fadeIn(fadeIn);
    action.play();
    if (activeAction && activeAction !== action) activeAction.fadeOut(fadeIn);
    activeAction = action;
    activeState = String(state).toUpperCase();
    return true;
  };

  playState('IDLE');

  mixer.addEventListener('finished', (event) => {
    if (disposed) return;
    if (activeState === 'DEATH') return;
    playState(baseState === 'MOVE' ? 'MOVE' : 'IDLE');
  });

  return {
    model,
    mixer,
    clips,
    locomotion: locomotionName,
    get state() { return activeState; },
    get baseState() { return baseState; },
    get isDead() { return activeState === 'DEATH'; },
    /** Estado persistente (IDLE ou MOVE). */
    setBaseState(state) {
      const key = String(state).toUpperCase() === 'MOVE' ? 'MOVE' : 'IDLE';
      if (activeState === 'DEATH') return false;
      baseState = key;
      if (activeState === 'IDLE' || activeState === 'MOVE') return playState(key);
      return true;
    },
    /** Tiro único (ATTACK/HURT); ignora se já morreu. */
    trigger(state) {
      if (disposed || activeState === 'DEATH') return false;
      const key = String(state).toUpperCase();
      if (key !== 'ATTACK' && key !== 'HURT') return false;
      return playState(key, { loop: false, clamp: false });
    },
    /** Morte: pose final segura e sem retorno automático. */
    die() {
      if (disposed || activeState === 'DEATH') return false;
      return playState('DEATH', { loop: false, clamp: true });
    },
    update(delta) {
      if (disposed) return;
      mixer.update(Math.max(0, delta));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
    },
  };
}
