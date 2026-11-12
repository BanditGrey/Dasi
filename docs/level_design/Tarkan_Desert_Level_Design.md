# DOCUMENTO DE LEVEL DESIGN & WORLD BUILDING: TARKAN (O DESERTO DE CINZAS DE KAR-DUNE)

> **Projeto:** Dasi (Continent of Legend Reimagined)  
> **Status:** Especificação Técnica & Artística de Level Design (v1.0)  
> **Ambiente:** O Deserto Escaldante de Cinzas & Ossadas Fossilizadas (*Tarkan*)  
> **Material Canônico de Estudo:** `reference/mu_roxgaming_5.2/client/Data/World9/` (EncTerrain9.att, EncTerrain9.obj)  
> **Modelo 3D GLB:** [`prototypes/3d_scenery/tarkan_desert.glb`](file:///d:/Dasi/prototypes/3d_scenery/tarkan_desert.glb)  
> **Público-Alvo:** Level Designers, Environment Artists, Lighting Artists, Technical Shaders e Programadores de IA de Monstros  

---

## 1. VISÃO GERAL & HIGH CONCEPT DA ZONA

O **Tarkan (O Deserto de Cinzas de Kar-Dune)** é o deserto implacável e inóspito de Dasi. Situado além das cordilheiras de Lorencia e Atlans, Tarkan é uma imensidão de areias avermelhadas e ocres varrida por ventos abrasivos constantes. O deserto é pontilhado pelos restos de uma era esquecida: fósseis ciclópicos de vermes e leviatãs do deserto, e ossadas mecânicas de titãs autômatos de guerra cuja tecnologia foi engolida pelas areias móveis.

```
                      [ ENTRADA DAS CARAVANAS DE ATLANS / LORENCIA ]
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │  TAR_01: DUNAS CARMESIM & MÁQUINAS SOTERRADAS    │
                  │  (Ponto de Chegada, Engrenagens de Guerra)       │
                  └─────────────────────────┬────────────────────────┘
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │  TAR_02: OÁSIS DA MIRAGEM FERVENTE               │
                  │  (Lago Sulfúrico Borbulhante, Cactos de Ferro)   │
                  └─────────────────────────┬────────────────────────┘
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │  TAR_03: DESFILADEIRO DA ESPINHA DO DESERTO      │
                  │  (Arcos de Costelas Fóssil de Leviatã, Penhascos)│
                  └─────────────────────────┬────────────────────────┘
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │  TAR_04: CEMITÉRIO DAS RODAS DE FERRO            │
                  │  (Rodas Mecânicas Gigantes de Autômatos, Ferro)  │
                  └─────────────────────────┬────────────────────────┘
                                            │
                                            ▼
                  ┌──────────────────────────────────────────────────┐
                  │  TAR_05: CRATERA DE AREIA MOVEDIÇA DE ZAIKAN     │
                  │  (Arena de Chefe do Escorpião Titânico Zaikan)   │
                  └──────────────────────────────────────────────────┘
```

### 1.1 Identidade Visual & Tom Emocional
- **Paleta de Sensações:** Isolamento opressivo, calor escaldante abrasivo, mistério arqueológico colossal e perigo imprevisível emergindo das dunas.
- **Arquitetura & Elementos Naturais:** Dunas de areia fina de coloração ocre-avermelhada (`#991b1b` a `#d97706`), penhascos escarpados de arenito vermelho sedimentar com estratificação visível, ossadas fossilizadas de cor marfim gasta pelo vento e carcaças mecânicas de ferro forjado de autômatos soterrados.
- **Contraste de Iluminação:** Luz solar direta ofuscante de 5800K com sombras afiadas, intercalada por frentes volumétricas de poeira dourada e tempestades de areia que transformam o horizonte em uma névoa densa de cor âmbar.

---

## 2. TOPOGRAFIA & GEOGRAFIA DAS DUNAS

O mapa de Tarkan cobre **2048m x 2048m** caracterizado por ondulações contínuas de dunas móveis:
- **Platô Superior das Caravanas (+35m a +50m):** Ventos de alta velocidade, dunas em crista de foice (barcanas) com declives acentuados de até 32°.
- **As Baixadas da Bacia Sulfúrica (+10m a +25m):** Lagos de águas termais sulfúricas borbulhantes a 90°C com depósitos minerais de sal e enxofre amarelo.
- **O Desfiladeiro da Espinha do Leviatã (+0m a +15m):** Cânion de arenito vermelho escavado pela erosão eólica, ladeado por penhascos verticais de 25m de altura.
- **A Cratera de Zaikan (-12m a +0m):** Depressão circular gigante em cone provocada por redemoinhos de areia movediça e escavações do monstro supremo.

---

## 3. ZONEAMENTO DETALHADO & OS 5 CENÁRIOS CANÔNICOS

### 3.1 `TAR_01` — Tarkan Dunes: Dunas Carmesim & Máquinas Soterradas
- **Dimensão:** $46\times42\text{ m}$ (Área de Chegada Segura)
- **POIs Centrais:**
  - **As Três Engrenagens Titânicas:** Rodas dentadas de ferro fundido de 5 metros de diâmetro semienterradas no cume de uma duna, cobertas de pátina de ferrugem e areia.
  - **Tenda de Campanha do Mestre dos Mercadores:** Toldo de lona espessa amarrado a ossos fossilizados com estacas de ferro, oferecendo água e reparo de armaduras.
  - **Marco de Pedra de Kar-Dune:** Monólito de arenito esculpido marcando o início da zona hostil.
- **Colisores Físicos:**
  - 3 engrenagens colossais: Cilíndricos inclinados $r=2.5\text{ m}$, espessura $0.8\text{ m}$.
  - Tenda do acampamento: Caixa $4.0\times3.5\text{ m}$, $h=3.0\text{ m}$.

### 3.2 `TAR_02` — Tarkan Oasis of Boiling Mirage (Oásis da Miragem Fervente)
- **Dimensão:** $40\times40\text{ m}$
- **POIs Centrais:**
  - **O Lago Sulfúrico Fervente:** Lagoa circular de água borbulhante de tom esmeralda-ácido que expele jatos de vapor contínuos.
  - **Cactos de Ferro Negro:** Vegetação xerófita cristalizada com espinhos de metal negro que causam dano leve por sangramento se o jogador colidir.
  - **Efeito de Miragem Térmica (*Heat-Haze*):** Distorção atmosférica permanente sobre a superfície da água que desfoca a silhueta dos monstros ao longe.
- **Colisores Físicos:**
  - Lago sulfúrico: Cilíndrico $r=3.5\text{ m}$ (área intransponível de dano térmico contínuo).
  - 4 cactos de ferro gigantes: Cilíndricos $r=0.6\text{ m}$, $h=3.5\text{ m}$.

### 3.3 `TAR_03` — Tarkan Leviathan Spine Ridge (Desfiladeiro da Espinha do Deserto)
- **Dimensão:** $48\times36\text{ m}$
- **POIs Centrais:**
  - **A Catedral de Costelas:** Série de 6 arcos de costelas fossilizadas de um leviatã pré-histórico medindo 7 metros de altura cada, formando uma nave gótica natural sobre a passagem estreita.
  - **Vértebra Gigante Escavada:** Bloco fóssil maciço no centro servindo de ponto de emboscada para monstros subterrâneos.
  - Penhascos íngremes de arenito com fendas estreitas.
- **Colisores Físicos:**
  - 6 arcos de costelas fossilizadas: Tubulares curvos com bases rígidas de $r=0.5\text{ m}$ em $x=\pm4.5\text{ m}$.
  - Paredes do desfiladeiro: Barreiras de rocha intransponíveis ao longo das bordas laterais.

### 3.4 `TAR_04` — Tarkan Iron Wheel Scrapyard (Cemitério das Rodas de Ferro)
- **Dimensão:** $44\times40\text{ m}$
- **POIs Centrais:**
  - Antigo campo de batalha onde 6 autômatos blindados *Iron Wheel* sucumbiram, deixando suas carcaças com lâminas circulares afiadas expostas na areia.
  - Pistões hidráulicos gigantes partidos e engrenagens estalando ao vento.
  - Fissura tectônica de onde brotam vapores secos e poeira vermelha.
- **Colisores Físicos:**
  - 6 rodas mecânicas laminadas: Cilíndricos rígidos $r=1.8\text{ m}$, espessura $0.8\text{ m}$.
  - Destroços de autômatos: 4 caixas rígidas de $2.0\times2.0\text{ m}$.

### 3.5 `TAR_05` — Tarkan Zaikan's Sand Crater (Arena do Flagelo Zaikan)
- **Dimensão:** $44\times44\text{ m}$ (Arena de Chefe Circular)
- **POIs Centrais:**
  - **O Olho da Areia Movediça:** Centro da cratera com redemoinho cônico de areia líquida de 4m de diâmetro de onde Zaikan (quimera titânica escorpião-humanoide) emerge com explosões sísmicas.
  - **4 Obeliscos de Arenito Ancestrais:** Pilares naturais esculpidos pelo vento nos cantos da arena que Zaikan pode estilhaçar durante investidas com suas pinças de titânio.
  - **Bordas Escarpadas da Cratera:** Duna íngreme circular intransponível que cerca a arena com 4m de altura.
- **Colisores Físicos:**
  - Borda circular da cratera: Colisor de limite radial intransponível $r=21.0\text{ m}$.
  - 4 obeliscos de arenito: Cilíndricos $r=1.1\text{ m}$, $h=6.5\text{ m}$.
  - Centro da areia movediça: Cilíndrico $r=2.2\text{ m}$ com redução drástica de velocidade de deslocamento.

---

## 4. ILUMINAÇÃO, SHADERS E EFEITOS ATMOSFÉRICOS AAA

1. **Shader de Areia Dinâmica e Pegadas:**
   - Textura PBR com Roughness 0.92, micro-facetas de quartzo com brilho especular sutil simulando reflexo solar em grãos secos.
   - Mapa de deslocamento (*Runtime Virtual Texture / Tessellation*) que registra sulcos e pegadas dos personagens e arrasto das caudas dos escorpiões.
2. **Tempestade de Areia & Névoa de Poeira:**
   - 600 partículas de poeira dourada suspensas (`#fbbf24`) impulsionadas por vetor de vento dinâmico a 14 m/s.
   - Densidade de névoa volumétrica que oscila dinamicamente entre 0.02 (dia claro com calor ofuscante) e 0.14 (tempestade de areia severa com visibilidade reduzida a 8 metros).
3. **Efeito Óptico de Miragem Térmica (Heat Haze):**
   - Shader de pós-processamento com distorção de refração senoidal rápida nas faixas horizontais próximas ao solo, simulando gradiente térmico de 50°C.

---

## 5. BESTIÁRIO E HIERARQUIA DE PROGRESSÃO (NÍVEL 90-130)

| Inimigo | Nível | Tipo | Arquétipo de Combate | Drop Notável |
| :--- | :---: | :--- | :--- | :--- |
| **Mutant** | 90-96 | Quimera Humanoide | Guerreiro ágil do deserto com lâminas de braço e esquiva lateral rápida. | Black Dragon Helm, Great Golden Bow |
| **Bloody Wolf** | 97-103 | Fera do Deserto | Lobo carnívoro avermelhado com salto em matilha e hemorragia. | Dark Soul Boots, Chaos Jewel |
| **Iron Wheel** | 104-110 | Autômato Bélico | Monstro mecânico em formato de roda cortante com investida giratória contínua. | Dark Phoenix Gloves, Bless Jewel |
| **Tantalos** | 111-118 | Centauro Guerreiro | Centauro armado com montante de ferro negro e golpe de fenda telúrica. | Dark Phoenix Armor, Soul Jewel |
| **Beam Knight** | 119-125 | Construto Mágico | Guerreiro arcano blindado com canhão laser peitoral de energia de plasma ciano. | Thunder Hawk Boots, Creation Jewel |
| **Zaikan (Chefe Mundial)** | **130** | Flagelo das Areias | Quimera colossal escorpião-humanoide de 8m com pinças titânicas, ferrão de veneno neurotóxico e tempestade de meteoros de areia ardente. | Dark Phoenix Set +9, Archangel Crossbow, Creation Jewel, Soul Jewel |
