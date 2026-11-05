# Personagens e armaduras modulares — blockouts iniciais

Estes arquivos são **protótipos procedurais**, não modelos finais fiéis aos concepts de MU Online. Foram mantidos os cinco GLBs de herói anteriores sem sobrescrevê-los. Os novos blockouts servem para testar o contrato de peças e a troca visual; precisam de modelagem artística, anatomia, texturas, rig e animações antes de serem usados como personagens finais.

## Conteúdo

Em `src/client/dev_viewer/models/modular_heroes/` há cinco personagens completos (`hero_dk_modular.glb`, `hero_dw_modular.glb`, `hero_elf_modular.glb`, `hero_mg_modular.glb`, `hero_dl_modular.glb`) e **60 arquivos de peças**: cinco classes × seis slots × duas variantes. Cada personagem completo vem com as seis peças `base`, corpo de referência e arma indicativa fixa. As variantes `base` e `elite` diferem também na geometria, não apenas na cor; são interpretações simples da direção visual de cada classe, não sets finais.

| Slot | Peça | Observação |
| --- | --- | --- |
| `helmet` | elmo, capuz ou diadema | varia por classe |
| `chest` | peitoral | independente das ombreiras |
| `shoulders` | par de ombreiras | par como um único módulo |
| `gloves` | par de luvas/manoplas | par como um único módulo |
| `legs` | par de grevas | par como um único módulo |
| `boots` | par de botas | par como um único módulo |

O nome de cada peça é `<classe>_<slot>_<variante>.glb`, por exemplo `dk_chest_elite.glb`. O nó raiz identifica `heroClass`, `slot`, `variant` e `formatVersion` nos extras GLTF. As peças usam espaço local do slot: carregue a raiz sem deslocamento extra sob o nó `slot_<slot>` do herói correspondente. Os pivôs são definidos em `src/client/dev_viewer/modularHero.js`; não há promessa de compatibilidade entre classes ou com os GLBs antigos. Não aplicar os arquivos diretamente ao inventário ou ao servidor.

## Prévia e regeneração

1. No visualizador, escolha **Heróis** e a classe desejada.
2. Ative **Visualizar blockout modular**. Escolha uma peça e `Base` ou `Elite`, depois clique em **Trocar peça**. A seleção substitui somente aquele slot; é temporária e não é salva. Trocar de classe, set ou modo recria a prévia e restaura o conjunto base.
3. Os links baixam o GLB base da classe ou o módulo escolhido. O GLB base não incorpora as trocas temporárias da prévia; o link do módulo fornece a peça independente.

Para regenerar os arquivos no repositório: `node tools/export_modular_heroes.mjs ALL`; use `DK`, `DW`, `ELF`, `MG` ou `DL` para uma classe. O script sobrescreve apenas os arquivos correspondentes em `models/modular_heroes/`, não os modelos antigos. A origem do protótipo é `src/client/dev_viewer/modularHero.js`.

## Evolução recente

- Os **5 heróis modulares**, as **60 peças de armadura** e as **12 armas modulares** foram implementados em `src/client/dev_viewer/modularHero.js` e compilados em `src/client/dev_viewer/models/modular_heroes/`.
- **Armas Modulares Intercambiáveis:** Foi implementado `CLASS_WEAPONS` e a função `createWeaponModule(THREE, heroClass, weaponId)`, permitindo trocar dinamicamente de arma em runtime no Dev Viewer (`hero.setWeapon(weaponId)`):
  - **DK:** Dragon Blade, Sword of Archangel, Chaos Dragon Axe, Sword of Destruction.
  - **DW:** Staff of Kundun, Chaos Lightning Staff.
  - **ELF:** Celestial Bow, Great Reign Crossbow.
  - **MG:** Rune Blade of Aether, Dual Elemental (Fogo e Trovão).
  - **DL:** Imperial Lord Scepter (com Pavise Shield), Radiant Lord Scepter (com Eagle Shield).
- Cada arma modular é exportada como GLB independente (`<classe>_weapon_<arma>.glb`) com nó raiz identificado em `userData` (`kind: 'weapon_module'`, `heroClass`, `weaponId`, `formatVersion: 1`).
- Foi integrado o sistema de asas translúcidas articuladas (Wings of Dragon, Wings of Soul, Wings of Spirits, Wings of Darkness e Manto da Monarquia) e o motor de animações vivas (`updateAnim`), suportando respiração orgânica, ondulação das asas, rotação de orbes/anéis astrais, pulsação de armas elementais e reatividade a skills no Dev Viewer.

## Limitações e próximos passos

- Os personagens usam formas geométricas simples, não possuem UVs/texturas artísticas, rig esquelético, skinning ou clips de animação; as armas são indicativas e fixas. A prévia modular é estática e ignora os controles existentes de animação e refinamento. As formas não foram validadas visualmente contra os concepts.
- As peças não alteram atributos, inventário, colisão, rede nem persistência. Troca no jogo requer um catálogo autoritativo de itens e compatibilidade validada pelo servidor.
- Faltam modelagem MU-like detalhada por classe, pontos de arma/asas, variantes de progressão, materiais e texturas, esqueleto compartilhado, pesos, animações e verificação de clipping em todas as poses.
- Faltam revisão visual no navegador, testes reais de carregamento em plataformas-alvo e orçamento de polígonos/memória. Os testes automatizados verificam a troca isolada, abertura dos 65 GLBs, hierarquia e metadados, não qualidade artística.

O plano mais amplo de concepts, auditoria e aceitação está em [Plano_Personagens.md](Plano_Personagens.md); as pendências dos mapas permanecem em `docs/level_design/Plano_Mapas_Modulares.md`.
