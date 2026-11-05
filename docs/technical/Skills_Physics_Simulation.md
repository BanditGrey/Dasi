# ESPECIFICAÇÃO TÉCNICA: SIMULAÇÃO FÍSICA DE HABILIDADES ICÔNICAS — DASI

> **Documento:** Engenharia de Gameplay & Simulação de Habilidades  
> **Versão:** 1.0.0  
> **Status:** Aprovado para Implementação e Testes  
> **Módulos Vinculados:** `prototypes.combat_system.skills_simulation`, `prototypes.combat_system.vector3`  

---

## SUMÁRIO EXECUTIVO

Em jogos clássicos do gênero Continent of Legend, as habilidades icônicas eram meros sprites 2D ou malhas animadas estáticas disparadas sem qualquer interação com a geometria física ou as leis da dinâmica clássica. Em **Dasi**, cada habilidade de classe é regida por modelos de física newtoniana, mecânica de fluidos simplificada, balística atmosférica e curvas dinâmicas de aceleração e amortecimento.

Este documento estabelece a fundamentação matemática, os algoritmos vetoriais e as especificações de engenharia para três habilidades centrais:
1. **Twisting Slash (Blood Knight):** Vórtice centrípeto de sucção, aceleração angular do tronco, inércia da espada de duas mãos e ejeção balística de estilhaços (*blade shrapnel*).
2. **Evil Spirits (Chaos Arcanist):** Enxame espectral de 12 a 24 projéteis distribuídos em espirais logarítmicas de expansão radial ($r = a \cdot e^{b\theta}$), varredura volumétrica tridimensional e atenuação de dano por saturação de impacto (*damage damping*).
3. **Triple Shot (Sylph Huntress):** Tripla balística convergente tridimensional com arrasto aerodinâmico quadrático, dispersão de empuxo lateral e penetração cinemática (*arrow sticking & terrain embed*).

---

## 1. TWISTING SLASH (BLOOD KNIGHT)

```
                              ▲ Vetor de Torque Angular
                              │ (Torso Spine Twist)
                       ┌──────┴──────┐
                       │   Caster    │ ◄─── Centro de Rotação (0,0)
                       └──────┬──────┘
                              │
               R_blade ───────┼───────► Raio da Lâmina (1.6m - 2.2m)
                              │
               R_vortex ──────┴───────────────► Raio do Vórtice (3.5m - 5.0m)
                   ▲
                   │  F_centripeta (Vórtice de Vácuo)
                   └── Puxa alvos leves para a trajetória do corte
```

### 1.1 Dinâmica Angular do Tronco e Inércia da Espada

O guerreiro não gira em velocidade angular instantânea infinita. O movimento é decomposto em três fases de torque angular:
1. **Spin-Up (Aceleração Angular $\alpha$):** O guerreiro projeta o quadril e torce a coluna lombar (`spine_01` a `spine_03`), transferindo momentum para a lâmina colossal:
   $$\theta(t) = \frac{1}{2} \alpha t^2, \quad \omega(t) = \alpha t, \quad t \in [0, t_{\text{accel}}]$$
2. **Sustained Vortex ($\omega_{\text{max}}$ constante):** A lâmina atinge a velocidade angular limite governada pelo atributo de Agilidade e Força:
   $$\omega_{\text{max}} = \omega_{\text{base}} \times \left(1 + 0.35 \cdot \ln\left(1 + \frac{\text{AGI}}{200}\right)\right)$$
3. **Spin-Down (Frenagem Inercial):** O peso da lâmina exige desaceleração controlada por atrito no solo e contra-torque muscular.

A velocidade tangencial da ponta da lâmina a cada instante é dada por:
$$\vec{v}_{\text{tangential}} = \vec{\omega} \times \vec{r}_{\text{tip}} \implies \|\vec{v}_{\text{tangential}}\| = \omega \cdot R_{\text{blade}}$$

Para uma lâmina de $R_{\text{blade}} = 1.9\text{ m}$ girando a $\omega = 18\text{ rad/s}$ ($\approx 2.86\text{ rotações/segundo}$), a velocidade tangencial na ponta atinge:
$$\|\vec{v}_{\text{tangential}}\| = 18 \times 1.9 = 34.2\text{ m/s} \quad (\approx 123.1\text{ km/h})$$

### 1.2 Campo de Força Centrípeto (Vórtice de Vácuo)

O giro hiper-rápido de uma lâmina de duas mãos pesada cria um gradiente de pressão negativa (efeito de vácuo ciclônico). Alvos localizados entre o raio da lâmina ($R_{\text{blade}}$) e o limite externo do vórtice ($R_{\text{vortex}}$) sofrem uma força atrativa direcionada para o círculo de corte:

$$\vec{F}_{\text{pull}} = -G_{\text{vortex}} \cdot \frac{\omega^2 \cdot (R_{\text{vortex}} - \|\vec{r}\|)}{1 + \lambda \cdot m_{\text{target}}} \cdot \hat{r}$$

Onde:
- $G_{\text{vortex}}$: Coeficiente de sucção aerodinâmica ($3.2\text{ N}\cdot\text{s}^2/\text{m}$).
- $\vec{r} = \vec{P}_{\text{target}} - \vec{P}_{\text{caster}}$ no plano horizontal ($XY$).
- $m_{\text{target}}$: Massa física do alvo em quilogramas.
- $\lambda$: Coeficiente de sensibilidade inercial ($\lambda = 0.015\text{ kg}^{-1}$).

#### Condição de Resistência ao Deslocamento (Atrito Estático):
O alvo só é puxado se a força de sucção superar a resistência por atrito de contato com o solo:
$$\|\vec{F}_{\text{pull}}\| > \mu_s \cdot m_{\text{target}} \cdot g$$

Se satisfeita, a aceleração resultante do alvo em direção ao anel de dano é:
$$\vec{a}_{\text{target}} = \frac{\vec{F}_{\text{pull}} - \mu_k \cdot m_{\text{target}} \cdot g \cdot \hat{r}}{m_{\text{target}}}$$

| Categoria do Alvo | Massa ($m$) | Raio de Sucção | Resposta ao Vórtice | Comportamento de Impacto |
| :--- | :--- | :--- | :--- | :--- |
| **Monstro Leve (Goblin / Hound)** | $45 - 70\text{ kg}$ | $4.5\text{ m}$ | Puxado rapidamente para a lâmina ($a \approx 6.5\text{ m/s}^2$) | Arremesso radial e stagger pesado |
| **Monstro Médio (Soldier / Orc)** | $120 - 180\text{ kg}$ | $3.8\text{ m}$ | Puxado moderadamente ($a \approx 2.1\text{ m/s}^2$) | Flinch pronunciado |
| **Monstro Pesado (Golem / Minotaur)**| $400 - 800\text{ kg}$ | $0.0\text{ m}$ | Imune à sucção ($\|\vec{F}_{\text{pull}}\| < F_{\text{fric}}$) | Apenas absorve corte sem translação |
| **Boss / World Boss** | $\ge 2500\text{ kg}$ | $0.0\text{ m}$ | Imune absoluto a qualquer translação | Dano direto sem interrupção postural |

### 1.3 Vetor de Transferência de Momentum no Impacto da Lâmina

Ao atingir o alvo, o corte transfere um vetor composto de momentum:
$$\vec{J}_{\text{impact}} = \vec{J}_{\text{tangential}} + \vec{J}_{\text{centrifugal}}$$

1. **Componente Tangencial:** Arrasta o alvo na direção da rotação angular ($\hat{t} = \hat{\omega} \times \hat{r}$).
2. **Componente Centrífuga de Expulsão:** Quando a postura (*Poise*) do alvo quebra, a aceleração centrípeta cessa e ele é ejetado para fora com velocidade radial:
   $$\vec{v}_{\text{eject}} = v_t \cdot \hat{t} + \left(\sqrt{\frac{E_{\text{impact}}}{m_{\text{target}}}}\right) \cdot \hat{r}$$

### 1.4 Física de Estilhaços e Fragmentos de Vácuo (*Blade Shrapnel*)

O atrito do corte no solo e a quebra de armaduras geram de 4 a 8 estilhaços físicos (*Debris Particles*):
- Posição inicial: $\vec{P}_{\text{impact}}$.
- Velocidade inicial balística com desvio cônico aleatório:
  $$\vec{v}_{\text{shrapnel}} = \vec{v}_{\text{tangential}} \times 0.6 + \vec{v}_{\text{cone}}(\theta_{\text{scatter}}, \phi_{\text{scatter}})$$
- Cada fragmento sofre gravidade ($\vec{g} = [0, 0, -9.81\text{ m/s}^2]$) e resistência aerodinâmica quadrática:
  $$\vec{F}_d = -\frac{1}{2} \rho C_d A \|\vec{v}\| \vec{v}$$
- Ao colidir com o solo ($z \le 0$), quica com coeficiente de restituição $e = 0.35$ e atrito de rolamento até parar.

---

## 2. EVIL SPIRITS (CHAOS ARCANIST)

```
                            Spiral Logarítmica: r = a * exp(b * theta)
                                      
                                        *  (Espírito 4)
                                  *
                             *         *  (Espírito 3)
                        *         + (Caster)
                           *           *  (Espírito 2)
                                  *
                                       *  (Espírito 1)
```

### 2.1 Formulação Matemática do Enxame em Espiral

A habilidade convoca $N \in [12, 24]$ almas espectrais caóticas que emergem do solo ao redor do conjurador e se expandem em trajetórias governadas pela **Espiral Logarítmica de Bernoulli-Descartes**:

$$r(\theta) = r_0 \cdot e^{b \cdot (\theta - \theta_i)}$$

Onde:
- $r_0$: Raio inicial de emanação a partir do orbe/cajado do arcanista ($0.35\text{ m} \le r_0 \le 0.60\text{ m}$).
- $b$: Fator de taxa de expansão radial por rotação angular:
  $$b = \frac{\ln(R_{\text{max}} / r_0)}{2\pi \cdot N_{\text{turns}}}$$
  Para $R_{\text{max}} = 12.0\text{ m}$, $r_0 = 0.5\text{ m}$ e $N_{\text{turns}} = 1.5$ voltas:
  $$b = \frac{\ln(12 / 0.5)}{3\pi} = \frac{3.178}{9.424} \approx 0.3372$$
- $\theta_i$: Ângulo de fase inicial de cada espírito uniformemente distribuído com jitter pseudo-aleatório:
  $$\theta_i = \frac{2\pi \cdot i}{N} + \mathcal{U}(-\delta_\theta, +\delta_\theta), \quad i \in [0, N-1]$$

### 2.2 Cinemática Tridimensional e Ondulação Hovering

Os espíritos não se movem exclusivamente em um plano 2D, mas realizam uma onda senoidal vertical que simula almas flutuando no éter:

$$z(t) = z_{\text{caster}} + z_{\text{eye}} + A_{\text{hover}} \cdot \sin\left(\omega_z \cdot t + \phi_i\right)$$

- $A_{\text{hover}} = 0.45\text{ m}$ (amplitude de oscilação).
- $\omega_z = 8.0\text{ rad/s}$ (frequência de flutuação).
- $\phi_i = \theta_i$ (defasagem harmônica individual).

A velocidade instantânea de cada espírito em coordenadas polares é:
$$\dot{r} = b \cdot \dot{\theta} \cdot r(t), \quad v_{\text{tangential}} = r(t) \cdot \dot{\theta}$$
$$\|\vec{v}_{\text{planar}}\| = \dot{\theta} \cdot r(t) \cdot \sqrt{1 + b^2}$$

### 2.3 Detecção Volumétrica por Varredura Esférica (*Swept Sphere*)

Cada espírito transporta um núcleo de plasma espectral cercado por um halo áurico:
- Raio de colisão esférico: $R_{\text{spirit}} = 0.45\text{ m}$.
- Entre o frame $t$ e $t + \Delta t$, o projétil gera uma cápsula de varredura (*Swept Sphere Capsule*) conectando $\vec{P}(t)$ a $\vec{P}(t + \Delta t)$.
- Se a distância euclidiana mínima entre o segmento de varredura e o centro do hurtbox do alvo for inferior a $(R_{\text{spirit}} + R_{\text{hurtbox}})$, registra-se um impacto instantâneo.

```
       P(t) ───►  O════════════════════════════O  ◄─── P(t + dt)
                  ▲        Swept Capsule       ▲
                  └──────── R_spirit ──────────┘
```

### 2.4 Amortecimento de Dano por Saturação (*Damage Damping Formula*)

No Continent of Legend clássico, Evil Spirits era suscetível a bugs de stacking onde monstros colados no mago recebiam 20 projéteis instantâneos no mesmo frame, causando pico desproporcional de DPS (*shotgunning* indevido).

Em **Dasi**, a energia espectral dissipa conforme múltiplos espíritos atingem o mesmo hospedeiro:

$$D_k = D_{\text{base}} \times \max\left(\gamma_{\text{floor}}, \gamma^{k-1}\right)$$

Onde:
- $k \in \{1, 2, 3, \dots\}$: Índice sequencial de impacto sofrido pelo mesmo alvo na mesma conjuração.
- $\gamma = 0.55$: Coeficiente de amortecimento exponencial por impacto subsequente.
- $\gamma_{\text{floor}} = 0.18$: Limiar mínimo de dano residual garantido.
- **Teto de Impactos por Alvo ($K_{\text{max}} = 4$):** Nenhum alvo pode receber dano de mais de 4 espíritos da mesma conjuração, garantindo que o feitiço seja balanceado para controle de área maciça sem aniquilar bosses por stacking pontual.

#### Curva de Dano por Impacto Consecutivo ($D_{\text{base}} = 500$):
- **Impacto 1:** $500 \times 1.000 = \mathbf{500.0}$
- **Impacto 2:** $500 \times 0.550 = \mathbf{275.0}$
- **Impacto 3:** $500 \times 0.302 = \mathbf{151.2}$
- **Impacto 4:** $500 \times 0.180 = \mathbf{90.0}$
- **Total Acumulado:** $1016.2$ de dano (eficiência balanceada de dispersão).

---

## 3. TRIPLE SHOT (SYLPH HUNTRESS)

```
       Caster (Bow)
         Socket_L ──\
                     \
         Socket_C ────════════════► Target Reticle Focus Point (D_focus)
                     /
         Socket_R ──/
         (Abertura)
```

### 3.1 Balística 3D e Equações de Movimento

A arqueira dispara três flechas simultaneamente a partir de três pontos no riser do arco sagrado:
- **Flecha Central ($C$):** Origem na corda central $(0, 0, z_{\text{bow}})$.
- **Flecha Esquerda ($L$):** Origem deslocável $(0, -d_{\text{socket}}, z_{\text{bow}})$, onde $d_{\text{socket}} = 0.22\text{ m}$.
- **Flecha Direita ($R$):** Origem deslocável $(0, +d_{\text{socket}}, z_{\text{bow}})$.

Cada projétil possui massa $m_{\text{arrow}} = 0.045\text{ kg}$ ($45\text{ g}$), ponta de aço rúnico com área frontal $A = 0.00018\text{ m}^2$ e coeficiente de arrasto aerodinâmico $C_d = 0.045$.

A aceleração tridimensional de cada flecha a qualquer momento é dada por:

$$\frac{d\vec{v}}{dt} = \vec{g} - \frac{1}{2 m_{\text{arrow}}} \rho C_d A \|\vec{v}\| \vec{v} + \vec{a}_{\text{flutter}}$$

Onde:
- $\vec{g} = [0, 0, -9.81\text{ m/s}^2]$ (gravidade padrão).
- $\rho = 1.225\text{ kg/m}^3$ (densidade do ar ao nível do mar).
- $\vec{a}_{\text{flutter}}$: Perturbação turbulenta estocástica de baixa intensidade perpendicular à trajetória.

### 3.2 Geometria de Convergência no Ponto Focal ($D_{\text{focus}}$)

Ao mirar em um alvo a uma distância $D_{\text{focus}}$ na direção do retículo $\hat{u}_{\text{aim}}$, o ponto de impacto desejado é:

$$\vec{P}_{\text{focus}} = \vec{P}_{\text{caster}} + \hat{u}_{\text{aim}} \cdot D_{\text{focus}} + [0, 0, z_{\text{aim}}]$$

Para que as flechas laterais ($L$ e $R$) convirjam exatamente no mesmo ponto de impacto a essa distância, seus vetores de velocidade inicial $\vec{v}_{0, L}$ e $\vec{v}_{0, R}$ são inclinados para dentro:

$$\vec{d}_k = \vec{P}_{\text{focus}} - \vec{P}_{0, k}, \quad \hat{u}_k = \frac{\vec{d}_k}{\|\vec{d}_k\|}$$
$$\vec{v}_{0, k} = v_{\text{muzzle}} \cdot \hat{u}_k + [0, 0, v_{\text{loft}}]$$

Onde $v_{\text{loft}} = \frac{1}{2} g \cdot t_{\text{flight}}$ compensa a queda gravitacional parabólica até o ponto focal.

#### Comportamento Pós-Foco:
Se nenhum alvo interceptar as flechas na distância focal $D_{\text{focus}}$, as trajetórias se cruzam e continuam divergindo naturalmente pelo espaço, mantendo integridade física sem desaparecer artificialmente.

### 3.3 Penetração Cinética e Cravamento no Alvo / Terreno (*Arrow Sticking*)

Ao impactar um hurtbox ou o solo plano ($z \le 0$), a física avalia a energia cinética disponível:

$$E_k = \frac{1}{2} m_{\text{arrow}} \|\vec{v}_{\text{impact}}\|^2$$

Para uma flecha a $v = 85\text{ m/s}$:
$$E_k = \frac{1}{2} \times 0.045 \times (85)^2 = 162.56\text{ Joules}$$

#### Profundidade de Penetração ($d_{\text{embed}}$):
A profundidade em que a ponta da flecha se aloja no material depende da resistência de escoamento do material atingido ($\sigma_{\text{material}}$ em $\text{N/m}$):

$$d_{\text{embed}} = \min\left(L_{\text{shaft}}, \frac{E_k}{\sigma_{\text{material}}}\right)$$

- **Carne / Armadura Leve:** $\sigma = 900\text{ N/m} \implies d_{\text{embed}} \approx 18.0\text{ cm}$ (cravamento profundo na malha do monstro, a flecha se move junto aos ossos do alvo via *bone attachment*).
- **Armadura de Placas Pesada:** $\sigma = 4500\text{ N/m} \implies d_{\text{embed}} \approx 3.6\text{ cm}$ (penetração rasa com faíscas de ricochete parcial).
- **Solo / Rocha:** $\sigma = 3200\text{ N/m} \implies d_{\text{embed}} \approx 5.0\text{ cm}$ (flecha fixa no terreno com oscilação vibracional elástica amortecida).

#### Vibração Harmônica Amortecida da Haste da Flecha (*Twang Vibration*):
Ao cravar no alvo ou no solo, a porção exposta da haste ($L_{\text{free}} = L_{\text{shaft}} - d_{\text{embed}}$) vibra transversalmente:

$$\delta x_{\text{twang}}(t) = A_0 \cdot e^{-\zeta \omega_n t} \cdot \cos\left(\omega_d t\right)$$

- Frequência natural: $\omega_n \approx 140\text{ rad/s}$ ($\approx 22\text{ Hz}$).
- Fator de amortecimento: $\zeta = 0.25$.
- Proporciona o clássico feedback tátil e sonoro de flecha fincada com força.

---

## 4. MATRIZ DE PARÂMETROS E CALIBRAÇÃO GERAL

| Parâmetro Físico | Twisting Slash | Evil Spirits | Triple Shot |
| :--- | :--- | :--- | :--- |
| **Tempo de Execução Total** | $1200\text{ ms}$ (3 rotações) | $1600\text{ ms}$ (vida do feixe) | Instantâneo ($350\text{ ms}$ release) |
| **Raio Efetivo de Dano** | $R_{\text{blade}} = 1.9\text{ m}$ | $R_{\text{max}} = 12.0\text{ m}$ | Alcance balístico $45.0\text{ m}$ |
| **Raio de Força / Efeito Físico** | $R_{\text{vortex}} = 4.5\text{ m}$ | Trajetória em espiral $r = ae^{b\theta}$ | Ponto de foco em $D_{\text{focus}} = 18.0\text{ m}$ |
| **Contagem de Projéteis / Elementos**| 1 lâmina + 6 fragmentos | 12 a 24 espíritos (padrão: 16) | 3 flechas balísticas independentes |
| **Tipo de Detecção** | Swept Capsule do gume | Swept Sphere contínua ($R=0.45\text{ m}$) | Ray/Capsule Sweep com arrasto |
| **Reação ao Impacto** | Vórtice centrípeto + ejeção | Amortecimento multi-hit ($55\%$) | Cravamento com profundidade física |
| **Custo de Recursos** | $25\text{ AG} / 12\text{ MP}$ | $75\text{ MP}$ | $18\text{ AG} / 10\text{ MP}$ |

---

## 5. CONCLUSÃO E INTEGRAÇÃO

A simulação dessas três habilidades transforma o combate de Dasi em uma experiência visceral:
- O guerreiro com **Twisting Slash** controla as massas através da gravidade dinâmica e atrito, recompensando o jogador que atrai hordas para o vórtice.
- O arcanista com **Evil Spirits** satura o campo com geometria logarítmica precisa, eliminando injustiças de hit-stacking e proporcionando um espetáculo etéreo coerente.
- A arqueira com **Triple Shot** recompensa o posicionamento balístico ideal na distância focal, oferecendo física cinemática visível nas flechas presas nos corpos dos inimigos e no cenário.
