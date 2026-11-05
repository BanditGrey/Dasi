# DOCUMENTO DE LEVEL DESIGN & WORLD BUILDING: RUÍNAS SUBMERSAS DE THALASSA (ATLANS)

> **Projeto:** Dasi (Inspirado no Continent of Legend - MU Online)  
> **Status:** Especificação Técnica & Artística de Level Design (v1.0)  
> **Ambiente:** Ruínas Submersas de Thalassa (*Atlans Reimaginada*)  
> **Público-Alvo:** Level Designers, Environment Artists, Technical Artists e Shaders Developers  

---

## 1. VISÃO GERAL & HIGH CONCEPT DA ZONA

As **Ruínas Submersas de Thalassa** representam a outrora gloriosa metrópole oceânica do continente antediluviano de Dasi, submersa sob centenas de metros de água salgada cristalina e abismos oceânicos após o Cataclismo de Kundun. Longe de ser um mapa marinho estático ou abafado, Thalassa é um reino aquático hipnotizante, vertiginoso e luminoso: feixes de luz solar (*God Rays* cáusticos) penetram a lâmina d'água superior refratando sobre recifes de corais gigantescos, arcos ciclópicos esculpidos em mármore marinho e esqueletos de leviatãs titânicos que repousam em dunas de areia branca perolada.

À medida que os guerreiros mergulham em direção às profundezas das fossas abissais, a luz do sol desvanece gradualmente, cedendo lugar à bioluminescência ciano-elétrica de corais fúngicos, anêmonas colossais e olhos predatórios. No fundo do abismo mais profundo, em uma cratera de fendas hidrotermais e colunas de basalto quebrado, reina a colossal **Hydra Abissal**, guardando relíquias arcanas de água primordial e joias sagradas.

### 1.1 Identidade Visual & Tom Emocional
- **Paleta de Cores:**
  - *Zona Fótica Rasa (0m a -40m):* Turquesa vibrante (#00E5FF), ciano caribenho (#00B4D8), areia de quartzo dourado (#E9D8A6) e magenta vivo dos corais de gorgônia (#E63946 / #FF007F).
  - *Zona Mesopelágica / Penumbra (-40m a -120m):* Azul ultramarino profundo (#003049 / #0A2463), verde-esmeralda espectral (#1B9AAA) e fósforo azul (#48CAE4).
  - *Zona Abissal (-120m a -250m):* Índigo vulcânico (#03071E), negro-azulado abissal (#000814), pontuado por fendas hidrotermais alaranjadas (#FF5400) e bioluminescência bioelétrica (#00FFA3).
- **Arquitetura Thalassiana:** Estruturas monolíticas antediluvianas em mármore de concha polida (*Nácar*) e granito marinho cinzelado com motivos ondulatórios, arcos parabólicos hidrodinâmicos, domos de cristal pressurizado e estátuas de divindades marinhas cobertas por esponjas de vidro e anêmonas carnívoras.
- **Atmosfera & Sensação:** Flutuabilidade cósmica, vertigem tridimensional, fascínio visual pela dança cáustica na areia e terror progressivo pela perda da luz solar e pelo surgimento de silhuetas monstruosas na vastidão azul.

---

## 2. TOPOGRAFIA & MACRO-LAYOUT VERTICAL

O mapa de Thalassa mede **2560m x 2560m** com uma amplitude de profundidade vertical de **0m (nível da superfície do mar) até -260m (o fundo da Fossa Abissal)**. O ambiente opera sob física tridimensional subaquática contínua:

- **Nível 1: A Plataforma Rasa & Santuário de Nácar (-10m a -35m):** Recifes de corais abertos, alta penetração de raios solares, ruínas residenciais semi-enterradas e a Safe Zone submarina.
- **Nível 2: O Desfiladeiro dos Naufrágios & Vale dos Leviatãs (-35m a -90m):** Gargantas submarinas esculpidas pela erosão marinha, carcaças de navios antigos de madeira petrificada e costelas ciclópicas de leviatãs antediluvianos.
- **Nível 3: Os Túneis de Correnteza Rápida (*The Slipstreams*) (-70m a -140m):** Condutos cilíndricos naturais de alta vazão aquática que impulsionam o jogador em alta velocidade através de fendas de basalto.
- **Nível 4: As Fossas Vulcânicas & A Cidadela Afundada (-140m a -200m):** Cúpulas em ruínas, guardiões anfíbios blindados e áreas de alta pressão hidrostática.
- **Nível 5: O Abismo da Serpente Primordial (-200m a -260m):** A arena da **Hydra**, cercada por fumarolas negras, gêiseres de água superaquecida e pilares de basalto espirais.

```
                              [ SUPERFÍCIE / PORTAL DE NORIA & LORENCIA ]
                              (Entrada pela Cascata Subterrânea Submersa)
                                                 │
                                                 ▼
                   ┌─────────────────────────────────────────────────────────┐
                   │        SANTUÁRIO DE NÁCAR (SAFE ZONE DE THALASSA)       │
                   │      (Domo de Ar Místico, Comerciantes & Ponto de Spawn)│
                   └─────────────────────────────┬───────────────────────────┘
                                                 │
                                                 ▼
                   ┌─────────────────────────────────────────────────────────┐
                   │           RECIFES SUPERIORES DE CORAL LUMINESCENTE      │
                   │       (Bahamuts Menores, Aranhas Marinhas, Mermaids)    │
                   └─────────────────────────────┬───────────────────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
                        ▼                                                 ▼
        ┌───────────────────────────────┐               ┌─────────────────────────────────┐
        │     O CEMITÉRIO DOS LEVIATÃS  │               │   TÚNEIS DE CORRENTEZA RÁPIDA   │
        │ (Esqueletos Ciclópicos, Vepar,│               │ (Slipstream Cânions, Aceleração │
        │   Silver Valkyries Arqueiras) │               │  Vetorial, Vepar Guerreiros)    │
        └───────────────┬───────────────┘               └────────────────┬────────────────┘
                        │                                                 │
                        └────────────────────────┬────────────────────────┘
                                                 │
                                                 ▼
                   ┌─────────────────────────────────────────────────────────┐
                   │               A CIDADELA AFUNDADA DE AZURIA             │
                   │    (Grand Bahamuts, Lizard Kings, Colunas de Nácar)     │
                   └─────────────────────────────┬───────────────────────────┘
                                                 │
                                                 ▼
                   ┌─────────────────────────────────────────────────────────┐
                   │            O ABISMO VULCÂNICO DE KALAMAR                │
                   │   (Fumarolas Negras, Pressão Abissal, Serpentes Reais)  │
                   └─────────────────────────────┬───────────────────────────┘
                                                 │
                                                 ▼
                               [ ARENA DO ABISMO: A COLOSSAL HYDRA ]
                               (Chefe Soberano dos Oceanos de Dasi)
```

---

## 3. MECÂNICAS EXCLUSIVAS DE GAMEPLAY SUBAQUÁTICO

### 3.1 Movimentação Tridimensional & Flutuabilidade Neutra
- **Navegação em 6 Graus de Liberdade Parciais (6DoF Ground-Biased):**
  - O jogador caminha suavemente pelo leito arenoso com passos amortecidos e saltos gravitacionais estendidos (gravidade reduzida a 35% do valor terrestre).
  - **Nado Livre (Swim Mode):** Pressionando a tecla de salto duplo ou tecla de ascensão/descensão, o personagem entra no modo de nado livre, deslocando-se em três eixos ($X, Y, Z$) com rotação fluida do torso e pernas sincronizadas com animação de batimento de pernas aquáticas.
- **Mecânica de Pulmão & Amuleto das Guelras de Thalassa:**
  - Personagens sem o item *Amuleto das Guelras (Amulet of Thalassa)* ou *Pingente de Água +7* possuem uma barra de fôlego (*Breath Meter*) de 180 segundos.
  - Ao esgotar o fôlego, o personagem sofre dano hipóxico progressivo (3% HP max/seg).
  - Portadores de asas (Wings Lv1/Lv2/Lv3) ou montarias anfíbias (Uníria Mágica, Dinorant Marinho ou Fenrir D'água) convertem o nado em propulsão hidrodinâmica permanente com respiração infinita.

### 3.2 Túneis de Correnteza Rápida (*Slipstream Jets*)
- Vórtices e tubos de água de alta velocidade naturais conectam áreas distantes do mapa:
  - Ao entrar em um *Slipstream*, o jogador ganha +250% de velocidade de movimento linear e fica imune a colisões com monstros menores.
  - Partículas de bolhas cavitacionais e trilhas de distorção de refração envolvem a câmera com efeito de aceleração (*FOV Warp* de 75° para 95°).
  - O jogador pode se esquivar lateralmente de estalactites e minas de água atiradas por inimigos Vepar emboscados nas paredes dos tubos.

### 3.3 Combate Sob Pressão & Balística Aquática
- **Projéteis e Feitiços Adaptados:**
  - Flechas comuns perdem alcance e velocidade (-30%), incentivando o uso de *Besta de Arpão Thalassiana* ou *Arcos Encantados com Vento Subaquático*.
  - Magias de Fogo (como *Flame* ou *Fireball*) evaporam instantaneamente gerando explosões de vapor escaldante com dano de área curto e obscurecimento por bolhas.
  - Magias Elétricas (*Lightning*) têm seu raio de condutividade expandido em 300% na água, atingindo alvos em cadeia com eletrificação de cardumes ao redor.
  - Magias de Gelo (*Ice*) congelam o volume d'água temporariamente em plataformas de gelo flutuantes que sobem lentamente até a superfície.

---

## 4. ZONEAMENTO DETALHADO (POINTS OF INTEREST - POIs)

### 4.1 POI 1: O Santuário de Nácar (Safe Zone Central)
- **Coordenadas Virtuais:** X: 1280, Y: 1280, Z: -25m.
- **Conceito & Atmosfera:**
  - Uma bolha mágica esférica colossal de 80 metros de diâmetro gerada por quatro pilares de cristal coralino.
  - O interior da cúpula é parcialmente drenado por hidro-runas, permitindo que fogueiras místicas ardam sobre pedestais de conchas e mercadores negociem em terreno seco.
  - A água forma o "teto" translúcido da cúpula, onde peixes-lua gigantes e raias manta bioluminescentes cruzam lentamente lançando sombras móveis sobre o chão de mosaicos perolados.
- **NPCs e Estruturas de Serviço:**
  - *Sacerdotisa Naiad (Oráculo das Ondas):* Fornece bênçãos de proteção hidrostática e vende o *Amuleto das Guelras*.
  - *Ferreiro Tartaruga Abissal (Gorgon):* Repara equipamentos desgastados pelo sal marinho e encorpora runas de pressão hidrostática em armaduras de escamas.
  - *Mestre do Correio de Bolhas:* Permite armazenar e transferir baús de tesouros através de cápsulas flutuantes que viajam pelas correntes até o continente.

### 4.2 POI 2: O Cemitério dos Leviatãs & Os Corais Luminosos
- **Coordenadas Virtuais:** X: 850, Y: 1100, Z: -65m.
- **Geometria & Level Design:**
  - Um vale amplo ladeado por costelas de uma criatura marinha pré-histórica cujo esqueleto mede mais de 300 metros de comprimento.
  - O interior da carcaça fossilizada virou um labirinto orgânico colonizado por colônias de corais cérebros fluorescentes em tons de magenta e amarelo elétrico.
  - Cardumes de peixes de vidro reativos reagem à presença do jogador, dispersando-se em nuvens cintilantes ao serem perturbados por ataques ou passos.
- **Ecologia Hostil:**
  - *Bahamuts:* Criaturas reptilianas aquáticas velozes, com escamas iridescentes e dentes serrilhados que atacam em bando em ângulos verticais cegos.
  - *Silver Valkyries Marinhas:* Espectros femininos com caudas de sereia armada e tridentes de prata pura, capazes de disparar jatos de bolhas perfurantes a longa distância.

### 4.3 POI 3: Os Túneis de Correnteza do Abismo (*The Great Slipstream*)
- **Coordenadas Virtuais:** X: 1600, Y: 900, Z: -110m.
- **Design de Fluxo & Adrenalina:**
  - Um sistema tubular de cavernas de basalto cilíndrico polido onde a água corre a mais de 70 km/h em direção à fossa profunda.
  - Pilares de coral pontiagudos exigem manobras evasivas em alta velocidade.
  - Rotas bifurcadas: uma rota rápida direta, porém repleta de minas explosivas orgânicas (*Pufferfish Spores*), e uma rota lateral mais lenta que oculta baús afundados de capitães piratas de outrora.

### 4.4 POI 4: A Cidadela Afundada de Azuria & Salão dos Reis-Lagartos
- **Coordenadas Virtuais:** X: 1400, Y: 1850, Z: -160m.
- **Arquitetura & Ambientação:**
  - Ruínas de palácios de estilo grego-atlante com colunas coríntias rachadas, templos inundados e pórticos submersos cobertos de cracas e ouro oxidado.
  - Fendas no piso revelam luzes quentes e borbulhantes de magma subterrâneo que geram correntes de convecção térmica ascendentes (o jogador sobe rapidamente se parar sobre elas).
- **Inimigos de Elite:**
  - *Lizard King:* Monstro quadrúpede colossal armado com uma alabarda de bronze marinho, capaz de desferir ondas de choque de pressão d'água que atordoam em 360 graus.
  - *Great Bahamut:* Forma titânica do predador de Thalassa com carapaça bioelétrica capaz de descarregar arcos elétricos que atordoam múltiplos alvos.

### 4.5 POI 5: A Arena do Abismo da Colossal Hydra
- **Coordenadas Virtuais:** X: 2100, Y: 2100, Z: -245m.
- **Topografia da Arena de Chefe:**
  - Um anfiteatro natural circular de 140 metros de diâmetro localizado na fossa oceânica mais escura de Thalassa.
  - Chão formado por uma crosta de rocha basáltica negra e areia escura, cercada por 8 fumarolas hidrotermais ativas lançando jatos de água fervente rica em enxofre mineral.
  - Na periferia da arena, pilares naturais de pedra servem de cobertura contra os ataques de sopro d'água supersônico da Hydra.
- **A Colossal Hydra:**
  - Um leviatã anfíbio de três cabeças primárias (com possibilidade de regeneração mística em cabeças adicionais durante fases de fúria).
  - **Fase 1 (A Espreita Abissal):** A Hydra circula nadando na penumbra acima do campo de visão do jogador, disparando rajadas de veneno marinho corrosivo e investidas verticais devastadoras.
  - **Fase 2 (O Maelstrom Hidráulico):** A Hydra ancora sua cauda maciça no centro da arena e gera um redemoinho gigante que puxa todos os jogadores em direção às suas presas, exigindo nado contra a correnteza e esquiva de detritos rochosos.
  - **Fase 3 (Fúria Bioelétrica & Água Fervente):** A criatura ativa suas glândulas dorsais bioelétricas, energizando toda a arena aquática. Os jogadores devem subir nas plataformas de pedra ou usar colunas de bolhas para evitar o contato com a água eletrificada do chão.
- **Recompensas & Drops Lendários:**
  - *Jewel of Chaos, Jewel of Bless, Jewel of Soul.*
  - *Peças do Conjunto Great Dragon, Red Spirit e Dark Soul.*
  - *Coração da Hydra:* Ingrediente alquímico místico para forjar asas de segundo e terceiro nível (Wings of Space-Time / Wings of Illusion).

---

## 5. ILUMINAÇÃO, SHADERS VOLUMÉTRICOS & ATMOSFERA SUBMARINA

```
                Superfície Iluminada (Raios Solares / Sky Sun Light)
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
               ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼   ▼
             \   /   \   /   \   /   \   /   \   /   \   /   \   /
              \ /     \ /     \ /     \ /     \ /     \ /     \ /   <- God Rays / Sun Shafts
               X       X       X       X       X       X       X
              / \     / \     / \     / \     / \     / \     / \
             /   \   /   \   /   \   /   \   /   \   /   \   /   \
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            Padrões Cáusticos Projetados no Solo de Areia e Ruínas
            (Interferência de Ondas Duplas + Dispersão Cromática RGB)
```

### 5.1 Iluminação e Raios Solares Cáusticos (*Underwater Sun Shafts*)
- **Sistema de God Rays Submarinos:**
  - Luz direcional principal inclinada em 65° simulando sol de meio-dia penetrando a água.
  - Raymarching volumétrico com função de fase Henyey-Greenstein ($g = 0.72$), produzindo dispersão frontal realista que faz com que olhar para a superfície crie halos de glória e brilho celestial.
  - As cáusticas são calculadas no shader de água através de mapas Voronoi dinâmicos de onda dupla com fase temporal oposta, projetando redes de luz cintilante de alta intensidade sobre todas as geometrias do fundo marinho.
  - **Dispersão Cromática na Profundidade:**
    - A separação de canais de cor ($R, G, B$) simula o prisma de refração da água marinha, gerando franjas avermelhadas e azuis nas bordas das cáusticas.

### 5.2 Absorção Espectral de Beer-Lambert (Extinção de Comprimento de Onda)
- A água marinha de Thalassa consome a luz de acordo com coeficientes físicos reais:
  $$\beta(\lambda) = [\beta_R, \beta_G, \beta_B]$$
  - Coeficiente de Absorção: Vermelho ($\beta_R = 0.220$), Verde ($\beta_G = 0.045$), Azul ($\beta_B = 0.012$).
  - **Resultado Visual:**
    - A 10m de profundidade, objetos vermelhos perdem 60% da vivacidade.
    - A 40m de profundidade, tons vermelhos e laranjas tornam-se marrons/cinzentos escuros, destacando apenas tons cianos, azuis e esmeraldas.
    - Em -150m, apenas a bioluminescência autônoma emite fótons visíveis no espectro turquesa e bioelétrico.

### 5.3 Flora Marinha Ondulante (*Underwater Foliage Vertex Shader*)
- Algas gigantes (*Kelp Forests*), anêmonas e gorgônias utilizam um shader de deslocamento de vértices procedurais acionado por vetores de correnteza:
  - Ondulação senoidal combinada de baixa frequência para o caule principal somada a ruído de alta frequência para as pontas e folhas finas.
  - Parâmetro `CurrentStrength` e `CurrentDirection` sincronizados com os ciclos de maré do servidor.

### 5.4 Sistema de Partículas de Plâncton & Nve de Bolhas Marítimas
- Emissores volumétricos acoplados à câmera (GPU Particle System):
  - 15.000 partículas microscópicas de "neve marinha" (*Marine Snow*) flutuando suavemente em suspensão com leve turbulência browniana.
  - Partículas de plâncton bioluminescente que acendem um brilho turquesa passageiro quando o jogador ou monstros colidem com o volume de fluido.
  - Emissores de bolhas de cavitação nas pontas das armas, asas e pés dos personagens ao realizar investidas ou feitiços.

---

## 6. TABELA DE SPAWN DE MONSTROS & PROGRESSÃO DE RECOMPENSAS

| Monstro | Nível Sugerido | Profundidade Típica | Comportamento de Combate | Drops Notáveis |
| :--- | :--- | :--- | :--- | :--- |
| **Aranha Marinha (Aqua Worm)** | Lv 45 - 50 | -10m a -40m | Rasteja pelo solo marinho, salta e cospe agulhas de espícula | Armas Básicas (+4/+6), Jewel of Bless (baixa taxa) |
| **Bahamut Pequeno** | Lv 50 - 58 | -20m a -70m | Nado tridimensional rápido, ataque em pinça e flanco | Set Plate, Set Bone, Jewel of Chaos |
| **Vepar Marinheiro** | Lv 58 - 66 | -60m a -120m | Tritão com arpão duplo, golpe de investida e rede paralisante | Set Sphinx, Set Brass, Pendant of Water |
| **Silver Valkyrie** | Lv 65 - 74 | -80m a -150m | Mobilidade vertical aérea/aquática, saraivada de flechas sônicas | Bow of Light, Set Wind, Jewel of Soul |
| **Great Bahamut** | Lv 72 - 82 | -130m a -190m | Tanque blindado marinho, campo bioelétrico de pulso radial | Set Dragon, Set Legendary, Jewel of Life |
| **Lizard King** | Lv 80 - 90 | -150m a -210m | Alabarda de duas mãos, onda de choque sísmica no fundo marinho | Crescent Axe, Dark Breaker, Jewel of Creation |
| **HYDRA (Boss de Thalassa)** | Lv 95+ (Raid/Party) | -245m (Arena do Abismo) | 3 Cabeças, Maelstrom de sucção, veneno corrosivo, feixe bioelétrico | Wing Materials, Armas Chaos, Excelentes +7/+9 |

---

## 7. PAISAGEM SONORA & ÁUDIO ESPACIAL (SOUNDSCAPE)

- **Filtro Passa-Baixas Hidrostático (Low-Pass Filter Dinâmico):**
  - Ao mergulhar, todos os sons do ambiente passam instantaneamente por um filtro passa-baixas em 600 Hz com ressonância aquática suave.
  - Os passos transformam-se em ruídos surdos de areia comprimida e carapaças que estalam suavemente.
- **Sons de Ambiência Orgânica:**
  - O canto distante e hipnótico de baleias titânicas que ecoa pelas fendas rochosas a cada 90 segundos.
  - Estalidos contínuos de milhares de microcamarões nas colônias de corais (*Snapping Shrimp Chorus*).
  - O sibilo borbulhante e o estrépito de vapor das fumarolas hidrotermais nas profundezas vulcânicas.
- **Trilha Sonora Dinâmica:**
  - Instrumentos de percussão aquática (*Waterphones*), harpa de vidro e pads de sintetizadores análogos com modulação em coro líquido, alternando de melodias relaxantes e celestiais na superfície para acordes menores densos, atonais e aterrorizantes ao se aproximar do ninho da Hydra.
