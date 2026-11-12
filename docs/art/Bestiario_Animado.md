# Bestiário articulado — puppet de partes rígidas e clips GLTF

Este documento descreve a segunda família de arquivos do bestiário: os mesmos
doze protótipos estáticos, agora com **pivôs articulados** e **cinco clips de
animação embutidos no GLB**. É uma primeira implementação de rig — não são os
esqueletos finais de 110 a 210 ossos especificados no
[Master Asset Production Manifest](../technical/Master_Asset_Production_Manifest.md).

## Por que puppet rígido em vez de skinning

Os protótipos de `tools/bestiary_models.mjs` já são hierarquias de partes
nomeadas (`balrog_left_wing`, `hydra_head_center`, `kundun_gravitational_halo`,
`zaikan_tail_armored_segment_3`...). Envolver essas partes em pivôs e animar os
pivôs entrega movimento real sem:

- reescrever as malhas para gerar pesos de vértice;
- inventar um esqueleto que a geometria não acompanha;
- aumentar o arquivo (a geometria é reutilizada byte a byte).

O resultado é uma animação de **partes rígidas** (leitura de marionete), coerente
com o estágio de protótipo. Deformação suave exige skinning e continua pendente.

## Arquivos

| Família | Diretórios | Conteúdo |
| --- | --- | --- |
| Estática (inalterada) | `src/client/dev_viewer/models/bestiary/`, `prototypes/3d_bestiary/` | referência visual, **0 clips, 0 skins** |
| Articulada (nova) | `src/client/dev_viewer/models/bestiary_animated/`, `prototypes/3d_bestiary_animated/` | mesma geometria + pivôs + **5 clips** + **3 texturas PBR** |

Regenerar: `npm run build:bestiary-animated-glb` (ou
`node tools/export_bestiary_animated.mjs ALL | <ID>`). Os estáticos continuam
sendo gerados por `npm run build:bestiary-glb`; nada é sobrescrito entre as
famílias.

## Contrato do arquivo

Cada GLB articulado tem raiz `BESTIARY_<ID>` com estes metadados:

```jsonc
{
  "assetKind": "bestiary-creature-animated",
  "rigKind": "rigid-part-puppet",     // sem SkinnedMesh, sem ossos
  "rigIncluded": true,
  "skeletalRigIncluded": false,       // honestidade sobre a técnica
  "animationClipsIncluded": true,
  "animationLocomotion": "WALK",      // clip de locomocão do arquétipo
  "animationStates": ["IDLE", "WALK", "ATTACK", "HURT", "DEATH"],
  "rigJointCount": 28,                // pivôs criados
  "pbrTexturesIncluded": true,
  "pbrTextureSource": "procedural",
  "pbrTextureSize": 256,
  "pbrTextureMaps": ["baseColor", "metallicRoughness", "normal"],
  "collisionsIncluded": false,        // colisão continua no servidor
  "runtimeEffectsIncluded": false     // VFX continua no runtime
}
```

Garantias verificadas por teste (`npm run test:3d`):

- triângulos, materiais e malhas **idênticos** ao protótipo estático;
- pose de repouso **idêntica** (desvio < 1e-6) e acima do plano do solo;
- marcos nomeados (`userData.landmarks`) preservados;
- zero `SkinnedMesh`, zero `Bone`, zero luzes e zero partículas;
- cada track de clip aponta para um pivô existente (`userData.jointPivot`);
- clips de loop (IDLE e locomocão) fecham o ciclo;
- 3 imagens PNG por criatura, todas as malhas com `TEXCOORD_0`, todos os
  materiais ligados às três texturas, `byteLength` do buffer coerente com o
  chunk BIN e chunks alinhados a 4 bytes;
- pixels dentro das faixas do perfil (alpha opaco, canal R do
  metallicRoughness zerado, normais unitárias com +Z dominante) e mapas sem
  emenda no wrap;
- regenerar as texturas reproduz os mesmos bytes;
- as duas cópias (viewer e prototypes) são byte a byte iguais.

## Como o rig é montado

`src/client/dev_viewer/bestiaryRig.js` é partilhado pelo exportador, pelo Dev
Viewer e pelos testes. O processo:

1. **Classificação por nome** — regras ordenadas mapeiam cada nó para um canal
   (`head`, `jaw`, `neck`, `arm`, `leg`, `wing`, `tail`, `weapon`, `spin`,
   `extra`). Grupos-contêiner (`..._body`, `armored_skeleton`, `solar_titan`,
   `chaos_mantle`) são atravessados, nunca reivindicados como parte.
2. **Cadeias e níveis** — segmentos do mesmo membro são ordenados do proximal
   para o distal (por nome anatômico e distância) e agrupados em níveis; cada
   nível vira um pivô aninhado no anterior. É isso que articula asas com
   membrana e ossos, pernas com coxa/joelho/garra e caudas com placas.
3. **Pivôs sem rotação de repouso** — cada pivô nasce com rotação e escala
   identidade e apenas posição. Como os clips gravam quaterniões absolutas,
   qualquer roção de repouso seria sobrescrita na reprodução.
4. **Absorção e anexação** — adereços próximos à cabeça (elmo, viseira, coroa,
   olhos) entram na cadeia da cabeça; nós genéricos `<criatura>_mesh_NNN`
   (serpentes da Górgona, chifres e olhos do Balrog) são anexados rigidamente ao
   pivô de cabeça/mandíbula/pescoço mais próximo para não ficarem parados no ar.
5. **Pivô de corpo** — um `*_rig_body` envolve todo o conteúdo e carrega
   respiração, avanço do golpe, recuo do dano e a queda da morte. Partes não
   articuladas acompanham o corpo.

## Texturas PBR procedurais

Os GLBs estáticos não têm imagens. A família articulada embute **três mapas
256×256 por criatura**, gerados por `tools/procedural_textures.mjs` e injetados
no contêiner GLB por `tools/glb_texture_injector.mjs`.

O `GLTFExporter` do three só codifica imagens com canvas DOM (`putImageData`,
`toBlob`), que não existe no Node. Por isso o caminho é: gerar pixels RGBA →
codificar PNG (codec próprio, `zlib` + CRC32 + filtros por linha) → anexar ao
chunk BIN já exportado e declarar `bufferViews`, `images`, `samplers` e
`textures`. Nenhum byte de geometria ou animação é tocado.

| Mapa | Canais | Como atua |
| --- | --- | --- |
| baseColor | RGB | multiplicado pelo `baseColorFactor` de cada material: modula cor e escurece cavidades (AO de detalhe) |
| metallicRoughness | G = roughness, B = metalness | multiplicados pelos factors do material; R fica zerado, como pede o glTF |
| normal | RGB tangente-espaço | derivado do mesmo campo de altura; `normalTexture.scale` vem do perfil |

Um único sampler (`REPEAT` + mipmaps lineares) é compartilhado, e **o mesmo
conjunto de mapas atende todos os materiais da criatura**: a identidade de cor
continua nos `baseColorFactor`/`metallicFactor`/`roughnessFactor` de cada
material, e as texturas entram como modulação. É isso que mantém o arquivo
leve — cerca de 150 a 260 KB de PNG por criatura.

Superfícies disponíveis: `scales` (escamas), `plates` (placas de armadura),
`cracks` (rachaduras), `leather` (couro/membrana), `facets` (cristais) e `rock`
(rocha/areia). Cada perfil combina de uma a três camadas com pesos; por exemplo,
o Balrog é 50% placas + 34% rachaduras + 16% rocha, e o Dragão Dourado é 72%
escamas + 28% placas.

Três regras fazem os mapas fecharem no wrap:

1. **Ruído periódico** — todo `fbm`/`ridged`/`voronoi` recebe um domínio inteiro
   igual ao seu período base, então `f(0) == f(período)`.
2. **Fase de meia célula** — grades de placas e escamas são deslocadas em 0,5
   célula para a costura do mapa cair no meio de uma placa/escama, nunca no
   sulco (além de evitar um vinco reto nas bordas de UV).
3. **Contagem par de linhas** — a alternância de escamas tem período 2, então a
   frequência é arredondada para par (13 → 14 no Dragão Dourado).

Duas malhas do bestiário eram construídas à mão e não tinham UV (as asas do
Dragão Dourado e do Wyrmling, mais a capa do Tantalos). `ensureMeshUvs` projeta
UVs planares nelas — descartando o eixo de menor extensão e repetindo conforme
o tamanho real — apenas no caminho animado; os protótipos estáticos não mudam.

## Clips por criatura

| ID | Arquétipo | Locomoção | Morte | Pivôs |
| --- | --- | --- | --- | ---: |
| ICE_QUEEN | conjuradora | `WALK` | topple | 7 |
| GORGON | serpente | `SLITHER` | topple | 5 |
| HYDRA | leviatã | `SWIM` | collapse | 27 |
| BALROG | bruto alado | `WALK` | topple | 28 |
| ZAIKAN | quimera aracnídea | `SCUTTLE` | topple | 54 |
| KUNDUN | soberano do caos | `FLOAT` | sink | 35 |
| GOLDEN_TITAN | titã solar | `WALK` | topple | 21 |
| GOLDEN_BUDGE_DRAGON | wyrmling | `FLY` | collapse | 25 |
| GOLDEN_SOLDIER | cavaleiro esquelético | `WALK` | topple | 34 |
| GOLDEN_LIZARD_KING | quadrúpede anfíbio | `WALK` | topple | 49 |
| GOLDEN_TANTALOS | colosso do deserto | `WALK` | topple | 32 |
| GOLDEN_DRAGON | dragão colossal | `FLY` | collapse | 54 |

- **IDLE** (6 s, loop): respiração, olhar, mandíbula, cauda em fases, asas em
  repouso e giros perpétuos de halos/anéis.
- **Locomoção** (0,55 s a 3,2 s, loop): passada e braceio alternados, batida de
  asa, ondulação de nado/rastejo ou levitação, conforme o arquétipo.
- **ATTACK** (1,15 s; 1,5 s para conjuradores): preparo, golpe e recuperação,
  com avanço do corpo, abertura de mandíbula, chicote de cauda e abertura de asas.
- **HURT** (0,55 s): recuo curto do impacto.
- **DEATH** (2 s a 2,4 s): queda conforme o estilo (`topple`, `collapse`,
  `sink`), membros soltos e pose final segura (`clampWhenFinished`).

O estado lógico `MOVE` resolve o clip de locomocão do arquétipo; o controlador
descobre o nome no arquivo, então novos arquétipos não exigem mudança no runtime.

## Runtime

`createBestiaryAnimationController(THREE, model, clips)` devolve uma máquina de
estados sobre `AnimationMixer`:

- `setBaseState('IDLE' | 'MOVE')` — estados persistentes, com crossfade;
- `trigger('ATTACK' | 'HURT')` — tiros únicos que voltam sozinhos ao estado base;
- `die()` — terminal, segura a pose final;
- `update(delta)` — avança o mixer; `dispose()` — libera o cache do mixer.

Integrações atuais:

- **Dev Viewer** (`dasi3dViewer.js`): criaturas com GLB articulado entram com
  clips reais e ganham o painel *Clips do Bestiário Articulado*
  (IDLE / Locomoção / ATTACK / HURT / DEATH). O badge de status passa a
  `🦴 Bestiário: GLB articulado`.
- **Arena realtime** (`dasi3dRealtimeArena.js`): cada entidade sincronizada
  carrega o GLB articulado, alterna IDLE/MOVE pela distância ao alvo, vira para
  a direção do deslocamento, dispara ATTACK ao entrar no alcance do jogador e
  HURT quando o HP cai; a morte toca o clip DEATH antes do afundamento. O
  controlador é descartado quando a entidade sai da coleção.

Em ambos os casos, se o arquivo articulado não existir, o carregamento recai
para o protótipo estático e depois para o conteúdo procedural — nada quebra.

## Revisão visual pendente

Os testes garantem estrutura, geometria e reprodutibilidade — **não** garantem
que o movimento seja bonito. A revisão criatura por criatura no navegador segue
pendente. Roteiro:

1. Aba **💎 Heróis & Monstros 3D** → categoria **👹 Monstros** → criatura.
2. O badge deve ler `🦴 Bestiário: GLB articulado — 5 clips (<locomoção>)`.
   Qualquer outro texto significa que o asset articulado não carregou.
3. Painel **CLIPS DO BESTIÁRIO ARTICULADO**: IDLE, Locomoção, ATTACK, HURT,
   DEATH.
4. Comportamento em jogo (giro para o alvo, ataque por alcance, morte antes do
   afundamento): abas **👹 Chefes & Invasões** e **⚔️ Arena de Combate**.

### Pontos de atenção conhecidos

| Criatura | O que olhar primeiro | Por quê |
| --- | --- | --- |
| ICE_QUEEN | rigidez da passada, cetro e coroa acompanhando | só 7 pivôs; o vestido é peça rígida única |
| GORGON | as 8 serpentes seguirem a cabeça | eram nós soltos, anexados por proximidade |
| HYDRA | interpenetração das 3 cabeças e propagação da ondulação | 3 pescoços de 5 níveis animados em fase |
| BALROG | chifres e olhos seguirem a cabeça; asa casando com a passada | adereços anexados rigidamente |
| ZAIKAN | tremor no ciclo de 0,55 s e alternância das 4 pernas | locomocão mais rápida do elenco |
| KUNDUN | giro contínuo do halo sem salto; alternância dos 4 braços | canal `spin` dá voltas completas |
| GOLDEN_TITAN | ombreiras **não** acompanham a cabeça, de propósito | ficaram fora da absorção para não grudarem no elmo |
| GOLDEN_BUDGE_DRAGON | textura esticada nas asas | UVs planares injetadas |
| GOLDEN_SOLDIER | escudo e machado permanecerem na mão no ATTACK | armas vêm de subárvores aninhadas |
| GOLDEN_LIZARD_KING | placas dorsais seguirem a coluna; passada quadrúpede | 49 pivôs em corpo anfíbio |
| GOLDEN_TANTALOS | projeção da capa do deserto; peso do maul no golpe | UVs planares injetadas na capa |
| GOLDEN_DRAGON | alongamento nas asas e amplitude suficiente para o porte | UVs injetadas + maior envergadura do elenco |

Três eixos de defeito provável: **rig** (parte que não acompanha o pai,
interpenetração, salto no reinício do loop, amplitude e fase), **textura**
(detalhe forte ou fraco, repetição visível, emenda de UV, alongamento, metal sem
leitura de metal) e **runtime** (ataque disparando na distância errada, monstro
andando de lado ou de costas, afundamento antes do clip terminar).

### Parâmetros de ajuste

| Camada | Onde | O que muda |
| --- | --- | --- |
| Amplitude e fase | `bestiaryRig.js` (`createBestiaryAnimationClips`) | intensidade por canal, decaimento `0,72^nível`, atraso `-0,42*nível` |
| Durações | `bestiaryRig.js` | IDLE 6 s · WALK 1,0 · SCUTTLE 0,55 · SLITHER 1,5 · SWIM 1,8 · FLOAT 3,2 · FLY 0,9 · ATTACK 1,15 (1,5 conjurador) · HURT 0,55 · DEATH 2,0 (2,4 `sink`) |
| Superfície | `procedural_textures.mjs` (`BESTIARY_TEXTURE_PROFILES`) | mistura e frequência dos padrões, `contrast`, `normalScale`, `roughnessRange`, `metalnessRange`, `tint`, resolução |
| UVs injetadas | `glb_texture_injector.mjs` (`ensureMeshUvs`) | `tileWorldSize` (repetição por metro) |
| Arena | `dasi3dRealtimeArena.js` | alcance do ataque (chefe 4,6 / mob 3,0), cooldown (2,4 s / 1,7 s), limiar de MOVE (0,35), suavização do giro |

Toda alteração nesses parâmetros exige regenerar os arquivos
(`npm run build:bestiary-animated-glb`) e rodar `npm run test:3d`, porque os
testes comparam os GLBs publicados byte a byte contra o que o código produz.

## Limitações e próximos passos

- É animação de partes rígidas: não há deformação de malha, secundariedade
  (pano, cabelo, gordura) nem correção de interseção entre peças.
- Os pivôs derivam de heurísticas de nome e geometria; a qualidade do
  movimento precisa de **revisão visual no navegador** criatura por criatura e
  ajuste de amplitude, fase e pivôs.
- Nenhum VFX, áudio, colisão, hitbox, atributo ou comportamento de IA foi
  alterado: os clips são apenas a camada visual.
- As texturas são 256², procedurais e compartilhadas por criatura: não são os
  conjuntos 2x/4K do manifesto, não há mapas por peça (cada material recebe o
  mesmo detalhe) e não existem `emissive`, `occlusion` ou mapas de detalhe
  secundários. Os GLBs estáticos seguem sem imagens.
- O ataque na arena é disparado por proximidade no cliente, apenas como leitura
  visual; o servidor segue autoritativo para dano e habilidades.
