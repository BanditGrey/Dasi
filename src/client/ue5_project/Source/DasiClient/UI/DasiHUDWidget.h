// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "DasiUITypes.h"
#include "DasiHUDWidget.generated.h"

class UMaterialInstanceDynamic;
class UDasiTargetPlateWidget;
class UDasi3DInventoryWidget;

/**
 * Widget Master de HUD em 3D / Diegético do Dasi
 * Governa orbes volumétricos de fluido 3D, barras de ação rápida e telemetria de combate.
 */
UCLASS()
class DASICLIENT_API UDasiHUDWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UDasiHUDWidget(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;
    virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

    // --- Atualizações de Atributos Vitais com Simulação de Fluido ---
    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Vitals")
    void UpdateHealth(int32 Current, int32 Max);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Vitals")
    void UpdateMana(int32 Current, int32 Max);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Vitals")
    void UpdateStamina(int32 Current, int32 Max);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Vitals")
    void UpdateShieldDefense(int32 Current, int32 Max);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Vitals")
    void UpdateExperience(int64 CurrentXp, int64 NextLevelXp);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Vitals")
    void TriggerDamageTurbulence(float DamageNormalized);

    // --- Layout & Alinhamento Homologado (Centro Unificado em Arco) ---
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Layout")
    bool bUseUnifiedArcLayout = true;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Layout")
    float UnifiedArcRadius = 320.0f;

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Layout")
    void SetLayoutMode(bool bUnifiedArc);

    // --- Action Bar & Cooldowns ---
    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|ActionBar")
    void SetActionSlotSkill(FName ActionKey, FName SkillId, const FText& DisplayName, float Cooldown, int32 ManaCost, int32 StaminaCost);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|ActionBar")
    void TriggerSkillCooldown(FName ActionKey, float Duration);

    // --- Telemetria de Alvo e Notificações ---
    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Target")
    void SetCurrentTarget(const FDasiTargetPlateData& TargetData);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Target")
    void ClearCurrentTarget();

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Notifications")
    void BroadcastNotification(const FText& Message, EDasiUINotificationType Type, float DurationSeconds = 4.0f);

protected:
    // Dynamic Material Instances para os orbes de fluido 3D
    UPROPERTY(Transient, BlueprintReadOnly, Category = "Dasi|UI|Materials")
    TObjectPtr<UMaterialInstanceDynamic> HealthOrbMID;

    UPROPERTY(Transient, BlueprintReadOnly, Category = "Dasi|UI|Materials")
    TObjectPtr<UMaterialInstanceDynamic> ManaOrbMID;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Fluids")
    FDasiOrbFluidState HealthOrbState;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Fluids")
    FDasiOrbFluidState ManaOrbState;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Vitals")
    float CurrentStaminaPct = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Vitals")
    float CurrentShieldPct = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Vitals")
    float CurrentExperiencePct = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|ActionBar")
    TArray<FDasiActionBarSlot> ActionSlots;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    FDasiTargetPlateData CurrentTargetData;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    bool bHasTarget = false;

    // Métodos Blueprint Implementáveis para Atualização Visual
    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnHealthOrbUpdated(float Percentage, float Turbulence);

    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnManaOrbUpdated(float Percentage, float Turbulence);

    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnTargetChanged(bool bActive, const FDasiTargetPlateData& Target);

    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnNotificationReceived(const FText& Message, EDasiUINotificationType Type);

private:
    void TickFluids(float DeltaTime);
    void TickCooldowns(float DeltaTime);
};
