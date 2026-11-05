// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "DasiInventoryTypes.h"
#include "DasiUITypes.generated.h"

/**
 * Tipo de Notificação no HUD
 */
UENUM(BlueprintType)
enum class EDasiUINotificationType : uint8
{
    Info UMETA(DisplayName = "Informação"),
    Warning UMETA(DisplayName = "Aviso"),
    JewelDrop UMETA(DisplayName = "Queda de Joia Lendária"),
    BossAlert UMETA(DisplayName = "Alerta de Invasão de Chefe"),
    PvpAlert UMETA(DisplayName = "Ataque de Jogador PK"),
    LevelUp UMETA(DisplayName = "Subida de Nível")
};

/**
 * Estado Dinâmico de Fluido 3D para Globos de HP e Mana
 */
USTRUCT(BlueprintType)
struct FDasiOrbFluidState
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Fluids")
    float CurrentPercentage = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Fluids")
    float TargetPercentage = 1.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Fluids")
    float TurbulenceIntensity = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Fluids")
    float Viscosity = 0.85f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Fluids")
    FLinearColor FluidColor = FLinearColor(0.85f, 0.05f, 0.05f, 1.0f); // Vermelho para HP, Azul para MP
};

/**
 * Slot de Ação Rápida (Action Bar)
 */
USTRUCT(BlueprintType)
struct FDasiActionBarSlot
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|ActionBar")
    FName ActionKey = NAME_None; // Ex: 'Q', 'W', 'E', 'R', 'Space', 'LMB', 'RMB'

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|ActionBar")
    FName SkillId = NAME_None;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|ActionBar")
    FText DisplayName = FText::GetEmpty();

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|ActionBar")
    float CooldownDuration = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|ActionBar")
    float RemainingCooldown = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|ActionBar")
    int32 ManaCost = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|ActionBar")
    int32 StaminaCost = 0;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|ActionBar")
    bool bIsReady = true;
};

/**
 * Dados de Telemetria de Alvo (Target Plate)
 */
USTRUCT(BlueprintType)
struct FDasiTargetPlateData
{
    GENERATED_BODY()

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    FString TargetId;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    FText TargetName;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    int32 Level = 1;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    int32 CurrentHp = 100;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    int32 MaxHp = 100;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    float PoisePercentage = 1.0f; // Postura para Stagger

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    bool bIsBoss = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    int32 BossPhase = 1;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Target")
    int32 MaxBossPhases = 1;
};
