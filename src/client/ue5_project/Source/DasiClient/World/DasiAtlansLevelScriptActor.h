// ============================================================================
// DASI MMORPG - UNREAL ENGINE 5 CLIENT
// DasiAtlansLevelScriptActor.h
// Native Level Script Actor for the Thalassa Sunken Ruins (Atlans) Map.
// ============================================================================

#pragma once

#include "CoreMinimal.h"
#include "Engine/LevelScriptActor.h"
#include "DasiLorenciaLevelScriptActor.h"
#include "DasiAtlansLevelScriptActor.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSlipstreamEntered, AActor*, SwimmerActor);

/**
 * ADasiAtlansLevelScriptActor
 * Native Level Script Actor managing the Atlans / Thalassa level lifecycle.
 */
UCLASS()
class DASICLIENT_API ADasiAtlansLevelScriptActor : public ALevelScriptActor
{
	GENERATED_BODY()

public:
	ADasiAtlansLevelScriptActor();

protected:
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

public:
	// ========================================================================
	// WORLD GEOMETRY & BOUNDS CONFIGURATION (THALASSA OCEANIC REALM)
	// ========================================================================
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Atlans|World")
	FVector2D WorldExtentMeters = FVector2D(2560.0f, 2560.0f);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Atlans|World")
	float SurfaceLevelMeters = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Atlans|World")
	float DeepestAbyssMeters = -260.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Atlans|Physics")
	float UnderwaterGravityFactor = 0.35f;

	UFUNCTION(BlueprintPure, Category = "Dasi|Atlans|Physics")
	float CalculateHydrostaticPressure(float CurrentAltitudeMeters) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Atlans|SafeZone")
	bool IsInsideNacarBreathingDome(const FVector& WorldLocation) const;
};
