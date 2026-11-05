// ============================================================================
// DASI MMORPG - Unreal Engine 5 Client
// DasiItemGlowMaterialBridge.h
// Component responsible for interfacing item refinement levels (+0 to +15)
// with Dynamic Material Instances (MID) and the ItemGlowShader HLSL pipeline.
// ============================================================================

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "DasiItemGlowMaterialBridge.generated.h"

class UMeshComponent;

/**
 * Visual profile parameters for an item refinement tier bracket.
 */
USTRUCT(BlueprintType)
struct FDasiRefinementTierVisualConfig
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	FLinearColor PrimaryColor;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	FLinearColor SecondaryColor;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	float RunicPulseSpeed;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	float ArcDispersion;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	float CoronaIntensity;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	float HeatHazeStrength;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	bool bEnableDynamicTicking;

	FDasiRefinementTierVisualConfig()
		: PrimaryColor(FLinearColor(1.0f, 0.85f, 0.4f, 1.0f))
		, SecondaryColor(FLinearColor(0.2f, 0.6f, 1.0f, 1.0f))
		, RunicPulseSpeed(1.5f)
		, ArcDispersion(0.0f)
		, CoronaIntensity(0.0f)
		, HeatHazeStrength(0.0f)
		, bEnableDynamicTicking(false)
	{}
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnRefinementLevelChanged, int32, OldLevel, int32, NewLevel);

/**
 * UDasiItemGlowMaterialBridge
 * Manages Dynamic Material Instances across character armor, weapons, and accessories.
 * Transmits uniform properties to MF_ItemGlow_Include and ItemGlowShader HLSL nodes.
 */
UCLASS(ClassGroup = (Dasi), meta = (BlueprintSpawnableComponent))
class DASICLIENT_API UDasiItemGlowMaterialBridge : public UActorComponent
{
	GENERATED_BODY()

public:
	UDasiItemGlowMaterialBridge();

	virtual void BeginPlay() override;
	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

	// ------------------------------------------------------------------------
	// RUNTIME API
	// ------------------------------------------------------------------------

	/** Sets item refinement level between 0 and 15 and recalculates visual parameters */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Refinement")
	void SetRefineLevel(int32 InLevel);

	/** Returns current refinement level */
	UFUNCTION(BlueprintPure, Category = "Dasi|Refinement")
	int32 GetRefineLevel() const { return RefineLevel; }

	/** Explicitly overrides aura colors */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Refinement")
	void SetCustomAuraColors(const FLinearColor& Primary, const FLinearColor& Secondary);

	/** Registers a mesh component (SkeletalMesh or StaticMesh) to receive dynamic glow parameters */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Refinement")
	void RegisterMeshComponent(UMeshComponent* TargetMesh);

	/** Unregisters a mesh component */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Refinement")
	void UnregisterMeshComponent(UMeshComponent* TargetMesh);

	/** Clears all cached mesh components and Dynamic Material Instances */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Refinement")
	void ClearAllRegisteredMeshes();

	/** Forces immediate synchronization of all material parameters */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Refinement")
	void ForceUpdateMaterials();

public:
	// ------------------------------------------------------------------------
	// EVENT DISPATCHERS
	// ------------------------------------------------------------------------
	UPROPERTY(BlueprintAssignable, Category = "Dasi|Refinement|Events")
	FOnRefinementLevelChanged OnRefinementLevelChanged;

protected:
	// ------------------------------------------------------------------------
	// CONFIGURABLE PROPERTIES
	// ------------------------------------------------------------------------

	/** Current refinement level (+0 to +15) */
	UPROPERTY(EditAnywhere, BlueprintReadOnly, Category = "Dasi|Refinement", meta = (ClampMin = "0", ClampMax = "15"))
	int32 RefineLevel;

	/** Primary aura color emitted by runes and Fresnel rims */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	FLinearColor AuraColorPrimary;

	/** Secondary harmonic color for chromatic wave interference & micro-arcs */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	FLinearColor AuraColorSecondary;

	/** Speed of breathing rune pulses (Hz) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	float RunicPulseSpeed;

	/** Arc dispersion & electrical discharge intensity (+11 to +15) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	float ArcDispersion;

	/** Volumetric corona radiance bloom intensity (+13 to +15) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	float CoronaIntensity;

	/** Atmospheric heat-haze screen space refractive distortion strength (+13 to +15) */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	float HeatHazeStrength;

	/** Automatically look for parent mesh upon BeginPlay */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	bool bAutoRegisterParentMesh;

	/** If true, colors and intensities are automatically determined by preset profiles */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Refinement")
	bool bUsePresetProfiles;

	// ------------------------------------------------------------------------
	// HLSL PARAMETER NAMES (Must match Material Graph parameters)
	// ------------------------------------------------------------------------
	UPROPERTY(EditDefaultsOnly, Category = "Dasi|MaterialParameters")
	FName ParamRefineLevel;

	UPROPERTY(EditDefaultsOnly, Category = "Dasi|MaterialParameters")
	FName ParamGlobalTime;

	UPROPERTY(EditDefaultsOnly, Category = "Dasi|MaterialParameters")
	FName ParamAuraColorPrimary;

	UPROPERTY(EditDefaultsOnly, Category = "Dasi|MaterialParameters")
	FName ParamAuraColorSecondary;

	UPROPERTY(EditDefaultsOnly, Category = "Dasi|MaterialParameters")
	FName ParamRunicPulseSpeed;

	UPROPERTY(EditDefaultsOnly, Category = "Dasi|MaterialParameters")
	FName ParamArcDispersion;

	UPROPERTY(EditDefaultsOnly, Category = "Dasi|MaterialParameters")
	FName ParamCoronaIntensity;

	UPROPERTY(EditDefaultsOnly, Category = "Dasi|MaterialParameters")
	FName ParamHeatHazeStrength;

private:
	/** Internal list of cached dynamic material instances */
	UPROPERTY(Transient)
	TArray<TObjectPtr<UMaterialInstanceDynamic>> DynamicMaterials;

	/** Internal list of registered mesh components */
	UPROPERTY(Transient)
	TArray<TWeakObjectPtr<UMeshComponent>> RegisteredMeshes;

	/** Cumulative animated phase time */
	float InternalTimeAccumulator;

	/** Applies tier preset logic based on RefineLevel */
	void ApplyTierDefaults(int32 Level);

	/** Rebuilds dynamic material instances for a specific mesh */
	void BuildMIDsForMesh(UMeshComponent* Mesh);

	/** Pushes current parameters to all cached dynamic material instances */
	void PushParametersToMaterials();
};
