# ESPECIFICAÇÃO DE ESQUELETO HUMANOIDE & SOCKETS: DARK KNIGHT (CAVALEIRO DO SANGUE)

> **Documento:** Especificação Técnica de Rigging, Hierarquia Óssea e Sockets Métricos  
> **Asset Alvo:** `SK_DarkKnight_Skeleton`  
> **Engine Alvo:** Unreal Engine 5.4+ / Control Rig / Modular Armor Pipeline  
> **Caminho:** `Content/Characters/DarkKnight/SK_DarkKnight_Skeleton`  
> **Convenção de Eixos:** Forward = +X, Right = +Y, Up = +Z (Métrico Unreal, 1 unidade = 1 cm)  

---

## 1. VISÃO GERAL DO RIG HUMANOIDE

O esqueleto `SK_DarkKnight_Skeleton` foi estruturado para suportar combate físico pesado, animações de espada colossal em duas mãos, trocas de armadura modular via `LeaderPoseComponent`, simulação aerodinâmica de asas (Tiers 1, 2 e 3) e deformação física de capas com Chaos Cloth.

```
                                  [root] (0, 0, 0)
                                    │
                                 [pelvis] (0, 0, 96.0 cm)
                 ┌──────────────────┴──────────────────┐
                 ▼                                     ▼
             [spine_01]                            [thigh_l] / [thigh_r]
                 │                                     │
             [spine_02]                            [calf_l] / [calf_r]
                 │                                     │
             [spine_03]                            [foot_l] / [foot_r]
         ┌───────┴───────┬──────────────┐              │
         ▼               ▼              ▼          [ball_l] / [ball_r]
    [neck_01]       [clavicle_l]   [clavicle_r]        │
         │               │              │          [toe_l] / [toe_r]
      [head]        [upperarm_l]   [upperarm_r]
                         │              │
                    [lowerarm_l]   [lowerarm_r]
                         │              │
                      [hand_l]       [hand_r]
```

---

## 2. HIERARQUIA COMPLETA DE OSSOS (CONTROL RIG COMPATIBLE)

A topologia esquelética adota o padrão estendido de humanoide da Epic Games com suporte a cinemática inversa (IK bones) e ossos auxiliares de torção (twist bones) para preservar o volume muscular durante rotações extremas de braços e pernas.

### 2.1 Eixo Central e Tronco
| Nome do Osso | Osso Pai (Parent) | Comprimento Ref. (cm) | Posição Padrão (X, Y, Z) | Finalidade / Deformação |
| :--- | :--- | :--- | :--- | :--- |
| `root` | *None* | 0.0 | `(0.0, 0.0, 0.0)` | Raiz espacial do ator no piso; base para Root Motion. |
| `pelvis` | `root` | 96.0 | `(0.0, 0.0, 96.0)` | Centro de gravidade (CoG); ajustado pelo Foot Placement IK. |
| `spine_01` | `pelvis` | 14.5 | `(0.0, 0.0, 110.5)` | Região lombar; flexão primária e inclinação inercial (*leaning*). |
| `spine_02` | `spine_01` | 16.0 | `(0.0, 0.0, 126.5)` | Região torácica inferior; torsão do Twisting Slash. |
| `spine_03` | `spine_02` | 18.0 | `(0.0, 0.0, 144.5)` | Caixa torácica superior; âncora de asas, capa e peitoral. |
| `neck_01` | `spine_03` | 10.0 | `(0.0, 0.0, 162.5)` | Pescoço; flexão e olhar direcionado (*Head Look-At*). |
| `head` | `neck_01` | 16.0 | `(0.0, 0.0, 172.5)` | Cabeça; âncora de elmos e visores luminosos. |

### 2.2 Membros Superiores (Braços & Mãos)
| Nome do Osso (L / R) | Osso Pai (Parent) | Comprimento (cm) | Posição Ref. Esquerda (X, Y, Z) | Posição Ref. Direita (X, Y, Z) |
| :--- | :--- | :--- | :--- | :--- |
| `clavicle_l` / `clavicle_r` | `spine_03` | 16.0 | `(0.0, -6.5, 154.0)` | `(0.0, 6.5, 154.0)` |
| `upperarm_l` / `upperarm_r` | `clavicle_l/r` | 32.0 | `(0.0, -22.5, 154.0)` | `(0.0, 22.5, 154.0)` |
| `upperarm_twist_01_l/r` | `upperarm_l/r` | 16.0 | Offset de rotação axial para evitar pinçamento do bíceps. |
| `lowerarm_l` / `lowerarm_r` | `upperarm_l/r` | 28.5 | `(0.0, -54.5, 154.0)` | `(0.0, 54.5, 154.0)` |
| `lowerarm_twist_01_l/r` | `lowerarm_l/r` | 14.0 | Suavização da pronação/supinação do antebraço ao girar a espada. |
| `hand_l` / `hand_r` | `lowerarm_l/r` | 10.5 | `(0.0, -83.0, 154.0)` | `(0.0, 83.0, 154.0)` |

### 2.3 Membros Inferiores (Pernas & Pés)
| Nome do Osso (L / R) | Osso Pai (Parent) | Comprimento (cm) | Posição Ref. Esquerda (X, Y, Z) | Posição Ref. Direita (X, Y, Z) |
| :--- | :--- | :--- | :--- | :--- |
| `thigh_l` / `thigh_r` | `pelvis` | 44.0 | `(0.0, -11.0, 91.0)` | `(0.0, 11.0, 91.0)` |
| `thigh_twist_01_l/r` | `thigh_l/r` | 22.0 | Distribuição de deformação da coxa em agachamentos. |
| `calf_l` / `calf_r` | `thigh_l/r` | 42.5 | `(0.0, -11.0, 47.0)` | `(0.0, 11.0, 47.0)` |
| `calf_twist_01_l/r` | `calf_l/r` | 21.0 | Redução de artefatos de torção na canela. |
| `foot_l` / `foot_r` | `calf_l/r` | 14.0 | `(0.0, -11.0, 8.5)` | `(0.0, 11.0, 8.5)` |
| `ball_l` / `ball_r` | `foot_l/r` | 8.0 | `(12.0, -11.0, 2.5)` | `(12.0, 11.0, 2.5)` |
| `toe_l` / `toe_r` | `ball_l/r` | 5.0 | `(17.5, -11.0, 1.0)` | `(17.5, 11.0, 1.0)` |

### 2.4 Ossos de Cinemática Inversa (IK & Virtual Retargeting Bones)
- `ik_foot_root`: Parent = `root`, posição no chão `(0, 0, 0)`.
- `ik_foot_l`: Parent = `ik_foot_root`, alvo de IK do pé esquerdo.
- `ik_foot_r`: Parent = `ik_foot_root`, alvo de IK do pé direito.
- `ik_hand_root`: Parent = `root`, posição referencial `(0, 0, 140)`.
- `ik_hand_l`: Parent = `ik_hand_root`, alvo de IK da mão esquerda / escudo.
- `ik_hand_r`: Parent = `ik_hand_root`, alvo de IK da mão direita / espada.
- `ik_hand_gun`: Parent = `ik_hand_r`, ponto de retenção para pegada com duas mãos (*Two-Handed Grip*).

---

## 3. DEFINIÇÃO MÉTRICA DE SOCKETS DE ARMAS E ARMADURAS MODULARES

Os sockets métricos definem os pontos exatos de fixação tridimensional (*Attachment Points*), orientação e rastreadores de colisão para as peças modulares do Dark Knight.

```
                           [HeadSocket] (0, 0, 15)
                                  │
      [Cape_Socket] (0, -12, 12)  │  [spine_03_wings] (0, -15, 6)
                  \               │               /
                   \              │              /
                    ┌─────────────┴─────────────┐
                    │        [spine_03]         │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼                                               ▼
     [hand_l]                                        [hand_r]
        │                                               │
  [Weapon_L_Socket]                              [Weapon_R_Socket]
  [Shield_L_Socket]                                     │
                                                 [WeaponStart] (0, 0, 15)
                                                        │
                                                 [WeaponMid]   (0, 0, 95)
                                                        │
                                                 [WeaponEnd]   (0, 0, 190)
```

### 3.1 Sockets de Armas e Traces Volumétricos
| Nome do Socket | Osso Vinculado | Posição Relativa (X, Y, Z cm) | Rotação Relativa (P, Y, R deg) | Finalidade Técnica |
| :--- | :--- | :--- | :--- | :--- |
| `Weapon_R_Socket` | `hand_r` | `(3.2, 2.5, -1.8)` | `(-90.0, 0.0, 0.0)` | Empunhadura principal da arma direita (espadas 1M/2M, machados, lanças). |
| `Weapon_L_Socket` | `hand_l` | `(3.2, -2.5, -1.8)` | `(-90.0, 0.0, 0.0)` | Empunhadura secundária para Dual Wielding (espadas duplas). |
| `Shield_L_Socket` | `lowerarm_l`| `(8.0, 0.0, 0.0)` | `(0.0, 90.0, -90.0)` | Fixação de Escudos Torre e Broquéis no antebraço esquerdo. |
| `WeaponStart` | *Arma Ativa* | `(0.0, 0.0, 15.0)` | `(0.0, 0.0, 0.0)` | Base da lâmina / guarda para início da varredura de colisão contínua. |
| `WeaponMid` | *Arma Ativa* | `(0.0, 0.0, 95.0)` | `(0.0, 0.0, 0.0)` | Ponto médio da lâmina; esfera central do traço volumétrico. |
| `WeaponEnd` | *Arma Ativa* | `(0.0, 0.0, 190.0)`| `(0.0, 0.0, 0.0)` | Ponta da lâmina (Tip); cálculo de velocidade tangencial e ponta de corte. |

### 3.2 Sockets de Asas e Deformação de Capas (Chaos Cloth)
| Nome do Socket | Osso Vinculado | Posição Relativa (X, Y, Z cm) | Rotação Relativa (P, Y, R deg) | Finalidade Técnica |
| :--- | :--- | :--- | :--- | :--- |
| `spine_03_wings` | `spine_03` | `(0.0, -14.5, 6.0)` | `(15.0, 0.0, 0.0)` | Âncora mestre para Asas Tier 1, 2 e 3; alinhamento angular para sustentação aerodinâmica. |
| `wing_socket_root` | `spine_03` | `(0.0, -14.5, 6.0)` | `(15.0, 0.0, 0.0)` | Alias padronizado do socket mestre de asas. |
| `wing_sub_l` | `spine_03` | `(-8.0, -12.0, 8.0)` | `(15.0, -25.0, 0.0)` | Pivô secundário de asa esquerda para torsão e batimento assimétrico. |
| `wing_sub_r` | `spine_03` | `(8.0, -12.0, 8.0)` | `(15.0, 25.0, 0.0)` | Pivô secundário de asa direita. |
| `Cape_Socket` | `spine_03` | `(0.0, -11.0, 12.0)` | `(-10.0, 180.0, 0.0)`| Fixação superior de capas dinâmicas (Chaos Cloth); borda de ancoragem rígida. |

### 3.3 Sockets de Armadura Modular (Paperdoll 3D)
| Nome do Socket | Osso Vinculado | Posição Relativa (X, Y, Z cm) | Rotação Relativa (P, Y, R deg) | Peça de Armadura Correspondente |
| :--- | :--- | :--- | :--- | :--- |
| `head_socket` | `head` | `(0.0, 2.0, 10.0)` | `(0.0, 0.0, 0.0)` | Elmo do Dragão / Visores com VFX de brilho nos olhos. |
| `chest_socket` | `spine_03` | `(0.0, 4.0, 0.0)` | `(0.0, 0.0, 0.0)` | Placas peitorais pesadas com encaixe modular. |
| `gloves_l_socket` | `lowerarm_l`| `(0.0, 0.0, -12.0)` | `(0.0, 0.0, 0.0)` | Manopla esquerda com textura metálica integrada. |
| `gloves_r_socket` | `lowerarm_r`| `(0.0, 0.0, -12.0)` | `(0.0, 0.0, 0.0)` | Manopla direita. |
| `boots_l_socket` | `calf_l` | `(0.0, 0.0, -18.0)` | `(0.0, 0.0, 0.0)` | Greva e bota de aço esquerda. |
| `boots_r_socket` | `calf_r` | `(0.0, 0.0, -18.0)` | `(0.0, 0.0, 0.0)` | Greva e bota de aço direita. |

---

## 4. CONVENÇÕES DE RETARGETING E INTEROPERABILIDADE

1. **Retargeting com UE5 Manny/Quinn:** Os ossos possuem correspondência exata 1:1 com o perfil de Retargeting `RTG_Mannequin`.
2. **Modularidade via `SetLeaderPoseComponent`:** Todas as malhas de armadura utilizam o mesmo esqueleto mestre (`SK_DarkKnight_Skeleton`), permitindo deformação simultânea instantânea no mesmo ciclo de renderização (*Single Evaluation Pass*).
3. **Preservação de Escala e Métricas:** Escala uniforme 1.0; a altura total do Dark Knight é de **192.5 cm**, conferindo aspecto heroico e imponente compatível com os guerreiros clássicos de Lorencia.
