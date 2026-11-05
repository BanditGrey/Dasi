# SISTEMA DE COMBATE, ATRIBUTOS E FÓRMULAS — DASI

> **Referência Clássica:** Mecânicas de Stats e Cálculos de MU Online / Continent of Legend  
> **Evolução Dasi:** Velocidade de ataque adaptativa (evitando quebra de animação), cálculo de física de colisão, *Hit-Box/Hurt-Box* tridimensional e pesos de impacto (*Impact Stagger*).

---

## 1. SISTEMA DE ATRIBUTOS (STATS)

Cada personagem ganha **5 pontos de atributo por nível** (ou 7 pontos após a evolução de classe Master/Gladiador/Soberano).

```
                      ┌──────────────────────┐
                      │ ATRIBUTOS PRINCIPAIS │
                      └──────────┬───────────┘
         ┌───────────────┬───────┴───────┬───────────────┬────────────────┐
         ▼               ▼               ▼               ▼                ▼
     FORÇA (STR)    AGILIDADE (AGI)  VITALIDADE (VIT) ENERGIA (ENE)   COMANDO (CMD)
    Dano Físico      Vel. Ataque      Vida Máxima      Mana Máxima      Especialidade
    Defesa Pesada    Evasão / Defesa  Regeneração      Dano Mágico /    Pet Buffs &
    Requisito Armas  Animação / Dash  Resistência Fís. Buffs e Auras    Aura de Guilda
```

### 1.1 Descrição e Fórmulas de Atributos

| Atributo | Efeito Primário | Efeito Secundário | Impacto no Visual / Animações |
| :--- | :--- | :--- | :--- |
| **Força (STR)** | +Dano Físico Mín/Máx | Permite empunhar armaduras pesadas e armas colossais | Aumenta o tremor de impacto no solo ao acertar golpes |
| **Agilidade (AGI)** | +Taxa de Ataque e Defesa | +Velocidade de Ataque e Aceleração de Esquiva | Acelera suavemente os arcos de animação (com *blending* elástico) |
| **Vitalidade (VIT)** | +Pontos de Vida (HP) | +Resistência a Atordoamento (*Stun Resistance*) | Personagem resiste a animações de cambalear (*flinch*) |
| **Energia (ENE)** | +Poder de Magia / Buffs | +Mana (MP) e Taxa de Dano de Habilidades | Intensifica o brilho das auras e feitiços nas mãos/armas |
| **Comando (CMD)** | +Força de Companheiros | Habilita Pets Soberanos (*Dark Raven*, *Dark Horse*) | Aumenta o raio visual de influência da bandeira da guilda |

---

## 2. REVOLUÇÃO NO ATTACK SPEED (SEM QUEBRA DE ANIMAÇÃO)

No jogo clássico, velocidades extremas de ataque causavam o corte abrupto das animações, transformando golpes em flashes estáticos e "bugs de agilidade". Em **Dasi**, a velocidade de ataque é tratada com rigor físico:

1. **Aceleração Dinâmica com Curvas de Peso (Attack Speed Scaling):**
   - Em vez de cortar frames, a animação utiliza curvas de tempo não-lineares.
   - O *wind-up* (preparação do golpe) e o *recovery* (retorno à postura neutra) aceleram até um limite seguro.
   - Ao atingir altos índices de agilidade, o personagem desbloqueia **Combos Rítmicos de Aceleração** (cadeias de golpes contínuos com movimentos que aproveitam a inércia do golpe anterior em vez de resetar a animação).
2. **Hit-Stop Proporcional ao Impacto:**
   - Golpe Normal: 0.04s de congelamento de frame no instante da lâmina penetrar a armadura.
   - Golpe Crítico: 0.08s de congelamento com onda de choque sônica.
   - Golpe com Arma Pesada (Duas Mãos): Causa *Stagger* (recuo forçado com tremor de câmera sutil).

---

## 3. FÓRMULAS DE DANO & FEEDBACK VISUAL DAS CORES

O clássico código de cores que tornou o Continent of Legend viciante é preservado e enriquecido com efeitos visuais de ponta:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CÓDIGO DE CORES DE DANO                         │
├──────────────┬────────────────────────┬────────────────────────────────┤
│ COR DO DANO  │ SIGNIFICADO TÁTICO     │ COMPORTAMENTO VISUAL & FÍSICO  │
├──────────────┼────────────────────────┼────────────────────────────────┤
│ BRANCO       │ Dano Regular           │ Números padrão flutuando       │
│ LARANJA      │ Dano de Habilidade     │ Efeito de corte com faíscas    │
│ AZUL CLARO   │ Dano Crítico           │ Explosão de choque azulada     │
│ VERDE LIMÃO  │ Dano Excelente         │ Partículas brilhantes e som    │
│ AMARELO OURO │ Ignorar Defesa         │ Racha na armadura do alvo      │
│ ROXO / MAG   │ Dano Duplo / Triplo    │ Dois números idênticos rápidos │
└──────────────┴────────────────────────┴────────────────────────────────┘
```

### 3.1 Equações de Dano

$$\text{Dano Base} = \text{Ataque}(\text{Mín} \sim \text{Máx}) - \text{Defesa do Alvo}$$

- **Dano Crítico (Azul):**
  $$\text{Dano Crítico} = \text{Ataque Máximo} + \text{Dano Crítico de Joias/Armas}$$
- **Dano Excelente (Verde):**
  $$\text{Dano Excelente} = (\text{Ataque Máximo} \times 1.20) + \text{Dano de Opção Excelente}$$
- **Ignorar Defesa do Alvo (Amarelo):**
  $$\text{Dano Puro} = \text{Ataque}(\text{Mín} \sim \text{Máx}) \quad (\text{Defesa do Alvo calculada como } 0)$$
- **Dano Duplo (Roxo):**
  $$\text{Chance de } 5\% \sim 15\% \text{ de duplicar o resultado total do golpe no mesmo frame}$$

---

## 4. SISTEMA DE COLISÃO E CAIXAS DE IMPACTO (HITBOX TRIDIMENSIONAL)

Ao contrário do sistema antigo onde o clique no alvo travava o dano garantido, em Dasi:
- **Hitboxes Ativas em Malha de Arma:** As armas possuem rastreadores de colisão (*Sword Traces*) que detectam contato real durante a rotação do golpe.
- **Dano em Múltiplos Alvos por Varredura:** Um golpe de espada larga acerta todos os monstros que cruzarem o arco do golpe, dividindo o recuo físico entre eles.
- **Evasão Reativa:** Jogadores podem desviar ativamente rolando para baixo de golpes verticais ou saltando sobre ondas de choque terrestres.
