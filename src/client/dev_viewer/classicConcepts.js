/** Referências visuais de bioma, não reconstruções exatas dos mapas 3D. */
export const CLASSIC_CONCEPTS = {
  LORENCIA: { file: 'lorencia', description: 'Cidadela medieval de pedra, fonte com estátua alada, mercado e luz quente em meio à chuva.' },
  NORIA: { file: 'noria', description: 'Refúgio élfico entre árvores antigas, passarelas de madeira, musgo e névoa verde.' },
  DEVIAS: { file: 'devias', description: 'Fortaleza distante entre pinheiros nevados, muralhas geladas e pontos de luz quente.' },
  DUNGEON: { file: 'dungeon', description: 'Catacumbas de pedra, arcos escuros, grades e velas, com um caminho legível até as profundezas.' },
  LOST_TOWER: { file: 'lost_tower', description: 'Torre gótica de basalto, escadarias antigas e luz infernal entre sombras violetas.' },
  ATLANS: { file: 'atlans', description: 'Cidade submersa em ruínas, colunas antigas, corais luminosos e águas azul-esverdeadas.' },
  TARKAN: { file: 'tarkan', description: 'Deserto de cânions e templos desgastados, ossadas e uma trilha sob o céu empoeirado.' },
  ICARUS: { file: 'icarus', description: 'Ruínas celestes em ilhas flutuantes, pontes de pedra e estátuas acima das nuvens.' },
  VALLEY_OF_LOREN: { file: 'valley_of_loren', description: 'Fortaleza de cerco com portão de ferro, torres, barricadas e tochas no campo enlameado.' },
  BLOOD_CASTLE: { file: 'blood_castle', description: 'Ponte gótica sobre um abismo carmesim, estátuas aladas e um altar além do portão.' },
  DEVIL_SQUARE: { file: 'devil_square', description: 'Arena circular de pedra negra, pentagrama gasto, totens de crânio e brasas no nevoeiro.' },
  CHAOS_CASTLE: { file: 'chaos_castle', description: 'Coliseu suspenso sobre um abismo, lajes rachadas, ruínas góticas e luz violeta discreta.' },
  DUEL_COLISEUM: { file: 'duel_coliseum', description: 'Arena octogonal de pedra envelhecida, arquibancadas em ruínas e tochas douradas.' },
};

const PREFIXES = { LOR: 'LORENCIA', NOR: 'NORIA', DEV: 'DEVIAS', DNG: 'DUNGEON', LT: 'LOST_TOWER', ATL: 'ATLANS', TAR: 'TARKAN', ICA: 'ICARUS', VOL: 'VALLEY_OF_LOREN' };
const EVENTS = { EVT_01: 'BLOOD_CASTLE', EVT_02: 'DEVIL_SQUARE', EVT_03: 'CHAOS_CASTLE', EVT_04: 'DUEL_COLISEUM' };

/** Resolve IDs canônicos sem atribuir a arte de Blood Castle aos outros eventos. */
export function conceptKeyForScenario(id) {
  if (!id) return 'LORENCIA';
  if (EVENTS[id]) return EVENTS[id];
  if (id.startsWith('EVT_')) return null;
  return PREFIXES[id.split('_')[0]] || id;
}

/** Concepts específicos concluídos. Os demais cenários usam referência de família identificada como tal. */
export const SCENARIO_CONCEPTS = {
  LOR_01: { title: 'Lorencia — Praça Central', description: 'Fonte de pedra, estátua alada, mercado e taverna sob a chuva.' },
  LOR_02: { title: 'Lorencia — Portão Leste', description: 'Muralhas e torres dão acesso às planícies das bestas.' },
  LOR_03: { title: 'Lorencia — Mata das Aranhas', description: 'Árvore retorcida, ruínas e teias junto ao portão oeste.' },
  LOR_04: { title: 'Lorencia — Ponte do Castelo', description: 'Ponte de pedra sobre o fosso, torres e portão norte.' },
  LOR_05: { title: 'Lorencia — Cemitério', description: 'Mausoléu, criptas e lápides entre salgueiros e névoa.' },
  LOR_06: { title: 'Lorencia — Taverna', description: 'Interior de madeira com balcão, lareira, mesas e barris.' },
  LOR_07: { title: 'Lorencia — Forja', description: 'Oficina do ferreiro com fornalha, bigorna, armas e ferramentas.' },
  NOR_01: { title: 'Noria — Santuário Arbóreo', description: 'Árvore ancestral, plataformas, passarelas e fontes de orvalho.' },
  NOR_02: { title: 'Noria — Oficina do Caos', description: 'Oficina no interior da árvore, máquina rúnica e engrenagens de bronze.' },
  NOR_03: { title: 'Noria — Altar das Águas da Vida', description: 'Estátua da rainha, bacia sagrada e pilares de âmbar na floresta.' },
  NOR_04: { title: 'Noria — Bosque dos Espiões', description: 'Árvores antigas, cipós, esconderijos e troncos caídos no bosque.' },
  NOR_05: { title: 'Noria — Clareira dos Cogumelos', description: 'Cogumelos gigantes, lago luminoso, esporos e pedras cobertas de musgo.' },
  NOR_06: { title: 'Noria — Desfiladeiro das Raízes', description: 'Ponte pênsil de raízes sobre um desfiladeiro de névoa e cachoeiras.' },
  NOR_07: { title: 'Noria — Covil do Golem', description: 'Clareira circular cercada por raízes, com um monolito de pedra quebrado.' },
  DEV_01: { title: 'Devias — Cidadela Glacial', description: 'Pátio nevado e grande braseiro cercado por pedras descongeladas.' },
  DEV_02: { title: 'Devias — Catedral Glacial', description: 'Fachada gótica, rosácea safira, arcobotantes e pináculos gelados.' },
  DEV_03: { title: 'Devias — Campos de Neve', description: 'Planície nevada, fissuras glaciais e estacas de aviso na nevasca.' },
  DEV_04: { title: 'Devias — Cordilheira de Cristal', description: 'Caminho alpino entre agulhas de gelo e cavernas congeladas.' },
  DEV_05: { title: 'Devias — Fenda Polar', description: 'Ponte natural de gelo sobre um abismo profundo de permafrost.' },
  DEV_06: { title: 'Devias — Palácio da Rainha do Gelo', description: 'Arena congelada com trono monumental, colunas e piso espelhado.' },
  DNG_01: { title: 'Dungeon — Catacumbas da Entrada', description: 'Portal antigo, ossuário, pilares de pedra e portão de ferro.' },
  DNG_02: { title: 'Dungeon — Corredor das Celas', description: 'Passagem subterrânea ladeada por celas, grades e correntes.' },
  DNG_03: { title: 'Dungeon — Criptas Venenosas', description: 'Sarcófagos e pilares entre poças de lodo tóxico.' },
  DNG_04: { title: 'Dungeon — Câmara dos Sacrifícios', description: 'Poço circular, correntes e instrumentos de ferro nas laterais.' },
  DNG_05: { title: 'Dungeon — Labirinto das Almas', description: 'Corredores góticos cruzados entre névoa esmeralda e ossários.' },
  DNG_06: { title: 'Dungeon — Covil de Gorgon', description: 'Câmara ritual circular com pilares e altar de fogo verde.' },
  LT_01: { title: 'Lost Tower — Portal de Obsidiana', description: 'Arco de basalto, gárgulas e grelhas sobre magma.' },
  LT_02: { title: 'Lost Tower — Corredores Rúnicos', description: 'Passagens de basalto, relevos antigos e tochas azuis.' },
  LT_03: { title: 'Lost Tower — Abismo de Magma', description: 'Plataforma de ferro e pedra suspensa sobre um mar de magma.' },
  LT_04: { title: 'Lost Tower — Sacadas dos Demônios', description: 'Terraço de pedra negra, balaustradas e gárgulas sob um céu vermelho.' },
};

export function getScenarioConcept(id) {
  const data = SCENARIO_CONCEPTS[id];
  return data ? { ...data, src: `art/classic/scenarios/${id.toLowerCase()}.jpg` } : null;
}
