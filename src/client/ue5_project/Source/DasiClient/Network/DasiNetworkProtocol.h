#pragma once

#include "CoreMinimal.h"
#include "DasiNetworkProtocol.generated.h"

/**
 * Dasi Network Combat Request (Opcode 0x50, Subcode 0x01)
 */
USTRUCT(BlueprintType)
struct FDasiNetCombatAttackReq
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	FString TargetMobId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	FString SkillId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	float PlayerX = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	float PlayerY = 0.0f;
};

/**
 * Dasi Network Combat Response (Opcode 0x50, Subcode 0x02)
 */
USTRUCT(BlueprintType)
struct FDasiNetCombatAttackRes
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	bool bSuccess = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	FString AttackerId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	FString TargetId;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	bool bIsMiss = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	float Damage = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	FString DamageType = TEXT("NORMAL");

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	FString ColorHex = TEXT("#FFFFFF");

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	float TargetHp = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	float TargetMaxHp = 0.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	bool bIsDead = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	bool bStaggered = false;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	float HitStopMs = 40.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	FVector2D Knockback = FVector2D::ZeroVector;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Network")
	int32 XpGained = 0;
};
