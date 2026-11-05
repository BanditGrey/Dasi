// ============================================================================
// DASI MMORPG - ITEM REFINEMENT GLOW SHADER (HLSL v1.0)
// Inspired by the legendary Continent of Legend (MU Online) visual refinement
//
// Refinement Level Effects:
//   +0  to +6 : Natural PBR material (Steel, gold, leather, cloth)
//   +7  to +8 : Subtle interior rune luminescence & breathing Fresnel falloff
//   +9  to +10: Vibrant outer aura + stochastic procedural surface glints/sparkles
//   +11 to +12: Traveling chromatic sinusoidal energy waves & micro-arcs
//   +13 to +15: Atmospheric heat-haze refraction, volumetric corona glow & trailing bloom
//
// Compatible with Unreal Engine 5 Custom HLSL Node, DX12, Vulkan & HLSL SM 6.0+
// ============================================================================

#ifndef DASI_ITEM_GLOW_INCLUDED
#define DASI_ITEM_GLOW_INCLUDED

// ----------------------------------------------------------------------------
// CONSTANTS & CONFIGURATION
// ----------------------------------------------------------------------------
static const float PI = 3.14159265359f;
static const float TWO_PI = 6.28318530718f;

// ----------------------------------------------------------------------------
// UNIFORM / CONSTANT BUFFER DEFINITIONS
// ----------------------------------------------------------------------------
cbuffer RefinementDataBuffer : register(b1)
{
    int   g_RefinementLevel;        // [0..15] Refinement upgrade tier
    float g_Time;                   // Global game elapsed time (seconds)
    float g_DeltaTime;              // Per-frame delta time
    float g_HeatHazeIntensity;      // Global heat distortion multiplier (0.0 to 1.0)
    
    float4 g_AuraColorPrimary;      // Primary glow color (e.g., Mystic Cyan, Royal Gold, Chaos Purple)
    float4 g_AuraColorSecondary;    // Secondary harmonic color for chromatic wave interference
    float4 g_HeatHazeParams;        // x: frequency, y: speed, z: distortion magnitude, w: unused
    
    float3 g_CameraPositionWorld;   // Camera world space location
    float  g_VolumetricCoronaWidth; // Width scale for volumetric corona falloff (+13 to +15)
};

// ----------------------------------------------------------------------------
// PROCEDURAL NOISE & MATH UTILITIES
// ----------------------------------------------------------------------------

// Fast pseudo-random hash
float Hash13(float3 p3)
{
    p3  = frac(p3 * 0.1031f);
    p3 += dot(p3, p3.yzx + 33.33f);
    return frac((p3.x + p3.y) * p3.z);
}

float3 Hash33(float3 p3)
{
    p3 = frac(p3 * float3(0.1031f, 0.1030f, 0.0973f));
    p3 += dot(p3, p3.yxz + 33.33f);
    return frac((p3.xxy + p3.yxx) * p3.zyx);
}

// 3D Value Noise for smooth atmospheric turbulence
float ValueNoise3D(float3 p)
{
    float3 i = floor(p);
    float3 f = frac(p);
    f = f * f * (3.0f - 2.0f * f); // Hermite cubic interpolation

    float n000 = Hash13(i + float3(0, 0, 0));
    float n100 = Hash13(i + float3(1, 0, 0));
    float n010 = Hash13(i + float3(0, 1, 0));
    float n110 = Hash13(i + float3(1, 1, 0));
    float n001 = Hash13(i + float3(0, 0, 1));
    float n101 = Hash13(i + float3(1, 0, 1));
    float n011 = Hash13(i + float3(0, 1, 1));
    float n111 = Hash13(i + float3(1, 1, 1));

    float x00 = lerp(n000, n100, f.x);
    float x10 = lerp(n010, n110, f.x);
    float x01 = lerp(n001, n101, f.x);
    float x11 = lerp(n011, n111, f.x);

    float y0 = lerp(x00, x10, f.y);
    float y1 = lerp(x01, x11, f.y);

    return lerp(y0, y1, f.z);
}

// Fractional Brownian Motion (fBM) for chaotic heat haze and flame auras
float FBM3D(float3 p, int octaves)
{
    float value = 0.0f;
    float amplitude = 0.5f;
    float frequency = 1.0f;

    for (int o = 0; o < octaves; ++o)
    {
        value += amplitude * ValueNoise3D(p * frequency);
        frequency *= 2.0f;
        amplitude *= 0.5f;
    }
    return value;
}

// ----------------------------------------------------------------------------
// SHADER INPUT/OUTPUT STRUCTS
// ----------------------------------------------------------------------------
struct RefinementSurfaceContext
{
    float3 WorldPosition;
    float3 WorldNormal;
    float3 WorldTangent;
    float3 WorldBitangent;
    float3 ViewDirection;       // Vector pointing towards camera (normalized)
    float2 UV;
    float  RuneMask;            // Mask texture for metallic engravings / gems
    float4 BaseColor;
    float  Roughness;
    float  Metallic;
    float  AmbientOcclusion;
};

struct RefinementOutput
{
    float3 FinalBaseColor;
    float3 FinalEmissive;       // HDR emissive contribution to trigger Unreal Bloom/Lumen
    float  FinalRoughness;
    float  FinalMetallic;
    float2 ScreenDistortionUV;  // UV offset for Heat Haze post-process refraction
    float  AlphaMask;
};

// ----------------------------------------------------------------------------
// LAYER 1: SUBTLE INTERIOR RUNE GLOW (+7 to +8)
// ----------------------------------------------------------------------------
float3 CalculateInteriorRuneGlow(RefinementSurfaceContext ctx, float pulseTime)
{
    // Soft breathing pulsation: 1.5 Hz sine modulation
    float breathingPulse = 0.75f + 0.25f * sin(pulseTime * 2.2f);

    // Subtle edge Fresnel falloff
    float NdotV = saturate(dot(ctx.WorldNormal, ctx.ViewDirection));
    float fresnel = pow(1.0f - NdotV, 3.5f);

    // Focus glow tightly inside rune crevices or engravings
    float runeIntensity = ctx.RuneMask * 3.5f * breathingPulse;
    float rimInterior   = fresnel * 1.8f * breathingPulse;

    // Color graduation: Soft mystical amber gold or ice blue
    float3 glowColor = g_AuraColorPrimary.rgb * (runeIntensity + rimInterior);

    return glowColor;
}

// ----------------------------------------------------------------------------
// LAYER 2: OUTER AURA & PROCEDURAL SPARKLE GLINTS (+9 to +10)
// ----------------------------------------------------------------------------
float3 CalculateSparkleAndOuterAura(RefinementSurfaceContext ctx, float time)
{
    float NdotV = saturate(dot(ctx.WorldNormal, ctx.ViewDirection));
    
    // Intense outer rim aura (inverted Fresnel power)
    float outerAura = pow(1.0f - NdotV, 2.0f) * 4.0f;

    // Stochastic Glint / Sparkle Generator:
    // Uses high-frequency 3D coordinates combined with view angle to simulate micro-faceted crystal reflections
    float3 sparkleCoord = ctx.WorldPosition * 45.0f;
    float3 randDir = Hash33(floor(sparkleCoord));
    
    // Check alignment between half-vector and randomized facet normal
    float3 lightDir = normalize(float3(0.577f, 0.577f, 0.577f));
    float3 halfVec = normalize(ctx.ViewDirection + lightDir);
    float facetAlignment = saturate(dot(randDir, halfVec));
    
    // Flash intensity over time (stochastic blinking)
    float blink = sin(time * 8.0f + Hash13(floor(sparkleCoord)) * TWO_PI);
    float glintIntensity = pow(facetAlignment, 32.0f) * step(0.6f, blink) * 12.0f;

    float3 auraTint = lerp(g_AuraColorPrimary.rgb, g_AuraColorSecondary.rgb, 0.35f);
    float3 totalEmission = (outerAura * auraTint) + (glintIntensity * float3(1.0f, 1.0f, 1.0f));

    return totalEmission;
}

// ----------------------------------------------------------------------------
// LAYER 3: CHROMATIC SINUSOIDAL WAVES (+11 to +12)
// ----------------------------------------------------------------------------
float3 CalculateChromaticWaves(RefinementSurfaceContext ctx, float time)
{
    // Wave travels vertically in world coordinates
    float waveSpeed = 3.5f;
    float waveFrequency = 5.0f;
    float phaseBase = ctx.WorldPosition.y * waveFrequency - time * waveSpeed;

    // Chromatic dispersion (RGB phase separation to create prismatic rainbow aura)
    float waveR = sin(phaseBase);
    float waveG = sin(phaseBase + 0.35f);
    float waveB = sin(phaseBase + 0.70f);

    // Sharpen peaks into intense energy ridges
    float3 chromaticWave = float3(
        pow(max(0.0f, waveR), 4.0f),
        pow(max(0.0f, waveG), 4.0f),
        pow(max(0.0f, waveB), 4.0f)
    );

    // Fast electrical micro-arcs noise traveling through the surface
    float arcNoise = FBM3D(ctx.WorldPosition * 12.0f + float3(0, time * 6.0f, 0), 2);
    float electricDischarge = step(0.72f, arcNoise) * 6.0f;

    float3 combinedWave = (chromaticWave * 8.0f) * g_AuraColorPrimary.rgb;
    combinedWave += electricDischarge * g_AuraColorSecondary.rgb;

    return combinedWave;
}

// ----------------------------------------------------------------------------
// LAYER 4: HEAT-HAZE REFRACTION & VOLUMETRIC CORONA (+13 to +15)
// ----------------------------------------------------------------------------
void CalculateHeatHazeAndCorona(
    RefinementSurfaceContext ctx, 
    float time, 
    out float3 outCoronaEmission, 
    out float2 outScreenDistortion)
{
    // 1. Turbulent Heat Haze Screen-Space UV Offset:
    // Simulates turbulent rising hot air around the armor mesh (+13 to +15)
    float3 hazePos = ctx.WorldPosition * 2.5f + float3(0.0f, -time * 3.0f, 0.0f);
    float noiseX = FBM3D(hazePos, 3) - 0.5f;
    float noiseY = FBM3D(hazePos + float3(12.3f, 4.5f, 8.1f), 3) - 0.5f;

    // Distortion strengthens based on tier (+13 -> 1.0x, +14 -> 1.5x, +15 -> 2.2x)
    float tierScale = 1.0f + (g_RefinementLevel - 13) * 0.6f;
    float distortionMagnitude = 0.025f * g_HeatHazeIntensity * tierScale;

    // Modulate distortion by Fresnel so it affects silhouette boundaries most severely
    float NdotV = saturate(dot(ctx.WorldNormal, ctx.ViewDirection));
    float silhouetteEdge = pow(1.0f - NdotV, 1.5f);

    outScreenDistortion = float2(noiseX, noiseY) * distortionMagnitude * silhouetteEdge;

    // 2. Volumetric Corona / Radiance Flare:
    // Blinding heavenly / infernal corona that blooms into the surrounding camera frustum
    float coronaFalloff = pow(1.0f - NdotV, 1.2f);
    
    // Multi-harmonic flare pulsation
    float flarePulse = 1.0f 
        + 0.15f * sin(time * 5.0f) 
        + 0.10f * sin(time * 11.3f)
        + 0.05f * cos(time * 23.7f);

    // Blinding HDR values (> 25.0 to saturate the Unreal Engine ACES tonemapper & generate god rays)
    float baseLuminosity = (g_RefinementLevel == 15) ? 35.0f : ((g_RefinementLevel == 14) ? 22.0f : 15.0f);
    float3 coronaColor = lerp(g_AuraColorPrimary.rgb, float3(1.0f, 0.98f, 0.92f), 0.45f);

    outCoronaEmission = coronaColor * coronaFalloff * baseLuminosity * flarePulse;
}

// ----------------------------------------------------------------------------
// MAIN SHADING FUNCTION: EvaluateItemRefinementGlow
// ----------------------------------------------------------------------------
RefinementOutput EvaluateItemRefinementGlow(RefinementSurfaceContext ctx)
{
    RefinementOutput output;
    output.FinalBaseColor = ctx.BaseColor.rgb;
    output.FinalRoughness = ctx.Roughness;
    output.FinalMetallic  = ctx.Metallic;
    output.FinalEmissive  = float3(0.0f, 0.0f, 0.0f);
    output.ScreenDistortionUV = float2(0.0f, 0.0f);
    output.AlphaMask      = ctx.BaseColor.a;

    // LEVEL 0 to +6: Pure PBR material, no supernatural aura
    if (g_RefinementLevel <= 6)
    {
        return output;
    }

    // LEVEL +7 and +8: Subtle Interior Rune Luminescence
    if (g_RefinementLevel >= 7)
    {
        float3 runeGlow = CalculateInteriorRuneGlow(ctx, g_Time);
        output.FinalEmissive += runeGlow;
    }

    // LEVEL +9 and +10: Outer Aura + Stochastic Glints
    if (g_RefinementLevel >= 9)
    {
        float3 auraSparkle = CalculateSparkleAndOuterAura(ctx, g_Time);
        output.FinalEmissive += auraSparkle;

        // Enhance surface reflectivity for refined equipment
        output.FinalRoughness = min(output.FinalRoughness, 0.18f);
    }

    // LEVEL +11 and +12: Traveling Chromatic Sinusoidal Energy Waves
    if (g_RefinementLevel >= 11)
    {
        float3 chromaticWaves = CalculateChromaticWaves(ctx, g_Time);
        output.FinalEmissive += chromaticWaves;

        // Subtle color tint shift on base material under extreme energy
        output.FinalBaseColor = lerp(output.FinalBaseColor, g_AuraColorPrimary.rgb * 0.5f, 0.15f);
    }

    // LEVEL +13 to +15: Atmospheric Heat Haze & God-Ray Corona
    if (g_RefinementLevel >= 13)
    {
        float3 coronaEmission;
        float2 screenDistortion;
        CalculateHeatHazeAndCorona(ctx, g_Time, coronaEmission, screenDistortion);

        output.FinalEmissive += coronaEmission;
        output.ScreenDistortionUV = screenDistortion;

        // Ultra high polish under extreme refinement
        output.FinalRoughness = 0.04f;
        output.FinalMetallic  = max(output.FinalMetallic, 0.85f);
    }

    return output;
}

// ----------------------------------------------------------------------------
// UNREAL ENGINE 5 CUSTOM NODE ENTRY POINT (HLSL snippet)
//
// Inputs in Custom Node:
//   - InBaseColor (Vector3)
//   - InRoughness (Scalar)
//   - InMetallic (Scalar)
//   - InRuneMask (Scalar)
//   - WorldPos (Vector3)
//   - WorldNorm (Vector3)
//   - CameraPos (Vector3)
//   - RefineLevel (Scalar int)
//   - GlobalTime (Scalar)
//   - AuraColor1 (Vector3)
//   - AuraColor2 (Vector3)
//
// Outputs:
//   - OutEmissive (Vector3)
//   - OutDistortionUV (Vector2)
//   - OutRoughness (Scalar)
// ----------------------------------------------------------------------------
/*
RefinementSurfaceContext ctx;
ctx.WorldPosition = WorldPos;
ctx.WorldNormal = normalize(WorldNorm);
ctx.ViewDirection = normalize(CameraPos - WorldPos);
ctx.UV = float2(0, 0);
ctx.RuneMask = InRuneMask;
ctx.BaseColor = float4(InBaseColor, 1.0f);
ctx.Roughness = InRoughness;
ctx.Metallic = InMetallic;
ctx.AmbientOcclusion = 1.0f;

g_RefinementLevel = (int)RefineLevel;
g_Time = GlobalTime;
g_HeatHazeIntensity = 1.0f;
g_AuraColorPrimary = float4(AuraColor1, 1.0f);
g_AuraColorSecondary = float4(AuraColor2, 1.0f);
g_CameraPositionWorld = CameraPos;

RefinementOutput result = EvaluateItemRefinementGlow(ctx);
OutEmissive = result.FinalEmissive;
OutDistortionUV = result.ScreenDistortionUV;
OutRoughness = result.FinalRoughness;
return OutEmissive;
*/

#endif // DASI_ITEM_GLOW_INCLUDED
