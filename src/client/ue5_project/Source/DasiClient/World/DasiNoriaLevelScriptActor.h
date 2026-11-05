// ============================================================================
// DASI MMORPG - UNREAL ENGINE 5 CLIENT
// DasiNoriaLevelScriptActor.h
// Native Level Script Actor for the Feywood Sacred Arboretum (Noria) Map.
// ============================================================================

#pragma once

#include "CoreMinimal.h"
#include "Engine/LevelScriptActor.h"
#include "DasiLorenciaLevelScriptActor.h"
#include "DasiNoriaLevelScriptActor.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnChaosMachineStateChanged, bool, bIsActive);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnSporeDensityChanged, float, NewSporeDensity);

/**
 * ADasiNoriaLevelScriptActor
 * Native Level Script Actor managing the Noria / Feywood level lifecycle.
 */
UCLASS()
class DASICLIENT_API ADasiNoriaLevelScriptActor : public ALevelScriptActor
{
	GENERATED_BODY()

public:
	ADasiNoriaLevelScriptActor();

protected:
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

public:
	// ========================================================================
	// WORLD GEOMETRY & BOUNDS CONFIGURATION (FEYWOOD ARBORETUM)
	// ========================================================================
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Noria|World")
	FVector2D WorldExtentMeters = FVector2D(2048.0f, 2048.0f);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Noria|World")
	float CanopyAltitudeMeters = 45.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Noria|World")
	float RootCityAltitudeMeters = 16.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Noria|World")
	float DeepJungleAltitudeMeters = -2.0f;

	// ========================================================================
	// CHAOS FORGE & BIOLUMINESCENCE PARAMETERS
	// ========================================================================
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Noria|Chaos")
	float ChaosReactorRPM = 1200.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Noria|Chaos")
	FLinearColor ChaosPlasmaColor = FLinearColor(1.0f, 0.0f, 0.65f, 1.0f);

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Noria|Atmosphere")
	float BioluminescentSporeDensity = 0.85f;

	UFUNCTION(BlueprintCallable, Category = "Dasi|Noria|Chaos")
	void TriggerChaosForgeCombination(bool bSuccess);

	UFUNCTION(BlueprintPure, Category = "Dasi|Noria|World")
	bool IsInSacredHealingSpring(const FVector& WorldLocation) const;
};
