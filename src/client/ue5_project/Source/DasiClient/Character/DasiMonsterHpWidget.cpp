// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#include "Character/DasiMonsterHpWidget.h"
#include "Components/ProgressBar.h"
#include "Components/TextBlock.h"
#include "Components/Border.h"

UDasiMonsterHpWidget::UDasiMonsterHpWidget(const FObjectInitializer& ObjectInitializer)
	: Super(ObjectInitializer)
	, HealthInterpSpeed(10.0f)
	, GhostInterpSpeed(3.5f)
	, CurrentDisplayPercent(1.0f)
	, GhostDisplayPercent(1.0f)
	, TargetPercent(1.0f)
	, GhostDelayTimer(0.0f)
	, MonsterLevel(1)
	, bIsTargeted(false)
{
}

void UDasiMonsterHpWidget::NativeConstruct()
{
	Super::NativeConstruct();

	if (HealthProgressBar)
	{
		HealthProgressBar->SetFillColorAndOpacity(NormalHpColor);
		HealthProgressBar->SetPercent(CurrentDisplayPercent);
	}

	if (GhostProgressBar)
	{
		GhostProgressBar->SetFillColorAndOpacity(GhostHpColor);
		GhostProgressBar->SetPercent(GhostDisplayPercent);
	}

	if (MonsterNameText && !MonsterName.IsEmpty())
	{
		MonsterNameText->SetText(FText::FromString(MonsterName));
	}

	if (MonsterLevelText)
	{
		MonsterLevelText->SetText(FText::FromString(FString::Printf(TEXT("Lv. %d"), MonsterLevel)));
	}
}

void UDasiMonsterHpWidget::NativeTick(const FGeometry& MyGeometry, float InDeltaTime)
{
	Super::NativeTick(MyGeometry, InDeltaTime);

	// Interpolação suave do HP principal
	if (!FMath::IsNearlyEqual(CurrentDisplayPercent, TargetPercent, 0.001f))
	{
		CurrentDisplayPercent = FMath::FInterpTo(CurrentDisplayPercent, TargetPercent, InDeltaTime, HealthInterpSpeed);
		if (HealthProgressBar)
		{
			HealthProgressBar->SetPercent(CurrentDisplayPercent);
		}
	}

	// Lógica da Ghost Bar (atraso de 0.25s antes de começar a diminuir)
	if (GhostDelayTimer > 0.0f)
	{
		GhostDelayTimer -= InDeltaTime;
	}
	else if (GhostDisplayPercent > CurrentDisplayPercent)
	{
		GhostDisplayPercent = FMath::FInterpTo(GhostDisplayPercent, CurrentDisplayPercent, InDeltaTime, GhostInterpSpeed);
		if (GhostProgressBar)
		{
			GhostProgressBar->SetPercent(GhostDisplayPercent);
		}
	}
	else
	{
		GhostDisplayPercent = CurrentDisplayPercent;
		if (GhostProgressBar)
		{
			GhostProgressBar->SetPercent(GhostDisplayPercent);
		}
	}
}

void UDasiMonsterHpWidget::SetHealth(float InCurrentHp, float InMaxHp, bool bInstant)
{
	const float SafeMax = FMath::Max(1.0f, InMaxHp);
	const float NewTarget = FMath::Clamp(InCurrentHp / SafeMax, 0.0f, 1.0f);

	if (NewTarget < TargetPercent)
	{
		// Dano recebido: aciona timer da barra fantasma
		GhostDelayTimer = 0.25f;
	}

	TargetPercent = NewTarget;

	if (bInstant)
	{
		CurrentDisplayPercent = TargetPercent;
		GhostDisplayPercent = TargetPercent;
		if (HealthProgressBar)
		{
			HealthProgressBar->SetPercent(CurrentDisplayPercent);
		}
		if (GhostProgressBar)
		{
			GhostProgressBar->SetPercent(GhostDisplayPercent);
		}
	}
}

void UDasiMonsterHpWidget::SetMonsterMetadata(const FString& InName, int32 InLevel, const FString& InType)
{
	MonsterName = InName;
	MonsterLevel = InLevel;

	if (MonsterNameText)
	{
		MonsterNameText->SetText(FText::FromString(MonsterName));
	}

	if (MonsterLevelText)
	{
		MonsterLevelText->SetText(FText::FromString(FString::Printf(TEXT("Lv. %d"), MonsterLevel)));
	}
}

void UDasiMonsterHpWidget::SetTargetHighlighted(bool bHighlighted)
{
	bIsTargeted = bHighlighted;

	if (HealthProgressBar)
	{
		HealthProgressBar->SetFillColorAndOpacity(bIsTargeted ? HighlightHpColor : NormalHpColor);
	}

	if (OutlineBorder)
	{
		OutlineBorder->SetBrushColor(bIsTargeted ? HighlightHpColor : FLinearColor(0.0f, 0.0f, 0.0f, 0.6f));
	}
}
