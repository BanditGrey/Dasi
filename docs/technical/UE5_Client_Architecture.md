# Arquitetura Técnica C++ do Cliente Unreal Engine 5 - Dasi MMORPG

Este documento descreve a implementação técnica dos subsistemas centrais de rede, protocolo de pacotes e inventário em grade 8x8 do cliente Unreal Engine 5 (`Source/DasiClient/`), projetados para interoperar em tempo real com o backend autoritativo Node.js via WebSocket (`ws://localhost:8080`).

---

## 1. Visão Geral dos Módulos

```
d:\Dasi\src\client\ue5_project\
├── DasiClient.uproject
└── Source\
    ├── DasiClient.Target.cs
    ├── DasiClientEditor.Target.cs
    └── DasiClient\
        ├── DasiClient.Build.cs
        ├── DasiClient.h
        ├── DasiClient.cpp
        ├── Network\
        │   ├── DasiNetworkTypes.h
        │   ├── DasiNetworkSubsystem.h
        │   └── DasiNetworkSubsystem.cpp
        ├── Inventory\
        │   ├── DasiInventoryTypes.h
        │   ├── DasiInventoryComponent.h
        │   └── DasiInventoryComponent.cpp
        ├── Character\
        │   ├── DasiCharacterBase.h/.cpp
        │   └── DasiIsometricPlayerController.h/.cpp
        └── Combat\
            ├── DasiCombatComponent.h/.cpp
            ├── DasiCombatTypes.h
            └── DasiDamageNumberSubsystem.h/.cpp
```

### Configuração de Módulos (`DasiClient.Build.cs`)
Módulos integrados ao pipeline de compilação:
- `Core`, `CoreUObject`, `Engine`, `InputCore`, `EnhancedInput`
- `WebSockets` (módulo nativo libwebsockets da Epic Games)
- `Json`, `JsonUtilities` (serialização de alta performance)
- `Niagara` (VFX de feixes de joias, rastros de armas e auras)
- `RenderCore`, `RHI` (integração de shaders HLSL/USH)
- `UMG`, `Slate`, `SlateCore` (HUD e UI da grade 8x8)

---

## 2. Subsistema de Rede WebSocket & Opcodes (`UDasiNetworkSubsystem`)

O subsistema estende `UGameInstanceSubsystem`, persistindo durante transições de mapas e níveis.

### Ciclo de Conexão e Handshake Zero-Trust
1. **Conexão**: Invoca `IWebSocket::Connect()` apontando para `ws://localhost:8080`.
2. **Handshake Hello (0x01:0x01)**: Envia imediatamente a versão do cliente (`1.0.0`) e timestamp UTC.
3. **Handshake Challenge (0x01:0x02)**: O servidor responde com `serverVersion` e `salt`.
4. **Auth Login Req (0x01:0x03)**: Cliente envia credenciais (`username`, `characterClass`).
5. **Auth Login Res (0x01:0x04)**: Servidor aprova a sessão, devolve o `sessionId`, `token` e os atributos do herói, emitindo o delegate `OnAuthSuccess`.
6. **Esvaziamento de Fila (`FlushPacketQueue`)**: Comandos solicitados durante o handshake são despachados sem perda de pacotes.

### Heartbeat Ping / Pong e Telemetria
- **Timer de 5 segundos**: Envia `MSG_PING` (0x02:0x01) contendo `clientTime`.
- **Recepção de Pong (0x02:0x02)**: Calcula a latência Round-Trip Time (RTT) em milissegundos e emite `OnLatencyUpdated.Broadcast(CurrentLatencyMs)`.
- **Reconexão Automática**: Caso a conexão caia, um temporizador de 3 segundos (`ScheduleAutoReconnect`) reinicia o ciclo gradualmente.

### Enquadramento Binário C1 / C2 & Verificação CRC16-CCITT
Além de JSON em texto, o subsistema suporta o enquadramento binário clássico de alto rendimento do MU Online:

- **Cabeçalho C1 (Payload <= 245 bytes, total <= 255)**:
  - `Byte 0`: `0xC1`
  - `Byte 1`: `TotalLength` (uint8)
  - `Byte 2`: `Opcode` (uint8)
  - `Byte 3`: `Subcode` (uint8)
  - `Bytes 4..7`: `Sequence` (uint32 big-endian)
  - `Bytes 8..9`: `CRC16-CCITT` (uint16 big-endian, Polinômio `0x1021`, init `0xFFFF`)
  - `Bytes 10..End`: UTF-8 Payload

- **Cabeçalho C2 (Payload > 245 bytes)**:
  - `Byte 0`: `0xC2`
  - `Bytes 1..2`: `TotalLength` (uint16 big-endian)
  - `Byte 3`: `Opcode` (uint8)
  - `Byte 4`: `Subcode` (uint8)
  - `Bytes 5..6`: `CRC16-CCITT` (uint16 big-endian)
  - `Bytes 7..10`: `Sequence` (uint32 big-endian)
  - `Bytes 11..End`: UTF-8 Payload

---

## 3. Componente de Inventário 8x8 & Paperdoll (`UDasiInventoryComponent`)

Componente anexado ao personagem do jogador (`ADasiCharacterBase`), gerenciando os 64 slots matriciais da bolsa e os slots de equipamento.

### Slots de Equipamento Autoritativos (`EDasiEquipmentSlot`)
- `Helm` (Capacete)
- `Armor` (Armadura / Peitoral)
- `Pants` (Calças)
- `Gloves` (Luvas)
- `Boots` (Botas)
- `WeaponRight` (Mão principal - Espada / Machado / Cajado / Arco)
- `WeaponLeft` (Mão secundária - Escudo ou segunda arma)
- `Wings` (Asas T1, T2 ou T3)
- `Helper` (Mascote / Montaria: Dinorant, Uniria, Dark Raven)
- `Pendant` (Amuleto)
- `RingRight` / `RingLeft` (Anéis esquerdo e direito)

### Predição de Cliente & Reconciliação
Para resposta imediata (0ms de input lag ao arrastar itens no UMG):
1. **Snapshot**: Ao iniciar uma movimentação (`PredictMoveGridItem`, `PredictEquipItem`, `PredictUnequipItem`), salva o estado local em `RollbackSnapshot`.
2. **Atualização Otimista**: Valida limites (0..7) e colisões espaciais, atualiza a matriz de slots `GridSlots[64]` e notifica a interface gráfica (`OnItemPlacedInGrid`, `OnEquipmentSlotChanged`).
3. **Envio ao Servidor**: Dispara pacote `0x70:0x02` (`MSG_ITEM_MOVE_REQ`) via `UDasiNetworkSubsystem`.
4. **Reconciliação**:
   - Se o servidor responder sucesso (`0x70:0x03`), confirma e aceita sincronização de estado se inclusa.
   - Se o servidor rejeitar (por exemplo, falta de atributos ou colisão concorrente), o cliente executa rollback imediato para `RollbackSnapshot` e emite `OnInventoryOperationFailed`.

### Rotação 90° e Detecção Espacial
- Itens de dimensões `1x1` até `2x4` podem ser rotacionados com a tecla R ou botão direito.
- Se `bRotated == true`, `Width` e `Height` são permutados na verificação de colisão `CanPlaceItemAt`.
- Varredura de espaço livre `FindFreeSpace` busca o primeiro encaixe row-major contíguo.

### Refino com Joias Sagradas (`ApplyJewel`)
Suporta aplicação de:
- **Jewel of Blessing** (+1 a +6 com 100% de taxa)
- **Jewel of Soul** (+7 a +9 com chance de perda de nível)
- **Jewel of Life** (Adiciona ou eleva opção adicional até +28)
- **Jewel of Harmony** (Desperta atributos amarelos de combate)
- **Jewel of Chaos** (Forja da Chaos Machine)

---

## 4. Tabela de Mapeamento de Opcodes

| Opcode | Subcode | Nome do Pacote | Direção | Finalidade |
|---|---|---|---|---|
| `0x01` | `0x01` | `MSG_HANDSHAKE_HELLO` | C -> S | Apresentação do cliente com versão e relógio |
| `0x01` | `0x02` | `MSG_HANDSHAKE_CHALLENGE` | S -> C | Desafio de segurança e salt de sessão |
| `0x01` | `0x03` | `MSG_AUTH_LOGIN_REQ` | C -> S | Requisição de login do herói |
| `0x01` | `0x04` | `MSG_AUTH_LOGIN_RES` | S -> C | Aprovação de sessão e dados de personagem |
| `0x02` | `0x01` | `MSG_PING` | C -> S | Heartbeat Keep-Alive (5 segundos) |
| `0x02` | `0x02` | `MSG_PONG` | S -> C | Confirmação de latência RTT |
| `0x03` | `0x01` | `MSG_SESSION_TERMINATE` | S -> C | Encerramento gracioso de sessão |
| `0x15` | `0x01` | `MSG_MONSTER_SPAWN_OR_MOVE` | S -> C | Estado e posição de todos os monstros na zona |
| `0x16` | `0x01` | `MSG_GROUND_ITEM_DROP` | S -> C | Itens e Zen caídos no chão |
| `0x16` | `0x02` | `MSG_GROUND_ITEM_PICKUP_REQ` | C -> S | Requisição de coleta de item |
| `0x16` | `0x02` | `MSG_GROUND_ITEM_PICKUP_RES` | S -> C | Confirmação de coleta autoritativa |
| `0x16` | `0x03` | `MSG_GROUND_ITEM_REMOVE` | S -> C | Notificação de remoção de item do chão |
| `0x30` | `0x01` | `MSG_MOVEMENT` | C -> S | Atualização de posição e destino do jogador |
| `0x50` | `0x01` | `MSG_COMBAT_ATTACK_REQ` | C -> S | Ataque básico ou skill contra monstro |
| `0x50` | `0x02` | `MSG_COMBAT_ATTACK_RES` | S -> C | Dano, stagger, knockback e hit-stop |
| `0x70` | `0x01` | `MSG_INVENTORY_SYNC_ALL` | S -> C | Sincronização completa de grade e definições |
| `0x70` | `0x02` | `MSG_ITEM_MOVE_REQ` | C -> S | Mover, equipar ou desequipar item |
| `0x70` | `0x03` | `MSG_ITEM_MOVE_RES` | S -> C | Confirmação ou recusa de movimentação |
| `0x71` | `0x01` | `MSG_ITEM_USE_JEWEL_REQ` | C -> S | Uso de Joia Sagrada em item |
| `0x71` | `0x02` | `MSG_ITEM_USE_JEWEL_RES` | S -> C | Resultado de refino / falha / destruição |
| `0x73` | `0x01` | `MSG_ITEM_SPAWN_DEV_REQ` | C -> S | Comando de desenvolvimento para spawn de itens |
| `0x73` | `0x02` | `MSG_ITEM_SPAWN_DEV_RES` | S -> C | Resposta do spawner de dev |
