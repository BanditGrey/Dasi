# DOCUMENTO DE LEVEL DESIGN & WORLD BUILDING: SANTUÁRIO ARBÓREO DE FEYWOOD (NORIA)

> **Projeto:** Dasi (Inspirado no Continent of Legend - MU Online)  
> **Status:** Especificação Técnica & Artística de Level Design (v1.0)  
> **Ambiente:** Santuário Arbóreo de Feywood (*Noria Reimaginada*)  
> **Público-Alvo:** Level Designers, Environment Artists, Technical Artists e Shaders Developers  

---

## 1. VISÃO GERAL & HIGH CONCEPT DA ZONA

O **Santuário Arbóreo de Feywood** é o berço ancestral das Elfas e a capital mística da harmonia natural em Dasi. Ao contrário de uma floresta de fantasia genérica, Feywood é uma megaestrutura botânica viva e bioluminescente: raízes colossais formam pontes suspensas sobre abismos verdejantes, a seiva das Árvores-Mãe escorre como mel incandescente, e o orvalho da manhã abriga esporos luminosos que dançam na penumbra da copa das árvores.

Feywood é também o lar da maior concentração de tecnologias arcanas e instáveis do continente: a infame **Oficina do Gnômico do Caos**, onde a Máquina do Caos estala com relâmpagos violeta, forjando ou incinerando relíquias de valor incalculável.

### 1.1 Identidade Visual & Tom Emocional
- **Paleta de Cores:** Verde-esmeralda profundo (#0D3B22), ciano bioluminescente (#00F0A8), âmbar da seiva fóssil (#FFB300), púrpura etéreo das orquídeas lunares (#8A2BE2) e o brilho caótico magenta (#D10056) da Máquina do Caos.
- **Arquitetura Élfica:** Estruturas que não cortam a madeira, mas a "moldam viva" (*Botanomancia*). Mirantes em carvalho dourado vivo, escadarias em espiral que crescem dos troncos, arcos entrelaçados com flores de lótus de cristal e cúpulas de vidro soprado que canalizam a luz das estrelas.
- **Atmosfera & Sensação:** Mística, mágica e sussurrante nas áreas sagradas; vibrante, perigosa e elétrica ao redor da oficina do Chaos Goblin; e densa, predatória e úmida nas profundezas das rotas de caça.

---

## 2. TOPOGRAFIA & MACRO-LAYOUT

O mapa mede **2048m x 2048m**, estruturado em três níveis de elevação verticais interconectados:
- **Nível Superior: O Dossel Sagrado (+32m a +50m):** Plataformas construídas sobre as copas das Árvores-Mãe, passarelas de raízes trançadas onde repousa o Altar da Rainha Élfica e os santuários das arqueiras.
- **Nível Médio: A Cidade-Raiz & Platô do Caos (+12m a +20m):** O solo elevado onde se encontram o bazar, os artesãos, a grande Oficina da Máquina do Caos e a Fonte da Água da Vida.
- **Nível Inferior: As Profundezas da Selva & Córregos Bioluminescentes (-5m a +8m):** Clareiras densas, troncos caídos cobertos de cogumelos fosforescentes, colônias de insetos mecânico-quitinosos e as fendas que levam para Atlans e Lorencia.

```
                                [ TÚNEL DE RAÍZES ANCESTRAIS ]
                                (Passagem Oculta para Lorencia)
                                              ▲
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │          BOSQUE DAS FADAS & ARQUEIRAS             │
                    │        (Posto de Batedoras & Treinamento)         │
                    └─────────────────────────┬─────────────────────────┘
                                              │
                                              ▼
  [ OFICINA DO GNÔMICO DO CAOS ]     ┌─────────────────┐     [ ALTAR DA RAINHA ÉLFICA ]
  (A Fornalha Arcana, Pistões,       │                 │     (Fonte da Água da Vida,
   Cúpula Elétrica & Alquimia) ◄─────┤  PRAÇA CENTRAL  ├────► Estátua de Lótus, Bênçãos
                                     │   DE FEYWOOD    │      & Santuário das Asas)
                                     │  (Bazar Élfico) │
                                     └────────┬────────┘
                                              │
                                              ▼
                    ┌─────────────────────────┴─────────────────────────┐
                    │      PORTÃO DAS RAÍZES VIVAS (GUARDA REAL)        │
                    │         (Ponte Suspensas sobre o Rio de Seiva)    │
                    └─────────────────────────┬─────────────────────────┘
                                              │
                                              ▼
                    [ CLAREIRA BIOLUMINESCENTE (ZONA INICIAL) ]
                    (Goblins Silvestres, Beetles Dourados, Pteromancers)
                                              │
                                              ▼
                    [ VALE DOS ENTIS & PÂNTANO DOS ESPOROS ]
                    (Treants Corrompidos, Totens Rúnicos, Spiders de Seda)
                                              │
                                              ▼
                              [ FENDA DA GRUTA SUBMERSA ]
                           (Passagem Mística para Atlans Aquática)
```

---

## 3. PONTOS DE INTERESSE DETALHADOS (POIs)

### 3.1 POI 1: A Oficina do Gnômico do Caos (The Chaos Goblin Crafter)
O epicentro da tensão, euforia e tragédia econômica do continente de Dasi.

- **Arquitetura & Engenharia Híbrida:**
  - Uma estrutura semicircular esculpida dentro do tronco oco de uma sequoia milenar de 40 metros de diâmetro.
  - O interior é uma fusão bizarra entre a pureza vegetal élfica e a engenhoca caótica dos goblins artífices: tubulações de cobre corroído por azoth, engrenagens titânicas de latão polido expostas que giram continuamente movidas por uma roda d'água de seiva mágica.
- **A Máquina do Caos Física (O Monólito Forjador):**
  - **Fornalha Arcana Central:** Um reator esférico de vidro vulcânico reforçado por anéis giroscópicos de prata pura, contendo uma chama plasmatica magenta instável (*Chaos Core*).
  - **Pistões Hidráulicos & Foles a Vapor:** Quatro pistões de vapor que sopram baforadas de vapor roxo com sons pneumáticos sibilantes a cada 8 segundos.
  - **A Bancada de Sacrifício:** Mesa de pedra rúnica com entalhes onde o jogador posiciona seus itens e joias.
  - **A Alavanca do Juízo:** Uma alavanca mecânica colossal de ferro forjado e punho de marfim. Quando o jogador clica em "Fundir":
    - O Gnômico salta sobre a alavanca com o peso do corpo.
    - O giroscópio do reator gira a 3000 RPM emitindo arcos elétricos volumétricos pelo ar da oficina.
    - **Sucesso:** A esfera irradia um feixe de luz dourada estelar; trombetas angelicais ecoam; o item sobe levitando banhado em partículas solares.
    - **Falha:** A cúpula engasga, uma explosão de fuligem e fumaça escura projeta o Gnômico de costas contra a parede, soando um som cortante de vidro estilhaçado enquanto os materiais viram cinzas.
- **NPC Residente:** *Mestre Gax'Vor, o Goblin Alquimista* — óculos bifocais fumê, avental de couro chamuscado, segurando uma chave inglesa gnomônica que solta faíscas.

### 3.2 POI 2: O Altar da Rainha Élfica & A Fonte da Água da Vida
O santuário sagrado de Feywood, protegido pelo voto de sangue das arqueiras.

- **O Altar de Alabastro:**
  - Situado no terraço oriental, banhado pela luz direta do sol filtrada por folhas transparentes como vitrais esmeralda.
  - No centro, ergue-se a estátua de *Lúthien, a Primeira Rainha*, esculpida em mármore lunar imaculado, segurando o Arco das Estrelas (*Golden Fenrir Bow*).
- **A Fonte da Água da Vida (Healing Springs):**
  - Um tanque circular de pedras azuis luminescentes onde água curativa pura brota do coração da terra.
  - A água emite vapor bioluminescente azul-turquesa. Jogadores que entram na água recebem o buff passivo:
    - `Bênção de Feywood`: Regeneração de 5% de HP/MP por segundo e aumento temporário de 10% na velocidade de ataque das Arqueiras (*Fairy Elf*).
- **Santuário dos Tecelões de Asas:**
  - Próximo à fonte repousa o oratório onde penas místicas e tecidos etéreos são consagrados antes de serem levados à Máquina do Caos para a confecção das lendárias Asas de Elfa (*Wings of Fairy / Wings of Spirits*).

### 3.3 POI 3: A Praça Central de Feywood & Mercado Botânico
- **Pavimentação Viva:** O chão da praça não é de pedra fria, mas de madeira fossilizada entrelaçada com musgo aveludado que absorve os passos, criando uma acústica suave.
- **Lanternas Esporais:** Luminárias orgânicas feitas de bulbos de flores que se fecham de dia e se abrem ao anoitecer, emitindo vaga-lumes e pólen dourado.
- **NPCs e Comércio:**
  - *Ithilwen, a Guarda das Flechas:* Venda de aljavas infinitas, arcos élficos e poções de ervas medicinais.
  - *Arquivista Elowen:* Banqueiro da Guilda Élfica alojado dentro de um cofre oco esculpido nas raízes inferiores.

---

## 4. ROTAS DE CAÇA & BESTIÁRIO DA FLORESTA

As zonas de caça distribuem-se radialmente a partir do Portão Sul, graduando a dificuldade conforme o jogador desce a topografia da floresta:

```
[ NÍVEL 1-10 ] Clareira Superior: Goblins da Selva & Beetles Dourados
       │
       ▼
[ NÍVEL 10-25 ] Bosque das Fadas Corrompidas & Pteromancers Alados
       │
       ▼
[ NÍVEL 25-45 ] Vale dos Entis Sombrios & Pântano das Aranhas de Teia Venenosa
       │
       ▼
[ BOSS REGIONAL ] O Treant Ancestral Corrompido (Agony Roots)
```

### 4.1 Comportamento & Arquetipos das Criaturas

1. **Goblins Silvestres (Forest Goblins) — Nível 1-8:**
   - **Visual:** Pele verde-oliva com listras de camuflagem amarela, armados com adagas de pedra lascada e fundas de cipó.
   - **IA & Táticas:** Atacam em pequenos bandos de 3 a 5. Quando o líder é derrotado, os demais recuam temporariamente para trás de árvores antes de desferirem ataques surpresa à distância com pedras pontiagudas.

2. **Besouros Blindados / Beetles Dourados (Carabus Rúnicos) — Nível 8-16:**
   - **Visual:** Insetos de 1,20m de comprimento com exoesqueleto de quitina reflexiva dourada e azul-íris (utilizam shader PBR iridescente).
   - **Mecânica:** Alta defesa física frontal (*armadura natural 40%*). Jogadores precisam contorná-los (*flanking*) para atingir o abdômen mole traseiro. Ao morrerem, quebram-se com som de cerâmica partindo e soltam pós alquímicos raros.

3. **Pteromancers Élficos (Pteromancers) — Nível 15-28:**
   - **Visual:** Seres dracônicos reptilianos quadrúpedes com asas membranosas de morcego bioluminescentes.
   - **IA & Habilidades:**
     - *Investida Planada:* Voam rente ao solo em linha reta, empurrando o jogador para trás.
     - *Grito Hipnótico:* Emitem uma frequência ultrassônica que reduz a taxa de esquiva e a velocidade de conjuração dos magos em 25%.

4. **Entis Anciões & Treants Caóticos — Nível 30-45:**
   - **Visual:** Gigantes de madeira negra de 5 metros de altura com olhos vazios que ardem em fogo fátuo roxo devido à contaminação da fenda do Caos.
   - **Mecânicas:**
     - *Golpe Sísmico:* Socam o chão, fazendo raízes pontiagudas brotarem do solo em raio de 8 metros.
     - *Invulnerabilidade de Casca:* Quando atingem 30% de HP, endurecem o tronco reduzindo o dano recebido em 70% por 6 segundos.

---

## 5. PASSAGENS SECRETAS & CONEXÕES GEOGRÁFICAS

Feywood não é uma caixa fechada; possui **duas passagens estratégicas sem costura (*seamless stream*)**:

### 5.1 O Túnel das Raízes Ancestrais (Conexão Noroeste com Lorencia)
- **Topografia:** Uma fenda cavernosa escavada sob as raízes da Árvore-Mãe que cruza as colinas do sul de Lorencia.
- **Ambientação:** A vegetação esmeralda de Feywood vai gradualmente murchando, cedendo espaço para a terra cinzenta e úmida de Lorencia.
- **Transição de Áudio:** O canto das aves e harpas élficas diminui suavemente enquanto o vento sombrio e os corvos de Lorencia ganham volume.
- **Portão de Fronteira:** O posto avançado da Guarda Mista (Elfas arqueiras e Cavaleiros de Lorencia vigiando caravanas de mercadores).

### 5.2 A Fenda da Gruta Submersa (Conexão Sudeste com Atlans Aquática)
- **Topografia:** Ao final do Pântano dos Esporos, o chão desce abruptamente em uma ravina calcária onde uma catarata de água salgada despenca no abismo.
- **Visual:** Paredes de rocha úmida cobertas de corais bioluminescentes e anêmonas gigantes que reagem à proximidade do jogador emitindo pulsos de luz azul e magenta.
- **Requisito de Travessia:** O Portal dos Corais exige que o jogador possua nível 60+ ou utilize as *Nadadeiras de Tritão / Montaria Fenrir / Luvas Aquáticas* para suportar a pressão do abismo submarino de Atlans.

---

## 6. DIRETRIZES DE ILUMINAÇÃO, VOLUMETRIA & SHADERS (UE5 LUMEN)

| Parâmetro | Configuração Floresta Alta (Dia) | Configuração Santuário / Caverna (Noite) |
| :--- | :--- | :--- |
| **Luz Direcional (Sol/Lua)** | 45.000 Lux (Verde Dourado 5200K) | 2.500 Lux (Ciano Noturno 7800K) |
| **Raios Crepusculares (God-Rays)** | Volumetric Scattering 2.8 via Dossel | Volumetric Scattering 1.2 com poeira estelar |
| **Névoa de Altura (Height Fog)** | Densidade 0.015 / Start 20m / Esmeralda | Densidade 0.045 / Start 0m / Azul Violeta |
| **Bioluminescência Shader** | Emissivo 2.0 com oscilação senoidal | Emissivo 8.5 com efeito respiração (*breath cycle*) |
| **Partículas de Esporos** | Niagara GPU Spores: 15.000 partículas | Niagara Spores: 35.000 partículas + Vaga-lumes |

---

## 7. PAISAGEM SONORA & ÁUDIO ESPACIAL (SOUND DESIGN)

1. **Camada 1 (Cama Sonora Contínua):**
   - Sussurro das folhas nas copas altas, vento brando soprando por túneis de madeira oca e gotejar suave de seiva em poças cristalinas.
2. **Camada 2 (Fauna & Bioluminescência):**
   - Chilrear de pássaros feéricos exóticos, estalidos de asas de libélulas gigantes e um zumbido harmônico em 432Hz próximo às flores sagradas.
3. **Camada 3 (A Oficina do Caos):**
   - O ranger rítmico das engrenagens de bronze, sibilo de pistões de vapor a alta pressão, zumbidos elétricos de alta voltagem e as risadas maníacas ocasionais de Gax'Vor.
4. **Camada 4 (Trilha Musical Dinâmica):**
   - Acordes melancólicos e nostálgicos de harpa celta e flautas de madeira nos santuários seguros; percussão tribal com tambores de madeira e cítaras tensas nas áreas de caça profunda.
