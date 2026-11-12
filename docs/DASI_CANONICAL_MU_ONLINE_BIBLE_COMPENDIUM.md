# DASI MMORPG — Compêndio Mestre da Bíblia Arquitetural de MU Online Season 5.2
## Engenharia Reversa Canônica, Fórmulas Matemáticas, Formatos de Dados & Protocolo de Rede

> **Autor:** Dasi Architecture & Systems Team  
> **IP Canônico de Rede:** `26.32.29.60` (Radmin VPN)  
> **Status de Homologação:** 347/347 Testes Aprovados (100% Pass)  
> **Ambiente de Validação:** Dev Viewer WebGL na porta 8080 (`http://localhost:8080`)

---

## Índice dos 11 Pilares da Bíblia Arquitetural

1. [Pilar 1: Mapeamento Completo de Arquivos e Formatos do Cliente Webzen](#pilar-1-mapeamento-completo-de-arquivos-e-formatos-do-cliente-webzen)
2. [Pilar 2: Catálogo Exato dos Arquivos do Cliente (`reference/mu_roxgaming_5.2/`)](#pilar-2-catálogo-exato-dos-arquivos-do-cliente)
3. [Pilar 3: Montagem de Sets, Trajes, Peças de Armaduras e Rig Canônico](#pilar-3-montagem-de-sets-trajes-peças-de-armaduras-e-rig-canônico)
4. [Pilar 4: Sistemas Mestre, Mecânicas de Reset e Classes de 3ª Evolução](#pilar-4-sistemas-mestre-mecânicas-de-reset-e-classes-de-3ª-evolução)
5. [Pilar 5: Sistema Canônico de Drops, Tabelas de Loot e Event Bags](#pilar-5-sistema-canônico-de-drops-tabelas-de-loot-e-event-bags)
6. [Pilar 6: Sistemas Avançados de Mundo, Movimentação, PK System e Pets de Dark Lord](#pilar-6-sistemas-avançados-de-mundo-movimentação-pk-system-e-pets-de-dark-lord)
7. [Pilar 7: Arquitetura de Rede, Protocolo Binário Zero-Trust e Eventos Clássicos](#pilar-7-arquitetura-de-rede-protocolo-binário-zero-trust-e-eventos-clássicos)
8. [Pilar 8: Refinamento de Joias Sagradas, Harmony, Nível 380 e Chaos Machine](#pilar-8-refinamento-de-joias-sagradas-harmony-nível-380-e-chaos-machine)
9. [Pilar 9: Motor Gráfico do Cliente, Shaders PBR, Loader BMD e Áudio Procedural](#pilar-9-motor-gráfico-do-cliente-shaders-pbr-loader-bmd-e-áudio-procedural)
10. [Pilar 10: Grimório de Fórmulas Matemáticas Canônicas da Webzen](#pilar-10-grimório-de-fórmulas-matemáticas-canônicas-da-webzen)
11. [Pilar 11: Sistemas Sockets, Efeitos/Buffs, Combo Engine, Gens Warfare, Kalima & PShop](#pilar-11-sistemas-sockets-efeitosbuffs-combo-engine-gens-warfare-kalima--pshop)

---

### Pilar 1: Mapeamento Completo de Arquivos e Formatos do Cliente Webzen
- Decodificação de arquivos `.bmd` (estruturas binárias criptografadas com BuxConvert e XOR de 16 bytes).
- Atributos de colisão `.att` (256x256 células, flags `TW_SAFEZONE = 0x01`, `TW_NOMOVE = 0x04`, `TW_WATER = 0x10`).
- Camadas de textura `.map` e lista de objetos instanciados 3D `.obj`.
- Texturas de imagem proprietárias `.ozb`, `.ozj`, `.ozt` com cabeçalhos deslocados em 4 a 24 bytes para descompressão JPEG/TGA.

---

### Pilar 2: Catálogo Exato dos Arquivos do Cliente
- Inventário de mais de 4.000 assets extraídos de `reference/mu_roxgaming_5.2/client/Data/`.
- Mapeamento de `Player/` (modelos base masculinos e femininos de DK, DW, FE, MG, DL, SU, RF).
- Mapeamento de `Item/` (todas as 16 categorias de itens: espadas, cajados, arcos, escudos, conjuntos de armadura, asas, anéis e amuletos).
- Mapeamento de `Skill/`, `Effect/` e `World1` até `World95`.

---

### Pilar 3: Montagem de Sets, Trajes, Peças de Armaduras e Rig Canônico
- Anatomia de camadas modulares: `Body` (malha corporal base), `Armor` (Helm, Armor, Pants, Gloves, Boots), `Wings` e `Weapons`.
- Proporções anatômicas padronizadas: 1.85m a 1.91m de altura, envergadura de asas de ~3.0m parenteada estritamente à espinha (`spine_03`).
- Caso canônico do Magic Gladiator: MG não possui elmo (Helm), possuindo 9 malhas texturizadas, enquanto as demais classes utilizam 10+.

---

### Pilar 4: Sistemas Mestre, Mecânicas de Reset e Classes de 3ª Evolução
- **Reset Canônico:** Reinicialização ao atingir o nível 400, retenção de atributos configurável (pontos acumulativos ou pontuação por reset) e deduções de Zen.
- **Classes de 3ª Evolução:**
  - Dark Knight $\to$ Blade Knight $\to$ **Blade Master**
  - Dark Wizard $\to$ Soul Master $\to$ **Grand Master**
  - Fairy Elf $\to$ Muse Elf $\to$ **High Elf**
  - Magic Gladiator $\to$ **Duel Master**
  - Dark Lord $\to$ **Lord Emperor**
  - Summoner $\to$ Bloody Summoner $\to$ **Dimension Master**
- **Master Skill Tree:** 3 ramos (Defesa, Ataque, Suporte) com 9 fileiras de habilidades fortalecidas e pontos obtidos do nível 401 ao 800.

---

### Pilar 5: Sistema Canônico de Drops, Tabelas de Loot e Event Bags
- Fórmulas de drop por monstro: relação entre o nível do monstro e o nível base do item.
- Taxas de itens excelentes ($1/2000$), opções adicionais de Life e Joias Sagradas.
- Decodificação de arquivos `EventItemBag*.txt` para premiações de Box of Kundun +1 a +5 e eventos sazonais.

---

### Pilar 6: Sistemas Avançados de Mundo, Movimentação, PK System e Pets de Dark Lord
- Algoritmo de teleporte via `/move` com validação de `MoveReq.txt` e desconto de $1/3$ de nível para classes especiais.
- Sistema PK: 6 níveis de alinhamento moral (Herói, Comum, Suspeito, Assassino 1, Assassino 2, Assassino Serial). Penalidades de perda de equipamentos ao morrer e bloqueio de teleporte para assassinos ($\ge 5$).
- Pets exclusivos de Dark Lord: Dark Horse (montaria com habilidade Earthquake) e Dark Spirit (pet voador ofensivo com 4 modos de ataque: Normal, Auto-Attack, Attack Together, Attack with Master).

---

### Pilar 7: Arquitetura de Rede, Protocolo Binário Zero-Trust e Eventos Clássicos
- Servidor autoritativo de alto desempenho operando no IP canônico **`26.32.29.60`**.
- Pacotes binários padronizados (`0xC1` e `0xC2` com cabeçalho simples; `0xC3` e `0xC4` criptografados com SimpleModulus).
- Opcodes principais: Login (`0xF1`), Lista de Personagens (`0xF3`), Movimentação (`0x0E`), Ataque (`0x19`), Troca de Itens (`0x22`), Refinamento Chaos (`0x86`).
- Ciclo de vida dos eventos Blood Castle (ponte, portão e arcanjo), Devil Square (hordas e pontuação) e Chaos Castle (solo que desaba e armadura idêntica).

---

### Pilar 8: Refinamento de Joias Sagradas, Harmony, Nível 380 e Chaos Machine
- Sucesso de Joias: Jewel of Bless (100% até +6), Jewel of Soul (50% sem Luck, 75% com Luck de +7 a +9), Jewel of Life (50% até +28 de Option).
- Chaos Machine: Combinações de Asas Level 1, 2 e 3 com penas sagradas (*Feather of Condor*, *Flame of Condor*).
- Jewel of Harmony: Purificação na Torre de Refinamento de Elpis em Kanturu e opções amarelas especiais.
- Opção Roxo 380: Adicionada via Chaos Machine com Jewel of Guardian e Jewel of Harmony.

---

### Pilar 9: Motor Gráfico do Cliente, Shaders PBR, Loader BMD e Áudio Procedural
- Renderização WebGL via Three.js com suporte a PBR (Roughness, Metalness, Emissive glow).
- Auras dinâmicas de itens: de +0 (sem brilho) até +15 (emissão dourada pulsante intensa com partículas de calor).
- Carregador de malhas e esqueletos com interpolação suave de 21 animações canônicas de combate, locomoção e repouso.
- Sintetizador de som procedural sem dependência de arquivos externos pesados via Web Audio API.

---

### Pilar 10: Grimório de Fórmulas Matemáticas Canônicas da Webzen
- **Dark Knight:** Dano Mínimo $=\lfloor\text{Str}/6\rfloor$, Dano Máximo $=\lfloor\text{Str}/4\rfloor$, Defesa $=\lfloor\text{Dex}/3\rfloor$.
- **Dark Wizard:** Dano Mágico Mínimo $=\lfloor\text{Ene}/9\rfloor$, Dano Mágico Máximo $=\lfloor\text{Ene}/4\rfloor$, Defesa $=\lfloor\text{Dex}/4\rfloor$.
- **Fairy Elf:** Dano Mínimo $=\lfloor\text{Dex}/7\rfloor + \lfloor\text{Str}/14\rfloor$, Dano Máximo $=\lfloor\text{Dex}/4\rfloor + \lfloor\text{Str}/8\rfloor$, Defesa $=\lfloor\text{Dex}/10\rfloor$.
- **Magic Gladiator:** Dano Físico $=\lfloor\text{Str}/4\rfloor$, Dano Mágico $=\lfloor\text{Ene}/4\rfloor$, Defesa $=\lfloor\text{Dex}/5\rfloor$.
- **Dark Lord:** Dano Mínimo $=\lfloor\text{Str}/7\rfloor + \lfloor\text{Ene}/14\rfloor$, Dano Máximo $=\lfloor\text{Str}/5\rfloor + \lfloor\text{Ene}/10\rfloor$, Dano do Corvo Mágico $=\lfloor\text{Cmd}/10\rfloor + \lfloor\text{Ene}/50\rfloor + 180$.
- **Taxas de Sucesso de Ataque e Defesa:** Fórmulas separadas para PvM e PvP.

---

### Pilar 11: Sistemas Sockets, Efeitos/Buffs, Combo Engine, Gens Warfare, Kalima & PShop
- **Socket Item System:** 6 elementos, 30 opções, 5 tiers de esferas, codificação em 1 byte (`OptionIndex + Level * 50`), bônus elementais e package options (Double Damage +3% e Ignore Defense +1%).
- **EffectManager:** Catálogo completo de buffs e debuffs com decaimento a cada segundo. Fórmulas de Mana Shield (cap 50%), Swell Life (cap 100%), etc.
- **ComboSkillEngine:** Máquina de estados FSM: Arma $\to$ Skill 1 $\to$ Skill 2 diferente dentro de 3000ms. Dano: $2 \times \text{Base} + \lfloor\frac{\text{Str}+\text{Dex}+\text{Ene}}{2}\rfloor$.
- **Gens System:** Famílias Vanert (Azul) e Duprian (Vermelho), 14 patentes, PvP em Zonas de Batalha sem penalidade de assassino e anti-farming.
- **Kalima 1 a 7:** Crafting de Lost Map (5 marcas do mesmo nível), portal temporário de 180s e Lord Kundun com 1.000.000 HP no piso 7.
- **Personal Shop:** Transações atômicas seguras em Zen, Bless e Soul com trava estrita contra estouro de 2 Bilhões de Zen.
