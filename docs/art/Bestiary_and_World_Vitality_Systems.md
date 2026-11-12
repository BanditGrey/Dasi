# Dasi MMORPG — Bestiário Animado e Sistemas de Vida do Mundo

Este documento detalha a arquitetura, pipeline técnico e sistemas integrados que transformam o bestiário e os cenários do **Dasi (Continent of Legend Reimagined)** em um ecossistema 3D vivo, dinâmico e autoritativo.

---

## 1. Visão Geral da Arquitetura

O sistema opera através de três camadas sincronizadas:
1. **Acervo e Rigs 3D (Blender / GLTF PBR):** Modelos 3D esqueléticos com armature padrão (`root`, `pelvis`, `spine`, `membros`) e clipes de animação canônicos (`Idle`, `Walk`, `Run`, `Attack`, `HitReact`, `Death`).
2. **Motor de IA e Spawners Autoritativos (Servidor Node.js):** Máquina de estados finitos (FSM) que controla percepção (`aggroRange`), perseguição (`chase`), combate corporal/mágico (`attackRange`), evasão/leash (`maxLeashDistance`), decaimento de cadáveres e respawn.
3. **Cliente WebGL & Animation Mixer (Three.js r187):** Resolvedor semântico de clipes, cross-fading suave entre animações, interpolação de movimento (lerp/dead reckoning), rotação suave na direção de deslocamento e orquestração de vida ambiental (fauna, bandos de aves, tochas dinâmicas).

---

## 2. Acervo de Monstros Animados

Os modelos animados em formato `.glb` estão alocados em `src/client/dev_viewer/models/monsters/`:

| Criatura | Arquivo GLB | Bioma Principal | Ações / Clipes Canônicos |
|---|---|---|---|
| **Spider** (Aranha Gigante) | `spider_animated.glb` | Lorencia (Campos do Norte) | `Idle1_Action`, `Walk1_Action`, `Bite_Action`, `Damage_Action`, `Death_Action` |
| **Hound** (Lobo / Cão de Caça) | `hound_animated.glb` | Lorencia (Planícies do Poente) | `Idle`, `Walk`, `Gallop`, `Attack`, `Idle_HitReact_Left`, `Death` |
| **Bull Fighter** (Touro Guerreiro) | `bull_fighter_animated.glb` | Lorencia (Charcos do Sul) | `Idle`, `Walk`, `Gallop`, `Attack_Headbutt`, `Attack_Kick`, `Death` |
| **Skeleton** (Soldado Esqueleto) | `skeleton_animated.glb` | Lorencia (Cemitério) / Dungeon | `Idle`, `Walking_A`, `Running_A`, `1H_Melee_Attack_Chop`, `Hit_A`, `Death_A` |
| **Skeleton Warrior** (Guerreiro Esqueleto de Elite) | `skeleton_warrior_animated.glb` | Dungeon / Lorencia | `Idle`, `Walking_A`, `Running_A`, `1H_Melee_Attack_Chop`, `1H_Melee_Attack_Stab`, `Block`, `Hit_A`, `Death_A`, `Cheer` |
| **Lich** (Feiticeiro do Abismo) | `lich_animated.glb` | Dungeon Catacombs | `Idle`, `Walking_A`, `Spellcast_Shoot`, `Spellcast_Long`, `Hit_A`, `Death_A` |
| **Yeti** (A Fera Glacial) | `yeti_animated.glb` | Devias Boreal | `CharacterArmature\|Idle`, `CharacterArmature\|Walk`, `CharacterArmature\|Bite_Front`, `CharacterArmature\|HitRecieve`, `CharacterArmature\|Death` |
| **Lesser Demon** (Cria de Balrog) | `demon_animated.glb` | Lost Tower Inferno | `CharacterArmature\|Flying_Idle`, `CharacterArmature\|Fast_Flying`, `CharacterArmature\|Punch`, `CharacterArmature\|HitReact`, `CharacterArmature\|Death` |
| **Dragon Evolved** | `dragon_animated.glb` | Invasões Douradas / Noria | `CharacterArmature\|Flying_Idle`, `CharacterArmature\|Fast_Flying`, `CharacterArmature\|Headbutt`, `CharacterArmature\|HitReact`, `CharacterArmature\|Death` |
| **Ghost** (Espectro Abissal) | `ghost_animated.glb` | Dungeon Catacombs | `CharacterArmature\|Flying_Idle`, `CharacterArmature\|Fast_Flying`, `CharacterArmature\|Punch`, `CharacterArmature\|Death` |
| **Orc** (Guerreiro Orc) | `orc_animated.glb` | Devias / Dungeon | `CharacterArmature\|Idle`, `CharacterArmature\|Walk`, `CharacterArmature\|Punch`, `CharacterArmature\|HitReact`, `CharacterArmature\|Death` |
| **Wild Fox** (Raposa Selvagem) | `models/critters/fox_animated.glb` | Lorencia / Noria | `Idle`, `Idle_2`, `Walk`, `Gallop`, `Attack`, `Idle_HitReact_Left`, `Death` |

---

## 3. Resolução Semântica de Animações (`dasi3dContent.js`)

A função `resolveMonsterAnimationClip(anims, requestAction)` suporta de forma unificada múltiplas convenções de nomenclatura:
- `'idle'`: casa com `Idle`, `Flying_Idle`, `Idle1_Action`, `Idle_2`, etc.
- `'walk'` / `'moving'`: casa com `Walk`, `Walking_A`, `Walk1_Action`, `Fast_Flying`, `Gallop`.
- `'run'`: prioriza `Run`, `Running_A`, `Gallop` antes de recorrer a `Walk`.
- `'attack'`: casa com `Attack`, `Headbutt`, `Kick`, `Bite`, `Punch`, `Spellcast_Shoot`, `1H_Melee_Attack_Chop`, `Slice`.
- `'hit'` / `'staggered'`: casa com `HitReact`, `Damage_Action`, `Hit_A`, `Idle_HitReact_Left`.
- `'death'`: casa com `Death`, `Death_A`, `Death_Action` (executa com `setLoop(THREE.LoopOnce, 1)` e `clampWhenFinished = true`).

---

## 4. Motor de Vida Ambiental (`AmbientLifeEngine.js`)

Gerencia a vitalidade visual e a fauna dinâmica dos cenários:
1. **FlockSystem (Aves Reativas em Lorencia & Noria):**
   - Bandos de aves pousam em telhados e gramados no estado `LANDED`.
   - Se o herói se aproxima a menos de 4,2 metros, comutam para `TAKING_OFF` com aceleração vetorial e bater de asas veloz.
   - Entram em órbita aérea senoidal (`FLYING`) e, quando a área se acalma, pousam suavemente (`LANDING`).
2. **CaveBats (Morcegos da Dungeon):**
   - Revoada de morcegos sombrios voando em órbitas elípticas perto do teto das catacumbas com bater de asas a alta frequência e ecolocalização procedural.
3. **SchoolOfFish (Cardume de Peixes de Atlans):**
   - Peixes bioluminescentes navegando em trajetórias ondulatórias de 3 eixos pelo oceano profundo com natação rítmica.
4. **Jellyfish (Águas-vivas Abissais em Atlans):**
   - 6 águas-vivas bioluminescentes translúcidas com propulsão pulsante senoidal periódica e respiração radial, emitindo fosforescência nos tons ciano e magenta.
5. **FairyFlies (Fadas Luminosas em Noria):**
   - 12 pixies/fadas luminosas com batimento de asas de alta frequência (18 Hz), trajetórias espirais em torno de flores élficas e halos emissores suaves.
6. **SnowHares (Lebres da Neve em Devias):**
   - 3 lebres árticas com saltos procedurais parabólicos na neve, estado de vigília e fuga veloz ao detectar o herói a menos de 4,2 metros.
7. **TorchFlickerSystem (Flicker Dinâmico de Tochas & Braseiros):**
   - Modulação de intensidade luminosa (`PointLight`) usando sobreposição de três frequências senoidais para simular chamas vivas sem travar o processador.
   - Partículas pontuais de fuligem e brasas que sobem continuamente da boca da tocha.
8. **WildCritters (Fauna Terrestre Pacífica - Raposas em Lorencia & Noria):**
   - Pequenos animais perambulam pacificamente em clareiras (`GRAZING` e `PATROL` a 1,1 m/s).
   - Ao detectar a aproximação veloz do herói (< 4,5m), entram imediatamente em pânico (`FLEEING` a 4,2 m/s no clipe `Gallop`), emitindo áudio procedural de revoada/fuga e buscando distância segura (> 8m).
9. **Cidadãos e Habitantes 3D Interativos (NPCs):**
   - Modelados e animados continuamente com idle sutil e billboards indicativos flutuantes.
   - **Ferreiro Han** (Lorencia - Bigorna e martelo): abre loja de armas/armaduras.
   - **Pupa Alquimista** (Lorencia - Poções): vende elixires de cura e mana.
   - **Sentinela Imperial** (Lorencia - Guarda do portão): patrulha armada com lança.
   - **Duende do Caos** (Noria - Bigorna arcana): interface da Chaos Machine.
   - **Sacerdotisa Sebina** (Devias - Orbe sagrado): orquestradora da quest de evolução de classe.
   - **Lumen da Taberna** (Lorencia - Balcão): serve ale e restaura vigor instantaneamente.
   - **Lala Elfa** (Noria - Tenda botânica): loja de elixires naturais e pergaminhos.
   - Integração com raycasting de clique do mouse abrindo diálogos e ações contextuais.
10. **Clima Atmosférico Dinâmico por Bioma:**
   - Lorencia: precipitação de chuva com respingos dinâmicos no solo.
   - Devias: nevasca densa com flocos afetados por vetores de vento turbulento.
   - Noria: esporos vegetais flutuantes e bioluminescência suave.
   - Atlans: fluxo contínuo de bolhas de ar ascendentes e partículas marinhas.
   - Lost Tower: fuligem incandescente e brasas ascendentes de lava.
11. **Paisagens Sonoras Ambientais Procedurais (`HarmonicAudioSynthesizer`):**
   - Áudio sintetizado em tempo real via Web Audio API sem assets de áudio externos pesados:
     * Lorencia: ruído rosa filtrado contínuo simulando chuva mansa nas pedras.
     * Devias: ruído branco modulado por oscilador LFO simulando uivos do vento polar ártico.
     * Noria: harmônicos de sinos pentatônicos cristalinos da floresta ancestral.
     * Atlans: ressonância passa-baixa profunda subaquática em 65 Hz.
     * Fauna e combate: bater de asas (`wings`), ecolocalização (`bat`), assobios de fadas (`fairy`), borbulhar marinho (`water`), e rugidos de combate (`playMonsterHitSound`, `playMonsterDeathSound`, `playMonsterAggroSound`).
12. **Controles de HUD & Telemetria no Dev Viewer:**
   - Botão interativo `🕊️ Fauna: ON / OFF` no painel superior do Viewport 3D (`#btn-toggle-ambient-life`) permitindo alternar instantaneamente a visibilidade e processamento da fauna e efeitos de vitalidade.

---

## 5. IA de Mobs & Spawners Autoritativos (`MobSpawner.ts` & `Monster.ts`)

A máquina de estados dos monstros no servidor opera em um ciclo contínuo:
```
           +---------------------------------------------+
           |                                             |
           v                                             | (Leash > maxLeashDistance)
[IDLE / WANDER] -----(dist <= aggroRange)-----> [MOVING (CHASE)]
                                                      |
                                             (dist <= attackRange)
                                                      |
                                                      v
                                                 [ATTACKING]
                                                      |
                                            (cooldown decorrido)
                                                      |
                                                      v
                                              (Ataque Disparado)
```
- **Stagger / Poise:** Se o monstro sofrer dano suficiente na postura (`poise <= 0`), entra em `STAGGERED` por 150ms.
- **Morte & Respawn:** Ao chegar a 0 HP, entra em `DEAD`, dispara o clipe de morte no cliente, aguarda a expiração do cadáver e reagenda o respawn na zona.
- **Multi-Bioma:** Suporte nativo para criação de zonas em Lorencia, Devias, Dungeon e Lost Tower.

---

## 6. Catálogo Canônico de Habilidades das 5 Classes (`SkillCatalog.ts`)

O motor autoritativo de combate (`CombatEngine.ts`) integra o catálogo completo das 5 classes canônicas com validação de custo de Mana (MP), Vigor (AG), alcance, tipo de dano e efeitos colaterais em área:
- **Dark Knight (DK):**
  * `twisting_slash` (Giro do Destruidor): Raio 180, consome 10 MP, atinge múltiplos alvos simultaneamente.
  * `death_stab` (Estocada Mortal): Golpe perfurante de alto impacto frontal com dano massivo multiplicativo.
- **Dark Wizard (DW):**
  * `evil_spirits` (Espíritos Nefastos): Projéteis arcanos em 360°, dano mágico em área total com consumo de 35 MP.
  * `hellfire` (Chamas Abissais): Erupção vulcânica de alto impacto em torno do conjurador com consumo de 45 MP.
- **Fairy Elf (FE):**
  * `triple_shot` (Disparo Tríplice): 3 flechas simultâneas concentradas com baixo consumo de 5 MP.
  * `ice_arrow` (Flecha Congelante): Flecha glacial que retarda o movimento do alvo com 20 MP.
- **Magic Gladiator (MG):**
  * `power_slash` (Golpe de Poder): Leque frontal de energia mística com consumo de 12 MP.
  * `fire_slash` (Fatiamento Flamejante): Redução temporária de armadura do inimigo com corte ígneo de 20 MP.
- **Dark Lord (DL):**
  * `fireburst` (Explosão de Fogo): Correntes de fogo de longo alcance com alto dano de Comando/Energia.
  * `earthquake` (Terremoto do Corcel): Pisada sísmica com abalo em raio 240 e consumo de 25 MP / 15 AG.

---

## 7. Validação e Testes Automatizados

O ecossistema conta com cobertura integral na suíte de testes do projeto:
- `src/client/dev_viewer/tests/animated_monsters_runtime.test.ts`: integridade de malha, cabeçalho GLTF, presença de ossos e AnimationMixer.
- `src/client/dev_viewer/tests/ambient_life_systems.test.ts`: 11 testes de fauna por bioma (aves, morcegos, peixes, águas-vivas, fadas, lebres, raposas), NPCs 3D, áudio procedural, toggle de HUD, flicker de tochas e soundscapes.
- `src/server/combat/tests/mob_spawner_fsm.test.ts`: 6 testes de IA de detecção, alcance de ataque, leash, serialização angular e multi-bioma.
- `src/server/combat/tests/canonical_skills.test.ts`: 7 testes de catálogo e execução autoritativa de habilidades das 5 classes.
- `src/server/combat/tests/multibiome_spawner.test.ts`: 9 testes de orquestração multi-bioma (Noria, Devias, Dungeon, Lost Tower, Atlans, Tarkan, Icarus) e entidades canônicas expandidas.
- `src/server/combat/tests/monster_obstacle_avoidance.test.ts`: 3 testes de contorno de obstáculos e NavMesh dinâmico.
- Total de **457 testes executados e 100% aprovados em 107 suítes** (0 falhas) com `npm test` e tipagem estrita com `npm run typecheck`.
