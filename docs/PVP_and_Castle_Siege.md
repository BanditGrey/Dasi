# PVP, SISTEMA DE ASSASSINATO (PK) E CASTLE SIEGE — DASI

> **Tensão e Honra:** O conflito entre jogadores é o motor emocional do jogo. O perigo espreita além dos portões da cidade, mas as regras de retribuição moral são implacáveis.

---

## 1. SISTEMA MORAL DE ALINHAMENTO E PK (PLAYER KILLER)

```mermaid
stateDiagram-v2
    [*] --> Neutro: Criação do Personagem
    Neutro --> Autodefesa: Atacado por outro Jogador
    Autodefesa --> Neutro: 60s sem combate
    Neutro --> Heroi: Abate jogadores Assassinos (PKs)
    Neutro --> ForaDaLei: Ataca e mata jogador inocente
    ForaDaLei --> AssassinoNivel1: 2º e 3º abate inocente
    AssassinoNivel1 --> Carniceiro: Mais de 5 abates inocentes
    Carniceiro --> Neutro: Purificação por abate de monstros ou oferenda sagrada
```

### 1.1 Tabela de Status e Penalidades

| Nível de Alinhamento | Cor do Nome & Aura Visual | Acesso à Cidade / NPCs | Risco de Drop ao Morrer |
| :--- | :--- | :--- | :--- |
| **Herói das Terras** | Azul Claro / Partículas douradas | Total; descontos especiais em mercadores | 0% de risco de perda de itens |
| **Cidadão Comum** | Branco / Sem aura extra | Total e irrestrito | Pequena perda de Zen acumulado |
| **Autodefesa Ativa** | Amarelo piscante (duração 60s) | Permitido revidar sem penalidades | Padrão |
| **Fora da Lei (PK 1)** | Laranja / Fumaça tênue avermelhada | Guardas ficam em alerta | Perda aumentada de Zen |
| **Assassino (PK 2)** | Vermelho vivo / Gotas de sangue | Guardas atacam à vista; NPCs recusam venda | 15% de chance de dropar itens da mochila |
| **Carniceiro (PK 3)** | Vermelho escuro / Fumaça negra e sangue | Banido das cidades; respawn em covil isolado | **Risco real de dropar equipamentos equipados** |

---

## 2. DUELOS DE HONRA NA ARENA

Para quem busca combate competitivo sem o risco do modo PK aberto:
- **Salão da Arena:** Espaço arquitetônico grego-gótico cercado por grades de ferro e arquibancadas para espectadores.
- **Regras do Duelo:**
  - Desafio aceito por ambos os combatentes.
  - Disputa em formato "Melhor de 10 Pontos" (quem abater o adversário 10 vezes primeiro vence).
  - Imunidade a perda de experiência, itens ou durabilidade de armaduras.
  - Placar holográfico no topo da arena visível para todo o público presente.

---

## 3. CASTLE SIEGE — A GUERRA DO FIM DE SEMANA

O evento máximo de guildas acontece todo domingo à noite, onde as maiores alianças disputam o controle do **Castelo do Vale de Loren**.

```
                         ESTRUTURA DO CASTELO
[ Campo de Guerra ] ──► [ Portão 1 de Ferro ] ──► [ 1ª Estátua da Vida ]
         │
         ▼
[ Portão 2 de Aço ] ──► [ Ponte Levadiça ]  ──► [ 2ª e 3ª Estátuas ]
         │
         ▼
[ Salão Interior ]  ──► [ 4ª Estátua ]       ──► [ O Selo do Trono Real ]
```

### 3.1 Etapas da Batalha (Duração: 90 minutos)
1. **Ruptura dos Portões de Ferro:**
   - Os portões possuem milhões de pontos de vida e resistência a armas comuns.
   - Os atacantes usam catapultas móveis e investidas pesadas de *Blood Knights* para rachar o metal.
2. **As Estátuas da Vida:**
   - 4 monumentos sagrados protegem a passagem. Enquanto estiverem de pé, os defensores ressurgem diretamente no pátio com escudo de invulnerabilidade temporária.
   - Os atacantes precisam pulverizar cada estátua para empurrar o ponto de ressurgimento da guilda defensora para mais longe.
3. **A Travessia da Ponte Levadiça:**
   - Um gargalo estreito sobre um fosso de lava ardente.
   - Magos e Caçadoras disparam tempestades de gelo e flechas de longo alcance dos muros para impedir a marcha inimiga.
4. **O Selo da Coroa no Salão Real:**
   - Dois pedestais sagrados precisam ser mantidos simultaneamente por sub-líderes de guilda.
   - O Mestre da Guilda (preferencialmente um *Soberano Imperial*) inicia a canalização do Selo Real no trono.
   - A canalização dura **30 segundos contínuos**. Se o líder for empurrado, atordoado ou morto, o progresso reseta.

### 3.2 Privilégios do Senhor do Castelo
- **Imposto Territorial:** Uma porcentagem de todo o ouro (*Zen*) movimentado em vendas e serviços de todas as cidades vai para o tesouro da guilda dona do castelo.
- **Acesso à Terra das Provações (*Land of Trials*):** Uma região exclusiva repleta de monstros especiais com chances elevadas de soltar itens excelentes e joias raras.
- **Asas da Coroa:** O mestre da guilda vencedora pode equipar a *Manta do Imperador Supremo* até a próxima batalha semanal.

---

## 4. IMPLEMENTAÇÃO NO SERVIDOR AUTORITATIVO

Esta seção mapeia cada regra acima para o código TypeScript já existente. A fonte
de verdade é sempre o catálogo de cenários (`SCENARIO_CATALOG`), nunca cópias de HP.

### 4.1 Mapa de código

| Regra (design) | Implementação |
| :--- | :--- |
| Fundação, convites, cargos, alianças, tesouro | `src/server/guilds/GuildSystem.ts` |
| Limites (32 membros, 3 alianças, nível 100, 500 mil Zen) | `GuildSystem.GUILD_LIMITS` |
| Imposto Territorial 3%–7% | `GuildSystem.TERRITORIAL_TAX_BY_BIOME` + `applyTerritorialTax` |
| Manta do Imperador Supremo | `GuildSystem.CROWN_CLOAK_DEF_ID` (`cloak_of_supreme_emperor`) |
| Janela semanal (inscrição 24h + batalha 90 min) | `CastleSiegeManager.openRegistration/startBattle/update` |
| Portão ciclópico 25M HP | `VOL_02.destructibleHp.cyclopean_iron_gate` → `damageStructure` |
| 4 Estátuas da Vida 8M HP | `VOL_03.destructibleHp.life_statue_*` → `getStandingStatuesCount` |
| Respawn defensor empurrado | `getDefenderRespawnScenario()` → `VOL_03` / `VOL_04` / `VOL_01` |
| Invulnerabilidade dos defensores | `defendersHaveInvulnerability()` (verdadeiro com ≥1 estátua) |
| Dois pedestais + 30s contínuos | `occupyPedestal` + `beginCrownSeal` + `crownSealDurationMs` |
| Reset ao ser empurrado/atordoado/morto | `interruptCrownSeal()` e `validatePedestals()` |
| Sucessão do castelo | `CastleSiegeManager.concludeSiege` → `GuildSystem.setCastleOwner` |
| Cobrança em lojas de NPC | `NPCShopSystem.processBuy/processSell` com `TerritorialTaxCollector` |

### 4.2 Fluxo de rede

- `0xB0` **Social/Guildas**: status, fundação, convite, resposta, cargos, saída,
  aliança e tesouro (`docs/technical/Network_Protocol.md` §3.1).
- `0xB1` **Cerco ao Castelo**: status, inscrição, dano em estrutura, pedestal e Selo.
- Rotas de desenvolvimento: `GET /api/guilds`, `GET /api/castle-siege` e
  `POST /api/castle-siege/control` (`OPEN_REGISTRATION` | `START_BATTLE` | `RESET`).
- O `startGameLoop` (10 Hz) chama `CastleSiegeManager.update(now)`, que acumula a
  canalização apenas enquanto os **dois** pedestais seguem ocupados por liderança.

### 4.3 Limites conhecidos

- O estado é 100% em memória (pendência de persistência Redis/PostgreSQL do GDD §11.1).
- A **Land of Trials** ainda não tem cenário próprio no catálogo; hoje o privilégio
  está registrado apenas como direito da guilda dona do castelo.
- O agendador semanal usa o relógio do servidor; em produção deve ser movido para um
  cron externo que chame `POST /api/castle-siege/control`.
