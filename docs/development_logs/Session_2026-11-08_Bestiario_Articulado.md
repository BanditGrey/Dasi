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
[Geometria]            triângulos e malhas idênticos aos estáticos
[Pose de repouso]      desvio máx. 4.4e-16 (nulo na prática)
[Skins / ossos]        0 / 0 (puppet rígido, como decidido)
[Suíte de testes]      235 testes | 235 aprovados | 0 falhas
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

## 5. PENDÊNCIAS E PRÓXIMOS PASSOS

- **Revisão visual no navegador** criatura por criatura (amplitude, fase,
  pivôs, interseções). Teste automatizado não substitui essa revisão.
- **Texturas PBR** para o bestiário: os GLBs continuam com 0 imagens.
- **Skinning** quando houver malhas definitivas; o puppet rígido é estágio de
  protótipo.
- **Medição de custo**: FPS com vários chefes articulados em cena e orçamento de
  tracks por mixer.
- **Monstros comuns e montarias** (demon, bull, wolf, yeti, mount_dragon,
  mount_chimera, mount_wolf) seguem ausentes; o caminho agora viável é o
  procedural, como o usado nesta sessão.
- Colisões, IA, atributos, dano e VFX continuam no servidor/runtime; os clips
  são apenas camada visual.
