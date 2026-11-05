/**
 * DASI MMORPG - CONSTRUTOR 3D DOS 47 CENÁRIOS CANÔNICOS
 * Modelagem procedural PBR de alta fidelidade para todos os 8 Biomas (47 cenários)
 * + as 5 zonas de Castle Siege e as 4 arenas de evento (56 cenários canônicos).
 * Alinhado rigorosamente com os colisores físicos de DasiCollisionEngine e CollisionSystem.ts.
 */

export function buildScenario3D(scenarioId, THREE, envGroup, dynamicLights, animParts) {
  // Paleta de Materiais Compartilhados
  const matCobble = new THREE.MeshStandardMaterial({ color: 0x3a424e, roughness: 0.72, metalness: 0.20 });
  const matStoneDark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.15 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0x3f2e21, roughness: 0.80, metalness: 0.05 });
  const matGold = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.35, metalness: 0.85 });
  const matIron = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.50, metalness: 0.80 });
  const matFeyMoss = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.80, metalness: 0.08 });
  const matGlacialIce = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.25, transparent: true, opacity: 0.85 });
  const matSnow = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.90, metalness: 0.02 });
  const matObsidian = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.22, metalness: 0.90 });
  const matMagma = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xd97706, emissiveIntensity: 2.2, roughness: 0.3 });
  const matSandCrimson = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.92, metalness: 0.05 });
  const matCoralMagenta = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.55, metalness: 0.10, emissive: 0x881337, emissiveIntensity: 0.6 });
  const matNacar = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.40 });
  const matBone = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.70, metalness: 0.10 });

  // Normaliza ID
  let id = scenarioId.toUpperCase();
  if (id === 'LORENCIA') id = 'LOR_01';
  else if (id === 'NORIA') id = 'NOR_01';
  else if (id === 'DEVIAS') id = 'DEV_01';
  else if (id === 'DUNGEON') id = 'DNG_01';
  else if (id === 'LOST_TOWER') id = 'LT_01';
  else if (id === 'ATLANS') id = 'ATL_01';
  else if (id === 'TARKAN') id = 'TAR_01';
  else if (id === 'ICARUS') id = 'ICA_01';
  else if (id === 'VALLEY_OF_LOREN' || id === 'VOL') id = 'VOL_01';
  else if (id === 'BLOOD_CASTLE' || id === 'EVT') id = 'EVT_01';

  // --------------------------------------------------------------------------
  // PARTÍCULAS E ELEMENTOS ATMOSFÉRICOS DINÂMICOS POR BIOMA (60 FPS)
  // --------------------------------------------------------------------------
  const createParticleCloud = (count, color, size, bounds, opacity = 0.8, additive = true) => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * bounds.x;
      pos[i * 3 + 1] = Math.random() * bounds.y;
      pos[i * 3 + 2] = (Math.random() - 0.5) * bounds.z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
    });
    const points = new THREE.Points(geo, mat);
    envGroup.add(points);
    return points;
  };

  const prefix = id.split('_')[0];
  if (prefix === 'DNG') {
    animParts.acidVapor = createParticleCloud(400, 0x4ade80, 0.08, { x: 38, y: 6, z: 38 }, 0.65, true);
    animParts.dungeonWisps = [];
    const wispColors = [0x22d3ee, 0x34d399, 0xa855f7];
    for (let w = 0; w < 4; w++) {
      const wisp = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshBasicMaterial({ color: wispColors[w % 3] })
      );
      wisp.position.set((Math.random() - 0.5) * 20, 1.5 + Math.random() * 2, (Math.random() - 0.5) * 20);
      wisp.userData = {
        runtimeOnly: true,
        baseX: wisp.position.x,
        baseZ: wisp.position.z,
        seed: Math.random() * 10,
        speed: 1.2 + Math.random() * 0.8
      };
      envGroup.add(wisp);
      const wispLight = new THREE.PointLight(wispColors[w % 3], 2.2, 8);
      wisp.add(wispLight);
      dynamicLights.push(wispLight);
      animParts.dungeonWisps.push(wisp);
    }
  } else if (prefix === 'LT') {
    animParts.lostTowerEmbers = createParticleCloud(500, 0xf97316, 0.09, { x: 40, y: 9, z: 40 }, 0.85, true);
  } else if (prefix === 'TAR') {
    animParts.tarkanSandstorm = createParticleCloud(600, 0xfbbf24, 0.11, { x: 50, y: 4, z: 50 }, 0.75, false);
  } else if (prefix === 'ATL') {
    animParts.abyssalPlankton = createParticleCloud(450, 0x38bdf8, 0.075, { x: 42, y: 8, z: 42 }, 0.82, true);
    animParts.bubbles = [];
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.55
    });
    for (let b = 0; b < 24; b++) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.12 + Math.random() * 0.15, 8, 8), bubbleMat);
      bubble.position.set((Math.random() - 0.5) * 30, Math.random() * 6.5, (Math.random() - 0.5) * 30);
      bubble.userData = { runtimeOnly: true, speed: 1.2 + Math.random() * 1.1, seed: Math.random() * 10 };
      envGroup.add(bubble);
      animParts.bubbles.push(bubble);
    }
  } else if (prefix === 'ICA') {
    animParts.starSystem = createParticleCloud(550, 0x67e8f9, 0.085, { x: 46, y: 12, z: 46 }, 0.9, true);
  } else if (prefix === 'DEV') {
    animParts.blizzardSystem = createParticleCloud(500, 0xf8fafc, 0.095, { x: 42, y: 10, z: 42 }, 0.85, false);
  } else if (prefix === 'NOR') {
    animParts.sporeSystem = createParticleCloud(400, 0x86efac, 0.075, { x: 40, y: 7, z: 40 }, 0.8, true);
  } else if (prefix === 'LOR' && id !== 'LOR_06' && id !== 'LOR_07') {
    animParts.rainSystem = createParticleCloud(450, 0x93c5fd, 0.085, { x: 40, y: 12, z: 40 }, 0.68, false);
  } else if (prefix === 'VOL') {
    animParts.siegeSmoke = createParticleCloud(500, 0xef4444, 0.10, { x: 50, y: 12, z: 50 }, 0.75, true);
  } else if (prefix === 'EVT') {
    const eventAtmosphere = {
      EVT_01: { color: 0xf43f5e, x: 40, z: 80 },
      EVT_02: { color: 0xf97316, x: 45, z: 45 },
      EVT_03: { color: 0xa78bfa, x: 40, z: 40 },
      EVT_04: { color: 0xfbbf24, x: 36, z: 36 },
    }[id] || { color: 0xf43f5e, x: 40, z: 40 };
    animParts.bloodNebula = createParticleCloud(300, eventAtmosphere.color, 0.09, { x: eventAtmosphere.x, y: 15, z: eventAtmosphere.z }, 0.65, true);
  }

  // ==========================================================================
  // 1. LORENCIA (7 CENÁRIOS)
  // ==========================================================================
  if (id === 'LOR_01') {
    // LOR_01: Citadel Plaza & Fountain (Praça Central, Fonte do Arcanjo e Bazar)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42, 16, 16), matCobble);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    envGroup.add(floor);

    // Calçamento instanciado baixo: apenas detalhe visual, sem novos obstáculos.
    const paving = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1.85, 0.025, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x65635b, roughness: 0.88, metalness: 0.03 }),
      780
    );
    paving.name = 'lorencia_paving';
    const tileTransform = new THREE.Object3D();
    let tileIndex = 0;
    for (let row = 0; row < 39; row++) {
      for (let col = 0; col < 20; col++) {
        tileTransform.position.set(-18.8 + col * 1.95 + (row % 2) * 0.45, 0.02, -19 + row);
        tileTransform.rotation.y = 0;
        tileTransform.updateMatrix();
        paving.setMatrixAt(tileIndex++, tileTransform.matrix);
      }
    }
    paving.receiveShadow = true;
    envGroup.add(paving);

    // Fonte do Arcanjo
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.9, 24), matStoneDark);
    basin.position.y = 0.45;
    envGroup.add(basin);

    const water = new THREE.Mesh(new THREE.CircleGeometry(2.95, 24), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.08, metalness: 0.85 }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.86;
    envGroup.add(water);
    animParts.fountainWater = water;

    // Silhueta alada em bronze: todos os volumes ficam dentro da bacia existente.
    const bronze = new THREE.MeshStandardMaterial({ color: 0x746044, roughness: 0.65, metalness: 0.65 });
    const angel = new THREE.Group();
    angel.name = 'lorencia_angel_statue';
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.44, 1.45, 8), bronze);
    body.position.y = 2.05;
    angel.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), bronze);
    head.position.y = 3.05;
    angel.add(head);
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.20, 1.25, 0.63), bronze);
      wing.position.set(side * 0.53, 2.45, 0.22);
      wing.rotation.z = side * 0.65;
      angel.add(wing);
    }
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.45, 0.11), bronze);
    blade.position.set(0.42, 1.7, -0.35);
    angel.add(blade);
    envGroup.add(angel);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 8, 16), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    halo.position.set(0, 3.6, 0);
    halo.rotation.x = Math.PI / 2;
    envGroup.add(halo);
    animParts.archangelHalo = halo;

    // 4 Tendas de Bazar
    const tentPositions = [[-7.2, -4.0], [7.2, -4.0], [-7.2, 4.5], [7.2, 4.5]];
    tentPositions.forEach(([tx, tz]) => {
      const tent = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.8, 4), new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 }));
      tent.position.set(tx, 1.9, tz);
      tent.rotation.y = Math.PI / 4;
      envGroup.add(tent);
      const post = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 2.4), matWood);
      post.position.set(tx, 0.5, tz);
      envGroup.add(post);
    });

    // Fachada da Taverna
    const tavern = new THREE.Mesh(new THREE.BoxGeometry(16.5, 4.5, 4.5), matStoneDark);
    tavern.position.set(0, 2.25, 13.5);
    envGroup.add(tavern);

    // Detalhes da fachada dentro do volume de colisão da taverna.
    const facadeDetails = new THREE.Group();
    facadeDetails.name = 'lorencia_tavern_details';
    const roof = new THREE.Mesh(new THREE.BoxGeometry(16.1, 0.45, 4.3), matWood);
    roof.position.set(0, 4.72, 13.5);
    facadeDetails.add(roof);
    const warmWindow = new THREE.MeshStandardMaterial({ color: 0x9d692e, emissive: 0x8a4311, emissiveIntensity: 0.8, roughness: 0.7 });
    for (const x of [-6, -3, 3, 6]) {
      const window = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.35, 0.08), warmWindow);
      window.position.set(x, 2.5, 11.28);
      facadeDetails.add(window);
    }
    const doorway = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.08), matWood);
    doorway.position.set(0, 1.25, 11.28);
    facadeDetails.add(doorway);
    envGroup.add(facadeDetails);

    // Muralhas Sul
    const wallL = new THREE.Mesh(new THREE.BoxGeometry(14.0, 4.0, 3.0), matStoneDark);
    wallL.position.set(-11.0, 2.0, -16.0);
    envGroup.add(wallL);
    const wallR = new THREE.Mesh(new THREE.BoxGeometry(14.0, 4.0, 3.0), matStoneDark);
    wallR.position.set(11.0, 2.0, -16.0);
    envGroup.add(wallR);

    // Torres de Vigia Sul
    const towL = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 6.5, 16), matStoneDark);
    towL.position.set(-14.0, 3.25, -16.0);
    envGroup.add(towL);
    const towR = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 6.5, 16), matStoneDark);
    towR.position.set(14.0, 3.25, -16.0);
    envGroup.add(towR);

    // Ameias sobre as muralhas, sem alterar os limites físicos existentes.
    for (const centerX of [-11, 11]) {
      for (let i = -3; i <= 3; i++) {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.85, 1.0), matStoneDark);
        merlon.position.set(centerX + i * 1.8, 4.42, -16);
        envGroup.add(merlon);
      }
    }

    // 4 Postes de Tocha
    animParts.torches = [];
    const torchCoords = [[-3.5, -12.0], [3.5, -12.0], [-3.5, 10.5], [3.5, 10.5]];
    torchCoords.forEach(([px, pz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.6, 8), matIron);
      pole.position.set(px, 1.3, pz);
      envGroup.add(pole);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.45, 6), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
      flame.position.set(px, 2.7, pz);
      envGroup.add(flame);
      const light = new THREE.PointLight(0xf59e0b, 2.4, 8);
      light.position.set(px, 2.8, pz);
      envGroup.add(light);
      dynamicLights.push(light);
      animParts.torches.push({ flame, light });
    });

  } else if (id === 'LOR_02') {
    // LOR_02: East Gate & Plains (Muralha Oriental, Portão de Vigia e Rochas das Bestas)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(52, 52, 16, 16), new THREE.MeshStandardMaterial({ color: 0x2e382d, roughness: 0.9 }));
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Muralhas Leste
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.0, 14.0), matStoneDark);
    wallN.position.set(-15, 2.5, 8);
    envGroup.add(wallN);
    const wallS = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.0, 14.0), matStoneDark);
    wallS.position.set(-15, 2.5, -8);
    envGroup.add(wallS);

    // Torres de Vigia
    const twN = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 7.5, 12), matStoneDark);
    twN.position.set(-15, 3.75, 15);
    envGroup.add(twN);
    const twS = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 7.5, 12), matStoneDark);
    twS.position.set(-15, 3.75, -15);
    envGroup.add(twS);

    // Formações Rochosas das Bestas
    const rock1 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.0, 1), matStoneDark);
    rock1.position.set(5, 1.5, 10);
    envGroup.add(rock1);
    const rock2 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5, 1), matStoneDark);
    rock2.position.set(12, 1.8, -12);
    envGroup.add(rock2);
    const boulder = new THREE.Mesh(new THREE.SphereGeometry(2.0, 8, 8), matCobble);
    boulder.position.set(-2, 1.0, -4);
    envGroup.add(boulder);

    // Caminho de terra é uma superfície plana, sem afetar colisão.
    const road = new THREE.Mesh(new THREE.PlaneGeometry(48, 4.2), new THREE.MeshStandardMaterial({ color: 0x534b3b, roughness: 0.96 }));
    road.name = 'lorencia_east_road';
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.025;
    envGroup.add(road);

    // Ameias estão sobre as muralhas existentes e não obstruem o portão.
    const gateDetails = new THREE.Group();
    gateDetails.name = 'lorencia_east_gate_details';
    for (const centerZ of [-8, 8]) {
      for (let i = -3; i <= 3; i++) {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.0), matCobble);
        merlon.position.set(-15, 5.4, centerZ + i * 1.8);
        gateDetails.add(merlon);
      }
    }
    for (const z of [-15, 15]) {
      const rim = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.22, 6, 24), matCobble);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(-15, 7.55, z);
      gateDetails.add(rim);
    }
    envGroup.add(gateDetails);

    // A vegetação é baixa e decorativa: não cria novos bloqueios no terreno.
    const grass = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(0.45, 0.32),
      new THREE.MeshStandardMaterial({ color: 0x526348, roughness: 1, side: THREE.DoubleSide }),
      72
    );
    grass.name = 'lorencia_east_grass';
    grass.userData.nonBlockingDecoration = true;
    const blade = new THREE.Object3D();
    for (let i = 0; i < 72; i++) {
      const x = -20 + ((i * 31) % 400) / 10;
      const z = -22 + ((i * 73) % 440) / 10;
      blade.position.set(x, 0.16, z);
      blade.rotation.y = (i % 8) * Math.PI / 4;
      blade.updateMatrix();
      grass.setMatrixAt(i, blade.matrix);
    }
    envGroup.add(grass);

  } else if (id === 'LOR_03') {
    // LOR_03: West Gate & Spider Woods (Bosque das Aranhas, Teias e Pântano)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(52, 52, 16, 16), new THREE.MeshStandardMaterial({ color: 0x1c211a, roughness: 0.95 }));
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Muralha Oeste
    const wallN = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.0, 14.0), matStoneDark);
    wallN.position.set(15, 2.5, 8);
    envGroup.add(wallN);
    const wallS = new THREE.Mesh(new THREE.BoxGeometry(4.0, 5.0, 14.0), matStoneDark);
    wallS.position.set(15, 2.5, -8);
    envGroup.add(wallS);

    // Árvore Ancestral das Aranhas
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.5, 8.0, 8), matWood);
    trunk.position.set(0, 4.0, 0);
    envGroup.add(trunk);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(5.0, 8, 8), new THREE.MeshStandardMaterial({ color: 0x142012, roughness: 0.9 }));
    canopy.position.set(0, 8.5, 0);
    envGroup.add(canopy);

    // Árvores Retorcidas Secundárias
    const treeCoords = [[-10, 8, 2.2], [-8, -12, 2.4], [6, -14, 1.8]];
    treeCoords.forEach(([tx, tz, tr]) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(tr * 0.7, tr, 6.0, 6), matWood);
      t.position.set(tx, 3.0, tz);
      envGroup.add(t);
    });

    // Ruínas cobertas de teias
    const ruins = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.0, 6.0), matStoneDark);
    ruins.position.set(-14, 1.5, 12);
    envGroup.add(ruins);

    // Relevos e teias ficam sobre a ruína já coberta pelo colisor.
    const ruinDetails = new THREE.Group();
    ruinDetails.name = 'lorencia_spider_ruin_details';
    const cap = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.35, 5.7), matCobble);
    cap.position.set(-14, 3.17, 12);
    ruinDetails.add(cap);
    const webVertices = [];
    const center = [-14, 2.0, 9.01];
    const rim = [[-16.0, 0.9], [-16.0, 2.9], [-14, 3.0], [-12.0, 2.9], [-12.0, 0.9]];
    for (const [x, y] of rim) webVertices.push(...center, x, y, 9.01);
    for (let i = 0; i < rim.length - 1; i++) {
      const [x1, y1] = rim[i], [x2, y2] = rim[i + 1];
      webVertices.push(x1, y1, 9.01, x2, y2, 9.01);
    }
    const webGeometry = new THREE.BufferGeometry();
    webGeometry.setAttribute('position', new THREE.Float32BufferAttribute(webVertices, 3));
    const web = new THREE.LineSegments(webGeometry, new THREE.LineBasicMaterial({ color: 0xb2c0af }));
    web.name = 'lorencia_spider_web';
    ruinDetails.add(web);
    envGroup.add(ruinDetails);

    // Partículas locais dão movimento ao bosque e ficam fora dos GLBs estáticos.
    animParts.forestMotes = createParticleCloud(100, 0x9ab18a, 0.07, { x: 38, y: 5, z: 38 }, 0.45, false);

    // Luzes Esverdeadas do Veneno
    const poisonLight = new THREE.PointLight(0x84cc16, 2.5, 12);
    poisonLight.position.set(0, 2.5, 0);
    envGroup.add(poisonLight);
    dynamicLights.push(poisonLight);

  } else if (id === 'LOR_04') {
    // LOR_04: North Gate & Castle Bridge (Ponte Levadiça sobre Fosso Abissal)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 50, 16, 16), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = -10;
    envGroup.add(floor);

    // Abismo Esquerdo e Direito (Caixas Escuras Profundas)
    const chasmMat = new THREE.MeshBasicMaterial({ color: 0x020408 });
    const chasmL = new THREE.Mesh(new THREE.BoxGeometry(12.0, 8.0, 28.0), chasmMat);
    chasmL.position.set(-14, -4.0, -10);
    envGroup.add(chasmL);
    const chasmR = new THREE.Mesh(new THREE.BoxGeometry(12.0, 8.0, 28.0), chasmMat);
    chasmR.position.set(14, -4.0, -10);
    envGroup.add(chasmR);

    // Ponte do Castelo com Guarda-Corpos
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.8, 28.0), matCobble);
    bridge.position.set(0, 0.4, -10);
    envGroup.add(bridge);

    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 28.0), matStoneDark);
    railL.position.set(-4.5, 1.1, -10);
    envGroup.add(railL);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 28.0), matStoneDark);
    railR.position.set(4.5, 1.1, -10);
    envGroup.add(railR);

    // Bastiões do Castelo Real
    const basL = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 9.0, 12), matStoneDark);
    basL.position.set(-6.0, 4.5, -25);
    envGroup.add(basL);
    const basR = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 9.0, 12), matStoneDark);
    basR.position.set(6.0, 4.5, -25);
    envGroup.add(basR);

  } else if (id === 'LOR_05') {
    // LOR_05: South Cemetery (Cemitério dos Heróis Caídos)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 16, 16), new THREE.MeshStandardMaterial({ color: 0x181e18, roughness: 0.95 }));
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Mausoléu Central
    const mausoleum = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.5, 7.0), matStoneDark);
    mausoleum.position.set(0, 2.25, -8);
    envGroup.add(mausoleum);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.5, 2.5, 4), matStoneDark);
    roof.position.set(0, 5.75, -8);
    roof.rotation.y = Math.PI / 4;
    envGroup.add(roof);

    // Criptas Laterais
    const cryptL = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.5, 5.0), matCobble);
    cryptL.position.set(-12, 1.25, 2);
    envGroup.add(cryptL);
    const cryptR = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.5, 5.0), matCobble);
    cryptR.position.set(12, 1.25, 2);
    envGroup.add(cryptR);

    // Estátua do Anjo Pesaroso
    const angel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 2.8, 8), matStoneDark);
    angel.position.set(0, 1.4, 5);
    envGroup.add(angel);

    // Salgueiro Morto
    const willow = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.1, 6.0, 8), matWood);
    willow.position.set(-8, 3.0, -14);
    envGroup.add(willow);

    // Luz Fátua Ectoplásmica
    const wispLight = new THREE.PointLight(0x06b6d4, 2.8, 12);
    wispLight.position.set(0, 2.0, 0);
    envGroup.add(wispLight);
    dynamicLights.push(wispLight);

  } else if (id === 'LOR_06') {
    // LOR_06: Tavern Interior (A Taverna da Lareira)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 20, 8, 8), matWood);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Balcão de Carvalho
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.2, 9.0), matWood);
    bar.position.set(-6, 0.6, -2);
    envGroup.add(bar);

    // Lareira Crepitante
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.2, 2.0), matStoneDark);
    hearth.position.set(0, 1.6, -8.8);
    envGroup.add(hearth);
    const fire = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf97316 }));
    fire.position.set(0, 0.8, -8.0);
    envGroup.add(fire);
    const hearthLight = new THREE.PointLight(0xf59e0b, 3.5, 10);
    hearthLight.position.set(0, 1.2, -7.5);
    envGroup.add(hearthLight);
    dynamicLights.push(hearthLight);

    // Mesas Redondas com Bancos
    const table1 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.8, 12), matWood);
    table1.position.set(4, 0.4, 2);
    envGroup.add(table1);
    const table2 = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.8, 12), matWood);
    table2.position.set(4, 0.4, -5);
    envGroup.add(table2);

    // Barris de Hidromel
    const barrels = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.0, 3.5), matWood);
    barrels.position.set(-9.5, 1.0, -7);
    envGroup.add(barrels);

  } else if (id === 'LOR_07') {
    // LOR_07: Blacksmith Forge (A Forja de Hanzo)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20, 8, 8), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Fornalha de Carvão Incandescente
    const furnace = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.8, 3.5), matStoneDark);
    furnace.position.set(0, 1.9, -6.5);
    envGroup.add(furnace);
    const coals = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    coals.position.set(0, 1.2, -5.5);
    envGroup.add(coals);
    const forgeLight = new THREE.PointLight(0xf97316, 4.0, 12);
    forgeLight.position.set(0, 1.8, -5.0);
    envGroup.add(forgeLight);
    dynamicLights.push(forgeLight);

    // Bigorna Gigante
    const anvil = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.0), matIron);
    anvil.position.set(0, 0.6, -1.0);
    envGroup.add(anvil);

    // Calha de Resfriamento com Água
    const trough = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 5.0), matStoneDark);
    trough.position.set(-5.5, 0.4, -1.5);
    envGroup.add(trough);

    // Suporte de Armas
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 6.0), matWood);
    rack.position.set(6.0, 1.1, 0);
    envGroup.add(rack);

  // ==========================================================================
  // 2. NORIA (7 CENÁRIOS)
  // ==========================================================================
  } else if (id === 'NOR_01') {
    // NOR_01: Sanctuary Mother Tree (Árvore Mãe & Praça Élfica)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 16, 16), matFeyMoss);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Tronco Colossal da Árvore Mãe
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.5, 12.0, 16), matWood);
    trunk.position.set(0, 6.0, -5);
    envGroup.add(trunk);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(10.0, 12, 12), new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.85 }));
    canopy.position.set(0, 14.0, -5);
    canopy.scale.y = 0.55;
    envGroup.add(canopy);

    // Varandas e lanternas junto ao tronco: detalhe elevado, sem novos bloqueios.
    const treeDetails = new THREE.Group();
    treeDetails.name = 'noria_tree_details';
    const balconyMat = new THREE.MeshStandardMaterial({ color: 0x604a30, roughness: 0.85 });
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0xb0a663, emissive: 0x65733b, emissiveIntensity: 0.6, roughness: 0.7 });
    for (const height of [5.6, 7.4]) {
      const balcony = new THREE.Mesh(new THREE.TorusGeometry(4.55, 0.22, 6, 24), balconyMat);
      balcony.rotation.x = Math.PI / 2;
      balcony.position.set(0, height, -5);
      treeDetails.add(balcony);
    }
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), lanternMat);
      lantern.position.set(Math.cos(angle) * 4.4, 6.05, -5 + Math.sin(angle) * 4.4);
      treeDetails.add(lantern);
    }
    envGroup.add(treeDetails);

    // 4 Raízes Ciclópicas
    const rootCoords = [[4.8, -1.5], [-4.8, -1.5], [-4.5, -8.5], [4.5, -8.5]];
    rootCoords.forEach(([rx, rz]) => {
      const root = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.9, 3.5, 8), matWood);
      root.position.set(rx, 1.75, rz);
      envGroup.add(root);
    });

    // Fonte de Cristal Élfica
    const fountain = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.8, 16), matNacar);
    fountain.position.set(0, 0.4, 6.5);
    envGroup.add(fountain);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.95, 24), new THREE.MeshStandardMaterial({ color: 0x396f68, roughness: 0.22, metalness: 0.35 }));
    water.name = 'noria_fountain_water';
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.81, 6.5);
    envGroup.add(water);
    const fLight = new THREE.PointLight(0x10b981, 2.5, 10);
    fLight.position.set(0, 1.5, 6.5);
    envGroup.add(fLight);
    dynamicLights.push(fLight);

    // Pavilhões Élficos
    const pavL = new THREE.Mesh(new THREE.BoxGeometry(5.0, 4.0, 7.0), matNacar);
    pavL.position.set(-13, 2.0, 2);
    envGroup.add(pavL);
    const pavR = new THREE.Mesh(new THREE.BoxGeometry(5.0, 4.0, 7.0), matNacar);
    pavR.position.set(13, 2.0, 2);
    envGroup.add(pavR);

    // Telhados e janelas mantidos dentro das projeções dos pavilhões.
    const pavilionDetails = new THREE.Group();
    pavilionDetails.name = 'noria_pavilion_details';
    for (const x of [-13, 13]) {
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.0, 4), matWood);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(x, 5, 2);
      pavilionDetails.add(roof);
      const window = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.06), lanternMat);
      window.position.set(x, 2.2, -1.48);
      pavilionDetails.add(window);
    }
    envGroup.add(pavilionDetails);

  } else if (id === 'NOR_02') {
    // NOR_02: Chaos Machine Workshop (Oficina dos Duendes e Chaos Forge)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30, 8, 8), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Plataforma da Chaos Machine
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, 0.8, 20), matStoneDark);
    dais.position.y = 0.4;
    envGroup.add(dais);

    // Engrenagens da Forja
    const gearMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.3 });
    const gear1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 16), gearMat);
    gear1.position.set(0, 1.1, 0);
    envGroup.add(gear1);
    animParts.chaosGear = gear1;

    // Núcleo de Plasma do Caos
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 2), new THREE.MeshBasicMaterial({ color: 0xfb923c, wireframe: true }));
    core.position.set(0, 2.1, 0);
    envGroup.add(core);
    animParts.chaosCore = core;

    const chaosLight = new THREE.PointLight(0xf59e0b, 3.8, 9);
    chaosLight.position.set(0, 2.2, 0);
    envGroup.add(chaosLight);
    dynamicLights.push(chaosLight);

    // Bancadas dos Duendes e Cofre
    const benchL = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 6.0), matWood);
    benchL.position.set(-8.5, 0.6, 3);
    envGroup.add(benchL);
    const benchR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 6.0), matWood);
    benchR.position.set(8.5, 0.6, 3);
    envGroup.add(benchR);
    const vault = new THREE.Mesh(new THREE.BoxGeometry(6.0, 2.5, 2.5), matIron);
    vault.position.set(0, 1.25, -10);
    envGroup.add(vault);

  } else if (id === 'NOR_03') {
    // NOR_03: Queen Lúthien's Altar (Altar Élfico & Lago de Néctar)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(38, 38, 12, 12), matFeyMoss);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Pedestal e Estátua da Rainha
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.2, 4.5), matNacar);
    pedestal.position.set(0, 0.6, -4);
    envGroup.add(pedestal);
    const queen = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 3.0, 8), matNacar);
    queen.position.set(0, 2.7, -4);
    envGroup.add(queen);

    // Lago Sagrado de Néctar
    const pool = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.1, metalness: 0.5 }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.05, 4.5);
    envGroup.add(pool);

    // 4 Pilares Rúnicos Élficos
    const pilCoords = [[-6, -8], [6, -8], [-6, 0], [6, 0]];
    pilCoords.forEach(([px, pz]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 4.5, 8), matNacar);
      p.position.set(px, 2.25, pz);
      envGroup.add(p);
    });

  } else if (id === 'NOR_04') {
    // NOR_04: East Groves (Bosque das Ninfas)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50, 16, 16), matFeyMoss);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // 4 Árvores Anciãs
    const groveCoords = [[-6, -8, 2.5], [8, -10, 2.8], [4, 12, 2.4], [-10, 14, 2.2]];
    groveCoords.forEach(([gx, gz, gr]) => {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(gr * 0.7, gr, 7.0, 8), matWood);
      t.position.set(gx, 3.5, gz);
      envGroup.add(t);
      const c = new THREE.Mesh(new THREE.SphereGeometry(gr * 1.8, 8, 8), new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.85 }));
      c.position.set(gx, 7.5, gz);
      envGroup.add(c);
    });

    // Monólito Central das Ninfas
    const monolith = new THREE.Mesh(new THREE.BoxGeometry(3.5, 5.5, 3.5), matNacar);
    monolith.position.set(0, 2.75, 0);
    envGroup.add(monolith);
    const mLight = new THREE.PointLight(0x34d399, 3.0, 10);
    mLight.position.set(0, 3.5, 0);
    envGroup.add(mLight);
    dynamicLights.push(mLight);

  } else if (id === 'NOR_05') {
    // NOR_05: Giant Mushroom Glade (Clareira dos Cogumelos Colossais)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42, 16, 16), new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 }));
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Cogumelo Gigante Central
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.4, 7.0, 12), matNacar);
    stem.position.set(0, 3.5, 0);
    envGroup.add(stem);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.8, 16), new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.4, emissive: 0x6b21a8, emissiveIntensity: 1.2 }));
    cap.position.set(0, 7.5, 0);
    envGroup.add(cap);

    // Cogumelos Laterais
    const shroomCoords = [[-10, -6, 2.8, 0x06b6d4], [10, -6, 2.8, 0xf43f5e]];
    shroomCoords.forEach(([sx, sz, sr, col]) => {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(sr * 0.4, sr * 0.6, 5.0, 10), matNacar);
      s.position.set(sx, 2.5, sz);
      envGroup.add(s);
      const c = new THREE.Mesh(new THREE.ConeGeometry(sr * 1.4, 1.8, 12), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.8 }));
      c.position.set(sx, 5.2, sz);
      envGroup.add(c);
      const sl = new THREE.PointLight(col, 2.5, 8);
      sl.position.set(sx, 3.0, sz);
      envGroup.add(sl);
      dynamicLights.push(sl);
    });

  } else if (id === 'NOR_06') {
    // NOR_06: Deep Canyon & Rope Bridge (Cânion Abissal e Ponte Pênsil)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 58, 12, 16), matFeyMoss);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Abismo do Cânion (Esquerda e Direita)
    const chasmMat = new THREE.MeshBasicMaterial({ color: 0x030712 });
    const chasmL = new THREE.Mesh(new THREE.BoxGeometry(8.0, 10.0, 40.0), chasmMat);
    chasmL.position.set(-10, -5.0, 0);
    envGroup.add(chasmL);
    const chasmR = new THREE.Mesh(new THREE.BoxGeometry(8.0, 10.0, 40.0), chasmMat);
    chasmR.position.set(10, -5.0, 0);
    envGroup.add(chasmR);

    // Ponte Pênsil de Corda e Tábuas
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.4, 38.0), matWood);
    bridge.position.set(0, 0.2, 0);
    envGroup.add(bridge);

    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 36.0), matWood);
    railL.position.set(-3.2, 0.9, 0);
    envGroup.add(railL);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 36.0), matWood);
    railR.position.set(3.2, 0.9, 0);
    envGroup.add(railR);

  } else if (id === 'NOR_07') {
    // NOR_07: Creeper Hollow (Covil do Stone Golem)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 16, 16), matFeyMoss);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Torso Petrificafo do Stone Golem
    const golem = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2, 1), matStoneDark);
    golem.position.set(0, 3.2, -3);
    envGroup.add(golem);

    // Paredes e Rochas da Garganta
    const cragW = new THREE.Mesh(new THREE.BoxGeometry(6.0, 6.0, 16.0), matStoneDark);
    cragW.position.set(-14, 3.0, 0);
    envGroup.add(cragW);
    const cragE = new THREE.Mesh(new THREE.BoxGeometry(6.0, 6.0, 16.0), matStoneDark);
    cragE.position.set(14, 3.0, 0);
    envGroup.add(cragE);
    const cragN = new THREE.Mesh(new THREE.BoxGeometry(22.0, 7.0, 6.0), matStoneDark);
    cragN.position.set(0, 3.5, -16);
    envGroup.add(cragN);

  // ==========================================================================
  // 3. DEVIAS (6 CENÁRIOS)
  // ==========================================================================
  } else if (id === 'DEV_01') {
    // DEV_01: Glacial Citadel & King's Hearth (A Fortaleza & Grande Braseiro do Rei)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 16, 16), matSnow);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Pedra úmida ao redor do braseiro: detalhe plano, sem novos obstáculos.
    const thawedStone = new THREE.Mesh(
      new THREE.CircleGeometry(7.2, 40),
      new THREE.MeshStandardMaterial({ color: 0x4d5354, roughness: 0.34, metalness: 0.12 })
    );
    thawedStone.name = 'devias_thawed_stone';
    thawedStone.rotation.x = -Math.PI / 2;
    thawedStone.position.y = 0.015;
    envGroup.add(thawedStone);

    // O Grande Braseiro Real
    const brazier = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.8, 1.2, 24), matIron);
    brazier.position.y = 0.6;
    envGroup.add(brazier);

    // Chama do Braseiro
    const flame = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.8, 12), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    flame.name = 'devias_brazier_flame';
    flame.position.y = 2.2;
    envGroup.add(flame);
    animParts.kingFlame = flame;

    const fireLight = new THREE.PointLight(0xf59e0b, 4.5, 14);
    fireLight.position.set(0, 2.5, 0);
    envGroup.add(fireLight);
    dynamicLights.push(fireLight);

    // Muralhas da Fortaleza
    const wallNW = new THREE.Mesh(new THREE.BoxGeometry(8.0, 5.5, 16.0), matStoneDark);
    wallNW.position.set(-14, 2.75, -10);
    envGroup.add(wallNW);
    const wallNE = new THREE.Mesh(new THREE.BoxGeometry(8.0, 5.5, 16.0), matStoneDark);
    wallNE.position.set(14, 2.75, -10);
    envGroup.add(wallNE);

    // Ameias sobre a projeção existente das muralhas.
    const battlements = new THREE.Group();
    battlements.name = 'devias_battlements';
    for (const x of [-14, 14]) {
      for (let i = -3; i <= 3; i++) {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), matStoneDark);
        merlon.position.set(x, 5.95, -10 + i * 2.0);
        battlements.add(merlon);
      }
    }
    envGroup.add(battlements);

    // 4 Pilares de Gelo Glacial
    const iceCoords = [[-7, -8], [7, -8], [-7, 6], [7, 6]];
    iceCoords.forEach(([ix, iz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 5.5, 8), matGlacialIce);
      col.position.set(ix, 2.75, iz);
      envGroup.add(col);
    });

  } else if (id === 'DEV_02') {
    // DEV_02: Cathedral Facade (Fachada da Basílica Boreal)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42, 16, 16), matSnow);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Fachada e Torres da Basílica
    const facade = new THREE.Mesh(new THREE.BoxGeometry(22.0, 8.0, 8.0), matStoneDark);
    facade.position.set(0, 4.0, -14);
    envGroup.add(facade);

    const towL = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 14.0, 8), matStoneDark);
    towL.position.set(-10, 7.0, -14);
    envGroup.add(towL);
    const towR = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 14.0, 8), matStoneDark);
    towR.position.set(10, 7.0, -14);
    envGroup.add(towR);

    // Degraus Congelados
    const stairs = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.2, 3.0), matGlacialIce);
    stairs.position.set(0, 0.6, -8);
    envGroup.add(stairs);

  } else if (id === 'DEV_03') {
    // DEV_03: North Snowfields (Campos de Neve do Norte & Naufrágio Congelado)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(54, 54, 16, 16), matSnow);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Carcaça de Naufrágio Encalhado no Gelo
    const wreck = new THREE.Mesh(new THREE.BoxGeometry(8.0, 4.5, 14.0), matWood);
    wreck.position.set(-10, 2.0, -5);
    wreck.rotation.z = 0.25;
    envGroup.add(wreck);

    // Corcovas de Glaciar
    const hump1 = new THREE.Mesh(new THREE.DodecahedronGeometry(4.0, 1), matGlacialIce);
    hump1.position.set(8, 2.0, 8);
    envGroup.add(hump1);
    const hump2 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5, 1), matGlacialIce);
    hump2.position.set(-12, 1.8, 12);
    envGroup.add(hump2);

    // Barreira de Penhascos de Gelo ao Norte
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(44.0, 8.0, 4.0), matStoneDark);
    cliff.position.set(0, 4.0, 22);
    envGroup.add(cliff);

  } else if (id === 'DEV_04') {
    // DEV_04: Ice Shard Ridge (Crista dos Espinhos de Gelo Perfurantes)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 16, 16), matSnow);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Espinho de Gelo Colossal Central
    const mainSpike = new THREE.Mesh(new THREE.ConeGeometry(3.2, 10.0, 6), matGlacialIce);
    mainSpike.position.set(0, 5.0, 0);
    envGroup.add(mainSpike);

    // Cachos de Espinhos de Gelo Secundários
    const clusterCoords = [[-9, -8, 2.4], [9, -8, 2.4], [-8, 8, 2.0], [8, 8, 2.0]];
    clusterCoords.forEach(([cx, cz, cr]) => {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(cr, cr * 3.2, 5), matGlacialIce);
      sp.position.set(cx, cr * 1.6, cz);
      envGroup.add(sp);
    });

  } else if (id === 'DEV_05') {
    // DEV_05: Frozen Abyss Bridge (Ponte de Gelo sobre o Abismo Congelado)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 54, 12, 16), matSnow);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Abismo Esquerdo e Direito
    const voidMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
    const voidL = new THREE.Mesh(new THREE.BoxGeometry(7.0, 10.0, 46.0), voidMat);
    voidL.position.set(-9.5, -5.0, 0);
    envGroup.add(voidL);
    const voidR = new THREE.Mesh(new THREE.BoxGeometry(7.0, 10.0, 46.0), voidMat);
    voidR.position.set(9.5, -5.0, 0);
    envGroup.add(voidR);

    // Ponte Translúcida de Gelo
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.8, 44.0), matGlacialIce);
    bridge.position.set(0, 0.4, 0);
    envGroup.add(bridge);

    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 44.0), matGlacialIce);
    railL.position.set(-3.0, 1.0, 0);
    envGroup.add(railL);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 44.0), matGlacialIce);
    railR.position.set(3.0, 1.0, 0);
    envGroup.add(railR);

  } else if (id === 'DEV_06') {
    // DEV_06: Ice Queen Palace (Trono Lapidado da Rainha do Gelo)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(38, 38, 12, 12), matGlacialIce);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Estrutura e Trono da Rainha do Gelo
    const dais = new THREE.Mesh(new THREE.BoxGeometry(6.0, 1.5, 5.5), matGlacialIce);
    dais.position.set(0, 0.75, -6.5);
    envGroup.add(dais);
    const statue = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 3.2, 8), matGlacialIce);
    statue.position.set(0, 3.1, -6.5);
    envGroup.add(statue);

    // 4 Colunas Candelabro Cristalinas
    const colCoords = [[-6, -10], [6, -10], [-6, 2], [6, 2]];
    colCoords.forEach(([cx, cz]) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 6.0, 6), matGlacialIce);
      c.position.set(cx, 3.0, cz);
      envGroup.add(c);
      const l = new THREE.PointLight(0x7dd3fc, 2.5, 8);
      l.position.set(cx, 4.5, cz);
      envGroup.add(l);
      dynamicLights.push(l);
    });

  // ==========================================================================
  // 4. DUNGEON (6 CENÁRIOS)
  // ==========================================================================
  } else if (id === 'DNG_01') {
    // DNG_01: Entrance & Ossuary (Entrada das Catacumbas & Ossuário)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(38, 38, 12, 12), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Ossuário Piramidal de Crânios
    const ossuary = new THREE.Mesh(new THREE.ConeGeometry(4.0, 3.5, 4), matBone);
    ossuary.position.set(0, 1.75, -2);
    ossuary.rotation.y = Math.PI / 4;
    envGroup.add(ossuary);

    // Portão de Ferro das Catacumbas
    const gateL = new THREE.Mesh(new THREE.BoxGeometry(8.0, 5.0, 3.0), matStoneDark);
    gateL.position.set(-9, 2.5, 14);
    envGroup.add(gateL);
    const gateR = new THREE.Mesh(new THREE.BoxGeometry(8.0, 5.0, 3.0), matStoneDark);
    gateR.position.set(9, 2.5, 14);
    envGroup.add(gateR);

    // Braseiros de Fogo Verde
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 1.6, 8), matIron);
    b1.position.set(-4, 0.8, 6);
    envGroup.add(b1);
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 1.6, 8), matIron);
    b2.position.set(4, 0.8, 6);
    envGroup.add(b2);
    const gl1 = new THREE.PointLight(0x22c55e, 3.0, 9);
    gl1.position.set(-4, 1.8, 6);
    envGroup.add(gl1);
    dynamicLights.push(gl1);
    const gl2 = new THREE.PointLight(0x22c55e, 3.0, 9);
    gl2.position.set(4, 1.8, 6);
    envGroup.add(gl2);
    dynamicLights.push(gl2);

  } else if (id === 'DNG_02') {
    // DNG_02: Prison Corridors (Celas de Grade e Grilhões)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42, 12, 12), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // 4 Blocos de Celas Prisionais
    const cellPositions = [[-6, 12], [6, 12], [-6, -12], [6, -12]];
    cellPositions.forEach(([cx, cz]) => {
      const cell = new THREE.Mesh(new THREE.BoxGeometry(7.0, 4.0, 6.0), matStoneDark);
      cell.position.set(cx, 2.0, cz);
      envGroup.add(cell);
      // Grades de Ferro
      const bars = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.5, 0.2), matIron);
      bars.position.set(cx, 1.8, cz + (cz > 0 ? -3.0 : 3.0));
      envGroup.add(bars);
    });

    // Gaiola Gibbet Central Suspensa
    const gibbet = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 2.2, 8), matIron);
    gibbet.position.set(0, 2.8, 0);
    envGroup.add(gibbet);

  } else if (id === 'DNG_03') {
    // DNG_03: Poison Crypts (Criptas Venenosas & Lodo Ácido)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42, 12, 12), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Piscina de Ácido Verde Borbulhante
    const acidPool = new THREE.Mesh(new THREE.CircleGeometry(3.8, 20), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.1, emissive: 0x15803d, emissiveIntensity: 2.0 }));
    acidPool.rotation.x = -Math.PI / 2;
    acidPool.position.y = 0.05;
    envGroup.add(acidPool);

    const acidLight = new THREE.PointLight(0x22c55e, 4.0, 10);
    acidLight.position.set(0, 1.5, 0);
    envGroup.add(acidLight);
    dynamicLights.push(acidLight);

    // Sarcófagos Venenosos
    const tombL = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 6.0), matStoneDark);
    tombL.position.set(-10, 0.9, -6);
    envGroup.add(tombL);
    const tombR = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.8, 6.0), matStoneDark);
    tombR.position.set(10, 0.9, -6);
    envGroup.add(tombR);

  } else if (id === 'DNG_04') {
    // DNG_04: Torture Pit (Poço de Tortura & Forjas de Sangue)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(38, 38, 12, 12), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Mesa de Estiramento
    const rack = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.0, 3.0), matWood);
    rack.position.set(-5, 0.5, -2);
    envGroup.add(rack);

    // Donzela de Ferro
    const maiden = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 3.2, 10), matIron);
    maiden.position.set(5, 1.6, -2);
    envGroup.add(maiden);

    // Fornalha de Sangue
    const furnace = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 3.0, 12), matStoneDark);
    furnace.position.set(0, 1.5, -10);
    envGroup.add(furnace);
    const fLight = new THREE.PointLight(0xb91c1c, 3.5, 10);
    fLight.position.set(0, 2.0, -9);
    envGroup.add(fLight);
    dynamicLights.push(fLight);

  } else if (id === 'DNG_05') {
    // DNG_05: Lost Souls Maze (Labirinto das Almas Perdidas)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 16, 16), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Paredes do Labirinto
    const wallH1 = new THREE.Mesh(new THREE.BoxGeometry(18.0, 3.5, 2.5), matStoneDark);
    wallH1.position.set(-4, 1.75, -8);
    envGroup.add(wallH1);
    const wallH2 = new THREE.Mesh(new THREE.BoxGeometry(18.0, 3.5, 2.5), matStoneDark);
    wallH2.position.set(6, 1.75, 4);
    envGroup.add(wallH2);
    const wallV1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 16.0), matStoneDark);
    wallV1.position.set(-10, 1.75, 4);
    envGroup.add(wallV1);
    const wallV2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 14.0), matStoneDark);
    wallV2.position.set(4, 1.75, -6);
    envGroup.add(wallV2);

    // Monólito Espectral Violeta
    const spectral = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.0, 4.5, 6), new THREE.MeshStandardMaterial({ color: 0x9333ea, emissive: 0x7e22ce, emissiveIntensity: 1.5 }));
    spectral.position.set(12, 2.25, 12);
    envGroup.add(spectral);
    const sLight = new THREE.PointLight(0xa855f7, 3.5, 12);
    sLight.position.set(12, 3.0, 12);
    envGroup.add(sLight);
    dynamicLights.push(sLight);

  } else if (id === 'DNG_06') {
    // DNG_06: Gorgon's Lair (O Covil Abissal da Górgona)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50, 16, 16), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Dais e Trono da Górgona
    const dais = new THREE.Mesh(new THREE.BoxGeometry(8.0, 1.5, 7.0), matStoneDark);
    dais.position.set(0, 0.75, -6);
    envGroup.add(dais);
    const throne = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 3.5, 8), matStoneDark);
    throne.position.set(0, 3.0, -7);
    envGroup.add(throne);

    // Guerreiros Petrificados
    const pet1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.4, 6), matStoneDark);
    pet1.position.set(-6, 1.2, 2);
    envGroup.add(pet1);
    const pet2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.4, 6), matStoneDark);
    pet2.position.set(6, 1.2, 2);
    envGroup.add(pet2);

    // Pilares de Serpente
    const pSerpL = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 6.5, 8), matStoneDark);
    pSerpL.position.set(-12, 3.25, 6);
    envGroup.add(pSerpL);
    const pSerpR = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 6.5, 8), matStoneDark);
    pSerpR.position.set(12, 3.25, 6);
    envGroup.add(pSerpR);

  // ==========================================================================
  // 5. LOST TOWER (7 CENÁRIOS)
  // ==========================================================================
  } else if (id === 'LT_01') {
    // LT_01: Obsidian Gateway (Portal de Obsidiana & Chamas)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(38, 38, 12, 12), matObsidian);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Portal Monumental de Obsidiana
    const archL = new THREE.Mesh(new THREE.BoxGeometry(4.0, 7.5, 6.0), matObsidian);
    archL.position.set(-7, 3.75, -12);
    envGroup.add(archL);
    const archR = new THREE.Mesh(new THREE.BoxGeometry(4.0, 7.5, 6.0), matObsidian);
    archR.position.set(7, 3.75, -12);
    envGroup.add(archR);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(14.0, 3.0, 3.0), matObsidian);
    lintel.position.set(0, 9.0, -12);
    envGroup.add(lintel);

    // Braseiros Infernais
    const brL = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 2.0, 8), matIron);
    brL.position.set(-4, 1.0, -4);
    envGroup.add(brL);
    const brR = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 2.0, 8), matIron);
    brR.position.set(4, 1.0, -4);
    envGroup.add(brR);
    const fLight = new THREE.PointLight(0xf97316, 4.0, 12);
    fLight.position.set(0, 2.5, -4);
    envGroup.add(fLight);
    dynamicLights.push(fLight);

  } else if (id === 'LT_02') {
    // LT_02: Runed Corridors (Corredores Rúnicos Incandescentes)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 58, 12, 16), matObsidian);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Paredes com Glifos de Magma
    const wL = new THREE.Mesh(new THREE.BoxGeometry(4.0, 6.0, 48.0), matObsidian);
    wL.position.set(-8.5, 3.0, 0);
    envGroup.add(wL);
    const wR = new THREE.Mesh(new THREE.BoxGeometry(4.0, 6.0, 48.0), matObsidian);
    wR.position.set(8.5, 3.0, 0);
    envGroup.add(wR);

    // Pilares Demoníacos no Centro
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 5.0, 8), matMagma);
    p1.position.set(0, 2.5, 8);
    envGroup.add(p1);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 5.0, 8), matMagma);
    p2.position.set(0, 2.5, -8);
    envGroup.add(p2);

  } else if (id === 'LT_03') {
    // LT_03: Magma Grates Abyss (Grelhas sobre Mar de Lava)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42, 12, 12), matIron);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Poços de Magma
    const magmaSW = new THREE.Mesh(new THREE.CircleGeometry(4.5, 16), matMagma);
    magmaSW.rotation.x = -Math.PI / 2;
    magmaSW.position.set(-8, 0.05, 5);
    envGroup.add(magmaSW);
    const magmaSE = new THREE.Mesh(new THREE.CircleGeometry(4.5, 16), matMagma);
    magmaSE.rotation.x = -Math.PI / 2;
    magmaSE.position.set(8, 0.05, 5);
    envGroup.add(magmaSE);
    const magmaN = new THREE.Mesh(new THREE.CircleGeometry(5.5, 16), matMagma);
    magmaN.rotation.x = -Math.PI / 2;
    magmaN.position.set(0, 0.05, -8);
    envGroup.add(magmaN);

    const mLight = new THREE.PointLight(0xef4444, 4.5, 14);
    mLight.position.set(0, 2.0, 0);
    envGroup.add(mLight);
    dynamicLights.push(mLight);

  } else if (id === 'LT_04') {
    // LT_04: Demon Balcony (Mirante Demoníaco & Gárgulas)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 36, 12, 12), matObsidian);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Parapeito com Vista para o Abismo de Chamas
    const railing = new THREE.Mesh(new THREE.BoxGeometry(36.0, 1.8, 2.0), matObsidian);
    railing.position.set(0, 0.9, -12);
    envGroup.add(railing);

    // Gárgulas de Magma nas Pontas
    const gargL = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 3.8, 8), matStoneDark);
    gargL.position.set(-14, 1.9, -10);
    envGroup.add(gargL);
    const gargR = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 3.8, 8), matStoneDark);
    gargR.position.set(14, 1.9, -10);
    envGroup.add(gargR);

  } else if (id === 'LT_05') {
    // LT_05: Spiral Colonnade (Colunata Espiral Ascendente)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42, 12, 12), matObsidian);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Pilar Central Gigantesco
    const corePillar = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 4.2, 9.0, 16), matObsidian);
    corePillar.position.set(0, 4.5, 0);
    envGroup.add(corePillar);

    // 4 Colunas Periféricas
    const colCoords = [[-9, 0], [9, 0], [0, -9], [0, 9]];
    colCoords.forEach(([cx, cz]) => {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 6.0, 8), matObsidian);
      col.position.set(cx, 3.0, cz);
      envGroup.add(col);
    });

  } else if (id === 'LT_06') {
    // LT_06: Infernal Ramparts (Muralhas Infernais & Balistas)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 12, 12), matObsidian);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Muralha Frontal
    const rampart = new THREE.Mesh(new THREE.BoxGeometry(38.0, 4.5, 4.0), matObsidian);
    rampart.position.set(0, 2.25, 12);
    envGroup.add(rampart);

    // Balistas Demoníacas
    const bL = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.5, 5.0), matIron);
    bL.position.set(-10, 1.25, 6);
    envGroup.add(bL);
    const bR = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.5, 5.0), matIron);
    bR.position.set(10, 1.25, 6);
    envGroup.add(bR);

  } else if (id === 'LT_07') {
    // LT_07: Balrog's Throne (O Trono de Fogo do Balrog)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50, 16, 16), matObsidian);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Dais e Trono de Magma de Balrog
    const dais = new THREE.Mesh(new THREE.BoxGeometry(9.0, 2.0, 8.0), matObsidian);
    dais.position.set(0, 1.0, -8);
    envGroup.add(dais);
    const throne = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 4.0, 8), matMagma);
    throne.position.set(0, 3.5, -9);
    envGroup.add(throne);

    // 4 Pilares de Fogo Vivo
    const pCoords = [[-10, -14], [10, -14], [-10, 6], [10, 6]];
    pCoords.forEach(([px, pz]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 8.0, 8), matObsidian);
      p.position.set(px, 4.0, pz);
      envGroup.add(p);
      const fl = new THREE.PointLight(0xef4444, 3.8, 12);
      fl.position.set(px, 7.0, pz);
      envGroup.add(fl);
      dynamicLights.push(fl);
    });

  // ==========================================================================
  // 6. ATLANS (7 CENÁRIOS)
  // ==========================================================================
  } else if (id === 'ATL_01') {
    // ATL_01: Shallows & Caustics (Águas Rasas & Recifes)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 16, 16), new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.2, metalness: 0.3 }));
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Espigões de Coral
    const cCenter = new THREE.Mesh(new THREE.ConeGeometry(3.0, 6.0, 10), matCoralMagenta);
    cCenter.position.set(0, 3.0, -2);
    envGroup.add(cCenter);
    const cL = new THREE.Mesh(new THREE.ConeGeometry(2.0, 4.5, 8), matCoralMagenta);
    cL.position.set(-10, 2.25, 4);
    envGroup.add(cL);
    const cR = new THREE.Mesh(new THREE.ConeGeometry(2.0, 4.5, 8), matCoralMagenta);
    cR.position.set(10, 2.25, 4);
    envGroup.add(cR);

    // Luz Caustic Ciano
    const cLight = new THREE.PointLight(0x38bdf8, 3.5, 14);
    cLight.position.set(0, 3.5, 0);
    envGroup.add(cLight);
    dynamicLights.push(cLight);

  } else if (id === 'ATL_02') {
    // ATL_02: Nacar Sanctuary (Cúpula de Ar Élfica)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(38, 38, 12, 12), matNacar);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Plataforma do Altar de Nácar
    const altar = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.8, 0.8, 16), matNacar);
    altar.position.y = 0.4;
    envGroup.add(altar);

    // Bolha Mística de Ar
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(6.0, 16, 16), new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35 }));
    bubble.position.y = 3.0;
    envGroup.add(bubble);
    animParts.airDome = bubble;

    // 4 Colunas do Santuário
    const colCoords = [[-7, -7], [7, -7], [-7, 7], [7, 7]];
    colCoords.forEach(([cx, cz]) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 5.0, 8), matNacar);
      c.position.set(cx, 2.5, cz);
      envGroup.add(c);
    });

  } else if (id === 'ATL_03') {
    // ATL_03: Coral Labyrinth (Labirinto de Corais & Anêmonas)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 16, 16), new THREE.MeshStandardMaterial({ color: 0x0e7490, roughness: 0.3 }));
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Paredes de Coral
    const cWall1 = new THREE.Mesh(new THREE.BoxGeometry(14.0, 4.0, 3.0), matCoralMagenta);
    cWall1.position.set(-6, 2.0, -8);
    envGroup.add(cWall1);
    const cWall2 = new THREE.Mesh(new THREE.BoxGeometry(14.0, 4.0, 3.0), matCoralMagenta);
    cWall2.position.set(6, 2.0, 8);
    envGroup.add(cWall2);

    // Anêmonas Gigantes
    const an1 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 10, 10), new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x0891b2, emissiveIntensity: 1.0 }));
    an1.position.set(4, 1.8, -4);
    envGroup.add(an1);
    const an2 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 10, 10), new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xbe123c, emissiveIntensity: 1.0 }));
    an2.position.set(-6, 1.8, 6);
    envGroup.add(an2);

  } else if (id === 'ATL_04') {
    // ATL_04: Slipstream Trench (Trincheira das Correntes & Anéis Marinhos)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 62, 12, 16), new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.2 }));
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Paredes da Trincheira
    const wL = new THREE.Mesh(new THREE.BoxGeometry(5.0, 6.0, 52.0), matCoralMagenta);
    wL.position.set(-9, 3.0, 0);
    envGroup.add(wL);
    const wR = new THREE.Mesh(new THREE.BoxGeometry(5.0, 6.0, 52.0), matCoralMagenta);
    wR.position.set(9, 3.0, 0);
    envGroup.add(wR);

    // Anéis Hidrodinâmicos de Impulso
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.4, 8, 20), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.0 }));
    ring1.position.set(0, 3.0, 10);
    envGroup.add(ring1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.0, 0.4, 8, 20), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 2.0 }));
    ring2.position.set(0, 3.0, -10);
    envGroup.add(ring2);

  } else if (id === 'ATL_05') {
    // ATL_05: Leviathan Graveyard (Cemitério de Leviatãs & Galeão)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50, 16, 16), new THREE.MeshStandardMaterial({ color: 0x075985, roughness: 0.4 }));
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Crânio do Leviatã
    const skull = new THREE.Mesh(new THREE.BoxGeometry(7.0, 5.0, 8.5), matBone);
    skull.position.set(0, 2.5, -12);
    envGroup.add(skull);

    // Costelas Arqueadas
    for (let r = 0; r < 5; r++) {
      const ribL = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.35, 6, 12, Math.PI), matBone);
      ribL.rotation.y = Math.PI / 2;
      ribL.position.set(-6, 2.0, -8 + r * 4);
      envGroup.add(ribL);
      const ribR = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.35, 6, 12, Math.PI), matBone);
      ribR.rotation.y = -Math.PI / 2;
      ribR.position.set(6, 2.0, -8 + r * 4);
      envGroup.add(ribR);
    }

    // Galeão Naufragado
    const ship = new THREE.Mesh(new THREE.BoxGeometry(6.0, 4.0, 12.0), matWood);
    ship.position.set(12, 2.0, 10);
    ship.rotation.z = -0.3;
    envGroup.add(ship);

  } else if (id === 'ATL_06') {
    // ATL_06: Hydrothermal Fissures (Fendas Hidrotermais & Basalto Vulcânico)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42, 12, 12), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // 3 Chaminés Negras (Black Smokers)
    const chimCoords = [[-6, -4, 2.0], [6, -4, 2.0], [0, 6, 1.6]];
    chimCoords.forEach(([cx, cz, cr]) => {
      const chim = new THREE.Mesh(new THREE.CylinderGeometry(cr * 0.7, cr, 6.0, 8), matStoneDark);
      chim.position.set(cx, 3.0, cz);
      envGroup.add(chim);
    });

    // Fenda Vulcânica de Magma Submarino
    const fissure = new THREE.Mesh(new THREE.CircleGeometry(3.5, 16), matMagma);
    fissure.rotation.x = -Math.PI / 2;
    fissure.position.set(0, 0.05, -12);
    envGroup.add(fissure);
    const fisLight = new THREE.PointLight(0xf97316, 4.0, 10);
    fisLight.position.set(0, 1.5, -12);
    envGroup.add(fisLight);
    dynamicLights.push(fisLight);

  } else if (id === 'ATL_07') {
    // ATL_07: Hydra's Abyssal Maw (O Fosso Abissal da Grande Hydra)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50, 16, 16), new THREE.MeshStandardMaterial({ color: 0x022c43, roughness: 0.5 }));
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Fosso Abissal
    const maw = new THREE.Mesh(new THREE.CircleGeometry(6.5, 24), new THREE.MeshBasicMaterial({ color: 0x011627 }));
    maw.rotation.x = -Math.PI / 2;
    maw.position.set(0, 0.05, -4);
    envGroup.add(maw);

    // 4 Tentáculos Petrificados Colossais
    const tentCoords = [[-10, -12], [10, -12], [-12, 4], [12, 4]];
    tentCoords.forEach(([tx, tz]) => {
      const tent = new THREE.Mesh(new THREE.ConeGeometry(1.8, 8.0, 8), matStoneDark);
      tent.position.set(tx, 4.0, tz);
      envGroup.add(tent);
    });

  // ==========================================================================
  // 7. TARKAN (5 CENÁRIOS)
  // ==========================================================================
  } else if (id === 'TAR_01') {
    // TAR_01: Crimson Dunes (Dunas de Areia Carmesim & Tempestades)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(52, 52, 16, 16), matSandCrimson);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Cristas de Duna
    const dune1 = new THREE.Mesh(new THREE.SphereGeometry(5.5, 8, 8), matSandCrimson);
    dune1.position.set(-10, 0.5, -8);
    envGroup.add(dune1);
    const dune2 = new THREE.Mesh(new THREE.SphereGeometry(6.0, 8, 8), matSandCrimson);
    dune2.position.set(10, 0.5, 6);
    envGroup.add(dune2);

    // Monólito Fossilizado do Deserto
    const mono = new THREE.Mesh(new THREE.BoxGeometry(4.5, 7.5, 4.5), matStoneDark);
    mono.position.set(0, 3.75, -2);
    envGroup.add(mono);

    // Luz Dourada do Sol Escaldante
    const sunLight = new THREE.DirectionalLight(0xf59e0b, 2.5);
    sunLight.position.set(10, 15, 10);
    envGroup.add(sunLight);
    dynamicLights.push(sunLight);

  } else if (id === 'TAR_02') {
    // TAR_02: Boiling Oasis (Oásis Fervilhante & Palmeiras Secas)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 46, 16, 16), matSandCrimson);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Lago Fervilhante
    const boilingPool = new THREE.Mesh(new THREE.CircleGeometry(4.8, 20), new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, emissive: 0x0369a1, emissiveIntensity: 1.0 }));
    boilingPool.rotation.x = -Math.PI / 2;
    boilingPool.position.y = 0.05;
    envGroup.add(boilingPool);

    // Palmeiras Secas
    const palmCoords = [[-7, -6], [7, -6], [0, 8]];
    palmCoords.forEach(([px, pz]) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 5.5, 6), matWood);
      trunk.position.set(px, 2.75, pz);
      envGroup.add(trunk);
    });

  } else if (id === 'TAR_03') {
    // TAR_03: Leviathan Spine Ridge (Espinhaço do Grande Verme)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(46, 58, 16, 16), matSandCrimson);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Crânio do Verme Gigante
    const skull = new THREE.Mesh(new THREE.ConeGeometry(4.0, 9.0, 6), matBone);
    skull.rotation.x = Math.PI / 2;
    skull.position.set(0, 2.5, -18);
    envGroup.add(skull);

    // Arcos de Costelas
    for (let i = 0; i < 6; i++) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(4.5, 0.45, 6, 12, Math.PI), matBone);
      arc.position.set(0, 2.5, -10 + i * 4.5);
      envGroup.add(arc);
    }

  } else if (id === 'TAR_04') {
    // TAR_04: Iron Wheel Scrapyard (Cemitério de Autômatos de Ferro)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 50, 16, 16), matSandCrimson);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Rodas Colossais de Ferro
    const wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.2, 16), matIron);
    wheel1.rotation.z = Math.PI / 2;
    wheel1.position.set(0, 2.5, -8);
    envGroup.add(wheel1);
    const wheel2 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 1.0, 16), matIron);
    wheel2.rotation.x = 0.4;
    wheel2.position.set(6, 2.0, 8);
    envGroup.add(wheel2);

    // Chassi de Autômato Caído
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(6.0, 3.0, 5.5), matIron);
    chassis.position.set(-8, 1.5, 6);
    envGroup.add(chassis);

  } else if (id === 'TAR_05') {
    // TAR_05: Zaikan's Sand Crater (A Cratera de Areia Movediça de Zaikan)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(54, 54, 16, 16), matSandCrimson);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    envGroup.add(floor);

    // Cratera Vórtice
    const vortex = new THREE.Mesh(new THREE.ConeGeometry(7.0, 3.5, 24), matSandCrimson);
    vortex.rotation.x = Math.PI;
    vortex.position.y = -1.75;
    envGroup.add(vortex);
    animParts.zaikanVortex = vortex;

    // Altar Demoníaco de Zaikan
    const altar = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 4.0, 8), matStoneDark);
    altar.position.set(0, 2.0, -14);
    envGroup.add(altar);

    // Chifres de Osso Gigantes
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(1.8, 6.5, 6), matBone);
    hornL.rotation.z = -0.3;
    hornL.position.set(-12, 3.25, -8);
    envGroup.add(hornL);
    const hornR = new THREE.Mesh(new THREE.ConeGeometry(1.8, 6.5, 6), matBone);
    hornR.rotation.z = 0.3;
    hornR.position.set(12, 3.25, -8);
    envGroup.add(hornR);

  // ==========================================================================
  // 8. ICARUS (2 CENÁRIOS)
  // ==========================================================================
  } else if (id === 'ICA_01') {
    // ICA_01: Levitation Citadel (Cidadela da Levitação & Pontes de Luz)
    // Ilha Flutuante Central com Vácuo Cósmico
    const island = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 7.5, 3.0, 20), matNacar);
    island.position.y = -1.5;
    envGroup.add(island);

    // Obelisco Flutuante de Aetherita
    const obelisk = new THREE.Mesh(new THREE.OctahedronGeometry(2.8, 0), new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 2.2,
      metalness: 0.1,
      roughness: 0.1,
    }));
    obelisk.position.y = 3.5;
    envGroup.add(obelisk);
    animParts.aetheriteCore = obelisk;

    const oLight = new THREE.PointLight(0x38bdf8, 4.5, 14);
    oLight.position.set(0, 3.5, 0);
    envGroup.add(oLight);
    dynamicLights.push(oLight);

    // Monólitos de Luz Prismática
    const prism1 = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 4.5, 6), matNacar);
    prism1.position.set(-6, 2.25, -5);
    envGroup.add(prism1);
    const prism2 = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 4.5, 6), matNacar);
    prism2.position.set(6, 2.25, -5);
    envGroup.add(prism2);

  } else if (id === 'ICA_02') {
    // ICA_02: Dark Phoenix Lotus Nest (Ninho de Lótus do Dark Phoenix)
    const nestIsland = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 8.5, 3.5, 20), matObsidian);
    nestIsland.position.y = -1.75;
    envGroup.add(nestIsland);

    // Pétalas de Lótus de Obsidiana
    for (let p = 0; p < 8; p++) {
      const angle = (p / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.2, 4), matObsidian);
      petal.position.set(Math.cos(angle) * 4.2, 1.6, -3.5 + Math.sin(angle) * 4.2);
      petal.rotation.set(0.3 * Math.sin(angle), 0, 0.3 * Math.cos(angle));
      envGroup.add(petal);
    }

    // Fogo Cósmico do Dark Phoenix
    const pFire = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 12), new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 4.5,
    }));
    pFire.position.set(0, 2.2, -3.5);
    envGroup.add(pFire);
    animParts.phoenixFire = pFire;

    const pLight = new THREE.PointLight(0xf59e0b, 5.0, 14);
    pLight.position.set(0, 2.5, -3.5);
    envGroup.add(pLight);
    dynamicLights.push(pLight);

  } else if (id === 'VOL_01') {
    // VOL_01: Valley of Loren - O Baluarte do Castle Siege
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 50), matStoneDark);
    floor.name = 'scenario_base_floor';
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01;
    envGroup.add(floor);

    // Fosso de Lava
    const moat = new THREE.Mesh(new THREE.BoxGeometry(50, 1.2, 8), matMagma);
    moat.position.set(0, -0.6, -4);
    envGroup.add(moat);

    // Ponte Levadiça
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 10), matWood);
    bridge.position.set(0, 0.1, -4);
    envGroup.add(bridge);

    // Muralha Ciclópica
    for (let s of [-16, 16]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(16, 8, 3.5), matStoneDark);
      wall.position.set(s, 4, 8);
      envGroup.add(wall);

      const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 12, 16), matStoneDark);
      tower.position.set(s * 1.5, 6, 8);
      envGroup.add(tower);
    }

    // Portão de Ferro
    const gate = new THREE.Mesh(new THREE.BoxGeometry(8, 8, 1.2), matIron);
    gate.position.set(0, 4, 8);
    envGroup.add(gate);

    // Estátuas da Vida
    for (let sx of [-12, 12]) {
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 1.0, 12), matStoneDark);
      plinth.position.set(sx, 0.5, 18);
      envGroup.add(plinth);

      const angel = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5.5, 6), matNacar);
      angel.position.set(sx, 3.75, 18);
      envGroup.add(angel);

      const lifeLight = new THREE.PointLight(0x38bdf8, 4.0, 12);
      lifeLight.position.set(sx, 4.0, 18);
      envGroup.add(lifeLight);
      dynamicLights.push(lifeLight);
    }

    // Catapultas no campo atacante
    for (let cx of [-14, 14]) {
      const cat = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 5), matWood);
      cat.position.set(cx, 1.5, -18);
      envGroup.add(cat);
    }

    const lavaLight = new THREE.PointLight(0xef4444, 4.5, 18);
    lavaLight.position.set(0, 2.0, -4);
    envGroup.add(lavaLight);
    dynamicLights.push(lavaLight);

  } else if (id === 'EVT_01') {
    // EVT_01: Blood Castle - A Colossal Ponte do Martírio (120m x 18m)
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 70), matStoneDark);
    bridge.name = 'scenario_tile_box_floor';
    bridge.position.set(0, -1, 0);
    envGroup.add(bridge);

    // Parapeitos
    for (let px of [-8.5, 8.5]) {
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 70), matStoneDark);
      parapet.position.set(px, 0.75, 0);
      envGroup.add(parapet);
    }

    // Estátuas dos Arcanjos Lamentantes
    for (let side of [-7, 7]) {
      for (let pz of [-25, -12, 0, 12]) {
        const angel = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4.5, 6), matNacar);
        angel.position.set(side, 2.25, pz);
        envGroup.add(angel);
      }
    }

    // Portão do Arcanjo
    const pylonL = new THREE.Mesh(new THREE.BoxGeometry(2.5, 10, 2.5), matStoneDark);
    pylonL.position.set(-7, 5, 26);
    envGroup.add(pylonL);
    const pylonR = new THREE.Mesh(new THREE.BoxGeometry(2.5, 10, 2.5), matStoneDark);
    pylonR.position.set(7, 5, 26);
    envGroup.add(pylonR);

    const gate = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 0.8), matIron);
    gate.position.set(0, 3.5, 26);
    envGroup.add(gate);

    const gateLight = new THREE.PointLight(0xf43f5e, 5.0, 14);
    gateLight.position.set(0, 5, 26);
    envGroup.add(gateLight);
    dynamicLights.push(gateLight);

    // Altar do Arcanjo Caído no Termo da Passarela
    const altar = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 16), matStoneDark);
    altar.position.set(0, 0.5, 34);
    envGroup.add(altar);

    const sword = new THREE.Mesh(new THREE.ConeGeometry(0.9, 4, 8), matGold);
    sword.position.set(0, 3, 34);
    envGroup.add(sword);

    const swordLight = new THREE.PointLight(0xfbbf24, 4.0, 10);
    swordLight.position.set(0, 4, 34);
    envGroup.add(swordLight);
    dynamicLights.push(swordLight);

  // ==========================================================================
  // 9. VALLEY OF LOREN & CASTLE SIEGE (5 CENÁRIOS)
  // ==========================================================================
  } else if (id === 'VOL_02') {
    // VOL_02: Primeiro Baluarte & Portão Ciclópico de Ferro (25M HP destrutível)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(58, 0.4, 38), matCobble);
    floor.name = 'scenario_tile_box_floor';
    floor.position.y = -0.2;
    envGroup.add(floor);

    // Muralha cortina com ameias
    for (const wx of [-21, 21]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 10, 2.5), matStoneDark);
      wall.position.set(wx, 5, 6);
      envGroup.add(wall);
      for (let m = -6; m <= 6; m += 2.4) {
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.2, 2.5), matStoneDark);
        merlon.position.set(wx + m, 10.6, 6);
        envGroup.add(merlon);
      }
    }

    // Torres de menagem para arqueiros (+12m)
    for (const tx of [-12, 12]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.9, 12, 16), matStoneDark);
      tower.position.set(tx, 6, 6);
      envGroup.add(tower);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(4.3, 3.2, 16), matWood);
      roof.position.set(tx, 13.6, 6);
      envGroup.add(roof);
    }

    // Portão ciclópico de ferro fundido (8 x 10m, 25.000.000 HP)
    const gate = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 1.2), matIron);
    gate.position.set(0, 5, 6);
    envGroup.add(gate);
    for (let bar = -3; bar <= 3; bar += 1.5) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.22, 9.4, 1.4), matGold);
      rib.position.set(bar, 5, 6);
      envGroup.add(rib);
    }
    const gateLight = new THREE.PointLight(0xf59e0b, 4.0, 16);
    gateLight.position.set(0, 7, 9);
    envGroup.add(gateLight);
    dynamicLights.push(gateLight);

    // Trincheiras e paliçadas no campo de assédio
    for (const px of [-24, 24]) {
      for (let pz = -16; pz <= 0; pz += 2.2) {
        const stake = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3.0, 5), matWood);
        stake.position.set(px, 1.5, pz);
        stake.rotation.z = px < 0 ? -0.18 : 0.18;
        envGroup.add(stake);
      }
    }
    animParts.siegeGate = gate;

  } else if (id === 'VOL_03') {
    // VOL_03: Pátio das Estátuas da Vida (4 estátuas com aura de respawn)
    const courtyard = new THREE.Mesh(new THREE.BoxGeometry(68, 0.4, 48), matCobble);
    courtyard.name = 'scenario_tile_box_floor';
    courtyard.position.y = -0.2;
    envGroup.add(courtyard);

    for (const wz of [-18, 18]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(70, 9, 2), matStoneDark);
      wall.position.set(0, 4.5, wz);
      envGroup.add(wall);
    }

    // 4 Estátuas da Vida em alabastro (7m) com plintos de 3.5m
    for (const sx of [-12, 12]) {
      for (const sz of [-8, 8]) {
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 3.5), matStoneDark);
        plinth.position.set(sx, 0.6, sz);
        envGroup.add(plinth);

        const statue = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.5, 7, 10), matNacar);
        statue.position.set(sx, 4.7, sz);
        envGroup.add(statue);

        const halo = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.12, 8, 24), matGold);
        halo.position.set(sx, 8.6, sz);
        halo.rotation.x = Math.PI / 2;
        envGroup.add(halo);

        const lifeAura = new THREE.PointLight(0x38bdf8, 3.6, 13);
        lifeAura.position.set(sx, 5, sz);
        envGroup.add(lifeAura);
        dynamicLights.push(lifeAura);
      }
    }

    // Canhões defensivos de baluarte
    for (const cx of [-26, 26]) {
      const cannon = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.4, 4.2, 10), matIron);
      cannon.position.set(cx, 2.1, 0);
      cannon.rotation.z = Math.PI / 2;
      envGroup.add(cannon);
    }

  } else if (id === 'VOL_04') {
    // VOL_04: Gargalo da Ponte Levadiça sobre Fosso de Lava (1400°C)
    const bridgeDrum = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 24), matWood);
    bridgeDrum.name = 'scenario_tile_box_floor';
    bridgeDrum.position.set(0, 0.05, 0);
    envGroup.add(bridgeDrum);

    // Parapeitos de 1.1m
    for (const px of [-3.6, 3.6]) {
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(1, 1.1, 24), matStoneDark);
      parapet.position.set(px, 0.55, 0);
      envGroup.add(parapet);
    }

    // Abismos de lava borbulhante dos dois lados
    for (const lx of [-14, 14]) {
      const lava = new THREE.Mesh(new THREE.CircleGeometry(9.5, 28), matMagma);
      lava.rotation.x = -Math.PI / 2;
      lava.position.set(lx, -2.2, 0);
      envGroup.add(lava);

      const lavaLight = new THREE.PointLight(0xef4444, 5.5, 22);
      lavaLight.position.set(lx, -0.5, 0);
      envGroup.add(lavaLight);
      dynamicLights.push(lavaLight);
    }
    animParts.lavaPools = [];

    // Caldeiras de óleo quente nas ameias
    for (const cx of [-8, 8]) {
      const cauldron = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.9, 1.4, 12), matIron);
      cauldron.position.set(cx, 10.7, 10);
      envGroup.add(cauldron);
    }

  } else if (id === 'VOL_05') {
    // VOL_05: Salão do Trono Real & Selo da Coroa (canalização de 30s)
    const hallFloor = new THREE.Mesh(new THREE.BoxGeometry(42, 0.4, 42), matNacar);
    hallFloor.name = 'scenario_tile_box_floor';
    hallFloor.position.y = -0.2;
    envGroup.add(hallFloor);

    // 7 degraus do estrado imperial
    for (let d = 0; d < 7; d++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(9 - d * 0.5, 0.6, 6 - d * 0.4), matStoneDark);
      step.position.set(0, 0.3 + d * 0.6, 16 - d * 0.5);
      envGroup.add(step);
    }

    // Trono Real de ouro com Selo da Coroa
    const throne = new THREE.Mesh(new THREE.BoxGeometry(5, 4.2, 4), matGold);
    throne.position.set(0, 6.2, 14);
    envGroup.add(throne);
    const crownSeal = new THREE.Mesh(new THREE.OctahedronGeometry(1.1, 0), new THREE.MeshStandardMaterial({
      color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 3.0, metalness: 0.9, roughness: 0.15,
    }));
    crownSeal.position.set(0, 9.6, 14);
    envGroup.add(crownSeal);
    animParts.crownSeal = crownSeal;

    const throneLight = new THREE.PointLight(0xfbbf24, 5.0, 20);
    throneLight.position.set(0, 8, 14);
    envGroup.add(throneLight);
    dynamicLights.push(throneLight);

    // Pedestais sagrados dos sub-líderes
    for (const px of [-8, 8]) {
      const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.3, 2.2, 10), matNacar);
      pedestal.position.set(px, 1.1, 10);
      envGroup.add(pedestal);
      const pLight = new THREE.PointLight(0x38bdf8, 3.0, 10);
      pLight.position.set(px, 2.6, 10);
      envGroup.add(pLight);
      dynamicLights.push(pLight);
    }

    // 8 colunas de alabastro com capitéis dourados
    const columnPositions = [
      [-14, 6], [14, 6], [-14, -2], [14, -2],
      [-14, -10], [14, -10], [-8, -16], [8, -16],
    ];
    for (const [cx, cz] of columnPositions) {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 10, 12), matNacar);
      column.position.set(cx, 5, cz);
      envGroup.add(column);
      const capital = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.7, 2.9), matGold);
      capital.position.set(cx, 10.3, cz);
      envGroup.add(capital);
    }

  // ==========================================================================
  // 10. EVENT ARENAS & DESAFIOS CLÁSSICOS (4 CENÁRIOS)
  // ==========================================================================
  } else if (id === 'EVT_02') {
    // EVT_02: Devil Square — Praça Circular da Carnificina Pentagramal
    const square = new THREE.Mesh(new THREE.CircleGeometry(24.5, 48), matCobble);
    square.rotation.x = -Math.PI / 2;
    square.position.y = 0.02;
    envGroup.add(square);

    // Pentagrama rúnico incandescente no piso de granito
    const pentagramMat = new THREE.MeshStandardMaterial({
      color: 0x78322c, emissive: 0x6f1e16, emissiveIntensity: 0.65, roughness: 0.8, side: THREE.DoubleSide,
    });
    for (let i = 0; i < 5; i++) {
      const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 2) / 5) * Math.PI * 2 - Math.PI / 2;
      const x1 = Math.cos(a1) * 16;
      const z1 = Math.sin(a1) * 16;
      const x2 = Math.cos(a2) * 16;
      const z2 = Math.sin(a2) * 16;
      const len = Math.hypot(x2 - x1, z2 - z1);
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, len), pentagramMat);
      line.position.set((x1 + x2) / 2, 0.06, (z1 + z2) / 2);
      line.rotation.y = -Math.atan2(x2 - x1, z2 - z1);
      envGroup.add(line);
    }

    // Grade perimetral circular intransponível (r = 24.5m)
    const grate = new THREE.Mesh(new THREE.TorusGeometry(24.5, 0.3, 6, 64), matIron);
    grate.position.y = 3.0;
    grate.rotation.x = Math.PI / 2;
    envGroup.add(grate);
    for (let b = 0; b < 32; b++) {
      const ang = (b / 32) * Math.PI * 2;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 6.0, 6), matIron);
      bar.position.set(Math.cos(ang) * 24.5, 3.0, Math.sin(ang) * 24.5);
      envGroup.add(bar);
    }

    // 4 totens de crânios de 6m expelindo chamas
    for (const [tx, tz] of [[0, 16], [16, 0], [0, -16], [-16, 0]]) {
      const totem = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.0, 6, 8), matStoneDark);
      totem.position.set(tx, 3, tz);
      envGroup.add(totem);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2.4, 8), matMagma);
      flame.position.set(tx, 7.2, tz);
      envGroup.add(flame);
      const fLight = new THREE.PointLight(0xf97316, 3.4, 12);
      fLight.position.set(tx, 6.5, tz);
      envGroup.add(fLight);
      dynamicLights.push(fLight);
    }

    // Pedestal central do Baú de Ouro do Triunfo
    const chestPedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 1.0, 12), matGold);
    chestPedestal.position.set(0, 0.5, 0);
    envGroup.add(chestPedestal);
    animParts.triumphPedestal = chestPedestal;

  } else if (id === 'EVT_03') {
    // EVT_03: Chaos Castle — Coliseu Suspenso das Lajes Desabantes
    // Tablado modular 6x6 de lajes (encolhe de 42x42m -> 28x28m -> 14x14m)
    animParts.chaosTiles = [];
    const tileMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7, metalness: 0.3 });
    for (let row = -2; row <= 3; row++) {
      for (let col = -2; col <= 3; col++) {
        const tile = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.6, 6.6), tileMat);
        tile.position.set(col * 7.0, -0.3, row * 7.0);
        envGroup.add(tile);
        animParts.chaosTiles.push(tile);
      }
    }

    // Abismo perimetral fatal
    const abyss = new THREE.Mesh(new THREE.RingGeometry(20.5, 40, 40), new THREE.MeshBasicMaterial({
      color: 0x0b0416, side: THREE.DoubleSide,
    }));
    abyss.rotation.x = -Math.PI / 2;
    abyss.position.y = -4;
    envGroup.add(abyss);

    const voidLight = new THREE.PointLight(0xa855f7, 4.5, 30);
    voidLight.position.set(0, -2, 0);
    envGroup.add(voidLight);
    dynamicLights.push(voidLight);

    // Barreira etérea do anonimato absoluto
    const barrier = new THREE.Mesh(new THREE.CylinderGeometry(20.5, 20.5, 9, 32, 1, true), new THREE.MeshBasicMaterial({
      color: 0x77517f, transparent: true, opacity: 0.06, side: THREE.DoubleSide,
    }));
    barrier.position.y = 4.5;
    envGroup.add(barrier);

  } else if (id === 'EVT_04') {
    // EVT_04: Coliseu de Duelos — Grande Arena da Glória (octogonal)
    const arenaStone = new THREE.MeshStandardMaterial({ color: 0x5c574f, roughness: 0.92, metalness: 0.03 });
    const octagon = new THREE.Mesh(new THREE.CylinderGeometry(17.5, 17.8, 1.0, 8), arenaStone);
    octagon.position.y = 0.5;
    envGroup.add(octagon);

    // Arquibancadas em degraus ao redor do tablado
    for (let s = 0; s < 4; s++) {
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(18.6 + s * 1.8, 18.2 + s * 1.8, 1.2, 8, 1, true), matStoneDark);
      stand.position.y = 1.1 + s * 1.1;
      envGroup.add(stand);
    }

    // Cúpula de barreira de força translúcida (r = 17.5m)
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(17.5, 17.5, 12, 24, 1, true), new THREE.MeshBasicMaterial({
      color: 0xb69a70, transparent: true, opacity: 0.04, side: THREE.DoubleSide,
    }));
    dome.position.y = 6.5;
    envGroup.add(dome);

    // Placar tridimensional flutuante com acabamento de bronze envelhecido
    const scoreboard = new THREE.Mesh(new THREE.BoxGeometry(7, 2.6, 0.3), new THREE.MeshStandardMaterial({
      color: 0x5c4832, emissive: 0x5a3513, emissiveIntensity: 0.35, transparent: true, opacity: 0.85,
      metalness: 0.35, roughness: 0.75,
    }));
    scoreboard.position.set(0, 9.5, 0);
    envGroup.add(scoreboard);
    animParts.duelScoreboard = scoreboard;

    const boardLight = new THREE.PointLight(0xd99749, 2.0, 16);
    boardLight.position.set(0, 8.4, 0);
    envGroup.add(boardLight);
    dynamicLights.push(boardLight);

    // Plintos octogonais do perímetro
    for (const [px, pz] of [[0, 13], [0, -13], [13, 0], [-13, 0]]) {
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 1.6, 8), matGold);
      plinth.position.set(px, 0.8, pz);
      envGroup.add(plinth);
    }

    // Tochas de duelo nos cantos do tablado
    for (let t = 0; t < 8; t++) {
      const ang = (t / 8) * Math.PI * 2 + Math.PI / 8;
      const torch = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.0, 6), matIron);
      torch.position.set(Math.cos(ang) * 16.2, 2.5, Math.sin(ang) * 16.2);
      envGroup.add(torch);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 6), matMagma);
      flame.position.set(Math.cos(ang) * 16.2, 4.3, Math.sin(ang) * 16.2);
      envGroup.add(flame);
    }
  }

  return true;
}
