/**
 * Dossiê de Estudo Canônico das Classes Heroicas — Base de Engenharia Reversa
 * Fonte Autoritativa: reference/mu_roxgaming_5.2/ (Player/, Item/, Server/Data/)
 */

export const HERO_NAMES = Object.freeze({
  DK: 'dark_knight',
  DW: 'dark_wizard',
  ELF: 'fairy_elf',
  MG: 'magic_gladiator',
  DL: 'dark_lord',
});

export const CHARACTER_CONCEPTS = Object.freeze({
  DK: {
    title: 'Cavaleiro do Sangue',
    description: 'Combatente pesado de vanguarda com motivos dracônicos, silhueta atlética e lâminas duplas.',
    studyMaterial: {
      classId: 0,
      classCode: 'DK',
      baseBodyBmd: 'ArmorClass02.bmd',
      baseSkinTexture: 'skin_barbarian_01.OZJ',
      canonicalArmorSet: 'Dragon Set (HelmMale02, ArmorMale02, PantMale02, GloveMale02, BootMale02)',
      canonicalArmorTexture: 'drager_*.OZJ',
      canonicalWeapon: 'Sword14.bmd (Dragon Blade) / Sword16.bmd (Sword of Destruction)',
      canonicalWings: 'Wing05.bmd (Wings of Dragon)',
      sourceDirectory: 'reference/mu_roxgaming_5.2/client/Data/Player/',
    },
  },
  DW: {
    title: 'Arquimago do Caos',
    description: 'Conjurador arcano com túnica e ombreiras cerimoniais, cetro ressonante e manipulação elemental.',
    studyMaterial: {
      classId: 1,
      classCode: 'DW',
      baseBodyBmd: 'ArmorClass01.bmd',
      baseSkinTexture: 'face_01.OZJ',
      canonicalArmorSet: 'Legendary Set (HelmMale04, ArmorMale04, PantMale04, GloveMale04, BootMale04)',
      canonicalArmorTexture: 'legend_*.OZJ',
      canonicalWeapon: 'Staff04.bmd (Legendary Staff) / Staff08.bmd (Staff of Kundun)',
      canonicalWings: 'Wing04.bmd (Wings of Soul)',
      sourceDirectory: 'reference/mu_roxgaming_5.2/client/Data/Player/',
    },
  },
  ELF: {
    title: 'Vigia da Floresta',
    description: 'Arqueira silvestre com armadura botânica ornamental, agilidade suprema e arcos sagrados.',
    studyMaterial: {
      classId: 2,
      classCode: 'ELF',
      baseBodyBmd: 'ArmorClass03.bmd',
      baseSkinTexture: 'basic_alice3.OZJ',
      canonicalArmorSet: 'Guardian Set (HelmElf05, ArmorElf05, PantElf05, GloveElf05, BootElf05)',
      canonicalArmorTexture: 'guardian_*.OZJ',
      canonicalWeapon: 'Bow06.bmd (Chaos Nature Bow) / Bow07.bmd (Celestial Bow)',
      canonicalWings: 'Wing03.bmd (Wings of Spirits)',
      sourceDirectory: 'reference/mu_roxgaming_5.2/client/Data/Player/',
    },
  },
  MG: {
    title: 'Gladiador Rúnico',
    description: 'Combatente híbrido sem elmo nativo, fundindo esgrima veloz e projeções arcanas.',
    studyMaterial: {
      classId: 3,
      classCode: 'MG',
      baseBodyBmd: 'ArmorClass04.bmd',
      baseSkinTexture: 'magic_gladiator_01.OZJ',
      canonicalArmorSet: 'Storm Crow Set (ArmorMale19, PantMale19, GloveMale19, BootMale19)',
      canonicalArmorTexture: 'stormcrow_*.OZJ',
      canonicalWeapon: 'Sword13.bmd (Rune Blade) / Sword20.bmd (Dark Reign Blade)',
      canonicalWings: 'Wing06.bmd (Wings of Darkness)',
      sourceDirectory: 'reference/mu_roxgaming_5.2/client/Data/Player/',
    },
  },
  DL: {
    title: 'Soberano Imperial',
    description: 'Lorde comandante com armadura de placas escuras, manto bordô, cetro imperial e corvo de batalha.',
    studyMaterial: {
      classId: 4,
      classCode: 'DL',
      baseBodyBmd: 'ArmorClass05.bmd',
      baseSkinTexture: 'face_05.OZJ',
      canonicalArmorSet: 'Dark Steel / Dark Master Set (ArmorMale30, PantMale30)',
      canonicalArmorTexture: 'darksteel_*.OZJ',
      canonicalWeapon: 'Mace10.bmd (Great Lord Scepter) / Mace12.bmd (Shining Scepter)',
      canonicalWings: 'Wing11.bmd (Mantle of Monarch)',
      sourceDirectory: 'reference/mu_roxgaming_5.2/client/Data/Player/',
    },
  },
});

export function getCharacterConcept(id) {
  const key = typeof id === 'string' && id.startsWith('HERO_') ? id.slice(5) : id;
  if (typeof key !== 'string' || !Object.hasOwn(CHARACTER_CONCEPTS, key)) return null;
  const concept = CHARACTER_CONCEPTS[key];
  const name = HERO_NAMES[key];
  return {
    ...concept,
    heroName: name,
    src: `models/hero_${name}.glb`,
    animatedModel: `models/animated_heroes/hero_${key.toLowerCase()}_animated.glb`,
    staticModel: `models/hero_${name}.glb`,
  };
}
