#include "Network/DasiNetworkBridge.h"
#include "Combat/DasiDamageNumberSubsystem.h"
#include "Combat/DasiCombatInterface.h"
#include "Serialization/JsonSerializer.h"
#include "Serialization/JsonWriter.h"
#include "Serialization/JsonReader.h"
#include "Dom/JsonObject.h"
#include "GameFramework/Character.h"
#include "DasiClient.h"

UDasiNetworkBridge::UDasiNetworkBridge()
{
}

FString UDasiNetworkBridge::SerializeAttackRequest(const FDasiNetCombatAttackReq& Req)
{
	TSharedPtr<FJsonObject> JsonObj = MakeShareable(new FJsonObject);
	JsonObj->SetNumberField(TEXT("opcode"), 0x50);
	JsonObj->SetNumberField(TEXT("subcode"), 0x01);

	TSharedPtr<FJsonObject> PayloadObj = MakeShareable(new FJsonObject);
	PayloadObj->SetStringField(TEXT("targetMobId"), Req.TargetMobId);
	PayloadObj->SetStringField(TEXT("skillId"), Req.SkillId);
	PayloadObj->SetNumberField(TEXT("playerX"), Req.PlayerX);
	PayloadObj->SetNumberField(TEXT("playerY"), Req.PlayerY);

	JsonObj->SetObjectField(TEXT("payload"), PayloadObj);

	FString OutputString;
	TSharedRef<TJsonWriter<>> Writer = TJsonWriterFactory<>::Create(&OutputString);
	FJsonSerializer::Serialize(JsonObj.ToSharedRef(), Writer);

	return OutputString;
}

bool UDasiNetworkBridge::DeserializeAttackResponse(const FString& JsonString, FDasiNetCombatAttackRes& OutRes)
{
	TSharedPtr<FJsonObject> JsonObj;
	TSharedRef<TJsonReader<>> Reader = TJsonReaderFactory<>::Create(JsonString);

	if (!FJsonSerializer::Deserialize(Reader, JsonObj) || !JsonObj.IsValid())
	{
		return false;
	}

	TSharedPtr<FJsonObject> Payload = JsonObj->GetObjectField(TEXT("payload"));
	if (!Payload.IsValid())
	{
		Payload = JsonObj; // Flat payload fallback
	}

	OutRes.bSuccess = Payload->GetBoolField(TEXT("success"));
	OutRes.AttackerId = Payload->GetStringField(TEXT("attackerId"));
	OutRes.TargetId = Payload->GetStringField(TEXT("targetId"));
	OutRes.bIsMiss = Payload->GetBoolField(TEXT("isMiss"));
	OutRes.Damage = Payload->GetNumberField(TEXT("damage"));
	OutRes.DamageType = Payload->GetStringField(TEXT("damageType"));
	OutRes.ColorHex = Payload->GetStringField(TEXT("colorHex"));
	OutRes.TargetHp = Payload->GetNumberField(TEXT("targetHp"));
	OutRes.TargetMaxHp = Payload->GetNumberField(TEXT("targetMaxHp"));
	OutRes.bIsDead = Payload->GetBoolField(TEXT("isDead"));
	OutRes.bStaggered = Payload->GetBoolField(TEXT("staggered"));
	OutRes.HitStopMs = Payload->GetNumberField(TEXT("hitStopMs"));

	const TSharedPtr<FJsonObject>* KnockbackObjPtr = nullptr;
	if (Payload->TryGetObjectField(TEXT("knockback"), KnockbackObjPtr) && KnockbackObjPtr && (*KnockbackObjPtr).IsValid())
	{
		OutRes.Knockback.X = (*KnockbackObjPtr)->GetNumberField(TEXT("x"));
		OutRes.Knockback.Y = (*KnockbackObjPtr)->GetNumberField(TEXT("y"));
	}

	OutRes.XpGained = Payload->GetIntegerField(TEXT("xpGained"));
	return true;
}

void UDasiNetworkBridge::HandleCombatAttackResponse(const FDasiNetCombatAttackRes& Response)
{
	AActor* TargetActor = FindEntityById(Response.TargetId);
	UWorld* World = GetWorld();

	if (World)
	{
		// 1. Dispatch 3D Damage Number & Niagara Impact
		if (UDasiDamageNumberSubsystem* DamageSubsystem = World->GetSubsystem<UDasiDamageNumberSubsystem>())
		{
			FVector SpawnLocation = FVector::ZeroVector;

			if (TargetActor)
			{
				SpawnLocation = TargetActor->GetActorLocation();
				if (TargetActor->GetClass()->ImplementsInterface(UDasiCombatInterface::StaticClass()))
				{
					SpawnLocation = IDasiCombatInterface::Execute_GetCombatHurtboxLocation(TargetActor);
				}
			}

			DamageSubsystem->SpawnDamageNumberFromNetwork(
				Response.Damage,
				Response.DamageType,
				SpawnLocation,
				Response.bIsMiss
			);
		}
	}

	// 2. Apply server-confirmed Hit-Stop & Stagger if target is present in client scene
	if (TargetActor && TargetActor->GetClass()->ImplementsInterface(UDasiCombatInterface::StaticClass()))
	{
		if (Response.HitStopMs > 0.0f)
		{
			const float Dilation = (Response.DamageType == TEXT("CRITICAL") || Response.DamageType == TEXT("EXCELLENT") || Response.DamageType == TEXT("IGNORE_DEFENSE"))
				? 0.0f
				: 0.05f;

			IDasiCombatInterface::Execute_ApplyHitStop(TargetActor, Response.HitStopMs / 1000.0f, Dilation);
		}

		if (Response.Knockback.SizeSquared() > 0.01f)
		{
			if (ACharacter* TargetChar = Cast<ACharacter>(TargetActor))
			{
				FVector LaunchVec = FVector(Response.Knockback.X, Response.Knockback.Y, 160.0f);
				TargetChar->LaunchCharacter(LaunchVec, true, true);
			}
		}
	}

	OnCombatResponseReceived.Broadcast(Response);
}

void UDasiNetworkBridge::RegisterEntity(const FString& EntityId, AActor* EntityActor)
{
	if (!EntityId.IsEmpty() && EntityActor)
	{
		EntityRegistry.Add(EntityId, EntityActor);
	}
}

void UDasiNetworkBridge::UnregisterEntity(const FString& EntityId)
{
	EntityRegistry.Remove(EntityId);
}

AActor* UDasiNetworkBridge::FindEntityById(const FString& EntityId) const
{
	if (const TWeakObjectPtr<AActor>* FoundPtr = EntityRegistry.Find(EntityId))
	{
		return FoundPtr->Get();
	}
	return nullptr;
}
