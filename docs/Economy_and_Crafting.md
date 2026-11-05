# ECONOMIA, FORJA DO CAOS E COMÉRCIO — DASI

> **Coração do Jogo:** Uma economia viva e descentralizada, onde não existem itens "ligados à conta" (*Soulbound*) que impeçam o comércio livre. As joias são a moeda fiduciária universal e a Máquina do Caos é o grande moedor de risco e recompensa.

---

## 1. AS JOIAS SAGRADAS (A MOEDA REAL DO JOGO)

Em Dasi, o ouro convencional (*Zen*) serve para custos de teletransporte, poções e reparos. No entanto, a verdadeira economia entre jogadores gira em torno das **Joias Preciosas**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AS JOIAS DO CONTINENTE                          │
├─────────────────────┬──────────────┬───────────────────────────────────┤
│ JOIA                │ CHANCE / USO │ COMPORTAMENTO NO JOGO             │
├─────────────────────┼──────────────┼───────────────────────────────────┤
│ Jewel of Chaos      │ Catalisador  │ Essencial para todas as receitas  │
│ Jewel of Blessing   │ 100% (+0..+6)│ Moeda padrão ("10B = 10 Bless")   │
│ Jewel of Soul       │ 50% / 75%    │ Refino de +7 até +9 (Risco de quebra) │
│ Jewel of Life       │ 50% de soma  │ Adiciona Opção +4 até +28/32      │
│ Jewel of Creation   │ Matéria-Prima│ Forja de Frutas e Montarias       │
│ Jewel of Harmony    │ 80% de união │ Concede Opções Amarelas Avançadas │
└─────────────────────┴──────────────┴───────────────────────────────────┘
```

### 1.1 O Sagrado Feedback Sonoro
- Ao dropar de qualquer monstro, a joia toca um **sino cristalino estéreo** que soa com prioridade máxima sobre o canal de música e combate.
- Um feixe de luz vertical de 10 metros sobe aos céus, visível mesmo através da névoa do mapa.

---

## 2. A MÁQUINA DO CAOS (THE CHAOS GOBLIN CRAFTER)

Localizada no coração de Feywood (*Noria*), aos cuidados do Artífice Gnômico do Caos.

### 2.1 O Drama Visual da Forja
A forja não é apenas uma janela de menu 2D:
1. O jogador posiciona os itens na mesa de alquimia mágica.
2. O Gnômico puxa uma alavanca mecânica gigantesca com esforço visível.
3. Arcos voltaicos e fumaça rodopiam no recipiente central.
4. **Resultado de Sucesso:** Clarão dourado, coro triunfal de trombetas e o item surge levitando com brilho resplandecente.
5. **Resultado de Falha:** Uma explosão de fuligem preta com estalo metálico de vidro partindo, fazendo o Gnômico tossir e os materiais serem reduzidos a cinzas.

### 2.2 Tabela de Risco e Receitas Canônicas da Máquina do Caos

| Refinamento / Receita | Taxa Base de Sucesso | Ingredientes Obrigatórios | Penalidade em Caso de Falha |
| :--- | :--- | :--- | :--- |
| **Upgrade +10** | 60% (75% com Luck) | Item +9 + 1x Jewel of Bless + 1x Jewel of Soul + 1x Jewel of Chaos | Item retorna para +9 ou quebra |
| **Upgrade +11** | 55% (70% com Luck) | Item +10 + 2x Jewel of Bless + 2x Jewel of Soul + 1x Jewel of Chaos | Item perde níveis |
| **Upgrade +12** | 50% (65% com Luck) | Item +11 + 3x Jewel of Bless + 3x Jewel of Soul + 1x Jewel of Chaos | Item perde níveis |
| **Upgrade +13** | 45% (60% com Luck) | Item +12 + 4x Jewel of Bless + 4x Jewel of Soul + 1x Jewel of Chaos | Risco total de destruição |
| **Upgrade +14** | 40% (55% com Luck) | Item +13 + 5x Jewel of Bless + 5x Jewel of Soul + 1x Jewel of Chaos | Risco total de destruição |
| **Upgrade +15** | 35% (50% com Luck) | Item +14 + 6x Jewel of Bless + 6x Jewel of Soul + 1x Jewel of Chaos | Risco total de destruição |
| **Armas do Caos (`CHAOS_WEAPON`)** | Até 100% | 1x Item +4/opt4+ + 1x Jewel of Chaos + 1x Bless/Soul | Redução a cinzas |
| **Asas Tier 1 (`FIRST_WING`)** | Até 90% | 1x Arma do Caos +4/opt4+ + 1x Jewel of Chaos | Destruição de todos os ingredientes |
| **Asas Tier 2 (`SECOND_WING`)** | Até 90% | 1x Asas T1 + 1x Loch's Feather (ou Crest of Monarch) + 1x Jewel of Chaos | Perda da Pena e Joias (Asas T1 podem ser destruídas) |
| **Asas Tier 3 (`THIRD_WING`)** | Até 40% | 1x Asas T2 +9/opt4+ + 1x Condor Feather + 1x Condor Flame + 1x Jewel of Chaos + 1x Jewel of Creation + 10x Bless + 10x Soul | Destruição de todos os itens raros |
| **Criação de Frutas (`FRUIT_CREATION`)** | 90% fixo | 1x Jewel of Creation + 1x Jewel of Chaos | Destruição das joias |

---

## 3. MERCADORES OFICIAIS (NPC SHOPS)

O ecossistema de Dasi conta com mercadores autênticos espalhados pelos biomas canônicos, oferecendo suporte vital para aventureiros de todas as classes:

1. **Ferreiro Han (`blacksmith_han` - Lorencia):**
   - Fornece armas básicas de corte, cajados iniciais, adagas e o clássico conjunto Leather (+0).
2. **Pupa das Poções (`potion_girl_pupa` - Lorencia):**
   - Venda de Poções de Vida e Mana (Pequena/Média), Antídotos contra veneno e Pergaminhos de Portal da Cidade (*Town Portal Scroll*).
3. **Lumen the Barmaid (`lumen_barmaid` - Lorencia):**
   - Oferece hidromel e cervejas encorpadas (*Ale Beer*), poções de reforço e anéis de proteção elementar.
4. **Craftsman Eo (`craftsman_eo` - Noria Feywood):**
   - Especialista elfico: arcos leves, bestas elegantes, armaduras de seda (*Silk Set*) e aljavas de flechas abençoadas.
5. **Wandering Merchant Alex (`alex_merchant` - Devias Boreal):**
   - Comerciante de alta blindagem: conjunto Plate completo (+0), escudos reforçados de aço e lâminas de cristal afiadas.

### 3.1 Venda de Itens e Avaliação Autoritativa
O jogador pode vender qualquer item do inventário para um mercador através do opcode de rede `0x74:0x03` (`MSG_NPC_SHOP_SELL_REQ`), recebendo Zen baseado na raridade, patamar, refino (+0 a +15), sorte e opções excelentes. Joias sagradas possuem cotação premium ao serem vendidas diretamente aos NPCs.

---

## 4. CAIXAS DE KUNDUN (BOX OF KUNDUN +1 A +5) E FRUTAS MÁGICAS

As relíquias do lorde do caos dropadas por criaturas douradas e chefes mundiais garantem saques de equipamentos com propriedades excelentes:

- **Box of Kundun +1:** Sets Leather, Pad, Vine, Small Dagger, Short Sword, Ring of Ice.
- **Box of Kundun +2:** Sets Bronze, Bone, Silk, Scale, Blade, Falchion, Elven Bow, Angelic Staff.
- **Box of Kundun +3:** Sets Brass, Plate, Sphinx, Wind, Spirit, Chaos Weapons, Broad Sword, Crystal Sword.
- **Box of Kundun +4:** Sets Dragon, Legendary, Guardian, Storm Crow, Dark Steel, Dragon Blade, Kundun Staff.
- **Box of Kundun +5:** Sets Black Dragon, Dark Phoenix, Great Dragon, Grand Soul, Dark Soul, Divine, Hurricane, Dark Master, Archangel Weapons, Solay Scepter, Grand Viper Staff.

### 4.1 Consumo de Frutas Mágicas
Criadas via Jewel of Creation na Máquina do Caos, as frutas de Força, Agilidade, Vitalidade, Energia e Comando concedem de +1 a +3 pontos de atributos **permanentes** ao serem saboreadas (duplo clique ou opcode `0x75:0x03`).

---

## 3. MERCADO LIVRE & LOJAS IMERSIVAS NA PRAÇA

Dasi abandona menus genéricos e impessoais de casa de leilão isolada. Em vez disso, estimulamos o **comércio social e vivo**:

1. **Bazar da Praça Central (Loren):**
   - Ao ativar o modo "Loja Pessoal", o personagem senta em um tapete ou banco de madeira e arma uma tenda estilizada.
   - Uma placa de madeira rústica com o nome da loja e as principais ofertas flutua com iluminação acolhedora sobre a tenda.
   - Outros jogadores podem aproximar-se e ver os modelos 3D dos itens girando no balcão em tamanho reduzido.
2. **Moeda Direta na Vitrine:**
   - O vendedor pode estipular preços diretamente em **Joias da Bênção (Bless)** ou **Joias da Alma (Soul)**, além de moedas de ouro normais (*Zen*).
   - O sistema de troca direta (*Trade Window*) possui dupla confirmação com contagem regressiva de segurança de 3 segundos para evitar golpes (*scams*).
