// ============================================================================
// DASI MMORPG - UNREAL ENGINE 5 CLIENT
// DasiDeviasLevelScriptActor.cpp
// ============================================================================

#include "DasiDeviasLevelScriptActor.h"

ADasiDeviasLevelScriptActor::ADasiDeviasLevelScriptActor()
{
	PrimaryActorTick.bCanEverTick = true;
	PrimaryActorTick.TickInterval = 0.0333f;
}

void ADasiDeviasLevelScriptActor::BeginPlay()
{
	Super::BeginPlay();
	UE_LOG(LogTemp, Log, TEXT("[DasiDeviasLevel] Boreal Fortress Inicializada. Braseiro Rei ativo em %s"), *KingHearthLocation.ToString());
}

void ADasiDeviasLevelScriptActor::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

bool ADasiDeviasLevelScriptActor::IsInsideThermalDefrostZone(const FVector& WorldLocation) const
{
	const float RadiusCm = KingHearthThermalRadiusMeters * 100.0f;
	return FVector::DistSquared2D(WorldLocation, KingHearthLocation) <= FMath::Square(RadiusCm);
}

void ADasiDeviasLevelScriptActor::SetBlizzardIntensity(float NewIntensity)
{
	BlizzardIntensity = FMath::Clamp(NewIntensity, 0.0f, 1.0f);
	UE_LOG(LogTemp, Log, TEXT("[DasiDeviasLevel] Intensidade da nevasca ajustada para %.2f"), BlizzardIntensity);
}
