# DOCUMENTO DE LEVEL DESIGN & WORLD BUILDING: FORTALEZA GÉLIDA DE BOREAL (DEVIAS)

> **Projeto:** Dasi (Inspirado no Continent of Legend - MU Online)  
> **Status:** Especificação Técnica & Artística de Level Design (v1.0)  
> **Ambiente:** Fortaleza Gélida de Boreal (*Devias Reimaginada*)  
> **Público-Alvo:** Level Designers, Environment Artists, Lighting Artists e Technical Shaders  

---

## 1. VISÃO GERAL & HIGH CONCEPT DA ZONA

A **Fortaleza Gélida de Boreal** é uma cidadela ciclópica de pedra cinzenta cravada nas encostas da cordilheira setentrional de Dasi, perpetuamente açoitada por uma nevasca polar brutal. Muito além de um simples mapa de neve, Boreal é um monumento à sobrevivência humana e mágica: suas muralhas gigantescas sustentam braseiros monumentais a óleo de leviatã para impedir que os portões congelem, enquanto a grande Catedral Gótica de Boreal oferece refúgio espiritual e calor místico aos peregrinos e guerreiros que buscam enfrentar os horrores do norte.

Nas terras ermas além da muralha, o gelo glacial milenar esconde as ruínas do antigo império sepultado, guardadas por Yetis colossais, Golens de Gelo rúnicos e pelo palácio congelado da **Rainha de Gelo (Ice Queen)**.

### 1.1 Identidade Visual & Tom Emocional
- **Paleta de Cores:** Branco espectral da neve fresca (#F0F8FF), azul glacial profundo com espalhamento subsuperficial (#00557F a #00A6D6), cinza ardósia das pedras góticas (#363D45) e o laranja incandescente e acolhedor das chamas dos braseiros (#FF6600 a #FFAA33).
- **Arquitetura:** Gótico nórdico severo — arcos ogivais reforçados com contrafortes de granito maciço para resistir à pressão da neve acumulada, torres com cúpulas afiadas projetadas para cortar o vento, vitrais blindados com padrões de runas protetoras contra o congelamento e estátuas de gárgulas com estalactites pontiagudas de gelo pendendo de suas asas.
- **Sensação de Sobrevivência Térmica:** Contraste absoluto entre a tempestade cortante do lado exterior (visibilidade reduzida, som ensurdecedor de vento polar, acúmulo de geada sobre as armaduras) e o conforto silencioso, solene e aquecido do interior da Igreja Gótica e das hospedarias da fortaleza.

---

## 2. TOPOGRAFIA & MACRO-LAYOUT

O mapa mede **2048m x 2048m**, com declives acentuados, desfiladeiros de ventania constante e calotas glaciais translúcidas:
- **O Desfiladeiro do Sul (+0m a +15m):** Rota de acesso vinda de Lorencia; um cânion estreito de rocha escarpada onde a neve começa a cobrir a lama.
- **O Platô da Cidadela (+25m a +35m):** Cidade fortificada construída sobre uma base rochosa elevada, cercada por fosso seco congelado e pontes levadiças com caldeiras de degelo.
- **As Estepes Polares & Floresta Congelada (+20m a +45m):** Vastas extensões de neve fofa, pinheiros petrificados pelo gelo e lagos congelados com rachaduras profundas.
- **O Vale dos Gigantes & Cume da Rainha (+50m a +85m):** As alturas mais gélidas do mapa, onde a tempestade atinge o grau de Whiteout (tempestade branca) e culmina no Castelo Interior da Rainha de Gelo.

```
                                [ CASTELO INTERIOR DA RAINHA DE GELO ]
                                (Arena do Chefe: Lago de Gelo Translúcido)
                                                  ▲
                                                  │
                        ┌─────────────────────────┴─────────────────────────┐
                        │              O VALE DOS GIGANTES                  │
                        │      (Gigantes de Gelo & Assassinos Espectrais)    │
                        └─────────────────────────┬─────────────────────────┘
                                                  │
                                                  ▼
                        ┌───────────────────────────────────────────────────┐
                        │            AS PLANÍCIES DA NEVASCA ETERNA         │
                        │       (Matilhas de Yetis das Neves & Verme de Gelo)│
                        └─────────────────────────┬─────────────────────────┘
                                                  │
                                                  ▼
  [ O GRANDE POSTO DA GUARDA ]          ┌─────────────────┐          [ A IGREJA GÓTICA ]
  (Bastião Ocidental de Arqueiras) ◄────┤  PRAÇA CENTRAL  ├─────►    (Catedral Glacial,
                                        │   DE BOREAL     │          Santuário Sagrado,
                                        │  (Braseiro Rei) │          Cura & Ponto Neutro)
                                        └────────┬────────┘
                                                 │
                                                 ▼
                        ┌────────────────────────┴─────────────────────────┐
                        │      O GRANDE PORTÃO SUL DE LORENCIA             │
                        │     (Muralha Cyclópica & Caldeiras de Degelo)    │
                        └────────────────────────┬─────────────────────────┘
                                                 │
                                                 ▼
                                     [ DESFILADEIRO VENTOSO ]
                                 (Estrada de Conexão com Lorencia)
```

---

## 3. ZONEAMENTO DETALHADO (POINTS OF INTEREST - POIs)

### 3.1 POI 1: A Cidadela de Boreal & O Grande Braseiro Rei (Safe Zone Central)
- **Função:** Ponto de encontro, comércio de armas nórdicas, leilão de peles e joias, e base de expedições de alto nível.
- **O Braseiro Rei (The King's Hearth):**
  - No centro da praça ergue-se uma estrutura de ferro fundido de 12 metros de altura sobre um pedestal de granito rúnico.
  - Alimenta uma fogueira mágica inextinguível à base de óleo de leviatã extraído em Atlans.
  - **Mecânica Visual e Térmica:**
    - Em um raio de 25 metros ao redor do braseiro, a neve do chão derrete em tempo real (controlada pelo parâmetro de distância no shader de terreno), criando paralelepípedos molhados e fumegantes com reflexos alaranjados.
    - Personagens dentro deste raio têm o efeito de geada em suas armaduras descongelado gradativamente (efeito de transição no shader de personagem).
- **NPCs e Estruturas de Serviço:**
  - *Comandante Vane (Mestre de Armas Nórdico):* Venda de alabardas, machados de guerra pesados e armaduras forjadas com aço frio (*Cold Iron*).
  - *Mercadora Freja:* Venda de poções térmicas que reduzem os efeitos de lentidão causados pelo frio.
  - *O Banco Subterrâneo de Granito:* Um cofre escavado no permafrost onde os tesouros dos aventureiros são mantidos trancados sob chaves de ferro fundido.

### 3.2 POI 2: O Grande Portão Sul de Lorencia
- **Arquitetura Defensiva:**
  - A entrada triunfal na província do norte. Uma muralha dupla de 20 metros de espessura talhada diretamente na rocha da montanha.
  - Portas colossais de madeira de cedro vermelho reforçadas com lâminas de ferro negro.
  - Acima do arco do portão, duas caldeiras gigantes vertem óleo incandescente periodicamente em canaletas esculpidas nas pedras para quebrar as estalactites de gelo que ameaçam bloquear a engrenagem do portão.
- **Sentinelas de Boreal:**
  - Soldados encapuzados com pesados mantos de pele de urso polar, portando escudos de torre e lanças de ponta dupla.
  - O portão é guarnecido com tochas protegidas por gaiolas de bronze para resistir às rajadas de vento do desfiladeiro.

### 3.3 POI 3: A Igreja Gótica de Boreal (Catedral do Manto Glacial)
- **Conceito & Espiritualidade:**
  - O refúgio mais seguro do mapa, imune a invasões e PvP. Uma obra-prima do gótico glacial construída pelos primeiros monges arcanos.
- **Interior & Arquitetura Sagrada:**
  - **Abóbada de Cruzaria Imponente:** Teto de 28 metros de altura sustentado por colunas esguias de pedra branca e mármore venado de azul.
  - **Os Vitrais Glaciais:** Painéis monumentais de vidro e cristal de gelo infundido com magia arcana, retratando a vitória dos arcanjos sobre os demônios do abismo durante a Guerra do Caos. Quando a luz da lua atinge os vitrais, raios de luz azul-celeste e anil cortam a penumbra interna iluminando partículas de incenso em suspensão.
  - **Pia Batismal de Água Térmica:** No altar, uma pia de água sagrada permanentemente fumegante restaura instantaneamente os pontos de mana de quem ajoelha diante dela.
  - **Confessionários de Carvalho:** Nichos esculpidos nas paredes laterais onde monges cegos oferecem orações e concedem bênçãos sagradas antes das caçadas.

### 3.4 POI 4: O Castelo Interior da Rainha de Gelo (Ice Queen Boss Arena)
- **Localização:** No cume mais alto da cordilheira, protegido por um abismo transpassado apenas por uma ponte de gelo puro e translúcido.
- **A Arena de Combate:**
  - Um pátio circular de 60 metros de diâmetro formado por uma laje maciça de gelo glacial de 15 metros de espessura sobre um lago subterrâneo congelado.
  - **Piso Glacial Reflexivo & Escorregadio:**
    - O gelo possui acabamento altamente especular com dispersão de luz subsuperficial profunda (*Subsurface Scattering*).
    - O coeficiente de atrito do chão é reduzido em 35%: arrancadas bruscas e esquivas exigem controle preciso de inércia por parte do jogador.
  - **Pilares de Cristal Glacial Destrutíveis:**
    - Oito pilares de gelo ancestral circundam a arena. Durante o combate com a Rainha de Gelo, seus feitiços de estilhaçamento (*Frost Shatter*) podem destruir os pilares, gerando chuvas de projéteis pontiagudos e eliminando pontos de cobertura dos jogadores.
- **Mecânica Ambiental da Arena: A Valsa da Nevasca (Phase 2):**
  - A Rainha flutua até o centro da arena e canaliza a nevasca ártica máxima.
  - A visibilidade na arena cai para 3 metros (Whiteout total via Fog Shader dinâmico). O som ambiente se torna um rugido ensurdecedor de vento polar.
  - Os jogadores devem guiar-se pelo brilho luminescente ciano da coroa espectral da Rainha para desferir ataques e interromper o feitiço antes do congelamento coletivo letal.

---

## 4. ZONAS DE CAÇA & HIERARQUIA DE MONSTROS

A hostilidade climática e a ferocidade das bestas aumentam drasticamente conforme se afasta da segurança das muralhas da Cidadela:

```
[ NÍVEL 25-35 ] Planícies de Neve Fofa: Matilhas de Yetis das Neves
       │
       ▼
[ NÍVEL 35-50 ] Floresta dos Pinheiros Petrificados: Vermes de Gelo & Assassinos Espectrais
       │
       ▼
[ NÍVEL 50-70 ] O Desfiladeiro dos Ventos Uivantes: Gigantes de Gelo Blindados
       │
       ▼
[ BOSS MUNDIAL ] O Trono Glacial: A Rainha de Gelo (Ice Queen)
```

### 4.1 Bestiário Detalhado

1. **Yetis das Neves (Snow Yetis) — Nível 25-36:**
   - **Visual:** Feras bípedes corpulentas de 2,60m de altura, pelagem branca densa suja de sangue congelado e clavas de gelo fóssil amarradas com tendões.
   - **Comportamento & Ataques:**
     - *Batida Sísmica:* Golpeiam a clava no solo de neve compacta, gerando uma onda de choque cônica que atordoa o alvo por 1,5 segundos.
     - *Fúria Berserker:* Ao perderem 50% da vida, seus olhos ardem em vermelho e a velocidade de ataque aumenta em 40%.

2. **Assassinos Espectrais das Sombras de Gelo (Spectral Frost Assassins) — Nível 38-52:**
   - **Visual:** Vultos encapuzados com armaduras de cota de malha congelada e adagas duplas de gelo afiado como navalha.
   - **Mecânica Furtiva:**
     - Utilizam camuflagem ativa na nevasca: seu shader diminui a opacidade para 15% enquanto se movem na tempestade branca, revelando apenas pegadas efêmeras na neve e olhos em brasa azul.
     - *Ataque Pelas Costas (Backstab):* Desferem dano crítico massivo com probabilidade de aplicar o debuff *Hipotermia* (redução contínua de resistência física).

3. **Gigantes de Gelo (Glacial Golems / Frost Titans) — Nível 55-70:**
   - **Visual:** Colossos de 6 metros formados por blocos maciços de granito encastoados em gelo azul milenar, com runas esculpidas em seu núcleo pulsante.
   - **Mecânica de Armadura:**
     - Possuem uma couraça de gelo glacial externo de 2000 pontos de vida com absorção total de dano elemental de frio.
     - O uso de magias de fogo (*Fire Slash*, *Hellfire*, *Dragon Roar*) quebra a casca de gelo rapidamente, expondo a rocha vulnerável abaixo.
     - Ao serem destruídos, seus corpos desmoronam em pedras físicas que rolam morro abaixo causando dano físico a quem estiver na trajetória.

---

## 5. DIRETRIZES DE ILUMINAÇÃO, VOLUMETRIA E TEMPESTADE BRANCA (UE5 / SM 6.0)

| Parâmetro | Boreal Cidadela Interior (Praça) | Boreal Exterior (Estepes da Nevasca) | Igreja Gótica (Interior) |
| :--- | :--- | :--- | :--- |
| **Luz Direcional (Sol/Lua)** | 12.000 Lux (Azul Pálido 8500K) | 6.000 Lux (Cinza Difuso 9000K) | Oclusão 98% (Luz via Vitrais: 800 Lux) |
| **Volumetric Scattering** | 1.8 (Névoa de cristais de gelo) | 4.5 (Nevasca densa cegante) | 1.2 (Feixes através de vitrais e incenso) |
| **Temperatura dos Braseiros** | 1900K a 2200K (Laranja Fogo Quente) | Tochas esporádicas nos postos | 2400K (Velas votivas e candelabros) |
| **Efeito Whiteout (Névoa Dinâmica)** | Desativado na praça | Ativado em rajadas cíclicas (0% a 90%) | Desativado |
| **Partículas de Vento & Flocos** | 5.000 partículas suaves caindo | 45.000 partículas a 65 km/h em ângulo | Partículas de pó dourado e incenso |

---

## 6. PAISAGEM SONORA & ÁUDIO ESPACIAL (SOUND DESIGN)

1. **O Rugido do Vento Polar:**
   - Som contínuo e orgânico de vento soprando contra arestas de pedra gótica, assobiando através de frestas e criando vórtices acústicos em desfiladeiros estreitos.
2. **Física Acústica dos Passos:**
   - Distinção clara e tátil entre:
     - Neve fofa recente (som abafado e crocante: *crunch-crunch*).
     - Gelo rígido de calota (ressonância oca e estalidos agudos: *clack-crack*).
     - Paralelepípedos molhados próximos aos braseiros (*splat-tap* de água derretida).
3. **Sino da Catedral Gótica:**
   - A cada hora do jogo, o sino de bronze de 10 toneladas da catedral toca uma nota profunda em Si Bemol com reverb convolutivo de 6 segundos, audível até o meio das estepes da nevasca, servindo como farol acústico para jogadores perdidos na tempestade.
4. **Trilha Sonora Sinfônica:**
   - Violoncelos graves, coro gregoriano soturno e sinos tibetanos gelados compõem a melodia marcante de solidão heroica e frio inóspito.
