# Sessão 2026-11-05 — Pendência #2: Guildas & Cerco ao Castelo

## Objetivo

Fechar a última pendência do backlog de curto prazo do GDD (§11.1): o **Sistema de
Guildas & Alianças** e o **Cerco ao Castelo** como evento com janela semanal,
cumprindo `docs/PVP_and_Castle_Siege.md` §3 sem duplicar geometria ou HP.

## O que foi construído

### 1. `src/server/guilds/GuildSystem.ts`

Autoridade única sobre a vida social das guildas:

| Recurso | Detalhe |
| :--- | :--- |
| Fundação | nível 100 + 500 mil Zen, nome 3–16 caracteres, único por nome normalizado |
| Cargos | `MASTER` / `SUB_LEADER` / `MEMBER`; transferência de liderança explícita |
| Membros | teto de 32; Mestre com outros membros precisa transferir antes de sair |
| Alianças | simétricas imediatas, máximo de 3 por guilda |
| Tesouro | depósitos debitam Zen do jogador e acumulam `contributedZen` |
| Imposto Territorial | `TERRITORIAL_TAX_BY_BIOME` (3% em Noria, 7% no Vale de Loren) |
| Asas da Coroa | `cloak_of_supreme_emperor` concedida ao Mestre dono do castelo |

A API é síncrona e recebe `now` por parâmetro — o módulo não tem relógio próprio,
o que mantém os testes determinísticos e permite replay.

### 2. `src/server/siege/CastleSiegeManager.ts`

Orquestra o cerco sobre os cenários já existentes `VOL_01..VOL_05`:

```
VOL_01 Campo ─► VOL_02 Portão 25M ─► VOL_04 Ponte ─► VOL_03 4× Estátuas 8M ─► VOL_05 Selo
```

- fases `CLOSED → REGISTRATION → BATTLE → CONCLUDED`;
- estágios táticos `GATE_ASSAULT → COURTYARD_STATUES → DRAWBRIDGE_CROSSING → CROWN_SEAL → TRIUMPH/FAILED`;
- HP lido diretamente de `SCENARIO_CATALOG[].destructibleHp` (zero duplicação);
- respawn defensor: 4 estátuas → `VOL_03`, 2–3 → `VOL_04`, 0–1 → `VOL_01`;
- Selo da Coroa: dois pedestais distintos mantidos por liderança + 30s **contínuos**;
- qualquer interrupção (pedestal vago, `interruptCrownSeal`, fim do prazo) zera o progresso;
- vitória → `GuildSystem.setCastleOwner` (manta + direito ao imposto).

### 3. Integração no servidor autoritativo

- **Protocolo** (`protocol.ts`): grupos `SOCIAL_GUILD: 0xB0` e `CASTLE_SIEGE: 0xB1`
  com 16 mensagens `REQ/RES`.
- **GameServer**: 13 handlers novos (`handleGuild*` e `handleSiege*`), ator de guilda
  derivado da sessão, broadcast de estado do cerco quando a fase muda ou há canalização.
- **Economia**: `NPCShopSystem.processBuy/processSell` recebem um `TerritorialTaxCollector`
  opcional; o imposto é cobrado **além** do preço de tabela (compra) e **descontado** do
  valor recebido (venda), com `taxPaid` no payload de resposta.
- **Rotas**: `GET /api/guilds`, `GET /api/castle-siege`, `POST /api/castle-siege/control`
  (`OPEN_REGISTRATION`, `START_BATTLE`, `RESET`).
- **Loop**: `startGameLoop` chama `castleSiege.update(now)` a 10 Hz.

### 4. Dev Viewer

Novo card **“Cerco ao Castelo”** na aba Arenas & Dungeons (`dracula`-free, tema dourado
`#eab308`): fase, cronômetro, HP do portão, estátuas de pé, ponto de respawn, progresso
do Selo, dono do castelo, placar por dano e seis botões de ação. `style.css` ganhou
`.event-card.siege-card`.

### 5. Documentação

- `docs/technical/Network_Protocol.md`: tabela `0xB0`/`0xB1` + §4.5 (Selo da Coroa) e §4.6 (dano em estrutura).
- `docs/PVP_and_Castle_Siege.md`: nova §4 com o mapa regra → código e limites conhecidos.
- `docs/GDD_Dasi.md` §11.1: itens 1 e 3 marcados como concluídos.

## Validação

| Verificação | Resultado |
| :--- | :--- |
| `npm test` | **171 testes / 51 suítes / 0 falhas** (133 → 171) |
| `npm run typecheck` | **0 erros** |
| `npm run test:3d` | 56/56 cenários, 0 falhas |
| `guilds.test.ts` | 16 testes (fundação, convites, cargos, alianças, tesouro, imposto, manta) |
| `castle_siege.test.ts` | 19 testes (catálogo, inscrição, portão, estátuas, selo, fim de batalha) |
| `server.test.ts` | +3 testes de rede (rotas HTTP, guilda por WebSocket, cerco por WebSocket) |
| Smoke real (porta 8080) | `/`, `/api/guilds`, `/api/castle-siege`, `/app.js`, `/style.css` → 200 |

## Decisões e armadilhas

- **`node --experimental-strip-types` não suporta parameter properties** — o construtor
  do `CastleSiegeManager` declara `guilds` como campo explícito.
- As estruturas do cerco filtram `scenario.id.startsWith('VOL_')`: o `archangel_gate`
  (`EVT_01`) pertence ao Blood Castle e não pode poluir o placar.
- Um pedestal abandonado interrompe a canalização no próximo `update` — antes, o
  progresso continuava congelado mas não era zerado (corrigido por teste).
- `NPCShopSystem` mantém assinatura retrocompatível: sem coletor, o comportamento é
  exatamente o anterior (os 8 testes de economia seguem passando).

## Backlog restante

Karma/PK, persistência Redis/PostgreSQL, GLBs próprios de `EVT_02..04`, pipeline UE5
executável e o cenário dedicado da *Land of Trials*.
