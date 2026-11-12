# PROTOCOLO CANÔNICO DE EXTRAÇÃO E RECONSTRUÇÃO DAS CLASSES
## DASI MMORPG (Continent of Legend Reimagined)
### Mapeamento Direto do Legado (RoxGaming 5.2 / MU Online) para Three.js & Unreal Engine 5

> **Status:** Protocolado e Aprovado  
> **Versão:** 1.0.0  
> **Data:** Novembro de 2026  
> **Autores:** Engenharia de Sistemas & Tech Art Dasi  
> **Base de Referência:** `reference/mu_roxgaming_5.2/` (`client/Data/Player`, `client/Data/Item`, `server/Data/Item/Item.txt`, `source/Main/source/ZzzBMD.cpp`)

---

## 1. VISÃO GERAL & OBJETIVO

O projeto **Dasi** possui cinco classes arquetípicas canônicas inspiradas no legado sombrio do *Continent of Legend*. Até o presente momento, o visualizador utilizava protótipos procedurais e formas geométricas simplificadas. 

Este protocolo estabelece o **pipeline de engenharia reversa e extração direta** dos modelos e texturas tridimensionais canônicos originais a partir dos arquivos do cliente legado, viabilizando:
1. Reconstituição visual 1:1 das silhuetas, proporções, anatomia e peças de armadura clássicas.
2. Extração de malhas tridimensionais com coordenadas UV originais intactas.
3. Descriptografia e decodificação das texturas com canais difuso e alfa.
4. Exportação modular para o Dev Viewer (Three.js WebGL/WebGPU) e Unreal Engine 5.5+ (Nanite/Lumen).

---

## 2. MAPA CANÔNICO DAS 5 CLASSES PRINCIPAIS

### 2.1 Cavaleiro do Sangue (Dark Knight / DK)
* **Atributos Iniciais (`DefaultClassInfo.txt`):** Força 28 | Agilidade 20 | Vitalidade 25 | Energia 10 | Vida 110 | Mana 20
* **Anatomia Base Nua:**
  * Cabeça/Rosto: `HelmClass02.bmd` + `face_02.OZJ` / `hair_02.OZJ`
  * Peitoral/Tronco: `ArmorClass02.bmd` + `skin_barbarian_01.OZJ`
  * Calça: `PantClass02.bmd`
  * Manoplas: `GloveClass02.bmd`
  * Botas: `BootClass02.bmd`
* **Conjuntos de Armadura Canônicos:**
  * **Tier Inicial (Leather Set):** `HelmMale06.bmd`, `ArmorMale06.bmd`, `PantMale06.bmd`, `GloveMale06.bmd`, `BootMale06.bmd`
  * **Tier Clássico (Dragon Set):** `HelmMale02.bmd`, `ArmorMale02.bmd`, `PantMale02.bmd`, `GloveMale02.bmd`, `BootMale02.bmd` (`drager_*.OZJ`)
  * **Tier Avançado (Black Dragon Set):** `HelmMale17.bmd`, `ArmorMale17.bmd`, `PantMale17.bmd`, `GloveMale17.bmd`, `BootMale17.bmd` (`blackdrager_*.OZJ`)
* **Armamento Canônico:**
  * `Sword14.bmd` (Dragon Blade)
  * `Sword16.bmd` (Sword of Destruction)
  * `Sword17.bmd` (Sword of Archangel)
  * `Wing02.bmd` / `Wing05.bmd` (Wings of Satan / Wings of Dragon)

---

### 2.2 Arquimago do Caos (Dark Wizard / DW)
* **Atributos Iniciais:** Força 18 | Agilidade 18 | Vitalidade 15 | Energia 30 | Vida 60 | Mana 60
* **Anatomia Base Nua:**
  * Cabeça/Rosto: `HelmClass01.bmd`
  * Peitoral/Tronco: `ArmorClass01.bmd`
  * Calça: `PantClass01.bmd`
  * Luvas: `GloveClass01.bmd`
  * Botas: `BootClass01.bmd`
* **Conjuntos de Armadura Canônicos:**
  * **Tier Inicial (Pad Set):** `HelmMale03.bmd`, `ArmorMale03.bmd`, `PantMale03.bmd`, `GloveMale03.bmd`, `BootMale03.bmd`
  * **Tier Clássico (Legendary Set):** `HelmMale04.bmd`, `ArmorMale04.bmd`, `PantMale04.bmd`, `GloveMale04.bmd`, `BootMale04.bmd`
  * **Tier Avançado (Grand Soul / Dark Soul):** `HelmMale18.bmd`, `ArmorMale18.bmd`, `PantMale18.bmd`, `GloveMale18.bmd`, `BootMale18.bmd`
* **Armamento Canônico:**
  * `Staff04.bmd` (Legendary Staff)
  * `Staff06.bmd` (Chaos Lightning Staff)
  * `Staff08.bmd` (Staff of Kundun)
  * `Wing01.bmd` / `Wing04.bmd` (Wings of Heaven / Wings of Soul)

---

### 2.3 Vigia da Floresta (Fairy Elf / ELF)
* **Atributos Iniciais:** Força 22 | Agilidade 25 | Vitalidade 20 | Energia 15 | Vida 80 | Mana 30
* **Anatomia Base Nua (Feminina / Silfo):**
  * Cabeça/Cabelos: `HelmClass03.bmd` + `basic_alice3.OZJ` / `basic_alice3_hair.OZT`
  * Peitoral/Tronco: `ArmorClass03.bmd`
  * Calça: `PantClass03.bmd`
  * Manoplas: `GloveClass03.bmd`
  * Botas: `BootClass03.bmd`
* **Conjuntos de Armadura Canônicos:**
  * **Tier Inicial (Vine Set):** `HelmElf01.bmd`, `ArmorElf01.bmd`, `PantElf01.bmd`, `GloveElf01.bmd`, `BootElf01.bmd`
  * **Tier Intermediário (Wind / Spirit):** `HelmElf03.bmd`, `ArmorElf03.bmd`, `PantElf03.bmd`
  * **Tier Clássico (Guardian Set):** `HelmElf05.bmd`, `ArmorElf05.bmd`, `PantElf05.bmd`, `GloveElf05.bmd`, `BootElf05.bmd`
* **Armamento Canônico:**
  * `Bow06.bmd` (Chaos Nature Bow)
  * `Bow07.bmd` (Celestial Bow)
  * `CrossBow05.bmd` (Great Reign Crossbow)
  * `Wing00.bmd` / `Wing03.bmd` (Wings of Elf / Wings of Spirits)

---

### 2.4 Gladiador Rúnico (Magic Gladiator / MG)
* **Atributos Iniciais:** Força 26 | Agilidade 26 | Vitalidade 26 | Energia 26 | Vida 110 | Mana 60
* **Anatomia Base Nua (Sem elmo nativo):**
  * Cabeça: `HelmClass04.bmd`
  * Peitoral: `ArmorClass04.bmd`
  * Calça: `PantClass04.bmd`
  * Luvas: `GloveClass04.bmd`
  * Botas: `BootClass04.bmd`
* **Conjuntos de Armadura Canônicos:**
  * **Tier Clássico (Storm Crow Set):** `ArmorMale19.bmd`, `PantMale19.bmd`, `GloveMale19.bmd`, `BootMale19.bmd`
  * **Tier Avançado (Hurricane Set):** `ArmorMale23.bmd`, `PantMale23.bmd`, `GloveMale23.bmd`, `BootMale23.bmd`
* **Armamento Canônico:**
  * `Sword13.bmd` (Rune Blade)
  * `Sword20.bmd` (Dark Reign Blade)
  * `Wing06.bmd` (Wings of Darkness)

---

### 2.5 Soberano Imperial (Dark Lord / DL)
* **Atributos Iniciais:** Força 26 | Agilidade 20 | Vitalidade 20 | Energia 15 | Liderança 25 | Vida 90 | Mana 40
* **Anatomia Base Nua:**
  * Cabeça: `HelmClass05.bmd`
  * Peitoral: `ArmorClass05.bmd`
  * Calça: `PantClass05.bmd`
  * Luvas: `GloveClass05.bmd`
  * Botas: `BootClass05.bmd`
* **Conjuntos de Armadura Canônicos:**
  * **Tier Inicial (Light Plate Set):** `ArmorMale27.bmd`, `PantMale27.bmd`, `GloveMale27.bmd`, `BootMale27.bmd`
  * **Tier Intermediário (Adamantine Set):** `ArmorMale28.bmd`, `PantMale28.bmd`, `GloveMale28.bmd`, `BootMale28.bmd`
  * **Tier Avançado (Dark Steel / Dark Master):** `ArmorMale30.bmd`, `PantMale30.bmd`
* **Armamento Canônico & Capa:**
  * `Mace08.bmd` (Battle Scepter)
  * `Mace10.bmd` (Great Lord Scepter)
  * `Mace12.bmd` (Shining Scepter)
  * `Wing11.bmd` / `Wing13.bmd` (Mantle of Monarch / Capa do Soberano)

---

## 3. ESPECIFICAÇÃO BINÁRIA DA DECODIFICAÇÃO

### 3.1 Formato de Modelos 3D (`.bmd`)
Conforme extraído e validado em `reference/mu_roxgaming_5.2/source/Main/source/ZzzBMD.cpp`:

```text
Offset   Tamanho     Tipo           Campo             Descrição
0x00     3 bytes     char[3]        Signature         Sempre b'BMD'
0x03     1 byte      uint8          Version           Versão (0x0A = 10 padrão sem cifragem)
0x04     32 bytes    char[32]       Name              Nome interno do asset
0x24     2 bytes     uint16         NumMeshs          Quantidade de sub-malhas no arquivo
0x26     2 bytes     uint16         NumBones          Quantidade de ossos no esqueleto
0x28     2 bytes     uint16         NumActions        Quantidade de animações contidas

Para cada Sub-Malha (i = 0 .. NumMeshs-1):
  - 10 bytes: 5 inteiros de 16-bit (NumVertices, NumNormals, NumTexCoords, NumTriangles, TextureID)
  - NumVertices * 16 bytes: short Node (2B) + pad (2B) + float3 Position (12B)
  - NumNormals * 20 bytes: short Node (2B) + pad (2B) + float3 Normal (12B) + short Bind (2B) + pad (2B)
  - NumTexCoords * 8 bytes: float U (4B) + float V (4B)
  - NumTriangles * 64 bytes: byte Poly (1B) + pad (1B) + 4 shorts VertexIdx (8B) + 4 shorts NormalIdx (8B) + 4 shorts TexCoordIdx (8B) + 4 TexCoords Lightmap (32B) + short LightmapIdx (2B) + pad (4B)
  - 32 bytes: Nome da textura difusa (char[32] ASCII terminada em nulo)
```

### 3.2 Formato de Texturas (`.ozj` e `.ozt`)
* **`.OZJ` (Formato JPEG com Wrapper):**
  * Bytes `0..23`: Cabeçalho proprietário de 24 bytes.
  * Bytes `24..fim`: Stream JPEG padrão com SOI (`0xFF 0xD8`).
* **`.OZT` (Formato TGA TrueColor RGBA com Wrapper):**
  * Bytes `0..3`: Cabeçalho proprietário de 4 bytes.
  * Bytes `4..fim`: Stream TARGA descompactado tipo 2 com suporte a canal alfa de 32 bits (`pixel_depth = 32`).

---

## 4. PIPELINE AUTOMATIZADO DE EXTRAÇÃO

O pipeline está operacional e centralizado em:
* **Decodificador de Texturas:** [conversions/converters/texture_decoder/texture_decoder.py](file:///D:/Dasi/conversions/converters/texture_decoder/texture_decoder.py)
* **Parser e Extrator 3D:** [conversions/converters/bmd_to_glb/bmd_parser.py](file:///D:/Dasi/conversions/converters/bmd_to_glb/bmd_parser.py)
* **Extrator em Lote das Classes:** [conversions/converters/bmd_to_glb/extract_canonical_classes.py](file:///D:/Dasi/conversions/converters/bmd_to_glb/extract_canonical_classes.py)
* **Saída dos Modelos & Texturas:** `conversions/output/classes/<classe>/`
