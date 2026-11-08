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
| Articulada (nova) | `src/client/dev_viewer/models/bestiary_animated/`, `prototypes/3d_bestiary_animated/` | mesma geometria + pivôs + **5 clips** |

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

## Limitações e próximos passos

- É animação de partes rígidas: não há deformação de malha, secundariedade
  (pano, cabelo, gordura) nem correção de interseção entre peças.
- Os pivôs derivam de heurísticas de nome e geometria; a qualidade do
  movimento precisa de **revisão visual no navegador** criatura por criatura e
  ajuste de amplitude, fase e pivôs.
- Nenhum VFX, áudio, colisão, hitbox, atributo ou comportamento de IA foi
  alterado: os clips são apenas a camada visual.
- Texturas PBR continuam ausentes nos protótipos do bestiário (0 imagens nos
  GLBs); é a próxima frente de acabamento.
- O ataque na arena é disparado por proximidade no cliente, apenas como leitura
  visual; o servidor segue autoritativo para dano e habilidades.
