# ILUMINAÇÃO LUMEN, ATMOSFERA & VOLUMES DE ÁGUA: LORENCIA

> **Projeto:** Dasi (Continent of Legend Inspired MMORPG)  
> **Motor Gráfico:** Unreal Engine 5.4+ (Lumen Global Illumination & Hardware Ray Tracing)  
> **Mapa:** `Content/Maps/Lorencia/Lorencia_Main.umap`  
> **Arquitetura Visual:** Renderização 100% 3D Nativa (Nanite, malhas físicas PBR, simulação de fluidos, névoa volumétrica e áudio espacial). As imagens e conceitos visuais do Continent of Legend clássico atuam estritamente como referências artísticas e de atmosfera.

---

## 1. SISTEMA DE ILUMINAÇÃO GLOBAL LUMEN & ATMOSFERA

### 1.1 Sol Chuvoso: Directional Light (`LightSource_OvercastSun`)
- **Papel:** Simula um disco solar difuso tentando transpassar camadas pesadas de nuvens nimbostratus e stratocumulus em um fim de tarde úmido e chuvoso.
- **Parâmetros Técnicos:**
  - **Intensidade Luminosa:** `28.000 Lux` (overcast daylight de baixa intensidade).
  - **Temperatura de Cor:** `5200 K` (balanço de branco ligeiramente frio, quebrado pelo tom âmbar das tochas urbanas).
  - **Ângulo Solar:** Inclinação de `42°` em relação ao horizonte (`Pitch: -42.0°`, `Yaw: 135.0°`, incidência de Noroeste para Sudeste).
  - **Source Angle:** `3.5°` (disco de sol altamente suavizado por difração atmosférica de gotículas d'água).
  - **Volumetric Scattering Intensity:** `1.85` (geração de feixes crepusculares volumétricos - *God Rays* - entre brechas de nuvens e frestas da muralha).
  - **Cast Cloud Shadows:** `True` (nuvens volumétricas em movimento projetam sombras dinâmicas no terreno).
  - **Dynamic Shadow Distance (Movable Light):** `25.000 cm` com `4 Cascade Shadow Maps` e distribuição exponencial `3.2` para transições imperceptíveis.

### 1.2 Luz do Céu Dinâmica: SkyLight com DFAO (`SkyLight_DynamicLumen`)
- **Papel:** Preenchimento indireto de luz ambiente com oclusão em cavidades rochosas e ranhuras de armaduras.
- **Modo:** `Real-Time Capture` acoplado ao `SkyAtmosphere` e nuvens volumétricas.
- **Lumen Global Illumination:**
  - Bounce Intensity: `1.0` (Lumen gera rebatimento físico múltiplo em todas as superfícies 3D, iluminando naturalmente as arcadas da praça).
  - Max Roughness: `0.65`.
- **Distance Field Ambient Occlusion (DFAO):**
  - Occlusion Max Distance: `1200 cm`
  - Occlusion Contrast: `1.25` (acentua o contato entre rochedos, pés de tendas e o barro do chão, eliminando a sensação de objetos "flutuando").

### 1.3 Sky Atmosphere (Céus de Lorencia)
- **Transform Mode:** `Planet Top at Absolute World Origin` (Raio do planeta: 6360 km).
- **Rayleigh Scattering:** `(R: 0.085, G: 0.075, B: 0.065)` com escala `0.045` (espalhamento característico de atmosfera úmida e saturada de partículas continentais).
- **Mie Scattering:** `(R: 0.022, G: 0.020, B: 0.018)` com escala `0.009` e anisotropia `0.78` (forte dispersão frontal ao redor do sol chuvoso).
- **Multi-Scattering:** `0.85` (ilumina o lado escuro das nuvens sem queimar pretos absolutos).

### 1.4 Exponential Height Fog & Névoa Volumétrica Rasteira (`Fog_LorenciaGroundMist`)
- **Papel:** Névoa espessa que se acumula nas depressões do cemitério, fosso e baixadas pantanosas.
- **Configuração de Elevação:**
  - **Fog Height Falloff:** `0.0035` (restringe 80% da massa de névoa abaixo da cota `Z = 2500 cm` / 25 metros de altura).
  - **Fog Density:** `0.038`.
  - **Inscattering Color:** `(R: 0.22, G: 0.20, B: 0.19, A: 1.0)` (tom grafite chuvoso).
- **Volumetric Fog Ativado:**
  - **Scattering Distribution (Phase G):** `0.68` (proporciona reflexos volumétricos nas luzes das tochas de rua).
  - **Albedo:** `(R: 0.72, G: 0.70, B: 0.68)`
  - **Extinction Scale:** `2.2` por metro cúbico.
  - **Distance Limit:** `18.000 cm` (180 metros) para foco total na densidade local sem poluir o desfiladeiro distante.

---

## 2. VOLUMES DE ÁGUA NATIVOS 3D (UE5 WATER SYSTEM)

Toda a água de Lorencia é gerada por malhas de água volumétricas 3D com física de flutuabilidade, reflexões Lumen em tempo real, refração com IOR 1.333 e absorção por profundidade (*Beer-Lambert Law*).

```
                         [ FONTE DO ARCANJO ]
                       Bacia Octogonal (12m x 80cm)
                    Água Pura, IOR 1.333, Azul-Celeste
                                   ▲
                                   │
                                   │
                    [ FOSSO DO CASTELO DE LOREN ]
                    Largura 16m, Profundidade 4m
                Lodo Castanho-Oliva, Turvo, Estacas 3D
                                   │
                                   ▼
                   [ CHARCOS PANTANOSOS DO SUL ]
                    Baixadas Inundadas (0m a +3m)
               Lama Viscosa, Folhas Flutuantes, Juncos
```

### 2.1 `WaterBody_CastleMoat` (Fosso do Castelo de Loren)
- **Localização:** Contorna o perímetro da Cidadela em `Z = 1400.0 cm`.
- **Topologia:** Anel poligonal de canal fechado com largura média de `1600 cm` (16m) e profundidade de `400 cm` (fundo do fosso em `Z: 1000.0 cm`).
- **Propriedades Físicas e Ópticas:**
  - **Water Surface Material:** `M_Water_CastleMoat`
  - **Turbidez & Absorção:** Alto teor orgânico (lodo acumulado). Coeficiente de extinção: `(R: 0.18, G: 0.14, B: 0.28)` gerando tom castanho-oliva turvo ao olhar na diagonal.
  - **Ondulação de Superfície:** Ressonância com o vento de Lorencia (`WindStrength: 14.5 km/h`, pequenas cristas capilares com frequência de `0.35m`).
  - **Interação Submersa:** Vegetação aquática 3D (algas longas e juncos) com colisão de física flexível e estacas de madeira pontiagudas defensivas que causam dano por empalamento se um jogador cair fora da ponte.

### 2.2 `WaterBody_ArchangelFountain` (Bacia da Fonte da Praça)
- **Localização:** Centrada na Praça Central `(X: 0.0, Y: 0.0, Z: 1845.0)`.
- **Topologia:** Prisma cilíndrico octogonal com raio de `540 cm` e profundidade de `80 cm`.
- **Propriedades Físicas e Ópticas:**
  - **Water Surface Material:** `M_Water_ArchangelFountain`
  - **Pureza & Transparência:** Água translúcida com claridade de montanha; coeficiente de absorção mínimo com espalhamento volumétrico azul-celeste místico (`Scattering: #38bdf8`).
  - **Normal Perturbation:** Perturbação circular gerada pela cascata de água contínua caindo do jarro do Arcanjo no centro, criando anéis radiantes perpétuos.
  - **Partículas Místicas:** Sistema Niagara `NS_FountainMotes` emitindo pequenas esferas translúcidas de luz que sobem suavemente e evaporam no ar.

### 2.3 `WaterBody_SwampPuddles` (Charcos Pantanosos das Baixadas do Sul)
- **Localização:** Depressões do terreno ao sul da ponte levadiça `(X: -25000 a +25000, Y: -25000 a -50000, Z: 250.0)`.
- **Topologia:** Corpos d'água rasos com profundidade entre `20 cm` e `70 cm` moldados diretamente pelas curvas de nível do terreno.
- **Propriedades Físicas e Ópticas:**
  - **Water Surface Material:** `M_Water_Swamp`
  - **Reflexão Espelhada:** Em clima calmo, atua como espelho d'água refletindo as nuvens de chumbo via Lumen; durante tempestades, acopla o gerador de ondas e anéis concêntricos do `MF_DynamicWeather_Include.ush`.
  - **Decals de Detritos:** Malhas e decals 3D de folhas mortas e juncos encharcados flutuando na superfície.

---

## 3. VOLUMES DE ÁUDIO & TRANSIÇÃO ACÚSTICA (THE HEARTH TAVERN)

O som em Dasi é tratado como elemento físico de imersão. Ao cruzar os portais da Taverna da Lareira Dourada, o jogador experimenta uma transição suave e gradual (*Crossfade & Filtering*) que isola o caos tempestuoso do mundo selvagem.

### 3.1 `AudioVolume_Tavern_Hearth`
- **Geometria:** Caixa de `2500 x 3300 x 1250 cm` cobrindo o interior da taverna com margem de transição suave (*Fade Margin*) de `150 cm` nas portas.
- **Submix Effects & Roteamento:**
  - **Submix Master Clima Exterior:** Ao entrar no volume, o sinal de áudio da tempestade (vento uivante e chuva estalando em telhados) é roteado para um `SubmixEffect_LowPassFilter`.
  - **Cutoff Frequency:** `450.0 Hz` com inclinação de `12 dB/oitava` (os sons agudos da chuva viram um som surdo e reconfortante do lado de fora).
  - **Atenuação de Volume Exterior:** Ganho reduzido em `-22.0 dB`.
- **Reverb Interior (`ReverbEffect_MedievalTavern`):**
  - **Decay Time:** `1.45 segundos`
  - **Reflections Delay:** `25 ms`
  - **Diffusion:** `0.85` (vigas de carvalho e tapeçarias absorvem reflexões agudas).
  - **High Cutoff:** `3200 Hz`.
- **Áudio Ambiente Ativo:**
  - `Cue_Hearth_FireCrackle`: Som 3D espacializado posicionado no nicho da lareira com curvas de atenuação por raio (12m máximo).
  - `Cue_Tavern_Murmur_Lute`: Trilha sutil de alaúde renascentista e sussurros de canecas e dados.

---

## 4. PÓS-PROCESSAMENTO & CALIBRAÇÃO DE TONE-MAPPER

### 4.1 `PostProcessVolume_LorenciaGlobal` (Exterior)
- **Modo:** `Unbound` (cobre todo o mapa de 2048m x 2048m).
- **Auto-Exposição (Lumen Calibrated):**
  - Modo: `AEM_Manual` (Exposição fixada para manter estabilidade visual sem oscilações bruscas).
  - Camera EV100: `10.5`
- **Bloom:**
  - Modo: `BM_FFT` (Convolução de abertura para flares realistas de tochas de muralha e feixes de joias).
  - Intensity: `1.65`
  - Threshold: `1.20`
- **Color Grading & Film:**
  - Color Saturation: `(R: 0.82, G: 0.80, B: 0.78, W: 1.0)` (desnaturação intencional de atmosfera gótica).
  - Color Contrast: `(R: 1.08, G: 1.06, B: 1.04, W: 1.0)`
  - Slope: `0.88`, Toe: `0.55` (preservação de detalhes em sombras escuras sem esmagar para cinza lavado).

### 4.2 `PostProcessVolume_TavernInterior` (Interior da Taverna)
- **Modo:** `Local Bound` (prioridade 2.0, sobrepõe o volume global quando a câmera entra na taverna).
- **Ajustes Específicos:**
  - Camera EV100: `8.5` (interior mais acolhedor, compensando a ausência do sol direto).
  - Color Saturation: `(R: 1.15, G: 1.05, B: 0.95, W: 1.0)` (acentuação rica de tons quentes dourados e castanhos).
  - Temperature Shift: `+800 K` (aquecimento geral da cena pelas brasas da lareira).
