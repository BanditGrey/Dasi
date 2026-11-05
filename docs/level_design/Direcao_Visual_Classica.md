# Direção visual clássica — cenários Dasi

Primeira etapa da direção de arte para os 56 cenários: fantasia sombria, nostálgica e legível em câmera elevada, inspirada na atmosfera de MMORPGs clássicos como MU Online. As pinturas são referências geradas para Dasi, não artes oficiais de MU Online. Não reproduzir logotipos ou personagens proprietários.

## Princípios

- **Leitura de jogo:** trajetos e áreas de combate claros; silhuetas distintas para obstáculos e objetivos. A pintura é uma referência de atmosfera, não uma planta de colisão.
- **Materiais:** pedra envelhecida, madeira escurecida, ferro gasto e tecidos; cor e emissão são acentos, não substitutos para a iluminação.
- **Câmera:** composição em três quartos elevada, com marcos reconhecíveis em escala de jogo.
- **Coerência:** cada região mantém paleta e arquitetura próprias; preservar o catálogo e colisões existentes ao desenvolver o 3D.

## Referências disponíveis

| Região | IDs cobertos como referência de família | Identidade |
| --- | --- | --- |
| Lorencia | LOR_01–07 | Pedra úmida, mercado, bronze e luz âmbar. |
| Noria | NOR_01–07 | Árvores ancestrais, madeira, musgo e névoa esmeralda. |
| Devias | DEV_01–06 | Pedra fria, neve, gelo azul e fogo quente. |
| Dungeon | DNG_01–06 | Criptas escuras, arcos, grades e velas. |
| Lost Tower | LT_01–07 | Basalto, arquitetura gótica, fogo e violeta. |
| Atlans | ATL_01–07 | Ruínas submersas, colunas e luz azul-esverdeada. |
| Tarkan | TAR_01–05 | Cânions ocres, templos desgastados e poeira. |
| Icarus | ICA_01–02 | Ilhas celestes, pontes, pedra clara e nuvens. |
| Valley of Loren | VOL_01–05 | Muralhas, ferro, barricadas e fumaça de cerco. |
| Blood Castle | EVT_01 | Ponte gótica, estátuas aladas e abismo carmesim. |
| Devil Square | EVT_02 | Arena circular escura, totens, inscrições e brasas. |
| Chaos Castle | EVT_03 | Plataforma de lajes sobre o abismo e névoa violeta. |
| Coliseu de Duelos | EVT_04 | Arena octogonal, pedra envelhecida e luz de tochas. |

As imagens de família estão em `src/client/dev_viewer/art/classic/` e aparecem na galeria e no painel comparativo. As artes individuais ficam em `art/classic/scenarios/`, com o ID do cenário como nome de arquivo. Cenários sem concept individual exibem uma referência de família explicitamente identificada, que **não** representa o mapa específico. As arenas de evento têm referências próprias, sem reutilizar a imagem de Blood Castle.

## Concepts individuais — andamento

- Concluídos: `LOR_01`–`LOR_07`, `NOR_01`–`NOR_07`, `DEV_01`–`DEV_06`, `DNG_01`–`DNG_06`, `LT_01`–`LT_07`, `ATL_01`–`ATL_07`, `TAR_01`–`TAR_05`, `ICA_01`–`ICA_02` e `VOL_01`–`VOL_05` e `EVT_01`–`EVT_04` (56 de 56).
- Pendentes: nenhum concept individual.
- As imagens de família, inclusive as arenas, são guias preliminares e não contam como concepts individuais.
- Revisar os concepts individuais e utilizá-los como referência para a produção dos GLBs.

## Próximas etapas

1. Detalhar os pontos de interesse de cada um dos 56 IDs, em conformidade com `All_56_Scenarios_Master_Index.md` e `SCENARIO_CATALOG`.
2. Adaptar modelos, materiais e iluminação 3D aos conceitos aprovados, mantendo os caminhos e colisores consistentes; validar cada mapa no visualizador.

### Blockouts GLB — andamento

Os sete cenários de Lorencia (`LOR_01`–`LOR_07`), os sete de Noria (`NOR_01`–`NOR_07`) e os seis de Devias (`DEV_01`–`DEV_06`) possuem **blockouts iniciais** em `src/client/dev_viewer/models/scenarios/`. São exportações da geometria procedural existente, não modelos artísticos finais nem reconstruções fiéis das pinturas. Podem ser baixados no painel de comparação do visualizador ao selecionar cada cenário.

Após `npm ci`, regenere um cenário com `node --experimental-strip-types tools/export_scenario_glb.mjs LOR_01` ou um bioma com `node --experimental-strip-types tools/export_scenario_glb.mjs NORIA`. O comando sobrescreve os GLBs de destino. A exportação omite partículas e luzes, que continuam no runtime; o visualizador ainda usa a geometria procedural, preservando animações e colisões. Estes arquivos são bases para modelagem e revisão, não substitutos automáticos dos cenários.

**Pendente:** 36 blockouts dos outros biomas e acabamento, revisão visual e validação de colisões de todos os modelos.

A praça `DEV_01` recebeu pedra úmida, chama quente e ameias, ainda em nível de blockout. O santuário `NOR_01` recebeu detalhes de varandas, lanternas, fonte e pavilhões, ainda em nível de blockout. A praça `LOR_01` recebeu uma primeira passagem 3D: calçamento, estátua alada, fachada iluminada e ameias. Os materiais de Devil Square, Chaos Castle e do Coliseu receberam uma primeira aproximação de paleta e iluminação. O visualizador mantém a geometria procedural de cada mapa, sem substituí-la automaticamente pelo GLB genérico do bioma. Os modelos 3D existentes **ainda não foram reconstruídos** integralmente a partir destas pinturas. Sua presença ao lado do concept facilita o planejamento e não implica paridade visual concluída.
