#include "Combat/DasiDamageNumberSubsystem.h"
#include "Components/TextRenderComponent.h"
#include "NiagaraFunctionLibrary.h"
#include "NiagaraComponent.h"
#include "Kismet/GameplayStatics.h"
#include "Camera/PlayerCameraManager.h"
#include "DasiClient.h"

// ================================================================================================
// ADasiDamageNumberActor Implementation
// ================================================================================================

ADasiDamageNumberActor::ADasiDamageNumberActor()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.TickGroup = TG_PostUpdateWork;

	TextRenderComponent = CreateDefaultSubobject<UTextRenderComponent>(TEXT("TextRenderComponent"));
	RootComponent = TextRenderComponent;

	TextRenderComponent->SetHorizontalAlignment(EHTA_Center);
	TextRenderComponent->SetVerticalAlignment(EVRTA_TextCenter);
	TextRenderComponent->SetWorldSize(38.0f);
	TextRenderComponent->SetTextRenderColor(FColor::White);
	TextRenderComponent->SetCollisionProfileName(UCollisionProfile::NoCollision_ProfileName);
	TextRenderComponent->SetGenerateOverlapEvents(false);
	TextRenderComponent->SetCastShadow(false);

	SetActorEnableCollision(false);
	SetActorHiddenInGame(true);
}

void ADasiDamageNumberActor::ActivateDamageNumber(
	float DamageAmount,
	EDasiDamageType DamageType,
	const FVector& SpawnLocation,
	float Duration
)
{
	InitialLocation = SpawnLocation;
	SetActorLocation(SpawnLocation);
	SetActorHiddenInGame(false);
	bIsActive = true;
	Age = 0.0f;
	TotalLifetime = FMath::Max(0.4f, Duration);

	FDasiDamageVisualConfig VisualCfg = FDasiCombatHelper::GetVisualConfig(DamageType);
	TextColor = VisualCfg.LinearColor;
	BaseScaleMultiplier = VisualCfg.NumberScaleMultiplier;

	if (DamageType == EDasiDamageType::Miss)
	{
		TextRenderComponent->SetText(FText::FromString(TEXT("MISS")));
	}
	else
	{
		TextRenderComponent->SetText(FText::AsNumber(FMath::RoundToInt(DamageAmount)));
	}

	TextRenderComponent->SetTextRenderColor(TextColor.ToFColor(true));

	// Parabolic arc dispersion: upward impulse + random lateral spread
	const float RandomAngle = FMath::FRandRange(0.0f, 2.0f * UE_PI);
	const float SpreadSpeed = FMath::FRandRange(40.0f, 95.0f);
	const float UpwardImpulse = FMath::FRandRange(240.0f, 320.0f);

	CurrentVelocity = FVector(
		FMath::Cos(RandomAngle) * SpreadSpeed,
		FMath::Sin(RandomAngle) * SpreadSpeed,
		UpwardImpulse
	);

	// Start scale with impact pop
	SetActorScale3D(FVector(BaseScaleMultiplier * 1.8f));
}

void ADasiDamageNumberActor::Deactivate()
{
	bIsActive = false;
	SetActorHiddenInGame(true);
}

void ADasiDamageNumberActor::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	if (!bIsActive) return;

	Age += DeltaTime;
	const float Progress = FMath::Clamp(Age / TotalLifetime, 0.0f, 1.0f);

	if (Progress >= 1.0f)
	{
		Deactivate();
		return;
	}

	// 1. Billboarding: Orient text to face the active isometric camera
	if (APlayerCameraManager* CamManager = UGameplayStatics::GetPlayerCameraManager(GetWorld(), 0))
	{
		FRotator CamRot = CamManager->GetCameraRotation();
		// Invert Yaw so text faces camera lens
		SetActorRotation(FRotator(CamRot.Pitch, CamRot.Yaw + 180.0f, 0.0f));
	}

	// 2. Physics arc integration
	CurrentVelocity.Z -= 260.0f * DeltaTime; // Gravity
	CurrentVelocity.X *= FMath::Exp(-2.2f * DeltaTime); // Air resistance
	CurrentVelocity.Y *= FMath::Exp(-2.2f * DeltaTime);

	AddActorWorldOffset(CurrentVelocity * DeltaTime);

	// 3. Elastic impact pop and fade scale curve
	float CurrentScale = BaseScaleMultiplier;
	if (Progress < 0.15f)
	{
		// Initial explosive pop settling into place
		const float PopFactor = 1.0f - (Progress / 0.15f);
		CurrentScale = BaseScaleMultiplier * (1.0f + 0.85f * PopFactor);
	}
	else if (Progress > 0.70f)
	{
		// Smooth exit decay
		const float FadeFactor = 1.0f - ((Progress - 0.70f) / 0.30f);
		CurrentScale = BaseScaleMultiplier * FadeFactor;

		// Fade alpha color
		FLinearColor FadedColor = TextColor;
		FadedColor.A = FadeFactor;
		TextRenderComponent->SetTextRenderColor(FadedColor.ToFColor(true));
	}

	SetActorScale3D(FVector(CurrentScale));
}

// ================================================================================================
// UDasiDamageNumberSubsystem Implementation
// ================================================================================================

UDasiDamageNumberSubsystem::UDasiDamageNumberSubsystem()
{
}

void UDasiDamageNumberSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);

	UWorld* World = GetWorld();
	if (!World) return;

	// Pre-populate pool to eliminate runtime spikes
	FActorSpawnParameters SpawnParams;
	SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;

	for (int32 i = 0; i < InitialPoolSize; ++i)
	{
		ADasiDamageNumberActor* PooledActor = World->SpawnActor<ADasiDamageNumberActor>(
			ADasiDamageNumberActor::StaticClass(),
			FVector::ZeroVector,
			FRotator::ZeroRotator,
			SpawnParams
		);

		if (PooledActor)
		{
			PooledActor->Deactivate();
			InactivePool.Add(PooledActor);
		}
	}

	UE_LOG(LogDasiCombat, Log, TEXT("DasiDamageNumberSubsystem initialized with %d pre-pooled text actors"), InitialPoolSize);
}

void UDasiDamageNumberSubsystem::Deinitialize()
{
	for (ADasiDamageNumberActor* Actor : ActivePool)
	{
		if (Actor && Actor->IsValidLowLevel())
		{
			Actor->Destroy();
		}
	}
	ActivePool.Empty();

	for (ADasiDamageNumberActor* Actor : InactivePool)
	{
		if (Actor && Actor->IsValidLowLevel())
		{
			Actor->Destroy();
		}
	}
	InactivePool.Empty();

	Super::Deinitialize();
}

void UDasiDamageNumberSubsystem::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	// Reclaim completed actors back to inactive pool
	for (int32 i = ActivePool.Num() - 1; i >= 0; --i)
	{
		ADasiDamageNumberActor* Actor = ActivePool[i];
		if (!Actor || !Actor->IsActive())
		{
			ActivePool.RemoveAtSwap(i);
			ReturnToPool(Actor);
		}
	}
}

TStatId UDasiDamageNumberSubsystem::GetStatId() const
{
	RETURN_QUICK_DECLARE_CYCLE_STAT(UDasiDamageNumberSubsystem, STATGROUP_Tickables);
}

ADasiDamageNumberActor* UDasiDamageNumberSubsystem::AcquireDamageNumberFromPool()
{
	if (InactivePool.Num() > 0)
	{
		return InactivePool.Pop();
	}

	// Expand pool if within threshold
	UWorld* World = GetWorld();
	if (World && (ActivePool.Num() + InactivePool.Num()) < MaxPoolCapacity)
	{
		FActorSpawnParameters SpawnParams;
		SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;

		ADasiDamageNumberActor* NewActor = World->SpawnActor<ADasiDamageNumberActor>(
			ADasiDamageNumberActor::StaticClass(),
			FVector::ZeroVector,
			FRotator::ZeroRotator,
			SpawnParams
		);
		return NewActor;
	}

	// Reuse oldest active actor if pool completely exhausted
	if (ActivePool.Num() > 0)
	{
		ADasiDamageNumberActor* OldestActor = ActivePool[0];
		ActivePool.RemoveAt(0);
		return OldestActor;
	}

	return nullptr;
}

void UDasiDamageNumberSubsystem::ReturnToPool(ADasiDamageNumberActor* Actor)
{
	if (Actor && InactivePool.Num() < MaxPoolCapacity)
	{
		Actor->Deactivate();
		InactivePool.Add(Actor);
	}
}

void UDasiDamageNumberSubsystem::SpawnDamageNumber(
	float DamageAmount,
	EDasiDamageType DamageType,
	const FVector& WorldLocation,
	bool bIsMiss
)
{
	if (bIsMiss)
	{
		DamageType = EDasiDamageType::Miss;
	}

	ADasiDamageNumberActor* NumberActor = AcquireDamageNumberFromPool();
	if (NumberActor)
	{
		// Add slight vertical elevation so number spawns above head/chest
		const FVector AdjustedLocation = WorldLocation + FVector(0.0f, 0.0f, 60.0f);
		NumberActor->ActivateDamageNumber(DamageAmount, DamageType, AdjustedLocation, 0.95f);
		ActivePool.Add(NumberActor);
	}

	// Spawn associated Niagara VFX & Audio feedback
	SpawnHitNiagaraAndSound(DamageType, WorldLocation);
}

void UDasiDamageNumberSubsystem::SpawnDamageNumberFromNetwork(
	float DamageAmount,
	const FString& DamageTypeString,
	const FVector& WorldLocation,
	bool bIsMiss
)
{
	EDasiDamageType DamageType = FDasiCombatHelper::ParseDamageTypeString(DamageTypeString);
	SpawnDamageNumber(DamageAmount, DamageType, WorldLocation, bIsMiss);
}

void UDasiDamageNumberSubsystem::SpawnDamageNumberFromResult(
	const FDasiCombatAttackResult& Result,
	const FVector& WorldLocation
)
{
	EDasiDamageType DamageType = FDasiCombatHelper::ParseDamageTypeString(Result.DamageType);
	SpawnDamageNumber((float)Result.Damage, DamageType, WorldLocation, Result.bIsMiss);
}

void UDasiDamageNumberSubsystem::SpawnHitNiagaraAndSound(EDasiDamageType DamageType, const FVector& WorldLocation)
{
	UWorld* World = GetWorld();
	if (!World) return;

	UNiagaraSystem* TargetNiagara = nullptr;
	USoundBase* TargetSound = nullptr;

	switch (DamageType)
	{
	case EDasiDamageType::Normal:
		TargetNiagara = NormalHitNiagara;
		break;
	case EDasiDamageType::Skill:
		TargetNiagara = SkillHitNiagara;
		break;
	case EDasiDamageType::Critical:
		TargetNiagara = CriticalHitNiagara;
		TargetSound = CriticalSoundCue;
		break;
	case EDasiDamageType::Excellent:
		TargetNiagara = ExcellentHitNiagara;
		TargetSound = ExcellentSoundCue;
		break;
	case EDasiDamageType::IgnoreDefense:
		TargetNiagara = IgnoreDefenseHitNiagara;
		TargetSound = IgnoreDefenseSoundCue;
		break;
	case EDasiDamageType::Miss:
	default:
		break;
	}

	if (TargetNiagara)
	{
		UNiagaraFunctionLibrary::SpawnSystemAtLocation(
			World,
			TargetNiagara,
			WorldLocation,
			FRotator::ZeroRotator,
			FVector(1.0f),
			true,
			true,
			ENCPoolMethod::AutoRelease
		);
	}

	if (TargetSound)
	{
		UGameplayStatics::PlaySoundAtLocation(World, TargetSound, WorldLocation, 1.0f, 1.0f);
	}
}
