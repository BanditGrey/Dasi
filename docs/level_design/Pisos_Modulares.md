# Pisos modulares — primeira etapa

O Dev Viewer divide pisos planos identificados na geometria procedural em peças visuais de até 4 × 4 unidades; no EVT_03 cada célula acompanha uma laje de 6,6 × 6,6 unidades. O limite do piso original, incluindo peças menores nas bordas, é preservado. Nos pisos contínuos as peças usam `InstancedMesh`; no EVT_03 cada laje tem sua própria malha para acompanhar suas transformações, o que requer avaliação de desempenho.

## Como usar

1. Abra o visualizador 3D e selecione um cenário.
2. Em **Tiles visuais (experimental)**, escolha uma variante e dê duplo clique no piso, ou informe coluna e linha e clique em **Aplicar**. As coordenadas são índices locais do piso, começando em zero; não são coordenadas do mundo.
3. **Limpar** restaura todas as células do cenário. **Exportar JSON** permite guardar ou compartilhar as alterações; **Importar JSON** aceita somente documentos compatíveis com o cenário e dimensões atuais.
4. **Exportar GLB visual** baixa uma cópia estática do cenário no estado atual, incluindo as edições visuais. Não substitui o blockout original nem publica alterações no servidor.

As edições são armazenadas no `localStorage` deste navegador, por ID canônico do cenário, e não são publicadas no servidor. As variantes de cor são tonalidades do material existente; Laje 3D e Pedra 3D são peças procedurais visuais sobre o piso, sem alteração de colisor. Os GLBs-base do catálogo permanecem inalterados; use **Exportar GLB visual** para gerar um arquivo separado com as edições. Alguns objetos ou decorações já existentes podem encobrir parcialmente o piso; as peças alteradas são desenhadas ligeiramente acima para facilitar a visualização.

## Cobertura e limitações

Pisos dos **56 cenários** podem ser editados: 46 planos, cinco superfícies retangulares sobre blocos (`VOL_02`–`VOL_05` e `EVT_01`), quatro superfícies circulares ou poligonais (`ICA_01`, `ICA_02`, `EVT_02` e `EVT_04`) e as 36 lajes separadas do `EVT_03`. Nos blocos, a grade fica sobre o topo sem substituir o volume original. Nas superfícies circulares e octogonais, só células inteiras dentro do círculo inscrito são editáveis: a faixa próxima à borda permanece original, sem recorte parcial. Assim os tiles não avançam sobre o vazio. As estruturas e decorações existentes ainda podem encobrir as peças.

No `EVT_03`, cada célula corresponde a uma laje original de 6,6 × 6,6 unidades; as lacunas permanecem vazias e as peças visuais acompanham a laje caso ela se mova ou seja ocultada. Isso não implementa a mecânica de desabamento. A ponte de `VOL_04` é estática no visualizador atual; a grade não implementa movimento de ponte levadiça.

Colisões, perigos, spawn e regras continuam exclusivamente em `src/server/world/CollisionSystem.ts`. A edição visual não altera essas regras; não use o editor como fonte de verdade para obstáculos. Também não há sincronização entre jogadores nem persistência no servidor. O catálogo de objetos e os GLBs-base continuam como antes.

## Próximas etapas

- Criar módulos 3D reais de piso, paredes, estruturas e vegetação, com conectores e variantes por bioma; substituir peças individuais sem mudar o restante da cena.
- Definir um formato de mapa versionado compartilhado entre servidor e cliente, com identificação de peças, rotação, camadas e colisores; validar os dados antes de publicar.
- Permitir recortes de borda e implementar a mecânica real das lajes e pontes com recortes e comportamento dinâmico apropriados; validar posição de obstáculos, perigos, spawn e desempenho em cada mapa.
- Definir publicação de mapas aprovados, integração de colisões e armazenamento e colaboração no servidor.

## Primeiras peças 3D de piso

Nos 56 pisos editáveis, as opções **Laje 3D** e **Pedra 3D** adicionam peças procedurais com geometria própria por célula; a opção Original remove a peça. Cada tipo usa uma malha instanciada, não uma malha independente por célula. As peças se ajustam às células menores nas bordas e são incluídas no JSON local de versão 2. São protótipos visuais: não recortam o piso subjacente, não adicionam colisão e são incluídas apenas no GLB visual exportado pelo editor. A seleção continua usando o plano do piso por baixo das peças. O recorte parcial das bordas circulares ainda não está disponível.

## Estruturas e vegetação experimentais

O mesmo seletor oferece **Muro 3D horizontal**, **Muro 3D vertical** e **Arbusto 3D**. São formas procedurais simples, posicionadas no centro da célula, e ficam disponíveis nos mesmos 56 pisos editáveis. As duas orientações do muro seguem os eixos locais do piso. Cada célula comporta uma variante de piso e um objeto em camadas separadas. Escolher outro objeto substitui somente o objeto daquela célula; **Remover objeto** limpa apenas essa camada e **Original** restaura apenas o piso. **Limpar** remove todas as alterações das duas camadas. As peças não alteram o piso subjacente nem interagem com o ambiente existente; podem sobrepor estruturas já presentes. São apenas protótipos visuais: **muros não bloqueiam movimento**, arbustos não têm comportamento e nenhuma peça muda colisões ou os GLBs-base. O JSON de versão 2 registra ambas as camadas, sem sincronização no servidor. Documentos exportados em versão 1 e edições locais antigas são migrados ao carregar; um arquivo inválido não substitui as edições atuais.

## Formato e exportação

O JSON versão 2 contém `scenarioId` canônico, `tileSize`, `cols`, `rows` e os objetos `floor` e `objects`. As chaves são índices `coluna,linha` a partir de zero. O tamanho é 4 nas grades comuns e 6,6 no `EVT_03`, cujas células correspondem às lajes originais e não incluem os espaços entre elas. Exemplo para um cenário de grade 2 × 2 (as dimensões reais variam por cenário):

```json
{
  "version": 2,
  "scenarioId": "LOR_01",
  "tileSize": 4,
  "cols": 2,
  "rows": 2,
  "floor": { "0,0": "laje" },
  "objects": { "0,0": "muro_x", "1,1": "arbusto" }
}
```

O exemplo ilustra a estrutura, não é um arquivo importável para LOR_01: a validação exige dimensões reais e rejeita células fora da área editável, inclusive nas bordas circulares. A importação verifica o documento completo antes de substituir a edição atual. Versão 1 é aceita e separada em camadas ao carregar; os dados locais também são migrados na leitura. O JSON é **somente visual**, não é um mapa compartilhado ou autoritativo e não descreve colisores.

O GLB visual é um snapshot estático da cena selecionada: preserva as transformações atuais e os módulos e cores aplicados, convertendo as instâncias em malhas comuns. Luzes, partículas e objetos marcados como exclusivos de runtime são omitidos. Movimentos futuros, regras do jogo, perigos, spawn e colisões não são exportados. Um cenário com muitas células pode gerar arquivo maior e demorar mais; não há benchmark de desempenho ou validação visual em navegador. O exportador Three.js incluído em `libs/GLTFExporter.js` corresponde à versão 0.186 do Three.js fornecida com o visualizador. O script `tools/export_scenario_glb.mjs` continua gerando os blockouts-base, independentemente das edições locais.
