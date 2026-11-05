// ============================================================================
// DASI MMORPG - UNREAL ENGINE 5 CLIENT
// DasiIcarusLevelScriptActor.cpp
// ============================================================================

#include "DasiIcarusLevelScriptActor.h"

ADasiIcarusLevelScriptActor::ADasiIcarusLevelScriptActor()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.TickInterval = 0.0333f;
}

void ADasiIcarusLevelScriptActor::BeginPlay()
{
	Super::BeginPlay();
	UE_LOG(LogTemp, Log, TEXT("[DasiIcarusLevel] Aethel Archipelago Inicializado: Altitude de 1200m a %.1fm"), PhoenixNestAltitudeMeters);
}

void ADasiIcarusLevelScriptActor::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

bool ADasiIcarusLevelScriptActor::ValidateFlightEquipment(bool bHasWings, bool bHasDinorant) const
{
	// O acesso a Aethel exige asas ou montaria alada consagrada
	return bHasWings || bHasDinorant;
}

bool ADasiIcarusLevelScriptActor::IsOverVoid(const FVector& WorldLocation) const
{
	// Detecta se o ator está fora das ilhas sólidas sobre o abismo sem chão
	const float DistCenter = FVector::Dist2D(WorldLocation, FVector::ZeroVector);
	return DistCenter > 800.0f;
}
