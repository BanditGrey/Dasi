// Copyright (c) 2026 Dasi MMORPG Project. All Rights Reserved.

#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "Network/DasiNetworkTypes.h"
#include "DasiGroundDropActor.generated.h"

class UStaticMeshComponent;
class UNiagaraComponent;
class UNiagaraSystem;
class UTextRenderComponent;
class USoundBase;

/**
 * Ator 3D de Item Caído no Solo (Ground Drop) de Lorencia
 * 100% 3D Nativo (as imagens clássicas 2D do MU servem apenas como referência visual de base).
 *
 * Características:
 * - Malha estática tridimensional física com física de quique 3D (Simulate Physics) e rotação suave.
 * - Feixe celestial Niagara volumétrico ("NS_JewelDropBeam") e som sagrado para joias (Bless, Soul, Chaos, Life).
 * - Placa de identificação (Nameplate) em espaço 3D com cores canônicas de raridade do Continent of Legend.
 * - Custom Depth Stencil (valor 252) quando hovered pelo cursor do mouse para outline dourado.
 * - Feedback audiovisual de partículas no recolhimento (Pickup).
 */
UCLASS()
class DASICLIENT_API ADasiGroundDropActor : public AActor
{
	GENERATED_BODY()

public:
	ADasiGroundDropActor();

	virtual void BeginPlay() override;
	virtual void Tick(float DeltaTime) override;

	// ==========================================
	// INICIALIZAÇÃO DE DADOS AUTORITATIVOS
	// ==========================================

	/**
	 * Configura o drop com os dados serializados vindos do servidor
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|World|Drop")
	void InitializeDrop(const FDasiGroundDropItem& InDropData);

	/**
	 * Ativa/desativa o contorno (outline) de seleção sob o cursor do mouse (Stencil 252)
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|World|Drop")
	void SetHovered(bool bInHovered);

	/**
	 * Executa animação e partículas de coleta ao ser recolhido pelo jogador
	 */
	UFUNCTION(BlueprintCallable, Category = "Dasi|World|Drop")
	void PlayPickupFeedback(AActor* CollectorActor = nullptr);

	UFUNCTION(BlueprintPure, Category = "Dasi|World|Drop")
	const FString& GetDropId() const { return DropId; }

	UFUNCTION(BlueprintPure, Category = "Dasi|World|Drop")
	bool IsJewel() const { return bIsJewel; }

	UFUNCTION(BlueprintPure, Category = "Dasi|World|Drop")
	bool IsExcellent() const { return bIsExcellent; }

	// ==========================================
	// COMPONENTES 3D
	// ==========================================

	/** Raiz do ator */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|World|Drop")
	TObjectPtr<USceneComponent> SceneRoot;

	/** Malha 3D física do item (Espada, Armadura, Joia, Pilha de Zen) */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|World|Drop")
	TObjectPtr<UStaticMeshComponent> DropMesh;

	/** Feixe de luz celestial vertical para Joias e Itens Sagrados */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|World|Drop")
	TObjectPtr<UNiagaraComponent> CelestialBeamComponent;

	/** Partículas de brilho ambiente ao redor do item */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|World|Drop")
	TObjectPtr<UNiagaraComponent> SparklesComponent;

	/** Texto 3D flutuante com o nome e raridade do item */
	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|World|Drop")
	TObjectPtr<UTextRenderComponent> NameplateComponent;

	// ==========================================
	// ASSETS AUDIOVISUAIS
	// ==========================================

	/** Sistema de partículas do feixe celestial de joias (NS_JewelDropBeam) */
	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Niagara")
	TObjectPtr<UNiagaraSystem> JewelDropBeamNiagara;

	/** Sistema de partículas acionado na coleta do item */
	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Niagara")
	TObjectPtr<UNiagaraSystem> PickupBurstNiagara;

	/** Som sagrado reproduzido quando uma joia cai no chão */
	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Audio")
	TObjectPtr<USoundBase> SacredJewelDropSound;

	/** Som padrão de queda de itens e armas */
	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Audio")
	TObjectPtr<USoundBase> ItemDropSound;

	/** Som de recolhimento de itens */
	UPROPERTY(EditDefaultsOnly, BlueprintReadWrite, Category = "Dasi|Feedback|Audio")
	TObjectPtr<USoundBase> PickupSound;

	// ==========================================
	// METADADOS DO DROP
	// ==========================================

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|World|Drop")
	FString DropId;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|World|Drop")
	bool bIsJewel = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|World|Drop")
	bool bIsExcellent = false;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|World|Drop")
	int64 ZenAmount = 0;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Dasi|World|Drop")
	FDasiItemInstance ItemInstance;

	// Configurações de física e animação
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|World|Drop")
	float HoverRotationSpeed = 85.0f; // Graus por segundo

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|World|Drop")
	float BobbingAmplitude = 5.0f; // Flutuação suave em cm

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Dasi|World|Drop")
	float BobbingFrequency = 2.5f;

protected:
	void SettlePhysics();
	void UpdateHoverAnimation(float DeltaTime);
	void UpdateNameplateBillboarding();
	void ApplyDefaultDropVisuals();

private:
	bool bIsHovered = false;
	bool bHasSettled = false;
	bool bIsBeingPickedUp = false;

	float SettleCheckTimer = 0.0f;
	float BaseRestingZ = 0.0f;
	float HoverTimeElapsed = 0.0f;
	float PickupAnimTimer = 0.0f;

	FTimerHandle PhysicsSettleTimerHandle;
};
