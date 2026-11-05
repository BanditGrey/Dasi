// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "DasiInventoryTypes.h"
#include "Dasi3DInventoryWidget.generated.h"

class UTextureRenderTarget2D;
class USceneCaptureComponent2D;
class ADasiCharacterBase;
class UDasiInventoryComponent;
class UDasi3DItemInspectorWidget;

/**
 * Widget UMG 3D para o Inventário 8x8 e Paperdoll Interativo em Tempo Real
 */
UCLASS()
class DASICLIENT_API UDasi3DInventoryWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UDasi3DInventoryWidget(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;
    virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

    // --- Controle do Paperdoll 3D em Tempo Real ---
    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Paperdoll")
    void SetPaperdollRotation(float YawDelta);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Paperdoll")
    void ResetPaperdollOrientation();

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Paperdoll")
    void SetupPaperdollStudio(ADasiCharacterBase* InCharacterPreviewActor);

    // --- Layout Homologado (Janela Dupla Lado a Lado) ---
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Layout")
    bool bIsDualPaneLayout = true;

    // --- Vinculação com o Componente Autoritativo de Inventário ---
    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inventory")
    void BindInventoryComponent(UDasiInventoryComponent* InInventoryComponent);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inventory")
    void RefreshInventoryGrid();

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inventory")
    void RefreshEquipmentSlots();

    // --- Interações do Usuário (Clique, Drag & Drop, Inspeção) ---
    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inventory")
    void OnCellHovered(int32 X, int32 Y);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inventory")
    void OnCellUnhovered();

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inventory")
    void OnItemRightClicked(const FString& ItemInstanceId);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inventory")
    bool RequestMoveItem(const FString& ItemInstanceId, int32 TargetX, int32 TargetY);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inventory")
    bool RequestEquipItem(const FString& ItemInstanceId, EDasiEquipmentSlot TargetSlot);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inventory")
    bool RequestUnequipItem(EDasiEquipmentSlot SourceSlot);

protected:
    // Render Target 3D para o Paperdoll do Herói
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Paperdoll")
    TObjectPtr<UTextureRenderTarget2D> PaperdollRenderTarget;

    UPROPERTY(Transient, BlueprintReadOnly, Category = "Dasi|UI|Paperdoll")
    TObjectPtr<ADasiCharacterBase> PreviewCharacterActor;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Paperdoll")
    float CurrentPaperdollYaw = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Paperdoll")
    float TargetPaperdollYaw = 0.0f;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Paperdoll")
    bool bIsDraggingPaperdoll = false;

    // Componente de Inventário Vinculado
    UPROPERTY(Transient, BlueprintReadOnly, Category = "Dasi|UI|Inventory")
    TObjectPtr<UDasiInventoryComponent> LinkedInventory;

    // Referência ao Widget de Inspeção 3D de Itens (Tooltip)
    UPROPERTY(BlueprintReadWrite, Category = "Dasi|UI|Inspector")
    TObjectPtr<UDasi3DItemInspectorWidget> ItemInspectorWidget;

    // Dimensões Canônicas da Grade 8x8
    static constexpr int32 GRID_COLS = 8;
    static constexpr int32 GRID_ROWS = 8;

    // Eventos Blueprint para Animações e Feedback
    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnInventoryDataUpdated();

    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnItemEquippedVisualFeedback(EDasiEquipmentSlot Slot, bool bSuccess);

    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnItemGlowLevelChanged(int32 NewGlowLevel);
};
