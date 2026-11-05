// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "World/DasiGroundDropActor.h"
#include "Components/StaticMeshComponent.h"
#include "Components/TextRenderComponent.h"
#include "NiagaraComponent.h"
#include "NiagaraFunctionLibrary.h"
#include "Kismet/GameplayStatics.h"
#include "Camera/PlayerCameraManager.h"
#include "UObject/ConstructorHelpers.h"
#include "DasiClient.h"

ADasiGroundDropActor::ADasiGroundDropActor()
	: HoverRotationSpeed(85.0f)
	, BobbingAmplitude(5.0f)
	, BobbingFrequency(2.5f)
	, bIsHovered(false)
	, bHasSettled(false)
	, bIsBeingPickedUp(false)
	, SettleCheckTimer(0.0f)
	, BaseRestingZ(0.0f)
	, HoverTimeElapsed(0.0f)
	, PickupAnimTimer(0.0f)
{
	PrimaryActorTick.bCanEverTick = true;

	// Tag para identificação pelo PlayerController
	Tags.Add(TEXT("Drop"));

	// Raiz do componente
	SceneRoot = CreateDefaultSubobject<USceneComponent>(TEXT("SceneRoot"));
	RootComponent = SceneRoot;

	// Malha 3D do item
	DropMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("DropMesh"));
	DropMesh->SetupAttachment(SceneRoot);
	DropMesh->SetCollisionObjectType(ECC_WorldDynamic);
	DropMesh->SetCollisionEnabled(ECollisionEnabled::QueryAndPhysics);
	DropMesh->SetCollisionResponseToAllChannels(ECR_Ignore);
	DropMesh->SetCollisionResponseToChannel(ECC_WorldStatic, ECR_Block);
	DropMesh->SetCollisionResponseToChannel(ECC_Visibility, ECR_Block);
	DropMesh->SetGenerateOverlapEvents(true);

	// Feixe celestial para Joias (NS_JewelDropBeam)
	CelestialBeamComponent = CreateDefaultSubobject<UNiagaraComponent>(TEXT("CelestialBeamComponent"));
	CelestialBeamComponent->SetupAttachment(DropMesh);
	CelestialBeamComponent->bAutoActivate = false;

	// Brilho místico ambiente
	SparklesComponent = CreateDefaultSubobject<UNiagaraComponent>(TEXT("SparklesComponent"));
	SparklesComponent->SetupAttachment(DropMesh);
	SparklesComponent->bAutoActivate = true;

	// Texto 3D de identificação no mundo
	NameplateComponent = CreateDefaultSubobject<UTextRenderComponent>(TEXT("NameplateComponent"));
	NameplateComponent->SetupAttachment(DropMesh);
	NameplateComponent->SetRelativeLocation(FVector(0.0f, 0.0f, 35.0f));
	NameplateComponent->SetWorldSize(20.0f);
	NameplateComponent->SetHorizontalAlignment(EHorizTextAligment::EHTA_Center);
	NameplateComponent->SetVerticalAlignment(EVerticalTextAligment::EVRTA_TextCenter);
	NameplateComponent->SetTextRenderColor(FColor::White);

	// Tenta carregar assets padrões de joia caso existam no projeto
	static ConstructorHelpers::FObjectFinder<UNiagaraSystem> BeamFinder(TEXT("/Game/Dasi/VFX/Niagara/NS_JewelDropBeam"));
	if (BeamFinder.Succeeded())
	{
		JewelDropBeamNiagara = BeamFinder.Object;
	}

	static ConstructorHelpers::FObjectFinder<UNiagaraSystem> PickupFinder(TEXT("/Game/Dasi/VFX/Niagara/NS_ItemPickupBurst"));
	if (PickupFinder.Succeeded())
	{
		PickupBurstNiagara = PickupFinder.Object;
	}

	static ConstructorHelpers::FObjectFinder<USoundBase> JewelSoundFinder(TEXT("/Game/Dasi/Audio/SFX/A_JewelDrop_Chime"));
	if (JewelSoundFinder.Succeeded())
	{
		SacredJewelDropSound = JewelSoundFinder.Object;
	}

	static ConstructorHelpers::FObjectFinder<USoundBase> DropSoundFinder(TEXT("/Game/Dasi/Audio/SFX/A_ItemDrop_Generic"));
	if (DropSoundFinder.Succeeded())
	{
		ItemDropSound = DropSoundFinder.Object;
	}

	static ConstructorHelpers::FObjectFinder<USoundBase> PickupSoundFinder(TEXT("/Game/Dasi/Audio/SFX/A_ItemPickup"));
	if (PickupSoundFinder.Succeeded())
	{
		PickupSound = PickupSoundFinder.Object;
	}
}

void ADasiGroundDropActor::BeginPlay()
{
	Super::BeginPlay();

	BaseRestingZ = GetActorLocation().Z;

	// Inicia leve impulso físico de queda 3D
	DropMesh->SetSimulatePhysics(true);
	const FVector RandomBounce(
		FMath::RandRange(-50.0f, 50.0f),
		FMath::RandRange(-50.0f, 50.0f),
		FMath::RandRange(150.0f, 250.0f)
	);
	DropMesh->AddImpulse(RandomBounce, NAME_None, true);

	// Agenda assentamento da física após 0.7s para entrar no modo flutuação
	GetWorldTimerManager().SetTimer(
		PhysicsSettleTimerHandle,
		this,
		&ADasiGroundDropActor::SettlePhysics,
		0.7f,
		false
	);
}

void ADasiGroundDropActor::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);

	// Se estiver no processo de ser recolhido
	if (bIsBeingPickedUp)
	{
		PickupAnimTimer += DeltaTime;
		const float Alpha = FMath::Clamp(PickupAnimTimer / 0.22f, 0.0f, 1.0f);
		SetActorScale3D(FMath::Lerp(FVector(1.0f), FVector(0.01f), Alpha));
		AddActorWorldOffset(FVector(0.0f, 0.0f, 150.0f * DeltaTime));

		if (PickupAnimTimer >= 0.22f)
		{
			Destroy();
		}
		return;
	}

	// Animação de rotação e flutuação suave após o quique físico inicial
	if (bHasSettled)
	{
		UpdateHoverAnimation(DeltaTime);
	}

	// Billboarding do texto 3D para a câmera isométrica
	UpdateNameplateBillboarding();
}

void ADasiGroundDropActor::InitializeDrop(const FDasiGroundDropItem& InDropData)
{
	DropId = InDropData.DropId;
	ZenAmount = InDropData.Zen;
	bIsJewel = InDropData.bIsJewel;
	bIsExcellent = InDropData.bIsExcellent;
	ItemInstance = InDropData.Item;

	FString DisplayName;
	FColor TextColor = FColor::White;

	// Formatação do nome e cores lendárias do MU Online
	if (ZenAmount > 0)
	{
		DisplayName = FString::Printf(TEXT("Zen (%lld)"), ZenAmount);
		TextColor = FColor(255, 215, 0); // Ouro radiante
	}
	else if (ItemInstance.IsValid())
	{
		DisplayName = ItemInstance.Name.IsEmpty() ? ItemInstance.DefId : ItemInstance.Name;

		if (ItemInstance.Level > 0)
		{
			DisplayName += FString::Printf(TEXT(" +%d"), ItemInstance.Level);
		}

		if (ItemInstance.bIsLuck)
		{
			DisplayName += TEXT(" +Luck");
		}

		if (ItemInstance.bIsSkill)
		{
			DisplayName += TEXT(" +Skill");
		}

		if (bIsExcellent || ItemInstance.bIsExcellent)
		{
			DisplayName += TEXT(" [Ex]");
			TextColor = FColor(57, 255, 20); // Verde Neon Excelente (#39FF14)
		}
		else if (bIsJewel)
		{
			TextColor = FColor(255, 120, 220); // Rosa Celestial de Joias
		}
		else
		{
			TextColor = (ItemInstance.Level >= 7) ? FColor(255, 180, 50) : FColor::White;
		}
	}
	else
	{
		DisplayName = TEXT("Misterioso");
	}

	if (NameplateComponent)
	{
		NameplateComponent->SetText(FText::FromString(DisplayName));
		NameplateComponent->SetTextRenderColor(TextColor);
	}

	// Configuração do Feixe Celestial Niagara de Joias
	if (bIsJewel)
	{
		if (JewelDropBeamNiagara && CelestialBeamComponent)
		{
			CelestialBeamComponent->SetAsset(JewelDropBeamNiagara);
			CelestialBeamComponent->Activate(true);
		}

		// Som sagrado de drop de Joia (Bless, Soul, Chaos, Life)
		if (SacredJewelDropSound)
		{
			UGameplayStatics::PlaySoundAtLocation(this, SacredJewelDropSound, GetActorLocation(), 1.0f, 1.0f);
		}
	}
	else if (ItemDropSound)
	{
		UGameplayStatics::PlaySoundAtLocation(this, ItemDropSound, GetActorLocation(), 0.8f, 1.0f);
	}

	ApplyDefaultDropVisuals();
}

void ADasiGroundDropActor::SetHovered(bool bInHovered)
{
	bIsHovered = bInHovered;

	// Stencil 252 para itens no chão (outline dourado/azul do PlayerController)
	if (DropMesh)
	{
		DropMesh->SetRenderCustomDepth(bIsHovered);
		DropMesh->SetCustomDepthStencilValue(252);
	}

	if (NameplateComponent)
	{
		NameplateComponent->SetWorldSize(bIsHovered ? 24.0f : 20.0f);
	}
}

void ADasiGroundDropActor::PlayPickupFeedback(AActor* CollectorActor)
{
	if (bIsBeingPickedUp) return;

	bIsBeingPickedUp = true;
	PickupAnimTimer = 0.0f;

	// Partículas de coleta Niagara
	if (PickupBurstNiagara)
	{
		UNiagaraFunctionLibrary::SpawnSystemAtLocation(
			this,
			PickupBurstNiagara,
			GetActorLocation(),
			FRotator::ZeroRotator,
			FVector(1.0f),
			true,
			true,
			ENCPoolMethod::AutoRelease
		);
	}

	// Som de recolhimento
	if (PickupSound)
	{
		UGameplayStatics::PlaySoundAtLocation(this, PickupSound, GetActorLocation(), 1.0f, 1.0f);
	}

	// Desativa colisão e feixe
	if (DropMesh)
	{
		DropMesh->SetCollisionEnabled(ECollisionEnabled::NoCollision);
	}
	if (CelestialBeamComponent)
	{
		CelestialBeamComponent->Deactivate();
	}
}

void ADasiGroundDropActor::SettlePhysics()
{
	if (bHasSettled) return;

	bHasSettled = true;
	if (DropMesh)
	{
		DropMesh->SetSimulatePhysics(false);
		DropMesh->SetCollisionEnabled(ECollisionEnabled::QueryOnly);
	}

	BaseRestingZ = GetActorLocation().Z;
}

void ADasiGroundDropActor::UpdateHoverAnimation(float DeltaTime)
{
	HoverTimeElapsed += DeltaTime;

	// Rotação suave do item sobre seu eixo vertical (Yaw)
	if (DropMesh)
	{
		DropMesh->AddRelativeRotation(FRotator(0.0f, HoverRotationSpeed * DeltaTime, 0.0f));

		// Efeito suave de flutuação / levitação rúnica
		const float BobbingOffset = FMath::Sin(HoverTimeElapsed * BobbingFrequency) * BobbingAmplitude;
		FVector CurrentLoc = GetActorLocation();
		CurrentLoc.Z = BaseRestingZ + BobbingOffset + 12.0f;
		SetActorLocation(CurrentLoc);
	}
}

void ADasiGroundDropActor::UpdateNameplateBillboarding()
{
	if (!NameplateComponent) return;

	APlayerCameraManager* CamManager = UGameplayStatics::GetPlayerCameraManager(this, 0);
	if (CamManager)
	{
		const FRotator CamRot = CamManager->GetCameraRotation();
		// Mantém o texto perfeitamente legível na perspectiva isométrica
		NameplateComponent->SetWorldRotation(CamRot);
	}
}

void ADasiGroundDropActor::ApplyDefaultDropVisuals()
{
	// Se for Joia e não houver malha customizada, escala e cor de gema
	if (bIsJewel)
	{
		SetActorScale3D(FVector(1.15f));
	}
	else if (bIsExcellent)
	{
		SetActorScale3D(FVector(1.25f));
	}
}
