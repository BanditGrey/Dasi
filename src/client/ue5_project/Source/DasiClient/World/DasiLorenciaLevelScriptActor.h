// ============================================================================
// DASI MMORPG - UNREAL ENGINE 5 CLIENT
// DasiLorenciaLevelScriptActor.h
// Native Level Script Actor for the Loren Castle & Grey Plains (Lorencia) Map.
//
// Responsibilities:
//   - 100% 3D Native World Initialization (Nanite meshes, Lumen GI, 3D Water Volumes)
//   - Dynamic Weather & Rain/Puddle Material Parameter Collection orchestration
//   - Authoritative Server <-> UE5 3D World Coordinate Mapping & Ground Z Line Tracing
//   - Interior/Exterior Audio Occlusion (Low-Pass Filter crossfading) & Rain Shelter
//   - Safe Zone PvP Protection and 3D Ground Drop / Spawner Management
// ============================================================================

#pragma once

#include "CoreMinimal.h"
#include "Engine/LevelScriptActor.h"
#include "DasiLorenciaLevelScriptActor.generated.h"

class UMaterialParameterCollection;
class ADirectionalLight;
class AExponentialHeightFog;
class ASkyLight;
class APostProcessVolume;
class AAudioVolume;
class USoundSubmix;
class USoundSubmixEffectFilterPreset;

/**
 * Coordinate space conventions used when synchronizing with authoritative server.
 */
UENUM(BlueprintType)
enum class EDasiCoordinateSystem : uint8
{
	/** Authoritative Dev Arena (840 x 420 units, centered at 420, 210) */
	DevArena_840x420 UMETA(DisplayName = "Dev Arena (840x420)"),

	/** Classic MU Online Grid (256 x 256 tiles, centered at 128, 128) */
	ClassicGrid_256x256 UMETA(DisplayName = "Classic Grid (256x256)"),

	/** Normalized Cartesian Coordinates ([-1.0, +1.0] x [-1.0, +1.0]) */
	NormalizedCartesian UMETA(DisplayName = "Normalized (-1 to +1)"),

	/** Direct Unreal Engine World Units (Centimeters, Centered at 0, 0) */
	DirectWorldCentimeters UMETA(DisplayName = "Direct Centimeters (UU)")
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnLorenciaRainChanged, float, NewRainIntensity);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnPlayerInteriorTransition, AActor*, PlayerActor, bool, bIsSheltered);

/**
 * ADasiLorenciaLevelScriptActor
 * Native Level Script Actor managing the Lorencia level lifecycle.
 */
UCLASS()
class DASICLIENT_API ADasiLorenciaLevelScriptActor : public ALevelScriptActor
{
	GENERATED_BODY()

public:
	ADasiLorenciaLevelScriptActor();

protected:
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

public:
	// ========================================================================
	// WORLD GEOMETRY & BOUNDS CONFIGURATION
	// ========================================================================

	/** Half-extent of the Lorencia map in centimeters (2048m / 2 = 1024m = 102400 cm) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|World|Bounds")
	float MapHalfExtentCm = 102400.0f;

	/** Default ground altitude in centimeters if raycast misses */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|World|Bounds")
	float DefaultGroundZ = 1800.0f;

	/** Citadel courtyard plateau altitude (cm) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|World|Bounds")
	float CitadelPlateauZ = 1800.0f;

	/** Low swamp basin and cemetery altitude (cm) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|World|Bounds")
	float SwampBasinZ = 350.0f;

	/** Castle Moat water plane Z altitude (cm) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|World|Water")
	float MoatWaterLevelZ = 1400.0f;

	/** Archangel Fountain water plane Z altitude (cm) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|World|Water")
	float FountainWaterLevelZ = 1845.0f;

	// ========================================================================
	// WEATHER & SHADER ORCHESTRATION
	// ========================================================================

	/** Global Material Parameter Collection for Lorencia Weather */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Weather")
	TObjectPtr<UMaterialParameterCollection> WeatherParameterCollection;

	/** Primary directional light simulating overcast cloudy sun */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Weather|Lighting")
	TObjectPtr<ADirectionalLight> SunDirectionalLight;

	/** Exponential Height Fog actor for low creeping ground mist */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Weather|Fog")
	TObjectPtr<AExponentialHeightFog> HeightFogActor;

	/** Current rain intensity: 0.0 (Dry) to 1.0 (Torrential Storm) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Weather")
	float CurrentRainIntensity = 0.65f;

	/** Current ground puddle saturation: 0.0 (Dry) to 1.0 (Fully Saturated) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Weather")
	float CurrentWetnessSaturation = 0.85f;

	/** Target rain intensity for smooth interpolation */
	UPROPERTY(VisibleInstanceOnly, BlueprintReadOnly, Category = "Dasi|Weather")
	float TargetRainIntensity = 0.65f;

	/** Rate of weather transition per second */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Weather")
	float WeatherTransitionSpeed = 0.15f;

	/** Event dispatched when rain intensity changes */
	UPROPERTY(BlueprintAssignable, Category = "Dasi|Weather|Events")
	FOnLorenciaRainChanged OnRainChanged;

	// ========================================================================
	// AUDIO & INTERIOR OCCLUSION
	// ========================================================================

	/** Sound Submix responsible for exterior environmental weather & wind */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Audio")
	TObjectPtr<USoundSubmix> WeatherSoundSubmix;

	/** Tavern interior audio volume */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Audio")
	TObjectPtr<AAudioVolume> TavernAudioVolume;

	/** Low-Pass Filter cutoff frequency in Hz when inside the tavern */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Audio")
	float InteriorLPFCutoffHz = 450.0f;

	/** Event dispatched when a character enters or leaves a sheltered interior */
	UPROPERTY(BlueprintAssignable, Category = "Dasi|Interior|Events")
	FOnPlayerInteriorTransition OnInteriorTransition;

	// ========================================================================
	// COORDINATE CONVERSION UTILITIES
	// ========================================================================

	/**
	 * Converts authoritative server coordinates (e.g. from GameServer.ts / MobSpawner.ts)
	 * into 3D Unreal Engine World Space coordinates, with optional vertical terrain raycast.
	 *
	 * @param ServerCoords 2D coordinate from authoritative server packet.
	 * @param CoordSys Coordinate system model of the input vector.
	 * @param bTraceGroundZ If true, executes a vertical line trace to place the point precisely on the landscape surface.
	 * @return 3D World Space position in centimeters.
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Coordinates")
	FVector ConvertServerToWorldCoords(
		const FVector2D& ServerCoords,
		EDasiCoordinateSystem CoordSys = EDasiCoordinateSystem::DevArena_840x420,
		bool bTraceGroundZ = true);

	/**
	 * Converts a 3D Unreal Engine World Space position into authoritative server coordinates.
	 *
	 * @param WorldCoords 3D location in UE5 world space.
	 * @param CoordSys Target server coordinate system model.
	 * @return 2D coordinate matching server representation.
	 */
	UFUNCTION(BlueprintPure, Category = "Dasi|Coordinates")
	FVector2D ConvertWorldToServerCoords(
		const FVector& WorldCoords,
		EDasiCoordinateSystem CoordSys = EDasiCoordinateSystem::DevArena_840x420) const;

	/**
	 * Traces downward from a given X/Y position to find the exact landscape ground elevation.
	 *
	 * @param WorldX World position X in centimeters.
	 * @param WorldY World position Y in centimeters.
	 * @param StartAltitudeZ Starting Z for the raycast (default +15000 cm).
	 * @param EndAltitudeZ Ending Z for the raycast (default -10000 cm).
	 * @return Absolute ground Z elevation. Returns DefaultGroundZ if trace misses.
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Coordinates")
	float TraceLandscapeGroundZ(
		float WorldX,
		float WorldY,
		float StartAltitudeZ = 15000.0f,
		float EndAltitudeZ = -10000.0f) const;

	// ========================================================================
	// CLIMATE & ZONE CONTROL APIS
	// ========================================================================

	/** Smoothly sets the weather rain intensity [0.0 = Dry, 1.0 = Storm] */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Weather")
	void SetDynamicRainTarget(float NewIntensity, float NewSaturation = -1.0f);

	/** Instantaneously updates shader MPC and volumetric components */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Weather")
	void ApplyWeatherParametersToWorld(float RainIntensity, float WetnessSaturation);

	/** Called when a player character enters the Tavern or sheltered area */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Interior")
	void NotifyPlayerEnteredShelter(AActor* PlayerActor, const FString& ShelterZoneName);

	/** Called when a player character leaves the Tavern and returns to open plains */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Interior")
	void NotifyPlayerExitedShelter(AActor* PlayerActor, const FString& ShelterZoneName);

	/** Returns true if given world coordinate is inside the peaceful Courtyard Safe Zone */
	UFUNCTION(BlueprintPure, Category = "Dasi|Zones")
	bool IsInsidePeacefulSafeZone(const FVector& WorldLocation) const;

private:
	/** Helper to push updated scalar/vector values to MPC_Lorencia_Weather */
	void UpdateMaterialParameterCollection(float Rain, float Wetness);

	/** Internal timer for smooth weather lerping */
	float CurrentWeatherBlendTime = 0.0f;
};
