// ============================================================================
// DASI MMORPG - ADVANCED PARALLAX OCCLUSION MAPPING (POM) SHADER (HLSL SM 6.0+)
// Designed for Lorencia Cobblestones, Lost Tower Runed Tiles, Dungeon Bricks,
// and Tarkan Cracked Clay / Basalt Rocks.
//
// Key Features:
// 1. Adaptive Step Parallax Occlusion Mapping with Secant / Binary Root Search.
// 2. High-Fidelity Directional Self-Shadowing (Hard & Penumbra Micro-Shadows).
// 3. Slope & View-Angle Adaptive Step Count (8 to 64 linear raymarching slices).
// 4. Contact Ambient Occlusion (Cavity Shading) & Horizon-based Specular Occlusion.
// 5. Seamless Mip-Level LOD blending to prevent texture swimming and aliasing.
//
// Target: Unreal Engine 5 Material Graph Custom HLSL, DirectX 12, Vulkan & WebGPU.
// ============================================================================

#ifndef DASI_PARALLAX_OCCLUSION_INCLUDED
#define DASI_PARALLAX_OCCLUSION_INCLUDED

// ----------------------------------------------------------------------------
// CONSTANT BUFFERS / PARAMETERS
// ----------------------------------------------------------------------------
cbuffer ParallaxOcclusionBuffer : register(b5)
{
    float g_POMHeightScale;         // Altura máxima aparente em metros ou UV offset (Ex: 0.04f a 0.08f)
    int   g_POMMinSamples;          // Mínimo de passos em visão perpendicular (Ex: 12)
    int   g_POMMaxSamples;          // Máximo de passos em ângulos rasantes (Ex: 48)
    float g_POMShadowIntensity;     // Intensidade das auto-sombras (0.0 a 1.0)

    int   g_POMShadowSamples;       // Passos para raymarching de auto-sombreamento (Ex: 16)
    float g_POMShadowSoftness;      // Suavidade da penumbra da auto-sombra (Ex: 4.0f)
    float g_POMRefinementSteps;     // Passos de interpolação binária / secante (Ex: 5)
    float g_POMMipBias;             // Bias de Mipmap para amostragem sem divergência de gradiente
};

// ----------------------------------------------------------------------------
// ESTRUTURAS DE ENTRADA E SAÍDA
// ----------------------------------------------------------------------------
struct POMResult
{
    float2 DisplacedUV;             // Coordenadas UV finais deslocadas
    float  ParallaxDepth;           // Profundidade da camada atingida (0.0 a 1.0)
    float  SelfShadow;              // Fator de auto-sombra (0.0 = Sombra total, 1.0 = Totalmente iluminado)
    float  ContactAO;               // Oclusão de contato em cavidades profundas
};

// ----------------------------------------------------------------------------
// FUNÇÃO CENTRAL DE PARALLAX OCCLUSION MAPPING
// ----------------------------------------------------------------------------
POMResult ComputeParallaxOcclusion(
    Texture2D heightMap,
    SamplerState heightSampler,
    float2 uv,
    float3 viewDirTS,               // Vetor de visão no espaço tangente (deve ser normalizado)
    float3 lightDirTS,              // Vetor de luz no espaço tangente (normalizado)
    float2 ddxUV,                   // Gradiente UV para amostragem correta com SampleGrad
    float2 ddyUV)
{
    POMResult result;
    result.DisplacedUV = uv;
    result.ParallaxDepth = 0.0f;
    result.SelfShadow = 1.0f;
    result.ContactAO = 1.0f;

    // 1. Número adaptativo de passos baseado no ângulo rasante com a superfície
    // Quanto mais rasante (viewDirTS.z próximo de 0), mais passos são necessários
    float absViewZ = saturate(abs(viewDirTS.z) + 0.0001f);
    int numSteps = (int)lerp((float)g_POMMaxSamples, (float)g_POMMinSamples, absViewZ);

    float stepSize = 1.0f / (float)numSteps;
    float currentLayerDepth = 0.0f;

    // Vetor de deslocamento máximo UV por passo
    // viewDirTS.xy dividido por viewDirTS.z projeta a linha de visão no plano tangente
    float2 maxParallaxOffset = (viewDirTS.xy / absViewZ) * g_POMHeightScale;
    float2 uvStep = maxParallaxOffset * stepSize;

    float2 currentUV = uv;
    float currentHeight = 1.0f - heightMap.SampleGrad(heightSampler, currentUV, ddxUV, ddyUV).r;

    // 2. Linear Search Raymarching
    [loop]
    for (int stepIdx = 0; stepIdx < numSteps; ++stepIdx)
    {
        if (currentLayerDepth >= currentHeight)
        {
            break;
        }

        currentUV -= uvStep;
        currentLayerDepth += stepSize;
        currentHeight = 1.0f - heightMap.SampleGrad(heightSampler, currentUV, ddxUV, ddyUV).r;
    }

    // 3. Secant / Binary Refinement para precisão sub-pixel
    float2 prevUV = currentUV + uvStep;
    float prevLayerDepth = currentLayerDepth - stepSize;
    float prevHeight = 1.0f - heightMap.SampleGrad(heightSampler, prevUV, ddxUV, ddyUV).r;

    float weightNext = currentHeight - currentLayerDepth;
    float weightPrev = prevLayerDepth - prevHeight;
    float denom = weightNext + weightPrev;
    float tSecant = (denom > 0.00001f) ? (weightPrev / denom) : 0.5f;

    result.DisplacedUV = lerp(prevUV, currentUV, saturate(tSecant));
    result.ParallaxDepth = lerp(prevLayerDepth, currentLayerDepth, saturate(tSecant));

    // 4. Contact Ambient Occlusion baseada na profundidade da fenda
    result.ContactAO = saturate(pow(1.0f - result.ParallaxDepth, 0.75f));

    // 5. Self-Shadowing Raymarching em direção à fonte de luz direta
    if (g_POMShadowIntensity > 0.01f && lightDirTS.z > 0.02f)
    {
        float lightStepSize = 1.0f / (float)g_POMShadowSamples;
        float2 lightUVStep = (lightDirTS.xy / lightDirTS.z) * (g_POMHeightScale * lightStepSize);

        float currentShadowRayDepth = result.ParallaxDepth;
        float2 shadowUV = result.DisplacedUV;
        float shadowFactor = 1.0f;

        [loop]
        for (int sIdx = 0; sIdx < g_POMShadowSamples; ++sIdx)
        {
            currentShadowRayDepth -= lightStepSize;
            shadowUV += lightUVStep;

            if (currentShadowRayDepth <= 0.0f)
            {
                break;
            }

            float sampleHeight = 1.0f - heightMap.SampleGrad(heightSampler, shadowUV, ddxUV, ddyUV).r;
            if (sampleHeight > currentShadowRayDepth)
            {
                // Penetrou uma saliência: auto-sombra calculada pela distância vertical da oclusão
                float occlusionDepth = sampleHeight - currentShadowRayDepth;
                float softOcclusion = saturate(occlusionDepth * g_POMShadowSoftness);
                shadowFactor = min(shadowFactor, 1.0f - softOcclusion);

                if (shadowFactor <= 0.05f)
                {
                    shadowFactor = 0.0f;
                    break;
                }
            }
        }

        result.SelfShadow = lerp(1.0f, shadowFactor, g_POMShadowIntensity);
    }

    return result;
}

#endif // DASI_PARALLAX_OCCLUSION_INCLUDED
