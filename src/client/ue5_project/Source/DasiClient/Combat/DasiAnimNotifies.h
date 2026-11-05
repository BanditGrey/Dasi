#pragma once

#include "CoreMinimal.h"
#include "Animation/AnimNotifies/AnimNotifyState.h"
#include "Combat/DasiCombatComponent.h"
#include "Character/DasiCharacterBase.h"
#include "DasiAnimNotifies.generated.h"

/**
 * AnimNotifyState that delineates the active volumetric weapon trace collision window.
 * Placed on attack animation montages in UE5.
 */
UCLASS(meta = (DisplayName = "Dasi Active Weapon Trace"))
class DASICLIENT_API UDasiAnimNotifyState_WeaponTrace : public UAnimNotifyState
{
	GENERATED_BODY()

public:
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	FName AttackProfileName = TEXT("DefaultSlash");

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Combat")
	float InitialCleaveEnergy = 100.0f;

	virtual void NotifyBegin(USkeletalMeshComponent* MeshComp, UAnimSequenceBase* Animation, float TotalDuration, const FAnimNotifyEventReference& EventReference) override
	{
		Super::NotifyBegin(MeshComp, Animation, TotalDuration, EventReference);

		if (!MeshComp) return;
		if (ADasiCharacterBase* Character = Cast<ADasiCharacterBase>(MeshComp->GetOwner()))
		{
			if (UDasiCombatComponent* CombatComp = Character->GetCombatComponent())
			{
				CombatComp->BeginWeaponTrace(AttackProfileName, InitialCleaveEnergy);
			}
		}
	}

	virtual void NotifyEnd(USkeletalMeshComponent* MeshComp, UAnimSequenceBase* Animation, const FAnimNotifyEventReference& EventReference) override
	{
		Super::NotifyEnd(MeshComp, Animation, EventReference);

		if (!MeshComp) return;
		if (ADasiCharacterBase* Character = Cast<ADasiCharacterBase>(MeshComp->GetOwner()))
		{
			if (UDasiCombatComponent* CombatComp = Character->GetCombatComponent())
			{
				CombatComp->EndWeaponTrace();
			}
		}
	}
};

/**
 * AnimNotifyState that opens the combo chain cancellation window during recovery.
 * Allows buffering the next rhythmic combo strike with angular momentum carryover.
 */
UCLASS(meta = (DisplayName = "Dasi Combo Chain Window"))
class DASICLIENT_API UDasiAnimNotifyState_ComboWindow : public UAnimNotifyState
{
	GENERATED_BODY()

public:
	virtual void NotifyBegin(USkeletalMeshComponent* MeshComp, UAnimSequenceBase* Animation, float TotalDuration, const FAnimNotifyEventReference& EventReference) override
	{
		Super::NotifyBegin(MeshComp, Animation, TotalDuration, EventReference);

		if (!MeshComp) return;
		if (ADasiCharacterBase* Character = Cast<ADasiCharacterBase>(MeshComp->GetOwner()))
		{
			if (UDasiCombatComponent* CombatComp = Character->GetCombatComponent())
			{
				CombatComp->OnAnimNotify_ComboWindowOpen();
			}
		}
	}

	virtual void NotifyEnd(USkeletalMeshComponent* MeshComp, UAnimSequenceBase* Animation, const FAnimNotifyEventReference& EventReference) override
	{
		Super::NotifyEnd(MeshComp, Animation, EventReference);

		if (!MeshComp) return;
		if (ADasiCharacterBase* Character = Cast<ADasiCharacterBase>(MeshComp->GetOwner()))
		{
			if (UDasiCombatComponent* CombatComp = Character->GetCombatComponent())
			{
				CombatComp->OnAnimNotify_ComboWindowClose();
			}
		}
	}
};
