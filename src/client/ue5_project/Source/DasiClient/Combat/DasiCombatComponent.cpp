#include "Combat/DasiCombatComponent.h"
#include "Character/DasiCharacterBase.h"
#include "Combat/DasiCombatInterface.h"
#include "Components/SkeletalMeshComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "GameFramework/PlayerController.h"
#include "Camera/CameraShakeBase.h"
#include "Kismet/GameplayStatics.h"
#include "DasiClient.h"

UDasiCombatComponent::UDasiCombatComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
	PrimaryComponentTick.TickGroup = TG_PrePhysics;

	TraceSphereRadius = 18.0f;
	TraceCollisionChannel = ECC_Pawn;
	MaxSubstepsPerFrame = 6;
	CurrentComboStep = 1;
	bIsTracingActive = false;
	CurrentCleaveEnergy = 100.0f;
}

void UDasiCombatComponent::BeginPlay()
{
	Super::BeginPlay();
	OwnerCharacter = Cast<ADasiCharacterBase>(GetOwner());
}

void UDasiCombatComponent::InitializeWeaponTraces(USkeletalMeshComponent* RightWeapon, USkeletalMeshComponent* LeftWeapon)
{
	ActiveWeaponMesh = RightWeapon;
	SecondaryWeaponMesh = LeftWeapon;

	ActiveTraceSockets.Empty();
	ActiveTraceSockets.Add(TEXT("WeaponStart"));
	ActiveTraceSockets.Add(TEXT("WeaponMid"));
	ActiveTraceSockets.Add(TEXT("WeaponEnd"));
}

void UDasiCombatComponent::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);

	if (bIsTracingActive)
	{
		PerformVolumetricTraceSweep(DeltaTime);
	}
}

// ------------------------------------------------------------------------------------------------
// VOLUMETRIC WEAPON TRACE SWEEP (SUB-STEPPED CONTINUOUS CAPSULE/SPHERE SWEEP)
// ------------------------------------------------------------------------------------------------

void UDasiCombatComponent::BeginWeaponTrace(FName AttackProfileName, float InitialCleaveEnergy)
{
	bIsTracingActive = true;
	CurrentCleaveEnergy = InitialCleaveEnergy;
	HitActorsThisSwing.Empty();
	PreviousSocketLocations.Empty();

	if (ActiveWeaponMesh)
	{
		for (const FName& SockName : ActiveTraceSockets)
		{
			PreviousSocketLocations.Add(SockName, ActiveWeaponMesh->GetSocketLocation(SockName));
		}
	}
}

void UDasiCombatComponent::EndWeaponTrace()
{
	bIsTracingActive = false;
	HitActorsThisSwing.Empty();
	PreviousSocketLocations.Empty();
}

void UDasiCombatComponent::PerformVolumetricTraceSweep(float DeltaTime)
{
	if (!ActiveWeaponMesh || !OwnerCharacter || DeltaTime <= 0.0001f)
	{
		return;
	}

	UWorld* World = GetWorld();
	if (!World) return;

	// Query current socket positions in world space
	TMap<FName, FVector> CurrentSocketLocations;
	for (const FName& SockName : ActiveTraceSockets)
	{
		CurrentSocketLocations.Add(SockName, ActiveWeaponMesh->GetSocketLocation(SockName));
	}

	// Initialize previous frame baseline if missing
	if (PreviousSocketLocations.Num() == 0)
	{
		PreviousSocketLocations = CurrentSocketLocations;
		return;
	}

	// Calculate tip displacement and instantaneous angular velocity
	const FVector PrevTip = PreviousSocketLocations.FindRef(TEXT("WeaponEnd"));
	const FVector CurrTip = CurrentSocketLocations.FindRef(TEXT("WeaponEnd"));
	const float TipDisplacement = FVector::Dist(PrevTip, CurrTip);
	const float BladeVelocity = TipDisplacement / DeltaTime; // cm/s

	// Dynamic sub-stepping to prevent tunneling at extreme agility
	const int32 RequiredSubsteps = FMath::Clamp(
		FMath::CeilToInt(TipDisplacement / FMath::Max(4.0f, TraceSphereRadius)),
		2,
		MaxSubstepsPerFrame
	);

	FCollisionQueryParams QueryParams(TEXT("DasiVolumetricWeaponTrace"), false, OwnerCharacter);
	QueryParams.AddIgnoredActor(OwnerCharacter);

	// Perform swept sphere checks across sub-step segments
	for (int32 Step = 1; Step <= RequiredSubsteps; ++Step)
	{
		const float Alpha0 = (float)(Step - 1) / (float)RequiredSubsteps;
		const float Alpha1 = (float)Step / (float)RequiredSubsteps;

		for (const FName& SockName : ActiveTraceSockets)
		{
			const FVector P0 = FMath::Lerp(PreviousSocketLocations.FindRef(SockName), CurrentSocketLocations.FindRef(SockName), Alpha0);
			const FVector P1 = FMath::Lerp(PreviousSocketLocations.FindRef(SockName), CurrentSocketLocations.FindRef(SockName), Alpha1);

			TArray<FHitResult> SweepHits;
			const bool bHit = World->SweepMultiByChannel(
				SweepHits,
				P0,
				P1,
				FQuat::Identity,
				TraceCollisionChannel,
				FCollisionShape::MakeSphere(TraceSphereRadius),
				QueryParams
			);

			if (bHit)
			{
				for (const FHitResult& Hit : SweepHits)
				{
					AActor* HitActor = Hit.GetActor();
					if (HitActor && HitActor != OwnerCharacter && !HitActorsThisSwing.Contains(HitActor))
					{
						ProcessHitActor(HitActor, Hit, SockName, BladeVelocity);

						// Stop further penetration if blade was deflected by heavy armor/parry
						if (CurrentCleaveEnergy <= 0.0f)
						{
							EndWeaponTrace();
							return;
						}
					}
				}
			}
		}
	}

	// Update historical socket locations for next frame
	PreviousSocketLocations = CurrentSocketLocations;
}

void UDasiCombatComponent::ProcessHitActor(AActor* HitActor, const FHitResult& SweepHit, const FName& SocketName, float BladeVelocity)
{
	HitActorsThisSwing.Add(HitActor);

	// Calculate cleave decay
	const float TargetArmorResistance = 30.0f;
	bool bDeflected = false;

	if (CurrentCleaveEnergy <= TargetArmorResistance)
	{
		bDeflected = true;
		CurrentCleaveEnergy = 0.0f;
	}
	else
	{
		CurrentCleaveEnergy -= TargetArmorResistance;
	}

	// Determine damage type based on combat state and critical calculation
	EDasiDamageType DamageType = EDasiDamageType::Normal;
	float BaseDamage = 180.0f;

	const float CritRoll = FMath::FRand();
	if (CritRoll > 0.85f)
	{
		DamageType = EDasiDamageType::Excellent;
		BaseDamage *= 2.0f;
	}
	else if (CritRoll > 0.65f)
	{
		DamageType = EDasiDamageType::Critical;
		BaseDamage *= 1.5f;
	}

	// Record hit details
	FDasiHitRecord HitRecord;
	HitRecord.Attacker = OwnerCharacter;
	HitRecord.Target = HitActor;
	HitRecord.HitSocket = SocketName;
	HitRecord.HitLocation = SweepHit.ImpactPoint.IsNearlyZero() ? SweepHit.Location : SweepHit.ImpactPoint;
	HitRecord.HitNormal = SweepHit.ImpactNormal.IsNearlyZero() ? (HitActor->GetActorLocation() - OwnerCharacter->GetActorLocation()).GetSafeNormal() : SweepHit.ImpactNormal;
	HitRecord.ImpactVelocity = BladeVelocity;
	HitRecord.RemainingCleaveEnergy = CurrentCleaveEnergy;
	HitRecord.bDeflected = bDeflected;

	// Execute native Hit-Stop micro-dilation
	ExecuteHitStop(DamageType, HitActor);

	// Calculate Knockback direction and force
	FVector KnockbackDir = (HitActor->GetActorLocation() - OwnerCharacter->GetActorLocation()).GetSafeNormal2D();
	float KnockbackForce = DamageType == EDasiDamageType::Excellent ? 750.0f : 450.0f;
	ApplyStaggerAndKnockback(HitActor, KnockbackDir, KnockbackForce);

	// Deliver damage via combat interface
	if (HitActor->GetClass()->ImplementsInterface(UDasiCombatInterface::StaticClass()))
	{
		FVector KnockbackVelocity = KnockbackDir * KnockbackForce + FVector(0.0f, 0.0f, 180.0f);
		IDasiCombatInterface::Execute_TakeDasiDamage(
			HitActor,
			OwnerCharacter,
			BaseDamage,
			DamageType,
			HitRecord.HitLocation,
			KnockbackVelocity,
			0.25f
		);
	}

	// Broadcast hit event for particles, sounds, and network replication
	OnWeaponHit.Broadcast(OwnerCharacter, HitActor, HitRecord);
}

// ------------------------------------------------------------------------------------------------
// HIT-STOP NATIVE TIME DILATION & CAMERA SHAKE
// ------------------------------------------------------------------------------------------------

void UDasiCombatComponent::ExecuteHitStop(EDasiDamageType DamageType, AActor* TargetActor)
{
	if (!OwnerCharacter) return;

	FDasiDamageVisualConfig VisualCfg = FDasiCombatHelper::GetVisualConfig(DamageType);
	if (VisualCfg.HitStopDurationSeconds <= 0.001f) return;

	// Micro-freeze attacker
	OriginalCustomTimeDilation = OwnerCharacter->CustomTimeDilation;
	OwnerCharacter->CustomTimeDilation = VisualCfg.CustomTimeDilation;

	// Micro-freeze victim
	if (TargetActor && TargetActor->GetClass()->ImplementsInterface(UDasiCombatInterface::StaticClass()))
	{
		IDasiCombatInterface::Execute_ApplyHitStop(TargetActor, VisualCfg.HitStopDurationSeconds, VisualCfg.CustomTimeDilation);
	}

	// Schedule time-dilation restoration on attacker
	UWorld* World = GetWorld();
	if (World)
	{
		World->GetTimerManager().ClearTimer(HitStopRestoreTimerHandle);
		World->GetTimerManager().SetTimer(
			HitStopRestoreTimerHandle,
			this,
			&UDasiCombatComponent::ResetAttackerTimeDilation,
			VisualCfg.HitStopDurationSeconds,
			false
		);
	}

	// Trigger camera impact shake
	if (APlayerController* PC = Cast<APlayerController>(OwnerCharacter->GetController()))
	{
		TSubclassOf<UCameraShakeBase> ShakeClass = (DamageType == EDasiDamageType::Excellent || DamageType == EDasiDamageType::IgnoreDefense)
			? HeavyImpactCameraShake
			: DefaultImpactCameraShake;

		if (ShakeClass)
		{
			PC->ClientStartCameraShake(ShakeClass, VisualCfg.CameraShakeAmplitude);
		}
	}

	OnHitStopTriggered.Broadcast(DamageType, VisualCfg.HitStopDurationSeconds);
}

void UDasiCombatComponent::ResetAttackerTimeDilation()
{
	if (OwnerCharacter)
	{
		OwnerCharacter->CustomTimeDilation = 1.0f;
	}
}

// ------------------------------------------------------------------------------------------------
// STAGGER & KNOCKBACK PHYSICS
// ------------------------------------------------------------------------------------------------

void UDasiCombatComponent::ApplyStaggerAndKnockback(AActor* TargetActor, const FVector& ImpactDirection, float KnockbackMagnitude)
{
	if (!TargetActor) return;

	if (ACharacter* TargetChar = Cast<ACharacter>(TargetActor))
	{
		FVector LaunchVelocity = ImpactDirection.GetSafeNormal2D() * KnockbackMagnitude + FVector(0.0f, 0.0f, 180.0f);
		TargetChar->LaunchCharacter(LaunchVelocity, true, true);
	}
}

// ------------------------------------------------------------------------------------------------
// ATTACK & COMBO CHAINING
// ------------------------------------------------------------------------------------------------

bool UDasiCombatComponent::RequestAttackTarget(AActor* TargetActor)
{
	if (!OwnerCharacter) return false;

	UAnimInstance* AnimInst = OwnerCharacter->GetMesh()->GetAnimInstance();
	if (!AnimInst) return false;

	// If currently in recovery window, chain next combo step
	if (bIsInComboRecoveryWindow || !AnimInst->IsAnyMontagePlaying())
	{
		int32 MontageIdx = (CurrentComboStep - 1) % FMath::Max(1, ComboMontages.Num());
		if (ComboMontages.IsValidIndex(MontageIdx) && ComboMontages[MontageIdx])
		{
			UAnimMontage* Montage = ComboMontages[MontageIdx];
			float PlayRate = OwnerCharacter->CalculateMontagePlayRate(Montage, OwnerCharacter->Agility, CurrentComboStep);

			AnimInst->Montage_Play(Montage, PlayRate);

			// Cycle combo step: 1 -> 2 -> 3 -> 1
			CurrentComboStep = (CurrentComboStep % 3) + 1;
			bHasBufferedNextAttack = false;
			bIsInComboRecoveryWindow = false;
			return true;
		}
	}
	else
	{
		// Buffer attack input for seamless transition
		bHasBufferedNextAttack = true;
		return true;
	}

	return false;
}

bool UDasiCombatComponent::ExecuteSkillAttack(FName SkillName, const FVector& TargetLocation)
{
	if (!OwnerCharacter) return false;

	if (UAnimMontage** MontagePtr = SkillMontages.Find(SkillName))
	{
		if (UAnimMontage* Montage = *MontagePtr)
		{
			UAnimInstance* AnimInst = OwnerCharacter->GetMesh()->GetAnimInstance();
			if (AnimInst)
			{
				float PlayRate = OwnerCharacter->CalculateMontagePlayRate(Montage, OwnerCharacter->Agility, 1);
				AnimInst->Montage_Play(Montage, PlayRate);
				return true;
			}
		}
	}

	return false;
}

void UDasiCombatComponent::CancelAttack()
{
	EndWeaponTrace();
	ResetAttackerTimeDilation();
	bHasBufferedNextAttack = false;
	bIsInComboRecoveryWindow = false;

	if (OwnerCharacter && OwnerCharacter->GetMesh())
	{
		if (UAnimInstance* AnimInst = OwnerCharacter->GetMesh()->GetAnimInstance())
		{
			AnimInst->Montage_Stop(0.15f);
		}
	}
}

// ------------------------------------------------------------------------------------------------
// ANIMATION NOTIFY HOOKS
// ------------------------------------------------------------------------------------------------

void UDasiCombatComponent::OnAnimNotify_TraceBegin(FName AttackProfile)
{
	BeginWeaponTrace(AttackProfile);
}

void UDasiCombatComponent::OnAnimNotify_TraceEnd()
{
	EndWeaponTrace();
}

void UDasiCombatComponent::OnAnimNotify_ComboWindowOpen()
{
	bIsInComboRecoveryWindow = true;
	if (bHasBufferedNextAttack)
	{
		RequestAttackTarget(nullptr);
	}
}

void UDasiCombatComponent::OnAnimNotify_ComboWindowClose()
{
	bIsInComboRecoveryWindow = false;
	bHasBufferedNextAttack = false;
}

