# Preparação — personagens de Dasi

Este documento organiza a próxima etapa; não indica que os personagens estejam concluídos ou aprovados. A direção escolhida continua sendo fantasia sombria clássica com atmosfera nostálgica e identidade própria. Os concepts devem preceder os GLBs, como no fluxo usado para os cenários.

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

## Etapas propostas

1. **Inventariar e revisar** os cinco modelos existentes, suas escalas, materiais, acessórios, animações, pontos de equipamento e funcionamento no navegador. Registrar o que pode ser reaproveitado.
2. **Criar primeiro todos os concepts** das cinco classes: silhueta de corpo inteiro, frente e costas, materiais, paleta, arma e detalhes de identidade. Diferenciar claramente funções e biomas sem copiar personagens ou designs de outra obra.
3. **Revisar coerência e legibilidade** em escala de jogo: proporções, leitura das silhuetas, contraste com ambientes, armaduras, armas e espaço para futuras variações.
4. **Produzir e integrar GLBs**, somente após os concepts: malhas, UVs e materiais; padrão de rig compatível; pontos para armas/equipamentos e estrutura de variantes. Manter os arquivos existentes até a substituição ser validada.
5. **Animação e integração**: verificar idle, movimento, ataque e habilidades conforme cada classe; conferir carregamento, fallback, equipamentos e efeitos no Dev Viewer e no cliente.
6. **Aceitação e documentação**: testes de carregamento dos cinco GLBs, revisão visual em navegador, verificação de escala/colisões, orçamento de polígonos, memória e desempenho, e registro de limitações.

As tarefas de personagens não substituem as pendências de mapas registradas em `docs/level_design/Plano_Mapas_Modulares.md`: colisões autoritativas, revisão visual, bordas e mecânicas continuam abertas. Autenticação e persistência do servidor também continuam fora do escopo desta preparação.
