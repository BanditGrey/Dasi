// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "Network/DasiNetworkTypes.h"
#include "Character/DasiMonsterCharacter.h"
#include "World/DasiGroundDropActor.h"
#include "DasiWorldEntityManager.generated.h"

class UDasiNetworkSubsystem;

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnMonsterSpawned3D, ADasiMonsterCharacter*, Monster);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnMonsterDespawned3D, const FString&, MobId);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnGroundDropSpawned3D, ADasiGroundDropActor*, DropActor);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnGroundDropCollected3D, const FString&, DropId);

/**
 * Gerenciador de Spawns de Monstros e Drops no Mundo de Lorencia
 * Subsistema 3D nativo de Mundo (UTickableWorldSubsystem) no Unreal Engine 5.
 *
 * Responsabilidades:
 * - Ouve e responde aos delegates de rede do UDasiNetworkSubsystem.
 * - Converte as coordenadas autoritativas de 2D para o relevo tridimensional de Lorencia via UDasiCoordinateConverter.
 * - Instancia e sincroniza entidades 3D nativas (ADasiMonsterCharacter) para cada tipo de monstro (spider, hound, bull_fighter, skeleton).
 * - Spawna e gerencia itens no solo (ADasiGroundDropActor) com feixe celestial Niagara e som para joias.
 * - Integração de impacto de combate autoritativo com o UDasiDamageNumberSubsystem.
 */
UCLASS()
class DASICLIENT_API UDasiWorldEntityManager : public UTickableWorldSubsystem
{
	GENERATED_BODY()

public:
	UDasiWorldEntityManager();

	// ==========================================
	// CICLO DE VIDA DO SUBSISTEMA
	// ==========================================
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;
	virtual void Deinitialize() override;
	virtual void Tick(float DeltaTime) override;
	virtual TStatId GetStatId() const override;

	/** Helper estático para obter o gerenciador do mundo ativo */
	UFUNCTION(BlueprintPure, Category = "Dasi|World", meta = (WorldContext = "WorldContextObject"))
	static UDasiWorldEntityManager* Get(const UObject* WorldContextObject);

	// ==========================================
	// EVENTOS BLUEPRINT
	// ==========================================
	UPROPERTY(BlueprintAssignable, Category = "Dasi|World|Events")
	FOnMonsterSpawned3D OnMonsterSpawned;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|World|Events")
	FOnMonsterDespawned3D OnMonsterDespawned;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|World|Events")
	FOnGroundDropSpawned3D OnGroundDropSpawned;

	UPROPERTY(BlueprintAssignable, Category = "Dasi|World|Events")
	FOnGroundDropCollected3D OnGroundDropCollected;

	// ==========================================
	// CLASSES DE SPAWN CONFIGURÁVEIS
	// ==========================================
	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|World|Classes")
	TSubclassOf<ADasiMonsterCharacter> DefaultMonsterClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|World|Classes")
	TSubclassOf<ADasiMonsterCharacter> SpiderMonsterClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|World|Classes")
	TSubclassOf<ADasiMonsterCharacter> HoundMonsterClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|World|Classes")
	TSubclassOf<ADasiMonsterCharacter> BullFighterMonsterClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|World|Classes")
	TSubclassOf<ADasiMonsterCharacter> SkeletonMonsterClass;

	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|World|Classes")
	TSubclassOf<ADasiGroundDropActor> GroundDropClass;

	// ==========================================
	// CONSULTAS DE ENTIDADES NO MUNDO
	// ==========================================
	UFUNCTION(BlueprintPure, Category = "Dasi|World|Queries")
	ADasiMonsterCharacter* GetMonsterById(const FString& MobId) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|World|Queries")
	ADasiGroundDropActor* GetDropById(const FString& DropId) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|World|Queries")
	TArray<ADasiMonsterCharacter*> GetAllActiveMonsters() const;

	UFUNCTION(BlueprintPure, Category = "Dasi|World|Queries")
	TArray<ADasiGroundDropActor*> GetAllActiveDrops() const;

	UFUNCTION(BlueprintPure, Category = "Dasi|World|Queries")
	ADasiMonsterCharacter* FindClosestMonster(const FVector& Location, float MaxRadius = 2000.0f) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|World|Queries")
	ADasiGroundDropActor* FindClosestDrop(const FVector& Location, float MaxRadius = 1500.0f) const;

	UFUNCTION(BlueprintPure, Category = "Dasi|World|Queries")
	int32 GetActiveMonsterCount() const { return ActiveMonsters.Num(); }

	UFUNCTION(BlueprintPure, Category = "Dasi|World|Queries")
	int32 GetActiveDropCount() const { return ActiveDrops.Num(); }

protected:
	// ==========================================
	// HANDLERS DE DELEGATES DE REDE
	// ==========================================
	UFUNCTION()
	void HandleMonstersUpdated(const TArray<FDasiSerializedMonster>& Monsters);

	UFUNCTION()
	void HandleGroundDropsUpdated(const TArray<FDasiGroundDropItem>& Drops);

	UFUNCTION()
	void HandleGroundItemRemoved(const FString& DropId);

	UFUNCTION()
	void HandleCombatAttackResult(const FDasiCombatAttackResult& Result);

	TSubclassOf<ADasiMonsterCharacter> ResolveMonsterClassForType(const FString& InType) const;
	void BindToNetworkSubsystem();
	void UnbindFromNetworkSubsystem();

private:
	/** Monstros ativos indexados por ID autoritativo do servidor */
	UPROPERTY()
	TMap<FString, TWeakObjectPtr<ADasiMonsterCharacter>> ActiveMonsters;

	/** Drops no solo indexados por ID de drop autoritativo */
	UPROPERTY()
	TMap<FString, TWeakObjectPtr<ADasiGroundDropActor>> ActiveDrops;

	/** Referência ao subsistema de rede */
	UPROPERTY()
	TWeakObjectPtr<UDasiNetworkSubsystem> BoundNetworkSubsystem;

	bool bNetworkBound = false;
	float NetworkBindRetryTimer = 0.0f;
};
