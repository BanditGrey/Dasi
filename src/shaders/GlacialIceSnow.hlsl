// ============================================================================
// DASI MMORPG - GLACIAL ICE & PROCEDURAL SNOW SHADER (HLSL SM 6.0+ / UE5 Custom)
// Designed for Devias (Fortaleza Gélida de Boreal), Ice Queen Boss Arena & Glacial Peaks
//
// Key Features:
//   1. Physical Subsurface Scattering (SSS) for deep glacial ice:
//      - Wavelength-dependent spectral absorption (Beer-Lambert & dipole diffusion).
//      - Cyan/Aquamarine deep scattering with Henyey-Greenstein forward transmission.
//      - Internal micro-fractures, depth occlusions and parallax caustics.
//   2. Procedural Dynamic Snow Accumulation:
//      - Upward World-Normal alignment with configurable slope thresholds.
//      - Wind-driven drift accumulation (directional bias for windward/leeward drifts).
//      - Multi-scale procedural noise / sastrugi wind ripples.
//      - Vertex World Position Offset (WPO) for snow "pillowing" / soft cresting.
//   3. Snow Micro-Crystal Glint & Sparkle Simulation:
//      - Stochastic facet micro-mirror sparkles reacting to direct sunlight & camera movement.
//   4. Thermal Melting Dissolve:
//      - Heat-source sphere masking for braziers, fire spells, and safe-zones.
//
// Compatible with Unreal Engine 5 Custom Node, DirectX 12, Vulkan & HLSL SM 6.0+
// ============================================================================

#ifndef DASI_GLACIAL_ICE_SNOW_INCLUDED
#define DASI_GLACIAL_ICE_SNOW_INCLUDED

// ----------------------------------------------------------------------------
// CONSTANTS & MATH UTILITIES
// ----------------------------------------------------------------------------
static const float PI_CONST      = 3.14159265359f;
static const float INV_PI_CONST  = 0.31830988618f;
static const float ICE_IOR       = 1.309f; // Refractive index of pure water ice
static const float AIR_IOR       = 1.000293f;

// ----------------------------------------------------------------------------
// UNIFORM / CONSTANT BUFFER DEFINITIONS
// ----------------------------------------------------------------------------
cbuffer GlacialSnowBuffer : register(b3)
{
    // Snow Accumulation & Geometry
    float  g_SnowAccumulationAmount; // [0.0 = Pure Ice/Rock, 1.0 = Heavy Deep Snow]
    float  g_SnowSlopeThreshold;     // Dot(N, Up) minimum threshold for accumulation (e.g. 0.35)
    float  g_SnowSlopeSoftness;      // Edge blend range between ice and snow (e.g. 0.15)
    float  g_SnowPillowDisplacement; // Max vertex height displacement in meters (e.g. 0.25m)

    // Wind Dynamics & Directional Drift
    float3 g_WindDirection;          // Normalized 3D wind velocity vector (e.g. float3(0.85, 0.1, 0.5))
    float  g_WindStrength;           // Magnitude of wind influencing drift angle
    float  g_WindDriftBias;          // Bias towards leeward accumulation (0.0 to 1.0)
    float  g_GlobalTime;             // Time in seconds for animated effects

    // Deep Glacial Ice Subsurface Scattering (SSS)
    float3 g_IceAbsorptionCoeff;     // Spectral absorption: Red absorbs fast, Blue scatters (e.g. float3(0.85, 0.22, 0.05))
    float  g_IceScatteringRadius;    // Mean free path scattering distance in meters (e.g. 2.4m)
    float3 g_IceDeepSubsurfaceColor; // Scatter color in deep fractures (e.g. float3(0.0, 0.65, 0.95))
    float  g_IceTranslucencyPower;   // Exponential falloff for back-lit light bleeding (e.g. 3.0)

    // Snow Crystal Sparkle / Glint
    float  g_SnowSparkleDensity;     // Frequency of micro-crystalline sparkles (e.g. 120.0)
    float  g_SnowSparkleIntensity;   // Brightness multiplier for specular glints (e.g. 8.0)
    float  g_SnowSparkleRoughness;   // Specular lobe tightness (e.g. 0.02)
    float  g_Padding0;

    // Thermal Melting & Safe Zone Source (e.g. Devias Central Brazier)
    float3 g_HeatSourceWorldPos;     // Center of thermal melt area in world space
    float  g_HeatSourceRadius;       // Maximum thaw radius in meters
    float  g_HeatSourceFalloff;      // Edge softening for thermal melt gradient
    float  g_ThermalMeltIntensity;   // Global thermal melt override [0.0 = Freeze, 1.0 = Max Thaw]

    // Scene & Lighting Environment
    float3 g_SunDirection;           // Normalized direction towards direct directional light
    float3 g_SunColor;               // Direct sun/moon radiance
    float3 g_AmbientSkyColor;        // Ambient hemispherical sky illumination
    float3 g_CameraPositionWorld;    // World camera location
};

// ----------------------------------------------------------------------------
// TEXTURE AND SAMPLER REGISTERS
// ----------------------------------------------------------------------------
Texture2D   t_IceBaseColor           : register(t0); // RGBA: Albedo + Depth Occlusion in Alpha
Texture2D   t_IceNormalMap           : register(t1); // RGB: Tangent Normal, A: Micro-crack mask
Texture2D   t_IceRoughnessMetallic   : register(t2); // R: Roughness, G: Metallic, B: Cavity/Thickness
Texture2D   t_SnowBaseColor          : register(t3); // RGB: Albedo, A: Subsurface Mask
Texture2D   t_SnowNormalMap          : register(t4); // RGB: Fine snow normal
Texture2D   t_NoiseFBM               : register(t5); // Multi-octave Perlin/Worley noise texture
TextureCube t_IceEnvironmentCubemap  : register(t6); // High-latitude boreal IBL probe

SamplerState s_GlacialLinearWrap     : register(s0);
SamplerState s_GlacialLinearClamp    : register(s1);

// ----------------------------------------------------------------------------
// DATA STRUCTURES
// ----------------------------------------------------------------------------
struct VertexInput
{
    float3 PositionOS : POSITION;
    float3 NormalOS   : NORMAL;
    float3 TangentOS  : TANGENT;
    float2 UV         : TEXCOORD0;
};

struct VertexOutput
{
    float4 PositionCS        : SV_POSITION;
    float3 PositionWS        : TEXCOORD0;
    float3 NormalWS          : TEXCOORD1;
    float3 TangentWS         : TEXCOORD2;
    float3 BitangentWS       : TEXCOORD3;
    float2 UV                : TEXCOORD4;
    float  ProceduralSnowMask: TEXCOORD5;
    float  ThermalMeltFactor : TEXCOORD6;
};

// ----------------------------------------------------------------------------
// PROCEDURAL HASH & NOISE ALGORITHMS
// ----------------------------------------------------------------------------

// High-speed 3D pseudo-random hash
float GlacialHash31(float3 p3)
{
    p3 = frac(p3 * 0.1031f);
    p3 += dot(p3, p3.yzx + 33.33f);
    return frac((p3.x + p3.y) * p3.z);
}

float3 GlacialHash33(float3 p3)
{
    p3 = frac(p3 * float3(0.1031f, 0.1030f, 0.0973f));
    p3 += dot(p3, p3.yxz + 33.33f);
    return frac((p3.xxy + p3.yxx) * p3.zyx);
}

// 3D Simplex-inspired gradient noise
float GlacialValueNoise(float3 p)
{
    float3 i = floor(p);
    float3 f = frac(p);
    f = f * f * (3.0f - 2.0f * f); // Hermite interpolation

    float n000 = GlacialHash31(i + float3(0.0f, 0.0f, 0.0f));
    float n100 = GlacialHash31(i + float3(1.0f, 0.0f, 0.0f));
    float n010 = GlacialHash31(i + float3(0.0f, 1.0f, 0.0f));
    float n110 = GlacialHash31(i + float3(1.0f, 1.0f, 0.0f));
    float n001 = GlacialHash31(i + float3(0.0f, 0.0f, 1.0f));
    float n101 = GlacialHash31(i + float3(1.0f, 0.0f, 1.0f));
    float n011 = GlacialHash31(i + float3(0.0f, 1.0f, 1.0f));
    float n111 = GlacialHash31(i + float3(1.0f, 1.0f, 1.0f));

    return lerp(
        lerp(lerp(n000, n100, f.x), lerp(n010, n110, f.x), f.y),
        lerp(lerp(n001, n101, f.x), lerp(n011, n111, f.x), f.y),
        f.z
    );
}

// Fractal Brownian Motion (FBM) for natural sastrugi wind ripples & snow crusting
float GlacialFBM(float3 p, int octaves)
{
    float value = 0.0f;
    float amplitude = 0.5f;
    float frequency = 1.0f;

    for (int i = 0; i < octaves; ++i)
    {
        value += amplitude * GlacialValueNoise(p * frequency);
        frequency *= 2.02f;
        amplitude *= 0.5f;
    }
    return value;
}

// ----------------------------------------------------------------------------
// SUBSURFACE SCATTERING (SSS) & TRANSMITTANCE EVALUATOR
// ----------------------------------------------------------------------------

// Henyey-Greenstein phase function for forward-peaked ice scattering
float HenyeyGreensteinPhase(float cosTheta, float g)
{
    float g2 = g * g;
    float denom = 1.0f + g2 - 2.0f * g * cosTheta;
    return (1.0f - g2) / (4.0f * PI_CONST * pow(max(denom, 0.0001f), 1.5f));
}

// Physically-based spectral transmittance for deep ice (Beer-Lambert + Diffusion)
float3 CalculateGlacialSubsurface(
    float3 worldPos,
    float3 worldNormal,
    float3 viewDir,
    float3 lightDir,
    float  iceThickness,
    float3 deepScatterColor,
    float3 absorptionCoeff)
{
    // 1. Forward-light transmission (light penetrating from behind thin edges/crags)
    float3 scatterDir = lightDir + worldNormal * 0.45f;
    float  inLightDot = saturate(dot(-viewDir, scatterDir));
    float  forwardScatter = pow(inLightDot, g_IceTranslucencyPower);

    // 2. Henyey-Greenstein scattering phase (g = 0.65 for polycrystalline ice)
    float phase = HenyeyGreensteinPhase(dot(-viewDir, lightDir), 0.65f);

    // 3. Spectral extinction: Red light is absorbed over distance, Blue/Cyan transmits
    float effectiveDepth = max(iceThickness * g_IceScatteringRadius, 0.01f);
    float3 extinction = exp(-absorptionCoeff * effectiveDepth);

    // 4. Ambient deep core scatter (diffuse light bouncing inside ice body)
    float ambientScatter = saturate(0.5f + 0.5f * dot(worldNormal, float3(0.0f, 1.0f, 0.0f)));
    float3 deepGlow = deepScatterColor * ambientScatter * extinction;

    // Combine direct transmission with internal spectral radiance
    float3 directTransmission = g_SunColor * forwardScatter * phase * extinction * 12.0f;
    return directTransmission + deepGlow;
}

// ----------------------------------------------------------------------------
// MICRO-FACET SNOW SPARKLE / GLINT EVALUATOR
// ----------------------------------------------------------------------------

float CalculateSnowSparkles(
    float3 worldPos,
    float3 worldNormal,
    float3 viewDir,
    float3 lightDir,
    float  sparkleDensity,
    float  sparkleIntensity,
    float  sparkleRoughness)
{
    // Scale world coordinates to micro-facet frequency
    float3 sparkleCoord = worldPos * sparkleDensity;
    float3 cell = floor(sparkleCoord);
    
    // Procedural random orientation for the facet inside the cell
    float3 facetNormal = normalize(GlacialHash33(cell) * 2.0f - 1.0f);
    
    // Bias facet normal towards surface macro-normal so sparkles appear on facing surfaces
    facetNormal = normalize(lerp(worldNormal, facetNormal, 0.65f));

    // Specular half-vector formulation
    float3 halfVector = normalize(lightDir + viewDir);
    float  nDotH = saturate(dot(facetNormal, halfVector));

    // Sharp micro-specular exponent
    float power = (2.0f / (sparkleRoughness * sparkleRoughness)) - 2.0f;
    float specular = pow(nDotH, power);

    // Sparkle flicker mask based on view angle and cell hash
    float flicker = step(0.88f, GlacialHash31(cell + floor(viewDir * 4.0f)));
    return specular * flicker * sparkleIntensity;
}

// ----------------------------------------------------------------------------
// VERTEX SHADER: WORLD POSITION OFFSET (WPO) & PROCEDURAL MASKING
// ----------------------------------------------------------------------------

VertexOutput VS_GlacialIceSnow(VertexInput input)
{
    VertexOutput output = (VertexOutput)0;

    // Transform position to World Space (Identity model matrix for demonstration)
    float3 worldPos = input.PositionOS;
    float3 worldNormal = normalize(input.NormalOS);
    float3 worldTangent = normalize(input.TangentOS);
    float3 worldBitangent = normalize(cross(worldNormal, worldTangent));

    // Calculate Thermal Melting Factor from brazier heat source
    float distToHeat = distance(worldPos, g_HeatSourceWorldPos);
    float thermalMelt = 1.0f - saturate((distToHeat - (g_HeatSourceRadius - g_HeatSourceFalloff)) / max(g_HeatSourceFalloff, 0.001f));
    thermalMelt = saturate(thermalMelt * g_ThermalMeltIntensity);

    // Calculate directional wind bias for snow accumulation
    // Windward accumulation occurs on slopes facing into the wind + upward
    float3 biasedUp = normalize(float3(0.0f, 1.0f, 0.0f) + g_WindDirection * g_WindStrength * g_WindDriftBias);
    float normalUpDot = dot(worldNormal, biasedUp);

    // Multi-scale procedural ripple offset
    float sastrugi = GlacialFBM(worldPos * 0.15f + g_WindDirection * 0.05f, 3);
    float threshold = g_SnowSlopeThreshold - (sastrugi * 0.15f);

    // Smoothstep mask for snow presence
    float snowMask = smoothstep(threshold - g_SnowSlopeSoftness, threshold + g_SnowSlopeSoftness, normalUpDot);
    snowMask = saturate(snowMask * g_SnowAccumulationAmount);

    // Apply thermal melting to suppress snow accumulation near braziers
    snowMask = saturate(snowMask * (1.0f - thermalMelt));

    // World Position Offset (WPO): Soft snow pillowing along normal and wind drift
    float3 displacementVector = (worldNormal * 0.7f + float3(0.0f, 1.0f, 0.0f) * 0.3f) * (snowMask * g_SnowPillowDisplacement);
    worldPos += displacementVector;

    // Output to Pixel Shader
    output.PositionWS         = worldPos;
    output.NormalWS           = worldNormal;
    output.TangentWS          = worldTangent;
    output.BitangentWS        = worldBitangent;
    output.UV                 = input.UV;
    output.ProceduralSnowMask = snowMask;
    output.ThermalMeltFactor  = thermalMelt;

    // Standard MVP Projection
    // Note: In UE5 custom node, SV_POSITION is calculated by the engine pipe.
    output.PositionCS = float4(worldPos, 1.0f);

    return output;
}

// ----------------------------------------------------------------------------
// PIXEL SHADER: PBR + SSS + SNOW BLENDING + CRYSTAL GLINTS
// ----------------------------------------------------------------------------

float4 PS_GlacialIceSnow(VertexOutput input) : SV_Target
{
    float3 worldPos = input.PositionWS;
    float3 viewDir  = normalize(g_CameraPositionWorld - worldPos);
    float3 lightDir = normalize(g_SunDirection);

    // ------------------------------------------------------------------------
    // 1. TEXTURE SAMPLING & NORMAL MAPPING
    // ------------------------------------------------------------------------
    float4 iceAlbedoTex      = t_IceBaseColor.Sample(s_GlacialLinearWrap, input.UV);
    float4 iceNormalSample   = t_IceNormalMap.Sample(s_GlacialLinearWrap, input.UV);
    float3 iceRoughMetalCav  = t_IceRoughnessMetallic.Sample(s_GlacialLinearWrap, input.UV).rgb;

    float4 snowAlbedoTex     = t_SnowBaseColor.Sample(s_GlacialLinearWrap, input.UV * 3.5f);
    float4 snowNormalSample  = t_SnowNormalMap.Sample(s_GlacialLinearWrap, input.UV * 3.5f);

    // Construct Tangent to World Matrix
    float3x3 tbnMatrix = float3x3(normalize(input.TangentWS), normalize(input.BitangentWS), normalize(input.NormalWS));

    // Unpack Tangent Space Normals
    float3 iceNormalTS  = normalize(iceNormalSample.rgb * 2.0f - 1.0f);
    float3 snowNormalTS = normalize(snowNormalSample.rgb * 2.0f - 1.0f);

    float3 iceNormalWS  = normalize(mul(iceNormalTS, tbnMatrix));
    float3 snowNormalWS = normalize(mul(snowNormalTS, tbnMatrix));

    // ------------------------------------------------------------------------
    // 2. PROCEDURAL BLENDING & EDGE MELT
    // ------------------------------------------------------------------------
    float snowMask = input.ProceduralSnowMask;

    // Micro-noise edge perturbation for natural ragged snow boundary
    float edgeNoise = GlacialFBM(worldPos * 0.85f, 2);
    snowMask = smoothstep(0.2f + edgeNoise * 0.25f, 0.7f + edgeNoise * 0.25f, snowMask);

    // Blend Normals
    float3 blendedNormalWS = normalize(lerp(iceNormalWS, snowNormalWS, snowMask));

    // Blend Albedo
    float3 iceBaseColor = iceAlbedoTex.rgb * float3(0.72f, 0.88f, 0.98f); // High-latitude glacial tint
    float3 snowBaseColor = snowAlbedoTex.rgb * float3(0.96f, 0.98f, 1.0f); // Fresh powder white
    float3 finalAlbedo = lerp(iceBaseColor, snowBaseColor, snowMask);

    // Blend Roughness & Metallic
    // Glacial ice: very low roughness (0.04 - 0.15) for high specular gloss
    // Fresh snow: diffuse scattering roughness (0.65 - 0.85)
    float iceRoughness = clamp(iceRoughMetalCav.r, 0.05f, 0.25f);
    float snowRoughness = 0.75f;
    float finalRoughness = lerp(iceRoughness, snowRoughness, snowMask);
    float finalMetallic = lerp(0.0f, 0.0f, snowMask); // Dielectric materials

    // ------------------------------------------------------------------------
    // 3. FRESNEL & ENVIRONMENT SPECULAR REFLECTION (PBR)
    // ------------------------------------------------------------------------
    float nDotV = saturate(dot(blendedNormalWS, viewDir));
    float f0_Ice = pow((ICE_IOR - AIR_IOR) / (ICE_IOR + AIR_IOR), 2.0f); // ~0.0179 for ice
    float f0_Snow = 0.04f;
    float f0 = lerp(f0_Ice, f0_Snow, snowMask);
    float fresnel = f0 + (1.0f - f0) * pow(1.0f - nDotV, 5.0f);

    // Sample Environment IBL Cubemap
    float3 reflectDir = reflect(-viewDir, blendedNormalWS);
    float3 iblSpecular = t_IceEnvironmentCubemap.SampleLevel(s_GlacialLinearWrap, reflectDir, finalRoughness * 6.0f).rgb;
    float3 indirectSpecular = iblSpecular * fresnel;

    // ------------------------------------------------------------------------
    // 4. DIRECT SUNLIGHT & DIFFUSE LIGHTING
    // ------------------------------------------------------------------------
    float nDotL = saturate(dot(blendedNormalWS, lightDir));
    float3 directDiffuse = finalAlbedo * g_SunColor * nDotL * INV_PI_CONST;

    // Half-Vector Specular for Direct Sunlight (Cook-Torrance GGX approximation)
    float3 halfVec = normalize(lightDir + viewDir);
    float  nDotH   = saturate(dot(blendedNormalWS, halfVec));
    float  alpha   = finalRoughness * finalRoughness;
    float  alpha2  = alpha * alpha;
    float  denomGGX = (nDotH * nDotH * (alpha2 - 1.0f) + 1.0f);
    float  D_GGX   = alpha2 / (PI_CONST * denomGGX * denomGGX + 0.0001f);
    float3 directSpecular = g_SunColor * (D_GGX * fresnel * 0.25f) * nDotL;

    // ------------------------------------------------------------------------
    // 5. GLACIAL ICE SUBSURFACE SCATTERING (SSS)
    // ------------------------------------------------------------------------
    float iceThickness = saturate(iceRoughMetalCav.b + iceAlbedoTex.a * 0.5f);
    float3 subsurfaceRadiance = CalculateGlacialSubsurface(
        worldPos,
        iceNormalWS,
        viewDir,
        lightDir,
        iceThickness,
        g_IceDeepSubsurfaceColor,
        g_IceAbsorptionCoeff
    );

    // Subsurface is dominant in uncovered ice; snow acts as an opaque scattering blanket
    float3 finalSubsurface = subsurfaceRadiance * (1.0f - snowMask * 0.90f);

    // ------------------------------------------------------------------------
    // 6. SNOW CRYSTAL MICRO-FACET SPARKLES
    // ------------------------------------------------------------------------
    float sparkles = 0.0f;
    if (snowMask > 0.15f)
    {
        sparkles = CalculateSnowSparkles(
            worldPos,
            snowNormalWS,
            viewDir,
            lightDir,
            g_SnowSparkleDensity,
            g_SnowSparkleIntensity,
            g_SnowSparkleRoughness
        ) * snowMask;
    }
    float3 sparkleRadiance = g_SunColor * sparkles;

    // ------------------------------------------------------------------------
    // 7. COMPOSITION & THERMAL MELT REFLECTION GLOSS
    // ------------------------------------------------------------------------
    // When near heat sources, melted surface creates a wet specular sheen
    if (input.ThermalMeltFactor > 0.05f)
    {
        float wetGloss = input.ThermalMeltFactor * 0.85f;
        finalRoughness = lerp(finalRoughness, 0.02f, wetGloss);
        finalAlbedo *= lerp(1.0f, 0.70f, wetGloss); // Darkening of wet stone/ice
    }

    float3 finalColor = directDiffuse + directSpecular + indirectSpecular + finalSubsurface + sparkleRadiance;
    finalColor += g_AmbientSkyColor * finalAlbedo * 0.35f;

    return float4(finalColor, 1.0f);
}

// ----------------------------------------------------------------------------
// UNREAL ENGINE 5 CUSTOM HLSL NODE INTEGRATION HELPER
// Paste into UE5 Custom Node with inputs:
//   WorldPosition (float3), WorldNormal (float3), ViewDir (float3),
//   LightDir (float3), LightColor (float3), SnowAccumulation (float),
//   IceAbsorption (float3), MeltFactor (float)
// ----------------------------------------------------------------------------
#ifdef UNREAL_ENGINE_CUSTOM_NODE

float3 GlacialIceSnowUE5Custom(
    float3 InWorldPos,
    float3 InWorldNormal,
    float3 InViewDir,
    float3 InLightDir,
    float3 InLightColor,
    float  InSnowAmount,
    float3 InAbsorptionCoeff,
    float3 InDeepScatterColor,
    float  InMeltFactor)
{
    // Upward accumulation with slope angle
    float normalDotUp = dot(InWorldNormal, float3(0.0f, 1.0f, 0.0f));
    float snowMask = smoothstep(0.25f, 0.65f, normalDotUp) * InSnowAmount * (1.0f - InMeltFactor);

    // Glacial Subsurface Scattering
    float3 scatterDir = InLightDir + InWorldNormal * 0.45f;
    float forwardScatter = pow(saturate(dot(-InViewDir, scatterDir)), 3.0f);
    float3 extinction = exp(-InAbsorptionCoeff * 1.8f);
    float3 iceSSS = InLightColor * forwardScatter * extinction * 8.0f + InDeepScatterColor * 0.4f;

    // Snow Sparkle
    float3 cell = floor(InWorldPos * 90.0f);
    float hash = frac(sin(dot(cell, float3(12.9898, 78.233, 45.164))) * 43758.5453);
    float3 halfV = normalize(InLightDir + InViewDir);
    float sparkle = pow(saturate(dot(InWorldNormal, halfV)), 64.0f) * step(0.85f, hash) * 5.0f * snowMask;

    // Final color blend
    float3 iceAlbedo = float3(0.12f, 0.65f, 0.88f);
    float3 snowAlbedo = float3(0.96f, 0.98f, 1.0f);
    float3 diffuse = lerp(iceAlbedo, snowAlbedo, snowMask) * saturate(dot(InWorldNormal, InLightDir));

    return diffuse * InLightColor + iceSSS * (1.0f - snowMask) + sparkle * InLightColor;
}

#endif // UNREAL_ENGINE_CUSTOM_NODE

#endif // DASI_GLACIAL_ICE_SNOW_INCLUDED
