/**
 * DASI MMORPG — MOTOR DO ESTÚDIO DE VALIDAÇÃO CANÔNICA (SIM / NÃO)
 * WebGL Three.js PBR, Inspeção de Colisão Física e Registro de Homologação.
 */

import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { OrbitControls } from './libs/OrbitControls.js';

// ============================================================================
// 1. CATÁLOGO MESTRE DOS 23 ASSETS CANÔNICOS OFICIAIS
// ============================================================================
export const VALIDATION_CATALOG = [
  // --- MODELO BASE GOLDEN MASTER (INSPEÇÃO MODULAR DE CAMADAS) ---
  {
    id: 'HERO_DK_MASTER',
    category: 'HERO',
    name: 'Dark Knight (Golden Master Base)',
    subtitle: 'Corpo Completo & Camadas Modulares Canônicas • Dragon Set + 2 Armas',
    glb: 'models/hero_dk_master_base.glb',
    sourceBmd: 'Player01.bmd + Helm03 + Armor03 + Pant03 + Glove03 + Boot03 + Wings01 + Sword02/Sword01',
    collision: { radius: 0.45, height: 1.85, step: 0.35 },
    lore: 'Arquitetura canônica de alta fidelidade: anatomia humana com malhas independentes (cabeça, tronco, mãos, pernas e pés), armadura de placas completa de encaixe perfeito, asas de dragão articuladas e armas clássicas.',
    isModularMaster: true,
  },
  // --- 5 CLASSES HEROICAS ---
  {
    id: 'DK',
    category: 'HERO',
    name: 'Dark Knight (Blade Knight)',
    subtitle: 'Guerreiro Corporal de Lorencia • Dragon Set + Dragon Blade',
    glb: 'models/animated_heroes/hero_dk_animated.glb',
    masterGlb: 'models/hero_dk_master_base.glb',
    animatedGlb: 'models/animated_heroes/hero_dk_animated.glb',
    sourceBmd: 'HelmClass02, HelmMale02, ArmorMale02, Wing06, Sword02, Sword17.bmd',
    collision: { radius: 0.45, height: 1.85, step: 0.35 },
    lore: 'Especialista em combate corpo a corpo, armadura pesada de placas carmesim e corte giratório (Twisting Slash).',
    isModularMaster: true,
  },
  {
    id: 'DW',
    category: 'HERO',
    name: 'Dark Wizard (Soul Master)',
    subtitle: 'Mago Arcano de Lorencia • Legendary Set + Kundun Staff',
    glb: 'models/animated_heroes/hero_dw_animated.glb',
    masterGlb: 'models/hero_dw_master_base.glb',
    animatedGlb: 'models/animated_heroes/hero_dw_animated.glb',
    sourceBmd: 'HelmClass01, HelmMale04, ArmorMale04, Wing05, Staff05.bmd',
    collision: { radius: 0.45, height: 1.80, step: 0.35 },
    lore: 'Mestre das artes arcanas elementais, canalizador de tempestades elétricas, nevascas e escudo de mana.',
    isModularMaster: true,
  },
  {
    id: 'ELF',
    category: 'HERO',
    name: 'Fairy Elf (Muse Elf)',
    subtitle: 'Arqueira dos Bosques de Noria • Guardian Set + Celestial Bow',
    glb: 'models/animated_heroes/hero_elf_animated.glb',
    masterGlb: 'models/hero_elf_master_base.glb',
    animatedGlb: 'models/animated_heroes/hero_elf_animated.glb',
    sourceBmd: 'HelmClass03, HelmElf05, ArmorElf05, Wing04, Bow04.bmd',
    collision: { radius: 0.42, height: 1.75, step: 0.35 },
    lore: 'Sentinela de combate à distância, agilidade extrema, disparos múltiplos (Triple Shot) e bênçãos de suporte.',
    isModularMaster: true,
  },
  {
    id: 'MG',
    category: 'HERO',
    name: 'Magic Gladiator (Duel Master)',
    subtitle: 'Guerreiro Híbrido de Lorencia • Storm Crow Set + Rune Blade',
    glb: 'models/animated_heroes/hero_mg_animated.glb',
    masterGlb: 'models/hero_mg_master_base.glb',
    animatedGlb: 'models/animated_heroes/hero_mg_animated.glb',
    sourceBmd: 'HelmClass04, ArmorMale16, PantMale16, Wing07, Sword16, Sword10.bmd',
    collision: { radius: 0.48, height: 1.90, step: 0.35 },
    lore: 'Cavaleiro místico capaz de empunhar lâminas pesadas e conjurar simultaneamente magias de destruição em massa.',
    isModularMaster: true,
  },
  {
    id: 'DL',
    category: 'HERO',
    name: 'Dark Lord (Lord Emperor)',
    subtitle: 'Soberano das Trevas do Vale de Loren • Dark Steel Set + Scepter',
    glb: 'models/animated_heroes/hero_dl_animated.glb',
    masterGlb: 'models/hero_dl_master_base.glb',
    animatedGlb: 'models/animated_heroes/hero_dl_animated.glb',
    sourceBmd: 'HelmClass05, HelmMale28, ArmorMale28, DarkLordRobe02, Mace05.bmd',
    collision: { radius: 0.48, height: 1.90, step: 0.35 },
    lore: 'Comandante imperial armado com cetro real, capa de liderança e controle absoluto sobre tropas e invocações.',
    isModularMaster: true,
  },

  // --- 6 CHEFES DE BIOMA ---
  {
    id: 'GORGON',
    category: 'BOSS',
    name: 'Gorgon',
    subtitle: 'Soberano do Abismo de Dungeon • Monster12.bmd + Staff05.bmd',
    glb: 'models/bestiary/gorgon.glb',
    sourceBmd: 'Monster12.bmd (Gorgon) + Staff05.bmd (Cajado Serpentino)',
    collision: { radius: 0.85, height: 2.40, step: 0.35 },
    lore: 'Entidade ofídica ancestral armada com báculo encantado que petrifica intrusos nas profundezas de Dungeon.',
  },
  {
    id: 'ICE_QUEEN',
    category: 'BOSS',
    name: 'Ice Queen',
    subtitle: 'A Rainha Glacial de Devias • Monster19.bmd + Staff02.bmd',
    glb: 'models/bestiary/ice_queen.glb',
    sourceBmd: 'Monster19.bmd (Ice Queen) + Staff02.bmd (Cetro de Gelo)',
    collision: { radius: 0.55, height: 2.00, step: 0.35 },
    lore: 'Monarca das neves eternas de Devias, capaz de desacelerar o movimento de combatentes com geada mortal.',
  },
  {
    id: 'BALROG',
    category: 'BOSS',
    name: 'Balrog',
    subtitle: 'Lorde Vulcânico de Lost Tower • Monster28.bmd + Spear10.bmd',
    glb: 'models/bestiary/balrog.glb',
    sourceBmd: 'Monster28.bmd (Balrog) + Spear10.bmd (Foice das Chamas)',
    collision: { radius: 1.10, height: 3.20, step: 0.45 },
    lore: 'Demônio alado de magma que patrulha o topo de Lost Tower desferindo golpes incendiários devastadores.',
  },
  {
    id: 'HYDRA',
    category: 'BOSS',
    name: 'Hydra',
    subtitle: 'Serpente das Profundezas de Atlans • Monster38.bmd (7 malhas)',
    glb: 'models/bestiary/hydra.glb',
    sourceBmd: 'Monster38.bmd (Hydra Submeshes 0..6)',
    collision: { radius: 1.40, height: 3.00, step: 0.45 },
    lore: 'Serpente aquática colossal com múltiplos corpos articulados e escamas bioluminescentes no oceano de Atlans.',
  },
  {
    id: 'ZAIKAN',
    category: 'BOSS',
    name: 'Zaikan',
    subtitle: 'O Demônio do Deserto Carmesim de Tarkan • Monster43.bmd',
    glb: 'models/bestiary/zaikan.glb',
    sourceBmd: 'Monster43.bmd (Zaikan Submeshes 0..2)',
    collision: { radius: 1.20, height: 2.80, step: 0.45 },
    lore: 'Titã escorpiônico mutante que emerge das tempestades de areia de Tarkan com ferrões perfurantes de alto impacto.',
  },
  {
    id: 'KUNDUN',
    category: 'BOSS',
    name: 'Kundun',
    subtitle: 'Lorde da Escuridão e Caos de Kalima • Monster65.bmd + Staff12.bmd',
    glb: 'models/bestiary/kundun.glb',
    sourceBmd: 'Monster65.bmd (10 malhas) + Staff12.bmd (Cajado do Caos)',
    collision: { radius: 1.50, height: 3.60, step: 0.45 },
    lore: 'O Supremo Mestre do Caos de Kalima. Detém 10 sub-malhas de pura energia caótica e o lendário cajado do abismo.',
  },

  // --- 6 CRIATURAS DA INVASÃO DOURADA ---
  {
    id: 'GOLDEN_BUDGE_DRAGON',
    category: 'GOLDEN',
    name: 'Golden Budge Dragon',
    subtitle: 'Pequeno Dragão Áureo de Lorencia • Monster03.bmd (PBR Ouro)',
    glb: 'models/bestiary/golden_budge_dragon.glb',
    sourceBmd: 'Monster03.bmd (Budge Dragon) + Multiplicador Dourado PBR',
    collision: { radius: 0.40, height: 1.00, step: 0.25 },
    lore: 'Alvo áureo primordial das primeiras invasões que dropa a lendária Box of Kundun +1 ao ser derrotado.',
  },
  {
    id: 'GOLDEN_TITAN',
    category: 'GOLDEN',
    name: 'Golden Titan',
    subtitle: 'Colosso Áureo de Lorencia • Monster06.bmd + Axe03.bmd',
    glb: 'models/bestiary/golden_titan.glb',
    sourceBmd: 'Monster06.bmd + Axe03.bmd (Machado Solar)',
    collision: { radius: 0.90, height: 2.60, step: 0.40 },
    lore: 'Guerreiro gigante revestido em ouro polido armado com machado pesado de combate.',
  },
  {
    id: 'GOLDEN_SOLDIER',
    category: 'GOLDEN',
    name: 'Golden Soldier',
    subtitle: 'Sentinela Dourado de Devias • Monster30.bmd + Sword15.bmd',
    glb: 'models/bestiary/golden_soldier.glb',
    sourceBmd: 'Monster30.bmd + Sword15.bmd (Lâmina Solar)',
    collision: { radius: 0.60, height: 2.10, step: 0.35 },
    lore: 'Sentinela blindado que acompanha as tropas invasoras com espada áurea e alta velocidade de ataque.',
  },
  {
    id: 'GOLDEN_DRAGON',
    category: 'GOLDEN',
    name: 'Golden Dragon',
    subtitle: 'Grande Dragão Alado Dourado • Monster32.bmd',
    glb: 'models/bestiary/golden_dragon.glb',
    sourceBmd: 'Monster32.bmd (Grande Dragão Dourado)',
    collision: { radius: 1.20, height: 2.80, step: 0.45 },
    lore: 'Predador alado supremo que sobrevoa Lorencia e Noria durante invasões douradas anunciadas no servidor.',
  },
  {
    id: 'GOLDEN_LIZARD_KING',
    category: 'GOLDEN',
    name: 'Golden Lizard King',
    subtitle: 'Monarca Sauriano Dourado de Atlans • Monster37.bmd + Staff07.bmd',
    glb: 'models/bestiary/golden_lizard_king.glb',
    sourceBmd: 'Monster37.bmd + Staff07.bmd (Cajado Ofídico)',
    collision: { radius: 0.85, height: 2.40, step: 0.40 },
    lore: 'Líder dos répteis marinhos imbuído pelo poder da invasão áurea, com alta regeneração e dano mágico.',
  },
  {
    id: 'GOLDEN_TANTALOS',
    category: 'GOLDEN',
    name: 'Golden Tantalos',
    subtitle: 'Guardião Áureo de Tarkan • Monster43.bmd',
    glb: 'models/bestiary/golden_tantalos.glb',
    sourceBmd: 'Monster43.bmd (Tantalos Áureo)',
    collision: { radius: 1.20, height: 2.80, step: 0.45 },
    lore: 'O guardião do deserto de Tarkan em versão dourada, portador da Box of Kundun +5.',
  },

  // --- 6 CRIATURAS DE CAMPO CLÁSSICAS ---
  {
    id: 'SPIDER',
    category: 'FIELD',
    name: 'Spider',
    subtitle: 'Aranha Venenosa das Planícies • Monster10.bmd',
    glb: 'models/bestiary/spider.glb',
    sourceBmd: 'Monster10.bmd (Spider)',
    collision: { radius: 0.45, height: 0.70, step: 0.25 },
    lore: 'Criatura inicial das planícies com movimentos rápidos de patas e ferrões de peçonha leve.',
  },
  {
    id: 'BULL_FIGHTER',
    category: 'FIELD',
    name: 'Bull Fighter',
    subtitle: 'Minotauro Brutal de Lorencia • Monster01.bmd',
    glb: 'models/bestiary/bull_fighter.glb',
    sourceBmd: 'Monster01.bmd (Bull Fighter)',
    collision: { radius: 0.65, height: 1.90, step: 0.35 },
    lore: 'Minotauro couraçado que avança em investida física contra guerreiros novatos nos portões de Lorencia.',
  },
  {
    id: 'HOUND',
    category: 'FIELD',
    name: 'Hound',
    subtitle: 'Cão Infernal de Lorencia • Monster02.bmd',
    glb: 'models/bestiary/hound.glb',
    sourceBmd: 'Monster02.bmd (Hound)',
    collision: { radius: 0.50, height: 1.10, step: 0.30 },
    lore: 'Fera canina veloz com mandíbulas afiadas e dentes de predador que caça em matilha nos arredores da cidade.',
  },
  {
    id: 'SKELETON',
    category: 'FIELD',
    name: 'Skeleton',
    subtitle: 'Guerreiro Esqueleto de Dungeon • Monster15.bmd',
    glb: 'models/bestiary/skeleton.glb',
    sourceBmd: 'Monster15.bmd (Skeleton Warrior)',
    collision: { radius: 0.45, height: 1.80, step: 0.35 },
    lore: 'Restos mortais reanimados empunhando espadas de ferro enferrujadas nos corredores sombrios de Dungeon.',
  },
  {
    id: 'LICH',
    category: 'FIELD',
    name: 'Lich',
    subtitle: 'Feiticeiro Necromante de Dungeon • Monster05.bmd',
    glb: 'models/bestiary/lich.glb',
    sourceBmd: 'Monster05.bmd (Lich Necromancer)',
    collision: { radius: 0.55, height: 1.90, step: 0.35 },
    lore: 'Necromante flutuante com túnica mágica que conjura orbes venenosos e feitiços de maldição à distância.',
  },
  {
    id: 'DEATH_KNIGHT',
    category: 'FIELD',
    name: 'Death Knight',
    subtitle: 'Cavaleiro da Morte de Lost Tower • Monster30.bmd + Sword15.bmd',
    glb: 'models/bestiary/death_knight.glb',
    sourceBmd: 'Monster30.bmd + Sword15.bmd (Lâmina da Morte)',
    collision: { radius: 0.60, height: 2.10, step: 0.35 },
    lore: 'Guerreiro caído de Lost Tower revestido em armadura negra com cortes pesados de lâmina larga.',
  },

  // --- 6 CONJUNTOS DE ARMADURA DE MUSEU (SETS COMPLETOS) ---
  {
    id: 'SET_DRAGON',
    category: 'ARMOR',
    name: 'Dragon Armor Set',
    subtitle: 'Conjunto de Placas do Dragão Vermelho • Dark Knight / Magic Gladiator',
    glb: 'models/armory/armor_set_dragon.glb',
    sourceBmd: 'Item08.bmd (ArmorMale02.bmd, HelmMale02.bmd, PantMale02.bmd, GloveMale02.bmd, BootMale02.bmd)',
    collision: { radius: 0.45, height: 1.85, step: 0.35 },
    lore: 'Armadura pesada de placas carmesim esculpida com escamas e garras de dragão ancestral. O conjunto mais icônico dos cavaleiros de Lorencia.',
  },
  {
    id: 'SET_DARK_PHOENIX',
    category: 'ARMOR',
    name: 'Dark Phoenix Armor Set',
    subtitle: 'Conjunto Imperial da Fênix Negra • Blade Knight',
    glb: 'models/armory/armor_set_dark_phoenix.glb',
    sourceBmd: 'Item08.bmd (ArmorMale17.bmd, HelmMale17.bmd, PantMale17.bmd, GloveMale17.bmd, BootMale17.bmd)',
    collision: { radius: 0.45, height: 1.88, step: 0.35 },
    lore: 'Conjunto de placas negras e carmesim forjado nas cinzas da Fênix do Caos de Icarus, com alta absorção de dano físico e defesa massiva.',
  },
  {
    id: 'SET_LEGENDARY',
    category: 'ARMOR',
    name: 'Legendary Armor Set',
    subtitle: 'Conjunto Lendário das Estrelas • Dark Wizard',
    glb: 'models/armory/armor_set_legendary.glb',
    sourceBmd: 'Item08.bmd (ArmorMale04.bmd, HelmMale04.bmd, PantMale04.bmd, GloveMale04.bmd, BootMale04.bmd)',
    collision: { radius: 0.45, height: 1.80, step: 0.35 },
    lore: 'Manto azul cósmico com dragonas douradas e gemas estelares incrustadas. Potencializa a canalização de feitiços arcanos em larga escala.',
  },
  {
    id: 'SET_GRAND_SOUL',
    category: 'ARMOR',
    name: 'Grand Soul Armor Set',
    subtitle: 'Conjunto do Arquimago Astral • Soul Master',
    glb: 'models/armory/armor_set_grand_soul.glb',
    sourceBmd: 'Item08.bmd (ArmorMale18.bmd, HelmMale18.bmd, PantMale18.bmd, GloveMale18.bmd, BootMale18.bmd)',
    collision: { radius: 0.45, height: 1.82, step: 0.35 },
    lore: 'Traje de gala arcana com cristais celestes flutuantes e runas de proteção que amplificam a barreira mágica (Mana Shield).',
  },
  {
    id: 'SET_SPIRIT',
    category: 'ARMOR',
    name: 'Spirit Armor Set',
    subtitle: 'Conjunto Espiritual dos Bosques • Fairy Elf',
    glb: 'models/armory/armor_set_spirit.glb',
    sourceBmd: 'Item08.bmd (ArmorElf04.bmd, HelmElf04.bmd, PantElf04.bmd, GloveElf04.bmd, BootElf04.bmd)',
    collision: { radius: 0.42, height: 1.75, step: 0.35 },
    lore: 'Couraça leve de couro élfico e folhas encantadas de Noria, conferindo agilidade soberba e taxa de evasão aos disparos de arco.',
  },
  {
    id: 'SET_DIVINE',
    category: 'ARMOR',
    name: 'Divine Armor Set',
    subtitle: 'Conjunto Sagrado da Luz Celestial • Muse Elf',
    glb: 'models/armory/armor_set_divine.glb',
    sourceBmd: 'Item08.bmd (ArmorElf16.bmd, HelmElf16.bmd, PantElf16.bmd, GloveElf16.bmd, BootElf16.bmd)',
    collision: { radius: 0.42, height: 1.76, step: 0.35 },
    lore: 'Armadura perolada abençoada pelas deusas antigas com filigranas de ouro e plumas alvas, oferecendo suporte e defesa superiores.',
  },

  // --- 13 ARMAS CLÁSSICAS & ESCUDOS GÓTICOS ---
  {
    id: 'DRAGON_BLADE',
    category: 'WEAPON',
    name: 'Dragon Blade',
    subtitle: 'Lâmina do Dragão Carmesim • Dark Knight / Magic Gladiator',
    glb: 'models/armory/dragon_blade.glb',
    sourceBmd: 'Item00.bmd (Sword02.bmd)',
    collision: { radius: 0.25, height: 1.45, step: 0.15 },
    lore: 'Lâmina colossal forjada no sangue de dragões vermelhos com espinha dorsal serrilhada e guarda esculpida em chifres pontiagudos.',
  },
  {
    id: 'ARCHANGEL_SWORD',
    category: 'WEAPON',
    name: 'Sword of Archangel',
    subtitle: 'A Espada Sagrada do Arcanjo • Dark Knight / Magic Gladiator',
    glb: 'models/armory/archangel_sword.glb',
    sourceBmd: 'Item00.bmd (Sword17.bmd)',
    collision: { radius: 0.25, height: 1.50, step: 0.15 },
    lore: 'A lâmina santa resgatada do Blood Castle com asas querubínicas douradas na empunhadura e resplendor de luz pura.',
  },
  {
    id: 'CHAOS_DRAGON_AXE',
    category: 'WEAPON',
    name: 'Chaos Dragon Axe',
    subtitle: 'Machado das Chamas do Caos • Dark Knight',
    glb: 'models/armory/chaos_dragon_axe.glb',
    sourceBmd: 'Item01.bmd (Axe03.bmd)',
    collision: { radius: 0.30, height: 1.40, step: 0.15 },
    lore: 'Machado pesado de combate forjado na Máquina do Caos de Noria com lâminas gêmeas em crescente e núcleo incandescente.',
  },
  {
    id: 'SWORD_OF_DESTRUCTION',
    category: 'WEAPON',
    name: 'Sword of Destruction',
    subtitle: 'Espada Demoníaca da Destruição • Dark Knight / Magic Gladiator',
    glb: 'models/armory/sword_of_destruction.glb',
    sourceBmd: 'Item00.bmd (Sword15.bmd)',
    collision: { radius: 0.25, height: 1.55, step: 0.15 },
    lore: 'Espada lendária forjada nas profundezas vulcânicas de Lost Tower com canal central de magma e alto poder de perfuração.',
  },
  {
    id: 'KUNDUN_STAFF',
    category: 'WEAPON',
    name: 'Staff of Kundun',
    subtitle: 'Cajado Supremo do Lorde do Caos • Dark Wizard',
    glb: 'models/armory/kundun_staff.glb',
    sourceBmd: 'Item05.bmd (Staff05.bmd)',
    collision: { radius: 0.25, height: 1.80, step: 0.15 },
    lore: 'Báculo ancestral com serpentes douradas entrelaçadas segurando um orbe de plasma estelar flutuante com anéis giratórios.',
  },
  {
    id: 'CHAOS_LIGHTNING_STAFF',
    category: 'WEAPON',
    name: 'Chaos Lightning Staff',
    subtitle: 'Cajado Voltaico do Caos • Dark Wizard',
    glb: 'models/armory/chaos_lightning_staff.glb',
    sourceBmd: 'Item05.bmd (Staff02.bmd)',
    collision: { radius: 0.25, height: 1.75, step: 0.15 },
    lore: 'Canalizador de relâmpagos puros com pontas em tridente de ferro negro que geram centelhas e potenciam tempestades elétricas.',
  },
  {
    id: 'CELESTIAL_BOW',
    category: 'WEAPON',
    name: 'Celestial Bow',
    subtitle: 'Arco Divino da Luz Esmeralda • Fairy Elf',
    glb: 'models/armory/celestial_bow.glb',
    sourceBmd: 'Item04.bmd (Bow04.bmd)',
    collision: { radius: 0.25, height: 1.60, step: 0.15 },
    lore: 'Arco sagrado esculpido a partir de galhos da Árvore da Vida de Noria, disparando flechas de fótons e luz espiritual.',
  },
  {
    id: 'GREAT_REIGN_CROSSBOW',
    category: 'WEAPON',
    name: 'Great Reign Crossbow',
    subtitle: 'Besta Pesada Imperial de Repetição • Fairy Elf',
    glb: 'models/armory/great_reign_crossbow.glb',
    sourceBmd: 'Item04.bmd (Bow08.bmd)',
    collision: { radius: 0.30, height: 1.10, step: 0.15 },
    lore: 'Engenharia balística avançada de aço e latão com tambor rotativo capaz de disparar rajadas consecutivas de projéteis penetrantes.',
  },
  {
    id: 'RUNE_BLADE',
    category: 'WEAPON',
    name: 'Rune Blade of Aether',
    subtitle: 'Lâmina Rúnica Mágica • Magic Gladiator',
    glb: 'models/armory/rune_blade.glb',
    sourceBmd: 'Item00.bmd (Sword16.bmd)',
    collision: { radius: 0.25, height: 1.40, step: 0.15 },
    lore: 'Espada rúnica equilibrada para canalizar poder físico e encantos arcanos simultaneamente, exclusiva dos Gladiadores Mágicos.',
  },
  {
    id: 'LORD_SCEPTER',
    category: 'WEAPON',
    name: 'Imperial Lord Scepter',
    subtitle: 'Cetro Real do Soberano • Dark Lord',
    glb: 'models/armory/lord_scepter.glb',
    sourceBmd: 'Item02.bmd (Mace05.bmd)',
    collision: { radius: 0.25, height: 1.35, step: 0.15 },
    lore: 'Símbolo de comando e liderança do Soberano das Trevas, amplificando o poder do Dark Raven e o choque de Fire Burst.',
  },
  {
    id: 'DRAGON_SHIELD',
    category: 'WEAPON',
    name: 'Dragon Shield',
    subtitle: 'Escudo de Escamas de Dragão • Dark Knight / Magic Gladiator',
    glb: 'models/armory/dragon_shield.glb',
    sourceBmd: 'Item06.bmd (Shield04.bmd)',
    collision: { radius: 0.35, height: 1.15, step: 0.15 },
    lore: 'Baluarte gótico em formato de cabeça de dragão de ferro fundido com dentes pontiagudos e alta taxa de bloqueio.',
  },
  {
    id: 'TOWER_SHIELD',
    category: 'WEAPON',
    name: 'Tower Shield',
    subtitle: 'Escudo de Torre dos Cavaleiros Reais • Dark Knight / Dark Lord',
    glb: 'models/armory/tower_shield.glb',
    sourceBmd: 'Item06.bmd (Shield03.bmd)',
    collision: { radius: 0.40, height: 1.40, step: 0.15 },
    lore: 'Grande escudo de corpo retangular com reforços de aço e brasão imperial de Lorencia, bloqueando ataques frontais maciços.',
  },
  {
    id: 'SKULL_SHIELD',
    category: 'WEAPON',
    name: 'Skull Shield',
    subtitle: 'Escudo do Crânio Espectral • Dark Knight / Dark Wizard / Magic Gladiator',
    glb: 'models/armory/skull_shield.glb',
    sourceBmd: 'Item06.bmd (Shield02.bmd)',
    collision: { radius: 0.35, height: 1.10, step: 0.15 },
    lore: 'Escudo esculpido na face de uma ossada demoníaca com órbitas vermelhas luminescentes e afinidade arcana.',
  },

  // --- 7 CRIATURAS DO BESTIÁRIO ANIMADO & FAUNA ---
  {
    id: 'DEMON',
    category: 'CREATURE',
    name: 'Demon',
    subtitle: 'Demônio Alado das Profundezas • Monster22.bmd',
    glb: 'models/monsters/demon_animated.glb',
    sourceBmd: 'Monster22.bmd (Demon)',
    collision: { radius: 0.70, height: 2.50, step: 0.35 },
    lore: 'Fera alada com garras incisivas e chifres demoníacos que voa sobre labirintos e torres infernais.',
  },
  {
    id: 'DRAGON',
    category: 'CREATURE',
    name: 'Red Dragon',
    subtitle: 'Dragão Vermelho Predador de Lorencia • Monster18.bmd',
    glb: 'models/monsters/dragon_animated.glb',
    sourceBmd: 'Monster18.bmd (Red Dragon)',
    collision: { radius: 0.85, height: 2.20, step: 0.35 },
    lore: 'Réptil predador alado que assola as planícies com sopros de fogo concentrado e ataques aéreos velozes.',
  },
  {
    id: 'GHOST',
    category: 'CREATURE',
    name: 'Ghost',
    subtitle: 'Aparição Espectral de Dungeon • Monster09.bmd',
    glb: 'models/monsters/ghost_animated.glb',
    sourceBmd: 'Monster09.bmd (Ghost)',
    collision: { radius: 0.45, height: 1.80, step: 0.35 },
    lore: 'Espírito desencarnado translúcido que flutua pelos corredores subterrâneos emitindo lamentos ensurdecedores.',
  },
  {
    id: 'ORC',
    category: 'CREATURE',
    name: 'Orc Warrior',
    subtitle: 'Guerreiro Orc das Estepes • Monster26.bmd',
    glb: 'models/monsters/orc_animated.glb',
    sourceBmd: 'Monster26.bmd (Orc Warrior)',
    collision: { radius: 0.60, height: 2.00, step: 0.35 },
    lore: 'Combatente bárbaro brutal armado com porrete pesado e escudo de madeira bruta.',
  },
  {
    id: 'SKELETON_WARRIOR',
    category: 'CREATURE',
    name: 'Skeleton Warrior',
    subtitle: 'Guerreiro Esqueleto Couraçado • Monster16.bmd',
    glb: 'models/monsters/skeleton_warrior_animated.glb',
    sourceBmd: 'Monster16.bmd (Skeleton Warrior)',
    collision: { radius: 0.50, height: 1.85, step: 0.35 },
    lore: 'Restos mortais blindados com elmo de ferro e espada reta forjada para combate impiedoso.',
  },
  {
    id: 'YETI',
    category: 'CREATURE',
    name: 'Yeti',
    subtitle: 'Besta da Nevasca de Devias • Monster21.bmd',
    glb: 'models/monsters/yeti_animated.glb',
    sourceBmd: 'Monster21.bmd (Yeti)',
    collision: { radius: 0.80, height: 2.40, step: 0.35 },
    lore: 'Predador albino peludo que golpeia o chão de gelo com força esmagadora nas tundras congeladas de Devias.',
  },
  {
    id: 'FOX',
    category: 'CREATURE',
    name: 'Silver Fox',
    subtitle: 'Raposa Silvestre dos Bosques de Lorencia • Critter01.bmd',
    glb: 'models/critters/fox_animated.glb',
    sourceBmd: 'Critter01.bmd (Wild Fox)',
    collision: { radius: 0.30, height: 0.60, step: 0.20 },
    lore: 'Pequena criatura terrestre de fauna viva com marcha e corrida ágil que reage com fuga rápida ao herói.',
  },

  // --- 13 CENÁRIOS MUNDIAIS & ARENAS CANÔNICAS ---
  {
    id: 'LORENCIA_CITADEL',
    category: 'SCENERY',
    name: 'Lorencia Citadel Plaza',
    subtitle: 'Cidadela Medieval dos Cavaleiros e Magos • Mundo 0',
    glb: 'models/lorencia_citadel.glb',
    sourceBmd: 'Terrain01.bmd / World01.att (Lorencia)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'A praça central com a Fonte do Arcanjo de bronze, o bazar mercantil, a forja do Ferreiro Han e muralhas fortificadas.',
  },
  {
    id: 'NORIA_FEYWOOD',
    category: 'SCENERY',
    name: 'Noria Feywood Sanctuary',
    subtitle: 'Santuário Élfico das Fadas & Máquina do Caos • Mundo 3',
    glb: 'models/noria_feywood.glb',
    sourceBmd: 'Terrain03.bmd / World03.att (Noria)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Floresta luminosa com raízes gigantes, pontes de madeira suspensas, vaga-lumes e a lendária Chaos Machine.',
  },
  {
    id: 'DEVIAS_BOREAL',
    category: 'SCENERY',
    name: 'Devias Boreal Citadel',
    subtitle: 'Fortaleza Glacial Sob Neve Contínua • Mundo 2',
    glb: 'models/devias_boreal.glb',
    sourceBmd: 'Terrain02.bmd / World02.att (Devias)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Cidadela de pedra congelada cercada por nevascas eternas, passadiços cobertos de gelo e o caminho para o castelo da Ice Queen.',
  },
  {
    id: 'DUNGEON_CATACOMBS',
    category: 'SCENERY',
    name: 'Dungeon Catacombs Abyss',
    subtitle: 'Catacumbas Subterrâneas e Covil de Gorgon • Mundo 1',
    glb: 'models/dungeon_catacombs.glb',
    sourceBmd: 'Terrain04.bmd / World04.att (Dungeon)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Labirinto escuro de galerias de pedra úmida, tochas espectrais, armadilhas e prisões ancestrais esquecidas.',
  },
  {
    id: 'LOST_TOWER_ABYSS',
    category: 'SCENERY',
    name: 'Lost Tower Citadel',
    subtitle: 'Torre Perdida da Ascensão Vulcânica • Mundo 4',
    glb: 'models/lost_tower_abyss.glb',
    sourceBmd: 'Terrain05.bmd / World05.att (Lost Tower)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Torre de 7 andares com rios de lava incandescentes, gárgulas de pedra e o trono superior do demônio Balrog.',
  },
  {
    id: 'ATLANS_THALASSA',
    category: 'SCENERY',
    name: 'Atlans Submerged Kingdom',
    subtitle: 'Reino Oceânico Submerso das Sereias • Mundo 7',
    glb: 'models/atlans_thalassa.glb',
    sourceBmd: 'Terrain07.bmd / World07.att (Atlans)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Cidade submersa bioluminescente com cardumes de peixes, recifes de corais, algas oscilantes e o covil da Hydra.',
  },
  {
    id: 'TARKAN_DESERT',
    category: 'SCENERY',
    name: 'Tarkan Desert Dunes',
    subtitle: 'Deserto Carmesim de Areias Escaldantes • Mundo 8',
    glb: 'models/tarkan_desert.glb',
    sourceBmd: 'Terrain08.bmd / World08.att (Tarkan)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Oceano árido de areias vermelhas com tempestades de poeira contínuas, ossadas titânicas e o domínio de Zaikan.',
  },
  {
    id: 'ICARUS_AETHEL',
    category: 'SCENERY',
    name: 'Icarus Aethel Clouds',
    subtitle: 'O Reino Celeste Acima das Nuvens • Mundo 10',
    glb: 'models/icarus_aethel.glb',
    sourceBmd: 'Terrain10.bmd / World10.att (Icarus)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Passadiços celestiais flutuando sobre nuvens etéreas, acessíveis apenas com Asas Nv 2/3 ou montaria de Dinorant.',
  },
  {
    id: 'BLOOD_CASTLE_BRIDGE',
    category: 'SCENERY',
    name: 'Blood Castle Bridge',
    subtitle: 'A Ponte Sagrada do Sangue & Portão do Castelo • Evento 1',
    glb: 'models/blood_castle_bridge.glb',
    sourceBmd: 'Terrain11.bmd / World11.att (Blood Castle)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Ponte estreita e fortificada sobre o abismo, onde guerreiros avançam em corrida contra o tempo para destruir a Porta do Castelo.',
  },
  {
    id: 'DEVIL_SQUARE_ARENA',
    category: 'SCENERY',
    name: 'Devil Square Arena',
    subtitle: 'A Arena da Sobrevivência Demoníaca • Evento 2',
    glb: 'models/events/devil_square.glb',
    sourceBmd: 'Terrain09.bmd / World09.att (Devil Square)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Arena circular cercada por fossos de fogo onde levas incessantes de monstros spawnizam por 20 minutos ininterruptos.',
  },
  {
    id: 'CHAOS_CASTLE_PLATFORM',
    category: 'SCENERY',
    name: 'Chaos Castle Platform',
    subtitle: 'Plataforma Suspensa de Battle Royale • Evento 3',
    glb: 'models/events/chaos_castle.glb',
    sourceBmd: 'Terrain18.bmd / World18.att (Chaos Castle)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Plataforma de pedra suspensa cujas bordas desmoronam à medida que combatentes disfarçados de monstros se enfrentam até restar um.',
  },
  {
    id: 'DUEL_COLISEUM_ARENA',
    category: 'SCENERY',
    name: 'Duel Coliseum Arena',
    subtitle: 'Coliseu Honorário de Combate PvP • Evento 4',
    glb: 'models/events/duel_coliseum.glb',
    sourceBmd: 'Terrain06.bmd / World06.att (Duel Coliseum)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'Coliseu imperial com arquibancadas, tochas e placar de duelo oficial até 10 abates sem penalidade de PK.',
  },
  {
    id: 'VALLEY_OF_LOREN_CITADEL',
    category: 'SCENERY',
    name: 'Valley of Loren Citadel',
    subtitle: 'Fortaleza do Cerco ao Castelo (Castle Siege) • Mundo 30',
    glb: 'models/valley_of_loren_citadel.glb',
    sourceBmd: 'Terrain30.bmd / World30.att (Castle Siege)',
    collision: { radius: 15.0, height: 6.0, step: 0.5 },
    lore: 'O colossal vale fortificado com portões de ferro, estátuas guardiãs, catapultas e a sala da Coroa do Lorde Soberano.',
  },

  // --- 10 NPCS CANÔNICOS DE LORENCIA, NORIA, DEVIAS E EVENTOS ---
  {
    id: 'NPC_HANZO',
    category: 'NPC',
    name: 'Hanzo the Blacksmith',
    subtitle: 'Mestre Ferreiro de Lorencia • Forja, Armas & Reparos',
    glb: 'models/npcs/npc_han_blacksmith.glb',
    sourceBmd: 'Monster251.bmd (Hanzo the Blacksmith) + Anvil01.bmd',
    collision: { radius: 0.45, height: 1.85, step: 0.35 },
    lore: 'O mais célebre ferreiro de Lorencia, responsável por forjar e consertar espadas, machados e armaduras de metal.',
  },
  {
    id: 'NPC_PUPA',
    category: 'NPC',
    name: 'Potion Girl Amy (Pupa)',
    subtitle: 'Boticária & Alquimista de Lorencia • Poções de Vida e Mana',
    glb: 'models/npcs/npc_pupa_pharmacist.glb',
    sourceBmd: 'Monster253.bmd (Potion Girl Amy / npcpharmercy1.bmd)',
    collision: { radius: 0.42, height: 1.80, step: 0.35 },
    lore: 'Jovem herbalista que prepara elixires de regeneração de vida e frascos de mana concentrada para os guerreiros.',
  },
  {
    id: 'NPC_GUARD',
    category: 'NPC',
    name: 'Sentinel Guard of Lorencia',
    subtitle: 'Guarda Imperial da Cidadela • Vigilância e Proteção',
    glb: 'models/npcs/npc_sentinel_guard.glb',
    sourceBmd: 'Monster247.bmd (Imperial Guard of Lorencia) + Spear01.bmd',
    collision: { radius: 0.45, height: 1.95, step: 0.35 },
    lore: 'Sentinela armado com lança imperial e escudo de torre, protegendo os portões e acessos das cidadelas contra invasões de monstros.',
  },
  {
    id: 'NPC_CHAOS_GOBLIN',
    category: 'NPC',
    name: 'Chaos Goblin of Noria',
    subtitle: 'Mestre da Fusão Arcana • Máquina do Caos (Chaos Machine)',
    glb: 'models/npcs/npc_chaos_goblin.glb',
    sourceBmd: 'Monster238.bmd (Chaos Goblin of Noria) + ChaosMachine01.bmd',
    collision: { radius: 0.40, height: 1.25, step: 0.30 },
    lore: 'Engenheiro excêntrico de Noria capaz de operar a lendária Chaos Machine para forjar Asas, Armas Chaos e itens refinados.',
  },
  {
    id: 'NPC_SEBINA',
    category: 'NPC',
    name: 'Sebina the Priest',
    subtitle: 'Sacerdotisa da Glória Glacial • Missão de 2ª Classe em Devias',
    glb: 'models/npcs/npc_sebina_priestess.glb',
    sourceBmd: 'Monster235.bmd (Sebina the Priest of Devias)',
    collision: { radius: 0.45, height: 1.90, step: 0.35 },
    lore: 'Sacerdotisa sagrada de Devias que orienta cavaleiros, magos e elfas em suas provações para alcançar o nível de Blade Knight, Soul Master e Muse Elf.',
  },
  {
    id: 'NPC_LUMEN',
    category: 'NPC',
    name: 'Lumen the Barmaid',
    subtitle: 'Garçonete da Taverna de Lorencia • Bebidas, Vigor e Boatos',
    glb: 'models/npcs/npc_lumen_barmaid.glb',
    sourceBmd: 'Monster255.bmd (Lumen the Barmaid of Lorencia)',
    collision: { radius: 0.42, height: 1.75, step: 0.35 },
    lore: 'Anfitriã da famosa taverna central de Lorencia, servindo canecas de cerveja artesanal e acolhendo heróis cansados de batalha.',
  },
  {
    id: 'NPC_LALA',
    category: 'NPC',
    name: 'Elf Lala the Craftswoman',
    subtitle: 'Artesã dos Bosques de Noria • Flechas, Arcos & Aljavas',
    glb: 'models/npcs/npc_lala_craftswoman.glb',
    sourceBmd: 'Monster242.bmd (Elf Lala of Noria)',
    collision: { radius: 0.42, height: 1.75, step: 0.35 },
    lore: 'Habilidosa arqueira e artesã que fornece aljavas infinitas e arcos leves para as elfas que partem em caçada.',
  },
  {
    id: 'NPC_LAHAP',
    category: 'NPC',
    name: 'Lahap the Jeweler',
    subtitle: 'Guardião das Joias Místicas • Compactação de Bless e Soul',
    glb: 'models/npcs/npc_lahap_jeweler.glb',
    sourceBmd: 'Monster256.bmd (Lahap the Jeweler)',
    collision: { radius: 0.45, height: 1.80, step: 0.35 },
    lore: 'Mestre joalheiro capaz de unificar pacotes de 10, 20 ou 30 Jewel of Bless e Jewel of Soul em fardos compactos.',
  },
  {
    id: 'NPC_SHADOW_PHANTOM',
    category: 'NPC',
    name: 'Shadow Phantom Soldier',
    subtitle: 'Soldado Espectral Protetor • Bênção de Ataque e Defesa',
    glb: 'models/npcs/npc_shadow_phantom.glb',
    sourceBmd: 'Monster257.bmd (Shadow Phantom Soldier)',
    collision: { radius: 0.45, height: 1.90, step: 0.35 },
    lore: 'Espírito guerreiro leal que concede bênçãos sagradas temporárias de dano e defesa reforçada para aventureiros novatos até o nível 220.',
  },
  {
    id: 'NPC_CHARON',
    category: 'NPC',
    name: 'Charon the Ferryman',
    subtitle: 'Guardião do Portal do Blood Castle • Passagem da Sangria',
    glb: 'models/npcs/npc_charon_boatman.glb',
    sourceBmd: 'Monster237.bmd (Charon of Blood Castle)',
    collision: { radius: 0.45, height: 1.85, step: 0.35 },
    lore: 'O barqueiro sombrio de Noria que recolhe a Capa da Invisibilidade e transporta os guerreiros para a ponte do Blood Castle.',
  },

  // --- 10 MONTARIAS E PETS CANÔNICOS ---
  {
    id: 'MOUNT_DARK_HORSE',
    category: 'MOUNT',
    name: 'Dark Horse',
    subtitle: 'Cavalo Negro Imperial de Guerra • Exclusivo do Dark Lord',
    glb: 'models/mounts/mount_dark_horse.glb',
    sourceBmd: 'horsev2.bmd + DarkHorseSoul.bmd + DarkHorseHorn.bmd',
    collision: { radius: 0.75, height: 2.30, step: 0.45 },
    lore: 'Corcel negro de combate que concede velocidade extrema, pisada de choque sísmico (Earthquake) e defesa maciça ao Soberano das Trevas.',
  },
  {
    id: 'MOUNT_FENRIR_RED',
    category: 'MOUNT',
    name: 'Red Fenrir of War',
    subtitle: 'Lobo Místico das Chamas • Montaria Suprema de Combate',
    glb: 'models/mounts/mount_fenrir_red.glb',
    sourceBmd: 'Fenrir_Ghost.bmd (Horn of Fenrir / Red Core)',
    collision: { radius: 0.80, height: 2.10, step: 0.40 },
    lore: 'Fera predadora lendária criada através de alquimia com chifres, fragmentos e garras, capaz de desferir o golpe Plasma Storm.',
  },
  {
    id: 'MOUNT_FENRIR_BLUE',
    category: 'MOUNT',
    name: 'Blue Fenrir of Protection',
    subtitle: 'Lobo Sagrado da Proteção Arcana • Absorção de Dano',
    glb: 'models/mounts/mount_fenrir_blue.glb',
    sourceBmd: 'Fenrir_Ghost.bmd (Horn of Fenrir + Protection Option)',
    collision: { radius: 0.80, height: 2.10, step: 0.40 },
    lore: 'Variante de safira do Fenrir focada em defesa e redução de dano físico recebido pelo cavaleiro.',
  },
  {
    id: 'MOUNT_FENRIR_BLACK',
    category: 'MOUNT',
    name: 'Black Fenrir of Destruction',
    subtitle: 'Lobo Sombrio da Destruição • Perfuração de Armadura',
    glb: 'models/mounts/mount_fenrir_black.glb',
    sourceBmd: 'Fenrir_Ghost.bmd (Horn of Fenrir + Destruction Option)',
    collision: { radius: 0.80, height: 2.10, step: 0.40 },
    lore: 'Lobo de ébano e chamas púrpuras que eleva a taxa de dano crítico e destrói a durabilidade da armadura dos oponentes.',
  },
  {
    id: 'MOUNT_FENRIR_GOLDEN',
    category: 'MOUNT',
    name: 'Golden Fenrir of the Emperor',
    subtitle: 'Lobo Imperial Dourado • Glória Suprema dos Soberanos',
    glb: 'models/mounts/mount_fenrir_golden.glb',
    sourceBmd: 'Fenrir_Ghost.bmd (Golden Fenrir Master)',
    collision: { radius: 0.80, height: 2.10, step: 0.40 },
    lore: 'A mais rara e prestigiosa montaria do continente, banhada em ouro solar com bônus unificados de destruição e proteção.',
  },
  {
    id: 'MOUNT_DINORANT',
    category: 'MOUNT',
    name: 'Horn of Dinorant',
    subtitle: 'Besta Réptil Alada de Noria • Voo em Icarus e Lança-Chamas',
    glb: 'models/mounts/mount_dinorant.glb',
    sourceBmd: 'dinorantv2.bmd (Horn of Dinorant)',
    collision: { radius: 0.70, height: 2.00, step: 0.40 },
    lore: 'Fusão de 10 Unirias e uma Chaos Jewel na Chaos Machine, permitindo ao cavaleiro planar no céu de Icarus e disparar baforadas de fogo.',
  },
  {
    id: 'MOUNT_UNIRIA',
    category: 'MOUNT',
    name: 'Horn of Uniria',
    subtitle: 'Unicórnio Prateado dos Cavaleiros • Montaria Clássica',
    glb: 'models/mounts/mount_uniria.glb',
    sourceBmd: 'uniriav2.bmd (Horn of Uniria)',
    collision: { radius: 0.65, height: 2.05, step: 0.40 },
    lore: 'Montaria fiel dos guerreiros em terra, aumentando a velocidade de corrida e permitindo atravessar planícies e masmorras rapidamente.',
  },
  {
    id: 'PET_DARK_RAVEN',
    category: 'MOUNT',
    name: 'Dark Raven of the Lord',
    subtitle: 'Falcão / Corvo de Batalha Aéreo • Ataque e Vigilância',
    glb: 'models/mounts/pet_dark_raven.glb',
    sourceBmd: 'ravenwhite.bmd (Dark Raven of Dark Lord)',
    collision: { radius: 0.40, height: 1.20, step: 0.20 },
    lore: 'Espírito alado imperial do Dark Lord que sobrevoa o campo de batalha atacando inimigos autonomamente ou sob comando direto.',
  },
  {
    id: 'PET_IMP_SATAN',
    category: 'MOUNT',
    name: 'Imp of Satan',
    subtitle: 'Diabrete Alado de Batalha • Bônus de Dano Físico e Mágico',
    glb: 'models/mounts/pet_imp_satan.glb',
    sourceBmd: 'Item13.bmd (Imp / Satan Pet) + w_PetActionDemon.cpp',
    collision: { radius: 0.35, height: 0.90, step: 0.20 },
    lore: 'Pequeno demônio voador que amplifica em +30% o poder de ataque do herói em troca de uma leve drenagem de vida por segundo.',
  },
  {
    id: 'PET_GUARDIAN_ANGEL',
    category: 'MOUNT',
    name: 'Guardian Angel',
    subtitle: 'Anjinho Celestial da Guarda • Absorção e Redução de Dano',
    glb: 'models/mounts/pet_guardian_angel.glb',
    sourceBmd: 'Item13.bmd (Guardian Angel Pet) + CSPetSystem.cpp',
    collision: { radius: 0.35, height: 0.95, step: 0.20 },
    lore: 'Espírito angelical que paira sobre os ombros do aventureiro absorvendo 20% do dano recebido e aumentando a vida máxima em +50 HP.',
  },

  // --- 5 ASAS E CAPAS LENDÁRIAS ---
  {
    id: 'WINGS_DRAGON',
    category: 'WINGS',
    name: 'Wings of Dragon (2ª Geração)',
    subtitle: 'Asas do Dragão Carmesim • Blade Knight & Magic Gladiator',
    glb: 'models/wings/wings_dragon_level2.glb',
    sourceBmd: 'Wing06.bmd (Wings of Dragon / Item12.bmd)',
    collision: { radius: 0.60, height: 1.60, step: 0.20 },
    lore: 'Forjadas na Chaos Machine com Pena de Loch e Asas Nv 1, conferem capacidade de voo em Icarus e absorção massiva de dano.',
  },
  {
    id: 'WINGS_SOUL',
    category: 'WINGS',
    name: 'Wings of Soul (2ª Geração)',
    subtitle: 'Asas da Alma Arcana • Soul Master & Magic Gladiator',
    glb: 'models/wings/wings_soul_level2.glb',
    sourceBmd: 'Wing05.bmd (Wings of Soul / Item12.bmd)',
    collision: { radius: 0.55, height: 1.50, step: 0.20 },
    lore: 'Asas de borboleta de cristal que amplificam a canalização de feitiços elementais e elevam o poder mágico do Soul Master.',
  },
  {
    id: 'WINGS_SPIRITS',
    category: 'WINGS',
    name: 'Wings of Spirits (2ª Geração)',
    subtitle: 'Asas Feéricas dos Espíritos • Muse Elf',
    glb: 'models/wings/wings_spirits_level2.glb',
    sourceBmd: 'Wing04.bmd (Wings of Spirits / Item12.bmd)',
    collision: { radius: 0.55, height: 1.55, step: 0.20 },
    lore: 'Asas luminosas com veios de folhas sagradas de Noria, acelerando a cadência de disparos e a velocidade de deslocamento da arqueira.',
  },
  {
    id: 'WINGS_DARKNESS',
    category: 'WINGS',
    name: 'Wings of Darkness (2ª Geração)',
    subtitle: 'Asas Abissais da Escuridão • Exclusivo do Magic Gladiator',
    glb: 'models/wings/wings_darkness_level2.glb',
    sourceBmd: 'Wing07.bmd (Wings of Darkness / Item12.bmd)',
    collision: { radius: 0.65, height: 1.60, step: 0.20 },
    lore: 'Asas pontiagudas de morcego abissal, balanceadas para equilibrar corte pesado de espada e destruição mágica em área.',
  },
  {
    id: 'CAPE_LORD',
    category: 'WINGS',
    name: 'Cape of Lord (2ª Geração)',
    subtitle: 'Manto do Soberano das Trevas • Exclusivo do Dark Lord',
    glb: 'models/wings/cape_of_lord.glb',
    sourceBmd: 'DarkLordRobe02.bmd (Cape of Lord / Item12.bmd)',
    collision: { radius: 0.50, height: 1.70, step: 0.20 },
    lore: 'Manto real de veludo carmesim forjado com a Crista do Monarca, elevando os atributos de liderança e amplificando as habilidades de suporte.',
  },

  // --- 5 HERÓIS MODULARES DE PEÇAS INDEPENDENTES ---
  {
    id: 'MODULAR_DK',
    category: 'MODULAR',
    name: 'Modular Dark Knight',
    subtitle: 'Guerreiro Modular com Camadas Desmontáveis (Elmo, Peito, Luvas, Calças, Botas)',
    glb: 'models/modular_heroes/hero_dk_modular.glb',
    sourceBmd: 'HelmClass02, HelmMale02, ArmorMale02, PantMale02, GloveMale02, BootMale02.bmd',
    collision: { radius: 0.45, height: 1.85, step: 0.35 },
    lore: 'Estrutura modular de alta fidelidade permitindo inspecionar cada peça de armadura e encaixe de armas separadamente.',
  },
  {
    id: 'MODULAR_DW',
    category: 'MODULAR',
    name: 'Modular Dark Wizard',
    subtitle: 'Mago Modular com Camadas Desmontáveis (Elmo, Robe, Luvas, Calças, Botas)',
    glb: 'models/modular_heroes/hero_dw_modular.glb',
    sourceBmd: 'HelmClass01, HelmMale04, ArmorMale04, PantMale04, GloveMale04, BootMale04.bmd',
    collision: { radius: 0.45, height: 1.80, step: 0.35 },
    lore: 'Modelo modular arcano com manto, ombreiras de cristal e cajado desmontáveis para inspeção minuciosa.',
  },
  {
    id: 'MODULAR_ELF',
    category: 'MODULAR',
    name: 'Modular Fairy Elf',
    subtitle: 'Arqueira Modular com Camadas Desmontáveis (Tiara, Peitoral, Luvas, Perneiras, Botas)',
    glb: 'models/modular_heroes/hero_elf_modular.glb',
    sourceBmd: 'HelmClass03, HelmElf05, ArmorElf05, PantElf05, GloveElf05, BootElf05.bmd',
    collision: { radius: 0.42, height: 1.75, step: 0.35 },
    lore: 'Modelo modular élfico com malhas e acessórios de Noria totalmente desacopláveis.',
  },
  {
    id: 'MODULAR_MG',
    category: 'MODULAR',
    name: 'Modular Magic Gladiator',
    subtitle: 'Gladiador Mágico Modular com Camadas Desmontáveis (Sem Elmo, Peito, Luvas, Calças, Botas)',
    glb: 'models/modular_heroes/hero_mg_modular.glb',
    sourceBmd: 'HelmClass04, ArmorMale16, PantMale16, GloveMale16, BootMale16.bmd',
    collision: { radius: 0.48, height: 1.90, step: 0.35 },
    lore: 'Cavaleiro místico modular exibindo sua anatomia de torso descoberto e armaduras pesadas encaixadas.',
  },
  {
    id: 'MODULAR_DL',
    category: 'MODULAR',
    name: 'Modular Dark Lord',
    subtitle: 'Soberano das Trevas Modular com Camadas Desmontáveis (Coroa, Peitoral, Luvas, Calças, Botas)',
    glb: 'models/modular_heroes/hero_dl_modular.glb',
    sourceBmd: 'HelmClass05, HelmMale28, ArmorMale28, PantMale28, GloveMale28, BootMale28.bmd',
    collision: { radius: 0.48, height: 1.90, step: 0.35 },
    lore: 'Comandante imperial modular com elmo com diadema, couraça reforçada e armas reais em nós modulares.',
  },
];

// ============================================================================
// 2. ARMAZENAMENTO PERSISTENTE LOCAL (localStorage)
// ============================================================================
const STORAGE_KEY = 'dasi_validation_decisions_v1';

function loadDecisions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('[Validator] Falha ao carregar decisões do localStorage:', e);
    return {};
  }
}

function saveDecisions(decisions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions));
  } catch (e) {
    console.error('[Validator] Falha ao salvar decisões no localStorage:', e);
  }
}

// ============================================================================
// 3. CLASSE CONTROLADORA DO ESTÚDIO DE VALIDAÇÃO
// ============================================================================
export class ValidationStudio {
  constructor() {
    this.catalog = VALIDATION_CATALOG;
    this.decisions = loadDecisions();
    this.activeIndex = 0;
    this.currentFilter = 'ALL';
    this.searchQuery = '';

    // Three.js State
    this.container = document.getElementById('val-canvas-container');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.clock = new THREE.Clock();

    // 3D Objects State
    this.currentModel = null;
    this.currentColliderGroup = null;
    this.gridHelper = null;
    this.mixer = null;
    this.activeAction = null;
    this.wireframeMode = false;
    this.showCollision = true;
    this.showGrid = true;
    this.showWings = true;
        this.isPlayingAnim = false; // SEMPRE COMEÇA PARADO CONFORME DIRETRIZ!

    // Estado de Camadas Modulares (Inspeção Canônica de Anatomia & Equipamentos)
    this.layersState = {
      body: true,      // Body_Head, Body_Chest, Body_Gloves, Body_Legs, Body_Boots
      helm: true,      // Armor_Helm
      chest: true,     // Armor_Chest
      gloves: true,    // Armor_Gloves
      legs: true,      // Armor_Legs
      boots: true,     // Armor_Boots
      wings: true,     // Wings_Dragon
      weapon_r: true,  // Weapon_Right
      weapon_l: true,  // Weapon_Left
    };

    // Cache de GLTF
    this.gltfLoader = new GLTFLoader();

    this.initThree();
    this.bindDOM();
    this.renderItemList();
    this.selectItem(0);
    this.updateProgressStats();
  }

  // --------------------------------------------------------------------------
  // INICIALIZAÇÃO DA CENA THREE.JS
  // --------------------------------------------------------------------------
  initThree() {
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090d);
    this.scene.fog = new THREE.FogExp2(0x07090d, 0.035);

    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;

    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 150);
    this.camera.position.set(0, 2.4, 5.2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.target.set(0, 1.2, 0);
    this.controls.minDistance = 1.0;
    this.controls.maxDistance = 25.0;

    // Iluminação PBR de Estúdio
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff3e0, 2.2);
    sunLight.position.set(5, 10, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    fillLight.position.set(-6, 4, -4);
    this.scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xf59e0b, 1.8, 15);
    rimLight.position.set(0, 4, -3);
    this.scene.add(rimLight);

    // Grid de Solo com Marcação Métrica
    this.gridHelper = new THREE.GridHelper(10, 20, 0xf59e0b, 0x334155);
    this.gridHelper.position.y = 0.0;
    this.scene.add(this.gridHelper);

    // Anel Central de Spawn
    const ringGeom = new THREE.RingGeometry(0.8, 0.85, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.005;
    this.scene.add(ringMesh);

    // Loop de Renderização
    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    if (this.mixer && this.isPlayingAnim) {
      this.mixer.update(delta);
    }

    if (this.controls) {
      this.controls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.currentModel) {
      this.fitCameraToObject(this.currentModel);
    }
  }

  // --------------------------------------------------------------------------
  // CRIAÇÃO DA CÁPSULA WIREFRAME DE COLISÃO OFICIAL (MU ONLINE)
  // --------------------------------------------------------------------------
  createCapsuleWireframe(radius, height, stepHeight) {
    const group = new THREE.Group();
    group.name = 'COLLISION_CAPSULE_VISUAL';

    const cylHeight = Math.max(0.1, height - (radius * 2));
    const cylGeom = new THREE.CylinderGeometry(radius, radius, cylHeight, 24, 1, true);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const fillMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });

    // Cilindro central
    const cylWire = new THREE.Mesh(cylGeom, wireMat);
    const cylFill = new THREE.Mesh(cylGeom, fillMat);
    const cylGroup = new THREE.Group();
    cylGroup.add(cylWire, cylFill);
    cylGroup.position.y = radius + (cylHeight / 2);
    group.add(cylGroup);

    // Cúpula superior
    const domeGeom = new THREE.SphereGeometry(radius, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeWire = new THREE.Mesh(domeGeom, wireMat);
    const domeFill = new THREE.Mesh(domeGeom, fillMat);
    const domeGroup = new THREE.Group();
    domeGroup.add(domeWire, domeFill);
    domeGroup.position.y = radius + cylHeight;
    group.add(domeGroup);

    // Cúpula inferior
    const bottomDomeGeom = new THREE.SphereGeometry(radius, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const bottomDomeWire = new THREE.Mesh(bottomDomeGeom, wireMat);
    const bottomDomeFill = new THREE.Mesh(bottomDomeGeom, fillMat);
    const bottomGroup = new THREE.Group();
    bottomGroup.add(bottomDomeWire, bottomDomeFill);
    bottomGroup.position.y = radius;
    group.add(bottomGroup);

    // Indicador de Step Height (Degrau transponível)
    if (stepHeight > 0) {
      const stepGeom = new THREE.RingGeometry(radius * 0.98, radius * 1.05, 32);
      const stepMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
      const stepMesh = new THREE.Mesh(stepGeom, stepMat);
      stepMesh.rotation.x = -Math.PI / 2;
      stepMesh.position.y = stepHeight;
      group.add(stepMesh);
    }

    return group;
  }

  // --------------------------------------------------------------------------
  // CARGA DO MODELO 3D SELECIONADO
  // --------------------------------------------------------------------------
  async loadModel(asset) {
    // Limpa modelo e colisor anterior
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.currentModel.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose();
          if (Array.isArray(o.material)) o.material.forEach((m) => m?.dispose());
          else o.material?.dispose();
        }
      });
      this.currentModel = null;
    }

    if (this.currentColliderGroup) {
      this.scene.remove(this.currentColliderGroup);
      this.currentColliderGroup = null;
    }

    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }

    this.showToast(`Carregando ${asset.name}...`);

    try {
      const gltf = await this.gltfLoader.loadAsync(asset.glb);
      const root = gltf.scene;
      root.name = `ACTIVE_VALIDATION_${asset.id}`;

      let totalVerts = 0;
      let meshCount = 0;

      root.traverse((obj) => {
        if (obj.isMesh) {
          meshCount++;
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (obj.geometry) {
            const count = obj.geometry.attributes.position ? obj.geometry.attributes.position.count : 0;
            totalVerts += count;
          }
          if (this.wireframeMode && obj.material) {
            obj.material.wireframe = true;
          }
        }
      });

      this.currentModel = root;
      this.scene.add(root);

      // Atualiza métricas geométricas no painel
      document.getElementById('val-metric-verts').textContent = totalVerts.toLocaleString('pt-BR');
      document.getElementById('val-metric-meshes').textContent = `${meshCount} sub-malhas`;

      // Cria e anexa a cápsula de colisão
      const col = asset.collision;
      this.currentColliderGroup = this.createCapsuleWireframe(col.radius, col.height, col.step);
      this.currentColliderGroup.visible = this.showCollision;
      this.scene.add(this.currentColliderGroup);

      // Aplica estado de visibilidade das asas/capas
      this.applyWingsVisibility(root);

      // Configuração de Animação (SEMPRE COMEÇA PARADO NA POSTURA ERETA IDLE/STAND!)
      const animSelect = document.getElementById('val-anim-select');
      const animBtn = document.getElementById('tool-toggle-anim');
      this.isPlayingAnim = false;
      if (animBtn) {
        animBtn.classList.remove('active');
        animBtn.textContent = '⏸️ Parado (Clique p/ Animar)';
      }

      animSelect.innerHTML = '';
      if (gltf.animations && gltf.animations.length > 0) {
        this.currentAnimations = gltf.animations;
        root.animations = gltf.animations;
        animSelect.style.display = 'inline-block';
        this.mixer = new THREE.AnimationMixer(root);

        // Seleciona clipe ereto de repouso (Idle / Stand / Breath)
        const defaultClip = gltf.animations.find(a => /^idle$/i.test(a.name)) ||
                            gltf.animations.find(a => /^idle_loop$/i.test(a.name)) ||
                            gltf.animations.find(a => /idle_shield|sword_idle/i.test(a.name)) ||
                            gltf.animations.find(a => /idle|stand|breath|rest/i.test(a.name)) ||
                            gltf.animations[0];

        gltf.animations.forEach((clip) => {
          const opt = document.createElement('option');
          opt.value = clip.name;
          opt.textContent = `🎬 ${clip.name} (${clip.duration.toFixed(1)}s)`;
          if (clip.name === defaultClip.name) {
            opt.selected = true;
          }
          animSelect.appendChild(opt);
        });

        animSelect.value = defaultClip.name;

        // Postura estática inicial ereta (Idle pausado no frame 0)
        this.activeAction = this.mixer.clipAction(defaultClip);
        this.activeAction.play();
        this.activeAction.paused = true;
        this.mixer.update(0);
        root.updateMatrixWorld(true);
      } else {
        this.currentAnimations = [];
        animSelect.style.display = 'none';
      }

      // Detecção de Camadas Modulares (Dark Knight Master Base ou similares)
      Object.keys(this.layersState).forEach(k => this.layersState[k] = true);
      // O corpo nu fica desativado por padrão sob armadura completa para evitar z-fighting
      this.layersState.body = false;
      this.syncLayerButtonsUI();

      const isModular = !!asset.isModularMaster ||
        root.children.some(c => /^(body_|armor_|weapon_|wings_)/i.test(c.name)) ||
        root.getObjectByName('Body_Head') !== null ||
        root.getObjectByName('body_blockout') !== null;

      const layersBar = document.getElementById('val-layers-bar');
      const modularSection = document.getElementById('val-modular-section');
      if (layersBar) layersBar.style.display = isModular ? 'flex' : 'none';
      if (modularSection) modularSection.style.display = isModular ? 'block' : 'none';

      if (isModular) {
        this.applyLayerVisibility();
      } else {
        this.updateModelMetrics();
      }

      // Enquadramento Ótico da Câmera com Safe Area livre de oclusão de UI
      this.fitCameraToObject(root);

    } catch (err) {
      console.error(`[Validator] Erro ao carregar GLB ${asset.glb}:`, err);
      this.showToast(`❌ Falha ao carregar ${asset.glb}`);
    }
  }

  // --------------------------------------------------------------------------
  // ENQUADRAMENTO DE CÂMERA COM SAFE AREA & VISIBILIDADE DAS ASAS
  // --------------------------------------------------------------------------
  computeVisibleBoundingBox(object) {
    const box = new THREE.Box3();
    let hasVisibleMesh = false;

    object.updateMatrixWorld(true);

    object.traverse((child) => {
      if (child.isMesh && child.visible) {
        hasVisibleMesh = true;
        if (child.isSkinnedMesh) {
          const meshBox = new THREE.Box3().setFromObject(child);
          if (!meshBox.isEmpty()) {
            box.union(meshBox);
            return;
          }
        }
        if (child.geometry) {
          if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
          if (child.geometry.boundingBox) {
            const geomBox = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
            box.union(geomBox);
          }
        }
      }
    });

    if (!hasVisibleMesh || box.isEmpty()) {
      return new THREE.Box3().setFromObject(object);
    }
    return box;
  }

  fitCameraToObject(object, padding = 1.25) {
    if (!object || !this.camera || !this.controls) return;

    object.updateMatrixWorld(true);

    const box = this.computeVisibleBoundingBox(object);
    if (box.isEmpty()) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Dimensões do viewport central
    const containerH = this.container.clientHeight || window.innerHeight || 600;
    const containerW = this.container.clientWidth || window.innerWidth || 800;

    // Altura ocupada por elementos flutuantes de UI:
    // Barra superior (.val-3d-toolbar): top 14px + altura ~48px + margem segura = ~85px
    // Barra inferior (.val-decision-bar): bottom 16px + altura ~76px + margem segura = ~120px
    const layersBar = document.getElementById('val-layers-bar');
    const hasLayersBar = layersBar && layersBar.style.display !== 'none';
    const topUiInset = hasLayersBar ? 100 : 85;
    const bottomUiInset = 120;
    const safeHeightPx = Math.max(180, containerH - (topUiInset + bottomUiInset));
    const safeHeightRatio = safeHeightPx / containerH;

    // Margem de segurança horizontal (5% em cada borda lateral)
    const safeWidthRatio = 0.90;

    const fovRad = this.camera.fov * (Math.PI / 180);
    const aspect = this.camera.aspect || (containerW / containerH);

    // Distância necessária para enquadrar perfeitamente a altura vertical dentro da Safe Area livre
    const distVertical = (size.y / 2) / (Math.tan(fovRad / 2) * safeHeightRatio);

    // Distância necessária para a largura (envergadura das asas)
    const distHorizontal = (size.x / 2) / (Math.tan(fovRad / 2) * aspect * safeWidthRatio);

    // Distância necessária para profundidade tridimensional
    const distDepth = (size.z / 2) * 0.8;

    // Distância final com padding ergonômico
    const distance = Math.max(distVertical, distHorizontal, distDepth, 4.2) * padding;

    // Compensação óptica vertical: o centro livre fica ligeiramente acima do centro da tela
    const deltaYPx = (bottomUiInset - topUiInset) / 2;
    const worldHeightAtDistance = 2 * distance * Math.tan(fovRad / 2);
    const opticalOffsetWorld = (deltaYPx / containerH) * worldHeightAtDistance;

    const targetY = center.y - opticalOffsetWorld;
    this.controls.target.set(center.x, Math.max(0.4, targetY), center.z);

    this.camera.position.set(
      center.x,
      targetY + (size.y * 0.04),
      center.z + distance
    );

    this.camera.near = 0.05;
    this.camera.far = Math.max(300, distance * 12);
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }


  // --------------------------------------------------------------------------
  // INSPEÇÃO MODULAR DE CAMADAS (ANATOMIA, ARMADURA, ASAS E ARMAS)
  // --------------------------------------------------------------------------
  updateModelMetrics() {
    if (!this.currentModel) return;

    let totalVerts = 0;
    let visibleVerts = 0;
    let totalMeshes = 0;
    let visibleMeshes = 0;
    const activeNodes = [];

    this.currentModel.traverse((obj) => {
      if (obj.isMesh) {
        totalMeshes++;
        const count = obj.geometry?.attributes?.position ? obj.geometry.attributes.position.count : 0;
        totalVerts += count;
        if (obj.visible) {
          visibleMeshes++;
          visibleVerts += count;
          activeNodes.push(obj.name || 'malha');
        }
      }
    });

    const vertElem = document.getElementById('val-metric-verts');
    const meshElem = document.getElementById('val-metric-meshes');
    if (vertElem) {
      vertElem.textContent = visibleVerts.toLocaleString('pt-BR');
      vertElem.title = `${visibleVerts.toLocaleString('pt-BR')} vértices visíveis de ${totalVerts.toLocaleString('pt-BR')} totais`;
    }
    if (meshElem) {
      meshElem.textContent = `${visibleMeshes}/${totalMeshes} nós ativos`;
      meshElem.title = `Nós ativos: ${activeNodes.join(', ')}`;
    }

    const badgeModular = document.getElementById('val-modular-badge');
    if (badgeModular) {
      badgeModular.textContent = `${visibleMeshes} / ${totalMeshes} NÓS ATIVOS`;
    }
  }

  applyLayerVisibility() {
    if (!this.currentModel) return;

    this.currentModel.traverse((child) => {
      if (!child.isMesh) return;
      const n = ((child.name || '') + ' ' + (child.parent?.name || '')).toLowerCase();

      // 1. Corpo Base (Anatomia)
      if (n.startsWith('body_') || n.includes('body_blockout') || n.includes('base_head') ||
          n.includes('base_chest') || n.includes('base_gloves') || n.includes('base_legs') || n.includes('base_boots')) {
        if (this.layersState.body) {
          child.visible = true;
        } else {
          // Substituição canônica inteligente: mostra a pele/anatomia apenas se a peça de armadura estiver oculta
          if (n.includes('head') && !this.layersState.helm) child.visible = true;
          else if (n.includes('chest') && !this.layersState.chest) child.visible = true;
          else if (n.includes('gloves') && !this.layersState.gloves) child.visible = true;
          else if (n.includes('legs') && !this.layersState.legs) child.visible = true;
          else if (n.includes('boots') && !this.layersState.boots) child.visible = true;
          else child.visible = false;
        }
      }
      // 2. Elmo
      else if (n.startsWith('armor_helm') || n.includes('slot_helmet') || n.includes('helmet') || n.includes('dragon_helm')) {
        child.visible = this.layersState.helm;
      }
      // 3. Peitoral / Ombreiras
      else if (n.startsWith('armor_chest') || n.includes('slot_chest') || n.includes('slot_shoulders') || n.includes('dragon_chest')) {
        child.visible = this.layersState.chest;
      }
      // 4. Luvas / Manoplas
      else if (n.startsWith('armor_gloves') || n.includes('slot_gloves') || n.includes('dragon_gloves')) {
        child.visible = this.layersState.gloves;
      }
      // 5. Calças / Perneiras
      else if (n.startsWith('armor_legs') || n.includes('slot_legs') || n.includes('dragon_legs')) {
        child.visible = this.layersState.legs;
      }
      // 6. Botas de Placas
      else if (n.startsWith('armor_boots') || n.includes('slot_boots') || n.includes('dragon_boots')) {
        child.visible = this.layersState.boots;
      }
      // 7. Asas / Capa
      else if (n.startsWith('wings_') || n.includes('wings') || n.includes('cape') || n.includes('mantle')) {
        child.visible = this.layersState.wings && this.showWings;
      }
      // 8. Arco (Fairy Elf)
      else if (n.includes('elf_weapon') || n.includes('bow')) {
        child.visible = this.layersState.weapon_r || this.layersState.weapon_l;
      }
      // 9. Arma Direita
      else if (n.startsWith('weapon_right') || n.includes('weapon_r') || n.includes('dragon_blade') ||
               (n.includes('weapon') && !n.includes('left') && !n.includes('archangel'))) {
        child.visible = this.layersState.weapon_r;
      }
      // 10. Arma Esquerda
      else if (n.startsWith('weapon_left') || n.includes('weapon_l') || n.includes('archangel') || n.includes('shield')) {
        child.visible = this.layersState.weapon_l;
      }
    });

    this.updateModelMetrics();
    this.fitCameraToObject(this.currentModel);
    this.syncLayerButtonsUI();
  }

  setLayerVisibility(layerKey, isVisible) {
    if (layerKey in this.layersState) {
      this.layersState[layerKey] = isVisible;
      if (layerKey === 'wings') {
        this.showWings = isVisible;
        const wingsBtn = document.getElementById('tool-toggle-wings');
        if (wingsBtn) wingsBtn.classList.toggle('active', this.showWings);
      }
      this.applyLayerVisibility();
      this.showToast(`Camada [${layerKey.toUpperCase()}] ${isVisible ? 'visível ✅' : 'oculta ❌'}`);
    }
  }

  toggleLayer(layerKey) {
    this.setLayerVisibility(layerKey, !this.layersState[layerKey]);
  }

  setLayerPreset(preset) {
    if (preset === 'ALL_ARMOR') {
      Object.keys(this.layersState).forEach(k => this.layersState[k] = true);
      this.showWings = true;
      this.showToast('✨ Armadura Completa, Asas e Armas ativadas');
    } else if (preset === 'BODY_ONLY') {
      this.layersState.body = true;
      this.layersState.helm = false;
      this.layersState.chest = false;
      this.layersState.gloves = false;
      this.layersState.legs = false;
      this.layersState.boots = false;
      this.layersState.wings = false;
      this.layersState.weapon_r = false;
      this.layersState.weapon_l = false;
      this.showWings = false;
      this.showToast('👤 Visualizando anatomia corporal limpa (sem armaduras)');
    } else if (preset === 'ARMOR_ONLY') {
      this.layersState.body = false;
      this.layersState.helm = true;
      this.layersState.chest = true;
      this.layersState.gloves = true;
      this.layersState.legs = true;
      this.layersState.boots = true;
      this.layersState.wings = true;
      this.layersState.weapon_r = true;
      this.layersState.weapon_l = true;
      this.showToast('🛡️ Visualizando conjunto de armadura de placas (sem corpo)');
    }
    const wingsBtn = document.getElementById('tool-toggle-wings');
    if (wingsBtn) wingsBtn.classList.toggle('active', this.showWings);
    this.applyLayerVisibility();
  }

  syncLayerButtonsUI() {
    const layerKeys = ['body', 'helm', 'chest', 'gloves', 'legs', 'boots', 'wings', 'weapon_r', 'weapon_l'];
    for (const key of layerKeys) {
      const active = !!this.layersState[key];
      // Barra flutuante
      const btnId = 'layer-btn-' + key.replace('_', '-');
      const btn = document.getElementById(btnId);
      if (btn) btn.classList.toggle('active', active);

      // Sidebar direita
      const tileId = 'tile-layer-' + key.replace('_', '-');
      const tile = document.getElementById(tileId);
      if (tile) {
        tile.classList.toggle('active', active);
        const toggleSpan = tile.querySelector('.val-layer-tile-toggle');
        if (toggleSpan) toggleSpan.textContent = active ? 'ON' : 'OFF';
      }
    }
  }

  applyWingsVisibility(root) {
    if (!root) return;
    root.traverse((child) => {
      if (!child.isMesh) return;
      const n = (child.name || '').toLowerCase();
      const m = (child.material?.name || '').toLowerCase();
      const isWing = n.includes('wing') || n.includes('cape') || n.includes('mantle') || n.includes('asa') ||
                     m.includes('wing') || m.includes('newingel') || m.includes('devil_wing') ||
                     m.includes('neww') || m.includes('ndw') || m.includes('level_man');
      if (isWing) {
        child.visible = this.showWings;
      }
    });
  }

  toggleWings() {
    this.showWings = !this.showWings;
    const btn = document.getElementById('tool-toggle-wings');
    if (btn) btn.classList.toggle('active', this.showWings);

    if (this.currentModel) {
      this.applyWingsVisibility(this.currentModel);
      this.fitCameraToObject(this.currentModel);
      this.showToast(this.showWings ? '🪽 Asas/Capas visíveis e enquadradas' : '🪽 Asas/Capas ocultas');
    }
  }

  // --------------------------------------------------------------------------
  // ATUALIZAÇÃO DA INTERFACE E DETALHES DO ITEM ATIVO
  // --------------------------------------------------------------------------
  selectItem(index) {
    if (index < 0 || index >= this.catalog.length) return;
    this.activeIndex = index;
    const asset = this.catalog[index];

    // Atualiza classes ativas na lista
    document.querySelectorAll('.val-item-card').forEach((card, idx) => {
      card.classList.toggle('active', idx === index);
    });

    // Atualiza cabeçalho de detalhes
    document.getElementById('val-active-title').textContent = asset.name;
    document.getElementById('val-active-subtitle').textContent = asset.subtitle;

    // Atualiza métricas técnicas
    document.getElementById('val-metric-glb').textContent = asset.glb.split('/').pop();
    document.getElementById('val-metric-bmd').textContent = asset.sourceBmd;
    document.getElementById('val-metric-radius').textContent = `${asset.collision.radius}m`;
    document.getElementById('val-metric-height').textContent = `${asset.collision.height}m / ${asset.collision.step}m`;

    // Atualiza badge de status
    const decision = this.decisions[asset.id] || { status: 'PENDING', notes: '' };
    this.updateStatusBadge(decision.status);

    // Atualiza campo de anotações
    const notesInput = document.getElementById('val-notes-input');
    notesInput.value = decision.notes || '';

    // Atualiza concept image
    const conceptImg = document.getElementById('val-concept-img');
    const conceptPlaceholder = document.getElementById('val-concept-placeholder');
    if (asset.conceptImage) {
      conceptImg.src = asset.conceptImage;
      conceptImg.style.display = 'block';
      conceptPlaceholder.style.display = 'none';
    } else {
      conceptImg.src = '';
      conceptImg.style.display = 'none';
      conceptPlaceholder.style.display = 'block';
    }

    // Carrega o modelo 3D
    this.loadModel(asset);
  }

  updateStatusBadge(status) {
    const badge = document.getElementById('val-active-badge');
    badge.className = 'val-status-chip';
    if (status === 'APPROVED') {
      badge.classList.add('val-status-approved');
      badge.textContent = '✅ APROVADO (SIM)';
    } else if (status === 'REJECTED') {
      badge.classList.add('val-status-rejected');
      badge.textContent = '❌ REPROVADO (NÃO)';
    } else {
      badge.classList.add('val-status-pending');
      badge.textContent = '⏳ PENDENTE';
    }
  }

  // --------------------------------------------------------------------------
  // PROCESSAMENTO DAS DECISÕES DE VOTO (SIM / NÃO / PENDENTE)
  // --------------------------------------------------------------------------
  vote(status) {
    const asset = this.catalog[this.activeIndex];
    if (!asset) return;

    const notes = document.getElementById('val-notes-input').value.trim();
    this.decisions[asset.id] = {
      status,
      notes,
      timestamp: new Date().toISOString(),
    };

    saveDecisions(this.decisions);
    this.updateStatusBadge(status);
    this.renderItemList();
    this.updateProgressStats();

    if (status === 'APPROVED') {
      this.showToast(`✅ "${asset.name}" homologado com sucesso!`);
    } else if (status === 'REJECTED') {
      this.showToast(`❌ "${asset.name}" marcado para ajustes.`);
    } else {
      this.showToast(`⏳ Decisão de "${asset.name}" redefinida para pendente.`);
    }

    // Avança suavemente para o próximo item
    setTimeout(() => {
      if (this.activeIndex < this.catalog.length - 1) {
        this.selectItem(this.activeIndex + 1);
      }
    }, 450);
  }

  // --------------------------------------------------------------------------
  // LISTA LATERAL E FILTRAGEM
  // --------------------------------------------------------------------------
  renderItemList() {
    const list = document.getElementById('val-item-list');
    list.innerHTML = '';

    const query = this.searchQuery.toLowerCase();

    this.catalog.forEach((asset, idx) => {
      const decision = this.decisions[asset.id] || { status: 'PENDING' };

      // Filtragem por categoria e status
      if (this.currentFilter !== 'ALL') {
        if (this.currentFilter === 'APPROVED' && decision.status !== 'APPROVED') return;
        if (this.currentFilter === 'REJECTED' && decision.status !== 'REJECTED') return;
        if (this.currentFilter === 'PENDING' && decision.status !== 'PENDING') return;
        if (!['APPROVED', 'REJECTED', 'PENDING'].includes(this.currentFilter) && asset.category !== this.currentFilter) return;
      }

      // Filtragem por busca textual
      if (query && !asset.name.toLowerCase().includes(query) && !asset.subtitle.toLowerCase().includes(query)) {
        return;
      }

      const card = document.createElement('div');
      card.className = `val-item-card ${idx === this.activeIndex ? 'active' : ''}`;
      card.addEventListener('click', () => this.selectItem(idx));

      const meta = document.createElement('div');
      meta.className = 'val-item-meta';

      const name = document.createElement('span');
      name.className = 'val-item-name';
      name.textContent = asset.name;

      const sub = document.createElement('span');
      sub.className = 'val-item-sub';
      sub.textContent = asset.subtitle.split('•')[0] || asset.subtitle;

      meta.appendChild(name);
      meta.appendChild(sub);

      const statusChip = document.createElement('span');
      statusChip.className = 'val-status-chip';
      if (decision.status === 'APPROVED') {
        statusChip.classList.add('val-status-approved');
        statusChip.textContent = 'SIM';
      } else if (decision.status === 'REJECTED') {
        statusChip.classList.add('val-status-rejected');
        statusChip.textContent = 'NÃO';
      } else {
        statusChip.classList.add('val-status-pending');
        statusChip.textContent = '⏳';
      }

      card.appendChild(meta);
      card.appendChild(statusChip);
      list.appendChild(card);
    });
  }

  updateProgressStats() {
    let approved = 0;
    let rejected = 0;
    const total = this.catalog.length;

    this.catalog.forEach((asset) => {
      const d = this.decisions[asset.id];
      if (d?.status === 'APPROVED') approved++;
      if (d?.status === 'REJECTED') rejected++;
    });

    const evaluated = approved + rejected;
    const percent = Math.round((evaluated / total) * 100);

    document.getElementById('val-progress-stats').textContent = `${evaluated} de ${total} validados (${percent}%)`;
    document.getElementById('val-approval-stats').textContent = `✅ ${approved} Aprovados • ❌ ${rejected} Reprovados`;

    document.getElementById('val-progress-app-bar').style.width = `${(approved / total) * 100}%`;
    document.getElementById('val-progress-rej-bar').style.width = `${(rejected / total) * 100}%`;
  }

  // --------------------------------------------------------------------------
  // EXPORTAÇÃO DE RELATÓRIO MARKDOWN / OBSIDIAN & ÁREA DE TRANSFERÊNCIA
  // --------------------------------------------------------------------------
  generateMarkdownReport() {
    let md = `# Relatório de Auditoria e Validação Canônica — Dasi MMORPG\n\n`;
    md += `**Data da Auditoria:** ${new Date().toLocaleString('pt-BR')}\n`;

    let approved = 0;
    let rejected = 0;
    this.catalog.forEach((asset) => {
      const d = this.decisions[asset.id];
      if (d?.status === 'APPROVED') approved++;
      if (d?.status === 'REJECTED') rejected++;
    });

    md += `**Status Global:** ${approved} Aprovados (SIM) | ${rejected} Reprovados (NÃO) | Total: ${this.catalog.length}\n\n`;
    md += `| ID | Categoria | Nome | Arquivo GLB | Decisão | Observações do Auditor |\n`;
    md += `|---|---|---|---|---|---|\n`;

    this.catalog.forEach((asset) => {
      const d = this.decisions[asset.id] || { status: 'PENDING', notes: '' };
      const statusIcon = d.status === 'APPROVED' ? '✅ SIM (Aprovado)' : d.status === 'REJECTED' ? '❌ NÃO (Reprovado)' : '⏳ Pendente';
      const cleanNotes = (d.notes || '—').replace(/\|/g, '-').replace(/\n/g, ' ');
      md += `| \`${asset.id}\` | ${asset.category} | ${asset.name} | \`${asset.glb}\` | ${statusIcon} | ${cleanNotes} |\n`;
    });

    md += `\n---\n*Gerado automaticamente pelo Dasi Canonical Validation Studio.*`;
    return md;
  }

  exportMarkdownFile() {
    const md = this.generateMarkdownReport();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dasi_canonical_audit_report_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('📄 Relatório Markdown exportado!');
  }

  copySummaryToClipboard() {
    let approved = 0;
    let rejected = 0;
    this.catalog.forEach((asset) => {
      const d = this.decisions[asset.id];
      if (d?.status === 'APPROVED') approved++;
      if (d?.status === 'REJECTED') rejected++;
    });

    const summary = `⚔️ [Auditoria Dasi 3D] Progresso: ${approved + rejected}/${this.catalog.length} validados (${approved} Aprovados ✅, ${rejected} Reprovados ❌).`;
    navigator.clipboard.writeText(summary).then(() => {
      this.showToast('📋 Resumo copiado para a área de transferência!');
    }).catch(() => {
      this.showToast(summary);
    });
  }

  // --------------------------------------------------------------------------
  // EVENT BINDINGS
  // --------------------------------------------------------------------------
  bindDOM() {
    // Ações de Voto
    document.getElementById('btn-vote-sim').addEventListener('click', () => this.vote('APPROVED'));
    document.getElementById('btn-vote-nao').addEventListener('click', () => this.vote('REJECTED'));
    document.getElementById('btn-vote-clear').addEventListener('click', () => this.vote('PENDING'));

    // Navegação
    document.getElementById('btn-nav-prev').addEventListener('click', () => {
      if (this.activeIndex > 0) this.selectItem(this.activeIndex - 1);
    });
    document.getElementById('btn-nav-next').addEventListener('click', () => {
      if (this.activeIndex < this.catalog.length - 1) this.selectItem(this.activeIndex + 1);
    });

    // Busca Textual
    document.getElementById('val-search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderItemList();
    });

    // Filtros por Categoria
    document.querySelectorAll('.btn-val-pill').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-val-pill').forEach((b) => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentFilter = e.currentTarget.dataset.filter;
        this.renderItemList();
      });
    });

    // 3D Toolbar Controls
    document.getElementById('tool-reset-cam').addEventListener('click', () => {
      if (this.currentModel) {
        this.fitCameraToObject(this.currentModel);
        this.showToast('🎥 Câmera resetada e enquadrada');
      }
    });

    const wireBtn = document.getElementById('tool-toggle-wireframe');
    wireBtn.addEventListener('click', () => {
      this.wireframeMode = !this.wireframeMode;
      wireBtn.classList.toggle('active', this.wireframeMode);
      if (this.currentModel) {
        this.currentModel.traverse((o) => {
          if (o.isMesh && o.material) {
            if (Array.isArray(o.material)) o.material.forEach((m) => m.wireframe = this.wireframeMode);
            else o.material.wireframe = this.wireframeMode;
          }
        });
      }
      this.showToast(this.wireframeMode ? '🕸️ Wireframe ativado' : '🎨 Sombreado PBR ativado');
    });

    const colBtn = document.getElementById('tool-toggle-collision');
    colBtn.addEventListener('click', () => {
      this.showCollision = !this.showCollision;
      colBtn.classList.toggle('active', this.showCollision);
      if (this.currentColliderGroup) {
        this.currentColliderGroup.visible = this.showCollision;
      }
      this.showToast(this.showCollision ? '🛡️ Colisor físico visível' : '🛡️ Colisor físico oculto');
    });

    const wingsBtn = document.getElementById('tool-toggle-wings');
    if (wingsBtn) {
      wingsBtn.addEventListener('click', () => this.toggleWings());
    }

    const gridBtn = document.getElementById('tool-toggle-grid');
    gridBtn.addEventListener('click', () => {
      this.showGrid = !this.showGrid;
      gridBtn.classList.toggle('active', this.showGrid);
      if (this.gridHelper) {
        this.gridHelper.visible = this.showGrid;
      }
    });

    const animBtn = document.getElementById('tool-toggle-anim');
    animBtn.addEventListener('click', () => {
      this.isPlayingAnim = !this.isPlayingAnim;
      animBtn.classList.toggle('active', this.isPlayingAnim);
      animBtn.textContent = this.isPlayingAnim ? '▶️ Em Reprodução' : '⏸️ Parado (Clique p/ Animar)';
      if (this.activeAction) {
        this.activeAction.paused = !this.isPlayingAnim;
      }
    });

    document.getElementById('val-anim-select').addEventListener('change', (e) => {
      if (!this.mixer || !this.currentModel) return;
      const clipName = e.target.value;
      this.mixer.stopAllAction();
      const anims = this.currentAnimations || this.currentModel.animations || [];
      const clip = THREE.AnimationClip.findByName(anims, clipName);
      if (clip) {
        this.activeAction = this.mixer.clipAction(clip);
        this.activeAction.play();
        this.activeAction.paused = !this.isPlayingAnim;
        this.mixer.update(0);
      }
    });

    // Campo de notas com auto-save ao digitar
    document.getElementById('val-notes-input').addEventListener('input', (e) => {
      const asset = this.catalog[this.activeIndex];
      if (!asset) return;
      if (!this.decisions[asset.id]) {
        this.decisions[asset.id] = { status: 'PENDING', notes: '' };
      }
      this.decisions[asset.id].notes = e.target.value;
      saveDecisions(this.decisions);
    });

    // Exportações
    document.getElementById('btn-export-markdown').addEventListener('click', () => this.exportMarkdownFile());
    document.getElementById('btn-copy-summary').addEventListener('click', () => this.copySummaryToClipboard());

    
    // Event Listeners para Inspeção Modular por Camadas
    const layerMap = [
      ['layer-btn-body', 'body'],
      ['layer-btn-helm', 'helm'],
      ['layer-btn-chest', 'chest'],
      ['layer-btn-gloves', 'gloves'],
      ['layer-btn-legs', 'legs'],
      ['layer-btn-boots', 'boots'],
      ['layer-btn-wings', 'wings'],
      ['layer-btn-weapon-r', 'weapon_r'],
      ['layer-btn-weapon-l', 'weapon_l'],
      ['tile-layer-body', 'body'],
      ['tile-layer-helm', 'helm'],
      ['tile-layer-chest', 'chest'],
      ['tile-layer-gloves', 'gloves'],
      ['tile-layer-legs', 'legs'],
      ['tile-layer-boots', 'boots'],
      ['tile-layer-wings', 'wings'],
      ['tile-layer-weapon-r', 'weapon_r'],
      ['tile-layer-weapon-l', 'weapon_l'],
    ];

    layerMap.forEach(([elementId, layerKey]) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.addEventListener('click', () => this.toggleLayer(layerKey));
      }
    });

    const presetMap = [
      ['layer-preset-full', 'ALL_ARMOR'],
      ['layer-preset-body', 'BODY_ONLY'],
      ['layer-preset-armor', 'ARMOR_ONLY'],
      ['tile-preset-full', 'ALL_ARMOR'],
      ['tile-preset-body', 'BODY_ONLY'],
      ['tile-preset-armor', 'ARMOR_ONLY'],
    ];

    presetMap.forEach(([elementId, presetKey]) => {
      const el = document.getElementById(elementId);
      if (el) {
        el.addEventListener('click', () => this.setLayerPreset(presetKey));
      }
    });

    // Atalhos de Teclado Oficiais
    window.addEventListener('keydown', (e) => {
      // Ignora se estiver digitando em campo de texto
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 's' || e.key === 'S') {
        this.vote('APPROVED');
      } else if (e.key === 'n' || e.key === 'N') {
        this.vote('REJECTED');
      } else if (e.key === 'x' || e.key === 'X') {
        this.toggleWings();
      } else if (e.key === 'p' || e.key === 'P') {
        animBtn.click();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (this.activeIndex < this.catalog.length - 1) this.selectItem(this.activeIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (this.activeIndex > 0) this.selectItem(this.activeIndex - 1);
      } else if (e.key === 'c' || e.key === 'C') {
        colBtn.click();
      } else if (e.key === 'w' || e.key === 'W') {
        wireBtn.click();
      } else if (e.key === ' ') {
        e.preventDefault();
        document.getElementById('tool-reset-cam').click();
      }
    });
  }

  showToast(message) {
    const toast = document.getElementById('val-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }
}

// Inicializa quando a página for carregada no navegador
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.dasiValidator = new ValidationStudio();
  });
}
