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
   - Revoada de morcegos sombrios voando em órbitas elípticas perto do teto das catacumbas com bater de asas a alta frequência.
3. **SchoolOfFish (Cardume de Peixes de Atlans):**
   - Peixes bioluminescentes navegando em trajetórias ondulatórias de 3 eixos pelo oceano profundo.
4. **TorchFlickerSystem (Flicker Dinâmico de Tochas & Braseiros):**
   - Modulação de intensidade luminosa (`PointLight`) usando sobreposição de três frequências senoidais para simular chamas vivas sem travar o processador.
   - Partículas pontuais de fuligem e brasas que sobem continuamente da boca da tocha.
5. **WildCritters (Fauna Terrestre Pacífica - Raposas em Lorencia & Noria):**
   - Pequenos animais perambulam pacificamente em clareiras (`GRAZING` e `PATROL` a 1,1 m/s).
   - Ao detectar a aproximação veloz do herói (< 4,5m), entram imediatamente em pânico (`FLEEING` a 4,2 m/s no clipe `Gallop`), emitindo áudio procedural de revoada/fuga e buscando distância segura (> 8m).
6. **Síntese de Áudio Procedural da Fauna & Bestiário (`HarmonicAudioSynthesizer`):**
   - Áudio sintetizado em tempo real via Web Audio API: `playWildlifeSound('wings')` na decolagem de aves, `playWildlifeSound('bat')` nas catacumbas, rugidos e agonias de monstros (`playMonsterHitSound`, `playMonsterDeathSound`).
7. **Controles de HUD & Telemetria no Dev Viewer:**
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

## 6. Validação e Testes Automatizados

O sistema conta com cobertura integral na suíte de testes do projeto:
- `src/client/dev_viewer/tests/animated_monsters_runtime.test.ts`: 4 testes de integridade de malha, cabeçalho GLTF, presença de ossos e AnimationMixer.
- `src/client/dev_viewer/tests/ambient_life_systems.test.ts`: 9 testes de fauna por bioma, reação de fuga de aves e raposas selvagens, áudio procedural na decolagem, toggle de HUD, flicker de tochas e liberação de recursos.
- `src/server/combat/tests/mob_spawner_fsm.test.ts`: 6 testes de IA de detecção, alcance de ataque, leash, serialização angular e multi-bioma.
- Total de **374 testes executados e 100% aprovados em 82 suítes** (0 falhas).
