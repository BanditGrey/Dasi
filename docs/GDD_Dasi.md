# GAME DESIGN DOCUMENT (GDD) — DASI

> **Status:** Documento Inicial de Concepção (v0.1)  
> **Gênero:** MMORPG / ARPG Isométrico de Ação  
> **Inspiração Principal:** *Continent of Legend* (MU Online)  
> **Diferenciais-Chave:** Animações com física e peso real, ambientação de alta fidelidade visual (Next-Gen), mapas dinâmicos e atmosfera gótica imersiva.

---

## 1. VISÃO GERAL & HIGH CONCEPT

### 1.1 Slogan / Pitch
> *"O legado épico das joias brilhantes, asas gloriosas e combates brutais renascido na nova geração: fidelidade gráfica deslumbrante, física de combate visceral e mundos vivos."*

### 1.2 Inspiração & Filosofia
O **Continent of Legend** marcou época pela sua identidade inconfundível:
1. O som inconfundível e viciante da queda de uma joia no chão.
2. A evolução visual gritante do personagem (asas grandiosas, armaduras reluzentes em +9, +13 e +15 que chamavam a atenção na praça central).
3. A adrenalina de eventos com hora marcada (*Blood Castle*, *Devil Square*, *Chaos Castle*).
4. O ciclo viciante de grind, drop e comércio livre entre jogadores.

**Dasi** resgata essa essência lendária eliminando a rigidez e as limitações técnicas dos anos 2000. Substituímos animações travadas e cenários estáticos por:
- **Animações Reais:** Animações com inércia, *hit-stop*, reações de impacto dos inimigos (*flinch*, *stagger*, ragdoll ponderado) e física de tecidos, cabelos e asas com resposta aos movimentos do vento e aceleração.
- **Mapas Deslumbrantes:** Ambientes tridimensionais ricos com iluminação global volumétrica, clima dinâmico (chuva que encharca armaduras, tempestades de neve que acumulam sobre ombros e lâminas), poças d'água com reflexos e arquitetura gótica e fantástica colossal.

---

## 2. PILARES DE DESIGN

```
┌─────────────────────────────────────────────────────────────┐
│                       PILARES DE DASI                       │
├─────────────────┬───────────────────┬───────────────────────┤
│    VISCERAL     │    ESPLENDOR      │      PROGRESSÃO       │
│  & RESPONSIVO   │     VISUAL        │      VALIOSA          │
├─────────────────┼───────────────────┼───────────────────────┤
│ • Animações     │ • Gráficos        │ • Som icônico         │
│   orgânicas com │   de ponta (UE5)  │   de drop de gemas    │
│   peso e impacto│ • Asas com física │ • Auras dinâmicas     │
│ • Hit-reactions │   aerodinâmica    │   de refinamento      │
│   e esquiva     │ • Mapas vivos com │ • Economia orgânica e │
│   ativa tática  │   clima e luz     │   mercado livre       │
└─────────────────┴───────────────────┴───────────────────────┘
```

1. **Combate Físico & Orgânico (Feel the Weight):** Um golpe de espada larga não é apenas um frame de corte cortando o ar; ele tem aceleração, impacto no solo que levanta faíscas e poeira, e arrasta o inimigo para trás.
2. **Esplendor Estético & Desejo de Conquista:** O equipamento tem valor estético e de status palpável. Quem possui uma asa Tier 3 ou uma armadura +13 deve parecer uma força celestial ou demoníaca caminhando pela cidade.
3. **Loop de Ação e Recompensa Instantânea:** O som de um drop lendário faz o coração acelerar. A corrida contra o relógio em portões de eventos empolga a cada ciclo de 2 horas.

---

## 3. AMBIENTAÇÃO & MAPAS (REIMAGINANDO OS BIOMAS CLÁSSICOS)

Os cenários são concebidos em perspectiva de câmera semi-isométrica (3D isométrica livre com leve rotação ou câmera dinâmica de ação).

| Mapa Clássico | Equivalente no Dasi | Conceito Visual & Atmosfera | Mecânicas de Terreno |
| :--- | :--- | :--- | :--- |
| **Lorencia** | *Castelo de Loren & Planícies Cinzentas* | Muralhas de pedra negra, solo lamacento coberto de névoa densa, tochas que tremeluzem na chuva noturna, estalagem acolhedora com lareira viva. | Poças que respingam nos passos, grama alta que se curva com os golpes, chuva intermitente. |
| **Noria** | *Santuário Arbóreo de Feywood* | Floresta ancestral de sequoias gigantescas, pontes de madeira suspensas, partículas de pólen brilhante, cascatas luminosas e flores bioluminescentes. | Árvores e vegetação reagem a magias de vento; riachos cristalinos com física de correnteza. |
| **Devias** | *Fortaleza Gélida de Boreal* | Cidade fortificada esculpida em geleiras, muralhas sob nevasca contínua, estalactites de gelo, vento cortante que faz mantos esvoaçarem. | Pegadas na neve fofa, acúmulo de geada sobre a armadura, fumaça quente saindo da respiração. |
| **Dungeon** | *Catacumbas do Abismo Esquecido* | Criptas de múltiplos andares em pedra mármore rachada, correntes de ferro suspensas, tochas de fogo verde, poços de sangue e celas profanadas. | Sombras dinâmicas projetadas pela tocha do jogador, armadilhas de piso e colunas destrutíveis. |
| **Atlans** | *Ruínas Submersas de Thalassa* | Santuário inundado no fundo oceânico. Luz solar filtrada através de raios cáusticos (*water caustics*), algas ondulantes e criaturas abissais. | Gravidade leve/adaptada, partículas de bolhas que acompanham ataques rápidos, distorção aquática. |
| **Tarkan** | *Deserto de Cinzas de Kar-Dune* | Deserto escaldante com dunas móveis, ossadas colossais de leviatãs antigos, tempestades de areia ferozes e ruínas solares soterradas. | Marcas de passos nas dunas, névoa de calor no horizonte, redução temporária de visibilidade. |
| **Icarus** | *Arquipélago Celeste de Aethel* | Ilhas flutuantes sobre um mar de nuvens douradas no crepúsculo. **Requer Asas ativas para acessar.** | Abismo infinito no piso, pontes de luz etérea, rajadas de vento ascendentes. |

---

## 4. CLASSES & ARQUÉTIPOS INICIAIS

### 4.1 Cavaleiro do Sangue (*Blood Knight*)
- **Inspiração:** Dark Knight / Blade Knight.
- **Identidade:** Tanque ofensivo brutal. Usa espadas de duas mãos, maças e escudos pesados.
- **Estilo de Animação:** Postura firme, golpes pesados onde o aço arrasta faíscas no chão.
- **Habilidades Icônicas Revisitadas:**
  - *Twisting Slash (Tormenta de Aço):* O cavaleiro gira com a inércia da lâmina, criando um vórtice cortante que suga e dilacera inimigos adjacentes.
  - *Death Stab (Estocada Fatal):* Dash perfurante instantâneo que projeta um cone de choque sônico à frente, empurrando monstros.
  - *Blood Rage (Fúria Berserker):* Veias e olhos incandescentes que aumentam a velocidade de ataque e adicionam dano elemental às lâminas.

### 4.2 Arquimago do Caos (*Chaos Arcanist*)
- **Inspiração:** Dark Wizard / Soul Master.
- **Identidade:** Conjurador de longo alcance com magias de área espetaculares e controle de multidões.
- **Estilo de Animação:** Mãos canalizadoras de feitiços com runas gravitando ao redor; o cajado emite pulsações rúnicas.
- **Habilidades Icônicas Revisitadas:**
  - *Evil Spirits (Espíritos da Ruína):* Fantasmas etéreos e sombrios serpenteiam o campo em espiral, com áudio aterrorizante e estilhaços de matéria negra.
  - *Hellfire (Inferno Telúrico):* O solo racha em um padrão geométrico antes de pilares de magma e chamas negras explodirem para o céu.
  - *Arcane Shift (Translocação):* Teletransporte com um estalo de vácuo, deixando para trás um clone residual de partículas.

### 4.3 Vigia da Floresta (*Sylph Huntress*)
- **Inspiração:** Fairy Elf / Muse Elf.
- **Identidade:** Mestre do arco longo e balestras duplas, acompanhada de espíritos guardiões e cânticos de cura.
- **Estilo de Animação:** Acrobática e precisa; cambalhotas para trás ao disparar flechas com corda esticada fisicamente.
- **Habilidades Icônicas Revisitadas:**
  - *Triple Shot (Disparo Triplo):* Três flechas encantadas assobiando em trajetórias convergentes com estilhaços perfurantes.
  - *Penetration (Tiro Perfurante):* Disparo de alta potência que deixa um rastro de vácuo distorcido no ar, perfurando fileiras inteiras de monstros.
  - *Call of the Chimera (Invocações da Natureza):* Evocação de golens elementais ou bestas sagradas com inteligência de combate real.

### 4.4 Gladiador Rúnico (*Rune Duelist*)
- **Inspiração:** Magic Gladiator.
- **Identidade:** Híbrido que funde combate veloz de espada com projéteis arcanos.
- **Estilo de Animação:** Dança da espada com rastro de luz; canaliza magias na ponta da própria lâmina.
- **Habilidades Icônicas Revisitadas:**
  - *Fire Slash (Corte Incandescente):* Lança ondas de choque de fogo com cada arco da espada, reduzindo a defesa dos inimigos atingidos.
  - *Power Slash (Corte Trovejante):* Libera múltiplas lâminas de energia mística que se propagam em leque perfurando armaduras.

---

## 5. SISTEMA DE ANIMAÇÕES & COMBAT FEEL

Para atingir a promessa de **"animações reais"**, o combate de Dasi abandona o padrão estático dos jogos antigos:

1. **Inércia e Ponto de Equilíbrio (Anticipation & Recovery):** Armaduras pesadas e espadas gigantes afetam o centro de massa do personagem nas movimentações de ataque e frenagem.
2. **Hit-Stop & Impacto Háptico/Visual:** Ao acertar um golpe crítico, ocorre uma micro-pausa (alguns milissegundos) no frame de impacto, dando a sensação de que a lâmina realmente colidiu com matéria sólida.
3. **Física Dinâmica de Tecidos e Asas:** Capas, cabelos e asas se deformam realisticamente de acordo com curvas de vento, saltos e ataques giratórios.
4. **Esquiva Tática (Active Dodge):** Rolamento e dash responsivos com frames de invulnerabilidade curta (i-frames), permitindo desviar ativamente de ataques de chefes sem depender apenas de RNG de Miss/Defense.

---

## 6. EQUIPAMENTOS, JOIAS E O SISTEMA DE ASAS

### 6.1 Refinamento de Equipamentos (+0 a +15)
O sistema de upgrade visual é a alma do sentimento de conquista:
- **+0 a +6:** Aspecto metálico/rústico natural do material.
- **+7 a +8:** Leve brilho interior nas runas cravadas na arma/armadura.
- **+9:** O início do espetáculo: a peça ganha uma aura de cor própria com partículas sutis emanando da superfície.
- **+11 a +12:** Ondulações de energia constante e faíscas dinâmicas.
- **+13 a +15:** Luminescência intensa com distorção de ar (*heat haze*), deixando rastros brilhantes por onde o personagem anda.

### 6.2 O Lendário Sistema de Asas (*Wings*)
As asas não são apenas cosméticos; são o ápice do status e da mobilidade do personagem:
- **Tier 1 (Asas Neófitas):** Penas/membranas delicadas, conferem corrida acelerada e pequenos saltos planados.
- **Tier 2 (Asas Celestiais/Infernais):** Envergadura maior, efeitos de fumaça etérea e permissão de sobrevoo rasante em áreas com desníveis.
- **Tier 3 (Asas do Soberano):** Envergadura colossal, chamas ardentes ou luz estelar contínua, habilitam o acesso a áreas celestes como o *Arquipélago de Aethel (Icarus)* e combate aéreo intermediário.

### 6.3 O Som e a Caçada por Joias
- **Joia da Bênção (*Jewel of Blessing*):** Upgrade 100% garantido até +6.
- **Joia da Alma (*Jewel of Soul*):** Risco de falha de +7 a +9.
- **Joia do Caos (*Jewel of Chaos*):** Catalisador para fusões na Máquina do Caos (criação de asas, itens Chaos e pets).
- **Audio Feedback Sagrado:** A queda de uma joia no chão emite um som cristalino ressonante que atravessa todos os outros canais de áudio, acompanhado de um feixe de luz vertical apontando para o céu.

---

## 7. EVENTOS HORÁRIOS & CONTEÚDO MULTIPLAYER

1. **Blood Castle (A Invasão da Ponte Sagrada):**
   - Uma ponte fortificada repleta de milhares de monstros em marcha.
   - Os jogadores precisam arrombar os portões de ferro sob fogo cerrado, derrotar os generais de sangue e devolver a Arma do Anjo ferido ao altar antes que o tempo esgote.
2. **Devil Square (A Provação das Sombras):**
   - Arena circular de sobrevivência em ondas contínuas de monstros cada vez mais letais.
   - Ganho exponencial de experiência e disputa por espaço entre os melhores jogadores.
3. **Chaos Castle (Battle Royale Glacial):**
   - Todos entram com armaduras idênticas e sem identificação de nome.
   - O chão da fortaleza vai desabando aos pedaços; o último sobrevivente (jogador ou monstro) leva tesouros lendários.
4. **Invasões Douradas (Golden Invasions):**
   - Mensagem global nos céus: monstros dourados colossais surgem aleatoriamente nos mapas abertos, desencadeando confrontos abertos entre guildas pelo drop das Caixas de Kundun.

---

## 8. STACK TECNOLÓGICA SUGERIDA

- **Game Engine:** Unreal Engine 5.4+ (Lumen para iluminação em tempo real, Nanite para geometria detalhada de armaduras e castelos, Control Rig & Motion Matching para animações realistas).
- **Backend / Servidor de Jogo:** C++ / Rust ou C# (.NET Core) com arquitetura de alta performance via sockets TCP/UDP assíncronos.
- **Banco de Dados:** PostgreSQL / Redis (para cache de estado de alta velocidade e inventário seguro).
- **Pipeline de Áudio:** Wwise ou FMOD para mixagem dinâmica e espacialização de sons de impacto e drops.

---

## 9. ESTRUTURA MODULAR DO GDD (MÓDULOS DETALHADOS)

Para viabilizar a produção e aprofundamento das mecânicas, o GDD de **Dasi** foi dividido nos seguintes cadernos de design técnico:

1. [docs/Combat_and_Stats.md](file:///d:/Dasi/docs/Combat_and_Stats.md): Sistema de 5 Atributos, fórmulas de dano por cores (Crítico, Excelente, Ignorar Defesa), colisão por *Hitbox 3D* e a revolução no *Attack Speed* sem quebra de animação.
2. [docs/Classes_and_Skills.md](file:///d:/Dasi/docs/Classes_and_Skills.md): Detalhamento das 5 classes (Cavaleiro do Sangue, Arquimago do Caos, Vigia da Floresta, Gladiador Rúnico e Soberano Imperial com montaria e corvo de batalha), árvores de evolução e catálogo de habilidades com física.
3. [docs/Bestiary_and_Bosses.md](file:///d:/Dasi/docs/Bestiary_and_Bosses.md): Hierarquia de monstros, chefes icônicos revisitados com múltiplas fases (*Gorgon, Ice Queen, Balrog, Zaikan, Kundun*) e o evento das Invasões Douradas com *Box of Kundun*.
4. [docs/Economy_and_Crafting.md](file:///d:/Dasi/docs/Economy_and_Crafting.md): Economia das Joias (*Bless, Soul, Chaos, Life, Creation, Harmony*), o drama visual e as taxas de risco da Máquina do Caos, e as Lojas Pessoais 3D na Praça Central.
5. [docs/PVP_and_Castle_Siege.md](file:///d:/Dasi/docs/PVP_and_Castle_Siege.md): Sistema de alinhamento moral e PK (com penalidade real de perda de equipamentos para carniceiros), Duelos na Arena e a guerra semanal em larga escala de *Castle Siege*.
6. [docs/technical/UE5_UI_and_3D_HUD_Architecture.md](file:///d:/Dasi/docs/technical/UE5_UI_and_3D_HUD_Architecture.md): Interface do Usuário (UI/HUD) 100% 3D nativa, Paperdoll dinâmico com Viewport 3D em tempo real, globos volumétricos de fluido para Vida e Mana, tooltips 3D rotativos e Action Bar moderna.

---

## 10. ROTEIRO DE PRODUÇÃO (ROADMAP INICIAL)

```
[ FASE 1: PROTÓTIPO ] ──► [ FASE 2: COMBATE ] ──► [ FASE 3: REDE & ITENS ] ──► [ FASE 4: MUNDO & EVENTOS ]
 • Setup de Engine         • Hitboxes dinâmicas    • Servidor de Sockets       • Castelo de Loren
 • Rigging & Animações     • Hit-stop & Stagger    • Drop de Joias com som     • Blood Castle (Ponte)
 • Movimentação física     • 4 Habilidades base    • Refinamento +0 até +15    • Primeira Invasão Dourada
```

---

## 11. PRÓXIMOS PASSOS IMEDIATOS

1. [x] **Definição da Engine principal.** Unreal Engine 5.5 (cliente AAA, `src/client/ue5_project/`) + Three.js/WebGL como Dev Viewer jogável (`src/client/dev_viewer/`).
2. [x] **Criação do projeto base e estrutura de pastas.** `src/client/`, `src/server/`, `src/shaders/`, `docs/`, `prototypes/` e `tools/` já versionados.
3. [x] **Prototipação do controlador de personagem.** `KeyboardController.ts`, `CombatStateMachine.ts` e `dasiCollisionEngine.js` (movimentação WASD/click-to-move, esquiva com i-frames e colisão com deslizamento) + física de combate do `CombatEngine.ts` autoritativo.
4. [x] **Primeiro shader de brilho para armaduras (+0 a +15).** `src/shaders/ItemGlowShader.hlsl` + auras PBR do Dev Viewer (`dasi3dViewer.js`, `dasi3dArmory.js`).

### 11.1 Backlog de curto prazo (aberto)

1. [x] **Sistema de Guildas & Alianças** — implementado em `src/server/guilds/GuildSystem.ts` (32 membros, 3 alianças, tesouro, Imposto Territorial 3%–7%) com opcodes `0xB0` e os 16 testes de `guilds.test.ts`.
2. [ ] **Alinhamento moral / PK (karma)** — as 6 faixas de alinhamento (Herói → Carniceiro) e as penalidades de drop ainda são apenas design.
3. [x] **Cerco ao Castelo como evento agendado** — `src/server/siege/CastleSiegeManager.ts` fecha o ciclo sobre `VOL_01..VOL_05`: janela de inscrição, portão de 25M HP, 4 Estátuas de 8M, pedestais + Selo da Coroa de 30s contínuos, opcodes `0xB1`, rotas `/api/castle-siege` e painel no Dev Viewer (19 testes em `castle_siege.test.ts`).
4. [ ] **Persistência** — hoje o estado é em memória (`SessionManager`); o protocolo prevê Redis 7 + PostgreSQL 16.
5. [ ] **GLB dedicados das arenas de evento** — `EVT_02`/`EVT_03`/`EVT_04` usam arte emprestada do bioma temático; faltam modelos próprios no `blender_dasi_world_builder.py`.
6. [ ] **Pipeline UE5 executável** — o conteúdo C++ (59 arquivos) e os specs de animação estão no repo, mas o projeto ainda não foi compilado/validado em uma instalação de Unreal Engine.

