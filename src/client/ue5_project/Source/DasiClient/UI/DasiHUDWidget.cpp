// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "UI/DasiHUDWidget.h"
#include "Materials/MaterialInstanceDynamic.h"

UDasiHUDWidget::UDasiHUDWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    // Cores e estados iniciais dos fluidos 3D
    HealthOrbState.FluidColor = FLinearColor(0.85f, 0.05f, 0.05f, 1.0f);
    HealthOrbState.CurrentPercentage = 1.0f;
    HealthOrbState.TargetPercentage = 1.0f;
    HealthOrbState.TurbulenceIntensity = 0.0f;
    HealthOrbState.Viscosity = 0.85f;

    ManaOrbState.FluidColor = FLinearColor(0.05f, 0.25f, 0.95f, 1.0f);
    ManaOrbState.CurrentPercentage = 1.0f;
    ManaOrbState.TargetPercentage = 1.0f;
    ManaOrbState.TurbulenceIntensity = 0.0f;
    ManaOrbState.Viscosity = 0.70f;

    // Configurar slots de ação padrão (Q, W, E, R, Space, LMB, RMB)
    ActionSlots.SetNum(7);

    ActionSlots[0].ActionKey = FName(TEXT("Q"));
    ActionSlots[0].DisplayName = FText::FromString(TEXT("Poção de Vida"));

    ActionSlots[1].ActionKey = FName(TEXT("W"));
    ActionSlots[1].DisplayName = FText::FromString(TEXT("Poção de Mana"));

    ActionSlots[2].ActionKey = FName(TEXT("E"));
    ActionSlots[2].DisplayName = FText::FromString(TEXT("Twisting Slash"));

    ActionSlots[3].ActionKey = FName(TEXT("R"));
    ActionSlots[3].DisplayName = FText::FromString(TEXT("Death Stab"));

    ActionSlots[4].ActionKey = FName(TEXT("Space"));
    ActionSlots[4].DisplayName = FText::FromString(TEXT("Esquiva Tática"));

    ActionSlots[5].ActionKey = FName(TEXT("LMB"));
    ActionSlots[5].DisplayName = FText::FromString(TEXT("Ataque Básico"));

    ActionSlots[6].ActionKey = FName(TEXT("RMB"));
    ActionSlots[6].DisplayName = FText::FromString(TEXT("Combo Rúnico"));

    bUseUnifiedArcLayout = true;
    UnifiedArcRadius = 320.0f;
}

void UDasiHUDWidget::SetLayoutMode(bool bUnifiedArc)
{
    bUseUnifiedArcLayout = bUnifiedArc;
}

void UDasiHUDWidget::NativeConstruct()
{
    Super::NativeConstruct();
}

void UDasiHUDWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
    Super::NativeTick(MyGeometry, InDeltaTime);

    TickFluids(InDeltaTime);
    TickCooldowns(InDeltaTime);
}

void UDasiHUDWidget::TickFluids(float DeltaTime)
{
    // Interpolação suave de nível de fluido de Vida
    HealthOrbState.CurrentPercentage = FMath::FInterpTo(
        HealthOrbState.CurrentPercentage,
        HealthOrbState.TargetPercentage,
        DeltaTime,
        8.0f
    );

    // Decaimento de turbulência com viscosidade
    HealthOrbState.TurbulenceIntensity = FMath::FInterpTo(
        HealthOrbState.TurbulenceIntensity,
        0.0f,
        DeltaTime,
        5.0f * HealthOrbState.Viscosity
    );

    if (HealthOrbMID)
    {
        HealthOrbMID->SetScalarParameterValue(FName(TEXT("FluidLevel")), HealthOrbState.CurrentPercentage);
        HealthOrbMID->SetScalarParameterValue(FName(TEXT("Turbulence")), HealthOrbState.TurbulenceIntensity);
    }
    OnHealthOrbUpdated(HealthOrbState.CurrentPercentage, HealthOrbState.TurbulenceIntensity);

    // Interpolação suave de nível de fluido de Mana
    ManaOrbState.CurrentPercentage = FMath::FInterpTo(
        ManaOrbState.CurrentPercentage,
        ManaOrbState.TargetPercentage,
        DeltaTime,
        6.0f
    );

    ManaOrbState.TurbulenceIntensity = FMath::FInterpTo(
        ManaOrbState.TurbulenceIntensity,
        0.0f,
        DeltaTime,
        4.0f * ManaOrbState.Viscosity
    );

    if (ManaOrbMID)
    {
        ManaOrbMID->SetScalarParameterValue(FName(TEXT("FluidLevel")), ManaOrbState.CurrentPercentage);
        ManaOrbMID->SetScalarParameterValue(FName(TEXT("Turbulence")), ManaOrbState.TurbulenceIntensity);
    }
    OnManaOrbUpdated(ManaOrbState.CurrentPercentage, ManaOrbState.TurbulenceIntensity);
}

void UDasiHUDWidget::TickCooldowns(float DeltaTime)
{
    for (FDasiActionBarSlot& Slot : ActionSlots)
    {
        if (Slot.RemainingCooldown > 0.0f)
        {
            Slot.RemainingCooldown = FMath::Max(0.0f, Slot.RemainingCooldown - DeltaTime);
            Slot.bIsReady = (Slot.RemainingCooldown <= 0.0f);
        }
    }
}

void UDasiHUDWidget::UpdateHealth(int32 Current, int32 Max)
{
    if (Max <= 0) return;
    const float TargetPct = FMath::Clamp(static_cast<float>(Current) / static_cast<float>(Max), 0.0f, 1.0f);
    
    // Se sofreu perda brusca, injeta turbulência proporcional
    if (TargetPct < HealthOrbState.TargetPercentage)
    {
        const float DeltaLoss = HealthOrbState.TargetPercentage - TargetPct;
        TriggerDamageTurbulence(DeltaLoss);
    }
    HealthOrbState.TargetPercentage = TargetPct;
}

void UDasiHUDWidget::UpdateMana(int32 Current, int32 Max)
{
    if (Max <= 0) return;
    ManaOrbState.TargetPercentage = FMath::Clamp(static_cast<float>(Current) / static_cast<float>(Max), 0.0f, 1.0f);
}

void UDasiHUDWidget::UpdateStamina(int32 Current, int32 Max)
{
    if (Max <= 0) return;
    CurrentStaminaPct = FMath::Clamp(static_cast<float>(Current) / static_cast<float>(Max), 0.0f, 1.0f);
}

void UDasiHUDWidget::UpdateShieldDefense(int32 Current, int32 Max)
{
    if (Max <= 0) return;
    CurrentShieldPct = FMath::Clamp(static_cast<float>(Current) / static_cast<float>(Max), 0.0f, 1.0f);
}

void UDasiHUDWidget::UpdateExperience(int64 CurrentXp, int64 NextLevelXp)
{
    if (NextLevelXp <= 0) return;
    CurrentExperiencePct = FMath::Clamp(static_cast<float>(CurrentXp) / static_cast<float>(NextLevelXp), 0.0f, 1.0f);
}

void UDasiHUDWidget::TriggerDamageTurbulence(float DamageNormalized)
{
    HealthOrbState.TurbulenceIntensity = FMath::Clamp(HealthOrbState.TurbulenceIntensity + (DamageNormalized * 2.5f), 0.0f, 2.0f);
}

void UDasiHUDWidget::SetActionSlotSkill(FName ActionKey, FName SkillId, const FText& DisplayName, float Cooldown, int32 ManaCost, int32 StaminaCost)
{
    for (FDasiActionBarSlot& Slot : ActionSlots)
    {
        if (Slot.ActionKey == ActionKey)
        {
            Slot.SkillId = SkillId;
            Slot.DisplayName = DisplayName;
            Slot.CooldownDuration = Cooldown;
            Slot.RemainingCooldown = 0.0f;
            Slot.ManaCost = ManaCost;
            Slot.StaminaCost = StaminaCost;
            Slot.bIsReady = true;
            break;
        }
    }
}

void UDasiHUDWidget::TriggerSkillCooldown(FName ActionKey, float Duration)
{
    for (FDasiActionBarSlot& Slot : ActionSlots)
    {
        if (Slot.ActionKey == ActionKey)
        {
            Slot.CooldownDuration = Duration;
            Slot.RemainingCooldown = Duration;
            Slot.bIsReady = false;
            break;
        }
    }
}

void UDasiHUDWidget::SetCurrentTarget(const FDasiTargetPlateData& TargetData)
{
    CurrentTargetData = TargetData;
    bHasTarget = true;
    OnTargetChanged(true, CurrentTargetData);
}

void UDasiHUDWidget::ClearCurrentTarget()
{
    bHasTarget = false;
    CurrentTargetData = FDasiTargetPlateData();
    OnTargetChanged(false, CurrentTargetData);
}

void UDasiHUDWidget::BroadcastNotification(const FText& Message, EDasiUINotificationType Type, float DurationSeconds)
{
    OnNotificationReceived(Message, Type);
}
