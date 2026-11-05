# ESPECIFICAÇÃO DE ANIMAÇÃO: AM_TACTICAL_ROLL (ROLAMENTO EVASIVO COM I-FRAMES)

> **Documento:** Especificação Técnica da Manobra de Evasão Tática e Janela de Invulnerabilidade  
> **Asset Alvo:** `AM_TacticalRoll` (`UAnimMontage`)  
> **Classe Proprietária:** Dark Knight / Cavaleiro do Sangue  
> **Caminho:** `Content/Characters/DarkKnight/Animations/AM_TacticalRoll`  

---

## 1. VISÃO GERAL DA HABILIDADE

O *Tactical Roll* é a manobra primária de defesa ativa e sobrevivência no Action RPG de Dasi. O guerreiro realiza um mergulho tático em rolamento na direção desejada, utilizando o momentum da armadura pesada para escapar de golpes devastadores de chefes. Durante o ápice da rotação, o cavaleiro usufrui de **I-Frames (Quadros de Invulnerabilidade)** precisos e redução procedural da altura da cápsula de colisão.

```
       [0.00s - 0.08s]               [0.08s - 0.42s] (340 ms)                [0.42s - 0.65s]
          DIVE IN                         APEX I-FRAMES                         RECOVERY
       (Mergulho Inicial)         (Invulnerabilidade & Rotação)            (Apoio & Transição)
      ◄───────────────►         ◄──────────────────────────────►         ◄──────────────────►
I-Frames:                               [══════════════════════]
Redução de Cápsula:                     [══════════════════════] (96cm -> 45cm)
Partículas de Solo:                             ▲ Dust Poof
Cancel Window:                                                                  [════════════]
```

---

## 2. ESTRUTURA DE SEÇÕES DO MONTAGE (MONTAGE SECTIONS)

| Seção | Início (s) | Fim (s) | Duração (s) | Descrição Cinemática |
| :--- | :--- | :--- | :--- | :--- |
| `Roll_Dive` | 0.000 | 0.080 | 0.080 | O cavaleiro flexiona os joelhos, recolhe a espada rente ao antebraço e mergulha o ombro líder em direção ao solo. |
| `Roll_Apex_IFrames` | 0.080 | 0.420 | 0.340 | **Janela de Invulnerabilidade Ativa (340 ms):** O dorso e o ombro rolam sobre o chão; placas de armadura raspam a terra; o personagem ignora dano de projéteis e golpes físicos. |
| `Roll_Recovery` | 0.420 | 0.650 | 0.230 | O guerreiro crava a bota no solo, levanta o tronco com o momento angular e ergue a lâmina pronta para responder ou correr. |

---

## 3. TRILHA DE ANIM NOTIFIES & I-FRAMES

```
Time (s): 0.0    0.08   0.15   0.22   0.30   0.37   0.42   0.50   0.58   0.65
          ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
I-Frames:        ▲ Begin (bIsInvulnerable = true)     ▲ End (false)
Capsule:         [════════════════════════════════════] (HalfHeight: 96cm -> 45cm)
Niagara:                ▲ Ground Dust Burst
Sound:           ▲ Dive Thrust                        ▲ Armor Scrape    ▲ Foot Stamp
Cancel:                                                      [═══════════════]
```

### 3.1 Detalhamento dos Notifies
1. `AnimNotify_IFrame_Begin` (`0.080s`):
   - Ativa `bIsInvulnerable = true` no `UDasiCombatComponent` e `ADasiCharacterBase`.
   - Ataques recebidos neste intervalo registram `EDasiDamageType::Miss` com efeito visual de esquiva cinza.
2. `AnimNotify_IFrame_End` (`0.420s`):
   - Desativa `bIsInvulnerable = false`.
3. `AnimNotify_Roll_DustPoof` (`0.180s`):
   - Spawna o emissor Niagara de poeira/neve sob o ombro de apoio (`NS_GroundDust_Roll`).
4. `UDasiAnimNotifyState_ComboWindow` (`0.480s` a `0.650s`):
   - Permite cancelar a transição final de recuperação em um golpe consecutivo (*Roll Attack*) ou transição imediata para corrida (*Sprint Transition*).

---

## 4. CURVAS DE ANIMAÇÃO & REDUÇÃO DE CÁPSULA PROCEDURAL

| Nome da Curva | Tipo | Intervalo de Valores | Função Técnica |
| :--- | :--- | :--- | :--- |
| `Capsule_HalfHeight_Scale` | Float Curve | $1.0 \to 0.47 \to 1.0$ | Reduz proceduralmente a altura da cápsula do `ACharacter` de $96\text{ cm}$ para $45\text{ cm}$, permitindo passar sob flechas horizontais e golpes altos. |
| `Roll_Forward_Velocity` | Float Curve | $0.0 \to 620.0 \to 0.0\text{ cm/s}$ | Deslocamento horizontal total de $3.6\text{ m}$ ao longo do rolamento. |
| `Invulnerability_Alpha` | Float Curve | $0.0 \to 1.0 \to 0.0$ | Utilizado pelo shader de material para gerar refração sutil de distorção de calor no corpo. |

---

## 5. INTEGRAÇÃO VISUAL & RESPOSTA DE CONTROLE

- **Efeito de Rastro de Evasão:** Durante os I-Frames, uma silhueta etérea com translucidez azulada/cinzenta acompanha o centro de massa da armadura.
- **Áudio:** Impacto metálico característico das placas de aço comprimindo o terreno seguido pelo resfolegar do guerreiro e retorno firme das botas ao solo.
