// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "Inventory/DasiInventoryComponent.h"
#include "Network/DasiNetworkSubsystem.h"
#include "DasiClient.h"
#include "Engine/GameInstance.h"

UDasiInventoryComponent::UDasiInventoryComponent()
{
	PrimaryComponentTick.bCanEverTick = false;
	ClearGridOccupancy();
}

void UDasiInventoryComponent::BeginPlay()
{
	Super::BeginPlay();

	ClearGridOccupancy();

	if (UDasiNetworkSubsystem* NetSubsystem = GetNetworkSubsystem())
	{
		NetSubsystem->OnInventorySynced.AddDynamic(this, &UDasiInventoryComponent::HandleNetworkInventorySynced);
		NetSubsystem->OnItemMoveResult.AddDynamic(this, &UDasiInventoryComponent::HandleNetworkItemMoveResult);
		NetSubsystem->OnJewelRefineResult.AddDynamic(this, &UDasiInventoryComponent::HandleNetworkJewelRefineResult);

		// Se a conexão já estiver pronta, solicita sincronização inicial
		if (NetSubsystem->IsConnected())
		{
			NetSubsystem->RequestInventorySync();
		}
	}
}

void UDasiInventoryComponent::EndPlay(const EEndPlayReason::Type EndPlayReason)
{
	if (UDasiNetworkSubsystem* NetSubsystem = GetNetworkSubsystem())
	{
		NetSubsystem->OnInventorySynced.RemoveDynamic(this, &UDasiInventoryComponent::HandleNetworkInventorySynced);
		NetSubsystem->OnItemMoveResult.RemoveDynamic(this, &UDasiInventoryComponent::HandleNetworkItemMoveResult);
		NetSubsystem->OnJewelRefineResult.RemoveDynamic(this, &UDasiInventoryComponent::HandleNetworkJewelRefineResult);
	}

	Super::EndPlay(EndPlayReason);
}

UDasiNetworkSubsystem* UDasiInventoryComponent::GetNetworkSubsystem() const
{
	if (const UWorld* World = GetWorld())
	{
		if (const UGameInstance* GI = World->GetGameInstance())
		{
			return GI->GetSubsystem<UDasiNetworkSubsystem>();
		}
	}
	return nullptr;
}

// ==========================================
// CONSULTAS E LEITURAS (GETTERS)
// ==========================================

bool UDasiInventoryComponent::GetPlacedItem(const FString& ItemUuid, FDasiPlacedItem& OutPlacedItem) const
{
	if (const FDasiPlacedItem* Found = GridItemsMap.Find(ItemUuid))
	{
		OutPlacedItem = *Found;
		return true;
	}
	return false;
}

bool UDasiInventoryComponent::GetEquippedItem(EDasiEquipmentSlot Slot, FDasiItemInstance& OutItem) const
{
	if (const FDasiItemInstance* Found = EquippedSlotsMap.Find(Slot))
	{
		OutItem = *Found;
		return true;
	}
	return false;
}

TArray<FDasiPlacedItem> UDasiInventoryComponent::GetAllGridItems() const
{
	TArray<FDasiPlacedItem> Items;
	GridItemsMap.GenerateValueArray(Items);
	return Items;
}

TArray<FDasiEquippedItem> UDasiInventoryComponent::GetAllEquippedItems() const
{
	TArray<FDasiEquippedItem> EquippedList;
	for (const auto& Pair : EquippedSlotsMap)
	{
		FDasiEquippedItem Eq;
		Eq.Slot = Pair.Key;
		Eq.Item = Pair.Value;
		EquippedList.Add(Eq);
	}
	return EquippedList;
}

const FString& UDasiInventoryComponent::GetOccupantUuidAt(int32 X, int32 Y) const
{
	static const FString EmptyString = TEXT("");
	if (X < 0 || X >= GridCols || Y < 0 || Y >= GridRows)
	{
		return EmptyString;
	}
	return GridSlots[Y * GridCols + X];
}

bool UDasiInventoryComponent::FindItemDefinition(const FString& DefId, FDasiItemDefinition& OutDefinition) const
{
	if (const FDasiItemDefinition* Found = ItemDefinitionsCache.Find(DefId))
	{
		OutDefinition = *Found;
		return true;
	}
	return false;
}

// ==========================================
// VALIDAÇÃO ESPACIAL DE GRADE 8x8
// ==========================================

bool UDasiInventoryComponent::CanPlaceItemAt(const FDasiItemInstance& Item, int32 TargetX, int32 TargetY, bool bRotated, const FString& IgnoreUuid) const
{
	int32 BaseW = 1;
	int32 BaseH = 1;

	if (const FDasiItemDefinition* Def = ItemDefinitionsCache.Find(Item.DefId))
	{
		BaseW = Def->Width;
		BaseH = Def->Height;
	}

	const int32 EffectiveW = bRotated ? BaseH : BaseW;
	const int32 EffectiveH = bRotated ? BaseW : BaseH;

	// Verificação de limites da grade 8x8
	if (TargetX < 0 || TargetY < 0 || (TargetX + EffectiveW) > GridCols || (TargetY + EffectiveH) > GridRows)
	{
		return false;
	}

	// Verificação de colisão célula a célula
	for (int32 cy = TargetY; cy < TargetY + EffectiveH; ++cy)
	{
		for (int32 cx = TargetX; cx < TargetX + EffectiveW; ++cx)
		{
			const FString& Occupant = GridSlots[cy * GridCols + cx];
			if (!Occupant.IsEmpty() && Occupant != IgnoreUuid)
			{
				return false; // Colisão detectada
			}
		}
	}

	return true;
}

bool UDasiInventoryComponent::FindFreeSpace(int32 Width, int32 Height, int32& OutX, int32& OutY) const
{
	for (int32 y = 0; y <= GridRows - Height; ++y)
	{
		for (int32 x = 0; x <= GridCols - Width; ++x)
		{
			bool bClear = true;
			for (int32 cy = y; cy < y + Height; ++cy)
			{
				for (int32 cx = x; cx < x + Width; ++cx)
				{
					if (!GridSlots[cy * GridCols + cx].IsEmpty())
					{
						bClear = false;
						break;
					}
				}
				if (!bClear) break;
			}

			if (bClear)
			{
				OutX = x;
				OutY = y;
				return true;
			}
		}
	}

	return false;
}

bool UDasiInventoryComponent::CanEquipInSlot(const FDasiItemInstance& Item, EDasiEquipmentSlot TargetSlot, FString& OutFailReason) const
{
	if (TargetSlot == EDasiEquipmentSlot::None)
	{
		OutFailReason = TEXT("Slot de equipamento inválido");
		return false;
	}

	const FDasiItemDefinition* Def = ItemDefinitionsCache.Find(Item.DefId);
	if (!Def)
	{
		OutFailReason = TEXT("Definição de item não encontrada no catálogo");
		return false;
	}

	// Validação de compatibilidade de slot
	if (Def->ValidEquipSlots.Num() > 0 && !Def->ValidEquipSlots.Contains(TargetSlot))
	{
		OutFailReason = FString::Printf(TEXT("O item %s não pode ser equipado neste slot"), *Def->Name);
		return false;
	}

	// Validação de atributos do personagem
	if (const UDasiNetworkSubsystem* NetSubsystem = GetNetworkSubsystem())
	{
		const FDasiCharacterSummary& Char = NetSubsystem->GetCharacterSummary();

		if (Char.Strength < Def->Requirements.Strength)
		{
			OutFailReason = FString::Printf(TEXT("Força insuficiente: requer %d (atual %d)"), Def->Requirements.Strength, Char.Strength);
			return false;
		}

		if (Char.Agility < Def->Requirements.Agility)
		{
			OutFailReason = FString::Printf(TEXT("Agilidade insuficiente: requer %d (atual %d)"), Def->Requirements.Agility, Char.Agility);
			return false;
		}

		if (Char.Vitality < Def->Requirements.Vitality)
		{
			OutFailReason = FString::Printf(TEXT("Vitalidade insuficiente: requer %d (atual %d)"), Def->Requirements.Vitality, Char.Vitality);
			return false;
		}

		if (Char.Energy < Def->Requirements.Energy)
		{
			OutFailReason = FString::Printf(TEXT("Energia insuficiente: requer %d (atual %d)"), Def->Requirements.Energy, Char.Energy);
			return false;
		}

		if (Def->Requirements.Level > 0 && Char.Level < Def->Requirements.Level)
		{
			OutFailReason = FString::Printf(TEXT("Nível insuficiente: requer %d (atual %d)"), Def->Requirements.Level, Char.Level);
			return false;
		}

		if (Def->Requirements.AllowedClasses.Num() > 0 && !Def->Requirements.AllowedClasses.Contains(Char.CharacterClass))
		{
			OutFailReason = FString::Printf(TEXT("Classe %s incompatível com este equipamento"), *Char.CharacterClass);
			return false;
		}
	}

	return true;
}

// ==========================================
// AÇÕES DO JOGADOR COM PREDIÇÃO DE CLIENTE
// ==========================================

bool UDasiInventoryComponent::PredictMoveGridItem(const FString& ItemUuid, int32 TargetX, int32 TargetY, bool bRotated)
{
	FDasiPlacedItem* Placed = GridItemsMap.Find(ItemUuid);
	if (!Placed)
	{
		UE_LOG(LogDasiClient, Warning, TEXT("PredictMoveGridItem: Item %s não encontrado na grade"), *ItemUuid);
		return false;
	}

	const int32 OldX = Placed->X;
	const int32 OldY = Placed->Y;
	const bool bOldRotated = Placed->bRotated;

	if (!CanPlaceItemAt(Placed->Item, TargetX, TargetY, bRotated, ItemUuid))
	{
		UE_LOG(LogDasiClient, Warning, TEXT("PredictMoveGridItem: Posição inválida ou colisão em (%d, %d)"), TargetX, TargetY);
		return false;
	}

	// 1. Salva snapshot para possível rollback
	SaveRollbackSnapshot();

	// 2. Aplica predição local imediatamente na grade
	int32 BaseW = 1;
	int32 BaseH = 1;
	if (const FDasiItemDefinition* Def = ItemDefinitionsCache.Find(Placed->Item.DefId))
	{
		BaseW = Def->Width;
		BaseH = Def->Height;
	}

	UnmarkItemInOccupancy(OldX, OldY, Placed->Width, Placed->Height);

	Placed->X = TargetX;
	Placed->Y = TargetY;
	Placed->Width = bRotated ? BaseH : BaseW;
	Placed->Height = bRotated ? BaseW : BaseH;
	Placed->bRotated = bRotated;
	Placed->Item.bRotated = bRotated;

	MarkItemInOccupancy(ItemUuid, TargetX, TargetY, Placed->Width, Placed->Height);

	// 3. Notifica a UI UMG
	OnItemPlacedInGrid.Broadcast(ItemUuid, TargetX, TargetY);
	OnInventoryUpdated.Broadcast();

	// 4. Envia pacote de movimentação para autoridade do servidor
	if (UDasiNetworkSubsystem* NetSubsystem = GetNetworkSubsystem())
	{
		NetSubsystem->SendItemMove(
			ItemUuid,
			EDasiLocationType::Grid,
			OldX,
			OldY,
			EDasiEquipmentSlot::None,
			EDasiLocationType::Grid,
			TargetX,
			TargetY,
			EDasiEquipmentSlot::None,
			bRotated
		);
	}

	return true;
}

bool UDasiInventoryComponent::PredictEquipItem(const FString& ItemUuid, EDasiEquipmentSlot TargetSlot)
{
	const FDasiPlacedItem* Placed = GridItemsMap.Find(ItemUuid);
	if (!Placed)
	{
		UE_LOG(LogDasiClient, Warning, TEXT("PredictEquipItem: Item %s não encontrado na grade"), *ItemUuid);
		return false;
	}

	FString FailReason;
	if (!CanEquipInSlot(Placed->Item, TargetSlot, FailReason))
	{
		OnInventoryOperationFailed.Broadcast(ItemUuid, FailReason);
		return false;
	}

	SaveRollbackSnapshot();

	const int32 SourceX = Placed->X;
	const int32 SourceY = Placed->Y;
	const FDasiItemInstance ItemToEquip = Placed->Item;

	// Se já havia item no slot alvo, desocupa e tenta alocar na grade onde o item estava
	const FDasiItemInstance* PreviousEquipped = EquippedSlotsMap.Find(TargetSlot);
	if (PreviousEquipped && PreviousEquipped->IsValid())
	{
		FDasiPlacedItem SwappedPlaced;
		SwappedPlaced.Item = *PreviousEquipped;
		SwappedPlaced.X = SourceX;
		SwappedPlaced.Y = SourceY;

		if (const FDasiItemDefinition* PrevDef = ItemDefinitionsCache.Find(PreviousEquipped->DefId))
		{
			SwappedPlaced.Width = PrevDef->Width;
			SwappedPlaced.Height = PrevDef->Height;
		}
		else
		{
			SwappedPlaced.Width = 1;
			SwappedPlaced.Height = 1;
		}

		GridItemsMap.Add(PreviousEquipped->Uuid, SwappedPlaced);
	}

	UnmarkItemInOccupancy(SourceX, SourceY, Placed->Width, Placed->Height);
	GridItemsMap.Remove(ItemUuid);

	EquippedSlotsMap.Add(TargetSlot, ItemToEquip);
	RebuildGridOccupancy();

	OnItemRemovedFromGrid.Broadcast(ItemUuid);
	OnEquipmentSlotChanged.Broadcast(TargetSlot, true, ItemToEquip);
	OnInventoryUpdated.Broadcast();

	if (UDasiNetworkSubsystem* NetSubsystem = GetNetworkSubsystem())
	{
		NetSubsystem->SendItemMove(
			ItemUuid,
			EDasiLocationType::Grid,
			SourceX,
			SourceY,
			EDasiEquipmentSlot::None,
			EDasiLocationType::Equipment,
			0,
			0,
			TargetSlot,
			false
		);
	}

	return true;
}

bool UDasiInventoryComponent::PredictUnequipItem(EDasiEquipmentSlot SourceSlot, int32 TargetX, int32 TargetY, bool bRotated)
{
	const FDasiItemInstance* EquippedItem = EquippedSlotsMap.Find(SourceSlot);
	if (!EquippedItem || !EquippedItem->IsValid())
	{
		UE_LOG(LogDasiClient, Warning, TEXT("PredictUnequipItem: Nenhum item equipado no slot %d"), static_cast<int32>(SourceSlot));
		return false;
	}

	if (!CanPlaceItemAt(*EquippedItem, TargetX, TargetY, bRotated))
	{
		OnInventoryOperationFailed.Broadcast(EquippedItem->Uuid, TEXT("Sem espaço na grade para desequipar"));
		return false;
	}

	SaveRollbackSnapshot();

	const FDasiItemInstance ItemToPlace = *EquippedItem;
	EquippedSlotsMap.Remove(SourceSlot);

	int32 BaseW = 1;
	int32 BaseH = 1;
	if (const FDasiItemDefinition* Def = ItemDefinitionsCache.Find(ItemToPlace.DefId))
	{
		BaseW = Def->Width;
		BaseH = Def->Height;
	}

	FDasiPlacedItem Placed;
	Placed.Item = ItemToPlace;
	Placed.Item.bRotated = bRotated;
	Placed.X = TargetX;
	Placed.Y = TargetY;
	Placed.Width = bRotated ? BaseH : BaseW;
	Placed.Height = bRotated ? BaseW : BaseH;
	Placed.bRotated = bRotated;

	GridItemsMap.Add(ItemToPlace.Uuid, Placed);
	MarkItemInOccupancy(ItemToPlace.Uuid, TargetX, TargetY, Placed.Width, Placed.Height);

	OnEquipmentSlotChanged.Broadcast(SourceSlot, false, ItemToPlace);
	OnItemPlacedInGrid.Broadcast(ItemToPlace.Uuid, TargetX, TargetY);
	OnInventoryUpdated.Broadcast();

	if (UDasiNetworkSubsystem* NetSubsystem = GetNetworkSubsystem())
	{
		NetSubsystem->SendItemMove(
			ItemToPlace.Uuid,
			EDasiLocationType::Equipment,
			0,
			0,
			SourceSlot,
			EDasiLocationType::Grid,
			TargetX,
			TargetY,
			EDasiEquipmentSlot::None,
			bRotated
		);
	}

	return true;
}

bool UDasiInventoryComponent::RotateGridItem(const FString& ItemUuid)
{
	if (const FDasiPlacedItem* Placed = GridItemsMap.Find(ItemUuid))
	{
		return PredictMoveGridItem(ItemUuid, Placed->X, Placed->Y, !Placed->bRotated);
	}
	return false;
}

void UDasiInventoryComponent::ApplyJewel(const FString& JewelUuid, const FString& TargetUuid, EDasiLocationType TargetLocation, EDasiEquipmentSlot TargetSlot, int32 TargetX, int32 TargetY)
{
	if (UDasiNetworkSubsystem* NetSubsystem = GetNetworkSubsystem())
	{
		NetSubsystem->SendUseJewel(JewelUuid, TargetUuid, TargetLocation, TargetSlot, TargetX, TargetY);
	}
}

// ==========================================
// RECONCILIAÇÃO COM O SERVIDOR
// ==========================================

void UDasiInventoryComponent::ReconcileWithServer(const FDasiInventoryState& ServerState)
{
	GridItemsMap.Empty();
	EquippedSlotsMap.Empty();
	ClearGridOccupancy();

	for (const FDasiPlacedItem& Placed : ServerState.Items)
	{
		if (Placed.Item.IsValid())
		{
			GridItemsMap.Add(Placed.Item.Uuid, Placed);
		}
	}

	for (const FDasiEquippedItem& Eq : ServerState.Equipped)
	{
		if (Eq.Slot != EDasiEquipmentSlot::None && Eq.Item.IsValid())
		{
			EquippedSlotsMap.Add(Eq.Slot, Eq.Item);
		}
	}

	RebuildGridOccupancy();
	bHasPendingPrediction = false;

	OnInventoryUpdated.Broadcast();
}

void UDasiInventoryComponent::HandleNetworkInventorySynced(const FDasiInventoryState& State, const TArray<FDasiItemDefinition>& Definitions)
{
	for (const FDasiItemDefinition& Def : Definitions)
	{
		ItemDefinitionsCache.Add(Def.Id, Def);
	}

	ReconcileWithServer(State);
}

void UDasiInventoryComponent::HandleNetworkItemMoveResult(const FDasiItemMoveResponse& Response)
{
	if (Response.bSuccess)
	{
		if (Response.bHasInventoryState)
		{
			ReconcileWithServer(Response.InventoryState);
		}
		else
		{
			bHasPendingPrediction = false;
		}
	}
	else
	{
		UE_LOG(LogDasiClient, Warning, TEXT("HandleNetworkItemMoveResult: Movimento rejeitado pelo servidor: %s"), *Response.Error);
		RollbackToSnapshot();
		OnInventoryOperationFailed.Broadcast(Response.ItemUuid, Response.Error);
	}
}

void UDasiInventoryComponent::HandleNetworkJewelRefineResult(const FDasiJewelRefineResult& Result)
{
	if (Result.bHasInventoryState)
	{
		ReconcileWithServer(Result.InventoryState);
	}
	else if (Result.bHasUpdatedItem)
	{
		// Atualiza o item localmente
		if (FDasiPlacedItem* Placed = GridItemsMap.Find(Result.UpdatedItem.Uuid))
		{
			Placed->Item = Result.UpdatedItem;
		}
		for (auto& Pair : EquippedSlotsMap)
		{
			if (Pair.Value.Uuid == Result.UpdatedItem.Uuid)
			{
				Pair.Value = Result.UpdatedItem;
				break;
			}
		}
	}

	if (Result.bItemDestroyed)
	{
		GridItemsMap.Remove(Result.TargetUuid);
		for (auto It = EquippedSlotsMap.CreateIterator(); It; ++It)
		{
			if (It.Value().Uuid == Result.TargetUuid)
			{
				It.RemoveCurrent();
				break;
			}
		}
		RebuildGridOccupancy();
	}

	OnJewelRefineOutcome.Broadcast(Result);
	OnInventoryUpdated.Broadcast();
}

// ==========================================
// OCUPAÇÃO DE GRADE & ROLLBACK
// ==========================================

void UDasiInventoryComponent::ClearGridOccupancy()
{
	for (int32 i = 0; i < GridCols * GridRows; ++i)
	{
		GridSlots[i].Empty();
	}
}

void UDasiInventoryComponent::RebuildGridOccupancy()
{
	ClearGridOccupancy();

	for (const auto& Pair : GridItemsMap)
	{
		const FDasiPlacedItem& Placed = Pair.Value;
		MarkItemInOccupancy(Placed.Item.Uuid, Placed.X, Placed.Y, Placed.Width, Placed.Height);
	}
}

void UDasiInventoryComponent::MarkItemInOccupancy(const FString& ItemUuid, int32 X, int32 Y, int32 Width, int32 Height)
{
	for (int32 cy = Y; cy < Y + Height && cy < GridRows; ++cy)
	{
		for (int32 cx = X; cx < X + Width && cx < GridCols; ++cx)
		{
			GridSlots[cy * GridCols + cx] = ItemUuid;
		}
	}
}

void UDasiInventoryComponent::UnmarkItemInOccupancy(int32 X, int32 Y, int32 Width, int32 Height)
{
	for (int32 cy = Y; cy < Y + Height && cy < GridRows; ++cy)
	{
		for (int32 cx = X; cx < X + Width && cx < GridCols; ++cx)
		{
			GridSlots[cy * GridCols + cx].Empty();
		}
	}
}

void UDasiInventoryComponent::SaveRollbackSnapshot()
{
	RollbackSnapshot.GridItems = GridItemsMap;
	RollbackSnapshot.EquippedItems = EquippedSlotsMap;
	bHasPendingPrediction = true;
}

void UDasiInventoryComponent::RollbackToSnapshot()
{
	if (!bHasPendingPrediction) return;

	GridItemsMap = RollbackSnapshot.GridItems;
	EquippedSlotsMap = RollbackSnapshot.EquippedItems;
	RebuildGridOccupancy();
	bHasPendingPrediction = false;

	OnInventoryUpdated.Broadcast();
}
