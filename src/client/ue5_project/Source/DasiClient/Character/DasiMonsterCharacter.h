// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "Combat/DasiCombatInterface.h"
#include "Combat/DasiCombatTypes.h"
#include "Network/DasiNetworkTypes.h"
#include "DasiMonsterCharacter.generated.h"

class UWidgetComponent;
class UDasiMonsterHpWidget;
class UAnimMontage;
class UMaterialInstanceDynamic;

/**
 * Estados Visuais do Monstro no Mundo 3D
 */
UENUM(BlueprintType)
enum class EDasiMonsterVisualState : uint8
{
	Idle        UMETA(DisplayName = "Idle"),
	Walking     UMETA(DisplayName = "Walking / Stalking"),
	Attacking   UMETA(DisplayName = "Attacking"),
	Staggered   UMETA(DisplayName = "Staggered / Hit React"),
	Dead        UMETA(DisplayName = "Dead / Ragdoll")
};

/**
 * Entidade C++ de Monstro no Mundo 3D de Lorencia (100% 3D Nativo)
 * As imagens clássicas 2D do MU Online servem apenas como referência visual de base.
 *
 * Características:
 * - Subclasse de ACharacter com malha esquelética tridimensional, cápsula de colisão e física.
 * - WidgetComponent em World Space para barra de vida flutuante e metadados com billboarding para a câmera.
 * - Stencil Custom Depth (250) quando hovered pelo cursor do mouse para outline vermelho/dourado.
 * - Sincronização espacial autoritativa com interpolação suave (InterpSpeed = 12.0f).
 * - Máquina de estados visuais: Idle, Walking, Attacking, Staggered, Dead.
 * - Ragdoll físico 3D completo ao morrer e dissolução suave de carcaça após 4 segundos.
 */
UCLASS()
class DASICLIENT_API ADasiMonsterCharacter : public ACharacter, public IDasiCombatInterface
{
	GENERATED_BODY()

public:
	ADasiMonsterCharacter();

	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

	// ==========================================
	// IDasiCombatInterface IMPLEMENTATION
	// ==========================================
	virtual void TakeDasiDamage_Implementation(
		AActor* Attacker,
		float DamageAmount,
		EDasiDamageType DamageType,
		const FVector& HitLocation,
		const FVector& KnockbackVelocity,
		float StaggerDuration
	) override;

	virtual void ApplyHitStop_Implementation(float DurationSeconds, float CustomDilation) override;
	virtual float GetPoisePercent_Implementation() const override;
	virtual bool IsAlive_Implementation() const override;
	virtual FVector GetCombatHurtboxLocation_Implementation() const override;
	virtual FString GetEntityId_Implementation() const override;

	// ==========================================
	// SINCRONIZAÇÃO DE REDE AUTORITATIVA
	// ==========================================

	/**
	 * Atualiza a entidade com dados serializados vindos do servidor autoritativo
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Monster|Network")
	void UpdateFromSerialized(const FDasiSerializedMonster& MobData, const FVector& InWorldTargetLocation);

	/**
	 * Define o estado de foco do cursor do mouse (Custom Depth Stencil 250)
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Monster|Interaction")
	void SetHovered(bool bInHovered);

	/**
	 * Transição explícita de estado visual
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|Monster|VisualState")
	void SetVisualState(EDasiMonsterVisualState NewState);

	// ==========================================
	// COMPONENTES & VISUAIS 3D
	// ==========================================

	/** Componente de malha secundária para armas ou acessórios (ex: machado do Bull Fighter, escudo do Skeleton) */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Components")
	TObjectPtr<USkeletalMeshComponent> AccessoryMesh;

	/** Widget suspenso no espaço 3D para barra de vida e nome */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Components")
	TObjectPtr<UWidgetComponent> FloatingHpWidgetComponent;

	// ==========================================
	// CONFIGURAÇÕES DE INTERPOLAÇÃO & COMBATE
	// ==========================================

	/** Velocidade de interpolação de posição e rotação vinda do servidor */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Monster|Network")
	float InterpSpeed = 12.0f;

	/** Posição alvo 3D recebida do servidor */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Network")
	FVector TargetLocation = FVector::ZeroVector;

	/** Rotação alvo recebida ou calculada do movimento */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Network")
	FRotator TargetRotation = FRotator::ZeroRotator;

	/** Estado visual atual */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|VisualState")
	EDasiMonsterVisualState VisualState = EDasiMonsterVisualState::Idle;

	// Metadados do servidor
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Data")
	FString ServerMobId;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Data")
	FString MonsterType;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Data")
	FString MonsterName;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Data")
	int32 MonsterLevel = 1;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Data")
	float CurrentHp = 100.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Data")
	float MaxHp = 100.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Data")
	float CurrentPoise = 100.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Data")
	float MaxPoise = 100.0f;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|Monster|Data")
	bool bIsDead = false;

	// ==========================================
	// ANIMAÇÕES & VFX
	// ==========================================

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Monster|Animation")
	TObjectPtr<UAnimMontage> AttackMontage;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Monster|Animation")
	TObjectPtr<UAnimMontage> StaggerMontage;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Monster|Animation")
	TObjectPtr<UAnimMontage> DeathMontage;

	/** Tempo de permanência do corpo em ragdoll antes da dissolução */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Monster|Corpse")
	float CorpseDecayDelay = 4.0f;

	/** Duração da dissolução da carcaça */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Monster|Corpse")
	float DissolveDuration = 1.5f;

	/** Altura da barra de vida em relação ao solo */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|Monster|UI")
	float WidgetHeightOffset = 130.0f;

protected:
	void HandleDeath(const FVector& HitLocation, const FVector& KnockbackImpulse);
	void StartCorpseDissolution();
	void UpdateCorpseDissolution(float DeltaTime);
	void UpdateBillboardingRotation();
	void EndHitStop();
	void ApplyArchetypeVisualDefaults();

private:
	bool bIsHovered = false;
	bool bIsDissolving = false;
	float DissolveTimer = 0.0f;

	FTimerHandle CorpseDecayTimerHandle;
	FTimerHandle HitStopTimerHandle;
	FTimerHandle StaggerRecoveryTimerHandle;

	UPROPERTY()
	TArray<TObjectPtr<UMaterialInstanceDynamic>> DynamicMaterials;
};
