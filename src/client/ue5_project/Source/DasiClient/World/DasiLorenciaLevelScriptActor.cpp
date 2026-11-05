// ============================================================================
// DASI MMORPG - UNREAL ENGINE 5 CLIENT
// DasiLorenciaLevelScriptActor.cpp
// Implementation of Lorencia native level management, weather orchestration,
// and authoritative coordinate conversions.
// ============================================================================

#include "DasiLorenciaLevelScriptActor.h"
#include "Engine/World.h"
#include "Engine/DirectionalLight.h"
#include "Components/DirectionalLightComponent.h"
#include "Engine/ExponentialHeightFog.h"
#include "Components/ExponentialHeightFogComponent.h"
#include "Materials/MaterialParameterCollection.h"
#include "Materials/MaterialParameterCollectionInstance.h"
#include "Kismet/KismetMaterialLibrary.h"
#include "Sound/AudioVolume.h"
#include "CollisionQueryParams.h"

ADasiLorenciaLevelScriptActor::ADasiLorenciaLevelScriptActor()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.bStartWithTickEnabled = true;

	// Default Level Blockout Metric Scale (2048m x 2048m map)
	MapHalfExtentCm = 102400.0f;
	DefaultGroundZ = 1800.0f;
	CitadelPlateauZ = 1800.0f;
	SwampBasinZ = 350.0f;
	MoatWaterLevelZ = 1400.0f;
	FountainWaterLevelZ = 1845.0f;

	// Initial atmospheric state: Somber rainy day
	CurrentRainIntensity = 0.65f;
	CurrentWetnessSaturation = 0.85f;
	TargetRainIntensity = 0.65f;
	WeatherTransitionSpeed = 0.20f;
	InteriorLPFCutoffHz = 450.0f;
}

void ADasiLorenciaLevelScriptActor::BeginPlay()
{
	Super::BeginPlay();

	// Load default Material Parameter Collection if not set in Editor
	if (!WeatherParameterCollection)
	{
		WeatherParameterCollection = LoadObject<UMaterialParameterCollection>(
			nullptr,
			TEXT("/Game/Materials/MPC_Lorencia_Weather")
		);
	}

	// Apply initial weather settings to shaders and atmosphere
	ApplyWeatherParametersToWorld(CurrentRainIntensity, CurrentWetnessSaturation);

	UE_LOG(LogTemp, Log, TEXT("[DasiWorld] Lorencia Level Script Initialized: Origin (0,0), HalfExtent=%.1f cm, Rain=%.2f"),
		MapHalfExtentCm, CurrentRainIntensity);
}

void ADasiLorenciaLevelScriptActor::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	// Smoothly interpolate current rain intensity towards target
	if (!FMath::IsNearlyEqual(CurrentRainIntensity, TargetRainIntensity, 0.005f))
	{
		CurrentRainIntensity = FMath::FInterpTo(
			CurrentRainIntensity,
			TargetRainIntensity,
			DeltaTime,
			WeatherTransitionSpeed
		);

		// Wetness follows rain intensity with natural pooling delay
		CurrentWetnessSaturation = FMath::FInterpTo(
			CurrentWetnessSaturation,
			FMath::Clamp(TargetRainIntensity * 1.25f, 0.0f, 1.0f),
			DeltaTime,
			WeatherTransitionSpeed * 0.65f
		);

		ApplyWeatherParametersToWorld(CurrentRainIntensity, CurrentWetnessSaturation);

		OnRainChanged.Broadcast(CurrentRainIntensity);
	}

	// Update continuous global time in MPC for rain ripple phase animation
	if (WeatherParameterCollection && GetWorld())
	{
		UKismetMaterialLibrary::SetScalarParameterValue(
			GetWorld(),
			WeatherParameterCollection,
			FName("GlobalTime"),
			GetWorld()->GetTimeSeconds()
		);
	}
}

// ============================================================================
// COORDINATE CONVERSIONS
// ============================================================================

FVector ADasiLorenciaLevelScriptActor::ConvertServerToWorldCoords(
	const FVector2D& ServerCoords,
	EDasiCoordinateSystem CoordSys,
	bool bTraceGroundZ)
{
	float WorldX = 0.0f;
	float WorldY = 0.0f;

	switch (CoordSys)
	{
	case EDasiCoordinateSystem::DevArena_840x420:
	{
		// Dev Arena: 840 width x 420 height (Center: 420, 210)
		// Canvas Y increases downwards (South), while UE5 +Y is forward (North).
		const float NormX = (ServerCoords.X - 420.0f) / 420.0f;
		const float NormY = (ServerCoords.Y - 210.0f) / 210.0f;

		// Map within 75% of full 2048m map extent (1536m active playfield)
		const float ActiveScale = MapHalfExtentCm * 0.75f;
		WorldX = NormX * ActiveScale;
		WorldY = -NormY * ActiveScale; // Invert Y for correct North/South orientation
		break;
	}

	case EDasiCoordinateSystem::ClassicGrid_256x256:
	{
		// Classic MU 256x256 tile grid (Center: 128, 128)
		const float NormX = (ServerCoords.X - 128.0f) / 128.0f;
		const float NormY = (ServerCoords.Y - 128.0f) / 128.0f;

		const float ActiveScale = MapHalfExtentCm * 0.85f;
		WorldX = NormX * ActiveScale;
		WorldY = NormY * ActiveScale;
		break;
	}

	case EDasiCoordinateSystem::NormalizedCartesian:
	{
		// [-1.0 .. +1.0] range
		WorldX = FMath::Clamp(ServerCoords.X, -1.0f, 1.0f) * MapHalfExtentCm;
		WorldY = FMath::Clamp(ServerCoords.Y, -1.0f, 1.0f) * MapHalfExtentCm;
		break;
	}

	case EDasiCoordinateSystem::DirectWorldCentimeters:
	default:
	{
		WorldX = ServerCoords.X;
		WorldY = ServerCoords.Y;
		break;
	}
	}

	// Determine height Z
	float FinalZ = DefaultGroundZ;
	if (bTraceGroundZ)
	{
		FinalZ = TraceLandscapeGroundZ(WorldX, WorldY);
	}

	return FVector(WorldX, WorldY, FinalZ);
}

FVector2D ADasiLorenciaLevelScriptActor::ConvertWorldToServerCoords(
	const FVector& WorldCoords,
	EDasiCoordinateSystem CoordSys) const
{
	switch (CoordSys)
	{
	case EDasiCoordinateSystem::DevArena_840x420:
	{
		const float ActiveScale = MapHalfExtentCm * 0.75f;
		const float NormX = FMath::Clamp(WorldCoords.X / ActiveScale, -1.0f, 1.0f);
		const float NormY = FMath::Clamp(-WorldCoords.Y / ActiveScale, -1.0f, 1.0f); // Invert Y back

		const float ServerX = (NormX * 420.0f) + 420.0f;
		const float ServerY = (NormY * 210.0f) + 210.0f;
		return FVector2D(ServerX, ServerY);
	}

	case EDasiCoordinateSystem::ClassicGrid_256x256:
	{
		const float ActiveScale = MapHalfExtentCm * 0.85f;
		const float NormX = FMath::Clamp(WorldCoords.X / ActiveScale, -1.0f, 1.0f);
		const float NormY = FMath::Clamp(WorldCoords.Y / ActiveScale, -1.0f, 1.0f);

		const float ServerX = (NormX * 128.0f) + 128.0f;
		const float ServerY = (NormY * 128.0f) + 128.0f;
		return FVector2D(ServerX, ServerY);
	}

	case EDasiCoordinateSystem::NormalizedCartesian:
	{
		return FVector2D(
			FMath::Clamp(WorldCoords.X / MapHalfExtentCm, -1.0f, 1.0f),
			FMath::Clamp(WorldCoords.Y / MapHalfExtentCm, -1.0f, 1.0f)
		);
	}

	case EDasiCoordinateSystem::DirectWorldCentimeters:
	default:
	{
		return FVector2D(WorldCoords.X, WorldCoords.Y);
	}
	}
}

float ADasiLorenciaLevelScriptActor::TraceLandscapeGroundZ(
	float WorldX,
	float WorldY,
	float StartAltitudeZ,
	float EndAltitudeZ) const
{
	UWorld* World = GetWorld();
	if (!World)
	{
		return DefaultGroundZ;
	}

	const FVector TraceStart(WorldX, WorldY, StartAltitudeZ);
	const FVector TraceEnd(WorldX, WorldY, EndAltitudeZ);

	FHitResult HitResult;
	FCollisionQueryParams QueryParams(TEXT("LorenciaGroundZTrace"), true);
	QueryParams.bReturnPhysicalMaterial = false;

	// Trace against static world geometry and landscape heightfield
	bool bHit = World->LineTraceSingleByChannel(
		HitResult,
		TraceStart,
		TraceEnd,
		ECC_Visibility,
		QueryParams
	);

	if (bHit && HitResult.bBlockingHit)
	{
		return HitResult.ImpactPoint.Z;
	}

	// Fallback to geometric plateau heuristic if line trace found no geometry
	const float DistFromPlaza = FVector2D(WorldX, WorldY).Size();
	if (DistFromPlaza < 9500.0f)
	{
		return CitadelPlateauZ; // Inside Loren Castle Citadel
	}

	return SwampBasinZ; // Outer lowlands
}

// ============================================================================
// WEATHER & SHADER CONTROL
// ============================================================================

void ADasiLorenciaLevelScriptActor::SetDynamicRainTarget(float NewIntensity, float NewSaturation)
{
	TargetRainIntensity = FMath::Clamp(NewIntensity, 0.0f, 1.0f);
	if (NewSaturation >= 0.0f)
	{
		CurrentWetnessSaturation = FMath::Clamp(NewSaturation, 0.0f, 1.0f);
	}
}

void ADasiLorenciaLevelScriptActor::ApplyWeatherParametersToWorld(float RainIntensity, float WetnessSaturation)
{
	// 1. Update Material Parameter Collection (MPC_Lorencia_Weather)
	UpdateMaterialParameterCollection(RainIntensity, WetnessSaturation);

	// 2. Modulate Directional Light (Dim sun during heavy downpour)
	if (SunDirectionalLight && SunDirectionalLight->GetComponentByClass<UDirectionalLightComponent>())
	{
		UDirectionalLightComponent* LightComp = SunDirectionalLight->GetComponentByClass<UDirectionalLightComponent>();
		
		// Overcast base is 28,000 lux; drops to 16,000 lux during heavy thunderstorm
		const float ScaledLux = FMath::Lerp(32000.0f, 16000.0f, RainIntensity);
		LightComp->SetIntensity(ScaledLux);

		// Volumetric scattering increases with rain mist
		const float Scattering = FMath::Lerp(1.2f, 2.4f, RainIntensity);
		LightComp->SetVolumetricScatteringIntensity(Scattering);
	}

	// 3. Modulate Exponential Height Fog
	if (HeightFogActor && HeightFogActor->GetComponentByClass<UExponentialHeightFogComponent>())
	{
		UExponentialHeightFogComponent* FogComp = HeightFogActor->GetComponentByClass<UExponentialHeightFogComponent>();

		// Fog density increases from 0.02 (clear mist) to 0.05 (heavy storm)
		const float TargetDensity = FMath::Lerp(0.020f, 0.052f, RainIntensity);
		FogComp->SetFogDensity(TargetDensity);

		// Fog height falloff deepens low-lying mist
		const float HeightFalloff = FMath::Lerp(0.0045f, 0.0028f, RainIntensity);
		FogComp->SetFogHeightFalloff(HeightFalloff);
	}
}

void ADasiLorenciaLevelScriptActor::UpdateMaterialParameterCollection(float Rain, float Wetness)
{
	UWorld* World = GetWorld();
	if (!World || !WeatherParameterCollection)
	{
		return;
	}

	UKismetMaterialLibrary::SetScalarParameterValue(World, WeatherParameterCollection, FName("RainIntensity"), Rain);
	UKismetMaterialLibrary::SetScalarParameterValue(World, WeatherParameterCollection, FName("WetnessSaturation"), Wetness);
	
	// Wind speed scales with storm intensity (10 km/h to 48 km/h)
	const float WindSpeed = FMath::Lerp(10.0f, 48.0f, Rain);
	UKismetMaterialLibrary::SetScalarParameterValue(World, WeatherParameterCollection, FName("WindSpeed"), WindSpeed);

	// Mud deformation depth increases when ground is fully saturated (up to 8 cm)
	const float MudDeformCm = FMath::Lerp(2.0f, 8.5f, Wetness);
	UKismetMaterialLibrary::SetScalarParameterValue(World, WeatherParameterCollection, FName("MaxMudDeformationCm"), MudDeformCm);
}

// ============================================================================
// INTERIOR / EXTERIOR SHELTER NOTIFICATIONS
// ============================================================================

void ADasiLorenciaLevelScriptActor::NotifyPlayerEnteredShelter(AActor* PlayerActor, const FString& ShelterZoneName)
{
	if (!PlayerActor) return;

	UE_LOG(LogTemp, Log, TEXT("[DasiWorld] Player %s entered sheltered interior: %s"),
		*PlayerActor->GetName(), *ShelterZoneName);

	OnInteriorTransition.Broadcast(PlayerActor, true);
}

void ADasiLorenciaLevelScriptActor::NotifyPlayerExitedShelter(AActor* PlayerActor, const FString& ShelterZoneName)
{
	if (!PlayerActor) return;

	UE_LOG(LogTemp, Log, TEXT("[DasiWorld] Player %s exited sheltered interior: %s"),
		*PlayerActor->GetName(), *ShelterZoneName);

	OnInteriorTransition.Broadcast(PlayerActor, false);
}

bool ADasiLorenciaLevelScriptActor::IsInsidePeacefulSafeZone(const FVector& WorldLocation) const
{
	// Citadel Courtyard Safe Zone: Bounding Box (-9500 to +9500 in X and Y, Z > 1500)
	const bool bInsideX = FMath::Abs(WorldLocation.X) <= 9500.0f;
	const bool bInsideY = FMath::Abs(WorldLocation.Y) <= 9500.0f;
	const bool bOnPlateau = WorldLocation.Z >= 1500.0f;

	return bInsideX && bInsideY && bOnPlateau;
}
