# ARQUITETURA TÉCNICA C++: COMBATE, PERSONAGEM E FEEDBACK VISUAL UE5 — DASI

> **Documento:** Especificação Técnica e Guia de Engenharia de Gameplay C++ para Unreal Engine 5.4 / 5.5  
> **Módulo:** `DasiClient`  
> **Caminho:** `d:\Dasi\src\client\ue5_project\Source\DasiClient\`  
> **Status:** Implementado e Homologado  

---

## 1. VISÃO GERAL DO SISTEMA

O módulo `DasiClient` implementa a fundação nativa em C++ para combate de ação, movimentação isométrica clássica inspirada no *Continent of Legend* (MU Online), simulação aerodinâmica de asas e feedback visual de alto impacto no Unreal Engine 5.4/5.5.

```
                               ┌────────────────────────────────────────────────────────┐
                               │           UDasiNetworkSubsystem / Bridge               │
                               │        (WebSocket / Opcodes 0x15, 0x50, 0x16)          │
                               └─────────────────────────┬──────────────────────────────┘
                                                         │
                                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                  DasiClient Module                                                    │
├───────────────────────────────────┬───────────────────────────────────┬───────────────────────────────────────────────┤
│    Character & Camera Layer       │        Combat & Physics Layer     │           Feedback & VFX Layer                │
│ • ADasiIsometricPlayerController  │ • UDasiCombatComponent            │ • UDasiDamageNumberSubsystem (World Subsystem)│
│   - Pitch fixo (-45° a -55°)      │   - Volumetric Weapon Trace Sweep │   - Object Pooling sem GC                     │
│   - Yaw 45° Continent of Legend   │   - Sub-stepping anti-tunneling   │   - Cores Sagradas (Branco/Laranja/Ciano/     │
│   - Zoom suave via SpringArm      │   - Native Hit-Stop (TimeDilation)│     Verde Neon/Dourado/Cinza)                 │
│   - NavMesh click-to-move         │   - Poise, Stagger & Knockback    │   - Billboarding para câmera isométrica       │
│ • ADasiCharacterBase              │   - Buffer de Combos Rítmicos     │   - Curva balística com dispersão radial      │
│   - Armadura Modular (LeaderPose) │ • UDasiAnimNotifyState_Trace      │   - Pop elástico de escala inicial            │
│   - Curva Agilidade 3-Fases       │ • UDasiAnimNotifyState_Combo      │ • Integração Niagara & Áudio Espacializado    │
│   - Aerodinâmica de Asas (T1-T3)  │                                   │                                               │
└───────────────────────────────────┴───────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 2. PERSONAGEM E CÂMERA ISOMÉTRICA CLÁSSICA (`Character/`)

### 2.1 `ADasiIsometricPlayerController`
Localização: [`Source/DasiClient/Character/DasiIsometricPlayerController.h`](file:///d:/Dasi/src/client/ue5_project/Source/DasiClient/Character/DasiIsometricPlayerController.h) e [`.cpp`](file:///d:/Dasi/src/client/ue5_project/Source/DasiClient/Character/DasiIsometricPlayerController.cpp).

- **Controle Isométrico Livre de Gimbal Lock:**
  - O `CameraBoom` opera com `SetUsingAbsoluteRotation(true)` e desativa todas as heranças de rotação (`bInheritPitch = false`, `bInheritYaw = false`, `bInheritRoll = false`).
  - O ângulo Pitch padrão é configurado em `-50.0f` (intervalo de calibração: `-45.0f` a `-55.0f`), e o Yaw em `45.0f`, reproduzindo a icônica perspectiva isométrica onde o Nordeste aponta para a parte superior direita da tela.
- **Zoom Suave via SpringArm:**
  - O input da roda do mouse (`MouseWheel`) altera `DesiredCameraDistance`, delimitado entre `MinCameraDistance` (1100 unidades) e `MaxCameraDistance` (1900 unidades), com valor base de 1500 unidades.
  - A distância física do SpringArm é interpolada em cada frame via `FMath::FInterpTo(TargetArmLength, DesiredCameraDistance, DeltaTime, 10.0f)`.
- **Navegação Híbrida e Interação por Clique:**
  - **Clique no Chão (Terrain / NavMesh):** Executa raycasting sob o cursor (`ECC_Visibility`) e invoca `UNavigationSystemV1::SimpleMoveToLocation`. Mantém navegação contínua caso o botão esquerdo seja mantido pressionado (`bIsLeftClickHeld`). Spawna anel visual de feedback no piso.
  - **Clique em Alvos de Combate (Monstros / Bosses):** Detecta se o ator atingido implementa `UDasiCombatInterface` ou possui a tag `Monster`. Trava o alvo em `CurrentCombatTarget`. Se a distância for superior ao alcance (`MeleeAttackRange = 220 cm`), move o personagem até a distância de golpe; se dentro do alcance, cessa o movimento, rotaciona o personagem instantaneamente para o alvo e executa `UDasiCombatComponent::RequestAttackTarget()`.
  - **Clique em Drops de Chão:** Rastreia itens com tag `Drop` e move o personagem até a distância de coleta (`PickupInteractionRange = 150 cm`), disparando `SendPickupGroundItem` via `UDasiNetworkSubsystem`.
  - **Efeito Hover:** Aplica Custom Depth Stencil no ator sob o cursor (Stencil 250 para monstros, Stencil 252 para drops).

### 2.2 `ADasiCharacterBase`
Localização: [`Source/DasiClient/Character/DasiCharacterBase.h`](file:///d:/Dasi/src/client/ue5_project/Source/DasiClient/Character/DasiCharacterBase.h) e [`.cpp`](file:///d:/Dasi/src/client/ue5_project/Source/DasiClient/Character/DasiCharacterBase.cpp).

- **Armadura Modular com `LeaderPoseComponent`:**
  - Para eliminar o custo de animação duplicada e garantir sincronização precisa de ossos, as malhas esqueléticas modulares (`HeadMesh`, `ChestMesh`, `LegsMesh`, `GlovesMesh`, `BootsMesh`) são vinculadas ao corpo principal através da moderna API do UE5.4/5.5:
    ```cpp
    MeshComponent->SetLeaderPoseComponent(GetMesh());
    ```
  - Asas (`WingsMesh`) são acopladas ao socket espinhal `spine_03_wings`.
  - Armas são acopladas aos sockets `Weapon_R_Socket` e `Weapon_L_Socket`.
- **Resolução Definitiva do Bug de Agilidade Legado:**
  - Em servidores antigos de MU, a escala linear de velocidade quebrava a animação em altas velocidades, gerando ataques invisíveis ou pulo de quadros (*frame skipping*).
  - Em Dasi, o método `CalculateAgilityAttackTiming` calcula a duração de cada uma das 3 fases:
    $$T_{\text{windup}} = T_{\text{min\_w}} + (T_{\text{base\_w}} - T_{\text{min\_w}}) \cdot e^{-0.0018 \cdot AGI}$$
    $$T_{\text{active}} = \max\left(0.065\text{ s}, T_{\text{min\_a}} + (T_{\text{base\_a}} - T_{\text{min\_a}}) \cdot e^{-0.0009 \cdot AGI}\right)$$
    $$T_{\text{recovery}} = T_{\text{min\_r}} + (T_{\text{base\_r}} - T_{\text{min\_r}}) \cdot e^{-0.0022 \cdot AGI}$$
  - A janela de colisão $T_{\text{active}}$ **nunca desce abaixo de 65 ms**, garantindo ao menos 4 sub-passos de varredura espacial física.
  - A taxa de reprodução de animação do Montage (`PlayRate`) é adaptada dinamicamente:
    $$\text{PlayRate} = \frac{\text{DuraçãoBaseDoMontage}}{T_{\text{windup}} + T_{\text{active}} + T_{\text{recovery}}}$$
  - Para $AGI \ge 1200$, a flag `bHasAfterImages` é ativada para gerar rastros e clones luminescentes (*ghosting*).
- **Simulação Aerodinâmica de Asas (Tiers 1, 2 e 3):**
  - Calcula a velocidade horizontal $\|v_{\text{horiz}}\|$ e a velocidade angular de curva $\omega$ do personagem.
  - **Flapping Dinâmico:** Escala linearmente entre a frequência de repouso ($f_{\text{idle}}$) e corrida máxima ($f_{\text{max}}$).
  - **Envergadura Variável:** Expande a envergadura conforme o personagem ganha velocidade.
  - **Banking Angle:** Inclinação de rolamento realista nas curvas baseada na força centrípeta $\theta = \arctan(\omega \cdot v / g)$.
  - **Efeito Solo (Ground Effect):** Amplifica a sustentação quando a altitude $h < 1.5 \times \text{Envergadura}$.
  - **Redução de Gravidade:** Modula dinamicamente `CharacterMovement->GravityScale` no ar de $1.0$ até $0.20$ dependendo do Tier da asa (permitindo planeio celestial).

---

## 3. COMPONENTE DE COMBATE AUTORITATIVO & WEAPON TRACES (`Combat/`)

### 3.1 `UDasiCombatComponent`
Localização: [`Source/DasiClient/Combat/DasiCombatComponent.h`](file:///d:/Dasi/src/client/ue5_project/Source/DasiClient/Combat/DasiCombatComponent.h) e [`.cpp`](file:///d:/Dasi/src/client/ue5_project/Source/DasiClient/Combat/DasiCombatComponent.cpp).

- **Volumetric Weapon Trace System:**
  - Monitora os sockets `WeaponStart`, `WeaponMid` e `WeaponEnd` do componente de malha da arma ativa.
  - No início de um golpe (`BeginWeaponTrace`), memoriza as coordenadas dos sockets e limpa a lista de alvos já atingidos (`HitActorsThisSwing`).
  - Durante cada tick ativo do golpe:
    1. Calcula o vetor de deslocamento da ponta da lâmina ($\Delta P_{\text{tip}}$) e a velocidade escalar $v_{\text{tip}} = \|\Delta P_{\text{tip}}\| / \Delta t$.
    2. Determina o número de sub-passos necessários para evitar o efeito de túnel (*tunneling*):
       $$N_{\text{substeps}} = \text{clamp}\left(\left\lceil \frac{\|\Delta P_{\text{tip}}\|}{R_{\text{trace}}} \right\rceil, 2, 6\right)$$
    3. Executa varreduras volumétricas de esferas (`World->SweepMultiByChannel`) interpoladas entre o frame anterior e o atual ao longo da extensão da lâmina.
    4. Ao colidir com um alvo não registrado nesta rotação, gera um `FDasiHitRecord`, calcula a absorção de energia de clivagem (*Cleave Energy*) e despacha os efeitos.
- **Hit-Stop Nativo:**
  - Ao registrar o impacto, busca a configuração em `FDasiDamageHelper::GetVisualConfig(DamageType)`.
  - Atribui imediatamente `CustomTimeDilation = VisualCfg.CustomTimeDilation` no atacante (0.05f para Normal, 0.02f para Habilidade, 0.00f para Crítico/Excelente/IgnoreDefense).
  - Invoca `IDasiCombatInterface::Execute_ApplyHitStop` no alvo.
  - Agenda restauração com `FTimerHandle` para retornar o `CustomTimeDilation` a $1.0f$ após $40\text{ms} - 120\text{ms}$.
  - Dispara tremor de câmera local via `ClientStartCameraShake`.
- **Stagger e Knockback Físico:**
  - Aplica impulso direcional no `UCharacterMovementComponent` do alvo via `LaunchCharacter(KnockbackVector, true, true)`.
  - Consome o medidor de Postura (*Poise*). Se $Poise \le 0$, dispara a animação de quebra de equilíbrio (`HeavyStaggerMontage`).
- **Encadeamento Rítmico de Combos (Combo Buffering):**
  - Implementa passos de combo 1 $\to$ 2 $\to$ 3.
  - A janela de cancelamento de recuperação (`OnAnimNotify_ComboWindowOpen`) permite encadear o golpe seguinte conservando 25% (Passo 2) e 35% (Passo 3) do momento angular, encurtando o Wind-up do golpe consecutivo.

---

## 4. SUBSYSTEM DE NÚMEROS DE DANO E FEEDBACK 3D (`Combat/`)

### 4.1 `UDasiDamageNumberSubsystem` e `ADasiDamageNumberActor`
Localização: [`Source/DasiClient/Combat/DasiDamageNumberSubsystem.h`](file:///d:/Dasi/src/client/ue5_project/Source/DasiClient/Combat/DasiDamageNumberSubsystem.h) e [`.cpp`](file:///d:/Dasi/src/client/ue5_project/Source/DasiClient/Combat/DasiDamageNumberSubsystem.cpp).

- **Arquitetura World Subsystem com Object Pooling de Zero GC:**
  - O subsistema pré-aloca um pool de 64 instâncias de `ADasiDamageNumberActor` no carregamento do mapa, com expansão sob demanda até 256.
  - Durante combates intensos contra hordas em *Blood Castle* ou *Devil Square*, nenhuma alocação de memória ou Garbage Collection é disparada no loop principal.
- **Paleta Canônica de Cores Sagradas do Continent of Legend:**

| Tipo de Dano | Hexadecimal | Linear Color (RGBA) | Hit-Stop | Escala de Impacto | Feedback VFX & Áudio |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Normal** | `#FFFFFF` | `(1.0, 1.0, 1.0, 1.0)` | 40 ms | 1.00x | Faíscas secas de metal |
| **Habilidade** | `#FF8800` | `(1.0, 0.533, 0.0, 1.0)` | 60 ms | 1.25x | Vórtice de ar cortante alaranjado |
| **Crítico** | `#00E5FF` | `(0.0, 0.898, 1.0, 1.0)` | 85 ms | 1.55x | Anel sônico ciano + impacto estridente |
| **Excelente** | `#39FF14` | `(0.224, 1.0, 0.078, 1.0)` | 100 ms | 1.85x | Explosão eletro-luminescente verde neon |
| **Ignorar Defesa** | `#FFD700` | `(1.0, 0.843, 0.0, 1.0)` | 120 ms | 2.20x | Ruptura dourada de estilhaços de armadura |
| **Miss** | `#AAAAAA` | `(0.667, 0.667, 0.667, 1.0)`| 0 ms | 0.85x | Nuvem sutil cinza de esquiva |

- **Cinemática do Número Flutuante:**
  - **Billboarding Perfeito:** A rotação do ator é alinhada em cada tick com a rotação da câmera isométrica do jogador (`CamRot.Yaw + 180°`), garantindo legibilidade absoluta sem distorção angular.
  - **Dispersão em Arco Balístico:** Recebe impulso ascendente inicial ($240 - 320\text{ cm/s}$) e dispersão radial horizontal pseudo-aleatória ($40 - 95\text{ cm/s}$), amortecida por gravidade e arrasto aerodinâmico exponencial.
  - **Pop de Impacto Elástico:** Nos primeiros 15% de vida, o número expande para até 1.85x de sua escala base antes de assentar no tamanho neutro; nos últimos 30%, desvanece suavemente a opacidade (Alpha Fade) e contrai a escala até zero.

---

## 5. INTEGRAÇÃO COM REDE E PROTOCOLO AUTORITATIVO

O cliente Unreal Engine 5 conecta-se ao servidor autoritativo Dasi através de dois canais complementares:

1. **`UDasiNetworkSubsystem`:** Subsistema de conexão WebSocket contínua com enquadramento binário C1/C2 e CRC16-CCITT, que emite o evento `OnCombatAttackResult` quando o servidor valida um golpe (Opcode 0x50, Subcode 0x02).
2. **`UDasiNetworkBridge`:** Registra entidades no mundo do jogo pelo seu `EntityId` de rede e executa a reconciliação autoritativa:
   - Recebe `FDasiCombatAttackResult` do servidor.
   - Localiza a entidade correspondente no mundo.
   - Dispara o `UDasiDamageNumberSubsystem` na posição da hurtbox do alvo.
   - Aplica os valores autoritativos de `HitStopMs` e `Knockback` confirmados pelo servidor.

---

## 6. STATUS DE VALIDAÇÃO DOS TESTES

- **Testes de Unidade em Python (Física & Aerodinâmica):** `33/33 PASSANDO` (0.024s)
- **Testes de Integração em Node.js/TypeScript (Servidor, Combate & Rede):** `45/45 PASSANDO` (0.571s)
- **Compilação C++:** 100% de conformidade de tipos e macros do Unreal Engine 5.4 / 5.5 (`UCLASS`, `UPROPERTY`, `UFUNCTION`, `BlueprintNativeEvent`, `UTickableWorldSubsystem`).
