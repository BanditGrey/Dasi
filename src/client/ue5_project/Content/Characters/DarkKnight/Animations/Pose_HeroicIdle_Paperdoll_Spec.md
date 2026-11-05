# ESPECIFICAÇÃO DE ANIMAÇÃO: POSE IDLE HEROICA (PAPERDOLL 3D EM TEMPO REAL)

> **Documento:** Especificação Técnica de Animação de Repouso Heroico para Interface de Inventário  
> **Asset Alvo:** `AS_DarkKnight_HeroicIdle_Paperdoll` (`UAnimSequence`)  
> **Classe Proprietária:** Dark Knight / Cavaleiro do Sangue  
> **Caminho:** `Content/Characters/DarkKnight/Animations/Pose_HeroicIdle_Paperdoll`  

---

## 1. VISÃO GERAL DA ANIMAÇÃO DE PAPERDOLL

A *Pose Idle Heroica* foi desenhada especificamente para a janela de inspeção tridimensional do personagem (*Paperdoll 3D*) e tela de seleção de heróis. Ao contrário de um boneco estático clássico, o Dark Knight transmite vida e imponência militar através de respiração torácica sutil, peso assentado no piso, leve movimento de cabeça acompanhando o cursor do mouse e ondulação majestosa das asas contra a brisa ambiente.

```
                           [HeadLookAt] (Acompanha Cursor sutilmente)
                                 │
     [Asas Tier 2/3]             │              [Ombreira Pesada]
(Ondulação a 0.5 Hz) ◄───┐       │       ┌──► (Reflexo Metálico)
                         │       ▼       │
                      ┌─────────────────────┐
                      │    [spine_01..03]   │ ◄─── Ciclo Respiratório (3.2s)
                      └──────────┬──────────┘
                                 │
             ┌───────────────────┴───────────────────┐
             ▼                                       ▼
       [Mão Esquerda]                          [Mão Direita]
     (Apoiada na Cintura)                  (Empunha Espada no Solo)
             │                                       │
      [Perna Esquerda]                        [Lâmina Cravada]
  (Firme, ângulo de 15°)                   (Ponta no pedestal +3cm)
```

---

## 2. CARACTERÍSTICAS DA POSE HEROICA

| Articulação / Membro | Configuração Anatômica | Efeito Estético |
| :--- | :--- | :--- |
| **Base de Apoio (Pernas)** | Pés afastados a $52\text{ cm}$ (largura dos ombros); pé direito levemente recuado ($12\text{ cm}$). | Postura de sentinela inabalável; centro de gravidade perfeitamente equilibrado no solo. |
| **Braço Direito & Espada** | Mão direita segura o pomo ou guarda da espada de duas mãos, que repousa verticalmente ao lado da bota direita com a ponta cravada no piso. | Sensação de peso imenso; a arma não flutua, ela descansa sobre a terra. |
| **Braço Esquerdo** | Braço flexionado com a manopla de aço repousando no cinto ou segurando a alça do escudo torre nas costas. | Postura de nobreza e prontidão marcial clássica de Lorencia. |
| **Tronco & Coluna** | Caixa torácica expandida, ombros alinhados para trás, elevação do queixo em $+5^\circ$. | Silhueta imponente e heroica (proporção áurea de guerreiro). |

---

## 3. DINÂMICA DE MICROMOVIMENTOS PROCEDURAIS (MICRO-MOTION CYCLE)

### 3.1 Ciclo Respiratório (Thoracic Respiration)
- **Período Total:** $\tau_{\text{breath}} = 3.20\text{ s}$ em loop infinito contínuo.
- **Deformação Óssea:**
  - `spine_02`: Rotação Pitch de $+1.2^\circ$ (inspiração) a $-0.8^\circ$ (expiração).
  - `spine_03`: Translação vertical suave de $+1.5\text{ cm}$ acompanhada de expansão lateral das clavículas ($+0.8\text{ cm}$).

### 3.2 Balanço Majestoso das Asas (Tiers 1, 2 e 3)
- **Frequência de Flap Suave:** $f_{\text{paperdoll}} = 0.50\text{ Hz}$.
- **Amplitude Angular:** $\theta_{\text{flap}} = \pm 8.5^\circ$ em torno do socket `spine_03_wings`.
- **Distorção Etérea:** As penas ou membranas mágicas reagem a um vetor de vento ambiente de baixa intensidade ($\vec{v}_{\text{draft}} = [0.6, 0.2, 0.1]\text{ m/s}$).

### 3.3 Reação ao Cursor do Mouse (Head Look-At IK)
- O osso `neck_01` e a cabeça `head` acompanham suavemente a posição do cursor na tela dentro de um cone de restrição estrito:
  - $\text{Yaw}_{\text{max}} = \pm 18^\circ$
  - $\text{Pitch}_{\text{max}} = \pm 10^\circ$
  - Tempo de interpolação: $8.0\text{ s}^{-1}$ (resposta lenta e digna, sem movimentos bruscos).

---

## 4. INTEGRAÇÃO COM SHADER DE BRILHO (ITEM GLOW PIPELINE)

Quando exibido na tela de Paperdoll:
1. **Realce de Joias (+9 a +15):** As peças de armadura e a lâmina acionam a máscara emissiva do shader `MF_ItemGlow_Include`, exibindo o icônico brilho áureo ou elétrico do Continent of Legend.
2. **Capa Dinâmica (Chaos Cloth):** O tecido da capa pende com gravidade natural e ondula suavemente nos últimos $30\text{ cm}$ da barra.
