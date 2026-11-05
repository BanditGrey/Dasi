# ESPECIFICAÇÃO DO PROTOCOLO DE REDE — PROJETO DASI
**Versão:** 1.0.0-PROD  
**Arquitetura:** Servidor Autoritativo com Predição do Cliente e Reconciliação (Authoritative Server / Client-Side Prediction)  
**Camada de Transporte:** TCP Híbrido (Sessão, Estado, Inventário e Chat) + UDP Confiável/KCP (Movimentação e Combate em Alta Frequência)

---

## 1. VISÃO GERAL DA ARQUITETURA DE REDE

O protocolo do Dasi é projetado para replicar a nostalgia visceral e a resposta instantânea do *Continent of Legend (MU Online)*, eliminando completamente as vulnerabilidades clássicas de desincronização (*desync*), travamentos de animação por agilidade e vulnerabilidades a cheats de memória/velocidade (*speedhack*, *packet injection*, *dupe*).

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      TOPOLOGIA DE SERVIDORES DASI                      │
 └────────────────────────────────────────────────────────────────────────┘
          ┌───────────────┐                  ┌───────────────┐
          │  Game Client  │                  │  Game Client  │
          └───────┬───────┘                  └───────┬───────┘
                  │                                  │
       TLS/KCP    ▼                                  ▼    TLS/KCP
    ┌─────────────────────────┐          ┌─────────────────────────┐
    │  Gateway / Edge Node 1  │          │  Gateway / Edge Node 2  │
    └─────────────┬───────────┘          └───────────┬─────────────┘
                  │      Internal RPC (gRPC / NATS)  │
                  ├──────────────────────────────────┤
                  ▼                                  ▼
      ┌───────────────────────┐          ┌───────────────────────┐
      │  World / Zone Server  │          │  World / Zone Server  │
      │   (Lorencia, Noria)   │          │  (Devias, LostTower)  │
      └───────────┬───────────┘          └───────────┬───────────┘
                  │                                  │
                  ▼                                  ▼
      ┌──────────────────────────────────────────────────────────┐
      │  Persistência & Cache Central: Redis 7.x + PostgreSQL 16 │
      └──────────────────────────────────────────────────────────┘
```

### Princípios Cardeais do Protocolo:
1. **Zero Trust no Cliente:** O cliente apenas envia *intenções* (Input Commands: "tentar andar para X,Y", "tentar usar habilidade Z no alvo ID", "tentar arrastar item do slot A para o slot B"). O servidor calcula colisões, alcances, cooldowns, custos de mana e validações lógicas.
2. **Dupla Proteção contra Duplicação (Anti-Dupe):** Todos os itens possuem UUIDv4 único gerado pelo servidor, timestamp de ciclo e assinatura HMAC. Toda modificação de inventário ocorre em transações atômicas com locks otimistas.
3. **Predição com Reconciliação Determinística:** O cliente executa imediatamente a movimentação local. Se a rota calculada pelo servidor diferir por obstáculo, stun ou dessincronização acima do limiar ($\Delta d > 0.5$ tiles), o servidor envia um pacote de correção forçada (*Reconciliation Snap*).

---

## 2. FORMATO BINÁRIO DOS PACOTES (FRAMING)

Inspirado na arquitetura clássica dos cabeçalhos de MU (`C1`, `C2`, `C3`, `C4`), o Dasi adota um padrão de enquadramento binário compacto de alta densidade:

### 2.1 Tabela de Tipos de Cabeçalho

| Byte Mágico | Descrição | Limite de Tamanho | Criptografia | Transporte |
| :---: | :--- | :--- | :--- | :--- |
| `0xC1` | Pacote Pequeno Padrão | Até 255 bytes | Plaintext / XOR Session | TCP |
| `0xC2` | Pacote Grande Padrão | Até 65.535 bytes | Plaintext / XOR Session | TCP |
| `0xC3` | Pacote Pequeno Seguro | Até 255 bytes | ChaCha20-Poly1305 / AES | TCP |
| `0xC4` | Pacote Grande Seguro | Até 65.535 bytes | ChaCha20-Poly1305 / AES | TCP |
| `0xD1` | Datagrama Rápido Dasi | Até 512 bytes | AES-128-CTR (KeyStream) | KCP / UDP |
| `0xD2` | Datagrama Confiável Dasi| Até 1.400 bytes (MTU safe)| AES-128-CTR com ACK | KCP / UDP |

### 2.2 Estrutura Binária dos Cabeçalhos

#### Formato C1 / D1 (Tamanho <= 255 bytes)
```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Header (C1)  |  Length (u8)  |  Opcode (u8)  | Subcode (u8)  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                      Sequence Number (u32)                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|        Checksum (u16)         |   Payload Bytes [...]         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

#### Formato C2 / D2 (Tamanho > 255 bytes)
```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Header (C2)  |         Length (u16, Big Endian)              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Opcode (u8)  | Subcode (u8)  |        Checksum (u16)         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                      Sequence Number (u32)                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Payload Bytes [...]                     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

- **Sequence Number:** Contador estritamente monotônico incrementado a cada pacote. Pacotes fora de ordem ou duplicados são descartados imediatamente (Mitigação de Replay Attacks).
- **Checksum:** CRC16-CCITT calculado sobre `Opcode + Subcode + Sequence + Payload`.

---

## 3. TABELA COMPLETA DE OPCODES DO PROTOCOLO

Os Opcodes são agrupados funcionalmente em intervalos hexadecimais:

| Faixa Opcode | Domínio do Subsistema | Descrição Geral |
| :---: | :--- | :--- |
| `0x00 - 0x0F` | **Autenticação & Sessão** | Handshake, Criptografia, Login, Ping/Pong, Reconexão |
| `0x10 - 0x2F` | **Mundo & Entidades** | Entrada em mapa, Spawn/Despawn (AOI), Teletransporte |
| `0x30 - 0x4F` | **Movimentação & Física** | Trajetória, Velocidade, Reconciliação, Dash, Colisão |
| `0x50 - 0x6F` | **Combate & Habilidades** | Atacar, Disparar Feitiço, Dano, Buff, Debuff, Morte |
| `0x70 - 0x8F` | **Inventário & Itens** | Mover Item, Equipar, Joias (+Bless/Soul/Life), Drop/Pick |
| `0x90 - 0xAF` | **Comércio & Economia** | Trade 1x1, Loja Pessoal, Baú/Stash, Máquina do Caos |
| `0xB0 - 0xCF` | **Social & Comunicação** | Chat Geral/Sussurro, Grupo (Party), Guilda, Castle Siege |
| `0xD0 - 0xFF` | **Sistema, GM & Anti-Cheat** | Heartbeat de integridade, Telemetria, Mensagens GM |

### 3.1 Lista Detalhada de Comandos

```
┌────────┬─────────┬──────────────────────────────┬─────────────┬────────────────────────────────────────────┐
│ Opcode │ Subcode │ Nome do Pacote               │ Direção     │ Finalidade Principal                       │
├────────┼─────────┼──────────────────────────────┼─────────────┼────────────────────────────────────────────┤
│ 0x01   │ 0x01    │ MSG_HANDSHAKE_HELLO          │ C -> S      │ Solicita início de sessão e versão cliente │
│ 0x01   │ 0x02    │ MSG_HANDSHAKE_CHALLENGE      │ S -> C      │ Envia chave pública e salt de autenticação │
│ 0x01   │ 0x03    │ MSG_AUTH_LOGIN_REQ           │ C -> S      │ Credenciais cifradas com token de sessão   │
│ 0x01   │ 0x04    │ MSG_AUTH_LOGIN_RES           │ S -> C      │ Resultado de login e lista de personagens  │
│ 0x02   │ 0x01    │ MSG_PING_PONG                │ Bidirecional│ Cálculo de RTT e sincronização de relógio  │
│ 0x03   │ 0x01    │ MSG_SESSION_TERMINATE        │ S -> C      │ Desconexão graciosa ou expulsão (Kick)     │
│        │         │                              │             │                                            │
│ 0x10   │ 0x01    │ MSG_CHAR_SELECT_ENTER_WORLD  │ C -> S      │ Seleciona personagem para entrar no mapa   │
│ 0x10   │ 0x02    │ MSG_WORLD_ENTER_ACK          │ S -> C      │ Confirmação de entrada, mapa ID e coords   │
│ 0x11   │ 0x01    │ MSG_AOI_ENTITY_SPAWN         │ S -> C      │ Spawna monstro, player ou NPC no raio AOI  │
│ 0x11   │ 0x02    │ MSG_AOI_ENTITY_DESPAWN       │ S -> C      │ Despawna entidade fora do raio de visão    │
│        │         │                              │             │                                            │
│ 0x30   │ 0x01    │ MSG_MOVE_INTENT_REQ          │ C -> S      │ Solicitação de movimento para coordenada   │
│ 0x30   │ 0x02    │ MSG_MOVE_BROADCAST           │ S -> C      │ Difusão de início de corrida/caminhada     │
│ 0x30   │ 0x03    │ MSG_MOVE_RECONCILE_SNAP      │ S -> C      │ Correção de posição do servidor (Rubberband)│
│ 0x30   │ 0x04    │ MSG_MOVE_STOP_REQ            │ C -> S      │ Interrupção manual do movimento            │
│        │         │                              │             │                                            │
│ 0x50   │ 0x01    │ MSG_SKILL_CAST_INTENT        │ C -> S      │ Disparo de feitiço/golpe com alvo/ângulo   │
│ 0x50   │ 0x02    │ MSG_SKILL_CAST_BROADCAST     │ S -> C      │ Animação da habilidade para visualizadores │
│ 0x51   │ 0x01    │ MSG_COMBAT_HIT_EVENT         │ S -> C      │ Dano infligido, cor visual (Gold/Blue/etc) │
│ 0x52   │ 0x01    │ MSG_ENTITY_DEATH_EVENT       │ S -> C      │ Notificação de óbito de monstro ou jogador │
│        │         │                              │             │                                            │
│ 0x70   │ 0x01    │ MSG_INVENTORY_SYNC_ALL       │ S -> C      │ Envio completo da bag 8x8 e equipamentos   │
│ 0x70   │ 0x02    │ MSG_ITEM_MOVE_REQ            │ C -> S      │ Mover item entre células da grade ou slots │
│ 0x70   │ 0x03    │ MSG_ITEM_MOVE_RES            │ S -> C      │ Confirmação ou rejeição do movimento       │
│ 0x71   │ 0x01    │ MSG_ITEM_USE_JEWEL_REQ       │ C -> S      │ Aplicar Bless, Soul ou Life em um item     │
│ 0x71   │ 0x02    │ MSG_ITEM_USE_JEWEL_RES       │ S -> C      │ Efeito sonoro, sucesso, falha ou quebra    │
│ 0x72   │ 0x01    │ MSG_ITEM_DROP_REQ            │ C -> S      │ Descartar item no chão                     │
│ 0x72   │ 0x02    │ MSG_ITEM_PICKUP_REQ          │ C -> S      │ Tentar pegar item do chão                  │
│        │         │                              │             │                                            │
│ 0x90   │ 0x01    │ MSG_CHAOS_MACHINE_MIX_REQ    │ C -> S      │ Iniciar refinamento na Máquina do Caos     │
│ 0x90   │ 0x02    │ MSG_CHAOS_MACHINE_MIX_RES    │ S -> C      │ Resposta do Gnome com o item transformado  │
│ 0x91   │ 0x01    │ MSG_TRADE_REQUEST            │ C -> S      │ Solicitação de troca com outro jogador     │
│ 0x91   │ 0x02    │ MSG_TRADE_CONFIRM            │ C -> S      │ Trava e confirmação do comércio com 3s wait│
│        │         │                              │             │                                            │
│ 0xB0   │ 0x01    │ MSG_GUILD_STATUS_REQ         │ C -> S      │ Consulta guilda, cargo, alianças e tesouro │
│ 0xB0   │ 0x02    │ MSG_GUILD_STATUS_RES         │ S -> C      │ Estado completo da guilda do jogador       │
│ 0xB0   │ 0x03    │ MSG_GUILD_CREATE_REQ         │ C -> S      │ Funda guilda (nível 100 + 500 mil Zen)     │
│ 0xB0   │ 0x05    │ MSG_GUILD_INVITE_REQ         │ C -> S      │ Convida jogador online por apelido         │
│ 0xB0   │ 0x07    │ MSG_GUILD_RESPOND_INVITE_REQ │ C -> S      │ Aceita ou recusa convite pendente          │
│ 0xB0   │ 0x09    │ MSG_GUILD_RANK_REQ           │ C -> S      │ Promove/rebaixa cargo ou transfere a guilda│
│ 0xB0   │ 0x0B    │ MSG_GUILD_LEAVE_REQ          │ C -> S      │ Sai da guilda ou expulsa um membro         │
│ 0xB0   │ 0x0D    │ MSG_GUILD_ALLIANCE_REQ       │ C -> S      │ Propõe ou rompe aliança (simétrica)        │
│ 0xB0   │ 0x0F    │ MSG_GUILD_TREASURY_REQ       │ C -> S      │ Deposita Zen no tesouro da guilda          │
│        │         │                              │             │                                            │
│ 0xB1   │ 0x01    │ MSG_SIEGE_STATUS_REQ         │ C -> S      │ Consulta fase, estruturas e Selo da Coroa  │
│ 0xB1   │ 0x02    │ MSG_SIEGE_STATUS_RES         │ S -> C      │ Snapshot do cerco (portão, estátuas, selo) │
│ 0xB1   │ 0x03    │ MSG_SIEGE_REGISTER_REQ       │ C -> S      │ Inscreve a guilda na janela semanal        │
│ 0xB1   │ 0x04    │ MSG_SIEGE_REGISTER_RES       │ S -> C      │ Confirmação da inscrição no cerco          │
│ 0xB1   │ 0x05    │ MSG_SIEGE_ATTACK_STRUCTURE_REQ│ C -> S     │ Dano no portão ciclópico ou nas estátuas   │
│ 0xB1   │ 0x06    │ MSG_SIEGE_ATTACK_STRUCTURE_RES│ S -> C     │ HP restante, destruição e estágio tático   │
│ 0xB1   │ 0x07    │ MSG_SIEGE_PEDESTAL_REQ       │ C -> S      │ Ocupa/libera pedestal sagrado (oeste/leste)│
│ 0xB1   │ 0x08    │ MSG_SIEGE_PEDESTAL_RES       │ S -> C      │ Resultado da ocupação + estado do selo     │
│ 0xB1   │ 0x09    │ MSG_SIEGE_CROWN_SEAL_REQ     │ C -> S      │ Inicia ou interrompe a canalização do Selo │
│ 0xB1   │ 0x0A    │ MSG_SIEGE_CROWN_SEAL_RES     │ S -> C      │ Progresso (0–100%) ou motivo da interrupção│
└────────┴─────────┴──────────────────────────────┴─────────────┴────────────────────────────────────────────┘
```

---

## 4. ESPECIFICAÇÃO BINÁRIA DETALHADA DOS PACOTES PRINCIPAIS

### 4.1 Movimentação do Jogador (`0x30`, `0x01`: `MSG_MOVE_INTENT_REQ`)
Enviado via canal UDP/KCP prioritário quando o jogador clica para andar.

```c
struct MsgMoveIntentReq {
    uint8_t  header;       // 0xD1
    uint8_t  length;       // 18 bytes
    uint8_t  opcode;       // 0x30
    uint8_t  subcode;      // 0x01
    uint32_t seq;          // Sequence counter local do cliente
    uint32_t client_tick;  // Timestamp local em ms
    uint16_t start_x;      // Posição atual de origem (Q12.4 fixed point)
    uint16_t start_y;      // Posição atual de origem (Q12.4 fixed point)
    uint16_t target_x;     // Destino solicitado (Q12.4 fixed point)
    uint16_t target_y;     // Destino solicitado (Q12.4 fixed point)
    uint8_t  path_nodes;   // Quantidade de waypoints simplificados no payload
};
```

### 4.2 Reconciliação do Servidor (`0x30`, `0x03`: `MSG_MOVE_RECONCILE_SNAP`)
Enviado pelo servidor caso a posição do cliente divirja dos cálculos autoritativos.

```c
struct MsgMoveReconcileSnap {
    uint8_t  header;        // 0xD1
    uint8_t  length;        // 16 bytes
    uint8_t  opcode;        // 0x30
    uint8_t  subcode;       // 0x03
    uint32_t last_ack_seq;  // Último sequence do cliente processado pelo servidor
    uint16_t correct_x;     // Posição validada no servidor X
    uint16_t correct_y;     // Posição validada no servidor Y
    uint16_t velocity;      // Velocidade atual autorizada
    uint8_t  state_flags;   // Bit 0: Walking, Bit 1: Stunned, Bit 2: Knockback
};
```

### 4.3 Movimento de Item na Grade 8x8 (`0x70`, `0x02`: `MSG_ITEM_MOVE_REQ`)

```c
struct MsgItemMoveReq {
    uint8_t  header;        // 0xC1
    uint8_t  length;        // 26 bytes
    uint8_t  opcode;        // 0x70
    uint8_t  subcode;       // 0x02
    uint32_t seq;           // Sequence Number
    uint8_t  source_type;   // 0: Main Grid (8x8), 1: Equipment, 2: Vault, 3: Trade
    uint8_t  source_x;      // Coluna origem (0..7)
    uint8_t  source_y;      // Linha origem (0..7) ou EquipmentSlotID
    uint8_t  target_type;   // Destino: 0: Main Grid, 1: Equipment, etc.
    uint8_t  target_x;      // Coluna destino
    uint8_t  target_y;      // Linha destino
    uint8_t  rotated;       // 0: Normal, 1: Rotacionado 90 graus
    uint8_t  item_uuid[16]; // UUIDv4 do item para validação cruzada
};
```

### 4.4 Aplicação de Joia Sagrada (`0x71`, `0x01`: `MSG_ITEM_USE_JEWEL_REQ`)

```c
struct MsgItemUseJewelReq {
    uint8_t  header;        // 0xC1
    uint8_t  length;        // 22 bytes
    uint8_t  opcode;        // 0x71
    uint8_t  subcode;       // 0x01
    uint32_t seq;
    uint8_t  jewel_grid_x;  // Posição X da Joia consumida
    uint8_t  jewel_grid_y;  // Posição Y da Joia consumida
    uint8_t  target_type;   // 0: Grid, 1: Equipamento equipado
    uint8_t  target_slot_x; // Posição X do item alvo
    uint8_t  target_slot_y; // Posição Y do item alvo
    uint8_t  jewel_type;    // 1: Blessing, 2: Soul, 3: Life, 4: Harmony
};
```

---

### 4.5 Selo da Coroa (`0xB1`, `0x09`: `MSG_SIEGE_CROWN_SEAL_REQ`)

O Selo da Coroa é a única forma de trocar o dono do castelo. O servidor só aceita
o pedido quando as **quatro** condições abaixo são verdadeiras
(`CastleSiegeManager.beginCrownSeal`):

1. a fase do cerco é `BATTLE` e o Salão do Trono (`VOL_05`) está liberado —
   Portão Ciclópico (`25.000.000` HP, `VOL_02`) destruído e as 4 Estátuas da Vida
   (`8.000.000` HP cada, `VOL_03`) pulverizadas;
2. quem pede é `MASTER` de uma guilda **inscrita** no cerco;
3. os dois pedestais sagrados estão ocupados por líderes distintos
   (`SUB_LEADER`/`MASTER`) — `MSG_SIEGE_PEDESTAL_REQ` lados `west` e `east`;
4. a canalização avança 30 segundos **contínuos** no `startGameLoop` (10 Hz).

Interrupções (empurrão, atordoamento, morte do Mestre ou pedestal abandonado)
zeram `progressMs`; o cliente recebe `MSG_SIEGE_CROWN_SEAL_RES` com o progresso 0.
Ao atingir 100%, a guilda vencedora recebe o castelo — `GuildSystem.setCastleOwner`
concede a Manta do Imperador Supremo (`cloak_of_supreme_emperor`) ao Mestre e passa
a cobrar o **Imposto Territorial** (3%–7% por bioma) sobre compras e vendas em lojas
de NPC (`NPCShopSystem.processBuy` / `processSell`).

```
struct MsgSiegeCrownSealReq {
    uint8_t  header;        // 0xC1
    uint8_t  length;        // 12 bytes
    uint8_t  opcode;        // 0xB1
    uint8_t  subcode;       // 0x09
    uint32_t seq;
    uint8_t  action;        // 0: BEGIN, 1: INTERRUPT
};
```

### 4.6 Dano em Estrutura do Cerco (`0xB1`, `0x05`: `MSG_SIEGE_ATTACK_STRUCTURE_REQ`)

```
struct MsgSiegeAttackStructureReq {
    uint8_t  header;        // 0xC1
    uint8_t  length;
    uint8_t  opcode;        // 0xB1
    uint8_t  subcode;       // 0x05
    uint32_t seq;
    uint8_t  structure_id_len;
    char     structure_id[24]; // "cyclopean_iron_gate", "life_statue_nw", ...
    uint32_t damage;         // Dano autoritativo calculado pelo servidor
};
```

O servidor recusa dano de guildas não inscritas, satura o dano no HP restante e
registra o placar por guilda (`CastleSiegeManager.getScoreboard`).

---

## 5. SINCRONIZAÇÃO DE MOVIMENTAÇÃO, PREDIÇÃO E RECONCILIAÇÃO

```
   Cliente Local                             Servidor Autoritativo (20Hz)
        │                                                  │
 1. Input: Clica em (120, 85)                              │
    Prediz trajeto e move avatar localmente                │
    Envia MSG_MOVE_INTENT_REQ (Seq: 101) ─────────────────>│
        │                                                  │ 2. Servidor recebe Seq 101:
        │                                                  │    Valida se (120, 85) é caminhável
        │                                                  │    Verifica se distância / dt <= maxSpeed
        │                                                  │    Executa Raycast no Navmesh
        │                                                  │    CASO OK:
        │<────────────────── MSG_MOVE_BROADCAST (Seq 101) ──│    Difunde para vizinhos (AOI)
        │                                                  │
        │                                                  │    CASO BLOQUEIO/COLISÃO:
        │<────────────── MSG_MOVE_RECONCILE_SNAP ──────────│    Envia correção (115, 85)
 3. Cliente recebe Reconciliação:                          │
    Descarta inputs até Seq 101                            │
    Interpola suavemente para a posição oficial            │
```

### 5.1 Fórmulas de Validação de Movimento do Servidor
Para cada tick de servidor $t$, calculamos a velocidade máxima permitida:
$$V_{\text{max\_permitida}} = V_{\text{base}} \times (1 + \text{Modificador de Botas} + \text{Buffs de Agi}) \times (1 + \epsilon)$$
Onde:
- $\epsilon = 0.08$ (tolerância de jitter de rede de 8%).
- Se a distância percorrida pelo cliente $\Delta S > V_{\text{max\_permitida}} \times \Delta t$:
  1. O tick é considerado suspeito (incrementa contador de anomalia).
  2. O servidor envia imediatamente `MSG_MOVE_RECONCILE_SNAP` reposicionando o personagem no último ponto válido.
  3. Se 5 anomalias ocorrerem em uma janela de 3 segundos, o jogador é desconectado com flag de auditoria de *Speedhack*.

### 5.2 Compensação de Lag para Combate (Lag Compensation Rewind)
Quando o cliente ataca um monstro ou inimigo em movimento:
1. O pacote de ataque inclui o `client_tick`.
2. O servidor calcula a latência unilateral estimada:
   $$\text{Rewind Time} = \min\left(\text{Server Time} - \text{client\_tick}, 250\text{ ms}\right)$$
3. O servidor retrocede o *Hit-Box* do alvo para a posição em que ele se encontrava naquele milissegundo exato.
4. Se o raio de alcance da arma/habilidade intersectar a caixa de colisão retrocedida, o golpe é validado como **HIT**. Caso contrário, **MISS**.

---

## 6. SEGURANÇA, CRIPTOGRAFIA E PREVENÇÃO DE FRAUDES

### 6.1 Handshake e Acordo de Chaves
- O cliente estabelece conexão TCP no Gateway.
- Troca de chaves efêmera via **ECDH (Elliptic-Curve Diffie-Hellman - Curve25519)**.
- O segredo compartilhado deriva a chave de cifra simétrica para o resto da sessão:
  - **Sessão Crítica (Auth/Loja/Trocas):** ChaCha20-Poly1305 (AEAD).
  - **Gameplay Fast-Path (Ticks/Move):** AES-128-CTR com vetor de inicialização baseado no `Sequence ID`.

### 6.2 Prevenção de Duplicação de Itens (Anti-Duplication Protocol)
- Toda alteração de inventário (Drop, Pick, Trade, Upgrade, Move) gera um ID de Transação Monotônico (`txn_id`).
- Itens possuem UUID gerado via `UUIDv4 + Server Epoch + Item Seed`.
- O banco de dados relacional utiliza transações em nível de isolamento `SERIALIZABLE` ou *Row-Level Locks* com verificação de versão (`optimistic lock version`).
- Se dois pacotes solicitarem a mesma operação no mesmo `UUID` com `version` divergente, a transação aborta com rollback e alerta no console do servidor.

---
*Documento homologado pela Equipe de Arquitetura de Redes & Sistemas — Dasi Engine.*
