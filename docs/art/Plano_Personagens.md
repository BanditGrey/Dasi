# Preparação — personagens de Dasi

Este documento organiza a próxima etapa; não indica que os personagens estejam concluídos ou aprovados. A direção é explicitamente baseada no universo e na linguagem visual clássica de MU Online: arquétipos, fantasia de progressão, silhuetas heroicas, armaduras ornamentadas, armas marcantes, asas e efeitos mágicos. Dasi mantém identidade própria, mas não deve se afastar dessa referência para um medieval genérico. Os concepts devem preceder os GLBs, como no fluxo usado para os cenários.

## Direção visual das classes

- **DK:** guerreiro corpo a corpo de armadura pesada, ombreiras imponentes, motivos dracônicos e espada/escudo; progressão visível de equipamento.
- **DW:** mago arcano com armadura e túnica cerimoniais, cajado, brilho mágico e silhueta claramente diferente do guerreiro.
- **ELF:** arqueira élfica com arco e equipamento leve ornamental, formas orgânicas e leitura de agilidade e suporte.
- **MG:** guerreiro-mago híbrido, com armadura heroica e runas/efeitos que comuniquem a combinação de espada e magia.
- **DL:** soberano de combate e comando, com armadura imperial, cetro, manto e referência ao corvo.

Asas, níveis de refinamento e equipamentos evoluídos fazem parte da fantasia de progressão, mas não precisam aparecer em todas as variações. Os cinco concepts iniciais foram revisados nessa direção; são referências, não vistas técnicas, modelos finais nem aprovação. Preservar legibilidade em escala de jogo.

## Inventário existente

O repositório já apresenta cinco classes na interface, definidas em `src/client/dev_viewer/dasi3dAvatar.js` e `docs/Classes_and_Skills.md`:

| ID | Classe | GLB existente |
| --- | --- | --- |
| DK | Cavaleiro do Sangue / Dark Knight | `src/client/dev_viewer/models/hero_dark_knight.glb` |
| DW | Arquimago do Caos / Dark Wizard | `src/client/dev_viewer/models/hero_dark_wizard.glb` |
| ELF | Vigia da Floresta / Fairy Elf | `src/client/dev_viewer/models/hero_fairy_elf.glb` |
| MG | Gladiador Rúnico / Magic Gladiator | `src/client/dev_viewer/models/hero_magic_gladiator.glb` |
| DL | Soberano Imperial / Dark Lord | `src/client/dev_viewer/models/hero_dark_lord.glb` |

`dasi3dContent.js` registra esses caminhos em `GLTF_HERO_MAP` e também contém a geração procedural de heróis. O visualizador dispõe de modelos e animação procedural existentes; sua qualidade, compatibilidade, rigging e fidelidade artística **ainda precisam de auditoria**, não devem ser presumidos finais. Os bustos da seleção de classes são gerados em `dasi3dAvatar.js`. Os equipamentos têm um catálogo próprio no Dev Viewer.

## Auditoria estrutural inicial

A inspeção dos GLBs em `tools/audit_hero_glb.mjs` lê o cabeçalho e o JSON embutido, sem decodificar texturas ou julgar o visual. Na versão atual, os cinco arquivos têm geometria e uma imagem incorporada cada, mas **nenhum contém skins ou clips de animação GLTF**. A animação observada no visualizador é procedural e não prova existência de um rig esquelético. O carregador do herói incorpora o GLB à cena; o comportamento e a sobreposição com as peças procedurais ainda precisam ser revisados no navegador. Os números abaixo contam primitivas do arquivo, não draw calls medidas:

| ID | Primitivas | Vértices | Triângulos | Materiais | Skins / animações |
| --- | ---: | ---: | ---: | ---: | --- |
| DK | 35 | 3.668 | 1.896 | 7 | 0 / 0 |
| DW | 23 | 11.048 | 5.438 | 8 | 0 / 0 |
| ELF | 26 | 7.588 | 3.864 | 9 | 0 / 0 |
| MG | 24 | 5.856 | 2.962 | 10 | 0 / 0 |
| DL | 32 | 8.428 | 4.216 | 9 | 0 / 0 |

Execute `node tools/audit_hero_glb.mjs` para repetir o inventário. A inspeção não confirma UVs, pontos de equipamento, compatibilidade do rig, aparência ou desempenho em jogo.

## Concepts iniciais

As cinco classes têm uma primeira ilustração individual de corpo inteiro em `src/client/dev_viewer/art/classic/characters/`, disponível na galeria e na comparação com o modelo existente. São referências iniciais, não vistas técnicas ou modelos aprovados. **Frente e costas consistentes, detalhes de material, revisão de silhueta e aprovação ainda faltam**; não substituir os GLBs com base apenas nessas imagens. O trabalho segue com todos os concepts antes de novos GLBs.

## Blockouts modulares e modelos PBR

Estão disponíveis os cinco GLBs compilados via Blender 5.2 (`models/hero_*.glb`), cinco GLBs procedurais modulares e 60 peças separadas em `models/modular_heroes/`, com seis slots e duas variantes por classe (Base e Elite). A prévia, os nomes, o contrato local dos slots, o suporte a asas translúcidas, armas icônicas e animação procedural em tempo real estão documentados em [Personagens_Modulares.md](Personagens_Modulares.md).

## Etapas propostas

1. **Inventariar e revisar** os cinco modelos existentes, suas escalas, materiais, acessórios, animações, pontos de equipamento e funcionamento no navegador. Registrar o que pode ser reaproveitado.
2. **Completar primeiro todos os concepts** das cinco classes (primeira imagem de cada classe criada): silhueta de corpo inteiro, frente e costas, materiais, paleta, arma e detalhes de identidade. Diferenciar claramente funções e biomas sem copiar personagens ou designs de outra obra.
3. **Revisar coerência e legibilidade** em escala de jogo: proporções, leitura das silhuetas, contraste com ambientes, armaduras, armas e espaço para futuras variações.
4. **Produzir e integrar GLBs**, somente após os concepts: malhas, UVs e materiais; padrão de rig compatível; pontos para armas/equipamentos e estrutura de variantes. Manter os arquivos existentes até a substituição ser validada.
5. **Animação e integração**: verificar idle, movimento, ataque e habilidades conforme cada classe; conferir carregamento, fallback, equipamentos e efeitos no Dev Viewer e no cliente.
6. **Aceitação e documentação**: testes de carregamento dos cinco GLBs, revisão visual em navegador, verificação de escala/colisões, orçamento de polígonos, memória e desempenho, e registro de limitações.

As tarefas de personagens não substituem as pendências de mapas registradas em `docs/level_design/Plano_Mapas_Modulares.md`: colisões autoritativas, revisão visual, bordas e mecânicas continuam abertas. Autenticação e persistência do servidor também continuam fora do escopo desta preparação.
