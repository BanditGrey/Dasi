// ============================================================================
// DASI MMORPG - UNREAL ENGINE 5 CLIENT
// DasiIcarusLevelScriptActor.h
// Native Level Script Actor for the Aethel Celestial Archipelago (Icarus) Map.
// ============================================================================

#pragma once

#include "CoreMinimal.h"
#include "Engine/LevelScriptActor.h"
#include "DasiLorenciaLevelScriptActor.h"
#include "DasiIcarusLevelScriptActor.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnPlayerInfinitePlunge, AActor*, FallingActor, float, FallVelocity);

/**
 * ADasiIcarusLevelScriptActor
 * Native Level Script Actor managing the Icarus / Aethel Celestial level lifecycle.
 */
UCLASS()
class DASICLIENT_API ADasiIcarusLevelScriptActor : public ALevelScriptActor
{
	GENERATED_BODY()

public:
	ADasiIcarusLevelScriptActor();

protected:
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

public:
	// ========================================================================
	// WORLD GEOMETRY & BOUNDS CONFIGURATION (AETHEL CELESTIAL REALM)
	// ========================================================================
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Icarus|World")
	FVector2D WorldExtentMeters = FVector2D(3000.0f, 3000.0f);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Icarus|World")
	float BaseCloudCeilingMeters = 1000.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Icarus|World")
	float PhoenixNestAltitudeMeters = 1850.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Icarus|Flight")
	float TerminalFallKillPlaneMeters = 900.0f;

	UFUNCTION(BlueprintPure, Category = "Dasi|Icarus|Flight")
	bool ValidateFlightEquipment(bool bHasWings, bool bHasDinorant) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Icarus|Flight")
	bool IsOverVoid(const FVector& WorldLocation) const;
};
