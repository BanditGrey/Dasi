# DOCUMENTO DE LEVEL DESIGN & WORLD BUILDING: LOST TOWER (A TORRE DO INFERNO)

> **Projeto:** Dasi (Continent of Legend Reimagined)  
> **Status:** Especificação Técnica & Artística de Level Design (v1.0)  
> **Ambiente:** A Fortaleza Vertical de Obsidiana & Magma (*Lost Tower*)  
> **Material Canônico de Estudo:** `reference/mu_roxgaming_5.2/client/Data/World5/` (EncTerrain5.att, EncTerrain5.obj)  
> **Modelo 3D GLB:** [`prototypes/3d_scenery/lost_tower_abyss.glb`](file:///d:/Dasi/prototypes/3d_scenery/lost_tower_abyss.glb)  
> **Público-Alvo:** Level Designers, Environment Artists, Lighting Artists, Technical Shaders e Programadores de Combate  

---

## 1. VISÃO GERAL & HIGH CONCEPT DA ZONA

A **Lost Tower (A Torre do Inferno)** é a monumental ascensão vertical de Dasi. Construída em basalto negro polido e placas ciclópicas de obsidiana sobre um abismo de magma incandescente, a torre foi outrora uma fortaleza arcanista que sucumbiu ao pacto demoníaco durante a Era das Sombras, tornando-se a morada celestial profanada do temível demônio **Balrog**.

```
                          [ ÁPICE: O TRONO DE BALROG ]
                           LT_07: Balrog's Hellfire (Pináculo Supremo)
                                       ▲
                                       │
                      ┌────────────────┴────────────────┐
                      │  ANDAR 6: AS MURALHAS INFERNAIS │
                      │  LT_06: Altares de Sangue & Fogo│
                      └────────────────┬────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │  ANDAR 5: A COLUNATA ESPIRAL    │
                      │  LT_05: Abóbada Ciclópica       │
                      └────────────────┬────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │  ANDAR 4: SACADAS DOS DEMÔNIOS  │
                      │  LT_04: Parapeitos do Céu Rubro │
                      └────────────────┬────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │  ANDAR 3: GRELHAS DE MAGMA      │
                      │  LT_03: Plataforma Suspensas    │
                      └────────────────┬────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │  ANDAR 2: CORREDORES RÚNICOS    │
                      │  LT_02: Runas de Fogo e Demônios│
                      └────────────────┬────────────────┘
                                       │
                      ┌────────────────┴────────────────┐
                      │  ANDAR 1: O PORTAL DE OBSIDIANA │
                      │  LT_01: Entrada do Abismo       │
                      └─────────────────────────────────┘
```

### 1.1 Identidade Visual & Tom Emocional
- **Paleta de Sensações:** Magnitude épica esmagadora, fúria infernal incandescente, vertigem de altitude e desafio de combate implacável.
- **Arquitetura:** Gótico infernal monumental com linhas afiadas em basalto negro, blocos ciclópicos polidos de obsidiana espelhada, grelhas de ferro fundido sob as quais corre magma vivo e runas profanas douradas gravadas em relevo.
- **Contraste de Iluminação:** A iluminação é dominada pelo contraste bicromático violento entre a luz emissiva alaranjada/rubra do magma a 1400°C (emissividade HDR 2.5) e as tochas de chamas azuis sulfúricas (4500K com ciano `#06b6d4`) montadas em suportes de bronze draconiano.

---

## 2. TOPOGRAFIA & DINÂMICA DE ELEVAÇÃO DE 7 ANDARES

A progressão da torre é estritamente ascendente em espiral, partindo da cota $+250\text{ m}$ até o pináculo em $+850\text{ m}$:
- **Andar 1 a 2 (+250m a +400m):** Átrios de entrada monumentais, corredores fortificados com nichos de estátuas demoníacas e colunas quadradas maciças.
- **Andar 3 a 5 (+400m a +650m):** As grelhas perfuradas sobre lagos de magma fervente, plataformas sustentadas por correntes verticais ciclópicas e terraços abertos de onde se avista o céu carmesim turbulento.
- **Andar 6 a 7 (+650m a +850m):** Antessalas de sacrifício com canais de lava viva no assoalho e o pináculo ao ar livre com o imponente Trono de Balrog cercado pelo vazio cósmico.

---

## 3. ZONEAMENTO DETALHADO & OS 7 CENÁRIOS CANÔNICOS

### 3.1 `LT_01` — Lost Tower 1: O Portal de Obsidiana
- **Dimensão:** $38\times38\text{ m}$ (Área Segura e Spawn Inicial)
- **POIs Centrais:**
  - **O Portal de Basalto Negro:** Arco monumental em ângulo agudo com runas infernais cinzeladas que emitem pulsações térmicas a cada 3 segundos.
  - **Grelha de Entrada:** Chão vazado de ferro forjado através do qual se enxerga um abismo insondável de lava borbulhante a 200m de profundidade.
  - **Duas Gárgulas Aladas:** Estátuas de demônios alados em pedra negra com olhos de rubi lapidado guardando o limiar.
- **Colisores Físicos:**
  - Pilares do portal: 2 blocos de $2.0\times2.0\text{ m}$ ($h=7.0\text{ m}$).
  - Parapeitos de ferro periféricos: Paredes $Box$ ao longo das bordas abertas ($h=1.3\text{ m}$).

### 3.2 `LT_02` — Lost Tower 2: Os Corredores Rúnicos
- **Dimensão:** $44\times26\text{ m}$
- **POIs Centrais:**
  - Galeria alongada com paredes cobertas por frisos em alto-relevo de batalhas milenares entre arcanjos caídos e horrores do caos.
  - Inscrições rúnicas douradas no rodapé que acendem conforme o jogador caminha sobre as lajes sonoras.
  - 6 tochas com fogo sulfúrico azul ciano em suportes de cabeças de dragão de bronze oxidado.
- **Colisores Físicos:**
  - Colunas quadradas de basalto a cada 6 metros: $1.2\times1.2\text{ m}$ ($h=6.0\text{ m}$).
  - Bancadas de pedra de oferendas fúnebres: $2.4\times0.8\text{ m}$.

### 3.3 `LT_03` — Lost Tower 3: O Abismo das Grelhas de Magma
- **Dimensão:** $40\times40\text{ m}$
- **POIs Centrais:**
  - Plataforma central suspensa por 4 correntes ciclópicas de ferro fundido de 80cm de diâmetro presas a abóbadas invisíveis na penumbra superior.
  - Grelhas de ferro perfurado que emitem jatos verticais periódicos de vapor escaldante a cada 8 segundos, causando dano térmico se não evitados.
  - Fendas de lava aberta nos quatro cantos da plataforma com borbulhas viscosas.
- **Colisores Físicos:**
  - Fendas de lava aberta: Áreas intransponíveis $Box(5.0\times5.0\text{ m})$ com gatilho de dano térmico contínuo.
  - 4 correntes de sustentação: Colisores cilíndricos $r=0.4\text{ m}$.

### 3.4 `LT_04` — Lost Tower 4: As Sacadas dos Demônios Alados
- **Dimensão:** $42\times34\text{ m}$
- **POIs Centrais:**
  - Enorme terraço em balanço aberto para o céu tempestuoso de cinzas e raios vermelhos da torre.
  - Balaustradas com espigões de ferro forjado e altares onde monstros voadores (Devils e Gorgons alados) nidificam.
  - Forte corrente de ar que aplica força horizontal suave de vento impulsionando partículas de brasa para o oeste.
- **Colisores Físicos:**
  - Balaustrada do terraço em balanço: $h=1.2\text{ m}$ ao longo do perímetro em $z=17\text{ m}$.
  - Contrafortes góticos de pedra: 4 blocos angulares de $1.8\times1.0\text{ m}$.

### 3.5 `LT_05` — Lost Tower 5: A Colunata Espiral
- **Dimensão:** $40\times40\text{ m}$
- **POIs Centrais:**
  - Salão circular monumental com 6 colunas espirais ciclópicas em mármore negro venado de ouro que sustentam uma cúpula abobadada com mosaico infernal.
  - Braseiros gigantes esculpidos em formato de crânios cósmicos queimando óleo sulfúrico ininterruptamente.
  - Piso polido com reflexão de alta nitidez espelhando o fogo e os monstros.
- **Colisores Físicos:**
  - 6 colunas espirais ciclópicas: Cilíndricos $r=1.5\text{ m}$, distribuídos em círculo de raio $11.0\text{ m}$.
  - Braseiros de crânio: $r=0.8\text{ m}$, $h=1.5\text{ m}$.

### 3.6 `LT_06` — Lost Tower 6: As Muralhas Infernais
- **Dimensão:** $46\times36\text{ m}$
- **POIs Centrais:**
  - Antessala de sacrifício do senhor supremo. Fendas nas paredes vertem cortinas verticais de magma que alimentam dois canais paralelos no assoalho.
  - Pontes estreitas de pedra de 3.0m de largura cruzando os canais incandescentes.
  - Altares de ferro negro cobertos de punhais de osso e oferendas demoníacas.
- **Colisores Físicos:**
  - 2 canais de magma no piso: Faixas longitudinais intransponíveis de $2.0\text{ m}$ de largura.
  - Altares centrais de ferro negro: 2 blocos de $3.0\times1.5\text{ m}$.

### 3.7 `LT_07` — Lost Tower 7: Balrog's Throne of Hellfire (Arena do Chefe)
- **Dimensão:** $44\times44\text{ m}$ (Arena de Chefe Circular no Pináculo)
- **POIs Centrais:**
  - **O Trono de Lava:** Trono monumental de 6 metros de altura esculpido diretamente no basalto vulcânico encimado pela lendária Foice da Chama Eterna.
  - **4 Obeliscos de Magma Cardeais:** Pilares rúnicos que canalizam energia incandescente para Balrog, gerando auras de invulnerabilidade que exigem destruição tática.
  - **Borda do Abismo Cósmico:** A arena é um pináculo sem parapeitos; quedas pelas bordas arremessam os combatentes em queda livre fatal nas profundezas da torre.
- **Colisores Físicos:**
  - Trono de Balrog: $5.0\times4.0\text{ m}$, $h=6.0\text{ m}$ na coordenada $(0, -14)$.
  - 4 obeliscos rúnicos: Cilíndricos $r=0.9\text{ m}$ nos pontos cardeais em raio de $14.0\text{ m}$.
  - Borda circular do abismo: Limite radial rígido de arena $r=21.0\text{ m}$.

---

## 4. ILUMINAÇÃO, SHADERS E EFEITOS ATMOSFÉRICOS AAA

1. **Iluminação Emissiva HDR e Efeitos Térmicos:**
   - Shading de magma com canal de emissão HDR dinâmico que atinge 3.8 de intensidade, iluminando tetos e paredes com luz alaranjada quente (`#f97316` / `#ef4444`).
   - Shader de distorção de calor (*Heat Haze refraction*) na superfície da lava e acima dos braseiros, aplicando perturbação no canal de normais da tela em tempo real.
2. **Shaders de Materiais PBR:**
   - **Basalto Negro:** Roughness 0.75 a 0.85 com bump rústico de pedra vulcânica porosa.
   - **Obsidiana Polida:** Roughness 0.10 a 0.18, Specular 0.90 com reflexões nítidas de magma.
   - **Bronze Draconiano:** Metalness 0.95, Roughness 0.35 com pátina de óxido turquesa nos cantos chanfrados.
3. **Sistemas de Partículas em Tempo Real (60 FPS):**
   - 500 brasas vulcânicas ardentes flutuando em espiral ascendente impulsionadas pela convecção térmica.
   - Nuvens de cinzas e fagulhas vermelhas geradas em tempo real durante o combate contra Balrog.

---

## 5. BESTIÁRIO E HIERARQUIA DE PROGRESSÃO (NÍVEL 60-95)

| Inimigo | Nível | Tipo | Arquétipo de Combate | Drop Notável |
| :--- | :---: | :--- | :--- | :--- |
| **Shadow** | 60-65 | Espectro Sombrio | Ataque perfurante com lâmina espectral, invisibilidade temporária. | Dragon Helm, Legendary Boots |
| **Cursed Wizard** | 66-70 | Mago Caído | Conjurador de bolas de fogo infernais com explosão em área e queima. | Gordian Staff, Chaos Jewel |
| **Death Cow (Besta Cornífera)**| 71-75 | Demônio Brutal | Investida em alta velocidade com chifres de ferro que derrubam o jogador. | Dragon Armor, Chaos Jewel |
| **Devil (Demônio Alado)** | 76-80 | Demônio Menor | Voo rasante com garras afiadas e emissão de jatos de enxofre em cone. | Legendary Gloves, Bless Jewel |
| **Death Knight** | 81-85 | Cavaleiro da Morte | Tanque demoníaco com espada larga em chamas e corte rotativo devastador. | Dragon Pants, Soul Jewel |
| **Death Gorgon** | 86-90 | Guardião Demoníaco | Cauda pesada com esmagamento e chuva de meteoros ardentes. | Crystal Sword, Dragon Shield |
| **Balrog (Chefe Mundial)** | **95** | Lorde Demoníaco | Titã infernal alado de 7m com Foice de Fogo, explosão de supernova e pisada sísmica de lava. | Archangel Blade, Soul Jewel, Bless Jewel, Dragon Set +7 |
