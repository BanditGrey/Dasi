// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "UI/DasiTargetPlateWidget.h"

UDasiTargetPlateWidget::UDasiTargetPlateWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    CurrentHpPercentage = 1.0f;
    TargetHpPercentage = 1.0f;
    GhostHpPercentage = 1.0f;
    PoisePercentage = 1.0f;
    bIsStaggered = false;
    DifficultyThreatColor = FLinearColor::White;
}

void UDasiTargetPlateWidget::NativeConstruct()
{
    Super::NativeConstruct();
}

void UDasiTargetPlateWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
    Super::NativeTick(MyGeometry, InDeltaTime);

    // HP real move rápido
    CurrentHpPercentage = FMath::FInterpTo(CurrentHpPercentage, TargetHpPercentage, InDeltaTime, 14.0f);

    // Barra fantasma move devagar com atraso perceptível
    if (GhostHpPercentage > CurrentHpPercentage)
    {
        GhostHpPercentage = FMath::FInterpTo(GhostHpPercentage, CurrentHpPercentage, InDeltaTime, 3.5f);
    }
    else
    {
        GhostHpPercentage = CurrentHpPercentage;
    }

    OnTargetHpChanged(CurrentHpPercentage, GhostHpPercentage);
}

void UDasiTargetPlateWidget::SetTargetData(const FDasiTargetPlateData& InData)
{
    TargetData = InData;
    if (TargetData.MaxHp > 0)
    {
        TargetHpPercentage = FMath::Clamp(static_cast<float>(TargetData.CurrentHp) / static_cast<float>(TargetData.MaxHp), 0.0f, 1.0f);
        CurrentHpPercentage = TargetHpPercentage;
        GhostHpPercentage = TargetHpPercentage;
    }
    PoisePercentage = FMath::Clamp(TargetData.PoisePercentage, 0.0f, 1.0f);
    bIsStaggered = (PoisePercentage <= 0.0f);

    CalculateThreatColor(100); // Exemplo de nível do jogador base
    OnTargetHpChanged(CurrentHpPercentage, GhostHpPercentage);
}

void UDasiTargetPlateWidget::UpdateTargetHp(int32 CurrentHp, int32 MaxHp)
{
    if (MaxHp <= 0) return;
    TargetData.CurrentHp = CurrentHp;
    TargetData.MaxHp = MaxHp;
    TargetHpPercentage = FMath::Clamp(static_cast<float>(CurrentHp) / static_cast<float>(MaxHp), 0.0f, 1.0f);
}

void UDasiTargetPlateWidget::UpdateTargetPoise(float CurrentPoise, float MaxPoise)
{
    if (MaxPoise <= 0.0f) return;
    PoisePercentage = FMath::Clamp(CurrentPoise / MaxPoise, 0.0f, 1.0f);
    const bool bWasStaggered = bIsStaggered;
    bIsStaggered = (PoisePercentage <= 0.0f);

    if (!bWasStaggered && bIsStaggered)
    {
        OnTargetStaggerTriggered();
    }
}

void UDasiTargetPlateWidget::ClearTarget()
{
    TargetData = FDasiTargetPlateData();
    CurrentHpPercentage = 0.0f;
    TargetHpPercentage = 0.0f;
    GhostHpPercentage = 0.0f;
    PoisePercentage = 1.0f;
    bIsStaggered = false;
    OnTargetPlateCleared();
}

void UDasiTargetPlateWidget::CalculateThreatColor(int32 PlayerLevel)
{
    if (TargetData.bIsBoss)
    {
        // Roxo Celestial / Vermelho Sangue para Chefes
        DifficultyThreatColor = FLinearColor(0.85f, 0.1f, 0.85f, 1.0f);
        return;
    }

    const int32 LevelDiff = TargetData.Level - PlayerLevel;
    if (LevelDiff <= -10)
    {
        // Cinza (Inofensivo)
        DifficultyThreatColor = FLinearColor(0.6f, 0.6f, 0.6f, 1.0f);
    }
    else if (LevelDiff <= -3)
    {
        // Verde (Fácil)
        DifficultyThreatColor = FLinearColor(0.2f, 0.85f, 0.3f, 1.0f);
    }
    else if (LevelDiff <= +3)
    {
        // Branco / Amarelo (Equilibrado)
        DifficultyThreatColor = FLinearColor(1.0f, 0.95f, 0.6f, 1.0f);
    }
    else if (LevelDiff <= +8)
    {
        // Laranja (Perigoso)
        DifficultyThreatColor = FLinearColor(1.0f, 0.5f, 0.1f, 1.0f);
    }
    else
    {
        // Vermelho Fogo (Letal)
        DifficultyThreatColor = FLinearColor(0.95f, 0.1f, 0.1f, 1.0f);
    }
}
