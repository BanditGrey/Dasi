# DOCUMENTO DE LEVEL DESIGN & WORLD BUILDING: EVENT ARENAS (ARENAS DE EVENTOS & DESAFIOS CLÁSSICOS)

> **Projeto:** Dasi (Continent of Legend Reimagined)  
> **Status:** Especificação Técnica & Artística de Level Design (v1.0)  
> **Ambiente:** Arenas Clássicas de Evento com Hora Marcada & Coliseu de Duelo  
> **Concept Art Oficial:** [`docs/art/scenery/blood_castle_concept_art.jpg`](file:///d:/Dasi/docs/art/scenery/blood_castle_concept_art.jpg)  
> **Público-Alvo:** Level Designers, Environment Artists, Lighting Artists, Engenheiros de Redes e Gameplay Programmers  

---

## 1. VISÃO GERAL & HIGH CONCEPT DOS 4 CENÁRIOS DE EVENTO

As **Event Arenas (Arenas de Evento & Desafios Clássicos)** resgatam a adrenalina inconfundível dos eventos com hora marcada que definiram o legado do *Continent of Legend*. A cada ciclo de 2 horas, os aventureiros de todo o mundo de Dasi convergem para os portais das capitais com suas capas e pergaminhos sagrados para testar suas forças contra o relógio, contra hordas colossais e contra outros jogadores em condições extremas de combate.

```
                           ┌────────────────────────────────────────┐
                           │      OS 4 EVENTOS LENDÁRIOS DE DASI    │
                           └───────────────────┬────────────────────┘
                                               │
        ┌──────────────────────┬───────────────┴──────────────┬──────────────────────┐
        ▼                      ▼                              ▼                      ▼
┌────────────────┐     ┌────────────────┐             ┌────────────────┐     ┌────────────────┐
│  BLOOD CASTLE  │     │  DEVIL SQUARE  │             │  CHAOS CASTLE  │     │ COLISEU DUELOS │
│ A Ponte do     │     │ A Praça da     │             │ O Coliseu das  │     │ A Arena de     │
│ Martírio       │     │ Carnificina    │             │ Lajes Móveis   │     │ Honra 1v1      │
│ (PVE / Rush)   │     │ (PVE / Hordas) │             │ (PVP Royale)   │     │ (Competitivo)  │
└────────────────┘     └────────────────┘             └────────────────┘     └────────────────┘
```

### Modelos GLB dedicados de eventos

Os três eventos além de Blood Castle têm modelos próprios e carregáveis. Esses arquivos são **assets visuais estáticos**: não substituem colisões do servidor nem partículas, luzes e animações do runtime.

| Cenário | GLB de protótipo | Cópia do Dev Viewer | Elementos principais |
| :--- | :--- | :--- | :--- |
| `EVT_02` — Devil Square | [`devil_square.glb`](../../prototypes/3d_scenery/devil_square.glb) | `src/client/dev_viewer/models/events/devil_square.glb` | Piso circular de granito, pentagrama rúnico, grade ciclópica, quatro totens de crânios e pedestal do triunfo. |
| `EVT_03` — Chaos Castle | [`chaos_castle.glb`](../../prototypes/3d_scenery/chaos_castle.glb) | `src/client/dev_viewer/models/events/chaos_castle.glb` | 36 lajes nomeadas individualmente, abismo, barreira visual translúcida e ruínas góticas suspensas. |
| `EVT_04` — Coliseu de Duelos | [`duel_coliseum.glb`](../../prototypes/3d_scenery/duel_coliseum.glb) | `src/client/dev_viewer/models/events/duel_coliseum.glb` | Arena octogonal, tablado de mármore, quatro níveis de arquibancada, arcadas, barreira e placar geométrico. |

Regeneração reproduzível com `npm run build:event-glb` (`tools/event_arena_models.mjs` + `tools/export_event_arenas.mjs`). Os GLBs são sincronizados byte a byte entre as pastas de protótipos e do viewer.

---

## 2. DETALHAMENTO ARQUITETÔNICO & LEVEL DESIGN DOS 4 CENÁRIOS

### 2.1 `EVT_01` — Blood Castle: A Ponte de Martírio do Arcanjo
- **Dimensão:** $120\times18\text{ m}$ (Percurso Linear Estrito)
- **High Concept:** Uma ponte colossal de pedra gótica suspensa sobre um vácuo cósmico rubro infinito. Os jogadores têm **15 minutos** para atravessar a ponte infestada por centenas de monstros, estilhaçar o Portão do Castelo com ataques pesados, derrotar os Feiticeiros do Caos no pátio interior e devolver a Arma Celestial ao Arcanjo ferido.
- **POIs Centrais:**
  - **A Ponte dos Arcanjos Lamentantes:** Passarela de pedra com 12 metros navegáveis ladeada por 16 estátuas colossais de mármore de arcanjos com asas quebradas e espadas fincadas no solo.
  - **O Portão de Ferro do Castelo de Sangue:** Barreira monumental com 15.000.000 HP a 80m do início, protegida por um escudo de raios vermelhos crepitantes.
  - **O Altar do Arcanjo Caído:** No fim da ponte, uma estátua viva do Arcanjo ferido em armadura dourada estilhaçada, aguardando a entrega da Arma Divina para conceder a bênção do triunfo.
- **Colisores Físicos:**
  - Parapeitos da ponte: Barreiras baixas de pedra gótica ($h=1.2\text{ m}$) ao longo de $x=\pm9.0\text{ m}$ prevenindo quedas acidentais mas permitindo projéteis arcanos livres.
  - 16 estátuas de arcanjos: Cilíndricos $r=1.2\text{ m}$, $h=8.0\text{ m}$.
  - Portão do Arcanjo: Colisor dinâmico $Box(w=18.0, h=8.0, d=1.5)$ que desaba em poeira física após destruição.

### 2.2 `EVT_02` — Devil Square: A Praça Circular da Carnificina Pentagramal
- **Dimensão:** $50\times50\text{ m}$ (Arena Fechada Circular)
- **High Concept:** Uma arena circular selada por grades de ferro ciclópicas onde até 10 jogadores enfrentam **4 ondas sucessivas de monstros crescentes** durante 20 minutos ininterruptos. A densidade de monstros é máxima, exigindo sinergia perfeita entre cavaleiros defensivos, magos de área e caçadoras curadoras.
- **POIs Centrais:**
  - **O Pentagrama de Fogo Negro:** Entalhe rúnico gigante no piso de lajes de granito que pulsa em chamas esmeraldas e douradas a cada nova onda de monstros.
  - **4 Pilares de Crânios Vomitadores:** Totens de pedra de 6 metros nos quatro quadrantes expelindo jatos de fogo que varrem setores da arena a intervalos regulares.
  - **Pedestal do Baú de Ouro do Triunfo:** Emerge no centro da praça no último segundo com a chuva de joias (*Bless*, *Soul*, *Chaos*) para todos os sobreviventes.
- **Colisores Físicos:**
  - Muralha circular de grades de ferro: Cilíndrico oco rígido intransponível $r=24.5\text{ m}$.
  - 4 pilares de crânios: Cilíndricos $r=1.4\text{ m}$, $h=6.0\text{ m}$ distribuídos em raio de $15.0\text{ m}$.

### 2.3 `EVT_03` — Chaos Castle: O Coliseu Suspenso das Lajes Desabantes
- **Dimensão:** $42\times42\text{ m}$ (Arena Dinâmica que Encolhe para $28\times28\text{ m}$ e $14\times14\text{ m}$)
- **High Concept:** O clássico formato Battle Royale medieval do Continent of Legend. Até 50 participantes (jogadores e monstros) entram com a **Armadura do Caos Idêntica**, tornando impossível distinguir visualmente quem é jogador e quem é monstro.
- **Mecânica das Lajes Móveis (Encolhimento da Arena):**
  - Conforme o número de combatentes cai (a cada 40 mortes), o anel periférico de lajes de pedra estremece com efeitos sísmicos e **desaba no abismo cósmico**.
  - A arena reduz sucessivamente de $42\times42\text{ m}$ para $28\times28\text{ m}$ e finalmente para o tablado central de $14\times14\text{ m}$.
  - Monstros ao morrerem explodem em uma onda de choque que arremessa inimigos próximos para trás, permitindo derrubar adversários para fora das bordas da arena.
- **Colisores Físicos:**
  - Matriz de $6\times6$ lajes modulares com volume de colisão individual de $7.0\times7.0\text{ m}$. Cada anel externo tem seus colisores desativados conforme as lajes despencam.
  - Vazio cósmico perimetral: Queda fatal imediata que encerra a participação no evento.

### 2.4 `EVT_04` — Coliseu de Duelos: A Grande Arena da Glória
- **Dimensão:** $36\times36\text{ m}$ (Arena Octogonal com Arquibancadas)
- **High Concept:** O espaço arquitetônico formal para a disputa da maestria marcial 1v1. Projetado como um anfiteatro romano com arcos góticos, onde combatentes se enfrentam sob os olhares de centenas de espectadores sentados nas arquibancadas protegidas por barreiras de energia mágica.
- **POIs Centrais:**
  - **Tablado Central de Luta:** Plataforma octogonal elevada a +1.0m de altura com piso de mármore venado em perfeito polimento especular.
  - **Placar Holográfico Mágico:** Projeção tridimensional flutuante a 8 metros de altura exibindo os nomes, classes, barras de vida relativas e o placar em formato "Melhor de 10 Abates".
  - **Cúpula de Barreira Transparente:** Domo de força mágica dourada que impede interferência externa de feitiços de espectadores.
- **Colisores Físicos:**
  - Degraus perimetrais do tablado octogonal: Chanfros em $45^\circ$ com $h=1.0\text{ m}$.
  - Barreira de força perimetral: Cilíndrico $r=17.5\text{ m}$, intransponível para magias e jogadores.

---

## 3. ESPECIFICAÇÃO DE ILUMINAÇÃO & SHADERS AAA

1. **Blood Castle — O Céu do Martírio:**
   - Céu crepuscular com nebulosa carmesim dinâmica (`#991b1b` e `#f43f5e`) e 300 estrelas cadentes periódicas.
   - Iluminação dramática com raios de luz divina (*God Rays*) cortando a penumbra através das asas de mármore das estátuas.
2. **Chaos Castle — Shaders de Dissolução das Lajes:**
   - Transição de desabamento com efeito de fragmentação procedural (*Voronoi Fracture / Niagara Meshes*) gerando cascalho e poeira caindo no vácuo com aceleração de gravidade real $g=9.81\text{ m/s}^2$.
3. **Coliseu de Duelos — Shaders de Holograma & Placar:**
   - Shader de pós-processamento de holograma com linhas de varredura (*scanlines*) sutis, pulsações de luminescência e transparência aditiva bicromática dourada e safira.
