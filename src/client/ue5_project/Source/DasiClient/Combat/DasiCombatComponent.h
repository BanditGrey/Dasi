#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Combat/DasiCombatTypes.h"
#include "DasiCombatComponent.generated.h"

class ADasiCharacterBase;
class USkeletalMeshComponent;
class UAnimMontage;
class UCameraShakeBase;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnDasiWeaponHitSignature, AActor*, Attacker, AActor*, Target, const FDasiHitRecord&, HitRecord);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnDasiHitStopSignature, EDasiDamageType, DamageType, float, DurationSeconds);

/**
 * Combat Component for Dasi Action Combat
 * Implements:
 * - Continuous volumetric blade tracing (sub-stepping capsule sweeps between WeaponStart and WeaponEnd sockets)
 * - Native Hit-Stop micro-freeze execution on attacker and defender (40ms - 120ms)
 * - Posture stagger and knockback physics application
 * - Inertial combo buffering with momentum chaining
 */
UCLASS(ClassGroup = (Dasi), meta = (BlueprintSpawnableComponent))
class DASICLIENT_API UDasiCombatComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UDasiCombatComponent();

	virtual void BeginPlay() override;
	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

	// --- Initialization ---
	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat")
	void InitializeWeaponTraces(USkeletalMeshComponent* RightWeapon, USkeletalMeshComponent* LeftWeapon);

	// --- Weapon Trace Control ---
	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat|Trace")
	void BeginWeaponTrace(FName AttackProfileName = NAME_None, float InitialCleaveEnergy = 100.0f);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat|Trace")
	void EndWeaponTrace();

	UFUNCTION(BlueprintPure, Category = "Dasi|Combat|Trace")
	bool IsTracingActive() const { return bIsTracingActive; }

	// --- Attack & Combo Commands ---
	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat")
	bool RequestAttackTarget(AActor* TargetActor);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat")
	bool ExecuteSkillAttack(FName SkillName, const FVector& TargetLocation);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat")
	void CancelAttack();

	// --- Animation Notify Callbacks ---
	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat|Notifies")
	void OnAnimNotify_TraceBegin(FName AttackProfile = NAME_None);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat|Notifies")
	void OnAnimNotify_TraceEnd();

	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat|Notifies")
	void OnAnimNotify_ComboWindowOpen();

	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat|Notifies")
	void OnAnimNotify_ComboWindowClose();

	// --- Hit-Stop & Feedback Execution ---
	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat")
	void ExecuteHitStop(EDasiDamageType DamageType, AActor* TargetActor);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Combat")
	void ApplyStaggerAndKnockback(AActor* TargetActor, const FVector& ImpactDirection, float KnockbackMagnitude);

	// --- Events ---
	UPROPERTY(BlueprintAssignable, Category = "Dasi|Combat|Events")
	FOnDasiWeaponHitSignature OnWeaponHit;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Combat|Events")
	FOnDasiHitStopSignature OnHitStopTriggered;

	// --- Configuration ---
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat|Trace")
	float TraceSphereRadius = 18.0f; // Radius of swept spheres along the blade in cm

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat|Trace")
	TEnumAsByte<ECollisionChannel> TraceCollisionChannel = ECC_Pawn;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat|Trace")
	int32 MaxSubstepsPerFrame = 6;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat|Montages")
	TArray<TObjectPtr<UAnimMontage>> ComboMontages;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat|Montages")
	TMap<FName, TObjectPtr<UAnimMontage>> SkillMontages;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat|Feedback")
	TSubclassOf<UCameraShakeBase> DefaultImpactCameraShake;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat|Feedback")
	TSubclassOf<UCameraShakeBase> HeavyImpactCameraShake;

	// --- Combo State ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat|Combo")
	int32 CurrentComboStep = 1;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat|Combo")
	bool bHasBufferedNextAttack = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat|Combo")
	bool bIsInComboRecoveryWindow = false;

private:
	void PerformVolumetricTraceSweep(float DeltaTime);
	void ProcessHitActor(AActor* HitActor, const FHitResult& SweepHit, const FName& SocketName, float BladeVelocity);
	void ResetAttackerTimeDilation();

	// References
	UPROPERTY()
	TObjectPtr<ADasiCharacterBase> OwnerCharacter;

	UPROPERTY()
	TObjectPtr<USkeletalMeshComponent> ActiveWeaponMesh;

	UPROPERTY()
	TObjectPtr<USkeletalMeshComponent> SecondaryWeaponMesh;

	// Trace state
	bool bIsTracingActive = false;
	float CurrentCleaveEnergy = 100.0f;
	TSet<TWeakObjectPtr<AActor>> HitActorsThisSwing;

	// Stored socket locations from previous tick for continuous sub-stepping
	TMap<FName, FVector> PreviousSocketLocations;

	// Sockets sampled along the weapon
	TArray<FName> ActiveTraceSockets;

	// Hit-Stop timer
	FTimerHandle HitStopRestoreTimerHandle;
	float OriginalCustomTimeDilation = 1.0f;
};
