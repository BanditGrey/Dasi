// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "Network/DasiNetworkSubsystem.h"
#include "DasiClient.h"
#include "WebSocketsModule.h"
#include "IWebSocket.h"
#include "Serialization/JsonReader.h"
#include "Serialization/JsonSerializer.h"
#include "Dom/JsonObject.h"
#include "Engine/World.h"
#include "TimerManager.h"

namespace DasiNetworkParsers
{
	static FDasiItemInstance ParseItemInstance(const TSharedPtr<FJsonObject>& ItemObj)
	{
		FDasiItemInstance Item;
		if (!ItemObj.IsValid()) return Item;

		Item.Uuid = ItemObj->GetStringField(TEXT("uuid"));
		Item.DefId = ItemObj->GetStringField(TEXT("defId"));
		Item.Level = ItemObj->GetIntegerField(TEXT("level"));
		Item.Durability = ItemObj->GetIntegerField(TEXT("durability"));
		Item.MaxDurability = ItemObj->GetIntegerField(TEXT("maxDurability"));
		Item.bSkill = ItemObj->GetBoolField(TEXT("skill"));
		Item.bLuck = ItemObj->GetBoolField(TEXT("luck"));
		Item.OptionLevel = ItemObj->GetIntegerField(TEXT("optionLevel"));
		Item.ExcellentMask = ItemObj->GetIntegerField(TEXT("excellentMask"));
		Item.bRotated = ItemObj->HasField(TEXT("rotated")) && ItemObj->GetBoolField(TEXT("rotated"));

		if (ItemObj->HasTypedField<EJson::Object>(TEXT("harmonyOption")))
		{
			const TSharedPtr<FJsonObject> HarmObj = ItemObj->GetObjectField(TEXT("harmonyOption"));
			if (HarmObj.IsValid())
			{
				Item.bHasHarmonyOption = true;
				Item.HarmonyOption.Type = HarmObj->GetStringField(TEXT("type"));
				Item.HarmonyOption.Level = HarmObj->GetIntegerField(TEXT("level"));
				Item.HarmonyOption.Value = HarmObj->GetIntegerField(TEXT("value"));
			}
		}

		return Item;
	}

	static FDasiPlacedItem ParsePlacedItem(const TSharedPtr<FJsonObject>& PlacedObj)
	{
		FDasiPlacedItem Placed;
		if (!PlacedObj.IsValid()) return Placed;

		if (PlacedObj->HasTypedField<EJson::Object>(TEXT("item")))
		{
			Placed.Item = ParseItemInstance(PlacedObj->GetObjectField(TEXT("item")));
		}
		Placed.X = PlacedObj->GetIntegerField(TEXT("x"));
		Placed.Y = PlacedObj->GetIntegerField(TEXT("y"));
		Placed.Width = PlacedObj->GetIntegerField(TEXT("width"));
		Placed.Height = PlacedObj->GetIntegerField(TEXT("height"));
		Placed.bRotated = PlacedObj->HasField(TEXT("rotated")) && PlacedObj->GetBoolField(TEXT("rotated"));

		return Placed;
	}

	static FDasiEquippedItem ParseEquippedItem(const TSharedPtr<FJsonObject>& EquipObj)
	{
		FDasiEquippedItem Equip;
		if (!EquipObj.IsValid()) return Equip;

		const FString SlotStr = EquipObj->GetStringField(TEXT("slot"));
		Equip.Slot = DasiInventoryUtils::StringToEquipmentSlot(SlotStr);

		if (EquipObj->HasTypedField<EJson::Object>(TEXT("item")))
		{
			Equip.Item = ParseItemInstance(EquipObj->GetObjectField(TEXT("item")));
		}

		return Equip;
	}

	static FDasiInventoryState ParseInventoryState(const TSharedPtr<FJsonObject>& InvObj)
	{
		FDasiInventoryState State;
		if (!InvObj.IsValid()) return State;

		State.Cols = InvObj->HasField(TEXT("cols")) ? InvObj->GetIntegerField(TEXT("cols")) : 8;
		State.Rows = InvObj->HasField(TEXT("rows")) ? InvObj->GetIntegerField(TEXT("rows")) : 8;

		if (InvObj->HasTypedField<EJson::Array>(TEXT("items")))
		{
			const TArray<TSharedPtr<FJsonValue>>& ItemsArray = InvObj->GetArrayField(TEXT("items"));
			for (const TSharedPtr<FJsonValue>& Val : ItemsArray)
			{
				const TSharedPtr<FJsonObject> Obj = Val->AsObject();
				if (Obj.IsValid())
				{
					State.Items.Add(ParsePlacedItem(Obj));
				}
			}
		}

		if (InvObj->HasTypedField<EJson::Array>(TEXT("equipped")))
		{
			const TArray<TSharedPtr<FJsonValue>>& EquipArray = InvObj->GetArrayField(TEXT("equipped"));
			for (const TSharedPtr<FJsonValue>& Val : EquipArray)
			{
				const TSharedPtr<FJsonObject> Obj = Val->AsObject();
				if (Obj.IsValid())
				{
					State.Equipped.Add(ParseEquippedItem(Obj));
				}
			}
		}

		return State;
	}

	static FDasiItemDefinition ParseItemDefinition(const TSharedPtr<FJsonObject>& DefObj)
	{
		FDasiItemDefinition Def;
		if (!DefObj.IsValid()) return Def;

		Def.Id = DefObj->GetStringField(TEXT("id"));
		Def.Name = DefObj->GetStringField(TEXT("name"));
		Def.Category = DasiInventoryUtils::StringToItemCategory(DefObj->GetStringField(TEXT("category")));
		Def.Width = DefObj->GetIntegerField(TEXT("width"));
		Def.Height = DefObj->GetIntegerField(TEXT("height"));
		Def.BaseDurability = DefObj->GetIntegerField(TEXT("baseDurability"));
		Def.MinDamage = DefObj->HasField(TEXT("minDamage")) ? DefObj->GetIntegerField(TEXT("minDamage")) : 0;
		Def.MaxDamage = DefObj->HasField(TEXT("maxDamage")) ? DefObj->GetIntegerField(TEXT("maxDamage")) : 0;
		Def.Defense = DefObj->HasField(TEXT("defense")) ? DefObj->GetIntegerField(TEXT("defense")) : 0;
		Def.DefenseRate = DefObj->HasField(TEXT("defenseRate")) ? DefObj->GetIntegerField(TEXT("defenseRate")) : 0;
		Def.AttackSpeed = DefObj->HasField(TEXT("attackSpeed")) ? DefObj->GetIntegerField(TEXT("attackSpeed")) : 0;
		Def.bIsTwoHanded = DefObj->HasField(TEXT("isTwoHanded")) && DefObj->GetBoolField(TEXT("isTwoHanded"));

		if (DefObj->HasTypedField<EJson::Array>(TEXT("validEquipSlots")))
		{
			for (const TSharedPtr<FJsonValue>& SlotVal : DefObj->GetArrayField(TEXT("validEquipSlots")))
			{
				Def.ValidEquipSlots.Add(DasiInventoryUtils::StringToEquipmentSlot(SlotVal->AsString()));
			}
		}

		if (DefObj->HasTypedField<EJson::Object>(TEXT("requirements")))
		{
			const TSharedPtr<FJsonObject> ReqObj = DefObj->GetObjectField(TEXT("requirements"));
			Def.Requirements.Strength = ReqObj->HasField(TEXT("strength")) ? ReqObj->GetIntegerField(TEXT("strength")) : 0;
			Def.Requirements.Agility = ReqObj->HasField(TEXT("agility")) ? ReqObj->GetIntegerField(TEXT("agility")) : 0;
			Def.Requirements.Vitality = ReqObj->HasField(TEXT("vitality")) ? ReqObj->GetIntegerField(TEXT("vitality")) : 0;
			Def.Requirements.Energy = ReqObj->HasField(TEXT("energy")) ? ReqObj->GetIntegerField(TEXT("energy")) : 0;
			Def.Requirements.Command = ReqObj->HasField(TEXT("command")) ? ReqObj->GetIntegerField(TEXT("command")) : 0;
			Def.Requirements.Level = ReqObj->HasField(TEXT("level")) ? ReqObj->GetIntegerField(TEXT("level")) : 0;

			if (ReqObj->HasTypedField<EJson::Array>(TEXT("allowedClasses")))
			{
				for (const TSharedPtr<FJsonValue>& ClsVal : ReqObj->GetArrayField(TEXT("allowedClasses")))
				{
					Def.Requirements.AllowedClasses.Add(ClsVal->AsString());
				}
			}
		}

		return Def;
	}

	static FDasiSerializedMonster ParseMonster(const TSharedPtr<FJsonObject>& MobObj)
	{
		FDasiSerializedMonster Mob;
		if (!MobObj.IsValid()) return Mob;

		Mob.Id = MobObj->GetStringField(TEXT("id"));
		Mob.Type = MobObj->GetStringField(TEXT("type"));
		Mob.Name = MobObj->GetStringField(TEXT("name"));
		Mob.Level = MobObj->GetIntegerField(TEXT("level"));
		Mob.CurrentHp = MobObj->GetIntegerField(TEXT("currentHp"));
		Mob.MaxHp = MobObj->GetIntegerField(TEXT("maxHp"));
		Mob.X = static_cast<float>(MobObj->GetNumberField(TEXT("x")));
		Mob.Y = static_cast<float>(MobObj->GetNumberField(TEXT("y")));
		Mob.TargetX = static_cast<float>(MobObj->GetNumberField(TEXT("targetX")));
		Mob.TargetY = static_cast<float>(MobObj->GetNumberField(TEXT("targetY")));
		Mob.State = MobObj->GetStringField(TEXT("state"));
		Mob.bIsDead = MobObj->GetBoolField(TEXT("isDead"));

		return Mob;
	}

	static FDasiGroundDropItem ParseGroundDrop(const TSharedPtr<FJsonObject>& DropObj)
	{
		FDasiGroundDropItem Drop;
		if (!DropObj.IsValid()) return Drop;

		Drop.DropId = DropObj->GetStringField(TEXT("dropId"));
		Drop.Zen = static_cast<int64>(DropObj->GetNumberField(TEXT("zen")));
		Drop.X = static_cast<float>(DropObj->GetNumberField(TEXT("x")));
		Drop.Y = static_cast<float>(DropObj->GetNumberField(TEXT("y")));
		Drop.CreatedAt = static_cast<int64>(DropObj->GetNumberField(TEXT("createdAt")));
		Drop.ExpiresAt = static_cast<int64>(DropObj->GetNumberField(TEXT("expiresAt")));
		Drop.OwnerSessionId = DropObj->HasField(TEXT("ownerSessionId")) ? DropObj->GetStringField(TEXT("ownerSessionId")) : TEXT("");
		Drop.bIsJewel = DropObj->HasField(TEXT("isJewel")) && DropObj->GetBoolField(TEXT("isJewel"));
		Drop.bIsExcellent = DropObj->HasField(TEXT("isExcellent")) && DropObj->GetBoolField(TEXT("isExcellent"));

		if (DropObj->HasTypedField<EJson::Object>(TEXT("item")))
		{
			Drop.Item = ParseItemInstance(DropObj->GetObjectField(TEXT("item")));
			Drop.bHasItem = Drop.Item.IsValid();
		}

		return Drop;
	}
}

UDasiNetworkSubsystem::UDasiNetworkSubsystem()
	: CurrentServerUrl(TEXT("ws://localhost:8080"))
	, bAutoReconnect(true)
	, bIsAuthenticated(false)
	, bUseBinaryProtocol(false)
	, OutgoingSequence(0)
	, LastPingTimestamp(0.0)
	, CurrentLatencyMs(0.0f)
{
}

void UDasiNetworkSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	UE_LOG(LogDasiClient, Log, TEXT("UDasiNetworkSubsystem: Inicializado"));
}

void UDasiNetworkSubsystem::Deinitialize()
{
	Disconnect();
	Super::Deinitialize();
	UE_LOG(LogDasiClient, Log, TEXT("UDasiNetworkSubsystem: Finalizado"));
}

void UDasiNetworkSubsystem::Connect(const FString& ServerUrl)
{
	CurrentServerUrl = ServerUrl.IsEmpty() ? TEXT("ws://localhost:8080") : ServerUrl;
	bAutoReconnect = true;

	if (WebSocket.IsValid() && WebSocket->IsConnected())
	{
		UE_LOG(LogDasiClient, Warning, TEXT("UDasiNetworkSubsystem: WebSocket já está conectado"));
		return;
	}

	if (!FModuleManager::Get().IsModuleLoaded(TEXT("WebSockets")))
	{
		FModuleManager::Get().LoadModule(TEXT("WebSockets"));
	}

	const FString Protocol = TEXT("ws");
	WebSocket = FWebSocketsModule::Get().CreateWebSocket(CurrentServerUrl, Protocol);

	if (!WebSocket.IsValid())
	{
		UE_LOG(LogDasiClient, Error, TEXT("UDasiNetworkSubsystem: Falha ao instanciar IWebSocket nativo"));
		OnConnectionError.Broadcast(TEXT("Falha ao instanciar WebSocket"));
		return;
	}

	// Registro de callbacks do WebSocket
	WebSocket->OnConnected().AddUObject(this, &UDasiNetworkSubsystem::OnWebSocketConnected);
	WebSocket->OnConnectionError().AddUObject(this, &UDasiNetworkSubsystem::OnWebSocketConnectionError);
	WebSocket->OnClosed().AddUObject(this, &UDasiNetworkSubsystem::OnWebSocketClosed);
	WebSocket->OnMessage().AddUObject(this, &UDasiNetworkSubsystem::OnWebSocketMessage);
	WebSocket->OnRawMessage().AddUObject(this, &UDasiNetworkSubsystem::OnWebSocketRawMessage);

	UE_LOG(LogDasiClient, Log, TEXT("UDasiNetworkSubsystem: Conectando a %s..."), *CurrentServerUrl);
	WebSocket->Connect();
}

void UDasiNetworkSubsystem::Disconnect()
{
	bAutoReconnect = false;
	StopHeartbeat();

	if (UWorld* World = GetWorld())
	{
		World->GetTimerManager().ClearTimer(ReconnectTimerHandle);
	}

	if (WebSocket.IsValid())
	{
		if (WebSocket->IsConnected())
		{
			WebSocket->Close(1000, TEXT("Client normal close"));
		}
		WebSocket.Reset();
	}

	bIsAuthenticated = false;
}

bool UDasiNetworkSubsystem::IsConnected() const
{
	return WebSocket.IsValid() && WebSocket->IsConnected();
}

void UDasiNetworkSubsystem::OnWebSocketConnected()
{
	UE_LOG(LogDasiClient, Log, TEXT("UDasiNetworkSubsystem: Conexão WebSocket estabelecida com sucesso!"));
	OnConnectedToServer.Broadcast();

	// Inicia imediatamente o Handshake Hello (0x01:0x01)
	TSharedPtr<FJsonObject> HelloPayload = MakeShared<FJsonObject>();
	HelloPayload->SetStringField(TEXT("clientVersion"), TEXT("1.0.0"));
	HelloPayload->SetNumberField(TEXT("clientTime"), FDateTime::UtcNow().ToUnixTimestamp());

	SendJsonPacket(DasiOpcodes::OP_HANDSHAKE_HELLO, DasiOpcodes::SUB_HANDSHAKE_HELLO, HelloPayload);

	// Dispara o ciclo de Heartbeat a cada 5 segundos
	StartHeartbeat();
}

void UDasiNetworkSubsystem::OnWebSocketConnectionError(const FString& Error)
{
	UE_LOG(LogDasiClient, Error, TEXT("UDasiNetworkSubsystem: Erro de conexão WebSocket: %s"), *Error);
	OnConnectionError.Broadcast(Error);
	ScheduleAutoReconnect();
}

void UDasiNetworkSubsystem::OnWebSocketClosed(int32 StatusCode, const FString& Reason, bool bWasClean)
{
	UE_LOG(LogDasiClient, Warning, TEXT("UDasiNetworkSubsystem: Conexão encerrada. Code=%d Motivo=%s Limpo=%d"),
		StatusCode, *Reason, bWasClean);

	StopHeartbeat();
	bIsAuthenticated = false;
	OnDisconnectedFromServer.Broadcast(StatusCode, Reason);

	ScheduleAutoReconnect();
}

void UDasiNetworkSubsystem::OnWebSocketMessage(const FString& MessageString)
{
	TSharedPtr<FJsonObject> JsonParsed;
	TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(MessageString);

	if (!FJsonSerializer::Deserialize(Reader, JsonParsed) || !JsonParsed.IsValid())
	{
		UE_LOG(LogDasiClient, Warning, TEXT("UDasiNetworkSubsystem: Mensagem recebida não é JSON válido: %s"), *MessageString);
		return;
	}

	const uint8 Opcode = static_cast<uint8>(JsonParsed->GetIntegerField(TEXT("opcode")));
	const uint8 Subcode = JsonParsed->HasField(TEXT("subcode")) ? static_cast<uint8>(JsonParsed->GetIntegerField(TEXT("subcode"))) : 1;
	const TSharedPtr<FJsonObject> Payload = JsonParsed->HasTypedField<EJson::Object>(TEXT("payload"))
		? JsonParsed->GetObjectField(TEXT("payload"))
		: JsonParsed;

	DispatchPacket(Opcode, Subcode, Payload);
}

void UDasiNetworkSubsystem::OnWebSocketRawMessage(const void* Data, SIZE_T Size, SIZE_T BytesRemaining)
{
	if (BytesRemaining > 0)
	{
		UE_LOG(LogDasiClient, Warning, TEXT("UDasiNetworkSubsystem: Fragmentos de mensagem binária pendentes: %llu bytes"), BytesRemaining);
	}

	FDasiRawPacket DecodedPacket;
	if (DecodeC1C2BinaryPacket(static_cast<const uint8*>(Data), static_cast<int32>(Size), DecodedPacket))
	{
		DispatchPacket(DecodedPacket.Opcode, DecodedPacket.Subcode, DecodedPacket.JsonPayloadObject);
	}
	else
	{
		UE_LOG(LogDasiClient, Warning, TEXT("UDasiNetworkSubsystem: Falha ao decodificar frame binário C1/C2 de %llu bytes"), Size);
	}
}

void UDasiNetworkSubsystem::DispatchPacket(uint8 Opcode, uint8 Subcode, const TSharedPtr<FJsonObject>& Payload)
{
	// 1. Handshake Challenge (0x01:0x02)
	if (Opcode == DasiOpcodes::OP_HANDSHAKE_CHALLENGE && Subcode == DasiOpcodes::SUB_HANDSHAKE_CHALLENGE)
	{
		HandleHandshakeChallenge(Payload);
		return;
	}

	// 2. Auth Login Response (0x01:0x04)
	if (Opcode == DasiOpcodes::OP_AUTH_LOGIN_RES && Subcode == DasiOpcodes::SUB_AUTH_LOGIN_RES)
	{
		HandleAuthLoginResponse(Payload);
		return;
	}

	// 3. Pong Heartbeat (0x02:0x02)
	if (Opcode == DasiOpcodes::OP_PONG && Subcode == DasiOpcodes::SUB_PONG)
	{
		HandlePong(Payload);
		return;
	}

	// 4. Monstros Spawn / Movimento (0x15:0x01)
	if (Opcode == DasiOpcodes::OP_MONSTER_SPAWN_OR_MOVE && Subcode == DasiOpcodes::SUB_MONSTER_SPAWN_OR_MOVE)
	{
		HandleMonsterSpawnOrMove(Payload);
		return;
	}

	// 5. Drops no Chão (0x16:0x01)
	if (Opcode == DasiOpcodes::OP_GROUND_ITEM_DROP && Subcode == DasiOpcodes::SUB_GROUND_ITEM_DROP)
	{
		HandleGroundItemDrop(Payload);
		return;
	}

	// 6. Coleta de Drop (0x16:0x02)
	if (Opcode == DasiOpcodes::OP_GROUND_ITEM_PICKUP_RES && Subcode == DasiOpcodes::SUB_GROUND_ITEM_PICKUP_RES)
	{
		HandleGroundItemPickupResponse(Payload);
		return;
	}

	// 7. Remoção de Drop do Chão (0x16:0x03)
	if (Opcode == DasiOpcodes::OP_GROUND_ITEM_REMOVE && Subcode == DasiOpcodes::SUB_GROUND_ITEM_REMOVE)
	{
		HandleGroundItemRemove(Payload);
		return;
	}

	// 8. Combate: Resultado de Ataque (0x50:0x02)
	if (Opcode == DasiOpcodes::OP_COMBAT_ATTACK_RES && Subcode == DasiOpcodes::SUB_COMBAT_ATTACK_RES)
	{
		HandleCombatAttackResponse(Payload);
		return;
	}

	// 9. Inventário: Sincronização Completa (0x70:0x01)
	if (Opcode == DasiOpcodes::OP_INVENTORY_SYNC_ALL && Subcode == DasiOpcodes::SUB_INVENTORY_SYNC_ALL)
	{
		HandleInventorySyncAll(Payload);
		return;
	}

	// 10. Inventário: Resposta de Movimento (0x70:0x03)
	if (Opcode == DasiOpcodes::OP_ITEM_MOVE_RES && Subcode == DasiOpcodes::SUB_ITEM_MOVE_RES)
	{
		HandleItemMoveResponse(Payload);
		return;
	}

	// 11. Joias Sagradas: Resposta de Refino (0x71:0x02)
	if (Opcode == DasiOpcodes::OP_ITEM_USE_JEWEL_RES && Subcode == DasiOpcodes::SUB_ITEM_USE_JEWEL_RES)
	{
		HandleItemUseJewelResponse(Payload);
		return;
	}

	// 12. Telemetria de Vitais do Jogador (0x10:0x01)
	if (Opcode == DasiOpcodes::OP_PLAYER_STATUS && Subcode == DasiOpcodes::SUB_PLAYER_STATUS_VITALS)
	{
		HandlePlayerStatusVitals(Payload);
		return;
	}

	// 13. Telemetria de Experiência do Jogador (0x10:0x02)
	if (Opcode == DasiOpcodes::OP_PLAYER_STATUS && Subcode == DasiOpcodes::SUB_PLAYER_STATUS_EXP)
	{
		HandlePlayerStatusExp(Payload);
		return;
	}

	// 14. Action Bar & Cooldowns de Habilidades (0x51:0x02)
	if (Opcode == DasiOpcodes::OP_ACTION_COOLDOWN_RES && Subcode == DasiOpcodes::SUB_ACTION_COOLDOWN_RES)
	{
		HandleSkillCooldownResponse(Payload);
		return;
	}

	UE_LOG(LogDasiClient, Warning, TEXT("UDasiNetworkSubsystem: Opcode não tratado: 0x%02X:0x%02X"), Opcode, Subcode);
}

void UDasiNetworkSubsystem::HandleHandshakeChallenge(const TSharedPtr<FJsonObject>& Payload)
{
	const FString ServerVer = Payload.IsValid() ? Payload->GetStringField(TEXT("serverVersion")) : TEXT("1.0.0");
	UE_LOG(LogDasiClient, Log, TEXT("UDasiNetworkSubsystem: Handshake Challenge recebido (Versão Servidor: %s)"), *ServerVer);

	// Envia automaticamente a requisição de login inicial com herói padrão
	SendLoginRequest(TEXT("HeroOfDasi"), TEXT("DK"));
}

void UDasiNetworkSubsystem::HandleAuthLoginResponse(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid()) return;

	const bool bSuccess = Payload->GetBoolField(TEXT("success"));
	ActiveSessionId = Payload->GetStringField(TEXT("sessionId"));
	ActiveAuthToken = Payload->GetStringField(TEXT("token"));

	if (bSuccess)
	{
		bIsAuthenticated = true;

		if (Payload->HasTypedField<EJson::Object>(TEXT("character")))
		{
			const TSharedPtr<FJsonObject> CharObj = Payload->GetObjectField(TEXT("character"));
			CurrentCharacter.Name = CharObj->GetStringField(TEXT("name"));
			CurrentCharacter.CharacterClass = CharObj->GetStringField(TEXT("characterClass"));
			CurrentCharacter.Level = CharObj->GetIntegerField(TEXT("level"));
			CurrentCharacter.Strength = CharObj->GetIntegerField(TEXT("strength"));
			CurrentCharacter.Agility = CharObj->GetIntegerField(TEXT("agility"));
			CurrentCharacter.Vitality = CharObj->GetIntegerField(TEXT("vitality"));
			CurrentCharacter.Energy = CharObj->GetIntegerField(TEXT("energy"));
		}

		UE_LOG(LogDasiClient, Log, TEXT("UDasiNetworkSubsystem: Login aprovado! [Hero: %s, Classe: %s, Nível: %d, Sessão: %s]"),
			*CurrentCharacter.Name, *CurrentCharacter.CharacterClass, CurrentCharacter.Level, *ActiveSessionId);

		OnAuthSuccess.Broadcast(CurrentCharacter, ActiveSessionId);

		// Inicializa telemetria de vitais e experiência com base nos atributos do personagem
		const int32 BaseHp = 100 + (CurrentCharacter.Vitality * 2);
		const int32 BaseMp = 80 + (CurrentCharacter.Energy * 2);
		const int32 BaseSd = 100 + (CurrentCharacter.Strength + CurrentCharacter.Agility);
		const int32 BaseSta = 100;
		OnPlayerVitalsUpdated.Broadcast(BaseHp, BaseHp, BaseMp, BaseMp, BaseSd, BaseSd, BaseSta, BaseSta);
		OnPlayerExpUpdated.Broadcast(0, 1000 * FMath::Max(1, CurrentCharacter.Level), CurrentCharacter.Level);

		// Esvazia fila de comandos acumulados durante a conexão
		FlushPacketQueue();
	}
	else
	{
		const FString ErrMsg = Payload->GetStringField(TEXT("message"));
		UE_LOG(LogDasiClient, Error, TEXT("UDasiNetworkSubsystem: Falha na autenticação: %s"), *ErrMsg);
		OnConnectionError.Broadcast(ErrMsg);
	}
}

void UDasiNetworkSubsystem::HandlePong(const TSharedPtr<FJsonObject>& Payload)
{
	if (LastPingTimestamp > 0.0)
	{
		const double Now = FPlatformTime::Seconds();
		CurrentLatencyMs = static_cast<float>((Now - LastPingTimestamp) * 1000.0);
		OnLatencyUpdated.Broadcast(CurrentLatencyMs);
	}
}

void UDasiNetworkSubsystem::HandleMonsterSpawnOrMove(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid() || !Payload->HasTypedField<EJson::Array>(TEXT("monsters"))) return;

	TArray<FDasiSerializedMonster> Monsters;
	const TArray<TSharedPtr<FJsonValue>>& MobArray = Payload->GetArrayField(TEXT("monsters"));

	for (const TSharedPtr<FJsonValue>& Val : MobArray)
	{
		const TSharedPtr<FJsonObject> MobObj = Val->AsObject();
		if (MobObj.IsValid())
		{
			Monsters.Add(DasiNetworkParsers::ParseMonster(MobObj));
		}
	}

	OnMonstersUpdated.Broadcast(Monsters);
}

void UDasiNetworkSubsystem::HandleGroundItemDrop(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid() || !Payload->HasTypedField<EJson::Array>(TEXT("drops"))) return;

	TArray<FDasiGroundDropItem> Drops;
	const TArray<TSharedPtr<FJsonValue>>& DropsArray = Payload->GetArrayField(TEXT("drops"));

	for (const TSharedPtr<FJsonValue>& Val : DropsArray)
	{
		const TSharedPtr<FJsonObject> DropObj = Val->AsObject();
		if (DropObj.IsValid())
		{
			Drops.Add(DasiNetworkParsers::ParseGroundDrop(DropObj));
		}
	}

	OnGroundDropsUpdated.Broadcast(Drops);
}

void UDasiNetworkSubsystem::HandleGroundItemPickupResponse(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid()) return;

	const bool bSuccess = Payload->GetBoolField(TEXT("success"));
	const FString DropId = Payload->GetStringField(TEXT("dropId"));

	if (bSuccess)
	{
		OnGroundItemRemoved.Broadcast(DropId);

		if (Payload->HasTypedField<EJson::Object>(TEXT("inventoryState")))
		{
			const FDasiInventoryState InvState = DasiNetworkParsers::ParseInventoryState(Payload->GetObjectField(TEXT("inventoryState")));
			TArray<FDasiItemDefinition> EmptyDefs;
			OnInventorySynced.Broadcast(InvState, EmptyDefs);
		}
	}
}

void UDasiNetworkSubsystem::HandleGroundItemRemove(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid()) return;
	const FString DropId = Payload->GetStringField(TEXT("dropId"));
	OnGroundItemRemoved.Broadcast(DropId);
}

void UDasiNetworkSubsystem::HandleCombatAttackResponse(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid()) return;

	FDasiCombatAttackResult Result;
	Result.bSuccess = Payload->GetBoolField(TEXT("success"));
	Result.AttackerId = Payload->GetStringField(TEXT("attackerId"));
	Result.TargetId = Payload->GetStringField(TEXT("targetId"));
	Result.bIsMiss = Payload->HasField(TEXT("isMiss")) && Payload->GetBoolField(TEXT("isMiss"));
	Result.Damage = Payload->HasField(TEXT("damage")) ? Payload->GetIntegerField(TEXT("damage")) : 0;
	Result.DamageType = Payload->HasField(TEXT("damageType")) ? Payload->GetStringField(TEXT("damageType")) : TEXT("NORMAL");
	Result.ColorHex = Payload->HasField(TEXT("colorHex")) ? Payload->GetStringField(TEXT("colorHex")) : TEXT("#ffffff");
	Result.TargetHp = Payload->HasField(TEXT("targetHp")) ? Payload->GetIntegerField(TEXT("targetHp")) : 0;
	Result.TargetMaxHp = Payload->HasField(TEXT("targetMaxHp")) ? Payload->GetIntegerField(TEXT("targetMaxHp")) : 0;
	Result.bIsDead = Payload->HasField(TEXT("isDead")) && Payload->GetBoolField(TEXT("isDead"));
	Result.bStaggered = Payload->HasField(TEXT("staggered")) && Payload->GetBoolField(TEXT("staggered"));
	Result.HitStopMs = Payload->HasField(TEXT("hitStopMs")) ? Payload->GetIntegerField(TEXT("hitStopMs")) : 0;
	Result.XpGained = Payload->HasField(TEXT("xpGained")) ? Payload->GetIntegerField(TEXT("xpGained")) : 0;

	if (Payload->HasTypedField<EJson::Object>(TEXT("knockback")))
	{
		const TSharedPtr<FJsonObject> KbObj = Payload->GetObjectField(TEXT("knockback"));
		Result.Knockback.X = static_cast<float>(KbObj->GetNumberField(TEXT("x")));
		Result.Knockback.Y = static_cast<float>(KbObj->GetNumberField(TEXT("y")));
	}

	if (Payload->HasTypedField<EJson::Array>(TEXT("dropsGenerated")))
	{
		for (const TSharedPtr<FJsonValue>& DropVal : Payload->GetArrayField(TEXT("dropsGenerated")))
		{
			Result.DropsGenerated.Add(DasiNetworkParsers::ParseGroundDrop(DropVal->AsObject()));
		}
	}

	OnCombatAttackResult.Broadcast(Result);

	// Notifica telemetria de feedback de combate para o HUD
	EDasiDamageType DmgType = EDasiDamageType::Normal;
	if (Result.DamageType.Equals(TEXT("SKILL"), ESearchCase::IgnoreCase)) DmgType = EDasiDamageType::Skill;
	else if (Result.DamageType.Equals(TEXT("CRITICAL"), ESearchCase::IgnoreCase)) DmgType = EDasiDamageType::Critical;
	else if (Result.DamageType.Equals(TEXT("EXCELLENT"), ESearchCase::IgnoreCase)) DmgType = EDasiDamageType::Excellent;
	else if (Result.DamageType.Equals(TEXT("IGNORE_DEFENSE"), ESearchCase::IgnoreCase)) DmgType = EDasiDamageType::IgnoreDefense;
	else if (Result.bIsMiss) DmgType = EDasiDamageType::Miss;

	OnCombatFeedbackReceived.Broadcast(Result.Damage, DmgType, FVector(Result.Knockback.X, Result.Knockback.Y, 0.0f));
}

void UDasiNetworkSubsystem::HandleInventorySyncAll(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid()) return;

	FDasiInventoryState State;
	if (Payload->HasTypedField<EJson::Object>(TEXT("inventory")))
	{
		State = DasiNetworkParsers::ParseInventoryState(Payload->GetObjectField(TEXT("inventory")));
	}

	TArray<FDasiItemDefinition> Definitions;
	if (Payload->HasTypedField<EJson::Object>(TEXT("definitions")))
	{
		const TSharedPtr<FJsonObject> DefsObj = Payload->GetObjectField(TEXT("definitions"));
		for (const auto& Pair : DefsObj->Values)
		{
			const TSharedPtr<FJsonObject> DefObj = Pair.Value->AsObject();
			if (DefObj.IsValid())
			{
				Definitions.Add(DasiNetworkParsers::ParseItemDefinition(DefObj));
			}
		}
	}
	else if (Payload->HasTypedField<EJson::Array>(TEXT("definitions")))
	{
		for (const TSharedPtr<FJsonValue>& DefVal : Payload->GetArrayField(TEXT("definitions")))
		{
			Definitions.Add(DasiNetworkParsers::ParseItemDefinition(DefVal->AsObject()));
		}
	}

	UE_LOG(LogDasiClient, Log, TEXT("UDasiNetworkSubsystem: Sincronização total de inventário (%d itens na grade, %d equipados, %d definições)"),
		State.Items.Num(), State.Equipped.Num(), Definitions.Num());

	OnInventorySynced.Broadcast(State, Definitions);
}

void UDasiNetworkSubsystem::HandleItemMoveResponse(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid()) return;

	FDasiItemMoveResponse Response;
	Response.bSuccess = Payload->GetBoolField(TEXT("success"));
	Response.ItemUuid = Payload->GetStringField(TEXT("itemUuid"));
	Response.SourceType = static_cast<EDasiLocationType>(Payload->GetIntegerField(TEXT("sourceType")));
	Response.TargetType = static_cast<EDasiLocationType>(Payload->GetIntegerField(TEXT("targetType")));
	Response.NewX = Payload->HasField(TEXT("newX")) ? Payload->GetIntegerField(TEXT("newX")) : 0;
	Response.NewY = Payload->HasField(TEXT("newY")) ? Payload->GetIntegerField(TEXT("newY")) : 0;
	Response.bRotated = Payload->HasField(TEXT("rotated")) && Payload->GetBoolField(TEXT("rotated"));
	Response.Error = Payload->HasField(TEXT("error")) ? Payload->GetStringField(TEXT("error")) : TEXT("");

	if (Payload->HasField(TEXT("targetSlot")))
	{
		Response.TargetSlot = DasiInventoryUtils::StringToEquipmentSlot(Payload->GetStringField(TEXT("targetSlot")));
	}

	if (Payload->HasTypedField<EJson::Object>(TEXT("inventoryState")))
	{
		Response.bHasInventoryState = true;
		Response.InventoryState = DasiNetworkParsers::ParseInventoryState(Payload->GetObjectField(TEXT("inventoryState")));
	}

	OnItemMoveResult.Broadcast(Response);
}

void UDasiNetworkSubsystem::HandleItemUseJewelResponse(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid()) return;

	FDasiJewelRefineResult Result;
	Result.bSuccess = Payload->GetBoolField(TEXT("success"));
	Result.Outcome = DasiInventoryUtils::StringToUpgradeOutcome(Payload->GetStringField(TEXT("outcome")));
	Result.JewelUuid = Payload->GetStringField(TEXT("jewelUuid"));
	Result.TargetUuid = Payload->GetStringField(TEXT("targetUuid"));
	Result.PreviousLevel = Payload->HasField(TEXT("previousLevel")) ? Payload->GetIntegerField(TEXT("previousLevel")) : 0;
	Result.NewLevel = Payload->HasField(TEXT("newLevel")) ? Payload->GetIntegerField(TEXT("newLevel")) : 0;
	Result.PreviousOption = Payload->HasField(TEXT("previousOption")) ? Payload->GetIntegerField(TEXT("previousOption")) : 0;
	Result.NewOption = Payload->HasField(TEXT("newOption")) ? Payload->GetIntegerField(TEXT("newOption")) : 0;
	Result.bItemDestroyed = Payload->HasField(TEXT("itemDestroyed")) && Payload->GetBoolField(TEXT("itemDestroyed"));
	Result.Message = Payload->HasField(TEXT("message")) ? Payload->GetStringField(TEXT("message")) : TEXT("");

	if (Payload->HasTypedField<EJson::Object>(TEXT("updatedItem")))
	{
		Result.bHasUpdatedItem = true;
		Result.UpdatedItem = DasiNetworkParsers::ParseItemInstance(Payload->GetObjectField(TEXT("updatedItem")));
	}

	if (Payload->HasTypedField<EJson::Object>(TEXT("inventoryState")))
	{
		Result.bHasInventoryState = true;
		Result.InventoryState = DasiNetworkParsers::ParseInventoryState(Payload->GetObjectField(TEXT("inventoryState")));
	}

	OnJewelRefineResult.Broadcast(Result);
}

// ==========================================
// COMANDOS DE ENVIO
// ==========================================

void UDasiNetworkSubsystem::SendLoginRequest(const FString& Username, const FString& CharacterClass)
{
	TSharedPtr<FJsonObject> LoginPayload = MakeShared<FJsonObject>();
	LoginPayload->SetStringField(TEXT("username"), Username);
	LoginPayload->SetStringField(TEXT("characterClass"), CharacterClass);

	SendJsonPacket(DasiOpcodes::OP_AUTH_LOGIN_REQ, DasiOpcodes::SUB_AUTH_LOGIN_REQ, LoginPayload);
}

void UDasiNetworkSubsystem::SendItemMove(const FString& ItemUuid, EDasiLocationType SourceType, int32 SourceX, int32 SourceY, EDasiEquipmentSlot SourceSlot, EDasiLocationType TargetType, int32 TargetX, int32 TargetY, EDasiEquipmentSlot TargetSlot, bool bRotated)
{
	TSharedPtr<FJsonObject> MovePayload = MakeShared<FJsonObject>();
	MovePayload->SetStringField(TEXT("itemUuid"), ItemUuid);
	MovePayload->SetNumberField(TEXT("sourceType"), static_cast<int32>(SourceType));
	MovePayload->SetNumberField(TEXT("targetType"), static_cast<int32>(TargetType));
	MovePayload->SetBoolField(TEXT("rotated"), bRotated);

	if (SourceType == EDasiLocationType::Grid)
	{
		MovePayload->SetNumberField(TEXT("sourceX"), SourceX);
		MovePayload->SetNumberField(TEXT("sourceY"), SourceY);
	}
	else
	{
		MovePayload->SetStringField(TEXT("sourceSlot"), DasiInventoryUtils::EquipmentSlotToString(SourceSlot));
	}

	if (TargetType == EDasiLocationType::Grid)
	{
		MovePayload->SetNumberField(TEXT("targetX"), TargetX);
		MovePayload->SetNumberField(TEXT("targetY"), TargetY);
	}
	else
	{
		MovePayload->SetStringField(TEXT("targetSlot"), DasiInventoryUtils::EquipmentSlotToString(TargetSlot));
	}

	SendJsonPacket(DasiOpcodes::OP_ITEM_MOVE_REQ, DasiOpcodes::SUB_ITEM_MOVE_REQ, MovePayload);
}

void UDasiNetworkSubsystem::SendUseJewel(const FString& JewelUuid, const FString& TargetUuid, EDasiLocationType TargetLocation, EDasiEquipmentSlot TargetSlot, int32 TargetX, int32 TargetY)
{
	TSharedPtr<FJsonObject> JewelPayload = MakeShared<FJsonObject>();
	JewelPayload->SetStringField(TEXT("jewelUuid"), JewelUuid);
	JewelPayload->SetStringField(TEXT("targetUuid"), TargetUuid);
	JewelPayload->SetNumberField(TEXT("targetLocation"), static_cast<int32>(TargetLocation));

	if (TargetLocation == EDasiLocationType::Equipment)
	{
		JewelPayload->SetStringField(TEXT("targetSlot"), DasiInventoryUtils::EquipmentSlotToString(TargetSlot));
	}
	else
	{
		JewelPayload->SetNumberField(TEXT("targetX"), TargetX);
		JewelPayload->SetNumberField(TEXT("targetY"), TargetY);
	}

	SendJsonPacket(DasiOpcodes::OP_ITEM_USE_JEWEL_REQ, DasiOpcodes::SUB_ITEM_USE_JEWEL_REQ, JewelPayload);
}

void UDasiNetworkSubsystem::SendCombatAttack(const FString& TargetMobId, const FString& SkillId, float PlayerX, float PlayerY)
{
	TSharedPtr<FJsonObject> CombatPayload = MakeShared<FJsonObject>();
	CombatPayload->SetStringField(TEXT("targetMobId"), TargetMobId);
	CombatPayload->SetStringField(TEXT("skillId"), SkillId);
	CombatPayload->SetNumberField(TEXT("playerX"), PlayerX);
	CombatPayload->SetNumberField(TEXT("playerY"), PlayerY);

	SendJsonPacket(DasiOpcodes::OP_COMBAT_ATTACK_REQ, DasiOpcodes::SUB_COMBAT_ATTACK_REQ, CombatPayload);
}

void UDasiNetworkSubsystem::SendPickupGroundItem(const FString& DropId, float PlayerX, float PlayerY)
{
	TSharedPtr<FJsonObject> PickupPayload = MakeShared<FJsonObject>();
	PickupPayload->SetStringField(TEXT("dropId"), DropId);
	PickupPayload->SetNumberField(TEXT("playerX"), PlayerX);
	PickupPayload->SetNumberField(TEXT("playerY"), PlayerY);

	SendJsonPacket(DasiOpcodes::OP_GROUND_ITEM_PICKUP_REQ, DasiOpcodes::SUB_GROUND_ITEM_PICKUP_REQ, PickupPayload);
}

void UDasiNetworkSubsystem::RequestInventorySync()
{
	TSharedPtr<FJsonObject> SyncPayload = MakeShared<FJsonObject>();
	SendJsonPacket(DasiOpcodes::OP_INVENTORY_SYNC_ALL, DasiOpcodes::SUB_INVENTORY_SYNC_ALL, SyncPayload);
}

void UDasiNetworkSubsystem::SendActionExecute(FName ActionKey, FName SkillId, const FString& TargetId, float TargetX, float TargetY)
{
	TSharedPtr<FJsonObject> Payload = MakeShared<FJsonObject>();
	Payload->SetStringField(TEXT("actionKey"), ActionKey.ToString());
	Payload->SetStringField(TEXT("skillId"), SkillId.ToString());
	Payload->SetStringField(TEXT("targetId"), TargetId);
	Payload->SetNumberField(TEXT("targetX"), TargetX);
	Payload->SetNumberField(TEXT("targetY"), TargetY);
	Payload->SetNumberField(TEXT("clientTime"), FPlatformTime::Seconds());

	SendJsonPacket(DasiOpcodes::OP_ACTION_EXECUTE_REQ, DasiOpcodes::SUB_ACTION_EXECUTE_REQ, Payload);
}

void UDasiNetworkSubsystem::SendUsePotion(const FString& PotionType)
{
	TSharedPtr<FJsonObject> Payload = MakeShared<FJsonObject>();
	Payload->SetStringField(TEXT("potionType"), PotionType);
	Payload->SetNumberField(TEXT("clientTime"), FPlatformTime::Seconds());

	SendJsonPacket(DasiOpcodes::OP_POTION_USE_REQ, DasiOpcodes::SUB_POTION_USE_REQ, Payload);
}

void UDasiNetworkSubsystem::SendCombatDodge(float DirectionX, float DirectionY)
{
	TSharedPtr<FJsonObject> Payload = MakeShared<FJsonObject>();
	Payload->SetNumberField(TEXT("dirX"), DirectionX);
	Payload->SetNumberField(TEXT("dirY"), DirectionY);
	Payload->SetNumberField(TEXT("clientTime"), FPlatformTime::Seconds());

	SendJsonPacket(DasiOpcodes::OP_DODGE_REQ, DasiOpcodes::SUB_DODGE_REQ, Payload);
}

void UDasiNetworkSubsystem::HandlePlayerStatusVitals(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid()) return;

	const int32 CurrentHp = Payload->HasField(TEXT("currentHp")) ? Payload->GetIntegerField(TEXT("currentHp")) : 100;
	const int32 MaxHp = Payload->HasField(TEXT("maxHp")) ? Payload->GetIntegerField(TEXT("maxHp")) : 100;
	const int32 CurrentMp = Payload->HasField(TEXT("currentMp")) ? Payload->GetIntegerField(TEXT("currentMp")) : 100;
	const int32 MaxMp = Payload->HasField(TEXT("maxMp")) ? Payload->GetIntegerField(TEXT("maxMp")) : 100;
	const int32 CurrentSd = Payload->HasField(TEXT("currentSd")) ? Payload->GetIntegerField(TEXT("currentSd")) : 100;
	const int32 MaxSd = Payload->HasField(TEXT("maxSd")) ? Payload->GetIntegerField(TEXT("maxSd")) : 100;
	const int32 CurrentSta = Payload->HasField(TEXT("currentSta")) ? Payload->GetIntegerField(TEXT("currentSta")) : 100;
	const int32 MaxSta = Payload->HasField(TEXT("maxSta")) ? Payload->GetIntegerField(TEXT("maxSta")) : 100;

	OnPlayerVitalsUpdated.Broadcast(CurrentHp, MaxHp, CurrentMp, MaxMp, CurrentSd, MaxSd, CurrentSta, MaxSta);
}

void UDasiNetworkSubsystem::HandlePlayerStatusExp(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid()) return;

	const int64 CurrentXp = Payload->HasField(TEXT("currentXp")) ? static_cast<int64>(Payload->GetNumberField(TEXT("currentXp"))) : 0;
	const int64 NextLevelXp = Payload->HasField(TEXT("nextLevelXp")) ? static_cast<int64>(Payload->GetNumberField(TEXT("nextLevelXp"))) : 1000;
	const int32 Level = Payload->HasField(TEXT("level")) ? Payload->GetIntegerField(TEXT("level")) : 1;

	OnPlayerExpUpdated.Broadcast(CurrentXp, NextLevelXp, Level);
}

void UDasiNetworkSubsystem::HandleSkillCooldownResponse(const TSharedPtr<FJsonObject>& Payload)
{
	if (!Payload.IsValid()) return;

	const FName ActionKey = FName(*Payload->GetStringField(TEXT("actionKey")));
	const float Duration = static_cast<float>(Payload->GetNumberField(TEXT("duration")));

	OnSkillCooldownReceived.Broadcast(ActionKey, Duration);
}

void UDasiNetworkSubsystem::SendDevSpawnItem(const FString& ItemDefId, int32 Level, int32 ExcellentMask, bool bLuck, bool bSkill, int32 Count)
{
	TSharedPtr<FJsonObject> SpawnPayload = MakeShared<FJsonObject>();
	SpawnPayload->SetStringField(TEXT("itemDefId"), ItemDefId);
	SpawnPayload->SetNumberField(TEXT("level"), Level);
	SpawnPayload->SetNumberField(TEXT("excellentMask"), ExcellentMask);
	SpawnPayload->SetBoolField(TEXT("luck"), bLuck);
	SpawnPayload->SetBoolField(TEXT("skill"), bSkill);
	SpawnPayload->SetNumberField(TEXT("count"), Count);

	SendJsonPacket(DasiOpcodes::OP_ITEM_SPAWN_DEV_REQ, DasiOpcodes::SUB_ITEM_SPAWN_DEV_REQ, SpawnPayload);
}

// ==========================================
// SERIALIZAÇÃO & ENVIO DE PACOTES
// ==========================================

void UDasiNetworkSubsystem::SendJsonPacket(uint8 Opcode, uint8 Subcode, const TSharedPtr<FJsonObject>& PayloadObject)
{
	OutgoingSequence++;

	TSharedPtr<FJsonObject> RootObject = MakeShared<FJsonObject>();
	RootObject->SetNumberField(TEXT("opcode"), Opcode);
	RootObject->SetNumberField(TEXT("subcode"), Subcode);
	RootObject->SetNumberField(TEXT("seq"), OutgoingSequence);
	RootObject->SetObjectField(TEXT("payload"), PayloadObject);

	FString SerializedText;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&SerializedText);
	FJsonSerializer::Serialize(RootObject.ToSharedRef(), Writer);

	if (!WebSocket.IsValid() || !WebSocket->IsConnected())
	{
		// Enfileira se ainda não conectou
		FDasiQueuedPacket Queued;
		Queued.Opcode = Opcode;
		Queued.Subcode = Subcode;
		Queued.JsonPayload = SerializedText;
		Queued.bBinary = false;
		QueuedPackets.Add(Queued);
		return;
	}

	WebSocket->Send(SerializedText);
}

void UDasiNetworkSubsystem::SendBinaryPacket(uint8 Opcode, uint8 Subcode, const TSharedPtr<FJsonObject>& PayloadObject)
{
	OutgoingSequence++;

	FString SerializedText;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&SerializedText);
	FJsonSerializer::Serialize(PayloadObject.ToSharedRef(), Writer);

	const TArray<uint8> Encoded = EncodeC1C2BinaryPacket(Opcode, Subcode, OutgoingSequence, SerializedText);

	if (!WebSocket.IsValid() || !WebSocket->IsConnected())
	{
		FDasiQueuedPacket Queued;
		Queued.Opcode = Opcode;
		Queued.Subcode = Subcode;
		Queued.JsonPayload = SerializedText;
		Queued.bBinary = true;
		QueuedPackets.Add(Queued);
		return;
	}

	WebSocket->Send(Encoded.GetData(), Encoded.Num(), true);
}

// ==========================================
// CÁLCULO DE CRC16 & ENQUADRAMENTO C1/C2
// ==========================================

uint16 UDasiNetworkSubsystem::CalculateCRC16(const uint8* Data, int32 Length)
{
	uint16 CRC = 0xFFFF;
	for (int32 i = 0; i < Length; ++i)
	{
		CRC ^= (static_cast<uint16>(Data[i]) << 8);
		for (int32 j = 0; j < 8; ++j)
		{
			if ((CRC & 0x8000) != 0)
			{
				CRC = static_cast<uint16>((CRC << 1) ^ 0x1021);
			}
			else
			{
				CRC = static_cast<uint16>(CRC << 1);
			}
		}
	}
	return CRC;
}

TArray<uint8> UDasiNetworkSubsystem::EncodeC1C2BinaryPacket(uint8 Opcode, uint8 Subcode, uint32 Seq, const FString& JsonPayload)
{
	FTCHARToUTF8 Utf8Converter(*JsonPayload);
	const int32 PayloadLen = Utf8Converter.Length();

	TArray<uint8> Buffer;

	if (PayloadLen + 10 <= 255)
	{
		// Enquadramento C1 (Cabeçalho de 10 bytes)
		const uint8 TotalLen = static_cast<uint8>(PayloadLen + 10);
		Buffer.SetNumUninitialized(TotalLen);

		Buffer[0] = 0xC1;
		Buffer[1] = TotalLen;
		Buffer[2] = Opcode;
		Buffer[3] = Subcode;

		// Seq Big-Endian (bytes 4..7)
		Buffer[4] = static_cast<uint8>((Seq >> 24) & 0xFF);
		Buffer[5] = static_cast<uint8>((Seq >> 16) & 0xFF);
		Buffer[6] = static_cast<uint8>((Seq >> 8) & 0xFF);
		Buffer[7] = static_cast<uint8>(Seq & 0xFF);

		// Checksum temporário 0 (bytes 8..9)
		Buffer[8] = 0;
		Buffer[9] = 0;

		FMemory::Memcpy(Buffer.GetData() + 10, Utf8Converter.Get(), PayloadLen);

		// CRC16 sobre os bytes de índice 2 até o fim
		const uint16 CRC = CalculateCRC16(Buffer.GetData() + 2, TotalLen - 2);
		Buffer[8] = static_cast<uint8>((CRC >> 8) & 0xFF);
		Buffer[9] = static_cast<uint8>(CRC & 0xFF);
	}
	else
	{
		// Enquadramento C2 (Cabeçalho de 12 bytes)
		const uint16 TotalLen = static_cast<uint16>(PayloadLen + 12);
		Buffer.SetNumUninitialized(TotalLen);

		Buffer[0] = 0xC2;
		Buffer[1] = static_cast<uint8>((TotalLen >> 8) & 0xFF);
		Buffer[2] = static_cast<uint8>(TotalLen & 0xFF);
		Buffer[3] = Opcode;
		Buffer[4] = Subcode;

		// Checksum temporário 0 (bytes 5..6)
		Buffer[5] = 0;
		Buffer[6] = 0;

		// Seq Big-Endian (bytes 7..10)
		Buffer[7] = static_cast<uint8>((Seq >> 24) & 0xFF);
		Buffer[8] = static_cast<uint8>((Seq >> 16) & 0xFF);
		Buffer[9] = static_cast<uint8>((Seq >> 8) & 0xFF);
		Buffer[10] = static_cast<uint8>(Seq & 0xFF);

		FMemory::Memcpy(Buffer.GetData() + 11, Utf8Converter.Get(), PayloadLen);

		// CRC16 sobre os bytes de índice 3 até o fim
		const uint16 CRC = CalculateCRC16(Buffer.GetData() + 3, TotalLen - 3);
		Buffer[5] = static_cast<uint8>((CRC >> 8) & 0xFF);
		Buffer[6] = static_cast<uint8>(CRC & 0xFF);
	}

	return Buffer;
}

bool UDasiNetworkSubsystem::DecodeC1C2BinaryPacket(const uint8* Data, int32 Length, FDasiRawPacket& OutPacket)
{
	if (!Data || Length < 10) return false;

	const uint8 Header = Data[0];

	if (Header == 0xC1)
	{
		const uint8 TotalLen = Data[1];
		if (Length < TotalLen) return false;

		OutPacket.Opcode = Data[2];
		OutPacket.Subcode = Data[3];
		OutPacket.Seq = (static_cast<uint32>(Data[4]) << 24) |
		                (static_cast<uint32>(Data[5]) << 16) |
		                (static_cast<uint32>(Data[6]) << 8)  |
		                static_cast<uint32>(Data[7]);

		const int32 PayloadBytes = TotalLen - 10;
		if (PayloadBytes > 0)
		{
			FUTF8ToTCHAR Converter(reinterpret_cast<const ANSICHAR*>(Data + 10), PayloadBytes);
			OutPacket.JsonPayloadString = FString(Converter.Length(), Converter.Get());

			TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(OutPacket.JsonPayloadString);
			FJsonSerializer::Deserialize(Reader, OutPacket.JsonPayloadObject);
		}

		return true;
	}
	else if (Header == 0xC2)
	{
		if (Length < 12) return false;

		const uint16 TotalLen = (static_cast<uint16>(Data[1]) << 8) | static_cast<uint16>(Data[2]);
		if (Length < TotalLen) return false;

		OutPacket.Opcode = Data[3];
		OutPacket.Subcode = Data[4];
		OutPacket.Seq = (static_cast<uint32>(Data[7]) << 24) |
		                (static_cast<uint32>(Data[8]) << 16) |
		                (static_cast<uint32>(Data[9]) << 8)  |
		                static_cast<uint32>(Data[10]);

		const int32 PayloadBytes = TotalLen - 11;
		if (PayloadBytes > 0)
		{
			FUTF8ToTCHAR Converter(reinterpret_cast<const ANSICHAR*>(Data + 11), PayloadBytes);
			OutPacket.JsonPayloadString = FString(Converter.Length(), Converter.Get());

			TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(OutPacket.JsonPayloadString);
			FJsonSerializer::Deserialize(Reader, OutPacket.JsonPayloadObject);
		}

		return true;
	}

	return false;
}

// ==========================================
// HEARTBEAT & RECONEXÃO AUTOMÁTICA
// ==========================================

void UDasiNetworkSubsystem::StartHeartbeat()
{
	StopHeartbeat();

	if (UWorld* World = GetWorld())
	{
		World->GetTimerManager().SetTimer(
			HeartbeatTimerHandle,
			this,
			&UDasiNetworkSubsystem::SendHeartbeatPing,
			5.0f,
			true
		);
	}
}

void UDasiNetworkSubsystem::StopHeartbeat()
{
	if (UWorld* World = GetWorld())
	{
		World->GetTimerManager().ClearTimer(HeartbeatTimerHandle);
	}
}

void UDasiNetworkSubsystem::SendHeartbeatPing()
{
	if (!WebSocket.IsValid() || !WebSocket->IsConnected()) return;

	LastPingTimestamp = FPlatformTime::Seconds();

	TSharedPtr<FJsonObject> PingPayload = MakeShared<FJsonObject>();
	PingPayload->SetNumberField(TEXT("clientTime"), FDateTime::UtcNow().ToUnixTimestamp());

	SendJsonPacket(DasiOpcodes::OP_PING, DasiOpcodes::SUB_PING, PingPayload);
}

void UDasiNetworkSubsystem::ScheduleAutoReconnect()
{
	if (!bAutoReconnect) return;

	if (UWorld* World = GetWorld())
	{
		if (!World->GetTimerManager().IsTimerActive(ReconnectTimerHandle))
		{
			UE_LOG(LogDasiClient, Log, TEXT("UDasiNetworkSubsystem: Tentando reconexão em 3 segundos..."));
			World->GetTimerManager().SetTimer(
				ReconnectTimerHandle,
				this,
				&UDasiNetworkSubsystem::TryAutoReconnect,
				3.0f,
				false
			);
		}
	}
}

void UDasiNetworkSubsystem::TryAutoReconnect()
{
	if (!bAutoReconnect) return;
	UE_LOG(LogDasiClient, Log, TEXT("UDasiNetworkSubsystem: Executando tentativa de reconexão ao servidor..."));
	Connect(CurrentServerUrl);
}

void UDasiNetworkSubsystem::FlushPacketQueue()
{
	if (!WebSocket.IsValid() || !WebSocket->IsConnected()) return;

	for (const FDasiQueuedPacket& Packet : QueuedPackets)
	{
		if (Packet.bBinary)
		{
			const TArray<uint8> Encoded = EncodeC1C2BinaryPacket(Packet.Opcode, Packet.Subcode, ++OutgoingSequence, Packet.JsonPayload);
			WebSocket->Send(Encoded.GetData(), Encoded.Num(), true);
		}
		else
		{
			WebSocket->Send(Packet.JsonPayload);
		}
	}

	QueuedPackets.Empty();
}
