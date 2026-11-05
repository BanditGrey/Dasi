// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "Blueprint/UserWidget.h"
#include "DasiMonsterHpWidget.generated.h"

class UProgressBar;
class UTextBlock;
class UBorder;

/**
 * Widget 3D World Space para Barra de Vida e Nome do Monstro
 * Exibido acima da cabeça do monstro no espaço 3D de Lorencia.
 * Possui interpolação suave de barra de vida, barra de dano fantasma ("ghost bar"),
 * e formatação de nome e nível clássicos do Continent of Legend.
 */
UCLASS()
class DASICLIENT_API UDasiMonsterHpWidget : public UUserWidget
{
	GENERATED_BODY()

public:
	UDasiMonsterHpWidget(const FObjectInitializer& ObjectInitializer);

	virtual void NativeConstruct() override;
	virtual void NativeTick(const FGeometry& MyGeometry, float InDeltaTime) override;

	/**
	 * Atualiza os valores autoritativos de HP recebidos do servidor
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Monster")
	void SetHealth(float InCurrentHp, float InMaxHp, bool bInstant = false);

	/**
	 * Configura nome e nível do monstro
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Monster")
	void SetMonsterMetadata(const FString& InName, int32 InLevel, const FString& InType = TEXT(""));

	/**
	 * Ativa/desativa destaque quando o monstro é alvo ativo
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|UI|Monster")
	void SetTargetHighlighted(bool bHighlighted);

	UFUNCTION(BlueprintPure, Category = "Dasi|UI|Monster")
	float GetCurrentHpPercent() const { return TargetPercent; }

protected:
	// Componentes UMG vinculados (se criados via Blueprint com BindWidget)
	UPROPERTY(meta = (BindWidgetOptional))
	TObjectPtr<UProgressBar> HealthProgressBar;

	UPROPERTY(meta = (BindWidgetOptional))
	TObjectPtr<UProgressBar> GhostProgressBar;

	UPROPERTY(meta = (BindWidgetOptional))
	TObjectPtr<UTextBlock> MonsterNameText;

	UPROPERTY(meta = (BindWidgetOptional))
	TObjectPtr<UTextBlock> MonsterLevelText;

	UPROPERTY(meta = (BindWidgetOptional))
	TObjectPtr<UBorder> OutlineBorder;

public:
	// Configurações de interpolação
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Interpolation")
	float HealthInterpSpeed = 10.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Interpolation")
	float GhostInterpSpeed = 3.5f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Visuals")
	FLinearColor NormalHpColor = FLinearColor(0.85f, 0.08f, 0.08f, 1.0f); // Vermelho clássico

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Visuals")
	FLinearColor HighlightHpColor = FLinearColor(1.0f, 0.85f, 0.1f, 1.0f); // Dourado quando alvejado

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|UI|Visuals")
	FLinearColor GhostHpColor = FLinearColor(1.0f, 1.0f, 1.0f, 0.7f); // Branco translúcido

private:
	float CurrentDisplayPercent = 1.0f;
	float GhostDisplayPercent = 1.0f;
	float TargetPercent = 1.0f;
	float GhostDelayTimer = 0.0f;

	FString MonsterName;
	int32 MonsterLevel = 1;
	bool bIsTargeted = false;
};
