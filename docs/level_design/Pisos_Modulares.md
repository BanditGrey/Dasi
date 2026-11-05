# Pisos modulares — primeira etapa

O Dev Viewer divide pisos planos identificados na geometria procedural em peças visuais de até 4 × 4 unidades. O limite do piso original, incluindo peças menores nas bordas, é preservado. As peças usam `InstancedMesh`, para não aumentar uma chamada de renderização por célula.

## Como usar

1. Abra o visualizador 3D e selecione um cenário.
2. Em **Tiles visuais (experimental)**, escolha uma variante e dê duplo clique no piso, ou informe coluna e linha e clique em **Aplicar**. As coordenadas são índices locais do piso, começando em zero; não são coordenadas do mundo.
3. **Limpar** restaura todas as células do cenário. **Exportar JSON** permite guardar ou compartilhar as alterações; **Importar JSON** aceita somente documentos compatíveis com o cenário e dimensões atuais.

As edições são armazenadas no `localStorage` deste navegador, por ID canônico do cenário, e não são publicadas no servidor. As variantes de cor são tonalidades do material existente; Laje 3D e Pedra 3D são peças procedurais visuais sobre o piso, sem alteração de colisor. As alterações **não são aplicadas aos GLBs baixados**. Alguns objetos ou decorações já existentes podem encobrir parcialmente o piso; as peças alteradas são desenhadas ligeiramente acima para facilitar a visualização.

## Cobertura e limitações

Os pisos retangulares planos de **46 dos 56 cenários** já podem ser editados. `ICA_01`, `ICA_02`, `VOL_02`–`VOL_05` e `EVT_01`–`EVT_04` usam ilhas, pontes, pisos circulares, lajes móveis ou outras geometrias especiais e permanecem inalterados: precisam de módulos adequados a cada formato para não cobrir abismos ou alterar a jogabilidade.

Colisões, perigos, spawn e regras continuam exclusivamente em `src/server/world/CollisionSystem.ts`. A edição visual não altera essas regras; não use o editor como fonte de verdade para obstáculos. Também não há sincronização entre jogadores nem persistência no servidor. O catálogo de objetos e os modelos GLB continuam como antes.

## Próximas etapas

- Criar módulos 3D reais de piso, paredes, estruturas e vegetação, com conectores e variantes por bioma; substituir peças individuais sem mudar o restante da cena.
- Definir um formato de mapa versionado compartilhado entre servidor e cliente, com identificação de peças, rotação, camadas e colisores; validar os dados antes de publicar.
- Migrar os dez pisos especiais com recortes e comportamento dinâmico apropriados; validar posição de obstáculos, perigos, spawn e desempenho em cada mapa.
- Integrar a exportação de mapas aprovados aos GLBs e fornecer armazenamento e colaboração no servidor.

## Primeiras peças 3D de piso

Nos 46 pisos planos, as opções **Laje 3D** e **Pedra 3D** adicionam peças procedurais com geometria própria por célula; a opção Original remove a peça. Cada tipo usa uma malha instanciada, não uma malha independente por célula. As peças se ajustam às células menores nas bordas e são incluídas no mesmo JSON local de versão 1. São protótipos visuais: não recortam o piso subjacente, não adicionam colisão e não são incluídas nos GLBs. A seleção continua usando o plano do piso por baixo das peças. Paredes, estruturas, vegetação e os dez cenários especiais ainda não foram convertidos.

## Estruturas e vegetação experimentais

O mesmo seletor oferece **Muro 3D horizontal**, **Muro 3D vertical** e **Arbusto 3D**. São formas procedurais simples, posicionadas no centro da célula, e ficam disponíveis nos mesmos 46 pisos planos. As duas orientações do muro seguem os eixos locais do piso. Cada célula ainda comporta apenas uma opção: escolher um muro ou arbusto substitui a variante de piso anterior naquela célula, sem apagar células vizinhas. As peças não alteram o piso subjacente nem interagem com o ambiente existente; podem sobrepor estruturas já presentes. São apenas protótipos visuais: **muros não bloqueiam movimento**, arbustos não têm comportamento e nenhuma peça muda colisões ou GLBs. O JSON local registra a opção escolhida, sem sincronização no servidor.
