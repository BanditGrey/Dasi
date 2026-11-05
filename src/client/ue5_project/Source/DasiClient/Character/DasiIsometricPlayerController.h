#pragma once

#include "CoreMinimal.h"
#include "GameFramework/PlayerController.h"
#include "DasiIsometricPlayerController.generated.h"

class ADasiCharacterBase;
class UDecalComponent;
class UNiagaraSystem;
class UNiagaraComponent;
class UDasiHUDWidget;
class UDasi3DInventoryWidget;
enum class EDasiDamageType : uint8;

/**
 * Interaction target types for Continent of Legend isometric point-and-click
 */
UENUM(BlueprintType)
enum class EDasiInteractionType : uint8
{
	None,
	MoveToGround,
	AttackTarget,
	PickupDrop
};

/**
 * Dasi Isometric Player Controller
 * Classic Continent of Legend isometric perspective (-45° to -55° pitch, 45° yaw, 1200-1800 arm distance)
 * Fluid mouse navigation, target lock-on, continuous movement streaming, and drop pickup.
 */
UCLASS()
class DASICLIENT_API ADasiIsometricPlayerController : public APlayerController
{
	GENERATED_BODY()

public:
	ADasiIsometricPlayerController();

protected:
	virtual void BeginPlay() override;
	virtual void PlayerTick(float DeltaTime) override;
	virtual void SetupInputComponent() override;

public:
	// --- Camera Configuration ---
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Camera")
	float CameraPitch = -50.0f; // Range: -45.0f to -55.0f

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Camera")
	float CameraYaw = 45.0f; // Isometric 45-degree angle

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Camera")
	float DefaultCameraDistance = 1500.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Camera")
	float MinCameraDistance = 1100.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Camera")
	float MaxCameraDistance = 1900.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Camera")
	float ZoomStepSize = 120.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Camera")
	float ZoomInterpolationSpeed = 10.0f;

	// --- Gameplay Interaction Settings ---
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Interaction")
	float MeleeAttackRange = 220.0f; // Reach in Unreal units (cm)

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Interaction")
	float PickupInteractionRange = 150.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Interaction")
	float DestinationAcceptanceRadius = 40.0f;

	// Visual click indicator
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Feedback")
	TObjectPtr<UMaterialInterface> ClickDecalMaterial;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Feedback")
	TObjectPtr<UNiagaraSystem> ClickNiagaraEffect;

	// --- Public API ---
	UFUNCTION(BlueprintCallable, Category = "Dasi|Interaction")
	void SetNewMoveDestination(const FVector& DestLocation);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Interaction")
	void IssueAttackCommand(AActor* TargetActor);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Interaction")
	void IssuePickupCommand(AActor* DropActor);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Interaction")
	void ClearCurrentTarget();

	UFUNCTION(BlueprintPure, Category = "Dasi|Interaction")
	AActor* GetCurrentCombatTarget() const { return CurrentCombatTarget.Get(); }

	UFUNCTION(BlueprintPure, Category = "Dasi|Camera")
	float GetDesiredCameraDistance() const { return DesiredCameraDistance; }

	// --- HUD & 3D Dual-Pane UI Configuration ---
	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|UI")
	TSubclassOf<UDasiHUDWidget> HUDWidgetClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|UI")
	TSubclassOf<UDasi3DInventoryWidget> InventoryWidgetClass;

	UPROPERTY(VisibleInstanceOnly, BlueprintReadOnly, Category = "Dasi|UI")
	TObjectPtr<UDasiHUDWidget> ActiveHUDWidget;

	UPROPERTY(VisibleInstanceOnly, BlueprintReadOnly, Category = "Dasi|UI")
	TObjectPtr<UDasi3DInventoryWidget> ActiveInventoryWidget;

	UFUNCTION(BlueprintCallable, Category = "Dasi|UI")
	void ToggleInventoryWindow();

	UFUNCTION(BlueprintCallable, Category = "Dasi|UI")
	void SetInventoryWindowVisible(bool bVisible);

	UFUNCTION(BlueprintPure, Category = "Dasi|UI")
	bool IsInventoryWindowVisible() const;

	UFUNCTION(BlueprintCallable, Category = "Dasi|Actions")
	void ExecuteActionBarAction(FName ActionKey);

	// --- Network Delegate Callbacks ---
	UFUNCTION()
	void HandlePlayerVitalsUpdated(int32 CurrentHp, int32 MaxHp, int32 CurrentMp, int32 MaxMp, int32 CurrentSd, int32 MaxSd, int32 CurrentSta, int32 MaxSta);

	UFUNCTION()
	void HandlePlayerExpUpdated(int64 CurrentXp, int64 NextLevelXp, int32 CurrentLevel);

	UFUNCTION()
	void HandleSkillCooldownReceived(FName ActionKey, float Duration);

	UFUNCTION()
	void HandleCombatFeedbackReceived(int32 Damage, EDasiDamageType DamageType, const FVector& WorldPos);

private:
	// Input Action Handlers
	void OnLeftClickPressed();
	void OnLeftClickReleased();
	void OnRightClickPressed();
	void OnRightClickReleased();
	void OnMouseWheelScrolled(float AxisValue);
	void OnSkillHotkeyPressed(int32 SkillSlot);

	// Action Bar Hotkeys
	void OnHotkeyQPressed();
	void OnHotkeyWPressed();
	void OnHotkeyEPressed();
	void OnHotkeyRPressed();
	void OnHotkeySpacePressed();
	void OnHotkeyFPressed();
	void OnToggleInventoryPressed();

	// Tick Processors
	void ProcessClickHoldNavigation(float DeltaTime);
	void ProcessCombatTargetTracking(float DeltaTime);
	void ProcessDropPickupTracking(float DeltaTime);
	void ProcessMouseHoverHighlight();
	void UpdateCameraZoom(float DeltaTime);

	// Visual Feedback
	void SpawnClickFeedback(const FVector& Location, const FLinearColor& FeedbackColor);

	// State
	bool bIsLeftClickHeld = false;
	bool bIsRightClickHeld = false;
	float DesiredCameraDistance = 1500.0f;
	FVector CachedDestination = FVector::ZeroVector;

	EDasiInteractionType CurrentInteractionType = EDasiInteractionType::None;

	UPROPERTY()
	TWeakObjectPtr<AActor> CurrentCombatTarget;

	UPROPERTY()
	TWeakObjectPtr<AActor> CurrentDropTarget;

	UPROPERTY()
	TWeakObjectPtr<AActor> LastHoveredActor;

	UPROPERTY()
	TObjectPtr<UDecalComponent> ActiveClickDecal;
};
