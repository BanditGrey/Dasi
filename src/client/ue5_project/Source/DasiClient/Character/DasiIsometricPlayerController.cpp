#include "Character/DasiIsometricPlayerController.h"
#include "Character/DasiCharacterBase.h"
#include "Combat/DasiCombatComponent.h"
#include "Combat/DasiCombatInterface.h"
#include "Inventory/DasiInventoryComponent.h"
#include "Network/DasiNetworkSubsystem.h"
#include "UI/DasiHUDWidget.h"
#include "UI/Dasi3DInventoryWidget.h"
#include "Blueprint/UserWidget.h"
#include "Blueprint/AIBlueprintHelperLibrary.h"
#include "NavigationSystem.h"
#include "GameFramework/SpringArmComponent.h"
#include "Components/DecalComponent.h"
#include "Components/PrimitiveComponent.h"
#include "NiagaraFunctionLibrary.h"
#include "Kismet/GameplayStatics.h"
#include "Kismet/KismetMathLibrary.h"
#include "DasiClient.h"

ADasiIsometricPlayerController::ADasiIsometricPlayerController()
{
	bShowMouseCursor = true;
	DefaultMouseCursor = EMouseCursor::Default;
	bEnableClickEvents = true;
	bEnableMouseOverEvents = true;
	bEnableTouchEvents = false;

	DesiredCameraDistance = DefaultCameraDistance;
	CachedDestination = FVector::ZeroVector;
}

void ADasiIsometricPlayerController::BeginPlay()
{
	Super::BeginPlay();

	// Set classical ARPG hybrid input mode (visible cursor, direct viewport interaction)
	FInputModeGameAndUI InputMode;
	InputMode.SetLockMouseToViewportBehavior(EMouseLockMode::DoNotLock);
	InputMode.SetHideCursorDuringCapture(false);
	SetInputMode(InputMode);

	// Sync camera on possessed pawn
	if (ADasiCharacterBase* DasiChar = Cast<ADasiCharacterBase>(GetPawn()))
	{
		if (USpringArmComponent* Boom = DasiChar->GetCameraBoom())
		{
			Boom->TargetArmLength = DefaultCameraDistance;
			Boom->SetWorldRotation(FRotator(CameraPitch, CameraYaw, 0.0f));
		}
	}

	// Inicialização da HUD 3D e Janela Dupla de Inventário
	if (IsLocalPlayerController())
	{
		if (HUDWidgetClass)
		{
			ActiveHUDWidget = CreateWidget<UDasiHUDWidget>(this, HUDWidgetClass);
			if (ActiveHUDWidget)
			{
				ActiveHUDWidget->AddToViewport(10);
			}
		}

		if (InventoryWidgetClass)
		{
			ActiveInventoryWidget = CreateWidget<UDasi3DInventoryWidget>(this, InventoryWidgetClass);
			if (ActiveInventoryWidget)
			{
				ActiveInventoryWidget->AddToViewport(20);
				ActiveInventoryWidget->SetVisibility(ESlateVisibility::Collapsed);

				if (ADasiCharacterBase* DasiChar = Cast<ADasiCharacterBase>(GetPawn()))
				{
					ActiveInventoryWidget->BindInventoryComponent(DasiChar->GetInventoryComponent());
					ActiveInventoryWidget->SetupPaperdollStudio(DasiChar);
				}
			}
		}

		// Conectar aos delegates de telemetria do Subsistema de Rede
		if (UGameInstance* GI = GetGameInstance())
		{
			if (UDasiNetworkSubsystem* NetSub = GI->GetSubsystem<UDasiNetworkSubsystem>())
			{
				NetSub->OnPlayerVitalsUpdated.AddDynamic(this, &ADasiIsometricPlayerController::HandlePlayerVitalsUpdated);
				NetSub->OnPlayerExpUpdated.AddDynamic(this, &ADasiIsometricPlayerController::HandlePlayerExpUpdated);
				NetSub->OnSkillCooldownReceived.AddDynamic(this, &ADasiIsometricPlayerController::HandleSkillCooldownReceived);
				NetSub->OnCombatFeedbackReceived.AddDynamic(this, &ADasiIsometricPlayerController::HandleCombatFeedbackReceived);
			}
		}
	}
}

void ADasiIsometricPlayerController::SetupInputComponent()
{
	Super::SetupInputComponent();

	if (!InputComponent) return;

	InputComponent->BindAction("LeftClick", IE_Pressed, this, &ADasiIsometricPlayerController::OnLeftClickPressed);
	InputComponent->BindAction("LeftClick", IE_Released, this, &ADasiIsometricPlayerController::OnLeftClickReleased);

	InputComponent->BindAction("RightClick", IE_Pressed, this, &ADasiIsometricPlayerController::OnRightClickPressed);
	InputComponent->BindAction("RightClick", IE_Released, this, &ADasiIsometricPlayerController::OnRightClickReleased);

	InputComponent->BindAxis("MouseWheel", this, &ADasiIsometricPlayerController::OnMouseWheelScrolled);

	// Action Bar Dinâmica & Inventário (Q, W, E, R, Space, F, I)
	InputComponent->BindAction("ToggleInventory", IE_Pressed, this, &ADasiIsometricPlayerController::OnToggleInventoryPressed);
	InputComponent->BindAction("Action_Q", IE_Pressed, this, &ADasiIsometricPlayerController::OnHotkeyQPressed);
	InputComponent->BindAction("Action_W", IE_Pressed, this, &ADasiIsometricPlayerController::OnHotkeyWPressed);
	InputComponent->BindAction("Action_E", IE_Pressed, this, &ADasiIsometricPlayerController::OnHotkeyEPressed);
	InputComponent->BindAction("Action_R", IE_Pressed, this, &ADasiIsometricPlayerController::OnHotkeyRPressed);
	InputComponent->BindAction("Action_Space", IE_Pressed, this, &ADasiIsometricPlayerController::OnHotkeySpacePressed);
	InputComponent->BindAction("Action_Pickup", IE_Pressed, this, &ADasiIsometricPlayerController::OnHotkeyFPressed);
}

void ADasiIsometricPlayerController::PlayerTick(float DeltaTime)
{
	Super::PlayerTick(DeltaTime);

	UpdateCameraZoom(DeltaTime);
	ProcessMouseHoverHighlight();

	if (CurrentInteractionType == EDasiInteractionType::AttackTarget)
	{
		ProcessCombatTargetTracking(DeltaTime);
	}
	else if (CurrentInteractionType == EDasiInteractionType::PickupDrop)
	{
		ProcessDropPickupTracking(DeltaTime);
	}
	else if (bIsLeftClickHeld && CurrentInteractionType == EDasiInteractionType::MoveToGround)
	{
		ProcessClickHoldNavigation(DeltaTime);
	}
}

void ADasiIsometricPlayerController::OnLeftClickPressed()
{
	bIsLeftClickHeld = true;

	FHitResult HitResult;
	const bool bHit = GetHitResultUnderCursor(ECC_Visibility, false, HitResult);

	if (!bHit || !HitResult.GetActor())
	{
		return;
	}

	AActor* HitActor = HitResult.GetActor();

	// Case 1: Clicked on a Monster / Combat Target
	if (HitActor->GetClass()->ImplementsInterface(UDasiCombatInterface::StaticClass()) || HitActor->ActorHasTag(TEXT("Monster")))
	{
		IssueAttackCommand(HitActor);
		SpawnClickFeedback(HitActor->GetActorLocation(), FLinearColor::Red);
		return;
	}

	// Case 2: Clicked on a Ground Drop / Loot Item
	if (HitActor->ActorHasTag(TEXT("Drop")) || HitActor->ActorHasTag(TEXT("GroundItem")))
	{
		IssuePickupCommand(HitActor);
		SpawnClickFeedback(HitActor->GetActorLocation(), FLinearColor(1.0f, 0.84f, 0.0f)); // Gold feedback
		return;
	}

	// Case 3: Ground Navigation via NavMesh
	ClearCurrentTarget();
	CurrentInteractionType = EDasiInteractionType::MoveToGround;
	SetNewMoveDestination(HitResult.Location);
	SpawnClickFeedback(HitResult.Location, FLinearColor(0.2f, 1.0f, 0.3f)); // Green circle
}

void ADasiIsometricPlayerController::OnLeftClickReleased()
{
	bIsLeftClickHeld = false;
}

void ADasiIsometricPlayerController::OnRightClickPressed()
{
	bIsRightClickHeld = true;

	// Execute primary right-click active skill (e.g. Twisting Slash, Cyclone, Death Stab)
	if (ADasiCharacterBase* DasiChar = Cast<ADasiCharacterBase>(GetPawn()))
	{
		if (UDasiCombatComponent* CombatComp = DasiChar->GetCombatComponent())
		{
			FHitResult HitResult;
			GetHitResultUnderCursor(ECC_Visibility, false, HitResult);
			CombatComp->ExecuteSkillAttack(TEXT("TwistingSlash"), HitResult.Location);
		}
	}
}

void ADasiIsometricPlayerController::OnRightClickReleased()
{
	bIsRightClickHeld = false;
}

void ADasiIsometricPlayerController::OnMouseWheelScrolled(float AxisValue)
{
	if (FMath::IsNearlyZero(AxisValue)) return;

	// Scroll In (AxisValue > 0) -> Zoom Closer (Decrease arm length)
	// Scroll Out (AxisValue < 0) -> Zoom Further (Increase arm length)
	DesiredCameraDistance -= AxisValue * ZoomStepSize;
	DesiredCameraDistance = FMath::Clamp(DesiredCameraDistance, MinCameraDistance, MaxCameraDistance);
}

void ADasiIsometricPlayerController::UpdateCameraZoom(float DeltaTime)
{
	ADasiCharacterBase* DasiChar = Cast<ADasiCharacterBase>(GetPawn());
	if (!DasiChar) return;

	USpringArmComponent* Boom = DasiChar->GetCameraBoom();
	if (!Boom) return;

	// Smooth exponential interpolation to target zoom
	Boom->TargetArmLength = FMath::FInterpTo(Boom->TargetArmLength, DesiredCameraDistance, DeltaTime, ZoomInterpolationSpeed);

	// Ensure strict isometric rotation lock without gimbal lock
	FRotator DesiredRot(CameraPitch, CameraYaw, 0.0f);
	if (!Boom->GetComponentRotation().Equals(DesiredRot, 0.01f))
	{
		Boom->SetWorldRotation(DesiredRot);
	}
}

void ADasiIsometricPlayerController::SetNewMoveDestination(const FVector& DestLocation)
{
	APawn* ControlledPawn = GetPawn();
	if (!ControlledPawn) return;

	CachedDestination = DestLocation;
	UNavigationSystemV1::SimpleMoveToLocation(this, DestLocation);
}

void ADasiIsometricPlayerController::IssueAttackCommand(AActor* TargetActor)
{
	if (!TargetActor) return;

	CurrentCombatTarget = TargetActor;
	CurrentDropTarget = nullptr;
	CurrentInteractionType = EDasiInteractionType::AttackTarget;
}

void ADasiIsometricPlayerController::IssuePickupCommand(AActor* DropActor)
{
	if (!DropActor) return;

	CurrentDropTarget = DropActor;
	CurrentCombatTarget = nullptr;
	CurrentInteractionType = EDasiInteractionType::PickupDrop;
}

void ADasiIsometricPlayerController::ClearCurrentTarget()
{
	CurrentCombatTarget = nullptr;
	CurrentDropTarget = nullptr;
	CurrentInteractionType = EDasiInteractionType::None;
}

void ADasiIsometricPlayerController::ProcessClickHoldNavigation(float DeltaTime)
{
	FHitResult HitResult;
	if (GetHitResultUnderCursor(ECC_Visibility, false, HitResult))
	{
		// Stream new destination continuously if moved more than threshold
		if (FVector::DistSquared2D(HitResult.Location, CachedDestination) > FMath::Square(DestinationAcceptanceRadius))
		{
			SetNewMoveDestination(HitResult.Location);
		}
	}
}

void ADasiIsometricPlayerController::ProcessCombatTargetTracking(float DeltaTime)
{
	ADasiCharacterBase* DasiChar = Cast<ADasiCharacterBase>(GetPawn());
	if (!DasiChar || !CurrentCombatTarget.IsValid())
	{
		ClearCurrentTarget();
		return;
	}

	AActor* Target = CurrentCombatTarget.Get();

	// Check if target is still valid/alive
	if (Target->GetClass()->ImplementsInterface(UDasiCombatInterface::StaticClass()))
	{
		if (!IDasiCombatInterface::Execute_IsAlive(Target))
		{
			ClearCurrentTarget();
			StopMovement();
			return;
		}
	}

	const float Distance = FVector::Dist2D(DasiChar->GetActorLocation(), Target->GetActorLocation());

	if (Distance <= MeleeAttackRange)
	{
		// Target reached: halt movement, orient towards target, execute attack
		StopMovement();

		FVector Direction = (Target->GetActorLocation() - DasiChar->GetActorLocation()).GetSafeNormal2D();
		if (!Direction.IsNearlyZero())
		{
			FRotator TargetRot = Direction.Rotation();
			DasiChar->SetActorRotation(FMath::RInterpTo(DasiChar->GetActorRotation(), TargetRot, DeltaTime, 15.0f));
		}

		if (UDasiCombatComponent* CombatComp = DasiChar->GetCombatComponent())
		{
			CombatComp->RequestAttackTarget(Target);

			// Forward authoritative attack intent to server
			if (UGameInstance* GI = GetGameInstance())
			{
				if (UDasiNetworkSubsystem* NetSub = GI->GetSubsystem<UDasiNetworkSubsystem>())
				{
					FString TargetId = Target->GetName();
					if (Target->GetClass()->ImplementsInterface(UDasiCombatInterface::StaticClass()))
					{
						TargetId = IDasiCombatInterface::Execute_GetEntityId(Target);
					}
					const FVector CharLoc = DasiChar->GetActorLocation();
					NetSub->SendCombatAttack(TargetId, TEXT(""), CharLoc.X, CharLoc.Y);
				}
			}
		}
	}
	else
	{
		// Move closer along NavMesh towards target
		UAIBlueprintHelperLibrary::SimpleMoveToActor(this, Target);
	}
}

void ADasiIsometricPlayerController::ProcessDropPickupTracking(float DeltaTime)
{
	ADasiCharacterBase* DasiChar = Cast<ADasiCharacterBase>(GetPawn());
	if (!DasiChar || !CurrentDropTarget.IsValid())
	{
		ClearCurrentTarget();
		return;
	}

	AActor* Drop = CurrentDropTarget.Get();
	const float Distance = FVector::Dist2D(DasiChar->GetActorLocation(), Drop->GetActorLocation());

	if (Distance <= PickupInteractionRange)
	{
		StopMovement();

		// Notify network server of pickup interaction
		if (UGameInstance* GI = GetGameInstance())
		{
			if (UDasiNetworkSubsystem* NetSub = GI->GetSubsystem<UDasiNetworkSubsystem>())
			{
				const FVector CharLoc = DasiChar->GetActorLocation();
				NetSub->SendPickupGroundItem(Drop->GetName(), CharLoc.X, CharLoc.Y);
			}
		}

		UE_LOG(LogDasiCharacter, Log, TEXT("Player in range to pick up drop: %s"), *Drop->GetName());
		ClearCurrentTarget();
	}
	else
	{
		UAIBlueprintHelperLibrary::SimpleMoveToActor(this, Drop);
	}
}

void ADasiIsometricPlayerController::ProcessMouseHoverHighlight()
{
	FHitResult HitResult;
	GetHitResultUnderCursor(ECC_Visibility, false, HitResult);

	AActor* HoveredActor = HitResult.GetActor();
	if (HoveredActor == LastHoveredActor.Get())
	{
		return;
	}

	// Disable stencil outline on previous
	if (LastHoveredActor.IsValid())
	{
		TArray<UMeshComponent*> MeshComponents;
		LastHoveredActor->GetComponents<UMeshComponent>(MeshComponents);
		for (UMeshComponent* Mesh : MeshComponents)
		{
			Mesh->SetRenderCustomDepth(false);
		}
	}

	LastHoveredActor = HoveredActor;

	// Enable outline stencil on newly hovered interactive actor
	if (HoveredActor && (HoveredActor->GetClass()->ImplementsInterface(UDasiCombatInterface::StaticClass()) ||
		HoveredActor->ActorHasTag(TEXT("Monster")) ||
		HoveredActor->ActorHasTag(TEXT("Drop"))))
	{
		TArray<UMeshComponent*> MeshComponents;
		HoveredActor->GetComponents<UMeshComponent>(MeshComponents);
		for (UMeshComponent* Mesh : MeshComponents)
		{
			Mesh->SetRenderCustomDepth(true);
			Mesh->SetCustomDepthStencilValue(HoveredActor->ActorHasTag(TEXT("Monster")) ? 250 : 252);
		}
	}
}

void ADasiIsometricPlayerController::SpawnClickFeedback(const FVector& Location, const FLinearColor& FeedbackColor)
{
	UWorld* World = GetWorld();
	if (!World) return;

	// Niagara feedback burst if assigned
	if (ClickNiagaraEffect)
	{
		UNiagaraComponent* NiagaraComp = UNiagaraFunctionLibrary::SpawnSystemAtLocation(
			World,
			ClickNiagaraEffect,
			Location + FVector(0.0f, 0.0f, 5.0f),
			FRotator::ZeroRotator,
			FVector(1.0f),
			true,
			true,
			ENCPoolMethod::AutoRelease
		);
		if (NiagaraComp)
		{
			NiagaraComp->SetVariableLinearColor(TEXT("ClickColor"), FeedbackColor);
		}
	}
}

// ============================================================================
// HUD & JANELA DUPLA DE INVENTÁRIO (3D UI)
// ============================================================================

void ADasiIsometricPlayerController::ToggleInventoryWindow()
{
	if (ActiveInventoryWidget)
	{
		const bool bIsVisible = ActiveInventoryWidget->GetVisibility() == ESlateVisibility::Visible;
		SetInventoryWindowVisible(!bIsVisible);
	}
}

void ADasiIsometricPlayerController::SetInventoryWindowVisible(bool bVisible)
{
	if (ActiveInventoryWidget)
	{
		ActiveInventoryWidget->SetVisibility(bVisible ? ESlateVisibility::Visible : ESlateVisibility::Collapsed);
	}
}

bool ADasiIsometricPlayerController::IsInventoryWindowVisible() const
{
	return ActiveInventoryWidget && ActiveInventoryWidget->GetVisibility() == ESlateVisibility::Visible;
}

void ADasiIsometricPlayerController::ExecuteActionBarAction(FName ActionKey)
{
	UDasiNetworkSubsystem* NetSub = GetGameInstance() ? GetGameInstance()->GetSubsystem<UDasiNetworkSubsystem>() : nullptr;
	ADasiCharacterBase* DasiChar = Cast<ADasiCharacterBase>(GetPawn());
	if (!DasiChar) return;

	if (ActionKey == FName(TEXT("Q")))
	{
		if (NetSub) NetSub->SendUseJewelRequest(TEXT("potion_health"), EDasiEquipmentSlot::None);
	}
	else if (ActionKey == FName(TEXT("W")))
	{
		if (NetSub) NetSub->SendUseJewelRequest(TEXT("potion_mana"), EDasiEquipmentSlot::None);
	}
	else if (ActionKey == FName(TEXT("E")))
	{
		if (UDasiCombatComponent* Combat = DasiChar->GetCombatComponent())
		{
			Combat->RequestAttack(GetCurrentCombatTarget());
		}
	}
	else if (ActionKey == FName(TEXT("R")))
	{
		if (UDasiCombatComponent* Combat = DasiChar->GetCombatComponent())
		{
			Combat->RequestAttack(GetCurrentCombatTarget());
		}
	}
	else if (ActionKey == FName(TEXT("Space")))
	{
		const FVector DashDir = DasiChar->GetActorForwardVector();
		DasiChar->LaunchCharacter(DashDir * 800.0f + FVector(0.0f, 0.0f, 150.0f), true, true);
	}
	else if (ActionKey == FName(TEXT("F")))
	{
		if (CurrentDropTarget.IsValid())
		{
			IssuePickupCommand(CurrentDropTarget.Get());
		}
	}
}

void ADasiIsometricPlayerController::HandlePlayerVitalsUpdated(int32 CurrentHp, int32 MaxHp, int32 CurrentMp, int32 MaxMp, int32 CurrentSd, int32 MaxSd, int32 CurrentSta, int32 MaxSta)
{
	if (ActiveHUDWidget)
	{
		ActiveHUDWidget->UpdateHealth(CurrentHp, MaxHp);
		ActiveHUDWidget->UpdateMana(CurrentMp, MaxMp);
		ActiveHUDWidget->UpdateShieldDefense(CurrentSd, MaxSd);
		ActiveHUDWidget->UpdateStamina(CurrentSta, MaxSta);
	}
}

void ADasiIsometricPlayerController::HandlePlayerExpUpdated(int64 CurrentXp, int64 NextLevelXp, int32 CurrentLevel)
{
	if (ActiveHUDWidget)
	{
		ActiveHUDWidget->UpdateExperience(CurrentXp, NextLevelXp);
	}
}

void ADasiIsometricPlayerController::HandleSkillCooldownReceived(FName ActionKey, float Duration)
{
	if (ActiveHUDWidget)
	{
		ActiveHUDWidget->TriggerSkillCooldown(ActionKey, Duration);
	}
}

void ADasiIsometricPlayerController::HandleCombatFeedbackReceived(int32 Damage, EDasiDamageType DamageType, const FVector& WorldPos)
{
	if (ActiveHUDWidget && Damage > 0)
	{
		ActiveHUDWidget->TriggerDamageTurbulence(0.25f);
	}
}

void ADasiIsometricPlayerController::OnHotkeyQPressed() { ExecuteActionBarAction(FName(TEXT("Q"))); }
void ADasiIsometricPlayerController::OnHotkeyWPressed() { ExecuteActionBarAction(FName(TEXT("W"))); }
void ADasiIsometricPlayerController::OnHotkeyEPressed() { ExecuteActionBarAction(FName(TEXT("E"))); }
void ADasiIsometricPlayerController::OnHotkeyRPressed() { ExecuteActionBarAction(FName(TEXT("R"))); }
void ADasiIsometricPlayerController::OnHotkeySpacePressed() { ExecuteActionBarAction(FName(TEXT("Space"))); }
void ADasiIsometricPlayerController::OnHotkeyFPressed() { ExecuteActionBarAction(FName(TEXT("F"))); }
void ADasiIsometricPlayerController::OnToggleInventoryPressed() { ToggleInventoryWindow(); }
