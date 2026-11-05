#pragma once

#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "Combat/DasiCombatTypes.h"
#include "Network/DasiNetworkTypes.h"
#include "DasiDamageNumberSubsystem.generated.h"

class UTextRenderComponent;
class UNiagaraSystem;
class UNiagaraComponent;
class USoundBase;

/**
 * Lightweight pooled actor representing a floating 3D combat damage number in the world
 */
UCLASS()
class DASICLIENT_API ADasiDamageNumberActor : public AActor
{
	GENERATED_BODY()

public:
	ADasiDamageNumberActor();

	virtual void Tick(float DeltaTime) override;

	void ActivateDamageNumber(
		float DamageAmount,
		EDasiDamageType DamageType,
		const FVector& SpawnLocation,
		float Duration = 0.95f
	);

	void Deactivate();

	bool IsActive() const { return bIsActive; }

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|DamageText")
	TObjectPtr<UTextRenderComponent> TextRenderComponent;

private:
	bool bIsActive = false;
	float Age = 0.0f;
	float TotalLifetime = 0.95f;
	float BaseScaleMultiplier = 1.0f;

	FVector InitialLocation = FVector::ZeroVector;
	FVector CurrentVelocity = FVector::ZeroVector;
	FLinearColor TextColor = FLinearColor::White;
};

/**
 * World Subsystem managing the sacred Continent of Legend damage numbers and visual feedback
 * Supports:
 * - White (#FFFFFF) - Normal
 * - Orange (#FF8800) - Weapon Skill
 * - Cyan (#00E5FF) - Critical Hit
 * - Neon Green (#39FF14) - Excellent Strike
 * - Gold (#FFD700) - Ignore Defense
 * - Gray (#AAAAAA) - Miss
 * High-performance object pooling with zero runtime garbage collection during mob hordes.
 */
UCLASS()
class DASICLIENT_API UDasiDamageNumberSubsystem : public UTickableWorldSubsystem
{
	GENERATED_BODY()

public:
	UDasiDamageNumberSubsystem();

	// --- Subsystem Lifecycle ---
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;
	virtual void Deinitialize() override;
	virtual void Tick(float DeltaTime) override;
	virtual TStatId GetStatId() const override;

	// --- Public API ---
	UFUNCTION(BlueprintCallable, Category = "Dasi|DamageNumbers")
	void SpawnDamageNumber(
		float DamageAmount,
		EDasiDamageType DamageType,
		const FVector& WorldLocation,
		bool bIsMiss = false
	);

	UFUNCTION(BlueprintCallable, Category = "Dasi|DamageNumbers")
	void SpawnDamageNumberFromNetwork(
		float DamageAmount,
		const FString& DamageTypeString,
		const FVector& WorldLocation,
		bool bIsMiss
	);

	UFUNCTION(BlueprintCallable, Category = "Dasi|DamageNumbers")
	void SpawnDamageNumberFromResult(
		const FDasiCombatAttackResult& Result,
		const FVector& WorldLocation
	);

	// --- Visual Feedback Assets Configuration ---
	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Niagara")
	TObjectPtr<UNiagaraSystem> NormalHitNiagara;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Niagara")
	TObjectPtr<UNiagaraSystem> SkillHitNiagara;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Niagara")
	TObjectPtr<UNiagaraSystem> CriticalHitNiagara;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Niagara")
	TObjectPtr<UNiagaraSystem> ExcellentHitNiagara;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Niagara")
	TObjectPtr<UNiagaraSystem> IgnoreDefenseHitNiagara;

	// Sound assets
	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Audio")
	TObjectPtr<USoundBase> CriticalSoundCue;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Audio")
	TObjectPtr<USoundBase> ExcellentSoundCue;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Audio")
	TObjectPtr<USoundBase> IgnoreDefenseSoundCue;

private:
	ADasiDamageNumberActor* AcquireDamageNumberFromPool();
	void ReturnToPool(ADasiDamageNumberActor* Actor);
	void SpawnHitNiagaraAndSound(EDasiDamageType DamageType, const FVector& WorldLocation);

	// Object Pool
	UPROPERTY()
	TArray<TObjectPtr<ADasiDamageNumberActor>> ActivePool;

	UPROPERTY()
	TArray<TObjectPtr<ADasiDamageNumberActor>> InactivePool;

	static constexpr int32 InitialPoolSize = 64;
	static constexpr int32 MaxPoolCapacity = 256;
};
