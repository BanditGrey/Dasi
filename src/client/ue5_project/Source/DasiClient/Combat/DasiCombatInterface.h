#pragma once

#include "CoreMinimal.h"
#include "UObject/Interface.h"
#include "DasiCombatTypes.h"
#include "DasiCombatInterface.generated.h"

UINTERFACE(MinimalAPI, BlueprintType)
class UDasiCombatInterface : public UInterface
{
	GENERATED_BODY()
};

/**
 * Interface for all actors that interact with Dasi combat (Monsters, Bosses, Players)
 */
class DASICLIENT_API IDasiCombatInterface
{
	GENERATED_BODY()

public:
	/**
	 * Delivers damage and physical reaction to this combat entity
	 */
	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Dasi|Combat")
	void TakeDasiDamage(
		AActor* Attacker,
		float DamageAmount,
		EDasiDamageType DamageType,
		const FVector& HitLocation,
		const FVector& KnockbackVelocity,
		float StaggerDuration
	);

	/**
	 * Applies native Hit-Stop time-dilation freeze to this entity
	 */
	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Dasi|Combat")
	void ApplyHitStop(float DurationSeconds, float CustomDilation);

	/**
	 * Queries current Poise percentage (0.0 to 1.0)
	 */
	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Dasi|Combat")
	float GetPoisePercent() const;

	/**
	 * Checks if the target is still alive and interactable
	 */
	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Dasi|Combat")
	bool IsAlive() const;

	/**
	 * Returns world center of mass for hit traces and damage numbers
	 */
	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Dasi|Combat")
	FVector GetCombatHurtboxLocation() const;

	/**
	 * Returns ID / Tag of this combat actor (e.g. monster server ID)
	 */
	UFUNCTION(BlueprintNativeEvent, BlueprintCallable, Category = "Dasi|Combat")
	FString GetEntityId() const;
};
