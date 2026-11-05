// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "Inventory/DasiInventoryTypes.h"
#include "Network/DasiNetworkTypes.h"
#include "DasiInventoryComponent.generated.h"

class UDasiNetworkSubsystem;

// Delegates dinâmicos para a interface UMG
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnDasiInventoryUpdated);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnDasiItemPlacedInGrid, const FString&, ItemUuid, int32, X, int32, Y);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiItemRemovedFromGrid, const FString&, ItemUuid);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnDasiEquipmentSlotChanged, EDasiEquipmentSlot, Slot, bool, bEquipped, const FDasiItemInstance&, Item);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnDasiInventoryOperationFailed, const FString&, ItemUuid, const FString&, ErrorMessage);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiJewelRefineOutcome, const FDasiJewelRefineResult&, Result);

/**
 * Snapshot para reversão rápida em caso de rejeição da predição pelo servidor
 */
struct FDasiInventorySnapshot
{
	TMap<FString, FDasiPlacedItem> GridItems;
	TMap<EDasiEquipmentSlot, FDasiItemInstance> EquippedItems;
};

/**
 * Componente de Inventário 8x8 & Equipamento do Jogador
 * Suporta predição otimista de cliente com reconciliação autoritativa do servidor,
 * rotação de itens 90°, cálculo de integridade de ocupação de slots e integração com UMG.
 */
UCLASS(ClassGroup = (Dasi), meta = (BlueprintSpawnableComponent))
class DASICLIENT_API UDasiInventoryComponent : public UActorComponent
{
	GENERATED_BODY()

public:
	UDasiInventoryComponent();

	virtual void BeginPlay() override;
	virtual void EndPlay(const EEndPlayReason::Type EndPlayReason) override;

	// ==========================================
	// DELEGATES DE EVENTOS PARA UI UMG
	// ==========================================

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Inventory|Events")
	FOnDasiInventoryUpdated OnInventoryUpdated;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Inventory|Events")
	FOnDasiItemPlacedInGrid OnItemPlacedInGrid;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Inventory|Events")
	FOnDasiItemRemovedFromGrid OnItemRemovedFromGrid;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Inventory|Events")
	FOnDasiEquipmentSlotChanged OnEquipmentSlotChanged;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Inventory|Events")
	FOnDasiInventoryOperationFailed OnInventoryOperationFailed;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Inventory|Events")
	FOnDasiJewelRefineOutcome OnJewelRefineOutcome;

	// ==========================================
	// CONSULTAS E LEITURAS (GETTERS)
	// ==========================================

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	int32 GetGridCols() const { return GridCols; }

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	int32 GetGridRows() const { return GridRows; }

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	bool GetPlacedItem(const FString& ItemUuid, FDasiPlacedItem& OutPlacedItem) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	bool GetEquippedItem(EDasiEquipmentSlot Slot, FDasiItemInstance& OutItem) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	TArray<FDasiPlacedItem> GetAllGridItems() const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	TArray<FDasiEquippedItem> GetAllEquippedItems() const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	const FString& GetOccupantUuidAt(int32 X, int32 Y) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	bool FindItemDefinition(const FString& DefId, FDasiItemDefinition& OutDefinition) const;

	// ==========================================
	// VALIDAÇÃO ESPACIAL DE GRADE 8x8
	// ==========================================

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	bool CanPlaceItemAt(const FDasiItemInstance& Item, int32 TargetX, int32 TargetY, bool bRotated, const FString& IgnoreUuid = TEXT("")) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	bool FindFreeSpace(int32 Width, int32 Height, int32& OutX, int32& OutY) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Inventory")
	bool CanEquipInSlot(const FDasiItemInstance& Item, EDasiEquipmentSlot TargetSlot, FString& OutFailReason) const;

	// ==========================================
	// AÇÕES DO JOGADOR (COM PREDIÇÃO DE CLIENTE)
	// ==========================================

	UFUNCTION(BlueprintCallable, Category = "Dasi|Inventory|Actions")
	bool PredictMoveGridItem(const FString& ItemUuid, int32 TargetX, int32 TargetY, bool bRotated);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Inventory|Actions")
	bool PredictEquipItem(const FString& ItemUuid, EDasiEquipmentSlot TargetSlot);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Inventory|Actions")
	bool PredictUnequipItem(EDasiEquipmentSlot SourceSlot, int32 TargetX, int32 TargetY, bool bRotated);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Inventory|Actions")
	bool RotateGridItem(const FString& ItemUuid);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Inventory|Actions")
	void ApplyJewel(const FString& JewelUuid, const FString& TargetUuid, EDasiLocationType TargetLocation, EDasiEquipmentSlot TargetSlot = EDasiEquipmentSlot::None, int32 TargetX = 0, int32 TargetY = 0);

	// ==========================================
	// RECONCILIAÇÃO COM O SERVIDOR
	// ==========================================

	UFUNCTION(BlueprintCallable, Category = "Dasi|Inventory|Reconciliation")
	void ReconcileWithServer(const FDasiInventoryState& ServerState);

protected:
	// Handlers vinculados ao UDasiNetworkSubsystem
	UFUNCTION()
	void HandleNetworkInventorySynced(const FDasiInventoryState& State, const TArray<FDasiItemDefinition>& Definitions);

	UFUNCTION()
	void HandleNetworkItemMoveResult(const FDasiItemMoveResponse& Response);

	UFUNCTION()
	void HandleNetworkJewelRefineResult(const FDasiJewelRefineResult& Result);

	// Reconstrução de mapa de ocupação 8x8
	void RebuildGridOccupancy();
	void ClearGridOccupancy();
	void MarkItemInOccupancy(const FString& ItemUuid, int32 X, int32 Y, int32 Width, int32 Height);
	void UnmarkItemInOccupancy(int32 X, int32 Y, int32 Width, int32 Height);

	// Snapshots e Rollback
	void SaveRollbackSnapshot();
	void RollbackToSnapshot();

	UDasiNetworkSubsystem* GetNetworkSubsystem() const;

private:
	static constexpr int32 GridCols = 8;
	static constexpr int32 GridRows = 8;

	// Matriz de ocupação de slots: [Y * 8 + X] armazena ItemUuid ou Vazio
	FString GridSlots[GridCols * GridRows];

	// Itens na bolsa 8x8 indexados por UUID
	UPROPERTY()
	TMap<FString, FDasiPlacedItem> GridItemsMap;

	// Itens equipados nos slots de Paperdoll
	UPROPERTY()
	TMap<EDasiEquipmentSlot, FDasiItemInstance> EquippedSlotsMap;

	// Catálogo de definições de itens cacheado do servidor
	UPROPERTY()
	TMap<FString, FDasiItemDefinition> ItemDefinitionsCache;

	// Snapshot recente para reversão em caso de descarte pelo servidor
	FDasiInventorySnapshot RollbackSnapshot;
	bool bHasPendingPrediction = false;
};
