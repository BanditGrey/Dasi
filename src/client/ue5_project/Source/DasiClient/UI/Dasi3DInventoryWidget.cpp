// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "UI/Dasi3DInventoryWidget.h"
#include "Character/DasiCharacterBase.h"
#include "Inventory/DasiInventoryComponent.h"
#include "Engine/TextureRenderTarget2D.h"

UDasi3DInventoryWidget::UDasi3DInventoryWidget(const FObjectInitializer& ObjectInitializer)
    : Super(ObjectInitializer)
{
    CurrentPaperdollYaw = 0.0f;
    TargetPaperdollYaw = 0.0f;
    bIsDraggingPaperdoll = false;
    bIsDualPaneLayout = true;
}

void UDasi3DInventoryWidget::NativeConstruct()
{
    Super::NativeConstruct();
}

void UDasi3DInventoryWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
    Super::NativeTick(MyGeometry, InDeltaTime);

    // Suavização da rotação do Paperdoll 3D no estúdio de iluminação
    if (!FMath::IsNearlyEqual(CurrentPaperdollYaw, TargetPaperdollYaw, 0.05f))
    {
        CurrentPaperdollYaw = FMath::FInterpTo(CurrentPaperdollYaw, TargetPaperdollYaw, InDeltaTime, 12.0f);
        if (PreviewCharacterActor)
        {
            PreviewCharacterActor->SetActorRotation(FRotator(0.0f, CurrentPaperdollYaw, 0.0f));
        }
    }
}

void UDasi3DInventoryWidget::SetPaperdollRotation(float YawDelta)
{
    TargetPaperdollYaw += YawDelta;
    // Normalizar entre [-180, 180]
    while (TargetPaperdollYaw > 180.0f) TargetPaperdollYaw -= 360.0f;
    while (TargetPaperdollYaw < -180.0f) TargetPaperdollYaw += 360.0f;
}

void UDasi3DInventoryWidget::ResetPaperdollOrientation()
{
    TargetPaperdollYaw = 0.0f;
}

void UDasi3DInventoryWidget::SetupPaperdollStudio(ADasiCharacterBase* InCharacterPreviewActor)
{
    PreviewCharacterActor = InCharacterPreviewActor;
    if (PreviewCharacterActor)
    {
        PreviewCharacterActor->SetActorRotation(FRotator(0.0f, 0.0f, 0.0f));
    }
}

void UDasi3DInventoryWidget::BindInventoryComponent(UDasiInventoryComponent* InInventoryComponent)
{
    LinkedInventory = InInventoryComponent;
    if (LinkedInventory)
    {
        RefreshInventoryGrid();
        RefreshEquipmentSlots();
    }
}

void UDasi3DInventoryWidget::RefreshInventoryGrid()
{
    OnInventoryDataUpdated();
}

void UDasi3DInventoryWidget::RefreshEquipmentSlots()
{
    OnInventoryDataUpdated();
}

void UDasi3DInventoryWidget::OnCellHovered(int32 X, int32 Y)
{
    if (!LinkedInventory) return;

    // Verificar se existe um item cobrindo a célula X, Y
    const TMap<FString, FDasiInventoryItemInstance>& Items = LinkedInventory->GetItems();
    for (const auto& Pair : Items)
    {
        const FDasiInventoryItemInstance& Item = Pair.Value;
        if (Item.Location == EDasiItemLocation::Inventory)
        {
            if (X >= Item.GridX && X < (Item.GridX + Item.Width) &&
                Y >= Item.GridY && Y < (Item.GridY + Item.Height))
            {
                // Item encontrado na célula sob o cursor
                break;
            }
        }
    }
}

void UDasi3DInventoryWidget::OnCellUnhovered()
{
    // Limpar tooltip
}

void UDasi3DInventoryWidget::OnItemRightClicked(const FString& ItemInstanceId)
{
    if (!LinkedInventory) return;

    // Tentar equipar automaticamente se for equipamento compatível
    const FDasiInventoryItemInstance* Item = LinkedInventory->GetItemById(ItemInstanceId);
    if (!Item) return;

    if (Item->Location == EDasiItemLocation::Inventory)
    {
        // Tentar auto-equip no slot principal da categoria
        EDasiEquipmentSlot TargetSlot = EDasiEquipmentSlot::WeaponRight;
        switch (Item->Category)
        {
        case EDasiItemCategory::Helm: TargetSlot = EDasiEquipmentSlot::Helm; break;
        case EDasiItemCategory::Armor: TargetSlot = EDasiEquipmentSlot::Armor; break;
        case EDasiItemCategory::Pants: TargetSlot = EDasiEquipmentSlot::Pants; break;
        case EDasiItemCategory::Gloves: TargetSlot = EDasiEquipmentSlot::Gloves; break;
        case EDasiItemCategory::Boots: TargetSlot = EDasiEquipmentSlot::Boots; break;
        case EDasiItemCategory::Wings: TargetSlot = EDasiEquipmentSlot::Wings; break;
        case EDasiItemCategory::Weapon: TargetSlot = EDasiEquipmentSlot::WeaponRight; break;
        case EDasiItemCategory::Shield: TargetSlot = EDasiEquipmentSlot::WeaponLeft; break;
        default: break;
        }

        RequestEquipItem(ItemInstanceId, TargetSlot);
    }
    else if (Item->Location == EDasiItemLocation::Equipment)
    {
        RequestUnequipItem(Item->EquippedSlot);
    }
}

bool UDasi3DInventoryWidget::RequestMoveItem(const FString& ItemInstanceId, int32 TargetX, int32 TargetY)
{
    if (!LinkedInventory) return false;
    return LinkedInventory->ClientPredictMoveItem(ItemInstanceId, TargetX, TargetY);
}

bool UDasi3DInventoryWidget::RequestEquipItem(const FString& ItemInstanceId, EDasiEquipmentSlot TargetSlot)
{
    if (!LinkedInventory) return false;
    const bool bSuccess = LinkedInventory->ClientPredictEquipItem(ItemInstanceId, TargetSlot);
    OnItemEquippedVisualFeedback(TargetSlot, bSuccess);
    return bSuccess;
}

bool UDasi3DInventoryWidget::RequestUnequipItem(EDasiEquipmentSlot SourceSlot)
{
    if (!LinkedInventory) return false;
    const bool bSuccess = LinkedInventory->ClientPredictUnequipItem(SourceSlot);
    OnItemEquippedVisualFeedback(SourceSlot, bSuccess);
    return bSuccess;
}
