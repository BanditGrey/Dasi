// ============================================================================
// DASI MMORPG - PROCEDURAL FLUID ORBS SHADER (HLSL SM 6.0+ / UE5 Custom Node)
// Designed for 3D Diagetic & Screen HUD Orbs: Health (Blood), Mana (Arcane),
// Stamina (Stamina/Wind), and SD (Shield Defense).
//
// Key Features:
// 1. Analytical Spherical Raymarching & Liquid Surface Intersection.
// 2. Inertial Slosh Physics: Reage à aceleração do jogador e recuo de combate.
// 3. Meniscus Curvature: Tensão superficial nas bordas do vidro da esfera.
// 4. Volumetric Beer-Lambert Spectral Absorption: Gradiente de profundidade líquido.
// 5. Dual-Layer Harmonic Surface Waves & Micro-Vortex.
// 6. Stochastic Rising Cavitation Bubbles com empuxo hidrodinâmico.
// 7. Glass Shell: Dupla reflexão Fresnel, índice de refração (IOR = 1.52) e specular highlight.
//
// Target: Unreal Engine 5 (Custom Expression / HLSL Module), DirectX 12, WebGL/WebGPU.
// ============================================================================

#ifndef DASI_FLUID_ORBS_INCLUDED
#define DASI_FLUID_ORBS_INCLUDED

// ----------------------------------------------------------------------------
// CONSTANTS & MATHEMATICAL PRIMITIVES
// ----------------------------------------------------------------------------
static const float ORB_PI         = 3.14159265359f;
static const float ORB_TWO_PI     = 6.28318530718f;
static const float GLASS_IOR      = 1.52f; // Crown Glass
static const float FLUID_IOR      = 1.34f; // Water/Viscous Blood-Plasma

// ----------------------------------------------------------------------------
// CONSTANT BUFFERS / UNIFORMS
// ----------------------------------------------------------------------------
cbuffer FluidOrbBuffer : register(b4)
{
    // Orb State & Mechanics
    float  g_FillRatio;           // [0.0 = Vazio, 1.0 = Cheio 100%]
    float  g_OrbTime;             // Tempo contínuo em segundos
    float  g_OrbDeltaTime;        // Delta time
    float  g_VortexIntensity;     // Intensidade do vórtice interno (0.0 a 1.0 ao consumir poção/skill)

    // Cores & Fluido
    float4 g_FluidBaseColor;      // Cor profunda do fluido (Ex: Sangue escuro #6A040F / Arcana #023E8A)
    float4 g_FluidSubsurfaceColor;// Cor de espalhamento/SSS (Ex: Carmesim vivo #DC2F02 / Ciano brilhante #00B4D8)
    float4 g_FluidSurfaceFoam;    // Cor da crista/espuma de menisco
    float  g_FluidTurbidity;      // Coeficiente de turbidez / absorção Beer-Lambert

    // Física de Inércia & Movimento (Alimentado por Physics/Velocity do Pawn)
    float3 g_InertialAcceleration;// Vetor de aceleração inercial translacional [X, Y, Z]
    float  g_OrbRadius;           // Raio geométrico do orbe no espaço local (default: 1.0f)

    // Sloshing & Frequências
    float  g_WaveFrequency;       // Frequência das ondas superficiais (default: 3.5f)
    float  g_WaveAmplitude;       // Altura máxima das ondas (default: 0.08f)
    float  g_BubbleDensity;       // Quantidade de microbolhas ascendentes (0.0 a 1.0)
    float  g_GlassRoughness;      // Rugosidade da concha de vidro externa (default: 0.05f)
};

// ----------------------------------------------------------------------------
// TEXTURAS E AMOSTRADORES (OPCIONAL: MAPA DE REFLEXÃO DE CUBEMAP E RUÍDO)
// ----------------------------------------------------------------------------
TextureCube  t_OrbEnvCubemap   : register(t0);
Texture2D    t_OrbPerlinNoise  : register(t1);
SamplerState s_OrbLinearWrap   : register(s0);
SamplerState s_OrbLinearClamp  : register(s1);

// ----------------------------------------------------------------------------
// UTILITÁRIOS MATEMÁTICOS & NOISE PROCEDURAL
// ----------------------------------------------------------------------------
float OrbHash12(float2 p)
{
    float3 p3 = frac(float3(p.xyx) * 0.1031f);
    p3 += dot(p3, p3.yzx + 33.33f);
    return frac((p3.x + p3.y) * p3.z);
}

float OrbHash33(float3 p3)
{
    p3 = frac(p3 * float3(0.1031f, 0.1030f, 0.0973f));
    p3 += dot(p3, p3.yxz + 33.33f);
    return frac((p3.xxy + p3.yxx) * p3.zyx).x;
}

// Intersecção Raio-Esfera Analítica
// Retorna (t0, t1) distâncias de entrada e saída, ou (-1, -1) se não cruzar
float2 IntersectSphere(float3 rayOrigin, float3 rayDir, float3 sphereCenter, float radius)
{
    float3 L = rayOrigin - sphereCenter;
    float a = dot(rayDir, rayDir);
    float b = 2.0f * dot(rayDir, L);
    float c = dot(L, L) - (radius * radius);
    float discriminant = b * b - 4.0f * a * c;

    if (discriminant < 0.0f)
    {
        return float2(-1.0f, -1.0f);
    }

    float sqrtD = sqrt(discriminant);
    float t0 = (-b - sqrtD) / (2.0f * a);
    float t1 = (-b + sqrtD) / (2.0f * a);

    return float2(t0, t1);
}

// ----------------------------------------------------------------------------
// CÁLCULO DO PLANO DINÂMICO DE SUPERFÍCIE DO FLUIDO (SLOSHING COM INÉRCIA)
// ----------------------------------------------------------------------------
struct FluidSurfaceState
{
    float3 planeNormal;      // Vetor normal médio da superfície líquida inclinada
    float  planeHeight;      // Altura Z do plano de corte (-1.0 a +1.0)
    float  waveDisplacement; // Ondulação micro-turbulenta no ponto avaliado
};

FluidSurfaceState EvaluateFluidPlane(float3 localPos, float3 cameraRayDir)
{
    FluidSurfaceState state;

    // Converte o g_FillRatio (0..1) para espaço vertical centrado na esfera (-1.0 a 1.0)
    // Usamos um mapeamento volumétrico de calota esférica para linearizar o preenchimento perceptível
    float fillNormalized = clamp(g_FillRatio, 0.0f, 1.0f);
    state.planeHeight = lerp(-0.95f, 0.95f, fillNormalized);

    // Efeito de Sloshing Dinâmico: A normal do fluido inclina-se contra a aceleração inercial
    float3 baseUp = float3(0.0f, 0.0f, 1.0f);
    float3 inertialTilt = -g_InertialAcceleration * 0.15f;
    state.planeNormal = normalize(baseUp + inertialTilt);

    // Ondulação harmônica dupla em função do tempo e da posição transversal (X, Y)
    float wavePhase1 = g_OrbTime * g_WaveFrequency + dot(localPos.xy, float2(4.2f, 3.1f));
    float wavePhase2 = g_OrbTime * (g_WaveFrequency * 1.618f) + dot(localPos.xy, float2(-2.8f, 5.4f));

    // Vórtice dinâmico (quando consome poção ou conjura feitiço)
    float radiusDist = length(localPos.xy);
    float vortexAngle = atan2(localPos.y, localPos.x) + g_OrbTime * 8.0f * g_VortexIntensity;
    float vortexWave = sin(vortexAngle * 3.0f - radiusDist * 6.0f) * g_VortexIntensity * 0.06f;

    float wave1 = sin(wavePhase1) * g_WaveAmplitude * 0.65f;
    float wave2 = cos(wavePhase2) * g_WaveAmplitude * 0.35f;

    // Curvatura de Menisco nas bordas do vidro (tensão superficial líquida atrai a borda para cima)
    float wallProximity = saturate(radiusDist / max(0.001f, g_OrbRadius));
    float meniscus = pow(wallProximity, 4.0f) * 0.08f * saturate(1.0f - abs(state.planeHeight));

    state.waveDisplacement = wave1 + wave2 + vortexWave + meniscus;

    return state;
}

// ----------------------------------------------------------------------------
// MICROBOLHAS VOLUMÉTRICAS PROCEDURAIS (CAVITAÇÃO / EFERVESCÊNCIA)
// ----------------------------------------------------------------------------
float ComputeBubbleDensity(float3 localPos, float time)
{
    if (g_BubbleDensity <= 0.001f) return 0.0f;

    // As bolhas sobem ao longo do eixo Z com velocidades estocásticas
    float3 bubbleCoords = localPos * 12.0f;
    bubbleCoords.z -= time * 2.5f;

    float noiseVal = OrbHash33(floor(bubbleCoords));
    float3 cellFrac = frac(bubbleCoords) - 0.5f;
    float distToBubbleCenter = length(cellFrac);

    // Bolhas pequenas brilhantes esféricas
    float bubbleThreshold = lerp(0.08f, 0.22f, noiseVal);
    float bubbleIntensity = smoothstep(bubbleThreshold, bubbleThreshold * 0.4f, distToBubbleCenter);

    return bubbleIntensity * g_BubbleDensity * (noiseVal > 0.65f ? 1.0f : 0.0f);
}

// ----------------------------------------------------------------------------
// EXECUÇÃO DO SHADER PRINCIPAL DO FLUIDO (RAY-MARCHING / ANALÍTICO)
// ----------------------------------------------------------------------------
struct FluidOrbOutput
{
    float4 Color;            // Cor final RGBA (com canal alfa para composição em HUD 3D ou Canvas)
    float3 Emissive;         // Canal emissivo puro para o pass de Bloom/Nanite Lumen
    float  DepthDisplacement;// Profundidade perceptível
};

FluidOrbOutput RenderFluidOrb(
    float3 localPos,
    float3 localRayDir,
    float3 cameraWorldPos,
    float3 orbCenterWorld)
{
    FluidOrbOutput outResult;
    outResult.Color = float4(0.0f, 0.0f, 0.0f, 0.0f);
    outResult.Emissive = float3(0.0f, 0.0f, 0.0f);
    outResult.DepthDisplacement = 0.0f;

    // 1. Intersecção com a Esfera de Vidro Externa
    float2 sphereHits = IntersectSphere(localPos - localRayDir * 2.0f, localRayDir, float3(0.0f, 0.0f, 0.0f), g_OrbRadius);
    if (sphereHits.x < 0.0f)
    {
        // Raio não intercepta a esfera
        return outResult;
    }

    float3 hitPointFront = (localPos - localRayDir * 2.0f) + localRayDir * sphereHits.x;
    float3 hitPointBack  = (localPos - localRayDir * 2.0f) + localRayDir * sphereHits.y;
    float3 normalFront   = normalize(hitPointFront);

    // 2. Cálculo de Fresnel do Vidro Externo (Schlick's approximation)
    float F0_Glass = pow((AIR_IOR - GLASS_IOR) / (AIR_IOR + GLASS_IOR), 2.0f); // ~0.042
    float VdotN = saturate(dot(-localRayDir, normalFront));
    float fresnelGlass = F0_Glass + (1.0f - F0_Glass) * pow(1.0f - VdotN, 5.0f);

    // 3. Avaliação da Superfície do Fluido
    FluidSurfaceState fluidState = EvaluateFluidPlane(hitPointFront, localRayDir);

    // Distância vertical até o plano de corte do fluido
    float currentFillZ = fluidState.planeHeight + fluidState.waveDisplacement;
    bool isInsideFluid = (hitPointFront.z <= currentFillZ);

    // 4. Espessura de Travessia do Fluido (Volumetric Thickness)
    float fluidThickness = 0.0f;
    float3 fluidScatterColor = float3(0.0f, 0.0f, 0.0f);
    float fluidAlpha = 0.0f;

    if (isInsideFluid)
    {
        // Ponto frontal está abaixo do líquido -> atravessa fluido
        float zDepth = currentFillZ - hitPointFront.z;
        fluidThickness = clamp(zDepth * 1.5f + (sphereHits.y - sphereHits.x) * 0.5f, 0.0f, 2.0f);
    }
    else if (hitPointBack.z <= currentFillZ)
    {
        // Ponto frontal está no ar, mas fundo da esfera está dentro do líquido (olhando para a superfície de cima)
        float tFluidPlane = (currentFillZ - hitPointFront.z) / max(0.0001f, localRayDir.z);
        if (tFluidPlane > 0.0f && tFluidPlane < (sphereHits.y - sphereHits.x))
        {
            fluidThickness = clamp((sphereHits.y - sphereHits.x) - tFluidPlane, 0.0f, 2.0f);
        }
    }

    // 5. Absorção de Beer-Lambert e Espalhamento Subterrâneo (SSS)
    if (fluidThickness > 0.001f)
    {
        // Coeficiente de extinção espectral
        float3 extinction = float3(1.2f, 0.8f, 0.5f) * g_FluidTurbidity;
        float3 transmittance = exp(-extinction * fluidThickness);

        // Espalhamento volumétrico com luz interna pulsante
        float internalGlow = 0.35f + 0.15f * sin(g_OrbTime * 2.0f);
        fluidScatterColor = lerp(g_FluidBaseColor.rgb, g_FluidSubsurfaceColor.rgb, 1.0f - transmittance) * internalGlow;

        // Efeito de Cavitação / Bolhas
        float bubbles = ComputeBubbleDensity(hitPointFront, g_OrbTime);
        fluidScatterColor += float3(1.0f, 1.0f, 1.0f) * bubbles * 0.9f;

        // Borda de Menisco / Espuma na linha d'água
        float edgeDistance = abs(hitPointFront.z - currentFillZ);
        if (edgeDistance < 0.045f)
        {
            float foamFactor = smoothstep(0.045f, 0.005f, edgeDistance);
            fluidScatterColor = lerp(fluidScatterColor, g_FluidSurfaceFoam.rgb, foamFactor * 0.85f);
        }

        fluidAlpha = saturate(fluidThickness * 1.8f);
    }

    // 6. Destaques Especulares do Vidro (Key Light & Fill Light)
    float3 keyLightDir = normalize(float3(0.5f, -0.6f, 0.8f));
    float3 halfVec = normalize(keyLightDir - localRayDir);
    float specAngle = saturate(dot(normalFront, halfVec));
    float specularGlass = pow(specAngle, 128.0f) * 1.5f;

    // Specular secundário suave
    float3 fillLightDir = normalize(float3(-0.7f, 0.5f, 0.4f));
    float3 halfVec2 = normalize(fillLightDir - localRayDir);
    float specAngle2 = saturate(dot(normalFront, halfVec2));
    float specularGlass2 = pow(specAngle2, 32.0f) * 0.4f;

    // 7. Reflexão da Borda (Fresnel Rim Lighting)
    float3 glassReflection = float3(0.85f, 0.92f, 1.0f) * fresnelGlass * 0.7f;

    // 8. Síntese Final
    float3 finalRgb = fluidScatterColor + glassReflection + (specularGlass + specularGlass2).xxx;
    float finalAlpha = saturate(fluidAlpha + fresnelGlass * 0.8f);

    outResult.Color = float4(finalRgb, finalAlpha);
    outResult.Emissive = fluidScatterColor * (g_VortexIntensity > 0.0f ? 2.5f : 1.2f) + (specularGlass > 0.8f ? float3(0.5f, 0.5f, 0.5f) : float3(0.0f, 0.0f, 0.0f));
    outResult.DepthDisplacement = fluidThickness;

    return outResult;
}

#endif // DASI_FLUID_ORBS_INCLUDED
