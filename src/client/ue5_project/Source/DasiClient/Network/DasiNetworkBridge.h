#pragma once

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "Network/DasiNetworkProtocol.h"
#include "DasiNetworkBridge.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnDasiCombatResponseReceivedSignature, const FDasiNetCombatAttackRes&, Response);

/**
 * Game Instance Subsystem responsible for bridging Dasi Network Protocol
 * with UE5 Client Character, Combat Component, and Damage Number Subsystem.
 */
UCLASS()
class DASICLIENT_API UDasiNetworkBridge : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	UDasiNetworkBridge();

	// --- Serialization & Protocol ---
	UFUNCTION(BlueprintCallable, Category = "Dasi|Network")
	FString SerializeAttackRequest(const FDasiNetCombatAttackReq& Req);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network")
	bool DeserializeAttackResponse(const FString& JsonString, FDasiNetCombatAttackRes& OutRes);

	// --- Dispatch & Game World Reconciliation ---
	UFUNCTION(BlueprintCallable, Category = "Dasi|Network")
	void HandleCombatAttackResponse(const FDasiNetCombatAttackRes& Response);

	// --- Events ---
	UPROPERTY(BlueprintAssignable, Category = "Dasi|Network|Events")
	FOnDasiCombatResponseReceivedSignature OnCombatResponseReceived;

	// Entity lookup registry
	UFUNCTION(BlueprintCallable, Category = "Dasi|Network")
	void RegisterEntity(const FString& EntityId, AActor* EntityActor);

	UFUNCTION(BlueprintCallable, Category = "Dasi|Network")
	void UnregisterEntity(const FString& EntityId);

	UFUNCTION(BlueprintPure, Category = "Dasi|Network")
	AActor* FindEntityById(const FString& EntityId) const;

private:
	UPROPERTY()
	TMap<FString, TWeakObjectPtr<AActor>> EntityRegistry;
};
