// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "World/DasiWorldEntityManager.h"
#include "World/DasiCoordinateConverter.h"
#include "World/DasiGroundDropActor.h"
#include "Character/DasiMonsterCharacter.h"
#include "Network/DasiNetworkSubsystem.h"
#include "Combat/DasiDamageNumberSubsystem.h"
#include "Combat/DasiCombatTypes.h"
#include "Combat/DasiCombatInterface.h"
#include "Engine/World.h"
#include "Engine/GameInstance.h"
#include "Engine/Engine.h"
#include "DasiClient.h"

UDasiWorldEntityManager::UDasiWorldEntityManager()
	: DefaultMonsterClass(ADasiMonsterCharacter::StaticClass())
	, GroundDropClass(ADasiGroundDropActor::StaticClass())
	, bNetworkBound(false)
	, NetworkBindRetryTimer(0.0f)
{
}

void UDasiWorldEntityManager::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);

	UE_LOG(LogDasiWorld, Log, TEXT("UDasiWorldEntityManager: Inicializado no mundo %s"), *GetWorld()->GetName());

	BindToNetworkSubsystem();
}

void UDasiWorldEntityManager::Deinitialize()
{
	UnbindFromNetworkSubsystem();

	// Destrói entidades restantes com segurança
	for (auto& Pair : ActiveMonsters)
	{
		if (Pair.Value.IsValid())
		{
			Pair.Value->Destroy();
		}
	}
	ActiveMonsters.Empty();

	for (auto& Pair : ActiveDrops)
	{
		if (Pair.Value.IsValid())
		{
			Pair.Value->Destroy();
		}
	}
	ActiveDrops.Empty();

	UE_LOG(LogDasiWorld, Log, TEXT("UDasiWorldEntityManager: Desinicializado. Todas as entidades foram liberadas."));

	Super::Deinitialize();
}

void UDasiWorldEntityManager::Tick(float DeltaTime)
{
	// Tenta reconectar aos delegates do UDasiNetworkSubsystem se ainda não estiver vinculado
	if (!bNetworkBound)
	{
		NetworkBindRetryTimer += DeltaTime;
		if (NetworkBindRetryTimer >= 1.0f)
		{
			NetworkBindRetryTimer = 0.0f;
			BindToNetworkSubsystem();
		}
	}

	// Limpeza periódica de ponteiros nulos ou inválidos
	for (auto It = ActiveMonsters.CreateIterator(); It; ++It)
	{
		if (!It.Value().IsValid())
		{
			It.RemoveCurrent();
		}
	}

	for (auto It = ActiveDrops.CreateIterator(); It; ++It)
	{
		if (!It.Value().IsValid())
		{
			It.RemoveCurrent();
		}
	}
}

TStatId UDasiWorldEntityManager::GetStatId() const
{
	RETURN_QUICK_DECLARE_CYCLE_STAT(UDasiWorldEntityManager, STATGROUP_Tickables);
}

UDasiWorldEntityManager* UDasiWorldEntityManager::Get(const UObject* WorldContextObject)
{
	if (!WorldContextObject) return nullptr;

	UWorld* World = GEngine->GetWorldFromContextObject(WorldContextObject, EGetWorldErrorMode::ReturnNull);
	return World ? World->GetSubsystem<UDasiWorldEntityManager>() : nullptr;
}

void UDasiWorldEntityManager::BindToNetworkSubsystem()
{
	UWorld* World = GetWorld();
	if (!World) return;

	UGameInstance* GI = World->GetGameInstance();
	if (!GI) return;

	UDasiNetworkSubsystem* NetSub = GI->GetSubsystem<UDasiNetworkSubsystem>();
	if (!NetSub) return;

	NetSub->OnMonstersUpdated.AddDynamic(this, &UDasiWorldEntityManager::HandleMonstersUpdated);
	NetSub->OnGroundDropsUpdated.AddDynamic(this, &UDasiWorldEntityManager::HandleGroundDropsUpdated);
	NetSub->OnGroundItemRemoved.AddDynamic(this, &UDasiWorldEntityManager::HandleGroundItemRemoved);
	NetSub->OnCombatAttackResult.AddDynamic(this, &UDasiWorldEntityManager::HandleCombatAttackResult);

	BoundNetworkSubsystem = NetSub;
	bNetworkBound = true;

	UE_LOG(LogDasiWorld, Log, TEXT("UDasiWorldEntityManager: Vinculado com sucesso aos delegates do UDasiNetworkSubsystem!"));
}

void UDasiWorldEntityManager::UnbindFromNetworkSubsystem()
{
	if (BoundNetworkSubsystem.IsValid())
	{
		BoundNetworkSubsystem->OnMonstersUpdated.RemoveDynamic(this, &UDasiWorldEntityManager::HandleMonstersUpdated);
		BoundNetworkSubsystem->OnGroundDropsUpdated.RemoveDynamic(this, &UDasiWorldEntityManager::HandleGroundDropsUpdated);
		BoundNetworkSubsystem->OnGroundItemRemoved.RemoveDynamic(this, &UDasiWorldEntityManager::HandleGroundItemRemoved);
		BoundNetworkSubsystem->OnCombatAttackResult.RemoveDynamic(this, &UDasiWorldEntityManager::HandleCombatAttackResult);
	}

	bNetworkBound = false;
	BoundNetworkSubsystem = nullptr;
}

void UDasiWorldEntityManager::HandleMonstersUpdated(const TArray<FDasiSerializedMonster>& Monsters)
{
	UWorld* World = GetWorld();
	if (!World) return;

	TSet<FString> UpdatedMobIds;

	for (const FDasiSerializedMonster& Mob : Monsters)
	{
		UpdatedMobIds.Add(Mob.Id);

		// Projeta coordenadas de destino no terreno 3D de Lorencia
		const FVector WorldTargetLoc = UDasiCoordinateConverter::ServerToWorld(this, Mob.TargetX, Mob.TargetY, 0.0f);

		// 1. Atualiza monstro existente
		if (ActiveMonsters.Contains(Mob.Id) && ActiveMonsters[Mob.Id].IsValid())
		{
			ADasiMonsterCharacter* ExistingMonster = ActiveMonsters[Mob.Id].Get();
			ExistingMonster->UpdateFromSerialized(Mob, WorldTargetLoc);
			continue;
		}

		// 2. Instancia novo monstro 3D nativo se ainda não existir
		const TSubclassOf<ADasiMonsterCharacter> MobClass = ResolveMonsterClassForType(Mob.Type);
		const FVector WorldSpawnLoc = UDasiCoordinateConverter::ServerToWorld(this, Mob.X, Mob.Y, 0.0f);

		FActorSpawnParameters SpawnParams;
		SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AdjustIfPossibleButAlwaysSpawn;

		ADasiMonsterCharacter* NewMonster = World->SpawnActor<ADasiMonsterCharacter>(MobClass, WorldSpawnLoc, FRotator::ZeroRotator, SpawnParams);
		if (NewMonster)
		{
			NewMonster->ServerMobId = Mob.Id;
			NewMonster->MonsterType = Mob.Type;
			NewMonster->MonsterName = Mob.Name;
			NewMonster->MonsterLevel = Mob.Level;
			NewMonster->CurrentHp = static_cast<float>(Mob.CurrentHp);
			NewMonster->MaxHp = static_cast<float>(Mob.MaxHp);

			NewMonster->UpdateFromSerialized(Mob, WorldTargetLoc);

			ActiveMonsters.Add(Mob.Id, NewMonster);
			OnMonsterSpawned.Broadcast(NewMonster);

			UE_LOG(LogDasiWorld, Log, TEXT("UDasiWorldEntityManager: Monstro 3D instanciado [%s] Tipo: %s Nível: %d em (%f, %f, %f)"),
				*Mob.Id, *Mob.Type, Mob.Level, WorldSpawnLoc.X, WorldSpawnLoc.Y, WorldSpawnLoc.Z);
		}
	}

	// Remove entidades que não estão mais presentes na lista do servidor
	for (auto It = ActiveMonsters.CreateIterator(); It; ++It)
	{
		if (!UpdatedMobIds.Contains(It.Key()))
		{
			if (It.Value().IsValid())
			{
				ADasiMonsterCharacter* MobToDespawn = It.Value().Get();
				// Se ainda estiver vivo, marca como morto para dissolver suavemente
				if (MobToDespawn->IsAlive_Implementation())
				{
					MobToDespawn->TakeDasiDamage_Implementation(nullptr, MobToDespawn->CurrentHp, EDasiDamageType::Normal, MobToDespawn->GetActorLocation(), FVector::ZeroVector, 0.0f);
				}
			}
			OnMonsterDespawned.Broadcast(It.Key());
			It.RemoveCurrent();
		}
	}
}

void UDasiWorldEntityManager::HandleGroundDropsUpdated(const TArray<FDasiGroundDropItem>& Drops)
{
	UWorld* World = GetWorld();
	if (!World) return;

	for (const FDasiGroundDropItem& Drop : Drops)
	{
		// Se já estiver spawnado, não duplica
		if (ActiveDrops.Contains(Drop.DropId) && ActiveDrops[Drop.DropId].IsValid())
		{
			continue;
		}

		// Converte coordenadas 2D do servidor para o mundo 3D (com elevação de 25cm para quique físico)
		const FVector WorldDropLoc = UDasiCoordinateConverter::ServerToWorld(this, Drop.X, Drop.Y, 25.0f);

		const TSubclassOf<ADasiGroundDropActor> SpawnClass = GroundDropClass ? GroundDropClass : ADasiGroundDropActor::StaticClass();

		FActorSpawnParameters SpawnParams;
		SpawnParams.SpawnCollisionHandlingOverride = ESpawnActorCollisionHandlingMethod::AlwaysSpawn;

		ADasiGroundDropActor* NewDropActor = World->SpawnActor<ADasiGroundDropActor>(SpawnClass, WorldDropLoc, FRotator::ZeroRotator, SpawnParams);
		if (NewDropActor)
		{
			NewDropActor->InitializeDrop(Drop);
			ActiveDrops.Add(Drop.DropId, NewDropActor);
			OnGroundDropSpawned.Broadcast(NewDropActor);

			UE_LOG(LogDasiWorld, Log, TEXT("UDasiWorldEntityManager: Drop 3D instanciado [%s] Joia: %s Excelente: %s Zen: %lld em (%f, %f, %f)"),
				*Drop.DropId,
				Drop.bIsJewel ? TEXT("SIM") : TEXT("NAO"),
				Drop.bIsExcellent ? TEXT("SIM") : TEXT("NAO"),
				Drop.Zen,
				WorldDropLoc.X, WorldDropLoc.Y, WorldDropLoc.Z
			);
		}
	}
}

void UDasiWorldEntityManager::HandleGroundItemRemoved(const FString& DropId)
{
	if (ActiveDrops.Contains(DropId))
	{
		if (ActiveDrops[DropId].IsValid())
		{
			ADasiGroundDropActor* DropActor = ActiveDrops[DropId].Get();
			DropActor->PlayPickupFeedback();
		}

		ActiveDrops.Remove(DropId);
		OnGroundDropCollected.Broadcast(DropId);

		UE_LOG(LogDasiWorld, Log, TEXT("UDasiWorldEntityManager: Item recolhido do chão: [%s]"), *DropId);
	}
}

void UDasiWorldEntityManager::HandleCombatAttackResult(const FDasiCombatAttackResult& Result)
{
	// Localiza o monstro atingido
	if (ActiveMonsters.Contains(Result.TargetId) && ActiveMonsters[Result.TargetId].IsValid())
	{
		ADasiMonsterCharacter* Monster = ActiveMonsters[Result.TargetId].Get();

		// Mapeia tipo de dano textual para enum nativo
		EDasiDamageType DmgType = EDasiDamageType::Normal;
		if (Result.DamageType.Equals(TEXT("SKILL"), ESearchCase::IgnoreCase))
		{
			DmgType = EDasiDamageType::Skill;
		}
		else if (Result.DamageType.Equals(TEXT("CRITICAL"), ESearchCase::IgnoreCase))
		{
			DmgType = EDasiDamageType::Critical;
		}
		else if (Result.DamageType.Equals(TEXT("EXCELLENT"), ESearchCase::IgnoreCase))
		{
			DmgType = EDasiDamageType::Excellent;
		}
		else if (Result.DamageType.Equals(TEXT("IGNORE_DEFENSE"), ESearchCase::IgnoreCase))
		{
			DmgType = EDasiDamageType::IgnoreDefense;
		}
		else if (Result.bIsMiss)
		{
			DmgType = EDasiDamageType::Miss;
		}

		// 1. Spawna número de dano 3D flutuante via UDasiDamageNumberSubsystem
		if (UWorld* World = GetWorld())
		{
			UDasiDamageNumberSubsystem* DmgSub = World->GetSubsystem<UDasiDamageNumberSubsystem>();
			if (DmgSub)
			{
				DmgSub->SpawnDamageNumberFromResult(Result, Monster->GetCombatHurtboxLocation());
			}
		}

		// 2. Aplica reação de dano física e Hit-Stop ao monstro
		const FVector KnockbackVec = FVector(Result.Knockback.X, Result.Knockback.Y, 0.0f) * 120.0f;
		IDasiCombatInterface::Execute_TakeDasiDamage(
			Monster,
			nullptr,
			static_cast<float>(Result.Damage),
			DmgType,
			Monster->GetCombatHurtboxLocation(),
			KnockbackVec,
			Result.bStaggered ? 0.45f : 0.0f
		);
	}

	// 3. Spawna drops gerados na morte do monstro (se vierem no pacote de ataque)
	if (Result.DropsGenerated.Num() > 0)
	{
		HandleGroundDropsUpdated(Result.DropsGenerated);
	}
}

TSubclassOf<ADasiMonsterCharacter> UDasiWorldEntityManager::ResolveMonsterClassForType(const FString& InType) const
{
	if (InType.Equals(TEXT("spider"), ESearchCase::IgnoreCase) && SpiderMonsterClass)
	{
		return SpiderMonsterClass;
	}
	if (InType.Equals(TEXT("hound"), ESearchCase::IgnoreCase) && HoundMonsterClass)
	{
		return HoundMonsterClass;
	}
	if (InType.Equals(TEXT("bull_fighter"), ESearchCase::IgnoreCase) && BullFighterMonsterClass)
	{
		return BullFighterMonsterClass;
	}
	if (InType.Equals(TEXT("skeleton"), ESearchCase::IgnoreCase) && SkeletonMonsterClass)
	{
		return SkeletonMonsterClass;
	}

	return DefaultMonsterClass ? DefaultMonsterClass : ADasiMonsterCharacter::StaticClass();
}

ADasiMonsterCharacter* UDasiWorldEntityManager::GetMonsterById(const FString& MobId) const
{
	if (ActiveMonsters.Contains(MobId) && ActiveMonsters[MobId].IsValid())
	{
		return ActiveMonsters[MobId].Get();
	}
	return nullptr;
}

ADasiGroundDropActor* UDasiWorldEntityManager::GetDropById(const FString& DropId) const
{
	if (ActiveDrops.Contains(DropId) && ActiveDrops[DropId].IsValid())
	{
		return ActiveDrops[DropId].Get();
	}
	return nullptr;
}

TArray<ADasiMonsterCharacter*> UDasiWorldEntityManager::GetAllActiveMonsters() const
{
	TArray<ADasiMonsterCharacter*> Result;
	for (const auto& Pair : ActiveMonsters)
	{
		if (Pair.Value.IsValid())
		{
			Result.Add(Pair.Value.Get());
		}
	}
	return Result;
}

TArray<ADasiGroundDropActor*> UDasiWorldEntityManager::GetAllActiveDrops() const
{
	TArray<ADasiGroundDropActor*> Result;
	for (const auto& Pair : ActiveDrops)
	{
		if (Pair.Value.IsValid())
		{
			Result.Add(Pair.Value.Get());
		}
	}
	return Result;
}

ADasiMonsterCharacter* UDasiWorldEntityManager::FindClosestMonster(const FVector& Location, float MaxRadius) const
{
	ADasiMonsterCharacter* ClosestMob = nullptr;
	float ClosestDistSq = FMath::Square(MaxRadius);

	for (const auto& Pair : ActiveMonsters)
	{
		if (Pair.Value.IsValid() && Pair.Value->IsAlive_Implementation())
		{
			const float DistSq = FVector::DistSquared2D(Location, Pair.Value->GetActorLocation());
			if (DistSq < ClosestDistSq)
			{
				ClosestDistSq = DistSq;
				ClosestMob = Pair.Value.Get();
			}
		}
	}

	return ClosestMob;
}

ADasiGroundDropActor* UDasiWorldEntityManager::FindClosestDrop(const FVector& Location, float MaxRadius) const
{
	ADasiGroundDropActor* ClosestDrop = nullptr;
	float ClosestDistSq = FMath::Square(MaxRadius);

	for (const auto& Pair : ActiveDrops)
	{
		if (Pair.Value.IsValid())
		{
			const float DistSq = FVector::DistSquared2D(Location, Pair.Value->GetActorLocation());
			if (DistSq < ClosestDistSq)
			{
				ClosestDistSq = DistSq;
				ClosestDrop = Pair.Value.Get();
			}
		}
	}

	return ClosestDrop;
}
