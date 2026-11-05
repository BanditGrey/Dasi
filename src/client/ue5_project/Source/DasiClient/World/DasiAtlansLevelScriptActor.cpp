// ============================================================================
// DASI MMORPG - UNREAL ENGINE 5 CLIENT
// DasiAtlansLevelScriptActor.cpp
// ============================================================================

#include "DasiAtlansLevelScriptActor.h"

ADasiAtlansLevelScriptActor::ADasiAtlansLevelScriptActor()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.TickInterval = 0.0333f;
}

void ADasiAtlansLevelScriptActor::BeginPlay()
{
	Super::BeginPlay();
	UE_LOG(LogTemp, Log, TEXT("[DasiAtlansLevel] Thalassa Submerged Ruins Inicializada. Profundidade de 0m a %.1fm"), DeepestAbyssMeters);
}

void ADasiAtlansLevelScriptActor::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

float ADasiAtlansLevelScriptActor::CalculateHydrostaticPressure(float CurrentAltitudeMeters) const
{
	// 1 atm na superfície + 0.1 atm por metro de descida subaquática
	const float Depth = FMath::Max(0.0f, -CurrentAltitudeMeters);
	return 1.0f + (Depth * 0.10f);
}

bool ADasiAtlansLevelScriptActor::IsInsideNacarBreathingDome(const FVector& WorldLocation) const
{
	const FVector DomeCenter(0.0f, 0.0f, 200.0f);
	return FVector::DistSquared(WorldLocation, DomeCenter) <= FMath::Square(600.0f);
}
