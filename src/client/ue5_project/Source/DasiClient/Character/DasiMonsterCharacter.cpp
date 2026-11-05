// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "Character/DasiMonsterCharacter.h"
#include "Character/DasiMonsterHpWidget.h"
#include "World/DasiCoordinateConverter.h"
#include "Components/CapsuleComponent.h"
#include "Components/SkeletalMeshComponent.h"
#include "Components/WidgetComponent.h"
#include "GameFramework/CharacterMovementComponent.h"
#include "Kismet/GameplayStatics.h"
#include "Camera/PlayerCameraManager.h"
#include "Materials/MaterialInstanceDynamic.h"
#include "DasiClient.h"

ADasiMonsterCharacter::ADasiMonsterCharacter()
	: InterpSpeed(12.0f)
	, TargetLocation(FVector::ZeroVector)
	, TargetRotation(FRotator::ZeroRotator)
	, VisualState(EDasiMonsterVisualState::Idle)
	, MonsterLevel(1)
	, CurrentHp(100.0f)
	, MaxHp(100.0f)
	, CurrentPoise(100.0f)
	, MaxPoise(100.0f)
	, bIsDead(false)
	, CorpseDecayDelay(4.0f)
	, DissolveDuration(1.5f)
	, WidgetHeightOffset(140.0f)
	, bIsHovered(false)
	, bIsDissolving(false)
	, DissolveTimer(0.0f)
{
	PrimaryActorTick.bCanEverTick = true;

	// Tag do monstro para seleção e combate
	Tags.Add(TEXT("Monster"));

	// Cápsula de colisão 3D
	UCapsuleComponent* Capsule = GetCapsuleComponent();
	Capsule->InitCapsuleSize(55.0f, 90.0f);
	Capsule->SetCollisionObjectType(ECC_Pawn);
	Capsule->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
	Capsule->SetCollisionResponseToAllChannels(ECR_Block);
	Capsule->SetCollisionResponseToChannel(ECC_Camera, ECR_Ignore);
	Capsule->SetCollisionResponseToChannel(ECC_Visibility, ECR_Block);

	// Movimento do monstro (autoritativo, orientado por rede)
	bUseControllerRotationPitch = false;
	bUseControllerRotationYaw = false;
	bUseControllerRotationRoll = false;

	UCharacterMovementComponent* MoveComp = GetCharacterMovement();
	MoveComp->bOrientRotationToMovement = false;
	MoveComp->MaxWalkSpeed = 350.0f;
	MoveComp->bConstrainToPlane = false;

	// Malha esquelética 3D nativa principal
	USkeletalMeshComponent* MainMesh = GetMesh();
	MainMesh->SetRelativeLocation(FVector(0.0f, 0.0f, -90.0f));
	MainMesh->SetRelativeRotation(FRotator(0.0f, -90.0f, 0.0f));
	MainMesh->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
	MainMesh->SetCollisionResponseToChannel(ECC_Camera, ECR_Ignore);
	MainMesh->SetCollisionResponseToChannel(ECC_Visibility, ECR_Block);

	// Malha secundária de armas/acessórios 3D
	AccessoryMesh = CreateDefaultSubobject<USkeletalMeshComponent>(TEXT("AccessoryMesh"));
	AccessoryMesh->SetupAttachment(MainMesh);
	AccessoryMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);

	// Barra de vida flutuante em World Space
	FloatingHpWidgetComponent = CreateDefaultSubobject<UWidgetComponent>(TEXT("FloatingHpWidgetComponent"));
	FloatingHpWidgetComponent->SetupAttachment(RootComponent);
	FloatingHpWidgetComponent->SetRelativeLocation(FVector(0.0f, 0.0f, WidgetHeightOffset));
	FloatingHpWidgetComponent->SetWidgetSpace(EWidgetSpace::World);
	FloatingHpWidgetComponent->SetDrawSize(FVector2D(150.0f, 32.0f));
	FloatingHpWidgetComponent->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	FloatingHpWidgetComponent->SetTwoSided(true);

	// Carrega classe padrão do Widget se não especificada
	static ConstructorHelpers::FClassFinder<UUserWidget> WidgetClassFinder(TEXT("/Game/Dasi/UI/WBP_MonsterHpBar"));
	if (WidgetClassFinder.Succeeded())
	{
		FloatingHpWidgetComponent->SetWidgetClass(WidgetClassFinder.Class);
	}
	else
	{
		FloatingHpWidgetComponent->SetWidgetClass(UDasiMonsterHpWidget::StaticClass());
	}
}

void ADasiMonsterCharacter::BeginPlay()
{
	Super::BeginPlay();

	TargetLocation = GetActorLocation();
	TargetRotation = GetActorRotation();

	// Cria instâncias de materiais dinâmicos para suportar Dissolve e Outlines
	USkeletalMeshComponent* MainMesh = GetMesh();
	const int32 NumMaterials = MainMesh->GetNumMaterials();
	for (int32 i = 0; i < NumMaterials; ++i)
	{
		UMaterialInstanceDynamic* DynMat = MainMesh->CreateAndSetMaterialInstanceDynamic(i);
		if (DynMat)
		{
			DynamicMaterials.Add(DynMat);
		}
	}

	if (AccessoryMesh && AccessoryMesh->GetNumMaterials() > 0)
	{
		for (int32 i = 0; i < AccessoryMesh->GetNumMaterials(); ++i)
		{
			UMaterialInstanceDynamic* DynMat = AccessoryMesh->CreateAndSetMaterialInstanceDynamic(i);
			if (DynMat)
			{
				DynamicMaterials.Add(DynMat);
			}
		}
	}

	ApplyArchetypeVisualDefaults();

	// Inicializa widget flutuante de HP
	if (UUserWidget* UserWidget = FloatingHpWidgetComponent->GetUserWidgetObject())
	{
		if (UDasiMonsterHpWidget* HpWidget = Cast<UDasiMonsterHpWidget>(UserWidget))
		{
			HpWidget->SetMonsterMetadata(MonsterName, MonsterLevel, MonsterType);
			HpWidget->SetHealth(CurrentHp, MaxHp, true);
		}
	}
}

void ADasiMonsterCharacter::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	// Fase de dissolução pós-morte
	if (bIsDissolving)
	{
		UpdateCorpseDissolution(DeltaTime);
		return;
	}

	// Se estiver morto e simulando física (Ragdoll), a posição é regida pela física da Unreal
	if (bIsDead)
	{
		return;
	}

	// 1. Interpolação suave de posição no mundo 3D (InterpSpeed = 12.0f)
	const FVector CurrentLoc = GetActorLocation();
	FVector NewLoc = FMath::VInterpTo(CurrentLoc, TargetLocation, DeltaTime, InterpSpeed);

	// Mantém alinhamento com a topografia do terreno de Lorencia
	const float GroundZ = UDasiCoordinateConverter::QueryGroundZ(this, NewLoc.X, NewLoc.Y, NewLoc.Z);
	NewLoc.Z = GroundZ + GetCapsuleComponent()->GetScaledCapsuleHalfHeight();

	// 2. Interpolação suave de rotação
	const FRotator CurrentRot = GetActorRotation();
	const FRotator NewRot = FMath::RInterpTo(CurrentRot, TargetRotation, DeltaTime, InterpSpeed);

	SetActorLocationAndRotation(NewLoc, NewRot);

	// 3. Atualização automática de estados visuais baseada em movimento
	const float HorizontalMoveDist = FVector::Dist2D(CurrentLoc, NewLoc);
	if (VisualState != EDasiMonsterVisualState::Attacking && VisualState != EDasiMonsterVisualState::Staggered)
	{
		if (HorizontalMoveDist > 3.0f * DeltaTime)
		{
			if (VisualState != EDasiMonsterVisualState::Walking)
			{
				SetVisualState(EDasiMonsterVisualState::Walking);
			}
		}
		else
		{
			if (VisualState != EDasiMonsterVisualState::Idle)
			{
				SetVisualState(EDasiMonsterVisualState::Idle);
			}
		}
	}

	// 4. Billboarding da barra de vida para a câmera isométrica
	UpdateBillboardingRotation();
}

void ADasiMonsterCharacter::UpdateBillboardingRotation()
{
	if (!FloatingHpWidgetComponent || !FloatingHpWidgetComponent->IsVisible())
	{
		return;
	}

	APlayerCameraManager* CamManager = UGameplayStatics::GetPlayerCameraManager(this, 0);
	if (CamManager)
	{
		const FRotator CameraRot = CamManager->GetCameraRotation();
		// Alinha a rotação frontal do widget diretamente com o ângulo da câmera isométrica
		FloatingHpWidgetComponent->SetWorldRotation(CameraRot);
	}
}

void ADasiMonsterCharacter::UpdateFromSerialized(const FDasiSerializedMonster& MobData, const FVector& InWorldTargetLocation)
{
	ServerMobId = MobData.Id;
	MonsterType = MobData.Type;
	MonsterName = MobData.Name;
	MonsterLevel = MobData.Level;
	CurrentHp = static_cast<float>(MobData.CurrentHp);
	MaxHp = static_cast<float>(FMath::Max(1, MobData.MaxHp));

	// Se o monstro recebeu ordem de morrer do servidor
	if (MobData.bIsDead && !bIsDead)
	{
		HandleDeath(GetActorLocation(), FVector(0.0f, 0.0f, 150.0f));
		return;
	}

	// Atualiza posição alvo 3D
	TargetLocation = InWorldTargetLocation;

	// Calcula orientação para onde o monstro está caminhando
	const FVector MoveVector = (TargetLocation - GetActorLocation()).GetSafeNormal2D();
	if (!MoveVector.IsNearlyZero())
	{
		TargetRotation = MoveVector.Rotation();
	}

	// Sincroniza barra de vida
	if (UUserWidget* UserWidget = FloatingHpWidgetComponent->GetUserWidgetObject())
	{
		if (UDasiMonsterHpWidget* HpWidget = Cast<UDasiMonsterHpWidget>(UserWidget))
		{
			HpWidget->SetHealth(CurrentHp, MaxHp, false);
		}
	}

	// Interpretação de estados do servidor (IDLE, MOVING, ATTACKING, STAGGERED, DEAD)
	if (MobData.State.Equals(TEXT("ATTACKING"), ESearchCase::IgnoreCase))
	{
		SetVisualState(EDasiMonsterVisualState::Attacking);
	}
	else if (MobData.State.Equals(TEXT("STAGGERED"), ESearchCase::IgnoreCase))
	{
		SetVisualState(EDasiMonsterVisualState::Staggered);
	}
}

void ADasiMonsterCharacter::SetHovered(bool bInHovered)
{
	bIsHovered = bInHovered;

	// Ativa Custom Depth Stencil 250 para contorno (outline) de seleção
	USkeletalMeshComponent* MainMesh = GetMesh();
	MainMesh->SetRenderCustomDepth(bIsHovered);
	MainMesh->SetCustomDepthStencilValue(250);

	if (AccessoryMesh)
	{
		AccessoryMesh->SetRenderCustomDepth(bIsHovered);
		AccessoryMesh->SetCustomDepthStencilValue(250);
	}

	if (UUserWidget* UserWidget = FloatingHpWidgetComponent->GetUserWidgetObject())
	{
		if (UDasiMonsterHpWidget* HpWidget = Cast<UDasiMonsterHpWidget>(UserWidget))
		{
			HpWidget->SetTargetHighlighted(bIsHovered);
		}
	}
}

void ADasiMonsterCharacter::SetVisualState(EDasiMonsterVisualState NewState)
{
	if (VisualState == EDasiMonsterVisualState::Dead && NewState != EDasiMonsterVisualState::Dead)
	{
		return;
	}

	VisualState = NewState;
	UAnimInstance* AnimInst = GetMesh()->GetAnimInstance();

	switch (VisualState)
	{
	case EDasiMonsterVisualState::Idle:
		break;

	case EDasiMonsterVisualState::Walking:
		break;

	case EDasiMonsterVisualState::Attacking:
		if (AnimInst && AttackMontage)
		{
			AnimInst->Montage_Play(AttackMontage, 1.0f);
		}
		break;

	case EDasiMonsterVisualState::Staggered:
		if (AnimInst && StaggerMontage)
		{
			AnimInst->Montage_Play(StaggerMontage, 1.2f);
		}
		// Recupera do stagger após breve intervalo
		GetWorldTimerManager().SetTimer(StaggerRecoveryTimerHandle, [this]()
		{
			if (VisualState == EDasiMonsterVisualState::Staggered)
			{
				SetVisualState(EDasiMonsterVisualState::Idle);
			}
		}, 0.45f, false);
		break;

	case EDasiMonsterVisualState::Dead:
		break;
	}
}

void ADasiMonsterCharacter::TakeDasiDamage_Implementation(
	AActor* Attacker,
	float DamageAmount,
	EDasiDamageType DamageType,
	const FVector& HitLocation,
	const FVector& KnockbackVelocity,
	float StaggerDuration
)
{
	if (bIsDead) return;

	CurrentHp = FMath::Max(0.0f, CurrentHp - DamageAmount);

	// Atualiza Widget de HP
	if (UUserWidget* UserWidget = FloatingHpWidgetComponent->GetUserWidgetObject())
	{
		if (UDasiMonsterHpWidget* HpWidget = Cast<UDasiMonsterHpWidget>(UserWidget))
		{
			HpWidget->SetHealth(CurrentHp, MaxHp, false);
		}
	}

	// Aplica Hit-Stop nativo do Continent of Legend
	const FDasiDamageVisualConfig VisualCfg = FDasiCombatHelper::GetVisualConfig(DamageType);
	ApplyHitStop_Implementation(VisualCfg.HitStopDurationSeconds, VisualCfg.CustomTimeDilation);

	// Morte ou Stagger
	if (CurrentHp <= 0.0f)
	{
		HandleDeath(HitLocation, KnockbackVelocity);
	}
	else if (StaggerDuration > 0.0f)
	{
		SetVisualState(EDasiMonsterVisualState::Staggered);
	}

	UE_LOG(LogDasiCombat, Log, TEXT("[ADasiMonsterCharacter] %s (%s) sofreu %f de dano [%s]. HP restante: %f/%f"),
		*MonsterName, *ServerMobId, DamageAmount, *VisualCfg.ColorHex, CurrentHp, MaxHp);
}

void ADasiMonsterCharacter::ApplyHitStop_Implementation(float DurationSeconds, float CustomDilation)
{
	CustomTimeDilation = CustomDilation;

	GetWorldTimerManager().ClearTimer(HitStopTimerHandle);
	GetWorldTimerManager().SetTimer(
		HitStopTimerHandle,
		this,
		&ADasiMonsterCharacter::EndHitStop,
		FMath::Max(0.01f, DurationSeconds),
		false
	);
}

void ADasiMonsterCharacter::EndHitStop()
{
	CustomTimeDilation = 1.0f;
}

float ADasiMonsterCharacter::GetPoisePercent_Implementation() const
{
	return MaxPoise > 0.0f ? CurrentPoise / MaxPoise : 0.0f;
}

bool ADasiMonsterCharacter::IsAlive_Implementation() const
{
	return !bIsDead && CurrentHp > 0.0f;
}

FVector ADasiMonsterCharacter::GetCombatHurtboxLocation_Implementation() const
{
	return GetActorLocation() + FVector(0.0f, 0.0f, 40.0f);
}

FString ADasiMonsterCharacter::GetEntityId_Implementation() const
{
	return ServerMobId;
}

void ADasiMonsterCharacter::HandleDeath(const FVector& HitLocation, const FVector& KnockbackImpulse)
{
	if (bIsDead) return;

	bIsDead = true;
	SetVisualState(EDasiMonsterVisualState::Dead);

	// Esconde barra de vida flutuante
	if (FloatingHpWidgetComponent)
	{
		FloatingHpWidgetComponent->SetVisibility(false);
	}

	// Desativa colisão da cápsula para evitar que bloqueie personagens
	GetCapsuleComponent()->SetCollisionEnabled(ECollisionEnabled::NoCollision);

	// 100% 3D Ragdoll Físico Nativo
	USkeletalMeshComponent* MainMesh = GetMesh();
	UAnimInstance* AnimInst = MainMesh->GetAnimInstance();

	if (DeathMontage && AnimInst)
	{
		// Se houver animação de morte pré-configurada, executa
		AnimInst->Montage_Play(DeathMontage, 1.0f);
	}
	else
	{
		// Ativa Ragdoll físico com simulação de ossos tridimensional completa
		MainMesh->SetCollisionProfileName(TEXT("Ragdoll"));
		MainMesh->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
		MainMesh->SetSimulatePhysics(true);
		MainMesh->WakeAllRigidBodies();

		// Aplica impulso físico do golpe fatal
		const FVector Impulse = KnockbackImpulse.IsNearlyZero()
			? FVector(0.0f, 0.0f, 250.0f)
			: KnockbackImpulse * 150.0f;
		MainMesh->AddImpulseAtLocation(Impulse, HitLocation);
	}

	// Agenda início da dissolução de carcaça após 4 segundos
	GetWorldTimerManager().SetTimer(
		CorpseDecayTimerHandle,
		this,
		&ADasiMonsterCharacter::StartCorpseDissolution,
		CorpseDecayDelay,
		false
	);

	UE_LOG(LogDasiCombat, Log, TEXT("[ADasiMonsterCharacter] Monstro 3D abatido: %s (%s). Ragdoll iniciado."),
		*MonsterName, *ServerMobId);
}

void ADasiMonsterCharacter::StartCorpseDissolution()
{
	bIsDissolving = true;
	DissolveTimer = 0.0f;

	// Se estiver em ragdoll, desativa simulação de física para afundar suavemente
	USkeletalMeshComponent* MainMesh = GetMesh();
	MainMesh->SetSimulatePhysics(false);
	MainMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
}

void ADasiMonsterCharacter::UpdateCorpseDissolution(float DeltaTime)
{
	DissolveTimer += DeltaTime;
	const float DissolveProgress = FMath::Clamp(DissolveTimer / DissolveDuration, 0.0f, 1.0f);

	// Atualiza parâmetro "Dissolve" no Material Dynamic
	for (UMaterialInstanceDynamic* DynMat : DynamicMaterials)
	{
		if (DynMat)
		{
			DynMat->SetScalarParameterValue(TEXT("Dissolve"), DissolveProgress);
			DynMat->SetScalarParameterValue(TEXT("Opacity"), 1.0f - DissolveProgress);
		}
	}

	// Afundamento suave no solo de Lorencia durante a dissolução
	AddActorWorldOffset(FVector(0.0f, 0.0f, -30.0f * DeltaTime));

	if (DissolveTimer >= DissolveDuration)
	{
		Destroy();
	}
}

void ADasiMonsterCharacter::ApplyArchetypeVisualDefaults()
{
	// Configurações anatômicas padrão em 3D conforme o arquétipo de Lorencia
	if (MonsterType.Equals(TEXT("spider"), ESearchCase::IgnoreCase))
	{
		GetCapsuleComponent()->SetCapsuleSize(45.0f, 35.0f);
		SetActorScale3D(FVector(1.1f, 1.1f, 0.85f));
		WidgetHeightOffset = 60.0f;
	}
	else if (MonsterType.Equals(TEXT("hound"), ESearchCase::IgnoreCase))
	{
		GetCapsuleComponent()->SetCapsuleSize(45.0f, 60.0f);
		SetActorScale3D(FVector(1.0f, 1.0f, 1.0f));
		WidgetHeightOffset = 90.0f;
	}
	else if (MonsterType.Equals(TEXT("bull_fighter"), ESearchCase::IgnoreCase))
	{
		GetCapsuleComponent()->SetCapsuleSize(65.0f, 105.0f);
		SetActorScale3D(FVector(1.35f, 1.35f, 1.35f));
		WidgetHeightOffset = 175.0f;
	}
	else if (MonsterType.Equals(TEXT("skeleton"), ESearchCase::IgnoreCase))
	{
		GetCapsuleComponent()->SetCapsuleSize(45.0f, 92.0f);
		SetActorScale3D(FVector(1.05f, 1.05f, 1.05f));
		WidgetHeightOffset = 135.0f;
	}

	if (FloatingHpWidgetComponent)
	{
		FloatingHpWidgetComponent->SetRelativeLocation(FVector(0.0f, 0.0f, WidgetHeightOffset));
	}
}
