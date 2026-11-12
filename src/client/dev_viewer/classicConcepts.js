/**
 * Dossiê de Estudo Canônico dos Cenários e Biomas — Base de Engenharia Reversa
 * Fonte Autoritativa: reference/mu_roxgaming_5.2/client/Data/World* e CollisionSystem.ts
 */

export const CLASSIC_CONCEPTS = {
  LORENCIA: { file: 'lor_01', world: 'World1', description: 'Cidadela medieval de pedra, fonte com estátua alada, mercado e luz quente em meio à chuva.' },
  NORIA: { file: 'nor_01', world: 'World4', description: 'Refúgio élfico entre árvores antigas, passarelas de madeira, musgo e névoa verde.' },
  DEVIAS: { file: 'dev_01', world: 'World3', description: 'Fortaleza distante entre pinheiros nevados, muralhas geladas e pontos de luz quente.' },
  DUNGEON: { file: 'dng_01', world: 'World2', description: 'Catacumbas de pedra, arcos escuros, grades e velas, com um caminho legível até as profundezas.' },
  LOST_TOWER: { file: 'lt_01', world: 'World5', description: 'Torre gótica de basalto, escadarias antigas e luz infernal entre sombras violetas.' },
  ATLANS: { file: 'atl_01', world: 'World8', description: 'Cidade submersa em ruínas, colunas antigas, corais luminosos e águas azul-esverdeadas.' },
  TARKAN: { file: 'tar_01', world: 'World9', description: 'Deserto de cânions e templos desgastados, ossadas e uma trilha sob o céu empoeirado.' },
  ICARUS: { file: 'ica_01', world: 'World11', description: 'Ruínas celestes em ilhas flutuantes, pontes de pedra e estátuas acima das nuvens.' },
  VALLEY_OF_LOREN: { file: 'vol_01', world: 'World31', description: 'Fortaleza de cerco com portão de ferro, torres, barricadas e tochas no campo enlameado.' },
  BLOOD_CASTLE: { file: 'evt_01', world: 'World12', description: 'Ponte gótica sobre um abismo carmesim, estátuas aladas e um altar além do portão.' },
  DEVIL_SQUARE: { file: 'evt_02', world: 'World10', description: 'Arena circular de pedra negra, pentagrama gasto, totens de crânio e brasas no nevoeiro.' },
  CHAOS_CASTLE: { file: 'evt_03', world: 'World19', description: 'Coliseu suspenso sobre um abismo, lajes rachadas, ruínas góticas e luz violeta discreta.' },
  DUEL_COLISEUM: { file: 'evt_04', world: 'World6', description: 'Arena octogonal de pedra envelhecida, arquibancadas em ruínas e tochas douradas.' },
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

/** Dossiê descritivo e modelos 3D dos 56 cenários canônicos. */
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
  LT_05: { title: 'Lost Tower — Colunata Espiral', description: 'Câmara circular de basalto com colunas espirais e braseiros de crânio.' },
  LT_06: { title: 'Lost Tower — Muralhas Infernais', description: 'Antessala com fissuras de lava, canais no piso e altar de ferro negro.' },
  LT_07: { title: 'Lost Tower — Trono das Chamas', description: 'Arena no topo da torre com trono de basalto, obeliscos de magma e abismo.' },
  ATL_01: { title: 'Atlans — Areias Peroladas', description: 'Fundo oceânico com areia clara, luz filtrada, algas e uma estátua partida.' },
  ATL_02: { title: 'Atlans — Santuário de Nácar', description: 'Plataforma circular, arcos curvos, pedestal e domo de ar submerso.' },
  ATL_03: { title: 'Atlans — Labirinto de Corais', description: 'Caminhos sinuosos entre recifes de corais, anêmonas e esponjas.' },
  ATL_04: { title: 'Atlans — Trincheira das Correntes', description: 'Desfiladeiro submarino atravessado por quatro anéis rúnicos.' },
  ATL_05: { title: 'Atlans — Cemitério dos Leviatãs', description: 'Costelas fósseis gigantes formam arcos sobre a areia e um crânio antigo.' },
  ATL_06: { title: 'Atlans — Fendas Hidrotermais', description: 'Chaminés de basalto e fissuras quentes entre fumaça mineral e bolhas.' },
  ATL_07: { title: 'Atlans — Fossa da Hidra', description: 'Arena abissal circular com corais venenosos e três pedestais de cobertura.' },
  TAR_01: { title: 'Tarkan — Dunas Carmesim', description: 'Dunas ocres com engrenagens e antigas máquinas de guerra soterradas.' },
  TAR_02: { title: 'Tarkan — Oásis da Miragem', description: 'Lago sulfúrico entre troncos fossilizados e cactos escuros.' },
  TAR_03: { title: 'Tarkan — Espinha do Deserto', description: 'Desfiladeiro de arenito vermelho com costelas e vértebras fósseis.' },
  TAR_04: { title: 'Tarkan — Cemitério de Rodas', description: 'Campo de batalha com rodas mecânicas quebradas, catapultas e estacas.' },
  TAR_05: { title: 'Tarkan — Cratera de Areia', description: 'Arena circular de dunas com areia movediça e obeliscos de rocha.' },
  ICA_01: { title: 'Icarus — Cidadela Celeste', description: 'Platô flutuante com monólito central, ilhas satélites e passarelas luminosas.' },
  ICA_02: { title: 'Icarus — Ninho de Lótus', description: 'Arena de obsidiana em forma de lótus sobre o abismo estelar.' },
  VOL_01: { title: 'Valley of Loren — Campo de Guerra', description: 'Acampamento de cerco com catapultas, tendas, trincheiras e paliçadas.' },
  VOL_02: { title: 'Valley of Loren — Portão Ciclópico', description: 'Portão monumental de ferro entre torres e muralhas fortificadas.' },
  VOL_03: { title: 'Valley of Loren — Pátio das Estátuas', description: 'Pátio de cerco com quatro estátuas de alabastro e canhões defensivos.' },
  VOL_04: { title: 'Valley of Loren — Ponte Levadiça', description: 'Ponte de carvalho e ferro sobre o fosso de lava, com caldeiras defensivas.' },
  VOL_05: { title: 'Valley of Loren — Salão do Trono', description: 'Trono imperial, selo da coroa, pedestais sagrados e colunas de alabastro.' },
  EVT_01: { title: 'Blood Castle — Ponte do Martírio', description: 'Ponte gótica sobre o abismo com estátuas aladas, portão e altar.' },
  EVT_02: { title: 'Devil Square — Praça Pentagramal', description: 'Arena circular com pentagrama, totens de crânios e pedestal central.' },
  EVT_03: { title: 'Chaos Castle — Lajes Suspensas', description: 'Plataforma modular de lajes sobre o abismo, cercada por ruínas e névoa.' },
  EVT_04: { title: 'Coliseu de Duelos — Arena da Glória', description: 'Tablado octogonal, arquibancadas, tochas e barreira de proteção.' },
};

export function getScenarioConcept(id) {
  const data = SCENARIO_CONCEPTS[id];
  return data
    ? {
        ...data,
        src: `models/scenarios/${id.toLowerCase()}.glb`,
        modelGlb: `models/scenarios/${id.toLowerCase()}.glb`,
      }
    : null;
}

/** Blockouts 3D de todos os 56 cenários canônicos. */
export const SCENARIO_BLOCKOUTS = Object.keys(SCENARIO_CONCEPTS);
export function getScenarioBlockout(id) {
  const aliases = {
    LORENCIA: 'LOR_01', NORIA: 'NOR_01', DEVIAS: 'DEV_01', DUNGEON: 'DNG_01',
    LOST_TOWER: 'LT_01', ATLANS: 'ATL_01', TARKAN: 'TAR_01', ICARUS: 'ICA_01',
    VALLEY_OF_LOREN: 'VOL_01', BLOOD_CASTLE: 'EVT_01', DEVIL_SQUARE: 'EVT_02',
    CHAOS_CASTLE: 'EVT_03', DUEL_COLISEUM: 'EVT_04',
  };
  const scenarioId = aliases[id] || id;
  return SCENARIO_BLOCKOUTS.includes(scenarioId)
    ? `models/scenarios/${scenarioId.toLowerCase()}.glb`
    : null;
}
