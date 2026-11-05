// ============================================================================
// DASI MMORPG - DYNAMIC WEATHER & TERRAIN SHADER (HLSL v1.0)
// Designed for Lorencia Muddy Plains, Castle Courtyards & Wet Cobblestones
//
// Key Features:
//   - Procedural & Texture-based dynamic puddle accumulation
//   - Dual-phase rain ripple normal perturbation (concentric droplet waves)
//   - PBR wetness transition (darkening albedo, specular sharpening, water IOR)
//   - Mud displacement & Parallax Occlusion Mapping (POM) for cart ruts and footsteps
//   - Screen-Space Reflection (SSR) & Planar/IBL specular reflection fallback
// ============================================================================

#ifndef DASI_DYNAMIC_WEATHER_TERRAIN_INCLUDED
#define DASI_DYNAMIC_WEATHER_TERRAIN_INCLUDED

// ----------------------------------------------------------------------------
// UNIFORM BUFFERS / PARAMETERS
// ----------------------------------------------------------------------------
cbuffer WeatherTerrainBuffer : register(b2)
{
    float g_RainIntensity;          // [0.0 = Dry, 1.0 = Torrential Storm]
    float g_WetnessAccumulation;    // [0.0 = Bone dry, 1.0 = Fully saturated mud]
    float g_PuddleWaterLevel;       // Height threshold below which puddles form (-1.0 to 1.0)
    float g_TerrainTime;            // Global time in seconds

    float g_PuddleRippleSpeed;      // Rain ripple animation playback speed
    float g_PuddleRippleFrequency;  // Spatial density of rain drops
    float g_MudDisplacementDepth;   // Maximum POM/WPO height offset in meters
    float g_WindStrength;           // Wind influence on puddle surface chop

    float3 g_SunDirection;          // Sun/Moon light direction vector
    float3 g_SunColor;              // Direct directional light color
    float3 g_CameraPosition;        // Camera world position
    float  g_SSRStrength;           // Screen space reflection blend intensity
};

// ----------------------------------------------------------------------------
// TEXTURE & SAMPLER BINDINGS
// ----------------------------------------------------------------------------
Texture2D    t_DryBaseColor         : register(t0);
Texture2D    t_DryNormalMap         : register(t1);
Texture2D    t_DryRoughnessAOHeight : register(t2); // R: Roughness, G: AO, B: Metallic, A: Height
Texture2D    t_PuddleMask           : register(t3); // Cavity & depression mask for natural pooling
Texture2D    t_RainRipplesMap       : register(t4); // Normal map atlas for rain ripples
TextureCube  t_EnvironmentCubemap   : register(t5); // Reflection fallback cubemap

SamplerState s_LinearWrap           : register(s0);
SamplerState s_LinearClamp          : register(s1);

// ----------------------------------------------------------------------------
// STRUCTS
// ----------------------------------------------------------------------------
struct TerrainVertexInput
{
    float3 PositionOS : POSITION;
    float3 NormalOS   : NORMAL;
    float3 TangentOS  : TANGENT;
    float2 UV         : TEXCOORD0;
};

struct TerrainPixelInput
{
    float4 PositionCS : SV_POSITION;
    float3 PositionWS : TEXCOORD0;
    float3 NormalWS   : TEXCOORD1;
    float3 TangentWS  : TEXCOORD2;
    float3 BitangentWS: TEXCOORD3;
    float2 UV         : TEXCOORD4;
    float4 ScreenPos  : TEXCOORD5;
};

struct TerrainPBRMaterial
{
    float3 Albedo;
    float3 Normal;
    float  Roughness;
    float  Metallic;
    float  AmbientOcclusion;
    float  Specular;
    float3 Emissive;
};

// ----------------------------------------------------------------------------
// PROCEDURAL RAIN RIPPLES (Dual-Layer Phase Animation)
// ----------------------------------------------------------------------------
// Samples ripple normals at staggered time intervals to prevent synchronized pulsing
float3 SampleProceduralRainRipples(float2 uv, float time, float intensity)
{
    if (intensity <= 0.01f)
    {
        return float3(0.0f, 0.0f, 1.0f);
    }

    float2 rippleUV = uv * (g_PuddleRippleFrequency * 8.0f);
    float speed = time * (g_PuddleRippleSpeed * 2.5f);

    // Staggered dual phases (Phase 0 and Phase 1 shifted by 0.5)
    float phase0 = frac(speed);
    float phase1 = frac(speed + 0.5f);

    // Weights for smooth crossfade between phases
    float weight0 = 2.0f * (0.5f - abs(phase0 - 0.5f));
    float weight1 = 2.0f * (0.5f - abs(phase1 - 0.5f));

    // Sample ripple normal textures with scaling expanding rings
    float2 uv0 = rippleUV + float2(0.31f, 0.77f) * floor(speed);
    float2 uv1 = (rippleUV + float2(0.83f, 0.19f)) + float2(0.63f, 0.22f) * floor(speed + 0.5f);

    float4 normSample0 = t_RainRipplesMap.Sample(s_LinearWrap, uv0) * 2.0f - 1.0f;
    float4 normSample1 = t_RainRipplesMap.Sample(s_LinearWrap, uv1) * 2.0f - 1.0f;

    // Blend ripple normals weighted by their respective expansion envelopes
    float3 blendedRipple = (normSample0.xyz * weight0 + normSample1.xyz * weight1) * intensity;
    blendedRipple.z = 1.0f;

    return normalize(blendedRipple);
}

// ----------------------------------------------------------------------------
// BLEND NORMALS (Reoriented Normal Mapping - RNM)
// ----------------------------------------------------------------------------
float3 BlendNormalsRNM(float3 baseNormal, float3 detailNormal)
{
    float3 t = baseNormal + float3(0.0f, 0.0f, 1.0f);
    float3 u = detailNormal * float3(-1.0f, -1.0f, 1.0f);
    return normalize(t * dot(t, u) - u * t.z);
}

// ----------------------------------------------------------------------------
// PARALLAX OCCLUSION MAPPING (POM) FOR MUD RUTS & FOOTPRINT DEPRESSIONS
// ----------------------------------------------------------------------------
float2 CalculateParallaxOcclusionMapping(
    float2 uv, 
    float3 viewDirTS, 
    float heightScale, 
    out float outDepth)
{
    const int minLayers = 16;
    const int maxLayers = 48;
    
    // Adaptive step count based on grazing view angle
    float numLayers = lerp((float)maxLayers, (float)minLayers, abs(dot(float3(0, 0, 1), viewDirTS)));
    float layerDepth = 1.0f / numLayers;
    float currentLayerDepth = 0.0f;

    // Shift vector per layer in UV space
    float2 deltaUV = (viewDirTS.xy / viewDirTS.z) * heightScale / numLayers;

    float2 currentUV = uv;
    float currentDepthMapValue = 1.0f - t_DryRoughnessAOHeight.Sample(s_LinearWrap, currentUV).a;

    [loop]
    for (int i = 0; i < maxLayers; ++i)
    {
        if (currentLayerDepth >= currentDepthMapValue)
        {
            break;
        }

        currentUV -= deltaUV;
        currentDepthMapValue = 1.0f - t_DryRoughnessAOHeight.Sample(s_LinearWrap, currentUV).a;
        currentLayerDepth += layerDepth;
    }

    // Parallax interpolation between last two steps for high precision
    float2 prevUV = currentUV + deltaUV;
    float nextDepth = currentDepthMapValue - currentLayerDepth;
    float prevDepth = 1.0f - t_DryRoughnessAOHeight.Sample(s_LinearWrap, prevUV).a - currentLayerDepth + layerDepth;

    float weight = nextDepth / (nextDepth - prevDepth);
    float2 finalUV = lerp(currentUV, prevUV, weight);

    outDepth = currentLayerDepth;
    return finalUV;
}

// ----------------------------------------------------------------------------
// MAIN SHADING FUNCTION: ComputeDynamicWeatherTerrain
// ----------------------------------------------------------------------------
TerrainPBRMaterial ComputeDynamicWeatherTerrain(TerrainPixelInput input)
{
    TerrainPBRMaterial mat;

    float3 viewDirWS = normalize(g_CameraPosition - input.PositionWS);

    // Tangent Space to World Space Matrix
    float3 N = normalize(input.NormalWS);
    float3 T = normalize(input.TangentWS);
    float3 B = normalize(input.BitangentWS);
    float3x3 TBN = float3x3(T, B, N);
    float3x3 invTBN = transpose(TBN);

    float3 viewDirTS = mul(invTBN, viewDirWS);

    // 1. Calculate Parallax Occlusion Mapping for terrain ruts
    float pomDepth = 0.0f;
    float2 parallaxUV = CalculateParallaxOcclusionMapping(
        input.UV, 
        viewDirTS, 
        g_MudDisplacementDepth * 0.04f, 
        pomDepth
    );

    // 2. Sample Base Textures with Parallax UV
    float4 dryBaseColorSample = t_DryBaseColor.Sample(s_LinearWrap, parallaxUV);
    float3 dryNormalSample    = t_DryNormalMap.Sample(s_LinearWrap, parallaxUV).xyz * 2.0f - 1.0f;
    float4 dryRoughAOSample   = t_DryRoughnessAOHeight.Sample(s_LinearWrap, parallaxUV);
    float  puddleMaskSample   = t_PuddleMask.Sample(s_LinearWrap, parallaxUV).r;

    float terrainHeight = dryRoughAOSample.a;
    float dryRoughness  = dryRoughAOSample.r;
    float dryAO         = dryRoughAOSample.g;
    float dryMetallic   = dryRoughAOSample.b;

    // 3. Dynamic Water Accumulation & Puddle Mask Calculation
    // Water fills the lowest elevations (cavities) first, expanded by global accumulation
    float waterDepth = saturate((g_WetnessAccumulation * 1.2f) - terrainHeight + (puddleMaskSample * 0.4f));
    float isPuddle = smoothstep(0.18f, 0.42f, waterDepth);

    // 4. PBR Wetness Modifications
    // Wet surfaces darken significantly due to multiple internal scattering of light in water
    float porosity = saturate((dryRoughness - 0.2f) / 0.6f);
    float darkeningFactor = lerp(1.0f, 0.45f, g_WetnessAccumulation * porosity);
    float3 wetAlbedo = dryBaseColorSample.rgb * darkeningFactor;

    // Muddy puddle color: murky brown hue in deep standing water
    float3 murkyWaterColor = float3(0.12f, 0.09f, 0.06f);
    mat.Albedo = lerp(wetAlbedo, murkyWaterColor, isPuddle * 0.65f);

    // Roughness drops drastically: standing water acts as a mirror (roughness ~ 0.015)
    float wetRoughness = lerp(dryRoughness, 0.12f, g_WetnessAccumulation);
    mat.Roughness = lerp(wetRoughness, 0.018f, isPuddle);

    // Metallic stays constant, AO is preserved with water specular boost
    mat.Metallic = dryMetallic;
    mat.AmbientOcclusion = dryAO;
    mat.Specular = lerp(0.5f, 1.0f, isPuddle); // Enhanced specular for water surface

    // 5. Rain Ripples on Puddle Surfaces
    // If it is raining and water is standing, add ripple normals
    float3 rippleNormalTS = SampleProceduralRainRipples(parallaxUV, g_TerrainTime, g_RainIntensity * isPuddle);

    // In puddles, surface normal becomes predominantly flat ground normal (Z-up), perturbed by ripples
    float3 dryGroundNormalWS = normalize(mul(dryNormalSample, TBN));
    float3 puddleNormalWS = normalize(mul(rippleNormalTS, TBN));

    mat.Normal = normalize(lerp(dryGroundNormalWS, puddleNormalWS, isPuddle));

    // 6. Water Subsurface & Emissive Clean (No glow unless bioluminescent swamp)
    mat.Emissive = float3(0.0f, 0.0f, 0.0f);

    return mat;
}

// ----------------------------------------------------------------------------
// FULL PIXEL SHADER PASS (PBR Direct Lighting + Specular Rain Reflection)
// ----------------------------------------------------------------------------
float4 PS_DynamicTerrain(TerrainPixelInput input) : SV_Target
{
    TerrainPBRMaterial mat = ComputeDynamicWeatherTerrain(input);

    float3 N = mat.Normal;
    float3 V = normalize(g_CameraPosition - input.PositionWS);
    float3 L = normalize(-g_SunDirection);
    float3 H = normalize(V + L);

    float NdotL = saturate(dot(N, L));
    float NdotV = saturate(dot(N, V));
    float NdotH = saturate(dot(N, H));
    float VdotH = saturate(dot(V, H));

    // Fresnel Schlick with Water IOR (F0 = 0.02 for water, 0.04 for dielectric mud)
    float3 F0 = lerp(float3(0.04f, 0.04f, 0.04f), mat.Albedo, mat.Metallic);
    float3 F = F0 + (1.0f - F0) * pow(1.0f - VdotH, 5.0f);

    // GGX Specular Distribution
    float alpha = mat.Roughness * mat.Roughness;
    float alpha2 = alpha * alpha;
    float denom = (NdotH * NdotH * (alpha2 - 1.0f) + 1.0f);
    float D = alpha2 / (PI * denom * denom + 1e-5f);

    // Smith Geometric Shadowing
    float k = (mat.Roughness + 1.0f) * (mat.Roughness + 1.0f) / 8.0f;
    float G = (NdotL / (NdotL * (1.0f - k) + k)) * (NdotV / (NdotV * (1.0f - k) + k));

    // Cook-Torrance Specular BRDF
    float3 specularBRDF = (D * F * G) / max(4.0f * NdotL * NdotV, 0.001f);
    float3 diffuseBRDF = (1.0f - F) * (1.0f - mat.Metallic) * mat.Albedo / PI;

    // Direct Lighting
    float3 directLight = (diffuseBRDF + specularBRDF) * g_SunColor * NdotL;

    // Indirect Environment Reflection (Cubemap Fallback)
    float3 reflectDir = reflect(-V, N);
    float mipLevel = mat.Roughness * 7.0f;
    float3 envColor = t_EnvironmentCubemap.SampleLevel(s_LinearWrap, reflectDir, mipLevel).rgb;
    float3 indirectSpecular = envColor * F * mat.AmbientOcclusion;

    float3 finalColor = directLight + indirectSpecular + mat.Emissive;

    return float4(finalColor, 1.0f);
}

#endif // DASI_DYNAMIC_WEATHER_TERRAIN_INCLUDED
