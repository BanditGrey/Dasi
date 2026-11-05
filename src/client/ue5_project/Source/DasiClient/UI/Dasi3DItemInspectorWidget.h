// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "DasiInventoryTypes.h"
#include "Dasi3DItemInspectorWidget.generated.h"

class UTextureRenderTarget2D;
class UStaticMeshComponent;

/**
 * Tooltip 3D de Inspeção Detalhada de Itens
 * Renderiza miniatura 3D giratória em tempo real com shaders PBR e auras de refinamento (+0 a +15)
 */
UCLASS()
class DASICLIENT_API UDasi3DItemInspectorWidget : public UUserWidget
{
    GENERATED_BODY()

public:
    UDasi3DItemInspectorWidget(const FObjectInitializer& ObjectInitializer);

    virtual void NativeConstruct() override;
    virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

    // --- Configuração dos Dados do Item para Inspeção ---
    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inspector")
    void SetInspectedItem(const FDasiInventoryItemInstance& ItemData, const FDasiInventoryItemInstance* EquippedComparisonItem = nullptr);

    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inspector")
    void ClearInspectedItem();

    // --- Controle da Miniatura 3D ---
    UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Inspector")
    void SetItemPreviewMesh(UStaticMesh* InMesh, int32 RefinementLevel);

protected:
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Inspector")
    FDasiInventoryItemInstance CurrentItem;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Inspector")
    bool bHasInspectedItem = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Inspector")
    bool bHasComparison = false;

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Inspector")
    float PreviewMeshRotationSpeed = 35.0f; // Graus por segundo

    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Inspector")
    float CurrentMeshYaw = 0.0f;

    // Render Target 3D para a miniatura do item
    UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Inspector")
    TObjectPtr<UTextureRenderTarget2D> ItemPreviewRenderTarget;

    // Textos formatados de atributos e opções
    UPROPERTY(BlueprintReadOnly, Category = "Dasi|UI|Inspector")
    FText ItemFormattedTitle;

    UPROPERTY(BlueprintReadOnly, Category = "Dasi|UI|Inspector")
    FLinearColor ItemTitleColor;

    UPROPERTY(BlueprintReadOnly, Category = "Dasi|UI|Inspector")
    TArray<FText> PrimaryAttributesList;

    UPROPERTY(BlueprintReadOnly, Category = "Dasi|UI|Inspector")
    TArray<FText> ExcellentOptionsList;

    UPROPERTY(BlueprintReadOnly, Category = "Dasi|UI|Inspector")
    TArray<FText> HarmonyOptionsList;

    UPROPERTY(BlueprintReadOnly, Category = "Dasi|UI|Inspector")
    TArray<FText> RequirementsList;

    // Evento para atualização visual no UMG Blueprint
    UFUNCTION(BlueprintImplementableEvent, Category = "Dasi|UI|Events")
    void OnItemDataRefreshed();

private:
    void FormatItemData(const FDasiInventoryItemInstance* EquippedComparisonItem);
};
