// ============================================================================
// DASI MMORPG - UNREAL ENGINE 5 CLIENT
// DasiNoriaLevelScriptActor.cpp
// ============================================================================

#include "DasiNoriaLevelScriptActor.h"
#include "Kismet/GameplayStatics.h"

ADasiNoriaLevelScriptActor::ADasiNoriaLevelScriptActor()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.TickInterval = 0.0333f; // 30 Hz
}

void ADasiNoriaLevelScriptActor::BeginPlay()
{
	Super::BeginPlay();
	UE_LOG(LogTemp, Log, TEXT("[DasiNoriaLevel] Feywood Arboretum Inicializado: %s"), *WorldExtentMeters.ToString());
}

void ADasiNoriaLevelScriptActor::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
	// Pulso orgânico da bioluminescência dos esporos e rotação da Máquina do Caos
}

void ADasiNoriaLevelScriptActor::TriggerChaosForgeCombination(bool bSuccess)
{
	if (bSuccess)
	{
		UE_LOG(LogTemp, Log, TEXT("[DasiNoriaLevel] Combinação da Máquina do Caos bem-sucedida! Feixe celestial disparado."));
	}
	else
	{
		UE_LOG(LogTemp, Warning, TEXT("[DasiNoriaLevel] Combinação do Caos falhou! Explosão de fuligem e cinzas."));
	}
}

bool ADasiNoriaLevelScriptActor::IsInSacredHealingSpring(const FVector& WorldLocation) const
{
	// Bacia do Altar da Rainha Élfica em Feywood (Raio de 4 metros)
	const FVector SpringCenter(850.0f, 500.0f, 85.0f);
	return FVector::DistSquared2D(WorldLocation, SpringCenter) <= FMath::Square(400.0f);
}
