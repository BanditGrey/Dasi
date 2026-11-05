"""
Comprehensive Concept-Based 3D Environment Generator for Dasi MMORPG.
Replaces createEnvironment with all architectural elements from Level Design concepts.
"""
from pathlib import Path

content = Path("src/client/dev_viewer/dasi3dContent.js").read_text(encoding="utf-8")
marker = "export function createEnvironment"
pos = content.find(marker)
comment_pos = content.rfind("// ============================================================================", 0, pos)
header = content[:comment_pos]

code = '''// ============================================================================
// 3. GERADOR DE CENÁRIOS 3D CANÔNICOS BASEADOS NO CONCEPT ART & LEVEL DESIGN
// ============================================================================
export function createEnvironment(envType, THREE) {
  const envGroup = new THREE.Group();
  const dynamicLights = [];
  const animParts = {};

  if (envType === 'LORENCIA') {
    // ========================================================================
    // 1. LORENCIA: Cidadela do Castelo de Loren & Planícies Cinzentas
    // (Conforme docs/level_design/Lorencia_Level_Design.md)
    // ========================================================================
    // 1.1 Chão de Calçamento de Pedra Calcária Gótica com Desníveis
    const floorGeom = new THREE.PlaneGeometry(42, 42, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x3a424e,
      roughness: 0.70,
      metalness: 0.20,
    });
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    envGroup.add(floorMesh);

    // 1.2 Depressões e Poças de Água da Chuva com Reflexão Especular
    const puddlesGroup = new THREE.Group();
    const puddleCoords = [
      [-3.8, 0.015, -2.5, 2.2, 1.6],
      [4.5, 0.015, -2.0, 2.6, 1.8],
      [-3.0, 0.015, 4.2, 2.0, 1.4],
      [4.2, 0.015, 4.8, 2.4, 1.6],
      [0.0, 0.015, 7.5, 3.2, 2.0],
      [-7.5, 0.015, 1.0, 1.8, 1.3],
      [7.5, 0.015, 1.0, 1.9, 1.4],
    ];
    animParts.puddles = [];
    puddleCoords.forEach(([px, py, pz, rx, rz]) => {
      const puddleGeom = new THREE.CircleGeometry(1.0, 16);
      const puddleMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.04,
        metalness: 0.40,
        transparent: true,
        opacity: 0.80,
      });
      const puddle = new THREE.Mesh(puddleGeom, puddleMat);
      puddle.rotation.x = -Math.PI / 2;
      puddle.scale.set(rx, rz, 1.0);
      puddle.position.set(px, py, pz);
      puddlesGroup.add(puddle);
      animParts.puddles.push(puddle);
    });
    envGroup.add(puddlesGroup);

    // 1.3 A Grande Fonte Monumental do Arcanjo de Loren (POI 1: Centro da Praça)
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(0, 0, 0);

    // Degraus concêntricos da fonte
    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.20, 16), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }));
    step1.position.y = 0.10;
    fountainGroup.add(step1);

    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.20, 16), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 }));
    step2.position.y = 0.30;
    fountainGroup.add(step2);

    // Bacia octogonal em cantaria trabalhada
    const basinOuterGeom = new THREE.CylinderGeometry(2.7, 3.0, 0.65, 8);
    const basinMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.60, metalness: 0.15 });
    const basinMesh = new THREE.Mesh(basinOuterGeom, basinMat);
    basinMesh.position.y = 0.65;
    basinMesh.castShadow = true;
    fountainGroup.add(basinMesh);

    // Água da bacia com transparência e ondulação rúnica
    const waterGeom = new THREE.CircleGeometry(2.5, 24);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.4,
      roughness: 0.05,
      metalness: 0.25,
      transparent: true,
      opacity: 0.88,
    });
    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.rotation.x = -Math.PI / 2;
    waterMesh.position.y = 0.92;
    fountainGroup.add(waterMesh);
    animParts.fountainWater = waterMesh;

    // 4 Gárgulas nos cantos da bacia vertendo jatos d'água
    for (let g = 0; g < 4; g++) {
      const angle = (g / 4) * Math.PI * 2 + Math.PI / 8;
      const gargoyle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.45), basinMat);
      gargoyle.position.set(Math.cos(angle) * 2.7, 0.95, Math.sin(angle) * 2.7);
      gargoyle.rotation.y = -angle + Math.PI / 2;
      fountainGroup.add(gargoyle);

      // Jato de água curvo
      const streamGeom = new THREE.CylinderGeometry(0.04, 0.07, 0.55, 6);
      const streamMesh = new THREE.Mesh(streamGeom, waterMat);
      streamMesh.position.set(Math.cos(angle) * 2.9, 0.70, Math.sin(angle) * 2.9);
      streamMesh.rotation.z = Math.cos(angle) * 0.4;
      streamMesh.rotation.x = Math.sin(angle) * 0.4;
      fountainGroup.add(streamMesh);
    }

    // Pedestal ornamental esculpido
    const pedestalGeom = new THREE.CylinderGeometry(0.55, 0.75, 1.8, 12);
    const pedestalMesh = new THREE.Mesh(pedestalGeom, basinMat);
    pedestalMesh.position.y = 1.7;
    fountainGroup.add(pedestalMesh);

    // Estátua Colossal em Bronze do Arcanjo de Loren
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.82, roughness: 0.28 });
    const archangelTorso = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.6, 8), bronzeMat);
    archangelTorso.position.y = 3.2;
    fountainGroup.add(archangelTorso);

    const archangelHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), bronzeMat);
    archangelHead.position.y = 4.15;
    fountainGroup.add(archangelHead);

    // Espada Sagrada do Arcanjo erguida ao céu
    const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.16), new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 }));
    swordBlade.position.set(0.42, 4.4, 0.35);
    fountainGroup.add(swordBlade);

    const swordCrossguard = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.08, 0.12), bronzeMat);
    swordCrossguard.position.set(0.42, 3.6, 0.35);
    fountainGroup.add(swordCrossguard);

    // Asas imponentes do Arcanjo
    for (let side of [-1, 1]) {
      const wingGeom = new THREE.ConeGeometry(0.24, 2.2, 4);
      const wingMesh = new THREE.Mesh(wingGeom, bronzeMat);
      wingMesh.position.set(side * 0.7, 3.5, -0.3);
      wingMesh.rotation.set(0.35, side * 0.65, 0);
      fountainGroup.add(wingMesh);
    }

    // Halo Dourado Sagrado do Arcanjo (Flutuante e Pulsante)
    const haloMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 3.5,
      roughness: 0.1,
    });
    const archangelHalo = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.045, 8, 24), haloMat);
    archangelHalo.position.set(0, 4.45, 0);
    archangelHalo.rotation.x = Math.PI / 3;
    fountainGroup.add(archangelHalo);
    animParts.archangelHalo = archangelHalo;

    envGroup.add(fountainGroup);

    // 1.4 O Bazar 3D (Player Personal Stores) com Tendas, Tapetes e Baús
    animParts.bazaarTents = [];
    const tentData = [
      { pos: [-7.2, 0, -4.0], color: 0x6b21a8, name: 'Tenda de Joias & Rúnicos' },
      { pos: [7.2, 0, -4.0], color: 0x1e3a8a, name: 'Tenda de Armaduras Dragon' },
      { pos: [-7.2, 0, 4.5], color: 0x881337, name: 'Tenda de Armas & Lâminas' },
      { pos: [7.2, 0, 4.5], color: 0xb45309, name: 'Tenda de Asas & Poções' },
    ];
    tentData.forEach(({ pos, color }, idx) => {
      const tentGroup = new THREE.Group();
      tentGroup.position.set(pos[0], pos[1], pos[2]);

      // Tapete Estendido no Calçamento
      const rugGeom = new THREE.PlaneGeometry(3.6, 2.8);
      const rugMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
      const rug = new THREE.Mesh(rugGeom, rugMat);
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0, 0.02, 0);
      tentGroup.add(rug);

      // Toldo de Tecido Piramidal da Tenda
      const awningGeom = new THREE.ConeGeometry(2.3, 1.5, 4);
      const awningMat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
      const awningMesh = new THREE.Mesh(awningGeom, awningMat);
      awningMesh.position.y = 2.45;
      awningMesh.rotation.y = Math.PI / 4;
      awningMesh.castShadow = true;
      tentGroup.add(awningMesh);
      animParts.bazaarTents.push(awningMesh);

      // 4 Postes de sustentação de carvalho
      for (let px of [-1.3, 1.3]) {
        for (let pz of [-1.0, 1.0]) {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.0, 6), new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
          pole.position.set(px, 1.0, pz);
          tentGroup.add(pole);
        }
      }

      // Baú de Madeira Reforçado com Ferro
      const chestBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 0.65), new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.7 }));
      chestBase.position.set(0, 0.28, -0.2);
      tentGroup.add(chestBase);

      const chestLid = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 1.0, 10, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.7 }));
      chestLid.rotation.z = Math.PI / 2;
      chestLid.position.set(0, 0.55, -0.2);
      tentGroup.add(chestLid);

      // Mostruário de armas na lateral
      const weaponRack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.15), new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
      weaponRack.position.set(1.2, 0.45, 0.4);
      weaponRack.rotation.y = 0.3;
      tentGroup.add(weaponRack);

      envGroup.add(tentGroup);
    });

    // 1.5 Taverna da Lareira Dourada (Fachada Sul) com Chaminé e Pórtico
    const tavernGroup = new THREE.Group();
    tavernGroup.position.set(0, 0, 13.5);

    // Paredes de cantaria e vigas de carvalho
    const tavernWalls = new THREE.Mesh(new THREE.BoxGeometry(16, 5.5, 4.0), basinMat);
    tavernWalls.position.y = 2.75;
    tavernGroup.add(tavernWalls);

    // Vigas aparentes transversais (Timber Framing)
    for (let vx of [-6.0, -2.0, 2.0, 6.0]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 5.5, 0.15), new THREE.MeshStandardMaterial({ color: 0x271a0c }));
      beam.position.set(vx, 2.75, -2.05);
      tavernGroup.add(beam);
    }

    // Telhado de ardósia negra
    const tavernRoof = new THREE.Mesh(new THREE.ConeGeometry(10.2, 2.8, 4), new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 }));
    tavernRoof.position.y = 6.8;
    tavernRoof.rotation.y = Math.PI / 4;
    tavernGroup.add(tavernRoof);

    // Chaminé de alvenaria proeminente
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 3.5, 1.2), basinMat);
    chimney.position.set(4.5, 6.8, 0);
    tavernGroup.add(chimney);

    // Janelas ogivais iluminadas a 2100K
    for (let wx of [-4.5, -1.8, 1.8, 4.5]) {
      const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 2.4,
      }));
      winMesh.position.set(wx, 2.8, -2.02);
      tavernGroup.add(winMesh);
    }

    // Pórtico de Entrada com Barris de Carvalho
    const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 1.8), new THREE.MeshStandardMaterial({ color: 0x271a0c }));
    porticoRoof.position.set(0, 3.2, -2.8);
    tavernGroup.add(porticoRoof);

    for (let px of [-1.6, 1.6]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 3.0, 8), new THREE.MeshStandardMaterial({ color: 0x271a0c }));
      post.position.set(px, 1.5, -3.6);
      tavernGroup.add(post);
    }

    // 2 Barris de Hidromel sob o pórtico
    for (let bx of [-2.4, 2.4]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1.0, 10), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 }));
      barrel.position.set(bx, 0.5, -2.8);
      tavernGroup.add(barrel);
    }

    // Puffs de fumaça subindo da chaminé
    animParts.smokePuffs = [];
    for (let sm = 0; sm < 8; sm++) {
      const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.24 + sm * 0.07, 6, 6), new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.45 - sm * 0.04,
      }));
      smoke.position.set(4.5, 8.6 + sm * 0.75, 13.5);
      smoke.userData = { initialY: 8.6, speed: 0.85 + sm * 0.12, idx: sm };
      envGroup.add(smoke);
      animParts.smokePuffs.push(smoke);
    }
    envGroup.add(tavernGroup);

    // 1.6 Muralha Norte Fortificada & Portão do Bastião da Vigília Glacial
    const northWallGroup = new THREE.Group();
    northWallGroup.position.set(0, 0, -13.0);

    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(26, 5.5, 2.0), basinMat);
    wallMesh.position.y = 2.75;
    wallMesh.castShadow = true;
    northWallGroup.add(wallMesh);

    // Ameias defensivas no topo da muralha
    for (let c = -12; c <= 12; c += 2) {
      const crenel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.6), basinMat);
      crenel.position.set(c, 5.9, 0.8);
      northWallGroup.add(crenel);
    }

    // Duas Torres Cilíndricas Gêmeas
    for (let side of [-1, 1]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 9.0, 12), basinMat);
      tower.position.set(side * 12.5, 4.5, 0);
      northWallGroup.add(tower);

      const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 3.5, 12), new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.8 }));
      towerRoof.position.set(side * 12.5, 10.75, 0);
      northWallGroup.add(towerRoof);
    }

    // Portão Ogival Central com Grade de Ferro Levadiça
    const gateFrame = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.35, 8, 16, Math.PI), basinMat);
    gateFrame.position.set(0, 3.2, 0.95);
    northWallGroup.add(gateFrame);

    const portcullis = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.8, 0.25), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.85, roughness: 0.35 }));
    portcullis.position.set(0, 1.9, 0.9);
    northWallGroup.add(portcullis);

    envGroup.add(northWallGroup);

    // 1.7 Cemitério Abandonado das Almas Esquecidas (Sudeste)
    const cemeteryGroup = new THREE.Group();
    cemeteryGroup.position.set(11.0, 0, 7.5);

    // Cerca de ferro forjado enferrujada delimitando a área
    for (let f = -3; f <= 3; f++) {
      const fencePost = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 }));
      fencePost.position.set(f * 0.9, 0.6, -2.5);
      cemeteryGroup.add(fencePost);
    }

    // 6 Lápides góticas em ângulos inclinados
    const gravePositions = [
      [-1.5, 0, -1.0, 0.15],
      [-0.2, 0, -1.2, -0.10],
      [1.2, 0, -0.8, 0.22],
      [-1.0, 0, 1.0, -0.18],
      [0.5, 0, 1.2, 0.12],
      [1.8, 0, 1.4, -0.25],
    ];
    gravePositions.forEach(([gx, gy, gz, rotZ]) => {
      const grave = new THREE.Mesh(new THREE.BoxGeometry(0.40, 1.05, 0.18), basinMat);
      grave.position.set(gx, 0.52, gz);
      grave.rotation.z = rotZ;
      grave.rotation.y = rotZ * 1.5;
      cemeteryGroup.add(grave);
    });

    // Pequeno Mausoléu Gótico com Cripta
    const mausoleum = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.4, 2.6), basinMat);
    mausoleum.position.set(2.8, 1.2, 0);
    cemeteryGroup.add(mausoleum);

    const mausoleumRoof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0x1c1917 }));
    mausoleumRoof.position.set(2.8, 3.1, 0);
    mausoleumRoof.rotation.y = Math.PI / 4;
    cemeteryGroup.add(mausoleumRoof);

    // Fogos-Fátuos (Wisps Espectrais) em órbitas tridimensionais
    animParts.wisps = [];
    for (let w = 0; w < 4; w++) {
      const wisp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 4.0,
      }));
      wisp.position.set(w * 0.8, 1.3, (w % 2) * 0.9);
      wisp.userData = { baseX: 11.0 + w * 0.8, baseZ: 7.5 + (w % 2) * 0.9, seed: w * 1.8 };
      envGroup.add(wisp);
      animParts.wisps.push(wisp);
    }
    envGroup.add(cemeteryGroup);

    // 1.8 Oito Tochas Medievais com Chamas Vivas e Luz Cintilante (Flicker)
    animParts.torches = [];
    const torchCoords = [
      [-3.4, 0, 3.4],
      [3.4, 0, 3.4],
      [-3.4, 0, -8.8],
      [3.4, 0, -8.8],
      [-9.0, 0, 0.0],
      [9.0, 0, 0.0],
      [-1.8, 0, 11.2],
      [1.8, 0, 11.2],
    ];
    torchCoords.forEach(([tx, ty, tz]) => {
      const torchGroup = new THREE.Group();
      torchGroup.position.set(tx, ty, tz);

      const postMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.1, 8), new THREE.MeshStandardMaterial({ color: 0x271a0c }));
      postMesh.position.y = 1.05;
      torchGroup.add(postMesh);

      // Gaiola de ferro de suporte
      const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.35, 6), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 }));
      cage.position.y = 2.1;
      torchGroup.add(cage);

      const flameMesh = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.38, 6), new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 4.0,
      }));
      flameMesh.position.y = 2.3;
      torchGroup.add(flameMesh);

      const torchLight = new THREE.PointLight(0xf59e0b, 2.6, 10.0);
      torchLight.position.set(0, 2.4, 0);
      torchGroup.add(torchLight);

      dynamicLights.push(torchLight);
      animParts.torches.push({ flame: flameMesh, light: torchLight });
      envGroup.add(torchGroup);
    });

    // 1.9 Sistema de Chuva Volumétrica de Lorencia (280 gotas cadentes)
    const rainCount = 280;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);
    for (let r = 0; r < rainCount; r++) {
      rainPositions[r * 3 + 0] = (Math.random() - 0.5) * 36.0;
      rainPositions[r * 3 + 1] = Math.random() * 12.0;
      rainPositions[r * 3 + 2] = (Math.random() - 0.5) * 36.0;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.085,
      transparent: true,
      opacity: 0.68,
    });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    envGroup.add(rainSystem);
    animParts.rainSystem = rainSystem;

  } else if (envType === 'NORIA') {
    // ========================================================================
    // 2. NORIA (FEYWOOD): Santuário Arbóreo & Oficina do Gnômico do Caos
    // (Conforme docs/level_design/Noria_Feywood_Level_Design.md)
    // ========================================================================
    // 2.1 Solo de Musgo Aveludado com Relevos de Raízes
    const groundGeom = new THREE.PlaneGeometry(42, 42, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      roughness: 0.88,
      metalness: 0.04,
    });
    const groundMesh = new THREE.Mesh(groundGeom, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    envGroup.add(groundMesh);

    // Raízes gigantes sinuosas cruzando a clareira
    for (let r = 0; r < 5; r++) {
      const rootCurve = new THREE.Mesh(new THREE.TorusGeometry(4.5 + r * 1.5, 0.35 - r * 0.04, 8, 24, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x271a0c, roughness: 0.85 }));
      rootCurve.rotation.x = Math.PI / 2;
      rootCurve.rotation.z = (r * 0.9);
      rootCurve.position.set((r % 2 === 0 ? -4 : 4), 0.15, (r * 2.0 - 5.0));
      envGroup.add(rootCurve);
    }

    // 2.2 A OFICINA DO GNÔMICO DO CAOS (Tronco de Sequoia Oca de 40m)
    const chaosGroup = new THREE.Group();
    chaosGroup.position.set(-9.0, 0, 3.5);

    // Casca colossal de sequoia oca
    const sequoiaHollow = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.6, 9.0, 16), new THREE.MeshStandardMaterial({
      color: 0x271a0c,
      roughness: 0.88,
    }));
    sequoiaHollow.position.y = 4.5;
    chaosGroup.add(sequoiaHollow);

    // Entrada em arco ogival aberta
    const entranceArch = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.4, 8, 16, Math.PI), new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
    entranceArch.position.set(3.8, 2.5, 0);
    entranceArch.rotation.y = Math.PI / 2;
    chaosGroup.add(entranceArch);

    // Roda d'água mecânica na lateral da oficina
    const waterWheel = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.25, 8, 16), new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 }));
    waterWheel.position.set(0, 2.2, 5.2);
    chaosGroup.add(waterWheel);
    animParts.waterWheel = waterWheel;

    // A MÁQUINA DO CAOS (Monólito Forjador de Dasi)
    // Reator Central de Vidro Vulcânico com Plasma Magenta
    const plasmaCoreGeom = new THREE.SphereGeometry(1.3, 16, 16);
    const plasmaCoreMat = new THREE.MeshStandardMaterial({
      color: 0xd946ef,
      emissive: 0xd946ef,
      emissiveIntensity: 4.2,
      roughness: 0.08,
    });
    const plasmaCore = new THREE.Mesh(plasmaCoreGeom, plasmaCoreMat);
    plasmaCore.position.set(0, 2.6, 0);
    chaosGroup.add(plasmaCore);
    animParts.chaosCore = plasmaCore;

    const chaosCoreLight = new THREE.PointLight(0xd946ef, 4.0, 14);
    chaosCoreLight.position.set(0, 2.6, 0);
    chaosGroup.add(chaosCoreLight);
    dynamicLights.push(chaosCoreLight);
    animParts.chaosLight = chaosCoreLight;

    // 3 Anéis Giroscópicos de Latão e Ouro girando continuamente
    animParts.chaosRings = [];
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.90, roughness: 0.20 });
    for (let r of [1.6, 1.95, 2.35]) {
      const ringMesh = new THREE.Mesh(new THREE.TorusGeometry(r, 0.09, 8, 24), brassMat);
      ringMesh.position.set(0, 2.6, 0);
      chaosGroup.add(ringMesh);
      animParts.chaosRings.push(ringMesh);
    }

    // 4 Pistões a Vapor Verticais de Latão em Bombeamento Ativo
    animParts.pistons = [];
    const pistonCoords = [
      [-2.4, 0, -2.4],
      [2.4, 0, -2.4],
      [-2.4, 0, 2.4],
      [2.4, 0, 2.4],
    ];
    pistonCoords.forEach(([px, py, pz], pIdx) => {
      const baseHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.40, 1.3, 8), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 }));
      baseHousing.position.set(px, 0.65, pz);
      chaosGroup.add(baseHousing);

      const pistonRod = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.22, 2.5, 8), brassMat);
      pistonRod.position.set(px, 1.9, pz);
      pistonRod.userData = { initialY: 1.9, pIdx };
      chaosGroup.add(pistonRod);
      animParts.pistons.push(pistonRod);
    });

    // A Bancada de Sacrifício com Entalhes e a Alavanca do Juízo
    const sacrificePlinth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1.6), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 }));
    sacrificePlinth.position.set(0, 0.4, 3.2);
    chaosGroup.add(sacrificePlinth);

    const chaosLever = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 }));
    chaosLever.position.set(1.1, 1.2, 3.2);
    chaosLever.rotation.z = -0.35;
    chaosGroup.add(chaosLever);

    envGroup.add(chaosGroup);

    // 2.3 ALTAR DA RAINHA ÉLFICA (LÚTHIEN) & FONTE DA ÁGUA DA VIDA (Leste)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(9.0, 0, 3.5);

    // Terraço de Alabastro Lunar
    const altarTerrace = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 0.8, 16), new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.22,
      metalness: 0.12,
    }));
    altarTerrace.position.y = 0.4;
    altarGroup.add(altarTerrace);

    // Bacia de Cura (Água da Vida Sagrada)
    const healingWater = new THREE.Mesh(new THREE.CircleGeometry(3.0, 24), new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 1.6,
      transparent: true,
      opacity: 0.88,
      roughness: 0.05,
    }));
    healingWater.rotation.x = -Math.PI / 2;
    healingWater.position.y = 0.82;
    altarGroup.add(healingWater);
    animParts.healingWater = healingWater;

    // Estátua de Lúthien em Mármore Lunar com o Arco de Fenrir
    const queenStatue = new THREE.Mesh(new THREE.ConeGeometry(0.50, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
    queenStatue.position.y = 2.1;
    altarGroup.add(queenStatue);

    const queenHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    queenHead.position.y = 3.35;
    altarGroup.add(queenHead);

    const fenrirBow = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.06, 6, 16), brassMat);
    fenrirBow.rotation.x = Math.PI / 2;
    fenrirBow.position.set(0, 2.8, 0.4);
    altarGroup.add(fenrirBow);

    // 2 Obeliscos com Cristais de Seiva Fossilizada
    for (let ox of [-3.2, 3.2]) {
      const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 3.2, 6), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
      pylon.position.set(ox, 1.6, -1.8);
      altarGroup.add(pylon);

      const sapCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 3.0,
      }));
      sapCrystal.position.set(ox, 3.4, -1.8);
      altarGroup.add(sapCrystal);
    }
    envGroup.add(altarGroup);

    // 2.4 Árvores-Mãe Élficas Ancestrais com Copas Bioluminescentes
    const treePositions = [
      [-5.2, 0, -7.5],
      [6.2, 0, -7.0],
      [0.0, 0, 12.0],
    ];
    treePositions.forEach(([x, y, z]) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, y, z);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.6, 6.2, 10), new THREE.MeshStandardMaterial({ color: 0x271a0c, roughness: 0.85 }));
      trunk.position.y = 3.1;
      treeGroup.add(trunk);

      const canopy = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 1), new THREE.MeshStandardMaterial({
        color: 0x059669,
        emissive: 0x047857,
        emissiveIntensity: 0.55,
        roughness: 0.38,
      }));
      canopy.position.y = 6.6;
      treeGroup.add(canopy);
      envGroup.add(treeGroup);
    });

    // 2.5 Ponte Suspensa de Raízes e Tábuas de Cedro
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0.40, 0);
    for (let p = -6; p <= 6; p++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.42), new THREE.MeshStandardMaterial({ color: 0x3d2817 }));
      plank.position.set(0, Math.sin(p * 0.25) * 0.15, p * 0.48);
      bridgeGroup.add(plank);
    }
    envGroup.add(bridgeGroup);

    // 2.6 Cogumelos Gigantes Bioluminescentes (5 Famílias Pulsantes)
    animParts.mushrooms = [];
    const shroomCoords = [
      [-3.0, 0, 1.8, 0x38bdf8],
      [3.2, 0, 1.2, 0x10b981],
      [-2.4, 0, -3.8, 0xa855f7],
      [3.6, 0, -3.2, 0x38bdf8],
      [0.0, 0, -5.5, 0xfbbf24],
    ];
    shroomCoords.forEach(([sx, sy, sz, color]) => {
      const shroomGroup = new THREE.Group();
      shroomGroup.position.set(sx, sy, sz);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.20, 0.95, 8), new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.45 }));
      stem.position.y = 0.475;
      shroomGroup.add(stem);

      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.56, 0.42, 12), new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 2.6,
        roughness: 0.18,
      }));
      cap.position.y = 1.05;
      shroomGroup.add(cap);

      const glowLight = new THREE.PointLight(color, 2.0, 6.0);
      glowLight.position.set(0, 1.2, 0);
      shroomGroup.add(glowLight);

      dynamicLights.push(glowLight);
      animParts.mushrooms.push({ cap, light: glowLight });
      envGroup.add(shroomGroup);
    });

    // 2.7 Nuvem de Esporos Místicos (350 partículas em espiral mágica)
    const sporeCount = 350;
    const sporeGeo = new THREE.BufferGeometry();
    const sporePositions = new Float32Array(sporeCount * 3);
    for (let s = 0; s < sporeCount; s++) {
      sporePositions[s * 3 + 0] = (Math.random() - 0.5) * 28.0;
      sporePositions[s * 3 + 1] = 0.3 + Math.random() * 5.0;
      sporePositions[s * 3 + 2] = (Math.random() - 0.5) * 28.0;
    }
    sporeGeo.setAttribute('position', new THREE.BufferAttribute(sporePositions, 3));
    const sporeMat = new THREE.PointsMaterial({
      color: 0x86efac,
      size: 0.075,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
    });
    const sporeSystem = new THREE.Points(sporeGeo, sporeMat);
    envGroup.add(sporeSystem);
    animParts.sporeSystem = sporeSystem;

  } else if (envType === 'DEVIAS') {
    // ========================================================================
    // 3. DEVIAS (BOREAL): Fortaleza Gélida & Grande Braseiro Rei
    // (Conforme docs/level_design/Devias_Boreal_Level_Design.md)
    // ========================================================================
    // 3.1 Manto de Neve Espesso Volumétrico
    const snowGeom = new THREE.PlaneGeometry(42, 42, 32, 32);
    const snowMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.85,
      metalness: 0.08,
    });
    const snowMesh = new THREE.Mesh(snowGeom, snowMat);
    snowMesh.rotation.x = -Math.PI / 2;
    snowMesh.receiveShadow = true;
    envGroup.add(snowMesh);

    // 3.2 Círculo de Degelo Térmico de 25m (Pedra Molhada e Reflexiva)
    const meltGeom = new THREE.CircleGeometry(5.0, 24);
    const meltMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.10,
      metalness: 0.32,
    });
    const meltMesh = new THREE.Mesh(meltGeom, meltMat);
    meltMesh.rotation.x = -Math.PI / 2;
    meltMesh.position.y = 0.02;
    envGroup.add(meltMesh);

    // 3.3 O GRANDE BRASEIRO REI (The King's Hearth - 12 metros de altura)
    const hearthGroup = new THREE.Group();
    hearthGroup.position.set(0, 0, 0);

    const hearthPedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, 1.1, 12), new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
    }));
    hearthPedestal.position.y = 0.55;
    hearthGroup.add(hearthPedestal);

    const hearthBowl = new THREE.Mesh(new THREE.ConeGeometry(1.9, 1.4, 12), new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.94,
      roughness: 0.25,
    }));
    hearthBowl.position.y = 1.7;
    hearthBowl.rotation.x = Math.PI;
    hearthGroup.add(hearthBowl);

    // Fogo Sagrado de Dupla Labareda (5.5 de Intensidade Máxima)
    const hearthFlame = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.6, 8), new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 5.5,
    }));
    hearthFlame.position.y = 2.8;
    hearthGroup.add(hearthFlame);

    const hearthInnerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.9, 8), new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 6.2,
    }));
    hearthInnerFlame.position.y = 2.6;
    hearthGroup.add(hearthInnerFlame);

    const hearthLight = new THREE.PointLight(0xf97316, 5.8, 18);
    hearthLight.position.set(0, 3.0, 0);
    hearthGroup.add(hearthLight);
    dynamicLights.push(hearthLight);

    animParts.kingHearth = { flame: hearthFlame, innerFlame: hearthInnerFlame, light: hearthLight };
    envGroup.add(hearthGroup);

    // 3.4 Catedral Gótica do Manto Glacial (Fachada Norte) com Contrafortes
    const cathedralGroup = new THREE.Group();
    cathedralGroup.position.set(0, 0, -12.0);

    const cathedralFacade = new THREE.Mesh(new THREE.BoxGeometry(18, 8.5, 2.8), new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.55,
    }));
    cathedralFacade.position.y = 4.25;
    cathedralGroup.add(cathedralFacade);

    for (let side of [-1, 1]) {
      const buttress = new THREE.Mesh(new THREE.BoxGeometry(2.2, 10.0, 3.4), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      buttress.position.set(side * 9.5, 5.0, 0);
      cathedralGroup.add(buttress);
    }

    // A Grande Rosácea de Gelo (Rose Window) com Luz Safira que Respira
    const roseWindow = new THREE.Mesh(new THREE.CircleGeometry(2.4, 16), new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 3.5,
      roughness: 0.05,
    }));
    roseWindow.position.set(0, 5.8, 1.45);
    cathedralGroup.add(roseWindow);
    animParts.roseWindow = roseWindow;

    const roseLight = new THREE.PointLight(0x38bdf8, 2.8, 9);
    roseLight.position.set(0, 5.8, 2.2);
    cathedralGroup.add(roseLight);
    dynamicLights.push(roseLight);

    envGroup.add(cathedralGroup);

    // 3.5 Oito Cristais Colossais de Gelo Glacial Esculpidos
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xbae6fd,
      emissive: 0x0284c7,
      emissiveIntensity: 1.4,
      roughness: 0.05,
      metalness: 0.18,
      transparent: true,
      opacity: 0.88,
    });
    const crystalPositions = [
      [-6.5, 0, -5.2],
      [7.0, 0, -4.5],
      [-7.2, 0, 5.8],
      [6.8, 0, 6.2],
      [-3.5, 0, 8.2],
      [3.5, 0, 8.2],
      [-9.0, 0, 0.0],
      [9.0, 0, 0.0],
    ];
    crystalPositions.forEach(([cx, cy, cz], idx) => {
      const crystalMesh = new THREE.Mesh(new THREE.ConeGeometry(0.62, 3.8, 6), crystalMat);
      crystalMesh.position.set(cx, 1.9, cz);
      crystalMesh.rotation.set(0.14, idx * 0.75, -0.12);
      crystalMesh.castShadow = true;
      envGroup.add(crystalMesh);
    });

    // 3.6 Nevasca Boreal Agressiva (Blizzard: 450 flocos rápidos)
    const snowCount = 450;
    const snowPartGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    for (let sn = 0; sn < snowCount; sn++) {
      snowPositions[sn * 3 + 0] = (Math.random() - 0.5) * 36.0;
      snowPositions[sn * 3 + 1] = Math.random() * 10.0;
      snowPositions[sn * 3 + 2] = (Math.random() - 0.5) * 36.0;
    }
    snowPartGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const blizzardMat = new THREE.PointsMaterial({
      color: 0xf8fafc,
      size: 0.095,
      transparent: true,
      opacity: 0.88,
    });
    const blizzardSystem = new THREE.Points(snowPartGeo, blizzardMat);
    envGroup.add(blizzardSystem);
    animParts.blizzardSystem = blizzardSystem;

  } else if (envType === 'ATLANS') {
    // ========================================================================
    // 4. ATLANS (THALASSA): Ruínas Submersas & Covil da Hydra
    // (Conforme docs/level_design/Atlans_Thalassa_Level_Design.md)
    // ========================================================================
    // 4.1 Leito Oceânico de Areia Perolada
    const sandGeom = new THREE.PlaneGeometry(42, 42, 32, 32);
    const sandMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.65,
      metalness: 0.06,
    });
    const sandMesh = new THREE.Mesh(sandGeom, sandMat);
    sandMesh.rotation.x = -Math.PI / 2;
    sandMesh.receiveShadow = true;
    envGroup.add(sandMesh);

    // Manto de Cáusticas Submarinas (Luz Solar Ondulante no Fundo)
    const causticsGeom = new THREE.PlaneGeometry(38, 38, 20, 20);
    const causticsMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.1,
      transparent: true,
      opacity: 0.48,
      roughness: 0.1,
    });
    const causticsMesh = new THREE.Mesh(causticsGeom, causticsMat);
    causticsMesh.rotation.x = -Math.PI / 2;
    causticsMesh.position.y = 0.03;
    envGroup.add(causticsMesh);
    animParts.causticsMesh = causticsMesh;

    // 4.2 SANTUÁRIO DE NÁCAR (Safe Zone Subaquática)
    const nacarGroup = new THREE.Group();
    nacarGroup.position.set(0, 0, 0);

    const nacarMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.20,
      roughness: 0.12,
    });
    const nacarPlatform = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.2, 0.70, 16), nacarMat);
    nacarPlatform.position.y = 0.35;
    nacarGroup.add(nacarPlatform);

    // 4 Arcos Parabólicos Hidrodinâmicos de Nácar
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI;
      const archMesh = new THREE.Mesh(new THREE.TorusGeometry(4.8, 0.26, 8, 24), nacarMat);
      archMesh.rotation.y = angle;
      archMesh.position.y = 2.5;
      nacarGroup.add(archMesh);
    }

    // Domo de Ar Místico Central com Respiração Hidrostática
    const airDome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.60,
      roughness: 0.05,
    }));
    airDome.position.y = 2.0;
    nacarGroup.add(airDome);
    animParts.airDome = airDome;
    envGroup.add(nacarGroup);

    // 4.3 CEMITÉRIO DOS LEVIATÃS (8 Costelas Ciclópicas e Crânio Fóssil)
    const boneMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    for (let r = -4; r <= 3; r++) {
      const rib = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.22, 6, 16), boneMat);
      rib.position.set(8.5 + (r * 0.8), 1.8, -7.0);
      rib.rotation.set(Math.PI / 2 + 0.2, 0, (r % 2 === 0 ? 0.34 : -0.34));
      envGroup.add(rib);
    }

    // 4.4 TÚNEIS DE CORRENTEZA RÁPIDA (Slipstream Jet Rings)
    animParts.slipstreamRings = [];
    const slipstreamMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 3.4,
      transparent: true,
      opacity: 0.80,
    });
    for (let s = 0; s < 4; s++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.16, 8, 20), slipstreamMat);
      ring.position.set(-7.5, 2.3, -5.5 + (s * 3.6));
      envGroup.add(ring);
      animParts.slipstreamRings.push(ring);
    }

    // 4.5 Recifes de Corais de Gorgônia Luminescentes
    const coralCyanMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 2.4 });
    const coralRedMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 2.4 });
    const coralCoords = [
      [-4.2, 0, 6.5, coralRedMat],
      [5.0, 0, 6.8, coralCyanMat],
      [-6.0, 0, -9.0, coralCyanMat],
      [7.2, 0, 1.5, coralRedMat],
    ];
    coralCoords.forEach(([cx, cy, cz, mat_c]) => {
      for (let b = 0; b < 5; b++) {
        const branch = new THREE.Mesh(new THREE.ConeGeometry(0.24, 2.1, 5), mat_c);
        branch.position.set(cx + (b * 0.30), 1.05, cz);
        branch.rotation.set((b - 2) * 0.2, 0, (b - 2) * 0.25);
        envGroup.add(branch);
      }
    });

    // 4.6 Fenda Vulcânica Hidrotermal (Black Smoker Vent)
    const ventMesh = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3.0, 8), new THREE.MeshStandardMaterial({
      color: 0x18181b,
      emissive: 0xea580c,
      emissiveIntensity: 2.5,
      roughness: 0.9,
    }));
    ventMesh.position.set(0, 1.5, 12.8);
    envGroup.add(ventMesh);

    const ventLight = new THREE.PointLight(0xea580c, 3.5, 9);
    ventLight.position.set(0, 2.8, 12.8);
    envGroup.add(ventLight);
    dynamicLights.push(ventLight);

    // 4.7 Enxame de 80 Bolhas Efervescentes com Subida e Balanço Horizontal
    animParts.bubbles = [];
    for (let b = 0; b < 80; b++) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.07 + Math.random() * 0.06, 6, 6), new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.74,
      }));
      bubble.position.set((Math.random() - 0.5) * 22.0, Math.random() * 7.5, (Math.random() - 0.5) * 22.0);
      bubble.userData = { speed: 1.1 + Math.random() * 0.9, seed: Math.random() * 10.0 };
      envGroup.add(bubble);
      animParts.bubbles.push(bubble);
    }

  } else if (envType === 'ICARUS') {
    // ========================================================================
    // 5. ICARUS (AETHEL): Arquipélago Celeste & Voo com Asas
    // (Conforme docs/level_design/Icarus_Aethel_Level_Design.md)
    // ========================================================================
    // 5.1 Mar de Nuvens Crepusculares no Vácuo Inferior (Eternal Golden Hour)
    const cloudFloorGeom = new THREE.PlaneGeometry(72, 72, 24, 24);
    const cloudFloorMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x92400e,
      emissiveIntensity: 1.4,
      roughness: 0.9,
      transparent: true,
      opacity: 0.88,
    });
    const cloudFloor = new THREE.Mesh(cloudFloorGeom, cloudFloorMat);
    cloudFloor.rotation.x = -Math.PI / 2;
    cloudFloor.position.y = -9.0;
    envGroup.add(cloudFloor);
    animParts.cloudFloor = cloudFloor;

    // 5.2 ILHA FLUTUANTE CENTRAL (Platô de Ancoragem) - Levitação Harmônica
    const centralIslandGroup = new THREE.Group();
    centralIslandGroup.position.set(0, 0, 0);

    const islandTop = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.8, 0.9, 16), new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
    }));
    islandTop.position.y = 0.45;
    centralIslandGroup.add(islandTop);

    // Cone Rochoso Invertido
    const islandCone = new THREE.Mesh(new THREE.ConeGeometry(6.6, 5.2, 16), new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.8,
    }));
    islandCone.position.y = -2.6;
    islandCone.rotation.x = Math.PI;
    centralIslandGroup.add(islandCone);

    // Monólito de Aetherita Gravitacional no Vértice Inferior
    const aetheriteCore = new THREE.Mesh(new THREE.OctahedronGeometry(1.6, 0), new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 4.5,
      roughness: 0.05,
    }));
    aetheriteCore.position.y = -5.6;
    centralIslandGroup.add(aetheriteCore);
    animParts.aetheriteCore = aetheriteCore;

    const aetheriteLight = new THREE.PointLight(0x38bdf8, 4.8, 15);
    aetheriteLight.position.set(0, -5.6, 0);
    centralIslandGroup.add(aetheriteLight);
    dynamicLights.push(aetheriteLight);

    animParts.centralIsland = centralIslandGroup;
    envGroup.add(centralIslandGroup);

    // 5.3 ILHAS SATÉLITES PERIFÉRICAS (Espinha dos Dragões Celestes)
    const satCoords = [
      [-10.8, 0.8, 0],
      [10.8, 0.8, 0],
      [0, 1.8, 11.5],
    ];
    animParts.satellites = [];
    satCoords.forEach(([sx, sy, sz], idx) => {
      const satGroup = new THREE.Group();
      satGroup.position.set(sx, sy, sz);
      satGroup.userData = { initialY: sy, idx };

      const satTop = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.8, 0.70, 12), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      satTop.position.y = 0.35;
      satGroup.add(satTop);

      const satCone = new THREE.Mesh(new THREE.ConeGeometry(3.6, 3.2, 12), new THREE.MeshStandardMaterial({ color: 0x475569 }));
      satCone.position.y = -1.6;
      satCone.rotation.x = Math.PI;
      satGroup.add(satCone);

      envGroup.add(satGroup);
      animParts.satellites.push(satGroup);
    });

    // 5.4 PONTES DE CRISTAL DE LUZ ARCANA (Light Bridges)
    animParts.lightBridges = [];
    const lightBridgeMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.8,
      transparent: true,
      opacity: 0.74,
      roughness: 0.05,
    });
    for (let bx of [-5.4, 5.4]) {
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.10, 1.4), lightBridgeMat);
      bridge.position.set(bx, 0.7, 0);
      envGroup.add(bridge);
      animParts.lightBridges.push(bridge);
    }

    // 5.5 CORRENTES TÉRMICAS ASCENDENTES (Thermal Uplifts Douradas)
    animParts.upliftRings = [];
    const upliftMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 3.6,
      transparent: true,
      opacity: 0.76,
    });
    for (let u = 0; u < 4; u++) {
      const upRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.10, 6, 16), upliftMat);
      upRing.position.set(0, 0.65 + (u * 1.3), 6.5);
      envGroup.add(upRing);
      animParts.upliftRings.push(upRing);
    }

    // 5.6 O PINÁCULO DA CRIAÇÃO: Ninho de Lótus de Obsidiana do Dark Phoenix
    const phoenixGroup = new THREE.Group();
    phoenixGroup.position.set(0, 2.8, -11.0);

    const nestMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      metalness: 0.90,
      roughness: 0.16,
      emissive: 0x7c2d12,
      emissiveIntensity: 1.5,
    });
    const nestBase = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.5, 0.70, 12), nestMat);
    nestBase.position.y = 0.35;
    phoenixGroup.add(nestBase);

    // 8 Pétalas de Lótus de Obsidiana
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.58, 2.6, 4), nestMat);
      petal.position.set(Math.cos(angle) * 3.6, 1.5, Math.sin(angle) * 3.6);
      petal.rotation.set(0.26 * Math.sin(angle), 0, 0.26 * Math.cos(angle));
      phoenixGroup.add(petal);
    }

    // Braseiro Central de Fogo Cósmico
    const phoenixFire = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 12), new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 5.0,
    }));
    phoenixFire.position.y = 1.6;
    phoenixGroup.add(phoenixFire);
    animParts.phoenixFire = phoenixFire;

    const phoenixLight = new THREE.PointLight(0xf59e0b, 4.2, 11);
    phoenixLight.position.set(0, 1.9, 0);
    phoenixGroup.add(phoenixLight);
    dynamicLights.push(phoenixLight);

    envGroup.add(phoenixGroup);

    // 5.7 Poeira Estelar Astral (300 partículas no vácuo de Icarus)
    const starCount = 300;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let st = 0; st < starCount; st++) {
      starPositions[st * 3 + 0] = (Math.random() - 0.5) * 38.0;
      starPositions[st * 3 + 1] = -5.0 + Math.random() * 15.0;
      starPositions[st * 3 + 2] = (Math.random() - 0.5) * 38.0;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.085,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });
    const starSystem = new THREE.Points(starGeo, starMat);
    envGroup.add(starSystem);
    animParts.starSystem = starSystem;
  }

  // ==========================================================================
  // ANIMADOR DINÂMICO DE CENÁRIOS EM TEMPO REAL (60 FPS - VIVO)
  // Suporta chamadas com (time, dt), (anim, time, dt) ou (elapsed, delta)
  // ==========================================================================
  const updateAnim = (...args) => {
    let time = 0;
    let dt = 0.016;

    if (args.length >= 3) {
      time = typeof args[1] === 'number' ? args[1] : 0;
      dt = typeof args[2] === 'number' ? args[2] : 0.016;
    } else if (args.length === 2) {
      time = typeof args[0] === 'number' ? args[0] : 0;
      dt = typeof args[1] === 'number' ? args[1] : 0.016;
    } else if (args.length === 1) {
      time = typeof args[0] === 'number' ? args[0] : 0;
    }

    // 1. LORENCIA
    if (animParts.torches) {
      animParts.torches.forEach(({ flame, light }, idx) => {
        const flicker = 1.0 + Math.sin(time * 16.0 + idx * 2.3) * 0.18 + Math.cos(time * 31.0 + idx) * 0.08;
        light.intensity = 2.6 * flicker;
        flame.scale.set(flicker, flicker * 1.15, flicker);
      });
    }
    if (animParts.fountainWater) {
      animParts.fountainWater.rotation.z = time * 0.18;
    }
    if (animParts.archangelHalo) {
      const haloPulse = 1.0 + Math.sin(time * 2.5) * 0.15;
      animParts.archangelHalo.scale.setScalar(haloPulse);
      animParts.archangelHalo.rotation.z = time * 0.8;
    }
    if (animParts.wisps) {
      animParts.wisps.forEach((wisp) => {
        const { baseX, baseZ, seed } = wisp.userData;
        wisp.position.x = baseX + Math.sin(time * 1.8 + seed) * 0.45;
        wisp.position.y = 1.2 + Math.cos(time * 2.2 + seed) * 0.35;
        wisp.position.z = baseZ + Math.sin(time * 1.4 + seed * 2.0) * 0.45;
      });
    }
    if (animParts.bazaarTents) {
      animParts.bazaarTents.forEach((tent, idx) => {
        tent.rotation.z = Math.sin(time * 3.0 + idx * 1.5) * 0.04;
      });
    }
    if (animParts.smokePuffs) {
      animParts.smokePuffs.forEach((smoke) => {
        smoke.position.y += smoke.userData.speed * dt;
        smoke.position.x += Math.sin(time * 2.0 + smoke.userData.idx) * 0.01;
        if (smoke.position.y > 12.0) {
          smoke.position.y = smoke.userData.initialY;
          smoke.position.x = 4.5;
        }
      });
    }
    if (animParts.puddles) {
      animParts.puddles.forEach((puddle, idx) => {
        puddle.material.opacity = 0.70 + Math.sin(time * 2.0 + idx) * 0.15;
      });
    }
    if (animParts.rainSystem) {
      const rPos = animParts.rainSystem.geometry.attributes.position.array;
      const count = rPos.length / 3;
      for (let i = 0; i < count; i++) {
        rPos[i * 3 + 1] -= dt * 11.5;
        rPos[i * 3 + 0] -= dt * 1.3;
        if (rPos[i * 3 + 1] < 0.0) {
          rPos[i * 3 + 1] = 12.0;
          rPos[i * 3 + 0] = (Math.random() - 0.5) * 36.0;
        }
      }
      animParts.rainSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 2. NORIA
    if (animParts.chaosRings) {
      animParts.chaosRings.forEach((ring, idx) => {
        ring.rotation.x = time * (0.9 + idx * 0.45);
        ring.rotation.y = time * (0.7 + idx * 0.35);
      });
    }
    if (animParts.chaosCore) {
      const pulse = 1.0 + Math.sin(time * 4.5) * 0.18;
      animParts.chaosCore.scale.set(pulse, pulse, pulse);
      if (animParts.chaosLight) {
        animParts.chaosLight.intensity = 4.0 * pulse;
      }
    }
    if (animParts.pistons) {
      animParts.pistons.forEach((piston) => {
        const { initialY, pIdx } = piston.userData;
        piston.position.y = initialY + Math.sin(time * 5.0 + pIdx * (Math.PI / 2)) * 0.42;
      });
    }
    if (animParts.waterWheel) {
      animParts.waterWheel.rotation.x = time * 1.2;
    }
    if (animParts.mushrooms) {
      animParts.mushrooms.forEach(({ cap, light }, idx) => {
        const pulse = 1.0 + Math.sin(time * 3.2 + idx * 1.3) * 0.28;
        light.intensity = 2.0 * pulse;
        cap.scale.set(pulse, pulse * 1.08, pulse);
      });
    }
    if (animParts.sporeSystem) {
      const sPos = animParts.sporeSystem.geometry.attributes.position.array;
      const count = sPos.length / 3;
      for (let i = 0; i < count; i++) {
        sPos[i * 3 + 1] += Math.sin(time * 1.5 + i) * 0.015;
        sPos[i * 3 + 0] += Math.cos(time * 0.8 + i) * 0.012;
      }
      animParts.sporeSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 3. DEVIAS
    if (animParts.kingHearth) {
      const flicker = 1.0 + Math.sin(time * 18.0) * 0.18 + Math.cos(time * 33.0) * 0.10;
      animParts.kingHearth.light.intensity = 5.8 * flicker;
      animParts.kingHearth.flame.scale.set(flicker, flicker * 1.15, flicker);
      if (animParts.kingHearth.innerFlame) {
        animParts.kingHearth.innerFlame.scale.set(flicker * 1.1, flicker * 1.25, flicker * 1.1);
      }
    }
    if (animParts.roseWindow) {
      const breathe = 1.0 + Math.sin(time * 1.8) * 0.18;
      animParts.roseWindow.material.emissiveIntensity = 3.5 * breathe;
    }
    if (animParts.blizzardSystem) {
      const snPos = animParts.blizzardSystem.geometry.attributes.position.array;
      const count = snPos.length / 3;
      for (let i = 0; i < count; i++) {
        snPos[i * 3 + 0] -= dt * 12.5;
        snPos[i * 3 + 1] -= dt * 1.6;
        snPos[i * 3 + 2] += Math.sin(time * 3.0 + i) * 0.035;
        if (snPos[i * 3 + 0] < -18.0) {
          snPos[i * 3 + 0] = 18.0;
          snPos[i * 3 + 1] = Math.random() * 10.0;
        }
      }
      animParts.blizzardSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 4. ATLANS
    if (animParts.slipstreamRings) {
      animParts.slipstreamRings.forEach((ring, idx) => {
        ring.rotation.z = time * (1.5 + idx * 0.35);
      });
    }
    if (animParts.airDome) {
      animParts.airDome.scale.y = 1.0 + Math.sin(time * 2.2) * 0.08;
    }
    if (animParts.causticsMesh) {
      animParts.causticsMesh.material.opacity = 0.40 + Math.sin(time * 1.6) * 0.15;
    }
    if (animParts.bubbles) {
      animParts.bubbles.forEach((b) => {
        b.position.y += dt * b.userData.speed;
        b.position.x += Math.sin(time * 2.5 + b.userData.seed) * 0.015;
        if (b.position.y > 7.2) {
          b.position.y = 0.2;
          b.position.x = (Math.random() - 0.5) * 22.0;
        }
      });
    }

    // 5. ICARUS
    if (animParts.centralIsland) {
      animParts.centralIsland.position.y = Math.sin(time * 0.85) * 0.25;
    }
    if (animParts.satellites) {
      animParts.satellites.forEach((sat) => {
        const { initialY, idx } = sat.userData;
        sat.position.y = initialY + Math.sin(time * 0.95 + idx * 1.6) * 0.38;
      });
    }
    if (animParts.aetheriteCore) {
      animParts.aetheriteCore.rotation.y = time * 1.35;
      animParts.aetheriteCore.rotation.x = Math.sin(time * 0.7) * 0.22;
    }
    if (animParts.upliftRings) {
      animParts.upliftRings.forEach((ring, idx) => {
        ring.rotation.z = time * (1.6 - idx * 0.25);
        ring.scale.setScalar(1.0 + Math.sin(time * 3.2 + idx) * 0.15);
      });
    }
    if (animParts.phoenixFire) {
      const swirl = 1.0 + Math.sin(time * 5.5) * 0.18;
      animParts.phoenixFire.scale.set(swirl, swirl * 1.25, swirl);
    }
    if (animParts.cloudFloor) {
      animParts.cloudFloor.position.y = -9.0 + Math.sin(time * 0.4) * 0.28;
    }
    if (animParts.starSystem) {
      animParts.starSystem.rotation.y = time * 0.04;
    }
  };

  return {
    group: envGroup,
    dynamicLights,
    animParts,
    updateAnim,
  };
}
'''

Path("src/client/dev_viewer/dasi3dContent.js").write_text(header + code, encoding="utf-8")
print("Updated dasi3dContent.js successfully!")
