# ESPECIFICAÇÃO DE BLENDSPACE 2D: BS_DARKKNIGHT_LOCOMOTION (8 DIREÇÕES)

> **Documento:** Especificação Técnica de Locomoção de 8 Direções com Marcações de Sincronização de Passada  
> **Asset Alvo:** `BS_DarkKnight_Locomotion` (`UBlendSpace`)  
> **Classe Proprietária:** Dark Knight / Cavaleiro do Sangue  
> **Caminho:** `Content/Characters/DarkKnight/Animations/BS_DarkKnight_Locomotion`  

---

## 1. VISÃO GERAL DO BLENDSPACE 2D

O `BS_DarkKnight_Locomotion` é o espaço de mesclagem bidimensional responsável por gerar movimentação multidirecional orgânica e com inércia física para o Dark Knight. As passadas transmitem o peso maciço da armadura de ferro, com flexão de joelhos e impacto sólido das botas no solo.

```
Speed (Y)
 ▲
 │                          [Sprint_F] (800 cm/s, 0°)
 │                              │
800 ──                          │
 │                              │
 │            [Run_FL]      [Run_F]      [Run_FR] (550 cm/s)
 │               \              │              /
550 ──            \             │             /
 │                 \            │            /
 │           [Walk_FL]      [Walk_F]     [Walk_FR] (180 cm/s)
180 ──           \              │              /
 │                \             │             /
 │                 ──────────[Idle]────────── (0 cm/s)
 0 ─────────────────────────────┼─────────────────────────────► Direction (X)
  -180°          -90°           0°            +90°         +180°
 (Back)         (Left)        (Fwd)          (Right)       (Back)
```

---

## 2. DEFINIÇÃO DOS EIXOS DO BLENDSPACE

| Eixo | Nome da Propriedade | Unidade | Faixa Mín / Máx | Tempo de Interpolação | Descrição Técnica |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Eixo Horizontal (X)** | `Direction` | Graus ($^\circ$) | $[-180.0^\circ, +180.0^\circ]$ | $0.150\text{ s}$ | Ângulo relativo entre a direção de velocidade do ator e a rotação do personagem. |
| **Eixo Vertical (Y)** | `Speed` | $\text{cm/s}$ | $[0.0, 800.0]$ | $0.200\text{ s}$ | Magnitude da velocidade horizontal escalar no solo. |

---

## 3. GRADE DE AMOSTRAGEM E ANIMAÇÕES VINCULADAS

### 3.1 Ponto Zero: Repouso Heroico (Speed = 0 cm/s)
- **Coordenada:** `(0°, 0 cm/s)`
- **Sequência:** `AS_DarkKnight_Idle_Combat`
- **Descrição:** Postura de combate sólida com pés afastados na largura dos ombros, espada de duas mãos empunhada com ambas as mãos à frente do peito, respiração torácica sutil e asas balançando suavemente contra o vento.

### 3.2 Patamar 1: Marcha Tática (Walk - Speed = 180 cm/s)
Passos deliberados, calculados, com som pesado de armadura e espada pronta para aparar ou estocar.
| Direção (X) | Nome da Sequência de Animação | Ângulo Angular |
| :--- | :--- | :--- |
| $0^\circ$ | `AS_DarkKnight_Walk_F` | Frente (Forward) |
| $+45^\circ$ | `AS_DarkKnight_Walk_FR` | Diagonal Frente-Direita |
| $+90^\circ$ | `AS_DarkKnight_Walk_R` | Strafe Direita |
| $+135^\circ$ | `AS_DarkKnight_Walk_BR` | Diagonal Trás-Direita |
| $\pm 180^\circ$| `AS_DarkKnight_Walk_B` | Recuo Traseiro (Backwards) |
| $-135^\circ$ | `AS_DarkKnight_Walk_BL` | Diagonal Trás-Esquerda |
| $-90^\circ$ | `AS_DarkKnight_Walk_L` | Strafe Esquerda |
| $-45^\circ$ | `AS_DarkKnight_Walk_FL` | Diagonal Frente-Esquerda |

### 3.3 Patamar 2: Corrida de Combate (Run - Speed = 550 cm/s)
Corrida agressiva com a espada estendida na lateral direita para corte em movimento, tronco inclinado para a frente em $12^\circ$.
| Direção (X) | Nome da Sequência de Animação | Ângulo Angular |
| :--- | :--- | :--- |
| $0^\circ$ | `AS_DarkKnight_Run_F` | Corrida Frontal |
| $+45^\circ$ | `AS_DarkKnight_Run_FR` | Corrida Frontal Direita |
| $+90^\circ$ | `AS_DarkKnight_Run_R` | Strafe Rápido Direita |
| $+135^\circ$ | `AS_DarkKnight_Run_BR` | Recuo Diagonal Direita |
| $\pm 180^\circ$| `AS_DarkKnight_Run_B` | Recuo Corrido Traseiro |
| $-135^\circ$ | `AS_DarkKnight_Run_BL` | Recuo Diagonal Esquerda |
| $-90^\circ$ | `AS_DarkKnight_Run_L` | Strafe Rápido Esquerda |
| $-45^\circ$ | `AS_DarkKnight_Run_FL` | Corrida Frontal Esquerda |

### 3.4 Patamar 3: Investida de Arrancada (Sprint - Speed = 800 cm/s)
- **Coordenada:** `(0°, 800 cm/s)`
- **Sequência:** `AS_DarkKnight_Sprint_F`
- **Descrição:** Arrancada com máxima transferência de potência; passos longos partindo o solo, capa e asas totalmente estendidas para trás pela resistência do ar, espada inclinada para perfuração frontal.

---

## 4. MARCADORES DE SINCRONIZAÇÃO DE PASSADA (SYNC MARKERS)

Para prevenir deslizamento de pés (*foot sliding*) durante a transição fluida entre caminhar, correr e disparar:
1. `Foot_L_Down`: Ponto exato de impacto da bota esquerda contra o chão ($Z = 0$).
2. `Foot_R_Down`: Ponto exato de impacto da bota direita contra o chão ($Z = 0$).
3. `Foot_L_Pass`: Ponto em que o pé esquerdo cruza a linha média da perna direita.
4. `Foot_R_Pass`: Ponto em que o pé direito cruza a linha média da perna esquerda.

Ao sincronizar esses marcadores, o UE5 ajusta proporcionalmente o tempo de reprodução das pernas, mantendo as passadas 100% ancoradas no relevo com apoio do `CR_DarkKnight_ControlRig`.
