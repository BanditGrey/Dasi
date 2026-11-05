// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "DasiUITypes.h"
#include "DasiTargetPlateWidget.generated.h"

/**
 * Placa de Alvo 3D & Barra de Chefes de Invasão (World Boss HUD)
 */
UCLASS()
class DASICLIENT_API UDasiTargetPlateWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UDasiTargetPlateWidget(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;
    virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Target")
    void SetTargetData(const FDasiTargetPlateData& InData);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Target")
    void UpdateTargetHp(int32 CurrentHp, int32 MaxHp);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Target")
    void UpdateTargetPoise(float CurrentPoise, float MaxPoise);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Target")
    void ClearTarget();

protected:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    FDasiTargetPlateData TargetData;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    float CurrentHpPercentage = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    float TargetHpPercentage = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    float GhostHpPercentage = 1.0f; // Barra de dano recente que desce lentamente

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    float PoisePercentage = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    bool bIsStaggered = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    FLinearColor DifficultyThreatColor = FLinearColor::White;

    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnTargetHpChanged(float CurrentPct, float GhostPct);

    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnTargetStaggerTriggered();

    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnTargetPlateCleared();

private:
    void CalculateThreatColor(int32 PlayerLevel);
};
