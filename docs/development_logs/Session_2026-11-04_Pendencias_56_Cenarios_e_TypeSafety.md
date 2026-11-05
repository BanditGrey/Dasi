# 🧭 Dasi MMORPG — Registro de Sessão: Fechamento das Pendências (56 Cenários, Type-Safety e Dev Viewer)

> **Data de Execução:** 04 de Novembro de 2026  
> **Branch:** `arena/68c90144-dasi`  
> **Status:** 🟢 **Pendências do backlog imediato concluídas — 133/133 testes, type-check limpo**  
> **Repositório Oficial:** `https://github.com/BanditGrey/Dasi`  
> **Dev Viewer WebGL:** `http://localhost:8080`

---

## 1. Resumo Executivo da Sessão

Esta sessão fechou o conjunto de pendências deixadas em aberto na sessão anterior
(`Session_2026-11-04_Master_Scenarios_3D_GLB_and_AAA_Art.md`). O foco foi eliminar
**divergências entre documentação, servidor e cliente** e transformar regras que só
existiam em papel em invariantes verificadas por teste.

| # | Pendência | Situação anterior | Situação agora |
| :---: | :--- | :--- | :--- |
| 1 | Catálogo dos 56 cenários | Docs/cliente falavam 56, **servidor tinha apenas 47** | **56 nos dois lados**, em `SCENARIO_CATALOG` |
| 2 | Fonte de verdade duplicada | Geometria escrita 2× (TS e JS) e já divergente em 50+ cenários | **1 única fonte**, cliente importa o módulo do servidor |
| 3 | Regressão silenciosa | Nada impedia as duas cópias divergirem | **`scenario_parity.test.ts`** bloqueia divergências |
| 4 | Geometria 3D dos 9 cenários novos | `VOL_02..05`, `EVT_02..04` sem cena 3D | **56/56 constroem cena** |
| 5 | `npm run typecheck` | Não existia; **47 erros** de tipo | **`tsc --noEmit` strict, 0 erros** |
| 6 | `definitions.ts` corrompido | 6 chaves duplicadas (`kundun_staff`, `box_of_kundun_1..5`) | Bloco truncado removido, catálogo íntegro |
| 7 | Botões de teletransporte da arena | 3 de 8 biomas sem botão; `updateMapButtonsUI` referia 8 | **8 biomas + atalhos `1..8`** |
| 8 | Checklist do GDD | 4 itens já entregues ainda desmarcados | Itens concluídos + backlog real de curto prazo |

---

## 2. Catálogo Único de Cenários (`SCENARIO_CATALOG`)

`src/server/world/CollisionSystem.ts` passou a expor uma constante **imutável e declarativa**
com os 56 cenários e toda a geometria de colisão:

```ts
export const SCENARIO_CATALOG: readonly ScenarioCatalogEntry[] = [ /* 56 entradas */ ];
```

- `CollisionSystem` apenas **indexa** o catálogo por `id` (`LOR_01`) e por `code` (`LORENCIA_CITADEL`).
- `src/client/dev_viewer/dasiCollisionEngine.js` deixou de manter sua própria cópia e agora faz:

```js
import { SCENARIO_CATALOG } from '#dasi/server/world/CollisionSystem.ts';
for (const scenario of SCENARIO_CATALOG) DasiCollisionEngine.registerScenario(scenario);
```

- O import map do `index.html` resolve `#dasi/server/` → `/src/server/`, e o `package.json`
  declara o mesmo subpath em `"imports"` para o Node 22.
- O `GameServer` passou a servir `/src/**` a partir da raiz do repositório
  (com bloqueio de `tests/`, `node_modules/` e path traversal) e a devolver `.ts`
  com `Content-Type: application/javascript`.

### 2.1 Cenários adicionados ao servidor

| Zona | IDs | Destaques no catálogo |
| :--- | :--- | :--- |
| Valley of Loren | `VOL_01`..`VOL_05` | `instanced: true`; Portão Ciclópico **25M HP**; 4 Estátuas da Vida **8M HP**; fosso de lava como `HAZARD`; 8 colunas do Salão do Trono |
| Devil Square | `EVT_02` | Grade circular `r=24.5m`, 4 totens de crânios, pedestal do Baú de Ouro |
| Chaos Castle | `EVT_03` | Anel de abismo + 8 lajes modulares (colapso por etapa) |
| Coliseu de Duelos | `EVT_04` | Cúpula de força `r=17.5m`, 4 plintos octogonais, pylon do placar |

`EVT_01` (Blood Castle) foi expandido de 6 para **22 colisores**, incluindo os
**16 Arcanjos Lamentantes** previstos no level design.

### 2.2 Zonas de perigo (`HAZARD`)

Antes, `HAZARD` era tratado como cilindro sólido (bloqueava o jogador em cima da lava).
Agora:

- o movimento **não** é bloqueado;
- o resultado da resolução passou de `{x, z, collided}` para
  `{x, z, collided, collidersHit, hazardsHit}`;
- os testes de física continuam válidos e ganharam cobertura de perigo.

---

## 3. Testes

| Suíte | Testes | O que garante |
| :--- | :---: | :--- |
| `collision.test.ts` | 8 | 56 cenários, contagem por zona, spawn fora de colisor, HP de portão |
| `scenario_parity.test.ts` | 4 | IDs, bounds, spawn, nº de colisores e **física idêntica** servidor ⇄ cliente |
| `scenario_3d_coverage.test.ts` | 2 | Os 56 IDs **constroem geometria 3D real** no Three.js (sem WebGL) e as 9 arenas geram luz dinâmica |
| demais suítes | 119 | Inventário, economia, caos, rede, combate, chefes, eventos, masmorras, gameplay |
| **Total** | **133** | **41 suítes, 0 falhas** |

Novo teste de destaque — o spawn nunca nasce preso:

```ts
const drift = Math.hypot(resolved.x - sc.spawnPoint.x, resolved.z - sc.spawnPoint.z);
assert.ok(drift < 0.001, `Spawn de ${id} está dentro de um colisor`);
```

Isso revelou e corrigiu dois spawns inválidos (`VOL_01` e `EVT_04`).

---

## 4. Type-Safety (`npm run typecheck`)

Criado `tsconfig.json` (ES2022, `strict`, `allowImportingTsExtensions`, `noEmit`) e o
script `npm run typecheck`. Foram corrigidos 47 erros reais, entre eles:

- **`definitions.ts`**: bloco duplicado/truncado no fim do arquivo (6 chaves repetidas) — removido;
- **`ItemRequirements`**: todos os atributos passaram a ser opcionais (itens de MU exigem subconjuntos diferentes);
- **`CombatEngine`**: usava `wDmg.minDamage/hasLuck/hasSkill/excellentOptions`, mas `Item.calculateDamage`
  devolve `{min,max}` e `ItemInstance` usa `luck/skill/excellentMask` — o bônus de dano excelente estava **sempre 0**;
- **`CharacterSummary`**: faltava `command` (atributo do Dark Lord), usado por `BoxOfKundun` e pela alocação de pontos;
- **`JewelSystem`**: `GameServer` chamava `applyChaosMachineCombination`, que não existia — alias adicionado;
- **`BloodCastleInstance`**: comparação impossível `stage !== 'TRIUMPH'` após o guard inicial.

---

## 5. Dev Viewer (WebGL)

- **9 cenas 3D novas** em `dasi3dScenarios.js` (`VOL_02..VOL_05`, `EVT_02..EVT_04`):
  baluarte com ameias e portão 25M HP, pátio das 4 estátuas com halos, ponte levadiça sobre
  dois lagos de lava, salão do trono com 7 degraus e Selo da Coroa, pentagrama incandescente
  do Devil Square, tablado de lajes do Chaos Castle e octógono com placar holográfico.
- **`resolveScenarioBiome()`** em `dasi3dContent.js`: resolve `VOL_*`/`EVT_*` para a arte GLB
  correta, evitando `undefined` no `GLTF_BIOME_MAP` (as arenas `EVT_02..04` reutilizam a arte
  temática até receberem GLB próprios).
- **Faixa de reinos da Arena** expandida de 3 para **8 biomas**; atalhos `1..8` no teclado.
- **Inicialização resiliente**: `app.js` inicializa o cliente mesmo se o `DOMContentLoaded`
  já tiver ocorrido (script deferido/módulo).
- O dropdown de cenários e os botões de cenário agora incluem as zonas de Cerco e Eventos.

### 5.1 Verificações executadas

Sem navegador disponível no ambiente, a validação foi feita de três formas:

1. **Build das 56 cenas** com o Three.js real em Node — `56/56` OK;
2. **Grafo de módulos via HTTP** com o import map real — nenhum 404/bare specifier não resolvido;
3. **Rotas estáticas** do `GameServer` — `/`, `/app.js`, `/libs/*`, `/models/*`, `/src/**`
   respondem 200; `tests/`, `node_modules/` e travessia retornam 403/404.

---

## 6. O Que Continua Aberto

Ver `docs/GDD_Dasi.md` § 11.1. Em resumo:

1. Sistema de Guildas & Alianças (não há `GuildSystem.ts` nem opcodes);
2. Alinhamento moral / PK (karma) — apenas design;
3. `CastleSiegeManager` agendando `VOL_01..VOL_05` (a geometria e as instâncias já existem);
4. Persistência Redis/PostgreSQL (hoje tudo em memória);
5. GLB dedicados para `EVT_02..EVT_04`;
6. Compilação/validação do projeto Unreal Engine 5.5.
