// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Inventory/DasiInventoryTypes.h"
#include "DasiNetworkTypes.generated.h"

/**
 * Constantes de Opcodes e Subcodes do Protocolo Dasi (C1/C2 / WebSocket)
 */
namespace DasiOpcodes
{
	// Handshake e Autenticação
	static constexpr uint8 OP_HANDSHAKE_HELLO       = 0x01;
	static constexpr uint8 SUB_HANDSHAKE_HELLO      = 0x01;
	static constexpr uint8 OP_HANDSHAKE_CHALLENGE   = 0x01;
	static constexpr uint8 SUB_HANDSHAKE_CHALLENGE  = 0x02;
	static constexpr uint8 OP_AUTH_LOGIN_REQ        = 0x01;
	static constexpr uint8 SUB_AUTH_LOGIN_REQ       = 0x03;
	static constexpr uint8 OP_AUTH_LOGIN_RES        = 0x01;
	static constexpr uint8 SUB_AUTH_LOGIN_RES       = 0x04;

	// Heartbeat Ping/Pong
	static constexpr uint8 OP_PING                  = 0x02;
	static constexpr uint8 SUB_PING                 = 0x01;
	static constexpr uint8 OP_PONG                  = 0x02;
	static constexpr uint8 SUB_PONG                 = 0x02;

	// Encerramento de Sessão
	static constexpr uint8 OP_SESSION_TERMINATE     = 0x03;
	static constexpr uint8 SUB_SESSION_TERMINATE    = 0x01;

	// Monstros & Spawns
	static constexpr uint8 OP_MONSTER_SPAWN_OR_MOVE = 0x15;
	static constexpr uint8 SUB_MONSTER_SPAWN_OR_MOVE = 0x01;

	// Drops e Coleta no Chão
	static constexpr uint8 OP_GROUND_ITEM_DROP      = 0x16;
	static constexpr uint8 SUB_GROUND_ITEM_DROP     = 0x01;
	static constexpr uint8 OP_GROUND_ITEM_PICKUP_REQ = 0x16;
	static constexpr uint8 SUB_GROUND_ITEM_PICKUP_REQ = 0x02;
	static constexpr uint8 OP_GROUND_ITEM_PICKUP_RES = 0x16;
	static constexpr uint8 SUB_GROUND_ITEM_PICKUP_RES = 0x02;
	static constexpr uint8 OP_GROUND_ITEM_REMOVE    = 0x16;
	static constexpr uint8 SUB_GROUND_ITEM_REMOVE   = 0x03;

	// Movimentação
	static constexpr uint8 OP_MOVEMENT              = 0x30;
	static constexpr uint8 SUB_MOVEMENT_MOVE        = 0x01;

	// Combate Autoritativo
	static constexpr uint8 OP_COMBAT_ATTACK_REQ     = 0x50;
	static constexpr uint8 SUB_COMBAT_ATTACK_REQ    = 0x01;
	static constexpr uint8 OP_COMBAT_ATTACK_RES     = 0x50;
	static constexpr uint8 SUB_COMBAT_ATTACK_RES    = 0x02;

	// Telemetria & Status do Jogador
	static constexpr uint8 OP_PLAYER_STATUS         = 0x10;
	static constexpr uint8 SUB_PLAYER_STATUS_VITALS = 0x01;
	static constexpr uint8 SUB_PLAYER_STATUS_EXP    = 0x02;

	// Action Bar & Ações de Combate / Cooldowns
	static constexpr uint8 OP_ACTION_EXECUTE_REQ    = 0x51;
	static constexpr uint8 SUB_ACTION_EXECUTE_REQ   = 0x01;
	static constexpr uint8 OP_ACTION_COOLDOWN_RES   = 0x51;
	static constexpr uint8 SUB_ACTION_COOLDOWN_RES  = 0x02;
	static constexpr uint8 OP_POTION_USE_REQ        = 0x51;
	static constexpr uint8 SUB_POTION_USE_REQ       = 0x03;
	static constexpr uint8 OP_DODGE_REQ             = 0x51;
	static constexpr uint8 SUB_DODGE_REQ            = 0x04;

	// Inventário 8x8
	static constexpr uint8 OP_INVENTORY_SYNC_ALL    = 0x70;
	static constexpr uint8 SUB_INVENTORY_SYNC_ALL   = 0x01;
	static constexpr uint8 OP_ITEM_MOVE_REQ         = 0x70;
	static constexpr uint8 SUB_ITEM_MOVE_REQ        = 0x02;
	static constexpr uint8 OP_ITEM_MOVE_RES         = 0x70;
	static constexpr uint8 SUB_ITEM_MOVE_RES        = 0x03;

	// Joias Sagradas
	static constexpr uint8 OP_ITEM_USE_JEWEL_REQ    = 0x71;
	static constexpr uint8 SUB_ITEM_USE_JEWEL_REQ   = 0x01;
	static constexpr uint8 OP_ITEM_USE_JEWEL_RES    = 0x71;
	static constexpr uint8 SUB_ITEM_USE_JEWEL_RES   = 0x02;

	// Dev Helper Spawner
	static constexpr uint8 OP_ITEM_SPAWN_DEV_REQ    = 0x73;
	static constexpr uint8 SUB_ITEM_SPAWN_DEV_REQ   = 0x01;
	static constexpr uint8 OP_ITEM_SPAWN_DEV_RES    = 0x73;
	static constexpr uint8 SUB_ITEM_SPAWN_DEV_RES   = 0x02;
}

/**
 * Resumo do Personagem Autenticado
 */
USTRUCT(BlueprintType)
struct FDasiCharacterSummary
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	FString Name;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	FString CharacterClass;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	int32 Level = 1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	int32 Strength = 28;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	int32 Agility = 20;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	int32 Vitality = 25;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	int32 Energy = 10;
};

/**
 * Resposta de Login / Autenticação
 */
USTRUCT(BlueprintType)
struct FDasiAuthLoginResponse
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	bool bSuccess = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	FString SessionId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	FString Token;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	FDasiCharacterSummary Character;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Auth")
	FString Message;
};

/**
 * Monstro Serializado no Mundo
 */
USTRUCT(BlueprintType)
struct FDasiSerializedMonster
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	FString Id;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	FString Type;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	FString Name;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	int32 Level = 1;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	int32 CurrentHp = 100;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	int32 MaxHp = 100;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	float X = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	float Y = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	float TargetX = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	float TargetY = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	FString State; // IDLE, MOVING, ATTACKING, STAGGERED, DEAD

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Monster")
	bool bIsDead = false;
};

/**
 * Item Caído no Chão
 */
USTRUCT(BlueprintType)
struct FDasiGroundDropItem
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	FString DropId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	FDasiItemInstance Item;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	bool bHasItem = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	int64 Zen = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	float X = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	float Y = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	int64 CreatedAt = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	int64 ExpiresAt = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	FString OwnerSessionId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	bool bIsJewel = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Drop")
	bool bIsExcellent = false;
};

/**
 * Resultado de Ataque de Combate Autoritativo
 */
USTRUCT(BlueprintType)
struct FDasiCombatAttackResult
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	bool bSuccess = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	FString AttackerId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	FString TargetId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	bool bIsMiss = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	int32 Damage = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	FString DamageType; // NORMAL, EXCELLENT, CRITICAL, MISS

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	FString ColorHex;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	int32 TargetHp = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	int32 TargetMaxHp = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	bool bIsDead = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	bool bStaggered = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	int32 HitStopMs = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	FVector2D Knockback = FVector2D::ZeroVector;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	TArray<FDasiGroundDropItem> DropsGenerated;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	int32 XpGained = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Combat")
	FString Error;
};

/**
 * Resposta de Mover Item no Inventário / Equipamento
 */
USTRUCT(BlueprintType)
struct FDasiItemMoveResponse
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	bool bSuccess = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	FString ItemUuid;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	EDasiLocationType SourceType = EDasiLocationType::Grid;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	EDasiLocationType TargetType = EDasiLocationType::Grid;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	EDasiEquipmentSlot TargetSlot = EDasiEquipmentSlot::None;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	int32 NewX = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	int32 NewY = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	bool bRotated = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	FString Error;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	bool bHasInventoryState = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Inventory")
	FDasiInventoryState InventoryState;
};

/**
 * Resultado de Aplicação de Joia Sagrada
 */
USTRUCT(BlueprintType)
struct FDasiJewelRefineResult
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	bool bSuccess = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	EDasiUpgradeOutcome Outcome = EDasiUpgradeOutcome::None;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	FString JewelUuid;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	FString TargetUuid;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	int32 PreviousLevel = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	int32 NewLevel = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	int32 PreviousOption = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	int32 NewOption = 0;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	bool bItemDestroyed = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	FString Message;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	bool bHasUpdatedItem = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	FDasiItemInstance UpdatedItem;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	bool bHasInventoryState = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Network|Jewels")
	FDasiInventoryState InventoryState;
};

/**
 * Pacote bruto decodificado para despacho interno
 */
struct FDasiRawPacket
{
	uint8 Opcode = 0;
	uint8 Subcode = 0;
	uint32 Seq = 0;
	FString JsonPayloadString;
	TSharedPtr<class FJsonObject> JsonPayloadObject;
};
