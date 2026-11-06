# Arquitetura de Chefes Mundiais, Arenas de Eventos e Masmorras (Dasi MMORPG)

Este documento especifica a arquitetura técnica, mecânicas físicas, fórmulas matemáticas, transições de estado e protocolos de rede do ecossistema de **Chefes Mundiais (World Bosses)**, **Arenas de Eventos (Arenas)** e **Masmorras Multi-Andar (Dungeons)** para o Dasi MMORPG (Continent of Legend).

---

## 1. Visão Geral da Arquitetura

O sistema é 100% autoritativo, operando em Node.js com TypeScript nativo (`--experimental-strip-types`) no servidor e consumido em tempo real pelo cliente Dev Viewer (WebGL / Three.js) e clientes nativos (Unreal Engine 5).

```
                      +------------------------------------------+
                      |         GameServer (Tick 20Hz / 50ms)    |
                      +------------------------------------------+
                                    |              |
           +------------------------+              +------------------------+
           |                                                                |
+----------------------+                                         +----------------------+
|     BossManager      |                                         |     EventManager     |
+----------------------+                                         +----------------------+
| - BossEntity (Phases)|                                         | - BloodCastle        |
| - Telegraph System   |                                         | - DevilSquare        |
| - Runic Shields      |                                         | - ChaosCastle        |
| - Poise / Enrage     |                                         | - DuelColiseum       |
| - GoldenInvasions    |                                         | - Ticket Validation  |
| - BoxOfKundun Drops  |                                         +----------------------+
+----------------------+                                                    |
           |                                                     +----------------------+
+----------------------+                                         |    DungeonManager    |
|     CombatEngine     |                                         +----------------------+
| - Player vs Boss     |                                         | - DungeonInstance    |
| - Poise Degradation  |                                         | - Floor 1: Bone Key  |
| - Shield Absorption  |                                         | - Floor 2: Acid Mud  |
| - Physical GroundDrop|                                         | - Floor 3: Boss Lair |
+----------------------+                                         | - S/A/B/C Rank Score |
                                                                 +----------------------+
```

---

## 2. Sistema Autoritativo de Chefes Mundiais (World Bosses)

### 2.1 Os 5 Chefes Canônicos de Continent of Legend

Cada chefe mundial possui identidade visual, mapa dedicado, fases de combate, escudos rúnicos e ataques com telégrafos geométricos no chão:

| Chefe | ID Canônico | Nível | Mapa Canônico | HP Base | Escudo Rúnico | Fases | Habilidade Telegrafada Principal |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Górgona** | `boss_gorgon` | 55 | `DNG_06` (Covil) | 85.000 | 20.000 | 3 Fases | **Gorgon Gaze:** Cone 90°, Raio 12m, 3.0s |
| **Ice Queen** | `boss_ice_queen` | 52 | `DEV_06` (Trono) | 70.000 | 15.000 | 2 Fases | **Blizzard Torrent:** Círculo 14m, 2.5s |
| **Balrog** | `boss_balrog` | 66 | `LT_07` (Trono) | 120.000 | 30.000 | 3 Fases | **Hellfire Wave:** Linha 20m x 4m, 2.0s |
| **Zaikan** | `boss_zaikan` | 70 | `TAR_05` (Cratera) | 150.000 | 35.000 | 3 Fases | **Quicksand Vortex:** Círculo 16m, 2.8s |
| **Kundun** | `boss_kundun` | 100 | `KAL_01` (Santuário) | 500.000 | 100.000 | 3 Fases | **Aura of Torment:** Arena 25m, 3.5s |

### 2.2 Ciclo de Vida Multi-Fase & Transições de Fúria

1. **Fase 1 (100% até 66% HP):**
   - Ataques primários e rotação básica de telégrafos.
   - Postura (Poise) vulnerável a ataques pesados com Stagger normal.
2. **Fase 2 (66% até 33% HP):**
   - Convocação de tropas de apoio (*Minion Adds*).
   - Ativação do **Escudo Rúnico:** absorve 100% do dano recebido antes que a barra de vida seja decrementada:
     $$\text{Dano Efetivo HP} = \max(0, \text{Dano Recebido} - \text{Escudo Rúnico})$$
   - Redução dos intervalos de cooldown de habilidades em 25%.
3. **Fase 3 (< 33% HP - Estado de Fúria / ENRAGED):**
   - **Imunidade Estrita a Stagger:** O valor de Poise não sofre quebra e efeitos de atordoamento são rejeitados.
   - Modificador de Dano Causado aumentado em $+35\%$.
   - Frequência de Telégrafos dobrada e auras de proximidade ativas.

### 2.3 Sistema de Telégrafos Geométricos

Os ataques telegrafados avisam aos jogadores a área de impacto iminente por meio de projeções 3D no chão:

- **CONE:** Setor angular no plano X-Z definido por raio $r$ e ângulo $\theta$ (ex: $90^\circ$ e $12\text{ m}$).
- **CIRCLE:** Disco radial centrado na posição alvo ou no próprio chefe (ex: $r = 14\text{ m}$).
- **LINE:** Retângulo projetado a partir do chefe em direção ao alvo (ex: comprimento $20\text{ m}$, largura $4\text{ m}$).
- **ARENA:** Expansão radial em anel cobrindo toda a arena (ex: $r = 25\text{ m}$).

Durante o tempo de canalização $\Delta t_{\text{cast}}$, a cor do telégrafo pulsa e preenche de 0% a 100%. Ao final, se o jogador estiver dentro da área, recebe dano crítico e efeitos secundários (lentidão, queimadura ou congelamento).

---

## 3. Invasões Douradas & Caixas de Kundun (Box of Kundun)

### 3.1 Orquestração de Invasões Douradas (`GoldenInvasionSystem`)

O sistema dispara alertas globais na rede e gera monstros dourados com alto índice de metalicidade PBR (24K Gold) e drops garantidos de Box of Kundun:

- **Tier 1:** Lorencia (`golden_budge_dragon`) $\to$ Dropa `box_of_kundun_1`.
- **Tier 2:** Noria (`golden_soldier`) $\to$ Dropa `box_of_kundun_2`.
- **Tier 3:** Devias (`golden_titan`) $\to$ Dropa `box_of_kundun_3`.
- **Tier 4:** Tarkan (`golden_tantalos`) $\to$ Dropa `box_of_kundun_4`.
- **Tier 5:** Lost Tower (`golden_dragon`) $\to$ Dropa `box_of_kundun_5`.

### 3.1.1 Integração com o Dev Viewer e a Arena 3D

- O painel de desenvolvimento invoca chefes por `POST /api/bosses/spawn` (`{ type }`) e invasões por `POST /api/events/trigger` (`{ type: "GOLDEN_INVASION", tier }`). Cada ação usa um único transporte, evitando spawn duplicado; os controles HTTP ficam protegidos por `DASI_DEV_CONTROLS=1` e permanecem desligados por padrão.
- O servidor publica snapshots completos em `{ bosses: [...] }`. O cliente consome esse formato, sincroniza o HUD e renderiza o `BossManager` em um mapa 3D separado do `MobSpawner`; ataques continuam passando pelo `CombatEngine` autoritativo.
- `bestiaryRuntimeMap.js` associa os cinco chefes configurados, Hydra como monstro comum/lendário e os cinco tipos dourados de invasão aos GLBs corretos. Anéis de spawn, barras de vida, movimento e telégrafos continuam sendo visuais de runtime.
- Os GLBs são protótipos estáticos: não fornecem rig, animações, colisão ou lógica de combate. `GOLDEN_LIZARD_KING` permanece visual-only até existir uma definição aprovada de atributos e spawn; Hydra não é promovida automaticamente a chefe de fases.

### 3.2 Tabela de Recompensas das Caixas de Kundun

Ao abrir uma Box of Kundun, o loot é gerado autoritativamente e espalhado fisicamente no solo com dispersão radial:

- **Itens Excelentes Garantidos:** De 1 a 2 itens de armaria de tier compatível com a caixa, portando obrigatoriamente 2 opções excelentes (ex: `INCREASE_DAMAGE_2_PCT | CRITICAL_DAMAGE_RATE_10_PCT` para armas; `DEFENSE_RATE_10_PCT | DAMAGE_DECREASE_4_PCT` para armaduras).
- **Poço de Joias Sagradas:** Chance calculada de drop de `jewel_of_blessing`, `jewel_of_soul`, `jewel_of_life` e `jewel_of_chaos`.
- **Dispersão de Zen:** Pacotes de Zen com bônus de fortuna proporcional ao tier.

---

## 4. Arenas de Eventos Autoritativas

### 4.1 Blood Castle (`BloodCastleInstance`)

Simula o lendário cerco à ponte do arcanjo em 15 minutos:

1. **Requisito de Entrada:** Consumo de `cloak_of_invisibility` no inventário do jogador.
2. **Estágio 1 - Cota da Ponte:** Eliminar 40 monstros na ponte estreita sob pressão cronometrada.
3. **Estágio 2 - Destruição do Portão:** Derrubar o Portão Real do Castelo com $100.000\text{ HP}$.
4. **Estágio 3 - Conjuradores do Santuário:** Derrotar 2 Feiticeiros do Sangue para romper o selo da estátua.
5. **Estágio 4 - Entrega da Arma:** Quebrar a Estátua de Cristal, recolher a `archangel_weapon_quest` e entregá-la ao Arcanjo sobrevivente antes do fim dos 15 minutos.
6. **Recompensa:** Joias místicas, experiência bônus e Box of Kundun +4/+5.

### 4.2 Devil Square (`DevilSquareInstance`)

Arena circular de sobrevivência em 4 ondas sucessivas com pilares mágicos ativos:

1. **Requisito de Entrada:** Consumo de `devil_square_invitation`.
2. **Ondas Progressivas:**
   - *Onda 1:* Aranhas e Bestas de Lorencia.
   - *Onda 2:* Golems de Pedra e Monstros de Noria.
   - *Onda 3:* Górgonas e Bestas de Fogo de Lost Tower.
   - *Onda 4:* Clímax com a Ilusão de Kundun.
3. **Os 4 Pilares de Crânios Flamejantes:** Localizados nos pontos cardeais (N, S, L, O). Causam dano contínuo em área e desafiam a movimentação dos sobreviventes.
4. **Pontuação & Triunfo:** Ranking de pontuação com base em kills e tempo vivo, liberando o Baú do Triunfo ao término.

### 4.3 Chaos Castle (`ChaosCastleInstance`)

O derradeiro modo *Battle Royale* de Continent of Legend:

1. **Requisito de Entrada:** Consumo da `armor_of_chaos`.
2. **Anonimato Absoluto:** Todos os combatentes (jogadores e monstros bots) usam a mesma armadura idêntica, ocultando nomes e guildas.
3. **Colapso Modular de 3 Anéis:**
   - *Estágio 1 (Inicial):* Arena completa de $42\text{ m} \times 42\text{ m}$.
   - *Estágio 2 (60 mortes):* O chão exterior despenca no vazio cósmico. Limite encolhe para $28\text{ m} \times 28\text{ m}$.
   - *Estágio 3 (80 mortes):* Segundo colapso perimetral. Limite final restrito ao núcleo de $14\text{ m} \times 14\text{ m}$.
4. **Física de Onda de Choque na Morte:** Ao morrer, cada combatente explode liberando uma onda de choque de raio $6.0\text{ m}$ com força de repulsão de $2.2\text{ m/s}$. Jogadores empurrados para além da borda do anel caem no abismo e são sumariamente eliminados.
5. **Vitória:** O último combatente sobrevivente conquista o título e joias antigas.

### 4.4 Coliseu de Duelos 1v1 (`DuelColiseumInstance`)

Arena clássica de honra e combate direto:

1. **Formato:** Disputa ao primeiro a atingir 10 pontos de abate.
2. **Ciclo de Rounds:** Contagem regressiva de 3 segundos, sinal de combate liberado e cálculo autoritativo de dano sem interferência externa.
3. **Barreira Protetora de Espectadores:** Campo de força impenetrável de raio $r = 17.5\text{ m}$ impede que jogadores de fora ataquem ou entrem no ringue de combate.

---

## 5. Masmorras Multi-Andar (Catacombs Dungeon)

A `DungeonInstance` orquestra uma incursão autoritativa em 3 andares com quebra-cabeças, perigos ambientais e guardiões:

- **Andar 1 (DNG_01 / DNG_02 - Ossuário Ancestral):** O portão para a cripta profunda está trancado. Os heróis devem derrotar o esqueleto guardião para obter a `dungeon_key_floor2`.
- **Andar 2 (DNG_03 / DNG_04 - Criptas Venenosas):** O chão é inundado por Lodo Ácido que inflige lentidão de $-40\%$ e dano por segundo de $25\text{ HP/s}$. Para drenar o lodo e abrir o portão do Andar 3, os jogadores devem interagir com 3 Válvulas de Drenagem espalhadas pela câmara.
- **Andar 3 (DNG_05 / DNG_06 - Covil da Górgona):** A Górgona está protegida por uma cúpula de invulnerabilidade mantida por 8 Pilares Rúnicos de sustentação. A destruição dos 8 pilares dissipa o escudo e inicia o confronto com o chefe.
- **Sistema de Ranqueamento:**
  - **Ranque S:** Conclusão em menos de 5 minutos ($300\text{ s}$).
  - **Ranque A:** Conclusão entre 5 e 8 minutos ($480\text{ s}$).
  - **Ranque B:** Conclusão entre 8 e 12 minutos ($720\text{ s}$).
  - **Ranque C:** Conclusão acima de 12 minutos.

---

## 6. Especificação do Protocolo de Rede (Opcodes)

| Grupo de Sistema | Opcode Base | Subcode | Nome do Pacote | Direção | Finalidade |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **BOSS_SYSTEM** | `0x80` | `0x01` | `MSG_BOSS_SPAWN_REQ` | C $\to$ S | Requisição de spawn de chefe |
| | | `0x02` | `MSG_BOSS_UPDATE_RES` | S $\to$ C | Atualização de vitais, escudo e fase |
| | | `0x03` | `MSG_BOSS_TELEGRAPH_CAST`| S $\to$ C | Início de ataque telegrafado |
| | | `0x04` | `MSG_GOLDEN_INVASION_REQ`| C $\to$ S | Disparo manual de invasão dourada |
| | | `0x05` | `MSG_GOLDEN_INVASION_RES`| S $\to$ C | Anúncio global de monstros dourados |
| | | `0x06` | `MSG_BOX_KUNDUN_OPEN_REQ`| C $\to$ S | Requisição de abertura de Box +1..+5 |
| | | `0x07` | `MSG_BOX_KUNDUN_OPEN_RES`| S $\to$ C | Resultado do loot e drops físicos |
| **EVENT_ARENA** | `0x81` | `0x01` | `MSG_EVENT_STATUS_REQ` | C $\to$ S | Consulta de status das arenas |
| | | `0x02` | `MSG_EVENT_STATUS_RES` | S $\to$ C | Estado consolidado de todas as arenas |
| | | `0x03` | `MSG_EVENT_ENTER_REQ` | C $\to$ S | Entrada no evento (valida bilhete) |
| | | `0x04` | `MSG_EVENT_ENTER_RES` | S $\to$ C | Validação e teletransporte |
| | | `0x05` | `MSG_BLOOD_CASTLE_ACTION`| C $\to$ S | Ações específicas de Blood Castle |
| | | `0x06` | `MSG_BLOOD_CASTLE_UPDATE`| S $\to$ C | Progresso da ponte e portão de BC |
| | | `0x07` | `MSG_DEVIL_SQUARE_ACTION`| C $\to$ S | Ações específicas de Devil Square |
| | | `0x08` | `MSG_DEVIL_SQUARE_UPDATE`| S $\to$ C | Ondas e pontuação de DS |
| | | `0x09` | `MSG_CHAOS_CASTLE_ACTION`| C $\to$ S | Ações específicas de Chaos Castle |
| | | `0x0a` | `MSG_CHAOS_CASTLE_UPDATE`| S $\to$ C | Estágio do anel e vivos de CC |
| | | `0x0b` | `MSG_DUEL_ACTION_REQ` | C $\to$ S | Início e pontuação de Duelo 1v1 |
| | | `0x0c` | `MSG_DUEL_UPDATE_RES` | S $\to$ C | Placar e estado do Coliseu |
| **DUNGEON_SYSTEM** | `0x82` | `0x01` | `MSG_DUNGEON_ENTER_REQ` | C $\to$ S | Entrada na instância de Dungeon |
| | | `0x02` | `MSG_DUNGEON_ENTER_RES` | S $\to$ C | Confirmação de instância |
| | | `0x03` | `MSG_DUNGEON_PROGRESS_REQ`| C $\to$ S | Avanço de andar, chaves e válvulas |
| | | `0x04` | `MSG_DUNGEON_PROGRESS_RES`| S $\to$ C | Estado dos andares, DoT e ranque |

---

## 7. Verificação Automatizada & Cobertura de Testes

O ecossistema conta com testes unitários e de integração cobrindo 100% dos fluxos de combate, transições de estado, cálculos de dispersão e regras de evento:

- **Chefes & Invasões (`src/server/bosses/tests/bosses.test.ts`):** Validação dos 5 chefes canônicos, fases de Górgona, absorção de dano por escudo rúnico, ciclo de telégrafos, imunidade em fúria, e dispersão da Box of Kundun (+1 a +5).
- **Arenas de Eventos (`src/server/events/tests/events.test.ts`):** Validação dos 4 estágios de Blood Castle, ondas e pilares de Devil Square, colapso de anéis e física de repulsão de Chaos Castle, placar de 10 abates de Duelo 1v1, e validação de bilhetes no EventManager.
- **Masmorras (`src/server/dungeons/tests/dungeons.test.ts`):** Validação da progressão de 3 andares das Catacumbas, chave de ossos, drenagem de lodo ácido, quebra de pilares rúnicos e cálculo de ranques S/A/B/C.
- **Resultado Total (validação em 06/11/2026):** **222 testes aprovados em 54 suítes (100% verde)** — inclui `collision.test.ts` (56 cenários), `scenario_parity.test.ts` (paridade servidor ⇄ cliente), `scenario_3d_coverage.test.ts` (cobertura procedural dos 56 cenários + GLBs dedicados de EVT_02..EVT_04) e `bestiary_glb_coverage.test.ts` (doze protótipos estáticos e integração do Dev Viewer).
