# 🗺️ DASI MMORPG — CATÁLOGO MESTRE DOS 56 CENÁRIOS 3D
## Especificação Canônica de Level Design, Volumes de Colisão e Referências Visuais

> **Documento:** Master Scenario & Collision Registry  
> **Total de Cenários:** 56 Cenários Canônicos (8 Biomas Principais + Zonas de Cerco & Eventos)  
> **Métrica do Mundo:** $1\text{ un} = 1\text{ metro}$ ($100\text{ cm}$)  
> **Status:** Aprovado para Produção / Goal Execution  

---

## 🏛️ SUMÁRIO DOS 10 AMBIENTES & 56 CENÁRIOS

| Bioma / Zona | Qtd. Cenários | Identidade Visual & Tema | Clima & Shaders |
| :--- | :---: | :--- | :--- |
| **1. Lorencia** | 7 | Cidadela medieval gótica, calçamento de pedra, melancolia sob chuva fria contínua. | Chuva volumétrica, poças reflexivas, tochas 2100K. |
| **2. Noria** | 7 | Santuário arbóreo élfico de Feywood, sequóias de 40m, Botanomancia e máquinas rúnicas. | Névoa esmeralda, esporos bioluminescentes, plasma magenta. |
| **3. Devias** | 6 | Fortaleza gélida do permafrost, blocos de granito nórdico, nevasca ártica contínua. | Blizzard volumétrica, degelo térmico, gelo SSS safira. |
| **4. Dungeon** | 6 | Catacumbas subterrâneas claustrofóbicas, tijolos romanos, nichos funerários e celas. | Sombras dinâmicas, poças de veneno, tochas verdes. |
| **5. Lost Tower** | 7 | Torre gótica infernal vertical, basalto negro polido com runas de fogo e grelhas de magma. | Magma emissivo HDR, calor refrativo, cinzas vulcânicas. |
| **6. Atlans** | 7 | Ruínas do reino submerso no abismo oceânico de Thalassa, mármore de Nácar e corais. | Cáusticas solares bicromáticas, bolhas efervescentes, domo de ar. |
| **7. Tarkan** | 5 | Deserto escaldante de Kar-Dune, dunas de areia ocre, ossadas fósseis e máquinas de guerra. | Tempestade de areia, calor escaldante, miragens térmicas. |
| **8. Icarus** | 2 | Arquipélago celestial de ilhas flutuantes na estratosfera sobre nuvens crepusculares. | Crepúsculo dourado perpétuo, poeira estelar, luz sólida. |
| **9. Valley of Loren** | 5 | Fortaleza de cerco massivo, muralhas ciclópicas, catapultas e fosso de lava ardente. | Tempestade violeta, fumaça de guerra, estátuas de vida azul. |
| **10. Event Arenas** | 4 | Arenas clássicas de desafio (Blood Castle, Devil Square, Chaos Castle, Coliseu de Duelos). | Nebulosas cósmicas, god rays, lajes móveis, hologramas. |
| **TOTAL** | **56** | **Universo Completo do Continent of Legend Reimagined** | **Motor de Colisão Física 3D Integrado** |

---

## 1. 🌧️ BIOMA 1: LORENCIA (7 CENÁRIOS)

### 1.1 `LOR_01` — Lorencia Citadel: Praça Central & Fonte do Arcanjo
- **Dimensão:** $42\times42\text{ m}$ (Área Segura)
- **POIs:** Fonte octogonal de pedra com bacia dupla, estátua de bronze do Arcanjo com halo celestial flutuante e espada voltada ao solo, 4 gárgulas vertendo água, 8 tochas medievais.
- **Colisores Físicos:** Bacia da fonte ($r=3.0\text{ m}$, cilíndrico), estátua central ($r=0.8\text{ m}$), 8 postes de tocha ($r=0.25\text{ m}$).
- **Spawn / Teleporte:** $(0, 0, 0)$.

### 1.2 `LOR_02` — Lorencia East Gate & Planícies das Bestas
- **Dimensão:** $48\times36\text{ m}$
- **POIs:** Portão leste com arco de pedra fortificado, paliçadas de madeira pontiaguda, ponte de pedra sobre o fosso lamacento, campos abertos com arbustos e tochas de vigia.
- **Colisores:** Pilares do arco do portão ($2.0\times1.5\text{ m}$ cada), paliçadas de estacas ($x \in [-18, 18], z=16$, $h=3.5\text{ m}$).

### 1.3 `LOR_03` — Lorencia West Gate & Mata das Aranhas Negras
- **Dimensão:** $48\times36\text{ m}$
- **POIs:** Saída oeste com árvores carcomidas, teias de aranha espessas entre galhos retorcidos, carcaças de carroças de carga destruídas, tocas no solo.
- **Colisores:** 6 troncos de árvores mortas ($r=0.7\text{ m}$), carroça quebrada ($3.0\times1.8\text{ m}$), barreira de rochas graníticas ao sul.

### 1.4 `LOR_04` — Lorencia North Gate & Ponte do Fosso do Castelo
- **Dimensão:** $48\times42\text{ m}$
- **POIs:** Muralha ciclópica monumental com duas torres redondas de telhados cônicos de ardósia, portão de carvalho com rastrilho de ferro fundido, ponte de pedra larga sobre o fosso.
- **Colisores:** Muralha norte contínua ($48\times2.8\text{ m}$, $h=8.0\text{ m}$), 2 torres ($r=3.0\text{ m}$ cada em $x=\pm14$), parapeitos da ponte ($z \in [6, 14]$).

### 1.5 `LOR_05` — Lorencia South Plains & Cemitério Melancólico
- **Dimensão:** $42\times42\text{ m}$
- **POIs:** Grade de ferro forjado quebrado e retorcido, 8 lápides góticas inclinadas cobertas de musgo e runas, cripta mausoléu fúnebre, 4 fogos-fátuos (*Wisps*) esmeralda orbitando.
- **Colisores:** Paredes da cripta mausoléu ($4.5\times3.5\text{ m}$), cerca perimetral quebrada, 8 lápides ($0.8\times0.3\text{ m}$).

### 1.6 `LOR_06` — Lorencia Golden Hearth Tavern (Interior da Estalagem)
- **Dimensão:** $24\times20\text{ m}$
- **POIs:** Balcão de carvalho escuro em L da Barmaid Lumen, lareira crepitante de pedra com espeto de javali, 4 mesas redondas com canecos de hidromel e cadeiras, barris e mezanino.
- **Colisores:** Paredes do recinto ($24\times20\text{ m}$), balcão ($6.0\times1.2\text{ m}$), lareira saliente ($3.0\times1.5\text{ m}$), 4 mesas ($r=1.2\text{ m}$).

### 1.7 `LOR_07` — Lorencia Blacksmith Forge (Forja do Ferreiro Han)
- **Dimensão:** $20\times20\text{ m}$
- **POIs:** Fornalha de brasas ardentes com foles mecânicos, bigorna maciça de aço, bancadas de trabalho repletas de lâminas incandescentes e tenazes, suportes de armaduras de placas.
- **Colisores:** Fornalha ($2.5\times2.5\text{ m}$), bigorna ($1.0\times0.6\text{ m}$), prateleiras de armas na parede.

---

## 2. 🌿 BIOMA 2: NORIA (7 CENÁRIOS)

### 2.1 `NOR_01` — Noria Feywood Sanctuary (Praça Élfica Central)
- **Dimensão:** $42\times42\text{ m}$ (Área Segura)
- **POIs:** Árvore-mãe colossal esculpida com varandas em espiral, pontes suspensas de corda e ripas de cedro, fontes de orvalho cristalino e lanternas de casulo fosforescentes.
- **Colisores:** Tronco central da Árvore-Mãe ($r=4.5\text{ m}$), parapeitos das plataformas elevadas.

### 2.2 `NOR_02` — Noria Chaos Machine Workshop (Oficina Alquímica do Caos)
- **Dimensão:** $32\times32\text{ m}$
- **POIs:** Sequóia oca de 40m com roda d'água rúnica, 3 anéis giroscópicos concêntricos de latão, 4 pistões a vapor em bombeamento contínuo, reator de plasma magenta e alavanca da forja.
- **Colisores:** Estrutura da base da forja ($6.0\times6.0\text{ m}$), plinto de sacrifício rúnico ($1.8\times1.8\text{ m}$), roda d'água ($0.8\times4.0\text{ m}$).

### 2.3 `NOR_03` — Noria Queen Lúthien's Altar & Águas da Vida
- **Dimensão:** $36\times36\text{ m}$
- **POIs:** Altar de alabastro e marfim vegetal com a estátua da rainha empunhando o Arco de Fenrir, bacia sagrada das Águas da Vida (cura contínua), 2 pilones de seiva de âmbar canalizando feixes telúricos.
- **Colisores:** Pedestal do altar ($4.5\times4.5\text{ m}$), 2 pilones de âmbar ($r=0.6\text{ m}$ cada).

### 2.4 `NOR_04` — Noria East Fey Groves (Bosques dos Goblins Espiões)
- **Dimensão:** $44\times36\text{ m}$
- **POIs:** Bosques densos com folhagem translúcida esmeralda, cipós espinhosos rastejantes, esconderijos de madeira camuflada de goblins arqueiros, troncos caídos servindo de pontes naturais.
- **Colisores:** 8 árvores frondosas ($r=1.0\text{ m}$), tronco caído ($8.0\times1.2\text{ m}$), arbustos densos com bloqueio de passagem.

### 2.5 `NOR_05` — Noria Giant Mushroom Glade (Clareira dos Cogumelos Neon)
- **Dimensão:** $38\times38\text{ m}$
- **POIs:** 5 colônias de cogumelos gigantes com chapéus de 3 a 5 metros de diâmetro emitindo pulsações de neon (ciano, púrpura, verde e ouro), lago de lodo luminescente e esporos flutuantes.
- **Colisores:** Hastes dos cogumelos colossais ($r=0.5\text{ m}$ a $0.8\text{ m}$), rochas musgosas periféricas.

### 2.6 `NOR_06` — Noria Deep Canyon & Ponte Pênsil de Raízes
- **Dimensão:** $46\times30\text{ m}$
- **POIs:** Abismo vertical profundo com névoa verdejante ao fundo, ponte pênsil de raízes entrelaçadas e tábuas estalantes que oscilam ao vento, cachoeira caindo no vazio.
- **Colisores:** Bordas do desfiladeiro (penhasco intransponível em $z < -4$ e $z > 4$), parapeitos da ponte ($y \in [-14, 14], x \in [-1.8, 1.8]$).

### 2.7 `NOR_07` — Noria Creeper Hollow (Covil do Stone Golem Titânico)
- **Dimensão:** $40\times40\text{ m}$ (Arena de Chefe)
- **POIs:** Clareira circular cercada por muralha vegetal intransponível de raízes grossas, monolito de pedra ancestral quebrado no centro onde desperta o Stone Golem de 8 metros.
- **Colisores:** Círculo perimetral de raízes gigantes ($r=19.0\text{ m}$), blocos de pedra do monolito ($2.0\times2.0\text{ m}$).

---

## 3. ❄️ BIOMA 3: DEVIAS (6 CENÁRIOS)

### 3.1 `DEV_01` — Devias Glacial Citadel & O Grande Braseiro Rei
- **Dimensão:** $42\times42\text{ m}$ (Área Segura)
- **POIs:** Fortaleza de granito nórdico severo, O Grande Braseiro Rei de 12 metros em ferro fundido forjado com fogo sagrado rugindo (intensidade 5.8), **anel térmico de degelo de 25m com pedra molhada reflexiva**.
- **Colisores:** Base do Braseiro Rei ($r=3.2\text{ m}$), muros do pátio fortificado.

### 3.2 `DEV_02` — Devias Glacial Cathedral (Fachada & Rosácea de Gelo)
- **Dimensão:** $44\times38\text{ m}$
- **POIs:** Fachada gótica monumental esculpida em granito e permafrost, arcobotantes imponentes, **Rosácea de Gelo (vitral safira translúcido)** pulsando com luz sagrada fria, 8 agulhas de gelo perene.
- **Colisores:** Fachada da catedral ($24.0\times6.0\text{ m}$), arcobotantes laterais ($2.0\times4.0\text{ m}$ cada).

### 3.3 `DEV_03` — Devias North Snowfields (Campos de Neve dos Vermes Glaciais)
- **Dimensão:** $50\times40\text{ m}$
- **POIs:** Planície aberta de permafrost varrida por nevasca contínua, montes de neve com fissuras onde vermes e monstros de gelo emboscam, estacas de aviso em madeira congelada.
- **Colisores:** Cristas de rocha granítica pontiaguda, bancos de gelo intransponíveis.

### 3.4 `DEV_04` — Devias Ice Shard Ridge (Cordilheira das Agulhas de Cristal)
- **Dimensão:** $44\times40\text{ m}$
- **POIs:** Desfiladeiro alpino de gelo com 12 espirais colossais de cristal translúcido com dispersão de luz azul e translucidês (*Subsurface Scattering*), cavernas de gelo.
- **Colisores:** 12 pilares/agulhas de cristal maciço ($r=1.2\text{ m}$ a $2.0\text{ m}$, $h=10\text{ m}$).

### 3.5 `DEV_05` — Devias Frozen Abyss & Ponte da Fenda Polar
- **Dimensão:** $46\times32\text{ m}$
- **POIs:** Fenda sísmica abissal de permafrost que racha a fortaleza, ponte natural de gelo rachado com estalactites penduradas e vento uivante que empurra os viajantes.
- **Colisores:** Abismo polar mortal dos dois lados da ponte, limites da passagem de gelo ($x \in [-2.2, 2.2]$).

### 3.6 `DEV_06` — Devias Ice Queen Frozen Palace (Arena da Rainha do Gelo)
- **Dimensão:** $40\times40\text{ m}$ (Arena de Chefe)
- **POIs:** Trono monumental esculpido em gelo puro com cortinas de geada, colunas dóricas congeladas que estilhaçam com feitiços, solo de gelo espelhado com reflexão límpida.
- **Colisores:** Trono de Gelo da Rainha ($4.0\times3.0\text{ m}$), 6 colunas dóricas congeladas ($r=1.0\text{ m}$), paredes circulares da câmara ($r=19.5\text{ m}$).

---

## 4. 💀 BIOMA 4: DUNGEON (6 CENÁRIOS)

### 4.1 `DNG_01` — Dungeon Floor 1: Catacumbas da Entrada & Ossuário
- **Dimensão:** $38\times38\text{ m}$
- **POIs:** Portal subterrâneo em arco de pedra rachada, paredes de tijolos romanos escurecidos com nichos repletos de caveiras e ossadas humanas, poças de sangue estagnado e tochas verdes.
- **Colisores:** Pilares de sustentação de cantaria ($1.4\times1.4\text{ m}$), nichos de ossos nas paredes laterais, portão de ferro enferrujado.

### 4.2 `DNG_02` — Dungeon Floor 1: Corredor das Celas Profanadas
- **Dimensão:** $46\times24\text{ m}$
- **POIs:** Corredor labiríntico estreito com celas de ferro arrebentadas dos dois lados, esqueletos pendurados por correntes enferrujadas, armadilhas de estacas de solo.
- **Colisores:** Grades das celas ($x=\pm6.0\text{ m}$), pilares centrais a cada 8 metros.

### 4.3 `DNG_03` — Dungeon Floor 2: Criptas Venenosas dos Touros Malditos
- **Dimensão:** $40\times40\text{ m}$
- **POIs:** Cripta úmida inundada por poças de lodo verde tóxico que reduzem velocidade de movimento, sarcófagos de pedra profanados e estátuas quebradas de deuses pagãos.
- **Colisores:** 4 sarcófagos monumentais de pedra ($2.6\times1.2\text{ m}$), 4 pilares centrais ($1.5\times1.5\text{ m}$).

### 4.4 `DNG_04` — Dungeon Floor 2: Câmara de Tortura & Poço dos Sacrifícios
- **Dimensão:** $36\times36\text{ m}$
- **POIs:** Donzelas de ferro, rodas de tortura quebradas com manchas de sangue seco, poço circular central escuro cercado por correntes de ferro suspensas no teto.
- **Colisores:** Poço central ($r=2.5\text{ m}$, orifício intransponível com grade), donzelas de ferro e instrumentos de tortura nas laterais.

### 4.5 `DNG_05` — Dungeon Floor 3: Labirinto das Almas Perdidas
- **Dimensão:** $44\times44\text{ m}$
- **POIs:** Labirinto gótico de corredores cruzados sem janelas, névoa densa esmeralda rastejando no piso, fantasmas e magos malditos flutuando entre nichos de catacumbas.
- **Colisores:** Paredes do labirinto ($1.0\text{ m}$ de espessura formando corredores navegáveis de $3.5\text{ m}$ de largura).

### 4.6 `DNG_06` — Dungeon Floor 3: Gorgon's Lair (Arena do Guardião do Abismo)
- **Dimensão:** $42\times42\text{ m}$ (Arena de Chefe)
- **POIs:** Câmara ritual monumental circular com teto em cúpula fraturada, 8 pilares de pedra com colisão destrutível (*Chaos Destruction*), altar central com fendas de fogo verde onde Gorgon canaliza o olhar de petrificação.
- **Colisores:** 8 pilares destrutíveis ($r=1.2\text{ m}$ distribuídos em círculo de raio $12\text{ m}$), muralha circular do covil ($r=20.0\text{ m}$).

---

## 5. 🔥 BIOMA 5: LOST TOWER (7 CENÁRIOS)

### 5.1 `LT_01` — Lost Tower 1: O Portal de Obsidiana
- **Dimensão:** $38\times38\text{ m}$
- **POIs:** Arco monumental esculpido em basalto negro polido com runas de fogo incandescentes, grelha de ferro fundido no chão revelando magma fluido abaixo, gárgulas aladas na entrada.
- **Colisores:** Pilares do portal ($2.0\times2.0\text{ m}$), parapeito de ferro fundido com vista para o abismo de fogo.

### 5.2 `LT_02` — Lost Tower 2: Os Corredores Rúnicos
- **Dimensão:** $44\times26\text{ m}$
- **POIs:** Paredes com relevos de demônios alados e inscrições em caracteres rúnicos dourados que brilham a intervalos, tochas com chamas azuis sulfúricas em suportes de bronze.
- **Colisores:** Colunas quadradas de basalto ($1.2\times1.2\text{ m}$), nichos rúnicos com estátuas de demônios.

### 5.3 `LT_03` — Lost Tower 3: O Abismo das Grelhas de Magma
- **Dimensão:** $40\times40\text{ m}$
- **POIs:** Plataforma suspensa por correntes de ferro ciclópicas sobre um mar de magma incandescente, grelhas perfuradas que emitem jatos verticais de vapor escaldante.
- **Colisores:** Fendas de lava aberta (intransponíveis), correntes de sustentação verticais ($r=0.6\text{ m}$).

### 5.4 `LT_04` — Lost Tower 4: As Sacadas dos Demônios Alados
- **Dimensão:** $42\times34\text{ m}$
- **POIs:** Varandões abertos para o céu avermelhado da torre, gárgulas e estátuas de *Devils* prontas para alçar voo, balaustradas de pedra negra com espigões de ferro.
- **Colisores:** Balaustrada perimetral com espigões ($h=1.2\text{ m}$), pilares góticos angulares.

### 5.5 `LT_05` — Lost Tower 5: A Colunata Espiral
- **Dimensão:** $40\times40\text{ m}$
- **POIs:** Câmara monumental circular com colunas colossais sustentando a abóbada em espiral, braseiros de crânio com chamas infernais perpétuas, chão em mosaico preto e carmesim.
- **Colisores:** 6 colunas espirais colossais ($r=1.5\text{ m}$), braseiros de crânio ($r=0.8\text{ m}$).

### 5.6 `LT_06` — Lost Tower 6: As Muralhas Infernais
- **Dimensão:** $46\times36\text{ m}$
- **POIs:** Antessala do ápice da torre, fendas nas paredes por onde escorre lava líquida alimentando canais no piso, altares de sacrifício profano com punhais de ferro negro.
- **Colisores:** Canais de lava líquida ($1.5\text{ m}$ de largura com colisão de perigo térmico), altar de sacrifício ($3.0\times1.5\text{ m}$).

### 5.7 `LT_07` — Lost Tower 7: Balrog's Throne of Hellfire (Trono do Balrog)
- **Dimensão:** $44\times44\text{ m}$ (Arena de Chefe)
- **POIs:** Pináculo supremo da torre a céu aberto sob tempestade de cinzas e raios vermelhos, trono monumental de basalto encimado pela foice infernal cravada na rocha, abismo total ao redor.
- **Colisores:** Trono de Balrog ($5.0\times4.0\text{ m}$, $h=6.0\text{ m}$), 4 obeliscos de magma nos pontos cardeais ($1.5\times1.5\text{ m}$), borda do abismo circular ($r=21.0\text{ m}$).

---

## 6. 🌊 BIOMA 6: ATLANS (7 CENÁRIOS)

### 6.1 `ATL_01` — Atlans Shallows: Areias Peroladas & Cáusticas Solares
- **Dimensão:** $42\times42\text{ m}$
- **POIs:** Fundo oceânico de areia branca perolada iluminado por cáusticas de luz solar filtrada, espécimes de algas ondulantes com física de correnteza marinha e peixes luminescentes.
- **Colisores:** Bancos de rocha coralina periféricos, estátua partida semi-enterrada na areia.

### 6.2 `ATL_02` — Atlans Sanctuary: Santuário de Nácar & Domo de Ar
- **Dimensão:** $40\times40\text{ m}$ (Área Segura)
- **POIs:** Plataforma circular de mármore de Nácar com 4 arcos parabólicos hidrodinâmicos, domo místico de ar pressurizado que respira suavemente contra a pressão hidrostática.
- **Colisores:** 4 bases dos arcos parabólicos ($1.2\times1.2\text{ m}$ cada em raio $8.0\text{ m}$), pedestal central de nácar ($r=1.5\text{ m}$).

### 6.3 `ATL_03` — Atlans Coral Labyrinth (Labirinto dos Corais de Gorgônia)
- **Dimensão:** $44\times44\text{ m}$
- **POIs:** Labirinto vivo de recifes de corais de gorgônia (magenta, ciano, violeta e dourado) de 4 a 6 metros de altura, anêmonas marinhas fluorescentes e esponjas tubulares.
- **Colisores:** 8 aglomerados massivos de recifes de coral formadores de paredes orgânicas intransponíveis.

### 6.4 `ATL_04` — Atlans Slipstream Trench (Trincheira dos Túneis de Correnteza)
- **Dimensão:** $48\times30\text{ m}$
- **POIs:** Desfiladeiro submarino estreito cortado por 4 anéis rúnicos de aceleração *Slipstream* em rotação contínua, propelindo nadadores e projéteis em alta velocidade.
- **Colisores:** Paredes verticais da trincheira oceânica ($x=\pm7.0\text{ m}$), anéis de slipstream ($r=2.5\text{ m}$).

### 6.5 `ATL_05` — Atlans Leviathan Graveyard (Cemitério dos Leviatãs)
- **Dimensão:** $46\times40\text{ m}$
- **POIs:** Esqueleto fóssil ciclópico de um monstro marinho ancestral com 8 costelas brancas gigantes arqueadas sobre a areia formando uma nave de catedral gótica natural, crânio fóssil.
- **Colisores:** 8 costelas fossilizadas do leviatã ($r=0.45\text{ m}$ formando arcos de $6.0\text{ m}$ de altura), crânio fóssil frontal ($4.5\times3.5\text{ m}$).

### 6.6 `ATL_06` — Atlans Hydrothermal Fissures (Fendas Hidrotermais & Black Smokers)
- **Dimensão:** $42\times38\text{ m}$
- **POIs:** Chaminés de basalto vulcânico submarino (*Black Smokers*) expelindo fumaça negra mineral e vapor em alta pressão com fulgor vermelho incandescente de magma nas fissuras.
- **Colisores:** 5 chaminés vulcânicas de basalto ($r=1.2\text{ m}$ a $1.8\text{ m}$, $h=5.0\text{ m}$), fendas magmáticas de dano por calor.

### 6.7 `ATL_07` — Atlans Hydra's Abyssal Maw (Arena da Hidra Tricéfala)
- **Dimensão:** $44\times44\text{ m}$ (Arena de Chefe)
- **POIs:** Fossa oceânica abissal circular sem luz natural da superfície, iluminada apenas pelas barbelas bioluminescentes da Hidra de 3 Cabeças, corais venenosos nas bordas e redemoinhos.
- **Colisores:** Rochas venenosas pontiagudas periféricas ($r=21.0\text{ m}$), 3 pedestais de corais antigos servindo de cobertura tática.

---

## 7. 🏜️ BIOMA 7: TARKAN (5 CENÁRIOS)

### 7.1 `TAR_01` — Tarkan Dunes: Dunas Carmesim & Máquinas Soterradas
- **Dimensão:** $46\times42\text{ m}$
- **POIs:** Imensidão de dunas de areia ocre escaldante varridas por vento seco, engrenagens colossais enferrujadas e eixos mecânicos de guerra de civilizações perdidas semienterrados na areia.
- **Colisores:** 3 engrenagens colossais enferrujadas ($r=2.5\text{ m}$ cravadas no chão), cumes rochosos de arenito.

### 7.2 `TAR_02` — Tarkan Oasis of Boiling Mirage (Oásis da Miragem Fervente)
- **Dimensão:** $40\times40\text{ m}$
- **POIs:** Pequeno lago de água sulfúrica borbulhante no meio do deserto com cactos de ferro negro, palmeiras fossilizadas e miragem de calor atmosférico permanente (*Heat-Haze*).
- **Colisores:** Lago sulfúrico central ($r=3.5\text{ m}$), 4 troncos fossilizados ($r=0.6\text{ m}$).

### 7.3 `TAR_03` — Tarkan Leviathan Spine Ridge (Desfiladeiro da Espinha do Deserto)
- **Dimensão:** $48\times36\text{ m}$
- **POIs:** Cume estreito ladeado por penhascos abruptos de arenito sedimentar vermelho, ossadas de vértebras e costelas de leviatãs do deserto expostas à abrasão do vento.
- **Colisores:** Vértebras gigantes fossilizadas ($2.5\times2.5\text{ m}$ a cada 6 metros), penhascos do desfiladeiro.

### 7.4 `TAR_04` — Tarkan Iron Wheel Scrapyard (Cemitério das Rodas de Ferro)
- **Dimensão:** $44\times40\text{ m}$
- **POIs:** Campo de batalha desértico repleto de rodas blindadas cortantes de monstros *Iron Wheel* desativados, catapultas esmagadas e estacas de aço retorcido.
- **Colisores:** 6 rodas mecânicas de lâminas gigantes ($r=1.8\text{ m}$, espessura $0.8\text{ m}$), estacas de aço cravadas no chão.

### 7.5 `TAR_05` — Tarkan Zaikan's Sand Crater (Arena do Flagelo das Areias)
- **Dimensão:** $44\times44\text{ m}$ (Arena de Chefe)
- **POIs:** Cratera profunda circular cercada por dunas móveis inclinadas, centro com areia movediça onde Zaikan (quimera escorpião-humanoide) emerge em erupções de areia ardente.
- **Colisores:** Bordas de arenito da cratera ($r=21.0\text{ m}$), 4 obeliscos de rocha do deserto que Zaikan pode estilhaçar com investidas.

---

## 8. 🪽 BIOMA 8: ICARUS (2 CENÁRIOS)

### 8.1 `ICA_01` — Icarus Aethel: Cidadela Central & Núcleo de Aetherita
- **Dimensão:** $48\times48\text{ m}$ (Área Celestial)
- **POIs:** Platô rochoso de ancoragem com cone rochoso invertido na base sustentado por um colossal **Monólito de Aetherita gravitacional** em precessão giroscópica contínua, 3 ilhas satélites flutuando em levitação harmônica, passarelas de pura luz fotônica sólida e 4 anéis térmicos ascendentes.
- **Colisores:** Abismo celestial absoluto fora das ilhas e pontes (quedas são letais sem asas), base do obelisco central ($r=2.2\text{ m}$), guardas de luz das pontes.

### 8.2 `ICA_02` — Icarus Lotus Nest: Pináculo de Obsidiana do Dark Phoenix
- **Dimensão:** $42\times42\text{ m}$ (Arena de Chefe)
- **POIs:** Plataforma monumental em flor de lótus esculpida em obsidiana cósmica com veios dourados, pétalas de rocha negra envolvendo a arena, vórtice de fogo estelar ardente no centro onde renasce o Dark Phoenix sob uma nebulosa cósmica com 300 estrelas cadentes.
- **Colisores:** 8 pétalas de obsidiana formando o parapeito perimetral ($h=3.5\text{ m}$), centro do vórtice cósmico ($r=2.0\text{ m}$), abismo infinito ao redor.

---

## 9. ⚔️ ZONA 9: VALLEY OF LOREN & CASTLE SIEGE (5 CENÁRIOS)

### 9.1 `VOL_01` — Campo de Guerra & Acampamento das Alianças
- **Dimensão:** $80\times60\text{ m}$ (Área Segura e Spawn Atacante)
- **POIs:** 3 catapultas de madeira e ferro, tendas de comando de guilda, trincheiras com paliçadas de estacas de proteção e marcos de aliança.
- **Colisores:** 3 catapultas rígidas ($6.0\times4.0\text{ m}$ cada), parapeitos perimetrais de estacas.

### 9.2 `VOL_02` — Primeiro Baluarte & Portão Ciclópico de Ferro
- **Dimensão:** $60\times40\text{ m}$
- **POIs:** Portão colossal de ferro fundido de 10m com 25M de HP destrutível, duas torres de menagem para arqueiros a +12m de elevação.
- **Colisores:** Portão destrutível ($8.0\times1.2\text{ m}$, $h=10.0\text{ m}$), 2 torres redondas de menagem ($r=3.5\text{ m}$).

### 9.3 `VOL_03` — Pátio das Estátuas da Vida
- **Dimensão:** $70\times50\text{ m}$
- **POIs:** 4 Estátuas da Vida em mármore de alabastro com auras celestiais de respawn avançado e escudos de invulnerabilidade temporária, 2 canhões defensivos de baluarte.
- **Colisores:** 4 Estátuas da Vida destrutíveis ($r=1.8\text{ m}$, $h=7.0\text{ m}$ em plintos de $3.5\times3.5\text{ m}$), muralhas perimetrais contínuas.

### 9.4 `VOL_04` — O Gargalo da Ponte Levadiça sobre o Fosso de Lava
- **Dimensão:** $50\times30\text{ m}$
- **POIs:** Passarela de aço e carvalho de 6m de largura por 24m de comprimento sobre abismo de lava fluida a 1400°C, duas caldeiras de óleo quente nas ameias superiores.
- **Colisores:** Parapeitos da ponte levadiça ($h=1.1\text{ m}$), vazio de lava (queda fatal instantânea).

### 9.5 `VOL_05` — O Salão do Trono Real & O Selo da Coroa
- **Dimensão:** $45\times45\text{ m}$ (Câmara Máxima de Conquista)
- **POIs:** Trono imperial sobre estrado de 7 degraus com Selo da Coroa (requer 30s de canalização contínua), 2 pedestais sagrados de apoio mantidos por sub-líderes, 8 colunas de alabastro com ouro.
- **Colisores:** Trono Real ($6.0\times5.0\text{ m}$, $h=4.5\text{ m}$), 2 pedestais laterais ($r=1.0\text{ m}$), 8 colunas de alabastro ($r=1.2\text{ m}$, $h=10.0\text{ m}$).

---

## 10. 🩸 ZONA 10: EVENT ARENAS & DESAFIOS CLÁSSICOS (4 CENÁRIOS)

### 10.1 `EVT_01` — Blood Castle: A Ponte de Martírio do Arcanjo
- **Dimensão:** $120\times18\text{ m}$ (Percurso Linear Estrito)
- **POIs:** Passarela de pedra gótica suspensa sobre o vácuo cósmico rubro, 16 estátuas de arcanjos caídos com lágrimas de cristal, Portão do Arcanjo com barreira elétrica carmesim, estátua final do Arcanjo Ferido.
- **Colisores:** Parapeitos góticos laterais ($h=1.2\text{ m}$ ao longo de $x=\pm9.0\text{ m}$), 16 estátuas ($r=1.2\text{ m}$ cada), Portão do Arcanjo ($18.0\times1.5\text{ m}$, $h=8.0\text{ m}$).

### 10.2 `EVT_02` — Devil Square: A Praça Circular da Carnificina Pentagramal
- **Dimensão:** $50\times50\text{ m}$ (Arena Fechada Circular)
- **POIs:** Pentagrama rúnico incandescente entalhado no piso de granito, 4 totens de crânios de 6m expelindo chamas contínuas, pedestal central de emergência do Baú de Ouro do Triunfo.
- **Colisores:** Grade perimetral circular intransponível ($r=24.5\text{ m}$), 4 pilares de crânios ($r=1.4\text{ m}$).

### 10.3 `EVT_03` — Chaos Castle: O Coliseu Suspenso das Lajes Desabantes
- **Dimensão:** $42\times42\text{ m}$ (Arena Dinâmica Redutível)
- **POIs:** Tablado modular de $6\times6$ lajes com armaduras idênticas e anonimato total; lajes externas estremecem e desabam no vácuo conforme monstros são abatidos, encolhendo a arena para $28\times28\text{ m}$ e $14\times14\text{ m}$.
- **Colisores:** Lajes modulares com desativação de colisão por etapa ($7.0\times7.0\text{ m}$), abismo perimetral fatal.

### 10.4 `EVT_04` — Coliseu de Duelos: A Grande Arena da Glória
- **Dimensão:** $36\times36\text{ m}$ (Arena Octogonal com Arquibancadas)
- **POIs:** Tablado octogonal elevado a +1.0m de mármore venado polido, placar holográfico tridimensional flutuante a 8m exibindo status e melhor de 10 abates, cúpula de barreira de força translúcida.
- **Colisores:** Chanfros do tablado octogonal ($h=1.0\text{ m}$), barreira de força perimetral cilíndrica ($r=17.5\text{ m}$).

---

## 🛡️ SISTEMA DE COLISÕES FÍSICAS (SPECIFICATION)

Cada cenário possui uma matriz rigorosa de volumes de colisão simples:
1. **Paredes & Baluartes:** Volumes $Box(x, y, z, w, h, d)$.
2. **Pilares, Árvores & Estátuas:** Volumes $Cylinder(x, z, r, h)$.
3. **Muralhas Circulares & Covis:** Volumes $ConvexHull / RadialBoundary(x, z, R_{inner}, R_{outer})$.
4. **Resolução de Contato (Slide Physics):**
   $$\vec{v}_{\text{slide}} = \vec{v} - (\vec{v} \cdot \hat{n}) \hat{n}$$
   Garante deslizamento fluído e sem travamento ao longo de paredes e quinas.
