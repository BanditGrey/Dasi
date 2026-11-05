#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "Combat/DasiCombatTypes.h"
#include "Combat/DasiCombatInterface.h"
#include "DasiCharacterBase.generated.h"

class USpringArmComponent;
class UCameraComponent;
class UDasiCombatComponent;
class UDasiInventoryComponent;
class UAnimMontage;

UENUM(BlueprintType)
enum class EItemEquipmentSlot : uint8
{
	Helm,
	Armor,
	Pants,
	Gloves,
	Boots,
	Wings
};

/**
 * Base character class for Dasi MMORPG
 * Features:
 * - Full modular armor meshes with LeaderPoseComponent sync (Helm, Chest, Pants, Gloves, Boots, Wings, Weapons)
 * - Agility 3-phase incompressible animation scaling curves (anti-speed bug)
 * - Dynamic wing aerodynamics simulation (Tiers 1, 2, 3)
 * - Standardized sockets for volumetric weapon traces and spine wings
 * - Built-in Hit-Stop procedural micro-jitter, Stagger & Knockback
 */
UCLASS()
class DASICLIENT_API ADasiCharacterBase : public ACharacter, public IDasiCombatInterface
{
	GENERATED_BODY()

public:
	ADasiCharacterBase();

	virtual void PostInitializeComponents() override;
	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;
	virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

	// --- IDasiCombatInterface Implementation ---
	virtual void TakeDasiDamage_Implementation(
		AActor* Attacker,
		float DamageAmount,
		EDasiDamageType DamageType,
		const FVector& HitLocation,
		const FVector& KnockbackVelocity,
		float StaggerDuration
	) override;

	virtual void ApplyHitStop_Implementation(float DurationSeconds, float CustomDilation) override;
	virtual float GetPoisePercent_Implementation() const override;
	virtual bool IsAlive_Implementation() const override;
	virtual FVector GetCombatHurtboxLocation_Implementation() const override;
	virtual FString GetEntityId_Implementation() const override;

	// --- Modular Armor Mesh Components ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|ModularMesh")
	TObjectPtr<USkeletalMeshComponent> HeadMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|ModularMesh")
	TObjectPtr<USkeletalMeshComponent> ChestMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|ModularMesh")
	TObjectPtr<USkeletalMeshComponent> LegsMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|ModularMesh")
	TObjectPtr<USkeletalMeshComponent> GlovesMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|ModularMesh")
	TObjectPtr<USkeletalMeshComponent> BootsMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|ModularMesh")
	TObjectPtr<USkeletalMeshComponent> WingsMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Weapons")
	TObjectPtr<USkeletalMeshComponent> RightWeaponMesh;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Weapons")
	TObjectPtr<USkeletalMeshComponent> LeftWeaponMesh;

	// --- Camera & Boom ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Camera")
	TObjectPtr<USpringArmComponent> CameraBoom;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Camera")
	TObjectPtr<UCameraComponent> TopDownCameraComponent;

	// --- Combat Component ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	TObjectPtr<UDasiCombatComponent> CombatComponent;

	// --- Inventory Component ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Inventory")
	TObjectPtr<UDasiInventoryComponent> InventoryComponent;

	// --- Character Stats & Agility Scaling ---
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Stats")
	int32 Agility = 150;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Stats")
	float BaseWeaponSpeedModifier = 1.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Stats")
	float MaxHealth = 1000.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Stats")
	float CurrentHealth = 1000.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Stats")
	float MaxPoise = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Stats")
	float CurrentPoise = 100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Stats")
	float PoiseRecoveryRate = 25.0f; // Poise recovered per second

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Stats")
	FString ServerEntityId = TEXT("Player_001");

	// --- Wings System ---
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Wings")
	EDasiWingTier WingTier = EDasiWingTier::Tier2_Celestial;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Wings")
	FDasiWingPhysicsState CurrentWingPhysics;

	// --- Socket Names ---
	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Dasi|Sockets")
	FName RightWeaponSocketName = TEXT("Weapon_R_Socket");

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Dasi|Sockets")
	FName LeftWeaponSocketName = TEXT("Weapon_L_Socket");

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Dasi|Sockets")
	FName SpineWingSocketName = TEXT("spine_03_wings");

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Dasi|Sockets")
	FName WeaponTraceStartSocket = TEXT("WeaponStart");

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Dasi|Sockets")
	FName WeaponTraceMidSocket = TEXT("WeaponMid");

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Dasi|Sockets")
	FName WeaponTraceEndSocket = TEXT("WeaponEnd");

	// --- Animation Montages ---
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Animations")
	TObjectPtr<UAnimMontage> LightHitReactionMontage;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Animations")
	TObjectPtr<UAnimMontage> HeavyStaggerMontage;

	// --- Agility Math & Timing Queries ---
	UFUNCTION(BlueprintPure, Category = "Dasi|Agility")
	FDasiAttackPhaseTiming CalculateAgilityAttackTiming(int32 AgilityValue, float WeaponSpeedMod, int32 ComboStep = 1) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Agility")
	float CalculateMontagePlayRate(UAnimMontage* Montage, int32 AgilityValue, int32 ComboStep = 1) const;

	// --- Getters ---
	FORCEINLINE USpringArmComponent* GetCameraBoom() const { return CameraBoom; }
	FORCEINLINE UCameraComponent* GetTopDownCamera() const { return TopDownCameraComponent; }
	FORCEINLINE UDasiCombatComponent* GetCombatComponent() const { return CombatComponent; }
	FORCEINLINE UDasiInventoryComponent* GetInventoryComponent() const { return InventoryComponent; }

	// Modular Mesh Setter Helpers
	UFUNCTION(BlueprintCallable, Category = "Dasi|ModularMesh")
	void SetArmorPiece(EItemEquipmentSlot Slot, USkeletalMesh* NewMesh);

	UFUNCTION(BlueprintCallable, Category = "Dasi|ModularMesh")
	void SetEquippedWeapon(bool bIsRightHand, USkeletalMesh* NewWeaponMesh);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Wings")
	void EquipWings(EDasiWingTier NewTier, USkeletalMesh* NewWingMesh);

private:
	void UpdateWingAerodynamics(float DeltaTime);
	void UpdateHitStopMeshJitter(float DeltaTime);
	void UpdatePoiseRecovery(float DeltaTime);

	// Hit-Stop state
	bool bIsMeshJitterActive = false;
	float MeshJitterTimeRemaining = 0.0f;
	float MeshJitterAmplitude = 1.0f;
	FVector MeshOriginalRelativeLocation = FVector::ZeroVector;
	FTimerHandle HitStopTimerHandle;

	// Stored turn angular velocity for wing banking calculation
	float PreviousYaw = 0.0f;
	float YawAngularVelocityDegPerSec = 0.0f;
};
