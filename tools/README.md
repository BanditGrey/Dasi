# Ferramentas e Utilitários - DASI MMORPG

Este diretório concentra scripts de geração procedural 3D, exportação de modelos GLB, automação no Blender e utilitários de manutenção do visualizador WebGL.

---

## 1. Exportadores GLB & Modelos Procedurais (Node.js / Three.js)

Scripts que constroem e exportam malhas tridimensionais diretamente para `prototypes/` e `src/client/dev_viewer/models/`:

* **`export_scenario_glb.mjs`**: Exporta os 56 blockouts canônicos de cenários (ex: `node --experimental-strip-types tools/export_scenario_glb.mjs ALL`).
* **`export_event_arenas.mjs`**: Constrói os GLBs estáticos das arenas de evento: Devil Square (`EVT_02`), Chaos Castle (`EVT_03`) e Coliseu de Duelos (`EVT_04`).
* **`export_bestiary_glbs.mjs`**: Exporta os 12 modelos estáticos de chefes mundiais e criaturas da Invasão Dourada.
* **`export_modular_heroes.mjs`**: Exporta os 5 arquétipos heróicos modulares (DK, DW, ELF, MG, DL).
* **`event_arena_models.mjs`**: Definição procedural de geometria e materiais das arenas de evento.
* **`bestiary_models.mjs`**: Geometria e montagem procedural dos chefes (Kundun, Balrog, Hydra, Gorgon, etc.).
* **`golden_invasion_models.mjs`**: Geometria e montagem das criaturas douradas (Golden Dragon, Golden Titan, etc.).
* **`audit_hero_glb.mjs`**: Auditoria estrutural de primitivas e integridade de GLBs de heróis.
* **`import_meshy_models.mjs`**: Importador e sanitizador de malhas geradas externamente.

---

## 2. Automação Blender 5.2 LTS (Python 3D)

Scripts executados dentro do Blender (modo interativo ou headless com `build_scenery_3d.bat`):

* **`blender_dasi_world_builder.py`**: Gerador completo de biomas, relevo, atmosfera e landmarks para os cenários canônicos.
* **`blender_dasi_armory_builder.py`**: Gerador de conjuntos de armadura modulares (+0 a +15) e slots de equipamento.
* **`blender_dasi_hero_builder.py`**: Modelagem procedural de bases anatômicas dos heróis.
* **`render_hero_previews.py` / `render_procedural_dk.py` / `render_rogue.py`**: Renderizadores automatizados para geração de miniaturas conceituais em `docs/art_previews/`.
* **`inspect_imported_glb.py`**: Validador de topologia, UVs e hierarquia de nós de GLBs.
* **`test_render_workbench.py`**: Suíte de teste para validação de renderizadores via Workbench/Cycles.
* **`build_scenery_3d.bat`**: Script em lote para disparo headless do Blender em builds automatizados.

---

## 3. Scripts Utilitários e de Patch

* **`patch_dasi_3d_content.py` / `patch_app_heroes.py` / etc.**: Utilitários para sincronização e patches de runtime no `dev_viewer`.

---

## 4. Launcher Desktop Nativo & Servidor Auxiliar PHP

* **`Dasi.exe` / `tools/launcher/DasiLauncher.exe`**: Executável nativo Windows com interface gráfica moderna no estilo clássico Continent of Legend. Permite iniciar o GameServer e o Dev Viewer com 1 clique, monitorar portas, alternar engines (Node.js nativo ou PHP auxiliar), ativar modo GM (`DASI_DEV_CONTROLS=1`), abrir o jogo em janela imersiva App Mode, visualizar logs em tempo real e gerenciar processos em segundo plano.
* **`tools/launcher/DasiLauncher.cs`**: Código-fonte C# (.NET Framework 4.8) compilável diretamente via `csc.exe` nativo do Windows.
* **`tools/php_server/router.php`**: Roteador e servidor web embutido em PHP (`php -S 127.0.0.1:8080 tools/php_server/router.php`), com entrega de assets 3D (.glb, .gltf, .ts, .mjs), suporte a CORS e endpoints REST `/api/status` e `/api/auth/login`.
* **`Iniciar_Dasi.bat`**: Script de inicialização rápida com 1 clique na raiz.
* **`Parar_Dasi.bat`**: Script de finalização e limpeza de processos e portas.
