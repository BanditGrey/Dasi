#include "Character/DasiDarkKnightAnimInstance.h"
#include "Character/DasiCharacterBase.h"
#include "Combat/DasiCombatComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Kismet/KismetMathLibrary.h"
#include "DasiClient.h"

UDasiDarkKnightAnimInstance::UDasiDarkKnightAnimInstance()
{
	GroundSpeed = 0.0f;
	MovementDirection = 0.0f;
	bIsMoving = false;
	bIsFalling = false;

	FootIK_LeftFootOffset = 0.0f;
	FootIK_RightFootOffset = 0.0f;
	FootIK_PelvisOffset = 0.0f;
	FootIK_LeftFootRotation = FRotator::ZeroRotator;
	FootIK_RightFootRotation = FRotator::ZeroRotator;

	FootIK_TraceDistanceAbove = 50.0f;
	FootIK_TraceDistanceBelow = 60.0f;
	FootIK_SoleThickness = 4.5f;
	FootIK_InterpSpeed = 18.0f;

	BodyLeanRoll = 0.0f;
	BodyLeanPitch = 0.0f;
	LeanRollGain = 1.35f;
	LeanPitchGain = 0.95f;
	LeanInterpSpeed = 12.0f;

	WingFlapFrequency = 1.0f;
	WingWingspan = 2.0f;
	WingBankingAngle = 0.0f;

	bIsInvulnerable = false;
	CurrentComboStep = 1;
	AgilityPlayRate = 1.0f;

	LeftFootSocketName = TEXT("foot_l");
	RightFootSocketName = TEXT("foot_r");
}

void UDasiDarkKnightAnimInstance::NativeInitializeAnimation()
{
	Super::NativeInitializeAnimation();

	OwningCharacter = Cast<ADasiCharacterBase>(TryGetPawnOwner());
	if (OwningCharacter.IsValid())
	{
		OwningCombatComponent = OwningCharacter->GetCombatComponent();
		PreviousVelocity = OwningCharacter->GetVelocity();
		PreviousYaw = OwningCharacter->GetActorRotation().Yaw;
	}
}

void UDasiDarkKnightAnimInstance::NativeUpdateAnimation(float DeltaSeconds)
{
	Super::NativeUpdateAnimation(DeltaSeconds);

	if (DeltaSeconds <= 0.0f) return;

	if (!OwningCharacter.IsValid())
	{
		OwningCharacter = Cast<ADasiCharacterBase>(TryGetPawnOwner());
		if (!OwningCharacter.IsValid()) return;
		OwningCombatComponent = OwningCharacter->GetCombatComponent();
	}

	UpdateLocomotionParameters();
	UpdateFootPlacementIK(DeltaSeconds);
	UpdateInertialBodyLeaning(DeltaSeconds);
	UpdateCombatAndWingParameters();
}

void UDasiDarkKnightAnimInstance::UpdateLocomotionParameters()
{
	ADasiCharacterBase* Character = OwningCharacter.Get();
	if (!Character) return;

	const FVector Velocity = Character->GetVelocity();
	GroundSpeed = Velocity.Size2D();
	bIsMoving = GroundSpeed > 10.0f;

	if (UCharacterMovementComponent* MoveComp = Character->GetCharacterMovement())
	{
		bIsFalling = MoveComp->IsFalling();
	}

	MovementDirection = CalculateDirection(Velocity, Character->GetActorRotation());
}

void UDasiDarkKnightAnimInstance::UpdateFootPlacementIK(float DeltaSeconds)
{
	ADasiCharacterBase* Character = OwningCharacter.Get();
	if (!Character || bIsFalling)
	{
		// Smoothly restore feet to neutral in mid-air
		FootIK_LeftFootOffset = FMath::FInterpTo(FootIK_LeftFootOffset, 0.0f, DeltaSeconds, 10.0f);
		FootIK_RightFootOffset = FMath::FInterpTo(FootIK_RightFootOffset, 0.0f, DeltaSeconds, 10.0f);
		FootIK_PelvisOffset = FMath::FInterpTo(FootIK_PelvisOffset, 0.0f, DeltaSeconds, 10.0f);
		FootIK_LeftFootRotation = FMath::RInterpTo(FootIK_LeftFootRotation, FRotator::ZeroRotator, DeltaSeconds, 10.0f);
		FootIK_RightFootRotation = FMath::RInterpTo(FootIK_RightFootRotation, FRotator::ZeroRotator, DeltaSeconds, 10.0f);
		return;
	}

	float TargetLeftOffset = 0.0f;
	FRotator TargetLeftRot = FRotator::ZeroRotator;
	TraceFootGround(LeftFootSocketName, TargetLeftOffset, TargetLeftRot);

	float TargetRightOffset = 0.0f;
	FRotator TargetRightRot = FRotator::ZeroRotator;
	TraceFootGround(RightFootSocketName, TargetRightOffset, TargetRightRot);

	// Interpolate foot offsets and surface alignment rotations
	FootIK_LeftFootOffset = FMath::FInterpTo(FootIK_LeftFootOffset, TargetLeftOffset, DeltaSeconds, FootIK_InterpSpeed);
	FootIK_RightFootOffset = FMath::FInterpTo(FootIK_RightFootOffset, TargetRightOffset, DeltaSeconds, FootIK_InterpSpeed);

	FootIK_LeftFootRotation = FMath::RInterpTo(FootIK_LeftFootRotation, TargetLeftRot, DeltaSeconds, FootIK_InterpSpeed);
	FootIK_RightFootRotation = FMath::RInterpTo(FootIK_RightFootRotation, TargetRightRot, DeltaSeconds, FootIK_InterpSpeed);

	// Pelvis offset adjustment: drop pelvis to match lowest foot contact
	const float TargetPelvisOffset = FMath::Min(FootIK_LeftFootOffset, FootIK_RightFootOffset);
	FootIK_PelvisOffset = FMath::FInterpTo(FootIK_PelvisOffset, TargetPelvisOffset, DeltaSeconds, FootIK_InterpSpeed);
}

void UDasiDarkKnightAnimInstance::TraceFootGround(const FName& FootSocket, float& OutOffset, FRotator& OutRotation)
{
	USkeletalMeshComponent* MeshComp = GetOwningComponent();
	UWorld* World = GetWorld();
	if (!MeshComp || !World)
	{
		OutOffset = 0.0f;
		OutRotation = FRotator::ZeroRotator;
		return;
	}

	const FVector FootLocation = MeshComp->GetSocketLocation(FootSocket);
	const FVector TraceStart = FootLocation + FVector(0.0f, 0.0f, FootIK_TraceDistanceAbove);
	const FVector TraceEnd = FootLocation - FVector(0.0f, 0.0f, FootIK_TraceDistanceBelow);

	FHitResult HitResult;
	FCollisionQueryParams QueryParams(TEXT("DasiFootIKTrace"), false, OwningCharacter.Get());
	QueryParams.AddIgnoredActor(OwningCharacter.Get());

	const bool bHit = World->LineTraceSingleByChannel(HitResult, TraceStart, TraceEnd, ECC_Visibility, QueryParams);

	if (bHit)
	{
		// Calculate offset from ground impact point
		const float DeltaZ = (HitResult.ImpactPoint.Z - FootLocation.Z) + FootIK_SoleThickness;
		OutOffset = FMath::Clamp(DeltaZ, -50.0f, 35.0f);

		// Calculate slope alignment angles from impact normal
		const FVector Normal = HitResult.ImpactNormal;
		const float Pitch = FMath::RadiansToDegrees(FMath::Atan2(Normal.X, Normal.Z));
		const float Roll = -FMath::RadiansToDegrees(FMath::Atan2(Normal.Y, Normal.Z));

		OutRotation = FRotator(
			FMath::Clamp(Pitch, -35.0f, 35.0f),
			0.0f,
			FMath::Clamp(Roll, -35.0f, 35.0f)
		);
	}
	else
	{
		OutOffset = 0.0f;
		OutRotation = FRotator::ZeroRotator;
	}
}

void UDasiDarkKnightAnimInstance::UpdateInertialBodyLeaning(float DeltaSeconds)
{
	ADasiCharacterBase* Character = OwningCharacter.Get();
	if (!Character) return;

	const FVector CurrentVelocity = Character->GetVelocity();
	const FVector Acceleration = (CurrentVelocity - PreviousVelocity) / DeltaSeconds;
	PreviousVelocity = CurrentVelocity;

	// Longitudinal lean (Pitch forward during sprint; backward during braking)
	const FVector ForwardVector = Character->GetActorForwardVector();
	const float ForwardAccel = FVector::DotProduct(Acceleration, ForwardVector);
	const float TargetPitch = FMath::Clamp((-ForwardAccel / 980.0f) * 15.0f * LeanPitchGain, -16.0f, 18.0f);

	// Centripetal lean in turns (Roll banking)
	const float CurrentYaw = Character->GetActorRotation().Yaw;
	const float DeltaYaw = FMath::FindDeltaAngleDegrees(PreviousYaw, CurrentYaw);
	PreviousYaw = CurrentYaw;

	const float YawAngularRate = DeltaYaw / DeltaSeconds; // deg/s
	const float TurnRadSec = FMath::DegreesToRadians(YawAngularRate);
	const float LateralCentripetalAccel = TurnRadSec * (GroundSpeed / 100.0f) * 100.0f; // cm/s^2
	const float TargetRoll = FMath::Clamp((LateralCentripetalAccel / 980.0f) * 20.0f * LeanRollGain, -24.0f, 24.0f);

	// Smooth spring interpolation
	BodyLeanPitch = FMath::FInterpTo(BodyLeanPitch, TargetPitch, DeltaSeconds, LeanInterpSpeed);
	BodyLeanRoll = FMath::FInterpTo(BodyLeanRoll, TargetRoll, DeltaSeconds, LeanInterpSpeed);
}

void UDasiDarkKnightAnimInstance::UpdateCombatAndWingParameters()
{
	ADasiCharacterBase* Character = OwningCharacter.Get();
	if (!Character) return;

	// Wings aerodynamic sync
	WingFlapFrequency = Character->CurrentWingPhysics.FlapFrequencyHz;
	WingWingspan = Character->CurrentWingPhysics.WingspanMeters;
	WingBankingAngle = Character->CurrentWingPhysics.BankingAngleDegrees;

	// Combat component sync
	if (UDasiCombatComponent* CombatComp = OwningCombatComponent.Get())
	{
		CurrentComboStep = CombatComp->CurrentComboStep;
	}

	// Agility 3-Phase PlayRate multiplier (Incompressible floor preserved)
	AgilityPlayRate = Character->CalculateMontagePlayRate(nullptr, Character->Agility, CurrentComboStep);
}
