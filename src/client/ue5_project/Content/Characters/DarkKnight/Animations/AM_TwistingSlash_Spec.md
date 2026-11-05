# ESPECIFICAÇÃO DE ANIMAÇÃO: AM_TWISTING_SLASH (TORMENTA DE AÇO)

> **Documento:** Especificação Técnica de Montagem de Animação e Curvas de Torque  
> **Asset Alvo:** `AM_TwistingSlash` (`UAnimMontage`)  
> **Classe Proprietária:** Dark Knight / Cavaleiro do Sangue  
> **Caminho:** `Content/Characters/DarkKnight/Animations/AM_TwistingSlash`  

---

## 1. VISÃO GERAL DA HABILIDADE

O *Twisting Slash* é a habilidade de corte contínuo em 360° mais icônica do Dark Knight. Em Dasi, o guerreiro utiliza o peso de sua espada colossal de duas mãos como um pêndulo inercial, torcendo a coluna lombar e criando um vórtice de baixa pressão que puxa monstros próximos em direção ao fio da lâmina antes de ejetá-los por força centrífuga.

```
                      [0.00s - 0.20s]          [0.20s - 0.95s]             [0.95s - 1.20s]
                       SPIN START                 SPIN LOOP                    SPIN END
                   (Torque & Spin-Up)      (3 Giros de 360° a 18 rad/s)     (Frenagem Inercial)
                   ◄────────────────►    ◄──────────────────────────────►  ◄─────────────────►
Weapon Trace:                               [══════════════════════════]
Vórtice Centrípeto:                         [══════════════════════════]
Combo Chain Window:                                                            [═════════════]
```

---

## 2. ESTRUTURA DE SEÇÕES DO MONTAGE (MONTAGE SECTIONS)

| Seção | Início (s) | Fim (s) | Duração (s) | Descrição Cinemática |
| :--- | :--- | :--- | :--- | :--- |
| `Spin_Start` | 0.000 | 0.200 | 0.200 | O guerreiro flexiona os joelhos, projeta o quadril e torce a coluna (`spine_01..03`) acumulando energia potencial elástica. |
| `Spin_Loop` | 0.200 | 0.950 | 0.750 | Rotação em alta velocidade angular ($\omega = 18.0\text{ rad/s}$), completando 3 revoluções de $360^\circ$ com a lâmina perfeitamente horizontal. |
| `Spin_End` | 0.950 | 1.200 | 0.250 | Desaceleração inercial contra o atrito do solo; a lâmina crava momentaneamente no piso levantando poeira e faíscas. |

---

## 3. TRILHA DE ANIM NOTIFIES & NOTIFY STATES

```
Time (s): 0.0    0.1    0.2    0.3    0.4    0.5    0.6    0.7    0.8    0.9    1.0    1.1    1.2
          ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
Trace:                  [═══════════════════════════════════════════════] (WeaponTraceState)
Vortex:                 ▲ Start                                         ▲ End
Niagara:                [═══════════════════════════════════════════════] (NS_WeaponTraceRibbon)
Combo:                                                                         [═════════════]
Sound:           ▲ Windup      ▲ Whoosh 1      ▲ Whoosh 2     ▲ Whoosh 3       ▲ Steel Impact
```

### 3.1 Detalhamento dos Notifies
1. `UDasiAnimNotifyState_WeaponTrace` (`0.200s` a `0.950s`):
   - **AttackProfileName:** `TwistingSlash_Whirlwind`
   - **InitialCleaveEnergy:** `220.0f` (permite cortar até 5 alvos médios por rotação).
   - **TraceRadius:** `22.0 cm` em torno dos sockets `WeaponStart`, `WeaponMid` e `WeaponEnd`.
   - **Multi-Hit Behavior:** Ativado a cada $360^\circ$ de varredura angular (reset de blacklist por revolução).
2. `AnimNotify_TwistingSlash_VortexStart` (`0.200s`):
   - Ativa o campo de atração centrípeto de vácuo ($R_{\text{vortex}} = 4.5\text{ m}$).
   - Puxa monstros leves e médios com aceleração $a \approx 6.5\text{ m/s}^2$ para o raio de corte da lâmina ($R_{\text{blade}} = 1.9\text{ m}$).
3. `AnimNotify_TwistingSlash_VortexEnd` (`0.950s`):
   - Desliga o campo centrípeto e aplica o vetor de ejeção tangencial-centrífuga nos alvos com postura quebrada.
4. `UDasiAnimNotifyState_ComboWindow` (`0.980s` a `1.200s`):
   - Abre a janela de cancelamento; permite encadear o próximo ataque sem retornar à pose neutra de repouso.

---

## 4. CURVAS DE ANIMAÇÃO & MOTION MATCHING (ANIMATION CURVES)

| Nome da Curva | Tipo | Intervalo de Valores | Função Técnica |
| :--- | :--- | :--- | :--- |
| `AngularVelocity_Yaw` | Float Curve | $0.0 \to 18.0 \to 0.0\text{ rad/s}$ | Alimenta a velocidade de rotação do ator e o deslocamento de partículas Niagara. |
| `Torso_Lean_Pitch` | Float Curve | $-12^\circ \to +8^\circ$ | Compensação inercial da coluna para suportar o peso da espada de duas mãos. |
| `Vortex_Suction_Intensity`| Float Curve | $0.0 \to 1.0 \to 0.0$ | Modula dinamicamente a força do campo vetorial de sucção de alvos. |
| `FootIK_Weight` | Float Curve | $1.0 \to 0.2 \to 1.0$ | Reduz a restrição rígida de IK dos pés durante o giro rápido para permitir pivô suave. |

---

## 5. INTEGRAÇÃO COM NIAGARA VFX & ÁUDIO ESPACIAL

- **VFX Ribbon Trail (`NS_WeaponTraceRibbon`):** Emite um arco translúcido contínuo de lâmina com cores e distorção de refração de calor ancorado entre os sockets `WeaponStart` e `WeaponEnd`.
- **Ejeção de Estilhaços (`NS_BladeShrapnel`):** Spawna de 4 a 8 fragmentos físicos incandescentes quicando pelo solo a cada frame que a ponta raspa o piso.
- **Áudio Espacial:** Som trifásico — *Windup Crescendo* $\to$ *Triplo Vórtice Cortante* $\to$ *Impacto Pesado de Aço e Respiração do Cavaleiro*.
