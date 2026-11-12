# DOCUMENTO DE LEVEL DESIGN & WORLD BUILDING: VALLEY OF LOREN (A FORTALEZA DO CASTLE SIEGE)

> **Projeto:** Dasi (Continent of Legend Reimagined)  
> **Status:** Especificação Técnica & Artística de Level Design (v1.0)  
> **Ambiente:** A Fortaleza de Guerra & O Vale de Loren (*Castle Siege*)  
> **Material Canônico de Estudo:** `reference/mu_roxgaming_5.2/client/Data/World31/` (EncTerrain31.att, EncTerrain31.obj)  
> **Público-Alvo:** Level Designers, Environment Artists, Lighting Artists, Engenheiros de Rede e Gameplay Designers de PvP  

---

## 1. VISÃO GERAL & HIGH CONCEPT DA ZONA

O **Valley of Loren (A Fortaleza do Vale de Loren)** é o epicentro do combate militar e político em grande escala de Dasi. Construído em um desfiladeiro alpino ladeado por picos inexpugnáveis, o castelo é uma maravilha de engenharia defensiva medieval-gótica concebida para resistir a meses de cerco ininterrupto. Semanalmente, as maiores alianças de guildas do servidor travam aqui a batalha máxima de 90 minutos pelo controle da coroa, do tesouro tributário continental e da lendária *Land of Trials*.

```
                                [ CAMPO DE GUERRA DOS ATACANTES ]
                                (Catapultas, Torres de Assédio, Spawns)
                                                 │
                                                 ▼
                                ┌────────────────────────────────┐
                                │ PORTÃO 1: O GRANDE BALUARTE    │
                                │ (Portão de Ferro, Balistas)    │
                                └────────────────┬───────────────┘
                                                 │
                                                 ▼
                                ┌────────────────────────────────┐
                                │ PÁTIO DAS ESTÁTUAS DA VIDA     │
                                │ (4 Estátuas Arcanas de Respawn)│
                                └────────────────┬───────────────┘
                                                 │
                                                 ▼
                                ┌────────────────────────────────┐
                                │ A PONTE LEVADIÇA DO ABISMO     │
                                │ (Fosso de Lava, Gargalo Letal) │
                                └────────────────┬───────────────┘
                                                 │
                                                 ▼
                                ┌────────────────────────────────┐
                                │ O SALÃO DO TRONO REAL          │
                                │ (2 Pedestais & O Selo da Coroa)│
                                └────────────────────────────────┘
```

### 1.1 Identidade Visual & Tom Emocional
- **Paleta de Sensações:** Épica marcial avassaladora, tensão extrema de cooperação em aliança, glória conquistada no sangue e supremacia dinástica.
- **Arquitetura:** Alvenaria ciclópica em blocos de granito escurecido de 3 metros de espessura, ameias e seteiras para arqueiros, portões monumentais de ferro fundido reforçados com vigas de carvalho negro, fossos de lava com pontes de engrenagens mecânicas e o opulento mármore imperial branco venado de dourado no salão do trono.
- **Contraste de Iluminação:** Céu crepuscular tempestuoso com relâmpagos violetas e fumaça volumétrica escura de fogueiras e pez em chamas, cortado pelo fulgor celeste azul-safira das 4 Estátuas da Vida (`#38bdf8`) e o brilho ardente do fosso de lava abaixo da ponte levadiça (`#ef4444`).

---

## 2. TOPOGRAFIA & PROGRESSÃO LINEAR DE 5 SETORES DEFENSIVOS

A fortaleza é projetada em um funil militar progressivo de 400 metros de extensão linear:
- **Setor 1 — Campo de Guerra (+0m):** Planície de aproximação aberta de 80m de largura para posicionamento de máquinas de cerco e reunião de exércitos.
- **Setor 2 — Baluarte do Primeiro Portão (+8m):** Desfiladeiro estreito ladeado por parapeitos elevados onde os defensores disparam flechas e feitiços de chuva de gelo.
- **Setor 3 — O Pátio das Estátuas (+16m):** Ampla praça fortificada de $70\times50\text{ m}$ abrigando os 4 obeliscos das Estátuas da Vida que garantem imunidade temporária e respawn avançado.
- **Setor 4 — A Ponte Levadiça do Abismo (+24m):** Passarela estreita de 6 metros de largura cruzando um abismo de 30 metros com lava incandescente. O ponto de maior densidade de baixas da batalha.
- **Setor 5 — O Salão do Trono Real (+32m):** Santuário supremo de mármore e ouro onde apenas os líderes e sub-líderes podem entrar para selar a vitória no Trono Imperial.

---

## 3. ZONEAMENTO DETALHADO & OS 5 CENÁRIOS DO CERCO

### 3.1 `VOL_01` — Campo de Guerra & Acampamento das Alianças Atacantes
- **Dimensão:** $80\times60\text{ m}$ (Área Segura e Spawn dos Atacantes)
- **POIs Centrais:**
  - 3 catapultas de cerco em madeira maciça com contrapesos de pedra prontos para arremessar barris de pez inflamável.
  - Tendas de comando de campanha com mapas táticos e estandartes das guildas atacantes.
  - Trincheiras de terra batida com estacas pontiagudas de proteção.
- **Colisores Físicos:**
  - 3 catapultas: Caixas rígidas de $6.0\times4.0\text{ m}$, $h=5.5\text{ m}$.
  - Paliçadas perimetrais: Barreiras estáticas contínuas.

### 3.2 `VOL_02` — Primeiro Baluarte & Portão Ciclópico de Ferro
- **Dimensão:** $60\times40\text{ m}$
- **POIs Centrais:**
  - **O Grande Portão de Ferro 1:** Estrutura monumental de 10 metros de altura com 25.000.000 de HP. Resiste a ataques normais, vulnerável a golpes de demolição de cavaleiros e catapultas.
  - Duas torres de menagem com plataformas elevadas para atiradores a +12m.
  - Rastrilhos de ferro intermediários ativáveis pelos defensores via alavancas.
- **Colisores Físicos:**
  - Portão destrutível: $Box(x=0, z=-15, w=8.0, h=10.0, d=1.2)$ com colisão dinâmica que desativa ao ser destruído.
  - Torres de menagem: Cilíndricos $r=3.5\text{ m}$ em $x=\pm18\text{ m}$.

### 3.3 `VOL_03` — Pátio das Estátuas da Vida
- **Dimensão:** $70\times50\text{ m}$
- **POIs Centrais:**
  - **As 4 Estátuas da Vida:** Monumentos de mármore branco esculpidos na forma de arcanjos curadores. Enquanto ativas, concedem aos defensores escudo de invulnerabilidade ao ressurgir e reduzem o tempo de respawn em 50%.
  - 2 canhões defensivos automáticos de muralha que disparam salvas de artilharia mágica em área nos invasores.
- **Colisores Físicos:**
  - 4 Estátuas da Vida destrutíveis: Cilíndricos $r=1.8\text{ m}$, $h=7.0\text{ m}$ em pedestais de granito de $3.5\times3.5\text{ m}$.
  - Muralhas laterais: Muros contínuos de 4 metros de espessura.

### 3.4 `VOL_04` — O Gargalo da Ponte Levadiça sobre o Fosso de Lava
- **Dimensão:** $50\times30\text{ m}$
- **POIs Centrais:**
  - **Ponte Levadiça de Aço & Carvalho:** Passarela estreita de 6 metros de largura por 24 metros de comprimento sobre o abismo de lava fluida.
  - Duas caldeiras de pez fervente nas ameias superiores capazes de derramar fogo líquido na ponte a cada 45 segundos.
  - Correntes de tração com engrenagens gigantes expostas nas torres de apoio.
- **Colisores Físicos:**
  - Parapeitos da ponte: Barreiras baixas de ferro ($h=1.1\text{ m}$) que impedem quedas involuntárias mas permitem empurrões por feitiços (*knockback*).
  - Vazio do fosso de lava: Zona de morte instantânea caso o jogador seja projetado fora da ponte.

### 3.5 `VOL_05` — O Salão do Trono Real & O Selo da Coroa
- **Dimensão:** $45\times45\text{ m}$ (Câmara Máxima de Conquista)
- **POIs Centrais:**
  - **O Trono Imperial:** Assento de mármore e ouro maciço sobre um estrado de 7 degraus. No encosto está o **Selo da Coroa**, um artefato que requer **30 segundos ininterruptos de canalização** pelo Mestre da Guilda Atacante.
  - **Dois Pedestais Sagrados de Apoio:** Posicionados à esquerda e direita do trono. Devem ser mantidos ativados simultaneamente por dois sub-líderes para que o escudo protetor do trono se dissipe.
  - Colunas dóricas de alabastro venado de ouro que sustentam uma cúpula envidraçada por onde a luz lunar incide diretamente sobre o trono.
- **Colisores Físicos:**
  - Estrado e Trono Real: Caixa composta de $6.0\times5.0\text{ m}$, $h=4.5\text{ m}$.
  - 2 pedestais laterais: Cilíndricos $r=1.0\text{ m}$, $h=1.2\text{ m}$ em $x=\pm12\text{ m}$.
  - 8 colunas de alabastro: Cilíndricos $r=1.2\text{ m}$, $h=10.0\text{ m}$.

---

## 4. SISTEMA DE REGRAS & ECONOMIA DO SENHOR DO CASTELO

1. **Ciclo Semanal de Conquista (Domingo, 20:00 - 21:30):**
   - 90 minutos de guerra contínua transmitida via placar de pontuação ao vivo para todo o continente.
   - Vitórias concedem a posse da fortaleza até a manutenção do próximo domingo.
2. **Privilégios da Guilda Vencedora:**
   - **Tributo Continental:** Coleta automática de 3% a 7% de todo o ouro (*Zen*) transacionado em lojas de NPCs em Lorencia, Noria e Devias.
   - **Acesso Exclusivo à Land of Trials:** Zona secreta de caça com monstros exclusivos (*Erohim*, *Axe Hero*) com probabilidade 300% maior de dropar joias e itens ancestrais (*Ancient Items*).
   - **Manta do Soberano Supremo:** O Mestre da Guilda recebe a lendária capa com asas douradas e bônus de status enquanto mantiver a coroa.
