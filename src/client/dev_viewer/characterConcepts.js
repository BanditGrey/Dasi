/** Concepts iniciais, não modelos aprovados nem folhas técnicas completas. */
export const CHARACTER_CONCEPTS = Object.freeze({
  DK: { title: 'Cavaleiro do Sangue', description: 'Placas de aço escuro e vermelho, espada e escudo para uma silhueta defensiva.' },
  DW: { title: 'Arquimago do Caos', description: 'Vestes azuis escuras, cajado e foco arcano ciano em uma silhueta alongada.' },
  ELF: { title: 'Vigia da Floresta', description: 'Armadura leve verde e bronze, arco e aljava inspirados na floresta de Noria.' },
  MG: { title: 'Gladiador Rúnico', description: 'Armadura de aço, tecidos escuros e lâmina rúnica violeta para o combatente híbrido.' },
  DL: { title: 'Soberano Imperial', description: 'Aço negro, ouro envelhecido, manto bordô e cetro com motivo de corvo.' },
});
export function getCharacterConcept(id) {
  const key = typeof id === 'string' && id.startsWith('HERO_') ? id.slice(5) : id;
  if (typeof key !== 'string' || !Object.hasOwn(CHARACTER_CONCEPTS, key)) return null;
  const concept = CHARACTER_CONCEPTS[key];
  return { ...concept, src: `art/classic/characters/${key.toLowerCase()}.png` };
}
