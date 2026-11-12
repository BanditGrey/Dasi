# DOCUMENTO DE LEVEL DESIGN & WORLD BUILDING: DUNGEON (AS CATACUMBAS DO ABISMO ESQUECIDO)

> **Projeto:** Dasi (Continent of Legend Reimagined)  
> **Status:** Especificação Técnica & Artística de Level Design (v1.0)  
> **Ambiente:** As Catacumbas Subterrâneas do Abismo Esquecido (*Dungeon*)  
> **Material Canônico de Estudo:** `reference/mu_roxgaming_5.2/client/Data/World2/` (EncTerrain2.att, EncTerrain2.obj)  
> **Modelo 3D GLB:** [`prototypes/3d_scenery/dungeon_catacombs.glb`](file:///d:/Dasi/prototypes/3d_scenery/dungeon_catacombs.glb)  
> **Público-Alvo:** Level Designers, Environment Artists, Lighting Artists, Technical Shaders e Programadores de Colisão  

---

## 1. VISÃO GERAL & HIGH CONCEPT DA ZONA

O **Dungeon (As Catacumbas do Abismo Esquecido)** é a primeira descida subterrânea visceral dos heróis em Dasi. Localizada sob as fundações fraturadas do antigo império que precedeu Lorencia, a masmorra é um monumento claustrofóbico à morte, decadência e tortura pagã.

```
                      [ ENTRADA EM LORENCIA SUL ]
                                   │
                                   ▼
          ┌─────────────────────────────────────────────────┐
          │  ANDAR 1: O OSSUÁRIO & CELAS PROFANADAS         │
          │  • DNG_01: Catacumbas da Entrada & Ossuário      │
          │  • DNG_02: Corredor das Celas Profanadas        │
          └────────────────────────┬────────────────────────┘
                                   │
                                   ▼
          ┌─────────────────────────────────────────────────┐
          │  ANDAR 2: CRIPTAS VENENOSAS & CÂMARA DE SUPLÍCIO│
          │  • DNG_03: Criptas Venenosas dos Touros         │
          │  • DNG_04: Câmara de Tortura & Poço dos Sacrif. │
          └────────────────────────┬────────────────────────┘
                                   │
                                   ▼
          ┌─────────────────────────────────────────────────┐
          │  ANDAR 3: LABIRINTO ESPECTRAL & COVIL DO GORGON │
          │  • DNG_05: Labirinto das Almas Perdidas         │
          │  • DNG_06: Gorgon's Lair (Arena do Chefe)       │
          └─────────────────────────────────────────────────┘
```

### 1.1 Identidade Visual & Tom Emocional
- **Paleta de Sensações:** Claustrofobia opressiva, pavor ancestral, perigo oculto na escuridão e urgência de fuga.
- **Arquitetura:** Cantaria romana degenerada, tijolos escurecidos por mofo e fumaça, arcos plenos com argamassa carcomida, nichos funerários repletos de caveiras empilhadas, grades de ferro forjado comidas pela ferrugem e correntes penduradas em tetos abobadados de 4.5m a 7.0m.
- **Contraste de Iluminação:** A iluminação é estrita e dinâmica. Tochas de bronze oxidado vertendo fogo verde sulfúrico (2500K com tonalidade ciano-esmeralda `#10b981`), contrastando com sombras duras e profundas e poças fétidas que refletem a luz espectral.

---

## 2. TOPOGRAFIA & ESTRUTURA VERTICAL DE 3 ANDARES

O complexo do Dungeon se estende verticalmente em 3 níveis de profundidade:
- **Nível 1 (-15m a -25m):** Catacumbas de sepultamento primário e calabouços dos prisioneiros. Corredores de 3.5m a 4.5m de largura com pé-direito de 4.0m.
- **Nível 2 (-35m a -50m):** Criptas alagadas por águas negras e esgoto tóxico dos touros malditos. As câmaras se alargam para 40m com tetos em abóbadas de berço.
- **Nível 3 (-65m a -80m):** O labirinto fúnebre das almas perdidas e a colossal câmara de cúpula fraturada do Gorgon, onde raízes negras do mundo superior perfuram a rocha.

---

## 3. ZONEAMENTO DETALHADO & OS 6 CENÁRIOS CANÔNICOS

### 3.1 `DNG_01` — Catacumbas da Entrada & Ossuário Ciclópico
- **Dimensão:** $38\times38\text{ m}$ (Área de Transição e Ponto Seguro de Respawn)
- **POIs Centrais:**
  - **Portal dos Ossos:** Arco duplo de pedra calcária rachada encimado por inscrições funerárias em latim arcaico.
  - **O Grande Ossuário Central:** Paredes esculpidas com milhares de crânios humanos e ossos longos empilhados geometricamente em nichos de 3 níveis.
  - **Fonte de Sangue Coagulado:** Bacia de sacrifício com líquido escuro e reflexivo, ladeada por 4 tochas verdes ardentes em pedestais de ferro fundido.
- **Colisores Físicos:**
  - Pilares de cantaria: 4 unidades $1.4\times1.4\text{ m}$ ($h=5.0\text{ m}$).
  - Bacia da fonte: Cilíndrico $r=2.2\text{ m}$, $h=1.1\text{ m}$.
  - Portão de ferro enferrujado: $Box(x=0, z=-18, w=4.0, h=4.5, d=0.5)$.

### 3.2 `DNG_02` — Corredor das Celas Profanadas
- **Dimensão:** $46\times24\text{ m}$
- **POIs Centrais:**
  - Duas fileiras de 6 celas medievais com grades de ferro rompidas e deformadas de dentro para fora por criaturas colossais.
  - Correntes de ferro com grilhões suspensas do teto, com esqueletos ainda acorrentados balançando com inércia física real.
  - Poças de lodo esverdeado no chão ladeadas por armadilhas de estacas de solo desativadas.
- **Colisores Físicos:**
  - Grades divisórias das celas: Paredes $Box$ ao longo de $x=\pm6.0\text{ m}$.
  - Pilares centrais a cada 8 metros: Cilíndricos $r=0.6\text{ m}$, $h=4.2\text{ m}$.

### 3.3 `DNG_03` — Criptas Venenosas dos Touros Malditos
- **Dimensão:** $40\times40\text{ m}$
- **POIs Centrais:**
  - Água estagnada com lodo ácido verde fluorescente que cobre 60% do solo, reduzindo a velocidade de movimento dos jogadores em 25%.
  - Quatro sarcófagos monumentais de pedra polida com efígies esculpidas de nobres corrompidos, servindo de obstáculo e cobertura balística contra projéteis mágicos.
  - Fendas nas paredes jorrando vapores venenosos volumétricos esmeralda.
- **Colisores Físicos:**
  - Sarcófagos: 4 caixas rígidas $2.6\times1.4\text{ m}$, $h=1.3\text{ m}$.
  - Pilares com bases submersas: 4 colunas $1.5\times1.5\text{ m}$.

### 3.4 `DNG_04` — Câmara de Tortura & Poço dos Sacrifícios
- **Dimensão:** $36\times36\text{ m}$
- **POIs Centrais:**
  - **O Poço dos Sacrifícios:** Abismo circular de 5 metros de diâmetro no centro da sala cercado por grades de bronze e dentes de pedra afiados. Ecos de lamentos ecoam do poço.
  - Donzelas de ferro enferrujadas abertas e rodas de suplício salpicadas de sangue ressecado.
  - Tochas verdes suspensas em braçadeiras de gárgula nas 4 quinas.
- **Colisores Físicos:**
  - Poço circular central: Colisor oco $r_{interno}=2.5\text{ m}$, intransponível com borda de $h=0.8\text{ m}$.
  - Instrumentos de tortura nas paredes: Bloqueios estáticos de $1.2\times1.2\text{ m}$.

### 3.5 `DNG_05` — Labirinto das Almas Perdidas
- **Dimensão:** $44\times44\text{ m}$
- **POIs Centrais:**
  - Corredores labirínticos interligados em ângulo reto de 3.5m de largura sem nenhuma fonte de luz natural.
  - Névoa rasteira densa que obscurece o piso até a altura dos joelhos ($h=0.6\text{ m}$).
  - Almas espectrais e chamas-fátuas azuis e violetas orbitando silenciosamente entre os nichos funerários.
- **Colisores Físicos:**
  - Malha ortogonal de paredes de cantaria de $1.0\text{ m}$ de espessura com cantos chanfrados para deslizamento fluído de colisão:
    $$\vec{v}_{\text{slide}} = \vec{v} - (\vec{v} \cdot \hat{n}) \hat{n}$$

### 3.6 `DNG_06` — Gorgon's Lair (Arena do Guardião do Abismo)
- **Dimensão:** $42\times42\text{ m}$ (Arena de Chefe Fechada)
- **POIs Centrais:**
  - **Cúpula Fraturada:** Teto abobadado semicircular rompido a 12m de altura, revelando raízes escuras e terra do mundo exterior.
  - **O Altar de Petrificação:** Pedestal central octogonal em pedra negra onde o Gorgon emerge em uma erupção de fumaça sulfúrica e olhos incandescentes.
  - **8 Pilares Rúnicos Destrutíveis:** Colunas circulares de $r=1.2\text{ m}$ dispostas a 12m de distância do centro. Podem ser fragmentadas pelos ataques do chefe gerando cobertura transitória.
- **Colisores Físicos:**
  - Muralha perimetral circular intransponível: $r=20.0\text{ m}$.
  - 8 pilares circulares destrutíveis: $r=1.2\text{ m}$, $h=8.0\text{ m}$.

---

## 4. ILUMINAÇÃO, SHADERS E EFEITOS ATMOSFÉRICOS AAA

1. **Iluminação Volumétrica e Contraste Sombrio:**
   - Shading inteiramente deferred com atenuação quadrática rigorosa.
   - Tochas sulfúricas emitindo cor hexadecimal `#34d399` e intensidade de 2.8 a 4.2 lux.
   - Névoa volumétrica rasteira (`ExponentialHeightFog`) com densidade 0.08 e cor esmeralda escura (`#022c22`).
2. **Shaders de Superfície e PBR:**
   - **Tijolos Úmidos:** Roughness de 0.65 a 0.85 com mapas de normais em alta resolução revelando argamassa descascada e lodo escorrendo.
   - **Poças de Sangue & Veneno:** Roughness 0.05 com reflexão especular acentuada e atenuação Beer-Lambert de profundidade.
   - **Ossuário:** Shader com dispersão subsuperficial leve ($SSS=0.15$) para simular a porosidade e mineralidade de ossos milenares secos.
3. **Sistemas de Partículas em Tempo Real (60 FPS):**
   - 400 partículas de vapor ácido verde suspensas no ar com dissipação senoidal.
   - 4 wisps fosforescentes com trajetórias orbitais elípticas e luzes dinâmicas acopladas.

---

## 5. BESTIÁRIO E HIERARQUIA DE PROGRESSÃO (NÍVEL 30-55)

| Inimigo | Nível | Tipo | Arquétipo de Combate | Drop Notável |
| :--- | :---: | :--- | :--- | :--- |
| **Skeleton Warrior** | 30-35 | Morto-Vivo | Infantaria corpo a corpo rápida, golpe cortante com sabre enferrujado. | Bone Blade, Leather Set peças +3 |
| **Poison Shadow** | 36-40 | Espectro | Conjurador etéreo à distância com projétil venenoso guiado e debuff de DoT. | Skull Staff, Jeweled Ring |
| **Hell Hound** | 41-45 | Besta | Cão infernal veloz com salto perfurante e mordida sangrenta. | Scale Helm, Kris Dagger +4 |
| **Dark Knight Cursed** | 46-50 | Elfo Corrompido | Guerreiro de armadura de placas negras com escudo de torre e golpe com atordoamento. | Brass Plate Armor, Round Shield |
| **Gorgon (Chefe Mundial)** | **55** | Monstruosidade | Chefe colossal de 5.5m com foice dupla, cauda chicoteante e **Olhar de Petrificação** em cone frontal. | Chaos Jewel, Bless Jewel, Plate Set +5, Serpent Sword |
