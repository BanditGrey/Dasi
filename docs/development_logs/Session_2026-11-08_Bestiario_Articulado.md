# SESSÃO: 08/11/2026 — BESTIÁRIO ARTICULADO (PUPPET RÍGIDO + CLIPS GLTF)

> **Status:** Concluído — testes e typecheck passando  
> **Escopo:** rig e animação dos 12 protótipos do bestiário, integração no Dev
> Viewer e na arena realtime, cobertura automatizada e documentação.

---

## 1. PONTO DE PARTIDA (AUDITORIA)

Levantamento estrutural dos GLBs existentes antes de qualquer mudança
(`tools/audit_hero_glb.mjs` + varredura própria):

| Família | Arquivos | Skins | Clips | Texturas |
| --- | ---: | --- | --- | --- |
| `models/animated_heroes/` | 5 | 1 por arquivo | 20–21 | 10–16 imagens |
| `models/monsters/` | 2 | 1 por arquivo | 95 / 6 | 1 / 0 |
| `models/bestiary/` | 12 | **0** | **0** | **0** |
| `models/modular_heroes/` | 77 | 0 | 0 | 0 |
| `models/armory/` | 19 | 0 | 0 | 0 |
| `models/events/` + `models/scenarios/` | 3 + 56 | 0 | 0 | 0 |

Diagnóstico: os heróis já têm rig e clips reais (importados de acervo externo),
mas o bestiário — justamente os `BOSS_*` marcados como `[SPEC]` no manifesto —
não tinha nenhuma animação no arquivo. O caminho externo
(`tools/import_meshy_models.mjs`) aponta para `D:/Lemuria-Online-main` e
`C:/Users/Daniel/Downloads`, ou seja, é inviável fora da máquina Windows
original; os 4 monstros e as 3 montarias mapeados ali nunca chegaram ao repo.

Decisão registrada com o responsável: **continuar pelo bestiário**, usando
**puppet de partes rígidas** (clips animando pivôs sobre os nós já nomeados) em
vez de skinning, preservando a geometria e os testes existentes.

## 2. O QUE FOI IMPLEMENTADO

### 2.1 Motor de rig e clips (`src/client/dev_viewer/bestiaryRig.js`, novo)

Módulo partilhado por exportador, Dev Viewer, arena e testes:

- **Classificação por nome** em 10 canais (`head`, `jaw`, `neck`, `arm`, `leg`,
  `wing`, `tail`, `weapon`, `spin`, `extra`), com regras ordenadas e
  tokenização para evitar falsos positivos.
- **Grupos-contêiner atravessados**: `golden_soldier_armored_skeleton`,
  `hydra_coiled_body`, `golden_tantalos_solar_titan`, `kundun_chaos_mantle` etc.
  nunca viram "parte"; o rig desce até os membros reais.
- **Cadeias com níveis aninhados** (proximal → distal) por nome anatômico e
  distância, o que articula asas com membrana e ossos, pernas com
  coxa/joelho/garra e caudas com placas escalonadas.
- **Pivôs com rotação/escala identidade**: os clips gravam quaterniões
  absolutas, então qualquer rotação de repouso seria sobrescrita na reprodução.
- **Absorção e anexação de adereços**: elmo/viseira/coroa/olhos entram na cadeia
  da cabeça; nós genéricos `<criatura>_mesh_NNN` (as 8 serpentes da Górgona,
  chifres e olhos do Balrog) são anexados rigidamente ao pivô mais próximo.
- **Pivô de corpo** (`*_rig_body`) carregando respiração, avanço, recuo e queda.

Clips gerados por criatura: `IDLE` (6 s, loop), locomocão do arquétipo (loop),
`ATTACK`, `HURT` e `DEATH` (tiros únicos). Doze perfis de arquétipo definem
locomoção (`WALK`, `SCUTTLE`, `SLITHER`, `SWIM`, `FLY`, `FLOAT`), estilo de
morte (`topple`, `collapse`, `sink`), se é conjurador e a intensidade.

### 2.2 Exportador (`tools/export_bestiary_animated.mjs`, novo)

`npm run build:bestiary-animated-glb` gera as 12 criaturas em
`src/client/dev_viewer/models/bestiary_animated/` e
`prototypes/3d_bestiary_animated/`. A família estática permanece intacta e
continua sendo gerada por `npm run build:bestiary-glb`.

### 2.3 Runtime

- `dasi3dContent.js`: `GLTF_BESTIARY_ANIMATED_MAP` e
  `loadBestiaryCreatureAnimatedGLB(...)`, que anexa o controlador em
  `model.userData.animController` e **recai** para o protótipo estático (e dele
  para o procedural) se o arquivo animado não existir.
- `dasi3dViewer.js`: criaturas articuladas entram com clips reais; novos métodos
  `hasAnimatedBestiary(id)` e `triggerBestiaryAnimation(state)`; o mixer é
  atualizado no loop do visualizador.
- `index.html` + `app.js`: painel *Clips do Bestiário Articulado* com
  IDLE / Locomoção / ATTACK / HURT / DEATH, exibido apenas para criaturas com
  GLB articulado.
- `dasi3dRealtimeArena.js`: entidade sincronizada carrega o GLB articulado,
  alterna IDLE/MOVE pela distância ao alvo, **vira para a direção do
  deslocamento**, dispara ATTACK por alcance e HURT na queda de HP, toca DEATH
  antes do afundamento e descarta o mixer quando a entidade sai da coleção.

### 2.4 Controle de qualidade

- `src/client/dev_viewer/tests/bestiary_rig.test.ts` (6 testes): classificação
  por nome, perfis, preservação de pose/geometria/marcos, pivôs em identidade,
  fechamento de loop, controlador de estados.
- `src/server/world/tests/bestiary_animated_coverage.test.ts` (7 testes):
  catálogo e caminhos, geometria idêntica ao estático, pose de repouso, 5 clips
  mirando pivôs existentes, estáticos continuam sem clips, carregamento com
  controlador e fallback, reprodução real com `AnimationMixer`.
- `npm run test:3d` passa a incluir a nova cobertura; `npm run test:rig` roda o
  rig isoladamente.

## 3. RESULTADOS MEDIDOS

```
[Bestiário articulado] 12/12 criaturas exportadas
[Pivôs]                5 (Gorgon) a 54 (Zaikan / Dragão Dourado)
[Clips por criatura]   5 (IDLE, locomocão, ATTACK, HURT, DEATH)
[Texturas por criatura] 3 mapas PBR procedurais 256² (150 a 260 KB)
[Geometria]            triângulos e malhas idênticos aos estáticos
[Pose de repouso]      desvio máx. 5.0e-16 (nulo na prática)
[Skins / ossos]        0 / 0 (puppet rígido, como decidido)
[Tamanho da família]   6 MB por diretório (eram 4 MB sem texturas)
[Suíte de testes]      241 testes | 241 aprovados | 0 falhas
[Typecheck]            0 erros (TypeScript strict)
```

## 4. DEFECTOS ENCONTRADOS E CORRIGIDOS DURANTE A SESSÃO

1. `absorbAttachments`, `findNearestChain` e `geometricSide` usavam `THREE` sem
   recebê-lo por parâmetro — falhavam só em algumas criaturas, conforme o
   caminho executado.
2. A travessia de classificação não descia em grupos não reivindicados:
   criaturas com corpo embrulhado em um único grupo saíam com **1 pivô**.
3. `armored_skeleton` casava com `/arm/` e o Golden Soldier virava um braço só
   (2 pivôs). Corrigido com tokenização `(^|_)arm(_|$)`.
4. `CONTAINER_TEST` casava com o prefixo da própria criatura
   (`golden_TITAN_sunblade`), engolindo a arma do Titã Dourado. O teste agora
   vale sobre o nome sem o prefixo.
5. Pivôs aninhados herdavam rotação de repouso ao preservar a transformação
   mundial — sobrescreveriam a pose ao reproduzir. Pivôs agora nascem só com
   posição.
6. Quatro tracks usavam meia-frequência (`angle * 0.5`) com número ímpar de
   ciclos e não fechavam o loop.

## 5. SEGUNDA ETAPA — TEXTURAS PBR PROCEDURAIS

Concluída na mesma sessão, fechando o item de texturas do escopo.

### 5.1 Por que injetar no contêiner em vez de exportar

O `GLTFExporter` do three codifica imagens com canvas DOM (`putImageData` e
`toBlob`), indisponível no Node — por esse caminho o exportador simplesmente não
consegue escrever uma imagem. As alternativas eram uma dependência nativa de
canvas (`node-canvas`/`@napi-rs/canvas`) ou fazer a cirurgia no contêiner.
Optou-se pela segunda: **zero dependências novas**, determinística e testável.

Fluxo: pixels RGBA gerados por ruído → PNG codificado por codec próprio (`zlib`
+ CRC32 + escolha de filtro por linha) → anexado ao chunk BIN do GLB já
exportado → `bufferViews`, `images`, `samplers` e `textures` declarados → todos
os materiais ligados aos três mapas. Geometria, clips e fatores de material não
são tocados.

### 5.2 Decisões de conteúdo

- **Um conjunto de mapas por criatura**, compartilhado por todos os materiais. A
  identidade de cor continua nos fatores (`baseColorFactor`, `metallicFactor`,
  `roughnessFactor`); as texturas entram como **modulação multiplicativa**, que
  é exatamente a semântica do glTF. Custo: 150 a 260 KB por criatura, em vez de
  um mapa por peça.
- **Sem mapa de emissão**: com conjunto compartilhado, tudo brilharia. Os fatores
  `emissive` existentes (olhos, coração de magma, halo) foram mantidos.
- Seis superfícies combináveis: `scales`, `plates`, `cracks`, `leather`,
  `facets`, `rock`.
- `ensureMeshUvs` projetou UVs planares nas cinco malhas construídas à mão que
  não tinham (asas do Dragão Dourado e do Wyrmling, capa do Tantalos), apenas no
  caminho animado; os estáticos não mudam.

### 5.3 Defeitos de periodicidade encontrados pelo teste de emenda

O teste compara a variação entre a última e a primeira coluna/linha com a
variação média interna do campo de altura. Reprovou três vezes seguidas, e cada
reprovação era um defeito real:

1. **Períodos fixos não divisores do domínio** — `cracks` amostrava domínio 5 com
   período 6, `leather` domínio 20,4 com período 8, `facets` domínio 7,2 com
   período 4. Corrigido derivando o período do domínio (spans inteiros).
2. **`crown` assimétrico em `plates`** — usava `min(lu, lv)` contra
   `min(1-lu, 1-lv)`, que salta no wrap. Substituído por `|du - dv|`, com
   `du = min(lu, 1-lu)`, periódico nos dois eixos.
3. **Grade alinhada à borda e contagem ímpar de linhas** — o wrap caía exatamente
   no sulco da placa (rampa mais íngreme que a média interna) e a alternância de
   escamas, de período 2, não fechava com 13 linhas. Corrigido com fase de meia
   célula e arredondamento para contagem par.

Resultado final: pior razão emenda/interna 1,08 (Rainha de Gelo), dentro do
limite de 2,0; as demais entre 0,32 e 0,86.

### 5.4 Verificações acrescentadas

- `bestiary_texture_coverage.test.ts` (6 testes): perfis e faixas, contêiner GLB
  (alinhamento, `byteLength`, reescrita idêntica, cópias iguais), três imagens
  PNG e materiais ligados, pixels dentro das faixas do perfil (alpha opaco, R
  zerado, normais unitárias), reprodutibilidade byte a byte e ausência de
  emenda, e estáticos continuam sem imagens.
- `decodePNG` valida assinatura, CRC de cada chunk, IHDR e filtros; o inflate é
  feito pelo `zlib` do Node, ou seja, por um decodificador independente do
  codificador.
- Os testes que carregam GLB passaram a definir `globalThis.self` (o
  `GLTFLoader` referencia `self.URL` para decodificar imagens) e a silenciar os
  avisos de textura, já que decodificar imagem é capacidade do navegador.

## 6. PENDÊNCIAS E PRÓXIMOS PASSOS

- **Revisão visual no navegador** criatura por criatura (amplitude, fase, pivôs,
  interseções e leitura das texturas sob luz real). Teste automatizado não
  substitui essa revisão.
- **Texturas por peça** e mapas de emissão/oclusão quando houver UVs definitivos;
  hoje há um conjunto compartilhado por criatura.
- **Skinning** quando houver malhas definitivas; o puppet rígido é estágio de
  protótipo. Os GLBs estáticos seguem sem imagens, de propósito (referência).
- **Medição de custo**: FPS com vários chefes articulados em cena e orçamento de
  tracks por mixer.
- **Monstros comuns e montarias** (demon, bull, wolf, yeti, mount_dragon,
  mount_chimera, mount_wolf) seguem ausentes; o caminho agora viável é o
  procedural, como o usado nesta sessão.
- Colisões, IA, atributos, dano e VFX continuam no servidor/runtime; os clips
  são apenas camada visual.
