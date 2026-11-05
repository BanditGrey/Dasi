# ESPECIFICAÇÃO DE CONTROL RIG & MOTION MATCHING: DARK KNIGHT

> **Documento:** Arquitetura do Control Rig Procedural & Resolução de Terreno no AnimBP  
> **Asset Alvo:** `CR_DarkKnight_ControlRig` / `ABP_DarkKnight`  
> **Engine Alvo:** Unreal Engine 5.4+ / Full Body IK / Control Rig Graph  
> **Caminho:** `Content/Characters/DarkKnight/CR_DarkKnight_ControlRig`  

---

## 1. VISÃO GERAL DA ARQUITETURA DE CONTROL RIG

O `CR_DarkKnight_ControlRig` atua como a camada de cinemática procedural em tempo real executada diretamente na GPU/CPU antes do envio das matrizes de transformação para a renderização. Sua responsabilidade central é conferir **peso, ancoragem física no solo e resposta inercial** ao Cavaleiro do Sangue.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PIPELINE DE AVALIAÇÃO DE ANIMAÇÃO                                    │
├───────────────────────────────┬───────────────────────────────────┬────────────────────────────────────┤
│    1. Animation Blueprint     │        2. Control Rig Procedural  │      3. Renderização & Física      │
│ • State Machine (Locomotion)  │ • Foot Placement IK               │ • Atualização de Matrizes Ósseas   │
│ • Layered Blend Per Bone      │   (Traço contra escadas/rampas)   │ • Chaos Cloth (Capa & Saia)        │
│ • Slot Blending (Montages)    │ • Pelvis Offset Compensation      │ • Volumetric Weapon Traces         │
│ • Escala Dinâmica de AGI      │ • Body Leaning / Banking Inercial │ • VFX Niagara Ribbon Trails        │
│   (Piso incompressível 65ms)  │ • Hand Two-Bone IK para Armas 2M  │                                    │
└───────────────────────────────┴───────────────────────────────────┴────────────────────────────────────┘
```

---

## 2. SISTEMA DE FOOT PLACEMENT IK (SOLO, RAMPAS E ESCADAS DE LORENCIA)

O Cavaleiro do Sangue veste armadura de placas pesada; pés flutuando no ar ou penetrando degraus destroem a credibilidade visual. O Foot Placement IK resolve o contato exato com o relevo irregular (como a ponte de pedras de Lorencia, as escadas da igreja e os declives lamacentos).

```
                      [pelvis]
                         │ ◄─── PelvisOffset = min(Offset_L, Offset_R)
             ┌───────────┴───────────┐
             │                       │
         [thigh_l]               [thigh_r]
             │                       │
          [calf_l]                [calf_r]
             │                       │
          [foot_l]                [foot_r]
             │                       │
    TraceStart (+50cm)      TraceStart (+50cm)
             │                       │
    ═════════*═══════════   ═════════*═══════════  (Degrau / Superfície Normal)
             │                       │
     TraceEnd (-60cm)        TraceEnd (-60cm)
```

### 2.1 Algoritmo de Traçado e Alinhamento Angular
Para cada pé (`foot_l` e `foot_r`):
1. **Raycasting Espacial:**
   - $\vec{P}_{\text{start}} = \text{WorldPos}(\text{foot}) + [0, 0, 50\text{ cm}]$
   - $\vec{P}_{\text{end}} = \text{WorldPos}(\text{foot}) - [0, 0, 60\text{ cm}]$
   - Canal de Colisão: `ECC_Visibility` (filtrando o próprio ator).
2. **Cálculo de Deslocamento Vertical ($\Delta Z$):**
   $$\Delta Z_{\text{foot}} = P_{\text{hit}, z} - \text{WorldPos}(\text{foot})_z + H_{\text{sole\_offset}}$$
   Onde $H_{\text{sole\_offset}} = 4.5\text{ cm}$ (espessura da sola de ferro da bota).
3. **Alinhamento com a Normal da Superfície ($\hat{N}$):**
   A rotação do pé é orientada para casar com a inclinação do terreno:
   $$\text{Pitch}_{\text{foot}} = \arctan\left(\frac{N_x}{N_z}\right) \times \frac{180^\circ}{\pi}$$
   $$\text{Roll}_{\text{foot}} = -\arctan\left(\frac{N_y}{N_z}\right) \times \frac{180^\circ}{\pi}$$
   Ambos os ângulos são limitados a $[-35^\circ, +35^\circ]$ para prevenir distorções anatômicas do tornozelo.

### 2.2 Compensação da Altura da Pélvis
Para evitar que uma perna fique excessivamente esticada quando a outra pisa em um degrau mais baixo:
$$Z_{\text{pelvis\_target}} = \min(\Delta Z_{\text{foot\_l}},\, \Delta Z_{\text{foot\_r}})$$
Ajuste aplicado à pélvis:
$$\text{PelvisOffset}(t) = \text{FInterpTo}(\text{PelvisOffset}(t-1),\, Z_{\text{pelvis\_target}},\, \Delta t,\, 18.0\text{ s}^{-1})$$

### 2.3 Solver do Control Rig
- **Node:** `Basic Two Bone IK` (ou `PBIK Solver`)
- **Item A:** `thigh_l/r`
- **Item B:** `calf_l/r`
- **Effector:** `foot_l/r`
- **Pole Vector:** Direcionado $+X$ (para a frente do joelho com offset de $+40\text{ cm}$).

---

## 3. INCLINAÇÃO DE TRONCO POR INÉRCIA (BODY LEANING & BANKING ANGLE)

Em combates dinâmicos, mudanças bruscas de trajetória ou o balanço de uma espada colossal de duas mãos geram forças inerciais que devem deformar a cadeia espinhal (`spine_01`, `spine_02`, `spine_03`).

```
                ▲ Vetor Normal Up (+Z)
                │
                │     /  Ângulo de Rolagem (LeanRoll)
                │    /   Gerado pela aceleração centrípeta em curvas
                │   /
             ┌──┴──/──┐
             │ [spine]│
             └──┬─────┘
                │
          [Centro de Giro]
```

### 3.1 Modelo de Forças Inerciais
A aceleração do personagem é decomposta em dois eixos ortogonais no espaço local do ator:
1. **Aceleração Tangencial / Longitudinal ($a_{\text{fwd}}$):** Arrancadas rápidas ou frenagens bruscas:
   $$a_{\text{fwd}} = \frac{\vec{v}(t) \cdot \hat{X}_{\text{actor}} - \vec{v}(t-\Delta t) \cdot \hat{X}_{\text{actor}}}{\Delta t}$$
   - Aceleração positiva $\implies$ Tronco projeta-se à frente ($\text{Pitch} < 0$).
   - Frenagem brusca $\implies$ Tronco recua para trás para resistir à inércia ($\text{Pitch} > 0$).
2. **Aceleração Centrípeta / Lateral ($a_{\text{lat}}$):** Curvas em alta velocidade:
   $$a_{\text{lat}} = \omega_{\text{yaw}} \times \|\vec{v}_{\text{horizontal}}\|$$
   $$\text{LeanRoll} = \arctan\left(\frac{a_{\text{lat}}}{g}\right) \times K_{\text{roll\_gain}}$$

### 3.2 Tabela de Parâmetros de Leaning
| Parâmetro | Valor Calibrado | Limite Mín / Máx | Efeito Visual |
| :--- | :--- | :--- | :--- |
| `RollGain` | 1.35 | $[-24^\circ, +24^\circ]$ | Inclinação lateral dramática em curvas acentuadas. |
| `PitchGain` | 0.95 | $[-16^\circ, +18^\circ]$ | Projeção frontal na corrida; contração na frenagem. |
| `InterpSpeed` | $12.0\text{ s}^{-1}$ | $-$ | Suavização elástica que previne trepidação visual. |

### 3.3 Distribuição Óssea na Coluna Vertebral
A rotação inercial total é distribuída progressivamente:
- `spine_01`: $25\%$ da rotação (apoio lombar).
- `spine_02`: $35\%$ da rotação (flexão torácica média).
- `spine_03`: $40\%$ da rotação (encaixe dos ombros e peitoral).

---

## 4. RESOLUÇÃO DO PISO INCOMPRESSÍVEL DE ATAQUE (65 ms) NO ANIMATION BLUEPRINT

### 4.1 O Problema Histórico
Em versões antigas do gênero, jogadores com agilidade extrema atingiam tempos teóricos de ataque de $30\text{ ms} - 45\text{ ms}$, ultrapassando a taxa de atualização dos sub-passos de física (60 Hz = $16.6\text{ ms}$). O resultado era a **perda completa da caixa de colisão (*hitbox collapse*)**, ataques fantasmas e descontinuidade estética.

### 4.2 Arquitetura de Blending em Camadas no `ABP_DarkKnight`

```
[Locomotion State Machine] (Pernas / Pés com Foot IK)
             │
             │ Base Pose
             ▼
[Layered Blend Per Bone] ◄─── Blend Mask: spine_01 (Branch Filter)
             │                (Permite pernas correrem enquanto o tronco ataca)
             │ Upper Body Pose
             ▼
[Slot: DefaultSlot / CombatSlot] (Recebe Montages AM_TwistingSlash, AM_DeathStab)
             │
             │ Output Pose com PlayRate Dinâmico
             ▼
[Control Rig Node] (Executa Foot Placement e Body Leaning)
             │
             ▼
        [Final Pose]
```

### 4.3 Equação de Garantia da Janela Ativa
O Animation Blueprint consome as durações calculadas pelo `UDasiCombatComponent`:
- $T_{\text{windup}}$: Comprimível até $75\%$ ($0.350\text{ s} \to 0.080\text{ s}$).
- $T_{\text{active}}$: **Travado no piso incompressível:**
  $$T_{\text{active}} = \max\left(0.065\text{ s},\, T_{\text{active\_calc}}\right)$$
- $T_{\text{recovery}}$: Comprimível e cancelável pelo buffer de combos.

Essa restrição matemática garante que o Notify `UDasiAnimNotifyState_WeaponTrace` permaneça ativo por no mínimo **4 frames a 60 FPS**, tempo suficiente para que o `SweepMultiByChannel` execute a amostragem contínua das esferas sem deixar frestas espaciais.
