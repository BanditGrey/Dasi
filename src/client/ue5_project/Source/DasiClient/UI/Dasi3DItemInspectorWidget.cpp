// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "UI/Dasi3DItemInspectorWidget.h"
#include "Engine/StaticMesh.h"
#include "Engine/TextureRenderTarget2D.h"

UDasi3DItemInspectorWidget::UDasi3DItemInspectorWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    bHasInspectedItem = false;
    bHasComparison = false;
    PreviewMeshRotationSpeed = 35.0f;
    CurrentMeshYaw = 0.0f;
    ItemTitleColor = FLinearColor::White;
}

void UDasi3DItemInspectorWidget::NativeConstruct()
{
    Super::NativeConstruct();
}

void UDasi3DItemInspectorWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
    Super::NativeTick(MyGeometry, InDeltaTime);

    if (bHasInspectedItem)
    {
        CurrentMeshYaw += PreviewMeshRotationSpeed * InDeltaTime;
        if (CurrentMeshYaw >= 360.0f)
        {
            CurrentMeshYaw -= 360.0f;
        }
    }
}

void UDasi3DItemInspectorWidget::SetInspectedItem(const FDasiInventoryItemInstance& ItemData, const FDasiInventoryItemInstance* EquippedComparisonItem)
{
    CurrentItem = ItemData;
    bHasInspectedItem = true;
    bHasComparison = (EquippedComparisonItem != nullptr);

    FormatItemData(EquippedComparisonItem);
    OnItemDataRefreshed();
}

void UDasi3DItemInspectorWidget::ClearInspectedItem()
{
    bHasInspectedItem = false;
    bHasComparison = false;
    ItemFormattedTitle = FText::GetEmpty();
    PrimaryAttributesList.Empty();
    ExcellentOptionsList.Empty();
    HarmonyOptionsList.Empty();
    RequirementsList.Empty();
    OnItemDataRefreshed();
}

void UDasi3DItemInspectorWidget::SetItemPreviewMesh(UStaticMesh* InMesh, int32 RefinementLevel)
{
    CurrentMeshYaw = 0.0f;
    // Vincula a malha estática ao SceneCapture do tooltip
}

void UDasi3DItemInspectorWidget::FormatItemData(const FDasiInventoryItemInstance* EquippedComparisonItem)
{
    PrimaryAttributesList.Empty();
    ExcellentOptionsList.Empty();
    HarmonyOptionsList.Empty();
    RequirementsList.Empty();

    // 1. Título e Cor por Categoria de Raridade
    FString TitleStr = CurrentItem.ItemDefinitionId;
    if (CurrentItem.Level > 0)
    {
        TitleStr += FString::Printf(TEXT(" +%d"), CurrentItem.Level);
    }

    if (CurrentItem.ExcellentMask > 0)
    {
        TitleStr = FString::Printf(TEXT("Excelente %s"), *TitleStr);
        // Verde Neon Clássico de Item Excelente
        ItemTitleColor = FLinearColor(0.15f, 1.0f, 0.25f, 1.0f);
    }
    else if (CurrentItem.Level >= 7)
    {
        // Dourado para itens +7 a +15
        ItemTitleColor = FLinearColor(1.0f, 0.85f, 0.2f, 1.0f);
    }
    else
    {
        // Branco para itens comuns
        ItemTitleColor = FLinearColor::White;
    }

    ItemFormattedTitle = FText::FromString(TitleStr);

    // 2. Atributos Primários (Dano / Defesa / Durabilidade)
    if (CurrentItem.Category == EDasiItemCategory::Weapon)
    {
        PrimaryAttributesList.Add(FText::FromString(FString::Printf(TEXT("Dano de Ataque: %d ~ %d"), CurrentItem.BaseDamageMin, CurrentItem.BaseDamageMax)));
        PrimaryAttributesList.Add(FText::FromString(FString::Printf(TEXT("Velocidade de Ataque: %d"), CurrentItem.AttackSpeedBonus)));
    }
    else
    {
        PrimaryAttributesList.Add(FText::FromString(FString::Printf(TEXT("Defesa Física: %d"), CurrentItem.BaseDefense)));
    }
    PrimaryAttributesList.Add(FText::FromString(FString::Printf(TEXT("Durabilidade: %d / %d"), CurrentItem.Durability, CurrentItem.MaxDurability)));

    // 3. Opções Excelentes (Bitmask)
    if (CurrentItem.ExcellentMask & (1 << 0))
    {
        ExcellentOptionsList.Add(FText::FromString(TEXT("✦ Dano Excelente +10%")));
    }
    if (CurrentItem.ExcellentMask & (1 << 1))
    {
        ExcellentOptionsList.Add(FText::FromString(TEXT("✦ Aumento de Dano por Nível (Nível/20)")));
    }
    if (CurrentItem.ExcellentMask & (1 << 2))
    {
        ExcellentOptionsList.Add(FText::FromString(TEXT("✦ Velocidade de Ataque +7")));
    }
    if (CurrentItem.ExcellentMask & (1 << 3))
    {
        ExcellentOptionsList.Add(FText::FromString(TEXT("✦ Recuperação de Vida ao Derrotar Monstro (Vida/8)")));
    }

    // 4. Opção da Joia da Harmonia
    if (CurrentItem.HarmonyOptionId > 0)
    {
        HarmonyOptionsList.Add(FText::FromString(FString::Printf(TEXT("✧ [Harmonia] Poder Arcano Adicional +%d"), CurrentItem.HarmonyValue)));
    }

    // 5. Requisitos de Atributos
    if (CurrentItem.RequiredStrength > 0)
    {
        RequirementsList.Add(FText::FromString(FString::Printf(TEXT("Força Necessária: %d"), CurrentItem.RequiredStrength)));
    }
    if (CurrentItem.RequiredAgility > 0)
    {
        RequirementsList.Add(FText::FromString(FString::Printf(TEXT("Agilidade Necessária: %d"), CurrentItem.RequiredAgility)));
    }
    if (CurrentItem.RequiredLevel > 0)
    {
        RequirementsList.Add(FText::FromString(FString::Printf(TEXT("Nível Mínimo: %d"), CurrentItem.RequiredLevel)));
    }
}
