// ============================================================================
// DASI MMORPG - OCEANIC WATER & CAUSTIC REFRACTION SHADER (HLSL SM 6.0+)
// Inspired by the legendary Continent of Legend (MU Online - Atlans / Thalassa)
//
// Key Features:
// 1. Procedural Animated Dual-Layer Solar Caustics with Chromatic Dispersion.
// 2. Exponential Spectral Wavelength Absorption (Beer-Lambert Deep Blue Law).
// 3. Volumetric Marine In-Scattering / Underwater Fog with Henyey-Greenstein Phase.
// 4. Sum of Gerstner Ocean Waves with Analytic Normals & Foam Crest Jacobian.
// 5. Physically-Based Fresnel Reflection, Depth Refraction & Subsurface Scattering.
//
// Target: DirectX 12, Vulkan, Unreal Engine 5 Custom HLSL Node & Standalone SM 6.0+
// ============================================================================

#ifndef DASI_CAUSTIC_OCEAN_INCLUDED
#define DASI_CAUSTIC_OCEAN_INCLUDED

// ----------------------------------------------------------------------------
// CONSTANTS & MATHEMATICAL UTILITIES
// ----------------------------------------------------------------------------
static const float PI        = 3.14159265359f;
static const float TWO_PI    = 6.28318530718f;
static const float INV_PI    = 0.31830988618f;
static const float WATER_IOR = 1.33333333333f; // Index of Refraction for clean ocean water
static const float AIR_IOR   = 1.00029300000f; // Index of Refraction for air

// ----------------------------------------------------------------------------
// CONSTANT BUFFERS
// ----------------------------------------------------------------------------
cbuffer OceanWaterUniformBuffer : register(b0)
{
    // Timing & Environment
    float  g_Time;                     // Total simulation elapsed time (seconds)
    float  g_DeltaTime;                // Frame delta time
    float  g_WaterPlaneHeight;         // Base Z/Y elevation of the ocean surface
    float  g_WaveSpeedScale;           // Global wave animation playback speed multiplier

    // Optical & Extinction Parameters (Beer-Lambert Law)
    // Beta coefficients [1/meter] for (Red, Green, Blue) wavelength absorption
    // Clean Oceanic Water: Red decays rapidly, Green moderately, Blue penetrates deepest
    float3 g_WaterAbsorptionCoeff;     // Default: float3(0.220f, 0.045f, 0.012f)
    float  g_WaterTurbidity;           // Turbidity scale (0.0 = crystal clear, 1.0 = murky silt)

    // Scattering & Volumetric Fog
    float3 g_WaterBackscatterColor;    // Base upwelling oceanic color (deep cyan/indigo)
    float  g_VolumetricScattering;     // In-scattering coefficient for underwater God Rays
    float3 g_WaterDeepColor;           // Deep ocean abyss color (#000814)
    float  g_PhaseAnisotropyG;         // Henyey-Greenstein eccentricity 'g' (typical: 0.65 to 0.8)

    // Caustics & Chromatic Dispersion
    float  g_CausticIntensity;         // Overall caustic brightness multiplier
    float  g_CausticScale;             // Spatial frequency of caustic cell pattern
    float  g_CausticSpeed;             // Motion speed of the animated caustic wave fronts
    float  g_CausticDispersionSpread;  // Chromatic RGB separation factor at depth

    // Lighting Vectors
    float3 g_SunDirectionWorld;        // Normalized vector pointing towards the primary sun light
    float  g_SunIntensity;             // Solar flux radiance multiplier
    float3 g_SunColor;                 // Solar light chromatic color
    float  g_FoamThreshold;            // Wave crest steepness threshold to trigger foam

    // Camera & Screen Info
    float3 g_CameraPositionWorld;      // World-space camera eye position
    float  g_UnderwaterPostProcess;    // 1.0 if camera is submerged underwater, 0.0 if above surface
    float4 g_ScreenDimensions;         // x: Width, y: Height, z: 1/Width, w: 1/Height
};

// ----------------------------------------------------------------------------
// GERSTNER WAVE STRUCTURE
// ----------------------------------------------------------------------------
struct GerstnerWave
{
    float2 direction; // Normalized 2D propagation direction vector
    float  amplitude; // Wave crest amplitude (meters)
    float  wavelength;// Crest-to-crest distance (meters)
    float  speed;     // Phase velocity (meters/sec)
    float  steepness; // Sharpness factor Q (0.0 = sinusoidal, 1.0 = sharp Gerstner crest)
};

// ----------------------------------------------------------------------------
// TEXTURE RESOURCES & SAMPLERS
// ----------------------------------------------------------------------------
Texture2D    g_SceneColorTexture      : register(t0); // Pre-water scene opaque color buffer
Texture2D    g_SceneDepthTexture      : register(t1); // Pre-water scene depth buffer
Texture2D    g_NormalMapMicro1        : register(t2); // High-frequency capillary normal map 1
Texture2D    g_NormalMapMicro2        : register(t3); // High-frequency capillary normal map 2
Texture2D    g_OceanFoamTexture       : register(t4); // Whitecap procedural foam texture

SamplerState g_LinearClampSampler     : register(s0);
SamplerState g_LinearWrapSampler      : register(s1);

// ----------------------------------------------------------------------------
// SHADER STRUCTS (VERTEX & PIXEL)
// ----------------------------------------------------------------------------
struct VS_INPUT
{
    float3 PositionLocal : POSITION;
    float3 NormalLocal   : NORMAL;
    float2 TexCoord      : TEXCOORD0;
    float4 TangentLocal  : TANGENT;
};

struct PS_INPUT
{
    float4 PositionClip       : SV_POSITION;
    float3 PositionWorld      : TEXCOORD0;
    float3 NormalWorld        : TEXCOORD1;
    float2 TexCoord           : TEXCOORD2;
    float3 TangentWorld       : TEXCOORD3;
    float3 BitangentWorld     : TEXCOORD4;
    float4 ScreenPosition     : TEXCOORD5;
    float  WaveCrestJacobian  : TEXCOORD6;
};

// ----------------------------------------------------------------------------
// HASH & PROCEDURAL NOISE UTILITIES
// ----------------------------------------------------------------------------
float2 Hash22(float2 p)
{
    float3 p3 = frac(float3(p.xyx) * float3(0.1031f, 0.1030f, 0.0973f));
    p3 += dot(p3, p3.yzx + 33.33f);
    return frac((p3.xx + p3.yz) * p3.zy);
}

// ----------------------------------------------------------------------------
// 1. PROCEDURAL SOLAR CAUSTICS WITH DUAL-LAYER INTERFERENCE
// Simulates focused optical rays through agitated sinusoidal wave interfaces
// ----------------------------------------------------------------------------
float ProceduralCausticCell(float2 uv, float time, float speedFactor)
{
    float2 p = uv;
    float t = time * speedFactor;

    // Fast multi-tap trigonometric refraction approximation
    // Mimics wave crest curvature convergence (Airy ray pattern)
    float2 v1 = sin(p.yx * 1.5f + float2(t * 1.2f, t * 1.7f));
    float2 v2 = cos(p.xy * 2.1f - float2(t * 1.5f, t * 0.9f));
    float2 v3 = sin((p.xy + p.yx) * 3.3f + t * 2.2f);

    float2 displacement = (v1 + v2 + v3) * 0.25f;
    float2 shiftedUV = uv + displacement;

    // Voronoi cell distance metric for sharp luminous ridges
    float2 g = floor(shiftedUV);
    float2 f = frac(shiftedUV);

    float minDist = 1.0f;
    [unroll]
    for (int y = -1; y <= 1; ++y)
    {
        [unroll]
        for (int x = -1; x <= 1; ++x)
        {
            float2 neighbor = float2((float)x, (float)y);
            float2 cellPoint = Hash22(g + neighbor);
            
            // Jitter cell center with wave motion
            cellPoint = 0.5f + 0.45f * sin(time * speedFactor * 2.0f + cellPoint * TWO_PI);
            
            float2 diff = neighbor + cellPoint - f;
            float dist = length(diff);
            minDist = min(minDist, dist);
        }
    }

    // Invert and concentrate into sharp caustic crest lines
    float caustic = 1.0f - saturate(minDist);
    caustic = pow(caustic, 4.0f) * 4.5f;
    return caustic;
}

// Dual-layer caustic interference with chromatic dispersion
float3 EvaluateDynamicCaustics(float3 worldPos, float depthFromSurface)
{
    float2 uv1 = worldPos.xz * g_CausticScale;
    float2 uv2 = worldPos.zx * (g_CausticScale * 1.37f); // Incommensurate ratio to prevent tiling

    float t = g_Time * g_CausticSpeed;

    // Dispersion offset: Red, Green, Blue refract at slightly different angles
    // Due to the dispersion formula dη/dλ < 0
    float dispersion = g_CausticDispersionSpread * saturate(depthFromSurface * 0.05f);

    float3 causticRGB = float3(0.0f, 0.0f, 0.0f);

    // Red Channel (Lowest index of refraction, less deflected)
    float c1_R = ProceduralCausticCell(uv1 + float2(dispersion, 0.0f), t, 1.0f);
    float c2_R = ProceduralCausticCell(uv2 - float2(dispersion, 0.0f), t * 1.15f, 0.85f);
    causticRGB.r = (c1_R * c2_R);

    // Green Channel (Median index)
    float c1_G = ProceduralCausticCell(uv1, t, 1.0f);
    float c2_G = ProceduralCausticCell(uv2, t * 1.15f, 0.85f);
    causticRGB.g = (c1_G * c2_G);

    // Blue Channel (Highest index of refraction, most deflected)
    float c1_B = ProceduralCausticCell(uv1 - float2(dispersion, dispersion * 0.5f), t, 1.0f);
    float c2_B = ProceduralCausticCell(uv2 + float2(dispersion, dispersion * 0.5f), t * 1.15f, 0.85f);
    causticRGB.b = (c1_B * c2_B);

    // Depth decay for caustics: caustics focus best between 1m and 15m, then blur out
    float depthAttenuation = exp(-depthFromSurface * 0.08f) * saturate(depthFromSurface * 1.5f);
    
    return causticRGB * depthAttenuation * g_CausticIntensity;
}

// ----------------------------------------------------------------------------
// 2. BEER-LAMBERT EXPONENTIAL WAVELENGTH ABSORPTION & SCATTERING
// ----------------------------------------------------------------------------
float3 ApplyBeerLambertAbsorption(float3 lightColor, float opticalPathLength)
{
    // Extended absorption accounting for organic marine turbidity
    float3 effectiveCoeff = g_WaterAbsorptionCoeff + (g_WaterTurbidity * float3(0.08f, 0.06f, 0.04f));
    
    // Physical formula: I(d) = I0 * exp(-β * d)
    float3 transmittance = exp(-effectiveCoeff * opticalPathLength);
    return lightColor * transmittance;
}

// Henyey-Greenstein Phase Function for underwater volumetric sunbeams
float HenyeyGreensteinPhase(float cosTheta, float g)
{
    float g2 = g * g;
    float denom = 1.0f + g2 - 2.0f * g * cosTheta;
    denom = max(denom, 0.0001f);
    return (1.0f - g2) / (4.0f * PI * pow(denom, 1.5f));
}

// Volumetric Marine In-scattering (Deep Ocean Fog)
float3 EvaluateVolumetricWaterFog(float3 rayOrigin, float3 rayDir, float rayLength, float3 sunDir)
{
    float cosTheta = dot(rayDir, sunDir);
    float phase = HenyeyGreensteinPhase(cosTheta, g_PhaseAnisotropyG);

    // Integral of in-scattering along ray
    float fogFactor = 1.0f - exp(-g_VolumetricScattering * rayLength);

    // Sun shaft in-scattering contribution
    float3 sunInscatter = g_SunColor * g_SunIntensity * phase * fogFactor;

    // Ambient backscatter from deep abyss (Upwelling diffused light)
    float3 ambientInscatter = g_WaterBackscatterColor * fogFactor;

    return (sunInscatter + ambientInscatter);
}

// ----------------------------------------------------------------------------
// 3. GERSTNER WAVE DISPLACEMENT & NORMAL SYNTHESIS
// ----------------------------------------------------------------------------
void EvaluateGerstnerWaves(
    in  float2 worldXZ,
    in  float time,
    out float3 outDisplacement,
    out float3 outNormal,
    out float3 outTangent,
    out float3 outBitangent,
    out float  outJacobian)
{
    // Define 4 oceanic Gerstner wave harmonic components
    GerstnerWave waves[4];
    
    waves[0].direction  = normalize(float2(0.8f, 0.6f));
    waves[0].amplitude  = 1.10f;
    waves[0].wavelength = 42.0f;
    waves[0].speed      = 2.4f * g_WaveSpeedScale;
    waves[0].steepness  = 0.65f;

    waves[1].direction  = normalize(float2(-0.7f, 0.7f));
    waves[1].amplitude  = 0.55f;
    waves[1].wavelength = 18.0f;
    waves[1].speed      = 3.1f * g_WaveSpeedScale;
    waves[1].steepness  = 0.55f;

    waves[2].direction  = normalize(float2(0.3f, -0.95f));
    waves[2].amplitude  = 0.28f;
    waves[2].wavelength = 9.5f;
    waves[2].speed      = 4.2f * g_WaveSpeedScale;
    waves[2].steepness  = 0.45f;

    waves[3].direction  = normalize(float2(0.95f, -0.31f));
    waves[3].amplitude  = 0.14f;
    waves[3].wavelength = 4.2f;
    waves[3].speed      = 5.5f * g_WaveSpeedScale;
    waves[3].steepness  = 0.35f;

    float3 displacement = float3(0.0f, 0.0f, 0.0f);
    float3 tangent      = float3(1.0f, 0.0f, 0.0f);
    float3 bitangent    = float3(0.0f, 0.0f, 1.0f);
    float3 normal       = float3(0.0f, 1.0f, 0.0f);

    float jacobianSum = 0.0f;

    [unroll]
    for (int i = 0; i < 4; ++i)
    {
        float k = TWO_PI / waves[i].wavelength; // Wavenumber
        float c = sqrt(9.81f / k) * waves[i].speed; // Deep-water dispersion velocity
        float w = k * c; // Angular frequency
        float a = waves[i].amplitude;
        float q = waves[i].steepness / (k * a * 4.0f + 0.0001f); // Safe Q factor

        float2 d = waves[i].direction;
        float phase = k * dot(d, worldXZ) - w * time;
        float cosP = cos(phase);
        float sinP = sin(phase);

        // Horizontal and vertical Gerstner displacement
        displacement.x += d.x * (q * a * cosP);
        displacement.z += d.y * (q * a * cosP);
        displacement.y += a * sinP;

        // Analytic derivatives for tangent, bitangent and normal vectors
        float wa = a * k;
        tangent.x   -= d.x * d.x * (waves[i].steepness * sinP);
        tangent.y   += d.x * (wa * cosP);
        tangent.z   -= d.x * d.y * (waves[i].steepness * sinP);

        bitangent.x -= d.x * d.y * (waves[i].steepness * sinP);
        bitangent.y += d.y * (wa * cosP);
        bitangent.z -= d.y * d.y * (waves[i].steepness * sinP);

        // Jacobian determinant approximation for wave foam detection
        jacobianSum += waves[i].steepness * sinP;
    }

    outDisplacement = displacement;
    outTangent      = normalize(tangent);
    outBitangent    = normalize(bitangent);
    outNormal       = normalize(cross(outBitangent, outTangent));
    outJacobian     = jacobianSum;
}

// ----------------------------------------------------------------------------
// 4. VERTEX SHADER
// ----------------------------------------------------------------------------
PS_INPUT VS_OceanWater(VS_INPUT input)
{
    PS_INPUT output;

    float3 worldPos = input.PositionLocal;

    float3 waveOffset;
    float3 waveNormal, waveTangent, waveBitangent;
    float  waveJacobian;

    EvaluateGerstnerWaves(
        worldPos.xz,
        g_Time,
        waveOffset,
        waveNormal,
        waveTangent,
        waveBitangent,
        waveJacobian
    );

    worldPos += waveOffset;

    output.PositionWorld     = worldPos;
    output.PositionClip      = mul(float4(worldPos, 1.0f), /* ViewProjection */ float4x4(
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,0,0,1
    )); // Placeholder: replaced with engine ViewProj matrix in pipeline
    output.NormalWorld       = waveNormal;
    output.TangentWorld      = waveTangent;
    output.BitangentWorld    = waveBitangent;
    output.TexCoord          = input.TexCoord;
    output.ScreenPosition    = output.PositionClip;
    output.WaveCrestJacobian = waveJacobian;

    return output;
}

// ----------------------------------------------------------------------------
// 5. SCHLICK FRESNEL & REFRACTION COEFFICIENTS
// ----------------------------------------------------------------------------
float FastFresnel(float3 normal, float3 viewDir, float F0)
{
    float cosTheta = saturate(dot(normal, viewDir));
    return F0 + (1.0f - F0) * pow(1.0f - cosTheta, 5.0f);
}

// ----------------------------------------------------------------------------
// 6. PIXEL SHADER (MAIN WATER SURFACE & UNDERWATER RECONSTRUCTION)
// ----------------------------------------------------------------------------
float4 PS_OceanWater(PS_INPUT input) : SV_Target
{
    float3 V = normalize(g_CameraPositionWorld - input.PositionWorld);
    float3 N_Geom = normalize(input.NormalWorld);
    float3 T = normalize(input.TangentWorld);
    float3 B = normalize(input.BitangentWorld);

    // Micro-capillary normal sampling (two scrolling octaves)
    float2 uvMicro1 = input.PositionWorld.xz * 0.12f + float2(g_Time * 0.04f, g_Time * 0.03f);
    float2 uvMicro2 = input.PositionWorld.xz * 0.28f - float2(g_Time * 0.03f, g_Time * 0.05f);

    float3 n1 = g_NormalMapMicro1.Sample(g_LinearWrapSampler, uvMicro1).rgb * 2.0f - 1.0f;
    float3 n2 = g_NormalMapMicro2.Sample(g_LinearWrapSampler, uvMicro2).rgb * 2.0f - 1.0f;
    float3 nMicroTangent = normalize(n1 + n2);

    // Transform micro normal to world space
    float3x3 TBN = float3x3(T, B, N_Geom);
    float3 N = normalize(mul(nMicroTangent, TBN));

    // Calculate Screen UV
    float2 screenUV = (input.ScreenPosition.xy / input.ScreenPosition.w) * 0.5f + 0.5f;
    #if defined(HLSL_FLIP_UV_Y)
    screenUV.y = 1.0f - screenUV.y;
    #endif

    // Scene Depth & Underwater Optical Path Length
    float opaqueSceneDepth = g_SceneDepthTexture.Sample(g_LinearClampSampler, screenUV).r;
    float surfaceLinearDepth = input.ScreenPosition.w;
    float waterDepthDelta = max(0.0f, opaqueSceneDepth - surfaceLinearDepth);

    // Refraction UV distortion based on surface normal tilt
    float2 refractionOffset = N.xz * (0.04f / (1.0f + waterDepthDelta * 0.1f));
    float2 refractedUV = screenUV + refractionOffset;

    // Check depth at refracted UV to prevent sampling pixels in front of the water
    float refractedSceneDepth = g_SceneDepthTexture.Sample(g_LinearClampSampler, refractedUV).r;
    if (refractedSceneDepth < surfaceLinearDepth)
    {
        refractedUV = screenUV; // Cancel refraction if occluded by foreground
    }

    // Sample background scene color
    float3 sceneOpaqueColor = g_SceneColorTexture.Sample(g_LinearClampSampler, refractedUV).rgb;

    // ------------------------------------------------------------------------
    // Calculate Caustics on the Submerged Seabed/Objects
    // ------------------------------------------------------------------------
    float3 submergedWorldPos = input.PositionWorld - V * (waterDepthDelta / max(0.01f, dot(V, float3(0,1,0))));
    float3 seabedCaustics = EvaluateDynamicCaustics(submergedWorldPos, waterDepthDelta);

    // Apply caustics to scene opaque color before absorption
    sceneOpaqueColor += sceneOpaqueColor * seabedCaustics;

    // Apply Beer-Lambert Exponential Absorption along line of sight in water
    float3 waterRefractedLight = ApplyBeerLambertAbsorption(sceneOpaqueColor, waterDepthDelta);

    // Evaluate Volumetric Fog / In-scattering along camera-to-seabed optical path
    float3 volumetricFog = EvaluateVolumetricWaterFog(
        input.PositionWorld,
        -V,
        waterDepthDelta,
        g_SunDirectionWorld
    );
    waterRefractedLight += volumetricFog;

    // ------------------------------------------------------------------------
    // Surface Reflection & Sky / Specular Shading
    // ------------------------------------------------------------------------
    // Fresnel reflectivity (F0 for water = 0.02)
    float F0_Water = 0.0204f;
    float fresnel = FastFresnel(N, V, F0_Water);

    // Direct Sun Specular Highlight (Cook-Torrance GGX approximation)
    float3 L = normalize(g_SunDirectionWorld);
    float3 H = normalize(V + L);
    float NdotL = saturate(dot(N, L));
    float NdotH = saturate(dot(N, H));
    float NdotV = saturate(dot(N, V));

    float roughness = 0.08f;
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    float dDenom = (NdotH * NdotH * (alpha2 - 1.0f) + 1.0f);
    float D_GGX = alpha2 / (PI * dDenom * dDenom);

    float k_direct = ((roughness + 1.0f) * (roughness + 1.0f)) / 8.0f;
    float G_V = NdotV / (NdotV * (1.0f - k_direct) + k_direct);
    float G_L = NdotL / (NdotL * (1.0f - k_direct) + k_direct);
    float G_Smith = G_V * G_L;

    float3 sunSpecular = (D_GGX * G_Smith * fresnel / max(0.001f, 4.0f * NdotV * NdotL)) 
                         * g_SunColor * g_SunIntensity * NdotL;

    // Subsurface Scattering (SSS) on wave crests
    float sssFactor = saturate(dot(-L, N + V * 0.3f)) * saturate(input.PositionWorld.y - g_WaterPlaneHeight + 0.5f);
    float3 sssColor = g_WaterBackscatterColor * sssFactor * 1.8f;

    // Sky Reflection Ambient Color
    float3 skyReflection = lerp(g_WaterBackscatterColor * 0.3f, g_SunColor * 1.2f, pow(saturate(dot(reflect(-V, N), L)), 8.0f));

    // Combine Refraction and Reflection via Fresnel
    float3 finalSurfaceColor = lerp(waterRefractedLight + sssColor, skyReflection, fresnel) + sunSpecular;

    // ------------------------------------------------------------------------
    // Wave Crest Whitecap Foam
    // ------------------------------------------------------------------------
    float foamMask = saturate((input.WaveCrestJacobian - g_FoamThreshold) * 3.5f);
    if (foamMask > 0.01f)
    {
        float2 foamUV = input.PositionWorld.xz * 0.45f + float2(g_Time * 0.02f, g_Time * 0.01f);
        float foamTextureSample = g_OceanFoamTexture.Sample(g_LinearWrapSampler, foamUV).r;
        float foamIntensity = saturate(foamMask * foamTextureSample * 2.0f);

        float3 foamColor = float3(0.95f, 0.98f, 1.0f) * (g_SunColor * 0.8f + 0.2f);
        finalSurfaceColor = lerp(finalSurfaceColor, foamColor, foamIntensity);
    }

    // Alpha blending with shoreline (soft water depth fade)
    float shorelineAlpha = saturate(waterDepthDelta * 2.0f);

    return float4(finalSurfaceColor, shorelineAlpha);
}

// ----------------------------------------------------------------------------
// 7. UNDERWATER POST-PROCESS / SEABED LIGHT FUNCTION ENTRY POINT
// Computes caustics & fog when the camera itself is submerged under Thalassa
// ----------------------------------------------------------------------------
float4 PS_ThalassaUnderwaterPostProcess(float2 screenUV : TEXCOORD0) : SV_Target
{
    float3 sceneColor = g_SceneColorTexture.Sample(g_LinearClampSampler, screenUV).rgb;
    float  sceneLinearDepth = g_SceneDepthTexture.Sample(g_LinearClampSampler, screenUV).r;

    // Reconstruct world position from camera ray and depth
    float3 viewRay = float3((screenUV - 0.5f) * float2(g_ScreenDimensions.x / g_ScreenDimensions.y, 1.0f), 1.0f);
    float3 worldPos = g_CameraPositionWorld + viewRay * sceneLinearDepth;

    float depthUnderSurface = max(0.0f, g_WaterPlaneHeight - worldPos.y);

    // Apply animated chromatic caustics to underwater surfaces
    float3 caustics = EvaluateDynamicCaustics(worldPos, depthUnderSurface);
    sceneColor += sceneColor * caustics;

    // Apply Beer-Lambert extinction through camera distance
    sceneColor = ApplyBeerLambertAbsorption(sceneColor, sceneLinearDepth);

    // Apply Volumetric Fog and Sun Rays
    float3 fog = EvaluateVolumetricWaterFog(
        g_CameraPositionWorld,
        normalize(viewRay),
        sceneLinearDepth,
        g_SunDirectionWorld
    );
    sceneColor += fog;

    return float4(sceneColor, 1.0f);
}

#endif // DASI_CAUSTIC_OCEAN_INCLUDED
