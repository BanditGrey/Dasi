// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "DasiNetworkTypes.h"
#include "Inventory/DasiInventoryTypes.h"
#include "Combat/DasiCombatTypes.h"
#include "DasiNetworkSubsystem.generated.h"

class IWebSocket;

// Multicast Dynamic Delegates para blueprints e sistemas de gameplay
DECLARE_DYNAMIC_MULTICAST_DELEGATE(FOnDasiConnected);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnDasiDisconnected, int32, StatusCode, const FString&, Reason);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiConnectionError, const FString&, ErrorMessage);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnDasiAuthSuccess, const FDasiCharacterSummary&, Character, const FString&, SessionId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiMonstersUpdated, const TArray<FDasiSerializedMonster>&, Monsters);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiCombatAttackResult, const FDasiCombatAttackResult&, Result);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiGroundDropsUpdated, const TArray<FDasiGroundDropItem>&, Drops);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiGroundItemRemoved, const FString&, DropId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnDasiInventorySynced, const FDasiInventoryState&, InventoryState, const TArray<FDasiItemDefinition>&, Definitions);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiItemMoveResult, const FDasiItemMoveResponse&, Response);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiJewelRefineResult, const FDasiJewelRefineResult&, Result);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiLatencyUpdated, float, LatencyMs);

// Telemetria & Atributos Vitais do Jogador (Action RPG HUD)
DECLARE_DYNAMIC_MULTICAST_DELEGATE_EightParams(FOnDasiPlayerVitalsUpdated, int32, CurrentHp, int32, MaxHp, int32, CurrentMp, int32, MaxMp, int32, CurrentSd, int32, MaxSd, int32, CurrentSta, int32, MaxSta);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnDasiPlayerExpUpdated, int64, CurrentXp, int64, NextLevelXp, int32, CurrentLevel);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnDasiSkillCooldownReceived, FName, ActionKey, float, Duration);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FOnDasiCombatFeedbackReceived, int32, Damage, EDasiDamageType, DamageType, const FVector&, WorldPos);

/**
 * Estrutura para enfileiramento de pacotes antes de completar handshake/autenticação
 */
struct FDasiQueuedPacket
{
	uint8 Opcode = 0;
	uint8 Subcode = 0;
	FString JsonPayload;
	bool bBinary = false;
};

/**
 * Subsistema de Rede de Jogo (WebSocket / C1-C2) do Dasi MMORPG
 * Gerencia ciclo de vida da conexão, heartbeat de 5s, reconexão automática,
 * serialização/deserialização JSON e binária C1/C2 com verificação de integridade CRC16.
 */
UCLASS(BlueprintType)
class DASICLIENT_API UDasiNetworkSubsystem : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	UDasiNetworkSubsystem();

	// Ciclo de vida do Subsistema
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;
	virtual void Deinitialize() override;

	// ==========================================
	// DELEGATES DE EVENTOS DO JOGO
	// ==========================================

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiConnected OnConnectedToServer;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiDisconnected OnDisconnectedFromServer;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiConnectionError OnConnectionError;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiAuthSuccess OnAuthSuccess;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiMonstersUpdated OnMonstersUpdated;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiCombatAttackResult OnCombatAttackResult;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiGroundDropsUpdated OnGroundDropsUpdated;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiGroundItemRemoved OnGroundItemRemoved;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiInventorySynced OnInventorySynced;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiItemMoveResult OnItemMoveResult;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiJewelRefineResult OnJewelRefineResult;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiLatencyUpdated OnLatencyUpdated;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiPlayerVitalsUpdated OnPlayerVitalsUpdated;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiPlayerExpUpdated OnPlayerExpUpdated;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiSkillCooldownReceived OnSkillCooldownReceived;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiCombatFeedbackReceived OnCombatFeedbackReceived;

	// ==========================================
	// CONTROLE DE CONEXÃO
	// ==========================================

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network")
	void Connect(const FString& ServerUrl = TEXT("ws://localhost:8080"));

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network")
	void Disconnect();

	UFUNCTION(BlueprintPure, Category = "Dasi|Network")
	bool IsConnected() const;

	UFUNCTION(BlueprintPure, Category = "Dasi|Network")
	bool IsAuthenticated() const { return bIsAuthenticated; }

	UFUNCTION(BlueprintPure, Category = "Dasi|Network")
	float GetCurrentLatencyMs() const { return CurrentLatencyMs; }

	UFUNCTION(BlueprintPure, Category = "Dasi|Network")
	const FDasiCharacterSummary& GetCharacterSummary() const { return CurrentCharacter; }

	UFUNCTION(BlueprintPure, Category = "Dasi|Network")
	const FString& GetSessionId() const { return ActiveSessionId; }

	// ==========================================
	// COMANDOS DE ENVIO (GAMEPLAY & AÇÕES)
	// ==========================================

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network|Commands")
	void SendLoginRequest(const FString& Username = TEXT("HeroOfDasi"), const FString& CharacterClass = TEXT("DK"));

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network|Commands")
	void SendItemMove(const FString& ItemUuid, EDasiLocationType SourceType, int32 SourceX, int32 SourceY, EDasiEquipmentSlot SourceSlot, EDasiLocationType TargetType, int32 TargetX, int32 TargetY, EDasiEquipmentSlot TargetSlot, bool bRotated = false);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network|Commands")
	void SendUseJewel(const FString& JewelUuid, const FString& TargetUuid, EDasiLocationType TargetLocation, EDasiEquipmentSlot TargetSlot = EDasiEquipmentSlot::None, int32 TargetX = 0, int32 TargetY = 0);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network|Commands")
	void SendCombatAttack(const FString& TargetMobId, const FString& SkillId, float PlayerX, float PlayerY);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network|Commands")
	void SendActionExecute(FName ActionKey, FName SkillId, const FString& TargetId, float TargetX, float TargetY);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network|Commands")
	void SendUsePotion(const FString& PotionType = TEXT("HP"));

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network|Commands")
	void SendCombatDodge(float DirectionX, float DirectionY);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network|Commands")
	void SendPickupGroundItem(const FString& DropId, float PlayerX, float PlayerY);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network|Commands")
	void RequestInventorySync();

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network|Commands")
	void SendDevSpawnItem(const FString& ItemDefId, int32 Level = 0, int32 ExcellentMask = 0, bool bLuck = false, bool bSkill = false, int32 Count = 1);

	// Envio de pacotes brutos
	void SendJsonPacket(uint8 Opcode, uint8 Subcode, const TSharedPtr<FJsonObject>& PayloadObject);
	void SendBinaryPacket(uint8 Opcode, uint8 Subcode, const TSharedPtr<FJsonObject>& PayloadObject);

	// Helpers de enquadramento binário C1 / C2 & CRC16-CCITT
	static uint16 CalculateCRC16(const uint8* Data, int32 Length);
	static TArray<uint8> EncodeC1C2BinaryPacket(uint8 Opcode, uint8 Subcode, uint32 Seq, const FString& JsonPayload);
	static bool DecodeC1C2BinaryPacket(const uint8* Data, int32 Length, FDasiRawPacket& OutPacket);

protected:
	// Callbacks do socket
	void OnWebSocketConnected();
	void OnWebSocketConnectionError(const FString& Error);
	void OnWebSocketClosed(int32 StatusCode, const FString& Reason, bool bWasClean);
	void OnWebSocketMessage(const FString& MessageString);
	void OnWebSocketRawMessage(const void* Data, SIZE_T Size, SIZE_T BytesRemaining);

	// Despacho interno de pacotes
	void ProcessIncomingPacket(const FDasiRawPacket& Packet);
	void DispatchPacket(uint8 Opcode, uint8 Subcode, const TSharedPtr<FJsonObject>& Payload);

	// Handlers de pacotes individuais
	void HandleHandshakeChallenge(const TSharedPtr<FJsonObject>& Payload);
	void HandleAuthLoginResponse(const TSharedPtr<FJsonObject>& Payload);
	void HandlePong(const TSharedPtr<FJsonObject>& Payload);
	void HandleMonsterSpawnOrMove(const TSharedPtr<FJsonObject>& Payload);
	void HandleGroundItemDrop(const TSharedPtr<FJsonObject>& Payload);
	void HandleGroundItemPickupResponse(const TSharedPtr<FJsonObject>& Payload);
	void HandleGroundItemRemove(const TSharedPtr<FJsonObject>& Payload);
	void HandleCombatAttackResponse(const TSharedPtr<FJsonObject>& Payload);
	void HandleInventorySyncAll(const TSharedPtr<FJsonObject>& Payload);
	void HandleItemMoveResponse(const TSharedPtr<FJsonObject>& Payload);
	void HandleItemUseJewelResponse(const TSharedPtr<FJsonObject>& Payload);
	void HandlePlayerStatusVitals(const TSharedPtr<FJsonObject>& Payload);
	void HandlePlayerStatusExp(const TSharedPtr<FJsonObject>& Payload);
	void HandleSkillCooldownResponse(const TSharedPtr<FJsonObject>& Payload);

	// Heartbeat & Reconexão
	void StartHeartbeat();
	void StopHeartbeat();
	void SendHeartbeatPing();
	void ScheduleAutoReconnect();
	void TryAutoReconnect();
	void FlushPacketQueue();

private:
	TSharedPtr<IWebSocket> WebSocket;

	FString CurrentServerUrl;
	bool bAutoReconnect = true;
	bool bIsAuthenticated = false;
	bool bUseBinaryProtocol = false;

	uint32 OutgoingSequence = 0;
	double LastPingTimestamp = 0.0;
	float CurrentLatencyMs = 0.0f;

	FTimerHandle HeartbeatTimerHandle;
	FTimerHandle ReconnectTimerHandle;

	FDasiCharacterSummary CurrentCharacter;
	FString ActiveSessionId;
	FString ActiveAuthToken;

	// Fila de pacotes para envio pós-conexão
	TArray<FDasiQueuedPacket> QueuedPackets;
};
