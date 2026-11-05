# DOCUMENTO DE LEVEL DESIGN & WORLD BUILDING: ARQUIPÉLAGO CELESTE DE AETHEL (ICARUS)

> **Projeto:** Dasi (Inspirado no Continent of Legend - MU Online)  
> **Status:** Especificação Técnica & Artística de Level Design (v1.0)  
> **Ambiente:** Arquipélago Celeste de Aethel (*Icarus Reimaginada*)  
> **Público-Alvo:** Level Designers, Environment Artists, Combat Designers e Shaders Developers  

---

## 1. VISÃO GERAL & HIGH CONCEPT DA ZONA

O **Arquipélago Celeste de Aethel** é a mais vertiginosa e sublime província do mundo de Dasi: uma vasta cadeia de ilhas rochosas flutuantes suspensas no éter a milhares de metros acima do manto de nuvens do continente. Alimentadas pelo magnetismo gravitacional de monólitos de *Aetherita* (cristal celeste primordial), essas massas de terra desafiam a gravidade e flutuam em um crepúsculo perpétuo banhado por um sol poente de ouro e carmim (*The Eternal Golden Hour*).

Aethel não possui solo contínuo: abaixo das ilhas e passarelas existe apenas o vácuo infinito com um oceano turbilhonante de nuvens volumétricas douradas e relâmpagos arcanos. **O acesso a Aethel é terminantemente proibido e fisicamente impossível para qualquer ser destituído de asas divinas ou montarias aladas consagradas (Dinorant ou Fenrir Alado)**. Cruzar o portal sem tais relíquias resulta em despencar em queda livre fatal em direção ao abismo sem fim.

Nas ilhas mais altas, onde as tempestades solares tocam a borda do firmamento, reside a criatura mais soberba dos céus de Dasi: o **Fênix das Trevas (Dark Phoenix)**, uma ave colossal de chamas estelares negras e douradas que protege o trono de Aethel.

### 1.1 Identidade Visual & Tom Emocional
- **Paleta de Cores:**
  - *Céu e Atmosfera:* Ouro incandescente (#FFB703), âmbar avermelhado (#FB8500), púrpura crepuscular profundo (#3D0066 / #240046) e azul celeste crepuscular (#126782).
  - *Superfície das Ilhas:* Rocha andesítica cinzenta e branca com veios de mármore translúcido, grama prateada que ondula com o vento cósmico e flores etéreas celestes (#90E0EF).
  - *Pontes e Estruturas Arcanas:* Cristal de luz pura prismática (#E0FAFF) com refração cáustica de arco-íris e ouro polido celestial.
- **Arquitetura Celeste:** Santuários circulares inspirados em planetários antigos, arcos de sustentação de levitação esculpidos com anéis giratórios giroscópicos, obeliscos gravitacionais pulsantes e ruínas de templos dos primeiros deuses celestiais.
- **Atmosfera & Sensação:** Majestade estarrecedora e sublime, vertigem constante pelo abismo sob os pés, sensação de liberdade absoluta pelo voo assistido por asas e pavor diante de ventanias turbulentas e emboscadas aéreas em 360 graus.

---

## 2. MECÂNICAS FUNDAMENTAIS: REQUISITO DE VOO & FÍSICA DO ABISMO

### 2.1 O Portal Celeste & A Barreira da Gravidade Zero
```
               [ JOGADOR SE APROXIMA DO PORTAL CELESTE DE AETHEL ]
                                      │
               ┌──────────────────────┴──────────────────────┐
               │  Possui Asas (Wings Lv1/2/3) ou Dinorant?   │
               └──────────────────────┬──────────────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼ SIM                                 ▼ NÃO
       ┌────────────────────────┐             ┌────────────────────────┐
       │ PERMISSÃO CONCEDIDA    │             │ ACESSO BARRADO / QUEDA │
       │ A gravidade do éter    │             │ O Portal repele com    │
       │ ancora o personagem    │             │ onda de choque ou o    │
       │ no modo voo celestial  │             │ jogador cai no Vácuo   │
       └────────────────────────┘             └────────────────────────┘
```

- **Requisito Mandatório Estrito:**
  - Para atravessar o *Portal de Aethel* (localizado no terraço mais alto de Lost Tower ou na fenda etérea de Devias), o personagem **deve obrigatoriamente estar equipado com:**
    1. *Wings of Fairy / Wings of Heaven / Wings of Satan / Wings of Misery* (Asas Nível 1 ou superiores).
    2. Ou montado em um *Dinorant* de combate com vitalidade intacta.
    3. Ou com Asas Nível 2 / Nível 3 / Mantos de Soberano (*Cape of Lord*).
- **Queda Livre no Abismo Sem Chão (The Infinite Plunge):**
  - Não há "chão invisível" fora das ilhas ou pontes: caso o jogador perca a montaria Dinorant em combate (vida do item reduzida a 0) ou suas asas sofram quebra crítica sem reserva:
    - O personagem perde a sustentação e entra no estado de **Queda Livre Terminal**.
    - A câmera se afasta dramaticamente enquanto o personagem corta nuvens volumétricas a mais de 200 km/h por 4 segundos com efeito sonoro de vento ensurdecedor (*Wind Rush*).
    - Após atingir a camada de nuvens de atrito térmico, o personagem é desintegrado ou resgatado de volta ao santuário inicial pela *Luz de Aethel* sofrendo perda de durabilidade em todos os equipamentos e 5% de penalidade de Zen.

### 2.2 Pontes de Cristal de Luz Arcana (*Light bridges*)
- As ilhas são conectadas por pontes construídas de pura energia fotônica cristalizada:
  - **Física Dinâmica de Balanço:** As pontes oscilam suavemente com a força das rajadas de vento celestiais (implementado no Vertex Shader das pontes via ondas harmônicas de flexão).
  - **Instabilidade Eólica:** Em trechos expostos a ventos laterais severos, os personagens sofrem uma força de arraste vetorial contínua (*Wind Drag*), exigindo correção de rota no direcional para não serem empurrados para a borda.
  - **Efeito Visual Prisma-Reflexivo:** A luz solar do crepúsculo atravessa a ponte gerando reflexos cromáticos dinâmicos na tela (*Screen Space Reflections* e cáusticas de refração cristalina).

### 2.3 Correntes de Ar Ascendentes (*Thermal Uplifts*)
- Colunas cilíndricas verticais de ar e partículas douradas que ligam ilhas de diferentes altitudes:
  - Ao adentrar a coluna com as asas abertas, o jogador é impulsionado verticalmente em trajetória helicoidal ascendente (+40m a +120m) em menos de 3 segundos, atingindo platôs superiores inalcançáveis a pé.

---

## 3. TOPOGRAFIA & MACRO-LAYOUT DO ARQUIPÉLAGO

O Arquipélago Celeste de Aethel estende-se por uma área de **3000m x 3000m** com variação de altitude flutuante de **+1200m a +1850m acima do nível do mar**:

- **Nível A: O Platô de Ancoragem & Santuário do Horizonte (+1200m):** Ponto seguro de chegada com docas aéreas para barcas flutuantes mágicas e os mestres do templo.
- **Nível B: As Ilhas dos Ventos Uivantes (+1320m a +1450m):** Formações rochosas dispersas interligadas por pontes de cristal onde bandos de Alquamos e Mega Crusts patrulham os céus.
- **Nível C: A Espinha dos Dragões Celestes (+1480m a +1620m):** Cadeia de ilhas pontiagudas habitadas pelos Drakans e Phantom Knights, expostas a tempestades solares intermitentes.
- **Nível D: O Pináculo da Criação & O Ninho do Fênix das Trevas (+1750m a +1850m):** Uma colossal ilha de obsidiana estilhaçada em forma de lótus aberta, suspensa no ponto mais alto onde o éter encontra as estrelas.

```
                                  [ O PINÁCULO DA CRIAÇÃO (+1850m) ]
                                  (O Ninho Flamejante do Fênix Negro)
                                                   ▲
                                                   │
                          ┌────────────────────────┴────────────────────────┐
                          │         AS ILHAS DOS CAVALEIROS ESPECTRAIS       │
                          │        (Phantom Knights, Drakans de Tempestade) │
                          └────────────────────────┬────────────────────────┘
                                                   │
                                                   ▼
                          ┌─────────────────────────────────────────────────┐
                          │         A ESPINHA DOS DRAGÕES CELESTES          │
                          │   (Pontes de Cristal Instáveis, Queen Rainier)  │
                          └────────────────────────┬────────────────────────┘
                                                   │
                                                   ▼
                          ┌─────────────────────────────────────────────────┐
                          │            AS ILHAS DOS VENTOS UIVANTES         │
                          │       (Alquamos Alados, Mega Crusts, Nuvens)    │
                          └────────────────────────┬────────────────────────┘
                                                   │
                                                   ▼
    [ DOCAS DAS BARCAS AÉREAS ]           ┌─────────────────┐          [ TORRE DOS ASTRÔNOMOS ]
    (Comércio Celeste & Armazém) ◄────────┤  PLATÔ CENTRAL  ├────────► (Altar de Reparação
                                          │   DE ANCORAGEM  │           de Asas & Bênçãos)
                                          │ (Safe Zone)     │
                                          └────────┬────────┘
                                                   │
                                                   ▼
                                      [ PORTAL CELESTE DE TRANSIÇÃO ]
                                      (Chegada de Lost Tower / Devias)
```

---

## 4. ZONEAMENTO DETALHADO (POINTS OF INTEREST - POIs)

### 4.1 POI 1: O Platô de Ancoragem (Safe Zone de Aethel)
- **Coordenadas Virtuais:** X: 1500, Y: 1500, Z: +1220m.
- **Atmosfera & Estrutura:**
  - Uma ilha circular com pavimentação em mármore branco leitoso cercada por uma balaustrada dourada encantada contra quedas acidentais.
  - Quatro obeliscos de cristal azul canalizam um campo de repulsão suave que estabiliza o vento na praça central, permitindo fogueiras de incenso perfumado.
  - Pequenas barcas aéreas de mogno e ouro atracadas em mastros de ancoragem flutuantes com bandeiras de seda tremulando contra o pôr do sol.
- **Serviços & NPCs Especializados:**
  - *Arquimago Caelus (Guardião das Asas):* NPC exclusivo capaz de restaurar a durabilidade de asas com *Jewel of Bless* e craftar as cobiçadas *Asas Nível 2 e Nível 3*.
  - *Mestre Montador Zephyr:* Cura e restaura a vitalidade de Dinorants feridos e vende *Rações de Éter* que aumentam temporariamente a velocidade de voo.
  - *Baú Celestial dos Viajantes:* Acesso direto ao inventário global através de um cofre flutuante mantido por espíritos do vento.

### 4.2 POI 2: As Pontes de Cristal de Luz & O Desfiladeiro dos Alquamos
- **Coordenadas Virtuais:** X: 1800, Y: 1350, Z: +1350m.
- **Experiência de Travessia Vertiginosa:**
  - Uma sucessão de três pontes suspensas formadas por placas de luz sólida translúcida que emitem um zumbido harmônico etéreo ao serem pisadas.
  - A névoa dourada abaixo se abre em clarões ocasionais, permitindo entrever as montanhas minúsculas de Lorencia e Noria no mundo mortal muito abaixo.
- **Monstros Voadores em Enxame:**
  - *Alquamo:* Criaturas aéreas insectóides semelhantes a mantas voadoras com lâminas de quitina nas bordas das asas. Atacam em bandos de 4 a 6 membros, mergulhando em rasantes coordenados sobre a ponte.
  - *Mega Crust:* Monstros crustáceos alados de grande massa que tentam golpear o solo das pontes para derrubar os guerreiros com ondas de choque oscilantes.

### 4.3 POI 3: O Cânion das Fendas de Éter & O Reino das Rainhas Rainier
- **Coordenadas Virtuais:** X: 1200, Y: 1750, Z: +1490m.
- **Mecânicas de Navegação Aérea:**
  - Ilhas pontiagudas separadas por distâncias intransponíveis a pé. Os guerreiros precisam usar jatos térmicos verticais (*Thermal Uplifts*) e planejar com suas asas entre as plataformas para cruzar a fenda.
  - Grandes pedras de Aetherita flutuam no vácuo entre as ilhas, girando lentamente em seus próprios eixos e servindo como plataformas móveis de descanso.
- **Predadores Elementais:**
  - *Queen Rainier:* Entidades insectóides gigantes com asas transparentes semelhantes a libélulas espectrais. Disparam dardos de espinho de luz e possuem a habilidade de conjurar redemoinhos de vento que desestabilizam o voo dos jogadores.
  - *Drakan:* Humanóides draconianos alados envoltos em escamas vermelhas cintilantes, empunhando lanças pesadas e cuspindo cones de fogo crepuscular concentrado.

### 4.4 POI 4: O Caminho dos Cavaleiros Espectrais (*Phantom Way*)
- **Coordenadas Virtuais:** X: 2200, Y: 2200, Z: +1680m.
- **Atmosfera de Ruína Épica:**
  - Os restos de um antigo palácio suspenso que foi partido ao meio durante a guerra celestial. Muros góticos arruinados flutuam em pedaços conectados por arcos de eletricidade estática.
  - Relâmpagos de plasma estelar riscam os céus arroxeados, carregando as armas dos jogadores com estática luminescente.
- **Inimigo de Elite:**
  - *Phantom Knight:* Antigos campeões alados cujos espíritos foram corrompidos pela radiação do vácuo. Portam espadas de energia arcana bifacetadas, desferem estocadas na velocidade da luz e usam a habilidade *Heavenly Slash*, criando ondas de corte que varrem toda a extensão das plataformas.

### 4.5 POI 5: O Ninho do Fênix das Trevas (Dark Phoenix Boss Arena)
- **Coordenadas Virtuais:** X: 2500, Y: 2500, Z: +1820m.
- **A Arena do Firmamento:**
  - Uma ilha colossal de vidro vulcânico negro (*Obsidiana Cósmica*) em formato de corola de flor com 160 metros de diâmetro.
  - As pétalas de rocha sobressaem para o vazio, criando um parapeito onde o vento uiva furiosamente.
  - No centro repousa um cratera de cinzas douradas de onde emana uma coluna perpétua de chamas negras frias.
- **O Fênix das Trevas (Dark Phoenix):**
  - O ápice da hierarquia alada do continente de Dasi. Uma ave mitológica colossal com envergadura de mais de 35 metros, penas que ardem em fogo negro estelar e olhos de ouro puro.
  - **Fase 1 (O Voo do Crepúsculo):** O Fênix bombardeia a arena com chuvas de meteoros de chamas escuras (*Dark Star Rain*), obrigando os jogadores a voar constantemente entre as pétalas da arena para esquivar das áreas de impacto incineradas.
  - **Fase 2 (As Garras da Ruína):** Desce com um mergulho supersônico no centro da arena gerando uma onda de choque expansiva (*Solar Flare Pulse*). Qualquer jogador no solo é arremessado em direção à borda do abismo; o combate corpo a corpo exige timing perfeito de contra-ataque aéreo.
  - **Fase 3 (Renascimento Cósmico / Dark Egg Eclipse):** Ao chegar a 0% de HP pela primeira vez, o Fênix se encerra em um Ovo Estelar cercado por 4 pilares de chamas. Se os jogadores não destruírem os pilares em 30 segundos, o Fênix renasce em modo *Berserk* com velocidade de ataque dobrada e tempestades de plasma contínuas.
- **Recompensas & Drops Lendários:**
  - *Penas de Fênix (Loch's Feather):* O lendário ingrediente obrigatório para a criação de Asas Nível 2 / Nível 3 na Máquina do Caos.
  - *Jewel of Creation, Jewel of Soul, Jewel of Chaos.*
  - *Conjuntos de Armadura High-End:* Peças dos conjuntos *Dark Soul, Great Dragon, Holy Storm e Red Spirit*.
  - *Armas de Elite:* *Archangel Blade, Chaos Dragon Axe e Celestial Bow*.

---

## 5. ILUMINAÇÃO, VOLUMETRIC CLOUDS & RENDERIZAÇÃO ATMOSFÉRICA

```
                   Sol Poente Dourado / Crepúsculo (Low-Angle Sun)
                                 \  \  \  \  \  \
                                  \  \  \  \  \  \
               [ ILHA FLUTUANTE DE OBSIDIANA E MÁRMORE CELESTE ]
                  │        │                        │        │
      ============╪════════╪========================╪════════╪=============
      Passarela de Luz Cristalina (Refração Prismática & Balanço Dinâmico)
      =====================================================================
                  │        │                        │        │
               [ ABISMO SEM FIM - MAR DE NUVENS VOLUMÉTRICAS ]
                ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
                 (Raymarched Clouds com Iluminação Solar Ouro)
```

### 5.1 O Mar de Nuvens Volumétricas (*Raymarched Cloudscape*)
- **Renderização de Nuvens Volumétricas em Tempo Real:**
  - Camada de nuvens densa situada a +900m (300m abaixo do nível mínimo habitável do mapa).
  - Raymarching otimizado com perfil temporal de ruído 3D Perlin-Worley simulando cúmulos-estratos revoltos.
  - Dispersão de luz solar volumétrica com espalhamento Mie acentuado: quando a câmera olha em direção ao horizonte poente, as bordas das nuvens brilham em ouro incandescente e bronze derretido.
  - Relâmpagos internos silenciosos piscam no interior do mar de nuvens a intervalos estocásticos, iluminando as camadas inferiores em roxo e azul-cobalto.

### 5.2 O Crepúsculo Eterno & Atmosfera de Alta Altitude
- **Gradiente Atmosférico de Alta Densidade:**
  - Zenith (topo do céu): Azul-marinho profundo quase espacial, permitindo entrever constelações e nebulosas no zênite mesmo durante o crepúsculo.
  - Horizonte Solar: Laranja tangerina vibrante mesclado com ouro puro e tons de sangue de dragão.
- **Exposição & Efeito de Lente Celestial:**
  - Bloom anamórfico e reflexos de lente (*Sun Glare*) de alta precisão ao focar diretamente no astro solar poente.
  - Oclusionismo ambiental do horizonte que projeta sombras ciclópicas das ilhas flutuantes sobre o mar de nuvens abaixo.

### 5.3 Shaders das Pontes de Luz de Cristal
- **Material de Luz Translúcida Refrecente:**
  - Efeito Fresnel intensificado com difusão especular anisotrópica simulando a refração interna em quartzo puro.
  - *Vertex Deformation:* Simulação de flexão sob ventania através de equação de onda harmônica:
    $$Z_{offset} = \sin(t \cdot \omega + x \cdot k) \cdot A \cdot \left(\frac{x}{L}\right)\left(1 - \frac{x}{L}\right)$$
    garantindo que as extremidades da ponte permaneçam fixas nos pilares de rocha enquanto o centro balança suavemente de acordo com a velocidade do vento.

---

## 6. TABELA DE SPAWN DE MONSTROS & PROGRESSÃO DE RECOMPENSAS

| Monstro | Nível Sugerido | Altitude / Localização | Estilo de Combate | Drops Notáveis |
| :--- | :--- | :--- | :--- | :--- |
| **Alquamo** | Lv 75 - 80 | +1250m a +1380m (Ilhas Iniciais) | Rasantes rápidos em bando, cortes laterais com asas de lâmina | Armas Celestiais (+4/+6), Jewel of Bless |
| **Mega Crust** | Lv 80 - 86 | +1300m a +1450m (Pontes de Luz) | Impacto de solo pesado, carapaça de alta armadura física | Peças Set Plate/Brass +7, Jewel of Chaos |
| **Queen Rainier** | Lv 85 - 92 | +1420m a +1580m (Fendas de Éter) | Distância mágica, dardos de luz, redemoinhos de repulsão | Jewel of Soul, Bow of Celestia, Set Wind +7 |
| **Drakan** | Lv 90 - 98 | +1500m a +1680m (Espinha Celeste) | Investidas aéreas pesadas, sopro de fogo de curto alcance | Peças Set Dragon/Legendary, Crest of Monarch |
| **Alpha Crust** | Lv 95 - 102 | +1600m a +1740m (Platôs Superiores)| Versão blindada titânica com espinhos refletores de dano | Joias de Bless/Soul, Armas Chaos |
| **Phantom Knight** | Lv 100 - 110 | +1650m a +1780m (Phantom Way) | Teleporte rápido no ar, combos de espada de longo alcance | Peças Dragon Soul, Great Dragon, Jewel of Life |
| **DARK PHOENIX (Chefe Supremo)** | Lv 115+ (Raid/Party)| +1820m (Pináculo da Criação) | Chuva de estrelas escuras, sopro cósmico, renascimento em ovo | **Loch's Feather**, Asas High-End, Armas Arcanjo |

---

## 7. PAISAGEM SONORA & TRILHA CELESTIAL (SOUNDSCAPE)

- **Design de Vento de Alta Altitude:**
  - Som contínuo e majestoso de vento puro e rarefeito modulado dinamicamente pela velocidade de movimento do personagem.
  - Asas em movimento emitem um ruído característico: o sussurro de penas celestiais para as asas de fada, o estalar de membranas demoníacas para as asas de Satã e o zumbido supersônico e harmônico para as Asas Nível 3.
- **Trilha Sonora Dinâmica:**
  - Sintetizadores atmosféricos celestiais, coros masculinos e femininos líricos em língua antiga cantando em polifonia, trompas celestes em tom triunfante e harpas orquestrais nos momentos de contemplação nas bordas das ilhas.
  - Na arena do Fênix das Trevas, a trilha evolui para percussões orquestrais pesadas, violinos rápidos em staccato e coral dramático apocalíptico que culmina durante a fase do renascimento cósmico.
