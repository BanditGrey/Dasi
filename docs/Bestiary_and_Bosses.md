# BESTIÁRIO, CHEFES E INVASÕES GLOBAIS — DASI

> **Abordagem de Design:** Transformar os monstros icônicos de sprites rígidos em criaturas com peso biológico, inteligência artificial reativa (*Behavior Trees*) e animações com resposta física a cada corte, flechada e feitiço.

---

## 1. HIERARQUIA DAS CRIATURAS

```
┌─────────────────────────────────────────────────────────────┐
│                    HIERARQUIA DE CRIATURAS                  │
├─────────────────┬───────────────────┬───────────────────────┤
│    COMUNS       │     ELITES        │      LENDÁRIOS        │
│  (Minions/Mobs) │   & SUB-CHEFES    │     & WORLD BOSSES    │
├─────────────────┼───────────────────┼───────────────────────┤
│ • Esqueletos    │ • Gigantes de Gelo│ • Balrog (Lost Tower) │
│ • Touros Mutados│ • Sombras Venenosas│ • Hydra (Atlans)      │
│ • Larvas da Areia│ • Cavaleiros Mortos│ • Zaikan (Tarkan)     │
│ • Aranhas Reais │ • Gorgon (Dungeon)│ • Kundun (Kalima)     │
└─────────────────┴───────────────────┴───────────────────────┘
```

---

## 2. REINVENTANDO OS CHEFES CLÁSSICOS

### 2.1 Gorgon — O Guardião do Abismo
- **Localização:** Catacumbas do Abismo (*Dungeon - 3º Piso*).
- **Design Visual:** Corpo colossal parte réptil, parte demônio blindado, olhos que emitem névoa fosforescente verde e chicote de espinhos na cauda.
- **Mecânicas & Fases:**
  - **Fase 1 (Aproximação Agressiva):** Golpes frontais com maça de ossos que estilhaçam pilares do cenário; os escombros caídos causam dano e alteram a navegação da sala.
  - **Fase 2 (Olhar Petrificante):** Gorgon salta para o centro da cripta e canaliza um feixe de luz esmeralda; jogadores precisam se esconder atrás dos pilares intactos para não sofrerem petrificação completa (congelamento de status por 4s).
  - **Morte:** Cai de joelhos quebrando o solo da cripta e liberando um baú rúnico com brilho dourado.

### 2.2 Rainha de Gelo (Ice Queen) — A Dama Solitária de Boreal
- **Localização:** Fortaleza Gélida de Boreal (*Devias*).
- **Design Visual:** Veste um vestido de noiva gótico rasgado e congelado, levitando sobre a neve com estilhaços de gelo gravitando ao redor do seu diadema espectral.
- **Mecânicas & Fases:**
  - **Caminho de Gelo:** Onde ela passa, o chão vira gelo liso, fazendo os personagens escorregarem caso tentem frear bruscamente sem usar habilidades de fixação.
  - **Lança Perfurante:** Dispara espigões de gelo colossais que pregam o jogador no solo.
  - **Valsa da Nevasca:** Ela invoca uma tempestade branca que reduz o campo de visão dos jogadores a 3 metros. É necessário rastrear o brilho azul das suas mãos para localizá-la antes que conjure a explosão polar final.

### 2.3 Hydra — O Terror dos Mares de Atlans
- **Localização:** Santuário Submarino de Atlans Thalassa (*Atlans 3*).
- **Design Visual:** Serpente marinha dracônica titânica com escamas bioluminescentes ciano e presas venenosas de coral abissal.
- **Mecânicas & Fases:**
  - **Hidro-Jato Tóxico:** Cospe rajadas concentradas de água altamente pressurizada misturada com veneno corrosivo.
  - **Vórtice Abissal:** Cria redemoinhos marinhos que puxam todos os aventureiros para o centro da arena antes de desferir um bote devastador.
  - **Regeneração Aquática:** Submersa brevemente para recuperar vitalidade se os jogadores não aplicarem dano contínuo com quebra de postura (*Poise*).

### 2.4 Balrog — O Lorde do Abismo Infernal
- **Localização:** O Topo da Torre dos Perdidos (*Lost Tower 7*).
- **Design Visual:** Demônio alado de 6 metros de altura com pele de rocha vulcânica e veias de lava incandescente. Carrega uma foice de ferro colossal em brasa.
- **Mecânicas & Fases:**
  - **Tremor dos Céus:** Cada passo de Balrog faz a câmera tremer e solta cinzas incandescentes do teto.
  - **Ceifa das Chamas:** Um golpe horizontal de 180° com a foice que incendeia o ar e empurra guerreiros para trás contra as paredes da torre.
  - **Asas da Danação:** Bate suas asas de membrana negra liberando furacões de fogo que percorrem a sala em padrões geométricos.
  - **Recompensa Lendária:** Alta chance de soltar armas de duas mãos lendárias (*Dragon Slayer*, *Archangel Sword*) e pilhas de Joias da Alma e da Bênção.

### 2.5 Zaikan — O Flagelo das Areias
- **Localização:** Profundezas do Deserto de Kar-Dune (*Tarkan*).
- **Design Visual:** Quimera biomecânica do deserto com carapaça de escorpião dourado, braços em forma de foices afiadas e antenas psíquicas.
- **Mecânicas:**
  - **Mergulho nas Dunas:** Zaikan desaparece sob a areia; apenas uma ondulação veloz na superfície indica sua aproximação. Ele irrompe de surpresa sob os pés do jogador com maior dano.
  - **Rajada de Vácuo Solar:** Abre sua couraça peitoral e dispara um raio térmico contínuo que varre o horizonte em arco.

---

## 3. ESPECIFICAÇÃO TÉCNICA AUTORITATIVA DOS 5 WORLD BOSSES

Configurações implementadas em `src/server/combat/Monster.ts`:

| Boss Id | Nome | Zona | Nível | HP | Dano Físico | Defesa | Poise (Postura) | Principais Recompensas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ice_queen` | Rainha de Gelo | Devias | 52 | 4,000 | 105 - 145 | 90 | 120 (Resist. 60%) | Joias, Box of Kundun +2, Armas de Gelo |
| `gorgon` | Gorgon Guardião | Dungeon 3 | 55 | 5,500 | 120 - 160 | 110 | 150 (Resist. 70%) | Joias, Box of Kundun +3, Sets Plate/Sphinx |
| `hydra` | Hydra de Atlans | Atlans 3 | 74 | 11,500 | 220 - 290 | 200 | 220 (Resist. 80%) | Box of Kundun +3/+4, Sets Spirit/Dragon |
| `balrog` | Balrog do Abismo | Lost Tower 7 | 84 | 22,000 | 340 - 450 | 290 | 300 (Resist. 85%) | Box of Kundun +4, Foice e Espada Lendária |
| `zaikan` | Zaikan do Deserto | Tarkan | 90 | 35,000 | 450 - 620 | 380 | 400 (Resist. 90%) | Box of Kundun +5, Asas T2/T3, Joias Raras |

---

## 3. O SISTEMA DE INVASÕES DOURADAS (GOLDEN INVASIONS)

A cada 4 horas de servidor (horário de relógio mundial sincronizado), soa a trombeta ancestral nos céus do mundo de Dasi:

```
[ SISTEMA ] O céu se escurece sobre Lorencia e Devias... O Exército Dourado emergiu das Fendas do Caos!
```

1. **Transformação Climática:** O céu do mapa onde o monstro surge escurece gradativamente e nuvens douradas com relâmpagos descem sobre a terra.
2. **Os Invasores:**
   - **Budge Dragon Dourado:** Pequeno, veloz e evasivo; corre desengonçado pelo mapa soltando gemas menores e a Box of Kundun +1.
   - **Soldado Esqueleto Dourado:** Empunha machados dourados com golpes pesados. Solta Box of Kundun +2.
   - **Lagarto / Dragão Dourado Titânico:** Uma besta colossal que sobrevoa áreas abertas e pousa destruindo árvores e cercas. Solta Box of Kundun +4 e +5.
3. **Mecânica da Caixa de Kundun (*Box of Kundun*):**
   - Ao ser arremessada no chão pelo jogador, ela abre com um clarão mágico e projeta para o ar os itens lendários com atributos excelentes antes de caírem na terra com física de dispersão.

---

## 4. MODELAGEM 3D PROCEDURAL & RIG CINEMÁTICO NO DEV VIEWER

Implementado em `src/client/dev_viewer/dasi3dContent.js` e renderizado em tempo real pelo `dasi3dViewer.js` com shaders PBR nativos do Three.js:

| Tipo de Criatura | Categoria | Identificador 3D | Elementos Estéticos & PBR | Ciclos de Animação |
| :--- | :--- | :--- | :--- | :--- |
| **Aranha Gigante** | Comum | `SPIDER` | Cefalotórax quitinoso, abdômen pulsante, 8 patas articuladas e 6 olhos vermelhos. | Andar (gait 8 patas), Mordida e Pulso abdominal. |
| **Budge Dragon** | Invasor / Comum | `BUDGE_DRAGON` | Escamas reptilianas escarlates, asas de alta frequência e centelha de fogo no bico. | Voo pairado, bater de asas e sinuosidade de cauda. |
| **Bull Fighter** | Comum | `BULL_FIGHTER` | Minotauro brutamontes, chifres de marfim, argola no focinho e machado duplo. | Respiração pesada e machadada violenta. |
| **Skeleton Warrior** | Comum | `SKELETON` | Crânio com almas espectrais ciano, costelas expostas, escudo e cimitarra. | Trepidação óssea e corte de cimitarra. |
| **Ice Queen** | World Boss | `ICE_QUEEN` | Rainha glacial com vestido translúcido de gelo, coroa de espetos, cetro com floco de neve e halo de nevasca. | Levitação suave, canalização de cetro e rotação orbital. |
| **Gorgon** | World Boss | `GORGON` | Cauda serpentina enroscada com ferrão tríplice, escamas verde-abissais, 8 serpentes na cabeça e garras afiadas. | Ondulação serpentina, olhar petrificante e ataque de garras. |
| **Balrog** | World Boss | `BALROG` | Lorde do abismo de obsidiana, núcleo peitoral de magma incandescente, asas demoníacas e foice de magma. | Respiração vulcânica, bater de asas e golpe ceifador de 180°. |
| **Golden Titan** | Invasão Dourada | `GOLDEN_TITAN` | Titã solar com armadura completa de placas de ouro polido, elmo com fenda solar e espada larga de ouro com halo orbital. | Pouso de impacto, pulso solar e golpe divino com grande espada. |
