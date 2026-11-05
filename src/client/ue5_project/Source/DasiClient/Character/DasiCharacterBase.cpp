#include "Character/DasiCharacterBase.h"
#include "Combat/DasiCombatComponent.h"
#include "Inventory/DasiInventoryComponent.h"
#include "GameFramework/SpringArmComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Camera/CameraComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/CapsuleComponent.h"
#include "Kismet/KismetMathLibrary.h"
#include "DasiClient.h"

ADasiCharacterBase::ADasiCharacterBase()
{
	PrimaryActorTick.bCanEverTick = true;

	// Capsule configuration
	GetCapsuleComponent()->InitCapsuleSize(42.0f, 96.0f);
	GetCapsuleComponent()->SetCollisionResponseToChannel(ECC_Camera, ECR_Ignore);

	// Character movement setup for classic responsive Continent of Legend control
	bUseControllerRotationPitch = false;
	bUseControllerRotationYaw = false;
	bUseControllerRotationRoll = false;

	UCharacterMovementComponent* MoveComp = GetCharacterMovement();
	MoveComp->bOrientRotationToMovement = true;
	MoveComp->RotationRate = FRotator(0.0f, 720.0f, 0.0f);
	MoveComp->bConstrainToPlane = true;
	MoveComp->bSnapToPlaneAtStart = true;
	MoveComp->MaxWalkSpeed = 600.0f;
	MoveComp->BrakingDecelerationWalking = 2000.0f;
	MoveComp->GroundFriction = 8.0f;

	// Master body mesh (inherited)
	GetMesh()->SetRelativeLocation(FVector(0.0f, 0.0f, -96.0f));
	GetMesh()->SetRelativeRotation(FRotator(0.0f, -90.0f, 0.0f));

	// --- Modular Armor Components ---
	HeadMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("HeadMesh"));
	HeadMesh->SetupAttachment(GetMesh());

	ChestMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("ChestMesh"));
	ChestMesh->SetupAttachment(GetMesh());

	LegsMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("LegsMesh"));
	LegsMesh->SetupAttachment(GetMesh());

	GlovesMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("GlovesMesh"));
	GlovesMesh->SetupAttachment(GetMesh());

	BootsMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("BootsMesh"));
	BootsMesh->SetupAttachment(GetMesh());

	WingsMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("WingsMesh"));
	WingsMesh->SetupAttachment(GetMesh(), SpineWingSocketName);

	// --- Weapon Components ---
	RightWeaponMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("RightWeaponMesh"));
	RightWeaponMesh->SetupAttachment(GetMesh(), RightWeaponSocketName);

	LeftWeaponMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("LeftWeaponMesh"));
	LeftWeaponMesh->SetupAttachment(GetMesh(), LeftWeaponSocketName);

	// --- Isometric Camera & SpringArm ---
	CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
	CameraBoom->SetupAttachment(RootComponent);
	CameraBoom->SetUsingAbsoluteRotation(true); // Retain fixed isometric angle regardless of pawn yaw
	CameraBoom->TargetArmLength = 1500.0f;
	CameraBoom->SetRelativeRotation(FRotator(-50.0f, 45.0f, 0.0f)); // Classic -50° Pitch, 45° Yaw
	CameraBoom->bDoCollisionTest = true;
	CameraBoom->bInheritPitch = false;
	CameraBoom->bInheritYaw = false;
	CameraBoom->bInheritRoll = false;
	CameraBoom->bEnableCameraLag = true;
	CameraBoom->CameraLagSpeed = 15.0f;

	TopDownCameraComponent = CreateDefaultSubobject<UCameraComponent>(TEXT("TopDownCameraComponent"));
	TopDownCameraComponent->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
	TopDownCameraComponent->bUsePawnControlRotation = false;

	// --- Combat Component ---
	CombatComponent = CreateDefaultSubobject<UDasiCombatComponent>(TEXT("CombatComponent"));

	// --- Inventory Component ---
	InventoryComponent = CreateDefaultSubobject<UDasiInventoryComponent>(TEXT("InventoryComponent"));

	// Gameplay defaults
	Agility = 150;
	BaseWeaponSpeedModifier = 1.0f;
	MaxHealth = 1000.0f;
	CurrentHealth = 1000.0f;
	MaxPoise = 100.0f;
	CurrentPoise = 100.0f;
	PoiseRecoveryRate = 25.0f;
	WingTier = EDasiWingTier::Tier2_Celestial;
}

void ADasiCharacterBase::PostInitializeComponents()
{
	Super::PostInitializeComponents();

	// Bind modular armor meshes to leader body pose component (UE5 modern API)
	if (USkeletalMeshComponent* Leader = GetMesh())
	{
		if (HeadMesh) HeadMesh->SetLeaderPoseComponent(Leader);
		if (ChestMesh) ChestMesh->SetLeaderPoseComponent(Leader);
		if (LegsMesh) LegsMesh->SetLeaderPoseComponent(Leader);
		if (GlovesMesh) GlovesMesh->SetLeaderPoseComponent(Leader);
		if (BootsMesh) BootsMesh->SetLeaderPoseComponent(Leader);
	}
}

void ADasiCharacterBase::BeginPlay()
{
	Super::BeginPlay();

	MeshOriginalRelativeLocation = GetMesh()->GetRelativeLocation();
	PreviousYaw = GetActorRotation().Yaw;

	// Register weapon meshes with combat component for volumetric tracing
	if (CombatComponent)
	{
		CombatComponent->InitializeWeaponTraces(RightWeaponMesh, LeftWeaponMesh);
	}
}

void ADasiCharacterBase::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	UpdateWingAerodynamics(DeltaTime);
	UpdateHitStopMeshJitter(DeltaTime);
	UpdatePoiseRecovery(DeltaTime);
}

void ADasiCharacterBase::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
	Super::SetupPlayerInputComponent(PlayerInputComponent);
}

// ------------------------------------------------------------------------------------------------
// AGILITY 3-PHASE ANIMATION SCALING (ELIMINATING THE LEGACY AGILITY BUG)
// ------------------------------------------------------------------------------------------------

FDasiAttackPhaseTiming ADasiCharacterBase::CalculateAgilityAttackTiming(int32 AgilityValue, float WeaponSpeedMod, int32 ComboStep) const
{
	const float SafeAgi = FMath::Max(10.0f, (float)AgilityValue);
	const float SpeedMod = FMath::Clamp(WeaponSpeedMod, 0.5f, 2.0f);

	// Constants calibrated from Dasi engineering specification
	const float BaseWindup = 0.350f;
	const float MinWindup = 0.080f;
	const float KWindup = 0.0018f;

	const float BaseActive = 0.180f;
	const float MinActive = 0.065f; // Strictly incompressibility floor
	const float KActive = 0.0009f;

	const float BaseRecovery = 0.420f;
	const float MinRecovery = 0.060f;
	const float KRecovery = 0.0022f;

	// Exponential decay toward anatomical boundaries
	float Windup = (MinWindup + (BaseWindup - MinWindup) * FMath::Exp(-KWindup * SafeAgi)) / SpeedMod;

	// Active strike window decays at half rate to preserve collision sweep integrity
	float Active = (MinActive + (BaseActive - MinActive) * FMath::Exp(-KActive * SafeAgi)) / SpeedMod;
	Active = FMath::Max(MinActive, Active);

	// Recovery decay
	float Recovery = (MinRecovery + (BaseRecovery - MinRecovery) * FMath::Exp(-KRecovery * SafeAgi)) / SpeedMod;

	// Momentum chaining reduction for combo steps 2 and 3
	if (ComboStep == 2)
	{
		Windup = FMath::Max(MinWindup, Windup * 0.75f); // 25% momentum reduction
	}
	else if (ComboStep >= 3)
	{
		Windup = FMath::Max(MinWindup, Windup * 0.65f); // 35% momentum reduction
	}

	const float TotalDuration = Windup + Active + Recovery;
	const float ComboWindowStart = FMath::Max(0.20f, 0.60f - (SafeAgi / 4000.0f) * 0.40f);
	const float AttacksPerSecond = 1.0f / FMath::Max(0.001f, TotalDuration);
	const bool bHasGhosting = SafeAgi >= 1200.0f;

	FDasiAttackPhaseTiming Timing;
	Timing.WindupTime = Windup;
	Timing.ActiveStrikeTime = Active;
	Timing.RecoveryTime = Recovery;
	Timing.TotalDuration = TotalDuration;
	Timing.ComboWindowStart = ComboWindowStart;
	Timing.AttacksPerSecond = AttacksPerSecond;
	Timing.bHasAfterImages = bHasGhosting;

	return Timing;
}

float ADasiCharacterBase::CalculateMontagePlayRate(UAnimMontage* Montage, int32 AgilityValue, int32 ComboStep) const
{
	if (!Montage) return 1.0f;

	const float BaseAnimLength = Montage->GetPlayLength();
	if (BaseAnimLength <= 0.01f) return 1.0f;

	FDasiAttackPhaseTiming Timing = CalculateAgilityAttackTiming(AgilityValue, BaseWeaponSpeedModifier, ComboStep);

	// Scaled play rate matches target physical phase duration without skipping notifies
	float DesiredRate = BaseAnimLength / FMath::Max(0.05f, Timing.TotalDuration);
	return FMath::Clamp(DesiredRate, 0.5f, 5.0f);
}

// ------------------------------------------------------------------------------------------------
// WING AERODYNAMICS SIMULATION (TIERS 1, 2, 3)
// ------------------------------------------------------------------------------------------------

void ADasiCharacterBase::UpdateWingAerodynamics(float DeltaTime)
{
	if (WingTier == EDasiWingTier::None || DeltaTime <= 0.0001f)
	{
		CurrentWingPhysics = FDasiWingPhysicsState();
		GetCharacterMovement()->GravityScale = 1.0f;
		return;
	}

	const FVector Velocity = GetVelocity();
	const float HorizontalSpeed = Velocity.Size2D(); // cm / s
	const float HorizSpeedMeters = HorizontalSpeed / 100.0f; // m / s

	// Calculate yaw angular turn rate (deg / s)
	const float CurrentYaw = GetActorRotation().Yaw;
	const float DeltaYaw = FMath::FindDeltaAngleDegrees(PreviousYaw, CurrentYaw);
	YawAngularVelocityDegPerSec = DeltaYaw / DeltaTime;
	PreviousYaw = CurrentYaw;

	// Aerodynamic parameters per Tier
	float MinSpan = 1.8f;
	float MaxSpan = 2.4f;
	float IdleFlap = 0.8f;
	float MaxFlap = 2.4f;
	float LiftCoeff = 0.45f;
	float MaxBankAngle = 14.0f;

	if (WingTier == EDasiWingTier::Tier2_Celestial)
	{
		MinSpan = 2.8f;
		MaxSpan = 3.8f;
		IdleFlap = 1.2f;
		MaxFlap = 3.2f;
		LiftCoeff = 0.85f;
		MaxBankAngle = 28.0f;
	}
	else if (WingTier == EDasiWingTier::Tier3_Sovereign)
	{
		MinSpan = 4.2f;
		MaxSpan = 6.0f;
		IdleFlap = 1.6f;
		MaxFlap = 4.0f;
		LiftCoeff = 1.40f;
		MaxBankAngle = 48.0f;
	}

	// Dynamic wingspan & flapping frequency expansion based on horizontal speed
	const float SpeedRatio = FMath::Clamp(HorizSpeedMeters / 8.0f, 0.0f, 1.0f);
	const float Wingspan = FMath::Lerp(MinSpan, MaxSpan, SpeedRatio);
	const float FlapFrequency = FMath::Lerp(IdleFlap, MaxFlap, SpeedRatio);

	// Aerodynamic lift equation: L = 0.5 * rho * v^2 * S * Cl
	const float AirDensity = 1.225f; // kg / m^3
	const float WingArea = FMath::Square(Wingspan * 0.5f) * UE_PI * 0.6f;
	float LiftNewtons = 0.5f * AirDensity * FMath::Square(HorizSpeedMeters) * WingArea * LiftCoeff;

	// Ground Effect amplification when near ground (h < 2.5m)
	FHitResult GroundHit;
	FVector TraceStart = GetActorLocation();
	FVector TraceEnd = TraceStart - FVector(0.0f, 0.0f, 500.0f);
	FCollisionQueryParams QueryParams;
	QueryParams.AddIgnoredActor(this);

	if (GetWorld()->LineTraceSingleByChannel(GroundHit, TraceStart, TraceEnd, ECC_Visibility, QueryParams))
	{
		const float AltitudeMeters = GroundHit.Distance / 100.0f;
		if (AltitudeMeters > 0.1f && AltitudeMeters < Wingspan * 1.5f)
		{
			const float GroundEffectMultiplier = FMath::Min(1.8f, 1.0f + 0.35f / ((AltitudeMeters / Wingspan) + 0.2f));
			LiftNewtons *= GroundEffectMultiplier;
		}
	}

	// Banking roll angle in turns: theta = atan(omega * v / g)
	float BankingAngle = 0.0f;
	if (HorizSpeedMeters > 0.5f && FMath::Abs(YawAngularVelocityDegPerSec) > 0.1f)
	{
		const float TurnRadSec = FMath::DegreesToRadians(YawAngularVelocityDegPerSec);
		const float RawBank = FMath::RadiansToDegrees(FMath::Atan((TurnRadSec * HorizSpeedMeters) / 9.81f));
		BankingAngle = FMath::Clamp(RawBank, -MaxBankAngle, MaxBankAngle);
	}

	// Gravity reduction factor (80kg character equivalent ~ 784N)
	const float CharacterWeightNewtons = 80.0f * 9.81f;
	const float GravityReduction = FMath::Clamp(LiftNewtons / CharacterWeightNewtons, 0.0f, 0.85f);

	CurrentWingPhysics.WingspanMeters = Wingspan;
	CurrentWingPhysics.FlapFrequencyHz = FlapFrequency;
	CurrentWingPhysics.LiftForceNewtons = LiftNewtons;
	CurrentWingPhysics.BankingAngleDegrees = BankingAngle;
	CurrentWingPhysics.GravityReductionFactor = GravityReduction;

	// Apply gravity reduction to CharacterMovementComponent if airborne
	if (GetCharacterMovement()->IsFalling())
	{
		GetCharacterMovement()->GravityScale = FMath::Clamp(1.0f - GravityReduction, 0.20f, 1.0f);
	}
	else
	{
		GetCharacterMovement()->GravityScale = 1.0f;
	}
}

// ------------------------------------------------------------------------------------------------
// HIT-STOP PROCEDURAL MICRO-JITTER & REACTION
// ------------------------------------------------------------------------------------------------

void ADasiCharacterBase::ApplyHitStop_Implementation(float DurationSeconds, float CustomDilation)
{
	if (DurationSeconds <= 0.001f) return;

	CustomTimeDilation = CustomDilation;

	// Enable micro-jitter vibration on mesh
	bIsMeshJitterActive = true;
	MeshJitterTimeRemaining = DurationSeconds;
	MeshJitterAmplitude = 1.2f;

	// Clear previous timer if any
	GetWorld()->GetTimerManager().ClearTimer(HitStopTimerHandle);

	GetWorld()->GetTimerManager().SetTimer(
		HitStopTimerHandle,
		[this]()
		{
			CustomTimeDilation = 1.0f;
			bIsMeshJitterActive = false;
			GetMesh()->SetRelativeLocation(MeshOriginalRelativeLocation);
		},
		DurationSeconds,
		false
	);
}

void ADasiCharacterBase::UpdateHitStopMeshJitter(float DeltaTime)
{
	if (!bIsMeshJitterActive || !GetMesh()) return;

	MeshJitterTimeRemaining -= DeltaTime;
	if (MeshJitterTimeRemaining <= 0.0f)
	{
		bIsMeshJitterActive = false;
		GetMesh()->SetRelativeLocation(MeshOriginalRelativeLocation);
		return;
	}

	// High frequency procedural jitter along strike plane
	const float JitterFrequency = 60.0f;
	const float OffsetX = FMath::Sin(GetWorld()->GetTimeSeconds() * JitterFrequency) * MeshJitterAmplitude;
	const float OffsetY = FMath::Cos(GetWorld()->GetTimeSeconds() * JitterFrequency) * (MeshJitterAmplitude * 0.5f);

	GetMesh()->SetRelativeLocation(MeshOriginalRelativeLocation + FVector(OffsetX, OffsetY, 0.0f));
}

void ADasiCharacterBase::UpdatePoiseRecovery(float DeltaTime)
{
	if (CurrentPoise < MaxPoise)
	{
		CurrentPoise = FMath::Min(MaxPoise, CurrentPoise + PoiseRecoveryRate * DeltaTime);
	}
}

// ------------------------------------------------------------------------------------------------
// DAMAGE & STAGGER HANDLING
// ------------------------------------------------------------------------------------------------

void ADasiCharacterBase::TakeDasiDamage_Implementation(
	AActor* Attacker,
	float DamageAmount,
	EDasiDamageType DamageType,
	const FVector& HitLocation,
	const FVector& KnockbackVelocity,
	float StaggerDuration
)
{
	CurrentHealth = FMath::Max(0.0f, CurrentHealth - DamageAmount);

	// Poise damage calculation
	const float PoiseDamage = DamageAmount * 0.25f;
	CurrentPoise = FMath::Max(0.0f, CurrentPoise - PoiseDamage);

	// Apply physical Knockback launch
	if (!KnockbackVelocity.IsNearlyZero())
	{
		LaunchCharacter(KnockbackVelocity, true, true);
	}

	// Trigger hit reaction animation montage
	UAnimInstance* AnimInst = GetMesh()->GetAnimInstance();
	if (AnimInst)
	{
		if (CurrentPoise <= 0.0f && HeavyStaggerMontage)
		{
			AnimInst->Montage_Play(HeavyStaggerMontage, 1.0f);
			CurrentPoise = 0.0f; // Posture broken
		}
		else if (LightHitReactionMontage && !AnimInst->Montage_IsPlaying(HeavyStaggerMontage))
		{
			AnimInst->Montage_Play(LightHitReactionMontage, 1.2f);
		}
	}

	// Trigger Hit-Stop
	FDasiDamageVisualConfig VisualCfg = FDasiCombatHelper::GetVisualConfig(DamageType);
	ApplyHitStop_Implementation(VisualCfg.HitStopDurationSeconds, VisualCfg.CustomTimeDilation);

	UE_LOG(LogDasiCombat, Log, TEXT("%s took %f [%s] damage from %s. HP remaining: %f"),
		*GetName(), DamageAmount, *VisualCfg.ColorHex, Attacker ? *Attacker->GetName() : TEXT("None"), CurrentHealth);
}

float ADasiCharacterBase::GetPoisePercent_Implementation() const
{
	return MaxPoise > 0.0f ? CurrentPoise / MaxPoise : 0.0f;
}

bool ADasiCharacterBase::IsAlive_Implementation() const
{
	return CurrentHealth > 0.0f;
}

FVector ADasiCharacterBase::GetCombatHurtboxLocation_Implementation() const
{
	return GetActorLocation() + FVector(0.0f, 0.0f, 40.0f);
}

FString ADasiCharacterBase::GetEntityId_Implementation() const
{
	return ServerEntityId;
}

// ------------------------------------------------------------------------------------------------
// MODULAR EQUIPMENT SETTERS
// ------------------------------------------------------------------------------------------------

void ADasiCharacterBase::SetArmorPiece(EItemEquipmentSlot Slot, USkeletalMesh* NewMesh)
{
	USkeletalMeshComponent* TargetComp = nullptr;
	switch (Slot)
	{
	case EItemEquipmentSlot::Helm:   TargetComp = HeadMesh; break;
	case EItemEquipmentSlot::Armor:  TargetComp = ChestMesh; break;
	case EItemEquipmentSlot::Pants:  TargetComp = LegsMesh; break;
	case EItemEquipmentSlot::Gloves: TargetComp = GlovesMesh; break;
	case EItemEquipmentSlot::Boots:  TargetComp = BootsMesh; break;
	case EItemEquipmentSlot::Wings:  TargetComp = WingsMesh; break;
	}

	if (TargetComp)
	{
		TargetComp->SetSkeletalMesh(NewMesh);
		if (Slot != EItemEquipmentSlot::Wings && GetMesh())
		{
			TargetComp->SetLeaderPoseComponent(GetMesh());
		}
	}
}

void ADasiCharacterBase::SetEquippedWeapon(bool bIsRightHand, USkeletalMesh* NewWeaponMesh)
{
	USkeletalMeshComponent* WeaponComp = bIsRightHand ? RightWeaponMesh : LeftWeaponMesh;
	if (WeaponComp)
	{
		WeaponComp->SetSkeletalMesh(NewWeaponMesh);
	}
}

void ADasiCharacterBase::EquipWings(EDasiWingTier NewTier, USkeletalMesh* NewWingMesh)
{
	WingTier = NewTier;
	if (WingsMesh)
	{
		WingsMesh->SetSkeletalMesh(NewWingMesh);
	}
}
