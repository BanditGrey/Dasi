// ============================================================================
// DASI MMORPG - UNREAL ENGINE 5 CLIENT
// DasiDeviasLevelScriptActor.h
// Native Level Script Actor for the Boreal Ice Fortress (Devias) Map.
// ============================================================================

#pragma once

#include "CoreMinimal.h"
#include "Engine/LevelScriptActor.h"
#include "DasiLorenciaLevelScriptActor.h"
#include "DasiDeviasLevelScriptActor.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnBlizzardIntensityChanged, float, NewBlizzardIntensity);

/**
 * ADasiDeviasLevelScriptActor
 * Native Level Script Actor managing the Devias / Boreal Fortress level lifecycle.
 */
UCLASS()
class DASICLIENT_API ADasiDeviasLevelScriptActor : public ALevelScriptActor
{
	GENERATED_BODY()

public:
	ADasiDeviasLevelScriptActor();

protected:
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

public:
	// ========================================================================
	// WORLD GEOMETRY & BOUNDS CONFIGURATION (BOREAL FORTRESS)
	// ========================================================================
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Devias|World")
	FVector2D WorldExtentMeters = FVector2D(2048.0f, 2048.0f);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Devias|Hearth")
	FVector KingHearthLocation = FVector(0.0f, 0.0f, 60.0f);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Devias|Hearth")
	float KingHearthThermalRadiusMeters = 25.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Devias|Atmosphere")
	float BlizzardIntensity = 0.75f;

	UFUNCTION(BlueprintPure, Category = "Dasi|Devias|Hearth")
	bool IsInsideThermalDefrostZone(const FVector& WorldLocation) const;

	UFUNCTION(BlueprintCallable, Category = "Dasi|Devias|Atmosphere")
	void SetBlizzardIntensity(float NewIntensity);
};
