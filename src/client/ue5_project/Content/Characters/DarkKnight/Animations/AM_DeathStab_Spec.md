# ESPECIFICAÇÃO DE ANIMAÇÃO: AM_DEATH_STAB (ESTOCADA DO TROVÃO)

> **Documento:** Especificação Técnica de Montagem de Animação e Impulso Balístico  
> **Asset Alvo:** `AM_DeathStab` (`UAnimMontage`)  
> **Classe Proprietária:** Dark Knight / Cavaleiro do Sangue  
> **Caminho:** `Content/Characters/DarkKnight/Animations/AM_DeathStab`  

---

## 1. VISÃO GERAL DA HABILIDADE

O *Death Stab* é o golpe de penetração concentrada mais devastador do Dark Knight. O guerreiro recua a espada acumulando tensão cinemática e salta para a frente em uma arrancada violenta, perfurando a armadura do alvo principal e gerando um cone supersônico de vácuo e eletricidade que arremessa inimigos adjacentes para trás.

```
         [0.00s - 0.22s]           [0.22s - 0.45s]           [0.45s - 0.58s]        [0.58s - 0.85s]
          ANTICIPATION                  LUNGE                 IMPACT HOLD              RECOVERY
       (Carga Cinética)         (Avanço de 850 cm/s)     (Perfuração & Hit-Stop)     (Retorno / Combo)
      ◄────────────────►       ◄───────────────────►    ◄─────────────────────►    ◄─────────────────►
Trace:                                [═══════════]
Impulso Linear:                        ▲ Launch (850 cm/s)
Onda Cônica:                                                   ▲ Shockwave
Combo Window:                                                                             [═══════════]
```

---

## 2. ESTRUTURA DE SEÇÕES DO MONTAGE (MONTAGE SECTIONS)

| Seção | Início (s) | Fim (s) | Duração (s) | Descrição Cinemática |
| :--- | :--- | :--- | :--- | :--- |
| `Stab_Anticipation` | 0.000 | 0.220 | 0.220 | O guerreiro recolhe a espada rente à costela direita, abaixa o centro de massa e comprime a coxa esquerda de apoio. Faíscas crepitam na ponta da arma. |
| `Stab_Lunge` | 0.220 | 0.450 | 0.230 | Arrancada frontal explosiva impulsionada pelo `CharacterMovementComponent`, deslocando o guerreiro $4.5\text{ m}$ à frente em linha reta com a lâmina em riste. |
| `Stab_Impact_Hold` | 0.450 | 0.580 | 0.130 | A espada penetra profundamente o alvo principal; micro-congelamento temporal (*Hit-Stop* nativo) e deflagração da concha sônica cônica de vácuo. |
| `Stab_Recovery` | 0.580 | 0.850 | 0.270 | O cavaleiro extrai a espada com um golpe de recuo do cotovelo, restabelecendo a postura de combate ou encadeando o próximo combo. |

---

## 3. TRILHA DE ANIM NOTIFIES & NOTIFY STATES

```
Time (s): 0.0    0.1    0.2    0.3    0.4    0.5    0.6    0.7    0.8    0.85
          ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
Trace:                  [═════════════] (WeaponTraceState: DeathStab_Pierce)
Impulse:                ▲ Launch (Forward 850 cm/s)
Sonic:                                 ▲ Cone Shockwave Burst
Hit-Stop:                              ▲ Trigger Hit-Stop (85ms - 120ms)
Combo:                                                       [═════════]
Sound:           ▲ Charge Spark        ▲ Sonic Crack & Thunder       ▲ Blade Pull
```

### 3.1 Detalhamento dos Notifies
1. `UDasiAnimNotifyState_WeaponTrace` (`0.240s` a `0.450s`):
   - **AttackProfileName:** `DeathStab_Pierce`
   - **InitialCleaveEnergy:** `300.0f` (elevada capacidade de penetração contra armaduras pesadas).
   - **IgnoreArmorRatio:** `0.35` (ignora $35\%$ da defesa física do monstro).
   - **SweepShape:** Cápsula longitudinal estreita estendida entre `WeaponMid` e `WeaponEnd` ($R = 14.0\text{ cm}$).
2. `AnimNotify_DeathStab_ForwardImpulse` (`0.220s`):
   - Executa no CharacterMovement:
     $$\vec{V}_{\text{launch}} = \hat{X}_{\text{actor}} \times 850.0\text{ cm/s} + [0, 0, 80\text{ cm/s}]$$
3. `AnimNotify_DeathStab_SonicCone` (`0.420s`):
   - Detona uma onda de pressão cônica frontal ($\text{Ângulo} = 45^\circ$, $\text{Alcance} = 6.5\text{ m}$).
   - Aplica Knockback de dispersão radial e dano secundário em inimigos adjacentes.
4. `UDasiAnimNotifyState_ComboWindow` (`0.650s` a `0.850s`):
   - Janela de cancelamento dinâmico para encadeamento com *Twisting Slash* ou *Tactical Roll*.

---

## 4. CURVAS DE ANIMAÇÃO & PARÂMETROS FÍSICOS

| Nome da Curva | Tipo | Intervalo de Valores | Função Técnica |
| :--- | :--- | :--- | :--- |
| `Forward_Impulse_Scale` | Float Curve | $0.0 \to 1.0 \to 0.0$ | Modula o impulso cinemático de translação da raiz. |
| `Camera_FOV_Kick` | Float Curve | $0.0 \to -4.5^\circ \to 0.0$ | Efeito de aproximação dramática da lente da câmera no impacto (*Snap Zoom*). |
| `Spine_Thrust_Compression`| Float Curve | $0.0 \to 15.0\text{ cm} \to 0.0$ | Deformação física da caixa torácica contra a resistência do impacto. |

---

## 5. INTEGRAÇÃO VISUAL & SONORA

- **Efeito de Vácuo Supersônico (`NS_DeathStab_SonicCone`):** Túnel cilíndrico de distorção óptica do ar com faíscas elétricas de alta voltagem conectando o pomo da espada à ponta.
- **Áudio Espacial:** Trovão seco metálico seguido pelo som de pressurização de ar e rachadura de placas de aço.
