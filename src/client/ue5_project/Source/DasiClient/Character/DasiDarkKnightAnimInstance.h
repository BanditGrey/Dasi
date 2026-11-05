#pragma once

#include "CoreMinimal.h"
#include "Animation/AnimInstance.h"
#include "Combat/DasiCombatTypes.h"
#include "DasiDarkKnightAnimInstance.generated.h"

class ADasiCharacterBase;
class UDasiCombatComponent;

/**
 * Native C++ Animation Instance for Dark Knight in Dasi MMORPG
 * High-performance animation evaluation:
 * - Real-time Foot Placement IK ground tracing (stairs, ramps, uneven terrain)
 * - Dynamic Inertial Body Leaning & Banking Angle calculation
 * - Dynamic Agility 3-Phase PlayRate feed
 * - Aerodynamic Wing state blending
 * - Tactical Roll I-Frames flag propagation
 */
UCLASS()
class DASICLIENT_API UDasiDarkKnightAnimInstance : public UAnimInstance
{
	GENERATED_BODY()

public:
	UDasiDarkKnightAnimInstance();

	virtual void NativeInitializeAnimation() override;
	virtual void NativeUpdateAnimation(float DeltaSeconds) override;

	// --- Locomotion Variables (BlendSpace Feed) ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Locomotion")
	float GroundSpeed = 0.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Locomotion")
	float MovementDirection = 0.0f; // -180.0 to 180.0 degrees

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Locomotion")
	bool bIsMoving = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Locomotion")
	bool bIsFalling = false;

	// --- Foot Placement IK (Control Rig Feed) ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|FootIK")
	float FootIK_LeftFootOffset = 0.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|FootIK")
	float FootIK_RightFootOffset = 0.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|FootIK")
	float FootIK_PelvisOffset = 0.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|FootIK")
	FRotator FootIK_LeftFootRotation = FRotator::ZeroRotator;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|FootIK")
	FRotator FootIK_RightFootRotation = FRotator::ZeroRotator;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|FootIK")
	float FootIK_TraceDistanceAbove = 50.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|FootIK")
	float FootIK_TraceDistanceBelow = 60.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|FootIK")
	float FootIK_SoleThickness = 4.5f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|FootIK")
	float FootIK_InterpSpeed = 18.0f;

	// --- Body Leaning / Banking Angle (Control Rig Feed) ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|InertialLeaning")
	float BodyLeanRoll = 0.0f; // Roll tilt in turns (deg)

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|InertialLeaning")
	float BodyLeanPitch = 0.0f; // Pitch lean in sprint/braking (deg)

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|InertialLeaning")
	float LeanRollGain = 1.35f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|InertialLeaning")
	float LeanPitchGain = 0.95f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|InertialLeaning")
	float LeanInterpSpeed = 12.0f;

	// --- Wing Aerodynamics State ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Wings")
	float WingFlapFrequency = 1.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Wings")
	float WingWingspan = 2.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Wings")
	float WingBankingAngle = 0.0f;

	// --- Combat & Agility State ---
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	bool bIsInvulnerable = false; // I-Frames during roll

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	int32 CurrentComboStep = 1;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Combat")
	float AgilityPlayRate = 1.0f;

	// Sockets used for foot IK tracing
	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Dasi|Sockets")
	FName LeftFootSocketName = TEXT("foot_l");

	UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Dasi|Sockets")
	FName RightFootSocketName = TEXT("foot_r");

private:
	void UpdateLocomotionParameters();
	void UpdateFootPlacementIK(float DeltaSeconds);
	void UpdateInertialBodyLeaning(float DeltaSeconds);
	void UpdateCombatAndWingParameters();

	// Line trace helper for a single foot
	void TraceFootGround(const FName& FootSocket, float& OutOffset, FRotator& OutRotation);

	UPROPERTY()
	TWeakObjectPtr<ADasiCharacterBase> OwningCharacter;

	UPROPERTY()
	TWeakObjectPtr<UDasiCombatComponent> OwningCombatComponent;

	// Inertia tracking history
	FVector PreviousVelocity = FVector::ZeroVector;
	float PreviousYaw = 0.0f;
};
